// AS GEMAS E OS OBJETOS DE ARTE DO TESOURO DO LIVRO DO MESTRE, pelo valor. O livro sorteia uma pedra ou uma peça numa
// tabela de nomes por faixa de valor; o jogo guarda a faixa, que é o que pesa na hora de vender (o Câmbio de Minério paga
// o valor cheio do `tesouro`). Saem do sorteio de `rules/tesouro.js`.
const peca = (id, name, custo, desc, art) => ({ id, name, tipo: 'tesouro', pilha: true, peso: 0, custo, fonte: 'dmg', art, desc });

export const GEMAS_DO_LIVRO = Object.fromEntries([10, 50, 100, 500, 1000, 5000].map((v) => [`gema${v}`,
  peca(`gema${v}`, `Gema de ${v} po`, v, `Uma pedra lapidada que vale ${v} peças de ouro na mão de quem entende.`, 'item-gemaElemental')]));

export const ARTE_DO_LIVRO = Object.fromEntries([25, 250, 750, 2500, 7500].map((v) => [`arte${v}`,
  peca(`arte${v}`, `Objeto de arte de ${v} po`, v, `Uma peça trabalhada (um cálice, uma estatueta, um broche) que vale ${v} peças de ouro.`, 'item-estatuetaDeSapo')]));
