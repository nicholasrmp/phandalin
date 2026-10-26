import { distanceFt, Battlefield as BF } from '../../core/grid.js';
import { hasCondition, conditionEffects } from '../../rules/conditions.js';
import { WEAPONS } from '../../rules/equipment.js';
import { getSpell, magiasProntas } from '../../rules/spells.js';
export function jogador(enc, c) {
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

  const _custo = enc.field.reachable(c.pos, 3000, (x, y) => false);
  const _d = (f) => (_custo.get(f.pos.x + ',' + f.pos.y)?.cost ?? 9000) + distanceFt(c.pos, f.pos) / 100;
  const nearest = foes.slice().sort((a, b) => _d(a) - _d(b))[0];

  /**
   * MAGIA DE ÁREA: ESCOLHE O CENTRO, E ACEITA O FOGO AMIGO QUANDO VALE.
   *
   * A política antiga conjurava a magia de maior círculo centrada no inimigo
   * mais próximo, sem olhar quem mais estava ali: no 5º nível o mago jogava
   * Bola de Fogo em cima do próprio grupo. Isso inflava "alguém caiu" em
   * metade das lutas — era o mago derrubando os amigos, não o monstro.
   *
   * MAS A PRIMEIRA CORREÇÃO FOI PIOR QUE O DEFEITO, e a medição mostrou:
   * proibir qualquer aliado na área fazia o mago NUNCA lançar contra um bando
   * grande em contato, porque não existe centro limpo. Nas células de
   * fronteira da tabela da estrada no 5º nível, a derrota saltou de 0% para
   * 42-60% — o grupo perdia por não usar a própria melhor arma.
   *
   * A regra que ficou é a que um jogador competente usa: queima-se um amigo
   * para matar vários inimigos, mas não se derruba um amigo. Então o centro
   * escolhido é o que pega MAIS inimigos, e um aliado na área só é aceito
   * quando os inimigos pegos valem o dobro dos aliados pegos E nenhum aliado
   * dentro está abaixo de metade dos PV. Os cortes (o dobro, a metade) são
   * nossos, e estão aqui para serem remedidos se a conta mudar.
   */
  const dentroDaArea = (s, ponto) => {
    const casas = enc.areaDaMagia(c, s, ponto) ?? [];
    if (!casas.length) return null;
    const dentro = new Set(casas.map((p) => `${p.x},${p.y}`));
    const gente = s.centradoEmSi ? enc.alliesOf(c) : [c, ...enc.alliesOf(c)];
    return {
      inimigos: foes.filter((f) => !f.dead && dentro.has(`${f.pos.x},${f.pos.y}`)).length,
      amigos: gente.filter((a) => !a.dead && dentro.has(`${a.pos.x},${a.pos.y}`)),
    };
  };

  /** O melhor centro para esta magia, ou null se nenhum presta. */
  const centroPara = (s) => {
    const candidatos = foes
      .filter((f) => !f.dead
        && (s.rangeFt <= 0 || distanceFt(c.pos, f.pos) <= s.rangeFt)
        && enc.field.hasLineOfSight(c.pos, f.pos));
    if (!candidatos.length) return null;
    // Sem forma, a magia pega só o alvo: o mais próximo serve, como antes.
    if (!s.shape) {
      return candidatos.sort((a, b) => distanceFt(c.pos, a.pos) - distanceFt(c.pos, b.pos))[0];
    }
    let melhor = null;
    for (const f of candidatos) {
      const conta = dentroDaArea(s, f.pos);
      if (!conta) continue;
      // A conta do fogo amigo, em dois degraus, e os dois medidos:
      //   - o dobro de inimigos basta, se nenhum amigo dentro estiver abaixo
      //     de metade dos PV (não se queima quem está prestes a cair);
      //   - o TRIPLO basta de qualquer jeito. Esta segunda linha existe por
      //     medição: sem ela, o mago parava de lançar justo quando a luta
      //     apertava e os amigos estavam machucados — e contra um bando de
      //     onze ou doze, em que a Bola de Fogo é a única resposta, o grupo
      //     passava de 0% a 30-38% de derrota nas células de fronteira da
      //     tabela da estrada no 5º nível.
      const vale = conta.amigos.length === 0
        || conta.inimigos >= 3 * conta.amigos.length
        || (conta.inimigos >= 2 * conta.amigos.length
          && conta.amigos.every((a) => a.hp > a.maxHp * 0.5));
      if (!vale) continue;
      const nota = conta.inimigos - conta.amigos.length;
      if (!melhor || nota > melhor.nota) melhor = { f, nota };
    }
    return melhor?.f ?? null;
  };

  if (!c.actionUsed && c.spellcasting) {
    // Magias de círculo antes dos truques, como antes.
    for (const sid of [...prontas].sort((a, b) => getSpell(b).level - getSpell(a).level)) {
      const s = getSpell(sid);
      if (s.kind !== 'attack' && s.kind !== 'auto' && s.kind !== 'save') continue;
      if (!s.damage) continue;
      if (s.level > 0 && !c.spellcasting.slots[s.level]) continue;
      const alvo = centroPara(s);
      if (!alvo) continue;
      const _r = enc.castSpell(c, sid, { target: alvo, point: alvo.pos });
      if (_r && _r.ok === false) continue;
      enc.endTurn(c);
      return;
    }
  }

  if (c.features?.includes('secondWind') && c.hp < c.maxHp * 0.4 && !c.bonusUsed) {
    enc.useFeature(c, 'secondWind');
  }

  const melee = c.weapons?.find((w) => !WEAPONS[w].ranged);
  const ranged = c.weapons?.find((w) => WEAPONS[w].ranged);

  // Só se ataca com a arma na mão: a outra é sacada antes (a interação
  // gratuita do turno; `sacarArma` cobra a ação se ela já foi gasta).
  const naMao = (w) => enc.empunha(c, w) || enc.sacarArma(c, w).ok;

  if (!c.actionUsed && melee && enc.field.contato(c.pos, nearest.pos) && naMao(melee)) {
    enc.attackAction(c, nearest, melee);
    enc.endTurn(c);
    return;
  }

  /*
   * ANDAR PARA ONDE SE ENXERGA, e não só para perto.
   *
   * A conta antiga escolhia a casa de MENOR DISTÂNCIA EM LINHA RETA até o
   * inimigo. Num mapa com parede isso trava o herói: encostado nela, com o
   * inimigo do outro lado, ele JÁ está na casa mais próxima — então não anda,
   * e o ataque à distância falha por falta de visão. Fica parado, turno após
   * turno. Foi assim que um mago passou onze rodadas atrás da parede de um
   * porão, e toda medição feita em mapa de parede herdou isso.
   *
   * Agora a casa com linha de visão ganha da casa mais perto. E quando
   * nenhuma casa DESTE turno enxerga, a busca abre o orçamento para achar a
   * mais próxima que enxergue e anda o que der nessa direção — é o que
   * desencosta o herói da parede em vez de o deixar ali.
   */
  const reached = enc.reachableFor(c);
  const enxerga = (p) => enc.field.hasLineOfSight(p, nearest.pos);
  let best = null;
  for (const node of reached.values()) {
    if (enc.occupied(node.x, node.y, c)) continue;
    const cego = enxerga(node) ? 0 : 1;
    const d = distanceFt({ x: node.x, y: node.y }, nearest.pos);
    if (!best || cego < best.cego || (cego === best.cego && d < best.d)) best = { cego, d, node };
  }
  if (best && best.cego === 1) {
    const longe = enc.field.reachable(c.pos, 300, (x, y) => enc.occupied(x, y, c));
    let mira = null;
    for (const node of longe.values()) {
      if (node.parar === false || !enxerga(node)) continue;
      if (!mira || node.cost < mira.cost) mira = node;
    }
    if (mira) {
      // O caminho até lá, cortado no que cabe neste turno.
      const passos = BF.pathFrom(longe, mira).filter((p) => reached.has(`${p.x},${p.y}`));
      const ate = passos.length ? reached.get(`${passos[passos.length - 1].x},${passos[passos.length - 1].y}`) : null;
      if (ate && ate.cost > 0 && !enc.occupied(ate.x, ate.y, c)) best = { cego: 1, d: 0, node: ate };
    }
  }
  if (best && best.node.cost > 0) enc.moveAlong(c, BF.pathFrom(reached, best.node));

  if (!c.actionUsed && !c.dead && !hasCondition(c, 'inconsciente')) {
    const d = distanceFt(c.pos, nearest.pos);
    if (melee && enc.field.contato(c.pos, nearest.pos) && naMao(melee)) enc.attackAction(c, nearest, melee);
    else if (ranged && !enc.field.contato(c.pos, nearest.pos) && naMao(ranged) && enc.canAttack(c, nearest, ranged).ok) enc.attackAction(c, nearest, ranged);
  }
  if (!c.acted) enc.endTurn(c);
}

