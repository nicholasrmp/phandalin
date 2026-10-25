// Mantimentos de viagem: comida, água, fome, sede e o que se acha pelo caminho.
//
// Livro do Jogador, "Comida e Água" e "Forragear". Cada pessoa precisa, por
// dia de estrada, de UMA ração e de QUATRO LITROS de água — oito no calor.
//
// FOME. Dá para aguentar sem comer um número de dias igual a 3 + o modificador
// de Constituição (no mínimo um). Passado esse limite, cada dia a mais custa um
// degrau de exaustão. Meia ração conta como meio dia sem comer, e um dia de
// comida de verdade zera a conta.
//
// SEDE. Quem bebe só metade do dia faz um teste de Constituição CD 15 ou ganha
// um degrau de exaustão no fim do dia. Quem bebe menos que isso ganha o degrau
// sem teste. Quem já estava exausto ganha DOIS degraus, nos dois casos.
//
// FORRAGEAR. Um teste de Sobrevivência contra a CD do terreno (10 onde há
// fartura, 15 no comum, 20 no ermo). Quem passa acha 1d6 + Sabedoria de comida
// e 1d6 + Sabedoria de litros de água.
//
// SIMPLIFICAÇÕES E REGRAS DA CASA, todas declaradas no jogo (no painel de
// partida da viagem, na tela do acampamento e no texto de cada magia):
//   - um galão do livro vale QUATRO LITROS aqui, que é o dia de uma pessoa;
//   - o cantil guarda quatro litros, um dia inteiro. É regra da casa: o odre
//     do livro guarda quatro pints, metade disso. Com meio dia por cantil, a
//     sede seria o assunto de toda viagem, e não o tempero dela;
//   - a água viaja só em cantil, então o que se acha além do que cabe se perde;
//   - água parada de brejo mata a sede, mas cobra um teste de Constituição
//     CD 11 de quem bebe sem purificar. O livro não dá número para água ruim;
//   - caçar e colher só em ritmo normal ou lento (`rules/marcha.js`), e um dia
//     curto de chegada ainda custa um dia inteiro de comida e água.

import { abilityMod, skillBonus, saveBonus } from './abilities.js';
import { savingThrow, d20, roll } from '../core/dice.js';
import { mudarExaustao, nivelDeExaustao, addCondition, exaustaoFatal, conditionEffects } from './conditions.js';
import { garantirInventario } from './equipment.js';

/**
 * Teste de resistência de Constituição da estrada. Usa o bônus de resistência
 * da ficha (não só o modificador) e a desvantagem do 3º degrau de exaustão,
 * como qualquer resistência do motor.
 */
function resistenciaDeCon(rng, c, cd) {
  const desvantagem = nivelDeExaustao(c) >= 3;
  return savingThrow(rng, saveBonus(c, 'con'), cd, { disadvantage: desvantagem });
}

export const RACAO_POR_DIA = 1;
export const AGUA_POR_DIA = 4;
export const AGUA_NO_CALOR = 8;
/** O cantil da casa: quatro litros, o dia inteiro de uma pessoa. O odre do
 *  livro guarda metade disso — ver as regras da casa no topo. */
export const CANTIL_LITROS = 4;
export const CD_FORRAGEM = { farto: 10, comum: 15, ermo: 20 };

/** Quantos dias esta pessoa aguenta sem comer antes de a fome cobrar. */
export function limiteSemComida(c) {
  return Math.max(1, 3 + abilityMod(c.abilities?.con ?? 10));
}

// ------------------------------------------------------------- a mochila ----

/** Quantas rações a pessoa carrega. */
export function racoesDe(c) {
  return (c.bag ?? []).filter((i) => i.id === 'racoes').reduce((n, i) => n + (i.qtd ?? 0), 0);
}

/** Tira `n` rações da mochila e devolve quantas saíram de verdade. */
export function gastarRacoes(c, n = 1) {
  let faltam = n;
  for (const i of (c.bag ?? []).filter((x) => x.id === 'racoes')) {
    const tira = Math.min(faltam, i.qtd ?? 0);
    i.qtd -= tira;
    faltam -= tira;
    if (faltam <= 0) break;
  }
  c.bag = (c.bag ?? []).filter((i) => i.id !== 'racoes' || (i.qtd ?? 0) > 0);
  return n - faltam;
}

