// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
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
  // Passo sem Rastro: +10 em Furtividade (`conditions.js`, `semRastro`).
  const rastro = skill === 'furtividade' && actor.conditions?.some((c) => c.id === 'semRastro') ? 10 : 0;
  // Reviver os Mortos: a conta de quem voltou pesa em TODO teste de perícia, e
  // por isso mora aqui — é por este ponto que passam a iniciativa, a
  // Furtividade, a Sobrevivência, os testes dos capítulos e as previsões.
  const volta = -(penalidadeDeQuemVoltou(actor));
  if (actor.expertise?.includes(skill)) return base + prof * 2 + rastro + volta;
  if (actor.skills?.includes(skill)) return base + prof + rastro + volta;
  return base + rastro + volta;
}

/**
 * A penalidade de quem voltou dos mortos, em número positivo (0 se não voltou).
 * Lida direto de `actor.conditions` para este módulo não importar nada.
 */
export function penalidadeDeQuemVoltou(actor) {
  return actor?.conditions?.find((c) => c.id === 'revivido')?.data?.penalidade ?? 0;
}

/** Bônus de um teste de resistência. */
export function saveBonus(actor, ability) {
  const base = abilityMod(actor.abilities[ability]);
  return actor.saves?.includes(ability) ? base + proficiencyBonus(actor.level) : base;
}

/** Percepção passiva = 10 + bônus de Percepção. */
// Cativar: desvantagem em Percepção vale −5 na passiva (SRD, passiva = 10 + bônus, vantagem/desvantagem ±5).
// A Percepção passiva perde 5 com Cativar e outros 5 em marcha depressa
// (`rules/marcha.js`): quem corre pela trilha não repara no capim alto.
// SENTIDOS AGUÇADOS (SRD): vantagem em Percepção que dependa de audição e
// olfato. Em passiva, vantagem são +5. Simplificação assumida: vale para toda
// a passiva da criatura, e não só para o que ela ouve ou cheira — no lobo e na
// coruja-urso é quase tudo, e separar os sentidos pediria um contexto que o
// motor não carrega. Sem isto os traços eram só texto: o blurb do lobo prometia
// que "Furtividade não esconde o grupo dela" e a conta usava 13, não 18 — o
// grupo passava escondido em 48% das vezes em vez de 12%.
const SENTIDOS_AGUCADOS = ['keenHearingSmell', 'keenSmell', 'keenHearing', 'keenSightSmell'];

export const passivePerception = (actor) => 10 + skillBonus(actor, 'percepcao')
  - (actor.conditions?.some((c) => c.id === 'cativado') ? 5 : 0)
  + (actor.traits?.some((t) => SENTIDOS_AGUCADOS.includes(t)) ? 5 : 0)
  + (actor.percepcaoMarcha ?? 0);

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
