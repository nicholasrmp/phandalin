// Grade de combate: quadrados de 1,5 m (5 pés).
//
// Distância pela regra padrão do SRD: diagonal custa o mesmo que ortogonal,
// ou seja, distância de Chebyshev × 5 pés. É o que torna o netcode trivial —
// posição é um par de inteiros e não existe erro de arredondamento.

export const FEET_PER_SQUARE = 5;

export const key = (x, y) => `${x},${y}`;
export const parseKey = (k) => {
  const [x, y] = k.split(',');
  return { x: Number(x), y: Number(y) };
};

/**
 * Quantos quadrados de lado a criatura ocupa, pela categoria de tamanho.
 *
 * Miúdo, Pequeno e Médio dividem o mesmo quadrado de 1,5 m; é de Grande para
 * cima que o espaço ocupado cresce, e é isso que faz um ogro ser um problema
 * de posicionamento e não só um saco de pontos de vida.
 */
export function footprintOf(size) {
  switch (`${size}`.normalize('NFD').replace(/[̀-ͯ]/g, '')) {
    case 'grande': return 2;
    case 'enorme': return 3;
    case 'imenso': case 'colossal': return 4;
    default: return 1;
  }
}

/**
 * Distância em pés entre duas CAIXAS (diagonal = 5 pés).
 *
 * A posição de um combatente carrega a própria pegada em `pos.f`, então um
 * ponto solto — `{x, y}` de um nó de caminho — é só uma caixa 1x1. É esse
 * detalhe que faz os quarenta e tantos lugares que já chamavam `distanceFt`
 * passarem a medir certo contra criatura Grande sem serem tocados: medir do
 * canto de um ogro de 2x2 daria 1,5 m a mais de alcance do que ele tem.
 */
export function distanceFt(a, b) {
  const fa = a.f ?? 1;
  const fb = b.f ?? 1;
  const dx = Math.max(0, a.x - (b.x + fb - 1), b.x - (a.x + fa - 1));
  const dy = Math.max(0, a.y - (b.y + fb - 1), b.y - (a.y + fa - 1));
  return Math.max(dx, dy) * FEET_PER_SQUARE;
}

export function isAdjacent(a, b) {
  return a !== b && distanceFt(a, b) === FEET_PER_SQUARE;
}

/** Todos os quadrados cobertos por uma posição com pegada. */
export function squaresOf(pos) {
  const f = pos.f ?? 1;
  const out = [];
  for (let dy = 0; dy < f; dy++) for (let dx = 0; dx < f; dx++) out.push({ x: pos.x + dx, y: pos.y + dy });
  return out;
}

