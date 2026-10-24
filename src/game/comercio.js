// O COMÉRCIO da vila: dinheiro do grupo, o que cada loja tem, comprar e vender.
//
// O QUE É DO LIVRO
// - Barthen Provisões vende equipamento de aventura de até 25 po; armas e
//   armaduras, não (é com a Linene).
// - A Escudo Leão guarda armas e armaduras nos fundos, "de tudo um pouco",
//   pelos preços do Livro do Jogador.
// - Preços: a tabela do Livro do Jogador (`rules/items`).
// - Vender: equipamento rende METADE do preço; gema, joia e obra de arte
//   rendem o valor cheio (Livro do Jogador, "Vendendo Tesouros").
//
// O QUE É NOSSO
// - Quem compra o quê de volta: a Barthen o que ela vende, a Linene armas e
//   armaduras, e o Câmbio de Minério da Halia — que pesa e paga o que os
//   garimpeiros acham — as pedras e os objetos de valor.
// - O dinheiro é do GRUPO: a compra sai do bolso de todos, das moedas menores
//   para as maiores, com troco; a venda vai para quem vendeu.

import { WEAPONS, ARMORS, SHIELD, itemDeId, garantirInventario, noEncaixe, avisoDeArmadura, treinoEmArmadura } from '../rules/equipment.js';
import { GEAR, AMMO } from '../rules/items/index.js';

// ------------------------------------------------------------ dinheiro ----
// Valor em peças de cobre: 1 po = 10 pp = 100 pc.
export const VALOR = { moedaDeCobre: 1, moedaDePrata: 10, moedaDeOuro: 100, moedaDePlatina: 1000 };
const MOEDAS = ['moedaDeCobre', 'moedaDePrata', 'moedaDeOuro', 'moedaDePlatina'];

// `garantirInventario` antes de tudo: a mochila nasce preguiçosa, e criar
// `bag = []` por fora apagaria as poções e o ouro iniciais do herói.
export const totalEmCobre = (grupo) =>
  grupo.reduce((s, c) => s + garantirInventario(c).bag.reduce((t, i) => t + (VALOR[i.id] ?? 0) * i.qtd, 0), 0);

export function guardar(c, id, qtd) {
  if (qtd <= 0) return;
  const b = garantirInventario(c).bag.find((i) => i.id === id && (VALOR[id] || itemDeId(id)?.dados.pilha));
  if (b) b.qtd += qtd; else c.bag.push({ id, tipo: 'item', qtd });
}

/** Paga `pc` em moedas para um herói: ouro, depois prata, depois cobre. */
export function pagarEmMoedas(c, pc) {
  guardar(c, 'moedaDeOuro', Math.floor(pc / 100));
  guardar(c, 'moedaDePrata', Math.floor((pc % 100) / 10));
  guardar(c, 'moedaDeCobre', pc % 10);
}

/** Cobra `pc` do grupo, das moedas menores para as maiores, devolvendo troco. */
export function cobrar(grupo, pc) {
  if (totalEmCobre(grupo) < pc) return false;
  let falta = pc;
  // Todas as pilhas de cada moeda, não só a primeira: um saque guardado à
  // parte é dinheiro igual.
  for (const id of MOEDAS) {
    for (const c of grupo) {
      for (const m of c.bag.filter((i) => i.id === id)) {
        while (m.qtd > 0 && falta > 0) { m.qtd -= 1; falta -= VALOR[id]; }
      }
    }
  }
  for (const c of grupo) c.bag = c.bag.filter((i) => !VALOR[i.id] || i.qtd > 0);
  if (falta < 0) pagarEmMoedas(grupo[0], -falta);
  return falta <= 0;
}

/** Divide `pc` pelo grupo: partes iguais, e o resto com o primeiro. */
export function repartir(grupo, pc) {
  const parte = Math.floor(pc / grupo.length);
  grupo.forEach((c, i) => pagarEmMoedas(c, parte + (i === 0 ? pc - parte * grupo.length : 0)));
}

/** Paga a cada herói `po` peças de ouro. */
export const pagarCada = (grupo, po) => grupo.forEach((c) => guardar(c, 'moedaDeOuro', po));

