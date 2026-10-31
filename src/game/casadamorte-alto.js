// Livro do Jogador não é SRD: a Maldição de Strahd é conteúdo da Wizards. A PLANTA e o TEXTO são nossos; os fatos (o que há em cada sala,
// as CDs) são os do livro — ver NOTICE.md e STRAHD.md.
//
// A CASA DA MORTE, 3º ANDAR e SÓTÃO (Apêndice B, áreas 11 a 21). Aqui a casa "viva" para de fingir: a poeira, as teias e a madeira que
// geme são de séculos. Um quadrado do mapa = uma casa do jogo. O 3º andar é a varanda no alto da escadaria (11), a suíte principal (12),
// o banheiro (13), o depósito da vassoura (14) e a suíte da babá com o berçário (15). O sótão: o salão de pedra (16), dois quartos de
// repouso (17 e 19), o depósito dos móveis cobertos (18), o quarto trancado das crianças (20) e, escondida, a escada em espiral (21)
// que desce ao nível das masmorras.
//
// Glifos: M parede · U assoalho · * tapete · ? porta · l escada · z cama · 0 mesa · { prateleira e caixotes · ) baú · } lareira.

const BASE_3 = [
  'MMMMMMMMMMMMMM',
  'M}UUUUzzzzUUUM',
  'MUUUUUUUUUUUUM',
  'MUUUUUUUUUUUUM',
  'MUUUUUUUUUU0UM',
  'MUUUUUUUUUUUUM',
  'MMMMM?MMMMMMMM',
  'MMMMMUUUUUUUUM',
  'MMMMMUUUUUUUUM',
  'MUUUUMUUUUUUUM',
  'MUUUU?UUUllllM',
  'MUUUUMUUUllllM',
  'MUUUUMUUUllllM',
  'MMMMMMUUUllllM',
  'MUUUU?UUUllllM',
  'MUUUUMUUUUUUUM',
  'MMMMMMM?MMMMMM',
  'MUUUUMUUUMMMMM',
  'MUUUU?UUUMMMMM',
  'MzUUUMUUUUUUUM',
  'MUUUUMUUUUUUUM',
  'MMMMMMUUUzzUUM',
  'MMMMMMUUUzzUUM',
  'MMMMMMMMMMMMMM',
];

const BASE_4 = [
  'MMMMMMMMMMMMMM',
  'MUUUMUUUUUUMMM',
  'MzzUMzUUUUUzMM',
  'MUUUMUUUUUUMMM',
  'MUUUMUUUUUUMMM',
  'MUUUMUUUUUUMMM',
  'MMM?MMM?MMMMMM',
  'MMMUUUUUUUUUUM',
  'MMMUUUUUUUUUUM',
  'MMM?MMMUUUUUUM',
  'MUUUUUUMUUUUUM',
  'MUUUUUUMUUUllM',
  'M){UUUUMUUUllM',
  'MUUUUUUMUUUllM',
  'MUU{UUUMUUUllM',
  'MUUUU{UMUUUUUM',
  'MU{UUUUMUUUUUM',
  'MUUUU{UMMM?MMM',
  'MUU{UUUMUUUUUM',
  'MUUUUUUMUUzUUM',
  'MMMMMMMMUUUUUM',
  'MMMMMMMMUUUUUM',
  'MMMMMMMMUUUUUM',
  'MMMMMMMMMMMMMM',
];

export const TERCEIRO_ANDAR = BASE_3;
export const SOTAO = BASE_4;

/** Onde fica a escada em espiral oculta do sótão (21) e o que a porta secreta da suíte da babá (15A) revela. As casas são parede até a casa as mostrar. */
export const ESCADA_SECRETA_3 = [[10, 17], [11, 17], [12, 17], [10, 18], [11, 18], [12, 18]];
export const ESCADA_SECRETA_4 = [[1, 7], [2, 7], [1, 8], [2, 8]];

export const AREAS_TERCEIRO = [
  {
    id: 'varanda', area: '11', nome: 'A varanda', x1: 5, y1: 7, x2: 12, y2: 15,
    texto: [
      'Aqui em cima a casa não finge mais. A poeira cobre o assoalho como neve, as teias pendem em véus, as tábuas gemem a cada passo e o ar é frio e parado. A escadaria de mármore vermelho termina numa varanda que dá a volta no vão da escada.',
      'Contra a parede, envolta em teias, uma armadura de placas negras, de pé, com um elmo de viseira fechada. Não se mexe.',
    ],
  },
  {
    id: 'suitePrincipal', area: '12', nome: 'A suíte principal', x1: 1, y1: 1, x2: 12, y2: 6,
    texto: [
      'Portas duplas de vitral, cobertas de pó, com moinhos de vento desenhados nos painéis. Do outro lado, o quarto do casal Durst: uma cama de dossel com cortinas bordadas e véus esfarrapados, dois guarda-roupas vazios, uma penteadeira com espelho de moldura de madeira e uma poltrona acolchoada, tudo sob um pano de teias.',
      'Um tapete de pele de tigre, apodrecendo, jaz diante da lareira, e acima dela, empoeirado, o retrato de Gustav e Elisabeth Durst. Num canto da parede ocidental, um criado-mudo com um botão que toca o sininho da cozinha, muitos andares abaixo. No canto sudoeste, uma mesa e duas cadeiras, e sobre a toalha uma tigela e um jarro de porcelana, vazios.',
      'Uma porta de frente para o pé da cama tem um espelho de corpo inteiro. Abre para um armário vazio. Outra porta leva a uma varanda de fora da casa.',
    ],
  },
  {
    id: 'banheiro', area: '13', nome: 'O banheiro', x1: 1, y1: 9, x2: 4, y2: 12,
    texto: [
      'Um quarto escuro: banheira de madeira com pés de garra, um fogãozinho de ferro com uma chaleira, um barril sob uma torneira na parede leste. A cisterna do telhado recolhia a água da chuva e a mandava para baixo por um cano. O encanamento não funciona mais.',
    ],
  },
  {
    id: 'deposito', area: '14', nome: 'O depósito', x1: 1, y1: 14, x2: 4, y2: 15,
    texto: [
      'Prateleiras empoeiradas ao longo das paredes, com lençóis e cobertores dobrados e barras de sabão ressecadas. No fundo, encostada à parede, uma vassoura coberta de teia.',
    ],
  },
  {
    id: 'suiteBaba', area: '15A', nome: 'A suíte da babá', x1: 5, y1: 16, x2: 12, y2: 22,
    texto: [
      'Poeira e teias sobre um quarto bem decorado: uma cama grande, duas mesas de canto, um guarda-roupa vazio. Preso à parede ao lado do guarda-roupa, um espelho de corpo inteiro com a moldura esculpida como hera e bagas.',
      'A babá da família era amante do dono da casa. Do caso nasceu um bebê natimorto, Walter, e pouco depois o culto matou a mulher. Uma porta dupla de vitral dá para uma varanda de fora, de frente para a entrada.',
    ],
  },
  {
    id: 'bercario', area: '15B', nome: 'O berçário', x1: 1, y1: 17, x2: 4, y2: 20,
    texto: [
      'Um berço coberto por uma mortalha negra, e nada mais que valha o nome de quarto de criança: o ar tem cheiro de leite azedo e de coisa guardada demais.',
    ],
  },
];

