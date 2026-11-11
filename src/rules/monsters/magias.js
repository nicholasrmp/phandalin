// AS CRIATURAS QUE AS MAGIAS CONJURAM e que não são criatura de bestiário nenhum: os objetos do Animar Objetos (a
// tabela da magia, por tamanho), a Mão de Bigby e a Espada de Mordenkainen. Os números são os da magia no PHB; a CA, os
// PV e o golpe da mão e da espada dependem de quem conjura e são ajustados na hora (`livro-motor.js pecaConjurada`).
// Não valem XP: nascem invocadas.

const objeto = (id, name, size, maxHp, ac, str, dex, bonus, damage) => ({
  id, tipo: 'constructo', name, look: 'pedregulhoAnimado', fonte: 'phb', size, level: 1, cr: '0', xp: 0,
  abilities: { str, dex, con: 10, int: 3, wis: 3, cha: 1 }, ac, maxHp, hpDice: String(maxHp), speedFt: 30,
  senses: { blindsightFt: 30 }, conditionImmunities: ['enfeiticado', 'amedrontado', 'envenenado', 'paralisado', 'petrificado'],
  damageImmunities: ['veneno', 'psíquico'],
  attacks: [{ name: 'Pancada', bonus, damage, type: 'concussão', reachFt: 5, art: 'mace' }],
  traits: [], blurb: 'Um objeto que a magia pôs de pé para lutar.',
});

import { ESPIRITOS_TCE } from './espiritos-tce.js';

export const INVOCACOES_DE_MAGIA = {
  ...ESPIRITOS_TCE,
  objetoAnimadoMiudo: objeto('objetoAnimadoMiudo', 'Objeto Animado (Miúdo)', 'miúdo', 20, 18, 4, 18, 8, '1d4+4'),
  objetoAnimadoPequeno: objeto('objetoAnimadoPequeno', 'Objeto Animado (Pequeno)', 'pequeno', 25, 16, 6, 14, 6, '1d8+2'),
  objetoAnimadoMedio: objeto('objetoAnimadoMedio', 'Objeto Animado (Médio)', 'médio', 40, 13, 10, 12, 5, '2d6+1'),
  objetoAnimadoGrande: objeto('objetoAnimadoGrande', 'Objeto Animado (Grande)', 'grande', 50, 10, 14, 10, 6, '2d10+2'),
  objetoAnimadoEnorme: objeto('objetoAnimadoEnorme', 'Objeto Animado (Enorme)', 'enorme', 80, 10, 18, 6, 8, '2d12+4'),
  maoDeBigby: {
    id: 'maoDeBigby', tipo: 'constructo', name: 'Mão de Bigby', look: 'pedregulhoAnimado', fonte: 'phb', size: 'grande', level: 1, cr: '0', xp: 0,
    abilities: { str: 26, dex: 10, con: 10, int: 1, wis: 10, cha: 1 }, ac: 20, maxHp: 50, hpDice: '50', speedFt: 60, flyFt: 60, speeds: { flyFt: 60 },
    conditionImmunities: ['enfeiticado', 'amedrontado', 'envenenado', 'paralisado', 'petrificado', 'atordoado', 'inconsciente'],
    damageImmunities: ['veneno', 'psíquico'],
    attacks: [{ name: 'Punho Cerrado', bonus: 7, damage: '4d8', type: 'energético', reachFt: 5, art: 'fist', magico: true }],
    traits: [], blurb: 'Uma mão enorme de força cintilante que soca por quem a conjurou.',
  },
  espadaDeMordenkainen: {
    id: 'espadaDeMordenkainen', tipo: 'constructo', name: 'Espada de Mordenkainen', look: 'espadaVoadora', fonte: 'phb', size: 'médio', level: 1, cr: '0', xp: 0,
    abilities: { str: 10, dex: 10, con: 10, int: 1, wis: 10, cha: 1 }, ac: 30, maxHp: 1, hpDice: '1', speedFt: 20, flyFt: 20, speeds: { flyFt: 20 },
    damageImmunities: ['cortante', 'perfurante', 'concussão', 'fogo', 'frio', 'elétrico', 'trovejante', 'ácido', 'veneno', 'necrótico', 'radiante', 'energético', 'psíquico'],
    conditionImmunities: ['enfeiticado', 'amedrontado', 'envenenado', 'paralisado', 'petrificado', 'atordoado', 'inconsciente', 'caido', 'agarrado', 'contido'],
    attacks: [{ name: 'Golpe da Espada', bonus: 7, damage: '3d10', type: 'energético', reachFt: 5, art: 'sword', magico: true }],
    traits: [], blurb: 'Um plano de força em forma de espada, que nada fere, golpeando por quem a conjurou.',
  },
};
export const TRAITS = {};
