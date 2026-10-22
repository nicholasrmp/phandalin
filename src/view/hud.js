// HUD: fichas do grupo, barra de ações, log de rolagens.
// DOM puro. Nome de jogador e texto de log sempre via textContent.

import { makePortrait } from '../art/sheet.js';
import { CONDITIONS, hasCondition } from '../rules/conditions.js';
import { WEAPONS } from '../rules/equipment.js';
import { getSpell } from '../rules/spells.js';
import { spellSaveDc, spellAttackBonus } from '../rules/abilities.js';
import { formatModifier } from '../core/dice.js';
import { audio } from '../core/audio.js';

export const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'style') Object.assign(node.style, v);
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
};

const LOG_ICON = {
  inicio: '🎲', turno: '⏳', ataque: '⚔️', magia: '✨', cura: '💚', morte: '💀',
  condicao: '🌀', recurso: '🔸', acao: '🏃', reacao: '⚡', aviso: '⚠️',
  concentracao: '🧠', fim: '🏁',
};

export class Hud {
  constructor(root, handlers) {
    this.handlers = handlers;
    this.root = root;

    this.banner = el('div', { class: 'turn-banner' });
    this.partyPanel = el('div', { class: 'party' });
    this.actionBar = el('div', { class: 'actionbar' });
    this.logList = el('div', { class: 'log-list' });
    this.foePanel = el('div', { class: 'foes' });
    this.hint = el('div', { class: 'hint' });

    root.append(
      el('div', { class: 'left-col' },
        el('h2', {}, 'Grupo'),
        this.partyPanel,
        el('h2', {}, 'Inimigos'),
        this.foePanel),
      el('div', { class: 'center-col' },
        el('div', { class: 'top-row' }, this.banner, this.viewBar = el('div', { class: 'viewbar' })),
        el('div', { class: 'board-wrap', id: 'board-wrap' }),
        this.hint,
        this.actionBar),
      el('div', { class: 'right-col' },
        el('h2', {}, 'Rolagens'),
        this.logList,
        el('footer', { class: 'legal' },
          el('p', {}, 'Phandalin é conteúdo de fã não oficial, permitido sob a Fan Content Policy da Wizards of the Coast. '
            + 'Não é aprovado nem endossado pela Wizards. Partes dos materiais usados são propriedade da Wizards of the Coast. '
            + '©Wizards of the Coast LLC.'),
          el('p', {}, 'Inclui material do SRD 5.2 por Wizards of the Coast LLC, sob licença Creative Commons Attribution 4.0.'))),
    );
  }

  get boardWrap() {
    return this.root.querySelector('#board-wrap');
  }

  pushLog(entry) {
    const node = el('div', { class: `log-entry log-${entry.kind}` },
      el('span', { class: 'log-icon' }, LOG_ICON[entry.kind] ?? '•'),
      el('div', {},
        el('span', { class: 'log-text' }, entry.text),
        entry.detail ? el('span', { class: 'log-detail' }, entry.detail) : null));
    this.logList.append(node);
    this.logList.scrollTop = this.logList.scrollHeight;
    while (this.logList.childElementCount > 160) this.logList.firstElementChild.remove();
  }

  setBanner(enc) {
    if (enc.over) {
      this.banner.textContent = enc.outcome === 'vitoria' ? '🏁 Vitória' : '💀 Derrota';
      this.banner.className = `turn-banner ${enc.outcome}`;
      return;
    }
    const party = enc.side === 'party';
    this.banner.textContent = party
      ? `Rodada ${enc.round} — seu turno`
      : `Rodada ${enc.round} — turno dos inimigos`;
    this.banner.className = `turn-banner ${party ? 'party' : 'foes'}`;
  }

  setHint(text) {
    this.hint.textContent = text ?? '';
  }

  update(enc, selected, mode) {
    this.setBanner(enc);
    this.renderParty(enc, selected);
    this.renderFoes(enc);
    this.renderActions(enc, selected, mode);
    this.renderViewBar();
  }