export const AREAS_SOTAO = [
  {
    id: 'sotaoPedra', area: '16', nome: 'O sótão de pedra', x1: 3, y1: 7, x2: 12, y2: 9,
    texto: [
      'Um salão vazio, de teto alto, cheio de poeira e teias. As vigas rangem. Há quatro portas: a do noroeste, a do nordeste, uma porta grande a oeste e outra ao sul.',
      'A porta do nordeste, de ferro velho, está trancada com um cadeado.',
    ],
  },
  {
    id: 'sotaoPedra2', area: '16', nome: 'O sótão de pedra', x1: 8, y1: 10, x2: 12, y2: 17,
    texto: [],
  },
  {
    id: 'quarto17', area: '17', nome: 'O quarto de repouso', x1: 1, y1: 1, x2: 3, y2: 5,
    texto: [
      'Uma cama estreita, um criado-mudo, um fogãozinho de ferro, uma escrivaninha com banco, um guarda-roupa vazio e uma cadeira de balanço. Sobre o parapeito da janela do norte, uma boneca sorridente de vestido amarelo, tão coberta de teia que parece de noiva.',
    ],
  },
  {
    id: 'criancas', area: '20', nome: 'O quarto das crianças', x1: 5, y1: 1, x2: 10, y2: 5,
    texto: [
      'Uma janela tapada por tijolos, duas camas pequenas de estrutura de madeira, empoeiradas, e, perto da porta, um baú de brinquedos com moinhos de vento pintados e uma casa de bonecas que é uma réplica perfeita da casa em que vocês estão. Tudo sob teias.',
      'No meio do chão, dois esqueletos pequenos, de roupas esfarrapadas que vocês reconhecem. O de Thorn abraça o boneco de pano do irmão.',
    ],
  },
  {
    id: 'deposito18', area: '18', nome: 'O depósito dos móveis cobertos', x1: 1, y1: 10, x2: 6, y2: 19,
    texto: [
      'Uma câmara empoeirada cheia de móveis antigos sob lençóis brancos: cadeiras, casacos, espelhos de corpo inteiro, manequins de costura. Os lençóis têm forma de gente em pé.',
      'Perto de um fogão de ferro, sob um dos lençóis, um baú de madeira, destrancado.',
    ],
  },
  {
    id: 'quarto19', area: '19', nome: 'O outro quarto de repouso', x1: 8, y1: 18, x2: 12, y2: 22,
    texto: [
      'Uma cama pequena, uma mesa de cabeceira, uma cadeira de balanço, um guarda-roupa vazio e um fogãozinho de ferro, tudo coberto de teia.',
    ],
  },
  {
    id: 'escadaSecreta', area: '21', nome: 'A escada secreta', x1: 1, y1: 7, x2: 2, y2: 8,
    texto: [
      'Uma escada estreita em espiral, de madeira frágil, dentro de um poço de pedra argamassada de metro e meio de largura. Teias grossas enchem o poço e a visão não passa de um metro e meio. A escada desce, desce, e passa por trás dos andares da casa até muito abaixo da terra.',
    ],
  },
];

const grupoPadrao = (pontos) => pontos.map(([x, y]) => ({ x, y }));
const alturaDe = (terreno) => terreno.map((linha) => [...linha].map((g) => (g === 'M' ? '3' : '0')).join(''));

export const MAPA_CASA_DA_MORTE_3 = {
  terreno: TERCEIRO_ANDAR,
  altura: alturaDe(TERCEIRO_ANDAR),
  objetos: [],
  grupo: grupoPadrao([[8, 11], [8, 12], [7, 11], [7, 12]]),
  olhar: { dx: 1, dy: 0 },
  cena: 'casaDaMorte',
};

export const MAPA_CASA_DA_MORTE_4 = {
  terreno: SOTAO,
  altura: alturaDe(SOTAO),
  objetos: [],
  grupo: grupoPadrao([[10, 12], [10, 13], [9, 12], [9, 13]]),
  olhar: { dx: 1, dy: 0 },
  cena: 'casaDaMorte',
};
