// Catálogo de itens — página de revisão.
//
// POR QUE EXISTE
// São 437 entradas espalhadas por cinco arquivos. Conferir se uma armadura
// ficou sem peso, se um item mágico ficou sem raridade ou se alguma entrada
// caiu numa categoria errada é trabalho que ninguém faz lendo código. Aqui
// tudo aparece junto, com a mesma arte do jogo.
//
// NÃO HÁ TABELA PRÓPRIA AQUI. Tudo é lido de `rules/items/`, os mesmos
// arquivos que o inventário lê. Uma segunda lista para a página de revisão
// seria a primeira coisa a ficar desatualizada — e a revisão passaria a
// aprovar uma realidade que o jogo não tem.
//
// A VITRINE DE SPRITES no topo existe porque "visual do item" só é literal
// para quem muda o boneco: armadura e arma. Os outros 400 têm ícone, e é o
// ícone que a página mostra.

import { WEAPONS, AMMO } from '../rules/items/weapons.js';
import { ARMORS, SHIELD } from '../rules/items/armors.js';
import { GEAR, TOOLS, MOUNTS } from '../rules/items/gear.js';
import {
  POTIONS, MAGIC_WEAPONS, MAGIC_ARMORS, RINGS, WANDS, STAVES, RODS, WONDROUS,
} from '../rules/items/magic.js';
import { PHANDELVER_ITEMS } from '../rules/items/phandelver.js';
import { iconCanvas, iconeDeArma, temIcone } from '../art/icons.js';
import { ICONES_ITENS } from '../art/icones-itens.js';
import { makeFigure } from '../art/sheet.js';
import { LOOKS } from '../art/looks.js';

const el = (tag, attrs = {}, ...filhos) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v);
  }
  for (const f of filhos.flat()) {
    if (f === null || f === undefined || f === false) continue;
    n.append(f instanceof Node ? f : document.createTextNode(String(f)));
  }
  return n;
};

// ---------------------------------------------------------------- formato ----

/** Preço em po, escrito na moeda que menos precisa de casas decimais. */
function preco(po) {
  if (po === undefined || po === null) return null;
  if (po === 0) return '—';
  if (po >= 1) return `${+po.toFixed(2)} po`;
  if (po >= 0.1) return `${Math.round(po * 10)} pp`;
  return `${Math.round(po * 100)} pc`;
}

const peso = (lb) => (lb === undefined || lb === null ? null : lb === 0 ? '—' : `${+lb.toFixed(2)} lb`);

/** As iniciais, quando ainda não existe ícone — igual ao inventário do jogo. */
const CONECTIVOS = new Set(['de', 'da', 'do', 'dos', 'das', 'e']);
const sigla = (nome = '') => nome
  .split(/\s+/).filter((p) => p && !CONECTIVOS.has(p.toLowerCase()))
  .slice(0, 2).map((p) => p[0].toUpperCase()).join('');

function iconeDe(d, categoria) {
  const nome = categoria === 'arma' ? iconeDeArma(d.art, d.name) : d.art;
  if (nome && temIcone(nome)) return iconCanvas(nome, 32);
  return el('span', { class: 'mono' }, sigla(d.name));
}

const RARIDADE_CLASSE = {
  comum: 'r-comum', incomum: 'r-incomum', raro: 'r-raro',
  'muito raro': 'r-muito', lendário: 'r-lendario', artefato: 'r-lendario',
};

// ---------------------------------------------------------------- linhas ----
//
// O que cada categoria mostra. Uma função por categoria, e não um `switch`
// gigante, porque é aqui que a próxima pessoa vem acrescentar campo.

const linhasDeArma = (d) => [
  ['Dano', d.damage === '0' ? 'nenhum' : `${d.damage} ${d.type}`, true],
  d.versatil ? ['Nas duas mãos', d.versatil] : null,
  ['Alcance', d.ranged ? `${d.rangeFt}/${d.longRangeFt} pés` : `${d.reachFt ?? 5} pés${d.rangeFt ? ` · arremesso ${d.rangeFt}/${d.longRangeFt}` : ''}`],
  ['Atributo', d.ranged ? 'Destreza' : d.finesse ? 'Força ou Destreza' : 'Força'],
  d.props?.length ? ['Propriedades', d.props.join(', ')] : null,
  ['Categoria', d.categoria],
];

