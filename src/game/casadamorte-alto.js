// Livro do Jogador não é SRD: a Maldição de Strahd é conteúdo da Wizards. A PLANTA e o TEXTO são nossos; os fatos (o que há em cada sala,
// as CDs) são os do livro — ver NOTICE.md e STRAHD.md.
//
// A CASA DA MORTE, 3º ANDAR e SÓTÃO (Apêndice B, áreas 11 a 21), na escala do mapa do livro: um quadrado é uma casa do jogo, 6 de largura por
// 11 de comprimento (`casadamorte-plantas.js`). Aqui a casa "viva" para de fingir: a poeira, as teias e a madeira que geme são de séculos.
// O 3º andar é a varanda no alto da escadaria (11), a suíte principal (12), o banheiro (13), o depósito da vassoura (14) e a suíte da babá
// com o berçário (15). O sótão: o salão de pedra (16), dois quartos de repouso (17 e 19), o depósito dos móveis cobertos (18), o quarto
// trancado das crianças (20) e, escondida, a escada em espiral (21) que desce ao nível das masmorras.
//
// Glifos: U assoalho · * tapete · 0 mesa · l escada · Z o chão de fora da casa.

import { MOBILIA, mobiliar } from './casadamorte-mobilia.js';
import { plantaDeSalas, criarArea, casa } from './casadamorte-plantas.js';

// ------------------------------------------------------------------------------------------------ 3º andar ----
// A suíte principal (12) ocupa o norte, com o armário do espelho (12B) e a varanda de fora (12C). No meio, a varanda (11) em volta do vão da
// escadaria, o banheiro (13) e o depósito (14) a oeste. Ao sul: o berçário (15B), a suíte da babá (15A) e, fora da casa, a sacada (15C).
// O poço da escada secreta (as três casas ao norte da suíte da babá) é uma sala fechada até a casa abrir as duas portas dele.
export const PLANTA_3 = plantaDeSalas({
  salas: [
    { id: 'suite', retangulos: [[0, 0, 4, 1], [0, 2, 5, 2], [4, 3, 5, 3]] },
    { id: 'sacadaNorte', retangulos: [[5, 0, 5, 1]] },
    { id: 'espelho', retangulos: [[3, 3, 3, 3]] },
    { id: 'varanda', retangulos: [[1, 3, 2, 3], [2, 4, 5, 6]] },
    { id: 'banheiro', piso: 'L', retangulos: [[0, 4, 1, 5]] },
    { id: 'deposito', retangulos: [[0, 6, 1, 6]] },
    { id: 'bercario', retangulos: [[0, 7, 1, 8]] },
    { id: 'sacadaSul', retangulos: [[0, 9, 1, 10]] },
    { id: 'suiteBaba', retangulos: [[2, 7, 2, 7], [2, 8, 5, 10]] },
    { id: 'poco', retangulos: [[3, 7, 5, 7]] },
  ],
  // as duas portas do poço (3,6)-(3,7) e (3,7)-(3,8) começam como parede: são as portas secretas
  portas: [
    [1, 2, 1, 3], [2, 2, 2, 3], [3, 2, 3, 3], [5, 1, 5, 2], [1, 3, 1, 4], [1, 6, 2, 6], [2, 6, 2, 7],
    [1, 8, 2, 8], [1, 9, 2, 9], [1, 10, 2, 10],
  ],
  glifos: [[5, 3, '0']],
});

// ------------------------------------------------------------------------------------------------ sótão ----
// Ao norte, o quarto de repouso (19) e o quarto das crianças (20), trancado. O salão de pedra (16) corre por baixo deles e dobra para o
// sul; a oeste, o depósito dos móveis (18), com a escada em espiral (21) atrás de uma porta secreta; a leste, o quarto de repouso (17) e o
// armário da escada que desce à suíte da babá. O resto da planta é telhado, fora da casa.
export const PLANTA_4 = plantaDeSalas({
  salas: [
    { id: 'quarto19', retangulos: [[0, 0, 1, 2]] },
    { id: 'criancas', retangulos: [[2, 0, 4, 2]] },
    { id: 'espiral', retangulos: [[0, 3, 0, 3]] },
    { id: 'salao', retangulos: [[1, 3, 5, 3], [3, 4, 5, 4], [3, 5, 4, 6]] },
    { id: 'deposito', retangulos: [[0, 4, 2, 7], [1, 8, 1, 8]] },
    { id: 'armarioEscada', retangulos: [[5, 5, 5, 7], [4, 7, 4, 7]] },
    { id: 'quarto17', retangulos: [[3, 7, 3, 7], [3, 8, 5, 8], [2, 9, 5, 9], [2, 10, 4, 10]] },
  ],
  // a porta do quarto das crianças (3,2)-(3,3) é fechada (trancada); a da espiral (0,3)-(0,4) é secreta (parede até a casa mostrar)
  portas: [[1, 2, 1, 3], [3, 2, 3, 3, '+'], [1, 3, 1, 4], [3, 6, 3, 7], [5, 4, 5, 5]],
  glifos: [[5, 6, 'l'], [5, 7, 'l'], [4, 7, 'l']],
});

