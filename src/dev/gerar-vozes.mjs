// AS FALAS DE MEMÓRIA SEM API: para cada NPC, na voz dele, o que dizer quando alguém repete a pergunta, quando volta a falar com ele e quando
// pergunta do que já disse. Vão para `public/dialogos/vozes.json`, e `game/perguntar.js` as usa quando não há modelo. Só forma, sem fato
// nenhum, então a mesma fala serve em qualquer estado da cena. GASTA CRÉDITO: uma chamada por NPC. Pule quem já tem com `--faltam`.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/gerar-vozes.mjs [--faltam]
import fs from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';
import { FICHAS } from '../game/npc-saber.js';
import { custoDe, gastosVazios } from '../game/dialogo-servidor.js';
import { vozesValidas } from '../game/dialogo-ia.js';

const CAMINHO = 'public/dialogos/vozes.json';
const MODELO = 'claude-opus-5-5';
const chave = fs.readFileSync('.env', 'utf8').match(/^ANTHROPIC_API_KEY=(.+)$/m)?.[1]?.trim();
const client = new Anthropic({ apiKey: chave, maxRetries: 2, timeout: 60000 });
const lista = { type: 'array', items: { type: 'string' } };
const ESQUEMA = { type: 'object', properties: { repete: lista, voltou: lista, lembra: lista, naoLembra: lista }, required: ['repete', 'voltou', 'lembra', 'naoLembra'], additionalProperties: false };

const lerJson = (p, r) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return r; } };
const vozes = lerJson(CAMINHO, {});
let usd = 0;
for (const [id, ficha] of Object.entries(FICHAS)) {
  if (process.argv.includes('--faltam') && vozes[id]) continue;
  const r = await client.messages.create({
    model: MODELO,
    max_tokens: 1500,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: ESQUEMA } },
    system: [
      `Escreva falas curtas de ${ficha.nome}, em um RPG de fantasia medieval, em português do Brasil.`,
      `QUEM É: ${ficha.quem}`, `COMO FALA: ${ficha.voz}`,
      'As falas são genéricas: servem em qualquer momento. Não cite lugar, nome de pessoa, número nem fato nenhum, nem prometa nada.',
      'Máximo de 15 palavras cada. Só a fala, sem narração.',
    ].join('\n'),
    messages: [{ role: 'user', content: [
      'Devolva quatro listas, com três falas cada:',
      'repete: alguém pergunta de novo o que ele já respondeu há pouco; ele reage, sem repetir a resposta.',
      'voltou: alguém que ele já conhece volta a falar com ele; serve de abertura, antes de outra frase.',
      'lembra: perguntam o que foi dito antes. Cada fala TEM de conter o marcador {frase} exatamente assim, no lugar do que a pessoa disse (exemplo de forma: Você disse: "{frase}".).',
      'naoLembra: perguntam o que foi dito antes, mas ninguém falou nada com ele ainda.',
    ].join('\n') }],
  });
  usd += custoDe(MODELO, r.usage);
  const dados = JSON.parse(r.content.filter((b) => b.type === 'text').map((b) => b.text).join(''));
  const certas = vozesValidas(dados, ficha);
  if (!certas) { console.log(`${id}: reprovada`, JSON.stringify(dados).slice(0, 200)); continue; }
  vozes[id] = certas;
  console.log(`${id}: ${certas.voltou[0]} | ${certas.lembra[0]}`);
}
fs.writeFileSync(CAMINHO, `${JSON.stringify(vozes, null, 1)}\n`);
const g = lerJson('.dialogo-gastos.json', gastosVazios());
g.usd += usd; fs.writeFileSync('.dialogo-gastos.json', `${JSON.stringify(g, null, 1)}\n`);
console.log(`US$ ${usd.toFixed(4)}`);
