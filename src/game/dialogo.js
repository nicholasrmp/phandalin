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
import { quemDecide } from './decisao.js';
import { totalEmCobre, cobrar } from './comercio.js';
import { idDaFicha, flagDeApertado } from './npc-saber.js';
import { previsaoDeTeste, melhorParaTeste, rolarTeste, ativaDe, entendeIdiomas, temMagia, sobZona, estaCativado, falaIdiomas } from '../rules/utilidade.js';
import { noSobMagia } from './dialogo-magia.js';
import { ctxDe, magiasNaConversa, conjurarNaConversa, sondar } from './magias-fora.js';
import { opcoesComPerfil, textoDaOpcao } from './dialogo-perfil.js';
import { extrasDoNpc } from './dialogos-extras.js';
import { podePerguntar, estadoDoSaber } from './perguntar.js';
import { aceitaCampoDeTexto } from '../view/narrativa.js';

const comoLista = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const sinal = (n) => (n >= 0 ? `+${n}` : `${n}`);
const PERICIAS_SOCIAIS = new Set(['persuasao', 'intimidacao', 'enganacao']);

/** Chance de um teste: sem o 20 natural automático, que é só do ataque. */
const chanceDoTeste = (bonus, cd) => Math.max(0, Math.min(1, (21 - (cd - bonus)) / 20));

/**
 * O que a OPÇÃO acrescenta ao teste, além do que o estado do grupo já dá.
 *
 * Existe porque isto não era repassado: a rolagem recebia `o.teste.vantagem` e
 * a previsão da tela não, então em `capitulo2.js` e em `cena-caverna.js` — as
 * duas opções do jogo com vantagem escrita na árvore — a etiqueta mostrava uma
 * chance menor do que o dado de verdade tinha. Um ajudante só para os dois
 * lugares não voltarem a divergir.
 */
const extraDoTeste = (teste) => ({
  vantagem: Boolean(teste?.vantagem),
  desvantagem: Boolean(teste?.desvantagem),
});

/** Quem rola o teste: o selecionado, ou o de melhor chance (com as magias) naquela perícia. */
function quemRola(ctx, teste) {
  if (teste.heroi) return teste.heroi;          // a opção por perfil: quem atende o perfil (e rola melhor) é quem fala
  if (teste.quem === 'selecionado' && ctx.falante) return ctx.falante;
  // Numa sala, quem começou a conversa fala por si e rola por si; sozinho, o grupo manda o melhor dele falar.
  if (ctx.app?.salaDaPartida && ctx.doAtor) return ctx.doAtor;
  return melhorParaTeste(ctx.estado, ctx.herois, teste.pericia, teste.cd, { npc: ctx.npc, extra: extraDoTeste(teste) }).quem;
}

/** A etiqueta do teste na opção: a perícia, a CD, quem rola e a chance. */
function etiquetaDoTeste(ctx, teste) {
  const quem = quemRola(ctx, teste);
  const p = previsaoDeTeste(ctx.estado, ctx.herois, quem, teste.pericia, teste.cd, { npc: ctx.npc, extra: extraDoTeste(teste) });
  const marca = p.auto ? ' · cumprido' : p.vantagem ? ' · vantagem' : p.desvantagem ? ' · desvantagem' : '';
  return `${SKILL_NAME[teste.pericia]} CD ${teste.cd} · ${quem.name} ${sinal(p.bonus)}${marca} · ${Math.round(p.chance * 100)}%`;
}

/**
 * Quem está escrevendo na caixa: é ele quem fala e quem rola. Numa sala, o herói de quem começou a conversa; sem dono da cena,
 * o herói do líder, que é quem escreve. `null` se o líder não tem herói de pé: aí a frase é do grupo, e rola o melhor dele.
 */
export function quemEscreve(app, ctx) {
  if (ctx.doAtor) return ctx.doAtor;
  const visao = app.salaDaPartida?.visao;
  if (!visao) return ctx.falante ?? null;
  const d = quemDecide({ ator: null, visao });
  const jogador = d.modo === 'votacao' ? d.desempate : d.pub;
  return ctx.herois.find((h) => visao.herois?.[h.id] === jogador) ?? null;
}

