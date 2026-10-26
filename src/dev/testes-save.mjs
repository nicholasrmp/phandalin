// Testes do save e carregar no solo (MULTIJOGADOR.md, S-01…S-12). Rode com:
//   node src/dev/testes-save.mjs
//
// `game/save.js` não toca a tela nem o `localStorage`: o armazém entra por
// parâmetro, então aqui ele é um falso, inclusive um que estoura a cota.

import assert from 'node:assert/strict';
import { makeParty } from '../rules/party.js';
import { descansoLongo } from '../rules/descanso.js';
import { ganharXp } from '../rules/progressao.js';
import { mapaDo } from '../game/encounter.js';
import {
  VERSAO_ATUAL, MIGRACOES, SLOTS_AUTO, SLOTS_MANUAIS, TODOS_OS_SLOTS, PREFIXO,
  problemasDeJson, montarSave, validarSave, migrar, criarArmazenamento,
  paraArquivo, deArquivo, nomeDoArquivo, jogadorLocal, resumoDoSave,
} from '../game/save.js';

let total = 0;
let falhas = 0;
function teste(nome, fn) {
  total += 1;
  try { fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`);
  }
}

class Armazem {
  constructor({ limite = Infinity } = {}) { this.m = new Map(); this.limite = limite; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) {
    const usado = [...this.m].reduce((n, [kk, vv]) => n + (kk === k ? 0 : kk.length + vv.length), 0);
    if (usado + k.length + v.length > this.limite) { const e = new Error('cheio'); e.name = 'QuotaExceededError'; throw e; }
    this.m.set(k, String(v));
  }
  removeItem(k) { this.m.delete(k); }
}

// Uma campanha com o formato das que as cenas montam (vila, região, viagem,
// feitos, utilidade, vigias e um bloco `salvo` por cena). Só JSON puro.
const campanhaDeExemplo = () => ({
  vila: { dia: 3, tempo: 2, missoes: { gundren: 'ativa', mirna: 'feita' }, pistas: ['A Caverna do Eco'], feito: { sildar: true }, sildar: true, registro: [] },
  regiao: { onde: 'phandalin', registro: ['Chegaram a Phandalin.'] },
  viagem: { dia: 2, km: 14, acampamento: { lugar: 'bosque', fogueira: false }, vigiaDaNoite: { quem: 'Dara', total: 14 } },
  vigias: [{ nome: 'Dara', turno: 1 }],
  feitos: { esconderijo: true, klarg: 'morto', cajavidro: false },
  utilidade: { ativas: [{ id: 'alarme', ate: 480, onde: { x: 3, y: 4 } }], familiar: null },
  arvoreTrovao: { dragao: 'expulso', portas: [{ x: 1, y: 2 }, { x: 5, y: 9 }], caixaMirna: 'achada' },
});

const configDaCampanha = () => ({
  modo: 'campanha', aventura: 'mina-perdida', capitulo: 4, cenaDaVila: 'arvoreTrovao',
  encontro: { id: 'bando', periodo: 'dia', nome: 'Orcs' },
});

const montar = (extra = {}) => {
  const herois = makeParty({ nivel: 5 });
  herois.forEach((h) => { h.jogadorId = 'j-1'; });
  return montarSave({
    id: 'auto-1', nome: 'Teste', agora: 1000, tempoDeJogo: 3600.4,
    config: { ...configDaCampanha(), continuarCom: herois },
    local: { tipo: 'cena' }, campanha: campanhaDeExemplo(), herois,
    xpPendente: { xp: 200, motivo: 'A resposta' }, jogadores: [{ jogadorId: 'j-1', nome: 'Nicholas' }], ...extra,
  });
};

// ---- S-12: a ida e volta ----------------------------------------------------

teste('S-12: campanha e config voltam IGUAIS da ida e volta por JSON', () => {
  const camp = campanhaDeExemplo();
  const cfg = configDaCampanha();
  assert.deepEqual(JSON.parse(JSON.stringify(camp)), camp);
  assert.deepEqual(JSON.parse(JSON.stringify(cfg)), cfg);
  assert.deepEqual(problemasDeJson(camp), []);
  assert.deepEqual(problemasDeJson(cfg), []);
});

teste('S-12: os heróis (nível 1, 3 e 5) voltam iguais', () => {
  for (const nivel of [1, 3, 5]) {
    const herois = makeParty({ nivel });
    assert.deepEqual(problemasDeJson(herois), [], `nível ${nivel}`);
    assert.deepEqual(JSON.parse(JSON.stringify(herois)), herois, `nível ${nivel}`);
  }
});

teste('S-12: herói que levou a pior (XP, dano, exaustão, descanso) ainda volta igual', () => {
  const herois = makeParty({ nivel: 3 });
  ganharXp(herois[0], 500);
  herois[1].hp = 1;
  herois[2].conditions = [{ id: 'exausto', nivel: 2 }];
  descansoLongo(herois[3]);
  assert.deepEqual(problemasDeJson(herois), []);
  assert.deepEqual(JSON.parse(JSON.stringify(herois)), herois);
});

teste('S-12: o mapa de cada cena é JSON puro (nada de função no terreno)', () => {
  for (const v of ['emboscada', 'esconderijo', 'rua']) {
    const m = mapaDo(v);
    assert.deepEqual(problemasDeJson({ terreno: m.terreno, altura: m.altura, grupo: m.grupo, olhar: m.olhar }), [], v);
  }
});

teste('o detector pega o que o JSON perde em silêncio', () => {
  assert.ok(problemasDeJson({ a: new Map() }).length, 'Map');
  assert.ok(problemasDeJson({ a: new Set([1]) }).length, 'Set');
  assert.ok(problemasDeJson({ a: () => 1 }).length, 'função');
  assert.ok(problemasDeJson({ a: undefined }).length, 'undefined num campo');
  assert.ok(problemasDeJson({ a: NaN }).length, 'NaN');
  assert.ok(problemasDeJson([1, Infinity]).length, 'Infinity');
  const c = {}; c.eu = c;
  assert.ok(problemasDeJson(c).some((p) => p.includes('circular')), 'ciclo');
  const compartilhado = { x: 1 };
  assert.deepEqual(problemasDeJson({ a: compartilhado, b: compartilhado }), [], 'o mesmo objeto em dois lugares não é ciclo');
});

// ---- S-05: o que o save guarda ---------------------------------------------

teste('S-05: o save tem os campos da regra e o config SEM continuarCom', () => {
  const r = montar();
  assert.ok(r.ok, r.erro);
  const s = r.save;
  for (const k of ['versao', 'id', 'nome', 'criadoEm', 'atualizadoEm', 'tempoDeJogo', 'aventura', 'config', 'campanha', 'herois', 'xpPendente', 'jogadores']) {
    assert.ok(k in s, `falta ${k}`);
  }
  assert.equal(s.versao, VERSAO_ATUAL);
  assert.equal('continuarCom' in s.config, false);
  assert.equal(s.herois.length, 4);
  assert.ok(s.herois.every((h) => h.jogadorId === 'j-1'));
  assert.equal(s.tempoDeJogo, 3600);
  assert.equal(s.config.cenaDaVila, 'arvoreTrovao');
});

teste('o save é uma CÓPIA: mudar o jogo depois não muda o save', () => {
  const herois = makeParty({ nivel: 2 });
  const camp = campanhaDeExemplo();
  const r = montarSave({ id: 'auto-1', nome: 'x', agora: 1, config: configDaCampanha(), campanha: camp, herois });
  const hpAntes = herois[0].hp;
  camp.vila.dia = 99;
  herois[0].hp = 0;
  assert.equal(r.save.campanha.vila.dia, 3);
  assert.equal(r.save.herois[0].hp, hpAntes);
});

teste('recusa salvar estado que não é JSON puro, sem salvar pela metade', () => {
  const camp = campanhaDeExemplo();
  camp.vila.visitados = new Set(['a']);
  const r = montar({ campanha: camp });
  assert.equal(r.ok, false);
  assert.match(r.erro, /Set/);
});

// ---- S-10: carregar nunca é parcial -----------------------------------------

teste('S-10: save válido passa; save quebrado é recusado com mensagem', () => {
  const s = montar().save;
  assert.ok(validarSave(s).ok);
  const sem = (f) => { const c = JSON.parse(JSON.stringify(s)); f(c); return validarSave(c); };
  assert.equal(validarSave(null).ok, false);
  assert.equal(validarSave([]).ok, false);
  assert.equal(validarSave('texto').ok, false);
  assert.equal(sem((c) => { delete c.versao; }).ok, false);
  assert.equal(sem((c) => { c.herois = []; }).ok, false);
  assert.equal(sem((c) => { delete c.herois; }).ok, false);
  assert.equal(sem((c) => { delete c.herois[2].maxHp; }).ok, false, 'herói incompleto');
  assert.equal(sem((c) => { c.herois[0] = null; }).ok, false);
  assert.equal(sem((c) => { delete c.config; }).ok, false);
  assert.equal(sem((c) => { delete c.campanha; }).ok, false);
  assert.equal(sem((c) => { c.local = { tipo: 'lua' }; }).ok, false);
  assert.equal(sem((c) => { c.local = { tipo: 'regiao' }; }).ok, false, 'região sem "onde"');
  for (const r of [sem((c) => { c.herois = []; }), sem((c) => { delete c.config; })]) assert.ok(r.erro.length > 10);
});

teste('S-10: versão MAIS NOVA que o jogo é recusada, com a mensagem certa', () => {
  const s = montar().save;
  s.versao = VERSAO_ATUAL + 1;
  const v = validarSave(s);
  assert.equal(v.ok, false);
  assert.match(v.erro, /mais nova/);
});

teste('S-10: carregar com arquivo corrompido não lança e não devolve save', () => {
  const st = new Armazem();
  const arm = criarArmazenamento(st);
  st.setItem(`${PREFIXO}auto-1`, '{"versao":1,"herois":[');
  const r = arm.carregar('auto-1');
  assert.equal(r.ok, false);
  assert.match(r.erro, /corrompido/);
  assert.equal(arm.maisRecente(), null, 'o corrompido não é "o mais recente"');
});

// ---- S-07: versão e migração ------------------------------------------------

teste('S-07: há uma migração para cada salto até a versão atual', () => {
  for (let v = 1; v < VERSAO_ATUAL; v += 1) assert.equal(typeof MIGRACOES[v], 'function', `falta migrar ${v} → ${v + 1}`);
});

teste('S-07: migrar a versão atual devolve o mesmo save, numa cópia', () => {
  const s = montar().save;
  const m = migrar(s);
  assert.deepEqual(m, s);
  assert.notEqual(m, s);
});

teste('S-07: save antigo sem "local" ganha local de cena ao migrar', () => {
  const s = montar().save;
  delete s.local;
  assert.deepEqual(migrar(s).local, { tipo: 'cena' });
});

// ---- S-06 e S-08: slots e armazém ------------------------------------------

teste('S-06: três autosaves rotativos: o quarto troca o MAIS ANTIGO', () => {
  const st = new Armazem();
  const arm = criarArmazenamento(st);
  let t = 100;
  const salvar = (nome) => { t += 10; return arm.autosalvar(montar({ nome, agora: t }).save); };
  const slots = ['a', 'b', 'c'].map(salvar).map((r) => r.slot);
  assert.deepEqual([...slots].sort(), [...SLOTS_AUTO].sort(), 'os três slots vazios são usados antes de trocar');
  const r4 = salvar('d');
  assert.equal(arm.ler(r4.slot).save.nome, 'd');
  const nomes = SLOTS_AUTO.map((s) => arm.ler(s).save.nome).sort();
  assert.deepEqual(nomes, ['b', 'c', 'd'], 'o "a", o mais antigo, foi trocado');
  assert.equal(arm.maisRecente().save.nome, 'd');
});

teste('S-06: o autosave nunca pisa num slot manual', () => {
  const st = new Armazem();
  const arm = criarArmazenamento(st);
  arm.gravar('manual-2', montar({ nome: 'meu', agora: 5 }).save);
  for (let i = 0; i < 8; i += 1) arm.autosalvar(montar({ nome: `a${i}`, agora: 10 + i }).save);
  assert.equal(arm.ler('manual-2').save.nome, 'meu');
  assert.equal(TODOS_OS_SLOTS.length, SLOTS_AUTO.length + SLOTS_MANUAIS.length);
});

teste('S-08: a chave é phandalin:save:<id> e o texto é o JSON do save', () => {
  const st = new Armazem();
  const arm = criarArmazenamento(st);
  arm.gravar('manual-1', montar({ nome: 'k' }).save);
  assert.ok(st.getItem('phandalin:save:manual-1'));
  assert.equal(JSON.parse(st.getItem('phandalin:save:manual-1')).id, 'manual-1', 'o id é o do slot');
  assert.equal(arm.gravar('slot-fantasma', montar().save).ok, false);
});

teste('S-08: o tamanho de um save de 4 heróis de nível 5 fica longe dos 5 MB', () => {
  const kb = JSON.stringify(montar().save).length / 1024;
  console.log(`      (save de exemplo: ${kb.toFixed(1)} KB; os 6 slots cabem em ${(kb * 6).toFixed(0)} KB)`);
  assert.ok(kb < 200, `${kb} KB`);
});

teste('cota estourada: o save ANTERIOR continua intacto e a falha é dita', () => {
  const bom = montar({ nome: 'bom', agora: 1 }).save;
  const st = new Armazem({ limite: JSON.stringify(bom).length + 400 });
  const arm = criarArmazenamento(st);
  assert.ok(arm.gravar('manual-1', bom).ok);
  const gordo = montar({ nome: 'gordo', agora: 2 }).save;
  gordo.campanha.lixo = 'x'.repeat(5000);
  const r = arm.gravar('manual-1', gordo);
  assert.equal(r.ok, false);
  assert.match(r.erro, /sem espaço/);
  assert.equal(arm.ler('manual-1').save.nome, 'bom', 'o save velho sobreviveu');
});

teste('armazém que lança (modo privado) não derruba o jogo', () => {
  const quebrado = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); }, removeItem() { throw new Error('bloqueado'); } };
  const arm = criarArmazenamento(quebrado);
  assert.deepEqual(arm.listar(), []);
  assert.equal(arm.maisRecente(), null);
  assert.equal(arm.autosalvar(montar().save).ok, false);
  assert.equal(arm.carregar('auto-1').ok, false);
});

teste('S-01: o mais recente é o que o "Continuar" abre, mesmo entre auto e manual', () => {
  const st = new Armazem();
  const arm = criarArmazenamento(st);
  arm.autosalvar(montar({ nome: 'auto', agora: 50 }).save);
  arm.gravar('manual-3', montar({ nome: 'manual', agora: 90 }).save);
  assert.equal(arm.maisRecente().save.nome, 'manual');
  arm.autosalvar(montar({ nome: 'auto2', agora: 120 }).save);
  assert.equal(arm.maisRecente().save.nome, 'auto2');
  assert.equal(arm.listar().length, 3);
});

// ---- carregar: o estado volta como foi salvo --------------------------------

teste('carregar devolve heróis, campanha, config e XP pendente exatamente como saíram', () => {
  const st = new Armazem();
  const arm = criarArmazenamento(st);
  const r = montar({ agora: 77 });
  arm.gravar('manual-1', r.save);
  const c = arm.carregar('manual-1');
  assert.ok(c.ok, c.erro);
  assert.deepEqual(c.save.campanha, campanhaDeExemplo());
  assert.deepEqual(c.save.herois, r.save.herois);
  assert.deepEqual(c.save.xpPendente, { xp: 200, motivo: 'A resposta' });
  assert.deepEqual(c.save.config, configDaCampanha());
});

teste('salvar → carregar → salvar de novo não muda nada (o save é um ponto fixo)', () => {
  const st = new Armazem();
  const arm = criarArmazenamento(st);
  const a = montar({ agora: 5 }).save;
  arm.gravar('manual-1', a);
  const c = arm.carregar('manual-1').save;
  const b = montarSave({
    id: 'manual-1', nome: c.nome, tipo: c.tipo, criadoEm: c.criadoEm, agora: c.atualizadoEm, tempoDeJogo: c.tempoDeJogo,
    config: c.config, local: c.local, campanha: c.campanha, herois: c.herois, xpPendente: c.xpPendente, jogadores: c.jogadores,
  }).save;
  assert.deepEqual(b, { ...a, id: 'manual-1', tipo: 'manual' });
});

teste('onde o grupo está: cena, vila e região sobrevivem ao salvar', () => {
  const st = new Armazem();
  const arm = criarArmazenamento(st);
  for (const local of [{ tipo: 'cena' }, { tipo: 'vila' }, { tipo: 'regiao', onde: 'castelo' }]) {
    arm.gravar('manual-1', montar({ local }).save);
    assert.deepEqual(arm.carregar('manual-1').save.local, local);
  }
});

// ---- S-09: arquivo ---------------------------------------------------------

teste('S-09: exportar e importar devolve o mesmo save', () => {
  const s = montar().save;
  const r = deArquivo(paraArquivo(s));
  assert.ok(r.ok, r.erro);
  assert.deepEqual(r.save, s);
});

teste('S-09: o arquivo recusado não vira save (lixo, JSON de outra coisa, versão nova)', () => {
  assert.equal(deArquivo('isto não é json').ok, false);
  assert.equal(deArquivo('{"nome":"outro jogo"}').ok, false);
  assert.equal(deArquivo('[]').ok, false);
  const novo = montar().save; novo.versao = 99;
  const r = deArquivo(JSON.stringify(novo));
  assert.equal(r.ok, false);
  assert.match(r.erro, /mais nova/);
});

teste('S-09: o nome do arquivo termina em .phandalin.json e não leva barra', () => {
  assert.equal(nomeDoArquivo({ nome: 'Dara & cia / ../x' }).endsWith('.phandalin.json'), true);
  assert.doesNotMatch(nomeDoArquivo({ nome: '../../etc/passwd' }), /[\\/]/);
  assert.equal(nomeDoArquivo({ nome: '   ' }), 'campanha.phandalin.json');
});

// ---- jogador e resumo ------------------------------------------------------

teste('o id do jogador é criado uma vez e lembrado', () => {
  const st = new Armazem();
  let n = 0;
  const a = jogadorLocal(st, { novoId: () => `j-${++n}` });
  const b = jogadorLocal(st, { novoId: () => `j-${++n}` });
  assert.equal(a, b);
  assert.equal(n, 1);
});

teste('o resumo de uma linha diz quantos, que nível e onde', () => {
  const s = montar().save;
  assert.match(resumoDoSave(s), /4 heróis, nível 5/);
  assert.match(resumoDoSave({ ...s, local: { tipo: 'vila' } }), /Phandalin/);
});


// ---- o que a revisão achou ---------------------------------------------------

teste('relógio que volta: o autosave NUNCA pisa no save mais novo', () => {
  const arm = criarArmazenamento(new Armazem());
  for (const t of [100, 200, 300, 50, 60]) arm.autosalvar(montar({ nome: `t${t}`, agora: t }).save);
  const nomes = SLOTS_AUTO.map((sl) => arm.ler(sl).save.nome);
  assert.ok(nomes.includes('t60'), `o último gravado sobrevive: ${nomes}`);
  assert.ok(nomes.includes('t300'), `o de maior data sobrevive: ${nomes}`);
  assert.equal(arm.maisRecente().save.nome, 't60', 'o último a ser gravado é o "Continuar"');
});

teste('empate no mesmo milissegundo: o quinto autosave não pisa no quarto', () => {
  const arm = criarArmazenamento(new Armazem());
  const slots = ['a', 'b', 'c', 'd', 'e'].map((n) => arm.autosalvar(montar({ nome: n, agora: 5 }).save).slot);
  assert.notEqual(slots[3], slots[4]);
  assert.equal(arm.maisRecente().save.nome, 'e');
  assert.equal(new Set(SLOTS_AUTO.map((sl) => arm.ler(sl).save.nome)).size, 3);
});

teste('save de versão MAIS NOVA num slot automático nunca é sobrescrito', () => {
  const st = new Armazem();
  const arm = criarArmazenamento(st);
  const novo = montar({ nome: 'build nova' }).save; novo.versao = VERSAO_ATUAL + 1;
  st.setItem(`${PREFIXO}auto-1`, JSON.stringify(novo));
  for (let i = 0; i < 6; i += 1) arm.autosalvar(montar({ nome: `a${i}`, agora: 10 + i }).save);
  assert.equal(JSON.parse(st.getItem(`${PREFIXO}auto-1`)).nome, 'build nova');
  for (const sl of ['auto-2', 'auto-3']) st.setItem(`${PREFIXO}${sl}`, JSON.stringify(novo));
  const r = arm.autosalvar(montar().save);
  assert.equal(r.ok, false);
  assert.match(r.erro, /mais nova/);
});

teste('slot corrompido é reaproveitado, mas só depois dos vazios', () => {
  const st = new Armazem();
  const arm = criarArmazenamento(st);
  st.setItem(`${PREFIXO}auto-1`, '{lixo');
  assert.equal(arm.proximoSlotAuto(), 'auto-2', 'o vazio vem antes do corrompido');
  arm.autosalvar(montar({ agora: 1 }).save); arm.autosalvar(montar({ agora: 2 }).save);
  assert.equal(arm.proximoSlotAuto(), 'auto-1', 'sem vazios, o corrompido não tem o que perder');
});

teste('gravar recusa o que não é JSON puro e o que é circular, sem lançar', () => {
  const arm = criarArmazenamento(new Armazem());
  const s = montar().save;
  s.campanha.f = () => 1;
  assert.equal(arm.gravar('manual-1', s).ok, false);
  const c = montar().save; c.campanha.c = c.campanha;
  assert.equal(arm.gravar('manual-1', c).ok, false);
  assert.equal(arm.ler('manual-1'), null, 'nada foi gravado');
});

teste('gravar impõe o tipo pelo slot e limita o tamanho', () => {
  const arm = criarArmazenamento(new Armazem());
  arm.gravar('manual-2', montar({ tipo: 'auto' }).save);
  assert.equal(arm.ler('manual-2').save.tipo, 'manual');
  const gordo = montar().save; gordo.campanha.lixo = 'x'.repeat(2_000_000);
  assert.match(arm.gravar('manual-1', gordo).erro, /grande demais/);
});

teste('S-10: tipos errados e fora de faixa são recusados (herói e cabeçalho)', () => {
  const base = montar().save;
  const ruim = (f) => { const c = JSON.parse(JSON.stringify(base)); f(c); return validarSave(c); };
  assert.equal(ruim((c) => { c.herois[0].hp = 'abc'; }).ok, false);
  assert.equal(ruim((c) => { c.herois[0].maxHp = -5; }).ok, false);
  assert.equal(ruim((c) => { c.herois[0].level = 1e9; }).ok, false);
  assert.equal(ruim((c) => { c.herois[0].level = 0; }).ok, false);
  assert.equal(ruim((c) => { c.herois[0].name = {}; }).ok, false);
  assert.equal(ruim((c) => { delete c.herois[1].abilities; }).ok, false, 'herói mínimo, sem as chaves do motor');
  assert.equal(ruim((c) => { delete c.herois[1].weapons; }).ok, false);
  assert.equal(ruim((c) => { c.atualizadoEm = 'x'; }).ok, false);
  assert.equal(ruim((c) => { c.tempoDeJogo = NaN; }).ok, false);
  assert.equal(ruim((c) => { c.config = []; }).ok, false);
  assert.equal(ruim((c) => { c.campanha = []; }).ok, false);
  assert.equal(ruim((c) => { c.config = null; }).ok, false);
  assert.equal(ruim((c) => { c.campanha = null; }).ok, false);
  assert.equal(ruim((c) => { c.nome = 'n'.repeat(5000); }).ok, false);
  assert.equal(ruim((c) => { c.nome = 42; }).ok, false);
  assert.equal(ruim((c) => { c.herois = Array(20).fill(c.herois[0]); }).ok, false);
  assert.equal(ruim((c) => { c.versao = 0; }).ok, false);
  assert.equal(ruim((c) => { c.versao = -1; }).ok, false);
  assert.equal(ruim((c) => { c.versao = 1.5; }).ok, false);
  assert.equal(ruim((c) => { c.xpPendente = 5; }).ok, false);
  assert.equal(ruim((c) => { delete c.herois[0].id; }).ok, false);
  assert.equal(ruim((c) => { c.herois[0].id = null; }).ok, false);
  assert.ok(ruim(() => {}).ok, 'o save bom continua passando');
});

teste('S-10: save inválido mas parseável no armazém aparece como erro, nunca como save', () => {
  const st = new Armazem();
  const arm = criarArmazenamento(st);
  const s = montar().save; s.herois[0].hp = 'x';
  st.setItem(`${PREFIXO}manual-1`, JSON.stringify(s));
  assert.ok(arm.ler('manual-1').erro);
  assert.equal(arm.carregar('manual-1').ok, false);
  assert.equal(arm.maisRecente(), null);
  assert.equal(arm.gravar('manual-1', s).ok, false, 'e não se grava um save inválido');
});

teste('S-07: save sem "local" passa pelo ARMAZÉM e pelo ARQUIVO já com local de cena', () => {
  const st = new Armazem();
  const arm = criarArmazenamento(st);
  const s = montar().save; delete s.local;
  st.setItem(`${PREFIXO}manual-1`, JSON.stringify(s));
  assert.deepEqual(arm.carregar('manual-1').save.local, { tipo: 'cena' });
  assert.deepEqual(deArquivo(JSON.stringify(s)).save.local, { tipo: 'cena' });
});

teste('S-09: a chave __proto__ de um arquivo hostil é descartada', () => {
  const s = montar().save;
  const conteudo = JSON.stringify(s).replace('"campanha":{', '"campanha":{"__proto__":{"admin":true},');
  const r = deArquivo(conteudo);
  assert.ok(r.ok, r.erro);
  assert.equal(Object.hasOwn(r.save.campanha, '__proto__'), false);
  assert.equal(Object.assign({}, r.save.campanha).admin, undefined);
});

teste('apagar remove o slot e diz se não conseguiu', () => {
  const arm = criarArmazenamento(new Armazem());
  arm.gravar('manual-1', montar().save);
  assert.equal(arm.apagar('manual-1'), true);
  assert.equal(arm.ler('manual-1'), null);
  assert.equal(criarArmazenamento({ getItem() { return null; }, removeItem() { throw new Error('x'); } }).apagar('manual-1'), false);
});

teste('criadoEm é preservado e o arquivo exportado é legível (indentado)', () => {
  const s = montarSave({ id: 'a', nome: 'x', criadoEm: 7, agora: 99, config: configDaCampanha(), campanha: {}, herois: makeParty({ nivel: 1 }) }).save;
  assert.equal(s.criadoEm, 7);
  assert.equal(s.atualizadoEm, 99);
  assert.ok(paraArquivo(s).includes('\n '));
});

teste('o id do jogador sobrevive a um armazém que não grava', () => {
  const mudo = { getItem() { return null; }, setItem() { throw new Error('cota'); } };
  let n = 0;
  const a = jogadorLocal(mudo, { novoId: () => `j-${++n}` });
  assert.equal(jogadorLocal(mudo), a);
});

teste('nome de arquivo: curto, sem nome reservado do Windows', () => {
  assert.ok(nomeDoArquivo({ nome: 'x'.repeat(5000) }).length < 80);
  assert.equal(nomeDoArquivo({ nome: 'CON' }), 'save-con.phandalin.json');
});

teste('resumo de um save sem heróis não vira -Infinity', () => {
  assert.doesNotMatch(resumoDoSave({ herois: [], local: { tipo: 'cena' }, config: {} }), /Infinity/);
});

console.log(`\n${total - falhas}/${total} testes passaram${falhas ? `, ${falhas} FALHARAM` : ''}.`);
process.exit(falhas ? 1 : 0);
