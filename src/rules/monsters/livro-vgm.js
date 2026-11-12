// GERADO por `src/dev/importar-bestiario.mjs vgm` — não edite à mão; mude o conversor ou o texto em
  // `src/dev/bestiario/vgm-pt.json` e rode de novo. Os números são os do livro (VGM, via o espelho do 5etools);
  // o texto é nosso, em pt-br. O que o motor ainda não faz está em `src/dev/bestiario/vgm-pendente.json`.
  
export const LIVRO_VGM = {
 "abjurador": {
  "id": "abjurador",
  "tipo": "humanoide",
  "name": "Abjurador",
  "nomeOriginal": "Abjurer",
  "fonte": "VGM",
  "size": "médio",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 9,
   "dex": 14,
   "con": 14,
   "int": 18,
   "wis": 12,
   "cha": 11
  },
  "ac": 12,
  "acNote": "15 com armadura arcana",
  "maxHp": 84,
  "hpDice": "13d8+26",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11
  },
  "saves": [
   "int",
   "wis"
  ],
  "skills": [
   "arcanismo",
   "historia"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Bordão",
    "bonus": 3,
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
   "ability": "int",
   "cantrips": [
    "protecaoContraLaminas",
    "luzesDancantes",
    "consertar",
    "mensagem",
    "raioDeGelo"
   ],
   "prepared": [
    "alarme",
    "armaduraArcana",
    "misselMagico",
    "escudoArcano",
    "invisibilidade",
    "contramagia",
    "dissiparMagia",
    "bolaDeFogo",
    "banimento",
    "peleDePedra",
    "coneDeFrio",
    "muralhaDeForca",
    "carneParaPedra",
    "globoDeInvulnerabilidade",
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
    "protecaoContraLaminas": 16,
    "luzesDancantes": 16,
    "consertar": 16,
    "mensagem": 16,
    "raioDeGelo": 16,
    "alarme": 16,
    "armaduraArcana": 16,
    "misselMagico": 16,
    "escudoArcano": 16,
    "invisibilidade": 16,
    "contramagia": 16,
    "dissiparMagia": 16,
    "bolaDeFogo": 16,
    "banimento": 16,
    "peleDePedra": 16,
    "coneDeFrio": 16,
    "muralhaDeForca": 16,
    "carneParaPedra": 16,
    "globoDeInvulnerabilidade": 16,
    "teletransporte": 16
   }
  },
  "protecaoArcana": 30,
  "traits": [
   "protecaoArcana"
  ],
  "blurb": "Mago defensivo que absorve dano com sua proteção arcana e a recarrega ao lançar abjurações; usa contramágica, banimento e muralha de energia para neutralizar ameaças enquanto ataca com bola de fogo e cone de frio.",
  "lore": "O abjurador é um mago especializado em magias de proteção, que só se sente tranquilo cercado por camadas de barreiras mágicas. Costuma viver em cidades, onde reis, nobres e mercadores ricos pagam bem por seus serviços. Ele protege mansões, cofres e tesouros com alarmes, trancas arcanas e glifos. Em combate, prefere anular a magia inimiga e se manter intocável a partir para o ataque direto."
 },
 "alhoon": {
  "id": "alhoon",
  "tipo": "morto-vivo",
  "name": "Alhoon",
  "nomeOriginal": "Alhoon",
  "fonte": "VGM",
  "size": "médio",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 11,
   "dex": 12,
   "con": 16,
   "int": 19,
   "wis": 17,
   "cha": 17
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 120,
  "hpDice": "16d8+48",
  "speedFt": 30,
  "senses": {
   "passivePerception": 17,
   "truesightFt": 120
  },
  "saves": [
   "con",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "enganacao",
   "historia",
   "intuicao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
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
    "name": "Toque Gélido",
    "bonus": 8,
    "damage": "3d6",
    "type": "frio",
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
    "dominarMonstro": 16,
    "viagemPlanar": 16,
    "detectarPensamentos": 16,
    "levitacao": 16
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Rajada Mental (Recarga 5–6)",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 60,
    "save": "int",
    "dc": 16,
    "damage": "4d8+4",
    "damageType": "psíquico",
    "halfOnSave": false,
    "condition": "atordoado",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [
   "resistenciaAMagia",
   "resisteExpulsar"
  ],
  "blurb": "Devorador de mentes morto-vivo e mago de 12º nível: atordoa grupos com sua Rajada Mental, conjura desintegrar, tentáculos negros e contramágica, e ignora armas não mágicas.",
  "lore": "Alhoons são devoradores de mentes que estudaram magia arcana, foram expulsos de suas colônias como desviantes e, sem lugar no cérebro ancião após a morte, buscaram um atalho para a imortalidade. Em grupos de pelo menos três, sacrificam almas num ritual de três dias para criar um periapto de aprisionamento mental, que lhes concede uma não-vida limitada ao tempo de vida que restava às vítimas. Com o tempo a pele seca e racha, a carne murcha e as órbitas vazias brilham com pontos de luz fria, como as de um lich. Vivem escondidos no Subterrâneo, protegendo com afinco o periapto, pois destruí-lo condena suas mentes ao esquecimento."
 },
 "bruxaAnnis": {
  "id": "bruxaAnnis",
  "tipo": "feérico",
  "name": "Bruxa Annis",
  "nomeOriginal": "Annis Hag",
  "fonte": "VGM",
  "size": "grande",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 21,
   "dex": 12,
   "con": 14,
   "int": 13,
   "wis": 14,
   "cha": 15
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 75,
  "hpDice": "10d10+20",
  "speedFt": 40,
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 60
  },
  "saves": [
   "con"
  ],
  "skills": [
   "enganacao",
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
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 8,
    "damage": "3d6+5",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garra",
    "bonus": 8,
    "damage": "3d6+5",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Abraço Esmagador",
    "bonus": 8,
    "damage": "9d6+5",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "9d6+5",
     "type": "concussão"
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
    "disfarcarSe",
    "nevoaObscurecente"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "disfarcarSe": 3,
    "nevoaObscurecente": 3
   },
   "cdPorMagia": {
    "disfarcarSe": 13,
    "nevoaObscurecente": 13
   }
  },
  "traits": [],
  "blurb": "Gigante e brutal, despedaça alvos com mordida e garras e esmaga quem agarra num abraço que causa 36 de dano por turno. Resiste a armas não mágicas e usa névoa para emboscar.",
  "lore": "A annis é uma bruxa feérica enorme, de força descomunal, que habita colinas e montanhas isoladas. Gosta de semear medo entre as comunidades próximas, disfarçando-se de pessoa comum para enganar e atrair vítimas. Prefere presas jovens e se diverte com o terror que provoca antes de atacar. Às vezes se une a outras bruxas num conciliábulo de três, ganhando acesso a magias compartilhadas poderosas."
 },
 "aprendizDeMago": {
  "id": "aprendizDeMago",
  "tipo": "humanoide",
  "name": "Aprendiz de Mago",
  "nomeOriginal": "Apprentice Wizard",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 10,
   "dex": 10,
   "con": 10,
   "int": 14,
   "wis": 10,
   "cha": 11
  },
  "ac": 10,
  "maxHp": 9,
  "hpDice": "2d8",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10
  },
  "saves": [],
  "skills": [
   "arcanismo",
   "historia"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Adaga",
    "bonus": 2,
    "damage": "1d4",
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
    "consertar",
    "prestidigitacao"
   ],
   "prepared": [
    "maosFlamejantes",
    "disfarcarSe",
    "escudoArcano"
   ],
   "slots": [
    0,
    2
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "raioDeFogo": 12,
    "consertar": 12,
    "prestidigitacao": 12,
    "maosFlamejantes": 12,
    "disfarcarSe": 12,
    "escudoArcano": 12
   }
  },
  "traits": [],
  "blurb": "Conjurador frágil que prefere atacar à distância com raio de fogo e queimar grupos próximos com mãos flamejantes. Usa escudo para se proteger, mas cai rápido se for alcançado.",
  "lore": "O aprendiz é um estudante de magia arcana ainda no começo da jornada. Costuma viver em cidades, ligado a uma academia ou a um mago mais experiente. Em troca das lições, faz tarefas domésticas como cozinhar, limpar e carregar livros. Em combate é inseguro e evita a linha de frente, confiando nos poucos feitiços que domina."
 },
 "arquidruida": {
  "id": "arquidruida",
  "tipo": "humanoide",
  "name": "Arquidruida",
  "nomeOriginal": "Archdruid",
  "fonte": "VGM",
  "size": "médio",
  "level": 9,
  "cr": "12",
  "xp": 8400,
  "abilities": {
   "str": 10,
   "dex": 14,
   "con": 12,
   "int": 12,
   "wis": 20,
   "cha": 11
  },
  "ac": 16,
  "acNote": "gibão de peles e escudo",
  "maxHp": 132,
  "hpDice": "24d8+24",
  "speedFt": 30,
  "senses": {
   "passivePerception": 19
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
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cimitarra",
    "bonus": 6,
    "damage": "1d6+2",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "wis",
   "cantrips": [
    "arteDruidica",
    "consertar",
    "borrifoVenenoso",
    "produzirChama"
   ],
   "prepared": [
    "curarFerimentos",
    "emaranhar",
    "fogoDasFadas",
    "falarComAnimais",
    "mensageiroAnimal",
    "sentidosDaFera",
    "imobilizarPessoa",
    "conjurarAnimais",
    "fundirSeComPedra",
    "respirarNaAgua",
    "dominarBesta",
    "localizarCriatura",
    "peleDePedra",
    "muralhaDeFogo",
    "comunhaoComANatureza",
    "curarFerimentosEmMassa",
    "curaTotal",
    "banqueteDeHerois",
    "raioSolar",
    "tempestadeDeFogo",
    "formasAnimais",
    "presciencia"
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
    "arteDruidica": 17,
    "consertar": 17,
    "borrifoVenenoso": 17,
    "produzirChama": 17,
    "curarFerimentos": 17,
    "emaranhar": 17,
    "fogoDasFadas": 17,
    "falarComAnimais": 17,
    "mensageiroAnimal": 17,
    "sentidosDaFera": 17,
    "imobilizarPessoa": 17,
    "conjurarAnimais": 17,
    "fundirSeComPedra": 17,
    "respirarNaAgua": 17,
    "dominarBesta": 17,
    "localizarCriatura": 17,
    "peleDePedra": 17,
    "muralhaDeFogo": 17,
    "comunhaoComANatureza": 17,
    "curarFerimentosEmMassa": 17,
    "curaTotal": 17,
    "banqueteDeHerois": 17,
    "raioSolar": 17,
    "tempestadeDeFogo": 17,
    "formasAnimais": 17,
    "presciencia": 17
   }
  },
  "traits": [
   "t_mudarDeForma"
  ],
  "blurb": "Conjurador de 18º nível baseado em Sabedoria (CD 17) que controla o campo com tempestade de fogo, raio de sol e muralha de fogo, cura aliados e pode assumir a forma de feras ou elementais poderosos.",
  "lore": "O arquidruida é o guardião das maravilhas naturais de uma região inteira. Evita cidades e povoados, e só se envolve com o mundo civilizado quando algo ameaça seriamente o equilíbrio da natureza. Costuma ter druidas aprendizes sob sua orientação. Seu refúgio, em florestas, montanhas ou pântanos, é protegido por feras leais e criaturas feéricas."
 },
 "arqueiro": {
  "id": "arqueiro",
  "tipo": "humanoide",
  "name": "Arqueiro",
  "nomeOriginal": "Archer",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 11,
   "dex": 18,
   "con": 16,
   "int": 11,
   "wis": 13,
   "cha": 10
  },
  "ac": 16,
  "acNote": "couro batido",
  "maxHp": 75,
  "hpDice": "10d8+30",
  "speedFt": 30,
  "senses": {
   "passivePerception": 15
  },
  "saves": [],
  "skills": [
   "acrobacia",
   "percepcao"
  ],
  "expertise": [
   "percepcao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espada Curta",
    "bonus": 6,
    "damage": "1d6+4",
    "type": "perfurante",
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
   "count": 2,
   "sequence": [
    "Arco Longo",
    "Arco Longo"
   ]
  },
  "traits": [
   "t_olhoDoArqueiro"
  ],
  "blurb": "Atirador que castiga de longe com dois disparos de arco longo por turno e, algumas vezes ao dia, reforça um tiro com precisão extra. Mantenha distância curta para pressioná-lo.",
  "lore": "Arqueiros são combatentes treinados no uso do arco, encontrados tanto em florestas quanto em cidades. Muitos guarnecem muralhas de castelos ou formam a linha de tiro de exércitos. Outros vivem da caça nas bordas das terras selvagens. Há ainda quem venda a pontaria como guarda de caravanas ou a use no banditismo."
 },
 "auroque": {
  "id": "auroque",
  "tipo": "fera",
  "name": "Auroque",
  "nomeOriginal": "Aurochs",
  "fonte": "VGM",
  "size": "grande",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 20,
   "dex": 10,
   "con": 19,
   "int": 2,
   "wis": 12,
   "cha": 5
  },
  "ac": 11,
  "acNote": "armadura natural",
  "maxHp": 38,
  "hpDice": "4d10+16",
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
    "name": "Chifrada",
    "bonus": 7,
    "damage": "2d8+5",
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
  "traits": [],
  "blurb": "Um touro gigantesco que dispara em linha reta e crava os chifres no alvo, podendo derrubá-lo no chão. Mantenha distância curta ou obstáculos entre você e ele para negar a investida.",
  "lore": "O auroque é um boi selvagem enorme e de chifres longos, encontrado em pradarias, colinas e montanhas. Entre os orcs, ele é associado a Bahgtru, o deus da força bruta, que segundo as lendas domou um desses animais com as próprias mãos e o usa como montaria de guerra. Tribos devotas criam auroques desde filhotes para servirem de montarias de combate. Esses bois são considerados sagrados: nenhum orc come sua carne, e quando morrem recebem honras de guerreiro."
 },
 "babau": {
  "id": "babau",
  "tipo": "corruptor",
  "name": "Babau",
  "nomeOriginal": "Babau",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 19,
   "dex": 16,
   "con": 16,
   "int": 11,
   "wis": 12,
   "cha": 13
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 82,
  "hpDice": "11d8+33",
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
    "name": "Garra",
    "bonus": 6,
    "damage": "1d8+4",
    "type": "cortante",
    "reachFt": 5
   },
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
   "count": 2
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [],
   "prepared": [
    "escuridao",
    "dissiparMagia",
    "medo",
    "calorNoMetal",
    "levitacao"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "aVontade": [
    "escuridao",
    "dissiparMagia",
    "medo",
    "calorNoMetal",
    "levitacao"
   ],
   "cdPorMagia": {
    "escuridao": 11,
    "dissiparMagia": 11,
    "medo": 11,
    "calorNoMetal": 11,
    "levitacao": 11
   }
  },
  "traits": [
   "t_olharDebilitante"
  ],
  "blurb": "Demônio furtivo que ataca com garras e lança enquanto seu olhar enfraquece os golpes de força dos inimigos. Conjura escuridão, medo e esquentar metal à vontade, desmontando grupos bem armados.",
  "lore": "O babau é um demônio magro e coberto de couro escuro, com um chifre curvo no alto da cabeça e um olhar que drena o vigor alheio. Vive nas sombras do Subterrâneo e nos becos de grandes cidades, onde caça com paciência de assassino. Costuma servir cultos demoníacos ou senhores do Abismo como batedor e matador. Prefere emboscar vítimas isoladas, cobrindo-se de escuridão mágica antes de atacar."
 },
 "banderhobb": {
  "id": "banderhobb",
  "tipo": "monstruosidade",
  "name": "Banderhobb",
  "nomeOriginal": "Banderhobb",
  "fonte": "VGM",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 20,
   "dex": 12,
   "con": 20,
   "int": 11,
   "wis": 14,
   "cha": 8
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 84,
  "hpDice": "8d10+40",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "atletismo",
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 8,
    "damage": "5d6+5",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "semResistencia": true,
     "dc": 15,
     "escape": 15,
     "condition": "contido",
     "note": "é agarrado"
    }
   },
   {
    "name": "Língua",
    "bonus": 8,
    "damage": "3d6",
    "type": "necrótico",
    "reachFt": 15
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Passo Sombrio",
    "tipo": "teleporte",
    "alcanceFt": 30
   }
  ],
  "traits": [
   "t_engolir",
   "t_conexaoRessonante",
   "furtividadeNasSombras"
  ],
  "blurb": "Emboscador sombrio que puxa vítimas com a língua a 4,5 m, prende com a mordida e engole criaturas inteiras. Teleporta-se entre sombras e se esconde como ação bônus na penumbra.",
  "lore": "O banderhobb é uma fusão de carne e sombra criada por ritual sombrio, com a forma de um sapo enorme que anda sobre duas pernas. Bruxas noturnas inventaram o processo, que hoje também é conhecido por alguns feéricos malignos, demônios e magos. Ele existe apenas alguns dias, servindo ao criador como capanga, ladrão ou sequestrador, sem se importar com o dano que sofre ou causa. Apesar do tamanho, move-se em silêncio e, com um objeto ligado ao alvo, rastreia-o a grande distância. Ao morrer, desfaz-se em gosma escura e fiapos de sombra."
 },
 "bardo": {
  "id": "bardo",
  "tipo": "humanoide",
  "name": "Bardo",
  "nomeOriginal": "Bard",
  "fonte": "VGM",
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
  "ac": 15,
  "acNote": "camisão de malha",
  "maxHp": 44,
  "hpDice": "8d8+8",
  "speedFt": 30,
  "senses": {
   "passivePerception": 15
  },
  "saves": [
   "dex",
   "wis"
  ],
  "skills": [
   "acrobacia",
   "percepcao",
   "atuacao"
  ],
  "expertise": [
   "percepcao",
   "atuacao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espada Curta",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "perfurante",
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
  "spellcasting": {
   "ability": "cha",
   "cantrips": [
    "amizade",
    "maoMagica",
    "zombariaViciosa"
   ],
   "prepared": [
    "enfeiticarPessoa",
    "palavraCurativa",
    "heroismo",
    "sono",
    "ondaTrovejante",
    "invisibilidade",
    "despedacar"
   ],
   "slots": [
    0,
    4,
    3
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "amizade": 12,
    "maoMagica": 12,
    "zombariaViciosa": 12,
    "enfeiticarPessoa": 12,
    "palavraCurativa": 12,
    "heroismo": 12,
    "sono": 12,
    "ondaTrovejante": 12,
    "invisibilidade": 12,
    "despedacar": 12
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Provocação (2/Dia)",
    "porDia": 2,
    "tipo": "alvo",
    "alcanceFt": 30,
    "save": "cha",
    "dc": 12,
    "condition": "escarnecido",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true,
    "bonus": true
   }
  ],
  "traits": [
   "t_cancaoDeDescanso",
   "t_provocacao2Dia"
  ],
  "blurb": "Apoia os aliados com magia de cura e heroísmo enquanto atrapalha os inimigos com zombarias, sono e ondas trovejantes. Sua Provocação pode deixar um alvo com desvantagem em quase tudo por um turno.",
  "lore": "Bardos são artistas itinerantes: poetas, contadores de histórias e músicos que vivem de estrada em estrada. Costumam aparecer em tavernas, nas cortes de mecenas ricos ou acompanhando grupos de aventureiros e mercenários. Lutam com lâmina leve e arco, mas sua verdadeira arma é a voz, capaz de encantar, ferir e inspirar. Podem pertencer a qualquer raça e ter qualquer índole."
 },
 "barghest": {
  "id": "barghest",
  "tipo": "corruptor",
  "name": "Barghest",
  "nomeOriginal": "Barghest",
  "fonte": "VGM",
  "size": "grande",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 19,
   "dex": 15,
   "con": 14,
   "int": 13,
   "wis": 12,
   "cha": 14
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 90,
  "hpDice": "12d10+24",
  "speedFt": 60,
  "senses": {
   "passivePerception": 15,
   "blindsightFt": 60,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "enganacao",
   "intimidacao",
   "percepcao",
   "furtividade"
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
   "ácido",
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "2d8+4",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 6,
    "damage": "1d8+4",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "enfeiticarPessoa",
    "dimensaoPorta",
    "sugestao",
    "levitacao",
    "ilusaoMenor",
    "passosSemPegadas"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "enfeiticarPessoa": 1,
    "dimensaoPorta": 1,
    "sugestao": 1
   },
   "aVontade": [
    "levitacao",
    "ilusaoMenor",
    "passosSemPegadas"
   ],
   "cdPorMagia": {
    "enfeiticarPessoa": 12,
    "dimensaoPorta": 12,
    "sugestao": 12,
    "levitacao": 12,
    "ilusaoMenor": 12,
    "passosSemPegadas": 12
   }
  },
  "traits": [
   "metamorfo",
   "t_banimentoPeloFogo",
   "keenSmell",
   "t_devorarAlmas"
  ],
  "blurb": "Cão infernal enorme que morde e dilacera com força, resiste a armas comuns e usa magia para enganar, enfeitiçar e se teleportar. Teme grandes fogueiras, que podem bani-lo para Geena.",
  "lore": "Os barghests nasceram de uma vingança: o General de Geena os criou depois que Maglubiyet, deus dos goblinoides, quebrou um pacto com ele. Eles nascem entre goblins, com aparência de goblin, e só depois descobrem sua verdadeira forma de cão demoníaco. Cada um precisa devorar dezessete almas goblinoides para voltar a Geena e servir nas legiões yugoloth, e prefere caçar chefes e indivíduos poderosos. Vivem disfarçados nas tribos até ficarem fortes, e quando são descobertos os goblins se rebaixam diante deles. Evitam fogueiras grandes, que funcionam como portais de volta ao plano de origem."
 },
 "bruxaBheur": {
  "id": "bruxaBheur",
  "tipo": "feérico",
  "name": "Bruxa Bheur",
  "nomeOriginal": "Bheur Hag",
  "fonte": "VGM",
  "size": "médio",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 13,
   "dex": 16,
   "con": 14,
   "int": 12,
   "wis": 13,
   "cha": 16
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 91,
  "hpDice": "14d8+28",
  "speedFt": 30,
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 60
  },
  "saves": [
   "wis"
  ],
  "skills": [
   "natureza",
   "percepcao",
   "furtividade",
   "sobrevivencia"
  ],
  "expertise": [],
  "damageImmunities": [
   "frio"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 4,
    "damage": "2d8+1",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d6",
     "type": "frio"
    }
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "coneDeFrio",
    "tempestadeDeGelo",
    "muralhaDeGelo",
    "imobilizarPessoa",
    "raioDeGelo"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "coneDeFrio": 3,
    "tempestadeDeGelo": 3,
    "muralhaDeGelo": 3
   },
   "aVontade": [
    "imobilizarPessoa",
    "raioDeGelo"
   ],
   "cdPorMagia": {
    "coneDeFrio": 14,
    "tempestadeDeGelo": 14,
    "muralhaDeGelo": 14,
    "imobilizarPessoa": 14,
    "raioDeGelo": 14
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Banquete Enlouquecedor",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 5,
    "save": "wis",
    "dc": 15,
    "condition": "amedrontado",
    "rounds": 10,
    "repete": true,
    "imunizaAoPassar": true
   }
  ],
  "traits": [
   "t_magiaDoCajadoCinzento",
   "t_andarNoGelo"
  ],
  "blurb": "Conjuradora gélida que voa em seu cajado cinzento lançando cone de frio, tempestade de gelo e paralisando inimigos. Ao devorar um inimigo recém-morto, pode enlouquecer de medo quem a vê.",
  "lore": "Bruxas feéricas das terras invernais, preferem montanhas cobertas de neve e ficam mais ativas no inverno. Têm pele azulada de cadáver congelado, corpo esquelético e olhos fundos cercados de carne arroxeada. Usam magia de gelo e clima para castigar vilarejos, semeando desespero até que os moradores se voltem uns contra os outros. Deleitam-se com atos egoístas justificados pelo frio e com o sofrimento de quem não se preparou para o inverno. Em um conciliábulo, seu ND sobe para 9."
 },
 "dracoDeGuardaNegro": {
  "id": "dracoDeGuardaNegro",
  "tipo": "dragão",
  "name": "Draco de Guarda Negro",
  "nomeOriginal": "Black Guard Drake",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 16,
   "dex": 11,
   "con": 16,
   "int": 4,
   "wis": 10,
   "cha": 7
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 52,
  "hpDice": "7d8+21",
  "speedFt": 30,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "ácido"
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
    "name": "Cauda",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2
  },
  "traits": [],
  "blurb": "Fera robusta que morde e golpeia com a cauda no mesmo turno, sem largar quem estiver guardando. Resiste a ácido e se move tão bem na água quanto em terra.",
  "lore": "Dracos de guarda são criaturas dracônicas criadas a partir de escamas de dragões verdadeiros e treinadas desde o ovo para vigiar e proteger. A variedade negra, feita com escamas de dragões negros, prefere pântanos e canais e costuma servir em cidades com docas ou esgotos alagados. Pouco inteligente, entende ordens em dracônico e obedece com lealdade feroz a quem a criou. É territorial e ataca intrusos sem hesitar."
 },
 "cavaleiroNegro": {
  "id": "cavaleiroNegro",
  "tipo": "humanoide",
  "name": "Cavaleiro Negro",
  "nomeOriginal": "Blackguard",
  "fonte": "VGM",
  "size": "médio",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 18,
   "dex": 11,
   "con": 18,
   "int": 11,
   "wis": 14,
   "cha": 15
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 153,
  "hpDice": "18d8+72",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12
  },
  "saves": [
   "wis",
   "cha"
  ],
  "skills": [
   "atletismo",
   "enganacao",
   "intimidacao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Glaive",
    "bonus": 7,
    "damage": "1d10+4",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Arco Curto",
    "bonus": 3,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 80,
    "longRangeFt": 320
   }
  ],
  "multiattack": {
   "count": 3,
   "sequencias": [
    [
     "Glaive",
     "Glaive",
     "Glaive"
    ],
    [
     "Arco Curto",
     "Arco Curto",
     "Arco Curto"
    ]
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "comando",
    "protecaoBemMal",
    "golpeTrovejante",
    "golpeMarcante",
    "encontrarMontaria",
    "golpeCegante",
    "dissiparMagia"
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
    "comando": 13,
    "protecaoBemMal": 13,
    "golpeTrovejante": 13,
    "golpeMarcante": 13,
    "encontrarMontaria": 13,
    "golpeCegante": 13,
    "dissiparMagia": 13
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Aspecto Aterrador",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 30,
    "save": "wis",
    "dc": 13,
    "condition": "amedrontado",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [],
  "blurb": "Guerreiro blindado que golpeia três vezes por turno com uma glaive de longo alcance e reforça os ataques com destruições divinas. Pode aterrorizar todos os inimigos próximos de uma só vez.",
  "lore": "Cavaleiros negros são antigos paladinos que traíram seus juramentos sagrados e passaram a servir apenas às próprias ambições sombrias. Desprezam tudo o que já defenderam e se aliam de bom grado a demônios e mortos-vivos. Costumam agir em cidades e nas profundezas do Subterrâneo, liderando bandos ou servindo a senhores malignos. Mantêm a disciplina marcial de outrora, mas a usam para oprimir e espalhar medo."
 },
 "dracoGuardiaoAzul": {
  "id": "dracoGuardiaoAzul",
  "tipo": "dragão",
  "name": "Draco Guardião Azul",
  "nomeOriginal": "Blue Guard Drake",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 16,
   "dex": 11,
   "con": 16,
   "int": 4,
   "wis": 10,
   "cha": 7
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 52,
  "hpDice": "7d8+21",
  "speedFt": 30,
  "speeds": {
   "burrowFt": 20
  },
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "elétrico"
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
    "name": "Cauda",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2
  },
  "traits": [],
  "blurb": "Fera robusta que morde e golpeia com a cauda no mesmo turno, segurando a linha de frente. Resiste a dano elétrico e pode escavar para surgir onde menos se espera.",
  "lore": "Dracos guardiões são criados por meio de rituais que usam escamas de dragões verdadeiros, dando origem a feras leais e sem asas. A variante azul herda a afinidade com raios e o gosto por cavar na areia, sendo comum em desertos e em cidades que precisam de vigias. Entende ordens dadas em dracônico, mas não fala. Obedece ao dono com fidelidade canina e ataca intrusos sem hesitar."
 },
 "bodak": {
  "id": "bodak",
  "tipo": "morto-vivo",
  "name": "Bodak",
  "nomeOriginal": "Bodak",
  "fonte": "VGM",
  "size": "médio",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 15,
   "dex": 16,
   "con": 15,
   "int": 7,
   "wis": 12,
   "cha": 12
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 58,
  "hpDice": "9d8+18",
  "speedFt": 30,
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
   "necrótico",
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
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Punho",
    "bonus": 5,
    "damage": "1d4+2",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d8",
     "type": "necrótico"
    }
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Olhar Definhante",
    "tipo": "alvo",
    "alcanceFt": 60,
    "save": "con",
    "dc": 13,
    "damage": "4d10",
    "damageType": "necrótico",
    "halfOnSave": true
   }
  ],
  "aura": {
   "raioFt": 30,
   "quando": "inicioDoAlvo",
   "save": "con",
   "dc": 13,
   "damage": "3d10",
   "damageType": "psíquico",
   "olhar": true
  },
  "traits": [
   "t_auraDeAniquilacao",
   "aura",
   "sunlightSensitivity"
  ],
  "blurb": "Morto-vivo de Orcus cujo olhar pode matar na hora quem o encara a até 9 m; sua aura corrói a vida de todos ao redor. Desviar os olhos protege, mas atrapalha os ataques contra ele.",
  "lore": "O bodak é o que resta de um devoto de Orcus que entalhou no peito o símbolo do príncipe demônio e teve corpo, mente e alma consumidos. Vaga como uma casca consciente que drena a vida próxima, caçando amigos e inimigos de sua existência anterior, poupando apenas servos de Orcus. O próprio Orcus enxerga e ouve através dele e pode até falar por sua boca. A luz do sol queima sua carne, animais fogem antes de sua chegada, e sua alma fica tão destruída que só um desejo pode trazê-lo de volta. Não precisa respirar, comer, beber nem dormir."
 },
 "boggle": {
  "id": "boggle",
  "tipo": "feérico",
  "name": "Boggle",
  "nomeOriginal": "Boggle",
  "fonte": "VGM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 8,
   "dex": 18,
   "con": 13,
   "int": 6,
   "wis": 12,
   "cha": 7
  },
  "ac": 14,
  "maxHp": 18,
  "hpDice": "4d6+4",
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
   "prestidigitacao",
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Socar",
    "bonus": 1,
    "damage": "1d6-1",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Poça de Óleo",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 5,
    "save": "dex",
    "dc": 11,
    "condition": "caido",
    "rounds": 100,
    "repete": false
   }
  ],
  "traits": [
   "t_oleoDeBoggle",
   "t_fendaDimensional",
   "t_olfatoAgucado"
  ],
  "blurb": "Pequena fada trapaceira que luta pouco e prefere atrapalhar: espalha poças de óleo que derrubam ou prendem os inimigos e abre fendas dimensionais para escapar ou atacar de longe.",
  "lore": "Boggles são os bichos-papões das histórias infantis, vindos das margens da Agrestia das Fadas. Surgem da solidão de alguém, aparecendo perto de uma criança abandonada, de um viúvo ou de um eremita, às vezes como uma espécie de amigo imaginário. Passam o tempo pregando peças mesquinhas, como esconder ferramentas, quebrar louça ou assustar o gado, mas buscam travessura, não destruição. Quando ameaçados, fogem em vez de lutar. Bruxas, fomorianos e bruxos ligados a arquifadas às vezes os usam como servos, embora sejam aliados pouco confiáveis."
 },
 "brontossauro": {
  "id": "brontossauro",
  "tipo": "fera",
  "name": "Brontossauro",
  "nomeOriginal": "Brontosaurus",
  "fonte": "VGM",
  "size": "imenso",
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
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 121,
  "hpDice": "9d20+27",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10
  },
  "saves": [
   "con"
  ],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Pisotear",
    "bonus": 8,
    "damage": "5d8+5",
    "type": "concussão",
    "reachFt": 20,
    "onHit": {
     "save": "str",
     "dc": 14,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   },
   {
    "name": "Cauda",
    "bonus": 8,
    "damage": "6d8+5",
    "type": "concussão",
    "reachFt": 20
   }
  ],
  "traits": [],
  "blurb": "Um colosso de pescoço longo que esmaga quem chega perto com patas e cauda, alcançando alvos a 6 m de distância. Suas pisadas derrubam os inimigos e a cauda causa dano enorme.",
  "lore": "O brontossauro é um dinossauro herbívoro gigantesco, de pescoço e cauda muito compridos. Vive em campos abertos e florestas, onde passa a maior parte do tempo pastando em manadas. Costuma ser pacífico, mas reage com violência quando se sente ameaçado ou quando alguém se aproxima de seus filhotes. Seu tamanho por si só já basta para afastar a maioria dos predadores."
 },
 "catoblepas": {
  "id": "catoblepas",
  "tipo": "monstruosidade",
  "name": "Catoblepas",
  "nomeOriginal": "Catoblepas",
  "fonte": "VGM",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 19,
   "dex": 12,
   "con": 21,
   "int": 3,
   "wis": 14,
   "cha": 8
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 84,
  "hpDice": "8d10+40",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cauda",
    "bonus": 7,
    "damage": "5d6+4",
    "type": "concussão",
    "reachFt": 10,
    "onHit": {
     "save": "con",
     "dc": 16,
     "condition": "atordoado",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Raio da Morte",
    "recharge": [
     5,
     6
    ],
    "tipo": "alvo",
    "alcanceFt": 30,
    "save": "con",
    "dc": 16,
    "damage": "8d8",
    "damageType": "necrótico",
    "halfOnSave": true
   }
  ],
  "aura": {
   "raioFt": 10,
   "quando": "inicioDoAlvo",
   "save": "con",
   "dc": 16,
   "condition": "envenenado",
   "imunizaAoPassar": true
  },
  "traits": [
   "keenSmell",
   "aura"
  ],
  "blurb": "Um brutamontes lento que envenena quem chega perto com seu fedor, atordoa com a clava da cauda e lança um olhar necrótico capaz de matar na hora. Evite ficar a até 3 m dele e espalhe o grupo contra o Raio da Morte.",
  "lore": "O catoblepas é uma fera pesada e disforme dos pântanos, que parece misturar búfalo, javali, hipopótamo e dinossauro. No dia a dia age como um animal comum, pastando, comendo carniça e chafurdando na lama, quase sempre ao lado do parceiro de toda a vida e às vezes de um filhote. Sua presença apodrece o pântano ao redor, sujando a água, atraindo criaturas degeneradas e deixando os animais doentes e agressivos. O povo o vê como presságio de desgraça, e há quem diga que bruxas o criam como gado e que cavaleiros sombrios o usam como montaria."
 },
 "pescadorDasCavernas": {
  "id": "pescadorDasCavernas",
  "tipo": "monstruosidade",
  "name": "Pescador das Cavernas",
  "nomeOriginal": "Cave Fisher",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 16,
   "dex": 13,
   "con": 14,
   "int": 3,
   "wis": 10,
   "cha": 3
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 58,
  "hpDice": "9d8+18",
  "speedFt": 20,
  "speeds": {
   "climbFt": 20
  },
  "senses": {
   "passivePerception": 12,
   "blindsightFt": 60
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
    "name": "Garra",
    "bonus": 5,
    "damage": "2d6+3",
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
  "acoesEspeciais": [
   {
    "nome": "Puxar Filamento",
    "tipo": "alvo",
    "alcanceFt": 15,
    "soAgarrado": true,
    "save": "str",
    "dc": 13,
    "condition": "agarrado",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "t_filamentoAdesivo",
   "t_sangueInflamavel",
   "spiderClimb"
  ],
  "blurb": "Fica escondido no teto e lança um filamento grudento de até 18 m para puxar a presa até as garras. Quando está ferido, o sangue inflamável o deixa vulnerável a fogo.",
  "lore": "Aracnídeo do Subterrâneo com um focinho comprido onde ficam as fiandeiras que produzem um fio pegajoso. Estende esse fio sobre passagens por onde transitam morcegos e pequenos animais, depois se esconde e espera alguém tropeçar na armadilha. Evita presas grandes, a menos que encontre um viajante isolado ou alguém que ficou para trás do grupo. Quando a comida falta, pode subir para cânions sombrios ou florestas escuras. Seu sangue alcoólico, a carne, a carapaça e os fios são valiosos, e algumas raças criam filhotes usando o medo do fogo para domá-los."
 },
 "campeao": {
  "id": "campeao",
  "tipo": "humanoide",
  "name": "Campeão",
  "nomeOriginal": "Champion",
  "fonte": "VGM",
  "size": "médio",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 20,
   "dex": 15,
   "con": 14,
   "int": 10,
   "wis": 14,
   "cha": 12
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 143,
  "hpDice": "22d8+44",
  "speedFt": 30,
  "senses": {
   "passivePerception": 16
  },
  "saves": [
   "str",
   "con"
  ],
  "skills": [
   "atletismo",
   "intimidacao",
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Montante",
    "bonus": 9,
    "damage": "2d6+5",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6",
     "type": "cortante"
    }
   },
   {
    "name": "Arco Curto",
    "bonus": 6,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 80,
    "longRangeFt": 320,
    "danoExtra": {
     "damage": "2d6",
     "type": "perfurante"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequencias": [
    [
     "Montante",
     "Montante",
     "Montante"
    ],
    [
     "Arco Curto",
     "Arco Curto",
     "Arco Curto"
    ]
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Retomar o Fôlego",
    "tipo": "cura",
    "dados": "20",
    "soEmSi": true,
    "bonus": true
   }
  ],
  "usosIndomavel": 2,
  "traits": [
   "indomavelMonstro",
   "t_retomarOFolego"
  ],
  "blurb": "Guerreiro veterano que desfere três golpes por turno com montante ou arco curto, causando dano extra enquanto estiver com mais da metade dos PV. Resiste a efeitos com rolagens repetidas e se recupera no meio da luta.",
  "lore": "Campeões são combatentes de elite forjados em campos de batalha ou em arenas de gladiadores. Entre mercenários, soldados e quem vive da espada, seu nome pesa tanto quanto o de um nobre. Governantes disputam seus serviços, pois ter um campeão ao lado é sinal de prestígio. Podem ser de qualquer povo e costumam ser vistos em cidades e regiões desérticas."
 },
 "quitine": {
  "id": "quitine",
  "tipo": "monstruosidade",
  "name": "Quitine",
  "nomeOriginal": "Chitine",
  "fonte": "VGM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 10,
   "dex": 14,
   "con": 12,
   "int": 10,
   "wis": 10,
   "cha": 7
  },
  "ac": 14,
  "acNote": "armadura de couro cru",
  "maxHp": 18,
  "hpDice": "4d6+4",
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
   "atletismo",
   "furtividade"
  ],
  "expertise": [
   "atletismo"
  ],
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
   "count": 3,
   "sequence": [
    "Adaga",
    "Adaga",
    "Adaga"
   ]
  },
  "traits": [
   "ascendenciaFeerica",
   "sunlightSensitivity",
   "webSense",
   "webWalker"
  ],
  "blurb": "Pequena e de muitos braços, a quitine ataca três vezes por turno com adagas, de perto ou arremessando-as, e se move pelas teias sem obstáculos. Sob a luz do sol perde boa parte da eficácia.",
  "lore": "Quitines são elfos deformados por rituais drow até ganharem corpo franzino, vários braços e traços de aranha. Criadas para servir aos drow, acabaram se rebelando sob a influência das choldriths, que as convenceram de que pertencem somente a Lolth. Vivem no Subterrâneo em colônias organizadas como formigueiros, com castas de operárias e guerreiras que dão a vida para proteger suas líderes. Fiam teia o tempo todo para erguer paredes, armadilhas e até armaduras, transformando seus territórios em labirintos escuros e traiçoeiros."
 },
 "choldrith": {
  "id": "choldrith",
  "tipo": "monstruosidade",
  "name": "Choldrith",
  "nomeOriginal": "Choldrith",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 12,
   "dex": 16,
   "con": 12,
   "int": 11,
   "wis": 14,
   "cha": 10
  },
  "ac": 15,
  "acNote": "couro batido",
  "maxHp": 66,
  "hpDice": "12d8+12",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "atletismo",
   "religiao",
   "furtividade"
  ],
  "expertise": [
   "atletismo"
  ],
  "conditionImmunities": [],
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
     "damage": "3d6",
     "type": "veneno"
    }
   },
   {
    "name": "Teia",
    "bonus": 5,
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
  "spellcasting": {
   "ability": "wis",
   "cantrips": [
    "orientacao",
    "consertar",
    "resistencia",
    "taumaturgia"
   ],
   "prepared": [
    "perdicao",
    "palavraCurativa",
    "santuario",
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
    "orientacao": 12,
    "consertar": 12,
    "resistencia": 12,
    "taumaturgia": 12,
    "perdicao": 12,
    "palavraCurativa": 12,
    "santuario": 12,
    "escudoDaFe": 12,
    "imobilizarPessoa": 12,
    "armaEspiritual": 12
   }
  },
  "traits": [
   "ascendenciaFeerica",
   "spiderClimb",
   "sunlightSensitivity",
   "webSense",
   "webWalker"
  ],
  "blurb": "Clériga aracnídea que prende alvos com teia, paralisa inimigos com magia e crava adagas envenenadas. Fica fraca sob a luz do sol.",
  "lore": "Os choldriths são crias híbridas de drow e aranha, criadas pelos chitines e vistas por eles como escolhidas da deusa das aranhas. Vivem no Subterrâneo, em colônias cheias de teias, onde conduzem os ritos e comandam seus parentes menores. Fanáticas e cruéis, preferem emboscar vindas do teto e usar orações para enfraquecer quem invade seus domínios."
 },
 "giganteDasNuvensSorridente": {
  "id": "giganteDasNuvensSorridente",
  "tipo": "gigante",
  "name": "Gigante das Nuvens Sorridente",
  "nomeOriginal": "Cloud Giant Smiling One",
  "fonte": "VGM",
  "size": "enorme",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 26,
   "dex": 12,
   "con": 22,
   "int": 15,
   "wis": 16,
   "cha": 17
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 262,
  "hpDice": "21d12+128",
  "speedFt": 40,
  "senses": {
   "passivePerception": 17
  },
  "saves": [
   "con",
   "int",
   "wis"
  ],
  "skills": [
   "enganacao",
   "intuicao",
   "percepcao",
   "prestidigitacao"
  ],
  "expertise": [
   "enganacao",
   "prestidigitacao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Maça-Estrela",
    "bonus": 12,
    "damage": "3d8+8",
    "type": "concussão",
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
    "Maça-Estrela",
    "Maça-Estrela"
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
   ],
   "cdPorMagia": {
    "quedaSuave": 15,
    "voo": 15,
    "passoNebuloso": 15,
    "telecinesia": 15,
    "formaGasosa": 15,
    "detectarMagia": 15,
    "nevoaObscurecente": 15,
    "luz": 15
   }
  },
  "traits": [
   "t_mudarDeForma",
   "keenSmell"
  ],
  "blurb": "Trapaceiro astuto que confunde os inimigos com ilusões, invisibilidade e magias de bardo antes de esmagá-los com a maça-estrela; quando ataca com vantagem, seus golpes causam muito mais dano.",
  "lore": "Os sorridentes são gigantes das nuvens que abraçam a malícia e a enganação como modo de vida. Usam uma máscara de duas faces e vivem nas montanhas e castelos flutuantes de sua gente, armando golpes e brincadeiras cruéis. Mudam de forma para se infiltrar entre povos menores e adoram blefar, roubar e manipular. São imprevisíveis: num momento riem, no outro atacam sem aviso."
 },
 "conjurador": {
  "id": "conjurador",
  "tipo": "humanoide",
  "name": "Conjurador",
  "nomeOriginal": "Conjurer",
  "fonte": "VGM",
  "size": "médio",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 9,
   "dex": 14,
   "con": 11,
   "int": 17,
   "wis": 12,
   "cha": 11
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
   "arcanismo",
   "historia"
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
    "respingoAcido",
    "maoMagica",
    "borrifoVenenoso",
    "prestidigitacao"
   ],
   "prepared": [
    "armaduraArcana",
    "misselMagico",
    "servoInvisivel",
    "nuvemDeAdagas",
    "passoNebuloso",
    "teia",
    "bolaDeFogo",
    "nuvemFetida",
    "tentaculosNegrosDeEvard",
    "peleDePedra",
    "nuvemMortal"
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
    "respingoAcido": 14,
    "maoMagica": 14,
    "borrifoVenenoso": 14,
    "prestidigitacao": 14,
    "armaduraArcana": 14,
    "misselMagico": 14,
    "servoInvisivel": 14,
    "nuvemDeAdagas": 14,
    "passoNebuloso": 14,
    "teia": 14,
    "bolaDeFogo": 14,
    "nuvemFetida": 14,
    "tentaculosNegrosDeEvard": 14,
    "peleDePedra": 14,
    "nuvemMortal": 14
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
   "t_transporteBenigno"
  ],
  "blurb": "Mago que controla o campo de batalha com teias, nuvens venenosas e tentáculos, além de invocar um elemental. Teleporta-se ou troca de lugar com aliados para escapar do corpo a corpo.",
  "lore": "Conjuradores são magos dedicados à escola de conjuração, capazes de trazer criaturas de outros planos e materializar objetos do nada. Costumam viver em cidades, servindo a quem paga ou perseguindo os próprios estudos. Alguns usam seus poderes para reforçar tropas e esmagar inimigos em batalha. Outros preferem deixar servos invocados vigiando seus covis enquanto estudam em paz."
 },
 "vacaVgm": {
  "id": "vacaVgm",
  "tipo": "fera",
  "name": "Vaca",
  "nomeOriginal": "Cow",
  "fonte": "VGM",
  "size": "grande",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 18,
   "dex": 10,
   "con": 14,
   "int": 2,
   "wis": 10,
   "cha": 4
  },
  "ac": 10,
  "maxHp": 15,
  "hpDice": "2d10+4",
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
    "name": "Chifrada",
    "bonus": 6,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "investida": {
     "pes": 20,
     "dano": "2d6",
     "tipo": "perfurante"
    }
   }
  ],
  "traits": [],
  "blurb": "Animal grande e forte que avança em linha reta para chifrar; uma investida de pelo menos 6 m aumenta bastante o dano do golpe.",
  "lore": "Gado comum criado em fazendas e campos abertos, de bois de tração a variedades raras tocadas pela magia. Costuma pastar tranquilo em rebanhos nas pradarias. Quando assustado ou provocado, porém, usa seu peso e seus chifres com força surpreendente. Viajantes e camponeses aprendem cedo a não ficar no caminho de um animal irritado."
 },
 "ratoCraniano": {
  "id": "ratoCraniano",
  "tipo": "fera",
  "name": "Rato Craniano",
  "nomeOriginal": "Cranium Rat",
  "fonte": "VGM",
  "size": "miúdo",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 2,
   "dex": 14,
   "con": 10,
   "int": 4,
   "wis": 11,
   "cha": 8
  },
  "ac": 12,
  "maxHp": 2,
  "hpDice": "1d4",
  "speedFt": 30,
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
    "damage": 1,
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [
   "t_iluminacao",
   "t_veuTelepatico"
  ],
  "blurb": "Sozinho, é só um rato frágil com uma mordida fraca; o perigo real está em quantos outros andam por perto, porque em bando eles somam mentes e despertam poderes psiônicos.",
  "lore": "Esses ratos nascem quando devoradores de mentes banham roedores comuns com energia psiônica, deixando o cérebro exposto e brilhante. Isolados, agem como qualquer rato e só transmitem emoções simples como fome e medo. Quando se juntam em enxame, fundem as mentes numa única consciência esperta, que fala de si como \"nós\" e manifesta poderes parecidos com magias. Colônias de illithids os soltam em cidades da superfície como espiões, repassando o que veem ao cérebro ancião quando estão ao alcance dele. Alguns escapam dessa rede e vivem por conta própria, sem que seus criadores se importem."
 },
 "sombrio": {
  "id": "sombrio",
  "tipo": "feérico",
  "name": "Sombrio",
  "nomeOriginal": "Darkling",
  "fonte": "VGM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 9,
   "dex": 16,
   "con": 12,
   "int": 10,
   "wis": 12,
   "cha": 10
  },
  "ac": 14,
  "acNote": "armadura de couro",
  "maxHp": 13,
  "hpDice": "3d6+3",
  "speedFt": 30,
  "senses": {
   "passivePerception": 15,
   "blindsightFt": 30,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "acrobacia",
   "enganacao",
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
    "name": "Adaga",
    "bonus": 5,
    "damage": "1d4+3",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60,
    "danoExtra": {
     "damage": "2d6",
     "type": "perfurante"
    }
   }
  ],
  "explosaoAoMorrer": {
   "pes": 5,
   "save": "con",
   "dc": 10,
   "condicao": "cego",
   "rounds": 1
  },
  "traits": [
   "explosaoAoMorrer",
   "sensibilidadeALuz"
  ],
  "blurb": "Pequeno feérico furtivo que ataca das sombras com adagas, causando dano extra quando tem vantagem. Ao morrer, explode num clarão que pode cegar quem estiver perto.",
  "lore": "Os sombrios são feéricos miúdos que foram expulsos da luz e passaram a viver escondidos na escuridão. Habitam o Subterrâneo, florestas fechadas, pântanos e até os becos de cidades, sempre longe do sol. Vivem em pequenos bandos, roubando e espionando para sobreviver. Cobrem-se com roupas escuras para esconder a pele, que reage mal à claridade."
 },
 "anciaoSombrio": {
  "id": "anciaoSombrio",
  "tipo": "feérico",
  "name": "Ancião Sombrio",
  "nomeOriginal": "Darkling Elder",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 13,
   "dex": 17,
   "con": 12,
   "int": 10,
   "wis": 14,
   "cha": 13
  },
  "ac": 15,
  "acNote": "couro batido",
  "maxHp": 27,
  "hpDice": "5d8+5",
  "speedFt": 30,
  "senses": {
   "passivePerception": 16,
   "blindsightFt": 30,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "acrobacia",
   "enganacao",
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
    "name": "Espada Curta",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d6",
     "type": "perfurante"
    }
   }
  ],
  "multiattack": {
   "count": 2
  },
  "explosaoAoMorrer": {
   "pes": 5,
   "save": "con",
   "dc": 11,
   "condicao": "cego",
   "rounds": 1,
   "dano": "2d6",
   "tipo": "radiante",
   "metade": false
  },
  "traits": [
   "t_escuridao",
   "explosaoAoMorrer"
  ],
  "blurb": "Ataca duas vezes com espada curta e causa muito dano extra quando tem vantagem, muitas vezes criando escuridão mágica para lutar às cegas. Ao morrer, explode em luz que queima e cega quem estiver perto.",
  "lore": "Os sombrios são feéricos amaldiçoados que evitam a luz, pois ela consome seus corpos. Os anciões são os membros mais velhos e experientes dessas comunidades, liderando grupos escondidos no Subterrâneo, em florestas densas, pântanos ou nos becos das cidades. Agem como ladrões e assassinos furtivos, preferindo emboscadas e a cobertura da escuridão. Quando morrem, o corpo se desfaz em cinzas num clarão de luz."
 },
 "beijoDaMorte": {
  "id": "beijoDaMorte",
  "tipo": "aberração",
  "name": "Beijo da Morte",
  "nomeOriginal": "Death Kiss",
  "fonte": "VGM",
  "size": "grande",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 18,
   "dex": 14,
   "con": 18,
   "int": 10,
   "wis": 12,
   "cha": 10
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 161,
  "hpDice": "17d10+68",
  "speedFt": 0,
  "flyFt": 30,
  "hover": true,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 15,
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
  "damageImmunities": [
   "elétrico"
  ],
  "conditionImmunities": [
   "caido"
  ],
  "attacks": [
   {
    "name": "Tentáculo",
    "bonus": 8,
    "damage": "3d6+4",
    "type": "perfurante",
    "reachFt": 20,
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
   "count": 3,
   "sequence": [
    "Tentáculo",
    "Tentáculo",
    "Tentáculo"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Dreno de Sangue",
    "tipo": "alvo",
    "alcanceFt": 15,
    "soAgarrado": true,
    "save": "con",
    "dc": 16,
    "damage": "4d10",
    "damageType": "elétrico",
    "halfOnSave": false,
    "condition": "agarrado",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "t_sangueEletrico"
  ],
  "blurb": "Flutua lançando dez tentáculos com 6 m de alcance que agarram e contêm as vítimas, depois drena o sangue delas em descargas elétricas para se curar. Golpear de perto com lâminas ou perfurações dá choque no atacante.",
  "lore": "Parente distante dos observadores, o beijo da morte é uma aberração flutuante de olho único cercada por longos tentáculos sanguessugas. Nasce dos pesadelos de um observador e vaga pelo Subterrâneo atrás de presas de sangue quente. Seu corpo converte o sangue sugado em eletricidade, que corre por suas veias. Costuma emboscar viajantes em cavernas amplas, prendendo vários de uma vez antes de esvaziá-los."
 },
 "rotheDasProfundezas": {
  "id": "rotheDasProfundezas",
  "tipo": "fera",
  "name": "Rothé das Profundezas",
  "nomeOriginal": "Deep Rothé",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 18,
   "dex": 10,
   "con": 14,
   "int": 2,
   "wis": 10,
   "cha": 4
  },
  "ac": 10,
  "maxHp": 13,
  "hpDice": "2d8+4",
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
    "name": "Chifrada",
    "bonus": 6,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "investida": {
     "pes": 20,
     "dano": "2d6",
     "tipo": "perfurante"
    }
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
  "traits": [],
  "blurb": "Investe em linha reta contra o alvo e o fura com os chifres, causando dano extra quando ganha embalo. Sozinho é fraco, mas em manada pode derrubar aventureiros desatentos.",
  "lore": "O rothé das profundezas é um parente subterrâneo do boi almiscarado da superfície, adaptado à escuridão do Subterrâneo. Vive em pequenas manadas que pastam fungos e liquens nas cavernas. Uma centelha mágica natural permite que ele crie pequenas luzes flutuantes, usadas para se orientar e se comunicar com o rebanho. Povos como os duergar e os drow costumam criá-lo como animal de carga e fonte de carne."
 },
 "rebentoDasProfundezas": {
  "id": "rebentoDasProfundezas",
  "tipo": "humanoide",
  "name": "Rebento das Profundezas",
  "nomeOriginal": "Deep Scion",
  "fonte": "VGM",
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
   "cha": 14
  },
  "ac": 11,
  "maxHp": 67,
  "hpDice": "9d8+27",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 120
  },
  "saves": [
   "wis",
   "cha"
  ],
  "skills": [
   "enganacao",
   "intuicao",
   "prestidigitacao",
   "furtividade"
  ],
  "expertise": [
   "enganacao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Machado de Batalha",
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
    "name": "Mordida",
    "bonus": 6,
    "damage": "1d4+4",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garra",
    "bonus": 6,
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
    "nome": "Grito Psíquico",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 30,
    "save": "wis",
    "dc": 13,
    "condition": "atordoado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "traits": [
   "metamorfo"
  ],
  "blurb": "Em forma humana golpeia duas vezes com um machado de batalha; na forma híbrida morde e arranha três vezes. Uma vez por descanso solta um grito psíquico que pode atordoar todos ao redor.",
  "lore": "Era uma pessoa comum, levada da costa ou resgatada de um naufrágio, a quem um poder submarino deu a escolha entre servir ou se afogar. Quem aceita passa por um ritual cruel que a torna metamorfa, capaz de assumir uma forma meio peixe. Volta à superfície como espiã de um senhor como um kraken, fingindo ser quem era ou adotando uma nova identidade para se infiltrar na vida dos alvos. Perdeu toda a empatia e só imita emoções, mas, se morrer na forma aquática, a magia se desfaz e resta apenas o cadáver da pessoa original."
 },
 "deinonico": {
  "id": "deinonico",
  "tipo": "fera",
  "name": "Deinonico",
  "nomeOriginal": "Deinonychus",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 15,
   "dex": 15,
   "con": 14,
   "int": 4,
   "wis": 12,
   "cha": 6
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 26,
  "hpDice": "4d8+8",
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
    "bonus": 4,
    "damage": "1d8+2",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garra",
    "bonus": 4,
    "damage": "1d8+2",
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
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "traits": [],
  "blurb": "Predador ágil que dispara contra a presa, derruba-a com as garras e morde enquanto ela está no chão. Sozinho causa três ataques por turno, e em bando é letal.",
  "lore": "O deinonico é um dinossauro carnívoro aparentado com o velocirraptor, porém maior e mais robusto. Habita campos, florestas e colinas, onde caça com velocidade e ferocidade. Sua tática é prender a vítima com as garras curvas e começar a devorá-la ainda viva. Não tem inteligência para negociar e age apenas por instinto de caça."
 },
 "devorador": {
  "id": "devorador",
  "tipo": "corruptor",
  "name": "Devorador",
  "nomeOriginal": "Devourer",
  "fonte": "VGM",
  "size": "grande",
  "level": 13,
  "cr": "13",
  "xp": 10000,
  "abilities": {
   "str": 20,
   "dex": 12,
   "con": 20,
   "int": 13,
   "wis": 10,
   "cha": 16
  },
  "ac": 16,
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
    "name": "Garra",
    "bonus": 10,
    "damage": "2d6+5",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "6d6",
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
  "breath": {
   "name": "Dilacerar Alma",
   "kind": "save",
   "shape": "sphere",
   "areaFt": 20,
   "save": "con",
   "dc": 18,
   "damage": "8d10",
   "damageType": "necrótico",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    6
   ]
  },
  "traits": [
   "t_aprisionarAlma"
  ],
  "blurb": "Rasga com garras que drenam vida e prende dentro da própria caixa torácica os humanoides caídos, transformando-os em mortos-vivos. Seu vórtice de energia necrótica fica mais letal a cada vítima moribunda por perto.",
  "lore": "Devoradores são demônios menores que Orcus recompensou, refazendo-os como figuras ressequidas de quase 2,5 m, com o peito oco e uma fome insaciável por almas. Vagam pelo Abismo e pelos planos Astral e Etéreo servindo aos planos do Príncipe dos Mortos-Vivos. No Plano Material, costumam liderar pragas de mortos-vivos, que se sentem atraídos por sua presença. Levam suas presas à beira da morte, prendem-nas entre as costelas e atormentam suas mentes até que morram e renasçam como servos mortos-vivos. Não precisam respirar, comer, beber nem dormir."
 },
 "dimetrodonte": {
  "id": "dimetrodonte",
  "tipo": "fera",
  "name": "Dimetrodonte",
  "nomeOriginal": "Dimetrodon",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 14,
   "dex": 10,
   "con": 15,
   "int": 2,
   "wis": 10,
   "cha": 5
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 19,
  "hpDice": "3d8+6",
  "speedFt": 30,
  "speeds": {
   "swimFt": 20
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
    "name": "Mordida",
    "bonus": 4,
    "damage": "2d6+2",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Réptil robusto que avança pela margem ou pela água rasa e crava os dentes na presa com uma mordida pesada. Sozinho é frágil, mas em grupo pode cercar quem se aproxima da água.",
  "lore": "O dimetrodonte é um réptil de porte médio com uma grande vela de pele esticada ao longo das costas. Costuma aparecer nas mesmas regiões habitadas por dinossauros, sobretudo em pântanos e litorais. Caça na beira da água e em lagoas rasas, esperando a presa chegar perto. Seu papel no ambiente lembra muito o de um crocodilo: um predador paciente e territorial."
 },
 "adivinho": {
  "id": "adivinho",
  "tipo": "humanoide",
  "name": "Adivinho",
  "nomeOriginal": "Diviner",
  "fonte": "VGM",
  "size": "médio",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 9,
   "dex": 14,
   "con": 11,
   "int": 18,
   "wis": 12,
   "cha": 11
  },
  "ac": 12,
  "acNote": "15 com armadura arcana",
  "maxHp": 67,
  "hpDice": "15d8",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11
  },
  "saves": [
   "int",
   "wis"
  ],
  "skills": [
   "arcanismo",
   "historia"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Bordão",
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
   "ability": "int",
   "cantrips": [
    "raioDeFogo",
    "luz",
    "maoMagica",
    "mensagem",
    "ataqueCerteiro"
   ],
   "prepared": [
    "detectarMagia",
    "quedaSuave",
    "armaduraArcana",
    "detectarPensamentos",
    "localizarObjeto",
    "raioArdente",
    "clarividencia",
    "voo",
    "bolaDeFogo",
    "olhoArcano",
    "tempestadeDeGelo",
    "peleDePedra",
    "vinculoTelepaticoDeRary",
    "aparenciaEnganosa",
    "sugestaoEmMassa",
    "visaoDaVerdade",
    "bolaDeFogoControlavel",
    "teletransporte",
    "labirinto"
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
    "raioDeFogo": 15,
    "luz": 15,
    "maoMagica": 15,
    "mensagem": 15,
    "ataqueCerteiro": 15,
    "detectarMagia": 15,
    "quedaSuave": 15,
    "armaduraArcana": 15,
    "detectarPensamentos": 15,
    "localizarObjeto": 15,
    "raioArdente": 15,
    "clarividencia": 15,
    "voo": 15,
    "bolaDeFogo": 15,
    "olhoArcano": 15,
    "tempestadeDeGelo": 15,
    "peleDePedra": 15,
    "vinculoTelepaticoDeRary": 15,
    "aparenciaEnganosa": 15,
    "sugestaoEmMassa": 15,
    "visaoDaVerdade": 15,
    "bolaDeFogoControlavel": 15,
    "teletransporte": 15,
    "labirinto": 15
   }
  },
  "traits": [
   "t_pressagio"
  ],
  "blurb": "Conjurador de 15º nível que bombardeia o grupo com bola de fogo, tempestade de gelo e labirinto, enquanto distorce a sorte com Presságio para trocar uma rolagem crucial de aliado ou inimigo.",
  "lore": "O adivinho é um mago especializado em revelar o oculto e acredita que quem sabe mais manda mais. Costuma circular por cidades, oferecendo conselhos, profecias ou segredos a quem lhe for útil. Alguns cultivam um ar enigmático, falando por meias palavras e presságios. Outros adoram exibir o que sabem, espalhando revelações para ganhar fama e influência."
 },
 "golfinho": {
  "id": "golfinho",
  "tipo": "fera",
  "name": "Golfinho",
  "nomeOriginal": "Dolphin",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 14,
   "dex": 13,
   "con": 13,
   "int": 6,
   "wis": 12,
   "cha": 7
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 11,
  "hpDice": "2d8+2",
  "speedFt": 0,
  "speeds": {
   "swimFt": 60
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
    "name": "Pancada",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "concussão",
    "reachFt": 5,
    "investida": {
     "pes": 30,
     "dano": "1d6",
     "tipo": "concussão"
    }
   }
  ],
  "traits": [],
  "blurb": "Nada em alta velocidade e acerta os inimigos com o focinho, causando dano extra quando ganha impulso numa investida. Percebe tudo ao redor pela visão às cegas debaixo d'água.",
  "lore": "Mamíferos marinhos espertos e sociáveis, os golfinhos vivem em grupos nos mares e nas costas. Caçam peixes pequenos e lulas. Um adulto mede de 1,5 a 1,8 m de comprimento. Precisam subir à superfície para respirar, mas aguentam muito tempo submersos."
 },
 "draegloth": {
  "id": "draegloth",
  "tipo": "corruptor",
  "name": "Draegloth",
  "nomeOriginal": "Draegloth",
  "fonte": "VGM",
  "size": "grande",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 20,
   "dex": 15,
   "con": 18,
   "int": 13,
   "wis": 11,
   "cha": 11
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 123,
  "hpDice": "13d10+52",
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
    "bonus": 8,
    "damage": "2d10+5",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 8,
    "damage": "2d10+5",
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
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "confusao",
    "luzesDancantes",
    "fogoDasFadas",
    "escuridao"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "confusao": 1,
    "luzesDancantes": 1,
    "fogoDasFadas": 1
   },
   "aVontade": [
    "escuridao"
   ],
   "cdPorMagia": {
    "confusao": 11,
    "luzesDancantes": 11,
    "fogoDasFadas": 11,
    "escuridao": 11
   }
  },
  "traits": [
   "ascendenciaFeerica"
  ],
  "blurb": "Brutamontes demoníaco de quatro braços que morde e rasga com garras de alcance longo, causando muito dano por turno. Usa escuridão, confusão e fogo das fadas para desorientar o grupo antes de avançar.",
  "lore": "O draegloth é fruto de um ritual profano em que uma alta sacerdotisa drow gera um filho com um demônio glabrezu. Do tamanho de um ogro, tem pele roxo-escura, cabelos claros, focinho canino, olhos vermelhos e dois pares de braços: um enorme e com garras, outro delicado como o de um drow. Seu nascimento é visto como bênção de Lolth, e a casa que o cria passa a planejar ataques às rivais com ele à frente. Embora valioso, nunca passa de escravo favorito ou consorte, e desconta a frustração nos inimigos da família; alguns acabam fugindo para seguir o próprio caminho no Subterrâneo."
 },
 "cerebroAnciao": {
  "id": "cerebroAnciao",
  "tipo": "aberração",
  "name": "Cérebro Ancião",
  "nomeOriginal": "Elder Brain",
  "fonte": "VGM",
  "size": "grande",
  "level": 13,
  "cr": "14",
  "xp": 11500,
  "abilities": {
   "str": 15,
   "dex": 10,
   "con": 20,
   "int": 21,
   "wis": 19,
   "cha": 24
  },
  "ac": 10,
  "maxHp": 210,
  "hpDice": "20d10+100",
  "speedFt": 5,
  "speeds": {
   "swimFt": 10
  },
  "senses": {
   "passivePerception": 14,
   "blindsightFt": 120
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
   "intimidacao",
   "persuasao"
  ],
  "expertise": [
   "intuicao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Tentáculo",
    "bonus": 7,
    "damage": "4d8+2",
    "type": "concussão",
    "reachFt": 30,
    "danoExtra": {
     "damage": "1d8+5",
     "type": "psíquico"
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
    "dominarMonstro": 18,
    "viagemPlanar": 18,
    "detectarPensamentos": 18,
    "levitacao": 18
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Tentáculo",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Tentáculo"
    }
   ]
  },
  "traits": [
   "t_explosaoMentalRecarga56",
   "t_eloPsiquico",
   "t_sentirPensamentos",
   "t_sentidoDeCriaturas",
   "resistenciaAMagia",
   "t_centralTelepatica",
   "acoesLendarias"
  ],
  "blurb": "Imóvel em seu tanque, agarra até quatro alvos com tentáculos de 9 m que queimam a mente e atordoa grupos inteiros com uma Explosão Mental. Quem fica incapacitado vira um elo psíquico que ele explora com ações lendárias.",
  "lore": "O cérebro ancião é o núcleo de uma colônia de devoradores de mentes, flutuando em uma piscina de salmoura carregada de energia psiônica no coração da cidade illithid. Ele conecta todos os devoradores como se fossem dedos de uma só mão e absorve o cérebro de cada um que morre, acumulando suas memórias e personalidades. Alimenta-se de cérebros, atraindo vítimas com sugestões sutis, sonhos manipulados ou dominação direta. Cada um tem personalidade própria, de tirano a conselheiro sábio, mas todos se julgam o centro do multiverso. Fora de sua salmoura morre rápido, o que o torna quase imóvel."
 },
 "encantador": {
  "id": "encantador",
  "tipo": "humanoide",
  "name": "Encantador",
  "nomeOriginal": "Enchanter",
  "fonte": "VGM",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 9,
   "dex": 14,
   "con": 11,
   "int": 17,
   "wis": 12,
   "cha": 11
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
   "arcanismo",
   "historia"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Bordão",
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
   "ability": "int",
   "cantrips": [
    "amizade",
    "maoMagica",
    "consertar",
    "mensagem"
   ],
   "prepared": [
    "enfeiticarPessoa",
    "armaduraArcana",
    "misselMagico",
    "imobilizarPessoa",
    "invisibilidade",
    "sugestao",
    "bolaDeFogo",
    "velocidade",
    "linguas",
    "dominarBesta",
    "peleDePedra",
    "imobilizarMonstro"
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
    "amizade": 14,
    "maoMagica": 14,
    "consertar": 14,
    "mensagem": 14,
    "enfeiticarPessoa": 14,
    "armaduraArcana": 14,
    "misselMagico": 14,
    "imobilizarPessoa": 14,
    "invisibilidade": 14,
    "sugestao": 14,
    "bolaDeFogo": 14,
    "velocidade": 14,
    "linguas": 14,
    "dominarBesta": 14,
    "peleDePedra": 14,
    "imobilizarMonstro": 14
   }
  },
  "traits": [
   "t_encantoInstintivo"
  ],
  "blurb": "Mago frágil que luta por meio de outros: paralisa, enfeitiça e domina inimigos, e ainda desvia ataques contra si para aliados do atacante. Também conta com bola de fogo e acelerar.",
  "lore": "O encantador é um mago especializado em magias que moldam e dominam a mente alheia. Costuma circular por cidades, onde há muita gente para influenciar. Alguns são simpáticos e só recorrem à magia quando a conversa não basta. Outros são arrogantes e se cercam de servos enfeitiçados que obedecem sem questionar."
 },
 "evocador": {
  "id": "evocador",
  "tipo": "humanoide",
  "name": "Evocador",
  "nomeOriginal": "Evoker",
  "fonte": "VGM",
  "size": "médio",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 9,
   "dex": 14,
   "con": 12,
   "int": 17,
   "wis": 12,
   "cha": 11
  },
  "ac": 12,
  "acNote": "15 com armadura arcana",
  "maxHp": 66,
  "hpDice": "12d8+12",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11
  },
  "saves": [
   "int",
   "wis"
  ],
  "skills": [
   "arcanismo",
   "historia"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Bordão",
    "bonus": 3,
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
   "ability": "int",
   "cantrips": [
    "raioDeFogo",
    "luz",
    "prestidigitacao",
    "raioDeGelo"
   ],
   "prepared": [
    "maosFlamejantes",
    "armaduraArcana",
    "misselMagico",
    "imagemEspelhada",
    "passoNebuloso",
    "despedacar",
    "contramagia",
    "bolaDeFogo",
    "relampago",
    "tempestadeDeGelo",
    "peleDePedra",
    "maoDeBigby",
    "coneDeFrio",
    "correnteDeRelampagos",
    "muralhaDeGelo"
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
    "raioDeFogo": 15,
    "luz": 15,
    "prestidigitacao": 15,
    "raioDeGelo": 15,
    "maosFlamejantes": 15,
    "armaduraArcana": 15,
    "misselMagico": 15,
    "imagemEspelhada": 15,
    "passoNebuloso": 15,
    "despedacar": 15,
    "contramagia": 15,
    "bolaDeFogo": 15,
    "relampago": 15,
    "tempestadeDeGelo": 15,
    "peleDePedra": 15,
    "maoDeBigby": 15,
    "coneDeFrio": 15,
    "correnteDeRelampagos": 15,
    "muralhaDeGelo": 15
   }
  },
  "traits": [
   "t_esculpirMagias"
  ],
  "blurb": "Mago de artilharia que despeja bolas de fogo, relâmpagos e cones de frio à distância, poupando os aliados presos na área. Pode anular magias inimigas com contramágica e escapar com passo nebuloso.",
  "lore": "Evocadores são magos especializados em canalizar energia arcana e forças elementais com fins destrutivos. Muitos têm pavio curto e partem para o ataque sem hesitar. Outros são frios e calculistas, guardando o golpe certo para o instante em que o inimigo se expõe. Costumam ser encontrados em cidades, a serviço de guildas, governantes ou de suas próprias ambições."
 },
 "couracadoGiganteDoFogo": {
  "id": "couracadoGiganteDoFogo",
  "tipo": "gigante",
  "name": "Couraçado Gigante do Fogo",
  "nomeOriginal": "Fire Giant Dreadnought",
  "fonte": "VGM",
  "size": "enorme",
  "level": 13,
  "cr": "14",
  "xp": 11500,
  "abilities": {
   "str": 27,
   "dex": 9,
   "con": 23,
   "int": 8,
   "wis": 10,
   "cha": 11
  },
  "ac": 21,
  "acNote": "armadura de placas e dois escudos",
  "maxHp": 187,
  "hpDice": "15d12+90",
  "speedFt": 30,
  "senses": {
   "passivePerception": 15
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
    "name": "Escudo Flamejante",
    "bonus": 13,
    "damage": "4d6+8",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6",
     "type": "fogo"
    }
   },
   {
    "name": "Pedra",
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
   "sequence": [
    "Escudo Flamejante",
    "Escudo Flamejante"
   ]
  },
  "traits": [
   "t_investidaDeEscudo",
   "t_escudosDuplos"
  ],
  "blurb": "Muralha viva de aço em brasa que golpeia duas vezes com escudos cravejados e flamejantes. Sua investida atravessa fileiras inteiras, empurrando e derrubando quem estiver no caminho.",
  "lore": "Entre os gigantes do fogo, a posição no ordning depende tanto da força quanto do talento na forja, e quem tem músculos mas pouco engenho costuma acabar em trabalhos braçais. Os mais fortes, porém, podem ganhar prestígio como couraçados. Eles carregam dois escudos imensos, cheios de espinhos por fora e de carvão em brasa por dentro, formando uma parede de fogo diante dos inimigos. Fora do combate, mantêm a forma empurrando montanhas de minério e carvão pelas fundições, e às vezes escoltam comitivas de guerra ou diplomacia para intimidar."
 },
 "bruxoDeImixSalamandraDeFogo": {
  "id": "bruxoDeImixSalamandraDeFogo",
  "tipo": "humanoide",
  "name": "Bruxo de Imix Salamandra-de-Fogo",
  "nomeOriginal": "Firenewt Warlock of Imix",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 13,
   "dex": 11,
   "con": 12,
   "int": 9,
   "wis": 11,
   "cha": 14
  },
  "ac": 10,
  "acNote": "13 com armadura arcana",
  "maxHp": 33,
  "hpDice": "6d8+6",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 120
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
    "name": "Maça-Estrela",
    "bonus": 3,
    "damage": "1d8+1",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "armaduraArcana"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "aVontade": [
    "armaduraArcana"
   ]
  },
  "traits": [
   "t_bencaoDeImix"
  ],
  "blurb": "Conjurador de fogo que alterna raios ígneos, mãos flamejantes e esferas de chamas com golpes de maça-estrela; ganha PV temporários ao derrubar inimigos.",
  "lore": "Salamandras-de-fogo são humanoides anfíbios que vivem perto de fontes termais, vulcões e cavernas aquecidas do Subterrâneo. Alguns fazem pacto com Imix, o Príncipe do Fogo Elemental Maligno, e recebem dele magia destrutiva. Esses bruxos lideram bandos guerreiros, conduzem ritos em águas ferventes e enxergam até através da escuridão mágica. São fanáticos e tratam a destruição pelas chamas como oferenda ao seu patrono."
 },
 "guerreiroSalamandraDeFogo": {
  "id": "guerreiroSalamandraDeFogo",
  "tipo": "humanoide",
  "name": "Guerreiro Salamandra-de-Fogo",
  "nomeOriginal": "Firenewt Warrior",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 10,
   "dex": 13,
   "con": 12,
   "int": 7,
   "wis": 11,
   "cha": 8
  },
  "ac": 16,
  "acNote": "camisão de malha e escudo",
  "maxHp": 22,
  "hpDice": "4d8+4",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10
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
    "name": "Cimitarra",
    "bonus": 3,
    "damage": "1d6+1",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Cimitarra",
    "Cimitarra"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Cuspir Fogo",
    "tipo": "alvo",
    "alcanceFt": 10,
    "save": "dex",
    "dc": 11,
    "damage": "2d8",
    "damageType": "fogo",
    "halfOnSave": true
   }
  ],
  "traits": [],
  "blurb": "Combate de perto com dois golpes de cimitarra por turno e, uma vez por descanso, cospe fogo em quem estiver a até 3 m. Fogo não o machuca.",
  "lore": "Os tritões-de-fogo são humanoides anfíbios de pele úmida que vivem perto de fontes termais, vulcões e cavernas aquecidas do Subterrâneo e das montanhas. Formam bandos guerreiros que veneram o fogo e costumam ser agressivos com forasteiros. Os guerreiros são a linha de frente da tribo, protegendo os ninhos e saqueando caravanas. Muitos servem a cultos elementais do fogo."
 },
 "caracolMangual": {
  "id": "caracolMangual",
  "tipo": "elemental",
  "name": "Caracol-Mangual",
  "nomeOriginal": "Flail Snail",
  "fonte": "VGM",
  "size": "grande",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 17,
   "dex": 5,
   "con": 20,
   "int": 3,
   "wis": 10,
   "cha": 5
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 52,
  "hpDice": "5d10+25",
  "speedFt": 10,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60,
   "tremorsenseFt": 60
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
    "name": "Tentáculo-Mangual",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "concussão",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 2
  },
  "acoesEspeciais": [
   {
    "nome": "Concha Cintilante",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 30,
    "save": "wis",
    "dc": 15,
    "condition": "atordoado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   },
   {
    "nome": "Defesa da Concha",
    "tipo": "concha",
    "ca": 4
   }
  ],
  "traits": [
   "resistenciaAMagia",
   "t_tentaculosMangual"
  ],
  "blurb": "Lento, mas resistente: golpeia um único alvo com até cinco tentáculos em forma de maça e pode atordoar quem estiver por perto com um clarão da concha. Magia contra ele é arriscada, pois a concha pode anular, refletir ou explodir os feitiços.",
  "lore": "Elemental da terra famoso pela concha de muitas cores, o caracol-mangual parece inofensivo enquanto se arrasta devagar por subterrâneos, florestas e pântanos. Ele come tudo o que encontra no chão, de terra a pedras, e adora cristais e veios minerais. Por onde passa deixa um rastro brilhante que endurece em uma fina camada de vidro, coletada por quem vive de segui-lo. Quando algo grande demais se aproxima, ele dispara um clarão ofuscante e ataca. Sua concha vale uma fortuna, pois serve para forjar escudos antimagia e mantos de cores cintilantes."
 },
 "flind": {
  "id": "flind",
  "tipo": "humanoide",
  "name": "Flind",
  "nomeOriginal": "Flind",
  "fonte": "VGM",
  "size": "médio",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 20,
   "dex": 10,
   "con": 19,
   "int": 11,
   "wis": 13,
   "cha": 12
  },
  "ac": 16,
  "acNote": "cota de malha",
  "maxHp": 127,
  "hpDice": "15d8+60",
  "speedFt": 30,
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 60
  },
  "saves": [
   "con",
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
    "name": "Mangual da Loucura",
    "bonus": 9,
    "damage": "1d10+5",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Mangual da Dor",
    "bonus": 9,
    "damage": "1d10+5",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d10",
     "type": "psíquico"
    }
   },
   {
    "name": "Mangual da Paralisia",
    "bonus": 9,
    "damage": "1d10+5",
    "type": "concussão",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 16,
     "condition": "paralisado",
     "rounds": 1,
     "repete": false
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
  "multiattack": {
   "count": 3,
   "porArma": {
    "Arco Longo": 3
   }
  },
  "traits": [
   "t_auraDeSedeDeSangue"
  ],
  "blurb": "Líder gnoll que golpeia três vezes por turno com mangais encantados: um causa dor psíquica brutal, outro paralisa e o terceiro faz o alvo atacar a esmo. Perto dele, gnolls mordem com ação bônus.",
  "lore": "Flinds são gnolls raros e excepcionalmente fortes, tidos como abençoados por Yeenoghu, o Senhor Demônio dos gnolls. Costumam assumir o comando de bandos inteiros, que os seguem com fervor quase religioso. Empunham mangais profanos que espalham agonia, loucura e paralisia entre os inimigos. Vagueiam por planícies, florestas, colinas e terras geladas, deixando massacres pelo caminho."
 },
 "sapomoth": {
  "id": "sapomoth",
  "tipo": "monstruosidade",
  "name": "Sapomoth",
  "nomeOriginal": "Froghemoth",
  "fonte": "VGM",
  "size": "enorme",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 23,
   "dex": 13,
   "con": 20,
   "int": 2,
   "wis": 12,
   "cha": 5
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 184,
  "hpDice": "16d12+80",
  "speedFt": 30,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 19,
   "darkvisionFt": 60
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
   "percepcao"
  ],
  "damageResistances": [
   "fogo",
   "elétrico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Tentáculo",
    "bonus": 10,
    "damage": "3d8+6",
    "type": "concussão",
    "reachFt": 20,
    "onHit": {
     "semResistencia": true,
     "dc": 16,
     "escape": 16,
     "condition": "agarrado",
     "note": "é agarrado"
    }
   },
   {
    "name": "Mordida",
    "bonus": 10,
    "damage": "3d10+6",
    "type": "perfurante",
    "reachFt": 5,
    "engole": {
     "tamanhoMax": "medium",
     "dano": "3d6",
     "tipoDano": "ácido",
     "regurgita": {
      "dano": 20,
      "dc": 20
     }
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
   "t_lingua",
   "t_vulneravelAChoques"
  ],
  "blurb": "Agarra várias presas de longe com quatro tentáculos de 6 m de alcance enquanto puxa outra com a língua para engoli-la inteira. Dano elétrico o deixa lento e vulnerável.",
  "lore": "O sapomoth é um predador anfíbio do tamanho de um elefante, com couro grosso e borrachudo, tentáculos, uma bocarra cheia de presas e um pedúnculo com três olhos. Dizem que veio de fora deste mundo, saído de estranhas câmaras metálicas enterradas no solo. Vive em pântanos, escondido em poças turvas com apenas os olhos à mostra, e explode da água quando algo comestível se aproxima. Põe ovos sozinho e não liga para a cria, que cresce devorando tudo o que encontra. Bullywugs o veneram como um deus, alimentando-o e protegendo-o com fanatismo."
 },
 "giganteDoGeloEterno": {
  "id": "giganteDoGeloEterno",
  "tipo": "gigante",
  "name": "Gigante do Gelo Eterno",
  "nomeOriginal": "Frost Giant Everlasting One",
  "fonte": "VGM",
  "size": "enorme",
  "level": 9,
  "cr": "12",
  "xp": 8400,
  "abilities": {
   "str": 25,
   "dex": 9,
   "con": 24,
   "int": 9,
   "wis": 10,
   "cha": 12
  },
  "ac": 15,
  "acNote": "armadura de retalhos",
  "maxHp": 189,
  "hpDice": "14d12+98",
  "speedFt": 40,
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 60
  },
  "saves": [
   "str",
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
    "name": "Machado Grande",
    "bonus": 11,
    "damage": "3d12+7",
    "type": "cortante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "3d12+11",
     "type": "cortante"
    }
   },
   {
    "name": "Rocha",
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
    "Machado Grande",
    "Machado Grande"
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
   "t_cabecasExtras",
   "regeneracaoDoLivro",
   "t_furiaDeVaprak"
  ],
  "blurb": "Brutamontes de machado que regenera 10 PV por turno e, em fúria, causa dano extra e resiste a golpes físicos. Use fogo ou ácido para impedir a regeneração e conseguir matá-lo.",
  "lore": "Gigantes do gelo desesperados por prestígio no ordning às vezes aceitam o chamado de Vaprak, deus faminto venerado por ogros e trolls. Após visões de glória e canibalismo, o gigante recebe um troll enviado pelo deus e o devora por inteiro. Com isso, ganha força tremenda, temperamento violento e a regeneração dos trolls, o que costuma levá-lo ao posto de jarl. Se negligenciar o deus, porém, suas feridas cicatrizam deformadas, com membros e até cabeças a mais, e o clã o mata ou expulsa. Alguns desses párias formam pequenas comunidades que transmitem a bênção às novas gerações."
 },
 "gauth": {
  "id": "gauth",
  "tipo": "aberração",
  "name": "Gauth",
  "nomeOriginal": "Gauth",
  "fonte": "VGM",
  "size": "médio",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 10,
   "dex": 14,
   "con": 16,
   "int": 15,
   "wis": 15,
   "cha": 13
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 67,
  "hpDice": "9d8+27",
  "speedFt": 0,
  "flyFt": 20,
  "hover": true,
  "speeds": {
   "flyFt": 20
  },
  "senses": {
   "passivePerception": 15,
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
  "expertise": [],
  "conditionImmunities": [
   "caido"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 8,
    "damage": "2d8",
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
     "nome": "Devour Magic Ray",
     "save": "dex",
     "dc": 14
    },
    {
     "nome": "Raio Enervante",
     "save": "con",
     "dc": 14,
     "damage": "4d8",
     "damageType": "necrótico",
     "halfOnSave": true
    },
    {
     "nome": "Pushing Ray",
     "save": "str",
     "dc": 14
    },
    {
     "nome": "Fire Ray",
     "save": "dex",
     "dc": 14,
     "damage": "4d10",
     "damageType": "fogo",
     "halfOnSave": false
    },
    {
     "nome": "Raio Paralisante",
     "save": "con",
     "dc": 14,
     "condition": "paralisado",
     "rounds": 10,
     "repete": true
    },
    {
     "nome": "Raio do Sono",
     "save": "wis",
     "dc": 14,
     "efeito": "sono"
    }
   ]
  },
  "aura": {
   "raioFt": 30,
   "quando": "inicioDoAlvo",
   "save": "wis",
   "dc": 14,
   "condition": "atordoado",
   "rounds": 1,
   "olhar": true
  },
  "explosaoAoMorrer": {
   "pes": 10,
   "save": "dex",
   "dc": 14,
   "dano": "3d8",
   "tipo": "energético",
   "metade": true
  },
  "traits": [
   "raiosOculares",
   "aura",
   "explosaoAoMorrer"
  ],
  "blurb": "Flutua a distância disparando três raios oculares aleatórios por turno, que queimam, paralisam, adormecem ou anulam itens mágicos, enquanto o olho central atordoa quem o encara. Ao morrer, explode em energia mágica.",
  "lore": "Parente menor dos observadores, o gauth é uma esfera de pouco mais de um metro com seis pedúnculos oculares, um grande olho central e pequenos tentáculos junto à boca. Alimenta-se da magia drenada de objetos encantados e, se ficar semanas sem ela, é arrastado de volta ao seu plano natal. Por isso exige tributo de criaturas mais fracas e chega a usar servos para lhe trazer itens. Às vezes invade rituais malfeitos de invocação de espectadores, fingindo ser outra coisa para enganar quem o chamou. Observadores verdadeiros costumam expulsá-lo ou escravizá-lo como tenente."
 },
 "observadorMenor": {
  "id": "observadorMenor",
  "tipo": "aberração",
  "name": "Observador Menor",
  "nomeOriginal": "Gazer",
  "fonte": "VGM",
  "size": "miúdo",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 3,
   "dex": 17,
   "con": 14,
   "int": 3,
   "wis": 10,
   "cha": 7
  },
  "ac": 13,
  "maxHp": 13,
  "hpDice": "3d4+6",
  "speedFt": 0,
  "flyFt": 30,
  "hover": true,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 60
  },
  "saves": [
   "wis"
  ],
  "skills": [
   "percepcao",
   "furtividade"
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
    "damage": 1,
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "raiosOculares": {
   "n": 2,
   "alcanceFt": 60,
   "aoAcaso": true,
   "raios": [
    {
     "nome": "Dazing Ray",
     "save": "wis",
     "dc": 12,
     "condition": "enfeiticado",
     "rounds": 1,
     "repete": false
    },
    {
     "nome": "Raio do Medo",
     "save": "wis",
     "dc": 12,
     "condition": "amedrontado",
     "rounds": 1,
     "repete": false
    },
    {
     "nome": "Frost Ray",
     "save": "dex",
     "dc": 12,
     "damage": "3d6",
     "damageType": "frio",
     "halfOnSave": false
    },
    {
     "nome": "Raio Telecinético",
     "save": "str",
     "dc": 12,
     "efeito": "telecinese"
    }
   ]
  },
  "traits": [
   "raiosOculares",
   "agressivo",
   "t_imitacao"
  ],
  "blurb": "Pequeno olho flutuante que avança como ação bônus e dispara dois raios aleatórios por turno, capazes de enfeitiçar, amedrontar, congelar ou empurrar alvos para longe. Frágil, mas irritante em grupo.",
  "lore": "Nascido dos sonhos de um observador, este minúsculo ser imita o seu criador em miniatura, com cerca de 20 cm de largura e apenas quatro pedúnculos oculares. Segue o mestre como um cãozinho fiel e briguento, e às vezes bandos deles vasculham o covil atrás de pragas e intrusos solitários. Os que vivem livres no Subterrâneo são territoriais, comem insetos e bichos pequenos e gostam de brincar com a comida. Costumam perseguir viajantes repetindo suas palavras em tom esganiçado e zombeteiro, mas fogem de qualquer coisa que não consigam matar. Magos às vezes os adotam como familiares."
 },
 "passolargoGigante": {
  "id": "passolargoGigante",
  "tipo": "monstruosidade",
  "name": "Passolargo Gigante",
  "nomeOriginal": "Giant Strider",
  "fonte": "VGM",
  "size": "grande",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 18,
   "dex": 13,
   "con": 14,
   "int": 4,
   "wis": 12,
   "cha": 6
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 22,
  "hpDice": "3d10+6",
  "speedFt": 50,
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
    "name": "Mordida",
    "bonus": 6,
    "damage": "1d8+4",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "breath": {
   "name": "Explosão de Fogo",
   "kind": "save",
   "shape": "sphere",
   "areaFt": 10,
   "save": "dex",
   "dc": 12,
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
   "absorcaoDeFogo"
  ],
  "blurb": "Ave de montaria ágil que morde com força e lança explosões de chamas à distância. O fogo não a fere: em vez disso, a cura.",
  "lore": "O passolargo gigante é uma enorme ave sem asas, de pernas longas, ligada a energias elementais de fogo. Costuma habitar o Subterrâneo, montanhas e colinas, muitas vezes perto de áreas vulcânicas. Os povos que lidam com o fogo, como certos anões e salamandras, o domam como montaria de guerra. Ele é feroz com estranhos, mas leal a quem o criou."
 },
 "girallon": {
  "id": "girallon",
  "tipo": "monstruosidade",
  "name": "Girallon",
  "nomeOriginal": "Girallon",
  "fonte": "VGM",
  "size": "grande",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 18,
   "dex": 16,
   "con": 16,
   "int": 5,
   "wis": 12,
   "cha": 7
  },
  "ac": 13,
  "maxHp": 59,
  "hpDice": "7d10+21",
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
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garra",
    "bonus": 6,
    "damage": "1d6+4",
    "type": "cortante",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 5,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra",
    "Garra",
    "Garra"
   ]
  },
  "traits": [
   "agressivo",
   "keenSmell"
  ],
  "blurb": "Primata de quatro braços que avança como ação bônus sobre quem enxerga e despeja cinco ataques por turno, com garras que alcançam 3 m. Escala com facilidade e surge de esconderijos para emboscar.",
  "lore": "Grande símio de pele cinzenta, pelagem branca, presas e quatro braços, o girallon é um predador de florestas temperadas e quentes. Vive em bandos frouxos guiados pelo membro mais velho, mas cada um caça sozinho, comunicando-se por rugidos, e o líder pode reunir o grupo para abater presas grandes. Ruínas de cidades perdidas o atraem, pois ele trata muros e torres como galhos firmes e vigia a região do alto. Sábios acreditam que foram criados por magia como guardiões de um império esquecido; hoje há quem os domestique como sentinelas, como os yuan-ti, embora o instinto predador possa voltar a qualquer momento."
 },
 "gnollRoedorDeCarne": {
  "id": "gnollRoedorDeCarne",
  "tipo": "humanoide",
  "name": "Gnoll Roedor de Carne",
  "nomeOriginal": "Gnoll Flesh Gnawer",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 12,
   "dex": 14,
   "con": 12,
   "int": 8,
   "wis": 10,
   "cha": 8
  },
  "ac": 14,
  "acNote": "couro batido",
  "maxHp": 22,
  "hpDice": "4d8+4",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [
   "dex"
  ],
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
    "name": "Espada Curta",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Espada Curta",
    "Espada Curta"
   ]
  },
  "traits": [
   "t_investidaSubita",
   "rampage"
  ],
  "blurb": "Avança de repente pelo campo, sem provocar ataques de oportunidade, e despedaça alvos isolados com mordida e duas espadas curtas. Cada inimigo que derruba lhe dá mais movimento e outra mordida.",
  "lore": "São os gnolls mais selvagens de seus bandos, avessos a arcos e lanças. Preferem lâminas curtas, que manejam com rapidez assustadora. No meio da batalha disparam entre as linhas para caçar retardatários e acabar com feridos. Quando o bando está enfraquecido, atacam povoados afastados, aleijando os moradores para se alimentar deles enquanto se recuperam."
 },
 "gnollCacador": {
  "id": "gnollCacador",
  "tipo": "humanoide",
  "name": "Gnoll Caçador",
  "nomeOriginal": "Gnoll Hunter",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 14,
   "dex": 14,
   "con": 12,
   "int": 8,
   "wis": 12,
   "cha": 8
  },
  "ac": 13,
  "acNote": "armadura de couro",
  "maxHp": 22,
  "hpDice": "4d8+4",
  "speedFt": 30,
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
   "count": 2,
   "sequencias": [
    [
     "Lança",
     "Lança"
    ],
    [
     "Arco Longo",
     "Arco Longo"
    ]
   ]
  },
  "traits": [
   "rampage"
  ],
  "blurb": "Ataca duas vezes com lança ou arco longo, e suas flechas farpadas deixam o alvo mais lento. Ao derrubar alguém em corpo a corpo, avança e morde de novo.",
  "lore": "Os caçadores são os batedores furtivos dos bandos de guerra gnoll, seguindo à frente do grupo para eliminar inimigos isolados. Dominam o arco longo e usam pontas cruéis com farpas que fazem a presa mancar de dor. Quando já não precisam se esconder, sopram uma trompa de osso cujo uivo agudo lembra o grito de uma banshee. Vivem em campos, florestas, colinas e regiões geladas, sempre atrás de vítimas fáceis."
 },
 "gnollDefinhado": {
  "id": "gnollDefinhado",
  "tipo": "morto-vivo",
  "name": "Gnoll Definhado",
  "nomeOriginal": "Gnoll Witherling",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 14,
   "dex": 8,
   "con": 12,
   "int": 5,
   "wis": 5,
   "cha": 5
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 11,
  "hpDice": "2d8+2",
  "speedFt": 30,
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
   "exausto",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Clava",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequencias": [
    [
     "Mordida",
     "Clava"
    ],
    [
     "Clava",
     "Clava"
    ]
   ]
  },
  "traits": [
   "rampage",
   "t_golpeVingativo"
  ],
  "blurb": "Morto-vivo que ataca com mordida e clava e, ao derrubar um inimigo, avança para morder de novo. Revida com um golpe quando um gnoll aliado cai perto dele.",
  "lore": "Quando a fome ou a disputa pelo comando leva gnolls a se matarem, os vencedores comem a carne dos caídos e guardam os ossos. Com rituais dedicados a Yeenoghu, esses restos voltam a se erguer como gnolls definhados. Eles continuam marchando com o bando e matando o que encontram, mas não comem, o que deixa mais carne para os vivos. Só conseguem manejar armas rudimentares, como clavas, e não precisam de ar, comida, bebida nem sono."
 },
 "dracoGuardiaoVerde": {
  "id": "dracoGuardiaoVerde",
  "tipo": "dragão",
  "name": "Draco-Guardião Verde",
  "nomeOriginal": "Green Guard Drake",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 16,
   "dex": 11,
   "con": 16,
   "int": 4,
   "wis": 10,
   "cha": 7
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 52,
  "hpDice": "7d8+21",
  "speedFt": 30,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "veneno"
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
    "name": "Cauda",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2
  },
  "traits": [],
  "blurb": "Fera robusta que morde e golpeia com a cauda no mesmo turno, perseguindo inimigos tanto em terra quanto dentro d'água. Resiste a veneno, o que a torna difícil de abater com toxinas.",
  "lore": "Dracos-guardiões são criaturas criadas por magia a partir de escamas de dragão, treinadas para vigiar tesouros, portões e propriedades. A variedade verde carrega traços do dragão que a originou: é anfíbia e se sente em casa em florestas úmidas e pântanos. Não tem a astúcia de um dragão verdadeiro, mas é leal ao dono e entende ordens dadas em dracônico. Costuma atacar qualquer intruso sem hesitar, defendendo seu território até o fim."
 },
 "grung": {
  "id": "grung",
  "tipo": "humanoide",
  "name": "Grung",
  "nomeOriginal": "Grung",
  "fonte": "VGM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 7,
   "dex": 14,
   "con": 15,
   "int": 10,
   "wis": 11,
   "cha": 10
  },
  "ac": 12,
  "maxHp": 11,
  "hpDice": "2d6+4",
  "speedFt": 25,
  "speeds": {
   "climbFt": 25
  },
  "senses": {
   "passivePerception": 12
  },
  "saves": [
   "dex"
  ],
  "skills": [
   "atletismo",
   "percepcao",
   "furtividade",
   "sobrevivencia"
  ],
  "expertise": [
   "atletismo"
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
    "bonus": 4,
    "damage": "1d4+2",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60,
    "onHit": {
     "save": "con",
     "dc": 12,
     "danoSeFalhar": {
      "damage": "2d4",
      "type": "veneno"
     },
     "metadeSePassar": false
    }
   }
  ],
  "peleVenenosa": {
   "dc": 12
  },
  "traits": [
   "peleVenenosa",
   "t_saltoParado"
  ],
  "blurb": "Pequeno anfíbio venenoso que salta longe e ataca com adagas envenenadas; tocá-lo ou agarrá-lo pode deixar você envenenado, com efeitos extras conforme a cor da pele.",
  "lore": "Grungs são pequenos humanoides parecidos com sapos, de pele colorida e tóxica. Vivem em florestas úmidas e selvas, em aldeias erguidas nas árvores perto de água. Formam sociedades rígidas, organizadas em castas definidas pela cor da pele, e são cruéis com estranhos. Costumam capturar intrusos como escravos e defendem seu território com emboscadas a partir das copas."
 },
 "guerreiroDeEliteGrung": {
  "id": "guerreiroDeEliteGrung",
  "tipo": "humanoide",
  "name": "Guerreiro de Elite Grung",
  "nomeOriginal": "Grung Elite Warrior",
  "fonte": "VGM",
  "size": "pequeno",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 7,
   "dex": 16,
   "con": 15,
   "int": 10,
   "wis": 11,
   "cha": 12
  },
  "ac": 13,
  "maxHp": 49,
  "hpDice": "9d6+18",
  "speedFt": 25,
  "speeds": {
   "climbFt": 25
  },
  "senses": {
   "passivePerception": 12
  },
  "saves": [
   "dex"
  ],
  "skills": [
   "atletismo",
   "percepcao",
   "furtividade",
   "sobrevivencia"
  ],
  "expertise": [
   "atletismo"
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
    "onHit": {
     "save": "con",
     "dc": 12,
     "danoSeFalhar": {
      "damage": "2d4",
      "type": "veneno"
     },
     "metadeSePassar": false
    }
   },
   {
    "name": "Arco Curto",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 80,
    "longRangeFt": 320,
    "onHit": {
     "save": "con",
     "dc": 12,
     "danoSeFalhar": {
      "damage": "2d4",
      "type": "veneno"
     },
     "metadeSePassar": false
    }
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Chilreio Hipnótico",
    "recharge": [
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 15,
    "save": "wis",
    "dc": 12,
    "condition": "atordoado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "peleVenenosa": {
   "dc": 12
  },
  "traits": [
   "peleVenenosa",
   "t_saltoParado"
  ],
  "blurb": "Pequeno anfíbio venenoso que salta longe, ataca com adaga e arco envenenados e solta um chilreio capaz de atordoar quem estiver perto. Encostar na pele dele pode envenenar.",
  "lore": "Os grungs são homens-rã pequenos e agressivos que habitam florestas tropicais e pântanos, organizados numa rígida hierarquia de castas marcada pela cor da pele. Os guerreiros de elite pertencem às castas superiores e lideram patrulhas e emboscadas contra invasores. Sua pele secreta um veneno cujo efeito extra varia conforme a cor, mas que perde a força pouco depois de sair do corpo ou quando o grung morre. Escalam árvores com facilidade e preferem atacar de cima, de surpresa."
 },
 "grungSelvagem": {
  "id": "grungSelvagem",
  "tipo": "humanoide",
  "name": "Grung Selvagem",
  "nomeOriginal": "Grung Wildling",
  "fonte": "VGM",
  "size": "pequeno",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 7,
   "dex": 16,
   "con": 15,
   "int": 10,
   "wis": 15,
   "cha": 11
  },
  "ac": 13,
  "acNote": "16 com pele de árvore",
  "maxHp": 27,
  "hpDice": "5d6+10",
  "speedFt": 25,
  "speeds": {
   "climbFt": 25
  },
  "senses": {
   "passivePerception": 14
  },
  "saves": [
   "dex"
  ],
  "skills": [
   "atletismo",
   "percepcao",
   "furtividade",
   "sobrevivencia"
  ],
  "expertise": [
   "atletismo"
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
    "onHit": {
     "save": "con",
     "dc": 12,
     "danoSeFalhar": {
      "damage": "2d4",
      "type": "veneno"
     },
     "metadeSePassar": false
    }
   },
   {
    "name": "Arco Curto",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 80,
    "longRangeFt": 320,
    "onHit": {
     "save": "con",
     "dc": 12,
     "danoSeFalhar": {
      "damage": "2d4",
      "type": "veneno"
     },
     "metadeSePassar": false
    }
   }
  ],
  "spellcasting": {
   "ability": "wis",
   "cantrips": [],
   "prepared": [
    "curarFerimentos",
    "salto",
    "peleDeArvore",
    "crescimentoDeEspinhos",
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
    "curarFerimentos": 12,
    "salto": 12,
    "peleDeArvore": 12,
    "crescimentoDeEspinhos": 12,
    "crescimentoDePlantas": 12
   }
  },
  "peleVenenosa": {
   "dc": 12
  },
  "traits": [
   "peleVenenosa",
   "t_saltoParado"
  ],
  "blurb": "Atirador ágil que alterna adagas e arco curto envenenados com magias de patrulheiro como crescer espinhos e pele de árvore. Tocar sua pele pode envenenar, com efeitos extras conforme a cor do grung.",
  "lore": "Os grungs são pequenos humanoides anfíbios parecidos com sapos, que vivem em florestas úmidas e pântanos tropicais. O selvagem é o explorador e guardião da tribo, ligado à natureza e capaz de lançar magias de patrulheiro. Cruéis e territoriais, os grungs organizam sua sociedade em castas definidas pela cor da pele. Escalam árvores com facilidade e saltam grandes distâncias para emboscar invasores."
 },
 "hadrossauro": {
  "id": "hadrossauro",
  "tipo": "fera",
  "name": "Hadrossauro",
  "nomeOriginal": "Hadrosaurus",
  "fonte": "VGM",
  "size": "grande",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 15,
   "dex": 10,
   "con": 13,
   "int": 2,
   "wis": 10,
   "cha": 5
  },
  "ac": 11,
  "acNote": "armadura natural",
  "maxHp": 19,
  "hpDice": "3d10+3",
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
    "name": "Cauda",
    "bonus": 4,
    "damage": "1d10+2",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Herbívoro grande e pouco agressivo que se defende girando a cauda pesada contra quem chega perto. Aguenta pouco castigo, mas cada golpe da cauda machuca.",
  "lore": "O hadrossauro é um dinossauro herbívoro que anda ora sobre duas, ora sobre quatro patas, e é fácil de reconhecer pelas cristas ósseas no alto da cabeça. Vive em pradarias e pântanos, onde pasta em grupos e evita confusão. Quando capturado ainda filhote e criado por pessoas, pode ser treinado como montaria para cavaleiros pequenos ou médios."
 },
 "devastadorHobgoblin": {
  "id": "devastadorHobgoblin",
  "tipo": "humanoide",
  "name": "Devastador Hobgoblin",
  "nomeOriginal": "Hobgoblin Devastator",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 13,
   "dex": 12,
   "con": 14,
   "int": 16,
   "wis": 13,
   "cha": 11
  },
  "ac": 13,
  "acNote": "couro batido",
  "maxHp": 45,
  "hpDice": "7d8+14",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "arcanismo"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Bordão",
    "bonus": 3,
    "damage": "1d6+1",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d8+1",
     "type": "concussão"
    }
   }
  ],
  "spellcasting": {
   "ability": "int",
   "cantrips": [
    "respingoAcido",
    "raioDeFogo",
    "raioDeGelo",
    "toqueChocante"
   ],
   "prepared": [
    "nevoaObscurecente",
    "misselMagico",
    "ondaTrovejante",
    "lufadaDeVento",
    "flechaAcida",
    "raioArdente",
    "bolaDeFogo",
    "voo",
    "relampago",
    "tempestadeDeGelo"
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
    "respingoAcido": 13,
    "raioDeFogo": 13,
    "raioDeGelo": 13,
    "toqueChocante": 13,
    "nevoaObscurecente": 13,
    "misselMagico": 13,
    "ondaTrovejante": 13,
    "lufadaDeVento": 13,
    "flechaAcida": 13,
    "raioArdente": 13,
    "bolaDeFogo": 13,
    "voo": 13,
    "relampago": 13,
    "tempestadeDeGelo": 13
   }
  },
  "traits": [
   "t_vantagemArcana",
   "t_arcanoDeExercito"
  ],
  "blurb": "Mago de batalha que despeja bola de fogo, relâmpago e tempestade de gelo sobre o campo sem ferir os próprios aliados. Ataques mágicos contra alvos colados a seus companheiros causam dano extra.",
  "lore": "Os devastadores são os magos de guerra das legiões hobgoblins, treinados para servir como artilharia arcana. Ficam atrás das fileiras, protegidos pelos soldados, e moldam suas magias para poupar quem marcha ao seu lado. São disciplinados e frios, tratando a magia como mais uma arma da máquina militar. Costumam acompanhar exércitos em campos, florestas e colinas."
 },
 "sombraDeFerroHobgoblin": {
  "id": "sombraDeFerroHobgoblin",
  "tipo": "humanoide",
  "name": "Sombra de Ferro Hobgoblin",
  "nomeOriginal": "Hobgoblin Iron Shadow",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 14,
   "dex": 16,
   "con": 15,
   "int": 14,
   "wis": 15,
   "cha": 11
  },
  "ac": 15,
  "acNote": "defesa sem armadura",
  "maxHp": 32,
  "hpDice": "5d8+10",
  "speedFt": 40,
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "acrobacia",
   "atletismo",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Golpe Desarmado",
    "bonus": 5,
    "damage": "1d4+3",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Dardo",
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
   "count": 4
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [
    "ilusaoMenor",
    "prestidigitacao",
    "ataqueCerteiro"
   ],
   "prepared": [
    "enfeiticarPessoa",
    "disfarcarSe",
    "recuoAcelerado",
    "imagemSilenciosa"
   ],
   "slots": [
    0,
    3
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "ilusaoMenor": 12,
    "prestidigitacao": 12,
    "ataqueCerteiro": 12,
    "enfeiticarPessoa": 12,
    "disfarcarSe": 12,
    "recuoAcelerado": 12,
    "imagemSilenciosa": 12
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Passo Sombrio",
    "tipo": "teleporte",
    "alcanceFt": 30
   }
  ],
  "traits": [],
  "blurb": "Monge ágil que desfere quatro golpes por turno entre socos e dardos, saltando de sombra em sombra para surgir onde menos se espera. Também usa ilusões e enfeitiçamento para confundir os alvos.",
  "lore": "As Sombras de Ferro são monges hobgoblins que atuam como polícia secreta, batedores e assassinos a serviço de Maglubiyet. Seus membros são escolhidos entre os hobgoblins mais ágeis e leais, passam por provas de lealdade que custam a vida a quem falha e só então recebem anos de treino em artes marciais e magia das sombras. Vigiam o próprio povo em busca de traidores e cumprem missões ordenadas pelos clérigos de seu deus. Em serviço, usam máscaras com feições de diabos, que escondem quem são e assustam os inimigos."
 },
 "illitilich": {
  "id": "illitilich",
  "tipo": "morto-vivo",
  "name": "Illitilich",
  "nomeOriginal": "Illithilich",
  "fonte": "VGM",
  "size": "médio",
  "level": 21,
  "cr": "22",
  "xp": 41000,
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
   },
   {
    "name": "Tentáculos",
    "bonus": 12,
    "damage": "3d10+5",
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
    "bonus": 12,
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
    "dominarMonstro": 20,
    "viagemPlanar": 20,
    "detectarPensamentos": 20,
    "levitacao": 20
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
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
    "dc": 18,
    "damage": "5d8+5",
    "damageType": "psíquico",
    "halfOnSave": false,
    "condition": "atordoado",
    "rounds": 10,
    "repete": true
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Tentáculos",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Tentáculos"
    },
    {
     "nome": "Extrair Cérebro",
     "custo": 2,
     "tipo": "golpe",
     "arma": "Extrair Cérebro"
    },
    {
     "nome": "Rajada Mental",
     "custo": 3,
     "tipo": "especial",
     "acao": "Rajada Mental"
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
   "t_rejuvenescimento",
   "resisteExpulsar",
   "resistenciaAMagia",
   "acoesLendarias"
  ],
  "blurb": "Um devorador de mentes morto-vivo que une a magia de um mago de 18º nível a poderes psiônicos: atordoa grupos com a Rajada Mental, agarra com tentáculos e arranca cérebros. Também pode lançar Palavra de Poder Matar e Dedo da Morte, e só é derrotado de vez se sua filactéria for destruída.",
  "lore": "Os devoradores de mentes que se dedicam à magia arcana são tratados como desviantes e expulsos da colônia, pois o cérebro ancião jamais aceitará suas mentes. Sem essa comunhão, a morte significa o esquecimento total, e alguns buscam a imortalidade de outra maneira. Os mais poderosos chegam à verdadeira condição de lich, criando uma filactéria e alimentando-a com almas, algo que fazem sem qualquer remorso. O illitilich habita o Subterrâneo, onde pode viver isolado com seus estudos ou tentar dominar uma colônia, ocupando o lugar do cérebro ancião."
 },
 "ilusionista": {
  "id": "ilusionista",
  "tipo": "humanoide",
  "name": "Ilusionista",
  "nomeOriginal": "Illusionist",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 9,
   "dex": 14,
   "con": 13,
   "int": 16,
   "wis": 11,
   "cha": 12
  },
  "ac": 12,
  "acNote": "15 com armadura arcana",
  "maxHp": 38,
  "hpDice": "7d8+7",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10
  },
  "saves": [
   "int",
   "wis"
  ],
  "skills": [
   "arcanismo",
   "historia"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Bordão",
    "bonus": 1,
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
   "ability": "int",
   "cantrips": [
    "luzesDancantes",
    "maoMagica",
    "ilusaoMenor",
    "borrifoVenenoso"
   ],
   "prepared": [
    "borrifoDeCores",
    "disfarcarSe",
    "armaduraArcana",
    "misselMagico",
    "invisibilidade",
    "imagemEspelhada",
    "forcaFantasmagorica",
    "imagemMaior",
    "montariaFantasmagorica",
    "assassinoFantasmagorico"
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
    "luzesDancantes": 13,
    "maoMagica": 13,
    "ilusaoMenor": 13,
    "borrifoVenenoso": 13,
    "borrifoDeCores": 13,
    "disfarcarSe": 13,
    "armaduraArcana": 13,
    "misselMagico": 13,
    "invisibilidade": 13,
    "imagemEspelhada": 13,
    "forcaFantasmagorica": 13,
    "imagemMaior": 13,
    "montariaFantasmagorica": 13,
    "assassinoFantasmagorico": 13
   }
  },
  "traits": [
   "deslocamento"
  ],
  "blurb": "Mago frágil que se esconde atrás de imagens falsas: o Deslocamento impõe desvantagem a quem o ataca, e magias como Assassino Fantasmagórico e Spray de Cores podem amedrontar ou cegar. Cerque-o e cause dano para quebrar a ilusão.",
  "lore": "Ilusionistas são magos especializados em enganar os sentidos, manipulando luz, som, sombras e a própria mente. Alguns usam esse dom de forma chamativa, como verdadeiros artistas de palco. Outros preferem a discrição, ocultando verdades e criando disfarces. São comuns em cidades, onde servem como espiões, golpistas ou conselheiros."
 },
 "kiRin": {
  "id": "kiRin",
  "tipo": "celestial",
  "name": "Ki-rin",
  "nomeOriginal": "Ki-rin",
  "fonte": "VGM",
  "size": "enorme",
  "level": 9,
  "cr": "12",
  "xp": 8400,
  "abilities": {
   "str": 21,
   "dex": 16,
   "con": 16,
   "int": 19,
   "wis": 20,
   "cha": 20
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 152,
  "hpDice": "16d12+48",
  "speedFt": 60,
  "flyFt": 120,
  "hover": true,
  "speeds": {
   "flyFt": 120
  },
  "senses": {
   "passivePerception": 19,
   "blindsightFt": 30,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "intuicao",
   "percepcao",
   "religiao"
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
    "name": "Casco",
    "bonus": 9,
    "damage": "2d4+5",
    "type": "concussão",
    "reachFt": 15
   },
   {
    "name": "Chifre",
    "bonus": 9,
    "damage": "2d8+5",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Chifre"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "criarAlimentoAgua",
    "formaGasosa",
    "imagemMaior",
    "caminharNoVento"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "criarAlimentoAgua": 1
   },
   "aVontade": [
    "formaGasosa",
    "imagemMaior",
    "caminharNoVento"
   ],
   "cdPorMagia": {
    "criarAlimentoAgua": 17,
    "formaGasosa": 17,
    "imagemMaior": 17,
    "caminharNoVento": 17
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Golpear",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Casco"
    },
    {
     "nome": "Mover",
     "custo": 1,
     "tipo": "mover",
     "metade": true,
     "semOportunidade": true
    }
   ]
  },
  "traits": [
   "resistenciaAMagia",
   "armasMagicas",
   "acoesLendarias"
  ],
  "blurb": "Celestial colossal que voa a 36 m, golpeia com cascos a 4,5 m de distância e chifre, e ainda conjura magias de clérigo de alto nível, como banimento e chama sagrada. Resiste a magia e pode anular falhas em testes três vezes por dia.",
  "lore": "O ki-rin é um ser celestial que encarna o bem, parecido com um cervo do tamanho de um elefante, coberto de escamas douradas e com um chifre espiralado cor de cobre. Serve divindades da coragem, lealdade e verdade, atuando como guardião, mensageiro ou espião contra as forças do mal. Para os povos comuns, avistá-lo é sinal de bom agouro, e às vezes surge em batalhas para salvar heróis. Vive em covis luxuosos no alto de picos inacessíveis ou em nuvens solidificadas, onde ensina mistérios sagrados a discípulos que juram servi-lo."
 },
 "koboldEscudoDraconico": {
  "id": "koboldEscudoDraconico",
  "tipo": "humanoide",
  "name": "Kobold Escudo-Dracônico",
  "nomeOriginal": "Kobold Dragonshield",
  "fonte": "VGM",
  "size": "pequeno",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 12,
   "dex": 15,
   "con": 14,
   "int": 8,
   "wis": 9,
   "cha": 10
  },
  "ac": 15,
  "acNote": "armadura de couro e escudo",
  "maxHp": 44,
  "hpDice": "8d6+16",
  "speedFt": 20,
  "senses": {
   "passivePerception": 11,
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
   "count": 2
  },
  "traits": [
   "t_resistenciaDraconica",
   "t_coracaoDoDragao",
   "packTactics",
   "sunlightSensitivity"
  ],
  "blurb": "Guerreiro kobold que ataca duas vezes com a lança e fica mais perigoso cercado de aliados. Resiste a um tipo de dano dracônico e livra a si e aos kobolds próximos de medo e paralisia.",
  "lore": "Kobolds abençoados por um dragão costumam receber parte de seu poder e passam a servir como guardiões escolhidos da tribo. O escudo-dracônico carrega a marca da cor do dragão que o fortaleceu e protege seus parentes com zelo fanático. Vive em túneis, montanhas, florestas e colinas, quase sempre perto do covil de seu senhor dracônico. Nas batalhas, fica na linha de frente e inspira os outros kobolds a não fugir."
 },
 "koboldInventor": {
  "id": "koboldInventor",
  "tipo": "humanoide",
  "name": "Kobold Inventor",
  "nomeOriginal": "Kobold Inventor",
  "fonte": "VGM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 7,
   "dex": 15,
   "con": 12,
   "int": 8,
   "wis": 7,
   "cha": 8
  },
  "ac": 12,
  "maxHp": 13,
  "hpDice": "3d6+3",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
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
    "name": "Adaga",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60
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
   "t_invencaoBelica",
   "sunlightSensitivity",
   "packTactics"
  ],
  "blurb": "Fraco no corpo a corpo, mas imprevisível: arremessa ácido, fogo alquímico, limo verde e enxames de bichos, e ganha vantagem quando aliados cercam o alvo.",
  "lore": "Esses kobolds engenhosos montam armas improvisadas com o que encontram: insetos capturados, gosmas recolhidas em masmorras e o melhor do que foi roubado. Os aparelhos parecem ridículos, mas funcionam bem melhor do que se esperaria. Cada invenção aguenta só um ou dois usos antes de quebrar. Muitas nem precisam matar: basta distrair ou assustar o inimigo enquanto os outros kobolds o derrubam. Num encontro, um inventor costuma carregar uma ou duas dessas engenhocas."
 },
 "feiticeiroEscamadoKobold": {
  "id": "feiticeiroEscamadoKobold",
  "tipo": "humanoide",
  "name": "Feiticeiro Escamado Kobold",
  "nomeOriginal": "Kobold Scale Sorcerer",
  "fonte": "VGM",
  "size": "pequeno",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 7,
   "dex": 15,
   "con": 14,
   "int": 10,
   "wis": 9,
   "cha": 14
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 27,
  "hpDice": "5d6+10",
  "speedFt": 30,
  "senses": {
   "passivePerception": 9,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "arcanismo",
   "medicina"
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
   "ability": "cha",
   "cantrips": [
    "raioDeFogo",
    "maoMagica",
    "consertar",
    "borrifoVenenoso"
   ],
   "prepared": [
    "enfeiticarPessoa",
    "orbeCromatico",
    "recuoAcelerado",
    "raioArdente"
   ],
   "slots": [
    0,
    4,
    2
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "raioDeFogo": 12,
    "maoMagica": 12,
    "consertar": 12,
    "borrifoVenenoso": 12,
    "enfeiticarPessoa": 12,
    "orbeCromatico": 12,
    "recuoAcelerado": 12,
    "raioArdente": 12
   }
  },
  "traits": [
   "t_pontosDeFeiticaria",
   "packTactics",
   "sunlightSensitivity"
  ],
  "blurb": "Fica atrás dos aliados disparando raios ardentes, orbes cromáticos e jatos de veneno, podendo deixar magias silenciosas ou impor desvantagem na resistência. Ganha vantagem quando um aliado está colado no alvo, mas sofre sob a luz do sol.",
  "lore": "Alguns kobolds nascem com um dom inato para a magia arcana, e a tribo os valoriza como conselheiros e guardiões da memória, já que seu deus aprisionado deixa poucos com poder divino. Em tempos calmos, reforçam e melhoram a toca com feitiços; quando há ameaça, atacam com fogo e veneno, mas sempre guardam um pouco de magia para escapar. Em tribos ligadas a um dragão, servem de porta-voz e intermediário, transmitindo ordens e levando notícias ao mestre. Vivem divididos entre a adoração e o pavor, sabendo que serão os primeiros a morrer se o dragão se irritar."
 },
 "korred": {
  "id": "korred",
  "tipo": "feérico",
  "name": "Korred",
  "nomeOriginal": "Korred",
  "fonte": "VGM",
  "size": "pequeno",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 23,
   "dex": 14,
   "con": 20,
   "int": 10,
   "wis": 15,
   "cha": 9
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 102,
  "hpDice": "12d6+60",
  "speedFt": 30,
  "speeds": {
   "burrowFt": 30
  },
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 120,
   "tremorsenseFt": 120
  },
  "saves": [],
  "skills": [
   "atletismo",
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
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Tacape",
    "bonus": 9,
    "damage": "1d8+6",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d8+6",
     "type": "concussão"
    }
   },
   {
    "name": "Pedra",
    "bonus": 9,
    "damage": "2d8+6",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 60,
    "longRangeFt": 120,
    "danoExtra": {
     "damage": "4d8+6",
     "type": "concussão"
    }
   }
  ],
  "multiattack": {
   "count": 4,
   "sequence": [
    "Tacape",
    "Tacape",
    "Pedra",
    "Pedra"
   ]
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [],
   "prepared": [
    "dancaIrresistivelDeOtto",
    "comunhaoComANatureza",
    "fundirSeComPedra"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "dancaIrresistivelDeOtto": 1
   },
   "aVontade": [
    "comunhaoComANatureza",
    "fundirSeComPedra"
   ],
   "cdPorMagia": {
    "dancaIrresistivelDeOtto": 13,
    "comunhaoComANatureza": 13,
    "fundirSeComPedra": 13
   }
  },
  "traits": [
   "t_comandarCabelo",
   "camuflagemDePedra",
   "t_forcaDaPedra"
  ],
  "blurb": "Pequeno mas brutal, o korred golpeia com um tacape enorme e arremessa pedras que ficam muito mais fortes enquanto ele pisa no chão. Cordas feitas do próprio cabelo prendem os inimigos, e sua magia pode chamar elementais da terra ou forçar alvos a dançar.",
  "lore": "Korreds são fadas reservadas e imprevisíveis, ligadas profundamente à rocha e ao subsolo. Percebem veios de metal e gemas, enxergam passagens secretas na pedra e conhecem os caminhos subterrâneos por quilômetros. Costumam evitar outras criaturas, mas se enfurecem com ofensas ou com o barulho de mineração. Seu cabelo é mágico e vira o material que o cortou, e eles o trançam em cordas de ferro que obedecem a seus comandos. Mexer nesse cabelo sem permissão é a pior afronta que se pode fazer a um korred."
 },
 "sacerdoteDoKraken": {
  "id": "sacerdoteDoKraken",
  "tipo": "humanoide",
  "name": "Sacerdote do Kraken",
  "nomeOriginal": "Kraken Priest",
  "fonte": "VGM",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 12,
   "dex": 10,
   "con": 16,
   "int": 10,
   "wis": 15,
   "cha": 14
  },
  "ac": 10,
  "maxHp": 75,
  "hpDice": "10d8+30",
  "speedFt": 30,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 15
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
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Toque Trovejante",
    "bonus": 5,
    "damage": "5d10",
    "type": "trovejante",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "wis",
   "cantrips": [],
   "prepared": [
    "escuridao",
    "respirarNaAgua",
    "andarNaAgua",
    "convocarRelampagos",
    "tentaculosNegrosDeEvard",
    "comando",
    "criarDestruirAgua"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "escuridao": 3,
    "respirarNaAgua": 3,
    "andarNaAgua": 3,
    "convocarRelampagos": 1,
    "tentaculosNegrosDeEvard": 1
   },
   "aVontade": [
    "comando",
    "criarDestruirAgua"
   ],
   "cdPorMagia": {
    "escuridao": 13,
    "respirarNaAgua": 13,
    "andarNaAgua": 13,
    "convocarRelampagos": 13,
    "tentaculosNegrosDeEvard": 13,
    "comando": 13,
    "criarDestruirAgua": 13
   }
  },
  "traits": [
   "t_vozDoKraken"
  ],
  "blurb": "Conjurador resistente a armas comuns que golpeia com um toque trovejante de 5d10 e controla o campo com tentáculos negros, relâmpagos e água. A voz do kraken pode amedrontar vários inimigos de uma vez.",
  "lore": "Algumas pessoas que presenciam a fúria de um kraken passam a adorá-lo como um deus, e o monstro às vezes retribui essa devoção concedendo poder. Esses sacerdotes vivem em costas e sob o mar, servindo como olhos, ouvidos e boca do seu senhor. Quando estão no mesmo plano, o kraken pode sentir os pensamentos do servo e até tomar o controle do corpo dele para falar. Cada sacerdote carrega marcas grotescas dessa influência, como olhos negros, línguas de tentáculo ou bocas que escorrem água salgada, e elas se intensificam quando o mestre o possui."
 },
 "leucrota": {
  "id": "leucrota",
  "tipo": "monstruosidade",
  "name": "Leucrota",
  "nomeOriginal": "Leucrotta",
  "fonte": "VGM",
  "size": "grande",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 18,
   "dex": 14,
   "con": 15,
   "int": 9,
   "wis": 12,
   "cha": 6
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 67,
  "hpDice": "9d10+18",
  "speedFt": 50,
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "enganacao",
   "percepcao"
  ],
  "expertise": [
   "enganacao"
  ],
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
    "name": "Cascos",
    "bonus": 6,
    "damage": "2d6+4",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Cascos"
   ]
  },
  "traits": [
   "keenSmell",
   "t_retiradaAosCoices",
   "t_imitacao",
   "rampage"
  ],
  "blurb": "Fera veloz que morde e escoiceia no mesmo turno, recuando sem sofrer ataques de oportunidade. Ao derrubar um alvo, avança e golpeia de novo, e sua mordida causa críticos devastadores.",
  "lore": "A leucrota é uma aberração nascida das carnificinas de Yeenoghu: hienas que devoraram as vítimas do lorde demônio e se transformaram em algo pior que gnolls. Tem corpo de hiena, patas de cervo e cabeça de texugo com placas ósseas no lugar de presas, e exala um fedor de carniça insuportável. Astuta e sádica, vive em campos e desertos junto a tribos de gnolls, onde costuma aconselhar o líder e diverti-los prolongando o sofrimento das presas. Usa rastros parecidos com os de cervos e imita vozes e gritos para atrair vítimas até uma emboscada."
 },
 "adeptoDeArtesMarciais": {
  "id": "adeptoDeArtesMarciais",
  "tipo": "humanoide",
  "name": "Adepto de Artes Marciais",
  "nomeOriginal": "Martial Arts Adept",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 11,
   "dex": 17,
   "con": 13,
   "int": 11,
   "wis": 16,
   "cha": 10
  },
  "ac": 16,
  "acNote": "defesa sem armadura",
  "maxHp": 60,
  "hpDice": "11d8+11",
  "speedFt": 40,
  "senses": {
   "passivePerception": 13
  },
  "saves": [],
  "skills": [
   "acrobacia",
   "intuicao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Golpe Desarmado",
    "bonus": 5,
    "damage": "1d8+3",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Dardo",
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
   "count": 3,
   "sequencias": [
    [
     "Golpe Desarmado",
     "Golpe Desarmado",
     "Golpe Desarmado"
    ],
    [
     "Dardo",
     "Dardo",
     "Dardo"
    ]
   ]
  },
  "traits": [
   "t_desviarProjetil"
  ],
  "blurb": "Monge veloz que desfere três golpes por turno e pode desarmar, derrubar ou atordoar quem atinge. Também arremessa dardos e desvia projéteis.",
  "lore": "Adeptos de artes marciais são monges disciplinados, moldados por anos de treino no combate corpo a corpo. Alguns guardam mosteiros, enquanto outros percorrem o mundo em busca de iluminação ou de estilos de luta ainda desconhecidos. Há os que se tornam guarda-costas e oferecem lealdade e habilidade em troca de abrigo e comida. São mais comuns em cidades."
 },
 "mestreLadrao": {
  "id": "mestreLadrao",
  "tipo": "humanoide",
  "name": "Mestre Ladrão",
  "nomeOriginal": "Master Thief",
  "fonte": "VGM",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 11,
   "dex": 18,
   "con": 14,
   "int": 11,
   "wis": 11,
   "cha": 12
  },
  "ac": 16,
  "acNote": "armadura de couro batido",
  "maxHp": 83,
  "hpDice": "13d8+26",
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
   "atletismo",
   "percepcao",
   "prestidigitacao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espada Curta",
    "bonus": 7,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Besta Leve",
    "bonus": 7,
    "damage": "1d8+4",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 80,
    "longRangeFt": 320
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Espada Curta",
    "Espada Curta",
    "Espada Curta"
   ]
  },
  "features": [
   "evasion",
   "sneakAttack",
   "uncannyDodge"
  ],
  "sneakAttack": "4d6",
  "traits": [
   "acaoAstuta",
   "esquivaSobrenatural"
  ],
  "blurb": "Ágil e escorregadio, golpeia três vezes com a espada curta e soma 4d6 de dano furtivo quando tem vantagem ou um aliado ao lado do alvo. Usa ação bônus para fugir, se esconder ou se desengajar, e reduz à metade o dano que recebe.",
  "lore": "O mestre ladrão é um criminoso de elite, famoso por golpes ousados que viram lenda nas ruas das cidades. Com o tempo, ganha fama e até admiradores fiéis. Muitos acabam deixando o trabalho de campo para comandar uma guilda de ladrões, liderar operações secretas ou simplesmente desfrutar da fortuna acumulada."
 },
 "demonioBocarra": {
  "id": "demonioBocarra",
  "tipo": "corruptor",
  "name": "Demônio Bocarra",
  "nomeOriginal": "Maw Demon",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 14,
   "dex": 8,
   "con": 13,
   "int": 5,
   "wis": 8,
   "cha": 5
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 33,
  "hpDice": "6d8+6",
  "speedFt": 30,
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
    "name": "Mordida",
    "bonus": 4,
    "damage": "2d8+2",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [
   "rampage"
  ],
  "blurb": "Um saco de dentes que avança mordendo; sempre que derruba alguém a 0 PV, ganha um deslocamento extra e outra mordida no mesmo turno. Resiste a frio, fogo e elétrico e não pode ser envenenado, enfeitiçado nem amedrontado.",
  "lore": "Demônio menor nascido da fome de Yeenoghu, o Senhor da Selvageria, por carnificina e carne mortal. Costuma surgir junto aos bandos de guerra gnolls, invocado em rituais que oferecem humanoides recém-abatidos ao príncipe demônio. Os gnolls não o controlam, mas ele os segue e ataca qualquer presa que o bando encontre. Depois de descansar 8 horas, tudo o que engoliu vai direto para a barriga de Yeenoghu."
 },
 "meenlock": {
  "id": "meenlock",
  "tipo": "feérico",
  "name": "Meenlock",
  "nomeOriginal": "Meenlock",
  "fonte": "VGM",
  "size": "pequeno",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 7,
   "dex": 15,
   "con": 12,
   "int": 11,
   "wis": 10,
   "cha": 8
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 31,
  "hpDice": "7d6+7",
  "speedFt": 30,
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade",
   "sobrevivencia"
  ],
  "expertise": [
   "percepcao",
   "furtividade"
  ],
  "conditionImmunities": [
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 4,
    "damage": "2d4+2",
    "type": "cortante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 11,
     "condition": "paralisado",
     "rounds": 10,
     "repete": true
    }
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Teletransporte Sombrio",
    "recharge": [
     5,
     6
    ],
    "tipo": "teleporte",
    "alcanceFt": 30,
    "bonus": true
   }
  ],
  "aura": {
   "raioFt": 10,
   "quando": "inicioDoAlvo",
   "save": "wis",
   "dc": 11,
   "condition": "amedrontado",
   "imunizaAoPassar": true
  },
  "traits": [
   "aura",
   "sensibilidadeALuz",
   "t_teletransporteSombrio"
  ],
  "blurb": "Salta de sombra em sombra para emboscar, espalhando medo ao redor e paralisando as vítimas com as garras. Evite lutar no escuro e mantenha a luz acesa.",
  "lore": "Meenlocks são fadas deformadas que nascem do pavor, surgindo nas sombras quando o medo domina alguém em lugares tocados pela Agrestia das Fadas. Vivem em túneis estreitos cobertos de musgo negro, geralmente em florestas, mas também se adaptam a cidades e ao subterrâneo. Odeiam a luz e só saem à noite para atacar quem dorme, preferindo as criaturas mais puras e bondosas. Comunicam-se apenas por telepatia, que usam para sussurrar alucinações e torturar prisioneiros arrastados até seus covis. Um humanoide que sucumbe a essa tortura mental se transforma em mais um meenlock."
 },
 "devoradorDeMentesPsionico": {
  "id": "devoradorDeMentesPsionico",
  "tipo": "aberração",
  "name": "Devorador de Mentes Psiônico",
  "nomeOriginal": "Mind Flayer Psion",
  "fonte": "VGM",
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
    "enfeiticarPessoa",
    "comando",
    "compreenderIdiomas",
    "santuario",
    "coroaDaLoucura",
    "forcaFantasmagorica",
    "verOInvisivel",
    "clarividencia",
    "medo",
    "fundirSeComPedra",
    "confusao",
    "videncia",
    "telecinesia",
    "dominarMonstro",
    "viagemPlanar",
    "orientacao",
    "maoMagica",
    "zombariaViciosa",
    "ataqueCerteiro",
    "detectarPensamentos",
    "levitacao"
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
   "porDia": {
    "dominarMonstro": 1,
    "viagemPlanar": 1
   },
   "aVontade": [
    "orientacao",
    "maoMagica",
    "zombariaViciosa",
    "ataqueCerteiro",
    "detectarPensamentos",
    "levitacao"
   ],
   "cdPorMagia": {
    "enfeiticarPessoa": 15,
    "comando": 15,
    "compreenderIdiomas": 15,
    "santuario": 15,
    "coroaDaLoucura": 15,
    "forcaFantasmagorica": 15,
    "verOInvisivel": 15,
    "clarividencia": 15,
    "medo": 15,
    "fundirSeComPedra": 15,
    "confusao": 15,
    "videncia": 15,
    "telecinesia": 15,
    "dominarMonstro": 15,
    "viagemPlanar": 15,
    "orientacao": 15,
    "maoMagica": 15,
    "zombariaViciosa": 15,
    "ataqueCerteiro": 15,
    "detectarPensamentos": 15,
    "levitacao": 15
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Explosão Mental (Recarga 5–6)",
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
  "blurb": "Atordoa grupos com a Explosão Mental e agarra vítimas com os tentáculos para extrair seus cérebros. Também conjura magias psiônicas perigosas, como dominar monstro e confusão.",
  "lore": "É um devorador de mentes que desenvolveu poderes psíquicos muito além dos de seus semelhantes. Vive nas profundezas do Subterrâneo, servindo à colônia illithid como espião, manipulador e conjurador. Prefere enganar, enfeitiçar e dominar suas presas antes de se aproximar para devorá-las. Para ele, outras raças são apenas gado ou ferramentas."
 },
 "testemunhaMental": {
  "id": "testemunhaMental",
  "tipo": "aberração",
  "name": "Testemunha Mental",
  "nomeOriginal": "Mindwitness",
  "fonte": "VGM",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 10,
   "dex": 14,
   "con": 14,
   "int": 15,
   "wis": 15,
   "cha": 10
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 75,
  "hpDice": "10d10+20",
  "speedFt": 0,
  "flyFt": 20,
  "hover": true,
  "speeds": {
   "flyFt": 20
  },
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
  "conditionImmunities": [
   "caido"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "4d6+2",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Tentáculos",
    "bonus": 5,
    "damage": "4d8+2",
    "type": "psíquico",
    "reachFt": 5,
    "onHit": {
     "semResistencia": true,
     "dc": 13,
     "escape": 13,
     "condition": "agarrado",
     "note": "é agarrado"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Tentáculos",
    "Mordida"
   ]
  },
  "raiosOculares": {
   "n": 3,
   "alcanceFt": 120,
   "aoAcaso": true,
   "raios": [
    {
     "nome": "Aversion Ray",
     "save": "cha",
     "dc": 13
    },
    {
     "nome": "Raio do Medo",
     "save": "wis",
     "dc": 13,
     "condition": "amedrontado",
     "rounds": 10,
     "repete": true
    },
    {
     "nome": "Psychic Ray",
     "save": "int",
     "dc": 13,
     "damage": "6d8",
     "damageType": "psíquico",
     "halfOnSave": false
    },
    {
     "nome": "Raio Lento",
     "save": "dex",
     "dc": 13
    },
    {
     "nome": "Stunning Ray",
     "save": "con",
     "dc": 13,
     "condition": "atordoado",
     "rounds": 10,
     "repete": true
    },
    {
     "nome": "Raio Telecinético",
     "save": "str",
     "dc": 13,
     "efeito": "telecinese"
    }
   ]
  },
  "traits": [
   "raiosOculares",
   "t_centralTelepatica"
  ],
  "blurb": "Flutua disparando três raios oculares aleatórios que amedrontam, atordoam, lentificam ou arremessam alvos a até 36 m, e prende quem chega perto com tentáculos psíquicos. Cuidado com o atordoamento: tanto o raio quanto o agarrão podem tirar um herói da luta.",
  "lore": "É um observador capturado pelos devoradores de mentes e transformado no tanque do cérebro ancião, ganhando tentáculos no lugar de alguns pedúnculos. Serve como central de comunicação da colônia ilitida, repassando mensagens telepáticas para vários servos ao mesmo tempo. Menos esperta que um observador comum, foi moldada para obedecer cegamente. Se perde seus mestres, procura qualquer criatura telepática para seguir, adotando até a visão de mundo do novo senhor."
 },
 "morkoth": {
  "id": "morkoth",
  "tipo": "aberração",
  "name": "Morkoth",
  "nomeOriginal": "Morkoth",
  "fonte": "VGM",
  "size": "médio",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 14,
   "dex": 14,
   "con": 14,
   "int": 20,
   "wis": 15,
   "cha": 13
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 130,
  "hpDice": "20d8+40",
  "speedFt": 25,
  "speeds": {
   "swimFt": 50
  },
  "senses": {
   "passivePerception": 20,
   "blindsightFt": 30,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "int",
   "wis"
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
    "damage": "2d6+2",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Tentáculos",
    "bonus": 6,
    "damage": "3d8+2",
    "type": "concussão",
    "reachFt": 15,
    "danoExtra": {
     "damage": "3d8+2",
     "type": "concussão"
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
   "count": 3,
   "sequencias": [
    [
     "Mordida",
     "Mordida",
     "Tentáculos"
    ],
    [
     "Mordida",
     "Mordida",
     "Mordida"
    ]
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [
    "respingoAcido",
    "maoMagica",
    "consertar",
    "raioDeGelo",
    "toqueChocante"
   ],
   "prepared": [
    "detectarMagia",
    "identificar",
    "escudoArcano",
    "raioDeBruxa",
    "escuridao",
    "detectarPensamentos",
    "despedacar",
    "dissiparMagia",
    "relampago",
    "enviarMensagem",
    "dimensaoPorta",
    "tentaculosNegrosDeEvard",
    "missao",
    "videncia",
    "correnteDeRelampagos"
   ],
   "slots": [
    0,
    4,
    3,
    3,
    3,
    3,
    1
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "respingoAcido": 17,
    "maoMagica": 17,
    "consertar": 17,
    "raioDeGelo": 17,
    "toqueChocante": 17,
    "detectarMagia": 17,
    "identificar": 17,
    "escudoArcano": 17,
    "raioDeBruxa": 17,
    "escuridao": 17,
    "detectarPensamentos": 17,
    "despedacar": 17,
    "dissiparMagia": 17,
    "relampago": 17,
    "enviarMensagem": 17,
    "dimensaoPorta": 17,
    "tentaculosNegrosDeEvard": 17,
    "missao": 17,
    "videncia": 17,
    "correnteDeRelampagos": 17
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Hipnose",
    "tipo": "area",
    "shape": "cone",
    "areaFt": 30,
    "save": "wis",
    "dc": 17,
    "condition": "enfeiticado",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [
   "t_reflexaoDeMagia"
  ],
  "blurb": "Aberração conjuradora que hipnotiza os inimigos para puxá-los até suas mordidas e tentáculos, enquanto lança relâmpagos e devolve feitiços que falham contra ela. Perigosa à distância e no corpo a corpo, sobretudo debaixo d'água.",
  "lore": "Os morkoths nasceram dos restos petrificados de um deus da ganância que se partiu no Plano Astral, e cada um habita uma ilha extraplanar que vaga entre os mundos. Essas ilhas são lugares oníricos e caóticos, quentes e úmidos, cheios de objetos e prisioneiros de eras esquecidas. Movidos pela cobiça, eles colecionam tudo o que é raro ou valioso, incluindo criaturas vivas. Não perdoam ladrões e perseguem quem rompe acordos com eles, mas aceitam negociar se lhes oferecerem algo que desejem. Seu covil fica no centro da ilha, uma rede de túneis em grande parte submersa."
 },
 "bocaDeGrolantor": {
  "id": "bocaDeGrolantor",
  "tipo": "gigante",
  "name": "Boca de Grolantor",
  "nomeOriginal": "Mouth of Grolantor",
  "fonte": "VGM",
  "size": "enorme",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 21,
   "dex": 10,
   "con": 18,
   "int": 5,
   "wis": 7,
   "cha": 5
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 105,
  "hpDice": "10d12+40",
  "speedFt": 50,
  "senses": {
   "passivePerception": 11
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 8,
    "damage": "3d6+5",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Soco",
    "bonus": 8,
    "damage": "3d8+5",
    "type": "concussão",
    "reachFt": 10
   }
  ],
  "traits": [
   "t_bocaDaLoucura"
  ],
  "blurb": "Gigante faminto e enlouquecido que avança sempre rumo à criatura mais próxima e ataca de forma aleatória a cada turno. Seus socos de 3 m de alcance batem pesado, e a mordida o cura com o dano que causa.",
  "lore": "Quando um gigante da colina adoece e não consegue manter a comida no estômago, seu clã enxerga nisso um recado de Grolantor. Se a doença não passa, o infeliz é preso e mantido em fome até perder a razão, virando um objeto sagrado que encarna a fome eterna do deus. Magro, agitado e cheio de tiques, ele vive acorrentado ou enjaulado, pois mataria os próprios parentes se escapasse. A tribo só o solta em guerras, ataques ou na defesa desesperada do lar, e depois de se fartar com os inimigos ele desmaia entre os restos, o que facilita recapturá-lo."
 },
 "necromante": {
  "id": "necromante",
  "tipo": "humanoide",
  "name": "Necromante",
  "nomeOriginal": "Necromancer",
  "fonte": "VGM",
  "size": "médio",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 9,
   "dex": 14,
   "con": 12,
   "int": 17,
   "wis": 12,
   "cha": 11
  },
  "ac": 12,
  "acNote": "15 com armadura arcana",
  "maxHp": 66,
  "hpDice": "12d8+12",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11
  },
  "saves": [
   "int",
   "wis"
  ],
  "skills": [
   "arcanismo",
   "historia"
  ],
  "expertise": [],
  "damageResistances": [
   "necrótico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Toque Definhante",
    "bonus": 7,
    "damage": "2d4",
    "type": "necrótico",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "int",
   "cantrips": [
    "toqueArrepiante",
    "luzesDancantes",
    "maoMagica",
    "consertar"
   ],
   "prepared": [
    "vidaFalsa",
    "armaduraArcana",
    "raioDeDoenca",
    "cegueiraSurdez",
    "raioDoEnfraquecimento",
    "teia",
    "animarMortos",
    "rogarMaldicao",
    "toqueVampirico",
    "praga",
    "dimensaoPorta",
    "peleDePedra",
    "maoDeBigby",
    "nuvemMortal",
    "circuloDaMorte"
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
    "toqueArrepiante": 15,
    "luzesDancantes": 15,
    "maoMagica": 15,
    "consertar": 15,
    "vidaFalsa": 15,
    "armaduraArcana": 15,
    "raioDeDoenca": 15,
    "cegueiraSurdez": 15,
    "raioDoEnfraquecimento": 15,
    "teia": 15,
    "animarMortos": 15,
    "rogarMaldicao": 15,
    "toqueVampirico": 15,
    "praga": 15,
    "dimensaoPorta": 15,
    "peleDePedra": 15,
    "maoDeBigby": 15,
    "nuvemMortal": 15,
    "circuloDaMorte": 15
   }
  },
  "traits": [
   "t_colheitaSinistra"
  ],
  "blurb": "Conjurador de 12º nível que debilita e mata à distância com magias de necromancia, como círculo da morte, nuvem mortal e toque vampírico, e se cura a cada vítima abatida. Mantenha pressão sobre ele antes que levante mortos-vivos ou escape com porta dimensional.",
  "lore": "O necromante é um mago especializado no limite entre a vida, a morte e a não-vida. Muitos profanam túmulos para erguer servos mortos-vivos que obedecem sem questionar. Costumam agir em cidades e desertos, escondidos em criptas ou torres isoladas. Uns poucos, porém, usam esse saber sombrio para caçar mortos-vivos e proteger os vivos."
 },
 "neogi": {
  "id": "neogi",
  "tipo": "aberração",
  "name": "Neogi",
  "nomeOriginal": "Neogi",
  "fonte": "VGM",
  "size": "pequeno",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 6,
   "dex": 16,
   "con": 14,
   "int": 13,
   "wis": 12,
   "cha": 15
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 33,
  "hpDice": "6d6+12",
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
   "intimidacao",
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d6",
     "type": "veneno"
    },
    "onHit": {
     "save": "con",
     "dc": 12,
     "condition": "envenenado",
     "rounds": 10,
     "repete": true
    }
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
  "acoesEspeciais": [
   {
    "nome": "Escravizar",
    "tipo": "alvo",
    "alcanceFt": 30,
    "save": "wis",
    "dc": 14,
    "condition": "enfeiticado",
    "rounds": 100,
    "repete": true
   }
  ],
  "traits": [
   "ascendenciaFeerica",
   "spiderClimb"
  ],
  "blurb": "Escala paredes e tetos para morder com um veneno potente que deixa o alvo envenenado, enquanto as garras rasgam. O maior perigo é a escravização mental, que transforma um aliado num servo obediente.",
  "lore": "Os neogi são aberrações parecidas com aranhas gigantes de pescoço e cabeça de enguia, movidas por uma cultura inteira baseada em dominar outros seres. Vivem espalhados por regiões remotas do mundo e de vários planos, viajando em naves de aspecto aracnídeo construídas por escravos, como os brutamontes umbrais. Sua sociedade mede cada indivíduo apenas pela capacidade de controlar os demais, e marcas e tatuagens indicam posição e posse. Comerciam quando lhes convém, mas qualquer cliente fraco corre o risco de virar mercadoria."
 },
 "filhoteDeNeogi": {
  "id": "filhoteDeNeogi",
  "tipo": "aberração",
  "name": "Filhote de Neogi",
  "nomeOriginal": "Neogi Hatchling",
  "fonte": "VGM",
  "size": "miúdo",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 3,
   "dex": 13,
   "con": 10,
   "int": 6,
   "wis": 10,
   "cha": 9
  },
  "ac": 11,
  "maxHp": 7,
  "hpDice": "3d4",
  "speedFt": 20,
  "speeds": {
   "climbFt": 20
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
    "bonus": 3,
    "damage": "1d4+1",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6",
     "type": "veneno"
    },
    "onHit": {
     "save": "con",
     "dc": 10,
     "condition": "envenenado",
     "rounds": 10,
     "repete": true
    }
   }
  ],
  "traits": [
   "ascendenciaFeerica",
   "spiderClimb"
  ],
  "blurb": "Pequeno e frágil, escala paredes e tetos para cair sobre a presa com uma mordida venenosa que pode deixá-la envenenada. É difícil de amedrontar ou enfeitiçar.",
  "lore": "Os neogi são aberrações escravagistas com corpo de aranha grande e pescoço e cabeça de enguia, vindos de um mundo distante e espalhados por vários planos. Quando um neogi envelhece, os outros o transformam numa massa inchada de carne sobre a qual os jovens põem ovos. Ao nascer, os filhotes devoram essa massa e uns aos outros, até sobrarem apenas os mais fortes. Os sobreviventes ficam sob o comando dos adultos e começam o treinamento aprendendo a dominar um jovem brutamonte umbral."
 },
 "mestreNeogi": {
  "id": "mestreNeogi",
  "tipo": "aberração",
  "name": "Mestre Neogi",
  "nomeOriginal": "Neogi Master",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 6,
   "dex": 16,
   "con": 14,
   "int": 16,
   "wis": 12,
   "cha": 18
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 71,
  "hpDice": "11d8+22",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 120
  },
  "saves": [
   "wis"
  ],
  "skills": [
   "arcanismo",
   "enganacao",
   "intimidacao",
   "percepcao",
   "persuasao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d6",
     "type": "veneno"
    },
    "onHit": {
     "save": "con",
     "dc": 12,
     "condition": "envenenado",
     "rounds": 10,
     "repete": true
    }
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
   "ability": "cha",
   "cantrips": [
    "rajadaMistica",
    "orientacao",
    "maoMagica",
    "ilusaoMenor",
    "prestidigitacao",
    "zombariaViciosa"
   ],
   "prepared": [
    "bracosDeHadar",
    "contramagia",
    "dimensaoPorta",
    "medo",
    "imobilizarPessoa",
    "fomeDeHadar",
    "invisibilidade",
    "servoInvisivel"
   ],
   "slots": [
    0,
    0,
    0,
    0,
    2
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "rajadaMistica": 14,
    "orientacao": 14,
    "maoMagica": 14,
    "ilusaoMenor": 14,
    "prestidigitacao": 14,
    "zombariaViciosa": 14,
    "bracosDeHadar": 14,
    "contramagia": 14,
    "dimensaoPorta": 14,
    "medo": 14,
    "imobilizarPessoa": 14,
    "fomeDeHadar": 14,
    "invisibilidade": 14,
    "servoInvisivel": 14
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Escravizar",
    "tipo": "alvo",
    "alcanceFt": 30,
    "save": "wis",
    "dc": 14,
    "condition": "enfeiticado",
    "rounds": 100,
    "repete": true
   }
  ],
  "traits": [
   "ascendenciaFeerica",
   "spiderClimb"
  ],
  "blurb": "Conjurador traiçoeiro que escraviza a mente de um inimigo com Escravizar e castiga o grupo com rajada mística e magias de Hadar. De perto, a mordida venenosa causa muito dano e deixa o alvo envenenado.",
  "lore": "Os neogi parecem aranhas enormes com pescoço e cabeça de enguia, e veem quase todos os outros seres como gado ou servos. Vieram de um mundo distante e viajam por planos e terras remotas em naves de aspecto aracnídeo, muitas vezes tripuladas por brutamontes umber escravizados. Os mestres firmaram pactos com entidades estelares malignas, como Hadar, e delas tiram sua magia. Sua sociedade só reconhece a capacidade de dominar os outros, marcada em tatuagens e tinturas que indicam posição e propriedade. Comerciam quando lhes convém, mas qualquer cliente fraco corre o risco de virar escravo."
 },
 "neotelideo": {
  "id": "neotelideo",
  "tipo": "aberração",
  "name": "Neotelídeo",
  "nomeOriginal": "Neothelid",
  "fonte": "VGM",
  "size": "imenso",
  "level": 13,
  "cr": "13",
  "xp": 10000,
  "abilities": {
   "str": 27,
   "dex": 7,
   "con": 21,
   "int": 3,
   "wis": 16,
   "cha": 12
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 325,
  "hpDice": "21d20+105",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13,
   "blindsightFt": 120
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
    "name": "Tentáculos",
    "bonus": 13,
    "damage": "3d8+8",
    "type": "concussão",
    "reachFt": 15,
    "danoExtra": {
     "damage": "3d8",
     "type": "psíquico"
    },
    "engole": {
     "tamanhoMax": "large",
     "dano": "10d6",
     "tipoDano": "ácido",
     "regurgita": {
      "dano": 30,
      "dc": 18
     },
     "save": "str",
     "dc": 18
    }
   }
  ],
  "breath": {
   "name": "Sopro Ácido (Recarga 5–6)",
   "kind": "save",
   "shape": "cone",
   "areaFt": 60,
   "save": "dex",
   "dc": 18,
   "damage": "10d6",
   "damageType": "ácido",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [],
   "prepared": [
    "confusao",
    "enfraquecerOIntelecto",
    "telecinesia",
    "levitacao"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "confusao": 1,
    "enfraquecerOIntelecto": 1,
    "telecinesia": 1
   },
   "aVontade": [
    "levitacao"
   ],
   "cdPorMagia": {
    "confusao": 16,
    "enfraquecerOIntelecto": 16,
    "telecinesia": 16,
    "levitacao": 16
   }
  },
  "traits": [
   "t_sentirCriaturas",
   "resistenciaAMagia"
  ],
  "blurb": "Verme colossal que golpeia com tentáculos de 4,5 m de alcance e engole presas de tamanho Grande ou menor, dissolvendo-as em ácido. Também cospe um cone de ácido e usa poderes psiônicos como confusão e debilitar mente.",
  "lore": "O neotelídeo nasce quando uma colônia de devoradores de mentes cai e o cérebro ancião morre, deixando os girinos sem dono nem alimento. Famintos, eles se devoram até restar um único sobrevivente, que cresce até virar esse verme gigante e viscoso. Os illithids o consideram uma abominação e caçam qualquer um que surja, até porque sua mente é simples demais para ser percebida pelo cérebro ancião. Selvagem e sem entender os próprios poderes, ele vaga pelo Subterrâneo atrás de cérebros, sem poupar nem os próprios devoradores de mentes."
 },
 "nilbog": {
  "id": "nilbog",
  "tipo": "humanoide",
  "name": "Nilbog",
  "nomeOriginal": "Nilbog",
  "fonte": "VGM",
  "size": "pequeno",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 8,
   "dex": 14,
   "con": 10,
   "int": 10,
   "wis": 8,
   "cha": 15
  },
  "ac": 13,
  "acNote": "armadura de couro",
  "maxHp": 7,
  "hpDice": "2d6",
  "speedFt": 30,
  "senses": {
   "passivePerception": 9,
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
    "name": "Cetro do Bobo",
    "bonus": 4,
    "damage": "1d6+2",
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
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "confusao",
    "maoMagica",
    "risoHisterico",
    "zombariaViciosa"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "confusao": 1
   },
   "aVontade": [
    "maoMagica",
    "risoHisterico",
    "zombariaViciosa"
   ],
   "cdPorMagia": {
    "confusao": 12,
    "maoMagica": 12,
    "risoHisterico": 12,
    "zombariaViciosa": 12
   }
  },
  "traits": [
   "t_nilboguismo",
   "nimbleEscape",
   "t_reviravoltaDaSorte"
  ],
  "blurb": "Quem tenta feri-lo pode acabar enfeitiçado e forçado a elogiá-lo, e o dano que chega até ele pode ser anulado e virar cura. Atormenta à distância com magias de zombaria, riso histérico e confusão.",
  "lore": "O nilbog é o que restou de um deus trapaceiro dos goblins, despedaçado por Maglubiyet, e sobrevive como um espírito invisível que possui goblins quando goblinoides se reúnem em hordas. O goblin possuído vira um piadista atrevido, sem medo de castigo, capaz de fazer os outros agirem contra a própria vontade. Matar o hospedeiro só manda o espírito procurar outro goblin, então a única forma de conter o caos é tratá-lo com respeito e bajulação. Por isso as hordas costumam manter um bobo goblin, livre para fazer o que quiser."
 },
 "laminaDeIlnevalOrc": {
  "id": "laminaDeIlnevalOrc",
  "tipo": "humanoide",
  "name": "Lâmina de Ilneval Orc",
  "nomeOriginal": "Orc Blade of Ilneval",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 17,
   "dex": 11,
   "con": 17,
   "int": 10,
   "wis": 12,
   "cha": 14
  },
  "ac": 18,
  "acNote": "cota de malha e escudo",
  "maxHp": 60,
  "hpDice": "8d8+24",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [
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
    "name": "Espada Longa",
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
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 30,
    "longRangeFt": 120
   }
  ],
  "multiattack": {
   "count": 2,
   "sequencias": [
    [
     "Espada Longa",
     "Espada Longa"
    ],
    [
     "Azagaia",
     "Azagaia"
    ]
   ]
  },
  "traits": [
   "t_comandoDeIlneval",
   "agressivo",
   "t_golpeadorDeInimigosDeIlneval"
  ],
  "blurb": "Guerreiro orc que avança rápido sobre os inimigos e golpeia duas vezes com a espada longa, causando dano extra. Seu brado de comando permite que até três orcs aliados ataquem fora do turno.",
  "lore": "As Lâminas de Ilneval são campeões devotos do deus orc da guerra e da estratégia, servindo como comandantes de campo nas hordas. Lideram pela frente, coordenando os ataques dos guerreiros ao redor. Habitam montanhas, colinas, florestas, campos e até o Subterrâneo, onde quer que suas tribos saqueiem. São brutais, mas mais disciplinados que um orc comum."
 },
 "garraDeLuthicOrc": {
  "id": "garraDeLuthicOrc",
  "tipo": "humanoide",
  "name": "Garra de Luthic Orc",
  "nomeOriginal": "Orc Claw of Luthic",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 14,
   "dex": 15,
   "con": 16,
   "int": 10,
   "wis": 15,
   "cha": 11
  },
  "ac": 14,
  "acNote": "armadura de couro cru",
  "maxHp": 45,
  "hpDice": "6d8+18",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "intimidacao",
   "medicina",
   "sobrevivencia"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 4,
    "damage": "1d8+2",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 4,
   "sequencias": [
    [
     "Garra",
     "Garra"
    ],
    [
     "Garra",
     "Garra",
     "Garra",
     "Garra"
    ]
   ]
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [
    "orientacao",
    "consertar",
    "resistencia",
    "taumaturgia"
   ],
   "prepared": [
    "perdicao",
    "curarFerimentos",
    "raioGuiado",
    "augurio",
    "eloDeProtecao",
    "rogarMaldicao",
    "criarAlimentoAgua"
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
    "orientacao": 12,
    "consertar": 12,
    "resistencia": 12,
    "taumaturgia": 12,
    "perdicao": 12,
    "curarFerimentos": 12,
    "raioGuiado": 12,
    "augurio": 12,
    "eloDeProtecao": 12,
    "rogarMaldicao": 12,
    "criarAlimentoAgua": 12
   }
  },
  "traits": [
   "agressivo"
  ],
  "blurb": "Sacerdotisa orc que alterna magias de cura e maldição com garras afiadas; quando ferida abaixo da metade dos PV, dobra o número de golpes e fica muito mais letal.",
  "lore": "As Garras de Luthic são clérigas devotas da mãe-caverna dos orcs, a deusa da fertilidade e da proteção do lar. Cuidam dos feridos, das crias e das cavernas onde a tribo se abriga, em montanhas e no Subterrâneo. Deixam as unhas crescer como garras em honra à deusa e as usam como armas. Quando o covil é ameaçado, lutam com ferocidade selvagem para defender os seus."
 },
 "orcMaoDeYurtrus": {
  "id": "orcMaoDeYurtrus",
  "tipo": "humanoide",
  "name": "Orc Mão de Yurtrus",
  "nomeOriginal": "Orc Hand of Yurtrus",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 12,
   "dex": 11,
   "con": 16,
   "int": 11,
   "wis": 14,
   "cha": 9
  },
  "ac": 12,
  "acNote": "armadura de couro cru",
  "maxHp": 30,
  "hpDice": "4d8+12",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "arcanismo",
   "intimidacao",
   "medicina",
   "religiao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Toque da Mão Branca",
    "bonus": 3,
    "damage": "2d8",
    "type": "necrótico",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "wis",
   "cantrips": [
    "orientacao",
    "consertar",
    "resistencia",
    "taumaturgia"
   ],
   "prepared": [
    "perdicao",
    "detectarMagia",
    "infligirFerimentos",
    "protecaoBemMal",
    "cegueiraSurdez",
    "silencio"
   ],
   "slots": [
    0,
    4,
    3
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "orientacao": 12,
    "consertar": 12,
    "resistencia": 12,
    "taumaturgia": 12,
    "perdicao": 12,
    "detectarMagia": 12,
    "infligirFerimentos": 12,
    "protecaoBemMal": 12,
    "cegueiraSurdez": 12,
    "silencio": 12
   }
  },
  "traits": [
   "agressivo"
  ],
  "blurb": "Clérigo orc silencioso que avança rápido para tocar o inimigo com energia necrótica e lança magias como perdição, cegueira e silêncio para enfraquecer o grupo.",
  "lore": "As Mãos de Yurtrus são sacerdotes orcs devotados ao deus da morte e da doença, reconhecíveis pelas luvas brancas que usam. Elas cortam a própria língua como sinal de devoção e se comunicam apenas por gestos, embora ainda entendam a fala. Cuidam dos mortos e dos feridos da tribo e são temidas até pelos próprios orcs. Em combate, espalham a podridão de Yurtrus com um simples toque."
 },
 "orcNutridoDeYurtrus": {
  "id": "orcNutridoDeYurtrus",
  "tipo": "humanoide",
  "name": "Orc Nutrido de Yurtrus",
  "nomeOriginal": "Orc Nurtured One of Yurtrus",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 15,
   "dex": 8,
   "con": 16,
   "int": 7,
   "wis": 11,
   "cha": 7
  },
  "ac": 9,
  "maxHp": 30,
  "hpDice": "4d8+12",
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
    "name": "Garras",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d4",
     "type": "necrótico"
    }
   }
  ],
  "explosaoAoMorrer": {
   "pes": 10,
   "save": "con",
   "dc": 13,
   "condicao": "envenenado",
   "rounds": 1,
   "dano": "4d6",
   "tipo": "veneno",
   "metade": true
  },
  "traits": [
   "t_vingancaCorrompida",
   "agressivo",
   "explosaoAoMorrer",
   "t_nutridoDeYurtrus"
  ],
  "blurb": "Avança agressivamente e arranha com garras pútridas, mas o verdadeiro perigo é a explosão venenosa quando cai a 0 PV, algo que ele pode provocar por conta própria. Mantenha distância ao derrubá-lo.",
  "lore": "Esses orcs são devotos de Yurtrus, o deus da morte e da pestilência, e foram expostos a doenças desde jovens até que a podridão se tornasse parte deles. Sua pele é coberta de chagas e eles carregam no corpo uma carga de corrupção pronta para se espalhar. As tribos os usam como armas vivas, lançando-os contra as linhas inimigas. Vivem onde quer que haja orcs, de montanhas e florestas até o Subterrâneo."
 },
 "orcPresaVermelhaDeShargaas": {
  "id": "orcPresaVermelhaDeShargaas",
  "tipo": "humanoide",
  "name": "Orc Presa Vermelha de Shargaas",
  "nomeOriginal": "Orc Red Fang of Shargaas",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 11,
   "dex": 16,
   "con": 15,
   "int": 9,
   "wis": 11,
   "cha": 9
  },
  "ac": 15,
  "acNote": "couro batido",
  "maxHp": 52,
  "hpDice": "8d8+16",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "intimidacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cimitarra",
    "bonus": 5,
    "damage": "3d6+3",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Dardo",
    "bonus": 5,
    "damage": "3d4+3",
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
     "Cimitarra",
     "Cimitarra"
    ],
    [
     "Dardo",
     "Dardo"
    ]
   ]
  },
  "traits": [
   "t_veuDeShargaas",
   "acaoAstuta",
   "t_maoDeShargaas",
   "t_visaoDeShargaas",
   "t_matador"
  ],
  "blurb": "Assassino furtivo que ataca das sombras com cimitarra ou dardos, causando dano extra em cada golpe. No primeiro turno tem vantagem contra quem ainda não agiu, e acertos em alvos surpresos viram críticos; ainda cria escuridão mágica através da qual enxerga.",
  "lore": "Os Presas Vermelhas são orcs devotos de Shargaas, o deus orc da noite e dos segredos. Agem como espiões e matadores da tribo, eliminando sentinelas e líderes inimigos antes de um ataque. Preferem túneis, cavernas e noites sem lua, onde a escuridão é sua aliada. Raramente lutam de frente: golpeiam, somem e voltam a atacar."
 },
 "boi": {
  "id": "boi",
  "tipo": "fera",
  "name": "Boi",
  "nomeOriginal": "Ox",
  "fonte": "VGM",
  "size": "grande",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 18,
   "dex": 10,
   "con": 14,
   "int": 2,
   "wis": 10,
   "cha": 4
  },
  "ac": 10,
  "maxHp": 15,
  "hpDice": "2d10+4",
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
    "name": "Chifrada",
    "bonus": 6,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "investida": {
     "pes": 20,
     "dano": "2d6",
     "tipo": "perfurante"
    }
   }
  ],
  "traits": [
   "t_animalDeCarga"
  ],
  "blurb": "Animal robusto que avança em linha reta e acerta com os chifres; uma investida bem-sucedida causa dano perfurante extra considerável.",
  "lore": "O boi é criado sobretudo para puxar arados, carroças e cargas pesadas, e não tanto pela carne ou pelo leite. É comum em fazendas e pastagens, onde trabalha ao lado de camponeses e mercadores. Costuma ser dócil e paciente, mas reage com força quando é ameaçado ou provocado."
 },
 "quetzalcoatlus": {
  "id": "quetzalcoatlus",
  "tipo": "fera",
  "name": "Quetzalcoatlus",
  "nomeOriginal": "Quetzalcoatlus",
  "fonte": "VGM",
  "size": "enorme",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 15,
   "dex": 13,
   "con": 13,
   "int": 2,
   "wis": 10,
   "cha": 5
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 30,
  "hpDice": "4d12+4",
  "speedFt": 10,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80
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
    "name": "Mordida",
    "bonus": 4,
    "damage": "3d6+2",
    "type": "perfurante",
    "reachFt": 10,
    "investida": {
     "pes": 30,
     "dano": "3d6",
     "tipo": "perfurante",
     "soVoando": true
    }
   }
  ],
  "traits": [
   "voaSemProvocar"
  ],
  "blurb": "Plana alto e mergulha sobre as presas com uma mordida de longo alcance, causando dano extra no mergulho e escapando sem sofrer ataques de oportunidade.",
  "lore": "O quetzalcoatlus é um parente colossal do pteranodonte, com asas que passam de 9 metros de uma ponta à outra. Habita montanhas, colinas e litorais, onde aproveita as correntes de ar para cruzar grandes distâncias. No chão ele se arrasta desajeitado sobre quatro apoios, por isso prefere ficar no céu. Caça descendo em mergulhos rápidos e volta logo para o alto."
 },
 "velocino": {
  "id": "velocino",
  "tipo": "feérico",
  "name": "Velocino",
  "nomeOriginal": "Quickling",
  "fonte": "VGM",
  "size": "miúdo",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 4,
   "dex": 23,
   "con": 13,
   "int": 10,
   "wis": 12,
   "cha": 7
  },
  "ac": 16,
  "maxHp": 10,
  "hpDice": "3d4+3",
  "speedFt": 120,
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "acrobacia",
   "percepcao",
   "prestidigitacao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Adaga",
    "bonus": 8,
    "damage": "1d4+6",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Adaga",
    "Adaga",
    "Adaga"
   ]
  },
  "features": [
   "evasion"
  ],
  "traits": [
   "t_movimentoBorrado"
  ],
  "blurb": "Fada minúscula e veloz que corre a 36 m por turno e desfere três golpes de adaga por rodada. Ataques contra ela têm desvantagem, e ela costuma escapar ilesa de efeitos que exigem teste de Destreza.",
  "lore": "Os velocinos são fadas pequenas e esguias, parecidas com elfos em miniatura de traços selvagens, que habitam florestas sombrias dominadas por fadas malignas, tanto na Agrestia das Fadas quanto no mundo material. Dizem que eram fadas preguiçosas e vaidosas até que a Rainha do Ar e das Trevas, cansada de seus atrasos, as encolheu e acelerou o tempo dentro delas. Por isso enxergam o mundo como algo arrastado e tedioso, e nenhuma vive mais de quinze anos. Passam o tempo pregando peças e causando estragos maldosos, como roubar cartas ou plantar objetos em bolsas alheias, preferindo arruinar vidas e semear discórdia a matar diretamente."
 },
 "dracoGuardiaoVermelho": {
  "id": "dracoGuardiaoVermelho",
  "tipo": "dragão",
  "name": "Draco Guardião Vermelho",
  "nomeOriginal": "Red Guard Drake",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 16,
   "dex": 11,
   "con": 16,
   "int": 4,
   "wis": 10,
   "cha": 7
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 52,
  "hpDice": "7d8+21",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "fogo"
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
    "name": "Cauda",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2
  },
  "traits": [],
  "blurb": "Fera robusta que morde e golpeia com a cauda no mesmo turno, escalando paredes para alcançar intrusos. Resiste a fogo, então chamas pouco a afetam.",
  "lore": "Dracos guardiões são criados por meio de rituais que usam escamas de dragões verdadeiros, e o de escamas vermelhas guarda a cor e a resistência ao fogo de sua origem. São leais ao dono e treinados para vigiar tesouros, portões e covis. Aparecem em montanhas, cidades e no Subterrâneo, onde patrulham sem descanso. Entendem ordens em dracônico, mas não falam, e atacam qualquer estranho que invada o território vigiado."
 },
 "barreteVermelho": {
  "id": "barreteVermelho",
  "tipo": "feérico",
  "name": "Barrete Vermelho",
  "nomeOriginal": "Redcap",
  "fonte": "VGM",
  "size": "pequeno",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 18,
   "dex": 13,
   "con": 18,
   "int": 10,
   "wis": 12,
   "cha": 9
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 45,
  "hpDice": "6d6+24",
  "speedFt": 25,
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
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
    "name": "Foice Cruel",
    "bonus": 6,
    "damage": "2d4+4",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Foice Cruel",
    "Foice Cruel",
    "Foice Cruel"
   ]
  },
  "traits": [
   "t_perseguicaoDeFerro",
   "t_botasDeFerro",
   "t_forcaDesproporcional"
  ],
  "blurb": "Pequeno mas brutalmente forte, avança pisando pesado e desfere três golpes de foice por turno. Seu chute de botas de ferro pode derrubar e esmagar quem estiver ao alcance de uma corrida.",
  "lore": "Fada assassina que brota do solo encharcado de sangue onde alguém matou movido por pura sede de violência, no Agrestão das Fadas ou perto de suas passagens. Parece um gnomo velho e corcunda, de gorro de couro, botas de ferro e uma lâmina pesada. Precisa banhar o gorro em sangue fresco a cada três dias, ou desaparece, então matar é sua forma de sobreviver. Não tem sutileza alguma e busca o confronto direto. Às vezes serve bruxas, magos sombrios ou o próprio assassino que o originou, exigindo sempre vítimas como pagamento."
 },
 "rothe": {
  "id": "rothe",
  "tipo": "fera",
  "name": "Rothé",
  "nomeOriginal": "Rothé",
  "fonte": "VGM",
  "size": "grande",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 18,
   "dex": 10,
   "con": 14,
   "int": 2,
   "wis": 10,
   "cha": 4
  },
  "ac": 10,
  "maxHp": 15,
  "hpDice": "2d10+4",
  "speedFt": 30,
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
    "name": "Chifrada",
    "bonus": 6,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "investida": {
     "pes": 20,
     "dano": "2d6",
     "tipo": "perfurante"
    }
   }
  ],
  "traits": [],
  "blurb": "Investe em linha reta contra o alvo e o atinge com os chifres, causando dano extra quando ganha embalo. Sozinho é frágil, mas em manada pode derrubar aventureiros desatentos.",
  "lore": "O rothé comum é um bovino robusto e peludo, parecido com um boi-almiscarado. Vive em manadas nas pradarias e campos abertos, pastando sob a vigilância dos machos mais fortes. Enxerga no escuro a curta distância, o que o ajuda a perceber predadores durante a noite. Muitos povos o criam pela carne, pelo leite e pelo couro."
 },
 "criaDoMar": {
  "id": "criaDoMar",
  "tipo": "humanoide",
  "name": "Cria do Mar",
  "nomeOriginal": "Sea Spawn",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 15,
   "dex": 8,
   "con": 15,
   "int": 6,
   "wis": 10,
   "cha": 8
  },
  "ac": 11,
  "acNote": "armadura natural",
  "maxHp": 32,
  "hpDice": "5d8+10",
  "speedFt": 20,
  "speeds": {
   "swimFt": 30
  },
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
    "name": "Golpe Desarmado",
    "bonus": 4,
    "damage": "1d4+2",
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
  "traits": [
   "t_anatomiaPisciana",
   "t_anfibioLimitado"
  ],
  "blurb": "Ataca três vezes por turno com socos e uma parte do corpo marinha: mordida, espinhos venenosos que envenenam ou um tentáculo que agarra a 3 m. Lenta em terra, mas ágil na água.",
  "lore": "Pessoas reclamadas pelo oceano e transformadas em servos de poderes das profundezas, como krakens, bruxas do mar e marids. O corpo ganha corais, cracas, guelras e traços de peixes, polvos ou ouriços, variando de um indivíduo para outro. Presas a um pacto sombrio ou a uma maldição, acabam amando a própria servidão. Vivem no mar e nas costas, e não sobrevivem muito tempo longe da água salgada."
 },
 "mastimDasSombras": {
  "id": "mastimDasSombras",
  "tipo": "monstruosidade",
  "name": "Mastim das Sombras",
  "nomeOriginal": "Shadow Mastiff",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 13,
   "int": 5,
   "wis": 12,
   "cha": 5
  },
  "ac": 12,
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
   "t_percepcaoEterea",
   "keenHearingSmell",
   "t_mesclarSeAsSombras",
   "sunlightSensitivity"
  ],
  "blurb": "Caçador que some na penumbra e ataca invisível, derrubando a presa com mordidas; na escuridão resiste a armas comuns, mas sofre sob a luz do sol.",
  "lore": "São cães negros vindos do Pendor das Sombras, que atravessam para o Plano Material onde a fronteira entre os mundos é fina e sombria. Caçam em matilhas comandadas por um alfa, o mais esperto e resistente do bando, cujo uivo aterroriza as presas e sinaliza o ataque. Cultos de divindades da noite, como Shar, os invocam para servir de sentinelas, guarda-costas e carrascos de hereges, e vilões poderosos também os usam para vigiar suas fortalezas. Por enxergarem o Plano Etéreo, são guardiões excelentes contra intrusos espirituais."
 },
 "shoosuva": {
  "id": "shoosuva",
  "tipo": "corruptor",
  "name": "Shoosuva",
  "nomeOriginal": "Shoosuva",
  "fonte": "VGM",
  "size": "grande",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 18,
   "dex": 13,
   "con": 17,
   "int": 7,
   "wis": 14,
   "cha": 9
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 110,
  "hpDice": "13d10+39",
  "speedFt": 40,
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
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
    "name": "Mordida",
    "bonus": 7,
    "damage": "4d10+4",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Ferrão da Cauda",
    "bonus": 7,
    "damage": "2d8+4",
    "type": "perfurante",
    "reachFt": 15,
    "onHit": {
     "save": "con",
     "dc": 14,
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
    "Ferrão da Cauda"
   ]
  },
  "traits": [
   "rampage"
  ],
  "blurb": "Demônio-hiena que morde com força brutal e usa o ferrão da cauda, com 4,5 m de alcance, para envenenar e paralisar. Quando abate alguém, avança e morde de novo.",
  "lore": "O shoosuva é um demônio em forma de hiena que Yeenoghu concede aos gnolls mais poderosos, em geral a uma presa de Yeenoghu. Ele surge do Abismo numa nuvem de fumaça fétida logo depois de um bando conquistar uma grande vitória. Cada um fica ligado a um gnoll específico e luta ao lado dele. Em combate, prende uma vítima nas mandíbulas enquanto o ferrão paralisa outra, que vira presa fácil para os gnolls por perto. O gnoll que recebe um shoosuva só fica abaixo de um flind na hierarquia do bando."
 },
 "rastejadorRastreador": {
  "id": "rastejadorRastreador",
  "tipo": "gosma",
  "name": "Rastejador Rastreador",
  "nomeOriginal": "Slithering Tracker",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 16,
   "dex": 19,
   "con": 15,
   "int": 10,
   "wis": 14,
   "cha": 11
  },
  "ac": 14,
  "maxHp": 32,
  "hpDice": "5d8+10",
  "speedFt": 30,
  "speeds": {
   "swimFt": 30,
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 12,
   "blindsightFt": 120
  },
  "saves": [],
  "skills": [
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
  "damageVulnerabilities": [
   "frio",
   "fogo"
  ],
  "conditionImmunities": [
   "cego",
   "surdo",
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
    "name": "Pancada",
    "bonus": 5,
    "damage": "1d10+3",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "traits": [
   "t_sanguessugaVital",
   "emboscador",
   "transfereDano",
   "aparenciaFalsa",
   "t_rastreadorAgucado",
   "formaFluida",
   "spiderClimb",
   "t_furtividadeAquatica"
  ],
  "blurb": "Uma poça viva que embosca a presa, envolve o corpo dela e a afoga enquanto drena seu sangue com dano necrótico a cada turno. Enquanto segura alguém, divide com a vítima metade do dano que recebe, mas fogo e frio o ferem em dobro.",
  "lore": "É o que resta de alguém que aceitou um ritual de vingança conduzido por bruxas, liches ou sacerdotes de deuses vingativos: o corpo seca e morre, mas a mente sobrevive numa poça de líquido consciente. Ele desliza por frestas e esgotos, provando o chão em busca de qualquer rastro do alvo. Para matar, ergue-se e cobre a vítima, sufocando-a e sugando seu sangue, o que depois o deixa tingido de vermelho e mais fácil de seguir. Cumprida a vingança, alguns passam a caçar aliados do alvo original, mas a maioria enlouquece e ataca qualquer um até ser destruída."
 },
 "criaDeKyuss": {
  "id": "criaDeKyuss",
  "tipo": "morto-vivo",
  "name": "Cria de Kyuss",
  "nomeOriginal": "Spawn of Kyuss",
  "fonte": "VGM",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 16,
   "dex": 11,
   "con": 18,
   "int": 5,
   "wis": 7,
   "cha": 3
  },
  "ac": 10,
  "maxHp": 76,
  "hpDice": "9d8+36",
  "speedFt": 30,
  "senses": {
   "passivePerception": 8,
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
   "exausto",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 6,
    "damage": "1d6+3",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6",
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
  "acoesEspeciais": [
   {
    "nome": "Verme Escavador",
    "tipo": "alvo",
    "alcanceFt": 10,
    "save": "dex",
    "dc": 11,
    "damage": "2d6",
    "damageType": "necrótico",
    "halfOnSave": false
   }
  ],
  "regeneracao": {
   "pv": 10,
   "bloqueia": [
    "fogo",
    "ácido",
    "radiante"
   ]
  },
  "traits": [
   "regeneracaoDoLivro",
   "t_vermes"
  ],
  "blurb": "Morto-vivo que golpeia com garras necróticas e arremessa vermes que se enterram na carne, causando dano necrótico crescente e transformando as vítimas em novas crias. Regenera 10 PV por turno, a menos que sofra dano de ácido, fogo ou radiante.",
  "lore": "As crias de Kyuss nasceram dos rituais de um sumo sacerdote de Orcus, e seus seguidores ainda repetem esses ritos séculos depois. À distância parecem zumbis comuns, mas de perto revelam dezenas de vermes verdes rastejando pelo corpo. Esses vermes saltam sobre humanoides, cavam até o cérebro e reanimam o cadáver como uma nova cria, prendendo a alma lá dentro até que o corpo seja destruído. Sozinhas, vagam sem rumo e atacam qualquer ser vivo apenas para se multiplicar. Não precisam respirar, comer, beber nem dormir."
 },
 "estegossauro": {
  "id": "estegossauro",
  "tipo": "fera",
  "name": "Estegossauro",
  "nomeOriginal": "Stegosaurus",
  "fonte": "VGM",
  "size": "enorme",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 20,
   "dex": 9,
   "con": 17,
   "int": 2,
   "wis": 11,
   "cha": 5
  },
  "ac": 13,
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
    "name": "Cauda",
    "bonus": 7,
    "damage": "6d6+5",
    "type": "perfurante",
    "reachFt": 10
   }
  ],
  "traits": [],
  "blurb": "Um herbívoro enorme e robusto que se defende golpeando com a cauda cravejada de espinhos, capaz de causar dano perfurante devastador a até 3 metros de distância.",
  "lore": "O estegossauro é um dinossauro maciço, com fileiras de placas ósseas ao longo do dorso. Sua cauda flexível termina em espinhos e fica erguida, pronta para afastar predadores. Costuma andar em manadas que reúnem jovens e adultos. É encontrado em campos abertos e florestas, onde pasta tranquilo até se sentir ameaçado."
 },
 "vacaFedorenta": {
  "id": "vacaFedorenta",
  "tipo": "fera",
  "name": "Vaca Fedorenta",
  "nomeOriginal": "Stench Kow",
  "fonte": "VGM",
  "size": "grande",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 18,
   "dex": 10,
   "con": 14,
   "int": 2,
   "wis": 10,
   "cha": 4
  },
  "ac": 10,
  "maxHp": 15,
  "hpDice": "2d10+4",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
   "veneno"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Chifrada",
    "bonus": 6,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "investida": {
     "pes": 20,
     "dano": "2d6",
     "tipo": "perfurante"
    }
   }
  ],
  "aura": {
   "raioFt": 5,
   "quando": "inicioDoAlvo",
   "save": "con",
   "dc": 12,
   "condition": "envenenado",
   "imunizaAoPassar": true
  },
  "traits": [
   "aura"
  ],
  "blurb": "Investe em linha reta para cravar os chifres com dano extra, e seu fedor pode envenenar quem fica colado nela. Resiste a frio, fogo e veneno.",
  "lore": "A vaca fedorenta é um bisão disforme, de pelagem laranja e verde, originário dos Planos Inferiores. Criada nesses reinos hostis, aguenta calor, frio e toxinas que matariam um animal comum. Costuma ser vista em rebanhos pastando terras infernais, e às vezes acaba servindo de gado ou montaria para os habitantes desses planos. Exala um cheiro tão podre que nauseia qualquer um que se aproxime."
 },
 "giganteDasPedrasAndarilhoDosSonhos": {
  "id": "giganteDasPedrasAndarilhoDosSonhos",
  "tipo": "gigante",
  "name": "Gigante das Pedras Andarilho dos Sonhos",
  "nomeOriginal": "Stone Giant Dreamwalker",
  "fonte": "VGM",
  "size": "enorme",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 23,
   "dex": 14,
   "con": 21,
   "int": 10,
   "wis": 8,
   "cha": 12
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 161,
  "hpDice": "14d12+70",
  "speedFt": 40,
  "senses": {
   "passivePerception": 13,
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
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Clava Grande",
    "bonus": 10,
    "damage": "3d8+6",
    "type": "concussão",
    "reachFt": 15
   },
   {
    "name": "Rocha",
    "bonus": 10,
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
   "t_toquePetrificante",
   "t_encantoDoAndarilhoDosSonhos"
  ],
  "blurb": "Enfeitiça quem chega perto e depois transforma as vítimas em pedra, grudando-as no próprio corpo; quando não alcança, esmaga com o clava grande ou arremessa rochas que derrubam.",
  "lore": "Para os gigantes das pedras, a superfície é um sonho passageiro onde nada tem peso real. Alguns que vagam por lá, por curiosidade, busca de inspiração ou exílio, acabam se perdendo nesse sonho e se tornam andarilhos. A solidão e a vergonha os enlouquecem, e essa loucura se espalha para quem se aproxima. Agindo sem medo de consequências, colecionam objetos e seres que julgam importantes, que vão se incrustando em pedra sobre seus corpos. Ainda assim, outros gigantes os respeitam como guias valiosos do mundo de cima."
 },
 "quintessenteGiganteDasTempestades": {
  "id": "quintessenteGiganteDasTempestades",
  "tipo": "gigante",
  "name": "Quintessente Gigante das Tempestades",
  "nomeOriginal": "Storm Giant Quintessent",
  "fonte": "VGM",
  "size": "enorme",
  "level": 13,
  "cr": "16",
  "xp": 15000,
  "abilities": {
   "str": 29,
   "dex": 14,
   "con": 20,
   "int": 17,
   "wis": 20,
   "cha": 19
  },
  "ac": 12,
  "maxHp": 230,
  "hpDice": "20d12+100",
  "speedFt": 50,
  "flyFt": 50,
  "hover": true,
  "speeds": {
   "flyFt": 50,
   "swimFt": 50
  },
  "senses": {
   "passivePerception": 20,
   "truesightFt": 60
  },
  "saves": [
   "str",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "historia"
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
   "elétrico",
   "trovejante"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espada de Relâmpago",
    "bonus": 14,
    "damage": "9d6+9",
    "type": "elétrico",
    "reachFt": 15
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Espada de Relâmpago",
    "Espada de Relâmpago"
   ]
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Rajada",
     "custo": 1,
     "tipo": "alvo",
     "alcanceFt": 60,
     "save": "str",
     "dc": 18
    },
    {
     "nome": "Raio Trovejante",
     "custo": 2,
     "tipo": "alvo",
     "alcanceFt": 600,
     "save": "dex",
     "dc": 18,
     "damage": "4d10",
     "damageType": "trovejante",
     "halfOnSave": true
    }
   ]
  },
  "traits": [
   "t_dardoDeVento",
   "acoesLendarias"
  ],
  "blurb": "Golpeia com espadas de relâmpago de 4,5 m de alcance ou arremessa dardos de vento infalíveis a até 180 m. Com ações lendárias empurra inimigos, dispara trovões e pode se dissolver na tempestade do covil.",
  "lore": "Alguns gigantes das tempestades, perto do fim da vida, recusam a morte e se fundem aos elementos, tornando-se tempestades semiconscientes. Uma nevasca eterna num pico, um redemoinho em volta de uma ilha ou uma tormenta costeira sem fim podem ser um desses gigantes. Eles abandonam armas e armaduras e moldam armas do próprio ar, que somem quando não servem mais. Podem retomar o corpo de gigante por pouco tempo, para conversar com mortais, cumprir uma tarefa ou expulsar invasores. Seu covil é um lugar isolado e marcante, envolto pela tempestade que ele se tornou."
 },
 "enxameDeRatosCranianos": {
  "id": "enxameDeRatosCranianos",
  "tipo": "fera",
  "name": "Enxame de Ratos Cranianos",
  "nomeOriginal": "Swarm of Cranium Rats",
  "fonte": "VGM",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 9,
   "dex": 14,
   "con": 10,
   "int": 15,
   "wis": 11,
   "cha": 14
  },
  "ac": 12,
  "maxHp": 36,
  "hpDice": "8d8",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 30
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
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "confusao",
    "dominarMonstro",
    "comando",
    "compreenderIdiomas",
    "detectarPensamentos"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "confusao": 1,
    "dominarMonstro": 1
   },
   "aVontade": [
    "comando",
    "compreenderIdiomas",
    "detectarPensamentos"
   ],
   "cdPorMagia": {
    "confusao": 13,
    "dominarMonstro": 13,
    "comando": 13,
    "compreenderIdiomas": 13,
    "detectarPensamentos": 13
   }
  },
  "traits": [
   "t_iluminacao",
   "enxameDoLivro",
   "t_veuTelepatico"
  ],
  "blurb": "Uma massa de ratos de cérebro exposto que envolve os inimigos com mordidas e, enquanto está acima da metade dos PV, usa poderes psiônicos como comando, confusão e dominar monstro. Resiste a dano físico comum e ignora a maioria das condições.",
  "lore": "Ratos cranianos são roedores alterados pelos devoradores de mentes, com o cérebro brilhando à mostra sob a pele. Sozinhos são pouco mais que espiões, mas reunidos em enxame compartilham uma mente coletiva astuta e cruel. Infestam cidades e túneis do Subterrâneo, coletando segredos e manipulando pessoas para seus mestres ilitides. Quanto mais ratos se juntam, mais forte fica o intelecto do grupo."
 },
 "enxameDeLarvasPutrefatas": {
  "id": "enxameDeLarvasPutrefatas",
  "tipo": "fera",
  "name": "Enxame de Larvas Putrefatas",
  "nomeOriginal": "Swarm of Rot Grubs",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 2,
   "dex": 7,
   "con": 10,
   "int": 1,
   "wis": 2,
   "cha": 1
  },
  "ac": 8,
  "maxHp": 22,
  "hpDice": "5d8",
  "speedFt": 5,
  "speeds": {
   "climbFt": 5
  },
  "senses": {
   "passivePerception": 6,
   "blindsightFt": 10
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
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
   "contido"
  ],
  "traits": [
   "t_mordidas",
   "enxameDoLivro"
  ],
  "blurb": "Uma massa lenta de larvas que invade o espaço da vítima e se enterra na carne dela, causando dano a cada turno até ser queimada ou curada. Quem cai a 0 PV infestado morre na hora.",
  "lore": "Larvas putrefatas são vermes do tamanho de um dedo que devoram carne viva ou morta e, na falta dela, até matéria vegetal. Escondem-se em cadáveres e montes de restos apodrecidos nos pântanos e no Subterrâneo, atacando quem as perturba. Uma vez sob a pele, avançam por instinto rumo ao coração do hospedeiro. Mesmo uma única larva é perigosa ao contato, mas em enxame tornam-se uma armadilha mortal para exploradores descuidados. Fogo aplicado logo após a mordida ou magia que cure doenças são as melhores defesas."
 },
 "espadachim": {
  "id": "espadachim",
  "tipo": "humanoide",
  "name": "Espadachim",
  "nomeOriginal": "Swashbuckler",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 12,
   "dex": 18,
   "con": 12,
   "int": 14,
   "wis": 11,
   "cha": 15
  },
  "ac": 17,
  "acNote": "armadura de couro",
  "maxHp": 66,
  "hpDice": "12d8+12",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10
  },
  "saves": [],
  "skills": [
   "acrobacia",
   "atletismo",
   "persuasao"
  ],
  "expertise": [
   "acrobacia",
   "atletismo",
   "persuasao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Adaga",
    "bonus": 6,
    "damage": "1d4+4",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60
   },
   {
    "name": "Rapieira",
    "bonus": 6,
    "damage": "1d8+4",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Rapieira",
    "Rapieira"
   ]
  },
  "traits": [
   "acaoAstuta",
   "t_defesaElegante"
  ],
  "blurb": "Duelista ágil que golpeia com rapieira e adaga três vezes por turno e depois se afasta com ação bônus, sem provocar ataques. Difícil de acertar e de prender num lugar.",
  "lore": "Espadachins são aventureiros galantes e pouco confiáveis que seguem apenas o próprio código de honra. Buscam fama, colecionam romances passageiros e costumam ganhar a vida como piratas ou corsários. Raramente ficam muito tempo no mesmo porto, preferindo cidades costeiras e o convés de navios."
 },
 "tanarukk": {
  "id": "tanarukk",
  "tipo": "corruptor",
  "name": "Tanarukk",
  "nomeOriginal": "Tanarukk",
  "fonte": "VGM",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 18,
   "dex": 13,
   "con": 20,
   "int": 9,
   "wis": 9,
   "cha": 9
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 95,
  "hpDice": "10d8+50",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "intimidacao",
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "fogo",
   "veneno"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": "1d8+4",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Espada Grande",
    "bonus": 7,
    "damage": "2d6+4",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Espada Grande"
   ]
  },
  "revide": {
   "nome": "Fúria Desenfreada",
   "arma": "Mordida",
   "vantagem": true
  },
  "traits": [
   "agressivo",
   "resistenciaAMagia",
   "t_furiaDesenfreada"
  ],
  "blurb": "Avança furioso como ação bônus e despedaça com mordida e espada grande; quem o golpeia corpo a corpo leva um contra-ataque com vantagem.",
  "lore": "O tanarukk é um orc deformado pela influência demoníaca, geralmente fruto de rituais em que xamãs orcs ofertam suas crias a senhores do Abismo. Tem pele escamosa, presas enormes e uma sede de violência que nem os próprios orcs conseguem conter. Os chefes tribais o usam como arma viva, soltando-o à frente das hordas nas montanhas, colinas e túneis do Subterrâneo. Fora de combate, costuma ficar acorrentado ou isolado, pois ataca até aliados quando não há inimigos por perto."
 },
 "espinhento": {
  "id": "espinhento",
  "tipo": "planta",
  "name": "Espinhento",
  "nomeOriginal": "Thorny",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 13,
   "dex": 12,
   "con": 13,
   "int": 2,
   "wis": 10,
   "cha": 6
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 27,
  "hpDice": "5d8+5",
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
   "percepcao"
  ],
  "damageResistances": [
   "elétrico",
   "perfurante"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 3,
    "damage": "2d6+1",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "regeneracao": {
   "pv": 5,
   "bloqueia": [
    "fogo",
    "frio",
    "necrótico"
   ],
   "naoMorreA0": true
  },
  "traits": [
   "camuflagemGeral",
   "regeneracaoDoLivro",
   "t_corpoEspinhoso"
  ],
  "blurb": "Fera vegetal coberta de espinhos que morde com força e se regenera a cada turno; só fogo, frio ou dano necrótico interrompem sua recuperação. Agarrá-la machuca quem tenta.",
  "lore": "O espinhento nasce quando um animal, como um cão ou um urso, morre infestado pelo mofo-ferrugem. Em vez de um vegepigmeu de forma humanoide, o cadáver dá origem a essa criatura bestial, maior e mais feroz, com o corpo eriçado de espinhos. É menos inteligente que os vegepigmeus e costuma acompanhar suas tribos como fera de caça. Vive em florestas densas, pântanos e subterrâneos quentes e úmidos, onde quase não entra luz do sol."
 },
 "tlincalli": {
  "id": "tlincalli",
  "tipo": "monstruosidade",
  "name": "Tlincalli",
  "nomeOriginal": "Tlincalli",
  "fonte": "VGM",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 16,
   "dex": 13,
   "con": 16,
   "int": 8,
   "wis": 12,
   "cha": 8
  },
  "ac": 15,
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
   "percepcao",
   "furtividade",
   "sobrevivencia"
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
    "name": "Corrente Cravejada",
    "bonus": 6,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 11,
     "escape": 11,
     "condition": "contido",
     "note": "é agarrado"
    }
   },
   {
    "name": "Ferrão",
    "bonus": 6,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d6",
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
   "count": 2,
   "sequencias": [
    [
     "Espada Longa",
     "Ferrão"
    ],
    [
     "Corrente Cravejada",
     "Ferrão"
    ]
   ]
  },
  "traits": [],
  "blurb": "Prende a presa com a corrente cravejada a 3 m de distância e depois crava o ferrão venenoso, que pode deixar a vítima paralisada. Sozinho, já é um caçador paciente e perigoso no corpo a corpo.",
  "lore": "Os tlincallis, chamados também de povo-escorpião, têm torso de humanoide sobre um enorme corpo de escorpião coberto de quitina, com ferrão na ponta da cauda. Vagam em tribos pelos desertos, caçando ao amanhecer e ao entardecer e se enterrando na areia ou se abrigando em ruínas para fugir do calor e do frio. Quando há filhotes para alimentar, paralisam vítimas, amarram-nas a cactos ou rochas e deixam que as crias recém-nascidas as devorem vivas. Orgulhosos de sua habilidade como caçadores, podem se submeter a um predador mais forte, fugir dele ou lutar até a morte. Não constroem cidades nem mineram, mas derretem metal recolhido para forjar armas rudes."
 },
 "transmutador": {
  "id": "transmutador",
  "tipo": "humanoide",
  "name": "Transmutador",
  "nomeOriginal": "Transmuter",
  "fonte": "VGM",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 9,
   "dex": 14,
   "con": 11,
   "int": 17,
   "wis": 12,
   "cha": 11
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
   "arcanismo",
   "historia"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Bordão",
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
   "ability": "int",
   "cantrips": [
    "luz",
    "consertar",
    "prestidigitacao",
    "raioDeGelo"
   ],
   "prepared": [
    "orbeCromatico",
    "recuoAcelerado",
    "armaduraArcana",
    "alterarAparencia",
    "imobilizarPessoa",
    "abrir",
    "piscar",
    "bolaDeFogo",
    "lentidao",
    "metamorfose",
    "peleDePedra",
    "telecinesia"
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
    "luz": 14,
    "consertar": 14,
    "prestidigitacao": 14,
    "raioDeGelo": 14,
    "orbeCromatico": 14,
    "recuoAcelerado": 14,
    "armaduraArcana": 14,
    "alterarAparencia": 14,
    "imobilizarPessoa": 14,
    "abrir": 14,
    "piscar": 14,
    "bolaDeFogo": 14,
    "lentidao": 14,
    "metamorfose": 14,
    "peleDePedra": 14,
    "telecinesia": 14
   }
  },
  "traits": [
   "t_pedraDoTransmutador"
  ],
  "blurb": "Mago que muda o corpo e o campo de batalha: lentidão, polimorfia, bola de fogo e telecinese. A pedra mágica que carrega adapta suas defesas a cada magia de transmutação lançada.",
  "lore": "Transmutadores são magos especializados na arte de transformar a matéria e os seres vivos. Detestam a estagnação e enxergam na mudança o caminho para fortuna, sabedoria ou até divindade. Costumam viver em cidades, onde encontram recursos, bibliotecas e clientes para seus experimentos. Sempre levam consigo uma pedra encantada que eles mesmos forjaram."
 },
 "armadilheiro": {
  "id": "armadilheiro",
  "tipo": "monstruosidade",
  "name": "Armadilheiro",
  "nomeOriginal": "Trapper",
  "fonte": "VGM",
  "size": "grande",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 17,
   "dex": 10,
   "con": 17,
   "int": 2,
   "wis": 13,
   "cha": 4
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 85,
  "hpDice": "10d10+30",
  "speedFt": 10,
  "speeds": {
   "climbFt": 10
  },
  "senses": {
   "passivePerception": 11,
   "blindsightFt": 30,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "traits": [
   "t_sufocar",
   "aparenciaFalsa",
   "spiderClimb"
  ],
  "blurb": "Fica imóvel e camuflado no teto, chão ou parede até a presa chegar perto, então se solta e a envolve. A vítima fica cega, contida e sufocando, sofrendo dano de esmagamento e ácido a cada turno.",
  "lore": "O armadilheiro é uma criatura achatada, parecida com uma arraia, que vive em cavernas, masmorras e ambientes naturais. Sua face externa muda de cor e textura para imitar pedra, terra ou madeira, enquanto a face macia se gruda à superfície onde caça. Precisa de pouca comida e pode passar meses hibernando sem perder a noção de quem se aproxima. Depois de digerir a vítima, deixa ossos, metal e tesouros espalhados, que acabam servindo de isca para a próxima presa."
 },
 "ulitharid": {
  "id": "ulitharid",
  "tipo": "aberração",
  "name": "Ulitharid",
  "nomeOriginal": "Ulitharid",
  "fonte": "VGM",
  "size": "grande",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 15,
   "dex": 12,
   "con": 15,
   "int": 21,
   "wis": 19,
   "cha": 21
  },
  "ac": 15,
  "acNote": "peitoral",
  "maxHp": 127,
  "hpDice": "17d10+14",
  "speedFt": 30,
  "senses": {
   "passivePerception": 18,
   "darkvisionFt": 120
  },
  "saves": [
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "intuicao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Tentáculos",
    "bonus": 9,
    "damage": "4d10+5",
    "type": "psíquico",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 14,
     "escape": 14,
     "condition": "agarrado",
     "note": "é agarrado"
    }
   },
   {
    "name": "Extrair Cérebro",
    "bonus": 9,
    "damage": "10d10",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "confusao",
    "dominarMonstro",
    "olharPerturbador",
    "enfraquecerOIntelecto",
    "sugestaoEmMassa",
    "viagemPlanar",
    "videncia",
    "telecinesia",
    "detectarPensamentos",
    "levitacao"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "confusao": 1,
    "dominarMonstro": 1,
    "olharPerturbador": 1,
    "enfraquecerOIntelecto": 1,
    "sugestaoEmMassa": 1,
    "viagemPlanar": 1,
    "videncia": 1,
    "telecinesia": 1
   },
   "aVontade": [
    "detectarPensamentos",
    "levitacao"
   ],
   "cdPorMagia": {
    "confusao": 17,
    "dominarMonstro": 17,
    "olharPerturbador": 17,
    "enfraquecerOIntelecto": 17,
    "sugestaoEmMassa": 17,
    "viagemPlanar": 17,
    "videncia": 17,
    "telecinesia": 17,
    "detectarPensamentos": 17,
    "levitacao": 17
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
    "dc": 17,
    "damage": "4d12+5",
    "damageType": "psíquico",
    "halfOnSave": false,
    "condition": "atordoado",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [
   "t_sentirCriaturas",
   "resistenciaAMagia",
   "t_nucleoPsionico"
  ],
  "blurb": "Devorador de mentes ampliado que agarra e atordoa com seis tentáculos, arranca o cérebro de vítimas indefesas e dispara uma rajada psíquica em cone capaz de atordoar um grupo inteiro. Ainda conta com magias poderosas como dominar monstro e enfraquecer intelecto.",
  "lore": "Em raríssimas ocasiões, um girino do tanque de salmoura de um cérebro ancião gera um ulitharid, um devorador de mentes maior, mais forte e dotado de seis tentáculos. Os outros illithids sentem por instinto que a vida dele vale mais que a deles, e o cérebro ancião costuma tratá-lo como servo predileto ou como rival a ser contido. Quando não tolera mais dividir o comando, o ulitharid parte com um grupo de seguidores para fundar uma colônia nova. Ele carrega um cajado de metal negro que, no fim da vida, abre seu crânio para que o cérebro seja plantado no próprio cadáver dissolvido e cresça como um novo cérebro ancião."
 },
 "vargouille": {
  "id": "vargouille",
  "tipo": "corruptor",
  "name": "Vargouille",
  "nomeOriginal": "Vargouille",
  "fonte": "VGM",
  "size": "miúdo",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 6,
   "dex": 14,
   "con": 14,
   "int": 4,
   "wis": 7,
   "cha": 2
  },
  "ac": 12,
  "maxHp": 13,
  "hpDice": "3d4+6",
  "speedFt": 5,
  "flyFt": 40,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 8,
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
    "bonus": 4,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d6",
     "type": "veneno"
    }
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Grito Atordoante",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 30,
    "save": "wis",
    "dc": 12,
    "condition": "amedrontado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "traits": [
   "t_beijo"
  ],
  "blurb": "Voa em bandos e solta um grito que deixa humanoides e feras amedrontados e atordoados; depois beija as vítimas indefesas com uma maldição que as transforma em novos vargouilles. A mordida também injeta muito veneno.",
  "lore": "É um demônio menor com aparência de cabeça decepada, que voa batendo asas de morcego no lugar das orelhas. Surge em enxames nos céus e cavernas do Abismo, onde os demônios mais fortes mal lhe dão atenção e ele sobrevive lambendo o sangue de outros ínferos. Faminto por presas vivas, tenta escapar para outros planos, muitas vezes agarrado como um carrapato a demônios convocados. No mundo material é uma praga terrível, pois cada vítima amaldiçoada vira mais um da espécie. Por isso evita a luz forte, que retarda a transformação."
 },
 "vegepigmeu": {
  "id": "vegepigmeu",
  "tipo": "planta",
  "name": "Vegepigmeu",
  "nomeOriginal": "Vegepygmy",
  "fonte": "VGM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 7,
   "dex": 14,
   "con": 13,
   "int": 6,
   "wis": 11,
   "cha": 7
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 9,
  "hpDice": "2d6+2",
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
  "damageResistances": [
   "elétrico",
   "perfurante"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "cortante",
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
  "regeneracao": {
   "pv": 3,
   "bloqueia": [
    "fogo",
    "frio",
    "necrótico"
   ],
   "naoMorreA0": true
  },
  "traits": [
   "camuflagemGeral",
   "regeneracaoDoLivro"
  ],
  "blurb": "Pequeno fungo humanoide que ataca com garras ou funda e se esconde bem entre a vegetação. Regenera 3 PV por turno, a menos que sofra dano de frio, fogo ou necrótico.",
  "lore": "Vegepigmeus, também chamados de povo-mofo, são criaturas fúngicas que vivem em pequenas tribos em lugares escuros, quentes e úmidos, como cavernas e florestas fechadas. Nascem dos cadáveres de humanoides e gigantes mortos pelo mofo ruivo; quando a vítima é uma fera, surge uma versão bestial e espinhosa. Não falam: comunicam-se por chiados, gestos e batidas rítmicas no corpo. Preferem carne e sangue frescos, mas conseguem se nutrir de quase qualquer matéria orgânica, e convivem bem com outros fungos como miconídeos e cogumelos-guinchadores. Os mais velhos desenvolvem esporos capazes de infectar e são tratados como chefes."
 },
 "chefeVegepigmeu": {
  "id": "chefeVegepigmeu",
  "tipo": "planta",
  "name": "Chefe Vegepigmeu",
  "nomeOriginal": "Vegepygmy Chief",
  "fonte": "VGM",
  "size": "pequeno",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 14,
   "dex": 14,
   "con": 14,
   "int": 7,
   "wis": 12,
   "cha": 9
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 33,
  "hpDice": "6d6+12",
  "speedFt": 30,
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
  "damageResistances": [
   "elétrico",
   "perfurante"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 4,
    "damage": "1d6+2",
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
   "count": 2,
   "sequencias": [
    [
     "Garras",
     "Garras"
    ],
    [
     "Lança",
     "Lança"
    ]
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Esporos",
    "porDia": 1,
    "tipo": "area",
    "shape": "raio",
    "areaFt": 15,
    "save": "con",
    "dc": 12,
    "damage": "2d8",
    "damageType": "veneno",
    "halfOnSave": false,
    "condition": "envenenado",
    "rounds": 10,
    "repete": true
   }
  ],
  "regeneracao": {
   "pv": 5,
   "bloqueia": [
    "fogo",
    "frio",
    "necrótico"
   ],
   "naoMorreA0": true
  },
  "traits": [
   "camuflagemGeral",
   "regeneracaoDoLivro"
  ],
  "blurb": "Ataca duas vezes com garras ou lança e se regenera a cada turno, a menos que sofra frio, fogo ou necrótico. Uma vez por dia libera uma nuvem de esporos que envenena todos ao redor, causando dano contínuo.",
  "lore": "Vegepigmeus são seres fúngicos nascidos dos cadáveres de quem morre infectado pelo mofo-ferrugem, e vivem em tribos simples em lugares escuros, quentes e úmidos, como subterrâneos e florestas densas. Com a idade, alguns endurecem e desenvolvem cachos de esporos no corpo, e os demais passam a obedecê-los; por isso estrangeiros os chamam de chefes. Não falam: comunicam-se por chiados, gestos e batidas ritmadas no corpo. Convivem bem com outros fungos e plantas, como miconídeos e cogumelos-violeta, e usam equipamento tomado de outras criaturas."
 },
 "velocirraptor": {
  "id": "velocirraptor",
  "tipo": "fera",
  "name": "Velocirraptor",
  "nomeOriginal": "Velociraptor",
  "fonte": "VGM",
  "size": "miúdo",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 6,
   "dex": 14,
   "con": 13,
   "int": 4,
   "wis": 12,
   "cha": 6
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 10,
  "hpDice": "3d4+3",
  "speedFt": 30,
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
    "bonus": 4,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5
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
  "traits": [
   "packTactics"
  ],
  "blurb": "Pequeno e veloz, ataca com mordida e garras no mesmo turno e fica muito mais certeiro quando o bando cerca a mesma vítima.",
  "lore": "Dinossauro emplumado de porte parecido com o de um peru grande. Vive em campos abertos e florestas, onde caça com ferocidade. Raramente anda sozinho: os bandos trabalham juntos para cercar e abater presas bem maiores do que eles. É puro instinto predatório e não negocia."
 },
 "sacerdoteDeGuerra": {
  "id": "sacerdoteDeGuerra",
  "tipo": "humanoide",
  "name": "Sacerdote de Guerra",
  "nomeOriginal": "War Priest",
  "fonte": "VGM",
  "size": "médio",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 16,
   "dex": 10,
   "con": 14,
   "int": 11,
   "wis": 17,
   "cha": 13
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 117,
  "hpDice": "18d8+36",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13
  },
  "saves": [
   "con",
   "wis"
  ],
  "skills": [
   "intimidacao",
   "religiao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Marreta",
    "bonus": 7,
    "damage": "2d6+3",
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
    "luz",
    "consertar",
    "chamaSagrada",
    "pouparOsMoribundos"
   ],
   "prepared": [
    "favorDivino",
    "raioGuiado",
    "palavraCurativa",
    "escudoDaFe",
    "restauracaoMenor",
    "armaMagica",
    "oracaoDeCura",
    "silencio",
    "armaEspiritual",
    "farolDeEsperanca",
    "mantoDoCruzado",
    "dissiparMagia",
    "revivificar",
    "espiritosGuardioes",
    "andarNaAgua",
    "banimento",
    "liberdadeDeMovimento",
    "guardiaoDaFe",
    "peleDePedra",
    "golpeDeChama",
    "curarFerimentosEmMassa",
    "imobilizarMonstro"
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
    "luz": 15,
    "consertar": 15,
    "chamaSagrada": 15,
    "pouparOsMoribundos": 15,
    "favorDivino": 15,
    "raioGuiado": 15,
    "palavraCurativa": 15,
    "escudoDaFe": 15,
    "restauracaoMenor": 15,
    "armaMagica": 15,
    "oracaoDeCura": 15,
    "silencio": 15,
    "armaEspiritual": 15,
    "farolDeEsperanca": 15,
    "mantoDoCruzado": 15,
    "dissiparMagia": 15,
    "revivificar": 15,
    "espiritosGuardioes": 15,
    "andarNaAgua": 15,
    "banimento": 15,
    "liberdadeDeMovimento": 15,
    "guardiaoDaFe": 15,
    "peleDePedra": 15,
    "golpeDeChama": 15,
    "curarFerimentosEmMassa": 15,
    "imobilizarMonstro": 15
   }
  },
  "traits": [
   "t_golpeGuiado"
  ],
  "blurb": "Avança com uma marreta pesada, golpeando duas vezes por turno, enquanto usa magias de clérigo para curar aliados, proteger a linha e punir inimigos com fogo e luz sagrada. Uma vez por descanso, pode transformar um golpe errado em acerto com um bônus enorme.",
  "lore": "Devotos de divindades da batalha, estes clérigos vivem entre soldados e campanhas militares. Traçam estratégias, conduzem tropas à frente de combate e cuidam dos feridos quando a poeira baixa. Costumam enfrentar pessoalmente os conjuradores inimigos. Alguns comandam exércitos inteiros; outros servem como braço direito de um senhor da guerra."
 },
 "bruxoDaArquifada": {
  "id": "bruxoDaArquifada",
  "tipo": "humanoide",
  "name": "Bruxo da Arquifada",
  "nomeOriginal": "Warlock of the Archfey",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 9,
   "dex": 13,
   "con": 11,
   "int": 11,
   "wis": 12,
   "cha": 18
  },
  "ac": 11,
  "acNote": "14 com armadura arcana",
  "maxHp": 49,
  "hpDice": "11d8",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11
  },
  "saves": [
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "enganacao",
   "natureza",
   "persuasao"
  ],
  "expertise": [],
  "conditionImmunities": [
   "enfeitiçado"
  ],
  "attacks": [
   {
    "name": "Adaga",
    "bonus": 3,
    "damage": "1d4+2",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "disfarcarSe",
    "armaduraArcana",
    "imagemSilenciosa",
    "falarComAnimais"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "aVontade": [
    "disfarcarSe",
    "armaduraArcana",
    "imagemSilenciosa",
    "falarComAnimais"
   ],
   "cdPorMagia": {
    "disfarcarSe": 15,
    "armaduraArcana": 15,
    "imagemSilenciosa": 15,
    "falarComAnimais": 15
   }
  },
  "traits": [
   "t_fugaNebulosa"
  ],
  "blurb": "Conjurador traiçoeiro que confunde, enfeitiça e paralisa os inimigos com magia feérica, disparando rajadas místicas à distância. Quando ferido, some invisível e reaparece longe.",
  "lore": "Este bruxo deve seu poder a um pacto firmado com um dos senhores da Agrestia das Fadas. Em troca da magia, serve aos caprichos de um patrono imprevisível e encantador. Costuma andar acompanhado de fadas menores, como sátiros, duendes, barretes vermelhos e velozinhos. Prefere enganar, iludir e fugir a enfrentar um combate franco."
 },
 "bruxoDoCorruptor": {
  "id": "bruxoDoCorruptor",
  "tipo": "humanoide",
  "name": "Bruxo do Corruptor",
  "nomeOriginal": "Warlock of the Fiend",
  "fonte": "VGM",
  "size": "médio",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 10,
   "dex": 14,
   "con": 15,
   "int": 12,
   "wis": 12,
   "cha": 18
  },
  "ac": 12,
  "acNote": "15 com armadura arcana",
  "maxHp": 78,
  "hpDice": "12d8+24",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "enganacao",
   "persuasao",
   "religiao"
  ],
  "expertise": [],
  "damageResistances": [
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Maça",
    "bonus": 3,
    "damage": "1d6",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d6",
     "type": "fogo"
    }
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "enfraquecerOIntelecto",
    "dedoDaMorte",
    "viagemPlanar",
    "alterarAparencia",
    "vidaFalsa",
    "levitacao",
    "armaduraArcana",
    "imagemSilenciosa"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "enfraquecerOIntelecto": 1,
    "dedoDaMorte": 1,
    "viagemPlanar": 1
   },
   "aVontade": [
    "alterarAparencia",
    "vidaFalsa",
    "levitacao",
    "armaduraArcana",
    "imagemSilenciosa"
   ],
   "cdPorMagia": {
    "enfraquecerOIntelecto": 15,
    "dedoDaMorte": 15,
    "viagemPlanar": 15,
    "alterarAparencia": 15,
    "vidaFalsa": 15,
    "levitacao": 15,
    "armaduraArcana": 15,
    "imagemSilenciosa": 15
   }
  },
  "traits": [
   "t_sorteDoProprioSombrio"
  ],
  "blurb": "Conjurador de nível 17 que domina o campo com fogo infernal: rajada mística, coluna de chamas, muralha de fogo e até dedo da morte. Sua sorte sombria o ajuda a resistir no momento decisivo.",
  "lore": "Este bruxo selou um pacto com um arquidemônio ou arquidiabo dos Planos Inferiores e recebeu poder em troca. Costuma andar acompanhado de um diabrete ou de um quasit. Seu comportamento tende ao extremo. Alguns se juntam a cultos que veneram corruptores, e outros passam a vida caçando esses mesmos cultos."
 },
 "bruxoDoGrandeAntigo": {
  "id": "bruxoDoGrandeAntigo",
  "tipo": "humanoide",
  "name": "Bruxo do Grande Antigo",
  "nomeOriginal": "Warlock of the Great Old One",
  "fonte": "VGM",
  "size": "médio",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 9,
   "dex": 14,
   "con": 15,
   "int": 12,
   "wis": 12,
   "cha": 18
  },
  "ac": 12,
  "acNote": "15 com armadura arcana",
  "maxHp": 91,
  "hpDice": "14d8+28",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "historia"
  ],
  "expertise": [],
  "damageResistances": [
   "psíquico"
  ],
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
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "visaoDaVerdade",
    "detectarMagia",
    "salto",
    "levitacao",
    "armaduraArcana",
    "falarComOsMortos"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "visaoDaVerdade": 1
   },
   "aVontade": [
    "detectarMagia",
    "salto",
    "levitacao",
    "armaduraArcana",
    "falarComOsMortos"
   ],
   "cdPorMagia": {
    "visaoDaVerdade": 15,
    "detectarMagia": 15,
    "salto": 15,
    "levitacao": 15,
    "armaduraArcana": 15,
    "falarComOsMortos": 15
   }
  },
  "aura": {
   "raioFt": 5,
   "quando": "inicioDoDono",
   "save": "wis",
   "dc": 15,
   "damage": "3d6",
   "damageType": "psíquico",
   "soInimigos": true
  },
  "traits": [
   "aura"
  ],
  "blurb": "Conjurador que fica perto dos inimigos para que sua aura de sussurros cause dano psíquico a cada turno, enquanto usa rajada mística, braços de Hadar e coroa da loucura. Pode se teleportar com porta dimensional e atravessar distâncias com portal arcano.",
  "lore": "Este bruxo obteve seu poder por meio de um pacto com uma entidade incompreensível vinda de planos remotos e alienígenas. Muitos se juntam a cultos que adoram esses seres e colaboram com aberrações que têm os mesmos objetivos. Outros fazem o caminho inverso e usam o conhecimento proibido para caçar a loucura que essas criaturas espalham. São encontrados em cidades, desertos, montanhas e nas profundezas do Subterrâneo."
 },
 "senhorDaGuerra": {
  "id": "senhorDaGuerra",
  "tipo": "humanoide",
  "name": "Senhor da Guerra",
  "nomeOriginal": "Warlord",
  "fonte": "VGM",
  "size": "médio",
  "level": 9,
  "cr": "12",
  "xp": 8400,
  "abilities": {
   "str": 20,
   "dex": 16,
   "con": 18,
   "int": 12,
   "wis": 12,
   "cha": 18
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 229,
  "hpDice": "27d8+108",
  "speedFt": 30,
  "senses": {
   "passivePerception": 15
  },
  "saves": [
   "str",
   "dex",
   "con"
  ],
  "skills": [
   "atletismo",
   "intimidacao",
   "percepcao",
   "persuasao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Montante",
    "bonus": 9,
    "damage": "2d6+5",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Arco Curto",
    "bonus": 7,
    "damage": "1d6+3",
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
  "usosIndomavel": 3,
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque com Arma",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Montante"
    },
    {
     "nome": "Amedrontar Inimigo",
     "custo": 2,
     "tipo": "alvo",
     "alcanceFt": 30,
     "save": "wis",
     "dc": 16,
     "condition": "amedrontado",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "indomavelMonstro",
   "t_sobrevivente",
   "acoesLendarias"
  ],
  "blurb": "Combatente brutal com montante e arco curto, difícil de derrubar: regenera PV quando ferido e rerrola resistências falhas. Fora do seu turno, ainda comanda aliados a atacar e amedronta inimigos.",
  "lore": "Comandantes lendários cujo nome inspira respeito e temor em qualquer campo de batalha. Depois de acumular vitórias marcantes, um senhor da guerra pode facilmente se tornar rei ou general. Seguidores fanáticos se reúnem sob sua bandeira, dispostos a morrer por ele. Costuma ser encontrado em cidades e fortalezas, cercado de tropas leais."
 },
 "dracoGuardiaoBranco": {
  "id": "dracoGuardiaoBranco",
  "tipo": "dragão",
  "name": "Draco Guardião Branco",
  "nomeOriginal": "White Guard Drake",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 16,
   "dex": 11,
   "con": 16,
   "int": 4,
   "wis": 10,
   "cha": 7
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 52,
  "hpDice": "7d8+21",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30,
   "burrowFt": 20
  },
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "frio"
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
    "name": "Cauda",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2
  },
  "traits": [],
  "blurb": "Fera robusta que morde e golpeia com a cauda no mesmo turno, cavando túneis e escalando para alcançar intrusos. Resiste ao frio e enxerga no escuro.",
  "lore": "Dracos guardiões são criados por meio de rituais que usam escamas de dragões verdadeiros, resultando em sentinelas leais e territoriais. A variedade branca herda a ligação de seu progenitor com o gelo e prospera em regiões árticas, mas também é usada para proteger cofres e mansões nas cidades. Não fala, mas entende ordens em dracônico e obedece ao dono com fidelidade canina. Ataca qualquer estranho que entre no espaço que foi treinada para vigiar."
 },
 "guardiaoDaFlorestaWoodWoad": {
  "id": "guardiaoDaFlorestaWoodWoad",
  "tipo": "planta",
  "name": "Guardião da Floresta (Wood Woad)",
  "nomeOriginal": "Wood Woad",
  "fonte": "VGM",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 18,
   "dex": 12,
   "con": 16,
   "int": 10,
   "wis": 13,
   "cha": 8
  },
  "ac": 18,
  "acNote": "armadura natural e escudo",
  "maxHp": 75,
  "hpDice": "10d8+30",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "atletismo",
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "concussão",
   "perfurante"
  ],
  "damageVulnerabilities": [
   "fogo"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Clava",
    "bonus": 7,
    "damage": "4d4+4",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Clava",
    "Clava"
   ]
  },
  "regeneracao": {
   "pv": 10,
   "bloqueia": [
    "fogo"
   ],
   "naoMorreA0": true
  },
  "traits": [
   "t_clavaMagica",
   "camuflagemGeral",
   "regeneracaoDoLivro",
   "t_passoArboreo"
  ],
  "blurb": "Guerreiro vegetal que golpeia duas vezes por turno com uma clava mágica e se regenera enquanto toca o chão. Resiste a dano de concussão e perfurante, mas o fogo interrompe sua regeneração e o fere mais.",
  "lore": "É um corpo de planta em forma humanoide que abriga a alma de alguém que se ofereceu em sacrifício para virar sentinela eterna. Nasce de um ritual druídico antigo, no qual o coração da vítima recebe uma semente e é guardado numa árvore regada com seu sangue. Sem vontade própria nem sentimentos, cumpre sem descanso a ordem de proteger um bosque ou quem cuida dele. Quando não há o que fazer, enraíza-se em silêncio e se alimenta da terra. Se sua missão perde o sentido, pode vagar até achar outro lugar natural ou feérico para vigiar, muitas vezes servindo druidas ou entes."
 },
 "xvart": {
  "id": "xvart",
  "tipo": "humanoide",
  "name": "Xvart",
  "nomeOriginal": "Xvart",
  "fonte": "VGM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 8,
   "dex": 14,
   "con": 10,
   "int": 8,
   "wis": 7,
   "cha": 7
  },
  "ac": 13,
  "acNote": "armadura de couro",
  "maxHp": 7,
  "hpDice": "2d6",
  "speedFt": 30,
  "senses": {
   "passivePerception": 8,
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
    "name": "Espada Curta",
    "bonus": 4,
    "damage": "1d6+2",
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
   "acaoAstuta",
   "t_bandoOpressor",
   "t_linguaDeRaxivort"
  ],
  "blurb": "Pequeno e covarde, o xvart ataca em bando com espada curta ou funda e foge sem sofrer ataques de oportunidade. Em grupo, derruba e empurra inimigos com facilidade.",
  "lore": "Os xvarts são humanoides baixinhos de pele azul e olhos laranja, criados à imagem de Raxivort, um semideus ladrão que fugiu da ira de Graz'zt. Vivem em colinas remotas, florestas e cavernas, lugares esquecidos onde também prosperam ratos e morcegos, que eles domesticam. Gananciosos e invejosos, acumulam objetos de valor e saqueiam fazendas, mas temem humanos, anões e elfos. Quando a sorte vira, capturam vítimas com redes para sacrificá-las ao seu deus, que às vezes aparece apenas para levar todo o tesouro da tribo."
 },
 "xvartOrador": {
  "id": "xvartOrador",
  "tipo": "humanoide",
  "name": "Xvart Orador",
  "nomeOriginal": "Xvart Speaker",
  "fonte": "VGM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 8,
   "dex": 14,
   "con": 10,
   "int": 13,
   "wis": 7,
   "cha": 7
  },
  "ac": 13,
  "acNote": "armadura de couro",
  "maxHp": 7,
  "hpDice": "2d6",
  "speedFt": 30,
  "senses": {
   "passivePerception": 8,
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
    "name": "Espada Curta",
    "bonus": 4,
    "damage": "1d6+2",
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
   "acaoAstuta",
   "t_bandoOpressor",
   "t_linguaDeRaxivort"
  ],
  "blurb": "Pequeno e covarde, ataca com espada curta ou funda e foge com facilidade, desengajando como ação bônus. Em bando, empurra os inimigos com vantagem.",
  "lore": "Os xvarts são humanoides pequenos de pele azulada, servos do semideus Raxivort, que os criou por inveja e ambição. Vivem em tocas no Subterrâneo e em colinas, sempre na companhia de ratos e morcegos. Os oradores são os poucos da raça capazes de falar outra língua além do Abissal, e por isso negociam com outras criaturas em nome do bando. São cruéis com os fracos e covardes diante dos fortes."
 },
 "bruxoXvartDeRaxivort": {
  "id": "bruxoXvartDeRaxivort",
  "tipo": "humanoide",
  "name": "Bruxo Xvart de Raxivort",
  "nomeOriginal": "Xvart Warlock of Raxivort",
  "fonte": "VGM",
  "size": "pequeno",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 8,
   "dex": 14,
   "con": 12,
   "int": 8,
   "wis": 11,
   "cha": 12
  },
  "ac": 12,
  "acNote": "15 com armadura arcana",
  "maxHp": 22,
  "hpDice": "5d6+5",
  "speedFt": 30,
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
    "name": "Cimitarra",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "detectarMagia",
    "armaduraArcana"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "aVontade": [
    "detectarMagia",
    "armaduraArcana"
   ]
  },
  "traits": [
   "acaoAstuta",
   "t_bandoOpressor",
   "t_linguaDeRaxivort"
  ],
  "blurb": "Pequeno conjurador covarde que dispara rajadas místicas e raios ardentes à distância, some com invisibilidade e se desengaja como ação bônus quando alguém se aproxima.",
  "lore": "Os xvarts são criaturinhas de pele azul e olhos laranja, cópias degeneradas do semideus fugitivo Raxivort, ladrão do tesouro de Graz'zt. Alguns conseguem um pacto entregando ao seu deus um objeto valioso o bastante para fazê-lo aparecer, e recebem em troca magia de bruxo. Esses bruxos são temidos pela tribo, mas preferem vasculhar ruínas e masmorras atrás de riquezas, cercados de xvarts bajuladores. Vivem em cavernas, colinas e cantos esquecidos, acompanhados de ratos e morcegos."
 },
 "caoYeth": {
  "id": "caoYeth",
  "tipo": "feérico",
  "name": "Cão Yeth",
  "nomeOriginal": "Yeth Hound",
  "fonte": "VGM",
  "size": "grande",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 18,
   "dex": 17,
   "con": 16,
   "int": 5,
   "wis": 12,
   "cha": 7
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 51,
  "hpDice": "6d10+18",
  "speedFt": 40,
  "flyFt": 40,
  "hover": true,
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
  "damageImmunities": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunitiesNote": "só de armas não mágicas",
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "2d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d6",
     "type": "psíquico"
    }
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Uivo Funesto",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 300,
    "save": "wis",
    "dc": 13,
    "condition": "amedrontado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "traits": [
   "keenHearingSmell",
   "t_banimentoPelaLuzSolar",
   "t_vinculoTelepatico"
  ],
  "blurb": "Voa sobre a presa e uiva para espalhar terror em uma área enorme; contra alvos amedrontados, a mordida causa dano psíquico pesado. Só armas mágicas ou prateadas o ferem de verdade.",
  "lore": "Fadas poderosas, como a Rainha do Ar e da Escuridão, criam matilhas desses cães e as entregam a servos que desejam recompensar. Grandes, de pelo negro, olhos rubros e um rosto inquietantemente humano, cheiram a fumaça e caçam à noite, perseguindo a vítima até ela não conseguir mais lutar. Obedecem ao dono por telepatia e, se ele morre, procuram outro mestre maligno, como um vampiro, um necromante ou uma bruxa. Odeiam o sol: a matilha sempre volta ao covil antes do amanhecer, e a luz do dia os lança no Plano Etéreo."
 },
 "anatemaYuanTi": {
  "id": "anatemaYuanTi",
  "tipo": "monstruosidade",
  "name": "Anátema Yuan-ti",
  "nomeOriginal": "Yuan-ti Anathema",
  "fonte": "VGM",
  "size": "enorme",
  "level": 9,
  "cr": "12",
  "xp": 8400,
  "abilities": {
   "str": 23,
   "dex": 13,
   "con": 19,
   "int": 19,
   "wis": 17,
   "cha": 20
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 189,
  "hpDice": "18d12+72",
  "speedFt": 40,
  "speeds": {
   "swimFt": 30,
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 17,
   "darkvisionFt": 60,
   "blindsightFt": 30
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "ácido",
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
    "name": "Garra (somente forma de anátema)",
    "bonus": 10,
    "damage": "2d6+6",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Constrição",
    "bonus": 10,
    "damage": "3d6+6",
    "type": "concussão",
    "reachFt": 15,
    "danoExtra": {
     "damage": "2d6",
     "type": "ácido"
    },
    "onHit": {
     "semResistencia": true,
     "dc": 16,
     "escape": 16,
     "condition": "contido",
     "note": "é agarrado"
    }
   },
   {
    "name": "Rajada de Mordidas",
    "bonus": 10,
    "damage": "6d6+6",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "4d6",
     "type": "veneno"
    }
   }
  ],
  "multiattack": {
   "count": 4,
   "sequence": [
    "Garra (somente forma de anátema)",
    "Garra (somente forma de anátema)",
    "Constrição",
    "Rajada de Mordidas"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "palavraDivina",
    "escuridao",
    "emaranhar",
    "medo",
    "velocidade",
    "sugestao",
    "metamorfose",
    "amizadeAnimal"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "palavraDivina": 1,
    "escuridao": 3,
    "emaranhar": 3,
    "medo": 3,
    "velocidade": 3,
    "sugestao": 3,
    "metamorfose": 3
   },
   "aVontade": [
    "amizadeAnimal"
   ],
   "cdPorMagia": {
    "palavraDivina": 17,
    "escuridao": 17,
    "emaranhar": 17,
    "medo": 17,
    "velocidade": 17,
    "sugestao": 17,
    "metamorfose": 17,
    "amizadeAnimal": 17
   }
  },
  "aura": {
   "raioFt": 30,
   "quando": "inicioDoAlvo",
   "save": "wis",
   "dc": 17,
   "condition": "amedrontado",
   "rounds": 1,
   "imunizaAoPassar": true,
   "soInimigos": true
  },
  "traits": [
   "resistenciaAMagia",
   "aura",
   "metamorfo",
   "t_seisCabecas"
  ],
  "blurb": "Colosso serpentino de seis cabeças que esmaga e corrói com sua constrição enquanto despedaça alvos com garras e mordidas venenosas. Sua aura espalha pavor de serpentes, e ela ainda dispõe de magias poderosas como palavra divina e metamorfose.",
  "lore": "O anátema é o ápice da transformação yuan-ti, um ser que abandonou quase toda a forma humana em busca de se tornar divino. Governa templos e cidades ocultas em selvas, desertos e no Subterrâneo, onde é venerado como encarnação dos deuses-serpente. Os demais yuan-ti o servem com fanatismo, e ele trata todas as outras raças como gado ou escravos. Astuto e paciente, prefere manipular de longe, mas quando entra em combate é uma força devastadora."
 },
 "guardaDeNinhadaYuanTi": {
  "id": "guardaDeNinhadaYuanTi",
  "tipo": "humanoide",
  "name": "Guarda de Ninhada Yuan-ti",
  "nomeOriginal": "Yuan-ti Broodguard",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 15,
   "dex": 14,
   "con": 14,
   "int": 6,
   "wis": 11,
   "cha": 4
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 45,
  "hpDice": "7d8+14",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [
   "str",
   "dex",
   "wis"
  ],
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
    "bonus": 4,
    "damage": "1d8+2",
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
   "count": 3,
   "sequence": [
    "Mordida",
    "Garras",
    "Garras"
   ]
  },
  "traits": [
   "ascendenciaFeerica",
   "imprudente"
  ],
  "blurb": "Brutamontes escamoso que ataca com mordida e duas garras por turno, podendo se jogar de forma imprudente para ganhar vantagem em troca de ficar exposto. Imune a veneno e difícil de controlar com magia.",
  "lore": "Os guardas de ninhada são pessoas capturadas pelos yuan-ti e obrigadas a beber uma poção que as deforma, ao longo de alguns dias, em criaturas magras, escamosas e de mente simples. A transformação apaga quem eram e as deixa obedientes a qualquer yuan-ti, além de cheias de fúria contra seres que não sejam répteis. Os yuan-ti os chamam de \"histachii\", os vigias de ovos, e os usam para proteger ninhos e patrulhar contra invasores. Raramente falam, preferindo sibilos e grunhidos, e exalam um leve cheiro de carne podre."
 },
 "yuanTiMalditoTipo4": {
  "id": "yuanTiMalditoTipo4",
  "tipo": "monstruosidade",
  "name": "Yuan-ti Maldito (Tipo 4)",
  "nomeOriginal": "Yuan-ti Malison (Type 4)",
  "fonte": "VGM",
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
    "longRangeFt": 600
   }
  ],
  "multiattack": {
   "count": 2,
   "porArma": {
    "Arco Longo": 2
   }
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
  "blurb": "Combate com cimitarra ou arco longo, atacando duas vezes por turno, e usa sugestão para manipular inimigos. Pode virar serpente para morder com veneno e resiste bem a magia.",
  "lore": "Os malditos são yuan-ti de sangue impuro, mistura de humano e serpente, que formam a casta intermediária da sociedade de seu povo. Este tipo tem corpo humano do qual brotam uma ou mais caudas de cobra. Vivem em templos ocultos em florestas, pântanos e desertos, servindo aos puros-sangues e comandando os servos mais humildes. São astutos e manipuladores, preferindo enganar e dominar antes de recorrer à força."
 },
 "yuanTiMalditoTipo5": {
  "id": "yuanTiMalditoTipo5",
  "tipo": "monstruosidade",
  "name": "Yuan-ti Maldito (Tipo 5)",
  "nomeOriginal": "Yuan-ti Malison (Type 5)",
  "fonte": "VGM",
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
    "longRangeFt": 600
   }
  ],
  "multiattack": {
   "count": 2,
   "porArma": {
    "Arco Longo": 2
   }
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
  "blurb": "Combate com cimitarra ou arco longo atacando duas vezes por turno, manipula inimigos com sugestão e pode virar serpente para morder com veneno. Tem vantagem contra magia e é imune a veneno.",
  "lore": "Os malditos são a casta intermediária dos yuan-ti, mestiços de humano e serpente moldados por rituais sombrios. Os do tipo 5 parecem humanos, mas têm o corpo inteiro coberto de escamas. Vivem em templos e cidades ocultas em florestas, pântanos e desertos, servindo os abomináveis e comandando os sangue-puros. São frios, calculistas e preferem enganar e infiltrar antes de partir para a violência."
 },
 "yuanTiSussurradorDaMente": {
  "id": "yuanTiSussurradorDaMente",
  "tipo": "monstruosidade",
  "name": "Yuan-ti Sussurrador da Mente",
  "nomeOriginal": "Yuan-ti Mind Whisperer",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 13,
   "int": 14,
   "wis": 14,
   "cha": 16
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 71,
  "hpDice": "13d8+13",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 120
  },
  "saves": [
   "wis",
   "cha"
  ],
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
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Cimitarra"
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
   "t_presasMentais",
   "t_bencaoDeSseth"
  ],
  "blurb": "Conjurador traiçoeiro que combina mordida venenosa e cimitarra com presas psíquicas que causam 3d10 extras, além de rajada mística e magias de encantamento. Resiste a magia e ganha PV temporários ao derrubar inimigos.",
  "lore": "É um malison yuan-ti de corpo humano e cabeça de serpente que firmou um pacto com Sseth, a Morte Sibilante. Usa seus poderes para converter fiéis, acumular poder e confundir a mente dos adversários. Vive nas intrigas, frequentemente servindo a duas facções ao mesmo tempo e escondendo de cada uma seus laços com a outra. Mesmo entre os yuan-ti tem fama de arrogante, ardiloso e de fugir ao primeiro sinal de perigo."
 },
 "yuanTiOradoraDePesadelos": {
  "id": "yuanTiOradoraDePesadelos",
  "tipo": "monstruosidade",
  "name": "Yuan-ti Oradora de Pesadelos",
  "nomeOriginal": "Yuan-ti Nightmare Speaker",
  "fonte": "VGM",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 13,
   "int": 14,
   "wis": 12,
   "cha": 16
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 71,
  "hpDice": "13d8+13",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 120
  },
  "saves": [
   "wis",
   "cha"
  ],
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
    "name": "Constrição",
    "bonus": 5,
    "damage": "2d6+3",
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
    "bonus": 5,
    "damage": "1d6+3",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Constrição",
    "Cimitarra"
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
  "acoesEspeciais": [
   {
    "nome": "Invocar Pesadelo",
    "tipo": "alvo",
    "alcanceFt": 60,
    "save": "int",
    "dc": 13,
    "damage": "2d10",
    "damageType": "psíquico",
    "halfOnSave": false,
    "condition": "amedrontado",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [
   "metamorfo",
   "t_presasDaMorte",
   "resistenciaAMagia"
  ],
  "blurb": "Sacerdotisa serpentina que constringe com a cauda e golpeia com cimitarra, enquanto conjura magias de bruxo e projeta medos ilusórios que causam dano psíquico. Suas Presas da Morte somam dano necrótico pesado e ela resiste bem a magia.",
  "lore": "Estas yuan-ti malison, com cabeça e torso humanos sobre um corpo de serpente, firmam um pacto com Dendar, a Serpente da Noite. Em troca de poder, alimentam a divindade com o terror e os pesadelos de suas vítimas. Tratam as visões que recebem como profecias e agem para que se realizem. São as mais cruéis de sua raça: preferem aterrorizar a matar, torturam escravos e manipulam comunidades humanoides para conseguir mais presas. Costumam se cercar de mortos-vivos."
 },
 "mestreDoFossoYuanTi": {
  "id": "mestreDoFossoYuanTi",
  "tipo": "monstruosidade",
  "name": "Mestre do Fosso Yuan-ti",
  "nomeOriginal": "Yuan-ti Pit Master",
  "fonte": "VGM",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 13,
   "int": 14,
   "wis": 12,
   "cha": 16
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 88,
  "hpDice": "16d8+16",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 120
  },
  "saves": [
   "wis",
   "cha"
  ],
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
  "acoesEspeciais": [
   {
    "nome": "Sono de Merrshaulk",
    "porDia": 1,
    "tipo": "alvo",
    "alcanceFt": 60,
    "alvos": 5,
    "save": "con",
    "dc": 13,
    "condition": "inconsciente",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "metamorfo",
   "resistenciaAMagia",
   "t_discipuloDoVeneno"
  ],
  "blurb": "Sacerdote-bruxo que morde com os braços de serpente carregados de veneno e controla o combate com magias como contramágica, sugestão e rajada mística. Seu Sono de Merrshaulk pode derrubar inconscientes até cinco inimigos de uma vez.",
  "lore": "Os mestres do fosso são malisons yuan-ti que firmaram um pacto com Merrshaulk, o deus serpente adormecido, e oferecem humanoides em sacrifício na esperança de despertá-lo. Têm cabeça e tronco humanos, mas no lugar dos braços carregam serpentes vivas. Entre os yuan-ti são os mais apegados à tradição e se consideram os mais aptos a guiar seu povo. Defendem paciência e cautela, atuando nos planos de longo prazo para dominar governos humanoides e manter ocultas as cidades yuan-ti em selvas, desertos e no Subterrâneo."
 }
};

