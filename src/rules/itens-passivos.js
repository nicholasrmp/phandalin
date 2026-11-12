// O QUE O ITEM FAZ SÓ POR ESTAR COM O HERÓI: o anel de proteção, o manto élfico, as manoplas de força de ogro, os óculos
// de visão noturna. O irmão de `itens-que-conjuram.js`, que cuida do item que conjura.
//
// O item declara `passivo` no catálogo:
//   passivo: {
//     ca: 1,                    // +N na CA, sempre
//     caSemArmadura: 2,         // +N só sem armadura e sem escudo (os braceletes de defesa)
//     caBase: 15,               // sem armadura, a CA base vira N + Destreza (o manto do arquimago)
//     salvas: 1,                // +N em todas as resistências
//     testes: 1,                // +N em todo teste de perícia (a pedra da boa sorte)
//     pericias: { prestidigitacao: 5 },      // +N numa perícia
//     vantagemPericia: ['furtividade'],      // vantagem numa perícia
//     vantagemContraMagia: true,             // vantagem nas resistências contra magia
//     resiste: ['fogo'], imune: ['veneno'], imuneCondicao: ['envenenado'],
//     atributos: { str: 19 },   // o atributo VIRA N, se não for maior
//     somaAtributo: { con: 2 }, // +N no atributo, até 20 (o cinturão dos anões)
//     vulneravel: ['cortante'], vantagemContraVeneno: true,
//     resisteNaoMagico: ['cortante'], semCritico: true,   // a armadura da invulnerabilidade, a adamantina
//     evasao: true,             // a reação e uma carga (`recarregavel`) passam o teste de Destreza que falhou
//     visao: 60,                // visão no escuro de N pés
//     respiraNaAgua: true,
//     nado: true,                   nada com o deslocamento de andar (a água funda não custa o dobro)
//     liberdade: true,          // a liberdade de movimento (o anel de ação livre)
//     iniciativa: true,         // vantagem na iniciativa (o jogo rola uma por lado: basta um herói)
//     cdMagia: 1, ataqueMagia: 1,            // na CD e no ataque de magia
//     soClasse: 'bruxo',        // o bônus de magia só vale para esta classe (o cetro do guardião do pacto)
//   }
// Vale se o item está na mochila e, quando pede sintonia, sintonizado. Dois iguais não somam.
//
// Quem lê: tudo lê `c.doItem`, a soma pronta, sem importar este módulo — `equipment.js armorClass`,
// `conditions.js conditionEffects` (salvas, liberdade), `abilities.js` (perícias, CD e ataque de magia), `luz.js`
// (visão), `passivas.js` (vantagem contra magia), `combat.js` (resistência, imunidade, iniciativa). Quem muda a mochila
// ou a sintonia chama `atualizarItensPassivos(c)`; o `Encounter` chama no começo de toda luta.
import { ITEMS, WEAPONS, ARMORS, SHIELDS } from './items/index.js';
import { armorClass } from './equipment.js';

const HABS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const mod = (v) => Math.floor(((v ?? 10) - 10) / 2);

/** Os dados de um item, em qualquer catálogo (a varinha na mochila, a espada na mão, a armadura, o escudo). */
export const dadosDoItem = (id) => ITEMS[id] ?? WEAPONS[id] ?? ARMORS[id] ?? SHIELDS[id] ?? null;

/**
 * Os ids que o herói CARREGA de um jeito que faz o item valer: o da mochila (menos a armadura e o escudo guardados, que
 * só valem vestidos), as armas (empunhadas ou não: o livro pede a mão no cajado, aqui basta tê-lo), a armadura vestida
 * e o escudo embraçado.
 */
export function idsCarregados(c) {
  const ids = new Set();
  for (const b of c?.bag ?? []) if ((b.qtd ?? 1) > 0 && !ARMORS[b.id] && !SHIELDS[b.id]) ids.add(b.id);
  for (const w of c?.weapons ?? []) ids.add(w);
  if (c?.armor && c.armor !== 'nenhuma') ids.add(c.armor);
  if (typeof c?.shield === 'string') ids.add(c.shield);
  return [...ids];
}

/** O herói tem o item consigo (na mochila, na mão, vestido)? É o que a sintonia pede. */
export const temOItem = (c, id) => (c?.bag ?? []).some((b) => b.id === id && (b.qtd ?? 1) > 0)
  || (c?.weapons ?? []).includes(id) || c?.armor === id || c?.shield === id;

/** Os itens carregados cujo passivo vale agora. */
export function itensPassivosAtivos(c) {
  const out = [];
  for (const id of idsCarregados(c)) {
    const dados = dadosDoItem(id);
    if (!dados?.passivo) continue;
    if (dados.sintonia && !(c.sintonizados ?? []).includes(id)) continue;
    out.push({ id, dados, passivo: dados.passivo });
  }
  return out;
}

const classeDe = (c) => c.classe;

