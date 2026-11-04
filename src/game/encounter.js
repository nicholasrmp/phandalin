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
import { MAPA_CASA_DA_MORTE_1, MAPA_CASA_DA_MORTE_2, MAPA_CASA_DA_MORTE_3, MAPA_CASA_DA_MORTE_4, MAPA_CASA_DA_MORTE_PORAO_1, MAPA_CASA_DA_MORTE_PORAO_2 } from './casadamorte.js';
import { foesDaCasa } from './casadamorte-criaturas.js';
import { ler as lerMapaDoEditor, novoMapa as mapaVazioDoEditor } from './mapa-editor.js';
import { MAPA_POCO } from './poco.js';
import { MAPA_CUME } from './cume.js';
import { MAPA_CASTELO, CASTELO } from './castelo.js';
import { MAPA_ARVORE_TROVAO, ARVORE_TROVAO } from './arvoretrovao.js';
import { MAPA_ONDA_ECO, ONDA_ECO } from './ondaeco.js';

// '.' chão · '#' parede · '~' terreno difícil · 'o' cobertura · '1'..'9' elevação
//
// A ARENA DO SIMULADOR. NÃO é uma cena do jogo: não está no menu, não está na lista do editor e a conferência
// de parede e porta não passa por ela. É a bancada onde `src/dev/balance.js` mede equilíbrio desde o começo do
// projeto — todos os números de encontro citados nos comentários daqui saíram dela — e onde a vitrine de
// tamanhos (`grandes`) põe as criaturas Grandes e Enormes para serem vistas.
//
// Ela saiu do jogo porque é um mapa DESENHADO EM CÓDIGO, e os mapas do jogo agora são pintados. Ficou como
// gabarito de medição, que é o que sempre foi de fato: trocá-la invalidaria a série de medidas inteira.
//
// O paredão central (x7–9, y4–6) existe porque, sem ele, os dois lados se veem do primeiro quadrado e o combate
// vira troca de tiros de 24 m. O platô do canto nordeste (altura 1) é onde os goblins se posicionam: subir custa
// o dobro, quem está em cima tem cobertura e o platô corta a visão de quem tenta contornar.
export const MAPA_ARENA = [
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
export const PARTIDA_ARENA = [
  { x: 3, y: 9 }, { x: 2, y: 10 }, { x: 2, y: 9 }, { x: 1, y: 10 },
];

// A EMBOSCADA NA ESTRADA.
//
// A Trilha Triboar cortando a mata: uma faixa de terra batida de leste a oeste, moita fechada nas duas beiras e
// floresta além dela. Uma carroça de mercador tombada tapa o caminho na ponta oeste; dois cavalos de tiro mortos,
// ainda na arreata, estão caídos na estrada a leste. Os goblins esperam na moita dos dois lados.
//
// O MAPA É UM DESENHO, e não um rascunho de caracteres: `public/mapas/emboscada.webp`, gerado por nós no OpenArt,
// 1760x1360 = 22 por 17 casas de 80 px. O terreno abaixo SAI DELE, por cor
// (`python src/dev/mapa-emboscada.py` remede e reimprime), então os dois não divergem: o que a regra chama de
// bloqueio é o que o jogador vê pintado.
//
// A CARROÇA BARRA A TRILHA de verdade: na coluna 4 ela vai de beira a beira, e quem quiser passar sai pela moita.
// Isso não foi escolhido, é o que o desenho mostra — e por isso o grupo começa a LESTE dela, entre o destroço e
// os cavalos.
export const MAPA_EMBOSCADA = {
  //   `:` estrada            `%` espinheiro (terreno difícil, a moita do livro, de onde os goblins saltam)
  //   `T` mata fechada       `C` carroça e destroço, `h` cavalo morto (cobertura, e não se atravessa)
  terreno: [
    'TTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTT',
    'TTT%TT%TTTTTTTTTTTTTTT',
    '%%%%%%%%%%%%%%%%%%%%%%',
    '%%%C%%C%%%%%%%%%%%%%%%',
    ':::CCCC:::::::::::hh::',
    '::::C:::::::::::::hhh:',
    '::::CC::::::::::::hhh:',
    '%%CCCC::::::::::%%%%%%',
    '%%%CCC%%%%%%%%%%%%%%%%',
    'TT%%%%%%%%%%%%%%TTTTTT',
    'TTT%%%TTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTT',
  ],
  // A trilha é plana: o desenho não tem barranco, e inventar um desnível que a imagem não mostra seria mentir
  // para quem olha o mapa.
  altura: null,
  // A carroça e os cavalos JÁ ESTÃO PINTADOS no mapa; pôr o sprite por cima seria desenhá-los duas vezes.
  // Eles continuam valendo como regra: `C` e `h` são cobertura (+2 de CA) e não se atravessa.
  objetos: [],
};
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

// O ERMO (Parte 3): a Trilha de Triboar entre colinas, para os encontros do
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

/**
 * O grupo vem pela trilha olhando para leste, JÁ DEPOIS da carroça tombada: ela tapa a estrada inteira na coluna
 * 4, então começar a oeste dela seria começar preso. Os cavalos mortos ficam oito casas à frente — é o que o
 * grupo enxerga na estrada quando os goblins atiram da moita.
 */
export const PARTY_SPOTS_EMBOSCADA = [
  { x: 11, y: 9 }, { x: 10, y: 9 }, { x: 11, y: 8 }, { x: 10, y: 10 },
];

/**
 * O mapa, as posições do grupo e para onde ele olha, por variante.
 *
 * Mapa e posições andam juntos: uma posição boa num mapa cai dentro de uma
 * árvore no outro.
 */
export function mapaDo(variante) {
  if (variante === 'emboscada') {
    return {
      terreno: MAPA_EMBOSCADA.terreno,
      altura: MAPA_EMBOSCADA.altura,
      objetos: MAPA_EMBOSCADA.objetos,
      grupo: PARTY_SPOTS_EMBOSCADA,
      olhar: { dx: 1, dy: 0 },
      // O mapa PINTADO por baixo. É NOSSO (gerado no OpenArt), entra no repositório e o Vite o serve de
      // `public/`. Já vem cortado na grade: 80 px por casa, e o canto da casa (0,0) é o canto da imagem.
      fundo: { nome: 'emboscada.webp', url: '/mapas/emboscada.webp', escala: 80, x0: 0, y0: 0, giro: 0, opacidade: 1 },
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
      folhas: CASTELO.folhas,
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
      grupo: [{ x: 25, y: 18 }, { x: 26, y: 18 }, { x: 25, y: 19 }, { x: 27, y: 18 }],       // (26,19) é uma moita
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
      folhas: ARVORE_TROVAO.folhas,
      fachadaFechada: true,
      veuDaEscuridao: 1,
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
  if (variante === 'ondaEco') {
    // A Caverna Onda Eco (Parte 4): o grupo desce pela entrada do sudoeste, no escuro.
    return {
      ...MAPA_ONDA_ECO,
      salas: ONDA_ECO.salas,
      // O piso de dentro das salas de pedra (a laje lavrada da mina) e o breu: o que o grupo não vê fica PRETO.
      pisos: Object.fromEntries(Object.keys(ONDA_ECO.salas).map((k) => [k, 'lajeMina'])),
      veuDaEscuridao: 1,
      paredeDeCaverna: true,
      degraus: ONDA_ECO.degraus,
      folhas: ONDA_ECO.folhas,
      objetos: ONDA_ECO.props.map((p) => ({ ...p })),
      grupo: ONDA_ECO.grupo.map((p) => ({ ...p })),
      olhar: { dx: 1, dy: -1 },
      // SEM mapa pintado, e isto foi MEDIDO, não esquecido. A nossa planta é um decalque exato do mapa oficial
      // do Roll20, em DOBRO: duas casas nossas por quadrado pintado (`src/dev/encaixar-roll20.py` acha escala
      // 0,50 cravada, uma casa de desvio, 60% de chão em comum, e a prova visual encaixa parede por parede).
      // O que reprova é a resolução: a maior imagem que o CDN entrega tem 1515 px para 37 quadrados, e como
      // uma casa nossa vale meio quadrado, o tabuleiro teria de ampliar 3x — a rocha vira borrão marrom, pior
      // que o ladrilho que já temos. Se um dia aparecer uma imagem maior, é só ligar:
      //   fundo: { nome: '6-wave-echo-cave.jpg', url: '<a imagem>', escala: 20.473, x0: 0.6, y0: 40.4, giro: 0, opacidade: 1 },
      cena: 'ondaEco',
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
    // Encontro na Trilha de Triboar. De dia o grupo vem andando pela trilha; de
    // noite está em volta da fogueira, e o resto do mapa é breu.
    const noite = variante === 'ermoNoite';
    return {
      terreno: noite ? MAPA_ERMO_NOITE : MAPA_ERMO,
      altura: null,
      objetos: [],
      grupo: noite
        ? [{ x: 10, y: 7 }, { x: 12, y: 7 }, { x: 9, y: 6 }, { x: 13, y: 8 }]      // fora da diagonal da fogueira (11,7): nenhum herói a esconde
        : [{ x: 9, y: 6 }, { x: 10, y: 7 }, { x: 8, y: 7 }, { x: 11, y: 6 }],
      olhar: { dx: 1, dy: 0 },
      cena: 'ermo',
      ...(noite ? { luz: 'escuro', luzes: [{ pos: { x: 11, y: 7 }, claro: 20, penumbra: 20, tipo: 'fogueira' }] } : {}),
    };
  }
  if (variante === 'editor') {
    // O que se montou em /editor.html. Só a cena 'editor' (exploração livre) vale: um JSON importado não escolhe cena de aventura.
    const m = lerMapaDoEditor() ?? mapaVazioDoEditor();
    const { cena, ...resto } = m;
    return cena === 'editor' ? { ...resto, cena } : resto;
  }
  if (variante === 'casaDaMorte1') return MAPA_CASA_DA_MORTE_1;
  if (variante === 'casaDaMorte2') return MAPA_CASA_DA_MORTE_2;
  if (variante === 'casaDaMorte3') return MAPA_CASA_DA_MORTE_3;
  if (variante === 'casaDaMorte4') return MAPA_CASA_DA_MORTE_4;
  if (variante === 'casaDaMortePorao1') return MAPA_CASA_DA_MORTE_PORAO_1;
  if (variante === 'casaDaMortePorao2') return MAPA_CASA_DA_MORTE_PORAO_2;
  if (variante === 'mansao' || variante === 'mansaoTunel') {
    // O esconderijo dos Marcarrubra embaixo da Mansão Tresendar. Pela escada
    // da cozinha (área 1, a leste) ou pelo túnel que o Carp achou (área 8, ao
    // sul, saindo do mato).
    const tunel = variante === 'mansaoTunel';
    return {
      ...MAPA_MANSAO,
      // Cada cômodo com a sua tinta no tabuleiro, como no castelo; a parede fina (de borda) do cômodo onde o grupo está se dissolve.
      salas: MANSAO.salas,
      paredeDeCaverna: true,      // a pedra em volta é parede de caverna (3 níveis), e não um degrau
      cliqueNoObjeto: true,       // o botão direito no corpo de um objeto (barril, baú, estante) acha o objeto, e não a casa de trás
      rochaEmCorte: true,         // ... exceto a que fica na frente de uma sala: essa fica baixa, para se ver dentro
      decor: MANSAO.decor,        // candeeiros nas arestas das paredes de trás
      folhas: MANSAO.folhas,      // as portas que têm folha de madeira
      grades: MANSAO.grades,      // as arestas de barra que são grade de ferro (as celas)
      // As duas pontes cruzam a fenda de leste a oeste.
      objetos: [
        ...Object.values(MANSAO.pontes).map((y) => ({ tipo: 'ponte', x: MANSAO.fenda[y][0], y, olha: { dx: 1, dy: 0 }, fundo: 'entulho' })),
        ...MANSAO.props,           // a mobília de arte própria (estantes, bancada, cabides...), por casa
      ],
      degraus: MANSAO.degraus,     // as casas de escada
      grupo: tunel
        ? [{ x: 10, y: 19 }, { x: 10, y: 18 }, { x: 10, y: 17 }, { x: 10, y: 16 }]
        : [{ x: 29, y: 14 }, { x: 28, y: 14 }, { x: 27, y: 14 }, { x: 27, y: 15 }],
      olhar: tunel ? { dx: 0, dy: -1 } : { dx: -1, dy: 0 },
      // O MAPA OFICIAL por baixo. A nossa planta é um decalque dele: medido em `src/dev/encaixar-roll20.py`,
      // escala 1 para 1 e uma casa de desvio para baixo, com 83% das paredes dele caindo em cima das nossas.
      // A imagem é do CDN do Roll20, de onde a página da campanha a serve — nada é copiado para o repositório
      // (ver NOTICE.md). `escala` não é 70: a página trava a casa em 70 px, mas o CDN entrega a imagem com 2048
      // px no lado maior e a página a estica de volta, o que dá 68,267 px por casa na imagem de verdade.
      fundo: { nome: '4-redbrand-hideout.jpg', url: 'https://files.d20.io/images/34717495/tqvoxEujIj6h0ekkD7h1Wg/max.jpg?1497810681', escala: 68.267, x0: 0, y0: 68.267, giro: 0, opacidade: 1 },
      cena: 'mansao',
      entrada: tunel ? 'tunel' : 'cozinha',
    };
  }
  if (variante === 'esconderijo') {
    return {
      ...MAPA_ESCONDERIJO,
      paredeDeCaverna: true,          // a rocha junto do chão é parede de verdade (3 níveis), e não um degrau de 22 px
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
  // A vitrine de tamanhos e o simulador, os dois na arena. Explícito: antes qualquer variante desconhecida caía
  // aqui por descuido, e `mapaDo('cachorro')` devolvia um mapa como se nada fosse.
  if (variante === 'grandes' || variante === 'arena') {
    return { terreno: MAPA_ARENA, altura: null, grupo: PARTIDA_ARENA, olhar: { dx: 1, dy: -1 } };
  }
  throw new Error(`mapaDo: não existe a cena "${variante}"`);
}

/**
 * Inimigos presentes desde o começo.
 *
 * Orçamento pelo DMG, para 4 personagens de 2º nível:
 *   fácil 200 · médio 400 · difícil 600 · mortal 800 (XP ajustado)
 */
/**
 * @param {string} variante  a cena. 'arena' é a bancada do simulador (`MAPA_ARENA`), com o bando que o
 *   `balance.js` mede desde sempre; 'grandes' é a mesma arena com as criaturas que ocupam mais de um quadrado,
 *   para VER pegada e alcance — trocar a composição da arena só para exibir isso estragaria a série de medidas.
 */
export function buildFoes(variante = 'arena') {
  // Os da estrada e do Poço saem da cena (o sorteio do encontro e o livro).
  if (['ermo', 'ermoNoite', 'poco', 'cume', 'castelo', 'arvoreTrovao', 'ondaEco', 'editor'].includes(variante)) return [];
  if (variante.startsWith('casaDaMorte')) return foesDaCasa(variante);
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
  if (variante !== 'arena') throw new Error(`buildFoes: não existe a cena "${variante}"`);
  // O BANDO DA ARENA, que o `balance.js` mede desde o começo do projeto. Mexer aqui invalida a série inteira.
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
  const m = (id, x, y, grupo, sufixo = '', olha = { dx: 0, dy: 1 }, opcoes = {}) => {
    const f = makeMonster(id, { x, y }, { nameSuffix: sufixo, ...opcoes });
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
    m('goblin', 20, 22, 'vigias', 'vigia', { dx: -1, dy: 1 }, { arma: 'Arco curto' }),
    m('goblin', 22, 23, 'vigias', 'vigia', { dx: -1, dy: 1 }, { arma: 'Arco curto' }),
    // Área 3: três lobos acorrentados à estalagmite do meio do canil. A
    // corrente não deixa nenhum chegar aos degraus da entrada.
    ...[[21, 11], [24, 13], [22, 13]].map(([x, y]) => Object.assign(
      m('lobo', x, y, 'canil', 'do canil', { dx: -1, dy: 0 }),
      { corrente: { x: 23, y: 12, raioFt: 10 } })),
    // Área 5: um goblin escondido na ponte, vigiando o riacho lá embaixo.
    m('goblin', 21, 5, 'ponte', 'da ponte', { dx: 0, dy: 1 }, { arma: 'Arco curto' }),
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
    m('goblin', 34, 9, 'pocos', 'dos poços', { dx: -1, dy: 0 }, { tatica: 'atirador', arma: 'Arco curto' }),
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
    neutro(m('plebeu', 22, 7, 'jaulas'), 'Nilsa Dendrar', 'nilsa'),
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
  const iarno = makeNpc('iarno', { x: 8, y: 2 }, {});
  iarno.grupo = 'cajavidro';
  iarno.name = 'Cajavidro';
  iarno.facingVec = { dx: -1, dy: 0 };
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
    m('marcarrubra', 17, 12, 'alojamento', 'do beliche', { dx: 1, dy: 0 }),
    // Área 4: três esqueletos diante dos sarcófagos.
    m('esqueleto', 17, 6, 'cripta', 'da cripta', { dx: 1, dy: 0 }),
    m('esqueleto', 17, 9, 'cripta', 'da cripta', { dx: 1, dy: 0 }),
    m('esqueleto', 18, 7, 'cripta', 'da cripta', { dx: -1, dy: 0 }),
    // Área 5: dois Marcarrubra de guarda nas jaulas.
    m('marcarrubra', 21, 4, 'jaulas', 'das jaulas', { dx: -1, dy: 0 }),
    m('marcarrubra', 21, 5, 'jaulas', 'das jaulas', { dx: -1, dy: 0 }),
    ...presos,
    // Área 8: o vigia de um olho só, encolhido junto da coluna do oeste.
    m('vigiaCiclopico', 9, 12, 'fenda', '', { dx: 1, dy: 0 }),
    // Área 9: três bugbears e o goblin Droop. O terceiro bugbear dorme no
    // beliche e só levanta na quarta rodada: os três de pé ao mesmo tempo
    // matavam um herói de nível 2 em uma luta de cada quatro (revisor de
    // encontro, 300 lutas); com um dormindo, em menos de uma em dez.
    mosk,
    m('bugbear', 3, 16, 'guardas', 'da porta', { dx: 0, dy: -1 }),
    Object.assign(m('bugbear', 5, 17, 'guardas', 'do beliche', { dx: -1, dy: -1 }), { dormindo: true }),
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
    makeMonster('vinhaInfectada', { x: 8, y: 2 }),
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
  // Os três esperam de arco na mão, agachados na moita. A e C são atiradores
  // declarados; B a IA também deixa atirando. Eram quatro (o livro): de 1º nível, quatro goblins
  // são o limiar MORTAL do DMG (200 XP, ×2) e a emboscada derrotava o grupo em 9,9% das lutas medidas (496 lutas, 4 heróis de
  // 1º nível); com três, em 2,8%. Esses dois números foram medidos no mapa anterior; os do mapa de hoje estão em
  // `REFORCOS_EMBOSCADA`, e saem de `node src/dev/simular-emboscada.mjs`.
  const arco = { arma: 'Arco curto' };
  // Na moita (`%`), dos dois lados da estrada e entre o grupo e os cavalos mortos: é onde o livro os põe.
  const norte = [
    makeMonster('goblin', { x: 15, y: 6 }, { nameSuffix: 'A', tatica: 'atirador', ...arco }),
    makeMonster('goblin', { x: 18, y: 6 }, { nameSuffix: 'B', ...arco }),
  ];
  const sul = [
    makeMonster('goblin', { x: 16, y: 11 }, { nameSuffix: 'C', tatica: 'atirador', ...arco }),
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
 * Na emboscada os reforços saem da moita do sul — e são LOBOS.
 *
 * Dois goblins a mais repetiam o que já está em cena: mais dois arqueiros.
 * Dois lobos (SRD, ND 1/4, 50 XP cada: o mesmo orçamento) correm 40 pés,
 * derrubam com a mordida e prendem o grupo na estrada enquanto os arqueiros
 * atiram. Medido: com lobos, duas quedas ou mais em 44% dos combates; com
 * goblins, 27%.
 *
 * RODADA 2, E DENTRO DO ALCANCE. No mapa antigo nasciam na boca da trilha, a
 * quinze casas, e chegavam com o combate decidido; aqui saem do espinheiro do
 * sul a cinco e oito casas, o bastante para fechar em um turno de corrida sem
 * já começarem mordendo. Medido em `src/dev/simular-emboscada.mjs`, 400 lutas:
 * 97% de vitória, nenhuma morte, alguém a 0 PV em 28% e dois ou mais em 11%,
 * em 3,1 rodadas e com 78% dos PV do grupo de pé. Saíam de três casas: 6% de
 * derrota. No mapa antigo, que era mais largo: 7% e 4%.
 */
const REFORCOS_EMBOSCADA = [
  {
    round: 2,
    aviso: 'Lobos saem do mato!',
    olhar: { dx: 0, dy: -1 },
    spawn: [
      { id: 'lobo', at: { x: 16, y: 12 }, nameSuffix: 'do mato' },
      { id: 'lobo', at: { x: 19, y: 11 }, nameSuffix: 'da moita' },
    ],
  },
];

/** Monta os reforços de uma rodada, ou null se não houver. */
export function reinforcementsFor(round, variante = 'arena') {
  if (['esconderijo', 'rua', 'mansao', 'mansaoTunel', 'ermo', 'ermoNoite', 'poco', 'cume', 'castelo', 'arvoreTrovao', 'ondaEco', 'editor', 'grandes', 'casaDaMorte1', 'casaDaMorte2', 'casaDaMorte3', 'casaDaMorte4', 'casaDaMortePorao1', 'casaDaMortePorao2'].includes(variante)) return null;
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
