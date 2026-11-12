// O MOTOR DAS RAÇAS DOS LIVROS (`racas-livros.js`): o que os traços fazem numa luta. Irmão de `subclasses-livros.js`: cada
// função recebe o encontro (`enc`) e é chamada de UM gancho de `combat.js`, que fica com uma linha por traço.
//
// As AÇÕES da raça (as Mãos Curativas, o Passo Feérico, o sopro do Fizban) são MAGIAS INTERNAS, como as que uma magia
// concede (`magias-concedidas.js`): círculo 0, sem espaço, fora de toda lista de classe, com o uso no recurso da raça
// (`recursoDe`). Entram na lista de quem tem o traço (`ACOES_POR_TRACO`), e assim o jogador as acha onde já procura as
// magias, com a mira, a área e a prévia de sempre. O que nenhum tipo antigo fazia é `kind: 'livro'`, com o efeito aqui
// (`EFEITOS_DA_RACA`, que `livro-motor.js` consulta).
import { damageRoll } from '../core/dice.js';
import { distanceFt } from '../core/grid.js';
import { addCondition, removeCondition, hasCondition, getCondition, conditionEffects } from './conditions.js';
import { abilityMod, proficiencyBonus } from './abilities.js';
import { categoriaDeTamanho } from './tamanho.js';

const naVez = (enc, c) => enc.side === c.side && !enc.explorando;
const cdDaRaca = (c, hab) => 8 + proficiencyBonus(c.level ?? 1) + abilityMod(c.abilities?.[hab] ?? 10);
const vivos = (enc, c, raioFt, lado = 'inimigos') => (lado === 'inimigos' ? enc.enemiesOf(c) : enc.alliesOf(c))
  .filter((o) => !o.dead && o.hp > 0 && distanceFt(o.pos, c.pos) <= raioFt);

/** Os dados do sopro do Fizban: 1d10, 2d10 no 5º, 3d10 no 11º, 4d10 no 17º. */
const DADOS_DO_FIZBAN = { 1: '1d10', 5: '2d10', 11: '3d10', 17: '4d10' };

// ------------------------------------------------------------------------------------------------- as ações ----
const A = (id, extra) => ({ id, level: 0, school: 'evocação', fonte: 'vgm', interna: true, racial: true, semEscala: true, semRegraDeBonus: true, ...extra });

