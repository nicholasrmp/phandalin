// AS LUZES DE CADA CENA CONTRA A CENA DO FOUNDRY DA FA, sem copiar coordenada à mão: foi copiando que a Onda Eco ficou quatro casas ao
// sul. Lê o JSON em `mapas/_cenas/` (que não entra no repositório) com a mesma moldura de `importar-foundry.py`, e casa cada luz da FA
// com a nossa mais perto. Não decide nada: brilho de teto sem chama pintada não precisa virar luz, e quem julga isso é o desenho.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/conferir-luzes-fa.mjs [--raio 2]
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const RAIZ = process.cwd();
const importar = (rel) => import(pathToFileURL(`${RAIZ}/${rel}`).href);
const argumento = (nome, reserva) => { const i = process.argv.indexOf(nome); return i >= 0 ? Number(process.argv[i + 1]) : reserva; };
const RAIO = argumento('--raio', 2);

/** O mapa de verdade de cada cena (`mapaDo`, com o que `encounter.js` acrescenta) e a cena da FA por baixo dele. */
const CENAS = [
  ['Esconderijo', 'cragmaw-hideout-30x20', 'esconderijo'],
  ['Mansão', 'redbrand-hideout-30x20', 'mansao'],
  ['Castelo', 'cragmaw-castle-31x22', 'castelo'],
  ['Poço', 'old-owl-well-18x22', 'poco'],
  ['Cume', 'wyvern-tor-18x24', 'cume'],
  ['Árvore-Trovão', 'ruins-of-thundertree-58x38', 'arvoreTrovao'],
  ['Onda Eco', 'wave-echo-cave-73x90', 'ondaEco'],
  ['Caverna do poço', 'well-cavern-17x25', 'cavernaDoPoco'],
  ['Acampamento', 'goblin-camp-18x23', 'acampamentoSawplee'],
  ['Telhado', 'roof-top-stash-17x22', 'telhadoGigante'],
];
const { mapaDo } = await importar('src/game/encounter.js');

/** A mesma conta de `importar-foundry.py origem`: cada eixo tem a sua moldura. */
function origem(cena) {
  const g = cena.grid.size;
  const p = cena.padding ?? 0;
  return [Math.ceil((p * cena.width) / g) * g, Math.ceil((p * cena.height) / g) * g];
}

for (const [nome, arquivo, variante] of CENAS) {
  const caminho = `${RAIZ}/mapas/_cenas/${arquivo}.json`;
  if (!fs.existsSync(caminho)) { console.log(`\n${nome}: sem ${arquivo}.json no disco`); continue; }
  const cena = JSON.parse(fs.readFileSync(caminho, 'utf8'));
  const [ox, oy] = origem(cena);
  const g = cena.grid.size;
  let mapa = null;
  try { mapa = mapaDo(variante); } catch (e) { console.log(`\n${nome}: não abri o mapa (${e.message})`); continue; }
  const nossas = mapa?.luzes ?? [];
  const daFa = (cena.lights ?? []).map((l) => ({
    x: (l.x - ox) / g, y: (l.y - oy) / g, oculta: Boolean(l.hidden), claro: l.config?.bright ?? 0, penumbra: l.config?.dim ?? 0,
    cor: l.config?.color ?? null, animacao: l.config?.animation?.type ?? null,
  })).filter((l) => l.x >= 0 && l.y >= 0);
  console.log(`\n${nome}: ${daFa.length} luzes na FA, ${nossas.length} nossas${mapa ? '' : ' (sem mapa nosso para comparar)'}`);
  const usadas = new Set();
  for (const l of daFa) {
    const perto = nossas.map((n, i) => [Math.hypot(n.pos.x + 0.5 - l.x, n.pos.y + 0.5 - l.y), i]).sort((a, b) => a[0] - b[0])[0];
    const casa = perto && perto[0] <= RAIO;
    if (casa) usadas.add(perto[1]);
    const cx = Math.floor(l.x); const cy = Math.floor(l.y);
    const t = mapa?.terreno?.[cy]?.[cx] ?? '?';
    const brilho = mapa?.luz?.[cy]?.[cx] ?? '?';
    const n = casa ? nossas[perto[1]] : null;
    console.log(`  FA ${l.x.toFixed(1)},${l.y.toFixed(1)} ${String(l.claro).slice(0, 5)}/${String(l.penumbra).slice(0, 5)} ${l.cor ?? ''} ${l.animacao ?? ''}${l.oculta ? ' APAGADA' : ''} | terreno ${t} grade ${brilho} | ${n ? `nossa ${n.pos.x},${n.pos.y} ${n.tipo} ${n.claro}/${n.penumbra}${n.apagada ? ' apagada' : ''}` : 'SEM PAR'}`);
  }
  nossas.forEach((n, i) => { if (!usadas.has(i)) console.log(`  NOSSA sem par na FA: ${n.pos.x},${n.pos.y} ${n.tipo} ${n.claro}/${n.penumbra}`); });
}
