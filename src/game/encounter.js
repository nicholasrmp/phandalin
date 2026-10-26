// Definição do encontro, separada do código que o monta.
//
// Fica aqui porque DUAS coisas precisam dela: o jogo e o simulador de
// balanceamento (`dev/balance.js`). Se o mapa e a lista de inimigos morassem
// dentro de main.js, cada ajuste de equilíbrio exigiria mexer em dois lugares —
// e os dois sairiam do lugar.
//
// É também o primeiro passo na direção de campanha como dados.

import { makeMonster } from '../rules/monsters.js';
import { makeNpc } from '../rules/npcs.js';
import { MAPA_ESCONDERIJO } from './esconderijo.js';
import { MAPA_MANSAO, MANSAO } from './mansao.js';
import { MAPA_POCO } from './poco.js';
import { MAPA_CUME } from './cume.js';
import { MAPA_CASTELO, CASTELO } from './castelo.js';
import { MAPA_ARVORE_TROVAO, ARVORE_TROVAO } from './arvoretrovao.js';

// '.' chão · '#' parede · '~' terreno difícil · 'o' cobertura · '1'..'9' elevação
//
// O paredão central (x7–9, y4–6) existe porque, sem ele, os dois lados se veem
// do primeiro quadrado e o combate vira troca de tiros de 24 m.
//
// O platô do canto superior direito é onde os goblins se posicionam. Subir
// custa o dobro (escalada, pelo SRD), quem está em cima tem cobertura contra
// quem está embaixo, e o platô corta a linha de visão de quem está atrás dele.
export const MAP = [
  '################',
  '#......o...111.#',
  '#..~~..o...111.#',
  '#..~~......111.#',
  '#......###.....#',
  '#......###.....#',
  '#......###.....#',
  '#..oo..........#',
  '#..oo..1...~~..#',
  '#......1...~~..#',
  '#..............#',
  '################',
];

/** Guerreira na frente, mago atrás — o posicionamento inicial já ensina. */
export const PARTY_SPOTS = [
  { x: 3, y: 9 }, { x: 2, y: 10 }, { x: 2, y: 9 }, { x: 1, y: 10 },
];

// A EMBOSCADA NA ESTRADA.
//
// Uma estrada larga atravessando a mata, barrancos de grama dos dois lados e
// mata fechada além deles. A carroça do grupo está na ponta oeste; dois cavalos
// mortos, flechados, bloqueiam o meio do caminho; uma trilha estreita sobe
// para o norte pela mata — é por ela que os goblins vieram e é por ela que os
// reforços chegam.
//
// O desenho é pensado para a altura TRABALHAR: os goblins ficam no alto dos
// barrancos (nível 1), o grupo embaixo, na estrada. Subir custa o dobro, quem
// está em cima tem cobertura contra quem está embaixo, e a mata atrás deles
// corta a linha de visão de quem tentar contornar. A carroça e os cavalos são
// a única cobertura no chão da estrada — e estão longe uma da outra.
//
// Duas grades porque um caractere não diz as duas coisas: TERRENO diz o que é
// (`,` grama, `:` estrada, `T` mata, `C` carroça, `h` cavalo, `r` pedra) e
// ALTURA diz em que nível está. A grama do barranco é `,` no terreno e `1` na
// altura; a do acostamento é `,` e `0`.
export const MAPA_EMBOSCADA = {
  terreno: [
    'TTTTTTTTTTTTTTTTTTT::TTTTTTT',
    'TTTTTTTTTTTTTTTTTTT::TTTTTTT',
    'TTTTTTTTTTTTTTTTTTT::TTTTTTT',
    'TTTTTTTTTTTTTTTTTTT::TTTTTTT',
    'TT,,TTTTTTTTTTTT,,T::TTT,,TT',
    ',,,,,TT,,TT,,TT,,TT::TT,,,,,',
    ',,,,,,,,r,,,,,,,,TT::TT,r,,,',
    ',,,,,,,,,,,,,,,,,bT::Tb,,,,,',
    ',,,,,,,,,,,,,,,,,bb::b,b,,,,',
    '::::::,,,,,,,,,,,,b::b::::::',
    ':::::::::::::,,,,:::::::::::',
    ':CC:::::::::::::::::::::::::',
    ':CC:::::::::::::::hh::::::::',
    '::::::::::::::::::::::::::::',
    ':::::::::::::::::::hh:::::::',
    ',,,,,,::::::::::::::::,,,,,,',
    ',,,,r,,,,,,,,,,,,b,,,,,,,,,,',
    ',,,,,,,,,,,r,,,,,,,,,,,,,r,,',
    'TT,,,,,TT,,,,,,,,,,TTTT,,TTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  altura: [
    '1111111111111111111111111111',
    '1111111111111111111111111111',
    '1111111111111111111111111111',
    '1111111111111111111111111111',
    '1111111111111111111111111111',
    '1111111111111111111111111111',
    '1111111111111111111111111111',
    '1111111111111111111111111111',
    '0000011111111111111111000000',
    '0000000000000111100000000000',
    '0000000000000000000000000000',
    '0000000000000000000000000000',
    '0000000000000000000000000000',
    '0000000000000000000000000000',
    '0000000000000000000000000000',
    '1100000000000000000000100111',
    '1111111111111000011111111111',
    '1111111111111111111111111111',
    '1111111111111111111111111111',
    '1111111111111111111111111111',
    '1111111111111111111111111111',
    '1111111111111111111111111111',
  ],
  // Para onde apontam os objetos de várias casas — a grade de glifos diz ONDE
  // eles estão, não para onde olham. (x, y) é qualquer casa da pegada.
  // A carroça aponta para leste, na direção da viagem. Os cavalos caíram em
  // sentidos opostos e têm pelagens diferentes: dois sprites iguais lado a
  // lado leriam como cópia. Os cavalos olham na DIAGONAL do mundo, que na tela
  // cai sempre em perfil ou de frente (leste, oeste, norte, sul) em qualquer
  // rotação: nas vistas diagonais o PixelLab encurta o corpo deitado e ele
  // parece sentado.
  objetos: [
    { tipo: 'carroca', x: 1, y: 11, olha: { dx: 1, dy: 0 } },
    { tipo: 'cavalo', x: 18, y: 12, olha: { dx: 1, dy: -1 } },
    { tipo: 'cavalo', x: 19, y: 14, olha: { dx: -1, dy: 1 }, variante: 'tordilho' },
  ],
};

