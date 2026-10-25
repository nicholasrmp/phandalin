// Ícones da interface, em pixel art, desenhados por código.
//
// POR QUE NÃO EMOJI
// A barra de ações usava emoji. Emoji é desenho do sistema operacional: no
// Windows sai colorido e arredondado, no Mac sai outro, e nenhum dos dois
// combina com um tabuleiro de pixel art em paleta escura. Era metade da cara
// de amador — ícone de interface precisa ser DO JOGO.
//
// FORMATO
// Cada ícone é uma grade de 16x16 em texto. '.' é transparente e cada outro
// caractere é uma entrada da paleta. Escrever assim, e não com chamadas de
// fillRect, é o que torna possível corrigir um ícone olhando para ele.
//
// A paleta é compartilhada de propósito: é ela que faz vinte desenhos
// diferentes lerem como um conjunto só.

import { ICONES_ITENS, PALETA_ITENS } from './icones-itens.js';
import { ICONES_CONDICOES } from './icones-condicoes.js';
import { ICONES_MAGIAS } from './icones-magias.js';
import { ICONES_ACOES } from './icones-acoes.js';
import { ICONES_RACAS } from './icones-racas.js';
import { ICONES_CLASSES } from './icones-classes.js';
import { ICONES_OBJETOS } from './icones-objetos.js';

const P = {
  1: '#e8eef5', // metal claro — fio, brilho
  2: '#aab6c6', // metal
  3: '#6b7686', // metal escuro — sombra, contorno interno
  4: '#b0875a', // madeira clara
  5: '#8a6236', // madeira, couro
  6: '#e8c35a', // ouro, luz, energia
  7: '#a6822c', // ouro escuro
  8: '#e0553c', // acento quente — fogo, sangue, perigo
  9: '#6ea8e8', // acento frio — gelo, arcano, água
  a: '#e2b183', // pele
  b: '#f4f0e4', // osso, papel, branco
  c: '#6fc07a', // vida, veneno, natureza
  d: '#a579d8', // encantamento, necrótico
  e: '#2a2430', // vazio, buraco, sombra dura
};

/** A paleta, para quem desenha grade na mesma linguagem (efeitos de magia). */
export const PALETA = P;

