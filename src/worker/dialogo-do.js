// O DIÁLOGO COM MODELO NA PUBLICAÇÃO: um Durable Object só, para o caixa e as falas aprendidas serem um lugar único. Quem pergunta
// é a tela do anfitrião, que conduz a cena; a pergunta do convidado chega a ela pela sala e vem para cá igual à de qualquer um.
//
// Ele só existe com o segredo `ANTHROPIC_API_KEY` (`wrangler secret put`): sem o segredo o Worker nem acorda este objeto, e o jogo
// responde com o banco e as falas escritas à mão. O teto (`DIALOGO_TETO_USD`) é o gasto total deste objeto.
import { DurableObject } from 'cloudflare:workers';
import Anthropic from '@anthropic-ai/sdk';
import { bancoVazio } from '../game/dialogo-ia.js';
import { PRECOS, chamarModelo, gastosVazios, responderPergunta } from '../game/dialogo-servidor.js';

/** O armazenamento aceita 2 MB por chave. Passou disso, para de aprender e segue respondendo: o que falta é baixar o banco. */
const MAX_BANCO = 1_500_000;

export class DialogoDO extends DurableObject {
  async fetch(request) {
    const armazem = this.ctx.storage;
    const lerBanco = async () => (await armazem.get('banco')) ?? bancoVazio();
    if (request.method === 'GET') return Response.json(await lerBanco());

    let corpo = null;
    try { corpo = await request.json(); } catch { /* cai no 400 */ }
    const modelo = this.env.DIALOGO_MODELO || 'claude-opus-5-5';
    const client = new Anthropic({ apiKey: this.env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 30000 });
    const r = await responderPergunta(corpo, {
      chamar: PRECOS[modelo] ? (m, f, l, p, mem) => chamarModelo(client, m, f, l, p, mem) : null,
      modelo,
      teto: Number(this.env.DIALOGO_TETO_USD ?? 10),
      guarda: {
        lerBanco,
        gravarBanco: async (b) => { if (JSON.stringify(b).length <= MAX_BANCO) await armazem.put('banco', b); },
        lerGastos: async () => (await armazem.get('gastos')) ?? gastosVazios(),
        gravarGastos: (g) => armazem.put('gastos', g),
      },
    });
    return Response.json(r.corpo, { status: r.status });
  }
}
