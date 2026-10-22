// SRD 5.2 (CC-BY-4.0) — ver NOTICE.md
//
// Motor de combate. Iniciativa POR LADO: rola-se uma vez para o grupo e uma
// para os inimigos; o lado vencedor age inteiro (na ordem que o jogador quiser)
// e depois passa a vez. É mais rápido que iniciativa individual e corta a fila
// de espera, que é o que mata jogo tático com 4 humanos.
//
// O motor é autoritativo e puro: ele não sabe desenhar. A camada de view só lê
// estado e chama métodos. É isso que vai permitir movê-lo para o servidor sem
// reescrever nada.

import { attackRoll, damageRoll, savingThrow, d20, roll, formatModifier } from '../core/dice.js';
import { Battlefield, distanceFt, isAdjacent, key } from '../core/grid.js';
import { abilityMod, saveBonus, spellSaveDc, spellAttackBonus } from './abilities.js';
import { WEAPONS, weaponAbility } from './equipment.js';
import { addCondition, removeCondition, hasCondition, conditionEffects, CONDITIONS } from './conditions.js';
import { getSpell } from './spells.js';
import { spellMod } from './party.js';

export class Encounter {
  constructor({ battlefield, party, foes, rng, onLog = () => {}, onEvent = () => {} }) {
    this.field = battlefield;
    this.rng = rng;
    this.onLog = onLog;
    this.onEvent = onEvent;

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

  at(x, y) {
    return this.combatants.find((c) => !c.dead && c.pos.x === x && c.pos.y === y);
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
    this.side = side;
    for (const c of this.allOf(side)) {
      c.movementLeftFt = this.speedOf(c);
      c.actionUsed = false;
      c.bonusUsed = false;
      c.reactionUsed = false;
      c.acted = false;
      c.sneakUsedThisTurn = false;
      c.extraActions = 0;
      this.tickConditions(c);
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
    return this.field.reachable(
      actor.pos,
      actor.movementLeftFt,
      (x, y) => this.occupied(x, y, actor),
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
      actor.pos = { x: to.x, y: to.y };
      for (const threat of threats) this.opportunityAttack(threat, actor);
      if (actor.dead || hasCondition(actor, 'inconsciente')) break;
    }
    actor.movementLeftFt = Math.max(0, actor.movementLeftFt - node.cost);
    // `from` deixa a camada de desenho calcular para onde a figura está virada,
    // sem o motor precisar conhecer o conceito de "frente" (o 5e não tem).
    this.onEvent({ type: 'moved', actor, from: origin, to: { ...actor.pos } });
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
    const reasons = [];
    let advantage = false;
    let disadvantage = false;

    if (atkFx.attackDisadvantage) { disadvantage = true; reasons.push('atacante prejudicado'); }
    if (tgtFx.attackedAdvantage) { advantage = true; reasons.push('alvo indefeso'); }
    if (tgtFx.attackedDisadvantage) { disadvantage = true; reasons.push('alvo esquivando'); }

    const close = distanceFt(attacker.pos, target.pos) <= 5;
    if (tgtFx.attackedAdvantageMelee && close) { advantage = true; reasons.push('alvo caído e perto'); }
    if (tgtFx.attackedDisadvantageRanged && ranged) { disadvantage = true; reasons.push('alvo caído e longe'); }

    // Táticas de Matilha
    if (attacker.traits?.includes('packTactics')) {
      const helper = this.alliesOf(attacker).some((a) => isAdjacent(a.pos, target.pos));
      if (helper) { advantage = true; reasons.push('táticas de matilha'); }
    }
    // Ataque à distância com inimigo colado
    if (ranged && !opportunity && this.enemiesOf(attacker).some((e) => isAdjacent(e.pos, attacker.pos))) {
      disadvantage = true;
      reasons.push('inimigo adjacente');
    }
    return { advantage, disadvantage, reasons };
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
        onHit: atk.onHit ?? null, weapon: null,
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
    };
  }

  canAttack(actor, target, weaponId) {
    const p = this.weaponAttackProfile(actor, weaponId);
    const dist = distanceFt(actor.pos, target.pos);
    if (dist > p.longRangeFt) return { ok: false, why: 'fora de alcance' };
    if (p.ranged && !this.field.hasLineOfSight(actor.pos, target.pos)) return { ok: false, why: 'sem linha de visão' };
    return { ok: true, profile: p, longRange: p.ranged && dist > p.rangeFt };
  }

  resolveAttack(attacker, target, { weaponId = null, opportunity = false, disadvantage = false } = {}) {
    const check = this.canAttack(attacker, target, weaponId);
    if (!check.ok) {
      this.say('aviso', `${attacker.name} não consegue atacar: ${check.why}.`);
      return null;
    }
    const p = check.profile;
    const mods = this.attackModifiers(attacker, target, { ranged: p.ranged, opportunity });
    if (check.longRange) { mods.disadvantage = true; mods.reasons.push('alcance longo'); }
    if (disadvantage) { mods.disadvantage = true; mods.reasons.push('segundo ataque'); }

    const cover = p.ranged ? this.field.coverBetween(attacker.pos, target.pos) : 0;
    const ac = target.ac + cover;

    const fx = conditionEffects(attacker);
    let bonus = p.bonus;
    const extraDice = [];
    for (const dice of fx.attackBonusDice) {
      const r = roll(this.rng, dice);
      bonus += r.total;
      extraDice.push(`${dice}=${r.total}`);
    }

    const atk = attackRoll(this.rng, bonus, ac, mods);
    const tgtFx = conditionEffects(target);
    const autoCrit = tgtFx.critWithinReach && distanceFt(attacker.pos, target.pos) <= 5;
    const critical = atk.critical || (atk.hit && autoCrit);

    const detail = [
      `d20[${atk.rolls.join('/')}]${formatModifier(bonus)} = ${atk.total}`,
      `vs CA ${ac}${cover ? ` (cobertura +${cover})` : ''}`,
      mods.mode !== 'normal' ? mods.mode : null,
      mods.reasons.length ? `(${mods.reasons.join(', ')})` : null,
      extraDice.length ? `bênção ${extraDice.join(',')}` : null,
    ].filter(Boolean).join(' · ');

    if (!atk.hit) {
      this.say('ataque', `${attacker.name} erra ${target.name} com ${p.name}.`, detail);
      this.onEvent({ type: 'attack', attacker, target, hit: false });
      return { hit: false };
    }

    let damageNotation = p.damage;
    let sneak = null;
    if (this.sneakApplies(attacker, target, p.weapon, mods)) {
      attacker.sneakUsedThisTurn = true;
      sneak = damageRoll(this.rng, attacker.sneakAttack, { critical });
    }

    const dmg = damageRoll(this.rng, damageNotation, { critical });
    const total = dmg.total + (sneak?.total ?? 0);

    const parts = [`${dmg.notation}[${dmg.rolls.join('+')}] = ${dmg.total}`];
    if (sneak) parts.push(`furtivo ${attacker.sneakAttack}[${sneak.rolls.join('+')}] = ${sneak.total}`);

    this.say(
      'ataque',
      `${attacker.name} acerta ${target.name}${critical ? ' — CRÍTICO!' : ''} com ${p.name}: ${total} de dano ${p.type}.`,
      `${detail} · ${parts.join(' + ')}`,
    );
    this.onEvent({ type: 'attack', attacker, target, hit: true, critical, damage: total });
    this.applyDamage(target, total, p.type, attacker);

    // Efeito extra do ataque (mordida do lobo derruba).
    if (p.onHit && !target.dead && !hasCondition(target, 'inconsciente')) {
      const save = savingThrow(this.rng, saveBonus(target, p.onHit.save), p.onHit.dc);
      if (!save.success) {
        addCondition(target, p.onHit.condition);
        this.say('condicao', `${target.name} ${p.onHit.note} (resistência ${save.total} vs CD ${p.onHit.dc}).`);
      } else {
        this.say('condicao', `${target.name} se segura (resistência ${save.total} vs CD ${p.onHit.dc}).`);
      }
    }
    return { hit: true, critical, damage: total };
  }

  /** Ação de Ataque completa (trata Ataque Múltiplo dos monstros). */
  attackAction(attacker, target, weaponId = null) {
    if (attacker.actionUsed) return false;
    attacker.actionUsed = true;
    const ma = attacker.multiattack;
    this.resolveAttack(attacker, target, { weaponId });
    if (ma && ma.count > 1 && !target.dead && !hasCondition(target, 'inconsciente')) {
      for (let i = 1; i < ma.count; i++) {
        this.resolveAttack(attacker, target, { weaponId, disadvantage: ma.secondAtDisadvantage && i === 1 });
      }
    }
    this.afterAction(attacker);
    return true;
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
    if (r.natural === 20) {
      this.say('morte', `${actor.name}: 20 natural no teste de morte — levanta com 1 PV!`);
      this.heal(actor, 1);
      return;
    }
    if (r.natural === 1) {
      actor.deathSaves.failures += 2;
      this.say('morte', `${actor.name}: 1 natural — duas falhas (${actor.deathSaves.failures}/3).`);
    } else if (r.total >= 10) {
      actor.deathSaves.successes += 1;
      this.say('morte', `${actor.name}: sucesso no teste de morte (${actor.deathSaves.successes}/3).`);
    } else {
      actor.deathSaves.failures += 1;
      this.say('morte', `${actor.name}: falha no teste de morte (${actor.deathSaves.failures}/3).`);
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
    const save = savingThrow(this.rng, saveBonus(actor, 'con'), dc);
    if (save.success) {
      this.say('concentracao', `${actor.name} mantém a concentração (${save.total} vs CD ${dc}).`);
      return;
    }
    this.say('concentracao', `${actor.name} perde a concentração (${save.total} vs CD ${dc}).`);
    this.dropConcentration(actor);
  }

  dropConcentration(actor) {
    const conc = actor.concentrating;
    if (!conc) return;
    for (const t of conc.targets) removeCondition(t, conc.condition);
    actor.concentrating = null;
  }

  // ---- magias --------------------------------------------------------------

  canCast(actor, spellId) {
    const spell = getSpell(spellId);
    if (!actor.spellcasting) return { ok: false, why: 'não conjura' };
    if (spell.level > 0) {
      const slots = actor.spellcasting.slots;
      if (!slots[spell.level]) return { ok: false, why: 'sem espaço de magia' };
    }
    if (spell.castTime === 'action' && actor.actionUsed) return { ok: false, why: 'ação já usada' };
    if (spell.castTime === 'bonus' && actor.bonusUsed) return { ok: false, why: 'ação bônus já usada' };
    return { ok: true, spell };
  }

  castSpell(actor, spellId, { target = null, point = null } = {}) {
    const check = this.canCast(actor, spellId);
    if (!check.ok) {
      this.say('aviso', `${actor.name} não pode conjurar: ${check.why}.`);
      return false;
    }
    const spell = check.spell;
    if (spell.castTime === 'action') actor.actionUsed = true;
    if (spell.castTime === 'bonus') actor.bonusUsed = true;
    if (spell.level > 0) actor.spellcasting.slots[spell.level] -= 1;

    const dc = spellSaveDc(actor);
    const atkBonus = spellAttackBonus(actor);
    const mod = spellMod(actor);
    this.say('magia', `${actor.name} conjura ${spell.name}.`);

    switch (spell.kind) {
      case 'attack': {
        if (!target) break;
        const mods = this.attackModifiers(actor, target, { ranged: true });
        const cover = this.field.coverBetween(actor.pos, target.pos);
        const atk = attackRoll(this.rng, atkBonus, target.ac + cover, mods);
        if (!atk.hit) {
          this.say('magia', `${spell.name} erra ${target.name}.`, `d20[${atk.rolls.join('/')}]${formatModifier(atkBonus)} = ${atk.total} vs CA ${target.ac + cover}`);
          break;
        }
        const dmg = damageRoll(this.rng, spell.damage, { critical: atk.critical });
        this.say('magia', `${spell.name} acerta ${target.name}: ${dmg.total} de ${spell.damageType}.`, `${spell.damage}[${dmg.rolls.join('+')}]`);
        this.applyDamage(target, dmg.total, spell.damageType, actor);
        if (spell.applies && !target.dead) addCondition(target, spell.applies.condition, { rounds: spell.applies.rounds });
        break;
      }

      case 'save': {
        const squares = spell.shape === 'cone'
          ? this.field.cone(actor.pos, { x: Math.sign((point?.x ?? actor.pos.x) - actor.pos.x), y: Math.sign((point?.y ?? actor.pos.y) - actor.pos.y) }, spell.areaFt)
          : null;
        const targets = squares
          ? squares.map((s) => this.at(s.x, s.y)).filter(Boolean)
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
            : savingThrow(this.rng, saveBonus(t, spell.save), dc);
          const dmg = damageRoll(this.rng, spell.damage);
          const amount = save.success ? (spell.halfOnSave ? Math.floor(dmg.total / 2) : 0) : dmg.total;
          this.say(
            'magia',
            `${t.name} ${save.success ? 'resiste' : 'falha'} (CD ${dc}) e sofre ${amount}.`,
            `${spell.damage}[${dmg.rolls.join('+')}] · resistência ${save.total}`,
          );
          if (amount > 0) this.applyDamage(t, amount, spell.damageType, actor);
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
        this.say('magia', `${spell.darts} dardos atingem ${target.name}: ${total} de ${spell.damageType}.`, `[${rolls.join(' + ')}]`);
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
        const picks = this.alliesOf(actor)
          .concat([actor])
          .filter((a) => distanceFt(actor.pos, a.pos) <= spell.rangeFt && !hasCondition(a, 'inconsciente'))
          .slice(0, spell.targets);
        if (spell.concentration) {
          this.dropConcentration(actor);
          actor.concentrating = { spellId: spell.id, condition: spell.condition, targets: picks };
        }
        for (const a of picks) addCondition(a, spell.condition, { source: actor.id });
        this.say('magia', `${spell.name} em ${picks.map((p) => p.name).join(', ')}.`);
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
    return true;
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

  say(kind, text, detail = null) {
    const entry = { kind, text, detail, round: this.round };
    this.log.push(entry);
    this.onLog(entry);
  }
}
