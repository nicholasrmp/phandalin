// Testes das FALAS POR PERFIL (raça, classe e atributo nas conversas): o perfil em `dialogo-perfil.js` e a conversa de
// verdade (`dialogo.js`), com a interface trocada por stubs.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-dialogo-perfil.mjs
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { montarHeroi } = await import(P + 'game/criacao.js');
const { HEROIS_JOGAVEIS } = await import(P + 'game/sala.js');
const { racaDe, atendePerfil, quemAtende, etiquetaDoPerfil } = await import(P + 'game/dialogo-perfil.js');
const { conversar } = await import(P + 'game/dialogo.js');
const { registrarParaTeste, limparParaTeste, extrasDoNpc } = await import(P + 'game/dialogos-extras.js');
const { makeRng } = await import(P + 'core/rng.js');

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
