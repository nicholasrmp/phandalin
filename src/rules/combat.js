// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
//
// Motor de combate. Iniciativa POR LADO: rola-se uma vez para o grupo e uma
// para os inimigos; o lado vencedor age inteiro (na ordem que o jogador quiser)
// e depois passa a vez. É mais rápido que iniciativa individual e corta a fila
// de espera, que é o que mata jogo tático com 4 humanos.
//
// O motor é autoritativo e puro: ele não sabe desenhar. A camada de view só lê
// estado e chama métodos. É isso que vai permitir movê-lo para o servidor sem
// reescrever nada.

import { attackRoll, damageRoll, savingThrow, d20, roll, formatModifier, parseDice } from '../core/dice.js';
import { Battlefield, distanceFt, isAdjacent, key } from '../core/grid.js';
import {
  abilityMod, saveBonus, skillBonus, spellSaveDc, spellAttackBonus,
  proficiencyBonus, ABILITY_NAME,
} from './abilities.js';
import {
  WEAPONS, weaponAbility,
  itemDeId, nomeDeId, quantosNaMochila, consumirDaMochila,
} from './equipment.js';
import { addCondition, removeCondition, hasCondition, getCondition, conditionEffects, CONDITIONS } from './conditions.js';

/**
 * REGRAS DA CASA — nada aqui é SRD.
 *
 * `ignite`: no 5e dano de fogo não incendeia ninguém. Aqui uma magia de fogo
 * tem chance de pegar: a criatura passa a sofrer 1d4 no início do turno dela.
 * Existe porque dá leitura visual ao combate (a criatura pega fogo na tela) e
 * porque recompensa quem escolhe a natureza certa. Ponha `enabled: false` para
 * jogar só com as regras do livro.
 */
export const HOUSE_RULES = {
  ignite: { enabled: true, chance: 0.35, rounds: 2, damage: '1d4' },
};
import { getSpell } from './spells.js';
import { spellMod } from './party.js';

// ---- rolagens que se explicam ---------------------------------------------
//
// POR QUE ISTO EXISTE
// Metade da tática de 5e é fabricar vantagem. O log dizia "d20[18]+4 = 22 vs
// CA 16" e guardava para si POR QUE a rolagem teve dois dados e de onde veio o
// +4. Quem está aprendendo não tem como descobrir sozinho — o número já saiu, e
// o jogador nunca aprende a procurar a vantagem que não vê acontecer.
//
// Nada aqui decide coisa alguma: são funções puras que põem no papel a conta
// que o motor já fez. NENHUMA consome o gerador — se alguma rolasse um dado, o
// equilíbrio mudaria sem uma única regra mudar.

/**
 * Fecha o modo da rolagem a partir das duas balanças.
 *
 * Vantagem e desvantagem se anulam em 5e, e isso precisa de nome próprio: é a
 * regra mais contraintuitiva do sistema. Quem conquistou vantagem e viu a
 * rolagem sair com um dado só merece saber que ela foi cancelada, em vez de
 * achar que o jogo esqueceu.
 */
function fecharModo(mods) {
  mods.anulado = mods.advantage && mods.disadvantage;
  mods.mode = mods.anulado ? 'anulado'
    : mods.advantage ? 'vantagem'
      : mods.disadvantage ? 'desvantagem' : 'normal';
  return mods;
}

/**
 * Registra uma fonte de vantagem/desvantagem.
 *
 * `reasons` continua sendo a lista achatada que `odds.js` e o HUD já leem — não
 * se renomeia nada. O acréscimo é saber para que LADO cada motivo pesou, que é
 * justamente o que se perdia quando os dois lados caíam no mesmo array.
 */
function fonte(mods, lado, motivo) {
  if (lado === 'vantagem') {
    mods.advantage = true;
    mods.vantagens.push(motivo);
  } else {
    mods.disadvantage = true;
    mods.desvantagens.push(motivo);
  }
  mods.reasons.push(motivo);
  return fecharModo(mods);
}

/** Pacote de modificadores vazio, já com as duas listas por lado. */
const modsVazios = () => fecharModo({
  advantage: false, disadvantage: false, reasons: [], vantagens: [], desvantagens: [],
});

const MODO_TEXTO = {
  vantagem: 'vantagem: 2d20, vale o maior',
  desvantagem: 'desvantagem: 2d20, vale o menor',
  anulado: 'vantagem E desvantagem — se anulam, rolagem normal',
  normal: null,
};

/** Frase que nomeia o modo e de onde veio cada lado da balança. */
function explicarModo(mods) {
  const lados = [];
  if (mods.vantagens?.length) lados.push(`vantagem por ${mods.vantagens.join(' + ')}`);
  if (mods.desvantagens?.length) lados.push(`desvantagem por ${mods.desvantagens.join(' + ')}`);
  return [MODO_TEXTO[mods.mode], lados.length ? `(${lados.join('; ')})` : null]
    .filter(Boolean).join(' ');
}

/**
 * "+5 (Destreza +3, proficiência +2)".
 *
 * As partes SEMPRE somam o total; quando não somarem, é bug e aparece como tal
 * em vez de mentir uma origem.
 */
function explicarBonus(total, partes) {
  if (!partes?.length) return formatModifier(total);
  const detalhe = partes.map((p) => `${p.rotulo} ${formatModifier(p.valor)}`).join(', ');
  return `${formatModifier(total)} (${detalhe})`;
}

/** Notação dos dados realmente rolados — no crítico, o dobro deles. */
function notacaoDeDados(notacao, critico) {
  const { count, sides } = parseDice(notacao);
  if (!count) return null;
  return `${critico ? count * 2 : count}d${sides}`;
}

/**
 * Uma parcela de dano aberta: dados de um lado, modificador do outro.
 *
 * No crítico dobram os DADOS e não o modificador — é a dúvida mais comum de
 * quem está aprendendo 5e, e um "= 13" cru não responde nenhuma delas.
 */
function contaDeDano(parte) {
  const bits = [];
  const dados = notacaoDeDados(parte.notacao, parte.critico);
  if (dados) bits.push(`${dados}[${parte.dados.join('+')}]`);
  if (parte.mod) bits.push(`mod ${formatModifier(parte.mod)}`);
  const marca = parte.critico ? ' (crítico: dados dobrados)' : '';
  return `${parte.rotulo} ${bits.join(' + ')} = ${parte.total}${marca}`;
}

/** Monta a parcela de dano a partir do que `damageRoll` devolveu. */
function parcelaDeDano(rotulo, dmg) {
  return {
    rotulo,
    notacao: String(dmg.notation),
    dados: [...dmg.rolls],
    mod: dmg.mod,
    total: dmg.total,
    critico: !!dmg.critical,
  };
}

/**
 * Resistência por extenso.
 *
 * O log dizia "resistência 14 vs CD 13" e calava as três coisas que importam:
 * contra O QUE era o teste, com que atributo, e o que o alvo ganha ao passar.
 * "Resistiu" sem dizer se evitou tudo ou só metade não informa nada sobre a
 * decisão de ter gastado a magia ali.
 */
function contaDeResistencia(r) {
  // O cabeçalho diz só "resistência": o atributo já aparece como parcela do
  // bônus, e repetir o nome duas vezes na mesma linha não explica nada.
  if (r.automatica) {
    // Falha automática não rola nada, então mostrar o bônus do alvo seria
    // mentira útil para ninguém: o que importa é QUAL condição o travou.
    return [
      `contra ${r.contra}`,
      `falha automática${r.motivoAutomatico ? ` — ${r.motivoAutomatico} faz este teste falhar sempre` : ''}`,
      `CD ${r.cd} nem chega a ser rolada`,
      `se passasse: ${r.seSucesso}`,
    ].join(' · ');
  }
  return [
    `contra ${r.contra}`,
    `resistência ${explicarBonus(r.bonus, r.bonusPartes)}`,
    `d20[${r.d20Rolls.join('/')}] = ${r.total} vs CD ${r.cd}`,
    r.modo && r.modo !== 'normal' ? MODO_TEXTO[r.modo] : null,
    r.sucesso ? 'passou' : 'falhou',
    `se passar: ${r.seSucesso}`,
  ].filter(Boolean).join(' · ');
}