export const TERCEIRO_ANDAR = PLANTA_3.terreno;
export const SOTAO = PLANTA_4.terreno;

/** Onde fica a escada em espiral oculta do sótão (21) e o que as portas secretas do 3º andar revelam: as casas são piso até a casa as mostrar. */
export const ESCADA_SECRETA_3 = [[3, 7], [4, 7], [5, 7]].map(([x, y]) => [x + 1, y + 1]);
export const ESCADA_SECRETA_4 = [[0, 3]].map(([x, y]) => [x + 1, y + 1]);
/** As duas portas secretas do poço do 3º andar: a da suíte da babá (atrás do espelho de hera) e a da varanda (Percepção CD 15). Cada uma é um par de casas. */
export const PORTA_ESPELHO_3 = [casa(3, 7), casa(3, 8)];
export const PORTA_VARANDA_3 = [casa(3, 6), casa(3, 7)];
/** A porta secreta da espiral (21) com o depósito (18), no sótão. */
export const PORTA_ESPIRAL_4 = [casa(0, 3), casa(0, 4)];
/** A porta do quarto das crianças (20) e a do poço da escada (no armário a leste): pares de casas. */
export const PORTA_CRIANCAS_4 = [casa(3, 2), casa(3, 3)];

export const AREAS_TERCEIRO = [
  criarArea({
    id: 'varanda', area: '11', nome: 'A varanda', cel: [[1, 3, 2, 3], [2, 4, 5, 6]],
    texto: [
      'Aqui em cima a casa deixa de fingir. O pó forra o assoalho como neve, as teias pendem em cortinas, as tábuas rangem e o ar é frio e parado. A escadaria de mármore termina numa varanda que contorna o vão da escada.',
      'Junto à parede, enrolada em teias, uma armadura negra de placas, de pé, de viseira baixa. Ela não se mexe.',
    ],
  }),
  criarArea({
    id: 'suitePrincipal', area: '12', nome: 'A suíte principal', cel: [[0, 0, 5, 2], [4, 3, 5, 3], [3, 3, 3, 3]],
    texto: [
      'Portas de vitral cobertas de pó, com moinhos pintados nos vidros, dão para o quarto do casal Durst: uma cama de dossel de cortinas bordadas e véus em trapos, dois guarda-roupas vazios, uma penteadeira de espelho emoldurado e uma poltrona, tudo sob teias.',
      'Uma pele de tigre apodrece diante da lareira, sob o retrato empoeirado de Gustav e Elisabeth. Na parede do oeste, um criado-mudo traz um botão que faz tocar o sininho da cozinha, muitos andares abaixo. No canto sudeste, uma mesa com duas cadeiras sustenta uma tigela e um jarro de porcelana, ambos vazios.',
      'Uma porta aos pés da cama guarda um espelho de corpo inteiro e abre para um armário vazio e empoeirado. Outra porta sai para uma sacada fora da casa.',
    ],
  }),
  criarArea({
    id: 'banheiro', area: '13', nome: 'O banheiro', cel: [[0, 4, 1, 5]],
    texto: [
      'Um cômodo sem luz e de ar parado. Há uma banheira de madeira sobre pés de garra, um fogareiro de ferro com uma chaleira e um barril sob uma torneira, junto da parede leste. Antigamente a água da chuva descia do telhado por um cano; hoje o encanamento está seco.',
    ],
  }),
  criarArea({
    id: 'deposito', area: '14', nome: 'O depósito', cel: [[0, 6, 1, 6]],
    texto: [
      'Prateleiras cobertas de pó correm pelas paredes, com roupa de cama dobrada e pedaços de sabão seco. No fundo, uma vassoura velha, toda enrolada em teia, parece esperar.',
    ],
  }),
  criarArea({
    id: 'suiteBaba', area: '15A', nome: 'A suíte da babá', cel: [[2, 7, 2, 7], [2, 8, 5, 10]],
    texto: [
      'Teias e pó cobrem um quarto antes elegante: uma cama larga, criados-mudos e um guarda-roupa vazio. Na parede, ao lado dele, um espelho alto com a moldura entalhada em hera e frutinhas.',
      'Diz-se que a babá da família foi amante do dono da casa, que o filho dos dois nasceu morto e que o culto a matou pouco depois. Portas de vitral dão para uma sacada de fora, voltada para a entrada.',
    ],
  }),
  criarArea({
    id: 'bercario', area: '15B', nome: 'O berçário', cel: [[0, 7, 1, 8]],
    texto: [
      'Um berço coberto por uma mortalha negra, e nada mais que valha o nome de quarto de criança: o ar tem cheiro de leite azedo e de coisa guardada demais.',
    ],
  }),
];

