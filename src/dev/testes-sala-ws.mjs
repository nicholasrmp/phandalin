// Teste de INTEGRAÇÃO da sala: navegadores de mentira (WebSocket do Node) falando
// com o Worker de verdade. Precisa do servidor local de pé:
//
//   npm run build && npx wrangler dev --port 8787 --local     (num terminal)
//   node src/dev/testes-sala-ws.mjs                            (em outro)
//
// Sem o servidor no ar, o teste diz isso e sai sem falhar: ele só roda onde há
// `wrangler dev`. Os testes de regra (`testes-sala.mjs`) é que rodam sempre.

import assert from 'node:assert/strict';

const BASE = process.env.SALA_URL ?? 'ws://127.0.0.1:8787';
const HTTP = BASE.replace(/^ws/, 'http');

try { await fetch(`${HTTP}/api/sala/AAAAAA`); } catch {
  console.log(`(sem servidor em ${BASE}: teste de integração ignorado; veja o cabeçalho do arquivo)`);
  process.exit(0);
}

let total = 0;
let falhas = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${String(e.message).split('\n').join('\n      ')}`);
  }
}

const CODIGOS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const codigoNovo = () => Array.from({ length: 6 }, () => CODIGOS[Math.floor(Math.random() * CODIGOS.length)]).join('');
const idNovo = (n) => `jogador-${n}-${Math.random().toString(36).slice(2, 10)}`;

/** Um navegador de mentira: guarda tudo que o servidor mandou e deixa esperar por uma mensagem. */
class Cliente {
  constructor(codigo, jogadorId) {
    this.codigo = codigo; this.jogadorId = jogadorId; this.recebidas = []; this.fechou = null; this.espera = [];
  }

  abrir() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${BASE}/api/sala/${this.codigo}`);   // o id NÃO vai na URL
      this.ws.addEventListener('open', () => resolve(this));
      this.ws.addEventListener('error', () => reject(new Error('não abriu')));
      this.ws.addEventListener('message', (e) => {
        const m = JSON.parse(e.data); this.recebidas.push(m);
        for (const w of [...this.espera]) if (w.pred(m)) { this.espera.splice(this.espera.indexOf(w), 1); w.resolve(m); }
      });
      this.ws.addEventListener('close', (e) => { this.fechou = e.code; for (const w of this.espera) w.resolve(null); this.espera = []; });
    });
  }

  /** A primeira mensagem leva o id (`eu`), como o cliente de verdade; as outras não. */
  manda(msg) {
    if (typeof msg !== 'string' && !this.identificado) { msg = { ...msg, eu: this.jogadorId }; this.identificado = true; }
    this.ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }

  /** A próxima mensagem (já recebida ou futura) que satisfaz `pred`; falha em 4 s. */
  esperar(pred, rotulo = 'mensagem', ms = 4000) {
    const ja = this.recebidas.find(pred);
    if (ja) return Promise.resolve(ja);
    return new Promise((resolve, reject) => {
      const w = { pred, resolve };
      this.espera.push(w);
      setTimeout(() => { if (this.espera.includes(w)) { this.espera.splice(this.espera.indexOf(w), 1); reject(new Error(`esperei ${rotulo} e não veio`)); } }, ms);
    });
  }

  /** Espera a PRÓXIMA visão (ignora as antigas) que satisfaz `pred`. */
  proximaVisao(pred = () => true) {
    this.recebidas.length = 0;
    return this.esperar((m) => m.tipo === 'sala' && pred(m.visao), 'uma visão');
  }

  fechar() { try { this.ws.close(); } catch { /* já fechado */ } }
}

const vez = (ms = 150) => new Promise((r) => setTimeout(r, ms));
const abertos = [];
const cliente = async (codigo, n) => { const c = await new Cliente(codigo, idNovo(n)).abrir(); abertos.push(c); return c; };

await teste('criar a sala: o anfitrião recebe a visão, é p1, e o lobby está vazio de heróis', async () => {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf');
  a.manda({ tipo: 'criar', nome: 'Nicholas', maxJogadores: 4, origem: { tipo: 'nova', aventura: 'mina-perdida' } });
  const m = await a.esperar((x) => x.tipo === 'sala');
  assert.equal(m.visao.codigo, codigo);
  assert.equal(m.visao.voce, 'p1'); assert.equal(m.visao.anfitriao, 'p1');
  assert.equal(m.visao.fase, 'lobby');
  assert.deepEqual(m.visao.herois, {});
});

await teste('dois jogadores: cada um pega um herói, os dois veem tudo, e o id secreto não vaza', async () => {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf'); const b = await cliente(codigo, 'beto');
  a.manda({ tipo: 'criar', nome: 'Nicholas' }); await a.esperar((x) => x.tipo === 'sala');
  b.manda({ tipo: 'entrar', nome: 'Beto' });
  const v = await b.esperar((x) => x.tipo === 'sala' && x.visao.jogadores.length === 2);
  assert.equal(v.visao.voce, 'p2');
  a.manda({ tipo: 'pegar', heroi: 'pc-guerreiro' });
  b.manda({ tipo: 'pegar', heroi: 'pc-mago' });
  const final = await a.esperar((x) => x.tipo === 'sala' && x.visao.herois['pc-mago'] && x.visao.herois['pc-guerreiro']);
  assert.equal(final.visao.herois['pc-guerreiro'], 'p1');
  assert.equal(final.visao.herois['pc-mago'], 'p2');
  const texto = JSON.stringify(a.recebidas);
  assert.equal(texto.includes(a.jogadorId) || texto.includes(b.jogadorId), false, 'o id secreto de alguém apareceu numa mensagem');
});

