// O ROL DOS HERÓIS CRIADOS: as definições que o jogador fez no criador (`game/criador.js`), guardadas no navegador.
// Ficam fora dos saves de propósito — o herói é do jogador, não da campanha: dá para levá-lo a outra partida. A
// partida que o leva guarda uma cópia da definição na própria config (`menu-herois.js configDaCampanha`), e é por
// ela que um save abre mesmo noutro navegador.
//
// O que vem do armazenamento é conferido peça a peça (`definicaoValida`): alguém pode ter mexido nele.

import { definicaoValida, arteValida } from './criador.js';
import { registrarHeroi, esquecerHeroi } from './herois.js';
import { registrarArte } from '../art/arte-propria.js';

export const CHAVE_DOS_CRIADOS = 'phandalin.herois.criados';
export const MAX_CRIADOS = 24;

/** Põe a definição no jogo: o registro dos heróis e o da arte do retrato. */
export function apresentarHeroi(def) {
  registrarHeroi(def);
  registrarArte(def.look, def.arte ?? null, def.name);
}

/** Os heróis criados guardados, já registrados. Os que não passam na conferência ficam de fora. */
export function lerCriados(storage = globalThis.localStorage) {
  let lista = [];
  try { lista = JSON.parse(storage?.getItem(CHAVE_DOS_CRIADOS) ?? '[]'); } catch { lista = []; }
  if (!Array.isArray(lista)) return [];
  const ok = lista.filter(definicaoValida).slice(0, MAX_CRIADOS);
  for (const d of ok) apresentarHeroi(d);
  return ok;
}

/** Guarda (ou troca, pelo id) uma definição. Devolve `{ ok, erro? }`. */
export function guardarCriado(def, storage = globalThis.localStorage) {
  if (!definicaoValida(def)) return { ok: false, erro: 'O herói não passou na conferência.' };
  const lista = lerCriados(storage).filter((d) => d.id !== def.id);
  if (lista.length >= MAX_CRIADOS) return { ok: false, erro: `Já há ${MAX_CRIADOS} heróis criados: apague um para fazer outro.` };
  lista.push(def);
  try {
    storage.setItem(CHAVE_DOS_CRIADOS, JSON.stringify(lista));
  } catch {
    return { ok: false, erro: 'O navegador não deixou guardar (o espaço acabou?). Tente uma imagem menor.' };
  }
  apresentarHeroi(def);
  return { ok: true };
}

// ---- os heróis criados da SALA do multijogador ----
//
// A visão da sala leva a definição de cada herói criado SEM a imagem (ela vai a todos a cada passo na taverna); a
// imagem chega à parte, na mensagem `artes` (`worker/sala-servidor.js`). Aqui as duas se juntam e o herói entra no
// jogo deste navegador — o anfitrião o monta, o convidado desenha o retrato dele.
const ARTES_DA_SALA = new Map();

/** Guarda as imagens que chegaram (só data URL de imagem: vêm da rede). */
export function guardarArtesDaSala(artes) {
  for (const [id, url] of Object.entries(artes ?? {})) if (arteValida(url)) ARTES_DA_SALA.set(id, url);
}

/** Registra os heróis criados da visão da sala, com a imagem se ela já chegou. */
export function apresentarCriadosDaSala(criados) {
  for (const c of Object.values(criados ?? {})) {
    const { temArte: _t, dono: _d, ...def } = c;
    def.arte = ARTES_DA_SALA.get(def.id) ?? null;
    if (definicaoValida(def)) apresentarHeroi(def);
  }
}

/** Apaga o herói de `id` do rol. Partidas que já o levam continuam com a cópia delas. */
export function apagarCriado(id, storage = globalThis.localStorage) {
  const lista = lerCriados(storage);
  const resto = lista.filter((d) => d.id !== id);
  if (resto.length === lista.length) return false;
  storage.setItem(CHAVE_DOS_CRIADOS, JSON.stringify(resto));
  esquecerHeroi(id);
  return true;
}
