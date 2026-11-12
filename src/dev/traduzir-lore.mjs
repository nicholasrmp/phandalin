// A LORE DO MUNDO EM PT-BR (os deuses, os lugares da Costa da Espada, os povos e as criaturas), pela API de lotes (metade
// do preço). Sem `--go` só mostra o plano. O plano e o porquê estão em `revisoes/lore-plano-2026-11-12.md`.
//
//   node src/dev/traduzir-lore.mjs                       o plano, de graça
//   node src/dev/traduzir-lore.mjs --go --limite 10      uma amostra, para medir o preço e a qualidade
//   node src/dev/traduzir-lore.mjs --go                  o resto (o que já tem texto não é pago de novo)
//   node src/dev/traduzir-lore.mjs --retomar             continua esperando o lote já mandado
//
// O modelo recebe a seção do livro em inglês COMO FONTE e devolve o nome brasileiro e FATOS em camadas de CD, escritos
// com as NOSSAS palavras — nunca a prosa do livro. Cada fato é o que um herói sabe passando no Lembrar com aquela CD.
// O dado vem do espelho do 5etools em `_referencias/5etools/lore/` (fora do repositório).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { custoDe } from '../game/dialogo-servidor.js';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const MODELO = 'claude-opus-5-5';
const DIR = `${RAIZ}_referencias/5etools/lore`;
const PASSA = { pt: `${RAIZ}src/dev/lore/lore-pt.json`, lote: `${RAIZ}.lore-lote.json`, gastos: `${RAIZ}.bestiario-gastos.json` };
const argumento = (nome, reserva) => { const i = process.argv.indexOf(nome); return i >= 0 ? process.argv[i + 1] : reserva; };
const lerJson = (p, reserva) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return reserva; } };
const livro = (b) => lerJson(`${DIR}/book-${b}.json`, { bookData: [{ data: [] }] }).bookData[0].data;

/** O texto corrido de uma entrada do 5etools (as marcas `{@x y|z}` viram `y`; tabela vira linhas). */
export function texto(e) {
  if (e == null) return '';
  if (typeof e === 'string') return e.replace(/\{@\w+ ([^}|]*)[^}]*\}/g, '$1');
  if (Array.isArray(e)) return e.map(texto).filter(Boolean).join('\n');
  if (e.type === 'table') return [e.caption, ...(e.rows ?? []).map((r) => r.map(texto).join(' | '))].filter(Boolean).join('\n');
  const partes = [];
  if (e.name) partes.push(`## ${e.name}`);
  for (const k of ['entries', 'items', 'entry']) if (e[k]) partes.push(texto(e[k]));
  return partes.join('\n');
}
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, ' ').trim().split(' ')
  .map((p, i) => (i ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : p.toLowerCase())).join('');
const filhos = (e) => (e?.entries ?? []).filter((x) => x && typeof x === 'object' && x.name);
const acha = (lista, nome) => lista.find((x) => x?.name === nome);

/** A seção grande demais vai em pedaços pelas subseções (o `grupo` junta os pedaços de volta). */
const LIMITE = 60000;
function emPedacos(sec, tipo, fonte, grupo = null) {
  const t = texto(sec);
  if (t.length <= LIMITE || !filhos(sec).length) return [{ chave: `${tipo}:${slug(sec.name)}`, tipo, fonte, nomeEn: sec.name, grupo: grupo ?? slug(sec.name), texto: t.slice(0, LIMITE) }];
  const intro = (sec.entries ?? []).filter((x) => typeof x === 'string');
  const pedacos = filhos(sec).flatMap((f) => emPedacos(f, tipo, fonte, grupo ?? slug(sec.name)));
  if (intro.length) pedacos.unshift({ chave: `${tipo}:${slug(sec.name)}Intro`, tipo, fonte, nomeEn: sec.name, grupo: grupo ?? slug(sec.name), texto: texto(intro) });
  return pedacos;
}

