// A MECÂNICA DAS MAGIAS DO ACQUISITIONS INCORPORATED QUE O MOTOR CONJURA, escrita à mão e conferida contra o livro (o
// mesmo contrato de `ajustes-phb.mjs`: a chave é o nome em inglês, os campos são os de `rules/spells.js`, e `nota` é a
// simplificação dita na cara). Só entram as duas que o Jim Darkmagic do bestiário conjura e o tabuleiro sabe fazer; o
// resto fica na fila (`magias/ai-pendente.json`), com o motivo. O texto em português foi escrito à mão, sem a API: são
// sete magias.
export const AJUSTES_AI = {
  "Jim's Glowing Coin": {
    kind: 'livro', efeito: 'moedaBrilhante', mira: 'casa', rangeFt: 60, save: 'wis', duracaoRodadas: 10,
    nota: 'A moeda pega os inimigos a até 9 m dela que quem conjura vê. A iniciativa aqui é do lado: ela só sai com desvantagem se o lado inteiro estiver distraído.',
  },
  'Incite Greed': {
    kind: 'livro', efeito: 'incitarCobica', save: 'wis', concentration: true, duracaoRodadas: 10,
    nota: 'Pega os inimigos a até 9 m que veem quem conjura. Quem está enfeitiçado pela gema não age nem reage, e a IA só o faz andar até ela.',
  },
  "Jim's Magic Missile": {
    kind: 'raios', raios: 3, upcast: { raios: 1 }, damage: '2d4', damageType: 'energético', dardosDeJim: true,
    nota: 'Cada dardo vai num alvo à escolha; as jogadas saem todas antes do dano, e um 1 natural em qualquer uma estoura todos em quem conjurou.',
  },
};
