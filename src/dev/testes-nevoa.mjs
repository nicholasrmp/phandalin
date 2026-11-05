// Testes da NÉVOA EXPLORADA (`rules/nevoa.js`): o que o grupo viu numa cena escura fica lembrado, vai para o save
// e volta. Rode com:
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-nevoa.mjs
//
// Mede-se o motor de verdade: a visão do grupo numa caverna em breu (`visaoDoGrupo`), o campo montado do mapa e o
// save da campanha, ida e volta pelo JSON.

import assert from 'node:assert/strict';
import { Battlefield } from '../core/grid.js';
import { visaoDoGrupo } from '../rules/luz.js';
import { explorar, explorada, codificarExplorado, restaurarExplorado, esquecerExplorado, lembraOVisto } from '../rules/nevoa.js';
import { montarCampo } from '../game/campo.js';
import { novoMapa, definirNevoaExplorada } from '../game/mapa-editor.js';
import { montarSave, lerJson } from '../game/save.js';
import { makeParty } from '../rules/party.js';

let total = 0;
let falhas = 0;
function teste(nome, fn) {
  total += 1;
  try { fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`);
  }
}

const ABERTO = Array(12).fill('.'.repeat(20));
const campo = () => new Battlefield(20, 12, ABERTO);

teste('explorar marca as casas vistas, e só conta as novas', () => {
  const f = campo();
  assert.equal(explorar(f, new Map([['2,3', 2], ['4,5', 1]])), 2);
  assert.equal(explorada(f, 2, 3), true);
  assert.equal(explorada(f, 4, 5), true);
  assert.equal(explorada(f, 0, 0), false);
  const v = f.exploradoVersao;
  assert.equal(explorar(f, new Map([['2,3', 2]])), 0, 'a mesma casa não conta de novo');
  assert.equal(f.exploradoVersao, v, 'nada novo, o véu não se refaz');
  assert.equal(explorar(f, ['5,5', '99,99', '-1,2']), 1, 'aceita lista de chaves e ignora casa fora do mapa');
});

teste('o mapa que não quer (nevoaExplorada: false) não lembra nada', () => {
  const f = campo();
  f.nevoaExplorada = false;
  assert.equal(lembraOVisto(f), false);
  assert.equal(explorar(f, new Map([['2,3', 2]])), 0);
  assert.equal(f.explorado ?? null, null);
  assert.equal(restaurarExplorado(f, '20x12:5.1.234'), false);
});

teste('a visão do grupo numa caverna em breu enche a memória, e andar acumula', () => {
  const f = campo();
  f.luz = new Uint8Array(20 * 12);   // breu
  // Brenn é anão: 60 pés de visão no escuro, e é ela que enxerga no breu
  const anao = makeParty({ nivel: 1 }).find((c) => c.name === 'Brenn');
  anao.pos = { x: 2, y: 6 };
  const enc = { combatants: [anao], field: f, zonas: [] };
  const n1 = explorar(f, visaoDoGrupo(enc));
  assert.ok(n1 > 0, 'a visão no escuro do anão viu alguma coisa');
  assert.equal(explorada(f, 19, 6), false, 'longe demais para 60 pés');
  anao.pos = { x: 17, y: 6 };
  const n2 = explorar(f, visaoDoGrupo(enc));
  assert.ok(n2 > 0, 'andar até a outra ponta mostra casas novas');
  assert.equal(explorada(f, 19, 6), true);
  assert.equal(explorada(f, 2, 6), true, 'o começo continua lembrado');
});

teste('codificar e restaurar: a ida e volta devolve a mesma memória', () => {
  const f = campo();
  for (let x = 3; x < 9; x++) for (let y = 2; y < 7; y++) explorar(f, [`${x},${y}`]);
  explorar(f, ['19,11', '0,0']);
  const texto = codificarExplorado(f);
  assert.match(texto, /^20x12:/);
  assert.ok(texto.length < 80, `curto: ${texto.length} caracteres`);
  const g = campo();
  assert.equal(restaurarExplorado(g, texto), true);
  assert.deepEqual([...g.explorado], [...f.explorado]);
  assert.ok(g.exploradoVersao > 0, 'restaurar refaz o véu');
});

teste('nada visto: nada a guardar', () => {
  assert.equal(codificarExplorado(campo()), null);
});

teste('restaurar recusa o mapa de outro tamanho e o texto quebrado', () => {
  const f = campo();
  explorar(f, ['3,3']);
  const texto = codificarExplorado(f);
  const outro = new Battlefield(19, 12, Array(12).fill('.'.repeat(19)));
  assert.equal(restaurarExplorado(outro, texto), false, 'o mapa mudou de largura');
  for (const ruim of ['20x12:', '20x12:zz.zz', '20x12:5.1', '20x12:5.-1.234', 'lixo', null, 42]) {
    const g = campo();
    assert.equal(restaurarExplorado(g, ruim), false, `recusa ${JSON.stringify(ruim)}`);
    assert.equal(g.explorado ?? null, null, 'e não deixa memória pela metade');
  }
});

teste('esquecer apaga a memória', () => {
  const f = campo();
  explorar(f, ['3,3']);
  esquecerExplorado(f);
  assert.equal(explorada(f, 3, 3), false);
});

teste('o campo montado do mapa: ligada por padrão, e o editor desliga', () => {
  const m = novoMapa(8, 8);
  assert.equal(lembraOVisto(montarCampo(m)), true);
  assert.equal(definirNevoaExplorada(m, false), true);
  assert.equal(m.nevoaExplorada, false);
  assert.equal(lembraOVisto(montarCampo(m)), false);
  assert.equal(definirNevoaExplorada(m, false), false, 'já estava');
  definirNevoaExplorada(m, true);
  assert.equal('nevoaExplorada' in m, false, 'ligada não grava nada');
});

teste('o save leva a névoa de cada cena na campanha, e ela volta pelo JSON', () => {
  const f = campo();
  for (let x = 0; x < 10; x++) explorar(f, [`${x},4`]);
  const campanha = { nevoa: { esconderijo: codificarExplorado(f) } };
  const r = montarSave({
    id: 's1', nome: 'Teste', agora: 1, config: { modo: 'campanha' }, campanha,
    herois: [{ id: 'dara', name: 'Dara' }],
  });
  assert.equal(r.ok, true, r.erro);
  const volta = lerJson(JSON.stringify(r.save));
  const g = campo();
  assert.equal(restaurarExplorado(g, volta.campanha.nevoa.esconderijo), true);
  assert.equal(explorada(g, 9, 4), true);
  assert.equal(explorada(g, 10, 4), false);
});

console.log(`\n${total - falhas}/${total} testes passaram`);
if (falhas) process.exit(1);
