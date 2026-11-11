// O CONVERSOR DE BESTIÁRIO (`importar-bestiario.mjs`): os números do bloco do livro chegam inteiros ao formato do jogo.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-importar-bestiario.mjs
//
// Lê o dado do MM em `_referencias/5etools/` (fora do repositório). Sem ele, avisa e sai sem falhar.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const DADO = `${RAIZ}_referencias/5etools/bestiary/bestiary-mm.json`;
if (!fs.existsSync(DADO)) { console.log('sem o dado do MM em _referencias/5etools: nada a testar'); process.exit(0); }
const { golpe, sopro, multiataque, conjuracao, bloco } = await import('./importar-bestiario.mjs');
const MM = JSON.parse(fs.readFileSync(DADO, 'utf8')).monster;
const de = (nome) => MM.find((m) => m.name === nome);
const acao = (m, nome) => m.action.find((a) => a.name.startsWith(nome));

let total = 0;
let falhas = 0;
function teste(nome, fn) {
  total += 1;
  try { fn(); console.log(`ok    ${nome}`); } catch (e) { falhas += 1; console.log(`FALHA ${nome}\n      ${String(e.stack ?? e.message).split('\n').slice(0, 5).join('\n      ')}`); }
}

teste('o golpe: acerto, alcance, dados e tipo saem do texto do livro', () => {
  const g = golpe(acao(de('Aboleth'), 'Tail'), 'Cauda');
  assert.deepEqual([g.bonus, g.reachFt, g.damage, g.type], [9, 10, '3d6+5', 'concussão']);
  const arco = golpe(acao(de('Hill Giant'), 'Rock'), 'Pedra');
  assert.ok(arco.ranged && arco.rangeFt === 60 && arco.longRangeFt === 240);
});

// os golpes lidos do bloco, com o nome do livro como nome no jogo (para a prova, basta casar)
const golpesDe = (m) => m.action.filter((a) => !/^Multiattack/.test(a.name)).map((a) => {
  const nome = a.name.replace(/\{@[^}]*\}/g, '').replace(/\s*\(.*\)\s*$/, '').trim();
  const g = golpe(a, nome);
  if (g) g.nomeEn = nome;
  return g;
}).filter(Boolean);
const multiDe = (nome) => { const m = de(nome); return multiataque(acao(m, 'Multiattack'), {}, golpesDe(m)); };

teste('o multiataque conta os golpes e, quando o livro diz quais, a sequência', () => {
  const mult = multiDe('Hill Giant');
  assert.equal(mult.count, 2);
  assert.deepEqual(mult.sequence, ['Greatclub', 'Greatclub']);
});

// O MULTIATAQUE DE GOLPES DIFERENTES: antes, 39 criaturas do MM saíam com `{ count }` só, e o motor repetia o primeiro
// golpe (o grick alfa dava duas caudas; o xorn, três mordidas). Cada uma destas falha no leitor antigo.
teste('"três garras e uma mordida": a sequência inteira, com o total somado (o xorn)', () => {
  assert.deepEqual(multiDe('Xorn'), { count: 4, sequence: ['Claw', 'Claw', 'Claw', 'Bite'] });
});

teste('o golpe condicional: o bico do grick alfa só depois dos tentáculos', () => {
  assert.deepEqual(multiDe('Grick Alpha'), { count: 3, sequence: ['Tail', 'Tentacles', 'Beak'], condicional: { Beak: 'Tentacles' } });
});

teste('"... ou três com os espinhos da cauda": as sequências alternativas (a mantícora, o centauro)', () => {
  assert.deepEqual(multiDe('Manticore').sequencias, [['Bite', 'Claw', 'Claw'], ['Tail Spike', 'Tail Spike', 'Tail Spike']]);
  assert.deepEqual(multiDe('Centaur').sequencias, [['Pike', 'Hooves'], ['Longbow', 'Longbow']]);
});

teste('"três ataques corpo a corpo; ou duas azagaias": qualquer arma três vezes, as azagaias duas', () => {
  assert.deepEqual(multiDe('Hobgoblin Warlord'), { count: 3, porArma: { Javelin: 2 } });
});

