// AS SUPERFÍCIES DO CHÃO: o que cada glifo do terreno é para a vista — a cor de chão quando o mapa não tem desenho
// pintado (`vista-topo.js pintarChao`), e o que se diz dele. Era a primeira tabela do `board.js` isométrico; saiu dele
// quando o isométrico saiu (2026-11-05), porque a vista de cima e o editor a usam.

// Superfícies do mapa da estrada. Só o desenho lê isto — a regra de cada
// quadrado mora em `tiles`, no grid.js.
//
// `topo` é o par do xadrez do chão; `lado`, as duas faces do degrau quando o
// quadrado está elevado. A grama do barranco tem lado de TERRA: é o degrau
// marrom que corre ao longo da estrada e diz, de longe, onde se sobe.
const ESTRADA = ['#9c8460', '#937a59'];

const GRAMA = ['#5b7a43', '#54713e'];

const TERRA = ['#4a3824', '#634c31'];

const ROCHA_TOPO = ['#3b3631', '#37322e'];

const ROCHA_LADO = ['#24201d', '#332d28'];

const CAVERNA = ['#575049', '#504943'];

// `topo` é a cor lisa do chão onde o mapa não tem desenho pintado. `chao`, `lado`, `objeto` e `face` eram do
// isométrico (a fileira do atlas, as faces do degrau, o sprite em cima) e ficam como nome do que a casa é.
export const SUPERFICIE = {
  estrada: { topo: ESTRADA, lado: TERRA, chao: 'estrada' },
  grama: { topo: GRAMA, lado: TERRA, chao: 'grama' },
  // Debaixo da copa o chão é grama mais escura, que é como mata fechada lê.
  arvore: { topo: ['#3f5a32', '#3a542e'], lado: TERRA, objeto: 'copa', chao: 'grama' },
  carroca: { topo: ESTRADA, lado: TERRA, objeto: 'carroca', chao: 'estrada' },
  cavalo: { topo: ESTRADA, lado: TERRA, objeto: 'cavalo', chao: 'estrada' },
  pedra: { topo: GRAMA, lado: TERRA, objeto: 'pedra', chao: 'grama' },
  arbusto: { topo: GRAMA, lado: TERRA, objeto: 'arbusto', chao: 'grama' },
  // O esconderijo: cor lisa por enquanto, para julgar o traçado antes da arte.
  // O esconderijo. `topo` é o recuo em cor lisa enquanto o atlas não carrega.
  espinheiro: { topo: GRAMA, lado: TERRA, objeto: 'espinheiro', chao: 'grama' },
  rocha: { topo: ROCHA_TOPO, lado: ROCHA_LADO, chao: 'rocha', face: 'penhasco' },
  caverna: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'caverna', face: 'penhasco' },
  riacho: { topo: ['#35647d', '#315d75'], lado: ROCHA_LADO, chao: 'riacho' },
  // Arvore Trovao: trigo, cinza e lago de verdade, e a mobilia (a variante vem da
  // anotacao do mapa: `varianteDaProp`).
  trigo: { topo: ['#8a7a3f', '#85733f'], lado: TERRA, chao: 'trigo' },
  cinza: { topo: ['#66625a', '#625e56'], lado: TERRA, chao: 'cinza' },
  lago: { topo: ['#1b393f', '#17313a'], lado: ROCHA_LADO, chao: 'lago' },
  margem: { topo: ['#c2b48f', '#bcae88'], lado: TERRA, chao: 'margem' },
  teia: { topo: ['#8a8478', '#847e72'], lado: TERRA, chao: 'teia' },
  // A Casa da Morte: pisos de madeira, tapete e terra, e a mobília sobre o assoalho (o sprite é o mesmo da caverna, o chão é outro).
  assoalho: { topo: ['#4a2c1a', '#452818'], lado: ROCHA_LADO, chao: 'assoalho', face: 'alvenaria' },
  tapete: { topo: ['#7a2a2a', '#742626'], lado: ROCHA_LADO, chao: 'tapete', face: 'alvenaria' },
  parquet: { topo: ['#4a3220', '#452e1d'], lado: ROCHA_LADO, chao: 'parquet', face: 'alvenaria' },
  terraSocada: { topo: ['#52402f', '#4d3b2b'], lado: ROCHA_LADO, chao: 'terraSocada', face: 'penhasco' },
  mesaCasa: { topo: ['#4a2c1a', '#452818'], lado: ROCHA_LADO, objeto: 'mesa', chao: 'assoalho', face: 'alvenaria' },
  lareiraCasa: { topo: ['#4a2c1a', '#452818'], lado: ROCHA_LADO, objeto: 'braseiro', chao: 'assoalho', face: 'alvenaria' },
  estanteCasa: { topo: ['#4a2c1a', '#452818'], lado: ROCHA_LADO, objeto: 'mantimentos', chao: 'assoalho', face: 'alvenaria' },
  bauCasa: { topo: ['#4a2c1a', '#452818'], lado: ROCHA_LADO, objeto: 'bau', chao: 'assoalho', face: 'alvenaria' },
  // Caverna Onda Eco.
  mina: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'mina', face: 'penhasco' },
  lajeMina: { topo: ['#6e665a', '#686054'], lado: ROCHA_LADO, chao: 'lajeMina', face: 'alvenaria' },
  fungos: { topo: ['#4a5a2a', '#465426'], lado: ROCHA_LADO, chao: 'fungos', face: 'penhasco' },
  conchas: { topo: ['#2a2724', '#26231f'], lado: ROCHA_LADO, chao: 'conchas', face: 'penhasco' },
  canal: { topo: ['#4a4640', '#46423c'], lado: ROCHA_LADO, chao: 'canal', face: 'penhasco' },
  aguaEscura: { topo: ['#0f1a26', '#0d1722'], lado: ROCHA_LADO, chao: 'aguaEscura' },
  prop: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'laje', face: 'alvenaria', objeto: 'prop' },
  propBaixo: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'laje', face: 'alvenaria', objeto: 'prop' },
  poco: { topo: ['#22465e', '#204259'], lado: ROCHA_LADO, chao: 'poco' },
  ponte: { topo: ['#7a5a36', '#6d5030'], lado: ['#3f2c19', '#53391f'], chao: 'ponte', objeto: 'ponte' },
  entulho: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'entulho', face: 'penhasco' },
  estalagmite: { topo: CAVERNA, lado: ROCHA_LADO, objeto: 'estalagmite', chao: 'caverna' },
  mantimentos: { topo: CAVERNA, lado: ROCHA_LADO, objeto: 'mantimentos', chao: 'caverna' },
  leito: { topo: CAVERNA, lado: ROCHA_LADO, objeto: 'leito', chao: 'caverna' },
  fogueira: { topo: CAVERNA, lado: ROCHA_LADO, objeto: 'fogueira', chao: 'caverna' },
  bau: { topo: CAVERNA, lado: ROCHA_LADO, objeto: 'bau', chao: 'caverna' },
  tocaia: { topo: GRAMA, lado: TERRA, objeto: 'tocaia', chao: 'grama' },
  // O porão da mansão: cor lisa e caixas provisórias até a arte do PixelLab.
  // A parede construída: topo em corte e faces de pedra lavrada (atlas das faces).
  alvenaria: { topo: ROCHA_TOPO, lado: ROCHA_LADO, topoBloco: 'alvenaria', face: 'alvenaria' },
  seteira: { topo: ROCHA_TOPO, lado: ROCHA_LADO, topoBloco: 'alvenaria', face: 'alvenaria', objeto: 'seteira' },
  laje: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'laje', face: 'alvenaria' },
  // Os decalques do castelo: a mesma laje, com uma marca.
  ossos: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'ossos', face: 'alvenaria' },
  mancha: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'mancha', face: 'alvenaria' },
  cacos: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'cacos', face: 'alvenaria' },
  musgoChao: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'musgoChao', face: 'alvenaria' },
  cisterna: { topo: ['#1b393f', '#17313a'], lado: ROCHA_LADO, chao: 'cisterna', face: 'alvenaria' },
  mesa: { topo: CAVERNA, lado: ROCHA_LADO, objeto: 'mesa', chao: 'laje', face: 'alvenaria' },
  sarcofago: { topo: CAVERNA, lado: ROCHA_LADO, objeto: 'sarcofago', chao: 'laje', face: 'alvenaria' },
  grade: { topo: CAVERNA, lado: ROCHA_LADO, objeto: 'grade', chao: 'laje', face: 'alvenaria' },
  fosso: { topo: ['#14110e', '#110e0c'], lado: ['#0d0b09', '#15120f'], chao: 'fosso' },
  // A lava sulfurosa do Repouso de Zorzula é AZUL-ARROXEADA (o livro), não laranja.
  lava: { topo: ['#3b2a78', '#33246c'], lado: ['#1d1540', '#251b52'], chao: 'lava' },
  // A rua: o prédio é um sprite só, desenhado na casa da frente da pegada.
  casa: { topo: GRAMA, lado: TERRA, objeto: 'casa', chao: 'grama' },
  taverna: { topo: ESTRADA, lado: TERRA, objeto: 'taverna', chao: 'estrada' },
  barris: { topo: GRAMA, lado: TERRA, objeto: 'mantimentos', chao: 'grama' },
  tenda: { topo: GRAMA, lado: TERRA, objeto: 'tenda', chao: 'grama' },
  pocoVelho: { topo: GRAMA, lado: TERRA, objeto: 'pocoVelho', chao: 'grama' },
  pedregal: { topo: ['#8d8878', '#86826f'], lado: ROCHA_LADO, chao: 'planalto', face: 'penhasco' },
  escada: { topo: ['#8d8878', '#86826f'], lado: ROCHA_LADO, objeto: 'escada', chao: 'planalto', face: 'penhasco' },
  // O Castelo Dentefino: tudo sobre a laje.
  altar: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'laje', face: 'alvenaria', objeto: 'altar' },
  banheira: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'laje', face: 'alvenaria', objeto: 'banheira' },
  mesaBanquete: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'laje', face: 'alvenaria', objeto: 'mesaBanquete' },
  camaRei: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'laje', face: 'alvenaria', objeto: 'camaRei' },
  portaoCaido: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'laje', face: 'alvenaria', objeto: 'portaoQuebrado' },
  braseiro: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'laje', face: 'alvenaria', objeto: 'braseiro' },
  braseiroFrio: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'laje', face: 'alvenaria', objeto: 'braseiroFrio' },
  armeiro: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'laje', face: 'alvenaria', objeto: 'armeiro' },
  palha: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'laje', face: 'alvenaria', objeto: 'palha' },
  desabamento: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'laje', face: 'alvenaria', objeto: 'desabamento' },
  caixotes: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'laje', face: 'alvenaria', objeto: 'mantimentos' },
  // As portas de casa inteira da mansão: a de madeira que fecha o vão (parede), a mesma aberta e a laje que gira (secreta achada).
  portaMadeira: { topo: ROCHA_TOPO, lado: ROCHA_LADO, topoBloco: 'alvenaria', face: 'alvenaria', objeto: 'portaMadeira' },
  portaAberta: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'laje', face: 'alvenaria', objeto: 'portaAberta' },
  passagemAberta: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'laje', face: 'alvenaria', objeto: 'passagemAberta' },
  arca: { topo: CAVERNA, lado: ROCHA_LADO, chao: 'laje', face: 'alvenaria', objeto: 'bau' },
};
