// O TEXTO EM PT-BR DAS MAGIAS DOS LIVROS, pela API de lotes (metade do preço). Sem `--go` só mostra o plano.
//
//   node src/dev/traduzir-magias.mjs phb                    o plano, de graça
//   node src/dev/traduzir-magias.mjs phb --go --limite 10   uma amostra, para medir o preço e a qualidade
//   node src/dev/traduzir-magias.mjs phb --go               o resto (o que já tem texto não é pago de novo)
//   node src/dev/traduzir-magias.mjs phb --retomar          continua esperando o lote já mandado
//
// O irmão de `traduzir-bestiario.mjs`. O modelo recebe a magia do livro em inglês COMO FONTE e devolve o nome oficial
// brasileiro e a regra resumida com as NOSSAS palavras — nunca a prosa do livro. Os NÚMEROS não passam pelo modelo: o
// conversor (`importar-magias.mjs`) os tira do dado. Só vão as magias que o jogo ainda não tem
// (`bestiario/magias-en.json` é o de-para do nome inglês para o nosso id).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { custoDe } from '../game/dialogo-servidor.js';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const LIVRO = (process.argv[2] ?? 'phb').toLowerCase();
const MODELO = 'claude-opus-5-5';
const PASSA = {
  dado: `${RAIZ}_referencias/5etools/spells/spells-${LIVRO}.json`,
  pt: `${RAIZ}src/dev/magias/${LIVRO}-pt.json`,
  ja: `${RAIZ}src/dev/bestiario/magias-en.json`,
  lote: `${RAIZ}.magias-lote-${LIVRO}.json`,
  gastos: `${RAIZ}.bestiario-gastos.json`,
};
const argumento = (nome, reserva) => { const i = process.argv.indexOf(nome); return i >= 0 ? process.argv[i + 1] : reserva; };
const lerJson = (p, reserva) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return reserva; } };
const env = Object.fromEntries(fs.readFileSync(`${RAIZ}.env`, 'utf8').split(/\r?\n/).map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2]]));

const SISTEMA = `Você escreve o texto em português do Brasil das magias de um RPG tático de D&D 5e (regras do SRD 5.1).
Recebe, em inglês, UMA magia do livro e devolve JSON.

REGRAS DE ESCRITA
- NUNCA traduza frases do livro. Leia, entenda e escreva com as suas próprias palavras, mais curto. A estrutura e a
  ordem das ideias também devem ser suas. Isto é obrigatório: o texto do livro tem direitos autorais.
- "nome": o nome oficial da tradução brasileira de D&D 5e quando você o conhece com segurança (ex.: Fireball ->
  "Bola de Fogo", Plane Shift -> "Viagem Planar", Time Stop -> "Parar o Tempo", Polymorph -> "Metamorfose"); se não
  souber, traduza de forma natural. Nomes de magos no título (Bigby, Otiluke, Mordenkainen) ficam como estão.
- "desc": a regra resumida em 2 a 4 frases, como uma ficha de jogo: alvo e alcance, o teste e a CD ("CD de SAB"), o
  dano e o tipo, a condição, a duração e se é concentração, e no fim o que muda em círculo maior. Distâncias em metros
  (5 pés = 1,5 m; 30 pés = 9 m; 1 milha ≈ 1,5 km). Sem repetir o texto do livro.
- Vocabulário do jogo: CA, PV, CD, "teste de resistência de Destreza", "vantagem", "desvantagem", "ação bônus",
  "reação", "concentração", "terreno difícil", "círculo" (não "nível") para o nível da magia; condições: amedrontado,
  enfeitiçado, cego, surdo, agarrado, contido, caído, paralisado, petrificado, envenenado, atordoado, inconsciente,
  incapacitado, invisível. Tipos de dano: cortante, perfurante, concussão, fogo, frio, elétrico, trovejante, ácido,
  veneno, necrótico, radiante, energético, psíquico.`;

const ESQUEMA = {
  type: 'object', additionalProperties: false, required: ['nome', 'desc'],
  properties: { nome: { type: 'string' }, desc: { type: 'string' } },
};

const fonteDe = (s) => {
  const { srd, basicRules, otherSources, hasFluffImages, ...magia } = s;
  return `MAGIA:\n${JSON.stringify(magia)}`;
};
const pedido = (s) => ({
  model: MODELO, max_tokens: 1500,
  output_config: { effort: 'low', format: { type: 'json_schema', schema: ESQUEMA } },
  system: SISTEMA,
  messages: [{ role: 'user', content: fonteDe(s) }],
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
  fs.mkdirSync(`${RAIZ}src/dev/magias`, { recursive: true });
  fs.writeFileSync(PASSA.pt, `${JSON.stringify(pt, null, 1)}\n`);
  gastos.usd += usd; gastos.chamadas += nomes.length;
  fs.writeFileSync(PASSA.gastos, `${JSON.stringify(gastos, null, 1)}\n`);
  fs.rmSync(PASSA.lote, { force: true });
  console.log(`${nomes.length} magias: ${certas} com texto, US$ ${usd.toFixed(4)} (US$ ${(usd / Math.max(1, certas)).toFixed(4)} cada)`);
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
const ja = lerJson(PASSA.ja, {});
const pt = lerJson(PASSA.pt, {});
let faltam = dado.spell.filter((s) => !ja[s.name.toLowerCase()] && !pt[s.name]);
const ESTIMADO = 0.006;   // por magia, antes da medida; a amostra diz o valor de verdade
console.log(`${LIVRO.toUpperCase()}: ${faltam.length} magias sem texto; uns US$ ${(faltam.length * ESTIMADO).toFixed(2)} pela estimativa`);
if (!process.argv.includes('--go')) { console.log('Sem --go nada foi mandado.'); process.exit(0); }
const limite = Number(argumento('--limite', 0));
if (limite) { const passo = Math.max(1, Math.floor(faltam.length / limite)); faltam = faltam.filter((_, i) => i % passo === 0).slice(0, limite); }
const lote = await client.messages.batches.create({ requests: faltam.map((s, i) => ({ custom_id: String(i), params: pedido(s) })) });
const salvo = { id: lote.id, nomes: faltam.map((s) => s.name) };
fs.writeFileSync(PASSA.lote, JSON.stringify(salvo));
console.log(`lote ${lote.id} com ${faltam.length} magias mandado`);
await esperar(lote.id);
await colher(salvo);