export const ACOES_RACIAIS = {
  maosCurativas: A('maosCurativas', { familiaSonora: 'cura',
    name: 'Mãos Curativas', castTime: 'action', rangeFt: 5, kind: 'livro', efeito: 'maosCurativas', alvoAliado: true, recursoDe: 'healingHands',
    desc: 'Toque: a criatura recupera PV iguais ao seu nível. Uma vez por descanso longo.',
  }),
  almaRadianteAasimar: A('almaRadianteAasimar', { familiaSonora: 'reforco',
    name: 'Alma Radiante', castTime: 'action', rangeFt: 0, kind: 'livro', efeito: 'transformacaoAasimar', condicao: 'almaRadiante', recursoDe: 'radiantSoulAasimar', nivelMinimo: 3,
    desc: 'Um minuto: 9 m de voo, e uma vez por turno o acerto de ataque soma dano radiante igual ao seu nível. Uma vez por descanso longo.',
  }),
  consumoRadiante: A('consumoRadiante', { familiaSonora: 'reforco',
    name: 'Consumo Radiante', castTime: 'action', rangeFt: 0, kind: 'livro', efeito: 'transformacaoAasimar', condicao: 'consumoRadiante', recursoDe: 'radiantConsumption', nivelMinimo: 3,
    desc: 'Um minuto: no fim de cada turno seu, você e quem está a 3 m sofrem radiante igual à metade do seu nível; uma vez por turno o acerto de ataque soma radiante igual ao seu nível. Uma vez por descanso longo.',
  }),
  mortalhaNecrotica: A('mortalhaNecrotica', { familiaSonora: 'maldicao',
    name: 'Mortalha Necrótica', castTime: 'action', rangeFt: 0, kind: 'livro', efeito: 'transformacaoAasimar', condicao: 'mortalhaNecrotica', recursoDe: 'necroticShroud', nivelMinimo: 3,
    desc: 'Um minuto: quem está a 3 m faz Carisma ou fica amedrontado até o fim do seu próximo turno; uma vez por turno o acerto de ataque soma necrótico igual ao seu nível. Uma vez por descanso longo.',
  }),
  passoOculto: A('passoOculto', { familiaSonora: 'protecao',
    name: 'Passo Oculto', castTime: 'bonus', rangeFt: 0, kind: 'livro', efeito: 'passoOculto', recursoDe: 'hiddenStep', school: 'ilusão',
    desc: 'Ação bônus: invisível até o começo do seu próximo turno, ou até atacar ou conjurar contra alguém. Uma vez por descanso curto.',
  }),
  rastejarImplorar: A('rastejarImplorar', { familiaSonora: 'reforco',
    name: 'Rastejar, Encolher e Implorar', castTime: 'action', rangeFt: 0, kind: 'livro', efeito: 'rastejar', recursoDe: 'grovelCowerAndBeg', school: 'encantamento',
    desc: 'Até o fim do seu próximo turno, os aliados têm vantagem nos ataques contra inimigos a até 3 m de você. Uma vez por descanso curto.',
  }),
  mandibulasFamintas: A('mandibulasFamintas', { familiaSonora: 'reforco',
    name: 'Mandíbulas Famintas', castTime: 'bonus', rangeFt: 5, kind: 'livro', efeito: 'mandibulas', recursoDe: 'hungryJaws', exigeGolpe: 'mordidaRacial', school: 'transmutação',
    desc: 'Ação bônus: uma mordida; se acertar, PV temporários iguais ao modificador de CON (mínimo 1). Uma vez por descanso curto.',
  }),
  agressivo: A('agressivo', { familiaSonora: 'movimento',
    name: 'Agressivo', castTime: 'bonus', rangeFt: 0, kind: 'livro', efeito: 'agressivo', school: 'transmutação',
    desc: 'Ação bônus: o seu deslocamento a mais neste turno, para chegar a um inimigo que vê.',
  }),
  agilidadeFelina: A('agilidadeFelina', { familiaSonora: 'movimento',
    name: 'Agilidade Felina', castTime: 'livre', rangeFt: 0, kind: 'livro', efeito: 'agilidadeFelina', recursoDe: 'felineAgility', school: 'transmutação',
    desc: 'Sem custo: dobra o deslocamento até o fim do turno. Volta depois de um turno inteiro sem andar.',
  }),
  fugaAgilRacial: A('fugaAgilRacial', { familiaSonora: 'movimento',
    name: 'Fuga Ágil', castTime: 'bonus', rangeFt: 0, kind: 'livro', efeito: 'fugaAgil', school: 'transmutação',
    desc: 'Ação bônus: Desengajar — ninguém tem ataque de oportunidade contra você neste turno.',
  }),
  passoFeerico: A('passoFeerico', { fonte: 'mtf',
    name: 'Passo Feérico', castTime: 'bonus', rangeFt: 30, kind: 'teleporte', mira: 'casa', recursoDe: 'feyStep', school: 'conjuração', depoisDoTeleporte: 'estacao',
    desc: 'Ação bônus: teleporta-se até 9 m. Do 3º nível, leva o efeito da estação. Uma vez por descanso curto.',
  }),
  bencaoDaRainhaCorvo: A('bencaoDaRainhaCorvo', { fonte: 'mtf',
    name: 'Bênção da Rainha Corvo', castTime: 'bonus', rangeFt: 15, kind: 'teleporte', mira: 'casa', recursoDe: 'blessingOfTheRavenQueen', school: 'conjuração', depoisDoTeleporte: 'corvo',
    desc: 'Ação bônus: teleporta-se até 4,5 m. Do 3º nível, resistência a todo dano até o começo do seu próximo turno. Uma vez por descanso longo.',
  }),
  protecaoCromatica: A('protecaoCromatica', { familiaSonora: 'protecao', fonte: 'ftd',
    name: 'Proteção Cromática', castTime: 'action', rangeFt: 0, kind: 'livro', efeito: 'protecaoCromatica', recursoDe: 'chromaticWarding', school: 'abjuração', nivelMinimo: 5,
    desc: 'Um minuto: imune ao tipo de dano da ancestralidade. Uma vez por descanso longo.',
  }),
  vooDeGema: A('vooDeGema', { familiaSonora: 'movimento', fonte: 'ftd',
    name: 'Voo de Gema', castTime: 'bonus', rangeFt: 0, kind: 'livro', efeito: 'vooDeGema', recursoDe: 'gemFlight', school: 'transmutação', nivelMinimo: 5,
    desc: 'Ação bônus: um minuto de voo igual ao deslocamento. Uma vez por descanso longo.',
  }),
  soproEnervante: A('soproEnervante', { familiaSonora: 'maldicao', fonte: 'ftd',
    name: 'Sopro Enervante', castTime: 'action', rangeFt: 0, shape: 'cone', areaFt: 15, kind: 'save', save: 'con',
    onFail: { condition: 'incapacitadoPeloSopro', rounds: 1 }, cdDeCon: true, recursoDe: 'metallicBreath', noLugarDeUmAtaque: true, nivelMinimo: 5, school: 'evocação',
    desc: 'No lugar de um ataque: cone de 4,5 m, CON ou incapacitado até o começo do seu próximo turno. Uma vez por descanso longo (junto com o de Repulsão).',
  }),
  soproDeRepulsao: A('soproDeRepulsao', { familiaSonora: 'movimento', fonte: 'ftd',
    name: 'Sopro de Repulsão', castTime: 'action', rangeFt: 0, shape: 'cone', areaFt: 15, kind: 'save', save: 'str',
    pushFt: 20, onFail: { condition: 'caido' }, cdDeCon: true, recursoDe: 'metallicBreath', noLugarDeUmAtaque: true, nivelMinimo: 5, school: 'evocação',
    desc: 'No lugar de um ataque: cone de 4,5 m, FOR ou empurrado 6 m e caído. Uma vez por descanso longo (junto com o Enervante).',
  }),
};

