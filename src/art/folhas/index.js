// FOLHAS DESENHADAS FORA DO CÓDIGO.
//
// Até aqui o jogo não tinha um único arquivo de imagem: as setenta figuras
// saíam de `draw.js`, pintadas em runtime. Isto abre a exceção — e ela é uma
// exceção, não uma mudança de rumo. O pintor procedural continua sendo quem
// desenha todo mundo; uma folha importada só substitui UMA figura, pela chave
// de look, e o resto do motor não fica sabendo.
//
// O CONTRATO É O MESMO DE `buildSheet`:
//   { key, image, w, h, anims: { nome: { y, fw, fh, frames, hold, total } }, dirs }
// `drawSprite` não distingue as duas origens, e `linhaDaDirecao` já pergunta
// à folha quantas direções ela tem — por isso uma folha de oito direções
// convive com as de três sem nenhum ramo novo em `board.js`.
//
// POR QUE O CARREGAMENTO É ASSÍNCRONO E MESMO ASSIM `getSheet` É SÍNCRONA.
// O tabuleiro chama `getSheet` dentro do laço de desenho, sessenta vezes por
// segundo; ela não pode esperar por um `Image`. Então: enquanto o PNG não
// chegou, a chave devolve a folha procedural de sempre — o goblin antigo
// aparece por alguns quadros —, e quando a imagem termina de carregar ela
// troca o cache. Sem tela em branco, sem exceção, sem espera.

import metaGoblin from './goblin.json';
import urlGoblin from './goblin.png';
import metaGoblinArqueiro from './goblinArqueiro.json';
import urlGoblinArqueiro from './goblinArqueiro.png';
import metaGoblinBoss from './goblinBoss.json';
import urlGoblinBoss from './goblinBoss.png';
import metaLobo from './lobo.json';
import urlLobo from './lobo.png';
import metaBugbear from './bugbear.json';
import urlBugbear from './bugbear.png';
import metaKlarg from './klarg.json';
import urlKlarg from './klarg.png';
import metaMarcarrubra from './marcarrubra.json';
import urlMarcarrubra from './marcarrubra.png';
import metaEsqueleto from './esqueleto.json';
import urlEsqueleto from './esqueleto.png';
import metaRato from './ratoGigante.json';
import urlRato from './ratoGigante.png';
import metaVigia from './vigiaCiclopico.json';
import urlVigia from './vigiaCiclopico.png';
import metaCajavidro from './cajavidro.json';
import urlCajavidro from './cajavidro.png';
import metaYeemik from './yeemik.json';
import urlYeemik from './yeemik.png';
import metaDroop from './droop.json';
import urlDroop from './droop.png';
import metaLoboAtroz from './loboAtroz.json';
import urlLoboAtroz from './loboAtroz.png';
import metaOrc from './orc.json';
import urlOrc from './orc.png';
import metaBrughor from './brughor.json';
import urlBrughor from './brughor.png';
import metaOgro from './ogro.json';
import urlOgro from './ogro.png';
import metaReiGrol from './reiGrol.json';
import urlReiGrol from './reiGrol.png';
import metaCorujaUrso from './corujaUrso.json';
import urlCorujaUrso from './corujaUrso.png';
import metaZumbi from './zumbi.json';
import urlZumbi from './zumbi.png';
import metaGrick from './grick.json';
import urlGrick from './grick.png';
import metaCarnical from './carnical.json';
import urlCarnical from './carnical.png';
import metaHamunKost from './hamunKost.json';
import urlHamunKost from './hamunKost.png';
import metaDoppelganger from './doppelganger.json';
import urlDoppelganger from './doppelganger.png';
import metaDrow from './drow.json';
import urlDrow from './drow.png';
import metaDrowBesta from './drowBesta.json';
import urlDrowBesta from './drowBesta.png';
import metaStirge from './stirge.json';
import urlStirge from './stirge.png';
import metaNezznar from './nezznar.json';
import urlNezznar from './nezznar.png';
import metaAranhaGigante from './aranhaGigante.json';
import urlAranhaGigante from './aranhaGigante.png';
import metaAranhaGiganteTeia from './aranhaGiganteTeia.json';
import urlAranhaGiganteTeia from './aranhaGiganteTeia.png';
import metaHobgoblin from './hobgoblin.json';
import urlHobgoblin from './hobgoblin.png';
import metaHobgoblinArco from './hobgoblinArco.json';
import urlHobgoblinArco from './hobgoblinArco.png';
// As folhas dos herois seguem um nome: `<heroi>-<armadura>-<arma>.json/.png`
// (`dara-malha-maca-escudo`, `brenn-escamas-besta`). O registro se monta
// sozinho a partir dos nomes (abaixo), porque sao dezenas de combinacoes e
// uma lista escrita a mao erraria uma.
const HEROI_META = import.meta.glob(['./dara-*.json', './brenn-*.json', './pip-*.json', './ilvan-*.json', './grask-*.json', './torvik-*.json', './corin-*.json'], { eager: true, import: 'default' });
const HEROI_URL = import.meta.glob(['./dara-*.png', './brenn-*.png', './pip-*.png', './ilvan-*.png', './grask-*.png', './torvik-*.png', './corin-*.png'], { eager: true, query: '?url', import: 'default' });

