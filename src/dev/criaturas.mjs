// Gera o ESTADO das criaturas em `CRIATURAS.md`: quem tem ficha, quem tem folha
// desenhada, que animacao cada uma tem e onde aparece.
//
//     node src/dev/criaturas.mjs          reescreve o bloco gerado do CRIATURAS.md
//     node src/dev/criaturas.mjs --ver    so imprime, sem gravar
//
// POR QUE E GERADO. O estado (43 de 64 monstros com folha, 10 de 21 NPCs...) vivia
// so em conversa, e envelhece a cada criatura nova. Aqui ele sai do que o codigo
// DIZ: as fichas em `rules/monsters/*.js` e `rules/npcs.js`, as folhas em
// `art/folhas/index.js` e os perfis em `dev/importar-pixellab.py`. So o que o
// codigo nao sabe (decisoes, roteiro, pendencias) fica escrito a mao, FORA dos
// marcadores `<!-- GERADO:INICIO -->` e `<!-- GERADO:FIM -->`.
//
// O QUE ELE NAO SABE, e diz: se o dono aprovou, e quanto custou. Isso fica no
// historico do git e nas conversas.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ler = (p) => readFileSync(join(RAIZ, p), 'utf8');
const carregar = (p) => import(pathToFileURL(join(RAIZ, p)).href);

const { GOBLINOIDES } = await carregar('src/rules/monsters/goblinoides.js');
const { HUMANOIDES } = await carregar('src/rules/monsters/humanoides.js');
const { FERAS } = await carregar('src/rules/monsters/feras.js');
const { MORTOS_VIVOS } = await carregar('src/rules/monsters/mortosvivos.js');
const { ABERRACOES } = await carregar('src/rules/monsters/aberracoes.js');
const { NPCS } = await carregar('src/rules/npcs.js');
const { HEROIS } = await carregar('src/game/herois.js');

const FAMILIAS = [
  ['Goblinoides', GOBLINOIDES], ['Humanoides', HUMANOIDES], ['Feras', FERAS],
  ['Mortos-vivos', MORTOS_VIVOS], ['Aberrações, limos e o dragão', ABERRACOES],
];

// ---- as folhas registradas: `base` -> variantes ---------------------------------
const index = ler('src/art/folhas/index.js');
const folhas = new Map();      // base -> { chaves: [], voo: bool }
for (const m of index.matchAll(/^ {2}(?:'([^']+)'|(\w+)): \{\s*base: '([^']+)'([^}]*)\}/gm)) {
  const chave = m[1] ?? m[2];
  const base = m[3];
  const f = folhas.get(base) ?? { chaves: [], voo: false };
  f.chaves.push(chave);
  if (/estado: 'voo'/.test(m[4])) f.voo = true;
  folhas.set(base, f);
}

