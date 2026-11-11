// GERADO por src/dev/importar-magias.mjs tce — não editar à mão: mude o conversor e rode de novo.
// Os números saem do dado do livro; o texto, de src/dev/magias/tce-pt.json, com as nossas palavras.
export const MAGIAS_TCE = {
 "laminaDoDesastre": {
  "id": "laminaDoDesastre",
  "name": "Lâmina do Desastre",
  "nomeOriginal": "Blade of Disaster",
  "level": 9,
  "school": "conjuração",
  "fonte": "tce",
  "castTime": "bonus",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "arma",
  "melee": true,
  "reuso": "bonus",
  "alcanceDaArmaFt": 30,
  "damage": "4d12",
  "damageType": "energético",
  "golpes": 2,
  "desc": "Com uma ação bônus, você abre uma fenda planar em forma de lâmina, de cerca de 90 cm, num espaço desocupado que consiga ver a até 18 m, e na hora faz até dois ataques corpo a corpo com magia contra criaturas, objetos soltos ou estruturas a até 1,5 m dela. Cada acerto causa 4d12 de dano energético, e o ataque é crítico com 18 a 20 no d20, somando mais 8d12 (12d12 no total). Nos turnos seguintes, com uma ação bônus, você desloca a lâmina até 9 m para um espaço visível e repete os dois ataques. Ela atravessa qualquer barreira, até Muralha de Energia, sem efeito algum; dura até 1 minuto (concentração). (Simplificação: o crítico é o de sempre (no livro, de 18 a 20 e com o triplo dos dados).)",
  "tom": 3
 },
 "laminaTrovejante": {
  "id": "laminaTrovejante",
  "name": "Lâmina Trovejante",
  "nomeOriginal": "Booming Blade",
  "level": 0,
  "school": "evocação",
  "fonte": "tce",
  "castTime": "action",
  "rangeFt": 5,
  "duracaoRodadas": 1,
  "classes": [
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "livro",
  "efeito": "laminaDeTruque",
  "efeitoLamina": "trovao",
  "alvo": "criatura",
  "damageType": "trovejante",
  "desc": "Truque: você faz um ataque corpo a corpo com a arma usada como componente contra uma criatura a até 1,5 m; se acertar, além do efeito normal do golpe, o alvo fica envolto em energia ressonante até o início do seu próximo turno. Caso ele se desloque voluntariamente 1,5 m ou mais nesse intervalo, sofre 1d8 de dano trovejante e a magia termina. No 5º nível, o acerto causa 1d8 de dano trovejante extra e o dano por se mover sobe para 2d8; esses valores passam a 2d8 e 3d8 no 11º nível e a 3d8 e 4d8 no 17º.",
  "tom": 3
 },
 "laminaDeChamaEsverdeada": {
  "id": "laminaDeChamaEsverdeada",
  "name": "Lâmina de Chama Esverdeada",
  "nomeOriginal": "Green-Flame Blade",
  "level": 0,
  "school": "evocação",
  "fonte": "tce",
  "castTime": "action",
  "rangeFt": 5,
  "classes": [
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "livro",
  "efeito": "laminaDeTruque",
  "efeitoLamina": "chama",
  "alvo": "criatura",
  "damageType": "fogo",
  "desc": "Faça um ataque corpo a corpo com a arma usada na conjuração contra uma criatura a até 1,5 m; se acertar, ela sofre os efeitos normais da arma. Chamas verdes podem então saltar para outra criatura visível a até 1,5 m do alvo, causando dano de fogo igual ao seu modificador de conjuração. Truque: no 5º nível, o alvo atingido sofre 1d8 de dano de fogo extra e a segunda criatura sofre 1d8 + modificador. Os dois dados sobem para 2d8 no 11º nível e 3d8 no 17º.",
  "tom": 5
 },
 "fortalezaDoIntelecto": {
  "id": "fortalezaDoIntelecto",
  "name": "Fortaleza do Intelecto",
  "nomeOriginal": "Intellect Fortress",
  "level": 3,
  "school": "abjuração",
  "fonte": "tce",
  "castTime": "action",
  "rangeFt": 30,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "bardo",
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "fortalezaDoIntelecto",
  "upcast": {
   "alvos": 1
  },
  "desc": "Você ou uma criatura voluntária que você veja a até 9 m ganha resistência a dano psíquico e vantagem em testes de resistência de Inteligência, Sabedoria e Carisma. Dura até 1 hora, com concentração. Em círculo 4 ou maior, afeta uma criatura extra por círculo acima do 3º, desde que todas estejam a até 9 m umas das outras ao serem escolhidas.",
  "tom": 0
 },
 "atracaoEletrica": {
  "id": "atracaoEletrica",
  "name": "Atração Elétrica",
  "nomeOriginal": "Lightning Lure",
  "level": 0,
  "school": "evocação",
  "fonte": "tce",
  "castTime": "action",
  "rangeFt": 0,
  "classes": [
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "livro",
  "efeito": "atracaoEletrica",
  "alvo": "criatura",
  "damageType": "elétrico",
  "desc": "Truque que lança um chicote de eletricidade contra uma criatura visível a até 4,5 m de você. Se ela falhar num teste de resistência de Força, é puxada até 3 m em linha reta na sua direção e, caso termine a 1,5 m ou menos de você, sofre 1d8 de dano elétrico. O dano aumenta para 2d8 no 5º nível do personagem, 3d8 no 11º e 4d8 no 17º.",
  "tom": -4
 },
 "lascaMental": {
  "id": "lascaMental",
  "name": "Lasca Mental",
  "nomeOriginal": "Mind Sliver",
  "level": 0,
  "school": "encantamento",
  "fonte": "tce",
  "castTime": "action",
  "rangeFt": 60,
  "duracaoRodadas": 1,
  "classes": [
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "save",
  "save": "int",
  "damage": "1d6",
  "damageType": "psíquico",
  "halfOnSave": false,
  "onFail": {
   "condition": "lascaMental",
   "rounds": 2
  },
  "desc": "Truque que atinge uma criatura visível a até 18 m com um golpe psíquico. Se ela falhar num teste de resistência de Inteligência, sofre 1d6 de dano psíquico e reduz em 1d4 o resultado do próximo teste de resistência que fizer até o fim do seu próximo turno. O dano sobe para 2d6 no 5º nível de personagem, 3d6 no 11º e 4d6 no 17º.",
  "tom": 5
 },
 "mortalhaEspiritual": {
  "id": "mortalhaEspiritual",
  "name": "Mortalha Espiritual",
  "nomeOriginal": "Spirit Shroud",
  "level": 3,
  "school": "necromancia",
  "fonte": "tce",
  "castTime": "bonus",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "clerigo",
   "paladino",
   "bruxo",
   "mago"
  ],
  "upcast": {
   "dados": 1
  },
  "kind": "livro",
  "efeito": "conceder",
  "soSi": true,
  "condicao": "mortalhaEspiritual",
  "tipoNaOpcao": true,
  "dadoNoAcertoACada2": "d8",
  "opcoes": [
   {
    "id": "radiante",
    "rotulo": "Radiante"
   },
   {
    "id": "necrótico",
    "rotulo": "Necrótico"
   },
   {
    "id": "frio",
    "rotulo": "Frio"
   }
  ],
  "familiaSonora": "reforco",
  "desc": "Com uma ação bônus, você faz espíritos dos mortos rodearem você por até 1 minuto (concentração). Enquanto durar, seus ataques que acertarem criaturas a até 3 m causam 1d8 de dano extra, radiante, necrótico ou frio à sua escolha ao conjurar, e quem sofrer esse dano não pode recuperar PV até o início do seu próximo turno. Criaturas que você escolher e puder ver que comecem o turno a até 3 m de você têm o deslocamento reduzido em 3 m até o início do seu próximo turno. Em círculo maior, o dano extra aumenta em 1d8 a cada dois círculos acima do 3º. (Simplificação: o dano a mais vale nos golpes com arma; o passo mais curto de quem começa o turno perto não existe no jogo.)",
  "tom": 0
 },
 "invocarAberracao": {
  "id": "invocarAberracao",
  "name": "Invocar Aberração",
  "nomeOriginal": "Summon Aberration",
  "level": 4,
  "school": "conjuração",
  "fonte": "tce",
  "castTime": "action",
  "rangeFt": 90,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "bruxo",
   "mago"
  ],
  "kind": "invocar",
  "invocacao": "espirito",
  "espirito": true,
  "pacoteFixo": true,
  "pacotePadrao": "observador",
  "pacotes": {
   "observador": {
    "n": 1,
    "defId": "espiritoAberranteObservador",
    "rotulo": "Observador",
    "detalhe": "voa e fere a mente a 45 m"
   },
   "slaad": {
    "n": 1,
    "defId": "espiritoAberranteSlaad",
    "rotulo": "Slaad",
    "detalhe": "garras, regenera 5 por turno"
   },
   "estelar": {
    "n": 1,
    "defId": "espiritoAberranteEstelar",
    "rotulo": "Cria estelar",
    "detalhe": "pancada psíquica"
   }
  },
  "opcoes": [
   {
    "id": "observador",
    "rotulo": "Observador",
    "detalhe": "voa e fere a mente a 45 m"
   },
   {
    "id": "slaad",
    "rotulo": "Slaad",
    "detalhe": "garras, regenera 5 por turno"
   },
   {
    "id": "estelar",
    "rotulo": "Cria estelar",
    "detalhe": "pancada psíquica"
   }
  ],
  "desc": "Convoca um espírito aberrante num espaço desocupado visível a até 27 m, usando a ficha de Espírito Aberrante com a forma de observador menor, slaad ou cria estelar à sua escolha, o que define algumas de suas características; exige um frasco com tentáculo e olho de 400 po. Ele é aliado do grupo, age logo após o seu turno na sua iniciativa e cumpre suas ordens verbais sem gastar ação; sem comandos, usa Esquivar e se afasta do perigo. Some ao chegar a 0 PV ou ao fim da magia, que dura até 1 hora com concentração. Em círculo 5 ou maior, use o círculo do espaço gasto onde a ficha cita o círculo da magia. (Simplificação: a aura que sussurra da cria estelar e a garra do slaad que impede a cura não existem no jogo.)",
  "tom": -7
 },
 "invocarBesta": {
  "id": "invocarBesta",
  "name": "Invocar Besta",
  "nomeOriginal": "Summon Beast",
  "level": 2,
  "school": "conjuração",
  "fonte": "tce",
  "castTime": "action",
  "rangeFt": 90,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "druida",
   "patrulheiro"
  ],
  "kind": "invocar",
  "invocacao": "espirito",
  "espirito": true,
  "pacoteFixo": true,
  "pacotePadrao": "terra",
  "pacotes": {
   "terra": {
    "n": 1,
    "defId": "espiritoBestialTerra",
    "rotulo": "Terra",
    "detalhe": "escala, táticas de matilha"
   },
   "ar": {
    "n": 1,
    "defId": "espiritoBestialAr",
    "rotulo": "Ar",
    "detalhe": "voa 18 m e não dá brecha ao voar"
   },
   "agua": {
    "n": 1,
    "defId": "espiritoBestialAgua",
    "rotulo": "Água",
    "detalhe": "nada, táticas de matilha"
   }
  },
  "opcoes": [
   {
    "id": "terra",
    "rotulo": "Terra",
    "detalhe": "escala, táticas de matilha"
   },
   {
    "id": "ar",
    "rotulo": "Ar",
    "detalhe": "voa 18 m e não dá brecha ao voar"
   },
   {
    "id": "agua",
    "rotulo": "Água",
    "detalhe": "nada, táticas de matilha"
   }
  ],
  "desc": "Você conjura um espírito bestial, que surge num espaço desocupado visível a até 27 m e usa a ficha de Espírito Bestial; escolha o ambiente (Ar, Terra ou Água) e um animal nativo dele para a aparência, o que define alguns traços da criatura. Ela é aliada sua e do seu grupo, age logo após o seu turno na mesma iniciativa e cumpre seus comandos verbais sem gastar sua ação; sem ordens, usa Esquivar e se afasta do perigo. Dura até 1 hora (concentração) ou até cair a 0 PV, e o componente material é uma bolota dourada de 200 po com pena, pelo e cauda de peixe. Em círculo maior, use o círculo do espaço gasto onde a ficha mencionar o círculo da magia.",
  "tom": 14
 },
 "invocarCelestial": {
  "id": "invocarCelestial",
  "name": "Invocar Celestial",
  "nomeOriginal": "Summon Celestial",
  "level": 5,
  "school": "conjuração",
  "fonte": "tce",
  "castTime": "action",
  "rangeFt": 90,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "clerigo",
   "paladino"
  ],
  "kind": "invocar",
  "invocacao": "espirito",
  "espirito": true,
  "pacoteFixo": true,
  "pacotePadrao": "vingador",
  "pacotes": {
   "vingador": {
    "n": 1,
    "defId": "espiritoCelestialVingador",
    "rotulo": "Vingador",
    "detalhe": "arco radiante a 45 m"
   },
   "defensor": {
    "n": 1,
    "defId": "espiritoCelestialDefensor",
    "rotulo": "Defensor",
    "detalhe": "+2 de CA, maça radiante"
   }
  },
  "opcoes": [
   {
    "id": "vingador",
    "rotulo": "Vingador",
    "detalhe": "arco radiante a 45 m"
   },
   {
    "id": "defensor",
    "rotulo": "Defensor",
    "detalhe": "+2 de CA, maça radiante"
   }
  ],
  "desc": "Um espírito celestial de aparência angelical surge em um espaço desocupado visível a até 27 m, usando a ficha de Espírito Celestial; ao conjurar, escolha a forma Vingador ou Defensor, que define o ataque da criatura. Ela é aliada do grupo, age logo após o seu turno na mesma iniciativa e cumpre seus comandos verbais sem gastar ações suas; sem ordens, usa a ação Esquivar e se afasta do perigo. Some ao chegar a 0 PV ou quando a magia termina, com duração de até 1 hora (concentração), e exige um relicário de ouro de 500 po. Em círculo 6 ou superior, use o círculo do espaço gasto onde a ficha cita o círculo da magia. (Simplificação: o toque que cura, uma vez por dia, e os PV temporários da maça não existem no jogo.)",
  "tom": -7
 },
 "invocarConstructo": {
  "id": "invocarConstructo",
  "name": "Invocar Constructo",
  "nomeOriginal": "Summon Construct",
  "level": 4,
  "school": "conjuração",
  "fonte": "tce",
  "castTime": "action",
  "rangeFt": 90,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "mago"
  ],
  "kind": "invocar",
  "invocacao": "espirito",
  "espirito": true,
  "pacoteFixo": true,
  "pacotePadrao": "metal",
  "pacotes": {
   "argila": {
    "n": 1,
    "defId": "espiritoConstructoArgila",
    "rotulo": "Argila",
    "detalhe": "pancada"
   },
   "metal": {
    "n": 1,
    "defId": "espiritoConstructoMetal",
    "rotulo": "Metal",
    "detalhe": "queima quem o acerta de perto"
   },
   "pedra": {
    "n": 1,
    "defId": "espiritoConstructoPedra",
    "rotulo": "Pedra",
    "detalhe": "pancada"
   }
  },
  "opcoes": [
   {
    "id": "argila",
    "rotulo": "Argila",
    "detalhe": "pancada"
   },
   {
    "id": "metal",
    "rotulo": "Metal",
    "detalhe": "queima quem o acerta de perto"
   },
   {
    "id": "pedra",
    "rotulo": "Pedra",
    "detalhe": "pancada"
   }
  ],
  "desc": "Um espírito de constructo surge num espaço desocupado visível a até 27 m, com a ficha de Espírito de Constructo; ao conjurar, você escolhe se ele é de argila, metal ou pedra (o que define alguns traços) e se tem aparência de golem ou modron. Ele é aliado do grupo, age logo após o seu turno na sua iniciativa e cumpre suas ordens verbais sem gastar ação sua; sem ordens, usa a ação Esquivar e se move para fugir do perigo. Some ao chegar a 0 PV ou quando a magia acaba, com concentração por até 1 hora, e exige um cofre ornamentado de pedra e metal de 400 po. Em círculo maior, use o círculo do espaço gasto onde a ficha cita o círculo da magia. (Simplificação: a fúria da argila ao apanhar e a letargia da pedra não existem no jogo.)",
  "tom": 14
 },
 "invocarElemental": {
  "id": "invocarElemental",
  "name": "Invocar Elemental",
  "nomeOriginal": "Summon Elemental",
  "level": 4,
  "school": "conjuração",
  "fonte": "tce",
  "castTime": "action",
  "rangeFt": 90,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "druida",
   "patrulheiro",
   "mago"
  ],
  "kind": "invocar",
  "invocacao": "espirito",
  "espirito": true,
  "pacoteFixo": true,
  "pacotePadrao": "fogo",
  "pacotes": {
   "ar": {
    "n": 1,
    "defId": "espiritoElementalAr",
    "rotulo": "Ar",
    "detalhe": "voa, resiste a elétrico e trovejante"
   },
   "terra": {
    "n": 1,
    "defId": "espiritoElementalTerra",
    "rotulo": "Terra",
    "detalhe": "resiste a corte e perfuração"
   },
   "fogo": {
    "n": 1,
    "defId": "espiritoElementalFogo",
    "rotulo": "Fogo",
    "detalhe": "imune a fogo, pancada de fogo"
   },
   "agua": {
    "n": 1,
    "defId": "espiritoElementalAgua",
    "rotulo": "Água",
    "detalhe": "nada, resiste a ácido"
   }
  },
  "opcoes": [
   {
    "id": "ar",
    "rotulo": "Ar",
    "detalhe": "voa, resiste a elétrico e trovejante"
   },
   {
    "id": "terra",
    "rotulo": "Terra",
    "detalhe": "resiste a corte e perfuração"
   },
   {
    "id": "fogo",
    "rotulo": "Fogo",
    "detalhe": "imune a fogo, pancada de fogo"
   },
   {
    "id": "agua",
    "rotulo": "Água",
    "detalhe": "nada, resiste a ácido"
   }
  ],
  "desc": "Invoca um espírito elemental corpóreo (de ar, terra, fogo ou água, à sua escolha) num espaço desocupado visível a até 27 m, usando a ficha de Espírito Elemental com traços conforme o elemento; exige um frasco com incrustações de ouro de 400 po contendo ar, pedrinha, cinzas e água. Ele é aliado do grupo, age logo após o seu turno na sua iniciativa e cumpre suas ordens verbais sem gastar ação; sem ordens, usa Esquivar e se afasta do perigo. Some ao chegar a 0 PV ou quando a magia termina, que dura até 1 hora (concentração). Em círculo maior, use o círculo do espaço gasto onde a ficha cita o círculo da magia.",
  "tom": 4
 },
 "invocarFeerico": {
  "id": "invocarFeerico",
  "name": "Invocar Feérico",
  "nomeOriginal": "Summon Fey",
  "level": 3,
  "school": "conjuração",
  "fonte": "tce",
  "castTime": "action",
  "rangeFt": 90,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "druida",
   "patrulheiro",
   "bruxo",
   "mago"
  ],
  "kind": "invocar",
  "invocacao": "espirito",
  "espirito": true,
  "pacoteFixo": true,
  "pacotePadrao": "feerico",
  "pacotes": {
   "feerico": {
    "n": 1,
    "defId": "espiritoFeerico",
    "rotulo": "Espírito feérico",
    "detalhe": "espada curta e 1d6 de energético"
   }
  },
  "opcoes": [
   {
    "id": "feerico",
    "rotulo": "Espírito feérico",
    "detalhe": "espada curta e 1d6 de energético"
   }
  ],
  "desc": "Um espírito feérico surge em um espaço desocupado que você veja a até 27 m, usando a ficha de Espírito Feérico; ao conjurar, escolha seu humor (Furioso, Alegre ou Travesso), que define uma de suas características (componente material: flor dourada de 300 po). Ele é aliado do grupo, age logo após o seu turno, obedece a comandos verbais sem custo de ação e, sem ordens, usa Esquivar e se afasta do perigo; some ao chegar a 0 PV ou quando a magia termina, que dura até 1 hora com concentração. Em círculo 4 ou maior, use o círculo do espaço gasto onde a ficha cita o círculo da magia. (Simplificação: o teleporte de ação bônus e os humores (furioso, alegre, astuto) não existem no jogo.)",
  "tom": 7
 },
 "invocarCorruptor": {
  "id": "invocarCorruptor",
  "name": "Invocar Corruptor",
  "nomeOriginal": "Summon Fiend",
  "level": 6,
  "school": "conjuração",
  "fonte": "tce",
  "castTime": "action",
  "rangeFt": 90,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "bruxo",
   "mago"
  ],
  "kind": "invocar",
  "invocacao": "espirito",
  "espirito": true,
  "pacoteFixo": true,
  "pacotePadrao": "demonio",
  "pacotes": {
   "demonio": {
    "n": 1,
    "defId": "espiritoCorruptorDemonio",
    "rotulo": "Demônio",
    "detalhe": "mordida necrótica"
   },
   "diabo": {
    "n": 1,
    "defId": "espiritoCorruptorDiabo",
    "rotulo": "Diabo",
    "detalhe": "voa e arremessa chama a 45 m"
   },
   "yugoloth": {
    "n": 1,
    "defId": "espiritoCorruptorYugoloth",
    "rotulo": "Yugoloth",
    "detalhe": "garras"
   }
  },
  "opcoes": [
   {
    "id": "demonio",
    "rotulo": "Demônio",
    "detalhe": "mordida necrótica"
   },
   {
    "id": "diabo",
    "rotulo": "Diabo",
    "detalhe": "voa e arremessa chama a 45 m"
   },
   {
    "id": "yugoloth",
    "rotulo": "Yugoloth",
    "detalhe": "garras"
   }
  ],
  "desc": "Um espírito corruptor (demônio, diabo ou yugoloth, à sua escolha) surge num espaço desocupado visível a até 27 m, usando a ficha de Espírito Corruptor com traços definidos pelo tipo escolhido; exige um frasco de rubi com sangue humanoide de 600 po. Aliado seu e do grupo, ele age logo após o seu turno na mesma iniciativa, cumpre suas ordens verbais sem gastar ação e, sem comandos, usa Esquivar e se afasta do perigo. Some ao chegar a 0 PV ou quando a magia acaba, com concentração de até 1 hora. Em círculo 7 ou maior, use o círculo do espaço gasto onde a ficha cita o círculo da magia. (Simplificação: a explosão do demônio ao cair e o teleporte do yugoloth depois do golpe não existem no jogo.)",
  "tom": 0
 },
 "invocarCriaDasSombras": {
  "id": "invocarCriaDasSombras",
  "name": "Invocar Cria das Sombras",
  "nomeOriginal": "Summon Shadowspawn",
  "level": 3,
  "school": "conjuração",
  "fonte": "tce",
  "castTime": "action",
  "rangeFt": 90,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "bruxo",
   "mago"
  ],
  "kind": "invocar",
  "invocacao": "espirito",
  "espirito": true,
  "pacoteFixo": true,
  "pacotePadrao": "sombra",
  "pacotes": {
   "sombra": {
    "n": 1,
    "defId": "espiritoDasSombras",
    "rotulo": "Espírito das sombras",
    "detalhe": "rasgo gelado, resiste a necrótico"
   }
  },
  "opcoes": [
   {
    "id": "sombra",
    "rotulo": "Espírito das sombras",
    "detalhe": "rasgo gelado, resiste a necrótico"
   }
  ],
  "desc": "Você convoca um espírito sombrio corpóreo (ficha de Espírito Sombrio) em um espaço desocupado visível a até 27 m, escolhendo a emoção que o molda (Fúria, Desespero ou Medo), o que define parte de suas características. Ele é aliado do grupo, age logo após o seu turno na sua iniciativa e cumpre suas ordens verbais sem gastar ação; sem comandos, usa a ação Esquivar e se afasta do perigo. Some ao chegar a 0 PV ou quando a magia termina, que dura até 1 hora (concentração) e exige uma gema de 300 po com lágrimas. Em círculo 4 ou maior, use o círculo usado onde a ficha cita o círculo da magia. (Simplificação: o grito que amedronta e os medos (fúria, desespero, pavor) não existem no jogo.)",
  "tom": 2
 },
 "invocarMortoVivo": {
  "id": "invocarMortoVivo",
  "name": "Invocar Morto-Vivo",
  "nomeOriginal": "Summon Undead",
  "level": 3,
  "school": "necromancia",
  "fonte": "tce",
  "castTime": "action",
  "rangeFt": 90,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "bruxo",
   "mago"
  ],
  "kind": "invocar",
  "invocacao": "espirito",
  "espirito": true,
  "pacoteFixo": true,
  "pacotePadrao": "fantasmagorico",
  "pacotes": {
   "fantasmagorico": {
    "n": 1,
    "defId": "espiritoMortoFantasmagorico",
    "rotulo": "Fantasmagórico",
    "detalhe": "voa, atravessa parede, toque que amedronta"
   },
   "putrido": {
    "n": 1,
    "defId": "espiritoMortoPutrido",
    "rotulo": "Pútrido",
    "detalhe": "garra podre"
   },
   "esqueletico": {
    "n": 1,
    "defId": "espiritoMortoEsqueletico",
    "rotulo": "Esquelético",
    "detalhe": "raio da cova a 45 m"
   }
  },
  "opcoes": [
   {
    "id": "fantasmagorico",
    "rotulo": "Fantasmagórico",
    "detalhe": "voa, atravessa parede, toque que amedronta"
   },
   {
    "id": "putrido",
    "rotulo": "Pútrido",
    "detalhe": "garra podre"
   },
   {
    "id": "esqueletico",
    "rotulo": "Esquelético",
    "detalhe": "raio da cova a 45 m"
   }
  ],
  "desc": "Um espírito morto-vivo surge em um espaço desocupado visível a até 27 m, usando a ficha de Espírito Morto-Vivo na forma escolhida (Fantasmagórica, Pútrida ou Esquelética); exige um crânio dourado de 300 po. Ele é aliado do grupo, age logo após o seu turno na sua iniciativa e cumpre seus comandos verbais sem gastar sua ação; sem ordens, usa Esquivar e se afasta do perigo. Some ao chegar a 0 PV ou quando a magia acaba (concentração, até 1 hora). Em círculo maior, use o círculo do espaço gasto onde a ficha cita o círculo da magia. (Simplificação: a aura que envenena do pútrido, e a paralisia da garra dele, não existem no jogo.)",
  "tom": 9
 },
 "explosaoDeLaminas": {
  "id": "explosaoDeLaminas",
  "name": "Explosão de Lâminas",
  "nomeOriginal": "Sword Burst",
  "level": 0,
  "school": "conjuração",
  "fonte": "tce",
  "castTime": "action",
  "rangeFt": 0,
  "classes": [
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "save",
  "save": "dex",
  "shape": "sphere",
  "areaFt": 5,
  "centradoEmSi": true,
  "damage": "1d6",
  "damageType": "energético",
  "halfOnSave": false,
  "desc": "Truque instantâneo de componente apenas verbal: lâminas espectrais giram brevemente ao seu redor e atingem todas as outras criaturas a até 1,5 m de você. Cada uma faz um teste de resistência de Destreza e, se falhar, sofre 1d6 de dano energético; quem passa não sofre nada. O dano sobe para 2d6 no 5º nível de personagem, 3d6 no 11º e 4d6 no 17º.",
  "tom": 5
 },
 "infusaoCausticaDeTasha": {
  "id": "infusaoCausticaDeTasha",
  "name": "Infusão Cáustica de Tasha",
  "nomeOriginal": "Tasha's Caustic Brew",
  "level": 1,
  "school": "evocação",
  "fonte": "tce",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "save": "dex",
  "shape": "linha",
  "areaFt": 30,
  "larguraFt": 5,
  "onFail": {
   "condition": "acidoCaustico",
   "rounds": 10,
   "dadoDoDano": "2d4"
  },
  "upcast": {
   "dados": 2
  },
  "desc": "Você lança um jato de ácido numa linha de 9 m de comprimento por 1,5 m de largura, na direção que escolher. Quem estiver na linha faz um teste de resistência de Destreza; se falhar, fica coberto de ácido e sofre 2d4 de dano ácido no início de cada um de seus turnos, por até 1 minuto (concentração). O efeito termina antes se alguém gastar uma ação para raspar ou lavar o ácido de si ou de outra criatura. Em círculo 2 ou maior, o dano aumenta em 2d4 por círculo acima do 1º. (Simplificação: raspar o ácido com a ação não existe no jogo: ele fica até a concentração acabar.)",
  "tom": 14
 },
 "chicoteMentalDeTasha": {
  "id": "chicoteMentalDeTasha",
  "name": "Chicote Mental de Tasha",
  "nomeOriginal": "Tasha's Mind Whip",
  "level": 2,
  "school": "encantamento",
  "fonte": "tce",
  "castTime": "action",
  "rangeFt": 90,
  "duracaoRodadas": 1,
  "classes": [
   "feiticeiro",
   "mago"
  ],
  "upcast": {
   "alvos": 1
  },
  "kind": "save",
  "save": "int",
  "damage": "3d6",
  "damageType": "psíquico",
  "halfOnSave": true,
  "onFail": {
   "condition": "chicoteMental",
   "rounds": 1
  },
  "desc": "Escolha uma criatura visível a até 27 m; ela faz um teste de resistência de Inteligência. Se falhar, sofre 3d6 de dano psíquico, fica sem reação até o fim do próximo turno dela e, nesse turno, só pode usar uma destas opções: movimento, ação ou ação bônus. Se passar, sofre metade do dano e nada mais. Em círculo 3 ou maior, afeta uma criatura extra por círculo acima do 2º, desde que todas estejam a até 9 m umas das outras. (Simplificação: um alvo só; os alvos a mais do círculo maior e o limite de mover-se ou agir não existem no jogo, só o de ação ou ação bônus.)",
  "tom": -4
 },
 "aparenciaExtraplanarDeTasha": {
  "id": "aparenciaExtraplanarDeTasha",
  "name": "Aparência Extraplanar de Tasha",
  "nomeOriginal": "Tasha's Otherworldly Guise",
  "level": 6,
  "school": "transmutação",
  "fonte": "tce",
  "castTime": "bonus",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "livro",
  "efeito": "conceder",
  "soSi": true,
  "familiaSonora": "protecao",
  "porOpcao": {
   "inferior": "aparenciaInferior",
   "superior": "aparenciaSuperior"
  },
  "opcoes": [
   {
    "id": "inferior",
    "rotulo": "Planos Inferiores",
    "detalhe": "imune a fogo e veneno"
   },
   {
    "id": "superior",
    "rotulo": "Planos Superiores",
    "detalhe": "imune a radiante e necrótico"
   }
  ],
  "desc": "Com uma ação bônus, você se transforma por até 1 minuto (concentração), escolhendo os Planos Inferiores (imunidade a dano de fogo e veneno e à condição envenenado) ou os Planos Superiores (imunidade a dano radiante e necrótico e à condição enfeitiçado). Asas espectrais lhe dão deslocamento de voo de 12 m e você recebe +2 na CA. Seus ataques com arma contam como mágicos e podem usar seu modificador de habilidade de conjuração no ataque e no dano. Ao usar a ação de Ataque, você ataca duas vezes, benefício que não se soma a Ataque Extra ou característica semelhante; o componente material é um objeto gravado com símbolo dos Planos Exteriores, de no mínimo 500 po. (Simplificação: o golpe com arma continua com o atributo da arma (no livro, passa a ser o de conjuração).)",
  "tom": 14
 }
};
