// Goblinoides: goblin, hobgoblin, bugbear e seus chefes.
// SRD 5.2 (CC-BY-4.0) — ver NOTICE.md e ELENCO.md.
//
// Regra dura: nada aqui pode ser bloco de monstro que não esteja no SRD. Se a
// criatura é do módulo publicado e não está no SRD, ela vira criatura NOSSA,
// com nome e números nossos, marcada `fonte: 'propria'`. Chutar atribuição de
// SRD num bloco que não é SRD é o pior erro possível neste projeto.
//
// `TRAITS` deste arquivo é somado ao dicionário de traços em `../monsters.js`.

export const GOBLINOIDES = {

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

};

/** Traços novos desta família, somados ao dicionário geral. */
export const TRAITS = {
};
