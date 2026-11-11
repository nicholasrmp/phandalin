// O TEXTO EM PT-BR DAS SUBCLASSES DOS LIVROS, pela API de lotes (metade do preço). Sem `--go` só mostra o plano.
//
//   node src/dev/traduzir-subclasses.mjs xge              o plano, de graça
//   node src/dev/traduzir-subclasses.mjs xge --go         manda o lote (o que já tem texto não é pago de novo)
//   node src/dev/traduzir-subclasses.mjs xge --retomar    continua esperando o lote já mandado
//
// O irmão de `traduzir-magias.mjs`. Um pedido por SUBCLASSE, com todos os recursos dela: o modelo devolve o nome oficial
// brasileiro da subclasse e, para cada recurso, o nome e a regra com as NOSSAS palavras — nunca a prosa do livro. Escreve
// `src/dev/subclasses/<livro>-pt.json`, chaveado por "Classe|Subclasse" (o nome em inglês).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { custoDe } from '../game/dialogo-servidor.js';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const LIVRO = (process.argv[2] ?? 'xge').toLowerCase();
const MODELO = 'claude-opus-5-5';
const PASSA = {
  classes: `${RAIZ}_referencias/5etools/class`,
  pt: `${RAIZ}src/dev/subclasses/${LIVRO}-pt.json`,
  lote: `${RAIZ}.subclasses-lote-${LIVRO}.json`,
  gastos: `${RAIZ}.bestiario-gastos.json`,
};
const lerJson = (p, reserva) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return reserva; } };
const env = Object.fromEntries(fs.readFileSync(`${RAIZ}.env`, 'utf8').split(/\r?\n/).map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2]]));

const texto = (e) => (Array.isArray(e) ? e.map(texto).join(' ') : typeof e === 'string' ? e
  : e?.type === 'refSubclassFeature' ? '' : e?.entries ? texto(e.entries) : e?.items ? texto(e.items) : e?.entry ? texto(e.entry) : '');

/** As subclasses do livro, cada uma com os recursos (nível, nome, texto) — sem o recurso-cabeçalho, que só apresenta. */
export function subclassesDoLivro(livro = LIVRO) {
  const out = [];
  for (const f of fs.readdirSync(PASSA.classes)) {
    const d = JSON.parse(fs.readFileSync(`${PASSA.classes}/${f}`, 'utf8'));
    for (const s of d.subclass ?? []) {
      if (s._copy || s.source !== livro.toUpperCase()) continue;
      const recursos = (d.subclassFeature ?? []).filter((x) => x.subclassShortName === s.shortName && x.subclassSource === s.source && x.name !== s.name)
        .map((x) => ({ nivel: x.level, nome: x.name, texto: texto(x.entries) }));
      out.push({ chave: `${s.className}|${s.name}`, classe: s.className, nome: s.name, recursos });
    }
  }
  return out;
}

const SISTEMA = `Você escreve o texto em português do Brasil das subclasses de um RPG tático de D&D 5e (regras do SRD 5.1).
Recebe, em inglês, UMA subclasse do livro (o nome e a lista dos recursos, cada um com nível e regra) e devolve JSON.

REGRAS DE ESCRITA
- NUNCA traduza frases do livro. Leia, entenda e escreva com as suas próprias palavras, mais curto. A estrutura e a
  ordem das ideias também devem ser suas. Isto é obrigatório: o texto do livro tem direitos autorais.
- "nome": o nome oficial da tradução brasileira de D&D 5e quando você o conhece com segurança (ex.: Path of the Zealot ->
  "Caminho do Fanático", College of Swords -> "Colégio das Espadas", Gloom Stalker -> "Perseguidor Sombrio"); se não
  souber, traduza de forma natural.
- "recursos": um item por recurso recebido, NA MESMA ORDEM, com "en" (o nome em inglês, igual ao recebido), "nome" (o
  nome em pt-br) e "desc": a regra resumida em 1 a 3 frases, como uma ficha de jogo — o que faz, quando (ação, ação
  bônus, reação), quantas vezes e quando volta (descanso curto ou longo), números e dados. Distâncias em metros
  (5 pés = 1,5 m; 30 pés = 9 m). Sem história nem sabor: só a regra.
- Vocabulário do jogo: CA, PV, CD, "teste de resistência de Destreza", "vantagem", "desvantagem", "ação bônus",
  "reação", "concentração", "Fúria", "Inspiração de Bardo", "Canalizar Divindade", "Forma Selvagem", "Surto de Ação",
  "ki", "pontos de feitiçaria", "espaço de magia", "círculo" para o nível da magia; condições: amedrontado,
  enfeitiçado, cego, surdo, agarrado, contido, caído, paralisado, petrificado, envenenado, atordoado, inconsciente,
  incapacitado, invisível. Tipos de dano: cortante, perfurante, concussão, fogo, frio, elétrico, trovejante, ácido,
  veneno, necrótico, radiante, energético, psíquico.`;

