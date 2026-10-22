// SRD 5.2 (CC-BY-4.0) — ver NOTICE.md
// Atributos, modificadores, perícias e proficiência.

export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const ABILITY_NAME = {
  str: 'Força', dex: 'Destreza', con: 'Constituição',
  int: 'Inteligência', wis: 'Sabedoria', cha: 'Carisma',
};

/** Modificador = (valor − 10) arredondado para baixo pela metade. */
export const abilityMod = (score) => Math.floor((score - 10) / 2);

/** Bônus de proficiência por nível (SRD: +2 do 1º ao 4º). */
export const proficiencyBonus = (level) => 2 + Math.floor((Math.max(1, level) - 1) / 4);

export const SKILLS = {
  acrobacia: 'dex', arcanismo: 'int', atletismo: 'str', atuacao: 'cha',
  enganacao: 'cha', furtividade: 'dex', historia: 'int', intimidacao: 'cha',
  intuicao: 'wis', investigacao: 'int', lidarComAnimais: 'wis', medicina: 'wis',
  natureza: 'int', percepcao: 'wis', persuasao: 'cha', prestidigitacao: 'dex',
  religiao: 'int', sobrevivencia: 'wis',
};

export const SKILL_NAME = {
  acrobacia: 'Acrobacia', arcanismo: 'Arcanismo', atletismo: 'Atletismo',
  atuacao: 'Atuação', enganacao: 'Enganação', furtividade: 'Furtividade',
  historia: 'História', intimidacao: 'Intimidação', intuicao: 'Intuição',
  investigacao: 'Investigação', lidarComAnimais: 'Lidar com Animais',
  medicina: 'Medicina', natureza: 'Natureza', percepcao: 'Percepção',
  persuasao: 'Persuasão', prestidigitacao: 'Prestidigitação',
  religiao: 'Religião', sobrevivencia: 'Sobrevivência',
};

/** Bônus de um teste de perícia. */
export function skillBonus(actor, skill) {
  const ability = SKILLS[skill];
  const base = abilityMod(actor.abilities[ability]);
  const prof = proficiencyBonus(actor.level);
  if (actor.expertise?.includes(skill)) return base + prof * 2;
  if (actor.skills?.includes(skill)) return base + prof;
  return base;
}

/** Bônus de um teste de resistência. */
export function saveBonus(actor, ability) {
  const base = abilityMod(actor.abilities[ability]);
  return actor.saves?.includes(ability) ? base + proficiencyBonus(actor.level) : base;
}

/** Percepção passiva = 10 + bônus de Percepção. */
export const passivePerception = (actor) => 10 + skillBonus(actor, 'percepcao');

/** CD de magia = 8 + proficiência + modificador de conjuração. */
export function spellSaveDc(actor) {
  if (!actor.spellcasting) return null;
  return 8 + proficiencyBonus(actor.level) + abilityMod(actor.abilities[actor.spellcasting.ability]);
}

/** Bônus de ataque mágico. */
export function spellAttackBonus(actor) {
  if (!actor.spellcasting) return null;
  return proficiencyBonus(actor.level) + abilityMod(actor.abilities[actor.spellcasting.ability]);
}