/** "12 po, 3 pp" a partir de peças de cobre. */
export function moedas(pc) {
  const po = Math.floor(pc / 100);
  const pp = Math.floor((pc % 100) / 10);
  const c = pc % 10;
  return [po && `${po} po`, pp && `${pp} pp`, c && `${c} pc`].filter(Boolean).join(', ') || '0 po';
}

// --------------------------------------------------------------- lojas ----
// Munição se vende em lote, como na tabela: vinte flechas por 1 po.
const LOTE = { flechas: 20, virotes: 20, balasDeFunda: 20, agulhas: 50 };

const emCobre = (po) => Math.round(po * 100);
// Item de catálogo tem `custo`; tesouro da aventura (o sapo de jade, o
// pingente) tem `valor`, que é o que ele rende numa balança honesta.
const valorDe = (d) => d.custo ?? d.valor ?? 0;
// Item de missão (o pente da banshee) não se vende: `vendavel: false`.
const ehTesouro = (d) => d.vendavel !== false
  && (d.tipo === 'tesouro' || (d.valor > 0 && !d.base && !d.consumivel && !d.missao));
const mundano = (d) => !d.raridade && !d.campanha && d.fonte !== undefined;

function linha(id) {
  const achado = itemDeId(id);
  const lote = LOTE[id] ?? 1;
  return { id, tipo: achado.tipo, dados: achado.dados, lote, preco: emCobre(valorDe(achado.dados) * lote) };
}

const porPreco = (a, b) => a.preco - b.preco || a.dados.name.localeCompare(b.dados.name);

/** O que a Barthen tem na prateleira: equipamento de aventura até 25 po. */
function estoqueBarthen() {
  return [...Object.values(GEAR), ...Object.values(AMMO)]
    .filter((d) => d.custo > 0 && d.custo * (LOTE[d.id] ?? 1) <= 25 && mundano(d)
      && !['moeda', 'tesouro'].includes(d.tipo))
    .map((d) => linha(d.id)).sort(porPreco);
}

/** Os fundos da Escudo Leão: as armas e as armaduras da tabela, e o escudo. */
function estoqueEscudoLeao() {
  const armas = Object.values(WEAPONS).filter((d) => d.custo > 0 && mundano(d)).map((d) => linha(d.id)).sort(porPreco);
  const armaduras = Object.values(ARMORS).filter((d) => d.id !== 'nenhuma' && d.custo > 0 && mundano(d)).map((d) => linha(d.id)).sort(porPreco);
  return [...armas, ...armaduras, linha(SHIELD.id)];
}

let _idsDaBarthen = null;
const idsDaBarthen = () => (_idsDaBarthen ??= new Set(estoqueBarthen().map((l) => l.id)));

export const LOJAS = {
  barthen: {
    nome: 'Barthen Provisões', npc: 'elmar',
    estoque: estoqueBarthen,
    // Compra de volta o que ela mesma venderia, e só isso.
    compra: (d) => idsDaBarthen().has(d.id),
    fala: { comprar: 'Fique à vontade. O que não estiver na prateleira, eu não tenho.', vender: 'Pago a metade do que vale. É o justo, num lugar destes.' },
  },
  escudoLeao: {
    nome: 'Transações Escudo Leão', npc: 'linene',
    estoque: estoqueEscudoLeao,
    compra: (d, tipo) => ['arma', 'armadura', 'escudo'].includes(tipo) && d.custo > 0 && mundano(d),
    fala: { comprar: 'Os fundos. Olhe, pergunte, não encoste o que não vai levar.', vender: 'Metade do preço, e só se estiver inteiro.' },
  },
  cambio: {
    nome: 'Câmbio de Minério', npc: 'halia',
    estoque: () => [],
    // Tesouro rende o valor cheio: é para isso que existe uma balança.
    compra: (d) => ehTesouro(d),
    valorCheio: true,
    fala: { vender: 'Pedra, metal, coisa bonita: a balança diz quanto vale, e eu pago o que ela diz.' },
  },
};