/** Põe `n` rações na mochila. */
export function darRacoes(c, n = 1) {
  if (n <= 0) return 0;
  const pilha = (c.bag ??= []).find((i) => i.id === 'racoes');
  if (pilha) pilha.qtd = (pilha.qtd ?? 0) + n;
  else c.bag.push({ id: 'racoes', tipo: 'item', qtd: n });
  return n;
}

/** Quantos cantis a pessoa carrega (cada um guarda quatro litros). */
const cantisDe = (c) => (c.bag ?? []).filter((i) => i.id === 'cantil');

/** Litros de água que a pessoa carrega agora. */
export function aguaDe(c) {
  return cantisDe(c).reduce((n, i) => n + (i.litros ?? 0), 0);
}

/** Quanto ainda cabe nos cantis da pessoa. */
export function capacidadeDeAgua(c) {
  return cantisDe(c).reduce((n, i) => n + (i.qtd ?? 1), 0) * CANTIL_LITROS;
}

/** Põe água nos cantis até encher; devolve quantos litros entraram. */
export function encherAgua(c, litros = Infinity) {
  let resta = litros;
  let entrou = 0;
  for (const i of cantisDe(c)) {
    const cabe = (i.qtd ?? 1) * CANTIL_LITROS - (i.litros ?? 0);
    const põe = Math.max(0, Math.min(cabe, resta));
    i.litros = (i.litros ?? 0) + põe;
    entrou += põe;
    resta -= põe;
    if (resta <= 0) break;
  }
  return entrou;
}

/** Bebe até `litros`; devolve quantos litros saíram dos cantis. */
export function beberAgua(c, litros) {
  let resta = litros;
  let bebeu = 0;
  for (const i of cantisDe(c)) {
    const tira = Math.max(0, Math.min(i.litros ?? 0, resta));
    i.litros = (i.litros ?? 0) - tira;
    bebeu += tira;
    resta -= tira;
    if (resta <= 0) break;
  }
  return bebeu;
}

/** Enche os cantis de todo o grupo num riacho, poço ou taverna. */
export function encherCantis(herois) {
  let total = 0;
  for (const c of herois) total += encherAgua(c);
  return total;
}

// --------------------------------------------------------------- o dia ----

/**
 * Um dia de comida para uma pessoa. `fontes` é o que o grupo tem fora da
 * mochila dela (Bom Fruto, Criar Comida e Água): uma lista de
 * { racoes, nome } que se gasta antes de mexer na mochila dos outros.
 *
 * Com `meia`, come metade: o livro deixa esticar as provisões assim, e meia
 * ração conta como MEIO dia sem comer. Duas pessoas de meia ração gastam uma
 * ração inteira, então a conta corre num saldo do grupo (`meias`).
 *
 * Devolve { comeu: 'inteiro' | 'metade' | 'nada', de }.
 */
function comerUmDia(c, herois, fontes, { meia = false } = {}) {
  // Meia ração: a pessoa abre uma ração e guarda a outra metade para amanhã.
  // É isso que faz a comida durar o dobro.
  if (meia) {
    if (c.meiaRacaoAberta) {
      c.meiaRacaoAberta = false;
      return { comeu: 'metade', de: null };
    }
    // A comida de magia estraga no fim do dia: não dá para guardar metade dela
    // para amanhã. Quem come dela come o dia inteiro.
    const fonteM = fontes.find((f) => f.racoes > 0);
    if (fonteM) {
      fonteM.racoes -= 1;
      return { comeu: 'inteiro', de: fonteM.nome };
    }
    if (gastarRacoes(c, 1)) {
      c.meiaRacaoAberta = true;
      return { comeu: 'metade', de: null };
    }
    const vizinho = herois.find((o) => o !== c && racoesDe(o) > 0);
    if (vizinho && gastarRacoes(vizinho, 1)) {
      c.meiaRacaoAberta = true;
      return { comeu: 'metade', de: vizinho.name };
    }
    return { comeu: 'nada', de: null };
  }
  // Comendo direito, a metade guardada entra no prato: a refeição do dia sai
  // dela mais metade de uma ração nova, não de uma ração inteira jogada em
  // cima da outra.
  if (c.meiaRacaoAberta) {
    c.meiaRacaoAberta = false;
    if (gastarRacoes(c, 1)) { c.meiaRacaoAberta = true; return { comeu: 'inteiro', de: null }; }
    const vizinhoI = herois.find((o) => o !== c && racoesDe(o) > 0);
    if (vizinhoI && gastarRacoes(vizinhoI, 1)) { c.meiaRacaoAberta = true; return { comeu: 'inteiro', de: vizinhoI.name }; }
    // Só havia a metade guardada: dá meio dia, não o dia inteiro.
    return { comeu: 'metade', de: null };
  }
  const fonte = fontes.find((f) => f.racoes > 0);
  if (fonte) {
    fonte.racoes -= 1;
    return { comeu: 'inteiro', de: fonte.nome };
  }
  if (gastarRacoes(c, 1)) return { comeu: 'inteiro', de: null };
  // A mochila dela está vazia: o grupo divide o que ainda tem.
  const outro = herois.find((o) => o !== c && racoesDe(o) > 0);
  if (outro && gastarRacoes(outro, 1)) return { comeu: 'inteiro', de: outro.name };
  return { comeu: 'nada', de: null };
}

