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
  //
  // A DISTÂNCIA PESA TRÊS VEZES. Antes ela entrava em pé de igualdade com o
  // apetite, e a soma dos bônus (mago de armadura leve: 22) comprava 6 m de
  // caminhada — então o bando inteiro passava pela guerreira e ia no mago,
  // toda luta, desde o primeiro turno. Medido: em vinte sorteios do primeiro
  // turno da emboscada, os quatro goblins bateram só no clérigo e no mago.
  //
  // Isso não é só monótono, é jogar mal: atravessar a linha custa ataque de
  // oportunidade e deixa o goblin cercado. Com o peso em três, os bônus
  // decidem ENTRE alvos de distância parecida, que é o que eles são.
  let score = distanceFt(monster.pos, target.pos) * 2;
  // Duelo Compelido: quem o desafiou é o único alvo que ele quer.
  if (getCondition(monster, 'duelo')?.source === target.id) score -= 500;
  // QUEM JÁ ESTÁ COLADO NELE é o alvo. Sair de perto para procurar outro dá
  // ataque de oportunidade de graça, e atacar à distância com um inimigo ao
  // lado é com desvantagem — as duas coisas que um goblin não faria.
  if (enc.field.vizinhos(monster.pos, target.pos)) score -= 25;
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

  // Stirge grudado: no começo do turno drena o sangue em vez de atacar.
  if (monster.grudadoEm && enc.drenarSangue(monster)) {
    enc.endTurn(monster);
    return;
  }
  // Saciado: voa para longe de todos e não ataca mais.
  if (monster.saciado) {
    const longe = enc.enemiesOf(monster).filter((e) => !e.dead);
    if (longe.length) retreat(enc, monster, longe);
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

  // CONJURADOR que joga as magias no turno (o Cajavidro): `conjuraNoTurno` no
  // bloco. A magia vem antes da arma; sem magia que sirva, segue a IA de sempre.
  // O drow abre com o FOGO DAS FADAS quando dois ou mais heróis cabem no cubo.
  if (fogoDasFadasNoTurno(enc, monster, enemies)) {
    enc.endTurn(monster);
    return;
  }
  if (monster.spellcasting?.conjuraNoTurno && conjurarNoTurno(enc, monster, enemies)) {
    enc.endTurn(monster);
    return;
  }

  const ranged = monster.attacks?.some((a) => a.ranged);
  const melee = monster.attacks?.find((a) => !a.ranged);
  const adjacentFoes = enemies.filter((e) => enc.field.vizinhos(e.pos, monster.pos));

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
  // Agressivo (o orc): quando o deslocamento normal não basta para encostar,
  // a ação bônus vira mais um deslocamento para chegar e bater no mesmo turno.
  let plan = planApproach(enc, monster, ordered, { meleeOnly: true });
  if (!plan && monster.traits?.includes('agressivo') && enc.investidaAgressiva(monster)) {
    plan = planApproach(enc, monster, ordered, { meleeOnly: true });
  }
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

  // 4: nem atirar dá — encosta o máximo que conseguir. A distância é a do
  // CAMINHO até o alvo, não a da linha reta: pela linha reta, quem está numa
  // caverna fica colado na parede do fundo mais perto do alvo, e nunca sai
  // pela boca (o bando do Cume da Wyvern ficou assim, parado).
  const closest = ordered[0];
  const ateOAlvo = enc.field.reachable(closest.pos, 2000, () => false, () => true, monster.pos.f ?? 1);
  const passo = comDesvio(enc, monster, (reached) => {
    let best = null;
    for (const node of reached.values()) {
      if (enc.occupied(node.x, node.y, monster)) continue;
      const d = ateOAlvo.get(key(node.x, node.y))?.cost ?? (5000 + distanceFt({ x: node.x, y: node.y }, closest.pos));
      if (!best || d < best.d) best = { d, node };
    }
    return best && best.node.cost > 0 ? Battlefield.pathFrom(reached, best.node) : null;
  });
  if (passo) enc.moveAlong(monster, passo);
  // Depois de andar, ainda ha a acao: o que ficou ao alcance (o olhar do
  // vigia a 9 m, o arco que agora alcanca) e usado em vez de desperdicado.
  if (!monster.dead && !hasCondition(monster, 'inconsciente') && !monster.actionUsed) {
    const depois = pickReachableTarget(enc, monster, ordered);
    if (depois) enc.attackAction(monster, depois.target, depois.weaponName);
  }
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
    if (enemies.some((e) => enc.field.vizinhos(spot, e.pos))) continue;
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

/**
 * Criaturas invocadas em "agir sozinho": quando chega a vez do grupo, a IA aliada
 * joga o turno de cada uma (`takeMonsterTurn` só pergunta por `enemiesOf`, que olha
 * o lado). `donoId` restringe aos invocados de um herói; sem ele, todos do lado.
 */
export async function runAutoSummons(enc, { delayMs = 0, onStep = () => {}, donoId = null } = {}) {
  const pendentes = () => enc.combatants.filter((c) => c.invocado?.auto && c.side === enc.side && !c.acted && !c.dead
    && !hasCondition(c, 'inconsciente') && (!donoId || c.invocado.donoId === donoId));
  while (!enc.over) {
    const c = pendentes()[0];
    if (!c) break;
    onStep(c);
    takeMonsterTurn(enc, c);
    if (enc.over) break;
    const espera = typeof delayMs === 'function' ? delayMs() : delayMs;
    if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  }
}

/**
 * "Terminar turno" de um herói: encerra também os invocados dele que ainda não agiram.
 * Os que estão em "agir sozinho" jogam o turno (IA aliada); os manuais só passam a vez.
 * Um invocado que termina o próprio turno encerra só a si.
 */
export async function encerrarTurnoComInvocados(enc, actor, { delayMs = 0, onStep = () => {} } = {}) {
  if (!actor.invocado) {
    const meus = enc.combatants.filter((c) => c.invocado?.donoId === actor.id && !c.acted && !c.dead
      && !hasCondition(c, 'inconsciente'));
    for (const c of meus) {
      if (c.acted) continue;
      if (c.invocado.auto) {
        onStep(c);
        takeMonsterTurn(enc, c);
        const espera = typeof delayMs === 'function' ? delayMs() : delayMs;
        if (espera > 0) await new Promise((r) => setTimeout(r, espera));
      } else {
        enc.endTurn(c);
      }
      if (enc.over) return;
    }
  }
  if (!actor.acted) enc.endTurn(actor);
}


/**
 * A tática de quem conjura pelo bloco (o Cajavidro, do livro da aventura):
 *   1. ferido (metade dos PV ou menos) e com inimigo colado: Passo Nebuloso
 *      para longe, como ação bônus, e o turno continua;
 *   2. sem concentração: Imobilizar Pessoa no humanoide mais perto que ainda
 *      não tentou prender;
 *   3. preso alguém e outro colado: Enfeitiçar Pessoa nele (não o ataca);
 *   4. Mísseis Mágicos no 1º círculo (o 2º fica para prender e fugir);
 *   5. sem espaço: anda até colar e usa Toque Chocante.
 * Devolve true se gastou a ação numa magia.
 */
function conjurarNoTurno(enc, m, enemies) {
  const podeVer = (t) => enc.field.hasLineOfSight(m.pos, t.pos);
  const perto = enemies
    .filter((e) => !e.dead && !hasCondition(e, 'inconsciente'))
    .sort((a, b) => distanceFt(m.pos, a.pos) - distanceFt(m.pos, b.pos));
  if (!perto.length) return false;
  const colado = perto.find((e) => enc.field.vizinhos(e.pos, m.pos));
  const slots = m.spellcasting.slots ?? [];

  if (colado && m.hp <= m.maxHp / 2 && !m.bonusUsed && (slots[2] ?? 0) > 0) {
    const destino = casaLonge(enc, m, perto, 30);
    if (destino) enc.castSpell(m, 'passoNebuloso', { point: destino, circulo: 2 });
  }
  if (m.dead || hasCondition(m, 'inconsciente') || m.actionUsed) return m.actionUsed;
  const depoisDoBonus = (m.magiasNoTurno ?? []).some((x) => x.castTime === 'bonus');

  const tenta = (id, opts) => enc.castSpell(m, id, opts).ok;
  if (!depoisDoBonus && !m.concentrating && (slots[2] ?? 0) > 1) {
    m.tentouPrender ??= new Set();
    const humanoide = (e) => !e.tipo || e.tipo === 'humanoide';
    const alvo = perto.find((e) => humanoide(e) && !m.tentouPrender.has(e.id)
      && distanceFt(m.pos, e.pos) <= 60 && podeVer(e) && !hasCondition(e, 'paralisado'));
    if (alvo) {
      m.tentouPrender.add(alvo.id);
      if (tenta('imobilizarPessoa', { target: alvo, point: alvo.pos, circulo: 2 })) return true;
    }
  }
  const livre = perto.find((e) => enc.field.vizinhos(e.pos, m.pos) && !hasCondition(e, 'paralisado') && !hasCondition(e, 'enfeiticado'));
  if (!depoisDoBonus && m.concentrating && livre && (slots[1] ?? 0) > 0
    && tenta('enfeiticarPessoa', { target: livre, point: livre.pos, circulo: 1 })) return true;
  // Os dardos vão no mais fraco só até bastar para derrubá-lo (3,5 cada);
  // o resto vai no próximo. Dardo em quem já caiu é falha no teste de morte.
  const aoAlcance = perto
    .filter((e) => distanceFt(m.pos, e.pos) <= 120 && podeVer(e))
    .sort((a, b) => a.hp - b.hp);
  if (!depoisDoBonus && aoAlcance.length && (slots[1] ?? 0) > 0) {
    const dardos = [];
    for (const e of aoAlcance) {
      const precisa = Math.max(1, Math.ceil(e.hp / 3.5));
      for (let k = 0; k < precisa && dardos.length < 3; k++) dardos.push(e);
      if (dardos.length >= 3) break;
    }
    while (dardos.length < 3) dardos.push(dardos[dardos.length - 1]);
    if (tenta('misselMagico', { target: dardos[0], targets: dardos, point: dardos[0].pos, circulo: 1 })) return true;
  }
  // Truque de toque: se não está colado, anda até colar antes.
  let junto = perto.find((e) => enc.field.vizinhos(e.pos, m.pos));
  if (!junto && !depoisDoBonus && magiasProntasTem(m, 'toqueChocante')) {
    const alvo = perto[0];
    const reach = enc.reachableFor(m);
    let melhor = null;
    for (const n of reach.values()) {
      if (enc.occupied(n.x, n.y, m) || !enc.field.vizinhos({ x: n.x, y: n.y }, alvo.pos)) continue;
      if (!melhor || n.cost < melhor.cost) melhor = n;
    }
    if (melhor) {
      enc.moveAlong(m, Battlefield.pathFrom(reach, melhor));
      if (!m.dead && enc.field.vizinhos(m.pos, alvo.pos)) junto = alvo;
    }
  }
  if (junto && tenta('toqueChocante', { target: junto, point: junto.pos })) return true;
  // Depois do Passo Nebuloso só cabe truque: um mago não volta para o cajado.
  if (depoisDoBonus) {
    enc.dodge(m);
    return true;
  }
  return false;
}

const magiasProntasTem = (m, id) => (m.spellcasting?.cantrips ?? []).includes(id)
  || (m.spellcasting?.prepared ?? []).includes(id);

/** A casa livre e visível até `pes` que fica mais longe do inimigo mais próximo. */
function casaLonge(enc, m, inimigos, pes) {
  const r = pes / 5;
  let melhor = null;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const x = m.pos.x + dx;
      const y = m.pos.y + dy;
      if (!enc.field.inside(x, y) || enc.field.blocksMove(x, y) || enc.occupied(x, y, m)) continue;
      if (!enc.field.hasLineOfSight(m.pos, { x, y })) continue;
      const d = Math.min(...inimigos.map((e) => distanceFt({ x, y }, e.pos)));
      if (!melhor || d > melhor.d) melhor = { d, x, y };
    }
  }
  return melhor && melhor.d > 5 ? { x: melhor.x, y: melhor.y } : null;
}

