// Testes das FALAS POR PERFIL (raça, classe e atributo nas conversas): o perfil em `dialogo-perfil.js` e a conversa de
// verdade (`dialogo.js`), com a interface trocada por stubs.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-dialogo-perfil.mjs
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { montarHeroi } = await import(P + 'game/criacao.js');
const { HEROIS_JOGAVEIS } = await import(P + 'game/sala.js');
const { racaDe, atendePerfil, quemAtende, etiquetaDoPerfil } = await import(P + 'game/dialogo-perfil.js');
const { conversar, quemEscreve, testesDaCaixa, quemPodeAjudar, ofertaDeOuro } = await import(P + 'game/dialogo.js');
const { registrarParaTeste, limparParaTeste, extrasDoNpc } = await import(P + 'game/dialogos-extras.js');
const { makeRng } = await import(P + 'core/rng.js');
const { estadoDe } = await import(P + 'rules/utilidade.js');

let total = 0;
let falhas = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${String(e.stack ?? e.message).split('\n').slice(0, 6).join('\n      ')}`);
  }
}

const elenco = Object.fromEntries(HEROIS_JOGAVEIS.map((id) => { const h = montarHeroi(id); return [h.name, h]; }));
const todos = Object.values(elenco);
const por = (...nomes) => nomes.map((n) => elenco[n]);

/** Roda uma conversa e devolve { fim, vistas }. `escolhe(esc, passo)` devolve o `valor` de cada passo. */
async function conversa(herois, npc, arvore, escolhe) {
  const vistas = [];
  globalThis.__escolher = (esc) => {
    vistas.push(esc.map((e) => ({ rotulo: e.rotulo, detalhe: e.detalhe, motivo: e.motivo })));
    return escolhe(esc, vistas.length);
  };
  const app = { root: {}, campanha: {}, selected: herois[0] };
  const fora = { herois, rng: makeRng(3), say() {} };
  try {
    const fim = await conversar(app, npc, arvore, fora);
    return { fim, vistas };
  } finally { delete globalThis.__escolher; }
}

const NOME = 'Teste Falante';
const NPC = { name: NOME, id: 'teste-falante', look: null };
const arvore = () => ({
  inicio: 'oi',
  nos: {
    oi: { fala: 'Quem são vocês?', opcoes: [{ texto: 'Viemos em paz.', fim: 'paz' }] },
    conta: { fala: 'Tudo bem, tudo bem!', fim: 'contou' },
  },
});
const acha = (esc, re) => esc.find((e) => re.test(e.rotulo));

await teste('o elenco inteiro tem raça reconhecida, sem gênero nem acento', () => {
  assert.equal(racaDe({ ancestry: 'Meio-elfa' }), 'meioElfo');
  assert.equal(racaDe({ ancestry: 'Meio-elfo' }), 'meioElfo');
  assert.equal(racaDe(elenco.Grask), 'meioOrc');
  assert.equal(racaDe(elenco.Brenn), 'anao');
  assert.equal(racaDe(elenco.Sylwen), 'elfo');
  assert.equal(racaDe(elenco.Ilvan), 'elfo');
  assert.equal(racaDe(elenco.Dara), 'draconato');
  assert.equal(racaDe(elenco.Corin), 'humano');
  assert.equal(racaDe(elenco.Lirra), 'gnomo');
  assert.equal(racaDe(elenco.Pip), 'halfling');
  assert.equal(racaDe(elenco.Vesh), 'tiferino');
  for (const h of todos) assert.ok(['humano', 'anao', 'elfo', 'halfling', 'gnomo', 'draconato', 'meioOrc', 'meioElfo', 'tiferino'].includes(racaDe(h)), `${h.name}: ${racaDe(h)}`);
});

await teste('o perfil junta as condições NO MESMO herói', () => {
  const nomes = (perfil) => quemAtende(todos, perfil).map((h) => h.name).sort();
  assert.deepEqual(nomes({ atributo: { for: 17 } }), ['Dara', 'Grask', 'Torvik']);
  assert.deepEqual(nomes({ classe: 'clerigo' }), ['Brenn']);
  assert.deepEqual(nomes({ raca: 'anao' }), ['Brenn', 'Torvik']);
  assert.deepEqual(nomes({ raca: 'anao', classe: 'paladino' }), ['Torvik']);
  assert.deepEqual(nomes({ classe: ['bruxo', 'feiticeiro'], atributo: { car: 17 } }), ['Selane', 'Vesh']);
  assert.deepEqual(nomes({ raca: 'meioElfo' }), ['Maren', 'Selane']);
  assert.deepEqual(nomes({ atributo: { for: 18 } }), [], 'ninguém começa com Força 18');
  assert.equal(atendePerfil(elenco.Dara, { atributo: { for: 17, sab: 15 } }), false, 'as DUAS condições, no mesmo herói');
  assert.equal(atendePerfil(elenco.Dara, { nivel: 2 }), false);
  assert.equal(atendePerfil(elenco.Dara, null), true);
  assert.equal(etiquetaDoPerfil({ raca: 'anao', atributo: { for: 17 } }), 'Anão · Força 17+');
  assert.equal(etiquetaDoPerfil({ classe: ['bruxo', 'feiticeiro'] }), 'Bruxo ou Feiticeiro');
});

await teste('a opção por atributo só aparece para quem tem o atributo; a etiqueta diz quem fala', async () => {
  limparParaTeste(NOME);
  registrarParaTeste(NOME, {
    nos: { 'x:forca': { fala: 'Tá, tá! Eu falo!', fim: 'contou' } },
    porNo: { oi: [{ texto: 'Cruzo os braços e olho de cima.', perfil: { atributo: { for: 17 } }, vai: 'x:forca' }] },
  });
  const com = await conversa(por('Pip', 'Dara'), NPC, arvore(), (esc) => acha(esc, /Cruzo/).valor);
  assert.equal(com.fim, 'contou');
  const extra = acha(com.vistas[0].map((v) => ({ ...v, valor: 0 })), /Cruzo/);
  assert.match(extra.detalhe, /Força 17\+ · Dara/);
  const sem = await conversa(por('Pip', 'Ilvan'), NPC, arvore(), (esc) => esc[0].valor);
  assert.ok(!sem.vistas[0].some((o) => /Cruzo/.test(o.rotulo)), 'sem Força 17 a opção some');
  assert.equal(sem.fim, 'paz');
});

await teste('a opção cinza (mostrar) diz quem pode; a de teste é rolada por quem atende o perfil', async () => {
  limparParaTeste(NOME);
  registrarParaTeste(NOME, {
    porNo: { oi: [{ texto: 'Ergo o símbolo sagrado.', perfil: { classe: 'clerigo' }, mostrar: true, teste: { pericia: 'religiao', cd: 5 }, sucesso: 'conta', falha: 'conta' }] },
  });
  const sem = await conversa(por('Dara', 'Pip'), NPC, arvore(), (esc) => esc[0].valor);
  const cinza = sem.vistas[0].find((o) => /símbolo/.test(o.rotulo));
  assert.ok(cinza, 'aparece cinza');
  assert.match(cinza.motivo, /só quem for Clérigo/);
  const com = await conversa(por('Dara', 'Brenn'), NPC, arvore(), (esc) => acha(esc, /símbolo/).valor);
  assert.equal(com.fim, 'contou');
  const op = com.vistas[0].find((o) => /símbolo/.test(o.rotulo));
  assert.equal(op.motivo, null);
  assert.match(op.detalhe, /Clérigo · Brenn/);
  assert.match(op.detalhe, /Religião CD 5 · Brenn/, 'Brenn rola, e a chance aparece');
});

await teste('o texto pode ser função do herói que fala (ctx.quem) e `uma` some depois de usada', async () => {
  limparParaTeste(NOME);
  registrarParaTeste(NOME, {
    porNo: { oi: [{ texto: (ctx) => `${ctx.quem.name} fala em élfico.`, perfil: { raca: 'elfo' }, uma: true, vai: 'oi' }] },
  });
  const r = await conversa(por('Ilvan', 'Dara'), NPC, arvore(), (esc, n) => (n === 1 ? acha(esc, /élfico/).valor : esc[0].valor));
  assert.ok(r.vistas[0].some((o) => /Ilvan fala em élfico/.test(o.rotulo)));
  assert.ok(!r.vistas[1].some((o) => /élfico/.test(o.rotulo)), 'a opção, uma vez usada, some');
});

await teste('herói inconsciente não fala: não atende o perfil e não rola', async () => {
  const { addCondition } = await import(P + 'rules/conditions.js');
  const dorme = montarHeroi('pc-guerreiro');
  addCondition(dorme, 'inconsciente');
  assert.equal(quemAtende([dorme, elenco.Grask], { atributo: { for: 17 } }).map((h) => h.name).join(), 'Grask');
});

await teste('numa sala, a conversa é de quem a começou até o fim, e quem fala é o herói dele', async () => {
  limparParaTeste(NOME);
  const herois = por('Ilvan', 'Dara');
  let preso = null;
  let janelaDosDezSegundos = 'pc-dara';   // `atorAtual` de verdade: depois de 10 s, sem nada preso, ela vence
  const app = {
    root: {}, campanha: {}, selected: herois[0],
    atorAtual: () => preso ?? janelaDosDezSegundos,
    prenderAtor: (id) => { const antes = preso; preso = id ?? null; return antes; },
  };
  herois[1].id = 'pc-dara';
  const donos = [];
  const quem = [];
  globalThis.__escolher = (esc) => {
    donos.push(app.atorAtual());
    janelaDosDezSegundos = null;      // o jogador demorou: a janela venceu no meio da conversa
    return esc[0].valor;
  };
  const arv = { inicio: 'a', nos: {
    a: { fala: 'Primeira.', opcoes: [{ texto: (ctx) => { quem.push(ctx.quem.name); return 'Segue.'; }, vai: 'b' }] },
    b: { fala: 'Segunda.', opcoes: [{ texto: 'Fim.', fim: 'ok' }] },
  } };
  try {
    assert.equal(await conversar(app, NPC, arv, { herois, rng: makeRng(3), say() {} }), 'ok');
  } finally { delete globalThis.__escolher; }
  assert.deepEqual(donos, ['pc-dara', 'pc-dara'], 'a segunda decisão continua com ela');
  assert.equal(quem[0], 'Dara', 'fala o herói dela, não o selecionado na tela do anfitrião');
  assert.equal(preso, null, 'acabou a conversa, solta');
});

await teste('na caixa rola quem escreveu: o dono da conversa, o herói do líder, ou o melhor se o líder não tem herói', async () => {
  const herois = por('Ilvan', 'Dara');
  const [ilvan, dara] = herois;
  ilvan.id = 'h-ilvan'; dara.id = 'h-dara';
  const visao = { lider: 'p2', anfitriao: 'p1', herois: { 'h-ilvan': 'p1', 'h-dara': 'p2' }, jogadores: [{ id: 'p1', conectado: true }, { id: 'p2', conectado: true }] };
  assert.equal(quemEscreve({ salaDaPartida: { visao } }, { doAtor: ilvan, herois }), ilvan, 'o dono da conversa');
  assert.equal(quemEscreve({ salaDaPartida: { visao } }, { doAtor: null, herois }), dara, 'sem dono, o herói do líder');
  assert.equal(quemEscreve({ salaDaPartida: { visao: { ...visao, herois: {} } } }, { doAtor: null, herois }), null, 'líder sem herói: a frase é do grupo');
  assert.equal(quemEscreve({}, { doAtor: null, herois, falante: dara }), dara, 'sozinho, o selecionado');

  // O teste de verdade, por dentro da conversa: a etiqueta e o dado são de quem escreve, mesmo havendo alguém melhor.
  const o = { texto: 'Fala.', teste: { pericia: 'intimidacao', cd: 5 }, vai: 'x' };
  const ctx = { estado: estadoDe({}), herois, npc: NPC };
  const [t] = testesDaCaixa(ctx, [{ rotulo: 'Fala.', valor: { o, chave: 'oi:0' } }], ilvan);
  assert.equal(t.valor.o.teste.heroi, ilvan);
  assert.match(t.detalhe, /Ilvan/);
  assert.equal(t.valor.chave, 'oi:0', 'a opção segue a mesma para `uma`');
  assert.equal(o.teste.heroi, undefined, 'a árvore não muda');
  const [doGrupo] = testesDaCaixa(ctx, [{ rotulo: 'Fala.', valor: { o, chave: 'oi:0' } }], null);
  assert.equal(doGrupo.valor.o.teste.heroi, undefined, 'sem quem escreva, rola o melhor');
  const perfil = { ...o, teste: { ...o.teste, heroi: dara } };
  const [dePerfil] = testesDaCaixa(ctx, [{ rotulo: 'Fala.', valor: { o: perfil, chave: 'oi:1' } }], ilvan);
  assert.equal(dePerfil.valor.o.teste.heroi, dara, 'a opção por perfil continua com quem atende o perfil');
});

await teste('numa sala rola o herói de quem começou, com ajuda de outro jogador uma vez; sozinho, rola o melhor sem pedir ajuda', async () => {
  limparParaTeste(NOME);
  const herois = por('Ilvan', 'Dara');
  const [ilvan, dara] = herois;
  ilvan.id = 'h-ilvan'; dara.id = 'h-dara';
  const visao = { lider: 'p1', anfitriao: 'p1', herois: { 'h-ilvan': 'p1', 'h-dara': 'p2' }, jogadores: [{ id: 'p1', conectado: true }, { id: 'p2', conectado: true }] };
  assert.deepEqual(quemPodeAjudar(visao, herois, ilvan).map((a) => [a.pub, a.heroi.name]), [['p2', 'Dara']]);
  assert.deepEqual(quemPodeAjudar(visao, herois, ilvan, new Set(['h-dara'])), [], 'cada herói ajuda uma vez');
  assert.deepEqual(quemPodeAjudar({ ...visao, jogadores: [{ id: 'p1', conectado: true }, { id: 'p2', conectado: false }] }, herois, ilvan), [], 'quem caiu não ajuda');
  assert.deepEqual(quemPodeAjudar(null, herois, ilvan), [], 'sozinho não há ajuda');

  const arv = { inicio: 'a', nos: {
    a: { fala: 'Primeira.', opcoes: [{ texto: 'Fala.', teste: { pericia: 'intimidacao', cd: 1 }, sucesso: 'b', falha: 'b' }] },
    b: { fala: 'Segunda.', opcoes: [{ texto: 'De novo.', teste: { pericia: 'intimidacao', cd: 1 }, sucesso: 'c', falha: 'c' }] },
    c: { fala: 'Fim.', opcoes: [{ texto: 'Sair.', fim: 'ok' }] },
  } };
  const paineis = [];
  const log = [];
  globalThis.__escolher = (esc) => {
    paineis.push(esc.map((e) => e.rotulo));
    return (esc.find((e) => e.valor === 'ajudar') ?? esc[0]).valor;
  };
  const app = {
    root: {}, campanha: {}, selected: dara, salaDaPartida: { visao },
    atorAtual: () => 'h-ilvan', prenderAtor: () => null, quemAjudou: () => 'p2',
  };
  try {
    assert.equal(await conversar(app, NPC, arv, { herois, rng: makeRng(3), say: (_, t) => log.push(t) }), 'ok');
  } finally { delete globalThis.__escolher; }
  assert.match(log[0], /^Ilvan · /, 'rola o herói de quem começou, não o melhor');
  assert.match(log[0], /Dara ajudou/);
  assert.doesNotMatch(log[1], /ajudou/, 'a segunda vez Dara já tinha ajudado');
  assert.equal(paineis.filter((p) => p.includes('Ajudar')).length, 1, 'a oferta só aparece enquanto há quem ajude');
});

await teste('o teste social vencido libera os fatos da ficha; o perdido não, e fica cada um na sua ficha', async () => {
  const { FICHAS, fatosLiberados, flagDeApertado, idDaFicha } = await import(P + 'game/npc-saber.js');
  assert.equal(idDaFicha({ defId: 'goblin', capturado: true }), 'goblinCapturado');
  assert.equal(idDaFicha({ defId: 'goblin' }), null, 'goblin solto não tem ficha');
  assert.equal(idDaFicha({ defId: 'marcarrubra', capturado: true }), 'marcarrubra');
  assert.deepEqual(fatosLiberados(FICHAS.goblinCapturado, {}), ['quem'], 'antes do dado ele só treme');
  assert.ok(fatosLiberados(FICHAS.goblinCapturado, { [flagDeApertado('goblinCapturado')]: true }).includes('castelo'));
  assert.ok(!fatosLiberados(FICHAS.yeemik, {}).includes('grol'));
  assert.ok(fatosLiberados(FICHAS.yeemik, { [flagDeApertado('yeemik')]: true }).includes('grol'));

  const goblin = { defId: 'goblin', capturado: true, name: 'Goblin', look: null };
  const rodar = async (cd) => {
    const herois = por('Ilvan', 'Dara');
    const campanha = {};
    globalThis.__escolher = (esc) => esc[0].valor;
    try {
      await conversar({ root: {}, campanha, selected: herois[0] }, goblin, { inicio: 'a', nos: {
        a: { fala: 'Não mata!', opcoes: [{ texto: 'Fala.', teste: { pericia: 'intimidacao', cd }, sucesso: 'b', falha: 'b' }] },
        b: { fala: 'Pronto.', opcoes: [{ texto: 'Sair.', fim: 'ok' }] },
      } }, { herois, rng: makeRng(3), say() {} });
    } finally { delete globalThis.__escolher; }
    return campanha.flags[flagDeApertado('goblinCapturado')];
  };
  assert.equal(await rodar(1), true, 'CD 1: vence e libera');
  assert.equal(await rodar(99), undefined, 'CD 99: perde e não libera');
});

await teste('a oferta na caixa: pouca recusa, sem ouro recusa, e paga de verdade para rolar com vantagem', async () => {
  const { totalEmCobre } = await import(P + 'game/comercio.js');
  const herois = por('Ilvan', 'Dara');
  const ditos = [];
  const ctx = { estado: estadoDe({}), herois, npc: NPC, enc: { say: (_, t) => ditos.push(t) } };
  const o = { texto: 'Solta.', teste: { pericia: 'persuasao', cd: 10 }, vai: 'x' };
  const teste = { valor: { o, chave: 'oi:0' } };
  assert.match(ofertaDeOuro(ctx, teste, 5).motivo, /ao menos 10 po/);
  const naBolsa = Math.floor(totalEmCobre(herois) / 100);
  assert.match(ofertaDeOuro(ctx, teste, naBolsa + 1).motivo, /o grupo tem só/);
  if (naBolsa >= 10) {
    const of = ofertaDeOuro(ctx, teste, 10);
    assert.equal(of.motivo, null);
    const valor = of.pagar();
    assert.equal(Math.floor(totalEmCobre(herois) / 100), naBolsa - 10, 'o ouro saiu da ficha');
    assert.equal(valor.o.teste.vantagem, true);
    assert.equal(valor.chave, 'oi:0');
    assert.equal(o.teste.vantagem, undefined, 'a árvore não muda');
    assert.match(ditos[0], /paga 10 po/);
  }
});

await teste('a chave `uma` da opção acrescentada não depende do tamanho da árvore', async () => {
  limparParaTeste(NOME);
  registrarParaTeste(NOME, { porNo: { oi: [{ texto: 'Falo em dracônico.', perfil: { raca: 'draconato' }, uma: true, vai: 'oi' }] } });
  const campanha = {};
  const rodar = async (arv) => {
    globalThis.__escolher = (esc) => acha(esc, /dracônico/)?.valor ?? esc[0].valor;
    const app = { root: {}, campanha, selected: elenco.Dara };
    await conversar(app, NPC, arv, { herois: [elenco.Dara], rng: makeRng(3), say() {} });
    delete globalThis.__escolher;
  };
  const grande = arvore();
  grande.nos.oi.opcoes.push({ texto: 'Outra.', fim: 'a' }, { texto: 'Mais outra.', fim: 'b' });
  await rodar(grande);
  const usadas = campanha.flags['dialogo:teste-falante:usadas'];
  assert.ok(usadas.some((c) => c.startsWith('oi:x')), `chave: ${usadas}`);
  assert.ok(!usadas.includes('oi:3'));
});

await teste('quem não atende nada vê a conversa idêntica à da árvore (nenhuma opção a mais)', async () => {
  limparParaTeste(NOME);
  registrarParaTeste(NOME, { porNo: { oi: [
    { texto: 'Falo em dracônico.', perfil: { raca: 'draconato' }, fim: 'x' },
    { texto: 'Mostro o símbolo.', perfil: { classe: 'clerigo' }, fim: 'x' },
  ] } });
  const r = await conversa(por('Pip', 'Ilvan'), NPC, arvore(), (esc) => esc[0].valor);
  assert.equal(r.vistas[0].filter((o) => !/Conjurar|Sondar/.test(o.rotulo)).length, 1);
});

await teste('NPCs sem extras seguem iguais (extrasDoNpc devolve vazio)', () => {
  limparParaTeste(NOME);
  const e = extrasDoNpc({ name: 'Ninguém Conhecido', id: 'zzz' });
  assert.deepEqual(e, { nos: {}, porNo: {} });
});

// ---- o CONTEÚDO escrito (src/game/dialogos/*.js) -----------------------------------------------------------------------------
limparParaTeste(NOME);
const { REGISTRO_PARA_TESTE } = await import(P + 'game/dialogos-extras.js');
const { readFileSync, readdirSync } = await import('node:fs');
const RACAS = ['humano', 'anao', 'elfo', 'halfling', 'gnomo', 'draconato', 'meioOrc', 'meioElfo', 'tiferino'];
const CLASSES = ['guerreiro', 'ladino', 'clerigo', 'mago', 'barbaro', 'druida', 'bruxo', 'feiticeiro', 'paladino', 'patrulheiro', 'monge', 'bardo'];
const ATRIBUTOS = ['for', 'des', 'con', 'int', 'sab', 'car'];
const PERICIAS = ['acrobacia', 'arcanismo', 'atletismo', 'atuacao', 'enganacao', 'furtividade', 'historia', 'intimidacao', 'intuicao', 'investigacao', 'lidarComAnimais', 'medicina', 'natureza', 'percepcao', 'persuasao', 'prestidigitacao', 'religiao', 'sobrevivencia'];
const lista = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);

// Os ids de nó que existem nas árvores do jogo (chave `id:` seguida de `{`), para conferir os `porNo`.
const DIR = new URL('../game/', import.meta.url);
const fontes = readdirSync(DIR).filter((f) => f.endsWith('.js')).map((f) => readFileSync(new URL(f, DIR), 'utf8')).join('\n');
const noExiste = (id) => new RegExp(`(^|[\\s,{])['"]?${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]?\\s*:\\s*\\{`, 'm').test(fontes);

await teste('o conteúdo por perfil: perfis válidos, toda opção tem saída e destino, e cada nó citado existe', () => {
  const reg = REGISTRO_PARA_TESTE();
  assert.ok(reg.size >= 1, 'há falas por perfil registradas');
  const erros = [];
  let opcoes = 0;
  for (const [npc, e] of reg) {
    const todas = [];
    for (const [no, ops] of Object.entries(e.porNo)) {
      if (!noExiste(no)) erros.push(`${npc}: o nó "${no}" de porNo não existe em nenhuma árvore`);
      for (const o of ops) todas.push([`${npc}/${no}`, o]);
    }
    for (const [id, no] of Object.entries(e.nos)) {
      if (!id.startsWith('x:')) erros.push(`${npc}: o nó novo "${id}" não tem o prefixo x:`);
      if (!no.fala) erros.push(`${npc}/${id}: nó novo sem fala`);
      for (const o of no.opcoes ?? []) todas.push([`${npc}/${id}`, o]);
      if (!no.opcoes?.length && no.fim == null) erros.push(`${npc}/${id}: nó novo sem opções e sem fim`);
    }
    for (const [onde, o] of todas) {
      opcoes += 1;
      const rot = `${onde} "${typeof o.texto === 'function' ? '(função)' : String(o.texto).slice(0, 28)}"`;
      if (!o.texto) erros.push(`${rot}: sem texto`);
      if (o.vai == null && o.fim === undefined && !o.teste) erros.push(`${rot}: sem vai, fim nem teste`);
      if (o.teste && (o.sucesso === undefined && o.falha === undefined)) erros.push(`${rot}: teste sem sucesso/falha`);
      if (o.teste && !PERICIAS.includes(o.teste.pericia)) erros.push(`${rot}: perícia "${o.teste.pericia}" desconhecida`);
      for (const destino of [o.vai, o.sucesso, o.falha]) {
        if (typeof destino === 'string' && destino.startsWith('x:') && !e.nos[destino]) erros.push(`${rot}: destino "${destino}" não existe nos nós novos`);
        else if (typeof destino === 'string' && !destino.startsWith('x:') && !noExiste(destino)) erros.push(`${rot}: destino "${destino}" não existe em nenhuma árvore`);
      }
      const p = o.perfil;
      if (!p && !String(onde).includes('/x:')) erros.push(`${rot}: opção acrescentada sem perfil`);
      if (!p) continue;
      for (const r of lista(p.raca)) if (!RACAS.includes(r)) erros.push(`${rot}: raça "${r}" desconhecida`);
      for (const c of lista(p.classe)) if (!CLASSES.includes(c)) erros.push(`${rot}: classe "${c}" desconhecida`);
      for (const [k, v] of Object.entries(p.atributo ?? {})) if (!ATRIBUTOS.includes(k) || !(v >= 8 && v <= 20)) erros.push(`${rot}: atributo ${k} ${v} inválido`);
      const alto = Object.values(p.atributo ?? {}).some((v) => v >= 18) || (p.nivel ?? 1) > 1;
      if (!alto && !quemAtende(todos, p).length) erros.push(`${rot}: nenhum dos 12 heróis iniciais atende ${etiquetaDoPerfil(p)}`);
    }
  }
  console.log(`      ${reg.size} NPCs, ${opcoes} opções`);
  assert.deepEqual(erros, []);
});

console.log(`\n${total - falhas}/${total} testes passaram${falhas ? `, ${falhas} FALHARAM` : ''}.`);
process.exit(falhas ? 1 : 0);
