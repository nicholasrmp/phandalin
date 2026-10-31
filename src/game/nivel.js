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
import { CLASSES, CARACTERISTICAS, nomeDaCaracteristica } from '../rules/classes/index.js';
import { getSpell, SPELLS } from '../rules/spells.js';
import { aplicarInvocacoes, desfazerInvocacoes, gravarAssinaturas } from '../rules/passivas.js';
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

/** O nome de uma opção da tela: magia ou característica (metamagia, invocação, pacto). */
export const nomeDaOpcao = (id) => (SPELLS[id] ? getSpell(id).name : nomeDaCaracteristica(id));

const PACTOS = ['pactOfTheBlade', 'pactOfTheChain', 'pactOfTheTome'];

/** Troca, em `c.features`, as características `de` pelas `para` (mesmo número; as que já são iguais ficam). */
function trocarCaracteristicas(c, de, para) {
  for (const f of de) if (!para.includes(f)) c.features = c.features.filter((x) => x !== f);
  for (const f of para) if (!c.features.includes(f)) c.features.push(f);
}

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
  // Metamagia, invocação e pacto saem na tela como escolha; listá-los aqui mostraria o padrão que o jogador pode trocar.
  const jaEscolhivel = (f) => def?.opcoesDeMetamagia?.includes(f) || def?.opcoesDeInvocacao?.includes(f) || PACTOS.includes(f);
  const novidades = novas.filter((f) => !jaEscolhivel(f));
  if (novidades.length) ganhos.push(`Novo: ${novidades.map(nomeDaCaracteristica).join(', ')}.`);
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
      const total = (conj.conhecidas?.[c.level] ?? 0) - conhecidasAntes;
      // SEGREDOS MÁGICOS (bardo 10º, 14º, 18º; Colégio do Conhecimento 6º): duas das magias aprendidas vêm de QUALQUER lista de
      // classe. Elas contam entre as que a tabela já dá, então saem do total das da própria lista.
      const segredos = novas.filter((f) => f === 'magicalSecrets' || f === 'additionalMagicalSecrets').length * 2;
      const quantas = Math.max(0, total - segredos);
      const opcoes = ordenar(lista.filter((s) => !(sc.prepared ?? []).includes(s)));
      if (segredos > 0) {
        const todas = new Set();
        for (const k of Object.keys(CLASSES)) for (const s of listaDaClasse(k, maior).magias.filter(magiaTemRegra)) todas.add(s);
        const abertas = ordenar([...todas].filter((s) => !(sc.prepared ?? []).includes(s) && (getSpell(s)?.level ?? 9) <= maior));
        const n = Math.min(segredos, abertas.length);
        if (n > 0) escolhas.push({ id: 'segredos', rotulo: `Segredos Mágicos: ${n} magia${n > 1 ? 's' : ''} de qualquer lista`, quantas: n, opcoes: abertas, sugeridas: abertas.slice(0, n) });
      }
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

  // ---- as escolhas de característica, que o motor já fez por padrão e o jogador pode trocar ----
  // O motor sorteia o padrão em `subirNivel` (metamagia, invocação, pacto, Maestria, Assinatura); a tela mostra o padrão e quem
  // quiser troca. `aplicar` desfaz o padrão e põe o que foi escolhido.
  const escolhasDeCaracteristica = [];
  const acrescentar = (id, rotulo, quantas, opcoes, sugeridas, extra = {}) => {
    if (quantas > 0 && opcoes.length >= quantas) escolhasDeCaracteristica.push({ id, rotulo, quantas, opcoes, sugeridas: sugeridas.slice(0, quantas), caracteristica: true, ...extra });
  };
  const novasMeta = novas.filter((f) => def?.opcoesDeMetamagia?.includes(f));
  acrescentar('metamagia', `Metamagia: ${novasMeta.length > 1 ? `${novasMeta.length} opções` : 'uma opção'}`, novasMeta.length,
    (def?.opcoesDeMetamagia ?? []).filter((o) => !antes.features.includes(o)), novasMeta);
  const novoPacto = novas.filter((f) => PACTOS.includes(f));
  acrescentar('pacto', 'Dádiva do Pacto', novoPacto.length, PACTOS, novoPacto);
  const novasInv = novas.filter((f) => def?.opcoesDeInvocacao?.includes(f));
  acrescentar('invocacoes', `Invocações Místicas: ${novasInv.length > 1 ? `${novasInv.length} novas` : 'uma nova'}`, novasInv.length,
    (def?.opcoesDeInvocacao ?? []).filter((o) => !antes.features.includes(o) && (def.podeEscolher?.(o, c) ?? true)), novasInv);
  if (novas.includes('spellMastery') && c.maestriaDeMagia?.length === 2) {
    for (const [i, n] of [[0, 1], [1, 2]]) {
      const conhecidas = [...new Set([...(c.spellcasting?.livro ?? []), ...(c.spellcasting?.prepared ?? [])])].filter((s) => SPELLS[s]?.level === n);
      acrescentar(`maestria${n}`, `Maestria em Magia: uma de ${n}º círculo`, 1, conhecidas, [c.maestriaDeMagia[i]].filter((s) => conhecidas.includes(s)).concat(conhecidas).slice(0, 1));
    }
  }
  if (novas.includes('signatureSpells') && c.magiasAssinatura?.length) {
    const conhecidas = [...new Set([...(c.spellcasting?.livro ?? []), ...(c.spellcasting?.prepared ?? [])])].filter((s) => SPELLS[s]?.level === 3);
    acrescentar('assinaturas', 'Magias de Assinatura: duas de 3º círculo', 2, conhecidas, c.magiasAssinatura.map((a) => a.magia));
  }
  escolhas.push(...escolhasDeCaracteristica);

  function aplicarCaracteristicas(escolhidas) {
    const pega = (e) => {
      const vindas = escolhidas[e.id];
      const lista = Array.from({ length: e.quantas }, (_, k) => (e.opcoes.includes(vindas?.[k]) ? vindas[k] : e.sugeridas[k]));
      // sem repetir: quem repete volta à sugerida daquela posição
      return lista.map((v, k) => (lista.indexOf(v) !== k ? e.sugeridas[k] : v));
    };
    const por = (id) => escolhasDeCaracteristica.find((e) => e.id === id);
    if (por('pacto')) trocarCaracteristicas(c, por('pacto').sugeridas, pega(por('pacto')));
    if (por('metamagia')) {
      const e = por('metamagia');
      trocarCaracteristicas(c, e.sugeridas, pega(e));
      c.metaLigada = (c.metaLigada ?? []).filter((f) => c.features.includes(f));
    }
    if (por('invocacoes')) {
      const e = por('invocacoes');
      // Só vale a invocação que o pacto de agora permite; a que não vale fica a padrão.
      const quer = pega(e).map((f, k) => ((def.podeEscolher?.(f, c) ?? true) ? f : e.sugeridas[k]));
      trocarCaracteristicas(c, e.sugeridas, quer);
    }
    if (por('pacto') || por('invocacoes')) {
      // Trocar de pacto derruba a invocação que dependia do antigo.
      c.features = c.features.filter((f) => !(def.opcoesDeInvocacao?.includes(f) && def.podeEscolher && !def.podeEscolher(f, c)));
      desfazerInvocacoes(c);
      aplicarInvocacoes(c, SPELLS);
    }
    if (por('maestria1') && por('maestria2')) c.maestriaDeMagia = [pega(por('maestria1'))[0], pega(por('maestria2'))[0]];
    if (por('assinaturas')) gravarAssinaturas(c, pega(por('assinaturas')));
  }

  function aplicar(escolhidas = {}) {
    aplicarCaracteristicas(escolhidas);
    if (!sc) return;
    for (const e of escolhas) {
      if (e.caracteristica) continue;
      let ids = (escolhidas[e.id] ?? e.sugeridas).slice(0, e.quantas);
      if (e.id === 'aprende' || e.id === 'segredos') sc.prepared = [...new Set([...(sc.prepared ?? []), ...ids])];
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
      opcoes: e.opcoes.map((id) => ({ id, nome: nomeDaOpcao(id), desc: CARACTERISTICAS[id]?.desc ?? getSpell(id)?.desc ?? '' })),
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
