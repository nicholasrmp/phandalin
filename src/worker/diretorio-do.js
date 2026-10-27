// O Durable Object do diretório das tavernas públicas: um só, com o nome fixo "unico". Guarda `{ instancias }` (`diretorio.js` decide).

import { DurableObject } from 'cloudflare:workers';
import { novoDiretorio, escolher, registrar, ehPublica } from './diretorio.js';
import { aleatorioSeguro } from '../game/sala.js';

export class DiretorioDO extends DurableObject {
  async fetch(request) {
    let pedido;
    try { pedido = await request.json(); } catch { return Response.json({ ok: false, erro: 'pedido inválido' }, { status: 400 }); }
    const est = (await this.ctx.storage.get('estado')) ?? novoDiretorio();
    const agora = Date.now();
    let r;
    if (pedido.op === 'escolher') r = { ok: true, ...escolher(est, agora, (n) => aleatorioSeguro(n)) };
    else if (pedido.op === 'registrar' && typeof pedido.codigo === 'string') r = { ok: registrar(est, agora, pedido.codigo, Number(pedido.n)) };
    else if (pedido.op === 'conferir' && typeof pedido.codigo === 'string') r = { ok: true, publica: ehPublica(est, pedido.codigo) };
    else r = { ok: false, erro: 'pedido inválido' };
    if (pedido.op !== 'conferir') await this.ctx.storage.put('estado', est);
    return Response.json(r, { status: r.ok ? 200 : 400 });
  }
}