// A CAVERNA ESCURA (arena de teste da luz e das conversas).
//
// Uma sala em anel em volta de um paredão de rocha. O grupo entra pelo sul;
// os dois corredores sobem pelos lados do paredão e se encontram no nicho do
// norte, onde Droop cochila ao lado de uma fogueira baixa — a única luz.
// Um goblin de guarda em cada corredor, no breu, atrás da curva: os dois veem
// no escuro, o grupo (na maioria) não. Quem acende tocha enxerga o corredor e
// é enxergado do outro lado dele.
//
// Mapa nosso, de teste: não é o esconderijo da aventura.
export const MAPA_CAVERNA = [
  '###################',
  '#####........######',
  '####..........#####',
  '###....####....####',
  '##....######....###',
  '##...########...###',
  '#....########.....#',
  '#.....######......#',
  '#..o...####...o...#',
  '#.................#',
  '#......~~.........#',
  '##.....~~....#....#',
  '###..........##..##',
  '#####..........####',
  '###################',
];

// A RUA DE PHANDALIN (capítulo 3): a briga com os Marcarrubra. Uma rua de
// terra entre casas de pedra e reboco; a taverna Gigante Adormecido fica ao
// norte, com o pátio de barris ao lado, e os Marcarrubra esperam na frente
// dela. Cada prédio ocupa 3 x 3 casas (`H` casa, `Y` taverna) e é um sprite
// só; casas iguais nunca encostam, senão viram um prédio só (`pegadaDe`).
export const MAPA_RUA = [
  'TT,,HHH,,HHH,,YYY,u,TT',
  'T,,,HHH,,HHH,,YYY,,u,T',
  ',,,,HHH,,HHH,,YYY,,,,,',
  ',,,,,,,,,,,,,,,,,,,,,,',
  '::::::::::::::::::::::',
  '::::::::::::::::::::::',
  '::::::::::::::::::::::',
  ',,,,,,,,,,,,,,,,u,,,,,',
  ',,,HHH,,,,,,,,HHH,,,,,',
  ',,,HHH,,b,,,,,HHH,,,,,',
  ',,,HHH,,,,,,,,HHH,,,,,',
  ',,,,,,,,,,,r,,,,,,,,,,',
  'TT,,,,,,,,,,,,,,,,,,TT',
  'TTTTTTTT,,,,,,TTTTTTTT',
];

/** Qual prédio é cada bloco da rua e para onde fica a porta. */
const PREDIOS_RUA = [
  { tipo: 'casa', x: 4, y: 0, olha: { dx: 0, dy: 1 }, variante: 'a' },
  { tipo: 'casa', x: 9, y: 0, olha: { dx: 0, dy: 1 }, variante: 'b' },
  { tipo: 'taverna', x: 14, y: 0, olha: { dx: 0, dy: 1 } },
  // Ao sul, na frente da câmera, só a casa baixa: a de enxaimel é alta e
  // larga demais e cobria metade do grupo na rua.
  { tipo: 'casa', x: 3, y: 8, olha: { dx: 0, dy: -1 }, variante: 'a' },
  { tipo: 'casa', x: 14, y: 8, olha: { dx: 0, dy: -1 }, variante: 'a' },
];