// O SOPRO DO FIZBAN: um por tipo de dano e forma (o cromático em linha, o metálico e o de gema em cone)
for (const [tipo, forma] of [['ácido', 'linha'], ['elétrico', 'linha'], ['veneno', 'linha'], ['fogo', 'linha'], ['frio', 'linha'],
  ['fogo', 'cone'], ['elétrico', 'cone'], ['ácido', 'cone'], ['frio', 'cone'],
  ['energético', 'cone'], ['radiante', 'cone'], ['psíquico', 'cone'], ['trovejante', 'cone'], ['necrótico', 'cone']]) {
  const id = soproId(tipo, forma);
  ACOES_RACIAIS[id] = A(id, { fonte: 'ftd',
    name: `Sopro do dragão (${tipo})`, origem: 'sopro', castTime: 'action', rangeFt: 0, shape: forma, areaFt: forma === 'cone' ? 15 : 30,
    kind: 'save', save: 'dex', damage: '1d10', damageType: tipo, halfOnSave: true, dadosPorNivel: DADOS_DO_FIZBAN, cdDeCon: true,
    recursoDe: 'soproDoFizban', noLugarDeUmAtaque: true, semEscala: false,
    desc: `No lugar de um ataque da ação de Atacar: ${forma === 'cone' ? 'cone de 4,5 m' : 'linha de 9 m por 1,5 m'}, DES (8 + CON + proficiência), 1d10 de ${tipo}, metade se passar; 2d10 no 5º, 3d10 no 11º, 4d10 no 17º. Usos iguais ao bônus de proficiência por descanso longo.`,
  });
}
export function soproId(tipo, forma) {
  const t = String(tipo).normalize('NFD').replace(/[̀-ͯ]/g, '');
  return `soproFizban_${t}_${forma}`;
}

/** Que ação cada traço dá. O sopro do Fizban sai do tipo da ancestralidade (`acoesDaRaca`). */
export const ACOES_POR_TRACO = {
  healingHands: ['maosCurativas'], radiantSoulAasimar: ['almaRadianteAasimar'], radiantConsumption: ['consumoRadiante'], necroticShroud: ['mortalhaNecrotica'],
  hiddenStep: ['passoOculto'], grovelCowerAndBeg: ['rastejarImplorar'], hungryJaws: ['mandibulasFamintas'], aggressive: ['agressivo'],
  felineAgility: ['agilidadeFelina'], nimbleEscapeRacial: ['fugaAgilRacial'], feyStep: ['passoFeerico'], blessingOfTheRavenQueen: ['bencaoDaRainhaCorvo'],
  chromaticWarding: ['protecaoCromatica'], gemFlight: ['vooDeGema'], metallicBreath: ['soproEnervante', 'soproDeRepulsao'],
};

