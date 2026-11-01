// Livro do Jogador não é SRD: a Maldição de Strahd é conteúdo da Wizards. A PLANTA e o TEXTO são nossos; os fatos (quem mora onde, o que há
// em cada sala, as CDs) são os do livro — ver NOTICE.md e STRAHD.md.
//
// A CASA DA MORTE (Apêndice B). A planta é a do livro na ESCALA DELE: um quadrado do mapa (5 pés) é uma casa do jogo, e a casa tem 6 casas de
// largura por 11 de comprimento (`casadamorte-plantas.js`). Só a masmorra usa 2 x 2 casas por quadrado. Cada andar é uma cena separada,
// ligada pela escadaria de mármore vermelho.
//
// Glifos: U assoalho · - parquet · * tapete · 0 mesa · l escada · Z o chão de fora da casa. Parede e porta são de aresta (a planta diz quais).

import { MOBILIA, mobiliar } from './casadamorte-mobilia.js';
import { plantaDeSalas, criarArea, casa, ret } from './casadamorte-plantas.js';
import { TERCEIRO_ANDAR, SOTAO, AREAS_TERCEIRO, AREAS_SOTAO, MAPA_CASA_DA_MORTE_3, MAPA_CASA_DA_MORTE_4 } from './casadamorte-alto.js';
import { PLANTA_PORAO_1, PLANTA_PORAO_2 } from './casadamorte-porao.js';
import { TEXTOS_PORAO } from './casadamorte-textos-porao.js';

export { MAPA_CASA_DA_MORTE_3, MAPA_CASA_DA_MORTE_4, TERCEIRO_ANDAR, SOTAO };

// ------------------------------------------------------------------------------------------------ 1º andar (áreas 1 a 5) ----
// A sala de jantar (5) e a cozinha (4A, com a despensa 4B) ao norte; o salão (2A), com a escadaria em curva, no meio; a sala de espera (1B,
// com o pórtico 1A) e o canil de lobos (3) ao sul. O vestíbulo, ao lado do armário (2B), liga a sala de jantar à cozinha.
export const PLANTA_1 = plantaDeSalas({
  salas: [
    { id: 'jantar', piso: '-', retangulos: [[0, 0, 3, 2], [1, 3, 1, 3]] },
    { id: 'despensa', piso: 'L', retangulos: [[4, 0, 5, 0]] },
    { id: 'cozinha', piso: 'L', retangulos: [[4, 1, 5, 3]] },
    { id: 'vestibulo', piso: 'L', retangulos: [[3, 3, 3, 3]] },
    { id: 'vestiario', retangulos: [[2, 3, 2, 3]] },
    { id: 'salao', retangulos: [[0, 4, 5, 6]] },
    { id: 'espera', retangulos: [[0, 7, 1, 9]] },
    { id: 'porche', retangulos: [[0, 10, 1, 10]] },
    { id: 'canil', retangulos: [[2, 7, 5, 10]] },
  ],
  portas: [
    [3, 2, 3, 3], [3, 3, 4, 3], [4, 0, 4, 1], [1, 3, 1, 4], [2, 3, 2, 4], [2, 6, 2, 7],
    [0, 6, 0, 7], [1, 6, 1, 7], [0, 9, 0, 10], [1, 9, 1, 10], [1, 10, 1, 11, '+'],
  ],
});

