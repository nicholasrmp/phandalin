// Teste do motor de consumíveis, sem navegador.
//
// POR QUE NÃO É UM CLIQUE NO JOGO
// Testar poção pela interface exige ganhar a iniciativa, levar dano e achar o
// azulejo certo — três coisas que mudam a cada recarregamento e nenhuma delas
// é o que está sendo testado. Aqui o encontro é montado à mão, com semente
// fixa, e o que se afirma é o que importa: curou dentro da faixa, gastou a
// ação, tirou da mochila, e NENHUMA recusa cobrou nada.
//
// Roda com:  node src/dev/itens.js
// Teste do motor de consumíveis, sem navegador.
// Roda com: node teste-itens.mjs


const { Encounter } = await import('../rules/combat.js');
const { makeParty } = await import('../rules/party.js');
const { MAP, PARTY_SPOTS, buildFoes } = await import('../game/encounter.js');
const { quantosNaMochila, garantirInventario, consumiveisDe } = await import('../rules/equipment.js');
const { Battlefield } = await import('../core/grid.js');
const { makeRng } = await import('../core/rng.js');

let falhas = 0;
const ok = (cond, msg, extra = '') => {
  console.log(`${cond ? '  ok  ' : ' FALHA'} ${msg}${extra ? ` — ${extra}` : ''}`);
  if (!cond) falhas++;
};

function novoEncontro() {
  const party = makeParty();
  party.forEach((c, i) => { c.pos = { ...PARTY_SPOTS[i], f: 1 }; });
  const foes = buildFoes('padrao');
  const field = new Battlefield(MAP[0].length, MAP.length, MAP);
  const enc = new Encounter({ battlefield: field, party, foes, rng: makeRng(1234) });
  return { enc, party };
}

console.log('\n== poção de cura ==');
{
  const { enc, party } = novoEncontro();
  const dara = party[0];
  garantirInventario(dara);
  enc.side = 'party';
  dara.actionUsed = false;

  const antes = quantosNaMochila(dara, 'pocaoDeCura');
  ok(antes === 2, 'a mochila começa com 2 poções', `tem ${antes}`);

  // De vida cheia tem de recusar e NÃO gastar nada.
  const cheio = enc.useItem(dara, 'pocaoDeCura');
  ok(!cheio.ok, 'recusa beber de vida cheia', cheio.why);
  ok(quantosNaMochila(dara, 'pocaoDeCura') === 2, 'a recusa não gastou a poção');
  ok(dara.actionUsed === false, 'a recusa não gastou a ação');

  // Machucada: tem de curar, gastar a poção e gastar a ação.
  dara.hp = 5;
  const r = enc.useItem(dara, 'pocaoDeCura');
  ok(r.ok, 'bebe quando está ferida', r.why ?? '');
  ok(dara.hp > 5, 'a vida subiu', `${5} → ${dara.hp}`);
  ok(dara.hp >= 5 + 4 && dara.hp <= 5 + 10, 'a cura está na faixa de 2d4+2', `curou ${dara.hp - 5}`);
  ok(quantosNaMochila(dara, 'pocaoDeCura') === 1, 'a poção saiu da mochila');
  ok(dara.actionUsed === true, 'a ação do turno foi gasta');

  // Segunda tentativa no mesmo turno tem de ser recusada.
  dara.hp = 5;
  const dobro = enc.useItem(dara, 'pocaoDeCura');
  ok(!dobro.ok, 'recusa a segunda poção no mesmo turno', dobro.why);
  ok(quantosNaMochila(dara, 'pocaoDeCura') === 1, 'a recusa não gastou a segunda');
}

console.log('\n== kit de cura ==');
{
  const { enc, party } = novoEncontro();
  const brenn = party.find((c) => c.skills?.includes('medicina'));
  const pip = party.find((c) => c.id === 'pc-ladino');
  garantirInventario(brenn);
  enc.side = 'party';

  ok(quantosNaMochila(brenn, 'kitDeCura') === 1, 'o clérigo carrega o kit (tem Medicina)');

  // Ninguém caído: recusa.
  brenn.actionUsed = false;
  const semCaido = enc.useItem(brenn, 'kitDeCura', { target: pip });
  ok(!semCaido.ok, 'recusa estabilizar quem não está caindo', semCaido.why);

  // Pip caído e ao lado: estabiliza sem rolar Medicina.
  pip.hp = 0;
  pip.pos = { x: brenn.pos.x + 1, y: brenn.pos.y, f: 1 };
  const { addCondition } = await import('../rules/conditions.js');
  addCondition(pip, 'inconsciente');
  pip.stable = false;

  const r = enc.useItem(brenn, 'kitDeCura', { target: pip });
  ok(r.ok, 'estabiliza o aliado caído ao lado', r.why ?? '');
  ok(pip.stable === true, 'o aliado ficou estável');
  ok(brenn.actionUsed === true, 'gastou a ação');

  // O kit tem dez usos: continua na mochila.
  const entrada = brenn.bag.find((e) => e.id === 'kitDeCura');
  ok(entrada?.usosRestantes === 9, 'o kit perdeu UM uso e continua na mochila', `restam ${entrada?.usosRestantes}`);
}

console.log('\n== alcance ==');
{
  const { enc, party } = novoEncontro();
  const brenn = party.find((c) => c.skills?.includes('medicina'));
  const ilvan = party.find((c) => c.id === 'pc-mago');
  enc.side = 'party';
  garantirInventario(brenn);
  brenn.actionUsed = false;
  ilvan.pos = { x: brenn.pos.x + 6, y: brenn.pos.y, f: 1 };
  ilvan.hp = 3;
  const longe = enc.useItem(brenn, 'pocaoDeCura', { target: ilvan });
  ok(!longe.ok, 'recusa dar poção para quem está longe', longe.why);
  ok(brenn.actionUsed === false, 'a recusa de alcance não gastou a ação');
}

console.log('\n== o que a barra oferece ==');
{
  const { party } = novoEncontro();
  for (const c of party) {
    const lista = consumiveisDe(c).map((x) => `${x.dados.name}×${x.qtd}`);
    console.log(`  ${c.name}: ${lista.join(', ') || '(nada)'}`);
  }
}

console.log(`\n${falhas === 0 ? 'TUDO PASSOU' : `${falhas} FALHA(S)`}\n`);
process.exit(falhas ? 1 : 0);
