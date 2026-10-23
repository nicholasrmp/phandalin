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
import { MAP, PARTY_SPOTS, buildFoes, reinforcementsFor } from './game/encounter.js';
import { Board } from './view/board.js';
import { Hud } from './view/hud.js';
import { audio } from './core/audio.js';
import {
  playWeaponVisual, playSpellVisual, playDeathVisual, andarDe,
} from './view/visuals.js';


class App {
  constructor(root) {
    this.root = root;
    this.hud = new Hud(root, {
      onSelect: (c) => this.select(c),
      onAction: (a) => this.chooseAction(a),
      onEndTurn: () => this.endTurn(),
      onRestart: () => this.newEncounter(),
      onRotate: (d) => this.rotateView(d),
      onZoom: (f) => { this.board?.zoomBy(f); audio.play('click'); },
      onResetCamera: () => { this.board?.resetCamera(); audio.play('click'); this.refresh(); },
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

    // O navegador só deixa tocar som depois de um gesto do usuário.
    const unlock = () => audio.unlock();
    addEventListener('pointerdown', unlock, { once: true, capture: true });
    addEventListener('keydown', unlock, { once: true, capture: true });

    addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { this.mode = null; this.refresh(); }
      if (e.key === ' ' && this.enc?.side === 'party') { e.preventDefault(); this.endTurn(); }
      if (e.key === 'Tab') { e.preventDefault(); this.cycleSelection(); }
      const k = e.key.toLowerCase();
      if (k === 'q') this.rotateView(-1);
      if (k === 'e') this.rotateView(1);
      if (k === 'm') { audio.toggleMute(); this.refresh(); }
    });
  }