// ---- como cada uma foi importada (perfis do importador) -------------------------
const importador = ler('src/dev/importar-pixellab.py');
const estaticos = new Set([...importador.matchAll(/'(\w+)': \{'estatico': True/g)].map((m) => m[1]));
const ataqueParado = new Set([...importador.matchAll(/'(\w+)': \{'ataque_parado': True/g)].map((m) => m[1]));

const arqs = readdirSync(join(RAIZ, 'src/art/folhas'));
function metaDe(base) {
  try { return JSON.parse(ler(`src/art/folhas/${base}.json`)); } catch { return null; }
}

/** A base de folha de um `look` (`dragaoVerdeJovem@nenhuma-garra` -> `dragaoVerdeJovem`). */
const baseDe = (look) => String(look ?? '').split('@')[0].split('~')[0];

function animacao(base) {
  if (!folhas.has(base)) return null;
  const meta = metaDe(base);
  const partes = [];
  if (estaticos.has(base)) partes.push('parada: vistas e queda');
  else if (ataqueParado.has(base)) partes.push('anda; não ataca');
  else partes.push('completa');
  if (meta?.anims?.conjurar) partes.push('+ conjurar');
  const f = folhas.get(base);
  if (f.voo) partes.push('+ voo');
  if (f.chaves.length > 1 + (f.voo ? 1 : 0)) partes.push(`${f.chaves.length - (f.voo ? 1 : 0)} armas/aparências`);
  return partes.join(' · ');
}

// ---- onde cada criatura aparece --------------------------------------------------
const ondeFicam = ['src/game', 'src/rules/encontros-estrada.js', 'src/rules/spells.js', 'src/rules/utilidade.js'];
const textos = [];
for (const d of ondeFicam) {
  if (d.endsWith('.js')) { textos.push([d.split('/').pop(), ler(d)]); continue; }
  for (const f of readdirSync(join(RAIZ, d)).filter((x) => x.endsWith('.js'))) textos.push([f, ler(`${d}/${f}`)]);
}
const ROTULO = (f) => f.replace(/\.js$/, '')
  .replace('capitulo4-', '').replace('capitulo3-', '').replace('capitulo2', 'covil').replace('capitulo1', 'estrada')
  .replace('encontros-estrada', 'estrada (sorteio)').replace('utilidade', 'familiar').replace('spells', 'magia');
function aparece(id) {
  // So onde o id e CRIADO: primeiro argumento de uma chamada (`makeMonster('x'`,
  // `nasce('x'`, `m('x'`), `defId: 'x'` ou `id: 'x'`. Um `'guarda'` solto e nome de
  // sala, e `'mago'` aparece em texto de magia.
  const re = new RegExp(`(?:\\(\\s*|defId:\\s*|\\bid:\\s*)['"]${id}['"]`);
  return [...new Set(textos.filter(([f, t]) => re.test(t) && !/^(criacao|herois|magias-fora)/.test(f)).map(([f]) => ROTULO(f)))];
}

// Notas que o codigo nao sabe dizer.
const NOTAS = {
  plebeu: 'bloco dos Dendrar (Mirna, Nars, Nilsa), que têm desenho próprio',
  dragaoVerdeJovem: 'o Venomfang; tamanho grande reservado ao dragão adulto',
  ratoFamiliar: 'invocado pela magia Convocar Familiar do mago',
  morcegoFamiliar: 'invocado pela magia Convocar Familiar do mago; paira',
  tigreDenteDeSabre: 'pacote de Conjurar Animais (druida)',
  javaliGigante: 'pacote de Conjurar Animais (druida)',
  ursoNegro: 'pacote de Conjurar Animais (druida)',
  cabraGigante: 'pacote de Conjurar Animais (druida)',
  wraith: 'o Mormesk',
};

const linhasMonstro = (id, d) => {
  const base = baseDe(d.look);
  const tem = folhas.has(base);
  const onde = aparece(id).join(', ') || '—';
  const nota = NOTAS[id] ? ` ${NOTAS[id]}.` : '';
  return `| \`${id}\` | ${d.name} | ${d.size ?? 'médio'} | ${d.cr ?? '—'} | ${tem ? '✅' : '❌'} | ${tem ? animacao(base) : '—'} | ${onde}${nota ? ' ·' + nota : ''} |`;
};

// ---- monta o bloco ---------------------------------------------------------------
const todos = FAMILIAS.flatMap(([, f]) => Object.entries(f));
const comFolha = todos.filter(([, d]) => folhas.has(baseDe(d.look)));
const desenhos = new Set(comFolha.map(([, d]) => baseDe(d.look)));
const npcs = Object.entries(NPCS);
// O Mormesk e o `wraith` com nome proprio: a folha e a do wraith.
const baseDoNpc = (id, d) => (id === 'mormesk' ? 'wraith' : baseDe(d.look));
const npcCom = npcs.filter(([id, d]) => folhas.has(baseDoNpc(id, d)));
const heroiCom = HEROIS.filter((h) => arqs.some((a) => a.startsWith(`${h.name.toLowerCase()}-`) && a.endsWith('.png')));
const pngs = arqs.filter((a) => a.endsWith('.png') && !['cenario.png', 'chao.png'].includes(a));

const out = [];
out.push('## Resumo');
out.push('');
out.push('| | Com ficha | Com folha desenhada | Sem folha |');
out.push('|---|---:|---:|---:|');
out.push(`| **Monstros** | ${todos.length} | **${comFolha.length}** (${desenhos.size} desenhos distintos) | ${todos.length - comFolha.length} |`);
out.push(`| **NPCs** | ${npcs.length} | **${npcCom.length}** | ${npcs.length - npcCom.length} |`);
out.push(`| **Heróis** | ${HEROIS.length} | **${heroiCom.length}** | ${HEROIS.length - heroiCom.length} |`);
out.push('');
out.push(`${pngs.length} arquivos de folha em \`src/art/folhas/\`: a maioria são variantes de equipamento dos heróis, então o número de PNGs não conta criaturas.`);
out.push('');

for (const [nome, fam] of FAMILIAS) {
  out.push(`### ${nome}`);
  out.push('');
  out.push('| id | nome | tamanho | ND | folha | animação | aparece em |');
  out.push('|---|---|---|---|:-:|---|---|');
  for (const [id, d] of Object.entries(fam)) out.push(linhasMonstro(id, d));
  out.push('');
}

out.push('### NPCs');
out.push('');
out.push('Só os NPCs que ficam **no tabuleiro** precisam de folha; os outros aparecem em telas de conversa.');
out.push('');
out.push('| id | nome | folha | animação | bloco |');
out.push('|---|---|:-:|---|---|');
for (const [id, d] of npcs) {
  const base = baseDoNpc(id, d);
  const tem = folhas.has(base);
  const extra = id === 'mormesk' ? ' (usa a folha do `wraith`)' : '';
  out.push(`| \`${id}\` | ${d.nome} | ${tem ? '✅' : '—'} | ${tem ? animacao(base) : '—'} | \`${d.bloco ?? '—'}\`${extra} |`);
}
out.push('');

out.push('### Heróis');
out.push('');
out.push('| nome | classe | folhas |');
out.push('|---|---|---|');
for (const h of HEROIS) {
  const n = arqs.filter((a) => a.startsWith(`${h.name.toLowerCase()}-`) && a.endsWith('.png')).length;
  out.push(`| ${h.name} | ${h.className} | ${n ? `✅ ${n} variantes de equipamento` : '❌'} |`);
}
out.push('');

out.push('### Sem folha, por prioridade');
out.push('');
const sem = todos.filter(([, d]) => !folhas.has(baseDe(d.look)));
const emCena = sem.filter(([id]) => aparece(id).length);
out.push(`- **Aparecem no jogo hoje** (em cena, ou invocados por magia): ${emCena.length ? emCena.map(([id]) => `\`${id}\` (${aparece(id).join(', ')})`).join('; ') : 'nenhuma'}.`);
out.push(`- **Só existem no bestiário** (nenhuma cena os coloca): ${sem.filter(([id]) => !aparece(id).length).map(([id]) => `\`${id}\``).join(', ') || 'nenhuma'}.`);
out.push('');

const bloco = out.join('\n');
const ini = '<!-- GERADO:INICIO -->';
const fim = '<!-- GERADO:FIM -->';
const aviso = '<!-- Este bloco é gerado por `node src/dev/criaturas.mjs`. Não edite à mão. -->';

if (process.argv.includes('--ver')) {
  console.log(bloco);
} else {
  const arq = join(RAIZ, 'CRIATURAS.md');
  const atual = readFileSync(arq, 'utf8');
  const a = atual.indexOf(ini);
  const b = atual.indexOf(fim);
  if (a < 0 || b < 0) throw new Error('CRIATURAS.md sem os marcadores GERADO:INICIO / GERADO:FIM');
  writeFileSync(arq, `${atual.slice(0, a + ini.length)}\n${aviso}\n\n${bloco}\n${atual.slice(b)}`, 'utf8');
  console.log(`CRIATURAS.md: ${todos.length} monstros (${comFolha.length} com folha), ${npcs.length} NPCs (${npcCom.length}), ${HEROIS.length} heróis (${heroiCom.length}).`);
}
