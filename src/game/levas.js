// LEVAS: inimigos que entram na luta aos poucos, numa rodada marcada — os
// zumbis saindo um a um pela porta da torre, a segunda metade de um bando
// grande chegando pela trilha.
//
// Usa os dois ganchos do motor (`rules/combat.js`): `reinforcements(rodada)`,
// chamado no começo de cada rodada, e `lotePendente()`, que o `checkEnd`
// chama quando o campo esvazia antes da hora — sem ele, quem matasse a
// primeira leva depressa ganhava a luta sem ver a segunda.

/**
 * `levas`: [{ rodada, units, aviso }]. Devolve o controle da fila:
 * `atrasar(n)` empurra as que faltam n rodadas; `limpar()` desliga tudo.
 */
export function prepararLevas(enc, levas) {
  const fila = levas.filter((l) => l.units.length).sort((a, b) => a.rodada - b.rodada);
  enc.reinforcements = (rodada) => {
    const prontas = fila.filter((l) => l.rodada <= rodada);
    if (!prontas.length) return null;
    for (const l of prontas) fila.splice(fila.indexOf(l), 1);
    return { units: prontas.flatMap((l) => l.units), aviso: prontas.map((l) => l.aviso).filter(Boolean).join(' ') || null };
  };
  // Campo vazio antes da hora: o motor puxa a próxima leva para a luta não
  // acabar sem ela. Uma leva marcada `fixa` NÃO se antecipa — é a que tem hora
  // combinada na narrativa, como o mensageiro do castelo, que a cena promete
  // de volta "duas rodadas depois" e que chegava na mesma rodada em até 57%
  // das lutas. Se só sobrarem levas fixas, a luta acaba: quem venceu antes de
  // o mensageiro voltar venceu mesmo.
  enc.lotePendente = () => {
    const i = fila.findIndex((l) => !l.fixa);
    return i < 0 ? null : fila.splice(i, 1)[0];
  };
  return {
    atrasar(n) { for (const l of fila) l.rodada += n; },
    get restantes() { return fila.reduce((s, l) => s + l.units.length, 0); },
    /** Põe mais uma leva na fila, no meio da luta (o mensageiro que volta). */
    adicionar(l) {
      if (!l?.units?.length) return;
      fila.push(l);
      fila.sort((a, b) => a.rodada - b.rodada);
    },
    /** Tira da fila quem não vem mais (o bando que fugiu antes de sair). */
    remover(pred) {
      for (const l of fila) l.units = l.units.filter((u) => !pred(u));
      for (let i = fila.length - 1; i >= 0; i--) if (!fila[i].units.length) fila.splice(i, 1);
    },
    limpar() {
      fila.length = 0;
      enc.reinforcements = () => null;
      enc.lotePendente = null;
    },
  };
}
