// Receitas visuais: o que cada arma e cada magia MOSTRAM.
//
// `fx.js` tem o vocabulário (arco, estocada, pilar, chamas…). Aqui ficam as
// frases. Separar os dois significa que inventar uma magia nova é escrever uma
// receita de cinco linhas, sem tocar no motor de desenho.
//
// Cada receita devolve o atraso, em segundos, até o golpe "chegar" no alvo.
// `main.js` usa esse número para segurar o número de dano e o clarão.

import { audio, hitSoundFor, spellSoundFor } from '../core/audio.js';

/** Ângulo na TELA entre dois quadrados — já leva a rotação da câmera em conta. */
function screenAngle(board, from, to) {
  const a = board.centerF(from.x, from.y);
  const b = board.centerF(to.x, to.y);
  return Math.atan2(b.sy - a.sy, b.sx - a.sx);
}

// ---------------------------------------------------------------- armas

const WEAPON_VISUALS = {
  // Corte largo: espada, cimitarra, machado.
  sword: (board, { attacker, target, critical }) => {
    const ang = screenAngle(board, attacker.pos, target.pos);
    board.fx.lunge(attacker, target.pos, 0.26);
    return {
      delay: 0.15,
      onHit: () => {
        board.fx.slash(target.pos, { color: critical ? '#ffe14d' : '#ffffff', sweep: 1.1, radius: 26, width: critical ? 6 : 4 });
        board.fx.slash(target.pos, { color: '#ffffff', sweep: 0.8, radius: 18, width: 2, angle: ang + 0.4, dur: 0.18 });
      },
    };
  },

  // Estocada: dois toques rápidos, curtos. Adaga e espada curta.
  dagger: (board, { attacker, target }) => {
    const ang = screenAngle(board, attacker.pos, target.pos);
    board.fx.lunge(attacker, target.pos, 0.2, 0.5);
    return {
      delay: 0.12,
      onHit: () => {
        board.fx.stab(target.pos, { angle: ang, length: 28 });
        setTimeout(() => board.fx.stab(target.pos, { angle: ang + 0.3, length: 22, color: '#ffe9b0' }), 90);
      },
    };
  },

  // Pancada de cima para baixo: maça, bordão, coice. Sacode mais.
  mace: (board, { attacker, target, critical }) => {
    board.fx.hop(attacker, { dur: 0.3, height: 18 });
    board.fx.lunge(attacker, target.pos, 0.3, 0.3);
    return {
      delay: 0.22,
      onHit: () => {
        board.fx.smash(target.pos, { color: '#e8d6a8' });
        board.fx.slash(target.pos, { color: '#fff3d0', sweep: 0.5, radius: 20, width: 6, angle: -1.3 });
        board.bump(critical ? 0.9 : 0.55);
      },
    };
  },

  // Flecha com rastro.
  bow: (board, { attacker, target }) => {
    board.fx.projectile(attacker.pos, target.pos, { style: 'arrow', color: '#ffe9b0', dur: 0.3, arc: 0.7, trail: true });
    return {
      delay: 0.3,
      onHit: () => board.fx.impact(target.pos, { color: '#ffd9a0', count: 7, spread: 34 }),
    };
  },

  // Azagaia girando.
  javelin: (board, { attacker, target }) => {
    board.fx.projectile(attacker.pos, target.pos, { style: 'javelin', color: '#cfd6de', dur: 0.36, arc: 1, spin: true });
    return {
      delay: 0.36,
      onHit: () => board.fx.impact(target.pos, { color: '#d8c7a8', count: 8, spread: 40 }),
    };
  },

  // Mordida: presas fechando.
  bite: (board, { attacker, target, critical }) => {
    board.fx.lunge(attacker, target.pos, 0.24, 0.55);
    return {
      delay: 0.16,
      onHit: () => {
        board.fx.fangs(target.pos, { color: critical ? '#ffd24a' : '#ffffff' });
        board.fx.impact(target.pos, { color: '#b03a3a', count: 8, spread: 36 });
      },
    };
  },

  // Três riscos paralelos.
  claw: (board, { attacker, target }) => {
    const ang = screenAngle(board, attacker.pos, target.pos);
    board.fx.lunge(attacker, target.pos, 0.22, 0.45);
    return {
      delay: 0.14,
      onHit: () => board.fx.claw(target.pos, { angle: ang - 0.4 }),
    };
  },
};

