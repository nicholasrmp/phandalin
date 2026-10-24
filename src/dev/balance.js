// Simulador headless de encontros, para balanceamento.
//
// Roda o motor de regras sozinho — sem tabuleiro, sem animação, sem espera —
// e devolve números. Chutar balanceamento é tapar buraco no escuro; isto mostra
// ONDE está a folga: quantos monstros morrem antes de agir, quanto da vida do
// grupo sobra, quantas rodadas dura.
//
// No console, em modo dev:
//   const { simulate } = await import('/src/dev/balance.js');
//   console.table(simulate(40).porCombate);
//   simulate(40).resumo

import { makeRng } from '../core/rng.js';
import { Battlefield } from '../core/grid.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { makeMonster } from '../rules/monsters.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { hasCondition, conditionEffects } from '../rules/conditions.js';
import { WEAPONS } from '../rules/equipment.js';
import { getSpell, magiasProntas } from '../rules/spells.js';
import { distanceFt, Battlefield as BF } from '../core/grid.js';
import { MAP, PARTY_SPOTS, buildFoes, reinforcementsFor } from '../game/encounter.js';

/**
 * Política do grupo: joga de forma competente mas não ótima — cura quem está
 * caindo, usa magia de ataque se tiver, senão fecha distância e bate.
 * Serve de linha de base: se ESTA política ganha fácil, o encontro é fácil.
 */
export function playCharacter(enc, c) {
  const foes = enc.enemiesOf(c);
  if (foes.length === 0) { enc.endTurn(c); return; }
  if (conditionEffects(c).incapacitated) { enc.endTurn(c); return; }

  // Derrubado: levanta antes de tudo. Preso: tenta se soltar se ninguém
  // estiver ao alcance da arma de perto.
  if (hasCondition(c, 'caido')) enc.standUp(c);
  if ((hasCondition(c, 'agarrado') || hasCondition(c, 'contido') || hasCondition(c, 'presoPorVinhas'))
    && !foes.some((f) => distanceFt(c.pos, f.pos) <= 5)) {
    enc.escapar(c);
    enc.endTurn(c);
    return;
  }

  // Levantar quem caiu vem primeiro, e é ação bônus: sai de graça.
  const prontas = magiasProntas(c);
  if (prontas.includes('palavraCurativa') && !c.bonusUsed) {
    const down = enc.alliesOf(c).find((a) => !a.dead && a.hp <= 0 && distanceFt(c.pos, a.pos) <= 60);
    if (down && c.spellcasting.slots[1] > 0) enc.castSpell(c, 'palavraCurativa', { target: down });
  }

  // Ninguém no chão sangrando: ou levanta com magia, ou estanca com Medicina.
  // Estabilizar não gasta recurso, então vem antes de queimar um espaço.
  const caido = enc.alliesOf(c).find((a) => !a.dead && !a.stable && hasCondition(a, 'inconsciente'));
  if (caido && !c.actionUsed) {
    if (prontas.includes('curarFerimentos') && c.spellcasting.slots[1] > 0
        && distanceFt(c.pos, caido.pos) <= 5) {
      enc.castSpell(c, 'curarFerimentos', { target: caido });
      enc.endTurn(c);
      return;
    }
    if (enc.stabilize(c, caido)) { enc.endTurn(c); return; }
  }

  // Curar ANTES de alguém cair — mas só com folga de espaços, para não ficar
  // sem nada na hora de levantar alguém.
  if (!c.actionUsed && prontas.includes('curarFerimentos') && c.spellcasting.slots[1] > 1) {
    const ferido = [c, ...enc.alliesOf(c)]
      .filter((a) => !a.dead && a.hp > 0 && a.hp < a.maxHp * 0.35 && distanceFt(c.pos, a.pos) <= 5)
      .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (ferido) {
      enc.castSpell(c, 'curarFerimentos', { target: ferido });
      enc.endTurn(c);
      return;
    }
  }

  // Preservar a Vida quando metade do grupo está mal.
  if (!c.actionUsed && c.resources?.channelDivinity > 0) {
    const mal = enc.alliesOf(c).concat([c]).filter((a) => !a.dead && a.hp < a.maxHp * 0.5);
    if (mal.length >= 2) {
      enc.useFeature(c, 'preserveLife');
      enc.endTurn(c);
      return;
    }
  }

  const nearest = foes.slice().sort((a, b) => distanceFt(c.pos, a.pos) - distanceFt(c.pos, b.pos))[0];

  if (!c.actionUsed && c.spellcasting) {
    // Magias de círculo antes dos truques, como antes.
    for (const sid of [...prontas].sort((a, b) => getSpell(b).level - getSpell(a).level)) {
      const s = getSpell(sid);
      if (s.kind !== 'attack' && s.kind !== 'auto' && s.kind !== 'save') continue;
      if (!s.damage) continue;
      if (s.level > 0 && !c.spellcasting.slots[s.level]) continue;
      if (s.rangeFt > 0 && distanceFt(c.pos, nearest.pos) > s.rangeFt) continue;
      if (!enc.field.hasLineOfSight(c.pos, nearest.pos)) continue;
      enc.castSpell(c, sid, { target: nearest, point: nearest.pos });
      enc.endTurn(c);
      return;
    }
  }

  if (c.features?.includes('secondWind') && c.hp < c.maxHp * 0.4 && !c.bonusUsed) {
    enc.useFeature(c, 'secondWind');
  }

  const melee = c.weapons?.find((w) => !WEAPONS[w].ranged);
  const ranged = c.weapons?.find((w) => WEAPONS[w].ranged);

  if (!c.actionUsed && melee && distanceFt(c.pos, nearest.pos) <= 5) {
    enc.attackAction(c, nearest, melee);
    enc.endTurn(c);
    return;
  }

  const reached = enc.reachableFor(c);
  let best = null;
  for (const node of reached.values()) {
    if (enc.occupied(node.x, node.y, c)) continue;
    const d = distanceFt({ x: node.x, y: node.y }, nearest.pos);
    if (!best || d < best.d) best = { d, node };
  }
  if (best && best.node.cost > 0) enc.moveAlong(c, BF.pathFrom(reached, best.node));

  if (!c.actionUsed && !c.dead && !hasCondition(c, 'inconsciente')) {
    const d = distanceFt(c.pos, nearest.pos);
    if (melee && d <= 5) enc.attackAction(c, nearest, melee);
    else if (ranged && enc.canAttack(c, nearest, ranged).ok) enc.attackAction(c, nearest, ranged);
  }
  if (!c.acted) enc.endTurn(c);
}

