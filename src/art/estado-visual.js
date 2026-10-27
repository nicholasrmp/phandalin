// O ESTADO QUE SE VÊ NA FIGURA, escolhido por uma função pura (roda em Node).
//
// A Fúria do Grask tem folha própria (`grask-<armadura>-<arma>~furia`: a mesma
// figura com a aura vermelha de um pixel em volta, feita por `reskins-grask.py`
// sem gastar geração). A arte estava pronta e carregada, mas NADA pedia o
// estado: a chave de look só ganha `~furia` quando alguém a monta com
// `comEstado`, e as regras (condição `furia`, `useFeature('rage')`) nunca
// tocam no look. Quem desenha pergunta aqui.
//
//   - A chave de look NÃO é reescrita no combatente: o estado é uma leitura da
//     condição, a cada quadro. A Fúria acaba (fim da luta, um turno sem brigar,
//     inconsciente) e a figura volta sozinha, sem ninguém ter de lembrar de
//     desligar nada — e `ficha.js` (trocar de arma em Fúria) continua certo.
//   - Quem NÃO tem folha de Fúria (o bárbaro de NPC, qualquer figura sem arte
//     do estado) ganha a aura procedural: tinta vermelha pulsando sobre a
//     figura, o mesmo recurso da tinta de dano do tabuleiro.
//
// `temFolhaNoEstado(look, estado)` vem de `art/folhas/index.js` (que carrega
// PNG e por isso não roda em Node): entra por parâmetro.

import { hasCondition } from '../rules/conditions.js';

/** A chave de look com um ESTADO ligado (`barbarian@x~furia`) ou desligado (a chave limpa). */
export function comEstado(look, estado, ligado) {
  const semEstado = String(look).split('~')[0];
  return ligado ? `${semEstado}~${estado}` : semEstado;
}

/** Que estado a figura mostra agora? `null` é a figura normal. */
export function estadoVisualDe(c) {
  return c && !c.dead && hasCondition(c, 'furia') ? 'furia' : null;
}

/**
 * O que desenhar. `{ look, estado, aura }`:
 *   look   a chave para `getSheet` (com `~furia` só se a figura TEM folha de Fúria);
 *   estado o estado visual ('furia' ou null);
 *   aura   'folha' (a arte do estado já traz a aura), 'procedural' (a tinta
 *          vermelha cobre a falta de arte) ou null (não enfurecido).
 */
export function aparenciaDaFigura(c, temFolhaNoEstado = () => false) {
  const estado = estadoVisualDe(c);
  if (!estado) return { look: String(c.look).split('~')[0], estado: null, aura: null };
  if (temFolhaNoEstado(c.look, estado)) return { look: comEstado(c.look, estado, true), estado, aura: 'folha' };
  return { look: String(c.look).split('~')[0], estado, aura: 'procedural' };
}

/**
 * A tinta da aura procedural, ou null. Pulsa devagar (o tabuleiro passa o
 * relógio dele em segundos): ~1,6 Hz, força de 0,16 a 0,30 — a figura segue
 * reconhecível por baixo, só esquenta.
 */
export function tintaDaAura(aparencia, tempo = 0) {
  if (aparencia?.aura !== 'procedural') return null;
  return { color: '#d62820', strength: 0.23 + 0.07 * Math.sin(tempo * 10) };
}