/** Monstro sem `art` declarada: deduz pelo nome do ataque. */
function guessArt(name = '') {
  const n = name.toLowerCase();
  if (n.includes('mordida')) return 'bite';
  if (n.includes('garra')) return 'claw';
  if (n.includes('arco') || n.includes('besta')) return 'bow';
  if (n.includes('azagaia') || n.includes('lança') || n.includes('dardo')) return 'javelin';
  if (n.includes('maça') || n.includes('clava') || n.includes('martelo')) return 'mace';
  if (n.includes('adaga') || n.includes('punhal')) return 'dagger';
  return 'sword';
}

/**
 * Toca som e animação de um ataque com arma.
 * @returns {number} atraso até o impacto, em segundos
 */
export function playWeaponVisual(board, ev) {
  const art = ev.art ?? guessArt(ev.weaponName);
  const recipe = WEAPON_VISUALS[art] ?? WEAPON_VISUALS.sword;
  audio.play(art === 'bow' || art === 'javelin' ? 'swing' : 'swing');

  const { delay, onHit } = recipe(board, ev);

  setTimeout(() => {
    if (!ev.hit) {
      board.floatText(ev.target.pos, 'errou', '#9aa3b2');
      audio.play('miss');
      return;
    }
    onHit();
    board.fx.impact(ev.target.pos, {
      color: ev.critical ? '#ffd24a' : '#ff9a6a',
      count: ev.critical ? 16 : 8,
      spread: ev.critical ? 68 : 44,
    });
    board.bump(ev.critical ? 0.65 : 0.3);
    audio.play(ev.critical ? 'critical' : hitSoundFor(ev.damageType));
    if (ev.sneak) board.floatText(ev.target.pos, 'furtivo!', '#c7b4ff');
    if (ev.martial) board.floatText(ev.target.pos, 'marcial!', '#ff9a4a');
  }, delay * 1000);

  return delay;
}

// ---------------------------------------------------------------- magias

const SPELL_VISUALS = {
  // Luz do céu desabando sobre o alvo.
  chamaSagrada: (board, { dest }) => {
    board.fx.pillar(dest, { color: '#ffe9a8', dur: 0.55, width: 20, height: 200 });
    setTimeout(() => {
      board.fx.ring(dest, { color: '#fff3c8', radius: 44, dur: 0.45 });
      board.fx.motes(dest, { color: '#ffe9a8', count: 8, rise: 34, dur: 0.5 });
    }, 200);
    return 0.26;
  },

  // Bola de fogo com rastro, que vira labareda no impacto.
  raioDeFogo: (board, { caster, dest }) => {
    board.fx.projectile(caster.pos, dest, { style: 'orb', color: '#ff7a3a', dur: 0.3, arc: 0.3, trail: true });
    return 0.3;
  },

  // Lasca de gelo que estilhaça.
  raioDeGelo: (board, { caster, dest }) => {
    board.fx.projectile(caster.pos, dest, { style: 'shard', color: '#bfe9ff', dur: 0.28, arc: 0.15, trail: true });
    return 0.28;
  },

  // Três dardos em sequência, cada um com seu estouro.
  misselMagico: (board, { caster, dest, spell }) => {
    const darts = spell.darts ?? 3;
    for (let i = 0; i < darts; i++) {
      setTimeout(() => {
        board.fx.projectile(caster.pos, dest, { style: 'orb', color: '#b98cff', dur: 0.24, arc: 0.9 + i * 0.25, trail: true });
        setTimeout(() => board.fx.impact(dest, { color: '#b98cff', count: 5, spread: 26, dur: 0.3 }), 240);
      }, i * 110);
    }
    return 0.24 + (darts - 1) * 0.11;
  },

  // Cone de fogo: as chamas acendem de perto para longe.
  maosFlamejantes: (board, { caster, dest, areaTiles }) => {
    const tiles = areaTiles ?? [dest];
    board.fx.area(tiles, { color: '#ff7a3a', dur: 0.55 });
    for (const t of tiles) {
      const d = Math.max(Math.abs(t.x - caster.pos.x), Math.abs(t.y - caster.pos.y));
      setTimeout(() => board.fx.flames(t, { color: '#ff6a2a', count: 4, dur: 0.5 }), d * 55);
    }
    return 0.22;
  },

  // Névoa roxa e um "z" subindo de cada quadrado.
  sono: (board, { areaTiles, dest }) => {
    const tiles = areaTiles ?? [dest];
    board.fx.area(tiles, { color: '#8f7ad8', dur: 0.8 });
    tiles.slice(0, 10).forEach((t, i) => {
      setTimeout(() => board.fx.glyph(t, { text: 'z', color: '#c7b4ff', dur: 0.9, size: 18 }), i * 70);
    });
    return 0.3;
  },

  // Cura por toque: pontos de luz subindo e uma argola.
  curarFerimentos: (board, { dest }) => {
    board.fx.ring(dest, { color: '#6ee89a', radius: 34, dur: 0.6, width: 3 });
    board.fx.motes(dest, { color: '#9ff0b8', count: 12, rise: 50, dur: 0.75 });
    board.fx.halo(dest, { color: '#9ff0b8', dur: 0.6, radius: 14 });
    return 0.14;
  },

  // Cura à distância: um fio de luz chega antes dos pontos.
  palavraCurativa: (board, { caster, dest }) => {
    board.fx.beam(caster.pos, dest, { color: '#9ff0b8', dur: 0.3, width: 2, jagged: false });
    setTimeout(() => board.fx.motes(dest, { color: '#9ff0b8', count: 9, rise: 44, dur: 0.6 }), 180);
    return 0.2;
  },

  // Bênção: argola dourada sobre cada abençoado.
  bencao: (board, { caster }, targets = []) => {
    board.fx.ring(caster.pos, { color: '#ffe9a8', radius: 72, dur: 0.75, width: 2 });
    for (const t of targets) {
      board.fx.halo(t.pos, { color: '#ffe9a8', dur: 0.9, radius: 17 });
      board.fx.motes(t.pos, { color: '#ffe9a8', count: 6, rise: 36, dur: 0.7 });
    }
    return 0;
  },
};