export const AREAS_SOTAO = [
  criarArea({
    id: 'sotaoPedra', area: '16', nome: 'O sótão de pedra', cel: [[1, 3, 5, 3], [3, 4, 5, 4], [3, 5, 4, 6], [5, 5, 5, 7], [4, 7, 4, 7]],
    texto: [
      'Um salão vazio, de teto alto, cheio de poeira e teias. As vigas rangem. Há quatro portas: a do noroeste, a do nordeste, uma porta grande a oeste e outra ao sul.',
      'A porta do nordeste, de ferro velho, está trancada com um cadeado.',
    ],
  }),
  criarArea({
    id: 'quarto17', area: '17', nome: 'O quarto de repouso', cel: [[3, 7, 3, 7], [3, 8, 5, 8], [2, 9, 5, 9], [2, 10, 4, 10]],
    texto: [
      'Uma cama estreita, um criado-mudo, um fogãozinho de ferro, uma escrivaninha com banco, um guarda-roupa vazio e uma cadeira de balanço. Sobre o parapeito da janela do norte, uma boneca sorridente de vestido amarelo, tão coberta de teia que parece de noiva.',
    ],
  }),
  criarArea({
    id: 'criancas', area: '20', nome: 'O quarto das crianças', cel: [[2, 0, 4, 2]],
    texto: [
      'A janela foi emparedada com tijolos. Duas caminhas de criança, de madeira, juntam pó; perto da porta há um baú de brinquedos pintado de moinhos e uma casa de bonecas que copia, em miniatura, esta mesma casa. Tudo sob teias.',
      'No meio do chão, dois esqueletos pequenos, de roupas esfarrapadas que vocês reconhecem. O de Thorn abraça o boneco de pano do irmão.',
    ],
  }),
  criarArea({
    id: 'deposito18', area: '18', nome: 'O depósito dos móveis cobertos', cel: [[0, 4, 2, 7], [1, 8, 1, 8]],
    texto: [
      'Uma câmara empoeirada cheia de móveis antigos sob lençóis brancos: cadeiras, casacos, espelhos de corpo inteiro, manequins de costura. Os lençóis têm forma de gente em pé.',
      'Perto de um fogão de ferro, sob um dos lençóis, um baú de madeira, destrancado.',
    ],
  }),
  criarArea({
    id: 'quarto19', area: '19', nome: 'O outro quarto de repouso', cel: [[0, 0, 1, 2]],
    texto: [
      'Uma cama pequena, uma mesa de cabeceira, uma cadeira de balanço, um guarda-roupa vazio e um fogãozinho de ferro, tudo coberto de teia.',
    ],
  }),
  criarArea({
    id: 'escadaSecreta', area: '21', nome: 'A escada secreta', cel: [[0, 3, 0, 3]],
    texto: [
      'Uma escada estreita em espiral, de madeira frágil, dentro de um poço de pedra argamassada de metro e meio de largura. Teias grossas enchem o poço e a visão não passa de um metro e meio. A escada desce, desce, e passa por trás dos andares da casa até muito abaixo da terra.',
    ],
  }),
];


const grupoPadrao = (pontos) => pontos.map(([x, y]) => casa(x, y));

/** As casas dos andares: as plantas de aresta, a mobília e o grupo de chegada. */
const MOB_3 = mobiliar(PLANTA_3.terreno, MOBILIA.casaDaMorte3, 'assoalho');
const MOB_4 = mobiliar(PLANTA_4.terreno, MOBILIA.casaDaMorte4, 'assoalho');

export const MAPA_CASA_DA_MORTE_3 = {
  terreno: MOB_3.terreno,
  altura: null,
  objetos: MOB_3.objetos,
  paredes: PLANTA_3.paredes,
  salas: PLANTA_3.salas,
  folhas: PLANTA_3.folhas,
  materialDaParede: 'madeiraVelha',
  vaoPorCasa: true,
  poeira: true,
  grupo: grupoPadrao([[2, 6], [3, 6], [2, 5], [3, 5]]),
  olhar: { dx: 0, dy: -1 },
  cena: 'casaDaMorte',
};

export const MAPA_CASA_DA_MORTE_4 = {
  terreno: MOB_4.terreno,
  altura: null,
  objetos: MOB_4.objetos,
  paredes: PLANTA_4.paredes,
  salas: PLANTA_4.salas,
  folhas: PLANTA_4.folhas,
  materialDaParede: 'madeiraVelha',
  vaoPorCasa: true,
  poeira: true,
  grupo: grupoPadrao([[5, 5], [5, 6], [5, 7], [4, 7]]),
  olhar: { dx: -1, dy: 0 },
  cena: 'casaDaMorte',
};
