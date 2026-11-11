// O AVISO dos importadores: o que entrou no jogo sem ícone de traço. Cada importador (magias, subclasses, talentos) o
// chama no fim. Roda num processo à parte porque o importador acabou de ESCREVER os arquivos de regra, e os módulos já
// carregados aqui seriam os de antes.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));

export function avisarIconesFaltando(tipo) {
  const r = spawnSync(process.execPath, ['--import', './src/dev/cena-node/register.mjs', 'src/dev/inventario-icones.mjs', '--faltando', tipo],
    { cwd: RAIZ, encoding: 'utf8' });
  const saida = (r.stdout || r.stderr || '').trim();
  if (saida) console.log(saida);
}