/**
 * Fecha um dia de viagem para o grupo: comida, água e o que a fome e a sede
 * cobram. Devolve as frases do registro.
 *
 * - `rng` é o dado semeado da campanha (teste de Constituição da sede).
 * - `calor` dobra a água do dia.
 * - `agua` diz que o caminho tinha riacho, poço ou chuva: todo mundo bebe à
 *   vontade e enche os cantis de graça. `'suja'` é água parada de brejo ou
 *   poça: mata a sede, mas quem bebe sem purificar faz um teste de
 *   Constituição CD 11 ou passa o dia seguinte envenenado. (Regra da casa: o
 *   livro não dá número para água ruim, só diz que Purificar Alimentos e
 *   Bebidas limpa comida e bebida.)
 * - `purificada` diz que alguém conjurou Purificar Alimentos e Bebidas sobre
 *   a água do dia: aí ela não cobra nada.
 * - `fontes` são as rações mágicas do dia ({ racoes, nome }).
 */
export function diaDeViagem(rng, herois, { calor = false, agua = false, fontes = [], purificada = false, meiaRacao = false } = {}) {
  // A mochila é preguiçosa (`equipment.js`): na estrada ela precisa existir.
  for (const c of herois) garantirInventario(c);
  // I8: fome e sede no mesmo dia não se empilham. O "já estava exausto" que
  // dobra os degraus da sede é o do COMEÇO do dia, não o que a fome acabou de
  // dar — o livro trata os dois como o fecho do mesmo dia.
  const exaustoAoAmanhecer = new Map(herois.map((c) => [c, nivelDeExaustao(c) > 0]));
  for (const c of herois) { c.semAgua = false; }
  const linhas = [];
  const precisa = calor ? AGUA_NO_CALOR : AGUA_POR_DIA;
  const comFome = [];
  const comSede = [];
  const mortos = [];
  const deOutros = {};
  const aMeia = [];

  for (const c of herois) {
    if (c.dead) continue;
    // ---- comida ----
    const r = comerUmDia(c, herois, fontes, { meia: meiaRacao });
    if (r.comeu === 'inteiro') {
      c.diasSemComida = 0;
      // Só vale contar de onde veio quando não foi da própria mochila.
      if (r.de) (deOutros[r.de] ??= []).push(c.name);
    } else if (r.comeu === 'metade') {
      // Meia ração: meio dia sem comer, e a conta NÃO zera. O degrau só sai
      // quando um DIA INTEIRO a mais passa do limite — o livro cobra "ao fim
      // de cada dia além do limite", e meio dia não fecha um dia.
      const antesM = Math.floor(c.diasSemComida ?? 0);
      c.diasSemComida = (c.diasSemComida ?? 0) + 0.5;
      aMeia.push(c.name);
      const limiteM = limiteSemComida(c);
      const agoraM = Math.floor(c.diasSemComida);
      if (agoraM > antesM && agoraM > limiteM) {
        const n = mudarExaustao(c, 1);
        comFome.push(`${c.name} (meia ração há ${c.diasSemComida} dias, exaustão ${n})`);
        if (exaustaoFatal(c)) mortos.push(`${c.name} não acorda: morreu de fome e cansaço`);
      }
    } else {
      c.diasSemComida = (c.diasSemComida ?? 0) + 1;
      const limite = limiteSemComida(c);
      if (c.diasSemComida > limite) {
        const n = mudarExaustao(c, 1);
        comFome.push(`${c.name} (${c.diasSemComida}º dia sem comer, exaustão ${n})`);
        if (exaustaoFatal(c)) mortos.push(`${c.name} não acorda: morreu de fome e cansaço`);
      } else {
        comFome.push(`${c.name} (${c.diasSemComida}º dia sem comer, aguenta até ${limite})`);
      }
    }

    // ---- água ----
    if (agua) {
      encherAgua(c);
      // Água parada: mata a sede e pode cobrar depois (regra da casa).
      if (agua === 'suja' && !purificada) {
        const t = resistenciaDeCon(rng, c, 11);
        if (!t.success) {
          // Dura até o grupo dormir: o descanso longo a tira (`rules/descanso.js`).
          addCondition(c, 'envenenado', { rounds: Infinity });
          c.maldaAgua = true;
          comSede.push(`${c.name} bebeu da água parada e passou mal (CON ${t.total} contra 11) — envenenado até dormir`);
        }
      }
      continue;
    }
    // A água de magia (Criar Comida e Água, Criar ou Destruir Água) é bebida
    // antes do cantil: ela vence no fim do dia e o cantil não.
    let bebeu = 0;
    for (const f of fontes) {
      if (bebeu >= precisa || !(f.litros > 0)) continue;
      const tira = Math.min(f.litros, precisa - bebeu);
      f.litros -= tira;
      bebeu += tira;
    }
    bebeu += beberAgua(c, precisa - bebeu);
    if (bebeu >= precisa) continue;
    // O descanso longo só desfaz cansaço de quem comeu E bebeu (`descanso.js`).
    c.semAgua = true;
    const jaExausto = exaustoAoAmanhecer.get(c) ?? (nivelDeExaustao(c) > 0);
    const degraus = jaExausto ? 2 : 1;
    if (bebeu >= precisa / 2) {
      const t = resistenciaDeCon(rng, c, 15);
      if (t.success) {
        comSede.push(`${c.name} racionou a água e aguentou (CON ${t.total} contra 15)`);
      } else {
        const n = mudarExaustao(c, degraus);
        comSede.push(`${c.name} bebeu metade e não aguentou (CON ${t.total} contra 15, exaustão ${n})`);
        if (exaustaoFatal(c)) mortos.push(`${c.name} não acorda: morreu de sede e cansaço`);
      }
    } else {
      const n = mudarExaustao(c, degraus);
      comSede.push(`${c.name} passou o dia quase sem água (exaustão ${n})`);
      if (exaustaoFatal(c)) mortos.push(`${c.name} não acorda: morreu de sede e cansaço`);
    }
  }

  if (aMeia.length) linhas.push(`Meia ração: ${aMeia.join(', ')} ${aMeia.length > 1 ? 'comem' : 'come'} metade do dia — a comida dura o dobro, a fome anda na metade da velocidade.`);
  for (const [dono, quem] of Object.entries(deOutros)) {
    linhas.push(`${quem.join(', ')} come${quem.length > 1 ? 'm' : ''} do que ${dono} trouxe.`);
  }
  if (agua) linhas.push(agua === 'suja'
    ? `Água parada no caminho: mata a sede, mas é turva.${purificada ? ' Purificada antes de beber.' : ''}`
    : 'Água no caminho: todos bebem e enchem os cantis.');
  if (comFome.length) linhas.push(`Fome — ${comFome.join('; ')}.`);
  if (comSede.length) linhas.push(`Sede — ${comSede.join('; ')}.`);
  if (mortos.length) linhas.push(`${mortos.join('. ')}.`);
  return linhas;
}