/** As ações da raça que o herói tem AGORA (o nível mínimo de cada uma conta). */
export function acoesDaRaca(actor) {
  const f = actor?.features ?? [];
  const out = f.flatMap((t) => ACOES_POR_TRACO[t] ?? []);
  if (f.includes('soproDoFizban') && actor.danoDoFizban) {
    out.push(soproId(actor.danoDoFizban, f.includes('ancestralidadeCromatica') ? 'linha' : 'cone'));
  }
  return out.filter((id) => (actor.level ?? 1) >= (ACOES_RACIAIS[id]?.nivelMinimo ?? 1));
}

// ----------------------------------------------------------------------------------------- os efeitos ----
export const EFEITOS_DA_RACA = {
  maosCurativas(enc, actor, spell, { target }) {
    const alvo = target ?? actor;
    if (['morto-vivo', 'constructo'].includes(alvo.tipo)) { enc.say('aviso', 'As Mãos Curativas não curam morto-vivo nem constructo.'); return false; }
    const curou = enc.heal(alvo, actor.level ?? 1, actor);
    enc.say('cura', `${actor.name} impõe as mãos: ${alvo.name} recupera ${curou} PV.`);
    return true;
  },
  transformacaoAasimar(enc, actor, spell) {
    addCondition(actor, spell.condicao, { rounds: 10, source: actor.id });
    enc.say('recurso', `${actor.name}: ${spell.name}, por um minuto.`);
    if (spell.condicao === 'mortalhaNecrotica') {
      const cd = cdDaRaca(actor, 'cha');
      for (const e of vivos(enc, actor, 10)) {
        const s = enc.resistencia(e, 'cha', cd, { contra: { condicao: 'amedrontado', magico: true, conjurador: actor } });
        if (s.success) continue;
        enc.aplicarCondicao(e, 'amedrontado', { rounds: 1, quando: 'fim', lado: actor.side, source: actor.id });
        enc.say('condicao', `${e.name} se apavora com as asas de sombra.`);
      }
    }
    return true;
  },
  passoOculto(enc, actor) {
    addCondition(actor, 'invisivel', { rounds: 1, quando: 'inicio', lado: actor.side, source: actor.id });
    enc.say('recurso', `${actor.name} some no ar (Passo Oculto).`);
    return true;
  },
  rastejar(enc, actor) {
    addCondition(actor, 'rastejando', { rounds: 1, quando: 'fim', lado: actor.side, source: actor.id });
    enc.say('recurso', `${actor.name} se encolhe e implora: os aliados aproveitam a distração.`);
    return true;
  },
  mandibulas(enc, actor, spell, { target }) {
    if (!target || !enc.canAttack(actor, target, 'mordidaRacial').ok) { enc.say('aviso', `${actor.name} não alcança ninguém para morder.`); return false; }
    const r = enc.resolveAttack(actor, target, { weaponId: 'mordidaRacial' });
    if (r?.hit) {
      const pv = Math.max(1, abilityMod(actor.abilities?.con ?? 10));
      actor.tempHp = Math.max(actor.tempHp ?? 0, pv);
      enc.say('recurso', `${actor.name} ganha ${pv} PV temporários (Mandíbulas Famintas).`);
    }
    return true;
  },
  agressivo(enc, actor) {
    actor.movementLeftFt = (actor.movementLeftFt ?? 0) + enc.speedOf(actor);
    enc.say('recurso', `${actor.name} avança (Agressivo).`);
    return true;
  },
  agilidadeFelina(enc, actor) {
    actor.movementLeftFt = (actor.movementLeftFt ?? 0) + enc.speedOf(actor);
    actor.agilidadeFelinaEm = enc.turnoKey();
    enc.say('recurso', `${actor.name} dispara como um gato: o dobro do deslocamento neste turno.`);
    return true;
  },
  fugaAgil(enc, actor) {
    actor.disengaging = true;
    enc.say('recurso', `${actor.name} escapa ágil: desengaja.`);
    return true;
  },
  protecaoCromatica(enc, actor) {
    addCondition(actor, 'protecaoCromatica', { rounds: 10, source: actor.id, data: { tipo: actor.danoDoFizban } });
    enc.say('recurso', `${actor.name} se cobre da energia do dragão: imune a ${actor.danoDoFizban} por um minuto.`);
    return true;
  },
  vooDeGema(enc, actor) {
    addCondition(actor, 'vooDeGema', { rounds: 10, source: actor.id });
    enc.say('recurso', `${actor.name} abre asas espectrais.`);
    return true;
  },
};

