// Livro do Jogador não é SRD: a Maldição de Strahd é conteúdo da Wizards. A PLANTA e o TEXTO são nossos; os fatos (quem mora onde, o que há
// em cada sala, as CDs) são os do livro — ver NOTICE.md e STRAHD.md.
//
// A CASA DA MORTE (Apêndice B). Rascunho das plantas, desenhado à mão sobre a referência (que fica fora do repositório): a casa tem 12 casas
// de largura por 22 de comprimento, e a parede é uma casa inteira (o jogo ainda não tem parede de aresta neste mapa). Cada andar é uma
// cena separada, ligada pela escadaria de mármore vermelho.
//
// Glifos: M parede · U assoalho · - parquet · * tapete · ? porta aberta · l escada · z cama · 0 mesa ou piano · } lareira ou fogão ·
// { prateleira e caixotes · ) baú.

// ------------------------------------------------------------------------------------------------ 1º andar (áreas 1 a 5) ----
const BASE_1 = [
  'MMMMMMMMMMMMMM',
  'MUUUUUUUMU{{{M',
  'MUUUUUUUMUUU)M',
  'M}U0000UM?MMMM',
  'MUU0000UMU}UUM',
  'MUUUUUUUMUUU{M',
  'MUUUUUUUMU00UM',
  'MMMUMUMU?U00UM',
  'MMMUM{MUMUUUUM',
  'MMM?M?MMMMMMMM',
  'MUUUUUUUUllllM',
  'MUUUUUUUUllllM',
  'M}UUUUUUUllllM',
  'MUUUUUUUUllllM',
  'MUUUUUUUUllllM',
  'MMM?MM?MMMMMMM',
  'MUUUUMUUUUUUUM',
  'MUUUUMUUUUUUUM',
  'MUUUUMUUUUUUUM',
  'MUUUUMUUUU0U}M',
  'MUUUUMUUUU0UUM',
  'MUUUUMUUUUUUUM',
  'MUUUUMUUUUUUUM',
  'MMM?MMMMMMMMMM',
];

// ------------------------------------------------------------------------------------------------ 2º andar (áreas 6 a 10) ----
// Ao norte: a biblioteca (8), com a sala secreta (9) atrás de uma estante, e os quartos dos empregados (7). No meio: o salão superior
// (6), com a escadaria. Ao sul: o conservatório (10). O parquet em losangos é o piso de quase tudo.
const BASE_2 = [
  'MMMMMMMMMMMMMM',
  'M--------M{{{M',
  'M--0-----MUUUM',
  'M}-------M?MMM',
  'M-------{MUUUM',
  'M-----MMMMzUzM',
  'MMM--MUUUMUUUM',
  'MMM--MUU)MUUUM',
  'MMMM?MMMMM?MMM',
  'M--------llllM',
  'M--------llllM',
  'M}-------llllM',
  'M--------llllM',
  'M--------llllM',
  'M--------llllM',
  'MMMM??MMMMMMMM',
  'M------------M',
  'M------------M',
  'M------------M',
  'M-----------}M',
  'M------------M',
  'M00----------M',
  'M00----------M',
  'MMMMMMMMMMMMMM',
];

/** Os tapetes: retângulos de casas (inclusivas) que viram tapete onde havia o piso base (U ou parquet). */
const TAPETES_1 = [
  { x1: 1, y1: 11, x2: 7, y2: 13 },    // o salão principal
  { x1: 1, y1: 17, x2: 4, y2: 21 },    // a sala de espera
  { x1: 2, y1: 2, x2: 7, y2: 5 },      // a sala de jantar, sob a mesa
  { x1: 9, y1: 10, x2: 12, y2: 14 },   // a escadaria
];
const TAPETES_2 = [
  { x1: 9, y1: 9, x2: 12, y2: 14 },    // a escadaria
  { x1: 6, y1: 16, x2: 9, y2: 18 },    // o conservatório, sob as cadeiras
];
const comTapetes = (linhas, tapetes) => linhas.map((linha, y) => [...linha].map((g, x) => (
  (g === 'U' || g === '-') && tapetes.some((t) => x >= t.x1 && x <= t.x2 && y >= t.y1 && y <= t.y2) ? '*' : g)).join(''));

export const TERREO = comTapetes(BASE_1, TAPETES_1);
export const SEGUNDO_ANDAR = comTapetes(BASE_2, TAPETES_2);

