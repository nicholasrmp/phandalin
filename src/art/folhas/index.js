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
// As folhas da Dara seguem um nome: `dara-<armadura>-<arma>.json/.png`. O
// registro dela se monta sozinho a partir dos nomes (abaixo), porque sao 6
// armaduras x 9 armas e uma lista escrita a mao erraria uma.
const DARA_META = import.meta.glob('./dara-*.json', { eager: true, import: 'default' });
const DARA_URL = import.meta.glob('./dara-*.png', { eager: true, query: '?url', import: 'default' });

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
// folha serve a familia inteira (a da maca serve a martelo e estrela).
//
// Cada folha declara a POSTURA (o jeito de segurar) e a FAMILIA. Uma folha
// sem postura e a unica da sua figura e vale para tudo (monstros). As folhas
// sao carregadas so quando pedidas: a Dara completa tem dezenas, e ninguem
// precisa de todas.
const IMPORTADAS = {
  goblin: { base: 'goblin', meta: metaGoblin, url: urlGoblin },
  goblinArqueiro: { base: 'goblinArqueiro', meta: metaGoblinArqueiro, url: urlGoblinArqueiro },
  goblinBoss: { base: 'goblinBoss', meta: metaGoblinBoss, url: urlGoblinBoss },
};

// O que cada sufixo de arquivo significa: a postura (o jeito de segurar) e a
// familia da arma desenhada na mao.
const ARMA_DO_ARQUIVO = {
  'espada-escudo': ['umaMaoEscudo', 'espada'],
  espada: ['umaMao', 'espada'],
  'maca-escudo': ['umaMaoEscudo', 'maca'],
  'machado-escudo': ['umaMaoEscudo', 'machado'],
  'espada-grande': ['duasMaos', 'espadaGrande'],
  'machado-grande': ['duasMaos', 'machadoGrande'],
  malho: ['duasMaos', 'malho'],
  arco: ['arco', 'arco'],
  besta: ['besta', 'besta'],
  // os itens nomeados da aventura, reskin das familias-mae
  'talon-escudo': ['umaMaoEscudo', 'talon'],
  'lightbringer-escudo': ['umaMaoEscudo', 'lightbringer'],
  'hew-escudo': ['umaMaoEscudo', 'hew'],
};
for (const [caminho, meta] of Object.entries(DARA_META)) {
  const nome = caminho.slice(2, -5);                       // dara-malha-maca-escudo
  const [, armadura, ...resto] = nome.split('-');
  const [postura, familia] = ARMA_DO_ARQUIVO[resto.join('-')] ?? [];
  if (!postura) continue;
  // A folha padrao da Dara -- a das regras: malha, espada e escudo -- tem a
  // chave do look, `fighter`; e ela que carrega primeiro.
  const chave = nome === 'dara-malha-espada-escudo' ? 'fighter' : nome;
  IMPORTADAS[chave] = {
    base: 'fighter', meta, url: DARA_URL[caminho.replace('.json', '.png')],
    postura, familia, armadura,
  };
}


// AS FAMILIAS DE ARMADURA, nos seis desenhos do elenco (roupa, couro, peles,
// malha, escamas, placas) mais a Dragonguard.
const FAMILIA_DA_ARMADURA = {
  nenhuma: 'roupa', acolchoada: 'roupa',
  couro: 'couro', couroBatido: 'couro',
  peleDeAnimal: 'peles',
  camisaoDeMalha: 'malha', malhaDeAneis: 'malha', cotaDeMalha: 'malha',
  brunea: 'escamas',
  peitoral: 'placas', meiaArmadura: 'placas', brigantina: 'placas', placas: 'placas',
  dragonguard: 'dragonguard',
};

// AS FAMILIAS DE ARMA: o desenho que aparece na mao. Os itens nomeados da
// aventura caem na familia da arma-base deles.
const FAMILIA_DA_ARMA = {
  espadaLonga: 'espada', espadaCurta: 'espada', cimitarra: 'espada', rapieira: 'espada',
  talon: 'talon', adaga: 'espada', dardo: 'espada', foice: 'espada',
  maca: 'maca', marteloLeve: 'maca', marteloDeGuerra: 'maca', estrelaMatinal: 'maca',
  mangual: 'maca', picareta: 'maca', clava: 'maca', lightbringer: 'lightbringer',
  machadinha: 'machado', machadoDeBatalha: 'machado', hew: 'hew',
  espadaGrande: 'espadaGrande',
  machadoGrande: 'machadoGrande', alabarda: 'machadoGrande', glaive: 'machadoGrande',
  malho: 'malho', clavaGrande: 'malho',
  arcoCurto: 'arco', arcoLongo: 'arco', funda: 'arco',
  bestaLeve: 'besta', bestaPesada: 'besta', bestaDeMao: 'besta',
};

// OS ITENS NOMEADOS TEM FAMILIA PROPRIA (o reskin deles), e uma MAE: a familia
// cujo desenho serve enquanto o reskin nao existe. A Dragonguard e um
// peitoral, entao veste as placas.
const MAE = { talon: 'espada', lightbringer: 'maca', hew: 'machado', dragonguard: 'placas' };

// O JEITO DE SEGURAR. O que nao esta aqui e de uma mao.
const ARCOS = new Set(['arcoCurto', 'arcoLongo', 'funda']);
const BESTAS = new Set(['bestaLeve', 'bestaPesada', 'bestaDeMao']);
const DUAS_MAOS = new Set(['espadaGrande', 'machadoGrande', 'malho', 'clavaGrande',
  'glaive', 'alabarda', 'pique', 'lancaMontada', 'bordao', 'cajadoAranha', 'cajadoDeDefesa']);

function posturaDe(arma, escudo) {
  if (ARCOS.has(arma)) return 'arco';
  if (BESTAS.has(arma)) return 'besta';
  if (DUAS_MAOS.has(arma)) return 'duasMaos';
  return escudo ? 'umaMaoEscudo' : 'umaMao';
}

/**
 * `fighter@cotaDeMalha-maca-escudo` -> o que a figura deve mostrar.
 * Uma chave sem `@` e o look base: quer a folha padrao.
 */
function lerChave(key) {
  const [base, resto] = key.split('@');
  if (!resto) return { base, padrao: true };
  const partes = resto.split('-');
  const escudo = partes[partes.length - 1] === 'escudo';
  if (escudo) partes.pop();
  const [armadura, arma = 'nada'] = partes;
  return {
    base,
    armadura: FAMILIA_DA_ARMADURA[armadura] ?? armadura,
    familia: FAMILIA_DA_ARMA[arma] ?? arma,
    postura: posturaDe(arma, escudo),
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
      key, base, image, w: meta.w, h: meta.h, anims: meta.anims, dirs: meta.dirs,
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
  if (!quer.padrao) {
    let nota = -1;
    for (const [k, e] of daFigura) {
      if (!e.postura) continue;
      const n = (e.familia === quer.familia ? 4 : e.familia === MAE[quer.familia] ? 3 : 0)
        + (e.postura === quer.postura ? 2 : 0)
        + (e.armadura === quer.armadura ? 1 : e.armadura === MAE[quer.armadura] ? 0.5 : 0);
      if (n > nota) { nota = n; escolhida = k; }
    }
    if (nota < 7 && !avisadas.has(key)) {
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
