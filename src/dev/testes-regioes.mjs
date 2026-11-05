// Testes das REGIÕES do mapa (`rules/regioes.js`): a área que faz algo quando alguém entra, sai, ou começa e termina o
// turno nela. Rode com:
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-regioes.mjs

import assert from 'node:assert/strict';
import { Encounter, } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { makeMonster } from '../rules/monsters.js';
import { Battlefield } from '../core/grid.js';
import { makeRng } from '../core/rng.js';
import { prepararRegioes, alternarRegiao, armadilhasDasRegioes, regioesEm, descobrirRegiao } from '../rules/regioes.js';
import { cortarNoPerigo } from '../game/armadilhas.js';
import { montarCampo } from '../game/campo.js';
import { limpar, novoMapa, porRegiao, regiaoNoRetangulo, regiaoNoPoligono, regiaoNaCasa, tirarRegiao, regioesEm as regioesDoMapa, redimensionar } from '../game/mapa-editor.js';
import { hasCondition } from '../rules/conditions.js';
import { mapaDo } from '../game/encounter.js';
import { PONTOS_DO_ESCONDERIJO as PE } from '../game/esconderijo.js';
import { Battlefield as Campo } from '../core/grid.js';

const ABERTO = Array(12).fill('............');
const [DARA, PIP] = [0, 1];

function montar({ regioes = [], foes = [], lugares } = {}) {
  const field = new Battlefield(12, 12, ABERTO);
  prepararRegioes(field, regioes);
  const party = makeParty({ nivel: 2 });
  (lugares ?? [{ x: 1, y: 5 }, { x: 1, y: 7 }, { x: 1, y: 9 }, { x: 1, y: 11 }]).forEach((p, i) => { party[i].pos = { ...p }; });
  const fs = foes.map(([id, p]) => makeMonster(id, p));
  const log = [];
  const eventos = [];
  const enc = new Encounter({ battlefield: field, party, foes: fs, rng: makeRng(7), onLog: (e) => log.push(e), onEvent: (e) => eventos.push(e) });
  enc.firstSide = 'party';
  enc.round = 1;
  enc.beginSide('party');
  return { enc, party, foes: fs, log, eventos, field };
}
const linha = (y, x0, x1) => Array.from({ length: x1 - x0 + 1 }, (_, i) => ({ x: x0 + i, y }));
const casas = (...ps) => ps.map(([x, y]) => `${x},${y}`);

