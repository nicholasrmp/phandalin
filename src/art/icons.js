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

  const traco = desenhoDeTraco(nome);
  if (traco) {
    const cv = desenharTraco(traco, alvo, tinta);
    cache.set(chave, cv);
    return copiar(cv);
  }

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

// ---- os ícones de traço, no tratamento ESMALTE ----------------------------------------
//
// O jogo desenha os ícones de traço da game-icons.net (`public/icones-traco.json`, de `src/dev/importar-icones-traco.mjs`):
// `main.js` baixa o arquivo e chama `ativarIconesDeTraco`. Toda chave do jogo tem de-para (a prova é de
// `testes-regras.mjs`); o pixel só aparece enquanto o arquivo não chegou.
//
// O ESMALTE, escolhido pelo dono entre quatro propostas (revisoes/interface-2026-11-09.md): a figura na cor da FAMÍLIA
// dela, num degradê de duas cores (a de cima clara, como luz vinda do alto; a de baixo a cor cheia), um contorno escuro
// fino que a descola de qualquer fundo e um brilho baixo na cor. A família vem do gerador (`familias`, uma por chave:
// a magia pelo dano ou pela escola, a característica pela classe, o item pela raridade, a condição por ser boa ou
// ruim); as CORES moram aqui (`PALETA_DO_ESMALTE`), então ajustar uma cor é só editar a tabela.
//
// O valor do de-para é um nome (`fireball`) ou um COMPOSTO (`shield+flame`): o selo vai pequeno no canto de baixo à
// direita, num recorte aberto na base, e na cor DO QUE ELE É (a chama em fogo, o floco em frio), não na da família —
// é a segunda cor do ícone. `pecas` (opcional, por chave: [{ d, familia }]) pinta peças separadas do desenho com outra
// família por cima da base: a rolha da poção, o cabo do machado. Elas saem de `src/dev/pecas-icones.py`.

/** [cor de cima, cor de baixo] de cada família. */
export const PALETA_DO_ESMALTE = {
  // o dano
  fogo: ['#ffd76e', '#e04a24'], frio: ['#ffffff', '#7ccaf2'], 'elétrico': ['#fff6a8', '#e9b52a'], trovejante: ['#ddd7ff', '#7a6fd6'],
  'ácido': ['#eeff96', '#79bd25'], veneno: ['#c4f27c', '#8c4dc6'], 'necrótico': ['#dfeccf', '#6e5390'], radiante: ['#fffcec', '#e8b444'],
  'psíquico': ['#ffd6f3', '#d2549f'], 'energético': ['#efe6ff', '#9a7cf2'], cura: ['#cfffd6', '#1fb85c'],
  // a escola (a magia sem dano)
  abjuracao: ['#f2f6fb', '#8ea8c6'], adivinhacao: ['#e2f0ff', '#4c7ee0'], conjuracao: ['#fff1c8', '#e0a13a'], encantamento: ['#ffe2f3', '#e077b8'],
  evocacao: ['#ffe8c4', '#ee7a38'], ilusao: ['#f0e4ff', '#9a70e2'], necromancia: ['#e4efd9', '#6e905f'], transmutacao: ['#f5ffd0', '#aeb83f'],
  // a classe
  barbaro: ['#ffc6aa', '#e2502b'], bardo: ['#f8cdf3', '#b25ab2'], bruxo: ['#e6c8ff', '#7d44ba'], clerigo: ['#f5f7fa', '#a7b5c8'],
  druida: ['#e8f2a8', '#7e9a30'], feiticeiro: ['#ffbcbc', '#c43636'], guerreiro: ['#f4d4be', '#a95f3c'], ladino: ['#cdd0ff', '#5052b0'],
  mago: ['#ccdaff', '#3f68d2'], monge: ['#c8f4ff', '#3ba6ca'], paladino: ['#fff2c4', '#c9a23c'], patrulheiro: ['#d2ebcb', '#4d8a5c'],
  classe: ['#fbecc8', '#c99a4a'], raca: ['#f2e4cf', '#b48f62'], talento: ['#cff5ee', '#33a28c'],
  // o item
  arma: ['#f6f8fa', '#97a2ad'], armadura: ['#f7e5c8', '#ad7b45'], equipamento: ['#f4ecdb', '#b6a685'], comum: ['#f4ecdb', '#b6a685'],
  incomum: ['#d6ffda', '#3aad52'], raro: ['#d8e8ff', '#3b78e0'], muitoRaro: ['#eedaff', '#9a52e2'], lendario: ['#ffe2bc', '#ea7f26'],
  artefato: ['#ffd8d2', '#d24838'],
  // a condição e a ação
  boa: ['#d8fff0', '#29b085'], ruim: ['#ffd3c6', '#e2553c'], efeito: ['#f1e8ff', '#9f86d8'], acao: ['#fff3d2', '#d6a443'],
  // o MATERIAL, para a cor por peça (`pecas`): o cabo de madeira, a rolha, o osso, a chama de uma vela
  madeira: ['#ecc79a', '#8c5a2c'], couro: ['#e4b890', '#7c4a28'], ouro: ['#fff2bc', '#d3a034'], pedra: ['#e4e0d8', '#8a847a'],
  osso: ['#f7f1e2', '#c6b994'], pele: ['#ffe2cc', '#d0956c'], sangue: ['#ffb4a4', '#c22e28'], vidro: ['#f4fcff', '#9fc6da'],
  planta: ['#dcf7a4', '#5a9c2c'],
};
const SEM_FAMILIA = PALETA_DO_ESMALTE.acao;
// o SELO na cor do que ele é: pelo nome do desenho da coleção
const FAMILIA_DO_SELO = [
  [/flame|fire|burn|torch/, 'fogo'], [/snow|ice|frozen|frost/, 'frio'], [/lightning|electric|bolt|spark/, 'elétrico'],
  [/poison|drop|acid|vial/, 'veneno'], [/skull|death|grim|bone|reaper/, 'necrótico'], [/sun|star|halo|sparkles|angel/, 'radiante'],
  [/brain|psychic|third-eye|telepath/, 'psíquico'], [/heart|healing|health/, 'cura'], [/rune|portal|swirl|magic/, 'energético'],
  [/thunder|sound|sonic/, 'trovejante'], [/eye/, 'adivinhacao'], [/shield/, 'abjuracao'], [/sword|blade|axe|dagger|bow|arrow/, 'arma'],
];
const familiaDoSelo = (nome) => FAMILIA_DO_SELO.find(([re]) => re.test(nome))?.[1] ?? null;