// O ERMO (Parte 3): a Trilha Triboar entre colinas, para os encontros do
// caminho. A trilha corre de oeste a leste no meio; pedras e moitas dão
// cobertura dos dois lados, e uns poucos carvalhos fecham os cantos. De
// noite é o mesmo chão, com a fogueira do acampamento no meio da trilha.
export const MAPA_ERMO = [
  'TT,,,,,,,,,,,,,,,,,,TT',
  'T,,,,b,,,,,,,,,r,,,,,T',
  ',,,,,,,,,,r,,,,,,TT,,,',
  ',,r,,,,,,,,,,,,,,b,,,,',
  ',,,,,,,,b,,,,,,,,,,,,,',
  ',,,,,,,r,,,,,,,,,,,,,,',
  '::::::::::::::::::::::',
  '::::::::::::::::::::::',
  ',,,,,,r,,,,,,,,,,b,,,,',
  ',,,,b,,,,,,,,,,,r,,,b,',
  ',,,,,,,,,,,,r,,,,,,,,,',
  ',,,,,,,r,,,,,,,,,,b,,,',
  ',,b,,,,,,,,,,,,,,b,,,,',
  'T,,,,,,,,,,,b,,,,,,,,T',
  'TT,,,,,,,,,,,,,,,,,,TT',
];
export const MAPA_ERMO_NOITE = MAPA_ERMO.map((l, y) => (y === 7 ? `${l.slice(0, 11)}F${l.slice(12)}` : l));

/** O grupo escolta a carroça: logo à frente dela, na estrada, olhando para leste. */
export const PARTY_SPOTS_EMBOSCADA = [
  { x: 5, y: 11 }, { x: 4, y: 12 }, { x: 4, y: 11 }, { x: 3, y: 13 },
];

/**
 * O mapa, as posições do grupo e para onde ele olha, por variante.
 *
 * Mapa e posições andam juntos: uma posição boa num mapa cai dentro de uma
 * árvore no outro.
 */
