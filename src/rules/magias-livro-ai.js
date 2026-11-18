// GERADO por src/dev/importar-magias.mjs ai — não editar à mão: mude o conversor e rode de novo.
// Os números saem do dado do livro; o texto, de src/dev/magias/ai-pt.json, com as nossas palavras.
export const MAGIAS_AI = {
 "incitarCobica": {
  "id": "incitarCobica",
  "name": "Incitar Cobiça",
  "nomeOriginal": "Incite Greed",
  "level": 3,
  "school": "encantamento",
  "fonte": "ai",
  "castTime": "action",
  "rangeFt": 30,
  "concentration": true,
  "duracaoRodadas": 10,
  "classes": [
   "clerigo",
   "feiticeiro",
   "mago",
   "bruxo"
  ],
  "kind": "livro",
  "efeito": "incitarCobica",
  "save": "wis",
  "desc": "Encantamento de 3º círculo: você mostra uma gema, e cada criatura que escolher a até 9 m e que veja você faz um teste de Sabedoria; quem falha fica enfeitiçado enquanto durar a concentração, até 1 minuto, ou até você ou um companheiro lhe fazer mal. Enfeitiçada assim, ela não faz nada além de usar o deslocamento para chegar perto de você sem se arriscar, e a 1,5 m de você fica parada, de olho na gema. No fim de cada turno dela, repete o teste e, passando, se livra. (Simplificação: pega os inimigos a até 9 m que veem quem conjura. Quem está enfeitiçado pela gema não age nem reage, e a IA só o faz andar até ela.)",
  "tom": 9
 },
 "moedaBrilhanteDeJim": {
  "id": "moedaBrilhanteDeJim",
  "name": "Moeda Brilhante de Jim",
  "nomeOriginal": "Jim's Glowing Coin",
  "level": 2,
  "school": "encantamento",
  "fonte": "ai",
  "castTime": "action",
  "rangeFt": 60,
  "duracaoRodadas": 10,
  "classes": [
   "mago"
  ],
  "kind": "livro",
  "efeito": "moedaBrilhante",
  "mira": "casa",
  "save": "wis",
  "desc": "Encantamento de 2º círculo: você joga a moeda num ponto a até 18 m, e ela acende como a magia Luz. Cada criatura que você escolher e veja a até 9 m da moeda faz um teste de Sabedoria; quem falha fica distraída por 1 minuto, com desvantagem em Sabedoria (Percepção) e na iniciativa. (Simplificação: a moeda pega os inimigos a até 9 m dela que quem conjura vê. A iniciativa aqui é do lado: ela só sai com desvantagem se o lado inteiro estiver distraído.)",
  "tom": 14
 },
 "missilMagicoDeJim": {
  "id": "missilMagicoDeJim",
  "name": "Míssil Mágico de Jim",
  "nomeOriginal": "Jim's Magic Missile",
  "level": 1,
  "school": "evocação",
  "fonte": "ai",
  "castTime": "action",
  "rangeFt": 120,
  "classes": [
   "mago"
  ],
  "kind": "raios",
  "raios": 3,
  "upcast": {
   "raios": 1
  },
  "damage": "2d4",
  "damageType": "energético",
  "dardosDeJim": true,
  "desc": "Evocação de 1º círculo: três dardos de energia, cada um contra uma criatura que você veja a até 36 m, cada um com a sua jogada de ataque à distância de magia; o que acerta causa 2d4 de dano de energia, e o crítico causa 5d4 no lugar de dobrar os dados. Se algum dado de ataque der 1, todos erram e estouram em você, 1 de dano de energia por dardo. Em círculo maior, um dardo a mais por círculo acima do 1º. (Simplificação: cada dardo vai num alvo à escolha; as jogadas saem todas antes do dano, e um 1 natural em qualquer uma estoura todos em quem conjurou.)",
  "tom": 5
 }
};