/**
 * Fogo das Fadas (o drow, por conjuração inata): sem concentração ativa e com
 * espaço, mira o cubo de 6 m que pega mais heróis a até 18 m. Só com dois ou
 * mais: um alvo só não paga a ação de dois golpes de espada.
 */
function fogoDasFadasNoTurno(enc, m, enemies) {
  const sc = m.spellcasting;
  if (!sc?.prepared?.includes('fogoDasFadas') || m.concentrating || (sc.slots?.[1] ?? 0) < 1) return false;
  const vivos = enemies.filter((e) => !e.dead && !hasCondition(e, 'inconsciente') && !hasCondition(e, 'feerico'));
  let melhor = null;
  for (const e of vivos) {
    if (distanceFt(m.pos, e.pos) > 60 || !enc.field.hasLineOfSight(m.pos, e.pos)) continue;
    const pegos = vivos.filter((o) => Math.abs(o.pos.x - e.pos.x) <= 1 && Math.abs(o.pos.y - e.pos.y) <= 1).length;
    if (!melhor || pegos > melhor.pegos) melhor = { pegos, e };
  }
  if (!melhor || melhor.pegos < 2) return false;
  return enc.castSpell(m, 'fogoDasFadas', { target: melhor.e, point: melhor.e.pos, circulo: 1 }).ok;
}
