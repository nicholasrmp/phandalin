// O DIÁRIO como dado: as missões da campanha (com o texto delas) e as pistas. É o que a tela da vila mostra no botão "Diário";
// numa sala, o anfitrião o manda na vista e o convidado o lê igual (MULTIJOGADOR.md, J-09: nada do que o anfitrião vê é só dele).

/**
 * `estado` é o `camp.vila` (`{ missoes: { id: 'ativa'|'feita' }, pistas: [] }`) e `defs` o catálogo (`MISSOES`).
 * Devolve JSON puro e curto: `{ missoes: [{ id, estado, titulo, de, recompensa, texto }], pistas: [texto] }`.
 */
export function diarioDe(estado, defs) {
  const missoes = Object.entries(estado?.missoes ?? {})
    .filter(([id]) => defs?.[id])
    .map(([id, est]) => ({ id, estado: est === 'feita' ? 'feita' : 'ativa', titulo: defs[id].titulo, de: defs[id].de ?? '', recompensa: defs[id].recompensa ?? null, texto: defs[id].texto ?? '' }));
  const pistas = (estado?.pistas ?? []).filter((p) => typeof p === 'string').slice(-60);
  return { missoes, pistas };
}

/** O contrário, para a tela da vila: `{ estado: { missoes, pistas }, defs }` a partir do que veio na vista. */
export function diarioParaTela(d) {
  const estado = { missoes: {}, pistas: [...(d?.pistas ?? [])], registro: [] };
  const defs = {};
  for (const m of d?.missoes ?? []) {
    estado.missoes[m.id] = m.estado;
    defs[m.id] = { titulo: m.titulo, de: m.de, recompensa: m.recompensa ?? undefined, texto: m.texto };
  }
  return { estado, defs };
}
