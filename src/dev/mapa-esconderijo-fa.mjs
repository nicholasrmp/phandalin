// GERA o mapa do Esconderijo Cragmaw (`game/esconderijo.js`) sobre o battlemap da Forgotten Adventures.
//
//   python src/dev/importar-foundry.py <cragmaw-hideout-30x20.json> public/mapas/esconderijo-fa.webp \
//       --editor src/dev/_tmp/esconderijo-fa.json
//   node --import ./src/dev/cena-node/register.mjs src/dev/mapa-esconderijo-fa.mjs [src/dev/_tmp/esconderijo-fa.json]
//
// O primeiro passo traz da cena do Foundry o que ela sabe: a grade, as 371 paredes que barram passo (como traço
// livre) e a aresta de casa derivada delas. ESTE passo põe por cima o que o Foundry NÃO tem e o Capítulo 2 lê: o
// terreno por glifo (riacho, ponte, entulho, mato, suprimentos), a ALTURA e as SALAS — e escreve o módulo.
//
// Tudo o que está pintado aqui vem do de-para `revisoes/esconderijo-de-para-2026-11-04.md`, que leu o livro
// área por área e achou cada coisa no desenho da FA. Cada bloco abaixo diz o que o livro pede e onde o desenho a
// mostra. Mexeu aqui, rode de novo; à mão em `esconderijo.js` as camadas saem do lugar uma da outra.
//
// A REGRA DO MOTOR QUE MANDA NA ALTURA: degrau de UM nível se sobe (custa 5 pés a mais); de MAIS de um é parede
// (`grid.js stepBlocked`). Por isso a ponte, 6 m acima do canal, fica no nível 4 com o canal no 1 — de baixo não
// se sobe nela —, e o covil de cima, 3 m acima do de baixo, só se alcança pela escada natural.
//
// LICENÇA: a camada de regra que sai daqui é DADO derivado da cena da FA (o traçado das paredes). A arte não entra
// no repositório (`.gitignore`); este módulo entra. Se o repositório for público, isto também é redistribuição.
import fs from 'node:fs';
import { montarCampo } from '../game/campo.js';

const ENTRADA = process.argv[2] ?? 'src/dev/_tmp/esconderijo-fa.json';
const SAIDA = 'src/game/esconderijo.js';
const base = JSON.parse(fs.readFileSync(ENTRADA, 'utf8'));
const W = base.terreno[0].length;
const H = base.terreno.length;
const k = (x, y) => `${x},${y}`;
const casas = (...lista) => lista.map(([x, y]) => [x, y]);
const faixa = (x1, x2, y1, y2) => {
  const out = [];
  for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) out.push([x, y]);
  return out;
};

// ------------------------------------------------------------------------------------------------- as salas ---
// Uma âncora por área do livro, e a parede decide a fronteira: cada casa vai para a âncora mais perto ANDANDO.
// As âncoras são o que o desenho mostra de cada área (ver o de-para): a clareira da trilha, o abrigo de ripas, a
// câmara dos ossos, a subida ao lado do riacho, as tábuas da ponte, as duas fogueiras, os tanques.
const ANCORAS = [
  ['fora', 4, 16], ['vigias', 14, 17], ['canil', 15, 11], ['passagem', 12, 8],
  ['ponte', 15, 4], ['covil', 3, 6], ['pocos', 24, 5], ['chefe', 23, 13],
];
const campoBase = montarCampo(base);
const sala = new Map();
{
  const fila = [];
  for (const [nome, x, y] of ANCORAS) {
    if (campoBase.blocksMove(x, y)) throw new Error(`a âncora de ${nome} (${x},${y}) caiu na rocha`);
    sala.set(k(x, y), nome);
    fila.push([x, y]);
  }
  for (let i = 0; i < fila.length; i++) {
    const [x, y] = fila[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || sala.has(k(nx, ny))) continue;
      if (campoBase.blocksMove(nx, ny) || !campoBase.passa(x, y, nx, ny)) continue;
      sala.set(k(nx, ny), sala.get(k(x, y)));
      fila.push([nx, ny]);
    }
  }
}
// O livro: o mato da área 2 é do lado LESTE do riacho, e do oeste não se entra nele. O que a distância de
// caminhada pôs nos vigias a oeste do riacho (x ≤ 9) é a clareira da área 1.
for (const [chave, nome] of sala) {
  const [x] = chave.split(',').map(Number);
  if (nome === 'vigias' && x <= 9) sala.set(chave, 'fora');
}
const naSala = (nome) => [...sala].filter(([, n]) => n === nome).map(([c]) => c.split(',').map(Number));