/** Roda um combate inteiro, sem esperar nada. */
export function runOne(seed) {
  const rng = makeRng(seed);
  const field = new Battlefield(MAP[0].length, MAP.length, MAP);
  const party = makeParty();
  party.forEach((c, i) => { c.pos = { ...PARTY_SPOTS[i] }; });
  const foes = buildFoes();

  const enc = new Encounter({
    battlefield: field, party, foes, rng,
    reinforcements: (round) => reinforcementsFor(round),
  });

  // Conta turnos sem tocar no fluxo de eventos.
  const origEnd = enc.endTurn.bind(enc);
  enc.endTurn = (actor) => {
    actor.turnsTaken = (actor.turnsTaken ?? 0) + 1;
    return origEnd(actor);
  };

  const hpTotal = party.reduce((s, c) => s + c.maxHp, 0);
  enc.start();

  let guard = 800;
  while (!enc.over && guard-- > 0) {
    const side = enc.side;
    const pending = enc.allOf(side).filter((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente'));
    if (pending.length === 0) { enc.maybeEndSide(); continue; }
    if (side === 'party') playCharacter(enc, pending[0]);
    else takeMonsterTurn(enc, pending[0]);
    if (enc.round > 40) break;
  }

  const all = enc.combatants;
  const pcs = all.filter((c) => c.side === 'party');
  const mobs = all.filter((c) => c.side === 'foes');

  return {
    venceu: enc.outcome === 'vitoria',
    rodadas: enc.round,
    caidos: pcs.filter((c) => c.hp <= 0).length,
    mortos: pcs.filter((c) => c.dead).length,
    hpPct: Math.round((pcs.reduce((s, c) => s + Math.max(0, c.hp), 0) / hpTotal) * 100),
    mobsSemAgir: mobs.filter((c) => c.dead && !c.turnsTaken).length,
    mobsTotal: mobs.length,
    grupoComecou: enc.firstSide === 'party',
  };
}

/** Roda N combates com sementes diferentes e resume. */
export function simulate(n = 40) {
  const porCombate = [];
  for (let i = 0; i < n; i++) porCombate.push(runOne(0x51b0 + i * 7919));

  const media = (f) => +(porCombate.reduce((s, d) => s + f(d), 0) / n).toFixed(2);
  const pct = (f) => Math.round((porCombate.filter(f).length / n) * 100);

  return {
    porCombate,
    resumo: {
      amostra: n,
      vitorias: `${pct((d) => d.venceu)}%`,
      rodadasMedia: media((d) => d.rodadas),
      hpRestanteMedio: `${media((d) => d.hpPct)}%`,
      combatesComAlguemCaido: `${pct((d) => d.caidos > 0)}%`,
      combatesComMorte: `${pct((d) => d.mortos > 0)}%`,
      mobsMortosSemAgir: `${media((d) => d.mobsSemAgir)} de ${porCombate[0].mobsTotal}`,
      grupoVenceuIniciativa: `${pct((d) => d.grupoComecou)}%`,
    },
  };
}