export class Encounter {
  constructor({ battlefield, party, foes, rng, onLog = () => {}, onEvent = () => {}, reinforcements = null }) {
    this.field = battlefield;
    this.rng = rng;
    this.onLog = onLog;
    this.onEvent = onEvent;
    // Função (round) → { aviso, units } ou null. O motor não sabe QUEM chega;
    // isso é dado do encontro.
    this.reinforcements = reinforcements;

    this.combatants = [...party, ...foes];
    for (const c of this.combatants) {
      c.movementLeftFt = 0;
      c.actionUsed = true;
      c.bonusUsed = true;
      c.reactionUsed = true;
      c.acted = true;
      c.sneakUsedThisTurn = false;
      c.extraActions = 0;
      c.concentrating = null;
    }

    this.round = 0;
    this.side = null;
    this.over = false;
    this.outcome = null;
    this.log = [];
  }

  // ---- consultas -----------------------------------------------------------

  living(side) {
    return this.combatants.filter((c) => c.side === side && !c.dead && !hasCondition(c, 'inconsciente'));
  }

  allOf(side) {
    return this.combatants.filter((c) => c.side === side && !c.dead);
  }

  /**
   * Quem está NESTE quadrado — inclusive quando a âncora dele é outra.
   *
   * Um ogro ancorado em (4,4) também está em (5,4), (4,5) e (5,5). Enquanto
   * isto comparava só a âncora, dava para andar e atacar por dentro do corpo
   * de uma criatura Grande.
   */
  at(x, y) {
    return this.combatants.find((c) => {
      if (c.dead) return false;
      const f = c.pos.f ?? 1;
      return x >= c.pos.x && x < c.pos.x + f && y >= c.pos.y && y < c.pos.y + f;
    });
  }

  occupied(x, y, except = null) {
    const c = this.at(x, y);
    return !!c && c !== except;
  }

  enemiesOf(actor) {
    return this.combatants.filter((c) => c.side !== actor.side && !c.dead && !hasCondition(c, 'inconsciente'));
  }

  alliesOf(actor) {
    return this.combatants.filter((c) => c.side === actor.side && !c.dead && c !== actor);
  }

  speedOf(actor) {
    const fx = conditionEffects(actor);
    if (fx.speedOverride !== null) return fx.speedOverride;
    return Math.max(0, actor.speedFt - fx.speedPenaltyFt);
  }

  // ---- ciclo de turnos -----------------------------------------------------

  start() {
    const partyInit = d20(this.rng, this.bestDex('party'));
    const foeInit = d20(this.rng, this.bestDex('foes'));
    this.say('inicio', `Iniciativa — Grupo ${partyInit.total} × ${foeInit.total} Inimigos`);
    this.round = 1;
    // Guarda quem abriu: a rodada só vira quando a vez volta para esse lado.
    this.firstSide = partyInit.total >= foeInit.total ? 'party' : 'foes';
    this.beginSide(this.firstSide);
  }

  bestDex(side) {
    return Math.max(...this.allOf(side).map((c) => abilityMod(c.abilities.dex)), 0);
  }

  beginSide(side) {
    // Rodada nova começa quando a vez volta para quem abriu.
    if (side === this.firstSide) this.spawnReinforcements();

    this.side = side;
    for (const c of this.allOf(side)) {
      c.movementLeftFt = this.speedOf(c);
      c.actionUsed = false;
      c.bonusUsed = false;
      c.reactionUsed = false;
      c.acted = false;
      c.sneakUsedThisTurn = false;
      c.martialUsedThisTurn = false;
      c.extraActions = 0;
      this.tickConditions(c);
      this.burnTick(c);
      if (hasCondition(c, 'inconsciente') && c.kind === 'pc' && !c.stable) this.deathSave(c);
    }
    this.say('turno', side === 'party' ? `— Turno do grupo (rodada ${this.round}) —` : `— Turno dos inimigos (rodada ${this.round}) —`);
    this.onEvent({ type: 'sideStart', side });
  }

  tickConditions(c) {
    if (!c.conditions?.length) return;
    c.conditions = c.conditions.filter((cond) => {
      const def = CONDITIONS[cond.id];
      if (def?.expiresAtTurnStart) return false;
      if (cond.rounds === Infinity) return true;
      cond.rounds -= 1;
      return cond.rounds > 0;
    });
  }

  /**
   * Reforços do encontro. Existem por causa da iniciativa por lado: quem vence
   * a iniciativa despacha metade do inimigo antes de qualquer um deles agir.
   * Um bando que chega no meio impede o combate de ser decidido na abertura.
   */
  spawnReinforcements() {
    if (!this.reinforcements || this.over) return;
    const wave = this.reinforcements(this.round);
    if (!wave?.units?.length) return;
    for (const unit of wave.units) this.addCombatant(unit);
    this.say('turno', wave.aviso ?? 'Reforços chegam!');
    this.onEvent({ type: 'reinforcements', units: wave.units, aviso: wave.aviso });
  }

  /** Entra em combate já começado. Só age no próximo turno do lado dele. */
  addCombatant(c) {
    c.movementLeftFt = 0;
    c.actionUsed = true;
    c.bonusUsed = true;
    c.reactionUsed = true;
    c.acted = true;
    c.sneakUsedThisTurn = false;
    c.martialUsedThisTurn = false;
    c.extraActions = 0;
    c.concentrating = null;
    this.combatants.push(c);
    return c;
  }

  /**
   * Redirecionar Ataque (Chefe Goblin, SRD): ao ser alvo de um ataque, troca de
   * lugar com um goblin adjacente, que vira o alvo. Gasta a reação dele.
   */
  tryRedirect(target) {
    if (!target.traits?.includes('redirectAttack') || target.reactionUsed) return target;
    const buddy = this.alliesOf(target).find(
      (a) => a.defId === 'goblin' && isAdjacent(a.pos, target.pos) && !hasCondition(a, 'inconsciente'),
    );
    if (!buddy) return target;

    target.reactionUsed = true;
    const swap = { ...target.pos };
    target.pos = { ...buddy.pos };
    buddy.pos = swap;
    this.say('reacao', `${target.name} empurra ${buddy.name} na frente — o golpe vai nele.`);
    this.onEvent({ type: 'redirect', from: target, to: buddy });
    return buddy;
  }

  /**
   * Vantagem Marcial (Hobgoblin, SRD): uma vez por turno, +2d6 se um aliado não
   * incapacitado estiver a até 1,5 m do alvo. É o que faz o grupo pagar caro
   * por ficar amontoado.
   */
  martialApplies(attacker, target) {
    if (!attacker.traits?.includes('martialAdvantage') || attacker.martialUsedThisTurn) return false;
    return this.alliesOf(attacker).some(
      (a) => isAdjacent(a.pos, target.pos) && !conditionEffects(a).incapacitated && !a.dead,
    );
  }

  /** Regra da casa: magia de fogo pode incendiar o alvo. */
  maybeIgnite(target, damageType) {
    const rule = HOUSE_RULES.ignite;
    if (!rule.enabled || damageType !== 'fogo') return;
    if (target.dead || hasCondition(target, 'queimando')) return;
    if (!this.rng.chance(rule.chance)) return;
    addCondition(target, 'queimando', { rounds: rule.rounds, data: { damage: rule.damage } });
    this.say('condicao', `${target.name} pega fogo!`);
    this.onEvent({ type: 'ignite', target });
  }

  /** Regra da casa: quem está queimando sofre dano no início do próprio turno. */
  burnTick(c) {
    const burning = getCondition(c, 'queimando');
    if (!burning || c.dead) return;
    const r = roll(this.rng, burning.data?.damage ?? HOUSE_RULES.ignite.damage);
    this.say('condicao', `${c.name} queima: ${r.total} de fogo.`, `${r.notation}[${r.rolls.join('+')}]`);
    this.onEvent({ type: 'burn', target: c, amount: r.total });
    this.applyDamage(c, r.total, 'fogo', null);
  }

  /** Marca o combatente como tendo terminado e, se o lado acabou, passa a vez. */
  endTurn(actor) {
    actor.acted = true;
    actor.movementLeftFt = 0;
    this.onEvent({ type: 'turnEnd', actor });
    this.maybeEndSide();
  }

  maybeEndSide() {
    if (this.over) return;
    const pending = this.allOf(this.side).filter((c) => !c.acted && !hasCondition(c, 'inconsciente'));
    if (pending.length > 0) return;
    const next = this.side === 'party' ? 'foes' : 'party';
    if (next === this.firstSide) this.round += 1;
    this.beginSide(next);
  }

  checkEnd() {
    if (this.over) return true;
    const partyUp = this.living('party').length;
    const foesUp = this.living('foes').length;
    if (foesUp === 0) {
      this.over = true;
      this.outcome = 'vitoria';
      this.say('fim', 'Inimigos derrotados.');
    } else if (partyUp === 0) {
      this.over = true;
      this.outcome = 'derrota';
      this.say('fim', 'O grupo caiu.');
    }
    if (this.over) this.onEvent({ type: 'end', outcome: this.outcome });
    return this.over;
  }

