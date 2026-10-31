// Livro do Jogador não é SRD: a Maldição de Strahd é conteúdo da Wizards. A PLANTA e o TEXTO são nossos; os fatos (quem mora onde, o que há
// em cada sala, as CDs) são os do livro — ver NOTICE.md e STRAHD.md.
//
// A CASA DA MORTE, 1º ANDAR (áreas 1 a 5 do Apêndice B). Rascunho da planta, desenhado à mão sobre a referência (que fica fora do repositório):
// a casa tem 12 casas de largura por 22 de comprimento, e a parede é uma casa inteira (o jogo ainda não tem parede de aresta neste mapa).
// Cada andar é uma cena separada, ligada pela escada.
//
// Glifos: M parede · U assoalho · * tapete · ? porta aberta · l escada · 0 mesa · } lareira ou fogão · { prateleira e caixotes · ) baú.

const BASE = [
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

/** Os tapetes: retângulos de casas (inclusivas) que viram tapete onde havia assoalho. */
const TAPETES = [
  { x1: 1, y1: 11, x2: 7, y2: 13 },    // o salão principal
  { x1: 1, y1: 17, x2: 4, y2: 21 },    // a sala de espera
  { x1: 2, y1: 2, x2: 7, y2: 5 },      // a sala de jantar, sob a mesa
  { x1: 9, y1: 10, x2: 12, y2: 14 },   // a escadaria
];
const comTapetes = (linhas, tapetes) => linhas.map((linha, y) => [...linha].map((g, x) => (
  g === 'U' && tapetes.some((t) => x >= t.x1 && x <= t.x2 && y >= t.y1 && y <= t.y2) ? '*' : g)).join(''));

export const TERREO = comTapetes(BASE, TAPETES);

/** Cada sala do térreo: o retângulo (casas inclusivas), o nome e o que se vê ao chegar. */
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

export const MAPA_CASA_DA_MORTE_1 = {
  terreno: TERREO,
  // A parede é um bloco alto (3 níveis) e o piso é raso: sem isto, a parede de casa inteira era desenhada rente ao chão.
  altura: TERREO.map((linha) => [...linha].map((g) => (g === 'M' ? '3' : '0')).join('')),
  objetos: [],
  // O grupo entra pelo portão, ao sul, na sala de espera, olhando para o fundo da casa.
  grupo: [{ x: 2, y: 21 }, { x: 3, y: 21 }, { x: 4, y: 21 }, { x: 3, y: 22 }],
  olhar: { dx: 0, dy: -1 },
  cena: 'casaDaMorte',
};
