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
// ZONAS QUE ESCONDEM. Uma zona de magia pode trazer `obscuro` (ver
// `spells.js`, `zona.obscuro`) e vale para a visão como a escuridão do mapa:
//   'pesada'  (Névoa Obscurecente) ninguém vê dentro dela nem através dela;
//   'magica'  (Escuridão, Fome de Hadar) quem está dentro é visto como no
//             breu total: nem a luz do mapa, nem a tocha, nem a visão no
//             escuro ajudam. Quem está dentro ainda vê o que está iluminado fora.
// Funciona em qualquer mapa, com ou sem `field.luz`.
//
// LUZ (truque). Quem a carrega (`luzMagica`) vale como uma tocha acesa que não
// se apaga: as mesmas medidas, a mesma pista para quem enxerga no escuro.
//
// TOCHA. Acender e apagar é interação com objeto, de graça. A tocha mostra o
// caminho e revela quem a carrega: um goblin com visão no escuro vê o herói
// iluminado de longe. É a escolha tática da caverna.

import { distanceFt, key } from '../core/grid.js';
import { hasCondition, CONDITIONS } from './conditions.js';

export const CLARO = 2;
export const PENUMBRA = 1;
export const ESCURO = 0;

const TOCHA = { claro: 20, penumbra: 20 };
// Luzes Dançantes: cada luzinha emite só penumbra num raio de 3 m (10 pés), sem luz clara.
const LUZINHAS = { claro: -1, penumbra: 11 };

// Quem tem visão no escuro (60 pés), pela ancestralidade do herói ou pela
// família do monstro, quando a ficha não diz.
const ANCESTRAIS_COM_VISAO = /an[ãa]o|elf|meio-orc|gnom|tifer|tiefling/i;
const MONSTROS_COM_VISAO = /goblin|bugbear|hobgoblin|orc|klarg|yeemik|droop|grol|esqueleto|skeleton/i;

/** Alcance da visão no escuro, em pés (0 = não tem). */
export function visaoNoEscuro(c) {
  // A magia Visão no Escuro soma-se à natural: vale o maior dos dois alcances.
  const magia = hasCondition(c, 'visaoNoEscuro') ? CONDITIONS.visaoNoEscuro.alcanceFt : 0;
  return Math.max(magia, visaoNatural(c));
}

function visaoNatural(c) {
  if (c.visaoNoEscuro != null) return c.visaoNoEscuro;
  if (c.senses?.darkvisionFt || c.senses?.truesightFt) {
    return Math.max(c.senses.darkvisionFt ?? 0, c.senses.truesightFt ?? 0);
  }
  if (c.kind === 'pc') return ANCESTRAIS_COM_VISAO.test(`${c.ancestry ?? ''} ${c.raca ?? ''}`) ? 60 : 0;
  return MONSTROS_COM_VISAO.test(`${c.id ?? ''} ${c.name ?? ''}`) ? 60 : 0;
}

/** O mapa tem escuridão? Sem ela nada disto roda — a estrada de dia não paga a conta. */
export const temEscuridao = (field) => Boolean(field.luz);

/**
 * As casas das zonas que escondem, por tipo. Guardado no encontro enquanto as
 * zonas não mudam: `comoVe` é chamado casa por casa.
 */
export function casasEscondidas(enc) {
  const zonas = (enc.zonas ?? []).filter((z) => z.obscuro || z.ilusao);
  if (!zonas.length) return null;
  const chave = zonas.map((z) => `${z.id}:${z.obscuro ?? 'ilusao'}:${z.casas.size}:${z.centro?.x ?? ''},${z.centro?.y ?? ''}`).join('|');
  if (enc._escondidas?.chave === chave) return enc._escondidas;
  const pesada = new Set();
  const magica = new Set();
  // Ilusão Menor: casa → lado de quem a conjurou (esse lado enxerga através).
  const ilusao = new Map();
  for (const z of zonas) {
    if (z.ilusao) { for (const k of z.casas) ilusao.set(k, z.lado); continue; }
    for (const k of z.casas) (z.obscuro === 'pesada' ? pesada : magica).add(k);
  }
  enc._escondidas = { chave, pesada, magica, ilusao };
  return enc._escondidas;
}

