// Testes da ATENÇÃO (Procurar, Investigar, Ler os rastros, Lembrar, Examinar, o diário, a armadilha no caminho) e do cenário e dos corpos, e de APAGAR E ACENDER o fogo do mapa. Rode com:
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-investigar.mjs
import assert from 'node:assert/strict';
import { mapaDo, buildFoes } from '../game/encounter.js';
import { montarCampo } from '../game/campo.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { fontesDeLuz, visaoDoGrupo, nivelDeLuz } from '../rules/luz.js';
import { luzNaCasa, fogueiraAcesa, mudarFogo, temFogo, opcaoDeFogo } from '../game/fogo.js';
import {
  opcaoDeInvestigar, opcaoDeExaminarCorpo, ACHADOS_DA_SUPERFICIE, ACHADOS_NO_CORPO, opcoesDeAtencao, opcaoDeProcurar,
  opcaoDeLembrarCriatura, saberDaCriatura, criaturaConhecida, marcarConhecida, verboDa, ajudanteDe, anotar, opcaoDoDiario, casasNotadas, PERICIA_DO_TIPO, ndDe,
} from '../game/investigar.js';
import { cortarNoPerigo } from '../game/armadilhas.js';
import { arteInteiraDe } from '../art/fichas-de-criatura.js';
import { Battlefield, key } from '../core/grid.js';
import { passivePerception, skillBonus } from '../rules/abilities.js';
import { makeMonster } from '../rules/monsters.js';
import * as M from '../game/mapa-editor.js';
import { criarBuscas } from '../game/buscas.js';
import { saquearCorpo, tesouroDoCorpo } from '../game/saque.js';
import { diferencasDoCampo, aplicarDiferencas, diferencaValida } from '../game/campo-delta.js';
import { garantirInventario } from '../rules/equipment.js';
import { makeRng } from '../core/rng.js';
import { PONTOS_DO_ESCONDERIJO as PE } from '../game/esconderijo.js';