// ------------------------------------------------------------------------------------------------ 2º andar (áreas 6 a 10) ----
// Ao norte: a biblioteca (8), com a sala secreta (9) atrás de uma estante, o armário dos uniformes (7B) e os quartos dos empregados (7A).
// No meio: o salão superior (6), com a escadaria. Ao sul: o conservatório (10). O assoalho encerado é o piso de quase tudo.
export const PLANTA_2 = plantaDeSalas({
  piso: 'U',
  salas: [
    { id: 'biblioteca', piso: 'U', retangulos: [[0, 0, 3, 2], [1, 3, 2, 3]] },
    { id: 'armario', piso: 'U', retangulos: [[3, 3, 3, 3]] },
    { id: 'secreta', piso: 'L', retangulos: [[4, 0, 5, 0]] },
    { id: 'empregados', piso: 'U', retangulos: [[4, 1, 5, 3]] },
    { id: 'salao', retangulos: [[0, 4, 5, 6]] },
    { id: 'conservatorio', retangulos: [[0, 7, 5, 10]] },
  ],
  // a estante da biblioteca gira: a aresta (3,0)-(4,0) é parede até a passagem se abrir
  portas: [[1, 3, 1, 4], [2, 3, 2, 4], [4, 3, 4, 4], [3, 3, 4, 3], [1, 6, 1, 7], [2, 6, 2, 7]],
});

export const AREAS_TERREO = [
  criarArea({
    id: 'espera', area: '1', nome: 'A sala de espera', cel: [[0, 7, 1, 10]],
    texto: [
      'Atrás do portão de ferro, um pórtico de pedra e portas de carvalho que se abrem sozinhas ao peso da mão. Dentro, uma sala de espera ampla, com retratos de aristocratas de rosto imóvel nas paredes e um escudo de armas sobre a porta do fundo: um moinho de vento dourado sobre um campo vermelho.',
      'O ar tem cheiro de cera e de madeira recém-lustrada. Nada aqui parece velho.',
    ],
  }),
  criarArea({
    id: 'salao', area: '2A', nome: 'O salão principal', cel: [[0, 4, 5, 6]],
    texto: [
      'O salão ocupa a largura da casa. Numa ponta, uma lareira de pedra negra; na outra, a escadaria de mármore vermelho sobe em curva. Sobre o fogo apagado repousa uma espada de adorno, com um moinho gravado no punho.',
      'A madeira das paredes é entalhada em folhagens, flores e figuras de faunos e ninfas.',
    ],
  }),
  criarArea({
    id: 'vestiario', area: '2B', nome: 'O vestiário', cel: [[2, 3, 2, 3]],
    texto: ['Um armário de passagem, estreito. Mantos pretos pendurados em ganchos e um chapéu alto numa prateleira.'],
  }),
  criarArea({
    id: 'canil', area: '3', nome: 'O canil de lobos', cel: [[2, 7, 5, 10]],
    texto: [
      'Uma sala de caça forrada de carvalho. Sobre a lareira, uma cabeça de veado; pelo chão, três lobos empalhados de bocas abertas. Duas poltronas forradas de pele encaram o fogo, e uma mesinha entre elas guarda um barrilete, taças lavradas e um porta-cachimbos.',
      'Dois armários ficam junto às paredes: o do leste está trancado a cadeado, o do norte, aberto.',
    ],
  }),
  criarArea({
    id: 'cozinha', area: '4A', nome: 'A cozinha', cel: [[4, 1, 5, 3]],
    texto: [
      'Tudo no lugar: louças e talheres nas prateleiras, uma tábua e um rolo de massa à mão. O forno é de pedra, em abóbada, e o cano de ferro da chaminé faz uma curva antes de sumir no teto.',
      'Num canto há uma portinha baixa, e atrás dela um poço estreito de pedra com uma caixa de madeira pendurada numa polia: um elevador de mantimentos, puxado à mão.',
    ],
  }),
  criarArea({
    id: 'despensa', area: '4B', nome: 'A despensa', cel: [[4, 0, 5, 0]],
    texto: ['Prateleiras cheias. Tudo parece fresco, e tem o cheiro certo, mas nada aqui tem gosto de nada.'],
  }),
  criarArea({
    id: 'jantar', area: '5', nome: 'A sala de jantar', cel: [[0, 0, 3, 2], [1, 3, 1, 3]],
    texto: [
      'A mesa é de mogno trabalhado, cercada de cadeiras de braços, e a prataria reluz demais. Um lustre de cristal pende sobre ela. Nas paredes, um vale alpino pintado, cortinas de seda vermelha e uma tapeçaria de caçadores e cães acuando um lobo.',
      'Nos painéis de madeira, veados correm entre árvores entalhadas.',
    ],
  }),
];

