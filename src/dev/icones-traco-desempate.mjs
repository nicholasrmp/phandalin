// O DESEMPATE dos ícones de traço: duas MAGIAS diferentes (ou duas CARACTERÍSTICAS) com o mesmo desenho e a mesma cor
// viram dois azulejos iguais na barra de quem tem as duas. Os lotes do de-para foram escolhidos em paralelo e não se
// viam, e a primeira conta achou 64 pares de magia (Ajuda e Cura Total, Contramágica e Aura Mágica do Arcanista, Escudo
// Arcano e Invulnerabilidade) e 52 de característica.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/icones-traco-desempate.mjs
//
// O primeiro de cada grupo (na ordem dos lotes) fica com o desenho; os outros ganham um SELO no canto: a magia, o da
// escola dela; a característica, o emblema da classe. Escreve `src/dev/icones-traco/mapa-zy-desempate.json`, lido depois
// dos lotes e antes dos ajustes à mão (`mapa-zz-ajustes.json`), e explícito de propósito: dá para ler e corrigir uma
// linha, em vez de o gerador decidir calado. Rode de novo quando um lote mudar, e depois `importar-icones-traco.mjs`.
//
// Ficam de fora os itens (o anel sem nome e a varinha sem nome SÃO o mesmo objeto) e as condições (a condição repete o
// desenho da magia ou da característica que a causa, de propósito: Fúria é Fúria).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPELLS } from '../rules/spells.js';
import { CLASSES } from '../rules/classes/index.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MAPAS = path.join(RAIZ, 'src', 'dev', 'icones-traco');
const SAIDA = path.join(MAPAS, 'mapa-zy-desempate.json');
const dados = JSON.parse(fs.readFileSync(path.join(RAIZ, 'public', 'icones-traco.json'), 'utf8'));

// o mapa SEM o desempate anterior (senão ele se desempata de si mesmo) e na ordem dos lotes
const mapa = {};
for (const f of fs.readdirSync(MAPAS).filter((x) => /^mapa-.*\.json$/.test(x) && x !== 'mapa-zy-desempate.json').sort()) {
  const lote = JSON.parse(fs.readFileSync(path.join(MAPAS, f), 'utf8'));
  delete lote._nota;
  Object.assign(mapa, lote);
}

const SELO_DA_ESCOLA = {
  abjuração: 'shield', adivinhação: 'eyeball', conjuração: 'portal', encantamento: 'charm', evocação: 'sparkles',
  ilusão: 'domino-mask', necromancia: 'death-skull', transmutação: 'cycle',
};
// a classe de cada característica: as tabelas de nível da classe e de cada subclasse
const classeDe = {};
for (const [cid, c] of Object.entries(CLASSES)) {
  const anotar = (niveis) => { for (const fs2 of Object.values(niveis ?? {})) for (const f of fs2) classeDe[f] ??= cid; };
  anotar(c.niveis);
  for (const s of Object.values(c.subclasse?.opcoes ?? {})) anotar(s.niveis);
}
const emblema = (cid) => mapa[`classe-${cid}`];

const desempate = {};
for (const prefixo of ['magia-', 'classe-']) {
  const grupos = new Map();
  for (const [k, v] of Object.entries(mapa)) {
    if (!k.startsWith(prefixo) || v.includes('+')) continue;
    const g = `${v}|${dados.familias?.[k] ?? ''}`;
    if (!grupos.has(g)) grupos.set(g, []);
    grupos.get(g).push(k);
  }
  for (const [g, ks] of grupos) {
    if (ks.length < 2) continue;
    const base = g.split('|')[0];
    const usados = new Set();
    for (const k of ks.slice(1)) {
      const id = k.slice(prefixo.length);
      let selo = prefixo === 'magia-' ? SELO_DA_ESCOLA[SPELLS[id]?.school] : emblema(classeDe[id]);
      // dois do mesmo grupo com o mesmo selo seguiriam iguais: o segundo leva o selo genérico de magia
      if (!selo || usados.has(selo) || selo === base) selo = usados.has('magic-swirl') ? 'rolling-energy' : 'magic-swirl';
      usados.add(selo);
      desempate[k] = `${base}+${selo}`;
    }
  }
}
fs.writeFileSync(SAIDA, JSON.stringify({ _nota: 'GERADO por src/dev/icones-traco-desempate.mjs: o segundo de cada par igual ganha o selo da escola (magia) ou da classe (característica).', ...desempate }, null, 1));
console.log(`${Object.keys(desempate).length} chaves desempatadas -> ${path.relative(RAIZ, SAIDA)}`);