/** Como cada tipo de dano vira labareda, lasca ou estouro no impacto. */
const IMPACT_BY_TYPE = {
  fogo: (board, tile) => board.fx.flames(tile, { color: '#ff6a2a', count: 5, dur: 0.45 }),
  frio: (board, tile) => board.fx.shards(tile, { color: '#bfe9ff', count: 9 }),
  radiante: (board, tile) => board.fx.motes(tile, { color: '#ffe9a8', count: 8, rise: 30, dur: 0.45 }),
  'energético': (board, tile) => board.fx.impact(tile, { color: '#b98cff', count: 8, spread: 36 }),
  raio: (board, tile) => board.fx.impact(tile, { color: '#bfe6ff', count: 10, spread: 50 }),
};

const FALLBACK_COLOR = {
  fogo: '#ff7a3a', frio: '#8fd8ff', radiante: '#ffe9a8',
  'energético': '#b98cff', raio: '#bfe6ff',
};

/**
 * Toca som e animação de uma magia.
 * @returns {number} atraso até o efeito chegar, em segundos
 */
export function playSpellVisual(board, ev) {
  const { caster, spell, target, point, areaTiles } = ev;
  const dest = target?.pos ?? point ?? caster.pos;
  audio.play(spellSoundFor(spell.damageType));

  const recipe = SPELL_VISUALS[spell.id];
  let delay;

  if (recipe) {
    delay = recipe(board, { caster, dest, spell, areaTiles }, ev.buffTargets ?? []);
  } else {
    // Receita genérica, para magia nova que ainda não ganhou a sua.
    const color = FALLBACK_COLOR[spell.damageType] ?? '#c7b4ff';
    if (spell.kind === 'attack' || spell.kind === 'auto') {
      board.fx.projectile(caster.pos, dest, { style: 'orb', color, dur: 0.3, arc: 0.4, trail: true });
      delay = 0.3;
    } else if (spell.kind === 'heal') {
      board.fx.motes(dest, { color: '#9ff0b8', count: 10, rise: 44 });
      delay = 0.15;
    } else {
      if (areaTiles?.length) board.fx.area(areaTiles, { color });
      else board.fx.ring(dest, { color, radius: 40 });
      delay = 0.22;
    }
  }

  // Impacto conforme a natureza, para quem causa dano.
  if (spell.damage && spell.kind !== 'heal' && spell.kind !== 'buff') {
    const impact = IMPACT_BY_TYPE[spell.damageType];
    const tiles = spell.shape ? (areaTiles ?? [dest]) : [dest];
    setTimeout(() => {
      for (const t of tiles.slice(0, 12)) {
        if (impact) impact(board, t);
        else board.fx.impact(t, { color: FALLBACK_COLOR[spell.damageType] ?? '#ffffff', count: 6 });
      }
      board.bump(0.25);
    }, delay * 1000);
  }

  return delay;
}
