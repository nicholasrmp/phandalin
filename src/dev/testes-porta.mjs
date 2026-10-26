// Testes da porta de narrativa (MULTIJOGADOR.md, A-02, Fase 1). Rode com:
//   node src/dev/testes-porta.mjs
//
// `game/porta-narrativa.js` não toca a tela; a tela local é trocada aqui por
// uma falsa que obedece ao mesmo contrato (`sinal` fecha por fora).

import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import {
  descreverNarrativa, valorDaResposta, criarPortaCompartilhada, OPCOES_DA_NARRATIVA,
} from '../game/porta-narrativa.js';
import { problemasDeJson } from '../game/save.js';

let total = 0;
let falhas = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`);
  }
}

const HEROI = { id: 'pc-guerreiro', name: 'Dara' };
const opcoes = () => ({
  formato: 'painel',
  paginas: [
    { titulo: 'A estrada', texto: ['Uma curva.', { nome: 'Sildar:', texto: 'Vamos.' }], teste: { quem: 'Dara', pericia: 'Percepção', total: 14, cd: 12, passou: true } },
    { texto: ['Segunda página.'], retrato: { cor: '#aa0000' }, conteudo: { fingeSerUmElementoDoDom: true } },
  ],
  escolhas: [
    { rotulo: 'Entrar', valor: { tipo: 'entrar', quem: HEROI }, primaria: true },
    { rotulo: 'Esperar', valor: () => 'esperou' },
    { rotulo: 'Arrombar', valor: 'arrombar', detalhe: 'Força CD 15', motivo: 'só quem tem pé-de-cabra' },
  ],
});

/** A tela local falsa: fica pendente até alguém "clicar" ou o `sinal` fechar. */
function telaFalsa() {
  const abertas = [];
  const local = (root, opts) => new Promise((resolve) => {
    const h = {
      opts, fechada: false,
      clicar: (valor) => { h.fechada = true; resolve(valor); },
      // clicar no botão de posição i: a tela devolve o `valor` que RECEBEU (a porta põe o índice ali)
      clicarEscolha: (i) => { h.fechada = true; resolve(opts.escolhas[i].valor); },
    };
    abertas.push(h);
    opts.sinal?.addEventListener('abort', () => { h.fechada = true; resolve(undefined); }, { once: true });
  });
  return { local, abertas };
}

/** O transporte falso: guarda o que foi transmitido e deixa o teste "responder". */
function transporteFalso() {
  const enviadas = [];
  const esperas = new Map();
  return {
    enviadas,
    transmitir: (m) => enviadas.push(JSON.parse(JSON.stringify(m))),   // o que viaja tem que sobreviver ao JSON
    esperarResposta: (id) => new Promise((resolve) => { esperas.set(id, [...(esperas.get(id) ?? []), resolve]); }),
    responder: (id, r) => { const fila = esperas.get(id) ?? []; fila.shift()?.(r); },
  };
}

const vez = () => new Promise((r) => setTimeout(r, 0));

/** O código sem comentários e sem o miolo das strings: sobra a estrutura, onde dá para contar chaves. */
const semRuido = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')
  .replace(/`(?:\\.|[^`\\])*`/g, '``')
  .replace(/'(?:\\.|[^'\\\n])*'/g, "''")
  .replace(/"(?:\\.|[^"\\\n])*"/g, '""');

// ---- o pedido ----------------------------------------------------------------

await teste('o pedido é JSON puro, e a ida e volta devolve o mesmo pedido', () => {
  const { pedido } = descreverNarrativa(opcoes());
  assert.deepEqual(problemasDeJson(pedido), []);
  assert.deepEqual(JSON.parse(JSON.stringify(pedido)), pedido);
});

