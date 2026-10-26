// Os cenários de medição: como o grupo chega a cada perigo e o dispara.
import { colocar, entrar, A, B } from './lib.mjs';

const c = (p) => ({ x: p.x, y: p.y });

/** Entra num prédio pelo caminho de menor custo e dispara o gatilho da cena. */
const entrarEm = (ids, ninho) => async (S, o) => {
  const lista = [].concat(ids);
  const cels = new Set(lista.flatMap((id) => A.celulas[id].map((p) => `${p.x},${p.y}`)));
  const caixa = lista.map((id) => A.predios[id]).reduce((a, b) => ({
    x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1),
  }));
  const meta = c(A.ninhos[ninho][0]);
  colocar(S, { goal: meta, rect: caixa, margem: o.margem ?? 4 });
  return entrar(S, { goal: meta, rect: caixa, modo: 'borda', valido: (n) => cels.has(`${n.x},${n.y}`) });
};

export const CEN = {
  zumbis: entrarEm('guarda', 'zumbis'),
  zumbisCavalo: entrarEm('estalagem', 'zumbisCavalo'),
  zumbisFerraria: entrarEm('ferraria', 'zumbisFerraria'),
  ramos2: entrarEm(['fazenda', 'celeiro'], 'ramos2'),
  ramos5: entrarEm('casa20', 'ramos5'),
  ramos12: entrarEm('tecelagem', 'ramos12'),
  dragao: async (S, o) => {
    const sala = new Set(A.celulas.torre.map((p) => `${p.x},${p.y}`));
    colocar(S, { goal: c(A.ninhos.dragao[0]), rect: A.torre, margem: o.margem ?? 4 });
    return entrar(S, { goal: c(A.ninhos.dragao[0]), rect: A.torre, modo: 'borda', valido: (n) => sala.has(`${n.x},${n.y}`) });
  },
};
void B;