await teste('herói já escolhido é recusado só para quem pediu, e o estado não muda', async () => {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf'); const b = await cliente(codigo, 'beto');
  a.manda({ tipo: 'criar', nome: 'N' }); await a.esperar((x) => x.tipo === 'sala');
  b.manda({ tipo: 'entrar', nome: 'B' }); await b.esperar((x) => x.tipo === 'sala');
  a.manda({ tipo: 'pegar', heroi: 'pc-guerreiro' }); await b.esperar((x) => x.tipo === 'sala' && x.visao.herois['pc-guerreiro']);
  b.recebidas.length = 0; a.recebidas.length = 0;
  b.manda({ tipo: 'pegar', heroi: 'pc-guerreiro' });
  const e = await b.esperar((x) => x.tipo === 'erro');
  assert.match(e.erro, /dono/);
  await vez();
  assert.equal(a.recebidas.some((x) => x.tipo === 'erro'), false, 'o erro não foi para o outro');
});

await teste('grupo completo, todos prontos: o anfitrião inicia e todos veem a partida iniciada', async () => {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf'); const b = await cliente(codigo, 'beto');
  a.manda({ tipo: 'criar', nome: 'N' }); await a.esperar((x) => x.tipo === 'sala');
  b.manda({ tipo: 'entrar', nome: 'B' }); await b.esperar((x) => x.tipo === 'sala');
  for (const h of ['pc-guerreiro', 'pc-ladino', 'pc-clerigo']) a.manda({ tipo: 'pegar', heroi: h });
  for (const h of ['pc-mago']) b.manda({ tipo: 'pegar', heroi: h });
  await a.esperar((x) => x.tipo === 'sala' && Object.keys(x.visao.herois).length === 4); await vez(150);   // as quatro escolhas chegam antes de alguém ficar pronto
  a.manda({ tipo: 'pronto', valor: true }); b.manda({ tipo: 'pronto', valor: true });
  await a.esperar((x) => x.tipo === 'sala' && x.visao.jogadores.every((j) => j.pronto));
  b.manda({ tipo: 'iniciar' });
  assert.match((await b.esperar((x) => x.tipo === 'erro')).erro, /anfitrião/);
  a.manda({ tipo: 'iniciar' });
  const v = await b.esperar((x) => x.tipo === 'sala' && x.visao.fase === 'iniciada');
  assert.equal(v.visao.fase, 'iniciada');
});

await teste('cair e voltar: o jogador reassume o lugar e o herói; o outro vê o conectado mudar', async () => {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf');
  const idB = idNovo('beto');
  let b = await new Cliente(codigo, idB).abrir(); abertos.push(b);
  a.manda({ tipo: 'criar', nome: 'N' }); await a.esperar((x) => x.tipo === 'sala');
  b.manda({ tipo: 'entrar', nome: 'B' }); await b.esperar((x) => x.tipo === 'sala');
  b.manda({ tipo: 'pegar', heroi: 'pc-mago' });
  await a.esperar((x) => x.tipo === 'sala' && x.visao.herois['pc-mago']);
  a.recebidas.length = 0;
  b.fechar();
  const caiu = await a.esperar((x) => x.tipo === 'sala' && x.visao.jogadores.find((j) => j.id === 'p2')?.conectado === false);
  assert.equal(caiu.visao.herois['pc-mago'], 'p2', 'o herói ficou com ele');
  a.recebidas.length = 0;
  b = await new Cliente(codigo, idB).abrir(); abertos.push(b);
  b.manda({ tipo: 'entrar', nome: 'B' });
  const voltou = await a.esperar((x) => x.tipo === 'sala' && x.visao.jogadores.find((j) => j.id === 'p2')?.conectado === true);
  assert.equal(voltou.visao.herois['pc-mago'], 'p2');
  assert.equal((await b.esperar((x) => x.tipo === 'sala')).visao.voce, 'p2');
});

await teste('F4: o anfitrião publica a vista da partida e só os outros a recebem; quem entra depois recebe a última', async () => {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf'); const idB = idNovo('beto'); let b = await new Cliente(codigo, idB).abrir(); abertos.push(b);
  a.manda({ tipo: 'criar', nome: 'N' }); await a.esperar((x) => x.tipo === 'sala');
  b.manda({ tipo: 'entrar', nome: 'B' }); await b.esperar((x) => x.tipo === 'sala');
  const vista = { v: 1, variante: 'emboscada', rodada: 1, lado: 'party', acabou: false, extras: null,
    combatentes: [{ id: 'pc-mago', name: 'Ilvan', side: 'party', pos: { x: 1, y: 2 }, hp: 8, maxHp: 8, blob: 'x'.repeat(5000) }] };
  a.manda({ tipo: 'partida', vista });
  assert.match((await a.esperar((x) => x.tipo === 'erro')).erro, /não está em andamento/, 'no lobby ninguém publica partida');
  for (const h of ['pc-guerreiro', 'pc-ladino', 'pc-clerigo']) a.manda({ tipo: 'pegar', heroi: h });
  for (const h of ['pc-mago']) b.manda({ tipo: 'pegar', heroi: h });
  await a.esperar((x) => x.tipo === 'sala' && Object.keys(x.visao.herois).length === 4); await vez(150);   // as quatro escolhas chegam antes de alguém ficar pronto
  a.manda({ tipo: 'pronto', valor: true }); b.manda({ tipo: 'pronto', valor: true });
  await a.esperar((x) => x.tipo === 'sala' && x.visao.jogadores.every((j) => j.pronto));
  a.manda({ tipo: 'iniciar' });
  await b.esperar((x) => x.tipo === 'sala' && x.visao.fase === 'iniciada');
  b.recebidas.length = 0; a.recebidas.length = 0;
  b.manda({ tipo: 'partida', vista: { ...vista, combatentes: [{ ...vista.combatentes[0], blob: 'x' }] } });
  assert.match((await b.esperar((x) => x.tipo === 'erro')).erro, /anfitrião/, 'quem não é o anfitrião não publica');
  a.manda({ tipo: 'partida', vista });
  const chegou = await b.esperar((x) => x.tipo === 'partida');
  assert.equal(chegou.vista.combatentes[0].id, 'pc-mago'); assert.equal(chegou.vista.combatentes[0].blob.length, 5000, 'vista maior que 2 KB passa');
  assert.equal(a.recebidas.some((x) => x.tipo === 'partida'), false, 'o anfitrião não recebe a própria vista');
  b.fechar();
  await a.esperar((x) => x.tipo === 'sala' && x.visao.jogadores.find((j) => j.id === 'p2')?.conectado === false);
  b = await new Cliente(codigo, idB).abrir(); abertos.push(b);
  b.manda({ tipo: 'entrar', nome: 'B' });
  const voltou = await b.esperar((x) => x.tipo === 'partida');
  assert.equal(voltou.vista.combatentes[0].id, 'pc-mago', 'quem volta recebe a última vista sem esperar a próxima');
});