await teste('o que não viaja fica de fora: o valor das escolhas e o conteúdo do DOM', () => {
  const { pedido } = descreverNarrativa(opcoes());
  const texto = JSON.stringify(pedido);
  assert.doesNotMatch(texto, /entrar|esperou|fingeSerUmElemento|pc-guerreiro/, 'nenhum valor nem conteúdo vaza');
  assert.equal(pedido.paginas[0].temConteudo, false);
  assert.equal(pedido.paginas[1].temConteudo, true, 'a página avisa que a tela interativa é do anfitrião');
  assert.deepEqual(pedido.escolhas.map((e) => e.indice), [0, 1, 2]);
  assert.equal(pedido.escolhas[2].motivo, 'só quem tem pé-de-cabra');
  assert.equal(pedido.escolhas[0].primaria, true);
});

await teste('o pedido guarda o texto, as falas, o teste e o retrato como a tela os recebe', () => {
  const { pedido } = descreverNarrativa(opcoes());
  assert.equal(pedido.formato, 'painel');
  assert.deepEqual(pedido.paginas[0].texto, ['Uma curva.', { nome: 'Sildar:', texto: 'Vamos.' }]);
  assert.equal(pedido.paginas[0].teste.total, 14);
  assert.deepEqual(pedido.paginas[1].retrato, { cor: '#aa0000' });
  assert.equal(pedido.paginas[0].titulo, 'A estrada');
  assert.equal(pedido.paginas[1].titulo, null);
});

await teste('os padrões batem com os da tela: formato "tela", sem pular, sem lista, sem escolhas', () => {
  const { pedido } = descreverNarrativa({ paginas: [{ texto: ['x'] }] });
  assert.deepEqual(pedido, { formato: 'tela', pular: false, lista: false, escolhas: null, paginas: [{ titulo: null, texto: ['x'], teste: null, retrato: null, temConteudo: false }] });
});

await teste('opção, campo de página ou de escolha que a descrição não conhece é DENUNCIADO', () => {
  const o = opcoes();
  o.intruso = 1; o.paginas[0].novidade = 2; o.escolhas[0].extra = 3;
  const { desconhecidos } = descreverNarrativa(o);
  assert.equal(desconhecidos.length, 3);
  assert.deepEqual(descreverNarrativa(opcoes()).desconhecidos, []);
  assert.ok(OPCOES_DA_NARRATIVA.includes('lista') && OPCOES_DA_NARRATIVA.includes('pular'));
});

// ---- a resposta ----------------------------------------------------------------

await teste('a resposta por índice devolve o valor ORIGINAL da escolha (objeto, função, texto)', () => {
  const o = opcoes();
  const a = valorDaResposta(o, { indice: 0 });
  assert.ok(a.ok); assert.equal(a.valor, o.escolhas[0].valor, 'o mesmo objeto, não uma cópia');
  const b = valorDaResposta(o, { indice: 1 });
  assert.equal(b.valor, o.escolhas[1].valor);
});

await teste('a resposta inválida é recusada: fora da faixa, não inteira, escolha cinza, vazia', () => {
  const o = opcoes();
  for (const r of [{ indice: 3 }, { indice: -1 }, { indice: 1.5 }, { indice: '0' }, { indice: 2 }, {}, null, undefined]) {
    assert.equal(valorDaResposta(o, r).ok, false, JSON.stringify(r));
  }
});

await teste('sem escolhas, qualquer resposta só continua, e o valor é "fim"', () => {
  assert.deepEqual(valorDaResposta({ paginas: [{ texto: ['x'] }] }, { continuar: true }), { ok: true, valor: 'fim' });
  assert.deepEqual(valorDaResposta({ paginas: [], escolhas: [] }, { continuar: true }), { ok: true, valor: 'fim' });
  // um lixo qualquer, ou um "virei a página" mal interpretado, não encerra a narrativa
  for (const r of [{}, null, undefined, 'lixo', { continuar: 'sim' }, { indice: 0 }]) {
    assert.equal(valorDaResposta({ paginas: [{ texto: ['x'] }] }, r).ok, false, JSON.stringify(r));
  }
});

// ---- a porta compartilhada ---------------------------------------------------------

