const D = new URL('.', import.meta.url).href;
export async function resolve(specifier, context, next) {
  if (/view\/narrativa\.js$/.test(specifier)) return { url: D + 'stub-narrativa.mjs', shortCircuit: true };
  if (/view\/nivel-tela\.js$/.test(specifier)) return { url: D + 'stub-niveltela.mjs', shortCircuit: true };
  return next(specifier, context);
}
