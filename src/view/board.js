// Tabuleiro isométrico em Canvas 2D, com câmera que gira.
//
// PROJEÇÃO
//   sx = ox + (vx - vy) · TW/2
//   sy = oy + (vx + vy) · TH/2 - altura · LIFT
//   O losango tem vértices em (sx, sy), (sx+TW/2, sy+TH/2), (sx, sy+TH) e
//   (sx-TW/2, sy+TH/2); o centro fica em (sx, sy+TH/2).
//
// ROTAÇÃO
//   A grade do jogo NUNCA gira — girar o mundo quebraria as regras. O que gira
//   é a leitura dela: `toView` manda (x, y) do mundo para a coordenada que a
//   câmera usa, e `fromView` desfaz. Quatro orientações, de 90 em 90 graus.
//
//     r=0  (x, y)              r=2  (W-1-x, H-1-y)
//     r=1  (H-1-y, x)          r=3  (y, W-1-x)
//
//   Um vetor de direção gira junto: (dx,dy) → (-dy,dx) a cada passo.
//
// PROJEÇÃO INVERSA (clique → quadrado)
//   A partir do centro do losango:  vx = cx/TW + cy/TH,  vy = cy/TH - cx/TW.
//   Arredondar dá o losango que contém o ponto. Como a altura desloca o
//   losango para cima, os platôs são testados do mais alto para o mais baixo.

import { getSheet, drawSprite, frameAt, animDaFolha } from '../art/sheet.js';
import { linhaDaDirecao, DIRECOES_8 } from '../art/direcoes.js';
import { ladrilhoChao, sorteio } from '../art/chao.js';
import { faixaDaFace, topoDoBloco } from '../art/faces.js';
import { pecaDaParede } from '../art/paredes.js';
import { faixaDaRuina } from '../art/ruinas.js';
import { spriteCenario } from '../art/cenario.js';
import { hasCondition, CONDITIONS } from '../rules/conditions.js';
import { distanceFt, ARESTA } from '../core/grid.js';
import { temEscuridaoEm, visaoDoGrupo, fontesDeLuz, CLARO } from '../rules/luz.js';
import { emissoresDoAmbiente, desenharAmbiente } from './ambiente.js';
import { previsaoDeAtaque, previsaoDeMagia, pct, MAGIAS_DE_ATAQUE } from '../rules/odds.js';
import { SPELLS, dadosDaMagia } from '../rules/spells.js';
import { spellAttackBonus, spellSaveDc } from '../rules/abilities.js';
import { Fx, quadro } from './fx.js';
import { paredesNaDiagonal, desenharVolumeObscuro } from './zonas25d.js';
import { EFEITOS } from '../art/efeitos.js';
import { iconCanvas, temIcone } from '../art/icons.js';

// `iconCanvas` devolve uma CÓPIA a cada chamada, porque um canvas não pode
// estar em dois lugares do DOM. No tabuleiro ele é só fonte de `drawImage`,
// sessenta vezes por segundo por criatura — copiar a cada quadro seria lixo
// para o coletor. Um exemplar por nome basta.
const iconesTab = new Map();
function iconeTab(nome) {
  let cv = iconesTab.get(nome);
  if (!cv) { cv = iconCanvas(nome, 32); iconesTab.set(nome, cv); }
  return cv;
}

// QUAL CONDIÇÃO GANHA O LUGAR NO TABULEIRO.
//
// Os ícones são de 32 px, e três lado a lado dariam 96 — uma vez e meia a
// largura de um ladrilho, por cima da criatura vizinha. Então o tabuleiro
// mostra UM, o que mais muda a próxima decisão, mais um "+N"; a lista
// completa fica no HUD. A ordem é do que tira a criatura de jogo para o que
// só a atrapalha, e as condições boas vêm por último.
const PRIORIDADE = ['atordoado', 'inconsciente', 'agarrado', 'amedrontado', 'envenenado',
  'caido', 'queimando', 'amaldicoado', 'lento', 'abencoado', 'esquivando'];
const peso = (id) => { const i = PRIORIDADE.indexOf(id); return i < 0 ? PRIORIDADE.length : i; };

export const TW = 64;
export const TH = 32;
export const LIFT = 22;
const PAD = 30;

