// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// Atributos, modificadores, perícias e proficiência.

import { d20 } from '../core/dice.js';

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

/**
 * Metade da proficiência em teste de atributo SEM proficiência: Pau pra Toda Obra do bardo (metade, para baixo, em
 * qualquer teste) e Atleta Notável do Campeão (metade, para CIMA, em teste de FOR, DES ou CON). Quem tem os dois
 * fica com o maior; nenhum soma com o outro.
 */
export function meiaProficiencia(actor, ability) {
  const f = actor.features;
  if (!f?.length) return 0;
  const prof = proficiencyBonus(actor.level);
  let meia = 0;
  if (f.includes('jackOfAllTrades')) meia = Math.floor(prof / 2);
  if (f.includes('remarkableAthlete') && ['str', 'dex', 'con'].includes(ability)) meia = Math.max(meia, Math.ceil(prof / 2));
  return meia;
}

/**
 * Bônus de um teste de perícia.
 *
 * `contexto` diz SOBRE O QUÊ é o teste, para os traços que só valem num assunto: Tino para Pedras do anão (`'pedra'`) e
 * Saber do Artífice do gnomo das rochas (`'itemMagico'`) tratam o teste de História como treinado e somam o DOBRO da
 * proficiência. Sem contexto, não valem.
 */
export function skillBonus(actor, skill, { contexto = null, bioma = null } = {}) {
  const ability = SKILLS[skill];
  const base = abilityMod(actor.abilities[ability]);
  const prof = proficiencyBonus(actor.level);
  // Passo sem Rastro: +10 em Furtividade (`conditions.js`, `semRastro`).
  const rastro = skill === 'furtividade' && actor.conditions?.some((c) => c.id === 'semRastro') ? 10 : 0;
  // Reviver os Mortos: a conta de quem voltou pesa em TODO teste de perícia, e
  // por isso mora aqui — é por este ponto que passam a iniciativa, a
  // Furtividade, a Sobrevivência, os testes dos capítulos e as previsões.
  const volta = -(penalidadeDeQuemVoltou(actor));
  const f = actor.features;
  if (skill === 'historia' && f?.length
    && ((contexto === 'pedra' && f.includes('stonecunning')) || (contexto === 'itemMagico' && f.includes('artificersLore')))) {
    return base + prof * 2 + rastro + volta;
  }
  if (actor.expertise?.includes(skill)) return base + prof * 2 + rastro + volta;
  // EXPLORADOR NATURAL (patrulheiro): num terreno favorito, o teste de INT ou SAB em que é treinado soma o DOBRO da proficiência.
  if (bioma && f?.includes('naturalExplorer') && actor.terrenosFavoritos?.includes(bioma) && ['int', 'wis'].includes(ability) && actor.skills?.includes(skill)) {
    return base + prof * 2 + rastro + volta;
  }
  if (actor.skills?.includes(skill)) return base + prof + rastro + volta;
  return base + meiaProficiencia(actor, ability) + rastro + volta;
}

/** O personagem soma a proficiência a esta perícia? (treinado ou com especialização) */
export const treinadoEm = (actor, skill) => Boolean(actor.skills?.includes(skill) || actor.expertise?.includes(skill));

/**
 * As passivas que mexem no DADO ou no TOTAL de um teste de atributo, depois da rolagem:
 *   Sorte (halfling)         um 1 natural é rolado de novo, e vale o novo;
 *   Talento Confiável (ladino, 11º)  num teste COM proficiência, d20 de 9 ou menos conta como 10;
 *   Poder Indomável (bárbaro, 18º)   teste de FOR abaixo do valor de Força vale o valor de Força.
 * Devolve a rolagem nova; `passivas` lista o que agiu (vazio = nada mudou).
 */
export function ajustarTeste(rng, actor, r, bonus, { ability, treinada = false } = {}) {
  const f = actor.features;
  if (!f?.length) return r;
  let out = r;
  const passivas = [];
  if (out.natural === 1 && f.includes('lucky')) {
    const novo = rng.die(20);
    out = { ...out, natural: novo, total: novo + bonus, rolls: [...out.rolls, novo] };
    passivas.push('Sorte');
  }
  if (treinada && f.includes('reliableTalent') && out.natural < 10) {
    out = { ...out, natural: 10, total: 10 + bonus };
    passivas.push('Talento Confiável');
  }
  if (ability === 'str' && f.includes('indomitableMight') && out.total < (actor.abilities?.str ?? 0)) {
    out = { ...out, total: actor.abilities.str };
    passivas.push('Poder Indomável');
  }
  return passivas.length ? { ...out, passivas } : out;
}

/**
 * Rola um teste de perícia com tudo que a ficha tem: o bônus (`skillBonus`, com `contexto`) e as passivas do dado
 * (`ajustarTeste`). É o que os capítulos chamam no lugar de `d20(rng, skillBonus(...))`, para que Sorte, Talento Confiável
 * e Poder Indomável valham também fora do combate. Devolve o mesmo formato do `d20`.
 */
export function rolarPericia(rng, actor, skill, opts = {}) {
  const { contexto = null, bonusExtra = 0, bioma = null, inimigo = null, ...d20opts } = opts;
  const bonus = skillBonus(actor, skill, { contexto, bioma }) + bonusExtra;
  // MARÉS DO CAOS (feiticeiro da Magia Selvagem): vantagem no próximo teste também; o uso se gasta.
  // OLHO DO CAOS (surto): vantagem em Percepção.
  if (skill === 'percepcao' && actor?.conditions?.some((c) => c.id === 'olhoDoCaos')) d20opts.advantage = true;
  const mare = actor?.conditions?.find((c) => c.id === 'maresDoCaos');
  if (mare) {
    d20opts.advantage = true;
    actor.conditions = actor.conditions.filter((c) => c !== mare);
  }
  // INIMIGO FAVORITO (patrulheiro): vantagem em Sobrevivência para rastrear e em testes de INT para lembrar do que se sabe dele.
  if (inimigo && actor.features?.includes('favoredEnemy') && actor.inimigosFavoritos?.includes(inimigo)
    && (skill === 'sobrevivencia' || SKILLS[skill] === 'int')) d20opts.advantage = true;
  const r = d20(rng, bonus, d20opts);
  return ajustarTeste(rng, actor, r, bonus, { ability: SKILLS[skill], treinada: treinadoEm(actor, skill) });
}

/**
 * A penalidade de quem voltou dos mortos, em número positivo (0 se não voltou).
 * Lida direto de `actor.conditions` para este módulo não importar nada.
 */
export function penalidadeDeQuemVoltou(actor) {
  return actor?.conditions?.find((c) => c.id === 'revivido')?.data?.penalidade ?? 0;
}

/**
 * O personagem soma a proficiência a esta resistência? Pela classe (`saves`), pela ALMA DE DIAMANTE (monge, 14º: em TODAS)
 * ou pela MENTE ESCORREGADIA (ladino, 15º: em Sabedoria).
 */
export function temProficienciaNaResistencia(actor, ability) {
  if (actor.saves?.includes(ability)) return true;
  const f = actor.features;
  return Boolean(f?.includes('diamondSoul') || (ability === 'wis' && f?.includes('slipperyMind')));
}

/** Bônus de um teste de resistência. */
export function saveBonus(actor, ability) {
  const base = abilityMod(actor.abilities[ability]);
  // PEDRA DO TRANSMUTADOR (mago de Transmutação): proficiência em resistência de Constituição.
  const daPedra = ability === 'con' && actor.features?.includes('stoneConSave');
  return temProficienciaNaResistencia(actor, ability) || daPedra ? base + proficiencyBonus(actor.level) : base;
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