const linhasDeArmadura = (d) => [
  ['CA', d.id === 'nenhuma' ? '10 + Des' : `${d.base}${d.dexCap === Infinity ? ' + Des' : d.dexCap ? ` + Des (máx ${d.dexCap})` : ''}`, true],
  ['Categoria', d.categoria],
  d.forcaMinima ? ['Força mínima', String(d.forcaMinima)] : null,
  d.furtividade ? ['Furtividade', d.furtividade] : null,
  ['Estilo no boneco', d.art ?? 'nenhum'],
];

const linhasDeMagico = (d) => [
  d.raridade ? ['Raridade', d.raridade, true] : null,
  d.bonusAtaque ? ['Ataque e dano', `+${d.bonusAtaque}`] : null,
  d.acBonus ? ['CA', `+${d.acBonus}`] : null,
  d.acBonusArmadura ? ['CA de armadura', `+${d.acBonusArmadura}`] : null,
  d.cargas ? ['Cargas', String(d.cargas)] : null,
  d.base ? ['Arma base', d.base] : null,
  d.valor ? ['Valor', `${d.valor} po`] : null,
];

const linhasDeUtilidade = (d) => [
  d.cura ? ['Cura', d.cura, true] : null,
  d.damage && d.damage !== '0' ? ['Dano', `${d.damage} ${d.damageType}`, true] : null,
  d.usos ? ['Usos', String(d.usos)] : null,
  d.rangeFt ? ['Arremesso', `${d.rangeFt} pés`] : null,
  d.acao ? ['Custo', d.acao === 'bonus' ? 'ação bônus' : 'ação'] : null,
];

function linhasDe(d, categoria) {
  const base = categoria === 'arma' ? linhasDeArma(d)
    : categoria === 'armadura' ? linhasDeArmadura(d)
      : categoria === 'mágico' ? linhasDeMagico(d)
        : linhasDeUtilidade(d);
  // Peso e preço são o rodapé de TODA categoria: é o par que decide o que
  // entra na mochila e o que fica na loja.
  return [...base, ['Peso', peso(d.peso)], ['Preço', preco(d.custo)]].filter(Boolean);
}

// ---------------------------------------------------------------- cartão ----

function cartao(d, categoria) {
  const magico = categoria === 'mágico';
  const classes = ['item', magico ? 'magico' : '', d.campanha === 'phandelver' ? 'phandelver' : '']
    .filter(Boolean).join(' ');

  const linhas = linhasDe(d, categoria).map(([rot, val, destaque]) => (val === null ? null
    : el('div', { class: 'l' },
      el('dt', {}, rot),
      el('dd', { class: destaque ? 'destaque' : '' }, val))));

  return el('article', { class: classes, 'data-busca': `${d.name} ${d.id} ${d.tipo ?? ''} ${d.categoria ?? ''}`.toLowerCase() },
    el('div', { class: 'caixa-icone' }, iconeDe(d, categoria)),
    el('div', { class: 'corpo' },
      el('div', { class: 'nome' }, d.name),
      el('div', { class: 'sub' }, d.tipo ?? categoria),
      el('dl', { class: 'linhas' }, linhas),
      d.desc ? el('p', { class: 'desc' }, d.desc) : null,
      d.nota ? el('p', { class: 'desc' }, d.nota) : null,
      el('div', { class: 'selos' },
        d.fonte ? el('span', { class: `selo ${d.fonte}` }, d.fonte === 'propria' ? 'própria' : d.fonte) : null,
        d.raridade ? el('span', { class: `selo ${RARIDADE_CLASSE[d.raridade] ?? ''}` }, d.raridade) : null,
        d.sintonia ? el('span', { class: 'selo sintonia' }, 'sintonia') : null,
        d.consumivel ? el('span', { class: 'selo usa' }, 'usável') : null,
        d.mochilavel === false ? el('span', { class: 'selo' }, 'fora da mochila') : null)));
}

// ---------------------------------------------------------------- seções ----