export const AREAS_SEGUNDO = [
  criarArea({
    id: 'salaoSuperior', area: '6', nome: 'O salão superior', cel: [[0, 4, 5, 6]],
    texto: [
      'Lamparinas de óleo nas paredes, o assoalho encerado e uma lareira de pedra. Acima dela, o retrato da família Durst: Gustav e Elisabeth, com os filhos Rose e Thorn e um bebê no colo do pai, que a mãe encara com certo desdém.',
      'Armaduras de pé flanqueiam as portas, de lança em punho e elmo com focinho de lobo. A escadaria de mármore vermelho segue para cima.',
    ],
  }),
  criarArea({
    id: 'empregados', area: '7A', nome: 'O quarto dos empregados', cel: [[4, 1, 5, 3]],
    texto: [
      'Um quarto sem adornos: duas camas de colchão de palha, um baú pequeno ao pé de cada uma e uniformes de criado muito limpos pendurados ao lado.',
      'Junto à cabeceira de uma cama há um botão na parede, que faz tocar o sininho da cozinha lá embaixo, pelo mesmo elevador.',
    ],
  }),
  criarArea({
    id: 'armarioEmpregados', area: '7B', nome: 'O armário dos uniformes', cel: [[3, 3, 3, 3]],
    texto: ['Prateleiras com uniformes dobrados, aventais e chapéus de criada. Tudo limpo, tudo engomado.'],
  }),
  criarArea({
    id: 'biblioteca', area: '8', nome: 'A biblioteca', cel: [[0, 0, 3, 2], [1, 3, 2, 3]],
    texto: [
      'Pesadas cortinas vinho fecham as janelas. Entre a porta e a lareira, uma escrivaninha escura e uma cadeira de encosto alto; sobre o consolo, um quadro mostra um moinho no alto de um rochedo. Os livros chegam ao teto, e uma escadinha sobre trilhos serve às prateleiras de cima.',
      'O tampo da escrivaninha guarda um tinteiro, uma pena, um pequeno barril de pólvora, uma lamparina e um estojo de cartas lacrado em vermelho, com o selo do moinho dos Durst.',
    ],
  }),
  criarArea({
    id: 'salaSecreta', area: '9', nome: 'A sala secreta', cel: [[4, 0, 5, 0]],
    texto: [
      'Estantes de livros sobre invocação de demônios e necromancia, todos assinados pelos Sacerdotes de Osybus. Encostado ao fundo, um baú pesado de pés de ferro, com a tampa semiaberta.',
      'Do baú pende o esqueleto de um aventureiro de couro, com três dardos cravados nas costelas. A mão esquerda segura uma carta lacrada com o selo de Strahd von Zarovich.',
    ],
  }),
  criarArea({
    id: 'conservatorio', area: '10', nome: 'O conservatório', cel: [[0, 7, 5, 10]],
    texto: [
      'Cortinas leves nas janelas, um lustre de bronze no teto e poltronas estofadas ao longo das paredes. Os vitrais das tapeçarias mostram gente elegante, de todas as idades, cantando e tocando.',
      'Um cravo com seu banquinho num canto, uma harpa junto da lareira e, sobre o consolo, estatuetas de alabastro de dançarinos em trajes de baile.',
    ],
  }),
];

const MOB_1 = mobiliar(PLANTA_1.terreno, MOBILIA.casaDaMorte1, 'assoalho');
const MOB_2 = mobiliar(PLANTA_2.terreno, MOBILIA.casaDaMorte2, 'assoalho');

const grupoPadrao = (pontos) => pontos.map(([x, y]) => ({ x, y }));
/** Casas em quadrados do livro passam a casas do mapa. */
const grupoDoLivro = (pontos) => pontos.map(([x, y]) => casa(x, y));