// De quem e cada prefixo, e qual folha e a PADRAO -- a do kit das regras, que
// leva a chave do look e carrega primeiro.
const HEROIS = {
  dara: { look: 'fighter', padrao: 'malha-espada-escudo' },
  brenn: { look: 'cleric', padrao: 'escamas-maca-escudo' },
  pip: { look: 'rogue', padrao: 'couro-espada' },
  ilvan: { look: 'wizard', padrao: 'roupa-bordao' },
  grask: { look: 'barbarian', padrao: 'roupa-machado-grande' },
  torvik: { look: 'paladin', padrao: 'malha-espada-escudo' },
  corin: { look: 'ranger', padrao: 'couro-espadas' },
};

// UMA FIGURA, VARIAS FOLHAS: O QUE ELA TEM NAS MAOS.
//
// Monstro tem uma folha so. Heroi troca de equipamento, e a ficha da a cada
// combinacao a sua chave de look: `fighter@cotaDeMalha-maca-escudo` (ver
// `aplicarAparencia` em `view/ficha.js`).
//
// A ARMA E DESENHADA DENTRO DA ANIMACAO, uma folha por FAMILIA. Colar a arma
// por cima foi tentado e ficou feio: desenhada sozinha, de lado, ela nao tem
// a perspectiva de 3/4 da figura, nao inclina nem borra com o golpe, e a mao
// nao fecha no cabo. A edicao do PixelLab troca a arma mantendo a pose; uma
// folha serve a familia inteira (a da maca serve a estrela e ao mangual).
//
// Cada folha declara a POSTURA (o jeito de segurar) e a FAMILIA. Uma folha
// sem postura e a unica da sua figura e vale para tudo (monstros). As folhas
// sao carregadas so quando pedidas: a Dara completa tem dezenas, e ninguem
// precisa de todas.
const IMPORTADAS = {
  goblin: { base: 'goblin', meta: metaGoblin, url: urlGoblin },
  goblinArqueiro: { base: 'goblinArqueiro', meta: metaGoblinArqueiro, url: urlGoblinArqueiro },
  goblinBoss: { base: 'goblinBoss', meta: metaGoblinBoss, url: urlGoblinBoss },
  // o lobo do PixelLab (esqueleto de quadrupede) no look `wolf`
  wolf: { base: 'wolf', meta: metaLobo, url: urlLobo },
  // o lobo atroz: o mesmo esqueleto em grande, quase preto (`atroz-tira.py`)
  direWolf: { base: 'direWolf', meta: metaLoboAtroz, url: urlLoboAtroz },
  // o bugbear do PixelLab, e o Klarg: o mesmo corpo de pelo descorado
  bugbear: { base: 'bugbear', meta: metaBugbear, url: urlBugbear },
  klarg: { base: 'klarg', meta: metaKlarg, url: urlKlarg },
  marcarrubra: { base: 'marcarrubra', meta: metaMarcarrubra, url: urlMarcarrubra },
  // as criaturas da mansao
  skeleton: { base: 'skeleton', meta: metaEsqueleto, url: urlEsqueleto },
  giantRat: { base: 'giantRat', meta: metaRato, url: urlRato },
  vigiaCiclopico: { base: 'vigiaCiclopico', meta: metaVigia, url: urlVigia },
  // o Cajavidro (Iarno), no look `iarno` (o monstro e o NPC usam o mesmo)
  iarno: { base: 'iarno', meta: metaCajavidro, url: urlCajavidro },
  // Yeemik e Droop: o goblin do PixelLab recolorido e com faixa na testa
  // (`src/dev/reskins-goblins.py`, sem geracao)
  yeemik: { base: 'yeemik', meta: metaYeemik, url: urlYeemik },
  droop: { base: 'droop', meta: metaDroop, url: urlDroop },
  // o orc (pelo modelo oficial que o dono mandou) e o Brughor, o chefe deles:
  // o mesmo corpo com elmo de chifres e pintura de guerra
  orc: { base: 'orc', meta: metaOrc, url: urlOrc },
  brughor: { base: 'brughor', meta: metaBrughor, url: urlBrughor },
  // o ogro gordo do modelo oficial (`ogroGordo`: a primeira leva engordada)
  ogro: { base: 'ogro', meta: metaOgro, url: urlOgro },
  // o Rei Grol: o bugbear editado em rei (pelo quase preto, coroa, machado)
  reiGrol: { base: 'reiGrol', meta: metaReiGrol, url: urlReiGrol },
  // a coruja-urso: esqueleto `bear`, vistas no lugar (`coruja-tira.py`)
  owlbear: { base: 'owlbear', meta: metaCorujaUrso, url: urlCorujaUrso },
  // o zumbi do Poco da Coruja Velha (pelo modelo oficial)
  zombie: { base: 'zombie', meta: metaZumbi, url: urlZumbi },
  // o grick do Castelo Cragmaw: a vista sul aprovada pelo dono (o OpenArt
  // redesenhou a imagem oficial em pixel art) girada no PixelLab
  grick: { base: 'grick', meta: metaGrick, url: urlGrick },
  // o carnical (ghoul), pela imagem do dono
  ghoul: { base: 'ghoul', meta: metaCarnical, url: urlCarnical },
  // Hamun Kost, o Mago Vermelho do Poco da Coruja Velha (pela imagem do dono)
  hamunKost: { base: 'hamunKost', meta: metaHamunKost, url: urlHamunKost },
  // o doppelganger na forma verdadeira (pela imagem do dono)
  doppelganger: { base: 'doppelganger', meta: metaDoppelganger, url: urlDoppelganger },
  // A DROW (aprovada pelo dono), duas folhas como o hobgoblin: a espada curta
  // (padrao) e a besta de mao, quando atira (`aparencias` do bloco `drow`).
  // E tambem o disfarce do Vyerith, o doppelganger do Castelo Cragmaw.
  drow: {
    base: 'drow', meta: metaDrow, url: urlDrow,
    postura: 'umaMao', familia: 'espada', armadura: 'malha', padrao: true,
  },
  'drow-besta': {
    base: 'drow', meta: metaDrowBesta, url: urlDrowBesta,
    postura: 'besta', familia: 'bestaDeMao', armadura: 'malha',
  },
  // o stirge (24 px, escolhido pelo dono)
  stirge: { base: 'stirge', meta: metaStirge, url: urlStirge },
  // O NEZZNAR, a Aranha Negra (aprovado pelo dono): a unica folha com
  // `conjurar`, o gesto do Cajado Aranha que o motor usa nas magias dele.
  nezznar: { base: 'nezznar', meta: metaNezznar, url: urlNezznar },
  // A ARANHA GIGANTE (aprovada pelo dono), duas folhas: a Mordida (padrao) e
  // a Teia, quando atira (`aparencias` do bloco `aranhaGigante`, chave
  // `giantSpider@nenhuma-teia`).
  giantSpider: {
    base: 'giantSpider', meta: metaAranhaGigante, url: urlAranhaGigante,
    postura: 'umaMao', familia: 'presas', armadura: 'roupa', padrao: true,
  },
  'giantSpider-teia': {
    base: 'giantSpider', meta: metaAranhaGiganteTeia, url: urlAranhaGiganteTeia,
    postura: 'umaMao', familia: 'teia', armadura: 'roupa',
  },
  // O HOBGOBLIN, o unico monstro de duas folhas: espada e escudo (a padrao) e
  // o arco longo, que ele pega quando atira (`aparencias` do bloco em
  // `rules/monsters/goblinoides.js`). A chave do arco e
  // `hobgoblin@cotaDeMalha-arcoLongo`, lida como as dos herois.
  hobgoblin: {
    base: 'hobgoblin', meta: metaHobgoblin, url: urlHobgoblin,
    postura: 'umaMaoEscudo', familia: 'espada', armadura: 'malha', padrao: true,
  },
  'hobgoblin-arco': {
    base: 'hobgoblin', meta: metaHobgoblinArco, url: urlHobgoblinArco,
    postura: 'arco', familia: 'arco', armadura: 'malha',
  },
};