const SECOES = [
  { id: 'armas', titulo: 'Armas', cat: 'arma', dados: WEAPONS,
    nota: 'Os campos de dano, alcance e atributo são lidos pelo motor de combate. "Estilo no boneco" é o desenho que o pintor usa na mão — existem oito, então trinta e sete armas se repartem entre eles.' },
  { id: 'municoes', titulo: 'Munições', cat: 'item', dados: AMMO },
  { id: 'armaduras', titulo: 'Armaduras', cat: 'armadura', dados: { ...ARMORS, escudo: SHIELD },
    nota: 'A categoria (leve, média, pesada) mora na própria entrada: é ela que decide se o personagem tem treino, e tabela paralela apodreceria.' },
  { id: 'equipamento', titulo: 'Equipamento de aventura', cat: 'item', dados: GEAR,
    nota: 'O que leva o selo "usável" tem efeito em jogo de verdade — `useItem` no motor o executa. O resto é catálogo e peso.' },
  { id: 'ferramentas', titulo: 'Ferramentas e instrumentos', cat: 'item', dados: TOOLS },
  { id: 'montarias', titulo: 'Montarias e veículos', cat: 'item', dados: MOUNTS,
    nota: 'Marcados "fora da mochila": estão na tabela do livro, mas um navio numa célula de inventário seria piada.' },
  { id: 'pocoes', titulo: 'Poções e óleos mágicos', cat: 'mágico', dados: POTIONS },
  { id: 'armas-magicas', titulo: 'Armas mágicas', cat: 'mágico', dados: MAGIC_WEAPONS,
    nota: '`bonusAtaque` e `bonusDano` ainda NÃO são lidos por combat.js. Estão aqui para a arma +1 já nascer com o número certo no dia em que forem — e isto está escrito para ninguém achar que a espada +2 está batendo mais.' },
  { id: 'armaduras-magicas', titulo: 'Armaduras e escudos mágicos', cat: 'mágico', dados: MAGIC_ARMORS },
  { id: 'aneis', titulo: 'Anéis', cat: 'mágico', dados: RINGS },
  { id: 'varinhas', titulo: 'Varinhas', cat: 'mágico', dados: WANDS },
  { id: 'cajados', titulo: 'Cajados', cat: 'mágico', dados: STAVES },
  { id: 'cetros', titulo: 'Cetros', cat: 'mágico', dados: RODS },
  { id: 'maravilhosos', titulo: 'Itens maravilhosos', cat: 'mágico', dados: WONDROUS },
  { id: 'phandelver', titulo: 'Minas Perdidas de Phandelver', cat: 'mágico', dados: PHANDELVER_ITEMS,
    nota: 'Os NOMES são usados sob a Fan Content Policy. As DESCRIÇÕES foram escritas para este projeto, não transcritas do módulo. É por isso que todos levam o selo "própria".' },
];

// ---------------------------------------------------------------- vitrine ----
//
// Armadura e arma são os únicos itens cujo "visual" é literal: eles mudam o
// boneco. Treze armaduras se repartem entre cinco estilos de desenho e trinta
// e sete armas entre oito — e é isso que a vitrine mostra, uma figura por
// desenho, com as entradas que caem nele.

function figuraDe(chave, campos) {
  if (!LOOKS[chave]) LOOKS[chave] = { ...LOOKS.fighter, ...campos };
  const c = makeFigure(chave, 2);
  return c;
}

/**
 * A folha de ícones, ampliada.
 *
 * Existe para REVISAR DESENHO. A 32 px um erro de um pixel é invisível e o
 * ícone só parece "estranho"; a 96 px dá para apontar qual pixel está errado
 * e corrigir a linha correspondente em `icones-itens.js`. É a mesma razão de
 * a folha do elenco existir para as figuras.
 */
function folhaDeIcones() {
  const cartoes = Object.keys(ICONES_ITENS).sort().map((nome) => {
    const cv = iconCanvas(nome, 96);
    cv.style.imageRendering = 'pixelated';
    return el('div', { class: 'icone-cartao' }, cv, el('b', {}, nome));
  });
  return el('div', { class: 'vitrine' },
    el('h2', {}, `Folha de ícones — ${cartoes.length} desenhos, a 3×`),
    el('p', {}, 'A grade é de 32×32 e mora em `src/art/icones-itens.js`, em texto. Para corrigir um, conte a linha e a coluna aqui e troque o caractere lá. O verificador `node src/dev/icones.js` recusa qualquer grade que deixe de ser quadrada.'),
    el('div', { class: 'icones-folha' }, cartoes));
}

