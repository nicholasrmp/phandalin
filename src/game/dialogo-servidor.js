// O QUE O SERVIDOR DO DIÁLOGO FAZ COM UMA PERGUNTA, sem saber onde roda: o plugin do Vite (`dev/servidor-dialogo.mjs`) guarda em
// arquivo, e o Worker (`worker/dialogo-do.js`) guarda no Durable Object. Nenhum dos dois caminhos entra no código do navegador.
//
// A ORDEM DE UMA PERGUNTA, da mais barata para a mais cara:
//   1. o banco: de graça, e o cliente já olhou o banco que veio com o jogo antes de chegar aqui;
//   2. o teto de gasto: estourou, responde sem modelo;
//   3. o modelo. Resposta aprovada por `conferir` vai para o banco; reprovada, não vai a lugar nenhum.
//
// A conversa não manda histórico: cada pergunta é independente, e é isso que deixa a fala reaproveitável.
import { FICHAS } from './npc-saber.js';
import {
  ESQUEMA, MAX_PERGUNTA, montarSistema, mensagemDoJogador, conferir, buscarNoBanco, guardarNoBanco, responderSemModelo, limparMemoria, perguntaDeManobra,
} from './dialogo-ia.js';

/** Dólares por milhão de tokens. Modelo fora da tabela é recusado: sem preço, o teto não vale. */
export const PRECOS = { 'claude-opus-5-5': [4, 20], 'claude-sonnet-5-5': [2, 10], 'claude-haiku-5-5': [0.1, 0.5] };

/** Quantas respostas reprovadas o caixa lembra: num servidor público, a lista não pode crescer sem fim. */
const MAX_REPROVADAS = 200;
/** Quantas falas já ditas a conversa manda para não ouvir de novo. */
export const MAX_EVITAR = 12;

export const gastosVazios = () => ({ usd: 0, chamadas: 0, reprovadas: [] });

export function custoDe(modelo, usage) {
  const [ent, sai] = PRECOS[modelo];
  const lidos = usage.cache_read_input_tokens ?? 0;
  const escritos = usage.cache_creation_input_tokens ?? 0;
  return ((usage.input_tokens + lidos * 0.1 + escritos * 1.25) * ent + usage.output_tokens * sai) / 1e6;
}

/** O pedido ao modelo, igual para a pergunta do jogo e para o lote (`dev/gerar-lote.mjs`). */
export const pedidoDoModelo = (modelo, ficha, liberados, pergunta, memoria = []) => ({
  model: modelo,
  max_tokens: 1500,
  output_config: { effort: 'low', format: { type: 'json_schema', schema: ESQUEMA } },
  // O sistema é o mesmo enquanto a conversa com aquele NPC durar: em cache, cada pergunta seguinte paga 10% dele.
  system: [{ type: 'text', text: montarSistema(ficha, liberados), cache_control: { type: 'ephemeral' } }],
  messages: [{ role: 'user', content: mensagemDoJogador(pergunta, memoria) }],
});

/** Uma chamada ao modelo. `client` é o do SDK, que quem chama cria. Devolve a resposta já lida, ou `{ erro }`. */
export async function chamarModelo(client, modelo, ficha, liberados, pergunta, memoria = []) {
  const pedido = pedidoDoModelo(modelo, ficha, liberados, pergunta, memoria);
  // Fala de goblin ameaçando um refém pode esbarrar num classificador; no Opus, o próprio servidor tenta outro modelo.
  const resposta = modelo === 'claude-opus-5-5'
    ? await client.beta.messages.create({ ...pedido, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' })
    : await client.messages.create(pedido);
  const custo = custoDe(modelo, resposta.usage);
  if (resposta.stop_reason === 'refusal') return { erro: 'recusa do modelo', custo, usage: resposta.usage };
  if (resposta.stop_reason === 'max_tokens') return { erro: 'cortada em max_tokens', custo, usage: resposta.usage };
  const texto = resposta.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  try {
    return { r: JSON.parse(texto), custo, usage: resposta.usage };
  } catch {
    return { erro: 'JSON inválido', custo, usage: resposta.usage };
  }
}

/**
 * O tratamento de uma pergunta. `guarda`: `lerBanco`, `gravarBanco`, `lerGastos`, `gravarGastos`, todas podem ser assíncronas.
 * O caixa e o banco são relidos DEPOIS da chamada ao modelo: no Worker chegam perguntas ao mesmo tempo, e gravar o que se leu
 * antes de esperar o modelo apagaria o gasto da outra.
 */
export async function responderPergunta(corpo, { chamar, modelo, teto, guarda }) {
  const idFicha = String(corpo?.npc ?? '');
  const ficha = Object.hasOwn(FICHAS, idFicha) ? FICHAS[idFicha] : null;
  const pergunta = String(corpo?.pergunta ?? '').trim();
  if (!ficha || !pergunta || pergunta.length > MAX_PERGUNTA) return { status: 400, corpo: { erro: 'pedido inválido' } };
  const validos = ficha.fatos.map((f) => f.id);
  const liberados = (Array.isArray(corpo.liberados) ? corpo.liberados : []).filter((id) => validos.includes(id));

  const evitar = (Array.isArray(corpo.evitar) ? corpo.evitar : []).filter((q) => typeof q === 'string').slice(-MAX_EVITAR);
  const memoria = limparMemoria(corpo.memoria);
  const semModelo = (motivo) => ({ status: 200, corpo: { ...responderSemModelo(ficha, liberados, pergunta), origem: 'reserva', motivo } });
  if (perguntaDeManobra(pergunta)) return semModelo('manobra');

  // Com memória a resposta depende da conversa: não sai do banco nem vai para ele.
  if (!memoria.length) {
    const salva = buscarNoBanco(await guarda.lerBanco(), idFicha, ficha, liberados, pergunta, { evitar });
    if (salva) return { status: 200, corpo: { ...salva, origem: 'banco' } };
  }

  if (!chamar) return semModelo('sem chave');
  if ((await guarda.lerGastos()).usd >= teto) return semModelo('teto de gasto');

  let saida;
  try {
    saida = await chamar(modelo, ficha, liberados, pergunta, memoria);
  } catch (e) {
    return semModelo(`API: ${e.status ?? e.name}`);
  }
  const gastos = await guarda.lerGastos();
  gastos.usd += saida.custo ?? 0;
  gastos.chamadas += 1;
  // O nome que o próprio jogador disse antes o NPC pode repetir: lembrar o que ouviu não é saber o que não sabe.
  const ouvido = [pergunta, ...memoria.map((m) => m.p)].join(' ');
  const motivo = saida.erro ?? conferir(ficha, liberados, ouvido, saida.r);
  if (motivo) {
    gastos.reprovadas = [...gastos.reprovadas, { npc: idFicha, pergunta, motivo, fala: saida.r?.fala ?? null }].slice(-MAX_REPROVADAS);
    await guarda.gravarGastos(gastos);
    return semModelo(`reprovada: ${motivo}`);
  }
  if (!memoria.length) await guarda.gravarBanco(guardarNoBanco(await guarda.lerBanco(), idFicha, ficha, liberados, pergunta, saida.r, modelo));
  await guarda.gravarGastos(gastos);
  return { status: 200, corpo: { ...saida.r, origem: 'modelo', custo: saida.custo } };
}
