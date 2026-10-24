// Experiência e subida de nível na campanha, como a aventura dá.
//
// A PRIMEIRA PARTE da aventura usa marcos, não XP por monstro: 75 XP para
// cada personagem ao achar o esconderijo e 275 ao limpá-lo — 350 no total,
// o bastante para o 2º nível (300). Daí em diante a aventura dá XP por
// monstro, armadilha, conversa e objetivo; quando chegar, entra aqui também.
//
// SUBIR é `subirNivel` (`rules/progressao.js`): vida, proficiência,
// características, recursos e espaços de magia. O que o motor não decide
// sozinho são as MAGIAS novas — quem as conhece aprende mais, o mago escreve
// duas no livro, quem prepara pode preparar mais uma. Isto calcula quais
// escolhas cada herói tem e aplica as que o jogador fizer (ou as sugeridas).

import { ganharXp, subirNivel, XP_POR_NIVEL } from '../rules/progressao.js';
import { abilityMod } from '../rules/abilities.js';
import { CLASSES, nomeDaCaracteristica } from '../rules/classes/index.js';
import { getSpell } from '../rules/spells.js';
import { listaDaClasse, magiaTemRegra } from './criacao.js';

/** As magias que costumam render mais no jogo, para a sugestão. */
const PREFERIDAS = ['curarFerimentos', 'palavraCurativa', 'misselMagico', 'sono', 'raioGuiado', 'bencao',
  'marcaDoCacador', 'bruxaria', 'escudoArcano', 'armaduraArcana', 'golpeColerico', 'escudoDaFe',
  'saraivadaDeEspinhos', 'heroismo', 'favorDivino', 'raioDeBruxa', 'ondaTrovejante', 'fogoDasFadas'];
const ordenar = (ids) => [...ids].sort((a, b) => {
  const ia = PREFERIDAS.indexOf(a);
  const ib = PREFERIDAS.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
});

export const nomeDaMagiaJogavel = (id) => getSpell(id)?.name ?? id;

/** Dá XP a cada herói e devolve quem já pode subir. */
export function darXp(herois, xp) {
  return herois.filter((c) => ganharXp(c, xp) > 0);
}

/**
 * Sobe UM nível. Devolve o que mudou e as escolhas de magia pendentes:
 *   { ganhos: [texto], escolhas: [{ id, rotulo, quantas, opcoes, sugeridas }], aplicar(escolhidas) }
 * `aplicar` recebe { [escolha.id]: [ids] } e põe as magias no lugar.
 */
export function subirUmNivel(c) {
  const antes = {
    maxHp: c.maxHp,
    features: [...(c.features ?? [])],
    slots: [...(c.spellcasting?.slotsMax ?? [])],
    prof: c.proficiency,
  };
  const def = CLASSES[c.classe];
  const conj = def?.conjuracao;
  const conhecidasAntes = conj?.conhecidas?.[c.level] ?? 0;
  const { pendentes } = subirNivel(c);
  c.hp += c.maxHp - antes.maxHp;
  c.dadosDeVidaRestantes = (c.dadosDeVidaRestantes ?? c.level - 1) + 1;

  const ganhos = [`${c.level}º nível: +${c.maxHp - antes.maxHp} pontos de vida (agora ${c.maxHp}).`];
  if (c.proficiency > antes.prof) ganhos.push(`Bônus de proficiência +${c.proficiency}.`);
  const novas = (c.features ?? []).filter((f) => !antes.features.includes(f));
  if (novas.length) ganhos.push(`Novo: ${novas.map(nomeDaCaracteristica).join(', ')}.`);
  for (const p of pendentes ?? []) {
    if (p.tipo === 'subclasse') ganhos.push(`Subclasse: ${def?.subclasse?.opcoes?.[p.valor]?.nome ?? p.valor}.`);
  }
  const slots = c.spellcasting?.slotsMax ?? [];
  if (slots.some((n, i) => n !== (antes.slots[i] ?? 0))) {
    ganhos.push(`Espaços de magia: ${slots.map((n, i) => (i && n ? `${n} de ${i}º círculo` : null)).filter(Boolean).join(', ')}.`);
  }

  // ---- as escolhas de magia ----
  const escolhas = [];
  const sc = c.spellcasting;
  if (sc && conj) {
    const maior = slots.reduce((m, n, i) => (n > 0 ? i : m), 0);
    const lista = listaDaClasse(c.classe, maior).magias.filter(magiaTemRegra);
    const mod = abilityMod(c.abilities[conj.atributo]);
    if (conj.prepara === 'conhecidas') {
      const quantas = (conj.conhecidas?.[c.level] ?? 0) - conhecidasAntes;
      const opcoes = ordenar(lista.filter((s) => !(sc.prepared ?? []).includes(s)));
      if (quantas > 0 && opcoes.length) {
        escolhas.push({ id: 'aprende', rotulo: `Aprende ${quantas} magia${quantas > 1 ? 's' : ''}`, quantas, opcoes, sugeridas: opcoes.slice(0, quantas) });
      }
    } else if (conj.prepara === 'livro') {
      sc.livro ??= [...(sc.prepared ?? [])];
      const opcoes = ordenar(lista.filter((s) => !sc.livro.includes(s)));
      if (opcoes.length) escolhas.push({ id: 'livro', rotulo: 'Escreve 2 magias no livro', quantas: Math.min(2, opcoes.length), opcoes, sugeridas: opcoes.slice(0, 2) });
      const limite = Math.max(1, mod + c.level);
      const faltam = limite - (sc.prepared ?? []).length;
      if (faltam > 0) escolhas.push({ id: 'prepara', rotulo: `Prepara mais ${faltam} (do livro)`, quantas: faltam, deLivro: true, opcoes: [], sugeridas: [] });
    } else if (conj.prepara === 'lista') {
      sc.lista ??= lista;
      const nivelConj = conj.tipo === 'meia' ? Math.floor(c.level / 2) : c.level;
      const limite = Math.max(1, mod + nivelConj);
      const faltam = limite - (sc.prepared ?? []).length;
      const opcoes = ordenar(lista.filter((s) => !(sc.prepared ?? []).includes(s) && !(sc.sempreProntas ?? []).includes(s)));
      if (faltam > 0 && opcoes.length) {
        escolhas.push({ id: 'prepara', rotulo: `Prepara mais ${faltam} magia${faltam > 1 ? 's' : ''}`, quantas: faltam, opcoes, sugeridas: opcoes.slice(0, faltam) });
      }
    }
  }

  function aplicar(escolhidas = {}) {
    if (!sc) return;
    for (const e of escolhas) {
      let ids = (escolhidas[e.id] ?? e.sugeridas).slice(0, e.quantas);
      if (e.id === 'aprende') sc.prepared = [...new Set([...(sc.prepared ?? []), ...ids])];
      if (e.id === 'livro') sc.livro = [...new Set([...sc.livro, ...ids])];
      if (e.id === 'prepara') {
        if (e.deLivro) {
          // O mago prepara do livro, já com as que acabou de escrever.
          const livres = ordenar(sc.livro.filter((s) => !sc.prepared.includes(s)));
          ids = (escolhidas.prepara ?? livres).filter((s) => livres.includes(s)).slice(0, e.quantas);
        }
        sc.prepared = [...new Set([...(sc.prepared ?? []), ...ids])];
      }
    }
  }

  return { ganhos, escolhas, aplicar };
}

/** XP para o próximo nível, para o texto. */
export const proximoNivelEm = (c) => XP_POR_NIVEL[(c.level ?? 1) + 1] ?? null;
