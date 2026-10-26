// A FAMÍLIA DE UMA MAGIA: o que ela FAZ, e portanto como deve soar ao ser lançada.
//
// Até aqui o som de conjurar vinha só do tipo de dano. Oito timbres, um por tipo
// de dano, e 175 das 204 magias soavam todas iguais. Bênção, Invisibilidade,
// Detectar Magia e Voo eram o mesmo som.
//
// Esta decisão mora aqui, e não em `core/audio.js`, por duas razões. Primeiro,
// é regra, não timbre: classificar Escudo Arcano como proteção e Voo como
// movimento exige ler o `kind` da magia e os campos da condição que ela aplica,
// e `audio.js` não importa nada (é o que o impede de fechar um ciclo). Segundo,
// aqui dá para TESTAR sem som nenhum: a pergunta "toda magia tem família?" não
// precisa de um AudioContext.
//
// A classificação é derivada dos DADOS, e não de uma lista de ids escrita à mão.
// Lista de 204 ids envelhece no dia em que a próxima magia entra; o `kind`, a
// escola e os campos da condição já existem em toda magia nova.
//
// Os dados nem sempre bastam. Quatro magias (Reviver os Mortos, Montaria
// Fantasmagórica, Luz, Visão no Escuro) não têm campo nenhum que as distinga das
// vizinhas: o `kind` delas é genérico e a condição não declara nada mecânico.
// Para esses poucos, a PRÓPRIA magia carrega `familiaSonora` em `spells.js`. É
// um dado declarado na entrada, ao lado do resto da magia, e não uma lista aqui
// dentro; e o teste exige que o valor seja uma família que existe.

import { CONDITIONS } from './conditions.js';

export const FAMILIAS = Object.freeze([
  'dano',       // causa dano: o timbre vem do TIPO (fogo, trovão, psíquico...)
  'sopro',      // a arma de sopro do dragão
  'cura',       // devolve ou restaura vida
  'protecao',   // escudo, resistência, ilusão que desvia
  'reforco',    // bênção, golpe empoderado, vantagem
  'movimento',  // voo, salto, teleporte, velocidade
  'maldicao',   // debuff, marca, encantamento que prende a vontade
  'calma',      // sono, acalmar emoções
  'invocacao',  // traz algo que não estava: criatura, teia, graxa
  'utilidade',  // o resto: detectar, falar, abrir. A ESCOLA dá a cor.
]);

/** As oito escolas, sem acento. Cada uma tem cor própria na utilidade (`core/audio.js`). */
export const ESCOLAS = Object.freeze(['abjuracao', 'adivinhacao', 'conjuracao', 'encantamento', 'evocacao', 'ilusao', 'necromancia', 'transmutacao']);

/**
 * Todo `kind` que existe em `spells.js`. Um kind NOVO cai em utilidade por
 * omissão — e isso é calado. Por isso o teste cobra que cada kind do catálogo
 * esteja numa destas três listas: o autor da magia nova é obrigado a decidir.
 */
export const KINDS_COM_RAMO = Object.freeze([
  'heal', 'healGrupo', 'curaReuso', 'reviver', 'restaurar', 'estabilizar', 'frutos',
  'armadura', 'reacao', 'tempHp', 'teleporte', 'disparada', 'levitar', 'sleep', 'acalmar',
  'invocar', 'animarMortos', 'debuff', 'marca', 'attack', 'buff', 'aura', 'mira', 'ampliar', 'save',
]);
/** Kinds que são utilidade de verdade, e por isso caem nela de propósito. */
export const KINDS_DE_UTILIDADE = Object.freeze(['utilidade', 'rastro', 'dissipar']);
/**
 * Kinds de magia de dano. Chegam à família `dano` só por terem um tipo; se um
 * perder o `damageType`, cairia em utilidade em silêncio. O teste cobra que
 * continuem sendo `dano`.
 */
export const KINDS_DE_DANO = Object.freeze(['auto', 'raios', 'arma', 'calor', 'lamina', 'vampirico']);

const semAcento = (t = '') => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * A escola, sem acento e sem a variação de grafia. Uma magia (Comunhão) está
 * escrita `divinação` em vez de `adivinhação`; as duas são a mesma escola.
 */
export function escolaDe(spell) {
  const e = semAcento(spell?.school);
  return e === 'divinacao' ? 'adivinhacao' : e;
}

// Campos de uma condição que mexem no MOVIMENTO. Vêm de `conditions.js`: é lá
// que a magia diz o que de fato muda em quem a recebe.
const CAMPOS_DE_MOVIMENTO = ['vooFt', 'speedBonusFt', 'speedMult', 'saltoMult', 'soVoa', 'atravessaVao',
  // Liberdade de Movimento é abjuração, mas o que ela dá é movimento: nada
  // reduz o deslocamento, nem terreno difícil, nem agarrão.
  'semTerrenoDificil', 'semReducaoDeDeslocamento', 'soltaDoAgarrao'];
