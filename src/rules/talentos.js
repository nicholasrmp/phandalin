// Os talentos de origem (Livro do Jogador de 2024), como regra da casa no 1º
// nível — ver a memória "regras dos livros". Regra nossa, escrita do zero: a
// mecânica segue o livro, o texto não.
//
// Tudo que os talentos fazem mora aqui. O motor (`combat.js`) só chama estas
// funções nos pontos certos — iniciativa, ataque, dano, resistência, cura,
// conjuração e item —, para os talentos não se espalharem pelo arquivo.
//
// DECISÃO DE JOGO: o que o livro deixa o jogador decidir na hora (gastar um
// ponto de sorte, usar a inspiração) o motor decide sozinho, e só quando muda
// o resultado: salvar um ataque ou resistência que falhou, ou atrapalhar um
// ataque que ia acertar. Perguntar no meio de cada rolagem travaria o combate;
// gastar sem mudar nada seria desperdiçar o recurso do jogador.
//
// DESCANSO: o jogo ainda não tem descanso. O que o livro devolve num descanso
// (pontos de sorte, a magia grátis do Iniciado, a canção do Músico) volta a
// cada encontro — é como se o grupo tivesse descansado antes de cada luta.

import { abilityMod, proficiencyBonus } from './abilities.js';
import { maxHpEfetivo } from './conditions.js';
import { CLASSES } from './classes/index.js';
import { roll } from '../core/dice.js';

export const temTalento = (c, id) => Boolean(c?.talentos?.includes(id));
const pb = (c) => c.proficiency ?? proficiencyBonus(c.level ?? 1);
// Uma vez por turno: marca com a rodada e o lado, sem precisar zerar.
const turno = (enc) => `${enc.round}:${enc.side}`;

// --------------------------------------------------------------- início ----

/**
 * Antes do primeiro turno: devolve o que volta no descanso e espalha a
 * Inspiração do Músico.
 */
export function prepararTalentos(enc) {
  for (const c of enc.combatants) {
    if (temTalento(c, 'sortudo')) c.pontosDeSorte = pb(c);
    if (temTalento(c, 'iniciadoEmMagia') && c.magiaGratis) c.magiaGratis.usada = false;
  }
  // Canção Encorajadora: até [bônus de proficiência] aliados ficam
  // inspirados, o próprio músico primeiro.
  for (const musico of enc.combatants.filter((c) => temTalento(c, 'musico') && !c.dead)) {
    const aliados = [musico, ...enc.combatants.filter((c) => c.side === musico.side && c !== musico && !c.dead)];
    const inspirados = aliados.filter((c) => !c.inspirado).slice(0, pb(musico));
    for (const c of inspirados) c.inspirado = true;
    if (inspirados.length) {
      enc.say('recurso', `${musico.name} toca antes da luta: ${inspirados.map((c) => c.name).join(', ')} ganham Inspiração.`,
        'Músico: cada um pode rolar de novo um ataque ou uma resistência que falhar');
    }
  }
}

/** Bônus de iniciativa de um combatente (o grupo usa o maior). */
export function bonusDeIniciativa(c) {
  return abilityMod(c.abilities.dex) + (temTalento(c, 'alerta') ? pb(c) : 0);
}

// ------------------------------------------------------------- d20 ----

/** Refaz a jogada de ataque com um d20 novo e o critério dado. */
function refazerAtaque(enc, atk, bonus, ac, escolher) {
  const novo = enc.rng.die(20);
  const natural = escolher(atk.natural, novo);
  const critical = natural === 20;
  const fumble = natural === 1;
  const total = natural + bonus;
  return {
    ...atk, natural, total, rolls: [...atk.rolls, novo],
    critical, fumble, hit: critical || (!fumble && total >= ac),
  };
}

/**
 * A jogada de ataque depois dos talentos: Sortudo e Inspiração de quem ataca
 * (para salvar um erro), Sortudo de quem é atacado (para estragar um acerto).
 */