/** Todas as seções que viram lore, cada uma com a chave estável que o importador e as ligações usam. */
export function unidades() {
  const out = [];
  // ---- os DEUSES: os Reinos do PHB, o panteão de Faerûn e os não humanos; o texto do SCAG junto quando houver
  const deuses = lerJson(`${DIR}/deities.json`, { deity: [] }).deity;
  const scag = livro('scag');
  const deusesEmProsa = filhos(acha(filhos(acha(scag, 'Welcome to the Realms')), 'The Gods of Faerûn'));
  const DOS_REINOS = /Faer|Forgotten Realms|Dwarven|Elven|Drow|Halfling|Gnom|Orc|Duergar|Yuan-ti/;
  const vistos = new Map();
  for (const d of deuses) {
    if (!['PHB', 'SCAG', 'MTF', 'VGM'].includes(d.source) || !DOS_REINOS.test(d.pantheon ?? '')) continue;
    if (d.source === 'PHB' && d.pantheon !== 'Forgotten Realms') continue;
    const atual = vistos.get(d.name);
    if (!atual || d.source !== 'PHB') vistos.set(d.name, d);
  }
  for (const d of vistos.values()) {
    const { entries, ...dado } = d;
    const prosa = acha(deusesEmProsa, d.name);
    out.push({ chave: `deus:${slug(d.name)}`, tipo: 'deus', fonte: d.source, nomeEn: d.name, grupo: slug(d.pantheon ?? ''),
      texto: `${JSON.stringify(dado)}\n${texto(entries)}\n${prosa ? texto(prosa) : ''}`.slice(0, LIMITE) });
  }
  // ---- os LUGARES do SCAG (as cidades da Aliança dos Lordes, as fortalezas anãs, os reinos independentes, o Subterrâneo)
  const costa = acha(scag, 'The Sword Coast and the North');
  for (const grupo of filhos(costa)) {
    if (/Note to the DM/.test(grupo.name)) continue;
    const subs = filhos(grupo);
    if (!subs.length) { out.push(...emPedacos(grupo, 'lugar', 'SCAG')); continue; }
    for (const s of subs) out.push(...emPedacos(s, 'lugar', 'SCAG', slug(grupo.name)));
  }
  // ---- a HISTÓRIA e a magia do mundo (Netheril, a Praga Mágica, a Trama)
  const reinos = acha(scag, 'Welcome to the Realms');
  for (const nome of ['A Brief History', 'Magic in the Realms', 'Time in the Realms']) {
    const s = acha(filhos(reinos), nome);
    if (s) out.push(...emPedacos(s, 'historia', 'SCAG'));
  }
  // ---- os POVOS e as CRIATURAS: a lore de monstros do VGM, os capítulos do MTF, o Draconomicon e os gigantes do BGG
  const vgm = acha(livro('vgm'), 'Monster Lore');
  for (const s of filhos(vgm)) out.push(...emPedacos(s, 'povo', 'VGM'));
  for (const cap of livro('mtf').slice(0, 5)) out.push(...emPedacos(cap, 'povo', 'MTF'));
  const draconomicon = acha(livro('ftd'), 'Draconomicon');
  for (const s of filhos(draconomicon)) if (!/Using the Entries/.test(s.name)) out.push(...emPedacos(s, 'povo', 'FTD'));
  const gigantes = acha(livro('bgg'), 'Chapter 2: Giants in Play');
  if (gigantes) out.push(...emPedacos(gigantes, 'povo', 'BGG'));
  // as tabelas de sorteio do mestre e as opções de personagem (a raça jogável fica para o passo das raças) não são lore
  const NAO = /Tables$|Customization|Characters$|Subraces$|Height and Weight/;
  return out.filter((u) => u.texto.trim().length > 200 && !NAO.test(u.nomeEn));
}

const SISTEMA = `Você escreve, em português do Brasil, o que os heróis de um RPG tático de D&D 5e nos Reinos Esquecidos (a Costa da
Espada, perto de Phandalin) SABEM sobre o mundo. Recebe, em inglês, UMA seção de um livro (um deus, um lugar, um trecho
da história ou um povo de criaturas) e devolve JSON.

REGRAS DE ESCRITA
- NUNCA traduza frases do livro. Leia, entenda e escreva FATOS com as suas próprias palavras, curtos. A estrutura e a
  ordem das ideias também devem ser suas. Isto é obrigatório: o texto do livro tem direitos autorais.
- "nome": o nome na tradução brasileira de D&D 5e quando você o conhece com segurança (Waterdeep -> "Águas Profundas",
  Baldur's Gate -> "Portal de Baldur", Silverymoon -> "Lua Argêntea", Underdark -> "Subterrâneo", Mind Flayers ->
  "Devoradores de Mentes", Beholders -> "Observadores"); nome próprio sem tradução conhecida fica como está (Neverwinter,
  Luskan, Mirabar, Gauntlgrym, Tymora, Lathander, Netheril). Para um deus, só o nome.
- "resumo": UMA frase, o que qualquer pessoa da Costa da Espada diria a respeito.
- "fatos": de 3 a 6, do mais sabido ao mais raro, cada um com "cd" e "texto":
    cd 10  o que qualquer um ouviu falar;
    cd 15  o que sabe quem estudou, viajou ou é do lugar;
    cd 20  o que só um estudioso ou um devoto sabe;
    cd 25  o segredo, o detalhe raro.
  Cada "texto" com 1 ou 2 frases, até 40 palavras, útil para quem joga: o que esperar, do que ter cuidado, o que
  respeitar, como pensam, o que temem, o que querem. Para um deus: o que rege, o símbolo, quem o cultua, o que os fiéis
  fazem. Para um lugar: onde fica, quem manda, pelo que é conhecido. Para um povo: como vivem, como lutam, o que os move.
- "palavras": de 3 a 8 palavras-chave em português, minúsculas, sem acento, que um jogador usaria para perguntar disso a
  um NPC (o nome, o apelido, o símbolo, a palavra comum: "sorte", "moeda", "goblin", "hobgoblin").
- Nada de regra de jogo, número de página, "o mestre", "a aventura", "jogadores". Fale do mundo como ele é.`;

