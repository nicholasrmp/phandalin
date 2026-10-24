// Luz, escuridão e visão no escuro (Livro do Jogador).
//
// TRÊS NÍVEIS de luz numa casa: 2 claro, 1 penumbra, 0 escuro. O mapa diz a
// luz de fundo de cada casa (`field.luz`; sem ela, tudo claro — a estrada de
// dia). Fontes acendem em volta: a tocha dá 20 pés de luz clara e mais 20 de
// penumbra; o mapa pode ter as suas (fogueira, braseiro) em `field.luzes`.
//
// QUEM VÊ O QUÊ. Uma criatura vê uma casa se tem linha de visão até ela e a
// casa tem alguma luz — ou se a casa está no alcance da visão no escuro dela
// (que enxerga o escuro como penumbra). Na escuridão total, sem visão no
// escuro, não se vê nada.
//
// NO COMBATE: atacar quem não se vê dá desvantagem; ser atacado por quem não
// se vê dá vantagem ao atacante. As duas se anulam, como manda a regra.
//
// TOCHA. Acender e apagar é interação com objeto, de graça. A tocha mostra o
// caminho e revela quem a carrega: um goblin com visão no escuro vê o herói
// iluminado de longe. É a escolha tática da caverna.

import { distanceFt } from '../core/grid.js';

export const CLARO = 2;
export const PENUMBRA = 1;
export const ESCURO = 0;

const TOCHA = { claro: 20, penumbra: 20 };

// Quem tem visão no escuro (60 pés), pela ancestralidade do herói ou pela
// família do monstro, quando a ficha não diz.
const ANCESTRAIS_COM_VISAO = /an[ãa]o|elf|meio-orc|gnom|tifer|tiefling/i;
const MONSTROS_COM_VISAO = /goblin|bugbear|hobgoblin|orc|klarg|yeemik|droop|grol/i;

/** Alcance da visão no escuro, em pés (0 = não tem). */
export function visaoNoEscuro(c) {
  if (c.visaoNoEscuro != null) return c.visaoNoEscuro;
  if (c.senses?.darkvisionFt) return c.senses.darkvisionFt;
  if (c.kind === 'pc') return ANCESTRAIS_COM_VISAO.test(`${c.ancestry ?? ''} ${c.raca ?? ''}`) ? 60 : 0;
  return MONSTROS_COM_VISAO.test(`${c.id ?? ''} ${c.name ?? ''}`) ? 60 : 0;
}

/** O mapa tem escuridão? Sem ela nada disto roda — a estrada de dia não paga a conta. */
export const temEscuridao = (field) => Boolean(field.luz);

/** As fontes de luz agora: tochas acesas de quem está vivo, e as do mapa. */
export function fontesDeLuz(enc) {
  const fontes = [];
  for (const c of enc.combatants) {
    if (c.tochaAcesa && !c.dead) fontes.push({ pos: c.pos, ...TOCHA });
  }
  for (const f of enc.field.luzes ?? []) fontes.push(f);
  return fontes;
}

/** O nível de luz numa casa, com as fontes já calculadas. */
export function nivelDeLuz(field, x, y, fontes) {
  let nivel = field.luz ? field.luz[y * field.w + x] : CLARO;
  for (const f of fontes) {
    if (nivel === CLARO) break;
    const d = distanceFt(f.pos, { x, y });
    if (d <= f.claro) nivel = CLARO;
    else if (d <= f.claro + f.penumbra) nivel = Math.max(nivel, PENUMBRA);
  }
  return nivel;
}

/**
 * Como `obs` vê a casa `pos`: 0 não vê, 1 vê em penumbra, 2 vê claro.
 * `fontes` é opcional (calcula se faltar).
 */
export function comoVe(enc, obs, pos, fontes = null) {
  const field = enc.field;
  if (!temEscuridao(field)) return CLARO;
  if (obs.pos.x === pos.x && obs.pos.y === pos.y) return CLARO;
  if (!field.hasLineOfSight(obs.pos, pos)) return ESCURO;
  const luz = nivelDeLuz(field, pos.x, pos.y, fontes ?? fontesDeLuz(enc));
  if (luz > ESCURO) return luz;
  return distanceFt(obs.pos, pos) <= visaoNoEscuro(obs) ? PENUMBRA : ESCURO;
}

export const podeVer = (enc, obs, alvo) => comoVe(enc, obs, alvo.pos) > ESCURO;

/**
 * Vantagem e desvantagem pela luz, no formato de `attackModifiers`. `fonte`
 * é a função de lá que registra a origem de cada uma.
 */
export function modificadoresDeLuz(enc, atacante, alvo, mods, fonte) {
  if (!temEscuridao(enc.field)) return;
  if (!podeVer(enc, atacante, alvo)) fonte(mods, 'desvantagem', 'alvo oculto no escuro');
  if (!podeVer(enc, alvo, atacante)) fonte(mods, 'vantagem', 'atacante oculto no escuro');
}

/**
 * O que o grupo vê, casa por casa: Map 'x,y' → 1 (penumbra) ou 2 (claro).
 * Casa ausente = ninguém do grupo vê. Guardado enquanto nada que importa
 * muda (posições, tochas), porque o tabuleiro pergunta a cada quadro.
 */
export function visaoDoGrupo(enc) {
  const grupo = enc.combatants.filter((c) => c.side === 'party' && !c.dead);
  const chave = grupo.map((c) => `${c.pos.x},${c.pos.y},${c.tochaAcesa ? 1 : 0}`).join('|')
    + `#${(enc.field.luzes ?? []).length}`;
  if (enc._visao?.chave === chave) return enc._visao.mapa;
  const fontes = fontesDeLuz(enc);
  const mapa = new Map();
  const { w, h } = enc.field;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let melhor = ESCURO;
      for (const c of grupo) {
        melhor = Math.max(melhor, comoVe(enc, c, { x, y }, fontes));
        if (melhor === CLARO) break;
      }
      if (melhor > ESCURO) mapa.set(`${x},${y}`, melhor);
    }
  }
  enc._visao = { chave, mapa };
  return mapa;
}
