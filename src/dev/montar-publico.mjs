// O `public/` DA PUBLICAÇÃO: só o que o repositório contém.
//
//   node src/dev/montar-publico.mjs        # monta `.publico/` (roda sozinho no `prebuild`)
//
// O Vite copia o `publicDir` inteiro para o `dist/`. No `npm run dev` ele é o `public/` de sempre, com a arte de
// terceiros que vive no disco de quem a baixou (os battlemaps da Forgotten Adventures, os mapas oficiais, a figura
// inteira de cada criatura) — joga-se com ela aqui. No `npm run build` ele passa a ser `.publico/`, montado por este
// script com os arquivos de `public/` que o git CONHECE: os commitados e os novos ainda não commitados, menos tudo o
// que o `.gitignore` marca para ficar de fora. A regra é a mesma do `verificar-publicavel.mjs` (o `.gitignore` é a
// declaração de "isto não pertence ao projeto, e não se publica"); a diferença é que antes ele FALHAVA o build e
// obrigava a tirar a arte de `public/` à mão, e agora o build simplesmente não a leva.
//
// Sem git (uma cópia sem `.git`), não há como saber o que é de terceiro: o script se recusa a montar, e o build para.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ignoradosEmPublic } from './verificar-publicavel.mjs';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DESTINO = join(RAIZ, '.publico');

let lista;
try {
  lista = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z', 'public/'],
    { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\0').filter(Boolean);
} catch {
  console.error('montar-publico: sem git aqui, não dá para separar o que é do projeto do que é de terceiro. Build parado.');
  process.exit(1);
}

rmSync(DESTINO, { recursive: true, force: true });
mkdirSync(DESTINO, { recursive: true });
let copiados = 0;
for (const arq of lista) {
  const de = join(RAIZ, arq);
  if (!existsSync(de)) continue; // apagado no disco e ainda no índice
  const para = join(DESTINO, arq.replace(/^public\//, ''));
  mkdirSync(dirname(para), { recursive: true });
  cpSync(de, para);
  copiados += 1;
}
const fora = ignoradosEmPublic(RAIZ) ?? [];
console.log(`publicação: ${copiados} arquivo(s) de public/ vão para o build; ${fora.length} ignorado(s) pelo git ficam de fora.`);