// ------------------------------------------------------------------------------------------------ o terreno ---
const terreno = base.terreno.map((l) => [...l]);
const pintar = (glifo, lista) => {
  for (const [x, y] of lista) {
    if (terreno[y]?.[x] === undefined) throw new Error(`(${x},${y}) fora do mapa`);
    if (terreno[y][x] === 'R') throw new Error(`pintar '${glifo}' em (${x},${y}), que é rocha`);
    terreno[y][x] = glifo;
  }
};

// Área 1, a clareira da trilha, e área 2, o mato a leste do riacho.
pintar(',', naSala('fora'));
pintar('%', naSala('vigias'));                       // o mato: terreno difícil, meia cobertura (livro, área 2)
// O ABRIGO DE RIPAS, desenhado em (13,16)–(14,17): os vigias dentro, e as ripas do lado do riacho e da boca, que é
// de onde vem quem eles vigiam. `P` barra o passo e não a visão: é tábua com fresta, cobertura e não muro.
const CLAREIRA = casas([13, 15], [14, 15], [13, 16], [14, 16], [13, 17], [14, 17], [15, 16]);
pintar(',', CLAREIRA);
pintar('P', casas([12, 15], [12, 16], [12, 17]));
// O riacho lá fora: x 10–11, da boca até a borda de baixo.
const RIACHO_FORA = faixa(10, 11, 14, 19);
pintar('w', RIACHO_FORA);

// Área 4: o canal corre pelo lado OESTE da passagem (x 12), e a margem leste (x 13) é o caminho. A passagem
// lateral, do outro lado do riacho, sobe para oeste até o covil: é o entulho de y 6, com o ressalto frágil.
const RIACHO_DENTRO = [...faixa(12, 12, 7, 13), [11, 13], [13, 6], [14, 5], [14, 6], [15, 5], [15, 6]];
pintar('w', RIACHO_DENTRO);
const PASSAGEM_OESTE = faixa(8, 11, 6, 6);
pintar('x', PASSAGEM_OESTE);
const RESSALTO = casas([9, 6], [10, 6]);

// Área 3: a estalagmite das correntes, desenhada em (15,10); o lixo da chaminé na ponta leste.
pintar('A', casas([15, 10]));
const CHAMINE_BASE = [18, 12];
pintar('x', casas(CHAMINE_BASE, [17, 10]));

// Área 5: as tábuas da ponte, na diagonal, e o canal que passa por baixo dela (ver a altura).
//
// AS PAREDES DA FA DESENHAM A PONTE COM PATAMAR NAS DUAS PONTAS, e foi medindo isso que a altura saiu certa: as
// casas (14,3), (15,3) e (14,4) a noroeste, e (17,5) a sudeste, são muradas do lado do canal e abertas só para a
// tábua e para o túnel alto. São o chão onde a ponte apoia — nível 4, como ela. Postas no canal, no 1, elas
// ficavam soltas e a ponte não chegava ao túnel do sudeste: medido, a rota alta até os tanques não existia.
const PONTE = casas([15, 4], [16, 5]);
pintar('=', PONTE);
const PATAMARES = casas([14, 3], [15, 3], [14, 4], [17, 5], [17, 6]);
const CANAL_NORTE = [...faixa(16, 21, 3, 3), ...faixa(16, 21, 4, 4), [13, 5], [20, 5], ...faixa(17, 19, 2, 2)]
  .filter(([x, y]) => sala.get(k(x, y)) === 'ponte');
pintar('w', CANAL_NORTE);

// Área 6: a fogueira de cozinha em (3,6), na parte DE BAIXO, junto da entrada; os colchões; o barril encostado.
const FOGUEIRA_COVIL = [3, 6];
pintar('F', casas(FOGUEIRA_COVIL));
pintar('z', casas([4, 4], [5, 4], [3, 5], [6, 9], [8, 9]));
pintar('u', casas([2, 6]));

// Área 7: os dois tanques, o muro de pedra que segura a água na saída do canal, e a cachoeira a leste.
const POCO_1 = faixa(23, 25, 3, 4).filter(([x, y]) => sala.get(k(x, y)) === 'pocos');     // o de baixo: esvazia primeiro
const POCO_2 = faixa(24, 28, 5, 6).filter(([x, y]) => sala.get(k(x, y)) === 'pocos');
const DIQUE = casas([22, 3], [22, 4], [22, 5]);
pintar('W', POCO_1);
pintar('W', POCO_2);
pintar('W', casas([28, 7]));                         // onde a cachoeira cai
pintar('x', DIQUE);

// Área 8: a fogueira grande no meio; os suprimentos com a marca do leão azul ao sul e a leste; o baú escondido
// entre eles; e a abertura da chaminé na parede oeste, ao lado do buraco desenhado em (21,13).
const FOGUEIRA_KLARG = [23, 13];
pintar('F', casas(FOGUEIRA_KLARG));
const SUPRIMENTOS = casas([23, 16], [24, 16], [25, 16], [27, 16], [27, 15], [27, 14]);
pintar('s', SUPRIMENTOS);
const BAU = [26, 16];
pintar('K', casas(BAU));
const CHAMINE_TOPO = [21, 14];
pintar('x', casas(CHAMINE_TOPO));

