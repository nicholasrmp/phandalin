// A porta de narrativa (MULTIJOGADOR.md, A-02, Fase 1).
//
// `narrar(root, { formato, paginas, escolhas, pular, lista })` devolve uma
// Promise com o `valor` da escolha, e as cenas a chamam 200 vezes. Para o
// multijogador a saída é trocar a implementação ATRÁS da mesma assinatura
// (`view/narrativa.js: definirPorta`), sem editar nenhuma chamada. Este arquivo
// não toca a tela (roda em Node) e traz as três peças que isso pede:
//
//   descreverNarrativa  o PEDIDO em JSON puro: o que se transmite a quem olha.
//                       Fica de fora o que não viaja: o `valor` das escolhas
//                       (pode ser objeto, função ou herói) e o `conteudo` (um
//                       elemento do DOM). Quem responde manda o ÍNDICE.
//   valorDaResposta     o índice que chegou -> o `valor` que a cena espera, com
//                       a mesma recusa que a tela faz (escolha cinza não vale).
//   criarPortaCompartilhada  a porta do anfitrião: mostra a tela local, TRANSMITE
//                       o pedido e resolve com quem responder primeiro.
//
// O transporte (WebSocket, Durable Object) é de quem chamar: aqui ele é só
// `transmitir(mensagem)` e `esperarResposta(id)`.

/** O que `narrar` aceita; o resto é recusado em desenvolvimento, para uma opção nova não passar calada. */
export const OPCOES_DA_NARRATIVA = ['formato', 'paginas', 'escolhas', 'pular', 'lista'];
export const CAMPOS_DA_PAGINA = ['titulo', 'texto', 'teste', 'retrato', 'conteudo'];
export const CAMPOS_DA_ESCOLHA = ['rotulo', 'valor', 'primaria', 'detalhe', 'motivo'];

const desconhecidos = (obj, permitidos) => Object.keys(obj ?? {}).filter((k) => !permitidos.includes(k));

/** Copia só o que é dado, sem `undefined` (que o JSON perderia) e sem o que não viaja. */
const limpo = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

/**
 * O pedido de uma narrativa em JSON puro. `paginas[i].temConteudo` avisa que a
 * página trazia uma tela interativa do anfitrião (descanso, subir de nível):
 * quem só olha vê o texto, e a tela fica com o anfitrião.
 */
export function descreverNarrativa(opts) {
  const { formato = 'tela', paginas, escolhas = null, pular = false, lista = false } = opts;
  const aviso = [
    ...desconhecidos(opts, OPCOES_DA_NARRATIVA).map((k) => `opção ${k}`),
    ...paginas.flatMap((p, i) => desconhecidos(p, CAMPOS_DA_PAGINA).map((k) => `página ${i + 1}: campo ${k}`)),
    ...(escolhas ?? []).flatMap((e, i) => desconhecidos(e, CAMPOS_DA_ESCOLHA).map((k) => `escolha ${i + 1}: campo ${k}`)),
  ];
  return {
    pedido: {
      formato,
      pular: Boolean(pular),
      lista: Boolean(lista),
      paginas: paginas.map((p) => ({
        titulo: p.titulo ?? null,
        texto: limpo(p.texto ?? []),
        teste: limpo(p.teste ?? null),
        retrato: limpo(p.retrato ?? null),
        temConteudo: Boolean(p.conteudo),
      })),
      escolhas: escolhas?.length
        ? escolhas.map((e, indice) => ({
          indice,
          rotulo: e.rotulo,
          detalhe: e.detalhe ?? null,
          motivo: e.motivo ?? null,
          primaria: Boolean(e.primaria),
        }))
        : null,
    },
    // O que a cena trouxe e a descrição não entende: a porta avisa, não engole.
    desconhecidos: aviso,
  };
}

/**
 * Traduz a resposta que chegou (`{ indice }`) no valor que a cena espera.
 * Sem escolhas, a narrativa só continua: o valor é 'fim', como na tela — e só
 * com `{ continuar: true }` explícito, para um lixo qualquer (ou uma virada de
 * página mal interpretada) não encerrar tudo. Uma escolha com `motivo` está
 * cinza na tela e também aqui não vale.
 */
