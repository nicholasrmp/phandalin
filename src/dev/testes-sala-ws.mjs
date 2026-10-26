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
  esperar(pred, rotulo = 'mensagem') {
    const ja = this.recebidas.find(pred);
    if (ja) return Promise.resolve(ja);
    return new Promise((resolve, reject) => {
      const w = { pred, resolve };
      this.espera.push(w);
      setTimeout(() => { if (this.espera.includes(w)) { this.espera.splice(this.espera.indexOf(w), 1); reject(new Error(`esperei ${rotulo} e não veio`)); } }, 4000);
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
  for (const h of ['pc-guerreiro', 'pc-ladino']) a.manda({ tipo: 'pegar', heroi: h });
  for (const h of ['pc-mago', 'pc-clerigo']) b.manda({ tipo: 'pegar', heroi: h });
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

await teste('o site em si continua sendo servido (os arquivos estáticos não passam pelo Worker)', async () => {
  const r = await fetch(`${HTTP}/`);
  assert.equal(r.status, 200);
  assert.match(await r.text(), /<title>/);
});

for (const c of abertos) c.fechar();
console.log(`\n${total - falhas}/${total} testes passaram${falhas ? `, ${falhas} FALHARAM` : ''}.`);
process.exit(falhas ? 1 : 0);