let TRACO = null;

/** Liga os ícones de traço: `dados` é o JSON do gerador. Limpa o cache para o pixel sair. */
export function ativarIconesDeTraco(dados) {
  TRACO = {
    mapa: dados.mapa,
    familias: dados.familias ?? {},
    pecas: dados.pecas ?? {},
    lado: dados.lado ?? 512,
    caminhos: dados.desenhos,
    path2d: new Map(),
  };
  cache.clear();
}
export const iconesDeTracoAtivos = () => Boolean(TRACO);
/** A chave tem desenho de traço (ligado). */
const temTraco = (nome) => Boolean(TRACO && (TRACO.mapa[nome] ?? TRACO.mapa[resolver(nome)]));
const chaveDoTraco = (nome) => (TRACO?.mapa[nome] ? nome : resolver(nome));
/** A família de cor do ícone (`fogo`, `mago`, `raro`...) ou null. */
export const familiaDoIcone = (nome) => (TRACO ? TRACO.familias[chaveDoTraco(nome)] ?? null : null);
/** [cima, baixo] do Esmalte para o ícone: o azulejo usa a de baixo para a borda e o brilho. */
export const coresDoIcone = (nome) => PALETA_DO_ESMALTE[familiaDoIcone(nome)] ?? SEM_FAMILIA;

function caminhosDe(n) {
  if (!TRACO.caminhos[n]) return null;
  if (!TRACO.path2d.has(n)) TRACO.path2d.set(n, TRACO.caminhos[n].map((d) => new Path2D(d)));
  return TRACO.path2d.get(n);
}

/** { base, selo, familia, familiaDoSelo, pecas } do ícone de traço da chave, ou null. */
function desenhoDeTraco(nome) {
  if (!TRACO) return null;
  const chave = chaveDoTraco(nome);
  const valor = TRACO.mapa[chave];
  if (!valor) return null;
  const [b, sl] = valor.split('+');
  const base = caminhosDe(b);
  if (!base) return null;
  return {
    base, selo: sl ? caminhosDe(sl) : null,
    familia: TRACO.familias[chave] ?? null,
    familiaDoSelo: sl ? familiaDoSelo(sl) : null,
    pecas: TRACO.pecas[chave] ?? null,
  };
}

// o selo ocupa 46% do lado, encostado no canto de baixo à direita, num círculo aberto um pouco maior
const SELO = { escala: 0.46, folga: 0.06 };

