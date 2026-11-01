// Livro do Jogador não é SRD: a Maldição de Strahd é conteúdo da Wizards. TEXTO nosso, fatos do livro — ver NOTICE.md e STRAHD.md.
//
// A INVESTIGAÇÃO da Casa da Morte: os pontos de `casadamorte-pistas.js` viram opções do botão direito (uma por perícia), passivas ao
// entrar na sala, auras para o Detectar Magia e o diário do grupo.
//
// ESTADO (em `salvo`, que o save guarda): `pistas` ('ponto:perícia' → true quando alguém passou), `marcas` (o que as pistas deixaram
// sabido: 'gricAvisado', 'mimicoVisto'...), `diario` (cada descoberta, na ordem).

import { skillBonus, SKILL_NAME } from '../rules/abilities.js';
import { PISTAS } from './casadamorte-pistas.js';
import { narrar } from '../view/narrativa.js';

const dist = (c, p) => Math.max(Math.abs(c.pos.x - p.x), Math.abs(c.pos.y - p.y));
const nomeDaPericia = (p) => SKILL_NAME[p] ?? p;
const estado = (ctx) => {
  const s = ctx.salvo;
  s.pistas ??= {};
  s.marcas ??= {};
  s.diario ??= [];
  return s;
};

/** O que cada marca deixa sabido no mundo (além de ficar no diário). */
function aplicarMarca(ctx, marca) {
  const s = estado(ctx);
  s.marcas[marca] = true;
  if (marca === 'sabeDoFosso' && !s.espinhos) s.espinhos = 'achado';
}

/** Os pontos de uma variante que cobrem esta casa, do mais perto ao mais longe. */
function pontosEm(ctx, tile) {
  return (PISTAS[ctx.variante] ?? [])
    .filter((p) => Math.max(Math.abs(p.x - tile.x), Math.abs(p.y - tile.y)) <= (p.r ?? 1))
    .sort((a, b) => Math.max(Math.abs(a.x - tile.x), Math.abs(a.y - tile.y)) - Math.max(Math.abs(b.x - tile.x), Math.abs(b.y - tile.y)))
    .slice(0, 2);
}

export function pistasInteracoes(ctx, { tile, c, ops }) {
  const s = estado(ctx);
  for (const p of pontosEm(ctx, tile)) {
    const grupo = `Examinar: ${p.nome}`;
    const alcance = Math.max(15, (p.r ?? 1) * 5 + 10);
    const longe = ctx.longe(c, p, alcance);
    ops.push({
      grupo, rotulo: `Olhar ${p.nome.charAt(0).toLowerCase()}${p.nome.slice(1)}`, icone: 'acao-procurar', detalhe: 'de relance', motivo: null,
      fazer: async () => { await ctx.painel(p.olhar, { titulo: p.nome }); },
    });
    for (const v of p.verbos) {
      const chave = `${p.id}:${v.p}`;
      const feito = Boolean(s.pistas[chave]);
      ops.push({
        grupo, rotulo: `${nomeDaPericia(v.p)}`, icone: 'acao-procurar',
        detalhe: feito ? 'já descoberto' : `CD ${v.cd} · uma tentativa por herói`,
        motivo: feito ? 'já descoberto' : (ctx.buscas.ja(c, chave, p) ?? longe),
        fazer: async () => {
          ctx.buscas.marcar(c, chave, p);
          const t = ctx.teste(c, v.p, v.cd);
          ctx.enc.say('acao', `${p.nome}: ${nomeDaPericia(v.p)} de ${t.quem?.name ?? c.name}, ${t.total} contra CD ${v.cd}: ${t.passou ? 'descobre algo' : 'nada de novo'}.`);
          if (!t.passou) {
            await ctx.painel(v.falha ?? `${c.name} olha com atenção (${nomeDaPericia(v.p)}) e não tira nada de novo. Outros olhos, ou outro jeito de olhar, podem achar.`, { titulo: p.nome });
            return;
          }
          s.pistas[chave] = true;
          s.diario.push({ id: chave, titulo: p.nome, texto: v.ok, por: t.quem?.name ?? c.name, pericia: v.p });
          if (v.marca) aplicarMarca(ctx, v.marca);
          await ctx.painel(v.ok, { titulo: `${p.nome} — ${nomeDaPericia(v.p)}` });
          ctx.app.refresh();
        },
      });
    }
  }
  if (s.diario.length) {
    ops.push({
      grupo: 'A casa', rotulo: 'Rever as pistas', icone: 'acao-procurar', detalhe: `${s.diario.length} descoberta${s.diario.length > 1 ? 's' : ''}`, motivo: null,
      fazer: async () => {
        const paginas = [];
        for (let i = 0; i < s.diario.length; i += 4) {
          paginas.push({ titulo: 'Rever as pistas', texto: s.diario.slice(i, i + 4).map((d) => `${d.titulo} (${nomeDaPericia(d.pericia)}, ${d.por}): ${d.texto}`) });
        }
        await narrar(ctx.root, { formato: 'painel', paginas });
      },
    });
  }
}

/** Ao entrar numa sala: quem tem a perícia passiva alta o bastante repara sozinho (10 + bônus da perícia). */
export async function pistasPassivas(ctx, area) {
  if (!area) return;
  const s = estado(ctx);
  for (const p of PISTAS[ctx.variante] ?? []) {
    if (!p.passiva || s.pistas[`${p.id}:passiva`]) continue;
    const dentro = area.contem ? area.contem(p) : p.x >= area.x1 && p.x <= area.x2 && p.y >= area.y1 && p.y <= area.y2;
    if (!dentro) continue;
    const quem = ctx.herois().find((h) => 10 + skillBonus(h, p.passiva.p) >= p.passiva.cd);
    if (!quem) continue;
    s.pistas[`${p.id}:passiva`] = true;
    s.diario.push({ id: `${p.id}:passiva`, titulo: p.nome, texto: p.passiva.texto, por: quem.name, pericia: p.passiva.p });
    await ctx.painel(`${quem.name} repara (${nomeDaPericia(p.passiva.p)} passiva ${10 + skillBonus(quem, p.passiva.p)}): ${p.passiva.texto}`, { titulo: p.nome });
  }
}

/** As auras do Detectar Magia: todo ponto da variante com `aura`. */
export function pistasAuras(ctx) {
  return (PISTAS[ctx.variante] ?? []).filter((p) => p.aura).map((p) => ({
    id: `aura:${p.id}`, tipo: 'magico', x: p.x, y: p.y, nome: p.nome, aura: p.aura,
  }));
}