/** Cada sala: o retângulo (casas inclusivas), o nome e o que se vê ao chegar. */
export const AREAS_TERREO = [
  {
    id: 'espera', area: '1', nome: 'A sala de espera', x1: 1, y1: 16, x2: 4, y2: 22,
    texto: [
      'Atrás do portão de ferro, um pórtico de pedra e portas de carvalho que se abrem sozinhas ao peso da mão. Dentro, uma sala de espera ampla, com retratos de aristocratas de rosto imóvel nas paredes e um escudo de armas sobre a porta do fundo: um moinho de vento dourado sobre um campo vermelho.',
      'O ar tem cheiro de cera e de madeira recém-lustrada. Nada aqui parece velho.',
    ],
  },
  {
    id: 'salao', area: '2A', nome: 'O salão principal', x1: 1, y1: 10, x2: 12, y2: 14,
    texto: [
      'Um salão tão largo quanto a casa. Numa ponta, uma lareira de mármore preto; na outra, uma escadaria larga de mármore vermelho, que sobe em curva. Sobre o fogo apagado, uma espada longa de enfeite, com um pequeno moinho no punho.',
      'Os painéis de madeira da parede são entalhados com videiras, flores, ninfas e sátiros.',
    ],
  },
  {
    id: 'vestiario', area: '2B', nome: 'O vestiário', x1: 5, y1: 7, x2: 5, y2: 8,
    texto: ['Um armário de passagem, estreito. Mantos pretos pendurados em ganchos e um chapéu alto numa prateleira.'],
  },
  {
    id: 'canil', area: '3', nome: 'O canil de lobos', x1: 6, y1: 16, x2: 12, y2: 22,
    texto: [
      'Painéis de carvalho, uma cabeça de veado sobre a lareira e três lobos empalhados espalhados pela sala, de bocas abertas. Duas poltronas forradas de pele encaram o fogo, com uma mesa de carvalho entre elas: um barril de vinho, duas taças esculpidas e um suporte de cachimbos.',
      'Há dois armários contra as paredes. O do leste tem cadeado; o do norte está aberto.',
    ],
  },
  {
    id: 'cozinha', area: '4A', nome: 'A cozinha', x1: 9, y1: 4, x2: 12, y2: 8,
    texto: [
      'Tudo em ordem: louça, talheres e panelas nas prateleiras, uma tábua de corte e um rolo sobre a mesa grande. O forno de pedra abobadada tem a chaminé de ferro dobrada que some no teto.',
      'Num canto, uma portinha dá para um eixo de pedra estreito com uma caixa de madeira presa a uma roldana: um monta-cargas manual.',
    ],
  },
  {
    id: 'despensa', area: '4B', nome: 'A despensa', x1: 9, y1: 1, x2: 12, y2: 2,
    texto: ['Prateleiras cheias. Tudo parece fresco, e tem o cheiro certo, mas nada aqui tem gosto de nada.'],
  },
  {
    id: 'jantar', area: '5', nome: 'A sala de jantar', x1: 1, y1: 1, x2: 7, y2: 8,
    texto: [
      'Uma mesa de mogno entalhado, oito cadeiras de braços e uma prataria que brilha demais, com um lustre de cristal pendurado acima dela. Na parede, a pintura de um vale alpino; as cortinas são de seda vermelha, e uma tapeçaria mostra cães e cavaleiros caçando um lobo.',
      'Os painéis da parede têm cervos entre as árvores.',
    ],
  },
];