// ------------------------------------------------------------------------------------------------- a altura ---
// 1 nível = 1,5 m. A caverna SOBE por dentro do morro (livro, características gerais).
const altura = Array.from({ length: H }, () => new Array(W).fill(0));
const nivel = (n, lista) => { for (const [x, y] of lista) altura[y][x] = n; };
nivel(0, naSala('fora'));
nivel(0, naSala('vigias'));
nivel(1, naSala('passagem'));                       // a subida da boca; `naPassagem` pede altura ≤ 1
nivel(2, PASSAGEM_OESTE);                           // a passagem oeste sobe até o nível do covil
nivel(2, naSala('canil'));                          // "alguns degraus" acima da passagem…
nivel(1, naSala('canil').filter(([x]) => x === 13)); // …e os degraus mesmo, na coluna da entrada
// O covil: a parte de baixo (norte, com a fogueira e a entrada) no 2; a de cima (sul), 3 m acima, no 4; a escada
// natural em (5,8), no 3. O resto da borda de y 7–8 vira degrau de dois níveis — parede.
const covil = naSala('covil');
nivel(2, covil.filter(([, y]) => y <= 7));
nivel(4, covil.filter(([, y]) => y >= 8));
const ESCADA_DO_COVIL = [5, 8];
nivel(3, casas(ESCADA_DO_COVIL));
nivel(3, casas([8, 3]));                            // o corredor que sobe do covil para o anel da ponte
// O anel de túneis altos e a ponte, no 4; o canal por baixo deles, no 1, subindo para os tanques no 2.
const ponte = naSala('ponte');
nivel(4, ponte);
nivel(1, CANAL_NORTE.filter(([x]) => x <= 17));
nivel(2, CANAL_NORTE.filter(([x]) => x >= 18));
nivel(1, [[13, 5], [14, 5], [15, 5], [14, 6], [15, 6]]);
nivel(4, PATAMARES);
nivel(3, casas([17, 7], [18, 7]));                  // o túnel alto desce para a entrada oeste dos tanques
nivel(2, casas([19, 7]));
nivel(2, naSala('pocos'));
nivel(3, naSala('chefe'));                          // os degraus naturais ao norte de Klarg
// A ROCHA DA CHAMINÉ. A fenda do canil até a caverna de Klarg sobe nove metros (livro, área 3); a FA a desenha
// aberta entre as duas — no Foundry não há altura —, e desde que a visão segue o traço (`grid.hasLineOfSight`) do canil
// se via o bando de Klarg pela fenda: medido, 5 casas do canil e 1 da passagem. A rocha em volta dela fica alta (9,
// o teto do mapa): o olho não passa por cima. Subir continua sendo a ação "Subir a chaminé"; ninguém anda em rocha.
const ROCHA_DA_CHAMINE = [];
for (let y = 11; y <= 14; y++) for (let x = 18; x <= 21; x++) if (terreno[y][x] === 'R') ROCHA_DA_CHAMINE.push([x, y]);
nivel(9, ROCHA_DA_CHAMINE);
const alturaTexto = altura.map((l) => l.join(''));

// --------------------------------------------------------------------------------------------------- a luz ---
// 2 claro (o dia lá fora), 1 penumbra (a boca), 0 breu.
const luz = Array.from({ length: H }, () => new Array(W).fill(0));
for (const [x, y] of [...naSala('fora'), ...naSala('vigias')]) luz[y][x] = 2;
for (const [x, y] of naSala('passagem')) if (y >= 12) luz[y][x] = 1;

// ---------------------------------------------------------------------------------------------- conferência ---
const terrenoTexto = terreno.map((l) => l.join(''));
const conferir = montarCampo({ ...base, terreno: terrenoTexto, altura: alturaTexto });
// toda casa de chão alcançável da clareira dos vigias, só pelo terreno (é o que `testes-cenas.mjs` mede)
{
  const vis = new Set();
  const fila = [[14, 16]];
  while (fila.length) {
    const [x, y] = fila.pop();
    if (vis.has(k(x, y)) || x < 0 || y < 0 || x >= W || y >= H || conferir.blocksMove(x, y)) continue;
    vis.add(k(x, y));
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) fila.push([x + dx, y + dy]);
  }
  const soltas = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!conferir.blocksMove(x, y) && !vis.has(k(x, y))) soltas.push(k(x, y));
  if (soltas.length) throw new Error(`casa de chão solta depois da pintura: ${soltas.join(' ')}`);
}

const salas = {};
for (const [chave, nome] of sala) {
  if (conferir.blocksMove(...chave.split(',').map(Number))) continue;
  const [x, y] = chave.split(',').map(Number);
  (salas[nome] ??= []).push({ x, y });
}

