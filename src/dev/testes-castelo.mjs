// O CASTELO DENTEFINO com a cena de verdade (`game/capitulo4-castelo.js`) e a interface trocada por stubs:
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-castelo.mjs
//
// C4, a torre do sudoeste (o Obelisco): três goblins DORMINDO, e luta ali se ouve no salão de banquete (C7), que
// manda um goblin ver o que é; ele não volta, e o resto do salão vem atrás.
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { montarCampo } = await import(P + 'game/campo.js');
const { Encounter } = await import(P + 'rules/combat.js');
const { makeParty } = await import(P + 'rules/party.js');
const { makeRng } = await import(P + 'core/rng.js');
const { mapaDo, buildFoes } = await import(P + 'game/encounter.js');
const { criarCastelo } = await import(P + 'game/capitulo4-castelo.js');
const { CASTELO } = await import(P + 'game/castelo.js');

let total = 0;
let falhas = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${String(e.stack ?? e.message).split('\n').slice(0, 6).join('\n      ')}`);
  }
}

async function castelo({ campanha = {}, seed = 11 } = {}) {
  const mapa = mapaDo('castelo');
  const field = montarCampo(mapa);
  const party = makeParty({ nivel: 3 });
  party.forEach((c, i) => { c.pos = { ...mapa.grupo[i] }; c.facingVec = { ...mapa.olhar }; });
  const app = {
    root: { classList: { add() {}, remove() {} } }, campanha, selected: null, inimigosEscondidos: buildFoes('castelo'),
    select(c) { this.selected = c; }, firstActive() { return enc.allOf('party').find((c) => !c.acted && !c.dead && c.hp > 0) ?? null; },
    refresh() {}, encerrarPartida() {}, irParaRegiao() {},
  };
  const enc = new Encounter({ battlefield: field, party, foes: [], rng: makeRng(seed), emboscada: null, reinforcements: () => null, onEvent: (ev) => cena?.evento?.(ev) });
  app.enc = enc;
  enc.aoComecar = () => {};
  enc.protegidoDeSurpresa = () => false;
  const cena = criarCastelo(app, { modo: 'campanha' });
  await cena.iniciar?.();
  return { app, enc, cena, field, party, salvo: () => app.campanha.castelo };
}

/** Põe o grupo dentro da torre do sudoeste e dispara o passo. */
async function entrarNaTorre(S) {
  const livres = CASTELO.celulas.torreSul.filter((p) => !S.field.blocksMove(p.x, p.y) && !S.enc.occupied(p.x, p.y));
  S.party.forEach((h, i) => { h.pos = { ...h.pos, ...livres[(i * 2) % livres.length] }; });
  await S.cena.depoisDeMover(S.party[0]);
}

await teste('C4: os três goblins da torre dormem — quem entra sem alarme no castelo tem a primeira rodada', async () => {
  const S = await castelo();
  await entrarNaTorre(S);
  assert.equal(S.cena.explorando, false, 'entrar na torre abre a luta');
  const daTorre = S.enc.combatants.filter((c) => c.side === 'foes' && /da torre/.test(c.name));
  assert.equal(daTorre.length, 3, 'três goblins na torre');
  assert.equal(S.enc.emboscada?.emboscadores, 'party', 'eles dormem: a surpresa é do grupo');
});

await teste('C4: a luta na torre chama UM goblin do banquete na rodada 2, e o resto do salão com o Yegg na 4', async () => {
  const S = await castelo();
  await entrarNaTorre(S);
  assert.equal(S.enc.reinforcements(1), null, 'ninguém na rodada 1');
  const r2 = S.enc.reinforcements(2);
  assert.ok(r2, 'na rodada 2 vem alguém');
  assert.equal(r2.units.length, 1, 'um goblin só vem ver o barulho');
  assert.match(r2.units[0].name, /cozinheiro/);
  assert.equal(S.enc.reinforcements(3), null, 'ninguém na rodada 3');
  const r4 = S.enc.reinforcements(4);
  assert.ok(r4, 'na rodada 4 vem o resto do salão');
  const nomes = r4.units.map((u) => u.name);
  assert.ok(nomes.includes('Yegg'), `o Yegg vem junto (${nomes.join(', ')})`);
  assert.equal(r4.units.length, 6, `o resto do C7: os outros cinco goblins e o Yegg (${nomes.join(', ')})`);
  assert.ok(!r4.units.includes(r2.units[0]), 'o olheiro não vem duas vezes');
});

await teste('C4: com o castelo em alarme, ninguém dorme e o banquete não é chamado pela torre', async () => {
  const S = await castelo();
  S.salvo().alarme = true;
  await entrarNaTorre(S);
  assert.notEqual(S.enc.emboscada?.emboscadores, 'party');
  for (let r = 1; r <= 6; r += 1) {
    const l = S.enc.reinforcements(r);
    assert.ok(!l?.units?.some((u) => /cozinheiro|Yegg/.test(u.name)), `rodada ${r}: o banquete veio pela torre`);
  }
});

console.log(`\n${total - falhas}/${total} testes passaram.`);
if (falhas) process.exit(1);
