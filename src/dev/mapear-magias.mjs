// A TABELA "nome da magia em inglês -> id no jogo" (`src/dev/bestiario/magias-en.json`), que o importador de bestiário
// usa para a conjuração dos monstros e a fase das magias usa para saber o que já temos. Uma chamada só à API: ela casa
// as nossas magias (id, nome, círculo, escola) com as dos livros (nome em inglês, círculo, escola). Sem `--go`, o plano.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/mapear-magias.mjs --go
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { custoDe } from '../game/dialogo-servidor.js';
import { SPELLS } from '../rules/spells.js';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const MODELO = 'claude-opus-5-5';
const SAIDA = `${RAIZ}src/dev/bestiario/magias-en.json`;
const ESCOLA = { A: 'abjuração', C: 'conjuração', D: 'adivinhação', E: 'encantamento', V: 'evocação', I: 'ilusão', N: 'necromancia', T: 'transmutação' };
const env = Object.fromEntries(fs.readFileSync(`${RAIZ}.env`, 'utf8').split(/\r?\n/).map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2]]));

const livros = fs.readdirSync(`${RAIZ}_referencias/5etools/spells`).flatMap((f) => JSON.parse(fs.readFileSync(`${RAIZ}_referencias/5etools/spells/${f}`, 'utf8')).spell);
const deles = livros.map((s) => `${s.name}|${s.level}|${ESCOLA[s.school] ?? s.school}`);
const nossas = Object.values(SPELLS).map((s) => `${s.id}|${s.name}|${s.level}|${s.school}`);
console.log(`${nossas.length} magias nossas contra ${deles.length} dos livros`);
if (!process.argv.includes('--go')) { console.log('Sem --go nada foi mandado.'); process.exit(0); }

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 2, timeout: 300000 });
const ESQUEMA = { type: 'object', additionalProperties: false, required: ['pares'], properties: { pares: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['en', 'id'], properties: { en: { type: 'string' }, id: { type: 'string' } } } } } };
const stream = client.messages.stream({
  model: MODELO, max_tokens: 16000,
  output_config: { effort: 'low', format: { type: 'json_schema', schema: ESQUEMA } },
  system: 'Você casa magias de D&D 5e. A lista NOSSA tem id|nome em português|círculo|escola; a lista DELES tem nome em inglês|círculo|escola. Para cada magia NOSSA que corresponde a uma DELES, devolva {en: nome em inglês exato, id: o nosso id}. Só pares certos: mesmo efeito, mesmo círculo. Magia nossa sem par fica de fora.',
  messages: [{ role: 'user', content: `NOSSA:\n${nossas.join('\n')}\n\nDELES:\n${deles.join('\n')}` }],
});
const m = await stream.finalMessage();
const r = JSON.parse(m.content.filter((b) => b.type === 'text').map((b) => b.text).join(''));
const nomesDeles = new Set(livros.map((s) => s.name));
const tabela = {};
for (const p of r.pares) if (SPELLS[p.id] && nomesDeles.has(p.en)) tabela[p.en.toLowerCase()] = p.id;
fs.mkdirSync(`${RAIZ}src/dev/bestiario`, { recursive: true });
fs.writeFileSync(SAIDA, `${JSON.stringify(tabela, null, 1)}\n`);
console.log(`${Object.keys(tabela).length} pares (de ${r.pares.length} devolvidos); US$ ${custoDe(MODELO, m.usage).toFixed(4)}`);
