// Descanso curto e longo (Livro do Jogador).
//
// CURTO (uma hora): cada personagem gasta quantos dados de vida quiser, um
// por vez; cada dado cura o que rolar mais o modificador de Constituição
// (nunca menos que 0 por dado). Voltam os recursos "por descanso curto"
// (Retomar o Fôlego, Surto de Ação, Canalizar Divindade, Ki, Forma
// Selvagem) e os espaços de magia de pacto do bruxo. O mago pode usar a
// Recuperação Arcana: recupera espaços cuja soma de círculos é até metade do
// nível dele, arredondada para cima — uma vez por descanso longo.
//
// LONGO (oito horas): vida cheia, metade dos dados de vida gastos de volta
// (mínimo um), todos os recursos e espaços de magia, e quem estava
// inconsciente e estável acorda.
//
// Os dados de vida restantes moram em `dadosDeVidaRestantes` (começa com um
// por nível) — o mesmo campo que o talento Curandeiro já gasta.

import { abilityMod } from './abilities.js';
import { CLASSES } from './classes/index.js';
import { removeCondition, getCondition, maxHpEfetivo, mudarExaustao, nivelDeExaustao } from './conditions.js';
import { SPELLS, magiasProntas, dadosDaMagia } from './spells.js';
import { spellMod } from './party.js';
import { rolarCura } from './talentos.js';

/** Recursos que voltam no descanso curto. Os outros só no longo. */
const VOLTAM_NO_CURTO = new Set(['secondWind', 'actionSurge', 'channelDivinity', 'ki', 'wildShape']);

export const dadoDeVida = (c) => CLASSES[c.classe]?.dadoDeVida ?? 8;
export const dadosDeVida = (c) => (c.dadosDeVidaRestantes ??= c.level ?? 1);

/**
 * Gasta UM dado de vida e cura. Devolve { rolagem, cura, restam } ou null
 * se não há dado, o personagem está com a vida cheia ou morto.
 */
export function gastarDadoDeVida(rng, c) {
  if (c.dead || c.hp >= maxHpEfetivo(c) || dadosDeVida(c) <= 0) return null;
  const lados = dadoDeVida(c);
  const rolagem = rng.die(lados);
  const con = abilityMod(c.abilities.con);
  const cura = Math.max(0, rolagem + con);
  c.dadosDeVidaRestantes -= 1;
  const antes = Math.max(0, c.hp);
  c.hp = Math.max(antes, Math.min(maxHpEfetivo(c), antes + cura));
  if (c.hp > 0) acordar(c);
  return { lados, rolagem, con, cura: c.hp - antes, restam: c.dadosDeVidaRestantes };
}

/** Quem estava caído e estável volta a si e, depois de uma hora, de pé. */
function acordar(c) {
  removeCondition(c, 'inconsciente');
  removeCondition(c, 'caido');
  c.stable = false;
  c.deathSaves = { successes: 0, failures: 0 };
}

/** Quantos dados um personagem gastaria sozinho: até ficar perto da vida cheia. */
export function dadosSugeridos(c) {
  const media = dadoDeVida(c) / 2 + 0.5 + abilityMod(c.abilities.con);
  const falta = maxHpEfetivo(c) - c.hp;
  return Math.max(0, Math.min(dadosDeVida(c), Math.floor(falta / Math.max(1, media))));
}

/** O que volta no curto, sem os dados de vida. Devolve frases para o registro. */
export function recuperarNoCurto(c) {
  const frases = [];
  for (const [id, max] of Object.entries(c.resourcesMax ?? {})) {
    if (VOLTAM_NO_CURTO.has(id) && (c.resources[id] ?? 0) < max) {
      c.resources[id] = max;
      frases.push(id);
    }
  }
  const sc = c.spellcasting;
  if (sc?.tipo === 'pacto' && sc.slotsMax) {
    if (sc.slots.some((n, i) => n < sc.slotsMax[i])) frases.push('espaços de pacto');
    sc.slots = sc.slotsMax.slice();
  }
  // Recuperação Arcana: os espaços mais altos primeiro, até o orçamento.
  if ((c.resources?.arcaneRecovery ?? 0) > 0 && sc?.slotsMax) {
    let orcamento = Math.ceil((c.level ?? 1) / 2);
    let recuperou = 0;
    for (let circ = Math.min(5, sc.slotsMax.length - 1); circ >= 1 && orcamento > 0; circ--) {
      while (sc.slots[circ] < sc.slotsMax[circ] && circ <= orcamento) {
        sc.slots[circ] += 1;
        orcamento -= circ;
        recuperou += 1;
      }
    }
    if (recuperou) {
      c.resources.arcaneRecovery -= 1;
      frases.push(`Recuperação Arcana (${recuperou} espaço${recuperou > 1 ? 's' : ''})`);
    }
  }
  return frases;
}

/**
 * Oração de Cura (2º círculo): leva 10 minutos, então só existe fora de
 * combate — o motor de combate a recusa. Até 6 criaturas recuperam 2d8 + o
 * modificador de conjuração, +1d8 por círculo acima do 2º; gasta um espaço.
 * Quem estava caído a 0 PV acorda, no chão. Devolve { ok, why } ou
 * { ok, circulo, curas: [{ alvo, cura }] }.
 */
