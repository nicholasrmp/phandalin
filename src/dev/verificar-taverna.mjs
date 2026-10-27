// Confere que a arte da taverna está nos atlas (cenário, chão e faces). Quem regera um atlas com os montadores (`montar-*.py`) a
// apaga; os montadores já chamam `acrescentar-taverna.py` no fim, e este arquivo é a rede de segurança: roda antes do `npm run build`
// (script `prebuild`) e falha a publicação se algo sumiu.
//
//   node src/dev/verificar-taverna.mjs

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const ler = (f) => readFileSync(new URL(`../art/folhas/${f}`, import.meta.url), 'utf8');

/** O que falta: lista de frases. Vazia = tudo no lugar. */
export function faltamDaTaverna() {
  const fonte = readFileSync(new URL('../game/taverna.js', import.meta.url), 'utf8');
  const pecas = [...new Set([...fonte.matchAll(/peca\('([a-zA-Z0-9]+)'/g)].map((m) => m[1]))];
  const cenario = ler('cenario.json');
  const faltas = pecas.filter((p) => !cenario.includes(`"prop-taverna-${p}"`)).map((p) => `peça "${p}" no atlas de cenário`);
  if (!ler('chao.json').includes('tabuasTaverna')) faltas.push('o piso de tábuas no atlas do chão');
  if (!ler('faces.json').includes('tijolo')) faltas.push('a parede de tijolo no atlas das faces');
  return { pecas: pecas.length, faltas };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { faltas } = faltamDaTaverna();
  if (faltas.length) {
    console.error(`A arte da taverna sumiu dos atlas (algum montador os regerou):\n  - ${faltas.join('\n  - ')}\nRode: python -P src/dev/acrescentar-taverna.py`);
    process.exit(1);
  }
  console.log('arte da taverna: ok');
}
