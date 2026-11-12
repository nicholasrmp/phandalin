// O TESOURO POR ND do Livro do Mestre: o INDIVIDUAL (o que cada criatura leva no bolso) e o do COVIL (o monte guardado),
// com as gemas, os objetos de arte e os itens mágicos das tabelas A a I. As tabelas vêm de `tesouro-tabelas.js`, gerado
// por `src/dev/importar-tesouro.mjs`.
//
// O que é nosso, e está dito aqui:
//   - o ELECTRO vira prata (1 pe = 5 pp): o jogo não tem a moeda;
//   - a gema e o objeto de arte saem pela FAIXA de valor (`items/tesouro-generico.js`), sem o nome da pedra;
//   - o item mágico que o jogo não tem rola de novo na mesma tabela (até dez vezes), em vez de virar texto.
//
// Quem usa: o encontro de estrada da região (`game/capitulo4-estrada.js`) para o bando a que a aventura não dá bolsa.
// O resto das lutas segue com o tesouro que a aventura escreveu.
//
// Puro: `rng.die(n)` dá o dado.
import { TESOURO_INDIVIDUAL, TESOURO_DO_COVIL, ITENS_MAGICOS_POR_TABELA } from './tesouro-tabelas.js';
import { WEAPONS, ARMORS } from './items/index.js';
import { TIPOS_RESISTIVEIS, SUFIXO, DRAGOES } from './items/variantes.js';

const MOEDA = { cp: 'moedaDeCobre', sp: 'moedaDePrata', gp: 'moedaDeOuro', pp: 'moedaDePlatina' };

/** Rola "4d6", "3d6*100", "2d4". */
function dado(rng, notacao) {
  const m = String(notacao).match(/^(\d+)d(\d+)(?:\*(\d+))?$/);
  if (!m) return Number(notacao) || 0;
  let t = 0;
  for (let i = 0; i < Number(m[1]); i += 1) t += rng.die(Number(m[2]));
  return t * Number(m[3] ?? 1);
}
const linhaDo = (rng, linhas) => { const r = rng.die(100); return linhas.find((l) => r >= l.min && r <= l.max) ?? linhas[linhas.length - 1]; };
const faixaDoNd = (tabelas, nd) => tabelas.find((t) => nd >= t.ndMin && nd <= t.ndMax) ?? tabelas[tabelas.length - 1];
const umDe = (rng, lista) => lista[rng.die(lista.length) - 1];

/** As moedas da rolagem, em `{ id, qtd }` (o electro já em prata). */
function moedas(rng, coins = {}) {
  const soma = {};
  for (const [m, n] of Object.entries(coins)) {
    const qtd = dado(rng, n);
    if (m === 'ep') soma.sp = (soma.sp ?? 0) + qtd * 5;
    else soma[m] = (soma[m] ?? 0) + qtd;
  }
  return Object.entries(soma).filter(([, q]) => q > 0).map(([m, qtd]) => ({ id: MOEDA[m], qtd }));
}

const BASES_DE_ARMA = () => Object.values(WEAPONS).filter((w) => w.fonte === 'srd' && !w.deBase).map((w) => w.id);
const BASES_DE_ARMADURA = () => Object.values(ARMORS).filter((a) => a.fonte === 'srd' && !a.deBase && a.id !== 'nenhuma').map((a) => a.id);