await teste('F4.3: o passo vai ao anfitrião (só se o herói é de quem mandou); a narrativa vai aos outros; a resposta chega de quem a deu', async () => {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf'); const b = await cliente(codigo, 'beto');
  a.manda({ tipo: 'criar', nome: 'N' }); await a.esperar((x) => x.tipo === 'sala');
  b.manda({ tipo: 'entrar', nome: 'B' }); await b.esperar((x) => x.tipo === 'sala');
  for (const h of ['pc-guerreiro', 'pc-ladino', 'pc-clerigo']) a.manda({ tipo: 'pegar', heroi: h });
  for (const h of ['pc-mago']) b.manda({ tipo: 'pegar', heroi: h });
  await a.esperar((x) => x.tipo === 'sala' && Object.keys(x.visao.herois).length === 4); await vez(150);   // as quatro escolhas chegam antes de alguém ficar pronto
  a.manda({ tipo: 'pronto', valor: true }); b.manda({ tipo: 'pronto', valor: true });
  await a.esperar((x) => x.tipo === 'sala' && x.visao.jogadores.every((j) => j.pronto));
  a.manda({ tipo: 'iniciar' });
  await b.esperar((x) => x.tipo === 'sala' && x.visao.fase === 'iniciada');
  a.recebidas.length = 0; b.recebidas.length = 0;
  b.manda({ tipo: 'agir', acao: 'mover', heroi: 'pc-mago', x: 5, y: 6 });
  const passo = await a.esperar((x) => x.tipo === 'agir');
  assert.deepEqual([passo.de, passo.heroi, passo.x, passo.y], ['p2', 'pc-mago', 5, 6]);
  b.manda({ tipo: 'agir', acao: 'mover', heroi: 'pc-guerreiro', x: 5, y: 6 });
  assert.match((await b.esperar((x) => x.tipo === 'erro')).erro, /não é seu/);
  b.recebidas.length = 0;
  const abrir = { tipo: 'abrir', id: 7, pedido: { formato: 'tela', pular: false, lista: false, paginas: [{ titulo: null, texto: ['Era uma vez'], teste: null, retrato: null, temConteudo: false }], escolhas: [{ indice: 0, rotulo: 'Seguir', detalhe: null, motivo: null, primaria: true }] } };
  a.manda({ tipo: 'narrativa', msg: abrir });
  const viu = await b.esperar((x) => x.tipo === 'narrativa');
  assert.equal(viu.msg.id, 7); assert.equal(viu.msg.pedido.paginas[0].texto[0], 'Era uma vez');
  assert.equal(a.recebidas.some((x) => x.tipo === 'narrativa'), false, 'o anfitrião não recebe a própria narrativa');
  b.manda({ tipo: 'narrativa', msg: abrir });
  assert.match((await b.esperar((x) => x.tipo === 'erro')).erro, /anfitrião/, 'quem não é o anfitrião não conta a narrativa');
  a.recebidas.length = 0;
  b.manda({ tipo: 'resposta', id: 7, indice: 0 });
  const resp = await a.esperar((x) => x.tipo === 'resposta');
  assert.deepEqual([resp.id, resp.indice, resp.continuar, resp.de], [7, 0, false, 'p2'], 'o anfitrião recebe a resposta e de quem veio');
});

/** Sala iniciada com o anfitrião (a) e o Beto (b); o Beto tem o mago. Devolve os dois. */
async function partidaDeDois() {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf'); const b = await cliente(codigo, 'beto');
  a.manda({ tipo: 'criar', nome: 'N' }); await a.esperar((x) => x.tipo === 'sala');
  b.manda({ tipo: 'entrar', nome: 'B' }); await b.esperar((x) => x.tipo === 'sala');
  for (const h of ['pc-guerreiro', 'pc-ladino', 'pc-clerigo']) a.manda({ tipo: 'pegar', heroi: h });
  b.manda({ tipo: 'pegar', heroi: 'pc-mago' });
  await a.esperar((x) => x.tipo === 'sala' && Object.keys(x.visao.herois).length === 4); await vez(150);
  a.manda({ tipo: 'pronto', valor: true }); b.manda({ tipo: 'pronto', valor: true });
  await a.esperar((x) => x.tipo === 'sala' && x.visao.jogadores.every((j) => j.pronto));
  a.manda({ tipo: 'iniciar' });
  await b.esperar((x) => x.tipo === 'sala' && x.visao.fase === 'iniciada');
  a.recebidas.length = 0; b.recebidas.length = 0;
  return { codigo, a, b };
}

