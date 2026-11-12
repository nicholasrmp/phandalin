// O TEXTO EM PT-BR DOS ITENS MÁGICOS DOS LIVROS, pela API de lotes (metade do preço). Sem `--go` só mostra o plano.
//
//   node src/dev/traduzir-itens.mjs dmg                    o plano, de graça
//   node src/dev/traduzir-itens.mjs dmg --go --limite 10   uma amostra, para medir o preço e a qualidade
//   node src/dev/traduzir-itens.mjs dmg --go               o resto (o que já tem texto não é pago de novo)
//   node src/dev/traduzir-itens.mjs dmg --retomar          continua esperando o lote já mandado
//
// O irmão de `traduzir-magias.mjs`. O modelo recebe o item do livro em inglês COMO FONTE e devolve o nome oficial
// brasileiro e o efeito resumido com as NOSSAS palavras — nunca a prosa do livro. Os NÚMEROS não passam pelo modelo: o
// conversor (`importar-itens.mjs`) e a tabela à mão (`itens/ajustes-<livro>.mjs`) cuidam deles.
//
// Vão os itens MÁGICOS do livro (`items.json`, com raridade; sem gema nem objeto de arte) e os genéricos de arma e
// armadura que ele define (`magicvariants.json`: a arma +1, a Língua de Fogo, a armadura de resistência).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { custoDe } from '../game/dialogo-servidor.js';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const LIVRO = (process.argv[2] ?? 'dmg').toLowerCase();
const FONTE = LIVRO.toUpperCase();
const MODELO = 'claude-opus-5-5';
const PASSA = {
  itens: `${RAIZ}_referencias/5etools/itens/items.json`,
  variantes: `${RAIZ}_referencias/5etools/itens/magicvariants.json`,
  pt: `${RAIZ}src/dev/itens/${LIVRO}-pt.json`,
  lote: `${RAIZ}.itens-lote-${LIVRO}.json`,
  gastos: `${RAIZ}.bestiario-gastos.json`,
};
const argumento = (nome, reserva) => { const i = process.argv.indexOf(nome); return i >= 0 ? process.argv[i + 1] : reserva; };
const lerJson = (p, reserva) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return reserva; } };

/** Os itens do livro que entram: mágicos (com raridade), sem gema nem objeto de arte; e os genéricos dele. */
export function itensDoLivro(fonte = FONTE) {
  const itens = (lerJson(PASSA.itens, { item: [] }).item ?? [])
    .filter((x) => x.source === fonte && x.rarity && x.rarity !== 'none' && !/^\$[GA]/.test(x.type ?? ''));
  const variantes = (lerJson(PASSA.variantes, { magicvariant: [] }).magicvariant ?? [])
    .filter((x) => (x.inherits?.source ?? x.source) === fonte).map((x) => ({ ...x, generico: true }));
  return [...itens, ...variantes];
}

const SISTEMA = `Você escreve o texto em português do Brasil dos itens mágicos de um RPG tático de D&D 5e (regras do SRD 5.1).
Recebe, em inglês, UM item mágico do livro e devolve JSON.

REGRAS DE ESCRITA
- NUNCA traduza frases do livro. Leia, entenda e escreva com as suas próprias palavras, mais curto. A estrutura e a
  ordem das ideias também devem ser suas. Isto é obrigatório: o texto do livro tem direitos autorais.
- "nome": o nome oficial da tradução brasileira de D&D 5e quando você o conhece com segurança (ex.: Flame Tongue ->
  "Língua de Fogo", Ring of Protection -> "Anel de Proteção", Boots of Speed -> "Botas da Velocidade", Staff of Power ->
  "Cajado do Poder"); se não souber, traduza de forma natural. Nomes próprios
  (Bigby, Heward, Murlynd) ficam como estão. Genéricos com "+1" ficam "Arma +1", "Armadura +1", "Munição +1".
- "desc": o efeito resumido em 1 a 3 frases, como uma ficha de jogo: o que o item dá (bônus, resistência, atributo), o
  que ele faz quando ativado (a ação, a magia que conjura, a CD, as cargas e quando voltam), e se pede sintonia. Distâncias
  em metros (5 pés = 1,5 m; 30 pés = 9 m). Sem repetir o texto do livro. Sem a história do item.
- Vocabulário do jogo: CA, PV, CD, "teste de resistência de Destreza", "vantagem", "desvantagem", "ação bônus",
  "reação", "sintonia", "cargas", "círculo" (não "nível") para o nível da magia; os nomes oficiais brasileiros das
  magias (Bola de Fogo, Mísseis Mágicos, Relâmpago). Tipos de dano: cortante, perfurante, concussão, fogo, frio, elétrico,
  trovejante, ácido, veneno, necrótico, radiante, energético, psíquico.`;