  // ---- movimento -----------------------------------------------------------

  reachableFor(actor) {
    if (hasCondition(actor, 'inconsciente') || conditionEffects(actor).incapacitated) return new Map();
    const f = actor.pos.f ?? 1;
    return this.field.reachable(
      actor.pos,
      actor.movementLeftFt,
      (x, y) => this.occupied(x, y, actor),
      // Quem ocupa 2x2 só pisa onde os quatro quadrados existem e estão livres
      // de parede. Sem isto o ogro para com metade do corpo dentro da pedra.
      f === 1 ? undefined : (x, y) => {
        for (let dy = 0; dy < f; dy++) {
          for (let dx = 0; dx < f; dx++) {
            if (!this.field.inside(x + dx, y + dy)) return false;
            if (this.field.blocksMove(x + dx, y + dy)) return false;
            if (this.occupied(x + dx, y + dy, actor)) return false;
          }
        }
        return true;
      },
    );
  }

  /** Move seguindo o caminho, resolvendo ataques de oportunidade a cada passo. */
  moveAlong(actor, path) {
    if (path.length < 2) return false;
    const reached = this.reachableFor(actor);
    const dest = path[path.length - 1];
    const node = reached.get(key(dest.x, dest.y));
    if (!node) return false;
    const origin = { ...actor.pos };

    for (let i = 1; i < path.length; i++) {
      const from = { ...actor.pos };
      const to = path[i];
      // Quem tinha o ator no alcance e deixa de ter leva a reação.
      const threats = actor.disengaging ? [] : this.enemiesOf(actor).filter(
        (e) => !e.reactionUsed
          && distanceFt(e.pos, from) <= this.reachOf(e)
          && distanceFt(e.pos, to) > this.reachOf(e),
      );
      // `f` viaja junto: perder a pegada aqui faria o ogro virar Médio ao andar.
      actor.pos = { x: to.x, y: to.y, f: actor.pos.f ?? 1 };
      for (const threat of threats) this.opportunityAttack(threat, actor);
      if (actor.dead || hasCondition(actor, 'inconsciente')) break;
    }
    actor.movementLeftFt = Math.max(0, actor.movementLeftFt - node.cost);
    // `from` deixa a camada de desenho calcular para onde a figura está virada,
    // sem o motor precisar conhecer o conceito de "frente" (o 5e não tem).
    this.onEvent({ type: 'moved', actor, from: origin, to: { ...actor.pos }, path: path.map((p) => ({ ...p })) });
    return true;
  }

  reachOf(actor) {
    if (actor.attacks) return Math.max(...actor.attacks.filter((a) => !a.ranged).map((a) => a.reachFt ?? 5), 5);
    const w = WEAPONS[actor.equippedWeapon];
    return w && !w.ranged ? (w.reachFt ?? 5) : 5;
  }

  opportunityAttack(attacker, target) {
    attacker.reactionUsed = true;
    this.say('reacao', `${attacker.name} aproveita a brecha (ataque de oportunidade).`);
    this.resolveAttack(attacker, target, { opportunity: true });
  }

  // ---- vantagem / desvantagem ---------------------------------------------

  attackModifiers(attacker, target, { ranged = false, opportunity = false } = {}) {
    const atkFx = conditionEffects(attacker);
    const tgtFx = conditionEffects(target);
    // `mods` carrega as mesmas três chaves de antes (`advantage`,
    // `disadvantage`, `reasons`, na mesma ordem) mais as listas por lado e o
    // modo já fechado. Quem só lia as três continua lendo as três.
    const mods = modsVazios();

    if (atkFx.attackDisadvantage) fonte(mods, 'desvantagem', 'atacante prejudicado');
    // O aviso de armadura sem treino prometia um preço que ninguém cobrava: o
    // mago podia vestir cota de malha e ir de CA 12 para 16 de graça. Enquanto
    // nada desequipava, a promessa nunca era testada — o inventário novo a
    // testa, então o preço passa a existir.
    if (attacker.armorUntrained) fonte(mods, 'desvantagem', 'armadura sem treino');
    if (tgtFx.attackedAdvantage) fonte(mods, 'vantagem', 'alvo indefeso');
    if (tgtFx.attackedDisadvantage) fonte(mods, 'desvantagem', 'alvo esquivando');

    const close = distanceFt(attacker.pos, target.pos) <= 5;
    if (tgtFx.attackedAdvantageMelee && close) fonte(mods, 'vantagem', 'alvo caído e perto');
    if (tgtFx.attackedDisadvantageRanged && ranged) fonte(mods, 'desvantagem', 'alvo caído e longe');

    // Táticas de Matilha
    if (attacker.traits?.includes('packTactics')) {
      const helper = this.alliesOf(attacker).some((a) => isAdjacent(a.pos, target.pos));
      if (helper) fonte(mods, 'vantagem', 'táticas de matilha');
    }
    // Ataque à distância com inimigo colado
    if (ranged && !opportunity && this.enemiesOf(attacker).some((e) => isAdjacent(e.pos, attacker.pos))) {
      fonte(mods, 'desvantagem', 'inimigo adjacente');
    }
    return mods;
  }

  /** Ataque furtivo do ladino: precisa de vantagem, ou aliado colado sem desvantagem. */
  sneakApplies(attacker, target, weapon, mods) {
    if (!attacker.features?.includes('sneakAttack') || attacker.sneakUsedThisTurn) return false;
    const usable = weapon?.ranged || weapon?.finesse;
    if (!usable) return false;
    if (mods.advantage && !mods.disadvantage) return true;
    if (mods.disadvantage) return false;
    return this.alliesOf(attacker).some((a) => isAdjacent(a.pos, target.pos) && !hasCondition(a, 'inconsciente'));
  }

  // ---- ataques -------------------------------------------------------------

  weaponAttackProfile(actor, weaponId) {
    if (actor.attacks) {
      const atk = actor.attacks.find((a) => a.name === weaponId) ?? actor.attacks[0];
      return {
        name: atk.name, bonus: atk.bonus, damage: atk.damage, type: atk.type,
        ranged: !!atk.ranged, reachFt: atk.reachFt ?? 5,
        rangeFt: atk.rangeFt ?? 5, longRangeFt: atk.longRangeFt ?? atk.rangeFt ?? 5,
        onHit: atk.onHit ?? null, weapon: null, art: atk.art ?? null,
        // Bloco de criatura do SRD traz o bônus já somado, sem dizer quanto é
        // atributo e quanto é proficiência. Dizer "bloco da criatura" é honesto;
        // repartir em FOR e proficiência seria invenção nossa.
        bonusPartes: [{ rotulo: 'bloco da criatura', valor: atk.bonus }],
      };
    }
    const w = WEAPONS[weaponId ?? actor.equippedWeapon];
    const ability = weaponAbility(actor, w);
    const mod = abilityMod(actor.abilities[ability]);
    return {
      name: w.name,
      bonus: mod + actor.proficiency,
      damage: `${w.damage}${mod >= 0 ? '+' : ''}${mod}`,
      type: w.type,
      ranged: !!w.ranged,
      reachFt: w.reachFt ?? 5,
      rangeFt: w.ranged ? w.rangeFt : (w.reachFt ?? 5),
      longRangeFt: w.ranged ? w.longRangeFt : (w.reachFt ?? 5),
      onHit: null,
      weapon: w,
      art: w.art ?? null,
      // Arma de acuidade escolhe o melhor entre FOR e DES: nomear o atributo
      // que ENTROU é a única forma de o jogador ver a escolha acontecendo.
      bonusPartes: [
        { rotulo: ABILITY_NAME[ability], valor: mod },
        { rotulo: 'proficiência', valor: actor.proficiency },
      ],
    };
  }

  canAttack(actor, target, weaponId) {
    const p = this.weaponAttackProfile(actor, weaponId);
    const dist = distanceFt(actor.pos, target.pos);
    if (dist > p.longRangeFt) {
      const limite = p.ranged ? p.longRangeFt : p.reachFt;
      return { ok: false, why: `fora de alcance — ${dist} pés, ${p.name} alcança ${limite}` };
    }
    if (p.ranged && !this.field.hasLineOfSight(actor.pos, target.pos)) {
      return { ok: false, why: 'sem linha de visão até o alvo' };
    }
    return { ok: true, profile: p, longRange: p.ranged && dist > p.rangeFt };
  }

