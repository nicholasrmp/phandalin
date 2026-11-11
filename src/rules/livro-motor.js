// O MOTOR DOS BESTIÁRIOS DOS LIVROS: o que os blocos importados do Monster Manual pedem e que nenhum bloco feito à mão
// pedia antes. Cada função recebe o encontro (`enc`, a classe de `combat.js`) e faz a regra de UM traço ou de UMA ação
// do livro; quem chama é o combate (o gancho no lugar certo do turno) ou a IA. Fica num arquivo só para `combat.js`
// não crescer mais, e porque são regras de criatura, não do núcleo do combate.
import { damageRoll } from '../core/dice.js';
import { Battlefield, distanceFt, key } from '../core/grid.js';
import { addCondition, removeCondition, hasCondition, getCondition, conditionEffects, CONDITIONS } from './conditions.js';
import { categoriaDeTamanho } from './tamanho.js';
import { nivelDeLuz, fontesDeLuz, CLARO } from './luz.js';

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
export const engolidosDe = (enc, m) => enc.combatants.filter((c) => !c.dead && engolidoPor(c) === m.id);

/** Engole (`dados`: o ácido por turno, o vômito, a fuga do cubo). O agarrão acaba, e o engolido passa a estar DENTRO. */
export function engolir(enc, m, alvo, dados = {}) {
  for (const cond of [...(alvo.conditions ?? [])]) {
    if (cond.source === m.id && cond.data?.escape != null) removeCondition(alvo, cond.id);
  }
  addCondition(alvo, 'engolido', { rounds: Infinity, source: m.id, data: { dano: dados.dano ?? null, tipoDano: dados.tipoDano ?? 'ácido', regurgita: dados.regurgita ?? null, escape: dados.escape ?? null } });
  enc.dropConcentration?.(alvo);
  alvo.pos = { ...alvo.pos, x: m.pos.x, y: m.pos.y };
  enc.say('condicao', `${m.name} engole ${alvo.name}: cego, preso e fora do alcance de todos lá fora.`);
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
  const mordida = m.attacks?.find((x) => /mordida/i.test(x.name)) ?? m.attacks?.find((x) => !x.ranged);
  if (!mordida || !alvo || !presoPor(alvo, m) || !cabeNoTamanho(alvo, a.tamanhoMax) || engolidosDe(enc, m).length) return false;
  enc.say('acao', `${m.name} tenta engolir ${alvo.name}.`);
  const r = enc.resolveAttack(m, alvo, { weaponId: mordida.name });
  if (r?.hit && !alvo.dead && alvo.hp > 0) engolir(enc, m, alvo, { dano: a.dano, tipoDano: a.tipoDano, regurgita: a.regurgita });
  return true;
}

/** O alvo está preso (agarrado ou contido) por `m`. */
export const presoPor = (alvo, m) => (alvo.conditions ?? []).some((c) => c.source === m.id && (c.id === 'agarrado' || c.id === 'contido'));

/** A mordida que engole (o verme púrpura, o kraken): o perfil traz `engole`, e o efeito vem depois do acerto. */
export function mordidaQueEngole(enc, m, alvo, e) {
  if (alvo.dead || alvo.hp <= 0 || !cabeNoTamanho(alvo, e.tamanhoMax) || hasCondition(alvo, 'engolido')) return;
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
    if (!m.traits?.includes('chaoAberrante') || m.dead || m.hp <= 0 || !m.pos) continue;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const x = m.pos.x + dx;
      const y = m.pos.y + dy;
      if (enc.field.inside(x, y) && distanceFt(m.pos, { x, y }) <= 10) casas.add(key(x, y));
    }
  }
  return casas;
}

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
  if (a.tipo === 'alvo' && a.alcanceFt && distanceFt(m.pos, t.pos) > a.alcanceFt) return false;
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
  if (a.cai0) {
    if (!sv.success) { enc.say('dano', `${t.name} desaba sem forças (${a.nome}).`); cairAZero(enc, t, m); }
    else if (a.condicaoAoPassar && !enc.imuneACondicao(t, a.condicaoAoPassar)) {
      enc.aplicarCondicao(t, a.condicaoAoPassar, { rounds: 1, quando: 'fim', lado: t.side, source: m.id });
    }
  }
  if (a.arremessaFt && !sv.success && !t.dead) arremessar(enc, t, a.arremessaFt, { de: m.pos, dcDaBatida: a.dc, m });
  if (a.tambemCaido && !sv.success && !t.dead && t.hp > 0 && !enc.imuneACondicao(t, 'caido')) addCondition(t, 'caido', { source: m.id });
  if (a.reduzMaximo && dano > 0 && !t.dead) {
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
        const alvo = inimigos.filter((e) => enc.canAttack(m, e, o.arma).ok).sort((a, b) => a.hp - b.hp)[0];
        if (!alvo) return false;
        enc.say('recurso', `${m.name} usa uma ação lendária: ${o.nome}.`);
        enc.resolveAttack(m, alvo, { weaponId: o.arma, lendaria: true });
        return true;
      }
      case 'magia': return ctx.magia(m, !!o.soTruque);
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
      case 'mover': return moverAte(enc, m, o.pes ?? (o.metade ? Math.floor(enc.speedOf(m) / 2) : enc.speedOf(m)), o.semOportunidade);
      default: return false;
    }
  };
  for (const o of opcoes) if (['curaPropria', 'teleporte', 'escudo', 'raio', 'area'].includes(o.tipo) && tenta(o)) return o;
  for (const o of opcoes) if (['alvo', 'especial', 'golpe', 'magia', 'reforco', 'semCura', 'tinta', 'mover'].includes(o.tipo) && tenta(o)) return o;
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
  const f = EFEITOS[spell.efeito];
  if (!f) { enc.say('aviso', `${spell.name} ainda não tem efeito no jogo.`); return false; }
  return f(enc, actor, spell, ctx, deps);
}

const EFEITOS = {
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
  metamorfose(enc, actor, spell, { target, dc }, { vestirFera, MONSTERS }) {
    const alvos = spell.soSi ? [actor]
      : spell.raioFt ? enc.combatants.filter((c) => c.side === actor.side && !c.dead && c.hp > 0 && c.pos && distanceFt(c.pos, actor.pos) <= spell.raioFt && !c.formaSelvagem)
        : [target].filter(Boolean);
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
};

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
