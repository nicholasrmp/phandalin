// O BUILD NÃO PUBLICA O QUE O REPOSITÓRIO NÃO CONTÉM.
//
//   node src/dev/verificar-publicavel.mjs            # falha se houver arquivo ignorado dentro de `public/`
//   node src/dev/verificar-publicavel.mjs --avisar   # só avisa, não falha
//
// Roda no `prebuild`, junto com o `verificar-taverna.mjs`.
//
// POR QUE ELE EXISTE. O `.gitignore` protege o REPOSITÓRIO; ele não protege o `dist/`. O Vite copia `public/`
// inteiro para o build, então um battlemap de terceiro largado ali viaja para o deploy mesmo estando fora do
// versionamento — e aí deixa de ser uso pessoal e vira publicação, que é justamente o que a licença da
// Forgotten Adventures (e a de quase todo mapa comprado) proíbe. Entre descobrir isso agora e descobrir depois
// de o site estar no ar, a conta não é parecida.
//
// A REGRA, e por que é esta. Nada dentro de `public/` pode estar ignorado pelo git. O `.gitignore` é a
// declaração explícita de "isto não pertence ao projeto"; se não pertence, não se publica. A regra não precisa
// saber o nome de pasta nenhuma, então vale para o próximo mapa baixado sem ninguém lembrar de atualizá-la.
//
// Arquivo NOVO e ainda não commitado passa de propósito: é trabalho em andamento, não arte de terceiro. O que
// pega é o que alguém marcou para ficar de fora.
//
// COMO CONSERTAR, quando ele acusar: tire o arquivo de `public/` (a arte de referência vive em `/mapas/`, fora
// do servidor), ou, se a arte for nossa e estiver ignorada por engano, conserte o `.gitignore` e commite.
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Os arquivos de `public/` que o git ignora. Devolve `null` quando não há git (aí não há o que conferir). */
export function ignoradosEmPublic(raiz = RAIZ) {
  let saida;
  try {
    saida = execFileSync('git', ['ls-files', '--others', '--ignored', '--exclude-standard', 'public/'],
      { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
  return saida.split('\n').map((l) => l.trim()).filter(Boolean);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const achados = ignoradosEmPublic();
  if (achados === null) {
    console.log('publicável: sem git aqui, nada a conferir');
  } else if (achados.length) {
    const avisar = process.argv.includes('--avisar');
    console[avisar ? 'warn' : 'error'](
      `${achados.length} arquivo(s) IGNORADO(S) pelo git dentro de public/ — o build os copiaria para dist/ e o`
      + ` deploy os publicaria:\n  - ${achados.join('\n  - ')}\n`
      + 'Tire-os de public/ (arte de referência de terceiro vive em /mapas/, fora do servidor), ou conserte o'
      + ' .gitignore e commite, se a arte for nossa.');
    if (!avisar) process.exit(1);
  } else {
    console.log('publicável: nada de ignorado em public/');
  }
}