const ESQUEMA = {
  type: 'object', additionalProperties: false, required: ['nome', 'recursos'],
  properties: {
    nome: { type: 'string' },
    recursos: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['en', 'nome', 'desc'],
      properties: { en: { type: 'string' }, nome: { type: 'string' }, desc: { type: 'string' } } } },
  },
};
const pedido = (s) => ({
  model: MODELO, max_tokens: 6000,
  output_config: { effort: 'low', format: { type: 'json_schema', schema: ESQUEMA } },
  system: SISTEMA,
  messages: [{ role: 'user', content: `SUBCLASSE (${s.classe}): ${s.nome}\n${JSON.stringify(s.recursos)}` }],
});

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 2, timeout: 600000 });
  const esperar = async (id) => {
    for (;;) {
      const b = await client.messages.batches.retrieve(id);
      console.log(`${new Date().toISOString().slice(11, 19)} ${b.processing_status} ${JSON.stringify(b.request_counts)}`);
      if (b.processing_status === 'ended') return;
      await new Promise((r) => setTimeout(r, 30_000));
    }
  };
  const colher = async ({ id, chaves }) => {
    const pt = lerJson(PASSA.pt, {});
    const gastos = lerJson(PASSA.gastos, { usd: 0, chamadas: 0 });
    let usd = 0; let certas = 0; const falhas = [];
    for await (const item of await client.messages.batches.results(id)) {
      const chave = chaves[Number(item.custom_id)];
      if (item.result.type !== 'succeeded') { falhas.push(`${chave}: ${item.result.type}`); continue; }
      const m = item.result.message;
      usd += custoDe(MODELO, m.usage) * 0.5;
      if (m.stop_reason !== 'end_turn') { falhas.push(`${chave}: ${m.stop_reason}`); continue; }
      try { pt[chave] = JSON.parse(m.content.filter((b) => b.type === 'text').map((b) => b.text).join('')); certas += 1; } catch { falhas.push(`${chave}: JSON inválido`); }
    }
    fs.mkdirSync(`${RAIZ}src/dev/subclasses`, { recursive: true });
    fs.writeFileSync(PASSA.pt, `${JSON.stringify(pt, null, 1)}\n`);
    gastos.usd += usd; gastos.chamadas += chaves.length;
    fs.writeFileSync(PASSA.gastos, `${JSON.stringify(gastos, null, 1)}\n`);
    fs.rmSync(PASSA.lote, { force: true });
    console.log(`${chaves.length} subclasses: ${certas} com texto, US$ ${usd.toFixed(4)} (US$ ${(usd / Math.max(1, certas)).toFixed(4)} cada)`);
    for (const f of falhas) console.log(`  falhou: ${f}`);
  };
  if (process.argv.includes('--retomar')) {
    const salvo = lerJson(PASSA.lote, null);
    if (!salvo) { console.log('nenhum lote em andamento'); process.exit(0); }
    await esperar(salvo.id);
    await colher(salvo);
    process.exit(0);
  }
  const pt = lerJson(PASSA.pt, {});
  const faltam = subclassesDoLivro().filter((s) => !pt[s.chave]);
  console.log(`${LIVRO.toUpperCase()}: ${faltam.length} subclasses sem texto (${faltam.reduce((n, s) => n + s.recursos.length, 0)} recursos); uns US$ ${(faltam.length * 0.04).toFixed(2)} pela estimativa`);
  if (!process.argv.includes('--go')) { console.log('Sem --go nada foi mandado.'); process.exit(0); }
  const lote = await client.messages.batches.create({ requests: faltam.map((s, i) => ({ custom_id: String(i), params: pedido(s) })) });
  const salvo = { id: lote.id, chaves: faltam.map((s) => s.chave) };
  fs.writeFileSync(PASSA.lote, JSON.stringify(salvo));
  console.log(`lote ${lote.id} com ${faltam.length} subclasses mandado`);
  await esperar(lote.id);
  await colher(salvo);
}