// ------------------------------------------------------- comprar e vender ----
/** Por que este herói não pode levar isto. `null` = pode. Aviso não impede. */
export function motivoParaNaoComprar(heroi, l, grupo) {
  if (totalEmCobre(grupo) < l.preco) return 'o grupo não tem dinheiro';
  return null;
}

/** Avisos de treino: compra-se, mas o herói precisa saber o preço de usar. */
export function avisoDeTreino(heroi, l) {
  if (l.tipo === 'arma') {
    const t = heroi.weaponTraining;
    if (t && !t.includes(l.dados.categoria) && !t.includes(l.id)) return `${heroi.name} não tem treino com ela: sem proficiência no ataque`;
  }
  if (l.tipo === 'armadura') return avisoDeArmadura(heroi, l.id);
  if (l.tipo === 'escudo') {
    if (!treinoEmArmadura(heroi).includes('escudo')) return `${heroi.name} não tem treino com escudo`;
  }
  return null;
}

export function comprar(heroi, l, grupo) {
  garantirInventario(heroi);
  const motivo = motivoParaNaoComprar(heroi, l, grupo);
  if (motivo) return { ok: false, why: motivo };
  cobrar(grupo, l.preco);
  if (l.tipo === 'arma') (heroi.weapons ??= []).push(l.id);
  else if (l.tipo === 'armadura' || l.tipo === 'escudo') heroi.bag.push({ id: l.id, tipo: l.tipo, qtd: 1 });
  else if (l.dados.pilha) guardar(heroi, l.id, l.lote);
  else heroi.bag.push({ id: l.id, tipo: 'item', qtd: 1 });
  return { ok: true };
}

/**
 * O que este herói pode vender nesta loja, com o preço que a loja paga por
 * UMA unidade (um lote, na munição). Arma na mão e armadura vestida não
 * entram: primeiro se guarda, depois se vende.
 */
export function vendaveis(heroi, loja) {
  garantirInventario(heroi);
  const nasMaos = [noEncaixe(heroi, 'maoPrincipal'), noEncaixe(heroi, 'maoSecundaria')];
  const lista = [];
  const pagar = (d, lote) => {
    const cheio = emCobre(valorDe(d) * lote);
    return loja.valorCheio ? cheio : Math.floor(cheio / 2);
  };
  for (const id of heroi.weapons ?? []) {
    const d = WEAPONS[id];
    if (!d || nasMaos.includes(id) || !loja.compra(d, 'arma')) continue;
    lista.push({ id, tipo: 'arma', dados: d, qtd: 1, lote: 1, paga: pagar(d, 1) });
  }
  // Duas cordas são duas entradas na mochila, mas uma linha na venda.
  const quantos = new Map();
  for (const e of heroi.bag) quantos.set(e.id, (quantos.get(e.id) ?? 0) + e.qtd);
  for (const [id, qtd] of quantos) {
    const achado = itemDeId(id);
    if (!achado || VALOR[id]) continue;
    const { tipo, dados } = achado;
    if (!loja.compra(dados, tipo)) continue;
    const lote = Math.min(LOTE[id] ?? 1, qtd);
    lista.push({ id, tipo, dados, qtd, lote, paga: pagar(dados, lote) });
  }
  return lista.filter((v) => v.paga > 0);
}

export function vender(heroi, v) {
  if (v.tipo === 'arma') {
    const i = heroi.weapons.indexOf(v.id);
    if (i < 0) return { ok: false, why: 'não está com ele' };
    heroi.weapons.splice(i, 1);
  } else {
    let falta = v.lote;
    if ((heroi.bag ?? []).filter((e) => e.id === v.id).reduce((t, e) => t + e.qtd, 0) < falta) return { ok: false, why: 'não está na mochila' };
    for (let i = heroi.bag.length - 1; i >= 0 && falta > 0; i--) {
      const e = heroi.bag[i];
      if (e.id !== v.id) continue;
      const tira = Math.min(e.qtd, falta);
      e.qtd -= tira;
      falta -= tira;
      if (e.qtd <= 0) heroi.bag.splice(i, 1);
    }
  }
  pagarEmMoedas(heroi, v.paga);
  return { ok: true };
}
