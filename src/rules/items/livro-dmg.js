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
  "bolsaDeTruquesCinza": {
    "id": "bolsaDeTruquesCinza",
    "name": "Bolsa de truques cinza",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "incomum",
    "sintonia": false,
    "peso": 0.5,
    "desc": "Com uma ação, você tira uma bolinha peluda da bolsa e a arremessa a até 6 m; ao cair, ela vira um animal amigável sorteado com 1d8 (de doninha e rato gigante até lobo atroz e alce gigante), que age no seu turno, obedece a comandos dados com ação bônus e some ao chegar a 0 PV ou no amanhecer seguinte. A bolsa fornece três bolinhas por dia e volta a funcionar ao amanhecer; não exige sintonia. No jogo: com a ação, três vezes por dia: a bolinha jogada a até 6 m vira a fera do d8 da bolsa cinza, que luta do seu lado (age sozinha ou com as suas ordens, como as outras invocações) e some no fim da luta.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Bag of Tricks, Gray",
    "conjura": {
      "cargas": 3,
      "recarga": null,
      "magias": {
        "bolsaDeTruquesCinza": {
          "custo": 1
        }
      }
    }
  },
  "bolsaDeTruquesFerrugem": {
    "id": "bolsaDeTruquesFerrugem",
    "name": "Bolsa de truques, ferrugem",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "incomum",
    "sintonia": false,
    "peso": 0.5,
    "desc": "Com uma ação, você tira um objeto peludo da bolsa e o arremessa a até 6 m; ao cair, ele vira um animal aliado sorteado em 1d8 (rato, coruja, mastim, bode, bode gigante, javali gigante, leão ou urso-pardo), que age no seu turno e recebe ordens com uma ação bônus. A criatura some ao chegar a 0 PV ou no amanhecer seguinte. Após três usos, a bolsa só volta a funcionar no próximo amanhecer; não exige sintonia. No jogo: com a ação, três vezes por dia: a bolinha jogada a até 6 m vira a fera do d8 da bolsa ferrugem, que luta do seu lado (age sozinha ou com as suas ordens, como as outras invocações) e some no fim da luta.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Bag of Tricks, Rust",
    "conjura": {
      "cargas": 3,
      "recarga": null,
      "magias": {
        "bolsaDeTruquesFerrugem": {
          "custo": 1
        }
      }
    }
  },
  "bolsaDeTruquesCastanha": {
    "id": "bolsaDeTruquesCastanha",
    "name": "Bolsa de truques (castanha)",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "incomum",
    "sintonia": false,
    "peso": 0.5,
    "desc": "Com uma ação, você tira uma bolinha peluda da bolsa e a arremessa a até 6 m; ao cair, ela vira um animal aliado sorteado em 1d8 (chacal, macaco, babuíno, bico-de-machado, urso-negro, doninha gigante, hiena gigante ou tigre), que age no seu turno e obedece a comandos dados com sua ação bônus. A criatura some ao chegar a 0 PV ou no amanhecer seguinte. A bolsa fornece até três criaturas por dia e volta a funcionar ao amanhecer; não exige sintonia. No jogo: com a ação, três vezes por dia: a bolinha jogada a até 6 m vira a fera do d8 da bolsa castanha, que luta do seu lado (age sozinha ou com as suas ordens, como as outras invocações) e some no fim da luta.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Bag of Tricks, Tan",
    "conjura": {
      "cargas": 3,
      "recarga": null,
      "magias": {
        "bolsaDeTruquesCastanha": {
          "custo": 1
        }
      }
    }
  },
  "contaDeForca": {
    "id": "contaDeForca",
    "name": "Conta de força",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "raro",
    "sintonia": false,
    "peso": 0.0625,
    "desc": "Com uma ação, você arremessa a conta a até 18 m; ela explode e some, e quem estiver num raio de 3 m faz um teste de resistência de Destreza CD 15 ou sofre 5d4 de dano energético. Por 1 minuto, uma esfera transparente cobre a área: quem falhou e está totalmente dentro fica preso, os demais são empurrados para fora, e só o ar atravessa a parede. Um preso pode usar a ação para rolar a esfera até metade do seu deslocamento, e ela pesa só 0,5 kg ao ser carregada; não exige sintonia. No jogo: jogada com a ação a até 18 m, uma vez: quem está a 3 m faz Destreza CD 15; quem falha sofre 5d4 de energia e fica preso numa esfera de força por 1 minuto, onde nada entra nem sai. Empurrar a esfera e empurrar para fora quem passou não entram.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Bead of Force",
    "conjura": {
      "cargas": 1,
      "recarga": 0,
      "magias": {
        "contaDeForca": {
          "custo": 1
        }
      }
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
  "tigelaDeComandoDaAgua": {
    "id": "tigelaDeComandoDaAgua",
    "name": "Tigela de comando de elementais da água",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "raro",
    "sintonia": false,
    "peso": 3,
    "desc": "Com a tigela cheia de água, você pode usar uma ação e dizer a palavra de comando para invocar um elemental da água, como se conjurasse Conjurar Elemental. Só pode ser usada assim uma vez por dia, recarregando ao amanhecer. Não exige sintonia. No jogo: com a ação, uma vez por dia: um elemental da água obedece enquanto durar a concentração (até 1 hora); se ela cair antes, ele fica, hostil a todos. A fonte de água que o livro pede não entra.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Bowl of Commanding Water Elementals",
    "conjura": {
      "cargas": 1,
      "recarga": null,
      "magias": {
        "elementalDaTigela": {
          "custo": 1
        }
      }
    }
  },
  "braseiroDeComandoDoFogo": {
    "id": "braseiroDeComandoDoFogo",
    "name": "Braseiro de comando de elementais do fogo",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "raro",
    "sintonia": false,
    "peso": 5,
    "desc": "Com fogo aceso no braseiro, você pode usar uma ação e dizer a palavra de comando para invocar um elemental do fogo, como pela magia Conjurar Elemental. Só pode ser usado uma vez por dia, recuperando o uso ao amanhecer. Não exige sintonia. No jogo: com a ação, uma vez por dia: um elemental do fogo obedece enquanto durar a concentração (até 1 hora); se ela cair antes, ele fica, hostil a todos. O braseiro aceso e o fogo que ele conjura não entra.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Brazier of Commanding Fire Elementals",
    "conjura": {
      "cargas": 1,
      "recarga": null,
      "magias": {
        "elementalDoBraseiro": {
          "custo": 1
        }
      }
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
  "incensarioDeControleDoAr": {
    "id": "incensarioDeControleDoAr",
    "name": "Incensário de controle dos elementais do ar",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "raro",
    "sintonia": false,
    "peso": 1,
    "desc": "Com incenso queimando no incensário, você pode usar uma ação e dizer a palavra de comando para invocar um elemental do ar, com o mesmo efeito da magia Conjurar Elemental. O poder só pode ser usado de novo após o próximo amanhecer. Não requer sintonia. No jogo: com a ação, uma vez por dia: um elemental do ar obedece enquanto durar a concentração (até 1 hora); se ela cair antes, ele fica, hostil a todos. O incenso aceso que o livro pede não entra.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Censer of Controlling Air Elementals",
    "conjura": {
      "cargas": 1,
      "recarga": null,
      "magias": {
        "elementalDoIncensario": {
          "custo": 1
        }
      }
    }
  },
  "sinoDaAbertura": {
    "id": "sinoDaAbertura",
    "name": "Sino da abertura",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "raro",
    "sintonia": false,
    "peso": 1,
    "desc": "Com uma ação, você toca o tubo apontando para um objeto que possa ser aberto a até 36 m, como uma porta, tampa ou fechadura. Se o som alcançar o alvo, uma tranca ou trinco se solta; sem trancas restantes, o próprio objeto se abre. Funciona dez vezes e depois racha, tornando-se inútil; não exige sintonia. No jogo: no menu de qualquer porta trancada a até 36 m que se vê: tocar o sino destranca e abre, uma das dez cargas (que não voltam). Vale também contra a Tranca Arcana, que o livro só suprime por 10 minutos.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Chime of Opening",
    "recarregavel": {
      "cargas": 10,
      "recarga": 0
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
  "mantoDaInvisibilidade": {
    "id": "mantoDaInvisibilidade",
    "name": "Manto da invisibilidade",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 1,
    "desc": "Exige sintonia. Com uma ação, você cobre a cabeça com o capuz e fica invisível junto com tudo o que carrega ou veste; com outra ação, abaixa o capuz e volta a ser visível. O manto acumula até 2 horas de uso, gastas em blocos de 1 minuto, e para de funcionar quando elas acabam; a cada 12 horas seguidas sem uso, recupera 1 hora. No jogo: sintonizado, Erguer o capuz (a ação) deixa invisível até Baixar o capuz (outra ação), uma vez por dia e por até 2 horas; atacar não desfaz. O livro gasta as duas horas aos minutos, em vários usos.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Cloak of Invisibility",
    "conjura": {
      "cargas": 1,
      "recarga": null,
      "magias": {
        "capuzDoManto": {
          "custo": 1
        }
      }
    }
  },
  "bolaDeCristal": {
    "id": "bolaDeCristal",
    "name": "Bola de cristal",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "muito raro",
    "sintonia": true,
    "peso": 3,
    "desc": "Esfera de cristal com cerca de 15 cm de diâmetro que exige sintonia. Enquanto a toca, você pode conjurar Vidência por meio dela, com CD 17 para o teste de resistência. No jogo: sintonizada, conjura a Vidência à vontade, fora da luta, com CD 17, mesmo para quem não é conjurador.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Crystal Ball",
    "conjura": {
      "cargas": null,
      "recarga": null,
      "cd": 17,
      "magias": {
        "videncia": {
          "custo": 0
        }
      }
    }
  },
  "bolaDeCristalDaLeituraMental": {
    "id": "bolaDeCristalDaLeituraMental",
    "name": "Bola de cristal da leitura mental",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 3,
    "desc": "Exige sintonia. Tocando a esfera, você conjura Vidência (CD 17); enquanto a vidência estiver ativa, pode usar uma ação para conjurar Detectar Pensamentos (CD 17) em criaturas visíveis a até 9 m do sensor. Essa segunda magia não exige concentração, mas termina junto com a Vidência. No jogo: sintonizada, conjura a Vidência e o Detectar Pensamentos à vontade, fora da luta, com CD 17. O livro só deixa ler a mente de quem está perto do sensor da vidência; aqui o Detectar Pensamentos é o de sempre, em quem está perto do herói.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Crystal Ball of Mind Reading",
    "conjura": {
      "cargas": null,
      "recarga": null,
      "cd": 17,
      "magias": {
        "videncia": {
          "custo": 0
        },
        "detectarPensamentos": {
          "custo": 0
        }
      }
    }
  },
  "bolaDeCristalDaTelepatia": {
    "id": "bolaDeCristalDaTelepatia",
    "name": "Bola de cristal da telepatia",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 3,
    "desc": "Exige sintonia. Tocando a esfera, você conjura Vidência (CD 17) e, enquanto ela durar, pode falar telepaticamente com criaturas que vê a até 9 m do sensor. Uma vez por amanhecer, com uma ação, impõe Sugestão (CD 17) a uma delas através do sensor, sem precisar de concentração, mas o efeito termina junto com a Vidência. No jogo: sintonizada, conjura a Vidência à vontade, fora da luta, com CD 17, e a Sugestão uma vez por dia. A conversa telepática pelo sensor não entra; a Sugestão vale em quem está perto do herói.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Crystal Ball of Telepathy",
    "conjura": {
      "cargas": 1,
      "recarga": null,
      "cd": 17,
      "magias": {
        "videncia": {
          "custo": 0
        },
        "sugestao": {
          "custo": 1
        }
      }
    }
  },
  "bolaDeCristalDaVisaoDaVerdade": {
    "id": "bolaDeCristalDaVisaoDaVerdade",
    "name": "Bola de cristal da visão da verdade",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 3,
    "desc": "Exige sintonia. Tocando a esfera, você pode conjurar Vidência (CD 17) através dela. Durante a magia, você ganha visão verdadeira num raio de 36 m em torno do sensor. No jogo: sintonizada, conjura a Vidência à vontade, fora da luta, com CD 17. A visão verdadeira em volta do sensor não entra: a Vidência do jogo não tem sensor no mapa.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Crystal Ball of True Seeing",
    "conjura": {
      "cargas": null,
      "recarga": null,
      "cd": 17,
      "magias": {
        "videncia": {
          "custo": 0
        }
      }
    }
  },
  "cuboDeForca": {
    "id": "cuboDeForca",
    "name": "Cubo de força",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "raro",
    "sintonia": true,
    "peso": 1,
    "desc": "Exige sintonia. Tem 36 cargas e recupera 1d20 ao amanhecer; com uma ação você aperta uma face e gasta de 1 a 5 cargas para criar ao seu redor um cubo invisível de energia com 4,5 m de lado, que se move com você por até 1 minuto e bloqueia, conforme a face, gases, matéria inanimada, seres vivos, efeitos de magia ou tudo (a sexta face desliga a barreira, e trocar de face reinicia a duração). Magias como Desintegrar, Atravessar Paredes, Muralha de Fogo, Spray Prismático e a Trompa da Destruição drenam cargas extras do cubo ao atingir a barreira. No jogo: sintonizado, apertar uma face gasta a ação e as cargas dela: a barreira de 4,5 m em volta de você, que anda com você, por 1 minuto. 1 barra gás e névoa; 2, o projétil; 3, a criatura (quem não estava dentro) e o golpe de perto; 4, a magia; 5, tudo; 6 desliga. As cargas que as magias e o chifre arrancam da barreira, e o \"não chego mais perto da parede\", não entram.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Cube of Force",
    "conjura": {
      "cargas": 36,
      "recarga": "1d20",
      "magias": {
        "cuboDeForca": {
          "custo": 0
        }
      }
    }
  },
  "globoFlutuante": {
    "id": "globoFlutuante",
    "name": "Globo flutuante",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "incomum",
    "sintonia": false,
    "peso": 1,
    "desc": "Estando a até 18 m desta esfera de vidro, você pode fazê-la emitir o efeito da magia Luz à vontade ou de Luz do Dia uma vez por dia, recuperada ao amanhecer. Com uma ação e outra palavra de comando, o globo aceso passa a flutuar a até 1,5 m do chão e a seguir você pelo caminho mais curto para ficar a até 18 m de distância; se for impedido de se mover, ele desce ao chão e se apaga. Não exige sintonia. No jogo: com a ação, acende como a magia Luz e flutua junto de quem o leva, por uma hora; de novo, apaga. A Luz do Dia uma vez por dia não entra.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Driftglobe",
    "conjura": {
      "cargas": null,
      "recarga": null,
      "magias": {
        "luzDoGlobo": {
          "custo": 0
        }
      }
    }
  },
  "garrafaDoEfreeti": {
    "id": "garrafaDoEfreeti",
    "name": "Garrafa do efreeti",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "muito raro",
    "sintonia": false,
    "peso": 1,
    "desc": "Com uma ação você destampa a garrafa e, ao fim do seu turno, um efreeti surge a até 9 m de você; na primeira abertura, o Mestre rola d100 para definir o resultado. Com 01-10 ele luta contra você por 5 rodadas e some; com 11-90 ele obedece por 1 hora e volta à garrafa (que só pode ser reaberta após 24 horas), repetindo isso por três usos no total e fugindo na quarta abertura; com 91-00 ele concede três magias Desejo e desaparece após o último desejo ou após 1 hora. Quando o efreeti vai embora de vez, a garrafa perde a magia; não requer sintonia. No jogo: com a ação, uma vez por dia, o efreeti sai e o d100 decide: 1 a 10 ele ataca (e a garrafa perde a magia), 11 a 90 serve por uma hora, 91 a 100 deve três desejos (o Desejo do jogo, sem o desgaste). A conta das três vezes que serve antes de fugir não entra.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Efreeti Bottle",
    "conjura": {
      "cargas": 1,
      "recarga": null,
      "magias": {
        "garrafaDoEfreeti": {
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
  "garrafaDaFumacaEterna": {
    "id": "garrafaDaFumacaEterna",
    "name": "Garrafa da fumaça eterna",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "incomum",
    "sintonia": false,
    "peso": 1,
    "desc": "Com uma ação, você abre a garrafa e libera uma nuvem de fumaça densa de 18 m de raio, que deixa a área com escuridão densa (totalmente obscurecida) e cresce 3 m por minuto enquanto a garrafa aberta estiver dentro dela, até no máximo 36 m. A nuvem dura enquanto a garrafa estiver aberta; fechá-la exige uma ação e a palavra de comando, e a fumaça some 10 minutos depois, ou antes com vento moderado (1 minuto) ou forte (1 rodada). Não requer sintonia. No jogo: aberta com a ação, uma fumaça que tapa a vista enche 18 m em volta e cresce 3 m por minuto, até 36 m; tampada com outra ação, para de crescer e se desfaz em 10 minutos. O vento que a dispersa não entra.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Eversmoking Bottle",
    "conjura": {
      "cargas": null,
      "recarga": null,
      "magias": {
        "garrafaDaFumaca": {
          "custo": 0
        }
      }
    }
  },
  "marteloDosRaios": {
    "id": "marteloDosRaios",
    "name": "Martelo do trovão",
    "tipo": "arma mágica",
    "art": "martelo",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": false,
    "peso": 10,
    "desc": "Malho com +1 nas jogadas de ataque e dano; para se sintonizar é preciso usar um cinto de força do gigante e manoplas de força do ogro, e a sintonia acaba se tirar qualquer um deles. Sintonizado e empunhando o martelo, sua Força aumenta em 4 (máximo 30) e, ao tirar 20 no ataque contra um gigante, ele morre se falhar num teste de resistência de Constituição CD 17. Tem 5 cargas (recupera 1d4+1 ao amanhecer): gaste 1 para arremessá-lo (alcance 6/18 m) e, se acertar, o alvo e todas as criaturas a até 9 m dele fazem teste de resistência de Constituição CD 17 ou ficam atordoadas até o fim do seu próximo turno. No jogo: um malho +1; levando também um cinto de força de gigante e as manoplas de força de ogro, o gigante acertado faz Constituição CD 17 ou morre. A Força +4, o arremesso com trovão e as cargas não entram.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Hammer of Thunderbolts",
    "base": "malho",
    "bonusAtaque": 1,
    "bonusDano": 1,
    "poder": "martelo"
  },
  "elmoDoTeletransporte": {
    "id": "elmoDoTeletransporte",
    "name": "Elmo do teletransporte",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "raro",
    "sintonia": true,
    "peso": 1,
    "desc": "Exige sintonia. Possui 3 cargas; usando-o, você gasta 1 carga e uma ação para conjurar Teletransporte. Recupera 1d3 cargas a cada amanhecer. No jogo: sintonizado, conjura o Teletransporte na tela da região, uma carga cada (1d3 voltam ao amanhecer), mesmo para quem não é conjurador.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Helm of Teleportation",
    "conjura": {
      "cargas": 3,
      "recarga": "1d3",
      "magias": {
        "teletransporte": {
          "custo": 1
        }
      }
    }
  },
  "frascoDeFerro": {
    "id": "frascoDeFerro",
    "name": "Frasco de ferro",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": false,
    "peso": 1,
    "desc": "Com uma ação e a palavra de comando, você mira uma criatura visível a até 18 m que seja nativa de outro plano; ela precisa passar num teste de resistência de Sabedoria CD 17 (com vantagem se já tiver ficado presa antes) ou fica aprisionada no frasco, que guarda uma criatura por vez, sem que ela envelheça nem precise comer ou respirar. Com outra ação você abre o frasco e solta a criatura, que fica amistosa e obedece às suas ordens por 1 hora, apenas se defendendo se não receber ordens ou se a ordem puder matá-la; depois disso, age conforme a própria natureza. Não exige sintonia, e um frasco encontrado pode já conter alguma criatura. No jogo: com a ação, uma criatura de outro plano (celestial, corruptor, elemental, fada) a até 18 m faz Sabedoria CD 17 ou vai para dentro do frasco; com outra ação, ela sai a até 9 m e obedece por uma hora. A criatura que o livro diz já estar no frasco, e as perguntas que ela responde, não entram.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Iron Flask",
    "conjura": {
      "cargas": null,
      "recarga": null,
      "magias": {
        "prenderNoFrasco": {
          "custo": 0
        },
        "soltarDoFrasco": {
          "custo": 0
        }
      }
    }
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
  "laminaLunar": {
    "id": "laminaLunar",
    "name": "Lâmina lunar",
    "tipo": "arma mágica",
    "art": "espada",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 3,
    "desc": "Espada longa senciente (neutra e boa) que exige sintonia de um elfo ou meio-elfo neutro e bom, feita num ritual especial; se ela recusar o candidato, ele sofre desvantagem em testes de atributo, jogadas de ataque e testes de resistência por 24 horas. Tem uma runa por portador que já serviu (normalmente 1d6+1): a primeira dá +1 no ataque e no dano, e cada uma das outras acrescenta uma propriedade, como bônus maior (até +3), acerto crítico com 19 ou 20, +1d6 de dano cortante, lampejo que cega quem estiver a até 9 m (CD 15 de Constituição) ou funcionar como Defensora ou Espada Vorpal. A sintonia dura até a morte do portador ou a destruição da arma. No jogo: só um elfo ou meio-elfo se sintoniza (o alinhamento não entra: o jogo não tem). O livro deixa o mestre escolher as runas, e esta tem três: +2 de ataque e dano, crítico com 19 ou 20, e 1d6 cortante a mais em todo acerto. Recusar o portador com desvantagem por um dia não entra.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Moonblade",
    "base": "espadaLonga",
    "bonusAtaque": 2,
    "bonusDano": 2,
    "poder": "laminaLunar",
    "sintoniaElfo": true
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
  "anelDeComandoDoAr": {
    "id": "anelDeComandoDoAr",
    "name": "Anel de comando dos elementais do ar",
    "tipo": "anel",
    "art": "arcano",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 1,
    "desc": "Exige sintonia. Você tem vantagem nos ataques contra elementais do ar e eles têm desvantagem contra você; você fala auran, cai lentamente (18 m por rodada) sem sofrer dano de queda e pode gastar 2 das 5 cargas (recupera 1d4+1 ao amanhecer, CD 17) para conjurar Dominar Monstro em um elemental do ar. Depois de ajudar a matar um elemental do ar, você também ganha resistência a dano elétrico, deslocamento de voo igual ao de caminhada (podendo pairar) e pode conjurar Muralha de Vento (1 carga), Lufada de Vento (2) ou Corrente de Relâmpagos (3). No jogo: sintonizado, vantagem contra os elementais do ar (o elemental do ar, o djinni, o perseguidor invisível), que atacam você com desvantagem; e você cai sem sofrer dano. Falar auran e as magias que vêm depois de matar um elemental do ar não entram.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Ring of Air Elemental Command",
    "passivo": {
      "flagelo": [
        "elementalDoAr",
        "djinni",
        "perseguidorInvisivel"
      ],
      "semDanoDeQueda": true
    }
  },
  "anelDeInfluenciaAnimal": {
    "id": "anelDeInfluenciaAnimal",
    "name": "Anel de influência animal",
    "tipo": "anel",
    "art": "arcano",
    "pilha": false,
    "raridade": "raro",
    "sintonia": false,
    "peso": 1,
    "desc": "Possui 3 cargas e recupera 1d3 cargas gastas ao amanhecer; não requer sintonia. Usando-o, você pode gastar uma ação e 1 carga para conjurar Amizade Animal (CD 13), Falar com Animais ou Medo (CD 13), sendo que esta última só afeta bestas com Inteligência 3 ou menor. No jogo: três cargas (1d3 voltam ao amanhecer), CD 13: Amizade Animal, Falar com Animais e o Medo que só pega fera de Inteligência 3 ou menos.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Ring of Animal Influence",
    "conjura": {
      "cargas": 3,
      "recarga": "1d3",
      "cd": 13,
      "magias": {
        "amizadeAnimal": {
          "custo": 1
        },
        "medoDoAnel": {
          "custo": 1
        },
        "falarComAnimais": {
          "custo": 1
        }
      }
    }
  },
  "anelDeConvocacaoDoDjinni": {
    "id": "anelDeConvocacaoDoDjinni",
    "name": "Anel de convocação do djinni",
    "tipo": "anel",
    "art": "arcano",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 1,
    "desc": "Exige sintonia. Com uma ação e a palavra de comando, você traz um djinni do Plano Elemental do Ar para um espaço livre a até 36 m; ele é amistoso com seu grupo, cumpre suas ordens em qualquer idioma e, sem ordens, apenas se defende. Ele fica enquanto você mantiver concentração (até 1 hora) ou até cair a 0 PV, só pode ser chamado de novo após 24 horas, e se morrer o anel perde a magia. No jogo: sintonizado, com a ação e uma vez por dia: o djinni obedece enquanto durar a concentração (até 1 hora) e volta ao anel quando ela acaba.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Ring of Djinni Summoning",
    "conjura": {
      "cargas": 1,
      "recarga": null,
      "magias": {
        "djinniDoAnel": {
          "custo": 1
        }
      }
    }
  },
  "anelDeComandoDaTerra": {
    "id": "anelDeComandoDaTerra",
    "name": "Anel de comando dos elementais da terra",
    "tipo": "anel",
    "art": "arcano",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 1,
    "desc": "Exige sintonia. Você tem vantagem nos ataques contra elementais do Plano da Terra, eles têm desvantagem contra você, você fala e entende terrano e ignora terreno difícil de pedras, entulho ou terra; o anel tem 5 cargas (recupera 1d4+1 ao amanhecer, CD 17) e 2 delas conjuram Dominar Monstro num elemental da terra. Depois de ajudar a matar um elemental da terra, você ganha resistência a ácido, atravessa terra e rocha sólidas como terreno difícil (se terminar o turno dentro delas, é expelido para o último espaço livre que ocupou) e pode gastar cargas em Moldar Rochas (2), Pele de Pedra (3) ou Muralha de Pedra (3). No jogo: sintonizado, vantagem contra os elementais da terra (o elemental da terra, o dao, o xorn), que atacam você com desvantagem. O terreno de pedra que não custa, falar terran e as magias que vêm depois não entram.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Ring of Earth Elemental Command",
    "passivo": {
      "flagelo": [
        "elementalDaTerra",
        "dao",
        "xorn"
      ]
    }
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
    "desc": "Exige sintonia. Dá resistência a dano de fogo, permite falar e entender ignan e garante vantagem nos ataques contra elementais do Plano do Fogo, que têm desvantagem para atacar você. Tem 5 cargas (recupera 1d4+1 ao amanhecer, CD 17): 2 cargas conjuram Dominar Monstro num elemental do fogo. Depois de ajudar a matar um elemental do fogo, você fica imune a fogo e pode gastar cargas para Mãos Flamejantes (1), Bola de Fogo (2) ou Muralha de Fogo (3). No jogo: sintonizado, resistência a fogo, e vantagem contra os elementais do fogo (o elemental do fogo, o efreeti, a salamandra), que atacam você com desvantagem. Falar ignan e as magias que vêm depois de matar um não entram.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Ring of Fire Elemental Command",
    "passivo": {
      "resiste": [
        "fogo"
      ],
      "flagelo": [
        "elementalDoFogo",
        "efreeti",
        "salamandra"
      ]
    }
  },
  "anelDeComandoDaAgua": {
    "id": "anelDeComandoDaAgua",
    "name": "Anel de comando dos elementais da água",
    "tipo": "anel",
    "art": "arcano",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 1,
    "desc": "Exige sintonia. Você tem vantagem nos ataques contra elementais do Plano da Água, eles têm desvantagem contra você, você anda sobre líquidos como se fossem chão firme e fala Aquan; o anel tem 5 cargas (recupera 1d4+1 ao amanhecer, CD 17) e com 2 delas conjura Dominar Monstro em um elemental da água. Depois de ajudar a matar um elemental da água, você também respira submerso, ganha deslocamento de natação igual ao de caminhada e pode conjurar Criar ou Destruir Água (1 carga), Tempestade de Gelo (2), Controlar a Água (3) ou Muralha de Gelo (3). No jogo: sintonizado, vantagem contra os elementais da água (o elemental da água, o marid), que atacam você com desvantagem; e você anda sobre a água como sobre o chão. Falar aquan e as magias que vêm depois não entram.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Ring of Water Elemental Command",
    "passivo": {
      "flagelo": [
        "elementalDaAgua",
        "marid"
      ],
      "sobreAgua": true
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
  "pergaminhoDeProtecaoContraAberracoes": {
    "id": "pergaminhoDeProtecaoContraAberracoes",
    "name": "Pergaminho de proteção contra aberrações",
    "tipo": "pergaminho",
    "art": "arcano",
    "pilha": true,
    "raridade": "raro",
    "sintonia": false,
    "peso": 1,
    "desc": "Com uma ação, você lê o pergaminho e fica no centro de um cilindro invisível de 1,5 m de raio e 3 m de altura que acompanha você por 5 minutos; aberrações não podem entrar nele nem afetar nada em seu interior. O efeito se encerra se você se mover de modo a colocar uma aberração dentro da área, e uma criatura pode usar uma ação para fazer um teste de Carisma CD 15 e, se passar, deixa de ser barrada. No jogo: ler gasta a ação: por 5 minutos, um cilindro de 1,5 m em volta de quem leu, que anda com ele, onde aberração não entra nem ataca ou mira quem está dentro. Se o leitor andar até pôr um deles dentro, a barreira acaba; e cada um pode gastar a ação num Carisma CD 15 para passar a atravessá-la.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Scroll of Protection from Aberrations",
    "consumivel": "pergaminhoDeProtecao",
    "acao": "acao",
    "tipoBarrado": "aberração"
  },
  "pergaminhoDeProtecaoContraFeras": {
    "id": "pergaminhoDeProtecaoContraFeras",
    "name": "Pergaminho de proteção contra bestas",
    "tipo": "pergaminho",
    "art": "arcano",
    "pilha": true,
    "raridade": "raro",
    "sintonia": false,
    "peso": 1,
    "desc": "Com uma ação de leitura, você fica no centro de um cilindro invisível de 1,5 m de raio e 3 m de altura que acompanha seus movimentos e, por 5 minutos, impede que bestas entrem nele ou afetem o que está dentro. O efeito termina se você se mover de modo a colocar uma besta dentro da área, e uma criatura pode usar uma ação para fazer um teste de Carisma CD 15 e, se passar, ignorar a barreira. Uso único, sem sintonia. No jogo: ler gasta a ação: por 5 minutos, um cilindro de 1,5 m em volta de quem leu, que anda com ele, onde fera não entra nem ataca ou mira quem está dentro. Se o leitor andar até pôr um deles dentro, a barreira acaba; e cada um pode gastar a ação num Carisma CD 15 para passar a atravessá-la.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Scroll of Protection from Beasts",
    "consumivel": "pergaminhoDeProtecao",
    "acao": "acao",
    "tipoBarrado": "fera"
  },
  "pergaminhoDeProtecaoContraCelestiais": {
    "id": "pergaminhoDeProtecaoContraCelestiais",
    "name": "Pergaminho de proteção contra celestiais",
    "tipo": "pergaminho",
    "art": "arcano",
    "pilha": true,
    "raridade": "raro",
    "sintonia": false,
    "peso": 1,
    "desc": "Com uma ação de leitura, você fica no centro de um cilindro invisível de 1,5 m de raio e 3 m de altura que se move com você e, por 5 minutos, impede celestiais de entrar nele ou afetar o que está dentro; o efeito termina se você se mover de modo a colocar um celestial dentro da área. Um celestial pode usar uma ação para fazer um teste de Carisma CD 15 e, se passar, deixa de ser barrado. Uso único, não requer sintonia. No jogo: ler gasta a ação: por 5 minutos, um cilindro de 1,5 m em volta de quem leu, que anda com ele, onde celestial não entra nem ataca ou mira quem está dentro. Se o leitor andar até pôr um deles dentro, a barreira acaba; e cada um pode gastar a ação num Carisma CD 15 para passar a atravessá-la.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Scroll of Protection from Celestials",
    "consumivel": "pergaminhoDeProtecao",
    "acao": "acao",
    "tipoBarrado": "celestial"
  },
  "pergaminhoDeProtecaoContraElementais": {
    "id": "pergaminhoDeProtecaoContraElementais",
    "name": "Pergaminho de proteção contra elementais",
    "tipo": "pergaminho",
    "art": "arcano",
    "pilha": true,
    "raridade": "raro",
    "sintonia": false,
    "peso": 1,
    "desc": "Com uma ação, você lê o pergaminho e fica dentro de um cilindro invisível de 1,5 m de raio e 3 m de altura que o acompanha por 5 minutos; nesse tempo, elementais não conseguem entrar nele nem afetar nada em seu interior. O efeito termina se você se mover de modo a incluir um elemental no cilindro, e uma criatura pode usar uma ação para fazer um teste de Carisma CD 15 e, se passar, deixa de ser barrada. No jogo: ler gasta a ação: por 5 minutos, um cilindro de 1,5 m em volta de quem leu, que anda com ele, onde elemental não entra nem ataca ou mira quem está dentro. Se o leitor andar até pôr um deles dentro, a barreira acaba; e cada um pode gastar a ação num Carisma CD 15 para passar a atravessá-la.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Scroll of Protection from Elementals",
    "consumivel": "pergaminhoDeProtecao",
    "acao": "acao",
    "tipoBarrado": "elemental"
  },
  "pergaminhoDeProtecaoContraFadas": {
    "id": "pergaminhoDeProtecaoContraFadas",
    "name": "Pergaminho de proteção contra fadas",
    "tipo": "pergaminho",
    "art": "arcano",
    "pilha": true,
    "raridade": "raro",
    "sintonia": false,
    "peso": 1,
    "desc": "Com uma ação de leitura, você cria ao seu redor um cilindro invisível de 1,5 m de raio e 3 m de altura que acompanha você por 5 minutos; nenhuma fada consegue entrar nele nem afetar o que está dentro. O efeito acaba se você se mover de modo a colocar uma fada dentro da área, e uma criatura pode gastar uma ação num teste de Carisma CD 15 para deixar de ser barrada. O pergaminho é consumido no uso e não exige sintonia. No jogo: ler gasta a ação: por 5 minutos, um cilindro de 1,5 m em volta de quem leu, que anda com ele, onde fada não entra nem ataca ou mira quem está dentro. Se o leitor andar até pôr um deles dentro, a barreira acaba; e cada um pode gastar a ação num Carisma CD 15 para passar a atravessá-la.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Scroll of Protection from Fey",
    "consumivel": "pergaminhoDeProtecao",
    "acao": "acao",
    "tipoBarrado": "feérico"
  },
  "pergaminhoDeProtecaoContraCorruptores": {
    "id": "pergaminhoDeProtecaoContraCorruptores",
    "name": "Pergaminho de proteção contra corruptores",
    "tipo": "pergaminho",
    "art": "arcano",
    "pilha": true,
    "raridade": "raro",
    "sintonia": false,
    "peso": 1,
    "desc": "Com uma ação, você lê o pergaminho e fica no centro de um cilindro invisível de 1,5 m de raio e 3 m de altura que acompanha você por 5 minutos; nenhum corruptor consegue entrar nele nem afetar o que está lá dentro. O efeito acaba se você se mover de modo a colocar um corruptor dentro da área, e uma criatura pode usar uma ação para fazer um teste de Carisma CD 15 e, se passar, deixa de ser barrada. Não requer sintonia. No jogo: ler gasta a ação: por 5 minutos, um cilindro de 1,5 m em volta de quem leu, que anda com ele, onde corruptor não entra nem ataca ou mira quem está dentro. Se o leitor andar até pôr um deles dentro, a barreira acaba; e cada um pode gastar a ação num Carisma CD 15 para passar a atravessá-la.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Scroll of Protection from Fiends",
    "consumivel": "pergaminhoDeProtecao",
    "acao": "acao",
    "tipoBarrado": "corruptor"
  },
  "pergaminhoDeProtecaoContraPlantas": {
    "id": "pergaminhoDeProtecaoContraPlantas",
    "name": "Pergaminho de proteção contra plantas",
    "tipo": "pergaminho",
    "art": "arcano",
    "pilha": true,
    "raridade": "raro",
    "sintonia": false,
    "peso": 1,
    "desc": "Com uma ação de leitura, você fica no centro de um cilindro invisível de 1,5 m de raio e 3 m de altura que acompanha seus movimentos e, por 5 minutos, impede que plantas entrem nele ou afetem quem está dentro. O efeito termina se você se mover de modo a colocar uma planta no interior do cilindro; uma criatura pode usar uma ação e fazer um teste de Carisma CD 15 para deixar de ser barrada. No jogo: ler gasta a ação: por 5 minutos, um cilindro de 1,5 m em volta de quem leu, que anda com ele, onde planta não entra nem ataca ou mira quem está dentro. Se o leitor andar até pôr um deles dentro, a barreira acaba; e cada um pode gastar a ação num Carisma CD 15 para passar a atravessá-la.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Scroll of Protection from Plants",
    "consumivel": "pergaminhoDeProtecao",
    "acao": "acao",
    "tipoBarrado": "planta"
  },
  "pergaminhoDeProtecaoContraMortosVivos": {
    "id": "pergaminhoDeProtecaoContraMortosVivos",
    "name": "Pergaminho de proteção contra mortos-vivos",
    "tipo": "pergaminho",
    "art": "arcano",
    "pilha": true,
    "raridade": "raro",
    "sintonia": false,
    "peso": 1,
    "desc": "Ler o pergaminho com uma ação cria ao seu redor, por 5 minutos, um cilindro invisível de 1,5 m de raio e 3 m de altura que acompanha você e impede mortos-vivos de entrar nele ou de afetar o que está dentro. O efeito acaba se você se mover de modo a colocar um morto-vivo dentro da área, e uma criatura pode gastar uma ação num teste de Carisma CD 15 para deixar de ser barrada. Não exige sintonia. No jogo: ler gasta a ação: por 5 minutos, um cilindro de 1,5 m em volta de quem leu, que anda com ele, onde morto-vivo não entra nem ataca ou mira quem está dentro. Se o leitor andar até pôr um deles dentro, a barreira acaba; e cada um pode gastar a ação num Carisma CD 15 para passar a atravessá-la.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Scroll of Protection from Undead",
    "consumivel": "pergaminhoDeProtecao",
    "acao": "acao",
    "tipoBarrado": "morto-vivo"
  },
  "esferaDaAniquilacao": {
    "id": "esferaDaAniquilacao",
    "name": "Esfera da aniquilação",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": false,
    "peso": 1,
    "desc": "Esfera negra flutuante de 60 cm que destrói qualquer matéria (exceto artefatos) que a atravesse; o que só a toca sofre 4d10 de dano energético. Com uma ação, a até 18 m, você faz um teste de Inteligência (Arcanismo) CD 25 para movê-la 1,5 m × seu modificador de Inteligência (mínimo 1,5 m); se falhar, ela avança 3 m em sua direção, e quem estiver no caminho faz um teste de resistência de Destreza CD 13 para não sofrer 4d10 de dano energético. Se outra criatura já a controla, vocês disputam testes de Arcanismo, e o contato com portais ou espaços extradimensionais pode destruí-la, atravessá-los ou lançar tudo a 54 m para outro plano. No jogo: no jogo ela se carrega: com a ação, sai numa casa ao lado e fica parada; quem a toca faz Destreza CD 13 ou sofre 4d10 de energia. Controlá-la, a até 18 m, é Inteligência (Arcanismo) CD 25, e ela vai até 5 × o modificador de Inteligência; falhando, anda 3 m na direção de quem tentou. A disputa pelo controle e o portal que ela atravessa não entram.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Sphere of Annihilation",
    "conjura": {
      "cargas": null,
      "recarga": null,
      "magias": {
        "soltarAEsfera": {
          "custo": 0
        },
        "controlarAEsfera": {
          "custo": 0
        }
      }
    }
  },
  "cajadoDaVibora": {
    "id": "cajadoDaVibora",
    "name": "Cajado da víbora",
    "tipo": "arma mágica",
    "art": "lanca",
    "pilha": false,
    "raridade": "incomum",
    "sintonia": true,
    "peso": 4,
    "desc": "Exige sintonia de clérigo, druida ou bruxo. Com uma ação bônus, a ponta do cajado vira uma cobra venenosa viva por até 1 minuto (outra ação bônus a desfaz); com ela você ataca corpo a corpo com alcance de 1,5 m usando sua proficiência, causando 1d6 de dano perfurante, e o alvo sofre mais 3d6 de dano de veneno se falhar num teste de resistência de Constituição CD 15. Enquanto ativa, a cabeça pode ser atacada (CA 15, 20 PV): se chegar a 0 PV o cajado é destruído, mas ela recupera todos os PV ao voltar à forma inanimada. No jogo: sintonizado, é um bordão cuja ponta morde como víbora: cada acerto pede Constituição CD 15, ou 3d6 de veneno a mais. Virar a cabeça em cobra com a ação bônus e a cabeça que se fere e se desfaz não entram: a mordida vale sempre.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Staff of the Adder",
    "base": "bordao",
    "poder": "vibora"
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
  "talismaDaEsfera": {
    "id": "talismaDaEsfera",
    "name": "Talismã da esfera",
    "tipo": "maravilhoso",
    "art": "arcano",
    "pilha": false,
    "raridade": "lendário",
    "sintonia": true,
    "peso": 1,
    "desc": "Enquanto segura este talismã, seu bônus de proficiência é dobrado nos testes de Inteligência (Arcanismo) feitos para controlar uma Esfera da Aniquilação. Se você começar o turno controlando uma esfera, pode usar uma ação para movê-la 3 m, mais 3 m adicionais por ponto do seu modificador de Inteligência. Requer sintonia. No jogo: sintonizado, dobra a proficiência no Arcanismo de controlar a esfera da aniquilação, e deixa tentar mesmo sem carregá-la. O voo maior de quem começa o turno no controle não entra.",
    "fonte": "livro-dmg",
    "nomeOriginal": "Talisman of the Sphere",
    "conjura": {
      "cargas": null,
      "recarga": null,
      "magias": {
        "controlarAEsfera": {
          "custo": 0
        }
      }
    }
  },
  "bastaoDeTentaculos": {
    "id": "bastaoDeTentaculos",
    "name": "Bastão de tentáculos",
    "tipo": "bastão",
    "art": "arcano",
    "pilha": false,
    "raridade": "raro",
    "sintonia": true,
    "peso": 2,
    "desc": "Exige sintonia. Com uma ação, cada um dos três tentáculos ataca uma criatura visível a até 4,5 m (+9 para acertar, 1d6 de dano de concussão cada). Se os três atingirem o mesmo alvo, ele faz um teste de resistência de Constituição CD 15; se falhar, por 1 minuto fica com metade do deslocamento, sem reações, com desvantagem em testes de resistência de Destreza e só pode usar uma ação ou uma ação bônus por turno, repetindo o teste ao fim de cada turno seu. No jogo: sintonizado, com a ação: três golpes de +9 a até 4,5 m, 1d6 de concussão cada; acertando os três, Constituição CD 15 ou fica apertado por 1 minuto (metade do deslocamento, desvantagem em Destreza, sem reações, a ação ou a ação bônus).",
    "fonte": "livro-dmg",
    "nomeOriginal": "Tentacle Rod",
    "conjura": {
      "cargas": null,
      "recarga": null,
      "magias": {
        "tentaculosDoBastao": {
          "custo": 0
        }
      }
    }
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