  resolveAttack(attacker, target, { weaponId = null, opportunity = false, disadvantage = false } = {}) {
    // O chefe pode jogar um capanga na frente antes de a rolagem acontecer.
    target = this.tryRedirect(target);
    const check = this.canAttack(attacker, target, weaponId);
    if (!check.ok) {
      this.say('aviso', `${attacker.name} não consegue atacar: ${check.why}.`);
      return null;
    }
    const p = check.profile;
    const mods = this.attackModifiers(attacker, target, { ranged: p.ranged, opportunity });
    if (check.longRange) fonte(mods, 'desvantagem', 'alcance longo');
    if (disadvantage) fonte(mods, 'desvantagem', 'segundo ataque');

    const cover = p.ranged ? this.field.coverBetween(attacker.pos, target.pos) : 0;
    const ac = target.ac + cover;
    const caPartes = [{ rotulo: `CA de ${target.name}`, valor: target.ac }];
    if (cover) caPartes.push({ rotulo: 'cobertura', valor: cover });

    const fx = conditionEffects(attacker);
    let bonus = p.bonus;
    // As partes do bônus somam sempre o `bonus` que vai para a rolagem: o dado
    // de bênção entra como parcela nomeada em vez de engordar um "+4" anônimo.
    const bonusPartes = [...(p.bonusPartes ?? [])];
    for (const dice of fx.attackBonusDice) {
      const r = roll(this.rng, dice);
      bonus += r.total;
      bonusPartes.push({ rotulo: `bênção ${dice}[${r.rolls.join('+')}]`, valor: r.total });
    }
    // O espelho: Perdição tira o que a Bênção põe.
    for (const dice of fx.attackPenaltyDice) {
      const r = roll(this.rng, dice);
      bonus -= r.total;
      bonusPartes.push({ rotulo: `perdição −${dice}[${r.rolls.join('+')}]`, valor: -r.total });
    }

    const atk = attackRoll(this.rng, bonus, ac, mods);
    const tgtFx = conditionEffects(target);
    const autoCrit = tgtFx.critWithinReach && distanceFt(attacker.pos, target.pos) <= 5;
    const critical = atk.critical || (atk.hit && autoCrit);

    // Errar por 1 ou 2 é informação tática de verdade: diz que fabricar
    // vantagem, ou somar um único ponto de bônus, teria virado o ataque. Um
    // 1 natural não entra nessa conta — ele erra por regra, não por margem.
    const faltou = atk.hit || atk.fumble ? null : Math.max(0, ac - atk.total);
    const porPouco = faltou !== null && faltou >= 1 && faltou <= 2;

    const explicacao = explicarModo(mods);
    const detail = [
      `d20[${atk.rolls.join('/')}] ${explicarBonus(bonus, bonusPartes)} = ${atk.total}`,
      `vs CA ${ac}${cover ? ` (${caPartes.map((c) => `${c.rotulo} ${c.valor}`).join(' + ')})` : ''}`,
      explicacao || null,
    ].filter(Boolean).join(' · ');

    // Tudo que a camada de desenho precisa para contar a rolagem de novo, sem
    // reler o texto do log nem recalcular regra.
    const rolagem = {
      categoria: 'ataque',
      rotulo: p.name,
      d20: { rolls: [...atk.rolls], natural: atk.natural, total: atk.total, bonus },
      bonusPartes,
      alvoNumero: { rotulo: 'CA', valor: ac, partes: caPartes },
      modo: mods.mode,
      anulado: mods.anulado,
      vantagens: [...mods.vantagens],
      desvantagens: [...mods.desvantagens],
      motivos: [...mods.reasons],
      explicacao,
      critico: critical,
      critoAutomatico: atk.hit && autoCrit && !atk.critical,
      faltou,
      errouPorPouco: porPouco,
      naturalUm: atk.fumble,
      natural20: atk.critical,
    };

    if (!atk.hit) {
      const nota = atk.fumble
        ? ' — 1 natural, erra por regra'
        : porPouco ? ` — faltou ${faltou}` : '';
      this.say('ataque', `${attacker.name} erra ${target.name} com ${p.name}${nota}.`, detail, { rolagem });
      this.onEvent({
        type: 'attack', attacker, target, hit: false,
        ranged: p.ranged, damageType: p.type, weaponName: p.name, art: p.art,
        rolagem, faltou, errouPorPouco: porPouco,
        modo: mods.mode, anulado: mods.anulado,
        vantagens: rolagem.vantagens, desvantagens: rolagem.desvantagens, motivos: rolagem.motivos,
      });
      return { hit: false, faltou, errouPorPouco: porPouco, modo: mods.mode };
    }

    let damageNotation = p.damage;
    let sneak = null;
    if (this.sneakApplies(attacker, target, p.weapon, mods)) {
      attacker.sneakUsedThisTurn = true;
      sneak = damageRoll(this.rng, attacker.sneakAttack, { critical });
    }
    let martial = null;
    if (this.martialApplies(attacker, target)) {
      attacker.martialUsedThisTurn = true;
      martial = damageRoll(this.rng, '2d6', { critical });
    }

    const dmg = damageRoll(this.rng, damageNotation, { critical });
    const total = dmg.total + (sneak?.total ?? 0) + (martial?.total ?? 0);

    // Cada origem do dano vira uma parcela própria. Um "19 de dano" não deixa
    // ver que 12 daquilo foi o ataque furtivo — e é justamente essa parcela que
    // o ladino está manobrando o turno inteiro para conseguir.
    const danoPartes = [parcelaDeDano('dano', dmg)];
    if (sneak) danoPartes.push(parcelaDeDano('ataque furtivo', sneak));
    if (martial) danoPartes.push(parcelaDeDano('vantagem marcial', martial));
    rolagem.danoPartes = danoPartes;
    rolagem.danoTotal = total;
    rolagem.tipoDeDano = p.type;

    const parts = danoPartes.map(contaDeDano);
    // Crítico por inconsciente ao alcance não vem de um 20 natural; sem dizer
    // isso o jogador procura o 20 na rolagem e não acha.
    const marcaCritico = critical
      ? (rolagem.critoAutomatico ? ' — CRÍTICO (alvo indefeso ao alcance)' : ' — CRÍTICO (20 natural)')
      : '';

    this.say(
      'ataque',
      `${attacker.name} acerta ${target.name} com ${p.name}${marcaCritico}: ${total} de dano ${p.type}.`,
      `${detail} · ${parts.join(' + ')}`,
      { rolagem },
    );
    this.onEvent({
      type: 'attack', attacker, target, hit: true, critical, damage: total,
      ranged: p.ranged, damageType: p.type, weaponName: p.name, art: p.art, sneak: !!sneak, martial: !!martial,
      rolagem, danoPartes, faltou: null, errouPorPouco: false,
      modo: mods.mode, anulado: mods.anulado,
      vantagens: rolagem.vantagens, desvantagens: rolagem.desvantagens, motivos: rolagem.motivos,
      critoAutomatico: rolagem.critoAutomatico,
    });
    this.applyDamage(target, total, p.type, attacker);

    // Efeito extra do ataque (mordida do lobo derruba).
    if (p.onHit && !target.dead && !hasCondition(target, 'inconsciente')) {
      const save = this.resistencia(target, p.onHit.save, p.onHit.dc);
      const nomeCondicao = CONDITIONS[p.onHit.condition]?.name ?? p.onHit.condition;
      const r = this.explicarResistencia(target, p.onHit.save, p.onHit.dc, save, {
        contra: `${p.name} de ${attacker.name}`,
        seSucesso: `não fica ${nomeCondicao}`,
      });
      if (!save.success) {
        addCondition(target, p.onHit.condition);
        this.say('condicao', `${target.name} ${p.onHit.note} — fica ${nomeCondicao}.`, r.conta, { rolagem: r });
      } else {
        this.say('condicao', `${target.name} se segura e escapa de ${nomeCondicao}.`, r.conta, { rolagem: r });
      }
    }
    return { hit: true, critical, damage: total, modo: mods.mode, danoPartes };
  }

  /**
   * Ação de Ataque completa (trata Ataque Múltiplo dos monstros).
   *
   * VALIDA ANTES DE GASTAR. Antes, a ação era marcada como usada e só depois
   * `resolveAttack` descobria que o alvo estava fora de alcance ou sem linha de
   * visão — o jogador perdia o turno por um clique que nunca poderia acertar.
   *
   * @returns {{ok: boolean, why?: string}}
   */
  attackAction(attacker, target, weaponId = null) {
    if (attacker.actionUsed) return { ok: false, why: 'a ação deste turno já foi usada' };

    const check = this.canAttack(attacker, target, weaponId);
    if (!check.ok) return { ok: false, why: check.why };

    attacker.actionUsed = true;
    const ma = attacker.multiattack;
    this.resolveAttack(attacker, target, { weaponId });
    if (ma && ma.count > 1 && !target.dead && !hasCondition(target, 'inconsciente')) {
      for (let i = 1; i < ma.count; i++) {
        this.resolveAttack(attacker, target, { weaponId, disadvantage: ma.secondAtDisadvantage && i === 1 });
      }
    }
    this.afterAction(attacker);
    return { ok: true };
  }