export const MAPA_CASA_DA_MORTE_1 = {
  terreno: MOB_1.terreno,
  altura: null,
  objetos: MOB_1.objetos,
  paredes: PLANTA_1.paredes,
  salas: PLANTA_1.salas,
  folhas: PLANTA_1.folhas,
  materialDaParede: 'painelCarvalho',
  vaoPorCasa: true,
  // O grupo entra pelo portão, ao sul, no pórtico e na sala de espera, olhando para o fundo da casa.
  grupo: grupoDoLivro([[0, 10], [1, 10], [0, 9], [1, 9]]),
  olhar: { dx: 0, dy: -1 },
  cena: 'casaDaMorte',
};

export const MAPA_CASA_DA_MORTE_2 = {
  terreno: MOB_2.terreno,
  altura: null,
  objetos: MOB_2.objetos,
  paredes: PLANTA_2.paredes,
  salas: PLANTA_2.salas,
  folhas: PLANTA_2.folhas,
  materialDaParede: 'painelCarvalho',
  vaoPorCasa: true,
  // Quem sobe a escadaria chega ao salão superior, ao pé da curva.
  grupo: grupoDoLivro([[3, 5], [3, 4], [3, 6], [2, 5]]),
  olhar: { dx: 1, dy: 0 },
  cena: 'casaDaMorte',
};

/**
 * Os andares, por variante: as salas, as escadas e onde o grupo aparece ao chegar de cada outro andar.
 *
 * `escadas`: cada escada que se pega pelo botão direito. `rect` são as casas (inclusivas) da escada; `destino` é a variante; a entrada na
 * outra cena é a de `chegadas[origem]` (as quatro casas onde o grupo aparece). `secreta` marca as que só existem depois que a casa as
 * mostra; a cena trata disso. Tudo em casas do MAPA (o quadrado do livro mais o anel).
 */
const rect = (x1, y1, x2, y2) => ({ x1, y1, x2, y2 });
const ESCADARIA = ret(4, 4, 5, 6);

