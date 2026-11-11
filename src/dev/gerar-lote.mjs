// GERA FALAS EM LOTE, pela API de lotes (metade do preço, resposta em até 24 h, quase sempre em menos de uma). Cada fala passa pelas mesmas
// travas do jogo (`conferir`) e vai para `public/dialogos/banco.json`. Pergunta que o banco já responde não é paga de novo. Sem `--go` só
// mostra o plano.
//
//   node src/dev/gerar-lote.mjs                      o plano, de graça
//   node src/dev/gerar-lote.mjs --go --limite 40     uma amostra, para medir o preço de verdade
//   node src/dev/gerar-lote.mjs --go                 tudo; o estado fica em `.dialogo-lote.json`
//   node src/dev/gerar-lote.mjs --retomar            continua esperando um lote já mandado
//
// AS PERGUNTAS: as de costume (`encher-banco.mjs`), mais as de cada assunto, mais o que os jogadores perguntaram de verdade e o banco não
// soube (`.dialogo-registro.jsonl`). No assunto de que o NPC sabe alguma coisa entram também as continuações, com o assunto na frente, do
// jeito que `continuarAssunto` as manda.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { FICHAS, fatosLiberados, flagDeApertado } from '../game/npc-saber.js';
import { ASSUNTOS, normal } from '../game/perguntas.js';
import { bancoVazio, buscarNoBanco, conferir, guardarNoBanco, versaoDaFicha } from '../game/dialogo-ia.js';
import { custoDe, gastosVazios, pedidoDoModelo } from '../game/dialogo-servidor.js';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const MODELO = 'claude-opus-5-5';
const PASSA = { banco: `${RAIZ}public/dialogos/banco.json`, gastos: `${RAIZ}.dialogo-gastos.json`, lote: `${RAIZ}.dialogo-lote.json`, registro: `${RAIZ}.dialogo-registro.jsonl` };
const argumento = (nome, reserva) => { const i = process.argv.indexOf(nome); return i >= 0 ? process.argv[i + 1] : reserva; };
const lerJson = (p, reserva) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return reserva; } };

const COSTUME = [
  'quem é você', 'qual é o seu nome', 'como vc se chama', 'o que você sabe', 'o que você faz aqui', 'quem manda aqui', 'quem é o seu chefe', 'o que você quer', 'o que você quer da gente',
  'tem algum trabalho para nós', 'precisa de ajuda com alguma coisa', 'quanto você paga', 'o que está acontecendo por aqui', 'quais são os boatos', 'o que é perigoso por aqui',
  'por que você faz isso', 'do que você tem medo', 'você confia em mim', 'você gosta deste lugar', 'o que você acha de nós', 'você está mentindo', 'me diga tudo o que você sabe',
  'como saio daqui', 'onde posso dormir', 'tem comida', 'o que você vende', 'como você veio parar aqui', 'tem família', 'de onde você veio', 'há quanto tempo está aqui',
  'me conta uma piada', 'qual é a capital do Brasil', 'quantos vocês são', 'tem armadilhas aqui', 'tem alguma passagem secreta', 'onde estão os presos', 'qual é a senha',
];
const DO_ASSUNTO = ['onde fica {a}', 'o que você sabe sobre {a}', 'como eu chego até {a}'];
const CONTINUACOES = ['por quê?', 'e depois?', 'como você sabe disso?'];

const TUDO_FEITO = new Proxy({}, { get: () => true, has: () => true });
function estadosDe(npc) {
  const vistos = new Map();
  for (const estado of [{}, { [flagDeApertado(npc)]: true }, { apertadoBugbears: true }, TUDO_FEITO]) {
    const liberados = fatosLiberados(FICHAS[npc], estado);
    vistos.set(liberados.join(','), liberados);
  }
  return [...vistos.values()];
}

function perguntasDe(npc, liberados, registro) {
  const ficha = FICHAS[npc];
  const sabe = new Set(ficha.fatos.filter((f) => liberados.includes(f.id)).map((f) => f.assunto));
  const lista = [...COSTUME, ...(registro[npc] ?? [])];
  for (const [id, a] of Object.entries(ASSUNTOS)) {
    if (id === 'quemEVoce') continue;
    const nome = a.chaves[0];
    if (sabe.has(id)) {
      for (const t of DO_ASSUNTO) lista.push(t.replace('{a}', nome));
      for (const c of CONTINUACOES) lista.push(`sobre ${nome}: ${c}`);
    }
    // Do que ele não sabe, nada: a fala `naoSei` escrita à mão responde de graça, e isto dobraria o lote.
  }
  return [...new Set(lista)];
}

/** As perguntas reais que o banco não soube responder: o que o jogo está pedindo. */
function perguntasDoRegistro() {
  const por = {};
  if (!fs.existsSync(PASSA.registro)) return por;
  for (const l of fs.readFileSync(PASSA.registro, 'utf8').split('\n')) {
    try {
      const e = JSON.parse(l);
      if (e.npc && e.pergunta && !e.memoria && e.origem !== 'banco' && e.origem !== 'trava') (por[e.npc] ??= []).push(e.pergunta);
    } catch { /* linha vazia */ }
  }
  return por;
}

const banco = lerJson(PASSA.banco, bancoVazio());
const env = Object.fromEntries(fs.readFileSync(`${RAIZ}.env`, 'utf8').split(/\r?\n/).map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2]]));
const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 2, timeout: 120000 });