// ------------------------------------------------------ comida de magia ----

/**
 * A despensa mágica do grupo: o que Criar Comida e Água e Criar ou Destruir
 * Água puseram na mão dele. Cada entrada vence no fim do dia em que foi feita.
 * Para a COMIDA isso é o livro (ela estraga em 24 horas); para a ÁGUA é regra
 * da casa — a água conjurada do livro não estraga, mas o grupo não tem onde
 * carregar mais do que cabe nos cantis.
 *
 * `estado` é o estado das magias de utilidade (`rules/utilidade.js`), e `dia`
 * é o dia da campanha, que `estadoDe` mantém em dia a partir de `vila.dia`.
 */
export function despensaMagica(estado) {
  return (estado.magicos ??= []);
}

/** Guarda comida ou água de magia. Devolve a entrada. */
export function guardarMagico(estado, { racoes = 0, litros = 0, nome, dia }) {
  const e = { racoes, litros, nome, dia };
  despensaMagica(estado).push(e);
  return e;
}

/** Joga fora o que foi conjurado em dias anteriores e o que já acabou. */
export function limparMagicoVencido(estado, dia) {
  const antes = despensaMagica(estado);
  const fica = antes.filter((e) => e.dia === dia && (e.racoes > 0 || e.litros > 0));
  const venceu = antes.filter((e) => !fica.includes(e) && (e.racoes > 0 || e.litros > 0));
  estado.magicos = fica;
  return venceu;
}