export function segundaChanceNoAtaque(enc, atacante, alvo, atk, bonus, ac) {
  let r = atk;
  if (!r.hit && (atacante.pontosDeSorte ?? 0) > 0) {
    atacante.pontosDeSorte -= 1;
    r = refazerAtaque(enc, r, bonus, ac, Math.max);
    enc.say('recurso', `${atacante.name} usa a sorte: vantagem no ataque${r.hit ? ', e acerta' : ''}.`,
      `Sortudo · restam ${atacante.pontosDeSorte} pontos`);
  }
  if (!r.hit && atacante.inspirado) {
    atacante.inspirado = false;
    r = refazerAtaque(enc, r, bonus, ac, (_, novo) => novo);
    enc.say('recurso', `${atacante.name} usa a Inspiração e rola o ataque de novo${r.hit ? ': acerta' : ''}.`);
  }
  if (r.hit && !r.critical && (alvo.pontosDeSorte ?? 0) > 0) {
    alvo.pontosDeSorte -= 1;
    r = refazerAtaque(enc, r, bonus, ac, Math.min);
    enc.say('recurso', `${alvo.name} usa a sorte: desvantagem no ataque de ${atacante.name}${r.hit ? ', que acerta mesmo assim' : ', que erra'}.`,
      `Sortudo · restam ${alvo.pontosDeSorte} pontos`);
  }
  return r;
}

/** O teste de resistência depois do Sortudo e da Inspiração. */
export function segundaChanceNaResistencia(enc, c, save, bonus, dc) {
  let r = save;
  const refaz = (escolher) => {
    const novo = enc.rng.die(20);
    const natural = escolher(r.natural, novo);
    return { ...r, natural, total: natural + bonus, rolls: [...r.rolls, novo], success: natural + bonus >= dc };
  };
  if (!r.success && (c.pontosDeSorte ?? 0) > 0) {
    c.pontosDeSorte -= 1;
    r = refaz(Math.max);
    enc.say('recurso', `${c.name} usa a sorte na resistência${r.success ? ' e passa' : ''}.`, `Sortudo · restam ${c.pontosDeSorte} pontos`);
  }
  if (!r.success && c.inspirado) {
    c.inspirado = false;
    r = refaz((_, novo) => novo);
    enc.say('recurso', `${c.name} usa a Inspiração e rola a resistência de novo${r.success ? ': passa' : ''}.`);
  }
  return r;
}

// ------------------------------------------------------------- dano ----

/** Rola dados de dano de novo onde saiu 1 (uma vez, fica o novo). */
function refazerUns(enc, dano) {
  if (!dano.rolls.includes(1)) return dano;
  const lados = Number(/d(\d+)/.exec(dano.notation)?.[1] ?? 0);
  if (!lados) return dano;
  const rolls = dano.rolls.map((v) => (v === 1 ? enc.rng.die(lados) : v));
  const total = Math.max(0, rolls.reduce((a, b) => a + b, 0) + dano.mod);
  return { ...dano, rolls, total };
}

/**
 * O dano da arma depois dos talentos:
 *   Atacante Selvagem  uma vez por turno, rola os dados de novo e fica com o
 *                      maior total
 *   Brigão de Taverna  no soco, dados que derem 1 são rolados de novo
 */
export function ajustarDanoDeArma(enc, atacante, p, dano) {
  let r = dano;
  if (p.weapon?.id === 'punhos' && temTalento(atacante, 'brigaoDeTaverna')) r = refazerUns(enc, r);
  if (p.weapon && temTalento(atacante, 'atacanteSelvagem') && atacante.selvagemNoTurno !== turno(enc)) {
    atacante.selvagemNoTurno = turno(enc);
    const segunda = rolarDeNovo(enc, r);
    if (segunda.total > r.total) {
      enc.say('recurso', `${atacante.name} bate com selvageria: fica com ${segunda.total} em vez de ${r.total}.`, 'Atacante Selvagem');
      r = segunda;
    } else {
      enc.say('recurso', `${atacante.name} bate com selvageria, mas a primeira rolagem era melhor (${r.total} contra ${segunda.total}).`, 'Atacante Selvagem');
    }
  }
  return r;
}

