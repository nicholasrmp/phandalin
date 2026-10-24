// Conversas com escolhas e testes, no estilo dos RPGs de mesa no computador.
//
// Uma conversa é uma árvore de nós:
//
//   {
//     inicio: 'oi',
//     nos: {
//       oi: {
//         fala: 'Quem são vocês?',              // ou uma lista, uma página cada
//         opcoes: [
//           { texto: 'Viemos em paz.', vai: 'paz' },
//           { texto: 'Fala logo onde está o anão.', teste: { pericia: 'intimidacao', cd: 12 },
//             sucesso: 'conta', falha: 'foge' },
//           { texto: 'Sei o que é um túnel desses.', etiqueta: 'Anão',
//             requer: (ctx) => (ctx.algum((c) => /anão/i.test(c.raca)) ? null : 'só um anão'), oculta: true, vai: 'tunel' },
//           { texto: 'Até mais.', fim: 'paz' },
//         ],
//       },
//       ...
//     },
//   }
//
// OPÇÃO
//   vai       o próximo nó
//   fim       encerra a conversa e devolve esse valor (`'luta'`, `'paz'`...)
//   teste     { pericia, cd, quem: 'melhor' (padrão) | 'selecionado' } — rola
//             d20 + perícia; vai para `sucesso` ou `falha`. A etiqueta mostra
//             a perícia, a CD, quem rola e a chance, antes de escolher
//   requer    (ctx) → motivo ou null. Com motivo, a opção fica cinza com ele;
//             com `oculta: true`, nem aparece (as falas de raça e de classe)
//   etiqueta  o "[Anão]" na frente, para quem a opção existe
//   uma       some depois de escolhida (perguntas de um menu de dúvidas)
//   efeito    (ctx) → void, roda ao escolher (marcar uma flag, dar um item)
//
// NÓ
//   fala      o que o NPC diz (string ou lista)
//   narra     texto de cena antes da fala, sem nome
//   ao        (ctx) → void, roda ao chegar no nó
//   fim       nó sem opções que encerra com esse valor
//
// As flags da campanha moram em `app.campanha.flags`; a conversa pode lê-las
// em `requer` e escrevê-las em `efeito`, então o que se descobriu falando com
// um NPC muda o que outro diz.
//
// TEXTO NOSSO, sempre. Os nomes do cenário entram pela Fan Content Policy; as
// falas são escritas aqui.

import { narrar } from '../view/narrativa.js';
import { d20 } from '../core/dice.js';
import { skillBonus, SKILL_NAME } from '../rules/abilities.js';

const comoLista = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const sinal = (n) => (n >= 0 ? `+${n}` : `${n}`);
/** Chance de um teste: sem o 20 natural automático, que é só do ataque. */
const chanceDoTeste = (bonus, cd) => Math.max(0, Math.min(1, (21 - (cd - bonus)) / 20));

/** Quem rola o teste: o selecionado, ou o melhor do grupo naquela perícia. */
function quemRola(ctx, teste) {
  if (teste.quem === 'selecionado' && ctx.falante) return ctx.falante;
  return ctx.herois.reduce((a, b) => (skillBonus(b, teste.pericia) > skillBonus(a, teste.pericia) ? b : a));
}

/** O contexto que as funções da árvore recebem. */
function contexto(app, npc, fora = null) {
  // Fora do tabuleiro (a vila), quem chama dá o grupo, o dado e o registro.
  const enc = fora ?? app.enc;
  const herois = (fora?.herois ?? enc.combatants).filter((c) => c.side === 'party' && !c.dead && c.hp > 0);
  const campanha = (app.campanha ??= {});
  const flags = (campanha.flags ??= {});
  return {
    app, enc, npc, herois, flags,
    falante: herois.includes(app.selected) ? app.selected : herois[0],
    algum: (pred) => herois.some(pred),
  };
}

/**
 * Abre a conversa e devolve o `fim` dela (ou 'saiu').
 * @param {object} app   o jogo (`main.js`)
 * @param {object} npc   a criatura com quem se fala (nome, look)
 * @param {object} arvore
 * @param {object} [fora]  fora do tabuleiro: { herois, rng, say(tipo, texto) }
 */
export async function conversar(app, npc, arvore, fora = null) {
  const ctx = contexto(app, npc, fora);
  const usadas = (ctx.flags[`dialogo:${npc.defId ?? npc.id ?? npc.name}:usadas`] ??= []);
  let id = arvore.inicio;
  let teste = null;

  for (let passos = 0; passos < 200; passos++) {
    const no = arvore.nos[id];
    if (!no) throw new Error(`diálogo: nó "${id}" não existe`);
    no.ao?.(ctx);
    const falas = comoLista(typeof no.fala === 'function' ? no.fala(ctx) : no.fala);
    const narra = comoLista(typeof no.narra === 'function' ? no.narra(ctx) : no.narra);
    const paginas = [];
    // A primeira página leva o resultado do teste que trouxe até aqui.
    if (narra.length) paginas.push({ texto: narra });
    for (const f of falas) paginas.push({ retrato: npc.look, texto: [{ nome: `${npc.name}:`, texto: f }] });
    if (!paginas.length) paginas.push({ texto: [] });
    if (teste) paginas[0].teste = teste;
    teste = null;

    // Nó final: mostra e encerra.
    if (!no.opcoes?.length) {
      await narrar(app.root, { formato: 'painel', paginas });
      return no.fim ?? 'fim';
    }

    const visiveis = [];
    no.opcoes.forEach((o, i) => {
      const chave = `${id}:${i}`;
      if (o.uma && usadas.includes(chave)) return;
      const motivo = o.requer?.(ctx) ?? null;
      if (motivo && o.oculta) return;
      let detalhe = o.etiqueta ?? null;
      if (o.teste) {
        const quem = quemRola(ctx, o.teste);
        const bonus = skillBonus(quem, o.teste.pericia);
        const chance = Math.round(chanceDoTeste(bonus, o.teste.cd) * 100);
        detalhe = [detalhe, `${SKILL_NAME[o.teste.pericia]} CD ${o.teste.cd} · ${quem.name} ${sinal(bonus)} · ${chance}%`]
          .filter(Boolean).join('] [');
      }
      visiveis.push({ rotulo: o.texto, detalhe, motivo, valor: { o, chave } });
    });

    const escolha = await narrar(app.root, { formato: 'painel', paginas, escolhas: visiveis, lista: true });
    if (!escolha?.o) return 'saiu';
    const { o, chave } = escolha;
    if (o.uma) usadas.push(chave);
    o.efeito?.(ctx);

    if (o.teste) {
      const quem = quemRola(ctx, o.teste);
      const r = d20(ctx.enc.rng, skillBonus(quem, o.teste.pericia));
      const passou = r.total >= o.teste.cd;
      teste = { quem: quem.name, pericia: SKILL_NAME[o.teste.pericia], total: r.total, cd: o.teste.cd, passou };
      ctx.enc.say('acao', `${quem.name} · ${SKILL_NAME[o.teste.pericia]}: ${r.total} contra CD ${o.teste.cd} — ${passou ? 'sucesso' : 'falha'}`);
      const destino = passou ? o.sucesso : o.falha;
      if (destino == null) return passou ? 'sucesso' : 'falha';
      id = destino;
      continue;
    }
    if (o.fim !== undefined) return o.fim;
    id = o.vai ?? id;
  }
  return 'fim';
}
