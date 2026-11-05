// Testes das ARMADILHAS QUE VIRARAM REGIÃO (`rules/regioes.js`): o fio do salão do Castelo Dentefino, com a cena de
// verdade (`game/capitulo4-castelo.js`) e a interface trocada por stubs, e as extensões que ele pediu ao motor — a CD
// própria da passiva, o alcance dela, o dano em todos que estão na região e a volta para a casa de onde se veio.
// (O fosso e a ponte da Mansão estão em `testes-mansao.mjs`; o poço de espinhos, em `testes-casadamorte.mjs`.)
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-armadilhas.mjs
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { montarCampo } = await import(P + 'game/campo.js');
const { Encounter } = await import(P + 'rules/combat.js');
const { makeParty } = await import(P + 'rules/party.js');
const { makeMonster } = await import(P + 'rules/monsters.js');
const { makeRng } = await import(P + 'core/rng.js');
const { Battlefield } = await import(P + 'core/grid.js');
const { mapaDo, buildFoes } = await import(P + 'game/encounter.js');
const { criarCastelo } = await import(P + 'game/capitulo4-castelo.js');
const { prepararRegioes, armadilhasDasRegioes } = await import(P + 'rules/regioes.js');
const { cortarNoPerigo, armadilhasDaCena, ganchosMagicosDaCena } = await import(P + 'game/armadilhas.js');
const { passivePerception } = await import(P + 'rules/abilities.js');

