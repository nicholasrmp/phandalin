// OS ITENS QUE CONJURAM (as varinhas, os cajados, os anéis e mantos do Livro do Mestre), do lado do HERÓI.
//
// O item declara `conjura` no catálogo:
//   conjura: {
//     cargas: 7,                 // o máximo; `null` = sem cargas (a magia sai uma vez por amanhecer, `porDia`)
//     recarga: '1d6+1',          // o que volta ao amanhecer (aqui, no descanso longo); número ou dado; `null` = tudo
//     magias: { misselMagico: { custo: 1, circulo: 1, maisPorCarga: 2 } },   // custo em cargas; `maisPorCarga`: cada
//                                // carga a mais sobe um círculo, até `circulo + maisPorCarga`
//     cd: 15, ataque: 7,         // a CD e o ataque PRÓPRIOS do item (a varinha); sem eles, os do herói
//     exigeConjurador: true,     // "sintonia por um conjurador": quem não conjura não usa
//   }
// As cargas de cada herói ficam em `c.resources['cargas:<id>']` (começam cheias). A SINTONIA (`c.sintonizados`, até três):
// o item que pede sintonia só conjura sintonizado.
//
// Quem chama: `spells.js magiasProntas` (a magia aparece na lista, também para quem não conjura), `passivas.js
// usoLivreDe` (sai sem espaço, gastando cargas), `combat.js canCast`/`castSpellBase` (a CD e o ataque do item) e
// `descanso.js descansoLongo` (as cargas voltam).
import { atualizarItensPassivos, dadosDoItem, idsCarregados, temOItem } from './itens-passivos.js';

export const MAX_SINTONIA = 3;
const chave = (id) => `cargas:${id}`;

/** O item exige sintonia? (`sintonia: true` no catálogo) */
const pedeSintonia = (dados) => Boolean(dados?.sintonia);

/** Os itens da mochila do herói que conjuram e que ele PODE usar agora (sintonizado, se pedir; conjurador, se exigir). */
export function itensQueConjuram(c) {
  const out = [];
  for (const id of idsCarregados(c)) {
    const dados = dadosDoItem(id);
    if (!dados?.conjura) continue;
    if (pedeSintonia(dados) && !(c.sintonizados ?? []).includes(id)) continue;
    if (dados.conjura.exigeConjurador && !c.spellcasting) continue;
    out.push({ id, dados, conjura: dados.conjura });
  }
  return out;
}

/** As magias que os itens do herói conjuram. */
export function magiasDosItens(c) {
  return [...new Set(itensQueConjuram(c).flatMap((x) => Object.keys(x.conjura.magias ?? {})))];
}

/** As cargas de um item: as da magia (`conjura`) ou as do poder dele (`recarregavel`, o anel de evasão). */
const cargasDoItem = (dados) => dados?.conjura ?? dados?.recarregavel ?? null;

/** As cargas que sobram num item (cheio, se nunca foi usado). */
export function cargasDe(c, id) {
  const conj = cargasDoItem(dadosDoItem(id));
  if (!conj) return 0;
  const v = c.resources?.[chave(id)];
  return v ?? (conj.cargas ?? 1);
}

/**
 * O USO de uma magia por item, no formato de `usoLivreDe`: o item que a conjura e tem cargas para o círculo pedido.
 * Sem `pedido`, o menor custo. Devolve null se nenhum item serve.
 */
export function usoDoItem(c, spell, pedido = null) {
  if (!spell) return null;
  for (const { id, dados, conjura } of itensQueConjuram(c)) {
    const m = conjura.magias?.[spell.id];
    if (!m) continue;
    const base = m.circulo ?? spell.level;
    const teto = base + (m.maisPorCarga ?? 0);
    const circulo = pedido == null ? base : pedido;
    if (circulo < base || circulo > teto) continue;
    const custo = (m.custo ?? 1) + (circulo - base);
    const tem = cargasDe(c, id);
    if (tem < custo) continue;
    c.resources ??= {};
    c.resources[chave(id)] = tem;
    return {
      tipo: 'item', item: id, circulo, recurso: chave(id), custo,
      rotulo: custo === 0 ? `${dados.name}, à vontade` : `${dados.name}, ${custo} ${custo === 1 ? 'carga' : 'cargas'}`,
      ...(conjura.cd != null ? { cd: conjura.cd } : {}),
      ...(conjura.ataque != null ? { ataque: conjura.ataque } : {}),
    };
  }
  return null;
}

/** O AMANHECER (aqui, o descanso longo): cada item recupera o que o catálogo diz, sem passar do máximo. */
export function recarregarItens(c, rolar = (dado) => mediaDoDado(dado)) {
  for (const id of idsCarregados(c)) {
    const conj = cargasDoItem(dadosDoItem(id));
    if (!conj) continue;
    const max = conj.cargas ?? 1;
    const k = chave(id);
    if (c.resources?.[k] == null) continue;
    const volta = conj.recarga == null ? max : typeof conj.recarga === 'number' ? conj.recarga : rolar(conj.recarga);
    c.resources[k] = Math.min(max, c.resources[k] + volta);
  }
}

/** Gasta uma carga do poder de um item (o anel de evasão). Devolve se havia. */
export function gastarCargaDoItem(c, id, n = 1) {
  const tem = cargasDe(c, id);
  if (tem < n) return false;
  c.resources ??= {};
  c.resources[chave(id)] = tem - n;
  return true;
}

function mediaDoDado(notacao) {
  const m = String(notacao).match(/^(\d+)d(\d+)(?:\s*\+\s*(\d+))?$/);
  if (!m) return Number(notacao) || 0;
  return Math.floor(Number(m[1]) * (Number(m[2]) + 1) / 2) + Number(m[3] ?? 0);
}

// ------------------------------------------------------------------------------------------------- sintonia ----
/** Sintoniza um item (um descanso curto, no livro): até três. Devolve o motivo da recusa, ou null. */
export function sintonizar(c, id) {
  const dados = dadosDoItem(id);
  if (!dados || !pedeSintonia(dados)) return 'este item não pede sintonia';
  if (!temOItem(c, id)) return 'o item não está com ele';
  c.sintonizados ??= [];
  if (c.sintonizados.includes(id)) return null;
  if (c.sintonizados.length >= MAX_SINTONIA) return `já está sintonizado com ${MAX_SINTONIA} itens`;
  if (dados.conjura?.exigeConjurador && !c.spellcasting) return 'só um conjurador se sintoniza com ele';
  // a LÂMINA LUNAR: só um elfo ou meio-elfo (o alinhamento do livro não entra: o jogo não tem alinhamento)
  if (dados.sintoniaElfo && !/elf/i.test(`${c.racaId ?? ''} ${c.raca ?? ''} ${c.ancestry ?? ''}`)) return 'a lâmina lunar só aceita um elfo ou meio-elfo';
  c.sintonizados.push(id);
  atualizarItensPassivos(c);
  return null;
}

export function dessintonizar(c, id) {
  c.sintonizados = (c.sintonizados ?? []).filter((x) => x !== id);
  atualizarItensPassivos(c);
}