/** A soma dos passivos (sem os atributos, que se aplicam à parte). Null se nenhum. */
export function somaDosPassivos(c) {
  const ativos = itensPassivosAtivos(c);
  if (!ativos.length) return null;
  const s = { itens: ativos.map((x) => x.id) };
  const somar = (k, v) => { if (v) s[k] = (s[k] ?? 0) + v; };
  const juntar = (k, v) => { if (v?.length) s[k] = [...new Set([...(s[k] ?? []), ...v])]; };
  for (const { dados, passivo: p } of ativos) {
    somar('ca', p.ca); somar('caSemArmadura', p.caSemArmadura); somar('salvas', p.salvas); somar('testes', p.testes);
    if (p.caBase) s.caBase = Math.max(s.caBase ?? 0, p.caBase);
    if (p.visao) s.visao = Math.max(s.visao ?? 0, p.visao);
    for (const [k, v] of Object.entries(p.pericias ?? {})) { s.pericias ??= {}; s.pericias[k] = (s.pericias[k] ?? 0) + v; }
    juntar('vantagemPericia', p.vantagemPericia); juntar('resiste', p.resiste); juntar('imune', p.imune); juntar('vulneravel', p.vulneravel);
    juntar('resisteNaoMagico', p.resisteNaoMagico);
    if (p.semCritico) s.semCritico = true;
    if (p.vantagemContraVeneno) s.vantagemContraVeneno = dados.name;
    if (p.evasao && dados.recarregavel) s.evasao = dados.id;
    juntar('imuneCondicao', p.imuneCondicao);
    if (p.vantagemContraMagia) s.vantagemContraMagia = dados.name;
    if (p.respiraNaAgua) s.respiraNaAgua = true;
    // NADA com o deslocamento de andar (a Armadura do Marinheiro): a água funda não é terreno difícil (`combat.js nadador`)
    if (p.nado) s.nado = true;
    if (p.liberdade) s.liberdade = true;
    if (p.iniciativa) s.iniciativa = dados.name;
    if (!p.soClasse || p.soClasse === classeDe(c)) { somar('cdMagia', p.cdMagia); somar('ataqueMagia', p.ataqueMagia); }
  }
  return s;
}

/**
 * Recalcula `c.doItem` e aplica os atributos dos itens (o atributo VIRA o valor do item; ao tirar o item, volta o do
 * herói). O valor do herói fica em `c.atributosDoItem[hab] = { natural, posto }`; o que mudou o atributo por fora
 * (o aumento de nível, o tomo) é somado ao natural antes de pôr o do item de novo. A Constituição muda os PV máximos.
 */
export function atualizarItensPassivos(c) {
  if (!c) return;
  // a sintonia de quem deu ou perdeu o item cai junto
  if (c.sintonizados?.length) c.sintonizados = c.sintonizados.filter((id) => temOItem(c, id));
  const antes = c.doItem ?? null;
  const conAntes = c.abilities?.con;
  // 1) devolve os atributos do herói
  for (const [hab, t] of Object.entries(c.atributosDoItem ?? {})) {
    if (!c.abilities) break;
    const agora = c.abilities[hab];
    const natural = t.natural + (agora - t.posto);
    c.abilities[hab] = natural;
  }
  delete c.atributosDoItem;
  // 2) a soma nova
  const soma = somaDosPassivos(c);
  if (soma) c.doItem = soma; else delete c.doItem;
  // 3) os atributos dos itens ativos
  if (c.abilities) {
    for (const { passivo } of itensPassivosAtivos(c)) {
      const novos = { ...(passivo.atributos ?? {}) };
      // o que SOMA (até 20) vira o valor final aqui, a partir do valor atual
      for (const [hab, v] of Object.entries(passivo.somaAtributo ?? {})) {
        const atual = c.abilities[hab] ?? 10;
        if (atual < 20) novos[hab] = Math.max(novos[hab] ?? 0, Math.min(20, atual + v));
      }
      for (const [hab, v] of Object.entries(novos)) {
        if (!HABS.includes(hab)) continue;
        const atual = c.abilities[hab] ?? 10;
        const natural = c.atributosDoItem?.[hab]?.natural ?? atual;
        if (v <= Math.max(atual, natural)) continue;
        c.atributosDoItem ??= {};
        c.atributosDoItem[hab] = { natural, posto: v };
        c.abilities[hab] = v;
      }
    }
  }
  // 4) a Constituição do item mexe nos PV máximos (a diferença do modificador por nível)
  if (c.abilities && conAntes != null && c.abilities.con !== conAntes && c.maxHp != null) {
    const dif = (mod(c.abilities.con) - mod(conAntes)) * (c.level ?? 1);
    if (dif) {
      c.maxHp += dif;
      c.hp = Math.max(c.hp > 0 ? 1 : 0, Math.min(c.maxHp, (c.hp ?? 0) + Math.max(0, dif)));
    }
  }
  // 5) a CA guardada, se o que pesa nela mudou (o monstro sem item não é tocado)
  const ca = (s) => `${s?.ca ?? 0}|${s?.caSemArmadura ?? 0}|${s?.caBase ?? 0}`;
  if (ca(antes) !== ca(c.doItem) && c.abilities && !c.formaSelvagem) c.ac = armorClass(c);
}

/** A resistência a uma magia vem de um item? Devolve o nome dele (para o registro), ou null. */
export const vantagemContraMagiaDoItem = (c) => c?.doItem?.vantagemContraMagia ?? null;