let total = 0;
let falhas = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${String(e.stack ?? e.message).split('\n').slice(0, 6).join('\n      ')}`);
  }
}

/** O castelo montado como o `main.js` monta, com `campanha` para voltar à mesma cena. */
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
  return { app, enc, cena, field, party, salvo: () => app.campanha.castelo, fio: () => field.regioes.find((r) => r.id === 'fio') };
}
const poe = (h, x, y) => { h.pos = { x, y }; };
/** Tira o grupo do caminho: só quem o teste põe fica perto do fio. */
const longe = (S) => S.party.forEach((h, i) => poe(h, 2 + i, 18));
const PELO_FIO = [{ x: 12, y: 12 }, { x: 13, y: 12 }, { x: 14, y: 12 }, { x: 15, y: 12 }, { x: 16, y: 12 }];

await teste('o fio é REGIÃO do mapa: as cinco casas, escondido (Procurar 10, passiva 20 a 3 m)', async () => {
  const S = await castelo();
  const r = S.fio();
  assert.ok(r, 'a região está no mapa');
  assert.equal(r.casas.size, 5);
  assert.deepEqual({ cd: r.escondida.cd, cdPassiva: r.escondida.cdPassiva, alcance: r.escondida.alcance }, { cd: 10, cdPassiva: 20, alcance: 10 });
  const [a] = armadilhasDasRegioes(S.enc);
  assert.deepEqual({ cd: a.cd, cdPassiva: a.cdPassiva, alcance: a.alcance }, { cd: 10, cdPassiva: 20, alcance: 2 });
});

await teste('quem pisa no fio derruba o teto em TODOS nas cinco casas (Destreza 10, 3d6), para ali, e a cena lembra e conta', async () => {
  const S = await castelo();
  longe(S);
  const [h, aliado] = S.party;
  poe(h, 12, 12);
  poe(aliado, 15, 13);                // em outra casa do fio
  h.movementLeftFt = 60;              // o entulho do salão é terreno difícil
  const antes = [h.hp, aliado.hp];
  S.enc.moveAlong(h, PELO_FIO);
  assert.deepEqual({ x: h.pos.x, y: h.pos.y }, { x: 14, y: 12 }, 'o passo para na primeira casa do fio');
  assert.ok(h.hp < antes[0] && antes[0] - h.hp <= 18, `quem pisou: ${antes[0] - h.hp}`);
  assert.ok(aliado.hp < antes[1] && antes[1] - aliado.hp <= 18, `quem estava em cima também: ${antes[1] - aliado.hp}`);
  assert.equal(S.salvo().armadilha, 'disparada');
  assert.equal(S.fio().desligada, true, 'uma vez só');
  await S.cena.depoisDeMover(h);       // o painel, o XP e o castelo acordado
  assert.equal(S.salvo().fioXp, true, 'o XP do fio');
});

await teste('a passiva 20 nota o fio a 3 m e para antes; a passiva comum pisa', async () => {
  const S = await castelo();
  longe(S);
  const h = S.party[0];
  poe(h, 12, 12);
  const armadilhas = armadilhasDaCena({ capitulo: S.cena, enc: S.enc });
  assert.ok(passivePerception(h) < 20);
  assert.equal(cortarNoPerigo(S.enc, h, PELO_FIO, armadilhas).evento?.tipo, 'pisou');
  h.abilities = { ...h.abilities, wis: 30 };          // passiva acima de 20
  assert.ok(passivePerception(h) >= 20);
  const r = cortarNoPerigo(S.enc, h, PELO_FIO, armadilhas);
  assert.equal(r.evento?.tipo, 'notou');
  assert.ok(r.caminho.at(-1).x < 14, 'parou antes de pisar');
  r.evento.armadilha.notar(h, { mostrar: false });
  assert.equal(S.salvo().armadilha, 'vista', 'a cena lembra que viu');
});

await teste('o fio sabido (o disfarce, o Procurar, a volta ao castelo) não pega o grupo; o goblin, sim', async () => {
  const campanha = {};
  const S = await castelo({ campanha });
  S.salvo().armadilha = 'vista';
  const D = await castelo({ campanha });
  assert.equal(D.fio().descoberta, true, 'de volta ao castelo, o fio continua sabido');
  longe(D);
  const h = D.party[0];
  poe(h, 12, 12);
  h.movementLeftFt = 60;
  const hp = h.hp;
  D.enc.moveAlong(h, PELO_FIO);
  assert.equal(h.hp, hp, 'o herói passa por cima');
  assert.equal(h.pos.x, 16);
  const g = makeMonster('goblin', { x: 16, y: 13 });
  D.enc.addCombatant(g);
  g.movementLeftFt = 30;
  const hpG = g.hp;
  D.enc.moveAlong(g, [{ x: 16, y: 13 }, { x: 15, y: 13 }]);
  assert.ok(g.hp < hpG || g.dead, 'o goblin não sabe, e pisa');
});

await teste('o gancho do Encontrar Armadilhas vem da região, e achar por ele a cena também lembra', async () => {
  const S = await castelo();
  const h = S.party[0];
  poe(h, 12, 12);
  const g = ganchosMagicosDaCena({ capitulo: S.cena, enc: S.enc }, h).filter((x) => x.tipo === 'armadilha');
  assert.equal(g.length, 1, 'um gancho só: o da região (a cena não repete o dela)');
  g[0].revelar();
  assert.equal(S.salvo().armadilha, 'vista');
});

// ---- as extensões do motor, num campo de teste
const ABERTO = Array(10).fill('..........');
function campo(regioes) {
  const field = new Battlefield(10, 10, ABERTO);
  prepararRegioes(field, regioes);
  const party = makeParty({ nivel: 2 });
  party.forEach((c, i) => { c.pos = { x: 9, y: 9 - i }; });
  const enc = new Encounter({ battlefield: field, party, foes: [], rng: makeRng(3), onLog: () => {}, onEvent: () => {} });
  enc.firstSide = 'party';
  enc.round = 1;
  enc.beginSide('party');
  return { enc, party, field };
}

await teste('voltar: devolve quem pisou para a casa de onde veio, e nunca para dentro da região', async () => {
  const { enc, party } = campo([{ id: 'buraco', casas: ['4,4', '5,4', '4,5', '5,5'], efeitos: [{ tipo: 'voltar' }] }]);
  const h = party[0];
  poe(h, 3, 4);
  enc.moveAlong(h, [{ x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 }]);
  assert.deepEqual({ x: h.pos.x, y: h.pos.y }, { x: 3, y: 4 });
  // com a casa de onde veio tomada por outro (ele entrou ali depois), a volta acha a livre mais perto, fora do buraco
  const outro = party[1];
  poe(h, 3, 5);
  h.movementLeftFt = 30;
  enc.moveAlong(h, [{ x: 3, y: 5 }, { x: 4, y: 5 }]);
  assert.ok(!['4,4', '5,4', '4,5', '5,5'].includes(`${h.pos.x},${h.pos.y}`), `fora do buraco: ${h.pos.x},${h.pos.y}`);
  assert.ok(outro.pos.x === 9, 'o outro não se mexeu');
});

await teste('alvo todos: o efeito pega quem está dentro, e o resultado traz cada um', async () => {
  let res = null;
  const { enc, party } = campo([{ id: 'teto', casas: ['4,4', '5,4'], efeitos: [{ tipo: 'dano', dados: '2d4', alvo: 'todos' }, { tipo: 'condicao', condicao: 'caido', alvo: 'todos' }] }]);
  enc.onEvent = (ev) => { if (ev.type === 'regiao') res = ev.resultado; };
  const [a, b, c] = party;
  poe(b, 5, 4);
  poe(c, 6, 4);           // fora
  poe(a, 3, 4);
  const hp = [a.hp, b.hp, c.hp];
  enc.moveAlong(a, [{ x: 3, y: 4 }, { x: 4, y: 4 }]);
  assert.ok(a.hp < hp[0] && b.hp < hp[1], 'quem pisou e quem estava dentro');
  assert.equal(c.hp, hp[2], 'quem estava fora, não');
  assert.equal(res.atingidos.length, 2);
  assert.equal(res.dano, hp[0] - a.hp, 'o resultado de quem pisou');
});

console.log(`\n${total - falhas}/${total} testes passaram`);
if (falhas) process.exit(1);
