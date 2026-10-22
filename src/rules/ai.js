// IA dos monstros. Simples de propósito: previsível o bastante para o jogador
// aprender a explorar, agressiva o bastante para punir descuido.
//
// Prioridades, em ordem:
//   1. terminar quem está caído perto (nocaute é vantagem grande)
//   2. bater em quem está ao alcance agora, preferindo o alvo mais fácil
//   3. andar até o alvo mais promissor e atacar
//   4. se não alcançar ninguém, aproximar o máximo possível

import { distanceFt, isAdjacent, key, Battlefield } from '../core/grid.js';
import { hasCondition } from './conditions.js';

function scoreTarget(enc, monster, target) {
  // Menor é melhor.
  let score = distanceFt(monster.pos, target.pos);
  score -= (1 - target.hp / target.maxHp) * 30;        // machucado atrai
  if (target.ac <= 13) score -= 10;                     // alvo mole
  if (hasCondition(target, 'caido')) score -= 8;
  if (target.className === 'Mago' || target.className === 'Clérigo') score -= 12;
  return score;
}

export function takeMonsterTurn(enc, monster) {
  if (monster.dead || hasCondition(monster, 'inconsciente')) {
    enc.endTurn(monster);
    return;
  }

  const enemies = enc.enemiesOf(monster);
  if (enemies.length === 0) {
    enc.endTurn(monster);
    return;
  }

  const ranged = monster.attacks?.some((a) => a.ranged);
  const melee = monster.attacks?.find((a) => !a.ranged);
  const adjacentFoes = enemies.filter((e) => isAdjacent(e.pos, monster.pos));

  // Escapada Ágil: machucado e cercado → desengaja de graça e recua.
  if (
    monster.traits?.includes('nimbleEscape')
    && adjacentFoes.length > 0
    && monster.hp <= monster.maxHp * 0.4
    && !monster.bonusUsed
    && ranged
  ) {
    enc.disengage(monster, { bonus: true });
    retreat(enc, monster, adjacentFoes);
    const far = pickReachableTarget(enc, monster, enemies);
    if (far) enc.attackAction(monster, far.target, far.weaponName);
    enc.endTurn(monster);
    return;
  }

  const ordered = enemies.slice().sort((a, b) => scoreTarget(enc, monster, a) - scoreTarget(enc, monster, b));

  // 0: terreno alto com arma à distância — fica e atira.
  //
  // Esta regra vem antes da preferência por corpo a corpo porque, sem ela, quem
  // está no platô desce para brigar: perde a cobertura, dá cobertura ao inimigo
  // e gasta o dobro de movimento para voltar. Medido: sem esta regra o grupo
  // ganhava 90% dos combates; o platô virava armadilha para quem o ocupava.
  const rangedAtk = monster.attacks?.find((at) => at.ranged);
  if (rangedAtk && !adjacentFoes.length) {
    const myHeight = enc.field.heightAt(monster.pos.x, monster.pos.y);
    const lowerTarget = ordered.find(
      (t) => enc.field.heightAt(t.pos.x, t.pos.y) < myHeight
        && enc.canAttack(monster, t, rangedAtk.name).ok,
    );
    if (lowerTarget) {
      enc.attackAction(monster, lowerTarget, rangedAtk.name);
      enc.endTurn(monster);
      return;
    }
  }

  // 1: corpo a corpo daqui mesmo.
  const meleeNow = pickReachableTarget(enc, monster, ordered, { meleeOnly: true });
  if (meleeNow) {
    enc.attackAction(monster, meleeNow.target, meleeNow.weaponName);
    enc.endTurn(monster);
    return;
  }

  // 2: fechar a distância e bater.
  //
  // Esta preferência é deliberada. Sem ela, todo monstro com arma à distância
  // metralha do outro lado do mapa no primeiro turno (arco curto tem 24 m de
  // alcance — mais que o tabuleiro inteiro), o posicionamento deixa de importar
  // e o mago morre antes de agir. Goblin que fecha distância dá um combate.
  const plan = planApproach(enc, monster, ordered, { meleeOnly: true });
  if (plan) {
    if (plan.path.length > 1) enc.moveAlong(monster, plan.path);
    if (!monster.dead && !hasCondition(monster, 'inconsciente')) {
      const after = pickReachableTarget(enc, monster, ordered);
      if (after) enc.attackAction(monster, after.target, after.weaponName);
    }
    enc.endTurn(monster);
    return;
  }

  // 3: não dá para encostar neste turno — aí sim usa o que tiver à distância.
  const shot = pickReachableTarget(enc, monster, ordered);
  if (shot) {
    enc.attackAction(monster, shot.target, shot.weaponName);
    enc.endTurn(monster);
    return;
  }

  // 4: nem atirar dá — encosta o máximo que conseguir.
  const closest = ordered[0];
  const reached = enc.reachableFor(monster);
  let best = null;
  for (const node of reached.values()) {
    if (enc.occupied(node.x, node.y, monster)) continue;
    const d = distanceFt({ x: node.x, y: node.y }, closest.pos);
    if (!best || d < best.d) best = { d, node };
  }
  if (best && best.node.cost > 0) {
    enc.moveAlong(monster, Battlefield.pathFrom(reached, best.node));
  }
  enc.endTurn(monster);
}

