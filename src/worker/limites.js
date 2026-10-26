// Os limites por IP da sala (taverna pública, MULTIJOGADOR.md): quantas salas novas um IP pede por hora e quantas conexões tenta
// por minuto. Puro: `limitador-do.js` guarda o estado de cada IP e este arquivo só decide.
//
// O código da sala é sorteado AQUI (no servidor), não no navegador: quem não pediu um código não abre sala com ele (quando o
// servidor exige, `CODIGO_DO_SERVIDOR = "1"`). Isso impede escolher o código a dedo e esconde a conta de quantas salas existem.

import { gerarCodigo } from '../game/sala.js';

export const EMITIR_POR_HORA = 6;
export const TENTATIVAS_POR_MINUTO = 40;
export const VALIDADE_DO_CODIGO_MS = 3_600_000;
const UM_MINUTO = 60_000;

export const novoEstado = () => ({ emitidos: [], tentativas: [] });

function limpar(est, agora) {
  est.emitidos = est.emitidos.filter((e) => agora - e.em < VALIDADE_DO_CODIGO_MS);
  est.tentativas = est.tentativas.filter((t) => agora - t < UM_MINUTO);
}

/** Pede um código novo. `aleatorio(n)` sorteia de 0 a n-1. Devolve `{ ok, codigo }` ou `{ ok: false, espera }` (ms até poder de novo). */
export function emitir(est, agora, aleatorio, { limitar = true } = {}) {
  limpar(est, agora);
  if (limitar && est.emitidos.length >= EMITIR_POR_HORA) return { ok: false, espera: est.emitidos[0].em + VALIDADE_DO_CODIGO_MS - agora };
  let codigo;
  do { codigo = gerarCodigo(aleatorio); } while (est.emitidos.some((e) => e.codigo === codigo));
  est.emitidos.push({ codigo, em: agora });
  if (est.emitidos.length > 50) est.emitidos.shift();      // quem não é limitado (desenvolvimento) não faz a lista crescer sem fim
  return { ok: true, codigo };
}

/** Uma conexão para `codigo`: conta como tentativa; diz se o código foi emitido a este IP há menos de uma hora. */
export function entrar(est, agora, codigo, { contar = true } = {}) {
  limpar(est, agora);
  if (contar) {
    if (est.tentativas.length >= TENTATIVAS_POR_MINUTO) return { ok: false, espera: est.tentativas[0] + UM_MINUTO - agora };
    est.tentativas.push(agora);
  }
  return { ok: true, emitido: est.emitidos.some((e) => e.codigo === codigo) };
}