export const AREAS_SEGUNDO = [
  {
    id: 'salaoSuperior', area: '6', nome: 'O salão superior', x1: 1, y1: 9, x2: 12, y2: 14,
    texto: [
      'Lamparinas de óleo nas paredes, um piso de parquet em losangos e uma lareira de pedra. Sobre ela, o retrato emoldurado da família Durst: Gustav e Elisabeth sorrindo com dois filhos, Rose e Thorn, e um bebê enrolado nos braços do pai, que a mãe olha com uma ponta de desprezo.',
      'Armaduras em pé guardam as portas do norte e do sul, com lanças nas mãos e elmos em forma de cabeça de lobo. A escadaria de mármore vermelho continua a subir.',
    ],
  },
  {
    id: 'empregados', area: '7A', nome: 'O quarto dos empregados', x1: 10, y1: 4, x2: 12, y2: 7,
    texto: [
      'Um quarto sem enfeite: duas camas com colchão de palha e, aos pés de cada uma, um armário de sapatos vazio. Uniformes de criado muito limpos pendem de ganchos no armário ao lado.',
      'Junto à cabeceira de uma das camas, um botão na parede aciona o sininho da cozinha, vários metros abaixo, pelo mesmo monta-cargas.',
    ],
  },
  {
    id: 'armarioEmpregados', area: '7B', nome: 'O armário dos uniformes', x1: 10, y1: 1, x2: 12, y2: 2,
    texto: ['Prateleiras com uniformes dobrados, aventais e chapéus de criada. Tudo limpo, tudo engomado.'],
  },
  {
    id: 'biblioteca', area: '8', nome: 'A biblioteca', x1: 1, y1: 1, x2: 8, y2: 5,
    texto: [
      'Cortinas de veludo vermelho cobrem as janelas. Uma escrivaninha de mogno e uma cadeira de espaldar alto ficam entre a porta e a lareira, e acima do fogo está pendurado um quadro de um moinho de vento sobre um penhasco. Estantes do chão ao teto, uma escada de rodinhas para os livros altos.',
      'Na escrivaninha: um tinteiro, uma pena, um barrilete de pólvora, uma lamparina e um estojo de carta com lacre vermelho e um selo de madeira com o moinho dos Durst.',
    ],
  },
  {
    id: 'salaSecreta', area: '9', nome: 'A sala secreta', x1: 6, y1: 6, x2: 8, y2: 7,
    texto: [
      'Estantes cheias de volumes sobre rituais de invocação de diabos e sobre necromancia, todos assinados por uma seita chamada Sacerdotes de Osybus. Um baú pesado, de pés de ferro, encostado à parede de trás, com a tampa entreaberta.',
      'Do baú pende o esqueleto de um aventureiro de armadura de couro, com três dardos cravados na caixa torácica. A mão esquerda dele segura uma carta lacrada com o selo de Strahd von Zarovich.',
    ],
  },
  {
    id: 'conservatorio', area: '10', nome: 'O conservatório', x1: 1, y1: 16, x2: 12, y2: 22,
    texto: [
      'Cortinas finas nas janelas, um lustre de bronze no teto e cadeiras estofadas ao longo das paredes. As tapeçarias de vitral mostram homens, mulheres e crianças elegantes cantando e tocando.',
      'Um cravo com banco no canto, uma harpa de pé junto à lareira e estatuetas de alabastro de dançarinos bem vestidos sobre o consolo.',
    ],
  },
];

const grupoPadrao = (pontos) => pontos.map(([x, y]) => ({ x, y }));
const alturaDe = (terreno) => terreno.map((linha) => [...linha].map((g) => (g === 'M' ? '3' : '0')).join(''));

export const MAPA_CASA_DA_MORTE_1 = {
  terreno: TERREO,
  // A parede é um bloco alto (3 níveis) e o piso é raso: sem isto, a parede de casa inteira era desenhada rente ao chão.
  altura: alturaDe(TERREO),
  objetos: [],
  // O grupo entra pelo portão, ao sul, na sala de espera, olhando para o fundo da casa.
  grupo: grupoPadrao([[2, 21], [3, 21], [4, 21], [3, 22]]),
  olhar: { dx: 0, dy: -1 },
  cena: 'casaDaMorte',
};

export const MAPA_CASA_DA_MORTE_2 = {
  terreno: SEGUNDO_ANDAR,
  altura: alturaDe(SEGUNDO_ANDAR),
  objetos: [],
  // Quem sobe a escadaria chega ao salão superior, ao pé da curva.
  grupo: grupoPadrao([[8, 10], [8, 11], [7, 10], [7, 11]]),
  olhar: { dx: -1, dy: 0 },
  cena: 'casaDaMorte',
};

/** Os andares, por variante: as salas, as escadas e onde o grupo aparece ao chegar de outro andar. */
export const ANDARES = {
  casaDaMorte1: {
    id: 'casaDaMorte1', nome: '1º andar', areas: AREAS_TERREO,
    chegadaPelaEscada: grupoPadrao([[8, 11], [8, 12], [7, 11], [7, 12]]),
    escada: { sobe: 'casaDaMorte2' },
  },
  casaDaMorte2: {
    id: 'casaDaMorte2', nome: '2º andar', areas: AREAS_SEGUNDO,
    chegadaPelaEscada: grupoPadrao([[8, 10], [8, 11], [7, 10], [7, 11]]),
    escada: { desce: 'casaDaMorte1' },
  },
};

export const VARIANTES_DA_CASA = Object.keys(ANDARES);
