// O DIRETOR DE MÚSICA: qual faixa toca em cada cena e na luta, e os toques de vitória e derrota. As faixas moram em `public/musica/`
// (preparadas por `src/dev/preparar-trilha.py`: volume nivelado, laço sem emenda). Falta de arquivo nunca derruba nada: o jogo toca calado.
//
// Puro (sem navegador): roda em Node. Quem toca é `audio.tocarMusica` (laço, com fade) e `audio.toque` (uma vez, abaixando a música).

const BASE = () => import.meta.env?.BASE_URL ?? '/';
export const urlDaFaixa = (nome) => `${BASE()}musica/${nome}.mp3`;

/** Cada faixa de laço, com o volume dela (a trilha do título é mais alta de fábrica, então fica de fora). */
export const FAIXAS = {
  'exploracao-estrada': { ganho: 0.85 },
  'vila-phandalin': { ganho: 0.85 },
  taverna: { ganho: 0.8 },
  'caverna-onda-eco': { ganho: 0.85 },
  'masmorra-mansao': { ganho: 0.85 },
  luta: { ganho: 0.9 },
  'luta-chefe': { ganho: 0.95 },
  acampamento: { ganho: 0.8 },
};

/**
 * Toca a fogueira durante `fazer()` (o descanso) e devolve a música que estava tocando, com fade nos dois sentidos.
 * Se `fazer` falhar, a música anterior volta do mesmo jeito.
 */
export async function comAcampamento(audio, fazer) {
  const antes = audio.musicaUrl ? { url: audio.musicaUrl, opcoes: audio.musicaOpcoes } : null;
  tocarFaixa(audio, 'acampamento', { fade: 1.5 });
  try {
    return await fazer();
  } finally {
    if (antes) audio.tocarMusica(antes.url, { ...antes.opcoes, fade: 2.5 });
    else audio.pararMusica(1.5);
  }
}

/** Um toque curto (vitória, derrota) por cima da música, que abaixa enquanto ele soa. */
export function tocarToque(audio, nome) {
  const t = TOQUES[nome];
  if (t) audio.toque(urlDaFaixa(nome), { ganho: t.ganho });
}

export const TOQUES = { vitoria: { ganho: 0.9 }, derrota: { ganho: 0.9 } };

/** A faixa de EXPLORAÇÃO de cada mapa (a `variante` do encontro). */
export function faixaDaVariante(variante) {
  switch (variante) {
    case 'ondaEco': case 'caverna': case 'esconderijo': return 'caverna-onda-eco';
    case 'mansao': case 'mansaoTunel': case 'castelo': return 'masmorra-mansao';
    case 'rua': return 'vila-phandalin';
    default: return 'exploracao-estrada';
  }
}

/** Há um chefe entre os inimigos vivos? (O XP é o do bloco de monstro: 450 ou mais é um inimigo de peso, como o Nezznar ou o dragão.) */
export const temChefe = (combatentes) => (combatentes ?? []).some((c) => c.side !== 'party' && c.side !== 'neutro' && !c.dead && (c.hp ?? 1) > 0 && (c.xp ?? 0) >= 450);

/** Toca a faixa `nome` em laço, com fade (a mesma faixa de novo não recomeça). */
export function tocarFaixa(audio, nome, { fade = 2.5 } = {}) {
  const f = FAIXAS[nome];
  if (!f) return;
  audio.tocarMusica(urlDaFaixa(nome), { ganho: f.ganho, fade });
}

/**
 * A faixa que deve tocar agora. `{ variante, emLuta, combatentes }`. Fora do combate vale a do mapa; em luta, a de luta (a do chefe, se
 * há um chefe vivo).
 */
export function faixaAgora({ variante, emLuta = false, combatentes = [] }) {
  if (emLuta) return temChefe(combatentes) ? 'luta-chefe' : 'luta';
  return faixaDaVariante(variante);
}