await teste('paridade: o convidado pede o menu do botão direito, o alfinete, o descanso longo, o nível e a ficha; o anfitrião os recebe com a identidade certa', async () => {
  const { a, b } = await partidaDeDois();
  b.manda({ tipo: 'agir', acao: 'contexto', heroi: 'pc-mago', x: 4, y: 7 });
  const ctx = await a.esperar((x) => x.tipo === 'agir' && x.acao === 'contexto');
  assert.deepEqual([ctx.de, ctx.heroi, ctx.x, ctx.y], ['p2', 'pc-mago', 4, 7]);
  b.manda({ tipo: 'agir', acao: 'alfinete', x: 2, y: 3 });
  const al = await a.esperar((x) => x.tipo === 'agir' && x.acao === 'alfinete');
  assert.deepEqual([al.de, al.x, al.y], ['p2', 2, 3]);
  b.manda({ tipo: 'agir', acao: 'descanso', descanso: 'longo' });
  assert.equal((await a.esperar((x) => x.tipo === 'agir' && x.acao === 'descanso')).descanso, 'longo');
  b.manda({ tipo: 'agir', acao: 'nivel', heroi: 'pc-mago', id: 1, selecoes: { aprende: ['luz'] } });
  assert.deepEqual((await a.esperar((x) => x.tipo === 'agir' && x.acao === 'nivel')).selecoes, { aprende: ['luz'] });
  b.manda({ tipo: 'agir', acao: 'preparar', heroi: 'pc-mago', lista: ['sono'] });
  assert.deepEqual((await a.esperar((x) => x.tipo === 'agir' && x.acao === 'preparar')).lista, ['sono']);
  b.manda({ tipo: 'agir', acao: 'preparar', heroi: 'pc-guerreiro', lista: [] });
  assert.match((await b.esperar((x) => x.tipo === 'erro')).erro, /não é seu/, 'só o herói do próprio jogador');
  b.recebidas.length = 0;
  // O menu volta pela porta da narrativa (maior que 2 KB) e chega a todos; o anfitrião não recebe a própria.
  const opcoes = Array.from({ length: 12 }, (_, i) => ({ rotulo: `Opção ${i}`, i, detalhe: 'x'.repeat(300) }));
  a.manda({ tipo: 'narrativa', msg: { tipo: 'contexto-abrir', id: 1, para: 'p2', heroi: 'pc-mago', titulo: 'Elmar', opcoes } });
  const menu = await b.esperar((x) => x.tipo === 'narrativa' && x.msg.tipo === 'contexto-abrir');
  assert.equal(menu.msg.opcoes.length, 12); assert.equal(menu.msg.para, 'p2');
  b.manda({ tipo: 'narrativa', msg: { tipo: 'contexto-abrir', id: 2, para: 'p1', opcoes: [] } });
  assert.match((await b.esperar((x) => x.tipo === 'erro')).erro, /anfitrião/);
});

await teste('vista em diferenças: a completa é guardada para quem entra; a diferença passa a quem já está', async () => {
  const { a, b } = await partidaDeDois();
  const comb = (n, hp) => ({ id: `c${n}`, name: `C${n}`, side: 'party', pos: { x: n, y: 1 }, hp, maxHp: 10 });
  a.manda({ tipo: 'partida', vista: { v: 1, variante: 'emboscada', rodada: 1, lado: 'party', acabou: false, seq: 1, extras: null, combatentes: [comb(1, 10), comb(2, 10)] } });
  await b.esperar((x) => x.tipo === 'partida' && x.vista.seq === 1);
  await vez(60);
  a.manda({ tipo: 'partida', vista: { v: 1, delta: true, base: 1, seq: 2, variante: 'emboscada', rodada: 1, lado: 'party', acabou: false, ordem: ['c1', 'c2'], mudaram: [comb(2, 3)], removidos: [], extras: null } });
  const d = await b.esperar((x) => x.tipo === 'partida' && x.vista.delta === true);
  assert.equal(d.vista.mudaram[0].hp, 3);
  // Quem entra agora (a sala tem lugar) recebe a última COMPLETA, não a diferença.
  const c = await cliente(a.codigo, 'caio');
  c.manda({ tipo: 'entrar', nome: 'Caio' });
  const completa = await c.esperar((x) => x.tipo === 'partida');
  assert.equal(completa.vista.seq, 1); assert.ok(!completa.vista.delta);
  await vez(80);
  a.manda({ tipo: 'partida', vista: { v: 1, delta: true, base: 'x', seq: 3, variante: 'e', ordem: [], mudaram: [], removidos: [] } });
  assert.match((await a.esperar((x) => x.tipo === 'erro')).erro, /inválida/);
});

await teste('entrar com a partida em andamento: fica com o herói que sobrava do anfitrião (ou só assiste)', async () => {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf');
  a.manda({ tipo: 'criar', nome: 'N', maxJogadores: 3 }); await a.esperar((x) => x.tipo === 'sala');
  for (const h of ['pc-guerreiro', 'pc-ladino', 'pc-clerigo', 'pc-mago']) a.manda({ tipo: 'pegar', heroi: h });
  await a.esperar((x) => x.tipo === 'sala' && Object.keys(x.visao.herois).length === 4); await vez(150);
  a.manda({ tipo: 'pronto', valor: true });
  await a.esperar((x) => x.tipo === 'sala' && x.visao.jogadores.every((j) => j.pronto));
  a.manda({ tipo: 'iniciar' });
  await a.esperar((x) => x.tipo === 'sala' && x.visao.fase === 'iniciada');
  const b = await cliente(codigo, 'beto');
  b.manda({ tipo: 'entrar', nome: 'Beto' });
  const v = await b.esperar((x) => x.tipo === 'sala' && x.visao.fase === 'iniciada');
  assert.equal(v.visao.voce, 'p2');
  assert.equal(v.visao.herois['pc-mago'], 'p2', 'o último herói do anfitrião passou ao recém-chegado');
  assert.equal(v.visao.herois['pc-guerreiro'], 'p1');
});

