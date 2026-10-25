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
//   magia     'compreenderIdiomas' (ou outra): a opção só existe com essa magia de
//             pé no grupo (ctx.magia(id)); sem ela fica cinza, ou some com `oculta`
//   magiaNome o nome da magia, para o motivo em cinza
//
// NÓ
//   fala      o que o NPC diz (string ou lista)
//   narra     texto de cena antes da fala, sem nome
//   ao        (ctx) → void, roda ao chegar no nó
//   pensa     o que ele pensa neste nó (Detectar Pensamentos); sem isto, vale o
//             texto geral da criatura em `magias-fora-dados.js`
//   fim       nó sem opções que encerra com esse valor
//
// As flags da campanha moram em `app.campanha.flags`; a conversa pode lê-las
// em `requer` e escrevê-las em `efeito`, então o que se descobriu falando com
// um NPC muda o que outro diz.
//
// MAGIAS. As magias de utilidade (rules/utilidade.js) entram na conversa sozinhas:
// as chances mostram a vantagem que elas dão (Taumaturgia, Amizade, Enfeitiçar
// Pessoa, Sugestão...), a opção "Conjurar uma magia…" aparece quando alguém do
// grupo pode conjurar algo que vale aqui, e a de "Sondar a mente" com Detectar
// Pensamentos de pé. Conjurar gasta o espaço e o tempo, e a conversa continua no
// mesmo nó.
//
// ZONA DA VERDADE E CATIVAR. Um nó pode trazer `zona: {...}` (o que ele diz de verdade sob a
// Zona da Verdade, no lugar da mentira) e `ajuda: {...}` (o que muda se ele está cativado, e não
// grita nem chama ajuda): ver `dialogo-magia.js`. As opções aceitam `zona: true` (só existem se o
// NPC está sob a Zona) e `magia: 'linguas'` (só com Línguas de pé: falar o idioma dele).
//
// TEXTO NOSSO, sempre. Os nomes do cenário entram pela Fan Content Policy; as
// falas são escritas aqui.

import { narrar } from '../view/narrativa.js';
import { SKILL_NAME } from '../rules/abilities.js';
import { previsaoDeTeste, melhorParaTeste, rolarTeste, ativaDe, entendeIdiomas, temMagia, sobZona, estaCativado, falaIdiomas } from '../rules/utilidade.js';
import { noSobMagia } from './dialogo-magia.js';
import { ctxDe, magiasNaConversa, conjurarNaConversa, sondar } from './magias-fora.js';

const comoLista = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const sinal = (n) => (n >= 0 ? `+${n}` : `${n}`);
/** Chance de um teste: sem o 20 natural automático, que é só do ataque. */
const chanceDoTeste = (bonus, cd) => Math.max(0, Math.min(1, (21 - (cd - bonus)) / 20));

/** Quem rola o teste: o selecionado, ou o de melhor chance (com as magias) naquela perícia. */
function quemRola(ctx, teste) {
  if (teste.quem === 'selecionado' && ctx.falante) return ctx.falante;
  return melhorParaTeste(ctx.estado, ctx.herois, teste.pericia, teste.cd, { npc: ctx.npc }).quem;
}

