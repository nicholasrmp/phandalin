// SRD 5.2 (CC-BY-4.0) — ver NOTICE.md
// Blocos de estatística do SRD. Nada de monstro fora do SRD aqui
// (beholder, mind flayer e afins são IP exclusiva e estão fora).

import { proficiencyBonus } from './abilities.js';

export const MONSTERS = {
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    look: 'goblin',
    size: 'pequeno',
    level: 1,
    cr: '1/4',
    xp: 50,
    abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
    ac: 15,
    acNote: 'armadura de couro, escudo',
    maxHp: 7,
    speedFt: 30,
    skills: ['furtividade'],
    attacks: [
      { name: 'Cimitarra', bonus: 4, damage: '1d6+2', type: 'cortante', reachFt: 5, art: 'sword' },
      { name: 'Arco curto', bonus: 4, damage: '1d6+2', type: 'perfurante', ranged: true, rangeFt: 80, longRangeFt: 320, art: 'bow' },
    ],
    traits: ['nimbleEscape'],
    blurb: 'Fraco sozinho, cruel em bando. Escapa com ação bônus.',
  },

  goblinChefe: {
    id: 'goblinChefe',
    name: 'Chefe Goblin',
    look: 'goblinBoss',
    size: 'pequeno',
    level: 3,
    cr: '1',
    xp: 200,
    abilities: { str: 10, dex: 14, con: 10, int: 10, wis: 8, cha: 10 },
    ac: 17,
    acNote: 'camisão de malha, escudo',
    maxHp: 21,
    speedFt: 30,
    skills: ['furtividade'],
    attacks: [
      { name: 'Cimitarra', bonus: 4, damage: '1d6+2', type: 'cortante', reachFt: 5, art: 'sword' },
      { name: 'Azagaia', bonus: 4, damage: '1d6+2', type: 'perfurante', ranged: true, rangeFt: 30, longRangeFt: 120, art: 'javelin' },
    ],
    // Dois ataques; o segundo com desvantagem.
    multiattack: { count: 2, secondAtDisadvantage: true },
    traits: ['nimbleEscape', 'redirectAttack'],
    blurb: 'Dois ataques por turno e desvia golpes para um capanga ao lado.',
  },

  hobgoblin: {
    id: 'hobgoblin',
    name: 'Hobgoblin',
    look: 'hobgoblin',
    size: 'médio',
    level: 2,
    cr: '1/2',
    xp: 100,
    abilities: { str: 13, dex: 12, con: 12, int: 10, wis: 10, cha: 9 },
    ac: 18,
    acNote: 'cota de malha, escudo',
    maxHp: 11,
    speedFt: 30,
    attacks: [
      { name: 'Espada longa', bonus: 3, damage: '1d8+1', type: 'cortante', reachFt: 5, art: 'sword' },
      { name: 'Arco longo', bonus: 3, damage: '1d8+1', type: 'perfurante', ranged: true, rangeFt: 150, longRangeFt: 600, art: 'bow' },
    ],
    traits: ['martialAdvantage'],
    blurb: 'CA 18 e Vantagem Marcial: +2d6 se um aliado dele estiver colado no seu alvo. Pune quem se amontoa.',
  },

  lobo: {
    id: 'lobo',
    name: 'Lobo',
    look: 'wolf',
    size: 'médio',
    level: 1,
    cr: '1/4',
    xp: 50,
    abilities: { str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6 },
    ac: 13,
    acNote: 'pelo natural',
    maxHp: 11,
    speedFt: 40,
    skills: ['percepcao', 'furtividade'],
    attacks: [
      {
        name: 'Mordida', bonus: 4, damage: '2d4+2', type: 'perfurante', reachFt: 5, art: 'bite',
        onHit: { save: 'str', dc: 11, condition: 'caido', note: 'derruba se falhar' },
      },
    ],
    traits: ['packTactics'],
    blurb: 'Táticas de Matilha: vantagem quando um aliado está colado no alvo. Rápido.',
  },
};

export const TRAIT_INFO = {
  nimbleEscape: { name: 'Escapada Ágil', desc: 'Desengajar ou Esconder-se como ação bônus.' },
  packTactics: { name: 'Táticas de Matilha', desc: 'Vantagem no ataque se um aliado estiver a até 1,5 m do alvo.' },
  redirectAttack: { name: 'Redirecionar Ataque', desc: 'Reação: troca de lugar com um goblin adjacente e o ataque passa a mirá-lo.' },
  martialAdvantage: { name: 'Vantagem Marcial', desc: 'Uma vez por turno, +2d6 de dano se um aliado não incapacitado estiver a até 1,5 m do alvo.' },
};

let serial = 0;

/** Instancia um monstro como combatente. */
export function makeMonster(id, pos, { rng = null, nameSuffix = '' } = {}) {
  const def = MONSTERS[id];
  if (!def) throw new Error(`Monstro desconhecido: "${id}"`);
  // PV podem ser fixos (médio do SRD) ou rolados, se vier um rng.
  const maxHp = def.maxHp;
  return {
    id: `${id}-${++serial}`,
    defId: id,
    kind: 'npc',
    side: 'foes',
    name: def.name + (nameSuffix ? ` ${nameSuffix}` : ''),
    look: def.look,
    level: def.level,
    abilities: { ...def.abilities },
    proficiency: proficiencyBonus(def.level),
    saves: [],
    skills: def.skills ?? [],
    ac: def.ac,
    maxHp,
    hp: maxHp,
    tempHp: 0,
    speedFt: def.speedFt,
    attacks: def.attacks,
    multiattack: def.multiattack ?? null,
    traits: def.traits ?? [],
    conditions: [],
    pos: { ...pos },
    deathSaves: { successes: 0, failures: 0 },
    stable: false,
    dead: false,
    xp: def.xp,
    blurb: def.blurb,
  };
}