await teste('o clique no anfitrião vence: transmite abrir e fechar, e devolve o valor', async () => {
  const { local, abertas } = telaFalsa(); const t = transporteFalso();
  const narrar = criarPortaCompartilhada({ local, ...t });
  const o = opcoes();
  const p = narrar(null, o);
  await vez();
  assert.equal(t.enviadas[0].tipo, 'abrir');
  assert.equal(t.enviadas[0].pedido.escolhas.length, 3);
  abertas[0].clicarEscolha(0);
  assert.equal(await p, o.escolhas[0].valor, 'a cena recebe o valor ORIGINAL, não o índice');
  assert.deepEqual(t.enviadas[1], { tipo: 'fechar', id: 1, indice: 0 });
});

await teste('a resposta do líder vence: a tela local é fechada por fora e o valor é o da escolha', async () => {
  const { local, abertas } = telaFalsa(); const t = transporteFalso();
  const narrar = criarPortaCompartilhada({ local, ...t });
  const o = opcoes();
  const p = narrar(null, o);
  await vez();
  t.responder(1, { indice: 0 });
  assert.equal(await p, o.escolhas[0].valor);
  assert.equal(abertas[0].fechada, true, 'o painel do anfitrião sumiu');
  assert.equal(t.enviadas.at(-1).indice, 0);
});

await teste('resposta inválida do líder é ignorada e a narrativa continua aberta', async () => {
  const { local, abertas } = telaFalsa(); const t = transporteFalso();
  const narrar = criarPortaCompartilhada({ local, ...t });
  const o = opcoes();
  let valor;
  const p = narrar(null, o).then((v) => { valor = v; });
  await vez();
  t.responder(1, { indice: 2 });      // escolha cinza
  await vez();
  t.responder(1, { indice: 99 });     // fora da faixa
  await vez();
  assert.equal(valor, undefined, 'continua esperando');
  assert.equal(abertas[0].fechada, false);
  t.responder(1, { indice: 1 });
  await p;
  assert.equal(valor, o.escolhas[1].valor);
});

await teste('sem escolhas: o "continuar" do líder fecha o painel com "fim"', async () => {
  const { local, abertas } = telaFalsa(); const t = transporteFalso();
  const narrar = criarPortaCompartilhada({ local, ...t });
  const p = narrar(null, { formato: 'painel', paginas: [{ texto: ['Só texto.'] }] });
  await vez();
  t.responder(1, { continuar: true });
  assert.equal(await p, 'fim');
  assert.equal(abertas[0].fechada, true);
  assert.equal(t.enviadas.at(-1).indice, null);
  const q = narrar(null, { paginas: [{ texto: ['Outra.'] }] });
  await vez();
  t.responder(2, 'lixo');
  await vez();
  assert.equal(abertas[1].fechada, false, 'lixo não encerra');
  abertas[1].clicar(); await q;
});

await teste('duas narrativas em sequência têm ids diferentes e não se misturam', async () => {
  const { local, abertas } = telaFalsa(); const t = transporteFalso();
  const narrar = criarPortaCompartilhada({ local, ...t });
  const p1 = narrar(null, { paginas: [{ texto: ['um'] }] });
  await vez(); abertas[0].clicar(); await p1;
  const p2 = narrar(null, { paginas: [{ texto: ['dois'] }] });
  await vez();
  t.responder(1, {});                 // resposta atrasada da PRIMEIRA: não fecha a segunda
  await vez();
  assert.equal(abertas[1].fechada, false);
  abertas[1].clicar(); await p2;
  assert.deepEqual(t.enviadas.filter((m) => m.tipo === 'abrir').map((m) => m.id), [1, 2]);
});

await teste('o que a descrição não conhece é avisado pela porta, e a narrativa abre mesmo assim', async () => {
  const { local, abertas } = telaFalsa(); const t = transporteFalso();
  let aviso = null;
  const narrar = criarPortaCompartilhada({ local, ...t, aoDesconhecido: (l) => { aviso = l; } });
  const p = narrar(null, { paginas: [{ texto: ['x'], novidade: 1 }] });
  await vez();
  assert.equal(aviso.length, 1);
  abertas[0].clicar(); await p;
});

