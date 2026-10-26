// Testes de FUMAÇA da Caverna Onda Eco: o mapa lido da imagem e o que a cena apoia nele. Rode com:
//   node src/dev/testes-ondaeco.mjs
//
// A cena (`game/capitulo5-ondaeco.js`) importa CSS e não carrega em Node; aqui se testa o que ela depende:
// o mapa (`game/ondaeco.js`, saída do gerador), as vagas dos bandos e as propriedades de geometria em que os
// gatilhos se apoiam. Se o gerador mudar de um jeito que quebre um gatilho, cai aqui.

import assert from 'node:assert/strict';
import { Battlefield, ARESTA } from '../core/grid.js';
import { makeMonster } from '../rules/monsters.js';
import { mapaDo } from '../game/encounter.js';
import { MAPA_ONDA_ECO, ONDA_ECO } from '../game/ondaeco.js';
import { itemDeId } from '../rules/equipment.js';
import { EXAMES } from '../game/ondaeco-dados.js';

let falhas = 0;
let total = 0;
function teste(nome, fn) {
  total += 1;
  try { fn(); console.log(`ok    ${nome}`); } catch (e) { falhas += 1; console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`); }
}

const campo = () => {
  const m = mapaDo('ondaEco');
  const f = new Battlefield(m.terreno[0].length, m.terreno.length, m.terreno, m.altura, m.objetos, m.paredes);
  return { m, f };
};
const abrirPortas = (f) => { for (const [a, b] of ONDA_ECO.folhas) f.porAresta(a.x, a.y, b.x, b.y, ARESTA.aberta); };

teste('o mapa tem 73 x 90 casas, e o grupo nasce em chão livre', () => {
  const { m, f } = campo();
  assert.equal(f.w, 73); assert.equal(f.h, 90);
  assert.equal(m.grupo.length, 4);
  for (const p of m.grupo) assert.ok(!f.blocksMove(p.x, p.y), `o herói nasce em casa bloqueada (${p.x},${p.y})`);
});

teste('toda área do livro (1 a 20) tem casas, e quase todas se alcançam da chegada', () => {
  const { f } = campo();
  abrirPortas(f);
  const alc = f.reachable(ONDA_ECO.chegada, 100000, () => false);
  const baixas = [];
  for (let i = 1; i <= 20; i += 1) {
    const cels = ONDA_ECO.areas[String(i)];
    assert.ok(cels?.length > 0, `a área ${i} não tem casas`);
    const ok = cels.filter((c) => alc.has(`${c.x},${c.y}`)).length;
    if (ok / cels.length < 0.7) baixas.push(`${i}: ${ok}/${cels.length}`);
  }
  assert.deepEqual(baixas, [], 'áreas que o grupo quase não alcança: ' + baixas.join(', '));
});

teste('cada bando nasce em casa livre e alcançável, e as Grandes têm as quatro casas', () => {
  const { f } = campo();
  abrirPortas(f);
  const alc = f.reachable(ONDA_ECO.chegada, 100000, () => false);
  const TIPOS = {
    stirges: 'stirge', esqueletos: 'esqueleto', ghoulsSul: 'ghoul', ghoulsGrande: 'ghoul', gosma: 'gelatinaOcre',
    bugbearsNorte: 'bugbear', zumbis: 'zumbi', caveira: 'caveiraCandente', mormesk: 'wraith', espectador: 'spectator',
    bugbearsFenda: 'bugbear', bugbearGuarda: 'bugbear', vhalak: 'doppelganger', nezznar: 'nezznar', bugbearsTemplo: 'bugbear',
    aranhasTemplo: 'aranhaGigante', nundro: 'plebeu',
  };
  const QUANTOS = { stirges: 10, esqueletos: 9, ghoulsSul: 3, ghoulsGrande: 7, gosma: 1, bugbearsNorte: 5, zumbis: 8, caveira: 1, bugbearsTemplo: 2, aranhasTemplo: 4, bugbearsFenda: 2 };
  for (const [chave, n] of Object.entries(QUANTOS)) assert.equal(ONDA_ECO.ninhos[chave].length, n, `${chave}: o livro põe ${n}`);
  for (const [chave, vagas] of Object.entries(ONDA_ECO.ninhos)) {
    const tipo = TIPOS[chave];
    assert.ok(tipo, `bando sem tipo no teste: ${chave}`);
    const grande = (makeMonster(tipo, { x: 0, y: 0 }).size ?? '') === 'grande';
    for (const p of vagas) {
      const casas = grande ? [[0, 0], [1, 0], [0, 1], [1, 1]] : [[0, 0]];
      for (const [dx, dy] of casas) {
        assert.ok(!f.blocksMove(p.x + dx, p.y + dy), `${chave} nasce em casa bloqueada (${p.x + dx},${p.y + dy})`);
        assert.ok(alc.has(`${p.x + dx},${p.y + dy}`), `${chave} nasce onde não se chega (${p.x + dx},${p.y + dy})`);
      }
      assert.ok(!(grande && f.paredeNaPegada?.(p.x, p.y, 2)), `${chave} Grande com parede cortando a pegada (${p.x},${p.y})`);
    }
  }
});

teste('cada bando nasce DENTRO da área que o livro lhe dá', () => {
  const area = (id) => new Set(ONDA_ECO.areas[id].map((c) => `${c.x},${c.y}`));
  const dentroDe = (chave, id) => { const s = area(id); for (const p of ONDA_ECO.ninhos[chave]) assert.ok(s.has(`${p.x},${p.y}`), `${chave} fora da área ${id}: (${p.x},${p.y})`); };
  dentroDe('stirges', '3'); dentroDe('esqueletos', '4'); dentroDe('ghoulsSul', '6'); dentroDe('ghoulsGrande', '9'); dentroDe('gosma', '2');
  dentroDe('bugbearsNorte', '11'); dentroDe('zumbis', '12'); dentroDe('mormesk', '14'); dentroDe('espectador', '15');
  dentroDe('nezznar', '19'); dentroDe('aranhasTemplo', '19'); dentroDe('nundro', '20');
});

teste('as portas de pedra: toda folha é uma aresta de porta no mapa', () => {
  const { f } = campo();
  assert.ok(ONDA_ECO.folhas.length >= 10, 'o mapa devia ter folhas de porta: ' + ONDA_ECO.folhas.length);
  for (const [a, b] of ONDA_ECO.folhas) assert.equal(f.aresta(a.x, a.y, b.x, b.y), ARESTA.porta, `a folha (${a.x},${a.y})-(${b.x},${b.y}) não é porta fechada`);
});

teste('toda peça do mapa tem texto de Examinar, e os itens da cena existem', () => {
  const sem = [...new Set(ONDA_ECO.props.map((p) => p.variante))].filter((v) => !EXAMES[v]);
  assert.deepEqual(sem, [], 'peças sem texto de Examinar: ' + sem.join(', '));
  for (const id of ['botasDeMarchaESalto', 'manoplasDeForcaDeOgro', 'varinhaDeMisseisMagicos', 'cajadoAranha', 'lightbringer', 'dragonguard',
    'anelDePlatinaDoMago', 'cachimboDePlatina', 'gemaPequena', 'canecaDeEletro', 'chaveDoAranhaNegra', 'mapaDeMormesk', 'diamante', 'moedaDePlatina']) {
    assert.ok(itemDeId(id), `item inexistente: ${id}`);
  }
});

teste('o mapa não tem glifo desconhecido, e a água funda barra o passo', () => {
  const { f } = campo();
  const GL = new Set([...'`<;"[|ROx^&FKQeu$']);
  for (const linha of MAPA_ONDA_ECO.terreno) for (const g of linha) assert.ok(GL.has(g), `glifo inesperado: ${g}`);
  const agua = MAPA_ONDA_ECO.terreno.flatMap((l, y) => [...l].map((g, x) => [g, x, y])).find(([g]) => g === '|');
  assert.ok(agua, 'o mapa devia ter água escura');
  assert.ok(f.aguas?.has(`${agua[1]},${agua[2]}`), 'água escura é água funda');
});

console.log(`\n${total - falhas}/${total} passaram`);
process.exit(falhas ? 1 : 0);