export const ANDARES = {
  casaDaMorte1: {
    id: 'casaDaMorte1', nome: '1º andar', areas: AREAS_TERREO,
    escadas: [
      { rect: ESCADARIA, rotulo: 'Subir a escadaria de mármore', detalhe: '2º andar', destino: 'casaDaMorte2' },
      { rect: ret(2, 10, 2, 10), rotulo: 'Descer pelo alçapão', detalhe: 'as masmorras', destino: 'casaDaMortePorao1' },
    ],
    chegadas: {
      casaDaMorte2: grupoDoLivro([[3, 5], [3, 4], [3, 6], [2, 5]]),
      casaDaMortePorao1: grupoDoLivro([[2, 9], [3, 10], [3, 9], [2, 8]]),     // pelo alçapão do canil
    },
  },
  casaDaMorte2: {
    id: 'casaDaMorte2', nome: '2º andar', areas: AREAS_SEGUNDO,
    escadas: [
      { rect: ESCADARIA, rotulo: 'Descer a escadaria', detalhe: '1º andar', destino: 'casaDaMorte1' },
      { rect: ESCADARIA, rotulo: 'Subir a escadaria', detalhe: '3º andar', destino: 'casaDaMorte3' },
    ],
    chegadas: {
      casaDaMorte1: grupoDoLivro([[3, 5], [3, 4], [3, 6], [2, 5]]),
      casaDaMorte3: grupoDoLivro([[3, 5], [3, 4], [3, 6], [2, 5]]),
    },
  },
  casaDaMorte3: {
    id: 'casaDaMorte3', nome: '3º andar', areas: AREAS_TERCEIRO,
    escadas: [
      { rect: ESCADARIA, rotulo: 'Descer a escadaria de mármore', detalhe: '2º andar', destino: 'casaDaMorte2' },
      { rect: ret(3, 7, 5, 7), rotulo: 'Subir a escada secreta', detalhe: 'sótão', destino: 'casaDaMorte4', secreta: true },
    ],
    chegadas: {
      casaDaMorte2: grupoDoLivro([[2, 6], [3, 6], [2, 5], [3, 5]]),
      casaDaMorte4: grupoDoLivro([[3, 8], [2, 8], [2, 9], [3, 9]]),
    },
  },
  casaDaMorte4: {
    id: 'casaDaMorte4', nome: 'Sótão', areas: AREAS_SOTAO,
    escadas: [
      { rect: ret(4, 6, 5, 7), rotulo: 'Descer a escada secreta', detalhe: '3º andar, suíte da babá', destino: 'casaDaMorte3' },
      { rect: ret(0, 3, 0, 3), rotulo: 'Descer a escada em espiral', detalhe: 'as masmorras', destino: 'casaDaMortePorao1', secreta: true },
    ],
    chegadas: {
      casaDaMorte3: grupoDoLivro([[5, 5], [5, 6], [5, 7], [4, 7]]),
      casaDaMortePorao1: grupoDoLivro([[0, 4], [1, 4], [1, 5], [2, 4]]),
    },
  },
  casaDaMortePorao1: {
    id: 'casaDaMortePorao1', nome: 'Masmorra, nível 1',
    areas: PLANTA_PORAO_1.areas.map((a) => ({ ...a, texto: TEXTOS_PORAO[a.id] ?? [] })),
    escadas: [
      { rect: rect(22, 0, 23, 1), rotulo: 'Subir a escada em espiral', detalhe: 'o sótão', destino: 'casaDaMorte4' },
      { rect: rect(14, 26, 17, 27), rotulo: 'Descer a escada', detalhe: 'masmorra, nível 2', destino: 'casaDaMortePorao2' },
      { rect: rect(38, 30, 39, 31), rotulo: 'Subir a escada do alçapão', detalhe: 'o canil, no térreo', destino: 'casaDaMorte1', secreta: true },
    ],
    chegadas: {
      casaDaMorte4: grupoPadrao([[22, 2], [23, 2], [22, 3], [23, 3]]),
      casaDaMortePorao2: grupoPadrao([[14, 28], [15, 28], [14, 29], [15, 29]]),
      casaDaMorte1: grupoPadrao([[37, 30], [37, 31], [36, 30], [36, 31]]),
    },
  },
  casaDaMortePorao2: {
    id: 'casaDaMortePorao2', nome: 'Masmorra, nível 2',
    areas: PLANTA_PORAO_2.areas.map((a) => ({ ...a, texto: TEXTOS_PORAO[a.id] ?? [] })),
    escadas: [{ rect: rect(0, 10, 1, 11), rotulo: 'Subir a escada', detalhe: 'masmorra, nível 1', destino: 'casaDaMortePorao1' }],
    chegadas: {
      casaDaMortePorao1: grupoPadrao([[2, 10], [2, 11], [3, 10], [3, 11]]),
    },
  },
};

export const VARIANTES_DA_CASA = Object.keys(ANDARES);


export const MAPA_CASA_DA_MORTE_PORAO_1 = {
  terreno: PLANTA_PORAO_1.terreno,
  luz: 'escuro',                  // o livro: a masmorra é escura; quem não enxerga no escuro acende uma tocha
  altura: PLANTA_PORAO_1.altura,
  objetos: [],
  paredeDeCaverna: true,
  // O grupo chega pela escada em espiral do sótão, ao fim do túnel de acesso.
  grupo: grupoPadrao([[22, 2], [23, 2], [22, 3], [23, 3]]),
  olhar: { dx: 0, dy: 1 },
  cena: 'casaDaMorte',
};

export const MAPA_CASA_DA_MORTE_PORAO_2 = {
  terreno: PLANTA_PORAO_2.terreno,
  luz: 'escuro',                  // o livro: a masmorra é escura; quem não enxerga no escuro acende uma tocha
  altura: PLANTA_PORAO_2.altura,
  objetos: [],
  paredeDeCaverna: true,
  grupo: grupoPadrao([[2, 10], [2, 11], [3, 10], [3, 11]]),
  olhar: { dx: 1, dy: 0 },
  cena: 'casaDaMorte',
};