const ESQUEMA = {
  type: 'object', additionalProperties: false, required: ['nome', 'desc'],
  properties: { nome: { type: 'string' }, desc: { type: 'string' } },
};

const fonteDe = (s) => {
  const { srd, basicRules, otherSources, hasFluffImages, hasFluff, reprintedAs, ...item } = s;
  return `ITEM:\n${JSON.stringify(item)}`;
};
const pedido = (s) => ({
  model: MODELO, max_tokens: 1500,
  output_config: { effort: 'low', format: { type: 'json_schema', schema: ESQUEMA } },
  system: SISTEMA,
  messages: [{ role: 'user', content: fonteDe(s) }],
});

async function esperar(client, id) {
  for (;;) {
    const b = await client.messages.batches.retrieve(id);
    console.log(`${new Date().toISOString().slice(11, 19)} ${b.processing_status} ${JSON.stringify(b.request_counts)}`);
    if (b.processing_status === 'ended') return;
    await new Promise((r) => setTimeout(r, 30_000));
  }
}

async function colher(client, { id, nomes }) {
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
  fs.mkdirSync(`${RAIZ}src/dev/itens`, { recursive: true });
  fs.writeFileSync(PASSA.pt, `${JSON.stringify(pt, null, 1)}\n`);
  gastos.usd += usd; gastos.chamadas += nomes.length;
  fs.writeFileSync(PASSA.gastos, `${JSON.stringify(gastos, null, 1)}\n`);
  fs.rmSync(PASSA.lote, { force: true });
  console.log(`${nomes.length} itens: ${certas} com texto, US$ ${usd.toFixed(4)} (US$ ${(usd / Math.max(1, certas)).toFixed(4)} cada)`);
  for (const f of falhas) console.log(`  falhou: ${f}`);
}

if (import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href || process.argv[1]?.endsWith('traduzir-itens.mjs')) {
  const env = Object.fromEntries(fs.readFileSync(`${RAIZ}.env`, 'utf8').split(/\r?\n/).map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2]]));
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 2, timeout: 600000 });
  if (process.argv.includes('--retomar')) {
    const salvo = lerJson(PASSA.lote, null);
    if (!salvo) { console.log('nenhum lote em andamento'); process.exit(0); }
    await esperar(client, salvo.id);
    await colher(client, salvo);
    process.exit(0);
  }
  const pt = lerJson(PASSA.pt, {});
  const todos = itensDoLivro();
  let faltam = todos.filter((s) => !pt[s.name]);
  const ESTIMADO = 0.006;   // por item, pelas magias; a amostra diz o valor de verdade
  console.log(`${FONTE}: ${todos.length} itens (${todos.filter((x) => x.generico).length} genéricos), ${faltam.length} sem texto; uns US$ ${(faltam.length * ESTIMADO).toFixed(2)} pela estimativa`);
  if (!process.argv.includes('--go')) { console.log('Sem --go nada foi mandado.'); process.exit(0); }
  const limite = Number(argumento('--limite', 0));
  if (limite) { const passo = Math.max(1, Math.floor(faltam.length / limite)); faltam = faltam.filter((_, i) => i % passo === 0).slice(0, limite); }
  const lote = await client.messages.batches.create({ requests: faltam.map((s, i) => ({ custom_id: String(i), params: pedido(s) })) });
  const salvo = { id: lote.id, nomes: faltam.map((s) => s.name) };
  fs.writeFileSync(PASSA.lote, JSON.stringify(salvo));
  console.log(`lote ${lote.id} com ${faltam.length} itens mandado`);
  await esperar(client, lote.id);
  await colher(client, salvo);
}
