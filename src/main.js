import './style.css';

import { makeRng, seedFromString } from './core/rng.js';
import { Battlefield, key, distanceFt } from './core/grid.js';
import { Encounter } from './rules/combat.js';
import { makeParty } from './rules/party.js';
import { makeMonster } from './rules/monsters.js';
import { runMonsterSide } from './rules/ai.js';
import { hasCondition } from './rules/conditions.js';
import { getSpell } from './rules/spells.js';
import { WEAPONS } from './rules/equipment.js';
import { Board } from './view/board.js';
import { Hud } from './view/hud.js';

// Mapa do encontro.
//   '.' chão · '#' parede · '~' terreno difícil · 'o' cobertura
//   '1'..'9' elevação (cada nível = 1,5 m)
//
// Duas decisões de desenho aqui:
//
// O paredão central (x7–9, y4–6) existe porque, sem ele, os dois lados se veem
// do primeiro quadrado e o combate vira troca de tiros de 24 m.
//
// O platô do canto superior direito é onde os goblins se posicionam. Subir
// custa o dobro (escalada, pelo SRD), quem está em cima tem cobertura contra
// quem está embaixo, e o platô corta a linha de visão de quem está atrás dele.
// É o terreno que dita o plano — a razão de ser da vista isométrica.
const MAP = [
  '################',
  '#......o...111.#',
  '#..~~..o...111.#',
  '#..~~......111.#',
  '#......###.....#',
  '#......###.....#',
  '#......###.....#',
  '#..oo..........#',
  '#..oo..1...~~..#',
  '#......1...~~..#',
  '#..............#',
  '################',
];

