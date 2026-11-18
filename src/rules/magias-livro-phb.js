// GERADO por src/dev/importar-magias.mjs phb — não editar à mão: mude o conversor e rode de novo.
// Os números saem do dado do livro; o texto, de src/dev/magias/phb-pt.json, com as nossas palavras.
export const MAGIAS_PHB = {
 "formasAnimais": {
  "id": "formasAnimais",
  "name": "Formas Animais",
  "nomeOriginal": "Animal Shapes",
  "level": 8,
  "school": "transmutação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 30,
  "concentration": true,
  "duracaoRodadas": 14400,
  "classes": [
   "druida"
  ],
  "kind": "livro",
  "efeito": "metamorfose",
  "raioFt": 30,
  "crMax": 4,
  "desc": "Qualquer quantidade de criaturas voluntárias que você veja a até 9 m vira, cada uma, uma fera Grande ou menor de ND 4 ou inferior, escolhida por você; em turnos seguintes, sua ação pode trocar as formas. Cada alvo usa as estatísticas e os PV da fera, mas mantém tendência, INT, SAB e CAR; não pode falar, conjurar nem usar seu equipamento, que se funde ao corpo, e só faz o que a forma animal permite. O efeito termina para o alvo quando ele cai a 0 PV ou morre: volta aos PV que tinha antes, e o dano excedente passa para a forma normal, sem deixá-lo inconsciente a menos que chegue a 0 PV. Concentração, até 24 horas. (Simplificação: todo aliado a 9 m vira a mesma fera de ND 4 ou menos.)",
  "tom": -5
 },
 "animarObjetos": {
  "id": "animarObjetos",
  "name": "Animar Objetos",
  "nomeOriginal": "Animate Objects",
  "level": 5,
  "school": "transmutação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 120,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "bardo",
   "feiticeiro",
   "mago"
  ],
  "kind": "invocar",
  "invocacao": "objetos",
  "pacoteFixo": true,
  "pacotePadrao": "miudos",
  "pacotes": {
   "miudos": {
    "n": 10,
    "defId": "objetoAnimadoMiudo",
    "rotulo": "10 objetos miúdos",
    "detalhe": "20 PV, CA 18, +8 e 1d4+4"
   },
   "pequenos": {
    "n": 10,
    "defId": "objetoAnimadoPequeno",
    "rotulo": "10 objetos pequenos",
    "detalhe": "25 PV, CA 16, +6 e 1d8+2"
   },
   "medios": {
    "n": 5,
    "defId": "objetoAnimadoMedio",
    "rotulo": "5 objetos médios",
    "detalhe": "40 PV, CA 13, +5 e 2d6+1"
   },
   "grandes": {
    "n": 2,
    "defId": "objetoAnimadoGrande",
    "rotulo": "2 objetos grandes",
    "detalhe": "50 PV, CA 10, +6 e 2d10+2"
   },
   "enorme": {
    "n": 1,
    "defId": "objetoAnimadoEnorme",
    "rotulo": "1 objeto enorme",
    "detalhe": "80 PV, CA 10, +8 e 2d12+4"
   }
  },
  "opcoes": [
   {
    "id": "miudos",
    "rotulo": "10 objetos miúdos",
    "detalhe": "20 PV, CA 18, +8 e 1d4+4"
   },
   {
    "id": "pequenos",
    "rotulo": "10 objetos pequenos",
    "detalhe": "25 PV, CA 16, +6 e 1d8+2"
   },
   {
    "id": "medios",
    "rotulo": "5 objetos médios",
    "detalhe": "40 PV, CA 13, +5 e 2d6+1"
   },
   {
    "id": "grandes",
    "rotulo": "2 objetos grandes",
    "detalhe": "50 PV, CA 10, +6 e 2d10+2"
   },
   {
    "id": "enorme",
    "rotulo": "1 objeto enorme",
    "detalhe": "80 PV, CA 10, +8 e 2d12+4"
   }
  ],
  "desc": "Até dez objetos não mágicos, que ninguém esteja vestindo ou carregando, a até 36 m ganham vida como constructos sob seu controle por até 1 minuto (concentração). Cada objeto Médio ocupa duas vagas, Grande quatro e Enorme oito, e nada maior pode ser animado. A CA, os PV e o ataque de pancada (dano de concussão) variam pelo tamanho, de Miúdo (CA 18, 20 PV, +8, 1d4+4) a Enorme (CA 10, 80 PV, +8, 2d12+4). Com uma ação bônus você comanda mentalmente os que estiverem a até 150 m; sem ordens, eles só se defendem, e ao chegar a 0 PV voltam a ser objetos comuns. Em círculo maior que o 5º, anima dois objetos a mais por círculo acima do 5º. (Simplificação: os objetos surgem ao lado de quem conjura; no círculo maior, os dois objetos a mais por círculo não existem no jogo.)",
  "tom": 0
 },
 "conchaAntivida": {
  "id": "conchaAntivida",
  "name": "Concha Antivida",
  "nomeOriginal": "Antilife Shell",
  "level": 5,
  "school": "abjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "druida"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "conchaAntivida",
  "desc": "Você fica envolto por uma barreira cintilante de 3 m de raio, centrada em você e que o acompanha, por até 1 hora (concentração). Nenhuma criatura viva, ou seja, qualquer uma que não seja morto-vivo ou constructo, consegue atravessá-la ou alcançar seu interior com o corpo, mas ainda pode conjurar magias e atacar através dela com armas à distância ou de alcance. Se você se deslocar de modo a empurrar uma dessas criaturas contra a barreira, a magia termina.",
  "tom": 9
 },
 "campoAntimagia": {
  "id": "campoAntimagia",
  "name": "Campo Antimagia",
  "nomeOriginal": "Antimagic Field",
  "level": 8,
  "school": "abjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "clerigo",
   "mago"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "campoAntimagia",
  "desc": "Uma esfera invisível de 3 m de raio, centrada em você e que o acompanha, anula toda magia em seu interior por até 1 hora (concentração): não é possível conjurar magias lá dentro (o espaço de magia gasto é perdido), itens mágicos funcionam como comuns e efeitos ativos ficam suprimidos, mas o tempo suprimido continua contando para a duração. Magias que miram algo dentro da esfera não têm efeito, áreas mágicas não penetram nela, teletransporte e viagem planar falham, portais e espaços extradimensionais se fecham, e criaturas ou objetos conjurados somem até ficarem fora da área. Só efeitos de artefatos ou divindades a ignoram; Dissipar Magia não a afeta e duas esferas não se anulam.",
  "tom": -3
 },
 "olhoArcano": {
  "id": "olhoArcano",
  "name": "Olho Arcano",
  "nomeOriginal": "Arcane Eye",
  "level": 4,
  "school": "adivinhação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 30,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "mago"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "soFora": true,
  "desc": "Cria, a até 9 m, um olho mágico invisível que flutua no ar e transmite a você tudo o que vê, com visão normal, visão no escuro de 9 m e capacidade de olhar em todas as direções. Com uma ação, você o desloca até 9 m para qualquer lado, sem limite de distância de você, mas ele não pode ir a outro plano. Barreiras sólidas o detêm, embora ele passe por frestas de apenas 2,5 cm. Dura até 1 hora (concentração). (Só fora de combate.)",
  "tom": 2
 },
 "portalArcano": {
  "id": "portalArcano",
  "name": "Portal Arcano",
  "nomeOriginal": "Arcane Gate",
  "level": 6,
  "school": "conjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 500,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "livro",
  "efeito": "portalArcano",
  "mira": "casa",
  "familiaSonora": "utilidade",
  "desc": "Você abre dois portais circulares de 3 m de diâmetro ligados entre si, um em um ponto no chão a até 3 m de você e outro a até 150 m, ambos visíveis; se algum ponto estiver ocupado por uma criatura, a magia se perde. Cada portal é um anel de névoa opaca que só funciona pelo lado que você escolher, e quem entra por esse lado sai imediatamente pelo outro portal, como se fossem adjacentes. Com uma ação bônus no seu turno, você pode girar os anéis para mudar a direção do lado ativo. Dura até 10 minutos, com concentração. (Simplificação: cada anel ocupa uma casa; o primeiro nasce na casa livre mais perto de quem conjura. Os dois lados funcionam, e a névoa não tapa a vista.)",
  "tom": 2
 },
 "trancaArcana": {
  "id": "trancaArcana",
  "name": "Tranca Arcana",
  "nomeOriginal": "Arcane Lock",
  "level": 2,
  "school": "abjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 5,
  "classes": [
   "mago"
  ],
  "kind": "livro",
  "efeito": "trancaArcana",
  "mira": "casa",
  "familiaSonora": "utilidade",
  "desc": "Ao tocar uma porta, janela, portão, baú ou outra passagem fechada, você a tranca magicamente até que a magia seja dissipada, consumindo pó de ouro de 25 po. Você e as criaturas que escolher ao conjurar abrem o objeto normalmente, e você pode definir uma senha que, dita a até 1,5 m dele, suspende o efeito por 1 minuto. Para os demais, a passagem fica bloqueada até ser quebrada, e a CD para arrombá-la ou abrir suas fechaduras aumenta em 10. A magia Arrombar suspende a tranca por 10 minutos. (Simplificação: o grupo inteiro abre a porta normalmente; a senha não existe no jogo. Também se conjura pelo menu da porta, explorando.)",
  "tom": -7
 },
 "auraDeVida": {
  "id": "auraDeVida",
  "name": "Aura de Vida",
  "nomeOriginal": "Aura of Life",
  "level": 4,
  "school": "abjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "paladino"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "auraDeVida",
  "desc": "Você emana uma aura de 9 m de raio que se desloca junto com você, por até 10 minutos (concentração). Você e as criaturas não hostis dentro dela ganham resistência a dano necrótico, e o máximo de PV delas não pode ser reduzido. Uma criatura viva e não hostil que comece o turno na aura com 0 PV recupera 1 PV.",
  "tom": 0
 },
 "auraDePureza": {
  "id": "auraDePureza",
  "name": "Aura de Pureza",
  "nomeOriginal": "Aura of Purity",
  "level": 4,
  "school": "abjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "paladino"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "auraDePureza",
  "desc": "Você emana uma aura de 9 m de raio que acompanha seus movimentos por até 10 minutos, com concentração. Você e as criaturas não hostis dentro dela ficam imunes a doenças e ganham resistência a dano de veneno. Elas também têm vantagem em testes de resistência contra efeitos que as deixariam cegas, enfeitiçadas, surdas, amedrontadas, paralisadas, envenenadas ou atordoadas.",
  "tom": 9
 },
 "destruicaoBanidora": {
  "id": "destruicaoBanidora",
  "name": "Destruição Banidora",
  "nomeOriginal": "Banishing Smite",
  "level": 5,
  "school": "abjuração",
  "fonte": "phb",
  "castTime": "bonus",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "paladino"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "golpeBanidor",
  "desc": "Com uma ação bônus, seu próximo ataque com arma que acertar enquanto a magia durar causa 5d10 de dano energético extra. Se o golpe deixar o alvo com 50 PV ou menos, ele é banido: uma criatura de outro plano volta de vez ao seu plano natal, e uma nativa do plano atual fica incapacitada num semiplano inofensivo. A nativa retorna ao espaço de onde saiu (ou ao espaço livre mais próximo) quando a magia acaba. Concentração, até 1 minuto.",
  "tom": 0
 },
 "maoDeBigby": {
  "id": "maoDeBigby",
  "name": "Mão de Bigby",
  "nomeOriginal": "Bigby's Hand",
  "level": 5,
  "school": "evocação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 120,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "mago"
  ],
  "kind": "livro",
  "efeito": "peca",
  "defId": "maoDeBigby",
  "upcast": {
   "dados": 2
  },
  "desc": "Você conjura uma mão Grande de energia translúcida num ponto visível a até 36 m, que dura até 1 minuto (concentração), tem CA 20, PV iguais ao seu máximo de PV e Força 26. Ao conjurar e, nos turnos seguintes, com uma ação bônus, você a move até 18 m e escolhe um efeito: Punho Cerrado (ataque corpo a corpo com magia, 4d8 de dano energético), Mão Vigorosa (disputa de Força contra Atletismo do alvo para empurrá-lo 1,5 m + 1,5 m por ponto do seu modificador de conjuração), Mão Agarradora (agarra criatura Enorme ou menor; com ação bônus, esmaga causando 2d6 + seu modificador de dano de concussão) ou Mão Interposta (fica entre você e uma criatura, dando meia cobertura; criaturas com Força até 26 não atravessam e as mais fortes a tratam como terreno difícil). Empurrar e agarrar têm vantagem contra alvos Médios ou menores. Em círculo maior que o 5º, o punho causa +2d8 e o esmagamento +2d6 por círculo acima. (Simplificação: a mão soca sozinha no turno dela; empurrar, agarrar e se pôr no caminho não existem no jogo.)",
  "tom": 9
 },
 "barreiraDeLaminas": {
  "id": "barreiraDeLaminas",
  "name": "Barreira de Lâminas",
  "nomeOriginal": "Blade Barrier",
  "level": 6,
  "school": "evocação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 90,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "clerigo"
  ],
  "kind": "save",
  "save": "dex",
  "shape": "muralha",
  "areaFt": 100,
  "damage": "6d10",
  "damageType": "cortante",
  "halfOnSave": true,
  "muralhaAnel": 30,
  "zona": {
   "rodadas": 100,
   "quando": "inicio",
   "aoEntrar": true,
   "dificil": true,
   "semTeste": true,
   "dano": {
    "dados": "6d10",
    "tipo": "cortante",
    "save": "dex",
    "metade": true
   }
  },
  "desc": "A até 27 m, ergue-se uma muralha de lâminas giratórias de energia: reta (até 30 m de comprimento) ou circular (até 18 m de diâmetro), sempre com 6 m de altura e 1,5 m de espessura. Quem está atrás dela tem três quartos de cobertura, e o espaço da muralha é terreno difícil. A criatura que entra na área pela primeira vez no turno ou começa o turno nela faz um teste de resistência de Destreza, sofrendo 6d10 de dano cortante se falhar ou metade se passar. Dura até 10 minutos, com concentração. (Simplificação: a cobertura de três quartos que a muralha dá a quem está atrás dela não existe no jogo.)",
  "tom": 0
 },
 "praga": {
  "id": "praga",
  "name": "Praga",
  "nomeOriginal": "Blight",
  "level": 4,
  "school": "necromancia",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 30,
  "classes": [
   "druida",
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "save",
  "save": "con",
  "damage": "8d8",
  "damageType": "necrótico",
  "halfOnSave": true,
  "naoAfeta": [
   "morto-vivo",
   "constructo"
  ],
  "upcast": {
   "dados": 1
  },
  "desc": "Uma criatura visível a até 9 m faz um teste de resistência de Constituição: sofre 8d8 de dano necrótico se falhar, ou metade se passar; mortos-vivos e constructos não são afetados. Criaturas planta e plantas mágicas fazem o teste com desvantagem e recebem o dano máximo, enquanto plantas comuns que não são criaturas simplesmente murcham e morrem, sem teste. Efeito instantâneo. Em círculo maior que o 4º, o dano aumenta em 1d8 por círculo acima.",
  "tom": -2
 },
 "circuloDePoder": {
  "id": "circuloDePoder",
  "name": "Círculo de Poder",
  "nomeOriginal": "Circle of Power",
  "level": 5,
  "school": "abjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "paladino"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "circuloDePoder",
  "desc": "Uma esfera de 9 m de raio centrada em você o acompanha e enfraquece a magia ao redor. Dentro dela, você e os aliados resistem com vantagem a qualquer magia ou efeito mágico. Se um desses efeitos causar metade do dano em caso de sucesso, um aliado protegido que passar no teste não sofre dano algum. Dura até 10 minutos e exige concentração.",
  "tom": 0
 },
 "comunhaoComANatureza": {
  "id": "comunhaoComANatureza",
  "name": "Comunhão com a Natureza",
  "nomeOriginal": "Commune with Nature",
  "level": 5,
  "school": "adivinhação",
  "fonte": "phb",
  "castTime": "action",
  "minutos": 1,
  "soFora": true,
  "rangeFt": 0,
  "ritual": true,
  "classes": [
   "druida",
   "patrulheiro"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "desc": "Ritual de 5º círculo com 1 minuto de conjuração: você se funde por um instante com o ambiente natural e descobre até três fatos à sua escolha sobre a região ao redor. Ao ar livre, o alcance é de cerca de 5 km; em cavernas e outros subterrâneos naturais, cai para 90 m, e a magia falha em locais construídos, como masmorras e cidades. Os fatos podem tratar de terreno e água, plantas, minerais, animais ou povos predominantes, celestiais, fadas, corruptores, elementais ou mortos-vivos poderosos, influências de outros planos e construções. (Só fora de combate.)",
  "tom": 4
 },
 "compulsao": {
  "id": "compulsao",
  "name": "Compulsão",
  "nomeOriginal": "Compulsion",
  "level": 4,
  "school": "encantamento",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 30,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "bardo"
  ],
  "kind": "save",
  "save": "wis",
  "shape": "sphere",
  "areaFt": 30,
  "centradoEmSi": true,
  "soInimigos": true,
  "onFail": {
   "condition": "compelido",
   "rounds": 10,
   "repete": true
  },
  "desc": "Escolha criaturas que você veja a até 9 m e que possam ouvi-lo; cada uma faz um teste de resistência de Sabedoria (CD de SAB), e quem é imune a ficar enfeitiçado passa automaticamente. Enquanto durar (concentração, até 1 minuto), você usa uma ação bônus por turno para apontar uma direção no plano horizontal, e cada alvo afetado gasta o máximo de movimento possível indo para lá no turno seguinte, podendo agir antes de se mover. Os alvos não entram em perigos claramente mortais, como fogo ou fossos, mas provocam ataques de oportunidade se o caminho exigir, e após cada deslocamento forçado repetem o teste para se libertar. (Simplificação: a direção é sempre para longe de quem conjura.)",
  "tom": -5
 },
 "confusao": {
  "id": "confusao",
  "name": "Confusão",
  "nomeOriginal": "Confusion",
  "level": 4,
  "school": "encantamento",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 90,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "bardo",
   "druida",
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "save": "wis",
  "shape": "sphere",
  "areaFt": 10,
  "onFail": {
   "condition": "confuso",
   "rounds": 10,
   "repete": true
  },
  "desc": "Criaturas numa esfera de 3 m de raio, centrada num ponto a até 27 m, fazem um teste de resistência de Sabedoria contra a sua CD de SAB; quem falhar perde as reações e, no início de cada turno, rola 1d10: com 1 anda sem rumo em direção aleatória (1d8) e não age, de 2 a 6 fica parado sem agir, com 7 ou 8 ataca corpo a corpo uma criatura aleatória ao alcance (ou nada faz) e com 9 ou 10 age normalmente. Ao fim de cada turno seu, o afetado repete o teste de Sabedoria e se livra do efeito em caso de sucesso. Dura até 1 minuto, com concentração. Em círculo 5 ou maior, o raio cresce 1,5 m por círculo acima do 4º. (Simplificação: o jogo usa o resumo da confusão (sem reações e com desvantagem), não o d10 do livro.)",
  "tom": -3
 },
 "conjurarRajada": {
  "id": "conjurarRajada",
  "name": "Conjurar Rajada",
  "nomeOriginal": "Conjure Volley",
  "level": 5,
  "school": "conjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 150,
  "classes": [
   "patrulheiro"
  ],
  "kind": "save",
  "save": "dex",
  "shape": "sphere",
  "areaFt": 40,
  "damage": "8d8",
  "damageType": "perfurante",
  "halfOnSave": true,
  "desc": "Você dispara uma munição ou arremessa uma arma não mágica para o alto, mirando um ponto a até 45 m, e centenas de cópias dela despencam sobre um cilindro de 12 m de raio e 6 m de altura antes de sumirem. Cada criatura na área faz um teste de resistência de Destreza contra a sua CD de magia, sofrendo 8d8 de dano se falhar ou metade se passar. O tipo de dano é o mesmo da munição ou arma usada, e o efeito é instantâneo. (Simplificação: o dano é sempre perfurante, o da flecha.)",
  "tom": 3
 },
 "conjurarSeresDaFloresta": {
  "id": "conjurarSeresDaFloresta",
  "name": "Conjurar Seres da Floresta",
  "nomeOriginal": "Conjure Woodland Beings",
  "level": 4,
  "school": "conjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "druida",
   "patrulheiro"
  ],
  "kind": "invocar",
  "invocacao": "fadas",
  "pacotePadrao": "nd12",
  "pacotes": {
   "nd1": {
    "n": 2,
    "defId": "driade",
    "rotulo": "2 fadas de ND 1",
    "detalhe": "duas dríades"
   },
   "nd12": {
    "n": 4,
    "defId": "satiro",
    "rotulo": "4 fadas de ND 1/2",
    "detalhe": "quatro sátiros"
   },
   "nd14": {
    "n": 8,
    "defId": "pixie",
    "rotulo": "8 fadas de ND 1/4",
    "detalhe": "oito pixies"
   }
  },
  "opcoes": [
   {
    "id": "nd1",
    "rotulo": "2 fadas de ND 1",
    "detalhe": "duas dríades"
   },
   {
    "id": "nd12",
    "rotulo": "4 fadas de ND 1/2",
    "detalhe": "quatro sátiros"
   },
   {
    "id": "nd14",
    "rotulo": "8 fadas de ND 1/4",
    "detalhe": "oito pixies"
   }
  ],
  "desc": "Invoca fadas em espaços livres visíveis a até 18 m, à sua escolha: uma de ND 2 ou menos, duas de ND 1, quatro de ND 1/2 ou oito de ND 1/4; cada uma some ao chegar a 0 PV ou quando a magia termina (concentração, até 1 hora). As fadas são aliadas do grupo, agem juntas na própria iniciativa e cumprem suas ordens verbais sem gastar ação; sem ordens, apenas se defendem. Com espaço de 6º círculo surgem o dobro de criaturas, e com espaço de 8º círculo, o triplo. (Simplificação: não há fada de ND 2 no jogo; ficam os outros três pacotes.)",
  "tom": -5
 },
 "contatarOutroPlano": {
  "id": "contatarOutroPlano",
  "name": "Contatar Outro Plano",
  "nomeOriginal": "Contact Other Plane",
  "level": 5,
  "school": "adivinhação",
  "fonte": "phb",
  "castTime": "action",
  "minutos": 1,
  "soFora": true,
  "rangeFt": 0,
  "duracaoRodadas": 10,
  "ritual": true,
  "classes": [
   "bruxo",
   "mago"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "desc": "Ritual de 5º círculo, com conjuração de 1 minuto: você se conecta mentalmente a uma entidade de outro plano e precisa passar num teste de resistência de Inteligência CD 15. Se falhar, sofre 6d6 de dano psíquico e enlouquece até terminar um descanso longo. Nesse estado, não pode realizar ações, ler nem entender o que dizem, e só fala coisas sem sentido; Restauração Maior encerra o efeito. Se passar, pode fazer até cinco perguntas dentro de 1 minuto, respondidas pelo mestre com uma palavra (ou uma frase curta, se uma palavra só fosse enganosa). (Só fora de combate.)",
  "tom": 12
 },
 "contagio": {
  "id": "contagio",
  "name": "Contágio",
  "nomeOriginal": "Contagion",
  "level": 5,
  "school": "necromancia",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 5,
  "duracaoRodadas": 100800,
  "classes": [
   "clerigo",
   "druida"
  ],
  "kind": "attack",
  "melee": true,
  "applies": {
   "condition": "envenenado",
   "rounds": 100000
  },
  "desc": "Faça um ataque corpo a corpo com magia contra uma criatura ao seu alcance; se acertar, ela fica envenenada e, ao fim de cada turno dela, faz um teste de resistência de Constituição. Com três sucessos o veneno passa e a magia acaba; com três falhas o veneno passa, mas você escolhe uma doença que a aflige por 7 dias, e qualquer efeito que cure doenças funciona contra ela. Opções: Cegueira (cego e desvantagem em testes de SAB), Febre Imunda (desvantagem em testes e ataques de FOR), Carne Podre (desvantagem em CAR e vulnerabilidade a todo dano), Mente em Chamas (desvantagem em INT e age como sob Confusão em combate), Convulsões (desvantagem em testes e ataques de DES) ou Ruína Viscosa (desvantagem em CON e fica atordoado até o fim do próximo turno sempre que sofre dano). (Simplificação: o toque envenena; a doença que vem depois de três falhas não existe no jogo.)",
  "tom": 0
 },
 "bolaDeFogoControlavel": {
  "id": "bolaDeFogoControlavel",
  "name": "Bola de Fogo Controlável",
  "nomeOriginal": "Delayed Blast Fireball",
  "level": 7,
  "school": "evocação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 150,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "save": "dex",
  "shape": "sphere",
  "areaFt": 20,
  "contornaEsquinas": true,
  "damage": "12d6",
  "damageType": "fogo",
  "halfOnSave": true,
  "upcast": {
   "dados": 1
  },
  "desc": "Você fixa uma conta luminosa num ponto a até 45 m, que fica ali enquanto durar a concentração (até 1 minuto); quando a magia termina, por vontade sua ou por perder a concentração, ela explode numa esfera de 6 m de raio que contorna esquinas, e cada criatura faz teste de resistência de Destreza: sofre o dano acumulado de fogo na falha ou metade no sucesso. O dano começa em 12d6 e ganha 1d6 a cada fim de turno seu sem detonação; o fogo danifica objetos e incendeia itens inflamáveis que ninguém esteja vestindo ou carregando. Quem tocar a conta antes disso faz teste de Destreza: na falha ela explode na hora, no sucesso pode arremessá-la a até 12 m, e ela explode ao atingir uma criatura ou objeto sólido. Em círculo 8 ou maior, o dano inicial aumenta 1d6 por círculo acima do 7º. (Simplificação: a conta explode na hora; a espera que soma 1d6 por rodada não existe no jogo.)",
  "tom": 0
 },
 "ondaDestrutiva": {
  "id": "ondaDestrutiva",
  "name": "Onda Destrutiva",
  "nomeOriginal": "Destructive Wave",
  "level": 5,
  "school": "evocação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 0,
  "classes": [
   "paladino"
  ],
  "kind": "save",
  "save": "con",
  "shape": "sphere",
  "areaFt": 30,
  "centradoEmSi": true,
  "soInimigos": true,
  "damage": "5d6",
  "damageType": "trovejante",
  "damage2": "5d6",
  "damageType2": "radiante",
  "halfOnSave": true,
  "onFail": {
   "condition": "caido"
  },
  "desc": "Ao golpear o chão, você libera uma explosão de energia divina que atinge as criaturas que escolher num raio de 9 m ao seu redor. Cada uma faz um teste de resistência de Constituição: se falhar, sofre 5d6 de dano trovejante mais 5d6 de dano radiante ou necrótico (à sua escolha) e fica caída. Quem passa sofre metade do dano e permanece de pé. O efeito é instantâneo. (Simplificação: a metade que o livro deixa escolher entre radiante e necrótico é sempre radiante.)",
  "tom": -2
 },
 "dissiparOBemEOMal": {
  "id": "dissiparOBemEOMal",
  "name": "Dissipar o Bem e o Mal",
  "nomeOriginal": "Dispel Evil and Good",
  "level": 5,
  "school": "abjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "clerigo",
   "paladino"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "dissiparBemEMal",
  "desc": "Você fica envolto por uma energia protetora por até 1 minuto (concentração): celestiais, corruptores, elementais, fadas e mortos-vivos atacam você com desvantagem. Com uma ação, você pode encerrar a magia antes para tocar uma criatura ao seu alcance e livrá-la de ficar enfeitiçada, amedrontada ou possuída por uma dessas criaturas. Outra opção, também com uma ação, é fazer um ataque corpo a corpo com magia contra uma criatura desses tipos: se acertar, ela faz um teste de resistência de Carisma e, se falhar, é banida para o seu plano natal (mortos-vivos vão para a Umbra e fadas para a Agrestia das Fadas, caso já não estejam lá). (Simplificação: o toque que desfaz o encanto e o que manda a criatura de volta ao plano dela não existem no jogo.)",
  "tom": 4
 },
 "adivinhacao": {
  "id": "adivinhacao",
  "name": "Adivinhação",
  "nomeOriginal": "Divination",
  "level": 4,
  "school": "adivinhação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 0,
  "ritual": true,
  "classes": [
   "clerigo"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "soFora": true,
  "desc": "Ritual de 4º círculo, lançado em si mesmo, que consome incenso e uma oferenda religiosa de pelo menos 25 po para consultar uma divindade ou seus servos. Você faz uma única pergunta sobre um objetivo, evento ou atividade que ocorrerá nos próximos 7 dias, e o Mestre responde com a verdade, talvez de forma breve, enigmática ou como um presságio. A resposta não prevê mudanças futuras, como novas magias ou a perda ou chegada de aliados. Cada uso extra antes de um descanso longo acumula 25% de chance de a resposta ser aleatória, rolada em segredo pelo Mestre. (Só fora de combate.)",
  "tom": -3
 },
 "palavraDivina": {
  "id": "palavraDivina",
  "name": "Palavra Divina",
  "nomeOriginal": "Divine Word",
  "level": 7,
  "school": "evocação",
  "fonte": "phb",
  "castTime": "bonus",
  "rangeFt": 30,
  "classes": [
   "clerigo"
  ],
  "kind": "livro",
  "efeito": "palavraDivina",
  "raioFt": 30,
  "desc": "Com uma ação bônus, você escolhe quantas criaturas quiser que consiga ver a até 9 m; as que puderem ouvi-lo fazem um teste de resistência de Carisma e, se falharem, sofrem um efeito conforme os PV atuais: até 50 PV, surdo por 1 minuto; até 40, surdo e cego por 10 minutos; até 30, cego, surdo e atordoado por 1 hora; até 20, morre na hora. Celestiais, elementais, fadas e corruptores que falharem são mandados de volta ao plano natal, seja qual for seu PV, e não podem voltar ao seu plano por 24 horas, salvo por Desejo. Efeito instantâneo, sem concentração.",
  "tom": 9
 },
 "dominarBesta": {
  "id": "dominarBesta",
  "name": "Dominar Besta",
  "nomeOriginal": "Dominate Beast",
  "level": 4,
  "school": "encantamento",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "druida",
   "feiticeiro"
  ],
  "kind": "debuff",
  "targets": 1,
  "save": "wis",
  "condition": "dominado",
  "soTipo": "fera",
  "vantagemEmCombate": true,
  "desc": "Uma besta visível a até 18 m faz um teste de resistência de Sabedoria (com vantagem se você ou aliados estiverem lutando com ela) ou fica enfeitiçada por você, com concentração, até 1 minuto. Enquanto durar, você a comanda por telepatia sem gastar ação, dando ordens simples que ela cumpre. Com sua ação, você controla cada ação dela até o fim do seu próximo turno, e pode gastar sua reação para que ela use a dela. Sempre que sofrer dano, ela repete o teste e se liberta ao passar. No 5º círculo dura até 10 minutos, no 6º até 1 hora e do 7º em diante até 8 horas.",
  "tom": -5
 },
 "dominarMonstro": {
  "id": "dominarMonstro",
  "name": "Dominar Monstro",
  "nomeOriginal": "Dominate Monster",
  "level": 8,
  "school": "encantamento",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "bardo",
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "debuff",
  "targets": 1,
  "save": "wis",
  "condition": "dominado",
  "vantagemEmCombate": true,
  "desc": "Escolha uma criatura visível a até 18 m: ela faz um teste de resistência de Sabedoria (CD de SAB) e, se falhar, fica enfeitiçada por você por até 1 hora (concentração); se você ou aliados estiverem lutando com ela, o teste tem vantagem. Enquanto durar, vocês ficam ligados por telepatia no mesmo plano, e você dá ordens simples sem gastar ação, que ela tenta cumprir; com sua ação, você controla cada ato dela até o fim do seu próximo turno, podendo até gastar sua reação para que ela use a dela. Sempre que sofrer dano, o alvo repete o teste e encerra a magia se passar. Em espaço de 9º círculo, a duração sobe para até 8 horas.",
  "tom": -3
 },
 "dominarPessoa": {
  "id": "dominarPessoa",
  "name": "Dominar Pessoa",
  "nomeOriginal": "Dominate Person",
  "level": 5,
  "school": "encantamento",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "bardo",
   "feiticeiro",
   "mago"
  ],
  "kind": "debuff",
  "targets": 1,
  "save": "wis",
  "condition": "dominado",
  "soTipo": "humanoide",
  "vantagemEmCombate": true,
  "desc": "Um humanoide visível a até 18 m faz um teste de resistência de Sabedoria (com vantagem se você ou aliados estiverem lutando contra ele); se falhar, fica enfeitiçado por você enquanto durar a concentração, até 1 minuto. Por um elo telepático no mesmo plano, você dá ordens simples sem gastar ação, e com sua ação assume controle total dele até o fim do seu próximo turno, podendo até gastar sua reação para que ele use a dele. Sempre que sofrer dano, o alvo repete o teste e, se passar, a magia termina. Com espaço de 6º círculo dura até 10 minutos, de 7º até 1 hora e de 8º ou maior até 8 horas.",
  "tom": 0
 },
 "terremoto": {
  "id": "terremoto",
  "name": "Terremoto",
  "nomeOriginal": "Earthquake",
  "level": 8,
  "school": "evocação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 500,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "clerigo",
   "druida",
   "feiticeiro"
  ],
  "kind": "save",
  "save": "con",
  "shape": "sphere",
  "areaFt": 100,
  "soZona": true,
  "onFail": {
   "condition": "caido"
  },
  "zona": {
   "rodadas": 10,
   "quando": "fimDono",
   "aoEntrar": false,
   "dificil": true
  },
  "desc": "Um ponto visível no solo a até 150 m vira o centro de um tremor de 30 m de raio que dura até 1 minuto (concentração): o chão vira terreno difícil, quem está concentrado em contato com o solo faz teste de resistência de Constituição para não perder a concentração, e ao lançar e no fim de cada turno seu as criaturas no chão fazem teste de resistência de Destreza ou ficam caídas. No início do seu turno seguinte, 1d6 fendas de 3 m de largura e 1d10 × 3 m de profundidade cortam a área de ponta a ponta; quem está onde uma se abre faz teste de Destreza para não cair nela. Estruturas no solo sofrem 50 de dano de concussão ao lançar e no início de cada turno seu, e desabam a 0 PV ou se uma fenda se abrir embaixo delas. Criaturas a até metade da altura da estrutura fazem teste de Destreza: na falha sofrem 5d6 de concussão, ficam caídas e soterradas (escapar exige ação e teste de Força (Atletismo) CD 20, ajustável pelo mestre); no sucesso, metade do dano e nada mais. (Simplificação: o chão treme e derruba; as fendas que se abrem e as construções que desabam não existem no jogo.)",
  "tom": 9
 },
 "formaEterea": {
  "id": "formaEterea",
  "name": "Forma Etérea",
  "nomeOriginal": "Etherealness",
  "level": 7,
  "school": "transmutação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 0,
  "duracaoRodadas": 4800,
  "classes": [
   "bardo",
   "clerigo",
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "livro",
  "efeito": "formaEterea",
  "familiaSonora": "utilidade",
  "desc": "Você passa para a Fronteira Etérea por até 8 horas (sem concentração) ou até usar uma ação para encerrar; lá pode se mover em qualquer direção (subir ou descer custa o dobro), atravessar objetos e só interage com o que também estiver no Plano Etéreo, enxergando o plano de origem em tons de cinza até 18 m. Quem está fora do Etéreo não percebe nem afeta você, salvo por magia ou habilidade especial. Ao fim, você reaparece no ponto correspondente; se estiver dentro de algo sólido, é empurrado ao espaço livre mais próximo e sofre dano energético igual a 2 por cada 30 cm deslocados (cerca de 10 por 1,5 m). Não funciona se lançada no Etéreo ou em planos que não fazem fronteira com ele; em círculo 8 ou maior, afeta até três criaturas voluntárias (incluindo você) a até 3 m por círculo acima do 7º. (Simplificação: só quem conjura vai para o etéreo, em qualquer círculo. Lá ninguém o vê nem o toca, e ele não ataca nem conjura; a ação Voltar do Plano Etéreo o traz de volta numa casa livre a até o deslocamento dele, por cima de parede.)",
  "tom": -3
 },
 "tentaculosNegrosDeEvard": {
  "id": "tentaculosNegrosDeEvard",
  "name": "Tentáculos Negros de Evard",
  "nomeOriginal": "Evard's Black Tentacles",
  "level": 4,
  "school": "conjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 90,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "mago"
  ],
  "kind": "save",
  "save": "dex",
  "shape": "square",
  "areaFt": 20,
  "soZona": true,
  "onFail": {
   "condition": "contido"
  },
  "zona": {
   "rodadas": 10,
   "quando": "inicio",
   "aoEntrar": true,
   "dificil": true,
   "dano": {
    "dados": "3d6",
    "tipo": "concussão"
   }
  },
  "desc": "Você escolhe um quadrado de 6 m no chão visível a até 27 m, que vira terreno difícil coberto de tentáculos negros por até 1 minuto (concentração). Quem entra na área pela primeira vez no turno ou começa o turno nela faz um teste de resistência de Destreza: se falhar, sofre 3d6 de dano de concussão e fica contido até a magia acabar; quem já está contido sofre 3d6 de concussão ao começar o turno ali. Com sua ação, a criatura contida pode tentar se soltar com um teste de Força ou Destreza contra a CD da sua magia.",
  "tom": -2
 },
 "olharPerturbador": {
  "id": "olharPerturbador",
  "name": "Olhar Perturbador",
  "nomeOriginal": "Eyebite",
  "level": 6,
  "school": "necromancia",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "bardo",
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "save",
  "save": "wis",
  "onFail": {
   "condition": "amedrontado",
   "rounds": 10,
   "repete": true,
   "foge": true
  },
  "desc": "Por até 1 minuto (concentração), seus olhos viram um vazio sombrio: escolha uma criatura visível a até 18 m, que faz um teste de resistência de Sabedoria contra a sua CD de SAB e, se falhar, sofre um efeito à sua escolha enquanto a magia durar. Adormecido: fica inconsciente até sofrer dano ou ser sacudido por outra criatura com uma ação. Em pânico: fica amedrontado por você e, em cada turno, usa Disparada para fugir pelo caminho mais seguro, livrando-se do efeito ao chegar a 18 m de distância sem vê-lo. Nauseado: tem desvantagem em ataques e testes de habilidade e repete o teste de SAB ao fim de cada turno dele; nos seus turnos seguintes, você pode usar sua ação para mirar outra criatura, mas não uma que já tenha resistido a esta conjuração. (Simplificação: é sempre o olhar do pânico, uma vez; o livro deixa olhar de novo a cada turno e escolher entre sono, pânico e náusea.)",
  "tom": 2
 },
 "enfraquecerOIntelecto": {
  "id": "enfraquecerOIntelecto",
  "name": "Enfraquecer o Intelecto",
  "nomeOriginal": "Feeblemind",
  "level": 8,
  "school": "encantamento",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 150,
  "classes": [
   "bardo",
   "druida",
   "bruxo",
   "mago"
  ],
  "kind": "save",
  "save": "int",
  "damage": "4d6",
  "damageType": "psíquico",
  "halfOnSave": false,
  "onFail": {
   "condition": "debilitado",
   "rounds": null
  },
  "desc": "Uma criatura visível a até 45 m sofre 4d6 de dano psíquico e faz um teste de resistência de Inteligência. Se falhar, sua Inteligência e seu Carisma caem para 1: ela fica sem conjurar magias, ativar itens mágicos, entender idiomas ou se comunicar de forma compreensível, embora ainda reconheça, siga e defenda seus aliados. O efeito é instantâneo e permanente; a cada 30 dias a vítima repete o teste e encerra a magia se passar, e Restauração Maior, Cura Completa ou Desejo também a desfazem.",
  "tom": 0
 },
 "escudoDeFogo": {
  "id": "escudoDeFogo",
  "name": "Escudo de Fogo",
  "nomeOriginal": "Fire Shield",
  "level": 4,
  "school": "evocação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 0,
  "duracaoRodadas": 100,
  "classes": [
   "mago"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "escudoDeFogo",
  "desc": "Por 10 minutos, sem concentração, chamas finas envolvem seu corpo e iluminam 3 m com luz plena e mais 3 m com penumbra; você pode encerrá-las antes usando uma ação. Ao conjurar, escolha entre escudo quente, que dá resistência a dano de frio, ou escudo gélido, que dá resistência a dano de fogo. Sempre que uma criatura a até 1,5 m acertar você com um ataque corpo a corpo, ela sofre 2d8 de dano de fogo (escudo quente) ou de frio (escudo gélido). (Simplificação: é sempre o escudo quente: resiste a frio e queima quem bate.)",
  "tom": 9
 },
 "tempestadeDeFogo": {
  "id": "tempestadeDeFogo",
  "name": "Tempestade de Fogo",
  "nomeOriginal": "Fire Storm",
  "level": 7,
  "school": "evocação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 150,
  "classes": [
   "clerigo",
   "druida",
   "feiticeiro"
  ],
  "kind": "save",
  "save": "dex",
  "shape": "square",
  "areaFt": 30,
  "damage": "7d10",
  "damageType": "fogo",
  "halfOnSave": true,
  "desc": "Você conjura chamas num ponto a até 45 m, formando uma área de até dez cubos de 3 m que você monta livremente, desde que cada cubo encoste uma face em outro. Cada criatura na área faz um teste de resistência de Destreza: sofre 7d10 de dano de fogo se falhar, ou metade se passar. O fogo danifica objetos e incendeia os inflamáveis que ninguém esteja vestindo ou carregando, e você pode escolher poupar as plantas da área. O efeito é instantâneo e não exige concentração. (Simplificação: o livro deixa arrumar dez cubos de 3 m como quiser; aqui é um bloco só de 9 m.)",
  "tom": 0
 },
 "carneParaPedra": {
  "id": "carneParaPedra",
  "name": "Carne para Pedra",
  "nomeOriginal": "Flesh to Stone",
  "level": 6,
  "school": "transmutação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "bruxo",
   "mago"
  ],
  "kind": "debuff",
  "targets": 1,
  "save": "con",
  "condition": "petrificando",
  "desc": "Escolha uma criatura de carne que você veja a até 18 m: ela faz um teste de resistência de Constituição e, se falhar, fica contida enquanto o corpo endurece. No fim de cada turno dela, repete o teste. Três sucessos (não precisam ser seguidos) encerram a magia, e três falhas a deixam petrificada enquanto a magia durar. Concentração, até 1 minuto; se você mantiver a concentração pelo minuto inteiro, a petrificação se torna permanente até ser removida, e danos físicos sofridos como pedra permanecem como deformidades se ela voltar ao normal. (Simplificação: uma falha a mais vira pedra, e um sucesso a mais livra; o livro pede três de um lado.)",
  "tom": 0
 },
 "proibicao": {
  "id": "proibicao",
  "name": "Proibição",
  "nomeOriginal": "Forbiddance",
  "level": 6,
  "school": "abjuração",
  "fonte": "phb",
  "castTime": "action",
  "minutos": 10,
  "soFora": true,
  "rangeFt": 5,
  "duracaoRodadas": 14400,
  "ritual": true,
  "classes": [
   "clerigo"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "desc": "Ritual de 10 minutos que protege, por 1 dia, até cerca de 3.700 m² de piso tocado, com 9 m de altura, contra viagens mágicas: ninguém entra ali por teletransporte, portais ou trânsito planar (Astral, Etéreo, Agrestia das Fadas, Umbra, Viagem Planar). Ao conjurar, escolha um ou mais tipos entre celestiais, corruptores, elementais, fadas e mortos-vivos, e também se o dano será radiante ou necrótico; uma criatura escolhida que entre na área pela primeira vez no turno ou comece o turno nela sofre 5d10 desse dano, sem teste de resistência. Você pode definir uma senha, e quem a pronunciar ao entrar fica imune ao dano. A área não pode se sobrepor a outra Proibição; conjurada no mesmo local por 30 dias seguidos, torna-se permanente até ser dissipada, e só então os componentes (1.000 po) são consumidos. (Só fora de combate.)",
  "tom": -5
 },
 "jaulaDeEnergia": {
  "id": "jaulaDeEnergia",
  "name": "Jaula de Energia",
  "nomeOriginal": "Forcecage",
  "level": 7,
  "school": "evocação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 100,
  "duracaoRodadas": 600,
  "classes": [
   "bardo",
   "bruxo",
   "mago"
  ],
  "kind": "livro",
  "efeito": "jaula",
  "shape": "square",
  "areaFt": 10,
  "desc": "Você cria, num ponto a até 30 m, uma prisão cúbica de energia, invisível e imóvel, que dura 1 hora (sem concentração) e consome pó de rubi de 1.500 po. Escolha a forma: jaula de grades com até 6 m de lado, ou caixa sólida com até 3 m de lado que barra qualquer matéria e impede magias de entrar ou sair. Criaturas inteiramente dentro ficam presas, e as que estão só parcialmente dentro ou não cabem são empurradas para fora; nenhum meio comum permite escapar, e o efeito também bloqueia o Plano Etéreo. Para sair por teletransporte ou viagem planar, a criatura precisa passar num teste de resistência de Carisma, senão o efeito é desperdiçado; Dissipar Magia não encerra esta magia. (Simplificação: é a jaula de grades: quem está dentro não sai, mas golpe e magia passam; a fuga por teletransporte não existe no jogo.)",
  "tom": 0
 },
 "presciencia": {
  "id": "presciencia",
  "name": "Presciência",
  "nomeOriginal": "Foresight",
  "level": 9,
  "school": "adivinhação",
  "fonte": "phb",
  "castTime": "action",
  "minutos": 1,
  "soFora": true,
  "rangeFt": 5,
  "duracaoRodadas": 4800,
  "classes": [
   "bardo",
   "druida",
   "bruxo",
   "mago"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "desc": "Por 8 horas, sem concentração, uma criatura voluntária tocada enxerga lampejos do futuro próximo: não pode ser surpreendida e tem vantagem em jogadas de ataque, testes de atributo e testes de resistência. Enquanto durar, ataques de outras criaturas contra ela têm desvantagem. Conjurar a magia de novo encerra imediatamente o efeito anterior. (Só fora de combate.)",
  "tom": 4
 },
 "missao": {
  "id": "missao",
  "name": "Missão",
  "nomeOriginal": "Geas",
  "level": 5,
  "school": "encantamento",
  "fonte": "phb",
  "castTime": "action",
  "minutos": 1,
  "soFora": true,
  "rangeFt": 60,
  "duracaoRodadas": 432000,
  "classes": [
   "bardo",
   "clerigo",
   "druida",
   "paladino",
   "mago"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "desc": "Uma criatura visível a até 18 m que entenda você faz um teste de resistência de Sabedoria (CD de SAB); se falhar, fica enfeitiçada por 30 dias e obrigada a cumprir uma tarefa ou evitar uma conduta que você determinar. Agir diretamente contra a ordem causa 5d10 de dano psíquico, no máximo uma vez por dia; ordens que levariam a morte certa encerram a magia, e criaturas que não entendem você são imunes. Você pode dispensá-la com uma ação, e Remover Maldição, Restauração Maior ou Desejo também a encerram. Em 7º ou 8º círculo dura 1 ano; em 9º círculo dura até ser encerrada por uma dessas magias. (Só fora de combate.)",
  "tom": 0
 },
 "insetoGigante": {
  "id": "insetoGigante",
  "name": "Inseto Gigante",
  "nomeOriginal": "Giant Insect",
  "level": 4,
  "school": "transmutação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 30,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "druida"
  ],
  "kind": "invocar",
  "invocacao": "insetos",
  "pacoteFixo": true,
  "pacotePadrao": "aranhas",
  "pacotes": {
   "centopeias": {
    "n": 10,
    "defId": "centopeiaGigante",
    "rotulo": "10 centopeias gigantes",
    "detalhe": "ND 1/4"
   },
   "aranhas": {
    "n": 3,
    "defId": "aranhaGigante",
    "rotulo": "3 aranhas gigantes",
    "detalhe": "ND 1"
   },
   "vespas": {
    "n": 5,
    "defId": "vespaGigante",
    "rotulo": "5 vespas gigantes",
    "detalhe": "ND 1/2"
   },
   "escorpiao": {
    "n": 1,
    "defId": "escorpiaoGigante",
    "rotulo": "1 escorpião gigante",
    "detalhe": "ND 3"
   }
  },
  "opcoes": [
   {
    "id": "centopeias",
    "rotulo": "10 centopeias gigantes",
    "detalhe": "ND 1/4"
   },
   {
    "id": "aranhas",
    "rotulo": "3 aranhas gigantes",
    "detalhe": "ND 1"
   },
   {
    "id": "vespas",
    "rotulo": "5 vespas gigantes",
    "detalhe": "ND 1/2"
   },
   {
    "id": "escorpiao",
    "rotulo": "1 escorpião gigante",
    "detalhe": "ND 3"
   }
  ],
  "desc": "Escolha insetos comuns a até 9 m e faça-os crescer: até dez centopeias, três aranhas, cinco vespas ou um único escorpião viram as versões gigantes de suas espécies. Eles seguem suas ordens faladas e agem no seu turno em combate, com estatísticas e ações controladas pelo Mestre. Cada um volta ao normal quando chega a 0 PV, quando você gasta uma ação para desfazer o efeito nele ou ao fim da duração de até 10 minutos (concentração). O Mestre pode permitir outros insetos, como uma abelha que usa as estatísticas de vespa gigante. (Simplificação: os insetos surgem já grandes; o livro transforma insetos comuns que estejam por perto.)",
  "tom": 2
 },
 "labia": {
  "id": "labia",
  "name": "Lábia",
  "nomeOriginal": "Glibness",
  "level": 8,
  "school": "transmutação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 0,
  "duracaoRodadas": 600,
  "classes": [
   "bardo",
   "bruxo"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "soFora": true,
  "desc": "Você mesmo, por 1 hora, sem concentração. Em qualquer teste de Carisma, você pode trocar o resultado do d20 por 15. Durante esse tempo, magias que verificam se você fala a verdade sempre indicam que você está sendo sincero, diga o que disser. (Só fora de combate.)",
  "tom": -5
 },
 "globoDeInvulnerabilidade": {
  "id": "globoDeInvulnerabilidade",
  "name": "Globo de Invulnerabilidade",
  "nomeOriginal": "Globe of Invulnerability",
  "level": 6,
  "school": "abjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "feiticeiro",
   "mago"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "globo",
  "desc": "Cria ao seu redor uma barreira imóvel e levemente cintilante, com 3 m de raio, que dura até 1 minuto (concentração). Magias de 5º círculo ou menor lançadas de fora dela não afetam nada do lado de dentro, mesmo que conjuradas com espaço de círculo maior: podem mirar quem está lá, mas não produzem efeito, e suas áreas ignoram o interior do globo. Para cada círculo acima do 6º, o limite das magias bloqueadas sobe em um círculo.",
  "tom": -5
 },
 "vinhaAgarradora": {
  "id": "vinhaAgarradora",
  "name": "Vinha Agarradora",
  "nomeOriginal": "Grasping Vine",
  "level": 4,
  "school": "conjuração",
  "fonte": "phb",
  "castTime": "bonus",
  "rangeFt": 30,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "druida",
   "patrulheiro"
  ],
  "kind": "livro",
  "efeito": "vinha",
  "alvo": "criatura",
  "desc": "Com uma ação bônus, você faz brotar uma vinha do chão num espaço desocupado visível a até 9 m. Ao conjurar e depois como ação bônus em cada um dos seus turnos, a vinha pode chicotear uma criatura visível a até 9 m dela, que faz um teste de resistência de Destreza contra a CD da magia ou é puxada 6 m em linha reta na direção da vinha. Dura até 1 minuto, com concentração. (Simplificação: a vinha puxa uma vez, para perto de quem a conjurou; puxar de novo a cada turno não existe no jogo.)",
  "tom": 2
 },
 "restauracaoMaior": {
  "id": "restauracaoMaior",
  "name": "Restauração Maior",
  "nomeOriginal": "Greater Restoration",
  "level": 5,
  "school": "abjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 5,
  "classes": [
   "bardo",
   "clerigo",
   "druida"
  ],
  "kind": "restaurar",
  "remove": [
   "enfeiticado",
   "petrificado",
   "petrificando",
   "rogado",
   "bruxaria",
   "deformado",
   "amaldicoadoLamia",
   "malditoVil",
   "debilitado"
  ],
  "desc": "Ao tocar uma criatura, você remove dela um efeito debilitante à sua escolha: diminui em um o nível de exaustão, ou encerra um efeito que a deixou enfeitiçada ou petrificada, uma maldição (inclusive a sintonia com um item mágico amaldiçoado), qualquer redução em um valor de atributo ou um efeito que reduza seu máximo de PV. O efeito é instantâneo e consome pó de diamante de pelo menos 100 po.",
  "tom": 2
 },
 "vigilanciaEProtecao": {
  "id": "vigilanciaEProtecao",
  "name": "Vigilância e Proteção",
  "nomeOriginal": "Guards and Wards",
  "level": 6,
  "school": "abjuração",
  "fonte": "phb",
  "castTime": "action",
  "minutos": 10,
  "soFora": true,
  "rangeFt": 5,
  "duracaoRodadas": 14400,
  "classes": [
   "bardo",
   "mago"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "desc": "Em 10 minutos, você protege até 230 m² de piso (até 6 m de altura, no formato que quiser, podendo cobrir vários andares contíguos) por 24 horas, podendo isentar pessoas escolhidas ou definir uma senha que torna imune quem a pronunciar. Corredores ficam tomados por névoa (escuridão densa) e, em cada bifurcação, há 50% de chance de um intruso seguir na direção oposta à escolhida; portas ficam trancadas como por Tranca Arcana, com até dez delas disfarçadas de parede; escadas se enchem de teias como Teia, que se refazem em 10 minutos. Você ainda escolhe um efeito extra: Luzes Dançantes em quatro corredores, Boca Encantada em dois pontos, Névoa Fétida em dois pontos, Lufada de Vento constante em um cômodo ou Sugestão em um quadrado de 1,5 m. Dissipar Magia remove só o efeito visado, e conjurar a magia no mesmo local diariamente por um ano torna a proteção permanente; o componente custa 1.000 po. (Só fora de combate.)",
  "tom": 2
 },
 "consagrar": {
  "id": "consagrar",
  "name": "Consagrar",
  "nomeOriginal": "Hallow",
  "level": 5,
  "school": "evocação",
  "fonte": "phb",
  "castTime": "action",
  "minutos": 1440,
  "soFora": true,
  "rangeFt": 5,
  "classes": [
   "clerigo"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "desc": "Após 24 horas de ritual tocando um ponto, você consagra (ou profana) uma área de até 18 m de raio, gastando ervas, óleos e incenso de 1.000 po; o efeito é permanente até ser dissipado e falha se tocar outra área já consagrada. Celestiais, elementais, fadas, corruptores e mortos-vivos (exceto os tipos que você liberar) não entram na área nem enfeitiçam, amedrontam ou possuem quem está dentro, e quem já sofria isso se liberta ao entrar. Você também vincula um efeito extra, como coragem (imunidade a amedrontado), escuridão ou luz do dia mágicas, resistência ou vulnerabilidade a um tipo de dano não físico, impedir que cadáveres virem mortos-vivos, bloquear teleporte e viagem planar, medo, silêncio ou idiomas compartilhados. Você escolhe quem o efeito extra afeta (todos, seguidores de uma divindade ou certo tipo de criatura), e cada uma pode fazer um teste de resistência de Carisma ao entrar pela primeira vez no turno ou ao começar o turno ali, ignorando o efeito até sair se passar. (Só fora de combate.)",
  "tom": 0
 },
 "ferir": {
  "id": "ferir",
  "name": "Ferir",
  "nomeOriginal": "Harm",
  "level": 6,
  "school": "necromancia",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 60,
  "classes": [
   "clerigo"
  ],
  "kind": "save",
  "save": "con",
  "damage": "14d6",
  "damageType": "necrótico",
  "halfOnSave": true,
  "reduzMaximo": true,
  "naoMata": true,
  "naoAfeta": [
   "morto-vivo",
   "constructo"
  ],
  "desc": "Uma criatura visível a até 18 m faz um teste de resistência de Constituição (CD de CON): sofre 14d6 de dano necrótico se falhar, ou metade se passar, mas esse dano nunca a deixa com menos de 1 PV. Se falhar, seus PV máximos também caem, por 1 hora, no valor do dano necrótico recebido. Qualquer efeito que cure doenças restaura o máximo de PV antes desse prazo. Efeito instantâneo, sem concentração.",
  "tom": 0
 },
 "banqueteDeHerois": {
  "id": "banqueteDeHerois",
  "name": "Banquete de Heróis",
  "nomeOriginal": "Heroes' Feast",
  "level": 6,
  "school": "conjuração",
  "fonte": "phb",
  "castTime": "action",
  "minutos": 10,
  "soFora": true,
  "rangeFt": 30,
  "classes": [
   "clerigo",
   "druida"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "desc": "Você conjura um banquete a até 9 m, consumindo uma tigela incrustada de gemas de 1.000 po. Até doze criaturas podem comer por 1 hora, e só depois disso os efeitos começam. Cada participante é curado de doenças e venenos, fica imune a dano de veneno, à condição envenenado e a ficar amedrontado, e tem vantagem em testes de resistência de Sabedoria. Além disso, seu máximo de PV aumenta em 2d10, e ela ganha a mesma quantidade de PV, com todos os benefícios durando 24 horas. (Só fora de combate.)",
  "tom": 2
 },
 "auraSagrada": {
  "id": "auraSagrada",
  "name": "Aura Sagrada",
  "nomeOriginal": "Holy Aura",
  "level": 8,
  "school": "abjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 30,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "clerigo"
  ],
  "kind": "buff",
  "targets": 8,
  "condition": "auraSagrada",
  "desc": "Você escolhe criaturas num raio de 9 m ao seu redor no momento da conjuração. Enquanto durar, cada uma emite penumbra em 1,5 m, tem vantagem em todos os testes de resistência e impõe desvantagem nas jogadas de ataque feitas contra ela. Se um corruptor ou morto-vivo acertar uma criatura protegida com ataque corpo a corpo, deve passar num teste de resistência de Constituição ou fica cego até a magia acabar. Concentração, até 1 minuto; exige um relicário sagrado de 1.000 po.",
  "tom": 9
 },
 "nuvemIncendiaria": {
  "id": "nuvemIncendiaria",
  "name": "Nuvem Incendiária",
  "nomeOriginal": "Incendiary Cloud",
  "level": 8,
  "school": "conjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 150,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "save": "dex",
  "shape": "sphere",
  "areaFt": 20,
  "soZona": true,
  "zona": {
   "rodadas": 10,
   "quando": "fim",
   "aoEntrar": true,
   "dificil": false,
   "semTeste": true,
   "obscuro": "pesada",
   "dano": {
    "dados": "10d8",
    "tipo": "fogo",
    "save": "dex",
    "metade": true
   }
  },
  "desc": "Uma esfera de fumaça cheia de brasas incandescentes, com 6 m de raio, surge num ponto a até 45 m. Ela contorna esquinas, deixa a área com escuridão densa e dura até 1 minuto (concentração), a menos que um vento de pelo menos 15 km/h a disperse. Quem estiver na nuvem quando ela aparece, entrar nela pela primeira vez no turno ou terminar o turno lá dentro faz um teste de resistência de Destreza: sofre 10d8 de dano de fogo se falhar, ou metade se passar. No início de cada um dos seus turnos, você move a nuvem 3 m para longe de você, na direção que escolher. (Simplificação: a nuvem fica parada; no livro ela se afasta 3 m por turno.)",
  "tom": 0
 },
 "pragaDeInsetos": {
  "id": "pragaDeInsetos",
  "name": "Praga de Insetos",
  "nomeOriginal": "Insect Plague",
  "level": 5,
  "school": "conjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 300,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "clerigo",
   "druida",
   "feiticeiro"
  ],
  "kind": "save",
  "save": "con",
  "shape": "sphere",
  "areaFt": 20,
  "soZona": true,
  "zona": {
   "rodadas": 100,
   "quando": "inicio",
   "aoEntrar": true,
   "dificil": true,
   "semTeste": true,
   "dano": {
    "dados": "4d10",
    "tipo": "perfurante",
    "save": "con",
    "metade": true
   }
  },
  "upcast": {
   "dados": 1
  },
  "desc": "Uma nuvem de gafanhotos famintos ocupa uma esfera de 6 m de raio, centrada num ponto a até 90 m, que contorna esquinas e torna a área levemente obscurecida e terreno difícil por até 10 minutos (concentração). Toda criatura na área quando ela surge, ao entrar nela pela primeira vez num turno ou ao terminar o turno ali faz um teste de resistência de Constituição contra a sua CD, sofrendo 4d10 de dano perfurante se falhar ou metade se passar. Em círculo 6 ou maior, o dano aumenta em 1d10 por círculo acima do 5º. (Simplificação: os insetos ferem quem entra e quem começa o turno na nuvem; a picada de quando ela surge e a escuridão leve não existem no jogo.)",
  "tom": 0
 },
 "lendasEHistorias": {
  "id": "lendasEHistorias",
  "name": "Lendas e Histórias",
  "nomeOriginal": "Legend Lore",
  "level": 5,
  "school": "adivinhação",
  "fonte": "phb",
  "castTime": "action",
  "minutos": 10,
  "soFora": true,
  "rangeFt": 0,
  "classes": [
   "bardo",
   "clerigo",
   "mago"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "desc": "Ao longo de 10 minutos, você nomeia ou descreve uma pessoa, um lugar ou um objeto e recebe na mente um resumo do conhecimento relevante sobre ele, que pode incluir relatos atuais, histórias esquecidas ou segredos. Só funciona se o alvo tiver importância lendária; caso contrário, nada é revelado. Quanto mais você já souber sobre o alvo, mais precisa e detalhada será a resposta, que é sempre verdadeira, embora possa vir em linguagem simbólica ou enigmática. Exige incenso de 250 po, consumido pela magia, e quatro tiras de marfim de 50 po cada. (Só fora de combate.)",
  "tom": -3
 },
 "localizarCriatura": {
  "id": "localizarCriatura",
  "name": "Localizar Criatura",
  "nomeOriginal": "Locate Creature",
  "level": 4,
  "school": "adivinhação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "bardo",
   "clerigo",
   "druida",
   "paladino",
   "patrulheiro",
   "mago"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "soFora": true,
  "desc": "Você nomeia ou descreve uma criatura que conhece (um indivíduo específico ou a mais próxima de um tipo, desde que já tenha visto um exemplar a até 9 m) e passa a sentir em que direção ela está, se estiver a até 300 m, além de saber para onde se move caso esteja em movimento. Dura até 1 hora, com concentração. A magia falha se o alvo estiver em outra forma, como sob Metamorfose, ou se água corrente com 3 m ou mais de largura cortar o caminho direto entre vocês. (Só fora de combate.)",
  "tom": 0
 },
 "curaCompletaEmMassa": {
  "id": "curaCompletaEmMassa",
  "name": "Cura Completa em Massa",
  "nomeOriginal": "Mass Heal",
  "level": 9,
  "school": "evocação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 60,
  "classes": [
   "clerigo"
  ],
  "kind": "livro",
  "efeito": "curaEmMassa",
  "desc": "Você distribui até 700 PV de cura como quiser entre quantas criaturas visíveis desejar a até 18 m. Cada criatura curada também se livra de todas as doenças e de qualquer efeito que a deixe cega ou surda. Mortos-vivos e constructos não são afetados. Efeito instantâneo, sem concentração.",
  "tom": 9
 },
 "sugestaoEmMassa": {
  "id": "sugestaoEmMassa",
  "name": "Sugestão em Massa",
  "nomeOriginal": "Mass Suggestion",
  "level": 6,
  "school": "encantamento",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 60,
  "duracaoRodadas": 14400,
  "classes": [
   "bardo",
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "debuff",
  "targets": 12,
  "save": "wis",
  "condition": "sugerido",
  "desc": "Até doze criaturas à sua escolha que você veja a até 18 m, e que ouçam e entendam você, recebem uma ordem razoável de uma ou duas frases; quem não pode ser enfeitiçado é imune, e pedir algo claramente autodestrutivo anula a magia. Cada alvo faz um teste de resistência de Sabedoria contra sua CD de SAB e, se falhar, cumpre a ordem da melhor forma possível por até 24 horas (sem concentração), podendo a ordem depender de um gatilho futuro; a magia acaba antes se a tarefa for concluída ou, para um alvo, se você ou um aliado causar dano a ele. Com espaço de 7º círculo dura 10 dias, de 8º dura 30 dias e de 9º dura um ano e um dia.",
  "tom": -3
 },
 "labirinto": {
  "id": "labirinto",
  "name": "Labirinto",
  "nomeOriginal": "Maze",
  "level": 8,
  "school": "conjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "mago"
  ],
  "kind": "matar",
  "targets": 1,
  "condicao": "labirinto",
  "desc": "Uma criatura visível a até 18 m é enviada a um semiplano labiríntico, onde fica presa por até 10 minutos (concentração). A cada turno, ela pode gastar sua ação num teste de Inteligência CD 20; se passar, sai e a magia termina, e minotauros e demônios goristros escapam automaticamente. Ao fim da magia, o alvo volta ao espaço de onde saiu ou, se ele estiver ocupado, ao espaço livre mais próximo.",
  "tom": 7
 },
 "limparAMente": {
  "id": "limparAMente",
  "name": "Limpar a Mente",
  "nomeOriginal": "Mind Blank",
  "level": 8,
  "school": "abjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 5,
  "duracaoRodadas": 14400,
  "classes": [
   "bardo",
   "mago"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "menteVazia",
  "desc": "Você toca uma criatura voluntária e, por 24 horas, sem exigir concentração, ela fica imune a dano psíquico e à condição enfeitiçado. Nesse período, magias de adivinhação e efeitos que leiam pensamentos ou percebam emoções não funcionam contra ela. A proteção resiste até a Desejo e a poderes equivalentes usados para afetar a mente do alvo ou obter informações sobre ele.",
  "tom": -3
 },
 "despistar": {
  "id": "despistar",
  "name": "Despistar",
  "nomeOriginal": "Mislead",
  "level": 5,
  "school": "ilusão",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "bardo",
   "mago"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "invisivel",
  "desc": "Você fica invisível e, no mesmo instante, surge um duplo ilusório seu no local onde está; o duplo dura toda a magia (concentração, até 1 hora), e você só volta a ser visto quando ataca ou lança uma magia. Com sua ação, você desloca o duplo até o dobro do seu deslocamento e o faz falar, gesticular e agir como quiser. Como ação bônus no seu turno, você pode passar a ver e ouvir pelos sentidos do duplo, ou voltar aos seus; enquanto usa os dele, fica cego e surdo em relação ao que está ao seu redor. (Simplificação: fica a invisibilidade; o duplo ilusório não existe no jogo.)",
  "tom": -3
 },
 "modificarMemoria": {
  "id": "modificarMemoria",
  "name": "Modificar Memória",
  "nomeOriginal": "Modify Memory",
  "level": 5,
  "school": "encantamento",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 30,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "bardo",
   "mago"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "soFora": true,
  "desc": "Uma criatura visível a até 9 m faz um teste de resistência de Sabedoria contra a sua CD de SAB, com vantagem se estiver lutando com você. Se falhar, fica enfeitiçada e incapacitada, alheia ao redor mas ouvindo você, por até 1 minuto (concentração); sofrer dano ou ser alvo de outra magia encerra o efeito sem alterar nada. Nesse tempo, você descreve em voz alta, num idioma que ela entenda, como apagar, aguçar, alterar ou inventar a lembrança de um evento de até 10 minutos ocorrido nas últimas 24 horas, e a mudança se fixa quando a magia termina; lembranças absurdas podem ser descartadas, e Remover Maldição ou Restauração Maior desfazem a alteração. Em círculos maiores, o evento pode ter ocorrido há até 7 dias (6º), 30 dias (7º), 1 ano (8º) ou em qualquer momento do passado (9º). (Só fora de combate.)",
  "tom": 2
 },
 "caoFielDeMordenkainen": {
  "id": "caoFielDeMordenkainen",
  "name": "Cão Fiel de Mordenkainen",
  "nomeOriginal": "Mordenkainen's Faithful Hound",
  "level": 4,
  "school": "conjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 30,
  "duracaoRodadas": 4800,
  "classes": [
   "mago"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "soFora": true,
  "desc": "Você cria um cão de guarda espectral em um espaço desocupado visível a até 9 m, que dura 8 horas (sem concentração), até você dispensá-lo com uma ação ou se afastar mais de 30 m dele. O cão é invisível para todos exceto você, não pode sofrer dano, vê criaturas invisíveis e o Plano Etéreo, ignora ilusões e late alto quando uma criatura Pequena ou maior chega a até 9 m sem dizer a senha que você definiu. No início de cada turno seu, ele morde uma criatura hostil a até 1,5 m, com bônus de ataque igual ao seu modificador de conjuração + bônus de proficiência, causando 4d8 de dano perfurante se acertar. (Só fora de combate.)",
  "tom": 9
 },
 "mansaoMagnificaDeMordenkainen": {
  "id": "mansaoMagnificaDeMordenkainen",
  "name": "Mansão Magnífica de Mordenkainen",
  "nomeOriginal": "Mordenkainen's Magnificent Mansion",
  "level": 7,
  "school": "conjuração",
  "fonte": "phb",
  "castTime": "action",
  "minutos": 1,
  "soFora": true,
  "rangeFt": 300,
  "duracaoRodadas": 14400,
  "classes": [
   "bardo",
   "mago"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "desc": "Ao longo de 1 minuto, você cria a até 90 m uma residência extradimensional que dura 24 horas, com uma única entrada cintilante de 1,5 m por 3 m; só você e as criaturas que indicar ao conjurar podem entrar, e você abre ou fecha o portal (invisível quando fechado) estando a até 9 m dele. O interior, limpo e aquecido, tem a planta e a decoração que você quiser, ocupando até 50 cubos de 3 m de lado, com comida para um banquete de nove pratos para 100 pessoas. Cem servos quase transparentes obedecem às suas ordens e fazem qualquer serviço doméstico, mas não atacam, não ferem ninguém e não saem da mansão; objetos criados pela magia viram fumaça se forem levados para fora. Quando a magia acaba, tudo o que estiver lá dentro é expelido para os espaços livres mais próximos da entrada. (Só fora de combate.)",
  "tom": 4
 },
 "santuarioParticularDeMordenkainen": {
  "id": "santuarioParticularDeMordenkainen",
  "name": "Santuário Particular de Mordenkainen",
  "nomeOriginal": "Mordenkainen's Private Sanctum",
  "level": 4,
  "school": "abjuração",
  "fonte": "phb",
  "castTime": "action",
  "minutos": 10,
  "soFora": true,
  "rangeFt": 120,
  "duracaoRodadas": 14400,
  "classes": [
   "mago"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "desc": "Você protege um cubo de 1,5 m a 30 m de aresta a até 36 m, por 24 horas (sem concentração) ou até dispensá-lo com uma ação. Escolha quaisquer destas proteções: o som não atravessa a borda; a borda fica escura e enevoada, bloqueando a visão (inclusive visão no escuro); sensores de adivinhação não entram nem cruzam o limite; criaturas dentro não podem ser alvo de adivinhação; ninguém se teleporta para dentro ou para fora; e viagens planares ficam bloqueadas ali. Conjurada no mesmo local todos os dias durante um ano, torna-se permanente. Em círculo 5 ou maior, a aresta máxima aumenta 30 m por círculo acima do 4º. (Só fora de combate.)",
  "tom": 0
 },
 "espadaDeMordenkainen": {
  "id": "espadaDeMordenkainen",
  "name": "Espada de Mordenkainen",
  "nomeOriginal": "Mordenkainen's Sword",
  "level": 7,
  "school": "evocação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "bardo",
   "mago"
  ],
  "kind": "livro",
  "efeito": "peca",
  "defId": "espadaDeMordenkainen",
  "desc": "Uma lâmina de força flutuante surge num ponto a até 18 m e, ao aparecer, faz um ataque corpo a corpo com magia contra uma criatura a até 1,5 m dela, causando 3d10 de dano energético se acertar. Em cada um dos seus turnos seguintes, com uma ação bônus, você desloca a espada até 6 m para um local que consiga ver e ataca de novo, o mesmo alvo ou outro. Dura até 1 minuto e exige concentração; o componente material é uma espadinha de platina de 250 po.",
  "tom": 0
 },
 "esferaCongelanteDeOtiluke": {
  "id": "esferaCongelanteDeOtiluke",
  "name": "Esfera Congelante de Otiluke",
  "nomeOriginal": "Otiluke's Freezing Sphere",
  "level": 6,
  "school": "evocação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 300,
  "classes": [
   "mago"
  ],
  "kind": "save",
  "save": "con",
  "shape": "sphere",
  "areaFt": 60,
  "damage": "10d6",
  "damageType": "frio",
  "halfOnSave": true,
  "upcast": {
   "dados": 1
  },
  "desc": "Um globo gélido voa até um ponto a até 90 m e explode numa esfera de 18 m de raio: cada criatura na área faz um teste de resistência de Constituição, sofrendo 10d6 de dano de frio se falhar ou metade se passar. Se atingir água, congela uma área de 9 m de lado até 15 cm de profundidade por 1 minuto, prendendo quem nadava na superfície, que pode usar uma ação para fazer um teste de Força contra a CD da magia e se soltar. Em vez de disparar, você pode guardar o globo na mão; você ou quem o receber pode arremessá-lo a até 12 m ou com uma funda, e ele explode no impacto com o mesmo efeito, ou sozinho após 1 minuto. Em círculo 7 ou maior, o dano aumenta em 1d6 por círculo acima do 6º. (Simplificação: o globo que se guarda para jogar depois e a água que congela não existem no jogo.)",
  "tom": 0
 },
 "esferaResilienteDeOtiluke": {
  "id": "esferaResilienteDeOtiluke",
  "name": "Esfera Resiliente de Otiluke",
  "nomeOriginal": "Otiluke's Resilient Sphere",
  "level": 4,
  "school": "evocação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 30,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "mago"
  ],
  "kind": "debuff",
  "targets": 1,
  "save": "dex",
  "condition": "esferaResiliente",
  "desc": "Uma criatura ou objeto Grande ou menor a até 9 m fica preso numa esfera de energia cintilante por até 1 minuto (concentração); se a criatura não quiser, faz um teste de resistência de Destreza e só é presa se falhar. A esfera é imune a todo dano e nada a atravessa, nem objetos, nem energia, nem magias: quem está dentro respira normalmente, mas não pode ferir nem ser ferido por nada do lado de fora. Sem peso, a esfera pode ser carregada por outros ou rolada pelo prisioneiro, que gasta sua ação para movê-la até metade do seu deslocamento. Desintegrar mirada nela a destrói sem ferir o conteúdo.",
  "tom": 7
 },
 "dancaIrresistivelDeOtto": {
  "id": "dancaIrresistivelDeOtto",
  "name": "Dança Irresistível de Otto",
  "nomeOriginal": "Otto's Irresistible Dance",
  "level": 6,
  "school": "encantamento",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 30,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "bardo",
   "mago"
  ],
  "kind": "matar",
  "targets": 1,
  "condicao": "dancando",
  "save": "wis",
  "desc": "Uma criatura que você veja a até 9 m é forçada a dançar sem sair do lugar, gastando todo o seu deslocamento nisso, por até 1 minuto (concentração); criaturas imunes a ser enfeitiçadas não são afetadas. Enquanto dança, ela tem desvantagem em jogadas de ataque e em testes de resistência de Destreza, e os ataques contra ela têm vantagem. A cada turno, a vítima pode usar sua ação para fazer um teste de resistência de Sabedoria e, se passar, a magia termina.",
  "tom": 7
 },
 "criarPassagem": {
  "id": "criarPassagem",
  "name": "Criar Passagem",
  "nomeOriginal": "Passwall",
  "level": 5,
  "school": "transmutação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 30,
  "duracaoRodadas": 600,
  "classes": [
   "mago"
  ],
  "kind": "livro",
  "efeito": "criarPassagem",
  "mira": "casa",
  "familiaSonora": "utilidade",
  "desc": "Você abre uma passagem em uma superfície de madeira, gesso ou pedra (parede, teto ou piso) que consiga ver a até 9 m, com até 1,5 m de largura, 2,4 m de altura e 6 m de profundidade, sem abalar a estrutura ao redor. A abertura dura 1 hora, sem exigir concentração. Quando ela some, criaturas e objetos ainda lá dentro são expelidos em segurança para o espaço livre mais próximo da superfície onde a magia foi conjurada. (Simplificação: a passagem segue a direção de quem conjura até a parede mirada, numa fileira de casas, e fica aberta pela cena: uma hora passa de qualquer luta.)",
  "tom": -3
 },
 "viagemPlanar": {
  "id": "viagemPlanar",
  "name": "Viagem Planar",
  "nomeOriginal": "Plane Shift",
  "level": 7,
  "school": "conjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 5,
  "classes": [
   "clerigo",
   "druida",
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "attack",
  "melee": true,
  "applies": {
   "condition": "banidoDeVez",
   "save": "cha"
  },
  "desc": "Você e até oito criaturas voluntárias de mãos dadas em círculo viajam para outro plano de existência, chegando no destino escolhido ou perto dele (o ponto exato fica a critério do mestre), ou num círculo de teletransporte cuja sequência de símbolos você conheça. Também serve para banir: faça um ataque corpo a corpo com magia contra uma criatura ao seu alcance; se acertar, ela faz um teste de resistência de Carisma e, se falhar, vai parar num lugar aleatório do plano que você escolher, tendo de achar sozinha o caminho de volta. Exige um bastão de metal bifurcado de 250 po sintonizado com o plano de destino; o efeito é instantâneo. (Simplificação: na luta, a magia é a de mandar o alvo embora; levar o grupo a outro plano não existe no jogo.)",
  "tom": 0
 },
 "metamorfose": {
  "id": "metamorfose",
  "name": "Metamorfose",
  "nomeOriginal": "Polymorph",
  "level": 4,
  "school": "transmutação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "bardo",
   "druida",
   "feiticeiro",
   "mago"
  ],
  "kind": "livro",
  "efeito": "metamorfose",
  "alvo": "criatura",
  "desc": "Escolha uma criatura visível a até 18 m e transforme-a em uma fera de nível de desafio igual ou menor ao dela (ou ao seu nível); se não quiser, ela faz um teste de resistência de Sabedoria contra a sua CD de SAB, e metamorfos ou criaturas com 0 PV não são afetados. O alvo passa a usar todas as estatísticas da fera, inclusive valores mentais e PV, mantendo só tendência e personalidade; não pode falar, conjurar magias, usar as mãos nem aproveitar o equipamento, que se funde à nova forma. Ao chegar a 0 PV, ele volta à forma original com os PV que tinha antes, e o dano que sobrar passa para ela, sem deixá-lo inconsciente se não zerar esses PV. Dura até 1 hora (concentração) ou até o alvo cair a 0 PV ou morrer. (Simplificação: o inimigo vira rã; o aliado vira a fera mais forte que o nível dele permite.)",
  "tom": -5
 },
 "palavraDePoderCurar": {
  "id": "palavraDePoderCurar",
  "name": "Palavra de Poder Curar",
  "nomeOriginal": "Power Word Heal",
  "level": 9,
  "school": "evocação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 5,
  "classes": [
   "bardo"
  ],
  "kind": "livro",
  "efeito": "palavraCurar",
  "alvo": "criatura",
  "desc": "Você toca uma criatura e ela recupera todos os seus PV de uma vez. Se estiver enfeitiçada, amedrontada, paralisada ou atordoada, essas condições terminam. Se estiver caída, pode gastar a reação para se levantar. Efeito instantâneo; não funciona em mortos-vivos nem em constructos.",
  "tom": 0
 },
 "palavraDePoderAtordoar": {
  "id": "palavraDePoderAtordoar",
  "name": "Palavra de Poder Atordoar",
  "nomeOriginal": "Power Word Stun",
  "level": 8,
  "school": "encantamento",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 60,
  "classes": [
   "bardo",
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "matar",
  "targets": 1,
  "limitePv": 150,
  "condicao": "atordoado",
  "save": "con",
  "desc": "Escolha uma criatura que você consiga ver a até 18 m: se ela tiver 150 PV ou menos, fica atordoada; com mais PV que isso, nada acontece. Ao fim de cada turno dela, a vítima faz um teste de resistência de Constituição e, se passar, deixa de estar atordoada. A magia é instantânea, sem concentração, e exige apenas componente verbal.",
  "tom": 7
 },
 "sprayPrismatico": {
  "id": "sprayPrismatico",
  "name": "Spray Prismático",
  "nomeOriginal": "Prismatic Spray",
  "level": 7,
  "school": "evocação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 0,
  "classes": [
   "feiticeiro",
   "mago"
  ],
  "kind": "livro",
  "efeito": "prismatico",
  "shape": "cone",
  "areaFt": 60,
  "desc": "Um cone de 18 m de raios coloridos exige de cada criatura um teste de resistência de Destreza contra a CD de magia, e um d8 rolado por alvo define qual raio a atinge. De 1 a 5, o raio causa 10d6 de dano (fogo, ácido, elétrico, veneno ou frio, nessa ordem), com metade em caso de sucesso. Com 6, quem falha fica contido e repete testes de Constituição ao fim de cada turno: três sucessos encerram o efeito e três falhas o deixam petrificado para sempre. Com 7, quem falha fica cego e, se falhar num teste de Sabedoria no início do seu próximo turno, é lançado a outro plano escolhido pelo mestre; com 8, o alvo sofre dois raios (role de novo duas vezes, ignorando novos 8). Efeito instantâneo, sem concentração. (Simplificação: o raio anil começa a petrificar como o olhar da medusa, e o violeta só cega; o livro leva três testes a cada um.)",
  "tom": 3
 },
 "muralhaPrismatica": {
  "id": "muralhaPrismatica",
  "name": "Muralha Prismática",
  "nomeOriginal": "Prismatic Wall",
  "level": 9,
  "school": "abjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 60,
  "duracaoRodadas": 100,
  "classes": [
   "mago"
  ],
  "kind": "save",
  "save": "dex",
  "soZona": true,
  "shape": "muralha",
  "areaFt": 90,
  "zona": {
   "rodadas": 100,
   "quando": "nunca",
   "aoEntrar": true,
   "dificil": false,
   "semTeste": true,
   "barraVisao": true,
   "prismatica": true,
   "luz": {
    "claro": 100,
    "penumbra": 100
   }
  },
  "desc": "Cria, a até 18 m, uma parede opaca de luz com sete cores (até 27 m de comprimento por 9 m de altura) ou uma esfera de até 9 m de diâmetro, que dura 10 minutos sem concentração; falha se for posta sobre o espaço de uma criatura. Ela emite luz intensa num raio de 30 m, e quem a vê e chega a até 6 m dela, ou começa o turno ali, faz teste de resistência de Constituição ou fica cego por 1 minuto; você e os aliados que escolher a atravessam sem sofrer nada. Quem a atravessa faz um teste de Destreza para cada camada: vermelha, laranja, amarela, verde e azul causam 10d6 de dano (fogo, ácido, elétrico, veneno e frio, respectivamente; metade se passar), a anil deixa contido e pode petrificar após três falhas em testes de Constituição, e a violeta cega e pode lançar a criatura a outro plano se ela falhar num teste de Sabedoria. As camadas caem uma a uma, na ordem, cada qual por um meio próprio (como 25 de dano de frio na vermelha ou Dissipar Magia na violeta); campo antimagia não a afeta, e enquanto existem, as camadas bloqueiam ataques à distância e magias. (Simplificação: só a parede reta, de 27 m; a esfera não existe no jogo. Quem conjurou e o lado dele passam sem nada. O brilho cega quem começa o turno a até 6 m (e quem está perto quando ela surge), não quem chega andando; e as camadas não se destroem uma a uma.)",
  "tom": 9
 },
 "vinculoTelepaticoDeRary": {
  "id": "vinculoTelepaticoDeRary",
  "name": "Vínculo Telepático de Rary",
  "nomeOriginal": "Rary's Telepathic Bond",
  "level": 5,
  "school": "adivinhação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 30,
  "duracaoRodadas": 600,
  "ritual": true,
  "classes": [
   "mago"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "soFora": true,
  "desc": "Até oito criaturas voluntárias escolhidas a até 9 m ficam ligadas mentalmente umas às outras por 1 hora, sem exigir concentração; pode ser conjurada como ritual. Durante esse tempo, todas conversam por telepatia mesmo sem idioma em comum e a qualquer distância, desde que estejam no mesmo plano de existência. Criaturas com Inteligência 2 ou menor não são afetadas. (Só fora de combate.)",
  "tom": 9
 },
 "regeneracao": {
  "id": "regeneracao",
  "name": "Regeneração",
  "nomeOriginal": "Regenerate",
  "level": 7,
  "school": "transmutação",
  "fonte": "phb",
  "castTime": "action",
  "minutos": 1,
  "soFora": true,
  "rangeFt": 5,
  "duracaoRodadas": 600,
  "classes": [
   "bardo",
   "clerigo",
   "druida"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "desc": "Ao toque, uma criatura recupera imediatamente 4d8 + 15 PV e, por 1 hora (sem concentração), ganha 1 PV no início de cada um de seus turnos. Membros perdidos, como dedos, pernas ou cauda, voltam a crescer em 2 minutos; se a parte decepada for encostada no coto, ela se reconecta na hora. A conjuração leva 1 minuto. (Só fora de combate.)",
  "tom": -5
 },
 "reencarnacao": {
  "id": "reencarnacao",
  "name": "Reencarnação",
  "nomeOriginal": "Reincarnate",
  "level": 5,
  "school": "transmutação",
  "fonte": "phb",
  "castTime": "action",
  "minutos": 60,
  "soFora": true,
  "rangeFt": 5,
  "classes": [
   "druida"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "desc": "Ao tocar um humanoide morto há no máximo 10 dias, ou um pedaço dele, você cria um corpo adulto novo e chama a alma de volta; se ela não estiver livre ou não quiser voltar, a magia falha. A raça do novo corpo costuma mudar: o mestre rola d100 numa tabela de raças (humano, anão, elfo, halfling, gnomo, draconato, tiefling etc.) ou escolhe. A criatura mantém memórias e capacidades, trocando apenas os traços raciais. Conjuração de 1 hora, efeito instantâneo, consome óleos e unguentos raros de 1.000 po. (Só fora de combate.)",
  "tom": -3
 },
 "ressurreicao": {
  "id": "ressurreicao",
  "name": "Ressurreição",
  "nomeOriginal": "Resurrection",
  "level": 7,
  "school": "necromancia",
  "fonte": "phb",
  "castTime": "action",
  "minutos": 60,
  "soFora": true,
  "rangeFt": 5,
  "classes": [
   "bardo",
   "clerigo"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "desc": "Com 1 hora de conjuração e um diamante de 1.000 po (consumido), você toca uma criatura morta há até 100 anos que não tenha morrido de velhice nem seja morta-viva; se a alma aceitar, ela volta com todos os PV, membros perdidos e ferimentos fatais restaurados, além de livre de venenos e doenças comuns (maldições e doenças mágicas permanecem). A criatura revivida sofre -4 em jogadas de ataque, testes de resistência e testes de habilidade, e a penalidade diminui em 1 a cada descanso longo. Se ela estava morta há um ano ou mais, você fica sem poder conjurar magias e com desvantagem em ataques, testes de habilidade e de resistência até terminar um descanso longo. (Só fora de combate.)",
  "tom": -5
 },
 "inverterAGravidade": {
  "id": "inverterAGravidade",
  "name": "Inverter a Gravidade",
  "nomeOriginal": "Reverse Gravity",
  "level": 7,
  "school": "transmutação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 100,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "druida",
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "save": "dex",
  "shape": "sphere",
  "areaFt": 50,
  "onFail": {
   "condition": "levitando"
  },
  "desc": "Num ponto a até 30 m, você cria um cilindro de 15 m de raio e 30 m de altura onde a gravidade passa a puxar para cima, por até 1 minuto (concentração). Criaturas e objetos soltos na área despencam para o alto, mas uma criatura pode fazer um teste de resistência de Destreza para se agarrar a algo fixo ao seu alcance e não cair. Quem bate em um teto ou outra superfície sólida sofre dano de queda normal; quem chega ao topo sem colidir fica flutuando lá. Quando a magia termina, tudo o que foi afetado cai de volta ao chão. (Simplificação: quem falha flutua sem chão, longe do alcance dos golpes de perto, e cai quando a magia acaba; o teto de 30 m do livro não existe no tabuleiro.)",
  "tom": -3
 },
 "videncia": {
  "id": "videncia",
  "name": "Vidência",
  "nomeOriginal": "Scrying",
  "level": 5,
  "school": "adivinhação",
  "fonte": "phb",
  "castTime": "action",
  "minutos": 10,
  "soFora": true,
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "bardo",
   "clerigo",
   "druida",
   "bruxo",
   "mago"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "desc": "Escolha uma criatura no mesmo plano que você: ela faz um teste de resistência de Sabedoria, com modificadores conforme o quanto você a conhece (+5 se só ouviu falar, 0 se já a encontrou, -5 se a conhece bem) e o vínculo físico que você tem com ela (-2 retrato, -4 objeto ou roupa, -10 parte do corpo como cabelo ou unha); um alvo que saiba da magia pode falhar de propósito. Se falhar, surge a até 3 m dele um sensor invisível que o acompanha e pelo qual você vê e ouve como se estivesse lá; quem enxerga o invisível o vê como uma esfera luminosa do tamanho de um punho. Se passar, fica imune a esta magia por 24 horas. Em vez de uma criatura, você pode mirar um local que já viu, onde o sensor fica fixo; dura até 10 minutos com concentração e exige um foco de pelo menos 1.000 po. (Só fora de combate.)",
  "tom": 7
 },
 "aparenciaEnganosa": {
  "id": "aparenciaEnganosa",
  "name": "Aparência Enganosa",
  "nomeOriginal": "Seeming",
  "level": 5,
  "school": "ilusão",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 30,
  "duracaoRodadas": 4800,
  "classes": [
   "bardo",
   "feiticeiro",
   "mago"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "soFora": true,
  "desc": "Você dá um visual ilusório novo, incluindo roupas e equipamento, a quantas criaturas quiser que consiga ver a até 9 m; quem não aceitar pode fazer um teste de resistência de Carisma para ignorar o efeito. Cada alvo pode parecer até 30 cm mais alto ou mais baixo e mais magro ou mais gordo, mas mantém a mesma disposição de membros. Dura 8 horas, sem concentração, e você pode encerrá-la com uma ação. A ilusão não resiste ao toque, e uma criatura pode usar uma ação para fazer um teste de Inteligência (Investigação) contra a CD da sua magia e, se passar, percebe o disfarce. (Só fora de combate.)",
  "tom": -5
 },
 "mudarDeForma": {
  "id": "mudarDeForma",
  "name": "Mudar de Forma",
  "nomeOriginal": "Shapechange",
  "level": 9,
  "school": "transmutação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "druida",
   "mago"
  ],
  "kind": "livro",
  "efeito": "metamorfose",
  "soSi": true,
  "crMax": "nivel",
  "desc": "Você se transforma em uma criatura que já tenha visto, com nível de desafio igual ou menor que o seu nível, desde que não seja constructo nem morto-vivo, por até 1 hora (concentração). Ela não terá níveis de classe nem Conjuração. Você adota as estatísticas, os PV e os Dados de Vida da forma, mas mantém tendência, INT, SAB, CAR, suas proficiências e as características que o corpo novo permita usar. Não ganha ações lendárias nem de covil, e o dano que passar de 0 PV é transferido à sua forma normal. Enquanto durar, você pode usar sua ação para trocar de forma, sem recuperar PV ao fazê-lo. Requer um diadema de jade de 1.500 po. (Simplificação: a forma é escolhida pelo jogo: o dragão ou a fera mais forte que o nível permite.)",
  "tom": 0
 },
 "destruicaoCambaleante": {
  "id": "destruicaoCambaleante",
  "name": "Destruição Cambaleante",
  "nomeOriginal": "Staggering Smite",
  "level": 4,
  "school": "evocação",
  "fonte": "phb",
  "castTime": "bonus",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "paladino"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "golpeAturdidor",
  "desc": "Com uma ação bônus, você imbui sua arma, e o próximo acerto corpo a corpo com arma dentro de 1 minuto (concentração) causa 4d6 de dano psíquico adicional. O alvo atingido faz um teste de resistência de Sabedoria contra a CD da magia. Se falhar, até o fim do próximo turno dele fica sem reações e tem desvantagem em jogadas de ataque e testes de habilidade.",
  "tom": 7
 },
 "tempestadeDaVinganca": {
  "id": "tempestadeDaVinganca",
  "name": "Tempestade da Vingança",
  "nomeOriginal": "Storm of Vengeance",
  "level": 9,
  "school": "conjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 1000,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "druida"
  ],
  "kind": "livro",
  "efeito": "tempestade",
  "desc": "Uma nuvem de tempestade de 108 m de raio surge sobre um ponto à vista (concentração, até 1 minuto); quem estiver sob ela ao aparecer faz teste de resistência de Constituição e, se falhar, sofre 2d6 de dano trovejante e fica surdo por 5 minutos. A cada turno seu em que mantiver a concentração, o efeito muda: no 2º turno, chuva ácida causa 1d6 de dano ácido a criaturas e objetos abaixo; no 3º, você lança seis raios em alvos diferentes, que fazem teste de Destreza contra 10d6 de dano elétrico (metade se passarem); no 4º, granizo causa 2d6 de dano de concussão. Do 5º ao 10º turno, vento e chuva gelada causam 1d6 de dano de frio por turno, deixam a área como terreno difícil e densamente obscurecida, impedem ataques à distância com armas, dificultam manter concentração e dissipam névoas. (Simplificação: a nuvem pega todos os inimigos do mapa; o vento e a chuva gelada dos últimos turnos não existem no jogo.)",
  "tom": 0
 },
 "raioSolar": {
  "id": "raioSolar",
  "name": "Raio Solar",
  "nomeOriginal": "Sunbeam",
  "level": 6,
  "school": "evocação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "druida",
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "save": "con",
  "shape": "linha",
  "areaFt": 60,
  "larguraFt": 5,
  "damage": "6d8",
  "damageType": "radiante",
  "halfOnSave": true,
  "onFail": {
   "condition": "cego",
   "rounds": 1
  },
  "desc": "Uma linha de luz de 1,5 m de largura e 18 m de comprimento parte da sua mão, e cada criatura nela faz um teste de resistência de Constituição (mortos-vivos e limos com desvantagem): na falha sofre 6d8 de dano radiante e fica cega até o seu próximo turno; no sucesso sofre metade e não fica cega. Enquanto mantiver a concentração (até 1 minuto), você pode usar sua ação em cada turno para disparar uma nova linha. Durante a magia, um ponto brilhante na sua mão emite luz solar plena em 9 m e penumbra por mais 9 m. (Simplificação: sai uma linha só; as linhas novas a cada turno e a luz do sol na mão não existem no jogo.)",
  "tom": 0
 },
 "explosaoSolar": {
  "id": "explosaoSolar",
  "name": "Explosão Solar",
  "nomeOriginal": "Sunburst",
  "level": 8,
  "school": "evocação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 150,
  "classes": [
   "druida",
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "save": "con",
  "shape": "sphere",
  "areaFt": 60,
  "damage": "12d6",
  "damageType": "radiante",
  "halfOnSave": true,
  "onFail": {
   "condition": "cego",
   "rounds": 10,
   "repete": true
  },
  "desc": "Escolha um ponto a até 45 m: uma luz solar intensa irrompe num raio de 18 m, e cada criatura ali faz um teste de resistência de Constituição (mortos-vivos e limos com desvantagem). Quem falha sofre 12d6 de dano radiante e fica cego por 1 minuto; quem passa sofre metade e não fica cego. A criatura cega repete o teste de Constituição ao fim de cada turno, encerrando a cegueira ao passar. A magia também dissipa qualquer escuridão mágica na área; efeito instantâneo, sem concentração.",
  "tom": 3
 },
 "aljavaVeloz": {
  "id": "aljavaVeloz",
  "name": "Aljava Veloz",
  "nomeOriginal": "Swift Quiver",
  "level": 5,
  "school": "transmutação",
  "fonte": "phb",
  "castTime": "bonus",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "patrulheiro"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "aljavaVeloz",
  "desc": "Com uma ação bônus, você toca sua aljava e a encanta para fornecer munição não mágica sem fim, por até 1 minuto (concentração). Em cada um dos seus turnos enquanto durar, uma ação bônus permite fazer dois ataques com uma arma que use a munição dessa aljava, e cada projétil disparado é reposto na hora. A munição criada se desfaz quando a magia termina, e ela acaba antes se a aljava sair da sua posse.",
  "tom": 2
 },
 "telecinesia": {
  "id": "telecinesia",
  "name": "Telecinésia",
  "nomeOriginal": "Telekinesis",
  "level": 5,
  "school": "transmutação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "feiticeiro",
   "mago"
  ],
  "kind": "livro",
  "efeito": "telecinese",
  "alvo": "criatura",
  "desc": "Por até 10 minutos (concentração), ao conjurar e depois com sua ação a cada rodada, você move com a mente uma criatura ou objeto visível a até 18 m, podendo trocar de alvo quando quiser (o anterior é liberado). Contra uma criatura Enorme ou menor, faça um teste com seu atributo de conjuração contra um teste de Força dela; se vencer, desloca-a até 9 m em qualquer direção, inclusive para o alto, dentro do alcance, e ela fica contida e suspensa até o fim do seu próximo turno, sendo necessário repetir a disputa para mantê-la presa. Objetos de até 500 kg que ninguém esteja segurando ou vestindo se movem até 9 m sem teste; se estiverem com alguém, é preciso vencer a mesma disputa para arrancá-los. Você também pode fazer manipulações delicadas, como abrir portas ou recipientes, usar ferramentas simples, guardar ou pegar itens e despejar frascos. (Simplificação: ergue e joga uma vez; segurar de novo a cada turno e mover objetos não existem no jogo.)",
  "tom": 0
 },
 "telepatia": {
  "id": "telepatia",
  "name": "Telepatia",
  "nomeOriginal": "Telepathy",
  "level": 8,
  "school": "evocação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 1000,
  "duracaoRodadas": 14400,
  "classes": [
   "mago"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "soFora": true,
  "desc": "Estabelece um elo mental com uma criatura voluntária que você conheça, não importa a distância, desde que ambos estejam no mesmo plano de existência; se um de vocês mudar de plano, a magia termina. Por 24 horas, sem exigir concentração, vocês trocam na hora palavras, imagens, sons e outras sensações, e o alvo sabe que é você do outro lado. Qualquer criatura com Inteligência 1 ou mais entende o sentido do que você transmite, mesmo sem falar a sua língua. (Só fora de combate.)",
  "tom": 7
 },
 "teletransporte": {
  "id": "teletransporte",
  "name": "Teletransporte",
  "nomeOriginal": "Teleport",
  "level": 7,
  "school": "conjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 10,
  "classes": [
   "bardo",
   "feiticeiro",
   "mago"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "soFora": true,
  "desc": "Leva você e até oito criaturas voluntárias que você veja a até 3 m, ou um único objeto que caiba num cubo de 3 m e não esteja com alguém relutante, a um destino conhecido no mesmo plano, sem limite de distância. O mestre rola d100 conforme sua familiaridade com o local: círculo permanente ou objeto vindo de lá nos últimos seis meses garantem o acerto, enquanto locais pouco vistos, apenas descritos ou inexistentes aumentam a chance de falha. Errar o alvo deixa o grupo a uma distância aleatória (1d10 × 1d10 % do trajeto) em direção aleatória, e área similar o leva a outro lugar parecido. Num acidente, cada alvo sofre 3d10 de dano energético e a tabela é rolada de novo, podendo se repetir. (No jogo, conjura-se na tela da região.)",
  "tom": -5
 },
 "pararOTempo": {
  "id": "pararOTempo",
  "name": "Parar o Tempo",
  "nomeOriginal": "Time Stop",
  "level": 9,
  "school": "transmutação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 0,
  "classes": [
   "feiticeiro",
   "mago"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "tempoParado",
  "desc": "Magia de 9º círculo, apenas componente verbal: o tempo congela para todos menos você, e você joga 1d4 + 1 turnos seguidos, agindo e se deslocando normalmente. O efeito acaba na hora se alguma ação sua, ou algo que você criar nesse intervalo, atingir outra criatura ou um objeto vestido ou carregado por outra pessoa. Também termina se você se afastar mais de 300 m do ponto onde a conjurou.",
  "tom": 2
 },
 "transportePelasPlantas": {
  "id": "transportePelasPlantas",
  "name": "Transporte pelas Plantas",
  "nomeOriginal": "Transport via Plants",
  "level": 6,
  "school": "conjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 10,
  "duracaoRodadas": 1,
  "classes": [
   "druida"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "soFora": true,
  "desc": "Você liga magicamente uma planta inanimada de tamanho Grande ou maior, a até 3 m de você, a outra planta no mesmo plano de existência, sem limite de distância. É preciso já ter visto ou tocado a planta de destino pelo menos uma vez. Até o fim da rodada seguinte, qualquer criatura pode gastar 1,5 m de movimento para entrar na primeira planta e sair pela outra. Não exige concentração. (No jogo, conjura-se na tela da região.)",
  "tom": -3
 },
 "caminharEmArvores": {
  "id": "caminharEmArvores",
  "name": "Caminhar em Árvores",
  "nomeOriginal": "Tree Stride",
  "level": 5,
  "school": "conjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "druida",
   "patrulheiro"
  ],
  "kind": "livro",
  "efeito": "caminharEmArvores",
  "familiaSonora": "utilidade",
  "desc": "Por até 1 minuto (concentração), você pode gastar 1,5 m de deslocamento para entrar em uma árvore viva do seu tamanho ou maior e sair por outra da mesma espécie a até 150 m, cuja localização você conhece de imediato. Ao chegar, você surge a até 1,5 m da árvore de destino gastando mais 1,5 m de deslocamento; sem deslocamento restante, reaparece junto à árvore de origem. O salto pode ser feito uma vez por rodada, e você precisa terminar cada turno fora de uma árvore. (Simplificação: a travessia é a ação Atravessar a árvore, uma vez por rodada, nas árvores do mapa; a espécie e o tamanho da árvore não contam.)",
  "tom": 0
 },
 "metamorfoseVerdadeira": {
  "id": "metamorfoseVerdadeira",
  "name": "Metamorfose Verdadeira",
  "nomeOriginal": "True Polymorph",
  "level": 9,
  "school": "transmutação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 30,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "bardo",
   "bruxo",
   "mago"
  ],
  "kind": "livro",
  "efeito": "metamorfose",
  "alvo": "criatura",
  "desc": "Escolha uma criatura ou um objeto não mágico que você veja a até 9 m. Você pode transformar criatura em outra criatura de ND igual ou menor (ou nível, se ela não tiver ND), criatura em objeto de tamanho igual ou menor, ou objeto não carregado em criatura de ND 9 ou menor e tamanho não maior que o dele. Alvos relutantes resistem com um teste de resistência de Sabedoria, e metamorfos e criaturas com 0 PV são imunes. Como criatura, o alvo usa as estatísticas e os PV da nova forma, mantém tendência e personalidade, e o dano excedente passa para a forma original. Uma criatura vinda de objeto é amigável e age sob seu comando. Dura até 1 hora (concentração) ou até a nova forma cair a 0 PV, e torna-se permanente até ser dissipada se você mantiver a concentração pela duração inteira, caso em que você perde o controle de criaturas criadas. (Simplificação: o inimigo vira rã e o aliado, fera; virar objeto, ou outra criatura qualquer, não existe no jogo.)",
  "tom": -3
 },
 "ressurreicaoVerdadeira": {
  "id": "ressurreicaoVerdadeira",
  "name": "Ressurreição Verdadeira",
  "nomeOriginal": "True Resurrection",
  "level": 9,
  "school": "necromancia",
  "fonte": "phb",
  "castTime": "action",
  "minutos": 60,
  "soFora": true,
  "rangeFt": 5,
  "classes": [
   "clerigo",
   "druida"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "desc": "Ao toque, traz de volta com todos os PV uma criatura morta há até 200 anos por qualquer causa que não a velhice, desde que sua alma esteja livre e aceite retornar. A criatura volta curada de ferimentos, venenos, doenças e maldições, com órgãos e membros perdidos refeitos, e deixa de ser morta-viva se tiver se tornado uma. Se o corpo não existir mais, basta dizer o nome da criatura para que ela surja num corpo novo, num espaço livre a até 3 m de você. Exige água benta e diamantes de pelo menos 25.000 po, consumidos pela magia. (Só fora de combate.)",
  "tom": -3
 },
 "visaoDaVerdade": {
  "id": "visaoDaVerdade",
  "name": "Visão da Verdade",
  "nomeOriginal": "True Seeing",
  "level": 6,
  "school": "adivinhação",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 5,
  "duracaoRodadas": 600,
  "classes": [
   "bardo",
   "clerigo",
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "visaoVerdadeira",
  "desc": "Uma criatura voluntária que você toca ganha visão verdadeira até 36 m por 1 hora, sem exigir concentração. Nesse alcance, ela também percebe portas secretas ocultas por magia e enxerga o Plano Etéreo. Requer um unguento para os olhos de 25 po (pó de cogumelo, açafrão e gordura), consumido ao conjurar.",
  "tom": 4
 },
 "sinistro": {
  "id": "sinistro",
  "name": "Sinistro",
  "nomeOriginal": "Weird",
  "level": 9,
  "school": "ilusão",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 120,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "mago"
  ],
  "kind": "save",
  "save": "wis",
  "shape": "sphere",
  "areaFt": 30,
  "onFail": {
   "condition": "amedrontado",
   "rounds": 10,
   "repete": true,
   "danoAoFalhar": {
    "dano": "4d10",
    "tipo": "psíquico"
   }
  },
  "desc": "Escolha um ponto a até 36 m: cada criatura numa esfera de 9 m de raio ao redor dele faz um teste de resistência de Sabedoria e, se falhar, fica amedrontada por visões ilusórias dos próprios pesadelos, que só ela enxerga. Ao fim de cada turno, a criatura amedrontada repete o teste de Sabedoria: se falhar, sofre 4d10 de dano psíquico; se passar, a magia termina para ela. Dura até 1 minuto, com concentração.",
  "tom": -5
 },
 "caminharNoVento": {
  "id": "caminharNoVento",
  "name": "Caminhar no Vento",
  "nomeOriginal": "Wind Walk",
  "level": 6,
  "school": "transmutação",
  "fonte": "phb",
  "castTime": "action",
  "minutos": 1,
  "soFora": true,
  "rangeFt": 30,
  "duracaoRodadas": 4800,
  "classes": [
   "druida"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "desc": "Você e até dez criaturas voluntárias visíveis a até 9 m viram nuvens gasosas por 8 horas, sem concentração, ganhando deslocamento de voo de 90 m e resistência a dano de armas não mágicas. Nessa forma, só podem usar a ação Disparada ou voltar ao normal; a transformação, em qualquer sentido, leva 1 minuto, durante o qual a criatura fica incapacitada e imóvel. Se a magia acabar enquanto alguém voa como nuvem, ele desce 18 m por rodada com segurança por até 1 minuto e, se ainda não tiver pousado, cai o restante da altura. (No jogo, conjura-se na tela da região.)",
  "tom": -3
 },
 "desejo": {
  "id": "desejo",
  "name": "Desejo",
  "nomeOriginal": "Wish",
  "level": 9,
  "school": "conjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 0,
  "classes": [
   "feiticeiro",
   "mago"
  ],
  "kind": "livro",
  "efeito": "desejo",
  "familiaSonora": "utilidade",
  "opcoes": [
   {
    "id": "cura",
    "rotulo": "Curar o grupo",
    "detalhe": "até vinte aliados à vista: todos os PV e o que a Restauração Maior tira"
   },
   {
    "id": "res:ácido",
    "rotulo": "Resistência a ácido",
    "detalhe": "até dez aliados à vista, para sempre"
   },
   {
    "id": "res:concussão",
    "rotulo": "Resistência a concussão",
    "detalhe": "até dez aliados à vista, para sempre"
   },
   {
    "id": "res:cortante",
    "rotulo": "Resistência a cortante",
    "detalhe": "até dez aliados à vista, para sempre"
   },
   {
    "id": "res:elétrico",
    "rotulo": "Resistência a elétrico",
    "detalhe": "até dez aliados à vista, para sempre"
   },
   {
    "id": "res:energético",
    "rotulo": "Resistência a energético",
    "detalhe": "até dez aliados à vista, para sempre"
   },
   {
    "id": "res:fogo",
    "rotulo": "Resistência a fogo",
    "detalhe": "até dez aliados à vista, para sempre"
   },
   {
    "id": "res:frio",
    "rotulo": "Resistência a frio",
    "detalhe": "até dez aliados à vista, para sempre"
   },
   {
    "id": "res:necrótico",
    "rotulo": "Resistência a necrótico",
    "detalhe": "até dez aliados à vista, para sempre"
   },
   {
    "id": "res:perfurante",
    "rotulo": "Resistência a perfurante",
    "detalhe": "até dez aliados à vista, para sempre"
   },
   {
    "id": "res:psíquico",
    "rotulo": "Resistência a psíquico",
    "detalhe": "até dez aliados à vista, para sempre"
   },
   {
    "id": "res:radiante",
    "rotulo": "Resistência a radiante",
    "detalhe": "até dez aliados à vista, para sempre"
   },
   {
    "id": "res:trovejante",
    "rotulo": "Resistência a trovejante",
    "detalhe": "até dez aliados à vista, para sempre"
   },
   {
    "id": "res:veneno",
    "rotulo": "Resistência a veneno",
    "detalhe": "até dez aliados à vista, para sempre"
   }
  ],
  "desc": "Com uma única palavra, você reproduz qualquer magia de 8º círculo ou menor sem precisar de componentes caros nem cumprir requisitos. Em vez disso, pode escolher um efeito maior: criar um objeto não mágico de até 25.000 po (no máximo 90 m em qualquer dimensão), curar todos os PV de até vinte criaturas visíveis e remover delas o que Restauração Maior removeria, dar a até dez criaturas resistência a um tipo de dano ou imunidade a uma magia ou efeito mágico por 8 horas, ou obrigar a rolar de novo qualquer jogada feita na última rodada, com vantagem ou desvantagem, ficando com o resultado que preferir. Pedidos além disso ficam a critério do Mestre e, quanto mais ambiciosos, maior a chance de falhar, sair pela metade ou trazer consequências inesperadas. Usar qualquer efeito que não seja copiar outra magia cobra um preço: até o próximo descanso longo, cada magia que você conjurar causa a você 1d10 de dano necrótico por círculo, que não pode ser reduzido; sua Força cai para 3 por 2d4 dias (cada dia de repouso desconta 2 dias); e há 33% de chance de você nunca mais conseguir conjurar Desejo. (Simplificação: só a cura do grupo e a resistência a um tipo de dano. Duplicar outra magia, criar um objeto, a imunidade a uma magia e desfazer uma jogada não existem no jogo. O desgaste vale: 1d10 necrótico por círculo de cada magia até o descanso longo, e um terço de chance de nunca mais conjurar o Desejo; a Força 3 por dias não existe.)",
  "tom": -3
 },
 "palavraDeRecordacao": {
  "id": "palavraDeRecordacao",
  "name": "Palavra de Recordação",
  "nomeOriginal": "Word of Recall",
  "level": 6,
  "school": "conjuração",
  "fonte": "phb",
  "castTime": "action",
  "rangeFt": 5,
  "classes": [
   "clerigo"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "soFora": true,
  "desc": "Com uma única palavra, você e até cinco criaturas voluntárias a até 1,5 m são teleportados na hora para o santuário que você marcou antes, surgindo no espaço livre mais próximo do ponto escolhido. Para marcar esse santuário, é preciso conjurar a magia em um local consagrado ou fortemente ligado à sua divindade, como um templo. Fora de um lugar assim, a tentativa de marcar falha, e conjurar sem ter um santuário definido também não tem efeito. O efeito é instantâneo e não exige concentração. (No jogo, conjura-se na tela da região.)",
  "tom": 12
 }
};
