// O TEXTO EM PT-BR DO BESTIÁRIO, pela API de lotes (metade do preço). Sem `--go` só mostra o plano e a estimativa.
//
//   node src/dev/traduzir-bestiario.mjs mm                    o plano, de graça
//   node src/dev/traduzir-bestiario.mjs mm --go --limite 20   uma amostra, para medir o preço e a qualidade
//   node src/dev/traduzir-bestiario.mjs mm --go               o resto (o que já tem texto não é pago de novo)
//   node src/dev/traduzir-bestiario.mjs mm --retomar          continua esperando o lote já mandado
//
// O modelo recebe o bloco e a lore do livro em inglês COMO FONTE e devolve, em JSON: o nome em pt-br (o oficial da
// tradução brasileira quando ele souber), uma frase de apresentação, a lore em 3 a 5 frases e a descrição de cada
// traço, ação, reação e ação lendária — tudo com as NOSSAS palavras, como regra de jogo resumida. Nunca a prosa do
// livro traduzida frase a frase: é a mesma regra do `conferir-colagem.py`, e quem quiser medir lê o resultado.
// Os NÚMEROS não passam pelo modelo: o conversor (`importar-bestiario.mjs`) os tira do dado.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { custoDe } from '../game/dialogo-servidor.js';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const LIVRO = (process.argv[2] ?? 'mm').toLowerCase();
const MODELO = 'claude-opus-5-5';
const PASSA = {
  dado: `${RAIZ}_referencias/5etools/bestiary/bestiary-${LIVRO}.json`,
  lore: `${RAIZ}_referencias/5etools/bestiary/fluff-bestiary-${LIVRO}.json`,
  pt: `${RAIZ}src/dev/bestiario/${LIVRO}-pt.json`,
  ja: `${RAIZ}src/dev/bestiario/ja-temos.json`,
  lote: `${RAIZ}.bestiario-lote-${LIVRO}.json`,
  gastos: `${RAIZ}.bestiario-gastos.json`,
};
const argumento = (nome, reserva) => { const i = process.argv.indexOf(nome); return i >= 0 ? process.argv[i + 1] : reserva; };
const lerJson = (p, reserva) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return reserva; } };
const env = Object.fromEntries(fs.readFileSync(`${RAIZ}.env`, 'utf8').split(/\r?\n/).map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2]]));

const SISTEMA = `Você escreve o texto em português do Brasil de um bestiário para um RPG tático de D&D 5e (regras do SRD 5.1).
Recebe, em inglês, o bloco de estatísticas de UMA criatura e a lore dela, e devolve JSON.

REGRAS DE ESCRITA
- NUNCA traduza frases do livro. Leia, entenda e escreva com as suas próprias palavras, mais curto. A estrutura e a
  ordem das ideias também devem ser suas. Isto é obrigatório: o texto do livro tem direitos autorais.
- "nome": o nome oficial da tradução brasileira de D&D 5e quando você o conhece com segurança (ex.: Beholder ->
  "Observador", Mind Flayer -> "Devorador de Mentes", Owlbear -> "Urso-Coruja"); se não souber, traduza de forma
  natural; nomes próprios ficam como estão.
- "blurb": UMA ou duas frases dizendo como a criatura luta e o que ela tem de perigoso, para o jogador ler no tabuleiro.
- "lore": de 3 a 5 frases sobre o que ela é, onde vive e como se comporta, com as suas palavras.
- "acNote": a origem da CA em português curto ("armadura natural", "cota de malha e escudo"), ou "" se não houver.
- "tracos", "acoes", "reacoes", "lendarias": um item por traço/ação do bloco, na mesma ordem. "en" é o nome EXATO do
  bloco em inglês, sem o que vier entre parênteses; "nome" é o nome em português; "desc" é a regra resumida em 1 a 3
  frases, com os números do bloco (CD, dano, alcance em metros: 5 pés = 1,5 m), sem repetir o texto do livro.
- Vocabulário do jogo: CA, PV, CD, ND, "teste de resistência de Destreza", "vantagem", "desvantagem", "ação bônus",
  "reação", "terreno difícil"; condições: amedrontado, enfeitiçado, cego, surdo, agarrado, contido, caído, paralisado,
  petrificado, envenenado, atordoado, inconsciente, incapacitado, invisível, exausto. Tipos de dano: cortante, perfurante,
  concussão, fogo, frio, elétrico, trovejante, ácido, veneno, necrótico, radiante, energético, psíquico.`;