function montarPedidos() {
  const registro = perguntasDoRegistro();
  const pedidos = [];
  for (const npc of Object.keys(FICHAS)) {
    const ficha = FICHAS[npc];
    for (const liberados of estadosDe(npc)) {
      for (const pergunta of perguntasDe(npc, liberados, registro)) {
        const q = normal(pergunta);
        const marca = [...liberados].sort().join(',');
        const versao = versaoDaFicha(ficha);
        const ja = (banco.falas[npc] ?? []).some((e) => e.q === q && e.versao === versao && (e.tipo === 'responde' ? e.fatos.every((id) => liberados.includes(id)) : e.marca === marca));
        if (!ja) pedidos.push({ npc, liberados, pergunta });
      }
    }
  }
  return pedidos;
}

async function esperar(id) {
  for (;;) {
    const b = await client.messages.batches.retrieve(id);
    console.log(`${new Date().toISOString().slice(11, 19)} ${b.processing_status} ${JSON.stringify(b.request_counts)}`);
    if (b.processing_status === 'ended') return;
    await new Promise((r) => setTimeout(r, 60_000));
  }
}

async function colher({ id, pedidos }) {
  const gastos = lerJson(PASSA.gastos, gastosVazios());
  const bancoAgora = lerJson(PASSA.banco, bancoVazio());
  let certas = 0; let usd = 0; const motivos = {}; const reprovadas = [];
  for await (const item of await client.messages.batches.results(id)) {
    const p = pedidos[Number(item.custom_id)];
    if (item.result.type !== 'succeeded') { motivos[item.result.type] = (motivos[item.result.type] ?? 0) + 1; continue; }
    const m = item.result.message;
    usd += custoDe(MODELO, m.usage) * 0.5;
    const ficha = FICHAS[p.npc];
    let r = null;
    try { r = JSON.parse(m.content.filter((b) => b.type === 'text').map((b) => b.text).join('')); } catch { /* cai abaixo */ }
    const motivo = m.stop_reason === 'refusal' ? 'recusa do modelo' : m.stop_reason === 'max_tokens' ? 'cortada' : !r ? 'JSON inválido' : conferir(ficha, p.liberados, p.pergunta, r);
    if (motivo) {
      const chave = motivo.replace(/:.*/, '');
      motivos[chave] = (motivos[chave] ?? 0) + 1;
      if (reprovadas.length < 25) reprovadas.push(`${p.npc} | ${p.pergunta} | ${motivo} | ${(r?.fala ?? '').slice(0, 100)}`);
      continue;
    }
    guardarNoBanco(bancoAgora, p.npc, ficha, p.liberados, p.pergunta, r, MODELO);
    certas += 1;
  }
  fs.writeFileSync(PASSA.banco, `${JSON.stringify(bancoAgora, null, 1)}\n`);
  gastos.usd += usd; gastos.chamadas += pedidos.length;
  fs.writeFileSync(PASSA.gastos, `${JSON.stringify(gastos, null, 1)}\n`);
  fs.rmSync(PASSA.lote, { force: true });
  console.log(`${pedidos.length} pedidos: ${certas} falas novas, US$ ${usd.toFixed(4)} (US$ ${(usd / Math.max(1, pedidos.length)).toFixed(5)} cada)`);
  console.log('reprovadas:', JSON.stringify(motivos));
  for (const l of reprovadas) console.log(`  ${l}`);
}

if (process.argv.includes('--retomar')) {
  const salvo = lerJson(PASSA.lote, null);
  if (!salvo) { console.log('nenhum lote em andamento'); process.exit(0); }
  await esperar(salvo.id);
  await colher(salvo);
  process.exit(0);
}

let pedidos = montarPedidos();
const CUSTO_MEDIO = 0.0048;   // medido: US$ 0,0053 com cache, que num lote só se escreve e quase não se lê
console.log(`${pedidos.length} perguntas sem fala no banco; uns US$ ${(pedidos.length * CUSTO_MEDIO).toFixed(2)} pela estimativa`);
if (!process.argv.includes('--go')) { console.log('Sem --go nada foi mandado.'); process.exit(0); }
const limite = Number(argumento('--limite', 0));
if (limite) { const passo = Math.max(1, Math.floor(pedidos.length / limite)); pedidos = pedidos.filter((_, i) => i % passo === 0).slice(0, limite); }
const teto = Number(env.DIALOGO_TETO_USD ?? 10);
const jaGasto = lerJson(PASSA.gastos, gastosVazios()).usd;
if (jaGasto + pedidos.length * CUSTO_MEDIO > teto) { console.error(`passaria do teto: gasto ${jaGasto.toFixed(2)}, teto ${teto}`); process.exit(1); }

// No lote os pedidos correm juntos: o cache quase só é escrito, a 125%. Sem ele sai mais barato.
const semCache = (p) => ({ ...p, system: p.system.map(({ cache_control, ...resto }) => resto) });
const lote = await client.messages.batches.create({
  requests: pedidos.map((p, i) => ({ custom_id: String(i), params: semCache(pedidoDoModelo(MODELO, FICHAS[p.npc], p.liberados, p.pergunta)) })),
});
fs.writeFileSync(PASSA.lote, JSON.stringify({ id: lote.id, pedidos }));
console.log(`lote ${lote.id} com ${pedidos.length} pedidos`);
await esperar(lote.id);
await colher({ id: lote.id, pedidos });
