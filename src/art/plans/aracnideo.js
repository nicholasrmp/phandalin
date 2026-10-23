// PLANO CORPORAL: aracnideo — aranha gigante e aranha-lobo gigante.
//
// POR QUE ESTE PLANO NAO E O QUADRUPEDE COM PATAS A MAIS
// A 45 px de altura, no tabuleiro, so a silhueta chega ao jogador. Tres coisas
// fazem a silhueta ler como ARANHA, e errar qualquer uma delas devolve a bolha
// com pernas que estava aqui antes:
//   1. DOIS volumes, nao um: cefalotorax pequeno na frente, abdome maior e
//      MAIS ALTO atras, com a cintura estrangulada entre os dois. Volume unico
//      le como besouro;
//   2. o JOELHO ACIMA da linha do dorso. E a assinatura do bicho — joelho
//      abaixo do corpo le como caranguejo;
//   3. oito hastes em diagonal saindo do cefalotorax, as da frente mais longas
//      que as de tras. Haste vertical le como mesa.
//
// Por isso o corpo sai de coluna() (via `bulbo`) e as pernas de traco(): nenhum
// retangulo axial resolve nem a gota do abdome nem a dobra alta da perna.
//
// LUZ de cima e da esquerda, como no resto do elenco. Cada haste leva nucleo,
// aresta de luz no femur (que aponta para cima), tibia dois degraus abaixo
// porque desce contra a luz, aresta de luz refletida na coluna esquerda dela, e
// sombra de contato onde entra no corpo. O contorno preto vem depois, em
// sheet.js — aqui ninguem desenha contorno.
//
// Nada de Math.random(), nem nas cerdas: a folha e montada uma vez por look e
// os dois quadros de idle tem de casar pixel a pixel. Cerda sorteada por quadro
// virava chuvisco piscando.
//
// CAMPOS DE LOOK QUE ESTE PLANO LE (todos com padrao, para o plano nao quebrar
// antes de o look existir):
//   aracnideo  'gigante' | 'lobo'      qual perfil de proporcao usar
//   sizeMul    numero (1 = padrao)     afina o tamanho dentro do perfil
//   eyeCount   2..8                    quantos olhos do aglomerado aparecem
//   outfit     carapaca do cefalotorax
//   outfitDark dorso do abdome e sombra de chao
//   trim       galoes do abdome (o elemento-heroi da figura)
//   leather    quitina das hastes
//   skin       ventre claro, visto na pose `down`
//   hair       cerdas
//   metal      presas
//   eyes       olhos

import { ramp } from '../kit.js';

const r = Math.round;

// A ponta do tarso para 2 px acima da linha do chao para a sombra de contato
// ter uma fileira so dela. Pe desenhado em cima da propria sombra le como
// adesivo colado no piso.
const CHAO = -2;

// Aglomerado de olhos, em ordem de importancia: os dois grandes primeiro, para
// que um look com `eyeCount: 2` ainda renda um rosto (e nao duas sobras da
// fileira de cima).
const OLHOS_FRENTE = [
  [-3, -22, 2], [3, -22, 2],
  [-7, -25, 1], [-2, -26, 1], [2, -26, 1], [7, -25, 1],
  [-8, -20, 1], [8, -20, 1],
];

// De lado so se ve o lado de fora do aglomerado — por isso a tabela e outra, e
// mais curta, em vez de uma projecao da de frente.
const OLHOS_LADO = [
  [16, -26, 2], [18, -23, 1], [14, -28, 1], [17, -29, 1], [13, -24, 1],
];

const PERFIS = {
  // SILHUETA: dois bulbos presos por uma cintura fina, pendurados no alto de
  // oito hastes compridas em ziguezague cujos joelhos pontudos passam acima do
  // dorso, o bulbo de tras maior e mais alto que o da frente.
  gigante: {
    mul: 1, alcance: 1, joelho: 1, abdomeW: 1, abdomeH: 1,
    esp: 2, cerdas: 3, olhosExtra: 0,
  },

  // SILHUETA: massa atarracada quase encostada no chao, mais larga do que alta,
  // de oito hastes curtas e grossas abertas em leque com os joelhos na altura
  // do dorso, e dois olhos salientes na frente do bloco dianteiro.
  lobo: {
    mul: 0.82, alcance: 0.95, joelho: 0.5, abdomeW: 1.14, abdomeH: 0.76,
    esp: 2, cerdas: 2, olhosExtra: 1,
  },
};