const ITEM = { type: 'object', additionalProperties: false, required: ['en', 'nome', 'desc'], properties: { en: { type: 'string' }, nome: { type: 'string' }, desc: { type: 'string' } } };
const ESQUEMA = {
  type: 'object', additionalProperties: false,
  required: ['nome', 'acNote', 'blurb', 'lore', 'tracos', 'acoes', 'reacoes', 'lendarias'],
  properties: {
    nome: { type: 'string' }, acNote: { type: 'string' }, blurb: { type: 'string' }, lore: { type: 'string' },
    tracos: { type: 'array', items: ITEM }, acoes: { type: 'array', items: ITEM }, reacoes: { type: 'array', items: ITEM }, lendarias: { type: 'array', items: ITEM },
  },
};

const fonteDe = (m, lore) => {
  const { _copy, referenceSources, otherSources, hasToken, hasFluff, hasFluffImages, soundClip, dragonCastingColor, ...bloco } = m;
  const fl = lore.find((f) => f.name === m.name);
  return `BLOCO:\n${JSON.stringify(bloco)}\n\nLORE:\n${fl ? JSON.stringify(fl.entries ?? []).slice(0, 6000) : '(sem lore)'}`;
};
const pedido = (m, lore) => ({
  model: MODELO, max_tokens: 4000,
  output_config: { effort: 'low', format: { type: 'json_schema', schema: ESQUEMA } },
  system: SISTEMA,
  messages: [{ role: 'user', content: fonteDe(m, lore) }],
});

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 2, timeout: 600000 });

async function esperar(id) {
  for (;;) {
    const b = await client.messages.batches.retrieve(id);
    console.log(`${new Date().toISOString().slice(11, 19)} ${b.processing_status} ${JSON.stringify(b.request_counts)}`);
    if (b.processing_status === 'ended') return;
    await new Promise((r) => setTimeout(r, 30_000));
  }
}

async function colher({ id, nomes }) {
  const pt = lerJson(PASSA.pt, {});
  const gastos = lerJson(PASSA.gastos, { usd: 0, chamadas: 0 });
  let usd = 0; let certas = 0; const falhas = [];
  for await (const item of await client.messages.batches.results(id)) {
    const nome = nomes[Number(item.custom_id)];
    if (item.result.type !== 'succeeded') { falhas.push(`${nome}: ${item.result.type}`); continue; }
    const m = item.result.message;
    usd += custoDe(MODELO, m.usage) * 0.5;
    if (m.stop_reason !== 'end_turn') { falhas.push(`${nome}: ${m.stop_reason}`); continue; }
    try { pt[nome] = JSON.parse(m.content.filter((b) => b.type === 'text').map((b) => b.text).join('')); certas += 1; } catch { falhas.push(`${nome}: JSON inválido`); }
  }
  fs.mkdirSync(`${RAIZ}src/dev/bestiario`, { recursive: true });
  fs.writeFileSync(PASSA.pt, `${JSON.stringify(pt, null, 1)}\n`);
  gastos.usd += usd; gastos.chamadas += nomes.length;
  fs.writeFileSync(PASSA.gastos, `${JSON.stringify(gastos, null, 1)}\n`);
  fs.rmSync(PASSA.lote, { force: true });
  console.log(`${nomes.length} criaturas: ${certas} com texto, US$ ${usd.toFixed(4)} (US$ ${(usd / Math.max(1, certas)).toFixed(4)} cada)`);
  for (const f of falhas) console.log(`  falhou: ${f}`);
}

if (process.argv.includes('--retomar')) {
  const salvo = lerJson(PASSA.lote, null);
  if (!salvo) { console.log('nenhum lote em andamento'); process.exit(0); }
  await esperar(salvo.id);
  await colher(salvo);
  process.exit(0);
}

const dado = lerJson(PASSA.dado, null);
const lore = lerJson(PASSA.lore, { monsterFluff: [] }).monsterFluff ?? [];
const ja = lerJson(PASSA.ja, {});
const pt = lerJson(PASSA.pt, {});
let faltam = dado.monster.filter((m) => !m._copy && !ja[m.name] && !pt[m.name]);
const ESTIMADO = 0.03;   // por criatura, antes da medida; a amostra diz o valor de verdade
console.log(`${LIVRO.toUpperCase()}: ${faltam.length} criaturas sem texto; uns US$ ${(faltam.length * ESTIMADO).toFixed(2)} pela estimativa`);
if (!process.argv.includes('--go')) { console.log('Sem --go nada foi mandado.'); process.exit(0); }
const limite = Number(argumento('--limite', 0));
if (limite) { const passo = Math.max(1, Math.floor(faltam.length / limite)); faltam = faltam.filter((_, i) => i % passo === 0).slice(0, limite); }
const lote = await client.messages.batches.create({ requests: faltam.map((m, i) => ({ custom_id: String(i), params: pedido(m, lore) })) });
const salvo = { id: lote.id, nomes: faltam.map((m) => m.name) };
fs.writeFileSync(PASSA.lote, JSON.stringify(salvo));
console.log(`lote ${lote.id} com ${faltam.length} criaturas mandado`);
await esperar(lote.id);
await colher(salvo);
