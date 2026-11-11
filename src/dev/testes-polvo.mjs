// O POLVO DA CAVERNA TROVEJANTE (Onda Eco, W16, o Obelisco), com a cena DE VERDADE em Node:
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-polvo.mjs
//
// O polvo puxa para a água funda quem ele agarra, e quem começa o turno nela faz Força CD 10 ou afunda (`submerso`).
// A primeira versão puxava no EVENTO do golpe e nunca puxou ninguém: o motor avisa o ataque antes de aplicar o
// `onHit`, então no evento o alvo ainda não estava contido. Este teste falha nela.
process.env.ALVO = 'ondaEco';
import assert from 'node:assert/strict';
const { novaCena, A } = await import('./cena-node/lib.mjs');
const P = new URL('../', import.meta.url).href;
const { addCondition, hasCondition } = await import(P + 'rules/conditions.js');

let falhas = 0;
let total = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) { falhas += 1; console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`); }
}

/** Abre a luta do polvo: o grupo na beirada da caverna 16, um herói com a tocha acesa. */
async function lutaDoPolvo(seed) {
  const S = await novaCena(seed, { nivel: 4 });
  const aguas = S.field.aguas;
  const [pv] = A.ninhos.polvo;
  const perto = (p) => Math.abs(p.x - pv.x) + Math.abs(p.y - pv.y);
  const beirada = A.areas['16']
    .filter((p) => !S.field.blocksMove(p.x, p.y) && !aguas.has(`${p.x},${p.y}`) && !S.enc.occupied(p.x, p.y))
    .sort((a, b) => perto(a) - perto(b));
  S.party.forEach((h, i) => { h.pos = { ...h.pos, ...beirada[i * 2] }; });
  S.party[2].tochaAcesa = true;
  await S.cena.depoisDeMover(S.party[2]);
  const polvo = S.enc.combatants.find((c) => c.defId === 'polvoGigante');
  return { S, aguas, polvo };
}

await teste('o polvo arrasta para a água funda quem ele agarra', async () => {
  const { S, aguas, polvo } = await lutaDoPolvo(7);
  assert.ok(polvo && !S.cena.explorando, 'a tocha na caverna 16 abre a luta do polvo');
  const dara = S.party[0];
  assert.ok(!aguas.has(`${dara.pos.x},${dara.pos.y}`), 'Dara começa na beirada, fora da água');
  addCondition(dara, 'contido', { source: polvo.id, data: { escape: 16 } });
  S.cena.evento({ type: 'sideStart', side: 'party' });
  assert.ok(aguas.has(`${dara.pos.x},${dara.pos.y}`), `Dara foi para a água (está em ${dara.pos.x},${dara.pos.y})`);
  assert.ok(S.enc.log.some((l) => /arrasta Dara/.test(typeof l === 'string' ? l : l.text)), 'o registro conta o puxão');
});

await teste('agarrado por OUTRO bicho, ninguém é puxado', async () => {
  const { S, aguas } = await lutaDoPolvo(8);
  const pip = S.party[1];
  const antes = { ...pip.pos };
  addCondition(pip, 'contido', { source: 'outro', data: { escape: 12 } });
  S.cena.evento({ type: 'sideStart', side: 'party' });
  assert.deepEqual({ x: pip.pos.x, y: pip.pos.y }, { x: antes.x, y: antes.y });
  assert.ok(!aguas.has(`${pip.pos.x},${pip.pos.y}`));
});

await teste('na água funda: Força CD 10 no começo do turno, e quem falha afunda; fora dela, a condição sai', async () => {
  const { S, aguas, polvo } = await lutaDoPolvo(9);
  const ilvan = S.party[3];
  addCondition(ilvan, 'contido', { source: polvo.id, data: { escape: 16 } });
  ilvan.abilities = { ...ilvan.abilities, str: 1 };   // Força 1: falha em 70% das vezes, então afunda em poucas rodadas
  for (let i = 0; i < 30 && !hasCondition(ilvan, 'submerso'); i += 1) S.cena.evento({ type: 'sideStart', side: 'party' });
  assert.ok(aguas.has(`${ilvan.pos.x},${ilvan.pos.y}`), 'Ilvan está na água');
  assert.ok(hasCondition(ilvan, 'submerso'), 'com Força 1, Ilvan afunda');
  const r = S.enc.canCast?.(ilvan, 'misselMagico');
  if (r) assert.equal(r.ok, false, "debaixo d'água não se conjura magia com fala");
  // Solto e fora da água, a condição sai no começo do turno seguinte.
  ilvan.conditions = ilvan.conditions.filter((k) => k.id !== 'contido');
  const seca = A.areas['16'].find((p) => !S.field.blocksMove(p.x, p.y) && !aguas.has(`${p.x},${p.y}`) && !S.enc.occupied(p.x, p.y));
  ilvan.pos = { ...ilvan.pos, ...seca };
  S.cena.evento({ type: 'sideStart', side: 'party' });
  assert.ok(!hasCondition(ilvan, 'submerso'), 'fora da água, Ilvan não está mais submerso');
});

const { gastarFolego } = await import(P + 'rules/conditions.js');

await teste('o fôlego do SRD: 1 + CON minutos de ar (mínimo 5 rodadas), CON rodadas sem ar, e então cai', async () => {
  const c = { abilities: { con: 10 } };
  const passos = [];
  for (let i = 0; i < 12; i += 1) passos.push(gastarFolego(c));
  // CON 10: 1 minuto = 10 rodadas de ar; sem ar, aguenta 1 rodada (o mínimo); na seguinte, cai.
  assert.deepEqual(passos.slice(0, 9), Array(9).fill(null));
  assert.equal(passos[9], 'semAr');
  assert.equal(passos[10], null);
  assert.equal(passos[11], 'cai');
  assert.equal(gastarFolego({ abilities: { con: 10 }, respiraNaAgua: true }), null, 'a Respirar na Água não gasta o ar');
});

await teste('na cena: quem fica preso no fundo sem ar se afoga, e quem tem a Respirar na Água não', async () => {
  const { S, aguas, polvo } = await lutaDoPolvo(10);
  const [pip, ilvan] = [S.party[1], S.party[3]];
  for (const h of [pip, ilvan]) {
    addCondition(h, 'contido', { source: polvo.id, data: { escape: 16 } });
    h.abilities = { ...h.abilities, str: 1 };
  }
  S.cena.evento({ type: 'sideStart', side: 'party' });            // puxados para a água
  for (const h of [pip, ilvan]) assert.ok(aguas.has(`${h.pos.x},${h.pos.y}`), `${h.name} na água`);
  ilvan.respiraNaAgua = true;
  // Os dois no fundo, com o ar no fim (o fôlego já gasto e as rodadas sem ar contadas): no começo do turno seguinte,
  // o fôlego vem ANTES do teste de Força, e quem estava sem ar perde os sentidos — subir agora já não salva.
  for (const h of [pip, ilvan]) {
    if (!h.conditions.some((k) => k.id === 'submerso')) addCondition(h, 'submerso');
    h.folego = 0;
    h.sufocando = 0;
  }
  S.cena.evento({ type: 'sideStart', side: 'party' });
  assert.equal(pip.hp, 0, 'Pip, sem ar, perdeu os sentidos');
  assert.ok(S.enc.log.some((l) => /Pip se afoga/.test(typeof l === 'string' ? l : l.text)), 'o registro conta o afogamento');
  assert.ok(ilvan.hp > 0, 'Ilvan respira na água e não se afoga');
});

await teste('a caveira em chamas volta a arder (o SRD): a menos que alguém trate os restos com água benta', async () => {
  const S = await novaCena(3, { nivel: 5 });
  const salvo = S.app.campanha.ondaEco;
  const sala12 = A.areas['12'].filter((p) => !S.field.blocksMove(p.x, p.y) && !S.enc.occupied(p.x, p.y));
  S.party.forEach((h, i) => { h.pos = { ...h.pos, ...sala12[i * 3] }; });
  await S.cena.depoisDeMover(S.party[0]);
  const caveira = S.enc.combatants.find((c) => c.defId === 'caveiraCandente');
  assert.ok(caveira && !S.cena.explorando, 'a fundição acorda');
  for (const f of S.enc.combatants.filter((c) => c.side === 'foes')) { f.hp = 0; f.dead = true; }
  await S.cena.fimDoCombate('vitoria');
  assert.ok(salvo.caveiraRestos, 'os restos da caveira ficam no chão');
  // sair e voltar: ela reacendeu, e a luta é só com ela
  await S.cena.iniciar();
  assert.ok(salvo.caveiraVolta);
  await S.cena.depoisDeMover(S.party[0]);
  const deVolta = S.enc.combatants.find((c) => c.defId === 'caveiraCandente' && !c.dead);
  assert.ok(deVolta && !S.cena.explorando, 'a caveira voltou a arder');
  deVolta.hp = 0; deVolta.dead = true;
  await S.cena.fimDoCombate('vitoria');
  const r = salvo.caveiraRestos;
  assert.ok(r, 'de novo, os restos');
  // a água benta apaga para sempre
  const h = S.party[0];
  h.pos = { ...h.pos, x: r.x + (S.field.blocksMove(r.x + 1, r.y) ? -1 : 1), y: r.y };
  const { garantirInventario } = await import(P + 'rules/equipment.js');
  garantirInventario(h).bag.push({ id: 'aguaBenta', name: 'Água benta', qtd: 1 });
  const op = S.cena.interacoes(r, S.field.surfaceAt(r.x, r.y), h).find((o) => /água benta/.test(o.rotulo));
  assert.ok(op && !op.motivo, op?.motivo);
  await op.fazer();
  assert.ok(salvo.caveiraApagada && !salvo.caveiraRestos);
  await S.cena.iniciar();
  assert.ok(!salvo.caveiraVolta, 'apagada, não volta');
});

console.log(`\n${total - falhas}/${total} testes passaram.`);
if (falhas) process.exit(1);