// `escalando` e `piscando` não declaram campo nenhum: são marcadores que o
// motor lê pelo nome. São os dois únicos casos do tipo, e por isso uma lista de
// dois nomes, e não uma regra.
const MOVIMENTO_PELO_NOME = new Set(['escalando', 'piscando']);
const CAMPOS_DE_DEFESA = ['acBonus', 'caMinima', 'resiste', 'resisteTudo', 'resisteNaoMagicoTudo',
  'resisteTipoDado', 'attackedDisadvantage', 'curaMaxima', 'vantagemMorte'];
// Bônus em dado: é o que faz de Bênção e de Resistência um REFORÇO, e não um
// escudo, mesmo quando a magia é de abjuração.
const CAMPOS_DE_BONUS_DE_DADO = ['attackBonusDice', 'saveBonusDice', 'testeBonusDice'];

const temCampo = (cond, campos) => campos.some((c) => cond?.[c]);

function buffDeMovimento(spell) {
  if (MOVIMENTO_PELO_NOME.has(spell.condition)) return true;
  return temCampo(CONDITIONS[spell.condition], CAMPOS_DE_MOVIMENTO);
}

function buffDefensivo(spell) {
  const cond = CONDITIONS[spell.condition];
  if (temCampo(cond, CAMPOS_DE_DEFESA)) return true;
  // Resistência (abjuração) só dá +1d4 num teste de resistência: é o mesmo campo
  // da Bênção, e soa como ela. Abjuração NÃO é sempre proteção.
  if (temCampo(cond, CAMPOS_DE_BONUS_DE_DADO)) return false;
  // Abjuração é a escola da proteção, e as ilusões que desviam (Invisibilidade,
  // Imagem Espelhada, Borrão) protegem escondendo.
  const escola = escolaDe(spell);
  return escola === 'abjuracao' || escola === 'ilusao';
}

/**
 * O tipo do dano da magia. Mora em `damageType` ou, nas magias de zona, em
 * `zona.dano.tipo` (Esfera Flamejante, Raio Lunar, Fome de Hadar) ou
 * `zona.cordao.tipo` (Cordão de Flechas) — campos que o jogo nunca passava ao
 * seletor de som.
 */
export function tipoDoDano(spell) {
  return spell.damageType ?? spell.zona?.dano?.tipo ?? spell.zona?.cordao?.tipo ?? null;
}

/**
 * @returns {{ familia: string, tipo: string|null, escola: string, origem: string|null }}
 *   `tipo` só vale para a família `dano`; `escola` colore a `utilidade`.
 */
export function familiaDaMagia(spell) {
  const escola = escolaDe(spell);
  const base = { tipo: null, escola, origem: spell.origem ?? null };
  const de = (familia) => ({ ...base, familia });

  if (spell.origem === 'sopro') return { ...base, familia: 'sopro', tipo: spell.damageType ?? null };

  // Declarada na própria magia, para os poucos casos que os dados não distinguem.
  if (spell.familiaSonora) return de(spell.familiaSonora);

  const tipo = tipoDoDano(spell);
  if (tipo && tipo !== 'nenhum') return { ...base, familia: 'dano', tipo };

  const k = spell.kind;

  if (['heal', 'healGrupo', 'curaReuso', 'reviver', 'restaurar', 'estabilizar', 'frutos'].includes(k)) return de('cura');
  if (['armadura', 'reacao', 'tempHp'].includes(k)) return de('protecao');
  if (['teleporte', 'disparada', 'levitar'].includes(k)) return de('movimento');
  if (['sleep', 'acalmar'].includes(k)) return de('calma');
  if (['invocar', 'animarMortos'].includes(k)) return de('invocacao');
  if (['debuff', 'marca', 'attack'].includes(k)) return de('maldicao');

  if (k === 'buff') {
    // Movimento antes de defesa: Velocidade tem bônus de CA e é, antes de tudo,
    // velocidade; Liberdade de Movimento é abjuração e é movimento.
    if (buffDeMovimento(spell)) return de('movimento');
    if (buffDefensivo(spell)) return de('protecao');
    return de('reforco');
  }
  if (['aura', 'mira', 'ampliar'].includes(k)) return de('reforco');

  if (k === 'save') {
    // Resistência que deixa uma CONDIÇÃO em quem falha e age sobre criaturas,
    // não sobre o chão (sem `zona`): Medo, Padrão Hipnótico, Fogo das Fadas. É
    // maldição, de qualquer escola. As que têm `zona` (Graxa, Teia) mexem no
    // terreno, e seguem pelas regras de escola abaixo.
    if (spell.onFail?.condition && !spell.zona) return de('maldicao');
    if (escola === 'encantamento' || escola === 'necromancia') return de('maldicao');
    if (escola === 'conjuracao') return de('invocacao');
    // Círculo Mágico: uma zona de abjuração é um círculo de proteção.
    if (spell.zona && escola === 'abjuracao') return de('protecao');
  }

  // Magia de utilidade da escola de conjuração TRAZ algo que não estava:
  // Familiar, Montaria, Servo Invisível, Disco Flutuante. O `kind` delas é
  // genérico, e a escola é o campo que as distingue.
  if (k === 'utilidade' && escola === 'conjuracao') return de('invocacao');

  return de('utilidade');
}