/**
 * Os testes do nó, vistos da caixa: a mesma CD e a mesma consequência, rolados por quem escreve. A opção por perfil continua com
 * quem atende o perfil, porque é a condição dela.
 */
export function testesDaCaixa(ctx, visiveis, escritor) {
  return visiveis.filter((v) => v.valor?.o?.teste).map((v) => {
    const { o } = v.valor;
    const heroi = o.teste.heroi ?? escritor;
    const daCaixa = heroi ? { ...o, _falante: o._falante ?? heroi, teste: { ...o.teste, heroi } } : o;
    return {
      pericia: o.teste.pericia, rotulo: v.rotulo, motivo: v.motivo,
      detalhe: [o.etiqueta, etiquetaDoTeste(ctx, daCaixa.teste)].filter(Boolean).join('] ['),
      valor: { ...v.valor, o: daCaixa },
    };
  });
}

/**
 * A oferta de ouro escrita na caixa, num teste de persuasão: paga-se de verdade, e o agrado dá vantagem, passe ou não no dado. Oferta
 * menor que a CD em peças não compra atenção de ninguém. Quem paga é o grupo, como no resgate do Yeemik.
 */
export function ofertaDeOuro(ctx, teste, quantia) {
  const noBolso = Math.floor(totalEmCobre(ctx.herois) / 100);
  const { o } = teste.valor;
  const cd = o.teste.cd;
  const motivo = quantia < cd ? `pouco para quem cobra CD ${cd}: ao menos ${cd} po` : noBolso < quantia ? `o grupo tem só ${noBolso} po` : null;
  const comVantagem = { ...o.teste, vantagem: true };
  return {
    motivo,
    detalhe: etiquetaDoTeste(ctx, comVantagem),
    pagar: () => {
      cobrar(ctx.herois, quantia * 100);
      ctx.enc.say?.('acao', `O grupo paga ${quantia} po a ${ctx.npc.name}.`);
      return { ...teste.valor, o: { ...o, teste: comVantagem } };
    },
  };
}

/**
 * Quem pode AJUDAR quem vai rolar (a ação Ajudar do SRD: dá vantagem). Só numa sala e só outro JOGADOR, porque a graça é a mesa
 * inteira entrar na conversa; cada herói ajuda uma vez por conversa, senão todo teste sairia com vantagem. Devolve `[{ pub, heroi }]`,
 * um por jogador.
 */
export function quemPodeAjudar(visao, herois, quem, ajudaram = new Set()) {
  if (!visao) return [];
  const dono = visao.herois?.[quem.id];
  return (visao.jogadores ?? []).filter((j) => j.conectado && j.id !== dono).flatMap((j) => {
    const heroi = herois.find((h) => h !== quem && visao.herois?.[h.id] === j.id && !ajudaram.has(h.id));
    return heroi ? [{ pub: j.id, heroi }] : [];
  });
}

/** Pergunta aos outros jogadores, por pouco tempo, se alguém ajuda. Devolve o herói que ajudou, ou `null`. */
async function pedirAjuda(app, ctx, teste, quem) {
  const ajudantes = quemPodeAjudar(app.salaDaPartida?.visao, ctx.herois, quem, ctx.ajudaram);
  if (!ajudantes.length) return null;
  const r = await narrar(app.root, {
    formato: 'painel', lista: true,
    ajuda: { votantes: ajudantes.map((a) => a.pub) },
    paginas: [{ texto: [`${quem.name} vai tentar ${SKILL_NAME[teste.pericia]} (CD ${teste.cd}). Quem ajudar dá vantagem no dado, e cada herói só ajuda uma vez nesta conversa.`] }],
    escolhas: [{ rotulo: `Deixar com ${quem.name}`, valor: 'nao' }, { rotulo: 'Ajudar', primaria: true, valor: 'ajudar' }],
  });
  if (r !== 'ajudar') return null;
  const pub = app.quemAjudou?.();
  const heroi = (ajudantes.find((a) => a.pub === pub) ?? ajudantes[0]).heroi;
  ctx.ajudaram.add(heroi.id);
  return heroi;
}