/** Depois do teleporte da raça: a estação do eladrin e a resistência da Rainha Corvo (do 3º nível). */
export function depoisDoTeleporte(enc, actor, spell, origem) {
  if ((actor.level ?? 1) < 3) return;
  if (spell.depoisDoTeleporte === 'corvo') {
    addCondition(actor, 'protecaoDoCorvo', { rounds: 1, quando: 'inicio', lado: actor.side, source: actor.id });
    enc.say('recurso', `${actor.name} tem a bênção da Rainha Corvo: resistência a todo dano até o próximo turno.`);
    return;
  }
  if (spell.depoisDoTeleporte !== 'estacao') return;
  const f = actor.features ?? [];
  const cd = cdDaRaca(actor, 'cha');
  if (f.includes('estacaoVerao')) {
    const dano = Math.max(1, abilityMod(actor.abilities?.cha ?? 10));
    for (const e of [...enc.enemiesOf(actor), ...enc.alliesOf(actor)].filter((o) => !o.dead && o.hp > 0 && distanceFt(o.pos, actor.pos) <= 5)) {
      enc.say('magia', `Verão: o calor do passo queima ${e.name} (${dano}).`);
      enc.applyDamage(e, dano, 'fogo', actor, { magico: true });
    }
  } else if (f.includes('estacaoInverno') && origem) {
    // o livro pega quem está a 1,5 m de você ANTES do passo: o inimigo colado de onde você saiu
    const alvo = enc.enemiesOf(actor).find((o) => !o.dead && o.hp > 0 && distanceFt(o.pos, origem) <= 5);
    if (alvo && !enc.resistencia(alvo, 'wis', cd, { contra: { condicao: 'amedrontado', magico: true, conjurador: actor } }).success) {
      enc.aplicarCondicao(alvo, 'amedrontado', { rounds: 1, quando: 'fim', lado: actor.side, source: actor.id });
      enc.say('condicao', `Inverno: ${alvo.name} gela de medo.`);
    }
  } else if (f.includes('estacaoOutono')) {
    for (const e of vivos(enc, actor, 10).slice(0, 2)) {
      if (enc.resistencia(e, 'wis', cd, { contra: { condicao: 'enfeiticado', magico: true, conjurador: actor } }).success) continue;
      enc.aplicarCondicao(e, 'enfeiticado', { rounds: 10, source: actor.id, data: { fimSeFerido: true } });
      enc.say('condicao', `Outono: ${e.name} fica encantado pelo eladrin.`);
    }
  }
}

// ------------------------------------------------------------------------------------------- os ganchos ----
/** As TRANSFORMAÇÕES do aasimar, a FÚRIA DOS PEQUENOS e o ATAQUE SURPRESA: o dano a mais do acerto de ataque. */
export function extrasDaRaca(enc, atacante, alvo, extra) {
  if (alvo.dead || !naVez(enc, atacante)) return;
  const vez = enc.turnoKey();
  const nivel = atacante.level ?? 1;
  const transformado = ['almaRadiante', 'consumoRadiante', 'mortalhaNecrotica'].find((id) => hasCondition(atacante, id));
  if (transformado && atacante.aasimarNoTurno !== vez) {
    atacante.aasimarNoTurno = vez;
    extra(transformado === 'mortalhaNecrotica' ? 'Mortalha Necrótica' : transformado === 'almaRadiante' ? 'Alma Radiante' : 'Consumo Radiante',
      `+${nivel}`, transformado === 'mortalhaNecrotica' ? 'necrótico' : 'radiante');
  }
  const f = atacante.features ?? [];
  if (f.includes('furyOfTheSmall') && (atacante.resources?.furyOfTheSmall ?? 0) > 0 && !alvo.dead
    && categoriaDeTamanho(alvo) > categoriaDeTamanho(atacante) && alvo.hp > 0) {
    atacante.resources.furyOfTheSmall -= 1;
    extra('Fúria dos Pequenos', `+${nivel}`, null, false);
  }
  if (f.includes('surpriseAttack') && enc.round === 1 && enc.surpreendidos?.has(alvo.id) && !atacante.ataqueSurpresaUsado) {
    atacante.ataqueSurpresaUsado = true;
    extra('Ataque Surpresa', '2d6', null, false);
  }
}