// O que cada sufixo de arquivo significa: a postura (o jeito de segurar) e a
// familia da arma desenhada na mao.
const ARMA_DO_ARQUIVO = {
  'espada-escudo': ['umaMaoEscudo', 'espada'],
  espada: ['umaMao', 'espada'],
  'maca-escudo': ['umaMaoEscudo', 'maca'],
  'machado-escudo': ['umaMaoEscudo', 'machado'],
  'martelo-escudo': ['umaMaoEscudo', 'martelo'],
  'espada-grande': ['duasMaos', 'espadaGrande'],
  'machado-grande': ['duasMaos', 'machadoGrande'],
  malho: ['duasMaos', 'malho'],
  arco: ['arco', 'arco'],
  besta: ['besta', 'besta'],
  rapieira: ['umaMao', 'rapieira'],
  'besta-de-mao': ['besta', 'bestaDeMao'],
  // duas armas, uma em cada mao: a familia e `principal+secundaria`
  adagas: ['duasArmas', 'adaga+adaga'],
  espadas: ['duasArmas', 'espada+espada'],
  'espada-adaga': ['duasArmas', 'espada+adaga'],
  // o mago: o bordao (e os cajados da aventura, reskin dele) e a adaga
  bordao: ['duasMaos', 'bordao'],
  'cajado-defesa': ['duasMaos', 'cajadoDeDefesa'],
  'cajado-aranha': ['duasMaos', 'cajadoAranha'],
  adaga: ['umaMao', 'adaga'],
  // o barbaro: duas machadinhas e a azagaia de arremesso
  machadinhas: ['duasArmas', 'machado+machado'],
  azagaia: ['arremesso', 'azagaia'],
  // os itens nomeados da aventura, reskin das familias-mae
  'talon-escudo': ['umaMaoEscudo', 'talon'],
  'lightbringer-escudo': ['umaMaoEscudo', 'lightbringer'],
  'hew-escudo': ['umaMaoEscudo', 'hew'],
};
// UM ESTADO depois de `~` no nome e a mesma folha num estado que se ve: a
// furia do Grask (`grask-roupa-machado-grande~furia`). A chave de look pede o
// estado do mesmo jeito (`barbarian@nenhuma-machadoGrande~furia`, ver
// `comEstado`); sem folha naquele estado, vale a normal.
for (const [caminho, meta] of Object.entries(HEROI_META)) {
  const [nome, estado = null] = caminho.slice(2, -5).split('~');   // dara-malha-maca-escudo
  const [prefixo, armadura, ...resto] = nome.split('-');
  const heroi = HEROIS[prefixo];
  const [postura, familia] = ARMA_DO_ARQUIVO[resto.join('-')] ?? [];
  if (!heroi || !postura) continue;
  const padrao = `${armadura}-${resto.join('-')}` === heroi.padrao;
  const chave = padrao && !estado ? heroi.look : caminho.slice(2, -5);
  IMPORTADAS[chave] = {
    base: heroi.look, meta, url: HEROI_URL[caminho.replace('.json', '.png')],
    postura, familia, armadura, estado, padrao,
  };
}


