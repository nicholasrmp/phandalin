// As ações do lote 14 que abrem painel (precisam da tela): mandar o bicho espiar (Sentidos da Fera)
// e perguntar às plantas (Falar com Plantas). O resto — ganchos, textos, marcas — mora em
// `magias-fora-nucleo.js`, que não toca na tela e se testa em Node.

import { narrar } from '../view/narrativa.js';
import { distanceFt } from '../core/grid.js';
import { ativaDe, avancar } from '../rules/utilidade.js';
import { criaturasDaCena, plantasPerto } from './magias-fora-nucleo.js';

/** Sentidos da Fera: o bicho vai a uma casa e olha. `x` é o contexto, `tile` a casa. */
export async function espiar(app, x, c, tile) {
  const { estado } = x;
  const herois = x.herois();
  const a = ativaDe(estado, herois, 'sentidosDaFera', { por: c });
  if (!a) return { ok: false, why: 'Sentidos da Fera não está de pé' };
  const noTabuleiro = (app.enc?.combatants ?? []).find((m) => m.id === a.data?.bicho);
  const origem = noTabuleiro?.pos ?? c.pos;
  const nomeDoBicho = noTabuleiro?.name ?? (estado.familiar ? `${estado.familiar.nome} (familiar)` : 'o bicho');
  if (distanceFt(origem, tile) > 60) return { ok: false, why: 'longe demais para o bicho: até 18 m' };
  const fim = avancar(estado, 1, herois);
  const vistos = criaturasDaCena(app).filter((m) => m.side !== 'party' && !m.dead && m.hp > 0 && m.pos
    && distanceFt(tile, m.pos) <= 30 && app.enc.field.hasLineOfSight({ x: tile.x, y: tile.y }, m.pos));
  const texto = [];
  if (!vistos.length) texto.push(`${nomeDoBicho} vai até lá e olha. Ninguém à vista, só o cheiro do lugar.`);
  else {
    const cont = new Map();
    for (const m of vistos) cont.set(m.name, (cont.get(m.name) ?? 0) + 1);
    texto.push(`${nomeDoBicho} vai até lá, rente à parede, e olha. ${c.name} vê pelos olhos dele: ${[...cont].map(([n, k]) => (k > 1 ? `${k}× ${n}` : n)).join(', ')}.`);
    (estado.marcas ??= []);
    estado.marcas = estado.marcas.filter((m) => m.tipo !== 'espiado' || m.fim > estado.minutos);
    for (const m of vistos.slice(0, 10)) {
      estado.marcas.push({ id: `espiado:${m.id}`, tipo: 'espiado', x: m.pos.x, y: m.pos.y, nome: m.name, fim: estado.minutos + 10, lugar: app.capitulo?.lugar ?? null });
    }
    app.capitulo?.espiou?.(vistos);
  }
  texto.push(...fim);
  await narrar(app.root, { formato: 'painel', paginas: [{ titulo: 'Sentidos da Fera', texto }] });
  app.refresh?.();
  return { ok: true, vistos };
}

/** Falar com Plantas: pergunta ao mato. O capítulo diz o que ele sabe (`plantasSabem`). */
export async function perguntarAsPlantas(app, x, c) {
  const a = ativaDe(x.estado, x.herois(), 'falarComPlantas', { por: c });
  if (!a) return { ok: false, why: 'Falar com Plantas não está de pé' };
  if (!plantasPerto(app, c)) {
    await narrar(app.root, { formato: 'painel', paginas: [{ titulo: 'Falar com Plantas', texto: [`Não há mato nem árvore a 9 m de ${c.name}: só pedra, musgo seco e raiz morta. Ninguém para conversar.`] }] });
    return { ok: true, vazio: true };
  }
  if (!app.capitulo?.plantasSabem) {
    await narrar(app.root, { formato: 'painel', paginas: [{ titulo: 'Falar com Plantas', texto: ['As plantas murmuram sobre chuva e sol, e de gente só sabem o grupo. Nada de novo.'] }] });
    return { ok: true, vazio: true };
  }
  await app.capitulo.plantasSabem(c);
  return { ok: true };
}