/** RESISTÊNCIA DA PEDRA (golias): a reação que tira 1d12 + CON do golpe que dói (um quarto dos PV máximos ou mais). */
export function resistenciaDaPedra(enc, alvo, amount) {
  if (!alvo.features?.includes('stonesEndurance') || (alvo.resources?.stonesEndurance ?? 0) <= 0 || alvo.reactionUsed) return amount;
  if (conditionEffects(alvo).incapacitated || amount < Math.max(1, Math.ceil((alvo.maxHp ?? 1) / 4))) return amount;
  alvo.resources.stonesEndurance -= 1;
  alvo.reactionUsed = true;
  const r = damageRoll(enc.rng, '1d12');
  const corte = r.total + abilityMod(alvo.abilities?.con ?? 10);
  const sobra = Math.max(0, amount - corte);
  enc.say('recurso', `${alvo.name} endurece como pedra: o golpe perde ${amount - sobra}.`, `1d12[${r.rolls.join('+')}] + CON`);
  return sobra;
}

/**
 * SALVAR AS APARÊNCIAS (hobgoblin): +1 por aliado que ele vê a até 9 m (até +5), uma vez por descanso curto, no ataque ou na
 * resistência que falhou. Automática, e só quando vira o fracasso em sucesso: `falta` é quanto faltou. Devolve o bônus, ou 0.
 */
export function salvarAsAparencias(enc, actor, falta) {
  if (!actor.features?.includes('savingFace') || (actor.resources?.savingFace ?? 0) <= 0 || falta <= 0) return 0;
  const n = Math.min(5, enc.alliesOf(actor).filter((a) => a !== actor && !a.dead && a.hp > 0
    && distanceFt(a.pos, actor.pos) <= 30 && enc.field.hasLineOfSight(actor.pos, a.pos)).length);
  if (n < falta) return 0;
  actor.resources.savingFace -= 1;
  enc.say('recurso', `${actor.name} não pode falhar diante dos seus: +${n} (Salvar as Aparências).`);
  return n;
}

/** TÁTICAS DE MATILHA e RASTEJAR (kobold): a vantagem no ataque. Devolve o motivo, ou null. */
export function vantagemDaRaca(enc, attacker, target) {
  if (attacker.features?.includes('packTacticsRacial') && enc.alliesOf(attacker).some((a) => a !== attacker && !a.dead
    && enc.field.vizinhos(a.pos, target.pos) && !conditionEffects(a).incapacitated)) return 'táticas de matilha';
  const kobold = enc.alliesOf(attacker).find((a) => a !== attacker && !a.dead && hasCondition(a, 'rastejando') && distanceFt(a.pos, target.pos) <= 10);
  if (kobold) return `${kobold.name} rastejando`;
  return null;
}

/** BRAÇOS LONGOS (bugbear): no próprio turno, o golpe de perto alcança 1,5 m a mais. */
export const alcanceDaRaca = (enc, actor) => (actor.features?.includes('longLimbed') && enc.side === actor.side ? 5 : 0);

/** CONSUMO RADIANTE: no fim de cada turno do aasimar, ele e quem está a 3 m sofrem metade do nível em radiante. */
export function fimDoLado(enc, side) {
  for (const c of enc.combatants) {
    if (c.dead || c.side !== side || !hasCondition(c, 'consumoRadiante')) continue;
    const dano = Math.ceil((c.level ?? 1) / 2);
    for (const o of enc.combatants.filter((x) => !x.dead && x.hp > 0 && distanceFt(x.pos, c.pos) <= 10)) {
      enc.say('magia', `A luz de ${c.name} queima ${o === c ? 'a si mesmo' : o.name} (${dano}).`);
      enc.applyDamage(o, dano, 'radiante', c, { magico: true });
    }
  }
  // AGILIDADE FELINA: volta depois de um turno inteiro sem andar
  for (const c of enc.combatants) {
    if (c.dead || c.side !== side || !c.features?.includes('felineAgility')) continue;
    if ((c.corridaFt ?? 0) === 0 && c.agilidadeFelinaEm !== enc.turnoKey() && (c.resources?.felineAgility ?? 0) < 1) {
      c.resources.felineAgility = 1;
      enc.say('recurso', `${c.name} recupera o fôlego felino.`);
    }
  }
}

export { getCondition, removeCondition };