// AS FAMILIAS DE ARMADURA, nos seis desenhos do elenco (roupa, couro, peles,
// malha, escamas, placas) mais a Dragonguard.
const FAMILIA_DA_ARMADURA = {
  nenhuma: 'roupa', acolchoada: 'roupa',
  couro: 'couro', couroBatido: 'couroBatido',
  peleDeAnimal: 'peles',
  camisaoDeMalha: 'malha', malhaDeAneis: 'malha', cotaDeMalha: 'malha',
  brunea: 'escamas',
  peitoral: 'placas', meiaArmadura: 'placas', brigantina: 'placas', placas: 'placas',
  dragonguard: 'dragonguard',
};

// AS FAMILIAS DE ARMA: o desenho que aparece na mao. Os itens nomeados da
// aventura caem na familia da arma-base deles.
const FAMILIA_DA_ARMA = {
  espadaLonga: 'espada', espadaCurta: 'espada', cimitarra: 'espada', rapieira: 'rapieira',
  talon: 'talon', adaga: 'adaga', dardo: 'adaga', foice: 'espada',
  maca: 'maca', marteloLeve: 'martelo', marteloDeGuerra: 'martelo', estrelaMatinal: 'maca',
  mangual: 'maca', picareta: 'maca', clava: 'maca', lightbringer: 'lightbringer',
  machadinha: 'machado', machadoDeBatalha: 'machado', hew: 'hew', azagaia: 'azagaia', lancaCurta: 'azagaia',
  espadaGrande: 'espadaGrande',
  machadoGrande: 'machadoGrande', alabarda: 'machadoGrande', glaive: 'machadoGrande',
  malho: 'malho', clavaGrande: 'malho',
  bordao: 'bordao', cajadoDeDefesa: 'cajadoDeDefesa', cajadoAranha: 'cajadoAranha',
  arcoCurto: 'arco', arcoLongo: 'arco', funda: 'arco',
  bestaLeve: 'besta', bestaPesada: 'besta', bestaDeMao: 'bestaDeMao',
};

