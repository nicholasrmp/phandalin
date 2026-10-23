// Bestiário: o registro de todas as criaturas, montado a partir das famílias.
//
// Está dividido por família para que o elenco cresça sem um arquivo gigante, e
// para que dê para mexer nos mortos-vivos sem encostar nos goblinoides.
// Cada família traz suas criaturas e, se precisar, seus traços novos.
//
// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md e ELENCO.md.

import { proficiencyBonus } from './abilities.js';
import { footprintOf } from '../core/grid.js';
import { GOBLINOIDES, TRAITS as T_GOB } from './monsters/goblinoides.js';
import { HUMANOIDES, TRAITS as T_HUM } from './monsters/humanoides.js';
import { FERAS, TRAITS as T_FER } from './monsters/feras.js';
import { MORTOS_VIVOS, TRAITS as T_MOR } from './monsters/mortosvivos.js';
import { ABERRACOES, TRAITS as T_ABE } from './monsters/aberracoes.js';

export const MONSTERS = {
  ...GOBLINOIDES,
  ...HUMANOIDES,
  ...FERAS,
  ...MORTOS_VIVOS,
  ...ABERRACOES,
};


const TRACOS_BASE = {
  nimbleEscape: { name: 'Escapada Ágil', desc: 'Desengajar ou Esconder-se como ação bônus.' },
  packTactics: { name: 'Táticas de Matilha', desc: 'Vantagem no ataque se um aliado estiver a até 1,5 m do alvo.' },
  redirectAttack: { name: 'Redirecionar Ataque', desc: 'Reação: troca de lugar com um goblin adjacente e o ataque passa a mirá-lo.' },
  martialAdvantage: { name: 'Vantagem Marcial', desc: 'Uma vez por turno, +2d6 de dano se um aliado não incapacitado estiver a até 1,5 m do alvo.' },
};

export const TRAIT_INFO = { ...TRACOS_BASE, ...T_GOB, ...T_HUM, ...T_FER, ...T_MOR, ...T_ABE };

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
    // A pegada viaja DENTRO da posição: assim `distanceFt` e `isAdjacent`
    // medem contra a caixa da criatura sem que nenhum chamador saiba disso.
    pos: { ...pos, f: footprintOf(def.size) },
    deathSaves: { successes: 0, failures: 0 },
    stable: false,
    dead: false,
    xp: def.xp,
    blurb: def.blurb,
    // Estes quatro parecem decoração e não são: a view inteira depende deles.
    // `size` escolhe o andar pesado, `voice` é a voz da criatura, `morte` o
    // jeito de cair e `incorporeo` decide se ela se dissipa. Enquanto não eram
    // copiados, dez vozes, seis andares e quatro mortes já escritos e
    // comentados simplesmente não aconteciam — o esqueleto morria sangrando.
    size: def.size ?? 'médio',
    voice: def.voice ?? null,
    morte: def.morte ?? null,
    andar: def.andar ?? null,
    incorporeo: def.incorporeo ?? false,
    fonte: def.fonte ?? null,
  };
}