const TOP_COLORS = {
  0: ['#4d6440', '#44583a'],
  1: ['#6a6276', '#5c5468'],
  2: ['#4a5a35', '#42512f'],
  3: ['#5e5040', '#544738'],
};

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
//
// `chao` é a fileira do atlas desenhado (`art/chao.js`) que vai por baixo.
// `topo` continua existindo como recuo: é o losango liso que aparece enquanto
// o atlas não carregou, ou se ele falhar.
const SUPERFICIE = {
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

// Objetos que se estendem por mais de uma casa. As casas vizinhas com a mesma
// superfície formam UM objeto, desenhado uma vez só. Sem isto a carroça 2x2
// saía como quatro caixotes e cada par de cavalo como dois cavalos: quatro
// cavalos na tela onde o mapa tem dois. Árvore, arbusto e pedra ficam fora de
// propósito — a mata inteira é uma mancha contínua de `T`, e agrupá-la faria
// dela uma árvore só.
const MULTICASA = new Set(['carroca', 'cavalo', 'casa', 'taverna', 'tenda',
  'altar', 'banheira', 'mesaBanquete', 'camaRei', 'portaoQuebrado']);

/** Peças de vários quadros e quantos quadros por segundo (o grupo do atlas é o nome). */
const PROP_ANIMADA = { 'prop-taverna-lareira': 8, 'prop-rodaDagua': 5 };

// A CHAMA QUE BALANÇA. As fogueiras, os braseiros e as tochas do atlas são um quadro só; em vez de gerar quadros novos, o
// motor refaz a parte de cima do desenho a cada instante, fileira por fileira, com um desvio lateral que cresce para a ponta
// da chama (o pé dela, junto das achas, fica parado). `alto` é a fração de cima que balança, `amp` o desvio máximo em px,
// `janela` as colunas que balançam (as achas que apontam para cima na fogueira de lenha solta ficam de fora).
const CHAMA = {
  fogueira: { alto: 0.62, amp: 1.8, janelas: { 6: [0.3, 0.7] } },
  braseiro: { alto: 0.5, amp: 1.3 },
  'prop-fogueiraPanela': { alto: 0.55, amp: 1.5 },
  'prop-braseiroVerde': { alto: 0.4, amp: 1.8 },
  'decorParede-tochaAcesa': { alto: 0.5, amp: 1.2, janelas: { 0: [0, 1], 55: [0.1, 0.9] }, so: [0, 55] },
};

/**
 * Desenha `q` (uma peça do atlas) com `x, y` no canto de cima à esquerda, balançando a chama de `cfg`. `t` é o tempo do
 * tabuleiro; `fase` desencontra duas chamas vizinhas. O tempo é quantizado em 12 quadros por segundo: pixel art treme em
 * degraus, não deslizando.
 */
function desenharChama(ctx, q, x, y, t, cfg, fase = 0) {
  const corte = Math.round(q.h * cfg.alto);
  const tq = Math.floor(t * 12) / 12;
  const [j0, j1] = cfg.janelas?.[q.origem] ?? [0, 1];
  const c0 = Math.round(q.w * j0);
  const c1 = Math.round(q.w * j1);
  ctx.drawImage(q.img, q.x, q.y + corte, q.w, q.h - corte, x, y + corte, q.w, q.h - corte);
  for (let r = 0; r < corte; r += 1) {
    const u = (corte - r) / corte;
    const desvio = Math.round((Math.sin(tq * 9 + r * 0.31 + fase) * 0.7 + Math.sin(tq * 3.1 + fase * 2) * 0.5) * cfg.amp * u);
    if (c0 > 0) ctx.drawImage(q.img, q.x, q.y + r, c0, 1, x, y + r, c0, 1);
    if (c1 < q.w) ctx.drawImage(q.img, q.x + c1, q.y + r, q.w - c1, 1, x + c1, y + r, q.w - c1, 1);
    ctx.drawImage(q.img, q.x + c0, q.y + r, c1 - c0, 1, x + c0 + desvio, y + r, c1 - c0, 1);
  }
}

// Objetos de uma casa só desenhados pelo atlas, com o raio da sombra de cada um.
const SOMBRA_DO_BAIXO = {
  arbusto: 24, pedra: 17, estalagmite: 13, mantimentos: 22, espinheiro: 22, leito: 20, fogueira: 15, bau: 16,
  tocaia: 20, mesa: 22, sarcofago: 24, grade: 20, pocoVelho: 22,
  braseiro: 14, braseiroFrio: 14, armeiro: 20, palha: 20, desabamento: 22, prop: 17,
};

// Objetos altos o bastante para esconder alguém atrás: esmaecem quando há
// criatura ali. Ver `transparenciaDaCasa`.
const ESMAECE = new Set(['copa', 'carroca', 'casa', 'taverna', 'altar', 'mesaBanquete', 'camaRei', 'banheira']);
const TRANSLUCIDO = 0.42;
// Parede (1) e porta fechada (2) escondem quem está atrás; arco e seteira, não.
const ARESTA_QUE_ESCONDE = new Set([1, 2]);

// PAREDES DE BORDA (`core/grid.js`): a parede fina entre duas casas. A arte
// vem do kit de construção do PixelLab (`art/paredes.js`): uma peça por tipo
// de aresta, já na projeção do tabuleiro. Cada casa desenha as
// arestas do norte e do oeste — as que ficam ATRÁS dela na câmera fixa —, logo
// depois do próprio chão: assim a parede cobre quem está do outro lado e é
// coberta por quem está na casa. Do lado de fora (capim, estrada) a mesma
// aresta é a parede da FRENTE de uma sala: sai só um toco, para se ver dentro.
// `mancha` (a cinza do vulcão fora das casas) também: sem ela, a casa de fora
// que a cinza cobria virava "dentro" e deixava pilares de 66 px num muro de 22.
const CHAO_DE_FORA = new Set(['grama', 'estrada', 'planalto', 'riacho', 'mancha', 'trigo', 'cinza', 'lago', 'margem', 'teia']);
// Altura da parede de borda, em níveis de 22 px. Três é o bastante para ela
// ler como muro sem engolir meia sala atrás dela.
// A TINTA DE CADA SALA, por cima da laje (ver `drawTile`). Fraca de
// propósito: é para a sala ter temperatura, não para virar outro piso.
const TINTA_DE_SALA = {
  // Mansão Tresendar: os porões dos Marcarrubra.
  oficina: 'rgba(36, 44, 56, .20)',          // alambique, vidro e umidade
  quartoMago: 'rgba(44, 36, 58, .20)',       // o único cômodo com cuidado
  deposito: 'rgba(48, 40, 22, .18)',         // fardo, pele e poeira
  armas: 'rgba(38, 38, 42, .18)',            // ferro encostado na parede
  jaulas: 'rgba(30, 30, 34, .24)',           // pedra lavada e palha velha
  cripta: 'rgba(28, 36, 60, .22)',           // pedra fria de sarcófago
  estarRubro: 'rgba(70, 48, 26, .20)',       // cerveja entornada e fumaça
  guardasBugbear: 'rgba(52, 40, 28, .22)',   // palha podre e pelo de bugbear
  alojamentoRubro: 'rgba(56, 44, 30, .18)',  // beliche e roupa suja
  corredorFosso: 'rgba(34, 32, 30, .18)',    // argamassa caída
  poraoCisterna: 'rgba(32, 42, 48, .18)',    // o frio que vem da água

  torreUrso: 'rgba(62, 44, 24, .26)',      // terra batida e palha podre
  banquete: 'rgba(70, 52, 22, .20)',       // gordura velha e restos
  santuario: 'rgba(28, 36, 60, .20)',      // pedra fria de templo
  salaoEscuro: 'rgba(20, 26, 44, .24)',    // a capela sem luz
  rei: 'rgba(58, 34, 40, .16)',            // o tapete vermelho que já houve
  despensa: 'rgba(48, 40, 22, .18)',
  ruina: 'rgba(40, 52, 30, .22)',          // mato entrando pela pedra
  terraco: 'rgba(44, 50, 44, .14)',
  salaoArmadilha: 'rgba(36, 34, 30, .18)', // argamassa caída
  alojamentoHob: 'rgba(44, 38, 30, .16)',
  guarda: 'rgba(44, 38, 30, .16)',
};

const ALTURA_PAREDE = 3;
// A PAREDE DE CAVERNA: a rocha junto de chao anda no dado a UM nível acima do chão vizinho (é o que a linha de visão e a
// translucidez conhecem), mas era desenhada só com essa altura, igual a um degrau, e lia como degrau. No desenho ela sobe
// mais `PAREDE_EXTRA` níveis, e fica com a mesma altura das paredes de construção (3 níveis). Só desenho: a regra
// (altura, visão, passo) não muda.
const PAREDE_EXTRA = 2;
const PAREDE_ALTURA = 3;      // níveis de parede acima do chão que ela toca
// Casas de vista que ficam "atrás" desta, onde uma criatura pode ser coberta.
const ATRAS = [[-1, 0], [0, -1], [-1, -1], [-2, 0], [0, -2], [-1, -2], [-2, -1], [-2, -2]];

const SIDE_LEFT = '#22301c';
const SIDE_RIGHT = '#3b4e30';
const WALL_LEFT = '#332e42';
const WALL_RIGHT = '#564e6b';

// Paleta do cartão de previsão. Os valores são os mesmos de `style.css`
// (--papel-2, --gold, --ink, --muted, --green, --red, --blue): o cartão é
// desenhado no canvas, logo não herda as variáveis CSS, mas tem de ler como
// parte da mesma interface de pergaminho e latão.
//
// É tinta escura sobre claro, ao contrário do mapa por baixo. Por isso o
// verde, o vermelho e o azul daqui são mais fechados que os do tabuleiro: o
// mesmo #5fd07a que brilha sobre pedra escura some sobre creme.
const CARTAO = {
  fundo: 'rgba(235, 220, 186, .94)',
  fio: 'rgba(117, 80, 26, .85)',
  luz: 'rgba(255, 252, 242, .6)',
  sombra: 'rgba(78, 56, 24, .35)',
  gold: '#8a5f1d',
  ink: '#352718',
  muted: '#7c6a4e',
  green: '#2f7a3c',
  red: '#a83420',
  blue: '#2c6a9e',
  amber: '#8a5a12',
};

// Alcance normal em latão discreto; alcance longo em âmbar tracejado, porque
// atirar ali custa desvantagem e o tracejado lê como "permitido, mas pior".
const CHAO_ALCANCE = { fill: 'rgba(217, 180, 90, .12)', stroke: 'rgba(217, 180, 90, .3)' };
const CHAO_LONGO = { fill: 'rgba(224, 150, 60, .13)', stroke: 'rgba(224, 150, 60, .5)' };
// Quem a área da magia pega: inimigo em vermelho, aliado em amarelo (cuidado!),
// aliado que Esculpir Magias poupa em verde.
/** A cor de cada coisa que fica no chão. */
const COR_DA_ZONA = {
  // Detectar Magia: o chão onde há aura brilha em violeta.
  auraMagica: { fill: 'rgba(170,120,255,.34)', stroke: 'rgba(222,196,255,.95)' },
  graxa: { fill: 'rgba(24,20,16,.42)', stroke: 'rgba(120,104,72,.55)' },
  teia: { fill: 'rgba(244,240,228,.46)', stroke: 'rgba(255,255,255,.95)' },
  aura: { fill: 'rgba(232,195,90,.06)', stroke: 'rgba(255,224,138,.38)' },
  emaranhar: { fill: 'rgba(80,150,70,.34)', stroke: 'rgba(110,232,154,.6)' },
  // Plantas Constritoras (a vinha infectada): raiz e cipó, mais terroso que a magia de druida.
  plantasConstritoras: { fill: 'rgba(72,104,52,.32)', stroke: 'rgba(132,176,88,.6)' },
  nuvemFetida: { fill: 'rgba(196,200,80,.34)', stroke: 'rgba(212,224,74,.6)' },
  crescimentoDeEspinhos: { fill: 'rgba(110,90,50,.38)', stroke: 'rgba(176,135,90,.65)' },
  raioLunar: { fill: 'rgba(110,168,232,.20)', stroke: 'rgba(170,200,240,.6)' },
  esferaFlamejante: { fill: 'rgba(224,85,60,.30)', stroke: 'rgba(232,195,90,.7)' },
  nuvemDeAdagas: { fill: 'rgba(170,182,198,.30)', stroke: 'rgba(232,238,245,.7)' },
  tempestadeDeGranizo: { fill: 'rgba(110,168,232,.22)', stroke: 'rgba(232,238,245,.55)' },
  // As três que escondem são repintadas POR CIMA da máscara de escuridão
  // (`zonasObscurasPorCima`), senão a máscara apaga a cor e viram o mesmo buraco
  // preto. A Névoa é pálida e respira (`onda`); as outras duas são pretas, com
  // a borda que as distingue: violeta na Escuridão, azul-gelo na Fome de Hadar.
  nevoaObscurecente: { fill: 'rgba(214,222,230,.7)', stroke: 'rgba(240,244,248,.65)', rgb: '214,222,230', alfa: 0.7, onda: 0.07 },
  escuridao: { fill: 'rgba(28,20,40,.85)', stroke: 'rgba(120,90,170,.6)' },
  fomeDeHadar: { fill: 'rgba(18,10,32,.85)', stroke: 'rgba(130,200,240,.65)' },
  // Silêncio: um véu azul-gelo e parado, sem brilho; a Muralha de Vento: faixa de ar claro.
  silencio: { fill: 'rgba(120,150,190,.26)', stroke: 'rgba(190,215,245,.7)' },
  muralhaDeVento: { fill: 'rgba(214,236,248,.15)', stroke: 'rgba(240,250,255,.6)' },
  // Lote 11: a imagem quase não pinta o chão (o volume é que conta); a luz é um calor leve; o mato, um verde fraco.
  ilusaoMenor: { fill: 'rgba(199,180,255,.10)', stroke: 'rgba(199,180,255,.45)' },
  luzDoDia: { fill: 'rgba(255,240,170,.05)', stroke: 'rgba(255,244,190,.18)' },
  crescimentoDePlantas: { fill: 'rgba(70,130,60,.16)', stroke: 'rgba(110,200,100,.22)' },
  // Lote 12: as imagens e as flechas têm volume em 2.5D (`zonas25d.js`), então o chão mal se pinta;
  // a runa do Glifo paira sobre a casa e não pinta o chão (para o inimigo ela nem existe).
  imagemSilenciosa: { fill: 'rgba(199,180,255,.07)', stroke: 'rgba(199,180,255,.38)' },
  imagemMaior: { fill: 'rgba(199,180,255,.07)', stroke: 'rgba(199,180,255,.38)' },
  cordaoDeFlechas: { fill: 'rgba(216,196,154,.06)', stroke: 'rgba(216,196,154,.35)' },
  glifoDeProtecao: { fill: 'rgba(0,0,0,0)', stroke: 'rgba(0,0,0,0)' },
  // Lote 13: o Círculo Mágico tem cilindro de runas em 2.5D (`fx.js`, `cilindroCamadas`); o chão só leva um véu.
  circuloMagico: { fill: 'rgba(214,204,255,.10)', stroke: 'rgba(236,230,255,.5)' },
};

const PAPEL_NA_AREA = {
  inimigo: { fill: 'rgba(230, 70, 50, .40)', stroke: '#ff6a4b' },
  aliado: { fill: 'rgba(240, 200, 60, .45)', stroke: '#ffd84a' },
  poupado: { fill: 'rgba(110, 200, 120, .40)', stroke: '#8ff0a0' },
};

const FONTE_NOME = "13px 'Palatino Linotype', Palatino, Georgia, serif";
const FONTE_DADO = '11px system-ui, sans-serif';
const FONTE_DADO_FORTE = '700 11px system-ui, sans-serif';
const FONTE_CHANCE = '700 19px system-ui, sans-serif';

const vkey = (vx, vy) => `${vx},${vy}`;

/** O que cada coluna de luz das magias de utilidade quer dizer (dica ao passar o cursor). */
const LEGENDA_DA_MARCA = {
  'marca-bem': 'Detectar o Bem e o Mal: o bem (+)',
  'marca-mal': 'Detectar o Bem e o Mal: o mal (x)',
  'marca-neutro': 'Detectar o Bem e o Mal: nem bem nem mal',
  'marca-armadilha': 'Encontrar Armadilhas: perigo escondido',
  'marca-alvo': 'Localizar Objeto: o que você procura',
  'marca-espia': 'Sentidos da Fera: o que o bicho viu',
  'marca-verdade': 'Zona da Verdade: não consegue mentir',
  'marca-alarme': 'Alarme: a área vigiada',
  'marca-aparencia': 'Alterar Aparência: o corpo está transformado',
  'marca-fingido': 'Fingir de Morto: parece morto',
  'marca-olho': 'Clarividência: o olho invisível viu algo aqui',
};

export class Board {
  constructor(canvas, { encounter, onTileClick, onTileHover }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.enc = encounter;
    this.field = encounter.field;
    this.onTileClick = onTileClick;
    this.onTileHover = onTileHover;

    // `mode` é a ação escolhida no HUD (ataque ou magia). O tabuleiro precisa
    // dela para pintar alcance e prever o acerto ANTES do clique.
    this.overlay = { reachable: null, path: null, targets: null, selected: null, mode: null };
    this.hover = null;
    this.pointer = null;
    this.floaters = [];
    this.shake = 0;
    this.time = 0;
    this.rot = 0;
    this.fx = new Fx();
    this.displayHp = new Map();

    this.maxHeight = 0;
    for (let i = 0; i < this.field.heights.length; i++) {
      this.maxHeight = Math.max(this.maxHeight, this.alturaVisual(i % this.field.w, Math.floor(i / this.field.w)));
    }

    const { w, h } = this.field;
    const span = w + h;
    const wide = Math.max(w, h);
    // Copa de árvore sobe acima do próprio quadrado, e o canvas só reservava
    // altura para o relevo: as árvores do canto de cima saíam cortadas. A
    // folga só entra em mapa que TEM árvore, para o encontro padrão continuar
    // com exatamente o mesmo enquadramento. 112: a árvore alta mais alta tem
    // 151 px acima do pé, que fica meia casa abaixo do centro da casa de cima,
    // e o sorteio a sobe mais 4 — 151 + 4 - 16 - PAD dá 109.
    let copa = 0;
    for (let y = 0; y < h && !copa; y++) {
      for (let x = 0; x < w; x++) {
        if (this.field.surfaceAt?.(x, y) === 'arvore') { copa = 112; break; }
      }
    }
    // Muro mais alto que o de sempre sobe acima da casa do fundo: o canvas reserva o que passa dos 3 níveis.
    // (só nos mapas de vila: o enquadramento do castelo e dos encontros padrão não muda)
    if (this.field.paredeAlt && (this.field.fachadaFechada || Math.max(w, h) >= 60)) copa += Math.max(0, Math.max(...this.field.paredeAlt) - ALTURA_PAREDE) * LIFT;
    // Dimensionado para o pior caso, para não redimensionar ao girar.
    canvas.width = span * (TW / 2) + PAD * 2;
    canvas.height = span * (TH / 2) + this.maxHeight * LIFT + PAD * 2 + 40 + copa;
    this.ox = PAD + (wide - 1) * (TW / 2) + (span - 2 * wide + 2) * (TW / 4);
    // CÂMERA FIXA (rot 0): o canto de trás da vista fica à esquerda em h*TW/2; a fórmula acima era para as 4 rotações, e em
    // mapa mais largo que alto empurrava o mapa para a direita e cortava o canto leste (as árvores e as casas do canto de cima).
    if (this.rot === 0 && w !== h) this.ox = PAD + h * (TW / 2);
    this.oy = PAD + this.maxHeight * LIFT + copa;

    this.rebuildOrder();

    this.zoom = 1;
    this.drag = null;

    canvas.addEventListener('mousemove', (e) => {
      if (this.drag) return;   // arrastando a câmera: não realça quadrado
      const t = this.tileFromEvent(e);
      const changed = !this.hover || !t || this.hover.x !== t.x || this.hover.y !== t.y;
      this.hover = t;
      if (changed) this.onTileHover?.(t);
    });
    canvas.addEventListener('mouseleave', () => {
      this.hover = null;
      this.pointer = null;
      this.onTileHover?.(null);
    });
    canvas.addEventListener('click', (e) => {
      if (this.dragMoved) { this.dragMoved = false; return; }  // fim de arrasto não é clique
      const t = this.tileFromEvent(e);
      if (t) this.onTileClick?.(t, e);
    });

    // ---- botão direito: girar arrastando, menu de ações clicando ----
    // Botão direito: soltar sem arrastar abre o menu de contexto da casa
    // (a câmera não gira mais: arrastar não faz nada) (`onTileContext`: inspecionar, atacar, conversar...).
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 2) return;
      this.drag = { x: e.clientX, acc: 0 };
      this.dragMoved = false;
      this.hover = null;
      this.pointer = null;
      canvas.style.cursor = 'grabbing';
      e.preventDefault();
    });
    this._onDragMove = (e) => {
      if (!this.drag) return;
      const dx = e.clientX - this.drag.x;
      this.drag.x = e.clientX;
      this.drag.acc += dx;
      if (Math.abs(dx) > 1) this.dragMoved = true;
      // Arrastar ~110 px vira a câmera um quarto de volta.
      const STEP = 110;
      while (this.drag.acc >= STEP) { this.drag.acc -= STEP; this.rotate(1); this.onCameraChange?.(); }
      while (this.drag.acc <= -STEP) { this.drag.acc += STEP; this.rotate(-1); this.onCameraChange?.(); }
    };
    this._onDragEnd = (e) => {
      if (!this.drag) return;
      this.drag = null;
      canvas.style.cursor = '';
      if (!this.dragMoved && e?.button === 2) {
        const t = this.tileFromEvent(e);
        if (t) this.onTileContext?.(t, e);
      }
      this.dragMoved = false;
    };
    addEventListener('mousemove', this._onDragMove);
    addEventListener('mouseup', this._onDragEnd);

    // ---- zoom com a roda ----
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      // O zoom vai para onde o ponteiro está, não para o canto.
      this.setZoom(this.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), { x: e.clientX, y: e.clientY });
      this.onCameraChange?.();
    }, { passive: false });
  }

  /**
   * Zoom por CSS: o canvas continua com a mesma resolução interna e só muda de
   * tamanho na tela. Como `tileFromEvent` converte pelo retângulo medido, o
   * clique continua caindo no quadrado certo em qualquer zoom.
   */
  /**
   * `ancora` ({x, y} em coordenadas de tela): o ponto do tabuleiro que estava
   * embaixo dela continua embaixo dela depois do zoom — é a roda do mouse
   * ampliando para onde o ponteiro aponta. Sem âncora, o centro do que está à
   * vista.
   */
  setZoom(z, ancora = null) {
    const el = this.canvas;
    const quadro = el.parentElement;
    const antes = el.getBoundingClientRect();
    if (!ancora && quadro) {
      const q = quadro.getBoundingClientRect();
      ancora = { x: q.left + q.width / 2, y: q.top + q.height / 2 };
    }
    // Em que fração do tabuleiro a âncora cai, antes de mudar o tamanho.
    const fx = ancora && antes.width ? (ancora.x - antes.left) / antes.width : 0.5;
    const fy = ancora && antes.height ? (ancora.y - antes.top) / antes.height : 0.5;

    // O teto de 3x serve para o mapa que cabe na tela. Num mapa grande o canvas
    // é encaixado a 15% do tamanho nativo, e 3x disso é 46%: os heróis ficam
    // do tamanho de um selo. Aí o teto sobe até o tamanho nativo (1:1).
    this.fitWidth ??= antes.width || el.width;
    this.zoom = Math.max(0.55, Math.min(Math.max(3, el.width / this.fitWidth), z));
    if (Math.abs(this.zoom - 1) < 0.02) {
      this.zoom = 1;
      el.style.width = '';
      el.style.height = '';
      el.style.maxWidth = '';
      el.style.maxHeight = '';
    } else {
      // Mede uma vez o tamanho "encaixado" para usar de base.
      this.fitWidth ??= antes.width || el.width;
      el.style.maxWidth = 'none';
      el.style.maxHeight = 'none';
      el.style.width = `${Math.round(this.fitWidth * this.zoom)}px`;
      el.style.height = 'auto';
    }

    // Rola o quadro para a mesma fração do tabuleiro voltar para a âncora.
    // `getBoundingClientRect` já mede o tamanho novo (força o layout).
    if (ancora && quadro) {
      const depois = el.getBoundingClientRect();
      quadro.scrollLeft += depois.left + fx * depois.width - ancora.x;
      quadro.scrollTop += depois.top + fy * depois.height - ancora.y;
    }
  }

  zoomBy(factor) {
    this.setZoom(this.zoom * factor);
  }

  /** Quantas vezes o canvas é maior que o espaço onde ele é encaixado. */
  get fatorDeMapa() {
    const el = this.canvas;
    this.fitWidth ??= el.getBoundingClientRect().width || el.width;
    return el.width / this.fitWidth;
  }

  /** Mapa grande o bastante para precisar de câmera que segue (o padrão cabe inteiro). */
  get mapaGrande() {
    // POR PROPRIEDADE DO MAPA, e não pela tela: o fator dependia da largura da
    // janela, então o Castelo e o Esconderijo viravam "grandes" numa janela de
    // 1000 px, e a própria Árvore Trovão deixava de ser numa tela de 2560.
    return this.field.w + this.field.h >= 140;
  }

  /** Rola o quadro até `pos` ficar no meio do que se vê. */
  focarEm(pos) {
    const el = this.canvas;
    const quadro = el.parentElement;
    if (!quadro || !pos) return;
    const { sx, sy } = this.iso(pos.x, pos.y, this.field.heightAt(pos.x, pos.y));
    const r = el.getBoundingClientRect();
    const q = quadro.getBoundingClientRect();
    const k = r.width / el.width;
    quadro.scrollLeft += (r.left + sx * k) - (q.left + q.width / 2);
    quadro.scrollTop += (r.top + sy * k) - (q.top + q.height / 2);
  }

  /**
   * Em mapa grande a vista é um pedaço dele, então a câmera acompanha: se `pos`
   * saiu do miolo do quadro (os 60% do meio), recentra. Dentro do miolo não mexe,
   * senão a tela balança a cada passo.
   */
  seguir(pos) {
    if (!this.mapaGrande || !pos) return;
    const el = this.canvas;
    const quadro = el.parentElement;
    if (!quadro) return;
    const { sx, sy } = this.iso(pos.x, pos.y, this.field.heightAt(pos.x, pos.y));
    const r = el.getBoundingClientRect();
    const q = quadro.getBoundingClientRect();
    const k = r.width / el.width;
    const px = r.left + sx * k;
    const py = r.top + sy * k;
    const mx = q.width * 0.2;
    const my = q.height * 0.2;
    if (px < q.left + mx || px > q.right - mx || py < q.top + my || py > q.bottom - my) this.focarEm(pos);
  }

  /**
   * Enquadramento inicial de mapa grande: a 55% do tamanho nativo e centrado no
   * grupo. Encaixado inteiro, o mapa de 91 x 68 deixa cada herói com 15% do
   * tamanho dele — dá para ver que há uma vila e nada além.
   */
  enquadrarGrande(pos) {
    if (!this.mapaGrande) return;
    // Remede o encaixe a cada uso: guardado uma vez só, ele ficava com a
    // largura de quando o quadro estava oculto (0) ou da janela antiga.
    this.setZoom(1);
    this.fitWidth = null;
    this.setZoom(this.fatorDeMapa * 0.55);
    this.focarEm(pos);
  }

  resetCamera() {
    this.setZoom(1);
    this.setRotation(0);
    // Em mapa grande "o enquadramento inicial" é o do grupo, não o do mapa
    // inteiro a 15%.
    if (this.mapaGrande && this.focoInicial) this.enquadrarGrande(this.focoInicial);
  }

  disposeCamera() {
    removeEventListener('mousemove', this._onDragMove);
    removeEventListener('mouseup', this._onDragEnd);
  }

  get tileHalf() {
    return TH / 2;
  }

  // ---- rotação -------------------------------------------------------------

  setRotation(r) {
    this.rot = ((r % 4) + 4) % 4;
    this.rebuildOrder();
    this.hover = null;
    this.pointer = null;
  }

  /**
   * A CÂMERA É FIXA: o mapa tem uma vista só, como os isométricos pintados
   * (paredes inteiras no fundo, cortadas na frente; objeto de cenário com uma
   * vista). `rot` fica sempre 0; o código de rotação continua só porque as
   * contas de `toView`/`rotateVec` passam por ele.
   */
  rotate() {
    return this.rot;
  }

  toView(x, y) {
    const { w, h } = this.field;
    switch (this.rot) {
      case 1: return { vx: h - 1 - y, vy: x };
      case 2: return { vx: w - 1 - x, vy: h - 1 - y };
      case 3: return { vx: y, vy: w - 1 - x };
      default: return { vx: x, vy: y };
    }
  }

  fromView(vx, vy) {
    const { w, h } = this.field;
    switch (this.rot) {
      case 1: return { x: vy, y: h - 1 - vx };
      case 2: return { x: w - 1 - vx, y: h - 1 - vy };
      case 3: return { x: w - 1 - vy, y: vx };
      default: return { x: vx, y: vy };
    }
  }

  /** Gira um vetor de direção do mundo para a tela. */
  rotateVec(dx, dy) {
    switch (this.rot) {
      case 1: return { dx: -dy, dy: dx };
      case 2: return { dx: -dx, dy: -dy };
      case 3: return { dx: dy, dy: -dx };
      default: return { dx, dy };
    }
  }

  /** Ordem de desenho: diagonais crescentes no espaço da câmera. */
  rebuildOrder() {
    const list = [];
    for (let y = 0; y < this.field.h; y++) {
      for (let x = 0; x < this.field.w; x++) {
        const { vx, vy } = this.toView(x, y);
        list.push({ x, y, vx, vy, d: vx + vy });
      }
    }
    list.sort((a, b) => a.d - b.d || a.vx - b.vx);
    this.order = list;
  }

  // ---- projeção ------------------------------------------------------------

  iso(x, y, height = null) {
    const hgt = height ?? this.field.heightAt(x, y);
    const { vx, vy } = this.toView(x, y);
    return {
      sx: this.ox + (vx - vy) * (TW / 2),
      sy: this.oy + (vx + vy) * (TH / 2) - hgt * LIFT,
    };
  }

  center(x, y) {
    const { sx, sy } = this.iso(x, y);
    return { sx, sy: sy + TH / 2 };
  }

  /** Centro para coordenadas contínuas — projéteis viajam entre quadrados. */
  centerF(fx, fy) {
    const hgt = this.field.heightAt(Math.round(fx), Math.round(fy));
    const { vx, vy } = this.toView(fx, fy);
    return {
      sx: this.ox + (vx - vy) * (TW / 2),
      sy: this.oy + (vx + vy) * (TH / 2) - hgt * LIFT + TH / 2,
    };
  }

  tileFromEvent(e) {
    const r = this.canvas.getBoundingClientRect();
    const px = (e.clientX - r.left) * (this.canvas.width / r.width);
    const py = (e.clientY - r.top) * (this.canvas.height / r.height);
    // Guardado em pixel interno do canvas (não de tela) porque é nele que o
    // cartão é desenhado — assim o cartão segue o cursor em qualquer zoom.
    this.pointer = { px, py };
    for (let hgt = this.maxHeight; hgt >= 0; hgt--) {
      const cx = px - this.ox;
      const cy = py - this.oy - TH / 2 + hgt * LIFT;
      const vx = Math.round(cx / TW + cy / TH);
      const vy = Math.round(cy / TH - cx / TW);
      const { x, y } = this.fromView(vx, vy);
      if (this.field.inside(x, y) && this.alturaVisual(x, y) === hgt) return { x, y };
    }
    return null;
  }

  setOverlay(patch) {
    Object.assign(this.overlay, patch);
  }

  floatText(pos, text, color, big = false, { peso = 1, dy = 0 } = {}) {
    // Danos que chegam juntos na mesma casa (os dardos do Míssil, o golpe e a
    // chuva da Saraivada) viram um número só, somado — e não três empilhados.
    const m = /^-(\d+)$/.exec(text);
    const junto = m && this.floaters.find((f) => f.x === pos.x && f.y === pos.y && f.color === color && f.t < 0.15 && /^-\d+$/.test(f.text));
    if (junto) {
      const total = Number(junto.text.slice(1)) + Number(m[1]);
      junto.text = `-${total}`;
      junto.big = junto.big || big || total >= 10;
      return;
    }
    this.floaters.push({ x: pos.x, y: pos.y, text, color, big, t: 0, peso, dy });
  }

  bump(strength = 0.35) {
    this.shake = Math.max(this.shake, strength);
  }

  /** A PAUSA DE IMPACTO: o jogo quase para por `ms` milissegundos quando um golpe pesado acerta (o tremor segue). Não acumula: vale o maior. */
  hitStop(ms) {
    this.congela = Math.max(this.congela ?? 0, ms / 1000);
  }

  // ---- primitivas ----------------------------------------------------------

  diamond(ctx, sx, sy) {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + TW / 2, sy + TH / 2);
    ctx.lineTo(sx, sy + TH);
    ctx.lineTo(sx - TW / 2, sy + TH / 2);
    ctx.closePath();
  }

  /**
   * Quanto uma casa deixa ver de quem está atrás dela — o chão e o objeto em
   * separado.
   *
   * ANTES ERA UMA TRANSPARÊNCIA SÓ, e com duas falhas medidas pelos revisores:
   *
   * 1. Toda casa elevada contava como "alta", com `>=`. Uma casa de barranco
   *    no nível 1 com um goblin no mesmo nível atrás dela ficava a 42% — e o
   *    fundo escuro aparecia por baixo. Eram as manchas escuras ao lado dos
   *    goblins. Chão elevado só esconde quem está MAIS BAIXO: a face lateral
   *    desce, não sobe. Daí `>` para o chão.
   * 2. O esmaecimento levava o chão junto com o objeto. Agora só o objeto alto
   *    — copa, carroça, parede — fica translúcido; o chão debaixo dele não.
   *
   * E a vizinhança ganhou (-2,-2), que faltava: de lá, com o desnível de 22 px,
   * uma copa no nível 1 cobria o quadril de uma criatura no nível 0.
   *
   * Arbusto, pedra e cavalo não esmaecem: cobrir as pernas de quem está atrás
   * é exatamente a leitura certa de "tem cobertura aqui".
   */
  transparenciaDaCasa(x, y, vx, vy, byView) {
    const h = this.field.heightAt(x, y);
    const s = SUPERFICIE[this.field.surfaceAt(x, y)];
    const objetoAlto = s ? ESMAECE.has(s.objeto) : this.field.tileAt(x, y) === 1;
    if (!objetoAlto && h === 0) return { chao: 1, objeto: 1 };
    let chao = 1;
    let objeto = 1;
    for (const [ox, oy] of ATRAS) {
      const quem = byView.get(vkey(vx + ox, vy + oy));
      if (!quem) continue;
      const hq = this.field.heightAt(quem.pos.x, quem.pos.y);
      if (h > hq) chao = TRANSLUCIDO;
      if (objetoAlto && h >= hq) objeto = TRANSLUCIDO;
    }
    return { chao, objeto };
  }

  /**
   * A TEIA desenhada por cima do chão da casa (fios que saem do centro e dois anéis), em vez do ladrilho opaco de teia, que lia
   * como tapete marrom. Pixel duro, claro e translúcido: o chão aparece por baixo.
   */
  desenharTeia(ctx, sx, sy, x, y) {
    const cx = sx, cy = sy + TH / 2;
    const pontas = [[0, -16], [16, -8], [32, 0], [16, 8], [0, 16], [-16, 8], [-32, 0], [-16, -8]].map(([dx, dy]) => ({ x: cx + dx * 0.96, y: cy + dy * 0.96 }));
    const pixel = (px, py, a) => { ctx.fillStyle = `rgba(232,234,242,${a})`; ctx.fillRect(Math.round(px), Math.round(py), 1, 1); };
    const linha = (a, b, alfa) => {
      const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y), 1);
      for (let k = 0; k <= n; k += 1) pixel(a.x + (b.x - a.x) * k / n, a.y + (b.y - a.y) * k / n, alfa);
    };
    const meio = { x: cx + (sorteio(x, y, 5) - 2), y: cy + (sorteio(y, x, 3) - 1) };
    for (const pt of pontas) linha(meio, pt, 0.5);
    for (const r of [0.38, 0.7]) {
      for (let i = 0; i < pontas.length; i += 1) {
        const a = pontas[i], b = pontas[(i + 1) % pontas.length];
        linha({ x: meio.x + (a.x - meio.x) * r, y: meio.y + (a.y - meio.y) * r },
          { x: meio.x + (b.x - meio.x) * r, y: meio.y + (b.y - meio.y) * r }, 0.42);
      }
    }
  }

  /** A construção está em ruína (alguma parede dela perdeu altura)? Guardado por sala: `paredeRuina` é por casa dona da aresta. */
  salaEmRuina(sala) {
    if (!this._ruinaDaSala) {
      this._ruinaDaSala = new Set();
      const f = this.field;
      if (f.paredeRuina && f.sala) {
        for (const [k, nome] of f.sala) {
          const [cx, cy] = k.split(',').map(Number);
          if (f.paredeRuina[cy * f.w + cx] > 0) this._ruinaDaSala.add(nome);
        }
      }
    }
    return this._ruinaDaSala.has(sala);
  }

  /**
   * DEGRAUS numa casa de escada (`field.degraus`, eixo 'x' ou 'y' = o sentido em que a escada sobe): linhas claras e
   * escuras atravessadas na casa, como o focinho de cada degrau lavrado na pedra. Só desenho.
   */
  desenharDegraus(ctx, sx, sy, eixo) {
    const T = { x: sx, y: sy };
    const R = { x: sx + TW / 2, y: sy + TH / 2 };
    const L = { x: sx - TW / 2, y: sy + TH / 2 };
    // 'x': as linhas ficam paralelas ao eixo y (de T+a(R-T) até L+a(R-T)); 'y': paralelas ao eixo x.
    const ao = eixo === 'y' ? { x: L.x - T.x, y: L.y - T.y } : { x: R.x - T.x, y: R.y - T.y };
    const ao2 = eixo === 'y' ? { x: R.x - T.x, y: R.y - T.y } : { x: L.x - T.x, y: L.y - T.y };
    ctx.save();
    this.diamond(ctx, sx, sy);
    ctx.clip();
    // Cinco degraus: cada faixa um pouco mais escura que a de cima (a sombra do degrau acima), um sulco escuro e um fio claro.
    for (let k = 0; k < 5; k += 1) {
      const f0 = k / 5, f1 = (k + 1) / 5;
      ctx.fillStyle = `rgba(10,8,6,${(0.05 + 0.06 * k).toFixed(2)})`;
      ctx.beginPath();
      ctx.moveTo(T.x + ao.x * f0, T.y + ao.y * f0);
      ctx.lineTo(T.x + ao.x * f0 + ao2.x, T.y + ao.y * f0 + ao2.y);
      ctx.lineTo(T.x + ao.x * f1 + ao2.x, T.y + ao.y * f1 + ao2.y);
      ctx.lineTo(T.x + ao.x * f1, T.y + ao.y * f1);
      ctx.closePath();
      ctx.fill();
    }
    for (const f of [0.2, 0.4, 0.6, 0.8]) {
      const ax = T.x + ao.x * f, ay = T.y + ao.y * f;
      ctx.strokeStyle = 'rgba(10,8,6,.75)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + ao2.x, ay + ao2.y); ctx.stroke();
      ctx.strokeStyle = 'rgba(214,200,168,.6)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ax, ay - 2); ctx.lineTo(ax + ao2.x, ay + ao2.y - 2); ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Veios de minério (ouro, prata azulada), musgo e manchas de umidade nas faces da parede de caverna. Sorteio fixo da casa:
   * a mesma parede sai igual toda vez. Os veios descem em zigue-zague e só entram no pedaço da face que aparece (a vizinha da
   * frente mais baixa).
   */
  decorarParedeDeCaverna(ctx, x, y, sx, sy, hgt) {
    const sorte = sorteio(x * 13 + 7, y * 17 + 3, 100);
    if (sorte >= 30) return;
    const v = this.toView(x, y);
    const frente = (dvx, dvy) => {
      const p = this.fromView(v.vx + dvx, v.vy + dvy);
      return this.field.inside(p.x, p.y) ? this.alturaVisual(p.x, p.y) : 0;
    };
    const esq = sorteio(x * 5 + 1, y * 3 + 9, 2) === 0;
    const aparece = (esq ? hgt - frente(0, 1) : hgt - frente(1, 0)) * LIFT;
    if (aparece < 8) return;
    const ponto = (u, dv) => (esq
      ? { px: sx - TW / 2 + (TW / 2) * u, py: sy + TH / 2 + (TH / 2) * u + dv }
      : { px: sx + (TW / 2) * u, py: sy + TH - (TH / 2) * u + dv });
    ctx.save();
    // Pixel duro (sem antisserrilhado): cada ponto é um quadrado de 1 ou 2 px, como o resto da arte.
    const pixel = (px, py, lado, cor) => { ctx.fillStyle = cor; ctx.fillRect(Math.round(px), Math.round(py), lado, lado); };
    const linha = (a, b, cor) => {
      const n = Math.max(Math.abs(b.px - a.px), Math.abs(b.py - a.py), 1);
      for (let k = 0; k <= n; k += 1) pixel(a.px + (b.px - a.px) * k / n, a.py + (b.py - a.py) * k / n, 1, cor);
    };
    if (sorte < 22) {
      // veio: ouro (7%), prata azulada (5%), cobre (10%): um zigue-zague curto que desce
      const cor = sorte < 7 ? '#d8b24a' : sorte < 12 ? '#9fc4dc' : '#b8754a';
      let u = 0.2 + sorteio(x + 3, y * 7, 60) / 100;
      let dv = 2 + sorteio(x * 3, y + 5, Math.max(4, Math.round(aparece * 0.4)));
      let a = ponto(u, dv);
      for (let i = 0; i < 3; i += 1) {
        u = Math.min(0.92, Math.max(0.08, u + (sorteio(x + i * 11, y + i * 5, 3) - 1) * 0.13));
        dv = Math.min(aparece - 2, dv + 4 + sorteio(x * 2 + i, y * 2 + i * 3, 5));
        const b = ponto(u, dv);
        linha(a, b, cor);
        a = b;
      }
      pixel(a.px - 1, a.py - 1, 2, '#fff4cf');           // o brilho na ponta do veio
    } else {
      // musgo (e umidade): tufos de 2 a 4 px no pé da face
      for (let i = 0; i < 4; i += 1) {
        const q = ponto(0.12 + sorteio(x + i * 5, y * 9, 74) / 100, Math.max(3, aparece - 3 - sorteio(x * 4 + i, y + i, 6)));
        const cor = i % 2 ? '#3a542c' : '#223420';
        pixel(q.px, q.py, 2, cor);
        pixel(q.px + 2, q.py + 1, 2, cor);
        pixel(q.px - 1, q.py + 1, 1, cor);
      }
    }
    ctx.restore();
  }

  /**
   * O AMBIENTE de um mapa SEM escuridão (de dia): as faíscas das fogueiras e dos braseiros e o reflexo da água, direto no
   * tabuleiro (nos mapas escuros eles vão na tela do brilho, furada pela máscara). Sem fogo nem água não há o que desenhar.
   */
  desenharAmbienteAoLuz(ctx) {
    const amb = emissoresDoAmbiente(this.field);
    if (amb.vazio) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    desenharAmbiente(ctx, this.time, (x, y) => this.center(x, y), amb);
    ctx.restore();
  }

  /**
   * A PROFUNDIDADE do buraco: o losango preto sozinho lê como textura faltando. Nas bordas de trás (as que ficam contra o
   * chão de cima, à esquerda e à direita do vértice de cima) desce uma parede interna que escurece até o breu, e nas
   * bordas da frente corre um fio claro, o lábio. Só entra onde a vizinha NÃO é buraco, então um fosso de várias casas
   * é uma bacia só, sem emenda.
   */
  profundidadeDoFosso(ctx, x, y, sx, sy) {
    const ehFosso = (i, j) => this.field.surfaceAt(x + i, y + j) === 'fosso';
    ctx.save();
    this.diamond(ctx, sx, sy);
    ctx.clip();
    const parede = (ax, ay, bx, by) => {
      const g = ctx.createLinearGradient(0, Math.min(ay, by), 0, Math.min(ay, by) + 26);
      g.addColorStop(0, 'rgba(96,86,70,.98)');
      g.addColorStop(0.5, 'rgba(34,29,24,.95)');
      g.addColorStop(1, 'rgba(4,3,2,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx, by + 26);
      ctx.lineTo(ax, ay + 26);
      ctx.closePath();
      ctx.fill();
    };
    if (!ehFosso(-1, 0)) parede(sx - TW / 2, sy + TH / 2, sx, sy);        // borda de cima à esquerda
    if (!ehFosso(0, -1)) parede(sx, sy, sx + TW / 2, sy + TH / 2);        // borda de cima à direita
    ctx.restore();
    ctx.strokeStyle = 'rgba(206,190,158,.85)';
    ctx.lineWidth = 1.5;
    if (!ehFosso(0, 1)) { ctx.beginPath(); ctx.moveTo(sx - TW / 2, sy + TH / 2); ctx.lineTo(sx, sy + TH); ctx.stroke(); }
    if (!ehFosso(1, 0)) { ctx.beginPath(); ctx.moveTo(sx, sy + TH); ctx.lineTo(sx + TW / 2, sy + TH / 2); ctx.stroke(); }
  }

  /**
   * A altura com que a casa é DESENHADA: a rocha junto de chão ganha a altura que falta para ser PAREDE (`PAREDE_EXTRA`
   * níveis, no máximo, de modo que ela tenha ao menos `PAREDE_ALTURA` níveis acima do chão mais alto que toca). Rocha que já é
   * alta (a do esconderijo, em cima de um planalto) não sobe mais.
   */
  alturaVisual(x, y) {
    const h = this.field.heightAt(x, y);
    if (!(h > 0 && this.field.paredeDeCaverna && this.field.tileAt(x, y) === 1 && this.field.surfaceAt(x, y) === 'rocha')) return h;
    let piso = -1;
    for (let j = -1; j <= 1; j += 1) {
      for (let i = -1; i <= 1; i += 1) {
        if ((i || j) && this.field.inside(x + i, y + j) && this.field.tileAt(x + i, y + j) !== 1) piso = Math.max(piso, this.field.heightAt(x + i, y + j));
      }
    }
    if (piso < 0) return h;
    return piso + Math.max(h - piso, PAREDE_ALTURA);
  }

  drawTile(ctx, x, y, alphaChao = 1, alphaObjeto = alphaChao) {
    // As superfícies novas têm desenho próprio; as antigas seguem pelo código
    // de sempre.
    const sup = this.field.surfaceAt(x, y);
    if (SUPERFICIE[sup]) {
      this.drawSuperficie(ctx, x, y, alphaChao, alphaObjeto, SUPERFICIE[sup]);
      return;
    }
    const kind = this.field.tileAt(x, y);
    // Na superfície antiga a parede É o objeto: esmaece pela regra do objeto.
    // O resto (chão, platô) pela regra do chão.
    const alpha = kind === 1 ? alphaObjeto : alphaChao;
    const hgt = this.field.heightAt(x, y);
    const { sx, sy } = this.iso(x, y, hgt);
    const wall = kind === 1;
    const lift = wall ? LIFT * 1.6 : hgt * LIFT;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (lift > 0) {
      ctx.fillStyle = wall ? WALL_LEFT : SIDE_LEFT;
      ctx.beginPath();
      ctx.moveTo(sx - TW / 2, sy + TH / 2);
      ctx.lineTo(sx, sy + TH);
      ctx.lineTo(sx, sy + TH + lift);
      ctx.lineTo(sx - TW / 2, sy + TH / 2 + lift);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = wall ? WALL_RIGHT : SIDE_RIGHT;
      ctx.beginPath();
      ctx.moveTo(sx + TW / 2, sy + TH / 2);
      ctx.lineTo(sx, sy + TH);
      ctx.lineTo(sx, sy + TH + lift);
      ctx.lineTo(sx + TW / 2, sy + TH / 2 + lift);
      ctx.closePath();
      ctx.fill();
    }

    const pair = TOP_COLORS[kind] ?? TOP_COLORS[0];
    this.diamond(ctx, sx, sy);
    ctx.fillStyle = (x + y) % 2 ? pair[0] : pair[1];
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.22)';
    ctx.stroke();

    if (kind === 2) {
      ctx.strokeStyle = 'rgba(170,215,120,.5)';
      for (let i = 0; i < 5; i++) {
        const bx = sx - 16 + i * 8;
        const by = sy + TH / 2 + ((i % 2) ? 4 : -2);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + 2, by - 9);
        ctx.stroke();
      }
    }
    if (kind === 3) {
      ctx.fillStyle = '#7a6342';
      ctx.fillRect(sx - 13, sy + TH / 2 - 20, 26, 22);
      ctx.fillStyle = '#5a4830';
      ctx.fillRect(sx - 13, sy + TH / 2 - 2, 26, 4);
      ctx.fillStyle = '#8c7450';
      ctx.fillRect(sx - 13, sy + TH / 2 - 20, 26, 3);
    }
    ctx.restore();
  }

  /**
   * Um quadrado de superfície nova: o chão no seu nível, a face lateral se ele
   * estiver elevado, e o que estiver em cima — copa, carroça, cavalo, pedra.
   *
   * É CINZA COM COR, de propósito. Serve para julgar o traçado — largura da
   * estrada, onde caem os degraus, por onde os goblins atiram — antes de gastar
   * geração em arte. Errar o traçado depois da arte pronta custa a arte.
   */
  drawSuperficie(ctx, x, y, alphaChao, alphaObjeto, s) {
    const hgt = this.alturaVisual(x, y);
    const { sx, sy } = this.iso(x, y, hgt);
    const lift = hgt * LIFT;
    ctx.save();
    ctx.globalAlpha = alphaChao;

    // A ponte tem desenho próprio, alinhado à grade (`desenharPonte`).
    if (s.objeto === 'ponte') {
      this.desenharPonte(ctx, x, y, s);
      ctx.restore();
      return;
    }

    // Faces desenhadas (alvenaria, penhasco): uma faixa de um nível por vez,
    // da de cima para baixo, até o chão. Sem o atlas, as de cor lisa abaixo.
    const faixa = lift > 0 && s.face && faixaDaFace(s.face, 'esq', x, y, 0);
    if (faixa) {
      ctx.imageSmoothingEnabled = false;
      // Só os níveis que aparecem: a face da esquerda fica atrás da vizinha
      // de vista (vx, vy+1), a da direita atrás da (vx+1, vy). Sem o corte
      // eram ~5 mil faixas por quadro na mansão; com ele, ~500.
      const v = this.toView(x, y);
      const frente = (dvx, dvy) => {
        const p = this.fromView(v.vx + dvx, v.vy + dvy);
        return this.field.inside(p.x, p.y) ? this.alturaVisual(p.x, p.y) : 0;
      };
      const visiveis = { esq: hgt - frente(0, 1), dir: hgt - frente(1, 0) };
      for (let n = 0; n < hgt; n++) {
        const oy = sy + TH / 2 + n * LIFT;
        for (const lado of ['esq', 'dir']) {
          if (n >= visiveis[lado]) continue;
          const f = faixaDaFace(s.face, lado, x, y, n);
          ctx.drawImage(f.img, f.sx, f.sy, f.w, f.h, lado === 'esq' ? sx - TW / 2 : sx, oy, f.w, f.h);
        }
      }
    } else if (lift > 0) {
      // A face lateral do barranco é TERRA, não grama: é o degrau marrom que
      // separa o alto do barranco da estrada.
      ctx.fillStyle = s.lado[0];
      ctx.beginPath();
      ctx.moveTo(sx - TW / 2, sy + TH / 2);
      ctx.lineTo(sx, sy + TH);
      ctx.lineTo(sx, sy + TH + lift);
      ctx.lineTo(sx - TW / 2, sy + TH / 2 + lift);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = s.lado[1];
      ctx.beginPath();
      ctx.moveTo(sx + TW / 2, sy + TH / 2);
      ctx.lineTo(sx, sy + TH);
      ctx.lineTo(sx, sy + TH + lift);
      ctx.lineTo(sx + TW / 2, sy + TH / 2 + lift);
      ctx.closePath();
      ctx.fill();
    }

    // A PAREDE DE CAVERNA ganha veios de minério, musgo e manchas, por sorteio da casa: sem isso a rocha são quatro
    // faces repetidas em fileira.
    if (this.field.paredeDeCaverna && s.chao === 'rocha' && hgt > 0 && this.field.tileAt(x, y) === 1) this.decorarParedeDeCaverna(ctx, x, y, sx, sy, hgt);

    // O ladrilho desenhado, 1:1: o losango do atlas tem os mesmos 64 x 32 do
    // motor, e o canto da célula fica meia largura à esquerda do vértice de
    // cima. A grade NÃO vem da arte — o montador limpa a aresta de cada
    // ladrilho — e sim do traço abaixo, igual em toda superfície.
    // O chão de uma casa de SALA é laje, mesmo quando o objeto que está nela
    // pinta grama ou caverna por baixo (barril, leito, baú): era o remendo de
    // capim no meio do piso de uma casa de pedra.
    // O piso de DENTRO de cada construcao vem do mapa (`pisoDeSala`: laje rachada ou
    // tabua apodrecida), e vale por baixo de tudo o que estiver na casa.
    const salaDaCasa = this.field.sala?.get(`${x},${y}`);
    const pisoDaSala = salaDaCasa && this.field.pisoDeSala?.get(salaDaCasa);
    // Em casa de tabua, as marcas de laje (cacos, musgo) saem: ficariam um remendo de pedra no assoalho.
    const MARCA_DE_LAJE = ['ossos', 'mancha', 'cacos', 'musgoChao'];
    const chaoDe = (salaDaCasa && (s.chao === 'grama' || s.chao === 'caverna' || s.chao === 'laje'
      || (pisoDaSala === 'tabua' && MARCA_DE_LAJE.includes(s.chao))))
      ? (pisoDaSala && ladrilhoChao(pisoDaSala, 0, 0) ? this.pisoSorteado(pisoDaSala, x, y) : 'laje')
      // Mobília fora de casa (a cerca do campo) pisa em capim, não na laje do castelo.
      : (s.objeto === 'prop' && !salaDaCasa ? (this.varianteDaProp(x, y)?.piso ?? 'grama')
        // braseiro de caverna fora de sala pisa no chão da mina, não na laje de castelo
        : (this.field.paredeDeCaverna && !salaDaCasa && (s.objeto === 'braseiro' || s.objeto === 'braseiroFrio') ? 'mina'
          : (this.field.paredeDeCaverna && s.chao === 'rocha' ? 'rochaMina'
            : (this.field.paredeDeCaverna && s.chao === 'teia' ? (salaDaCasa ? 'lajeMina' : 'mina') : s.chao))));
    const lad = (s.topoBloco && topoDoBloco(s.topoBloco, x, y)) || (chaoDe && ladrilhoChao(chaoDe, x, y));
    if (lad) {
      ctx.imageSmoothingEnabled = false;
      // ESPELHAR POR CASA dobra a variação sem arte nova: o losango é
      // simétrico na largura, então a imagem virada continua encaixando na
      // grade, e a mancha que antes repetia na mesma diagonal some. Sete
      // ladrilhos viram catorze.
      if (sorteio(x * 3 + 1, y * 7 + 5, 2)) {
        ctx.save();
        ctx.translate(sx + TW / 2, sy);
        ctx.scale(-1, 1);
        ctx.drawImage(lad.img, lad.sx, lad.sy, lad.w, lad.h, 0, 0, lad.w, lad.h);
        ctx.restore();
      } else {
        ctx.drawImage(lad.img, lad.sx, lad.sy, lad.w, lad.h, sx - TW / 2, sy, lad.w, lad.h);
      }
      // OS TUFOS: detalhes de capim (flor, cogumelo, pedrinha, graveto) espalhados por sorteio de casa
      // no gramado liso. Só desenho: nenhuma regra do chão muda, e a casa com objeto não leva tufo.
      if (this.field.fachadaFechada && s.chao === 'grama' && !s.objeto && !this.field.sala?.has(`${x},${y}`)
        && sorteio(x * 7 + 3, y * 11 + 5, 100) < 16) {
        const tufo = spriteCenario('tufo', ['todas'], x, y);
        if (tufo) {
          const tx = sx + (sorteio(x + 11, y + 23, 25) - 12);
          const ty = sy + TH / 2 + (sorteio(x + 31, y + 7, 9) - 4);
          ctx.drawImage(tufo.img, tufo.x, tufo.y, tufo.w, tufo.h,
            Math.round(tx - tufo.ax), Math.round(ty - tufo.ay), tufo.w, tufo.h);
        }
      }
      // A TINTA DA SALA. O castelo inteiro é a mesma laje, e sala igual de
      // ponta a ponta lê como papel de parede. Em vez de um piso novo por
      // sala — que é arte nova para cada uma — cada sala puxa a MESMA laje
      // para um lado: o covil do urso para o terroso, o santuário para o
      // frio, o banquete para a gordura velha. É pouco e é de graça, e a
      // porta entre duas salas passa a ser uma troca de ambiente.
      const tinta = TINTA_DE_SALA[this.field.sala?.get(`${x},${y}`)];
      if (tinta) {
        this.diamond(ctx, sx, sy);
        ctx.fillStyle = tinta;
        ctx.fill();
      }
    } else {
      this.diamond(ctx, sx, sy);
      ctx.fillStyle = (x + y) % 2 ? s.topo[0] : s.topo[1];
      ctx.fill();
    }
    // Chão de mata é chão à sombra: escurece a grama debaixo da copa. É a
    // faixa escura onde a mata encontra o gramado, e é ela que diz, de longe,
    // onde começa a casa que não dá para atravessar.
    if (s.objeto === 'copa') {
      this.diamond(ctx, sx, sy);
      ctx.fillStyle = 'rgba(8,18,10,.42)';
      ctx.fill();
    }
    this.diamond(ctx, sx, sy);
    ctx.strokeStyle = 'rgba(0,0,0,.16)';
    ctx.stroke();
    if (s.chao === 'fosso') this.profundidadeDoFosso(ctx, x, y, sx, sy);
    if (this.field.paredeDeCaverna && s.chao === 'teia') this.desenharTeia(ctx, sx, sy, x, y);
    const degrau = this.field.degraus?.get(`${x},${y}`);
    if (degrau) this.desenharDegraus(ctx, sx, sy, degrau);
    ctx.restore();

    // O OBJETO NÃO É DESENHADO AGORA.
    //
    // Se fosse, a casa vizinha na mesma diagonal — desenhada logo depois —
    // pintaria o chão dela por cima da metade de baixo da copa: uma árvore de
    // 80 px de largura passa 16 px para cada lado da própria casa. Com o
    // círculo provisório isso mal aparecia; com o carvalho de verdade, a borda
    // da mata sairia com um corte reto em cada copa.
    //
    // Então o objeto entra numa fila, e a fila é descarregada quando a
    // diagonal termina, ANTES das criaturas dessa diagonal. A ordem de
    // profundidade continua a mesma — quem está atrás, quem está na frente —,
    // só deixa de haver chão por cima de objeto.
    if (s.objeto) (this._adiados ??= []).push([x, y, alphaObjeto, s]);
  }

  /**
   * A PONTE, casa por casa e alinhada à grade.
   *
   * O sprite inteiro do PixelLab vinha numa perspectiva própria: as bordas
   * dele não batiam com o ângulo das casas e a ponte parecia torta. Então ela
   * é montada aqui com peças que JÁ seguem o losango: o riacho no nível 0
   * embaixo, o tabuleiro de tábuas do atlas do chão (PixelLab) no nível da
   * ponte, uma espessura fina de viga, e postes com corda nas duas bordas
   * compridas. As tábuas correm atravessadas ao caminho — o desenho é
   * espelhado quando a câmera gira e o caminho muda de diagonal na tela.
   *
   * O eixo do caminho vem da anotação do mapa (`objetos`, tipo 'ponte').
   */
  desenharPonte(ctx, x, y, s) {
    const hgt = this.field.heightAt(x, y);
    const { sx, sy } = this.iso(x, y, hgt);
    const tela = (fx, fy, h) => {
      const { vx, vy } = this.toView(fx, fy);
      return { px: this.ox + (vx - vy) * (TW / 2), py: this.oy + (vx + vy) * (TH / 2) - h * LIFT + TH / 2 };
    };
    ctx.imageSmoothingEnabled = false;

    // A anotação desta ponte: a da mesma fileira ou coluna da casa.
    const anot = this.field.objetos?.find((o) => o.tipo === 'ponte' && (o.olha?.dx ? o.y === y : o.x === x))
      ?? this.field.objetos?.find((o) => o.tipo === 'ponte');
    // Embaixo, a água (ou o que o mapa disser: a fenda da mansão é pedregulho).
    const agua = ladrilhoChao(anot?.fundo ?? 'riacho', x, y);
    const fundo = this.iso(x, y, 0);
    if (agua) ctx.drawImage(agua.img, agua.sx, agua.sy, agua.w, agua.h, fundo.sx - TW / 2, fundo.sy, agua.w, agua.h);

    // A espessura do tabuleiro: uma viga de 5 px nas duas faces da frente.
    const VIGA = 5;
    for (const [lado, cor] of [[-1, '#3f2c19'], [1, '#2e2012']]) {
      ctx.fillStyle = cor;
      ctx.beginPath();
      ctx.moveTo(sx + lado * TW / 2, sy + TH / 2);
      ctx.lineTo(sx, sy + TH);
      ctx.lineTo(sx, sy + TH + VIGA);
      ctx.lineTo(sx + lado * TW / 2, sy + TH / 2 + VIGA);
      ctx.closePath();
      ctx.fill();
    }

    // O eixo do caminho e o lado (normal) das bordas com corrimão.
    const t = anot?.olha ?? { dx: 0, dy: 1 };
    const n = { dx: t.dy, dy: t.dx };
    // Tábuas atravessadas ao caminho: na tela, na direção da normal. O
    // ladrilho do atlas tem as tábuas em "\"; se a normal cai em "/", espelha.
    const nv = this.rotateVec(n.dx, n.dy);
    const barra = (nv.dx - nv.dy) * (nv.dx + nv.dy) > 0;   // true: "\" na tela
    const lad = ladrilhoChao('ponte', x, y);
    ctx.save();
    if (!barra) { ctx.translate(sx * 2, 0); ctx.scale(-1, 1); }
    if (lad) ctx.drawImage(lad.img, lad.sx, lad.sy, lad.w, lad.h, sx - TW / 2, sy, lad.w, lad.h);
    else {
      this.diamond(ctx, sx, sy);
      ctx.fillStyle = s.topo[(x + y) % 2];
      ctx.fill();
    }
    ctx.restore();

    // Postes e corda nas bordas que não continuam em ponte.
    const ehPonte = (xx, yy) => this.field.surfaceAt(xx, yy) === 'ponte';
    for (const k of [1, -1]) {
      if (ehPonte(x + k * n.dx, y + k * n.dy)) continue;
      const a = tela(x + k * n.dx / 2 - t.dx / 2, y + k * n.dy / 2 - t.dy / 2, hgt);
      const b = tela(x + k * n.dx / 2 + t.dx / 2, y + k * n.dy / 2 + t.dy / 2, hgt);
      const ALTO = 13;
      ctx.strokeStyle = '#b8a77a';
      ctx.lineWidth = 1;
      for (const alt of [ALTO - 2, ALTO - 7]) {
        ctx.beginPath();
        ctx.moveTo(a.px, a.py - alt);
        ctx.quadraticCurveTo((a.px + b.px) / 2, (a.py + b.py) / 2 - alt + 4, b.px, b.py - alt);
        ctx.stroke();
      }
      for (const p of [a, b]) {
        ctx.fillStyle = '#3e2a1b';
        ctx.fillRect(Math.round(p.px - 2), Math.round(p.py - ALTO), 4, ALTO + 2);
        ctx.fillStyle = '#85603d';
        ctx.fillRect(Math.round(p.px - 2), Math.round(p.py - ALTO), 1, ALTO + 1);
        ctx.fillStyle = '#ab8558';
        ctx.fillRect(Math.round(p.px - 2), Math.round(p.py - ALTO - 1), 4, 1);
      }
    }
  }

  /** Desenha os objetos que esperavam o fim da diagonal. */
  descarregarObjetos(ctx) {
    if (!this._adiados?.length) return;
    for (const [x, y, alpha, s] of this._adiados) this.desenharObjeto(ctx, x, y, alpha, s);
    this._adiados.length = 0;
  }

  /** O objeto de uma casa de superfície nova, com a transparência dele. */
  desenharObjeto(ctx, x, y, alphaObjeto, s) {
    const hgt = this.field.heightAt(x, y);
    const { sx, sy } = this.iso(x, y, hgt);
    ctx.save();
    ctx.globalAlpha = alphaObjeto;
    let cx = sx;
    let cy = sy + TH / 2;
    let eixo = 0;
    let dirigido = null;   // sprite de objeto com direção (carroça, cavalo)
    if (MULTICASA.has(s.objeto)) {
      // Só a casa da FRENTE da pegada desenha, e desenha no centro dela. Assim
      // o objeto inteiro sai por cima das próprias casas de trás, que já foram
      // desenhadas nesta passada.
      const p = this.pegadaDe(x, y);
      if (!p || !this.ehFrenteDaPegada(x, y, p)) { ctx.restore(); return; }
      const centros = p.map((c) => this.center(c.x, c.y));
      cx = centros.reduce((a, c) => a + c.sx, 0) / centros.length;
      cy = centros.reduce((a, c) => a + c.sy, 0) / centros.length;
      // O eixo do objeto na tela, para o comprido (cavalo) deitar certo em
      // qualquer rotação da câmera.
      const a = centros[0];
      const b = centros[centros.length - 1];
      eixo = Math.atan2(b.sy - a.sy, b.sx - a.sx);
      dirigido = this.spriteDirecional(s.objeto, this.anotacaoDe(p));
    }
    if (dirigido) {
      // A arte do PixelLab, 1:1, com a âncora no centro da pegada.
      const ox = Math.round(cx - dirigido.ax);
      const oy = Math.round(cy - dirigido.ay);
      // A SOMBRA DE CONTATO. Sem ela o altar, a cama e a banheira pairam um
      // palmo acima da laje: o olho usa a sombra para decidir o que está
      // apoiado. Uma elipse na pegada inteira, antes do sprite.
      const raio = Math.max(dirigido.w * 0.34, 12);
      const som = ctx.createRadialGradient(cx, cy + 2, 2, cx, cy + 2, raio);
      som.addColorStop(0, 'rgba(8,6,4,.42)');
      som.addColorStop(1, 'rgba(8,6,4,0)');
      ctx.fillStyle = som;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, raio, raio / 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Prédio e móvel alto esmaecem quando cobrem alguém atrás, como a
      // árvore alta.
      if (ESMAECE.has(s.objeto)) {
        const v = this.toView(x, y);
        if (this.cobreFigura(ox, oy, dirigido.w, dirigido.h, v.vx + v.vy)
          || this._esmaecer?.has(`${x},${y}`)) ctx.globalAlpha = TRANSLUCIDO;
      }
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(dirigido.img, dirigido.x, dirigido.y, dirigido.w, dirigido.h, ox, oy, dirigido.w, dirigido.h);
      ctx.restore();
      return;
    }
    // ÁRVORE ALTA, QUANDO HOUVER. Uma a cada quatro casas de mata, num
    // quinconce, com copa de duas casas de largura cobrindo as vizinhas. As
    // casas sem árvore desenhada continuam sendo mata pela regra — bloqueiam
    // passo e visão —; o que muda é só quantas árvores se desenha.
    const alta = s.objeto === 'copa' && spriteCenario('arvore-alta', ['todas'], x, y);
    if (alta) {
      if (!this.temArvoreAlta(x, y)) { ctx.restore(); return; }
      const { ox, oy } = this.posArvoreAlta(x, y, alta);
      // Esmaece se a árvore cobre, na tela, alguém que está atrás dela — ou a
      // casa sob o cursor, ou o destino do caminho. Com 150 px de altura a
      // copa alcança umas oito diagonais para trás, e a vizinhança fixa de
      // `transparenciaDaCasa` olha só duas.
      const v = this.toView(x, y);
      if (this.cobreFigura(ox, oy, alta.w, alta.h, v.vx + v.vy)
        || this._esmaecer?.has(`${x},${y}`)) ctx.globalAlpha = TRANSLUCIDO;
      ctx.fillStyle = 'rgba(0,0,0,.28)';
      ctx.beginPath();
      ctx.ellipse(cx + 8, cy + 3, 44, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(alta.img, alta.x, alta.y, alta.w, alta.h, ox, oy, alta.w, alta.h);
      ctx.restore();
      return;
    }
    const prop = s.objeto === 'prop' ? this.varianteDaProp(x, y) : null;
    // As peças animadas (a lareira, a roda d'água) têm vários quadros: o tempo escolhe o quadro, e não o sorteio da casa.
    const fps = PROP_ANIMADA[prop?.grupo];
    const quadroDoFogo = fps ? Math.floor(this.time * fps) : null;
    const baixo = SOMBRA_DO_BAIXO[s.objeto] && spriteCenario(prop?.grupo ?? s.objeto, ['todas'], x, y, quadroDoFogo);
    if (baixo && prop?.grupo === 'prop-taverna-nada') { ctx.restore(); return; }   // só ocupa o chão: nada a desenhar nem sombra
    if (baixo) {
      // Moita, pedra, estalagmite, mantimentos ou espinheiro do PixelLab, 1:1,
      // com o centro da base no centro da casa. A sombra acompanha a largura.
      const r = SOMBRA_DO_BAIXO[s.objeto];
      // Peça de parede, balcão e escada já trazem a sombra no desenho: a elipse seria uma mancha.
      if (!/^prop-taverna-(lareira|prateleira|balcao|escada)/.test(prop?.grupo ?? '')) {
        ctx.fillStyle = 'rgba(0,0,0,.25)';
        ctx.beginPath();
        ctx.ellipse(cx + 3, cy + 2, r, r * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.imageSmoothingEnabled = false;
      const chama = CHAMA[prop?.grupo ?? s.objeto];
      const fase = (x * 1.7 + y * 2.9) % 6.28;
      if (prop?.espelhar) {
        // De lado: o ponto de ancoragem da peça continua caindo no centro da casa.
        ctx.translate(cx, 0);
        ctx.scale(-1, 1);
        const px = Math.round(-baixo.ax - baixo.dx);
        const py = Math.round(cy - baixo.ay + baixo.dy);
        if (chama) desenharChama(ctx, baixo, px, py, this.time, chama, fase);
        else ctx.drawImage(baixo.img, baixo.x, baixo.y, baixo.w, baixo.h, px, py, baixo.w, baixo.h);
      } else {
        const px = Math.round(cx - baixo.ax + baixo.dx);
        const py = Math.round(cy - baixo.ay + baixo.dy);
        if (chama) desenharChama(ctx, baixo, px, py, this.time, chama, fase);
        else ctx.drawImage(baixo.img, baixo.x, baixo.y, baixo.w, baixo.h, px, py, baixo.w, baixo.h);
      }
      ctx.restore();
      return;
    }
    const arvore = s.objeto === 'copa'
      && spriteCenario('arvore', this.bordaDaMata(x, y) ? ['borda'] : ['borda', 'miolo'], x, y);
    if (arvore) {
      // O carvalho do PixelLab, 1:1, com o pé do tronco no centro da casa.
      // Sombra lisa embaixo, desenhada pelo motor e não pela arte: deslocada
      // para a direita e para baixo, porque a luz vem do alto à esquerda.
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.beginPath();
      ctx.ellipse(cx + 4, cy + 2, 26, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(arvore.img, arvore.x, arvore.y, arvore.w, arvore.h,
        Math.round(cx - arvore.ax + arvore.dx), Math.round(cy - arvore.ay + arvore.dy),
        arvore.w, arvore.h);
    } else if (s.objeto === 'copa') {
      // Recuo enquanto o atlas não carrega: a copa provisória em canvas.
      // Duas elipses, sombra embaixo e luz em cima à esquerda.
      const alto = LIFT * 1.5;
      ctx.fillStyle = 'rgba(0,0,0,.28)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, 26, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#26472a';
      ctx.beginPath();
      ctx.ellipse(cx, cy - alto, 30, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#356138';
      ctx.beginPath();
      ctx.ellipse(cx - 6, cy - alto - 5, 21, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#47784a';
      ctx.beginPath();
      ctx.ellipse(cx - 10, cy - alto - 10, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (s.objeto === 'seteira') {
      // A fenda dos arqueiros: um rasgo escuro no meio do bloco de pedra.
      ctx.fillStyle = '#141210';
      ctx.fillRect(cx - 3, cy - 10, 6, 12);
    } else if (s.objeto === 'escada') {
      // Escada de cordas: dois montantes e degraus, encostada no paredão.
      ctx.strokeStyle = '#6b4a2c';
      ctx.lineWidth = 2;
      for (const ox of [-7, 7]) { ctx.beginPath(); ctx.moveTo(cx + ox, cy + 6); ctx.lineTo(cx + ox, cy - 34); ctx.stroke(); }
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(cx - 7, cy + 2 - i * 6); ctx.lineTo(cx + 7, cy + 2 - i * 6); ctx.stroke(); }
      ctx.lineWidth = 1;
    } else if (s.objeto === 'tenda') {
      // Recuo enquanto o atlas não carrega: um pavilhão listrado.
      this.caixaIso(ctx, cx, cy, 52, 26, 30, ['#7a2a2a', '#a8473a', '#d9b05a']);
    } else if (s.objeto === 'pocoVelho') {
      this.caixaIso(ctx, cx, cy, 18, 9, 12, ['#56575a', '#77766f', '#1b393f']);
    } else if (s.objeto === 'casa' || s.objeto === 'taverna') {
      // Recuo enquanto o atlas não carrega: um bloco com telhado escuro.
      this.caixaIso(ctx, cx, cy, 80, 40, s.objeto === 'taverna' ? 70 : 52, ['#77766f', '#9e998b', '#463d3c']);
    } else if (s.objeto === 'carroca') {
      // Uma caixa só sobre as quatro casas, com as quatro rodas nos cantos.
      // Provisório até a arte do PixelLab.
      this.caixaIso(ctx, cx, cy, 46, 23, 22, ['#6b4a2c', '#82603a', '#9a7448']);
      ctx.fillStyle = '#2a1e14';
      for (const [ox, oy] of [[-34, 2], [34, 2], [-12, 14], [12, 14]]) {
        ctx.beginPath();
        ctx.ellipse(cx + ox, cy + oy, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (s.objeto === 'cavalo') {
      // Corpo caído ao longo do eixo das duas casas, com duas flechas.
      // Provisório até a arte do PixelLab.
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 3, 34, 11, eixo, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3d3540';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 4, 32, 11, eixo, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#524858';
      ctx.beginPath();
      ctx.ellipse(cx - 6, cy - 8, 18, 5, eixo, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d8cdb0';
      ctx.lineWidth = 1.5;
      for (const ox of [-8, 8]) {
        ctx.beginPath();
        ctx.moveTo(cx + ox, cy - 10);
        ctx.lineTo(cx + ox + 6, cy - 22);
        ctx.stroke();
      }
      ctx.lineWidth = 1;
    } else if (s.objeto === 'arbusto') {
      // Mais baixo e mais largo que a copa, e em tufos: três massas em vez de
      // uma. Precisa ler como "dá para se esconder atrás", não como árvore
      // pequena — por isso não sobe, espalha.
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 3, 24, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      for (const [ox, oy, r] of [[-11, -6, 11], [10, -5, 12], [0, -12, 12]]) {
        ctx.fillStyle = '#2f5530';
        ctx.beginPath();
        ctx.ellipse(cx + ox, cy + oy, r, r * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#41703f';
        ctx.beginPath();
        ctx.ellipse(cx + ox - 3, cy + oy - 3, r * 0.55, r * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (s.objeto === 'pedra') {
      this.caixaIso(ctx, cx, cy, 13, 8, 10, ['#5d5e66', '#77787f', '#93949a']);
    } else if (s.objeto === 'estalagmite') {
      // Um cone de pedra, mais alto que largo. Provisório até a arte.
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      ctx.beginPath();
      ctx.ellipse(cx + 3, cy + 2, 15, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      for (const [cor, lado] of [['#4a443e', -1], ['#6a625a', 1]]) {
        ctx.fillStyle = cor;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 40);
        ctx.lineTo(cx + lado * 13, cy);
        ctx.lineTo(cx, cy + 4);
        ctx.closePath();
        ctx.fill();
      }
    } else if (s.objeto === 'mantimentos') {
      // Caixotes e sacos empilhados: o que o bando roubou das carroças.
      this.caixaIso(ctx, cx - 6, cy + 2, 12, 7, 14, ['#5e4228', '#7a5833', '#94703f']);
      this.caixaIso(ctx, cx + 9, cy - 2, 9, 5, 10, ['#6b5a3c', '#8a7550', '#a68f63']);
    } else if (s.objeto === 'mesa') {
      this.caixaIso(ctx, cx, cy, 20, 10, 12, ['#4a3220', '#5e4029', '#85603d']);
    } else if (s.objeto === 'sarcofago') {
      this.caixaIso(ctx, cx, cy, 24, 12, 14, ['#4b4a46', '#605f59', '#7d7a70']);
    } else if (s.objeto === 'grade') {
      // Barras verticais sobre a casa: lê como grade, deixa ver quem está atrás.
      ctx.strokeStyle = '#3a3b40';
      ctx.lineWidth = 2;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 7, cy + 4 - Math.abs(i) * 2);
        ctx.lineTo(cx + i * 7, cy - 30 - Math.abs(i) * 2);
        ctx.stroke();
      }
      ctx.lineWidth = 1;
    } else if (s.objeto === 'portaMadeira' || s.objeto === 'portaAberta' || s.objeto === 'passagemAberta') {
      this.desenharPortaDeCasa(ctx, x, y, cx, cy, hgt, s.objeto);
    } else if (s.objeto === 'espinheiro') {
      // Galhos baixos e emaranhados, com espinho: terreno difícil, não cobertura.
      ctx.strokeStyle = '#3c4a26';
      ctx.lineWidth = 2;
      for (const [ox, oy, a] of [[-14, 2, -0.6], [-4, 5, 0.4], [6, 1, -0.3], [14, 4, 0.7], [0, -2, 0]]) {
        ctx.beginPath();
        ctx.moveTo(cx + ox, cy + oy);
        ctx.quadraticCurveTo(cx + ox + 6 * Math.sin(a), cy + oy - 10, cx + ox + 10 * Math.sin(a + 0.6), cy + oy - 14);
        ctx.stroke();
      }
      ctx.lineWidth = 1;
    }
    ctx.restore();
  }

  /**
   * A PORTA QUE É A CASA INTEIRA (a mansão: a porta trancada, a do alojamento e as secretas): não há aresta para pôr o arco,
   * então o desenho vai na casa. Fechada, é a folha de madeira com ferragens: no topo do bloco e nas faces que o grupo vê
   * (a vizinha livre, mais baixa). Aberta, a folha fica encostada na parede de trás; a secreta achada é uma laje de pedra
   * girada para o lado. O eixo da passagem sai dos vizinhos livres, e o desenho acompanha a rotação da câmera.
   */
  desenharPortaDeCasa(ctx, x, y, cx, cy, hgt, tipo) {
    const f = this.field;
    const livre = (nx, ny) => f.inside(nx, ny) && f.tileAt(nx, ny) !== 1;
    const noX = livre(x - 1, y) && livre(x + 1, y);
    const eixo = noX ? [1, 0] : [0, 1];
    const plano = noX ? [0, 1] : [1, 0];
    const o = this.iso(x, y, 0);
    const passo = ([dx, dy]) => { const p = this.iso(x + dx, y + dy, 0); return { x: p.sx - o.sx, y: p.sy - o.sy }; };
    const ex = passo(eixo);
    const ep = passo(plano);
    const ponto = (a, b, c0 = { x: cx, y: cy }) => ({ x: c0.x + ex.x * a + ep.x * b, y: c0.y + ex.y * a + ep.y * b });
    const poligono = (pts, cor) => {
      ctx.fillStyle = cor;
      ctx.beginPath();
      pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
      ctx.closePath();
      ctx.fill();
    };
    const risco = (a, b, cor, larg = 1) => {
      ctx.strokeStyle = cor;
      ctx.lineWidth = larg;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };
    ctx.imageSmoothingEnabled = false;
    if (tipo === 'portaMadeira') {
      // O topo fica de pedra (o bloco já o pintou): com tampo de tábuas a porta lia como caixote.
      // As faces que aparecem: a folha cobre a altura toda da parede.
      const v = this.toView(x, y);
      for (const [lado, dvx, dvy] of [['dir', 1, 0], ['esq', 0, 1]]) {
        const n = this.fromView(v.vx + dvx, v.vy + dvy);
        if (!livre(n.x, n.y)) continue;
        const dh = (hgt - this.alturaVisual(n.x, n.y)) * LIFT;
        if (dh <= 2) continue;
        const A = { x: cx + (lado === 'dir' ? TW / 2 : -TW / 2), y: cy };
        const B = { x: cx, y: cy + TH / 2 };
        const P = (u, w) => ({ x: A.x + (B.x - A.x) * u, y: A.y + (B.y - A.y) * u + w });
        // A moldura de pedra mais escura em volta, e a folha com verga em arco baixo.
        poligono([P(0.04, 0), P(0.96, 0), P(0.96, dh), P(0.04, dh)], '#3a352f');
        poligono([P(0.12, dh * 0.12), P(0.88, dh * 0.12), P(0.88, dh), P(0.12, dh)], lado === 'dir' ? '#4a3321' : '#5b4028');
        for (let u = 0.24; u < 0.86; u += 0.15) risco(P(u, dh * 0.12), P(u, dh), 'rgba(22,16,10,.7)');
        risco(P(0.12, dh * 0.36), P(0.88, dh * 0.36), '#2b2622', 2);
        risco(P(0.12, dh * 0.78), P(0.88, dh * 0.78), '#2b2622', 2);
        risco(P(0.04, dh * 0.12), P(0.96, dh * 0.12), '#8d8778', 2);
        ctx.strokeStyle = '#8a7648';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const an = P(0.7, dh * 0.55);
        ctx.arc(an.x, an.y, 2.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      return;
    }
    // Aberta: a folha encostada na parede de TRÁS (a de menor y na tela), pela metade do vão.
    const lado = ep.y > 0 ? -1 : 1;
    const base = (a) => ponto(a, lado * 0.4);
    const alt = LIFT - 3;
    const sobe = (q) => ({ x: q.x, y: q.y - alt });
    const a0 = base(-0.42);
    const a1 = base(0.12);
    // A sombra da folha no chão, e depois a folha.
    poligono([a0, a1, { x: a1.x - ep.x * lado * 0.18, y: a1.y - ep.y * lado * 0.18 }, { x: a0.x - ep.x * lado * 0.18, y: a0.y - ep.y * lado * 0.18 }], 'rgba(0,0,0,.28)');
    if (tipo === 'portaAberta') {
      poligono([a0, a1, sobe(a1), sobe(a0)], '#4f3825');
      for (let k = 0.14; k < 0.95; k += 0.2) risco({ x: a0.x + (a1.x - a0.x) * k, y: a0.y + (a1.y - a0.y) * k }, sobe({ x: a0.x + (a1.x - a0.x) * k, y: a0.y + (a1.y - a0.y) * k }), 'rgba(22,16,10,.7)');
      risco(sobe(a0), sobe(a1), '#7a5b38', 1);
      risco({ x: a0.x, y: a0.y - alt * 0.25 }, { x: a1.x, y: a1.y - alt * 0.25 }, '#2b2622', 2);
      risco({ x: a0.x, y: a0.y - alt * 0.75 }, { x: a1.x, y: a1.y - alt * 0.75 }, '#2b2622', 2);
    } else {
      // A laje girada: pedra lisa com o fio de cima claro e uma rachadura.
      poligono([a0, a1, sobe(a1), sobe(a0)], '#6d6a62');
      poligono([sobe(a0), sobe(a1), { x: sobe(a1).x, y: sobe(a1).y + 2 }, { x: sobe(a0).x, y: sobe(a0).y + 2 }], '#a39f92');
      risco({ x: a0.x + (a1.x - a0.x) * 0.3, y: a0.y + (a1.y - a0.y) * 0.3 - alt * 0.9 }, { x: a0.x + (a1.x - a0.x) * 0.55, y: a0.y + (a1.y - a0.y) * 0.55 - alt * 0.35 }, 'rgba(20,18,16,.7)');
      risco(a0, a1, 'rgba(20,18,16,.6)');
    }
  }

  /**
   * Esta casa de mata recebe uma árvore alta desenhada?
   *
   * Quinconce de densidade 1/4: fileiras pares, colunas pares nas fileiras
   * múltiplas de 4 e ímpares nas outras. Na tela isso dá uma árvore a cada
   * 128 px numa fileira, com a fileira seguinte deslocada de meio passo — a
   * copa de ~140 px fecha a massa sem alinhar as árvores em grade.
   */
  temArvoreAlta(x, y) {
    if (y % 2 === 0 && (x + (y % 4 === 2 ? 1 : 0)) % 2 === 0) return true;
    // A FRENTE DA MATA (a borda sul e leste, e a do mapa): a copa sobe para trás, então a casa da frente ficava só com o chão
    // escurecido, sem tronco. Nela a árvore entra também fora do quincunce, de duas em duas casas.
    const f = this.field;
    const frente = f.surfaceAt(x + 1, y) !== 'arvore' || f.surfaceAt(x, y + 1) !== 'arvore';
    return frente && (x + y) % 2 === 0;
  }

  /** Canto de cima à esquerda da árvore alta da casa, na tela. */
  posArvoreAlta(x, y, s) {
    const { sx, sy } = this.iso(x, y, this.field.heightAt(x, y));
    return {
      ox: Math.round(sx - s.ax + s.dx * 3),
      oy: Math.round(sy + TH / 2 - s.ay + s.dy * 2),
    };
  }

  /**
   * A SILHUETA de quem o desenho esconde.
   *
   * A parede e a copa esmaecem quando cobrem uma criatura, mas só até duas
   * casas de profundidade e só no que o `transparenciaDaCasa` conhece. Quem
   * fica atrás de uma parede alta, de uma copa grande ou de uma fileira de
   * árvores some inteiro no desenho, embora o grupo o ENXERGUE pela regra —
   * é a pergunta que o dono fez: "como vou ver o inimigo atrás da parede?".
   *
   * A resposta do gênero (Baldur's Gate, Diablo, Pillars): redesenhar a figura
   * POR CIMA de tudo, translúcida e com um contorno da cor do lado dela
   * (vermelho para inimigo, azul para aliado). Só para quem o grupo vê — quem
   * está fora da linha de visão continua não sendo desenhado — e só para quem
   * está de fato coberto, senão o tabuleiro inteiro ficaria cheio de contorno.
   */
  figuraCoberta(c) {
    if (!c.pos || c.dead) return false;
    const f = this.field;
    const { x, y } = c.pos;
    const pegada = c.pos.f ?? 1;
    // A COPA: a única regra que acertou quase sempre (99%) é a da casa de TRÁS
    // (a diagonal acima na tela), onde fica o corpo da figura. A fração de
    // chão coberto na própria casa acertou 30% das vezes, porque mede o losango
    // do pé e não o corpo de 60 px.
    const copas = this.coberturaDasCopas();
    const atras = copas.get(`${x - 1},${y - 1}`);
    if (atras && atras.frac > 0.3) return true;
    const propria = copas.get(`${x},${y}`);
    if (propria && propria.frac > 0.45) return true;
    // A PAREDE: só a de 66 px, a que o tabuleiro desenha ALTA. A aresta que
    // pertence a uma casa de fora é o murete de 22 px da frente, e esse não
    // esconde ninguém — o grupo dentro de uma casa levava o contorno por causa
    // dele. E só a de uma casa de distância: a de duas não toca o corpo.
    const xx = x + pegada - 1;
    const yy = y + pegada - 1;
    const sul = f.aresta(xx, yy, xx, yy + 1);
    if (ARESTA_QUE_ESCONDE.has(sul) && !this.casaDeFora(xx, yy + 1)) return true;
    const leste = f.aresta(xx, yy, xx + 1, yy);
    if (ARESTA_QUE_ESCONDE.has(leste) && !this.casaDeFora(xx + 1, yy)) return true;
    return false;
  }

  /**
   * O CONTATO PERDIDO. Quem o grupo viu e saiu da vista (atrás de uma parede,
   * no meio da mata) deixa de ser desenhado — é a regra da linha de visão —, e
   * o jogador fica sem saber onde ele estava. A última casa em que o grupo o
   * viu ganha uma marca fraca com "?": é o que um personagem de verdade sabe,
   * "ele estava ali", sem dizer para onde foi. A marca some quando a criatura
   * é vista de novo ou morre.
   */
  desenharContatosPerdidos(ctx) {
    this.ultimaVista ??= new Map();
    if (!this._visao || !this.field.avisosDeVista) { this.ultimaVista.clear(); return; }
    for (const c of this.enc.combatants) {
      if (c.side !== 'foes' || !c.pos) { this.ultimaVista.delete(c.id); continue; }
      // Morreu fora da vista: a marca só SOME quando alguém vê o corpo. Apagá-la
      // na hora diria ao jogador que o bicho morreu.
      if (c.dead) { if (this.figuraVisivel(c)) this.ultimaVista.delete(c.id); continue; }
      if (this.figuraVisivel(c)) this.ultimaVista.set(c.id, { x: c.pos.x, y: c.pos.y });
    }
    for (const [id, pos] of this.ultimaVista) {
      const c = this.enc.combatants.find((x) => x.id === id);
      if (!c || c.side !== 'foes') { this.ultimaVista.delete(id); continue; }
      if (c.dead) continue;
      // A casa da marca voltou a ser vista e o bicho não está lá: a marca era
      // de um lugar que o grupo já conferiu. Sem isto o "?" ficava para sempre
      // sobre uma casa vazia e visível.
      if (this._visao.has(`${pos.x},${pos.y}`) && !this.figuraVisivel(c)) { this.ultimaVista.delete(id); continue; }
      if (this.figuraVisivel(c)) continue;
      const { sx, sy } = this.iso(pos.x, pos.y);
      this.fillDiamond(ctx, pos.x, pos.y, 'rgba(255,106,85,.16)', 'rgba(255,106,85,.55)');
      ctx.save();
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,.8)';
      ctx.fillStyle = 'rgba(255,150,130,.95)';
      ctx.strokeText('?', sx, sy - 6);
      ctx.fillText('?', sx, sy - 6);
      ctx.restore();
    }
  }

  desenharSilhuetas(ctx) {
    if (this.soCenario || !this.field.avisosDeVista) return;
    for (const c of this.enc.combatants) {
      if (!c.pos || c.dead || !this.figuraVisivel(c)) continue;
      if (!this.figuraCoberta(c)) continue;
      // Azul para o grupo, vermelho para quem luta contra ele, âmbar para quem
      // ainda não escolheu lado (o culto, Reidoth).
      const cor = c.side === 'party' ? '#7fd0ff' : c.side === 'foes' ? '#ff6a55' : '#ffd24a';
      ctx.save();
      ctx.globalAlpha = 0.66;
      ctx.filter = `drop-shadow(1.5px 0 0 ${cor}) drop-shadow(-1.5px 0 0 ${cor}) drop-shadow(0 1.5px 0 ${cor}) drop-shadow(0 -1.5px 0 ${cor})`;
      this.drawCombatant(ctx, c, true);
      ctx.restore();
    }
  }

  /**
   * Que árvores altas escondem cada casa, na rotação atual.
   *
   * Medido em pixel: a máscara de alfa do sprite contra o losango da casa,
   * contando só árvores desenhadas DEPOIS dela (diagonal de vista maior).
   * Com as árvores de ~150 px, umas 130 das 381 casas andáveis da emboscada
   * ficam mais de um quarto escondidas em cada rotação — a estrada junto à
   * mata do sul e a ponta da trilha do norte. Devolve `Map('x,y' ->
   * { frac, arvores: Set('x,y') })`, só com as casas que têm alguma cobertura.
   * Calculado uma vez por rotação; vazio enquanto o atlas não carrega.
   */
  coberturaDasCopas() {
    if (this._cobertura?.rot === this.rot) return this._cobertura.mapa;
    const mapa = new Map();
    const { w, h } = this.field;
    const arvores = [];
    let atlas = null;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (this.field.surfaceAt(x, y) !== 'arvore' || !this.temArvoreAlta(x, y)) continue;
        const s = spriteCenario('arvore-alta', ['todas'], x, y);
        if (!s) return mapa;   // atlas ainda carregando: tenta no próximo quadro
        if (!atlas) {
          const c = document.createElement('canvas');
          c.width = s.img.width;
          c.height = s.img.height;
          const g = c.getContext('2d');
          g.drawImage(s.img, 0, 0);
          atlas = { w: c.width, alfa: g.getImageData(0, 0, c.width, c.height).data };
        }
        const v = this.toView(x, y);
        arvores.push({ k: `${x},${y}`, s, d: v.vx + v.vy, ...this.posArvoreAlta(x, y, s) });
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (this.field.surfaceAt(x, y) === 'arvore') continue;
        const { sx, sy } = this.center(x, y);
        const v = this.toView(x, y);
        const d = v.vx + v.vy;
        const frente = arvores.filter((a) => a.d > d
          && a.ox < sx + TW / 2 && a.ox + a.s.w > sx - TW / 2
          && a.oy < sy + TH / 2 && a.oy + a.s.h > sy - TH / 2);
        if (!frente.length) continue;
        let total = 0;
        let cobertos = 0;
        const quem = new Set();
        for (let py = -TH / 2; py < TH / 2; py++) {
          for (let px = -TW / 2; px < TW / 2; px++) {
            if (Math.abs(px + 0.5) / (TW / 2) + Math.abs(py + 0.5) / (TH / 2) > 1) continue;
            total++;
            const X = Math.round(sx) + px;
            const Y = Math.round(sy) + py;
            let coberto = false;
            for (const a of frente) {
              const lx = X - a.ox;
              const ly = Y - a.oy;
              if (lx < 0 || ly < 0 || lx >= a.s.w || ly >= a.s.h) continue;
              if (atlas.alfa[((a.s.y + ly) * atlas.w + a.s.x + lx) * 4 + 3] > 128) {
                coberto = true;
                quem.add(a.k);
              }
            }
            if (coberto) cobertos++;
          }
        }
        if (cobertos) mapa.set(`${x},${y}`, { frac: cobertos / total, arvores: quem });
      }
    }
    this._cobertura = { rot: this.rot, mapa };
    return mapa;
  }

  /**
   * A marcação de chão de uma casa (alcance, caminho, cursor). Se uma copa
   * esconde mais de um quarto da casa, o contorno também vai para o RAIO-X:
   * redesenhado por cima de tudo no fim do quadro, para o jogador ver o
   * alcance atrás da mata sem precisar girar a câmera.
   */
  marcar(ctx, x, y, fill, stroke, tracejado = false) {
    if (fill) this.fillDiamond(ctx, x, y, fill, tracejado ? null : stroke);
    if (tracejado) this.strokeDiamondTracejado(ctx, x, y, stroke);
    if (stroke && (this._copas?.get(`${x},${y}`)?.frac ?? 0) > 0.25) {
      (this._raioX ??= []).push([x, y, stroke, tracejado]);
    }
  }

  /**
   * A cor das zonas que escondem (Névoa, Escuridão, Fome de Hadar), por cima
   * da máscara: a máscara é preta e apagaria o matiz de cada uma. Pinta só o
   * losango do chão, com a borda nas casas de fora, e deixa de fora o recorte
   * das figuras que o grupo vê — então não revela nada que a máscara esconde.
   * Roda também no mapa claro (a zona liga a máscara por conta própria).
   */
  zonasObscurasPorCima(ctx, figuras = []) {
    const zonas = (this.enc.zonas ?? []).filter((z) => z.obscuro);
    if (!zonas.length) return;
    // O volume vai num canvas auxiliar; em volta de cada figura à vista o
    // tom é apagado com um degradê radial (suave, sem borda de bolha), então
    // não revela quem a máscara esconde.
    const w = this.canvas.width;
    const h = this.canvas.height;
    const aux = (this._zonaAux ??= document.createElement('canvas'));
    if (aux.width !== w || aux.height !== h) { aux.width = w; aux.height = h; }
    const a = aux.getContext('2d');
    a.setTransform(1, 0, 0, 1, 0, 0);
    a.globalCompositeOperation = 'source-over';
    a.clearRect(0, 0, w, h);
    a.save();
    a.lineWidth = 1.5;
    for (const z of zonas) {
      const cor = COR_DA_ZONA[z.spellId] ?? COR_DA_ZONA[z.obscuro === 'pesada' ? 'nevoaObscurecente' : 'escuridao'];
      for (const k of z.casas) {
        const [x, y] = k.split(',').map(Number);
        const borda = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !z.casas.has(`${x + dx},${y + dy}`));
        // A névoa respira: o alfa oscila devagar, defasado de casa em casa.
        const fill = cor.onda
          ? `rgba(${cor.rgb},${(cor.alfa + Math.sin(this.time * 1.4 + (x + y) * 0.7) * cor.onda).toFixed(3)})`
          : cor.fill;
        this.marcar(a, x, y, fill, borda ? cor.stroke : null);
      }
      // O volume: a esfera escura (Escuridão, Hadar) ou a nuvem de tufos (Névoa).
      desenharVolumeObscuro(a, this, z);
    }
    a.restore();
    a.globalCompositeOperation = 'destination-out';
    for (const c of figuras) {
      const { sx, sy } = this.center(c.pos.x, c.pos.y);
      const g = a.createRadialGradient(sx, sy - 30, 0, sx, sy - 30, 44);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(20 / 44, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      a.fillStyle = g;
      a.fillRect(sx - 44, sy - 74, 88, 88);
    }
    a.globalCompositeOperation = 'source-over';
    ctx.drawImage(aux, 0, 0);
    // `marcar` guarda contornos para o raio-X das copas; estes não entram.
    if (this._raioX) this._raioX.length = 0;
  }

  /** Os contornos guardados por `marcar`, por cima das copas. */
  desenharRaioX(ctx) {
    if (!this._raioX?.length) return;
    ctx.save();
    ctx.lineWidth = 1.5;
    for (const [x, y, stroke, tracejado] of this._raioX) {
      if (tracejado) this.strokeDiamondTracejado(ctx, x, y, stroke);
      else {
        const { sx, sy } = this.iso(x, y);
        this.diamond(ctx, sx, sy);
        ctx.strokeStyle = stroke;
        ctx.stroke();
      }
    }
    ctx.restore();
    this._raioX.length = 0;
  }

  /**
   * Um retângulo de tela cobre alguma criatura que está ATRÁS (diagonal de
   * vista menor que `d`)? A de diagonal maior é desenhada depois, por cima.
   */
  cobreFigura(x0, y0, w, h, d) {
    for (const f of this._figuras ?? []) {
      if (f.d >= d) continue;
      if (f.x1 > x0 && f.x0 < x0 + w && f.y1 > y0 && f.y0 < y0 + h) return true;
    }
    return false;
  }

  /**
   * AS CONSTRUÇÕES QUE O GRUPO PODE VER POR DENTRO (mapa com `fachadaFechada`, Árvore
   * Trovão). Uma construção só se abre à vista quando o grupo está dentro dela ou
   * enxerga alguma casa dela (por um vão aberto). De fora, sem ver dentro, ela é um
   * bloco FECHADO: o muro da frente na altura inteira e a porta fechada. `verTudo`
   * (a página de passeio) abre todas. Devolve 'todas', o conjunto de nomes ou null.
   */
  calcularSalasReveladas() {
    const f = this.field;
    if (!f.fachadaFechada || !f.sala) return null;
    if (this.verTudo) return 'todas';
    const rev = new Set(this._salasOcupadas ?? []);
    if (this._visao) {
      for (const k of this._visao.keys()) {
        const nome = f.sala.get(k);
        if (nome) rev.add(nome);
      }
    }
    return rev;
  }

  /**
   * As salas onde há alguém do grupo. A parede que esconde uma delas fica
   * translúcida: entrar numa sala é ver a sala inteira, e não o muro de
   * 87 px que fica entre ela e a câmera.
   */
  salasDoGrupo() {
    const sala = this.field.sala;
    if (!sala) return null;
    const dentro = new Set();
    for (const c of this.enc.combatants) {
      if (c.side !== 'party' || c.dead || !c.pos) continue;
      const n = sala.get(`${c.pos.x},${c.pos.y}`);
      if (n) dentro.add(n);
    }
    return dentro.size ? dentro : null;
  }

  /**
   * O BARRANCO: a terra por baixo das duas bordas da frente do mapa.
   *
   * O tabuleiro acabava num losango duro sobre o vazio, como um tabuleiro de
   * papel largado no escuro. Um palmo de terra embaixo basta para o mapa
   * virar um PEDAÇO DE MUNDO cortado, e não um recorte: o olho aceita que o
   * chão continua, só não está sendo mostrado.
   */
  desenharBarranco(ctx) {
    const f = this.field;
    const FUNDO = 26;                       // a altura da terra, em px
    ctx.save();
    for (const [borda, canto] of [['sul', 0], ['leste', 1]]) {
      for (let k = 0; k < (borda === 'sul' ? f.w : f.h); k++) {
        const x = borda === 'sul' ? k : f.w - 1;
        const y = borda === 'sul' ? f.h - 1 : k;
        // A casa da quina precisa das DUAS arestas — a de baixo à esquerda e
        // a de baixo à direita. Pulando-a aqui ficava um rasgo de 32 px com
        // o fundo da tela aparecendo bem na ponta do mapa. Não há
        // sobreposição: cada borda desenha uma aresta diferente.
        const { sx, sy } = this.iso(x, y, f.heightAt(x, y));
        // A aresta da frente: a de baixo à esquerda no sul, a de baixo à
        // direita no leste.
        const a = canto === 0 ? { x: sx - TW / 2, y: sy + TH / 2 } : { x: sx, y: sy + TH };
        const b = canto === 0 ? { x: sx, y: sy + TH } : { x: sx + TW / 2, y: sy + TH / 2 };
        // EM FAIXAS, não em degradê. A aresta desce 16 px dentro da própria
        // casa, então um degradê vertical pega cada ponta num tom diferente
        // e a borda do mapa sai serrilhada, casa a casa. Faixas paralelas à
        // aresta acompanham a inclinação e emendam sem costura.
        const faixa = (de, ate, cor) => {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y + de); ctx.lineTo(b.x, b.y + de);
          ctx.lineTo(b.x, b.y + ate); ctx.lineTo(a.x, a.y + ate);
          ctx.closePath();
          ctx.fillStyle = cor;
          ctx.fill();
        };
        faixa(0, 3, canto === 0 ? '#5a472f' : '#483825');          // a terra na quebra do capim
        faixa(3, FUNDO * 0.55, canto === 0 ? '#3d2f1f' : '#302617');
        faixa(FUNDO * 0.55, FUNDO, canto === 0 ? '#241c12' : '#1b150e');
      }
    }
    ctx.restore();
  }

  /** A casa é de fora (capim, estrada) — a parede ao norte/oeste dela é a da frente de alguma sala? */
  casaDeFora(x, y) {
    if (!this.field.inside(x, y)) return true;
    // UMA CASA DE SALA É DE DENTRO, qualquer que seja o chão que a superfície
    // dela pinta. Antes só o chão decidia: um barril (chão de grama) ou uma
    // mancha dentro de uma casa a transformava em "fora", e a parede em volta
    // caía de 66 para 22 px — nove buracos e dez pilares medidos no mapa de
    // Árvore Trovão.
    if (this.field.sala?.has(`${x},${y}`)) return false;
    const s = SUPERFICIE[this.field.surfaceAt(x, y)];
    return !s || CHAO_DE_FORA.has(s.chao);
  }

  /**
   * A mobília desta casa: a variante que o mapa anotou (`objetos`, tipo 'prop'), como
   * { grupo (do atlas do cenário), espelhar }, ou null. `espelhar` vira a peça de lado: a
   * cerca desenhada no eixo x serve ao eixo y.
   */
  varianteDaProp(x, y) {
    if (this._propsDe !== this.field) {
      this._propsDe = this.field;
      this._props = new Map();
      for (const o of this.field.objetos ?? []) {
        if (o.tipo === 'prop') this._props.set(`${o.x},${o.y}`, { grupo: `prop-${o.variante}`, espelhar: Boolean(o.espelhar), piso: o.piso ?? null });
      }
    }
    return this._props.get(`${x},${y}`) ?? null;
  }

  /**
   * Um piso de sala com uma pitada de marca: de vez em quando a laje rachada cede
   * lugar à laje com entulho (`lajeEntulho`), sorteada por casa. Devolve o NOME da
   * fileira do atlas do chão.
   */
  pisoSorteado(piso, x, y) {
    if (piso === 'lajeRuina' && sorteio(x * 11 + 3, y * 13 + 1, 100) < 9 && ladrilhoChao('lajeEntulho', x, y)) {
      return 'lajeEntulho';
    }
    return piso;
  }

  /** As paredes de borda do norte e do oeste da casa (x, y). */
  desenharParedes(ctx, x, y, d) {
    const f = this.field;
    if (!f.paredeN) return;
    const i = y * f.w + x;
    const fora = this.casaDeFora(x, y);
    const niveis = fora ? 1 : (f.paredeAlt?.[i] || ALTURA_PAREDE);
    for (const lado of ['N', 'O']) {
      const cod = lado === 'N' ? f.paredeN[i] : f.paredeO[i];
      if (!cod) continue;
      // A casa que a parede esconde: a de trás dela, na tela.
      const [ax, ay] = lado === 'O' ? [x - 1, y] : [x, y - 1];
      // Arco aberto numa aresta de FORA era pulado — a parede da frente é
      // baixa, e um vão nela não tinha o que desenhar. Mas quando a casa de trás
      // é uma SALA, o vão é a porta da frente dela: sem ombreira nem folha, 14
      // das 22 portas do mapa de Árvore Trovão saíam como um buraco no murete.
      if (cod === ARESTA.aberta && fora && !(f.inside(ax, ay) && !this.casaDeFora(ax, ay))) continue;
      // PORTÃO NA MURALHA. A altura vem da casa de FORA quando a aresta é
      // dela — e aí um portão que dá para o capim saía num muro de 22 px,
      // uma porta de 17 px de altura, um cotoco. Mas a parede é do castelo,
      // não do jardim: numa passagem, a altura é a da sala que ela serve.
      // A FACHADA FECHADA: de fora, sem ver dentro, o muro da frente sobe inteiro.
      const salaTras = fora && f.inside(ax, ay) ? f.sala?.get(`${ax},${ay}`) : null;
      const fachadaFechada = Boolean(salaTras) && f.fachadaFechada
        && this._salasReveladas !== 'todas' && !this._salasReveladas?.has(salaTras);
      const niveisAqui = (fora && (cod === ARESTA.porta || cod === ARESTA.aberta || cod === ARESTA.seteira || fachadaFechada)
        && f.inside(ax, ay) && !this.casaDeFora(ax, ay))
        ? (f.paredeAlt?.[ay * f.w + ax] || ALTURA_PAREDE)
        : niveis;
      const escondeSala = this._salasOcupadas?.has(f.sala?.get(`${ax},${ay}`));
      const { sx, sy } = this.iso(x, y, f.heightAt(x, y));
      // A aresta na tela: a do NORTE é a de cima à direita do losango (do
      // vértice de cima ao da direita) e a do OESTE é a de cima à esquerda.
      const A = { x: sx, y: sy };
      const B = lado === 'N' ? { x: sx + TW / 2, y: sy + TH / 2 } : { x: sx - TW / 2, y: sy + TH / 2 };
      // A RUÍNA da construção: a da casa da aresta, ou a da casa de trás quando a
      // aresta é a fachada de fora. Porta e arco ficam inteiros (o vão precisa de
      // altura para ser vão); o resto perde altura e ganha o topo quebrado.
      const grau = f.paredeRuina?.[i] || (f.inside(ax, ay) ? f.paredeRuina?.[ay * f.w + ax] || 0 : 0);
      // Uma BRECHA que é entrada é aresta aberta para o motor, mas parede caída para o desenho.
      const ehBrecha = Boolean(f.brechas?.has(`${x},${y},${lado}`));
      const passagem = !ehBrecha && (cod === ARESTA.porta || cod === ARESTA.aberta);
      const emRuina = grau > 0 && !passagem;
      const alto = (emRuina ? this.niveisEmRuina(niveisAqui, grau, x, y, lado) : niveisAqui) * LIFT;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (!fora && (escondeSala
        || this.cobreFigura(Math.min(A.x, B.x), A.y - alto, TW / 2, alto + TH / 2, d)
        || (this.hover && this.cobreTela(Math.min(A.x, B.x), A.y - alto, TW / 2, alto + TH / 2, this.hover)))) {
        ctx.globalAlpha = TRANSLUCIDO;
      }
      this.faceDaParede(ctx, lado, A, B, alto, cod, x, y, emRuina ? grau : 0, passagem ? grau : 0, fachadaFechada && passagem, ehBrecha);
      ctx.restore();
    }
    // O que está pendurado nas paredes desta casa, por último — e com o
    // MESMO alfa da parede. Opaca sobre pedra esmaecida, a tocha ficava
    // flutuando no ar na frente do parapeito.
    if (!fora && f.decor) {
      for (const lado of ['N', 'O']) {
        const cod = lado === 'N' ? f.paredeN[i] : f.paredeO[i];
        if (!cod || cod === ARESTA.aberta) continue;
        const pendurado = f.decor.get(`${x},${y},${lado}`);
        if (!pendurado) continue;
        const { sx, sy } = this.iso(x, y, f.heightAt(x, y));
        const A = { x: sx, y: sy };
        const B = lado === 'N' ? { x: sx + TW / 2, y: sy + TH / 2 } : { x: sx - TW / 2, y: sy + TH / 2 };
        // A ALTURA É A DESTA CASA, não a padrão: a torre tem 4 níveis e a
        // ruína 2. Com 66 px fixos, o quadro de uma torre decidia a
        // translucidez pela parede errada e a tocha ficava baixa demais.
        // E a da RUÍNA, quando a construção está caída: a peça não fica no ar acima do toco.
        const grauAqui = f.paredeRuina?.[i] || 0;
        let alto = (grauAqui ? this.niveisEmRuina(niveis, grauAqui, x, y, lado) : niveis) * LIFT;
        if (grauAqui) {
          // O topo da ruína é quebrado: a peça se ancora no ponto MAIS BAIXO do meio da aresta, e
          // não pendura no ar onde o muro caiu. Na brecha, ou onde sobra pouco muro, não entra.
          if (f.brechas?.has(`${x},${y},${lado}`)) continue;
          const perf = this.perfilDeRuina(lado, x, y, grauAqui, alto);
          alto -= Math.max(perf[1], perf[2], perf[3]);
          if (alto < LIFT * 1.5) continue;
        }
        const [ax, ay] = lado === 'O' ? [x - 1, y] : [x, y - 1];
        ctx.save();
        if (this._salasOcupadas?.has(f.sala?.get(`${ax},${ay}`))
          || this.cobreFigura(Math.min(A.x, B.x), A.y - alto, TW / 2, alto + TH / 2, d)
          || (this.hover && this.cobreTela(Math.min(A.x, B.x), A.y - alto, TW / 2, alto + TH / 2, this.hover))) {
          ctx.globalAlpha = TRANSLUCIDO;
        }
        this.desenharDecor(ctx, pendurado, lado, sx, sy, x, y, alto);
        ctx.restore();
      }
    }
  }

  /**
   * Quantos níveis a parede de uma construção em ruína ainda tem. O grau 1 é a
   * casa que se sustenta (altura inteira); o 2, a que perdeu parte do alto; o 3,
   * a que virou toco. O sorteio é por casa e lado, para a altura variar ao longo
   * do muro em vez de cair num patamar só.
   */
  niveisEmRuina(n, grau, x, y, lado) {
    if (n <= 1) return 1;
    const h = sorteio(x * 13 + (lado === 'N' ? 1 : 5), y * 7 + 2, 6);
    if (grau === 1) return n;
    if (grau === 2) return h < 2 ? n : n - 1;
    return h < 3 ? 1 : Math.min(2, n);
  }

  /**
   * O PERFIL do alto de uma parede em ruína: cinco deslocamentos (px, para
   * baixo) ao longo da aresta, de uma ponta à outra. O das pontas vem do CANTO
   * (a mesma conta nas duas arestas que o dividem), para a quebra emendar na
   * quina; o do meio é da aresta.
   */
  perfilDeRuina(lado, x, y, grau, alto, brecha = false, total = false) {
    const max = Math.min(alto - 6, [0, 6, 12, 18][grau]);
    const canto = (cx, cy) => (sorteio(cx * 31 + 7, cy * 17 + 3, 5) / 4) * max;
    const [x1, y1] = lado === 'N' ? [x + 1, y] : [x, y + 1];
    const meio = (k) => (sorteio(x * 19 + k * 7 + (lado === 'N' ? 0 : 3), y * 23 + k, 5) / 4) * max;
    const a = canto(x, y);
    const b = canto(x1, y1);
    if (brecha) {
      // A BRECHA DE VISÃO: o perfil despenca no meio da aresta, até um pé de entulho. Quem está de
      // um lado vê o outro por ali; a regra continua sendo parede (seteira): não se passa.
      const fundo = (k) => Math.round(alto * (0.68 + (sorteio(x * 23 + k * 3, y * 31 + k, 100) / 100) * 0.2));
      // Entrada (se passa por cima do entulho): o entalhe vai até o chão.
      // O entalhe é um V que desce até o chão no meio, e não um retângulo de três quartos da aresta: as duas pontas
      // guardam metade da altura, como o muro que desmoronou e deixou dois cotocos, e não dois postes finos.
      if (total) return [Math.round(a), Math.round(alto * 0.5), alto - 3, Math.round(alto * 0.5), Math.round(b)];
      return [Math.round(a), fundo(1), fundo(2), fundo(3), Math.round(b)];
    }
    return [a, (a + meio(1)) / 2, meio(2), (b + meio(3)) / 2, b].map((v) => Math.round(v));
  }

  /**
   * UMA PAREDE DE BORDA, desenhada (não um sprite).
   *
   * O sprite pronto do kit tem tampa nas duas pontas: onde dois pedaços se
   * encontram num ângulo, as tampas se chocam e sobra um talho, e nenhuma
   * peça de canto fecha todos os casos (esquina, T e cruz). Desenhada, a
   * parede é uma FAIXA CONTÍNUA que simplesmente vira na quina, como nos
   * mapas de masmorra: um topo de pedra com espessura, a face lavrada abaixo
   * e um fio escuro no pé.
   *
   * A face usa as faixas de alvenaria do atlas (`art/faces.js`, 22 px por
   * nível), recortadas no paralelogramo da aresta.
   */
  faceDaParede(ctx, lado, A, B, alto, cod, x, y, grau = 0, grauVao = 0, fechar = false, brechaAberta = false) {
    const eBrecha = brechaAberta || cod === ARESTA.seteira;
    if (brechaAberta) cod = ARESTA.parede;     // desenha como parede, com o entalhe
    // Vão de uma construção que não se vê por dentro: a porta aparece FECHADA, aberta ou não.
    // O corrido do vão (portão de duas casas) é medido pelo código ORIGINAL: depois da troca, o
    // vizinho aberto não bate com a porta e o portão virava duas portinhas.
    const codDoCorrido = cod;
    if (fechar) cod = ARESTA.porta;
    const f = this.field;
    const ESP = 7;            // espessura da parede, em px de tela
    // A FAIXA NÃO SE TROCA: ela carrega a PERSPECTIVA, não só o tom. A arte
    // de 'esq' tem as fiadas correndo para um lado e a de 'dir' para o
    // outro, cada uma desenhada para a sua face. Trocar as duas para acertar
    // o tom — que foi o que eu fiz antes — põe a pedra correndo no mesmo
    // sentido nos dois lados, e o canto da sala deixa de virar.
    //
    // A aresta do NORTE desce à direita na tela, que é a face 'esq' do bloco;
    // a do OESTE desce à esquerda, que é a 'dir'. O tom se acerta logo abaixo.
    const face = lado === 'N' ? 'esq' : 'dir';
    const em = (t) => ({ x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t });
    // O VÃO é um BURACO, não um desenho por cima: a pedra é recortada nele, e
    // por ali se vê o que já foi desenhado atrás — o chão da outra sala, os
    // móveis, quem estiver lá. Pintar o vão de preto fechava a passagem com
    // tinta e matava a profundidade.
    const vao = this.vaoDaAresta(lado, A, B, alto, cod, x, y, codDoCorrido);
    // A SOMBRA DE CONTATO no pé: uma faixa escura caindo da parede para
    // dentro da sala. Sem ela a parede parece apoiada no chão sem tocá-lo, e
    // o olho não acha onde uma acaba e o outro começa. É a mesma coisa que
    // a elipse debaixo de um móvel, só que comprida.
    if (cod !== ARESTA.aberta) {
      const funda = lado === 'N' ? { x: -10, y: 5 } : { x: 10, y: 5 };
      const som = ctx.createLinearGradient(A.x, A.y, A.x + funda.x, A.y + funda.y);
      som.addColorStop(0, 'rgba(10, 8, 6, .42)');
      som.addColorStop(1, 'rgba(10, 8, 6, 0)');
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y);
      ctx.lineTo(B.x + funda.x, B.y + funda.y); ctx.lineTo(A.x + funda.x, A.y + funda.y);
      ctx.closePath();
      ctx.fillStyle = som;
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y);
    // O perfil do alto: reto, ou quebrado quando a parede está em ruína.
    const quebra = grau ? this.perfilDeRuina(lado, x, y, grau, alto, eBrecha, brechaAberta) : null;
    const alturaEm = (k) => alto - (quebra ? quebra[k] : 0);
    for (let k = 4; k >= 0; k--) {
      ctx.lineTo(A.x + (B.x - A.x) * (k / 4), A.y + (B.y - A.y) * (k / 4) - alturaEm(k));
    }
    ctx.closePath();
    // Porta fechada tapa a passagem com a folha de madeira; arco aberto não.
    if (vao && cod === ARESTA.aberta) vao.contorno(ctx);
    ctx.clip('evenodd');
    let pintou = false;
    const niveisDaFace = Math.ceil(alto / LIFT);
    // A pedra da ruína: o material sai do grau (e, no 1, alterna entre as duas).
    const pedra = grau === 1 ? (sorteio(x * 3 + 1, y * 5 + 2, 2) ? 'alta' : 'leve') : grau === 2 ? 'pesada' : 'escombros';
    for (let n = 0; n < niveisDaFace; n++) {
      const fx = (grau
        ? faixaDaRuina(pedra, face, n === niveisDaFace - 1 ? 'base' : (n === 0 && niveisDaFace > 1 ? 'topo' : 'meio'),
          x * 7 + (lado === 'N' ? 0 : 3), y * 5, n)
        : null) ?? faixaDaFace(f.materialDaParede ?? 'alvenaria', face, x * 7 + (lado === 'N' ? 0 : 3), y * 5, n);
      if (!fx) break;
      pintou = true;
      ctx.drawImage(fx.img, fx.sx, fx.sy, fx.w, fx.h,
        Math.min(A.x, B.x), Math.round(A.y - alto + n * LIFT), fx.w, fx.h);
    }
    if (!pintou) {
      ctx.fillStyle = lado === 'N' ? '#4e4842' : '#3a3530';
      ctx.fill();
    }
    // O TOM, por cima da pedra. A luz do jogo vem de cima à ESQUERDA — é o
    // que o desenho dos móveis diz, com o brilho na quina de cima à
    // esquerda — mas o atlas das faces veio iluminado do outro lado. Como a
    // faixa não pode ser trocada sem virar a pedra, a correção é esta: um
    // véu claro na face que recebe a luz e um escuro na que fica na sombra.
    // O véu é FRACO de propósito. Com 40% de preto a face sombreada ficava
    // com a pedra mole: a diferença entre bloco e junta encolhe junto com o
    // tom, e a alvenaria vira massa. Um véu menos pesado nos dois lados
    // guarda a mesma leitura de volume sem apagar o desenho da pedra.
    // A taverna é quente e fechada: a face na sombra escurece menos, senão o tijolo vira breu.
    ctx.fillStyle = lado === 'N' ? 'rgba(255,246,224,.15)' : (f.materialDaParede === 'tijolo' ? 'rgba(14,16,28,.14)' : 'rgba(14,16,28,.30)');
    ctx.fill();
    ctx.restore();
    // A SETEIRA: a fenda estreita, aberta na pedra na altura do peito.
    // (a fenda estreita só vale na parede inteira: na ruína a seteira é a brecha, desenhada no perfil)
    if (cod === ARESTA.seteira && !grau) {
      const q0 = em(0.42);
      const q1 = em(0.58);
      ctx.beginPath();
      ctx.moveTo(q0.x, q0.y - (alto - 18)); ctx.lineTo(q1.x, q1.y - (alto - 18));
      ctx.lineTo(q1.x, q1.y - (alto - 18) - 22); ctx.lineTo(q0.x, q0.y - (alto - 18) - 22);
      ctx.closePath();
      ctx.fillStyle = '#0b0a09';
      ctx.fill();
      ctx.strokeStyle = '#6b655c';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // O TOPO: a espessura da parede, vista de cima. É ele que faz a quina
    // virar sem emenda — o topo de uma aresta encosta no da outra.
    const topoA = { x: A.x, y: A.y - alturaEm(0) };
    const topoB = { x: B.x, y: B.y - alturaEm(4) };
    const dx = lado === 'N' ? -ESP : ESP;
    ctx.beginPath();
    if (quebra) {
      // A capa acompanha o perfil quebrado: uma faixa de espessura ESP que sobe e
      // desce com ele, e não a tira reta que o resto das paredes tem.
      for (let k = 0; k <= 4; k++) {
        const px = A.x + (B.x - A.x) * (k / 4);
        const py = A.y + (B.y - A.y) * (k / 4) - alturaEm(k);
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      for (let k = 4; k >= 0; k--) {
        ctx.lineTo(A.x + (B.x - A.x) * (k / 4) + dx, A.y + (B.y - A.y) * (k / 4) - alturaEm(k) + ESP / 2);
      }
    } else {
      ctx.moveTo(topoA.x, topoA.y); ctx.lineTo(topoB.x, topoB.y);
      ctx.lineTo(topoB.x + dx, topoB.y + ESP / 2); ctx.lineTo(topoA.x + dx, topoA.y + ESP / 2);
    }
    ctx.closePath();
    // Menos claro do que era. A capa branca saltava mais que a própria
    // parede, e onde um muro baixo passa na frente de uma torre ela lia como
    // prateleira pregada na pedra.
    ctx.fillStyle = quebra ? (lado === 'N' ? '#6f6a5f' : '#5f5a50')
      : f.materialDaParede === 'tijolo' ? (lado === 'N' ? '#a8692f' : '#85501f')   // capa de tábua, não de pedra
        : (lado === 'N' ? '#8d8878' : '#7a7568');
    ctx.fill();
    // O contorno vai só nas arestas LIVRES do topo (a de fora e a de
    // dentro). Contornar também as laterais punha um entalhe escuro na
    // emenda de cada casa, e o muro saía picotado a cada 32 px.
    ctx.strokeStyle = 'rgba(22,20,18,.85)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (quebra) {
      // Topo quebrado: o fio acompanha o perfil (brecha, seteira, degrau), e não a corda reta entre as pontas.
      for (let k = 0; k <= 4; k++) {
        const px = A.x + (B.x - A.x) * (k / 4);
        const py = A.y + (B.y - A.y) * (k / 4) - alturaEm(k);
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      for (let k = 0; k <= 4; k++) {
        const px = A.x + (B.x - A.x) * (k / 4) + dx;
        const py = A.y + (B.y - A.y) * (k / 4) - alturaEm(k) + ESP / 2;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    } else {
      ctx.moveTo(topoA.x, topoA.y); ctx.lineTo(topoB.x, topoB.y);
      ctx.moveTo(topoA.x + dx, topoA.y + ESP / 2); ctx.lineTo(topoB.x + dx, topoB.y + ESP / 2);
    }
    ctx.stroke();
    // O fio escuro no pé, do lado de dentro: dá o assentamento. Ele PARA no
    // vão — atravessando o limiar, punha uma faixa escura no meio da
    // passagem, como se houvesse degrau onde não há.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y);
    ctx.lineTo(B.x + dx, B.y + ESP / 2); ctx.lineTo(A.x + dx, A.y + ESP / 2);
    ctx.closePath();
    if (vao && cod === ARESTA.aberta) vao.contorno(ctx);
    ctx.fillStyle = 'rgba(12,10,8,.35)';
    ctx.fill('evenodd');
    ctx.restore();
    // A TAMPA DE PONTA. O topo tem 7 px de espessura; onde a parede acaba
    // sem continuar nem virar a quina, essa espessura termina no ar e a
    // faixa clara do topo pousa sobre a face da parede de trás, lendo como
    // uma prateleira flutuando. A tampa fecha o corte: é a parede vista de
    // lado, da altura dela.
    const aresta = (ax, ay, qual) => {
      if (!f.inside(ax, ay)) return 0;
      return qual === 'N' ? f.paredeN[ay * f.w + ax] : f.paredeO[ay * f.w + ax];
    };
    const pontas = lado === 'N'
      ? [[A, !aresta(x - 1, y, 'N') && !aresta(x, y, 'O') && !aresta(x, y - 1, 'O')],
        [B, !aresta(x + 1, y, 'N') && !aresta(x + 1, y, 'O') && !aresta(x + 1, y - 1, 'O')]]
      : [[A, !aresta(x, y - 1, 'O') && !aresta(x, y, 'N') && !aresta(x - 1, y, 'N')],
        [B, !aresta(x, y + 1, 'O') && !aresta(x, y + 1, 'N') && !aresta(x - 1, y + 1, 'N')]];
    for (const [ponto, livre] of pontas) {
      if (!livre) continue;
      ctx.beginPath();
      ctx.moveTo(ponto.x, ponto.y);
      ctx.lineTo(ponto.x + dx, ponto.y + ESP / 2);
      const altoPonto = ponto === A ? alturaEm(0) : alturaEm(4);
      ctx.lineTo(ponto.x + dx, ponto.y + ESP / 2 - altoPonto);
      ctx.lineTo(ponto.x, ponto.y - altoPonto);
      ctx.closePath();
      ctx.fillStyle = lado === 'N' ? '#4b453c' : '#3c372f';
      ctx.fill();
      ctx.strokeStyle = 'rgba(18,16,14,.7)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // SEM PILASTRA. Já houve aqui uma faixa clara de quatro em quatro casas,
    // para dar ritmo ao pano de pedra. Não funcionou: num pano de 32 px de
    // largura a faixa sai com 12 px e com as bordas em degradê, e lê como
    // uma MANCHA borrada atravessando a alvenaria, não como coluna. Ritmo
    // de parede, neste tamanho, tem de vir da própria pedra — de uma faixa
    // de atlas com a pilastra desenhada —, não de tinta por cima.
    // A moldura e a folha, uma vez por passagem.
    if (vao && vao.ultima) {
      // Porta aberta mostra a FOLHA encostada no batente; arcada não tem
      // folha nenhuma. O mapa diz qual é qual (`field.folha`); sem essa
      // lista, todo vão é arcada, que é como os outros mapas se comportam.
      const [bx, by] = lado === 'N' ? [x, y - 1] : [x - 1, y];
      const temFolha = f.folha?.has(`${x},${y},${bx},${by}`) ?? false;
      this.acabamentoDoVao(ctx, vao, lado, cod, temFolha, grauVao, x, y);
    }
  }

  /**
   * A GEOMETRIA DO VÃO de uma aresta, ou `null` se ela é pedra cheia.
   *
   * Um vão de duas casas (os portões) é UMA passagem: todas as casas do
   * corrido recortam o mesmo buraco, e só a última desenha a moldura.
   *
   * `contorno(ctx)` acrescenta o arco ao caminho que já está aberto, em
   * coordenadas de tela — o canvas guarda o caminho depois da transformação,
   * então o recorte feito aqui continua valendo fora dela.
   */
  vaoDaAresta(lado, A, B, alto, cod, x, y, codDoCorrido = cod) {
    if (cod !== ARESTA.porta && cod !== ARESTA.aberta) return null;
    const f = this.field;
    const mesma = (ax, ay) => (lado === 'N'
      ? f.inside(ax, ay) && f.paredeN[ay * f.w + ax] === codDoCorrido
      : f.inside(ax, ay) && f.paredeO[ay * f.w + ax] === codDoCorrido);
    // Recua até a primeira casa do corrido e mede o comprimento dele.
    let atras = 0;
    while (mesma(lado === 'N' ? x - atras - 1 : x, lado === 'N' ? y : y - atras - 1)) atras += 1;
    let total = atras + 1;
    for (;;) {
      const adiante = total - atras;
      if (!mesma(lado === 'N' ? x + adiante : x, lado === 'N' ? y : y + adiante)) break;
      total += 1;
    }
    // O pé do vão: o meio do corrido, rente ao chão. Porta que não encosta no
    // chão não lê como porta.
    const passo = { x: B.x - A.x, y: B.y - A.y };
    const inicio = { x: A.x - passo.x * atras, y: A.y - passo.y * atras };
    const pe = { x: inicio.x + passo.x * (total / 2), y: inicio.y + passo.y * (total / 2) };
    // Raio inteiro: com meio pixel o batente do arco saía borrado.
    const raio = Math.round(Math.abs(passo.x) * total * 0.78 / 2);
    const altura = Math.round(alto * 0.80);
    const sentido = lado === 'N' ? 1 : -1;
    return {
      // A MOLDURA E A FOLHA SAEM NA ULTIMA CASA DO CORRIDO, nao na primeira.
      // O acabamento e desenhado FORA do recorte da pedra, para cobrir o vao
      // inteiro; saindo na primeira casa, a casa seguinte do corrido era
      // desenhada depois e repintava chao e pedra por cima dele — a porta de
      // duas casas aparecia cortada ao meio. A ultima casa do corrido e a
      // ultima a ser desenhada nas duas arestas (a do norte anda em x, a do
      // oeste em y, e as duas crescem com a profundidade).
      ultima: atras === total - 1,
      raio,
      altura,
      sentido,
      /** Roda `fn` com o canvas já deitado no plano da parede. */
      noPlano(ctx, fn) {
        ctx.save();
        ctx.translate(pe.x, pe.y);
        ctx.transform(sentido, 0.5, 0, 1, 0, 0);
        fn();
        ctx.restore();
      },
      contorno(ctx) {
        ctx.save();
        ctx.translate(pe.x, pe.y);
        // A face desce meio pixel para cada pixel de lado; é essa a inclinação
        // do plano. A aresta do oeste é o espelho dela.
        ctx.transform(sentido, 0.5, 0, 1, 0, 0);
        ctx.moveTo(-raio, 0);
        ctx.lineTo(-raio, -(altura - raio));
        ctx.arc(0, -(altura - raio), raio, Math.PI, 0);
        ctx.lineTo(raio, 0);
        ctx.closePath();
        ctx.restore();
      },
    };
  }

  /** A moldura de aduelas e, se a porta está fechada, a folha de madeira. */
  acabamentoDoVao(ctx, vao, lado, cod, temFolha = false, grauVao = 0, x = 0, y = 0) {
    const { raio, altura } = vao;
    // A FOLHA ENCOSTADA, quando a porta está aberta. Sem ela o vão aberto
    // fica igual a uma arcada, e o jogador não tem como saber o que pode
    // fechar atrás de si. É uma tábua estreita no batente, vista quase de
    // perfil — que é como uma porta aberta aparece nesta câmera.
    if (cod === ARESTA.aberta && temFolha) {
      const larg = Math.max(6, Math.round(raio * 0.58));
      const alt = Math.round(altura * 0.94);
      vao.noPlano(ctx, () => {
        ctx.fillStyle = '#4a3524';
        ctx.fillRect(-raio + 1, -alt, larg, alt);
        // A quina da folha pega a luz; o lado de dentro some na sombra do vão.
        ctx.fillStyle = '#6b4e2f';
        ctx.fillRect(-raio + 1, -alt, 2, alt);
        ctx.strokeStyle = 'rgba(22,16,10,.8)';
        ctx.lineWidth = 1;
        for (let t = -raio + 4; t < -raio + larg; t += 3) {
          ctx.beginPath(); ctx.moveTo(t + 0.5, -alt); ctx.lineTo(t + 0.5, 0); ctx.stroke();
        }
        ctx.fillStyle = '#2b2622';
        ctx.fillRect(-raio + 1, -alt + 8, larg, 2);
        ctx.fillRect(-raio + 1, -8, larg, 2);
        ctx.fillStyle = 'rgba(10,8,6,.55)';
        ctx.fillRect(-raio + larg, -alt, 2, alt);
      });
    }
    // A FOLHA DE MADEIRA tapa a passagem: tábuas em pé, duas cintas de ferro
    // e a argola. O arco aberto não leva nada — por ele se vê a outra sala.
    if (cod === ARESTA.porta) {
      ctx.save();
      ctx.beginPath();
      vao.contorno(ctx);
      ctx.clip();
      // Em construção arruinada a folha é uma porta velha de verdade (`vaoRuina`: quebrada,
      // escorada, queimada, entreaberta), esticada para o vão. Na inteira, a de tábuas.
      const velha = grauVao ? spriteCenario('vaoRuina', ['porta'], x, y) : null;
      vao.noPlano(ctx, velha ? () => {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(velha.img, velha.x, velha.y, velha.w, velha.h, -raio, -altura, raio * 2, altura);
      } : () => {
        ctx.fillStyle = '#4a3524';
        ctx.fillRect(-raio, -altura, raio * 2, altura);
        ctx.strokeStyle = 'rgba(22,16,10,.75)';
        ctx.lineWidth = 1;
        for (let t = -raio + 4; t < raio - 1; t += 5) {
          ctx.beginPath(); ctx.moveTo(t, -altura); ctx.lineTo(t, 0); ctx.stroke();
        }
        ctx.fillStyle = '#2b2622';
        ctx.fillRect(-raio, -altura + 9, raio * 2, 3);
        ctx.fillRect(-raio, -9, raio * 2, 3);
        ctx.strokeStyle = '#7a6844';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(raio - 5, -Math.round(altura * 0.45), 3, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();
    }
    // A MOLDURA: as aduelas do arco e as ombreiras, na pedra clara do topo.
    ctx.beginPath();
    vao.contorno(ctx);
    ctx.strokeStyle = lado === 'N' ? '#9a9483' : '#827c6e';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.beginPath();
    vao.contorno(ctx);
    ctx.strokeStyle = 'rgba(16,14,12,.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /**
   * A decoração pendurada na face da parede: tocha, quadro, bandeira, musgo.
   *
   * A aresta do NORTE é a de cima à direita do losango (do vértice de cima
   * ao da direita) e a do OESTE é a de cima à esquerda. O desenho veio no
   * plano de uma face que desce para a DIREITA, que é a do norte; a do oeste
   * usa o espelho dele.
   */
  desenharDecor(ctx, tipo, lado, sx, sy, x, y, alto = ALTURA_PAREDE * LIFT) {
    // As peças das ruínas (`decorRuina`) vêm primeiro: teia, musgo, tapeçaria, mancha
    // e o resto de uma casa abandonada. O que elas não têm cai nas do castelo.
    const d = spriteCenario('decorRuina', [tipo], x, y) ?? spriteCenario('janelaRuina', [tipo], x, y)
      ?? spriteCenario('decorParede', [tipo], x, y);
    if (!d) return;
    // O meio da aresta, na altura do peito de quem passa — uma FRAÇÃO da
    // parede, não 32 px fixos: na torre de 88 px a tocha ficava rente ao
    // chão, e na ruína de 44 px o musgo encavalava no topo.
    const mx = lado === 'N' ? sx + TW / 4 : sx - TW / 4;
    const my = Math.round(sy + TH / 4 - alto * 0.52);
    // A PEÇA DEITA NO PLANO DA PAREDE, como a porta e o arco. Ela foi
    // desenhada de frente; colada reta na face inclinada, o pergaminho fica
    // com o topo na horizontal enquanto os tijolos descem, e lê como adesivo.
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(mx), Math.round(my));
    ctx.transform(lado === 'N' ? 1 : -1, 0.5, 0, 1, 0, 0);
    const chama = tipo === 'tochaAcesa' && CHAMA['decorParede-tochaAcesa'].so.includes(d.origem) ? CHAMA['decorParede-tochaAcesa'] : null;
    if (chama) desenharChama(ctx, d, Math.round(-d.ax), Math.round(-d.ay), this.time, chama, (x * 1.7 + y * 2.9) % 6.28);
    else {
      ctx.drawImage(d.img, d.x, d.y, d.w, d.h,
        Math.round(-d.ax), Math.round(-d.ay), d.w, d.h);
      // A lanterna não balança: a vela dentro dela respira (um clarão que vai e vem sobre o vidro).
      if (tipo === 'tochaAcesa') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.1 + 0.07 * Math.sin(Math.floor(this.time * 12) / 12 * 7 + x * 1.7 + y * 2.9);
        ctx.drawImage(d.img, d.x, d.y, d.w, d.h, Math.round(-d.ax), Math.round(-d.ay), d.w, d.h);
      }
    }
    ctx.restore();
  }

  /** O retângulo de tela cobre a casa `t` (o cursor)? */
  cobreTela(x0, y0, w, h, t) {
    const { sx, sy } = this.center(t.x, t.y);
    return sx > x0 && sx < x0 + w && sy - 30 < y0 + h && sy > y0;
  }

  /** O retângulo de tela de cada criatura no tabuleiro, com a diagonal dela. */
  figurasNaTela() {
    const out = [];
    for (const c of this.enc.combatants) {
      if (!c.pos) continue;
      // Quem o grupo não vê (dentro de uma construção fechada) não faz a parede ficar translúcida.
      if (c.side !== 'party' && !this.figuraVisivel(c)) continue;
      const v = this.toView(c.pos.x, c.pos.y);
      const { sx, sy } = this.center(c.pos.x, c.pos.y);
      // Uma criatura Média ocupa uns 40 x 48 px acima do centro da casa.
      out.push({ d: v.vx + v.vy, x0: sx - 20, x1: sx + 20, y0: sy - 48, y1: sy + 4 });
    }
    return out;
  }

  /** A anotação do mapa (para onde olha, variante) do objeto desta pegada. */
  anotacaoDe(pegada) {
    return this.field.objetos?.find((o) => pegada.some((c) => c.x === o.x && c.y === o.y)) ?? null;
  }

  /**
   * O sprite de um objeto com direção na rotação atual da câmera, ou null.
   *
   * O objeto aponta para um lado no MUNDO (`olha`); a câmera gira; o que muda
   * é a direção dele na TELA. A conversão é a mesma que escolhe a direção das
   * criaturas — `rotateVec` e depois `linhaDaDirecao` —, então um cavalo e um
   * goblin olhando para o mesmo lado do mundo usam a mesma direção de sprite.
   * Conferido: +x do mundo vira sudeste na rotação 0, sudoeste na 1, noroeste
   * na 2 e nordeste na 3.
   */
  spriteDirecional(tipo, anotacao) {
    const olha = anotacao?.olha ?? { dx: 1, dy: 0 };
    const f = this.rotateVec(olha.dx, olha.dy);
    const { row } = linhaDaDirecao(DIRECOES_8, f.dx - f.dy, f.dx + f.dy);
    const grupo = anotacao?.variante ? `${tipo}-${anotacao.variante}` : tipo;
    return spriteCenario(grupo, [DIRECOES_8[row]], 0, 0);
  }

  /**
   * A árvore está na borda da mata — encosta numa casa por onde se anda?
   * Na borda o tronco aparece; no miolo ele fica atrás da copa da frente.
   */
  bordaDaMata(x, y) {
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;
      return this.field.inside(nx, ny) && this.field.surfaceAt(nx, ny) !== 'arvore';
    });
  }

  /**
   * As casas do objeto de várias casas que contém (x, y), ou null.
   *
   * Calculado uma vez e guardado: o mapa não muda durante o encontro. Casas
   * vizinhas (nos quatro lados) com a mesma superfície multicasa formam um
   * objeto. Limitação conhecida: dois objetos iguais encostados viram um só.
   */
  pegadaDe(x, y) {
    if (!this._pegadas) {
      this._pegadas = new Map();
      const { w, h } = this.field;
      for (let yy = 0; yy < h; yy++) {
        for (let xx = 0; xx < w; xx++) {
          const sup = this.field.surfaceAt(xx, yy);
          if (!MULTICASA.has(SUPERFICIE[sup]?.objeto) || this._pegadas.has(`${xx},${yy}`)) continue;
          const casas = [];
          const fila = [{ x: xx, y: yy }];
          const vistos = new Set([`${xx},${yy}`]);
          while (fila.length) {
            const c = fila.shift();
            casas.push(c);
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const n = { x: c.x + dx, y: c.y + dy };
              const k = `${n.x},${n.y}`;
              if (!vistos.has(k) && this.field.surfaceAt(n.x, n.y) === sup) {
                vistos.add(k);
                fila.push(n);
              }
            }
          }
          for (const c of casas) this._pegadas.set(`${c.x},${c.y}`, casas);
        }
      }
    }
    return this._pegadas.get(`${x},${y}`) ?? null;
  }

  /**
   * (x, y) é a casa da frente da pegada na vista atual? É a de maior
   * diagonal de vista (vx + vy) e, no empate, a de maior vx — a mesma ordem em
   * que `this.order` percorre as casas, então ela é a última desenhada.
   */
  ehFrenteDaPegada(x, y, pegada) {
    let melhor = null;
    for (const c of pegada) {
      const v = this.toView(c.x, c.y);
      const d = v.vx + v.vy;
      if (!melhor || d > melhor.d || (d === melhor.d && v.vx > melhor.vx)) melhor = { d, vx: v.vx, c };
    }
    return melhor.c.x === x && melhor.c.y === y;
  }

  /** Uma caixa isométrica simples: base em losango, duas faces e o topo. */
  caixaIso(ctx, cx, cy, rx, ry, alto, [esq, dir, topo]) {
    ctx.fillStyle = esq;
    ctx.beginPath();
    ctx.moveTo(cx - rx, cy);
    ctx.lineTo(cx, cy + ry);
    ctx.lineTo(cx, cy + ry - alto);
    ctx.lineTo(cx - rx, cy - alto);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = dir;
    ctx.beginPath();
    ctx.moveTo(cx + rx, cy);
    ctx.lineTo(cx, cy + ry);
    ctx.lineTo(cx, cy + ry - alto);
    ctx.lineTo(cx + rx, cy - alto);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = topo;
    ctx.beginPath();
    ctx.moveTo(cx, cy - ry - alto);
    ctx.lineTo(cx + rx, cy - alto);
    ctx.lineTo(cx, cy + ry - alto);
    ctx.lineTo(cx - rx, cy - alto);
    ctx.closePath();
    ctx.fill();
  }

  fillDiamond(ctx, x, y, fill, stroke = null) {
    const { sx, sy } = this.iso(x, y);
    this.diamond(ctx, sx, sy);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  // ---- render --------------------------------------------------------------

  render(dt) {
    // Sem `dt` (um render pedido à mão, de fora do laço) o relógio viraria
    // NaN para sempre, e com ele todo o balanço, o tremor e o pulso da luz.
    // Pausa de impacto: com o jogo congelado, o tempo de tudo (animações, efeitos, números) anda a 5%.
    if (this.congela > 0 && Number.isFinite(dt)) { this.congela = Math.max(0, this.congela - dt); dt *= 0.05; }
    this.time += Number.isFinite(dt) ? dt : 0;
    this.fx.update(dt);
    const ctx = this.ctx;

    ctx.save();
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 2);
      const k = this.shake * this.shake * 16;
      ctx.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k);
    }

    const sky = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    // Caverna: o vazio fora do mapa é breu, e não o roxo do céu (a parede translúcida mostrava um fundo roxo).
    sky.addColorStop(0, this.field.paredeDeCaverna ? '#0b0a10' : '#231d33');
    sky.addColorStop(1, this.field.paredeDeCaverna ? '#06050a' : '#13111b');
    ctx.fillStyle = sky;
    ctx.fillRect(-60, -60, this.canvas.width + 120, this.canvas.height + 120);

    // Ocupantes indexados por coordenada de câmera, para a checagem de oclusão.
    const byView = new Map();
    const byTile = new Map();
    for (const c of this.enc.combatants) {
      // O CORPO FICA.
      //
      // Antes era `if (c.dead && c.kind === 'npc') continue;` — o inimigo
      // morto sumia do tabuleiro, e com ele a pose de morte, que só chegava a
      // aparecer para o grupo. Deixar o corpo é o que faz a leitura bater com
      // a ficção: alguém morreu ali, e ali é onde se procura o que ele
      // carregava.
      //
      // Dois efeitos colaterais, por este laço também alimentar a oclusão:
      // um corpo atrás de um bloco alto agora o deixa translúcido, e dois
      // ocupantes no mesmo quadrado disputam a mesma chave. A segunda parte
      // é resolvida logo abaixo; a primeira é aceitável, porque um corpo
      // atrás de uma parede é exatamente o que o jogador quer enxergar.
      // Quem está andando é ordenado pelo quadrado em que ESTÁ, não pelo
      // destino: senão a figura passa por cima de paredes que já deixou.
      const w = this.fx.positionFor(c.id);
      const tx = w ? Math.round(w.x) : c.pos.x;
      const ty = w ? Math.round(w.y) : c.pos.y;
      // Grande e Enorme entram na ordem pela casa da FRENTE da pegada (a mais
      // perto da camera na vista atual): assim as outras casas da pegada ja
      // foram pintadas e nao cortam as pernas da figura centrada nelas.
      let v = this.toView(tx, ty);
      const pegadaF = c.pos.f ?? 1;
      for (let dy = 0; dy < pegadaF; dy++) {
        for (let dx = 0; dx < pegadaF; dx++) {
          const o = this.toView(tx + dx, ty + dy);
          if (o.vx + o.vy > v.vx + v.vy) v = o;
        }
      }
      const kv = vkey(v.vx, v.vy);
      // O corpo nunca esconde quem está vivo. Um quadrado com morto e vivo
      // juntos desenha o vivo, aconteça em que ordem acontecer.
      const jaLa = byView.get(kv);
      if (jaLa && !jaLa.dead && c.dead) continue;
      byView.set(kv, c);
      byTile.set(`${tx},${ty}`, c);
    }

    // O que o grupo enxerga, num mapa com escuridão (null no mapa claro).
    // `filtroDeVisao` (F4.4): numa partida de sala o jogador vê o que os SEUS heróis enxergam (`rules/luz.js`).
    this._visao = temEscuridaoEm(this.enc) ? visaoDoGrupo(this.enc, this.filtroDeVisao ?? null) : null;

    const reach = this.overlay.reachable;
    const targetSet = new Set((this.overlay.targets ?? []).map((t) => `${t.pos.x},${t.pos.y}`));
    const pathSet = new Set((this.overlay.path ?? []).map((p) => `${p.x},${p.y}`));

    // Camada de LEITURA: recalculada a cada quadro de propósito. `odds.js` é
    // pura, então prever custa menos que manter dois estados em sincronia.
    this.modo = this.modoDeAlvo();
    this.previsoes = this.modo ? this.preverInimigos(this.modo) : null;
    // A área que a magia pegaria se o jogador clicasse AGORA, e quem está nela.
    this.areaMirada = this.areaDaMira();
    const escolhidos = this.alvosEscolhidos();
    // O chão que uma magia deixou (Graxa escura, Teia branca) enquanto ela
    // durar, e a aura dos Espíritos Guardiões em volta de quem a conjurou.
    const zonas = new Map();
    for (const z of this.enc.zonas ?? []) for (const k of z.casas) zonas.set(k, COR_DA_ZONA[z.spellId] ?? COR_DA_ZONA.graxa);
    // A aura marca só a BORDA, fraquinha: quem anda sabe onde ela começa,
    // e o chão debaixo do clérigo não vira um tapete dourado.
    for (const a of this.enc.auras ?? []) {
      const casas = new Set(this.enc.casasDaAura(a).map((t) => `${t.x},${t.y}`));
      for (const k of casas) {
        const [x, y] = k.split(',').map(Number);
        const borda = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !casas.has(`${x + dx},${y + dy}`));
        if (borda && !zonas.has(k)) zonas.set(k, COR_DA_ZONA.aura);
      }
    }
    for (const a of this.overlay.auras ?? []) zonas.set(`${a.x},${a.y}`, COR_DA_ZONA.auraMagica);
    const miraAliados = this.modo?.kind === 'spell' && this.enc.miraAliados(this.modo.spell);

    this.fx.drawGround(ctx, this);
    // A metade de trás da roda dos Espíritos Guardiões vem antes das figuras.
    this.drawMagiasAtivas(ctx, 'tras');

    this._salasOcupadas = this.salasDoGrupo();
    this._salasReveladas = this.calcularSalasReveladas();
    this._figuras = this.figurasNaTela();
    // Árvores que esmaecem neste quadro: as que escondem a casa sob o cursor
    // ou o destino do caminho. Sem isso o jogador mira uma casa que não vê.
    this._copas = this.coberturaDasCopas();
    this._esmaecer = new Set();
    const fim = this.overlay.path?.[this.overlay.path.length - 1];
    for (const t of [this.hover, fim]) {
      const c = t && this._copas.get(`${t.x},${t.y}`);
      if (c && c.frac > 0.1) for (const k of c.arvores) this._esmaecer.add(k);
    }
    // Domos de proteção em cena (quase sempre nenhum): entram no laço de
    // profundidade, pela diagonal da casa, como as figuras.
    const domos = this.fx.domosAtivos(this);
    // O chão do mapa não flutua: antes do primeiro ladrilho, o barranco.
    this.desenharBarranco(ctx);
    let lastD = -1;
    for (const cell of this.order) {
      // Ao mudar de diagonal, desenha quem estava na anterior.
      if (cell.d !== lastD && lastD >= 0) this.fecharDiagonal(ctx, byView, lastD, domos);
      lastD = cell.d;

      const { x, y, vx, vy } = cell;
      const transp = this.transparenciaDaCasa(x, y, vx, vy, byView);
      // O INTERIOR DE UMA CONSTRUÇÃO QUE O GRUPO NÃO VÊ fica coberto: sem móvel nem objeto, e o
      // piso no escuro. Com a fachada fechada (muro inteiro, porta fechada) o prédio lê como um
      // bloco, mesmo onde a parede arruinada é baixa demais para esconder o que há dentro.
      const salaDaCasa = this.field.fachadaFechada ? this.field.sala?.get(`${x},${y}`) : null;
      const oculta = Boolean(salaDaCasa) && this._salasReveladas !== 'todas' && !this._salasReveladas?.has(salaDaCasa);
      this.drawTile(ctx, x, y, transp.chao, oculta ? 0 : transp.objeto);
      // PRETO INTEIRO, com o traço da mesma cor: o piso e a grade não aparecem, só as paredes, as portas e as janelas.
      // Em ruína (sem telhado, com a parede caída) o interior fechado não é um poço preto: o piso aparece, bem escuro.
      if (oculta) {
        if (this.salaEmRuina(salaDaCasa)) this.fillDiamond(ctx, x, y, 'rgba(8,6,12,.5)', 'rgba(8,6,12,.5)');
        else this.fillDiamond(ctx, x, y, '#06050a', '#06050a');
      }
      this.desenharParedes(ctx, x, y, cell.d);

      const k = `${x},${y}`;
      if (reach) {
        const node = reach.get(k);
        if (node && node.cost > 0 && !this.enc.occupied(x, y, this.overlay.selected)) {
          this.marcar(ctx, x, y, 'rgba(96,168,255,.26)', 'rgba(140,200,255,.45)');
        }
      }
      if (this.modo && this.modo.limite > 0) {
        const d = distanceFt(this.modo.origem ?? this.modo.actor.pos, { x, y });
        if (d > 0 && d <= this.modo.alcance) {
          this.marcar(ctx, x, y, CHAO_ALCANCE.fill, CHAO_ALCANCE.stroke);
        } else if (d > 0 && d <= this.modo.limite) {
          this.marcar(ctx, x, y, CHAO_LONGO.fill, CHAO_LONGO.stroke, true);
        }
      }
      if (zonas.has(k)) this.fillDiamond(ctx, x, y, zonas.get(k).fill, zonas.get(k).stroke);
      if (this.areaMirada?.casas.has(k)) {
        const ok = this.areaMirada.ok;
        this.marcar(ctx, x, y, ok ? 'rgba(255,128,48,.30)' : 'rgba(150,150,160,.22)',
          ok ? 'rgba(255,170,100,.9)' : 'rgba(210,90,80,.75)');
      }
      const papel = this.areaMirada?.papeis.get(k);
      if (papel) this.fillDiamond(ctx, x, y, PAPEL_NA_AREA[papel].fill, PAPEL_NA_AREA[papel].stroke);
      if (escolhidos.has(k)) this.fillDiamond(ctx, x, y, 'rgba(232,195,90,.35)', '#ffe08a');
      if (this.previsoes?.impossiveis.has(k)) this.tintaImpossivel(ctx, x, y);
      if (pathSet.has(k)) this.marcar(ctx, x, y, 'rgba(170,225,255,.42)', 'rgba(200,240,255,.8)');
      if (targetSet.has(k)) {
        // Alvo possível: vermelho quando a ação mira inimigo, verde quando
        // mira aliado (cura, Bênção, Armadura Arcana).
        if (miraAliados) this.fillDiamond(ctx, x, y, 'rgba(110,200,120,.24)', '#8ff0a0');
        else this.fillDiamond(ctx, x, y, 'rgba(255,90,70,.22)', '#ff6a4b');
      }
      if (this.hover && this.hover.x === x && this.hover.y === y) {
        this.marcar(ctx, x, y, 'rgba(255,255,255,.08)', 'rgba(255,255,255,.5)');
      }
    }
    if (lastD >= 0) {
      this.fecharDiagonal(ctx, byView, lastD, domos);
      this.fx.domosNaDiagonal(ctx, this, domos, lastD, 'frente');
    }
    this.desenharRaioX(ctx);
    if (this._visao) this.desenharEscuridao(ctx, byView);
    else this.desenharAmbienteAoLuz(ctx);
    this.desenharSilhuetas(ctx);
    this.desenharContatosPerdidos(ctx);

    // O número de dardos (ou a ordem) por cima de cada alvo escolhido.
    for (const [k, n] of escolhidos) {
      const [ex, ey] = k.split(',').map(Number);
      this.seloDeAlvo(ctx, ex, ey, n);
    }

    // A cruz vem DEPOIS das figuras, de propósito: ela precisa riscar a
    // criatura, não ficar escondida atrás das pernas dela.
    if (this.previsoes) {
      for (const k of this.previsoes.impossiveis) {
        const [ix, iy] = k.split(',').map(Number);
        this.cruzImpossivel(ctx, ix, iy);
      }
    }

    this.drawMagiasAtivas(ctx, 'frente');
    this.fx.drawOver(ctx, this);
    this.drawFloaters(ctx, dt);
    ctx.restore();

    // Fora do `restore` do tremor: o cartão é leitura, e texto que sacode fica
    // ilegível justamente no quadro em que o jogador quer ler.
    this.drawCartao(ctx);
  }

  /**
   * Fecha a diagonal `d`: o que está em pé nela, na ordem certa com os domos.
   * A frente dos domos da diagonal de trás vem DEPOIS do chão desta (o arco
   * da frente pisa nele) e antes do que está em pé aqui.
   */
  fecharDiagonal(ctx, byView, d, domos) {
    if (domos.length) {
      this.fx.domosNaDiagonal(ctx, this, domos, d - 1, 'frente');
      this.fx.domosNaDiagonal(ctx, this, domos, d, 'tras');
    }
    this.descarregarObjetos(ctx);
    this.drawOccupantsOnDiagonal(ctx, byView, d);
    // A Muralha de Vento: as tiras desta diagonal, depois das figuras dela.
    paredesNaDiagonal(ctx, this, d);
  }

  drawOccupantsOnDiagonal(ctx, byView, d) {
    for (const [k, c] of byView) {
      const [vx, vy] = k.split(',').map(Number);
      // No Plano Etéreo (Piscar) a figura vira um fantasma, não some: parece defeito se sumir.
      if (vx + vy === d && (this.figuraVisivel(c) || hasCondition(c, 'etereo'))) this.drawCombatant(ctx, c);
    }
  }

  /** No escuro, quem não é do grupo só aparece se alguém do grupo o vê. */
  figuraVisivel(c) {
    // Piscar: quem está no Plano Etéreo não aparece no tabuleiro.
    if (hasCondition(c, 'etereo')) return false;
    // Quem está numa construção que o grupo não vê por dentro não aparece (mesmo sem neblina).
    if (c.side !== 'party' && this.field.fachadaFechada && this._salasReveladas !== 'todas' && c.pos) {
      const sala = this.field.sala?.get(`${c.pos.x},${c.pos.y}`);
      if (sala && !this._salasReveladas?.has(sala)) return false;
    }
    if (!this._visao || c.side === 'party') return true;
    // Criatura Grande (2 x 2): vista se QUALQUER casa da pegada está à vista.
    // Só a âncora decidia, e o dragão sumia mesmo com três das quatro casas
    // dele no campo de visão.
    const p = c.pos.f ?? 1;
    for (let j = 0; j < p; j++) {
      for (let i = 0; i < p; i++) if (this._visao.has(`${c.pos.x + i},${c.pos.y + j}`)) return true;
    }
    return false;
  }

  /**
   * A ESCURIDÃO: uma máscara por cima do tabuleiro inteiro. Escuro onde o
   * grupo não vê (o chão ainda se adivinha, para dar para andar), meia-luz na
   * penumbra, nada onde é claro. As figuras e os objetos das casas vistas
   * levam um recorte da altura deles, senão a máscara cortaria a cabeça de
   * quem está na luz.
   *
   * A máscara só é refeita quando muda o que se vê (posições, tochas,
   * rotação); a cada quadro ela é só colada, já borrada nas bordas. Por cima,
   * um brilho quente em volta de cada fonte de luz.
   */
  desenharEscuridao(ctx, byView) {
    const { width: w, height: h } = this.canvas;
    const figuras = [];
    for (const c of byView.values()) {
      if (!c.dead && this.figuraVisivel(c) && this._visao.has(`${c.pos.x},${c.pos.y}`)) figuras.push(c);
    }
    // Quem tem bolha de proteção leva um recorte maior (a bolha passa da figura).
    const domoDe = new Map(this.fx.domosAtivos(this).filter((o) => o.it.id != null).map((o) => [o.it.id, o.it]));
    const chave = [this.rot, w, h, figuras.map((c) => `${c.pos.x},${c.pos.y}${domoDe.has(c.id) ? 'd' : ''}`).join(';')].join('|');
    if (this._mascara?.visao !== this._visao || this._mascara.chave !== chave) {
      const nitida = this._mascara?.nitida ?? document.createElement('canvas');
      const borrada = this._mascara?.borrada ?? document.createElement('canvas');
      for (const cv of [nitida, borrada]) { if (cv.width !== w) cv.width = w; if (cv.height !== h) cv.height = h; }
      const m = nitida.getContext('2d');
      m.globalCompositeOperation = 'source-over';
      m.clearRect(0, 0, w, h);
      // O véu do que o grupo não enxerga: 80% por padrão (o já visto se adivinha); o mapa pode
      // pedir PRETO (`veuDaEscuridao: 1`, Árvore Trovão): só se vê o que o personagem vê.
      m.fillStyle = `rgba(5, 4, 10, ${this.field.veuDaEscuridao ?? 0.8})`;
      m.fillRect(0, 0, w, h);
      m.globalCompositeOperation = 'destination-out';
      m.fillStyle = '#000';
      const recortar = (x, y, alto) => {
        const hgt = this.alturaVisual(x, y);
        const { sx, sy } = this.iso(x, y, hgt);
        // A face lateral desce do topo: a do degrau (altura) ou a da parede antiga.
        const paredeAntiga = this.field.tileAt(x, y) === 1 && !SUPERFICIE[this.field.surfaceAt(x, y)];
        const baixo = paredeAntiga ? LIFT * 1.6 : hgt * LIFT;
        m.beginPath();
        m.moveTo(sx - TW / 2, sy + TH / 2 + baixo);
        m.lineTo(sx - TW / 2, sy + TH / 2 - alto);
        m.lineTo(sx + TW / 2, sy + TH / 2 - alto);
        m.lineTo(sx + TW / 2, sy + TH / 2 + baixo);
        m.lineTo(sx, sy + TH + baixo);
        m.closePath();
        m.fill();
      };
      for (const [k, nivel] of this._visao) {
        const [x, y] = k.split(',').map(Number);
        m.globalAlpha = nivel === CLARO ? 1 : 0.45;
        // Parede e objeto alto mostram a face inteira; chão, só o losango.
        const sup = SUPERFICIE[this.field.surfaceAt(x, y)];
        const alto = sup?.objeto ? 48 : TH / 2;
        recortar(x, y, alto);
      }
      for (const c of figuras) {
        m.globalAlpha = this._visao.get(`${c.pos.x},${c.pos.y}`) === CLARO ? 1 : 0.45;
        const { sx, sy } = this.center(c.pos.x, c.pos.y);
        const domo = domoDe.get(c.id);
        if (domo) {
          // Centrado na pegada (a Grande ocupa 2x2) e da largura da bolha.
          const meio = (domo.f - 1) / 2;
          const q = this.centerF(c.pos.x + meio, c.pos.y + meio);
          const meia = domo.raio + 4;
          m.fillRect(q.sx - meia, q.sy - (domo.altura + 16), meia * 2, domo.altura + 34);
        }
        else m.fillRect(sx - 30, sy - 84, 60, 84);
      }
      m.globalAlpha = 1;
      const b = borrada.getContext('2d');
      b.clearRect(0, 0, w, h);
      b.filter = 'blur(5px)';
      b.drawImage(nitida, 0, 0);
      b.filter = 'none';
      this._mascara = { nitida, borrada, visao: this._visao, chave };
    }
    ctx.drawImage(this._mascara.borrada, 0, 0);
    this.zonasObscurasPorCima(ctx, figuras);

    // O BRILHO QUENTE das tochas e fogueiras. São DUAS poças por fonte: um
    // miolo curto e forte, que dá o lugar do fogo, e um halo largo e fraco,
    // que faz a luz morrer aos poucos em vez de ter borda. Com uma só, ou o
    // fogo não aparecia, ou o chão em volta ficava lavado.
    //
    // O brilho é pintado NUMA TELA À PARTE e depois furado pela mesma máscara
    // da escuridão. Somado direto no tabuleiro, ele atravessava o breu: as
    // tochas do castelo acendiam salas que o grupo ainda não tinha visto.
    // Sem fogo em cena não há o que acender: um mapa ao ar livre não paga
    // duas passadas de tela cheia nem os 10 MB do canvas à toa.
    const fontes = fontesDeLuz(this.enc);
    // O AMBIENTE (esporos, brasas, cintilar da água) vai na mesma tela: furado pela mesma máscara, só se vê onde se enxerga.
    const ambiente = emissoresDoAmbiente(this.field);
    if (!fontes.length && ambiente.vazio) return;
    const brilho = this._brilho ?? (this._brilho = document.createElement('canvas'));
    if (brilho.width !== w) brilho.width = w;
    if (brilho.height !== h) brilho.height = h;
    const bg = brilho.getContext('2d');
    bg.globalCompositeOperation = 'source-over';
    bg.clearRect(0, 0, w, h);
    bg.globalCompositeOperation = 'lighter';
    for (const f of fontes) {
      const { sx, sy } = this.center(f.pos.x, f.pos.y);
      const r = (Math.max(f.claro, 5) / 5) * TW * 0.55;
      // Duas ondas que não casam: o fogo treme sem repetir o compasso.
      const pulso = Math.sin(this.time * 9 + f.pos.x * 1.7) * 0.02 + Math.sin(this.time * 14.3 + f.pos.y * 2.9) * 0.012;
      for (const [esc, forca, cor] of [[1, 0.26, '255, 186, 96'], [1.9, 0.10, '255, 136, 52']]) {
        const g = bg.createRadialGradient(sx, sy - 20, 3, sx, sy, r * esc);
        g.addColorStop(0, `rgba(${cor}, ${forca + pulso})`);
        g.addColorStop(0.55, `rgba(${cor}, ${(forca + pulso) * 0.35})`);
        g.addColorStop(1, 'rgba(255, 120, 40, 0)');
        bg.fillStyle = g;
        bg.beginPath();
        bg.ellipse(sx, sy, r * esc, r * esc / 2, 0, 0, Math.PI * 2);
        bg.fill();
      }
    }
    desenharAmbiente(bg, this.time, (x, y) => this.center(x, y), ambiente);
    // UMA passada. O véu da escuridão é de 80%, de propósito: o que já foi
    // visto continua se enxergando de leve. O brilho segue a mesma conta e
    // sobra a 20% no escuro, o que é o fogo longe, não um holofote.
    bg.globalCompositeOperation = 'destination-out';
    bg.drawImage(this._mascara.borrada, 0, 0);
    bg.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(brilho, 0, 0);
    ctx.restore();
  }

  /** O tipo de `c` é barrado por um Círculo Mágico e ele está fora, encostado na borda. */
  barradoPeloCirculo(c) {
    for (const z of this.enc.zonas ?? []) {
      if (!z.circuloMagico || z.circuloMagico.tipo !== (c.tipo ?? 'humanoide') || c.dead) continue;
      const f = c.pos.f ?? 1;
      if (this.enc.pegadaEmZona(z, c.pos.x, c.pos.y, f)) continue;
      for (const k of z.casas) {
        const [zx, zy] = k.split(',').map(Number);
        if (zx >= c.pos.x - 1 && zx <= c.pos.x + f && zy >= c.pos.y - 1 && zy <= c.pos.y + f) return true;
      }
    }
    return false;
  }

  drawCombatant(ctx, c, fantasma = false) {
    const walking = this.fx.positionFor(c.id);
    const here = walking ?? c.pos;
    // Criatura Grande ocupa 2x2 e Enorme 3x3. A âncora continua sendo o canto,
    // porque é com ele que o motor conta quadrados — mas ela é DESENHADA no
    // centro da própria pegada, senão o ogro fica pendurado num canto do
    // espaço que ocupa.
    const pegada = c.pos.f ?? 1;
    const meio = (pegada - 1) / 2;
    const { sx: baseX, sy: baseY0 } = this.centerF(here.x + meio, here.y + meio);
    const baseY = baseY0 - (walking?.lift ?? 0);
    const down = c.dead || hasCondition(c, 'inconsciente');
    const ally = c.side === 'party';

    // Deslocamento de investida, já no espaço da câmera.
    const off = this.fx.offsetFor(c.id);
    let sx = baseX;
    // Grande e Enorme: com os pes no centro da pegada o corpo sobe e a figura
    // parece estar so na casa de tras. O dono pediu o corpo NO MEIO das casas:
    // a figura desce meia casa (em tela) por casa a mais de pegada, e os pes
    // vao para a metade da frente.
    let sy = baseY + (pegada - 1) * TH * 0.75;
    if (off) {
      const v = this.rotateVec(off.dx, off.dy);
      sx += (v.dx - v.dy) * (TW / 2);
      sy += (v.dx + v.dy) * (TH / 2);
      sy -= off.lift ?? 0;   // salto do golpe de cima para baixo
    }

    // Voo: a figura boia acima do chão e a sombra fica no chão, menor e mais fraca.
    // Levitação: o dobro da altura do voo, e a figura balança devagar (6 m do chão).
    const levita = !down && hasCondition(c, 'levitando') && !hasCondition(c, 'caido');
    // `pairaNoAr` (o stirge): a figura e sempre desenhada no ar, sem a regra de voo.
    // Voo de ficha: so quem PAIRA (`hover`) e desenhado no ar. No livro o espectro,
    // a aparicao, a caveira candente e o spectator pairam -- flutuam sempre. O
    // dragao verde nao: ele voa batendo as asas e POUSA, entao atravessa o
    // terreno pelo ar (`voaPelaFicha` no combate) mas fica de quatro no chao.
    // A primeira versao erguia tudo que tinha `flyFt`, e o dragao de quatro
    // patas boiava 26 px acima do proprio quadrado.
    const voaPorFicha = !!c.flyFt && !!c.hover && !this.enc?.tetoBaixo;
    // `vooVisual`: o trecho voado do dragao (`main.js` liga no `moved` e desliga
    // quando o passo termina) -- ele sobe, cruza no ar e pousa.
    const voa = !down && (levita || hasCondition(c, 'voando') || c.pairaNoAr || voaPorFicha || c.vooVisual) && !hasCondition(c, 'caido');
    if (voa) sy -= (levita ? 46 : 26) + Math.round(Math.sin(this.time * 2.4 + c.pos.x * 0.9 + c.pos.y * 0.55) * 3);

    // Círculo Mágico: o inimigo barrado que parou na borda leva um contorno vermelho tracejado piscando.
    if (!fantasma && !down && !this.soCenario && this.barradoPeloCirculo(c)) {
      const p = 0.55 + 0.35 * Math.sin(this.time * 5);
      for (let dy = 0; dy < pegada; dy++) for (let dx = 0; dx < pegada; dx++) {
        this.fillDiamond(ctx, here.x + dx, here.y + dy, `rgba(255,50,40,${0.16 * p})`, 'rgba(0,0,0,0)');
        ctx.save(); ctx.lineWidth = 3; this.strokeDiamondTracejado(ctx, here.x + dx, here.y + dy, `rgba(255,80,70,${p})`); ctx.restore();
      }
    }
    // Piscar: no Plano Etéreo a figura é um fantasma azul-pálido, ~50% de alfa, sem sombra, anel nem barra.
    const eter = hasCondition(c, 'etereo');
    if (!eter && !fantasma) {
      ctx.fillStyle = voa ? 'rgba(0,0,0,.26)' : 'rgba(0,0,0,.42)';
      ctx.beginPath();
      ctx.ellipse(baseX, baseY, voa ? 13 : 17, voa ? 6 : 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Gancho de quem desenha por baixo da figura (a taverna põe o marcador do jogador aqui).
    if (!eter && !fantasma) this.aoPes?.(ctx, c, baseX, baseY);
    if (voa && !eter && !fantasma) {
      // Segunda elipse tracejada sob a figura: marca a altura do voo.
      ctx.save();
      ctx.strokeStyle = 'rgba(223,243,255,.55)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.ellipse(baseX, baseY, 15 + Math.sin(this.time * 3), 7 + Math.sin(this.time * 3) * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // `soCenario`: o tabuleiro de fundo da tela de título. Lá a figura é
    // personagem de cena, não peça de jogo — sem anel de lado, sem barra.
    // O INVOCADO leva anel próprio: verde-limão e pontilhado, para não se confundir
    // com o ciano contínuo dos heróis nem com o vermelho dos inimigos.
    if (!fantasma && !down && !this.soCenario && !eter) {
      ctx.save();
      if (c.invocado && !c.familiar) {
        ctx.strokeStyle = 'rgba(190,240,90,.95)';
        ctx.setLineDash([4, 3]);
      } else if (c.familiar) {
        // O familiar é do grupo: o aro ciano dos aliados, mais largo, porque o bicho é miúdo.
        ctx.strokeStyle = 'rgba(110,200,255,.95)';
      } else {
        ctx.strokeStyle = ally ? 'rgba(110,200,255,.85)' : 'rgba(255,120,96,.8)';
      }
      ctx.lineWidth = c.familiar ? 3 : 2;
      ctx.beginPath();
      ctx.ellipse(baseX, baseY, 19 * pegada, 9.5 * pegada, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.lineWidth = 1;
    }

    if (!fantasma && this.overlay.selected === c) {
      ctx.strokeStyle = '#ffd24a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(baseX, baseY, 23 * pegada, 11.5 * pegada, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    // Caído usa a mesma pose de quem está no chão, mas sem o esmaecido:
    // continua consciente, só derrubado.
    const prone = !down && hasCondition(c, 'caido');
    // No trecho voado, a folha no estado `~voo` (asas abertas). Sem essa folha,
    // `folhaImportada` devolve a normal, entao a regra vale antes da arte.
    const sheet = getSheet(c.vooVisual ? `${String(c.look).split('~')[0]}~voo` : c.look);

    // QUAL ANIMAÇÃO MOSTRAR.
    //
    // Antes esta linha escolhia entre três: `down`, o que `c.anim` dissesse
    // (e só `main.js` dizia, e só 'attack'), e `idle`. Resultado: a figura
    // deslizava pelo tabuleiro na pose parada, o quadro de dano era desenhado
    // nas setenta folhas e nunca aparecia, e inconsciente, dormindo e MORTO
    // saíam com o mesmo desenho — o jogador não tinha como saber do tabuleiro
    // se valia gastar uma ação para estabilizar alguém ou se já era tarde.
    //
    // A ordem é por PRECEDÊNCIA, do irreversível para o transitório: morto
    // vence tudo, depois a inconsciência, depois a animação disparada por um
    // evento (golpe, dano), depois andar, e parado é o que sobra.
    //
    // Dormindo distingue-se de morrendo pelos PV: a magia Sono aplica
    // `inconsciente` em quem está de pé e inteiro, enquanto quem chegou a
    // zero está sangrando. Mesma condição, duas leituras, e a diferença é a
    // que decide o turno de quem olha.
    const dormindo = hasCondition(c, 'inconsciente') && c.hp > 0;
    const andando = Boolean(walking && (walking.dx || walking.dy));
    const animName = c.dead ? 'dead'
      : dormindo ? 'sleep'
        : down || prone ? 'down'
          : c.anim?.name
            ?? (andando ? 'walk' : 'idle');
    // A folha pode não trazer a animação pedida — o dano é o caso de hoje, e
    // o `drawSprite` já cai para `idle` sozinho. Aqui o recuo precisa ser o
    // mesmo, senão `frameAt` recebe `undefined` no dia em que alguém pedir um
    // quadro que não é o zero.
    const anim = animDaFolha(sheet, animName);
    const frame = c.anim?.frame ?? frameAt(anim, this.time + (c.pos.x + c.pos.y) * 0.17);

    // A direção do mundo gira junto com a câmera.
    const world = walking && (walking.dx || walking.dy)
      ? { dx: walking.dx, dy: walking.dy }
      : c.facingVec ?? { dx: 1, dy: 1 };
    const face = this.rotateVec(world.dx, world.dy);
    // A direção vira coordenada de TELA antes de virar fileira: no isométrico
    // o x da tela é (dx - dy) e o y é (dx + dy). Quem traduz tela em fileira é
    // `linhaDaDirecao`, que pergunta à folha quantas direções ela tem — três,
    // desenhadas em código, ou oito, se a folha vier de fora.
    //
    // No chão não há direção: a figura está deitada, e a fileira 0 é a única
    // que os pintores de `down` desenham.
    const { row, flip } = down
      ? { row: 0, flip: false }
      : linhaDaDirecao(sheet.dirs, face.dx - face.dy, face.dx + face.dy);

    // DANO EM FOLHA QUE NÃO TRAZ QUADRO DE DANO.
    //
    // Os setenta pintores procedurais honram `pose.kind === 'hurt'` e
    // desenham o encolhimento — são vinte lugares entre `draw.js` e os
    // planos. Uma folha importada só tem o que foi gerado, e gerar o dano
    // custa uma geração POR DIREÇÃO para um quadro de 220 ms: oito desenhos
    // que o jogador mal alcança ver, vezes cada criatura do elenco.
    //
    // Quando a folha não traz o quadro, o recuo vira EFEITO: a figura parada,
    // deslocada dois pixels para os lados, com tinta vermelha por cima. O
    // `drawSprite` já cai para `idle` sozinho quando a animação não existe,
    // então o que falta aqui é só o tremor e a cor.
    //
    // Quem TEM o quadro continua usando o quadro. Isto é um recuo, não uma
    // troca — nenhum dos setenta desenhos existentes é jogado fora.
    const danoSemQuadro = animName === 'hurt' && !sheet.anims.hurt;
    // ~25 Hz: três idas e vindas dentro dos 220 ms que o golpe dura.
    const tremor = danoSemQuadro ? (Math.floor(this.time * 25) % 2 ? 2 : -2) : 0;
    // O branco do impacto vem primeiro e decai rápido; o vermelho da dor fica
    // enquanto a pose durar. Trocar na força do flash dá as duas leituras em
    // vez de uma esconder a outra.
    // O TETO DO CLARÃO EXISTE PORQUE A TINTA FOI CONSERTADA.
    //
    // `c.flash` começa em 1, e enquanto a tinta vazava para o ladrilho essa
    // força se diluía no piso em volta — ninguém via o quanto era. Confinada
    // à figura, força 1 apaga a criatura inteira e deixa uma silhueta branca
    // chapada no lugar dela. O golpe tem de piscar, não de apagar quem levou.
    //
    // Meio clarão ainda lê como impacto e deixa a criatura reconhecível por
    // baixo, que é o que importa num tabuleiro com oito figuras parecidas.
    const CLARAO = 0.5;
    const branco = (f) => ({ color: '#ffffff', strength: Math.min(CLARAO, f * CLARAO) });
    // Morto-vivo erguido por Animar os Mortos: tinta verde-fantasma sobre a figura.
    const erguido = !down && c.invocado && c.tipo === 'morto-vivo' ? { color: '#6fffb0', strength: 0.3 } : null;
    const tinta = eter ? { color: '#a8d8ff', strength: 0.6 }
      : c.flash > 0.35 ? branco(c.flash)
        : danoSemQuadro ? { color: '#c03028', strength: 0.45 }
          : c.flash > 0 ? branco(c.flash) : erguido;

    drawSprite(ctx, sheet, animName, frame, {
      x: sx + tremor,
      y: sy + 6,
      // 1:1 para quem ocupa um quadrado — escala quebrada borra a grade de
      // pixels. Para Grande e Enorme a regra cede: um ogro desenhado 1:1 em
      // cima de uma base do dobro da largura lê como anão num tablado. A conta
      // vai atrás da proporção real (ogro ~1,7x a altura de um humano), que a
      // célula de 80 px sozinha não alcança.
      // Aumentar/Reduzir mexem na escala (×1,25 / ×0,75): é o único sinal de tamanho do jogo.
      scale: (1 + (pegada - 1) * 0.4) * (hasCondition(c, 'aumentado') ? 1.25 : hasCondition(c, 'reduzido') ? 0.75 : 1),
      flip,
      row,
      // O morto esmaece: continua lá para ser visto e saqueado, mas não
      // disputa atenção com quem ainda pode agir.
      // O INCORPOREO E TRANSLUCIDO, e quem o faz translucido e o motor.
      //
      // Pixel art nao tem meio-alfa: a folha do espectro sai opaca como
      // qualquer outra (e tem de sair, senao o contorno vira franja). A
      // transparencia e uma propriedade da CRIATURA, nao do desenho dela —
      // ela atravessa parede, e o tabuleiro aparece por dentro. 0,68 ainda
      // deixa a caveira e a coroa de cabelo legiveis sobre o chao escuro.
      //
      // Multiplica em vez de substituir: um espectro que ja agiu, ou que
      // caiu, tem de esmaecer MAIS, nao voltar a ficar solido.
      alpha: (c.incorporeo && !down ? 0.68 : 1)
        * (eter ? 0.5 : c.dead ? 0.72 : (c.acted && ally && !down ? 0.62 : 1)),
      tint: tinta,
    });
    if (fantasma) return;      // a silhueta é só o sprite: sem clarão, barra nem ícones
    if (c.flash > 0) c.flash -= 0.08;

    if (eter) return;
    this.drawConditionFx(ctx, c, baseX, baseY, prone);

    // O ÍCONE DIZ QUE TIPO DE CHÃO.
    //
    // A figura deitada responde "está no chão", que é a leitura instantânea
    // que decide alvo e movimento. Ela não consegue dizer QUAL dos três — com
    // 40 px de silhueta, um goblin dormindo e um goblin morto são o mesmo
    // desenho, e tentar distingui-los na arte custaria uma geração por estado
    // e por criatura para uma diferença que ninguém enxerga.
    //
    // E isto também CONSERTA uma leitura que estava invertida. A condição
    // `inconsciente` usa a caveira, e a magia Sono aplica `inconsciente`: a
    // caveira aparecia sobre quem dormia e sobre quem faz teste de morte —
    // justamente quem ainda pode ser salvo —, enquanto o morto de verdade,
    // que é a bandeira `c.dead` e não uma condição, não mostrava nada.
    //
    // Eram emoji, e isso contrariava uma regra que já estava escrita em
    // `hud.js`: emoji é desenho do sistema operacional e não existe na nossa
    // interface. Agora são ícones do jogo, na paleta dele.
    if (down) {
      const nome = c.dead ? 'morto' : dormindo ? 'dormindo' : 'morrendo';
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(iconeTab(nome), Math.round(baseX - 16), Math.round(baseY - 56));
      return;
    }
    // Gancho de quem desenha por cima da figura (a placa do nome, na taverna).
    this.aoCima?.(ctx, c, baseX, baseY);
    if (this.soCenario) return;

    // Barra de vida com transição suave: o número do motor é instantâneo, mas a
    // barra alcança em ~0,3 s, o que casa com o tempo da animação de impacto.
    const real = Math.max(0, c.hp / c.maxHp);
    const shown = this.displayHp.get(c.id) ?? real;
    const next = shown + (real - shown) * 0.12;
    this.displayHp.set(c.id, Math.abs(next - real) < 0.003 ? real : next);

    const bw = 34;
    const by = baseY - 52 - (c.kind === 'npc' ? 0 : 4);
    ctx.fillStyle = 'rgba(0,0,0,.66)';
    ctx.fillRect(baseX - bw / 2 - 1, by - 1, bw + 2, 6);
    // Rastro vermelho do dano recém-tomado.
    if (shown > real) {
      ctx.fillStyle = 'rgba(255,90,90,.55)';
      ctx.fillRect(baseX - bw / 2, by, bw * shown, 4);
    }
    ctx.fillStyle = ally ? (real > 0.5 ? '#5fd07a' : real > 0.25 ? '#ffc83a' : '#ff5a5a') : '#d4574a';
    ctx.fillRect(baseX - bw / 2, by, bw * real, 4);
    if (c.invocado) {
      // Selo do invocado: losango verde-limão com um ponto escuro, à esquerda da barra.
      const lx = Math.round(baseX - bw / 2 - 8);
      const ly = Math.round(by + 2);
      ctx.fillStyle = 'rgba(0,0,0,.75)';
      ctx.beginPath(); ctx.moveTo(lx, ly - 6); ctx.lineTo(lx + 6, ly); ctx.lineTo(lx, ly + 6); ctx.lineTo(lx - 6, ly); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#bef05a';
      ctx.beginPath(); ctx.moveTo(lx, ly - 5); ctx.lineTo(lx + 5, ly); ctx.lineTo(lx, ly + 5); ctx.lineTo(lx - 5, ly); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2a4a14';
      ctx.fillRect(lx - 1, ly - 1, 2, 2);
    }

    const conds = (c.conditions ?? [])
      .filter((x) => CONDITIONS[x.id] && temIcone(x.id))
      .sort((a, b) => peso(a.id) - peso(b.id));
    if (conds.length) {
      ctx.imageSmoothingEnabled = false;
      const ix = Math.round(baseX - 16);
      const iy = Math.round(by - 34);
      ctx.drawImage(iconeTab(conds[0].id), ix, iy);
      if (conds.length > 1) {
        // O "+N" diz que há mais sem ocupar o espaço de mais um ícone.
        ctx.font = '700 10px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,0,0,.75)';
        ctx.strokeText(`+${conds.length - 1}`, ix + 31, iy + 8);
        ctx.fillStyle = '#ebe2d0';
        ctx.fillText(`+${conds.length - 1}`, ix + 31, iy + 8);
        ctx.lineWidth = 1;
        ctx.textBaseline = 'alphabetic';
      }
    }
  }

  /**
   * Efeitos CONTÍNUOS das condições — desenhados todo quadro enquanto a
   * condição dura, diferente dos efeitos de `fx.js`, que são disparos únicos.
   * É o que faz "queimando" ser uma coisa que se vê, não só um ícone.
   */
  drawConditionFx(ctx, c, sx, sy, prone) {
    const conds = c.conditions ?? [];
    if (conds.length === 0 && !prone) return;
    const t = this.time;
    const has = (id) => conds.some((x) => x.id === id);

    // Queimando: línguas de fogo lambendo a figura.
    if (has('queimando')) {
      ctx.save();
      for (let i = 0; i < 5; i++) {
        const ph = t * 10 + i * 1.6;
        const h = 14 + Math.sin(ph) * 7;
        const x = sx + (i - 2) * 6 + Math.sin(ph * 0.6) * 2.5;
        const y = sy - 4 - (prone ? 0 : 6);
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#ff5a1a';
        ctx.beginPath();
        ctx.moveTo(x, y - h);
        ctx.lineTo(x + 4, y);
        ctx.lineTo(x - 4, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffd24a';
        ctx.beginPath();
        ctx.moveTo(x, y - h * 0.5);
        ctx.lineTo(x + 2, y);
        ctx.lineTo(x - 2, y);
        ctx.closePath();
        ctx.fill();
      }
      // Brasas subindo.
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#ffb04a';
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.9 + i * 0.33) % 1;
        ctx.fillRect(sx + Math.sin(t * 4 + i * 2) * 9, sy - 10 - ph * 42, 2, 2);
      }
      ctx.restore();
    }

    // Atordoado: estrelas girando acima da cabeça.
    if (has('atordoado')) {
      ctx.save();
      ctx.fillStyle = '#ffe14d';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      for (let i = 0; i < 3; i++) {
        const a = t * 3.4 + (i / 3) * Math.PI * 2;
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(a);
        ctx.fillText('✦', sx + Math.cos(a) * 17, sy - 58 + Math.sin(a) * 6);
      }
      ctx.restore();
    }

    // Caído: poeira rente ao chão.
    if (prone) {
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.1 * Math.sin(t * 3);
      ctx.strokeStyle = '#c8b68a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(sx, sy + 2, 20, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Abençoado: argola dourada pulsando.
    if (has('abencoado')) {
      ctx.save();
      ctx.globalAlpha = 0.4 + 0.25 * Math.sin(t * 2.6);
      ctx.strokeStyle = '#ffe9a8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx, sy - 56, 15, 5.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Lento: setas azuis arrastando para trás.
    if (has('lento')) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#8fd8ff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 2; i++) {
        const o = ((t * 0.8 + i * 0.5) % 1) * 14;
        ctx.beginPath();
        ctx.moveTo(sx - 14 - o, sy - 14);
        ctx.lineTo(sx - 20 - o, sy - 9);
        ctx.lineTo(sx - 14 - o, sy - 4);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Esquivando: brilho de escudo em volta.
    if (has('esquivando')) {
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 5);
      ctx.strokeStyle = '#cfe4ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx, sy - 24, 20, 28, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ---- previsão de alvo e alcance ------------------------------------------
  //
  // POR QUE ESTA CAMADA EXISTE
  // O HUD diz o que o personagem TEM; o tabuleiro não dizia nada sobre o ALVO.
  // O jogador clicava e descobria depois se acertava, se estava no alcance
  // longo ou se a parede cortava a linha de visão. Tudo aqui é leitura: as
  // contas vêm de `rules/odds.js`, que é pura, e nenhuma linha deste trecho
  // escreve no encontro.

  /** Losango tracejado — usado no alcance longo, que custa desvantagem. */
  strokeDiamondTracejado(ctx, x, y, stroke) {
    const { sx, sy } = this.iso(x, y);
    ctx.save();
    ctx.setLineDash([5, 4]);
    this.diamond(ctx, sx, sy);
    ctx.strokeStyle = stroke;
    ctx.stroke();
    ctx.restore();
  }

  /** Chão avermelhado sob um alvo que esta ação não alcança. */
  tintaImpossivel(ctx, x, y) {
    this.fillDiamond(ctx, x, y, 'rgba(224, 85, 60, .18)', 'rgba(224, 85, 60, .55)');
  }

  /** Cruz riscando o alvo impossível — a recusa chega ANTES do clique. */
  /**
   * A prévia da área: com uma magia de área na mira, os quadrados que ela
   * pegaria se o jogador clicasse agora (cone e cubo saindo do conjurador na
   * direção do cursor; esfera e quadrado no cursor), se dá para conjurar ali,
   * e quem está dentro. Aliado pego aparece em amarelo, e o que Esculpir
   * Magias poupa aparece em verde — é a pergunta que o jogador faz antes de
   * soltar fogo perto do guerreiro.
   */
  areaDaMira() {
    const m = this.modo;
    if (!m || m.kind !== 'spell' || !m.spell.shape || !this.hover) return null;
    const actor = m.actor;
    // O círculo escolhido conta: a Névoa em círculo maior tem área maior.
    const circulo = this.overlay.mode?.circulo ?? m.spell.level;
    const casas = this.enc.casasDaZona(actor, m.spell, this.enc.areaDaMagia(actor, m.spell, this.hover, circulo) ?? []);
    if (!casas.length) return null;
    const ok = this.enc.canCast(actor, m.spell.id, { point: this.hover, circulo }).ok;
    // A mesma conta do motor: quem dorme, quem queima, quem Esculpir poupa.
    const papeis = new Map();
    let inimigos = 0;
    let aliados = 0;
    for (const { c, papel } of this.enc.afetadosPelaArea(actor, m.spell, casas, circulo)) {
      if (papel === 'inimigo') inimigos += 1;
      if (papel === 'aliado') aliados += 1;
      papeis.set(`${c.pos.x},${c.pos.y}`, papel);
    }
    return { casas: new Set(casas.map((t) => `${t.x},${t.y}`)), ok, papeis, inimigos, aliados, poupados: [...papeis.values()].filter((p) => p === 'poupado').length };
  }

  /** Alvos já marcados numa magia de vários alvos: casa → quantas vezes. */
  alvosEscolhidos() {
    const out = new Map();
    const modo = this.overlay.mode;
    let alvos = modo?.alvos ?? [];
    // Míssil Mágico: os dardos que sobram ao confirmar vão em rodízio para os
    // marcados — o selo mostra essa conta, não só o clique.
    const spell = modo?.kind === 'spell' ? SPELLS[modo.spellId] : null;
    if (['auto', 'raios'].includes(spell?.kind) && alvos.length) {
      const n = this.enc.alvosDaMagia(spell, modo.circulo, this.overlay.selected);
      alvos = Array.from({ length: n }, (_, i) => alvos[i % alvos.length]);
    }
    for (const a of alvos) {
      const k = `${a.pos.x},${a.pos.y}`;
      out.set(k, (out.get(k) ?? 0) + 1);
    }
    return out;
  }

  /** O selo dourado sobre um alvo escolhido, com "×N" quando leva mais de um dardo. */
  seloDeAlvo(ctx, x, y, n) {
    const { sx, sy } = this.iso(x, y);
    const cy = sy + TH / 2 - 46;
    ctx.save();
    ctx.fillStyle = '#2a2430';
    ctx.strokeStyle = '#ffe08a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, cy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffe08a';
    ctx.font = 'bold 11px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n > 1 ? `×${n}` : '✓', sx, cy + 1);
    ctx.restore();
  }

  cruzImpossivel(ctx, x, y) {
    const { sx, sy } = this.iso(x, y);
    const cy = sy + TH / 2 - 22;
    ctx.save();
    ctx.strokeStyle = CARTAO.red;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(sx - 14, cy - 14);
    ctx.lineTo(sx + 14, cy + 14);
    ctx.moveTo(sx + 14, cy - 14);
    ctx.lineTo(sx - 14, cy + 14);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Traduz `overlay.mode` (a ação escolhida no HUD) no que o chão precisa
   * saber: quem age, como se chama a ação e onde o alcance normal acaba.
   */
  modoDeAlvo() {
    const modo = this.overlay.mode;
    const actor = this.overlay.selected;
    if (!modo || !actor || actor.dead) return null;

    if (modo.kind === 'attack') {
      const perfil = this.enc.weaponAttackProfile(actor, modo.weaponId);
      return {
        kind: 'attack',
        actor,
        weaponId: modo.weaponId ?? null,
        rotulo: perfil.name,
        alcance: perfil.ranged ? perfil.rangeFt : perfil.reachFt,
        limite: perfil.ranged ? perfil.longRangeFt : perfil.reachFt,
      };
    }
    if (modo.kind === 'spell') {
      // `SPELLS` direto, e não `getSpell`, porque `getSpell` lança: um id
      // estranho não pode derrubar o quadro inteiro do tabuleiro.
      const spell = SPELLS[modo.spellId];
      if (!spell) return null;
      // Raio Lunar, Esfera Flamejante já no chão: o limite é quanto a zona
      // anda, contado de onde ela está — não o alcance da magia.
      const zona = spell.zona?.movel && actor.magiasAtivas?.[spell.id]?.zona;
      if (zona?.centro) {
        return { kind: 'spell', actor, spell, rotulo: `Mover ${spell.name}`, origem: zona.centro, alcance: spell.zona.movel, limite: spell.zona.movel };
      }
      return {
        kind: 'spell',
        actor,
        spell,
        rotulo: spell.name,
        // Magia não tem alcance longo: o limite é o próprio alcance.
        alcance: spell.rangeFt,
        limite: spell.rangeFt,
      };
    }
    return null;
  }

  /** Previsão de cada inimigo vivo, mais o índice dos que são impossíveis. */
  preverInimigos(modo) {
    const porId = new Map();
    const impossiveis = new Set();
    if (modo.kind === 'spell' && (modo.spell.shape || this.enc.miraAliados(modo.spell))) return { porId, impossiveis };
    for (const alvo of this.enc.combatants) {
      if (alvo.dead || alvo.side === modo.actor.side || !this.figuraVisivel(alvo)) continue;
      const pv = this.preverContra(modo, alvo);
      if (!pv) continue;
      porId.set(alvo.id, pv);
      if (pv.foraDeAlcance || pv.semVisao) impossiveis.add(`${alvo.pos.x},${alvo.pos.y}`);
    }
    return { porId, impossiveis };
  }

  /** Previsão normalizada: ataque e magia saem com os mesmos campos. */
  preverContra(modo, alvo) {
    if (modo.kind === 'attack') {
      const p = previsaoDeAtaque(this.enc, modo.actor, alvo, modo.weaponId);
      return {
        tipo: 'ataque',
        chance: p.chance,
        danoMedio: p.danoMedio,
        esperado: p.esperado,
        dist: p.dist,
        alcance: p.alcance,
        foraDeAlcance: p.foraDeAlcance,
        alcanceLongo: p.alcanceLongo,
        semVisao: p.semVisao,
        vantagem: p.mods.advantage && !p.mods.disadvantage,
        desvantagem: p.mods.disadvantage && !p.mods.advantage,
        motivos: p.motivos,
        dc: null,
        dano: p.perfil.damage,
        danoTipo: p.perfil.type,
      };
    }
    if (modo.kind === 'spell') {
      const circulo = this.overlay.mode?.circulo ?? modo.spell.level;
      const p = previsaoDeMagia(this.enc, modo.actor, alvo, modo.spell, {
        atkBonus: spellAttackBonus(modo.actor) ?? 0,
        dc: spellSaveDc(modo.actor) ?? 10,
        circulo,
      });
      // `previsaoDeMagia` devolve os motivos, mas não de que lado eles pesam;
      // a mesma conta pura diz isso, e o cartão precisa da direção.
      const mods = MAGIAS_DE_ATAQUE.includes(modo.spell.kind)
        ? this.enc.attackModifiers(modo.actor, alvo, { ranged: !modo.spell.melee })
        : { advantage: false, disadvantage: false };
      return {
        tipo: p.tipo,
        chance: p.chance,
        danoMedio: p.danoMedio,
        esperado: p.esperado,
        dist: p.dist,
        alcance: modo.alcance,
        foraDeAlcance: p.foraDeAlcance,
        alcanceLongo: false,
        semVisao: p.semVisao,
        vantagem: mods.advantage && !mods.disadvantage,
        desvantagem: mods.disadvantage && !mods.advantage,
        motivos: p.motivos,
        dc: p.dc,
        dano: modo.spell.damage ? dadosDaMagia(modo.spell, { nivel: modo.actor.level ?? 1, circulo }) : null,
        danoTipo: modo.spell.damageType ?? null,
      };
    }
    return null;
  }

  /**
   * O que fica no tabuleiro enquanto a magia dura.
   *
   * - Espíritos Guardiões: doze espíritos pequenos andando em roda pelo
   *   CONTORNO da aura (as casas da borda do quadrado de 4,5 m): é ali que o
   *   inimigo que entra já é atingido. As que estão mais longe da câmera que o
   *   clérigo (`camada` 'tras') saem antes das figuras; as outras, depois.
   *   Sutil de propósito: dura o combate inteiro.
   * - Arma Espiritual: a arma flutuando ao lado do último alvo, balançando,
   *   até o minuto acabar. Some enquanto a animação de ataque toca.
   */
  drawMagiasAtivas(ctx, camada) {
    const t = this.time;
    const desenha = (nome, i, sx, sy, alpha = 1) => {
      const n = EFEITOS[nome]?.quadros.length;
      if (!n) return false;
      const cv = quadro(nome, ((i % n) + n) % n);
      if (!cv) return false;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = alpha;
      ctx.drawImage(cv, Math.round(sx - cv.width / 2), Math.round(sy - cv.height / 2));
      ctx.restore();
      return true;
    };
    for (const aura of this.enc.auras ?? []) {
      const dono = aura.dono;
      if (dono.dead) continue;
      const meio = ((dono.pos.f ?? 1) - 1) / 2;
      const cx = dono.pos.x + meio;
      const cy = dono.pos.y + meio;
      // Meia-largura do quadrado, medida até o centro das casas da borda.
      const r = aura.raioFt / 5 + meio;
      const volta = 8 * r;
      // Manto do Cruzado: faíscas douradas miúdas, não os espíritos.
      const manto = aura.tipo === 'manto';
      // O espírito alado da folha j-herois; a chaminha só se ele faltar.
      const sprite = EFEITOS['espirito-guardiao'] ? 'espirito-guardiao' : 'espirito-chama';
      const n = manto ? 16 : 12;
      const posicao = (tempo, i) => {
        // Posição ao longo do perímetro, andando 1,5 casa por segundo.
        const d = (((tempo * 1.5 + (i / n) * volta) % volta) + volta) % volta;
        const lado = Math.floor(d / (2 * r));
        const k = d - lado * 2 * r - r;
        return [[k, -r], [r, k], [-k, r], [-r, -k]][lado];
      };
      for (let i = 0; i < n; i++) {
        const [ox, oy] = posicao(t, i);
        // Fora do mapa não se desenha (o clérigo encostado na borda).
        if (!this.field.inside(Math.round(cx + ox), Math.round(cy + oy))) continue;
        // Mais longe da câmera que o clérigo: atrás das figuras. Na tela, não
        // no mundo: com a câmera girada o "atrás" muda.
        const v = this.rotateVec(ox, oy);
        if ((v.dx + v.dy < 0) !== (camada === 'tras')) continue;
        const p = this.centerF(cx + ox, cy + oy);
        const sy = p.sy - 11 + Math.sin(t * 2.6 + i) * 2;
        if (manto) {
          ctx.fillStyle = 'rgba(255,233,168,.75)';
          ctx.fillRect(Math.round(p.sx) - 1, Math.round(sy) - 6, 2, 2);
          continue;
        }
        // Um rastro curto (uma posição antes, fraca): sensação de giro.
        // Os mesmos testes da chama: dentro do mapa e na mesma camada.
        for (const [atras, alfa] of [[0.15, 0.2]]) {
          const [rx, ry] = posicao(t - atras, i);
          if (!this.field.inside(Math.round(cx + rx), Math.round(cy + ry))) continue;
          const w = this.rotateVec(rx, ry);
          if ((w.dx + w.dy < 0) !== (camada === 'tras')) continue;
          const q = this.centerF(cx + rx, cy + ry);
          desenha(sprite, Math.floor((t - atras) * 8 + i * 2), q.sx, q.sy - 16 + Math.sin((t - atras) * 2.6 + i) * 2, alfa);
        }
        desenha(sprite, Math.floor(t * 8 + i * 2), p.sx, sy - 5, 0.9);
      }
    }
    // Na camada de trás: a Teia no chão, a Esfera acesa e o Raio Lunar (o
    // que está no chão fica atrás de quem está à frente dele).
    if (camada === 'tras') {
      for (const z of this.enc.zonas ?? []) {
        if (!z.centro) continue;
        const p = this.centerF(z.centro.x, z.centro.y);
        if (z.spellId === 'teia') {
          // O quadrado parte do canto: a teia vai no meio das casas dela.
          const casas = [...z.casas].map((k) => k.split(',').map(Number));
          const meio = this.centerF(casas.reduce((a, c) => a + c[0], 0) / casas.length, casas.reduce((a, c) => a + c[1], 0) / casas.length);
          const n = EFEITOS.teia?.quadros.length ?? 1;
          desenha('teia', n - 1, meio.sx, meio.sy + 4, 0.9);
        } else if (z.spellId === 'esferaFlamejante') {
          // Só os quadros de chama cheia: sem a brasa do começo nem a fumaça do fim.
          desenha('fogo-chama', [1, 2, 3, 2][Math.floor(t * 8) % 4], p.sx, p.sy - 18);
        } else if (z.spellId === 'raioLunar') {
          desenha('luz-coluna-prata', 2, p.sx, p.sy - 30, 0.45 + 0.15 * Math.sin(t * 3));
        }
      }
    }
    if (camada === 'tras') return;
    for (const c of this.enc.combatants) {
      const arma = c.magiasAtivas?.armaEspiritual;
      if (!arma || c.dead || performance.now() < (c.armaOcultaAte ?? 0)) continue;
      // Ao lado direito do alvo na tela (x+ desce à direita, y− sobe à
      // direita): não cobre a cabeça dele.
      // No mesmo ponto em que o ataque começa: a troca parada↔golpe não pula.
      const p = this.centerF(arma.pos.x + 0.3, arma.pos.y - 0.3);
      desenha('arma-parada', Math.floor(t * 6), p.sx, p.sy - 36 + Math.sin(t * 2) * 2);
    }
  }

  // ---- cartão --------------------------------------------------------------

  /** Decide qual cartão cabe no que o cursor está olhando, e o desenha. */
  drawCartao(ctx) {
    const t = this.hover;
    if (!t || this.drag) return;
    const cartao = this.modo ? this.cartaoDeAlvo(t) : this.cartaoDeMovimento(t);
    if (cartao) this.desenharCartao(ctx, cartao, t);
  }

  cartaoDeAlvo(t) {
    const modo = this.modo;
    const quem = this.enc.at(t.x, t.y);
    // Quem o grupo não vê é chão vazio para o cartão: mostrar a chance já o entregaria.
    const alvo = quem && this.figuraVisivel(quem) ? quem : null;
    const linhas = [];
    const avisos = [];

    // Quadrado vazio (ou aliado): o que o jogador precisa ali é só saber se a
    // ação alcança aquele ponto.
    if (!alvo || alvo.side === modo.actor.side || this.areaMirada) {
      const d = distanceFt(modo.origem ?? modo.actor.pos, { x: t.x, y: t.y });
      linhas.push({ rotulo: modo.origem ? 'distância da zona' : 'distância', valor: `${d} pés` });
      const a = this.areaMirada;
      if (a) {
        linhas.push({ rotulo: 'inimigos na área', valor: `${a.inimigos}`, cor: a.inimigos ? CARTAO.gold : undefined });
        if (a.aliados) avisos.push({ texto: `${a.aliados} aliado${a.aliados > 1 ? 's' : ''} na área!`, cor: CARTAO.amber });
        if (a.poupados) avisos.push({ texto: `${a.poupados} poupado${a.poupados > 1 ? 's' : ''} por Esculpir Magias`, cor: CARTAO.green });
        if (!a.ok) {
          const why = this.enc.canCast(modo.actor, modo.spell.id, { point: t, circulo: this.overlay.mode?.circulo }).why;
          avisos.push({ texto: `não dá: ${why}`, cor: CARTAO.red });
        }
        return { titulo: modo.rotulo, subtitulo: 'área da magia', destaque: null, linhas, avisos };
      }
      if (modo.limite > 0 && d > modo.limite) {
        avisos.push({ texto: `fora de alcance — alcança ${modo.limite} pés`, cor: CARTAO.red });
      } else if (modo.limite > 0 && d > modo.alcance) {
        avisos.push({ texto: 'alcance longo — desvantagem', cor: CARTAO.amber });
      }
      return { titulo: modo.rotulo, subtitulo: null, destaque: null, linhas, avisos };
    }

    // Recalculado para o alvo sob o cursor em vez de lido do índice: o índice
    // é do quadro, e um cartão com a previsão da ação anterior seria mentira.
    const pv = this.preverContra(modo, alvo);
    if (!pv) return null;

    let destaque;
    if (pv.chance !== null) {
      destaque = { rotulo: 'acerto', valor: pct(pv.chance), cor: this.corDaChance(pv.chance) };
    } else if (pv.dc) {
      // Magia de resistência não rola d20 do conjurador: o número que decide é
      // a CD que o alvo tem de bater.
      destaque = { rotulo: 'resistência', valor: `CD ${pv.dc}`, cor: CARTAO.gold };
    } else {
      destaque = { rotulo: pv.danoMedio > 0 ? 'acerta sempre' : 'sem jogada', valor: null, cor: CARTAO.gold };
    }

    if (pv.dano) linhas.push({ rotulo: 'dano', valor: `${pv.dano} ${pv.danoTipo ?? ''}`.trim() });
    if (pv.danoMedio > 0) {
      linhas.push({ rotulo: 'dano médio', valor: umaCasa(pv.danoMedio) });
      // O esperado é o número que escolhe o alvo: o dano médio já descontada a
      // chance de errar. É a única coluna que compara dois alvos de verdade.
      linhas.push({ rotulo: 'esperado', valor: umaCasa(pv.esperado), cor: CARTAO.gold });
    }
    // CA só entra quando existe jogada contra ela: numa magia de resistência o
    // número que importa é a CD, e mostrar CA ali confunde.
    if (pv.chance !== null) linhas.push({ rotulo: 'CA', valor: `${alvo.ac}` });
    linhas.push({ rotulo: 'PV', valor: `${Math.max(0, alvo.hp)}/${alvo.maxHp}` });

    if (pv.foraDeAlcance) {
      avisos.push({ texto: `impossível: fora de alcance — ${pv.dist} pés, alcança ${pv.alcance}`, cor: CARTAO.red });
    }
    if (pv.semVisao) avisos.push({ texto: 'impossível: sem linha de visão', cor: CARTAO.red });
    const motivos = pv.motivos?.length ? ` — ${pv.motivos.join(', ')}` : '';
    if (pv.vantagem) avisos.push({ texto: `vantagem${motivos}`, cor: CARTAO.green });
    if (pv.desvantagem) avisos.push({ texto: `desvantagem${motivos}`, cor: CARTAO.amber });

    return {
      titulo: alvo.name,
      subtitulo: `${modo.rotulo} · ${pv.dist} pés`,
      destaque,
      linhas,
      avisos,
    };
  }

  /** Sem ação escolhida: o cursor responde "quanto custa chegar" e "quem está ali". */
  cartaoDeMovimento(t) {
    const actor = this.overlay.selected;
    const alvo = this.enc.at(t.x, t.y);
    // A coluna de luz de uma magia de utilidade: a cor sozinha não diz o que é (legenda na dica).
    const marca = (this.overlay.marcas ?? []).find((k) => k.x === t.x && k.y === t.y);
    const legenda = marca ? LEGENDA_DA_MARCA[marca.cor] : null;
    if (legenda && !alvo) {
      return { titulo: marca.nome ?? 'Marca', subtitulo: legenda, destaque: null, linhas: [], avisos: [] };
    }

    if (alvo) {
      const linhas = [
        { rotulo: 'PV', valor: `${Math.max(0, alvo.hp)}/${alvo.maxHp}` },
        { rotulo: 'CA', valor: `${alvo.ac}` },
      ];
      if (actor && alvo !== actor) {
        linhas.push({ rotulo: 'distância', valor: `${distanceFt(actor.pos, alvo.pos)} pés` });
      }
      return {
        titulo: alvo.name,
        subtitulo: alvo.side === 'party' ? 'aliado' : 'inimigo',
        destaque: null,
        linhas,
        avisos: legenda ? [{ texto: legenda, cor: CARTAO.gold }] : [],
      };
    }

    const reach = this.overlay.reachable;
    const node = reach?.get(`${t.x},${t.y}`);
    if (!node || node.cost <= 0) return null;
    const restam = Math.max(0, (actor?.movementLeftFt ?? 0) - node.cost);
    return {
      titulo: 'mover',
      subtitulo: null,
      destaque: { rotulo: 'custo', valor: `${node.cost} pés`, cor: CARTAO.blue },
      linhas: [{ rotulo: 'restam', valor: `${restam} pés` }],
      avisos: [],
    };
  }

  corDaChance(p) {
    if (p >= 0.65) return CARTAO.green;
    if (p >= 0.4) return CARTAO.gold;
    return CARTAO.red;
  }

  /**
   * Mede e desenha. O cartão nasce ao lado do cursor e é empurrado para dentro
   * quando encosta na borda: previsão que sai do tabuleiro não serve de nada.
   */
  desenharCartao(ctx, cartao, tile) {
    const PADC = 8;
    const MAXW = 208;
    const GAP = 14;

    ctx.save();
    ctx.textBaseline = 'alphabetic';

    // ---- medir ----
    let w = 94;
    if (cartao.titulo) {
      ctx.font = FONTE_NOME;
      w = Math.max(w, ctx.measureText(cartao.titulo).width);
    }
    ctx.font = FONTE_DADO;
    if (cartao.subtitulo) w = Math.max(w, ctx.measureText(cartao.subtitulo).width);
    for (const l of cartao.linhas) {
      w = Math.max(w, ctx.measureText(l.rotulo).width + 18 + ctx.measureText(l.valor).width);
    }
    if (cartao.destaque) {
      const rw = cartao.destaque.rotulo ? ctx.measureText(cartao.destaque.rotulo).width : 0;
      ctx.font = FONTE_CHANCE;
      const vw = cartao.destaque.valor ? ctx.measureText(cartao.destaque.valor).width : 0;
      w = Math.max(w, vw + rw + (vw && rw ? 7 : 0));
    }
    w = Math.min(MAXW, Math.ceil(w));

    // Aviso é frase, não rótulo: quebra em linhas para não estourar a largura.
    ctx.font = FONTE_DADO;
    const avisos = [];
    for (const a of cartao.avisos) {
      for (const linha of quebrar(ctx, a.texto, w)) avisos.push({ texto: linha, cor: a.cor });
    }

    let h = PADC * 2;
    if (cartao.titulo) h += 15;
    if (cartao.subtitulo) h += 13;
    if (cartao.destaque) h += 23;
    h += cartao.linhas.length * 13;
    if (avisos.length) h += 4 + avisos.length * 12;

    const bw = w + PADC * 2;
    const bh = h;

    // ---- posicionar ----
    const centro = this.center(tile.x, tile.y);
    const px = this.pointer?.px ?? centro.sx;
    const py = this.pointer?.py ?? centro.sy;
    let bx = px + GAP;
    let by = py - bh - GAP;
    if (bx + bw > this.canvas.width - 6) bx = px - GAP - bw;
    if (by < 6) by = py + GAP;
    bx = Math.max(6, Math.min(bx, this.canvas.width - bw - 6));
    by = Math.max(6, Math.min(by, this.canvas.height - bh - 6));

    // ---- moldura: pedra, fio de latão e bisel ----
    this.caminhoArredondado(ctx, bx, by, bw, bh, 7);
    ctx.fillStyle = CARTAO.fundo;
    ctx.fill();
    ctx.strokeStyle = CARTAO.fio;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = CARTAO.luz;
    ctx.beginPath();
    ctx.moveTo(bx + 2, by + 1.5);
    ctx.lineTo(bx + bw - 2, by + 1.5);
    ctx.stroke();
    ctx.strokeStyle = CARTAO.sombra;
    ctx.beginPath();
    ctx.moveTo(bx + 2, by + bh - 1.5);
    ctx.lineTo(bx + bw - 2, by + bh - 1.5);
    ctx.stroke();

    // ---- conteúdo ----
    const left = bx + PADC;
    const right = bx + bw - PADC;
    let y = by + PADC;

    if (cartao.titulo) {
      // Serifa no nome próprio, sem-serifa no número: o mesmo contrato de
      // `style.css`, que o canvas não pode herdar das variáveis CSS.
      ctx.font = FONTE_NOME;
      ctx.textAlign = 'left';
      ctx.fillStyle = CARTAO.ink;
      y += 11;
      ctx.fillText(cartao.titulo, left, y);
      y += 4;
    }
    if (cartao.subtitulo) {
      ctx.font = FONTE_DADO;
      ctx.textAlign = 'left';
      ctx.fillStyle = CARTAO.muted;
      y += 10;
      ctx.fillText(cartao.subtitulo, left, y);
      y += 3;
    }
    if (cartao.destaque) {
      y += 18;
      ctx.textAlign = 'left';
      let x = left;
      if (cartao.destaque.rotulo) {
        ctx.font = FONTE_DADO;
        ctx.fillStyle = CARTAO.muted;
        ctx.fillText(cartao.destaque.rotulo, x, y);
        x += ctx.measureText(cartao.destaque.rotulo).width + 7;
      }
      if (cartao.destaque.valor) {
        ctx.font = FONTE_CHANCE;
        ctx.fillStyle = cartao.destaque.cor;
        ctx.fillText(cartao.destaque.valor, x, y);
      }
      y += 5;
    }
    for (const l of cartao.linhas) {
      y += 13;
      ctx.font = FONTE_DADO;
      ctx.textAlign = 'left';
      ctx.fillStyle = CARTAO.muted;
      ctx.fillText(l.rotulo, left, y);
      ctx.font = FONTE_DADO_FORTE;
      ctx.textAlign = 'right';
      ctx.fillStyle = l.cor ?? CARTAO.ink;
      ctx.fillText(l.valor, right, y);
    }
    if (avisos.length) {
      y += 4;
      ctx.font = FONTE_DADO;
      ctx.textAlign = 'left';
      for (const a of avisos) {
        y += 12;
        ctx.fillStyle = a.cor;
        ctx.fillText(a.texto, left, y);
      }
    }
    ctx.restore();
  }

  caminhoArredondado(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  drawFloaters(ctx, dt) {
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.t += dt;
      if (f.t > 1.1) { this.floaters.splice(i, 1); continue; }
      const k = f.t / 1.1;
      const { sx, sy } = this.center(f.x, f.y);
      ctx.save();
      ctx.globalAlpha = 1 - k * k;
      // O número "estoura" ao nascer (cresce e assenta em 0,12 s) e é maior quanto mais pesado o golpe; nos primeiros instantes é branco.
      const pop = 1 + 0.55 * Math.max(0, 1 - f.t / 0.12);
      const base = (f.big ? 23 : 17) + (f.peso - 1) * 4;
      ctx.font = `700 ${Math.round(base * pop)}px ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3.5 + (f.peso - 1);
      ctx.strokeStyle = 'rgba(0,0,0,.85)';
      const ty = sy - 56 - k * 28 + f.dy;
      ctx.strokeText(f.text, sx, ty);
      ctx.fillStyle = f.t < 0.06 ? '#ffffff' : f.color;
      ctx.fillText(f.text, sx, ty);
      ctx.restore();
    }
  }
}

/** Uma casa decimal, com vírgula: número de mesa se lê em português. */
function umaCasa(n) {
  return n.toFixed(1).replace('.', ',');
}

/** Quebra uma frase em linhas que caibam na largura medida do cartão. */
function quebrar(ctx, texto, largura) {
  const linhas = [];
  let atual = '';
  for (const palavra of texto.split(' ')) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra;
    if (atual && ctx.measureText(tentativa).width > largura) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = tentativa;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}
