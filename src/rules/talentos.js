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

import { abilityMod, proficiencyBonus, meiaProficiencia } from './abilities.js';
import { maxHpEfetivo, conditionEffects, getCondition } from './conditions.js';
import { ARMORS, WEAPONS } from './items/index.js';
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
    // SORTUDO do Livro do Jogador (2014): três pontos, e não o bônus de proficiência.
    if (temTalento(c, 'sortudoPhb')) c.pontosDeSorte = 3;
    if ((temTalento(c, 'iniciadoEmMagia') || temTalento(c, 'iniciadoEmMagiaPhb')) && c.magiaGratis) c.magiaGratis.usada = false;
  }
  // LÍDER INSPIRADOR: os dez minutos de discurso antes da luta. Até seis aliados (ele incluso) ganham PV temporários iguais
  // ao nível dele + Carisma; PV temporário não soma, fica o maior.
  for (const lider of enc.combatants.filter((c) => temTalento(c, 'liderInspirador') && !c.dead && c.hp > 0)) {
    const pv = (lider.level ?? 1) + abilityMod(lider.abilities?.cha ?? 10);
    if (pv <= 0) continue;
    const ouvem = [lider, ...enc.combatants.filter((c) => c.side === lider.side && c !== lider && !c.dead && c.kind === 'pc')].slice(0, 6);
    const ganham = ouvem.filter((c) => (c.tempHp ?? 0) < pv);
    for (const c of ganham) c.tempHp = pv;
    if (ganham.length) {
      enc.say('recurso', `${lider.name} fala antes da luta: ${ganham.map((c) => c.name).join(', ')} ganham ${pv} PV temporários.`, 'Líder Inspirador · nível + Carisma');
    }
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
  // A iniciativa é um teste de DES: Pau pra Toda Obra e Atleta Notável entram (`meiaProficiencia`).
  // ALERTA do Livro do Jogador (2014): +5 fixo, por cima do resto.
  // AUDÁCIA DESENFREADA (Espadachim, Xanathar): + o modificador de Carisma.
  return abilityMod(c.abilities.dex) + (temTalento(c, 'alerta') ? pb(c) : meiaProficiencia(c, 'dex')) + (temTalento(c, 'alertaPhb') ? 5 : 0)
    + (c.features?.includes('rakishAudacity') ? Math.max(0, abilityMod(c.abilities.cha ?? 10)) : 0)
    // EMBOSCADOR TEMÍVEL (Perseguidor Sombrio, Xanathar): + o modificador de Sabedoria.
    + (c.features?.includes('dreadAmbusher') ? Math.max(0, abilityMod(c.abilities.wis ?? 10)) : 0)
    // ASTÚCIA TÁTICA (Magia de Guerra, Xanathar): + o modificador de Inteligência.
    + (c.features?.includes('tacticalWit') ? Math.max(0, abilityMod(c.abilities.int ?? 10)) : 0);
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
/**
 * PRODÍGIO (mago de Adivinhação, 2º): depois de um descanso longo, 2d20 (3d20 no 14º) rolados e guardados; cada um SUBSTITUI uma jogada de
 * d20 de qualquer criatura que o mago veja. O jogo usa por conta própria, e só quando muda o resultado:
 *   - o d20 de um ALIADO que ia falhar (ataque ou resistência) vira o menor dado guardado que o faça passar;
 *   - o d20 de um INIMIGO que ia acertar um aliado (ou passar numa resistência) vira o maior dado que o faça falhar.
 * Testes de atributo não passam por aqui (o jogo não tem o hook), então o Prodígio não os cobre.
 */
export function garantirPortento(enc, c) {
  if (c.dead || !c.features?.includes('portent') || c.portento !== undefined) return;
  const n = c.features.includes('greaterPortent') ? 3 : 2;
  c.portento = Array.from({ length: n }, () => enc.rng.die(20));
  enc.say('recurso', `${c.name} lê os presságios do dia: ${c.portento.join(', ')} (Prodígio).`);
}

function adivinhoDe(enc, c, doLado) {
  return enc.combatants.filter((d) => !d.dead && d.features?.includes('portent') && d.portento?.length
    && (doLado ? d.side === c.side : d.side !== c.side) && !conditionEffects(d).incapacitated
    && enc.field.hasLineOfSight(d.pos, c.pos));
}

/** Gasta o dado do Prodígio que serve ao `criterio`; devolve o dado usado ou null. */
function gastarPortento(enc, adivinhos, criterio) {
  for (const d of adivinhos) {
    const ok = d.portento.filter(criterio).sort((a, b) => a - b);
    if (!ok.length) continue;
    return { d, dado: ok[0] };
  }
  return null;
}

function portentoNoAtaque(enc, atacante, alvo, r, bonus, ac) {
  if (!r.hit) {
    const uso = gastarPortento(enc, adivinhoDe(enc, atacante, true), (x) => x === 20 || (x !== 1 && x + bonus >= ac));
    if (uso) {
      uso.d.portento.splice(uso.d.portento.indexOf(uso.dado), 1);
      enc.say('recurso', `${uso.d.name} troca o d20 de ${atacante.name} pelo dado do Prodígio (${uso.dado}): acerta.`, 'Prodígio');
      return { ...r, natural: uso.dado, total: uso.dado + bonus, critical: uso.dado === 20, fumble: false, hit: true };
    }
  } else if (!r.critical) {
    const uso = gastarPortento(enc, adivinhoDe(enc, atacante, false), (x) => x === 1 || (x !== 20 && x + bonus < ac));
    if (uso) {
      uso.d.portento.splice(uso.d.portento.indexOf(uso.dado), 1);
      enc.say('recurso', `${uso.d.name} troca o d20 de ${atacante.name} pelo dado do Prodígio (${uso.dado}): erra.`, 'Prodígio');
      return { ...r, natural: uso.dado, total: uso.dado + bonus, critical: false, fumble: uso.dado === 1, hit: false };
    }
  }
  return r;
}

function portentoNaResistencia(enc, c, r, bonus, dc) {
  if (!r.success) {
    const uso = gastarPortento(enc, adivinhoDe(enc, c, true), (x) => x === 20 || x + bonus >= dc);
    if (uso) {
      uso.d.portento.splice(uso.d.portento.indexOf(uso.dado), 1);
      enc.say('recurso', `${uso.d.name} troca o d20 de ${c.name} pelo dado do Prodígio (${uso.dado}): passa.`, 'Prodígio');
      return { ...r, natural: uso.dado, total: uso.dado + bonus, success: true };
    }
  } else if (r.natural !== 20) {
    const uso = gastarPortento(enc, adivinhoDe(enc, c, false), (x) => x === 1 || x + bonus < dc);
    if (uso) {
      uso.d.portento.splice(uso.d.portento.indexOf(uso.dado), 1);
      enc.say('recurso', `${uso.d.name} troca o d20 de ${c.name} pelo dado do Prodígio (${uso.dado}): falha.`, 'Prodígio');
      return { ...r, natural: uso.dado, total: uso.dado + bonus, success: false };
    }
  }
  return r;
}

export function segundaChanceNoAtaque(enc, atacante, alvo, atk, bonus, ac) {
  let r = atk;
  // SORTE (halfling): um 1 natural no d20 do ataque é rolado de novo, e vale o novo — antes de qualquer outra segunda chance.
  if (r.fumble && atacante.features?.includes('lucky')) {
    r = refazerAtaque(enc, r, bonus, ac, (_, novo) => novo);
    enc.say('recurso', `${atacante.name} tira 1 e rola o d20 de novo (Sorte): ${r.natural}${r.hit ? ', e acerta' : ''}.`, 'Sorte do halfling');
  }
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
  // ATAQUE PRECISO (Mestre de Batalha): armado, um erro por pouco vira acerto somando o dado de superioridade. Só quando muda algo.
  if (!r.hit && !r.fumble && atacante.manobraPronta === 'precisionAttack' && (atacante.resources?.superiorityDice ?? 0) > 0) {
    const dado = roll(enc.rng, enc.dadoDeSuperioridade(atacante));
    if (r.total + dado.total >= ac) {
      atacante.resources.superiorityDice -= 1;
      r = { ...r, hit: true, total: r.total + dado.total };
      enc.say('recurso', `${atacante.name} soma ${dado.total} ao ataque (Ataque Preciso, restam ${atacante.resources.superiorityDice} dados).`);
    }
    atacante.manobraPronta = null;
  }
  // GOLPE DE SORTE (ladino Ladrão, 20º): um ataque que errou vira acerto. Uma vez por descanso curto ou longo. Automático na primeira
  // vez que erra (só o ataque: o jogo não rola teste de atributo com CD que dê para salvar).
  if (!r.hit && atacante.features?.includes('strokeOfLuck') && (atacante.resources?.strokeOfLuck ?? 0) > 0) {
    atacante.resources.strokeOfLuck -= 1;
    r = { ...r, hit: true };
    enc.say('recurso', `${atacante.name} vira o erro em acerto (Golpe de Sorte).`, 'Golpe de Sorte');
  }
  // PALAVRAS CORTANTES (bardo do Conhecimento, 3º): reação, gasta uma Inspiração Bárdica e SUBTRAI o dado do ataque de um inimigo a
  // até 18 m. Automática, mas só quando muda algo: um acerto que o dado transforma em erro (e nunca num crítico).
  if (r.hit && !r.critical && atacante.side !== alvo.side) {
    const bardo = enc.combatants.find((b) => !b.dead && b.side === alvo.side && b.features?.includes('cuttingWords') && !b.reactionUsed
      && (b.resources?.bardicInspiration ?? 0) > 0 && !conditionEffects(b).incapacitated
      && Math.max(Math.abs(b.pos.x - atacante.pos.x), Math.abs(b.pos.y - atacante.pos.y)) * 5 <= 60 && enc.field.hasLineOfSight(b.pos, atacante.pos));
    if (bardo) {
      const dado = enc.rng.die(Number((bardo.dadoDeInspiracao ?? 'd6').slice(1)));
      if (r.total - dado < ac) {
        bardo.reactionUsed = true;
        bardo.resources.bardicInspiration -= 1;
        r = { ...r, total: r.total - dado, hit: false };
        enc.say('recurso', `${bardo.name} corta com palavras (-${dado}): o ataque de ${atacante.name} erra ${alvo.name}.`, 'Palavras Cortantes');
      }
    }
  }
  if (r.hit && !r.critical && (alvo.pontosDeSorte ?? 0) > 0) {
    alvo.pontosDeSorte -= 1;
    r = refazerAtaque(enc, r, bonus, ac, Math.min);
    enc.say('recurso', `${alvo.name} usa a sorte: desvantagem no ataque de ${atacante.name}${r.hit ? ', que acerta mesmo assim' : ', que erra'}.`,
      `Sortudo · restam ${alvo.pontosDeSorte} pontos`);
  }
  // PRODÍGIO (mago de Adivinhação): por último, depois de todas as segundas chances.
  return portentoNoAtaque(enc, atacante, alvo, r, bonus, ac);
}

/** O teste de resistência depois do Sortudo e da Inspiração. */
export function segundaChanceNaResistencia(enc, c, save, bonus, dc) {
  let r = save;
  const refaz = (escolher) => {
    const novo = enc.rng.die(20);
    const natural = escolher(r.natural, novo);
    return { ...r, natural, total: natural + bonus, rolls: [...r.rolls, novo], success: natural + bonus >= dc };
  };
  // SORTE (halfling): um 1 natural na resistência é rolado de novo, e vale o novo.
  if (r.natural === 1 && c.features?.includes('lucky')) {
    r = refaz((_, novo) => novo);
    enc.say('recurso', `${c.name} tira 1 e rola a resistência de novo (Sorte): ${r.natural}${r.success ? ', e passa' : ''}.`, 'Sorte do halfling');
  }
  if (!r.success && (c.pontosDeSorte ?? 0) > 0) {
    c.pontosDeSorte -= 1;
    r = refaz(Math.max);
    enc.say('recurso', `${c.name} usa a sorte na resistência${r.success ? ' e passa' : ''}.`, `Sortudo · restam ${c.pontosDeSorte} pontos`);
  }
  // SORTE DO OBSCURO (bruxo do Corruptor, 6º): soma 1d10 a uma resistência. Uma vez por descanso curto ou longo; só gasta se o d10 muda
  // o resultado (a falha que ele salva).
  if (!r.success && c.features?.includes('darkOnesOwnLuck') && (c.resources?.darkOnesOwnLuck ?? 0) > 0) {
    const extra = enc.rng.die(10);
    if (r.total + extra >= dc) {
      c.resources.darkOnesOwnLuck -= 1;
      r = { ...r, total: r.total + extra, success: true };
      enc.say('recurso', `${c.name} pede a sorte do seu patrono (+${extra}) e passa na resistência.`, 'Sorte do Obscuro');
    }
  }
  // INDOMÁVEL (guerreiro, 9º; 2 usos no 13º, 3 no 17º): uma resistência que falhou é rolada de novo, e vale a nova.
  // O jogo usa por conta própria na primeira falha: rolar de novo nunca piora, mas gasta o uso mesmo numa resistência banal.
  if (!r.success && c.features?.includes('indomitable') && (c.resources?.indomitable ?? 0) > 0) {
    c.resources.indomitable -= 1;
    r = refaz((_, novo) => novo);
    enc.say('recurso', `${c.name} rola a resistência de novo (Indomável)${r.success ? ' e passa' : ''}.`, `Indomável · restam ${c.resources.indomitable}`);
  }
  if (!r.success && c.inspirado) {
    c.inspirado = false;
    r = refaz((_, novo) => novo);
    enc.say('recurso', `${c.name} usa a Inspiração e rola a resistência de novo${r.success ? ': passa' : ''}.`);
  }
  return portentoNaResistencia(enc, c, r, bonus, dc);
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
  // O ATACANTE SELVAGEM de 2014 é só no corpo a corpo; o de 2024, em qualquer golpe de arma.
  const selvagem = temTalento(atacante, 'atacanteSelvagem') || (temTalento(atacante, 'atacanteSelvagemPhb') && !p.ranged);
  if (p.weapon && selvagem && atacante.selvagemNoTurno !== turno(enc)) {
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
  // CURANDEIRO do Livro do Jogador (2014): quem está caindo levanta com 1 PV; de pé, a cura do kit, uma vez por descanso
  // para cada um (`descanso.js` limpa a marca).
  if (temTalento(curandeiro, 'curandeiroPhb')) {
    if (alvo.dead) return `${alvo.name} já morreu`;
    if (alvo.hp <= 0) return null;
    if (alvo.hp >= maxHpEfetivo(alvo)) return `${alvo.name} está com a vida cheia`;
    if (alvo.curadoPeloKit) return `${alvo.name} já foi tratado com o kit desde o último descanso`;
    return null;
  }
  if (!temTalento(curandeiro, 'curandeiro')) return undefined;   // regra normal do kit
  if (alvo.dead) return `${alvo.name} já morreu`;
  if (alvo.hp >= maxHpEfetivo(alvo)) return `${alvo.name} está com a vida cheia`;
  if (dadosDeVida(alvo) <= 0) return `${alvo.name} não tem mais dado de vida para gastar`;
  return null;
}

export function medicoDeCampanha(enc, curandeiro, alvo) {
  if (temTalento(curandeiro, 'curandeiroPhb')) {
    if (alvo.hp <= 0) {
      alvo.stable = true;
      const curou = enc.heal(alvo, 1, curandeiro);
      enc.say('cura', `${curandeiro.name} estabiliza ${alvo.name} com o kit, e ${alvo.name} volta a si com ${curou} PV.`, 'Curandeiro');
      enc.onEvent?.({ type: 'stabilized', target: alvo, by: curandeiro });
      return;
    }
    const dado = enc.rng.die(6);
    const total = dado + 4 + (alvo.level ?? 1);
    alvo.curadoPeloKit = true;
    const curou = enc.heal(alvo, total, curandeiro);
    enc.say('cura', `${curandeiro.name} trata ${alvo.name} com o kit: ${curou} PV.`, `Curandeiro · d6[${dado}] + 4 + ${alvo.level ?? 1} (os dados de vida de ${alvo.name})`);
    return;
  }
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

export function gastarUsoGratis(enc, c, uso = true) {
  // Uso livre de característica (`usoLivreDe`): racial e Assinatura gastam o recurso; a Maestria é à vontade.
  if (uso && typeof uso === 'object') {
    if (uso.recurso) c.resources[uso.recurso] = Math.max(0, (c.resources[uso.recurso] ?? 0) - (uso.custo ?? 1));
    enc.say('recurso', `${c.name} conjura sem gastar espaço (${uso.rotulo}).`);
    return;
  }
  c.magiaGratis.usada = true;
  enc.say('recurso', `${c.name} usa a magia de Iniciado sem gastar espaço (uma vez por descanso).`);
}

/** Atributo de conjuração do Iniciado sem classe conjuradora: o melhor mental. */
export function atributoDoIniciado(abilities) {
  return ['int', 'wis', 'cha'].reduce((melhor, a) => (abilities[a] > abilities[melhor] ? a : melhor), 'int');
}


// ------------------------------------------------ talentos do Livro do Jogador (2014) ----
// O resto da regra deles. Cada função é chamada pelo motor num ponto só e devolve o que muda.

/** A média de uma notação de dano ("1d10+3", "2d6"). */
function mediaDaNotacao(notacao) {
  const n = String(notacao ?? '');
  let total = 0;
  for (const [, q, l] of n.matchAll(/(\d+)d(\d+)/g)) total += Number(q) * (Number(l) + 1) / 2;
  for (const [, sinal, v] of n.replace(/\d+d\d+/g, '').matchAll(/([+-])\s*(\d+)/g)) total += (sinal === '-' ? -1 : 1) * Number(v);
  return total;
}

/** A chance de acertar com o d20 contra a CA, com vantagem ou desvantagem (o 1 erra, o 20 acerta). */
function chanceDeAcerto(bonus, ac, modo) {
  const p = Math.min(0.95, Math.max(0.05, (21 - (ac - bonus)) / 20));
  return modo === 'vantagem' ? 1 - (1 - p) ** 2 : modo === 'desvantagem' ? p * p : p;
}

const treinadoNaArma = (c, w) => !c.weaponTraining || c.weaponTraining.includes(w.categoria) || c.weaponTraining.includes(w.id);

/**
 * O −5 NO ATAQUE POR +10 NO DANO (Mestre em Armas Grandes, com arma pesada de perto; Atirador de Elite, com arma à
 * distância), as duas com arma treinada. O livro deixa escolher antes de cada ataque; o jogo escolhe pela conta: aceita
 * quando o dano esperado com o −5 é maior que sem ele, com a vantagem ou desvantagem que o golpe já tem.
 */
export function golpePoderoso(atacante, p, bonus, ac, modo) {
  const w = p.weapon;
  if (!w || !treinadoNaArma(atacante, w)) return false;
  const pesadaDePerto = !p.ranged && (w.props ?? []).includes('pesada') && temTalento(atacante, 'mestreEmArmasGrandes');
  const deLonge = p.ranged && temTalento(atacante, 'atiradorDeElite');
  if (!pesadaDePerto && !deLonge) return false;
  const media = Math.max(1, mediaDaNotacao(p.damage));
  return chanceDeAcerto(bonus - 5, ac, modo) * (media + 10) > chanceDeAcerto(bonus, ac, modo) * media;
}

/** ATIRADOR DE ELITE: sem desvantagem no alcance longo e sem meia cobertura nem três quartos, com arma à distância. */
export const atiradorDeElite = (atacante, p) => Boolean(p.ranged && p.weapon && temTalento(atacante, 'atiradorDeElite'));

/** ESPECIALISTA EM BESTA: inimigo colado não dá desvantagem no ataque à distância. */
export const atiraColado = (atacante) => temTalento(atacante, 'especialistaEmBesta');

/** ATIRADOR ARCANO: magia que pede jogada de ataque, com o dobro do alcance e sem meia cobertura nem três quartos. */
export const atiradorArcano = (actor, spell) => Boolean(temTalento(actor, 'atiradorArcano') && ['attack', 'raios', 'vampirico'].includes(spell?.kind));

/**
 * MESTRE EM ARMADURAS PESADAS: de armadura pesada, o dano de concussão, corte e perfuração de ataque não mágico cai 3.
 * Antes da resistência, que o livro manda aplicar depois de tudo.
 */
export function reducaoDaArmaduraPesada(alvo, amount, type, { magico = false, deArma = false } = {}) {
  if (magico || !deArma || !['concussão', 'cortante', 'perfurante'].includes(type)) return amount;
  if (!temTalento(alvo, 'mestreEmArmadurasPesadas') || ARMORS[alvo.armor ?? 'nenhuma']?.categoria !== 'pesada') return amount;
  return Math.max(0, amount - 3);
}

/** ADEPTO ELEMENTAL: a magia de quem o tem, do elemento dele, passa por cima da resistência (não da imunidade). */
export function adeptoIgnoraResistencia(conjurador, type) {
  return Boolean(conjurador && temTalento(conjurador, 'adeptoElemental') && (conjurador.elementosDoAdepto ?? []).includes(type));
}

/** ADEPTO ELEMENTAL: cada 1 nos dados de dano da magia do elemento dele conta como 2. Muda `dmg` no lugar. */
export function adeptoNosDados(conjurador, spell, dmg) {
  if (!dmg?.rolls?.length || !adeptoIgnoraResistencia(conjurador, spell?.damageType)) return 0;
  const uns = dmg.rolls.filter((v) => v === 1).length;
  if (!uns) return 0;
  dmg.rolls = dmg.rolls.map((v) => (v === 1 ? 2 : v));
  dmg.total += uns;
  return uns;
}

/**
 * DUELISTA DEFENSIVO: atingido por um golpe corpo a corpo, com arma de acuidade treinada na mão, a reação soma a
 * proficiência à CA. Só quando muda o resultado (o golpe que ia acertar e passa a errar). Devolve o bônus, ou 0.
 */
export function duelistaDefensivo(enc, alvo, atk, ac, p) {
  if (p.ranged || atk.critical || !temTalento(alvo, 'duelistaDefensivo') || alvo.reactionUsed || conditionEffects(alvo).incapacitated) return 0;
  const acuidade = [alvo.equippedWeapon, alvo.offhandWeapon].map((id) => WEAPONS[id]).find((w) => w && w.finesse && !w.ranged && treinadoNaArma(alvo, w));
  if (!acuidade) return 0;
  const b = pb(alvo);
  if (atk.total >= ac + b) return 0;
  alvo.reactionUsed = true;
  enc.say('reacao', `${alvo.name} apara com a ${acuidade.name.toLowerCase()} (+${b} de CA): o golpe erra.`, 'Duelista Defensivo');
  return b;
}

/** AGARRADOR: vantagem nos ataques contra quem ele mesmo agarra. */
export const vantagemDoAgarrador = (atacante, alvo) => temTalento(atacante, 'agarrador') && getCondition(alvo, 'agarrado')?.source === atacante.id;

/** ALERTA (2014): quem ele não vê não ganha vantagem contra ele por estar escondido. Acordado. */
export const naoSePegaOculto = (alvo) => temTalento(alvo, 'alertaPhb') && !conditionEffects(alvo).incapacitated;

/** DURÁVEL: o dado de vida gasto cura no mínimo o dobro do modificador de Constituição (e nunca menos de 2). */
export function minimoDoDuravel(c, cura) {
  if (!temTalento(c, 'duravel')) return cura;
  return Math.max(cura, 2 * abilityMod(c.abilities?.con ?? 10), 2);
}

/** CONJURADOR DE GUERRA e MATADOR DE MAGOS no teste de concentração: vantagem de quem conjura, desvantagem pelo ferimento. */
export function concentracaoDosTalentos(c, fonte) {
  return {
    vantagem: temTalento(c, 'conjuradorDeGuerra'),
    desvantagem: Boolean(fonte && temTalento(fonte, 'matadorDeMagos')),
  };
}
