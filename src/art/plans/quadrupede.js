// PLANO CORPORAL: quadrúpede — os canídeos.
//
// Contrato de todo plano em `plans/`:
//   paintX(kit, look, dir, pose)
//     kit  { px, cut, volume, contato, coluna, traco, disco } de `art/kit.js`
//     look o registro de `art/looks.js`
//     dir  'front' | 'side' | 'back'
//     pose { kind: 'idle'|'attack'|'hurt'|'down', frame: 0|1 }
//   Tudo é medido PARA CIMA a partir da linha do chão (y negativo), com x=0 no
//   centro da célula. A célula tem 52x80 e 75 px úteis de altura. O contorno
//   preto é posto depois, em `sheet.js` — nada aqui desenha contorno, e a luz
//   vem de cima e da esquerda, garantida por `volume()`/`coluna()`.
//
// Este plano não passa por `body.js` — a anatomia de quatro patas não é a mesma
// conta. O que importa é a proporção contra os bípedes: o lobo comum é mais
// baixo que um goblin na cernelha e bem mais comprido, que é como um animal
// ocupa o quadrado sem parecer um humanoide agachado.
//
// LIMITE DE x
//   cx = floor(52/2) = 26, então a coluna válida vai de x = -26 a x = 25 e o
//   contorno automático precisa de um pixel de folga de cada lado. Tudo aqui se
//   fecha em -24..24. É por isso que o PORTE (abaixo) cresce muito mais na
//   vertical do que na horizontal: na horizontal não há para onde crescer.
//
// O QUE ESTA RODADA CONSERTOU (REFERENCIAS.md §4)
//   1. A orelha era um `volume()` de 4x5 — um retângulo de cantos redondos — e
//      o bicho lia como cão de colo. Orelha de canídeo é TRIÂNGULO: base larga
//      no crânio, ponta de um pixel, ereta. `orelha()` existe só para isso.
//   2. O crânio era uma caixa de 11 px com um focinho de 6 colado na frente.
//      Agora o crânio ESTREITA para a frente e o focinho é longo e fino — a
//      cunha é o que separa um canídeo de um urso na mesma vista, e sem ela
//      nenhum tamanho de orelha salva a leitura.
//   3. Lobo e lobo atroz saíam pixel a pixel idênticos (IoU 1,000, medido): o
//      plano não tinha nenhuma noção de tamanho e os dois looks só diferiam em
//      cor. Agora o porte entra na geometria.
//   4. O nariz antigo era pintado em x = 25..27 e as duas últimas colunas
//      caíam fora da célula — o lobo vinha com a ponta do focinho decepada.
//
// PORTE E ESCALA
//   `look.porte === 'grande'` dá o lobo atroz. ELENCO.md §3 põe a faixa Grande
//   em 66–75 px, mas essa faixa é de BÍPEDE ereto (ogro, bugbear, coruja-urso):
//   num quadrúpede a altura se mede na cernelha, e o urso pardo deste mesmo
//   elenco — também Grande — fecha em 54–57. Um lobo de 70 px com os 46 px de
//   comprimento que a célula permite sairia com proporção de girafa. O atroz
//   fica em 57–60 na ponta da orelha e 48 na cernelha: acima do urso pardo e
//   à altura do humano médio de 58, contra os 37–40 do lobo comum. Está
//   anotado no relatório desta rodada como desvio consciente do contrato.
//
//     lobo         37–40 na orelha, 36 na cernelha, 43 de comprimento (medido)
//     lobo atroz   57–60 na orelha, 48 na cernelha, 49 de comprimento (medido)

import { ramp } from '../kit.js';

const r = Math.round;

/**
 * Orelha de canídeo: TRIANGULAR, pontuda e ereta.
 *
 * `coluna` recebe t = 0 no topo, então a largura começa em 1 e abre até a base
 * — é literalmente a ponta primeiro. O miolo entra um degrau para dentro e
 * dois para cima, senão a cartilagem encosta na borda e, depois do contorno
 * automático, a orelha inteira vira uma mancha de uma cor só.
 *
 * `base` é o y da LINHA DE BAIXO da orelha (onde ela nasce no crânio).
 */
function orelha({ coluna }, x, base, h, larg, cor, dentro) {
  coluna(base - h, h, (t) => ({ c: x, w: 1 + (larg - 1) * t }), cor, { topo: 1 });
  // O miolo fica FINO — larg-4, não larg-3. Com um pixel de borda só de cada
  // lado, a pele rosada toma a orelha inteira e o par lê como chifre em vez de
  // cartilagem vista por dentro.
  if (h > 4) coluna(base - h + 3, h - 4, (t) => ({ c: x, w: 1 + (larg - 4) * t }), dentro, { topo: 0 });
}

/**
 * Quadrúpedes: lobo e lobo atroz.
 *
 * As medidas abaixo estão em "unidades de lobo" — alturas acima do chão e
 * comprimentos a partir do centro da célula, como se o lobo comum fosse 1. O
 * porte Grande multiplica as duas por fatores DIFERENTES (1,5 na vertical,
 * 1,15 na horizontal) porque o lobo comum já ocupa 40 das 50 colunas úteis da
 * célula: na vertical sobra teto, na horizontal não sobra nada.
 */