// ----------------------------------------------------------- forragear ----

/**
 * Um dia de caça e colheita. Devolve
 * { ok, teste, cd, racoes, litros, quem } — `racoes` e `litros` são o que
 * entrou de verdade na mochila e nos cantis (a água que não cabe se perde).
 */
export function forragear(rng, c, { terreno = 'comum', vantagem = false, grupo = null } = {}) {
  const cd = CD_FORRAGEM[terreno] ?? CD_FORRAGEM.comum;
  const bonus = skillBonus(c, 'sobrevivencia');
  // O 1º degrau de exaustão dá desvantagem em teste de atributo, e Sobrevivência é um.
  const fx = conditionEffects(c);
  const desvantagem = fx.desvantagemSoTeste.includes('wis') || fx.desvantagemTeste.includes('wis');
  const teste = d20(rng, bonus, { advantage: vantagem, disadvantage: desvantagem });
  if (teste.total < cd) return { ok: false, teste: teste.total, cd, racoes: 0, litros: 0, perdidos: 0, quem: c };
  const sab = abilityMod(c.abilities?.wis ?? 10);
  const comida = Math.max(0, roll(rng, '1d6').total + sab);
  // O livro conta GALÕES de água; aqui um galão são quatro litros, o dia de
  // uma pessoa (`AGUA_POR_DIA`).
  const liquido = Math.max(0, roll(rng, '1d6').total + sab) * AGUA_POR_DIA;
  const racoes = darRacoes(c, comida);
  // A água achada é do grupo, não de quem achou: um cantil só guarda um dia.
  const bocas = (grupo ?? [c]).filter((h) => !h.dead);
  let litros = 0;
  for (const h of bocas) litros += encherAgua(h, liquido - litros);
  return {
    ok: true, teste: teste.total, cd, racoes, litros, quem: c,
    perdidos: Math.max(0, liquido - litros), achou: { comida, liquido },
  };
}

/** Quem do grupo forrageia melhor: o maior bônus de Sobrevivência. */
export function melhorForrageador(herois) {
  return herois.filter((c) => !c.dead)
    .sort((a, b) => skillBonus(b, 'sobrevivencia') - skillBonus(a, 'sobrevivencia'))[0] ?? null;
}

/**
 * Um retrato do que o grupo tem, para a tela da viagem:
 * { racoes, agua, capacidade, dias } — `dias` é por quantos dias dá o que há.
 */
export function despensaDoGrupo(herois, { calor = false } = {}) {
  const vivos = herois.filter((c) => !c.dead);
  for (const c of vivos) garantirInventario(c);
  const bocas = Math.max(1, vivos.length);
  // A metade já aberta conta: é meio dia de comida que o grupo tem na mão.
  const racoes = vivos.reduce((n, c) => n + racoesDe(c), 0);
  const metades = vivos.filter((c) => c.meiaRacaoAberta).length;
  const agua = vivos.reduce((n, c) => n + aguaDe(c), 0);
  const capacidade = vivos.reduce((n, c) => n + capacidadeDeAgua(c), 0);
  const precisa = calor ? AGUA_NO_CALOR : AGUA_POR_DIA;
  return {
    racoes, agua, capacidade, bocas, metades,
    dias: Math.floor((racoes + metades / 2) / bocas),
    diasDeAgua: Math.floor(agua / (bocas * precisa)),
  };
}