// ------------------------------------------------------------------------------------------------ a saída ---
const P = (p) => `{ x: ${p[0]}, y: ${p[1]} }`;
const lista = (l) => `[${l.map(P).join(', ')}]`;
const linhas = (nome, v) => `  ${nome}: [\n${v.map((l) => `    '${l}',`).join('\n')}\n  ],`;
const texto = `// O ESCONDERIJO DOS GOBLINS (capítulo 2) sobre o battlemap Cragmaw Hideout [30×20] da Forgotten Adventures.
//
// GERADO por \`src/dev/mapa-esconderijo-fa.mjs\` — mude lá e rode de novo. O traçado das paredes vem da cena do
// Foundry (\`src/dev/importar-foundry.py\`); o terreno, a altura e as salas são pintados por cima, seguindo o
// de-para do livro em \`revisoes/esconderijo-de-para-2026-11-04.md\`.
//
//   fora      área 1, a clareira a OESTE do riacho, onde a trilha chega
//   vigias    área 2, o mato a LESTE do riacho, com o abrigo de ripas em (13,16)–(14,17)
//   canil     área 3, a câmara dos ossos; a estalagmite das correntes em (15,10), a chaminé em ${P(CHAMINE_BASE)}
//   passagem  área 4, a subida com o riacho pelo lado oeste; a passagem de entulho para o covil em y 6
//   ponte     área 5, o anel de túneis altos (nível 4) e as tábuas sobre o canal (nível 1)
//   covil     área 6, de baixo no 2 com a fogueira, de cima no 4, a escada em ${P(ESCADA_DO_COVIL)}
//   pocos     área 7, os dois tanques e o dique, a cachoeira a leste
//   chefe     área 8, a fogueira de Klarg, os suprimentos e o baú, a chaminé em ${P(CHAMINE_TOPO)}
//
// Glifos (\`GLIFOS\` em \`core/grid.js\`): R rocha · _ caverna · , grama · % espinheiro · P tocaia · w riacho ·
// W poço · = ponte · x entulho · A estalagmite · s mantimentos · K baú · u barris · z leito · F fogueira.
// Alturas: um dígito por casa, 1 nível = 1,5 m; degrau de mais de um nível é parede.
// Luz: 2 claro (o dia lá fora), 1 penumbra (a boca), 0 breu.

export const MAPA_ESCONDERIJO = {
${linhas('terreno', terrenoTexto)}
${linhas('altura', alturaTexto)}
${linhas('luz', luz.map((l) => l.join('')))}
  paredes: {
    n: [
${base.paredes.n.map((l) => `      '${l}',`).join('\n')}
    ],
    o: [
${base.paredes.o.map((l) => `      '${l}',`).join('\n')}
    ],
  },
  tracos: ${JSON.stringify(base.tracos)},
  salas: {
${Object.entries(salas).map(([nome, cs]) => `    ${nome}: ${lista(cs.map((c) => [c.x, c.y]))},`).join('\n')}
  },
};

// OS PONTOS QUE O CAPÍTULO 2 USA, para ele não repetir número nenhum: quem muda a planta muda aqui, e o capítulo
// acompanha.
export const PONTOS_DO_ESCONDERIJO = {
  ressalto: ${lista(RESSALTO)},                     // área 4: a elevação frágil
  peDaPassagem: { x: 13, y: 7 },                     // onde rola quem quebra o ressalto
  chamineBase: ${P(CHAMINE_BASE)},                    // área 3
  chamineTopo: ${P(CHAMINE_TOPO)},                    // área 8
  corrente: { x: 16, y: 11, raioFt: 5 },              // o espeto ao pé da estalagmite; não alcança os degraus (x 13)
  ponte: ${lista(PONTE)},
  sobAPonte: { x: 15, y: 5 },                          // o canal, onde cai quem estava na ponte
  dique: ${lista(DIQUE)},
  poco1: ${lista(POCO_1)},
  poco2: ${lista(POCO_2)},
  fogueiraCovil: ${P(FOGUEIRA_COVIL)},
  fogueiraKlarg: ${P(FOGUEIRA_KLARG)},
  escadaDoCovil: ${P(ESCADA_DO_COVIL)},
  baixoDoCovil: { x: 4, y: 7 },                        // onde Sildar cai, e para onde é levado ao ser solto
  fozDaEnchente: { x: 9, y: 15 },                      // onde a água larga quem ela arrasta (área 1)
  bau: ${P(BAU)},
};
`;
fs.writeFileSync(SAIDA, texto);
const conta = Object.fromEntries(Object.entries(salas).map(([n, cs]) => [n, cs.length]));
console.log(`${SAIDA}: ${W}x${H}, salas ${JSON.stringify(conta)}`);
