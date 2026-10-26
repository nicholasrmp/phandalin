// AS AÇÕES DA FICHA, vistas de fora (F5.2, MULTIJOGADOR.md J-11).
//
// Numa partida de sala o jogador de fora usa a MESMA barra de ações do anfitrião (`view/hud.js`), mas quem executa é o
// anfitrião: a barra manda uma `action` ({ kind: 'attack', weaponId }, { kind: 'spell', spellId }…), e o jogo dele a roda
// como se o clique fosse seu. Este arquivo tem o que os dois lados precisam saber sem tela e sem motor:
//
//   - quais `action` o servidor aceita, e se a forma delas é válida (o servidor confere antes de repassar);
//   - quais ações o convidado manda NA HORA e quais entram em modo de alvo (e esperam o clique numa casa);
//   - a regra de quais magias saem na hora e quais pedem alvo, que o `chooseAction` do anfitrião também usa, para os dois
//     nunca discordarem.
//
// Puro: roda em Node.

/** Os `kind` que o jogador de fora pode pedir. O resto da barra (salto de exploração, círculo isolado…) é do anfitrião. */
export const KINDS_REMOTOS = [
  'attack', 'spell', 'item', 'dash', 'dodge', 'disengage', 'sacar', 'standUp', 'escape', 'stabilize',
  'despertar', 'feature', 'salto', 'examinar', 'investigar', 'arrancarGrudado',
];

/** Ações que o convidado manda no ato, sem escolher alvo (quem as executa é o anfitrião). */
const NA_HORA = new Set(['dash', 'dodge', 'disengage', 'sacar', 'standUp', 'escape', 'stabilize', 'despertar', 'feature', 'examinar', 'investigar', 'arrancarGrudado']);

const ID_CURTO = (v) => v === undefined || v === null || (typeof v === 'string' && v.length > 0 && v.length <= 40);

/**
 * A forma de uma `action` que vem de fora. Só confere tipos e tamanhos (o servidor não conhece as regras): se o herói
 * pode MESMO fazer aquilo, quem decide é o motor do anfitrião.
 */
export function acaoRemotaValida(a) {
  if (!a || typeof a !== 'object' || Array.isArray(a)) return false;
  if (!KINDS_REMOTOS.includes(a.kind)) return false;
  for (const k of ['weaponId', 'spellId', 'itemId', 'targetId', 'featureId', 'modo', 'zona']) if (!ID_CURTO(a[k])) return false;
  if (a.mira !== undefined && typeof a.mira !== 'boolean') return false;
  return true;
}

/** `tiles`: as casas clicadas (até 6, para magia de vários alvos); `circulo`: o círculo da magia, se escolhido. */
export function tilesValidos(tiles) {
  return tiles === undefined || (Array.isArray(tiles) && tiles.length <= 6
    && tiles.every((t) => t && Number.isInteger(t.x) && Number.isInteger(t.y) && t.x >= 0 && t.y >= 0 && t.x <= 400 && t.y <= 400));
}
/** O círculo 0 é o truque (a barra o manda assim): vale. */
export const circuloValido = (c) => c === undefined || c === null || (Number.isInteger(c) && c >= 0 && c <= 9);

/** A magia sai na hora, sem pedir alvo (Vida Falsa, Borrão, Espíritos Guardiões…). `ativa`: ela já está ativa no conjurador. */
export const magiaNaHora = (spell, ativa) => spell.kind === 'tempHp' || spell.kind === 'aura' || spell.kind === 'disparada'
  || spell.kind === 'reacao' || spell.kind === 'frutos' || spell.kind === 'rastro' || spell.kind === 'invocar'
  || (spell.kind === 'buff' && spell.rangeFt === 0)
  || (['lamina', 'curaReuso'].includes(spell.kind) && !ativa);

/** A magia de vários alvos (Bênção, Míssil Mágico) escolhe um por clique. */
export const escolheVarios = (spell) => ['buff', 'debuff', 'auto', 'raios', 'healGrupo'].includes(spell.kind) || (spell.kind === 'save' && !!spell.alvos);

/**
 * O convidado manda esta ação AGORA (sem esperar um clique no tabuleiro)? `spell` é a magia (ou null) e `ativa` diz se ela
 * já está ativa no conjurador.
 */
export function mandaNaHora(action, spell = null, ativa = false) {
  if (NA_HORA.has(action.kind)) return true;
  if (action.kind === 'item') return !action.mira;
  if (action.kind === 'spell') return Boolean(spell) && magiaNaHora(spell, ativa);
  return false;
}