export const TRACOS_VGM = {
 "t_mudarDeForma": {
  "name": "Mudar de Forma",
  "desc": "Transforma-se magicamente em uma besta ou humanoide que já viu, ou volta à forma real, absorvendo o equipamento. Mantém as estatísticas, exceto o tamanho, e retorna à forma verdadeira ao morrer."
 },
 "t_olhoDoArqueiro": {
  "name": "Olho do Arqueiro",
  "desc": "Três vezes por dia, como ação bônus, soma 1d10 à próxima jogada de ataque ou de dano com arco longo ou arco curto."
 },
 "t_olharDebilitante": {
  "name": "Olhar Debilitante",
  "desc": "Um alvo visível a até 6 m faz teste de resistência de Constituição CD 13. Se falhar, por 1 minuto causa só metade do dano com ataques de arma baseados em Força, repetindo o teste no fim de cada turno seu para encerrar o efeito."
 },
 "t_engolir": {
  "name": "Engolir",
  "desc": "Morde uma criatura Média ou menor que esteja agarrando; se acertar, a engole. A vítima fica cega, contida, com cobertura total e sofre 10 (3d6) de dano necrótico no início de cada turno dele (fica estável ao chegar a 0 PV). Só engole uma por vez e pode regurgitá-la caída a 1,5 m quando quiser ou ao morrer."
 },
 "t_conexaoRessonante": {
  "name": "Conexão Ressonante",
  "desc": "Se possuir um pedaço de uma criatura ou objeto, como um fio de cabelo ou lasca, sabe o caminho mais direto até ele desde que esteja a até 1,6 km."
 },
 "t_cancaoDeDescanso": {
  "name": "Canção de Descanso",
  "desc": "Durante um descanso curto, o bardo pode cantar; ele e cada aliado que ouvir e gastar Dados de Vida para se curar recupera 1d6 PV adicionais ao final do descanso."
 },
 "t_provocacao2Dia": {
  "name": "Provocação (2/Dia)",
  "desc": "Como ação bônus, escolhe uma criatura a até 9 m que possa ouvi-lo. Ela deve passar num teste de resistência de Carisma CD 12 ou terá desvantagem em testes de habilidade, ataques e testes de resistência até o início do próximo turno do bardo."
 },
 "t_banimentoPeloFogo": {
  "name": "Banimento pelo Fogo",
  "desc": "Se começar o turno envolto em chamas de pelo menos 3 m de altura ou largura, faz um teste de resistência de Carisma CD 15; se falhar, é banido para Geena. Explosões instantâneas de fogo, como bola de fogo, não causam isso."
 },
 "t_devorarAlmas": {
  "name": "Devorar Almas",
  "desc": "Em 1 minuto, devora o corpo de um humanoide que matou há menos de 10 minutos, destruindo-o e prendendo a alma por 24 horas antes de digeri-la. Enquanto presa, ressurreições têm só 50% de chance de funcionar; depois de digerida, nenhuma magia mortal traz a vítima de volta. Se o barghest morrer antes, a alma é libertada."
 },
 "t_magiaDoCajadoCinzento": {
  "name": "Magia do Cajado Cinzento",
  "desc": "Seu cajado funciona como uma vassoura voadora e, enquanto o segura, ela pode lançar as magias marcadas com asterisco (imobilizar pessoa, cone de frio, tempestade de gelo, muralha de gelo). Se perdê-lo, leva um ano e um dia para criar outro."
 },
 "t_andarNoGelo": {
  "name": "Andar no Gelo",
  "desc": "Move-se e escala superfícies geladas sem testes, e terreno difícil de gelo ou neve não lhe custa movimento extra."
 },
 "t_auraDeAniquilacao": {
  "name": "Aura de Aniquilação",
  "desc": "Liga ou desliga com uma ação bônus. Ativa, causa 5 de dano necrótico a quem terminar o turno a até 9 m dele, exceto mortos-vivos e corruptores."
 },
 "t_oleoDeBoggle": {
  "name": "Óleo de Boggle",
  "desc": "Sua pele exala um óleo não inflamável que pode ser escorregadio ou pegajoso, alternável com uma ação bônus. Escorregadio dá vantagem em testes de Destreza (Acrobacia) para se soltar, escapar de agarrões e passar por espaços apertados. Pegajoso dá vantagem para agarrar e se manter preso a algo, e permite escalar superfícies difíceis e tetos sem testes."
 },
 "t_fendaDimensional": {
  "name": "Fenda Dimensional",
  "desc": "Como ação bônus, cria uma fenda invisível em uma abertura ou moldura de até 3 m a até 1,5 m dele, ligando-a a um ponto a até 9 m. Ao lado da fenda, conta como estando também no destino e pode ver, atacar ou passar por ela. Só ele pode usá-la, e ela dura até o fim do seu próximo turno."
 },
 "t_olfatoAgucado": {
  "name": "Olfato Aguçado",
  "desc": "Tem vantagem em testes de Sabedoria (Percepção) baseados no olfato."
 },
 "t_filamentoAdesivo": {
  "name": "Filamento Adesivo",
  "desc": "Com uma ação, estende um fio pegajoso de até 18 m, e quem o toca fica agarrado (CD 13 para escapar, com desvantagem nos testes). O fio tem CA 15, 5 PV e imunidade a veneno e psíquico. Uma arma que acerta sem cortá-lo fica presa e exige uma ação e um teste de Força CD 13 para soltar. Destruir o fio não fere a criatura, que cria outro no turno seguinte."
 },
 "t_sangueInflamavel": {
  "name": "Sangue Inflamável",
  "desc": "Com metade dos PV ou menos, passa a ter vulnerabilidade a dano de fogo."
 },
 "t_retomarOFolego": {
  "name": "Retomar o Fôlego",
  "desc": "Com uma ação bônus, recupera 20 PV. Volta a ficar disponível após um descanso curto ou longo."
 },
 "t_transporteBenigno": {
  "name": "Transporte Benigno",
  "desc": "Com uma ação bônus, teleporta-se até 9 m para um espaço desocupado que veja, ou troca de lugar com uma criatura voluntária Pequena ou Média nesse alcance. Recarrega quando conjura uma magia de conjuração de 1º círculo ou superior."
 },
 "t_iluminacao": {
  "name": "Iluminação",
  "desc": "Com uma ação bônus, os cérebros emitem penumbra em 1,5 m, luz plena num raio de 1,5 a 6 m (mais a mesma distância em penumbra) ou apagam a luz."
 },
 "t_veuTelepatico": {
  "name": "Véu Telepático",
  "desc": "Imune a magias de adivinhação e a qualquer efeito que perceba suas emoções ou leia seus pensamentos."
 },
 "t_escuridao": {
  "name": "Escuridão",
  "desc": "Conjura escuridão sem componentes, usando Sabedoria. Recarrega após descanso curto ou longo."
 },
 "t_sangueEletrico": {
  "name": "Sangue Elétrico",
  "desc": "Sempre que uma criatura a até 1,5 m o acerta com ataque corpo a corpo de dano perfurante ou cortante, ela sofre 5 (1d10) de dano elétrico."
 },
 "t_aprisionarAlma": {
  "name": "Aprisionar Alma",
  "desc": "Teleporta para sua caixa torácica um humanoide vivo com 0 PV a até 9 m, que passa a ter desvantagem em testes de resistência contra a morte; só prende um por vez. Se a vítima morrer lá dentro, o devorador recupera 25 PV, recarrega Dilacerar Alma e ganha uma ação extra no próximo turno, e no início desse turno a expele como ação bônus em forma de zumbi (até 2 DV), carniçal (3 a 5 DV) ou aparição (6+ DV)."
 },
 "t_pressagio": {
  "name": "Presságio",
  "desc": "Quando ele ou uma criatura que ele veja faz uma jogada de ataque, teste de resistência ou teste de habilidade, o adivinho pode rolar um d20 e usar esse resultado no lugar. Recarrega depois que ele conjura uma magia de adivinhação de 1º nível ou superior."
 },
 "t_explosaoMentalRecarga56": {
  "name": "Explosão Mental (Recarga 5–6)",
  "desc": "Criaturas escolhidas a até 18 m fazem teste de resistência de Inteligência CD 18; quem falha sofre 32 (5d10+5) de dano psíquico e fica atordoado por 1 minuto, repetindo o teste ao fim de cada turno."
 },
 "t_eloPsiquico": {
  "name": "Elo Psíquico",
  "desc": "Cria um elo com uma criatura incapacitada que perceba pelo Sentido de Criaturas e passa a sentir tudo o que ela sente (até dez elos). O alvo pode usar uma ação para tentar romper com teste de Carisma CD 18, sofrendo 10 (3d6) de dano psíquico se conseguir; o elo cai sem custo além de 8 km."
 },
 "t_sentirPensamentos": {
  "name": "Sentir Pensamentos",
  "desc": "Lê o raciocínio, as emoções e as preocupações de uma criatura ligada. Pode fazer um teste de Enganação com vantagem contra a Intuição dela para implantar uma crença ou emoção falsa por 1 hora ou até surgir prova da mentira."
 },
 "t_sentidoDeCriaturas": {
  "name": "Sentido de Criaturas",
  "desc": "Percebe a distância, a direção e o valor de Inteligência de toda criatura com Inteligência 4 ou mais a até 8 km. Magias como limpar a mente ou indetectabilidade bloqueiam esse sentido."
 },
 "t_centralTelepatica": {
  "name": "Central Telepática",
  "desc": "Ao receber uma mensagem telepática, pode retransmiti-la para até sete outras criaturas que veja a até 180 m."
 },
 "t_encantoInstintivo": {
  "name": "Encanto Instintivo",
  "desc": "Antes de saber se o ataque acerta, o encantador força um atacante visível a até 9 m a fazer um teste de resistência de Sabedoria CD 14. Se falhar, o atacante mira a criatura mais próxima dele, exceto ele mesmo e o encantador. Recarrega quando o encantador conjura uma magia de encantamento de 1º nível ou superior."
 },
 "t_esculpirMagias": {
  "name": "Esculpir Magias",
  "desc": "Ao lançar uma magia de evocação que exige teste de resistência, escolhe até 1 + o círculo da magia criaturas que vê; elas passam automaticamente no teste. Se o sucesso reduziria o dano à metade, elas não sofrem dano algum."
 },
 "t_investidaDeEscudo": {
  "name": "Investida de Escudo",
  "desc": "Avança até 9 m em linha reta, passando pelo espaço de criaturas menores que Enorme, e faz um ataque de escudo flamejante na primeira vez que entra no espaço de cada uma. Se acertar, o alvo faz teste de resistência de Força CD 21 ou é empurrado junto até o fim do movimento; falhando por 5 ou mais, também fica caído e sofre 18 (3d6+8) de concussão, ou 29 (6d6+8) se já estava caído."
 },
 "t_escudosDuplos": {
  "name": "Escudos Duplos",
  "desc": "Os dois escudos já estão incluídos na CA. Para arremessar pedras, o gigante precisa guardar ou largar um deles."
 },
 "t_bencaoDeImix": {
  "name": "Bênção de Imix",
  "desc": "Ao reduzir um inimigo a 0 PV, recebe 5 PV temporários."
 },
 "t_tentaculosMangual": {
  "name": "Tentáculos-Mangual",
  "desc": "Possui cinco tentáculos; perde um sempre que sofre 10 ou mais de dano em um único turno, regenerando-os em 1d4 dias se restar algum. Sem tentáculos, recolhe-se na concha com cobertura total e lamenta audivelmente até morrer em 5d6 minutos, salvo cura que regenere membros."
 },
 "t_auraDeSedeDeSangue": {
  "name": "Aura de Sede de Sangue",
  "desc": "Enquanto o flind não estiver incapacitado, criaturas com o traço Fúria Destrutiva a até 3 m dele podem fazer um ataque de mordida como ação bônus."
 },
 "t_lingua": {
  "name": "Língua",
  "desc": "Alvo Médio ou menor visível a até 6 m faz teste de resistência de Força CD 18; se falhar, é puxado para um espaço a 1,5 m do sapomoth, que pode mordê-lo como ação bônus."
 },
 "t_vulneravelAChoques": {
  "name": "Vulnerável a Choques",
  "desc": "Ao sofrer dano elétrico, até o fim do seu próximo turno tem o deslocamento reduzido à metade, -2 na CA e nos testes de resistência de Destreza, não pode usar reações nem Ataques Múltiplos, e só pode usar ação ou ação bônus no turno, não ambas."
 },
 "t_cabecasExtras": {
  "name": "Cabeças Extras",
  "desc": "Há 25% de chance de ter mais de uma cabeça. Nesse caso, tem vantagem em testes de Sabedoria (Percepção) e em resistências contra ficar cego, enfeitiçado, surdo, amedrontado, atordoado ou inconsciente."
 },
 "t_furiaDeVaprak": {
  "name": "Fúria de Vaprak",
  "desc": "Uma vez por descanso curto ou longo, como ação bônus no início do turno, entra em fúria por 1 minuto ou até ficar incapacitado. Enquanto dura, tem vantagem em testes e resistências de Força, +4 no dano de ataques corpo a corpo com arma e resistência a dano cortante, perfurante e de concussão."
 },
 "t_imitacao": {
  "name": "Imitação",
  "desc": "Reproduz sons de animais e vozes humanoides. Quem ouve percebe a farsa com um teste de Sabedoria (Intuição) CD 14."
 },
 "t_investidaSubita": {
  "name": "Investida Súbita",
  "desc": "Até o fim do turno, seu deslocamento aumenta em 18 m e ele não provoca ataques de oportunidade."
 },
 "t_golpeVingativo": {
  "name": "Golpe Vingativo",
  "desc": "Quando um gnoll cai a 0 PV a até 9 m dele, faz um ataque corpo a corpo como reação."
 },
 "t_saltoParado": {
  "name": "Salto Parado",
  "desc": "Salta até 7,5 m em distância e 4,5 m em altura, mesmo sem tomar impulso."
 },
 "t_vantagemArcana": {
  "name": "Vantagem Arcana",
  "desc": "Uma vez por turno, ao acertar um ataque mágico de dano em uma criatura a até 1,5 m de um aliado não incapacitado do hobgoblin, causa 7 (2d6) de dano extra."
 },
 "t_arcanoDeExercito": {
  "name": "Arcano de Exército",
  "desc": "Ao lançar magia que causa dano ou exige teste de resistência, pode escolher a si mesmo e quaisquer aliados para ficarem imunes ao dano dela e passarem automaticamente no teste."
 },
 "t_rejuvenescimento": {
  "name": "Rejuvenescimento",
  "desc": "Se tiver uma filactéria, ganha um corpo novo 1d10 dias depois de ser destruído, com todos os PV. O corpo surge a até 1,5 m da filactéria."
 },
 "t_resistenciaDraconica": {
  "name": "Resistência Dracônica",
  "desc": "Tem resistência a um tipo de dano conforme a cor do dragão que o fortaleceu (escolha ou role 1d10): 1–2 ácido (negro), 3–4 frio (branco), 5–6 fogo (vermelho), 7–8 elétrico (azul), 9–10 veneno (verde)."
 },
 "t_coracaoDoDragao": {
  "name": "Coração do Dragão",
  "desc": "Se estiver amedrontado ou paralisado por efeito com teste de resistência, pode repetir o teste no início do turno; com sucesso, encerra o efeito em si e em todos os kobolds a até 9 m. Cada kobold beneficiado ganha vantagem na próxima jogada de ataque."
 },
 "t_invencaoBelica": {
  "name": "Invenção Bélica",
  "desc": "Escolhe ou rola 1d8 uma engenhoca, cada uma usável 1 vez por dia: ácido (+4, 1,5/6 m, 2d6 ácido); fogo alquímico (+4, 1d4 fogo no início de cada turno do alvo até apagar com CD 10 de Destreza); cesto de centopeias ou saco de vespas (enxame de 11 PV a até 6 m, 50% de se dispersar ao fim de cada turno); pote de limo verde (+4, cobre o alvo de limo verde, ou um quadrado próximo se errar); pote de larvas-podres (enxame fixo num quadrado a até 6 m); escorpião na vara (+4, 1 perfurante e CD 9 de Constituição contra 1d8 veneno, metade se passar); gambá na gaiola (borrifa uma criatura adjacente: CD 9 de Constituição ou fica sem poder agir por 1 minuto, repetindo o teste a cada turno)."
 },
 "t_pontosDeFeiticaria": {
  "name": "Pontos de Feitiçaria",
  "desc": "Tem 3 pontos, recuperados em descanso longo. Por 3 pontos, um alvo de magia que exige resistência faz o primeiro teste com desvantagem; por 1 ponto, conjura sem componentes verbais nem somáticos."
 },
 "t_comandarCabelo": {
  "name": "Comandar Cabelo",
  "desc": "Com ação bônus, faz uma corda de cabelo a até 9 m se mover 6 m e enlaçar criatura Grande ou menor: CD 13 de Destreza ou fica agarrada (fuga CD 13) e contida. A corda tem CA 20, 20 PV e recupera 1 PV por turno do korred."
 },
 "t_forcaDaPedra": {
  "name": "Força da Pedra",
  "desc": "Enquanto está no chão, seus ataques com arma causam 2 dados extras de dano (já incluídos)."
 },
 "t_vozDoKraken": {
  "name": "Voz do Kraken",
  "desc": "Recarrega após descanso curto ou longo. O kraken fala pelo sacerdote, sendo ouvido a até 90 m. Criaturas escolhidas que ouvirem fazem teste de resistência de Carisma CD 14 ou ficam amedrontadas por 1 minuto, repetindo o teste no fim de cada turno delas."
 },
 "t_retiradaAosCoices": {
  "name": "Retirada aos Coices",
  "desc": "Se atacar com os cascos, pode usar Desengajar como ação bônus."
 },
 "t_desviarProjetil": {
  "name": "Desviar Projétil",
  "desc": "Ao ser atingido por ataque com arma à distância, reduz o dano em 1d10+3. Se zerar o dano e tiver uma mão livre, apanha o projétil caso caiba em uma mão."
 },
 "t_teletransporteSombrio": {
  "name": "Teletransporte Sombrio",
  "desc": "Recarga 5–6. Como ação bônus, teletransporta-se até 9 m para um espaço desocupado, desde que a origem e o destino estejam na penumbra ou escuridão; não precisa ver o destino."
 },
 "t_reflexaoDeMagia": {
  "name": "Reflexão de Magia",
  "desc": "Quando passa em um teste de resistência contra uma magia ou um ataque mágico erra, redireciona a magia para outra criatura visível a até 36 m, inclusive o conjurador. O novo alvo faz seu próprio teste, ou o ataque é rolado de novo contra ele."
 },
 "t_bocaDaLoucura": {
  "name": "Boca da Loucura",
  "desc": "É imune a confusão e magias parecidas, e em todo turno gasta todo o movimento indo até a criatura (ou comida) mais próxima. No início do turno rola 1d10: 1–3, três socos num alvo aleatório; 4–5, um soco em cada criatura ao alcance; 6–7, uma mordida num alvo aleatório; 8–10, uma mordida e dois socos num alvo aleatório. Sem ninguém ao alcance: em 1–3 e 8–10 ganha vantagem nos ataques até o fim do próximo turno, em 4–5 soca a si mesmo e em 6–7 fica atordoado até o início do próximo turno."
 },
 "t_colheitaSinistra": {
  "name": "Colheita Sinistra",
  "desc": "Uma vez por turno, ao matar com magia de 1º nível ou superior uma criatura que não seja constructo nem morto-vivo, recupera PV iguais ao dobro do nível da magia, ou o triplo se for de necromancia."
 },
 "t_sentirCriaturas": {
  "name": "Sentir Criaturas",
  "desc": "Percebe a distância, a direção e o valor de Inteligência de toda criatura com Inteligência 4 ou mais num raio de cerca de 3 km. Magias como limpar a mente ou indetectável bloqueiam essa percepção."
 },
 "t_nilboguismo": {
  "name": "Nilboguismo",
  "desc": "Uma criatura que tente causar dano ao nilbog faz antes um teste de resistência de Carisma CD 12; se falhar, fica enfeitiçada até o fim do próximo turno dela e gasta a ação louvando o nilbog. Ele não recupera PV de nenhuma forma, nem por cura mágica, exceto pela reação Reviravolta da Sorte."
 },
 "t_reviravoltaDaSorte": {
  "name": "Reviravolta da Sorte",
  "desc": "Quando outra criatura lhe causa dano, o nilbog reduz esse dano a 0 e recupera 1d6 PV."
 },
 "t_comandoDeIlneval": {
  "name": "Comando de Ilneval",
  "desc": "Recarga 4–6. Até três orcs aliados a até 36 m que possam ouvi-lo usam a reação para fazer um ataque com arma cada."
 },
 "t_golpeadorDeInimigosDeIlneval": {
  "name": "Golpeador de Inimigos de Ilneval",
  "desc": "Os acertos com espada longa causam um dado de dano adicional, já somado no ataque."
 },
 "t_vingancaCorrompida": {
  "name": "Vingança Corrompida",
  "desc": "O orc reduz os próprios PV a 0, detonando seu Portador Corrompido."
 },
 "t_nutridoDeYurtrus": {
  "name": "Nutrido de Yurtrus",
  "desc": "Tem vantagem em testes de resistência contra veneno e doenças."
 },
 "t_veuDeShargaas": {
  "name": "Véu de Shargaas",
  "desc": "Conjura escuridão sem componentes, usando Sabedoria. Recarrega após descanso curto ou longo."
 },
 "t_maoDeShargaas": {
  "name": "Mão de Shargaas",
  "desc": "Seus ataques com arma causam 2 dados extras de dano, já somados nos ataques."
 },
 "t_visaoDeShargaas": {
  "name": "Visão de Shargaas",
  "desc": "Sua visão no escuro funciona normalmente dentro de escuridão mágica."
 },
 "t_matador": {
  "name": "Matador",
  "desc": "Na primeira rodada de combate, tem vantagem nos ataques contra criaturas que ainda não agiram. Qualquer acerto nessa rodada contra uma criatura surpresa é crítico automático."
 },
 "t_animalDeCarga": {
  "name": "Animal de Carga",
  "desc": "Para calcular quanto peso consegue carregar, o boi conta como um animal de tamanho Enorme."
 },
 "t_movimentoBorrado": {
  "name": "Movimento Borrado",
  "desc": "Jogadas de ataque contra o velocino têm desvantagem, a menos que ele esteja incapacitado ou contido."
 },
 "t_perseguicaoDeFerro": {
  "name": "Perseguição de Ferro",
  "desc": "Move-se até seu deslocamento em direção a uma criatura visível e a chuta. O alvo faz teste de resistência de Destreza CD 14; se falhar, sofre 20 (3d10 + 4) de dano de concussão e fica caído."
 },
 "t_botasDeFerro": {
  "name": "Botas de Ferro",
  "desc": "Enquanto se move, tem desvantagem em testes de Destreza (Furtividade)."
 },
 "t_forcaDesproporcional": {
  "name": "Força Desproporcional",
  "desc": "Conta como Médio para agarrar e não sofre desvantagem ao atacar com armas pesadas."
 },
 "t_anatomiaPisciana": {
  "name": "Anatomia Pisciana",
  "desc": "Conforme o corpo, usa uma destas opções (+5 para acertar): Mordida a 1,5 m, 4 (1d4+2) perfurante; Espinhos Venenosos a 1,5 m, 3 (1d6) de veneno e CD 12 de Constituição para não ficar envenenado por 1 minuto (repete ao fim de cada turno); Tentáculo a 3 m, 5 (1d6+2) de concussão e agarra criatura Média ou menor (CD 12 para escapar), sem poder usar esse tentáculo em outro alvo enquanto durar."
 },
 "t_anfibioLimitado": {
  "name": "Anfíbio Limitado",
  "desc": "Respira ar e água, mas precisa ficar submersa no mar por 1 minuto ao menos uma vez por dia, ou começa a sufocar."
 },
 "t_percepcaoEterea": {
  "name": "Percepção Etérea",
  "desc": "Enxerga criaturas e objetos que estejam no Plano Etéreo."
 },
 "t_mesclarSeAsSombras": {
  "name": "Mesclar-se às Sombras",
  "desc": "Em penumbra ou escuridão, pode usar uma ação bônus para ficar invisível junto com o que carrega. O efeito termina se ele atacar, entrar em luz plena, ficar incapacitado ou encerrá-lo com outra ação bônus."
 },
 "t_sanguessugaVital": {
  "name": "Sanguessuga Vital",
  "desc": "Uma criatura Grande ou menor a até 1,5 m faz teste de resistência de Destreza CD 13 ou fica agarrada (fuga CD 13), contida e sem conseguir respirar, a menos que respire água. No início de cada turno dela, sofre 16 (3d10) de dano necrótico; só agarra um alvo por vez."
 },
 "t_rastreadorAgucado": {
  "name": "Rastreador Aguçado",
  "desc": "Tem vantagem em testes de Sabedoria para rastrear presas."
 },
 "t_furtividadeAquatica": {
  "name": "Furtividade Aquática",
  "desc": "Submerso, tem vantagem em testes de Destreza (Furtividade) para se esconder e pode se Esconder como ação bônus."
 },
 "t_vermes": {
  "name": "Vermes",
  "desc": "Se for alvo de um efeito que cure doenças ou remova maldições, seus vermes morrem e ela perde a ação Verme Escavador."
 },
 "t_toquePetrificante": {
  "name": "Toque Petrificante",
  "desc": "Uma criatura Média ou menor a até 3 m e enfeitiçada pelo gigante faz teste de resistência de Constituição CD 17; se falhar, fica petrificada e pode ser presa ao corpo dele. Enquanto o gigante viver, restauração maior e magias semelhantes não a libertam."
 },
 "t_encantoDoAndarilhoDosSonhos": {
  "name": "Encanto do Andarilho dos Sonhos",
  "desc": "Inimigos que começam o turno a até 9 m do gigante (se ele não estiver incapacitado) fazem teste de resistência de Carisma CD 13 ou ficam enfeitiçados. Repetem o teste no fim de cada turno; ao passar, ficam imunes a este efeito por 24 horas."
 },
 "t_dardoDeVento": {
  "name": "Dardo de Vento",
  "desc": "Arremessa um dardo de vento mágico numa criatura visível a até 180 m; acerta automaticamente, causando 19 (3d6 + 9) de dano perfurante, e então desaparece."
 },
 "t_mordidas": {
  "name": "Mordidas",
  "desc": "Ataque corpo a corpo +0, alcance 0 m, uma criatura no espaço do enxame: o alvo é infestado por 1d4 larvas, sofrendo 1d6 de dano perfurante por larva no início de cada turno dele. Aplicar fogo à ferida até o fim do próximo turno do alvo causa 1 de dano de fogo e mata essas larvas; depois disso, só efeitos que curem doenças as eliminam. Se o alvo infestado terminar o turno com 0 PV, ele morre."
 },
 "t_defesaElegante": {
  "name": "Defesa Elegante",
  "desc": "Usando armadura leve ou nenhuma e sem escudo, soma o modificador de Carisma à CA."
 },
 "t_furiaDesenfreada": {
  "name": "Fúria Desenfreada",
  "desc": "Ao ser atingido por um ataque corpo a corpo, faz um ataque corpo a corpo com arma, com vantagem, contra quem o atingiu."
 },
 "t_corpoEspinhoso": {
  "name": "Corpo Espinhoso",
  "desc": "No início de seu turno, causa 2 (1d4) de dano perfurante a cada criatura que o esteja agarrando."
 },
 "t_pedraDoTransmutador": {
  "name": "Pedra do Transmutador",
  "desc": "A pedra dá ao portador um efeito: visão no escuro de 18 m, +3 m de deslocamento sem carga, proficiência em resistência de Constituição, ou resistência a ácido, frio, fogo, elétrico ou trovejante. Ao lançar uma magia de transmutação de 1º nível ou mais, o transmutador pode trocar o efeito."
 },
 "t_sufocar": {
  "name": "Sufocar",
  "desc": "Uma criatura Grande ou menor a até 1,5 m faz teste de resistência de Destreza CD 14; se falhar, fica agarrada (fuga CD 14), contida, cega e sob risco de sufocar. No início de cada turno dela, sofre 17 (4d6+3) de dano de concussão e 3 (1d6) de ácido. Só sufoca uma criatura por vez."
 },
 "t_nucleoPsionico": {
  "name": "Núcleo Psiônico",
  "desc": "Se estiver ligado a um cérebro ancião, permite que ele se conecte a qualquer criatura que o ulitharid detecte com Sentir Criaturas. A ligação com o cérebro ancião se mantém a qualquer distância no mesmo plano, e o ulitharid pode rompê-la livremente se estiver a mais de 8 km dele."
 },
 "t_beijo": {
  "name": "Beijo",
  "desc": "Um humanoide incapacitado a até 1,5 m faz teste de resistência de Carisma CD 12 ou fica amaldiçoado, perdendo 1 de Carisma por hora (a contagem pausa sob luz solar ou da magia luz do dia). Ao chegar a Carisma 2, morre e sua cabeça vira um novo vargouille; remover maldição, restauração maior ou magia similar antes disso desfaz a maldição e seus efeitos."
 },
 "t_golpeGuiado": {
  "name": "Golpe Guiado",
  "desc": "Recarrega após descanso curto ou longo. Concede +10 a uma jogada de ataque sua ou de uma criatura a até 9 m, podendo decidir depois de ver o resultado, mas antes de saber se acertou."
 },
 "t_fugaNebulosa": {
  "name": "Fuga Nebulosa",
  "desc": "Ao sofrer dano, fica invisível e se teleporta até 18 m para um espaço visível desocupado. A invisibilidade dura até o início do próximo turno ou até atacar, rolar dano ou conjurar; recarrega em descanso curto ou longo."
 },
 "t_sorteDoProprioSombrio": {
  "name": "Sorte do Próprio Sombrio",
  "desc": "Ao fazer um teste de habilidade ou de resistência, pode somar 1d10 ao resultado, mesmo depois de rolar, desde que antes de o efeito ser aplicado. Recarrega após um descanso curto ou longo."
 },
 "t_sobrevivente": {
  "name": "Sobrevivente",
  "desc": "No início do seu turno, recupera 10 PV se estiver com pelo menos 1 PV e abaixo da metade do seu máximo."
 },
 "t_clavaMagica": {
  "name": "Clava Mágica",
  "desc": "Nas mãos do guardião, a clava é mágica e causa 7 (3d4) de dano extra, já somado aos ataques."
 },
 "t_passoArboreo": {
  "name": "Passo Arbóreo",
  "desc": "Uma vez por turno, gasta 3 m de movimento para entrar numa árvore viva a até 1,5 m e sair de outra visível a até 18 m, surgindo a até 1,5 m dela. Ambas devem ser Grandes ou maiores."
 },
 "t_bandoOpressor": {
  "name": "Bando Opressor",
  "desc": "Tem vantagem em testes de Força (Atletismo) para empurrar uma criatura se um aliado não incapacitado estiver a até 1,5 m do alvo."
 },
 "t_linguaDeRaxivort": {
  "name": "Língua de Raxivort",
  "desc": "Consegue se comunicar com morcegos e ratos, comuns ou gigantes."
 },
 "t_banimentoPelaLuzSolar": {
  "name": "Banimento pela Luz Solar",
  "desc": "Se começa o turno sob luz solar, é levado ao Etéreo Profundo e fica lá enquanto o sol iluminar o local. Após o pôr do sol, reaparece na Fronteira Etérea, sem poder interagir com o Plano Material, e só retorna com uma ação quando estiver adjacente ao mestre ou a um companheiro de matilha."
 },
 "t_vinculoTelepatico": {
  "name": "Vínculo Telepático",
  "desc": "No mesmo plano que o mestre, compartilha com ele o que percebe e os dois se comunicam por telepatia."
 },
 "t_seisCabecas": {
  "name": "Seis Cabeças",
  "desc": "Tem vantagem em testes de Sabedoria (Percepção) e em testes de resistência contra ficar cego, enfeitiçado, surdo, amedrontado, atordoado ou inconsciente."
 },
 "t_tipoDeMaldito": {
  "name": "Tipo de Maldito",
  "desc": "Tipo 4: corpo humano com uma ou mais caudas de serpente. Tipo 5: corpo humano coberto de escamas."
 },
 "t_presasMentais": {
  "name": "Presas Mentais",
  "desc": "Duas vezes por dia, ao acertar o primeiro ataque corpo a corpo no seu turno, pode causar 16 (3d10) de dano psíquico extra ao alvo."
 },
 "t_bencaoDeSseth": {
  "name": "Bênção de Sseth",
  "desc": "Sempre que reduz um inimigo a 0 PV, recebe 9 PV temporários."
 },
 "t_presasDaMorte": {
  "name": "Presas da Morte",
  "desc": "Duas vezes por dia, no primeiro acerto corpo a corpo do turno, causa 16 (3d10) de dano necrótico extra."
 },
 "t_discipuloDoVeneno": {
  "name": "Discípulo do Veneno",
  "desc": "Duas vezes por dia, ao acertar o primeiro ataque corpo a corpo do turno, causa 16 (3d10) de dano de veneno adicional."
 }
};
