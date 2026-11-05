// AS FICHAS DE CRIATURA: o retrato redondo, com anel, que o tabuleiro de cima desenha no lugar do retrato em pixel.
//
// Vêm da galeria "D&D Monster Tokens" do imgur (`src/dev/fichas-imgur.json`), do espelho do 5etools para as criaturas
// da aventura que a galeria não tem (`src/dev/fichas-5etools.json`) e da arte do próprio personagem montada no mesmo
// anel (`src/dev/fichas-proprias.json`). `src/dev/baixar-fichas.py` e `fichas-proprias.py` as põem em
// `public/fichas/<id>.webp`.
//
// QUEM GANHA FICHA: a criatura pelo bloco (`defId`), e a pessoa com nome (`npcId`) só se estiver na lista — Klarg,
// Yeemik, Nezznar, Agatha. O morador com retrato próprio (Sildar, Toblen, Linene) continua com o retrato dele, mesmo
// usando um bloco que tem ficha (o do Sildar é o de cavaleiro). O herói, sempre o retrato.

const COM_FICHA = new Set([
  'vassouraAnimada', 'rose', 'thorn',
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

// O MESMO BLOCO, PESSOAS DIFERENTES: a Casa da Morte faz Rose e Thorn do bloco de fantasma de criança e dá o nome
// depois (`casadamorte-alto-cena.js`). O nome decide a ficha.
const POR_NOME = { fantasmaDeCrianca: { Rose: 'rose', Thorn: 'thorn' } };

/** O endereço da ficha do combatente, ou `null` se ele fica com o retrato em pixel. */
export function fichaDe(c) {
  if (!c || c.side === 'party') return null;
  const pessoa = POR_NOME[c.defId]?.[c.name];
  const id = pessoa ?? (c.npcId ? (COM_FICHA.has(c.npcId) ? c.npcId : null) : (COM_FICHA.has(c.defId) ? c.defId : null));
  return id ? `/fichas/${id}.webp` : null;
}

export const CRIATURAS_COM_FICHA = [...COM_FICHA];
