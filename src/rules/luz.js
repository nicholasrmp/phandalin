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

const TOCHA = { claro: 20, penumbra: 20, tipo: 'tocha' };
// Luzes Dançantes: cada luzinha emite só penumbra num raio de 3 m (10 pés), sem luz clara.
const LUZINHAS = { claro: -1, penumbra: 11, tipo: 'magica' };
// O truque Luz (e o Brilho do Caos): a mesma medida da tocha, mas luz de magia — branca, sem chama.
const LUZ_MAGICA = { claro: 20, penumbra: 20, tipo: 'magica' };

/**
 * A APARÊNCIA DE CADA FONTE, como o Foundry dá a cada luz: a COR e a ANIMAÇÃO. Só o desenho lê
 * (`tabuleiro-topo.js pocaDeLuz`); a regra não liga para a cor. Cada luz do mapa pode trazer as suas (`cor`,
 * `animacao`); sem elas, vale a do tipo.
 *   fogo    a chama que treme sem repetir o compasso (fogueira, tocha, braseiro)
 *   vela    a chama pequena, que oscila devagar
 *   pulso   a luz de magia, que respira
 *   fixa    a lanterna fechada, o cristal: não se mexe
 */
export const APARENCIA_DA_LUZ = {
  fogueira: { cor: '#ff9a3c', animacao: 'fogo' },
  tocha: { cor: '#ffb15a', animacao: 'fogo' },
  braseiro: { cor: '#ff7a2a', animacao: 'fogo' },
  vela: { cor: '#ffd27a', animacao: 'vela' },
  lanterna: { cor: '#ffe2a0', animacao: 'fixa' },
  magica: { cor: '#6fa8ff', animacao: 'pulso' },
  fungo: { cor: '#8bff9a', animacao: 'pulso' },
  luar: { cor: '#9fb6ff', animacao: 'fixa' },
};
export const ANIMACOES_DA_LUZ = ['fogo', 'vela', 'pulso', 'fixa'];
export const aparenciaDaLuz = (f) => ({ ...(APARENCIA_DA_LUZ[f.tipo] ?? APARENCIA_DA_LUZ.tocha), ...(f.cor ? { cor: f.cor } : {}), ...(f.animacao ? { animacao: f.animacao } : {}) });

/**
 * A casa `p` está dentro do CONE da fonte? A luz sem `angulo` (ou com 360) acende em volta; a lanterna coberta acende
 * só para onde aponta: `direcao` em graus (0 = leste, 90 = sul, como a tela), `angulo` a abertura inteira. A casa da
 * própria fonte está sempre acesa.
 */
export function dentroDoCone(f, p) {
  const ang = Number(f.angulo);
  if (!ang || ang >= 360) return true;
  const dx = p.x - f.pos.x;
  const dy = p.y - f.pos.y;
  if (!dx && !dy) return true;
  const rumo = (Math.atan2(dy, dx) * 180) / Math.PI;
  let diff = Math.abs(((rumo - (Number(f.direcao) || 0)) % 360 + 540) % 360 - 180);
  // a casa é um quadrado, não um ponto: meia casa de folga na borda do cone, para ele não sair serrilhado
  diff -= (Math.atan2(0.5, Math.hypot(dx, dy)) * 180) / Math.PI;
  return diff <= ang / 2;
}

/**
 * A ESCURIDÃO DA CENA, de 0 (dia) a 1 (noite fechada) — o "darkness level" do Foundry. Refaz a luz de base do mapa:
 * ao ar livre, abaixo de 0,35 é dia (sem grade de luz), até 0,7 é entardecer (penumbra em toda parte) e daí para
 * cima é noite (breu, e só a luz que alguém acende). Num mapa que já tem a sua luz (a caverna, a clareira), a noite
 * só pode escurecer: cada casa fica com o MENOR entre a luz dela e a da hora. As luzes `soNoEscuro` acendem sozinhas
 * quando a escuridão passa do limiar delas (`fontesDeLuz`). Devolve se mudou.
 */
