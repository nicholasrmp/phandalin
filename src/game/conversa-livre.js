// A PORTA DA CONVERSA LIVRE para quem não tem árvore de diálogo: os NPCs do Obelisco (capítulos 5 a 8) falam por painéis de
// escolha, e a caixa "Perguntar outra coisa…" (`game/dialogo.js`) só existe dentro de uma conversa. Esta é a conversa de UM nó:
// a saudação dele, a caixa (que `dialogo.js` acrescenta sozinho a quem tem ficha de saber) e a despedida.
//
// Dois caminhos chegam aqui: o "Conversar" do botão direito num NPC do tabuleiro que tem ficha e nenhuma árvore
// (`main.js conversar`), e a opção de painel das cenas que só narram o NPC (`conversaLivreCom`, a Gwyn na Stonehill, o Jomlus).
import { conversar } from './dialogo.js';
import { podePerguntar } from './perguntar.js';
import { FICHAS, idDaFicha } from './npc-saber.js';

/** A árvore de um nó: a saudação (do NPC, ou a primeira fala dele, ou o "quem é" da ficha) e a saída. */
export function arvoreLivre(npc, { saudacao = null, narra = null, despedida = 'Até mais.' } = {}) {
  const ficha = FICHAS[idDaFicha(npc)];
  const fala = saudacao ?? npc.saudacao ?? npc.falas?.[0] ?? npc.frase ?? ficha?.fatos?.find((f) => f.id === 'quem')?.fala ?? '…';
  return { inicio: 'oi', nos: { oi: { ...(narra ? { narra } : {}), fala, opcoes: [{ texto: despedida, fim: 'sai' }] } } };
}

/**
 * Abre a conversa livre com `npc` (um combatente do tabuleiro, ou só `{ name, look }` de quem a cena narra) pela ficha `ficha`.
 * Devolve o fim da conversa, ou null se não há ficha com esse id.
 */
export async function conversaLivreCom(app, npc, { ficha = null, fora = null, ...opts } = {}) {
  const alvo = npc ?? {};
  if (ficha) alvo.ficha = ficha;
  if (!podePerguntar(alvo)) return null;
  // `fora`: fora do tabuleiro (a vila), os heróis, o dado e o registro, como a vila passa a toda conversa
  return conversar(app, alvo, arvoreLivre(alvo, opts), fora);
}

/**
 * QUEM ESTÁ NA VILA para conversar, nos capítulos 5 a 8 do Obelisco (`estagio`, de `estagioDoObelisco`). Os moradores de sempre e os
 * que o Obelisco traz (a Gwyn depois de conhecida, a Trilena e o Carp no capítulo 6, o Pip depois de voltar para casa). No capítulo 8
 * os quatro que o ritual tomou estão trancados em casa e falam pela porta; o Toblen, pela janela da Stonehill fechada.
 */
export function quemConversaNaVila(camp, estagio) {
  if (!estagio) return [];
  const o5 = camp?.obelisco5?.feito ?? {};
  const o6 = camp?.obelisco6?.feito ?? {};
  const trancados = estagio === 8 ? new Set(['irmaGaraele', 'halia', 'ander', 'wheel']) : new Set();
  const lista = [
    'harbin', 'toblen', 'tamara', 'halia', 'irmaGaraele', 'elmar', 'ander', 'daran', 'qelline', 'grista', 'wheel',
    ...(o5.gwyn ? ['gwyn'] : []),
    ...(estagio >= 6 ? ['trilena', 'carp'] : []),
    ...(o6.pipRecompensa ? ['pip'] : []),
  ];
  return lista.filter((id) => Object.hasOwn(FICHAS, id)).map((id) => ({
    ficha: id, nome: FICHAS[id].nome,
    detalhe: trancados.has(id) ? 'pela porta, trancado em casa' : id === 'toblen' && estagio === 8 ? 'pela janela da Stonehill' : null,
  }));
}

/** A opção de painel que abre a conversa livre: só aparece se a ficha existir. */
export const opcaoDeConversa = (ficha, nome) => (Object.hasOwn(FICHAS, ficha)
  ? [{ rotulo: `Conversar com ${nome}`, detalhe: 'pergunte o que quiser', valor: `conversa:${ficha}` }]
  : []);