function vitrine() {
  const estilos = new Map();
  for (const a of Object.values(ARMORS)) {
    const k = a.art ?? 'none';
    if (!estilos.has(k)) estilos.set(k, []);
    estilos.get(k).push(a.name);
  }
  const armas = new Map();
  for (const w of Object.values(WEAPONS)) {
    const k = w.art ?? '(sem desenho)';
    if (!armas.has(k)) armas.set(k, []);
    armas.get(k).push(w.name);
  }

  // `helm: false` de propósito: a figura de `armorStyle: 'none'` com elmo não
  // lê como "sem armadura", lê como "alguém que perdeu o peitoral".
  const cartaoArmadura = ([estilo, nomes]) => el('div', { class: 'boneco', title: nomes.join(', ') },
    figuraDe(`cat-arm-${estilo}`, {
      armorStyle: estilo === 'none' ? 'none' : estilo,
      weapon: null, shield: false, helm: estilo === 'plate',
    }),
    el('b', {}, estilo),
    el('span', {}, `${nomes.length} armadura${nomes.length > 1 ? 's' : ''}`));

  const cartaoArma = ([arte, nomes]) => el('div', { class: 'boneco', title: nomes.join(', ') },
    arte === '(sem desenho)'
      ? el('div', { style: 'height:120px;display:grid;place-items:center;color:var(--fraco)' }, '—')
      : figuraDe(`cat-wpn-${arte}`, { weapon: arte, shield: false, armorStyle: 'leather', helm: false }),
    el('b', {}, arte),
    el('span', {}, `${nomes.length} arma${nomes.length > 1 ? 's' : ''}`));

  return el('div', {},
    el('div', { class: 'vitrine' },
      el('h2', {}, 'O que muda o boneco — armaduras'),
      el('p', {}, 'Treze armaduras, cinco desenhos. O pintor lê `armorStyle`, não o id: a brigantina e o peitoral usam a mesma chapa. Passe o mouse para ver quais caem em cada uma.'),
      el('div', { class: 'bonecos' }, [...estilos].map(cartaoArmadura))),
    el('div', { class: 'vitrine' },
      el('h2', {}, 'O que muda o boneco — armas'),
      el('p', {}, 'Trinta e sete armas, oito desenhos. A alabarda usa a cabeça de machado e o chicote usa o gancho: aproximação deliberada, e melhor que um campo apontando para um desenho que não existe. A rede não tem desenho — é a única que não se empunha.'),
      el('div', { class: 'bonecos' }, [...armas].map(cartaoArma))));
}

// ---------------------------------------------------------------- montagem ----

const alvoSecoes = document.getElementById('secoes');
const alvoFiltros = document.getElementById('filtros');
const conta = document.getElementById('conta');
const busca = document.getElementById('busca');

document.getElementById('vitrine').append(folhaDeIcones(), vitrine());

let total = 0;
const nodosDeSecao = [];
for (const s of SECOES) {
  const itens = Object.values(s.dados);
  total += itens.length;
  const grade = el('div', { class: 'grade' }, itens.map((d) => cartao(d, s.cat)));
  const sec = el('section', { id: s.id },
    el('h2', {}, s.titulo, el('span', { class: 'qtd' }, itens.length)),
    s.nota ? el('p', { class: 'nota' }, s.nota) : null,
    grade);
  nodosDeSecao.push({ sec, s });
  alvoSecoes.append(sec);
}

// ---- filtros por seção ----
let filtroAtivo = null;
const botoes = [];
const aplicarFiltro = (id) => {
  filtroAtivo = filtroAtivo === id ? null : id;
  for (const b of botoes) b.classList.toggle('on', b.dataset.id === filtroAtivo);
  for (const { sec, s } of nodosDeSecao) {
    sec.style.display = !filtroAtivo || s.id === filtroAtivo ? '' : 'none';
  }
  filtrar();
};
for (const s of SECOES) {
  const b = el('button', { 'data-id': s.id, onclick: () => aplicarFiltro(s.id) },
    `${s.titulo} (${Object.keys(s.dados).length})`);
  botoes.push(b);
  alvoFiltros.append(b);
}

// ---- busca ----
function filtrar() {
  const q = busca.value.trim().toLowerCase();
  let visiveis = 0;
  for (const { sec, s } of nodosDeSecao) {
    if (filtroAtivo && s.id !== filtroAtivo) continue;
    let naSecao = 0;
    for (const art of sec.querySelectorAll('.item')) {
      const bate = !q || art.dataset.busca.includes(q);
      art.style.display = bate ? '' : 'none';
      if (bate) naSecao++;
    }
    // Seção que ficou sem nada some: rolar por dez títulos vazios para achar
    // um resultado é pior que não ter busca.
    sec.style.display = naSecao ? '' : 'none';
    sec.querySelector('.qtd').textContent = q ? `${naSecao} de ${sec.querySelectorAll('.item').length}` : naSecao;
    visiveis += naSecao;
  }
  conta.textContent = q || filtroAtivo ? `${visiveis} de ${total} itens` : `${total} itens`;
}
busca.addEventListener('input', filtrar);
filtrar();

// ---- tema ----
const btnTema = document.getElementById('tema');
btnTema.addEventListener('click', () => {
  const claro = document.body.classList.toggle('claro');
  btnTema.textContent = claro ? 'Fundo escuro' : 'Fundo claro';
});
