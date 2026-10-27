// O DIRETÓRIO das tavernas públicas (MULTIJOGADOR.md, B1): quais instâncias existem e quantos jogadores há em cada uma. Quem
// aperta "Taverna pública" é mandado para a instância mais cheia que ainda tem vaga (assim os jogadores se encontram); se não há,
// abre-se uma nova com um código sorteado aqui. Puro: `diretorio-do.js` guarda o estado e este arquivo só decide.

import { gerarCodigo, MAX_PUBLICA } from '../game/sala.js';

/** Para ESCOLHER uma instância o limite é um pouco menor que a lotação: sobra lugar para quem chega junto de um amigo. */
export const LOTACAO_PARA_NOVOS = MAX_PUBLICA - 2;
const DEZ_MINUTOS = 600_000;
const DOIS_MINUTOS = 120_000;

export const novoDiretorio = () => ({ instancias: {} });

function limpar(est, agora) {
  for (const [codigo, i] of Object.entries(est.instancias)) if (i.n === 0 && agora - i.em > DEZ_MINUTOS) delete est.instancias[codigo];
}

/** A instância para quem chega: a mais cheia com vaga, ou uma nova. `{ codigo, nova }`. */
export function escolher(est, agora, aleatorio) {
  limpar(est, agora);
  // Uma instância recém-aberta ainda sem ninguém registrado (n = 0) vale por dois minutos: quem a abriu está entrando.
  const candidatas = Object.entries(est.instancias)
    .filter(([, i]) => i.n < LOTACAO_PARA_NOVOS && (i.n > 0 || agora - i.em < DOIS_MINUTOS))
    .sort((a, b) => b[1].n - a[1].n || b[1].em - a[1].em);
  if (candidatas.length) return { codigo: candidatas[0][0], nova: false };
  let codigo;
  do { codigo = gerarCodigo(aleatorio); } while (est.instancias[codigo]);
  est.instancias[codigo] = { n: 0, em: agora };
  return { codigo, nova: true };
}

/** A instância avisa quantos jogadores tem agora. */
export function registrar(est, agora, codigo, n) {
  if (!est.instancias[codigo]) return false;
  est.instancias[codigo] = { n: Math.max(0, Math.min(MAX_PUBLICA, n | 0)), em: agora };
  return true;
}

/** Este código é de uma taverna pública que o servidor abriu? */
export const ehPublica = (est, codigo) => Object.hasOwn(est.instancias, codigo);