/** Há escuridão a calcular: a do mapa ou a de uma zona de magia? */
export const temEscuridaoEm = (enc) => temEscuridao(enc.field) || Boolean(casasEscondidas(enc));

/** Emite luz: tocha acesa ou o truque Luz. */
export const emiteLuz = (c) => !c.dead && Boolean(c.tochaAcesa || hasCondition(c, 'luzMagica') || hasCondition(c, 'luzesDancantes'));

/** As fontes de luz agora: tochas e truques Luz de quem está vivo, e as do mapa. */
export function fontesDeLuz(enc) {
  const fontes = [];
  for (const c of enc.combatants) {
    if (emiteLuz(c)) fontes.push({ pos: c.pos, ...(c.tochaAcesa || hasCondition(c, 'luzMagica') ? TOCHA : LUZINHAS) });
  }
  for (const f of enc.field.luzes ?? []) fontes.push(f);
  // Luz do Dia: uma esfera de luz plena e mais uma de penumbra, num ponto.
  for (const z of enc.zonas ?? []) if (z.luz && z.centro) fontes.push({ pos: z.centro, claro: z.luz.claro, penumbra: z.luz.penumbra });
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
  const zonas = casasEscondidas(enc);
  if (!temEscuridao(field) && !zonas) return CLARO;
  if (obs.pos.x === pos.x && obs.pos.y === pos.y) return CLARO;
  // Só uma Ilusão Menor num mapa claro: nada é escuro, só o que fica atrás da imagem.
  if (zonas && !temEscuridao(field) && !zonas.pesada.size && !zonas.magica.size) {
    for (const q of field.line(obs.pos, pos).slice(1, -1)) {
      const lado = zonas.ilusao.get(key(q.x, q.y));
      if (lado && lado !== obs.side) return ESCURO;
    }
    return CLARO;
  }
  if (!field.hasLineOfSight(obs.pos, pos)) return ESCURO;
  if (zonas) {
    // Névoa: quem olha de dentro, quem está dentro e o que fica do outro lado.
    if (zonas.pesada.size) {
      if (zonas.pesada.has(key(obs.pos.x, obs.pos.y))) return ESCURO;
      for (const q of field.line(obs.pos, pos)) if (zonas.pesada.has(key(q.x, q.y))) return ESCURO;
    }
    // Escuridão mágica: nada ilumina nem enxerga lá dentro.
    if (zonas.magica.has(key(pos.x, pos.y))) return ESCURO;
    // Ilusão Menor: a imagem tira a visão de quem a vê como objeto de verdade (o
    // outro lado) para o que está ATRÁS dela; a casa da própria imagem se vê.
    if (zonas.ilusao.size) {
      const linha = field.line(obs.pos, pos);
      for (let i = 1; i < linha.length - 1; i++) {
        const lado = zonas.ilusao.get(key(linha[i].x, linha[i].y));
        if (lado && lado !== obs.side) return ESCURO;
      }
    }
  }
  if (!temEscuridao(field)) return CLARO;
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
  if (!temEscuridaoEm(enc)) return;
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
  const chave = grupo.map((c) => `${c.pos.x},${c.pos.y},${emiteLuz(c) ? 1 : 0}`).join('|')
    + `#${(enc.field.luzes ?? []).length}#${casasEscondidas(enc)?.chave ?? ''}`
    + `#${(enc.zonas ?? []).filter((z) => z.luz).map((z) => z.id).join('.')}`
    // A cena que abre porta ou cava buraco no mapa sobe a versão.
    + `#${enc.field.versao ?? 0}`;
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