class App {
  constructor(root) {
    this.root = root;
    this.hud = new Hud(root, {
      onSelect: (c) => this.select(c),
      onAction: (a) => this.chooseAction(a),
      onEndTurn: () => this.endTurn(),
      onRestart: () => this.newEncounter(),
    });
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'board';
    this.hud.boardWrap.append(this.canvas);

    this.newEncounter();

    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      this.board?.render(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { this.mode = null; this.refresh(); }
      if (e.key === ' ' && this.enc?.side === 'party') { e.preventDefault(); this.endTurn(); }
      if (e.key === 'Tab') { e.preventDefault(); this.cycleSelection(); }
    });
  }

  newEncounter() {
    const seed = seedFromString(`encontro:${Date.now()}`);
    const rng = makeRng(seed);
    const field = new Battlefield(MAP[0].length, MAP.length, MAP);

    const party = makeParty();
    // Guerreira na frente, mago atrás — o posicionamento inicial já ensina.
    const spots = [{ x: 3, y: 9 }, { x: 2, y: 10 }, { x: 2, y: 9 }, { x: 1, y: 10 }];
    party.forEach((c, i) => {
      c.pos = { ...spots[i] };
      c.facingVec = { dx: 1, dy: -1 }; // olhando para o alto do mapa
    });

    // O chefe e dois goblins ocupam o platô: cobertura e visão de cima.
    const foes = [
      makeMonster('goblinChefe', { x: 12, y: 2 }),
      makeMonster('goblin', { x: 13, y: 3 }, { nameSuffix: 'A' }),
      makeMonster('goblin', { x: 12, y: 1 }, { nameSuffix: 'B' }),
      makeMonster('goblin', { x: 10, y: 2 }, { nameSuffix: 'C' }),
      makeMonster('lobo', { x: 11, y: 6 }, { nameSuffix: 'cinzento' }),
    ];
    for (const f of foes) f.facingVec = { dx: -1, dy: 1 };

    this.enc = new Encounter({
      battlefield: field,
      party,
      foes,
      rng,
      onLog: (entry) => this.hud.pushLog(entry),
      onEvent: (ev) => this.onEvent(ev),
    });

    this.hud.logList.replaceChildren();
    this.selected = null;
    this.mode = null;

    this.board = new Board(this.canvas, {
      encounter: this.enc,
      onTileClick: (t) => this.onTileClick(t),
      onTileHover: (t) => this.onTileHover(t),
    });

    this.enc.start();
    if (this.enc.side === 'party') this.select(this.firstActive());
    this.refresh();
  }

  // ---- eventos do motor ----------------------------------------------------

  onEvent(ev) {
    switch (ev.type) {
      case 'damage':
        ev.target.flash = 1;
        this.board?.floatText(ev.target.pos, `-${Math.round(ev.amount)}`, '#ff6a6a', ev.amount >= 10);
        this.board?.bump();
        break;
      case 'heal':
        if (ev.amount > 0) this.board?.floatText(ev.target.pos, `+${Math.round(ev.amount)}`, '#6ee89a');
        break;
      case 'moved':
        ev.actor.facingVec = { dx: ev.to.x - ev.from.x, dy: ev.to.y - ev.from.y };
        break;
      case 'attack':
        if (ev.attacker) {
          ev.attacker.facingVec = {
            dx: ev.target.pos.x - ev.attacker.pos.x,
            dy: ev.target.pos.y - ev.attacker.pos.y,
          };
          ev.attacker.anim = { name: 'attack', frame: 1 };
          setTimeout(() => { if (ev.attacker) ev.attacker.anim = null; }, 260);
        }
        if (!ev.hit) this.board?.floatText(ev.target.pos, 'errou', '#9aa3b2');
        break;
      case 'downed':
      case 'died':
        this.board?.floatText(ev.target.pos, '✖', '#ff4b4b', true);
        break;
      case 'sideStart':
        if (ev.side === 'foes') {
          this.selected = null;
          this.mode = null;
          queueMicrotask(() => this.runFoes());
        } else {
          this.select(this.firstActive());
        }
        break;
      case 'end':
        this.selected = null;
        this.mode = null;
        break;
      default:
        break;
    }
    this.refresh();
  }

  async runFoes() {
    this.refresh();
    await runMonsterSide(this.enc, { delayMs: 560, onStep: () => this.refresh() });
    this.refresh();
  }

  // ---- seleção e modos -----------------------------------------------------

  firstActive() {
    return this.enc.allOf('party').find((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente')) ?? null;
  }

  cycleSelection() {
    const list = this.enc.allOf('party').filter((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente'));
    if (list.length === 0) return;
    const i = list.indexOf(this.selected);
    this.select(list[(i + 1) % list.length]);
  }

  select(c) {
    if (c && (c.dead || hasCondition(c, 'inconsciente') || c.side !== 'party')) return;
    this.selected = c;
    this.mode = null;
    this.refresh();
  }

  chooseAction(action) {
    const c = this.selected;
    if (!c || this.enc.side !== 'party') return;

    if (action.kind === 'dash') { this.enc.dash(c); this.afterAct(); return; }
    if (action.kind === 'dodge') { this.enc.dodge(c); this.afterAct(); return; }
    if (action.kind === 'disengage') { this.enc.disengage(c); this.afterAct(); return; }
    if (action.kind === 'feature') {
      this.enc.useFeature(c, action.featureId);
      this.afterAct();
      return;
    }
    // Ataques e magias entram em modo de alvo.
    if (action.kind === 'spell') {
      const spell = getSpell(action.spellId);
      // Magias sem alvo individual resolvem na hora ou pedem um ponto.
      if (spell.kind === 'buff') {
        this.enc.castSpell(c, action.spellId);
        this.afterAct();
        return;
      }
    }
    this.mode = this.mode?.kind === action.kind
      && this.mode.weaponId === action.weaponId
      && this.mode.spellId === action.spellId
      ? null
      : action;
    this.refresh();
  }

  onTileClick(tile) {
    if (this.enc.over || this.enc.side !== 'party') return;
    const occupant = this.enc.at(tile.x, tile.y);
    const c = this.selected;

    // Modo de alvo
    if (this.mode && c) {
      if (!occupant) {
        // Magia de área pode mirar no chão.
        const spell = this.mode.kind === 'spell' ? getSpell(this.mode.spellId) : null;
        if (spell && (spell.shape === 'cone' || spell.shape === 'sphere')) {
          this.enc.castSpell(c, this.mode.spellId, { point: tile });
          this.mode = null;
          this.afterAct();
        }
        return;
      }
      if (this.mode.kind === 'attack') {
        if (occupant.side === c.side) { this.select(occupant); return; }
        this.enc.attackAction(c, occupant, this.mode.weaponId);
        this.mode = null;
        this.afterAct();
        return;
      }
      if (this.mode.kind === 'spell') {
        this.enc.castSpell(c, this.mode.spellId, { target: occupant, point: occupant.pos });
        this.mode = null;
        this.afterAct();
        return;
      }
    }

    // Seleção
    if (occupant && occupant.side === 'party') { this.select(occupant); return; }
    if (occupant) return;

    // Movimento
    if (!c) return;
    const reached = this.enc.reachableFor(c);
    const node = reached.get(key(tile.x, tile.y));
    if (!node || node.cost === 0) return;
    this.enc.moveAlong(c, Battlefield.pathFrom(reached, tile));
    this.refresh();
  }

  onTileHover(tile) {
    const c = this.selected;
    if (!c || this.enc.side !== 'party' || this.mode) {
      this.board?.setOverlay({ path: null });
      if (this.mode && tile) this.updateHint(tile);
      return;
    }
    if (!tile) { this.board?.setOverlay({ path: null }); return; }
    const reached = this.enc.reachableFor(c);
    const node = reached.get(key(tile.x, tile.y));
    if (!node || this.enc.occupied(tile.x, tile.y, c)) {
      this.board?.setOverlay({ path: null });
      this.hud.setHint('');
      return;
    }
    this.board?.setOverlay({ path: Battlefield.pathFrom(reached, tile) });
    this.hud.setHint(`Mover ${node.cost} pés (restam ${c.movementLeftFt - node.cost})`);
  }

  updateHint(tile) {
    const c = this.selected;
    const target = this.enc.at(tile.x, tile.y);
    if (!c || !target || !this.mode) { this.hud.setHint(''); return; }
    if (this.mode.kind === 'attack') {
      const check = this.enc.canAttack(c, target, this.mode.weaponId);
      if (!check.ok) { this.hud.setHint(`✖ ${check.why}`); return; }
      const mods = this.enc.attackModifiers(c, target, { ranged: check.profile.ranged });
      const bits = [`CA ${target.ac}`, `${check.profile.damage} ${check.profile.type}`];
      if (mods.advantage && !mods.disadvantage) bits.push(`vantagem (${mods.reasons.join(', ')})`);
      if (mods.disadvantage && !mods.advantage) bits.push(`desvantagem (${mods.reasons.join(', ')})`);
      if (check.longRange) bits.push('alcance longo');
      this.hud.setHint(bits.join(' · '));
    } else if (this.mode.kind === 'spell') {
      const s = getSpell(this.mode.spellId);
      const d = distanceFt(c.pos, target.pos);
      this.hud.setHint(`${s.name} · ${d} pés${d > s.rangeFt && s.rangeFt > 0 ? ' (fora de alcance)' : ''}`);
    }
  }

  afterAct() {
    const c = this.selected;
    // Terminou tudo que podia? passa para o próximo automaticamente.
    if (c && c.actionUsed && c.bonusUsed && c.movementLeftFt <= 0) this.enc.endTurn(c);
    if (c?.acted) this.select(this.firstActive());
    this.refresh();
  }

  endTurn() {
    const c = this.selected;
    if (!c || this.enc.side !== 'party') return;
    this.enc.endTurn(c);
    this.select(this.firstActive());
    this.refresh();
  }

  refresh() {
    const c = this.selected;
    const targets = this.mode && c
      ? this.enc.combatants.filter((t) => !t.dead && t.side !== c.side
        && (this.mode.kind !== 'attack' || this.enc.canAttack(c, t, this.mode.weaponId).ok))
      : null;

    this.board?.setOverlay({
      selected: c,
      reachable: c && !this.mode && this.enc.side === 'party' ? this.enc.reachableFor(c) : null,
      targets,
      path: null,
    });
    this.hud.update(this.enc, c, this.mode);
    if (!this.mode) this.hud.setHint(c ? `${c.name} — clique num quadrado azul para mover, ou escolha uma ação.` : '');
  }
}

const app = new App(document.getElementById('app'));

// Em desenvolvimento, dá para dirigir o combate pelo console:
//   __app.enc            estado do encontro
//   __app.autoPlay()     joga o grupo sozinho até o fim (teste de fumaça)
if (import.meta.env?.DEV) {
  window.__app = app;
  // Política simples para o grupo: cura quem está caindo, senão bate no mais
  // perto. Não é para jogar bem — é para exercitar todos os caminhos de regra
  // (ataque, magia, cura, recursos de classe) sem clicar turno a turno.
  const playCharacter = (enc, c) => {
    const foes = enc.enemiesOf(c);
    if (foes.length === 0) { enc.endTurn(c); return; }

    // Clérigo levanta aliado caído.
    if (c.spellcasting?.prepared.includes('palavraCurativa') && !c.bonusUsed) {
      const down = enc.alliesOf(c).find((a) => !a.dead && a.hp <= 0 && distanceFt(c.pos, a.pos) <= 60);
      if (down && c.spellcasting.slots[1] > 0) enc.castSpell(c, 'palavraCurativa', { target: down });
    }

    const nearest = foes.slice().sort((a, b) => distanceFt(c.pos, a.pos) - distanceFt(c.pos, b.pos))[0];

    // Conjurador usa truque ou magia de ataque se tiver linha e alcance.
    if (!c.actionUsed && c.spellcasting) {
      const options = [...c.spellcasting.prepared, ...c.spellcasting.cantrips];
      for (const sid of options) {
        const s = getSpell(sid);
        if (s.kind !== 'attack' && s.kind !== 'auto' && s.kind !== 'save') continue;
        if (s.level > 0 && !c.spellcasting.slots[s.level]) continue;
        if (s.rangeFt > 0 && distanceFt(c.pos, nearest.pos) > s.rangeFt) continue;
        if (!enc.field.hasLineOfSight(c.pos, nearest.pos)) continue;
        enc.castSpell(c, sid, { target: nearest, point: nearest.pos });
        enc.endTurn(c);
        return;
      }
    }

    // Guerreiro: cura a si mesmo quando está mal.
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

    // Fecha a distância.
    const reached = enc.reachableFor(c);
    let best = null;
    for (const node of reached.values()) {
      if (enc.occupied(node.x, node.y, c)) continue;
      const d = distanceFt({ x: node.x, y: node.y }, nearest.pos);
      if (!best || d < best.d) best = { d, node };
    }
    if (best && best.node.cost > 0) enc.moveAlong(c, Battlefield.pathFrom(reached, best.node));

    if (!c.actionUsed && !c.dead && !hasCondition(c, 'inconsciente')) {
      const d = distanceFt(c.pos, nearest.pos);
      if (melee && d <= 5) enc.attackAction(c, nearest, melee);
      else if (ranged && enc.canAttack(c, nearest, ranged).ok) enc.attackAction(c, nearest, ranged);
    }
    if (!c.acted) enc.endTurn(c);
  };

  app.autoPlay = async (maxRounds = 25) => {
    while (!app.enc.over && app.enc.round <= maxRounds) {
      if (app.enc.side !== 'party') { await new Promise((r) => setTimeout(r, 60)); continue; }
      const pending = app.enc.allOf('party').filter((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente'));
      if (pending.length === 0) { await new Promise((r) => setTimeout(r, 60)); continue; }
      playCharacter(app.enc, pending[0]);
      await new Promise((r) => setTimeout(r, 25));
    }
    app.refresh();
    return { over: app.enc.over, outcome: app.enc.outcome, round: app.enc.round, entries: app.enc.log.length };
  };
}
