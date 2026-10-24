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
// terra entre casas (provisórias: blocos de parede até a arte), barris e uma
// carroça. A taverna Gigante Adormecido é o bloco grande do sudeste.
export const MAPA_RUA = [
  'TT,,,####,,,,####,,,TT',
  'T,,,,####,,,,####,,,,T',
  ',,,,,####,,o,####,,,,,',
  ',,,,,,,,,,,,,,,,,,,,,,',
  '::::::::::::::::::::::',
  '::::::::::::::::::::::',
  '::::::::::::::::::::::',
  ',,,,,,,,,,,,,,,,o,,,,,',
  ',,,####,,,,,,,,######,',
  ',,,####,,b,,,,,######,',
  ',,,####,,,,,,,,######,',
  ',,,,,,,,,,,r,,,,,,,,,,',
  'TT,,,,,,,,,,,,,,,,,,TT',
  'TTTTTTTT,,,,,,TTTTTTTT',
];

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
      objetos: [],
      // O grupo vem pela rua, do oeste; os Marcarrubra esperam a leste, na
      // frente do Gigante Adormecido.
      grupo: [{ x: 3, y: 4 }, { x: 3, y: 6 }, { x: 2, y: 5 }, { x: 4, y: 5 }],
      olhar: { dx: 1, dy: 0 },
      cena: 'rua',
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
  if (variante === 'grandes') return foesGrandes();
  if (variante === 'emboscada') return foesEmboscada();
  if (variante === 'esconderijo') return foesEsconderijo();
  if (variante === 'rua') {
    // Quatro bandidos Marcarrubra (a aventura), na frente da taverna.
    const foes = [[17, 4], [18, 5], [17, 6], [19, 5]].map(([x, y], i) => {
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
    // Área 6: cinco goblins junto ao fogo, na parte de baixo; Yeemik em cima.
    m('goblin', 4, 6, 'covil', 'do covil', { dx: 1, dy: 0 }),
    m('goblin', 6, 5, 'covil', 'do covil', { dx: -1, dy: 1 }),
    m('goblin', 6, 7, 'covil', 'do covil', { dx: -1, dy: -1 }),
    m('goblin', 3, 6, 'covil', 'do covil', { dx: 1, dy: 0 }),
    m('goblin', 7, 6, 'covil', 'do covil', { dx: -1, dy: 0 }),
    yeemik,
    sildar,
    // Área 7: três goblins guardam os poços.
    m('goblin', 29, 8, 'pocos', 'dos poços', { dx: -1, dy: 0 }),
    m('goblinArqueiro', 34, 9, 'pocos', 'dos poços', { dx: -1, dy: 0 }),
    m('goblin', 36, 8, 'pocos', 'dos poços', { dx: -1, dy: 0 }),
    // Área 8: Klarg, o lobo Serrote e dois goblins.
    m('klarg', 32, 19, 'chefe', '', { dx: -1, dy: -1 }),
    klargLobo,
    m('goblin', 29, 17, 'chefe', 'de Klarg', { dx: 0, dy: -1 }),
    m('goblin', 35, 22, 'chefe', 'de Klarg', { dx: -1, dy: -1 }),
  ];
}

/** Vitrine de tamanho: Médio, Grande e Grande de novo, lado a lado. */
function foesGrandes() {
  const foes = [
    makeMonster('goblin', { x: 12, y: 1 }, { nameSuffix: 'A' }),
    makeMonster('ogro', { x: 10, y: 2 }),
    makeMonster('loboAtroz', { x: 11, y: 6 }, { nameSuffix: 'da matilha' }),
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
  if (variante === 'caverna' || variante === 'esconderijo' || variante === 'rua') return null;
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