const ICONES = {
  // ---- armas --------------------------------------------------------------
  espada: [
    '.......11.......',
    '.......11.......',
    '.......11.......',
    '.......11.......',
    '......1221......',
    '......1221......',
    '......1221......',
    '......1221......',
    '.....6666666....',
    '....677777766...',
    '.......55.......',
    '.......55.......',
    '.......55.......',
    '......6776......',
    '................',
    '................',
  ],
  adaga: [
    '................',
    '................',
    '.......11.......',
    '.......11.......',
    '......1221......',
    '......1221......',
    '......1221......',
    '.....66666......',
    '....6777766.....',
    '.......55.......',
    '.......55.......',
    '......677 6.....',
    '................',
    '................',
    '................',
    '................',
  ],
  maca: [
    '......3223......',
    '.....321123.....',
    '....32111123....',
    '...3211111123...',
    '....32111123....',
    '.....321123.....',
    '......3223......',
    '.......55.......',
    '.......55.......',
    '.......55.......',
    '.......55.......',
    '.......55.......',
    '......6776......',
    '................',
    '................',
    '................',
  ],
  machado: [
    '....1111........',
    '...122211.......',
    '..12222211......',
    '..12222221......',
    '..12222221.5....',
    '...1222221.5....',
    '....122221.5....',
    '.....12221.5....',
    '.......5555.....',
    '.......55.......',
    '.......55.......',
    '.......55.......',
    '......6776......',
    '................',
    '................',
    '................',
  ],
  arco: [
    '.....55.........',
    '....5..5........',
    '...5....5.......',
    '...5.....5......',
    '..5......b5.....',
    '..5.......b.....',
    '..5.......b.....',
    '..5.......b.....',
    '..5.......b.....',
    '..5.......b.....',
    '...5......b.....',
    '...5.....5......',
    '....5...5.......',
    '.....5.5........',
    '......5.........',
    '................',
  ],
  cajado: [
    '.......9........',
    '......999.......',
    '.....96b69......',
    '......999.......',
    '.......9........',
    '.......55.......',
    '.......55.......',
    '.......55.......',
    '.......55.......',
    '.......55.......',
    '.......55.......',
    '.......55.......',
    '.......55.......',
    '.......55.......',
    '......555.......',
    '................',
  ],

  // ---- ações comuns -------------------------------------------------------
  // Bota em movimento: a linha de velocidade atrás é o que diz "correr" e não
  // "calçado".
  correr: [
    '................',
    '..........666...',
    '.........66666..',
    '........6666666.',
    '..3.....666a666.',
    '.33.....6666666.',
    '3.......6666666.',
    '........66666...',
    '..33...666666...',
    '......6666666...',
    '.....66666666...',
    '3...666666666...',
    '..3.777777777...',
    '....777777777...',
    '................',
    '................',
  ],
  esquivar: [
    '....22222222....',
    '...2111111112...',
    '...2116666112...',
    '...2116666112...',
    '...2111111112...',
    '...2111111112...',
    '....21111112....',
    '....21111112....',
    '.....211112.....',
    '.....211112.....',
    '......2112......',
    '......2112......',
    '.......22.......',
    '................',
    '................',
    '................',
  ],
  desengajar: [
    '................',
    '.......666......',
    '......66.66.....',
    '.....66...66....',
    '....66.....6....',
    '....6...........',
    '...66...........',
    '..666...........',
    '.66666..........',
    '..666...........',
    '...6............',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  estabilizar: [
    '................',
    '......cccc......',
    '......cccc......',
    '......cccc......',
    '..cccccccccc....',
    '..cccccccccc....',
    '..cccccccccc....',
    '..cccccccccc....',
    '......cccc......',
    '......cccc......',
    '......cccc......',
    '......cccc......',
    '................',
    '................',
    '................',
    '................',
  ],
  folego: [
    '................',
    '.....88888......',
    '...888888888....',
    '..88888888888...',
    '..888866668888..',
    '..888666666888..',
    '..888666666888..',
    '..8888666688 8..',
    '...888888888....',
    '....8888888.....',
    '.....88888......',
    '......888.......',
    '.......8........',
    '................',
    '................',
    '................',
  ],
  surto: [
    '.........666....',
    '........666.....',
    '.......666......',
    '......666.......',
    '.....6666666....',
    '....666666......',
    '.......666......',
    '......666.......',
    '.....666........',
    '....666.........',
    '...666..........',
    '..666...........',
    '................',
    '................',
    '................',
    '................',
  ],
  ardilosa: [
    '......dddd......',
    '....dd....dd....',
    '...d........d...',
    '..d...dddd...d..',
    '..d..d....d..d..',
    '.d..d..dd..d..d.',
    '.d..d.d..d.d..d.',
    '.d..d.d..d.d..d.',
    '.d..d..dd..d..d.',
    '..d..d....d..d..',
    '..d...dddd...d..',
    '...d........d...',
    '....dd....dd....',
    '......dddd......',
    '................',
    '................',
  ],
  preservar: [
    '................',
    '.......66.......',
    '......6776......',
    '.....677776.....',
    '...66677777666..',
    '...66777777766..',
    '.....677776.....',
    '.....677776.....',
    '......6776......',
    '......6776......',
    '.......66.......',
    '.......66.......',
    '................',
    '................',
    '................',
    '................',
  ],

  // ---- magia por escola ---------------------------------------------------
  fogo: [
    '................',
    '.......8........',
    '......688.......',
    '.....6688.......',
    '....66688.......',
    '...666688.......',
    '...6666888......',
    '..66666888......',
    '..666668888.....',
    '..6666688888....',
    '..88666688888...',
    '...888888888....',
    '....8888888.....',
    '.....88888......',
    '................',
    '................',
  ],
  gelo: [
    '.......9........',
    '....9..9..9.....',
    '.....9.9.9......',
    '......999.......',
    '.9999919999999..',
    '......999.......',
    '.....9.9.9......',
    '....9..9..9.....',
    '.......9........',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  raio: [
    '.......666......',
    '......666.......',
    '.....666........',
    '....666.........',
    '...6666666......',
    '......6666......',
    '.....666........',
    '....666.........',
    '...666..........',
    '..666...........',
    '.666............',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  cura: [
    '......cccc......',
    '.....cbbbbc.....',
    '....cbbbbbbc....',
    '...cbb.cc.bbc...',
    '...cb..cc..bc...',
    '...cb.cccc.bc...',
    '...cb.cccc.bc...',
    '...cb..cc..bc...',
    '...cbb.cc.bbc...',
    '....cbbbbbbc....',
    '.....cbbbbc.....',
    '......cccc......',
    '................',
    '................',
    '................',
    '................',
  ],
  luz: [
    '.......6........',
    '...6...6...6....',
    '....6..6..6.....',
    '.....66666......',
    '....6bbbbb6.....',
    '...6bbb6bbb6....',
    '.66bb66666bb66..',
    '...6bbb6bbb6....',
    '....6bbbbb6.....',
    '.....66666......',
    '....6..6..6.....',
    '...6...6...6....',
    '.......6........',
    '................',
    '................',
    '................',
  ],
  arcano: [
    '.......9........',
    '......999.......',
    '.....9.9.9......',
    '....9..9..9.....',
    '...9...9...9....',
    '..999999999999..',
    '...9...9...9....',
    '....9..9..9.....',
    '.....9.9.9......',
    '......999.......',
    '.......9........',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  sono: [
    '................',
    '....dddddd......',
    '.......dd.......',
    '......dd........',
    '.....dd.........',
    '....dddddd......',
    '................',
    '........dddd....',
    '..........d.....',
    '.........d......',
    '........dddd....',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  bencao: [
    '.......6........',
    '......666.......',
    '.....66666......',
    '....6666666.....',
    '...666666666....',
    '..66666666666...',
    '...bbbbbbbbb....',
    '....6666666.....',
    '.....66666......',
    '......666.......',
    '.......6........',
    '................',
    '................',
    '................',
    '................',
  ],

  // ---- recursos do turno --------------------------------------------------
  acao: [
    '................',
    '......6666......',
    '....66777766....',
    '...6677777766...',
    '..667777777766..',
    '..677777777776..',
    '..677777777776..',
    '..667777777766..',
    '...6677777766...',
    '....66777766....',
    '......6666......',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  bonus: [
    '................',
    '................',
    '.......99.......',
    '......9999......',
    '.....999999.....',
    '....99999999....',
    '.....999999.....',
    '......9999......',
    '.......99.......',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  reacao: [
    '.........888....',
    '........888.....',
    '.......888......',
    '......888.......',
    '.....88888888...',
    '........8888....',
    '.......888......',
    '......888.......',
    '.....888........',
    '....888.........',
    '...888..........',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  movimento: [
    '................',
    '...33...........',
    '..3333..........',
    '..3333....33....',
    '...33....3333...',
    '.........3333...',
    '..........33....',
    '....33..........',
    '...3333.........',
    '...3333....33...',
    '....33....3333..',
    '..........3333..',
    '...........33...',
    '................',
    '................',
    '................',
  ],

  // ---- interface ----------------------------------------------------------
  terminar: [
    '................',
    '.............cc.',
    '............cc..',
    '...........cc...',
    '..cc......cc....',
    '...cc....cc.....',
    '....cc..cc......',
    '.....cccc.......',
    '......cc........',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  ficha: [
    '..bbbbbbbbbbbb..',
    '..b..........b..',
    '..b..33333...b..',
    '..b..........b..',
    '..b..3333333.b..',
    '..b..3333333.b..',
    '..b..........b..',
    '..b..33333...b..',
    '..b..........b..',
    '..b..3333333.b..',
    '..b..3333333.b..',
    '..b..........b..',
    '..b..33333...b..',
    '..bbbbbbbbbbbb..',
    '................',
    '................',
  ],
  mochila: [
    '......5555......',
    '.....5....5.....',
    '....55555555....',
    '...5555555555...',
    '...5566666655...',
    '...5566666655...',
    '...5555555555...',
    '...5577777755...',
    '...5555555555...',
    '...5555555555...',
    '...5555555555...',
    '....55555555....',
    '................',
    '................',
    '................',
    '................',
  ],
};

// Os ícones de ITEM vêm de um arquivo próprio, em grade de 32. Ficam fora
// daqui porque são outra categoria de desenho — objeto, não glifo — e porque
// vinte e quatro grades de 32 linhas afogariam os glifos de interface, que é
// o que este arquivo existe para guardar.
Object.assign(P, PALETA_ITENS);
Object.assign(ICONES, ICONES_ITENS);
// Os de condição e os de magia usam a própria `P`, sem paleta extra.
Object.assign(ICONES, ICONES_CONDICOES);
Object.assign(ICONES, ICONES_MAGIAS);
// Ações, traços de raça e recursos de classe: src/dev/icones_consolidar.py.
Object.assign(ICONES, ICONES_ACOES, ICONES_RACAS, ICONES_CLASSES);
// Um ícone por item do catálogo (`item-<id>`): src/dev/icones_consolidar.py.
Object.assign(ICONES, ICONES_OBJETOS);

// DOIS NOMES, UM DESENHO.
//
// Visão no Escuro é traço de raça e é magia, e faz a mesma coisa nos dois
// casos; o estilo de luta Combate com Duas Armas é a ação de atacar com a mão
// secundária. Gerar dois desenhos para a mesma ideia daria dois ícones quase
// iguais, que é exatamente o par confundível que a revisão manda refazer.
const ALIAS = {
  // Condições sem desenho próprio reaproveitam o da magia que as causa.
  levitando: 'magia-levitacao', piscando: 'magia-piscar', etereo: 'magia-piscar',
  'raca-darkvision': 'magia-visaoNoEscuro',
  'classe-twoWeaponFighting': 'acao-duasArmas',
  // O motor de progressão chama o aumento de atributo de `asi`.
  'classe-asi': 'classe-abilityScoreImprovement',
  // Mesma ideia, um desenho: o ancestral do feiticeiro é o do draconato, e o
  // estilo de luta adicional é o estilo de luta.
  'classe-dragonAncestor': 'raca-draconicAncestry',
  'classe-additionalFightingStyle': 'classe-fightingStyle',
  'classe-additionalMagicalSecrets': 'classe-magicalSecrets',
  // O marcador "escolha a subclasse" mostra o emblema da classe.
  'classe-primalPath': 'classe-barbaro', 'classe-bardCollege': 'classe-bardo',
  'classe-otherworldlyPatron': 'classe-bruxo', 'classe-divineDomain': 'classe-clerigo',
  'classe-druidCircle': 'classe-druida', 'classe-sorcerousOrigin': 'classe-feiticeiro',
  'classe-martialArchetype': 'classe-guerreiro', 'classe-roguishArchetype': 'classe-ladino',
  'classe-arcaneTradition': 'classe-mago', 'classe-monasticTradition': 'classe-monge',
  'classe-rangerArchetype': 'classe-patrulheiro',
};
const resolver = (nome) => (ICONES[nome] ? nome : ALIAS[nome] ?? nome);

const cache = new Map();

/**
 * Desenha um ícone num canvas novo.
 *
 * @param {string} nome    chave de ICONES
 * @param {number} escala  pixels de tela por pixel do ícone
 * @param {string|null} tinta  recolore o ícone inteiro (para estados apagados)
 */
export function iconCanvas(nome, alvo = 32, tinta = null) {
  const chave = `${nome}|${alvo}|${tinta ?? ''}`;
  const pronto = cache.get(chave);
  if (pronto) return copiar(pronto);

  const grade = ICONES[resolver(nome)];
  const cv = document.createElement('canvas');
  cv.className = 'icone';
  if (!grade) { cv.width = alvo; cv.height = alvo; return cv; }

  // `alvo` é o tamanho em PIXELS DE TELA, não um multiplicador. Os ícones de
  // item têm grade de 32 e os de interface, de 16: com um multiplicador, a
  // mesma chamada produziria caixas de tamanhos diferentes conforme o ícone,
  // e quem chama não tem como saber a resolução de cada um — nem deveria.
  // Dizendo o tamanho que cabe, a escala sai daqui.
  const lado = grade.length;
  const escala = Math.max(1, Math.round(alvo / lado));
  cv.width = lado * escala;
  cv.height = lado * escala;

  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < grade.length; y++) {
    const linha = grade[y];
    for (let x = 0; x < linha.length; x++) {
      const ch = linha[x];
      if (ch === '.' || ch === ' ') continue;
      const cor = tinta ?? P[ch];
      if (!cor) continue;
      ctx.fillStyle = cor;
      ctx.fillRect(x * escala, y * escala, escala, escala);
    }
  }
  cache.set(chave, cv);
  return copiar(cv);
}

/** Canvas não pode ser inserido em dois lugares; cada uso leva uma cópia. */
function copiar(origem) {
  const cv = document.createElement('canvas');
  cv.width = origem.width;
  cv.height = origem.height;
  cv.className = 'icone';
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(origem, 0, 0);
  return cv;
}

export const temIcone = (nome) => Boolean(ICONES[resolver(nome)]);

/**
 * Ícone de um recurso de classe ou traço de raça, pelo id que o jogo guarda
 * em `c.features` (`secondWind`, `sneakAttack`...). `null` se não houver.
 */
export function iconeDeRecurso(id) {
  return [`classe-${id}`, `raca-${id}`].find(temIcone) ?? null;
}

// Os azulejos da barra de ações nasceram com ícones de 16 px desenhados à mão,
// com nomes próprios. Onde já existe o ícone de 32 da mesma ação, ele vence;
// onde não existe, o antigo continua.
const ACAO_DO_HUD = {
  correr: 'acao-disparada',
  esquivar: 'acao-esquivar',
  desengajar: 'acao-desengajar',
  estabilizar: 'acao-estabilizar',
  folego: 'classe-secondWind',
  surto: 'classe-actionSurge',
  ardilosa: 'classe-cunningAction',
  levantar: 'acao-levantarSe',
  pular: 'acao-saltar',
  preservar: 'classe-preserveLife',
  furia: 'classe-rage',
  inspiracao: 'classe-bardicInspiration',
  curaMaos: 'classe-layOnHands',
  sentidoDivino: 'classe-divineSense',
  recuperacaoArcana: 'classe-arcaneRecovery',
  artesMarciais: 'classe-martialArts',
  descuidado: 'classe-recklessAttack',
  expulsar: 'classe-turnUndead',
  smite: 'classe-divineSmite',
  rajada: 'classe-flurryOfBlows',
  defesaPaciente: 'classe-patientDefense',
  atordoante: 'classe-stunningStrike',
};
// Enquanto o desenho próprio não existe, o de antes.
const ACAO_RESERVA = {
  pular: 'magia-salto',
  ardilosaDisparada: 'acao-disparada',
  ardilosaDesengajar: 'acao-desengajar',
  ventoDisparada: 'classe-stepOfTheWind',
  ventoDesengajar: 'classe-stepOfTheWind',
};
export function iconeDeAcao(nome) {
  const novo = ACAO_DO_HUD[nome] ?? `acao-${nome}`;
  if (temIcone(novo)) return novo;
  return ACAO_RESERVA[nome] ?? nome;
}

/**
 * O ícone de UMA arma pelo id: o do catálogo de itens (`item-<id>`, o desenho
 * revisado de cada arma) e, se ainda não houver, o genérico da família.
 */
export function iconeDaArma(id, w = {}) {
  return temIcone(`item-${id}`) ? `item-${id}` : iconeDeArma(w.art, w.name);
}

/** Ícone de uma arma, pela arte declarada no equipamento. */
export function iconeDeArma(art = '', nome = '') {
  const t = `${art} ${nome}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  // A ORDEM É A REGRA. Quem testa por nome tem de vir antes de quem testa por
  // `art`, senão a besta — cujo `art` é 'bow' — nunca chega no seu ramo. E
  // "machadinha" tem de ser pega antes de "adaga", que é substring de nada
  // mas cujo ramo é largo demais.
  //
  // Dezesseis ícones de arma para trinta e sete armas. A função é o mapa
  // entre os dois, e sem ela trinta caíam no ramo final — o catálogo inteiro
  // virava uma parede de espadas iguais.
  //
  // Os ramos mais ESPECÍFICOS primeiro: "espada grande" tem de ser pega
  // antes de "espada", e "machado grande" antes de "machado", senão a arma
  // de duas mãos sai com o desenho da de uma.
  if (/besta|crossbow/.test(t)) return 'besta';
  if (/arco|bow|funda|zarabatana/.test(t)) return 'arco';
  if (/espada grande|greatsword/.test(t)) return 'espadaGrande';
  if (/espada curta|shortsword/.test(t)) return 'espadaCurta';
  if (/rapieira|rapier/.test(t)) return 'rapieira';
  if (/cimitarra|scimitar/.test(t)) return 'cimitarra';
  if (/machado grande|alabarda|greataxe|halberd/.test(t)) return 'machadoGrande';
  if (/machado|axe/.test(t)) return 'machado';
  if (/mangual|flail/.test(t)) return 'mangual';
  if (/martelo|malho|picareta|hammer|maul/.test(t)) return 'martelo';
  if (/maca|mace|clava|estrela|club/.test(t)) return 'maca';
  if (/foice|chicote|sickle|whip/.test(t)) return 'foice';
  if (/lanca|azagaia|pique|tridente|glaive|spear|pike/.test(t)) return 'lanca';
  if (/cajado|staff|bordao/.test(t)) return 'cajado';
  if (/adaga|dagger|dardo|dart/.test(t)) return 'adaga';
  return 'espada';
}

/**
 * Ícone de uma magia.
 *
 * Cada magia tem o seu (src/art/icones-magias.js, chave `magia-<id>`). O
 * resto da função é recuo para magia nova que ainda não ganhou desenho.
 *
 * O RECUO DECIDE PELO TIPO DE DANO ANTES DO NOME. Antes era o contrário, e o
 * português atrapalhava: "raio" é tanto *ray* quanto relâmpago, e "chama"
 * aparece em magia que não é de fogo. Chama Sagrada (radiante) saía com o
 * ícone de fogo; Raio Guiado (radiante) e Raio de Doença (veneno), com o de
 * relâmpago. O tipo de dano é dado, o nome é palavra — o dado vem primeiro.
 */
// Magias do lote 14 que ainda não têm ícone próprio usam o da parente mais próxima (sem arte nova).
const ICONE_PARECIDO = {
  linguas: 'compreenderIdiomas', alterarAparencia: 'disfarcarSe', cativar: 'sugestao',
  sentidosDaFera: 'falarComAnimais', fingirDeMorto: 'falarComOsMortos',
};

export function iconeDeMagia(spell = {}) {
  if (spell.id && ICONES[`magia-${spell.id}`]) return `magia-${spell.id}`;
  if (spell.id && ICONE_PARECIDO[spell.id] && ICONES[`magia-${ICONE_PARECIDO[spell.id]}`]) return `magia-${ICONE_PARECIDO[spell.id]}`;
  const dano = `${spell.damageType ?? ''}`.toLowerCase();
  const id = `${spell.id ?? ''} ${spell.name ?? ''}`.toLowerCase();
  if (spell.kind === 'heal') return 'cura';
  if (/fogo/.test(dano)) return 'fogo';
  if (/frio/.test(dano)) return 'gelo';
  if (/elétrico|eletrico|trov/.test(dano)) return 'raio';
  if (/radiante/.test(dano)) return 'luz';
  if (dano) return 'arcano';
  // Só sem tipo de dano o nome decide.
  if (/cura|curar/.test(id)) return 'cura';
  if (/sono|enfeitiç/.test(id)) return 'sono';
  if (/bênção|bencao|abenço/.test(id)) return 'bencao';
  return 'arcano';
}