let falhas = 0;
let total = 0;
function teste(nome, fn) {
  total += 1;
  try { fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`);
  }
}

teste('entrar: o dano com teste pega quem pisa, e o passo segue', () => {
  const { enc, party, log } = montar({ regioes: [{ id: 'brasas', nome: 'Brasas', casas: casas([3, 5]), efeitos: [{ tipo: 'dano', dados: '2d4', dano: 'fogo', teste: { atributo: 'dex', cd: 40 } }] }] });
  const dara = party[DARA];
  const pv = dara.hp;
  assert.ok(enc.moveAlong(dara, linha(5, 1, 5)));
  assert.deepEqual([dara.pos.x, dara.pos.y], [5, 5], 'sem `parar`, o passo vai até o fim');
  assert.ok(dara.hp < pv, 'sofreu o dano');
  assert.ok(log.some((l) => /Brasas: Dara sofre \d+ de fogo/.test(l.text ?? l.texto ?? String(l))), 'e o registro diz');
});

teste('parar: o passo acaba na casa da região', () => {
  const { enc, party } = montar({ regioes: [{ id: 'lama', casas: casas([3, 5]), efeitos: [{ tipo: 'texto', texto: 'A bota afunda.' }, { tipo: 'parar' }] }] });
  const dara = party[DARA];
  enc.moveAlong(dara, linha(5, 1, 6));
  assert.deepEqual([dara.pos.x, dara.pos.y], [3, 5]);
  assert.equal(dara.movementLeftFt, 30 - 10, 'e só paga o que andou');
});

teste('vezes 1: dispara uma vez e se desliga', () => {
  const { enc, party, field } = montar({ regioes: [{ id: 'placa', casas: casas([3, 5], [3, 7]), vezes: 1, efeitos: [{ tipo: 'dano', dados: '1d4' }] }] });
  const [dara, pip] = [party[DARA], party[PIP]];
  const pvDara = dara.hp;
  const pvPip = pip.hp;
  enc.moveAlong(dara, linha(5, 1, 4));
  enc.moveAlong(pip, linha(7, 1, 4));
  assert.ok(dara.hp < pvDara, 'o primeiro leva');
  assert.equal(pip.hp, pvPip, 'o segundo, não');
  assert.equal(field.regioes[0].desligada, true);
});

teste('sair: dispara ao deixar a área, não ao entrar', () => {
  const { enc, party, eventos } = montar({ regioes: [{ id: 'circulo', casas: casas([2, 5], [3, 5]), quando: ['sair'], efeitos: [{ tipo: 'texto', texto: 'O ar esfria.' }] }] });
  enc.moveAlong(party[DARA], linha(5, 1, 3));
  assert.equal(eventos.filter((e) => e.type === 'regiao').length, 0, 'entrando, nada');
  enc.moveAlong(party[DARA], linha(5, 3, 5));
  assert.equal(eventos.filter((e) => e.type === 'regiao' && e.quando === 'sair').length, 1, 'saindo, uma vez');
});

teste('quem: a região dos inimigos não pega herói, e pega o goblin', () => {
  const { enc, party, foes } = montar({
    regioes: [{ id: 'runa', casas: casas([3, 5], [8, 2]), quem: 'inimigos', efeitos: [{ tipo: 'dano', dados: '1d4+10' }] }],
    foes: [['goblin', { x: 8, y: 1 }]],
  });
  const dara = party[DARA];
  const pv = dara.hp;
  enc.moveAlong(dara, linha(5, 1, 4));
  assert.equal(dara.hp, pv, 'herói passa');
  const g = foes[0];
  g.movementLeftFt = 30;
  enc.moveAlong(g, [{ x: 8, y: 1 }, { x: 8, y: 2 }]);
  assert.ok(g.dead || g.hp <= 0, 'o goblin cai na runa');
});

teste('terreno difícil: as casas custam o dobro enquanto ligada; alternar desliga', () => {
  const { enc, party, field } = montar({ regioes: [{ id: 'mato', casas: casas([2, 5], [3, 5]), efeitos: [{ tipo: 'terrenoDificil' }] }] });
  const dara = party[DARA];
  assert.equal(enc.reachableFor(dara).get('2,5').cost, 10, 'a casa de mato custa 10');
  assert.equal(enc.reachableFor(dara).get('3,5').cost, 15, 'e o caminho até a de trás corta pela diagonal: 5 + 10');
  assert.ok(alternarRegiao(field, 'mato', false));
  assert.equal(enc.reachableFor(dara).get('2,5').cost, 5, 'desligada, chão normal');
});

teste('alternar e sobreposição: a placa abre a outra região e acende a arte', () => {
  const { enc, party, field } = montar({
    regioes: [
      { id: 'placa', casas: casas([3, 5]), efeitos: [{ tipo: 'alternar', regiao: 'fosso', ligada: true }, { tipo: 'sobreposicao', id: 'alcapao', ligada: true }] },
      { id: 'fosso', casas: casas([6, 5]), desligada: true, efeitos: [{ tipo: 'parar' }] },
    ],
  });
  const acesas = [];
  field.alternarSobreposicao = (id, ligada) => acesas.push([id, ligada]);
  assert.equal(regioesEm(field, { x: 6, y: 5 }).length, 0, 'o fosso começa desligado');
  enc.moveAlong(party[DARA], linha(5, 1, 4));
  assert.equal(regioesEm(field, { x: 6, y: 5 }).length, 1, 'a placa ligou o fosso');
  assert.deepEqual(acesas, [['alcapao', true]]);
  party[DARA].movementLeftFt = 30;
  enc.moveAlong(party[DARA], linha(5, 4, 8));
  assert.deepEqual([party[DARA].pos.x, party[DARA].pos.y], [6, 5], 'e o fosso para quem chega nele');
});

teste('começa o turno dentro: o lado que começa o turno na área leva', () => {
  const { enc, party } = montar({ regioes: [{ id: 'gas', casas: casas([1, 5]), quando: ['comecaTurno'], efeitos: [{ tipo: 'dano', dados: '1d6', dano: 'veneno' }] }] });
  const dara = party[DARA];
  const pv = dara.hp;
  enc.beginSide('party');
  assert.ok(dara.hp < pv);
});

teste('condição: falhou no teste, fica caído e o passo acaba', () => {
  const { enc, party } = montar({ regioes: [{ id: 'gelo', casas: casas([3, 5]), efeitos: [{ tipo: 'condicao', condicao: 'caido', teste: { atributo: 'dex', cd: 40 } }] }] });
  const dara = party[DARA];
  enc.moveAlong(dara, linha(5, 1, 6));
  assert.ok(hasCondition(dara, 'caido'));
  assert.deepEqual([dara.pos.x, dara.pos.y], [3, 5]);
});

teste('teleporte: leva para a casa, ou para a livre mais perto', () => {
  const { enc, party } = montar({ regioes: [{ id: 'portal', casas: casas([3, 5]), efeitos: [{ tipo: 'teleporte', x: 10, y: 10 }] }], lugares: [{ x: 1, y: 5 }, { x: 10, y: 10 }, { x: 1, y: 9 }, { x: 1, y: 11 }] });
  const dara = party[DARA];
  enc.moveAlong(dara, linha(5, 1, 6));
  assert.ok(Math.max(Math.abs(dara.pos.x - 10), Math.abs(dara.pos.y - 10)) === 1, 'a casa estava tomada pelo Pip: foi para a do lado');
});

teste('escondida: a Percepção passiva nota antes e para; descoberta, o grupo passa e o monstro não sabe', () => {
  const { enc, party, foes } = montar({
    regioes: [{ id: 'fosso', nome: 'O fosso', casas: casas([4, 5], [8, 3]), escondida: { cd: 5, achado: 'O chão soa oco.' }, efeitos: [{ tipo: 'dano', dados: '2d6' }, { tipo: 'parar' }] }],
    foes: [['goblin', { x: 8, y: 1 }]],
  });
  const dara = party[DARA];
  const armas = armadilhasDasRegioes(enc);
  assert.equal(armas.length, 1);
  const { caminho, evento } = cortarNoPerigo(enc, dara, linha(5, 1, 7), armas);
  assert.equal(evento?.tipo, 'notou', 'a passiva da Dara alcança CD 5');
  assert.deepEqual(caminho.at(-1), { x: 2, y: 5 }, 'para antes, ao lado');
  evento.armadilha.notar(dara);
  const pv = dara.hp;
  enc.moveAlong(dara, linha(5, 1, 6));
  assert.equal(dara.hp, pv, 'descoberta, o grupo não cai');
  assert.deepEqual([dara.pos.x, dara.pos.y], [6, 5]);
  const g = foes[0];
  g.movementLeftFt = 30;
  const pvG = g.hp;
  enc.moveAlong(g, [{ x: 8, y: 1 }, { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 8, y: 4 }]);
  assert.ok(g.hp < pvG || g.dead, 'o goblin cai');
  assert.deepEqual([g.pos.x, g.pos.y], [8, 3], 'e para no fosso');
});

teste('quem voa passa por cima, a não ser que a região pegue quem voa', () => {
  const { enc, party } = montar({ regioes: [
    { id: 'fosso', casas: casas([3, 5]), efeitos: [{ tipo: 'parar' }] },
    { id: 'teia', casas: casas([3, 7]), pegaQuemVoa: true, efeitos: [{ tipo: 'parar' }] },
  ] });
  const [dara, pip] = [party[DARA], party[PIP]];
  enc.voaAgora = () => true;
  enc.moveAlong(dara, linha(5, 1, 5));
  enc.moveAlong(pip, linha(7, 1, 5));
  assert.deepEqual([dara.pos.x, pip.pos.x], [5, 3]);
});

teste('a criatura Grande pisa a região com qualquer casa da pegada', () => {
  const { enc, foes } = montar({ regioes: [{ id: 'placa', casas: casas([9, 4]), efeitos: [{ tipo: 'parar' }] }], foes: [['ogro', { x: 7, y: 2 }]] });
  const o = foes[0];
  o.movementLeftFt = 30;
  enc.moveAlong(o, [{ x: 7, y: 2 }, { x: 8, y: 3 }, { x: 9, y: 4 }]);
  assert.deepEqual([o.pos.x, o.pos.y], [8, 3], 'a pegada 2x2 em (8,3) já cobre (9,4)');
});

teste('o campo leva uma CÓPIA: o que muda numa partida não fica no mapa', () => {
  const mapa = { terreno: ABERTO, regioes: [{ id: 'placa', casas: casas([3, 5]), vezes: 1, efeitos: [{ tipo: 'texto', texto: 'clique' }] }] };
  const campo = montarCampo(mapa);
  campo.regioes[0].desligada = true;
  assert.equal(mapa.regioes[0].desligada, undefined);
  assert.equal(montarCampo(mapa).regioes[0].desligada, false, 'a próxima partida nasce ligada');
  assert.deepEqual(JSON.parse(JSON.stringify(limpar(mapa))).regioes, mapa.regioes, 'e vai e volta no JSON do editor');
});

teste('editor: guarda só o que não é padrão, pinta por área e tira', () => {
  const m = novoMapa(10, 10);
  assert.ok(porRegiao(m, { id: 'r1', casas: [], quando: ['entrar'], quem: 'todos', vezes: 0, efeitos: [{ tipo: 'parar' }] }));
  assert.deepEqual(m.regioes[0], { id: 'r1', casas: [], efeitos: [{ tipo: 'parar' }] }, 'entrar, todos e vezes 0 são o padrão: não vão');
  assert.equal(regiaoNoRetangulo(m, 'r1', { x: 2, y: 2 }, { x: 4, y: 3 }, true), 6);
  assert.equal(regiaoNoRetangulo(m, 'r1', { x: 2, y: 2 }, { x: 4, y: 3 }, true), 0, 'marcar de novo não muda nada');
  assert.ok(regiaoNaCasa(m, 'r1', 3, 3, false));
  assert.equal(m.regioes[0].casas.length, 5);
  assert.equal(regiaoNoPoligono(m, 'r1', [[6, 6], [8, 6], [8, 8], [6, 8]], true), 4, 'os cantos são de casa: de (6,6) a (8,8) cobre 2x2');
  assert.deepEqual(regioesDoMapa(m, 7, 7).map((r) => r.id), ['r1']);
  assert.ok(porRegiao(m, { ...m.regioes[0], escondida: { cd: 14, achado: 'oco' }, vezes: 1, tamanhoMinimo: 'medio' }), 'trocar a de mesmo id');
  assert.equal(m.regioes[0].tamanhoMinimo, 'medio', 'o tamanho mínimo vai para o mapa');
  assert.equal(m.regioes.length, 1);
  assert.deepEqual(m.regioes[0].escondida, { cd: 14, achado: 'oco' });
  assert.ok(tirarRegiao(m, 'r1'));
  assert.equal(m.regioes, undefined, 'sem nenhuma, o campo some do mapa');
});

teste('editor: crescer o mapa pelo oeste leva as casas e o destino do teleporte', () => {
  const m = novoMapa(10, 10);
  porRegiao(m, { id: 'p', casas: ['2,2'], efeitos: [{ tipo: 'teleporte', x: 5, y: 5 }] });
  assert.ok(redimensionar(m, 'O', 2));
  assert.deepEqual(m.regioes[0].casas, ['4,2']);
  assert.deepEqual([m.regioes[0].efeitos[0].x, m.regioes[0].efeitos[0].y], [7, 5]);
  assert.ok(redimensionar(m, 'O', -5));
  assert.deepEqual(m.regioes[0].casas, [], 'a casa que caiu fora do mapa sai da região');
});

// ---- a laje rachada do esconderijo, que era roteiro do capítulo 2 e virou região do mapa ----

function noEsconderijo() {
  const field = montarCampo(mapaDo('esconderijo'));
  const party = makeParty({ nivel: 2 });
  const log = [];
  const eventos = [];
  const enc = new Encounter({ battlefield: field, party, foes: [makeMonster('goblin', { x: 1, y: 1 })], rng: makeRng(11), onLog: (e) => log.push(e), onEvent: (e) => eventos.push(e) });
  enc.firstSide = 'party';
  enc.round = 1;
  enc.beginSide('party');
  // todos longe da laje, menos quem o teste põe nela
  party.forEach((c, i) => { c.pos = { x: 13 + i, y: 7 }; });
  return { enc, field, party, log, eventos, laje: field.regioes.find((r) => r.id === 'ressalto') };
}
/** O caminho de `c` até uma casa da laje, pelo motor. */
function ateALaje(enc, c) {
  c.movementLeftFt = 60;
  const alcance = enc.reachableFor(c);
  const alvo = PE.ressalto.find((p) => alcance.has(`${p.x},${p.y}`));
  assert.ok(alvo, 'alcança a laje');
  return Campo.pathFrom(alcance, alvo);
}

teste('esconderijo: a laje é uma região escondida do mapa, de uma vez só, só para quem tem peso', () => {
  const { laje } = noEsconderijo();
  assert.ok(laje);
  assert.equal(laje.escondida.cd, 12);
  assert.equal(laje.vezes, 1);
  assert.equal(laje.tamanhoMinimo, 'medio');
  assert.deepEqual([...laje.casas].sort(), PE.ressalto.map((p) => `${p.x},${p.y}`).sort());
});

teste('esconderijo: quem é Médio e pisa nela sem saber rola até o pé da passagem, ferido, e o desabamento acende', () => {
  const { enc, field, party, eventos, laje } = noEsconderijo();
  const dara = party[DARA];
  const acesas = [];
  const antes = field.alternarSobreposicao;
  field.alternarSobreposicao = (id, l) => { acesas.push([id, l]); return antes?.(id, l); };
  const pv = dara.hp;
  enc.moveAlong(dara, ateALaje(enc, dara));
  assert.ok(dara.hp < pv, 'levou o dano');
  assert.ok(Math.max(Math.abs(dara.pos.x - PE.peDaPassagem.x), Math.abs(dara.pos.y - PE.peDaPassagem.y)) <= 1, `foi parar no pé da passagem (está em ${dara.pos.x},${dara.pos.y})`);
  assert.deepEqual(acesas, [['ressaltoCaido', true]]);
  assert.equal(laje.desligada, true, 'caída, não há mais laje');
  const ev = eventos.find((e) => e.type === 'regiao' && e.regiao.id === 'ressalto');
  assert.equal(ev.resultado.dano, pv - dara.hp, 'o evento traz o dano, para o painel da cena');
});

teste('esconderijo: o halfling, Pequeno, passa por ela sem quebrar', () => {
  const { enc, party, laje } = noEsconderijo();
  const pip = party[PIP];
  const pv = pip.hp;
  enc.moveAlong(pip, ateALaje(enc, pip));
  assert.equal(pip.hp, pv);
  assert.equal(laje.desligada, false);
});

teste('esconderijo: descoberta (o Investigar da cena, a passiva, o Procurar), o grupo passa por ela', () => {
  const { enc, field, party, laje } = noEsconderijo();
  assert.ok(descobrirRegiao(field, 'ressalto'));
  const dara = party[DARA];
  const pv = dara.hp;
  enc.moveAlong(dara, ateALaje(enc, dara));
  assert.equal(dara.hp, pv);
  assert.equal(laje.desligada, false, 'continua lá: quem não sabe dela ainda pode cair');
});

teste('esconderijo: a Percepção passiva que alcança a CD 12 para antes, e a cena mostra o que ele viu', () => {
  const { enc, party, eventos } = noEsconderijo();
  // o Brenn, anão, enxerga no escuro da caverna: a armadilha só se nota se o grupo a vê (como sempre foi)
  const brenn = party[2];
  [brenn.pos, party[DARA].pos] = [party[DARA].pos, brenn.pos];   // no lugar da Dara, de onde se chega à laje
  const armas = armadilhasDasRegioes(enc);
  assert.equal(armas.length, 1);
  armas[0].cd = 0;   // a passiva de qualquer um alcança
  const { evento } = cortarNoPerigo(enc, brenn, ateALaje(enc, brenn), armas);
  assert.equal(evento?.tipo, 'notou');
  evento.armadilha.notar(brenn, { mostrar: true });
  assert.ok(eventos.some((e) => e.type === 'regiaoNotada'), 'o painel do que ele notou');
});

console.log(`\n${total - falhas}/${total} testes das regiões passaram.`);
if (falhas) process.exit(1);
