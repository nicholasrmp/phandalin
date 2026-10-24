// IA dos monstros. Simples de propósito: previsível o bastante para o jogador
// aprender a explorar, agressiva o bastante para punir descuido.
//
// Prioridades, em ordem:
//   1. terminar quem está caído perto (nocaute é vantagem grande)
//   2. bater em quem está ao alcance agora, preferindo o alvo mais fácil
//   3. andar até o alvo mais promissor e atacar
//   4. se não alcançar ninguém, aproximar o máximo possível
//
// Quem tem juízo (modificador de Inteligência 0 ou mais: goblin, bandido)
// contorna a Graxa no chão quando há outro caminho; bicho e morto-vivo
// (Inteligência negativa: lobo, zumbi, esqueleto) passa reto e escorrega.

import { distanceFt, isAdjacent, key, Battlefield } from '../core/grid.js';
import { hasCondition, getCondition, conditionEffects, addCondition, removeCondition } from './conditions.js';
import { abilityMod } from './abilities.js';

/** Contorna zonas no chão? Só quem tem Inteligência de modificador 0 ou mais. */
export function contornaZonas(monster) {
  return abilityMod(monster.abilities?.int ?? 10) >= 0;
}

/**
 * Roda um planejador de caminho primeiro no mapa que NÃO pisa na Graxa (para
 * quem tem juízo) e, se ele não achar nada, no mapa normal: o esperto desvia
 * quando dá, mas não fica parado se a única passagem é pela graxa.
 */
function comDesvio(enc, monster, planejar) {
  if (enc.zonas?.length && contornaZonas(monster)) {
    const desviando = planejar(enc.reachableFor(monster, { evitarZonas: true }));
    if (desviando) return desviando;
  }
  return planejar(enc.reachableFor(monster));
}

function scoreTarget(enc, monster, target) {
  // Menor é melhor.
  let score = distanceFt(monster.pos, target.pos);
  // Duelo Compelido: quem o desafiou é o único alvo que ele quer.
  if (getCondition(monster, 'duelo')?.source === target.id) score -= 500;
  score -= (1 - target.hp / target.maxHp) * 30;        // machucado atrai
  if (target.ac <= 13) score -= 10;                     // alvo mole
  if (hasCondition(target, 'caido')) score -= 8;
  if (target.className === 'Mago' || target.className === 'Clérigo') score -= 12;
  return score;
}

