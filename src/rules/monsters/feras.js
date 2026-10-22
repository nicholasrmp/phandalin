// Bestas: lobo, lobo atroz, aranhas, rato e morcego gigantes,
// urso, javali, coruja-urso, stirge.
// SRD 5.2 (CC-BY-4.0) — ver NOTICE.md e ELENCO.md.
//
// Regra dura: nada aqui pode ser bloco de monstro que não esteja no SRD. Se a
// criatura é do módulo publicado e não está no SRD, ela vira criatura NOSSA,
// com nome e números nossos, marcada `fonte: 'propria'`. Chutar atribuição de
// SRD num bloco que não é SRD é o pior erro possível neste projeto.
//
// `TRAITS` deste arquivo é somado ao dicionário de traços em `../monsters.js`.

export const FERAS = {
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

/** Traços novos desta família, somados ao dicionário geral. */
export const TRAITS = {
};
