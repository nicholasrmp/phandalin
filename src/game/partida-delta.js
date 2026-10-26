// A VISTA EM DIFERENÇAS (MULTIJOGADOR.md, A-01): em vez de mandar todos os combatentes a cada publicação, o anfitrião manda só os
// que mudaram desde a publicação anterior. Quem perde o fio (entrou agora, ou uma diferença se perdeu) espera a próxima vista
// COMPLETA, que o anfitrião repete de tempos em tempos (`COMPLETA_A_CADA`) e a cada batimento.
//
// Puro: roda em Node. O anfitrião usa `criarEmissor`, o convidado `criarReceptor`.

/** De quantas em quantas publicações a vista sai completa, mesmo com tudo em ordem (quem entrou no meio se alcança). */
export const COMPLETA_A_CADA = 20;

const MAX_ORDEM = 200;

/**
 * O anfitrião. `publicar(vista, { completa })` devolve o que mandar: a própria vista (marcada com `seq`) ou uma diferença
 * (`{ delta: true, base, seq, ... }`) quando for bem menor que a completa. `completa: true` força a vista inteira (o batimento).
 */
export function criarEmissor() {
  let seq = 0;
  let base = null;           // { seq, variante, textos: Map id -> JSON }
  let desdeACompleta = 0;
  return {
    publicar(vista, { completa = false } = {}) {
      seq += 1;
      const textos = new Map(vista.combatentes.map((c) => [c.id, JSON.stringify(c)]));
      const inteira = () => { base = { seq, variante: vista.variante, textos }; desdeACompleta = 0; return { ...vista, seq }; };
      if (!base || completa || desdeACompleta >= COMPLETA_A_CADA || base.variante !== vista.variante || vista.combatentes.length > MAX_ORDEM) return inteira();
      const mudaram = vista.combatentes.filter((c) => base.textos.get(c.id) !== textos.get(c.id));
      const removidos = [...base.textos.keys()].filter((id) => !textos.has(id));
      const delta = {
        v: vista.v, delta: true, base: base.seq, seq, variante: vista.variante, rodada: vista.rodada, lado: vista.lado, acabou: vista.acabou,
        ordem: vista.combatentes.map((c) => c.id), mudaram, removidos, extras: vista.extras ?? null,
      };
      // Só vale se encolheu de verdade (numa luta que mexe com todo mundo, a completa é mais simples e do mesmo tamanho).
      if (JSON.stringify(delta).length > JSON.stringify(vista).length * 0.7) return inteira();
      base = { seq, variante: vista.variante, textos };
      desdeACompleta += 1;
      return delta;
    },
    /** O servidor ou a conexão trocou de mãos: a próxima sai completa. */
    reiniciar() { base = null; },
  };
}

/** A forma de uma diferença (o servidor confere antes de repassar). */
export function lerDelta(bruto) {
  let d;
  try { d = typeof bruto === 'string' ? JSON.parse(bruto) : bruto; } catch { return null; }
  if (!d || typeof d !== 'object' || d.delta !== true || d.v !== 1) return null;
  if (!Number.isInteger(d.base) || !Number.isInteger(d.seq) || typeof d.variante !== 'string') return null;
  if (!Array.isArray(d.ordem) || d.ordem.length > MAX_ORDEM || !d.ordem.every((id) => typeof id === 'string' && id.length <= 60)) return null;
  if (!Array.isArray(d.removidos) || d.removidos.length > MAX_ORDEM || !d.removidos.every((id) => typeof id === 'string')) return null;
  if (!Array.isArray(d.mudaram) || d.mudaram.length > MAX_ORDEM) return null;
  if (!d.mudaram.every((c) => c && typeof c.id === 'string' && c.pos && Number.isInteger(c.pos.x) && Number.isInteger(c.pos.y))) return null;
  return d;
}

/**
 * O convidado. `receber(vista)` guarda a completa e devolve-a; `aplicar(delta)` junta a diferença ao que guardou e devolve a
 * vista completa, ou `null` se a diferença não é da vista que ele tem (espera a próxima completa).
 */
export function criarReceptor() {
  let seq = null;
  let textos = new Map();
  return {
    receber(vista) {
      if (Number.isInteger(vista.seq)) {
        seq = vista.seq;
        textos = new Map(vista.combatentes.map((c) => [c.id, JSON.stringify(c)]));
      } else {
        seq = null;      // sem número: um anfitrião antigo; diferenças não vão casar, só as completas servem
        textos = new Map();
      }
      return vista;
    },
    aplicar(delta) {
      if (seq === null || delta.base !== seq) return null;
      const novos = new Map(delta.mudaram.map((c) => [c.id, c]));
      const combatentes = [];
      const proximos = new Map();
      for (const id of delta.ordem) {
        const c = novos.get(id) ?? (textos.has(id) ? JSON.parse(textos.get(id)) : null);
        if (!c) return null;          // um combatente que nunca vimos e não veio: falta fio
        combatentes.push(c);
        proximos.set(id, novos.has(id) ? JSON.stringify(c) : textos.get(id));
      }
      seq = delta.seq;
      textos = proximos;
      return {
        v: delta.v, variante: delta.variante, rodada: delta.rodada, lado: delta.lado, acabou: delta.acabou, seq: delta.seq,
        combatentes, extras: delta.extras ?? null,
      };
    },
  };
}