// Hastes de cada vista: [ancoraX, ancoraY, joelhoX, joelhoY, peX, ordem].
// `ordem` 0 e o par da frente — o mais longo, e o que levanta no ataque.
// Os pes ficam de proposito ESPALHADOS em x (22, 14, -8, -20): quatro pernas
// perto do mesmo ponto viram uma coluna macica no contorno, e a figura passa a
// ler como tripe. O par da frente vai para frente, o de tras para tras.
const LADO = [
  [14, -24, 19, -45, 22, 0],
  [11, -24, 14, -38, 14, 1],
  [8, -24, 2, -36, -8, 2],
  [5, -24, -6, -33, -20, 3],
];

// Mesma regra da vista de lado: os quatro pes de cada lado caem em x bem
// separados (22, 17, 13, 9). Com 2 px de grossura, pes a 2 px de distancia
// viram uma unica coluna grossa e o jogador conta quatro pernas, nao oito.
const FRENTE = [
  [7, -24, 17, -43, 22, 0],
  [8, -22, 14, -37, 17, 1],
  [8, -20, 11, -34, 13, 2],
  [7, -18, 9, -31, 9, 3],
];

export function paintAracnideo(kit, look, dir, pose) {
  const { px, contato, coluna, traco, disco } = kit;

  const perfil = PERFIS[look.aracnideo] ?? PERFIS.gigante;
  // O multiplicador do look afina o tamanho DENTRO do perfil: a cria e a
  // matriarca saem da mesma geometria, sem um perfil novo para cada encontro.
  //
  // O TETO nao e capricho: a geometria do perfil `gigante` ja enche a celula em
  // esc = 1 (abdome na borda esquerda, quelicera na direita). Acima disso o
  // corpo vaza, e o contorno automatico de sheet.js nasce dentro do quadro
  // vizinho da folha. Quem precisar de uma aranha maior tem de pedir celula
  // maior em sheet.js, nao sizeMul maior — esta anotado no relatorio.
  const esc = Math.min(1.05, (perfil.mul ?? 1) * (look.sizeMul ?? look.heightMul ?? 1));
  const e = (v) => r(v * esc);
  const alc = perfil.alcance ?? 1;
  const jo = perfil.joelho ?? 1;

  const carapaca = look.outfit ?? '#4a3c56';
  const dorso = look.outfitDark ?? ramp(carapaca, -2);
  const marca = look.trim ?? ramp(carapaca, 3);
  const haste = look.leather ?? ramp(dorso, -1);
  const ventre = look.skin ?? ramp(carapaca, 2);
  const cerda = look.hair ?? ramp(dorso, -3);
  const presa = look.metal ?? '#cfbf9c';
  const olho = look.eyes ?? '#e2d04a';
  const nOlhos = Math.max(2, Math.min(8, look.eyeCount ?? 8));

  const esp = Math.max(1, r((perfil.esp ?? 2) * Math.min(1, esc)));

  // A celula tem 52 px (x de -26 a 25) e o contorno de sheet.js e varrido na
  // folha inteira: pixel colado na borda da celula faz o contorno nascer DENTRO
  // do quadro vizinho. Com o no do joelho somando 2 px para fora da haste, 22 e
  // o ultimo x seguro — sem esse teto o ataque, que abre as pernas 30%, suja o
  // quadro ao lado.
  const limX = (x) => Math.max(-22, Math.min(22, x));
  // Boca e presa nunca descem abaixo da ponta do tarso, senao o agachamento do
  // ataque enfia as presas no piso.
  const acima = (y) => Math.min(y, CHAO);

  const ataque = pose.kind === 'attack';
  const machucada = pose.kind === 'hurt';
  // O corpo BAIXA no ataque. Numa criatura sem rosto legivel a distancia, o
  // agachamento antes do salto e a unica coisa que anuncia intencao.
  const baixa = ataque ? e(pose.frame === 1 ? 5 : 2) : machucada ? e(2) : 0;
  const respira = pose.kind === 'idle' && pose.frame === 1 ? 1 : 0;

  // Gota: coluna de largura variavel, com o pico onde a barriga e mais larga.
  // Retangulo empilhado e exatamente o que faz um abdome parecer caixa.
  const perfilGota = (t, pico, achata) => {
    const d = Math.abs(t - pico) / Math.max(pico, 1 - pico);
    return 1 - Math.pow(d, 1.8) * achata;
  };
  const bulbo = (topo, alt, centro, larg, cor, { pico = 0.46, inclina = 0, achata = 0.74 } = {}) => {
    coluna(topo, alt, (t) => ({
      c: centro + inclina * t,
      w: Math.max(1, larg * perfilGota(t, pico, achata)),
    }), cor, { topo: 1, base: 1 });
  };

  // Galoes no alto do abdome. Sao o ELEMENTO-HEROI da figura: o unico detalhe
  // interno que sobrevive ao tamanho do tabuleiro, e o que impede a aranha de
  // ser uma mancha de valor unico.
  const galoes = (topo, alt, centro, larg) => {
    for (let k = 0; k < 3; k++) {
      const y = topo + r(alt * (0.26 + k * 0.17));
      const w = Math.max(2, r(larg * (0.46 - k * 0.09)));
      const x = centro - Math.floor(w / 2);
      px(x, y, w, 1, k === 0 ? ramp(marca, 1) : marca);
      px(x + 1, y + 1, Math.max(1, w - 2), 1, ramp(marca, -2));
    }
  };

  // Cerdas na borda do abdome, em passo fixo. Ver o cabecalho: sem sorteio.
  const cerdas = (topo, alt, centro, larg, pico = 0.46) => {
    const passo = Math.max(2, perfil.cerdas ?? 3);
    for (let i = 2; i < alt - 1; i += passo) {
      const meia = Math.floor((larg * perfilGota(i / Math.max(1, alt - 1), pico, 0.74)) / 2);
      px(centro - meia - 1, topo + i, 1, 1, cerda);
      px(centro + meia, topo + i - 1, 1, 1, ramp(cerda, -1));
    }
  };

  // Os dois lados do mesmo bicho nao podem sair espelhados pixel a pixel: e
  // isso que faz o elenco atual parecer prancha de boneco de vestir. Dois
  // joelhos do lado direito descem 2 px e a figura passa a ter peso.
  const assimetria = (lado, ordem) => (lado > 0 && (ordem === 0 || ordem === 2) ? e(2) : 0);

  const montar = ([ax, ay, jx, jy, fx, ordem], { dx = 0, dy = 0, desce = 0, fator = 1, tom = 0, lado = 1, longe = false, respiro = false } = {}) => {
    const bx = e(ax) + dx;
    const by = e(ay) + dy;
    return {
      ax: bx,
      ay: by,
      jx: bx + e((jx - ax) * alc * fator),
      jy: by + e((jy - ay) * jo) + desce,
      fx: bx + e((fx - ax) * alc * fator),
      ordem, lado, tom, longe, respiro,
    };
  };

  const pintaHaste = (p) => {
    let { ax, ay, jx, jy, fx } = p;
    let fy = CHAO;
    const grossura = p.longe ? 1 : esp;

    // O corpo desceu, a ancora desce com ele — mas o joelho so desce metade: a
    // perna FLEXIONA, ela nao escorrega junto com o corpo.
    ay += baixa;
    jy += r(baixa * 0.5);

    if (machucada) {
      // Recolher o pe para debaixo do corpo e fechar o angulo do joelho. Aranha
      // ferida vira uma bola de hastes, nao um boneco inclinado para tras.
      // Nao encolher mais do que isto: abaixo de uns 70% a figura muda de
      // tamanho em vez de mudar de pose, e o jogador le outra criatura.
      jx = ax + r((jx - ax) * 0.72);
      fx = ax + r((fx - ax) * 0.62);
      jy -= e(1);
    }
    if (ataque && p.ordem === 0) {
      // Par da frente sai do chao e aponta para cima e para fora. E o gesto que
      // mostra as presas sem precisar mexer na camera.
      const abre = pose.frame === 1 ? 1.3 : 1.1;
      jy -= e(pose.frame === 1 ? 7 : 3);
      jx = ax + r((jx - ax) * abre);
      fx = ax + r((fx - ax) * abre);
      fy = jy + e(pose.frame === 1 ? 3 : 7);
    }
    if (respira && p.respiro) {
      // RESPIRACAO: DUAS das oito hastes andam 1 px, e de proposito nao sao
      // simetricas. Mexer nas oito faz a figura pular de quadro em quadro;
      // mexer num par simetrico vira tique de metronomo; mexer em duas
      // desencontradas faz o bicho parecer vivo e parado ao mesmo tempo.
      jy -= 1;
      fx += p.lado;
    }

    jx = limX(jx);
    fx = limX(fx);

    const nucleo = ramp(haste, p.tom);
    // Femur desenhado DO JOELHO para a ancora: traco() clareia o pixel inicial,
    // e o joelho e justamente onde a luz de cima bate.
    traco(jx, jy, ax, ay, grossura, nucleo);
    if (grossura > 1) traco(jx, jy, ax, ay, 1, ramp(nucleo, 2));

    // O trecho que desce do joelho ate o chao tem 40 px numa aranha Grande. Em
    // linha reta isso le como ESTACA, nao como perna: a perna de artropode tem
    // mais uma dobra no meio (tibia + metatarso) e ela arqueia PARA FORA. O
    // ponto medio deslocado 2 px para fora e o que devolve a curva.
    const fora = Math.sign(fx - ax) || 1;
    const mx = limX(jx + r((fx - jx) * 0.5) + fora * e(2));
    const my = jy + r((fy - jy) * 0.5);
    // Desce contra a luz: dois degraus abaixo, com a aresta de luz refletida na
    // coluna da esquerda — a borda de uma haste cilindrica nunca e o ponto mais
    // escuro dela.
    traco(jx, jy, mx, my, grossura, ramp(nucleo, -2));
    traco(mx, my, fx, fy, grossura, ramp(nucleo, -2));
    if (grossura > 1) {
      traco(jx, jy, mx, my, 1, ramp(nucleo, -1));
      traco(mx, my, fx, fy, 1, ramp(nucleo, -1));
    }
    px(mx, my, 1, 1, ramp(nucleo, -4));   // no do metatarso
    // No do joelho: protubera 1 px para cima e para a esquerda, e e esse bico
    // que faz a dobra alta aparecer no contorno preto.
    px(jx - 1, jy - 1, grossura + 1, grossura + 1, ramp(nucleo, 1));
    px(jx, jy + grossura, grossura, 1, ramp(nucleo, -4));
    contato(ax, ay, grossura + 1, nucleo);

    px(fx, fy, grossura, 1, ramp(nucleo, -3));
    // Sombra de chao do tamanho do tarso, nao maior: com oito pes a 3 px um do
    // outro, sombra larga funde todas num rodape unico e a figura fica apoiada
    // num pedestal.
    if (fy === CHAO) px(fx, -1, grossura, 1, ramp(dorso, -4));
    else px(fx, fy - 1, 1, 1, ramp(nucleo, -1));
  };

  // Aglomerado de olhos. Sempre o ultimo a ser pintado: e onde o olho pousa.
  const pintaOlhos = (tabela, dy = 0) => {
    const grandes = perfil.olhosExtra ?? 0;
    const limite = Math.min(nOlhos, tabela.length);
    for (let i = 0; i < limite; i++) {
      const [ox, oy, raio] = tabela[i];
      const rr = Math.max(1, e(raio) + (i < 2 ? grandes : 0));
      // Orbita escura atras dos dois grandes: sem ela o olho claro flutua sobre
      // a carapaca e o aglomerado perde a leitura de "muitos olhos juntos".
      if (i < 2) px(e(ox) - rr - 1, e(oy) + dy - rr, 2 * rr + 2, 2 * rr + 1, ramp(carapaca, -4));
      disco(e(ox), e(oy) + dy, rr, i < 2 ? olho : ramp(olho, -1));
    }
  };

  // ---- down ----------------------------------------------------------------
  if (pose.kind === 'down') {
    // ARANHA MORTA VIRA DE COSTAS. Nenhuma outra criatura do elenco cai assim:
    // ventre claro para cima e oito hastes dobradas em gancho sobre o corpo dao
    // uma silhueta que o jogador le de longe, sem olhar barra de vida.
    const alt = Math.max(5, e(9));
    const topo = -alt - 1;
    const larg = r(e(22) * (perfil.abdomeW ?? 1));

    bulbo(topo, alt, e(-6), larg, ventre, { pico: 0.42, achata: 0.5 });
    bulbo(topo + e(1), Math.max(3, alt - e(2)), e(10), e(13), ramp(ventre, -1), { achata: 0.55 });
    // Placa do esterno: a barriga da aranha nao e lisa, e o sulco central e o
    // que diz que estamos vendo o lado de baixo do bicho.
    px(e(-12), topo + e(3), e(14), 1, ramp(ventre, -2));
    px(e(-12), topo + e(4), e(14), 1, ramp(ventre, -3));
    contato(e(-6) - Math.floor(larg / 2), -1, larg, ventre);
    // As presas ficam viradas para cima, inuteis — detalhe pequeno que fecha a
    // leitura de "esta de barriga para o ar".
    traco(e(13), topo + e(2), e(16), topo - e(3), 1, ramp(presa, -1));

    // Alturas desencontradas: as hastes de um cadaver nao param todas no mesmo
    // arco. Par de tras mais aberto, par da frente mais fechado.
    for (const [bx, altura] of [[-13, 11], [-5, 14], [4, 13], [11, 10]]) {
      const fora = bx < 0 ? -1 : 1;
      for (const lado of [-1, 1]) {
        const ax = e(bx) + lado;
        const ay = topo + e(1);
        const jx = ax + fora * e(5);
        const jy = ay - r(e(altura) * (0.6 + 0.4 * jo)) + lado;
        const cor = ramp(haste, lado < 0 ? 0 : -2);
        traco(jx, jy, ax, ay, esp, cor);
        traco(jx, jy, ax, ay, 1, ramp(cor, 2));
        // O tarso volta PARA DENTRO e para baixo, por cima da barriga: cada
        // perna fecha um gancho, e os oito ganchos viram uma gaiola sobre o
        // corpo. Haste reta para cima viraria cerca, nao aranha morta.
        traco(jx, jy, ax - fora * e(2), ay - e(4), esp, ramp(cor, -2));
        px(jx - 1, jy - 1, esp + 1, esp + 1, ramp(cor, 1));
      }
    }
    return;
  }

  // ---- lado ----------------------------------------------------------------
  if (dir === 'side') {
    // Hastes do lado de LA primeiro: 3 px atras, joelho mais baixo, haste fina e
    // tres degraus escura. Sem esse segundo conjunto a aranha fica com quatro
    // pernas e vira inseto. O alcance menor (75%) planta esses pes ENTRE os
    // da frente, nunca colados neles: dois pes no mesmo x somam uma haste
    // grossa unica e o contorno perde uma perna. O fator e menor atras porque
    // la as pernas sao mais curtas e os pes se acumulariam.
    for (const linha of LADO) {
      pintaHaste(montar(linha, {
        dx: -e(3), dy: e(1), desce: e(5), tom: -3, longe: true,
        fator: linha[5] < 2 ? 0.78 : 0.62,
        lado: linha[5] < 2 ? 1 : -1,
      }));
    }

    const abAlt = Math.max(6, r(e(19) * perfil.abdomeH));
    const abW = r(e(20) * perfil.abdomeW);
    const abBase = -e(17) + baixa;
    const abCx = e(-11);
    bulbo(abBase - abAlt, abAlt, abCx, abW, dorso, { pico: 0.44, inclina: e(1) });
    galoes(abBase - abAlt, abAlt, abCx, abW);
    cerdas(abBase - abAlt, abAlt, abCx, abW, 0.44);
    // Fieiras na ponta de tras: duas protuberancias curtas. Elas dizem para que
    // lado a aranha esta virada tanto quanto as presas do outro extremo.
    px(abCx - Math.floor(abW / 2), abBase - e(8), e(3), e(2), ramp(dorso, -3));
    px(abCx - Math.floor(abW / 2), abBase - e(8), e(2), 1, ramp(dorso, -1));

    const ceAlt = Math.max(6, e(13));
    const ceTopo = -e(17) - ceAlt + baixa;
    bulbo(ceTopo, ceAlt, e(11), e(15), carapaca, { pico: 0.5 });
    // CINTURA. Os dois bulbos ficam SEPARADOS e um pediculo curto e estreito
    // liga um ao outro: e o entalhe no contorno, acima e abaixo dessa ponte,
    // que mantem DOIS volumes quando a figura encolhe no tabuleiro. Encostar um
    // bulbo no outro devolve a lasanha de um volume unico, que e justamente o
    // defeito que este plano existe para consertar.
    const pdY = ceTopo + r(ceAlt * 0.3);
    const pdH = Math.max(3, e(5));
    bulbo(pdY, pdH, e(2), e(6), ramp(carapaca, -2), { pico: 0.5, achata: 0.3 });
    px(e(4), pdY, 1, pdH, ramp(carapaca, -4));         // sombra de contato na juncao
    px(e(-1), pdY + 1, 1, pdH - 1, ramp(dorso, -4));

    for (const linha of LADO) {
      pintaHaste(montar(linha, {
        tom: 0, lado: linha[5] < 2 ? 1 : -1,
        respiro: linha[5] === 1 || linha[5] === 3,
      }));
    }

    // Quelicera: bloco que desce na FRENTE do cefalotorax, com a presa curvada
    // para fora e para baixo. Sem ela a cabeca da aranha nao tem frente.
    bulbo(acima(-e(23) + baixa), e(9), e(18), e(7), ramp(carapaca, -1), { pico: 0.28 });
    traco(e(18), acima(-e(15) + baixa), e(21), acima(-e(9) + baixa), 1, presa);
    traco(e(20), acima(-e(15) + baixa), e(22), acima(-e(11) + baixa), 1, ramp(presa, -2));
    px(e(21), acima(-e(9) + baixa), 1, 1, ramp(presa, -3));
    // Pedipalpo: curto e grosso, mais curto que qualquer perna — e o que impede
    // a quelicera de ser lida como uma nona pata.
    traco(e(15), -e(21) + baixa, e(20), -e(16) + baixa, esp, ramp(haste, 1));

    pintaOlhos(OLHOS_LADO, baixa);
    return;
  }

  // ---- costas --------------------------------------------------------------
  if (dir === 'back') {
    // De costas o abdome e quase tudo, e ele e carregado ALTO: o cefalotorax
    // aparece so por baixo. As fieiras no centro sao a unica marca que diz
    // "estou vendo o traseiro dela" — nenhuma outra vista tem isso, e e o que
    // impede as tres vistas de serem a mesma figura.
    const ceAlt = Math.max(5, e(12));
    const ceBase = -e(10) + baixa;
    bulbo(ceBase - ceAlt, ceAlt, 0, e(15), ramp(carapaca, -1), { pico: 0.52 });

    for (const linha of FRENTE) {
      for (const lado of [-1, 1]) {
        pintaHaste(montar([lado * linha[0], linha[1], lado * linha[2], linha[3], lado * linha[4], linha[5]], {
          dy: e(2), desce: e(1) + assimetria(lado, linha[5]), tom: lado < 0 ? 1 : -2, lado,
          respiro: (linha[5] === 1 && lado < 0) || (linha[5] === 3 && lado > 0),
        }));
      }
    }

    const abAlt = Math.max(6, r(e(20) * perfil.abdomeH));
    const abW = r(e(23) * perfil.abdomeW);
    // A altura do conjunto tem de bater com a das outras duas vistas: aranha
    // que encolhe ao virar de costas denuncia o truque das tres vistas.
    const abBase = -e(17) + baixa;
    bulbo(abBase - abAlt, abAlt, 0, abW, dorso, { pico: 0.46 });
    galoes(abBase - abAlt, abAlt, 0, abW);
    cerdas(abBase - abAlt, abAlt, 0, abW, 0.46);
    contato(-Math.floor(e(13) / 2), abBase - 1, e(13), dorso);
    for (const [fx, fy] of [[-e(3), abBase - e(3)], [e(3), abBase - e(3)], [0, abBase - e(6)]]) {
      disco(fx, fy, Math.max(1, e(2)), ramp(dorso, -3));
    }
    return;
  }

  // ---- frente --------------------------------------------------------------
  // De frente as oito hastes abrem para os DOIS lados e o corpo quase desaparece
  // atras delas: e a vista mais larga das tres.
  for (const linha of FRENTE) {
    for (const lado of [-1, 1]) {
      pintaHaste(montar([lado * linha[0], linha[1], lado * linha[2], linha[3], lado * linha[4], linha[5]], {
        tom: lado < 0 ? 1 : -2, lado, desce: assimetria(lado, linha[5]),
        respiro: (linha[5] === 1 && lado < 0) || (linha[5] === 3 && lado > 0),
      }));
    }
  }

  // De frente o abdome e visto de ponta: ele vira um corcovado atras da
  // carapaca, nao o volume maior da figura. Repetir aqui a largura da vista de
  // lado faz o bicho virar uma bola com pernas — o defeito que este plano
  // existe para consertar.
  const abAlt = Math.max(6, r(e(14) * perfil.abdomeH));
  const abW = r(e(17) * perfil.abdomeW);
  const abBase = -e(21) + baixa;
  bulbo(abBase - abAlt, abAlt, 0, abW, dorso, { pico: 0.42 });
  galoes(abBase - abAlt, abAlt, 0, abW);
  cerdas(abBase - abAlt, abAlt, 0, abW, 0.42);

  const ceAlt = Math.max(6, e(14));
  const ceBase = -e(14) + baixa;
  bulbo(ceBase - ceAlt, ceAlt, 0, e(17), carapaca, { pico: 0.45 });
  // O abdome pousa atras e acima do cefalotorax: a sombra de contato no alto da
  // carapaca e o que separa os dois volumes nesta vista, onde um cobre o outro.
  contato(-Math.floor(e(16) / 2), ceBase - ceAlt, e(16), carapaca);

  for (const lado of [-1, 1]) {
    // Quelicera de cada lado da boca, afinando para baixo, e a presa virando
    // para DENTRO: e uma pinca, nao duas colunas paralelas.
    bulbo(acima(-e(17) + baixa), e(8), lado * e(3), e(6), ramp(carapaca, lado < 0 ? 0 : -2), { pico: 0.24 });
    traco(lado * e(4), acima(-e(10) + baixa), lado * e(2), acima(-e(5) + baixa), 1, lado < 0 ? presa : ramp(presa, -2));
    px(lado * e(2), acima(-e(5) + baixa), 1, 1, ramp(presa, -3));
    traco(lado * e(7), acima(-e(16) + baixa), lado * e(9), acima(-e(8) + baixa), esp, ramp(haste, lado < 0 ? 1 : -1));
  }

  pintaOlhos(OLHOS_FRENTE, baixa);
}
