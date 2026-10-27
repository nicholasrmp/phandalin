export const paineis = [];
export async function narrar(root, opts) {
  paineis.push(opts);
  const esc = opts.escolhas;
  if (!esc?.length) return undefined;
  // Um teste pode escolher a opção de verdade (as conversas por perfil): `__escolher(escolhas)` devolve o valor.
  if (globalThis.__escolher) return globalThis.__escolher(esc);
  const pref = globalThis.__preferir;
  const achou = pref && esc.find((e) => e.valor === pref);
  return (achou ?? esc.find((e) => e.primaria) ?? esc[0]).valor;
}
export const narrativaAberta = () => false;
