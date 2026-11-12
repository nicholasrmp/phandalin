// GERADO por src/dev/importar-itens.mjs dmg — não editar à mão. A regra de cada item mora em
// src/dev/itens/ajustes-dmg.mjs, o texto em src/dev/itens/dmg-pt.json (as nossas palavras, nunca a prosa do livro).
// O que ficou de fora, e por quê, está em src/dev/itens/dmg-pendente.json.
export const ITENS_LIVRO_DMG = {
  "armaduraDaVulnerabilidadeConcussao": {
    "id": "armaduraDaVulnerabilidadeConcussao",
    "name": "Armadura de vulnerabilidade (concussão)",
    "tipo": "armadura mágica",
    "art": "escudo",
    "pilha": false,
    "raridade": "raro",
    "sintonia": true,
    "peso": 65,
    "desc": "Armadura de placas que concede resistência a dano de concussão e exige sintonia. Amaldiçoada: ao se sintonizar, você fica vulnerável a dano perfurante e cortante, e tirar a armadura não resolve; só Remover Maldição ou magia semelhante quebra o efeito. A maldição só é descoberta com Identificação ou ao se sintonizar com ela. No jogo: sintonizada, resistência a concussão e vulnerabilidade a cortante e perfurante. No livro a maldição fica mesmo sem a armadura; aqui, ela sai quando se desfaz a sintonia.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Armor of Vulnerability (Bludgeoning)",
    "passivo": {
      "resiste": [
        "concussão"
      ],
      "vulneravel": [
        "cortante",
        "perfurante"
      ]
    }
  },
  "armaduraDaVulnerabilidadePerfurante": {
    "id": "armaduraDaVulnerabilidadePerfurante",
    "name": "Armadura de vulnerabilidade (perfurante)",
    "tipo": "armadura mágica",
    "art": "escudo",
    "pilha": false,
    "raridade": "raro",
    "sintonia": true,
    "peso": 65,
    "desc": "Armadura de placas que concede resistência a dano perfurante e exige sintonia. É amaldiçoada: ao se sintonizar com ela, você ganha vulnerabilidade a dano de concussão e cortante, e tirar a armadura não resolve, pois só Remover Maldição ou magia parecida acaba com o efeito. A maldição só é descoberta com Identificação ou no momento da sintonia. No jogo: sintonizada, resistência a perfurante e vulnerabilidade a concussão e cortante. No livro a maldição fica mesmo sem a armadura; aqui, ela sai quando se desfaz a sintonia.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Armor of Vulnerability (Piercing)",
    "passivo": {
      "resiste": [
        "perfurante"
      ],
      "vulneravel": [
        "concussão",
        "cortante"
      ]
    }
  },
  "armaduraDaVulnerabilidadeCortante": {
    "id": "armaduraDaVulnerabilidadeCortante",
    "name": "Armadura de vulnerabilidade (cortante)",
    "tipo": "armadura mágica",
    "art": "escudo",
    "pilha": false,
    "raridade": "raro",
    "sintonia": true,
    "peso": 65,
    "desc": "Armadura de placas que concede resistência a dano cortante e exige sintonia. Amaldiçoada: ao se sintonizar, você passa a ter vulnerabilidade a dano de concussão e perfurante, e tirar a armadura não resolve; só Remover Maldição ou magia semelhante encerra o efeito. A maldição só é revelada pela magia Identificação ou no momento da sintonia. No jogo: sintonizada, resistência a cortante e vulnerabilidade a concussão e perfurante. No livro a maldição fica mesmo sem a armadura; aqui, ela sai quando se desfaz a sintonia.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Armor of Vulnerability (Slashing)",
    "passivo": {
      "resiste": [
        "cortante"
      ],
      "vulneravel": [
        "concussão",
        "perfurante"
      ]
    }
  },
  "cintoDoGiganteDasNuvens": {
    "id": "cintoDoGiganteDasNuvens",
    "name": "Cinto de força do gigante das nuvens",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 1,
    "desc": "Item lendário que exige sintonia. Enquanto você o usa, seu valor de Força passa a ser 27. Se sua Força natural já for 27 ou maior, ele não tem efeito. No jogo: sintonizado, a Força vira 27.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Belt of Cloud Giant Strength",
    "passivo": {
      "atributos": {
        "str": 27
      }
    }
  },
  "cinturaoDosAnoes": {
    "id": "cinturaoDosAnoes",
    "name": "Cinto dos anões",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "raro",
    "sintonia": true,
    "peso": 1,
    "desc": "Requer sintonia. Concede +2 de Constituição (máximo 20) e vantagem em testes de Carisma (Persuasão) com anões; a cada amanhecer, há 50% de chance de surgir ou engrossar uma barba. Usuários que não são anões também ganham visão no escuro de 18 m, o idioma Anão (fala, leitura e escrita), resistência a dano de veneno e vantagem em testes de resistência contra veneno. No jogo: sintonizado, +2 de Constituição (até 20), resistência e vantagem contra veneno e visão no escuro de 18 m; a vantagem na Persuasão com anões, não.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Belt of Dwarvenkind",
    "passivo": {
      "somaAtributo": {
        "con": 2
      },
      "resiste": [
        "veneno"
      ],
      "vantagemContraVeneno": true,
      "visao": 60
    }
  },
  "cintoDoGiganteDoFogo": {
    "id": "cintoDoGiganteDoFogo",
    "name": "Cinto de força do gigante do fogo",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "muito raro",
    "sintonia": true,
    "peso": 1,
    "desc": "Enquanto você usa este cinto, seu valor de Força passa a ser 25; se a sua Força natural já for 25 ou mais, ele não traz benefício. Exige sintonia. No jogo: sintonizado, a Força vira 25.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Belt of Fire Giant Strength",
    "passivo": {
      "atributos": {
        "str": 25
      }
    }
  },
  "cintoDoGiganteDoGelo": {
    "id": "cintoDoGiganteDoGelo",
    "name": "Cinto de força do gigante do gelo",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "muito raro",
    "sintonia": true,
    "peso": 1,
    "desc": "Enquanto você usa este cinto, sua Força passa a ser 23; se o seu valor natural já for 23 ou maior, ele não tem efeito. Requer sintonia. No jogo: sintonizado, a Força vira 23.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Belt of Frost Giant Strength",
    "passivo": {
      "atributos": {
        "str": 23
      }
    }
  },
  "cintoDoGiganteDaColina": {
    "id": "cintoDoGiganteDaColina",
    "name": "Cinto de força do gigante da colina",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "raro",
    "sintonia": true,
    "peso": 1,
    "desc": "Exige sintonia. Usando o cinto, seu valor de Força passa a ser 21; se a sua Força natural já for 21 ou mais, o item não traz benefício. No jogo: sintonizado, a Força vira 21.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Belt of Hill Giant Strength",
    "passivo": {
      "atributos": {
        "str": 21
      }
    }
  },
  "cintoDoGiganteDePedra": {
    "id": "cintoDoGiganteDePedra",
    "name": "Cinto de força do gigante de pedra",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "muito raro",
    "sintonia": true,
    "peso": 1,
    "desc": "Exige sintonia. Enquanto usa o cinturão, seu valor de Força passa a ser 23; se sua Força natural já for 23 ou mais, o item não traz benefício. No jogo: sintonizado, a Força vira 23.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Belt of Stone Giant Strength",
    "passivo": {
      "atributos": {
        "str": 23
      }
    }
  },
  "cintoDoGiganteDasTempestades": {
    "id": "cintoDoGiganteDasTempestades",
    "name": "Cinto de força do gigante das tempestades",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 1,
    "desc": "Enquanto você o usa, sua Força passa a ser 29; se o seu valor natural já for igual ou maior, o cinto não faz diferença. Exige sintonia. No jogo: sintonizado, a Força vira 29.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Belt of Storm Giant Strength",
    "passivo": {
      "atributos": {
        "str": 29
      }
    }
  },
  "blackrazor": {
    "id": "blackrazor",
    "name": "Blackrazor",
    "tipo": "arma mágica",
    "art": "espada",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 6,
    "desc": "Espada grande senciente (caótica neutra) que concede +3 nas jogadas de ataque e dano e exige sintonia de criatura não leal; ao reduzir a 0 PV uma criatura que não seja constructo nem morto-vivo, ela mata o alvo e consome sua alma (só Desejo o traz de volta), dando a você PV temporários iguais ao máximo de PV da vítima por 24 horas e, enquanto durarem com a espada em mãos, vantagem em ataques, testes de resistência e testes de atributo. Empunhando-a, você percebe criaturas vivas a até 18 m, não pode ficar enfeitiçado nem amedrontado, e uma vez por dia a espada conjura Velocidade em você e mantém a concentração por conta própria. Acertar um morto-vivo causa 1d10 de dano necrótico a você e cura o alvo em 1d10; se esse dano o levar a 0 PV, ela devora sua alma, e passar três dias sem consumir almas gera conflito com o portador. No jogo: sintonizada, +3 de ataque e dano; quem ela derruba a 0 PV (fora constructo e morto-vivo) morre, e o dono ganha PV temporários iguais ao máximo dele e, enquanto eles durarem, vantagem nos ataques, testes e resistências; acertar morto-vivo fere o dono em 1d10 necrótico e cura o morto-vivo em 1d10; não se fica enfeitiçado nem amedrontado. A Velocidade que ela conjura sozinha e a consciência da espada não entram.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Blackrazor",
    "passivo": {
      "imuneCondicao": [
        "enfeiticado",
        "amedrontado"
      ]
    },
    "base": "espadaGrande",
    "bonusAtaque": 3,
    "bonusDano": 3,
    "poder": "devoraAlma"
  },
  "botasDasTerrasInvernais": {
    "id": "botasDasTerrasInvernais",
    "name": "Botas das terras invernais",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "incomum",
    "sintonia": true,
    "peso": 1,
    "desc": "Exige sintonia. Quem as calça tem resistência a dano de frio e não sofre com terreno difícil formado por gelo ou neve. Suporta frio de até cerca de −45 °C sem outra proteção, ou até cerca de −73 °C se estiver com roupas pesadas. No jogo: sintonizadas, resistência a frio; o terreno de gelo e neve ainda não existe no jogo.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Boots of the Winterlands",
    "passivo": {
      "resiste": [
        "frio"
      ]
    }
  },
  "capuzDaRespiracaoAquatica": {
    "id": "capuzDaRespiracaoAquatica",
    "name": "Capuz de respiração aquática",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "incomum",
    "sintonia": false,
    "peso": 1,
    "desc": "Embaixo d'água, use uma ação e diga a palavra de comando para envolver sua cabeça numa bolha de ar que permite respirar normalmente. A bolha dura até você repetir a palavra, tirar o capuz ou sair da água. Não exige sintonia. No jogo: quem o leva respira debaixo da água; a bolha se forma sozinha, sem gastar a ação.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Cap of Water Breathing",
    "passivo": {
      "respiraNaAgua": true
    }
  },
  "diademaDaExplosao": {
    "id": "diademaDaExplosao",
    "name": "Diadema da explosão",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "incomum",
    "sintonia": false,
    "peso": 1,
    "desc": "Usando o diadema, você pode gastar uma ação para conjurar Raio Ardente, fazendo as jogadas de ataque da magia com bônus de +5. Só pode ser usado uma vez, e o uso volta no amanhecer seguinte. Não exige sintonia. No jogo: conjura o Raio Ardente uma vez por dia, com +5 de ataque, mesmo na mão de quem não é conjurador.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Circlet of Blasting",
    "conjura": {
      "cargas": 1,
      "recarga": null,
      "ataque": 5,
      "magias": {
        "raioArdente": {
          "custo": 1
        }
      }
    }
  },
  "mantoDaAracnidea": {
    "id": "mantoDaAracnidea",
    "name": "Manto do aracnídeo",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "muito raro",
    "sintonia": true,
    "peso": 1,
    "desc": "Exige sintonia. Vestindo-o, você tem resistência a dano de veneno e deslocamento de escalada igual ao de caminhada, podendo andar por paredes e tetos de cabeça para baixo sem usar as mãos; teias nunca o prendem e você as atravessa como terreno difícil. Uma vez por dia (recarrega ao amanhecer), com uma ação, conjura Teia (CD 13) cobrindo o dobro da área normal. No jogo: sintonizado, resistência a veneno e a Teia uma vez por dia, CD 13, na área normal; a escalada e a imunidade às teias ainda não.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Cloak of Arachnida",
    "passivo": {
      "resiste": [
        "veneno"
      ]
    },
    "conjura": {
      "cargas": 1,
      "recarga": null,
      "cd": 13,
      "magias": {
        "teia": {
          "custo": 1
        }
      }
    }
  },
  "cotaDeMalhaEfreeti": {
    "id": "cotaDeMalhaEfreeti",
    "name": "Cota de malha efreeti",
    "tipo": "armadura mágica",
    "art": "escudo",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 55,
    "desc": "Cota de malha lendária que exige sintonia: concede +3 na CA, imunidade a dano de fogo e a capacidade de falar e entender Primordial. O usuário também pode andar e ficar parado sobre rocha derretida como se fosse chão firme. No jogo: vestida e sintonizada, +3 na CA e imunidade a fogo; o andar sobre lava e o primordial não entram.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Efreeti Chain",
    "passivo": {
      "imune": [
        "fogo"
      ]
    },
    "base": "cotaDeMalha",
    "acBonusArmadura": 3
  },
  "elixirDaSaude": {
    "id": "elixirDaSaude",
    "name": "Elixir da saúde",
    "tipo": "poção",
    "art": "cura",
    "pilha": true,
    "raridade": "raro",
    "sintonia": false,
    "peso": 0.5,
    "desc": "Poção de uso único: quem a bebe fica livre de qualquer doença e deixa de estar cego, surdo, paralisado ou envenenado. Não exige sintonia. No jogo: beber gasta uma ação, e tira as condições cego, surdo, paralisado e envenenado, e qualquer doença.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Elixir of Health",
    "consumivel": "limpar",
    "remove": [
      "cego",
      "surdo",
      "paralisado",
      "envenenado"
    ],
    "curaDoenca": true,
    "acao": "acao"
  },
  "mantoDeResistenciaAMagia": {
    "id": "mantoDeResistenciaAMagia",
    "name": "Manto de resistência à magia",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "raro",
    "sintonia": true,
    "peso": 1,
    "desc": "Quem veste este manto recebe vantagem em todos os testes de resistência contra magias. Exige sintonia. No jogo: sintonizado, vantagem em toda resistência contra magia.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Mantle of Spell Resistance",
    "passivo": {
      "vantagemContraMagia": true
    }
  },
  "armaduraDoMarinheiro": {
    "id": "armaduraDoMarinheiro",
    "name": "Couro batido do marinheiro",
    "tipo": "armadura mágica",
    "art": "escudo",
    "pilha": false,
    "raridade": "incomum",
    "sintonia": false,
    "peso": 1,
    "desc": "Enquanto veste esta armadura, você ganha deslocamento de natação igual ao seu deslocamento de caminhada. Se começar seu turno submerso e com 0 PV, a armadura o faz subir 18 m em direção à superfície. Não exige sintonia. No jogo: o livro diz \"qualquer armadura\", e aqui é couro batido; vestida, nada com o mesmo deslocamento de andar. A subida de 18 m de quem cai a 0 PV debaixo da água não entra.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Mariner's Armor",
    "passivo": {
      "nado": true
    },
    "base": "couroBatido"
  },
  "pocaoDeVoo": {
    "id": "pocaoDeVoo",
    "name": "Poção de voo",
    "tipo": "poção",
    "art": "cura",
    "pilha": true,
    "raridade": "muito raro",
    "sintonia": false,
    "peso": 0.5,
    "desc": "Ao beber, você ganha por 1 hora deslocamento de voo igual ao seu deslocamento de caminhada e pode pairar no ar. Se o efeito acabar enquanto você estiver voando, você cai, a menos que tenha outro meio de se manter no ar. Não exige sintonia. No jogo: beber gasta uma ação, e o voo dura uma hora (600 rodadas).",
    "fonte": "livro-dmg",
    "nomeOriginal": "Potion of Flying",
    "consumivel": "condicao",
    "condicao": "voando",
    "rodadas": 600,
    "acao": "acao"
  },
  "anelDeEvasao": {
    "id": "anelDeEvasao",
    "name": "Anel de evasão",
    "tipo": "anel",
    "art": "arcano",
    "pilha": false,
    "raridade": "raro",
    "sintonia": true,
    "peso": 1,
    "desc": "Exige sintonia. Possui 3 cargas e recupera 1d3 delas a cada amanhecer. Se você falhar em um teste de resistência de Destreza usando o anel, pode gastar sua reação e 1 carga para transformar a falha em sucesso. No jogo: sintonizado, quando você falha num teste de resistência de Destreza, o anel gasta a reação e uma carga e o transforma em sucesso, sem perguntar.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Ring of Evasion",
    "passivo": {
      "evasao": true
    },
    "recarregavel": {
      "cargas": 3,
      "recarga": "1d3"
    }
  },
  "anelDeComandoDoFogo": {
    "id": "anelDeComandoDoFogo",
    "name": "Anel de comando dos elementais do fogo",
    "tipo": "anel",
    "art": "arcano",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 1,
    "desc": "Exige sintonia. Dá resistência a dano de fogo, permite falar e entender ignan e garante vantagem nos ataques contra elementais do Plano do Fogo, que têm desvantagem para atacar você. Tem 5 cargas (recupera 1d4+1 ao amanhecer, CD 17): 2 cargas conjuram Dominar Monstro num elemental do fogo. Depois de ajudar a matar um elemental do fogo, você fica imune a fogo e pode gastar cargas para Mãos Flamejantes (1), Bola de Fogo (2) ou Muralha de Fogo (3). No jogo: sintonizado, resistência a fogo; o domínio sobre os elementais e as magias que vêm depois de matar um ainda não.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Ring of Fire Elemental Command",
    "passivo": {
      "resiste": [
        "fogo"
      ]
    }
  },
  "cimitarraDaVelocidade": {
    "id": "cimitarraDaVelocidade",
    "name": "Cimitarra da velocidade",
    "tipo": "arma mágica",
    "art": "espada",
    "pilha": false,
    "raridade": "muito raro",
    "sintonia": true,
    "peso": 3,
    "desc": "Cimitarra mágica com bônus de +2 nas jogadas de ataque e de dano. Em cada um dos seus turnos, você pode usar uma ação bônus para realizar um ataque extra com ela. Requer sintonia. No jogo: sintonizada e na mão, +2 de ataque e dano e um golpe a mais com ela como ação bônus em cada turno (no menu do alvo).",
    "fonte": "livro-dmg",
    "nomeOriginal": "Scimitar of Speed",
    "base": "cimitarra",
    "bonusAtaque": 2,
    "bonusDano": 2,
    "poder": "velocidade"
  },
  "espadaDaRespostaRespondedora": {
    "id": "espadaDaRespostaRespondedora",
    "name": "Espada da resposta (Respondedora)",
    "tipo": "arma mágica",
    "art": "espada",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 3,
    "desc": "Espada longa lendária que concede +3 nas jogadas de ataque e de dano; exige sintonia de uma criatura caótica e boa. Enquanto a empunha, quando uma criatura ao seu alcance lhe causa dano, você pode usar a reação para atacá-la corpo a corpo com vantagem, e o dano desse golpe ignora resistências e imunidades do alvo. No jogo: sintonizada e na mão, +3 de ataque e dano; quem a fere a até o alcance dela leva um golpe de reação, com vantagem, que passa por cima de resistência e imunidade. O alinhamento da sintonia não entra: o jogo não tem alinhamento.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Sword of Answering (Answerer)",
    "base": "espadaLonga",
    "bonusAtaque": 3,
    "bonusDano": 3,
    "poder": "resposta"
  },
  "espadaDaRespostaReplica": {
    "id": "espadaDaRespostaReplica",
    "name": "Espada da resposta (Réplica)",
    "tipo": "arma mágica",
    "art": "espada",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 3,
    "desc": "Espada longa lendária que concede +3 nas jogadas de ataque e de dano e exige sintonia de uma criatura caótica e má. Enquanto você a empunha, se uma criatura ao seu alcance lhe causar dano, você pode usar a reação para golpeá-la com vantagem, e o dano desse contra-ataque ignora qualquer resistência ou imunidade do alvo. No jogo: sintonizada e na mão, +3 de ataque e dano; quem a fere a até o alcance dela leva um golpe de reação, com vantagem, que passa por cima de resistência e imunidade. O alinhamento da sintonia não entra: o jogo não tem alinhamento.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Sword of Answering (Back Talker)",
    "base": "espadaLonga",
    "bonusAtaque": 3,
    "bonusDano": 3,
    "poder": "resposta"
  },
  "espadaDaRespostaConclusora": {
    "id": "espadaDaRespostaConclusora",
    "name": "Espada da resposta (Conclusora)",
    "tipo": "arma mágica",
    "art": "espada",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 3,
    "desc": "Espada longa lendária que concede +3 nas jogadas de ataque e de dano e exige sintonia de uma criatura leal e neutra. Enquanto a empunha, quando uma criatura ao seu alcance lhe causa dano, você pode usar sua reação para atacá-la corpo a corpo com vantagem. O dano desse contra-ataque ignora qualquer resistência ou imunidade do alvo. No jogo: sintonizada e na mão, +3 de ataque e dano; quem a fere a até o alcance dela leva um golpe de reação, com vantagem, que passa por cima de resistência e imunidade. O alinhamento da sintonia não entra: o jogo não tem alinhamento.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Sword of Answering (Concluder)",
    "base": "espadaLonga",
    "bonusAtaque": 3,
    "bonusDano": 3,
    "poder": "resposta"
  },
  "espadaDaRespostaUltimaTirada": {
    "id": "espadaDaRespostaUltimaTirada",
    "name": "Espada da resposta (Última Tirada)",
    "tipo": "arma mágica",
    "art": "espada",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 3,
    "desc": "Espada longa que concede +3 nas jogadas de ataque e dano; exige sintonia com uma criatura caótica e neutra. Quando uma criatura ao seu alcance causa dano a você, você pode usar sua reação para atacá-la com a espada, com vantagem, e o dano desse ataque ignora qualquer resistência ou imunidade a dano do alvo. No jogo: sintonizada e na mão, +3 de ataque e dano; quem a fere a até o alcance dela leva um golpe de reação, com vantagem, que passa por cima de resistência e imunidade. O alinhamento da sintonia não entra: o jogo não tem alinhamento.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Sword of Answering (Last Quip)",
    "base": "espadaLonga",
    "bonusAtaque": 3,
    "bonusDano": 3,
    "poder": "resposta"
  },
  "espadaDaRespostaRefutadora": {
    "id": "espadaDaRespostaRefutadora",
    "name": "Espada da resposta (Refutadora)",
    "tipo": "arma mágica",
    "art": "espada",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 3,
    "desc": "Espada longa com topázio no pomo que concede +3 nas jogadas de ataque e de dano. Enquanto você a empunha, quando uma criatura ao seu alcance lhe causa dano, você pode usar a reação para atacá-la corpo a corpo com vantagem, e o dano desse golpe ignora imunidades e resistências do alvo. Exige sintonia de uma criatura neutra e boa. No jogo: sintonizada e na mão, +3 de ataque e dano; quem a fere a até o alcance dela leva um golpe de reação, com vantagem, que passa por cima de resistência e imunidade. O alinhamento da sintonia não entra: o jogo não tem alinhamento.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Sword of Answering (Rebutter)",
    "base": "espadaLonga",
    "bonusAtaque": 3,
    "bonusDano": 3,
    "poder": "resposta"
  },
  "espadaDaRespostaReplicante": {
    "id": "espadaDaRespostaReplicante",
    "name": "Espada da resposta (Replicante)",
    "tipo": "arma mágica",
    "art": "espada",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 3,
    "desc": "Espada longa com +3 nas jogadas de ataque e dano, que exige sintonia de uma criatura neutra. Enquanto a empunha, quando uma criatura ao seu alcance lhe causa dano, você pode usar sua reação para atacá-la corpo a corpo com vantagem. O dano desse contra-ataque ignora imunidades e resistências do alvo. No jogo: sintonizada e na mão, +3 de ataque e dano; quem a fere a até o alcance dela leva um golpe de reação, com vantagem, que passa por cima de resistência e imunidade. O alinhamento da sintonia não entra: o jogo não tem alinhamento.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Sword of Answering (Replier)",
    "base": "espadaLonga",
    "bonusAtaque": 3,
    "bonusDano": 3,
    "poder": "resposta"
  },
  "espadaDaRespostaRetrucadora": {
    "id": "espadaDaRespostaRetrucadora",
    "name": "Espada da resposta (Retrucadora)",
    "tipo": "arma mágica",
    "art": "espada",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 3,
    "desc": "Espada longa lendária com bônus de +3 nas jogadas de ataque e dano; exige sintonia com uma criatura leal e boa. Quando uma criatura ao seu alcance causa dano a você, pode usar a reação para golpeá-la com vantagem, e o dano desse contra-ataque ignora resistências e imunidades do alvo. No jogo: sintonizada e na mão, +3 de ataque e dano; quem a fere a até o alcance dela leva um golpe de reação, com vantagem, que passa por cima de resistência e imunidade. O alinhamento da sintonia não entra: o jogo não tem alinhamento.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Sword of Answering (Retorter)",
    "base": "espadaLonga",
    "bonusAtaque": 3,
    "bonusDano": 3,
    "poder": "resposta"
  },
  "espadaDaRespostaDevastadora": {
    "id": "espadaDaRespostaDevastadora",
    "name": "Espada da resposta (Devastadora)",
    "tipo": "arma mágica",
    "art": "espada",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 3,
    "desc": "Espada longa com +3 nas jogadas de ataque e de dano; exige sintonia de uma criatura leal e má. Enquanto você a empunha, quando uma criatura ao seu alcance lhe causa dano, você pode usar a reação para atacá-la com vantagem, e o dano desse golpe ignora resistências e imunidades do alvo. No jogo: sintonizada e na mão, +3 de ataque e dano; quem a fere a até o alcance dela leva um golpe de reação, com vantagem, que passa por cima de resistência e imunidade. O alinhamento da sintonia não entra: o jogo não tem alinhamento.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Sword of Answering (Scather)",
    "base": "espadaLonga",
    "bonusAtaque": 3,
    "bonusDano": 3,
    "poder": "resposta"
  },
  "espadaDaRespostaSilenciadora": {
    "id": "espadaDaRespostaSilenciadora",
    "name": "Espada da resposta (Silenciadora)",
    "tipo": "arma mágica",
    "art": "espada",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 3,
    "desc": "Espada longa que concede +3 nas jogadas de ataque e dano e exige sintonia de uma criatura neutra e má. Enquanto a empunha, quando uma criatura ao seu alcance lhe causa dano, você pode usar sua reação para atacá-la corpo a corpo com vantagem, e o dano desse golpe ignora resistências e imunidades do alvo. No jogo: sintonizada e na mão, +3 de ataque e dano; quem a fere a até o alcance dela leva um golpe de reação, com vantagem, que passa por cima de resistência e imunidade. O alinhamento da sintonia não entra: o jogo não tem alinhamento.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Sword of Answering (Squelcher)",
    "base": "espadaLonga",
    "bonusAtaque": 3,
    "bonusDano": 3,
    "poder": "resposta"
  },
  "espadaDaVinganca": {
    "id": "espadaDaVinganca",
    "name": "Espada da vingança",
    "tipo": "arma mágica",
    "art": "espada",
    "pilha": false,
    "raridade": "incomum",
    "sintonia": true,
    "peso": 1,
    "desc": "Espada amaldiçoada que concede +1 nas jogadas de ataque e dano e exige sintonia; enquanto sintonizado, você se recusa a largá-la e tem desvantagem ao atacar com outras armas. Sempre que sofrer dano em combate com ela consigo, faça um teste de resistência de Sabedoria CD 15; se falhar, precisa atacar quem o feriu até que um dos dois chegue a 0 PV ou até não conseguir mais alcançá-lo corpo a corpo. A maldição some pelos meios comuns ou conjurando Banimento na espada, que então vira apenas uma Arma +1. No jogo: sintonizada, +1 de ataque e dano; desvantagem nos ataques com outra arma; e a cada dano sofrido numa luta, Sabedoria CD 15 ou desvantagem contra quem não seja quem feriu, por 1 minuto. Desfazer a maldição pede magia que o jogo não tem.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Sword of Vengeance",
    "base": "espadaLonga",
    "bonusAtaque": 1,
    "bonusDano": 1,
    "poder": "vinganca"
  },
  "espadaCruel": {
    "id": "espadaCruel",
    "name": "Espada longa cruel",
    "tipo": "arma mágica",
    "art": "espada",
    "pilha": false,
    "raridade": "raro",
    "sintonia": false,
    "peso": 1,
    "desc": "Ao tirar 20 no dado de ataque com esta arma mágica, o alvo sofre 7 de dano adicional do mesmo tipo da arma (o SRD indica 2d6, valor considerado um erro). Não exige sintonia. No jogo: o livro diz \"qualquer arma\", e aqui é uma espada longa; no 20 natural, +7 de dano do tipo dela.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Vicious Weapon",
    "base": "espadaLonga",
    "poder": "cruel"
  },
  "onda": {
    "id": "onda",
    "name": "Onda",
    "tipo": "arma mágica",
    "art": "lanca",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 4,
    "desc": "Tridente senciente que concede +3 nas jogadas de ataque e de dano; num acerto crítico, o alvo sofre dano necrótico extra igual à metade do seu máximo de PV. Também funciona como Tridente de Comando de Peixes, Arma de Alerta e Cubo de Força (você escolhe o efeito diretamente) e, enquanto empunhado, permite respirar debaixo d'água como o Capuz de Respiração Aquática. Exige sintonia de um adorador de um deus do mar; é neutro (Int 14, Sab 10, Car 18), tem visão no escuro de 36 m, fala Aquan por telepatia e conversa com animais aquáticos. No jogo: sintonizado, +3 de ataque e dano; no crítico, o alvo sofre necrótico a mais igual à metade dos PV máximos dele; respira debaixo da água. O comando de peixes, o aviso, o cubo de força e a consciência do tridente não entram.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Wave",
    "passivo": {
      "respiraNaAgua": true
    },
    "base": "tridente",
    "bonusAtaque": 3,
    "bonusDano": 3,
    "poder": "onda"
  },
  "whelm": {
    "id": "whelm",
    "name": "Whelm",
    "tipo": "arma mágica",
    "art": "martelo",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 2,
    "desc": "Martelo de guerra senciente +3 que exige sintonia com um anão; pode ser arremessado (6/18 m), volta à mão e causa 1d8 de dano de concussão extra (2d8 contra gigantes), mas, a partir do amanhecer seguinte ao primeiro ataque, o portador sofre desvantagem em ataques, testes de resistência e testes de atributo enquanto vê o céu diurno. Uma vez por amanhecer, com uma ação, golpeia o chão e as criaturas escolhidas no solo a até 18 m fazem um teste de resistência de Constituição CD 15 ou ficam atordoadas por 1 minuto (repetem o teste ao fim de cada turno). Revela portas secretas a até 9 m e conjura Detectar o Bem e o Mal e Localizar Objeto, cada uma uma vez por amanhecer. No jogo: sintonizado, +3 de ataque e dano; arremessa a 6/18 m e volta à mão, e o golpe arremessado soma 1d8 de concussão (2d8 contra gigante). A onda de choque, o medo do céu aberto e a consciência do martelo não entram.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Whelm",
    "base": "marteloDeGuerra",
    "bonusAtaque": 3,
    "bonusDano": 3,
    "poder": "whelm",
    "propsExtra": [
      "arremesso"
    ],
    "alcance": [
      20,
      60
    ]
  }
};