// OS ITENS NOMEADOS TEM FAMILIA PROPRIA (o reskin deles), e uma MAE: a familia
// cujo desenho serve enquanto o reskin nao existe. A Dragonguard e um
// peitoral, entao veste as placas. O martelo tem desenho so no kit do Brenn;
// na mao de quem nao tem, vale a maca. Rapieira, adaga e besta de mao, so no
// do Pip: na Dara valem a espada e a besta. A brunea veste a malha em quem
// nao tem escamas desenhadas (Corin, Dara, Torvik); antes ela caia na
// Dragonguard por empate.
const MAE = {
  talon: 'espada', lightbringer: 'maca', hew: 'machado', dragonguard: 'placas', martelo: 'maca',
  rapieira: 'espada', adaga: 'espada', bestaDeMao: 'besta', couroBatido: 'couro', escamas: 'malha',
  cajadoDeDefesa: 'bordao', cajadoAranha: 'bordao',
};

// O JEITO DE SEGURAR. O que nao esta aqui e de uma mao.
const ARCOS = new Set(['arcoCurto', 'arcoLongo', 'funda']);
const BESTAS = new Set(['bestaLeve', 'bestaPesada', 'bestaDeMao']);
const DUAS_MAOS = new Set(['espadaGrande', 'machadoGrande', 'malho', 'clavaGrande',
  'glaive', 'alabarda', 'pique', 'lancaMontada', 'bordao', 'cajadoAranha', 'cajadoDeDefesa']);