await teste('a rota de código novo: o servidor sorteia o código (o limite por IP está nos testes de regra)', async () => {
  const pedir = () => fetch(`${HTTP}/api/nova-sala`, { method: 'POST' });
  const r = await pedir();
  if (r.status === 404) return;      // servidor antigo, sem a rota
  assert.equal(r.status, 200);
  assert.match((await r.json()).codigo, /^[A-HJKMNP-Z2-9]{6}$/);
  assert.equal((await fetch(`${HTTP}/api/nova-sala`)).status, 405, 'só POST');
  // O limite por IP e por hora (6) está nos testes de regra; aqui, em desenvolvimento local, o IP é o do próprio computador e não é limitado.
  for (let i = 0; i < 8; i += 1) assert.equal((await pedir()).status, 200, 'em desenvolvimento local não há limite');
});

await teste('B1: a taverna pública — o diretório indica a instância, os jogadores se encontram, sentam e o dono da mesa manda o convite', async () => {
  const r = await fetch(`${HTTP}/api/taverna`);
  if (r.status === 404) return;      // servidor antigo
  assert.equal(r.status, 200);
  const { codigo, nova } = await r.json();
  assert.match(codigo, /^[A-HJKMNP-Z2-9]{6}$/);
  // (Se uma execução anterior deixou a instância aberta, o diretório a indica de novo: então se entra em vez de criar.)
  const a = await cliente(codigo, 'ana'); const b = await cliente(codigo, 'beto');
  a.manda(nova ? { tipo: 'criar', nome: 'Ana', publica: true } : { tipo: 'entrar', nome: 'Ana' });
  const va = await a.esperar((x) => x.tipo === 'sala');
  assert.equal(va.visao.publica, true); assert.equal(va.visao.maxJogadores, 16); assert.equal(va.visao.mesas.length, 4);
  await vez(200);
  // Quem aperta o botão logo depois cai na MESMA instância.
  const r2 = await (await fetch(`${HTTP}/api/taverna`)).json();
  assert.equal(r2.codigo, codigo); assert.equal(r2.nova, false);
  b.manda({ tipo: 'entrar', nome: 'Beto' });
  const vb = await b.esperar((x) => x.tipo === 'sala' && x.visao.jogadores.some((j) => j.nome === 'Beto'));
  b.manda({ tipo: 'sentar', mesa: 0 }); await vez(80); a.manda({ tipo: 'sentar', mesa: 0 });
  const mesa = await a.esperar((x) => x.tipo === 'sala' && x.visao.mesas[0].lugares.length === 2);
  assert.deepEqual(mesa.visao.mesas[0].lugares, [vb.visao.voce, va.visao.voce], 'o Beto sentou primeiro: é o dono');
  a.manda({ tipo: 'abrir-mesa', codigo: 'ABC234' });
  assert.match((await a.esperar((x) => x.tipo === 'erro')).erro, /dono da mesa/);
  a.recebidas.length = 0;
  b.manda({ tipo: 'abrir-mesa', codigo: 'ABC234' });
  const conv = await a.esperar((x) => x.tipo === 'convite');
  assert.deepEqual([conv.codigo, conv.de], ['ABC234', 'Beto']);
  assert.equal(b.recebidas.some((x) => x.tipo === 'convite'), false, 'o dono não convida a si mesmo');
  // Na taverna pública não há heróis nem partida.
  a.manda({ tipo: 'pegar', heroi: 'pc-mago' });
  assert.match((await a.esperar((x) => x.tipo === 'erro' && /taverna/.test(x.erro))).erro, /taverna pública/);
  // Quem fecha a aba some da taverna.
  b.fechar();
  const saiu = await a.esperar((x) => x.tipo === 'sala' && !x.visao.jogadores.some((j) => j.nome === 'Beto'));
  assert.ok(saiu.visao.jogadores.some((j) => j.nome === 'Ana'));
});

await teste('B1: só o servidor abre uma taverna pública, e uma sala comum não vira pública', async () => {
  const comum = codigoNovo();
  const a = await cliente(comum, 'ana');
  a.manda({ tipo: 'criar', nome: 'Ana', publica: true });
  assert.match((await a.esperar((x) => x.tipo === 'erro')).erro, /só o servidor/);
  const r = await fetch(`${HTTP}/api/taverna`);
  if (r.status === 404) return;
  const { codigo } = await r.json();
  const b = await cliente(codigo, 'beto');
  b.manda({ tipo: 'criar', nome: 'Beto' });
  assert.match((await b.esperar((x) => x.tipo === 'erro')).erro, /taverna pública|já existe/);
});

await teste('F4.4: o aviso do anfitrião chega só ao jogador certo, e a corda aparece na visão', async () => {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf'); const b = await cliente(codigo, 'beto');
  a.manda({ tipo: 'criar', nome: 'N' }); const c1 = await a.esperar((x) => x.tipo === 'sala');
  assert.equal(c1.visao.corda, 'livre');
  b.manda({ tipo: 'entrar', nome: 'B' }); await b.esperar((x) => x.tipo === 'sala');
  a.manda({ tipo: 'corda', valor: 'unido' });
  assert.equal((await b.esperar((x) => x.tipo === 'sala' && x.visao.corda === 'unido')).visao.corda, 'unido');
  for (const h of ['pc-guerreiro', 'pc-ladino', 'pc-clerigo']) a.manda({ tipo: 'pegar', heroi: h });
  for (const h of ['pc-mago']) b.manda({ tipo: 'pegar', heroi: h });
  await a.esperar((x) => x.tipo === 'sala' && Object.keys(x.visao.herois).length === 4); await vez(150);   // as quatro escolhas chegam antes de alguém ficar pronto
  a.manda({ tipo: 'pronto', valor: true }); b.manda({ tipo: 'pronto', valor: true });
  await a.esperar((x) => x.tipo === 'sala' && x.visao.jogadores.every((j) => j.pronto));
  a.manda({ tipo: 'iniciar' });
  await b.esperar((x) => x.tipo === 'sala' && x.visao.fase === 'iniciada');
  a.recebidas.length = 0; b.recebidas.length = 0;
  a.manda({ tipo: 'aviso', para: 'p2', texto: 'o grupo se separaria demais' });
  assert.equal((await b.esperar((x) => x.tipo === 'aviso')).texto, 'o grupo se separaria demais');
  assert.equal(a.recebidas.some((x) => x.tipo === 'aviso'), false, 'o anfitrião não recebe o próprio aviso');
  b.manda({ tipo: 'aviso', para: 'p1', texto: 'x' });
  assert.match((await b.esperar((x) => x.tipo === 'erro')).erro, /anfitrião/);
});