  /** Controles de câmera e som. Ficam fora do fluxo de turno de propósito. */
  renderViewBar() {
    if (this.viewBar.childElementCount > 0) {
      // Só o que muda de estado é reescrito; o resto fica estável.
      this.muteBtn.textContent = audio.muted ? '🔇' : '🔊';
      this.muteBtn.title = audio.muted ? 'Som desligado (M)' : 'Som ligado (M)';
      this.volume.value = String(audio.muted ? 0 : Math.round(audio.volume * 100));
      return;
    }

    this.muteBtn = el('button', {
      class: 'icon-btn',
      title: 'Ligar/desligar som (M)',
      onclick: () => { audio.unlock(); audio.toggleMute(); this.renderViewBar(); },
    }, audio.muted ? '🔇' : '🔊');

    this.volume = el('input', {
      type: 'range', min: '0', max: '100', class: 'volume',
      value: String(Math.round(audio.volume * 100)),
      title: 'Volume',
      oninput: (e) => { audio.unlock(); audio.setVolume(Number(e.target.value) / 100); this.renderViewBar(); },
    });

    this.viewBar.replaceChildren(
      el('button', { class: 'icon-btn', title: 'Girar a câmera (Q · ou botão direito arrastando)', onclick: () => this.handlers.onRotate?.(-1) }, '↺'),
      el('button', { class: 'icon-btn', title: 'Girar a câmera (E · ou botão direito arrastando)', onclick: () => this.handlers.onRotate?.(1) }, '↻'),
      el('span', { class: 'divider' }),
      el('button', { class: 'icon-btn', title: 'Afastar (roda do mouse)', onclick: () => this.handlers.onZoom?.(1 / 1.2) }, '－'),
      el('button', { class: 'icon-btn', title: 'Enquadrar de novo', onclick: () => this.handlers.onResetCamera?.() }, '⌖'),
      el('button', { class: 'icon-btn', title: 'Aproximar (roda do mouse)', onclick: () => this.handlers.onZoom?.(1.2) }, '＋'),
      el('span', { class: 'divider' }),
      this.muteBtn,
      this.volume,
    );
  }

  renderParty(enc, selected) {
    this.partyPanel.replaceChildren(...enc.allOf('party').map((c) => this.characterCard(enc, c, selected)));
  }

  characterCard(enc, c, selected) {
    const down = c.dead || hasCondition(c, 'inconsciente');
    const pct = Math.max(0, c.hp / c.maxHp);
    const portrait = makePortrait(c.look, 1.6);
    portrait.className = 'pixel';

    const slots = c.spellcasting
      ? el('div', { class: 'slots' },
        c.spellcasting.slots.map((n, lvl) => (lvl === 0 ? null
          : el('span', { class: 'slot' }, `${lvl}º: ${'◆'.repeat(n)}${'◇'.repeat(Math.max(0, (lvl === 1 ? 3 : 0) - n))}`))))
      : null;

    return el('button', {
      class: `card${selected === c ? ' on' : ''}${c.acted ? ' acted' : ''}${down ? ' down' : ''}`,
      onclick: () => this.handlers.onSelect?.(c),
    },
      el('div', { class: 'card-top' },
        portrait,
        el('div', { class: 'card-id' },
          el('strong', {}, c.name),
          el('span', { class: 'muted' }, `${c.className} ${c.ancestry} · Nv ${c.level}`),
          el('span', { class: 'stats-line' }, `CA ${c.ac}`, ' · ', `PV ${Math.max(0, Math.ceil(c.hp))}/${c.maxHp}`))),
      el('div', { class: 'bar' }, el('i', { style: { width: `${pct * 100}%`, background: pct > 0.5 ? '#5fd07a' : pct > 0.25 ? '#ffc83a' : '#ff5a5a' } })),
      down
        ? el('div', { class: 'death' }, c.dead ? 'Morto' : `Testes de morte ${c.deathSaves.successes}✓ / ${c.deathSaves.failures}✗`)
        : null,
      slots,
      (c.conditions ?? []).length
        ? el('div', { class: 'conds' }, c.conditions.map((x) => el('span', { class: 'cond', title: CONDITIONS[x.id]?.desc }, `${CONDITIONS[x.id]?.icon} ${CONDITIONS[x.id]?.name}`)))
        : null,
    );
  }

  renderFoes(enc) {
    const alive = enc.allOf('foes');
    this.foePanel.replaceChildren(...alive.map((c) => {
      const pct = Math.max(0, c.hp / c.maxHp);
      const down = hasCondition(c, 'inconsciente');
      return el('div', { class: `foe${down ? ' down' : ''}` },
        el('div', { class: 'foe-top' },
          el('strong', {}, c.name),
          el('span', { class: 'muted' }, `CA ${c.ac}`)),
        el('div', { class: 'bar small' }, el('i', { style: { width: `${pct * 100}%`, background: '#d4574a' } })),
        (c.conditions ?? []).length
          ? el('div', { class: 'conds' }, c.conditions.map((x) => el('span', { class: 'cond' }, CONDITIONS[x.id]?.icon ?? '')))
          : null);
    }));
    if (alive.length === 0) this.foePanel.append(el('p', { class: 'muted' }, 'Nenhum de pé.'));
  }