export function paintQuadrupede(kit, look, dir, pose) {
  const { px, volume, coluna, contato, traco } = kit;
  const down = pose.kind === 'down';
  const atk = pose.kind === 'attack';
  const step = atk ? 3 : pose.frame === 1 ? 1 : 0;
  const crouch = atk ? 2 : 0;
  const body = look.outfit;
  const dark = look.outfitDark;
  const fur = look.hair ?? dark;
  const pele = look.skin ?? ramp(body, -2);
  const olho = look.eyes ?? '#ffd24a';

  const G = look.porte === 'grande';
  const kv = G ? 1.5 : 1;
  const kh = G ? 1.15 : 1;
  /** Comprimento, para `coluna` — ela arredonda sozinha. */
  const X = (n) => n * kh;
  /** Comprimento, para `px`/`volume`, que precisam de inteiro. */
  const xi = (n) => r(n * kh);
  /** Altura n acima do chão -> y da célula. */
  const yi = (n) => -r(n * kv);
  /** Espessura, em linhas, da faixa entre duas alturas. */
  const yh = (a, b) => r(b * kv) - r(a * kv);

  if (down) {
    // Caído, o lobo é um monte baixo com a cabeça de lado na ponta. A orelha
    // tomba mas continua PONTUDA: é o que sobra de canídeo no monte, e uma
    // orelha redonda aqui devolveria o cachorrinho de pelúcia.
    const w = xi(34);
    volume(xi(-17), yi(8), w, yh(0, 8), dark, { topo: 1, base: 1 });
    contato(xi(-17), -1, w, dark);
    coluna(yi(13), yh(5, 13), (t) => ({ c: X(12 + 4 * t), w: X(11) - X(7) * t }), body, { topo: 1 });
    // A tromba fecha em xi(19)+3: no porte Grande, xi(20) punha as duas
    // últimas colunas em x = 25 e o focinho saía decepado na borda da célula.
    px(xi(19), yi(9), xi(3), 2, ramp(pele, -1));
    traco(xi(10), yi(13), xi(6), yi(19), 2, ramp(dark, -1));
    volume(xi(-21), yi(10), xi(6), yh(5, 10), fur, { topo: 1 });   // cauda
    return;
  }

  if (dir === 'side') {
    const ch = crouch;

    /** Perna: afina do ombro ao pulso, e a pata fica plantada no chão. */
    const perna = (cxn, cor) => {
      coluna(yi(19) + ch, yh(0, 19) - ch, (t) => ({ c: X(cxn), w: X(5) - X(1.5) * t }), cor, { topo: 0 });
      volume(xi(cxn - 3), yi(3), xi(6), yh(0, 3), ramp(cor, -1), { topo: 1 });
      px(xi(cxn - 3), -1, xi(6), 1, ramp(cor, -4));
    };

    // Membros do lado de lá, um valor abaixo: é o que dá profundidade.
    perna(-12 - step, ramp(dark, -2));
    perna(3 - step, ramp(dark, -2));

    // TRONCO. A fatia de cima é a linha das costas e é comprida; as de baixo
    // encurtam e recuam, que é o flanco subindo para a virilha. Retângulo
    // deitado é exatamente o que faz o bicho parecer recortado em papel.
    const troncoY = yi(30) + ch;
    const troncoH = yh(16, 30);
    coluna(troncoY, troncoH, (t) => ({ c: X(-4) - X(3) * t, w: X(20) - X(6) * t * t }), body, { topo: 1 });
    contato(xi(-13), troncoY + troncoH - 1, xi(17), body);

    // Quarto traseiro: a massa da coxa, acima e atrás do tronco.
    coluna(yi(30) + ch, yh(17, 30), (t) => ({ c: X(-16 + t), w: X(9) - X(2) * t }), dark, { topo: 1 });

    // CERNELHA: o cupim de músculo sobre a pata dianteira, acima da linha das
    // costas. É ele que diz o porte do bicho — no atroz é onde os 50% a mais
    // de altura aparecem primeiro.
    coluna(yi(36) + ch, yh(26, 36), (t) => ({ c: X(8), w: X(11) - X(2) * t }), fur, { topo: 1 });
    for (let c = 0; c < 10; c += 2) px(xi(3) + c, yi(34) + ch, 1, yh(27, 34), ramp(fur, -2));

    // Membros da frente, no tom cheio.
    perna(-6 + step, dark);
    perna(9 + step, dark);

    // CRÂNIO: estreita para a frente. Caixa de largura constante é cabeça de
    // urso; a cunha é cabeça de lobo.
    coluna(yi(34) + ch, yh(25, 34), (t) => ({ c: X(13 + 2 * t), w: X(10) - X(3) * t }), body, { topo: 1 });

    // FOCINHO: longo e fino, e a ponta fecha em x = 20 (23 no atroz), com a
    // folga de um pixel que o contorno automático exige.
    coluna(yi(27) + ch, yh(22, 27), (t) => ({ c: X(17 + t), w: X(8) - X(2) * t }), ramp(body, -1), { topo: 1 });
    px(xi(19), yi(26) + ch, xi(2), 2, '#201a16');                  // tromba
    px(xi(14), yi(23) + ch, xi(6), 1, '#ebe3cf');                  // linha dos dentes
    px(xi(15), yi(22) + ch, 1, 1, '#ffffff');
    px(xi(18), yi(22) + ch, 1, 1, '#ffffff');
    // Olho pequeno e recuado: olho grande num canídeo devolve a fofura.
    px(xi(12), yi(31) + ch, xi(3), 2, ramp(olho, -2));
    px(xi(12), yi(31) + ch, xi(2), 1, olho);

    // ORELHAS triangulares e eretas, a de trás um valor abaixo.
    orelha(kit, X(15), yi(33) + ch, yh(33, 39), X(5), dark, ramp(pele, -2));
    orelha(kit, X(10), yi(33) + ch, yh(33, 38), X(5), ramp(dark, -1), ramp(pele, -3));

    // Cauda: nasce DENTRO do quarto traseiro. Uma cauda que não toca o corpo
    // sai como um risco preto solto depois do contorno de `sheet.js`.
    coluna(yi(29) + ch, yh(21, 29), (t) => ({ c: X(-15 - 4 * t), w: X(6) - X(2) * t }), fur, { topo: 1 });
    return;
  }

  // ---- de frente e de costas: peito estreito, cernelha atrás da cabeça ----
  const back = dir === 'back';

  for (const s of [-1, 1]) {
    const cor = s < 0 ? dark : ramp(dark, -2);
    coluna(yi(19), yh(0, 19), (t) => ({ c: X(s * 8), w: X(6) - X(1.5) * t }), cor, { topo: 0 });
    volume(xi(s * 8 - 3), yi(3), xi(7), yh(0, 3), ramp(cor, -1), { topo: 1 });
    px(xi(s * 8 - 3), -1, xi(7), 1, ramp(cor, -4));
  }

  // Tronco: largo em cima, afunilando para a barriga.
  const troncoY = yi(30);
  const troncoH = yh(16, 30);
  coluna(troncoY, troncoH, (t) => ({ c: 0, w: X(21) - X(8) * t }), body, { topo: 1 });
  contato(xi(-7), troncoY + troncoH - 1, xi(14), body);

  // Peitoral: a bandeira clara do peito, uma FAIXA estreita que afina até
  // sumir entre as patas. Larga, vira uma cunha clara chapada no meio da
  // figura — era o que estava acontecendo.
  coluna(yi(24), yh(15, 24), (t) => ({ c: 0, w: X(8) - X(5) * t }), fur, { topo: 1 });

  // Cernelha: de frente é o bloco que sobe ATRÁS da cabeça, e tem de ser mais
  // largo que ela — é o que dá ombro ao bicho.
  coluna(yi(32), yh(27, 32), (t) => ({ c: 0, w: X(17) - X(2) * t }), fur, { topo: 1 });

  // CRÂNIO: mais estreito que a cernelha e que o tronco. Igualar as três
  // larguras é o que transformava o lobo de frente numa caixa única.
  coluna(yi(36), yh(26, 36), (t) => ({ c: 0, w: X(13) - X(4) * t }), body, { topo: 1 });
  // Sombra de contato sob o queixo: é ela que descola a cabeça do peito. Sem
  // ela as duas massas, da mesma cor, fundem numa só.
  contato(xi(-4), yi(26), xi(9), body);

  // FOCINHO: desce ABAIXO da linha do crânio, afina e vem num valor mais
  // escuro — de frente é a única coisa que diz que a cabeça aponta para o
  // jogador em vez de ser mais um bloco de tronco.
  coluna(yi(28), yh(19, 28), (t) => ({ c: 0, w: X(8) - X(4) * t }), ramp(body, -2), { topo: 1 });

  if (!back) {
    px(xi(-2), yi(21), xi(4), 2, '#201a16');                       // tromba
    // Linha da boca em VALOR ESCURO, não em marfim: a barra branca de dentes
    // que estava aqui lia como focinheira.
    px(xi(-2), yi(19), xi(4), 1, ramp(body, -4));
    for (const s of [-1, 1]) {
      px(xi(s * 4) - (s < 0 ? xi(3) : 0), yi(33), xi(3), 2, ramp(olho, -2));
      px(xi(s * 4) - (s < 0 ? xi(2) : 0), yi(33), xi(2), 1, olho);
    }
  } else {
    // De costas, a crina desce em camadas pelo dorso e a cauda sobe no meio.
    for (let i = 0; i < 4; i++) px(xi(-7) + i, yi(30) + i * yh(0, 3), xi(14) - i * 2, 1, ramp(body, -3));
    coluna(yi(29), yh(21, 29), (t) => ({ c: X(1 + t), w: X(6) - X(2) * t }), fur, { topo: 1 });
  }

  orelha(kit, X(-5), yi(34), yh(34, 40), X(5), dark, ramp(pele, -2));
  orelha(kit, X(5), yi(34), yh(34, 40), X(5), ramp(dark, -1), ramp(pele, -3));
}
