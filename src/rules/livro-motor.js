// O MOTOR DOS BESTIÁRIOS DOS LIVROS: o que os blocos importados do Monster Manual pedem e que nenhum bloco feito à mão
// pedia antes. Cada função recebe o encontro (`enc`, a classe de `combat.js`) e faz a regra de UM traço ou de UMA ação
// do livro; quem chama é o combate (o gancho no lugar certo do turno) ou a IA. Fica num arquivo só para `combat.js`
// não crescer mais, e porque são regras de criatura, não do núcleo do combate.
import { damageRoll } from '../core/dice.js';
import { Battlefield, distanceFt, key, ARESTA, SUPERFICIES } from '../core/grid.js';
import { addCondition, removeCondition, hasCondition, getCondition, conditionEffects, CONDITIONS, mudarExaustao, caEfetiva } from './conditions.js';
import { categoriaDeTamanho } from './tamanho.js';
import { nivelDeLuz, fontesDeLuz, CLARO, soboSol } from './luz.js';
import { EFEITOS_DA_RACA } from './racas-motor.js';
import { EFEITOS_DAS_CHAMAS } from './chamas.js';
import { cargasDe, gastarCargaDoItem } from './itens-que-conjuram.js';

const luzEm = (enc, pos) => nivelDeLuz(enc.field, pos.x, pos.y, fontesDeLuz(enc));

// o tamanho como o livro o escreve ("Medium or smaller") na escala de `tamanho.js`
const TAMANHO_EN = { tiny: 0, small: 1, medium: 2, large: 3, huge: 4, gargantuan: 5 };
export const cabeNoTamanho = (c, max) => categoriaDeTamanho(c) <= (TAMANHO_EN[max] ?? 2);

// ---------------------------------------------------------------------------------------- o turno fora de si ----

/** Anda o deslocamento inteiro para um lado sorteado (o d8 da tagarelice, o d6 da euforia). */
function andarAoAcaso(enc, c) {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const [dx, dy] = dirs[enc.rng.die(8) - 1];
  const reach = enc.reachableFor(c);
  let melhor = null;
  for (const n of reach.values()) {
    if (n.parar === false || (n.x === c.pos.x && n.y === c.pos.y)) continue;
    const nota = (n.x - c.pos.x) * dx + (n.y - c.pos.y) * dy;
    if (nota <= 0) continue;
    if (!melhor || nota > melhor.nota || (nota === melhor.nota && n.cost > melhor.n.cost)) melhor = { n, nota };
  }
  if (melhor) enc.moveAlong(c, Battlefield.pathFrom(reach, melhor.n));
}

/** Perde a ação e a ação bônus deste turno, e não anda mais (quem andou já andou). */
function perderOTurno(c) {
  c.actionUsed = true;
  c.bonusUsed = true;
  c.movementLeftFt = 0;
}

/**
 * O COMPORTAMENTO SORTEADO, no começo do turno de quem o sofre. Desnorteado (a Tagarelice da boca tagarela, o Olhar
 * Confuso do brutamonte umbral): um d8 — 1 a 4, nada; 5 ou 6, anda para um lado qualquer e não age; 7 ou 8, golpeia de
 * perto alguém ao acaso que alcance, ou nada. Eufórico (o Sopro de Euforia do dragão feérico): um d6 — 1 a 4, anda para
 * um lado qualquer e não age; 5 ou 6, fica parado e a única coisa que faz é tentar Sabedoria para se livrar.
 */
export function comportamentoForcado(enc, side) {
  for (const c of enc.allOf(side)) {
    if (c.dead || c.hp <= 0 || !c.pos) continue;
    // as magias que tomam o turno (Compulsão, Labirinto)
    if (turnoDaMagia(enc, c)) continue;
    if (conditionEffects(c).incapacitated) continue;
    const euf = getCondition(c, 'euforico');
    if (euf) {
      const d = enc.rng.die(6);
      if (d <= 4) {
        enc.say('condicao', `${c.name}, eufórico, sai andando à toa (d6 = ${d}).`);
        andarAoAcaso(enc, c);
      } else {
        const cd = euf.data?.dc ?? 11;
        const sv = enc.resistencia(c, 'wis', cd, { contra: { condicao: 'euforico' } });
        const r = enc.explicarResistencia(c, 'wis', cd, sv, { contra: 'a euforia', seSucesso: 'volta a si' });
        if (sv.success) removeCondition(c, 'euforico');
        enc.say('condicao', sv.success ? `${c.name} sacode a cabeça e volta a si (d6 = ${d}).` : `${c.name} fica parado, rindo à toa (d6 = ${d}).`, r.conta, { rolagem: r });
      }
      perderOTurno(c);
      continue;
    }
    // INIMIGOS EM ABUNDÂNCIA (Xanathar): não distingue amigo de inimigo — ataca alguém sorteado que alcance.
    if (hasCondition(c, 'raioConfuso') || hasCondition(c, 'inimigosEmAbundancia')) {
      c.movementLeftFt = 0;
      const perto = enc.combatants.filter((o) => o !== c && !o.dead && o.hp > 0 && o.pos && enc.canAttack(c, o).ok);
      const alvo = perto.length ? perto[enc.rng.die(perto.length) - 1] : null;
      if (alvo) { enc.say('condicao', `${c.name}, confuso, ataca quem está à mão: ${alvo.name}.`); enc.resolveAttack(c, alvo, {}); }
      else enc.say('condicao', `${c.name}, confuso, não acha em quem bater.`);
      perderOTurno(c);
      continue;
    }
    // DOMINADO (Dominar Pessoa, Dominar Monstro): quem domina manda golpear um antigo aliado
    if (hasCondition(c, 'dominado')) {
      const antigos = () => enc.combatants.filter((o) => o !== c && !o.dead && o.hp > 0 && o.pos && o.side === c.side && o.side !== 'neutro');
      let alvo = antigos().find((o) => enc.canAttack(c, o).ok);
      if (!alvo) { moverAte(enc, c, c.movementLeftFt ?? enc.speedOf(c), false, antigos()); alvo = antigos().find((o) => enc.canAttack(c, o).ok); }
      if (alvo && !c.dead) { enc.say('condicao', `${c.name}, dominado, golpeia ${alvo.name}.`); enc.resolveAttack(c, alvo, {}); }
      else enc.say('condicao', `${c.name}, dominado, não alcança ninguém dos seus.`);
      perderOTurno(c);
      continue;
    }
    if (!hasCondition(c, 'desnorteado')) continue;
    const d = enc.rng.die(8);
    if (d <= 4) enc.say('condicao', `${c.name}, desnorteado, não faz nada neste turno (d8 = ${d}).`);
    else if (d <= 6) {
      enc.say('condicao', `${c.name}, desnorteado, sai andando para um lado qualquer (d8 = ${d}).`);
      andarAoAcaso(enc, c);
    } else {
      const perto = enc.combatants.filter((o) => o !== c && !o.dead && o.hp > 0 && o.pos && enc.canAttack(c, o).ok && !enc.weaponAttackProfile(c).ranged);
      const alvo = perto.length ? perto[enc.rng.die(perto.length) - 1] : null;
      if (alvo) {
        enc.say('condicao', `${c.name}, desnorteado, golpeia quem está mais à mão: ${alvo.name} (d8 = ${d}).`);
        enc.resolveAttack(c, alvo, {});
      } else enc.say('condicao', `${c.name}, desnorteado, não acha em quem bater e não faz nada (d8 = ${d}).`);
    }
    perderOTurno(c);
  }
}

// --------------------------------------------------------------------------------------------- engolir ----

export const engolidoPor = (c) => getCondition(c, 'engolido')?.source ?? null;
/** Quem está na MASMORRA SEMIPLANAR de quem o engoliu (o couraçado astral): fora da luta, como o banido. */
export const naMasmorra = (c) => Boolean(getCondition(c, 'engolido')?.data?.masmorra);
export const engolidosDe = (enc, m) => enc.combatants.filter((c) => !c.dead && engolidoPor(c) === m.id);

/** Engole (`dados`: o ácido por turno, o vômito, a fuga do cubo). O agarrão acaba, e o engolido passa a estar DENTRO. */
export function engolir(enc, m, alvo, dados = {}) {
  for (const cond of [...(alvo.conditions ?? [])]) {
    if (cond.source === m.id && cond.data?.escape != null) removeCondition(alvo, cond.id);
  }
  addCondition(alvo, 'engolido', { rounds: Infinity, source: m.id, data: { dano: dados.dano ?? null, tipoDano: dados.tipoDano ?? 'ácido', regurgita: dados.regurgita ?? null, escape: dados.escape ?? null, masmorra: Boolean(dados.masmorra) } });
  enc.dropConcentration?.(alvo);
  alvo.pos = { ...alvo.pos, x: m.pos.x, y: m.pos.y };
  enc.say('condicao', dados.masmorra
    ? `${m.name} engole ${alvo.name}, que some para a masmorra dele, num semiplano: de lá não se fere ${m.name}, e só se sai com magia de viagem entre planos.`
    : `${m.name} engole ${alvo.name}: cego, preso e fora do alcance de todos lá fora.`);
  enc.onEvent({ type: 'engolido', target: alvo, por: m });
}

/** O ácido do estômago no começo de cada turno de quem engoliu. */
export function acidoDosEngolidos(enc, m) {
  if (m.dead) return;
  for (const t of engolidosDe(enc, m)) {
    const cond = getCondition(t, 'engolido');
    const dados = cond.data?.dano;
    if (!dados) continue;
    const d = damageRoll(enc.rng, dados);
    enc.say('dano', `${t.name} se desfaz no estômago de ${m.name}: ${d.total} de ${cond.data.tipoDano}.`, `${dados}[${d.rolls.join('+')}]`);
    enc.applyDamage(t, d.total, cond.data.tipoDano, m, { deDentro: true });
  }
}

/** Solta quem estava dentro: na casa livre mais perto, caído (a morte de quem engoliu, o vômito). */
export function libertarEngolidos(enc, m, { caido = true, motivo = null } = {}) {
  for (const t of engolidosDe(enc, m)) {
    removeCondition(t, 'engolido');
    const casa = enc.casaLivreMaisProxima({ x: m.pos.x, y: m.pos.y, f: t.pos.f ?? 1 }) ?? m.pos;
    t.pos = { ...t.pos, x: casa.x, y: casa.y };
    if (caido && t.hp > 0 && !enc.imuneACondicao(t, 'caido')) addCondition(t, 'caido', { source: m.id });
    enc.say('condicao', `${t.name} sai de dentro de ${m.name}${motivo ? ` (${motivo})` : ''}${caido ? ', e cai' : ''}.`);
    enc.onEvent({ type: 'moved', actor: t, from: { ...m.pos }, to: { ...t.pos }, path: [{ ...t.pos }] });
  }
}

/** Quem engoliu leva os engolidos junto quando anda (o cubo, o verme). */
export function levarEngolidos(enc, m) {
  for (const t of engolidosDe(enc, m)) t.pos = { ...t.pos, x: m.pos.x, y: m.pos.y };
}

/**
 * O VÔMITO: quem sofre `regurgita.dano` ou mais num mesmo turno de quem está dentro faz Constituição; falhou, vomita
 * todos, caídos a até 3 m. A conta zera no começo de cada lado.
 */
export function conferirVomito(enc) {
  for (const m of enc.combatants) {
    if (m.dead || !(m.danoDeDentro > 0)) continue;
    const reg = engolidosDe(enc, m).map((t) => getCondition(t, 'engolido').data?.regurgita).find(Boolean);
    const dano = m.danoDeDentro;
    m.danoDeDentro = 0;
    if (!reg || dano < reg.dano) continue;
    const sv = enc.resistencia(m, 'con', reg.dc);
    const r = enc.explicarResistencia(m, 'con', reg.dc, sv, { contra: 'o que tem dentro', seSucesso: 'segura a comida' });
    if (sv.success) { enc.say('condicao', `${m.name} se contorce e segura o que engoliu.`, r.conta, { rolagem: r }); continue; }
    enc.say('condicao', `${m.name} vomita o que engoliu.`, r.conta, { rolagem: r });
    libertarEngolidos(enc, m, { caido: true, motivo: 'vomitado' });
  }
}

/**
 * ENGOLFAR (o cubo gelatinoso): quem está colado nele faz Destreza; passou, é empurrado 1,5 m; falhou, sofre o ácido
 * e fica dentro do cubo (6d6 a cada turno dele, e sai com Força CD 12, a ação). Cabem uma Grande ou quatro Médias.
 */
export function engolfar(enc, m, a) {
  const dentro = engolidosDe(enc, m);
  const grande = dentro.some((t) => categoriaDeTamanho(t) >= 3);
  let vagas = grande ? 0 : 4 - dentro.length;
  const pegos = enc.enemiesOf(m).filter((t) => !t.dead && t.hp > 0 && t.pos && enc.field.vizinhos(m.pos, t.pos) && cabeNoTamanho(t, 'large'))
    .sort((x, y) => categoriaDeTamanho(x) - categoriaDeTamanho(y));
  if (!pegos.length || vagas <= 0) return false;
  enc.say('acao', `${m.name} avança por cima de quem está perto (${a.nome}).`);
  for (const t of pegos) {
    if (vagas <= 0) break;
    const sv = enc.resistencia(t, a.save, a.dc, { contra: { tipoDano: a.tipoDano } });
    const r = enc.explicarResistencia(t, a.save, a.dc, sv, { contra: a.nome, seSucesso: 'pula para fora' });
    if (sv.success) {
      enc.empurrar(t, m.pos, 5);
      enc.say('condicao', `${t.name} pula para fora do caminho de ${m.name}.`, r.conta, { rolagem: r });
      continue;
    }
    const d = damageRoll(enc.rng, a.dano);
    enc.applyDamage(t, d.total, a.tipoDano, m);
    enc.say('dano', `${t.name} é engolfado e sofre ${d.total} de ${a.tipoDano}.`, `${r.conta} · ${a.dano}[${d.rolls.join('+')}]`, { rolagem: r });
    if (t.dead || t.hp <= 0) continue;
    engolir(enc, m, t, { dano: a.danoPorTurno, tipoDano: a.tipoDano, escape: a.dc });
    vagas -= categoriaDeTamanho(t) >= 3 ? 4 : 1;
  }
  return true;
}

/** ENGOLIR (o sapo, a rã, o behir): a mordida no agarrado de tamanho que cabe; acertou, ele vai para dentro. */
export function engolirAcao(enc, m, a, alvo) {
  // o golpe próprio da ação (o regissauro, o colosso de carne): entra na lista só para este golpe
  if (a.golpe && !(m.attacks ?? []).includes(a.golpe)) {
    m.attacks = [...(m.attacks ?? []), a.golpe];
    try { return engolirAcao(enc, m, a, alvo); } finally { m.attacks = m.attacks.filter((x) => x !== a.golpe); }
  }
  const mordida = a.golpe ?? m.attacks?.find((x) => /mordida/i.test(x.name)) ?? m.attacks?.find((x) => !x.ranged);
  if (!mordida || !alvo || !presoPor(alvo, m) || !cabeNoTamanho(alvo, a.tamanhoMax) || engolidosDe(enc, m).length >= (a.max ?? 1)) return false;
  enc.say('acao', `${m.name} tenta engolir ${alvo.name}.`);
  // POR TESTE e não por mordida (a fusão de carne, o Obelisco: Destreza, ou para dentro)
  if (a.save) {
    if (distanceFt(m.pos, alvo.pos) > 5) return false;
    const sv = enc.resistencia(alvo, a.save, a.dc);
    const r = enc.explicarResistencia(alvo, a.save, a.dc, sv, { contra: 'ser engolido', seSucesso: 'escapa' });
    if (sv.success) { enc.say('condicao', `${alvo.name} se solta da carne de ${m.name}.`, r.conta, { rolagem: r }); return true; }
    engolir(enc, m, alvo, { dano: a.dano, tipoDano: a.tipoDano, regurgita: a.regurgita });
    return true;
  }
  const r = enc.resolveAttack(m, alvo, { weaponId: mordida.name });
  if (r?.hit && !alvo.dead && alvo.hp > 0) engolir(enc, m, alvo, { dano: a.dano, tipoDano: a.tipoDano, regurgita: a.regurgita });
  return true;
}

/** O alvo está preso (agarrado ou contido) por `m`. */
export const presoPor = (alvo, m) => (alvo.conditions ?? []).some((c) => c.source === m.id && (c.id === 'agarrado' || c.id === 'contido'));

/** A mordida que engole (o verme púrpura, o kraken): o perfil traz `engole`, e o efeito vem depois do acerto. */
export function mordidaQueEngole(enc, m, alvo, e) {
  // `exige: 'zeroOuIncapacitado'` (o couraçado astral): só engole quem a mordida derrubou a 0 PV ou quem está incapacitado
  if (e.exige === 'zeroOuIncapacitado') {
    if (alvo.dead || !(alvo.hp <= 0 || conditionEffects(alvo).incapacitated) || !cabeNoTamanho(alvo, e.tamanhoMax) || hasCondition(alvo, 'engolido')) return;
  } else if (alvo.dead || alvo.hp <= 0 || !cabeNoTamanho(alvo, e.tamanhoMax) || hasCondition(alvo, 'engolido')) return;
  if (e.masmorra === undefined && m.traits?.includes('masmorraSemiplanar')) e = { ...e, masmorra: true };
  if (e.soAgarrado && !presoPor(alvo, m)) return;
  if (e.save) {
    const sv = enc.resistencia(alvo, e.save, e.dc);
    const r = enc.explicarResistencia(alvo, e.save, e.dc, sv, { contra: 'ser engolido', seSucesso: 'escapa da boca' });
    if (sv.success) { enc.say('condicao', `${alvo.name} escapa da boca de ${m.name}.`, r.conta, { rolagem: r }); return; }
  }
  engolir(enc, m, alvo, e);
}

// ------------------------------------------------------------------------------------- traços de dano ----

/**
 * O que o dano faz por causa de um traço de quem o sofre, ANTES de cair: a Transferência de Dano (o espreitador, o
 * tapete): agarrando alguém, ele sofre só a metade, e o agarrado a outra metade. Devolve o dano que fica.
 */
export function transferirDano(enc, alvo, amount, type, source, opts) {
  if (!alvo.traits?.includes('transfereDano') || opts?.transferido) return amount;
  const preso = enc.combatants.find((c) => !c.dead && c.hp > 0 && presoPor(c, alvo));
  if (!preso) return amount;
  const metade = Math.floor(amount / 2);
  const resto = amount - metade;
  if (resto > 0) {
    enc.say('dano', `Metade do golpe atravessa ${alvo.name} e cai em ${preso.name}: ${resto}.`);
    enc.applyDamage(preso, resto, type, source, { ...opts, transferido: true });
  }
  return metade;
}

/** Depois do dano: Congelar (o elemental da água, frio tira 6 m) e a conta do vômito (dano de quem está dentro). */
export function depoisDoDano(enc, alvo, amount, type, source) {
  if (amount <= 0 || alvo.dead) return;
  if (type === 'frio' && alvo.traits?.includes('congela') && !hasCondition(alvo, 'congelado')) {
    addCondition(alvo, 'congelado', { rounds: enc.side === alvo.side ? 2 : 1, quando: 'fim', lado: alvo.side, source: alvo.id });
    enc.say('condicao', `${alvo.name} congela em parte: 6 m a menos de deslocamento.`);
  }
  if (source && engolidoPor(source) === alvo.id) alvo.danoDeDentro = (alvo.danoDeDentro ?? 0) + amount;
  // a TERCEIRA FILA: o dano que corta a Degeneração Rançosa, e o respingo de quem é ferido (o troll venenoso)
  marcarBloqueioDoFim(alvo, type);
  respingoAoSerFerido(enc, alvo, amount, type);
  fogoRecarrega(enc, alvo, type);
  estadoPeloDano(enc, alvo, amount, type, source);
  danoQueVolta(enc, alvo);
}

/**
 * A CORROSÃO DA ARMA (o pudim negro, a gosma cinzenta, o monstro da ferrugem): a arma comum que o acerta de perto perde
 * 1 no dano, de vez e somando; a −5 se desfaz. O monstro da ferrugem e a gosma só comem metal; o pudim come madeira também.
 */
const SEM_METAL = new Set(['punhos', 'clava', 'clavaGrande', 'bordao', 'chicote', 'rede', 'funda', 'zarabatana']);
export function corroerArma(enc, attacker, target, p) {
  if (!target.traits?.includes('corroiArma') || !p.weapon || p.ranged || attacker.kind !== 'pc') return;
  const id = attacker.equippedWeapon;
  if (!id || p.weapon.raridade || p.weapon.bonusAtaque || id === 'punhos') return;
  const soMetal = !target.features?.includes('corroeMadeira');
  if (soMetal && SEM_METAL.has(id)) return;
  attacker.armaCorroida ??= {};
  const n = (attacker.armaCorroida[id] ?? 0) + 1;
  attacker.armaCorroida[id] = n;
  if (n >= 5) {
    enc.say('condicao', `${p.weapon.name} de ${attacker.name} se desfaz em ${target.name}.`);
    delete attacker.armaCorroida[id];
    attacker.armaDesfeita = [...(attacker.armaDesfeita ?? []), id];
    attacker.equippedWeapon = 'punhos';
    enc.onEvent({ type: 'armaDesfeita', actor: attacker, arma: id });
  } else enc.say('condicao', `${p.weapon.name} de ${attacker.name} corrói: −${n} no dano, de vez.`);
}

/** ESPETAR (o rei e a rainha homem-lagarto): uma vez por turno, o tridente que acerta soma 3d6 e o dano vira PV temporários. */
export function espetar(enc, attacker, target, p) {
  const e = attacker.espetar;
  if (!e || p.ranged || !/tridente/i.test(p.name) || attacker.espetouNoTurno === `${enc.round}:${enc.side}` || target.dead) return;
  attacker.espetouNoTurno = `${enc.round}:${enc.side}`;
  const d = damageRoll(enc.rng, e.dano);
  enc.applyDamage(target, d.total, p.type, attacker);
  attacker.tempHp = Math.max(attacker.tempHp ?? 0, d.total);
  enc.say('dano', `${attacker.name} espeta ${target.name} no tridente: mais ${d.total}, e ganha ${d.total} PV temporários.`, `${e.dano}[${d.rolls.join('+')}]`);
}

// ------------------------------------------------------------------------------- traços no turno do dono ----

/** COURO FARPADO (o diabo farpado): no começo do turno dele, quem o agarra sofre 1d10 perfurante. */
export function couroFarpado(enc, m) {
  if (!m.espinhos || m.dead) return;
  const agarrando = enc.combatants.filter((c) => !c.dead && c.hp > 0 && presoPor(m, c));
  for (const c of agarrando) {
    const d = damageRoll(enc.rng, m.espinhos.dano);
    enc.say('dano', `As farpas de ${m.name} furam ${c.name}: ${d.total} de ${m.espinhos.tipo}.`, `${m.espinhos.dano}[${d.rolls.join('+')}]`);
    enc.applyDamage(c, d.total, m.espinhos.tipo, m);
  }
}

/**
 * CHÃO ABERRANTE (a boca tagarela): a 3 m dela o chão vira massa — terreno difícil (`casasDificeisDosDonos`), e quem
 * começa o turno nele faz Força CD 10 ou fica com deslocamento 0 até o começo do próximo turno.
 */
export function chaoAberrante(enc, side) {
  const donos = enc.combatants.filter((m) => m.traits?.includes('chaoAberrante') && !m.dead && m.hp > 0 && m.side !== side);
  for (const t of enc.allOf(side)) {
    if (t.dead || t.hp <= 0 || !t.pos) continue;
    for (const m of donos) {
      if (distanceFt(m.pos, t.pos) > 10 || enc.voaAgora?.(t)) continue;
      const sv = enc.resistencia(t, 'str', 10);
      const r = enc.explicarResistencia(t, 'str', 10, sv, { contra: `o chão de ${m.name}`, seSucesso: 'arranca os pés da massa' });
      if (sv.success) { enc.say('condicao', `${t.name} arranca os pés do chão mole.`, r.conta, { rolagem: r }); continue; }
      t.movementLeftFt = 0;
      t.presoNoChao = true;
      enc.say('condicao', `O chão de ${m.name} engole os pés de ${t.name}: não anda neste turno.`, r.conta, { rolagem: r });
    }
  }
}

/** As casas do chão aberrante: terreno difícil enquanto o dono estiver vivo. */
export function casasDoChaoAberrante(enc) {
  const casas = new Set();
  for (const m of enc.combatants) {
    if (!mexeNoChao(m) || m.dead || m.hp <= 0 || !m.pos) continue;
    // O CHÃO DIFÍCIL DOS LIVROS (a lama do brutamontes, a contaminação do sibriex, a correnteza do wastrilith só na água)
    const d = doLivro(m)?.chaoDificil;
    const raio = d?.raioFt ?? 10;
    const r = Math.ceil(raio / 5);
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const x = m.pos.x + dx;
      const y = m.pos.y + dy;
      if (!enc.field.inside(x, y) || distanceFt(m.pos, { x, y }) > raio) continue;
      if (d?.soNaAgua && !enc.field.aguas?.has(key(x, y))) continue;
      casas.add(key(x, y));
    }
  }
  return casas;
}

/** Quem muda o chão em volta de si e pede que o terreno seja refeito quando anda ou cai. */
export const mexeNoChao = (m) => Boolean(m?.traits?.includes('chaoAberrante') || m?.motorDoLivro?.chaoDificil);

/**
 * MÁSCARA PERTURBADORA (o diabo acorrentado, reação): quem ele vê começar o turno a 9 m dele, e o vê, faz Sabedoria
 * CD 14 ou fica amedrontado até o fim do próprio turno.
 */
export function mascaraPerturbadora(enc, side) {
  for (const m of enc.combatants) {
    if (!m.traits?.includes('mascaraPerturbadora') || m.dead || m.hp <= 0 || m.side === side || m.reactionUsed) continue;
    if (conditionEffects(m).incapacitated) continue;
    const alvo = enc.allOf(side).find((t) => !t.dead && t.hp > 0 && t.pos && distanceFt(m.pos, t.pos) <= 30
      && enc.field.hasLineOfSight(m.pos, t.pos) && !hasCondition(t, 'amedrontado') && !enc.imuneACondicao(t, 'amedrontado') && !hasCondition(t, 'cego'));
    if (!alvo) continue;
    m.reactionUsed = true;
    const sv = enc.resistencia(alvo, 'wis', 14, { contra: { condicao: 'amedrontado' } });
    const r = enc.explicarResistencia(alvo, 'wis', 14, sv, { contra: `a máscara de ${m.name}`, seSucesso: 'não acredita no que vê' });
    if (sv.success) { enc.say('condicao', `${m.name} mostra a ${alvo.name} um rosto que ele perdeu; ${alvo.name} não se deixa levar.`, r.conta, { rolagem: r }); continue; }
    enc.aplicarCondicao(alvo, 'amedrontado', { rounds: 1, quando: 'fim', lado: side, source: m.id });
    enc.say('condicao', `${m.name} mostra a ${alvo.name} um rosto que ele perdeu: amedrontado até o fim do turno.`, r.conta, { rolagem: r });
  }
}

// ------------------------------------------------------------------------------------ ações bônus de npc ----

/** CONSUMIR VIDA (o fogo-fátuo, ação bônus): o caído a 0 PV a 1,5 m faz Constituição CD 10 ou morre, e ele cura 3d6. */
export function consumirVida(enc, m) {
  if (!m.traits?.includes('consumirVida') || m.bonusUsed || m.dead) return false;
  // (quem caiu não está em `enemiesOf`, que só traz quem está de pé)
  const alvo = enc.combatants.find((t) => t.side !== m.side && t.side !== 'neutro' && !t.dead && t.hp <= 0 && t.pos && distanceFt(m.pos, t.pos) <= 5);
  if (!alvo) return false;
  m.bonusUsed = true;
  const sv = enc.resistencia(alvo, 'con', 10, { contra: { magico: true } });
  const r = enc.explicarResistencia(alvo, 'con', 10, sv, { contra: `a fome de ${m.name}`, seSucesso: 'a vida segura' });
  if (sv.success) { enc.say('condicao', `${m.name} sorve a vida de ${alvo.name}, que resiste.`, r.conta, { rolagem: r }); return true; }
  enc.say('morte', `${m.name} sorve o que restava da vida de ${alvo.name}.`, r.conta, { rolagem: r });
  enc.morrer(alvo, 'a vida consumida');
  const d = damageRoll(enc.rng, '3d6');
  const curou = enc.heal(m, d.total, m);
  enc.say('cura', `${m.name} brilha mais forte: +${curou} PV.`, `3d6[${d.rolls.join('+')}]`);
  return true;
}

/**
 * SALTO ETÉREO (a aranha de fase, ação bônus): golpeia e some para o Plano Etéreo; no turno seguinte volta (a volta
 * também é a ação bônus dele) e golpeia de novo. Só some quem já golpeou no turno.
 */
export function saltoEtereo(enc, m) {
  if (!m.traits?.includes('saltoEtereo') || m.bonusUsed || m.dead || !m.atacouNoTurno || hasCondition(m, 'etereo')) return false;
  m.bonusUsed = true;
  addCondition(m, 'etereo', { source: m.id, data: { origem: { x: m.pos.x, y: m.pos.y }, salto: true } });
  enc.say('magia', `${m.name} desliza para o Plano Etéreo.`);
  enc.onEvent({ type: 'sumiu', target: m, de: { ...m.pos } });
  return true;
}

/** INCITAR RAMPAGE (o senhor da matilha gnoll, recarga 5–6): um aliado com Rampage a 9 m usa a reação para golpear de perto. */
export function incitarRampage(enc, m) {
  if (!m.traits?.includes('incitarRampage') || m.actionUsed || m.recarregando?.['Incitar Rampage']) return false;
  for (const a of enc.alliesOf(m)) {
    if (a === m || a.dead || a.hp <= 0 || a.reactionUsed || !a.traits?.includes('rampage') || distanceFt(a.pos, m.pos) > 30) continue;
    if (conditionEffects(a).incapacitated) continue;
    const golpe = a.attacks?.find((x) => !x.ranged);
    const alvo = enc.enemiesOf(a).find((e) => !e.dead && e.hp > 0 && golpe && enc.canAttack(a, e, golpe.name).ok);
    if (!alvo) continue;
    m.actionUsed = true;
    (m.recarregando ??= {})['Incitar Rampage'] = true;
    a.reactionUsed = true;
    enc.say('reacao', `${m.name} uiva, e ${a.name} salta sobre ${alvo.name} (Incitar Rampage).`);
    enc.resolveAttack(a, alvo, { weaponId: golpe.name });
    return true;
  }
  return false;
}

/** FANTASMAS (o espreitador): três cópias ilusórias, fora da luz plena. Uma vez por descanso. */
export function fantasmas(enc, m) {
  if (!m.traits?.includes('fantasmas') || m.actionUsed || m.fantasmasUsados || hasCondition(m, 'fantasmas')) return false;
  if (luzEm(enc, m.pos) >= CLARO) return false;
  m.actionUsed = true;
  m.fantasmasUsados = true;
  addCondition(m, 'fantasmas', { rounds: Infinity, source: m.id, data: { n: 3 } });
  enc.say('magia', `${m.name} se desdobra em três cópias de sombra que rodam em volta dele.`);
  return true;
}

/** Os Fantasmas desviam o golpe: o atacante sorteia entre o espreitador e as cópias. Na luz plena, elas somem. */
export function fantasmaDesvia(enc, atacante, alvo, bonus, mods, attackRoll, abilityMod) {
  const f = getCondition(alvo, 'fantasmas');
  if (!f) return false;
  if (luzEm(enc, alvo.pos) >= CLARO) {
    removeCondition(alvo, 'fantasmas');
    enc.say('magia', `A luz desfaz as cópias de ${alvo.name}.`);
    return false;
  }
  const n = f.data?.n ?? 0;
  if (!n || hasCondition(atacante, 'cego') || enc.rng.die(n + 1) === 1) return false;
  const ca = 10 + abilityMod(alvo.abilities?.dex ?? 10);
  const r = attackRoll(enc.rng, bonus, ca, mods);
  if (r.hit) {
    f.data.n = n - 1;
    if (!f.data.n) removeCondition(alvo, 'fantasmas');
    enc.say('magia', `${atacante.name} acerta uma cópia de ${alvo.name}: ela some (${n - 1} restam).`);
  } else enc.say('magia', `${atacante.name} ataca uma cópia de ${alvo.name} e erra.`);
  return true;
}

// -------------------------------------------------------------------------------- traços de defesa ----

/**
 * ESCUDO PEGAJOSO (o kuo-toa, reação): o golpe de arma corpo a corpo que erra gruda no escudo. Força CD 11; falhou, a
 * arma fica presa e quem a segura fica agarrado (sai com a ação, Força CD 11). Arma presa não golpeia.
 */
export function escudoPegajoso(enc, attacker, target, p) {
  if (!target.traits?.includes('escudoPegajoso') || target.reactionUsed || target.dead || !p.weapon || p.ranged) return;
  if (conditionEffects(target).incapacitated) return;
  target.reactionUsed = true;
  const sv = enc.resistencia(attacker, 'str', 11);
  const r = enc.explicarResistencia(attacker, 'str', 11, sv, { contra: `o escudo de ${target.name}`, seSucesso: 'arranca a arma' });
  if (sv.success) { enc.say('reacao', `${attacker.name} puxa a arma do escudo grudento de ${target.name}.`, r.conta, { rolagem: r }); return; }
  enc.aplicarCondicao(attacker, 'agarrado', { rounds: Infinity, source: target.id, data: { escape: 11, soForca: true, armaPresa: attacker.equippedWeapon } });
  enc.say('reacao', `A arma de ${attacker.name} gruda no escudo de ${target.name}: presa, e ele junto.`, r.conta, { rolagem: r });
}

/** A arma presa no escudo do kuo-toa não golpeia. */
export const armaPresa = (actor) => (actor.conditions ?? []).find((c) => c.id === 'agarrado' && c.data?.armaPresa)?.data.armaPresa ?? null;

/**
 * DEFICIÊNCIA AO CAIR (o flumph): derrubado, um dado; ímpar, cai de costas e fica incapacitado, e no fim de cada turno
 * faz Destreza CD 10 para se endireitar.
 */
export function caiuDeCostas(enc, alvo) {
  if (!alvo.traits?.includes('deficienciaCaido') || alvo.dead || hasCondition(alvo, 'deCostas')) return;
  const d = enc.rng.die(6);
  if (d % 2 === 0) return;
  addCondition(alvo, 'deCostas', { rounds: Infinity, source: alvo.id, data: { save: 'dex', dc: 10, repete: true } });
  enc.say('condicao', `${alvo.name} cai de costas (d6 = ${d}) e não consegue se virar.`);
}

/**
 * IMUNIDADE À MAGIA LIMITADA (o rakshasa): magia de 6º círculo ou menos não o afeta; contra as outras, vantagem.
 * CARAPAÇA REFLETORA (a tarrasca): Mísseis Mágicos, magia em linha e magia de ataque à distância não a afetam; num 6 no d6,
 * voltam para quem a lançou (`refleteAMagia`).
 */
export function imuneAMagiaDoLivro(enc, alvo, magia) {
  if (!alvo || !magia) return false;
  if (alvo.traits?.includes('imunidadeMagicaLimitada') && (enc.circuloEmCurso ?? magia.level ?? 0) <= 6) return true;
  if (alvo.traits?.includes('carapacaRefletora') && pegaNaCarapaca(magia)) return true;
  // GLOBO DE INVULNERABILIDADE: magia de 5º círculo ou menos, lançada de FORA da barreira de 3 m, não pega quem está dentro
  const circulo = enc.circuloEmCurso ?? magia.level ?? 0;
  if (circulo >= 1 && circulo <= 5 && alvo.pos) {
    const quem = enc.conjuradorEmCurso;
    for (const g of enc.combatants) {
      if (g.dead || !hasCondition(g, 'globo') || !g.pos || distanceFt(g.pos, alvo.pos) > 10) continue;
      if (!quem?.pos || distanceFt(g.pos, quem.pos) > 10) return true;
    }
  }
  return false;
}
export const pegaNaCarapaca = (magia) => magia.id === 'misselMagico' || magia.shape === 'linha' || magia.shape === 'line' || magia.attack === 'ranged';

/** A tarrasca devolve a magia num 6: o mesmo dano em quem a lançou. Devolve true quando refletiu. */
export function refleteAMagia(enc, caster, alvo, magia) {
  if (!alvo.traits?.includes('carapacaRefletora') || !pegaNaCarapaca(magia) || caster === alvo) return false;
  const d = enc.rng.die(6);
  if (d !== 6) { enc.say('magia', `${magia.name} bate na carapaça de ${alvo.name} e se desfaz (d6 = ${d}).`); return false; }
  enc.say('magia', `${magia.name} bate na carapaça de ${alvo.name} e volta contra ${caster.name} (d6 = 6).`);
  return true;
}

/** COMANDAR MORTOS-VIVOS (o cavaleiro da morte): ele e os mortos-vivos aliados a 18 m têm vantagem contra Expulsar. */
export const comandadoContraExpulsar = (enc, m) => m.traits?.includes('comandaMortos')
  || enc.combatants.some((k) => k !== m && !k.dead && k.side === m.side && k.traits?.includes('comandaMortos')
    && !conditionEffects(k).incapacitated && m.tipo === 'morto-vivo' && distanceFt(k.pos, m.pos) <= 60);

/** O CONE DE ENERGIA NEGATIVA do tirano da morte: quem está nele não recupera PV, e o humanoide que morre ali vira zumbi dele. */
export function noConeNegativo(enc, c) {
  return enc.combatants.some((m) => m.coneNegativo?.casas?.has(key(c.pos?.x, c.pos?.y)) && !m.dead && !conditionEffects(m).incapacitated);
}
export function zumbiDoCone(enc, morto) {
  if (morto.tipo && morto.tipo !== 'humanoide' && morto.kind !== 'pc') return;
  const tirano = enc.combatants.find((m) => m.coneNegativo?.casas?.has(key(morto.pos?.x, morto.pos?.y)) && !m.dead);
  if (!tirano || morto.virouZumbi) return;
  morto.virouZumbi = true;
  const z = enc.invocar(tirano, 'zumbi', morto.pos, { spellId: 'coneNegativo', sufixo: ` (${morto.name})` });
  if (z) { z.invocado.auto = true; enc.say('morte', `${morto.name} se levanta no cone de ${tirano.name}: um zumbi às ordens dele.`); }
}

/**
 * O CONE DO OLHO CENTRAL (o observador: antimagia; o tirano da morte: energia negativa). No começo do turno dele, ele
 * escolhe para onde o cone olha e se ele fica aberto: aqui, para o lado com mais inimigos que conjuram (antimagia) ou com
 * mais inimigos (energia negativa). Fechado quando isso só pegaria aliados.
 */
export function apontarCone(enc, m) {
  const campo = m.traits?.includes('coneAntimagia') ? 'coneAntimagia' : m.traits?.includes('coneDeEnergiaNegativa') ? 'coneNegativo' : null;
  if (!campo || m.dead || conditionEffects(m).incapacitated) { if (campo) m[campo] = null; return; }
  const peso = (c) => (campo === 'coneAntimagia' ? (c.spellcasting ? 2 : 1) : 1);
  let melhor = null;
  for (const e of enc.enemiesOf(m)) {
    if (e.dead || !e.pos) continue;
    const casas = enc.areaDaMagia(m, { shape: 'cone', areaFt: 150, level: 0 }, e.pos) ?? [];
    const dentro = new Set(casas.map((t) => key(t.x, t.y)));
    const vivos = enc.enemiesOf(m).filter((x) => !x.dead && x.pos);
    let nota = vivos.filter((x) => dentro.has(key(x.pos.x, x.pos.y))).reduce((s, x) => s + peso(x), 0);
    // o cone antimágico corta os raios DELE também: cobrir o grupo inteiro deixa o observador só com a mordida
    if (campo === 'coneAntimagia' && m.raiosOculares && vivos.every((x) => dentro.has(key(x.pos.x, x.pos.y)))) nota -= 100;
    if (!melhor || nota > melhor.nota) melhor = { nota, dentro, para: { ...e.pos } };
  }
  m[campo] = melhor && melhor.nota > 0 ? { casas: melhor.dentro, para: melhor.para } : null;
}

/** Está no cone antimágico de alguém (a magia não sai, e o efeito mágico não pega). */
export const noConeAntimagia = (enc, pos) => !!pos && (enc.combatants.some((m) => m.coneAntimagia?.casas?.has(key(pos.x, pos.y)) && !m.dead) || noCampoAntimagia(enc, pos));

/** Monta o que `TRAIT_INFO` precisa saber dos traços desta leva — nada aqui é texto do livro. */
export const CONDICOES_DO_LIVRO = ['desnorteado', 'euforico', 'deformado', 'amaldicoadoLamia', 'surdo', 'engolido', 'deCostas', 'congelado', 'fantasmas'];
export const conferirCondicoes = () => CONDICOES_DO_LIVRO.filter((id) => !CONDITIONS[id]);

// ----------------------------------------------------------------------------- as ações especiais novas ----

/** Dobra os dados de um dano ("2d4+2" -> "4d4+2"): o Aumentar do duergar. */
export const dobrarDados = (n) => (typeof n === 'string' ? n.replace(/(\d+)d(\d+)/, (_, q, l) => `${Number(q) * 2}d${l}`) : n);

/** Leva o alvo a 0 PV sem passar do zero (o Olhar Mortal da bruxa do mar, o Uivo do semilich). */
function cairAZero(enc, t, m) {
  t.tempHp = 0;
  if (t.hp > 0) enc.applyDamage(t, t.hp, null, m, { magico: true });
}

/**
 * ARREMESSO: o alvo voa `pes` para longe, num rumo (`de` é o ponto de onde ele é jogado; sem ele, um rumo sorteado),
 * e cai. Se bate em algo antes do fim, sofre 1d6 de concussão a cada 3 m que voou; se bate numa criatura, ela faz
 * Destreza (`dcDaBatida`) ou sofre o mesmo e cai. Devolve os pés voados.
 */
export function arremessar(enc, t, pes, { de = null, dcDaBatida = null, m = null } = {}) {
  let origem = de;
  if (!origem) {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    const [dx, dy] = dirs[enc.rng.die(8) - 1];
    origem = { x: t.pos.x - dx, y: t.pos.y - dy };
  }
  const antes = { ...t.pos };
  enc.empurrar(t, origem, pes);
  const voou = distanceFt(antes, t.pos);
  if (!t.dead && !enc.imuneACondicao(t, 'caido')) addCondition(t, 'caido', { source: m?.id ?? t.id });
  if (voou < pes && voou >= 10) {
    const n = Math.floor(voou / 10);
    const d = damageRoll(enc.rng, `${n}d6`);
    enc.say('dano', `${t.name} bate no que estava no caminho: ${d.total} de concussão.`, `${n}d6[${d.rolls.join('+')}]`);
    enc.applyDamage(t, d.total, 'concussão', m);
    // a batida numa criatura (a que barrou o voo)
    const dx = Math.sign(t.pos.x - origem.x);
    const dy = Math.sign(t.pos.y - origem.y);
    const outro = enc.at(t.pos.x + dx, t.pos.y + dy);
    if (outro && dcDaBatida && outro !== m) {
      const sv = enc.resistencia(outro, 'dex', dcDaBatida);
      const r = enc.explicarResistencia(outro, 'dex', dcDaBatida, sv, { contra: `${t.name} voando`, seSucesso: 'desvia' });
      if (!sv.success) {
        enc.applyDamage(outro, d.total, 'concussão', m);
        if (!outro.dead && !enc.imuneACondicao(outro, 'caido')) addCondition(outro, 'caido', { source: m?.id ?? t.id });
        enc.say('dano', `${t.name} acerta ${outro.name} em cheio: ${d.total} de concussão, e os dois no chão.`, r.conta, { rolagem: r });
      } else enc.say('condicao', `${outro.name} desvia de ${t.name}.`, r.conta, { rolagem: r });
    }
  }
  return voou;
}

/** Quem a ação especial pode mirar, além do que ela já pede (o agarrado, o enfeitiçado, o amedrontado). */
export function alvoServe(enc, m, a, t) {
  if (!t || t.dead || t.hp <= 0) return false;
  if (a.soAgarrado && !presoPor(t, m)) return false;
  if (a.soComCondicao && !hasCondition(t, a.soComCondicao)) return false;
  if (a.soIncapacitado && !conditionEffects(t).incapacitated) return false;
  if (a.naoTipos?.includes(t.tipo)) return false;
  // a ação que só põe uma condição não serve em quem já a tem (o titivilus enfeitiçava de novo quem já estava enfeitiçado)
  if (a.condition && !a.damage && !a.reduzMaximoDados && !a.prende && hasCondition(t, a.condition)) return false;
  if (a.soTipos && !a.soTipos.includes(t.tipo ?? 'humanoide')) return false;
  if (a.prende && a.tamanhoMax && !cabeNoTamanho(t, a.tamanhoMax)) return false;
  // a corda do korred não prende de novo quem ela já segura
  if (a.semPrenderDeNovo && presoPor(t, m)) return false;
  if (a.tipo === 'alvo' && a.alcanceFt && distanceFt(m.pos, t.pos) > a.alcanceFt) return false;
  // O APERTO (o armadilheiro, o rastejador rastreador): um preso por vez, de até o tamanho do livro, e não quem já está nele
  if (a.aperto && (!cabeNoTamanho(t, a.aperto.tamanhoMax ?? 'large') || presoPor(t, m)
    || enc.combatants.some((x) => x !== t && !x.dead && presoPor(x, m)))) return false;
  return true;
}

/** Os outros alvos de uma ação que pega vários (a Tempestade de Raios do kraken, o Drenar Vida do semilich). */
export function maisAlvos(enc, m, a, primeiro) {
  const n = a.alvos ?? 1;
  if (n <= 1) return [primeiro];
  const outros = enc.enemiesOf(m).filter((t) => t !== primeiro && alvoServe(enc, m, a, t) && enc.field.hasLineOfSight(m.pos, t.pos))
    .sort((x, y) => x.hp - y.hp);
  return [primeiro, ...outros].slice(0, n);
}

/**
 * O que a ação especial faz em cada alvo DEPOIS do teste, além do dano e da condição de sempre: a queda a 0 PV, o
 * arremesso, o PV máximo que cai. Devolve o dano que entrou (para o dreno, que cura quem drena).
 */
export function efeitoDoEspecial(enc, m, a, t, sv, dano) {
  // o DESAFIO DO CAMPEÃO guarda o raio na condição (o efeito acaba se ele cai)
  if (a.raioDoDesafio && !sv.success) { const c = getCondition(t, 'desafioDoCampeao'); if (c) c.data = { ...(c.data ?? {}), raioFt: a.raioDoDesafio, donoId: m.id }; }
  if (a.cai0) {
    if (!sv.success) { enc.say('dano', `${t.name} desaba sem forças (${a.nome}).`); cairAZero(enc, t, m); }
    else if (a.condicaoAoPassar && !enc.imuneACondicao(t, a.condicaoAoPassar)) {
      enc.aplicarCondicao(t, a.condicaoAoPassar, { rounds: 1, quando: 'fim', lado: t.side, source: m.id });
    }
  }
  if (a.arremessaFt && !sv.success && !t.dead) arremessar(enc, t, a.arremessaFt, { de: m.pos, dcDaBatida: a.dc, m });
  // O APERTO que sufoca: agarrado (com a CD de escape), contido e o que mais o livro diz, tudo preso ao agarrão, e o dano no
  // começo de cada turno de quem está preso (`apertoQueFere`, como o tentáculo do cérebro ancião)
  if (a.aperto && !sv.success && !t.dead && t.hp > 0) {
    const ap = a.aperto;
    enc.aplicarCondicao(t, 'agarrado', { rounds: Infinity, source: m.id, data: { escape: ap.escape } });
    for (const c of ap.junto ?? []) if (!enc.imuneACondicao(t, c)) enc.aplicarCondicao(t, c, { rounds: Infinity, source: m.id, data: { comOAgarrao: m.id } });
    enc.aplicarCondicao(t, 'apertoQueFere', { rounds: Infinity, source: m.id, data: { comOAgarrao: m.id, dano: ap.dano, tipo: ap.tipo, ...(ap.dano2 ? { dano2: ap.dano2, tipo2: ap.tipo2 } : {}) } });
    enc.say('condicao', `${t.name} fica preso em ${m.name} (${a.nome}): agarrado${(ap.junto ?? []).length ? `, ${ap.junto.join(', ')}` : ''} (escape CD ${ap.escape}).`);
  }
  if (a.tambemCaido && !sv.success && !t.dead && t.hp > 0 && !enc.imuneACondicao(t, 'caido')) addCondition(t, 'caido', { source: m.id });
  // PRENDER à distância (a corda do korred, o agarrão sepulcral do rebento de Skoraeus): agarrado, e contido junto se o livro diz
  if (a.prende && !sv.success && !t.dead && t.hp > 0 && !enc.imuneACondicao(t, 'agarrado')) {
    enc.aplicarCondicao(t, 'agarrado', { rounds: Infinity, source: m.id, data: { escape: a.prende.escape, ...(a.prende.petrificaNoInicio ? { petrificaNoInicio: true } : {}) } });
    if (a.prende.contido && !enc.imuneACondicao(t, 'contido')) enc.aplicarCondicao(t, 'contido', { rounds: Infinity, source: m.id, data: { comOAgarrao: m.id } });
    enc.say('condicao', `${t.name} fica preso por ${m.name} (${a.nome}; escape CD ${a.prende.escape})${a.prende.petrificaNoInicio ? ': se não escapar até o começo do próximo turno dele, vira pedra' : ''}.`);
  }
  // a SANGUESSUGA DE VIDA (o yagnoloth): PV temporários de metade do dano, e o máximo só cai em quem falha
  if (a.pvTempMetade && dano > 0) m.tempHp = Math.max(m.tempHp ?? 0, Math.floor(dano / 2));
  // o OLHAR LADRÃO DE ALMAS (o nabassu): sem dano, o máximo cai pelos dados e ele ganha o mesmo em PV temporários
  if (a.reduzMaximoDados && !sv.success && !t.dead) {
    const tira = Math.min(damageRoll(enc.rng, a.reduzMaximoDados).total, t.maxHp);
    t.maxHp -= tira;
    t.maxHpPerdido = (t.maxHpPerdido ?? 0) + tira;
    if (t.hp > t.maxHp) t.hp = t.maxHp;
    if (a.pvTempIgual) m.tempHp = Math.max(m.tempHp ?? 0, tira);
    enc.say('condicao', `${t.name} perde ${tira} de PV máximo para ${m.name}${a.pvTempIgual ? `, que ganha ${tira} PV temporários` : ''}.`);
    if (t.maxHp <= 0) enc.morrer(t, 'a alma tomada');
  }
  if (a.reduzMaximo && dano > 0 && !t.dead && !(a.reduzMaximoSeFalhar && sv.success)) {
    const tira = Math.min(dano, t.maxHp);
    t.maxHp -= tira;
    t.maxHpPerdido = (t.maxHpPerdido ?? 0) + tira;
    if (t.hp > t.maxHp) t.hp = t.maxHp;
    enc.say('condicao', `${t.name} perde ${tira} de PV máximo até o descanso longo.`);
    if (t.maxHp <= 0) enc.morrer(t, 'a vida toda sugada');
  }
  return dano;
}

/** O SALTO MORTAL do bulette: salta (até 9 m) e cai em cima de quem está lá. */
export function saltoMortal(enc, m, a, alvo) {
  if (!alvo?.pos || distanceFt(m.pos, alvo.pos) < (a.soDepoisDeSaltar ?? 15) || distanceFt(m.pos, alvo.pos) > 30) return false;
  const f = m.pos.f ?? 1;
  const de = { ...m.pos };
  const casa = { x: alvo.pos.x, y: alvo.pos.y };
  for (let dy = 0; dy < f; dy++) for (let dx = 0; dx < f; dx++) if (!enc.field.inside(casa.x + dx, casa.y + dy) || enc.field.blocksMove(casa.x + dx, casa.y + dy)) return false;
  const pegos = enc.combatants.filter((c) => c !== m && !c.dead && c.pos && c.pos.x + (c.pos.f ?? 1) > casa.x && c.pos.x < casa.x + f && c.pos.y + (c.pos.f ?? 1) > casa.y && c.pos.y < casa.y + f);
  enc.say('acao', `${m.name} salta e cai em cima de ${pegos.map((c) => c.name).join(', ')} (${a.nome}).`);
  m.pos = { ...m.pos, x: casa.x, y: casa.y };
  enc.onEvent({ type: 'moved', actor: m, from: de, to: { ...m.pos }, path: [de, { ...m.pos }], salto: true });
  for (const t of pegos) {
    // Força ou Destreza, à escolha de quem cai debaixo: a melhor das duas
    const hab = (t.abilities?.str ?? 10) >= (t.abilities?.dex ?? 10) ? 'str' : 'dex';
    const sv = enc.resistencia(t, hab, a.dc, { contra: { tipoDano: a.damageType } });
    const r = enc.explicarResistencia(t, hab, a.dc, sv, { contra: a.nome, seSucesso: 'metade, e sai de baixo' });
    let total = 0;
    for (const [dd, tp] of [[a.damage, a.damageType], [a.damage2, a.damageType2]]) {
      if (!dd) continue;
      const d = damageRoll(enc.rng, dd);
      const v = sv.success ? Math.floor(d.total / 2) : d.total;
      total += v;
      enc.applyDamage(t, v, tp, m);
    }
    enc.say('dano', `${t.name} ${sv.success ? 'rola para fora' : 'é esmagado'}: ${total} de dano.`, r.conta, { rolagem: r });
    if (!t.dead) {
      const livre = enc.casaLivreMaisProxima({ x: t.pos.x, y: t.pos.y, f: t.pos.f ?? 1 });
      if (livre) t.pos = { ...t.pos, x: livre.x, y: livre.y };
      if (!sv.success && !enc.imuneACondicao(t, 'caido')) addCondition(t, 'caido', { source: m.id });
    }
  }
  return true;
}

/** INVOCAR do livro: os Filhos da Noite do vampiro (chegam em 1d4 rodadas), o demônio do mago drow, as árvores do ente. */
export function invocarDoLivro(enc, m, a) {
  if (a.semSol && enc.field.soboSol) return false;
  // o CHAMADO À HONRA: só quem já levou dano nesta luta (aqui: quem está ferido), e ele ataca com vantagem
  if (a.soFerido && m.hp >= m.maxHp) return false;
  if (a.vantagemPropria) enc.aplicarCondicao(m, 'chamadoAHonra', { rounds: enc.side === m.side ? 2 : 1, quando: 'fim', lado: m.side, source: m.id });
  if (a.opcoes?.[0]?.id === 'ente' && !arvoresPerto(enc, m)) return false;
  const op = a.opcoes[0];
  const n = /^\d+$/.test(String(op.dados ?? 1)) ? Number(op.dados ?? 1) : Math.max(1, damageRoll(enc.rng, op.dados).total);
  const demora = a.demoraDados ? damageRoll(enc.rng, a.demoraDados).total : 0;
  if (demora > 0) {
    (enc.invocacoesPendentes ??= []).push({ donoId: m.id, defId: op.id, n, nome: op.nome ?? null, rodada: enc.round + demora });
    enc.say('acao', `${m.name} chama ${a.nome}: chegam em ${demora} rodada${demora > 1 ? 's' : ''}.`);
    return true;
  }
  return trazerInvocados(enc, m, op.id, n, op.nome ?? null);
}

function arvoresPerto(enc, m) {
  for (let dy = -12; dy <= 12; dy++) for (let dx = -12; dx <= 12; dx++) {
    const x = m.pos.x + dx;
    const y = m.pos.y + dy;
    if (enc.field.inside(x, y) && /arvore|floresta|mata|bosque/i.test(enc.field.surfaceAt?.(x, y) ?? '')) return true;
  }
  return false;
}

export function trazerInvocados(enc, m, defId, n, nome) {
  let veio = 0;
  for (let i = 0; i < n; i++) {
    const c = enc.invocar(m, defId, m.pos, { spellId: 'invocacaoDoLivro', sufixo: n > 1 ? ` ${i + 1}` : '' });
    if (!c) break;
    c.invocado.auto = true;
    if (nome) c.name = n > 1 ? `${nome} ${i + 1}` : nome;
    veio += 1;
  }
  if (veio) enc.say('acao', `${veio > 1 ? `${veio} criaturas chegam` : `${nome ?? 'Uma criatura'} chega`} ao chamado de ${m.name}.`);
  return veio > 0;
}

/** As invocações que demoram (os Filhos da Noite): chegam no começo do lado do dono, na rodada marcada. */
export function chegamInvocados(enc, side) {
  if (!enc.invocacoesPendentes?.length) return;
  enc.invocacoesPendentes = enc.invocacoesPendentes.filter((p) => {
    const dono = enc.combatants.find((c) => c.id === p.donoId);
    if (!dono || dono.dead) return false;
    if (dono.side !== side || enc.round < p.rodada) return true;
    trazerInvocados(enc, dono, p.defId, p.n, p.nome);
    return false;
  });
}

/** A ESCURIDÃO do manto sombrio: esfera de 4,5 m em volta dele, que anda com ele, enquanto ele se concentra. */
export function auraDeEscuridao(enc, m, a, SPELLS) {
  const base = SPELLS.escuridao;
  if (!base || m.concentrating) return false;
  const spec = { ...base, id: 'escuridao', name: a.nome, areaFt: a.raioFt ?? 15, centradoEmSi: true };
  const casas = enc.areaDaMagia(m, spec, m.pos) ?? [];
  if (!casas.length) return false;
  const zona = enc.criarZona(m, spec, casas, 0, { centro: m.pos });
  zona.segue = m.id;
  zona.specSegue = spec;
  m.concentrating = { spellId: 'escuridao', condition: null, targets: [], zona, rounds: 100 };
  enc.say('magia', `${m.name} se cobre de uma escuridão que nem a visão no escuro atravessa.`);
  return true;
}

/** A zona que anda com o dono (a escuridão do manto sombrio). */
export function zonasSeguem(enc, m) {
  let mudou = false;
  for (const z of enc.zonas ?? []) {
    if (z.segue !== m.id || !z.specSegue) continue;
    z.casas = new Set((enc.areaDaMagia(m, z.specSegue, m.pos) ?? []).map((t) => key(t.x, t.y)));
    mudou = true;
  }
  if (mudou) enc.atualizarTerrenoDasZonas();
}

/** O GRITO DE GUERRA do chefe orc: os aliados a 9 m atacam com vantagem até o próximo turno dele; e ele golpeia de bônus. */
export function gritoDeGuerra(enc, m, a) {
  const aliados = enc.combatants.filter((c) => c.side === m.side && !c.dead && c.hp > 0 && c.pos && distanceFt(c.pos, m.pos) <= (a.raioFt ?? 30) && !hasCondition(c, 'gritoDeGuerra'));
  for (const c of aliados) addCondition(c, 'gritoDeGuerra', { rounds: 1, quando: 'inicio', lado: m.side, source: m.id });
  enc.say('acao', `${m.name} solta o grito de guerra: ${aliados.length} aliado${aliados.length > 1 ? 's' : ''} com vantagem nos golpes.`);
  m.actionUsed = true;
  if (!m.bonusUsed) {
    const golpe = m.attacks?.find((x) => !x.ranged);
    const alvo = golpe && enc.enemiesOf(m).find((e) => !e.dead && e.hp > 0 && enc.canAttack(m, e, golpe.name).ok);
    if (alvo) { m.bonusUsed = true; enc.resolveAttack(m, alvo, { weaponId: golpe.name }); }
  }
  return true;
}

/** O IMPULSO TELECINÉTICO do poltergeist: Carisma contra Força; vencendo, joga o Médio ou menor a até 9 m. */
export function impulsoTelecinetico(enc, m, alvo, abilityMod, skillBonus) {
  if (!alvo || alvo.dead || !cabeNoTamanho(alvo, 'medium') || distanceFt(m.pos, alvo.pos) > 30 || !enc.field.hasLineOfSight(m.pos, alvo.pos)) return false;
  const dele = enc.testeDeAtributo(m, 'cha', abilityMod(m.abilities?.cha ?? 10), 'Impulso Telecinético');
  const doAlvo = enc.testeDeAtributo(alvo, 'str', skillBonus(alvo, 'atletismo'), 'contra o impulso', { pericia: 'atletismo' });
  if (doAlvo.total >= dele.total) {
    enc.say('condicao', `${m.name} empurra ${alvo.name} com a mente, e ${alvo.name} finca os pés (${doAlvo.total} contra ${dele.total}).`);
    return true;
  }
  const antes = { ...alvo.pos };
  enc.empurrar(alvo, m.pos, 30);
  const voou = distanceFt(antes, alvo.pos);
  if (voou < 30 && voou >= 10) {
    const n = Math.floor(voou / 10);
    const d = damageRoll(enc.rng, `${n}d6`);
    enc.applyDamage(alvo, d.total, 'concussão', m);
    enc.say('dano', `${m.name} joga ${alvo.name} longe, contra o que estava atrás: ${d.total} de concussão.`, `${n}d6[${d.rolls.join('+')}]`);
  } else enc.say('condicao', `${m.name} joga ${alvo.name} ${voou} pés para trás.`);
  return true;
}

/**
 * AS ANTENAS do monstro da ferrugem: o metal comum que ele toca enferruja. Quem o veste ou segura faz Destreza CD 11;
 * falhou, a armadura de metal (ou o escudo) perde 1 de CA, de vez, e se desfaz ao chegar a CA 10 (o escudo, a +0); a arma
 * de metal na mão enferruja como na Ferrugem.
 */
const ARMADURA_SEM_METAL = new Set(['nenhuma', 'acolchoada', 'couro', 'couroBatido', 'peleDeAnimal']);
export const metalAoAlcance = (alvo, ARMORS) => (alvo.armor && !ARMADURA_SEM_METAL.has(alvo.armor) && !ARMORS[alvo.armor]?.bonusCA)
  || !!alvo.shield || (!!alvo.equippedWeapon && !SEM_METAL.has(alvo.equippedWeapon));
export function antenas(enc, m, a, alvo, ARMORS, armorClass, WEAPONS) {
  if (!alvo || alvo.dead || distanceFt(m.pos, alvo.pos) > 5 || !metalAoAlcance(alvo, ARMORS)) return false;
  const temArmadura = alvo.armor && !ARMADURA_SEM_METAL.has(alvo.armor) && !ARMORS[alvo.armor]?.bonusCA;
  enc.say('acao', `${m.name} estica as antenas para o metal de ${alvo.name}.`);
  const sv = enc.resistencia(alvo, 'dex', a.dc ?? 11);
  const r = enc.explicarResistencia(alvo, 'dex', a.dc ?? 11, sv, { contra: `as antenas de ${m.name}`, seSucesso: 'tira o metal do alcance' });
  if (sv.success) { enc.say('condicao', `${alvo.name} afasta o metal a tempo.`, r.conta, { rolagem: r }); return true; }
  if (temArmadura) {
    alvo.armaduraCorroida ??= {};
    const n = (alvo.armaduraCorroida[alvo.armor] ?? 0) + 1;
    alvo.armaduraCorroida[alvo.armor] = n;
    const nome = ARMORS[alvo.armor]?.name ?? 'A armadura';
    if ((ARMORS[alvo.armor]?.base ?? 10) - n <= 10) {
      enc.say('condicao', `${nome} de ${alvo.name} vira ferrugem e cai aos pedaços.`, r.conta, { rolagem: r });
      delete alvo.armaduraCorroida[alvo.armor];
      alvo.armor = 'nenhuma';
    } else enc.say('condicao', `${nome} de ${alvo.name} enferruja: −${n} de CA, de vez.`, r.conta, { rolagem: r });
  } else if (alvo.shield) {
    alvo.escudoCorroido = (alvo.escudoCorroido ?? 0) + 1;
    if (alvo.escudoCorroido >= 2) { alvo.shield = null; delete alvo.escudoCorroido; enc.say('condicao', `O escudo de ${alvo.name} se desfaz em ferrugem.`, r.conta, { rolagem: r }); }
    else enc.say('condicao', `O escudo de ${alvo.name} enferruja: −1 de CA, de vez.`, r.conta, { rolagem: r });
  } else {
    const w = WEAPONS[alvo.equippedWeapon];
    corroerArma(enc, alvo, { traits: ['corroiArma'] }, { weapon: w, ranged: false });
  }
  alvo.ac = armorClass(alvo);
  return true;
}

/** PUXAR (o enrolador): cada agarrado vem até 7,5 m em linha reta para perto dele. */
export function puxarAgarrados(enc, m, a) {
  const presos = enc.combatants.filter((c) => !c.dead && presoPor(c, m) && distanceFt(c.pos, m.pos) > 5);
  if (!presos.length) return false;
  for (const c of presos) for (let i = 0; i < Math.floor((a.pes ?? 25) / 5) && distanceFt(c.pos, m.pos) > 5; i++) enc.puxar(m, c);
  return true;
}

/** ARREMESSAR (o kraken): um agarrado é jogado a até 18 m, num rumo qualquer. */
export function arremessarAgarrado(enc, m, a) {
  const preso = enc.combatants.find((c) => !c.dead && presoPor(c, m) && cabeNoTamanho(c, 'large'));
  if (!preso) return false;
  for (const cond of [...(preso.conditions ?? [])]) if (cond.source === m.id && cond.data?.escape != null) removeCondition(preso, cond.id);
  enc.say('acao', `${m.name} arremessa ${preso.name} (${a.nome}).`);
  arremessar(enc, preso, a.pes ?? 60, { dcDaBatida: 18, m });
  return true;
}

/** O AUMENTAR do duergar: Grande por 1 minuto, o dobro dos dados no golpe de Força, vantagem em Força. Uma vez por descanso. */
export function aumentarDuergar(enc, m) {
  if (hasCondition(m, 'aumentoDuergar') || m.aumentouNaLuta) return false;
  m.aumentouNaLuta = true;
  addCondition(m, 'aumentoDuergar', { rounds: 10, source: m.id });
  m.tamanhoDoAumento = m.size ?? null;
  m.size = 'grande';
  enc.say('magia', `${m.name} cresce até o dobro do tamanho.`);
  return true;
}

/** O RUGIDO da androesfinge, em três estágios: medo; surdez e medo; trovão que derruba. */
export function estagioDoRugido(a, usosRestantes) {
  const i = Math.max(0, (a.porDia ?? a.estagios.length) - usosRestantes);
  return a.estagios[Math.min(i, a.estagios.length - 1)];
}

/** NA LUTA, O ETÉREO É FUGA (a bruxa da noite, o íncubo, o pesadelo, o teleporte do unicórnio): some e não segura a luta. */
export function fugirParaOEtereo(enc, m, a) {
  addCondition(m, 'etereo', { rounds: Infinity, source: m.id, data: { origem: { x: m.pos.x, y: m.pos.y }, fuga: true } });
  m.naoSeguraALuta = true;
  enc.say('magia', `${m.name} some da luta (${a.nome}).`);
  enc.onEvent({ type: 'sumiu', target: m, de: { ...m.pos } });
  enc.checkEnd();
  return true;
}

/** A FORMA DE NÉVOA do yochlol: vira névoa venenosa (a Forma Gasosa do motor), por até uma hora. */
export function formaDeNevoa(enc, m, a) {
  if (hasCondition(m, 'gasoso')) return false;
  addCondition(m, 'gasoso', { rounds: 600, source: m.id });
  enc.say('magia', `${m.name} se desfaz numa névoa venenosa (${a.nome}).`);
  return true;
}

// ------------------------------------------------------------------------- os raios oculares e as lendárias ----

/**
 * OS RAIOS OCULARES (o observador, o tirano da morte): `n` raios diferentes, sorteados sem repetir (o d10 que rola de
 * novo os repetidos), cada um num alvo que ele vê a até `alcanceFt` — e fora do próprio cone antimágico, que corta os
 * raios dele também. Como ação, os `n`; como ação lendária, um.
 */
export function raiosOculares(enc, m, { n = m.raiosOculares?.n ?? 1 } = {}) {
  const R = m.raiosOculares;
  if (!R || m.dead || conditionEffects(m).incapacitated) return false;
  const alvos = enc.enemiesOf(m).filter((e) => !e.dead && e.hp > 0 && e.pos && !hasCondition(e, 'petrificado') && distanceFt(m.pos, e.pos) <= R.alcanceFt
    && enc.field.hasLineOfSight(m.pos, e.pos) && !m.coneAntimagia?.casas?.has(key(e.pos.x, e.pos.y)) && !conditionEffects(e).inalcancavel)
    .sort((a, b) => a.hp - b.hp);
  if (!alvos.length) return false;
  const sorteio = [...R.raios];
  const raios = [];
  while (raios.length < Math.min(n, sorteio.length)) raios.push(...sorteio.splice(enc.rng.die(sorteio.length) - 1, 1));
  enc.say('acao', `${m.name} abre os olhos: ${raios.map((r) => r.nome).join(', ')}.`);
  raios.forEach((r, i) => aplicarRaio(enc, m, r, alvos[i % alvos.length]));
  return true;
}

export function aplicarRaio(enc, m, r, t) {
  if (!t || t.dead) return;
  if (r.efeito === 'sono' && ['morto-vivo', 'constructo'].includes(t.tipo)) { enc.say('magia', `${r.nome} não faz nada em ${t.name}.`); return; }
  if ((r.efeito === 'petrificar' && (hasCondition(t, 'petrificando') || hasCondition(t, 'petrificado'))) || (r.condition && hasCondition(t, r.condition))) return;
  const sv = enc.resistencia(t, r.save, r.dc, { contra: { tipoDano: r.damageType ?? null, condicao: r.condition ?? null, magico: true } });
  const rr = enc.explicarResistencia(t, r.save, r.dc, sv, { contra: r.nome, seSucesso: r.halfOnSave ? 'metade' : 'nada' });
  if (r.damage) {
    const d = damageRoll(enc.rng, r.damage);
    const total = sv.success ? (r.halfOnSave ? Math.floor(d.total / 2) : 0) : d.total;
    if (total) enc.applyDamage(t, total, r.damageType, m, { magico: true });
    enc.say('dano', `${r.nome} ${sv.success ? 'raspa' : 'acerta'} ${t.name}: ${total} de ${r.damageType}.`, `${rr.conta} · ${r.damage}[${d.rolls.join('+')}]`, { rolagem: rr });
    if (!sv.success && t.hp <= 0 && !t.dead && (r.efeito === 'desintegrar' || r.efeito === 'morte')) {
      enc.say('morte', r.efeito === 'desintegrar' ? `${t.name} vira um monte de pó cinza.` : `${t.name} morre na hora.`);
      enc.morrer(t, r.nome);
    }
    return;
  }
  if (sv.success) { enc.say('condicao', `${t.name} resiste a ${r.nome}.`, rr.conta, { rolagem: rr }); return; }
  if (r.efeito === 'telecinese') {
    enc.empurrar(t, m.pos, 30);
    enc.aplicarCondicao(t, 'contido', { rounds: 1, quando: 'inicio', lado: m.side, source: m.id });
    enc.say('condicao', `${r.nome} ergue ${t.name} e o prende no ar até o próximo turno de ${m.name}.`, rr.conta, { rolagem: rr });
  } else if (r.efeito === 'sono') {
    enc.aplicarCondicao(t, 'inconsciente', { rounds: 10, source: 'sono' });
    enc.say('condicao', `${t.name} cai no sono (${r.nome}).`, rr.conta, { rolagem: rr });
  } else if (r.efeito === 'petrificar') {
    addCondition(t, 'petrificando', { source: m.id, data: { cd: r.dc, save: r.save } });
    enc.say('condicao', `${t.name} começa a virar pedra (${r.nome}).`, rr.conta, { rolagem: rr });
  } else if (r.condition && !enc.imuneACondicao(t, r.condition)) {
    const curta = (r.rounds ?? 1) <= 1;
    enc.aplicarCondicao(t, r.condition, curta ? { rounds: enc.side === t.side ? 2 : 1, quando: 'fim', lado: t.side, source: m.id }
      : { rounds: r.rounds, source: m.id, data: { save: r.save, dc: r.dc, repete: !!r.repete, ...(r.condition === 'enfeiticado' ? { fimSeFerirFonte: true } : {}) } });
    enc.say('condicao', `${t.name} fica ${CONDITIONS[r.condition]?.name.toLowerCase() ?? r.condition} (${r.nome}).`, rr.conta, { rolagem: rr });
  }
}

/** Anda até perto do inimigo mais próximo (a ação lendária de mover, o Redemoinho de Areia). */
function moverAte(enc, m, pes, semOportunidade, alvos = null) {
  const inimigos = (alvos ?? enc.enemiesOf(m)).filter((e) => !e.dead && e.hp > 0 && e.pos);
  if (!inimigos.length || inimigos.some((e) => enc.field.vizinhos(m.pos, e.pos))) return false;
  const reach = enc.reachableFor(m, { orcamentoFt: pes });
  // o mais perto do inimigo mais perto que o passo alcança; encostar ganha, e entre iguais o passo mais curto
  const perto = (n) => Math.min(...inimigos.map((e) => distanceFt({ x: n.x, y: n.y }, e.pos)));
  let melhor = null;
  for (const n of reach.values()) {
    if (n.parar === false || n.cost > pes || (n.x === m.pos.x && n.y === m.pos.y)) continue;
    const d = perto(n);
    if (!melhor || d < melhor.d || (d === melhor.d && n.cost < melhor.n.cost)) melhor = { n, d };
  }
  if (!melhor || melhor.d >= perto(m.pos)) return false;
  melhor = melhor.n;
  const guarda = { mov: m.movementLeftFt, des: m.disengaging };
  m.movementLeftFt = pes;
  if (semOportunidade) m.disengaging = true;
  enc.moveAlong(m, Battlefield.pathFrom(reach, melhor));
  m.movementLeftFt = guarda.mov;
  m.disengaging = guarda.des;
  return true;
}

/**
 * UMA AÇÃO LENDÁRIA, a que vale agora. Devolve a opção usada, ou null. A ordem: curar-se e sair de perto quando está
 * mal; o raio ocular; a área que pega dois; o alvo que serve; a ação especial de novo; o golpe; a magia; o reforço dos
 * aliados; o corte da cura; a tinta; andar até alguém; a área que pega um.
 */
export function escolherLendaria(enc, m, opcoes, ctx) {
  const inimigos = enc.enemiesOf(m).filter((e) => !e.dead && e.hp > 0 && e.pos);
  const colado = inimigos.some((e) => enc.field.vizinhos(m.pos, e.pos));
  // na carapaça, o zaratan só revitaliza ou sai
  if (hasCondition(m, 'naConchaDoZaratan')) opcoes = opcoes.filter((o) => o.tipo === 'revitalizar' || o.tipo === 'emergir');
  const naArea = (o) => inimigos.filter((e) => distanceFt(m.pos, e.pos) <= o.raioFt && (!o.naoMortosVivos || e.tipo !== 'morto-vivo') && (!o.soNoChao || !enc.voaAgora?.(e)));
  const tenta = (o) => {
    switch (o.tipo) {
      case 'curaPropria': {
        if (m.hp > m.maxHp / 2) return false;
        const d = damageRoll(enc.rng, o.dados);
        const curou = enc.heal(m, d.total, m);
        enc.say('cura', `${m.name} se refaz: +${curou} PV (${o.nome}).`, `${o.dados}[${d.rolls.join('+')}]`);
        return true;
      }
      case 'teleporte': {
        if (m.hp > m.maxHp / 2 || !colado) return false;
        const casa = ctx.casaLonge(m, inimigos, o.alcanceFt);
        if (!casa) return false;
        if (trancaDimensional(enc, m, m.pos, casa)) return true;
        m.pos = { ...m.pos, x: casa.x, y: casa.y };
        enc.say('magia', `${m.name} some e reaparece longe (${o.nome}).`);
        enc.onEvent({ type: 'voltou', target: m, to: { ...m.pos } });
        return true;
      }
      case 'escudo': {
        if (!colado || hasCondition(m, 'escudoCintilante')) return false;
        addCondition(m, 'escudoCintilante', { rounds: 1, quando: 'fim', lado: m.side, source: m.id });
        enc.say('magia', `Um brilho envolve ${m.name}: +${o.bonus} de CA (${o.nome}).`);
        return true;
      }
      case 'raio': return raiosOculares(enc, m, { n: 1 });
      case 'area': {
        const pegos = naArea(o);
        if (pegos.length < 2) return false;
        enc.lendariaDeArea(m, o, pegos);
        return true;
      }
      case 'alvo': {
        const t = inimigos.filter((e) => alvoServe(enc, m, o, e) && enc.field.hasLineOfSight(m.pos, e.pos) && (!o.condition || !hasCondition(e, o.condition))
          && !e.imuneAEspecial?.includes(`${m.id}:${o.nome}`))
          .sort((a, b) => a.hp - b.hp)[0];
        if (!t) return false;
        // SEM TESTE e SEM DANO, só a condição (a Quebra-Mente da Refração de Ilvaash: desvantagem em tudo até o fim do
        // próximo turno do alvo)
        if (o.semTeste && !o.damage && o.condition) {
          if (enc.imuneACondicao(t, o.condition)) return false;
          enc.aplicarCondicao(t, o.condition, { rounds: enc.side === t.side ? 2 : 1, quando: 'fim', lado: t.side, source: m.id });
          enc.say('condicao', `${m.name} embaralha a mente de ${t.name} (${o.nome}).`);
          return true;
        }
        if (o.semTeste) {
          const d = damageRoll(enc.rng, o.damage);
          const antes = t.hp;
          enc.applyDamage(t, d.total, o.damageType, m, { magico: true });
          enc.say('dano', `${m.name} suga a mente de ${t.name}: ${d.total} de ${o.damageType} (${o.nome}).`, `${o.damage}[${d.rolls.join('+')}]`);
          if (o.drena) { const curou = enc.heal(m, Math.max(0, antes - Math.max(0, t.hp)), m); if (curou) enc.say('cura', `${m.name} recupera ${curou} PV.`); }
          return true;
        }
        enc.lendariaDeArea(m, o, [t]);
        return true;
      }
      case 'especial': {
        const a = m.acoesEspeciais?.find((x) => x.nome === o.acao);
        if (!a) return false;
        const guarda = m.actionUsed;
        m.actionUsed = false;
        const alvo = inimigos.filter((e) => alvoServe(enc, m, a, e)).sort((x, y) => x.hp - y.hp)[0] ?? null;
        const ok = (a.tipo !== 'alvo' || alvo) && enc.usarAcaoEspecial(m, a, alvo);
        m.actionUsed = guarda;
        return ok;
      }
      case 'golpe': {
        // o golpe que só existe como ação lendária (`o.ataque`) entra no bloco só enquanto ela dura
        const proprio = o.ataque && !m.attacks?.some((a) => a.name === o.ataque.name) ? o.ataque : null;
        if (proprio) (m.attacks ??= []).push(proprio);
        try {
          const alvo = inimigos.filter((e) => enc.canAttack(m, e, o.arma).ok).sort((a, b) => a.hp - b.hp)[0];
          if (!alvo) return false;
          enc.say('recurso', `${m.name} usa uma ação lendária: ${o.nome}.`);
          enc.resolveAttack(m, alvo, { weaponId: o.arma, lendaria: true });
          return true;
        } finally {
          if (proprio) m.attacks.splice(m.attacks.indexOf(proprio), 1);
        }
      }
      case 'magia': return ctx.magia(m, !!o.soTruque, o.maxCirculo ?? null, o.magias ?? null);
      case 'linha': {
        // a LINHA (o Raio Psíquico): mira no inimigo que põe mais gente dentro; vale com dois, ou com um se é a última
        let melhor = null;
        for (const e of inimigos) {
          const casas = enc.areaDaMagia(m, { shape: 'linha', areaFt: o.comprimentoFt, larguraFt: o.larguraFt, level: 0 }, e.pos) ?? [];
          const dentro = new Set(casas.map((c) => `${c.x},${c.y}`));
          const pegos = inimigos.filter((x) => enc.pegadaEmAlgumaCasa(x, dentro));
          if (!melhor || pegos.length > melhor.length) melhor = pegos;
        }
        if (!melhor || melhor.length < Math.min(2, inimigos.length)) return false;
        enc.say('magia', `${m.name} solta ${o.nome}.`);
        enc.lendariaDeArea(m, o, melhor);
        return true;
      }
      case 'lancas': {
        // AS LANÇAS (a Lança Arcana): cada uma acerta sem teste um inimigo à vista, no alcance; vão no mais ferido
        const alvos = inimigos.filter((e) => distanceFt(m.pos, e.pos) <= o.alcanceFt && enc.field.hasLineOfSight(m.pos, e.pos)).sort((a, b) => a.hp - b.hp);
        if (!alvos.length) return false;
        enc.say('magia', `${m.name} cria ${o.n} lanças de força (${o.nome}).`);
        for (let i = 0; i < o.n; i++) {
          const t = alvos.find((e) => !e.dead && e.hp > 0);
          if (!t) break;
          const d = damageRoll(enc.rng, o.damage);
          enc.say('dano', `Uma lança acerta ${t.name}: ${d.total} de ${o.damageType}.`, `${o.damage}[${d.rolls.join('+')}]`);
          enc.applyDamage(t, d.total, o.damageType, m, { magico: true });
        }
        return true;
      }
      // a TERCEIRA FILA: o COMANDO lendário (o senhor da guerra, o comandante githyanki, a matriarca drow) e o SUMIR do
      // balhannoth (invisível até o próximo ataque)
      case 'comandar':
        return comandaveis(enc, m, o).length > 0 && comandarAliados(enc, m, o);
      case 'invisivel': {
        if (hasCondition(m, 'invisivel') || !inimigos.some((e) => distanceFt(m.pos, e.pos) <= 60)) return false;
        addCondition(m, 'invisivel', { rounds: 100, source: m.id });
        enc.say('magia', `${m.name} some no ar (${o.nome}).`);
        return true;
      }
      case 'reforco': {
        const aliados = enc.combatants.filter((c) => c.side === m.side && c !== m && !c.dead && c.pos && distanceFt(c.pos, m.pos) <= o.raioFt && !hasCondition(c, 'reforcado'));
        if (!aliados.length) return false;
        for (const c of [m, ...aliados]) addCondition(c, 'reforcado', { rounds: 1, quando: 'fim', lado: m.side, source: m.id });
        enc.say('magia', `${m.name} fortalece os seus: nada de medo nem de encanto, e vantagem nos testes (${o.nome}).`);
        return true;
      }
      case 'semCura': {
        const pegos = inimigos.filter((e) => distanceFt(m.pos, e.pos) <= o.raioFt && !hasCondition(e, 'semCuraNegativa'));
        if (!pegos.some((e) => e.hp < e.maxHp)) return false;
        for (const e of pegos) addCondition(e, 'semCuraNegativa', { rounds: 1, quando: 'fim', lado: m.side, source: m.id });
        enc.say('magia', `${m.name} solta energia negativa: ninguém recupera PV até o próximo turno dele (${o.nome}).`);
        return true;
      }
      case 'tinta': return ctx.tinta(m, o);
      // A DÉCIMA SEXTA LEVA
      case 'quebrarConcentracao': {
        const t = inimigos.filter((e) => e.concentrating && (o.soAgarrado ? presoPor(e, m) : distanceFt(m.pos, e.pos) <= (o.alcanceFt ?? 120)))[0];
        if (!t) return false;
        const circulo = Math.max(1, ctx.circuloDe?.(t.concentrating.spellId) ?? 1);
        enc.dropConcentration(t);
        const dd = o.damage ?? `${circulo * Number(o.danoPorCirculo.split('d')[0])}d${o.danoPorCirculo.split('d')[1]}`;
        const d = damageRoll(enc.rng, dd);
        enc.applyDamage(t, d.total, 'psíquico', m, { magico: true });
        enc.say('magia', `${m.name} parte a concentração de ${t.name} (${o.nome}): ${d.total} de psíquico.`, `${dd}[${d.rolls.join('+')}]`);
        return true;
      }
      case 'pulso': {
        // a criatura que põe mais inimigos dele a 3 m (ela mesma conta, se for inimiga)
        let melhor = null;
        for (const c of enc.combatants.filter((x) => vivo(x) && distanceFt(m.pos, x.pos) <= o.alcanceFt)) {
          const pegos = inimigos.filter((e) => distanceFt(c.pos, e.pos) <= o.raioFt);
          if (!melhor || pegos.length > melhor.length) melhor = pegos;
        }
        if (!melhor?.length) return false;
        enc.say('magia', `${m.name} solta ${o.nome}.`);
        for (const e of melhor) {
          const d = damageRoll(enc.rng, o.damage);
          enc.applyDamage(e, d.total, o.damageType, m, { magico: true });
          enc.say('dano', `${e.name} leva ${d.total} de ${o.damageType}.`, `${o.damage}[${d.rolls.join('+')}]`);
        }
        return true;
      }
      case 'postura': {
        if (hasCondition(m, o.condicao) || !inimigos.some((e) => distanceFt(m.pos, e.pos) <= (o.data?.auraNoInicio?.raioFt ?? 5) + 10)) return false;
        enc.aplicarCondicao(m, o.condicao, { rounds: 1, quando: 'inicio', lado: m.side, source: m.id, data: o.data });
        enc.say('magia', `${m.name} usa ${o.nome}.`);
        return true;
      }
      case 'vulnerar': {
        let melhor = null;
        for (const e of inimigos.filter((x) => distanceFt(m.pos, x.pos) <= o.alcanceFt)) {
          const pegos = inimigos.filter((x) => distanceFt(e.pos, x.pos) <= o.raioFt && !hasCondition(x, o.condicao));
          if (!melhor || pegos.length > melhor.length) melhor = pegos;
        }
        if (!melhor?.length) return false;
        for (const e of melhor) enc.aplicarCondicao(e, o.condicao, { rounds: 2, quando: 'fim', lado: m.side, source: m.id });
        enc.say('magia', `${m.name} ergue ${o.nome}: ${melhor.map((e) => e.name).join(', ')} ficam vulneráveis a necrótico.`);
        return true;
      }
      case 'invocar': {
        const ja = enc.combatants.filter((c) => !c.dead && c.invocado?.donoId === m.id && c.defId === o.id).length;
        const n = (o.max ?? 5) - ja;
        if (n <= 0 || !inimigos.length) return false;
        return trazerInvocados(enc, m, o.id, n, null);
      }
      case 'alimentar': {
        const presos = inimigos.filter((e) => (e.conditions ?? []).some((c) => c.source === m.id && ['contido', 'cego'].includes(c.id)));
        if (!presos.length) return false;
        for (const e of presos) {
          const d = damageRoll(enc.rng, o.damage);
          enc.applyDamage(e, d.total, 'necrótico', m, { magico: true });
          enc.say('dano', `Os vermes de ${m.name} comem ${e.name}: ${d.total} de necrótico (${o.nome}).`, `${o.damage}[${d.rolls.join('+')}]`);
        }
        m.tempHp = Math.max(m.tempHp ?? 0, o.pvTemp);
        return true;
      }
      // O ZARATAN NA CONCHA: recolhe-se ferido (resistência a tudo, parado), revitaliza-se lá dentro e sai cuspindo pedra
      case 'recolher': {
        if (hasCondition(m, 'naConchaDoZaratan') || m.hp > m.maxHp / 3) return false;
        enc.aplicarCondicao(m, 'naConchaDoZaratan', { rounds: Infinity, source: m.id });
        m.revitalizou = false;
        enc.say('acao', `${m.name} se recolhe na carapaça (${o.nome}).`);
        return true;
      }
      case 'revitalizar': {
        if (!hasCondition(m, 'naConchaDoZaratan') || m.revitalizou) return false;
        const d = damageRoll(enc.rng, o.dados);
        const curou = enc.heal(m, d.total, m);
        m.revitalizou = true;
        enc.say('cura', `${m.name} se refaz dentro da carapaça: +${curou} PV (${o.nome}).`, `${o.dados}[${d.rolls.join('+')}]`);
        return true;
      }
      case 'emergir': {
        if (!hasCondition(m, 'naConchaDoZaratan') || !m.revitalizou) return false;
        removeCondition(m, 'naConchaDoZaratan');
        enc.say('acao', `${m.name} sai da carapaça (${o.nome}).`);
        const alvo = o.arma && inimigos.filter((e) => enc.canAttack(m, e, o.arma).ok).sort((a, b) => a.hp - b.hp)[0];
        if (alvo) enc.resolveAttack(m, alvo, { weaponId: o.arma, lendaria: true });
        return true;
      }
      case 'marionete': {
        // o DANCE, MEU BONECO (o Graz'zt): o enfeitiçado anda até ele, e quem é do lado do Graz'zt pega o passo de oportunidade
        if (o.soMove) {
          const p = inimigos.find((e) => getCondition(e, 'enfeiticado')?.source === m.id && !e.reactionUsed && !conditionEffects(e).incapacitated && !enc.field.vizinhos(e.pos, m.pos));
          if (!p) return false;
          p.reactionUsed = true;
          enc.say('condicao', `${m.name} puxa os fios: ${p.name} anda até ele (${o.nome}).`);
          const guarda = p.movementLeftFt;
          p.movementLeftFt = enc.speedOf(p);
          moverAte(enc, p, enc.speedOf(p), false, [m]);
          p.movementLeftFt = guarda;
          return true;
        }
        // o enfeitiçado por ele, com a reação, golpeia o aliado dele mais perto que alcança
        for (const p of inimigos.filter((e) => getCondition(e, 'enfeiticado')?.source === m.id && !e.reactionUsed && !conditionEffects(e).incapacitated)) {
          const arma = p.equippedWeapon ?? p.attacks?.find((g) => !g.ranged)?.name ?? null;
          const vitima = enc.combatants.filter((c) => c !== p && c.side === p.side && vivo(c) && enc.canAttack(p, c, arma).ok)[0];
          if (!vitima) continue;
          p.reactionUsed = true;
          enc.say('condicao', `${m.name} impõe a vontade: ${p.name} se vira contra ${vitima.name} (${o.nome}).`);
          enc.resolveAttack(p, vitima, { weaponId: arma });
          return true;
        }
        return false;
      }
      case 'mover': return moverAte(enc, m, o.pes ?? (o.metade ? Math.floor(enc.speedOf(m) / 2) : enc.speedOf(m)), o.semOportunidade);
      default: return false;
    }
  };
  for (const o of opcoes) if (['curaPropria', 'teleporte', 'escudo', 'raio', 'area', 'linha'].includes(o.tipo) && tenta(o)) return o;
  for (const o of opcoes) if (['recolher', 'revitalizar', 'emergir', 'quebrarConcentracao', 'pulso', 'postura', 'vulnerar', 'invocar', 'alimentar', 'marionete'].includes(o.tipo) && tenta(o)) return o;
  for (const o of opcoes) if (['alvo', 'lancas', 'especial', 'golpe', 'magia', 'reforco', 'semCura', 'tinta', 'mover'].includes(o.tipo) && tenta(o)) return o;
  // a área que só pega um, quando nada mais serviu
  for (const o of opcoes) {
    if (o.tipo !== 'area') continue;
    const pegos = naArea(o);
    if (pegos.length) { enc.lendariaDeArea(m, o, pegos); return o; }
  }
  return null;
}

// ------------------------------------------------------------------------------- as magias dos livros (`kind: 'livro'`) ----
// A magia do PHB que nenhum tipo do motor conjurava: o efeito mora aqui, pelo nome (`spell.efeito`). Quem chama é
// `combat.js castSpellBase`, com o alvo, o ponto, o círculo, a CD e o que sobra acima do círculo da magia.

/** As formas que a Metamorfose e as outras dão a quem é ALIADO: a fera mais forte que cabe, pela ordem. */
const FORMAS_DE_ALIADO = [['tiranossauroRex', 8], ['mamute', 6], ['alossauro', 2], ['ursoPolar', 2], ['tigreDenteDeSabre', 2], ['loboAtroz', 1]];
const FORMAS_DE_TRANSFORMACAO = [['dragaoVermelhoAdulto', 17], ['dragaoVermelhoJovem', 10], ['tiranossauroRex', 8], ['mamute', 6]];

export function conjurarDoLivro(enc, actor, spell, ctx, deps) {
  // AS AÇÕES DAS RAÇAS DOS LIVROS (`racas-motor.js`): as Mãos Curativas, o Passo Oculto, a Agilidade Felina...
  const f = EFEITOS[spell.efeito] ?? EFEITOS_DA_RACA[spell.efeito] ?? EFEITOS_DAS_CHAMAS[spell.efeito];
  if (!f) { enc.say('aviso', `${spell.name} ainda não tem efeito no jogo.`); return false; }
  return f(enc, actor, spell, ctx, deps);
}

const EFEITOS = {
  // A CAPA DE AUMENTO (o Obelisco, `magias-de-itens.js`): dez minutos de Força e da proficiência no dano de arma
  menteSolipsista(enc, actor) {
    addCondition(actor, 'menteSolipsista', { rounds: 600, source: actor.id });
    actor.reactionUsed = true;
    enc.say('recurso', `${actor.name} fecha a mente sobre si mesma, como o Jomlus ensinou: 1d8 a mais em Inteligência e Sabedoria, e nenhuma reação, por uma hora.`);
    return true;
  },
  aumentoDaCapa(enc, actor) {
    const prof = 2 + Math.floor(((actor.level ?? 1) - 1) / 4);
    addCondition(actor, 'aumentadoPelaCapa', { rounds: 100, source: actor.id, data: { dadosNoAcerto: `+${prof}` } });
    enc.say('recurso', `${actor.name} cresce dentro da capa: mais forte, e cada golpe pesa mais (+${prof}).`);
    return true;
  },
  // ================================================================ as magias do Caldeirão de Tasha
  /**
   * LÂMINA TROVEJANTE e LÂMINA DE CHAMA ESVERDEADA: um golpe com a arma de perto, como parte da magia. A Trovejante deixa
   * o alvo envolto em trovão: se ele sair do lugar por vontade antes do próximo turno de quem conjurou, sofre 1d8
   * trovejante. A Esverdeada solta a chama para outra criatura a 1,5 m do alvo: o atributo de conjuração de fogo. As
   * duas somam dados no 5º, 11º e 17º nível (no acerto, e no trovão e na chama).
   */
  laminaDeTruque(enc, actor, spell, { target }, { spellMod } = {}) {
    const arma = enc.armasNaMao(actor).find((id) => !enc.weaponAttackProfile(actor, id).ranged) ?? actor.equippedWeapon;
    if (!enc.canAttack(actor, target, arma).ok) { enc.say('aviso', `${actor.name} não alcança ${target.name} com a arma.`); return false; }
    const nivel = actor.level ?? 1;
    const degrau = nivel >= 17 ? 3 : nivel >= 11 ? 2 : nivel >= 5 ? 1 : 0;
    const r = enc.resolveAttack(actor, target, { weaponId: arma });
    if (!r?.hit || target.dead) return true;
    const tipo = spell.efeitoLamina === 'trovao' ? 'trovejante' : 'fogo';
    if (degrau) {
      const d = damageRoll(enc.rng, `${degrau}d8`);
      enc.say('magia', `${spell.name}: +${d.total} de ${tipo} no golpe.`, `${degrau}d8[${d.rolls.join('+')}]`);
      enc.applyDamage(target, d.total, tipo, actor, { magico: true });
    }
    if (spell.efeitoLamina === 'trovao' && !target.dead) {
      addCondition(target, 'envoltoEmTrovao', { rounds: 1, quando: 'inicio', lado: actor.side, source: actor.id, data: { dano: `${degrau + 1}d8` } });
      enc.say('condicao', `${target.name} fica envolto em trovão: andar por vontade dói.`);
    }
    if (spell.efeitoLamina === 'chama') {
      const outro = enc.combatants.find((c) => c !== target && c !== actor && !c.dead && c.hp > 0 && c.side === target.side && distanceFt(c.pos, target.pos) <= 5);
      if (outro) {
        const mod = spellMod?.(actor) ?? 0;
        const extra = degrau ? damageRoll(enc.rng, `${degrau}d8`).total : 0;
        const total = Math.max(0, mod + extra);
        enc.say('magia', `A chama verde salta de ${target.name} para ${outro.name}: ${total} de fogo.`);
        if (total > 0) enc.applyDamage(outro, total, 'fogo', actor, { magico: true });
      }
    }
    return true;
  },

  /** ATRAÇÃO ELÉTRICA: Força; quem falha é puxado até 3 m e, se acabar a 1,5 m, sofre 1d8 elétrico (sobe com o nível). */
  atracaoEletrica(enc, actor, spell, { target, dc }) {
    const sv = enc.resistencia(target, 'str', dc, { contra: { magico: true, conjurador: actor } });
    const rr = enc.explicarResistencia(target, 'str', dc, sv, { contra: spell.name, seSucesso: 'não sai do lugar' });
    if (sv.success) { enc.say('magia', `${target.name} resiste ao puxão.`, rr.conta, { rolagem: rr }); return true; }
    const longe = { x: 2 * target.pos.x - actor.pos.x, y: 2 * target.pos.y - actor.pos.y };
    enc.empurrar(target, longe, 10);
    enc.say('magia', `O raio puxa ${target.name}.`, rr.conta, { rolagem: rr });
    if (distanceFt(actor.pos, target.pos) <= 5) {
      const nivel = actor.level ?? 1;
      const n = nivel >= 17 ? 4 : nivel >= 11 ? 3 : nivel >= 5 ? 2 : 1;
      const d = damageRoll(enc.rng, `${n}d8`);
      enc.say('magia', `${target.name} sofre ${d.total} elétrico.`, `${n}d8[${d.rolls.join('+')}]`);
      enc.applyDamage(target, d.total, 'elétrico', actor, { magico: true });
    }
    return true;
  },

  // ================================================================ as magias do Guia de Xanathar
  /**
   * RAIO DO CAOS: ataque mágico; no acerto, 2d8 + 1d6, e o tipo sai de um dos dois d8 (quem conjura escolhe: aqui, o
   * que o alvo não resiste). Os dois d8 iguais fazem o raio saltar para outra criatura a até 9 m do alvo, e assim por
   * diante, sem repetir ninguém. O 1d6 a mais por círculo vale em cada um.
   */
  raioDoCaos(enc, actor, spell, { target, dc, acima = 0 }) {
    const TIPOS = ['ácido', 'frio', 'fogo', 'energético', 'elétrico', 'veneno', 'psíquico', 'trovejante'];
    const atingidos = new Set();
    let alvo = target;
    for (let salto = 0; alvo && salto < 30; salto += 1) {
      atingidos.add(alvo.id);
      const a = enc.rng.die(8);
      const b = enc.rng.die(8);
      const tipo = [TIPOS[a - 1], TIPOS[b - 1]].sort((x, y) => enc.danoPorTipo(alvo, 10, y, true) - enc.danoPorTipo(alvo, 10, x, true))[0];
      enc.say('magia', `O raio sai ${tipo} (os d8: ${a} e ${b}).`);
      const causado = enc.ataqueMagico(actor, alvo, { ...spell, damageType: tipo }, `${1 + acima}d6+${a + b}`, dc);
      if (a !== b || !(causado > 0)) break;
      const prox = enc.combatants.filter((c) => !c.dead && c.hp > 0 && c.pos && c !== actor && !atingidos.has(c.id) && c.side !== actor.side
        && distanceFt(c.pos, alvo.pos) <= 30 && enc.field.hasLineOfSight(alvo.pos, c.pos))
        .sort((x, y) => distanceFt(x.pos, alvo.pos) - distanceFt(y.pos, alvo.pos))[0];
      if (!prox) break;
      enc.say('magia', `Os dois d8 deram ${a}: o caos salta para ${prox.name}.`);
      alvo = prox;
    }
    return true;
  },

  /**
   * FACA DE GELO: ataque mágico à distância, 1d10 perfurante; acertando ou não, o gelo explode — o alvo e quem está a
   * 1,5 m dele testam Destreza, 2d6 de frio em quem falha (+1d6 por círculo).
   */
  facaDeGelo(enc, actor, spell, { target, dc, acima = 0 }) {
    enc.ataqueMagico(actor, target, spell, '1d10', dc);
    const notacao = `${2 + acima}d6`;
    const r = damageRoll(enc.rng, notacao);
    enc.say('magia', `A faca explode em estilhaços de gelo em volta de ${target.name}.`, `${notacao}[${r.rolls.join('+')}]`);
    for (const t of enc.combatants.filter((c) => !c.dead && c.pos && distanceFt(c.pos, target.pos) <= 5)) {
      const sv = enc.resistencia(t, 'dex', dc, { contra: { magico: true, tipoDano: 'frio', conjurador: actor, alvoUnico: false } });
      const rr = enc.explicarResistencia(t, 'dex', dc, sv, { contra: spell.name, seSucesso: 'nenhum dano' });
      if (sv.success) { enc.say('magia', `${t.name} escapa dos estilhaços.`, rr.conta, { rolagem: rr }); continue; }
      enc.say('magia', `${t.name} é cortado pelo gelo: ${r.total} de frio.`, rr.conta, { rolagem: rr });
      enc.applyDamage(t, r.total, 'frio', actor, { magico: true });
    }
    return true;
  },

  /** TRANSFERÊNCIA DE VIDA: quem conjura sofre 4d8 necrótico (que nada reduz) e o aliado recupera o dobro (+1d8 por círculo). */
  transferirVida(enc, actor, spell, { target, acima = 0 }) {
    if (!target || target === actor) { enc.say('aviso', 'escolha outra criatura'); return false; }
    const notacao = `${4 + acima}d8`;
    const r = damageRoll(enc.rng, notacao);
    actor.hp = Math.max(0, actor.hp - r.total);
    enc.say('magia', `${actor.name} tira da própria vida ${r.total} PV.`, `${notacao}[${r.rolls.join('+')}] · necrótico que nada reduz`);
    if (actor.hp <= 0) enc.applyDamage(actor, 1, null, actor, {});
    const pv = enc.heal(target, r.total * 2, actor);
    enc.say('cura', `${target.name} recupera ${pv} PV.`);
    return true;
  },

  /**
   * GOLPE DO VENTO DE AÇO: até cinco criaturas a até 9 m (o alvo e os inimigos mais perto de quem conjura), um ataque
   * mágico corpo a corpo em cada, 6d10 de energético; depois quem conjura surge ao lado de uma delas.
   */
  ventoDeAco(enc, actor, spell, { target, dc }) {
    const outros = enc.combatants.filter((c) => !c.dead && c.hp > 0 && c.pos && c !== target && c.side !== actor.side
      && distanceFt(c.pos, actor.pos) <= 30 && enc.field.hasLineOfSight(actor.pos, c.pos))
      .sort((a, b) => distanceFt(a.pos, actor.pos) - distanceFt(b.pos, actor.pos));
    const alvos = [target, ...outros].slice(0, 5);
    for (const t of alvos) enc.ataqueMagico(actor, t, { ...spell, melee: true }, '6d10', dc);
    const fim = alvos.find((t) => !t.dead && t.pos) ?? alvos[0];
    const casa = fim?.pos ? enc.casaLivreMaisProxima({ x: fim.pos.x, y: fim.pos.y, f: actor.pos.f ?? 1 }) : null;
    if (casa) {
      const de = { ...actor.pos };
      actor.pos = { ...actor.pos, x: casa.x, y: casa.y };
      enc.say('magia', `${actor.name} reaparece ao lado de ${fim.name}.`);
      enc.onEvent({ type: 'teleporte', actor, from: de, to: { ...actor.pos } });
    }
    return true;
  },

  /** RUÍNA ELEMENTAL: Constituição; quem falha perde a resistência ao tipo escolhido e sofre mais 2d6 dele uma vez por turno. */
  ruinaElemental(enc, actor, spell, { target, dc, opcao }) {
    const tipo = ['ácido', 'frio', 'fogo', 'elétrico', 'trovejante'].includes(opcao) ? opcao : 'fogo';
    const sv = enc.resistencia(target, 'con', dc, { contra: { magico: true, conjurador: actor } });
    const rr = enc.explicarResistencia(target, 'con', dc, sv, { contra: spell.name, seSucesso: 'nada' });
    if (sv.success) { enc.say('magia', `${target.name} resiste a ${spell.name}.`, rr.conta, { rolagem: rr }); return true; }
    addCondition(target, 'ruinaElemental', { rounds: spell.duracaoRodadas ?? 10, source: actor.id, data: { tipo } });
    actor.concentrating = { spellId: spell.id, condition: 'ruinaElemental', targets: [target], rounds: spell.duracaoRodadas ?? 10 };
    enc.say('condicao', `${target.name} fica vulnerável ao ${tipo}: a resistência some e o ${tipo} pesa mais.`, rr.conta, { rolagem: rr });
    return true;
  },

  /**
   * CONCEDER: a magia que põe uma condição com o que ela dá — o tipo e a CD do Sopro do Dragão, as cargas dos Meteoros
   * e da Coroa, a forma do Guardião da Natureza, os PV temporários da Transformação de Tenser, a espada da Lâmina
   * Sombria. As ações que a condição dá moram em `magias-concedidas.js`.
   */
  conceder(enc, actor, spell, { target, dc, opcao, acima = 0 }, { spellMod } = {}) {
    const alvo = spell.soSi ? actor : (target ?? actor);
    const condicao = spell.porOpcao?.[opcao] ?? spell.condicao ?? Object.values(spell.porOpcao ?? {})[0];
    const data = {};
    if (spell.tipoNaOpcao) data.tipo = opcao ?? spell.opcoes?.[0]?.id;
    if (spell.danoConcedido) data.dano = `${Number(spell.danoConcedido.split('d')[0]) + acima}d${spell.danoConcedido.split('d')[1]}`;
    if (spell.cdNaCondicao) data.dc = dc;
    // a PEDRA ENCANTADA soma o atributo de conjuração de quem a encantou
    if (spell.danoComMod) { const m = spellMod?.(actor) ?? 0; data.dano = `${spell.danoComMod}${m >= 0 ? '+' : ''}${m}`; }
    if (spell.cargas) data.cargas = spell.cargas + acima * (spell.cargasPorCirculo ?? 0);
    // a MORTALHA ESPIRITUAL soma 1d8 a cada dois círculos acima do 3º
    if (spell.dadoNoAcertoACada2) data.dadosNoAcerto = `${1 + Math.floor(acima / 2)}${spell.dadoNoAcertoACada2}`;
    addCondition(alvo, condicao, { rounds: spell.duracaoRodadas ?? 10, source: actor.id, data });
    if (spell.concentration) actor.concentrating = { spellId: spell.id, condition: condicao, targets: [alvo], rounds: spell.duracaoRodadas ?? null };
    const pv = spell.pvTemp?.[opcao] ?? (typeof spell.pvTemp === 'number' ? spell.pvTemp : 0);
    if (pv && (alvo.tempHp ?? 0) < pv) alvo.tempHp = pv;
    if (spell.arma) {
      alvo.weapons = [...new Set([...(alvo.weapons ?? []), spell.arma])];
      if (alvo.equippedWeapon !== spell.arma) alvo.armaAntesDaLamina = alvo.equippedWeapon;
      alvo.equippedWeapon = spell.arma;
    }
    enc.say('magia', `${alvo.name}: ${CONDITIONS[condicao]?.name ?? condicao}${data.tipo ? ` (${data.tipo})` : ''}${data.cargas ? `, ${data.cargas} ${data.cargas === 1 ? 'uso' : 'usos'}` : ''}${pv ? `, ${pv} PV temporários` : ''}.`);
    return true;
  },
  /**
   * METAMORFOSE (e a Verdadeira, as Formas Animais, a Transformação): o inimigo que falha Sabedoria vira rã; o aliado
   * (ou quem conjura, na Transformação) vira a fera mais forte que a magia permite. A forma cai a 0 PV, como a Forma
   * Selvagem, e acaba com a concentração.
   */
  /**
   * O DRAGÃO ILUSÓRIO (Xanathar): a sombra de dragão surge no ponto; cada inimigo que a vê dali, a até 36 m, testa Sabedoria
   * ou fica amedrontado (um minuto, o teste no fim de cada turno). Quem conjura fica com o sopro de ação bônus
   * (`magias-concedidas.js soproDoDragaoIlusorio`), do tipo escolhido e na CD dele, enquanto a concentração durar.
   */
  dragaoIlusorio(enc, actor, spell, { point, dc, opcao }) {
    const centro = point ?? actor.pos;
    const tipo = opcao ?? spell.opcoes?.[0]?.id ?? 'fogo';
    addCondition(actor, 'dragaoIlusorio', { rounds: spell.duracaoRodadas ?? 10, source: actor.id, data: { tipo, dano: '7d6', dc } });
    actor.concentrating = { spellId: spell.id, condition: 'dragaoIlusorio', targets: [actor], rounds: spell.duracaoRodadas ?? 10 };
    enc.say('magia', `Uma sombra de dragão, enorme, se ergue diante de ${actor.name} (de ${tipo}).`);
    for (const t of enc.enemiesOf(actor).filter((e) => !e.dead && e.hp > 0 && e.pos && distanceFt(centro, e.pos) <= 120 && enc.field.hasLineOfSight(centro, e.pos))) {
      if (enc.imuneACondicao(t, 'amedrontado')) continue;
      const sv = enc.resistencia(t, 'wis', dc, { contra: { condicao: 'amedrontado', magico: true, conjurador: actor } });
      const r = enc.explicarResistencia(t, 'wis', dc, sv, { contra: spell.name, seSucesso: 'não se assusta' });
      if (sv.success) { enc.say('condicao', `${t.name} não se assusta com o dragão.`, r.conta, { rolagem: r }); continue; }
      enc.aplicarCondicao(t, 'amedrontado', { rounds: 10, source: actor.id, data: { save: 'wis', dc, repete: true } });
      enc.say('condicao', `${t.name} recua diante do dragão: amedrontado.`, r.conta, { rolagem: r });
    }
    return true;
  },
  metamorfose(enc, actor, spell, { target, dc, opcao }, { vestirFera, MONSTERS }) {
    const ctxMassa = { opcao };
    // a METAMORFOSE EM MASSA (Xanathar): até dez que quem conjura vê a até 36 m, todos inimigos ou todos aliados (a opção)
    const emMassa = spell.massa ? enc.combatants.filter((c) => vivo(c) && c.pos && !c.formaSelvagem && (ctxMassa?.opcao === 'aliados' ? c.side === actor.side : c.side !== actor.side)
      && distanceFt(c.pos, actor.pos) <= (spell.rangeFt ?? 120) && (c === actor || enc.field.hasLineOfSight(actor.pos, c.pos)) && !conditionEffects(c).inalcancavel)
      .sort((a, b) => distanceFt(a.pos, actor.pos) - distanceFt(b.pos, actor.pos)).slice(0, spell.massa) : null;
    const alvos = emMassa ?? (spell.soSi ? [actor]
      : spell.raioFt ? enc.combatants.filter((c) => c.side === actor.side && !c.dead && c.hp > 0 && c.pos && distanceFt(c.pos, actor.pos) <= spell.raioFt && !c.formaSelvagem)
        : [target].filter(Boolean));
    const virou = [];
    for (const t of alvos) {
      if (t.formaSelvagem || ['morto-vivo', 'constructo'].includes(t.tipo)) continue;
      const inimigo = t.side !== actor.side;
      if (inimigo) {
        const sv = enc.resistencia(t, 'wis', dc, { contra: { magico: true } });
        const r = enc.explicarResistencia(t, 'wis', dc, sv, { contra: spell.name, seSucesso: 'continua como é' });
        if (sv.success) { enc.say('magia', `${t.name} resiste a ${spell.name}.`, r.conta, { rolagem: r }); continue; }
      }
      const teto = spell.crMax === 'nivel' ? (actor.level ?? 1) : spell.crMax ?? (t.level ?? 1);
      const lista = spell.soSi ? FORMAS_DE_TRANSFORMACAO : FORMAS_DE_ALIADO;
      const forma = inimigo ? (spell.formaInimigo ?? 'ra') : lista.find(([id, cr]) => MONSTERS[id] && cr <= teto)?.[0];
      if (!forma || !vestirFera(t, forma, { livre: true })) continue;
      t.formaSelvagem.daMagia = spell.id;
      t.formaSelvagem.donoDaMagia = actor.id;
      virou.push(t);
      enc.say('magia', `${t.name} vira ${t.formaSelvagem.nome} (${spell.name}).`);
    }
    if (!virou.length) return true;
    if (spell.concentration) {
      enc.dropConcentration(actor);
      actor.concentrating = { spellId: spell.id, condition: null, targets: virou, rounds: spell.duracaoRodadas ?? null, formas: true };
    }
    return true;
  },

  /** RAIO PRISMÁTICO: cada um no cone faz Destreza e um d8 escolhe o raio — cinco de dano, o anil que prende, o violeta que cega. */
  prismatico(enc, actor, spell, { point, target, slot, dc }) {
    const casas = enc.areaDaMagia(actor, spell, point ?? target?.pos, slot) ?? [];
    const pegos = enc.afetadosPelaArea(actor, spell, casas, slot).map((x) => x.c).filter((c) => c !== actor);
    const CORES = [['vermelho', 'fogo'], ['laranja', 'ácido'], ['amarelo', 'elétrico'], ['verde', 'veneno'], ['azul', 'frio']];
    const raio = (t, d) => {
      const sv = enc.resistencia(t, 'dex', dc, { contra: { magico: true } });
      const r = enc.explicarResistencia(t, 'dex', dc, sv, { contra: spell.name, seSucesso: d <= 5 ? 'metade' : 'nada' });
      if (d <= 5) {
        const [cor, tipo] = CORES[d - 1];
        const x = damageRoll(enc.rng, '10d6');
        const v = sv.success ? Math.floor(x.total / 2) : x.total;
        enc.applyDamage(t, v, tipo, actor, { magico: true });
        enc.say('dano', `O raio ${cor} pega ${t.name}: ${v} de ${tipo}.`, `${r.conta} · 10d6[${x.rolls.join('+')}]`, { rolagem: r });
      } else if (d === 6 && !sv.success) {
        enc.aplicarCondicao(t, 'petrificando', { source: actor.id, data: { cd: dc, save: 'con' } });
        enc.say('condicao', `O raio anil prende ${t.name}: a carne começa a virar pedra.`, r.conta, { rolagem: r });
      } else if (d === 7 && !sv.success) {
        enc.aplicarCondicao(t, 'cego', { source: actor.id, rounds: 2, quando: 'fim', lado: t.side });
        enc.say('condicao', `O raio violeta cega ${t.name}.`, r.conta, { rolagem: r });
      } else enc.say('condicao', `${t.name} escapa do raio.`, r.conta, { rolagem: r });
    };
    for (const t of pegos) {
      const d = enc.rng.die(8);
      // o 8 é dois raios: rola-se de novo duas vezes, sem o 8
      if (d === 8) { raio(t, enc.rng.die(7)); raio(t, enc.rng.die(7)); } else raio(t, d);
    }
    return true;
  },

  /**
   * PALAVRA DIVINA: quem ouve a 9 m faz Carisma; o que acontece a quem falha depende dos PV de agora — 50 ou menos,
   * surdo; 40, surdo e cego; 30, surdo, cego e atordoado; 20, morre. Celestial, elemental, fada e corruptor que falham
   * voltam ao plano deles.
   */
  palavraDivina(enc, actor, spell, { dc }) {
    const pegos = enc.enemiesOf(actor).filter((t) => !t.dead && t.pos && distanceFt(t.pos, actor.pos) <= (spell.raioFt ?? 30) && !hasCondition(t, 'surdo'));
    for (const t of pegos) {
      const sv = enc.resistencia(t, 'cha', dc, { contra: { magico: true } });
      const r = enc.explicarResistencia(t, 'cha', dc, sv, { contra: spell.name, seSucesso: 'nada' });
      if (sv.success) { enc.say('magia', `${t.name} aguenta a palavra.`, r.conta, { rolagem: r }); continue; }
      if (['celestial', 'elemental', 'feérico', 'corruptor'].includes(t.tipo)) {
        enc.aplicarCondicao(t, 'banidoDeVez', { source: actor.id });
        enc.say('magia', `${t.name} é mandado de volta ao plano dele.`, r.conta, { rolagem: r });
        continue;
      }
      if (t.hp <= 20) { enc.say('morte', `A palavra mata ${t.name}.`, r.conta, { rolagem: r }); enc.morrer(t, spell.name); continue; }
      const quais = t.hp <= 30 ? ['surdo', 'cego', 'atordoado'] : t.hp <= 40 ? ['surdo', 'cego'] : t.hp <= 50 ? ['surdo'] : [];
      const rodadas = t.hp <= 30 ? 600 : t.hp <= 40 ? 100 : 10;
      for (const c of quais) enc.aplicarCondicao(t, c, { source: actor.id, rounds: rodadas });
      enc.say('condicao', quais.length ? `${t.name} fica ${quais.map((c) => CONDITIONS[c]?.name.toLowerCase()).join(', ')}.` : `${t.name} tem PV demais para a palavra.`, r.conta, { rolagem: r });
    }
    return true;
  },

  /** TEMPESTADE DA VINGANÇA: a nuvem se arma; cada turno de quem conjura traz o estágio seguinte (`estagioDaTempestade`). */
  tempestade(enc, actor, spell, { dc }) {
    enc.dropConcentration(actor);
    actor.concentrating = { spellId: spell.id, condition: null, targets: [], rounds: spell.duracaoRodadas ?? 10, tempestade: { estagio: 1, dc } };
    estagioDaTempestade(enc, actor);
    return true;
  },

  /** JAULA DE FORÇA: quem está no cubo de 3 m fica preso nele por uma hora. */
  jaula(enc, actor, spell, { point, target, slot }) {
    const casas = enc.areaDaMagia(actor, spell, point ?? target?.pos, slot) ?? [];
    const k = new Set(casas.map((t) => key(t.x, t.y)));
    const presos = enc.combatants.filter((c) => !c.dead && c.pos && k.has(key(c.pos.x, c.pos.y)));
    for (const c of presos) enc.aplicarCondicao(c, 'enjaulado', { source: actor.id, rounds: 600 });
    enc.say('magia', presos.length ? `Uma jaula de força invisível prende ${presos.map((c) => c.name).join(', ')}.` : 'A jaula de força se fecha sobre o vazio.');
    return true;
  },

  /** A MÃO DE BIGBY e a ESPADA DE MORDENKAINEN: a peça surge, luta pelo lado de quem conjura e some com a concentração. */
  peca(enc, actor, spell, { point, target, acima }, { spellAttackBonus }) {
    const onde = point ?? target?.pos ?? actor.pos;
    const c = enc.invocar(actor, spell.defId, onde, { spellId: spell.id });
    if (!c) { enc.say('aviso', `${spell.name} não achou casa livre.`); return false; }
    c.invocado.auto = true;
    const bonus = spellAttackBonus(actor);
    c.attacks = c.attacks.map((a) => ({ ...a, bonus, ...(spell.upcast?.dados && acima ? { damage: a.damage.replace(/^(\d+)d/, (_, n) => `${Number(n) + spell.upcast.dados * acima}d`) } : {}) }));
    if (spell.defId === 'maoDeBigby') { c.maxHp = actor.maxHp; c.hp = actor.maxHp; }
    enc.dropConcentration(actor);
    actor.concentrating = { spellId: spell.id, condition: null, targets: [], rounds: spell.duracaoRodadas ?? 10 };
    enc.say('magia', `${c.name} surge ao lado de ${actor.name}.`);
    if (target && target.side !== actor.side && enc.canAttack(c, target).ok) enc.resolveAttack(c, target, {});
    return true;
  },

  /** VINHA AGARRADORA: quem ela alcança faz Destreza ou é puxado 6 m para perto de quem a conjurou. */
  vinha(enc, actor, spell, { target, dc }) {
    if (!target || target.dead) return false;
    const sv = enc.resistencia(target, 'dex', dc, { contra: { magico: true, planta: true } });
    const r = enc.explicarResistencia(target, 'dex', dc, sv, { contra: spell.name, seSucesso: 'escapa da vinha' });
    if (sv.success) { enc.say('magia', `${target.name} escapa da vinha.`, r.conta, { rolagem: r }); return true; }
    for (let i = 0; i < 4 && distanceFt(target.pos, actor.pos) > 5; i++) enc.puxar(actor, target);
    enc.say('condicao', `A vinha arrasta ${target.name}.`, r.conta, { rolagem: r });
    return true;
  },

  /** CURA COMPLETA EM MASSA: 700 PV repartidos entre os aliados a 18 m, os mais feridos primeiro; e tira cegueira e surdez. */
  curaEmMassa(enc, actor, spell) {
    let resto = 700;
    const feridos = enc.combatants.filter((c) => c.side === actor.side && !c.dead && c.pos && distanceFt(c.pos, actor.pos) <= 60 && !['morto-vivo', 'constructo'].includes(c.tipo))
      .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
    for (const c of feridos) {
      for (const id of ['cego', 'surdo']) removeCondition(c, id);
      const falta = Math.min(resto, c.maxHp - c.hp);
      if (falta <= 0) continue;
      resto -= enc.heal(c, falta, actor);
    }
    enc.say('cura', `${spell.name}: ${700 - resto} PV repartidos.`);
    return true;
  },

  /** PALAVRA DE PODER CURAR: todos os PV de volta, e acabam encanto, medo, paralisia e atordoamento. */
  palavraCurar(enc, actor, spell, { target }) {
    if (!target || target.dead || ['morto-vivo', 'constructo'].includes(target.tipo)) return false;
    for (const id of ['enfeiticado', 'amedrontado', 'paralisado', 'atordoado']) removeCondition(target, id);
    const curou = enc.heal(target, target.maxHp - target.hp, actor);
    enc.say('cura', `${target.name} se ergue inteiro: +${curou} PV.`);
    return true;
  },

  /** TELECINESE: Força de quem é movido contra o atributo de conjuração; perdendo, vai até 9 m e fica preso até o próximo turno. */
  telecinese(enc, actor, spell, { target }, { spellMod, skillBonus }) {
    if (!target || target.dead || !cabeNoTamanho(target, 'huge')) return false;
    const dele = enc.testeDeAtributo(actor, actor.spellcasting?.ability ?? 'int', spellMod(actor), spell.name);
    const doAlvo = enc.testeDeAtributo(target, 'str', skillBonus(target, 'atletismo'), `contra ${spell.name}`, { pericia: 'atletismo' });
    if (!spell.reusado) {
      enc.dropConcentration(actor);
      actor.concentrating = { spellId: spell.id, condition: null, targets: [], rounds: spell.duracaoRodadas ?? 100 };
    }
    if (doAlvo.total >= dele.total) { enc.say('condicao', `${target.name} se solta da mão invisível (${doAlvo.total} contra ${dele.total}).`); return true; }
    enc.empurrar(target, actor.pos, 30);
    enc.aplicarCondicao(target, 'contido', { rounds: 2, quando: 'fim', lado: actor.side, source: actor.id });
    enc.say('condicao', `${actor.name} ergue ${target.name} com a mente e o arremessa longe (${dele.total} contra ${doAlvo.total}).`);
    return true;
  },

  // ======================================================== as seis magias que a fila do bestiário ainda cobrava
  /** CRIAR PASSAGEM: a parede (e a rocha atrás dela, até 6 m) vira passagem. A casa mirada é a parede ou a casa diante dela. */
  criarPassagem(enc, actor, spell, { point }) {
    const p = passagemDaMagia(enc, actor, point);
    if (!p) { enc.say('aviso', 'Ali não há parede de madeira ou pedra para abrir.'); return false; }
    const fl = enc.field;
    for (const a of p.arestas) fl.porAresta(a.a.x, a.a.y, a.b.x, a.b.y, ARESTA.aberta);
    for (const t of p.casas) {
      const i = t.y * fl.w + t.x;
      fl.tiles[i] = 0;
      fl.surfaces[i] = SUPERFICIES.indexOf('laje');
      if (fl.heights) fl.heights[i] = 0;
    }
    fl.versao = (fl.versao ?? 0) + 1;
    (enc.passagensDeMagia ??= []).push({ dono: actor.id, ...p });
    enc.say('magia', p.casas.length
      ? `A pedra se abre diante de ${actor.name}: uma passagem de ${(p.casas.length * 1.5).toLocaleString('pt-BR')} m atravessa a parede.`
      : `A parede se abre diante de ${actor.name}, e do outro lado já é chão.`);
    enc.onEvent({ type: 'passagem', actor, casas: p.casas.length });
    return true;
  },

  /** TRANCA ARCANA: a porta fechada que se toca fica trancada; quem conjurou e o lado dele abrem normalmente, e a CD sobe 10. */
  trancaArcana(enc, actor, spell, { point }) {
    const porta = portaDaTranca(enc, actor, point);
    if (!porta) { enc.say('aviso', 'Não há porta fechada ao alcance da mão.'); return false; }
    trancarComMagia(enc.field, porta.chave, actor);
    enc.say('magia', `${actor.name} passa a mão pela porta, e um brilho dourado corre pelas frestas: ela está trancada por magia.`);
    return true;
  },

  /** PORTAL ARCANO: dois anéis ligados, um ao lado de quem conjura e o outro na casa mirada; quem entra num sai do outro. */
  portalArcano(enc, actor, spell, { point }) {
    const perto = casaDoPortalPerto(enc, actor, point);
    if (!perto || !point) { enc.say('aviso', 'Não há casa livre ao lado para abrir o primeiro portal: a magia se perde.'); return true; }
    enc.dropConcentration(actor);
    const portal = abrirPortais(enc, actor, perto, point);
    actor.concentrating = { spellId: spell.id, condition: null, targets: [], rounds: spell.duracaoRodadas ?? 100, portal };
    enc.say('magia', `Dois anéis de névoa brilhante se abrem, um ao lado de ${actor.name} e outro a ${(distanceFt(perto, point) * 0.3).toLocaleString('pt-BR')} m dali: quem entra num sai pelo outro.`);
    return true;
  },

  /** CAMINHAR EM ÁRVORES: por um minuto, uma vez por rodada, quem conjurou entra numa árvore e sai por outra a até 150 m. */
  caminharEmArvores(enc, actor, spell) {
    enc.dropConcentration(actor);
    addCondition(actor, 'caminhandoEmArvores', { rounds: spell.duracaoRodadas ?? 10, source: actor.id });
    actor.concentrating = { spellId: spell.id, condition: 'caminhandoEmArvores', targets: [actor], rounds: spell.duracaoRodadas ?? 10 };
    const arvores = casasDeArvore(enc.field).length;
    enc.say('magia', arvores
      ? `${actor.name} sente cada árvore viva por perto (${arvores} ao alcance): pode entrar numa e sair por outra.`
      : `${actor.name} procura as árvores com a magia, mas não há nenhuma por aqui.`);
    return true;
  },
  /** A travessia em si (a ação que a magia dá, `magias-concedidas.js atravessarArvore`): 1,5 m para entrar e 1,5 m para sair. */
  atravessarArvore(enc, actor, spell, { point }) {
    const de = arvoreAoLado(enc.field, actor.pos);
    if (!de || !point) return false;
    actor.arvoreNaRodada = enc.round;
    actor.movementLeftFt = Math.max(0, (actor.movementLeftFt ?? 0) - 10);
    const antes = { ...actor.pos };
    actor.pos = { x: point.x, y: point.y, f: actor.pos.f ?? 1 };
    enc.onEvent({ type: 'teleport', actor, from: antes, to: { ...actor.pos } });
    enc.say('movimento', `${actor.name} entra no tronco de uma árvore e sai por outra, a ${(distanceFt(antes, point) * 0.3).toLocaleString('pt-BR')} m dali.`);
    return true;
  },

  /** A MOEDA BRILHANTE DE JIM: a moeda acende onde cai, e quem o conjurador escolhe a até 9 m dela faz Sabedoria ou fica distraído. */
  moedaBrilhante(enc, actor, spell, { point, dc }) {
    if (!point) return false;
    (enc.luzesDeMagia ??= []).push({ pos: { x: point.x, y: point.y }, claro: 20, penumbra: 20, tipo: 'magica', cor: '#ffe08a', ateRodada: enc.round + (spell.duracaoRodadas ?? 10), spellId: spell.id });
    const alvos = enc.combatants.filter((c) => vivo(c) && c.side !== actor.side && c.pos && distanceFt(c.pos, point) <= 30
      && enc.field.hasLineOfSight(actor.pos, c.pos) && !hasCondition(c, 'invisivel'));
    const presos = [];
    for (const c of alvos) {
      const sv = enc.resistencia(c, 'wis', dc, { contra: { magico: true, condicao: 'distraidoPelaMoeda' } });
      const r = enc.explicarResistencia(c, 'wis', dc, sv, { contra: spell.name, seSucesso: 'não olha a moeda' });
      if (sv.success) { enc.say('magia', `${c.name} não cai no truque da moeda.`, r.conta, { rolagem: r }); continue; }
      enc.aplicarCondicao(c, 'distraidoPelaMoeda', { rounds: spell.duracaoRodadas ?? 10, source: actor.id });
      presos.push(c);
      enc.say('condicao', `${c.name} não tira os olhos da moeda que brilha.`, r.conta, { rolagem: r });
    }
    if (!alvos.length) enc.say('magia', 'A moeda cai e acende, mas não há ninguém por perto para olhá-la.');
    return true;
  },

  /** INCITAR COBIÇA: quem o conjurador escolhe a até 9 m e o vê faz Sabedoria ou só pensa na gema: anda até ela e fica olhando. */
  incitarCobica(enc, actor, spell, { dc }) {
    const alvos = enc.combatants.filter((c) => vivo(c) && c.side !== actor.side && c.pos && distanceFt(c.pos, actor.pos) <= 30
      && enc.field.hasLineOfSight(c.pos, actor.pos) && !hasCondition(c, 'cego') && !hasCondition(actor, 'invisivel'));
    const presos = [];
    for (const c of alvos) {
      if (c.imunidades?.condicoes?.includes('enfeiticado') || c.conditionImmunities?.includes('enfeiticado')) continue;
      const sv = enc.resistencia(c, 'wis', dc, { contra: { magico: true, condicao: 'enfeiticado' } });
      const r = enc.explicarResistencia(c, 'wis', dc, sv, { contra: spell.name, seSucesso: 'desvia os olhos da gema' });
      if (sv.success) { enc.say('magia', `${c.name} desvia os olhos da gema.`, r.conta, { rolagem: r }); continue; }
      enc.aplicarCondicao(c, 'cobicaIncitada', { rounds: spell.duracaoRodadas ?? 10, source: actor.id, data: { repete: true, save: 'wis', dc } });
      presos.push(c);
      enc.say('condicao', `${c.name} só tem olhos para a gema que ${actor.name} mostra.`, r.conta, { rolagem: r });
    }
    if (!presos.length) { if (!alvos.length) enc.say('magia', 'Ninguém a até 9 m vê a gema.'); return true; }
    enc.dropConcentration(actor);
    actor.concentrating = { spellId: spell.id, condition: 'cobicaIncitada', targets: presos, rounds: spell.duracaoRodadas ?? 10 };
    return true;
  },

  // ======================================================== a fila do PHB (2026-11-16)
  /** FORMA ETÉREA: quem conjura vai para o Plano Etéreo (`etereo`, que ninguém mira nem fere) até usar a ação para voltar. */
  formaEterea(enc, actor, spell) {
    if (hasCondition(actor, 'etereo')) { enc.say('aviso', `${actor.name} já está no Plano Etéreo: a magia não faz nada.`); return true; }
    addCondition(actor, 'etereo', { rounds: spell.duracaoRodadas ?? 4800, source: actor.id, data: { origem: { x: actor.pos.x, y: actor.pos.y }, formaEterea: true } });
    enc.say('magia', `${actor.name} desbota até virar cinza e passa para o Plano Etéreo: daqui ninguém o vê nem o toca.`);
    enc.onEvent({ type: 'sumiu', target: actor, de: { ...actor.pos } });
    return true;
  },
  /** A volta (`magias-concedidas.js voltarDoEtereo`): a ação, numa casa livre a até o deslocamento de onde ele sumiu, atravessando parede. */
  voltarDoEtereo(enc, actor, spell, { point }) {
    if (!getCondition(actor, 'etereo')?.data?.formaEterea || !point) return false;
    getCondition(actor, 'etereo').data.origem = { x: point.x, y: point.y };
    enc.voltarDoEtereo(actor);
    return true;
  },

  /**
   * DESEJO, sem o duplicar (que pediria escolher entre centenas de magias, com a mira de cada uma): a CURA de até vinte
   * aliados que se veem (todos os PV, e o que a Restauração Maior tira), ou a RESISTÊNCIA de até dez a um tipo de dano. As
   * duas cobram o desgaste do livro (`estresseDoDesejo`) e um terço de chance de nunca mais conjurar o Desejo.
   */
  desejo(enc, actor, spell, { opcao }) {
    const vistos = enc.combatants.filter((c) => vivo(c) && c.side === actor.side && c.pos
      && (c === actor || enc.field.hasLineOfSight(actor.pos, c.pos)))
      .sort((a, b) => (a === actor ? -1 : b === actor ? 1 : distanceFt(a.pos, actor.pos) - distanceFt(b.pos, actor.pos)));
    if (String(opcao ?? 'cura').startsWith('res:')) {
      const tipo = String(opcao).slice(4);
      for (const c of vistos.slice(0, 10)) addCondition(c, 'resistenciaDoDesejo', { rounds: Infinity, source: actor.id, data: { tipo } });
      enc.say('magia', `${actor.name} deseja, e a realidade obedece: ${vistos.slice(0, 10).map((c) => c.name).join(', ')} resistem a dano ${tipo}.`);
    } else {
      for (const c of vistos.slice(0, 20)) {
        for (const id of ['enfeiticado', 'petrificando', 'petrificado', 'amaldicoado']) removeCondition(c, id);
        if ((c.exaustao ?? 0) > 0) mudarExaustao(c, -1);
        if (c.maxHpPerdido) { c.maxHp += c.maxHpPerdido; delete c.maxHpPerdido; }
        enc.heal(c, c.maxHp - c.hp, actor);
      }
      enc.say('cura', `${actor.name} deseja, e ${vistos.slice(0, 20).map((c) => c.name).join(', ')} se erguem inteiros.`);
    }
    // o DESEJO DO GÊNIO (a garrafa do efreeti): quem pede não paga o desgaste; gasta um dos três
    if (spell.doGenio) {
      const t = getCondition(actor, 'tresDesejos');
      if (t) { t.data.restam -= 1; if (t.data.restam <= 0) { removeCondition(actor, 'tresDesejos'); enc.say('magia', 'O efreeti cumpre o último desejo e some.'); } }
      return true;
    }
    actor.estresseDoDesejo = true;
    const d = enc.rng.die(100);
    if (d <= 33) { actor.semDesejo = true; enc.say('aviso', `O esforço cobra caro: ${actor.name} nunca mais conseguirá conjurar o Desejo (d100 = ${d}).`); }
    else enc.say('aviso', `O esforço pesa em ${actor.name}: até o descanso longo, toda magia que conjurar lhe custa 1d10 necrótico por círculo (d100 = ${d}).`);
    return true;
  },

  // ======================================================== a fila do Xanathar (2026-11-16)
  /** VÍNCULO BESTIAL: a fera aliada (Inteligência 3 ou menos) tem vantagem contra quem está a 1,5 m de quem conjurou. */
  vinculoBestial(enc, actor, spell, { target }) {
    if (!target || !alvoDoLivro(enc, actor, spell, target)?.ok) return false;
    enc.dropConcentration(actor);
    addCondition(target, 'vinculoBestial', { rounds: spell.duracaoRodadas ?? 100, source: actor.id });
    actor.concentrating = { spellId: spell.id, condition: 'vinculoBestial', targets: [target], rounds: spell.duracaoRodadas ?? 100 };
    enc.say('magia', `${actor.name} e ${target.name} passam a pensar juntos: a fera vê o que ${actor.name} vê.`);
    return true;
  },

  /**
   * DISPERSÃO: até cinco a 9 m somem e reaparecem a até 36 m de quem conjura. Os inimigos (Sabedoria para resistir) vão
   * para a casa livre que ele vê mais LONGE do grupo dele; os aliados, para a mais longe dos inimigos.
   */
  dispersao(enc, actor, spell, { dc, opcao }) {
    const inimigos = opcao !== 'aliados';
    const vistos = enc.combatants.filter((c) => vivo(c) && c.pos && (inimigos ? c.side !== actor.side : c.side === actor.side)
      && distanceFt(c.pos, actor.pos) <= (spell.rangeFt ?? 30) && (c === actor || enc.field.hasLineOfSight(actor.pos, c.pos)) && !conditionEffects(c).inalcancavel)
      .sort((a, b) => distanceFt(a.pos, actor.pos) - distanceFt(b.pos, actor.pos)).slice(0, 5);
    if (!vistos.length) { enc.say('magia', `${spell.name}: ninguém ao alcance.`); return true; }
    const longeDe = enc.combatants.filter((c) => vivo(c) && c.pos && (inimigos ? c.side === actor.side : c.side !== actor.side));
    const tomadas = new Set();
    for (const c of vistos) {
      if (inimigos) {
        const sv = enc.resistencia(c, 'wis', dc, { contra: { magico: true } });
        const r = enc.explicarResistencia(c, 'wis', dc, sv, { contra: spell.name, seSucesso: 'fica onde está' });
        if (sv.success) { enc.say('magia', `${c.name} resiste e fica onde está.`, r.conta, { rolagem: r }); continue; }
      }
      const casa = casaDaDispersao(enc, actor, c, longeDe, tomadas);
      if (!casa) continue;
      tomadas.add(key(casa.x, casa.y));
      const de = { ...c.pos };
      c.pos = { x: casa.x, y: casa.y, f: c.pos.f ?? 1 };
      enc.onEvent({ type: 'teleport', actor: c, from: de, to: { ...c.pos } });
      enc.say('movimento', `${c.name} some e reaparece a ${(distanceFt(de, c.pos) * 0.3).toLocaleString('pt-BR')} m dali.`);
    }
    return true;
  },

  /**
   * OSSOS DA TERRA: até seis pilares de pedra (as dobras do Ctrl+clique e a casa clicada) nascem do chão e ficam: cada um é
   * uma casa de rocha, que barra o passo e a vista.
   */
  ossosDaTerra(enc, actor, spell, { point, escalas }) {
    const fl = enc.field;
    const pontos = pontosDosOssos(point, escalas);
    let n = 0;
    for (const p of pontos) {
      if (!fl.inside(p.x, p.y) || fl.blocksMove(p.x, p.y) || enc.at(p.x, p.y)) continue;
      const i = p.y * fl.w + p.x;
      fl.tiles[i] = 1;
      fl.surfaces[i] = SUPERFICIES.indexOf('rocha');
      n += 1;
    }
    fl.versao = (fl.versao ?? 0) + 1;
    enc.say('magia', `${n === 1 ? 'Um pilar de pedra rompe' : `${n} pilares de pedra rompem`} o chão e sobem 9 m.`);
    enc.onEvent({ type: 'tunel', actor, casas: n });
    return true;
  },

  /**
   * INVOCAR DEMÔNIOS MENORES: um d6 decide quantos (dois de ND 1, quatro de ND 1/2 ou oito de ND 1/4; o dobro no 6º círculo,
   * o triplo no 8º). Eles são HOSTIS A TODOS: correm atrás de quem não é demônio, de qualquer lado, quem conjurou incluído.
   */
  demoniosMenores(enc, actor, spell, { point, acima = 0 }) {
    const d = enc.rng.die(6);
    const [id, qtos] = d <= 2 ? ['quasit', 2] : d <= 4 ? ['dretch', 4] : ['manes', 8];
    const mult = acima >= 4 ? 3 : acima >= 2 ? 2 : 1;
    enc.dropConcentration(actor);
    const vieram = [];
    for (let i = 0; i < qtos * mult; i++) {
      const m = enc.invocar(actor, id, point ?? actor.pos, { spellId: spell.id, sufixo: String(i + 1) });
      if (!m) break;
      tornarHostilATodos(m);
      vieram.push(m);
    }
    actor.concentrating = { spellId: spell.id, condition: null, targets: [], rounds: spell.duracaoRodadas ?? 600 };
    enc.say('magia', `O sangue no chão se abre (d6 = ${d}): ${vieram.length} ${vieram[0]?.name.replace(/\s*\d+$/, '') ?? 'demônios'} saem, famintos de qualquer um que não seja demônio.`);
    return true;
  },

  /**
   * INVOCAR DEMÔNIO MAIOR: o demônio mais forte que o círculo deixa (ND 5 no 4º, mais 1 por círculo acima) obedece, até
   * passar no Carisma do fim de um turno dele (`fimDoTurnoDoDemonio`): aí vira hostil a todos, como os menores.
   */
  demonioMaior(enc, actor, spell, { point, acima = 0, dc }) {
    const teto = 5 + acima;
    const id = DEMONIOS_MAIORES.filter(([, cr]) => cr <= teto).pop()?.[0] ?? 'barlgura';
    enc.dropConcentration(actor);
    const m = enc.invocar(actor, id, point ?? actor.pos, { spellId: spell.id });
    if (!m) { enc.say('aviso', 'Não há onde o demônio caiba.'); return false; }
    m.invocado.demonioMaior = { cd: dc };
    actor.concentrating = { spellId: spell.id, condition: null, targets: [], rounds: spell.duracaoRodadas ?? 600 };
    enc.say('magia', `${m.name} atravessa o portal de sangue e espera a ordem de ${actor.name}.`);
    return true;
  },

  /**
   * IRA DA NATUREZA: o quadrado de 18 m vira mata viva por um minuto (`concentrating.area`). No começo de cada turno de quem
   * conjurou, as árvores do mapa açoitam os inimigos a 3 m delas (Destreza ou 4d6 cortante); no fim, as raízes prendem um
   * inimigo no chão (Força, `contido` com a CD de escape); e a ação bônus Pedra da Fúria (`magias-concedidas.js`) atira uma
   * pedra solta.
   */
  iraDaNatureza(enc, actor, spell, { point, slot, dc }) {
    const casas = enc.areaDaMagia(actor, spell, point, slot) ?? [];
    if (!casas.length) return false;
    enc.dropConcentration(actor);
    const zona = enc.criarZona(actor, IRA_DA_NATUREZA, casas, dc, { centro: point });
    // as ÁRVORES da área: a casa de árvore barra o passo e não entra na área da magia, então conta a que encosta nela
    const area = new Set(casas.map((t) => key(t.x, t.y)));
    const arvores = casasDeArvore(enc.field).filter((a) => casas.some((t) => Math.abs(t.x - a.x) <= 1 && Math.abs(t.y - a.y) <= 1));
    actor.concentrating = { spellId: spell.id, condition: 'contido', targets: [], rounds: spell.duracaoRodadas ?? 10, zona, ira: true, area, arvores, cd: dc };
    enc.say('magia', `O chão em volta se ergue: raízes, galhos e pedras obedecem a ${actor.name}.`);
    return true;
  },
  /** A PEDRA DA IRA: ataque de magia à distância, 3d8 de concussão, e Força ou cai no chão. */
  pedraDaIra(enc, actor, spell, { target, dc }) {
    if (!target || !alvoDoLivro(enc, actor, spell, target)?.ok) return false;
    const cd = actor.concentrating?.cd ?? dc;
    const causado = enc.ataqueMagico(actor, target, spell, '3d8', cd, { slot: 0 });
    if (causado > 0 && vivo(target)) {
      const sv = enc.resistencia(target, 'str', cd, { contra: { magico: true, condicao: 'caido' } });
      const r = enc.explicarResistencia(target, 'str', cd, sv, { contra: 'a pedra', seSucesso: 'fica de pé' });
      if (!sv.success) { enc.aplicarCondicao(target, 'caido', { source: actor.id }); enc.say('condicao', `${target.name} vai ao chão com a pedrada.`, r.conta, { rolagem: r }); }
    }
    return true;
  },

  // ======================================================== as quatro que sobravam nas filas de magia (2026-11-16)
  /** APRIMORAR PERÍCIA: a criatura tocada ganha especialização numa perícia em que é treinada (a opção), por uma hora. */
  aprimorarPericia(enc, actor, spell, { target, opcao }) {
    if (!target || !alvoDoLivro(enc, actor, spell, target, opcao)?.ok) return false;
    enc.dropConcentration(actor);
    addCondition(target, 'periciaAprimorada', { rounds: spell.duracaoRodadas ?? 600, source: actor.id, data: { pericia: opcao } });
    actor.concentrating = { spellId: spell.id, condition: 'periciaAprimorada', targets: [target], rounds: spell.duracaoRodadas ?? 600 };
    enc.say('magia', `${target.name} entende de repente o próprio talento: especialização em ${NOME_DA_PERICIA[opcao] ?? opcao}.`);
    return true;
  },

  /**
   * CONTROLAR VENTOS: o cubo de 30 m (o quadrado mirado) com um dos três modos (`zona.vento`): as RAJADAS e a corrente
   * DESCENDENTE dão desvantagem ao ataque de arma à distância que passa pelo cubo ou mira quem está nele (`ventoNoCaminho`);
   * a descendente derruba quem voa (`ventoNoVoador`); a ASCENDENTE corta à metade o dano de queda de quem cai dentro dele.
   * A ação Mudar o Vento troca o modo ou o para.
   */
  controlarVentos(enc, actor, spell, { point, slot, dc, opcao }) {
    const casas = enc.areaDaMagia(actor, spell, point, slot) ?? [];
    if (!casas.length) return false;
    enc.dropConcentration(actor);
    const zona = enc.criarZona(actor, VENTOS, casas, dc, { centro: point });
    zona.vento = { modo: opcao ?? 'rajadas', cd: dc, parado: false };
    actor.concentrating = { spellId: spell.id, condition: null, targets: [], rounds: spell.duracaoRodadas ?? 600, zona, ventos: true };
    enc.say('magia', `${actor.name} toma o ar do lugar: ${MODOS_DO_VENTO[zona.vento.modo]}.`);
    return true;
  },
  /** MUDAR O VENTO (a ação que a Controlar Ventos dá): outro modo, ou parar, ou recomeçar. */
  mudarOVento(enc, actor, spell, { opcao }) {
    const z = actor.concentrating?.ventos ? actor.concentrating.zona : null;
    if (!z?.vento) return false;
    if (opcao === 'parar') z.vento.parado = !z.vento.parado;
    else { z.vento.modo = opcao; z.vento.parado = false; }
    enc.say('magia', z.vento.parado ? `${actor.name} acalma o vento.` : `${actor.name} vira o vento: ${MODOS_DO_VENTO[z.vento.modo]}.`);
    return true;
  },

  /** GAIOLA DE ALMAS, as duas ações que a alma presa dá: Roubar Vida (2d8 PV) e Emprestar Experiência (vantagem na próxima jogada). */
  roubarVidaDaAlma(enc, actor) {
    if (!gastarAlma(actor)) return false;
    const x = damageRoll(enc.rng, '2d8');
    const curou = enc.heal(actor, x.total, actor);
    enc.say('cura', `${actor.name} suga a alma presa na gaiola: +${curou} PV.`, `2d8[${x.rolls.join('+')}]`);
    return true;
  },
  experienciaDaAlma(enc, actor) {
    if (!gastarAlma(actor)) return false;
    addCondition(actor, 'experienciaEmprestada', { rounds: 1, quando: 'inicio', lado: actor.side, source: actor.id });
    enc.say('magia', `${actor.name} toma emprestado o que a alma presa sabia: vantagem na próxima jogada.`);
    return true;
  },

  // ======================================================== os itens do Livro do Mestre (2026-11-16)
  /** A BOLSA DE TRUQUES: a bolinha jogada a até 6 m vira a fera do d8 da cor da bolsa, que luta do lado de quem a jogou. */
  bolsaDeTruques(enc, actor, spell, { point }) {
    const d = enc.rng.die(8);
    const id = spell.tabela?.[d - 1];
    if (!id) return false;
    const m = enc.invocar(actor, id, point ?? actor.pos, { spellId: spell.id });
    if (!m) { enc.say('aviso', 'A bolinha cai, mas não há onde a fera caiba.'); return false; }
    enc.say('magia', `${actor.name} tira uma bolinha de pelo da bolsa e a joga (d8 = ${d}): ela vira ${m.name}.`);
    return true;
  },
  /** O VASO DE ELEMENTAL (a tigela, o braseiro, o incensário): o elemental como o da Conjurar Elemental; se a concentração cair, ele fica, hostil a todos. */
  elementalDoVaso(enc, actor, spell, { point }) {
    enc.dropConcentration(actor);
    const m = enc.invocar(actor, spell.defId, point ?? actor.pos, { spellId: spell.id });
    if (!m) { enc.say('aviso', 'Não há onde o elemental caiba.'); return false; }
    m.invocado.ficaHostil = !spell.naoFicaHostil;
    actor.concentrating = { spellId: spell.id, condition: null, targets: [], rounds: spell.duracaoRodadas ?? 600 };
    enc.say('magia', `${actor.name} diz a palavra de comando, e ${m.name} ${spell.naoFicaHostil ? 'sai do anel' : 'se ergue'} para obedecer.`);
    return true;
  },
  /** O MANTO DA INVISIBILIDADE: o capuz erguido deixa invisível até ser baixado (atacar não o desfaz). */
  capuzDoManto(enc, actor, spell) {
    addCondition(actor, 'invisivel', { rounds: spell.duracaoRodadas ?? 1200, source: actor.id, data: { persistente: true, doManto: true } });
    addCondition(actor, 'capuzErguido', { rounds: spell.duracaoRodadas ?? 1200, source: actor.id });
    enc.say('magia', `${actor.name} ergue o capuz do manto e some.`);
    return true;
  },
  baixarOCapuz(enc, actor) {
    removeCondition(actor, 'capuzErguido');
    if (getCondition(actor, 'invisivel')?.data?.doManto) removeCondition(actor, 'invisivel');
    enc.say('magia', `${actor.name} baixa o capuz e reaparece.`);
    return true;
  },
  /** O GLOBO FLUTUANTE: a luz da magia Luz, que acompanha quem o leva; de novo, apaga. */
  luzDoGlobo(enc, actor) {
    if (getCondition(actor, 'luzMagica')?.data?.doGlobo) { removeCondition(actor, 'luzMagica'); enc.say('magia', `O globo de ${actor.name} se apaga.`); return true; }
    addCondition(actor, 'luzMagica', { rounds: 600, source: actor.id, data: { doGlobo: true } });
    enc.say('magia', `O globo sobe e flutua junto de ${actor.name}, aceso.`);
    return true;
  },
  /** O BASTÃO DE TENTÁCULOS: três golpes (+9, alcance de 4,5 m, 1d6 de concussão cada); os três acertando, Constituição CD 15 ou preso nos tentáculos. */
  tentaculosDoBastao(enc, actor, spell, { target }, { attackRoll }) {
    if (!vivo(target) || distanceFt(actor.pos, target.pos) > 15) return false;
    let acertos = 0;
    for (let i = 0; i < 3 && vivo(target); i++) {
      const mods = enc.attackModifiers(actor, target, { ranged: false });
      const ca = caEfetiva(target);
      const atk = attackRoll(enc.rng, 9, ca, mods);
      if (!atk.hit) { enc.say('ataque', `Um tentáculo erra ${target.name}.`, `d20[${atk.rolls.join('/')}] + 9 = ${atk.total} vs CA ${ca}`); continue; }
      acertos += 1;
      const d = damageRoll(enc.rng, '1d6', { critical: atk.critical });
      enc.say('ataque', `Um tentáculo acerta ${target.name}: ${d.total} de concussão.`, `d20[${atk.rolls.join('/')}] + 9 = ${atk.total} vs CA ${ca} · 1d6[${d.rolls.join('+')}]`);
      enc.applyDamage(target, d.total, 'concussão', actor, { magico: true, deAtaque: true, critical: atk.critical });
    }
    if (acertos === 3 && vivo(target)) {
      const sv = enc.resistencia(target, 'con', 15, { contra: { magico: true } });
      const r = enc.explicarResistencia(target, 'con', 15, sv, { contra: 'os três tentáculos', seSucesso: 'se solta' });
      if (!sv.success) {
        enc.aplicarCondicao(target, 'apertadoPeloBastao', { rounds: 10, source: actor.id, data: { repete: true, save: 'con', dc: 15 } });
        enc.say('condicao', `Os três tentáculos apertam ${target.name}: mais lento, sem reações e só a ação ou a ação bônus.`, r.conta, { rolagem: r });
      }
    }
    return true;
  },

  /**
   * A GARRAFA DO EFREETI: o d100 do livro. 1-10, o efreeti ataca quem o soltou (do lado inimigo) e a garrafa perde a magia;
   * 11-90, ele serve por uma hora e volta à garrafa; 91-100, ele concede três desejos (o Desejo do jogo, sem o desgaste,
   * pela ação Pedir um Desejo) e some.
   */
  garrafaDoEfreeti(enc, actor, spell, { point }) {
    const d = enc.rng.die(100);
    if (d >= 91) {
      addCondition(actor, 'tresDesejos', { rounds: Infinity, source: actor.id, data: { restam: 3 } });
      enc.say('magia', `${actor.name} tira a rolha (d100 = ${d}): o efreeti sai da fumaça e concede três desejos.`);
      return true;
    }
    const m = enc.invocar(actor, 'efreeti', point ?? actor.pos, { spellId: spell.id });
    if (!m) { enc.say('aviso', 'A fumaça sai, mas não há onde o efreeti caiba.'); return false; }
    if (d <= 10) {
      m.side = actor.side === 'party' ? 'foes' : 'party';
      delete m.invocado;
      actor.garrafaSemMagia = true;
      enc.say('magia', `${actor.name} tira a rolha (d100 = ${d}): o efreeti sai furioso por séculos de prisão e ataca. A garrafa perde a magia.`);
      enc.checkEnd?.();
      return true;
    }
    m.invocado.rodadas = spell.duracaoRodadas ?? 600;
    enc.say('magia', `${actor.name} tira a rolha (d100 = ${d}): o efreeti sai da fumaça e serve por uma hora.`);
    return true;
  },

  /** O FRASCO DE FERRO: a criatura de outro plano a até 18 m faz Sabedoria CD 17 ou vai para dentro do frasco. */
  prenderNoFrasco(enc, actor, spell, { target }) {
    if (!target || !alvoDoLivro(enc, actor, spell, target)?.ok) return false;
    const sv = enc.resistencia(target, 'wis', 17, { contra: { magico: true } });
    const r = enc.explicarResistencia(target, 'wis', 17, sv, { contra: 'o frasco de ferro', seSucesso: 'resiste à sucção' });
    if (sv.success) { enc.say('magia', `${target.name} resiste ao frasco de ferro.`, r.conta, { rolagem: r }); return true; }
    actor.frascoDeFerro = { defId: target.defId, name: target.name, hp: target.hp };
    addCondition(target, 'presoNoFrasco', { rounds: Infinity, source: actor.id });
    target.naoSeguraALuta = true;
    enc.say('magia', `${target.name} é sugado para dentro do frasco de ferro de ${actor.name}.`, r.conta, { rolagem: r });
    enc.checkEnd?.();
    return true;
  },
  /** SOLTAR DO FRASCO: a criatura presa sai na casa mirada e obedece por uma hora. */
  soltarDoFrasco(enc, actor, spell, { point }) {
    const f = actor.frascoDeFerro;
    if (!f) return false;
    for (const c of enc.combatants.filter((x) => getCondition(x, 'presoNoFrasco')?.source === actor.id)) enc.combatants = enc.combatants.filter((x) => x !== c);
    const m = enc.invocar(actor, f.defId, point ?? actor.pos, { spellId: spell.id });
    if (!m) { enc.say('aviso', 'Não há onde a criatura caiba.'); return false; }
    m.hp = Math.min(m.maxHp, f.hp ?? m.maxHp);
    m.invocado.rodadas = 600;
    actor.frascoDeFerro = null;
    enc.say('magia', `${actor.name} abre o frasco de ferro: ${m.name} sai e obedece por uma hora.`);
    return true;
  },

  /** A CONTA DE FORÇA: jogada a até 18 m; quem está a 3 m faz Destreza CD 15, e quem falha sofre 5d4 de energia e fica preso na esfera por 1 minuto. */
  contaDeForca(enc, actor, spell, { point }) {
    const casas = enc.areaDaMagia(actor, spell, point) ?? [];
    const k = new Set(casas.map((t) => key(t.x, t.y)));
    const pegos = enc.combatants.filter((c) => vivo(c) && c.pos && k.has(key(c.pos.x, c.pos.y)) && !conditionEffects(c).inalcancavel);
    enc.say('magia', `${actor.name} joga a conta de força, que estoura num brilho.`);
    for (const c of pegos) {
      const sv = enc.resistencia(c, 'dex', 15, { contra: { magico: true, tipoDano: 'energético' } });
      const r = enc.explicarResistencia(c, 'dex', 15, sv, { contra: 'a conta de força', seSucesso: 'pula para fora' });
      if (sv.success) { enc.say('magia', `${c.name} pula para fora da esfera.`, r.conta, { rolagem: r }); continue; }
      const x = damageRoll(enc.rng, '5d4');
      enc.applyDamage(c, x.total, 'energético', actor, { magico: true });
      if (vivo(c)) enc.aplicarCondicao(c, 'presoNaEsferaDeForca', { rounds: 10, quando: 'fim', lado: actor.side, source: actor.id });
      enc.say('condicao', `${c.name} sofre ${x.total} de energia e fica preso na esfera de força.`, `${r.conta} · 5d4[${x.rolls.join('+')}]`, { rolagem: r });
    }
    return true;
  },

  /** A GARRAFA DA FUMAÇA ETERNA: aberta, a nuvem de 18 m (escuridão pesada) cresce 3 m por minuto até 36 m; de novo, fecha. */
  garrafaDaFumaca(enc, actor, spell) {
    const aberta = (enc.zonas ?? []).find((z) => z.fumacaEterna?.dono === actor.id && z.fumacaEterna.aberta);
    if (aberta) {
      aberta.fumacaEterna.aberta = false;
      aberta.rodadas = Math.min(aberta.rodadas ?? 100, 100);
      enc.say('magia', `${actor.name} tampa a garrafa: a fumaça para de crescer e vai se desfazer em 10 minutos.`);
      return true;
    }
    const centro = { x: actor.pos.x, y: actor.pos.y };
    const zona = enc.criarZona(actor, FUMACA_ETERNA, enc.areaDaMagia(actor, { shape: 'sphere', areaFt: 60, level: 0, centradoEmSi: true }, centro) ?? [], 0, { centro });
    zona.fumacaEterna = { dono: actor.id, aberta: true, raio: 60, desde: enc.round };
    enc.say('magia', `${actor.name} tira a rolha, e uma fumaça grossa enche 18 m em volta.`);
    return true;
  },

  /**
   * O CUBO DE FORÇA: a face apertada (a opção) liga uma barreira invisível de 4,5 m em volta de quem o usa, que anda com ele,
   * por 1 minuto, gastando as cargas da face; a sexta desliga. 1 gases; 2 matéria sem vida (o projétil); 3 matéria viva (a
   * criatura e o golpe de perto); 4 magia; 5 nada passa (`cuboBloqueia`).
   */
  cuboDeForca(enc, actor, spell, { opcao }) {
    const face = Number(opcao ?? 5);
    const atual = (enc.zonas ?? []).find((z) => z.cubo?.dono === actor.id);
    if (face === 6) {
      if (atual) enc.desfazerZona(atual);
      enc.say('magia', `${actor.name} aperta a sexta face: a barreira do cubo se desliga.`);
      return true;
    }
    if (!gastarCargaDoItem(actor, 'cuboDeForca', FACES_DO_CUBO[face].custo)) { enc.say('aviso', 'O cubo não tem cargas para essa face: nada acontece.'); return true; }
    if (atual) enc.desfazerZona(atual);
    const zona = enc.criarZona(actor, CUBO, casasDaBarreira(enc, actor), 0, { centro: actor.pos });
    const dentro = enc.combatants.filter((o) => vivo(o) && o.pos && o !== actor && enc.pegadaEmZona(zona, o.pos.x, o.pos.y, o.pos.f ?? 1)).map((o) => o.id);
    zona.cubo = { dono: actor.id, face, dentro: new Set(dentro) };
    enc.say('magia', `${actor.name} aperta a face ${face} do cubo: ${FACES_DO_CUBO[face].texto}.`);
    return true;
  },

  /** A ESFERA DA ANIQUILAÇÃO, solta do item numa casa ao lado: ela fica parada, e quem a toca sofre 4d10 de energia (Destreza CD 13). */
  soltarAEsfera(enc, actor, spell, { point }) {
    const zona = enc.criarZona(actor, ESFERA, [{ x: point.x, y: point.y }], 13, { centro: point });
    zona.esferaDaAniquilacao = { solta: actor.id };
    enc.say('magia', `${actor.name} solta a esfera negra, que fica parada no ar.`);
    return true;
  },
  /**
   * CONTROLAR A ESFERA: Inteligência (Arcanismo) CD 25 (o talismã dobra a proficiência); passando, a esfera vai até a casa
   * mirada, a até 5 × o modificador de Inteligência (mínimo 1,5 m); falhando, ela anda 3 m para quem tentou. Quem estiver no
   * caminho faz Destreza CD 13 ou sofre 4d10 de energia.
   */
  controlarAEsfera(enc, actor, spell, { point }, { skillBonus }) {
    const z = esferaPerto(enc, actor);
    if (!z || !point) return false;
    const talisma = temOTalisma(actor);
    const bonus = skillBonus(actor, 'arcanismo') + (talisma && (actor.skills ?? []).includes('arcanismo') ? 2 + Math.floor(((actor.level ?? 1) - 1) / 4) : 0);
    const t = enc.testeDeAtributo(actor, 'int', bonus, 'Arcanismo', { pericia: 'arcanismo' });
    const de = esferaPos(z);
    const intMod = Math.floor(((actor.abilities?.int ?? 10) - 10) / 2);
    const alcance = Math.max(5, 5 * intMod);
    let para;
    if (t.total >= 25) {
      para = passosAte(de, point, Math.floor(alcance / 5));
      enc.say('magia', `${actor.name} doma a esfera (${t.total} contra 25)${talisma ? ', com o talismã' : ''} e a move.`);
    } else {
      para = passosAte(de, actor.pos, 2);
      enc.say('magia', `A esfera escapa de ${actor.name} (${t.total} contra 25) e desliza 3 m na direção dele.`);
    }
    moverEsfera(enc, z, de, para);
    return true;
  },

  /** A MENTE MANIFESTA (Escribas): pôr a mente espectral na casa, ou movê-la. Ela é uma luz fraca no tabuleiro. */
  menteManifesta(enc, actor, spell, { point }) {
    if (!point) return false;
    if (!actor.menteManifesta) actor.resources.invocarMente -= 1;
    actor.menteManifesta = { x: point.x, y: point.y };
    enc.luzesDeMagia = (enc.luzesDeMagia ?? []).filter((l) => l.menteDe !== actor.id);
    enc.luzesDeMagia.push({ pos: { x: point.x, y: point.y }, claro: 0, penumbra: 10, tipo: 'magica', cor: '#9fd6ff', menteDe: actor.id, spellId: spell.id });
    enc.say('magia', `O espírito do grimório de ${actor.name} paira na casa ${point.x},${point.y}, uma mente espectral que vê e ouve por ele.`);
    return true;
  },

  /** O MOVIMENTO TELECINÉTICO (Guerreiro Psiônico): a criatura marcada (o primeiro ponto) vai até a casa clicada. */
  movimentoTelecinetico(enc, actor, spell, { point, escalas }) {
    const alvo = escalas?.[0] ? enc.at(escalas[0].x, escalas[0].y) : null;
    if (!alvo || !point) return false;
    if ((actor.resources?.telekineticMovement ?? 0) > 0) actor.resources.telekineticMovement -= 1;
    else if ((actor.resources?.psionicEnergy ?? 0) > 0) actor.resources.psionicEnergy -= 1;
    const de = { ...alvo.pos };
    alvo.pos = { x: point.x, y: point.y, f: alvo.pos.f ?? 1 };
    enc.onEvent({ type: 'teleport', actor: alvo, from: de, to: { ...alvo.pos } });
    enc.say('movimento', `${actor.name} ergue ${alvo.name} com a mente e o põe a ${(distanceFt(de, point) * 0.3).toLocaleString('pt-BR')} m dali.`);
    return true;
  },
};

// ------------------------------------------------------------------------- o tabuleiro das seis magias ----
const PASSOS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * A casa é parede ou rocha que a Criar Passagem atravessa (madeira, gesso ou pedra)? Só a casa de PAREDE (o tipo 1): o móvel e o
 * pedregulho, que só barram o passo, não são parede; e a árvore viva e o pano da tenda não são madeira de parede nem pedra.
 */
function solidoDaPassagem(fl, x, y) {
  if (!fl.inside(x, y) || fl.murosDeMagia?.has(key(x, y))) return false;
  return fl.tileAt(x, y) === 1 && !['arvore', 'tenda'].includes(fl.surfaceAt(x, y));
}

/**
 * O que a Criar Passagem abre a partir da casa mirada: a direção é a de quem conjura até ela (o eixo maior), a primeira
 * parede é a da casa mirada (se ela for rocha) ou a aresta logo depois dela, e a passagem segue até 6 m de pedra (quatro
 * casas) ou até sair do outro lado. Devolve `{ arestas, casas, dir }`, ou null se não houver parede para abrir.
 */
export function passagemDaMagia(enc, actor, point) {
  const fl = enc.field;
  if (!point || !actor?.pos || !fl.inside(point.x, point.y)) return null;
  const dx = point.x - actor.pos.x;
  const dy = point.y - actor.pos.y;
  if (!dx && !dy) return null;
  const dir = Math.abs(dx) >= Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
  let cur = solidoDaPassagem(fl, point.x, point.y) ? { x: point.x - dir.x, y: point.y - dir.y } : { x: point.x, y: point.y };
  if (!fl.inside(cur.x, cur.y) || solidoDaPassagem(fl, cur.x, cur.y)) return null;
  const arestas = [];
  const casas = [];
  for (let passo = 0; passo < 12; passo++) {
    const nx = cur.x + dir.x;
    const ny = cur.y + dir.y;
    if (!fl.inside(nx, ny)) break;
    const cod = fl.aresta(cur.x, cur.y, nx, ny);
    const parede = cod === ARESTA.parede || cod === ARESTA.seteira;
    const rocha = solidoDaPassagem(fl, nx, ny);
    if (!parede && !rocha) break;
    if (rocha && casas.length >= 4) break;
    if (parede) arestas.push({ a: { ...cur }, b: { x: nx, y: ny } });
    if (!rocha) break;
    casas.push({ x: nx, y: ny });
    cur = { x: nx, y: ny };
  }
  if (!arestas.length && !casas.length) return null;
  return { arestas, casas, dir };
}

/** A chave da aresta entre duas casas vizinhas no eixo, a mesma de `game/portas.js chaveDaAresta`. */
const chaveDaArestaDaPorta = (a, b) => (a.x === b.x ? `${a.x},${Math.max(a.y, b.y)},N` : `${Math.max(a.x, b.x)},${a.y},O`);

/** A porta FECHADA que quem conjura toca a partir da casa mirada (a dele, ou a do outro lado da porta). */
export function portaDaTranca(enc, actor, point) {
  const fl = enc.field;
  if (!point || !actor?.pos) return null;
  let melhor = null;
  for (const [dx, dy] of PASSOS) {
    const b = { x: point.x + dx, y: point.y + dy };
    if (!fl.inside(b.x, b.y) || fl.aresta(point.x, point.y, b.x, b.y) !== ARESTA.porta) continue;
    const d = Math.min(distanceFt(actor.pos, point), distanceFt(actor.pos, b));
    if (d > 5) continue;
    if (!melhor || d < melhor.d) melhor = { a: { ...point }, b, d, chave: chaveDaArestaDaPorta(point, b) };
  }
  return melhor;
}

/**
 * Tranca a porta por magia (`field.trancas`, o mesmo dado das portas do mapa): a CD de abrir a fechadura e a de arrombar
 * sobem 10. A porta sem fechadura não se abre com ferramenta nenhuma (`semFechadura`); arrombá-la é Força 15 + 10.
 */
export function trancarComMagia(field, chave, actor) {
  const t = (field.trancas ??= new Map());
  const antiga = t.get(chave);
  if (antiga?.arcana) return antiga;
  const nova = antiga
    ? { ...antiga, cd: (antiga.cd ?? 15) + 10, forca: (antiga.forca ?? (antiga.cd ?? 15) + 5) + 10 }
    : { cd: 25, forca: 25, semFechadura: true };
  nova.arcana = { lado: actor.side, dono: actor.id, nome: actor.name };
  t.set(chave, nova);
  field.versao = (field.versao ?? 0) + 1;
  return nova;
}

const casaLivreDoPortal = (enc, x, y) => enc.field.inside(x, y) && !enc.field.blocksMove(x, y) && !enc.at(x, y)
  && !enc.field.regioes?.some((r) => r.portalArcano && r.casas.has(key(x, y)));

/** A casa livre a até 3 m de quem conjura onde nasce o primeiro anel: a mais perto dele, e entre iguais a mais perto do outro. */
export function casaDoPortalPerto(enc, actor, point) {
  let melhor = null;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const x = actor.pos.x + dx;
    const y = actor.pos.y + dy;
    if ((!dx && !dy) || distanceFt(actor.pos, { x, y }) > 10 || !casaLivreDoPortal(enc, x, y)) continue;
    if (point && x === point.x && y === point.y) continue;
    const nota = [distanceFt(actor.pos, { x, y }), point ? distanceFt({ x, y }, point) : 0];
    if (!melhor || nota[0] < melhor.nota[0] || (nota[0] === melhor.nota[0] && nota[1] < melhor.nota[1])) melhor = { x, y, nota };
  }
  return melhor ? { x: melhor.x, y: melhor.y } : null;
}

/** Abre os dois anéis como REGIÕES de teleporte (`rules/regioes.js`), uma em cada casa, e devolve o registro do portal. */
function abrirPortais(enc, actor, a, b) {
  const n = (enc.portaisAbertos = (enc.portaisAbertos ?? 0) + 1);
  const ids = [`portalArcano-${n}-a`, `portalArcano-${n}-b`];
  const regiao = (id, de, para) => ({
    id, nome: 'Portal Arcano', portalArcano: true, discreta: true, pegaQuemVoa: true,
    casas: new Set([key(de.x, de.y)]), quando: ['entrar'], efeitos: [{ tipo: 'teleporte', x: para.x, y: para.y }],
    disparos: 0, desligada: false, descoberta: true,
  });
  (enc.field.regioes ??= []).push(regiao(ids[0], a, b), regiao(ids[1], b, a));
  const portal = { ids, casas: [{ x: a.x, y: a.y }, { x: b.x, y: b.y }], dono: actor.id };
  (enc.portais ??= []).push(portal);
  return portal;
}

/** A concentração acabou: os anéis se fecham. */
export function fecharPortal(enc, portal) {
  if (!portal) return;
  enc.field.regioes = (enc.field.regioes ?? []).filter((r) => !portal.ids.includes(r.id));
  enc.portais = (enc.portais ?? []).filter((p) => p !== portal);
  enc.say('magia', 'Os anéis do Portal Arcano se apagam.');
}

/** As casas de árvore viva do mapa (o glifo `T`). */
export function casasDeArvore(fl) {
  const out = [];
  for (let y = 0; y < fl.h; y++) for (let x = 0; x < fl.w; x++) if (fl.surfaceAt(x, y) === 'arvore' && (fl.tileAt(x, y) === 1 || fl.tileAt(x, y) === 3)) out.push({ x, y });
  return out;
}
/** A árvore encostada na casa `pos` (a 1,5 m), ou null. */
export function arvoreAoLado(fl, pos) {
  if (!pos) return null;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy) continue;
    const x = pos.x + dx;
    const y = pos.y + dy;
    if (fl.inside(x, y) && fl.surfaceAt(x, y) === 'arvore' && (fl.tileAt(x, y) === 1 || fl.tileAt(x, y) === 3)) return { x, y };
  }
  return null;
}

/** Os efeitos cuja casa mirada `casaDoLivro` confere por inteiro (alcance e vista inclusive): o `canCast` não refaz a conta. */
export const CASA_PROPRIA = new Set(['criarPassagem', 'trancaArcana', 'portalArcano', 'atravessarArvore', 'moedaBrilhante', 'voltarDoEtereo', 'ossosDaTerra', 'soltarDoFrasco', 'garrafaDoEfreeti', 'soltarAEsfera', 'controlarAEsfera', 'movimentoTelecinetico', 'menteManifesta']);

/** A OPÇÃO que custa (a face do cubo de força): o item tem as cargas dela? `null` = a magia não tem essa regra. */
export function opcaoDoLivro(enc, actor, spell, opcao) {
  if (spell?.efeito !== 'cuboDeForca') return null;
  const custo = CUSTO_DA_FACE(opcao ?? 5);
  return cargasDe(actor, 'cuboDeForca') >= custo ? { ok: true } : { ok: false, why: `a face ${opcao ?? 5} pede ${custo} cargas` };
}

/**
 * A CASA MIRADA das seis magias serve? `null` quando a magia não é delas (as outras de `mira: 'casa'` têm a sua conta).
 * Roda no `canCast`, antes de gastar qualquer coisa.
 */
export function casaDoLivro(enc, actor, spell, point, escalas = null) {
  const fl = enc.field;
  const dentro = (p) => p && fl.inside(p.x, p.y);
  switch (spell?.efeito) {
    case 'criarPassagem': {
      if (!dentro(point)) return { ok: false, why: 'clique na parede a abrir' };
      if (distanceFt(actor.pos, point) > (spell.rangeFt ?? 30)) return { ok: false, why: 'fora de alcance' };
      const p = passagemDaMagia(enc, actor, point);
      if (!p) return { ok: false, why: 'não há parede de madeira ou pedra ali' };
      const face = p.arestas[0]?.a ?? { x: p.casas[0].x - p.dir.x, y: p.casas[0].y - p.dir.y };
      if (!fl.hasLineOfSight(actor.pos, face)) return { ok: false, why: 'não se vê essa parede daqui' };
      return { ok: true };
    }
    case 'trancaArcana': {
      if (!dentro(point)) return { ok: false, why: 'clique na porta a trancar' };
      const porta = portaDaTranca(enc, actor, point);
      if (!porta) return { ok: false, why: 'precisa tocar uma porta fechada' };
      if (fl.trancas?.get(porta.chave)?.arcana) return { ok: false, why: 'esta porta já tem a Tranca Arcana' };
      return { ok: true };
    }
    case 'portalArcano': {
      if (!dentro(point)) return { ok: false, why: 'clique onde abrir o segundo portal' };
      if (distanceFt(actor.pos, point) > (spell.rangeFt ?? 500)) return { ok: false, why: 'fora de alcance' };
      if (!casaLivreDoPortal(enc, point.x, point.y)) return { ok: false, why: 'a casa do portal tem de estar livre' };
      if (!fl.hasLineOfSight(actor.pos, point)) return { ok: false, why: 'sem linha de visão até a casa' };
      if (!casaDoPortalPerto(enc, actor, point)) return { ok: false, why: 'não há casa livre a até 3 m para o primeiro portal' };
      return { ok: true };
    }
    case 'atravessarArvore': {
      if (actor.arvoreNaRodada === enc.round) return { ok: false, why: 'só uma travessia por rodada' };
      if ((actor.movementLeftFt ?? 0) < 5) return { ok: false, why: 'sem deslocamento para entrar na árvore' };
      const de = arvoreAoLado(fl, actor.pos);
      if (!de) return { ok: false, why: 'precisa estar encostado numa árvore' };
      if (!dentro(point)) return { ok: false, why: 'clique ao lado da árvore de chegada' };
      if (fl.blocksMove(point.x, point.y) || enc.at(point.x, point.y)) return { ok: false, why: 'a casa de chegada tem de estar livre' };
      const para = arvoreAoLado(fl, point);
      if (!para || (para.x === de.x && para.y === de.y && distanceFt(actor.pos, point) <= 5)) return { ok: false, why: 'a chegada tem de ser ao lado de outra árvore' };
      if (distanceFt(de, para) > 500) return { ok: false, why: 'a outra árvore fica a mais de 150 m' };
      return { ok: true };
    }
    case 'voltarDoEtereo': {
      const eter = getCondition(actor, 'etereo');
      if (!eter?.data?.formaEterea) return { ok: false, why: 'só quem está no Plano Etéreo pela Forma Etérea' };
      if (!dentro(point)) return { ok: false, why: 'clique na casa onde voltar' };
      const de = eter.data.origem ?? actor.pos;
      if (fl.blocksMove(point.x, point.y) || enc.combatants.some((c) => c !== actor && !c.dead && c.pos?.x === point.x && c.pos?.y === point.y)) return { ok: false, why: 'a casa tem de estar livre' };
      if (distanceFt(de, point) > enc.speedOf(actor)) return { ok: false, why: `longe demais: anda-se até ${enc.speedOf(actor)} pés no etéreo antes de voltar` };
      return { ok: true };
    }
    case 'soltarDoFrasco': {
      if (!actor.frascoDeFerro) return { ok: false, why: 'o frasco está vazio' };
      if (!dentro(point) || fl.blocksMove(point.x, point.y) || enc.at(point.x, point.y)) return { ok: false, why: 'escolha uma casa livre' };
      if (distanceFt(actor.pos, point) > 30) return { ok: false, why: 'a até 9 m' };
      return { ok: true };
    }
    case 'garrafaDoEfreeti':
      if (actor.garrafaSemMagia) return { ok: false, why: 'a garrafa perdeu a magia' };
      return dentro(point) && !fl.blocksMove(point.x, point.y) && !enc.at(point.x, point.y) && distanceFt(actor.pos, point) <= 30 ? { ok: true } : { ok: false, why: 'escolha uma casa livre a até 9 m' };
    case 'soltarAEsfera':
      if ((enc.zonas ?? []).some((z) => z.esferaDaAniquilacao?.solta === actor.id)) return { ok: false, why: 'a esfera já está solta' };
      if (!dentro(point) || fl.blocksMove(point.x, point.y) || enc.at(point.x, point.y) || distanceFt(actor.pos, point) > 5) return { ok: false, why: 'numa casa livre ao lado' };
      return { ok: true };
    case 'controlarAEsfera':
      if (!esferaPerto(enc, actor)) return { ok: false, why: 'nenhuma esfera da aniquilação a até 18 m' };
      if (!dentro(point)) return { ok: false, why: 'clique para onde levá-la' };
      return { ok: true };
    case 'menteManifesta': {
      if (!dentro(point) || fl.blocksMove(point.x, point.y)) return { ok: false, why: 'numa casa livre' };
      if (actor.menteManifesta) {
        if (distanceFt(actor.menteManifesta, point) > 30) return { ok: false, why: 'a mente anda até 9 m' };
        return { ok: true };
      }
      if (!((actor.resources?.invocarMente ?? 0) > 0)) return { ok: false, why: 'a mente já foi posta: volta no descanso longo' };
      if (distanceFt(actor.pos, point) > 60) return { ok: false, why: 'a até 18 m' };
      return { ok: true };
    }
    case 'movimentoTelecinetico': {
      if (!((actor.resources?.telekineticMovement ?? 0) > 0 || (actor.resources?.psionicEnergy ?? 0) > 0)) return { ok: false, why: 'sem uso: volta no descanso curto (ou um dado psiônico)' };
      const alvo = escalas?.[0] ? enc.at(escalas[0].x, escalas[0].y) : null;
      if (!alvo) return { ok: false, why: 'Ctrl+clique primeiro na criatura a mover' };
      if (alvo === actor || alvo.side !== actor.side) return { ok: false, why: 'só uma criatura aliada (voluntária), não você' };
      if (categoriaDeTamanho(alvo) > 3) return { ok: false, why: 'só Grande ou menor' };
      if (distanceFt(actor.pos, alvo.pos) > 30 || !fl.hasLineOfSight(actor.pos, alvo.pos)) return { ok: false, why: 'a criatura tem de estar a até 9 m, à vista' };
      if (!dentro(point) || fl.blocksMove(point.x, point.y) || (enc.at(point.x, point.y) && enc.at(point.x, point.y) !== alvo)) return { ok: false, why: 'a chegada tem de ser uma casa livre' };
      if (distanceFt(alvo.pos, point) > 30 || !fl.hasLineOfSight(actor.pos, point)) return { ok: false, why: 'a até 9 m dela, numa casa que você vê' };
      return { ok: true };
    }
    case 'ossosDaTerra': {
      const pontos = pontosDosOssos(point, escalas);
      if (!pontos.length) return { ok: false, why: 'clique onde nasce o pilar (Ctrl+clique marca até seis)' };
      for (const p of pontos) {
        if (!dentro(p)) return { ok: false, why: 'pilar fora do mapa' };
        if (distanceFt(actor.pos, p) > (spell.rangeFt ?? 120)) return { ok: false, why: 'um pilar fica fora de alcance' };
        if (fl.blocksMove(p.x, p.y)) return { ok: false, why: 'o pilar nasce do chão livre' };
        if (enc.at(p.x, p.y)) return { ok: false, why: 'no jogo o pilar não nasce embaixo de ninguém' };
        if (!fl.hasLineOfSight(actor.pos, p)) return { ok: false, why: 'não se vê o lugar de um pilar' };
      }
      return { ok: true };
    }
    case 'moedaBrilhante': {
      if (!dentro(point)) return { ok: false, why: 'clique onde jogar a moeda' };
      if (distanceFt(actor.pos, point) > (spell.rangeFt ?? 60)) return { ok: false, why: 'fora de alcance' };
      if (fl.blocksMove(point.x, point.y)) return { ok: false, why: 'a moeda tem de cair no chão' };
      if (!fl.hasLineOfSight(actor.pos, point)) return { ok: false, why: 'sem linha de visão até a casa' };
      return { ok: true };
    }
    default: return null;
  }
}

// ------------------------------------------------------------------------- a Muralha Prismática ----
const CAMADAS_PRISMATICAS = [['vermelha', 'fogo'], ['laranja', 'ácido'], ['amarela', 'elétrico'], ['verde', 'veneno'], ['azul', 'frio']];

/**
 * Quem ENTRA na Muralha Prismática passa pelas sete camadas, uma de cada vez, com um teste de Destreza em cada: as cinco
 * primeiras ferem 10d6 (metade passando), a anil começa a petrificar (o mesmo `petrificando` do Borrifo Prismático) e a
 * violeta cega e, no começo do próximo turno, manda para outro plano quem falhar em Sabedoria (`inicioPrismatico`). Quem
 * conjurou e o lado dele passam sem nada. Devolve se o passo segue.
 */
export function atravessarPrismatica(enc, c, zona, porque = 'entra') {
  const dono = enc.combatants.find((x) => x.id === zona.dono);
  if (!vivo(c) || (dono && c.side === dono.side)) return true;
  const dc = zona.prismatica.cd ?? 15;
  enc.say('magia', `${c.name} ${porque} na Muralha Prismática, camada a camada.`);
  for (const [cor, tipo] of CAMADAS_PRISMATICAS) {
    if (!vivo(c)) return false;
    const sv = enc.resistencia(c, 'dex', dc, { contra: { magico: true, tipoDano: tipo } });
    const r = enc.explicarResistencia(c, 'dex', dc, sv, { contra: `a camada ${cor}`, seSucesso: 'metade' });
    const x = damageRoll(enc.rng, '10d6');
    const v = sv.success ? Math.floor(x.total / 2) : x.total;
    enc.applyDamage(c, v, tipo, dono ?? null, { magico: true });
    enc.say('dano', `A camada ${cor}: ${v} de ${tipo} em ${c.name}.`, `${r.conta} · 10d6[${x.rolls.join('+')}]`, { rolagem: r });
  }
  if (!vivo(c)) return false;
  const anil = enc.resistencia(c, 'dex', dc, { contra: { magico: true } });
  enc.explicarResistencia(c, 'dex', dc, anil, { contra: 'a camada anil', seSucesso: 'passa' });
  if (!anil.success) {
    enc.aplicarCondicao(c, 'petrificando', { source: dono?.id ?? null, data: { cd: dc, save: 'con' } });
    enc.say('condicao', `A camada anil prende ${c.name}: a carne começa a virar pedra.`);
  }
  const violeta = enc.resistencia(c, 'dex', dc, { contra: { magico: true } });
  enc.explicarResistencia(c, 'dex', dc, violeta, { contra: 'a camada violeta', seSucesso: 'passa' });
  if (!violeta.success) {
    enc.aplicarCondicao(c, 'cego', { source: dono?.id ?? null, rounds: Infinity });
    enc.aplicarCondicao(c, 'violetaPrismatica', { source: dono?.id ?? null, rounds: Infinity, data: { cd: dc } });
    enc.say('condicao', `A camada violeta cega ${c.name}, e o mundo em volta dele começa a se desfazer.`);
  }
  return vivo(c) && !hasCondition(c, 'petrificando');
}

/** As casas a até 6 m de alguma casa de uma muralha prismática de OUTRO lado, que `c` vê: dali ela ofusca. */
function prismaticaAVista(enc, c) {
  for (const z of enc.zonas ?? []) {
    if (!z.prismatica || !c.pos) continue;
    const dono = enc.combatants.find((x) => x.id === z.dono);
    if (dono && dono.side === c.side) continue;
    for (const k of z.casas) {
      const [x, y] = k.split(',').map(Number);
      if (distanceFt(c.pos, { x, y }) <= 20 && enc.field.hasLineOfSight(c.pos, { x, y })) return z;
    }
  }
  return null;
}

/** Quem vê a muralha a até 6 m faz Constituição ou fica cego por 1 minuto: ao surgir, e no começo de cada turno ali. */
function ofuscar(enc, c, z) {
  if (!vivo(c) || hasCondition(c, 'cego') || conditionEffects(c).inalcancavel) return;
  const dc = z.prismatica.cd ?? 15;
  const sv = enc.resistencia(c, 'con', dc, { contra: { magico: true, condicao: 'cego' } });
  const r = enc.explicarResistencia(c, 'con', dc, sv, { contra: 'o brilho da Muralha Prismática', seSucesso: 'desvia os olhos' });
  if (sv.success) return;
  enc.aplicarCondicao(c, 'cego', { source: z.dono, rounds: 10, quando: 'fim', lado: c.side });
  enc.say('condicao', `O brilho da Muralha Prismática cega ${c.name}.`, r.conta, { rolagem: r });
}

/** A muralha acaba de surgir (nunca em cima de ninguém: o `canCast` recusa), e quem a vê de perto pode ficar cego. */
export function muralhaPrismaticaSurge(enc, actor, zona) {
  for (const c of enc.combatants.filter((x) => vivo(x) && x.pos && x !== actor)) {
    const z = prismaticaAVista(enc, c);
    if (z) ofuscar(enc, c, z);
  }
}

/** No começo do turno: a camada violeta cobra a Sabedoria (passou, enxerga; falhou, vai para outro plano), e o brilho ofusca. */
export function inicioPrismatico(enc, c) {
  const vi = getCondition(c, 'violetaPrismatica');
  if (vi && vivo(c)) {
    const sv = enc.resistencia(c, 'wis', vi.data?.cd ?? 15, { contra: { magico: true } });
    const r = enc.explicarResistencia(c, 'wis', vi.data?.cd ?? 15, sv, { contra: 'a camada violeta', seSucesso: 'volta a enxergar' });
    removeCondition(c, 'violetaPrismatica');
    if (sv.success) { removeCondition(c, 'cego'); enc.say('condicao', `${c.name} pisca e volta a enxergar.`, r.conta, { rolagem: r }); }
    else {
      removeCondition(c, 'cego');
      addCondition(c, 'banidoDoPlano', { rounds: 99999, source: c.id });
      c.naoSeguraALuta = true;
      enc.say('condicao', `${c.name} se desfaz na luz violeta e vai parar noutro plano.`, r.conta, { rolagem: r });
      enc.checkEnd?.();
      return;
    }
  }
  const z = prismaticaAVista(enc, c);
  if (z) ofuscar(enc, c, z);
}

/** O DESGASTE DO DESEJO: até o descanso longo, cada magia conjurada custa 1d10 necrótico por círculo. */
export function estresseDoDesejo(enc, actor, spell, spellId) {
  if (!actor?.estresseDoDesejo || spellId === 'desejo' || !(spell?.level > 0) || spell.interna) return;
  const x = damageRoll(enc.rng, `${spell.level}d10`);
  enc.applyDamage(actor, x.total, 'necrótico', null, { magico: true });
  enc.say('dano', `O desgaste do Desejo cobra ${actor.name}: ${x.total} necrótico.`, `${spell.level}d10[${x.rolls.join('+')}]`);
}

// ------------------------------------------------------------------------- a fila do Xanathar ----
/** Os demônios maiores que o Invocar Demônio Maior chama, pelo ND (o mais forte que o círculo deixa). */
const DEMONIOS_MAIORES = [['barlgura', 5], ['vrock', 6], ['hezrou', 8], ['glabrezu', 9], ['yochlol', 10]];
/** A zona da Fúria da Natureza: só desenha a área e a marca; o que ela faz mora nos turnos de quem conjurou. */
const IRA_DA_NATUREZA = { id: 'iraDaNatureza', name: 'Fúria da Natureza', level: 5, zona: { rodadas: 10, quando: 'nunca', aoEntrar: false, dificil: false, semTeste: true, em: 'na' } };

const ehDemonio = (c) => /demon/.test(JSON.stringify(c.marcas ?? '')) || /dem[oô]nio/i.test(c.nomeOriginal ?? '') || ['quasit', 'dretch', 'manes'].includes(c.defId);

/** O demônio que não obedece mais: age sozinho, ninguém o comanda, e não segura a luta do lado de quem o chamou. */
export function tornarHostilATodos(m) {
  m.hostilATodos = true;
  m.naoSeguraALuta = true;
  if (m.invocado) { m.invocado.auto = true; m.invocado.hostil = true; }
}
/** Os alvos de quem é hostil a todos: qualquer um que não seja demônio, de qualquer lado. */
export function alvosDoHostil(enc, m) {
  return enc.combatants.filter((c) => c !== m && vivo(c) && c.pos && !ehDemonio(c) && c.side !== 'neutro' && !conditionEffects(c).inalcancavel);
}

/** No fim do turno do demônio maior, o Carisma: passou, ele se solta e vira hostil a todos. */
export function fimDoTurnoDoDemonio(enc, m) {
  const dm = m.invocado?.demonioMaior;
  if (!dm || m.hostilATodos || !vivo(m)) return;
  const sv = enc.resistencia(m, 'cha', dm.cd, { contra: { magico: true } });
  const r = enc.explicarResistencia(m, 'cha', dm.cd, sv, { contra: 'a ordem de quem o chamou', seSucesso: 'se solta' });
  if (!sv.success) return;
  tornarHostilATodos(m);
  enc.say('condicao', `${m.name} se solta da ordem e se volta contra todos.`, r.conta, { rolagem: r });
}

/** As casas da Dispersão: livre, vista por quem conjura, a até 36 m dele, e a mais longe de `longeDe`. */
function casaDaDispersao(enc, actor, c, longeDe, tomadas) {
  const fl = enc.field;
  const r = 24;
  let melhor = null;
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const x = actor.pos.x + dx;
    const y = actor.pos.y + dy;
    if (!fl.inside(x, y) || fl.blocksMove(x, y) || tomadas.has(key(x, y)) || distanceFt(actor.pos, { x, y }) > 120) continue;
    if (enc.at(x, y) && enc.at(x, y) !== c) continue;
    if (!fl.hasLineOfSight(actor.pos, { x, y })) continue;
    const longe = longeDe.length ? Math.min(...longeDe.filter((o) => o !== c).map((o) => distanceFt(o.pos, { x, y }))) : 0;
    if (!melhor || longe > melhor.longe) melhor = { x, y, longe };
  }
  return melhor;
}

/** Os pontos dos Ossos da Terra: as dobras e a casa clicada, sem repetir, até seis. */
function pontosDosOssos(point, escalas) {
  const out = [];
  for (const p of [...(escalas ?? []), point].filter(Boolean)) if (!out.some((q) => q.x === p.x && q.y === p.y)) out.push({ x: p.x, y: p.y });
  return out.slice(0, 6);
}

/** No começo do turno de quem mantém a Fúria da Natureza: as árvores da área açoitam os inimigos a 3 m delas. */
export function inicioDaIra(enc, c) {
  const conc = c.concentrating;
  if (!conc?.ira || !conc.area || !vivo(c)) return;
  const arvores = (conc.arvores ?? []).map((a) => [a.x, a.y]).filter(([x, y]) => enc.field.surfaceAt(x, y) === 'arvore');
  if (!arvores.length) return;
  for (const t of enc.combatants.filter((o) => vivo(o) && o.pos && o.side !== c.side && !conditionEffects(o).inalcancavel)) {
    if (!arvores.some(([x, y]) => distanceFt(t.pos, { x, y }) <= 10)) continue;
    const sv = enc.resistencia(t, 'dex', conc.cd, { contra: { magico: true } });
    const r = enc.explicarResistencia(t, 'dex', conc.cd, sv, { contra: 'os galhos', seSucesso: 'se esquiva' });
    if (sv.success) { enc.say('magia', `${t.name} se esquiva dos galhos.`, r.conta, { rolagem: r }); continue; }
    const x = damageRoll(enc.rng, '4d6');
    enc.applyDamage(t, x.total, 'cortante', c, { magico: true });
    enc.say('dano', `Os galhos açoitam ${t.name}: ${x.total} cortante.`, `${r.conta} · 4d6[${x.rolls.join('+')}]`, { rolagem: r });
  }
}
/** No fim do turno dele: as raízes prendem o inimigo no chão da área mais perto de quem conjurou (Força, ou contido). */
export function fimDaIra(enc, c) {
  const conc = c.concentrating;
  if (!conc?.ira || !conc.area || !vivo(c)) return;
  const t = enc.combatants.filter((o) => vivo(o) && o.pos && o.side !== c.side && conc.area.has(key(o.pos.x, o.pos.y))
    && !enc.voaAgora?.(o) && !hasCondition(o, 'contido') && !conditionEffects(o).inalcancavel)
    .sort((a, b) => distanceFt(a.pos, c.pos) - distanceFt(b.pos, c.pos))[0];
  if (!t) return;
  const sv = enc.resistencia(t, 'str', conc.cd, { contra: { magico: true, planta: true, condicao: 'contido' } });
  const r = enc.explicarResistencia(t, 'str', conc.cd, sv, { contra: 'as raízes', seSucesso: 'se solta' });
  if (sv.success) { enc.say('magia', `${t.name} arranca o pé das raízes.`, r.conta, { rolagem: r }); return; }
  enc.aplicarCondicao(t, 'contido', { source: c.id, rounds: Infinity, data: { escape: conc.cd, soForca: true, vinhas: true } });
  conc.targets.push(t);
  enc.say('condicao', `As raízes prendem ${t.name} ao chão.`, r.conta, { rolagem: r });
}

/** O ALVO das magias dos livros que miram criatura e pedem algo dela (a fera do Vínculo, o alvo dentro da Ira). `null` = sem regra. */
export function alvoDoLivro(enc, actor, spell, target, opcao = null) {
  switch (spell?.efeito) {
    case 'vinculoBestial':
      if (!target || target.side !== actor.side || target === actor) return { ok: false, why: 'só numa fera aliada' };
      if (target.tipo !== 'fera') return { ok: false, why: 'só numa fera' };
      if ((target.abilities?.int ?? 10) > 3) return { ok: false, why: 'a fera tem de ter Inteligência 3 ou menos' };
      if (distanceFt(actor.pos, target.pos) > 5) return { ok: false, why: 'é de toque' };
      return { ok: true };
    case 'prenderNoFrasco':
      if (!target || !vivo(target)) return { ok: false, why: 'escolha uma criatura' };
      if (!['celestial', 'corruptor', 'elemental', 'feérico'].includes(target.tipo)) return { ok: false, why: 'só prende criatura de outro plano (celestial, corruptor, elemental, fada)' };
      if (actor.frascoDeFerro) return { ok: false, why: 'o frasco já tem uma criatura' };
      if (distanceFt(actor.pos, target.pos) > 60) return { ok: false, why: 'fora de alcance (18 m)' };
      return { ok: true };
    case 'aprimorarPericia':
      if (!target || target.side !== actor.side) return { ok: false, why: 'só numa criatura disposta (aliada)' };
      if (distanceFt(actor.pos, target.pos) > 5) return { ok: false, why: 'é de toque' };
      if (!periciasParaAprimorar(target).length) return { ok: false, why: `${target.name} não tem perícia treinada sem especialização` };
      if (opcao && !periciasParaAprimorar(target).includes(opcao)) return { ok: false, why: `${target.name} não é treinado nessa perícia, ou já a dobra` };
      return { ok: true };
    case 'pedraDaIra': {
      const area = actor.concentrating?.ira ? actor.concentrating.area : null;
      if (!area) return { ok: false, why: 'só enquanto a Fúria da Natureza dura' };
      if (!target?.pos || !area.has(key(target.pos.x, target.pos.y))) return { ok: false, why: 'o alvo tem de estar dentro da área' };
      return { ok: true };
    }
    default: return null;
  }
}

// ------------------------------------------------------------------------- as quatro que sobravam ----
const NOME_DA_PERICIA = {
  acrobacia: 'Acrobacia', adestrarAnimais: 'Adestrar Animais', arcanismo: 'Arcanismo', atletismo: 'Atletismo', atuacao: 'Atuação',
  enganacao: 'Enganação', furtividade: 'Furtividade', historia: 'História', intimidacao: 'Intimidação', intuicao: 'Intuição',
  investigacao: 'Investigação', medicina: 'Medicina', natureza: 'Natureza', percepcao: 'Percepção', persuasao: 'Persuasão',
  prestidigitacao: 'Prestidigitação', religiao: 'Religião', sobrevivencia: 'Sobrevivência',
};
/** As perícias que a Aprimorar Perícia pode dar a `c`: as treinadas que ainda não dobram a proficiência. */
export const periciasParaAprimorar = (c) => (c?.skills ?? []).filter((k) => !c.expertise?.includes(k) && NOME_DA_PERICIA[k]);

/** A zona da Controlar Ventos: só marca o cubo; o que ela faz mora em `ventoNoCaminho`, `ventoNoVoador` e na queda. */
const VENTOS = { id: 'controlarVentos', name: 'Controlar Ventos', level: 5, zona: { rodadas: 600, quando: 'nunca', aoEntrar: true, dificil: false, semTeste: true, em: 'no' } };
export const MODOS_DO_VENTO = {
  rajadas: 'rajadas fortes atravessam o lugar, e flecha nenhuma voa direito',
  descendente: 'uma corrente desce do alto, empurra o que voa para o chão e desvia as flechas',
  ascendente: 'uma corrente sobe do chão, e quem cai ali desce devagar',
};
const ventosAtivos = (enc) => (enc.zonas ?? []).filter((z) => z.vento && !z.vento.parado);

/** O ataque de ARMA à distância que passa pelo cubo das rajadas ou da descendente, ou mira quem está nele: desvantagem. */
export function ventoNoCaminho(enc, de, para) {
  const zs = ventosAtivos(enc).filter((z) => z.vento.modo !== 'ascendente');
  if (!zs.length || !de || !para) return false;
  if (zs.some((z) => z.casas.has(key(para.x, para.y)))) return true;
  return enc.field.line(de, para).some((q) => zs.some((z) => z.casas.has(key(q.x, q.y))));
}
/** Quem voa e entra na corrente descendente (a primeira vez no turno) ou começa o turno nela voando: Força, ou vai ao chão. */
export function ventoNoVoador(enc, c, zona) {
  if (!zona?.vento || zona.vento.parado || zona.vento.modo !== 'descendente' || !vivo(c) || !enc.voaAgora?.(c)) return true;
  const turno = enc.turnoKey?.();
  if (c.ventoNoTurno === turno) return true;
  c.ventoNoTurno = turno;
  const sv = enc.resistencia(c, 'str', zona.vento.cd, { contra: { magico: true } });
  const r = enc.explicarResistencia(c, 'str', zona.vento.cd, sv, { contra: 'a corrente descendente', seSucesso: 'segura o voo' });
  if (sv.success) { enc.say('magia', `${c.name} segura o voo contra a corrente.`, r.conta, { rolagem: r }); return true; }
  enc.aplicarCondicao(c, 'caido', { source: zona.dono });
  enc.say('condicao', `A corrente joga ${c.name} no chão.`, r.conta, { rolagem: r });
  return false;
}
/** No começo do turno: quem está voando dentro da corrente descendente testa de novo. */
export function inicioDoVento(enc, c) {
  if (!c?.pos) return;
  for (const z of ventosAtivos(enc)) if (z.casas.has(key(c.pos.x, c.pos.y))) ventoNoVoador(enc, c, z);
}
/** A queda que termina dentro da corrente ascendente: o dano cai à metade. */
export function quedaNaAscendente(enc, c) {
  return Boolean(c?.pos && ventosAtivos(enc).some((z) => z.vento.modo === 'ascendente' && z.casas.has(key(c.pos.x, c.pos.y))));
}

/**
 * O MÍSSIL MÁGICO DE JIM: cada dardo faz a sua jogada de ataque de magia (2d4 de energia; o crítico é 5d4, e não o dobro
 * dos dados), e as jogadas saem TODAS antes do dano: se alguma der 1 natural, todos erram e estouram em quem conjurou, 1 de
 * energia por dardo.
 */
export function dardosDeJim(enc, actor, spell, alvos, n, { spellAttackBonus, attackRoll }) {
  const bonus = spellAttackBonus(actor) ?? 0;
  const tiros = [];
  for (let i = 0; i < n && alvos.length; i++) {
    const t = alvos[i % alvos.length];
    if (!vivo(t)) continue;
    const mods = enc.attackModifiers(actor, t, { ranged: true, deMagia: true });
    const ca = caEfetiva(t) + enc.field.coverBetween(actor.pos, t.pos);
    tiros.push({ t, ca, atk: attackRoll(enc.rng, bonus, ca, mods) });
  }
  const conta = (x) => `d20[${x.atk.rolls.join('/')}] + ${bonus} = ${x.atk.total} vs CA ${x.ca}`;
  if (tiros.some((x) => x.atk.fumble)) {
    enc.say('magia', `Um dardo sai torto, e os ${tiros.length} estouram na cara de ${actor.name}: ${tiros.length} de energia.`, tiros.map(conta).join(' · '));
    enc.applyDamage(actor, tiros.length, 'energético', actor, { magico: true });
    return;
  }
  for (const x of tiros) {
    if (!x.atk.hit) { enc.say('magia', `Um dardo erra ${x.t.name}.`, conta(x)); continue; }
    if (!vivo(x.t)) continue;
    const d = damageRoll(enc.rng, x.atk.critical ? '5d4' : '2d4');
    enc.say('magia', `Um dardo ${x.atk.critical ? 'acerta em cheio' : 'acerta'} ${x.t.name}: ${d.total} de energia.`, `${conta(x)} · ${x.atk.critical ? '5d4' : '2d4'}[${d.rolls.join('+')}]`);
    enc.applyDamage(x.t, d.total, 'energético', actor, { magico: true, deAtaque: true, critical: x.atk.critical });
  }
}

/**
 * GAIOLA DE ALMAS, a reação: quando um humanoide INIMIGO que ele vê morre a até 18 m, quem tem a magia pronta e nenhuma alma
 * presa pode prendê-la (seis usos; o morto não pode ser revivido enquanto ela estiver lá). O MONSTRO reage sozinho; o HERÓI
 * é perguntado: o motor resolve a morte no meio do golpe e não tem como parar ali, então deixa uma OFERTA
 * (`enc.ofertasDaGaiola`, o evento `ofertaDaGaiola`) e a tela pergunta ao jogador dele logo depois da ação; aceitando,
 * `aceitarGaiola` prende a alma. `enc.gaiolaSemPerguntar` (o simulador) faz o herói reagir sozinho também.
 */
export function gaiolaDeAlmas(enc, morto) {
  if (!morto?.pos || (morto.tipo ?? 'humanoide') !== 'humanoide' || morto.almaNaGaiola) return;
  for (const r of enc.combatants) {
    if (!podePrenderAAlma(enc, r, morto)) continue;
    if (r.side === 'party' && !enc.gaiolaSemPerguntar) {
      const oferta = { reatorId: r.id, mortoId: morto.id, rodada: enc.round };
      (enc.ofertasDaGaiola ??= []).push(oferta);
      enc.onEvent({ type: 'ofertaDaGaiola', reator: r, morto, oferta });
      return;
    }
    prenderAAlma(enc, r, morto);
    return;
  }
}
/** `r` pode prender agora a alma de `morto`? A reação livre, a magia pronta (com espaço), nenhuma alma presa, perto e à vista. */
function podePrenderAAlma(enc, r, morto) {
  if (r === morto || !vivo(r) || !r.pos || !morto?.pos || r.side === morto.side || hasCondition(r, 'almaNaGaiola')) return false;
  if (morto.almaNaGaiola || (morto.tipo ?? 'humanoide') !== 'humanoide') return false;
  if (distanceFt(r.pos, morto.pos) > 60 || !enc.field.hasLineOfSight(r.pos, morto.pos)) return false;
  return Boolean(enc.podeReagirCom(r, 'gaiolaDeAlmas'));
}
function prenderAAlma(enc, r, morto) {
  const pode = enc.podeReagirCom(r, 'gaiolaDeAlmas');
  r.reactionUsed = true;
  enc.pagarReacao(r, pode);
  addCondition(r, 'almaNaGaiola', { rounds: 4800, source: r.id, data: { usos: 6, de: morto.name, mortoId: morto.id } });
  morto.almaNaGaiola = r.id;
  enc.say('magia', `${r.name} fecha a gaiola de ossos no último suspiro de ${morto.name}: a alma fica presa (seis usos).`);
}
/** O jogador aceitou a oferta: vale enquanto for a mesma rodada e nada tiver mudado (a reação, o espaço, o corpo). */
export function aceitarGaiola(enc, oferta) {
  enc.ofertasDaGaiola = (enc.ofertasDaGaiola ?? []).filter((o) => o !== oferta);
  const r = enc.combatants.find((c) => c.id === oferta?.reatorId);
  const morto = enc.combatants.find((c) => c.id === oferta?.mortoId);
  if (!r || !morto?.dead || oferta.rodada !== enc.round || !podePrenderAAlma(enc, r, morto)) {
    enc.say('aviso', 'A alma já se foi: a Gaiola de Almas não a alcança mais.');
    return false;
  }
  prenderAAlma(enc, r, morto);
  return true;
}
/** O jogador deixou a alma ir. */
export function recusarGaiola(enc, oferta) {
  enc.ofertasDaGaiola = (enc.ofertasDaGaiola ?? []).filter((o) => o !== oferta);
}
function gastarAlma(actor) {
  const g = getCondition(actor, 'almaNaGaiola');
  if (!g || !(g.data?.usos > 0)) return false;
  g.data.usos -= 1;
  if (g.data.usos <= 0) removeCondition(actor, 'almaNaGaiola');
  return true;
}
/** A EXPERIÊNCIA EMPRESTADA se gasta na próxima jogada de ataque, teste ou resistência: devolve se valeu agora. */
export function gastarExperiencia(c) {
  if (!hasCondition(c, 'experienciaEmprestada')) return false;
  removeCondition(c, 'experienciaEmprestada');
  return true;
}

// ------------------------------------------------------------------------- o cubo de força ----
const FACES_DO_CUBO = {
  1: { custo: 1, texto: 'gás, vento e névoa não atravessam a barreira' },
  2: { custo: 2, texto: 'nada sem vida atravessa a barreira (flecha, pedra, virote)' },
  3: { custo: 3, texto: 'nada vivo atravessa a barreira' },
  4: { custo: 4, texto: 'nenhuma magia atravessa a barreira' },
  5: { custo: 5, texto: 'nada atravessa a barreira' },
};
export const CUSTO_DA_FACE = (face) => FACES_DO_CUBO[Number(face)]?.custo ?? 0;
const CUBO = { id: 'cuboDeForca', name: 'Barreira do cubo', level: 0, zona: { rodadas: 10, quando: 'nunca', aoEntrar: false, dificil: false, semTeste: true, em: 'na' } };
const GASES = new Set(['nuvemFetida', 'nuvemMortal', 'nevoaObscurecente', 'nuvemIncendiaria', 'garrafaDaFumaca', 'nevoa']);

/**
 * A barreira do cubo barra o que cruza ela: quem está de um lado e o alvo do outro. `tipo`: 'perto' (o golpe de perto, vivo),
 * 'longe' (o projétil, sem vida) ou 'magia'. Quem já estava dentro quando a face foi apertada fica do lado de dentro.
 */
export function cuboBloqueia(enc, atacante, alvo, tipo) {
  if (!atacante?.pos || !alvo?.pos) return false;
  for (const z of enc.zonas ?? []) {
    const cubo = z.cubo;
    if (!cubo) continue;
    const a = enc.pegadaEmZona(z, atacante.pos.x, atacante.pos.y, atacante.pos.f ?? 1);
    const b = enc.pegadaEmZona(z, alvo.pos.x, alvo.pos.y, alvo.pos.f ?? 1);
    if (a === b) continue;
    if (cubo.face === 5) return true;
    if (cubo.face === 3 && tipo === 'perto') return true;
    if (cubo.face === 2 && tipo === 'longe') return true;
    if (cubo.face === 4 && tipo === 'magia') return true;
  }
  return false;
}
/** A criatura viva que o cubo barra de entrar (as faces 3 e 5): quem não é o dono nem estava dentro. */
export function cubosQueBarram(enc, c) {
  return (enc.zonas ?? []).filter((z) => z.cubo && [3, 5].includes(z.cubo.face) && z.cubo.dono !== c.id && !z.cubo.dentro.has(c.id)
    && !enc.pegadaEmZona(z, c.pos.x, c.pos.y, c.pos.f ?? 1));
}
/** O gás (a névoa, a nuvem) não pega quem está dentro do cubo com a face 1 ou 5. */
export function cuboBarraGas(enc, c, zona) {
  if (!zona?.spellId || !GASES.has(zona.spellId) || !c?.pos) return false;
  return (enc.zonas ?? []).some((z) => z.cubo && [1, 5].includes(z.cubo.face) && enc.pegadaEmZona(z, c.pos.x, c.pos.y, c.pos.f ?? 1));
}

// ------------------------------------------------------------------------- a esfera da aniquilação ----
const ESFERA = { id: 'esferaDaAniquilacao', name: 'Esfera da aniquilação', level: 0,
  zona: { rodadas: Infinity, quando: 'nunca', aoEntrar: true, dificil: false, dano: { dados: '4d10', tipo: 'energético', save: 'dex', metade: false }, em: 'na' } };
const esferaPos = (z) => { const [x, y] = [...z.casas][0].split(',').map(Number); return { x, y }; };
/** A esfera a até 18 m de `c`, se houver. */
export function esferaPerto(enc, c) {
  return (enc.zonas ?? []).find((z) => z.esferaDaAniquilacao && c?.pos && distanceFt(c.pos, esferaPos(z)) <= 60) ?? null;
}
const temOTalisma = (c) => (c?.bag ?? []).some((b) => b.id === 'talismaDaEsfera') && (c.sintonizados ?? []).includes('talismaDaEsfera');
/** A casa a até `n` passos de `de` na direção de `para` (passo a passo, como a régua). */
function passosAte(de, para, n) {
  const p = { ...de };
  for (let i = 0; i < n && (p.x !== para.x || p.y !== para.y); i++) { p.x += Math.sign(para.x - p.x); p.y += Math.sign(para.y - p.y); }
  return p;
}
/** A esfera anda casa a casa; quem estiver numa casa por onde ela passa faz Destreza CD 13 ou sofre 4d10 de energia. */
function moverEsfera(enc, z, de, para) {
  const caminho = [];
  const p = { ...de };
  while (p.x !== para.x || p.y !== para.y) { p.x += Math.sign(para.x - p.x); p.y += Math.sign(para.y - p.y); caminho.push({ ...p }); }
  for (const q of caminho) {
    const c = enc.at(q.x, q.y);
    if (c && vivo(c)) enc.resistirAZona(c, z, 'é tocado');
  }
  z.casas = new Set([key(para.x, para.y)]);
  z.centro = { ...para };
}

// ------------------------------------------------------------------------- a garrafa da fumaça ----
const FUMACA_ETERNA = { id: 'garrafaDaFumaca', name: 'Fumaça eterna', level: 0, zona: { rodadas: Infinity, quando: 'nunca', aoEntrar: false, dificil: false, semTeste: true, obscuro: 'pesada', em: 'na' } };
/** No começo do turno de quem abriu a garrafa: passado cada minuto (10 rodadas), a nuvem cresce 3 m, até 36 m. */
export function crescerFumaca(enc, c) {
  for (const z of enc.zonas ?? []) {
    const f = z.fumacaEterna;
    if (!f || f.dono !== c.id || !f.aberta || f.raio >= 120) continue;
    const raio = Math.min(120, 60 + 10 * Math.floor((enc.round - f.desde) / 10));
    if (raio <= f.raio) continue;
    f.raio = raio;
    z.casas = new Set((enc.areaDaMagia(c, { shape: 'sphere', areaFt: raio, level: 0, centradoEmSi: true }, z.centro) ?? []).map((t) => key(t.x, t.y)));
    enc.say('magia', `A fumaça da garrafa se espalha: agora são ${(raio * 0.3).toLocaleString('pt-BR')} m.`);
  }
}

// ------------------------------------------------------------------------- os pergaminhos de proteção ----
/**
 * O PERGAMINHO DE PROTEÇÃO (Livro do Mestre): por 5 minutos, um cilindro de 1,5 m em volta de quem o leu, que anda com ele,
 * que as criaturas do tipo não atravessam nem afetam. É a barreira do Círculo Mágico (`zona.circuloMagico.tipo`, que o
 * `reachableFor` já não deixa o tipo atravessar) mais `zona.pergaminho`: o tipo não ataca nem mira quem está dentro
 * (`barreiraBloqueia`). Se o leitor se mover de um jeito que ponha uma criatura do tipo dentro, a barreira acaba. Quem é do
 * tipo pode gastar a ação num teste de Carisma CD 15 para deixar de ser barrado (`romperBarreira`, a IA).
 */
export function lerPergaminhoDeProtecao(enc, actor, tipo) {
  const zona = enc.criarZona(actor, PERGAMINHO, casasDaBarreira(enc, actor), 0, { centro: actor.pos });
  zona.circuloMagico = { tipo };
  // quem JÁ está dentro quando ele lê (o urso da bolsa colado nele) não é barrado: o livro barra quem entra
  const jaDentro = enc.combatants.filter((o) => vivo(o) && o.pos && o !== actor && (o.tipo ?? 'humanoide') === tipo && enc.pegadaEmZona(zona, o.pos.x, o.pos.y, o.pos.f ?? 1));
  zona.pergaminho = { leitorId: actor.id, tipo, vencidos: new Set(jaDentro.map((o) => o.id)) };
  enc.say('magia', `${actor.name} lê o pergaminho, e um cilindro invisível se fecha em volta dele: ${NOME_DO_TIPO[tipo] ?? tipo} não entra.`);
  return zona;
}
const PERGAMINHO = { id: 'pergaminhoDeProtecao', name: 'Barreira do pergaminho', level: 0, zona: { rodadas: 50, quando: 'nunca', aoEntrar: false, dificil: false, semTeste: true, em: 'na' } };
const NOME_DO_TIPO = { aberração: 'aberração', fera: 'fera', celestial: 'celestial', elemental: 'elemental', 'feérico': 'fada', corruptor: 'corruptor', planta: 'planta', 'morto-vivo': 'morto-vivo' };
function casasDaBarreira(enc, c) {
  const out = [];
  const f = c.pos.f ?? 1;
  for (let dy = -1; dy <= f; dy++) for (let dx = -1; dx <= f; dx++) {
    const x = c.pos.x + dx;
    const y = c.pos.y + dy;
    if (enc.field.inside(x, y)) out.push({ x, y });
  }
  return out;
}
/** A barreira anda com quem a leu; se passar a ter dentro uma criatura do tipo, acaba. */
export function moverBarreira(enc, c) {
  for (const z of enc.zonas ?? []) if (z.cubo?.dono === c.id) z.casas = new Set(casasDaBarreira(enc, c).map((t) => key(t.x, t.y)));
  for (const z of [...(enc.zonas ?? [])]) {
    if (z.pergaminho?.leitorId !== c.id) continue;
    z.casas = new Set(casasDaBarreira(enc, c).map((t) => key(t.x, t.y)));
    const dentro = enc.combatants.find((o) => vivo(o) && o.pos && (o.tipo ?? 'humanoide') === z.pergaminho.tipo && !z.pergaminho.vencidos.has(o.id)
      && enc.pegadaEmZona(z, o.pos.x, o.pos.y, o.pos.f ?? 1));
    if (dentro) {
      enc.say('magia', `A barreira do pergaminho de ${c.name} se desfaz: ${dentro.name} ficou do lado de dentro.`);
      enc.desfazerZona(z);
    }
  }
}
/** O tipo barrado não ataca nem mira quem está dentro da barreira (o "nem afeta" do livro). */
export function barreiraBloqueia(enc, atacante, alvo) {
  if (!atacante?.pos || !alvo?.pos) return false;
  return (enc.zonas ?? []).some((z) => z.pergaminho && z.pergaminho.tipo === (atacante.tipo ?? 'humanoide') && !z.pergaminho.vencidos.has(atacante.id)
    && enc.pegadaEmZona(z, alvo.pos.x, alvo.pos.y, alvo.pos.f ?? 1));
}
/**
 * A IA do tipo barrado: se todo inimigo que ela vê a 18 m está dentro de uma barreira contra ela, gasta a ação no Carisma
 * CD 15 para deixar de ser barrada por aquela. Devolve true se gastou a ação.
 */
export function romperBarreira(enc, m) {
  const zs = (enc.zonas ?? []).filter((z) => z.pergaminho && z.pergaminho.tipo === (m.tipo ?? 'humanoide') && !z.pergaminho.vencidos.has(m.id));
  if (!zs.length || m.actionUsed) return false;
  const inimigos = enc.enemiesOf(m).filter((e) => e.pos && distanceFt(e.pos, m.pos) <= 60);
  if (!inimigos.length || !inimigos.every((e) => barreiraBloqueia(enc, m, e))) return false;
  const z = zs[0];
  const t = enc.testeDeAtributo(m, 'cha', Math.floor(((m.abilities?.cha ?? 10) - 10) / 2), 'Carisma');
  m.actionUsed = true;
  if (t.total >= 15) { z.pergaminho.vencidos.add(m.id); enc.say('magia', `${m.name} força a barreira do pergaminho e passa a atravessá-la (${t.total} contra 15).`); }
  else enc.say('magia', `${m.name} se joga contra a barreira do pergaminho, que segura (${t.total} contra 15).`);
  return true;
}

/**
 * O ESCARAMUÇADOR (ladino Batedor, Xanathar): quando um inimigo termina o turno a 1,5 m dele, a reação o leva até metade do
 * deslocamento, sem provocar ataque de oportunidade. No livro é escolha do jogador; o jogo decide: só sai quem está com metade
 * dos PV ou menos (o ladino inteiro quer ficar colado para o Ataque Furtivo), e vai para a casa mais longe dos inimigos.
 */
export function escaramucador(enc, inimigo) {
  if (!inimigo?.pos || inimigo.dead) return;
  for (const c of enc.combatants) {
    if (!vivo(c) || c.side === inimigo.side || !c.features?.includes('skirmisher') || c.reactionUsed || conditionEffects(c).incapacitated) continue;
    if (!c.pos || !enc.field.vizinhos(c.pos, inimigo.pos) || c.hp > c.maxHp / 2) continue;
    const meio = Math.floor(enc.speedOf(c) / 2 / 5) * 5;
    if (meio < 5) continue;
    const guarda = { mov: c.movementLeftFt, des: c.disengaging };
    c.movementLeftFt = meio;
    c.disengaging = true;
    try {
      const reach = enc.reachableFor(c, { orcamentoFt: meio });
      const inimigos = enc.enemiesOf(c).filter((e) => e.pos);
      const longe = (n) => Math.min(...inimigos.map((e) => distanceFt({ x: n.x, y: n.y }, e.pos)));
      let melhor = null;
      for (const n of reach.values()) {
        if (n.parar === false || n.cost > meio || (n.x === c.pos.x && n.y === c.pos.y)) continue;
        if (!melhor || longe(n) > longe(melhor)) melhor = n;
      }
      if (!melhor || longe(melhor) <= longe(c.pos)) continue;
      c.reactionUsed = true;
      enc.moveAlong(c, Battlefield.pathFrom(reach, melhor));
      enc.say('movimento', `${c.name} escapa de ${inimigo.name} com a reação (Escaramuçador), sem dar brecha.`);
    } finally {
      c.movementLeftFt = guarda.mov;
      c.disengaging = guarda.des;
    }
  }
}

/**
 * O TURNO DE QUEM A COBIÇA PRENDEU (Incitar Cobiça, do Jim Darkmagic): só anda até quem mostra a gema, sem fazer mais nada,
 * e encostado nele fica parado olhando. Devolve true: o turno é dela, e a IA de sempre não joga.
 */
export function turnoDaCobica(enc, m) {
  const cond = getCondition(m, 'cobicaIncitada');
  if (!cond || m.dead) return false;
  const dono = enc.combatants.find((c) => c.id === cond.source && vivo(c) && c.pos);
  if (!dono) { removeCondition(m, 'cobicaIncitada'); return false; }
  // o motor não deixa o incapacitado andar (`reachableFor`); a gema deixa, só até ela: a condição sai durante o passo e volta
  if (distanceFt(m.pos, dono.pos) > 5) {
    const i = m.conditions.indexOf(cond);
    m.conditions.splice(i, 1);
    try { moverAte(enc, m, enc.speedOf(m), false, [dono]); } finally { if (!m.dead && !getCondition(m, 'cobicaIncitada')) m.conditions.splice(Math.min(i, m.conditions.length), 0, cond); }
  }
  enc.say('condicao', `${m.name} ${distanceFt(m.pos, dono.pos) <= 5 ? 'fica parado, olhando a gema de perto' : 'anda atrás da gema, sem pensar em mais nada'}.`);
  return true;
}

/**
 * OS ESTÁGIOS DA TEMPESTADE DA VINGANÇA, um por turno de quem conjura: 1, trovão (2d6 e surdez, Constituição); 2,
 * chuva ácida (4d6, sem teste); 3, seis raios (10d6 elétrico, Destreza, metade); 4, granizo (2d6 de concussão, sem
 * teste); do 5º ao 10º, vento e chuva gelada, que o tabuleiro não tem como desenhar (fica a nuvem, e nada mais).
 */
export function estagioDaTempestade(enc, actor) {
  const t0 = actor.concentrating?.tempestade;
  if (!t0) return;
  const e = t0.estagio;
  t0.estagio += 1;
  const alvos = enc.enemiesOf(actor).filter((t) => !t.dead && t.pos);
  if (e === 1) {
    enc.say('magia', 'A nuvem troveja.');
    for (const t of alvos) {
      const sv = enc.resistencia(t, 'con', t0.dc, { contra: { magico: true, tipoDano: 'trovejante' } });
      const d = damageRoll(enc.rng, '2d6');
      enc.applyDamage(t, d.total, 'trovejante', actor, { magico: true });
      if (!sv.success) enc.aplicarCondicao(t, 'surdo', { source: actor.id, rounds: 50 });
    }
  } else if (e === 2) {
    enc.say('magia', 'Cai uma chuva ácida.');
    for (const t of alvos) { const d = damageRoll(enc.rng, '4d6'); enc.applyDamage(t, d.total, 'ácido', actor, { magico: true }); }
  } else if (e === 3) {
    enc.say('magia', 'Seis raios descem da nuvem.');
    for (const t of alvos.slice(0, 6)) {
      const sv = enc.resistencia(t, 'dex', t0.dc, { contra: { magico: true, tipoDano: 'elétrico' } });
      const d = damageRoll(enc.rng, '10d6');
      enc.applyDamage(t, sv.success ? Math.floor(d.total / 2) : d.total, 'elétrico', actor, { magico: true });
    }
  } else if (e === 4) {
    enc.say('magia', 'Desaba o granizo.');
    for (const t of alvos) { const d = damageRoll(enc.rng, '2d6'); enc.applyDamage(t, d.total, 'concussão', actor, { magico: true }); }
  }
}

// ------------------------------------------------------------------------- os efeitos de condição das magias ----

/** A ALJAVA VELOZ: o primeiro tiro do turno puxa, de ação bônus, mais dois no mesmo alvo. */
export function aljavaVeloz(enc, atacante, alvo, p) {
  if (!p.ranged || !p.weapon || atacante.bonusUsed || !hasCondition(atacante, 'aljavaVeloz') || atacante.aljavaNoTurno) return;
  atacante.aljavaNoTurno = true;
  atacante.bonusUsed = true;
  enc.say('magia', `A aljava de ${atacante.name} enche sozinha: mais duas flechas.`);
  for (let i = 0; i < 2 && !alvo.dead; i++) enc.resolveAttack(atacante, alvo, { weaponId: atacante.equippedWeapon, semAljava: true });
}

/** A DESTRUIÇÃO BANIDORA: o golpe que deixa o alvo com 50 PV ou menos o bane, enquanto a concentração durar. */
export function golpeBanidor(enc, atacante, alvo) {
  if (!alvo.banirDepois || alvo.dead) return;
  delete alvo.banirDepois;
  if (alvo.hp > 50) return;
  if (enc.aplicarCondicao(alvo, 'banido', { source: atacante.id })) {
    atacante.concentrating = { spellId: 'destruicaoBanidora', condition: 'banido', targets: [alvo], rounds: atacante.concentrating?.rounds ?? 10 };
    enc.say('magia', `${alvo.name} é arrancado deste plano pelo golpe.`);
  }
}

/** As AURAS do paladino e do clérigo (Vida, Pureza, Poder): quem está a 9 m de quem a mantém. */
const naAura = (enc, t, id) => enc.combatants.some((d) => !d.dead && d.pos && t.pos && d.side === t.side && hasCondition(d, id) && distanceFt(d.pos, t.pos) <= 30);
export const resisteNaAura = (enc, t, tipo) => (tipo === 'necrótico' && naAura(enc, t, 'auraDeVida')) || (tipo === 'veneno' && naAura(enc, t, 'auraDePureza'));
export const noCirculoDePoder = (enc, t) => naAura(enc, t, 'circuloDePoder');
const CONDICOES_DA_PUREZA = ['cego', 'enfeiticado', 'surdo', 'amedrontado', 'paralisado', 'envenenado', 'atordoado'];
/** A vantagem na resistência que a aura dá: a Pureza contra as condições dela; o Círculo de Poder contra magia. */
export function vantagemDeAura(enc, t, contra) {
  if (contra?.condicao && CONDICOES_DA_PUREZA.includes(contra.condicao) && naAura(enc, t, 'auraDePureza')) return true;
  if (contra?.magico && naAura(enc, t, 'circuloDePoder')) return true;
  return false;
}
/** A AURA DE VIDA: o aliado caído a 9 m volta com 1 PV no começo do turno dele. */
export function auraDeVidaNoTurno(enc, c) {
  if (c.dead || c.hp > 0 || !naAura(enc, c, 'auraDeVida') || ['morto-vivo', 'constructo'].includes(c.tipo)) return;
  enc.heal(c, 1, c);
  enc.say('cura', `A aura de vida devolve 1 PV a ${c.name}.`);
}

/** A CONCHA ANTIVIDA: quem não é morto-vivo nem constructo não chega a 3 m de quem a mantém; quem entra é empurrado. */
export function conchaAntivida(enc, c) {
  if (c.dead || !c.pos || ['morto-vivo', 'constructo'].includes(c.tipo)) return;
  for (const d of enc.combatants) {
    if (d === c || d.dead || !d.pos || d.side === c.side || !hasCondition(d, 'conchaAntivida')) continue;
    if (distanceFt(d.pos, c.pos) > 10) continue;
    enc.empurrar(c, d.pos, 15 - distanceFt(d.pos, c.pos) + 5);
    enc.say('magia', `A concha de ${d.name} repele ${c.name}.`);
  }
}

/** O campo antimágico: quem o mantém leva consigo uma esfera de 3 m sem magia. */
export const noCampoAntimagia = (enc, pos) => !!pos && enc.combatants.some((m) => !m.dead && m.pos && hasCondition(m, 'campoAntimagia') && distanceFt(m.pos, pos) <= 10);

/** COMPELIDO e LABIRINTO, no começo do turno de quem os sofre. Devolve true quando tomou conta do turno. */
export function turnoDaMagia(enc, c) {
  const comp = getCondition(c, 'compelido');
  if (comp) {
    const quem = enc.combatants.find((x) => x.id === comp.source);
    if (quem?.pos) {
      enc.say('condicao', `${c.name}, compelido, anda para longe de ${quem.name}.`);
      enc.fugirDe(c, quem.pos, c.movementLeftFt ?? enc.speedOf(c));
      c.movementLeftFt = 0;
    }
    return false;
  }
  if (hasCondition(c, 'labirinto')) {
    const r = enc.testeDeAtributo(c, 'int', Math.floor(((c.abilities?.int ?? 10) - 10) / 2), 'sair do labirinto');
    if (r.total >= 20) { removeCondition(c, 'labirinto'); enc.say('magia', `${c.name} acha a saída do labirinto (${r.total}).`); }
    else enc.say('magia', `${c.name} se perde no labirinto (${r.total} contra 20).`);
    perderOTurno(c);
    return true;
  }
  return false;
}

// ======================================================= a segunda fila dos bestiários (2026-11-12) ==================
// O que os blocos do Volo, do Mordenkainen, do Bigby e do Acquisitions Inc. pediam e o motor não fazia (os nomes saem do
// importador, `importar-bestiario.mjs tracoLido` e `acaoEspecial`).

/** PROTEÇÃO ARCANA (o abjurador): o escudo de PV leva o dano primeiro; o que passa dele vai para a criatura. */
export function protecaoArcana(enc, alvo, amount) {
  if (alvo.protecaoArcana) alvo.protecaoArcanaPv ??= alvo.protecaoArcana;
  if (!(alvo.protecaoArcanaPv > 0) || amount <= 0) return amount;
  const leva = Math.min(alvo.protecaoArcanaPv, amount);
  alvo.protecaoArcanaPv -= leva;
  enc.say('recurso', `A proteção arcana de ${alvo.name} absorve ${leva}${alvo.protecaoArcanaPv ? ` (restam ${alvo.protecaoArcanaPv})` : ' e se desfaz'}.`);
  return amount - leva;
}

/** AVERSÃO AO FOGO (o oblex): o fogo que o fere lhe dá desvantagem nos ataques até o fim do próximo turno dele. */
export function aversaoAoFogo(enc, alvo, tipo, amount) {
  if (tipo !== 'fogo' || amount <= 0 || alvo.dead || !alvo.traits?.includes('aversaoAoFogo')) return;
  addCondition(alvo, 'aversaoAoFogo', { rounds: 1, quando: 'fim', lado: alvo.side, source: alvo.id });
}

/** INDOMÁVEL (o campeão): a resistência que falhou se rola de novo, N vezes por dia. Devolve true se gastou um uso. */
export function indomavelMonstro(enc, actor) {
  if (!actor.traits?.includes('indomavelMonstro')) return false;
  actor.usosIndomavelRestantes ??= actor.usosIndomavel ?? 1;
  if (actor.usosIndomavelRestantes <= 0) return false;
  actor.usosIndomavelRestantes -= 1;
  enc.say('recurso', `${actor.name} não se dobra: rola a resistência de novo (Indomável).`);
  return true;
}

/**
 * PELE VENENOSA (o grung): quem o toca com a mão nua (o golpe desarmado, a arma natural) ou o agarra testa Constituição ou
 * fica envenenado por 1 minuto, repetindo no fim de cada turno.
 */
export function peleVenenosa(enc, quem, grung) {
  const p = grung?.peleVenenosa;
  if (!p || quem.dead || grung === quem) return;
  const s = enc.resistencia(quem, 'con', p.dc, { contra: { tipoDano: 'veneno', condicao: 'envenenado' } });
  if (s.success) return;
  if (enc.aplicarCondicao(quem, 'envenenado', { rounds: 10, source: grung.id, data: { save: 'con', dc: p.dc, repete: true } })) {
    enc.say('condicao', `A pele de ${grung.name} envenena ${quem.name}.`);
  }
}

/** A CARAPAÇA (o tortle): recolhe-se; +CA, caído, sem deslocamento e sem reação, até sair com uma ação bônus. */
export function entrarNaConcha(enc, m, a) {
  if (hasCondition(m, 'naConcha')) return false;
  addCondition(m, 'naConcha', { rounds: Infinity, source: m.id, data: { ca: a.ca ?? 4 } });
  addCondition(m, 'caido', { rounds: Infinity, source: m.id });
  m.reactionUsed = true;
  enc.say('acao', `${m.name} se recolhe na carapaça (+${a.ca ?? 4} na CA).`);
  return true;
}
export function sairDaConcha(enc, m) {
  if (!hasCondition(m, 'naConcha') || m.bonusUsed) return false;
  removeCondition(m, 'naConcha');
  removeCondition(m, 'caido');
  m.bonusUsed = true;
  enc.say('acao', `${m.name} sai da carapaça.`);
  return true;
}

/** O GOLPE DE AÇÃO BÔNUS (a Fúria Marcial): um golpe de perto com dano a mais; quem o dá fica exposto até o próximo turno. */
export function golpeBonus(enc, m, a, alvo) {
  // o golpe próprio da ação bônus (o Arremessar Membro do amálgama de troll, o Dardo de Cristal): entra na lista só para este golpe
  const golpe = a.golpe ?? (m.attacks ?? []).find((g) => !g.ranged);
  if (!alvo || !golpe) return false;
  const emprestado = a.golpe && !(m.attacks ?? []).includes(a.golpe);
  if (emprestado) m.attacks = [...(m.attacks ?? []), a.golpe];
  let r;
  try {
    if (!enc.canAttack(m, alvo, golpe.name).ok) return false;
    if (a.golpe) enc.say('acao', `${m.name} usa ${a.nome} (ação bônus).`);
    r = enc.resolveAttack(m, alvo, { weaponId: golpe.name });
  } finally { if (emprestado) m.attacks = m.attacks.filter((x) => x !== a.golpe); }
  if (r?.hit && !alvo.dead && a.extra) {
    const d = damageRoll(enc.rng, a.extra, { critical: !!r.critical });
    enc.say('magia', `${a.nome}: +${d.total} de ${a.extraTipo} em ${alvo.name}.`, `${a.extra}[${d.rolls.join('+')}]`);
    enc.applyDamage(alvo, d.total, a.extraTipo, m, { magico: true });
  }
  if (a.exposto) addCondition(m, 'exposto', { rounds: 1, quando: 'inicio', lado: m.side, source: m.id });
  return true;
}

/** O REBENTO de cada berço do Bigby, pelo nome original do bloco. */
export const REBENTO_DO_BERCO = {
  'Cradle of the Cloud Scion': 'Scion of Memnor', 'Cradle of the Fire Scion': 'Scion of Surtur', 'Cradle of the Frost Scion': 'Scion of Thrym',
  'Cradle of the Hill Scion': 'Scion of Grolantor', 'Cradle of the Stone Scion': 'Scion of Skoraeus', 'Cradle of the Storm Scion': 'Scion of Stronmaus',
};
/** O DESPERTAR DO REBENTO: o berço que cai a 0 PV solta o rebento na casa dele, na mesma vez da iniciativa. */
export function despertarORebento(enc, berco, { MONSTERS, makeMonster }) {
  if (!berco.traits?.includes('despertarDoRebento') || berco.rebentoDesperto) return null;
  const nome = REBENTO_DO_BERCO[berco.nomeOriginal];
  const id = Object.keys(MONSTERS).find((k) => MONSTERS[k].nomeOriginal === nome);
  if (!id) return null;
  berco.rebentoDesperto = true;
  const r = makeMonster(id, { x: berco.pos.x, y: berco.pos.y }, { rng: enc.rng });
  r.side = berco.side;
  r.acted = berco.acted;
  enc.addCombatant(r);
  enc.say('morte', `O berço se desfaz, e dele desperta ${r.name}.`);
  return r;
}

// ------------------------------------------------------------------------------ a terceira fila (2026-11-12) ----
// O que a fila `bestiario/<livro>-pendente.json` pedia em MAIS DE UMA criatura, ou o que cabia num molde que o motor já
// tinha. Tudo o que o importador leu da frase mora em `motorDoLivro` no bloco (`importar-bestiario.mjs tracoLido`), um
// campo só, para `monsters.js makeMonster` não ganhar uma linha por traço. Provas em `testes-fila-bestiario.mjs`.
const doLivro = (c) => c?.motorDoLivro ?? null;
/** O tipo de quem não declara tipo (o herói): humanoide. */
const tipoDe = (c) => c?.tipo ?? 'humanoide';
const vivo = (c) => c && !c.dead && c.hp > 0 && c.pos;

/**
 * O DANO DO PRIMEIRO ACERTO NO TURNO (as Presas Mentais, as Presas da Morte e o Discípulo do Veneno dos yuan-ti, o Golpe
 * Divino do Omin): uma vez por turno, no turno DELE, o primeiro golpe que acerta soma os dados. `tipo` nulo é o da arma.
 */
export function danoDoPrimeiroAcerto(enc, atacante, alvo, p) {
  const d = doLivro(atacante)?.primeiroAcerto;
  if (!d || !alvo || alvo.dead || (d.soCorpoACorpo && p.ranged) || enc.side !== atacante.side) return null;
  const k = enc.turnoKey();
  if (atacante.primeiroAcertoEm === k) return null;
  atacante.primeiroAcertoEm = k;
  return { damage: d.dados, type: d.tipo ?? p.type, nome: d.nome };
}

/**
 * OS PV TEMPORÁRIOS DE QUEM DERRUBA (a Bênção de Imix, a Bênção de Sseth, a Sede de Almas): quem zera a vida de um
 * inimigo ganha os PV, fixos ou a metade da vida máxima de quem caiu. Como todo PV temporário, não soma: fica o maior.
 */
export function pvTempAoDerrubar(enc, matador, vitima) {
  const v = doLivro(matador)?.pvTempAoDerrubar;
  if (!v || !vivo(matador) || !vitima || matador.side === vitima.side) return;
  const pv = v.pv === 'metade' ? Math.floor((vitima.maxHp ?? 0) / 2) : v.pv;
  if (pv <= (matador.tempHp ?? 0)) return;
  matador.tempHp = pv;
  enc.say('recurso', `${matador.name} ganha ${pv} PV temporários (${v.nome}).`);
}

/**
 * QUEM OBEDECE AO COMANDO: o aliado do tipo que o livro nomeia ("allied orcs", "allied duergar", "allied yugoloths",
 * "an allied demon"), pelo nome original do bloco e pelas marcas do tipo (`marcas`, as `tags` do 5etools). Sem tipo
 * nomeado, qualquer aliado.
 */
export function obedeceAoComando(c, aliado) {
  if (!aliado) return true;
  const nome = String(c.nomeOriginal ?? c.defId ?? c.name ?? '').toLowerCase();
  if ((c.marcas ?? []).includes(aliado)) return true;
  if (aliado === 'yugoloth') return /loth\b/.test(nome);
  return nome.includes(aliado);
}

/** Os aliados que o comando alcança e que têm a quem golpear de onde estão, cada um com o golpe e o alvo dele. */
export function comandaveis(enc, m, a) {
  const out = [];
  for (const c of enc.combatants) {
    if (c === m || c.side !== m.side || !vivo(c) || c.reactionUsed || conditionEffects(c).incapacitated) continue;
    if (distanceFt(m.pos, c.pos) > a.alcanceFt || !obedeceAoComando(c, a.aliado)) continue;
    let escolha = null;
    for (const g of (c.attacks ?? []).filter((x) => !a.corpoACorpo || !x.ranged)) {
      const alvo = enc.enemiesOf(c).filter((e) => vivo(e) && enc.canAttack(c, e, g.name).ok).sort((x, y) => x.hp - y.hp)[0];
      if (alvo) { escolha = { aliado: c, golpe: g.name, alvo }; break; }
    }
    if (escolha) out.push(escolha);
  }
  return out;
}

/**
 * O COMANDO (o Comando de Ilneval, o Chamado ao Ataque do senhor da guerra duergar, a Astúcia de Batalha do yagnoloth, o
 * Comando de Batalha do capitão drow, o Comandar Aliado lendário do senhor da guerra e do comandante githyanki, o Compelir
 * Demônio da matriarca): até `max` aliados gastam a REAÇÃO num golpe cada, com vantagem quando o livro dá.
 */
export function comandarAliados(enc, m, a) {
  const lista = comandaveis(enc, m, a).slice(0, a.max ?? 1);
  if (!lista.length) return false;
  enc.say('acao', `${m.name} dá a ordem (${a.nome}).`);
  for (const { aliado, golpe, alvo } of lista) {
    if (!vivo(alvo) || !vivo(aliado)) continue;
    aliado.reactionUsed = true;
    enc.say('reacao', `${aliado.name} ataca ${alvo.name} ao comando de ${m.name} (reação).`);
    if (a.vantagem) addCondition(alvo, 'alvoCerteiro', { rounds: 1, source: aliado.id });
    enc.resolveAttack(aliado, alvo, { weaponId: golpe });
    if (a.vantagem && getCondition(alvo, 'alvoCerteiro')?.source === aliado.id) removeCondition(alvo, 'alvoCerteiro');
  }
  return true;
}

/**
 * O GOLPE REFORÇADO (o Golpe Relampejante e o Golpe Trovejante dos mirmidões): UM golpe da arma nomeada que, acertando,
 * soma os dados e pede o teste da condição. Com `multi` (os Golpes Ígneos e Congelantes) é o multiataque inteiro, e cada
 * golpe que acerta soma: a ação marca o reforço e o multiataque de sempre o usa.
 */
export function golpeReforcado(enc, m, a, alvo) {
  if (a.multi) {
    m.reforcoDoTurno = { k: enc.turnoKey(), ...a };
    enc.say('acao', `${m.name} usa ${a.nome}: cada golpe que acertar neste turno soma ${a.extra} de ${a.extraTipo}.`);
    return true;
  }
  if (!alvo || !enc.canAttack(m, alvo, a.arma).ok) return false;
  enc.say('acao', `${m.name} usa ${a.nome}.`);
  m.reforcoDoTurno = { k: enc.turnoKey(), ...a };
  try { enc.resolveAttack(m, alvo, { weaponId: a.arma }); } finally { delete m.reforcoDoTurno; }
  return true;
}

/** O que o reforço do turno soma a ESTE acerto (o dano extra), e a condição que ele pede depois. */
export function reforcoDoAcerto(enc, atacante, alvo, p) {
  const r = atacante.reforcoDoTurno;
  if (!r || r.k !== enc.turnoKey() || !alvo || alvo.dead || (r.arma && p.name !== r.arma && !r.multi)) return null;
  return { damage: r.extra, type: r.extraTipo, nome: r.nome };
}
export function condicaoDoReforco(enc, atacante, alvo) {
  const r = atacante.reforcoDoTurno;
  if (!r || r.k !== enc.turnoKey() || !vivo(alvo) || !r.save) return;
  const sv = enc.resistencia(alvo, r.save, r.dc, { contra: { condicao: r.condition ?? null } });
  enc.explicarResistencia(alvo, r.save, r.dc, sv, { contra: r.nome, seSucesso: 'nada' });
  if (sv.success || enc.imuneACondicao(alvo, r.condition)) return;
  if (r.condition === 'caido') { addCondition(alvo, 'caido'); enc.say('condicao', `${alvo.name} vai ao chão (${r.nome}).`); return; }
  enc.aplicarCondicao(alvo, r.condition, { rounds: enc.side === atacante.side ? 2 : 1, quando: 'fim', lado: atacante.side, source: atacante.id });
  enc.say('condicao', `${alvo.name} fica ${r.condition} até o fim do próximo turno de ${atacante.name} (${r.nome}).`);
}

/** A DISPARADA (a Corrida Súbita do gnoll roedor de carne): até o fim do turno, +60 pés e nenhum ataque de oportunidade. */
export function disparada(enc, m, a) {
  // `doDeslocamento`: o deslocamento dele outra vez (o Correr); `provoca`: a investida que não livra do ataque de oportunidade
  const pes = a.pes ?? (a.doDeslocamento ? enc.speedOf(m) : 60);
  m.movementLeftFt = (m.movementLeftFt ?? enc.speedOf(m)) + pes;
  if (!a.provoca) m.disengaging = true;
  enc.say('acao', `${m.name} dispara (${a.nome}): +${pes} pés${a.provoca ? '' : ', e ninguém o pega no caminho'}.`);
  return true;
}

/**
 * A DESVANTAGEM NAS RESISTÊNCIAS de quem está perto (o Fardo do Tempo do tecelão sombrio, o Desespero Infernal do Hutijin,
 * a Aura da Loucura da cria estelar): o livro dá a todos no raio, menos a quem é do tipo que o dono poupa. Devolve o nome.
 */
export function desvantagemDeAura(enc, t) {
  if (!t?.pos) return null;
  for (const m of enc.combatants) {
    const a = doLivro(m)?.desvantagemNasResistencias;
    if (!a || m === t || !vivo(m) || conditionEffects(m).incapacitated || distanceFt(m.pos, t.pos) > a.raioFt) continue;
    if (a.soTipos && !a.soTipos.includes(tipoDe(t))) continue;
    if (a.poupaTipos?.includes(tipoDe(t)) || (a.poupaNome && String(t.nomeOriginal ?? '').toLowerCase().includes(a.poupaNome))) continue;
    return a.nome;
  }
  return null;
}

/**
 * OS ATAQUES CONTRA ELE COM DESVANTAGEM (o Movimento Borrado do velocino, a Forma Borrada da nuvem espectral, a Vantagem
 * Defensiva do Splugoth): o motivo, ou null.
 */
export function desvantagemContraEle(enc, atacante, alvo) {
  const d = doLivro(alvo)?.desvantagemContraEle;
  if (!d || conditionEffects(alvo).incapacitated) return null;
  if (d.salvoContido && hasCondition(alvo, 'contido')) return null;
  if (d.salvoPerto && atacante?.pos && distanceFt(atacante.pos, alvo.pos) <= d.salvoPerto) return null;
  if (d.aliadosColados) {
    const n = enc.combatants.filter((c) => c !== alvo && c.side === alvo.side && vivo(c) && !conditionEffects(c).incapacitated && distanceFt(c.pos, alvo.pos) <= 5).length;
    if (n < d.aliadosColados) return null;
  }
  return d.nome;
}

/** O DANO EM VOLTA DE QUEM É FERIDO (o Respingo Venenoso do troll venenoso, a Repreensão Psíquica do troll mutante). */
export function respingoAoSerFerido(enc, alvo, amount, type) {
  const r = doLivro(alvo)?.aoSerFerido;
  if (!r || amount <= 0 || enc.respingando || (r.exceto ?? []).includes(type) || (r.so && !r.so.includes(type))) return;
  enc.respingando = true;
  try {
    const atingidos = enc.combatants.filter((c) => c !== alvo && vivo(c) && distanceFt(alvo.pos, c.pos) <= r.raioFt);
    if (!atingidos.length) return;
    const d = r.dano === 'oMesmo' ? { total: amount, rolls: [amount] } : damageRoll(enc.rng, r.dano);
    const tipo = r.tipo ?? type;
    enc.say('dano', `${r.nome}: ${atingidos.map((c) => c.name).join(', ')} ${atingidos.length > 1 ? 'sofrem' : 'sofre'} ${d.total} de ${tipo}.`, r.dano === 'oMesmo' ? '' : `${r.dano}[${d.rolls.join('+')}]`);
    for (const c of atingidos) enc.applyDamage(c, d.total, tipo, alvo, { magico: true });
  } finally { enc.respingando = false; }
}

/**
 * NO COMEÇO DO TURNO DO DONO (`combat.js inicioDoTurnoDoBloco`): o Corpo Espinhoso fere quem o agarra; o Sobrevivente (o
 * senhor da guerra) se refaz enquanto está abaixo da metade.
 */
export function inicioDoTurnoDoDono(enc, c) {
  // o AGARRÃO SEPULCRAL: quem ainda está preso por ele no começo do turno dele vira pedra
  for (const t of enc.combatants) {
    const g = getCondition(t, 'agarrado');
    if (t.dead || g?.source !== c.id || !g.data?.petrificaNoInicio) continue;
    removeCondition(t, 'agarrado');
    if (enc.imuneACondicao(t, 'petrificado')) continue;
    enc.aplicarCondicao(t, 'petrificado', { rounds: Infinity, source: c.id });
    enc.say('condicao', `${t.name} não escapou da mão de ${c.name} e vira pedra.`);
  }
  const L = doLivro(c);
  if (!L || !vivo(c)) return;
  if (L.rapidezAberrante && enc.enemiesOf(c).length) rapidezAberrante(enc, c);
  if (L.coracaoDoDragao) coracaoDoDragao(enc, c);
  banimentoNoComeco(enc, c);
  if (L.furiaDeVaprak && !c.vaprakUsada && enc.enemiesOf(c).length) {
    c.vaprakUsada = true;
    addCondition(c, 'furiaDeVaprak', { rounds: 10, source: c.id });
    enc.say('recurso', `${c.name} entra na fúria (${L.furiaDeVaprak.nome}).`);
  }
  if (L.feridaQuemAgarra) {
    // quem o agarra é a fonte do agarrado DELE
    for (const t of enc.combatants.filter((x) => vivo(x) && (c.conditions ?? []).some((k) => k.id === 'agarrado' && k.source === x.id))) {
      const d = damageRoll(enc.rng, L.feridaQuemAgarra.dano);
      enc.say('dano', `${t.name} se fere em ${c.name} (${L.feridaQuemAgarra.nome}): ${d.total} perfurante.`, `${L.feridaQuemAgarra.dano}[${d.rolls.join('+')}]`);
      enc.applyDamage(t, d.total, 'perfurante', c);
    }
  }
  if (L.sobrevivente && c.hp >= 1 && c.hp < c.maxHp / 2) {
    const antes = c.hp;
    c.hp = Math.min(c.maxHp, c.hp + L.sobrevivente.pv);
    enc.say('cura', `${c.name} se refaz: +${c.hp - antes} PV (${L.sobrevivente.nome}).`);
  }
}

/**
 * NO COMEÇO DO TURNO DE CADA UM, o que os donos em volta fazem (`combat.js beginSide`): a Presença Pútrida dos bulezaus (UM
 * teste, 1d6 mais 1 por bulezau a 9 m), o Peso das Eras do mercador de almas (−6 m de deslocamento a 1,5 m dele), o Mestre
 * da Sepultura (o morto-vivo aliado a 9 m do senhor das caveiras se refaz 1d6).
 */
export function inicioDoTurnoPerto(enc, t) {
  if (!vivo(t)) return;
  const donos = enc.combatants.filter((m) => m !== t && vivo(m) && doLivro(m) && !conditionEffects(m).incapacitated);
  const podres = donos.filter((m) => m.motorDoLivro.presencaPodre && tipoDe(t) !== 'corruptor' && distanceFt(m.pos, t.pos) <= m.motorDoLivro.presencaPodre.raioFt);
  if (podres.length) {
    const p = podres[0].motorDoLivro.presencaPodre;
    const sv = enc.resistencia(t, 'con', p.dc, { contra: { tipoDano: 'necrótico' } });
    const r = enc.explicarResistencia(t, 'con', p.dc, sv, { contra: p.nome, seSucesso: 'nada' });
    if (!sv.success) {
      const d = damageRoll(enc.rng, p.dano);
      const total = d.total + podres.length;
      enc.say('dano', `${t.name} sente a carne apodrecer (${p.nome}): ${total} necrótico.`, `${r.conta} · ${p.dano}[${d.rolls.join('+')}] + ${podres.length}`, { rolagem: r });
      enc.applyDamage(t, total, 'necrótico', podres[0], { magico: true });
    }
  }
  const peso = donos.find((m) => m.motorDoLivro.pesoDasEras && m.side !== t.side && ['fera', 'humanoide'].includes(tipoDe(t)) && distanceFt(m.pos, t.pos) <= 5);
  if (peso && vivo(t)) {
    t.movementLeftFt = Math.max(0, (t.movementLeftFt ?? enc.speedOf(t)) - 20);
    enc.say('condicao', `${t.name} sente o peso das eras perto de ${peso.name}: 6 m a menos neste turno.`);
  }
  // o FOMENTAR A LOUCURA do alkilith (quem não é demônio, a 9 m) e as auras que a ação bônus liga (a Mortalha de Almas, a Fumaça
  // Incendiária: o dado mora na condição do dono, `data.auraNoInicio`)
  fomentarLoucura(enc, t, donos);
  auraDaCondicao(enc, t);
  const mestre = donos.find((m) => m.motorDoLivro.mestreDaSepultura && m.side === t.side && tipoDe(t) === 'morto-vivo' && distanceFt(m.pos, t.pos) <= 30);
  if (mestre && vivo(t) && t.hp < t.maxHp) {
    const d = damageRoll(enc.rng, '1d6');
    const curou = enc.heal(t, d.total, mestre);
    if (curou) enc.say('cura', `${t.name} se refaz perto de ${mestre.name} (${mestre.motorDoLivro.mestreDaSepultura.nome}): +${curou} PV.`);
  }
}

/** O MESTRE DA SEPULTURA também dá vantagem nas resistências do morto-vivo aliado a 9 m. */
export function vantagemDoMestre(enc, t) {
  if (tipoDe(t) !== 'morto-vivo' || !t.pos) return false;
  return enc.combatants.some((m) => m !== t && vivo(m) && m.side === t.side && doLivro(m)?.mestreDaSepultura && distanceFt(m.pos, t.pos) <= 30);
}

/**
 * NO FIM DO TURNO (`combat.js fimDoTurnoDoLado`): a Degeneração Rançosa do troll apodrecido fere quem está colado no fim
 * do turno DELE, menos se ele levou ácido ou fogo desde o fim do último; a Aura da Aniquilação do bodak fere quem TERMINA o
 * turno a 9 m dele, menos o morto-vivo e o corruptor.
 */
export function fimDoTurnoDoLivro(enc, c) {
  if (!c?.pos) return;
  const rancosa = doLivro(c)?.fimDoDono;
  if (rancosa && vivo(c)) {
    if (c.fimDoDonoBloqueado) enc.say('recurso', `${c.name} não exala a podridão neste turno: ${rancosa.bloqueia.join(' e ')} a seguraram.`);
    else {
      for (const t of enc.combatants.filter((x) => x !== c && vivo(x) && distanceFt(c.pos, x.pos) <= rancosa.raioFt)) {
        const d = damageRoll(enc.rng, rancosa.dano);
        enc.say('dano', `${t.name} sofre a podridão de ${c.name} (${rancosa.nome}): ${d.total} de ${rancosa.tipo}.`, `${rancosa.dano}[${d.rolls.join('+')}]`);
        enc.applyDamage(t, d.total, rancosa.tipo, c, { magico: true });
      }
    }
    c.fimDoDonoBloqueado = false;
  }
  if (!vivo(c)) return;
  for (const m of enc.combatants) {
    const a = doLivro(m)?.fimDoAlvo;
    if (!a || m === c || !vivo(m) || conditionEffects(m).incapacitated || distanceFt(m.pos, c.pos) > a.raioFt) continue;
    if ((a.poupaTipos ?? []).includes(tipoDe(c))) continue;
    enc.say('dano', `${c.name} termina o turno perto de ${m.name} (${a.nome}): ${a.dano} de ${a.tipo}.`);
    enc.applyDamage(c, a.dano, a.tipo, m, { magico: true });
    if (!vivo(c)) return;
  }
}

/** O dano que corta a Degeneração Rançosa (ácido ou fogo) fica marcado até o fim do turno dele. */
export function marcarBloqueioDoFim(alvo, type) {
  if (doLivro(alvo)?.fimDoDono?.bloqueia?.includes(type)) alvo.fimDoDonoBloqueado = true;
}

/** O SANGUE INFLAMÁVEL (o pescador das cavernas): com metade da vida ou menos, vulnerável a fogo. */
export const vulneravelFerido = (alvo, type) => doLivro(alvo)?.vulneravelFerido?.tipo === type && alvo.hp <= alvo.maxHp / 2;

/** O DESVIO DE PROJÉTIL de monstro (o adepto de artes marciais, a Rosie): os dados que ele tira do dano. */
export const desvioDeProjetil = (alvo) => doLivro(alvo)?.desviarProjetil ?? null;

/** A MAGIA DE GUERRA (o gish githyanki, o consorte drow): conjurou com a ação, golpeia com a ação bônus. */
export function magiaDeGuerra(enc, m) {
  if (!doLivro(m)?.magiaDeGuerra || m.bonusUsed || !vivo(m) || enc.side !== m.side) return false;
  const golpes = (m.attacks ?? []).filter((g) => !g.ranged);
  for (const g of golpes) {
    const alvo = enc.enemiesOf(m).filter((e) => vivo(e) && enc.canAttack(m, e, g.name).ok).sort((x, y) => x.hp - y.hp)[0];
    if (!alvo) continue;
    m.bonusUsed = true;
    enc.say('acao', `${m.name} emenda a magia num golpe (${doLivro(m).magiaDeGuerra.nome}, ação bônus).`);
    enc.resolveAttack(m, alvo, { weaponId: g.name });
    return true;
  }
  return false;
}

// ---------------------------------------------------------------- a terceira fila, segunda leva (2026-11-12) ----
// As reações que protegem o aliado, o +10 no ataque, a vantagem por condição, ficar invisível, animar os aliados, o
// revide de quem vê um da matilha cair, e as explosões do orthon e do déspota duergar.

/** O INTERCEPTAR (o defensor de pedra): o aliado colado que ia ser acertado ganha +5 de CA, com a reação dele. */
export function interceptar(enc, atacante, alvo, atk, ac) {
  if (!atk.hit || atk.critical || !alvo?.pos) return null;
  for (const c of enc.combatants) {
    const d = doLivro(c)?.interceptar;
    if (!d || c === alvo || c.side !== alvo.side || !vivo(c) || c.reactionUsed || conditionEffects(c).incapacitated) continue;
    if (distanceFt(c.pos, alvo.pos) > 5 || atk.total >= ac + d.bonus) continue;
    c.reactionUsed = true;
    enc.say('reacao', `${c.name} se põe na frente de ${alvo.name} (${d.nome}, +${d.bonus} de CA).`);
    return { bonus: d.bonus, nome: d.nome };
  }
  return null;
}

/** O GOLPE GUIADO (o sacerdote da guerra, o Omin): o ataque do aliado a até 9 m que ia errar ganha +10, com a reação. */
export function golpeGuiado(enc, atacante, alvo, atk, ac) {
  if (atk.hit || atk.natural === 1 || !atacante?.pos) return null;
  for (const c of enc.combatants) {
    const d = doLivro(c)?.golpeGuiado;
    if (!d || c.side !== atacante.side || !vivo(c) || c.reactionUsed || conditionEffects(c).incapacitated) continue;
    if (distanceFt(c.pos, atacante.pos) > d.alcanceFt || atk.total + d.bonus < ac) continue;
    c.reactionUsed = true;
    enc.say('reacao', `${c.name} guia o golpe de ${atacante.name}: +${d.bonus} (${d.nome}).`);
    return { bonus: d.bonus };
  }
  return null;
}

/**
 * DEPOIS DO ACERTO, ANTES DO DANO: quem toma o golpe no lugar do alvo. O Guarda-Costas Leal (o merregon toma o golpe do
 * corruptor colado), o Servo Protetor (quem a Zuggtmoy enfeitiçou, colado nela, toma o golpe dela) e a Curvatura do Espaço
 * (o vidente troca de lugar com outra cria estelar a até 18 m, que leva o golpe). E o Campo de Invisibilidade do orthon,
 * que acaba quando ele é acertado.
 */
export function quemTomaOGolpe(enc, atacante, alvo) {
  if (!alvo?.pos) return null;
  const inv = getCondition(alvo, 'invisivel');
  if (inv?.data?.acabaAoSerAtingido) { removeCondition(alvo, 'invisivel'); enc.say('magia', `${alvo.name} reaparece ao ser acertado.`); }
  const livre = (c) => vivo(c) && !c.reactionUsed && !conditionEffects(c).incapacitated;
  for (const c of enc.combatants) {
    const d = doLivro(c)?.guardaCostas;
    if (!d || c === alvo || c === atacante || c.side !== alvo.side || !livre(c) || distanceFt(c.pos, alvo.pos) > 5) continue;
    if (d.tipo && tipoDe(alvo) !== d.tipo) continue;
    c.reactionUsed = true;
    enc.say('reacao', `${c.name} se joga na frente e toma o golpe de ${alvo.name} (${d.nome}).`);
    return c;
  }
  const L = doLivro(alvo);
  // o ENCANTO INSTINTIVO (o amnizu, o encantador): quem o ataca a até X testa Sabedoria, ou o golpe vai para a criatura
  // mais perto do atacante (aqui depois do acerto, como os outros que trocam quem leva o golpe)
  if (L?.encantoInstintivo && livre(alvo) && !(L.encantoInstintivo.usoUnico && alvo.encantoUsado) && atacante?.pos
    && distanceFt(atacante.pos, alvo.pos) <= L.encantoInstintivo.alcanceFt && !(atacante.imuneAoEncantoDe ?? []).includes(alvo.id)) {
    const outro = enc.combatants.filter((c) => c !== alvo && c !== atacante && vivo(c))
      .sort((x, y) => distanceFt(atacante.pos, x.pos) - distanceFt(atacante.pos, y.pos))[0];
    if (outro) {
      alvo.reactionUsed = true;
      if (L.encantoInstintivo.usoUnico) alvo.encantoUsado = true;
      const sv = enc.resistencia(atacante, 'wis', L.encantoInstintivo.dc, { contra: { magico: true, condicao: 'enfeiticado' } });
      if (!sv.success) {
        enc.say('reacao', `${alvo.name} desvia o golpe com um encanto (${L.encantoInstintivo.nome}): ${atacante.name} acerta ${outro.name}.`);
        return outro;
      }
      if (L.encantoInstintivo.imunizaAoPassar) (atacante.imuneAoEncantoDe ??= []).push(alvo.id);
      enc.say('reacao', `${atacante.name} resiste ao encanto de ${alvo.name}.`);
    }
  }
  if (L?.servoProtetor) {
    const servo = enc.combatants.find((c) => c !== alvo && c !== atacante && livre(c) && distanceFt(c.pos, alvo.pos) <= 5
      && (c.conditions ?? []).some((k) => k.id === 'enfeiticado' && k.source === alvo.id));
    if (servo) { servo.reactionUsed = true; enc.say('reacao', `${servo.name}, enfeitiçado, toma o golpe no lugar de ${alvo.name} (${L.servoProtetor.nome}).`); return servo; }
  }
  if (L?.curvarEspaco && livre(alvo)) {
    const outro = enc.combatants.find((c) => c !== alvo && c !== atacante && c.side === alvo.side && vivo(c)
      && /star spawn/i.test(c.nomeOriginal ?? '') && distanceFt(c.pos, alvo.pos) <= L.curvarEspaco.alcanceFt);
    if (outro) {
      alvo.reactionUsed = true;
      const a = { ...alvo.pos };
      alvo.pos = { ...alvo.pos, x: outro.pos.x, y: outro.pos.y };
      outro.pos = { ...outro.pos, x: a.x, y: a.y };
      enc.say('reacao', `${alvo.name} entorta o espaço e troca de lugar com ${outro.name}, que leva o golpe (${L.curvarEspaco.nome}).`);
      return outro;
    }
  }
  return null;
}

/**
 * A VANTAGEM (ou a desvantagem) NO ATAQUE por condição: a Formação em Falange (um duergar aliado colado), a Vantagem na
 * Água (dentro d'água), a Companhia (o Solitário: dois por perto, vantagem; senão, desvantagem), o Matador (na primeira
 * rodada, contra quem ainda não agiu) e o Oportunista (no ataque de oportunidade).
 */
export function vantagemNoAtaque(enc, atacante, alvo, { opportunity = false } = {}) {
  // o VÍNCULO BESTIAL (Xanathar): a fera vinculada, contra quem está a 1,5 m de quem conjurou
  const vinc = getCondition(atacante, 'vinculoBestial');
  if (vinc && alvo?.pos) {
    const dono = enc.combatants.find((c) => c.id === vinc.source && vivo(c) && c.pos);
    if (dono && distanceFt(dono.pos, alvo.pos) <= 5) return { modo: 'vantagem', motivo: 'Vínculo Bestial' };
  }
  const L = doLivro(atacante);
  if (hasCondition(atacante, 'chamadoAHonra')) return { modo: 'vantagem', motivo: 'Chamado à Honra' };
  if (hasCondition(atacante, 'furiaDaBoca')) return { modo: 'vantagem', motivo: 'a fúria da fome' };
  if (!L || !atacante.pos) return null;
  // a quinta leva: a Fome de Vida e a Raiva Crescente (o Raivoso ataca com desvantagem se ninguém o feriu)
  if (hasCondition(atacante, 'fomeDeVida')) return { modo: 'vantagem', motivo: L.fomeDeVida?.nome ?? 'Fome de Vida' };
  if (L.raivaCrescente) return hasCondition(atacante, 'raivaCrescente') ? { modo: 'vantagem', motivo: L.raivaCrescente.nome } : { modo: 'desvantagem', motivo: `${L.raivaCrescente.nome}, ninguém o feriu` };
  if (L.oportunista && opportunity) return { modo: 'vantagem', motivo: L.oportunista.nome };
  if (L.matador && enc.round === 1 && alvo && enc.firstSide !== alvo.side) return { modo: 'vantagem', motivo: L.matador.nome };
  if (L.vantagemNaAgua && enc.field.aguas?.has(key(atacante.pos.x, atacante.pos.y))) return { modo: 'vantagem', motivo: L.vantagemNaAgua.nome };
  if (L.falange && enc.combatants.some((c) => c !== atacante && c.side === atacante.side && vivo(c)
    && /duergar/i.test(c.nomeOriginal ?? c.name ?? '') && distanceFt(c.pos, atacante.pos) <= 5)) return { modo: 'vantagem', motivo: L.falange.nome };
  if (L.companhia) {
    const n = enc.combatants.filter((c) => c !== atacante && vivo(c) && distanceFt(c.pos, atacante.pos) <= 30).length;
    return { modo: n >= 2 ? 'vantagem' : 'desvantagem', motivo: L.companhia.nome };
  }
  return null;
}

/**
 * FICAR INVISÍVEL (a Mescla de Sombra do mastim, o Campo de Invisibilidade do orthon, o Sumir do gato sorridente, a
 * Invisibilidade Compartilhada do duergar): até atacar; o orthon também ao ser acertado. O mastim só na penumbra ou no escuro.
 */
export function sumir(enc, m, a) {
  if (hasCondition(m, 'invisivel')) return false;
  if (a.soNoEscuro && luzEm(enc, m.pos) >= CLARO) return false;
  addCondition(m, 'invisivel', { rounds: 600, source: m.id, data: { ...(a.acabaAoSerAtingido ? { acabaAoSerAtingido: true } : {}) } });
  enc.say('magia', `${m.name} some da vista (${a.nome}).`);
  return true;
}

/**
 * ANIMAR OS ALIADOS (o Comando Infernal do Bael e do narzugon, a Reunir as Tropas do kith'rak, a Incitar o Fanatismo do
 * abishai vermelho, o Favor Volúvel de Lolth da matriarca): até `max` aliados no raio perdem o medo e o encanto (`remove`)
 * e/ou ganham a condição (`condicao`), e o favor de Lolth cobra o dano dela.
 */
export function animarAliados(enc, m, a) {
  const alvos = enc.combatants.filter((c) => c.side === m.side && vivo(c) && distanceFt(c.pos, m.pos) <= a.raioFt && (a.incluiSi || c !== m)
    && (!a.remove || a.condicao || (c.conditions ?? []).some((k) => a.remove.includes(k.id))))
    .sort((x, y) => (x === m) - (y === m) || distanceFt(x.pos, m.pos) - distanceFt(y.pos, m.pos))
    .slice(0, a.max ?? 99);
  if (!alvos.length) return false;
  enc.say('acao', `${m.name} usa ${a.nome}.`);
  for (const c of alvos) {
    for (const id of a.remove ?? []) if (hasCondition(c, id)) { removeCondition(c, id); enc.say('condicao', `${c.name} não está mais ${id}.`); }
    if (a.condicao) {
      const r = a.ateFimDoProximoTurno ? { rounds: enc.side === m.side ? 2 : 1, quando: 'fim', lado: m.side } : { rounds: a.rounds ?? 10 };
      addCondition(c, a.condicao, { ...r, source: m.id });
    }
    if (a.dano) {
      const d = damageRoll(enc.rng, a.dano);
      enc.say('dano', `${c.name} paga o favor: ${d.total} de ${a.tipoDano}.`, `${a.dano}[${d.rolls.join('+')}]`);
      enc.applyDamage(c, d.total, a.tipoDano, m, { magico: true });
    }
  }
  return true;
}

/** O GOLPE VINGADOR (o gnoll definhado): um gnoll aliado cai a 9 m, e ele gasta a reação num golpe de perto. */
export function golpeVingador(enc, morto, matador) {
  for (const c of enc.combatants) {
    const d = doLivro(c)?.vinganca;
    if (!d || c === morto || c.side !== morto.side || !vivo(c) || c.reactionUsed || conditionEffects(c).incapacitated) continue;
    if (!morto.pos || distanceFt(c.pos, morto.pos) > d.raioFt || !obedeceAoComando(morto, d.aliado)) continue;
    const golpe = (c.attacks ?? []).find((g) => !g.ranged);
    if (!golpe) continue;
    const alvo = [matador, ...enc.enemiesOf(c)].find((e) => vivo(e) && enc.canAttack(c, e, golpe.name).ok);
    if (!alvo) continue;
    c.reactionUsed = true;
    enc.say('reacao', `${c.name} vê ${morto.name} cair e golpeia ${alvo.name} (${d.nome}, reação).`);
    enc.resolveAttack(c, alvo, { weaponId: golpe.name });
  }
}

/** A EXPLOSÃO DE QUEM FICA MUITO FERIDO (a Retribuição Explosiva do orthon): a 15 PV ou menos, explode e morre. */
export function explodeFerido(enc, alvo) {
  const d = doLivro(alvo)?.explodeFerido;
  if (!d || alvo.explodiu || alvo.dead || alvo.hp > d.limiar || alvo.reactionUsed || conditionEffects(alvo).incapacitated) return false;
  alvo.explodiu = true;
  alvo.reactionUsed = true;
  enc.say('reacao', `${alvo.name} explode (${d.nome})!`);
  for (const t of enc.combatants.filter((x) => x !== alvo && vivo(x) && distanceFt(alvo.pos, x.pos) <= d.raioFt)) {
    const sv = enc.resistencia(t, d.save, d.dc, { contra: { tipoDano: d.tipo, magico: true } });
    const r = enc.explicarResistencia(t, d.save, d.dc, sv, { contra: d.nome, seSucesso: 'metade do dano' });
    for (const [dd, tp] of [[d.dano, d.tipo], [d.dano2, d.tipo2]]) {
      if (!dd || !vivo(t)) continue;
      const x = damageRoll(enc.rng, dd);
      const total = sv.success ? Math.floor(x.total / 2) : x.total;
      enc.say('dano', `${t.name} sofre ${total} de ${tp}.`, `${r.conta} · ${dd}[${x.rolls.join('+')}]`, { rolagem: r });
      if (total) enc.applyDamage(t, total, tp, alvo, { magico: true });
    }
  }
  if (!alvo.dead) enc.morrer(alvo, d.nome);
  return true;
}

/** O MOTOR PSÍQUICO (o déspota duergar): o crítico nele, ou a queda a 0 PV, solta 4d6 psíquico em quem está colado. */
export function motorPsiquico(enc, alvo) {
  const d = doLivro(alvo)?.motorPsiquico;
  if (!d || !alvo.pos) return;
  const atingidos = enc.combatants.filter((x) => x !== alvo && vivo(x) && distanceFt(alvo.pos, x.pos) <= d.raioFt);
  if (!atingidos.length) return;
  const x = damageRoll(enc.rng, d.dano);
  enc.say('dano', `O motor de ${alvo.name} estoura (${d.nome}): ${x.total} psíquico em ${atingidos.map((c) => c.name).join(', ')}.`, `${d.dano}[${x.rolls.join('+')}]`);
  for (const t of atingidos) enc.applyDamage(t, x.total, 'psíquico', alvo, { magico: true });
}

// ---------------------------------------------------------------- a quarta leva da fila (2026-11-16) ----
// As reações que mexem no dano antes de ele entrar, a magia que poupa os aliados, o mago-larva que se alimenta de quem
// falha, a salamandra que o fogo recarrega, o arqueiro que mira com cuidado e a leucrota que coiceia e recua.

/**
 * QUANTOS ALIADOS A MAGIA POUPA (`combat.js castSpell`, pela Cuidadosa): o Esculpir Magias do evocador (só evocação,
 * 1 + o círculo) e o Arcano do Exército do devastador hobgoblin (todos os aliados e ele). 0 é nenhum.
 */
export function aliadosPoupados(actor, spell) {
  const L = doLivro(actor);
  if (L?.arcanoDoExercito) return 99;
  if (L?.esculpirMagias && spell.school === 'evocação') return 1 + (spell.level ?? 0);
  return 0;
}

/** Uma casa livre a até `pes` de quem some (a nevasca do lamento gélido), a mais longe de quem o feriu, que ele vê. */
function casaParaSumir(enc, m, longeDe, pes) {
  const f = enc.field;
  const r = Math.floor(pes / 5);
  let melhor = null;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const x = m.pos.x + dx; const y = m.pos.y + dy;
      if (!f.inside(x, y) || f.blocksMove(x, y) || enc.at(x, y)) continue;
      if (!f.hasLineOfSight(m.pos, { x, y })) continue;
      const d = longeDe?.pos ? distanceFt({ x, y }, longeDe.pos) : 0;
      if (!melhor || d > melhor.d) melhor = { x, y, d };
    }
  }
  return melhor;
}

/**
 * AS REAÇÕES ANTES DO DANO. Do próprio alvo: a Reversão da Sorte do nilbog (o dano vira 0 e ele cura 1d6), a Adaptação
 * Rápida do caçador de ovos (ganha resistência ao tipo, que já vale para este dano) e a Fuga na Nevasca do lamento gélido
 * (só contra ataque: metade do dano, e some para uma casa a até 9 m). Dos outros: o Elo Protetor do espreitador de gemas
 * (o aliado a até 9 m perde 3d6 do dano, que o espreitador toma para si) e as Palavras Desarmantes do orador dracônico (o
 * inimigo a até 18 m dele tira 1d6 do dano). Cada uma gasta a reação de quem a usa. Devolve o dano que sobra.
 */
export function reacaoAntesDoDano(enc, alvo, amount, type, source, { deAtaque = false } = {}) {
  if (!source || source === alvo || amount <= 0 || !alvo.pos) return amount;
  const livre = (c) => vivo(c) && !c.reactionUsed && !conditionEffects(c).incapacitated;
  const L = doLivro(alvo);
  // o ABSORVER GOLPE do Splugoth: o golpe de arma de perto que o acerta não entra
  if (L?.absorverGolpe && livre(alvo) && deAtaque && source.pos && distanceFt(source.pos, alvo.pos) <= 10 && !source.ranged) {
    alvo.reactionUsed = true;
    enc.say('reacao', `A arma de ${source.name} fica presa na energia de ${alvo.name}: o golpe não entra (${L.absorverGolpe.nome}).`);
    return 0;
  }
  if (L && livre(alvo)) {
    if (L.reverterSorte) {
      alvo.reactionUsed = true;
      const cura = damageRoll(enc.rng, L.reverterSorte.cura ?? '1d6').total;
      alvo.hp = Math.min(alvo.maxHp, alvo.hp + cura);
      enc.say('reacao', `${alvo.name} vira a sorte (${L.reverterSorte.nome}): o golpe não pega, e ele ganha ${cura} PV.`);
      return 0;
    }
    if (L.adaptarAoDano && type && !(alvo.resist ?? []).includes(type) && !(alvo.immune ?? []).includes(type)) {
      alvo.reactionUsed = true;
      alvo.resist = [...(alvo.resist ?? []), type];
      enc.say('reacao', `${alvo.name} se adapta (${L.adaptarAoDano.nome}): passa a resistir a ${type}.`);
      amount = Math.floor(amount / 2);
    }
    if (L.fugaNaNevasca && deAtaque && amount > 0) {
      alvo.reactionUsed = true;
      amount = Math.floor(amount / 2);
      const p = casaParaSumir(enc, alvo, source, L.fugaNaNevasca.alcanceFt ?? 30);
      if (p) alvo.pos = { ...alvo.pos, x: p.x, y: p.y };
      enc.say('reacao', `${alvo.name} se desfaz numa nevasca (${L.fugaNaNevasca.nome}): metade do dano${p ? ', e reaparece adiante' : ''}.`);
    }
  }
  for (const c of enc.combatants) {
    if (amount <= 0) break;
    const d = doLivro(c);
    if (!d || c === alvo || !livre(c)) continue;
    if (d.eloProtetor && c.side === alvo.side && distanceFt(c.pos, alvo.pos) <= (d.eloProtetor.alcanceFt ?? 30)) {
      const tira = Math.min(amount, damageRoll(enc.rng, d.eloProtetor.dados ?? '3d6').total);
      c.reactionUsed = true;
      amount -= tira;
      enc.say('reacao', `${c.name} puxa para si ${tira} do dano de ${alvo.name} (${d.eloProtetor.nome}).`);
      enc.applyDamage(c, tira, type, source, { transferido: true });
      continue;
    }
    if (d.palavrasDesarmantes && source.side !== c.side && source.pos && distanceFt(c.pos, source.pos) <= (d.palavrasDesarmantes.alcanceFt ?? 60)) {
      const tira = damageRoll(enc.rng, d.palavrasDesarmantes.dados ?? '1d6').total;
      c.reactionUsed = true;
      amount = Math.max(0, amount - tira);
      enc.say('reacao', `${c.name} fala por cima do golpe de ${source.name} (${d.palavrasDesarmantes.nome}): ${tira} a menos de dano.`);
    }
  }
  return amount;
}

/** ALIMENTAR-SE DA FRAQUEZA (o mago-larva cria estelar): alguém a até 6 m dele falha um teste, e ele ganha 10 PV temporários. */
export function aoFalharResistencia(enc, quem) {
  if (!quem?.pos) return;
  for (const c of enc.combatants) {
    const d = doLivro(c)?.alimentarDaFraqueza;
    if (!d || c === quem || !vivo(c) || c.reactionUsed || conditionEffects(c).incapacitated) continue;
    if (distanceFt(c.pos, quem.pos) > (d.raioFt ?? 20)) continue;
    c.reactionUsed = true;
    c.tempHp = Math.max(c.tempHp ?? 0, d.pv ?? 10);
    enc.say('reacao', `${c.name} se alimenta da fraqueza de ${quem.name} (${d.nome}): ${d.pv ?? 10} PV temporários.`);
  }
}

/** A FÚRIA ARDENTE (a salamandra glacial): o dano de fogo recarrega o sopro na hora. */
export function fogoRecarrega(enc, alvo, type) {
  const d = doLivro(alvo)?.fogoRecarrega;
  if (!d || type !== 'fogo' || !alvo.recarregando) return;
  const presos = Object.keys(alvo.recarregando).filter((k) => alvo.recarregando[k]);
  if (!presos.length) return;
  for (const k of presos) alvo.recarregando[k] = false;
  enc.say('recurso', `O fogo atiça ${alvo.name} (${d.nome}): o sopro recarrega.`);
}

/**
 * O OLHO DO ARQUEIRO (o arqueiro, 3 por dia): a ação bônus soma 1d10 a um ataque de arco. Usado só quando o dado pode
 * virar o erro em acerto — o livro deixa decidir antes de rolar, e gastar onde não muda nada seria jogar fora.
 */
export function olhoDoArqueiro(enc, atacante, atk, ac, p) {
  const d = doLivro(atacante)?.olhoDoArqueiro;
  if (!d || atk.hit || atk.natural === 1 || !p.ranged || atacante.bonusUsed || atk.total + 10 < ac) return null;
  atacante.usosDoLivro ??= {};
  const usados = atacante.usosDoLivro.olhoDoArqueiro ?? 0;
  if (usados >= (d.usos ?? 3)) return null;
  atacante.usosDoLivro.olhoDoArqueiro = usados + 1;
  atacante.bonusUsed = true;
  const x = enc.rng.die(10);
  enc.say('acao', `${atacante.name} mira com cuidado (${d.nome}): +${x} no ataque.`);
  return { bonus: x };
}

/** COICES E RECUO (a leucrota): depois do golpe de cascos, ela se desengaja com a ação bônus. */
export function coiceERecua(enc, atacante, p) {
  const d = doLivro(atacante)?.coiceERecua;
  if (!d || atacante.bonusUsed || atacante.dead || (d.arma && p.name !== d.arma)) return;
  enc.disengage(atacante, { bonus: true });
  enc.say('acao', `${atacante.name} coiceia e recua (${d.nome}).`);
}

// ---------------------------------------------------------------- a quinta leva da fila (2026-11-16) ----
// O dano que acende um estado (o choque do sapomoth, o frio do leviatã, a raiva do Raivoso), a cura que acende a fome do
// Faminto, o dano a mais desses dois, a colheita do necromante, o comedor de vida, a ação a mais do estrangulador, as
// cabeças da dracohidra que pegam brecha e o gigante que não se deixa empurrar.

/** Até o fim do PRÓXIMO turno de `c`. */
const ateOFimDoProximo = (enc, c) => ({ rounds: enc.side === c.side ? 2 : 1, quando: 'fim', lado: c.side });

/** O ESTADO QUE O DANO ACENDE: a Suscetibilidade ao Choque (relâmpago), o Congelamento Parcial (50 de frio num turno) e a Raiva. */
export function estadoPeloDano(enc, alvo, amount, type, source) {
  const L = doLivro(alvo);
  if (!L || amount <= 0 || alvo.dead) return;
  if (L.choqueEletrico && type === 'elétrico' && !hasCondition(alvo, 'emChoque')) {
    addCondition(alvo, 'emChoque', { ...ateOFimDoProximo(enc, alvo), source: alvo.id });
    enc.say('condicao', `O relâmpago atravessa ${alvo.name} (${L.choqueEletrico.nome}): lento até o fim do próximo turno.`);
  }
  if (L.congelamentoParcial && type === 'frio') {
    const k = enc.turnoKey();
    if (alvo.frioNoTurno?.k !== k) alvo.frioNoTurno = { k, total: 0 };
    alvo.frioNoTurno.total += amount;
    if (alvo.frioNoTurno.total >= L.congelamentoParcial.limiar && !hasCondition(alvo, 'congeladoEmParte')) {
      addCondition(alvo, 'congeladoEmParte', { ...ateOFimDoProximo(enc, alvo), source: alvo.id });
      enc.say('condicao', `${alvo.name} congela em parte (${L.congelamentoParcial.nome}).`);
    }
  }
  if (L.raivaCrescente && source && source !== alvo) {
    if (!hasCondition(alvo, 'raivaCrescente')) enc.say('condicao', `${alvo.name} se enfurece (${L.raivaCrescente.nome}).`);
    removeCondition(alvo, 'raivaCrescente');
    addCondition(alvo, 'raivaCrescente', { ...ateOFimDoProximo(enc, alvo), source: alvo.id });
    alvo.raivaGolpeExtra = true;
  }
}

/** A FOME DE VIDA (o Faminto): quem ele vê recuperar PV o deixa com vantagem e a mordida mais pesada. */
export function aoCurar(enc, curado) {
  if (!curado?.pos) return;
  for (const c of enc.combatants) {
    const d = doLivro(c)?.fomeDeVida;
    if (!d || c === curado || !vivo(c) || !enc.field.hasLineOfSight(c.pos, curado.pos)) continue;
    if (!hasCondition(c, 'fomeDeVida')) enc.say('condicao', `${c.name} vê ${curado.name} se curar, e a fome cresce (${d.nome}).`);
    removeCondition(c, 'fomeDeVida');
    addCondition(c, 'fomeDeVida', { ...ateOFimDoProximo(enc, c), source: c.id });
  }
}

/** O DANO A MAIS no acerto: o primeiro gancho do Raivoso enfurecido (3d12 psíquico) e a mordida do Faminto com fome (4d10 necrótico). */
export function danoExtraDoEstado(enc, atacante, alvo, p) {
  const L = doLivro(atacante);
  if (!L || !alvo || alvo.dead || enc.side !== atacante.side) return null;
  if (L.raivaCrescente && atacante.raivaGolpeExtra && hasCondition(atacante, 'raivaCrescente') && (!L.raivaCrescente.arma || p.name === L.raivaCrescente.arma)) {
    atacante.raivaGolpeExtra = false;
    return { damage: L.raivaCrescente.dados, type: 'psíquico', nome: L.raivaCrescente.nome };
  }
  if (L.fomeDeVida && hasCondition(atacante, 'fomeDeVida') && (!L.fomeDeVida.arma || p.name === L.fomeDeVida.arma)) {
    return { damage: L.fomeDeVida.dados, type: 'necrótico', nome: L.fomeDeVida.nome };
  }
  if (L.furiaDeVaprak && hasCondition(atacante, 'furiaDeVaprak') && !p.ranged) return { damage: '4', type: p.type, nome: L.furiaDeVaprak.nome };
  return null;
}

/** A COLHEITA SINISTRA (o necromante, 1 por turno): matar com magia de 1º círculo ou mais devolve 2x o círculo (3x se necromancia). */
export function colheitaSinistra(enc, morto, matador) {
  const d = doLivro(matador)?.colheitaSinistra;
  const magia = enc.magiaEmCurso;
  if (!d || !vivo(matador) || enc.conjuradorEmCurso !== matador || !magia || (magia.level ?? 0) < 1) return;
  if (['constructo', 'morto-vivo'].includes(tipoDe(morto))) return;
  const k = enc.turnoKey();
  if (matador.colheuEm === k) return;
  matador.colheuEm = k;
  const cura = magia.level * (magia.school === 'necromancia' ? 3 : 2);
  const antes = matador.hp;
  matador.hp = Math.min(matador.maxHp, matador.hp + cura);
  enc.say('cura', `${matador.name} colhe a vida de ${morto.name} (${d.nome}): +${matador.hp - antes} PV.`);
}

/** O COMEDOR DE VIDA (o andarilho noturno): quem ele leva a 0 PV morre, sem teste contra a morte. */
export const comedorDeVida = (fonte) => doLivro(fonte)?.comedorDeVida ?? null;

/** A RAPIDEZ ABERRANTE (o estrangulador): uma ação a mais, uma vez até descansar (no jogo, uma vez por luta). */
export function rapidezAberrante(enc, c) {
  const d = doLivro(c)?.rapidezAberrante;
  if (!d || c.rapidezUsada || !vivo(c)) return;
  c.rapidezUsada = true;
  c.extraActions = (c.extraActions ?? 0) + 1;
  enc.say('recurso', `${c.name} se move rápido demais (${d.nome}): uma ação a mais neste turno.`);
}

/** AS CABEÇAS REATIVAS (a dracohidra): uma reação a mais por cabeça além da primeira, só para ataque de oportunidade. */
export function temCabecaReativa(enc, e) {
  const d = doLivro(e)?.cabecasReativas;
  if (!d || !vivo(e)) return false;
  const usadas = e.cabecasUsadas?.rodada === enc.round ? e.cabecasUsadas.n : 0;
  return usadas < Math.max(0, (e.cabecas ?? d.cabecas ?? 5) - 1);
}
export function gastarCabecaReativa(enc, e) {
  if (!e.reactionUsed || !temCabecaReativa(enc, e)) return false;
  const n = e.cabecasUsadas?.rodada === enc.round ? e.cabecasUsadas.n : 0;
  e.cabecasUsadas = { rodada: enc.round, n: n + 1 };
  enc.say('recurso', `Outra cabeça de ${e.name} aproveita a brecha (${doLivro(e).cabecasReativas.nome}).`);
  return true;
}

/** INABALÁVEL (o gigante de pedra da terra maligna): a reação faz passar no teste contra ser derrubado, e o empurrão não o move. */
export function inabalavel(enc, c) {
  const d = doLivro(c)?.inabalavel;
  if (!d || !vivo(c) || c.reactionUsed || conditionEffects(c).incapacitated) return false;
  c.reactionUsed = true;
  enc.say('reacao', `${c.name} finca os pés (${d.nome}): não se move nem cai.`);
  return true;
}

// ---------------------------------------------------------------- a sexta leva da fila (2026-11-16) ----
// O dano que volta (o abraço do Perdido, o rebento que se alimenta, o espelho psíquico do brutamontes), o dado depois da
// jogada (a sorte do bruxo do corruptor, a instrução do senhor da guerra duergar), a fúria de Vaprak e os banimentos.

/** DEPOIS DO DANO: o Abraço que Aperta do Perdido (4d8 psíquico em quem ele agarra) e o Alimentar do rebento (3d6 em quem engoliu, e cura 10). */
export function danoQueVolta(enc, alvo) {
  const L = doLivro(alvo);
  if (!L || !vivo(alvo) || alvo.reactionUsed || conditionEffects(alvo).incapacitated) return;
  if (L.abracoQueAperta) {
    const presos = enc.combatants.filter((c) => vivo(c) && (c.conditions ?? []).some((k) => k.id === 'agarrado' && k.source === alvo.id));
    if (presos.length) {
      alvo.reactionUsed = true;
      for (const t of presos) {
        const x = damageRoll(enc.rng, L.abracoQueAperta.dados);
        enc.say('dano', `${alvo.name} aperta ${t.name} (${L.abracoQueAperta.nome}): ${x.total} psíquico.`, `${L.abracoQueAperta.dados}[${x.rolls.join('+')}]`);
        enc.applyDamage(t, x.total, 'psíquico', alvo, { magico: true });
      }
    }
  }
  if (L.alimentarDoEngolido && !alvo.reactionUsed) {
    const dentro = engolidosDe(enc, alvo);
    if (dentro.length) {
      alvo.reactionUsed = true;
      for (const t of dentro) {
        const x = damageRoll(enc.rng, L.alimentarDoEngolido.dados);
        enc.say('dano', `${alvo.name} se alimenta de ${t.name} (${L.alimentarDoEngolido.nome}): ${x.total} energético.`, `${L.alimentarDoEngolido.dados}[${x.rolls.join('+')}]`);
        enc.applyDamage(t, x.total, 'energético', alvo, { magico: true, deDentro: true });
      }
      alvo.hp = Math.min(alvo.maxHp, alvo.hp + L.alimentarDoEngolido.cura);
    }
  }
}

/**
 * O ESPELHO PSÍQUICO (o brutamontes cria estelar): o dano psíquico nele vai para cada criatura a até 3 m, e ele não leva
 * nada. Dois brutamontes juntos não se devolvem para sempre: quem está espelhando não espelha de novo.
 */
export function espelhoPsiquico(enc, alvo, amount, type, source) {
  const d = doLivro(alvo)?.espelhoPsiquico;
  if (!d || type !== 'psíquico' || amount <= 0 || !alvo.pos || enc.espelhando) return amount;
  enc.espelhando = true;
  try {
    const perto = enc.combatants.filter((c) => c !== alvo && vivo(c) && distanceFt(c.pos, alvo.pos) <= (d.raioFt ?? 10));
    enc.say('reacao', `A mente de ${alvo.name} devolve o golpe (${d.nome})${perto.length ? `: ${perto.map((c) => c.name).join(', ')} sentem no lugar dele` : ''}.`);
    for (const c of perto) enc.applyDamage(c, amount, 'psíquico', source ?? alvo, { magico: true, transferido: true });
  } finally { enc.espelhando = false; }
  return 0;
}

/**
 * O DADO DEPOIS DA JOGADA, num teste que falhou: a Sorte do Próprio Sombrio do bruxo do corruptor (+1d10 nele mesmo, uma
 * vez por luta) e a Instrução Cortante do senhor da guerra duergar (+1d6 ao aliado que ele vê, que paga 1d6 psíquico, com
 * a reação). Só é gasto quando o dado pode virar a falha em sucesso. Devolve o quanto somar.
 */
export function dadoDepoisDaJogada(enc, quem, total, dc) {
  const L = doLivro(quem);
  if (L?.sorteDoSombrio && !quem.sorteUsada && total + 10 >= dc) {
    quem.sorteUsada = true;
    const x = enc.rng.die(10);
    enc.say('recurso', `${quem.name} conta com a sorte do patrono (${L.sorteDoSombrio.nome}): +${x}.`);
    return x;
  }
  return instrucaoCortante(enc, quem, total, dc);
}

/** A INSTRUÇÃO CORTANTE: o senhor da guerra duergar soma 1d6 à jogada do aliado que ia falhar, e o aliado paga 1d6 psíquico. */
export function instrucaoCortante(enc, quem, total, dc) {
  if (!quem?.pos || (quem.immune ?? []).includes('psíquico') || total + 6 < dc) return 0;
  for (const c of enc.combatants) {
    const d = doLivro(c)?.instrucaoCortante;
    if (!d || c === quem || c.side !== quem.side || !vivo(c) || c.reactionUsed || conditionEffects(c).incapacitated) continue;
    if (!enc.field.hasLineOfSight(c.pos, quem.pos)) continue;
    c.reactionUsed = true;
    const x = enc.rng.die(6);
    const dor = damageRoll(enc.rng, '1d6').total;
    enc.say('reacao', `${c.name} grita uma ordem a ${quem.name} (${d.nome}): +${x}, ao preço de ${dor} psíquico.`);
    enc.applyDamage(quem, dor, 'psíquico', c, { magico: true });
    return x;
  }
  return 0;
}

/**
 * OS BANIMENTOS NO COMEÇO DO TURNO: o cão yeth sob a luz do sol vai para o Plano Etéreo, e o barghest dentro de chamas de
 * 3 m ou mais (uma zona de fogo que dura, não uma explosão) testa Carisma ou vai para a Geena. Os dois saem da luta.
 */
export function banimentoNoComeco(enc, c) {
  const L = doLivro(c);
  if (!L || !vivo(c) || hasCondition(c, 'banidoDoPlano')) return;
  let banido = null;
  if (L.banidoPeloSol && soboSol(enc.field)) banido = `a luz do sol o manda para o Plano Etéreo (${L.banidoPeloSol.nome})`;
  if (!banido && L.banidoPeloFogo && c.pos) {
    const chamas = enc.zonasEm(c.pos).some((z) => z.dano?.tipo === 'fogo' && (z.casas?.size ?? 0) >= 2);
    if (chamas) {
      const sv = enc.resistencia(c, 'cha', L.banidoPeloFogo.dc, { contra: { magico: true } });
      if (!sv.success) banido = `as chamas o arrastam de volta para a Geena (${L.banidoPeloFogo.nome})`;
    }
  }
  if (!banido) return;
  addCondition(c, 'banidoDoPlano', { rounds: 99999, source: c.id });
  c.naoSeguraALuta = true;
  enc.say('condicao', `${c.name} some: ${banido}.`);
  enc.checkEnd?.();
}

// ---------------------------------------------------------------- a sétima leva da fila (2026-11-16) ----

/** CULTIVAR A PAZ (o eladrin do outono): o golpe de quem ele enfeitiçou, a até 18 m dele e à vista, erra. */
export function cultivarAPaz(enc, atacante, atk) {
  if (!atk.hit || !atacante?.pos) return false;
  for (const c of enc.combatants) {
    const d = doLivro(c)?.cultivarAPaz;
    if (!d || !vivo(c) || c.reactionUsed || conditionEffects(c).incapacitated) continue;
    if (!(atacante.conditions ?? []).some((k) => k.id === 'enfeiticado' && k.source === c.id)) continue;
    if (distanceFt(c.pos, atacante.pos) > (d.alcanceFt ?? 60) || !enc.field.hasLineOfSight(c.pos, atacante.pos)) continue;
    c.reactionUsed = true;
    enc.say('reacao', `${c.name} acalma ${atacante.name} no meio do golpe (${d.nome}): erra.`);
    return true;
  }
  return false;
}

/** A casa está escura o bastante para o Passo das Sombras (penumbra ou breu). */
export const naSombra = (enc, pos) => luzEm(enc, pos) < CLARO;

// ---------------------------------------------------------------- a oitava leva da fila (2026-11-16) ----

/** O ALCANCE MORTAL (a garra de osso): quem ENTRA no alcance dela provoca o golpe, e o acerto dá um segundo. */
export const alcanceMortal = (e) => doLivro(e)?.alcanceMortal ?? null;

/** A POSTURA RASTEJANTE (o fomoriano rastejador das profundezas): caído, rastejar não custa mais, e o caído não dá vantagem. */
export const posturaRastejante = (c) => Boolean(doLivro(c)?.posturaRastejante);

/**
 * A LÍNGUA (o sapomoth): um alvo até Médio a até 6 m testa Força, ou é puxado para a casa livre ao lado dele; e então a
 * mordida, com a ação bônus.
 */
export function puxarComALingua(enc, m, a, alvo) {
  if (!alvo || !vivo(alvo) || distanceFt(m.pos, alvo.pos) > a.alcanceFt) return false;
  // o FILAMENTO do pescador das cavernas: só puxa quem o fio já prende
  if (a.soAgarrado && !presoPor(alvo, m)) return false;
  if (a.tamanhoMax && categoriaDeTamanho(alvo) > categoriaDeTamanho({ size: a.tamanhoMax })) return false;
  enc.say('acao', `${m.name} lança a língua em ${alvo.name} (${a.nome}).`);
  const sv = enc.resistencia(alvo, a.save, a.dc, { contra: { empurrao: true } });
  const r = enc.explicarResistencia(alvo, a.save, a.dc, sv, { contra: a.nome, seSucesso: 'não é puxado' });
  if (sv.success) { enc.say('condicao', `${alvo.name} se segura.`, r.conta, { rolagem: r }); return true; }
  const livres = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const x = m.pos.x + dx; const y = m.pos.y + dy;
    if ((dx || dy) && enc.field.inside(x, y) && !enc.field.blocksMove(x, y) && !enc.at(x, y)) livres.push({ x, y });
  }
  livres.sort((p, q) => distanceFt(p, alvo.pos) - distanceFt(q, alvo.pos));
  if (livres[0]) alvo.pos = { ...alvo.pos, x: livres[0].x, y: livres[0].y };
  enc.say('condicao', `${alvo.name} é puxado para junto de ${m.name}.`, r.conta, { rolagem: r });
  const mordida = (m.attacks ?? []).find((g) => g.name === a.mordida) ?? (m.attacks ?? []).find((g) => !g.ranged);
  if (mordida && !m.bonusUsed && vivo(alvo)) {
    m.bonusUsed = true;
    enc.resolveAttack(m, alvo, { weaponId: mordida.name });
  }
  return true;
}

// ---------------------------------------------------------------- a nona leva da fila (2026-11-16) ----

/**
 * O CORAÇÃO DO DRAGÃO (o kobold escudo dracônico): amedrontado ou paralisado por algo que tem teste, ele repete o teste no
 * começo do turno; passando, o efeito acaba nele e em todo kobold a até 9 m.
 */
export function coracaoDoDragao(enc, c) {
  const d = doLivro(c)?.coracaoDoDragao;
  const k = (c.conditions ?? []).find((x) => ['amedrontado', 'paralisado'].includes(x.id) && x.data?.save && x.data?.dc);
  if (!d || !k) return;
  const sv = enc.resistencia(c, k.data.save, k.data.dc, { contra: { condicao: k.id } });
  if (!sv.success) return;
  const kobolds = enc.combatants.filter((x) => vivo(x) && x.side === c.side && distanceFt(x.pos, c.pos) <= 30
    && /kobold/i.test(`${x.nomeOriginal ?? ''} ${x.name ?? ''}`));
  for (const x of kobolds) removeCondition(x, k.id);
  enc.say('condicao', `${c.name} ruge (${d.nome}): o medo e a paralisia somem dele e dos kobolds por perto.`);
}

/** A VANTAGEM ARCANA (o devastador hobgoblin, 1 por turno): o ataque de magia que fere quem está colado num aliado dele soma 2d6. */
export function vantagemArcana(enc, m, alvo, tipo) {
  const d = doLivro(m)?.vantagemArcana;
  if (!d || !vivo(alvo)) return;
  const k = enc.turnoKey();
  if (m.vantagemArcanaEm === k) return;
  const aliado = enc.combatants.some((c) => c !== m && c.side === m.side && vivo(c) && !conditionEffects(c).incapacitated && distanceFt(c.pos, alvo.pos) <= 5);
  if (!aliado) return;
  m.vantagemArcanaEm = k;
  const x = damageRoll(enc.rng, d.dados ?? '2d6');
  enc.say('dano', `${m.name} aproveita a brecha que o aliado abriu (${d.nome}): +${x.total}.`, `${d.dados ?? '2d6'}[${x.rolls.join('+')}]`);
  enc.applyDamage(alvo, x.total, tipo, m, { magico: true });
}

// ---------------------------------------------------------------- a décima leva da fila (2026-11-16) ----

/** O sorteio de um efeito por criatura (os Raios Prismáticos): um d6 escolhe a entrada de `a.sorteio` cujo intervalo o contém. */
export function sortearOEfeito(enc, a) {
  const x = enc.rng.die(6);
  const e = a.sorteio.find((o) => x >= o.de && x <= o.ate) ?? a.sorteio[0];
  enc.say('acao', `${a.nome}: ${e.nome} (d6 = ${x}).`);
  return { damage: e.damage, damageType: e.damageType, condition: e.condition, ateFimDoTurnoDele: true };
}

/** REVIVER UM ALIADO (o Erguer Carniçal do maurezhi): o morto do tipo certo a até X volta com toda a vida. */
export function reviverAliado(enc, m, a, alvo) {
  // o nome do livro, e o do bloco feito à mão que não o guarda (o `ghoul` e o `livido` de sempre)
  const nomesDe = (c) => [c.nomeOriginal, c.defId, c.name].filter(Boolean).join(' ');
  const APELIDO = { ghast: 'ghast|l[ií]vido' };
  const serve = (c) => c && c.dead && c.side === m.side && c.pos && distanceFt(m.pos, c.pos) <= (a.alcanceFt ?? 30)
    && (a.nomes ?? []).some((n) => new RegExp(APELIDO[n] ?? n, 'i').test(nomesDe(c)));
  const morto = serve(alvo) ? alvo : enc.combatants.find(serve);
  if (!morto) return false;
  morto.dead = false;
  morto.hp = morto.maxHp;
  morto.conditions = [];
  morto.acted = true;
  enc.say('cura', `${m.name} chama ${morto.name} de volta, com toda a vida (${a.nome}).`);
  return true;
}

// ---------------------------------------------------------------- a décima primeira leva da fila (2026-11-16) ----

const sobrepoe = (c, p, f) => {
  const g = c.pos.f ?? 1;
  return c.pos.x < p.x + f && p.x < c.pos.x + g && c.pos.y < p.y + f && p.y < c.pos.y + g;
};

/**
 * O CAMINHO DE QUEM ATROPELA (o colosso de geada, a bocarra de Yeenoghu): em linha reta para o destino, até o
 * deslocamento dele, atravessando quem cabe no tamanho do livro; para na parede e em quem é grande demais, e termina na
 * última casa sem ninguém. Devolve o caminho e os inimigos em que entrou (sem gastar nada: a IA o usa para escolher).
 */
export function trajetoDoAtropelo(enc, m, a, destino) {
  if (!destino || !m.pos) return null;
  const f = m.pos.f ?? 1;
  const passos = Math.floor((a.pes ?? enc.speedOf(m) ?? m.speedFt ?? 30) / 5);
  const dx0 = destino.x - m.pos.x;
  const dy0 = destino.y - m.pos.y;
  const n = Math.max(Math.abs(dx0), Math.abs(dy0));
  if (!n) return null;
  const caminho = [{ ...m.pos }];
  for (let i = 1; i <= passos; i++) {
    const p = { x: Math.round(m.pos.x + (dx0 / n) * i), y: Math.round(m.pos.y + (dy0 / n) * i), f };
    let barra = false;
    for (let yy = 0; yy < f && !barra; yy++) for (let xx = 0; xx < f; xx++) {
      if (!enc.field.inside(p.x + xx, p.y + yy) || enc.field.blocksMove(p.x + xx, p.y + yy)) { barra = true; break; }
    }
    if (barra) break;
    if (enc.combatants.some((c) => c !== m && !c.dead && c.hp > 0 && c.pos && sobrepoe(c, p, f) && !cabeNoTamanho(c, a.tamanhoMax ?? 'medium'))) break;
    caminho.push(p);
  }
  // quem AGARRA (a bocarra) para logo depois do último inimigo em que entrou: a carga que segue adiante não segura ninguém
  if (a.agarra) {
    const ultimo = caminho.findLastIndex((p, i) => i > 0 && enc.enemiesOf(m).some((c) => !c.dead && c.hp > 0 && c.pos && sobrepoe(c, p, f)));
    if (ultimo > 0) {
      const livre = caminho.findIndex((p, i) => i > ultimo && !enc.combatants.some((c) => c !== m && !c.dead && c.pos && sobrepoe(c, p, f)));
      if (livre > 0) caminho.length = livre + 1;
    }
  }
  while (caminho.length > 1 && enc.combatants.some((c) => c !== m && !c.dead && c.pos && sobrepoe(c, caminho.at(-1), f))) caminho.pop();
  const vitimas = enc.enemiesOf(m).filter((c) => !c.dead && c.hp > 0 && c.pos && caminho.slice(1).some((p) => sobrepoe(c, p, f)));
  return { caminho, vitimas };
}

/** ATROPELAR: anda o caminho e cada inimigo em que entrou faz o teste (dano; o lento até o começo do próximo turno do dono; o agarrão). */
export function atropelar(enc, m, a, alvo) {
  const t = trajetoDoAtropelo(enc, m, a, alvo?.pos ?? alvo);
  if (!t || !t.vitimas.length || t.caminho.length < 2) return false;
  const de = { ...m.pos };
  m.pos = { ...t.caminho.at(-1), f: m.pos.f ?? 1 };
  m.movementLeftFt = 0;
  enc.onEvent({ type: 'moved', actor: m, from: de, to: { ...m.pos }, path: t.caminho.map((p) => ({ ...p })) });
  enc.say('acao', `${m.name} usa ${a.nome} e passa por cima de ${t.vitimas.map((v) => v.name).join(', ')}.`);
  // a INVESTIDA DE ESCUDO: o golpe em cada um, e o empurrão de quem é acertado e falha a Força
  if (a.golpe) { investidaDeEscudo(enc, m, a, t); return true; }
  for (const v of t.vitimas) {
    if (v.dead || v.hp <= 0) continue;
    const sv = enc.resistencia(v, a.save, a.dc, { contra: { tipoDano: a.damageType } });
    const r = enc.explicarResistencia(v, a.save, a.dc, sv, { contra: a.nome, seSucesso: a.halfOnSave ? 'metade do dano' : 'nada' });
    const d = damageRoll(enc.rng, a.damage);
    const total = sv.success ? (a.halfOnSave ? Math.floor(d.total / 2) : 0) : d.total;
    if (total) enc.applyDamage(v, total, a.damageType, m);
    enc.say('dano', `${v.name} ${sv.success ? 'resiste' : 'falha'} e sofre ${total} de ${a.damageType}.`, `${r.conta} · ${a.damage}[${d.rolls.join('+')}]`, { rolagem: r });
    if (sv.success || v.dead || v.hp <= 0) continue;
    if (a.lento && !enc.imuneACondicao(v, 'lento')) enc.aplicarCondicao(v, 'lento', { rounds: 1, quando: 'inicio', lado: m.side, source: m.id });
    if (a.agarra) {
      const jaPreso = getCondition(v, 'agarrado')?.source === m.id;
      if (jaPreso && a.agarra.caiSeJaPreso) { if (!enc.imuneACondicao(v, 'caido')) enc.aplicarCondicao(v, 'caido', { source: m.id }); continue; }
      // um preso por vez, e só quem ficou ao lado dele no fim da carga (o agarrão de longe não tem como segurar)
      const outro = enc.combatants.some((c) => c !== v && !c.dead && getCondition(c, 'agarrado')?.source === m.id);
      if (outro || !enc.field.vizinhos(m.pos, v.pos) || enc.imuneACondicao(v, 'agarrado')) continue;
      enc.aplicarCondicao(v, 'agarrado', { rounds: Infinity, source: m.id, data: { escape: a.agarra.escape } });
      if (a.agarra.contido && !enc.imuneACondicao(v, 'contido')) enc.aplicarCondicao(v, 'contido', { rounds: Infinity, source: m.id, data: { comOAgarrao: m.id } });
      enc.say('condicao', `${v.name} fica preso em ${m.name} (escape CD ${a.agarra.escape}).`);
    }
  }
  return true;
}

/** A CURA CORROMPIDA (o oinoloth): o alvo do lado dele volta com toda a vida, perde uma condição, ganha exaustão e o máximo cai. */
export function curaCorrompida(enc, m, a, alvo) {
  if (!alvo || alvo.dead || alvo.side !== m.side || !alvo.pos || distanceFt(m.pos, alvo.pos) > (a.alcanceFt ?? 5)) return false;
  alvo.hp = alvo.maxHp;
  const tirou = ['paralisado', 'cego', 'envenenado', 'surdo'].find((c) => hasCondition(alvo, c));
  if (tirou) removeCondition(alvo, tirou);
  mudarExaustao(alvo, 1);
  const cai = Math.min(damageRoll(enc.rng, a.reduzDados ?? '2d6').total, alvo.maxHp);
  alvo.maxHp -= cai;
  alvo.maxHpPerdido = (alvo.maxHpPerdido ?? 0) + cai;
  if (alvo.hp > alvo.maxHp) alvo.hp = alvo.maxHp;
  enc.say('cura', `${m.name} toca ${alvo.name} (${a.nome}): toda a vida de volta${tirou ? `, sem ficar ${tirou}` : ''}, mas um nível de exaustão e ${cai} de PV máximo a menos.`);
  if (alvo.maxHp <= 0) enc.morrer(alvo, 'a cura corrompida');
  return true;
}

/** A CABEÇADA do giff: no fim de 6 m em linha reta, quem está ao lado e cabe no tamanho faz o teste, ou dano e caído. Uma por turno. */
export function investidaDeCabeca(enc, m) {
  const L = doLivro(m)?.investidaDeCabeca;
  if (!L || m.dead || enc.side !== m.side) return;
  const reta = m.retaAndada;
  if (!reta || reta.pes < L.pes || m.cabecadaEm === enc.turnoKey()) return;
  const alvo = enc.enemiesOf(m).filter((c) => !c.dead && c.hp > 0 && c.pos && enc.field.vizinhos(m.pos, c.pos) && cabeNoTamanho(c, L.tamanhoMax))
    .sort((x, y) => Number(Math.sign(y.pos.x - m.pos.x) === reta.dx && Math.sign(y.pos.y - m.pos.y) === reta.dy) - Number(Math.sign(x.pos.x - m.pos.x) === reta.dx && Math.sign(x.pos.y - m.pos.y) === reta.dy))[0];
  if (!alvo) return;
  m.cabecadaEm = enc.turnoKey();
  const sv = enc.resistencia(alvo, L.save, L.dc, { contra: { condicao: 'caido' } });
  const r = enc.explicarResistencia(alvo, L.save, L.dc, sv, { contra: L.nome, seSucesso: 'nada' });
  if (sv.success) { enc.say('condicao', `${alvo.name} aguenta a cabeçada de ${m.name}.`, r.conta, { rolagem: r }); return; }
  const d = damageRoll(enc.rng, L.dano);
  enc.applyDamage(alvo, d.total, L.tipo, m);
  enc.say('dano', `${m.name} vem de cabeça baixa (${L.nome}): ${d.total} de ${L.tipo} em ${alvo.name}.`, r.conta, { rolagem: r });
  if (!alvo.dead && alvo.hp > 0 && !enc.imuneACondicao(alvo, 'caido')) enc.aplicarCondicao(alvo, 'caido', { source: m.id });
}

/** A SEDE DE SANGUE do flind: quem tem o Rampage, a até 3 m de um flind que não está incapacitado, morde com a ação bônus. */
export function mordidaDaSede(enc, m) {
  if (m.dead || m.hp <= 0 || m.bonusUsed || !m.traits?.includes('rampage') || !m.pos || enc.side !== m.side) return;
  const flind = enc.combatants.find((c) => c.side === m.side && vivo(c) && doLivro(c)?.sedeDeSangue && !conditionEffects(c).incapacitated
    && distanceFt(c.pos, m.pos) <= doLivro(c).sedeDeSangue.raioFt);
  if (!flind) return;
  const mordida = m.attacks?.find((g) => /mordida/i.test(g.name));
  const alvo = mordida && enc.enemiesOf(m).filter((e) => !e.dead && e.hp > 0 && e.pos && enc.field.vizinhos(m.pos, e.pos)).sort((x, y) => x.hp - y.hp)[0];
  if (!alvo) return;
  m.bonusUsed = true;
  enc.say('acao', `${m.name} sente a ${doLivro(flind).sedeDeSangue.nome ?? 'sede de sangue'} de ${flind.name} e morde ${alvo.name} (ação bônus).`);
  enc.resolveAttack(m, alvo, { weaponId: mordida.name });
}

// ---------------------------------------------------------------- a décima segunda leva da fila (2026-11-16) ----

/**
 * O VELO ABSORVENTE do carneiro gigante: passou na resistência contra uma magia, ou o ataque de magia errou, e com a
 * reação ele dispara o golpe do livro (o Disparo de Energia) em quem conjurou. Recarga 6.
 */
export function veloAbsorvente(enc, alvo, conjurador) {
  const V = doLivro(alvo)?.veloAbsorvente;
  if (!V || !vivo(alvo) || !vivo(conjurador) || conjurador.side === alvo.side || alvo.reactionUsed || conditionEffects(alvo).incapacitated) return;
  if (V.recarga && alvo.recarregando?.[V.nome]) return;
  const golpe = alvo.attacks?.find((g) => g.name === V.arma);
  if (!golpe || distanceFt(alvo.pos, conjurador.pos) > (golpe.rangeFt ?? golpe.longRangeFt ?? 120)) return;
  alvo.reactionUsed = true;
  if (V.recarga) (alvo.recarregando ??= {})[V.nome] = true;
  enc.say('reacao', `${alvo.name} absorve a magia e a devolve em ${conjurador.name} (${V.nome}).`);
  const guarda = enc.magiaEmCurso; const quem = enc.conjuradorEmCurso;
  enc.magiaEmCurso = null; enc.conjuradorEmCurso = null;
  try { enc.resolveAttack(alvo, conjurador, { weaponId: golpe.name }); } finally { enc.magiaEmCurso = guarda; enc.conjuradorEmCurso = quem; }
}

/**
 * BLOQUEAR O CAMINHO (o ogro aríete): quem tenta sair do alcance dele enquanto a postura dura faz o teste de Força, ou
 * fica parado ali. Devolve true se o passo foi barrado.
 */
export function barraASaida(enc, actor, from, to) {
  for (const o of enc.enemiesOf(actor)) {
    const b = getCondition(o, 'bloqueandoOCaminho');
    if (!b || !vivo(o) || conditionEffects(o).incapacitated) continue;
    const alcance = enc.reachOf(o);
    if (distanceFt(o.pos, from) > alcance || distanceFt(o.pos, to) <= alcance) continue;
    const sv = enc.resistencia(actor, 'str', b.data?.dc ?? 14, { contra: { condicao: 'parado' } });
    const r = enc.explicarResistencia(actor, 'str', b.data?.dc ?? 14, sv, { contra: 'Bloquear o Caminho', seSucesso: 'passa' });
    if (sv.success) { enc.say('condicao', `${actor.name} força a passagem por ${o.name}.`, r.conta, { rolagem: r }); continue; }
    actor.detidoEm = enc.turnoKey();
    actor.movementLeftFt = 0;
    enc.say('condicao', `${o.name} fecha o caminho: ${actor.name} não sai do lugar.`, r.conta, { rolagem: r });
    return true;
  }
  return false;
}

// ---------------------------------------------------------------- a décima terceira leva da fila (2026-11-16) ----

/**
 * O que o TELEPORTE deixa para trás e o que ele leva: o medo em quem estava perto de onde saiu (o Teleporte Aterrador do
 * gigante da morte, até o fim do próximo turno de quem falha) e o dano em quem fica perto de onde chega (a Explosão de
 * Relâmpago do sopro animado).
 */
export function depoisDoTeleporte(enc, m, a, deOnde) {
  if (a.medoAoSair) {
    const M = a.medoAoSair;
    for (const t of enc.enemiesOf(m)) {
      if (!vivo(t) || distanceFt(deOnde, t.pos) > M.raioFt || enc.imuneACondicao(t, 'amedrontado')) continue;
      const sv = enc.resistencia(t, M.save, M.dc, { contra: { condicao: 'amedrontado' } });
      const r = enc.explicarResistencia(t, M.save, M.dc, sv, { contra: a.nome, seSucesso: 'nada' });
      if (sv.success) { enc.say('condicao', `${t.name} não se assusta (${a.nome}).`, r.conta, { rolagem: r }); continue; }
      enc.aplicarCondicao(t, 'amedrontado', { rounds: enc.side === t.side ? 2 : 1, quando: 'fim', lado: t.side, source: m.id });
      enc.say('condicao', `${t.name} fica amedrontado com o sumiço de ${m.name}.`, r.conta, { rolagem: r });
    }
  }
  if (a.danoAoChegar) {
    const D = a.danoAoChegar;
    for (const t of enc.enemiesOf(m)) {
      if (!vivo(t) || distanceFt(m.pos, t.pos) > D.raioFt) continue;
      const d = damageRoll(enc.rng, D.dano);
      enc.applyDamage(t, d.total, D.tipo, m, { magico: true });
      enc.say('dano', `${t.name} leva ${d.total} de ${D.tipo} na chegada de ${m.name} (${a.nome}).`, `${D.dano}[${d.rolls.join('+')}]`);
    }
  }
}

// ---------------------------------------------------------------- a décima quarta leva da fila (2026-11-16) ----

/** O TREMOR que quebra a concentração (o Movimento Sísmico): quem está no chão no raio e se concentra faz o teste de Constituição. */
function soltarTremor(enc, m, nome, raioFt, dc) {
  enc.say('acao', `${m.name} faz o chão tremer (${nome}).`);
  for (const t of enc.combatants) {
    if (t === m || !vivo(t) || !t.concentrating || distanceFt(m.pos, t.pos) > raioFt || enc.voaAgora?.(t)) continue;
    const sv = enc.resistencia(t, 'con', dc, { contra: { concentracao: true } });
    const r = enc.explicarResistencia(t, 'con', dc, sv, { contra: nome, seSucesso: 'segue concentrado' });
    if (sv.success) { enc.say('magia', `${t.name} segura a concentração no tremor.`, r.conta, { rolagem: r }); continue; }
    enc.dropConcentration(t);
    enc.say('magia', `${t.name} perde a concentração no tremor.`, r.conta, { rolagem: r });
  }
}

/** O MOVIMENTO SÍSMICO dos rebentos: anda até o inimigo (até o deslocamento dele, de graça) e solta o tremor. */
export function tremor(enc, m, a, alvo) {
  if (a.anda && alvo?.pos && !enc.field.vizinhos(m.pos, alvo.pos)) enc.andarAteOAlvo(m, alvo);
  if (m.dead) return true;
  soltarTremor(enc, m, a.nome, a.raioFt, a.dc);
  return true;
}

/** O do zaratan: no fim do turno, se ele andou 3 m no chão e a ação bônus sobrou, e alguém no raio se concentra. */
export function tremorNoFimDoTurno(enc, m) {
  const T = doLivro(m)?.tremorDepoisDeAndar;
  if (!T || !vivo(m) || m.bonusUsed || enc.side !== m.side || enc.voaAgora?.(m)) return;
  if ((enc.speedOf(m) ?? 0) - (m.movementLeftFt ?? 0) < T.exigeFt) return;
  if (!enc.enemiesOf(m).some((t) => vivo(t) && t.concentrating && distanceFt(m.pos, t.pos) <= T.raioFt)) return;
  m.bonusUsed = true;
  soltarTremor(enc, m, T.nome, T.raioFt, T.dc);
}

// ---------------------------------------------------------------- a décima quinta leva da fila (2026-11-16) ----

/** O FOMENTAR A LOUCURA: Sabedoria, ou o zumbido (desvantagem até o fim do turno); falhando por 5, confuso por um minuto. */
function fomentarLoucura(enc, t, donos) {
  const m = donos.find((d) => d.motorDoLivro.fomentarLoucura && d.side !== t.side && distanceFt(d.pos, t.pos) <= d.motorDoLivro.fomentarLoucura.raioFt);
  if (!m || !vivo(t) || /demon/i.test((t.marcas ?? []).join(' ')) || hasCondition(t, 'confuso') || t.imuneAEspecial?.includes(`${m.id}:loucura`)) return;
  const F = m.motorDoLivro.fomentarLoucura;
  const sv = enc.resistencia(t, 'wis', F.dc, { contra: { condicao: 'confuso' } });
  const r = enc.explicarResistencia(t, 'wis', F.dc, sv, { contra: F.nome, seSucesso: 'nada' });
  if (sv.success) return;
  if (sv.total <= F.dc - 5 && !enc.imuneACondicao(t, 'confuso')) {
    enc.aplicarCondicao(t, 'confuso', { rounds: 10, source: m.id });
    (t.imuneAEspecial ??= []).push(`${m.id}:loucura`);
    enc.say('condicao', `${t.name} perde o rumo da cabeça (${F.nome}): confuso por um minuto.`, r.conta, { rolagem: r });
    return;
  }
  enc.aplicarCondicao(t, 'zumbidoNaCabeca', { rounds: 1, quando: 'fim', lado: t.side, source: m.id });
  enc.say('condicao', `${t.name} ouve um zumbido na cabeça (${F.nome}): desvantagem até o fim do turno.`, r.conta, { rolagem: r });
}

/** A aura que mora na condição do dono (`data.auraNoInicio`): quem começa o turno perto faz o teste, ou leva o dano ou a condição. */
function auraDaCondicao(enc, t) {
  if (!vivo(t)) return;
  for (const m of enc.combatants) {
    if (m === t || !vivo(m) || m.side === t.side) continue;
    for (const c of m.conditions ?? []) {
      const A = c.data?.auraNoInicio;
      if (!A || distanceFt(m.pos, t.pos) > A.raioFt || !vivo(t) || t.imuneAEspecial?.includes(`${m.id}:${c.id}`)) continue;
      const nome = CONDITIONS[c.id]?.name ?? c.id;
      const sv = enc.resistencia(t, A.save, A.dc, { contra: { tipoDano: A.tipo ?? null, condicao: A.condition ?? null } });
      const r = enc.explicarResistencia(t, A.save, A.dc, sv, { contra: nome, seSucesso: 'nada' });
      if (sv.success) { if (A.imunizaAoPassar) (t.imuneAEspecial ??= []).push(`${m.id}:${c.id}`); continue; }
      if (A.dano) {
        const d = damageRoll(enc.rng, A.dano);
        enc.applyDamage(t, d.total, A.tipo, m, { magico: true });
        enc.say('dano', `${t.name} sofre ${d.total} de ${A.tipo} (${nome}).`, `${r.conta} · ${A.dano}[${d.rolls.join('+')}]`, { rolagem: r });
      }
      if (A.condition && vivo(t)) {
        enc.aplicarCondicao(t, A.condition, { rounds: 1, quando: 'fim', lado: t.side, source: m.id });
        enc.say('condicao', `${t.name} sente ${nome.toLowerCase()} perto de ${m.name}.`, r.conta, { rolagem: r });
      }
    }
  }
}

/** O NILBOGISMO: o primeiro golpe de cada turno contra o nilbog pede Carisma; quem falha fica enfeitiçado e perde o golpe. */
export function nilbogismo(enc, atacante, alvo) {
  const N = doLivro(alvo)?.nilbogismo;
  if (!N || !atacante || atacante.side === alvo.side || alvo.dead) return false;
  if (hasCondition(atacante, 'enfeiticado') && getCondition(atacante, 'enfeiticado')?.source === alvo.id) {
    enc.say('condicao', `${atacante.name} não consegue erguer a mão contra ${alvo.name}: está ocupado em louvá-lo.`);
    return true;
  }
  if (atacante.nilbogTestou === enc.turnoKey()) return false;
  atacante.nilbogTestou = enc.turnoKey();
  const sv = enc.resistencia(atacante, 'cha', N.dc, { contra: { condicao: 'enfeiticado' } });
  const r = enc.explicarResistencia(atacante, 'cha', N.dc, sv, { contra: N.nome, seSucesso: 'pode golpear' });
  if (sv.success) return false;
  enc.aplicarCondicao(atacante, 'enfeiticado', { rounds: enc.side === atacante.side ? 2 : 1, quando: 'fim', lado: atacante.side, source: alvo.id });
  atacante.actionUsed = true;
  enc.say('condicao', `${atacante.name} ia ferir ${alvo.name} e, em vez disso, passa o turno a louvá-lo (${N.nome}).`, r.conta, { rolagem: r });
  return true;
}

/** AS LARVAS PUTREFATAS: o acerto põe 1d4 larvas, e cada uma fere 1d6 perfurante no começo de cada turno do alvo. */
export function infestar(enc, m, alvo, I) {
  const n = Math.max(1, damageRoll(enc.rng, I.larvas).total);
  const ja = getCondition(alvo, 'infestadoDeLarvas');
  const total = (ja?.data?.larvas ?? 0) + n;
  if (ja) removeCondition(alvo, 'infestadoDeLarvas');
  // o dado de cada larva (1d6) vezes as larvas: 3 larvas, 3d6
  enc.aplicarCondicao(alvo, 'infestadoDeLarvas', { rounds: Infinity, source: m.id, data: { larvas: total, dano: `${total}${I.porLarva.slice(I.porLarva.indexOf('d'))}` } });
  enc.say('condicao', `${alvo.name} fica com ${total} larva${total > 1 ? 's' : ''} putrefata${total > 1 ? 's' : ''} debaixo da pele.`);
}
/** O fogo na ferida mata as larvas (aqui, qualquer dano de fogo). */
export function fogoMataLarvas(enc, alvo, tipo) {
  if (tipo !== 'fogo' || !hasCondition(alvo, 'infestadoDeLarvas')) return;
  removeCondition(alvo, 'infestadoDeLarvas');
  enc.say('condicao', `O fogo queima as larvas de ${alvo.name}.`);
}

/** O VOLTAR AOS VERMES: o mago-larva que cai se desfaz num enxame de insetos na mesma casa. */
export function voltarAosVermes(enc, m, { makeMonster }) {
  if (!doLivro(m)?.voltaAosVermes || m.voltouAosVermes) return null;
  m.voltouAosVermes = true;
  const e = makeMonster('enxameDeCentopeias', { x: m.pos.x, y: m.pos.y }, { rng: enc.rng });
  e.side = m.side;
  e.acted = m.acted;
  e.name = 'Enxame de Vermes';
  enc.addCombatant(e);
  enc.say('morte', `${m.name} se desfaz num enxame de vermes que se espalha pelo chão.`);
  return e;
}

// ---------------------------------------------------------------- a décima oitava leva da fila (2026-11-16) ----

/** A TRANCA DIMENSIONAL do canoloth: o teleporte que sai de perto dele ou chega perto dele se perde. Devolve true se barrou. */
export function trancaDimensional(enc, quem, de, para) {
  const c = enc.combatants.find((x) => x !== quem && vivo(x) && doLivro(x)?.trancaDimensional
    && (distanceFt(x.pos, de) <= doLivro(x).trancaDimensional.raioFt || (para && distanceFt(x.pos, para) <= doLivro(x).trancaDimensional.raioFt)));
  if (!c) return false;
  enc.say('magia', `${quem.name} tenta se teleportar, e a tentativa se perde: ${c.name} tranca o espaço em volta (${doLivro(c).trancaDimensional.nome}).`);
  return true;
}

/** A DUPLICATA ESPECTRAL do berbalang: surge ao lado de um inimigo a até 18 m; o corpo cai inconsciente enquanto ela durar. */
export function duplicataEspectral(enc, m, a, alvo) {
  if (m.duplicataId && enc.combatants.some((c) => c.id === m.duplicataId && !c.dead)) return false;
  const perto = alvo?.pos && distanceFt(m.pos, alvo.pos) <= a.alcanceFt ? alvo
    : enc.enemiesOf(m).filter((e) => vivo(e) && distanceFt(m.pos, e.pos) <= a.alcanceFt).sort((x, y) => distanceFt(m.pos, x.pos) - distanceFt(m.pos, y.pos))[0];
  if (!perto) return false;
  const d = enc.invocar(m, m.defId, perto.pos, { spellId: 'duplicataEspectral' });
  if (!d) return false;
  d.name = `Duplicata de ${m.name}`;
  d.duplicataDe = m.id;
  d.invocado.auto = true;
  d.attacks = (d.attacks ?? []).map((g) => ({ ...g, type: 'psíquico' }));
  d.acoesEspeciais = (d.acoesEspeciais ?? []).filter((x) => x.tipo !== 'duplicata');
  m.duplicataId = d.id;
  enc.aplicarCondicao(m, 'inconsciente', { rounds: Infinity, source: 'duplicata' });
  enc.say('magia', `${m.name} cai num transe, e uma duplicata espectral surge ao lado de ${perto.name} (${a.nome}).`);
  return true;
}

/** O fim da duplicata: ela cai, e o corpo acorda; o corpo cai, e ela some. */
export function fimDaDuplicata(enc, caiu) {
  if (caiu.duplicataDe) {
    const corpo = enc.combatants.find((c) => c.id === caiu.duplicataDe);
    if (corpo && !corpo.dead && getCondition(corpo, 'inconsciente')?.source === 'duplicata') {
      removeCondition(corpo, 'inconsciente');
      enc.say('condicao', `A duplicata se desfaz, e ${corpo.name} desperta do transe.`);
    }
  }
  if (caiu.duplicataId) {
    const d = enc.combatants.find((c) => c.id === caiu.duplicataId && !c.dead);
    if (d) { d.dead = true; d.hp = 0; enc.say('morte', `${d.name} some junto.`); }
  }
}

// ---------------------------------------------------------------- a décima nona leva da fila (2026-11-16) ----

/** A INVESTIDA DE ESCUDO: o golpe em cada um em que entra; acertado e falhando a Força, vai à frente dele (falhando por 5, cai e leva o tranco). */
function investidaDeEscudo(enc, m, a, t) {
  const fim = t.caminho.at(-1);
  const ini = t.caminho[0];
  const dx = Math.sign(fim.x - ini.x); const dy = Math.sign(fim.y - ini.y);
  const f = m.pos.f ?? 1;
  for (const v of t.vitimas) {
    if (!vivo(v) || m.dead) continue;
    const r = enc.resolveAttack(m, v, { weaponId: a.golpe });
    if (!r?.hit || !vivo(v)) continue;
    const E = a.empurra;
    const sv = enc.resistencia(v, 'str', E.dc, { contra: { empurrao: true } });
    const rr = enc.explicarResistencia(v, 'str', E.dc, sv, { contra: a.nome, seSucesso: 'fica onde está' });
    if (sv.success) continue;
    // à frente da carga: a casa livre mais perto da frente do escudo
    const frente = { x: fim.x + (dx > 0 ? f : dx < 0 ? -1 : 0), y: fim.y + (dy > 0 ? f : dy < 0 ? -1 : 0) };
    const casa = enc.casaLivreMaisProxima({ ...frente, f: v.pos.f ?? 1 });
    if (casa) v.pos = { ...v.pos, x: casa.x, y: casa.y };
    enc.say('condicao', `${m.name} empurra ${v.name} à frente do escudo.`, rr.conta, { rolagem: rr });
    if (sv.total <= E.dc - 5) {
      const jaCaido = hasCondition(v, 'caido');
      const d = damageRoll(enc.rng, jaCaido ? E.danoCaido : E.dano);
      if (!jaCaido && !enc.imuneACondicao(v, 'caido')) enc.aplicarCondicao(v, 'caido', { source: m.id });
      enc.applyDamage(v, d.total, 'concussão', m);
      enc.say('dano', `${v.name} vai ao chão debaixo da carga: ${d.total} de concussão.`, `${jaCaido ? E.danoCaido : E.dano}[${d.rolls.join('+')}]`);
    }
  }
}

/** OS TENTÁCULOS-MANGUAL: um morre no primeiro dano do turno que somar 10; o multiataque é um golpe por tentáculo; sem nenhum, recolhe-se. */
export function tentaculosMangual(enc, c, dano) {
  const T = doLivro(c)?.tentaculosMangual;
  if (!T || c.dead) return;
  c.tentaculos ??= T.n;
  const k = enc.turnoKey();
  if (c.danoDoTurno?.k !== k) c.danoDoTurno = { k, total: 0, perdeu: false };
  c.danoDoTurno.total += dano;
  if (c.danoDoTurno.perdeu || c.danoDoTurno.total < T.limite || c.tentaculos <= 0) return;
  c.danoDoTurno.perdeu = true;
  c.tentaculos -= 1;
  if (c.multiattack) c.multiattack = { ...c.multiattack, count: c.tentaculos };
  enc.say('dano', `Um tentáculo de ${c.name} cai morto: restam ${c.tentaculos}.`);
  if (c.tentaculos <= 0 && c.hp > 0) {
    enc.aplicarCondicao(c, 'caracolRecolhido', { rounds: Infinity, source: c.id });
    c.naoSeguraALuta = true;
    enc.say('condicao', `${c.name} se recolhe na concha e começa a gemer, sem tentáculo nenhum.`);
  }
}

/**
 * A BOCA DA LOUCURA (o gigante da colina de Grolantor): anda até a criatura mais perto, de qualquer lado, e um d10 diz o que
 * faz: três socos num alvo ao acaso (1-3), um soco em cada um ao alcance (4-5), uma mordida ao acaso (6-7) ou mordida e dois
 * socos num só (8-10). Sem ninguém ao alcance, a fúria (vantagem até o fim do próximo turno), o soco em si mesmo ou o olhar
 * vidrado (atordoado até o começo do próximo turno). Devolve true: o turno é dele, a IA de sempre não joga.
 */
export function turnoDaLoucura(enc, m) {
  if (!doLivro(m)?.bocaDaLoucura || m.dead) return false;
  const outros = enc.combatants.filter((c) => c !== m && vivo(c));
  moverAte(enc, m, enc.speedOf(m), false, outros);
  const ao = outros.filter((c) => !c.dead && distanceFt(m.pos, c.pos) <= enc.reachOf(m));
  const soco = m.attacks?.find((g) => /soco|punho/i.test(g.name))?.name;
  const mordida = m.attacks?.find((g) => /mordida/i.test(g.name))?.name;
  const um = () => enc.rng.pick(ao);
  const x = enc.rng.die(10);
  enc.say('acao', `${m.name} rola a fome (d10 = ${x}).`);
  const furia = () => { enc.aplicarCondicao(m, 'furiaDaBoca', { rounds: 2, quando: 'fim', lado: m.side, source: m.id }); enc.say('condicao', `${m.name} urra de fome, sem ninguém ao alcance.`); };
  if (x <= 3) {
    if (!ao.length) furia(); else { const t = um(); for (let i = 0; i < 3 && vivo(t); i++) enc.resolveAttack(m, t, { weaponId: soco }); }
  } else if (x <= 5) {
    if (!ao.length) {
      const g = m.attacks?.find((y) => y.name === soco);
      const d = damageRoll(enc.rng, g?.damage ?? '1d4');
      enc.applyDamage(m, d.total, g?.type ?? 'concussão', m);
      enc.say('dano', `${m.name} soca a si mesmo: ${d.total}.`);
    } else for (const t of ao) if (vivo(t)) enc.resolveAttack(m, t, { weaponId: soco });
  } else if (x <= 7) {
    if (!ao.length) { enc.aplicarCondicao(m, 'atordoado', { rounds: 1, quando: 'inicio', lado: m.side, source: m.id }); enc.say('condicao', `Os olhos de ${m.name} ficam vidrados.`); }
    else enc.resolveAttack(m, um(), { weaponId: mordida });
  } else if (!ao.length) furia();
  else { const t = um(); for (const w of [mordida, soco, soco]) if (vivo(t)) enc.resolveAttack(m, t, { weaponId: w }); }
  m.actionUsed = true;
  return true;
}

// ---------------------------------------------------------------- a vigésima leva da fila (2026-11-16) ----

/**
 * O PRESSÁGIO do adivinho: dois d20 rolados quando a luta começa. Ele troca a jogada de resistência de quem vê pela de um
 * deles: a do inimigo que passaria, por uma que falha; a do aliado (ou a dele) que falharia, por uma que passa — sempre a
 * menor que serve, para guardar a outra. Devolve a jogada nova, ou a mesma.
 */
export function pressagioNaResistencia(enc, actor, rolado, dc) {
  if (rolado.natural == null) return rolado;
  const resto = rolado.total - rolado.natural;
  for (const d of enc.combatants) {
    const P = doLivro(d)?.pressagio;
    if (!P || !vivo(d) || conditionEffects(d).incapacitated) continue;
    if (d !== actor && (!actor.pos || !enc.field.hasLineOfSight(d.pos, actor.pos))) continue;
    d.pressagios ??= [enc.rng.die(20), enc.rng.die(20)];
    if (!d.pressagios.length) continue;
    const inimigo = actor.side !== d.side;
    if (inimigo === !rolado.success) continue;
    const servem = d.pressagios.filter((x) => (inimigo ? x + resto < dc : x + resto >= dc)).sort((a, b) => (inimigo ? b - a : a - b));
    if (!servem.length) continue;
    const x = servem[0];
    d.pressagios.splice(d.pressagios.indexOf(x), 1);
    enc.say('magia', `${d.name} já tinha visto este momento: a jogada de ${actor.name} vira ${x} (${P.nome}).`);
    return { ...rolado, natural: x, total: x + resto, success: x + resto >= dc };
  }
  return rolado;
}

/** A MAGIA ELEVADA do feiticeiro escamado kobold: na magia com resistência, a primeira resistência de um alvo vem com desvantagem. */
export function magiaElevada(enc, actor) {
  const c = enc.conjuradorEmCurso;
  const E = doLivro(c)?.magiaElevada;
  if (!E || !enc.magiaEmCurso || !vivo(c) || c.side === actor.side) return false;
  c.pontosDeFeiticaria ??= E.pontos;
  if (c.pontosDeFeiticaria < E.custo || c.elevadaEm === enc.magiaEmCurso) return false;
  c.pontosDeFeiticaria -= E.custo;
  c.elevadaEm = enc.magiaEmCurso;
  enc.say('magia', `${c.name} gasta ${E.custo} pontos de feitiçaria: ${actor.name} resiste com desvantagem (${E.nome}).`);
  return true;
}

// ---------------------------------------------------------------- a vigésima primeira leva da fila (2026-11-16) ----

/** Os CADÁVERES da flor-cadáver: 1d6+3 no começo, até nove. */
const cadaveresDe = (enc, m) => (m.nCadaveres ??= doLivro(m)?.cadaveres ? Math.min(doLivro(m).cadaveres.max, damageRoll(enc.rng, doLivro(m).cadaveres.dados).total) : 0);

/** COLHER OS MORTOS: o humanoide morto mais perto, a até 3 m, vai para dentro da flor. */
export function colherMorto(enc, m, a) {
  if (cadaveresDe(enc, m) >= (doLivro(m)?.cadaveres?.max ?? 9)) return false;
  const corpo = enc.combatants.find((c) => c.dead && !c.colhido && (c.tipo ?? 'humanoide') === 'humanoide' && c.pos && distanceFt(m.pos, c.pos) <= (a.alcanceFt ?? 10));
  if (!corpo) return false;
  corpo.colhido = true;
  corpo.pos = null;
  m.nCadaveres += 1;
  enc.say('acao', `${m.name} puxa o corpo de ${corpo.name} para dentro de si (${a.nome}).`);
  return true;
}

/** DIGERIR UM CADÁVER: cura 2d10 e gasta um corpo. */
export function digerirCadaver(enc, m, a) {
  if (!cadaveresDe(enc, m) || m.hp >= m.maxHp) return false;
  m.nCadaveres -= 1;
  const d = damageRoll(enc.rng, a.dados);
  const curou = enc.heal(m, d.total, m);
  enc.say('cura', `${m.name} digere um dos corpos: +${curou} PV.`, `${a.dados}[${d.rolls.join('+')}]`);
  return true;
}

/** ERGUER UM CADÁVER: um corpo sai dela como zumbi, ao lado, do lado dela. */
export function animarCadaver(enc, m, a) {
  if (!cadaveresDe(enc, m)) return false;
  const z = enc.invocar(m, a.id ?? 'zumbi', m.pos, { spellId: 'cadaverDaFlor' });
  if (!z) return false;
  z.invocado.auto = true;
  m.nCadaveres -= 1;
  enc.say('acao', `Um corpo sai de ${m.name} e se ergue zumbi.`);
  return true;
}

/** A MALDIÇÃO MORTAL do fensir devorador: quem está a 9 m quando ele morre faz Carisma ou fica amaldiçoado por 24 horas. */
export function maldicaoMortal(enc, m) {
  const M = doLivro(m)?.maldicaoMortal;
  if (!M || m.maldicaoSolta || !m.pos) return;
  m.maldicaoSolta = true;
  for (const t of enc.combatants) {
    if (t === m || !vivo(t) || distanceFt(m.pos, t.pos) > M.raioFt) continue;
    const sv = enc.resistencia(t, 'cha', M.dc, { contra: { condicao: 'maldicaoDoFensir' } });
    const r = enc.explicarResistencia(t, 'cha', M.dc, sv, { contra: M.nome, seSucesso: 'nada' });
    if (sv.success) continue;
    enc.aplicarCondicao(t, 'maldicaoDoFensir', { rounds: Infinity, source: m.id, data: { horas: 0 } });
    enc.say('condicao', `${t.name} carrega a maldição de ${m.name}: 24 horas sem descanso que valha.`, r.conta, { rolagem: r });
  }
}

// ---------------------------------------------------------------- a vigésima segunda leva da fila (2026-11-16) ----

/** APRISIONAR A ALMA (o devorador): o humanoide caído a 0 PV a até 9 m vai para dentro das costelas dele (o engolido do motor). */
export function aprisionarAlma(enc, m, a, alvo) {
  const t = alvo && !alvo.dead && alvo.hp <= 0 && (alvo.tipo ?? 'humanoide') === 'humanoide' && alvo.pos && distanceFt(m.pos, alvo.pos) <= a.alcanceFt ? alvo
    : enc.enemiesOf(m).find((c) => !c.dead && c.hp <= 0 && c.pos && (c.tipo ?? 'humanoide') === 'humanoide' && !hasCondition(c, 'engolido') && distanceFt(m.pos, c.pos) <= a.alcanceFt);
  if (!t || hasCondition(t, 'engolido')) return false;
  engolir(enc, m, t, { dano: null });
  t.almaPresaEm = m.id;
  enc.say('magia', `${m.name} arranca ${t.name} do chão para dentro das costelas (${a.nome}).`);
  return true;
}

/** Quem morre com a alma presa: o devorador cura 25, recarrega o Rasgar Alma e cospe o corpo como zumbi. */
export function almaMorreuPresa(enc, t) {
  if (!t.almaPresaEm) return;
  const m = enc.combatants.find((c) => c.id === t.almaPresaEm);
  t.almaPresaEm = null;
  if (!vivo(m)) return;
  const curou = enc.heal(m, 25, m);
  for (const k of Object.keys(m.recarregando ?? {})) m.recarregando[k] = false;
  enc.say('morte', `${t.name} morre preso em ${m.name}, que se refaz (+${curou} PV) e recarrega o que gastou.`);
  const z = enc.invocar(m, 'zumbi', m.pos, { spellId: 'almaDoDevorador' });
  if (z) { z.invocado.auto = true; z.name = `${t.name}, morto-vivo`; enc.say('morte', `${m.name} cospe o corpo, que se levanta.`); }
}

/** A REFLEXÃO DE MAGIA do morkoth: a magia de ataque que erra vai para outra criatura que ele vê a até 36 m (quem conjurou, se for só ele). */
export function espelharMagia(enc, alvo, conjurador) {
  const E = doLivro(alvo)?.espelharMagia;
  if (!E || !vivo(alvo) || alvo.reactionUsed || conditionEffects(alvo).incapacitated || !conjurador?.pos) return null;
  const opcoes = enc.combatants.filter((c) => c !== alvo && vivo(c) && c.side === conjurador.side && distanceFt(alvo.pos, c.pos) <= E.alcanceFt && enc.field.hasLineOfSight(alvo.pos, c.pos));
  const outro = opcoes.sort((x, y) => x.hp - y.hp)[0];
  if (!outro) return null;
  alvo.reactionUsed = true;
  enc.say('reacao', `${alvo.name} devolve a magia: ela segue para ${outro.name} (${E.nome}).`);
  return outro;
}

/** A REFLEXÃO DE MAGIA do colosso rúnico: o tiro de força em quem conjura até o 5º círculo; acertado e falhando a Inteligência, a magia falha. */
export function reflexaoRunica(enc, conjurador, spell, slot) {
  for (const c of enc.combatants) {
    const R = doLivro(c)?.reflexaoRunica;
    if (!R || !vivo(c) || c.side === conjurador.side || c.reactionUsed || conditionEffects(c).incapacitated) continue;
    if ((slot ?? spell.level ?? 0) > R.circuloMax || distanceFt(c.pos, conjurador.pos) > R.alcanceFt || !enc.field.hasLineOfSight(c.pos, conjurador.pos)) continue;
    c.usosReflexao ??= R.usos;
    if (c.usosReflexao <= 0) continue;
    c.usosReflexao -= 1;
    c.reactionUsed = true;
    const d20 = enc.rng.die(20);
    const ca = caEfetiva(conjurador);
    const acerta = d20 === 20 || (d20 !== 1 && d20 + R.bonus >= ca);
    enc.say('reacao', `${c.name} responde a ${spell.name}: d20 ${d20} + ${R.bonus} contra CA ${ca} (${R.nome}).`);
    if (!acerta) { enc.say('reacao', `O tiro de ${c.name} erra.`); return false; }
    const d = damageRoll(enc.rng, R.dano, { critical: d20 === 20 });
    enc.applyDamage(conjurador, d.total, R.tipo, c, { magico: true, deAtaque: true });
    enc.say('dano', `${conjurador.name} leva ${d.total} de ${R.tipo}.`, `${R.dano}[${d.rolls.join('+')}]`);
    if (conjurador.dead || conjurador.hp <= 0) return true;
    const sv = enc.resistencia(conjurador, R.save, R.dc, {});
    const r = enc.explicarResistencia(conjurador, R.save, R.dc, sv, { contra: R.nome, seSucesso: 'a magia segue' });
    if (sv.success) return false;
    enc.say('magia', `${spell.name} se desfaz na mão de ${conjurador.name}.`, r.conta, { rolagem: r });
    enc.onEvent({ type: 'anulada', caster: conjurador, spell });
    return true;
  }
  return false;
}

// ---------------------------------------------------------------- a vigésima terceira leva da fila (2026-11-16) ----

/** O DESAFIO DO CAMPEÃO: o passo que levaria o desafiado a mais de 9 m do Donaar não acontece; com o Donaar caído, acaba. */
export function desafioSegura(enc, actor, para) {
  const c = getCondition(actor, 'desafioDoCampeao');
  if (!c) return false;
  const dono = enc.combatants.find((x) => x.id === (c.data?.donoId ?? c.source));
  if (!vivo(dono) || conditionEffects(dono).incapacitated) { removeCondition(actor, 'desafioDoCampeao'); return false; }
  if (distanceFt(dono.pos, para) <= (c.data?.raioFt ?? 30) || distanceFt(dono.pos, para) <= distanceFt(dono.pos, actor.pos)) return false;
  actor.movementLeftFt = 0;
  enc.say('condicao', `${actor.name} não consegue se afastar de ${dono.name}: o desafio o segura.`);
  return true;
}

// ---------------------------------------------------------------- a vigésima quarta leva da fila (2026-11-16) ----

/** O MOTOR DA DOR: quem tem o interruptor ligado mira o duergar preso, uma vez por turno. Devolve o dado a mais, ou null. */
export function miraNoPreso(enc, atacante, alvo) {
  const D = doLivro(alvo)?.motorDaDor;
  if (!D || !atacante?.mirarPreso || atacante.side === alvo.side || alvo.dead) return null;
  if (atacante.miraNoPresoEm === enc.turnoKey()) return null;
  atacante.miraNoPresoEm = enc.turnoKey();
  return D;
}

/** O acerto no duergar preso: o dado a mais, e a máquina responde com o multiataque, na reação, em quem a feriu. */
export function depoisDoGolpeNoPreso(enc, atacante, alvo, r, D) {
  if (!r?.hit || !vivo(alvo)) return;
  const d = damageRoll(enc.rng, D.extra);
  enc.applyDamage(alvo, d.total, null, atacante);
  enc.say('dano', `O duergar preso em ${alvo.name} grita: mais ${d.total} (${D.nome}).`, `${D.extra}[${d.rolls.join('+')}]`);
  if (!vivo(alvo) || alvo.reactionUsed || conditionEffects(alvo).incapacitated || !vivo(atacante)) return;
  alvo.reactionUsed = true;
  enc.say('reacao', `${alvo.name} responde à dor com todos os golpes.`);
  const golpes = alvo.multiattack?.sequence?.length ? alvo.multiattack.sequence : [alvo.attacks?.[0]?.name].filter(Boolean);
  for (const g of golpes) if (vivo(atacante) && enc.canAttack(alvo, atacante, g).ok) enc.resolveAttack(alvo, atacante, { weaponId: g });
}

/** POSSUIR UM CADÁVER: o dybbuk veste o corpo de fera ou humanoide (até Grande) a 1,5 m; os PV do corpo são os que ele perde primeiro. */
export function possuirCadaver(enc, m, a, vestirFera) {
  if (m.formaSelvagem) return false;
  const corpo = enc.combatants.find((c) => c.dead && !c.colhido && c.defId && c.pos && ['fera', 'humanoide'].includes(c.tipo ?? 'humanoide')
    && cabeNoTamanho(c, 'large') && distanceFt(m.pos, c.pos) <= (a.alcanceFt ?? 5));
  if (!corpo || !vestirFera(m, corpo.defId, { livre: true })) return false;
  m.pos = { ...m.pos, x: corpo.pos.x, y: corpo.pos.y };
  corpo.colhido = true;
  corpo.pos = null;
  enc.say('magia', `${m.name} some dentro do corpo de ${corpo.name}, que se levanta (${a.nome}).`);
  return true;
}

// ---------------------------------------------------------------- a vigésima sexta leva da fila (2026-11-16) ----

/** A lembrança da magia do turno (para a MAGIA ECOADA). */
export function lembrarMagia(enc, actor, spellId, opcoes) {
  if (!actor.acoesEspeciais?.some((x) => x.tipo === 'magiaEcoada')) return;
  actor.ultimaMagia = { spellId, alvoId: opcoes?.target?.id ?? null, ponto: opcoes?.point ?? null, circulo: opcoes?.circulo ?? null, turno: enc.turnoKey(), rodada: enc.round };
}

/** A MAGIA ECOADA: a magia do turno passado, de novo, com a ação bônus e o espaço de sempre. Uma vez por dia. */
export function magiaEcoada(enc, m) {
  const u = m.ultimaMagia;
  if (!u || u.rodada >= enc.round) return false;
  const alvo = enc.combatants.find((c) => c.id === u.alvoId && vivo(c))
    ?? enc.enemiesOf(m).filter((e) => vivo(e)).sort((x, y) => distanceFt(m.pos, x.pos) - distanceFt(m.pos, y.pos))[0];
  if (!alvo) return false;
  enc.say('magia', `${m.name} ecoa a magia do turno passado.`);
  const r = enc.conjurarDeReacao(m, u.spellId, alvo);
  m.ultimaMagia = null;
  return !!r?.ok;
}

/**
 * O MIMETISMO DE MAGIA do gargantua: a magia de até o 5º círculo de um inimigo que ele vê; quem conjurou faz Carisma 19, e
 * falhando, o gargantua a conjura também, no mesmo círculo, com a CD e o ataque dele, em quem a conjurou (ou em si, se ela
 * não fere). Uma vez por dia, com a reação.
 */
export function mimetismoDeMagia(enc, conjurador, spellId, opcoes) {
  for (const g of enc.combatants) {
    const M = doLivro(g)?.mimetismo;
    if (!M || !vivo(g) || g.side === conjurador.side || g.reactionUsed || conditionEffects(g).incapacitated) continue;
    if (!conjurador.pos || !enc.field.hasLineOfSight(g.pos, conjurador.pos)) continue;
    const circulo = opcoes?.circulo ?? 0;
    if (circulo > M.circuloMax) continue;
    g.usosMimetismo ??= M.usos;
    if (g.usosMimetismo <= 0) continue;
    g.usosMimetismo -= 1;
    g.reactionUsed = true;
    const sv = enc.resistencia(conjurador, 'cha', M.dc, {});
    const r = enc.explicarResistencia(conjurador, 'cha', M.dc, sv, { contra: M.nome, seSucesso: 'a magia é só dele' });
    if (sv.success) { enc.say('reacao', `${g.name} tenta copiar a magia e não consegue.`, r.conta, { rolagem: r }); return; }
    enc.say('reacao', `${g.name} copia a magia de ${conjurador.name} (${M.nome}).`, r.conta, { rolagem: r });
    // a conjuração emprestada: a magia na lista dele só por este lance, com a CD do livro
    const guarda = g.spellcasting;
    const slots = []; if (circulo > 0) slots[circulo] = 1;
    g.spellcasting = { ability: 'cha', cantrips: circulo === 0 ? [spellId] : [], prepared: circulo > 0 ? [spellId] : [], slots, slotsMax: [...slots], cdPorMagia: { [spellId]: M.cd }, noMotor: true, conjuraNoTurno: 'geral' };
    try {
      const fere = opcoes?.target && opcoes.target.side !== conjurador.side;
      const alvo = fere || opcoes?.target?.side === g.side ? conjurador : g;
      enc.conjurarDeReacao(g, spellId, alvo);
    } finally { g.spellcasting = guarda; }
    return;
  }
}

/** A TEMPESTADE VINGATIVA: a nuvem nasce (com a recarga) e, a cada ação bônus, um dos três efeitos debaixo dela. */
export function tempestadeVingativa(enc, m, a, alvo) {
  const ponto = alvo?.pos ?? alvo;
  if (!ponto || distanceFt(m.pos, ponto) > a.alcanceFt) return false;
  m.tempestade ??= { ultimo: null };
  const opcoes = ['acida', 'gelada', 'raios'].filter((x) => x !== m.tempestade.ultimo);
  const efeito = opcoes[enc.rng.die(opcoes.length) - 1];
  m.tempestade.ultimo = efeito;
  m.tempestade.rodadaFim = enc.round + 10;
  const nomes = { acida: 'a chuva ácida', gelada: 'o temporal gelado', raios: 'os relâmpagos' };
  enc.say('magia', `A nuvem de ${m.name} solta ${nomes[efeito]} (${a.nome}).`);
  for (const t of enc.combatants) {
    if (t === m || !vivo(t) || distanceFt(t.pos, ponto) > a.raioFt) continue;
    const hab = efeito === 'acida' ? 'con' : 'dex';
    const sv = enc.resistencia(t, hab, a.dc, {});
    const r = enc.explicarResistencia(t, hab, a.dc, sv, { contra: nomes[efeito], seSucesso: 'nada' });
    if (sv.success) continue;
    if (efeito === 'acida') {
      enc.aplicarCondicao(t, 'cobertoDeAcido', { rounds: 10, source: m.id, data: { dano: '4d12', tipo: 'ácido' } });
      enc.say('condicao', `${t.name} fica coberto de ácido.`, r.conta, { rolagem: r });
    } else if (efeito === 'gelada') {
      const d = damageRoll(enc.rng, '8d6');
      enc.applyDamage(t, d.total, 'frio', m, { magico: true });
      if (vivo(t)) enc.aplicarCondicao(t, 'presoNoGelo', { rounds: 10, source: m.id });
      enc.say('dano', `${t.name} leva ${d.total} de frio e fica preso no gelo.`, `${r.conta} · 8d6[${d.rolls.join('+')}]`, { rolagem: r });
    } else {
      const d = damageRoll(enc.rng, '4d8');
      enc.applyDamage(t, d.total, 'elétrico', m, { magico: true });
      if (vivo(t)) enc.aplicarCondicao(t, 'atordoado', { rounds: enc.side === t.side ? 2 : 1, quando: 'fim', lado: t.side, source: m.id });
      enc.say('dano', `${t.name} leva ${d.total} de elétrico e fica atordoado.`, `${r.conta} · 4d8[${d.rolls.join('+')}]`, { rolagem: r });
    }
  }
  return true;
}

/** A mente espectral some (longe demais de quem a pôs, ou no fim da luta): sai a luz dela. */
export function dispersarMente(enc, actor) {
  if (!actor?.menteManifesta) return;
  delete actor.menteManifesta;
  actor.conjurarDaMente = false;
  enc.luzesDeMagia = (enc.luzesDeMagia ?? []).filter((l) => l.menteDe !== actor.id);
  enc.say('magia', `A mente espectral de ${actor.name} se desfaz: ficou longe demais.`);
}