export function valorDaResposta(opts, resposta) {
  const { escolhas = null } = opts;
  if (!escolhas?.length) return resposta?.continuar === true ? { ok: true, valor: 'fim' } : { ok: false, erro: 'resposta inválida' };
  const indice = resposta?.indice;
  if (!Number.isInteger(indice) || indice < 0 || indice >= escolhas.length) return { ok: false, erro: 'escolha inexistente' };
  if (escolhas[indice].motivo) return { ok: false, erro: 'escolha indisponível' };
  return { ok: true, valor: escolhas[indice].valor };
}

/**
 * A porta do anfitrião. `local(root, opts)` é a tela de hoje (`portaLocal`).
 *
 *   transmitir(msg)              { tipo: 'abrir', id, pedido }  ao abrir
 *                                { tipo: 'fechar', id, indice } ao decidir
 *   esperarResposta(id, sinal)   Promise<{ indice }> (ou `{ continuar: true }`
 *                                sem escolhas) da resposta de quem decide, o líder.
 *                                O `sinal` aborta quando a narrativa fecha: o
 *                                transporte tira a espera da fila
 *   aoFalhar(erro)               o transporte ou a descrição falharam
 *   aoDesconhecido(lista)        a cena usou algo que a descrição não cobre
 *
 * Resolve com quem responder primeiro: o clique na tela do anfitrião ou a
 * resposta remota. Resposta inválida é ignorada e a espera continua.
 *
 * NUNCA deixa o anfitrião sem tela: se descrever, transmitir ou esperar a
 * resposta falhar (a conexão caiu), a narrativa segue SÓ com a tela local, como
 * no solo. As cenas fazem `await narrar` sem try/catch, então uma rejeição aqui
 * derrubaria a cena inteira.
 */
export function criarPortaCompartilhada({ local, transmitir, esperarResposta, aoDesconhecido = () => {}, aoFalhar = () => {} }) {
  let seq = 0;
  const seguro = (fn) => { try { return fn(); } catch (e) { try { aoFalhar(e); } catch { /* o aviso também falhou */ } return undefined; } };

  return async function narrarCompartilhado(root, opts) {
    const id = ++seq;
    const feito = seguro(() => descreverNarrativa(opts));
    if (feito?.desconhecidos.length) seguro(() => aoDesconhecido(feito.desconhecidos));
    if (feito) seguro(() => transmitir({ tipo: 'abrir', id, pedido: feito.pedido }));

    const cancelar = new AbortController();
    let decidido = false;

    // A tela local recebe o ÍNDICE no lugar do valor: dois botões com o mesmo
    // `valor` continuam distintos, e o que se transmite é exatamente o que foi clicado.
    const escolhas = opts.escolhas?.length ? opts.escolhas.map((e, indice) => ({ ...e, valor: indice })) : opts.escolhas;
    const traduzir = (r) => (opts.escolhas?.length ? { valor: opts.escolhas[r].valor, indice: r } : { valor: 'fim', indice: null });
    const aqui = local(root, { ...opts, escolhas, sinal: cancelar.signal })
      .then((r) => (decidido ? null : traduzir(r)));

    const corridas = [aqui];
    if (feito) {
      corridas.push((async () => {
        for (;;) {
          const r = await esperarResposta(id, cancelar.signal);
          if (decidido) return null;
          const v = valorDaResposta(opts, r);
          if (v.ok) return { valor: v.valor, indice: opts.escolhas?.length ? r.indice : null };
        }
      })());
    }

    let vencedor;
    try {
      vencedor = await Promise.race(corridas);
    } catch (e) {
      // A espera remota caiu (ou a tela local quebrou). Sem tela local, não há o que fazer
      // além de propagar; com ela, o anfitrião decide sozinho.
      seguro(() => aoFalhar(e));
      vencedor = await aqui;
    } finally {
      decidido = true;
      cancelar.abort();
    }
    if (feito) seguro(() => transmitir({ tipo: 'fechar', id, indice: vencedor?.indice ?? null }));
    return vencedor?.valor;
  };
}