export function mapaDo(variante = 'padrao') {
  if (variante === 'emboscada') {
    return {
      terreno: MAPA_EMBOSCADA.terreno,
      altura: MAPA_EMBOSCADA.altura,
      objetos: MAPA_EMBOSCADA.objetos,
      grupo: PARTY_SPOTS_EMBOSCADA,
      olhar: { dx: 1, dy: 0 },
      // Os goblins estão escondidos: rola-se surpresa no começo (combat.js).
      emboscada: { emboscadores: 'foes' },
    };
  }
  if (variante === 'rua') {
    return {
      terreno: MAPA_RUA,
      altura: null,
      objetos: PREDIOS_RUA,
      // O grupo vem pela rua, do oeste; os Marcarrubra esperam a leste, na
      // frente do Gigante Adormecido.
      grupo: [{ x: 3, y: 4 }, { x: 3, y: 6 }, { x: 2, y: 5 }, { x: 4, y: 5 }],
      olhar: { dx: 1, dy: 0 },
      cena: 'rua',
    };
  }
  if (variante === 'castelo') {
    // O Castelo Dentefino: o grupo sai da mata pela encosta a oeste do terraço.
    return {
      ...MAPA_CASTELO,
      // As casas de cada sala: o tabuleiro apaga a parede da sala em que o
      // grupo entrou (`board.desenharParedes`).
      salas: CASTELO.celulas,
      decor: CASTELO.decor,
      grupo: [[0, 9], [0, 10], [1, 9], [0, 11]].map(([x, y]) => ({ x: x + CASTELO.desloc.x, y: y + CASTELO.desloc.y })),
      olhar: { dx: 1, dy: 0 },
      cena: 'castelo',
    };
  }
  if (variante === 'cume') {
    // O Cume da Wyvern: o grupo chega pelo campo do sudeste, já de olho na
    // passagem que sobe para o acampamento.
    return {
      ...MAPA_CUME,
      objetos: [],
      grupo: [{ x: 25, y: 18 }, { x: 26, y: 18 }, { x: 25, y: 19 }, { x: 26, y: 19 }],
      olhar: { dx: -1, dy: -1 },
      cena: 'cume',
    };
  }
  if (variante === 'arvoreTrovao') {
    // As ruínas de Árvore Trovão: o grupo entra pela rua, vindo do sul, com a
    // torre do dragão no fim dela.
    return {
      ...MAPA_ARVORE_TROVAO,
      // Como no castelo: as casas de cada cômodo (o tabuleiro dissolve a parede
      // do cômodo em que o grupo entrou) e a decoração pendurada nas paredes.
      salas: ARVORE_TROVAO.celulas,
      decor: ARVORE_TROVAO.decor,
      pisos: ARVORE_TROVAO.pisos,
      avisosDeVista: true,
      // A mobilia: cada casa de `prop` diz qual peca do atlas e (`variante`).
      objetos: ARVORE_TROVAO.props.map((p) => ({ ...p })),
      // Do mapa, e não escrito aqui: estas casas já foram as do mapa antigo, e
      // quando ele cresceu o grupo passou a nascer dentro de uma construção.
      grupo: ARVORE_TROVAO.grupo.map((p) => ({ ...p })),
      olhar: { dx: 0, dy: -1 },
      cena: 'arvoreTrovao',
    };
  }
  if (variante === 'poco') {
    // O Poço da Coruja Velha: o grupo sobe a encosta pelo caminho antigo, do sul.
    return {
      ...MAPA_POCO,
      objetos: [{ tipo: 'tenda', x: 8, y: 9, olha: { dx: 0, dy: 1 } }],
      grupo: [{ x: 12, y: 20 }, { x: 13, y: 20 }, { x: 12, y: 21 }, { x: 13, y: 21 }],
      olhar: { dx: 0, dy: -1 },
      cena: 'poco',
    };
  }
  if (variante === 'ermo' || variante === 'ermoNoite') {
    // Encontro na Trilha Triboar. De dia o grupo vem andando pela trilha; de
    // noite está em volta da fogueira, e o resto do mapa é breu.
    const noite = variante === 'ermoNoite';
    return {
      terreno: noite ? MAPA_ERMO_NOITE : MAPA_ERMO,
      altura: null,
      objetos: [],
      grupo: noite
        ? [{ x: 10, y: 6 }, { x: 12, y: 6 }, { x: 10, y: 8 }, { x: 12, y: 8 }]
        : [{ x: 9, y: 6 }, { x: 10, y: 7 }, { x: 8, y: 7 }, { x: 11, y: 6 }],
      olhar: { dx: 1, dy: 0 },
      cena: 'ermo',
      ...(noite ? { luz: 'escuro', luzes: [{ pos: { x: 11, y: 7 }, claro: 20, penumbra: 20, tipo: 'fogueira' }] } : {}),
    };
  }
  if (variante === 'mansao' || variante === 'mansaoTunel') {
    // O esconderijo dos Marcarrubra embaixo da Mansão Tresendar. Pela escada
    // da cozinha (área 1, a leste) ou pelo túnel que o Carp achou (área 8, ao
    // sul, saindo do mato).
    const tunel = variante === 'mansaoTunel';
    return {
      ...MAPA_MANSAO,
      // Cada cômodo com a sua tinta no tabuleiro, como no castelo.
      salas: MANSAO.salas,
      // As duas pontes cruzam a fenda de leste a oeste.
      objetos: Object.values(MANSAO.pontes).map((y) => ({ tipo: 'ponte', x: MANSAO.fenda[y][0], y, olha: { dx: 1, dy: 0 }, fundo: 'entulho' })),
      grupo: tunel
        ? [{ x: 10, y: 19 }, { x: 11, y: 19 }, { x: 10, y: 18 }, { x: 11, y: 18 }]
        : [{ x: 28, y: 15 }, { x: 28, y: 14 }, { x: 28, y: 16 }, { x: 29, y: 15 }],
      olhar: tunel ? { dx: 0, dy: -1 } : { dx: -1, dy: 0 },
      cena: 'mansao',
      entrada: tunel ? 'tunel' : 'cozinha',
    };
  }
  if (variante === 'esconderijo') {
    return {
      ...MAPA_ESCONDERIJO,
      // A ponte cruza o canal de norte a sul: o corrimão corre nesse eixo.
      objetos: [{ tipo: 'ponte', x: 20, y: 5, olha: { dx: 0, dy: 1 } }],
      // O grupo chega pela trilha dos goblins, no canto sudoeste do campo.
      grupo: [{ x: 5, y: 24 }, { x: 6, y: 25 }, { x: 4, y: 25 }, { x: 7, y: 25 }],
      olhar: { dx: 1, dy: -1 },
      // A fogueira da caverna do chefe: a única luz lá dentro.
      // As duas fogueiras: a da comida no covil e a de Klarg.
      luzes: [
        { pos: { x: 5, y: 6 }, claro: 10, penumbra: 10, tipo: 'fogueira' },
        { pos: { x: 32, y: 17 }, claro: 10, penumbra: 10, tipo: 'fogueira' },
      ],
      cena: 'esconderijo',
    };
  }
  if (variante === 'caverna') {
    return {
      terreno: MAPA_CAVERNA,
      altura: null,
      grupo: [{ x: 7, y: 13 }, { x: 8, y: 13 }, { x: 6, y: 12 }, { x: 9, y: 12 }],
      olhar: { dx: 0, dy: -1 },
      luz: 'escuro',
      // A fogueira de Droop: brasa baixa, 10 pés de luz e mais 10 de penumbra.
      luzes: [{ pos: { x: 10, y: 1 }, claro: 10, penumbra: 10, tipo: 'fogueira' }],
      cena: 'caverna',
    };
  }
  return { terreno: MAP, altura: null, grupo: PARTY_SPOTS, olhar: { dx: 1, dy: -1 } };
}

/**
 * Inimigos presentes desde o começo.
 *
 * Orçamento pelo DMG, para 4 personagens de 2º nível:
 *   fácil 200 · médio 400 · difícil 600 · mortal 800 (XP ajustado)
 */
/**
 * @param {string} variante  'padrão' é o encontro do jogo. 'grandes' existe
 *   para VER as criaturas que ocupam mais de um quadrado, porque o encontro
 *   padrão não tem nenhuma e trocar a composição dele só para exibir um
 *   recurso estragaria um equilíbrio que foi medido. Chega por `?encontro=`.
 */
