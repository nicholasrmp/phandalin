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
import { removeCondition } from './conditions.js';

/** Recursos que voltam no descanso curto. Os outros só no longo. */
const VOLTAM_NO_CURTO = new Set(['secondWind', 'actionSurge', 'channelDivinity', 'ki', 'wildShape']);

export const dadoDeVida = (c) => CLASSES[c.classe]?.dadoDeVida ?? 8;
export const dadosDeVida = (c) => (c.dadosDeVidaRestantes ??= c.level ?? 1);

/**
 * Gasta UM dado de vida e cura. Devolve { rolagem, cura, restam } ou null
 * se não há dado, o personagem está com a vida cheia ou morto.
 */
export function gastarDadoDeVida(rng, c) {
  if (c.dead || c.hp >= c.maxHp || dadosDeVida(c) <= 0) return null;
  const lados = dadoDeVida(c);
  const rolagem = rng.die(lados);
  const con = abilityMod(c.abilities.con);
  const cura = Math.max(0, rolagem + con);
  c.dadosDeVidaRestantes -= 1;
  const antes = Math.max(0, c.hp);
  c.hp = Math.min(c.maxHp, antes + cura);
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
  const falta = c.maxHp - c.hp;
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

/** Descanso longo inteiro. */
export function descansoLongo(c) {
  if (c.dead) return;
  acordar(c);
  c.hp = c.maxHp;
  c.tempHp = 0;
  const nivel = c.level ?? 1;
  c.dadosDeVidaRestantes = Math.min(nivel, dadosDeVida(c) + Math.max(1, Math.floor(nivel / 2)));
  for (const [id, max] of Object.entries(c.resourcesMax ?? {})) c.resources[id] = max;
  if (c.spellcasting?.slotsMax) c.spellcasting.slots = c.spellcasting.slotsMax.slice();
  if (c.magiaGratis) c.magiaGratis.usada = false;
}