  newEncounter() {
    const seed = seedFromString(`encontro:${Date.now()}`);
    const rng = makeRng(seed);
    const field = new Battlefield(MAP[0].length, MAP.length, MAP);

    const party = makeParty();
    party.forEach((c, i) => {
      c.pos = { ...PARTY_SPOTS[i] };
      c.facingVec = { dx: 1, dy: -1 };
    });
    // `?encontro=grandes` troca o encontro por uma vitrine de tamanho. O
    // encontro padrão não tem criatura Grande, e mexer na composição dele só
    // para mostrar o recurso estragaria um equilíbrio que foi medido.
    const foes = buildFoes(new URLSearchParams(location.search).get('encontro') ?? 'padrao');

    this.enc = new Encounter({
      battlefield: field,
      party,
      foes,
      rng,
      reinforcements: (round) => reinforcementsFor(round),
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
    this.board.onCameraChange = () => this.refresh();

    this.enc.start();
    if (this.enc.side === 'party') this.select(this.firstActive());
    this.refresh();
  }

  // ---- eventos do motor ----------------------------------------------------

  /**
   * O motor resolve tudo de uma vez: quando o evento de dano chega, os PV já
   * caíram. `impactDelay` segura o número e o clarão até o instante em que a
   * animação chega no alvo — a flecha pousar, o dardo estourar. É zerado no
   * microtask seguinte, então vale só para a ação em curso.
   */
  setImpactDelay(seconds) {
    this.impactDelay = seconds;
    queueMicrotask(() => { this.impactDelay = 0; });
  }

  atImpact(fn) {
    const d = this.impactDelay ?? 0;
    if (d > 0) setTimeout(fn, d * 1000);
    else fn();
  }

  onEvent(ev) {
    const board = this.board;
    switch (ev.type) {
      case 'moved': {
        ev.actor.facingVec = { dx: ev.to.x - ev.from.x, dy: ev.to.y - ev.from.y };
        // O motor já moveu a peça; isto conta a viagem quadrado a quadrado.
        // O andar vem da criatura: a gelatina escorre, a aranha treme, o
        // zumbi arrasta uma perna, o ogro parte e para seco.
        board?.fx.walk(ev.actor, ev.path, {
          andar: andarDe(ev.actor),
          onStep: () => audio.play('step'),
        });
        break;
      }

      case 'attack': {
        const a = ev.attacker;
        const t = ev.target;
        a.facingVec = { dx: t.pos.x - a.pos.x, dy: t.pos.y - a.pos.y };
        a.anim = { name: 'attack', frame: 1 };
        setTimeout(() => { a.anim = null; }, 280);
        // A receita da arma toca som, anima e devolve quando o golpe chega.
        // Se quem ataca ainda está andando, o golpe espera a chegada.
        const espera = (board?.fx.walkTimeLeft ?? 0);
        this.setImpactDelay(playWeaponVisual(board, ev, { startDelay: espera }));
        break;
      }

      case 'spell': {
        const { caster, spell, target, point } = ev;
        const dest = target?.pos ?? point ?? caster.pos;
        caster.facingVec = { dx: dest.x - caster.pos.x, dy: dest.y - caster.pos.y };
        caster.anim = { name: 'attack', frame: 1 };
        setTimeout(() => { caster.anim = null; }, 340);
        this.setImpactDelay(playSpellVisual(board, ev));
        break;
      }

      case 'reinforcements': {
        audio.play('down');
        for (const u of ev.units) {
          board?.fx.ring(u.pos, { color: '#ff6a4b', radius: 44, dur: 0.7 });
          board?.floatText(u.pos, '!', '#ff6a4b', true);
        }
        break;
      }

      case 'redirect': {
        board?.floatText(ev.from.pos, 'empurrado!', '#ffc83a');
        board?.fx.ring(ev.to.pos, { color: '#ffc83a', radius: 26, dur: 0.4, width: 2 });
        audio.play('step');
        break;
      }

      case 'ignite': {
        board?.fx.flames(ev.target.pos, { color: '#ff6a2a', count: 6, dur: 0.7, scale: 1.2 });
        board?.floatText(ev.target.pos, 'pegou fogo!', '#ff8a3a');
        audio.play('castFire');
        break;
      }

      case 'burn': {
        board?.fx.flames(ev.target.pos, { color: '#ff6a2a', count: 4, dur: 0.45 });
        audio.play('castFire');
        break;
      }

      case 'damage': {
        const { target, amount } = ev;
        this.atImpact(() => {
          target.flash = 1;
          board?.floatText(target.pos, `-${Math.round(amount)}`, '#ff6a6a', amount >= 10);
          board?.bump(0.22);
        });
        break;
      }

      case 'heal': {
        if (ev.amount > 0) {
          const { target, amount } = ev;
          this.atImpact(() => {
            board?.floatText(target.pos, `+${Math.round(amount)}`, '#6ee89a');
            board?.fx.ring(target.pos, { color: '#6ee89a', radius: 28, dur: 0.5, width: 2 });
          });
        }
        break;
      }

      case 'downed':
      case 'died': {
        const { target } = ev;
        this.atImpact(() => {
          board?.floatText(target.pos, '✖', '#ff4b4b', true);
          // Esqueleto desmonta, gelatina derrete, espectro se dissipa. Um
          // respingo de sangue para os três joga fora metade do que o
          // bestiário conquistou — e esqueleto não sangra.
          if (ev.type === 'died' && target.kind === 'npc') {
            playDeathVisual(board, target);
          } else {
            board?.fx.impact(target.pos, { color: '#8a2b2b', count: 14, spread: 40, dur: 0.6 });
            audio.play('down');
          }
        });
        break;
      }

      case 'sideStart': {
        audio.play('turn');
        if (ev.side === 'foes') {
          this.selected = null;
          this.mode = null;
          queueMicrotask(() => this.runFoes());
        } else {
          this.select(this.firstActive());
        }
        break;
      }

      case 'end': {
        this.selected = null;
        this.mode = null;
        const outcome = ev.outcome;
        setTimeout(() => audio.play(outcome === 'vitoria' ? 'victory' : 'defeat'), 500);
        break;
      }

      default:
        break;
    }
    this.refresh();
  }

  async runFoes() {
    this.refresh();
    // A pausa entre monstros tem que ser maior que a animação do golpe, senão
    // um começa a agir enquanto o anterior ainda está no ar: flecha viajando
    // (0,3 s) + estilhaços (0,42 s) ≈ 0,7 s.
    await runMonsterSide(this.enc, { delayMs: () => 420 + this.walkWaitMs, onStep: () => this.refresh() });
    this.refresh();
  }

  /** Gira a câmera em 90°. A grade do jogo não muda — só a leitura dela. */
  rotateView(delta) {
    if (!this.board) return;
    this.board.rotate(delta);
    audio.play('click');
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

    if (action.kind === 'stabilize') {
      const alvo = this.enc.combatants.find((x) => x.id === action.targetId);
      if (alvo) this.enc.stabilize(c, alvo);
      this.afterAct();
      return;
    }
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

  /** Recusa visível: diz o porquê e NÃO gasta nada. */
  refuse(actor, why) {
    this.hud.setHint(`✖ ${why}`);
    this.board?.floatText(actor.pos, '✖', '#ffb04a');
    audio.play('deny');
    this.refresh();
  }

  /** Quanto tempo a animação de caminhada ainda vai levar, em ms. */
  get walkWaitMs() {
    return Math.ceil((this.board?.fx.walkTimeLeft ?? 0) * 1000);
  }

  /** Espera a caminhada terminar antes de resolver o golpe, para ler na ordem. */
  afterWalk(fn) {
    const wait = this.walkWaitMs;
    if (wait <= 0) { fn(); return; }
    this.busy = true;
    this.refresh();
    setTimeout(() => { this.busy = false; fn(); }, wait + 40);
  }

  /**
   * Ataque com um clique. Se for corpo a corpo e o alvo estiver longe, o
   * personagem ANDA até ele gastando movimento e então ataca. Se o movimento
   * não der para chegar, avança o máximo possível e não ataca — mas a ação
   * continua disponível.
   */
  tryAttack(c, target, weaponId) {
    const enc = this.enc;
    const check = enc.canAttack(c, target, weaponId);

    if (check.ok) {
      const r = enc.attackAction(c, target, weaponId);
      this.mode = null;
      if (!r.ok) { this.refuse(c, r.why); return; }
      this.afterAct();
      return;
    }

    const prof = enc.weaponAttackProfile(c, weaponId);
    // Arma à distância não resolve andando: o problema é visão ou alcance.
    if (prof.ranged) { this.refuse(c, check.why); return; }
    if (c.actionUsed) { this.refuse(c, 'a ação deste turno já foi usada'); return; }
    if (c.movementLeftFt <= 0) { this.refuse(c, `sem movimento para chegar até ${target.name}`); return; }

    const reached = enc.reachableFor(c);
    let encosta = null;
    let maisPerto = null;
    for (const node of reached.values()) {
      if (enc.occupied(node.x, node.y, c)) continue;
      const d = distanceFt({ x: node.x, y: node.y }, target.pos);
      if (d <= prof.reachFt && (!encosta || node.cost < encosta.node.cost)) encosta = { node, d };
      if (!maisPerto || d < maisPerto.d || (d === maisPerto.d && node.cost < maisPerto.node.cost)) maisPerto = { node, d };
    }

    if (encosta) {
      enc.moveAlong(c, Battlefield.pathFrom(reached, encosta.node));
      this.mode = null;
      this.afterWalk(() => {
        const r = enc.attackAction(c, target, weaponId);
        if (!r.ok) this.refuse(c, r.why);
        else this.afterAct();
      });
      return;
    }

    // Não chega neste turno: avança o que der e guarda a ação.
    if (maisPerto && maisPerto.node.cost > 0) {
      enc.moveAlong(c, Battlefield.pathFrom(reached, maisPerto.node));
      this.mode = null;
      this.afterWalk(() => this.refuse(c, `movimento insuficiente para alcançar ${target.name} — avançou o máximo possível, a ação continua sua`));
      return;
    }
    this.refuse(c, check.why);
  }

  /** Conjuração com um clique, recusando sem gastar quando não dá. */
  tryCast(c, spellId, { target = null, point = null } = {}) {
    const r = this.enc.castSpell(c, spellId, { target, point });
    this.mode = null;
    if (!r.ok) { this.refuse(c, r.why); return; }
    this.afterAct();
  }

  onTileClick(tile) {
    if (this.enc.over || this.enc.side !== 'party' || this.busy) return;
    const occupant = this.enc.at(tile.x, tile.y);
    const c = this.selected;

    // Modo de alvo
    if (this.mode && c) {
      if (!occupant) {
        const spell = this.mode.kind === 'spell' ? getSpell(this.mode.spellId) : null;
        if (spell && (spell.shape === 'cone' || spell.shape === 'sphere')) {
          this.tryCast(c, this.mode.spellId, { point: tile });
        }
        return;
      }
      if (this.mode.kind === 'attack') {
        if (occupant.side === c.side) { this.select(occupant); return; }
        this.tryAttack(c, occupant, this.mode.weaponId);
        return;
      }
      if (this.mode.kind === 'spell') {
        this.tryCast(c, this.mode.spellId, { target: occupant, point: occupant.pos });
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
  // A política do grupo mora em dev/balance.js, junto do simulador de
  // equilíbrio — uma cópia só, para as duas não saírem do lugar.
  let playCharacter = null;

  app.autoPlay = async (maxRounds = 25) => {
    playCharacter ??= (await import('./dev/balance.js')).playCharacter;
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