function rolarDeNovo(enc, dano) {
  const lados = Number(/d(\d+)/.exec(dano.notation)?.[1] ?? 0);
  if (!lados) return dano;
  const rolls = dano.rolls.map(() => enc.rng.die(lados));
  return { ...dano, rolls, total: Math.max(0, rolls.reduce((a, b) => a + b, 0) + dano.mod) };
}

/** Depois do acerto: o empurrão do Brigão de Taverna, uma vez por turno. */
export function depoisDoAcerto(enc, atacante, alvo, p) {
  if (p.weapon?.id !== 'punhos' || !temTalento(atacante, 'brigaoDeTaverna')) return;
  if (atacante.empurraoNoTurno === turno(enc) || alvo.dead) return;
  atacante.empurraoNoTurno = turno(enc);
  enc.empurrar(alvo, atacante.pos, 5);
}

// ------------------------------------------------------------- cura ----

/** Dado de cura de magia: o Curandeiro rola de novo os que derem 1. */
export function rolarCura(enc, notacao, conjurador) {
  const r = roll(enc.rng, notacao);
  if (!temTalento(conjurador, 'curandeiro') || !r.rolls.includes(1)) return r;
  const lados = Number(/d(\d+)/.exec(String(notacao))?.[1] ?? 0);
  const rolls = r.rolls.map((v) => (v === 1 ? enc.rng.die(lados) : v));
  return { ...r, rolls, total: rolls.reduce((a, b) => a + b, 0) + r.mod };
}

/** Dados de vida que sobram (começa com um por nível). */
const dadosDeVida = (c) => (c.dadosDeVidaRestantes ??= c.level ?? 1);

/**
 * Médico de Campanha: com o kit, uma ação para cuidar de um aliado encostado
 * — ele gasta um dado de vida, o curandeiro rola e soma o próprio bônus de
 * proficiência. Quem está caído também levanta. Devolve null se não vale.
 */
export function vetoDoMedico(curandeiro, alvo) {
  if (!temTalento(curandeiro, 'curandeiro')) return undefined;   // regra normal do kit
  if (alvo.dead) return `${alvo.name} já morreu`;
  if (alvo.hp >= maxHpEfetivo(alvo)) return `${alvo.name} está com a vida cheia`;
  if (dadosDeVida(alvo) <= 0) return `${alvo.name} não tem mais dado de vida para gastar`;
  return null;
}

export function medicoDeCampanha(enc, curandeiro, alvo) {
  const lados = CLASSES[alvo.classe]?.dadoDeVida ?? 8;
  alvo.dadosDeVidaRestantes = dadosDeVida(alvo) - 1;
  let dado = enc.rng.die(lados);
  let nota = `d${lados}[${dado}]`;
  if (dado === 1) { dado = enc.rng.die(lados); nota += `→${dado}`; }
  const total = dado + pb(curandeiro);
  const curou = enc.heal(alvo, total, curandeiro);
  enc.say('cura', `${curandeiro.name} cuida de ${alvo.name} com o kit: ${curou} PV.`,
    `Médico de Campanha · ${nota} + ${pb(curandeiro)} de proficiência · ${alvo.name} gasta um dado de vida (restam ${alvo.dadosDeVidaRestantes})`);
}

// -------------------------------------------------------------- magia ----

/** O Iniciado em Magia conjura a magia de 1º círculo dele de graça, uma vez. */
export function temUsoGratis(c, spellId) {
  return Boolean(c.magiaGratis && c.magiaGratis.id === spellId && !c.magiaGratis.usada);
}

export function gastarUsoGratis(enc, c) {
  c.magiaGratis.usada = true;
  enc.say('recurso', `${c.name} usa a magia de Iniciado sem gastar espaço (uma vez por descanso).`);
}

/** Atributo de conjuração do Iniciado sem classe conjuradora: o melhor mental. */
export function atributoDoIniciado(abilities) {
  return ['int', 'wis', 'cha'].reduce((melhor, a) => (abilities[a] > abilities[melhor] ? a : melhor), 'int');
}

