export const paineis = [];
export async function narrar(root, opts) {
  paineis.push(opts);
  const esc = opts.escolhas;
  if (!esc?.length) return undefined;
  const pref = globalThis.__preferir;
  const achou = pref && esc.find((e) => e.valor === pref);
  return (achou ?? esc.find((e) => e.primaria) ?? esc[0]).valor;
}
export const narrativaAberta = () => false;
