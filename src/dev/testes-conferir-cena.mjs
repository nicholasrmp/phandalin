// PROVA QUE `conferir-cena.mjs` ACUSA. Rode com:
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-conferir-cena.mjs
//
// Um conferidor que nunca acusa nada é indistinguível de um conferidor quebrado, e este já passou por isso:
// a conta de "chão que ninguém alcança" existia no gerador da Onda Eco, imprimia "6" todo dia, e ninguém
// lia. Aqui cada defeito que o conferidor sabe achar é FABRICADO de propósito num mapa de mentira, e o teste
// exige que ele apareça. `testes-paredes.mjs` faz o mesmo por `conferir-paredes.mjs`.
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { montarCampo } = await import(P + 'game/campo.js');
const { ARESTA, footprintOf } = await import(P + 'core/grid.js');

let falhas = 0;
let total = 0;
function teste(nome, fn) {
  total += 1;
  try { fn(); console.log(`ok    ${nome}`); } catch (e) { falhas += 1; console.log(`FALHA ${nome}\n      ${e.message}`); }
}

/** Um mapa pequeno de mentira, com o terreno que o teste pedir. */
const mapaDe = (linhas, extra = {}) => ({
  terreno: linhas,
  luz: linhas.map((l) => '0'.repeat(l.length)),
  grupo: [{ x: 1, y: 1 }],
  ...extra,
});

// O glifo de cada superfície que estes testes usam, lido do próprio motor: se alguém trocar a letra do
// fosso, o teste quebra aqui em vez de passar medindo a coisa errada.
const SUP = {};
{
  const l = ['_____', '_O|R_', '_____'];
  const f = montarCampo(mapaDe(l));
  SUP.fosso = f.surfaceAt(1, 1);
  SUP.agua = f.surfaceAt(2, 1);
  SUP.rocha = f.surfaceAt(3, 1);
}

teste('os glifos de fosso, água funda e rocha são os que estes testes usam', () => {
  assert.equal(SUP.fosso, 'fosso', `'O' é ${SUP.fosso}`);
  assert.equal(SUP.agua, 'aguaEscura', `'|' é ${SUP.agua}`);
  assert.equal(SUP.rocha, 'rocha', `'R' é ${SUP.rocha}`);
});

teste('o fosso ISOLA uma casa de chão, e o motor enxerga isso', () => {
  // a casa (2,1) é chão, tem rocha em três lados e um FOSSO no quarto: ninguém pisa nela. É o caso exato da
  // Onda Eco, e é o que a conta de componentes sobre "chão" NÃO pega, porque lá o fosso conta como chão.
  const g = montarCampo(mapaDe(['RRRRR', 'R_O_R', 'RRRRR']));
  assert.ok(!g.blocksMove(3, 1), 'a casa do outro lado do fosso é chão');
  assert.ok(g.blocksMove(2, 1), 'o fosso barra o passo');
  const alc = g.reachable({ x: 1, y: 1 }, 10000);
  assert.ok(alc.has('1,1'), 'o grupo alcança a própria casa');
  assert.ok(!alc.has('3,1'), 'e NÃO alcança a casa do outro lado do fosso');
});

teste('a água funda NÃO isola: atravessa-se a nado, e isso é medida e não suposição', () => {
  // Medido aqui porque eu supus o contrário ao escrever o conferidor: o fosso barra o passo, a água funda
  // não. Quem quiser cruzar o lago escuro da área 10 da Onda Eco pode — devagar, que é terreno difícil —, e
  // por isso a conta de casas isoladas só precisa olhar o FOSSO.
  const g = montarCampo(mapaDe(['RRRRR', 'R_|_R', 'RRRRR']));
  assert.ok(!g.blocksMove(2, 1), 'a água funda não barra o passo');
  assert.ok(g.reachable({ x: 1, y: 1 }, 10000).has('3,1'), 'e dá para chegar ao outro lado dela');
});

teste('a porta FECHADA não isola: o conferidor abre todas antes de contar', () => {
  // é por isso que a conta roda com as portas abertas: "está trancado" não é "ninguém chega aqui nunca"
  const g = montarCampo(mapaDe(['RRRRR', 'R___R', 'RRRRR'],
    { paredes: { o: ['.....', '...+.', '.....'], n: ['.....', '.....', '.....'] } }));
  assert.equal(g.paredeO[1 * 5 + 3], ARESTA.porta, 'a porta está onde o teste a pôs');
  assert.ok(!g.reachable({ x: 1, y: 1 }, 10000).has('3,1'), 'fechada, ela separa');
  g.porAresta(2, 1, 3, 1, ARESTA.aberta);
  assert.ok(g.reachable({ x: 1, y: 1 }, 10000).has('3,1'), 'aberta, não separa mais');
});

teste('a PEGADA de uma criatura Grande é 2x2, e a âncora livre não garante as outras três', () => {
  // Foi assim que o ogro Gog, do Cume da Wyvern, nasceu dormindo EM CIMA DO BAÚ do bando: ancorado em (4,10),
  // com (4,10), (5,10) e (4,11) livres, e (5,11) sendo o caixote, que barra o passo. A conta de inimigo do
  // conferidor e a prova do gerador olhavam só a âncora, então nenhuma das duas via.
  assert.equal(footprintOf('grande'), 2, 'Grande ocupa 2x2');
  assert.equal(footprintOf('enorme'), 3);
  assert.equal(footprintOf('médio'), 1, 'Médio, Pequeno e Miúdo dividem o mesmo quadrado');
  const g = montarCampo(mapaDe(['RRRRR', 'R___R', 'R__RR', 'RRRRR']));
  const cabe = (x, y, lado) => {
    for (let dy = 0; dy < lado; dy += 1) for (let dx = 0; dx < lado; dx += 1) {
      if (!g.inside(x + dx, y + dy) || g.blocksMove(x + dx, y + dy)) return false;
    }
    return true;
  };
  assert.ok(!g.blocksMove(2, 1), 'a âncora (2,1) está livre');
  assert.ok(cabe(2, 1, 1), 'e um Médio cabe nela');
  assert.ok(g.blocksMove(3, 2), 'mas (3,2) é rocha');
  assert.ok(!cabe(2, 1, 2), 'então um Grande ancorado em (2,1) NÃO cabe — é o caso do Gog');
  assert.ok(cabe(1, 1, 2), 'ancorado uma casa a oeste, cabe');
});

console.log(`\n${total - falhas}/${total} passaram`);
process.exit(falhas ? 1 : 0);
