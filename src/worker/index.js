// O Worker do Phandalin. O site continua sendo só arquivos estáticos (o build do
// Vite): `run_worker_first = ["/api/*"]` no `wrangler.toml` faz o Cloudflare
// servir os arquivos SEM acordar este código, e só o que começa com `/api/` chega
// aqui. É o que mantém o plano grátis folgado (100 mil requisições por dia).
//
//   GET /api/sala/<CÓDIGO>   abre o WebSocket da sala (Upgrade)
//
// Cada código é um Durable Object (`SalaDO`). Quem abre a sala manda `criar` como
// primeira mensagem; quem chega depois manda `entrar`. O id do jogador vai nessa
// primeira mensagem, NÃO na URL (a URL aparece nos registros).

import { normalizarCodigo } from '../game/sala.js';

export { SalaDO } from './sala-do.js';

const PREFIXO = '/api/sala/';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith(PREFIXO)) return new Response('não encontrado', { status: 404 });

    let bruto;
    try { bruto = decodeURIComponent(url.pathname.slice(PREFIXO.length)); } catch { return new Response('código inválido', { status: 400 }); }
    const codigo = normalizarCodigo(bruto);
    if (!codigo) return new Response('código inválido', { status: 400 });
    if ((request.headers.get('Upgrade') ?? '').toLowerCase() !== 'websocket') return new Response('esperava WebSocket', { status: 426 });

    // O navegador sempre manda `Origin` no WebSocket: só o próprio site abre sala.
    // (Não é autenticação, é só impedir que outra página use o servidor por baixo dos panos.)
    const origem = request.headers.get('Origin');
    if (origem) {
      let host = null;
      try { host = new URL(origem).host; } catch { /* origem malformada */ }
      if (host !== url.host) return new Response('origem não permitida', { status: 403 });
    }

    const id = env.SALAS.idFromName(codigo);
    const pedido = new Request(request, { headers: new Headers(request.headers) });
    pedido.headers.set('x-sala', codigo);
    return env.SALAS.get(id).fetch(pedido);
  },
};