  afterAction(actor) {
    if (actor.extraActions > 0) {
      actor.extraActions -= 1;
      actor.actionUsed = false;
      this.say('recurso', `${actor.name} ainda tem uma ação (Ação Surpreendente).`);
    }
    this.checkEnd();
  }

  // ---- dano, cura e morte --------------------------------------------------

  applyDamage(target, amount, type, source = null) {
    if (amount <= 0 || target.dead) return;
    let left = amount;
    if (target.tempHp > 0) {
      const absorbed = Math.min(target.tempHp, left);
      target.tempHp -= absorbed;
      left -= absorbed;
    }
    target.hp -= left;
    this.onEvent({ type: 'damage', target, amount, source });

    if (target.concentrating) this.concentrationCheck(target, amount);

    if (target.hp > 0) return;
    target.hp = 0;

    if (target.kind === 'npc') {
      target.dead = true;
      removeCondition(target, 'esquivando');
      this.say('morte', `${target.name} cai.`);
      this.onEvent({ type: 'died', target });
    } else {
      addCondition(target, 'inconsciente');
      addCondition(target, 'caido');
      target.stable = false;
      target.deathSaves = { successes: 0, failures: 0 };
      target.acted = true;
      this.say('morte', `${target.name} cai inconsciente.`);
      this.onEvent({ type: 'downed', target });
    }
    this.checkEnd();
  }

  heal(target, amount, source = null) {
    if (target.dead || amount <= 0) return 0;
    const was = target.hp;
    const revived = hasCondition(target, 'inconsciente');
    target.hp = Math.min(target.maxHp, target.hp + amount);
    if (revived && target.hp > 0) {
      removeCondition(target, 'inconsciente');
      removeCondition(target, 'caido');
      target.stable = false;
      target.deathSaves = { successes: 0, failures: 0 };
      this.say('cura', `${target.name} volta a si com ${target.hp} PV.`);
    }
    this.onEvent({ type: 'heal', target, amount: target.hp - was, source });
    return target.hp - was;
  }

  deathSave(actor) {
    const r = d20(this.rng, 0);
    // Teste de morte é d20 PURO: nenhum atributo, nenhuma proficiência. Dizer
    // isso evita a dúvida de por que o guerreiro com +3 de CON rola sem bônus.
    const conta = `d20[${r.rolls.join('/')}] = ${r.total} vs CD 10 · sem bônus (d20 puro) · 3 sucessos estabiliza, 3 falhas mata`;
    const rolagem = {
      categoria: 'morte',
      actor,
      contra: 'morrer em 0 PV',
      cd: 10,
      bonus: 0,
      bonusPartes: [],
      d20Rolls: [...r.rolls],
      total: r.total,
      modo: 'normal',
      sucesso: r.total >= 10,
      seSucesso: 'um sucesso a mais na contagem',
      conta,
    };
    this.onEvent({ type: 'rolagem', ...rolagem });

    if (r.natural === 20) {
      this.say('morte', `${actor.name}: 20 natural no teste de morte — levanta com 1 PV!`, conta, { rolagem });
      this.heal(actor, 1);
      return;
    }
    if (r.natural === 1) {
      actor.deathSaves.failures += 2;
      this.say('morte', `${actor.name}: 1 natural — duas falhas (${actor.deathSaves.failures}/3).`, conta, { rolagem });
    } else if (r.total >= 10) {
      actor.deathSaves.successes += 1;
      this.say('morte', `${actor.name}: sucesso no teste de morte (${actor.deathSaves.successes}/3).`, conta, { rolagem });
    } else {
      actor.deathSaves.failures += 1;
      this.say('morte', `${actor.name}: falha no teste de morte (${actor.deathSaves.failures}/3).`, conta, { rolagem });
    }
    if (actor.deathSaves.successes >= 3) {
      actor.stable = true;
      this.say('morte', `${actor.name} se estabiliza.`);
    } else if (actor.deathSaves.failures >= 3) {
      actor.dead = true;
      this.say('morte', `${actor.name} morre.`);
      this.onEvent({ type: 'died', target: actor });
      this.checkEnd();
    }
  }

  concentrationCheck(actor, damage) {
    const dc = Math.max(10, Math.floor(damage / 2));
    const save = this.resistencia(actor, 'con', dc);
    const magia = actor.concentrating ? getSpell(actor.concentrating.spellId)?.name : null;
    // A CD é metade do dano (mínimo 10): sem dizer isso, o jogador não entende
    // por que um golpe forte derruba a concentração e um fraco não.
    const r = this.explicarResistencia(actor, 'con', dc, save, {
      contra: `manter ${magia ?? 'a concentração'} sob ${damage} de dano (CD = metade do dano, mínimo 10)`,
      seSucesso: `${magia ?? 'a magia'} continua de pé`,
    });
    if (save.success) {
      this.say('concentracao', `${actor.name} mantém a concentração.`, r.conta, { rolagem: r });
      return;
    }
    this.say('concentracao', `${actor.name} perde a concentração.`, r.conta, { rolagem: r });
    this.dropConcentration(actor);
  }

  dropConcentration(actor) {
    const conc = actor.concentrating;
    if (!conc) return;
    for (const t of conc.targets) removeCondition(t, conc.condition);
    actor.concentrating = null;
  }

  // ---- magias --------------------------------------------------------------

  /**
   * Checa TUDO antes de a magia sair: espaço, ação, alvo, alcance e visão.
   * Nenhum recurso é gasto aqui — é só a pergunta "dá para conjurar?".
   */
  canCast(actor, spellId, { target = null, point = null } = {}) {
    const spell = getSpell(spellId);
    if (!actor.spellcasting) return { ok: false, why: 'não conjura magias' };
    if (actor.armorUntrained) return { ok: false, why: 'armadura sem treino impede conjurar' };
    if (spell.level > 0 && !actor.spellcasting.slots[spell.level]) {
      return { ok: false, why: `sem espaço de magia de ${spell.level}º círculo` };
    }
    if (spell.castTime === 'action' && actor.actionUsed) return { ok: false, why: 'a ação deste turno já foi usada' };
    if (spell.castTime === 'bonus' && actor.bonusUsed) return { ok: false, why: 'a ação bônus deste turno já foi usada' };

    const precisaAlvo = spell.kind === 'attack' || spell.kind === 'auto' || spell.kind === 'heal';
    if (precisaAlvo && !target) return { ok: false, why: 'escolha um alvo' };

    const dest = target?.pos ?? point;
    // Cone sai do próprio conjurador (alcance 0): não há distância a checar.
    if (dest && spell.rangeFt > 0) {
      const d = distanceFt(actor.pos, dest);
      if (d > spell.rangeFt) {
        return { ok: false, why: `fora de alcance — ${d} pés, a magia chega a ${spell.rangeFt}` };
      }
      if (!this.field.hasLineOfSight(actor.pos, dest)) {
        return { ok: false, why: 'sem linha de visão até o alvo' };
      }
    }
    return { ok: true, spell };
  }

