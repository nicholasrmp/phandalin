// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// As habilidades de classe que pedem um ALVO ALIADO: Cura pelas Mãos
// (paladino) e Inspiração Bárdica (bardo). Funções puras, sem DOM: a barra
// (`view/hud.js`), o menu do botão direito (`game/interacoes-classe.js`), o
// tabuleiro (`view/board.js`) e o clique (`main.js`) leem as MESMAS recusas,
// e o motor (`Encounter.useFeature`) é quem de fato executa.
//
// Também aqui o Ataque Furtivo do ladino: `estadoDoFurtivo` diz, para a
// dica da arma, o cartão do alvo e o selo da barra, se o golpe leva o dado,
// e quando não leva, POR QUÊ.

import { maxHpEfetivo, hasCondition, conditionEffects, CONDITIONS } from './conditions.js';
import { distanceFt } from '../core/grid.js';

export const HABILIDADES_DE_ALVO = {
  layOnHands: {
    nome: 'Cura pelas Mãos', icone: 'classe-layOnHands', custo: 'Ação', carga: 'layOnHands',
    proprio: true, alcanceFt: 5,
    // `i` abre o inventário e `p` a ficha (main.js): a tecla do azulejo tem de ser outra, livre.
    tecla: 'l',
  },
  bardicInspiration: {
    nome: 'Inspiração Bárdica', icone: 'classe-bardicInspiration', custo: 'Ação bônus', carga: 'bardicInspiration',
    proprio: false, alcanceFt: 60,
    tecla: 'u',
  },
};

/** O herói tem a habilidade e ela pede alvo aliado? */
export const temHabilidadeDeAlvo = (c, id) => Boolean(HABILIDADES_DE_ALVO[id]) && Boolean(c?.features?.includes(id));

/** Sem turno: explorando ou com a luta acabada. A Cura pelas Mãos não cobra a ação aí (o motor decide igual). */
export const foraDeTurno = (enc) => Boolean(enc?.over || enc?.explorando);

/**
 * Por que a habilidade não serve AGORA, antes de escolher o alvo (`null` =
 * serve). É o que apaga o azulejo da barra.
 */
export function vetoGeral(enc, c, id) {
  const h = HABILIDADES_DE_ALVO[id];
  if (!h || !c) return 'habilidade desconhecida';
  const livre = foraDeTurno(enc);
  if (id === 'layOnHands') {
    if (!livre && c.actionUsed) return 'a ação deste turno já foi usada';
    if (!livre && c.acaoLimitada) return 'a ação extra da Velocidade não serve para curar';
    if (!((c.resources?.layOnHands ?? 0) > 0)) return 'a reserva de Cura pelas Mãos acabou';
    return null;
  }
  if (id === 'bardicInspiration') {
    if (livre) return 'só em combate';
    if (c.dead || conditionEffects(c).incapacitated) return 'incapacitado não inspira';
    if (c.bonusUsed) return 'a ação bônus deste turno já foi usada';
    if (!((c.resources?.bardicInspiration ?? 0) > 0)) return 'sem cargas de Inspiração Bárdica';
    return null;
  }
  return null;
}

/** Por que `alvo` não serve (`null` = serve). Inclui o veto geral. */
export function vetoDaHabilidade(enc, c, id, alvo) {
  const geral = vetoGeral(enc, c, id);
  if (geral) return geral;
  const h = HABILIDADES_DE_ALVO[id];
  if (!alvo || alvo.dead) return 'sem alvo';
  if (alvo.side !== c.side) return 'só em aliado';
  if (alvo === c && !h.proprio) return 'não em si mesmo';
  if (id === 'layOnHands') {
    // Espelha as recusas de `useFeature('layOnHands')`, na mesma ordem de importância.
    if (c.dead || conditionEffects(c).incapacitated) return 'incapacitado não impõe as mãos';
    if (['morto-vivo', 'constructo'].includes(alvo.tipo)) return 'a cura não funciona em morto-vivo nem em constructo';
    if ((alvo.conditions ?? []).some((k) => CONDITIONS[k.id]?.semCura)) return `${alvo.name} não recupera PV agora`;
    if (maxHpEfetivo(alvo) - alvo.hp <= 0) return `${alvo.name} não está ferido`;
    if (alvo !== c && !enc.field.vizinhos(c.pos, alvo.pos)) return 'encoste nele primeiro';
    return null;
  }
  if (id === 'bardicInspiration') {
    if (hasCondition(alvo, 'inspirado')) return `${alvo.name} já está inspirado`;
    if (distanceFt(c.pos, alvo.pos) > h.alcanceFt) return 'longe demais (alcance de 18 m)';
    return null;
  }
  return null;
}