await teste('a tela local recebe as páginas e os rótulos da cena, e o ÍNDICE no lugar do valor', async () => {
  const { local, abertas } = telaFalsa(); const t = transporteFalso();
  const narrar = criarPortaCompartilhada({ local, ...t });
  const o = opcoes();
  const p = narrar('RAIZ', o);
  await vez();
  const recebida = abertas[0].opts;
  assert.equal(recebida.paginas, o.paginas, 'mesmo objeto: a tela local não é uma réplica');
  assert.deepEqual(recebida.escolhas.map((e) => [e.rotulo, e.valor, e.motivo ?? null]),
    o.escolhas.map((e, i) => [e.rotulo, i, e.motivo ?? null]));
  assert.ok(recebida.sinal);
  abertas[0].clicarEscolha(0); await p;
});

// ---- as falhas que a revisão reproduziu -----------------------------------------------

await teste('dois botões com o MESMO valor: o índice transmitido é o do botão clicado', async () => {
  const { local, abertas } = telaFalsa(); const t = transporteFalso();
  const narrar = criarPortaCompartilhada({ local, ...t });
  const o = { paginas: [{ texto: ['x'] }], escolhas: [{ rotulo: 'Sim', valor: 'ok' }, { rotulo: 'Também sim', valor: 'ok' }] };
  const p = narrar(null, o);
  await vez();
  abertas[0].clicarEscolha(1);
  assert.equal(await p, 'ok');
  assert.equal(t.enviadas.at(-1).indice, 1);
});

await teste('transmitir que lança (conexão caiu): a narrativa abre e funciona só com a tela local', async () => {
  const { local, abertas } = telaFalsa(); const t = transporteFalso();
  const falhas = [];
  const narrar = criarPortaCompartilhada({ local, transmitir: () => { throw new Error('ws fechado'); }, esperarResposta: t.esperarResposta, aoFalhar: (e) => falhas.push(e.message) });
  const o = opcoes();
  const p = narrar(null, o);
  await vez();
  assert.equal(abertas.length, 1, 'a tela do anfitrião abriu');
  abertas[0].clicarEscolha(1);
  assert.equal(await p, o.escolhas[1].valor);
  assert.ok(falhas.includes('ws fechado'));
});

await teste('pedido que não vira JSON (referência circular): a tela local abre e a cena segue', async () => {
  const { local, abertas } = telaFalsa(); const t = transporteFalso();
  const falhas = [];
  const narrar = criarPortaCompartilhada({ local, ...t, aoFalhar: (e) => falhas.push(e.message) });
  const ciclo = { quem: 'Dara' }; ciclo.eu = ciclo;
  const p = narrar(null, { paginas: [{ texto: ['x'], teste: ciclo }] });
  await vez();
  assert.equal(abertas.length, 1);
  assert.equal(t.enviadas.length, 0, 'nada foi transmitido');
  abertas[0].clicar();
  assert.equal(await p, 'fim');
  assert.equal(falhas.length, 1);
});

await teste('esperarResposta que rejeita: o painel do anfitrião não fica órfão e a cena não quebra', async () => {
  const { local, abertas } = telaFalsa(); const t = transporteFalso();
  const falhas = [];
  const narrar = criarPortaCompartilhada({ local, transmitir: t.transmitir, esperarResposta: () => Promise.reject(new Error('caiu')), aoFalhar: (e) => falhas.push(e.message) });
  const o = opcoes();
  const p = narrar(null, o);
  await vez();
  abertas[0].clicarEscolha(0);
  assert.equal(await p, o.escolhas[0].valor, 'o anfitrião decide sozinho');
  assert.deepEqual(falhas, ['caiu']);
  assert.equal(t.enviadas.at(-1).tipo, 'fechar', 'quem olha recebe o fechar');
});

await teste('a espera remota é abortada quando a narrativa fecha (nenhum ouvinte vaza)', async () => {
  const { local, abertas } = telaFalsa();
  const sinais = [];
  const t = transporteFalso();
  const narrar = criarPortaCompartilhada({ local, transmitir: t.transmitir, esperarResposta: (id, sinal) => { sinais.push(sinal); return new Promise(() => {}); } });
  for (let k = 0; k < 3; k += 1) {
    const p = narrar(null, { paginas: [{ texto: ['x'] }] });
    await vez(); abertas[k].clicar(); await p;
  }
  assert.equal(sinais.length, 3);
  assert.ok(sinais.every((x) => x.aborted), 'todas as esperas foram canceladas');
});

