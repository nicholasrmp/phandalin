// AS FICHAS DE CRIATURA: o retrato redondo, com anel, que o tabuleiro de cima desenha no lugar do retrato em pixel.
//
// Vêm da galeria "D&D Monster Tokens" do imgur (ver `src/dev/fichas-imgur.json`, que diz qual imagem é de qual
// criatura, e `src/dev/baixar-fichas.py`, que baixa e reduz a 160 px em `public/fichas/<id>.webp`).
//
// QUEM GANHA FICHA: a criatura pelo bloco (`defId`), e a pessoa com nome (`npcId`) só se estiver na lista — Klarg,
// Yeemik, Nezznar, Agatha. O morador com retrato próprio (Sildar, Toblen, Linene) continua com o retrato dele, mesmo
// usando um bloco que tem ficha (o do Sildar é o de cavaleiro). O herói, sempre o retrato.

const COM_FICHA = new Set([
  'acolito', 'agatha', 'aranhaGigante', 'aranhaLoboGigante', 'arbustoErrante', 'armaduraAnimada', 'bandido',
  'bandidoBesteiro', 'bandidoMachadeiro', 'batedor', 'brughor', 'bugbear', 'cabraGigante', 'cajavidro',
  'capitaoBandido', 'cavaleiro', 'caveiraCandente', 'corujaUrso', 'cultista', 'doppelganger', 'dragaoVerdeJovem',
  'droop', 'drow', 'enxameDeCentopeias', 'enxameDeRatos', 'espectro', 'espetoInfectado', 'espiao', 'esqueleto',
  'fantasmaDeCrianca', 'galhoInfectado', 'gelatinaOcre', 'ghoul', 'goblin', 'goblinChefe', 'grick', 'guarda',
  'hamunKost', 'hobgoblin', 'iarno', 'javali', 'javaliGigante', 'klarg', 'livido', 'lobo', 'loboAtroz', 'mago',
  'marcarrubra', 'mimico', 'morcegoFamiliar', 'morcegoGigante', 'mormesk', 'nezznar', 'nobre', 'ogro', 'orc',
  'plebeu', 'ratoFamiliar', 'ratoGigante', 'reiGrol', 'rufiao', 'sacerdote', 'sombra', 'spectator', 'stirge',
  'tigreDenteDeSabre', 'ursoNegro', 'ursoPardo', 'veterano', 'vigiaCiclopico', 'vinhaInfectada', 'wraith', 'yeemik',
  'zumbi', 'zumbiDasCinzas',
]);

/** O endereço da ficha do combatente, ou `null` se ele fica com o retrato em pixel. */
export function fichaDe(c) {
  if (!c || c.side === 'party') return null;
  const id = c.npcId ? (COM_FICHA.has(c.npcId) ? c.npcId : null) : (COM_FICHA.has(c.defId) ? c.defId : null);
  return id ? `/fichas/${id}.webp` : null;
}

export const CRIATURAS_COM_FICHA = [...COM_FICHA];
