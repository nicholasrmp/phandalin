// OS MAPAS OFICIAIS (o Obelisco): a região e a vila de Phandalin.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-mapas-oficiais.mjs
//
// A distância da viagem sai do mapa oficial da região (1 hexágono = 5 milhas), e com ela os dias de marcha e o número
// de testes de encontro. Os pinos da vila e da região têm posição nos dois mapas: o oficial (quando a arte está no disco)
// e a pintura de reserva. `regiao.js` e `phandalin.js` importam imagem e não carregam em Node: o que eles declaram é
// conferido no fonte.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const P = new URL('../', import.meta.url);
const { milhasEntre, kmEntre, POSICOES_OFICIAIS, posicaoOficial, MAPA_OFICIAL_DA_REGIAO, KM_POR_MILHA } = await import(new URL('rules/regiao-mapa.js', P).href);
const { diasDeMarcha } = await import(new URL('rules/marcha.js', P).href);

let total = 0;
let falhas = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${String(e.stack ?? e.message).split('\n').slice(0, 5).join('\n      ')}`);
  }
}
const KM_POR_DIA = 36;
const fonte = (rel) => readFileSync(new URL(rel, P), 'utf8');

await teste('a escala do mapa oficial bate com o livro: o Poço a dois dias, Neverwinter a 50 milhas, Zorzula a um dia a leste', () => {
  const mi = (a, b) => Math.round(milhasEntre(a, b));
  assert.ok(Math.abs(mi('phandalin', 'poco') - 39) <= 2, `Poço ${mi('phandalin', 'poco')} mi`);
  assert.equal(diasDeMarcha(kmEntre('phandalin', 'poco'), KM_POR_DIA, 'normal'), 2, 'em linha reta, dois dias');
  assert.ok(Math.abs(mi('phandalin', 'neverwinter') - 50) <= 3, `Neverwinter ${mi('phandalin', 'neverwinter')} mi`);
  assert.equal(diasDeMarcha(kmEntre('phandalin', 'zorzula'), KM_POR_DIA, 'normal'), 1, 'Zorzula: um dia de marcha');
  assert.ok(POSICOES_OFICIAIS.zorzula.x > POSICOES_OFICIAIS.phandalin.x, 'Zorzula fica a leste');
  assert.ok(POSICOES_OFICIAIS.hardyhammer.y > POSICOES_OFICIAIS.phandalin.y && POSICOES_OFICIAIS.hardyhammer.x < POSICOES_OFICIAIS.phandalin.x, 'a mina fica a sudoeste');
  assert.ok(POSICOES_OFICIAIS.talhundereth.y < POSICOES_OFICIAIS.phandalin.y && POSICOES_OFICIAIS.talhundereth.x > POSICOES_OFICIAIS.phandalin.x, 'Talhundereth fica a nordeste');
  assert.equal(kmEntre('phandalin', 'phandalin'), 0);
});

await teste('todo lugar da região tem posição no mapa oficial, dentro dele', () => {
  const src = fonte('game/regiao.js');
  const bloco = src.slice(src.indexOf('export const LOCAIS = ['), src.indexOf('];', src.indexOf('export const LOCAIS = [')));
  const ids = [...bloco.matchAll(/\{ id: '([a-zA-Z]+)'/g)].map((m) => m[1]);
  assert.ok(ids.length >= 12, `só ${ids.length} lugares lidos`);
  for (const id of ids) {
    const p = posicaoOficial(id);
    assert.ok(p, `${id} sem posição no mapa oficial`);
    assert.ok(p.x > 0 && p.x < 100 && p.y > 0 && p.y < 100, `${id} fora do mapa`);
  }
  // e a distância da viagem sai da régua, não da pintura
  assert.match(src, /rotaEntre\(de, para\)/);
  assert.doesNotMatch(src, /KM_POR_PX/);
  assert.equal(MAPA_OFICIAL_DA_REGIAO.w, 1700);
});

await teste('todo lugar da vila tem a porta no mapa oficial de Phandalin', () => {
  const src = fonte('game/phandalin.js');
  const lugares = src.slice(src.indexOf('export const LUGARES = ['), src.indexOf('];', src.indexOf('export const LUGARES = [')));
  const ids = [...lugares.matchAll(/\{ id: '([a-zA-Z]+)'/g)].map((m) => m[1]);
  const oficial = src.slice(src.indexOf('const NO_MAPA_OFICIAL = {'), src.indexOf('};', src.indexOf('const NO_MAPA_OFICIAL = {')));
  for (const id of ids) assert.match(oficial, new RegExp(`\\b${id}: \\{ x: [0-9.]+, y: [0-9.]+ \\}`), `${id} sem porta no mapa oficial`);
  assert.match(src, /for \(const l of LUGARES\) l\.oficial = NO_MAPA_OFICIAL\[l\.id\]/);
});

await teste('a arte oficial não entra no repositório nem na publicação', () => {
  const ignora = fonte('../.gitignore');
  assert.match(ignora, /^public\/mapas\/oficial\/$/m);
  // a tela troca a arte só se a imagem carregar: sem ela, a pintura
  const vila = fonte('view/vila.js');
  assert.match(vila, /teste\.onload = \(\) => \{/);
  if (!existsSync(new URL('../public/mapas/oficial/regiao-jogador.webp', P))) console.log('      (a arte oficial não está neste disco: o jogo usa a pintura)');
});

const { rotaEntre, terrenoDoTrecho, kmDeVerdade, CUSTO_DO_TERRENO, terrenoEm } = await import(new URL('rules/regiao-rota.js', P).href);
const { TERRENO_DA_REGIAO } = await import(new URL('rules/regiao-terreno.js', P).href);
const LUGARES_DA_REGIAO = Object.keys(POSICOES_OFICIAIS);

await teste('a rota pelo terreno: toda dupla de lugares tem caminho, e nenhum passa pelo mar', () => {
  for (const a of LUGARES_DA_REGIAO) for (const b of LUGARES_DA_REGIAO) {
    if (a === b) continue;
    const r = rotaEntre(a, b);
    assert.ok(r, `${a} > ${b} sem caminho`);
    assert.ok(r.celulas.slice(1, -1).every(([i, j]) => terrenoEm(i, j) !== '~'), `${a} > ${b} anda no mar`);
  }
});

await teste('o terreno difícil custa o dobro: a marcha equivalente é a distância mais o trecho difícil', () => {
  for (const d of ['castelo', 'poco', 'zorzula', 'conyberry']) {
    const r = rotaEntre('phandalin', d);
    const dificil = ['f', 'h', 'm'].reduce((s, t) => s + (r.porTerreno[t] ?? 0), 0);
    const esperado = Object.values(r.porTerreno).reduce((s, x) => s + x, 0) + dificil;
    assert.ok(Math.abs(r.kmEquivalentes - esperado) <= 4, `${d}: ${r.kmEquivalentes} contra ${esperado.toFixed(1)}`);
  }
  assert.equal(CUSTO_DO_TERRENO.T, 1);
  assert.equal(CUSTO_DO_TERRENO.f, 2);
});

await teste('a rota prefere a trilha: para Conyberry e Neverwinter, a Trilha de Triboar e a Estrada Alta', () => {
  assert.ok((rotaEntre('phandalin', 'conyberry').porTerreno.T ?? 0) >= 15, 'Conyberry não usa a Trilha de Triboar');
  assert.ok((rotaEntre('phandalin', 'neverwinter').porTerreno.T ?? 0) >= 15, 'Neverwinter não usa a estrada');
});

await teste('o Castelo Dentefino fica no meio da mata: perto em linha reta, caro na marcha', () => {
  const r = rotaEntre('phandalin', 'castelo');
  assert.ok((r.porTerreno.f ?? 0) >= 5, 'a rota não entra na mata');
  assert.ok(r.kmEquivalentes > r.km);
  assert.equal(terrenoDoTrecho(r.perfil, r.kmEquivalentes - 10, r.kmEquivalentes), 'f', 'o fim do caminho é mata');
  assert.ok(Math.abs(Math.round(milhasEntre('phandalin', 'castelo')) - 20) <= 3, 'o livro: umas vinte milhas');
});

await teste('as distâncias que o livro dá: a Árvore Trovão a umas cinquenta milhas', () => {
  const mi = rotaEntre('phandalin', 'arvoreTrovao').km / KM_POR_MILHA;
  assert.ok(mi > 40 && mi < 58, `${mi.toFixed(0)} milhas`);
});

await teste('o que se anda de verdade: na mata a mesma marcha rende metade', () => {
  const r = rotaEntre('phandalin', 'castelo');
  const ultimo = r.perfil[r.perfil.length - 1];
  assert.ok(Math.abs(kmDeVerdade(r.perfil, ultimo.kmEq) - ultimo.km) < 0.01);
  assert.ok(kmDeVerdade(r.perfil, 0) === 0);
  assert.equal(TERRENO_DA_REGIAO.length, 96);
});

console.log(`\n${total - falhas}/${total} testes passaram.`);
if (falhas) process.exit(1);
