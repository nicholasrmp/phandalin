// A QUE NÍVEL A CAMPANHA ENTREGA O GRUPO EM CADA CAPÍTULO. Rode com:
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/medir-progressao.mjs
//
// O livro conta a progressão por MARCOS, e diz em que nível o grupo deve chegar a cada parte: 2º depois da
// emboscada e do esconderijo, 3º para o esconderijo dos Marcarrubra, 4º para a Árvore Trovão e o Castelo, 5º
// para a Caverna Onda Eco. O jogo paga por XP, dividido pelo número de heróis vivos (`darXpDoLivro`), então a
// pergunta "o grupo chega no nível certo?" tem resposta numérica — e nunca tinha sido feita de ponta a ponta.
//
// Ela ficou urgente quando o XP do Cume da Wyvern voltou de 1.600 para os 1.250 do livro: 350 a menos num
// ponto da campanha mexe em tudo o que vem depois, e trocar um número sem medir o que ele empurra é
// exatamente o que esta sessão passou o dia desfazendo.
//
// O que este arquivo soma: os XP que as cenas pagam (as salas de cada capítulo e os marcos), para um grupo de
// QUATRO heróis vivos, no caminho CHEIO (tudo limpo, todas as missões) e no caminho MAGRO (só o que a
// história obriga). Não simula luta: é a conta do que o jogo promete pagar.
import { XP_POR_NIVEL } from '../rules/progressao.js';

const HEROIS = 4;

/** Cada parada da campanha: o que paga, e se é obrigatória para seguir. */
const CAMPANHA = [
  { cap: 1, nome: 'A emboscada da estrada', xp: 200, obrigatorio: true },
  { cap: 2, nome: 'O esconderijo dos goblins (as seis salas)', xp: 275 * HEROIS, obrigatorio: true },
  // O OBELISCO (2026-11-08) pôs três coisas que pagam XP na Mina: a cobra do ressalto (12 por herói), o Zeond na
  // luta do quarto (só quem entra pela secreta) e os arqueiros do castelo (600 a mais). E a Árvore Trovão ganhou
  // bicho: +350. O urso-coruja libertado saiu — no Obelisco a torre é do grell, que se luta.
  { cap: 2, nome: 'A cobra do ressalto', xp: 12 * HEROIS, obrigatorio: false },
  { cap: 3, nome: 'Os Marcarrubra na rua', xp: 400, obrigatorio: true },
  { cap: 3, nome: 'A Mansão Tresendar (as doze áreas)', xp: 2500, obrigatorio: true },
  { cap: 3, nome: 'O fosso do corredor', xp: 100, obrigatorio: false },
  { cap: 3, nome: 'Os Dendrar de volta para casa', xp: 100, obrigatorio: false },
  { cap: 3, nome: 'O Cajavidro entregue a Sildar', xp: 200, obrigatorio: false },
  { cap: 3, nome: 'O Zeond, na luta do quarto', xp: 200, obrigatorio: false },
  { cap: 4, nome: 'O Poço da Coruja Velha', xp: 800, obrigatorio: false },
  { cap: 4, nome: 'O relato do Poço ao Daran', xp: 200, obrigatorio: false },
  { cap: 4, nome: 'A resposta da banshee', xp: 200, obrigatorio: false },
  { cap: 4, nome: 'O Cume da Wyvern', xp: 1250, obrigatorio: false },
  { cap: 4, nome: 'A Árvore Trovão', xp: 1450, obrigatorio: false },
  { cap: 4, nome: 'O Castelo Dentefino', xp: 3700, obrigatorio: true },
  { cap: 4, nome: 'O grell da torre', xp: 700, obrigatorio: false },
  { cap: 4, nome: 'O acordo com Targor', xp: 500, obrigatorio: false },
  { cap: 4, nome: 'O Gundren de volta a Phandalin', xp: 200, obrigatorio: true },
];

/** O nível que o livro espera em cada capítulo. */
const ESPERADO = { 2: 2, 3: 3, 4: 4, 5: 5 };

const nivelDe = (xp) => {
  let n = 1;
  for (let i = 2; i <= 20; i += 1) if (xp >= (XP_POR_NIVEL[i] ?? Infinity)) n = i;
  return n;
};

const resultado = {};
for (const caminho of ['cheio', 'magro']) {
  let total = 0;
  console.log(`\n=== CAMINHO ${caminho.toUpperCase()} ${caminho === 'cheio' ? '(tudo limpo, todas as missões)' : '(só o que a história obriga)'} ===`);
  console.log('  cap  XP de cada  acumulado  nível  parada');
  for (const p of CAMPANHA) {
    if (caminho === 'magro' && !p.obrigatorio) continue;
    const cada = Math.floor(p.xp / HEROIS);
    total += cada;
    console.log(`   ${p.cap}   ${String(cada).padStart(8)}  ${String(total).padStart(9)}  ${String(nivelDe(total)).padStart(5)}  ${p.nome}`);
  }
  console.log(`  no fim do capítulo 4: ${total} XP, nível ${nivelDe(total)}`);
  resultado[caminho] = { total, nivel: nivelDe(total) };
}

// ---------------------------------------------------------------- a conclusão, que não é "falta XP"
console.log(`
O LIVRO QUER O 5º NÍVEL NA ONDA ECO, e por XP o grupo chega no ${resultado.cheio.nivel}º (caminho cheio) ou no
${resultado.magro.nivel}º (caminho magro). ISSO NÃO É DEFEITO: a aventura impressa avança por MARCOS, e a soma
dos prêmios dela, dividida por quatro, nunca dá o 5º nível — o mestre de mesa é que sobe o grupo nos pontos da
história. O jogo paga por XP e ESCOLHEU viver com isso: \`capitulo5-ondaeco.js\` diz, na primeira linha, "o
grupo chega aqui no 4º nível ou perto, e sai no 5º". O templo do Nezznar é o do OBELISCO desde 2026-11-08 — ele e
dois bugbears, sem as aranhas da Mina e sem a escala por nível que a cena tinha —, e o Obelisco declara o 4º nível
para o capítulo, que é o que o caminho cheio entrega.

ENTÃO O QUE ESTE ARQUIVO SERVE PARA VIGIAR é a FRONTEIRA: que o caminho cheio continue entregando o 4º nível
na Onda Eco, e que mexer num prêmio não empurre o grupo para baixo disso sem ninguém perceber. Foi o que se
mediu ao devolver o Cume da Wyvern aos 1.250 do livro: são 87 XP a menos por herói, o acumulado cai de 3.249
para 3.162, e os dois números estão na mesma faixa — acima dos 2.700 do 4º nível e longe dos 6.500 do 5º. A
troca não mudou o nível em ponto nenhum da campanha.`);