  castSpell(actor, spellId, { target = null, point = null } = {}) {
    const check = this.canCast(actor, spellId, { target, point });
    if (!check.ok) return { ok: false, why: check.why };
    const spell = check.spell;
    if (spell.castTime === 'action') actor.actionUsed = true;
    if (spell.castTime === 'bonus') actor.bonusUsed = true;
    if (spell.level > 0) actor.spellcasting.slots[spell.level] -= 1;

    const dc = spellSaveDc(actor);
    const atkBonus = spellAttackBonus(actor);
    const mod = spellMod(actor);
    this.say('magia', `${actor.name} conjura ${spell.name}.`);

    // Área afetada, para a camada de desenho marcar os quadrados.
    const areaTiles = spell.shape === 'cone'
      ? this.field.cone(actor.pos, {
        x: Math.sign((point?.x ?? actor.pos.x) - actor.pos.x),
        y: Math.sign((point?.y ?? actor.pos.y) - actor.pos.y),
      }, spell.areaFt)
      : spell.shape === 'sphere' && (point ?? target?.pos)
        ? this.field.within(point ?? target.pos, spell.areaFt)
        : null;

    // Alvos de magia de bônus são escolhidos aqui, antes do evento, para a
    // camada de desenho poder marcar cada um sem recalcular a regra.
    // `debuff` escolhe do outro lado, e por isso não inclui o conjurador nem
    // dispensa quem está inconsciente — um inimigo caído ainda pode levar
    // Perdição e acordar com ela.
    const buffTargets = spell.kind === 'buff'
      ? this.alliesOf(actor)
        .concat([actor])
        .filter((a) => distanceFt(actor.pos, a.pos) <= spell.rangeFt && !hasCondition(a, 'inconsciente'))
        .slice(0, spell.targets)
      : spell.kind === 'debuff'
        ? this.enemiesOf(actor)
          .filter((e) => !e.dead && distanceFt(actor.pos, e.pos) <= spell.rangeFt)
          .slice(0, spell.targets)
        : null;

    this.onEvent({ type: 'spell', caster: actor, spell, target, point, areaTiles, buffTargets });

    switch (spell.kind) {
      case 'attack': {
        if (!target) break;
        const mods = this.attackModifiers(actor, target, { ranged: true });
        const cover = this.field.coverBetween(actor.pos, target.pos);
        const ca = target.ac + cover;
        const caPartes = [{ rotulo: `CA de ${target.name}`, valor: target.ac }];
        if (cover) caPartes.push({ rotulo: 'cobertura', valor: cover });
        // Ataque de magia é proficiência + o atributo de conjuração — nunca
        // Força. Nomear o atributo é o que torna visível por que o mago acerta
        // melhor que o clérigo com a mesma magia.
        const atkPartes = [
          { rotulo: ABILITY_NAME[actor.spellcasting.ability], valor: abilityMod(actor.abilities[actor.spellcasting.ability]) },
          { rotulo: 'proficiência', valor: proficiencyBonus(actor.level) },
        ];
        const atk = attackRoll(this.rng, atkBonus, ca, mods);
        const explicacao = explicarModo(mods);
        const faltou = atk.hit || atk.fumble ? null : Math.max(0, ca - atk.total);
        const porPouco = faltou !== null && faltou >= 1 && faltou <= 2;
        const contaAtaque = [
          `d20[${atk.rolls.join('/')}] ${explicarBonus(atkBonus, atkPartes)} = ${atk.total}`,
          `vs CA ${ca}${cover ? ` (${caPartes.map((c) => `${c.rotulo} ${c.valor}`).join(' + ')})` : ''}`,
          explicacao || null,
        ].filter(Boolean).join(' · ');
        const rolagem = {
          categoria: 'ataqueDeMagia',
          rotulo: spell.name,
          actor, target,
          d20: { rolls: [...atk.rolls], natural: atk.natural, total: atk.total, bonus: atkBonus },
          bonusPartes: atkPartes,
          alvoNumero: { rotulo: 'CA', valor: ca, partes: caPartes },
          modo: mods.mode, anulado: mods.anulado,
          vantagens: [...mods.vantagens], desvantagens: [...mods.desvantagens], motivos: [...mods.reasons],
          explicacao, critico: atk.critical, faltou, errouPorPouco: porPouco,
          naturalUm: atk.fumble, natural20: atk.critical,
          conta: contaAtaque,
        };
        this.onEvent({ type: 'rolagem', ...rolagem });
        if (!atk.hit) {
          const nota = atk.fumble
            ? ' — 1 natural, erra por regra'
            : porPouco ? ` — faltou ${faltou}` : '';
          this.say('magia', `${spell.name} erra ${target.name}${nota}.`, contaAtaque, { rolagem });
          break;
        }
        const dmg = damageRoll(this.rng, spell.damage, { critical: atk.critical });
        const danoPartes = [parcelaDeDano('dano', dmg)];
        rolagem.danoPartes = danoPartes;
        rolagem.danoTotal = dmg.total;
        this.say(
          'magia',
          `${spell.name} acerta ${target.name}${atk.critical ? ' — CRÍTICO (20 natural)' : ''}: ${dmg.total} de ${spell.damageType}.`,
          `${contaAtaque} · ${contaDeDano(danoPartes[0])}`,
          { rolagem },
        );
        this.applyDamage(target, dmg.total, spell.damageType, actor);
        this.maybeIgnite(target, spell.damageType);
        if (spell.applies && !target.dead) addCondition(target, spell.applies.condition, { rounds: spell.applies.rounds });
        break;
      }

      case 'save': {
        const targets = areaTiles
          ? areaTiles.map((s) => this.at(s.x, s.y)).filter(Boolean)
          : target ? [target] : [];

        // Esculpir Magias: o evocador protege 1 + nível da magia de aliados.
        let protectedCount = actor.features?.includes('sculptSpells') ? 1 + spell.level : 0;
        for (const t of targets) {
          if (t.side === actor.side && protectedCount > 0) {
            protectedCount -= 1;
            this.say('magia', `${t.name} é poupado (Esculpir Magias).`);
            continue;
          }
          const fx = conditionEffects(t);
          const auto = fx.autoFailSaves.includes(spell.save);
          const save = auto
            ? { total: 0, success: false, rolls: [0] }
            : this.resistencia(t, spell.save, dc);
          const dmg = damageRoll(this.rng, spell.damage);
          const amount = save.success ? (spell.halfOnSave ? Math.floor(dmg.total / 2) : 0) : dmg.total;
          // O que o sucesso compra é a decisão inteira: metade do dano ainda
          // vale conjurar numa multidão, nenhum dano não vale contra um alvo só.
          // Qual condição travou o teste: "falha automática" sem culpado deixa
          // o jogador sem saber que foi ELE quem criou essa abertura.
          const culpada = auto
            ? (t.conditions ?? []).find((c) => CONDITIONS[c.id]?.autoFailSaves?.includes(spell.save))
            : null;
          const r = this.explicarResistencia(t, spell.save, dc, save, {
            contra: `${spell.name} (CD ${dc} = 8 + proficiência + atributo de conjuração)`,
            seSucesso: spell.halfOnSave ? 'metade do dano' : 'nenhum dano',
            automatica: auto,
            motivoAutomatico: culpada ? (CONDITIONS[culpada.id]?.name ?? culpada.id) : null,
          });
          const danoPartes = [parcelaDeDano('dano', dmg)];
          r.danoPartes = danoPartes;
          r.danoAplicado = amount;
          this.say(
            'magia',
            `${t.name} ${auto ? 'falha automaticamente' : save.success ? 'resiste' : 'falha'} contra ${spell.name} e sofre ${amount}.`,
            `${r.conta} · ${contaDeDano(danoPartes[0])}${save.success && spell.halfOnSave ? ` → metade = ${amount}` : ''}`,
            { rolagem: r },
          );
          if (amount > 0) {
            this.applyDamage(t, amount, spell.damageType, actor);
            this.maybeIgnite(t, spell.damageType);
          }
        }
        break;
      }

      case 'auto': {
        if (!target) break;
        let total = 0;
        const rolls = [];
        for (let i = 0; i < spell.darts; i++) {
          const d = damageRoll(this.rng, spell.damage);
          total += d.total;
          rolls.push(d.total);
        }
        // "Automática" é a razão de ser desta magia: não há rolagem de ataque
        // nem resistência, então nem CA alta nem vantagem mudam nada. Sem dizer
        // isso, o jogador não sabe que tem aqui a resposta para o alvo blindado.
        const conta = `${spell.darts}× ${spell.damage} [${rolls.join(' + ')}] = ${total} · automática: não há rolagem de ataque nem de resistência`;
        this.say('magia', `${spell.darts} dardos atingem ${target.name}: ${total} de ${spell.damageType}.`, conta, {
          rolagem: {
            categoria: 'automatica', rotulo: spell.name, actor, target,
            danoTotal: total, parcelas: rolls, tipoDeDano: spell.damageType, conta,
          },
        });
        this.applyDamage(target, total, spell.damageType, actor);
        break;
      }

      case 'heal': {
        if (!target) break;
        const r = roll(this.rng, spell.heal);
        let amount = r.total + (spell.addSpellMod ? mod : 0);
        // Discípulo da Vida: +2 + nível da magia em cada cura de 1º círculo ou maior.
        if (actor.features?.includes('discipleOfLife') && spell.level > 0) amount += 2 + spell.level;
        const healed = this.heal(target, amount, actor);
        this.say('cura', `${target.name} recupera ${healed} PV.`, `${spell.heal}[${r.rolls.join('+')}]${spell.addSpellMod ? ` + ${mod}` : ''}`);
        break;
      }

      case 'buff': {
        const picks = buffTargets ?? [];
        if (spell.concentration) {
          this.dropConcentration(actor);
          actor.concentrating = { spellId: spell.id, condition: spell.condition, targets: picks };
        }
        for (const a of picks) addCondition(a, spell.condition, { source: actor.id });
        this.say('magia', `${spell.name} em ${picks.map((p) => p.name).join(', ')}.`);
        break;
      }

      // O espelho do `buff`: mesma estrutura, mas o alvo RESISTE e os alvos
      // são inimigos. Escrito ao lado dele de propósito — ler os dois juntos
      // é o que impede um ganhar um comportamento que o outro não tem.
      case 'debuff': {
        const picks = (buffTargets ?? []).filter((t) => t && !t.dead);
        if (!picks.length) { this.say('aviso', `${spell.name} não pegou ninguém.`); break; }
        if (spell.concentration) {
          this.dropConcentration(actor);
          actor.concentrating = { spellId: spell.id, condition: spell.condition, targets: [] };
        }
        const pegos = [];
        for (const t of picks) {
          const save = this.resistencia(t, spell.save, dc);
          const r = this.explicarResistencia(t, spell.save, dc, save, {
            contra: `${spell.name} de ${actor.name}`,
            seSucesso: `resiste a ${spell.name}`,
          });
          if (save.success) {
            this.say('magia', `${t.name} resiste a ${spell.name}.`, r.conta, { rolagem: r });
            continue;
          }
          addCondition(t, spell.condition, { source: actor.id });
          pegos.push(t);
          this.say('condicao', `${t.name} fica sob ${spell.name}.`, r.conta, { rolagem: r });
        }
        // A concentração segura só quem FALHOU: manter na lista quem resistiu
        // faria a magia "soltar" de alguém que nunca esteve preso.
        if (spell.concentration && actor.concentrating) actor.concentrating.targets = pegos;
        if (!pegos.length) this.dropConcentration(actor);
        break;
      }

      case 'sleep': {
        const center = point ?? target?.pos;
        if (!center) break;
        const pool = roll(this.rng, spell.pool);
        let left = pool.total;
        const inArea = this.field.within(center, spell.areaFt)
          .map((s) => this.at(s.x, s.y))
          .filter((c) => c && !c.dead && !hasCondition(c, 'inconsciente'))
          .sort((a, b) => a.hp - b.hp);
        this.say('magia', `Sono acumula ${pool.total} PV.`, `5d8[${pool.rolls.join('+')}]`);
        for (const c of inArea) {
          if (c.hp > left) break;
          left -= c.hp;
          addCondition(c, 'inconsciente', { rounds: 10 });
          addCondition(c, 'caido');
          c.acted = true;
          this.say('condicao', `${c.name} adormece.`);
        }
        break;
      }
    }

    this.afterAction(actor);
    this.checkEnd();
    return { ok: true };
  }