await teste('local que rejeita: o erro sobe (não há tela), mas a espera remota é cancelada e o fechar sai', async () => {
  const t = transporteFalso();
  let sinal;
  const narrar = criarPortaCompartilhada({ local: () => Promise.reject(new Error('tela quebrou')), transmitir: t.transmitir, esperarResposta: (id, s) => { sinal = s; return new Promise(() => {}); } });
  await assert.rejects(() => narrar(null, { paginas: [{ texto: ['x'] }] }), /tela quebrou/);
  assert.ok(sinal.aborted);
});

// ---- ninguém contorna a porta ----------------------------------------------------------

await teste('nenhuma cena chama a tela local direto: tudo passa por `narrar`', () => {
  const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
  const achados = [];
  const ler = (dir) => {
    for (const nome of readdirSync(dir)) {
      const caminho = join(dir, nome);
      if (statSync(caminho).isDirectory()) { if (nome !== 'node_modules') ler(caminho); continue; }
      if (!/\.(js|mjs)$/.test(nome)) continue;
      if (/narrativa\.js$|testes-porta\.mjs$/.test(nome)) continue;
      if (readFileSync(caminho, 'utf8').includes('narrarLocal')) achados.push(caminho.replace(raiz, 'src'));
    }
  };
  ler(raiz);
  assert.deepEqual(achados, [], `chamam narrarLocal direto: ${achados.join(', ')}`);
});

await teste('as opções de todas as chamadas de `narrar` nas cenas estão cobertas pela descrição', () => {
  // Varre as chamadas `narrar(...{ ... })` de primeiro nível por chave conhecida: uma opção
  // nova que ninguém ensinou à porta apareceria aqui antes de aparecer numa sala.
  const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
  const arquivos = [];
  const ler = (dir) => {
    for (const nome of readdirSync(dir)) {
      const caminho = join(dir, nome);
      if (statSync(caminho).isDirectory()) { if (!['node_modules', 'dev', 'art'].includes(nome)) ler(caminho); continue; }
      if (/\.js$/.test(nome) && !/narrativa\.js$/.test(nome)) arquivos.push(caminho);
    }
  };
  ler(raiz);
  const estranhas = new Set();
  let chamadas = 0;
  for (const f of arquivos) {
    // Sem comentários e sem o miolo das strings: só a estrutura do código conta chaves.
    const src = semRuido(readFileSync(f, 'utf8'));
    for (const m of src.matchAll(/narrar\([^,()]+,\s*\{/g)) {
      chamadas += 1;
      // lê as chaves de primeiro nível do objeto de opções, contando chaves e colchetes
      let i = m.index + m[0].length; let nivel = 1; let atual = '';
      const chaves = [];
      for (; i < src.length && nivel > 0; i += 1) {
        const c = src[i];
        if ('{[('.includes(c)) nivel += 1;
        else if ('}])'.includes(c)) nivel -= 1;
        if (nivel === 1) {
          if (c === ',' || c === '}') { const k = atual.trim().match(/^(?:\.\.\.)?([A-Za-z_]\w*)/)?.[1]; if (k && !atual.trim().startsWith('...')) chaves.push(k); atual = ''; } else atual += c;
        } else if (nivel === 0) { const k = atual.trim().match(/^([A-Za-z_]\w*)/)?.[1]; if (k) chaves.push(k); }
      }
      for (const k of chaves) if (!OPCOES_DA_NARRATIVA.includes(k)) estranhas.add(`${f.split('src')[1]}: ${k}`);
    }
  }
  console.log(`      (${chamadas} chamadas literais conferidas)`);
  assert.ok(chamadas > 60, `só ${chamadas} chamadas achadas: o varredor quebrou?`);
  assert.deepEqual([...estranhas], [], 'opção que a porta não descreve');
});

console.log(`\n${total - falhas}/${total} testes passaram${falhas ? `, ${falhas} FALHARAM` : ''}.`);
process.exit(falhas ? 1 : 0);
