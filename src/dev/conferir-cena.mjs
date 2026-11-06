// CONFERE UMA CENA INTEIRA: parede, porta, luz e objeto interagível, medindo no motor.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/conferir-cena.mjs [cena...]
//
// Sem argumento, passa por todas. `conferir-paredes.mjs` já cuida da geometria da parede e da porta em todas
// as cenas; este aqui olha o resto, que não tinha quem olhasse — e nasceu de uma revisão da Árvore Trovão em
// que uma varredura assim achou três defeitos de uma vez:
//
//   - uma PRATELEIRA em cima da tocha da estalagem (luz dentro de móvel não é luz, é defeito);
//   - a fumaça venenosa do dragão oferecendo "Apagar a vela" no botão direito (não se abafa veneno);
//   - portas sem `folhas`, que é o que faz `capitulo.portasDaCasa` oferecer abrir e fechar — sem a lista,
//     NENHUMA porta da cena abre, e a Árvore Trovão e o Castelo estavam assim, 41 portas congeladas.
//
// O que ele NÃO julga: se o nome do prédio está certo, se o texto combina com o desenho, se o encontro é
// bom. Isso é trabalho de revisor, não de conta.
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { montarCampo } = await import(P + 'game/campo.js');
const { ARESTA } = await import(P + 'core/grid.js');
const { mapaDo, CENAS } = await import(P + 'game/encounter.js');

const nome = Object.fromEntries(Object.entries(ARESTA).map(([k, v]) => [v, k]));
const K = (x, y) => `${x},${y}`;

const TODAS = CENAS ?? ['emboscada', 'ermo', 'ermoNoite', 'rua', 'esconderijo', 'mansao', 'mansaoTunel',
  'poco', 'cume', 'castelo', 'arvoreTrovao', 'ondaEco',
  'casaDaMorte1', 'casaDaMorte2', 'casaDaMorte3', 'casaDaMorte4', 'casaDaMortePorao1', 'casaDaMortePorao2'];

// A CHAMA MORA DENTRO DO QUE A SEGURA, e isso não é defeito: braseiro, fogueira e lareira barram o passo e
// têm fogo dentro, de propósito. Medido em quatro casos — o braseiro e o braseiro verde da Onda Eco, a
// fogueira do acampamento do Ermo de noite e a lareira da cabana de Árvore Trovão. O que é defeito é a luz
// dentro de um móvel QUALQUER: a tocha da estalagem de Árvore Trovão tinha ganhado uma prateleira em cima.
const SEGURA_FOGO = /fogueira|braseiro|lareira|fogao|tocha|vela|lampiao/i;
const guardaChama = (f, mapa, p) => SEGURA_FOGO.test(f.surfaceAt(p.x, p.y))
  || (mapa.objetos ?? []).some((o) => o.x === p.x && o.y === p.y && SEGURA_FOGO.test(o.variante ?? ''));

const alvos = process.argv.slice(2).filter((a) => !a.startsWith('-'));
let achados = 0;

for (const cena of (alvos.length ? alvos : TODAS)) {
  let mapa;
  try { mapa = mapaDo(cena); } catch (e) { console.log(`${cena.padEnd(20)} (não abre: ${e.message})`); continue; }
  if (!mapa) continue;
  const f = montarCampo(mapa);
  const linhas = [];

  // --- PAREDE: arestas por tipo, e chão que ninguém alcança com as portas abertas
  const tipos = {};
  const portas = [];
  for (let y = 0; y < f.h; y += 1) for (let x = 0; x < f.w; x += 1) {
    const i = y * f.w + x;
    for (const [c, lado] of [[f.paredeN[i], 'N'], [f.paredeO[i], 'O']]) {
      if (!c) continue;
      tipos[nome[c] ?? c] = (tipos[nome[c] ?? c] ?? 0) + 1;
      if (c === ARESTA.porta) portas.push(lado === 'N' ? [{ x, y: y - 1 }, { x, y }] : [{ x: x - 1, y }, { x, y }]);
    }
  }
  // A conta de "chão que ninguém alcança" NÃO vem para cá: é de `conferir-paredes.mjs`, que sabe o que o
  // roteiro abre (as secretas da Mansão, o segredo da prisão, as lajes das criptas). Sem esse saber, a mesma
  // conta aqui acusava 500 casas de falso positivo.

  // --- PORTA: cada uma precisa de folha, senão o menu de abrir/fechar não existe
  const folhas = new Set((mapa.folhas ?? []).flatMap(([a, b]) => [`${a.x},${a.y},${b.x},${b.y}`, `${b.x},${b.y},${a.x},${a.y}`]));
  for (const [a, b] of portas) {
    if (!folhas.has(`${a.x},${a.y},${b.x},${b.y}`)) linhas.push(`porta sem folha em (${a.x},${a.y})-(${b.x},${b.y}): não abre nem fecha`);
    if (f.blocksMove(a.x, a.y) || f.blocksMove(b.x, b.y)) linhas.push(`porta no maciço em (${a.x},${a.y})-(${b.x},${b.y})`);
  }

  // --- LUZ: casa livre (ou móvel declarado), e quem não é chama não ganha botão de apagar
  for (const l of mapa.luzes ?? []) {
    if (f.blocksMove(l.pos.x, l.pos.y) && !guardaChama(f, mapa, l.pos)) {
      linhas.push(`luz em casa bloqueada em (${l.pos.x},${l.pos.y}): mora dentro de um móvel que não segura fogo`);
    }
    const temVizinha = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]
      .some(([dx, dy]) => f.inside(l.pos.x + dx, l.pos.y + dy) && !f.blocksMove(l.pos.x + dx, l.pos.y + dy)
        && f.contato({ x: l.pos.x + dx, y: l.pos.y + dy }, l.pos));
    if (!temVizinha) linhas.push(`luz sem casa livre encostada em (${l.pos.x},${l.pos.y}): ninguém a apaga`);
  }

  // --- OBJETO: a peça de mobília tem de cair em casa de superfície `prop`
  for (const o of mapa.objetos ?? []) {
    if (o.tipo !== 'prop') continue;
    const sup = f.surfaceAt(o.x, o.y);
    // a peça que é fogo pousa na superfície do fogo (a fogueira do acampamento), e isso é certo
    if (!['prop', 'propBaixo'].includes(sup) && !SEGURA_FOGO.test(sup)) {
      linhas.push(`peça ${o.variante} em (${o.x},${o.y}) com superfície ${sup}: o menu não a vê`);
    }
  }

  const resumo = `${String(Object.values(tipos).reduce((a, b) => a + b, 0)).padStart(4)} arestas (${portas.length} portas)`
    + ` · ${String((mapa.luzes ?? []).length).padStart(2)} luz(es) · ${String((mapa.objetos ?? []).filter((o) => o.tipo === 'prop').length).padStart(3)} peça(s)`;
  console.log(`${cena.padEnd(20)} ${resumo}   ${linhas.length ? `${linhas.length} achado(s)` : 'ok'}`);
  for (const l of linhas) console.log(`    - ${l}`);
  achados += linhas.length;
}

console.log(`\n${achados} achado(s) para corrigir.`);
process.exit(achados ? 1 : 0);