function pickReachableTarget(enc, monster, targets, { meleeOnly = false } = {}) {
  for (const target of targets) {
    for (const atk of monster.attacks ?? []) {
      if (meleeOnly && atk.ranged) continue;
      const check = enc.canAttack(monster, target, atk.name);
      if (!check.ok) continue;
      // Ataque corpo a corpo precisa estar no alcance de verdade.
      if (!atk.ranged && distanceFt(monster.pos, target.pos) > (atk.reachFt ?? 5)) continue;
      return { target, weaponName: atk.name };
    }
  }
  return null;
}

function planApproach(enc, monster, targets, { meleeOnly = false } = {}) {
  const reached = enc.reachableFor(monster);
  const meleeAtk = monster.attacks?.find((a) => !a.ranged);
  const meleeReach = meleeAtk?.reachFt ?? 5;
  if (meleeOnly && !meleeAtk) return null;

  let best = null;
  for (const node of reached.values()) {
    if (enc.occupied(node.x, node.y, monster)) continue;
    const spot = { x: node.x, y: node.y };
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      const d = distanceFt(spot, t.pos);
      const canHit = d <= meleeReach
        || (!meleeOnly && monster.attacks?.some((a) => a.ranged && d <= a.rangeFt) && enc.field.hasLineOfSight(spot, t.pos));
      if (!canHit) continue;
      // Prefere o alvo melhor pontuado e, entre iguais, o caminho mais curto.
      const rank = i * 1000 + node.cost;
      if (!best || rank < best.rank) best = { rank, node, target: t };
    }
  }
  if (!best) return null;
  return { path: Battlefield.pathFrom(reached, best.node), target: best.target };
}

function retreat(enc, monster, threats) {
  const reached = enc.reachableFor(monster);
  let best = null;
  for (const node of reached.values()) {
    if (enc.occupied(node.x, node.y, monster)) continue;
    const spot = { x: node.x, y: node.y };
    const nearest = Math.min(...threats.map((t) => distanceFt(spot, t.pos)));
    const score = -nearest;
    if (!best || score < best.score) best = { score, node };
  }
  if (best && best.node.cost > 0) enc.moveAlong(monster, Battlefield.pathFrom(reached, best.node));
}

/** Roda todos os monstros em sequência, com pausa entre eles para dar leitura. */
export async function runMonsterSide(enc, { delayMs = 520, onStep = () => {} } = {}) {
  const pending = () => enc.allOf('foes').filter((c) => !c.acted && !hasCondition(c, 'inconsciente'));
  while (enc.side === 'foes' && !enc.over) {
    const list = pending();
    if (list.length === 0) break;
    const monster = list[0];
    onStep(monster);
    takeMonsterTurn(enc, monster);
    if (enc.over) break;
    await new Promise((r) => setTimeout(r, delayMs));
  }
}