export function buildFoes(variante = 'padrao') {
  // Os da estrada e do Poço saem da cena (o sorteio do encontro e o livro).
  if (['ermo', 'ermoNoite', 'poco', 'cume', 'castelo', 'arvoreTrovao'].includes(variante)) return [];
  if (variante === 'grandes') return foesGrandes();
  if (variante === 'emboscada') return foesEmboscada();
  if (variante === 'esconderijo') return foesEsconderijo();
  if (variante === 'mansao' || variante === 'mansaoTunel') return foesMansao();
  if (variante === 'rua') {
    // Quatro bandidos Marcarrubra, na frente da taverna. Eles ficavam em
    // x17-19, a 65-80 pés do grupo, e como só têm espada curta levavam dois
    // turnos para chegar: a briga media 98% de vitória e 13% de PV perdidos,
    // apesar de 800 de XP ajustado ("mortal" no 2º nível). Cinco casas mais a
    // oeste dão contato na segunda rodada. Medido depois, já com o bloco novo
    // (mais fraco que o antigo): a 5 casas a briga ficava em 99% de vitória e
    // 17% de PV; a 6 casas fica em 95,5%, 3,8% de morte de herói e 25% de PV —
    // a abertura do capítulo com dentes, sem virar cara ou coroa (a 7 casas
    // não melhora mais nada: 94% e 26%).
    const foes = [[11, 4], [12, 5], [11, 6], [13, 5]].map(([x, y], i) => {
      const f = makeMonster('marcarrubra', { x, y }, { nameSuffix: 'ABCD'[i] });
      f.facingVec = { dx: -1, dy: 0 };
      return f;
    });
    return foes;
  }
  if (variante === 'caverna') {
    // Os dois guardas, cada um atrás da curva do seu corredor, e Droop.
    const foes = [
      makeMonster('goblin', { x: 4, y: 3 }, { nameSuffix: 'da esquerda' }),
      makeMonster('goblinArqueiro', { x: 14, y: 3 }, { nameSuffix: 'da direita' }),
      makeMonster('droop', { x: 8, y: 1 }),
    ];
    for (const f of foes) f.facingVec = { dx: 0, dy: 1 };
    return foes;
  }
  const foes = [
    makeMonster('goblinChefe', { x: 12, y: 2 }),
    // O goblin fica COLADO no chefe de propósito: Redirecionar Ataque só
    // funciona com um capanga adjacente. Sem ele, a reação do chefe é letra
    // morta e o grupo nunca descobre que ela existe.
    makeMonster('goblin', { x: 12, y: 1 }, { nameSuffix: 'A' }),
    // O hobgoblin vai na frente, no chão: CA 18 faz dele o melhor bloqueador,
    // e é ele que o grupo encontra primeiro ao contornar o paredão.
    makeMonster('hobgoblin', { x: 10, y: 2 }, { nameSuffix: 'A' }),
    makeMonster('lobo', { x: 11, y: 6 }, { nameSuffix: 'cinzento' }),
  ];
  for (const f of foes) f.facingVec = { dx: -1, dy: 1 };
  return foes;
}

/**
 * Reforços: chegam depois, pela borda do mapa.
 *
 * Existem porque, com iniciativa por lado, o grupo que vence a iniciativa
 * despacha metade do inimigo antes de qualquer um deles agir. Um bando que
 * chega na rodada 2 e outro na 4 impedem o combate de ser decidido na abertura
 * e dão forma ao encontro: aguentar, respirar, aguentar de novo.
 */
/**
 * O esconderijo, sala por sala. Cada criatura leva o `grupo` dela: a cena do
 * capítulo 2 só põe um grupo no tabuleiro quando ele é visto ou nota o grupo
 * de heróis, e a luta acaba quando AQUELE grupo cai — o resto continua onde
 * estava, esperando.
 */
