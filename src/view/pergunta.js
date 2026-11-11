// A CAIXA DE "PERGUNTAR OUTRA COISA". O jogador escreve, e duas coisas podem acontecer:
//
//   só conversa   o NPC responde (`game/perguntar.js`) e nada muda na cena;
//   teste         persuadir, intimidar ou enganar são os TESTES DO NÓ em que a conversa está, com a CD e a consequência
//                 da árvore. Quem decide é o dado, nunca o modelo: o jogador escolhe o botão ou escreve uma ameaça, o
//                 jogo reconhece o tom (`tomDe`) e pergunta antes de rolar, porque falhar pode custar a luta ou o refém.
//
// Tudo passa por `narrar`, então a caixa funciona numa sala: quem decide digita, os outros veem a caixa travada, e a
// pergunta e a resposta aparecem para todos. O texto de outro jogador chega cortado (`porta-narrativa.js`).
import { narrar } from './narrativa.js';
import { perguntarAoNpc, memoriaDoNpc, lembrar } from '../game/perguntar.js';
import { fatosLiberados, FICHAS, idDaFicha } from '../game/npc-saber.js';
import { MAX_PERGUNTA, tomDe, ofertaDe } from '../game/dialogo-ia.js';
import { continuarAssunto, normal } from '../game/perguntas.js';

const VERBO = { persuasao: 'Persuadir', intimidacao: 'Intimidar', enganacao: 'Enganar' };
const nomeDoTeste = (t) => VERBO[t.pericia] ?? t.rotulo;

/**
 * A conversa livre. `testes`: os testes do nó de onde se veio. Devolve `null` quando o jogador desiste, ou
 * `{ valor, citacao }` quando ele escolhe um teste: a conversa segue na árvore com o resultado do dado.
 */
export async function conversaLivre(app, npc, estado, { testes = [], falante = null, comOferta = null, memoria = { chave: null, ditas: [] } } = {}) {
  const fala = (nome, texto) => ({ nome: `${nome}:`, texto });
  const quem = falante ?? 'O grupo';
  for (let i = 0; i < 100; i += 1) {
    const r = await narrar(app.root, {
      formato: 'painel', lista: true,
      campoTexto: { dica: `O que você diz a ${npc.name}?`, maximo: MAX_PERGUNTA },
      paginas: [{ retrato: npc.look, texto: [] }],
      escolhas: [
        { rotulo: 'Dizer isso', valor: 'dizer' },
        ...testes.map((t) => ({ rotulo: `${nomeDoTeste(t)}: ${t.rotulo}`, detalhe: t.detalhe, motivo: t.motivo, valor: t })),
        { rotulo: 'Deixar para lá', valor: 'nao' },
      ],
    });
    const texto = String(r?.texto ?? '').trim();
    const citacao = texto ? fala(quem, `"${texto}"`) : null;
    if (!r || r.valor === 'nao') return null;
    if (r.valor !== 'dizer') return { valor: r.valor.valor, citacao };
    if (!texto) continue;

    // Uma ameaça escrita, com um teste de Intimidação disponível: é o teste, se o jogador confirmar.
    const tom = tomDe(texto);
    const teste = testes.find((t) => t.pericia === tom && !t.motivo);
    if (teste) {
      // O ouro de verdade: sai da ficha agora, passe ou não no dado, e dá vantagem. Só no teste de persuasão.
      const quantia = teste.pericia === 'persuasao' ? ofertaDe(texto) : null;
      const oferta = quantia != null ? comOferta?.(teste, quantia) : null;
      const c = await narrar(app.root, {
        formato: 'painel', lista: true,
        paginas: [{ texto: [citacao, `Isso soa como ${nomeDoTeste(teste).toLowerCase()}. Rolar o dado pode mudar a cena, para o bem ou para o mal.`] }],
        escolhas: [
          ...(oferta ? [{ rotulo: `Pagar ${quantia} po e ${nomeDoTeste(teste).toLowerCase()}, com vantagem`, detalhe: oferta.detalhe, motivo: oferta.motivo, valor: 'pagar' }] : []),
          { rotulo: quantia != null ? `${nomeDoTeste(teste)} sem pagar` : `${nomeDoTeste(teste)}`, detalhe: teste.detalhe, valor: 'rolar' },
          { rotulo: 'Só conversar, sem forçar', valor: 'conversar' },
          { rotulo: 'Reescrever', valor: 'voltar' },
        ],
      });
      if (c === 'pagar') return { valor: oferta.pagar(), citacao };
      if (c === 'rolar') return { valor: teste.valor, citacao };
      if (c !== 'conversar') continue;
    }

    const aviso = document.createElement('p');
    aviso.className = 'narrativa-pensando';
    aviso.setAttribute('role', 'status');
    aviso.textContent = `${npc.name} pensa…`;
    app.root.append(aviso);
    app.avisarPensando?.(aviso.textContent);
    const completa = continuarAssunto(texto, memoria);
    const lembranca = memoriaDoNpc(app, npc);
    const resposta = await perguntarAoNpc(npc, texto, estado, { evitar: memoria.ditas, memoria: lembranca, completa, perguntasNaConversa: memoria.perguntas ?? 0 });
    memoria.perguntas = (memoria.perguntas ?? 0) + 1;
    memoria.ditas.push(resposta.q ?? normal(completa));
    lembrar(lembranca, completa, resposta, fatosLiberados(FICHAS[idDaFicha(npc)], estado));
    aviso.remove();
    app.avisarPensando?.(null);
    await narrar(app.root, {
      formato: 'painel',
      paginas: [{ retrato: npc.look, texto: [citacao, fala(npc.name, resposta.fala)] }],
    });
  }
  return null;
}
