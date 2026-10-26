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
export { LimitadorDO } from './limitador-do.js';

const PREFIXO = '/api/sala/';
const NOVA_SALA = '/api/nova-sala';

/** O IP é do próprio computador (desenvolvimento)? Lá todos os jogadores de teste são o mesmo IP. */
const ehLocal = (ip) => ip === 'local' || ip === '127.0.0.1' || ip === '::1';

/** O IP de quem chama (o Cloudflare o dá no cabeçalho; em desenvolvimento local não há, e todos são "local"). */
const ipDe = (request) => request.headers.get('CF-Connecting-IP') ?? 'local';

async function perguntar(env, request, corpo) {
  const limitador = env.LIMITES.get(env.LIMITES.idFromName(`ip:${ipDe(request)}`));
  const r = await limitador.fetch('https://limitador/', { method: 'POST', body: JSON.stringify(corpo) });
  return { status: r.status, dados: await r.json() };
}

/** Só o próprio site fala com o servidor (não é autenticação: só impede que outra página use o servidor por baixo dos panos). */
function origemPermitida(request, url) {
  const origem = request.headers.get('Origin');
  if (!origem) return true;
  try { return new URL(origem).host === url.host; } catch { return false; }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Um código de sala novo, sorteado aqui: no máximo algumas por hora para cada IP.
    if (url.pathname === NOVA_SALA) {
      if (request.method !== 'POST') return new Response('use POST', { status: 405 });
      if (!origemPermitida(request, url)) return new Response('origem não permitida', { status: 403 });
      const r = await perguntar(env, request, { op: 'emitir', contar: !ehLocal(ipDe(request)) });
      if (r.status === 429) return Response.json({ erro: 'salas novas demais; tente mais tarde' }, { status: 429, headers: { 'Retry-After': String(Math.ceil((r.dados.espera ?? 60_000) / 1000)) } });
      return r.dados.ok ? Response.json({ codigo: r.dados.codigo }) : new Response('erro', { status: 500 });
    }
    if (!url.pathname.startsWith(PREFIXO)) return new Response('não encontrado', { status: 404 });

    let bruto;
    try { bruto = decodeURIComponent(url.pathname.slice(PREFIXO.length)); } catch { return new Response('código inválido', { status: 400 }); }
    const codigo = normalizarCodigo(bruto);
    if (!codigo) return new Response('código inválido', { status: 400 });
    if ((request.headers.get('Upgrade') ?? '').toLowerCase() !== 'websocket') return new Response('esperava WebSocket', { status: 426 });

    // O navegador sempre manda `Origin` no WebSocket: só o próprio site abre sala.
    // (Não é autenticação, é só impedir que outra página use o servidor por baixo dos panos.)
    if (!origemPermitida(request, url)) return new Response('origem não permitida', { status: 403 });

    // Quem tenta conexões demais (varrendo códigos) toma 429; e fica anotado se o código foi pedido por este IP.
    // Desenvolvimento local (wrangler dev, testes): as conexões não são contadas, só as salas novas.
    // Se o limitador falhar, a sala continua abrindo (o limite é proteção, não porta): só não conta nem confere o código.
    let r;
    try { r = await perguntar(env, request, { op: 'entrar', codigo, contar: !ehLocal(ipDe(request)) }); } catch { r = { status: 200, dados: { ok: true, emitido: env.CODIGO_DO_SERVIDOR !== '1' } }; }
    if (r.status === 429) return new Response('devagar: conexões demais', { status: 429, headers: { 'Retry-After': String(Math.ceil((r.dados.espera ?? 60_000) / 1000)) } });

    const id = env.SALAS.idFromName(codigo);
    const pedido = new Request(request, { headers: new Headers(request.headers) });
    pedido.headers.set('x-sala', codigo);
    pedido.headers.set('x-emitido', r.dados.emitido ? '1' : '0');
    pedido.headers.set('x-exigir-emitido', env.CODIGO_DO_SERVIDOR === '1' ? '1' : '0');
    return env.SALAS.get(id).fetch(pedido);
  },
};