function foesEsconderijo() {
  const m = (id, x, y, grupo, sufixo = '', olha = { dx: 0, dy: 1 }) => {
    const f = makeMonster(id, { x, y }, { nameSuffix: sufixo });
    f.grupo = grupo;
    f.facingVec = olha;
    return f;
  };
  // Área 6: Sildar amarrado na parte de cima (sul) do covil, com 1 PV.
  const sildar = makeNpc('sildar', { x: 4, y: 10 }, { side: 'neutro' });
  sildar.hp = 1;
  sildar.grupo = 'covil';
  sildar.refem = true;
  // Yeemik tem 12 PV na aventura.
  const yeemik = m('yeemik', 5, 10, 'covil', '', { dx: 0, dy: -1 });
  yeemik.maxHp = 12;
  yeemik.hp = 12;
  const klargLobo = m('lobo', 33, 20, 'chefe', '', { dx: -1, dy: -1 });
  klargLobo.name = 'Serrote';
  return [
    // Área 2: dois vigias no posto de ripas, no meio do mato.
    m('goblin', 20, 22, 'vigias', 'vigia', { dx: -1, dy: 1 }),
    m('goblin', 22, 23, 'vigias', 'vigia', { dx: -1, dy: 1 }),
    // Área 3: três lobos acorrentados à estalagmite do meio do canil. A
    // corrente não deixa nenhum chegar aos degraus da entrada.
    ...[[21, 11], [24, 13], [22, 13]].map(([x, y]) => Object.assign(
      m('lobo', x, y, 'canil', 'do canil', { dx: -1, dy: 0 }),
      { corrente: { x: 23, y: 12, raioFt: 10 } })),
    // Área 5: um goblin escondido na ponte, vigiando o riacho lá embaixo.
    m('goblin', 21, 5, 'ponte', 'da ponte', { dx: 0, dy: 1 }),
    // Área 6: quatro goblins junto ao fogo, na parte de baixo; Yeemik em cima.
    // Eram cinco, e com o bloco de ND 1 do Yeemik isso dava 900 de XP
    // ajustado — "mortal" para quatro de 2º nível, com 18% de derrota medida
    // mesmo com o grupo inteiro e descansado. Com quatro: 95,5% de vitória.
    m('goblin', 4, 6, 'covil', 'do covil', { dx: 1, dy: 0 }),
    m('goblin', 6, 5, 'covil', 'do covil', { dx: -1, dy: 1 }),
    m('goblin', 6, 7, 'covil', 'do covil', { dx: -1, dy: -1 }),
    m('goblin', 7, 6, 'covil', 'do covil', { dx: -1, dy: 0 }),
    yeemik,
    sildar,
    // Área 7: três goblins guardam os poços.
    m('goblin', 29, 8, 'pocos', 'dos poços', { dx: -1, dy: 0 }),
    m('goblinArqueiro', 34, 9, 'pocos', 'dos poços', { dx: -1, dy: 0 }),
    m('goblin', 36, 8, 'pocos', 'dos poços', { dx: -1, dy: 0 }),
    // Área 8: Klarg, o lobo Serrote e dois goblins.
    // Klarg fica ATRÁS da estalagmite de (30,18), como a cena narra: de
    // (32,19) a cobertura medida era 0 de três das quatro casas da porta; de
    // (30,19) é 2 de todas, e ele some da linha de visão de (30,13) e (30,14).
    m('klarg', 30, 19, 'chefe', '', { dx: 1, dy: -1 }),
    klargLobo,
    m('goblin', 29, 17, 'chefe', 'de Klarg', { dx: 0, dy: -1 }),
    m('goblin', 35, 22, 'chefe', 'de Klarg', { dx: -1, dy: -1 }),
  ];
}

/**
 * O esconderijo dos Marcarrubra, sala a sala (Parte 2 da aventura). Cada
 * grupo só entra no tabuleiro quando a cena o chama (`capitulo3-mansao.js`).
 */
