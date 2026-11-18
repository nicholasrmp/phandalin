// GERADO por src/dev/importar-magias.mjs xge — não editar à mão: mude o conversor e rode de novo.
// Os números saem do dado do livro; o texto, de src/dev/magias/xge-pt.json, com as nossas palavras.
export const MAGIAS_XGE = {
 "murcharHorrendoDeAbiDalzim": {
  "id": "murcharHorrendoDeAbiDalzim",
  "name": "Murchar Horrendo de Abi-Dalzim",
  "nomeOriginal": "Abi-Dalzim's Horrid Wilting",
  "level": 8,
  "school": "necromancia",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 150,
  "classes": [
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "save": "con",
  "shape": "square",
  "areaFt": 30,
  "damage": "12d8",
  "damageType": "necrótico",
  "halfOnSave": true,
  "naoAfeta": [
   "constructo",
   "morto-vivo"
  ],
  "desc": "Escolha um ponto a até 45 m: toda criatura num cubo de 9 m centrado nele tem a umidade do corpo sugada e faz um teste de resistência de Constituição, sofrendo 12d8 de dano necrótico se falhar ou metade se passar. Mortos-vivos e constructos são imunes, enquanto plantas e elementais da água fazem o teste com desvantagem. Árvores, arbustos e outras plantas comuns que não sejam criaturas secam e morrem na hora. O efeito é instantâneo e não exige concentração.",
  "tom": 5
 },
 "absorverElementos": {
  "id": "absorverElementos",
  "name": "Absorver Elementos",
  "nomeOriginal": "Absorb Elements",
  "level": 1,
  "school": "abjuração",
  "fonte": "xge",
  "castTime": "reaction",
  "rangeFt": 0,
  "duracaoRodadas": 1,
  "classes": [
   "druida",
   "patrulheiro",
   "feiticeiro",
   "mago"
  ],
  "upcast": {
   "dados": 1
  },
  "kind": "reacao",
  "gatilho": "elemento",
  "absorveElementos": true,
  "desc": "Reação usada quando você sofre dano ácido, de frio, fogo, elétrico ou trovejante: você ganha resistência a esse tipo de dano até o início do seu próximo turno. No seu próximo turno, o primeiro ataque corpo a corpo que acertar causa 1d6 de dano extra do mesmo tipo, e a magia termina. Em círculo maior, o dano extra aumenta em 1d6 por círculo acima do 1º. (Simplificação: sai sozinha quando o golpe elemental é de 8 ou mais, ou derrubaria.)",
  "tom": -7
 },
 "abrasadorDeAganazzar": {
  "id": "abrasadorDeAganazzar",
  "name": "Abrasador de Aganazzar",
  "nomeOriginal": "Aganazzar's Scorcher",
  "level": 2,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 30,
  "classes": [
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "save": "dex",
  "shape": "linha",
  "areaFt": 30,
  "larguraFt": 5,
  "damage": "3d8",
  "damageType": "fogo",
  "halfOnSave": true,
  "upcast": {
   "dados": 1
  },
  "desc": "Você projeta uma faixa de fogo de 9 m de comprimento por 1,5 m de largura na direção que escolher. Cada criatura atingida faz um teste de resistência de Destreza: sofre 3d8 de dano de fogo se falhar ou metade se passar. O efeito é instantâneo. Em círculo 3 ou maior, o dano sobe 1d8 para cada círculo acima do 2º.",
  "tom": -4
 },
 "vinculoComBesta": {
  "id": "vinculoComBesta",
  "name": "Vínculo com Besta",
  "nomeOriginal": "Beast Bond",
  "level": 1,
  "school": "adivinhação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 5,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "druida",
   "patrulheiro"
  ],
  "kind": "livro",
  "efeito": "vinculoBestial",
  "alvo": "criatura",
  "familiaSonora": "utilidade",
  "desc": "Você toca uma besta amigável ou enfeitiçada por você e cria com ela uma ligação telepática; a magia não funciona se a Inteligência da besta for 4 ou mais. Enquanto vocês estiverem na linha de visão um do outro, a besta entende suas mensagens mentais e lhe responde com emoções e ideias simples. Durante a ligação, ela tem vantagem nas jogadas de ataque contra criaturas que você veja a até 1,5 m de você. Concentração, até 10 minutos. (Simplificação: a fera tem de ser aliada; o elo telepático que a deixa entender quem conjurou é dela, e não muda nada no tabuleiro.)",
  "tom": -7
 },
 "ossosDaTerra": {
  "id": "ossosDaTerra",
  "name": "Ossos da Terra",
  "nomeOriginal": "Bones of the Earth",
  "level": 6,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 120,
  "classes": [
   "druida"
  ],
  "kind": "livro",
  "efeito": "ossosDaTerra",
  "mira": "casa",
  "pontosLivres": 6,
  "familiaSonora": "utilidade",
  "desc": "Até seis pilares de pedra (1,5 m de diâmetro, até 9 m de altura, CA 5 e 30 PV) brotam do chão em pontos visíveis a até 36 m; ao serem destruídos, viram entulho que forma terreno difícil num raio de 3 m. Uma criatura Média ou menor sob um pilar faz teste de resistência de Destreza (pode falhar de propósito) e, se falhar, é erguida por ele. Se o teto ou outro obstáculo impedir o pilar de crescer, quem estiver em cima sofre 6d6 de dano de concussão e fica contido, podendo usar uma ação para um teste de Força ou Destreza contra a CD da magia para se soltar e sair ou cair do pilar. Em círculo 7 ou maior, surgem dois pilares a mais por círculo acima do 6º. (Simplificação: os pilares nascem só em chão livre: o que ergue quem está em cima e o que esmaga no teto não existem no jogo, e os pilares não se quebram. No círculo maior, os dois pilares a mais não existem.)",
  "tom": -7
 },
 "catapulta": {
  "id": "catapulta",
  "name": "Catapulta",
  "nomeOriginal": "Catapult",
  "level": 1,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 60,
  "classes": [
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "save": "dex",
  "damage": "3d8",
  "damageType": "concussão",
  "halfOnSave": false,
  "upcast": {
   "dados": 1
  },
  "desc": "Você arremessa um objeto solto de 0,5 a 2,5 kg a até 18 m de você, que voa em linha reta por até 27 m na direção escolhida e para antes se bater numa superfície sólida. Uma criatura no caminho faz um teste de resistência de Destreza; se falhar, é atingida e o objeto para ali. Ao acertar algo, tanto o objeto quanto o que ele atingiu sofrem 3d8 de dano de concussão. Em círculo maior, cada círculo acima do 1º aumenta o peso máximo em 2,5 kg e o dano em 1d8. (Simplificação: há sempre uma pedra à mão para arremessar.)",
  "tom": 5
 },
 "cochilo": {
  "id": "cochilo",
  "name": "Cochilo",
  "nomeOriginal": "Catnap",
  "level": 3,
  "school": "encantamento",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 30,
  "duracaoRodadas": 100,
  "classes": [
   "bardo",
   "feiticeiro",
   "mago"
  ],
  "kind": "utilidade",
  "utilidade": true,
  "soFora": true,
  "desc": "Até três criaturas voluntárias que você veja a até 9 m ficam inconscientes por 10 minutos, sem exigir concentração. O efeito acaba mais cedo para quem sofrer dano ou for acordado por alguém que gaste uma ação para sacudi-lo. Quem dormir a duração inteira recebe os benefícios de um descanso curto e não pode ser afetado de novo por esta magia até terminar um descanso longo. Em círculo 4 ou maior, afeta uma criatura voluntária extra por círculo acima do 3º. (Só fora de combate.)",
  "tom": 9
 },
 "causarMedo": {
  "id": "causarMedo",
  "name": "Causar Medo",
  "nomeOriginal": "Cause Fear",
  "level": 1,
  "school": "necromancia",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "bruxo",
   "mago"
  ],
  "upcast": {
   "alvos": 1
  },
  "kind": "save",
  "save": "wis",
  "onFail": {
   "condition": "amedrontado",
   "rounds": 10,
   "repete": true
  },
  "naoAfeta": [
   "constructo",
   "morto-vivo"
  ],
  "desc": "Escolha uma criatura visível a até 18 m; constructos e mortos-vivos não são afetados. O alvo faz um teste de resistência de Sabedoria e, se falhar, fica amedrontado por você por até 1 minuto (concentração), podendo repetir o teste ao fim de cada turno dele para se livrar do efeito. Em círculo 2 ou maior, afeta uma criatura extra por círculo acima do 1º, desde que todas estejam a até 9 m umas das outras. (Simplificação: um alvo só; as criaturas a mais do círculo maior não existem no jogo.)",
  "tom": -7
 },
 "raioDoCaos": {
  "id": "raioDoCaos",
  "name": "Raio do Caos",
  "nomeOriginal": "Chaos Bolt",
  "level": 1,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 120,
  "classes": [
   "feiticeiro"
  ],
  "kind": "livro",
  "efeito": "raioDoCaos",
  "alvo": "criatura",
  "damageType": "energético",
  "desc": "Faça um ataque mágico à distância contra uma criatura a até 36 m; se acertar, ela sofre 2d8 + 1d6 de dano, cujo tipo é definido por um dos d8 à sua escolha (1 ácido, 2 frio, 3 fogo, 4 energético, 5 elétrico, 6 veneno, 7 psíquico, 8 trovejante). Se os dois d8 mostrarem o mesmo número, a energia salta para outra criatura escolhida a até 9 m do alvo, com novo ataque e nova rolagem de dano, podendo saltar de novo. Cada criatura só pode ser atingida uma vez por conjuração. Em círculo maior, cada alvo sofre +1d6 de dano por círculo acima do 1º.",
  "tom": -4
 },
 "enfeiticarMonstro": {
  "id": "enfeiticarMonstro",
  "name": "Enfeitiçar Monstro",
  "nomeOriginal": "Charm Monster",
  "level": 4,
  "school": "encantamento",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 30,
  "duracaoRodadas": 600,
  "classes": [
   "bardo",
   "druida",
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "debuff",
  "targets": 1,
  "save": "wis",
  "condition": "enfeiticado",
  "vantagemEmCombate": true,
  "upcast": {
   "alvos": 1
  },
  "desc": "Uma criatura visível a até 9 m faz um teste de resistência de Sabedoria contra a sua CD de SAB, com vantagem se você ou seus aliados estiverem lutando contra ela. Se falhar, fica enfeitiçada e amistosa com você por 1 hora (sem concentração), mas o efeito termina se você ou seus companheiros a prejudicarem de qualquer forma. Quando a magia acaba, a criatura sabe que foi enfeitiçada por você. Em círculo 5 ou maior, afeta uma criatura extra por círculo acima do 4º, desde que todas estejam a até 9 m umas das outras.",
  "tom": -7
 },
 "controlarChamas": {
  "id": "controlarChamas",
  "name": "Controlar Chamas",
  "nomeOriginal": "Control Flames",
  "level": 0,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 60,
  "classes": [
   "druida",
   "feiticeiro",
   "mago"
  ],
  "kind": "livro",
  "efeito": "controlarChamas",
  "mira": "casa",
  "exigeChama": true,
  "familiaSonora": "utilidade",
  "opcoes": [
   {
    "id": "apagar",
    "rotulo": "Apagar",
    "detalhe": "a chama some"
   },
   {
    "id": "dobrar",
    "rotulo": "Dobrar a luz",
    "detalhe": "o claro e a penumbra"
   },
   {
    "id": "metade",
    "rotulo": "Cortar a luz pela metade",
    "detalhe": "o claro e a penumbra"
   }
  ],
  "desc": "Truque de transmutação: escolha uma chama não mágica visível a até 18 m que caiba num cubo de 1,5 m. Você pode espalhá-la 1,5 m numa direção onde haja combustível, apagá-la na hora, dobrar ou reduzir à metade a luz que ela emite e/ou mudar sua cor, ou fazer surgir nela formas simples que se movem como você quiser. A alteração de luz e as formas duram 1 hora, com até três desses efeitos ativos ao mesmo tempo, e você pode encerrar um deles com uma ação. (Simplificação: vale para a chama do mapa (a tocha, o braseiro, a fogueira). Espalhar o fogo e dar forma às chamas não existem no jogo, e a luz mudada fica até o fim da cena.)",
  "tom": -7
 },
 "controlarVentos": {
  "id": "controlarVentos",
  "name": "Controlar Ventos",
  "nomeOriginal": "Control Winds",
  "level": 5,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 300,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "druida",
   "feiticeiro",
   "mago"
  ],
  "kind": "livro",
  "efeito": "controlarVentos",
  "shape": "square",
  "areaFt": 100,
  "familiaSonora": "utilidade",
  "opcoes": [
   {
    "id": "rajadas",
    "rotulo": "Rajadas",
    "detalhe": "desvantagem na arma à distância pelo cubo"
   },
   {
    "id": "descendente",
    "rotulo": "Corrente descendente",
    "detalhe": "a mesma desvantagem, e quem voa cai"
   },
   {
    "id": "ascendente",
    "rotulo": "Corrente ascendente",
    "detalhe": "a queda dentro dela fere a metade"
   }
  ],
  "desc": "Você domina o ar de um cubo de 30 m visível a até 90 m e escolhe um modo, podendo trocá-lo, pausá-lo ou retomá-lo com sua ação; dura até 1 hora (concentração). Rajadas: vento horizontal na direção escolhida, calmo, moderado ou forte; moderado ou forte impõe desvantagem a ataques com armas à distância que cruzem o cubo ou mirem alvos nele, e forte transforma o avanço contra o vento em terreno difícil. Corrente descendente: impõe a mesma desvantagem aos ataques à distância, e quem voa para dentro do cubo pela primeira vez no turno ou começa o turno voando nele faz teste de resistência de Força ou fica caído. Corrente ascendente: quedas que terminam no cubo causam metade do dano e saltos verticais ali alcançam até 3 m a mais. (Simplificação: as rajadas são sempre as fortes, e o deslocamento dobrado contra o vento não existe no jogo (o motor não tem terreno de uma direção só); o pulo mais alto da corrente ascendente também não.)",
  "tom": 0
 },
 "criarFogueira": {
  "id": "criarFogueira",
  "name": "Criar Fogueira",
  "nomeOriginal": "Create Bonfire",
  "level": 0,
  "school": "conjuração",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "druida",
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "save",
  "save": "dex",
  "shape": "square",
  "areaFt": 5,
  "damage": "1d8",
  "damageType": "fogo",
  "halfOnSave": false,
  "zona": {
   "rodadas": 10,
   "quando": "fim",
   "aoEntrar": true,
   "dificil": false,
   "semTeste": true,
   "dano": {
    "dados": "1d8",
    "tipo": "fogo",
    "save": "dex",
    "metade": false
   }
  },
  "desc": "Truque de conjuração: surge uma fogueira mágica num cubo de 1,5 m em um ponto do chão visível a até 18 m, que dura até 1 minuto (concentração). Quem estiver no espaço ao conjurar, entrar nele pela primeira vez no turno ou terminar o turno ali faz teste de resistência de Destreza contra a CD da magia e, se falhar, sofre 1d8 de dano de fogo. As chamas incendeiam objetos inflamáveis na área que ninguém esteja vestindo ou carregando. O dano sobe para 2d8 no 5º nível do personagem, 3d8 no 11º e 4d8 no 17º.",
  "tom": -4
 },
 "coroaDeEstrelas": {
  "id": "coroaDeEstrelas",
  "name": "Coroa de Estrelas",
  "nomeOriginal": "Crown of Stars",
  "level": 7,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 0,
  "duracaoRodadas": 600,
  "classes": [
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "livro",
  "efeito": "conceder",
  "soSi": true,
  "condicao": "coroaDeEstrelas",
  "damageType": "radiante",
  "cargas": 7,
  "cargasPorCirculo": 2,
  "desc": "Sete pontos de luz semelhantes a estrelas giram ao redor da sua cabeça por até 1 hora, sem exigir concentração. Com uma ação bônus, você lança um deles contra uma criatura ou objeto a até 36 m e faz um ataque mágico à distância, causando 4d12 de dano radiante se acertar; o ponto se gasta mesmo que você erre, e a magia acaba quando o último for usado. Com quatro ou mais pontos restantes, eles emitem luz plena em 9 m e penumbra por mais 9 m; com um a três, apenas penumbra em 9 m. Em círculo 8 ou maior, surgem dois pontos extras por círculo acima do 7º.",
  "tom": -4
 },
 "dancaMacabra": {
  "id": "dancaMacabra",
  "name": "Dança Macabra",
  "nomeOriginal": "Danse Macabre",
  "level": 5,
  "school": "necromancia",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "bruxo",
   "mago"
  ],
  "kind": "animarMortos",
  "corposBase": 5,
  "upcast": {
   "criaturas": 2
  },
  "opcoes": [
   {
    "id": "esqueleto",
    "rotulo": "Esqueleto",
    "detalhe": "CA 13, 13 PV; espada curta ou arco curto"
   },
   {
    "id": "zumbi",
    "rotulo": "Zumbi",
    "detalhe": "CA 8, 22 PV; volta com 1 PV ao cair"
   }
  ],
  "desc": "Até cinco cadáveres Pequenos ou Médios que você veja a até 18 m se erguem como zumbis ou esqueletos, à sua escolha, somando o seu modificador de conjuração às jogadas de ataque e de dano. Com uma ação bônus, você dá a mesma ordem mental a todos os que estiverem a até 18 m, seja uma ação e um deslocamento para o próximo turno ou uma tarefa geral como vigiar um local; sem ordens, eles apenas se defendem. Os mortos-vivos obedecem enquanto durar a concentração, por até 1 hora, e depois voltam a ser cadáveres. Em círculo maior que o 5º, anima dois cadáveres a mais por círculo acima do 5º. (Simplificação: os mortos erguidos não somam o atributo de conjuração no ataque e no dano.)",
  "tom": -7
 },
 "alvorada": {
  "id": "alvorada",
  "name": "Alvorada",
  "nomeOriginal": "Dawn",
  "level": 5,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "clerigo",
   "mago"
  ],
  "kind": "save",
  "save": "con",
  "shape": "sphere",
  "areaFt": 30,
  "damage": "4d10",
  "damageType": "radiante",
  "halfOnSave": true,
  "reuso": "bonus",
  "zona": {
   "rodadas": 10,
   "quando": "fim",
   "aoEntrar": false,
   "dificil": false,
   "semTeste": true,
   "movel": 60,
   "dano": {
    "dados": "4d10",
    "tipo": "radiante",
    "save": "con",
    "metade": true
   }
  },
  "desc": "Um cilindro de luz solar intensa, com 9 m de raio e 12 m de altura, surge num ponto a até 18 m e dura até 1 minuto (concentração). Quem estiver na área quando ela aparece, ou terminar o turno dentro dela, faz um teste de resistência de Constituição e sofre 4d10 de dano radiante se falhar, ou metade se passar. Com uma ação bônus, estando a até 18 m do cilindro, você pode deslocá-lo até 18 m. Exige um pingente em forma de sol de pelo menos 100 po.",
  "tom": 5
 },
 "soproDoDragao": {
  "id": "soproDoDragao",
  "name": "Sopro do Dragão",
  "nomeOriginal": "Dragon's Breath",
  "level": 2,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "bonus",
  "rangeFt": 5,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "feiticeiro",
   "mago"
  ],
  "upcast": {
   "dados": 1
  },
  "kind": "livro",
  "efeito": "conceder",
  "alvo": "criatura",
  "condicao": "soproDraconico",
  "familiaSonora": "reforco",
  "opcoes": [
   {
    "id": "ácido",
    "rotulo": "Ácido"
   },
   {
    "id": "frio",
    "rotulo": "Frio"
   },
   {
    "id": "fogo",
    "rotulo": "Fogo"
   },
   {
    "id": "elétrico",
    "rotulo": "Elétrico"
   },
   {
    "id": "veneno",
    "rotulo": "Veneno"
   }
  ],
  "tipoNaOpcao": true,
  "danoConcedido": "3d6",
  "cdNaCondicao": true,
  "desc": "Com uma ação bônus, você toca uma criatura voluntária que tenha boca e escolhe ácido, frio, fogo, elétrico ou veneno; enquanto durar a concentração (até 1 minuto), ela pode usar a ação dela para soprar essa energia em um cone de 4,5 m. Quem estiver no cone faz um teste de resistência de Destreza contra a sua CD, sofrendo 3d6 de dano do tipo escolhido se falhar, ou metade se passar. Em círculo 3 ou maior, o dano aumenta em 1d6 para cada círculo acima do 2º.",
  "tom": -7
 },
 "redemoinhoDePoeira": {
  "id": "redemoinhoDePoeira",
  "name": "Redemoinho de Poeira",
  "nomeOriginal": "Dust Devil",
  "level": 2,
  "school": "conjuração",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "druida",
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "save": "str",
  "shape": "sphere",
  "areaFt": 5,
  "emVoltaDaCasa": true,
  "soZona": true,
  "reuso": "bonus",
  "zona": {
   "rodadas": 10,
   "quando": "fim",
   "aoEntrar": false,
   "dificil": false,
   "semTeste": true,
   "movel": 30,
   "ocupaCasa": true,
   "dano": {
    "dados": "1d8",
    "tipo": "concussão",
    "save": "str",
    "metade": true
   }
  },
  "upcast": {
   "dados": 1
  },
  "desc": "Você cria um redemoinho elemental num cubo de ar vazio de 1,5 m que consiga ver a até 18 m, que dura até 1 minuto (concentração). Quem terminar o turno a até 1,5 m dele faz um teste de resistência de Força: se falhar, sofre 1d8 de dano de concussão e é empurrado 3 m para longe; se passar, sofre metade e fica no lugar. Com uma ação bônus, você desloca o redemoinho até 9 m; se ele passar sobre areia, poeira, terra solta ou cascalho fino, forma ao redor uma nuvem de detritos de 3 m de raio que deixa a área densamente obscurecida até o início do seu próximo turno. Em círculos acima do 2º, o dano aumenta em 1d8 por círculo. (Simplificação: o redemoinho fere quem termina o turno colado nele; o empurrão de 3 m e a poeira que obscurece não existem no jogo.)",
  "tom": 5
 },
 "tremorDeTerra": {
  "id": "tremorDeTerra",
  "name": "Tremor de Terra",
  "nomeOriginal": "Earth Tremor",
  "level": 1,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 10,
  "classes": [
   "bardo",
   "druida",
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "save": "dex",
  "shape": "sphere",
  "areaFt": 10,
  "centradoEmSi": true,
  "damage": "1d6",
  "damageType": "concussão",
  "halfOnSave": false,
  "onFail": {
   "condition": "caido"
  },
  "upcast": {
   "dados": 1
  },
  "desc": "Você faz o chão tremer ao seu redor, afetando todas as outras criaturas a até 3 m de você, que fazem um teste de resistência de Destreza. Quem falha sofre 1d6 de dano de concussão e fica caído; quem passa não sofre nada. Se o solo da área for de terra solta ou pedra, vira terreno difícil até ser limpo, o que exige pelo menos 1 minuto de trabalho manual para cada trecho de 1,5 m de diâmetro. Efeito instantâneo; em círculo maior, o dano aumenta em 1d6 por círculo acima do 1º. (Simplificação: o chão solto que vira terreno difícil não existe no jogo.)",
  "tom": -2
 },
 "prenderATerra": {
  "id": "prenderATerra",
  "name": "Prender à Terra",
  "nomeOriginal": "Earthbind",
  "level": 2,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 300,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "druida",
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "debuff",
  "targets": 1,
  "save": "str",
  "condition": "presoATerra",
  "desc": "Uma criatura que você veja a até 90 m faz um teste de resistência de Força contra a CD da magia; se falhar, seu deslocamento de voo cai para 0 enquanto durar o efeito. Se estiver no ar, ela desce sem sofrer dano a 18 m por rodada até tocar o chão ou a magia acabar. Concentração, até 1 minuto. (Simplificação: quem voava desce na hora.)",
  "tom": -7
 },
 "ruinaElemental": {
  "id": "ruinaElemental",
  "name": "Ruína Elemental",
  "nomeOriginal": "Elemental Bane",
  "level": 4,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 90,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "druida",
   "bruxo",
   "mago"
  ],
  "upcast": {
   "alvos": 1
  },
  "kind": "livro",
  "efeito": "ruinaElemental",
  "alvo": "criatura",
  "opcoes": [
   {
    "id": "ácido",
    "rotulo": "Ácido"
   },
   {
    "id": "frio",
    "rotulo": "Frio"
   },
   {
    "id": "fogo",
    "rotulo": "Fogo"
   },
   {
    "id": "elétrico",
    "rotulo": "Elétrico"
   },
   {
    "id": "trovejante",
    "rotulo": "Trovejante"
   }
  ],
  "desc": "Escolha uma criatura visível a até 27 m e um tipo de dano entre ácido, frio, fogo, elétrico ou trovejante; ela precisa passar num teste de resistência de Constituição contra a sua CD ou fica sob o efeito por até 1 minuto (concentração). Enquanto durar, o alvo perde a resistência ao tipo escolhido, e na primeira vez em cada turno que sofrer dano desse tipo recebe 2d6 de dano adicional do mesmo tipo. Em círculo 5 ou maior, afeta uma criatura extra por círculo acima do 4º, desde que todas estejam a até 9 m umas das outras.",
  "tom": 14
 },
 "inimigosEmAbundancia": {
  "id": "inimigosEmAbundancia",
  "name": "Inimigos em Abundância",
  "nomeOriginal": "Enemies Abound",
  "level": 3,
  "school": "encantamento",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 120,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "bardo",
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "debuff",
  "targets": 1,
  "save": "int",
  "condition": "inimigosEmAbundancia",
  "desc": "Uma criatura que você veja a até 36 m faz um teste de resistência de Inteligência (CD de INT da magia); quem é imune a ficar amedrontado passa automaticamente. Se falhar, por até 1 minuto (concentração) ela passa a ver todas as criaturas visíveis como inimigas e precisa escolher ao acaso o alvo de seus ataques, magias e habilidades entre as criaturas ao alcance que consiga ver. Ela também é obrigada a fazer os ataques de oportunidade provocados por inimigos, se puder. Sempre que sofre dano, repete o teste e encerra o efeito ao passar. (Simplificação: no turno, ataca alguém sorteado que alcance, como o confuso; ao sofrer dano, testa Inteligência de novo.)",
  "tom": 14
 },
 "enervacao": {
  "id": "enervacao",
  "name": "Enervação",
  "nomeOriginal": "Enervation",
  "level": 5,
  "school": "necromancia",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "save",
  "save": "dex",
  "damage": "4d8",
  "damageType": "necrótico",
  "halfOnSave": true,
  "curaOConjurador": 0.5,
  "upcast": {
   "dados": 1
  },
  "desc": "Escolha uma criatura visível a até 18 m; ela faz um teste de resistência de Destreza contra a sua CD de magia. Se passar, sofre 2d8 de dano necrótico e a magia termina; se falhar, sofre 4d8 de dano necrótico e, enquanto durar a concentração (até 1 minuto), você pode gastar sua ação em cada turno para causar automaticamente mais 4d8 de dano necrótico a ela. Sempre que causar dano, você recupera PV iguais à metade do dano necrótico sofrido pelo alvo; o efeito acaba se você usar a ação para outra coisa, se o alvo sair do alcance ou se ficar sob cobertura total. Em círculo 6 ou maior, todos os danos aumentam em 1d8 por círculo acima do 5º. (Simplificação: o golpe é um só; o fio que repete o dano a cada turno, com a ação, não existe no jogo.)",
  "tom": 5
 },
 "erupcaoDeTerra": {
  "id": "erupcaoDeTerra",
  "name": "Erupção de Terra",
  "nomeOriginal": "Erupting Earth",
  "level": 3,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 120,
  "classes": [
   "druida",
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "save": "dex",
  "shape": "square",
  "areaFt": 20,
  "damage": "3d12",
  "damageType": "concussão",
  "halfOnSave": true,
  "upcast": {
   "dados": 1
  },
  "zona": {
   "rodadas": 600,
   "quando": "nunca",
   "aoEntrar": false,
   "dificil": true,
   "semTeste": true
  },
  "desc": "Escolha um ponto visível no chão a até 36 m; terra e pedras explodem num cubo de 6 m centrado nele. Quem estiver na área faz um teste de resistência de Destreza, sofrendo 3d12 de dano de concussão se falhar ou metade se passar. O solo da área vira terreno difícil até ser limpo, o que leva pelo menos 1 minuto de trabalho manual por quadrado de 1,5 m. Em círculo maior que o 3º, o dano aumenta em 1d12 por círculo acima.",
  "tom": -4
 },
 "passoDistante": {
  "id": "passoDistante",
  "name": "Passo Distante",
  "nomeOriginal": "Far Step",
  "level": 5,
  "school": "conjuração",
  "fonte": "xge",
  "castTime": "bonus",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "teleporte",
  "mira": "casa",
  "reuso": "bonus",
  "desc": "Com uma ação bônus, você se teletransporta até 18 m para um espaço desocupado que consiga ver. Enquanto mantiver a concentração, por até 1 minuto, pode repetir o salto em cada um dos seus turnos gastando uma ação bônus. A magia exige apenas componente verbal.",
  "tom": 14
 },
 "flechasFlamejantes": {
  "id": "flechasFlamejantes",
  "name": "Flechas Flamejantes",
  "nomeOriginal": "Flame Arrows",
  "level": 3,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 5,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "druida",
   "patrulheiro",
   "feiticeiro",
   "mago"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "flechasFlamejantes",
  "desc": "Ao tocar uma aljava com flechas ou virotes, você encanta a munição dela: cada ataque à distância que acertar com um projétil tirado dali causa 1d6 de dano de fogo adicional. Cada projétil perde o efeito depois de usado, acerte ou erre, e a magia termina quando doze projéteis tiverem sido retirados ou após 1 hora (concentração). Em círculo maior, a aljava encanta dois projéteis a mais por círculo acima do 3º. (Simplificação: são sempre 12 disparos; as peças a mais do círculo maior não existem no jogo.)",
  "tom": 14
 },
 "queimaduraDeGelo": {
  "id": "queimaduraDeGelo",
  "name": "Queimadura de Gelo",
  "nomeOriginal": "Frostbite",
  "level": 0,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 60,
  "classes": [
   "druida",
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "save",
  "save": "con",
  "damage": "1d6",
  "damageType": "frio",
  "halfOnSave": false,
  "onFail": {
   "condition": "queimaduraDeGelo",
   "rounds": 2
  },
  "desc": "Truque que cobre de geada uma criatura visível a até 18 m, que faz um teste de resistência de Constituição contra a sua CD de magia. Se falhar, sofre 1d6 de dano de frio e tem desvantagem na próxima jogada de ataque com arma que fizer até o fim do seu próximo turno; se passar, nada acontece. O dano sobe para 2d6 no 5º nível de personagem, 3d6 no 11º e 4d6 no 17º.",
  "tom": 3
 },
 "guardiaoDaNatureza": {
  "id": "guardiaoDaNatureza",
  "name": "Guardião da Natureza",
  "nomeOriginal": "Guardian of Nature",
  "level": 4,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "bonus",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "druida",
   "patrulheiro"
  ],
  "kind": "livro",
  "efeito": "conceder",
  "soSi": true,
  "familiaSonora": "reforco",
  "porOpcao": {
   "fera": "guardiaoFera",
   "arvore": "guardiaoArvore"
  },
  "pvTemp": {
   "arvore": 10
  },
  "opcoes": [
   {
    "id": "fera",
    "rotulo": "Fera Primal",
    "detalhe": "+3 m, vantagem com arma de Força, +1d6 energético de perto"
   },
   {
    "id": "arvore",
    "rotulo": "Grande Árvore",
    "detalhe": "10 PV temporários, vantagem em Constituição e com arma de Destreza ou Sabedoria"
   }
  ],
  "desc": "Com uma ação bônus, você assume por até 1 minuto (concentração) uma de duas formas concedidas por um espírito da natureza. Fera Primal: +3 m de deslocamento, visão no escuro de 36 m, vantagem em ataques baseados em Força e +1d6 de dano energético nos acertos com armas corpo a corpo. Grande Árvore: 10 PV temporários, vantagem em testes de resistência de Constituição e em ataques baseados em Destreza ou Sabedoria, e o chão num raio de 4,5 m ao seu redor vira terreno difícil para inimigos enquanto você estiver no solo. (Simplificação: a visão no escuro da Fera e o terreno difícil em volta da Árvore não existem no jogo.)",
  "tom": 14
 },
 "rajada": {
  "id": "rajada",
  "name": "Rajada",
  "nomeOriginal": "Gust",
  "level": 0,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 30,
  "classes": [
   "druida",
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "save": "str",
  "pushFt": 5,
  "desc": "Truque de transmutação: você manipula o ar num ponto visível a até 9 m e escolhe um de três efeitos. Uma criatura Média ou menor faz um teste de resistência de Força e, se falhar, é empurrada até 1,5 m para longe de você; ou um objeto solto de até 2,5 kg, que ninguém esteja segurando ou carregando, é deslocado até 3 m para longe de você, sem causar dano. Também pode criar um efeito sensorial inofensivo, como folhas farfalhando, janelas batendo ou roupas tremulando ao vento. O efeito é instantâneo. (Simplificação: é sempre o empurrão de 1,5 m; mover um objeto e soprar não existem no jogo.)",
  "tom": -7
 },
 "espiritoCurador": {
  "id": "espiritoCurador",
  "name": "Espírito Curador",
  "nomeOriginal": "Healing Spirit",
  "level": 2,
  "school": "conjuração",
  "fonte": "xge",
  "castTime": "bonus",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "druida",
   "patrulheiro"
  ],
  "kind": "save",
  "shape": "square",
  "areaFt": 5,
  "soZona": true,
  "reuso": "bonus",
  "zona": {
   "rodadas": 10,
   "quando": "inicio",
   "aoEntrar": true,
   "dificil": false,
   "semTeste": true,
   "movel": 30,
   "cura": {
    "dados": "1d6"
   }
  },
  "upcast": {
   "dados": 1
  },
  "desc": "Com uma ação bônus, você invoca um espírito da natureza intangível, em forma de fera ou fada, num cubo de 1,5 m visível a até 18 m. Por até 1 minuto (concentração), sempre que você ou uma criatura que você veja entrar no espaço dele pela primeira vez no turno ou começar o turno ali, você pode fazê-la recuperar 1d6 PV sem gastar ação. Constructos e mortos-vivos não são curados. O espírito cura 1 + seu modificador de conjuração vezes (no mínimo 2) e então some, e com uma ação bônus você pode movê-lo até 9 m. Em círculo maior, a cura aumenta 1d6 por círculo acima do 2º. (Simplificação: cura o aliado que entra ou começa o turno na casa do espírito, até 1 + o atributo de conjuração vezes (no mínimo duas).)",
  "tom": 12
 },
 "armaSagrada": {
  "id": "armaSagrada",
  "name": "Arma Sagrada",
  "nomeOriginal": "Holy Weapon",
  "level": 5,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "bonus",
  "rangeFt": 5,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "clerigo",
   "paladino"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "armaSagradaDaMagia",
  "desc": "Com uma ação bônus, você toca uma arma e a enche de poder divino por até 1 hora (concentração): ela se torna mágica, ilumina 9 m com luz plena e mais 9 m com penumbra, e cada ataque que acerta com ela causa 2d8 de dano radiante extra. Em um turno posterior, você pode gastar uma ação bônus para encerrar a magia num clarão: criaturas à sua escolha que você veja a até 9 m da arma fazem um teste de resistência de Constituição. Quem falha sofre 4d8 de dano radiante e fica cego por 1 minuto, repetindo o teste ao fim de cada turno para se livrar; quem passa sofre metade do dano e não fica cego. (Simplificação: a explosão de luz ao encerrar a magia não existe no jogo.)",
  "tom": -7
 },
 "facaDeGelo": {
  "id": "facaDeGelo",
  "name": "Faca de Gelo",
  "nomeOriginal": "Ice Knife",
  "level": 1,
  "school": "conjuração",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 60,
  "classes": [
   "druida",
   "feiticeiro",
   "mago"
  ],
  "upcast": {
   "dados": 1
  },
  "kind": "livro",
  "efeito": "facaDeGelo",
  "alvo": "criatura",
  "damageType": "frio",
  "desc": "Arremesse um estilhaço de gelo contra uma criatura a até 18 m com um ataque mágico à distância; se acertar, ela sofre 1d10 de dano perfurante. Acertando ou não, o estilhaço explode: o alvo e quem estiver a até 1,5 m dele fazem teste de resistência de Destreza contra a sua CD, sofrendo 2d6 de dano de frio se falharem. Efeito instantâneo. Em círculo maior, o dano de frio aumenta 1d6 por círculo acima do 1º.",
  "tom": 0
 },
 "dragaoIlusorio": {
  "id": "dragaoIlusorio",
  "name": "Dragão Ilusório",
  "nomeOriginal": "Illusory Dragon",
  "level": 8,
  "school": "ilusão",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 120,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "mago"
  ],
  "kind": "livro",
  "efeito": "dragaoIlusorio",
  "mira": "casa",
  "save": "wis",
  "opcoes": [
   {
    "id": "ácido",
    "rotulo": "Ácido"
   },
   {
    "id": "frio",
    "rotulo": "Frio"
   },
   {
    "id": "fogo",
    "rotulo": "Fogo"
   },
   {
    "id": "elétrico",
    "rotulo": "Elétrico"
   },
   {
    "id": "necrótico",
    "rotulo": "Necrótico"
   },
   {
    "id": "veneno",
    "rotulo": "Veneno"
   }
  ],
  "desc": "Você cria um dragão de sombras Enorme e tangível num espaço desocupado visível a até 36 m; ele dura até 1 minuto (concentração), é imune a dano e condições e passa em todos os testes. Ao surgir, cada inimigo que o veja faz teste de resistência de Sabedoria ou fica amedrontado por 1 minuto, repetindo o teste ao fim de cada turno em que não tiver linha de visão até ele. Com uma ação bônus, você o move até 18 m e pode fazê-lo soprar um cone de 18 m: teste de resistência de Inteligência contra 7d6 de dano (ácido, frio, fogo, elétrico, necrótico ou veneno, escolhido ao conjurar), metade se passar. Quem usar uma ação e passar num teste de Inteligência (Investigação) contra sua CD percebe a ilusão, enxerga através dela e tem vantagem contra o sopro. (Simplificação: o dragão é uma sombra no ponto escolhido: ao surgir, cada inimigo que o vê a até 36 m testa Sabedoria ou fica amedrontado. O sopro (ação bônus) sai de quem conjura, e não do dragão, e o dragão não anda no tabuleiro.)",
  "tom": -7
 },
 "imolacao": {
  "id": "imolacao",
  "name": "Imolação",
  "nomeOriginal": "Immolation",
  "level": 5,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 90,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "save": "dex",
  "damage": "8d6",
  "damageType": "fogo",
  "halfOnSave": true,
  "onFail": {
   "condition": "imolado",
   "rounds": 10,
   "repete": true,
   "danoAoFalhar": {
    "dano": "4d6",
    "tipo": "fogo"
   }
  },
  "desc": "Uma criatura visível a até 27 m faz um teste de resistência de Destreza: sofre 8d6 de dano de fogo se falhar, ou metade se passar. Quem falha fica em chamas enquanto durar a concentração (até 1 minuto), emitindo luz plena em 9 m e penumbra por mais 9 m, e repete o teste ao fim de cada turno seu: na falha sofre 4d6 de fogo, no sucesso a magia acaba. O fogo só se apaga por meios mágicos, e quem morrer pelo dano da magia vira cinzas.",
  "tom": -4
 },
 "infestacao": {
  "id": "infestacao",
  "name": "Infestação",
  "nomeOriginal": "Infestation",
  "level": 0,
  "school": "conjuração",
  "fonte": "xge",
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
  "damage": "1d6",
  "damageType": "veneno",
  "halfOnSave": false,
  "desc": "Truque: uma criatura visível a até 9 m é coberta por um enxame passageiro de pulgas e ácaros e faz um teste de resistência de Constituição contra a sua CD de magia. Se falhar, sofre 1d6 de dano de veneno e, se puder se mover e tiver deslocamento de pelo menos 1,5 m, desloca-se 1,5 m numa direção aleatória (role 1d4: 1 norte, 2 sul, 3 leste, 4 oeste), sem provocar ataques de oportunidade; se o caminho estiver bloqueado, ela fica onde está. Efeito instantâneo. O dano sobe para 2d6 no 5º nível do personagem, 3d6 no 11º e 4d6 no 17º. (Simplificação: os ácaros mordem; o passo de 1,5 m para um lado sorteado não existe no jogo.)",
  "tom": 0
 },
 "investiduraDasChamas": {
  "id": "investiduraDasChamas",
  "name": "Investidura das Chamas",
  "nomeOriginal": "Investiture of Flame",
  "level": 6,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "druida",
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "livro",
  "efeito": "conceder",
  "soSi": true,
  "condicao": "investiduraDasChamas",
  "familiaSonora": "protecao",
  "desc": "Você se cobre de chamas inofensivas por até 10 minutos (concentração), emitindo luz plena num raio de 9 m e penumbra por mais 9 m. Enquanto durar, você fica imune a dano de fogo e tem resistência a frio, e toda criatura que entrar pela primeira vez no turno a até 1,5 m de você, ou terminar o turno ali, sofre 1d10 de dano de fogo. Com sua ação, você pode disparar uma linha de fogo de 4,5 m por 1,5 m: cada criatura nela faz um teste de resistência de Destreza, sofrendo 4d8 de dano de fogo se falhar ou metade se passar. (Simplificação: o calor que fere quem chega perto não existe no jogo.)",
  "tom": -7
 },
 "investiduraDeGelo": {
  "id": "investiduraDeGelo",
  "name": "Investidura de Gelo",
  "nomeOriginal": "Investiture of Ice",
  "level": 6,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "druida",
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "livro",
  "efeito": "conceder",
  "soSi": true,
  "condicao": "investiduraDeGelo",
  "familiaSonora": "protecao",
  "desc": "Por até 10 minutos (concentração), seu corpo fica coberto de gelo: você ganha imunidade a frio, resistência a fogo e ignora o terreno difícil feito de gelo ou neve. O chão num raio de 3 m ao seu redor congela e vira terreno difícil para todos menos você, acompanhando seus movimentos. Com sua ação, você pode soprar um cone de vento gélido de 4,5 m; cada criatura nele faz teste de resistência de Constituição contra a CD da magia, sofrendo 4d6 de dano de frio e tendo o deslocamento reduzido à metade até o início do seu próximo turno se falhar, ou metade do dano sem a redução se passar. (Simplificação: o chão gelado em volta não existe no jogo.)",
  "tom": 14
 },
 "investiduraDePedra": {
  "id": "investiduraDePedra",
  "name": "Investidura de Pedra",
  "nomeOriginal": "Investiture of Stone",
  "level": 6,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "druida",
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "livro",
  "efeito": "conceder",
  "soSi": true,
  "condicao": "investiduraDePedra",
  "familiaSonora": "protecao",
  "desc": "Por até 10 minutos (concentração), seu corpo se cobre de rocha e você ganha resistência a dano cortante, perfurante e de concussão vindo de ataques não mágicos. Com uma ação, você faz o chão tremer num raio de 4,5 m ao seu redor, e as demais criaturas nesse solo precisam passar num teste de resistência de Destreza contra a sua CD ou ficam caídas. Terreno difícil de terra ou pedra não lhe custa movimento extra, e você atravessa terra e pedra sólidas como se fossem ar, sem abalá-las. Porém, se terminar o movimento dentro delas, é expelido para o espaço livre mais próximo, a magia acaba e você fica atordoado até o fim do seu próximo turno. (Simplificação: atravessar a pedra não existe no jogo.)",
  "tom": -7
 },
 "investiduraDoVento": {
  "id": "investiduraDoVento",
  "name": "Investidura do Vento",
  "nomeOriginal": "Investiture of Wind",
  "level": 6,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "druida",
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "livro",
  "efeito": "conceder",
  "soSi": true,
  "condicao": "investiduraDoVento",
  "familiaSonora": "movimento",
  "desc": "Por até 10 minutos (concentração), ventos giram ao seu redor: ataques à distância com armas contra você têm desvantagem e você ganha deslocamento de voo de 18 m, caindo se ainda estiver no ar quando a magia acabar. Com sua ação, você pode criar um cubo de vento de 4,5 m centrado num ponto visível a até 18 m; cada criatura ali faz um teste de resistência de Constituição, sofrendo 2d10 de dano de concussão se falhar ou metade se passar. Criaturas Grandes ou menores que falharem também são empurradas até 3 m para longe do centro do cubo.",
  "tom": -7
 },
 "invulnerabilidade": {
  "id": "invulnerabilidade",
  "name": "Invulnerabilidade",
  "nomeOriginal": "Invulnerability",
  "level": 9,
  "school": "abjuração",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "mago"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "invulneravel",
  "desc": "Magia de 9º círculo, pessoal: você não sofre dano de nenhuma fonte ou tipo enquanto ela durar. Dura até 10 minutos e exige concentração. Requer um fragmento de adamante de pelo menos 500 po, que é destruído ao conjurar.",
  "tom": 14
 },
 "transferenciaDeVida": {
  "id": "transferenciaDeVida",
  "name": "Transferência de Vida",
  "nomeOriginal": "Life Transference",
  "level": 3,
  "school": "necromancia",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 30,
  "classes": [
   "clerigo",
   "mago"
  ],
  "upcast": {
   "dados": 1
  },
  "kind": "livro",
  "efeito": "transferirVida",
  "alvo": "criatura",
  "familiaSonora": "cura",
  "desc": "Você sofre 4d8 de dano necrótico, que não pode ser reduzido de forma alguma, e uma criatura que você veja a até 9 m recupera PV iguais ao dobro desse dano. O efeito é instantâneo e não exige teste de resistência. Em círculo 4 ou maior, o dano que você sofre aumenta em 1d8 por círculo acima do 3º, e a cura cresce junto.",
  "tom": -7
 },
 "escuridaoEnlouquecedora": {
  "id": "escuridaoEnlouquecedora",
  "name": "Escuridão Enlouquecedora",
  "nomeOriginal": "Maddening Darkness",
  "level": 8,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 150,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "bruxo",
   "mago"
  ],
  "kind": "save",
  "save": "wis",
  "shape": "sphere",
  "areaFt": 60,
  "soZona": true,
  "contornaEsquinas": true,
  "zona": {
   "rodadas": 100,
   "quando": "inicio",
   "aoEntrar": false,
   "dificil": false,
   "semTeste": true,
   "obscuro": "magica",
   "dano": {
    "dados": "8d8",
    "tipo": "psíquico",
    "save": "wis",
    "metade": true
   }
  },
  "desc": "Você escolhe um ponto a até 45 m e enche uma esfera de 18 m de raio com escuridão mágica, que contorna cantos, bloqueia até a visão no escuro e não é iluminada por luz comum nem por magias de 8º círculo ou menor. Dentro dela ecoam gritos e risadas insanas: toda criatura que começa o turno na área faz um teste de resistência de Sabedoria, sofrendo 8d8 de dano psíquico se falhar ou metade se passar. Dura até 10 minutos, com concentração.",
  "tom": 0
 },
 "turbilhao": {
  "id": "turbilhao",
  "name": "Turbilhão",
  "nomeOriginal": "Maelstrom",
  "level": 5,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 120,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "druida"
  ],
  "kind": "save",
  "save": "str",
  "shape": "sphere",
  "areaFt": 30,
  "soZona": true,
  "zona": {
   "rodadas": 10,
   "quando": "inicio",
   "aoEntrar": true,
   "dificil": true,
   "semTeste": true,
   "dano": {
    "dados": "6d6",
    "tipo": "concussão",
    "save": "str",
    "metade": false
   }
  },
  "desc": "Você faz surgir, num ponto visível no chão ou na água a até 36 m, um turbilhão de água com 1,5 m de profundidade e 9 m de raio, que conta como terreno difícil enquanto durar (concentração, até 1 minuto). Toda criatura que começa o turno na área faz um teste de resistência de Força contra a sua CD; se falhar, sofre 6d6 de dano de concussão e é arrastada 3 m em direção ao centro. (Simplificação: o puxão de 3 m para o centro não existe no jogo.)",
  "tom": 0
 },
 "pedraEncantada": {
  "id": "pedraEncantada",
  "name": "Pedra Encantada",
  "nomeOriginal": "Magic Stone",
  "level": 0,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "bonus",
  "rangeFt": 5,
  "duracaoRodadas": 10,
  "classes": [
   "druida",
   "bruxo"
  ],
  "kind": "livro",
  "efeito": "conceder",
  "soSi": true,
  "condicao": "pedrasEncantadas",
  "damageType": "concussão",
  "cargas": 3,
  "danoComMod": "1d6",
  "desc": "Com uma ação bônus, você toca até três pedrinhas e as carrega de magia por 1 minuto. Qualquer criatura pode usá-las num ataque mágico à distância, arremessando-as (alcance de 18 m) ou disparando-as com uma funda, sempre somando o seu modificador de conjuração à jogada. Cada acerto causa 1d6 + seu modificador de conjuração de dano de concussão, e a pedra perde a magia após o ataque, acertando ou não. Conjurar a magia de novo anula as pedras que restarem da conjuração anterior. (Simplificação: as três pedras ficam com quem conjura, e cada uma se arremessa com a ação; dá-las a outro não existe no jogo.)",
  "tom": 3
 },
 "metamorfoseEmMassa": {
  "id": "metamorfoseEmMassa",
  "name": "Metamorfose em Massa",
  "nomeOriginal": "Mass Polymorph",
  "level": 9,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 120,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "bardo",
   "feiticeiro",
   "mago"
  ],
  "kind": "livro",
  "efeito": "metamorfose",
  "massa": 10,
  "opcoes": [
   {
    "id": "inimigos",
    "rotulo": "Os inimigos",
    "detalhe": "até dez, viram rã (Sabedoria resiste)"
   },
   {
    "id": "aliados",
    "rotulo": "Os aliados",
    "detalhe": "até dez, viram a fera mais forte que o nível deixa"
   }
  ],
  "desc": "Até dez criaturas à sua escolha que você veja a até 36 m viram feras escolhidas por você, iguais ou diferentes para cada uma, que você já tenha visto e com ND não maior que o do alvo (ou metade do nível, se não tiver ND); alvos relutantes resistem com um teste de resistência de Sabedoria, e metamorfos passam automaticamente. Cada alvo usa as estatísticas da fera, inclusive as mentais, mas mantém tendência, personalidade e seus PV, recebendo PV temporários iguais aos PV da nova forma, que não podem ser substituídos por outra fonte. Volta ao normal quando esses PV temporários acabam, quando morre ou quando a magia termina (concentração, até 1 hora). Na forma de fera não fala, não conjura magias nem faz nada que exija mãos ou fala, e o equipamento se funde ao corpo, sem poder ser usado. (Simplificação: todos os alvos são do mesmo lado, os mais perto: o inimigo vira rã e o aliado, a fera mais forte que o nível dele deixa.)",
  "tom": -7
 },
 "garraTerrenaDeMaximilian": {
  "id": "garraTerrenaDeMaximilian",
  "name": "Garra Terrena de Maximilian",
  "nomeOriginal": "Maximilian's Earthen Grasp",
  "level": 2,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 30,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "save": "str",
  "damage": "2d6",
  "damageType": "concussão",
  "halfOnSave": false,
  "onFail": {
   "condition": "contido",
   "rounds": 10
  },
  "desc": "Uma mão Média de terra compactada surge em um espaço desocupado de 1,5 m no chão a até 9 m e tenta agarrar uma criatura a até 1,5 m dela: se falhar num teste de resistência de Força, o alvo sofre 2d6 de dano de concussão e fica contido enquanto a magia durar (concentração, até 1 minuto). Com sua ação, você pode fazer a mão esmagar o alvo contido (2d6 de concussão, metade se passar num teste de Força) ou mandá-la agarrar outra criatura ou mudar de espaço dentro do alcance, o que solta quem ela estiver prendendo. A vítima pode usar a ação para fazer um teste de Força contra a CD da sua magia e escapar se tiver sucesso. (Simplificação: a mão agarra uma vez; esmagar de novo com a ação e movê-la não existem no jogo.)",
  "tom": -2
 },
 "meteorosDiminutosDeMelf": {
  "id": "meteorosDiminutosDeMelf",
  "name": "Meteoros Diminutos de Melf",
  "nomeOriginal": "Melf's Minute Meteors",
  "level": 3,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "feiticeiro",
   "mago"
  ],
  "kind": "livro",
  "efeito": "conceder",
  "soSi": true,
  "condicao": "meteorosMinusculos",
  "damageType": "fogo",
  "cargas": 3,
  "cargasPorCirculo": 1,
  "desc": "Seis pequenos meteoros passam a girar ao seu redor enquanto durar a concentração (até 10 minutos). Ao conjurar e, depois, com uma ação bônus em cada turno seu, você lança um ou dois deles contra pontos à sua escolha a até 36 m; cada um explode ao chegar ou ao bater numa superfície sólida. Criaturas a até 1,5 m da explosão fazem teste de resistência de Destreza contra 2d6 de dano de fogo, sofrendo metade se passarem. Para cada círculo acima do 3º, você cria mais dois meteoros. (Simplificação: os meteoros saem de dois em dois, no mesmo ponto, numa explosão só, com a ação bônus.)",
  "tom": -4
 },
 "prisaoMental": {
  "id": "prisaoMental",
  "name": "Prisão Mental",
  "nomeOriginal": "Mental Prison",
  "level": 6,
  "school": "ilusão",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "save",
  "save": "int",
  "damage": "5d10",
  "damageType": "psíquico",
  "danoSempre": true,
  "onFail": {
   "condition": "prisaoMental",
   "rounds": 10
  },
  "desc": "Uma criatura visível a até 18 m faz um teste de resistência de Inteligência (sucesso automático se for imune a ficar enfeitiçado). Com sucesso, sofre 5d10 de dano psíquico e a magia termina. Com falha, sofre o mesmo dano e fica presa numa cela ilusória que só ela percebe, com aparência ameaçadora à sua escolha; enquanto durar, fica contida e não vê nem ouve nada além dela. Se for tirada da ilusão, atacar corpo a corpo através dela ou passar qualquer parte do corpo por ela, sofre 10d10 de dano psíquico e a magia acaba; concentração, até 1 minuto. (Simplificação: os 10d10 de quem tenta sair da prisão não existem no jogo: ele fica.)",
  "tom": -2
 },
 "lancaMental": {
  "id": "lancaMental",
  "name": "Lança Mental",
  "nomeOriginal": "Mind Spike",
  "level": 2,
  "school": "adivinhação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "save",
  "save": "wis",
  "damage": "3d8",
  "damageType": "psíquico",
  "halfOnSave": true,
  "upcast": {
   "dados": 1
  },
  "desc": "Escolha uma criatura visível a até 18 m: ela faz um teste de resistência de Sabedoria (CD de SAB) e sofre 3d8 de dano psíquico se falhar, ou metade se passar. Se falhar, você sabe onde ela está enquanto mantiver a concentração (até 1 hora) e ambos estiverem no mesmo plano; nesse período ela não consegue se esconder de você e ficar invisível não lhe dá vantagem nenhuma contra você. Em círculo 3 ou maior, o dano aumenta em 1d8 por círculo acima do 2º. (Simplificação: saber onde o alvo está pela hora seguinte não existe no jogo.)",
  "tom": 5
 },
 "moldarTerra": {
  "id": "moldarTerra",
  "name": "Moldar Terra",
  "nomeOriginal": "Mold Earth",
  "level": 0,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 30,
  "classes": [
   "druida",
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "shape": "square",
  "areaFt": 5,
  "soZona": true,
  "zona": {
   "rodadas": 600,
   "quando": "nunca",
   "aoEntrar": false,
   "dificil": true,
   "semTeste": true
  },
  "desc": "Truque de transmutação: escolha um trecho de terra ou pedra visível a até 9 m, cabendo num cubo de 1,5 m, e aplique um efeito. Você pode cavar terra solta e deslocá-la instantaneamente até 1,5 m, sem causar dano, ou marcar a superfície com formas, cores, palavras ou desenhos por 1 hora. Também pode transformar o chão em terreno difícil, ou desfazer terreno difícil existente, por 1 hora. Só dois efeitos duradouros podem estar ativos ao mesmo tempo, e você pode encerrar um deles com uma ação. (Simplificação: no jogo é só o terreno difícil (a terra solta num quadrado de 1,5 m, por 1 hora); cavar e desenhar no chão não existem.)",
  "tom": 14
 },
 "inundacaoDeEnergiaNegativa": {
  "id": "inundacaoDeEnergiaNegativa",
  "name": "Inundação de Energia Negativa",
  "nomeOriginal": "Negative Energy Flood",
  "level": 5,
  "school": "necromancia",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 60,
  "classes": [
   "bruxo",
   "mago"
  ],
  "kind": "save",
  "save": "con",
  "damage": "5d12",
  "damageType": "necrótico",
  "halfOnSave": true,
  "naoAfeta": [
   "morto-vivo"
  ],
  "desc": "Uma criatura que você veja a até 18 m é atingida por energia negativa e faz um teste de resistência de Constituição: sofre 5d12 de dano necrótico se falhar, ou metade se passar. Se esse dano a matar, ela se ergue como zumbi no início do seu próximo turno e ataca a criatura visível mais próxima. Se o alvo for um morto-vivo, não há teste: ele recebe PV temporários iguais à metade de 5d12. Efeito instantâneo. (Simplificação: o morto-vivo não ganha os PV temporários do livro, e quem morre não se levanta como zumbi.)",
  "tom": -4
 },
 "palavraDePoderDor": {
  "id": "palavraDePoderDor",
  "name": "Palavra de Poder Dor",
  "nomeOriginal": "Power Word Pain",
  "level": 7,
  "school": "encantamento",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 60,
  "classes": [
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "matar",
  "targets": 1,
  "limitePv": 100,
  "condicao": "dorAtroz",
  "save": "con",
  "desc": "Escolha uma criatura visível a até 18 m; se ela tiver 100 PV ou menos e não for imune a ser enfeitiçada, é tomada por uma dor incapacitante, sem teste inicial; caso contrário, nada acontece. Enquanto sofre a dor, seu deslocamento fica limitado a 3 m e ela tem desvantagem em jogadas de ataque, testes de habilidade e testes de resistência, exceto os de Constituição. Para conjurar uma magia, precisa antes passar num teste de resistência de Constituição, ou a magia é perdida. Ao fim de cada turno dela, um novo teste de resistência de Constituição bem-sucedido encerra o efeito.",
  "tom": -7
 },
 "selvageriaPrimal": {
  "id": "selvageriaPrimal",
  "name": "Selvageria Primal",
  "nomeOriginal": "Primal Savagery",
  "level": 0,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 5,
  "classes": [
   "druida"
  ],
  "kind": "attack",
  "melee": true,
  "damage": "1d10",
  "damageType": "ácido",
  "desc": "Seus dentes ou unhas se tornam afiados e corrosivos por um instante, e você faz um ataque mágico corpo a corpo contra uma criatura a até 1,5 m. Se acertar, ela sofre 1d10 de dano ácido; depois do golpe, seu corpo volta ao normal. É um truque: o dano aumenta para 2d10 no 5º nível de personagem, 3d10 no 11º e 4d10 no 17º.",
  "tom": -4
 },
 "protecaoPrimordial": {
  "id": "protecaoPrimordial",
  "name": "Proteção Primordial",
  "nomeOriginal": "Primordial Ward",
  "level": 6,
  "school": "abjuração",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "druida"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "protecaoPrimordial",
  "desc": "Abjuração em você mesmo que dura até 1 minuto (concentração) e concede resistência a dano de ácido, frio, fogo, elétrico e trovejante. Ao sofrer dano de um desses tipos, você pode usar sua reação para trocar todas as resistências por imunidade àquele tipo, valendo inclusive contra o dano que a provocou. A imunidade dura até o fim do seu próximo turno e, nesse momento, a magia termina. (Simplificação: a troca da resistência por imunidade, com a reação, não existe no jogo.)",
  "tom": -7
 },
 "gritoPsiquico": {
  "id": "gritoPsiquico",
  "name": "Grito Psíquico",
  "nomeOriginal": "Psychic Scream",
  "level": 9,
  "school": "encantamento",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 90,
  "classes": [
   "bardo",
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "save",
  "save": "int",
  "damage": "14d6",
  "damageType": "psíquico",
  "halfOnSave": true,
  "intMinima": 3,
  "alvos": 10,
  "juntosFt": 90,
  "autoJuntos": true,
  "onFail": {
   "condition": "atordoado",
   "repete": true
  },
  "desc": "Escolha até dez criaturas que você veja a até 27 m; as que têm Inteligência 2 ou menos são imunes. Cada alvo faz um teste de resistência de Inteligência (CD de INT): se falhar, sofre 14d6 de dano psíquico e fica atordoado; se passar, sofre metade e não fica atordoado. Quem morre por esse dano tem a cabeça explodida, se tiver uma. O atordoado repete o teste ao fim de cada turno seu e se livra do efeito ao passar; a magia é instantânea e não exige concentração. (Simplificação: os alvos são o escolhido e os inimigos mais perto dele, até dez.)",
  "tom": -4
 },
 "pirotecnia": {
  "id": "pirotecnia",
  "name": "Pirotecnia",
  "nomeOriginal": "Pyrotechnics",
  "level": 2,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 60,
  "classes": [
   "bardo",
   "feiticeiro",
   "mago"
  ],
  "kind": "livro",
  "efeito": "pirotecnia",
  "mira": "casa",
  "exigeChama": true,
  "save": "con",
  "opcoes": [
   {
    "id": "fogos",
    "rotulo": "Fogos de artifício",
    "detalhe": "CON ou cego, a 3 m"
   },
   {
    "id": "fumaca",
    "rotulo": "Fumaça",
    "detalhe": "6 m de raio, 1 minuto"
   }
  ],
  "desc": "Escolha uma chama não mágica visível a até 18 m que caiba num cubo de 1,5 m; ela se apaga e você escolhe um de dois efeitos, de forma instantânea. Fogos de artifício: cada criatura a até 3 m da chama faz um teste de resistência de Constituição (CD de magia) e, se falhar, fica cega até o fim do seu próximo turno. Fumaça: uma nuvem negra com 6 m de raio se espalha a partir da chama, contornando esquinas, deixando a área com escuridão densa por 1 minuto ou até um vento forte dissipá-la. (Simplificação: vale para a chama do mapa (a tocha, o braseiro, a fogueira), que se apaga. A fumaça não se espalha com o vento.)",
  "tom": 14
 },
 "dispersar": {
  "id": "dispersar",
  "name": "Dispersar",
  "nomeOriginal": "Scatter",
  "level": 6,
  "school": "conjuração",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 30,
  "classes": [
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "livro",
  "efeito": "dispersao",
  "save": "wis",
  "familiaSonora": "utilidade",
  "opcoes": [
   {
    "id": "inimigos",
    "rotulo": "Espalhar os inimigos",
    "detalhe": "até cinco a 9 m, para longe do grupo (Sabedoria resiste)"
   },
   {
    "id": "aliados",
    "rotulo": "Tirar os aliados",
    "detalhe": "até cinco a 9 m, para longe dos inimigos"
   }
  ],
  "desc": "Escolha até cinco criaturas que você possa ver a até 9 m e teleporte cada uma para um espaço desocupado no chão, visível para você, a até 36 m de distância. Alvos que não aceitem o efeito fazem um teste de resistência de Sabedoria contra a CD da magia e não são movidos se passarem. O efeito é instantâneo e exige apenas componente verbal. (Simplificação: quem conjura escolhe um lado; o jogo põe cada um na casa livre e à vista, a até 36 m, mais longe do outro lado.)",
  "tom": -5
 },
 "laminaSombria": {
  "id": "laminaSombria",
  "name": "Lâmina Sombria",
  "nomeOriginal": "Shadow Blade",
  "level": 2,
  "school": "ilusão",
  "fonte": "xge",
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
  "condicao": "laminaSombria",
  "familiaSonora": "reforco",
  "arma": "laminaSombria",
  "desc": "Com uma ação bônus, você materializa na mão uma espada de sombra que dura enquanto mantiver a concentração (até 1 minuto). Ela conta como arma simples corpo a corpo na qual você é proficiente, causa 2d8 de dano psíquico e é acuidade, leve e de arremesso (6/18 m), e você tem vantagem ao atacar alvos em penumbra ou escuridão. Se a soltar ou arremessar, ela some no fim do turno, mas uma ação bônus a traz de volta enquanto a magia durar. O dano sobe para 3d8 no 3º ou 4º círculo, 4d8 no 5º ou 6º e 5d8 do 7º em diante. (Simplificação: a espada tem sempre 2d8; os dados a mais do círculo maior não existem no jogo.)",
  "tom": 7
 },
 "sombraDeMoil": {
  "id": "sombraDeMoil",
  "name": "Sombra de Moil",
  "nomeOriginal": "Shadow of Moil",
  "level": 4,
  "school": "necromancia",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "bruxo"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "sombraDeMoil",
  "desc": "Você fica envolto por sombras em forma de chamas e passa a ser considerado em área de escuridão densa para os outros. Num raio de 3 m ao seu redor, a luz plena cai para penumbra e a penumbra vira escuridão. Você também ganha resistência a dano radiante, e cada criatura a até 3 m que o acertar com um ataque sofre 2d8 de dano necrótico. Dura 1 minuto (concentração) e exige um olho de morto-vivo engastado numa gema de 150 po.",
  "tom": 14
 },
 "radianciaNauseante": {
  "id": "radianciaNauseante",
  "name": "Radiância Nauseante",
  "nomeOriginal": "Sickening Radiance",
  "level": 4,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 120,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "save",
  "save": "con",
  "shape": "sphere",
  "areaFt": 30,
  "soZona": true,
  "zona": {
   "rodadas": 100,
   "quando": "inicio",
   "aoEntrar": true,
   "dificil": false,
   "semTeste": true,
   "dano": {
    "dados": "4d10",
    "tipo": "radiante",
    "save": "con",
    "metade": false,
    "exaustao": 1
   }
  },
  "desc": "Uma esfera de 9 m de raio de luz verde e fraca surge num ponto a até 36 m e contorna cantos. Quem entra na área pela primeira vez no turno ou começa o turno nela faz um teste de resistência de Constituição; se falhar, sofre 4d10 de dano radiante, ganha um nível de exaustão e passa a brilhar num raio de 1,5 m, o que impede que se beneficie de estar invisível. Dura até 10 minutos (concentração), e o brilho e a exaustão causados por ela desaparecem quando a magia termina. (Simplificação: a luz que não deixa ninguém ficar invisível não existe no jogo.)",
  "tom": 3
 },
 "aprimorarPericia": {
  "id": "aprimorarPericia",
  "name": "Aprimorar Perícia",
  "nomeOriginal": "Skill Empowerment",
  "level": 5,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 5,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "bardo",
   "feiticeiro",
   "mago"
  ],
  "kind": "livro",
  "efeito": "aprimorarPericia",
  "alvo": "criatura",
  "familiaSonora": "reforco",
  "opcoes": [
   {
    "id": "acrobacia",
    "rotulo": "Acrobacia"
   },
   {
    "id": "adestrarAnimais",
    "rotulo": "Adestrar Animais"
   },
   {
    "id": "arcanismo",
    "rotulo": "Arcanismo"
   },
   {
    "id": "atletismo",
    "rotulo": "Atletismo"
   },
   {
    "id": "atuacao",
    "rotulo": "Atuação"
   },
   {
    "id": "enganacao",
    "rotulo": "Enganação"
   },
   {
    "id": "furtividade",
    "rotulo": "Furtividade"
   },
   {
    "id": "historia",
    "rotulo": "História"
   },
   {
    "id": "intimidacao",
    "rotulo": "Intimidação"
   },
   {
    "id": "intuicao",
    "rotulo": "Intuição"
   },
   {
    "id": "investigacao",
    "rotulo": "Investigação"
   },
   {
    "id": "medicina",
    "rotulo": "Medicina"
   },
   {
    "id": "natureza",
    "rotulo": "Natureza"
   },
   {
    "id": "percepcao",
    "rotulo": "Percepção"
   },
   {
    "id": "persuasao",
    "rotulo": "Persuasão"
   },
   {
    "id": "prestidigitacao",
    "rotulo": "Prestidigitação"
   },
   {
    "id": "religiao",
    "rotulo": "Religião"
   },
   {
    "id": "sobrevivencia",
    "rotulo": "Sobrevivência"
   }
  ],
  "desc": "Toque uma criatura voluntária e escolha uma perícia em que ela já seja proficiente. Por até 1 hora (concentração), ela dobra o bônus de proficiência nos testes de habilidade com essa perícia. A perícia escolhida não pode já estar recebendo outro efeito que dobre a proficiência, como Especialização. (Simplificação: na luta, a perícia é uma das opções; explorando, o jogo pergunta entre as que o alvo tem treinadas.)",
  "tom": 7
 },
 "enxameDeBolasDeNeveDeSnilloc": {
  "id": "enxameDeBolasDeNeveDeSnilloc",
  "name": "Enxame de Bolas de Neve de Snilloc",
  "nomeOriginal": "Snilloc's Snowball Swarm",
  "level": 2,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 90,
  "classes": [
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "save": "dex",
  "shape": "sphere",
  "areaFt": 5,
  "damage": "3d6",
  "damageType": "frio",
  "halfOnSave": true,
  "upcast": {
   "dados": 1
  },
  "desc": "Escolha um ponto a até 27 m: uma rajada de bolas de neve mágicas atinge todas as criaturas numa esfera de 1,5 m de raio ao redor dele. Cada uma faz um teste de resistência de Destreza e sofre 3d6 de dano de frio se falhar, ou metade se passar. Efeito instantâneo, sem concentração. Em círculo maior que o 2º, o dano aumenta em 1d6 por círculo acima do 2º.",
  "tom": -4
 },
 "gaiolaDeAlmas": {
  "id": "gaiolaDeAlmas",
  "name": "Gaiola de Almas",
  "nomeOriginal": "Soul Cage",
  "level": 6,
  "school": "necromancia",
  "fonte": "xge",
  "castTime": "reaction",
  "rangeFt": 60,
  "duracaoRodadas": 4800,
  "classes": [
   "bruxo",
   "mago"
  ],
  "kind": "reacao",
  "gatilho": "morteHumanoide",
  "familiaSonora": "utilidade",
  "desc": "Como reação, quando um humanoide que você vê a até 18 m morre, você aprisiona a alma dele numa pequena gaiola de prata (100 po) por 8 horas. Enquanto ela estiver presa, o morto não pode ser revivido, e destruir a gaiola encerra a magia. Você pode explorar a alma até seis vezes, e na sexta ela se liberta. As opções são: ação bônus para recuperar 2d8 PV; uma pergunta sem gastar ação, que ela responde com verdade em uma ou duas frases, talvez enigmáticas, usando só o que sabia em vida; ação bônus para ganhar vantagem na próxima jogada de ataque, teste de habilidade ou de resistência antes do seu próximo turno; ou uma ação para criar um sensor invisível num lugar que o morto viu no mesmo plano, pelo qual você vê e ouve por até 10 minutos com concentração. (Simplificação: sai sozinha, como a Queda Suave, quando não há alma presa. Roubar Vida e Emprestar Experiência são ações bônus; perguntar à alma e os olhos do morto só se narrariam e não existem no jogo.)",
  "tom": 0
 },
 "golpeDoVentoDeAco": {
  "id": "golpeDoVentoDeAco",
  "name": "Golpe do Vento de Aço",
  "nomeOriginal": "Steel Wind Strike",
  "level": 5,
  "school": "conjuração",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 30,
  "classes": [
   "patrulheiro",
   "mago"
  ],
  "kind": "livro",
  "efeito": "ventoDeAco",
  "alvo": "criatura",
  "damageType": "energético",
  "desc": "Escolha até cinco criaturas visíveis a até 9 m e faça um ataque corpo a corpo com magia contra cada uma; cada acerto causa 6d10 de dano energético. Depois dos ataques, você pode se teletransportar para um espaço desocupado visível a até 1,5 m de qualquer um dos alvos, tenha acertado ou não. O efeito é instantâneo e exige como componente uma arma corpo a corpo que valha pelo menos 1 PP. (Simplificação: os alvos são o escolhido e os inimigos mais perto de quem conjura, até cinco.)",
  "tom": 3
 },
 "esferaDaTempestade": {
  "id": "esferaDaTempestade",
  "name": "Esfera da Tempestade",
  "nomeOriginal": "Storm Sphere",
  "level": 4,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 150,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "save": "str",
  "shape": "sphere",
  "areaFt": 20,
  "damage": "2d6",
  "damageType": "concussão",
  "halfOnSave": false,
  "zona": {
   "rodadas": 10,
   "quando": "fim",
   "aoEntrar": false,
   "dificil": true,
   "semTeste": true,
   "dano": {
    "dados": "2d6",
    "tipo": "concussão",
    "save": "str",
    "metade": false
   }
  },
  "upcast": {
   "dados": 1
  },
  "desc": "Cria por até 1 minuto (concentração) uma esfera de vento giratório com 6 m de raio, centrada num ponto a até 45 m. A área é terreno difícil, e quem estiver nela quando surge ou terminar o turno ali faz um teste de resistência de Força ou sofre 2d6 de dano de concussão; criaturas a até 9 m da esfera têm desvantagem em testes de Sabedoria (Percepção) para ouvir. Enquanto durar, você pode usar uma ação bônus por turno para lançar um raio do centro contra uma criatura a até 18 m dele, com um ataque de magia à distância (com vantagem se o alvo estiver dentro da esfera) que causa 4d6 de dano elétrico. Para cada círculo acima do 4º, cada efeito causa +1d6 de dano. (Simplificação: o raio da ação bônus sai de quem conjura (no livro, do centro da esfera), sem a vantagem contra quem está dentro.)",
  "tom": 5
 },
 "invocarDemonioMaior": {
  "id": "invocarDemonioMaior",
  "name": "Invocar Demônio Maior",
  "nomeOriginal": "Summon Greater Demon",
  "level": 4,
  "school": "conjuração",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "bruxo",
   "mago"
  ],
  "kind": "livro",
  "efeito": "demonioMaior",
  "familiaSonora": "invocacao",
  "desc": "Traz do Abismo um demônio de ND 5 ou menor, à sua escolha, em um espaço visível a até 18 m. Ele age na própria iniciativa e cumpre suas ordens verbais (sem custo de ação), mas ao fim de cada turno faz um teste de resistência de Carisma, com desvantagem se você disser o nome verdadeiro dele. Se passar, fica livre e ataca os não demônios mais próximos; some ao chegar a 0 PV ou quando a magia acaba (concentração, até 1 hora), e, se você perder a concentração antes, um demônio fora de controle ainda permanece por 1d6 rodadas. Com o sangue do componente você pode traçar um círculo ao seu redor que o demônio não pode cruzar, danificar nem usar para mirar alguém dentro dele (o sangue é consumido), e o ND máximo aumenta em 1 por círculo acima do 4º. (Simplificação: o demônio é o mais forte que o círculo deixa (barlgura, vrock, hezrou, glabrezu, yochlol). Passando no Carisma do fim de um turno dele, vira hostil a todos. O nome verdadeiro e o círculo de sangue não existem no jogo.)",
  "tom": 14
 },
 "invocarDemoniosMenores": {
  "id": "invocarDemoniosMenores",
  "name": "Invocar Demônios Menores",
  "nomeOriginal": "Summon Lesser Demons",
  "level": 3,
  "school": "conjuração",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 600,
  "classes": [
   "bruxo",
   "mago"
  ],
  "kind": "livro",
  "efeito": "demoniosMenores",
  "familiaSonora": "invocacao",
  "desc": "Role 1d6 para definir os demônios que surgem em espaços visíveis à sua escolha a até 18 m: com 1-2 vêm dois de ND 1 ou menor, com 3-4 vêm quatro de ND 1/2 ou menor e com 5-6 vêm oito de ND 1/4 ou menor (o mestre escolhe quais). Eles são hostis a todos, inclusive a você, agem em grupo com iniciativa própria, atacam os não demônios mais próximos e somem ao chegar a 0 PV ou quando a magia acaba (concentração, até 1 hora). Se você usar o sangue do componente para traçar um círculo ao seu redor, os demônios não podem cruzá-lo, danificá-lo nem mirar quem está dentro, e o sangue é consumido ao fim da magia. Em 6º ou 7º círculo surgem o dobro de demônios, e em 8º ou 9º, o triplo. (Simplificação: o d6 escolhe: dois quasits, quatro dretches ou oito manes. Eles atacam qualquer um que não seja demônio, de qualquer lado. O círculo de sangue que protege quem conjura não existe no jogo.)",
  "tom": -5
 },
 "estaticaSinaptica": {
  "id": "estaticaSinaptica",
  "name": "Estática Sináptica",
  "nomeOriginal": "Synaptic Static",
  "level": 5,
  "school": "encantamento",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 120,
  "classes": [
   "bardo",
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "save",
  "save": "int",
  "shape": "sphere",
  "areaFt": 20,
  "damage": "8d6",
  "damageType": "psíquico",
  "halfOnSave": true,
  "onFail": {
   "condition": "estaticaSinaptica",
   "rounds": 10,
   "repete": true
  },
  "desc": "Uma explosão psíquica atinge uma esfera de 6 m de raio num ponto a até 36 m; cada criatura na área faz um teste de resistência de Inteligência (CD de INT), sofrendo 8d6 de dano psíquico se falhar ou metade se passar. Criaturas com Inteligência 2 ou menos são imunes. Quem falha fica com a mente confusa por 1 minuto: subtrai 1d6 de suas jogadas de ataque, testes de habilidade e testes de Constituição para manter concentração. O alvo repete o teste de Inteligência ao fim de cada turno seu, encerrando o efeito se passar.",
  "tom": 3
 },
 "transformacaoDeTenser": {
  "id": "transformacaoDeTenser",
  "name": "Transformação de Tenser",
  "nomeOriginal": "Tenser's Transformation",
  "level": 6,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "mago"
  ],
  "kind": "livro",
  "efeito": "conceder",
  "soSi": true,
  "condicao": "transformacaoDeTenser",
  "familiaSonora": "reforco",
  "pvTemp": 50,
  "desc": "Em você mesmo, por até 10 minutos (concentração): você não pode conjurar magias, mas recebe 50 PV temporários (que somem ao fim) e proficiência com todas as armaduras, escudos e armas simples e marciais, além de proficiência em testes de resistência de Força e Constituição. Seus ataques com armas simples e marciais têm vantagem, cada acerto com arma causa 2d12 de dano energético extra e a ação de Ataque permite dois ataques (sem somar a Ataque Extra ou efeito semelhante). Quando a magia termina, faça um teste de resistência de Constituição CD 15; se falhar, sofre um nível de exaustão. (Simplificação: o treino em armadura, armas e resistências de Força e Constituição, e o cansaço do fim, não existem no jogo.)",
  "tom": 14
 },
 "passoTrovejante": {
  "id": "passoTrovejante",
  "name": "Passo Trovejante",
  "nomeOriginal": "Thunder Step",
  "level": 3,
  "school": "conjuração",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 90,
  "classes": [
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "teleporte",
  "mira": "casa",
  "damage": "3d10",
  "damageType": "trovejante",
  "save": "con",
  "levaUmAliado": true,
  "explosaoNaSaida": {
   "raioFt": 10,
   "save": "con",
   "tipo": "trovejante"
  },
  "upcast": {
   "dados": 1
  },
  "desc": "Você se teleporta para um espaço desocupado que consiga ver a até 27 m, e um estrondo audível a 90 m explode no ponto de onde saiu: cada criatura a até 3 m dali faz um teste de resistência de Constituição contra a sua CD, sofrendo 3d10 de dano trovejante se falhar ou metade se passar. Você leva o que conseguir carregar e pode levar junto uma criatura voluntária do seu tamanho ou menor que esteja a até 1,5 m, desde que haja espaço livre a até 1,5 m do destino para ela; caso contrário, ela fica para trás. Efeito instantâneo, só com componente verbal. Em círculo 4 ou maior, o dano aumenta 1d10 por círculo acima do 3º. (Simplificação: o aliado que vai junto é o mais ferido dos que estão colados.)",
  "tom": -4
 },
 "trovao": {
  "id": "trovao",
  "name": "Trovão",
  "nomeOriginal": "Thunderclap",
  "level": 0,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 5,
  "classes": [
   "bardo",
   "druida",
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "save",
  "save": "con",
  "shape": "sphere",
  "areaFt": 5,
  "centradoEmSi": true,
  "damage": "1d6",
  "damageType": "trovejante",
  "halfOnSave": false,
  "desc": "Truque de evocação: todas as outras criaturas a até 1,5 m de você fazem um teste de resistência de Constituição contra a CD da sua magia; quem falhar sofre 1d6 de dano trovejante. O estrondo é instantâneo e pode ser ouvido a até 30 m de distância. O dano aumenta para 2d6 no 5º nível de personagem, 3d6 no 11º e 4d6 no 17º.",
  "tom": 5
 },
 "ondaGigante": {
  "id": "ondaGigante",
  "name": "Onda Gigante",
  "nomeOriginal": "Tidal Wave",
  "level": 3,
  "school": "conjuração",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 120,
  "classes": [
   "druida",
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "save": "dex",
  "shape": "square",
  "areaFt": 20,
  "damage": "4d8",
  "damageType": "concussão",
  "halfOnSave": true,
  "onFail": {
   "condition": "caido"
  },
  "desc": "Uma onda de água desaba sobre uma área de até 9 m de comprimento, 3 m de largura e 3 m de altura, a até 36 m de você. Cada criatura na área faz um teste de resistência de Destreza: se falhar, sofre 4d8 de dano de concussão e fica caída; se passar, sofre metade do dano e permanece de pé. Em seguida a água se espalha e some, apagando chamas desprotegidas na área e a até 9 m dela. Efeito instantâneo, sem concentração. (Simplificação: a onda cai num quadrado de 6 m (no livro, 9 m por 3 m), e a água que apaga o fogo não existe no jogo.)",
  "tom": 0
 },
 "dobreFunebre": {
  "id": "dobreFunebre",
  "name": "Dobre Fúnebre",
  "nomeOriginal": "Toll the Dead",
  "level": 0,
  "school": "necromancia",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 60,
  "classes": [
   "clerigo",
   "bruxo",
   "mago"
  ],
  "kind": "save",
  "save": "wis",
  "damage": "1d8",
  "danoSeFerido": "1d12",
  "damageType": "necrótico",
  "halfOnSave": false,
  "desc": "Escolha uma criatura visível a até 18 m; um sino lúgubre ressoa ao redor dela e ela faz um teste de resistência de Sabedoria (CD de SAB). Se falhar, sofre 1d8 de dano necrótico, ou 1d12 se já estiver com menos que o máximo de PV. Efeito instantâneo. Como truque, o dado de dano aumenta em um nos níveis de personagem 5 (2d8/2d12), 11 (3d8/3d12) e 17 (4d8/4d12).",
  "tom": -4
 },
 "transmutarRocha": {
  "id": "transmutarRocha",
  "name": "Transmutar Rocha",
  "nomeOriginal": "Transmute Rock",
  "level": 5,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 120,
  "classes": [
   "druida",
   "mago"
  ],
  "kind": "save",
  "save": "str",
  "shape": "square",
  "areaFt": 40,
  "onFail": {
   "condition": "contido"
  },
  "zona": {
   "rodadas": 600,
   "quando": "nunca",
   "aoEntrar": false,
   "dificil4": true
  },
  "desc": "Escolha uma área visível de pedra ou lama, cabendo num cubo de 12 m, a até 36 m, e transforme-a de forma permanente (até ser dissipada). Rocha em lama: a pedra não mágica vira lama espessa, onde cada 0,3 m de deslocamento custa 1,2 m. Quem estiver no chão ao lançar, entrar na área pela primeira vez no turno ou terminar o turno nela faz teste de resistência de Força (CD de magia) e, se falhar, afunda e fica contido até gastar uma ação para se soltar; se lançada num teto, a lama desaba e quem estiver embaixo faz teste de Destreza, sofrendo 4d8 de concussão (metade se passar). Lama em rocha: lama ou areia movediça não mágica de até 3 m de profundidade vira pedra macia, e quem estiver dentro faz teste de Destreza: se passar, é empurrado à superfície num espaço livre; se falhar, fica contido. A criatura presa, ou outra ao alcance, pode usar uma ação para quebrar a pedra com teste de Força CD 20 ou causando dano a ela (CA 15, 25 PV, imune a veneno e psíquico). (Simplificação: no jogo é só a Rocha em Lama, e vale em qualquer chão: cada passo custa quatro vezes, e quem estava no chão ao conjurar afunda (contido, sai com Atletismo). A Lama em Rocha não existe no jogo.)",
  "tom": 14
 },
 "esferaVitriolica": {
  "id": "esferaVitriolica",
  "name": "Esfera Vitriólica",
  "nomeOriginal": "Vitriolic Sphere",
  "level": 4,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 150,
  "classes": [
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "save": "dex",
  "shape": "sphere",
  "areaFt": 20,
  "damage": "10d4",
  "damageType": "ácido",
  "halfOnSave": true,
  "onFail": {
   "danoAtrasado": "5d4"
  },
  "upcast": {
   "dados": 2
  },
  "desc": "Uma bola de ácido esmeralda voa até um ponto a até 45 m e explode, atingindo todas as criaturas numa esfera de 6 m de raio, que fazem um teste de resistência de Destreza. Quem falha sofre 10d4 de dano ácido na hora e mais 5d4 de dano ácido no fim do seu próximo turno; quem passa sofre só metade do dano inicial e nada depois. Efeito instantâneo, sem concentração. Em círculo 5 ou maior, o dano inicial aumenta em 2d4 por círculo acima do 4º.",
  "tom": 3
 },
 "muralhaDeLuz": {
  "id": "muralhaDeLuz",
  "name": "Muralha de Luz",
  "nomeOriginal": "Wall of Light",
  "level": 5,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 120,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "feiticeiro",
   "bruxo",
   "mago"
  ],
  "kind": "save",
  "save": "con",
  "shape": "muralha",
  "areaFt": 60,
  "damage": "4d8",
  "damageType": "radiante",
  "halfOnSave": true,
  "onFail": {
   "condition": "cego",
   "rounds": 10,
   "repete": true
  },
  "zona": {
   "rodadas": 100,
   "quando": "fim",
   "aoEntrar": false,
   "dificil": false,
   "semTeste": true,
   "barraVisao": true,
   "dano": {
    "dados": "4d8",
    "tipo": "radiante"
   }
  },
  "upcast": {
   "dados": 1
  },
  "desc": "Cria, a até 36 m, uma parede de luz de até 18 m de comprimento, 3 m de altura e 1,5 m de espessura, em qualquer orientação; ela bloqueia a visão mas pode ser atravessada, e ilumina 36 m com luz plena e mais 36 m com penumbra (concentração, até 10 minutos). Quem estiver na área ao surgir faz teste de resistência de Constituição: falha causa 4d8 de dano radiante e deixa cego por 1 minuto (novo teste ao fim de cada turno), sucesso causa metade sem cegueira; quem terminar o turno dentro dela sofre 4d8 radiante. Com uma ação, você dispara um raio da parede contra uma criatura visível a até 18 m dela (ataque de magia à distância, 4d8 radiante), e a parede encolhe 3 m a cada disparo, acertando ou não, acabando ao chegar a zero. Em círculo 6 ou maior, todo o dano aumenta 1d8 por círculo acima do 5º. (Simplificação: o raio de luz que a muralha dispara, encolhendo, não existe no jogo.)",
  "tom": 5
 },
 "muralhaDeAreia": {
  "id": "muralhaDeAreia",
  "name": "Muralha de Areia",
  "nomeOriginal": "Wall of Sand",
  "level": 3,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 90,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "mago"
  ],
  "kind": "save",
  "shape": "muralha",
  "areaFt": 30,
  "soZona": true,
  "zona": {
   "rodadas": 100,
   "quando": "nunca",
   "aoEntrar": false,
   "dificil": false,
   "dificil4": true,
   "semTeste": true,
   "barraVisao": true
  },
  "desc": "Ergue, num ponto visível a até 27 m, uma muralha de areia rodopiante com até 9 m de comprimento, 3 m de altura e 3 m de espessura, que dura enquanto você mantiver a concentração, por até 10 minutos. A muralha impede a visão através dela, mas não bloqueia a passagem. Quem estiver dentro dela fica cego e gasta 90 cm de deslocamento para cada 30 cm que avança ali. (Simplificação: a muralha tem uma casa de espessura (no livro, 3 m) e cobra quatro vezes o passo (no livro, três); cegar quem está dentro não existe no jogo.)",
  "tom": 14
 },
 "muralhaDeAgua": {
  "id": "muralhaDeAgua",
  "name": "Muralha de Água",
  "nomeOriginal": "Wall of Water",
  "level": 3,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 60,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "druida",
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "shape": "muralha",
  "areaFt": 30,
  "soZona": true,
  "zona": {
   "rodadas": 100,
   "quando": "nunca",
   "aoEntrar": false,
   "dificil": true,
   "semTeste": true
  },
  "desc": "Ergue, num ponto visível a até 18 m, uma parede de água com até 9 m de comprimento, 3 m de altura e 30 cm de espessura, ou um anel de até 6 m de diâmetro e 6 m de altura; seu espaço é terreno difícil e ela dura até 10 minutos (concentração). Ataques à distância com arma que a atravessam sofrem desvantagem, e efeitos de fogo que passam por ela causam metade do dano. Magias de dano de frio que a cruzam congelam o trecho atingido (no mínimo um quadrado de 1,5 m), e cada quadrado congelado tem CA 5 e 15 PV; se for destruído, a água não volta a preenchê-lo. (Simplificação: fica a água que custa o dobro do passo; o tiro com desvantagem, o fogo pela metade e o gelo que congela não existem no jogo.)",
  "tom": -7
 },
 "ventoProtetor": {
  "id": "ventoProtetor",
  "name": "Vento Protetor",
  "nomeOriginal": "Warding Wind",
  "level": 2,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 100,
  "classes": [
   "bardo",
   "druida",
   "feiticeiro",
   "mago"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "ventoProtetor",
  "desc": "Você se envolve num vendaval de cerca de 30 km/h que forma um raio de 3 m centrado em você e o acompanha por até 10 minutos (concentração). Dentro dele, você e todas as outras criaturas ficam surdas, chamas do tamanho de uma tocha ou menores que estejam desprotegidas se apagam, e névoas, gases e vapores que um vento forte dispersaria não conseguem entrar. A área é terreno difícil para todos menos você, e ataques à distância com armas que entrem ou saiam do vento têm desvantagem. (Simplificação: fica o tiro que passa pelo vento com desvantagem; a surdez, as chamas apagadas e o terreno difícil não existem no jogo.)",
  "tom": 4
 },
 "esferaAquosa": {
  "id": "esferaAquosa",
  "name": "Esfera Aquosa",
  "nomeOriginal": "Watery Sphere",
  "level": 4,
  "school": "conjuração",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 90,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "druida",
   "feiticeiro",
   "mago"
  ],
  "kind": "save",
  "save": "str",
  "shape": "sphere",
  "areaFt": 5,
  "emVoltaDaCasa": true,
  "onFail": {
   "condition": "contido"
  },
  "reuso": "acao",
  "zona": {
   "rodadas": 10,
   "quando": "fim",
   "aoEntrar": true,
   "dificil": false,
   "movel": 30
  },
  "desc": "Cria uma esfera de água com 1,5 m de raio em um ponto visível a até 27 m, que flutua no máximo 3 m acima do chão (concentração, até 1 minuto). Criaturas no espaço dela fazem teste de resistência de Força contra a sua CD: quem falha fica contido e envolvido pela água, repetindo o teste no fim de cada turno; quem passa é empurrado para fora (criaturas Enormes ou maiores passam automaticamente, e as demais podem escolher falhar). A esfera comporta até quatro criaturas Médias ou menores ou uma Grande; se exceder isso, uma aleatória cai caída ao lado. Com uma ação, você a move até 9 m em linha reta, levando os contidos e forçando novos testes em quem atingir; ao fim, ela desaba, apaga chamas comuns a até 9 m e deixa os contidos caídos. (Simplificação: quem fica contido sai com Atletismo, como da Teia. A esfera anda 9 m com a ação, mas não leva quem ela prendeu, e soltar a água no fim não existe no jogo.)",
  "tom": 14
 },
 "redemoinho": {
  "id": "redemoinho",
  "name": "Redemoinho",
  "nomeOriginal": "Whirlwind",
  "level": 7,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 300,
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
  "areaFt": 10,
  "damage": "10d6",
  "damageType": "concussão",
  "halfOnSave": true,
  "reuso": "acao",
  "zona": {
   "rodadas": 10,
   "quando": "inicio",
   "aoEntrar": true,
   "dificil": false,
   "semTeste": true,
   "movel": 30,
   "dano": {
    "dados": "10d6",
    "tipo": "concussão",
    "save": "dex",
    "metade": true
   }
  },
  "desc": "Cria, num ponto do chão visível a até 90 m, um cilindro de vento com 3 m de raio e 9 m de altura, que você pode deslocar até 9 m com sua ação; objetos Médios ou menores soltos e não carregados são sugados. Na primeira vez no turno em que uma criatura é atingida pelo redemoinho, ela faz um teste de resistência de Destreza, sofrendo 10d6 de dano de concussão se falhar ou metade se passar; criaturas Grandes ou menores que falharem também fazem um teste de Força ou ficam contidas dentro dele, subindo 1,5 m a cada início de turno, movendo-se com o vento e caindo quando a magia acaba. Com uma ação, a criatura contida pode fazer um teste de Força ou Destreza contra sua CD para escapar, sendo arremessada 3d6 × 3 m em direção aleatória. Concentração, até 1 minuto. (Simplificação: o redemoinho anda 9 m com a ação e fere quem está nele ou entra nele; prender e arrastar quem falha, e o arremesso de quem escapa, não existem no jogo.)",
  "tom": -4
 },
 "palavraDeRadiancia": {
  "id": "palavraDeRadiancia",
  "name": "Palavra de Radiância",
  "nomeOriginal": "Word of Radiance",
  "level": 0,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 5,
  "classes": [
   "clerigo"
  ],
  "kind": "save",
  "save": "con",
  "shape": "sphere",
  "areaFt": 5,
  "centradoEmSi": true,
  "soInimigos": true,
  "damage": "1d6",
  "damageType": "radiante",
  "halfOnSave": false,
  "desc": "Truque que exige um símbolo sagrado: ao pronunciar uma palavra divina, você escolhe quaisquer criaturas que esteja vendo a até 1,5 m de você. Cada uma faz um teste de resistência de Constituição contra a sua CD de magia e, se falhar, sofre 1d6 de dano radiante. O efeito é instantâneo. O dano sobe para 2d6 no 5º nível de personagem, 3d6 no 11º e 4d6 no 17º.",
  "tom": 0
 },
 "furiaDaNatureza": {
  "id": "furiaDaNatureza",
  "name": "Fúria da Natureza",
  "nomeOriginal": "Wrath of Nature",
  "level": 5,
  "school": "evocação",
  "fonte": "xge",
  "castTime": "action",
  "rangeFt": 120,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "druida",
   "patrulheiro"
  ],
  "kind": "livro",
  "efeito": "iraDaNatureza",
  "shape": "square",
  "areaFt": 60,
  "familiaSonora": "invocacao",
  "desc": "Escolha um ponto visível a até 36 m: a vegetação e as pedras num cubo de 18 m centrado ali ganham vida por até 1 minuto (concentração), e gramado ou mato no cubo vira terreno difícil para seus inimigos. No início de cada turno seu, inimigos a até 3 m de uma árvore do cubo sofrem 4d6 de dano cortante, a menos que passem num teste de resistência de Destreza; no fim de cada turno seu, uma criatura à sua escolha no chão do cubo faz teste de resistência de Força ou fica contida até a magia acabar, podendo usar uma ação para tentar se soltar com um teste de Força (Atletismo) contra a CD da magia. Com uma ação bônus, você arremessa uma pedra solta em uma criatura visível no cubo com um ataque mágico à distância: se acertar, causa 3d8 de dano de concussão não mágico, e o alvo fica caído se falhar num teste de resistência de Força. (Simplificação: o mato que deixa o chão difícil só para os inimigos não existe no jogo: o motor não tem terreno difícil de um lado só. As árvores que açoitam são as do mapa; as raízes prendem, no fim de cada turno de quem conjura, o inimigo da área mais perto dele.)",
  "tom": -7
 },
 "golpeDeZefiro": {
  "id": "golpeDeZefiro",
  "name": "Golpe de Zéfiro",
  "nomeOriginal": "Zephyr Strike",
  "level": 1,
  "school": "transmutação",
  "fonte": "xge",
  "castTime": "bonus",
  "rangeFt": 0,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "patrulheiro"
  ],
  "kind": "buff",
  "targets": 1,
  "condition": "golpeDeZefir",
  "desc": "Com uma ação bônus, você se torna ágil como o vento e, enquanto a magia durar (concentração, até 1 minuto), seu movimento não provoca ataques de oportunidade. Uma única vez durante a duração, no seu turno, você pode fazer um ataque com arma com vantagem; se acertar, ele causa 1d8 de dano energético extra. Acertando ou errando, seu deslocamento de caminhada aumenta em 9 m até o fim desse turno.",
  "tom": -7
 }
};
