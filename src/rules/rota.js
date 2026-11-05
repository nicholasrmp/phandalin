// A RÉGUA COM ESCALAS, como a do Foundry: o jogador marca casas no meio do caminho (Ctrl+clique) e o herói passa
// por elas, em vez de ir pelo caminho mais curto até o destino. Serve para contornar a armadilha que o grupo já
// achou, passar longe do goblin em vez de colado nele, entrar pela porta de cá e não pela de lá.
//
// A rota é montada trecho a trecho com o alcance de verdade do motor (`reachableFor`, a partir de cada escala e com
// o deslocamento que sobrou), então o custo dela é o mesmo que `moveAlong` cobra — terreno difícil, criatura
// atravessada, subida, rastejar. E ela já diz o que vai acontecer no caminho, antes do passo:
//   oportunidade   o inimigo à vista que leva a reação quando o herói sai do alcance dele (`ameacasNoPasso`)
//   regiao         a região à vista que dispara ao entrar e pega este herói (`rules/regioes.js`)
//
// Quem anda é `moveAlong`, pela mesma lista de casas: o que a régua mostra é o que acontece.
// Puro: roda em Node.

import { Battlefield, key } from '../core/grid.js';
import { regioesEm, regiaoPega } from './regioes.js';
import { MAX_ESCALAS, escalasValidas } from '../game/acoes.js';

// A forma das escalas que vêm da rede mora em `game/acoes.js`, que o servidor da sala também carrega.
export { MAX_ESCALAS, escalasValidas };

/** Os efeitos de região que valem um aviso: o que fere, prende, para ou leva embora. */
const EFEITOS_QUE_AVISAM = new Set(['dano', 'condicao', 'parar', 'teleporte']);

/**
 * A rota de `actor` passando por `escalas` (lista de `{x, y}`, na ordem) até `destino`.
 * Devolve `{ ok, caminho, custo, restante, escalas, avisos, motivo?, ate? }`:
 *   - `caminho`: as casas, da posição dele ao fim (até onde deu, se não deu tudo);
 *   - `ate`: a escala ou o destino que não se alcança com o que sobra (com `ok: false`);
 *   - `avisos`: `[{ x, y, tipo, texto, quem? }]`, na ordem do caminho.
 * `visivel(criatura)` diz quem o jogador enxerga (sem ele, todos): o aviso não entrega o inimigo escondido.
 */
export function tracarRota(enc, actor, escalas, destino, { visivel = () => true } = {}) {
  const sobra = actor.movementLeftFt ?? 0;
  const origem = { ...actor.pos };
  const caminho = [{ x: origem.x, y: origem.y }];
  const pontos = [...(escalas ?? []), destino];
  let custo = 0;
  let falha = null;
  try {
    for (let i = 0; i < pontos.length; i++) {
      const p = pontos[i];
      const ultimo = i === pontos.length - 1;
      const de = caminho.at(-1);
      if (de.x === p.x && de.y === p.y) continue;          // escala em cima de onde já se está: nada a andar
      actor.pos = { ...origem, x: de.x, y: de.y };
      const alcance = enc.reachableFor(actor, { orcamentoFt: sobra - custo });
      const no = alcance.get(key(p.x, p.y));
      // a escala pode ser casa de passagem (um aliado em cima); o destino, não: ninguém termina em cima de ninguém
      if (!no || (ultimo && no.parar === false) || (!ultimo && no.passar === false)) {
        falha = { motivo: enc.field.blocksMove(p.x, p.y) ? 'bloqueada' : (ultimo && no?.parar === false ? 'ocupada' : 'longe'), ate: { x: p.x, y: p.y } };
        break;
      }
      for (const q of Battlefield.pathFrom(alcance, p).slice(1)) caminho.push({ x: q.x, y: q.y });
      custo += no.cost;
    }
  } finally {
    actor.pos = origem;
  }
  const avisos = avisosDoCaminho(enc, actor, caminho, visivel);
  return {
    ok: !falha && caminho.length > 1,
    caminho,
    custo,
    restante: Math.max(0, sobra - custo),
    escalas: (escalas ?? []).map((e) => ({ x: e.x, y: e.y })),
    avisos,
    ...(falha ?? {}),
  };
}

/** O que acontece em cada passo de `caminho`: quem leva a reação, que região dispara. */
export function avisosDoCaminho(enc, actor, caminho, visivel = () => true) {
  const avisos = [];
  if (caminho.length < 2) return avisos;
  const origem = actor.pos;
  // Cada inimigo reage uma vez só (a reação é uma por rodada): avisa no primeiro passo que a provoca.
  const jaReagiu = new Set();
  try {
    for (let i = 1; i < caminho.length; i++) {
      const de = caminho[i - 1];
      const para = caminho[i];
      actor.pos = { ...origem, x: de.x, y: de.y };
      for (const e of enc.ameacasNoPasso?.(actor, de, para) ?? []) {
        if (jaReagiu.has(e.id) || !visivel(e)) continue;
        jaReagiu.add(e.id);
        avisos.push({ x: de.x, y: de.y, tipo: 'oportunidade', quem: e.id, texto: `ataque de oportunidade: ${e.name}` });
      }
      const antes = regioesEm(enc.field, { ...origem, x: de.x, y: de.y });
      for (const r of regioesEm(enc.field, { ...origem, x: para.x, y: para.y })) {
        if (antes.includes(r) || !r.quando.includes('entrar')) continue;
        // a escondida não se avisa: se o grupo a descobriu ela já não o pega, e se não descobriu ele não sabe dela
        if (r.escondida || !r.efeitos.some((ef) => EFEITOS_QUE_AVISAM.has(ef.tipo))) continue;
        if (!regiaoPega(enc, r, actor)) continue;
        avisos.push({ x: para.x, y: para.y, tipo: 'regiao', quem: r.id, texto: `entra em: ${r.nome ?? r.id}` });
      }
    }
  } finally {
    actor.pos = origem;
  }
  return avisos;
}

