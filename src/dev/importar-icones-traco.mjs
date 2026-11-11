// OS ÍCONES DE TRAÇO do tema Obsidiana: o de-para escrito à mão (`src/dev/icones-traco/mapa-*.json`, chave do nosso
// catálogo -> nome na game-icons.net) vira `public/icones-traco.json`, com o desenho de cada ícone usado e nada mais.
//
//   node src/dev/importar-icones-traco.mjs
//
// A COLEÇÃO é a game-icons.net (Lorc, Delapouite e colaboradores), CC BY 3.0: pode entrar no jogo e na publicação, com o
// crédito, que vai no próprio arquivo e na tela de créditos. É a coleção que o sistema 5e do Foundry usa. O pacote vem
// do npm para `_referencias/game-icons/` (fora do repositório): `npm pack @iconify-json/game-icons@1.2.4` e descompactar.
//
// Cada desenho é só caminho (`<path d="...">`) numa caixa de 512. Os números vão com uma casa decimal (cortada, não arredondada): o erro se acumula
// nos comandos relativos, mas fica abaixo de 0,3 px num ícone de 32. O jogo baixa o arquivo no tema Obsidiana e
// `art/icons.js ativarIconesDeTraco` desenha o caminho no lugar dos pixels; a chave sem de-para segue em pixel.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PACOTE = path.join(RAIZ, '_referencias', 'game-icons', 'package', 'icons.json');
const MAPAS = path.join(RAIZ, 'src', 'dev', 'icones-traco');
const SAIDA = path.join(RAIZ, 'public', 'icones-traco.json');

if (!fs.existsSync(PACOTE)) {
  console.error(`Falta ${PACOTE}.\nRode, dentro de _referencias/game-icons/: npm pack @iconify-json/game-icons@1.2.4 e descompacte o .tgz.`);
  process.exit(1);
}
const colecao = JSON.parse(fs.readFileSync(PACOTE, 'utf8')).icons;
// A RÉGUA é o inventário do que o jogo pode pedir (`inventario-icones.mjs`), não o catálogo de pixel: é o que deixa a
// magia do Xanathar, a subclasse do Tasha e o talento entrarem sem nunca terem tido pixel.
const { inventarioDeIcones } = await import('./inventario-icones.mjs');
const inventario = inventarioDeIcones();
const chaves = new Set(inventario.map((x) => x.chave));

const mapa = {};
for (const f of fs.readdirSync(MAPAS).filter((x) => /^mapa-.*\.json$/.test(x)).sort()) {
  const lote = JSON.parse(fs.readFileSync(path.join(MAPAS, f), 'utf8'));
  delete lote._nota;
  Object.assign(mapa, lote);
}

// OS DESENHOS PRÓPRIOS (`src/dev/icones-traco/proprios/gerados.json`, de `src/dev/vetorizar-icones-openart.py`): os
// ícones gerados no OpenArt para o jogo, já em caminho SVG na caixa de 512. Entram como `proprio:<chave>`; o de-para só
// aponta para eles quando o dono escolhe na página Escolha dos Ícones (`mapa-zzz-escolhas.json`, o último lido: a escolha
// dele vale por cima dos lotes, do desempate e dos ajustes).
const arqProprios = path.join(MAPAS, 'proprios', 'gerados.json');
const proprios = fs.existsSync(arqProprios) ? JSON.parse(fs.readFileSync(arqProprios, 'utf8')) : {};
const existe = (n) => (n.startsWith('proprio:') ? Boolean(proprios[n.slice(8)]) : Boolean(colecao[n]));

// o valor é um nome ou um composto `base+selo` (o selo pequeno no canto, `art/icons.js desenharTraco`)
const partes = (v) => v.split('+');
const problemas = [];
for (const [k, v] of Object.entries(mapa)) {
  if (!chaves.has(k)) problemas.push(`chave que o jogo não pede: ${k}`);
  if (partes(v).length > 2) problemas.push(`composto de mais de dois: ${k} -> ${v}`);
  for (const n of partes(v)) if (!existe(n)) problemas.push(`ícone que a coleção não tem: ${k} -> ${n}`);
}
if (problemas.length) {
  console.error(problemas.join('\n'));
  process.exit(1);
}

