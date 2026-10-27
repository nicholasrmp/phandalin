// Experiência e subida de nível na campanha, como a aventura dá.
//
// A PRIMEIRA PARTE da aventura usa marcos, não XP por monstro: 75 XP para
// cada personagem ao achar o esconderijo e 275 ao limpá-lo (pagos conforme as
// salas caem: vigias, poços, e o resto no fim) — 350 no total, o bastante para
// o 2º nível (300), que chega antes do covil e do Klarg. Daí em diante a aventura dá XP por
// monstro, armadilha, conversa e objetivo; quando chegar, entra aqui também.
//
// SUBIR é `subirNivel` (`rules/progressao.js`): vida, proficiência,
// características, recursos e espaços de magia. O que o motor não decide
// sozinho são as MAGIAS novas — quem as conhece aprende mais, o mago escreve
// duas no livro, quem prepara pode preparar mais uma. Isto calcula quais
// escolhas cada herói tem e aplica as que o jogador fizer (ou as sugeridas).

import { ganharXp, subirNivel, XP_POR_NIVEL } from '../rules/progressao.js';
import { maxHpEfetivo } from '../rules/conditions.js';
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

// Cada XP dado é um marco da aventura e um ponto de save (MULTIJOGADOR.md,
// S-02c). Os ~10 lugares que chamam `darXp` não precisam saber disso: quem
// salva se registra aqui, uma vez.
let aoGanharXpFn = null;
export const aoDarXp = (fn) => { aoGanharXpFn = fn; };

/** Quem salva também guarda o grupo DEPOIS de a tela de subir de nível aplicar as escolhas. */
export function depoisDeSubirNivel() {
  try { aoGanharXpFn?.([]); } catch { /* salvar nunca derruba a aventura */ }
}

/** Dá XP a cada herói e devolve quem já pode subir. */
export function darXp(herois, xp) {
  const sobem = herois.filter((c) => ganharXp(c, xp) > 0);
  try { aoGanharXpFn?.(herois); } catch { /* salvar nunca derruba a aventura */ }
  return sobem;
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
  // Subir de nível dá o PV máximo CRU; a exaustão é um teto temporário por
  // cima dele, então a vida atual não pode passar do teto que vale agora.
  c.hp = Math.min(c.hp + (c.maxHp - antes.maxHp), maxHpEfetivo(c));
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

/** O cartão como dado puro (vai pela rede ao dono do herói). */
export function dadosDoCartao(c, r) {
  return {
    heroi: c.id, nome: c.name, className: c.className ?? '', look: c.look ?? null, ganhos: r.ganhos,
    escolhas: r.escolhas.map((e) => ({
      id: e.id, rotulo: e.rotulo, quantas: e.quantas, deLivro: Boolean(e.deLivro), sugeridas: e.sugeridas,
      opcoes: e.opcoes.map((id) => ({ id, nome: nomeDaMagiaJogavel(id) })),
    })),
  };
}

/** As escolhas que chegaram de fora, conferidas: o que não está nas opções (ou falta) volta à sugerida. */
export function escolhasConferidas(escolhas, enviadas) {
  const out = {};
  for (const e of escolhas) {
    if (e.deLivro) continue;
    const vindas = Array.isArray(enviadas?.[e.id]) ? enviadas[e.id] : [];
    out[e.id] = Array.from({ length: e.quantas }, (_, k) => (e.opcoes.includes(vindas[k]) ? vindas[k] : e.sugeridas[k]));
  }
  return out;
}