const ESQUEMA = {
  type: 'object', additionalProperties: false, required: ['nome', 'resumo', 'fatos', 'palavras'],
  properties: {
    nome: { type: 'string' }, resumo: { type: 'string' },
    fatos: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['cd', 'texto'], properties: { cd: { type: 'integer' }, texto: { type: 'string' } } } },
    palavras: { type: 'array', items: { type: 'string' } },
  },
};
const pedido = (u) => ({
  model: MODELO, max_tokens: 2500,
  output_config: { effort: 'low', format: { type: 'json_schema', schema: ESQUEMA } },
  system: SISTEMA,
  messages: [{ role: 'user', content: `TIPO: ${u.tipo}\nSEÇÃO: ${u.nomeEn}\n\n${u.texto}` }],
});

async function esperar(client, id) {
  for (;;) {
    const b = await client.messages.batches.retrieve(id);
    console.log(`${new Date().toISOString().slice(11, 19)} ${b.processing_status} ${JSON.stringify(b.request_counts)}`);
    if (b.processing_status === 'ended') return;
    await new Promise((r) => setTimeout(r, 30_000));
  }
}

async function colher(client, { id, chaves, meta }) {
  const pt = lerJson(PASSA.pt, {});
  const gastos = lerJson(PASSA.gastos, { usd: 0, chamadas: 0 });
  let usd = 0; let certas = 0; const falhas = [];
  for await (const item of await client.messages.batches.results(id)) {
    const chave = chaves[Number(item.custom_id)];
    if (item.result.type !== 'succeeded') { falhas.push(`${chave}: ${item.result.type}`); continue; }
    const m = item.result.message;
    usd += custoDe(MODELO, m.usage) * 0.5;
    if (m.stop_reason !== 'end_turn') { falhas.push(`${chave}: ${m.stop_reason}`); continue; }
    try { pt[chave] = { ...meta[chave], ...JSON.parse(m.content.filter((b) => b.type === 'text').map((b) => b.text).join('')) }; certas += 1; } catch { falhas.push(`${chave}: JSON inválido`); }
  }
  fs.mkdirSync(`${RAIZ}src/dev/lore`, { recursive: true });
  fs.writeFileSync(PASSA.pt, `${JSON.stringify(pt, null, 1)}\n`);
  gastos.usd += usd; gastos.chamadas += chaves.length;
  fs.writeFileSync(PASSA.gastos, `${JSON.stringify(gastos, null, 1)}\n`);
  fs.rmSync(PASSA.lote, { force: true });
  console.log(`${chaves.length} seções: ${certas} com texto, US$ ${usd.toFixed(4)} (US$ ${(usd / Math.max(1, certas)).toFixed(4)} cada)`);
  for (const f of falhas) console.log(`  falhou: ${f}`);
}

if (process.argv[1]?.endsWith('traduzir-lore.mjs')) {
  const todos = unidades();
  const pt = lerJson(PASSA.pt, {});
  let faltam = todos.filter((u) => !pt[u.chave]);
  const chars = faltam.reduce((s, u) => s + u.texto.length, 0);
  const porTipo = {};
  for (const u of todos) porTipo[u.tipo] = (porTipo[u.tipo] ?? 0) + 1;
  // ~4 caracteres por token; a saída ~700 tokens por seção; o preço do lote é metade
  const estimado = (chars / 4 / 1e6) * 4 * 0.5 + (faltam.length * 700 / 1e6) * 20 * 0.5;
  console.log(`${todos.length} seções (${Object.entries(porTipo).map(([k, v]) => `${k} ${v}`).join(', ')}); ${faltam.length} sem texto, ${(chars / 1000).toFixed(0)} mil caracteres; uns US$ ${estimado.toFixed(2)} pela estimativa`);
  if (!process.argv.includes('--go') && !process.argv.includes('--retomar')) { console.log('Sem --go nada foi mandado.'); process.exit(0); }
  const env = Object.fromEntries(fs.readFileSync(`${RAIZ}.env`, 'utf8').split(/\r?\n/).map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2]]));
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 2, timeout: 600000 });
  if (process.argv.includes('--retomar')) {
    const salvo = lerJson(PASSA.lote, null);
    if (!salvo) { console.log('nenhum lote em andamento'); process.exit(0); }
    await esperar(client, salvo.id);
    await colher(client, salvo);
    process.exit(0);
  }
  const limite = Number(argumento('--limite', 0));
  if (limite) { const passo = Math.max(1, Math.floor(faltam.length / limite)); faltam = faltam.filter((_, i) => i % passo === 0).slice(0, limite); }
  const meta = Object.fromEntries(faltam.map((u) => [u.chave, { tipo: u.tipo, fonte: u.fonte, nomeEn: u.nomeEn, grupo: u.grupo }]));
  const lote = await client.messages.batches.create({ requests: faltam.map((u, i) => ({ custom_id: String(i), params: pedido(u) })) });
  const salvo = { id: lote.id, chaves: faltam.map((u) => u.chave), meta };
  fs.writeFileSync(PASSA.lote, JSON.stringify(salvo));
  console.log(`lote ${lote.id} com ${faltam.length} seções mandado`);
  await esperar(client, lote.id);
  await colher(client, salvo);
}