/** Os aliados que a habilidade serve agora (os que acendem em verde no tabuleiro). */
export function alvosDaHabilidade(enc, c, id) {
  if (vetoGeral(enc, c, id)) return [];
  return enc.combatants.filter((a) => !a.dead && vetoDaHabilidade(enc, c, id, a) === null);
}

/** A prévia do que o clique faria em `alvo` — o texto do cartão e da dica. */
export function previaDaHabilidade(enc, c, id, alvo) {
  if (id === 'layOnHands') {
    const reserva = c.resources?.layOnHands ?? 0;
    const falta = Math.max(0, maxHpEfetivo(alvo) - alvo.hp);
    const cura = Math.min(falta, reserva);
    return { cura, falta, reserva, restaria: reserva - cura, texto: `cura ${cura} de ${falta} PV · reserva ${reserva} → ${reserva - cura}` };
  }
  if (id === 'bardicInspiration') {
    const cargas = c.resources?.bardicInspiration ?? 0;
    const dado = c.dadoDeInspiracao ?? 'd6';
    return { dado, cargas, restaria: cargas - 1, texto: `${dado} para somar num ataque, teste ou resistência · cargas ${cargas} → ${cargas - 1}` };
  }
  return { texto: '' };
}

/**
 * O azulejo da barra, como dados (o `hud.js` só o desenha). `desabilitado` e
 * `motivo` vêm do veto geral e de "há algum aliado servido?".
 */
export function descritorDaHabilidade(enc, c, id) {
  const h = HABILIDADES_DE_ALVO[id];
  if (!h) return null;
  const restam = c.resources?.[h.carga] ?? 0;
  const total = c.resourcesMax?.[h.carga] ?? restam;
  let motivo = vetoGeral(enc, c, id);
  if (!motivo && !alvosDaHabilidade(enc, c, id).length) {
    motivo = id === 'layOnHands' ? 'ninguém ferido ao seu alcance' : 'nenhum aliado para inspirar';
  }
  const texto = id === 'layOnHands'
    ? 'Escolha o aliado encostado (ou você mesmo) e tire da reserva os pontos de vida que faltam a ele. Fora do combate não gasta a ação, só a reserva.'
    : 'Escolha um aliado a até 18 m: ele guarda um dado para somar a um ataque, teste ou resistência.';
  return {
    id, icone: h.icone, nome: h.nome, texto, custo: h.custo,
    carga: h.carga, restam, total, tecla: h.tecla,
    desabilitado: Boolean(motivo), motivo,
    acao: { kind: 'featureAlvo', featureId: id },
  };
}

// ---- Ataque Furtivo -------------------------------------------------------------

/**
 * O que o Ataque Furtivo faz neste golpe, para o jogador LER (ele é
 * automático e antes não aparecia em lugar nenhum).
 *
 * @param prev  `previsaoDeAtaque(enc, atacante, alvo, arma)`; sem ele, só o estado do herói
 * @returns null se o herói não tem Ataque Furtivo; senão
 *   { dado, usado, aplica, vantagem, desvantagem, motivos, motivo, texto }
 */
