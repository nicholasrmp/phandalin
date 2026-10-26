// Um Durable Object por IP: guarda quantos códigos de sala ele pediu e quantas conexões tentou (`limites.js` decide).
// Dorme entre pedidos; o estado vive em `ctx.storage`.

import { DurableObject } from 'cloudflare:workers';
import { novoEstado, emitir, entrar } from './limites.js';
import { aleatorioSeguro } from '../game/sala.js';

export class LimitadorDO extends DurableObject {
  async fetch(request) {
    let pedido;
    try { pedido = await request.json(); } catch { return Response.json({ ok: false, erro: 'pedido inválido' }, { status: 400 }); }
    const est = (await this.ctx.storage.get('estado')) ?? novoEstado();
    const agora = Date.now();
    const r = pedido.op === 'emitir' ? emitir(est, agora, (n) => aleatorioSeguro(n), { limitar: pedido.contar !== false })
      : pedido.op === 'entrar' && typeof pedido.codigo === 'string' ? entrar(est, agora, pedido.codigo, { contar: pedido.contar !== false })
        : { ok: false, erro: 'pedido inválido' };
    await this.ctx.storage.put('estado', est);
    return Response.json(r, { status: r.ok ? 200 : (r.espera ? 429 : 400) });
  }
}