await teste('F6: o anfitrião cai, e depois da graça o servidor passa o posto a quem está conectado, com o último save', async () => {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf'); const b = await cliente(codigo, 'beto');
  a.manda({ tipo: 'criar', nome: 'N' }); await a.esperar((x) => x.tipo === 'sala');
  b.manda({ tipo: 'entrar', nome: 'B' }); await b.esperar((x) => x.tipo === 'sala');
  for (const h of ['pc-guerreiro', 'pc-ladino', 'pc-clerigo']) a.manda({ tipo: 'pegar', heroi: h });
  for (const h of ['pc-mago']) b.manda({ tipo: 'pegar', heroi: h });
  await a.esperar((x) => x.tipo === 'sala' && Object.keys(x.visao.herois).length === 4); await vez(150);   // as quatro escolhas chegam antes de alguém ficar pronto
  a.manda({ tipo: 'pronto', valor: true }); b.manda({ tipo: 'pronto', valor: true });
  await a.esperar((x) => x.tipo === 'sala' && x.visao.jogadores.every((j) => j.pronto));
  a.manda({ tipo: 'iniciar' });
  await b.esperar((x) => x.tipo === 'sala' && x.visao.fase === 'iniciada');
  const save = { versao: 1, herois: [{ id: 'pc-mago', name: 'Ilvan' }], config: { modo: 'campanha' }, campanha: { marca: 'cena-3' } };
  b.manda({ tipo: 'salvar', save });
  assert.match((await b.esperar((x) => x.tipo === 'erro')).erro, /anfitrião/, 'quem não é o anfitrião não guarda o jogo');
  a.manda({ tipo: 'salvar', save });
  await vez(500);
  b.recebidas.length = 0;
  a.fechar();
  const t0 = Date.now();
  const caiu = await b.esperar((x) => x.tipo === 'sala' && x.visao.jogadores.find((j) => j.id === 'p1')?.conectado === false);
  assert.equal(caiu.visao.anfitriao, 'p1', 'dentro da graça o posto continua dele');
  const novo = await b.esperar((x) => x.tipo === 'sala' && x.visao.anfitriao === 'p2', 'o posto passar', 40_000);
  assert.equal(novo.visao.voce, 'p2');
  const passou = Date.now() - t0;
  assert.ok(passou >= 15_000 && passou < 35_000, `o posto passou depois da graça (${passou} ms)`);
  const assumir = await b.esperar((x) => x.tipo === 'assumir', 'o save de quem assume');
  assert.deepEqual(JSON.parse(assumir.save), save, 'o save que o antigo anfitrião mandou (em texto, para quem assume validar e migrar)');
});

await teste('outro navegador (id diferente) não age como o jogador de outro', async () => {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf'); const intruso = await cliente(codigo, 'intruso');
  a.manda({ tipo: 'criar', nome: 'N' }); await a.esperar((x) => x.tipo === 'sala');
  intruso.manda({ tipo: 'iniciar' });
  assert.match((await intruso.esperar((x) => x.tipo === 'erro')).erro, /não está nesta sala/);
  intruso.manda({ tipo: 'fechar' });
  assert.match((await intruso.esperar((x) => x.tipo === 'erro' && /sala|anfitri/.test(x.erro))).erro, /./);
  a.manda({ tipo: 'pronto', valor: false });
  assert.equal((await a.esperar((x) => x.tipo === 'sala')).visao.fase, 'lobby', 'a sala segue de pé');
});

await teste('mensagem ruim: lixo, JSON sem tipo, grande demais e sala inexistente são recusados sem derrubar nada', async () => {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf');
  a.manda({ tipo: 'entrar', nome: 'A' }); assert.match((await a.esperar((x) => x.tipo === 'erro')).erro, /não existe/);   // identifica a conexão
  a.recebidas.length = 0; a.manda('isso não é json'); assert.match((await a.esperar((x) => x.tipo === 'erro')).erro, /inválida/);
  a.recebidas.length = 0; a.manda({ sem: 'tipo' }); assert.match((await a.esperar((x) => x.tipo === 'erro')).erro, /inválida/);
  a.recebidas.length = 0; a.manda(JSON.stringify({ tipo: 'entrar', nome: 'x'.repeat(3000) })); assert.match((await a.esperar((x) => x.tipo === 'erro')).erro, /grande/);
  a.recebidas.length = 0; a.manda({ tipo: 'criar', nome: 'A' });
  assert.equal((await a.esperar((x) => x.tipo === 'sala')).visao.voce, 'p1', 'e a mesma conexão ainda cria a sala depois');
});

await teste('criar uma sala que já existe é recusado', async () => {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf'); const b = await cliente(codigo, 'beto');
  a.manda({ tipo: 'criar', nome: 'N' }); await a.esperar((x) => x.tipo === 'sala');
  b.manda({ tipo: 'criar', nome: 'B' });
  assert.match((await b.esperar((x) => x.tipo === 'erro')).erro, /já existe/);
});