export function definirEscuridao(field, nivel) {
  const n = Math.max(0, Math.min(1, Number(nivel) || 0));
  if (field.escuridao === n && field.luzDoMapa !== undefined) return false;
  if (field.luzDoMapa === undefined) field.luzDoMapa = field.luz ? Uint8Array.from(field.luz) : null;
  field.escuridao = n;
  const base = n >= 0.7 ? ESCURO : n >= 0.35 ? PENUMBRA : CLARO;
  const original = field.luzDoMapa;
  if (!original && base === CLARO) field.luz = null;
  else {
    const g = new Uint8Array(field.w * field.h);
    for (let i = 0; i < g.length; i++) g[i] = original ? Math.min(original[i], base) : base;
    field.luz = g;
  }
  field.versao = (field.versao ?? 0) + 1;
  return true;
}

/** A luz do mapa que só acende no escuro (o lampião da rua, a janela acesa) está apagada com a cena clara. */
export const acesaNaEscuridao = (f, field) => f.soNoEscuro == null || (field?.escuridao ?? 0) >= f.soNoEscuro;

// Quem tem visão no escuro (60 pés), pela ancestralidade do herói ou pela
// família do monstro, quando a ficha não diz.
const ANCESTRAIS_COM_VISAO = /an[ãa]o|elf|meio-orc|gnom|tifer|tiefling/i;
// ÚLTIMO recurso, e só para quem não trouxe `senses` na ficha: os blocos dos
// goblinoides e do esqueleto declaram `senses.darkvisionFt` e não passam por
// aqui. Ancorado no começo da palavra de propósito — solto, "orc" dava 60 pés
// de visão no escuro a qualquer criatura com "orc" no meio do nome.
const MONSTROS_COM_VISAO = /\b(goblin|bugbear|hobgoblin|orc|klarg|yeemik|droop|grol|esqueleto|skeleton)/i;

/** Alcance da visão no escuro, em pés (0 = não tem). */
export function visaoNoEscuro(c) {
  // A magia Visão no Escuro soma-se à natural: vale o maior dos dois alcances.
  const magia = hasCondition(c, 'visaoNoEscuro') ? CONDITIONS.visaoNoEscuro.alcanceFt : 0;
  return Math.max(magia, visaoNatural(c));
}

