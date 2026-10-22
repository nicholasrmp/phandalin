// SRD 5.2 (CC-BY-4.0) — ver NOTICE.md
// Magias. Declarativas: o motor de combate lê o `kind` e resolve.
//
//   attack  jogada de ataque mágico contra a CA
//   save    teste de resistência do alvo contra a CD do conjurador
//   auto    acerta sem rolagem (míssil mágico)
//   heal    cura
//   buff    aplica condição em aliados
//   sleep   regra própria: soma de PV derrubados

export const SPELLS = {
  chamaSagrada: {
    id: 'chamaSagrada', name: 'Chama Sagrada', icon: '🔆', level: 0, school: 'evocação',
    castTime: 'action', rangeFt: 60, kind: 'save', save: 'dex',
    damage: '1d8', damageType: 'radiante', halfOnSave: false, ignoresCover: true,
    desc: 'Luz do céu cai sobre a criatura. CD de DES ou 1d8 radiante. Cobertura não ajuda.',
  },
  raioDeFogo: {
    id: 'raioDeFogo', name: 'Raio de Fogo', icon: '🔥', level: 0, school: 'evocação',
    castTime: 'action', rangeFt: 120, kind: 'attack',
    damage: '1d10', damageType: 'fogo',
    desc: 'Dardo de fogo. Ataque mágico à distância, 1d10 de fogo.',
  },
  raioDeGelo: {
    id: 'raioDeGelo', name: 'Raio de Gelo', icon: '❄️', level: 0, school: 'evocação',
    castTime: 'action', rangeFt: 60, kind: 'attack',
    damage: '1d8', damageType: 'frio', applies: { condition: 'lento', rounds: 1 },
    desc: 'Feixe gélido. 1d8 de frio e o alvo fica 3 m mais lento até o fim do próximo turno dele.',
  },
  misselMagico: {
    id: 'misselMagico', name: 'Míssil Mágico', icon: '✴️', level: 1, school: 'evocação',
    castTime: 'action', rangeFt: 120, kind: 'auto',
    darts: 3, damage: '1d4+1', damageType: 'energético',
    desc: 'Três dardos que nunca erram, 1d4+1 cada. Podem ir no mesmo alvo ou em alvos diferentes.',
  },
  maosFlamejantes: {
    id: 'maosFlamejantes', name: 'Mãos Flamejantes', icon: '🖐️', level: 1, school: 'evocação',
    castTime: 'action', rangeFt: 0, shape: 'cone', areaFt: 15,
    kind: 'save', save: 'dex', damage: '3d6', damageType: 'fogo', halfOnSave: true,
    desc: 'Cone de 4,5 m. CD de DES, 3d6 de fogo, metade se passar.',
  },
  sono: {
    id: 'sono', name: 'Sono', icon: '💤', level: 1, school: 'encantamento',
    castTime: 'action', rangeFt: 90, shape: 'sphere', areaFt: 20,
    kind: 'sleep', pool: '5d8',
    desc: 'Rola 5d8. Criaturas na área adormecem em ordem crescente de PV atuais, até esgotar o total.',
  },
  curarFerimentos: {
    id: 'curarFerimentos', name: 'Curar Ferimentos', icon: '💚', level: 1, school: 'evocação',
    castTime: 'action', rangeFt: 5, kind: 'heal', heal: '1d8', addSpellMod: true,
    desc: 'Toque que cura 1d8 + modificador de conjuração.',
  },
  palavraCurativa: {
    id: 'palavraCurativa', name: 'Palavra Curativa', icon: '💬', level: 1, school: 'evocação',
    castTime: 'bonus', rangeFt: 60, kind: 'heal', heal: '1d4', addSpellMod: true,
    desc: 'Ação bônus. Cura 1d4 + modificador de conjuração à distância.',
  },
  bencao: {
    id: 'bencao', name: 'Bênção', icon: '✨', level: 1, school: 'encantamento',
    castTime: 'action', rangeFt: 30, kind: 'buff', targets: 3,
    condition: 'abencoado', concentration: true,
    desc: 'Até 3 aliados somam 1d4 em ataques e testes de resistência. Concentração.',
  },
};

export const getSpell = (id) => {
  const s = SPELLS[id];
  if (!s) throw new Error(`Magia desconhecida: "${id}"`);
  return s;
};

/** Espaços de magia por nível de conjurador pleno (SRD). Índice = nível da magia. */
export const SLOTS_BY_LEVEL = {
  1: [0, 2],
  2: [0, 3],
  3: [0, 4, 2],
  4: [0, 4, 3],
  5: [0, 4, 3, 2],
};

export function slotsFor(level) {
  return (SLOTS_BY_LEVEL[level] ?? SLOTS_BY_LEVEL[1]).slice();
}
