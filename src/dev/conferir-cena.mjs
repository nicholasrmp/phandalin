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
const { ARESTA, footprintOf } = await import(P + 'core/grid.js');
const { mapaDo, CENAS, buildFoes } = await import(P + 'game/encounter.js');

const nome = Object.fromEntries(Object.entries(ARESTA).map(([k, v]) => [v, k]));
const K = (x, y) => `${x},${y}`;

const TODAS = CENAS ?? ['emboscada', 'ermo', 'ermoNoite', 'rua', 'esconderijo', 'mansao', 'mansaoTunel',
  'poco', 'cume', 'castelo', 'arvoreTrovao', 'ondaEco',
  'covilAgatha', 'cavernaDoPoco', 'acampamentoSawplee', 'telhadoGigante', 'giganteTerreo', 'zorzulaPosto', 'zorzulaMinas', 'santuarioIndigo', 'casaMarthungrim', 'minaHardyhammer', 'largoDaVaca', 'talhundereth', 'criptaTalhund',
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
    // A LUZ SEM CHAMA (`semChama`: a lava, a cascata, o cristal, a fumaça) não tem botão de apagar e mora onde o brilho
    // está — dentro da lava, no sulco da parede. As duas regras abaixo são de CHAMA: não valem para ela.
    if (l.semChama) continue;
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

  // --- CHÃO QUE NINGUÉM ALCANÇA, com toda porta aberta.
  //
  // Só o FOSSO entra nesta conta, e isso é medido (`testes-conferir-cena.mjs`): o fosso barra o passo, a
  // água funda NÃO — atravessa-se a nado, devagar, que ela é terreno difícil. Eu supus o contrário ao
  // escrever isto e o teste me corrigiu.
  //
  // `conferir-paredes.mjs` já faz a conta das ILHAS de chão, e sabe o que o roteiro abre (as secretas da
  // Mansão, as lajes das criptas), por isso ela mora lá. O que FALTAVA é a casa solta que não é ilha de
  // terreno: a que o FOSSO ou a ÁGUA FUNDA isolam. A conta de componentes de quem gera o mapa roda sobre o
  // conjunto "chão", que inclui o fosso; só o motor, que não deixa pisar nele, enxerga a diferença.
  //
  // Achado assim na Onda Eco: SEIS casas — (5,33), (5,34), (6,34), (30,78), (36,11) e (51,9) —, uma delas
  // com rocha nos quatro lados menos um fosso. O gerador as CONTAVA desde sempre numa linha de relatório, e
  // nunca as consertava.
  const g = montarCampo(mapa);
  for (let y = 0; y < g.h; y += 1) for (let x = 0; x < g.w; x += 1) {
    const i = y * g.w + x;
    if (g.paredeN[i] === ARESTA.porta) g.porAresta(x, y - 1, x, y, ARESTA.aberta);
    if (g.paredeO[i] === ARESTA.porta) g.porAresta(x - 1, y, x, y, ARESTA.aberta);
  }
  const de = (mapa.grupo ?? [])[0];
  if (de && !g.blocksMove(de.x, de.y)) {
    const alc = g.reachable(de, 1000000);
    // só conta a casa que o FOSSO ou a ÁGUA FUNDA isolam: a ilha de terreno é assunto de `conferir-paredes`
    const porAgua = [];
    for (let y = 0; y < g.h; y += 1) for (let x = 0; x < g.w; x += 1) {
      if (g.blocksMove(x, y) || alc.has(`${x},${y}`)) continue;
      const vizinho = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        .some(([dx, dy]) => g.inside(x + dx, y + dy) && g.surfaceAt(x + dx, y + dy) === 'fosso');
      if (vizinho) porAgua.push(`${x},${y}`);
    }
    if (porAgua.length) {
      linhas.push(`${porAgua.length} casa(s) de chão que o fosso isola: ${porAgua.slice(0, 6).join(' ')}`);
    }
  }

  // --- O BANDO NASCE EM CASA LIVRE, e um por casa. `buildFoes` devolve o elenco que a cena põe no mapa.
  //
  // A PEGADA INTEIRA, e não só a âncora. De Grande para cima a criatura ocupa mais de um quadrado
  // (`core/grid.js footprintOf`: Grande 2x2, Enorme 3x3, Imenso 4x4), e esta conta olhava só a casa da
  // âncora. Foi assim que o ogro Gog, do Cume da Wyvern, passou a dormir EM CIMA DO BAÚ do bando: ancorado
  // em (4,10), a pegada dele cobria (5,11), que é o caixote e barra o passo. O gerador daquela cena ganhou a
  // mesma prova; aqui ela vale para toda cena cujo elenco sai de `buildFoes`.
  const ocupadas = new Map();
  for (const foe of buildFoes(cena) ?? []) {
    const q = foe.pos;
    if (!q || !f.inside(q.x, q.y)) { linhas.push(`${foe.name} sem casa válida`); continue; }
    const lado = footprintOf(foe.size);
    for (let dy = 0; dy < lado; dy += 1) for (let dx = 0; dx < lado; dx += 1) {
      const x = q.x + dx; const y = q.y + dy;
      const onde = lado > 1 ? ` (pegada ${lado}x${lado} de (${q.x},${q.y}))` : '';
      if (!f.inside(x, y)) { linhas.push(`${foe.name} nasce fora do mapa em (${x},${y})${onde}`); continue; }
      if (f.blocksMove(x, y)) linhas.push(`${foe.name} nasce em casa bloqueada (${x},${y}, ${f.surfaceAt(x, y)})${onde}`);
      const k = `${x},${y}`;
      if (ocupadas.has(k)) linhas.push(`${foe.name} e ${ocupadas.get(k)} se sobrepõem em (${k})${onde}`);
      ocupadas.set(k, foe.name);
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