  // ---- resistência ---------------------------------------------------------

  /**
   * Teste de resistência COM os dados de condição.
   *
   * `saveBonusDice` existia em `conditions.js` desde sempre, era coletado por
   * `conditionEffects` e não era lido por ninguém. A Bênção diz, no próprio
   * texto, "some 1d4 às jogadas de ataque E aos testes de resistência", e
   * entregava só a primeira metade — o tipo de defeito que nunca aparece num
   * teste, porque o número sai plausível de qualquer jeito.
   *
   * Esta é a ÚNICA porta: `savingThrow` não deve ser chamada direto de lugar
   * nenhum deste arquivo, ou a próxima condição com dado de resistência vai
   * valer em três sítios e faltar num quarto.
   */
  resistencia(actor, hab, dc) {
    const fx = conditionEffects(actor);
    let bonus = saveBonus(actor, hab);
    const partes = [];
    for (const dice of fx.saveBonusDice) {
      const r = roll(this.rng, dice);
      bonus += r.total;
      partes.push({ rotulo: `bênção ${dice}[${r.rolls.join('+')}]`, valor: r.total });
    }
    for (const dice of fx.savePenaltyDice) {
      const r = roll(this.rng, dice);
      bonus -= r.total;
      partes.push({ rotulo: `perdição −${dice}[${r.rolls.join('+')}]`, valor: -r.total });
    }
    return { ...savingThrow(this.rng, bonus, dc), partes };
  }

  // ---- itens de usar -------------------------------------------------------

  /**
   * Usar um item da mochila.
   *
   * POR QUE ISTO EXISTE
   * A poção de cura dizia, na própria descrição, "uma ação para beber:
   * recupera 2d4+2 pontos de vida". Era mentira. Nada no motor a consumia:
   * ela nascia na mochila de todo personagem, ocupava peso, e clicar nela
   * respondia "é item de mochila". O kit de cura prometia dez usos e não
   * tinha nenhum. Um texto na tela que promete um efeito que o motor não
   * cobra é pior que uma funcionalidade faltando, porque o jogador conta com
   * ele.
   *
   * A ORDEM DAS GUARDAS IMPORTA. O item só sai da mochila DEPOIS que todas
   * as recusas passaram. Consumir antes de validar gasta a poção e não cura —
   * e é o tipo de defeito que só aparece no turno em que ela fazia falta.
   *
   * @returns {{ok: boolean, why?: string}}
   */
  useItem(actor, itemId, { target = actor } = {}) {
    const dados = itemDeId(itemId)?.dados;
    if (!dados?.consumivel) return { ok: false, why: `${nomeDeId(itemId)} não é item de usar` };

    const porBonus = dados.acao === 'bonus';
    if (porBonus ? actor.bonusUsed : actor.actionUsed) {
      return { ok: false, why: porBonus ? 'a ação bônus deste turno já foi usada' : 'a ação deste turno já foi usada' };
    }
    if (!quantosNaMochila(actor, itemId)) return { ok: false, why: `${dados.name} não está na mochila` };

    const veto = this.vetoDeItem(actor, dados, target);
    if (veto) return { ok: false, why: veto };

    // Daqui para baixo nada mais recusa: pode cobrar.
    const gasto = consumirDaMochila(actor, itemId);
    if (!gasto) return { ok: false, why: `${dados.name} não está na mochila` };
    if (porBonus) actor.bonusUsed = true; else actor.actionUsed = true;

    this.executarItem(actor, dados, target);

    if (gasto.acabou) this.say('recurso', `${actor.name} usou o último ${dados.name.toLowerCase()}.`);
    else if (dados.usos) this.say('recurso', `${dados.name}: restam ${gasto.restam} usos.`);

    this.onEvent({ type: 'item', actor, item: dados, target });
    this.afterAction(actor);
    this.checkEnd();
    return { ok: true };
  }

  /** O que impede ESTE item neste alvo. `null` = pode. */
  vetoDeItem(actor, dados, target) {
    if (dados.consumivel === 'curar' || dados.consumivel === 'estabilizar') {
      if (target !== actor && !isAdjacent(actor.pos, target.pos)) {
        return `${target.name} está longe demais — é preciso estar encostado`;
      }
    }
    if (dados.consumivel === 'curar') {
      if (target.dead) return `${target.name} já morreu`;
      // Beber de vida cheia é LEGAL na regra e é sempre um erro de clique.
      // Recusar custa ao jogador um aviso; deixar passar custa a poção que
      // faria falta dois turnos depois.
      if (target.hp >= target.maxHp) return `${target.name} está com a vida cheia`;
    }
    if (dados.consumivel === 'estabilizar') {
      if (!hasCondition(target, 'inconsciente')) return `${target.name} não está caindo`;
      if (target.stable) return `${target.name} já está estável`;
      if (target.dead) return `${target.name} já morreu`;
    }
    if (dados.consumivel === 'arremesso') {
      if (target === actor) return 'não dá para arremessar em si mesmo';
      const dist = distanceFt(actor.pos, target.pos);
      if (dist > (dados.rangeFt ?? 20)) return `fora de alcance — ${dist} pés, alcança ${dados.rangeFt ?? 20}`;
      if (!this.field.hasLineOfSight(actor.pos, target.pos)) return 'sem linha de visão';
    }
    return null;
  }

