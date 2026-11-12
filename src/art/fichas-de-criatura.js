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

import { FICHAS_DOS_LIVROS } from './fichas-dos-livros.js';

const COM_FICHA = new Set([...FICHAS_DOS_LIVROS,
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
  // O que o Obelisco pôs na Mina Perdida (revisoes/obelisco-de-para-2026-11-08.md).
  'banshee', 'chefeGoblinArqueiro', 'goblinPsiLutador', 'goblinPsiComandante', 'ashenwightFeral', 'ashenwightPsionico', 'otyughMutante', 'brocaInfernal', 'ruxithid', 'otyugh', 'guardiaoEscudo', 'texugoGigante', 'gemulaEncefalica', 'gosmaCinzentaPsiquica', 'monteErrantePsionico', 'vaca', 'cobraVenenosaGigante', 'fungoVioleta', 'grell', 'polvoGigante', 'quasit',
  'serpenteConstritoraGigante', 'zumbiOgro',
  // Talhundereth (o Obelisco, capítulo 6).
  'galebDuhr', 'pedregulhoAnimado', 'medusa', 'horrorDeElmo', 'mefitDePoeira', 'wight', 'mutanteHumanoide', 'armadilhaDeIntelecto', 'drowGuerreiroDeElite', 'elementalDaTerra', 'aglomeradoEncefalico', 'revenant', 'hidra', 'aguaViva', 'golemDeArgila', 'fantasma', 'mumia', 'esqueletoAnao', 'gnomoDasProfundezas',
  // a Encruzilhada da Forca (o Obelisco, capítulo 6)
  'qunbraxel',
  // o capítulo 7 do Obelisco
  'moradorInfectado', 'grellPsiquico', 'fusaoDeCarne', 'capaNegraMutante', 'oshundo', 'nothicDevoradorDeMentes', 'zeloteAberrante',
  'profetaDevoradorDeMentes', 'cerebroAnciaoInfectado', 'ocular',
  // o capítulo 8 do Obelisco (as variantes, a cabeça da Chishinix, o zelote tentaculado, a Nellik e a Varakkta, usam a
  // ficha do bloco de onde saíram, pelo `look`)
  'devoradorClarividente', 'lowarnizel', 'refracaoDeIlvaash', 'cranioFlamejante',
]);

// O MESMO BLOCO, PESSOAS DIFERENTES: a Casa da Morte faz Rose e Thorn do bloco de fantasma de criança e dá o nome
// depois (`casadamorte-alto-cena.js`). O nome decide a ficha.
const POR_NOME = {
  fantasmaDeCrianca: { Rose: 'rose', Thorn: 'thorn' },
  // Zeond, o quasit do Glasstaff, tem retrato próprio no Obelisco.
  quasit: { Zeond: 'zeond' },
};

/** O endereço da ficha do combatente, ou `null` se ele fica com o retrato em pixel. */
export function fichaDe(c) {
  // a criatura de MAGIA (`monsters/magias.js`) não tem folha em pixel: usa a ficha do look dela de qualquer lado, também
  // quando é um herói que a conjura
  const deMagia = /^objetoAnimado|^maoDeBigby$|^espadaDeMordenkainen$|^espirito[A-Z]|^dracoCompanheiro$/.test(c?.defId ?? '');
  if (!c || (c.side === 'party' && !deMagia)) return null;
  const pessoa = POR_NOME[c.defId]?.[c.name];
  // a criatura de magia (`monsters/magias.js`) não tem ficha própria e usa a do `look` (a Espada de Mordenkainen, a da espada voadora)
  const id = pessoa ?? (c.npcId ? (COM_FICHA.has(c.npcId) ? c.npcId : null) : (COM_FICHA.has(c.defId) ? c.defId : COM_FICHA.has(c.look) ? c.look : null));
  return id ? `/fichas/${id}.webp` : null;
}

/**
 * A ILUSTRAÇÃO INTEIRA da criatura, para a ficha dela: o mesmo id do token, em `public/criaturas/`
 * (`src/dev/baixar-arte-criaturas.py`). É arte do livro e fica só no disco, como os mapas oficiais — então o endereço
 * pode não existir, e quem desenha tenta carregar e cai no token se falhar.
 */
export function arteInteiraDe(c) {
  const ficha = fichaDe(c);
  return ficha ? ficha.replace('/fichas/', '/criaturas/') : null;
}

export const CRIATURAS_COM_FICHA = [...COM_FICHA];