function visaoNatural(c) {
  // VISÃO DO DIABO (invocação do bruxo): enxerga no escuro a 36 m, o mágico também.
  if (c.features?.includes('devilsSight')) return Math.max(120, c.visaoNoEscuro ?? 0);
  // O TERCEIRO OLHO (Adivinhação, 10º) e a PEDRA DO TRANSMUTADOR: visão no escuro até 18 m.
  if (c.features?.includes('thirdEye') || c.features?.includes('stoneDarkvision')) return Math.max(60, c.visaoNoEscuro ?? 0);
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
export const emiteLuz = (c) => !c.dead && Boolean(c.tochaAcesa || hasCondition(c, 'luzMagica') || hasCondition(c, 'luzesDancantes') || hasCondition(c, 'brilhoCaos'));

/** As fontes de luz agora: tochas e truques Luz de quem está vivo, e as do mapa. */
export function fontesDeLuz(enc) {
  const fontes = [];
  for (const c of enc.combatants) {
    if (emiteLuz(c)) fontes.push({ pos: c.pos, ...(c.tochaAcesa ? TOCHA : hasCondition(c, 'luzMagica') || hasCondition(c, 'brilhoCaos') ? LUZ_MAGICA : LUZINHAS) });
  }
  // A luz do mapa que alguém apagou (`game/fogo.js`) continua no mapa — para poder ser acesa de novo —, mas não acende nada.
  // E a que só acende no escuro (`soNoEscuro`) espera a cena escurecer.
  for (const f of enc.field.luzes ?? []) if (!f.apagada && acesaNaEscuridao(f, enc.field)) fontes.push(f);
  // Luz do Dia: uma esfera de luz plena e mais uma de penumbra, num ponto.
  for (const z of enc.zonas ?? []) if (z.luz && z.centro) fontes.push({ pos: z.centro, claro: z.luz.claro, penumbra: z.luz.penumbra, tipo: 'magica', cor: '#fff6dc' });
  return fontes;
}

/**
 * O nível de luz numa casa, com as fontes já calculadas.
 *
 * A luz PARA na parede. Antes a conta era só distância, e uma tocha acendia a
 * sala do lado através da rocha: pondo braseiros nos cômodos da Mansão
 * Tresendar, o vigia da caverna passou a ser visto de 106 casas em vez de 1,
 * com pedra maciça no caminho. Agora cada fonte precisa enxergar a casa.
 */
export function nivelDeLuz(field, x, y, fontes) {
  let nivel = field.luz ? field.luz[y * field.w + x] : CLARO;
  for (const f of fontes) {
    if (nivel === CLARO) break;
    const d = distanceFt(f.pos, { x, y });
    if (d > f.claro + f.penumbra) continue;
    if (!dentroDoCone(f, { x, y })) continue;
    // `field` nem sempre é um `Battlefield` cheio (há chamada com campo de
    // teste): sem a função, vale a conta antiga, só de distância.
    // a reta da LUZ, que pergunta a cada aresta a restrição de luz (a janela deixa, a parede etérea não)
    if (d > 0 && field.hasLineOfSight && !field.hasLineOfSight(f.pos, { x, y }, 'luz')) continue;
    if (d <= f.claro) nivel = CLARO;
    else nivel = Math.max(nivel, PENUMBRA);
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
  // SENTIDOS SELVAGENS (patrulheiro, 18º): não ver o alvo não impõe desvantagem ao ataque.
  if (!podeVer(enc, atacante, alvo) && !atacante.features?.includes('feralSenses')) fonte(mods, 'desvantagem', 'alvo oculto no escuro');
  if (!podeVer(enc, alvo, atacante)) fonte(mods, 'vantagem', 'atacante oculto no escuro');
}

/**
 * O que o grupo vê, casa por casa: Map 'x,y' → 1 (penumbra) ou 2 (claro).
 * Casa ausente = ninguém do grupo vê. Guardado enquanto nada que importa
 * muda (posições, tochas), porque o tabuleiro pergunta a cada quadro.
 */
export function visaoDoGrupo(enc, quem = null) {
  // `quem` (F4.4, D3): só os heróis para quem ele devolve `true` olham. Num jogo de sala cada jogador vê o que os SEUS heróis
  // enxergam; sem nenhum deles em campo, vale o grupo todo (ninguém fica olhando o escuro). O resultado filtrado tem o seu
  // próprio guardado: o motor, que pergunta pelo grupo todo, e o tabuleiro, que pergunta pelo filtro, não se atropelam.
  let grupo = enc.combatants.filter((c) => c.side === 'party' && !c.dead);
  const proprios = quem ? grupo.filter(quem) : null;
  if (proprios?.length) grupo = proprios;
  const guarda = proprios?.length ? '_visaoDoFiltro' : '_visao';
  const chave = grupo.map((c) => `${c.pos.x},${c.pos.y},${emiteLuz(c) ? 1 : 0}`).join('|')
    // Cada luz do mapa conta se está ACESA, e não só quantas há: apagar uma fogueira e acender outra deixava a contagem
    // igual, e a visão guardada continuava valendo com o fogo errado (`game/fogo.js`).
    + `#${(enc.field.luzes ?? []).map((l) => (l.apagada ? 0 : 1)).join('')}#${casasEscondidas(enc)?.chave ?? ''}`
    + `#${(enc.zonas ?? []).filter((z) => z.luz).map((z) => z.id).join('.')}`
    // A cena que abre porta ou cava buraco no mapa sobe a versão.
    + `#${enc.field.versao ?? 0}`;
  if (enc[guarda]?.chave === chave) return enc[guarda].mapa;
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
  // A VISTA DO ALTO (a cena do telhado da guarnicao): casas que o grupo enxerga por cima de tudo,
  // dadas pela cena em `field.vistaExtra` (conjunto de 'x,y'). Quem a muda sobe `field.versao`.
  for (const k of enc.field.vistaExtra ?? []) if (!mapa.has(k)) mapa.set(k, CLARO);
  enc[guarda] = { chave, mapa };
  return mapa;
}