let total = 0;
let falhas = 0;
function teste(nome, fn) {
  total += 1;
  try { fn(); console.log(`ok    ${nome}`); } catch (e) { falhas += 1; console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`); }
}

/** Um encontro no esconderijo, com o grupo de pé na casa pedida. */
function noEsconderijo(onde = { x: 22, y: 13 }) {
  const mapa = mapaDo('esconderijo');
  const field = montarCampo(mapa);
  const grupo = makeParty().slice(0, 2);
  grupo.forEach((h, i) => { h.pos = { x: onde.x, y: onde.y + i }; });
  const enc = new Encounter({ battlefield: field, party: grupo, foes: [], rng: makeRng(7), onLog() {} });
  enc.explorando = true;
  return { mapa, field, enc, heroi: grupo[0] };
}

// ------------------------------------------------------------------------------------------------- o fogo ---

teste('as duas fogueiras do esconderijo começam acesas, cada uma com a peça do cômodo aceso', () => {
  const { mapa, field } = noEsconderijo();
  for (const p of [PE.fogueiraCovil, PE.fogueiraKlarg]) {
    const luz = luzNaCasa(field, p);
    assert.ok(luz, `sem luz em (${p.x},${p.y})`);
    assert.ok(!luz.apagada);
    assert.ok(fogueiraAcesa(field, p.x, p.y));
    const peca = field.sobreposicoes.find((o) => o.id === luz.sobreposicao);
    assert.ok(peca, `a luz pede a peça ${luz.sobreposicao}, que o mapa não tem`);
    assert.equal(peca.ligada, true);
  }
  assert.equal(mapa.luzes.length, 2);
});

teste('apagar a fogueira tira a luz da conta, apaga a peça de arte e a brasa para de queimar', () => {
  const { field, enc } = noEsconderijo();
  const luz = luzNaCasa(field, PE.fogueiraKlarg);
  const antes = fontesDeLuz(enc).length;
  assert.equal(mudarFogo(field, luz, false), true);
  assert.equal(mudarFogo(field, luz, false), false, 'apagar a apagada não é mudança');
  assert.equal(fontesDeLuz(enc).length, antes - 1, 'a luz apagada ainda conta');
  assert.equal(field.sobreposicoes.find((o) => o.id === 'fogoDeKlarg').ligada, false, 'a arte do fogo ficou acesa');
  assert.equal(fogueiraAcesa(field, PE.fogueiraKlarg.x, PE.fogueiraKlarg.y), false, 'a brasa abafada ainda queima');
  assert.equal(mudarFogo(field, luz, true), true);
  assert.equal(field.sobreposicoes.find((o) => o.id === 'fogoDeKlarg').ligada, true);
});

teste('apagar o fogo muda o que o grupo enxerga — a visão guardada não fica velha', () => {
  // Um herói SEM visão no escuro na caverna de Klarg: com o fogo, enxerga a casa da fogueira; sem ele, não.
  const { field, enc, heroi } = noEsconderijo({ x: 24, y: 14 });
  for (const h of enc.combatants.filter((c) => c.side === 'party')) { h.senses = {}; h.darkvisionFt = 0; h.tochaAcesa = false; }
  const casa = `${PE.fogueiraKlarg.x},${PE.fogueiraKlarg.y}`;
  const comFogo = visaoDoGrupo(enc).has(casa);
  assert.ok(nivelDeLuz(field, PE.fogueiraKlarg.x, PE.fogueiraKlarg.y, fontesDeLuz(enc)) > 0, 'a fogueira acesa não ilumina a própria casa');
  mudarFogo(field, luzNaCasa(field, PE.fogueiraKlarg), false);
  const semFogo = visaoDoGrupo(enc).has(casa);
  assert.equal(nivelDeLuz(field, PE.fogueiraKlarg.x, PE.fogueiraKlarg.y, fontesDeLuz(enc)), 0, 'apagada, a casa da fogueira ainda está clara');
  assert.ok(comFogo && !semFogo, `a visão não mudou ao apagar (antes ${comFogo}, depois ${semFogo})`);
  assert.ok(heroi);
});

teste('acender pede fogo na mão; apagar é de graça fora da luta e custa a ação nela', () => {
  const { field, enc, heroi } = noEsconderijo({ x: 22, y: 13 });
  const bolsa = garantirInventario(heroi).bag;
  const tocha = bolsa.find((i) => i.id === 'tocha');
  mudarFogo(field, luzNaCasa(field, PE.fogueiraKlarg), false);
  if (tocha) tocha.qtd = 0;
  heroi.tochaAcesa = false;
  assert.equal(temFogo(heroi), false);
  assert.match(opcaoDeFogo(enc, heroi, PE.fogueiraKlarg, { fora: true }).motivo, /tocha/);
  (tocha ?? bolsa[bolsa.push({ id: 'tocha', tipo: 'item', qtd: 0 }) - 1]).qtd = 1;
  const acender = opcaoDeFogo(enc, heroi, PE.fogueiraKlarg, { fora: true });
  assert.equal(acender.motivo, null);
  assert.match(acender.rotulo, /Acender a fogueira de Klarg/);
  acender.fazer();
  assert.ok(!luzNaCasa(field, PE.fogueiraKlarg).apagada);
  // na luta: custa a ação, e sem ação não dá
  heroi.actionUsed = false;
  const apagar = opcaoDeFogo(enc, heroi, PE.fogueiraKlarg, { fora: false });
  assert.match(apagar.detalhe, /ação/);
  apagar.fazer();
  assert.equal(heroi.actionUsed, true);
  assert.match(opcaoDeFogo(enc, heroi, PE.fogueiraKlarg, { fora: false }).motivo, /ação/);
  // longe da fogueira, não
  heroi.pos = { x: 26, y: 15 };
  assert.match(opcaoDeFogo(enc, heroi, PE.fogueiraKlarg, { fora: true }).motivo, /longe/);
});

teste('casa sem luz não ganha opção de fogo', () => {
  const { enc, heroi } = noEsconderijo();
  assert.equal(opcaoDeFogo(enc, heroi, { x: 24, y: 14 }, { fora: true }), null);
});

// ------------------------------------------------------------------------------------------- investigar ---

teste('investigar: a superfície sem achado e sem pista não ganha a opção', () => {
  const { heroi, enc } = noEsconderijo();
  const app = { enc };
  assert.equal(opcaoDeInvestigar(app, heroi, { x: 0, y: 0 }, 'trigo', { fora: true }), null);
  assert.ok(opcaoDeInvestigar(app, heroi, PE.fogueiraKlarg, 'fogueira', { fora: true }), 'a fogueira tem achado próprio');
});

teste('investigar: a pista da cena manda sobre o achado da superfície', () => {
  const { heroi, enc } = noEsconderijo();
  const app = { enc };
  const pista = { titulo: 'A laje', cd: 12, alcance: 10, achado: 'rachada' };
  const o = opcaoDeInvestigar(app, heroi, { x: 22, y: 14 }, 'entulho', { fora: true, pista });
  assert.match(o.detalhe, /CD 12/);
  assert.match(o.detalhe, /de graça/);
  const sem = opcaoDeInvestigar(app, heroi, { x: 22, y: 14 }, 'entulho', { fora: true });
  assert.match(sem.detalhe, /CD 10/);
});

teste('investigar: uma tentativa por herói em cada casa; outro herói ainda pode', () => {
  const { heroi, enc } = noEsconderijo();
  const app = { enc };
  const casa = { x: 22, y: 14 };
  assert.equal(opcaoDeInvestigar(app, heroi, casa, 'entulho', { fora: true }).motivo, null);
  criarBuscas(enc.investigados ??= {}).marcar(heroi, 'investigar', casa);
  assert.match(opcaoDeInvestigar(app, heroi, casa, 'entulho', { fora: true }).motivo, /já tentou/);
  const outro = enc.combatants.find((c) => c.side === 'party' && c !== heroi);
  outro.pos = { x: 22, y: 13 };
  assert.equal(opcaoDeInvestigar(app, outro, casa, 'entulho', { fora: true }).motivo, null, 'são outros olhos');
});

teste('investigar: na luta custa a ação; longe demais não dá', () => {
  const { heroi, enc } = noEsconderijo();
  const app = { enc };
  heroi.actionUsed = true;
  assert.match(opcaoDeInvestigar(app, heroi, { x: 22, y: 14 }, 'entulho', { fora: false }).motivo, /ação/);
  heroi.actionUsed = false;
  assert.match(opcaoDeInvestigar(app, heroi, { x: 28, y: 7 }, 'poco', { fora: true }).motivo, /chegue mais perto/);
});

teste('os achados são superfícies que existem no jogo, e o goblin traz a marca Dentefino do livro', () => {
  const { field } = noEsconderijo();
  const conhecidas = new Set();
  for (let y = 0; y < field.h; y++) for (let x = 0; x < field.w; x++) conhecidas.add(field.surfaceAt(x, y));
  // as do esconderijo que ganham "Investigar" pela superfície
  for (const s of ['riacho', 'poco', 'rocha', 'fogueira', 'entulho', 'estalagmite', 'leito', 'mantimentos', 'bau', 'ponte', 'tocaia', 'espinheiro']) {
    assert.ok(conhecidas.has(s), `o esconderijo não tem a superfície ${s}`);
    assert.ok(ACHADOS_DA_SUPERFICIE[s], `sem achado para ${s}`);
  }
  assert.match(ACHADOS_NO_CORPO.goblin.achado, /Dentefino/);
});

teste('examinar o corpo: uma vez por herói e por corpo, com o achado do bloco', () => {
  const { heroi, enc } = noEsconderijo();
  const app = { enc };
  const corpo = buildFoes('esconderijo').find((f) => f.defId === 'goblin');
  corpo.pos = { x: 22, y: 14 };
  const o = opcaoDeExaminarCorpo(app, heroi, corpo, { fora: true });
  assert.match(o.rotulo, /Examinar o corpo/);
  assert.equal(o.motivo, null);
  criarBuscas(enc.investigados ??= {}).marcar(heroi, `corpo:${corpo.id}`, corpo.pos);
  assert.match(opcaoDeExaminarCorpo(app, heroi, corpo, { fora: true }).motivo, /já tentou/);
});

// ---------------------------------------------------------------------------------------------- o corpo ---

teste('a algibeira de Yeemik está no corpo dele: três gemas de 10 po e uma poção de cura, uma vez só', () => {
  const { enc, heroi } = noEsconderijo();
  const yeemik = buildFoes('esconderijo').find((f) => f.defId === 'yeemik');
  yeemik.dead = true;
  yeemik.hp = 0;
  yeemik.pos = { x: heroi.pos.x, y: heroi.pos.y };
  assert.deepEqual(tesouroDoCorpo(yeemik), ['gemaPequena', 'pocaoDeCura']);
  const r = saquearCorpo(enc, heroi, yeemik);
  assert.equal(r.ok, true, r.why);
  assert.deepEqual(r.itens, [{ id: 'gemaPequena', qtd: 3 }, { id: 'pocaoDeCura', qtd: 1 }]);
  const bolsa = garantirInventario(heroi).bag;
  assert.equal(bolsa.find((i) => i.id === 'gemaPequena')?.qtd, 3);
  assert.deepEqual(tesouroDoCorpo(yeemik), [], 'a algibeira saiu duas vezes');
  // e o Errk e o chefe do posto, que são o MESMO bloco, levam cada um a sua bolsa (`m.tesouro`)
  const errk = buildFoes('esconderijo').find((f) => f.name === 'Errk');
  const chefe = buildFoes('esconderijo').find((f) => f.chefeDoPosto);
  assert.deepEqual(tesouroDoCorpo(errk), ['moedaDeCobre']);
  assert.deepEqual(tesouroDoCorpo(chefe), ['moedaDePrata']);
});

teste('os goblins e Klarg não carregam nada no corpo — o baú de Klarg está entre os suprimentos', () => {
  for (const f of buildFoes('esconderijo').filter((m) => ['goblin', 'klarg', 'lobo'].includes(m.defId))) {
    assert.deepEqual(tesouroDoCorpo(f), [], `${f.name} carrega algo no corpo`);
  }
});

// ------------------------------------------------------------------------------------------- o convidado ---

teste('a fogueira apagada e a peça de arte acesa chegam ao convidado, e voltam ao normal', () => {
  const mapa = mapaDo('esconderijo');
  const anfitriao = montarCampo(mapa);
  const base = montarCampo(mapa);
  const convidado = montarCampo(mapa);
  mudarFogo(anfitriao, luzNaCasa(anfitriao, PE.fogueiraCovil), false);
  anfitriao.alternarSobreposicao('ponteCaida', true);
  const d = diferencasDoCampo(anfitriao, base);
  assert.ok(d, 'a diferença saiu vazia');
  assert.ok(diferencaValida(d, anfitriao.w * anfitriao.h));
  assert.equal(aplicarDiferencas(convidado, base, d), true);
  assert.equal(luzNaCasa(convidado, PE.fogueiraCovil).apagada, true, 'o convidado vê o fogo aceso');
  assert.equal(convidado.sobreposicoes.find((o) => o.id === 'ponteCaida').ligada, true, 'o convidado vê a ponte inteira');
  // o anfitrião reacende: a diferença nova não traz a luz, e o convidado volta ao que a base tem
  mudarFogo(anfitriao, luzNaCasa(anfitriao, PE.fogueiraCovil), true);
  aplicarDiferencas(convidado, base, diferencasDoCampo(anfitriao, base));
  assert.ok(!luzNaCasa(convidado, PE.fogueiraCovil).apagada, 'o fogo não voltou a acender no convidado');
  assert.equal(convidado.sobreposicoes.find((o) => o.id === 'ponteCaida').ligada, true, 'a ponte caída tem de continuar');
});

teste('uma diferença com luz ou peça mal formada é recusada', () => {
  assert.equal(diferencaValida({ a: [], c: [], l: [[0, 2]] }, 600), false);
  assert.equal(diferencaValida({ a: [], c: [], s: [['', 1]] }, 600), false);
  assert.equal(diferencaValida({ a: [], c: [], s: [['ponteCaida', 1]] }, 600), true);
});


// ------------------------------------------------------------------------------------------------ os verbos ---

teste('cada pista vira o verbo da perícia dela: Percepção procura, Sobrevivência lê rastros, História lembra', () => {
  assert.equal(verboDa({ pericias: ['percepcao'] }), 'procurar');
  assert.equal(verboDa({ pericias: ['investigacao'] }), 'investigar');
  assert.equal(verboDa({ pericias: ['sobrevivencia', 'percepcao'] }), 'rastrear');
  assert.equal(verboDa({ pericias: ['historia'] }), 'lembrar');
  assert.equal(verboDa({ cd: 10, achado: 'x' }), 'investigar', 'sem perícia, é Investigar');
  assert.equal(verboDa({ verbo: 'lembrar', pericias: ['percepcao'] }), 'lembrar', 'o verbo escrito manda');
});

teste('o menu de uma casa: Procurar sempre, e um verbo por pista; a perícia e o bônus de quem rola aparecem', () => {
  const { heroi, enc } = noEsconderijo();
  const app = { enc };
  const pistas = [
    { titulo: 'Rastros', pericias: ['sobrevivencia'], cd: 10, achado: 'pegadas' },
    { titulo: 'O símbolo', verbo: 'lembrar', pericias: ['religiao'], cd: 12, achado: 'um deus' },
  ];
  const ops = opcoesDeAtencao(app, heroi, { x: 22, y: 14 }, 'entulho', { fora: true, pistas });
  assert.deepEqual(ops.map((o) => o.rotulo), ['Procurar', 'Investigar', 'Ler os rastros', 'Lembrar']);
  const b = skillBonus(heroi, 'sobrevivencia');
  assert.ok(ops[2].detalhe.startsWith(`Sobrevivência ${b >= 0 ? '+' : ''}${b}, CD 10`), ops[2].detalhe);
  assert.match(ops[3].detalhe, /Religião .*CD 12/);
});

teste('Procurar não mostra a CD — dizer a CD já diria que há algo ali', () => {
  const { heroi, enc } = noEsconderijo();
  const o = opcaoDeProcurar({ enc }, heroi, { x: 22, y: 14 }, { fora: true });
  assert.match(o.detalhe, /^Percepção [+-]\d+ ·/);
  assert.doesNotMatch(o.detalhe, /CD/);
});

teste('Procurar acha a armadilha da cena nas oito casas em volta, e só a ainda escondida', () => {
  const { heroi, enc } = noEsconderijo({ x: 10, y: 7 });
  const armadilha = { id: 't', nome: 'A laje', casas: PE.ressalto, cd: 12, descoberta: false, achado: 'rachada' };
  const app = { enc, capitulo: { armadilhas: () => [armadilha] } };
  const o = opcaoDeProcurar(app, heroi, { x: 9, y: 7 }, { fora: true });
  assert.equal(o.motivo, null);
  armadilha.descoberta = true;
  assert.ok(opcaoDeProcurar(app, heroi, { x: 9, y: 7 }, { fora: true }));
});

teste('AJUDAR: um aliado perto do mesmo ponto dá vantagem fora da luta — e na luta não', () => {
  const { heroi, enc } = noEsconderijo({ x: 22, y: 13 });
  const outro = enc.combatants.find((c) => c.side === 'party' && c !== heroi);
  outro.pos = { x: 23, y: 14 };
  assert.equal(ajudanteDe(enc, heroi, { x: 22, y: 14 }, 5, { fora: true }), outro);
  assert.equal(ajudanteDe(enc, heroi, { x: 22, y: 14 }, 5, { fora: false }), null);
  const o = opcaoDeInvestigar({ enc }, heroi, { x: 22, y: 14 }, 'entulho', { fora: true });
  assert.ok(o.detalhe.includes(`com ${outro.name}: vantagem`), o.detalhe);
  outro.pos = { x: 28, y: 18 };
  assert.doesNotMatch(opcaoDeInvestigar({ enc }, heroi, { x: 22, y: 14 }, 'entulho', { fora: true }).detalhe, /vantagem/);
});

teste('o diário guarda cada achado uma vez, e a opção só aparece com algo anotado', () => {
  const { heroi, enc } = noEsconderijo();
  const ditos = [];
  enc.say = (k, t) => ditos.push(t);
  assert.equal(opcaoDoDiario({ enc }), null);
  anotar(enc, { titulo: 'A laje', texto: 'rachada', heroi });
  anotar(enc, { titulo: 'A laje', texto: 'rachada', heroi });
  assert.equal(enc.diario.length, 1);
  assert.match(ditos[0], /Diário — A laje: rachada/);
  assert.match(opcaoDoDiario({ enc }).detalhe, /1 anotação/);
});

// ----------------------------------------------------------------------------------------- a criatura ---

teste('Lembrar a criatura: a perícia sai do tipo, a CD é 10 + nível de ameaça, e não custa a ação', () => {
  const { heroi, enc } = noEsconderijo();
  const lobo = makeMonster('lobo', { x: 23, y: 13 });
  assert.equal(lobo.tipo, 'fera');
  assert.equal(PERICIA_DO_TIPO.fera, 'natureza');
  const o = opcaoDeLembrarCriatura({ enc }, heroi, lobo, { fora: false });
  assert.match(o.detalhe, /Natureza [+-]\d+, CD 11/);   // lobo: ND 1/4 → 10 + 1
  assert.match(o.detalhe, /de graça/, 'lembrar é memória, não gasta a ação');
  heroi.actionUsed = true;
  assert.equal(opcaoDeLembrarCriatura({ enc }, heroi, lobo, { fora: false }).motivo, null);
  assert.equal(ndDe(50), 0.25);
  assert.equal(opcaoDeLembrarCriatura({ enc }, heroi, heroi, { fora: true }), null, 'herói não se lembra de si');
});

teste('o que se lembra é o bloco: resistência, imunidade, sentidos e traços', () => {
  const lobo = makeMonster('lobo', { x: 0, y: 0 });
  const linhas = saberDaCriatura(lobo);
  assert.ok(linhas.some((l) => /Táticas de Matilha/.test(l)), linhas.join(' | '));
  const falso = { tipo: 'morto-vivo', xp: 50, immune: ['veneno'], resist: ['necrótico'], vulnerable: ['radiante'], conditionImmunities: ['envenenado'], senses: { darkvision: 60 }, traits: [] };
  const t = saberDaCriatura(falso).join(' ');
  for (const r of [/Não sente veneno/, /necrótico/, /radiante faz o dobro/, /envenenado/, /enxerga no escuro até 60/]) assert.match(t, r);
});

// ----------------------------------------------------------------------------------- a armadilha no caminho ---

function caminhoPeloRessalto() {
  const { enc, heroi } = noEsconderijo({ x: 13, y: 7 });
  for (const h of enc.combatants) if (h !== heroi) h.pos = { x: 1, y: 18 };
  heroi.movementLeftFt = 60;
  const alcance = enc.reachableFor(heroi);
  const path = Battlefield.pathFrom(alcance, alcance.get(key(7, 6)));   // a subida é terreno difícil: (7,6) custa 55 dos 60 pés
  return { enc, heroi, path };
}
const noRessalto = (p) => PE.ressalto.some((q) => q.x === p.x && q.y === p.y);

teste('o ressalto: quem atravessa de um clique PARA em cima da laje (antes passava direto)', () => {
  const { enc, heroi, path } = caminhoPeloRessalto();
  assert.ok(path.some(noRessalto), 'o caminho nem passa no ressalto');
  const armadilha = { id: 'r', nome: 'laje', casas: PE.ressalto, cd: 99, descoberta: false };
  const { caminho, evento } = cortarNoPerigo(enc, heroi, path, [armadilha]);
  assert.equal(evento?.tipo, 'pisou');
  const fim = caminho.at(-1);
  assert.ok(noRessalto(fim), `parou em ${fim.x},${fim.y}`);
});

teste('o ressalto: a Percepção passiva que alcança a CD para ANTES, e a laje descoberta não para ninguém', () => {
  const { enc, heroi, path } = caminhoPeloRessalto();
  // no escuro e sem tocha ela não vê a laje, e pisa: notar pede enxergar
  const armadilha = { id: 'r', nome: 'laje', casas: PE.ressalto, cd: passivePerception(heroi), descoberta: false };
  assert.equal(cortarNoPerigo(enc, heroi, path, [armadilha]).evento?.tipo, 'pisou', 'notou no breu');
  heroi.tochaAcesa = true;
  const r = cortarNoPerigo(enc, heroi, path, [armadilha]);
  assert.equal(r.evento?.tipo, 'notou');
  assert.ok(!r.caminho.some(noRessalto), 'notou e pisou mesmo assim');
  armadilha.descoberta = true;
  assert.equal(cortarNoPerigo(enc, heroi, path, [armadilha]).evento, null);
  assert.equal(cortarNoPerigo(enc, heroi, path, [{ ...armadilha, descoberta: false, afeta: () => false }]).evento, null, 'quem a laje não pega passa');
});

teste('a Percepção passiva faz brilhar a casa da pista que ela alcança, e o brilho some depois de tentada', () => {
  const { heroi, enc } = noEsconderijo({ x: 22, y: 13 });
  for (const h of enc.combatants) if (h !== heroi) h.pos = { x: 1, y: 18 };
  const pista = { titulo: 'x', pericias: ['investigacao'], cd: passivePerception(heroi), achado: 'y' };
  const app = { enc, capitulo: { pistasEm: (t) => (t.x === 23 && t.y === 14 ? [pista] : []) } };
  assert.deepEqual(casasNotadas(app), [{ x: 23, y: 14 }]);
  pista.cd = passivePerception(heroi) + 1;
  assert.deepEqual(casasNotadas(app), [], 'a passiva não alcança');
  pista.cd = 1;
  criarBuscas(enc.investigados ??= {}).marcar(heroi, 'investigar', { x: 23, y: 14 });
  assert.deepEqual(casasNotadas(app), [], 'já tentada, não brilha');
});

// ------------------------------------------------------------------------------------------------ o editor ---

teste('a pista marcada no editor (ferramenta 9) chega ao mapa e vira verbo no menu', () => {
  const mapa = M.novoMapa(6, 4);
  M.porInterativo(mapa, 2, 1, { id: 'altar', rotulo: 'O altar', texto: '', pista: { verbo: 'lembrar', cd: 13, achado: 'É de Tymora.', titulo: 'O altar' } });
  assert.deepEqual(mapa.interativos[0].pista, { verbo: 'lembrar', cd: 13, achado: 'É de Tymora.', titulo: 'O altar' });
  M.porInterativo(mapa, 3, 1, { id: 'nada', rotulo: 'x', texto: 'y', pista: { verbo: 'procurar', achado: '' } });
  assert.equal(mapa.interativos.find((i) => i.id === 'nada').pista, undefined, 'teste sem achado não entra');
  assert.deepEqual(montarCampo(mapa).interativos.get('2,1').pista, mapa.interativos[0].pista);
  const { heroi, enc } = noEsconderijo();
  const ops = opcoesDeAtencao({ enc }, heroi, heroi.pos, 'caverna', { fora: true, pistas: [mapa.interativos[0].pista] });
  assert.ok(ops.some((o) => o.rotulo === 'Lembrar' && /CD 13/.test(o.detalhe)), ops.map((o) => `${o.rotulo} ${o.detalhe}`).join(' | '));
});

// ------------------------------------------------------------------------- o bestiário do grupo (a ficha) ---

// O Lembrar que passa deixa o BLOCO conhecido: a ficha da criatura (`view/ficha-criatura.js`) só mostra a vida, os
// atributos, os ataques e o que se sabe depois disso. Assíncrono porque o `fazer` abre a narrativa (aqui, o stub).
{
  const nome = 'Lembrar que passa marca o bloco na campanha, para todas as criaturas dele; quem falha não lembra; a arena guarda na cena';
  total += 1;
  try {
    const { heroi, enc } = noEsconderijo();
    heroi.abilities.int = 30;   // +10 em Natureza: CD 11 passa com qualquer d20
    const lobo = makeMonster('lobo', { x: 23, y: 13 });
    const outro = makeMonster('lobo', { x: 24, y: 13 });
    const app = { enc, campanha: {} };
    assert.equal(criaturaConhecida(app, lobo), false, 'antes do teste, ninguém sabe');
    await opcaoDeLembrarCriatura(app, heroi, lobo, { fora: true }).fazer();
    assert.deepEqual(app.campanha.bestiario, { lobo: true });
    assert.equal(criaturaConhecida(app, outro), true, 'reconhecer um lobo vale para o outro lobo');
    assert.equal(criaturaConhecida(app, makeMonster('goblin', { x: 0, y: 0 })), false, 'e não para o goblin');
    // a falha não marca nada
    const { heroi: h2, enc: e2 } = noEsconderijo();
    h2.abilities.int = 1; h2.skills = []; h2.expertise = [];
    const app2 = { enc: e2, campanha: {} };
    const velho = makeMonster('lobo', { x: 23, y: 13 });
    velho.xp = 155000;   // ND 30: CD 40, que −5 nunca alcança
    await opcaoDeLembrarCriatura(app2, h2, velho, { fora: true }).fazer();
    assert.equal(criaturaConhecida(app2, velho), false, 'quem falha não lembra');
    // sem campanha (a arena), na cena
    const app3 = { enc: e2 };
    marcarConhecida(app3, velho);
    assert.equal(criaturaConhecida(app3, velho), true);
    assert.ok(e2.conhecidas.lobo);
    console.log(`ok    ${nome}`);
  } catch (e) { falhas += 1; console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`); }
}

teste('a arte inteira da criatura é o token com outro endereço; o herói não tem', () => {
  assert.equal(arteInteiraDe({ defId: 'goblin', side: 'foes' }), '/criaturas/goblin.webp');
  assert.equal(arteInteiraDe({ defId: 'quasit', name: 'Zeond', side: 'foes' }), '/criaturas/zeond.webp');
  assert.equal(arteInteiraDe({ defId: 'semFicha', side: 'foes' }), null);
  assert.equal(arteInteiraDe({ kind: 'pc', side: 'party', look: 'fighter' }), null);
});

console.log(`\n${total - falhas}/${total} testes passaram`);
process.exit(falhas ? 1 : 0);
