// Testes do diretor de música (core/musica.js). Rode com:
//   node src/dev/testes-musica.mjs

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import {
  FAIXAS, TOQUES, urlDaFaixa, faixaDaVariante, temChefe, faixaAgora, tocarFaixa, tocarToque, comAcampamento,
} from '../core/musica.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
let total = 0;
let falhas = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`);
  }
}

/** Um `audio` de mentira que anota o que lhe mandaram. */
function audioFalso() {
  const a = {
    chamadas: [], musicaUrl: null, musicaOpcoes: null,
    tocarMusica(url, o) { this.chamadas.push(['tocar', url, o]); this.musicaUrl = url; this.musicaOpcoes = o; },
    pararMusica(f) { this.chamadas.push(['parar', f]); this.musicaUrl = null; },
    toque(url, o) { this.chamadas.push(['toque', url, o]); },
  };
  return a;
}

await teste('toda faixa e todo toque existem em public/musica', () => {
  for (const nome of [...Object.keys(FAIXAS), ...Object.keys(TOQUES)]) {
    assert.ok(existsSync(join(raiz, 'public', 'musica', `${nome}.mp3`)), `falta public/musica/${nome}.mp3`);
  }
});

await teste('o endereço da faixa sai de BASE_URL (cai em / no Node)', () => {
  assert.equal(urlDaFaixa('luta'), '/musica/luta.mp3');
});

await teste('cada mapa tem a sua faixa de exploração', () => {
  assert.equal(faixaDaVariante('ondaEco'), 'caverna-onda-eco');
  assert.equal(faixaDaVariante('mansao'), 'masmorra-mansao');
  assert.equal(faixaDaVariante('rua'), 'vila-phandalin');
  assert.equal(faixaDaVariante('emboscada'), 'exploracao-estrada');
  assert.equal(faixaDaVariante(undefined), 'exploracao-estrada');
  for (const v of ['ondaEco', 'caverna', 'esconderijo', 'mansao', 'mansaoTunel', 'castelo', 'rua', 'emboscada', 'xyz']) {
    assert.ok(FAIXAS[faixaDaVariante(v)], `${v} aponta para uma faixa que existe`);
  }
});

await teste('chefe: só inimigo vivo de XP 450 ou mais conta', () => {
  const heroi = { side: 'party', hp: 10 };
  const goblin = { side: 'foe', hp: 7, xp: 50 };
  const chefe = { side: 'foe', hp: 40, xp: 700 };
  assert.equal(temChefe([heroi, goblin]), false);
  assert.equal(temChefe([heroi, goblin, chefe]), true);
  assert.equal(temChefe([heroi, { ...chefe, dead: true }]), false);
  assert.equal(temChefe([heroi, { ...chefe, hp: 0 }]), false);
  assert.equal(temChefe([{ ...chefe, side: 'party' }]), false);
  assert.equal(temChefe(undefined), false);
});

await teste('faixaAgora: mapa fora da luta, luta ou luta de chefe dentro dela', () => {
  const chefe = { side: 'foe', hp: 40, xp: 700 };
  assert.equal(faixaAgora({ variante: 'rua' }), 'vila-phandalin');
  assert.equal(faixaAgora({ variante: 'rua', emLuta: true, combatentes: [] }), 'luta');
  assert.equal(faixaAgora({ variante: 'rua', emLuta: true, combatentes: [chefe] }), 'luta-chefe');
});

await teste('tocarFaixa manda a faixa e o ganho dela; nome desconhecido não faz nada', () => {
  const a = audioFalso();
  tocarFaixa(a, 'luta', { fade: 1 });
  assert.deepEqual(a.chamadas, [['tocar', '/musica/luta.mp3', { ganho: FAIXAS.luta.ganho, fade: 1 }]]);
  tocarFaixa(a, 'nao-existe');
  assert.equal(a.chamadas.length, 1);
});

await teste('tocarToque manda o toque; nome desconhecido não faz nada', () => {
  const a = audioFalso();
  tocarToque(a, 'vitoria');
  tocarToque(a, 'nao-existe');
  assert.deepEqual(a.chamadas, [['toque', '/musica/vitoria.mp3', { ganho: TOQUES.vitoria.ganho }]]);
});

await teste('comAcampamento toca a fogueira e devolve a música de antes', async () => {
  const a = audioFalso();
  tocarFaixa(a, 'vila-phandalin');
  a.chamadas.length = 0;
  const r = await comAcampamento(a, async () => { assert.equal(a.musicaUrl, '/musica/acampamento.mp3'); return 7; });
  assert.equal(r, 7);
  assert.equal(a.chamadas.at(-1)[1], '/musica/vila-phandalin.mp3');
});

await teste('comAcampamento devolve a música mesmo se o descanso falhar, e para a fogueira se não havia nada', async () => {
  const a = audioFalso();
  tocarFaixa(a, 'taverna');
  await assert.rejects(comAcampamento(a, async () => { throw new Error('boom'); }), /boom/);
  assert.equal(a.musicaUrl, '/musica/taverna.mp3');
  const b = audioFalso();
  await comAcampamento(b, async () => {});
  assert.equal(b.chamadas.at(-1)[0], 'parar');
});

console.log(`\n${total - falhas}/${total} passaram`);
process.exit(falhas ? 1 : 0);