/** Pinta caminhos em Esmalte: contorno escuro, degradê das duas cores da família, brilho baixo. */
function esmaltar(ctx, caminhos, [cima, baixo], L, { brilho = true } = {}) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(8, 6, 12, .85)';
  ctx.lineWidth = L * 0.066;
  for (const p of caminhos) ctx.stroke(p);
  const g = ctx.createLinearGradient(0, 0, 0, L);
  g.addColorStop(0, cima);
  g.addColorStop(0.62, baixo);
  g.addColorStop(1, baixo);
  ctx.fillStyle = g;
  if (brilho) { ctx.shadowColor = baixo; ctx.shadowBlur = L * 0.07; }
  for (const p of caminhos) ctx.fill(p);
  ctx.restore();
}

/**
 * O ícone em vetor, no tamanho pedido e na densidade da tela: `alvo` continua sendo o tamanho em pixels de tela (o
 * estilo fixa a caixa), e o canvas tem `alvo × devicePixelRatio` por dentro, para o traço não borrar. `tinta` (o
 * estado apagado de quem chama) troca o Esmalte por uma cor chapada.
 */
function desenharTraco({ base, selo, familia, familiaDoSelo: famSelo, pecas }, alvo, tinta) {
  const dpr = Math.min(3, Math.max(1, Math.round(globalThis.devicePixelRatio ?? 1)));
  const cv = document.createElement('canvas');
  cv.className = 'icone traco';
  cv.width = alvo * dpr;
  cv.height = alvo * dpr;
  cv.style.width = `${alvo}px`;
  cv.style.height = `${alvo}px`;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  const L = TRACO.lado;
  // uma margem de 4% para o contorno e o brilho não serem cortados na borda do canvas
  const k = (alvo * dpr) / L;
  ctx.setTransform(k * 0.92, 0, 0, k * 0.92, alvo * dpr * 0.04, alvo * dpr * 0.04);
  const cores = PALETA_DO_ESMALTE[familia] ?? SEM_FAMILIA;
  const pinta = (caminhos, cs, op) => (tinta
    ? (() => { ctx.save(); ctx.fillStyle = tinta; for (const p of caminhos) ctx.fill(p); ctx.restore(); })()
    : esmaltar(ctx, caminhos, cs, L, op));
  // PEÇAS: o ícone inteiro na família dele, e por cima, peça a peça, as que levam outra (a rolha da poção, o cabo do
  // machado). Cada peça já vem com os furos dela (`src/dev/pecas-icones.py`), então pintá-la sozinha não tapa nada.
  pinta(base, cores);
  if (pecas && !tinta) for (const pc of pecas) pinta([pc.p2d ??= new Path2D(pc.d)], PALETA_DO_ESMALTE[pc.familia] ?? cores, { brilho: false });
  if (selo) {
    const lado = L * SELO.escala;
    const x0 = L - lado;
    const y0 = L - lado;
    // o recorte: apaga a base num círculo em volta do selo, para os dois não virarem uma mancha só
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x0 + lado / 2, y0 + lado / 2, lado * (0.5 + SELO.folga), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(x0, y0);
    ctx.scale(SELO.escala, SELO.escala);
    pinta(selo, PALETA_DO_ESMALTE[famSelo] ?? [cores[0], cores[0]], { brilho: false });
    ctx.restore();
  }
  return cv;
}

/** Canvas não pode ser inserido em dois lugares; cada uso leva uma cópia. */
function copiar(origem) {
  const cv = document.createElement('canvas');
  cv.width = origem.width;
  cv.height = origem.height;
  if (origem.style.width) { cv.style.width = origem.style.width; cv.style.height = origem.style.height; }
  cv.className = origem.className || 'icone';
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(origem, 0, 0);
  return cv;
}

