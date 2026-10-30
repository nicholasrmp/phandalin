// AGENTE PELO CRÉDITO DA API, e não pelo limite semanal.
//
// POR QUE ESTE ARQUIVO EXISTE
//
// O crédito promocional da conta cobre, pela própria concessão, "Agent SDK,
// API, Batch API, Playground e Agentes gerenciados". O Claude Code NÃO está
// nessa lista — foi medido: a mesma chave, no mesmo modelo `claude-haiku-5-5`,
// responde numa chamada crua à API e é recusada dentro do Claude Code com
// "Credit balance too low". Crédito COMPRADO serve ao Claude Code; crédito
// promocional, não.
//
// O Agent SDK é o motor do Claude Code empacotado como biblioteca: mesmas
// ferramentas de arquivo, mesmo laço de agente. E ele está na lista. Então o
// trabalho mecânico — medir sprite, conferir folha, rodar um revisor — roda
// por aqui e sai do crédito, enquanto a conversa de decisão continua no app,
// pelo plano.
//
// QUATRO DECISÕES QUE PRECISAM ESTAR ESCRITAS:
//
// 1. SECO POR PADRÃO, como todo script deste projeto que gasta. Sem `--go`
//    ele imprime o plano e para. Agente que começa a trabalhar porque alguém
//    teclou Enter sem ler é dinheiro saindo sem decisão.
//
// 2. SÓ LEITURA POR PADRÃO. Sem `--escrever` ele recebe Read, Glob e Grep e
//    mais nada. Para revisar, medir e explicar isso basta, e é a maioria do
//    uso.
//
// 3. NENHUM MODO DE PERMISSÃO É FORÇADO, e isto é deliberado. A primeira
//    versão deste arquivo passava `permissionMode: 'bypassPermissions'` para
//    o script não travar esperando resposta — ou seja, um agente que ignora
//    as permissões em bloco. Numa árvore que três sessões estão editando ao
//    mesmo tempo, isso é risco real, e a revisão automática do projeto barrou
//    com razão. A contenção aqui é a LISTA DE FERRAMENTAS, que é explícita e
//    legível. Se algo for barrado, a saída diz o quê, e a permissão se concede
//    uma vez em `.claude/settings.json` — nominalmente, não em atacado.
//
// 4. SEM `Bash`, NEM COM `--escrever`. Editar arquivo é limitado e reversível
//    pelo git; executar comando arbitrário não é. Quem precisa rodar script
//    roda à mão.
//
// A CHAVE SÓ VEM DO AMBIENTE: `ANTHROPIC_API_KEY`, passada inline na linha de
// comando, nunca de arquivo — a mesma regra dos scripts do PixelLab.
//
// USO
//
//   node src/dev/agente.mjs "a tarefa"         -> plano, não gasta
//   node src/dev/agente.mjs "a tarefa" --go    -> roda
//   node src/dev/agente.mjs "a tarefa" --go --escrever --modelo claude-sonnet-5-5

import { query } from '@anthropic-ai/claude-agent-sdk';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Haiku por padrão porque é o único modelo que FOI MEDIDO passando pelo
// crédito promocional nesta conta. Sonnet e Opus podem passar também; a
// primeira execução com `--modelo` responde isso, e o relatório de gasto no
// fim diz quanto custou. Não suponha: meça e anote aqui.
const MODELO_PADRAO = 'claude-haiku-5-5';

const SO_LEITURA = ['Read', 'Glob', 'Grep'];
const ESCRITA = [...SO_LEITURA, 'Write', 'Edit'];

function argumentos(argv) {
  const livres = [];
  const op = { modelo: MODELO_PADRAO, turnos: 12, go: false, escrever: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--go') op.go = true;
    else if (a === '--escrever') op.escrever = true;
    else if (a === '--modelo') op.modelo = argv[++i];
    else if (a === '--turnos') op.turnos = Number(argv[++i]);
    else livres.push(a);
  }
  op.tarefa = livres.join(' ').trim();
  return op;
}

const op = argumentos(process.argv.slice(2));

if (!op.tarefa) {
  console.error('uso: node src/dev/agente.mjs "a tarefa" [--go] [--escrever] '
    + '[--modelo <id>] [--turnos <n>]');
  process.exit(1);
}
const ferramentas = op.escrever ? ESCRITA : SO_LEITURA;

console.log('PLANO');
console.log(`  pasta       ${RAIZ}`);
console.log(`  modelo      ${op.modelo}`);
console.log(`  ferramentas ${ferramentas.join(', ')}`);
console.log(`  turnos      até ${op.turnos}`);
console.log(`  tarefa      ${op.tarefa}`);
console.log('  cobrança    crédito da API (ANTHROPIC_API_KEY), não o plano semanal');

if (!op.go) {
  console.log('\n(seco: nada foi executado nem gasto. use --go)');
  process.exit(0);
}

// A chave só é exigida na hora de gastar: o plano seco se imprime sem ela, e
// é assim que dá para conferir o que o agente faria antes de ter a chave na
// mão.
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('\ndefina ANTHROPIC_API_KEY no ambiente (nunca em arquivo).');
  process.exit(1);
}

console.log('\n--- trabalhando ---\n');

// `settingSources: ['project']` faz o agente enxergar o `.claude/` do
// repositório — as skills `pixellab`, `sprite-phandalin` e `pixel-art`. É o
// que o faz saber as regras daqui em vez de improvisar.
const q = query({
  prompt: op.tarefa,
  options: {
    model: op.modelo,
    cwd: RAIZ,
    allowedTools: ferramentas,
    maxTurns: op.turnos,
    settingSources: ['project'],
  },
});

let ultimo = null;
for await (const msg of q) {
  if (msg.type === 'assistant') {
    for (const bloco of msg.message?.content ?? []) {
      if (bloco.type === 'text' && bloco.text.trim()) console.log(bloco.text);
      if (bloco.type === 'tool_use') console.log(`  · ${bloco.name}`);
    }
  } else if (msg.type === 'result') {
    ultimo = msg;
  }
}

if (!ultimo) {
  console.error('\nterminou sem resultado.');
  process.exit(1);
}

console.log('\n--- gasto ---');
console.log(`  turnos        ${ultimo.num_turns}`);
console.log(`  tempo         ${(ultimo.duration_ms / 1000).toFixed(1)}s`);
// `modelUsage` é o campo certo para contabilidade: cobre o laço principal, os
// subagentes e as chamadas internas. `usage` sozinho deixa subagente de fora.
for (const [modelo, u] of Object.entries(ultimo.modelUsage ?? {})) {
  const entrada = u.inputTokens ?? u.input_tokens ?? 0;
  const saida = u.outputTokens ?? u.output_tokens ?? 0;
  const lido = u.cacheReadInputTokens ?? u.cache_read_input_tokens ?? 0;
  console.log(`  ${modelo}`);
  console.log(`    entrada ${entrada}  ·  cache lido ${lido}  ·  saída ${saida}`);
}
console.log(`  custo estimado  US$ ${(ultimo.total_cost_usd ?? 0).toFixed(4)}`);
console.log('  (estimativa do SDK, não extrato — confira o saldo no Console)');

if (ultimo.is_error) process.exit(1);
