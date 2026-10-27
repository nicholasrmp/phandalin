// O SAQUE DE UM CORPO (menu do botão direito, `game/interacoes.js`).
//
// Só se larga o que `TESOURO_POR_INIMIGO` (`rules/items/phandelver.js`) diz que aquele inimigo carrega: nada de moeda
// nem de objeto inventado para o corpo que não está na tabela. A chave é o id da PESSOA (`npcId`: Iarno, Nezznar) ou,
// sem ele, o do bloco de estatística (`defId`).
//
// Fora da luta o saque é de graça; na luta custa a ação do turno (como o "Revistar" do capítulo 1). Uma vez por corpo.
// Puro: roda em Node.

import { TESOURO_POR_INIMIGO } from '../rules/items/phandelver.js';
import { WEAPONS, garantirInventario, nomeDeId } from '../rules/equipment.js';
import { guardar } from './comercio.js';

/** A chave do corpo na tabela de tesouro, ou null (o corpo não carrega nada de nota). */
export const chaveDoTesouro = (m) => [m?.npcId, m?.defId].find((k) => k && TESOURO_POR_INIMIGO[k]) ?? null;

/**
 * Alguém do grupo (vivo ou morto: passe `combatants` do lado do grupo, não só os vivos) já tem esta peça?
 * As cenas entregam o cajado ao fim da luta e o saque entrega o mesmo: confira antes de dar, nos dois sentidos.
 */
export const grupoTem = (grupo, id) => grupo.some((h) => (h.weapons ?? []).includes(id)
  || garantirInventario(h).bag.some((e) => e.id === id && e.qtd > 0));

/** O que o corpo ainda larga: a lista da tabela, menos a peça única que o grupo já tem. */
export function tesouroDoCorpo(corpo, grupo = []) {
  const chave = chaveDoTesouro(corpo);
  if (!chave) return [];
  const entregues = corpo.pecasEntregues ?? [];
  return TESOURO_POR_INIMIGO[chave].filter((id) => !entregues.includes(id) && (WEAPONS[id] ? !grupoTem(grupo, id) : true));
}

/** Por que `c` não pode revistar `corpo` agora (`null` = pode). `enc.over`/`enc.explorando` dizem se há turno. */
export function porqueNaoSaquear(enc, c, corpo) {
  if (!c) return 'selecione um herói primeiro';
  if (corpo.saqueado) return 'já revistado';
  // `contato` respeita parede e porta (e aceita a mesma casa): o corpo atrás de um muro não se revista.
  if (!enc.field.contato(c.pos, corpo.pos)) return 'encoste no corpo primeiro';
  const fora = enc.over || enc.explorando;
  if (!fora && c.actionUsed) return 'a ação deste turno já foi usada';
  return null;
}

/** Revista o corpo: guarda o tesouro em `c` e devolve `{ ok, why?, achados }` (ids, na ordem da tabela). */
export function saquearCorpo(enc, c, corpo, grupo = []) {
  const why = porqueNaoSaquear(enc, c, corpo);
  if (why) return { ok: false, why };
  const achados = tesouroDoCorpo(corpo, grupo);
  corpo.saqueado = true;
  corpo.pecasEntregues = [...(corpo.pecasEntregues ?? []), ...achados];
  if (!(enc.over || enc.explorando)) c.actionUsed = true;
  for (const id of achados) {
    if (WEAPONS[id]) (c.weapons ??= []).push(id);
    else guardar(c, id, 1);
  }
  enc.say('acao', achados.length
    ? `${c.name} revista ${corpo.name} e leva: ${achados.map((id) => nomeDeId(id).toLowerCase()).join(', ')}.`
    : `${c.name} revista ${corpo.name} e não acha nada que valha.`);
  return { ok: true, achados };
}