/** O contexto que as funções da árvore recebem. */
function contexto(app, npc, fora = null) {
  // Fora do tabuleiro (a vila), quem chama dá o grupo, o dado e o registro.
  const enc = fora ?? app.enc;
  const herois = (fora?.herois ?? enc.combatants).filter((c) => c.side === 'party' && !c.dead && c.hp > 0);
  const campanha = (app.campanha ??= {});
  const flags = (campanha.flags ??= {});
  const x = ctxDe(app, enc);
  return {
    app, enc, npc, herois, flags, x, estado: x.estado,
    falante: herois.includes(app.selected) ? app.selected : herois[0],
    algum: (pred) => herois.some(pred),
    // Uma magia de utilidade de pé no grupo (Compreender Idiomas, Detectar Pensamentos...);
    // Línguas vale por Compreender Idiomas.
    magia: (id) => temMagia(x.estado, herois, id),
    entendeIdiomas: () => entendeIdiomas(x.estado, herois),
    falaIdiomas: () => falaIdiomas(x.estado, herois),
    // O NPC desta conversa está sob a Zona da Verdade (não mente) ou cativado (não chama ajuda)?
    zona: () => Boolean(npc) && sobZona(x.estado, herois, npc),
    cativado: () => Boolean(npc) && estaCativado(npc),
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
  // Depois de conjurar ou sondar, o mesmo nó volta: sem repetir a fala nem o `ao`.
  let repetindo = false;
  let extra = [];

  for (let passos = 0; passos < 200; passos++) {
    const no0 = arvore.nos[id];
    if (!no0) throw new Error(`diálogo: nó "${id}" não existe`);
    // As magias mudam o nó: a Zona da Verdade vira a mentira em verdade, o Cativar cala o grito.
    const no = noSobMagia(no0, { zona: ctx.zona(), cativado: ctx.cativado() });
    if (!repetindo) no.ao?.(ctx);
    const falas = repetindo ? [] : comoLista(typeof no.fala === 'function' ? no.fala(ctx) : no.fala);
    const narra = repetindo ? extra : comoLista(typeof no.narra === 'function' ? no.narra(ctx) : no.narra);
    repetindo = false;
    extra = [];
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
      const motivo = (o.zona && !ctx.zona() ? 'só sob a Zona da Verdade' : null) ?? o.requer?.(ctx) ?? null;
      if (motivo && o.oculta) return;
      let detalhe = o.etiqueta ?? null;
      const semMagia = o.magia && !ctx.magia(o.magia);
      if (semMagia && o.oculta) return;
      if (o.teste) {
        const quem = quemRola(ctx, o.teste);
        const p = previsaoDeTeste(ctx.estado, ctx.herois, quem, o.teste.pericia, o.teste.cd, { npc: ctx.npc });
        const marca = p.auto ? ' · cumprido' : p.vantagem ? ' · vantagem' : p.desvantagem ? ' · desvantagem' : '';
        detalhe = [detalhe, `${SKILL_NAME[o.teste.pericia]} CD ${o.teste.cd} · ${quem.name} ${sinal(p.bonus)}${marca} · ${Math.round(p.chance * 100)}%`]
          .filter(Boolean).join('] [');
      }
      visiveis.push({ rotulo: o.texto, detalhe, motivo: motivo ?? (semMagia ? `precisa de ${o.magiaNome ?? o.magia}` : null), valor: { o, chave } });
    });

    // As magias de utilidade: conjurar na conversa e sondar a mente.
    if (magiasNaConversa(ctx.x, npc).length) {
      visiveis.push({ rotulo: 'Conjurar uma magia…', detalhe: 'gasta espaço e tempo', valor: { magia: true } });
    }
    if (!npc.dead && ativaDe(ctx.estado, ctx.herois, 'detectarPensamentos')) {
      visiveis.push({ rotulo: 'Sondar a mente dele', detalhe: 'Detectar Pensamentos', valor: { sondar: true } });
    }

    const escolha = await narrar(app.root, { formato: 'painel', paginas, escolhas: visiveis, lista: true });
    if (escolha?.magia || escolha?.sondar) {
      if (escolha.magia) {
        const texto = await conjurarNaConversa(app, ctx.x, npc);
        extra = texto ?? ['Ninguém conjura nada.'];
      } else {
        const dono = ctx.herois.find((h) => ativaDe(ctx.estado, ctx.herois, 'detectarPensamentos', { por: h }));
        extra = dono ? sondar(ctx.x, dono, npc, id, no.pensa) : ['A magia não está de pé.'];
      }
      repetindo = true;
      continue;
    }
    if (!escolha?.o) return 'saiu';
    const { o, chave } = escolha;
    if (o.uma) usadas.push(chave);
    o.efeito?.(ctx);

    if (o.teste) {
      const quem = quemRola(ctx, o.teste);
      const r = rolarTeste(ctx.estado, ctx.herois, ctx.enc.rng, quem, o.teste.pericia, o.teste.cd, { npc: ctx.npc, vantagem: Boolean(o.teste.vantagem) });
      const passou = r.passou;
      teste = { quem: quem.name, pericia: SKILL_NAME[o.teste.pericia], total: r.total, cd: o.teste.cd, passou, fontes: r.fontes };
      ctx.enc.say('acao', `${quem.name} · ${SKILL_NAME[o.teste.pericia]}: ${r.total} contra CD ${o.teste.cd} — ${passou ? 'sucesso' : 'falha'}${r.fontes.length ? ` (${r.fontes.join('; ')})` : ''}`);
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
