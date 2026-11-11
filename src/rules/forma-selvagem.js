// A FORMA SELVAGEM do druida (PHB 2014): transforma-se numa fera que ele já viu.
//
// O que o motor faz, de verdade:
//   - os valores de FOR, DES e CON, os PV, a CA, o deslocamento, os ataques e os traços passam a ser os da fera; INT, SAB, CAR, perícias
//     e resistências continuam os do druida;
//   - os PV da fera acabam: o druida volta à forma normal com os PV que tinha, e o dano que sobrou desconta deles;
//   - sem Magias Bestiais (18º), não se conjura na forma de fera;
//   - os limites de ND, de voo e de natação vêm do nível (`limitesDaForma`).
// O que o motor aproxima: o livro dá horas de duração (metade do nível); aqui a forma acaba quando a luta termina. E só as bestas que o
// jogo tem (`FERAS`) existem como forma.

import { makeMonster, MONSTERS } from './monsters.js';

/** ND em número: '1/4' → 0.25. */
export const crEmNumero = (cr) => {
  if (typeof cr === 'number') return cr;
  const [a, b] = String(cr ?? '0').split('/').map(Number);
  return b ? a / b : a;
};

/** Quanto a Forma Selvagem deixa, por nível do druida: ND máximo e se a fera pode voar ou nadar. */
export function limitesDaForma(nivel, lua = false) {
  // CÍRCULO DA LUA (Formas do Círculo, 2º): o ND máximo é nível ÷ 3 (mínimo 1) em vez da tabela; voo e nado seguem a tabela.
  if (lua && nivel >= 2) return { cr: Math.max(1, Math.floor(nivel / 3)), voo: nivel >= 8, nado: nivel >= 4 };
  if (nivel >= 8) return { cr: 1, voo: true, nado: true };
  if (nivel >= 4) return { cr: 0.5, voo: false, nado: true };
  if (nivel >= 2) return { cr: 0.25, voo: false, nado: false };
  return { cr: -1, voo: false, nado: false };
}

/** As bestas que o druida de `nivel` pode ser. Familiares e bestas de ND 0 ficam de fora. */
export function formasDisponiveis(nivel, lua = false) {
  const lim = limitesDaForma(nivel, lua);
  return Object.values(MONSTERS)
    .filter((m) => m.tipo === 'fera' && !/Familiar$/i.test(m.id) && crEmNumero(m.cr) > 0)
    .filter((m) => crEmNumero(m.cr) <= lim.cr)
    .filter((m) => lim.voo || !(m.speeds?.flyFt > 0))
    .filter((m) => lim.nado || !(m.speeds?.swimFt > 0))
    .map((m) => m.id);
}

const CAMPOS_DA_FORMA = ['attacks', 'multiattack', 'traits', 'speedFt', 'speeds', 'look', 'size', 'resist', 'senses', 'aparencias', 'lookBase'];

/** Veste a fera no druida. Devolve false se não pode (sem usos, nível, fera proibida). */
// `livre`: quem veste é a MAGIA (a Metamorfose, as Formas Animais, a Transformação), não a Forma Selvagem — a lista de
// formas do druida não vale, e a magia escolhe a dela.
export function vestirFera(c, feraId, { livre = false } = {}) {
  if (c.formaSelvagem) return false;
  if (!livre && !formasDisponiveis(c.level ?? 1, c.features?.includes('circleForms')).includes(feraId)) return false;
  const m = makeMonster(feraId, { x: 0, y: 0 });
  const original = {
    abilities: { ...c.abilities }, hp: c.hp, maxHp: c.maxHp, ac: c.ac, tempHp: c.tempHp,
    weapons: c.weapons, equippedWeapon: c.equippedWeapon,
  };
  for (const k of CAMPOS_DA_FORMA) original[k] = c[k];
  c.formaSelvagem = { feraId, nome: m.name, original, ac: m.ac };
  c.abilities = { ...c.abilities, str: m.abilities.str, dex: m.abilities.dex, con: m.abilities.con };
  c.hp = m.maxHp; c.maxHp = m.maxHp; c.ac = m.ac; c.tempHp = 0;
  for (const k of CAMPOS_DA_FORMA) c[k] = m[k] === undefined ? undefined : structuredClone(m[k]);
  c.weapons = undefined; // `weapons` indefinido faz a barra de ações ler os golpes da fera (`attacks`)
  c.equippedWeapon = undefined;
  return true;
}

/**
 * Tira a fera. `excesso` é o dano que sobrou depois de zerar os PV da fera: desconta dos PV do druida. Devolve o excesso aplicado.
 */
export function despirFera(c, excesso = 0) {
  const f = c.formaSelvagem;
  if (!f) return 0;
  const o = f.original;
  c.abilities = o.abilities;
  c.maxHp = o.maxHp; c.ac = o.ac; c.tempHp = o.tempHp;
  for (const k of CAMPOS_DA_FORMA) c[k] = o[k];
  c.weapons = o.weapons; c.equippedWeapon = o.equippedWeapon;
  c.hp = Math.max(0, o.hp - excesso);
  c.formaSelvagem = null;
  return excesso;
}