export function estadoDoFurtivo(enc, c, prev = null, armaPedida = null) {
  if (!c?.features?.includes('sneakAttack') || !c.sneakAttack) return null;
  const dado = c.sneakAttack;
  const usado = Boolean(c.sneakUsedThisTurn);
  const base = { dado, usado, aplica: false, vantagem: false, desvantagem: false, motivos: [], motivo: null, texto: '', detalhe: '' };
  if (!prev) {
    if (usado) return { ...base, texto: 'Furtivo já usado neste turno', detalhe: 'já usado neste turno' };
    // Sem alvo, só se promete o furtivo para a arma que o leva (acuidade ou à distância).
    if (armaPedida && !(armaPedida.ranged || armaPedida.finesse)) {
      return { ...base, motivo: 'só arma de acuidade ou à distância', texto: 'Furtivo: só com acuidade ou à distância', detalhe: 'só com acuidade ou à distância' };
    }
    return { ...base, texto: `Furtivo pronto: +${dado} com vantagem ou aliado colado no alvo`, detalhe: `+${dado} com vantagem ou aliado colado` };
  }
  const mods = prev.mods ?? {};
  const vantagem = Boolean(mods.advantage) && !mods.disadvantage;
  const desvantagem = Boolean(mods.disadvantage) && !mods.advantage;
  const anulados = Boolean(mods.advantage && mods.disadvantage);
  const motivos = prev.motivos ?? [];
  const r = { ...base, vantagem, desvantagem, anulados, motivos };
  // Sem golpe possível não há furtivo: sem linha de visão, ou à distância e fora de alcance. O corpo a
  // corpo longe que ANDA até o alvo continua valendo (o ataque acontece depois do passo).
  const ranged = Boolean(prev.perfil?.ranged);
  const impossivel = (prev.semVisao && (ranged || !prev.foraDeAlcance)) || (prev.foraDeAlcance && ranged);
  if (impossivel) {
    const por = prev.semVisao ? 'sem linha de visão' : 'fora de alcance';
    return { ...r, motivo: por, texto: `Furtivo: ${por}`, detalhe: por };
  }
  if (prev.furtivo) return { ...r, aplica: true, texto: `Ataque Furtivo +${prev.furtivo} neste golpe`, detalhe: `+${prev.furtivo} neste golpe` };
  if (usado) return { ...r, motivo: 'já usado neste turno', texto: 'Furtivo já usado neste turno', detalhe: 'já usado neste turno' };
  const arma = prev.perfil?.weapon ?? null;
  if (!(arma?.ranged || arma?.finesse)) return { ...r, motivo: 'só arma de acuidade ou à distância', texto: 'Furtivo: só com arma de acuidade ou à distância', detalhe: 'só com acuidade ou à distância' };
  // só a desvantagem LÍQUIDA tira o furtivo: vantagem e desvantagem que se anulam valem nenhuma
  if (desvantagem) return { ...r, motivo: 'desvantagem', texto: 'Furtivo não vale com desvantagem', detalhe: 'não vale com desvantagem' };
  return { ...r, motivo: 'sem vantagem nem aliado', texto: `Furtivo (+${dado}): precisa de vantagem ou de um aliado colado no alvo`, detalhe: 'sem vantagem nem aliado colado' };
}

/** Texto das linhas de vantagem/desvantagem do cartão (ou null se nenhuma pesa). */
export function textoDeVantagem(prev) {
  const mods = prev?.mods;
  if (!mods) return null;
  const motivos = prev.motivos?.length ? ` — ${prev.motivos.join(', ')}` : '';
  if (mods.advantage && mods.disadvantage) return { texto: `vantagem e desvantagem se anulam${motivos}`, tipo: 'anulado' };
  if (mods.advantage) return { texto: `vantagem${motivos}`, tipo: 'vantagem' };
  if (mods.disadvantage) return { texto: `desvantagem${motivos}`, tipo: 'desvantagem' };
  return null;
}