export const temIcone = (nome) => Boolean(ICONES[resolver(nome)]) || temTraco(nome);
/** As chaves do catálogo (o gerador dos ícones de traço confere o de-para contra elas). */
export const chavesDosIcones = () => Object.keys(ICONES);
/** A grade de pixels de um ícone (ou null): para comparar o pixel antigo com o traço fora do jogo. */
export const gradeDoIcone = (nome) => ICONES[resolver(nome)] ?? null;

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
  // a Ação Ardilosa de se esconder tem o desenho da ação Esconder (sem isto o ícone saía em branco: não há `acao-ardilosaEsconder`)
  ardilosaEsconder: 'acao-esconder',
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
  // as subclasses do Guia de Xanathar, até ganharem desenho próprio
  stormAura: 'classe-wrathOfTheStorm',
  zealousPresence: 'classe-intimidatingPresence',
  mantleOfInspiration: 'magia-heroismo',
  unbreakableMajesty: 'magia-santuario',
  bladeFlourish: 'classe-combatInspiration',
  psychicBlades: 'magia-sussurrosDissonantes',
  fightingSpirit: 'classe-frenzy',
  elegantManeuver: 'classe-cunningAction',
  arcaneShot: 'classe-volley',
  kenseisShot: 'classe-volley',
  oneWithTheBlade: 'classe-stunningStrike',
  sharpenTheBlade: 'classe-stunningStrike',
  conqueringPresence: 'classe-intimidatingPresence',
  invincibleConqueror: 'classe-frenzy',
  emissaryOfPeace: 'magia-bencao',
  etherealStep: 'classe-stepOfTheWind',
  otherworldlyWings: 'classe-stepOfTheWind',
  unearthlyRecovery: 'magia-palavraCurativa',
  umbralForm: 'classe-intimidatingPresence',
  spiritTotem: 'magia-bencao',
  barbarianWildSurge: 'classe-rage',
  animatingPerformance: 'classe-combatInspiration',
  ordersDemand: 'magia-comando',
  embodimentOfTheLaw: 'magia-comando',
  emboldeningBond: 'magia-bencao',
  balmOfPeace: 'magia-palavraCurativa',
  twilightSanctuary: 'magia-santuario',
  stepsOfNight: 'classe-stepOfTheWind',
  symbioticEntity: 'classe-wildShape',
  starryForm: 'magia-raioGuiado',
  summonWildfireSpirit: 'magia-esferaFlamejante',
  psionicPower: 'classe-stunningStrike',
  psionicStrike: 'classe-stunningStrike',
  telekineticAdept: 'classe-stepOfTheWind',
  bulwarkOfForce: 'magia-escudoDaFe',
  giantsMight: 'classe-rage',
  runeCarver: 'classe-combatInspiration',
  handOfHarm: 'classe-flurryOfBlows',
  armsOfTheAstralSelf: 'classe-flurryOfBlows',
  visageOfTheAstralSelf: 'classe-stunningStrike',
  awakenedAstralSelf: 'classe-flurryOfBlows',
  inspiringSmite: 'classe-divineSmite',
  peerlessAthlete: 'classe-rage',
  livingLegend: 'classe-divineSmite',
  abjureTheExtraplanar: 'classe-turnUndead',
  watchersWill: 'magia-escudoDaFe',
  mortalBulwark: 'classe-turnUndead',
  gatheredSwarm: 'classe-volley',
  writhingTide: 'classe-stepOfTheWind',
  ghostWalk: 'classe-stepOfTheWind',
  psychicVeil: 'classe-stunningStrike',
  revelationInFlesh: 'classe-stepOfTheWind',
  bastionOfLaw: 'magia-escudoDaFe',
  tranceOfOrder: 'classe-stunningStrike',
  clockworkCavalcade: 'magia-palavraCurativa',
  elementalGift: 'classe-stepOfTheWind',
  bladesong: 'classe-combatInspiration',
  awakenedSpellbook: 'classe-arcaneRecovery',
  battleragerCharge: 'classe-rage',
  arcaneAbjuration: 'classe-turnUndead',
  hourOfReaping: 'classe-stunningStrike',
  championChallenge: 'classe-divineSmite',
  turnTheTide: 'magia-palavraCurativa',
  exaltedChampion: 'classe-divineSmite',
  indestructibleLife: 'magia-palavraCurativa',
  controlUndead: 'classe-turnUndead',
  dreadfulAspect: 'classe-turnUndead',
  dreadLord: 'classe-turnUndead',
  touchOfDeathCleric: 'classe-turnUndead',
  draconicDisciple: 'classe-flurryOfBlows',
  elementalCleaver: 'classe-rage',
  aspectOfTheWyrm: 'classe-stunningStrike',
  drakeCompanion: 'classe-volley',
};
export function iconeDeAcao(nome) {
  const novo = ACAO_DO_HUD[nome] ?? `acao-${nome}`;
  if (temIcone(novo)) return novo;
  // A ação de classe que usa o próprio id da característica como chave do ícone (`classe-<id>`).
  if (temIcone(`classe-${nome}`)) return `classe-${nome}`;
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
  passoDoCaos: 'passoNebuloso',
  linguas: 'compreenderIdiomas', alterarAparencia: 'disfarcarSe', cativar: 'sugestao',
  sentidosDaFera: 'falarComAnimais', fingirDeMorto: 'falarComOsMortos',
  // O catálogo de ícones foi desenhado com os nomes do livro; três magias do lote de 4º ao 9º círculo têm outro id no jogo.
  dimensaoPorta: 'portaDimensional', curaTotal: 'curaCompleta', nuvemMortal: 'nevoaMortal',
};

export function iconeDeMagia(spell = {}) {
  // a magia que só tem traço (os livros) usa o dela enquanto o traço estiver ligado
  if (spell.id && temTraco(`magia-${spell.id}`)) return `magia-${spell.id}`;
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