/** O melhor, entre `candidatos`, para o teste (quem tem a melhor chance). */
function melhorEntre(ctx, candidatos, tst) {
  let melhor = null;
  for (const h of candidatos) {
    const p = previsaoDeTeste(ctx.estado, ctx.herois, h, tst.pericia, tst.cd, { npc: ctx.npc, extra: extraDoTeste(tst) });
    if (!melhor || p.chance > melhor.p.chance + 1e-9 || (Math.abs(p.chance - melhor.p.chance) < 1e-9 && p.bonus > melhor.p.bonus)) melhor = { h, p };
  }
  return melhor.h;
}

/** O contexto que as funções da árvore recebem. */
function contexto(app, npc, fora = null) {
  // Fora do tabuleiro (a vila), quem chama dá o grupo, o dado e o registro.
  const enc = fora ?? app.enc;
  const herois = (fora?.herois ?? enc.combatants).filter((c) => c.side === 'party' && !c.dead && c.hp > 0);
  const campanha = (app.campanha ??= {});
  const flags = (campanha.flags ??= {});
  const x = ctxDe(app, enc);
  // Numa sala, quem fala é o herói de quem começou a conversa, e não o que está selecionado na tela do anfitrião.
  const idDoAtor = app.atorAtual?.();
  const doAtor = idDoAtor ? herois.find((c) => c.id === idDoAtor) : null;
  return {
    app, enc, npc, herois, flags, x, estado: x.estado, doAtor, ajudaram: new Set(),
    memoria: { chave: null, ditas: [] },      // de que se falava na caixa: dura esta conversa (`continuarAssunto`)
    falante: doAtor ?? (herois.includes(app.selected) ? app.selected : herois[0]),
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
  // Numa sala, quem começou a conversa decide até o fim dela, por mais que demore a escrever.
  const antes = app.prenderAtor?.(app.atorAtual?.() ?? null);
  try {
    return await conduzir(app, npc, arvore, fora);
  } finally {
    app.prenderAtor?.(antes);
  }
}

async function conduzir(app, npc, arvore, fora) {
  const ctx = contexto(app, npc, fora);
  const usadas = (ctx.flags[`dialogo:${npc.defId ?? npc.id ?? npc.name}:usadas`] ??= []);
  let id = arvore.inicio;
  // As FALAS POR PERFIL (`dialogos-extras.js`): nós e opções acrescentados por NPC, sem mexer na árvore da cena.
  const extras = extrasDoNpc(npc);
  const nos = { ...arvore.nos, ...(extras.nos ?? {}) };
  let teste = null;
  // Depois de conjurar ou sondar, o mesmo nó volta: sem repetir a fala nem o `ao`.
  let repetindo = false;
  let extra = [];
  let citacao = null;      // a frase que o jogador escreveu antes de um teste: todos na sala a leem junto com o resultado

  for (let passos = 0; passos < 200; passos++) {
    const no0 = nos[id];
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
    if (citacao) { paginas.unshift({ texto: [citacao] }); citacao = null; }
    if (teste) paginas[0].teste = teste;
    teste = null;

    // Nó final: mostra e encerra.
    if (!no.opcoes?.length) {
      await narrar(app.root, { formato: 'painel', paginas });
      return no.fim ?? 'fim';
    }

    const visiveis = [];
    // As opções da árvore e as acrescentadas para este nó; as por perfil só valem para quem tem a raça, a classe ou o atributo.
    const daArvore = no.opcoes.map((o, i) => ({ ...o, _i: i }));
    const acrescentadas = (extras.porNo?.[id] ?? []).map((o, i) => ({ ...o, _i: `x${i}` }));   // a chave `uma` da acrescentada é a posição dela no `porNo`, não o tamanho da árvore (que muda de cena para cena)
    const escolheMelhor = (candidatos, tst) => melhorEntre(ctx, candidatos, tst);
    opcoesComPerfil([...daArvore, ...acrescentadas], ctx.herois, escolheMelhor).forEach((o) => {
      const chave = `${id}:${o._i}`;
      if (o.uma && usadas.includes(chave)) return;
      const motivo = (o.zona && !ctx.zona() ? 'só sob a Zona da Verdade' : null) ?? o.requer?.(ctx) ?? null;
      if (motivo && o.oculta) return;
      let detalhe = o.etiqueta ?? null;
      const semMagia = o.magia && !ctx.magia(o.magia);
      if (semMagia && o.oculta) return;
      if (o.teste) {
        detalhe = [detalhe, etiquetaDoTeste(ctx, o.teste)].filter(Boolean).join('] [');
      }
      visiveis.push({ rotulo: textoDaOpcao(o, { ...ctx, quem: o._falante ?? ctx.falante }), detalhe, motivo: motivo ?? (semMagia ? `precisa de ${o.magiaNome ?? o.magia}` : null), valor: { o, chave } });
    });

    // As magias de utilidade: conjurar na conversa e sondar a mente.
    if (magiasNaConversa(ctx.x, npc).length) {
      visiveis.push({ rotulo: 'Conjurar uma magia…', detalhe: 'gasta espaço e tempo', valor: { magia: true } });
    }
    if (!npc.dead && ativaDe(ctx.estado, ctx.herois, 'detectarPensamentos')) {
      visiveis.push({ rotulo: 'Sondar a mente dele', detalhe: 'Detectar Pensamentos', valor: { sondar: true } });
    }

    // PERGUNTAR QUALQUER COISA (`game/perguntar.js`): quem tem ficha, sozinho ou numa sala. `calado` no nó: ele ainda não pode falar.
    if (podePerguntar(npc) && !npc.dead && !no.calado && aceitaCampoDeTexto()) {
      visiveis.push({ rotulo: 'Perguntar outra coisa…', detalhe: 'escreva o que quiser', valor: { perguntar: true } });
    }

    let escolha = await narrar(app.root, { formato: 'painel', paginas, escolhas: visiveis, lista: true });
    if (escolha?.perguntar) {
      const { conversaLivre } = await import('../view/pergunta.js');   // sob demanda: é interface, e a conversa também roda em Node
      // Persuadir, intimidar e enganar pela caixa são OS TESTES DESTE NÓ, com a mesma CD e a mesma consequência:
      // quem decide é o dado, nunca o modelo, e quem rola é quem escreveu. Sem teste aqui, a frase é só conversa e não muda nada.
      const escritor = quemEscreve(app, ctx);
      const testes = testesDaCaixa(ctx, visiveis, escritor);
      const feita = await conversaLivre(app, npc, estadoDoSaber(ctx), {
        testes, falante: escritor?.name ?? null, memoria: ctx.memoria,
        comOferta: (teste, quantia) => ofertaDeOuro(ctx, teste, quantia),
      });
      if (!feita) {
        repetindo = true;
        continue;
      }
      escolha = feita.valor;
      citacao = feita.citacao;
    }
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
    ctx.quem = o._falante ?? ctx.falante;            // quem falou (a opção por perfil) vale nas falas seguintes (`ctx.quem.name`)
    if (o.uma) usadas.push(chave);
    o.efeito?.(ctx);

    if (o.teste) {
      const quem = quemRola(ctx, o.teste);
      const ajudante = await pedirAjuda(app, ctx, o.teste, quem);
      const extra = extraDoTeste(o.teste);
      const r = rolarTeste(ctx.estado, ctx.herois, ctx.enc.rng, quem, o.teste.pericia, o.teste.cd, { npc: ctx.npc, ...extra, vantagem: extra.vantagem || Boolean(ajudante) });
      if (ajudante) r.fontes = [...r.fontes, `${ajudante.name} ajudou`];
      const passou = r.passou;
      // O dado muda o que ele conta: dobrado num teste social, a caixa passa a ter os fatos que ele segurava (`npc-saber.js`).
      const ficha = idDaFicha(npc);
      if (passou && ficha && PERICIAS_SOCIAIS.has(o.teste.pericia)) ctx.flags[flagDeApertado(ficha)] = true;
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