  renderActions(enc, c, mode) {
    this.actionBar.replaceChildren();
    if (enc.over) {
      this.actionBar.append(el('button', { class: 'btn primary', onclick: () => this.handlers.onRestart?.() }, 'Novo encontro'));
      return;
    }
    if (enc.side !== 'party') {
      this.actionBar.append(el('span', { class: 'muted' }, 'Os inimigos estão agindo…'));
      return;
    }
    if (!c) {
      this.actionBar.append(el('span', { class: 'muted' }, 'Escolha um personagem na coluna da esquerda.'));
      return;
    }
    if (c.dead || hasCondition(c, 'inconsciente')) {
      this.actionBar.append(el('span', { class: 'muted' }, `${c.name} está fora de combate.`));
      return;
    }

    const btn = (label, opts, onClick, title) => el('button', {
      class: `act${opts.disabled ? ' off' : ''}${opts.active ? ' on' : ''}`,
      title: title ?? '',
      disabled: opts.disabled ? 'disabled' : null,
      onclick: onClick,
    }, label);

    const move = el('span', { class: 'budget' }, `🏃 ${c.movementLeftFt} pés`);
    const actionDot = el('span', { class: `budget ${c.actionUsed ? 'used' : ''}` }, c.actionUsed ? '◻ ação' : '◼ ação');
    const bonusDot = el('span', { class: `budget ${c.bonusUsed ? 'used' : ''}` }, c.bonusUsed ? '◻ bônus' : '◼ bônus');
    this.actionBar.append(move, actionDot, bonusDot, el('span', { class: 'sep' }));

    // Ataques
    for (const wid of c.weapons ?? []) {
      const w = WEAPONS[wid];
      this.actionBar.append(btn(
        `⚔️ ${w.name}`,
        { disabled: c.actionUsed, active: mode?.kind === 'attack' && mode.weaponId === wid },
        () => this.handlers.onAction?.({ kind: 'attack', weaponId: wid }),
        `${w.damage} ${w.type}${w.ranged ? ` · alcance ${w.rangeFt} pés` : ''}`,
      ));
    }

    // Magias
    if (c.spellcasting) {
      const dc = spellSaveDc(c);
      const atk = spellAttackBonus(c);
      const all = [...c.spellcasting.cantrips, ...c.spellcasting.prepared];
      for (const sid of all) {
        const s = getSpell(sid);
        const noSlot = s.level > 0 && !c.spellcasting.slots[s.level];
        const used = s.castTime === 'bonus' ? c.bonusUsed : c.actionUsed;
        this.actionBar.append(btn(
          `${s.icon} ${s.name}${s.level === 0 ? '' : ` (${s.level}º)`}`,
          { disabled: noSlot || used, active: mode?.kind === 'spell' && mode.spellId === sid },
          () => this.handlers.onAction?.({ kind: 'spell', spellId: sid }),
          `${s.desc} · CD ${dc} · ataque ${formatModifier(atk)}`,
        ));
      }
    }

    // Talentos de classe
    const feats = {
      secondWind: ['🫁 Retomar o Fôlego', () => !c.bonusUsed && c.resources?.secondWind > 0],
      actionSurge: ['⚡ Ação Surpreendente', () => c.resources?.actionSurge > 0],
      cunningAction: ['🌀 Ação Ardilosa', () => !c.bonusUsed],
      preserveLife: ['✝️ Preservar a Vida', () => !c.actionUsed && c.resources?.channelDivinity > 0],
    };
    for (const f of c.features ?? []) {
      const entry = feats[f];
      if (!entry) continue;
      this.actionBar.append(btn(entry[0], { disabled: !entry[1]() }, () => this.handlers.onAction?.({ kind: 'feature', featureId: f })));
    }

    // Primeiros socorros: só aparece quando há alguém caído ao lado.
    const caido = enc.alliesOf(c).find(
      (a) => !a.dead && !a.stable && hasCondition(a, 'inconsciente')
        && Math.max(Math.abs(a.pos.x - c.pos.x), Math.abs(a.pos.y - c.pos.y)) === 1,
    );
    if (caido) {
      this.actionBar.append(btn(
        `✚ Estabilizar ${caido.name}`,
        { disabled: c.actionUsed },
        () => this.handlers.onAction?.({ kind: 'stabilize', targetId: caido.id }),
        'Ação: teste de Medicina CD 10. Impede a morte, não cura.',
      ));
    }

    this.actionBar.append(el('span', { class: 'sep' }));
    this.actionBar.append(btn('🏃 Disparada', { disabled: c.actionUsed }, () => this.handlers.onAction?.({ kind: 'dash' })));
    this.actionBar.append(btn('🛡 Esquivar', { disabled: c.actionUsed }, () => this.handlers.onAction?.({ kind: 'dodge' })));
    this.actionBar.append(btn('↩ Desengajar', { disabled: c.actionUsed }, () => this.handlers.onAction?.({ kind: 'disengage' })));
    this.actionBar.append(el('button', { class: 'act end', onclick: () => this.handlers.onEndTurn?.() }, '✔ Terminar turno'));
  }
}