await teste('remover: o removido é desconectado, e não volta com o mesmo id', async () => {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf');
  const idB = idNovo('beto');
  const b = await new Cliente(codigo, idB).abrir(); abertos.push(b);
  a.manda({ tipo: 'criar', nome: 'N' }); await a.esperar((x) => x.tipo === 'sala');
  b.manda({ tipo: 'entrar', nome: 'B' }); await b.esperar((x) => x.tipo === 'sala');
  a.manda({ tipo: 'remover', jogador: 'p2' });
  await b.esperar((x) => x.tipo === 'fechada');
  await vez(200);
  assert.equal(b.fechou, 4000);
  const b2 = await new Cliente(codigo, idB).abrir(); abertos.push(b2);
  b2.manda({ tipo: 'entrar', nome: 'B' });
  assert.match((await b2.esperar((x) => x.tipo === 'erro')).erro, /removido/);
});

await teste('fechar a sala derruba todo mundo, e a sala fechada não abre mais', async () => {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf'); const b = await cliente(codigo, 'beto');
  a.manda({ tipo: 'criar', nome: 'N' }); await a.esperar((x) => x.tipo === 'sala');
  b.manda({ tipo: 'entrar', nome: 'B' }); await b.esperar((x) => x.tipo === 'sala');
  a.manda({ tipo: 'fechar' });
  await b.esperar((x) => x.tipo === 'fechada');
  await vez(250);
  assert.equal(b.fechou, 4000); assert.equal(a.fechou, 4000);
  // Reabrir uma sala fechada: o servidor aceita a conexão só para DIZER que fechou (um 410 no upgrade
  // chegaria ao navegador como uma queda qualquer, e o cliente ficaria reconectando).
  const tardio = await new Cliente(codigo, idNovo('tardio')).abrir(); abertos.push(tardio);
  const m = await tardio.esperar((x) => x.tipo === 'fechada');
  assert.match(m.motivo, /encerrada/);
  await vez(250);
  assert.equal(tardio.fechou, 4000);
});

await teste('o Worker recusa: código inválido (inclusive % malformado), sem WebSocket, outra rota', async () => {
  assert.equal((await fetch(`${HTTP}/api/sala/ABC`)).status, 400);
  assert.equal((await fetch(`${HTTP}/api/sala/%E0%A4%A`)).status, 400);
  assert.equal((await fetch(`${HTTP}/api/sala/ABC234`)).status, 426);
  assert.equal((await fetch(`${HTTP}/api/outra-coisa`)).status, 404);
});

await teste('quem não se identifica na primeira mensagem não recebe nada, e id do protótipo não vale', async () => {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf');
  a.manda({ tipo: 'criar', nome: 'N' }); await a.esperar((x) => x.tipo === 'sala');
  const mudo = await new Cliente(codigo, 'x').abrir(); abertos.push(mudo);
  mudo.identificado = true;                                      // não manda `eu`
  mudo.manda({ tipo: 'entrar', nome: 'Mudo' });
  assert.match((await mudo.esperar((x) => x.tipo === 'erro')).erro, /identifique-se/);
  a.manda({ tipo: 'pegar', heroi: 'pc-mago' });
  await a.esperar((x) => x.tipo === 'sala' && x.visao.herois['pc-mago']);
  await vez(200);
  assert.equal(mudo.recebidas.some((m) => m.tipo === 'sala'), false, 'a conexão sem identidade não recebe a visão');
  const proto = await new Cliente(codigo, 'constructor').abrir(); abertos.push(proto);
  proto.manda({ tipo: 'entrar', nome: 'Proto' });
  assert.match((await proto.esperar((x) => x.tipo === 'erro')).erro, /identifique-se/);
});

await teste('duas abas do mesmo jogador: fechar uma (sair) não tira o jogador da outra', async () => {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf');
  const idB = idNovo('beto');
  const b1 = await new Cliente(codigo, idB).abrir(); abertos.push(b1);
  const b2 = await new Cliente(codigo, idB).abrir(); abertos.push(b2);
  a.manda({ tipo: 'criar', nome: 'N' }); await a.esperar((x) => x.tipo === 'sala');
  b1.manda({ tipo: 'entrar', nome: 'B' }); await b1.esperar((x) => x.tipo === 'sala' && x.visao.voce === 'p2');
  b2.manda({ tipo: 'entrar', nome: 'B' }); await b2.esperar((x) => x.tipo === 'sala' && x.visao.voce === 'p2');
  b1.manda({ tipo: 'pegar', heroi: 'pc-mago' }); await a.esperar((x) => x.tipo === 'sala' && x.visao.herois['pc-mago']);
  b2.manda({ tipo: 'sair' });
  await vez(300);
  b1.recebidas.length = 0; a.recebidas.length = 0;
  a.manda({ tipo: 'pronto', valor: false });
  const v = await a.esperar((x) => x.tipo === 'sala');
  assert.equal(v.visao.jogadores.length, 2, 'o Beto continua na sala');
  assert.equal(v.visao.herois['pc-mago'], 'p2');
  assert.equal(v.visao.jogadores.find((j) => j.id === 'p2').conectado, true);
});

await teste('ping responde pong, e mandar de fora do limite de tamanho derruba a conexão', async () => {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf');
  a.manda({ tipo: 'criar', nome: 'N' }); await a.esperar((x) => x.tipo === 'sala');
  a.manda({ tipo: 'ping' });
  assert.equal((await a.esperar((x) => x.tipo === 'pong')).tipo, 'pong');
  a.manda('x'.repeat(10_000));
  await vez(400);
  assert.equal(a.fechou, 1009);
});