export function oracaoDeCura(rng, conjurador, alvos, { circulo = 2 } = {}) {
  const spell = SPELLS.oracaoDeCura;
  const sc = conjurador.spellcasting;
  if (conjurador.dead || conjurador.hp <= 0) return { ok: false, why: 'quem está caído não reza' };
  if (!sc || !magiasProntas(conjurador).includes('oracaoDeCura')) return { ok: false, why: `${spell.name} não está preparada` };
  if (circulo < spell.level || !(sc.slots?.[circulo] > 0)) return { ok: false, why: `sem espaço de ${circulo}º círculo` };
  const quem = [...new Set(alvos)].filter((c) => !c.dead && !['morto-vivo', 'constructo'].includes(c.tipo));
  if (!quem.length) return { ok: false, why: 'ninguém para curar' };
  if (quem.length > spell.targets) return { ok: false, why: `${spell.name} cura até ${spell.targets} criaturas` };
  sc.slots[circulo] -= 1;
  const dados = dadosDaMagia(spell, { circulo, notacao: spell.heal });
  const curas = quem.map((alvo) => {
    const r = rolarCura({ rng }, dados, conjurador);
    let total = r.total + spellMod(conjurador);
    // Discípulo da Vida: +2 + círculo do espaço gasto.
    if (conjurador.features?.includes('discipleOfLife')) total += 2 + circulo;
    const antes = Math.max(0, alvo.hp);
    alvo.hp = Math.max(antes, Math.min(maxHpEfetivo(alvo), antes + Math.max(0, total)));
    if (antes <= 0 && alvo.hp > 0) acordar(alvo);
    return { alvo, cura: alvo.hp - antes, rolagem: r.rolls };
  });
  return { ok: true, circulo, curas };
}

/**
 * Bom Fruto (1º círculo) fora de combate: as dez frutinhas são comidas logo, uma
 * a uma, por quem mais precisa — cada uma cura 1 PV. Gasta um espaço e devolve
 * { ok, why } ou { ok, circulo, curas: [{ alvo, cura }] }. Sobra de fruta não
 * existe aqui: o que não cabe em ninguém ferido se perde.
 */
export function bomFrutoNoDescanso(conjurador, alvos, { circulo = 1 } = {}) {
  const spell = SPELLS.bomFruto;
  const sc = conjurador.spellcasting;
  if (conjurador.dead || conjurador.hp <= 0) return { ok: false, why: 'quem está caído não conjura' };
  if (!sc || !magiasProntas(conjurador).includes('bomFruto')) return { ok: false, why: `${spell.name} não está preparada` };
  if (circulo < spell.level || !(sc.slots?.[circulo] > 0)) return { ok: false, why: `sem espaço de ${circulo}º círculo` };
  const quem = [...new Set(alvos)].filter((c) => !c.dead && !['morto-vivo', 'constructo'].includes(c.tipo));
  if (!quem.some((c) => c.hp < maxHpEfetivo(c))) return { ok: false, why: 'ninguém precisa de cura' };
  sc.slots[circulo] -= 1;
  const cura = new Map(quem.map((c) => [c, 0]));
  for (let i = 0; i < spell.frutos; i++) {
    // A fruta vai para quem está mais ferido (menor fração de PV).
    const alvo = quem.filter((c) => c.hp < maxHpEfetivo(c)).sort((a, b) => a.hp / maxHpEfetivo(a) - b.hp / maxHpEfetivo(b))[0];
    if (!alvo) break;
    const antes = alvo.hp;
    alvo.hp = Math.max(antes, Math.min(maxHpEfetivo(alvo), Math.max(0, antes) + 1));
    if (antes <= 0 && alvo.hp > 0) acordar(alvo);
    cura.set(alvo, cura.get(alvo) + 1);
  }
  return { ok: true, circulo, curas: [...cura].filter(([, n]) => n > 0).map(([alvo, n]) => ({ alvo, cura: n })) };
}

/**
 * Descanso longo inteiro.
 *
 * `alimentado` diz se a pessoa teve o dia de comida e de água: o livro só
 * tira um degrau de exaustão de quem descansou COM comida e bebida. Sem a
 * informação (arena, descanso de cena), vale alimentado — fora da viagem o
 * jogo não conta mantimento.
 */
export function descansoLongo(c, { alimentado = true } = {}) {
  if (c.dead) return;
  acordar(c);
  // Ninguém dorme oito horas em Fúria. O combate já a encerra (`checkEnd`),
  // mas uma Fúria entrada fora de luta ficaria até o fim dos tempos.
  if (getCondition(c, 'furia')) { removeCondition(c, 'furia'); c.furiaAgiu = false; }
  if (nivelDeExaustao(c) > 0 && alimentado) mudarExaustao(c, -1);
  // Reviver os Mortos: a penalidade de quem voltou cai de 1 por descanso longo.
  const volta = getCondition(c, 'revivido');
  if (volta) {
    volta.data ??= {};
    volta.data.penalidade = (volta.data.penalidade ?? 0) - 1;
    if (volta.data.penalidade <= 0) removeCondition(c, 'revivido');
  }
  // O mal da água parada (`rules/mantimentos.js`) passa dormindo. Regra da
  // casa: o livro não dá duração para água ruim.
  if (c.maldaAgua) { removeCondition(c, 'envenenado'); c.maldaAgua = false; }
  c.hp = maxHpEfetivo(c);
  c.tempHp = 0;
  const nivel = c.level ?? 1;
  // Poção de vitalidade: no descanso seguinte, os dados de vida voltam TODOS.
  c.dadosDeVidaRestantes = c.dadosDeVidaCheios
    ? nivel
    : Math.min(nivel, dadosDeVida(c) + Math.max(1, Math.floor(nivel / 2)));
  c.dadosDeVidaCheios = false;
  for (const [id, max] of Object.entries(c.resourcesMax ?? {})) c.resources[id] = max;
  if (c.spellcasting?.slotsMax) c.spellcasting.slots = c.spellcasting.slotsMax.slice();
  if (c.magiaGratis) c.magiaGratis.usada = false;
}