export function takeMonsterTurn(enc, monster) {
  // Incapacitado (atordoado, paralisado) não faz nada no turno.
  if (monster.dead || hasCondition(monster, 'inconsciente') || conditionEffects(monster).incapacitated) {
    enc.endTurn(monster);
    return;
  }

  // A cena pode gastar o turno do monstro antes da IA (os lobos acorrentados
  // do esconderijo puxando a corrente). Devolver true encerra o turno.
  if (enc.antesDoTurno?.(monster)) {
    enc.endTurn(monster);
    return;
  }

  // Comando ("Ajoelhe!"): cai e perde o turno.
  if (hasCondition(monster, 'comandado')) {
    removeCondition(monster, 'comandado');
    addCondition(monster, 'caido');
    enc.say('condicao', `${monster.name} obedece o comando: ajoelha e perde o turno.`);
    enc.endTurn(monster);
    return;
  }

  // Acalmar Emoções: indiferente, não ataca ninguém até o perigo ser real
  // (`acordaIndiferentes`, no motor, tira a calma quando um inimigo fere).
  if (getCondition(monster, 'calmo')?.data?.modo === 'indiferente') {
    enc.say('condicao', `${monster.name} observa, indiferente.`);
    enc.endTurn(monster);
    return;
  }

  // Sugestão: abandona a luta e se afasta do grupo (a sugestão é sempre esta, no jogo)
  // até ser ferido por quem a deu ou pelos aliados dela (`combat.js`, applyDamage).
  if (hasCondition(monster, 'sugerido')) {
    const grupo = enc.enemiesOf(monster);
    enc.say('condicao', `${monster.name} segue a sugestão: larga a luta e se afasta.`);
    if (grupo.length) {
      enc.dash(monster);
      retreat(enc, monster, grupo);
    }
    enc.endTurn(monster);
    return;
  }

  // Coroa da Loucura: antes de se mover, ataca de perto o aliado mais próximo
  // dele. Sem aliado vivo ou sem arma de perto, age normal.
  if (hasCondition(monster, 'coroaDaLoucura')) {
    const irmaos = enc.alliesOf(monster)
      .filter((a) => !hasCondition(a, 'inconsciente'))
      .sort((a, b) => distanceFt(monster.pos, a.pos) - distanceFt(monster.pos, b.pos));
    if (irmaos.length && monster.attacks?.some((a) => !a.ranged)) {
      if (hasCondition(monster, 'caido')) enc.standUp(monster);
      let golpe = pickReachableTarget(enc, monster, irmaos, { meleeOnly: true });
      if (!golpe) {
        const plano = planApproach(enc, monster, irmaos, { meleeOnly: true });
        if (plano) {
          if (plano.path.length > 1) enc.moveAlong(monster, plano.path);
          if (!monster.dead && !hasCondition(monster, 'inconsciente')) golpe = pickReachableTarget(enc, monster, irmaos, { meleeOnly: true });
        }
      }
      enc.say('condicao', `${monster.name}, coroado de loucura, volta-se contra os seus.`);
      if (golpe && !monster.dead) enc.attackAction(monster, golpe.target, golpe.weaponName);
      enc.endTurn(monster);
      return;
    }
  }

  // Medo: quem está amedrontado pela magia corre para longe de quem o
  // assustou (Disparada), pelo caminho que puder, e não ataca.
  const medo = getCondition(monster, 'amedrontado');
  // Só a magia Medo manda correr; o medo do Golpe Colérico só atrapalha.
  const assustador = medo?.data?.foge && enc.combatants.find((c) => c.id === medo.source && !c.dead);
  if (assustador) {
    enc.dash(monster);
    retreat(enc, monster, [assustador]);
    enc.endTurn(monster);
    return;
  }

  // Enfeitiçar Pessoa: quem está encantado não escolhe quem o encantou.
  const encanto = getCondition(monster, 'enfeiticado');
  const enemies = enc.enemiesOf(monster).filter((e) => e.id !== encanto?.source);
  if (enemies.length === 0) {
    enc.endTurn(monster);
    return;
  }

  // Derrubado: levanta antes de tudo (custa metade do deslocamento).
  if (hasCondition(monster, 'caido')) enc.standUp(monster);

  const ranged = monster.attacks?.some((a) => a.ranged);
  const melee = monster.attacks?.find((a) => !a.ranged);
  const adjacentFoes = enemies.filter((e) => isAdjacent(e.pos, monster.pos));

  // Ilusões: sem nada ao alcance para atacar, gasta a ação examinando a Força
  // Fantasmagórica que o fere ou uma Ilusão Menor colada nele.
  if ((hasCondition(monster, 'iludido') || enc.ilusoesAoAlcance(monster).length)
    && !pickReachableTarget(enc, monster, enemies)) {
    if (hasCondition(monster, 'iludido')) enc.investigarIlusao(monster);
    else {
      // Colado na ilusão: primeiro tenta chegar a alguém; só examina se continuar sem alvo.
      const plano = planApproach(enc, monster, enemies, { meleeOnly: true });
      if (plano?.path.length > 1) enc.moveAlong(monster, plano.path);
      if (monster.dead || hasCondition(monster, 'inconsciente')) { enc.endTurn(monster); return; }
      const depois = pickReachableTarget(enc, monster, enemies);
      if (depois) enc.attackAction(monster, depois.target, depois.weaponName);
      else enc.examinarIlusao(monster);
    }
    enc.endTurn(monster);
    return;
  }

  // Preso sem ninguém ao alcance: gasta a ação tentando se soltar.
  if ((hasCondition(monster, 'agarrado') || hasCondition(monster, 'contido') || hasCondition(monster, 'presoPorVinhas'))
    && !pickReachableTarget(enc, monster, enemies)) {
    enc.escapar(monster);
    enc.endTurn(monster);
    return;
  }

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

  // 1b: ATIRADOR — atira de onde estiver; a lâmina é só para quem encostou.
  //
  // A regra 2 abaixo manda todo monstro fechar distância, e o motivo está
  // escrito lá: arco curto alcança o tabuleiro inteiro, e se todo mundo
  // atirasse desde o primeiro turno o posicionamento deixaria de importar.
  // Mas o goblin ARQUEIRO existe justamente para atirar, e quem tem
  // `tatica: 'atirador'` pula essa preferência.
  //
  // Chegar aqui já quer dizer que ninguém está colado: se estivesse, a regra
  // 1 acima teria usado a arma de corpo a corpo — o certo, porque atirar com
  // inimigo adjacente dá desvantagem. Então, em ordem:
  //   1. tiro no alcance NORMAL daqui;
  //   2. andar até um ponto de tiro normal, sem encostar em ninguém, e atirar;
  //   3. tiro no alcance LONGO daqui, com desvantagem — só quando não há como
  //      chegar ao normal neste turno.
  // `canAttack` aceita o alcance longo, então sem essa ordem o arqueiro
  // atiraria com desvantagem de onde está em vez de dar alguns passos.
  if (monster.tatica === 'atirador') {
    const atira = (alvo) => enc.attackAction(monster, alvo.target, alvo.weaponName);
    const tiro = pickReachableTarget(enc, monster, ordered, { rangedOnly: true, normalOnly: true });
    if (tiro) {
      atira(tiro);
      enc.endTurn(monster);
      return;
    }
    const posto = planShot(enc, monster, ordered, enemies);
    if (posto) {
      if (posto.path.length > 1) enc.moveAlong(monster, posto.path);
      if (!monster.dead && !hasCondition(monster, 'inconsciente')) {
        const depois = pickReachableTarget(enc, monster, ordered, { rangedOnly: true });
        if (depois) atira(depois);
      }
      enc.endTurn(monster);
      return;
    }
    const longo = pickReachableTarget(enc, monster, ordered, { rangedOnly: true });
    if (longo) {
      atira(longo);
      enc.endTurn(monster);
      return;
    }
    // Nenhum tiro possível neste turno: segue as regras de todos.
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
  const passo = comDesvio(enc, monster, (reached) => {
    let best = null;
    for (const node of reached.values()) {
      if (enc.occupied(node.x, node.y, monster)) continue;
      const d = distanceFt({ x: node.x, y: node.y }, closest.pos);
      if (!best || d < best.d) best = { d, node };
    }
    return best && best.node.cost > 0 ? Battlefield.pathFrom(reached, best.node) : null;
  });
  if (passo) enc.moveAlong(monster, passo);
  enc.endTurn(monster);
}

function pickReachableTarget(enc, monster, targets, { meleeOnly = false, rangedOnly = false, normalOnly = false } = {}) {
  for (const target of targets) {
    for (const atk of monster.attacks ?? []) {
      if (meleeOnly && atk.ranged) continue;
      if (rangedOnly && !atk.ranged) continue;
      const check = enc.canAttack(monster, target, atk.name);
      if (!check.ok) continue;
      if (normalOnly && check.longRange) continue;
      // Ataque corpo a corpo precisa estar no alcance de verdade.
      if (!atk.ranged && distanceFt(monster.pos, target.pos) > (atk.reachFt ?? 5)) continue;
      return { target, weaponName: atk.name };
    }
  }
  return null;
}

function planApproach(enc, monster, targets, opcoes = {}) {
  return comDesvio(enc, monster, (reached) => planApproachEm(enc, monster, targets, reached, opcoes));
}

function planApproachEm(enc, monster, targets, reached, { meleeOnly = false } = {}) {
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

/**
 * Um ponto de tiro para o atirador: alcançável neste turno, livre, SEM
 * encostar em nenhum inimigo, com linha de visão e dentro do alcance NORMAL
 * do arco de pelo menos um alvo. O alcance longo fica de fora de propósito:
 * dá desvantagem, e andar até o normal custa só movimento.
 *
 * Entre os pontos possíveis vence o do alvo mais bem pontuado e, entre
 * iguais, o caminho mais curto — o mesmo critério de `planApproach`.
 */
function planShot(enc, monster, targets, enemies) {
  return comDesvio(enc, monster, (reached) => planShotEm(enc, monster, targets, enemies, reached));
}

function planShotEm(enc, monster, targets, enemies, reached) {
  const arco = monster.attacks?.find((a) => a.ranged);
  if (!arco) return null;
  let best = null;
  for (const node of reached.values()) {
    if (enc.occupied(node.x, node.y, monster)) continue;
    const spot = { x: node.x, y: node.y, f: monster.pos.f };
    if (enemies.some((e) => isAdjacent(spot, e.pos))) continue;
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      if (distanceFt(spot, t.pos) > arco.rangeFt) continue;
      if (!enc.field.hasLineOfSight(spot, t.pos)) continue;
      const rank = i * 1000 + node.cost;
      if (!best || rank < best.rank) best = { rank, node };
      break;
    }
  }
  if (!best) return null;
  return { path: Battlefield.pathFrom(reached, best.node) };
}

function retreat(enc, monster, threats) {
  const fuga = comDesvio(enc, monster, (reached) => {
    let best = null;
    for (const node of reached.values()) {
      if (enc.occupied(node.x, node.y, monster)) continue;
      const spot = { x: node.x, y: node.y };
      const nearest = Math.min(...threats.map((t) => distanceFt(spot, t.pos)));
      const score = -nearest;
      if (!best || score < best.score) best = { score, node };
    }
    return best && best.node.cost > 0 ? Battlefield.pathFrom(reached, best.node) : null;
  });
  if (fuga) enc.moveAlong(monster, fuga);
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
    // delayMs pode ser função: o jogo passa uma que soma a animação em curso.
    const espera = typeof delayMs === 'function' ? delayMs() : delayMs;
    await new Promise((r) => setTimeout(r, espera));
  }
}