/** A ficha de sorteio da tabela vira um id do jogo. */
function abrirFicha(rng, f) {
  switch (f.ficha) {
    case 'arma': return `${umDe(rng, BASES_DE_ARMA())}Mais${f.n}`;
    case 'armadura': return `${umDe(rng, BASES_DE_ARMADURA())}Mais${f.n}`;
    case 'armaduraDeResistencia': return `${f.base ?? umDe(rng, BASES_DE_ARMADURA())}DeResistencia${SUFIXO[umDe(rng, TIPOS_RESISTIVEIS)]}`;
    case 'pocaoDeResistencia': return `pocaoDeResistencia${SUFIXO[umDe(rng, TIPOS_RESISTIVEIS)]}`;
    case 'anelDeResistencia': return `anelDeResistencia${SUFIXO[umDe(rng, TIPOS_RESISTIVEIS)]}`;
    case 'escamas': return `cotaDeEscamasDeDragao${umDe(rng, Object.values(DRAGOES))[0]}`;
    case 'vulnerabilidade': return umDe(rng, ['armaduraDaVulnerabilidadeConcussao', 'armaduraDaVulnerabilidadeCortante', 'armaduraDaVulnerabilidadePerfurante']);
    case 'umDe': return umDe(rng, f.ids);
    default: return null;
  }
}

/** Um item da tabela mágica `letra` (A a I). Rola de novo o que o jogo não tem; null se dez rolagens não acharem. */
export function itemMagicoDaTabela(rng, letra) {
  const tabela = ITENS_MAGICOS_POR_TABELA[letra];
  if (!tabela) return null;
  for (let i = 0; i < 10; i += 1) {
    const l = linhaDo(rng, tabela);
    if (!l.id) continue;
    return typeof l.id === 'string' ? l.id : abrirFicha(rng, l.id);
  }
  return null;
}

/** Junta `{ id, qtd }` repetidos. */
const juntar = (lista) => {
  const m = new Map();
  for (const { id, qtd } of lista) if (id) m.set(id, (m.get(id) ?? 0) + qtd);
  return [...m].map(([id, qtd]) => ({ id, qtd }));
};

/** O TESOURO INDIVIDUAL de uma criatura de ND `nd`: as moedas do bolso. */
export function tesouroIndividual(rng, nd) {
  return moedas(rng, linhaDo(rng, faixaDoNd(TESOURO_INDIVIDUAL, nd).linhas).moedas);
}

/** O TESOURO DO COVIL de ND `nd`: as moedas, as gemas, os objetos de arte e os itens mágicos. */
export function tesouroDoCovil(rng, nd) {
  const faixa = faixaDoNd(TESOURO_DO_COVIL, nd);
  const out = moedas(rng, faixa.moedas);
  const l = linhaDo(rng, faixa.linhas);
  if (l.gemas) out.push({ id: `gema${l.gemas.valor}`, qtd: dado(rng, l.gemas.qtd) });
  if (l.arte) out.push({ id: `arte${l.arte.valor}`, qtd: dado(rng, l.arte.qtd) });
  for (const m of l.magicos ?? []) {
    const n = dado(rng, m.qtd);
    for (let i = 0; i < n; i += 1) out.push({ id: itemMagicoDaTabela(rng, m.tabela), qtd: 1 });
  }
  return juntar(out);
}

// O ND pelo XP do bloco (a tabela do Livro dos Monstros): o combatente guarda o XP, não o ND
const XP_DO_ND = [[0, 10], [0.125, 25], [0.25, 50], [0.5, 100], [1, 200], [2, 450], [3, 700], [4, 1100], [5, 1800], [6, 2300], [7, 2900],
  [8, 3900], [9, 5000], [10, 5900], [11, 7200], [12, 8400], [13, 10000], [14, 11500], [15, 13000], [16, 15000], [17, 18000], [18, 20000],
  [19, 22000], [20, 25000], [21, 33000], [22, 41000], [23, 50000], [24, 62000], [25, 75000], [26, 90000], [27, 105000], [28, 120000],
  [29, 135000], [30, 155000]];
/** O ND de um combatente: o declarado, ou o maior cujo XP o dele alcança. */
export const ndDe = (c) => c.cr ?? c.nd ?? XP_DO_ND.filter(([, xp]) => (c.xp ?? 0) >= xp).at(-1)?.[0] ?? 0;

/** O tesouro individual de um BANDO (cada um rola o seu, pelo ND dele), já somado. */
export function tesouroDoBando(rng, criaturas) {
  return juntar(criaturas.flatMap((c) => tesouroIndividual(rng, ndDe(c))));
}