  executarItem(actor, dados, target) {
    switch (dados.consumivel) {
      case 'curar': {
        const r = roll(this.rng, dados.cura);
        const curado = this.heal(target, r.total, dados.name);
        const quem = target === actor ? 'bebe' : `dá ${dados.name.toLowerCase()} a ${target.name}:`;
        this.say('cura', `${actor.name} ${quem} ${curado} PV.`, `${dados.cura} = ${r.total}`);
        break;
      }
      case 'estabilizar': {
        // Sem teste de Medicina: é essa a vantagem do kit sobre as mãos.
        target.stable = true;
        this.say('cura', `${actor.name} estabiliza ${target.name} com o kit de cura.`, 'sem teste: o kit dispensa Medicina');
        this.onEvent({ type: 'stabilized', target, by: actor });
        break;
      }
      case 'arremesso': {
        // Ataque à distância improvisado: sem proficiência, só Destreza.
        const bonus = abilityMod(actor.abilities.dex);
        const cobertura = this.field.coverBetween(actor.pos, target.pos);
        const mods = this.attackModifiers(actor, target, { ranged: true });
        const r = attackRoll(this.rng, bonus, target.ac + cobertura, mods);
        if (!r.hit) {
          this.say('ataque', `${actor.name} arremessa ${dados.name.toLowerCase()} e erra ${target.name}.`,
            `d20[${r.rolls.join('/')}]${formatModifier(bonus)} = ${r.total} vs CA ${target.ac + cobertura}`);
          break;
        }
        const imune = dados.alvoApenas && !dados.alvoApenas.includes(target.kindTag ?? target.tipo);
        if (imune) {
          this.say('aviso', `${dados.name} acerta ${target.name} e não faz nada: só afeta ${dados.alvoApenas.join(' e ')}.`);
          break;
        }
        const dmg = damageRoll(this.rng, dados.damage, { critical: r.critical });
        this.applyDamage(target, dmg.total, dados.damageType, actor);
        this.say('ataque', `${actor.name} acerta ${target.name} com ${dados.name.toLowerCase()}: ${dmg.total} de ${dados.damageType}.`,
          `d20[${r.rolls.join('/')}]${formatModifier(bonus)} = ${r.total} vs CA ${target.ac + cobertura}`);
        break;
      }
      default:
        // `beneficio` e `untar` estão no catálogo e ainda não têm efeito. Dizer
        // isso é melhor que gastar a ação em silêncio e o jogador achar que
        // funcionou.
        this.say('aviso', `${dados.name} ainda não tem efeito implementado.`);
    }
  }

  // ---- outras ações --------------------------------------------------------

  dash(actor) {
    if (actor.actionUsed) return false;
    actor.actionUsed = true;
    actor.movementLeftFt += this.speedOf(actor);
    this.say('acao', `${actor.name} corre (Disparada).`);
    this.afterAction(actor);
    return true;
  }

  /**
   * Primeiros socorros (SRD): ação para estabilizar quem está em 0 PV, com um
   * teste de Sabedoria (Medicina) CD 10. Não cura — impede de morrer.
   *
   * É a válvula de segurança do 5e e estava faltando: sem ela, quem cai sem
   * haver espaço de magia sobrando morre, e o grupo não tem o que fazer.
   */
  stabilize(actor, target) {
    if (actor.actionUsed || !isAdjacent(actor.pos, target.pos)) return false;
    if (!hasCondition(target, 'inconsciente') || target.stable || target.dead) return false;
    actor.actionUsed = true;

    const check = d20(this.rng, skillBonus(actor, 'medicina'));
    if (check.total >= 10) {
      target.stable = true;
      this.say('cura', `${actor.name} estabiliza ${target.name}.`, `Medicina ${check.total} vs CD 10`);
      this.onEvent({ type: 'stabilized', target, by: actor });
    } else {
      this.say('aviso', `${actor.name} não consegue estancar o sangramento de ${target.name}.`, `Medicina ${check.total} vs CD 10`);
    }
    this.afterAction(actor);
    return true;
  }

  dodge(actor) {
    if (actor.actionUsed) return false;
    actor.actionUsed = true;
    addCondition(actor, 'esquivando');
    this.say('acao', `${actor.name} se concentra em desviar.`);
    this.endTurn(actor);
    return true;
  }

  disengage(actor, { bonus = false } = {}) {
    if (bonus ? actor.bonusUsed : actor.actionUsed) return false;
    if (bonus) actor.bonusUsed = true; else actor.actionUsed = true;
    actor.disengaging = true;
    this.say('acao', `${actor.name} desengaja — ninguém leva ataque de oportunidade dele.`);
    return true;
  }

  useFeature(actor, featureId, { target = null } = {}) {
    switch (featureId) {
      case 'secondWind': {
        if (actor.bonusUsed || !actor.resources.secondWind) return false;
        actor.bonusUsed = true;
        actor.resources.secondWind -= 1;
        const r = roll(this.rng, `1d10+${actor.level}`);
        const healed = this.heal(actor, r.total, actor);
        this.say('recurso', `${actor.name} usa Retomar o Fôlego: +${healed} PV.`, `1d10[${r.rolls.join('')}] + ${actor.level}`);
        return true;
      }
      case 'actionSurge': {
        if (!actor.resources.actionSurge) return false;
        actor.resources.actionSurge -= 1;
        actor.extraActions += 1;
        actor.actionUsed = false;
        this.say('recurso', `${actor.name} usa Ação Surpreendente — ganha uma ação.`);
        return true;
      }
      case 'cunningAction': {
        // Ação Ardilosa: Disparada ou Desengajar como ação bônus.
        if (actor.bonusUsed) return false;
        actor.bonusUsed = true;
        actor.movementLeftFt += this.speedOf(actor);
        actor.disengaging = true;
        this.say('recurso', `${actor.name} usa Ação Ardilosa: corre e desengaja.`);
        return true;
      }
      case 'preserveLife': {
        if (actor.actionUsed || !actor.resources.channelDivinity) return false;
        actor.actionUsed = true;
        actor.resources.channelDivinity -= 1;
        let pool = actor.level * 5;
        const wounded = [actor, ...this.alliesOf(actor)]
          .filter((a) => !a.dead && a.hp < a.maxHp && distanceFt(actor.pos, a.pos) <= 30)
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
        this.say('recurso', `${actor.name} canaliza Preservar a Vida (${pool} PV para dividir).`);
        for (const a of wounded) {
          if (pool <= 0) break;
          const cap = Math.floor(a.maxHp / 2); // não pode passar da metade dos PV máximos
          const want = Math.min(pool, Math.max(0, cap - a.hp), a.maxHp - a.hp);
          if (want <= 0) continue;
          pool -= want;
          this.heal(a, want, actor);
        }
        this.afterAction(actor);
        return true;
      }
      default:
        return false;
    }
  }

  // ---- log -----------------------------------------------------------------

  /**
   * Abre a conta de um teste de resistência já rolado.
   *
   * Não rola nem decide nada: recebe o `save` pronto. Existe porque os quatro
   * lugares que fazem resistência (efeito de ataque, concentração, magia de
   * área e teste de morte) contavam a mesma coisa de quatro jeitos diferentes,
   * e nenhum deles dizia contra o quê o teste era nem o que o sucesso compra.
   *
   * O bônus vem de `saveBonus`, a mesma função que a rolagem usou, e a
   * proficiência sai por subtração — assim as parcelas somam o total por
   * construção, sem duplicar a regra aqui.
   */
  explicarResistencia(actor, atributo, cd, save, { contra, seSucesso, automatica = false, motivoAutomatico = null } = {}) {
    const bonus = saveBonus(actor, atributo);
    const base = abilityMod(actor.abilities[atributo]);
    const bonusPartes = [{ rotulo: ABILITY_NAME[atributo], valor: base }];
    if (bonus !== base) bonusPartes.push({ rotulo: 'proficiência', valor: bonus - base });

    const r = {
      categoria: 'resistencia',
      actor,
      atributo,
      atributoNome: `resistência de ${ABILITY_NAME[atributo]}`,
      contra,
      cd,
      bonus,
      bonusPartes,
      d20Rolls: automatica ? [] : [...(save.rolls ?? [])],
      total: save.total,
      modo: save.mode ?? 'normal',
      sucesso: !!save.success,
      automatica,
      motivoAutomatico,
      seSucesso,
    };
    r.conta = contaDeResistencia(r);
    this.onEvent({ type: 'rolagem', ...r });
    return r;
  }

  /**
   * `extra` entra no registro como campos a mais (a rolagem aberta, por
   * exemplo). O HUD lê `kind`, `text` e `detail` e ignora o resto — é o que
   * permite enriquecer o log sem tocar em arquivo de outro dono.
   */
  say(kind, text, detail = null, extra = null) {
    const entry = { kind, text, detail, round: this.round, ...extra };
    this.log.push(entry);
    this.onLog(entry);
  }
}