function foesMansao() {
  const m = (id, x, y, grupo, sufixo = '', olha = { dx: 0, dy: 1 }) => {
    const f = makeMonster(id, { x, y }, { nameSuffix: sufixo });
    f.grupo = grupo;
    f.facingVec = olha;
    return f;
  };
  // `look`: cada um dos Dendrar tem o PROPRIO desenho (o bloco e o do plebeu).
  const neutro = (f, nome, look = null) => Object.assign(f, { side: 'neutro', name: nome, ...(look ? { look } : {}) });
  // Área 5: a família Dendrar presa nas jaulas.
  const presos = [
    neutro(m('plebeu', 22, 2, 'jaulas'), 'Nars Dendrar', 'nars'),
    neutro(m('plebeu', 21, 7, 'jaulas'), 'Mirna Dendrar', 'mirna'),
    neutro(m('plebeu', 23, 7, 'jaulas'), 'Nilsa Dendrar', 'nilsa'),
  ];
  // `refem`: a 0 PV cai desacordado em vez de morrer (ver `applyDamage`). Sem
  // isso, um plebeu de 4 PV dentro da jaula morria do Mãos Flamejantes do
  // próprio grupo — medido, a família morria em 4 das 14 posições de onde um
  // mago pegaria os dois guardas, e o Sono adormecia um deles em 100 de 100.
  for (const p of presos) { p.preso = true; p.refem = true; p.attacks = []; }
  // Área 9: Mosk, o chefe dos bugbears, com o tapa-olho e a chave.
  const mosk = m('bugbear', 4, 17, 'guardas', '', { dx: 0, dy: -1 });
  mosk.name = 'Mosk';
  mosk.chave = true;
  const droop = neutro(m('droop', 4, 15, 'guardas', '', { dx: 0, dy: 1 }), 'Droop');
  // O Droop desmaia de medo quando a luta começa, e inconsciente ele falha
  // sozinho em toda resistência de Destreza: sem `refem`, um Mãos Flamejantes
  // mirado no Mosk o matava em 182 de 200 lances.
  droop.refem = true;
  // Área 12: o Cajavidro na escrivaninha, de costas para a passagem secreta;
  // o rato dele vigia a oficina (11). Ninguém sabe o nome dele até ele falar.
  const iarno = makeNpc('iarno', { x: 9, y: 2 }, {});
  iarno.grupo = 'cajavidro';
  iarno.name = 'Cajavidro';
  iarno.facingVec = { dx: -1, dy: 1 };
  iarno.chave = true;
  const rato = neutro(m('ratoGigante', 4, 4, 'rato', '', { dx: 1, dy: 0 }), 'Rato do mago');
  Object.assign(rato, { maxHp: 1, hp: 1, ac: 10, attacks: [], familiar: true });
  // Área 10: quatro Marcarrubra bêbados no jogo de pedrinhas.
  const estar = [[3, 9, 0, -1], [4, 9, 0, -1], [5, 8, -1, 0], [2, 8, 1, 0]]
    .map(([x, y, dx, dy], i) => m('marcarrubra', x, y, 'estar', 'da mesa ' + 'ABCD'[i], { dx, dy }));
  return [
    // Área 2: três Marcarrubra de folga no alojamento.
    m('marcarrubra', 17, 13, 'alojamento', 'do beliche', { dx: 1, dy: 0 }),
    m('marcarrubra', 17, 14, 'alojamento', 'do beliche', { dx: 1, dy: 0 }),
    m('marcarrubra', 18, 13, 'alojamento', 'do beliche', { dx: 1, dy: 0 }),
    // Área 4: três esqueletos diante dos sarcófagos.
    m('esqueleto', 17, 6, 'cripta', 'da cripta', { dx: 1, dy: 0 }),
    m('esqueleto', 17, 9, 'cripta', 'da cripta', { dx: 1, dy: 0 }),
    m('esqueleto', 18, 7, 'cripta', 'da cripta', { dx: -1, dy: 0 }),
    // Área 5: dois Marcarrubra de guarda nas jaulas.
    m('marcarrubra', 21, 4, 'jaulas', 'das jaulas', { dx: -1, dy: 0 }),
    m('marcarrubra', 22, 5, 'jaulas', 'das jaulas', { dx: -1, dy: 0 }),
    ...presos,
    // Área 8: o vigia de um olho só, encolhido junto da coluna do oeste.
    m('vigiaCiclopico', 9, 12, 'fenda', '', { dx: 1, dy: 0 }),
    // Área 9: três bugbears e o goblin Droop. O terceiro bugbear dorme no
    // beliche e só levanta na segunda rodada: os três de pé ao mesmo tempo
    // matavam um herói de nível 2 em uma luta de cada quatro (revisor de
    // encontro, 300 lutas); com um dormindo, em menos de uma em dez.
    mosk,
    m('bugbear', 3, 16, 'guardas', 'da porta', { dx: 0, dy: -1 }),
    Object.assign(m('bugbear', 6, 18, 'guardas', 'do beliche', { dx: -1, dy: -1 }), { dormindo: true }),
    droop,
    ...estar,
    iarno,
    // Dois guarda-costas no quarto. Sozinho, o chefe do capítulo media 100% de
    // vitória com 0 a 2,6% de PV perdidos, e morria antes de agir em 40 a 63%
    // das lutas: 200 de XP ajustado, "abaixo de fácil" no 3º nível. Com estes
    // dois são 800 ajustados ("médio") e 9 a 19% de PV perdidos.
    m('marcarrubra', 7, 3, 'cajavidro', 'de guarda', { dx: 0, dy: -1 }),
    m('marcarrubra', 8, 3, 'cajavidro', 'de guarda', { dx: 0, dy: -1 }),
    rato,
  ];
}

/** Vitrine de tamanho: Médio, Grande e Grande de novo, lado a lado. */
function foesGrandes() {
  const foes = [
    makeMonster('goblin', { x: 12, y: 1 }, { nameSuffix: 'A' }),
    makeMonster('ogro', { x: 10, y: 2 }),
    makeMonster('loboAtroz', { x: 11, y: 6 }, { nameSuffix: 'da matilha' }),
    makeMonster('aranhaGigante', { x: 13, y: 3 }),
    makeMonster('gelatinaOcre', { x: 13, y: 8 }),
    makeMonster('espectro', { x: 9, y: 9 }),
    makeMonster('wraith', { x: 7, y: 9 }),
    makeMonster('caveiraCandente', { x: 5, y: 9 }),
    makeMonster('spectator', { x: 12, y: 10 }),
    makeMonster('galhoInfectado', { x: 3, y: 2 }),
    makeMonster('espetoInfectado', { x: 5, y: 2 }),
    makeMonster('vinhaInfectada', { x: 7, y: 2 }),
    makeMonster('dragaoVerdeJovem', { x: 10, y: 6 }),
    makeMonster('acolito', { x: 3, y: 5 }),
    makeMonster('sacerdote', { x: 6, y: 7 }),
  ];
  for (const f of foes) f.facingVec = { dx: -1, dy: 1 };
  return foes;
}