await teste('sair no lobby: o jogador some, os heróis voltam, e a sala continua para os outros', async () => {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf'); const b = await cliente(codigo, 'beto');
  a.manda({ tipo: 'criar', nome: 'N' }); await a.esperar((x) => x.tipo === 'sala');
  b.manda({ tipo: 'entrar', nome: 'B' }); await b.esperar((x) => x.tipo === 'sala');
  b.manda({ tipo: 'pegar', heroi: 'pc-mago' }); await a.esperar((x) => x.tipo === 'sala' && x.visao.herois['pc-mago']);
  a.recebidas.length = 0;
  b.manda({ tipo: 'sair' });
  const v = await a.esperar((x) => x.tipo === 'sala' && x.visao.jogadores.length === 1);
  assert.deepEqual(v.visao.herois, {});
  await vez(300);
  assert.ok(b.fechou === 1000 || b.fechou === 1005 || b.fechou === 1001 || b.fechou !== null, 'a conexão de quem saiu foi fechada');
});


await teste('taverna: o avatar de cada um aparece nos dois lados, com marcadores diferentes, e andar sincroniza', async () => {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf'); const b = await cliente(codigo, 'beto');
  a.manda({ tipo: 'criar', nome: 'Ana', persona: 'pc-mago' }); await a.esperar((x) => x.tipo === 'sala');
  b.manda({ tipo: 'entrar', nome: 'Beto', persona: 'pc-paladino' });
  const v = await b.esperar((x) => x.tipo === 'sala' && x.visao.avatares.length === 2);
  const [ana, beto] = v.visao.avatares;
  assert.equal(ana.figura, 'pc-mago'); assert.equal(beto.figura, 'pc-paladino');
  assert.notDeepEqual(ana.marcador, beto.marcador);
  assert.notEqual(`${ana.x},${ana.y}`, `${beto.x},${beto.y}`);
  a.recebidas.length = 0; b.recebidas.length = 0;
  a.manda({ tipo: 'mover', x: 10, y: 10 });
  const andou = await b.esperar((x) => x.tipo === 'sala' && x.visao.avatares.find((q) => q.id === 'p1')?.x === 10);
  assert.deepEqual(andou.visao.avatares.find((q) => q.id === 'p1'), { ...ana, x: 10, y: 10 });
  await vez(200);
  a.manda({ tipo: 'mover', x: 0, y: 99 });
  assert.match((await a.esperar((x) => x.tipo === 'erro')).erro, /inexistente/);
  b.recebidas.length = 0; b.manda({ tipo: 'mover', x: 2, y: 2 });
  assert.match((await b.esperar((x) => x.tipo === 'erro')).erro, /chegar/, 'o balcão não se pisa');
  a.recebidas.length = 0; a.manda({ tipo: 'mover', x: 9, y: 9 });
  assert.match((await a.esperar((x) => x.tipo === 'erro')).erro, /devagar/, 'o servidor segura quem ainda está andando');
  // T-14: a frase pronta chega aos dois, e texto que não é frase é recusado.
  b.recebidas.length = 0; a.recebidas.length = 0;
  a.manda({ tipo: 'emote', id: 'brinde' });
  const fala = await b.esperar((x) => x.tipo === 'sala' && x.visao.avatares.find((q) => q.id === 'p1')?.emote === 'brinde');
  assert.equal(fala.visao.avatares.find((q) => q.id === 'p1').emoteN, 1);
  b.recebidas.length = 0; b.manda({ tipo: 'emote', id: 'qualquer coisa que eu escrevi' });
  assert.match((await b.esperar((x) => x.tipo === 'erro')).erro, /não existe/);
});

await teste('taverna: trocar de persona muda a figura para todos; herói que não tem arte é recusado', async () => {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf'); const b = await cliente(codigo, 'beto');
  a.manda({ tipo: 'criar', nome: 'Ana' }); await a.esperar((x) => x.tipo === 'sala');
  b.manda({ tipo: 'entrar', nome: 'Beto' }); await b.esperar((x) => x.tipo === 'sala' && x.visao.avatares.length === 2);
  a.manda({ tipo: 'persona', heroi: 'pc-barbaro' });
  const v = await b.esperar((x) => x.tipo === 'sala' && x.visao.avatares.find((q) => q.id === 'p1')?.figura === 'pc-barbaro');
  assert.equal(v.visao.avatares.find((q) => q.id === 'p1').persona, 'pc-barbaro');
  a.recebidas.length = 0; a.manda({ tipo: 'persona', heroi: 'pc-druida' });
  assert.match((await a.esperar((x) => x.tipo === 'erro')).erro, /arte/);
  // pegar um herói na mesa muda a figura (T-03)
  a.manda({ tipo: 'pegar', heroi: 'pc-ladino' });
  const pegou = await b.esperar((x) => x.tipo === 'sala' && x.visao.avatares.find((q) => q.id === 'p1')?.figura === 'pc-ladino');
  assert.equal(pegou.visao.avatares.find((q) => q.id === 'p1').figura, 'pc-ladino');
});

await teste('taverna: dois "Gandalf" viram "Gandalf" e "Gandalf (2)"', async () => {
  const codigo = codigoNovo();
  const a = await cliente(codigo, 'anf'); const b = await cliente(codigo, 'beto');
  a.manda({ tipo: 'criar', nome: 'Gandalf' }); await a.esperar((x) => x.tipo === 'sala');
  b.manda({ tipo: 'entrar', nome: 'Gandalf' });
  const v = await b.esperar((x) => x.tipo === 'sala' && x.visao.avatares.length === 2);
  assert.deepEqual(v.visao.avatares.map((q) => q.nome), ['Gandalf', 'Gandalf (2)']);
});

await teste('o site em si continua sendo servido (os arquivos estáticos não passam pelo Worker)', async () => {
  const r = await fetch(`${HTTP}/`);
  assert.equal(r.status, 200);
  assert.match(await r.text(), /<title>/);
});

for (const c of abertos) c.fechar();
console.log(`\n${total - falhas}/${total} testes passaram${falhas ? `, ${falhas} FALHARAM` : ''}.`);
process.exit(falhas ? 1 : 0);
