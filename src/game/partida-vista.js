// A VISTA DA PARTIDA (F4, A-03): o que o navegador do anfitrião publica e os outros desenham.
//
// O anfitrião roda o jogo inteiro (A-01). O `Encounter` não serializa (S-04), então o cliente NÃO
// replica o motor: recebe uma fotografia dos combatentes (cada um é um objeto simples, uns 2 KB) mais
// o mapa por nome, e desenha com o mesmo `Board`. Não há regra aqui: só empacotar e desempacotar.
//
// Puro (sem janela nem rede): os testes rodam em Node. A rede é de `worker/sala-servidor.js`
// (`tratarVista`) e a tela de `view/partida-tela.js`.

export const VERSAO_DA_VISTA = 1;

/** O teto de uma vista, em caracteres. O servidor recusa mais que isto; o anfitrião não publica mais que isto. */
export const MAX_VISTA = 120_000;

/** Quantas vistas por segundo o anfitrião pode publicar (o servidor segura o resto). */
export const MS_ENTRE_VISTAS = 200;

/** Mesmo sem mudança, o anfitrião repete a vista a cada tanto: o servidor não a guarda, e quem entra precisa de uma. */
export const BATIMENTO_DA_VISTA_MS = 3000;

/** JSON que não quebra com referência circular (um invocado aponta para o dono): o ciclo vira `null`. */
function seguro(valor) {
  const caminho = [];
  return JSON.stringify(valor, function trocar(chave, v) {
    if (typeof v === 'function' || typeof v === 'symbol') return undefined;
    if (v instanceof Map) return Object.fromEntries(v);
    if (v instanceof Set) return [...v];
    if (v && typeof v === 'object') {
      // `this` é o objeto que contém `chave`: tira da lista de ancestrais quem já ficou para trás.
      while (caminho.length && caminho[caminho.length - 1] !== this) caminho.pop();
      if (caminho.includes(v)) return null;
      caminho.push(v);
    }
    return v;
  });
}

/**
 * A fotografia da partida: o mapa (por nome), a rodada e todos os combatentes. `extras` é livre
 * (o capítulo, quem está explorando…) e vai junto sem interpretação.
 */
export function fotografar({ enc, variante, extras = null }) {
  return {
    v: VERSAO_DA_VISTA,
    variante,
    rodada: enc.round ?? 1,
    lado: enc.side ?? 'party',
    acabou: Boolean(enc.over),
    combatentes: JSON.parse(seguro(enc.combatants)),
    extras,
  };
}

/** A vista como texto, para comparar com a anterior (só publica o que mudou) e medir. */
export const emTexto = (vista) => seguro(vista);

/** Aceita só o que tem a cara de uma vista; `null` se não tem. */
export function lerVista(bruto) {
  let v;
  try { v = typeof bruto === 'string' ? JSON.parse(bruto) : bruto; } catch { return null; }
  if (!v || typeof v !== 'object' || v.v !== VERSAO_DA_VISTA) return null;
  if (typeof v.variante !== 'string' || !Array.isArray(v.combatentes)) return null;
  if (!v.combatentes.every((c) => c && typeof c.id === 'string' && c.pos && Number.isInteger(c.pos.x) && Number.isInteger(c.pos.y))) return null;
  return v;
}

/**
 * Põe a vista no encontro do espelho (o `Encounter` do cliente): mesmos objetos de sempre (o desenho guarda o
 * estado de animação de cada um), campos copiados por cima; quem sumiu sai, quem chegou entra.
 * Devolve o que mudou, para a tela animar: `{ moveram: [{ c, de, para }], entraram, sairam }`.
 */
export function aplicarVista(enc, vista) {
  const antes = new Map(enc.combatants.map((c) => [c.id, c]));
  const vistos = new Set();
  const moveram = []; const entraram = []; const sairam = [];
  for (const nova of vista.combatentes) {
    vistos.add(nova.id);
    const c = antes.get(nova.id);
    if (!c) { enc.combatants.push(nova); entraram.push(nova); continue; }
    const de = { ...c.pos };
    for (const k of Object.keys(c)) if (!(k in nova)) delete c[k];
    Object.assign(c, nova);
    if (de.x !== nova.pos.x || de.y !== nova.pos.y) moveram.push({ c, de, para: { ...nova.pos } });
  }
  for (const c of [...enc.combatants]) {
    if (vistos.has(c.id)) continue;
    enc.combatants.splice(enc.combatants.indexOf(c), 1);
    sairam.push(c);
  }
  enc.round = vista.rodada;
  enc.side = vista.lado;
  enc.over = vista.acabou;
  return { moveram, entraram, sairam };
}
