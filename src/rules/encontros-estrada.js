// A tabela de encontros da Trilha Triboar e o teste que a dispara.
//
// Mora aqui, e não em `game/regiao.js`, porque é regra: o mapa da região
// importa a pintura dele, e um arquivo de imagem impede que os testes carreguem
// o módulo em Node.
//
// A REGRA: um teste por período (dia e noite). d20; 17 a 20 é encontro, e um
// d12 na tabela diz o quê. `qtd` é a rolagem do número de criaturas, como
// [dados, faces, bônus]. `dia`/`noite` são as faixas do d12 em cada período
// (null quer dizer que aquele bando não aparece naquele período).

export const ENCONTROS = [
  { id: 'stirge', nome: 'stirges', dia: [1, 2], noite: [1, 3], qtd: [1, 8, 2] },
  { id: 'ghoul', nome: 'carniçais', dia: null, noite: [4, 4], qtd: [1, 4, 1] },
  { id: 'ogro', nome: 'um ogro', dia: [3, 4], noite: null, qtd: [0, 0, 1] },
  { id: 'goblin', nome: 'goblins', dia: [5, 6], noite: [5, 5], qtd: [1, 6, 3] },
  { id: 'hobgoblin', nome: 'hobgoblins', dia: [7, 8], noite: [6, 6], qtd: [1, 4, 2] },
  { id: 'orc', nome: 'orcs', dia: [9, 10], noite: [7, 8], qtd: [1, 4, 2] },
  { id: 'lobo', nome: 'lobos', dia: [11, 11], noite: [9, 10], qtd: [1, 4, 2] },
  { id: 'corujaUrso', nome: 'um urso-coruja', dia: [12, 12], noite: [11, 12], qtd: [0, 0, 1] },
];

/** A barra do d20: de 17 para cima é encontro. */
export const BARRA_DE_ENCONTRO = 17;

const rolar = (rng, faces) => 1 + Math.floor(rng() * faces);

/**
 * O encontro do período, ou null. `rng()` devolve [0, 1).
 *
 * `ajuste` é o que o acampamento esconde (ou entrega): ele sobe ou desce a
 * barra do d20. Acampamento bem escondido sobe; fogueira acesa desce
 * (`rules/acampamento.js`).
 */
export function sortearEncontro(rng, periodo, { ajuste = 0 } = {}) {
  // A barra para em 20: nem o acampamento mais escondido fica imune. Um
  // natural 20 sempre acha alguém — 5% de chance, que é o piso da noite.
  const barra = Math.max(2, Math.min(20, BARRA_DE_ENCONTRO + ajuste));
  if (rolar(rng, 20) < barra) return null;
  const d = rolar(rng, 12);
  const e = ENCONTROS.find((x) => x[periodo] && d >= x[periodo][0] && d <= x[periodo][1]);
  if (!e) return null;
  const [n, f, b] = e.qtd;
  let qtd = b;
  for (let i = 0; i < n; i++) qtd += rolar(rng, f);
  return { id: e.id, nome: e.nome, qtd, periodo };
}
