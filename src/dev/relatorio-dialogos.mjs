// O QUE OS JOGADORES ESTÃO PERGUNTANDO. Lê `.dialogo-registro.jsonl`, que o `npm run dev` escreve a cada pergunta, e diz de onde a resposta
// veio e o que não teve fala nenhuma. É o mapa do que `gerar-lote.mjs` deve gerar a seguir, e ele já lê esse arquivo.
//
//   node src/dev/relatorio-dialogos.mjs
import fs from 'node:fs';

const CAMINHO = '.dialogo-registro.jsonl';
if (!fs.existsSync(CAMINHO)) { console.log('Ainda não há registro: jogue com `npm run dev`.'); process.exit(0); }
const linhas = fs.readFileSync(CAMINHO, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const conta = (f) => { const c = {}; for (const l of linhas) { const k = f(l); c[k] = (c[k] ?? 0) + 1; } return Object.entries(c).sort((a, b) => b[1] - a[1]); };
console.log(`${linhas.length} perguntas`);
console.log('de onde veio:', conta((l) => l.origem).map(([k, n]) => `${k} ${Math.round((n / linhas.length) * 100)}%`).join(', '));
console.log('com memória:', linhas.filter((l) => l.memoria).length);
console.log('\nmais perguntados:', conta((l) => l.npc).slice(0, 10).map(([k, n]) => `${k} ${n}`).join(', '));
const faltou = linhas.filter((l) => l.origem === 'reserva');
console.log(`\nsem fala do banco nem do modelo (${faltou.length}):`);
for (const l of faltou.slice(-30)) console.log(`  ${l.npc} | ${l.pergunta}`);