teste('"só uma vez cada": a abominação yuan-ti morde e constringe uma vez nos três golpes de perto', () => {
  assert.deepEqual(multiDe('Yuan-ti Abomination').sequencias, [['Scimitar', 'Bite', 'Constrict'], ['Longbow', 'Longbow']]);
});

teste('"só um pode ser a mordida": a cria vampírica não morde duas vezes', () => {
  assert.deepEqual(multiDe('Vampire Spawn'), { count: 2, sequence: ['Claws', 'Bite'] });
});

teste('os números além de quatro e o plural do golpe (a marilith: seis espadas e a cauda)', () => {
  const m = multiDe('Marilith');
  assert.equal(m.count, 7);
  assert.deepEqual(m.sequence, [...Array(6).fill('Longsword'), 'Tail']);
});

teste('o sopro do dragão: cone, CD, dados, tipo, metade e a recarga 5–6', () => {
  const s = sopro(acao(de('Adult Red Dragon'), 'Fire Breath'), 'Sopro de Fogo');
  assert.deepEqual([s.shape, s.areaFt, s.save, s.dc, s.damage, s.damageType, s.halfOnSave], ['cone', 60, 'dex', 21, '18d6', 'fogo', true]);
  assert.deepEqual(s.recharge, [5, 6]);
});

teste('o golpe que paralisa: a condição, a CD, um minuto e a resistência repetida', () => {
  const g = golpe(acao(de('Ghast'), 'Claws'), 'Garras');
  assert.equal(g.onHit.condition, 'paralisado');
  assert.equal(g.onHit.dc, 10);
  assert.equal(g.onHit.rounds, 10);
  assert.ok(g.onHit.repete);
});

teste('o veneno que fere quem falha e dá metade a quem passa', () => {
  const g = golpe(acao(de('Giant Scorpion'), 'Sting'), 'Ferrão');
  assert.equal(g.onHit.save, 'con');
  assert.equal(g.onHit.danoSeFalhar.damage, '4d10');
  assert.ok(g.onHit.metadeSePassar);
});

teste('a conjuração: as magias que temos entram, as que faltam vão para a fila', () => {
  const tabela = JSON.parse(fs.readFileSync(`${RAIZ}src/dev/bestiario/magias-en.json`, 'utf8'));
  const faltam = new Set();
  // a tabela SEM uma magia que o lich lança: ela tem de ir para a fila (desde o PHB, o lich do MM tem todas as dele)
  delete tabela['power word stun'];
  const sc = conjuracao(de('Lich'), tabela, faltam);
  assert.equal(sc.ability, 'int');
  assert.ok(sc.prepared.includes(tabela.fireball), 'a Bola de Fogo do lich');
  assert.ok(Object.values(sc.cdPorMagia).every((cd) => cd === 20), 'a CD do bloco');
  assert.ok(faltam.has('power word stun'), 'a magia que falta vai para a fila');
});

teste('o bloco inteiro: ND, XP, proficiência pelo ND, tamanho, sentidos, resistências e a fila do que falta', () => {
  const pend = [];
  const { def } = bloco(de('Adult Red Dragon'), { nome: 'Dragão Vermelho Adulto', acoes: [], tracos: [] }, {}, pend);
  assert.deepEqual([def.cr, def.xp, def.size, def.ac, def.maxHp], ['17', 18000, 'enorme', 19, 256]);
  assert.equal(def.level, 17, 'nível 17 = proficiência +6, a do ND 17');
  assert.equal(def.flyFt, 80);
  assert.equal(def.senses.blindsightFt, 60);
  assert.deepEqual(def.damageImmunities, ['fogo']);
  assert.deepEqual(def.recursos, { resistenciaLendaria: 3 });
  assert.ok(pend.some((p) => p.lendarias?.length), 'as ações lendárias vão para a fila');
});

console.log(`\n${total - falhas}/${total} testes passaram.`);
if (falhas) process.exit(1);