/**
 * Quatro goblins no alto dos barrancos, dois de cada lado, entre a carroça e
 * os cavalos mortos — é ali que o grupo fica entre os dois fogos.
 *
 * AS POSIÇÕES VIERAM DE MIL COMBATES SIMULADOS (revisor de encontro). As
 * primeiras deixavam B e D a 90–100 pés, em alcance longo com desvantagem, e B
 * nem enxergava a guerreira. Agora os quatro estão no nível 1, com visão dos
 * quatro personagens e em alcance curto do arco (35 a 75 pés).
 *
 * A–B e C–D ficam a 4 casas um do outro de propósito: um Sono (esfera de 20
 * pés) pega dois goblins, e essa é a jogada boa do mago no primeiro turno.
 *
 * ORÇAMENTO DO DMG para 4 personagens de 2º nível: 4 goblins são 200 XP
 * crus, 400 ajustados (x2, médio); com os 2 lobos da rodada 2, 300 crus e 600
 * ajustados — difícil.
 *
 * MEDIDO com o motor real, surpresa incluída, 1.000 combates: 100% de
 * vitória em 4,8 rodadas, 77% dos PV sobrando, alguém vai ao chão em 60% dos
 * combates, duas quedas ou mais em 31%, nenhuma morte. Sem a surpresa: 53% e
 * 24%. A surpresa pesa pouco porque, pela regra, basta notar UM goblin para
 * não ser surpreendido — com quatro escondidos, o mais desajeitado entrega o
 * resto (ver `rolarSurpresa`).
 */
/**
 * OS QUATRO GOBLINS DA EMBOSCADA, dois de cada lado da trilha.
 *
 * ORÇAMENTO, medido: 4 goblins valem 200 XP, que com o multiplicador de
 * quatro inimigos dão 400 ajustados. Para quatro personagens de 1º NÍVEL o
 * limiar de mortal do DMG é exatamente 400 — ou seja, este é o combate mais
 * duro que a tabela permite, de propósito, porque é uma emboscada e o livro
 * a escreve assim. Simulado com o motor: o grupo ganha em 88% quando é
 * surpreendido e em 98% quando não é, e morre alguém em 6 a 8% das vezes.
 */
function foesEmboscada() {
  const norte = [
    makeMonster('goblin', { x: 12, y: 7 }, { nameSuffix: 'A' }),
    // Colado nos arbustos da boca da trilha.
    makeMonster('goblin', { x: 16, y: 7 }, { nameSuffix: 'B' }),
  ];
  const sul = [
    makeMonster('goblin', { x: 14, y: 17 }, { nameSuffix: 'C' }),
    // Na borda do barranco sul, ao lado do arbusto em (17,16).
    makeMonster('goblin', { x: 18, y: 16 }, { nameSuffix: 'D' }),
  ];
  // Cada lado olha para a estrada.
  for (const f of norte) f.facingVec = { dx: 0, dy: 1 };
  for (const f of sul) f.facingVec = { dx: 0, dy: -1 };
  return [...norte, ...sul];
}

export const REINFORCEMENTS = [
  {
    round: 3,
    aviso: 'Mais goblins vêm pela trilha!',
    spawn: [
      { id: 'goblin', at: { x: 14, y: 8 }, nameSuffix: 'C' },
      { id: 'goblin', at: { x: 14, y: 9 }, nameSuffix: 'D' },
    ],
  },
];

/**
 * Na emboscada os reforços descem pela trilha do norte — e são LOBOS.
 *
 * Dois goblins a mais repetiam o que já está em cena: mais dois arqueiros.
 * Dois lobos (SRD, ND 1/4, 50 XP cada: o mesmo orçamento) correm 40 pés pela
 * trilha, derrubam com a mordida e prendem o grupo na estrada enquanto os
 * arqueiros atiram. Medido: com lobos, duas quedas ou mais em 44% dos
 * combates; com goblins, 27%.
 *
 * RODADA 2, E NA BOCA DA TRILHA. Na rodada 3, em (19,4), eles nasciam num
 * corredor sem visão de ninguém, chegavam com o combate decidido (1,2 goblin
 * vivo, em média) e em 6% das simulações a IA travava ali.
 */
const REFORCOS_EMBOSCADA = [
  {
    round: 2,
    aviso: 'Lobos descem pela trilha!',
    olhar: { dx: 0, dy: 1 },
    spawn: [
      { id: 'lobo', at: { x: 19, y: 6 }, nameSuffix: 'da trilha' },
      { id: 'lobo', at: { x: 20, y: 6 }, nameSuffix: 'do mato' },
    ],
  },
];

/** Monta os reforços de uma rodada, ou null se não houver. */
export function reinforcementsFor(round, variante = 'padrao') {
  if (['caverna', 'esconderijo', 'rua', 'mansao', 'mansaoTunel', 'ermo', 'ermoNoite', 'poco', 'cume', 'castelo', 'arvoreTrovao'].includes(variante)) return null;
  const ondas = variante === 'emboscada' ? REFORCOS_EMBOSCADA : REINFORCEMENTS;
  const wave = ondas.find((w) => w.round === round);
  if (!wave) return null;
  const units = wave.spawn.map((s) => {
    const m = makeMonster(s.id, s.at, { nameSuffix: s.nameSuffix });
    m.facingVec = { ...(wave.olhar ?? { dx: -1, dy: 1 }) };
    return m;
  });
  return { aviso: wave.aviso, units };
}
