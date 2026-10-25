// O FAMILIAR (Convocar Familiar, SRD 5.1): o bicho miúdo que o conjurador chama.
//
// ONDE MORA. O registro dele fica na campanha (`campanha.utilidade.familiar`:
// { defId, opcao, nome, dono, hp, maxHp }) e sobrevive de cena em cena. No
// TABULEIRO ele só existe dentro de uma luta: `entrarNoEncontro` o põe junto do
// dono quando o encontro começa (como uma criatura invocada, `combat.js` →
// `invocar`) e `sairDoEncontro` guarda os PV de volta quando o encontro acaba.
// Fora da luta (exploração, conversa) ele é o "olho" do dono: a magia Sentidos
// da Fera e a ação "Ver pelos olhos do familiar" o mandam espiar uma casa.
//
// REGRAS. Não ataca (a ficha não tem ataques). Cai a 0 PV e some: o conjurador
// refaz a magia. Um por vez (conjurar de novo troca de forma).
//
// POR QUE NÃO FICA NA EXPLORAÇÃO COMO COMBATENTE: as cenas (`game/capitulo*.js`)
// listam "os heróis" como todo combatente do lado do grupo (XP, conversas,
// testes). Um bicho de 1 PV ali dentro quebraria essas contas, e uma criatura
// invocada já sai do tabuleiro quando o encontro acaba. O familiar segue a
// mesma porta: entra com a luta.

import { getSpell } from './spells.js';

const ID_DA_MAGIA = 'encontrarFamiliar';

/** O registro do familiar do grupo (ou null). */
export const familiarDe = (estado) => (estado?.familiar && estado.familiar.hp > 0 ? estado.familiar : null);

/**
 * Um familiar "de papel", para as magias fora do combate o escolherem como alvo
 * (Sentidos da Fera) quando ele não está no tabuleiro.
 */
export function familiarVirtual(estado, dono) {
  const f = familiarDe(estado);
  if (!f) return null;
  return { id: 'familiar', familiar: true, name: `${f.nome} (familiar)`, tipo: 'fera', side: 'party', dead: false, hp: f.hp, pos: dono?.pos ?? null };
}

/** Põe o familiar do grupo no encontro, junto de quem o chamou. Devolve a criatura ou null. */
export function entrarNoEncontro(enc, estado) {
  const f = familiarDe(estado);
  if (!f) return null;
  if (enc.combatants.some((c) => c.familiar)) return null;
  const vivos = enc.allOf('party').filter((c) => !c.dead && c.hp > 0 && !c.invocado);
  const dono = vivos.find((c) => c.id === f.dono) ?? vivos.find((c) => c.spellcasting) ?? vivos[0];
  if (!dono) return null;
  const m = enc.invocar(dono, f.defId, dono.pos, { spellId: ID_DA_MAGIA });
  if (!m) return null;
  m.familiar = true;
  m.invocado.familiar = true;
  m.name = f.nome === 'Rato' || f.nome === 'Morcego' ? `${f.nome} de ${dono.name}` : f.nome;
  m.className = 'Familiar';
  m.hp = Math.min(f.hp, m.maxHp);
  enc.say('magia', `${m.name} corre para o lado de ${dono.name}.`);
  return m;
}

/**
 * Guarda os PV do familiar no registro (o encontro acabou ou ele foi dispensado).
 * Se caiu, o registro some. Devolve true se o familiar morreu.
 */
export function sairDoEncontro(estado, c) {
  if (!c?.familiar || !estado?.familiar) return false;
  if (c.dead || c.hp <= 0) {
    estado.familiar = null;
    return true;
  }
  estado.familiar.hp = c.hp;
  return false;
}

/** Texto do painel: o que o familiar é. */
export const descricaoDoFamiliar = () => getSpell(ID_DA_MAGIA).desc;