// CORTA a partir da segunda casa decimal, e não arredonda. No SVG `1.04.5` são dois números (1,04 e ,5): arredondar o
// primeiro para `1` os gruda em `1.5`, e o desenho se desfaz — foi o que deixou vazios a Ação Ardilosa, o mangual e as
// botas na primeira folha de contato. Cortar nunca mexe na parte inteira nem no ponto, então a fronteira fica.
const umaCasa = (d) => d.replace(/(\.\d)\d+/g, '$1');
// A conferência que pegaria o arredondamento antigo: o caminho cortado tem de ter os mesmos números que o original.
const contarNumeros = (d) => (d.match(/-?(?:\d+\.?\d*|\.\d+)/g) ?? []).length;
const desenhos = {};
for (const nome of new Set(Object.values(mapa).flatMap(partes))) {
  if (nome.startsWith('proprio:')) { desenhos[nome] = proprios[nome.slice(8)]; continue; }
  desenhos[nome] = [...colecao[nome].body.matchAll(/ d="([^"]+)"/g)].map((m) => {
    const d = umaCasa(m[1]);
    if (contarNumeros(d) !== contarNumeros(m[1])) throw new Error(`o corte grudou números em ${nome}`);
    return d;
  });
}

// A FAMÍLIA DE COR de cada chave (`inventario-icones.mjs`): o tema Esmalte pinta cada uma com o degradê da família dela
// (`art/icons.js PALETA_DO_ESMALTE`). A paleta mora no código, então trocar uma cor não pede rodar isto de novo.
const familias = {};
for (const x of inventario) if (mapa[x.chave] && x.familia) familias[x.chave] = x.familia;
// A COR QUE O DONO CORRIGIU (`familias-escolhas.json`, da mesma página): vale por cima da calculada.
const arqFamilias = path.join(MAPAS, 'familias-escolhas.json');
const familiasDoDono = fs.existsSync(arqFamilias) ? JSON.parse(fs.readFileSync(arqFamilias, 'utf8')) : {};
delete familiasDoDono._nota;

// A COR POR PEÇA (`src/dev/icones-traco/pecas.json`, de `src/dev/pecas-icones.py gerar`): { chave: [{ d, familia }] }.
// A família tem de existir na paleta, senão a peça sairia na cor da base sem ninguém ver.
const { PALETA_DO_ESMALTE } = await import('../art/icons.js');
const arqPecas = path.join(MAPAS, 'pecas.json');
const pecas = fs.existsSync(arqPecas) ? JSON.parse(fs.readFileSync(arqPecas, 'utf8')) : {};
for (const [k, lista] of Object.entries(pecas)) {
  if (!mapa[k]) problemas.push(`peça de chave sem ícone: ${k}`);
  for (const pc of lista) if (!PALETA_DO_ESMALTE[pc.familia]) problemas.push(`peça de ${k} em família que a paleta não tem: ${pc.familia}`);
  // a peça é recorte de UM desenho: trocado o ícone da chave, ela pintaria a forma antiga por cima da nova
  for (const pc of lista) if (mapa[k] && pc.base !== partes(mapa[k])[0]) problemas.push(`peça de ${k} recortada de ${pc.base}, e o ícone agora é ${mapa[k]}: tire-a de pecas.json`);
}
for (const [k, fam] of Object.entries(familiasDoDono)) {
  if (!mapa[k]) problemas.push(`cor do dono para chave sem ícone: ${k}`);
  else if (!PALETA_DO_ESMALTE[fam]) problemas.push(`cor do dono em família que a paleta não tem: ${k} -> ${fam}`);
  else familias[k] = fam;
}
if (problemas.length) {
  console.error(problemas.join('\n'));
  process.exit(1);
}

const saida = {
  _credito: 'Ícones de game-icons.net (Lorc, Delapouite e colaboradores), licença CC BY 3.0 — https://game-icons.net',
  lado: 512,
  mapa,
  familias,
  pecas,
  desenhos,
};
fs.writeFileSync(SAIDA, JSON.stringify(saida));
const semMapa = [...chaves].filter((k) => !mapa[k]);
const compostos = Object.values(mapa).filter((v) => v.includes('+')).length;
console.log(`${Object.keys(mapa).length} chaves com ícone de traço (${compostos} compostos, ${Object.keys(familias).length} com família de cor, ${Object.keys(pecas).length} com cor por peça), ${Object.keys(desenhos).length} desenhos, ${(fs.statSync(SAIDA).size / 1024).toFixed(0)} KB.`);
console.log(`${semMapa.length} coisas do jogo sem ícone de traço${semMapa.length ? `: ${semMapa.slice(0, 20).join(', ')}${semMapa.length > 20 ? '...' : ''}` : ''}.`);