// a azagaia e de arremesso, mas no desempate ela e corpo a corpo: sem folha
// de azagaia, a figura segura uma arma de mao, nao um arco
const DISTANCIA = new Set(['arco', 'besta']);
// quem nao tem folha de duas armas segura a principal sem escudo
const POSTURA_MAE = { duasArmas: 'umaMao', arremesso: 'umaMao', umaMao: 'duasArmas' };

// DUAS ARMAS SEM A FOLHA EXATA: compara mao a mao, nas duas ordens. Arma
// igual vale 2, a mae dela 1,5. Rapieira com adaga e a espada com adaga
// (1,5 + 2), nao as duas espadas (1,5 + 1,5) -- a mae da adaga tambem e a
// espada, mas a adaga desenhada vence.
function parteAParte(tem, quer) {
  const t = tem.split('+');
  const q = quer.split('+');
  if (t.length !== 2 || q.length !== 2) return 0;
  const par = (a, b) => (a === b ? 2 : MAE[b] === a ? 1.5 : 0);
  const n = Math.max(par(t[0], q[0]) + par(t[1], q[1]), par(t[0], q[1]) + par(t[1], q[0]));
  return n >= 3 ? Math.min(n, 3.9) : 0;
}

const ARREMESSO = new Set(['azagaia']);

function posturaDe(arma, escudo, segunda) {
  if (segunda) return 'duasArmas';
  if (ARREMESSO.has(arma) && !escudo) return 'arremesso';
  if (ARCOS.has(arma)) return 'arco';
  if (BESTAS.has(arma)) return 'besta';
  if (DUAS_MAOS.has(arma)) return 'duasMaos';
  return escudo ? 'umaMaoEscudo' : 'umaMao';
}

/**
 * `fighter@cotaDeMalha-maca-escudo` -> o que a figura deve mostrar. A arma da
 * mao secundaria vem com `+`: `rogue@couro-espadaCurta+adaga`.
 * Uma chave sem `@` e o look base: quer a folha padrao.
 */
function lerChave(chave) {
  const [key, estado = null] = chave.split('~');
  const [base, resto] = key.split('@');
  if (!resto) return { base, padrao: true, estado };
  const partes = resto.split('-');
  const escudo = partes[partes.length - 1] === 'escudo';
  if (escudo) partes.pop();
  const [armadura, armas = 'nada'] = partes;
  const [arma, segunda] = armas.split('+');
  const fam = (a) => FAMILIA_DA_ARMA[a] ?? a;
  return {
    base,
    armadura: FAMILIA_DA_ARMADURA[armadura] ?? armadura,
    familia: segunda ? `${fam(arma)}+${fam(segunda)}` : fam(arma),
    postura: posturaDe(arma, escudo, segunda),
    estado,
  };
}

const prontas = new Map();
const pedidas = new Set();
const avisadas = new Set();
let aoCarregarFolha = null;

function carregar(key) {
  if (pedidas.has(key)) return;
  pedidas.add(key);
  const { base, meta, url, postura = null, familia = null, armadura = null } = IMPORTADAS[key];
  const image = new Image();
  image.onload = () => {
    prontas.set(key, {
      key, base, image, w: meta.w, h: meta.h, anims: meta.anims, dirs: meta.dirs, ground: meta.ground,
      postura, familia, armadura,
    });
    aoCarregarFolha?.(base);
  };
  // Falhar aqui não é fatal: a figura continua com outra folha dela, ou com o
  // pintor procedural se for a única.
  image.onerror = () => console.warn(`folha importada não carregou: ${key}`);
  image.src = url;
}

/**
 * A folha importada para esta chave de look, se a figura tem alguma. Senao
 * `null`, e o pintor procedural desenha.
 *
 * QUANDO NAO HA A COMBINACAO EXATA, vale a MAIS PROXIMA da mesma figura, e
 * nunca o pintor: a Dara de lanca sem folha de lanca continua sendo a Dara.
 * O peso segue o que mais se ve: a familia da arma (4), a postura (2), a
 * armadura (1). A melhor e pedida ao servidor na hora; enquanto ela nao
 * chega, vale a melhor que ja esta carregada.
 */
