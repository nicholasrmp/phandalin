// O INVENTÁRIO DAS VINTE CENAS, numa tabela só. Rode com:
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/inventario-cenas.mjs
//
// `conferir-paredes.mjs` e `conferir-cena.mjs` dizem se o que existe está CERTO. Este diz o que EXISTE — e é
// outra pergunta, porque os dois conferidores não têm como acusar o que não foi posto: uma cena sem luz
// nenhuma, sem peça nenhuma ou sem objeto interagível nenhum passa nos dois com zero achados, e foi assim
// que a Onda Eco ficou meses com a arte pintada no chão e nada para clicar nela.
//
// Cada coluna, e de onde ela sai:
//   parede   arestas de parede/porta/arco/seteira do mapa (`paredes`, `tracos`)
//   porta    só as arestas de porta, abertas ou fechadas
//   luz      fontes de luz dinâmica do mapa (`luzes`) — fogueira, tocha, braseiro, vela
//   fogo     quantas delas são chama que se pode apagar (`game/fogo.js`: tipo fogueira/tocha/braseiro/vela)
//   peça     mobília com arte própria (`objetos` tipo prop)
//   glifo    casas de terreno que SÃO objeto (baú, mantimentos, barris, leito, fogueira, estalagmite…)
//   interag  objetos interagíveis marcados no mapa (`interativos`)
//   bando    criaturas que a cena põe no tabuleiro (`buildFoes`)
//   fundo    se a cena roda sobre battlemap pintado (aí peça por cima desenha duas vezes)
import { montarCampo } from '../game/campo.js';
import { mapaDo, buildFoes } from '../game/encounter.js';
import { ARESTA } from '../core/grid.js';

// as casas de terreno que valem como OBJETO: coisa desenhada no chão com a qual se espera poder interagir
const GLIFO_OBJETO = new Set(['bau', 'mantimentos', 'barris', 'leito', 'fogueira', 'estalagmite', 'entulho',
  'palha', 'prop', 'propBaixo', 'pocoVelho', 'altar', 'tocaia', 'sarcofago', 'bigorna', 'tear']);
const CHAMA = new Set(['fogueira', 'tocha', 'braseiro', 'vela', 'lanterna']);

// a mesma lista que `conferir-paredes.mjs` e `conferir-cena.mjs` varrem
const TODAS = ['emboscada', 'ermo', 'ermoNoite', 'rua', 'esconderijo', 'mansao', 'mansaoTunel',
  'poco', 'cume', 'castelo', 'arvoreTrovao', 'ondaEco', 'covilAgatha', 'cavernaDoPoco', 'acampamentoSawplee', 'telhadoGigante', 'giganteTerreo', 'zorzulaPosto', 'zorzulaMinas', 'santuarioIndigo', 'casaMarthungrim', 'minaHardyhammer', 'largoDaVaca', 'talhundereth', 'criptaTalhund', 'casaDaMorte1', 'casaDaMorte2', 'casaDaMorte3',
  'casaDaMorte4', 'casaDaMortePorao1', 'casaDaMortePorao2'];

const linhas = [];
for (const cena of TODAS) {
  let mapa;
  try { mapa = mapaDo(cena); } catch { continue; }
  if (!mapa?.terreno) continue;
  const f = montarCampo(mapa);
  let paredes = 0; let portas = 0;
  for (let i = 0; i < f.w * f.h; i += 1) {
    for (const lado of [f.paredeN, f.paredeO]) {
      const c = lado[i];
      if (!c || c === ARESTA.aberta) continue;
      paredes += 1;
      if (c === ARESTA.porta) portas += 1;
    }
  }
  const luzes = mapa.luzes ?? [];
  const fogo = luzes.filter((l) => CHAMA.has(l.tipo ?? 'fogueira')).length;
  const pecas = (mapa.objetos ?? []).filter((o) => o.tipo === 'prop').length;
  let glifos = 0;
  for (let y = 0; y < f.h; y += 1) for (let x = 0; x < f.w; x += 1) if (GLIFO_OBJETO.has(f.surfaceAt(x, y))) glifos += 1;
  const interag = Object.keys(mapa.interativos ?? {}).length || (mapa.interativos?.length ?? 0);
  let bando = 0;
  try { bando = (buildFoes(cena) ?? []).length; } catch { bando = -1; }
  linhas.push({ cena, paredes, portas, luz: luzes.length, fogo, pecas, glifos, interag, bando,
    fundo: mapa.fundo ? 'sim' : '—' });
}

const col = (s, n) => String(s).padStart(n);
console.log('cena                  parede porta   luz  fogo  peça glifo interag bando  fundo');
console.log('--------------------- ------ ----- ----- ----- ----- ----- ------- ----- ------');
for (const l of linhas) {
  console.log(`${l.cena.padEnd(21)} ${col(l.paredes, 6)} ${col(l.portas, 5)} ${col(l.luz, 5)} ${col(l.fogo, 5)}`
    + ` ${col(l.pecas, 5)} ${col(l.glifos, 5)} ${col(l.interag, 7)} ${col(l.bando < 0 ? '?' : l.bando, 5)} ${col(l.fundo, 6)}`);
}

// --- o que vale a pena olhar: cena sem NADA de uma coluna que as irmãs têm
const vazio = (k) => linhas.filter((l) => l[k] === 0).map((l) => l.cena);
console.log('\nO QUE ESTÁ EM ZERO (não é defeito por si — é onde olhar):');
for (const [k, rotulo] of [['luz', 'sem luz dinâmica nenhuma'], ['pecas', 'sem peça de mobília'],
  ['glifos', 'sem objeto nenhum desenhado no chão'], ['interag', 'sem objeto interagível marcado'],
  ['bando', 'sem bando em `buildFoes` (a cena monta o elenco por conta)']]) {
  const q = vazio(k);
  if (q.length) console.log(`  ${rotulo}: ${q.join(', ')}`);
}
console.log(`\nAs que rodam sobre battlemap pintado — onde PEÇA por cima desenharia duas vezes, e o lugar certo`);
console.log(`do objeto é o GLIFO de terreno: ${linhas.filter((l) => l.fundo === 'sim').map((l) => l.cena).join(', ')}`);