const NEIGHBORS = [
  { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
  { dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 },
];

/**
 * REGRA E APARÊNCIA SÃO CAMADAS DIFERENTES.
 *
 * Até aqui cada glifo dizia as duas coisas de uma vez: `#` era parede para o
 * movimento e cinza para o desenho. Isso funcionou enquanto havia uma
 * aparência por regra. Um mapa de estrada na mata quebra isso dos dois lados:
 * estrada e grama têm a MESMA regra (chão) e caras diferentes; árvore tem a
 * regra da parede — bloqueia passo e visão — e cara de árvore.
 *
 * Então o glifo agora dá as duas coisas separadas: `kind` é o que as regras
 * leem (0 chão, 1 parede, 2 difícil, 3 cobertura) e `sup` é o que o desenho
 * lê. Nada em `rules/` olha a superfície; nada no tabuleiro decide regra por
 * ela. Os glifos antigos continuam significando exatamente o que
 * significavam, e o mapa do encontro padrão sai idêntico.
 */
export const GLIFOS = {
  '.': { kind: 0, sup: 'chao' },
  '#': { kind: 1, sup: 'parede' },
  '~': { kind: 2, sup: 'mato' },
  'o': { kind: 3, sup: 'caixote' },
  ':': { kind: 0, sup: 'estrada' },
  ',': { kind: 0, sup: 'grama' },
  // Mata fechada: bloqueia passo e visão como parede. É a borda da floresta,
  // não um bosque por onde se anda — por onde se anda é a grama do barranco.
  'T': { kind: 1, sup: 'arvore' },
  // Carroça, cavalo morto e pedra são COBERTURA: dá para se esconder atrás
  // (+2 de CA, pelo `coverBetween`) e não dá para atravessar.
  'C': { kind: 3, sup: 'carroca' },
  'h': { kind: 3, sup: 'cavalo' },
  'r': { kind: 3, sup: 'pedra' },
  // Arbusto fechado também é cobertura, não terreno difícil. Terreno difícil
  // deixaria passar — devagar —, e o arbusto existe para FECHAR: estreitar a
  // boca de uma trilha e dar a quem se esconde atrás os mesmos +2 de CA da
  // carroça.
  'b': { kind: 3, sup: 'arbusto' },
  // A caverna e a mata em volta dela (`game/esconderijo.js`).
  'R': { kind: 1, sup: 'rocha' },
  '_': { kind: 0, sup: 'caverna' },
  // Meio metro de água fria e lenta: anda-se nela sem custo extra (a aventura
  // diz isso do riacho do esconderijo).
  'w': { kind: 0, sup: 'riacho' },
  'W': { kind: 2, sup: 'poco' },          // fundo: nada-se, e nadar custa o dobro
  '=': { kind: 0, sup: 'ponte' },
  'x': { kind: 2, sup: 'entulho' },
  'A': { kind: 3, sup: 'estalagmite' },
  's': { kind: 3, sup: 'mantimentos' },
  '%': { kind: 2, sup: 'espinheiro' },
  'z': { kind: 0, sup: 'leito' },         // cama de pele e palha: passa-se por cima
  'F': { kind: 0, sup: 'fogueira' },       // brasa: pisa-se, e queima (a cena cobra)
  'K': { kind: 3, sup: 'bau' },
  'P': { kind: 3, sup: 'tocaia' },        // ripas de madeira do posto dos vigias
  // O porão da Mansão Tresendar. Glifos próprios para não mexer no que `o` e
  // `P` desenham nos mapas ao ar livre.
  'm': { kind: 3, sup: 'mesa' },
  'Q': { kind: 3, sup: 'sarcofago' },
  'G': { kind: 3, sup: 'grade' },          // grade de ferro das celas
  // Buraco aberto no chão (o fosso achado ou disparado): não se anda nele —
  // o desnível barra —, mas visão e flecha passam por cima.
  'O': { kind: 2, sup: 'fosso' },
  'L': { kind: 0, sup: 'laje' },           // piso de lajes do porão
  'M': { kind: 1, sup: 'alvenaria' },      // parede de pedra lavrada do porão
  // Seteira: a parede com a fenda dos arqueiros. Não se passa por ela, mas
  // se vê e se atira — e quem está atrás tem cobertura.
  'J': { kind: 3, sup: 'seteira' },
  'V': { kind: 2, sup: 'cisterna' },       // água parada da cisterna: nada-se
  // A rua de Phandalin: prédios de 3 x 3 casas (um sprite só por prédio; a
  // variante vem da anotação do mapa) e barris e caixotes na grama.
  'H': { kind: 1, sup: 'casa' },
  'Y': { kind: 1, sup: 'taverna' },
  'u': { kind: 3, sup: 'barris' },
  // O Poço da Coruja Velha: a tenda do mago (2 x 2, não se atravessa nem se
  // vê através) e o poço velho do pátio (cobertura, como uma mureta).
  'n': { kind: 1, sup: 'tenda' },
  // O Cume da Wyvern: o alto dos planaltos de pedra (anda-se em cima; o
  // paredão em volta é o desnível) e a escada de cordas que sobe até lá.
  'k': { kind: 0, sup: 'pedregal' },
  'l': { kind: 0, sup: 'escada' },
  'q': { kind: 3, sup: 'pocoVelho' },
  // O Castelo Dentefino: móveis próprios sobre a laje (os da caverna pintavam
  // um remendo de chão de gruta no salão). Os de várias casas são um sprite
  // só por pegada, com a direção vinda da anotação do mapa, e NÃO se pisam:
  // o sprite sai na casa da frente da pegada e cobriria quem estivesse nas
  // de trás.
  'a': { kind: 3, sup: 'altar' },
  'B': { kind: 3, sup: 'banheira' },        // borda de azulejo: cobertura, não se entra
  'N': { kind: 3, sup: 'mesaBanquete' },
  'D': { kind: 3, sup: 'camaRei' },         // cama grande: cobertura
  'I': { kind: 3, sup: 'portaoCaido' },     // a folha caída do portão: cobertura no terraço
  'e': { kind: 3, sup: 'braseiro' },
  'f': { kind: 3, sup: 'braseiroFrio' },     // carvão apagado, no salão escuro
  'g': { kind: 3, sup: 'armeiro' },
  'p': { kind: 0, sup: 'palha' },
  'E': { kind: 3, sup: 'desabamento' },     // pedra caída: barra o passo, não a visão
  'i': { kind: 3, sup: 'caixotes' },
  // DECALQUES: a marca que a sala deixou no chao. Pisa-se em cima — eles
  // nao mudam nada na regra, so contam o que aconteceu ali.
  'c': { kind: 0, sup: 'ossos' },        // ossos roidos
  'v': { kind: 0, sup: 'mancha' },       // sangue seco, fuligem
  'd': { kind: 0, sup: 'cacos' },        // cacos, poeira, reboco caido
  'j': { kind: 0, sup: 'musgoChao' },    // musgo nas juntas, poca parada
  't': { kind: 3, sup: 'arca' },
  // ARVORE TROVAO: o campo de trigo, a cinza do vulcao e o lago (chao), e a
  // mobilia de casa abandonada. A mobilia e UM glifo por regra e a variante vem
  // da anotacao do mapa (`objetos`, tipo 'prop'): `^` barra (cobertura) e `&` e
  // chao de passar (trapos, balde, banquinho).
  'X': { kind: 0, sup: 'trigo' },
  'Z': { kind: 0, sup: 'cinza' },
  'S': { kind: 0, sup: 'lago' },
  'y': { kind: 0, sup: 'margem' },
  '$': { kind: 2, sup: 'teia' },           // teia grossa no chao: terreno dificil
  '^': { kind: 3, sup: 'prop' },
  '&': { kind: 0, sup: 'propBaixo' },
};

export const SUPERFICIES = [...new Set(Object.values(GLIFOS).map((g) => g.sup))];

/**
 * ÁGUA FUNDA: onde se nada, e por isso custa o dobro. O riacho de meio metro
 * fica fora — anda-se nele sem custo extra, então o Andar na Água não tem o
 * que resolver lá.
 */
export const AGUAS_FUNDAS = new Set(['poco', 'cisterna']);

/**
 * VÃO ESTREITO: a casa que fecha o passo mas tem frestas — a grade de ferro
 * das celas e a fenda da seteira. A Forma Gasosa passa por estas, e só por
 * estas: parede e rocha são pedra maciça, e o livro diz que a névoa passa por
 * fresta, não por matéria sólida.
 */
export const VAOS = new Set(['grade', 'seteira']);

// PAREDES DE BORDA. A parede fina fica na aresta ENTRE duas casas, não ocupa
// casa nenhuma — como nos isométricos pintados, em que a sala é a sala e a
// parede é o contorno dela. Cada casa guarda a aresta do norte (com a casa de
// cima, y-1) e a do oeste (com a da esquerda, x-1).
//
// No mapa, duas grades de texto do tamanho do terreno, `paredes.n` e
// `paredes.o`, com um caractere por casa:
//   .  nada
//   #  parede: barra passo e visão
//   +  porta fechada: idem, até abrir
//   /  porta aberta (ou arco): passa tudo; o desenho mostra o batente
//   J  seteira: barra o passo, não a visão; quem está atrás tem cobertura
export const ARESTA = { nada: 0, parede: 1, porta: 2, aberta: 3, seteira: 4 };
const ARESTA_DO_CHAR = { '.': 0, '#': 1, '+': 2, '/': 3, J: 4 };
const BARRA_PASSO = new Set([1, 2, 4]);
/** O mesmo, sem a seteira: por onde a névoa da Forma Gasosa passa. */
const BARRA_PASSO_SEM_VAO = new Set([1, 2]);
const BARRA_VISAO = new Set([1, 2]);

export class Battlefield {
  /**
   * @param {number} w largura em quadrados
   * @param {number} h altura em quadrados
   * @param {string[]} rows mapa em texto, glifos de `GLIFOS`. Um dígito de 1 a
   *   9 é chão naquela elevação — o formato antigo, que continua valendo.
   * @param {string[]} [alturas] segunda grade, só de dígitos ('.' ou '0' é
   *   nível 0). Existe porque um caractere só não diz "grama no alto do
   *   barranco": o glifo diz a grama, esta grade diz o alto.
   */
  constructor(w, h, rows = null, alturas = null, objetos = null, paredes = null) {
    this.w = w;
    this.h = h;
    // As arestas: `paredeN[i]` é a do norte da casa i, `paredeO[i]` a do oeste.
    this.paredeN = new Uint8Array(w * h);
    this.paredeO = new Uint8Array(w * h);
    for (const [lado, grade] of [['paredeN', paredes?.n], ['paredeO', paredes?.o]]) {
      (grade ?? []).forEach((linha, y) => {
        for (let x = 0; x < Math.min(w, linha.length); x++) this[lado][y * w + x] = ARESTA_DO_CHAR[linha[x]] ?? 0;
      });
    }
    // Quantos níveis a parede desta casa levanta, se o mapa disser. Castelo
    // de altura única lê como uma caixa: o horizonte fica reto de ponta a
    // ponta. Com esta grade a torre passa do muro, e a silhueta volta.
    if (paredes?.alt) {
      this.paredeAlt = new Uint8Array(w * h);
      paredes.alt.forEach((linha, y) => {
        for (let x = 0; x < Math.min(w, linha.length); x++) {
          this.paredeAlt[y * w + x] = Number(linha[x]) || 0;
        }
      });
    }
    // O GRAU DE RUÍNA da construção de cada casa (0 inteira, 1 a 3 cada vez mais
    // caída). Só o tabuleiro lê: troca a pedra da parede e quebra o topo dela.
    if (paredes?.ruina) {
      this.paredeRuina = new Uint8Array(w * h);
      paredes.ruina.forEach((linha, y) => {
        for (let x = 0; x < Math.min(w, linha.length); x++) {
          this.paredeRuina[y * w + x] = Number(linha[x]) || 0;
        }
      });
    }
    // Anotações de desenho dos objetos de várias casas — para onde apontam e
    // qual variante. Como `surfaces`, só o tabuleiro lê; nenhuma regra usa.
    // Cada item: { tipo, x, y, olha: {dx, dy}, variante? }, com (x, y) em
    // qualquer casa da pegada.
    this.objetos = objetos ?? [];
    this.tiles = new Uint8Array(w * h);   // 0 chão, 1 parede, 2 terreno difícil, 3 cobertura
    this.heights = new Uint8Array(w * h); // nível de elevação; cada nível = 5 pés
    this.surfaces = new Uint8Array(w * h); // índice em SUPERFICIES; só o desenho lê
    // Estas duas as REGRAS leem: a água funda que o Andar na Água aplaina e o
    // vão estreito por onde a Forma Gasosa passa.
    this.aguas = new Set();
    this.vaos = new Set();
    const chao = SUPERFICIES.indexOf('chao');
    this.surfaces.fill(chao);
    if (rows) {
      for (let y = 0; y < Math.min(h, rows.length); y++) {
        for (let x = 0; x < Math.min(w, rows[y].length); x++) {
          const c = rows[y][x];
          const i = y * w + x;
          if (c >= '1' && c <= '9') {
            this.tiles[i] = 0;
            this.heights[i] = Number(c);
          } else {
            const g = GLIFOS[c] ?? GLIFOS['.'];
            this.tiles[i] = g.kind;
            this.surfaces[i] = SUPERFICIES.indexOf(g.sup);
            if (AGUAS_FUNDAS.has(g.sup)) this.aguas.add(key(x, y));
            if (VAOS.has(g.sup)) this.vaos.add(key(x, y));
          }
        }
      }
    }
    if (alturas) {
      for (let y = 0; y < Math.min(h, alturas.length); y++) {
        for (let x = 0; x < Math.min(w, alturas[y].length); x++) {
          const c = alturas[y][x];
          if (c >= '1' && c <= '9') this.heights[y * w + x] = Number(c);
        }
      }
    }
  }

  /** A aparência do quadrado. Só o desenho pergunta isto. */
  surfaceAt(x, y) {
    return this.inside(x, y) ? SUPERFICIES[this.surfaces[y * this.w + x]] : 'parede';
  }

  heightAt(x, y) {
    return this.inside(x, y) ? this.heights[y * this.w + x] : 0;
  }

  inside(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  tileAt(x, y) {
    return this.inside(x, y) ? this.tiles[y * this.w + x] : 1;
  }

  /** Parede bloqueia movimento e linha de visão. Cobertura bloqueia só movimento. */
  blocksMove(x, y) {
    const t = this.tileAt(x, y);
    // Forma Gasosa: a névoa passa pelo vão estreito (grade, seteira). Parede e
    // rocha não — são pedra maciça, e o livro só dá fresta à névoa.
    if (this.atravessaVao && this.vaos.has(key(x, y))) return false;
    return t === 1 || t === 3;
  }

  blocksSight(x, y) {
    return this.tileAt(x, y) === 1;
  }

  /** O código da aresta entre duas casas VIZINHAS NO EIXO (0 se não houver). */
  aresta(ax, ay, bx, by) {
    if (bx === ax + 1 && by === ay) return this.inside(bx, by) ? this.paredeO[by * this.w + bx] : 0;
    if (bx === ax - 1 && by === ay) return this.inside(ax, ay) ? this.paredeO[ay * this.w + ax] : 0;
    if (by === ay + 1 && bx === ax) return this.inside(bx, by) ? this.paredeN[by * this.w + bx] : 0;
    if (by === ay - 1 && bx === ax) return this.inside(ax, ay) ? this.paredeN[ay * this.w + ax] : 0;
    return 0;
  }

  /** Muda uma aresta no meio do jogo (porta aberta, arrombada). */
  porAresta(ax, ay, bx, by, codigo) {
    if (bx === ax + 1) this.paredeO[by * this.w + bx] = codigo;
    else if (bx === ax - 1) this.paredeO[ay * this.w + ax] = codigo;
    else if (by === ay + 1) this.paredeN[by * this.w + bx] = codigo;
    else if (by === ay - 1) this.paredeN[ay * this.w + ax] = codigo;
    this.versao = (this.versao ?? 0) + 1;
  }

  /**
   * Passa de uma casa para a vizinha (também na diagonal) sem cruzar parede?
   * `tipo` é 'passo' ou 'visao'. Na diagonal, nenhuma das quatro arestas que
   * se encontram na quina pode barrar: não se escorrega pela ponta de uma
   * parede, nem com o corpo nem com o olho.
   */
  passa(ax, ay, bx, by, tipo = 'passo') {
    // Forma Gasosa: a seteira de BORDA (a do castelo, onde `J` é aresta e não
    // casa) é fresta do mesmo jeito que a grade. Porta fechada segue barrando:
    // ali não há fenda, há madeira.
    const barra = tipo === 'visao' ? BARRA_VISAO
      : (this.atravessaVao ? BARRA_PASSO_SEM_VAO : BARRA_PASSO);
    if (ax === bx || ay === by) return !barra.has(this.aresta(ax, ay, bx, by));
    return !barra.has(this.aresta(ax, ay, bx, ay)) && !barra.has(this.aresta(bx, ay, bx, by))
      && !barra.has(this.aresta(ax, ay, ax, by)) && !barra.has(this.aresta(ax, by, bx, by));
  }

  /**
   * Dá para TOCAR de `a` em `b` — encostar a espada, a mão, o frasco?
   *
   * Duas caixas adjacentes com uma parede de borda entre elas estão a 1,5 m
   * uma da outra, e sem isto a espada atravessava o muro. Basta um par de
   * casas, uma de cada pegada, vizinhas e sem parede entre elas.
   */
  contato(a, b) {
    if (distanceFt(a, b) > FEET_PER_SQUARE) return false;
    for (const p of squaresOf(a)) {
      for (const q of squaresOf(b)) {
        if (Math.abs(p.x - q.x) > 1 || Math.abs(p.y - q.y) > 1) continue;
        if (p.x === q.x && p.y === q.y) return true;
        if (this.passa(p.x, p.y, q.x, q.y)) return true;
      }
    }
    return false;
  }

  /** Vizinhas de verdade: adjacentes E sem parede de borda entre elas. */
  vizinhos(a, b) {
    return isAdjacent(a, b) && this.contato(a, b);
  }

  /** Há parede de passo DENTRO da pegada f x f com canto em (x, y)? */
  paredeNaPegada(x, y, f) {
    for (let dy = 0; dy < f; dy++) {
      for (let dx = 0; dx < f; dx++) {
        if (dx + 1 < f && BARRA_PASSO.has(this.aresta(x + dx, y + dy, x + dx + 1, y + dy))) return true;
        if (dy + 1 < f && BARRA_PASSO.has(this.aresta(x + dx, y + dy, x + dx, y + dy + 1))) return true;
      }
    }
    return false;
  }

  /** A criatura de pegada f passa da âncora a para a âncora b (vizinhas)? */
  passaPegada(ax, ay, bx, by, f = 1) {
    for (let dy = 0; dy < f; dy++) {
      for (let dx = 0; dx < f; dx++) {
        if (!this.passa(ax + dx, ay + dy, bx + dx, by + dy)) return false;
      }
    }
    return true;
  }

  /**
   * Custo de entrar num quadrado, em pés.
   * Terreno difícil custa o dobro (SRD). Subir um nível é escalada: no SRD,
   * cada pé escalado custa 1 pé extra, então o degrau de 5 pés sai por 10.
   */
  costOf(x, y, fromX = null, fromY = null) {
    // Quem voa não pisa no chão: terreno difícil e degrau não custam nada.
    if (this.voando) return FEET_PER_SQUARE;
    // Andar na Água: a água funda deixa de ser terreno difícil — e só ela. Uma
    // Graxa ou um Crescimento de Plantas lançado sobre a água continua
    // cobrando, e é por isso que isto entra na conta do `dificil` em vez de
    // sair antes.
    const naAgua = this.sobreAgua && this.aguas.has(key(x, y));
    // Terreno difícil: o do mapa (2) ou o que uma magia criou (Graxa).
    // Liberdade de Movimento tira TODO terreno difícil, do mapa e de magia —
    // é o que a magia promete, ao contrário do Andar na Água, que é só da água.
    const dificil = !this.semTerrenoDificil && ((this.tileAt(x, y) === 2 && !naAgua)
      || this.dificeis?.has(key(x, y)) || this.dificeisExtra?.has(key(x, y)));
    // Vegetação cerrada (Crescer Plantas): cada 1,5 m custa 6 m.
    const cerrado = this.dificeis4?.has(key(x, y)) && !this.semTerrenoDificil;
    let cost = cerrado ? FEET_PER_SQUARE * 4 : dificil ? FEET_PER_SQUARE * 2 : FEET_PER_SQUARE;
    // Patas de Aranha: sobe sem o custo da escalada, mas pisa em terreno difícil.
    if (fromX !== null && !this.escalando) {
      const climb = this.heightAt(x, y) - this.heightAt(fromX, fromY);
      if (climb > 0) cost += climb * FEET_PER_SQUARE;
    }
    return cost;
  }

  /** Degrau de mais de um nível é parede: não dá para escalar num passo. */
  stepBlocked(fromX, fromY, toX, toY) {
    return Math.abs(this.heightAt(toX, toY) - this.heightAt(fromX, fromY)) > 1;
  }

  /**
   * Busca em largura por custo: todos os quadrados alcançáveis com o orçamento.
   * @param {{x:number,y:number}} from
   * @param {number} budgetFt
   * @param {(x:number,y:number)=>boolean} occupied quadrado ocupado por outra criatura
   * @returns {Map<string,{x:number,y:number,cost:number,from:string|null}>}
   */
  /**
   * @param {function} occupied  o quadrado está tomado? (atravessa, não para)
   * @param {function} cabe      a criatura CABE com esse quadrado de âncora?
   *   Para quem ocupa 1x1 é sempre verdade. Para um ogro de 2x2 é o que impede
   *   ele de atravessar uma porta de um quadrado e de parar meio dentro da
   *   parede — e, diferente de `occupied`, vale também para passar, porque
   *   quem não cabe não passa.
   */
  reachable(from, budgetFt, occupied = () => false, cabe = () => true, f = 1, atravessa = () => false) {
    const seen = new Map();
    seen.set(key(from.x, from.y), { x: from.x, y: from.y, cost: 0, from: null, parar: true, passar: true });
    // Fila simples ordenada por custo: a grade é pequena, não precisa de heap.
    const queue = [{ x: from.x, y: from.y, cost: 0 }];

    while (queue.length) {
      queue.sort((a, b) => a.cost - b.cost);
      const cur = queue.shift();
      const curKey = key(cur.x, cur.y);
      if (seen.get(curKey).cost < cur.cost) continue;

      for (const { dx, dy } of NEIGHBORS) {
        const nx = cur.x + dx;
        const ny = cur.y + dy;
        if (!this.inside(nx, ny) || this.blocksMove(nx, ny)) continue;
        if (!cabe(nx, ny)) continue;
        if (!this.passaPegada(cur.x, cur.y, nx, ny, f)) continue;
        if (f > 1 && this.paredeNaPegada(nx, ny, f)) continue;
        // Não corta quina entre duas paredes.
        if (dx !== 0 && dy !== 0 && this.blocksMove(cur.x + dx, cur.y) && this.blocksMove(cur.x, cur.y + dy)) continue;
        if (!this.voando && !this.escalando && this.stepBlocked(cur.x, cur.y, nx, ny)) continue;

        const cost = cur.cost + this.costOf(nx, ny, cur.x, cur.y);
        if (cost > budgetFt) continue;
        const nKey = key(nx, ny);
        const prev = seen.get(nKey);
        if (prev && prev.cost <= cost) continue;
        // PASSAR E PARAR SÃO COISAS DIFERENTES. Pelo livro, atravessa-se o
        // quadrado de um ALIADO à vontade; o que não se pode é terminar o
        // movimento em cima dele. Antes, a busca simplesmente não seguia por
        // um quadrado tomado — e com isso um aliado parado num corredor
        // fechava a passagem para o grupo inteiro.
        //
        // `parar` diz se a casa serve de DESTINO; a busca continua por ela
        // de qualquer jeito quando `atravessa` deixa.
        const tomada = occupied(nx, ny);
        const passa = !tomada || atravessa(nx, ny);
        // Forma Gasosa: o vão estreito é a mesma ideia. A névoa ATRAVESSA a
        // grade e a seteira, e não PARA dentro delas — se a magia acabasse ali,
        // o herói ficaria entalado na grade.
        const soDePassagem = this.atravessaVao && this.vaos.has(nKey);
        seen.set(nKey, { x: nx, y: ny, cost, from: curKey, parar: !tomada && !soDePassagem, passar: passa });
        if (passa) queue.push({ x: nx, y: ny, cost });
      }
    }
    return seen;
  }

  /** Reconstrói o caminho a partir do mapa devolvido por `reachable`. */
  static pathFrom(reached, target) {
    const path = [];
    let cur = key(target.x, target.y);
    while (cur) {
      const node = reached.get(cur);
      if (!node) return [];
      path.unshift({ x: node.x, y: node.y });
      cur = node.from;
    }
    return path;
  }

  /** Bresenham entre centros de quadrados, para linha de visão. */
  line(a, b) {
    const points = [];
    let x0 = a.x; let y0 = a.y;
    const x1 = b.x; const y1 = b.y;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    for (;;) {
      points.push({ x: x0, y: y0 });
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
    return points;
  }

  /**
   * Linha de visão. Além das paredes, um platô mais alto que os DOIS pontos
   * corta a visão — é isso que faz o terreno alto importar de verdade.
   */
  hasLineOfSight(a, b) {
    const eye = Math.max(this.heightAt(a.x, a.y), this.heightAt(b.x, b.y));
    const pts = this.line(a, b);
    for (let i = 1; i < pts.length; i++) {
      if (!this.passa(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, 'visao')) return false;
      if (i === pts.length - 1) break;
      if (this.blocksSight(pts[i].x, pts[i].y)) return false;
      if (this.heightAt(pts[i].x, pts[i].y) > eye) return false;
    }
    return true;
  }

  /**
   * Quantas PAREDES a linha de `a` a `b` cruza.
   *
   * A Clarividência precisa disto: o olho dela atravessa parede, e quantas
   * parede ele atravessa é a diferença entre enxergar o quarto do lado e
   * enxergar a planta baixa inteira.
   *
   * DUAS DECISÕES, as duas medidas. A primeira: o resultado é o MENOR dos dois
   * sentidos. `line` é um Bresenham, e o desempate dele não é simétrico — em
   * cerca de 8% dos pares dos mapas reais a contagem mudava com a ordem, e em
   * 1% a 2% isso decidia se o olho enxergava ou não. Um olho que vê de lá para
   * cá e não de cá para lá é defeito.
   *
   * A segunda: isto IGNORA elevação, ao contrário de `hasLineOfSight`, que
   * barra o que está acima da linha do olho. É de propósito: um olho que
   * atravessa pedra não é barrado por um degrau. Com altura, `paredesEntre` dá
   * 0 onde `hasLineOfSight` dá `false`; sem altura, as duas concordam sempre
   * (93 mil pares medidos em mapas aleatórios, nenhuma divergência).
   */
  paredesEntre(a, b) {
    return Math.min(this.paredesNaLinha(a, b), this.paredesNaLinha(b, a));
  }

  /** Um sentido só da contagem de `paredesEntre`, que tira o menor dos dois. */
  paredesNaLinha(a, b) {
    const pts = this.line(a, b);
    let n = 0;
    for (let i = 1; i < pts.length; i++) {
      if (!this.passa(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, 'visao')) n += 1;
      if (i === pts.length - 1) break;
      if (this.blocksSight(pts[i].x, pts[i].y)) n += 1;
    }
    return n;
  }

  /** Cobertura parcial dá +2 de CA no SRD: obstáculo ou degrau na linha. */
  coverBetween(a, b) {
    const low = Math.min(this.heightAt(a.x, a.y), this.heightAt(b.x, b.y));
    const pts = this.line(a, b);
    // Seteira na última aresta (colada no alvo): três quartos de cobertura,
    // +5 (SRD). A fenda é estreita para quem está DENTRO, não para quem atira
    // de dentro para fora — por isso só conta a do lado do alvo.
    const n = pts.length;
    if (n > 1) {
      const p = pts[n - 2];
      const q = pts[n - 1];
      const arestas = p.x === q.x || p.y === q.y ? [this.aresta(p.x, p.y, q.x, q.y)]
        : [this.aresta(p.x, p.y, q.x, p.y), this.aresta(q.x, p.y, q.x, q.y), this.aresta(p.x, p.y, p.x, q.y), this.aresta(p.x, q.y, q.x, q.y)];
      if (arestas.includes(4)) return 5;
    }
    for (let i = 1; i < pts.length - 1; i++) {
      if (this.tileAt(pts[i].x, pts[i].y) === 3) return 2;
      if (this.heightAt(pts[i].x, pts[i].y) > low) return 2;
    }
    return 0;
  }

  /** Quadrados dentro de um raio em pés (para explosões e auras). */
  within(center, radiusFt) {
    const r = Math.floor(radiusFt / FEET_PER_SQUARE);
    const out = [];
    for (let y = center.y - r; y <= center.y + r; y++) {
      for (let x = center.x - r; x <= center.x + r; x++) {
        if (!this.inside(x, y)) continue;
        if (distanceFt(center, { x, y }) > radiusFt) continue;
        out.push({ x, y });
      }
    }
    return out;
  }

  /**
   * Cone do SRD: em cada ponto, a largura é igual à distância até a origem.
   *
   * Na grade, o passo t (1..comprimento) pega as casas com desvio lateral de
   * até floor(t/2): um cone de 4,5 m tem larguras 1, 3, 3 — sete casas. O
   * cone anterior abria ±t por passo (15 casas, 10,5 m de boca) e pegava o
   * dobro de alvos. Na diagonal vale a mesma conta com os dois eixos: a casa
   * (a, b) entra se |a − b| <= floor(max(a, b) / 2), o que também dá sete.
   */
  cone(origin, dir, lengthFt) {
    const len = Math.floor(lengthFt / FEET_PER_SQUARE);
    const nx = Math.sign(dir.x);
    const ny = Math.sign(dir.y);
    const out = [];
    if (!nx && !ny) return out;
    if (nx && ny) {
      for (let a = 1; a <= len; a++) {
        for (let b = 1; b <= len; b++) {
          if (Math.abs(a - b) > Math.floor(Math.max(a, b) / 2)) continue;
          const x = origin.x + nx * a;
          const y = origin.y + ny * b;
          if (this.inside(x, y)) out.push({ x, y });
        }
      }
      return out;
    }
    for (let t = 1; t <= len; t++) {
      const lado = Math.floor(t / 2);
      for (let s = -lado; s <= lado; s++) {
        const x = origin.x + nx * t + (nx === 0 ? s : 0);
        const y = origin.y + ny * t + (ny === 0 ? s : 0);
        if (this.inside(x, y)) out.push({ x, y });
      }
    }
    return out;
  }

  /**
   * Cubo que SAI do conjurador (Onda Trovejante): encostado nele, do lado de
   * `dir`. Em linha reta, centrado no eixo; na diagonal, no canto.
   */
  cube(origin, dir, sizeFt) {
    const n = Math.floor(sizeFt / FEET_PER_SQUARE);
    const nx = Math.sign(dir.x);
    const ny = Math.sign(dir.y);
    const out = [];
    if (!nx && !ny) return out;
    const meio = Math.floor(n / 2);
    for (let i = 1; i <= n; i++) {
      for (let j = 0; j < n; j++) {
        let x;
        let y;
        if (nx && ny) { x = origin.x + nx * i; y = origin.y + ny * (j + 1); }
        else if (nx) { x = origin.x + nx * i; y = origin.y + j - meio; }
        else { x = origin.x + j - meio; y = origin.y + ny * i; }
        if (this.inside(x, y)) out.push({ x, y });
      }
    }
    return out;
  }

  /** Quadrado de `sizeFt` com o canto de cima à esquerda em `corner` (Graxa). */
  square(corner, sizeFt) {
    const n = Math.max(1, Math.floor(sizeFt / FEET_PER_SQUARE));
    const out = [];
    for (let y = corner.y; y < corner.y + n; y++) {
      for (let x = corner.x; x < corner.x + n; x++) {
        if (this.inside(x, y)) out.push({ x, y });
      }
    }
    return out;
  }
}