export function folhaImportada(key) {
  const quer = lerChave(key);
  const daFigura = Object.entries(IMPORTADAS).filter(([, e]) => e.base === quer.base);
  if (daFigura.length === 0) return null;
  let escolhida = quer.base;
  if (quer.padrao && quer.estado) {
    // o look base num estado: a folha padrao naquele estado, se houver
    escolhida = daFigura.find(([, e]) => e.padrao && e.estado === quer.estado)?.[0] ?? quer.base;
  } else if (!quer.padrao) {
    let nota = -Infinity;
    for (const [k, e] of daFigura) {
      if (!e.postura) continue;
      // o estado pesa mais que tudo: folha de outro estado so na falta
      const n = (e.estado === quer.estado ? 0 : -20)
        + (e.familia === quer.familia ? 4
          : e.familia === MAE[quer.familia] ? 3
            : quer.familia.includes('+') ? parteAParte(e.familia, quer.familia)
              // uma machadinha so, e o Grask so tem a folha das duas
              : e.familia.split('+').includes(quer.familia) ? 2.5 : 0)
        + (e.postura === quer.postura ? 2 : e.postura === POSTURA_MAE[quer.postura] ? 1 : 0)
        + (e.armadura === quer.armadura ? 1 : e.armadura === MAE[quer.armadura] ? 0.5 : 0)
        // o mesmo tipo de luta: espada grande sem folha propria vai para uma
        // arma de corpo a corpo, nao para a besta
        + (DISTANCIA.has(e.postura) === DISTANCIA.has(quer.postura) ? 3 : 0)
        // e nunca um escudo que o personagem nao esta usando (nem o contrario):
        // o escudo diz a CA na tela. A Dara de maca sem escudo segura a espada
        // sem escudo, nao a maca com ele.
        - ((e.postura === 'umaMaoEscudo') !== (quer.postura === 'umaMaoEscudo') ? 2.5 : 0)
        // e a arma comum: lanca sem folha propria nao vira Lightbringer
        - (MAE[e.familia] && e.familia !== quer.familia ? 0.1 : 0)
        // empate de verdade: a folha padrao, e nao a primeira na ordem alfabetica
        + (e.padrao ? 0.05 : 0);
      if (n > nota) { nota = n; escolhida = k; }
    }
    if (nota < 10 && !avisadas.has(key)) {
      avisadas.add(key);
      console.info(`[folhas] sem arte exata para ${key} (${quer.familia}, ${quer.postura}, `
        + `${quer.armadura}); usando ${escolhida}`);
    }
  }
  carregar(escolhida);
  if (prontas.has(escolhida)) return prontas.get(escolhida);
  // ainda carregando: qualquer folha pronta da figura, a padrao primeiro
  carregar(quer.base);
  return prontas.get(quer.base) ?? daFigura.map(([k]) => prontas.get(k)).find(Boolean) ?? null;
}

/** Esta figura tem arte importada? Quem monta a chave de look precisa saber. */
export function temArteImportada(base) {
  return Object.values(IMPORTADAS).some((e) => e.base === base);
}

/**
 * Prepara o carregamento: as folhas padrao (as de chave igual ao look) vao
 * ja; as variantes, quando alguem as pede. `aoCarregar(base)` e chamada a
 * cada folha que chega, com a FIGURA: a folha nova pode ser a melhor resposta
 * para varias chaves de look dela, e o cache delas todas precisa cair.
 */
let disparado = false;
export function carregarFolhas(aoCarregar) {
  if (disparado) return;
  disparado = true;
  aoCarregarFolha = aoCarregar;
  for (const [key, e] of Object.entries(IMPORTADAS)) if (key === e.base) carregar(key);
}

/**
 * A chave de look com um ESTADO ligado ou desligado: `comEstado(look, 'furia',
 * true)`. Quem marca o estado nas regras (a Furia do barbaro) troca o `look`
 * do personagem por esta chave; a folha daquele estado aparece se existir.
 */
export function comEstado(look, estado, ligado) {
  const semEstado = String(look).split('~')[0];
  return ligado ? `${semEstado}~${estado}` : semEstado;
}
