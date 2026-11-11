// AS MAGIAS DE EXPLORAÇÃO DOS LIVROS (o PHB) no sistema de magia fora da luta (`rules/utilidade.js`). Os campos são os
// de `UTIL` (alvo, duração em minutos, concentração, efeito, tempo de conjuração); `utilidade.js` soma esta tabela à
// dele. A regra de cada efeito mora lá; o texto, em `game/magias-fora-livros.js`; a viagem, em `game/viagem-magica.js`.
//
// O que cada uma faz NO JOGO, dito aqui uma vez:
//   - as PERGUNTAS (Adivinhação: uma; Contatar Outro Plano: cinco, com o risco da Inteligência; Comunhão com a Natureza:
//     o que espera e o que está armado no lugar) respondem pelo que a cena sabe — a mesma conta da Comunhão do paladino;
//   - o OLHO (Olho Arcano, Vidência) é o da Clarividência, só de ver;
//   - Localizar Criatura marca no mapa o inimigo escondido mais perto;
//   - a PALAVRA a distância (Telepatia, Vínculo Telepático) é a do Enviar Mensagem;
//   - as GUARDAS do lugar (Cão Fiel, Santuário Particular, Consagrar, Proibição, Vigilância e Proteção) são o Alarme:
//     ninguém pega o grupo de surpresa ali; a Mansão Magnífica é o abrigo da Pequena Cabana, com o banquete;
//   - Aparência Enganosa disfarça o grupo inteiro; Lábia faz do d20 um 15 nos testes de Carisma; Missão (Geas) faz o
//     NPC ceder ao teste social, como a Sugestão, por trinta dias; Modificar Memória apaga o que ele lembra do grupo;
//   - Ressurreição, Ressurreição Verdadeira e Reencarnação trazem de volta, como o Reviver os Mortos, com ou sem a
//     penalidade; Regeneração devolve todos os PV; Banquete de Heróis dá o dia inteiro de imunidade, vantagem e PV a mais;
//     Presciência é a condição de combate, que dura oito horas e entra na luta;
//   - a VIAGEM (Teletransporte, Palavra de Recordação, Transporte pelas Plantas, Caminhar no Vento) se faz na tela da
//     região, não na cena (`soNaRegiao`);
//   - as que mudariam o mundo de um jeito que o tabuleiro ainda não guarda (moldar a rocha, mover a terra, a água e o
//     clima, criar objetos, ilusões de lugar, o baú, o sonho) NÃO ESTÃO NO JOGO: o dono pediu que a magia que só se
//     narraria ficasse de fora até haver o que ela mude. Estão na fila do importador (`magias/phb-pendente.json`).
export const UTIL_DOS_LIVROS = {
  // ---- as perguntas
  adivinhacao: { alvo: 'si', min: 1, efeito: 'comunhao', perguntas: 1, escolhe: 'perguntas', ritual: true, tempo: 1 },
  contatarOutroPlano: { alvo: 'si', min: 1, efeito: 'comunhao', perguntas: 5, escolhe: 'perguntas', ritual: true, tempo: 1, riscoInt: 15 },
  comunhaoComANatureza: { alvo: 'si', min: 1, efeito: 'comunhao', perguntasFixas: ['espera', 'armadilha'], ritual: true, tempo: 1 },
  lendasEHistorias: { alvo: 'criatura', efeito: 'lenda', tempo: 10, alcance: 1000 },
  // ---- o olho e a marca
  olhoArcano: { alvo: 'area', min: 60, conc: true, efeito: 'olho', sentidoFixo: 'ver' },
  videncia: { alvo: 'area', min: 10, conc: true, efeito: 'olho', sentidoFixo: 'ver', tempo: 10 },
  localizarCriatura: { alvo: 'si', min: 60, conc: true, efeito: 'localizarCriatura' },
  // ---- a palavra a distância
  telepatia: { alvo: 'si', min: 1440, efeito: 'mensagem', escolhe: 'conhecido' },
  vinculoTelepaticoDeRary: { alvo: 'si', min: 60, efeito: 'mensagem', escolhe: 'conhecido', ritual: true },
  // ---- as guardas do lugar e o abrigo
  caoFielDeMordenkainen: { alvo: 'area', min: 480, efeito: 'alarme' },
  santuarioParticularDeMordenkainen: { alvo: 'area', min: 1440, efeito: 'alarme', tempo: 10 },
  consagrar: { alvo: 'area', min: 10 * 365 * 24 * 60, efeito: 'alarme', tempo: 1440 },
  proibicao: { alvo: 'area', min: 1440, efeito: 'alarme', ritual: true, tempo: 10 },
  vigilanciaEProtecao: { alvo: 'area', min: 1440, efeito: 'alarme', tempo: 10 },
  mansaoMagnificaDeMordenkainen: { alvo: 'si', min: 1440, efeito: 'cabana', banquete: true, tempo: 1 },
  // ---- a conversa
  aparenciaEnganosa: { alvo: 'grupo', min: 480, efeito: 'disfarce', dialogo: true },
  labia: { alvo: 'si', min: 60, efeito: 'labia', dialogo: true },
  missao: { alvo: 'criatura', min: 30 * 1440, efeito: 'sugestao', save: 'wis', dialogo: true, tempo: 1, alcance: 60, naoAcaba: true },
  modificarMemoria: { alvo: 'criatura', min: 1, conc: true, efeito: 'memoria', save: 'wis', dialogo: true, alcance: 30 },
  // ---- a vida
  ressurreicao: { alvo: 'morto', efeito: 'reviver', tempo: 60, penalidade: 4 },
  ressurreicaoVerdadeira: { alvo: 'morto', efeito: 'reviver', tempo: 60, penalidade: 0 },
  reencarnacao: { alvo: 'morto', efeito: 'reviver', tempo: 60, penalidade: 0, corpoNovo: true },
  regeneracao: { alvo: 'aliado', efeito: 'regenerar', tempo: 1 },
  banqueteDeHerois: { alvo: 'grupo', min: 1440, efeito: 'banqueteDosHerois', tempo: 10 },
  presciencia: { alvo: 'aliado', cond: 'presciencia', min: 480, tempo: 1 },
  // ---- a viagem (na tela da região)
  teletransporte: { alvo: 'si', efeito: 'viagem', soNaRegiao: true },
  palavraDeRecordacao: { alvo: 'si', efeito: 'viagem', soNaRegiao: true },
  transportePelasPlantas: { alvo: 'si', efeito: 'viagem', soNaRegiao: true },
  caminharNoVento: { alvo: 'grupo', efeito: 'viagem', soNaRegiao: true, tempo: 1 },
};
