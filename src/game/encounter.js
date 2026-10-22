// Definição do encontro, separada do código que o monta.
//
// Fica aqui porque DUAS coisas precisam dela: o jogo e o simulador de
// balanceamento (`dev/balance.js`). Se o mapa e a lista de inimigos morassem
// dentro de main.js, cada ajuste de equilíbrio exigiria mexer em dois lugares —
// e os dois sairiam do lugar.
//
// É também o primeiro passo na direção de campanha como dados.

import { makeMonster } from '../rules/monsters.js';

// '.' chão · '#' parede · '~' terreno difícil · 'o' cobertura · '1'..'9' elevação
//
// O paredão central (x7–9, y4–6) existe porque, sem ele, os dois lados se veem
// do primeiro quadrado e o combate vira troca de tiros de 24 m.
//
// O platô do canto superior direito é onde os goblins se posicionam. Subir
// custa o dobro (escalada, pelo SRD), quem está em cima tem cobertura contra
// quem está embaixo, e o platô corta a linha de visão de quem está atrás dele.
export const MAP = [
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

/** Guerreira na frente, mago atrás — o posicionamento inicial já ensina. */
export const PARTY_SPOTS = [
  { x: 3, y: 9 }, { x: 2, y: 10 }, { x: 2, y: 9 }, { x: 1, y: 10 },
];

/**
 * Inimigos presentes desde o começo.
 *
 * Orçamento pelo DMG, para 4 personagens de 2º nível:
 *   fácil 200 · médio 400 · difícil 600 · mortal 800 (XP ajustado)
 */
export function buildFoes() {
  const foes = [
    makeMonster('goblinChefe', { x: 12, y: 2 }),
    // O goblin fica COLADO no chefe de propósito: Redirecionar Ataque só
    // funciona com um capanga adjacente. Sem ele, a reação do chefe é letra
    // morta e o grupo nunca descobre que ela existe.
    makeMonster('goblin', { x: 12, y: 1 }, { nameSuffix: 'A' }),
    // O hobgoblin vai na frente, no chão: CA 18 faz dele o melhor bloqueador,
    // e é ele que o grupo encontra primeiro ao contornar o paredão.
    makeMonster('hobgoblin', { x: 10, y: 2 }, { nameSuffix: 'A' }),
    makeMonster('lobo', { x: 11, y: 6 }, { nameSuffix: 'cinzento' }),
  ];
  for (const f of foes) f.facingVec = { dx: -1, dy: 1 };
  return foes;
}

/**
 * Reforços: chegam depois, pela borda do mapa.
 *
 * Existem porque, com iniciativa por lado, o grupo que vence a iniciativa
 * despacha metade do inimigo antes de qualquer um deles agir. Um bando que
 * chega na rodada 2 e outro na 4 impedem o combate de ser decidido na abertura
 * e dão forma ao encontro: aguentar, respirar, aguentar de novo.
 */
export const REINFORCEMENTS = [
  {
    round: 3,
    aviso: 'Mais goblins vêm pela trilha!',
    spawn: [
      { id: 'goblin', at: { x: 14, y: 8 }, nameSuffix: 'C' },
      { id: 'goblin', at: { x: 14, y: 9 }, nameSuffix: 'D' },
    ],
  },
];

/** Monta os reforços de uma rodada, ou null se não houver. */
export function reinforcementsFor(round) {
  const wave = REINFORCEMENTS.find((w) => w.round === round);
  if (!wave) return null;
  const units = wave.spawn.map((s) => {
    const m = makeMonster(s.id, s.at, { nameSuffix: s.nameSuffix });
    m.facingVec = { dx: -1, dy: 1 };
    return m;
  });
  return { aviso: wave.aviso, units };
}
