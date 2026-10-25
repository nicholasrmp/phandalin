// Receitas visuais: o que cada arma, cada ataque natural e cada magia MOSTRAM.
//
// `fx.js` tem o vocabulário (arco, estocada, pilar, sopro, agarrão, ossos…).
// Aqui ficam as frases. Separar os dois significa que inventar uma magia nova é
// escrever uma receita de cinco linhas, sem tocar no motor de desenho.
//
// Cada receita devolve o atraso, em segundos, até o golpe "chegar" no alvo.
// `main.js` usa esse número para segurar o número de dano e o clarão.
//
// Uma receita de ataque devolve:
//
//   { delay, start, onHit, som, somInicio, faisca }
//
// `delay`     até o golpe chegar (o que `main.js` espera).
// `start`     o que acontece quando o golpe sai.
// `onHit`     o que acontece quando ele chega.
// `som`       som de impacto; `null` cala (quando `somInicio` já contém a batida).
// `somInicio` som de saída; `null` cala (gelatina e espectro não fazem zunido).
// `faisca`    `false` desliga a faísca laranja genérica, que mente em ácido,
//             teia e dreno — nada ali é estilhaço quente.
//
// Só `delay`, `start` e `onHit` são obrigatórios: receita antiga sem os três
// últimos campos continua se comportando exatamente como antes.

import { EFEITOS } from '../art/efeitos.js';
import {
  audio, hitSoundFor, spellSoundFor, naturalAttackSoundFor, deathSoundFor,
} from '../core/audio.js';
import { LOOKS } from '../art/looks.js';

/** Ângulo na TELA entre dois quadrados — já leva a rotação da câmera em conta. */
function screenAngle(board, from, to) {
  const a = board.centerF(from.x, from.y);
  const b = board.centerF(to.x, to.y);
  return Math.atan2(b.sy - a.sy, b.sx - a.sx);
}

/**
 * Ponto a caminho, em coordenadas CONTÍNUAS de quadrado.
 *
 * `centerF` aceita fração, então isto serve para nascer um efeito à frente da
 * figura em vez de no centro dos pés dela: o sopro do dragão sai da cabeça, o
 * stirge pousa antes do centro da vítima.
 */
function aFrente(from, to, quanto) {
  return { x: from.x + (to.x - from.x) * quanto, y: from.y + (to.y - from.y) * quanto };
}

/**
 * Paleta dos efeitos, por natureza.
 *
 * Existe como tabela, e não solta dentro das receitas, porque o problema aqui é
 * o MESMO do elenco: quatro verdes parecidos viram uma mancha só. Veneno é
 * grama saturada, ácido é amarelo-limão, limo é ocre — três coisas que, em
 * 55 px e em movimento, o jogador tem de separar de relance.
 */
const COR = {
  sangue: '#b03a3a',
  veneno: '#7bc94f',
  acido: '#d4e04a',
  limo: '#c8a84a',
  // Necrótico é ameixa, não lavanda: `energético` já é lavanda (#b98cff) e os
  // dois aparecem na mesma luta (mago contra wraith).
  necrotico: '#a33f84',
  necroticoFundo: '#43254f',
  // Paralisia é cinza-aço, não ciano: ciano é frio, e congelar não é travar.
  paralisia: '#9fb0c8',
  teia: '#e6e6ea',
  // O fogo VERDE da caveira candente: o mesmo `glow` do look dela.
  fogoVerde: '#cdf262',
  // O amarelo dos olhos das hastes do spectator (`metal` no look dele).
  hasteOcular: '#dcd37e',
  // Cor que o stirge rouba. Cinza azulado é o que sobra de uma figura sem sangue.
  semCor: '#9aa3b2',
  osso: '#ded2b4',
  poeira: '#d8c9a8',
};

// ---------------------------------------------------------------- armas

const WEAPON_VISUALS = {
  // Corte largo: espada, cimitarra, machado.
  sword: (board, { attacker, target, critical }) => {
    const ang = screenAngle(board, attacker.pos, target.pos);
    return {
      delay: 0.15,
      start: () => board.fx.lunge(attacker, target.pos, 0.26),
      onHit: () => {
        board.fx.slash(target.pos, { color: critical ? '#ffe14d' : '#ffffff', sweep: 1.1, radius: 26, width: critical ? 6 : 4 });
        board.fx.slash(target.pos, { color: '#ffffff', sweep: 0.8, radius: 18, width: 2, angle: ang + 0.4, dur: 0.18 });
      },
    };
  },

  // Estocada: dois toques rápidos, curtos. Adaga e espada curta.
  dagger: (board, { attacker, target }) => {
    const ang = screenAngle(board, attacker.pos, target.pos);
    return {
      delay: 0.12,
      start: () => board.fx.lunge(attacker, target.pos, 0.2, 0.5),
      onHit: () => {
        board.fx.stab(target.pos, { angle: ang, length: 28 });
        setTimeout(() => board.fx.stab(target.pos, { angle: ang + 0.3, length: 22, color: '#ffe9b0' }), 90);
      },
    };
  },

  // Pancada de cima para baixo: maça, bordão, coice. Sacode mais.
  mace: (board, { attacker, target, critical }) => {
    return {
      delay: 0.22,
      start: () => {
        board.fx.hop(attacker, { dur: 0.3, height: 18 });
        board.fx.lunge(attacker, target.pos, 0.3, 0.3);
      },
      onHit: () => {
        board.fx.smash(target.pos, { color: '#e8d6a8' });
        board.fx.slash(target.pos, { color: '#fff3d0', sweep: 0.5, radius: 20, width: 6, angle: -1.3 });
        board.bump(critical ? 0.9 : 0.55);
      },
    };
  },

  // Flecha com rastro.
  bow: (board, { attacker, target }) => {
    return {
      delay: 0.3,
      start: () => board.fx.projectile(attacker.pos, target.pos, { style: 'arrow', color: '#ffe9b0', dur: 0.3, arc: 0.7, trail: true }),
      onHit: () => board.fx.impact(target.pos, { color: '#ffd9a0', count: 7, spread: 34 }),
    };
  },

  // Azagaia girando.
  javelin: (board, { attacker, target }) => {
    return {
      delay: 0.36,
      start: () => board.fx.projectile(attacker.pos, target.pos, { style: 'javelin', color: '#cfd6de', dur: 0.36, arc: 1, spin: true }),
      onHit: () => board.fx.impact(target.pos, { color: '#d8c7a8', count: 8, spread: 40 }),
    };
  },

  // ---- ataques naturais ---------------------------------------------------

  /**
   * Mordida. Usa `bote`, não `lunge`: o perfil do bote sai disparado e recolhe
   * devagar, enquanto o da arma vai e volta no mesmo tempo. É essa assimetria
   * que faz a figura ler como bicho em vez de gente com uma arma invisível.
   */
  bite: (board, { attacker, target, critical }) => {
    return {
      delay: 0.12,
      som: 'bite',
      start: () => board.fx.bote(attacker, target.pos, {
        dur: 0.3, reach: 0.55, color: critical ? '#ffd24a' : '#ffffff',
      }),
      onHit: () => {
        board.fx.impact(target.pos, { color: COR.sangue, count: critical ? 14 : 8, spread: 36 });
        // A dentada não empurra muito: ela PRENDE. Recuo curto, senão lê como coice.
        board.fx.recuo(target, attacker.pos, { dist: 0.14, dur: 0.22 });
      },
    };
  },

  // Três riscos paralelos. O recuo é maior que o da mordida porque a garra
  // varre de lado em vez de fechar.
  claw: (board, { attacker, target, critical }) => {
    const ang = screenAngle(board, attacker.pos, target.pos);
    return {
      delay: 0.14,
      som: 'claw',
      start: () => board.fx.lunge(attacker, target.pos, 0.22, 0.45),
      onHit: () => {
        board.fx.claw(target.pos, { angle: ang - 0.4 });
        if (critical) board.fx.claw(target.pos, { angle: ang + 0.5, color: '#ffe14d', dur: 0.3 });
        board.fx.recuo(target, attacker.pos, { dist: 0.2 });
      },
    };
  },

  /**
   * Garra do ghoul. Mesma mecânica da garra, outra paleta: o ghoul fere com
   * mão de cadáver, e é a cor da ferida que avisa o jogador de que vem
   * paralisia — a paralisia em si é condição, e tem a receita dela em
   * `CONDICAO_VISUALS`. Mostrar o travamento aqui seria mentir nas vezes em
   * que o alvo passa no salvamento.
   */
  clawGhoul: (board, { attacker, target }) => {
    const ang = screenAngle(board, attacker.pos, target.pos);
    return {
      delay: 0.16,
      som: 'claw',
      start: () => board.fx.lunge(attacker, target.pos, 0.26, 0.42),
      onHit: () => {
        board.fx.claw(target.pos, { angle: ang - 0.3, color: COR.necrotico, dur: 0.32 });
        board.fx.impact(target.pos, { color: COR.necroticoFundo, count: 7, spread: 28 });
        board.fx.recuo(target, attacker.pos, { dist: 0.16 });
      },
      faisca: false,
    };
  },

  /**
   * Picada: agulha. Nada de arco de corte e nada de grave — stirge e aranha
   * entram com uma ponta só, e o `sting` do dicionário de som é exatamente
   * isso (sobe 900→1500 Hz sem corpo nenhum).
   */
  /**
   * FAGULHA da caveira candente.
   *
   * Antes ela atirava com `bow`: uma flecha dourada saindo de um arco
   * invisivel, marcada como provisoria na ficha. O que ela cospe e uma BRASA
   * do fogo que a envolve, e o fogo dela e VERDE -- a mesma inversao que o
   * look define (chama verde, orbitas vermelhas). Uma flecha amarela
   * contrariava as duas coisas.
   *
   * Sem sprite proprio: a brasa e um `orb` verde com rastro, e no impacto
   * entram os quadros de fogo que o jogo ja tem mais faiscas verdes. Zero
   * geracao, e o jogador le "cuspe de fogo" e nao "tiro de arco".
   */
  fagulha: (board, { attacker, target }) => {
    return {
      delay: 0.3,
      som: 'castFire',
      start: () => board.fx.projectile(attacker.pos, target.pos, {
        style: 'orb', color: COR.fogoVerde, dur: 0.3, arc: 0.35, trail: true,
      }),
      onHit: () => {
        // Os quadros `fogo-impacto` que o jogo ja tem sao LARANJA, e a brasa
        // que acabou de chegar e verde: visto no jogo, a troca de cor no meio
        // do golpe le como dois efeitos diferentes. Entao o impacto e todo
        // verde -- clarao, faiscas e o baque -- e fica coerente com a chama
        // que o cuspiu.
        board.fx.smash(target.pos, { color: COR.fogoVerde });
        board.fx.impact(target.pos, { color: COR.fogoVerde, count: 10, spread: 34 });
      },
      faisca: false,
    };
  },

  sting: (board, { attacker, target }) => {
    const ang = screenAngle(board, attacker.pos, target.pos);
    return {
      delay: 0.13,
      som: 'sting',
      start: () => board.fx.lunge(attacker, target.pos, 0.18, 0.5),
      onHit: () => {
        board.fx.stab(target.pos, { angle: ang, length: 18, color: '#ffe9b0', dur: 0.12 });
        board.fx.impact(target.pos, { color: COR.sangue, count: 4, spread: 18, dur: 0.3 });
      },
    };
  },

  /**
   * Coice. O `delay` é maior que o da maça porque o som `kick` conta a massa no
   * TEMPO — 300 ms de cauda grave — e o número de dano chegando antes disso
   * transforma casco em tapa.
   */
  kick: (board, { attacker, target, critical }) => {
    return {
      delay: 0.24,
      som: 'kick',
      start: () => {
        board.fx.hop(attacker, { dur: 0.26, height: 10 });
        board.fx.lunge(attacker, target.pos, 0.3, 0.34);
      },
      onHit: () => {
        board.fx.smash(target.pos, { color: COR.poeira });
        board.fx.recuo(target, attacker.pos, { dist: critical ? 0.5 : 0.34, dur: 0.3 });
        board.fx.tremor(critical ? 0.9 : 0.6);
      },
    };
  },

  /**
   * Investida de criatura Grande.
   *
   * `somInicio: 'charge'` e `som: null` porque o som da investida JÁ TEM o
   * impacto dentro dele, aos 360 ms. O `delay` de 0,42 s existe para casar com
   * esse instante: dois passos pesados, o grave rolando, e só então o número.
   * Trocar por um impacto novo no fim daria duas batidas para um golpe.
   */
  charge: (board, { attacker, target, critical }) => {
    return {
      delay: 0.42,
      somInicio: 'charge',
      som: null,
      start: () => board.fx.lunge(attacker, target.pos, 0.5, 0.6),
      onHit: () => {
        board.fx.smash(target.pos, { color: COR.poeira });
        board.fx.recuo(target, attacker.pos, { dist: critical ? 0.7 : 0.5, dur: 0.34 });
        board.fx.tremor(1);
        board.bump(0.9);
      },
    };
  },

  /**
   * Agarrão. O jogador precisa entender CONTENÇÃO antes de olhar o dano, por
   * isso o recuo é negativo: `recuo` empurra para longe de quem bateu, e o
   * sinal invertido puxa para dentro. É a leitura inversa de todo o resto do
   * combate, e é de propósito.
   */
  grab: (board, { attacker, target }) => {
    return {
      delay: 0.2,
      som: 'hitBlunt',
      start: () => board.fx.lunge(attacker, target.pos, 0.3, 0.4),
      onHit: () => {
        board.fx.agarrao(target.pos, { color: '#e8d6a8', dur: 0.42 });
        board.fx.recuo(target, attacker.pos, { dist: -0.22, dur: 0.34 });
        board.floatText(target.pos, 'agarrado!', '#ffc83a');
      },
      faisca: false,
    };
  },

  /** Batida de cauda: varre as pernas. Dragão e lobo atroz grande. */
  tail: (board, { attacker, target, critical }) => {
    const ang = screenAngle(board, attacker.pos, target.pos);
    return {
      delay: 0.2,
      som: 'hitBlunt',
      start: () => board.fx.lunge(attacker, target.pos, 0.3, 0.22),
      onHit: () => {
        board.fx.cauda(target.pos, { angle: ang, radius: 46, color: '#9ab06a' });
        board.fx.recuo(target, attacker.pos, { dist: 0.3, dur: 0.3 });
        board.bump(critical ? 0.7 : 0.45);
      },
    };
  },

  // ---- toque dos incorpóreos ----------------------------------------------

  /**
   * Toque necrótico do espectro: rápido e frio. Entra com `castNecrotic` no
   * impacto, não na saída — o espectro atravessa o ar sem nada a anunciar, e o
   * silêncio antes do toque é metade do susto.
   */
  /**
   * RAIO DAS HASTES do spectator.
   *
   * Como a Fagulha, antes era `bow`: uma flecha dourada de um arco invisivel.
   * O que ele dispara e um RAIO, e quem dispara sao as quatro hastes
   * oculares, nao a boca -- a animacao da folha mostra as hastes virando e
   * acendendo. Aqui vem a parte que a folha nao faz: o feixe atravessando o
   * tabuleiro ate o alvo.
   *
   * `beam` e instantaneo e nao tem arco, que e a diferenca de leitura entre
   * um RAIO e uma flecha. A cor e a necrotica do jogo, porque o dano e
   * necrotico, e o `piscar` no alvo e o mesmo sinal do Toque Necrotico: quem
   * ja viu um reconhece o outro.
   */
  raioDasHastes: (board, { attacker, target }) => {
    return {
      delay: 0.22,
      som: 'castNecrotic',
      somInicio: null,
      start: () => {
        // QUATRO FEIXES, UM POR HASTE -- nao um laser.
        //
        // A folha mostra as quatro hastes acendendo e disparando ao mesmo
        // tempo; um unico fio saindo do meio da criatura desmentia o desenho.
        // Aqui saem quatro, de quatro pontos em volta do corpo, e os quatro
        // convergem no alvo. As origens sao deslocamentos em CASAS, nao em
        // pixels: `centerF` aceita fracao, e no isometrico (+d,-d) anda para a
        // direita na tela, (+d,+d) para baixo -- entao os quatro viram uma
        // cruz em volta da criatura, que e onde as hastes estao.
        //
        // AMARELO na saida, NECROTICO na chegada. Quem dispara sao os olhos
        // das hastes, que sao amarelos; o violeta fica no alvo, onde o dano
        // necrotico acontece.
        //
        // Cada feixe tem corpo e MIOLO BRANCO: e a mesma leitura do clarao da
        // folha, branco no centro e amarelo em volta. `jagged: false` porque o
        // raio dele e reto -- o tremido fica para o Toque Necrotico.
        // `d` e o quanto as quatro saidas se afastam do centro. Com 0,32 e
        // feixes de 5 px os quatro encostavam e viravam UMA FAIXA; o leque so
        // aparecia colado na criatura. Mais abertura e feixes mais finos: as
        // quatro linhas ficam separadas quase ate o alvo, e la convergem,
        // porque o alvo e um so.
        const d = 0.5;
        const hastes = [
          { x: attacker.pos.x + d, y: attacker.pos.y - d },
          { x: attacker.pos.x - d, y: attacker.pos.y + d },
          { x: attacker.pos.x + d, y: attacker.pos.y + d },
          { x: attacker.pos.x - d, y: attacker.pos.y - d },
        ];
        // O BRILHO DOS OLHOS VEM DAQUI, e nao da folha. A folha mostra so a
        // criatura virando as hastes; quem acende as quatro pontas e este
        // clarao, um por haste. Assim a luz e a mesma nas oito direcoes.
        for (const de of hastes) board.fx.smash(de, { color: COR.hasteOcular });
        hastes.forEach((de, i) => {
          // Duracoes levemente diferentes: os quatro apagam fora de compasso,
          // e isso basta para o olho contar quatro em vez de ver um bloco.
          board.fx.beam(de, target.pos, { color: COR.hasteOcular, dur: 0.26 + i * 0.015, width: 3, jagged: false });
          board.fx.beam(de, target.pos, { color: '#fffbe8', dur: 0.22 + i * 0.015, width: 1, jagged: false });
        });
        board.fx.impact(attacker.pos, { color: COR.hasteOcular, count: 6, spread: 18, dur: 0.3 });
      },
      onHit: () => {
        // O feixe chega e ESTOURA: o mesmo amarelo da saida, para o jogador
        // ligar as duas pontas, e so entao o violeta do dano necrotico.
        board.fx.smash(target.pos, { color: COR.hasteOcular });
        board.fx.piscar(target, { color: COR.necrotico, dur: 0.4 });
        board.fx.impact(target.pos, { color: COR.necroticoFundo, count: 8, spread: 20, dur: 0.5 });
      },
      faisca: false,
    };
  },

  necroticTouch: (board, { attacker, target }) => {
    return {
      delay: 0.28,
      som: 'castNecrotic',
      somInicio: null,
      start: () => {
        board.fx.lunge(attacker, target.pos, 0.34, 0.5);
        board.fx.beam(attacker.pos, target.pos, { color: COR.necrotico, dur: 0.26, width: 2, jagged: true });
      },
      onHit: () => {
        board.fx.piscar(target, { color: COR.necrotico, dur: 0.4 });
        // Cinza, não estilhaço: o que sai da carne murchando cai, não voa.
        board.fx.impact(target.pos, { color: COR.necroticoFundo, count: 9, spread: 22, dur: 0.55 });
      },
      faisca: false,
    };
  },

  /**
   * Dreno de vida do wraith.
   *
   * O `delay` longo é a receita inteira: `castNecrotic` cresce de ganho por
   * 550 ms enquanto a altura CAI, que é o inverso exato de uma explosão, e é
   * por isso que soa como sugar. O número de dano tem de cair no topo dessa
   * rampa. Golpe que resolve em 0,2 s desperdiça o único som do jogo que anda
   * para dentro.
   */
  /**
   * Olhar Apodrecedor do vigia ciclopico: o olho ACENDE verde-amarelo (a cor
   * que so ele tem no elenco) e um raio da mesma cor vai ate o alvo; quem
   * falha no teste pisca no roxo necrotico e solta cinza que sobe -- podre.
   */
  rottingGaze: (board, { attacker, target }) => {
    return {
      delay: 0.45,
      somInicio: 'castNecrotic',
      som: null,
      start: () => {
        // O olho acende (quadros do OpenArt, `_referencias/efeitos/t-olhar`) e
        // o raio sai dele; o feixe e de codigo (a fileira de raio da folha saiu
        // na diagonal e o projetil gira supondo a direita).
        // Tudo no amarelo do olho convertido (#e8c35a, a cor da paleta): o
        // verde-amarelo do vigia nao existe na paleta e sumia no chao verde.
        // O feixe tem contorno escuro por baixo, como o resto da arte.
        board.fx.quadros(attacker.pos, 'apodrecer-olho', { fps: 10, altura: 38 });
        board.fx.piscar(attacker, { color: '#e8c35a', dur: 0.45 });
        board.fx.beam(attacker.pos, target.pos, { color: '#2a2430', dur: 0.4, width: 5, jagged: false });
        board.fx.beam(attacker.pos, target.pos, { color: '#e8c35a', dur: 0.4, width: 2, jagged: false });
      },
      onHit: () => {
        board.fx.quadros(target.pos, 'apodrecer-impacto', { fps: 12, sumir: 0.2 });
        board.fx.piscar(target, { color: COR.necrotico, dur: 0.5 });
      },
      faisca: false,
    };
  },

  lifeDrain: (board, { attacker, target }) => {
    return {
      delay: 0.55,
      somInicio: 'castNecrotic',
      som: null,
      start: () => {
        board.fx.beam(attacker.pos, target.pos, { color: COR.necrotico, dur: 0.5, width: 3, jagged: true });
        board.fx.piscar(target, { color: COR.necroticoFundo, dur: 0.55 });
      },
      onHit: () => {
        // A vida roubada volta para quem roubou: sem este trajeto de retorno,
        // dreno e toque viram o mesmo efeito com nomes diferentes.
        board.fx.projectile(target.pos, attacker.pos, {
          style: 'orb', color: COR.necrotico, dur: 0.34, arc: 0.5, trail: true,
        });
        setTimeout(() => board.fx.motes(attacker.pos, {
          color: COR.necrotico, count: 7, rise: 30, dur: 0.5,
        }), 340);
        board.fx.impact(target.pos, { color: COR.necroticoFundo, count: 10, spread: 26, dur: 0.6 });
      },
      faisca: false,
    };
  },

  // ---- limo, teia e sanguessuga -------------------------------------------

  /**
   * Ácido da gelatina (pseudópode).
   *
   * `somInicio: null` de propósito: a gelatina não tem membro que corte o ar.
   * Ela chega em silêncio e o primeiro som da cena é o ácido fervendo — é o que
   * justifica, no jogo de mesa, a coisa pegar o grupo de surpresa num corredor.
   *
   * A poça vem de `derreter` passando o QUADRADO em vez da criatura: sem `id`,
   * `derreter` desenha só a poça e não mexe na figura do alvo. Reuso de
   * propósito — escrever uma segunda poça seria duas verdades sobre o mesmo
   * líquido.
   */
  acid: (board, { attacker, target }) => {
    return {
      delay: 0.22,
      som: 'castAcid',
      somInicio: null,
      start: () => board.fx.lunge(attacker, target.pos, 0.34, 0.36),
      onHit: () => {
        board.fx.derreter(target.pos, { color: COR.limo, dur: 0.9 });
        board.fx.area([target.pos], { color: COR.acido, dur: 0.7 });
        // Bolhas subindo: o ácido continua trabalhando depois do toque.
        board.fx.motes(target.pos, { color: COR.acido, count: 9, rise: 26, dur: 0.8, spread: 16 });
        board.fx.piscar(target, { color: COR.acido, dur: 0.45 });
      },
      faisca: false,
    };
  },

  /**
   * Teia de aranha.
   *
   * Não existe primitiva de teia em `fx.js`. Três `slash` finos e LENTOS em
   * ângulos cruzados dão fios em vez de cortes: o que separa risco de fio é a
   * duração — corte aparece e some em 0,2 s, fio fica. O `agarrao` em cima
   * fecha a leitura de "preso", e é o mesmo sinal usado pelo agarrão de
   * criatura, o que ajuda o jogador a reconhecer a condição.
   */
  web: (board, { attacker, target }) => {
    return {
      delay: 0.36,
      som: 'castPoison',
      somInicio: 'hissSpider',
      // A bola de seda do OpenArt (`teia-projetil`) voa presa a um fio que
      // sai da aranha (`fio`); no alvo, a rede se abre e vira casulo.
      start: () => board.fx.projectile(attacker.pos, target.pos, {
        style: 'sprite', sprite: 'teia-projetil', fio: true, color: COR.teia, dur: 0.34, arc: 0.55, fps: 12,
      }),
      onHit: () => {
        board.fx.quadros(target.pos, 'teia-impacto', { fps: 9, sumir: 0.6 });
        board.fx.agarrao(target.pos, { color: COR.teia, dur: 0.5 });
        board.fx.area([target.pos], { color: COR.teia, dur: 0.9 });
        board.floatText(target.pos, 'preso na teia!', '#e6e6ea');
      },
      faisca: false,
    };
  },

  /**
   * Stirge grudando e sugando.
   *
   * `sugar` tira o bicho do quadrado dele e o põe POUSADO na vítima por mais de
   * um segundo — é o que torna o dano por turno plausível e o que explica por
   * que matar o stirge é urgente. O número de dano cai aos 0,3 s, com o bicho
   * já pousado, e não no fim: no fim ele está saindo, e dano na saída leria
   * como ele ter se soltado.
   */
  drain: (board, { attacker, target }) => {
    const dur = 1.2;
    return {
      delay: 0.3,
      som: 'sting',
      somInicio: 'screechStirge',
      start: () => {
        board.fx.sugar(attacker, target.pos, { dur, color: COR.sangue });
        perderCor(board, target, dur);
      },
      onHit: () => {
        board.fx.impact(target.pos, { color: COR.sangue, count: 5, spread: 16, dur: 0.35 });
        board.floatText(target.pos, 'sugando!', COR.sangue);
      },
      faisca: false,
    };
  },
};

/**
 * O alvo perde cor enquanto o stirge bebe.
 *
 * PROVISÓRIO, e a razão está em `fx.js`: o único tingimento de figura que
 * existe é o clarão branco de dano, e ele vem de `c.flash`, que o tabuleiro
 * controla. Sem uma primitiva de dessaturação, o mais honesto disponível é
 * pulsar um halo cinza-azulado sobre a figura — lê como cor sendo puxada para
 * fora, não como dano, porque é cinza e porque pulsa devagar. Ver relatório:
 * isto quer `fx.descorar(alvo, { dur })` e um `tint` de cor variável.
 */
function perderCor(board, alvo, dur) {
  const pulsos = Math.max(2, Math.round(dur / 0.4));
  for (let i = 0; i < pulsos; i++) {
    setTimeout(() => {
      board.fx.piscar(alvo, { color: COR.semCor, dur: 0.42 });
      board.fx.motes(alvo.pos, { color: COR.semCor, count: 3, rise: 22, dur: 0.5, spread: 12 });
    }, 220 + i * 400);
  }
}

/**
 * Apelidos de arte.
 *
 * Os blocos de monstro escrevem `art` em inglês (`'bite'`, `'sword'`), que é o
 * que já está no repositório, mas o elenco e as conversas são em português.
 * Aceitar as duas grafias custa uma tabela e evita a pior falha possível aqui:
 * um `art` com acento vira `sword` silenciosamente e o dragão dá uma
 * espadada.
 */
const ART_ALIAS = {
  espada: 'sword', cimitarra: 'sword', machado: 'sword', corte: 'sword',
  adaga: 'dagger', punhal: 'dagger', estocada: 'dagger',
  maca: 'mace', 'maça': 'mace', clava: 'mace', martelo: 'mace', bordao: 'mace', 'bordão': 'mace',
  arco: 'bow', besta: 'bow', flecha: 'bow',
  azagaia: 'javelin', lanca: 'javelin', 'lança': 'javelin', dardo: 'javelin',
  mordida: 'bite', presas: 'bite', dentada: 'bite', bico: 'bite',
  garra: 'claw', garras: 'claw', talao: 'claw', 'talão': 'claw',
  garraGhoul: 'clawGhoul', garraDeGhoul: 'clawGhoul',
  picada: 'sting', ferrao: 'sting', 'ferrão': 'sting', agulhada: 'sting',
  coice: 'kick', casco: 'kick', patada: 'kick',
  agarrao: 'grab', 'agarrão': 'grab', agarrar: 'grab',
  investida: 'charge', pisoteio: 'charge', tromba: 'charge', chifrada: 'charge',
  cauda: 'tail', rabada: 'tail',
  toqueNecrotico: 'necroticTouch', 'toqueNecrótico': 'necroticTouch', toque: 'necroticTouch',
  drenoDeVida: 'lifeDrain', dreno: 'lifeDrain',
  teia: 'web',
  fagulha: 'fagulha', brasa: 'fagulha',
  raio: 'raioDasHastes', raioDasHastes: 'raioDasHastes',
  acido: 'acid', 'ácido': 'acid', pseudopode: 'acid', 'pseudópode': 'acid',
  sugar: 'drain', sugada: 'drain', drenoDeSangue: 'drain',
};

/** Monstro sem `art` declarada: deduz pelo nome do ataque. */
function guessArt(name = '') {
  const n = name.toLowerCase();
  if (n.includes('dreno de vida')) return 'lifeDrain';
  if (n.includes('dreno de sangue') || n.includes('sugar')) return 'drain';
  if (n.includes('toque')) return 'necroticTouch';
  if (n.includes('teia')) return 'web';
  if (n.includes('fagulha') || n.includes('brasa')) return 'fagulha';
  if (n.includes('raio das hastes')) return 'raioDasHastes';
  if (n.includes('pseudóp') || n.includes('pseudop') || n.includes('ácido') || n.includes('acido')) return 'acid';
  if (n.includes('mordida') || n.includes('presa') || n.includes('bico')) return 'bite';
  if (n.includes('garra') || n.includes('talão') || n.includes('talao')) return 'claw';
  if (n.includes('picada') || n.includes('ferrão') || n.includes('ferrao')) return 'sting';
  if (n.includes('coice') || n.includes('casco')) return 'kick';
  if (n.includes('investida') || n.includes('pisoteio') || n.includes('tromba')) return 'charge';
  if (n.includes('agarr')) return 'grab';
  if (n.includes('cauda')) return 'tail';
  if (n.includes('arco') || n.includes('besta')) return 'bow';
  if (n.includes('azagaia') || n.includes('lança') || n.includes('dardo')) return 'javelin';
  if (n.includes('maça') || n.includes('clava') || n.includes('martelo')) return 'mace';
  if (n.includes('adaga') || n.includes('punhal')) return 'dagger';
  return 'sword';
}

/** Artes que este arquivo sabe desenhar. Serve de referência para `monsters.js`. */
// O domo de proteção do tamanho de quem protege: baixo e largo o bastante para
// ler como bolha, alto o bastante para a cabeça caber (as cabeças ficam a
// ~56–62 px). Grande/Enorme crescem com a pegada.
/** Raio, em px, de uma esfera de zona: a casa mais longe do centro (~45 px por casa), em degraus de 8. */
const raioDeEsferaPx = (casas, centro) => {
  const m = Math.max(0, ...casas.map((t) => Math.hypot(t.x - centro.x, t.y - centro.y))) + 0.5;
  return Math.max(16, 8 * Math.round((m * 45) / 8));
};
const domoDe = (t) => {
  const f = t.pos.f ?? 1;
  if (f > 1) return { raio: 32 * f + 4, altura: 4 * Math.round((62 * (1 + (f - 1) * 0.4) + 10) / 4) };
  const pequeno = t.size === 'pequeno' || /halfling|pequenin|gnom/i.test(`${t.ancestry ?? ''} ${t.raca ?? ''}`);
  return pequeno ? { raio: 30, altura: 56 } : { raio: 36, altura: 68 };
};

export const ARTES = Object.freeze(Object.keys(WEAPON_VISUALS));

/**
 * Toca som e animação de um ataque com arma ou ataque natural.
 * @returns {number} atraso até o impacto, em segundos
 */
export function playWeaponVisual(board, ev, { startDelay = 0 } = {}) {
  const pedida = ev.art ?? guessArt(ev.weaponName);
  // `hasOwn`, e não `WEAPON_VISUALS[x]`: um `art` chamado "constructor" acha
  // função no protótipo do Object e o golpe sai sem desenho nenhum.
  const art = Object.hasOwn(WEAPON_VISUALS, pedida) ? pedida
    : ART_ALIAS[pedida] ?? guessArt(ev.weaponName);
  const recipe = WEAPON_VISUALS[art] ?? WEAPON_VISUALS.sword;
  const { delay, start, onHit, som, somInicio, faisca = true } = recipe(board, ev);

  // `startDelay` espera a caminhada terminar: sem isso, quem anda e ataca no
  // mesmo turno desfere o golpe enquanto ainda está no meio do caminho.
  setTimeout(() => {
    // `undefined` é "não opinei, use o zunido"; `null` é "cale a boca", que é o
    // que a gelatina e o espectro pedem.
    const abertura = somInicio === undefined ? 'swing' : somInicio;
    if (abertura) audio.play(abertura);
    start?.();
  }, startDelay * 1000);

  setTimeout(() => {
    if (!ev.hit) {
      // Acao por teste (o olhar): quem nao foi atingido RESISTIU, nao "errou".
      board.floatText(ev.target.pos, ev.teste ? 'resistiu' : 'errou', '#9aa3b2');
      audio.play('miss');
      return;
    }
    onHit();
    if (faisca) {
      board.fx.impact(ev.target.pos, {
        color: ev.critical ? '#ffd24a' : '#ff9a6a',
        count: ev.critical ? 16 : 8,
        spread: ev.critical ? 68 : 44,
      });
    }
    board.bump(ev.critical ? 0.65 : 0.3);
    // Ordem de decisão: crítico manda sempre; depois a receita, que conhece o
    // golpe; depois o nome do ataque natural; e por último o tipo de dano, que
    // é a resposta certa só para arma empunhada.
    const batida = ev.critical ? 'critical'
      : som !== undefined ? som
        : naturalAttackSoundFor(ev.weaponName) ?? hitSoundFor(ev.damageType);
    if (batida) audio.play(batida);
    if (ev.sneak) board.floatText(ev.target.pos, 'furtivo!', '#c7b4ff');
    if (ev.martial) board.floatText(ev.target.pos, 'marcial!', '#ff9a4a');
  }, (startDelay + delay) * 1000);

  return startDelay + delay;
}

// ---------------------------------------------------------------- magias

/** O meio de um conjunto de casas (posição fracionária: o desenho aceita). */
/** Distância em casas (a maior das duas) entre dois quadrados. */
function distanciaDe(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function centroDe(casas) {
  return {
    x: casas.reduce((a, t) => a + t.x, 0) / casas.length,
    y: casas.reduce((a, t) => a + t.y, 0) / casas.length,
  };
}

const SPELL_VISUALS = {
  // AS ANIMAÇÕES DE QUADROS (`board.fx.quadros`, projétil `style: 'sprite'`)
  // vêm das folhas do OpenArt em _referencias/efeitos/, convertidas por
  // src/dev/importar-efeitos.py. As partículas que sobram aqui são tempero.

  // Luz do céu desabando sobre o alvo.
  chamaSagrada: (board, { dest }) => {
    // A base da coluna toca o chão (a figura tem 64 px; o centro a 30 px).
    board.fx.quadros(dest, 'luz-coluna', { fps: 14, altura: 30 });
    return 0.26;
  },

  // A bola com cauda de chamas voa girada na direção do alvo e explode em
  // labareda e fumaça.
  raioDeFogo: (board, { caster, dest }) => {
    const dur = 0.42;
    board.fx.projectile(caster.pos, dest, { style: 'sprite', sprite: 'fogo-projetil', dur, arc: 0.3 });
    setTimeout(() => board.fx.quadros(dest, 'fogo-impacto', { fps: 14 }), dur * 1000);
    return dur;
  },

  // Lasca de gelo que estoura em cristais.
  raioDeGelo: (board, { caster, dest }) => {
    const dur = 0.38;
    board.fx.projectile(caster.pos, dest, { style: 'sprite', sprite: 'gelo-projetil', dur, arc: 0.15 });
    setTimeout(() => board.fx.quadros(dest, 'gelo-impacto', { fps: 12 }), dur * 1000);
    return dur;
  },

  // Os dardos saem em sequência, cada um para o alvo que o jogador escolheu,
  // e estouram em anel violeta.
  misselMagico: (board, { caster, dest, dardos }) => {
    const alvos = dardos?.length ? dardos.map((t) => t.pos) : [dest];
    const dur = 0.3;
    alvos.forEach((alvo, i) => {
      setTimeout(() => {
        board.fx.projectile(caster.pos, alvo, { style: 'sprite', sprite: 'arcano-projetil', dur, arc: 0.9 + (i % 3) * 0.25 });
        setTimeout(() => board.fx.quadros(alvo, 'arcano-impacto', { fps: 16 }), dur * 1000);
      }, i * 110);
    });
    return dur + (alvos.length - 1) * 0.11;
  },

  // Lança de luz e estrela dourada no impacto.
  raioGuiado: (board, { caster, dest }) => {
    const dur = 0.36;
    board.fx.projectile(caster.pos, dest, { style: 'sprite', sprite: 'luz-projetil', dur, arc: 0.2 });
    setTimeout(() => board.fx.quadros(dest, 'luz-impacto', { fps: 14 }), dur * 1000);
    return dur;
  },

  // Feixe doente: orbe verde borbulhando e nuvem de veneno.
  raioDeDoenca: (board, { caster, dest }) => {
    const dur = 0.4;
    board.fx.projectile(caster.pos, dest, { style: 'sprite', sprite: 'veneno-projetil', dur, arc: 0.25 });
    setTimeout(() => board.fx.quadros(dest, 'veneno-impacto', { fps: 12 }), dur * 1000);
    return dur;
  },

  // A mão espectral aparece NO alvo, aperta e some; o estouro necrótico
  // (partículas, abaixo) vem no aperto.
  toqueArrepiante: (board, { dest }) => {
    board.fx.quadros(dest, 'necrotico-mao', { fps: 10 });
    return 0.36;
  },

  // Infligir Ferimentos é de toque: o clérigo avança e a mão necrótica aperta.
  infligirFerimentos: (board, { caster, dest }) => {
    board.fx.lunge(caster, dest, 0.2);
    board.fx.quadros(dest, 'necrotico-mao', { fps: 8 });
    return 0.25;
  },

  // Cone de fogo: as chamas acendem de perto para longe, uma por casa.
  maosFlamejantes: (board, { caster, dest, areaTiles }) => {
    const tiles = areaTiles ?? [dest];
    for (const t of tiles) {
      const d = Math.max(Math.abs(t.x - caster.pos.x), Math.abs(t.y - caster.pos.y));
      setTimeout(() => board.fx.quadros(t, 'fogo-chama', { fps: 14, altura: 18 }), d * 70);
    }
    return 0.22;
  },

  // Um estrondo só, no meio do cubo, e a onda saindo do conjurador. Uma onda
  // por casa virava nove anéis sobrepostos que escondiam quem foi empurrado.
  ondaTrovejante: (board, { caster, dest, areaTiles }) => {
    board.fx.ring(caster.pos, { color: '#e8eef5', radius: 90, dur: 0.45, width: 3 });
    board.fx.quadros(centroDe(areaTiles ?? [dest]), 'trovao-onda', { fps: 14, altura: 16 });
    board.bump(0.35);
    return 0.2;
  },

  // Névoa violeta derramando sobre a área.
  sono: (board, { areaTiles, dest }) => {
    // Uma nuvem a cada 3 casas nos dois eixos, a partir do centro: cobre a
    // área sem empilhar névoa sobre névoa (o `i % 3` da lista fazia faixas).
    const tiles = (areaTiles ?? [dest]).filter((t) => (t.x - dest.x) % 3 === 0 && (t.y - dest.y) % 3 === 0);
    tiles.forEach((t, i) => {
      setTimeout(() => board.fx.quadros(t, 'sono-nevoa', { fps: 9, altura: 20, sumir: 0.3 }), i * 70);
    });
    return 0.3;
  },

  // Poça escorregadia que se espalha no chão, uma só, no meio do quadrado;
  // depois o chão escuro da zona (board.js) fica enquanto a magia durar.
  graxa: (board, { areaTiles, dest }) => {
    board.fx.quadros(centroDe(areaTiles ?? [dest]), 'graxa', { fps: 8, altura: 4, sumir: 0.5 });
    return 0.3;
  },

  // Cura por toque e à distância: luz verde subindo do ferido.
  curarFerimentos: (board, { dest }) => {
    board.fx.quadros(dest, 'cura', { fps: 10 });
    return 0.14;
  },
  palavraCurativa: (board, { caster, dest }) => {
    board.fx.beam(caster.pos, dest, { color: '#9ff0b8', dur: 0.3, width: 2, jagged: false });
    setTimeout(() => board.fx.quadros(dest, 'cura', { fps: 10 }), 180);
    return 0.2;
  },

  // Bênção: auréola dourada descendo sobre cada abençoado.
  bencao: (board, { caster }, targets = []) => {
    board.fx.ring(caster.pos, { color: '#ffe9a8', radius: 72, dur: 0.75, width: 2 });
    targets.forEach((t, i) => setTimeout(() => board.fx.quadros(t.pos, 'bencao', { fps: 10, altura: 48 }), i * 90));
    return 0;
  },

  // Perdição: correntes violeta em cada alvo.
  perdicao: (board, _ctx, targets = []) => {
    targets.forEach((t, i) => setTimeout(() => board.fx.quadros(t.pos, 'maldicao', { fps: 10, altura: 40 }), i * 90));
    return 0;
  },

  // Proteções: no próprio alvo.
  armaduraArcana: (board, { dest }) => {
    board.fx.quadros(dest, 'armadura-arcana', { fps: 10 });
    return 0;
  },
  vidaFalsa: (board, { caster }) => {
    board.fx.quadros(caster.pos, 'vida-falsa', { fps: 10 });
    return 0;
  },
  resistencia: (board, _ctx, targets = []) => {
    for (const t of targets) board.fx.quadros(t.pos, 'resistencia', { fps: 10 });
    return 0;
  },
  pouparOsMoribundos: (board, { dest }) => {
    board.fx.quadros(dest, 'estabilizar', { fps: 9, altura: 20 });
    return 0;
  },

  // ---- truques e 1º círculo dos heróis ---------------------------------------

  // Rajada Mística: um raio de força por raio, cada um ao seu alvo.
  rajadaMistica: (board, { caster, dest, dardos }) => {
    const alvos = dardos?.length ? dardos.map((t) => t.pos) : [dest];
    const dur = 0.26;
    alvos.forEach((alvo, i) => setTimeout(() => {
      board.fx.projectile(caster.pos, alvo, { style: 'sprite', sprite: 'arcano-projetil', dur, arc: 0.1 });
      setTimeout(() => board.fx.quadros(alvo, 'arcano-impacto', { fps: 16 }), dur * 1000);
    }, i * 110));
    return dur + (alvos.length - 1) * 0.11;
  },
  zombariaViciosa: (board, { dest }) => {
    board.fx.quadros(dest, 'psiquico', { fps: 10, altura: 40, sumir: 0.2 });
    return 0.1;
  },
  produzirChama: (board, { caster, dest }) => {
    const dur = 0.32;
    board.fx.projectile(caster.pos, dest, { style: 'sprite', sprite: 'fogo-projetil', dur, arc: 0.45 });
    setTimeout(() => board.fx.quadros(dest, 'fogo-impacto', { fps: 16 }), dur * 1000);
    return dur;
  },
  chicoteDeEspinhos: (board, { caster, dest }) => {
    board.fx.beam(caster.pos, dest, { color: '#6fc07a', dur: 0.3, width: 3, jagged: true });
    // O cipó vem do lado de quem lançou; aos 250 ms, o estalo.
    board.fx.quadros(dest, 'chicote-espinhos', { fps: 12, altura: 24, sumir: 0.15, de: caster.pos });
    setTimeout(() => board.fx.impact(dest, { color: '#6fc07a', count: 6, spread: 24 }), 250);
    return 0.15;
  },
  shillelagh: (board, { caster }) => {
    board.fx.motes(caster.pos, { color: '#6ee89a', count: 10, rise: 34 });
    return 0;
  },
  toqueChocante: (board, { caster, dest }) => {
    board.fx.lunge(caster, dest, 0.18);
    board.fx.quadros(dest, 'eletrico-faisca', { fps: 18, altura: 26 });
    return 0.15;
  },
  respingoAcido: (board, { dest, dardos }) => {
    for (const t of dardos?.length ? dardos.map((x) => x.pos) : [dest]) board.fx.quadros(t, 'acido-impacto', { fps: 16 });
    return 0.1;
  },
  borrifoVenenoso: (board, { dest }) => {
    board.fx.quadros(dest, 'veneno-impacto', { fps: 14 });
    return 0.1;
  },
  protecaoContraLaminas: (board, { caster }) => {
    board.fx.quadros(caster.pos, 'resistencia', { fps: 12 });
    return 0;
  },
  bruxaria: (board, { dest }) => {
    board.fx.quadros(dest, 'maldicao', { fps: 12, altura: 40 });
    return 0;
  },
  marcaDoCacador: (board, { dest }) => {
    board.fx.ring(dest, { color: '#6ee89a', radius: 42, dur: 0.7, width: 3 });
    board.fx.motes(dest, { color: '#6ee89a', count: 12, rise: 20 });
    return 0;
  },
  repreensaoInfernal: (board, { dest }) => {
    board.fx.quadros(dest, 'fogo-chama', { fps: 14, altura: 18 });
    board.fx.quadros(dest, 'fogo-impacto', { fps: 14 });
    return 0.1;
  },
  escudoArcano: (board, { caster }) => {
    board.fx.quadros(caster.pos, 'armadura-arcana', { fps: 8 });
    return 0;
  },
  bracosDeHadar: (board, { caster, areaTiles }) => {
    board.fx.area(areaTiles ?? [], { color: COR.necrotico, dur: 0.6 });
    for (const t of (areaTiles ?? []).filter((_, i) => i % 3 === 0).slice(0, 8)) board.fx.quadros(t, 'necrotico-mao', { fps: 12 });
    board.fx.ring(caster.pos, { color: '#a579d8', radius: 70, dur: 0.5, width: 3 });
    return 0.2;
  },
  armaduraDeAgathys: (board, { caster }) => {
    board.fx.quadros(caster.pos, 'gelo-impacto', { fps: 14 });
    return 0;
  },
  risoHisterico: (board, { dest }) => {
    board.fx.quadros(dest, 'psiquico', { fps: 10, altura: 40, sumir: 0.2 });
    board.fx.motes(dest, { color: '#e8c35a', count: 14, rise: 30 });
    return 0.1;
  },
  sussurrosDissonantes: (board, { dest }) => {
    board.fx.quadros(dest, 'psiquico', { fps: 10, altura: 40, sumir: 0.2 });
    board.fx.ring(dest, { color: '#a579d8', radius: 48, dur: 0.6, width: 3 });
    return 0.1;
  },
  heroismo: (board, _ctx, alvos = []) => {
    for (const t of alvos) board.fx.quadros(t.pos, 'bencao', { fps: 10, altura: 48 });
    return 0;
  },
  fogoDasFadas: (board, { areaTiles, dest }) => {
    const cores = ['#a579d8', '#6ea8e8', '#6ee89a'];
    (areaTiles ?? [dest]).forEach((t, i) => board.fx.motes(t, { color: cores[i % 3], count: 2, rise: 16, dur: 0.9 }));
    board.fx.area(areaTiles ?? [dest], { color: '#a579d8', dur: 0.6 });
    return 0.2;
  },
  emaranhar: (board, { areaTiles, dest }) => {
    board.fx.area(areaTiles ?? [dest], { color: '#6ee89a', dur: 0.7 });
    (areaTiles ?? [dest]).filter((t) => (t.x + t.y) % 2 === 0).slice(0, 10)
      .forEach((t, i) => setTimeout(() => board.fx.quadros(t, 'vinhas', { fps: 10, altura: 18, sumir: 0.4 }), i * 50));
    return 0.2;
  },
  // Orbe Cromático: projétil e impacto do tipo que o motor escolhe (o que
  // mais fere o alvo), a mesma conta de `combat.js`.
  orbeCromatico: (board, { caster, dest, spell }) => {
    const alvo = board.enc.at(dest.x, dest.y);
    const tipo = alvo
      ? [...spell.tiposAEscolher].sort((a, b) => board.enc.danoPorTipo(alvo, 10, b, true) - board.enc.danoPorTipo(alvo, 10, a, true))[0]
      : spell.damageType;
    const como = {
      fogo: ['fogo-projetil', 'fogo-impacto'], frio: ['gelo-projetil', 'gelo-impacto'],
      veneno: ['veneno-projetil', 'veneno-impacto'], 'ácido': ['acido-projetil', 'acido-impacto'],
      'elétrico': ['arcano-projetil', 'eletrico-faisca'], trovejante: ['arcano-projetil', 'trovao-onda'],
    }[tipo] ?? ['arcano-projetil', 'arcano-impacto'];
    const dur = 0.34;
    board.fx.projectile(caster.pos, dest, { style: 'sprite', sprite: como[0], dur, arc: 0.3 });
    setTimeout(() => board.fx.quadros(dest, como[1], { fps: 14, altura: como[1] === 'trovao-onda' ? 16 : undefined }), dur * 1000);
    return dur;
  },
  // Comando: a palavra de ordem aparece sobre o alvo.
  comando: (board, _ctx, alvos = []) => {
    for (const t of alvos) {
      board.fx.glyph(t.pos, { text: '!', color: '#ffe9a8', size: 24, rise: 30 });
      board.fx.ring(t.pos, { color: '#ffe9a8', radius: 42, dur: 0.6, width: 3 });
    }
    return 0;
  },
  santuario: (board, _ctx, alvos = []) => {
    for (const t of alvos) {
      board.fx.domo(t.pos, { cor: 'ouro', id: t.id, ...domoDe(t) });
      board.fx.motes(t.pos, { color: '#e8c35a', count: 8, rise: 40, spread: 50 });
    }
    return 0;
  },
  escudoDaFe: (board, _ctx, alvos = []) => {
    // O domo, e o escudo lampejando ACIMA da cabeça (não no rosto).
    for (const t of alvos) {
      board.fx.domo(t.pos, { cor: 'ouro', id: t.id, ...domoDe(t) });
      board.fx.motes(t.pos, { color: '#e8c35a', count: 8, rise: 40, spread: 50 });
      // O escudo encosta no topo da bolha, como brasão dela; aos 300 ms, junto do lampejo.
      const alto = Math.max(74, domoDe(t).altura + 10);
      setTimeout(() => board.fx.quadros(t.pos, 'egide-escudo', { fps: 2, altura: alto, sumir: 0.3, entrar: 0.08 }), 300);
    }
    return 0;
  },
  favorDivino: (board, { caster }) => {
    board.fx.quadros(caster.pos, 'golpe-divino', { fps: 8, sumir: 0.25 });
    return 0;
  },
  golpeTrovejante: (board, { caster }) => {
    board.fx.motes(caster.pos, { color: '#e8eef5', count: 10, rise: 30 });
    return 0;
  },
  golpeAbrasador: (board, { caster }) => {
    board.fx.motes(caster.pos, { color: '#ff7a3a', count: 10, rise: 30 });
    return 0;
  },
  golpeColerico: (board, { caster }) => {
    board.fx.motes(caster.pos, { color: '#a579d8', count: 10, rise: 30 });
    return 0;
  },
  saraivadaDeEspinhos: (board, { caster }) => {
    board.fx.motes(caster.pos, { color: '#6ee89a', count: 10, rise: 30 });
    return 0;
  },
  raioDeBruxa: (board, { caster, dest }) => {
    board.fx.beam(caster.pos, dest, { color: '#bfe6ff', dur: 0.45, width: 3, jagged: true });
    board.fx.quadros(dest, 'eletrico-faisca', { fps: 16, altura: 22 });
    return 0.15;
  },
  recuoAcelerado: (board, { caster }) => {
    board.fx.motes(caster.pos, { color: '#e8eef5', count: 8, rise: 14, spread: 30 });
    return 0;
  },
  passosLargos: (board, _ctx, alvos = []) => {
    for (const t of alvos) board.fx.motes(t.pos, { color: '#e8eef5', count: 8, rise: 14 });
    return 0;
  },
  protecaoBemMal: (board, _ctx, alvos = []) => {
    for (const t of alvos) {
      board.fx.domo(t.pos, { cor: 'violeta', id: t.id, ...domoDe(t) });
      board.fx.motes(t.pos, { color: '#a579d8', count: 8, rise: 40, spread: 50 });
    }
    return 0;
  },

  borrifoDeCores: (board, { areaTiles, dest }) => {
    const cores = ['#e0553c', '#e8c35a', '#6ea8e8', '#a579d8', '#6ee89a'];
    (areaTiles ?? [dest]).forEach((t, i) => board.fx.motes(t, { color: cores[i % cores.length], count: 3, rise: 14, dur: 0.6 }));
    board.fx.area(areaTiles ?? [dest], { color: '#e8c35a', dur: 0.5 });
    return 0.15;
  },
  ataqueCerteiro: (board, { dest }) => {
    board.fx.ring(dest, { color: '#ffe9a8', radius: 40, dur: 0.5, width: 3 });
    return 0;
  },

  enfeiticarPessoa: (board, _ctx, alvos = []) => {
    for (const t of alvos) {
      board.fx.quadros(t.pos, 'psiquico', { fps: 10, altura: 40, sumir: 0.2 });
      board.fx.ring(t.pos, { color: '#e8a0c8', radius: 44, dur: 0.7, width: 3 });
    }
    return 0;
  },
  invisibilidade: (board, _ctx, alvos = []) => {
    for (const t of alvos) board.fx.quadros(t.pos, 'nevoa-prateada', { fps: 12, altura: 22 });
    return 0;
  },
  imagemEspelhada: (board, { caster }) => {
    board.fx.quadros(caster.pos, 'armadura-arcana', { fps: 14 });
    board.fx.motes(caster.pos, { color: '#a579d8', count: 10, rise: 20, spread: 40 });
    return 0;
  },
  crescimentoDeEspinhos: (board, { areaTiles, dest }) => {
    board.fx.area(areaTiles ?? [dest], { color: '#b0875a', dur: 0.7 });
    // Casas alternadas, espalhadas pela área inteira (não só as primeiras).
    const sel = (areaTiles ?? [dest]).filter((t) => (t.x + t.y) % 2 === 0);
    const passo = Math.max(1, Math.ceil(sel.length / 16));
    sel.filter((_, i) => i % passo === 0)
      .forEach((t, i) => setTimeout(() => board.fx.quadros(t, 'espinhos-chao', { fps: 8, altura: 10, sumir: 0.5 }), i * 40));
    return 0.2;
  },
  flechaAcida: (board, { caster, dest }) => {
    const dur = 0.36;
    board.fx.projectile(caster.pos, dest, { style: 'sprite', sprite: 'acido-projetil', dur, arc: 0.3 });
    setTimeout(() => board.fx.quadros(dest, 'acido-impacto', { fps: 14 }), dur * 1000);
    return dur;
  },
  velocidade: (board, _ctx, alvos = []) => {
    for (const t of alvos) {
      board.fx.quadros(t.pos, 'eletrico-faisca', { fps: 18, altura: 26 });
      board.fx.motes(t.pos, { color: '#6ea8e8', count: 10, rise: 24 });
    }
    return 0;
  },
  nuvemFetida: (board, { areaTiles, dest }) => {
    for (const t of (areaTiles ?? [dest]).filter((_, i) => i % 4 === 0).slice(0, 12)) board.fx.quadros(t, 'veneno-impacto', { fps: 10 });
    return 0.2;
  },
  farolDeEsperanca: (board, _ctx, alvos = []) => {
    for (const t of alvos) board.fx.quadros(t.pos, 'bencao', { fps: 10, altura: 48 });
    return 0;
  },

  // ---- 2º e 3º círculo -------------------------------------------------------

  peleDeArvore: (board, _ctx, alvos = []) => {
    for (const t of alvos) board.fx.motes(t.pos, { color: '#b0875a', count: 10, rise: 20 });
    return 0;
  },
  armaMagica: (board, _ctx, alvos = []) => {
    for (const t of alvos) board.fx.motes(t.pos, { color: '#a579d8', count: 10, rise: 26 });
    return 0;
  },
  golpeMarcante: (board, { caster }) => {
    board.fx.motes(caster.pos, { color: '#ffe9a8', count: 10, rise: 30 });
    return 0;
  },
  laminaFlamejante: (board, { caster, dest, reuso }) => {
    if (!reuso) {
      board.fx.motes(caster.pos, { color: '#ff7a3a', count: 10, rise: 24 });
      return 0;
    }
    board.fx.lunge(caster, dest, 0.2);
    board.fx.slash(dest, { color: '#ff7a3a', angle: -0.7, radius: 28, width: 5 });
    setTimeout(() => board.fx.quadros(dest, 'fogo-impacto', { fps: 16 }), 90);
    return 0.15;
  },
  calorNoMetal: (board, { dest }) => {
    board.fx.quadros(dest, 'fogo-chama', { fps: 12, altura: 26 });
    return 0.1;
  },
  raioDoEnfraquecimento: (board, { caster, dest }) => {
    board.fx.beam(caster.pos, dest, { color: '#a579d8', dur: 0.45, width: 4, jagged: false });
    board.fx.beam(caster.pos, dest, { color: '#2a2430', dur: 0.45, width: 2, jagged: false });
    setTimeout(() => board.fx.quadros(dest, 'necrotico-mao', { fps: 10 }), 150);
    return 0.2;
  },
  protecaoContraVeneno: (board, _ctx, alvos = []) => {
    for (const t of alvos) board.fx.quadros(t.pos, 'resistencia-verde', { fps: 10 });
    return 0;
  },
  nuvemDeAdagas: (board, { dest }) => {
    board.fx.slash(dest, { color: '#e8eef5', angle: -0.4, radius: 24 });
    board.fx.slash(dest, { color: '#aab6c6', angle: 0.6, radius: 20 });
    return 0.1;
  },
  raioLunar: (board, { dest }) => {
    board.fx.quadros(dest, 'luz-coluna-prata', { fps: 12, altura: 30 });
    return 0.2;
  },
  esferaFlamejante: (board, { dest }) => {
    board.fx.quadros(dest, 'fogo-impacto', { fps: 14 });
    return 0.1;
  },
  rogarMaldicao: (board, _ctx, alvos = []) => {
    for (const t of alvos) board.fx.quadros(t.pos, 'maldicao', { fps: 10, altura: 40 });
    return 0;
  },
  // A cor do anel diz contra qual energia (a do motor, guardada na condição).
  protecaoContraEnergia: (board, _ctx, alvos = []) => {
    for (const t of alvos) {
      const tipo = (t.conditions ?? []).find((c) => c.id === 'protegidoEnergia')?.data?.tipo;
      const efeito = { fogo: 'resistencia-fogo', 'ácido': 'resistencia-acido', trovejante: 'resistencia-trovao' }[tipo] ?? 'resistencia';
      board.fx.quadros(t.pos, efeito, { fps: 10 });
    }
    return 0;
  },
  tempestadeDeGranizo: (board, { areaTiles, dest }) => {
    (areaTiles ?? [dest]).filter((_, i) => i % 9 === 0).slice(0, 14)
      .forEach((t, i) => setTimeout(() => board.fx.quadros(t, 'gelo-impacto', { fps: 14 }), i * 50));
    return 0.3;
  },
  golpeCegante: (board, { caster }) => {
    board.fx.motes(caster.pos, { color: '#ffe9a8', count: 14, rise: 34 });
    return 0;
  },
  mantoDoCruzado: (board, { caster }) => {
    board.fx.ring(caster.pos, { color: '#ffe9a8', radius: 150, dur: 0.9, width: 2 });
    return 0;
  },
  armaElemental: (board, _ctx, alvos = []) => {
    for (const t of alvos) board.fx.motes(t.pos, { color: '#ff7a3a', count: 10, rise: 26 });
    return 0;
  },
  conjurarSaraivada: (board, { caster, areaTiles, dest }) => {
    (areaTiles ?? [dest]).filter((_, i) => i % 4 === 0).slice(0, 12).forEach((t, i) => setTimeout(() => {
      board.fx.projectile(caster.pos, t, { style: 'arrow', color: '#e8eef5', dur: 0.25, arc: 0.1 });
    }, i * 30));
    return 0.3;
  },
  auraDeVitalidade: (board, { caster, dest, reuso }) => {
    if (reuso) board.fx.quadros(dest, 'cura', { fps: 10 });
    else board.fx.ring(caster.pos, { color: '#9ff0b8', radius: 150, dur: 0.9, width: 2 });
    return 0;
  },
  //
  // As animações próprias vêm da folha h-magias23 (_referencias/efeitos/);
  // as outras reaproveitam efeitos do 1º círculo.

  // Três (ou mais) raios de fogo, cada um ao seu alvo, em sequência.
  raioArdente: (board, { caster, dest, dardos, spell, circulo }) => {
    const escolhidos = dardos?.length ? dardos.map((t) => t.pos) : [dest];
    const n = spell.raios + (spell.upcast?.raios ?? 0) * Math.max(0, (circulo ?? spell.level) - spell.level);
    const alvos = Array.from({ length: n }, (_, i) => escolhidos[i % escolhidos.length]);
    const dur = 0.3;
    alvos.forEach((alvo, i) => {
      setTimeout(() => {
        board.fx.projectile(caster.pos, alvo, { style: 'sprite', sprite: 'fogo-projetil', dur, arc: 0.15 + (i % 3) * 0.2 });
        setTimeout(() => board.fx.quadros(alvo, 'fogo-impacto', { fps: 16 }), dur * 1000);
      }, i * 120);
    });
    return dur + (alvos.length - 1) * 0.12;
  },

  // Estrondo numa esfera: a onda no centro e um anel que bate no chão.
  despedacar: (board, { dest }) => {
    board.fx.quadros(dest, 'trovao-onda', { fps: 14, altura: 16 });
    board.fx.ring(dest, { color: '#e8eef5', radius: 70, dur: 0.4, width: 3 });
    board.bump(0.45);
    return 0.15;
  },

  // A conta de fogo voa até o ponto e explode: labaredas pela área.
  bolaDeFogo: (board, { caster, dest, areaTiles }) => {
    const dur = 0.45;
    board.fx.projectile(caster.pos, dest, { style: 'sprite', sprite: 'fogo-projetil', dur, arc: 0.5 });
    // A explosão grande no centro (96 px, folha i-bola-arma) e estouros
    // menores em roda, até a borda da esfera: grande sem esticar o pixel.
    setTimeout(() => {
      board.fx.quadros(dest, 'bola-de-fogo', { fps: 10, altura: 30, sumir: 0.25 });
      const area = new Set((areaTiles ?? [dest]).map((t) => `${t.x},${t.y}`));
      const anel = [[-3, 0], [3, 0], [0, -3], [0, 3], [-2, -2], [2, 2], [2, -2], [-2, 2]]
        .map(([dx, dy]) => ({ x: dest.x + dx, y: dest.y + dy }))
        .filter((t) => area.has(`${t.x},${t.y}`));
      anel.forEach((t, i) => setTimeout(() => board.fx.quadros(t, 'fogo-impacto', { fps: 14, altura: 16 }), 160 + i * 45));
      const chamas = (areaTiles ?? []).filter((t) => (t.x + t.y) % 2 === 1).slice(0, 12);
      chamas.forEach((t, i) => setTimeout(() => board.fx.quadros(t, 'fogo-chama', { fps: 14, altura: 18 }), 200 + (i % 6) * 40));
      board.fx.tremor(0.6);
    }, dur * 1000);
    return dur + 0.1;
  },

  // A linha inteira acende de uma vez: o raio é um traço quebrado até a ponta.
  relampago: (board, { caster, dest, areaTiles }) => {
    const ponta = areaTiles?.length ? areaTiles[areaTiles.length - 1] : dest;
    board.fx.beam(caster.pos, ponta, { color: '#bfe6ff', dur: 0.4, width: 4, jagged: true });
    board.fx.beam(caster.pos, ponta, { color: '#ffffff', dur: 0.25, width: 2, jagged: true });
    (areaTiles ?? []).filter((_, i) => i % 2 === 0).slice(0, 10)
      .forEach((t, i) => setTimeout(() => board.fx.quadros(t, 'eletrico-faisca', { fps: 16, altura: 22 }), i * 25));
    board.bump(0.35);
    return 0.12;
  },

  // Correntes em cada alvo (a mesma da Perdição, um tom de prisão).
  // Correntes de aço em cada alvo (a da Perdição, em outra cor).
  imobilizarPessoa: (board, _ctx, alvos = []) => {
    alvos.forEach((t, i) => setTimeout(() => board.fx.quadros(t.pos, 'corrente-aco', { fps: 9, altura: 40 }), i * 90));
    return 0;
  },
  cegueiraSurdez: (board, _ctx, alvos = []) => {
    alvos.forEach((t, i) => setTimeout(() => board.fx.quadros(t.pos, 'nevoa-escura', { fps: 8, altura: 40 }), i * 90));
    return 0;
  },
  borrao: (board, { caster }) => {
    board.fx.quadros(caster.pos, 'armadura-arcana', { fps: 10 });
    board.fx.motes(caster.pos, { color: '#e8eef5', count: 8, rise: 30 });
    return 0;
  },
  ajuda: (board, _ctx, alvos = []) => {
    alvos.forEach((t, i) => setTimeout(() => board.fx.quadros(t.pos, 'bencao', { fps: 10, altura: 48 }), i * 90));
    return 0;
  },
  restauracaoMenor: (board, { dest }) => {
    board.fx.quadros(dest, 'cura', { fps: 10 });
    return 0;
  },
  // Some numa névoa e reaparece noutra.
  passoNebuloso: (board, { caster, dest }) => {
    board.fx.quadros(caster.pos, 'nevoa-prateada', { fps: 12, altura: 22 });
    setTimeout(() => board.fx.quadros(dest, 'nevoa-prateada', { fps: 12, altura: 22 }), 120);
    return 0;
  },
  // Teia: a área clareia (a teia fica desenhada no chão enquanto durar).
  teia: (board, { areaTiles, dest }) => {
    board.fx.area(areaTiles ?? [dest], { color: '#f4f0e4', dur: 0.6 });
    board.fx.quadros(centroDe(areaTiles ?? [dest]), 'teia', { fps: 8, altura: 2, sumir: 0.6 });
    return 0.2;
  },
  // A arma espectral desce e golpeia.
  // A arma espectral aparece ao lado do alvo, levanta, desce e bate. Entre um
  // golpe e outro ela fica flutuando ali (board.drawMagiasAtivas), e some
  // enquanto este ataque toca para não aparecer duas vezes.
  armaEspiritual: (board, { caster, dest }) => {
    const fps = 10;
    const n = EFEITOS['arma-ataque']?.quadros.length ?? 0;
    caster.armaOcultaAte = performance.now() + (n / fps) * 1000;
    const lado = { x: dest.x + 0.3, y: dest.y - 0.3 };
    board.fx.quadros(lado, 'arma-ataque', { fps, altura: 34 });
    return n ? (3 / fps) : 0.12;
  },
  palavraCurativaEmMassa: (board, _ctx, alvos = []) => {
    alvos.forEach((t, i) => setTimeout(() => board.fx.quadros(t.pos, 'cura', { fps: 10 }), i * 70));
    return 0.1;
  },
  // Um anel que se abre ao conjurar; depois, as chamas pequenas que giram em
  // volta do clérigo enquanto a concentração durar (board.drawMagiasAtivas).
  espiritosGuardioes: (board, { caster }) => {
    board.fx.ring(caster.pos, { color: '#ffe9a8', radius: 110, dur: 0.8, width: 2 });
    board.fx.motes(caster.pos, { color: '#ffe9a8', count: 10, rise: 30, spread: 60 });
    return 0;
  },
  revivificar: (board, { dest }) => {
    board.fx.quadros(dest, 'luz-coluna', { fps: 12, altura: 30 });
    setTimeout(() => board.fx.quadros(dest, 'cura', { fps: 10 }), 300);
    return 0.3;
  },
  lentidao: (board, _ctx, alvos = []) => {
    alvos.forEach((t, i) => setTimeout(() => board.fx.quadros(t.pos, 'nevoa-cinza', { fps: 5, altura: 24 }), i * 80));
    return 0;
  },
  medo: (board, { caster, areaTiles, dest }) => {
    board.fx.area(areaTiles ?? [dest], { color: COR.necrotico, dur: 0.6 });
    const pegos = [...new Set((areaTiles ?? [dest]).map((t) => board.enc.at(t.x, t.y)))]
      // O cone pega aliados também: o desenho mostra todos que o motor testa.
      .filter((c) => c && c !== caster).slice(0, 10);
    pegos.forEach((c, i) => setTimeout(() => board.fx.quadros(c.pos, 'medo-espectro', { fps: 6, altura: c.size === 'grande' || c.size === 'enorme' ? 100 : 70, sumir: 0.3 }), i * 80));
    return 0.25;
  },
  padraoHipnotico: (board, { areaTiles, dest }) => {
    const casas = areaTiles ?? [dest];
    const meio = centroDe(casas);
    casas.filter((t) => Math.round(t.x - meio.x) % 3 === 0 && Math.round(t.y - meio.y) % 3 === 0)
      .forEach((t, i) => setTimeout(() => board.fx.quadros(t, 'hipnose', { fps: 8, altura: 6, sumir: 0.4 }), i * 60));
    board.fx.area(casas, { color: '#a579d8', dur: 0.7 });
    return 0.2;
  },
  // ---- lote de escuridão, vento e raio ----------------------------------------

  // Um fio de fogo liga o conjurador ao duelista; o anel marca quem está preso a ele.
  dueloCompelido: (board, { caster }, alvos = []) => {
    for (const t of alvos) {
      board.fx.beam(caster.pos, t.pos, { color: '#ff9a7a', dur: 0.5, width: 2, jagged: false });
      board.fx.quadros(t.pos, 'duelo-sigilo', { fps: 9, altura: 62, sumir: 0.3 });
      board.fx.ring(t.pos, { color: '#ff9a7a', radius: 42, dur: 0.6, width: 3 });
    }
    return 0.1;
  },
  // O gesto verde do golpe preparado; as vinhas brotam no acerto (main.js, 'golpeMagico').
  golpeConstritor: (board, { caster }) => {
    board.fx.quadros(caster.pos, 'vinhas', { fps: 10, altura: 14, sumir: 0.3 });
    board.fx.motes(caster.pos, { color: '#6ee89a', count: 10, rise: 30 });
    return 0;
  },
  // Névoa: nuvens cinzentas pela esfera, brancas e baixas.
  nevoaObscurecente: (board, { areaTiles, dest }) => {
    const casas = areaTiles ?? [dest];
    board.fx.area(casas, { color: '#dfe6ec', dur: 0.8 });
    // Os tufos de névoa são a zona (desenhados pelo tabuleiro enquanto durar).
    casas.filter((t) => (t.x + t.y) % 3 === 0).slice(0, 4)
      .forEach((t, i) => setTimeout(() => board.fx.quadros(t, 'nevoa-nuvem', { fps: 9, altura: 16, sumir: 0.4 }), i * 60));
    return 0.2;
  },
  // Escuridão: o breu desce sobre a esfera, roxo-escuro, com fumaça de sombra.
  escuridao: (board, { areaTiles, dest }) => {
    const casas = areaTiles ?? [dest];
    board.fx.area(casas, { color: '#1c1428', dur: 0.9 });
    casas.filter((t) => (t.x + t.y) % 4 === 0).slice(0, 3)
      .forEach((t, i) => setTimeout(() => board.fx.quadros(t, 'escuridao-explosao', { fps: 9, altura: 16, sumir: 0.5 }), i * 50));
    return 0.2;
  },
  // Lufada: o vento corre pela linha, de quem conjurou até a ponta.
  lufadaDeVento: (board, { caster, dest, areaTiles }) => {
    const casas = areaTiles ?? [dest];
    const ponta = casas.length ? casas.reduce((a, t) => (distanciaDe(caster.pos, t) > distanciaDe(caster.pos, a) ? t : a), casas[0]) : dest;
    board.fx.sopro(caster.pos, ponta, { color: '#dfeaf2', dur: 1.0, spread: 0.12, tiles: casas });
    // Os motes correm a linha toda, cada casa um pouco depois da anterior:
    // o vento chega na ponta junto com o sopro, e não só na metade.
    casas.filter((_, i) => i % 3 === 0).forEach((t) => setTimeout(
      () => board.fx.quadros(t, 'lufada', { fps: 12, altura: 26 }),
      distanciaDe(caster.pos, t) * 40,
    ));
    return 0.3;
  },
  // Fome de Hadar: a esfera escurece e o frio sobe do chão.
  fomeDeHadar: (board, { areaTiles, dest }) => {
    const casas = areaTiles ?? [dest];
    board.fx.area(casas, { color: '#120c1e', dur: 1 });
    casas.filter((t) => (t.x + t.y) % 3 === 0).slice(0, 12)
      .forEach((t, i) => setTimeout(() => {
        board.fx.quadros(t, 'vazio-tentaculos', { fps: 9, altura: 14, sumir: 0.4 });
        board.fx.shards(t, { color: '#9fe0ff', count: 8, spread: 40 });
      }, i * 55));
    board.fx.tremor(0.3);
    return 0.25;
  },
  // Convocar Relâmpagos: o raio desce do céu sobre o ponto (a nuvem fica fora do quadro).
  convocarRelampagos: (board, { dest, areaTiles }) => {
    // O raio é um fio torto que vem de cima: o ponto do céu fica dez meias casas
    // acima do alvo NA TELA, qualquer que seja a rotação da câmera.
    // A nuvem se junta sobre o alvo e o raio (folha) cai dela.
    board.fx.quadros(dest, 'nuvem-tempestade', { fps: 10, altura: 118, sumir: 0.3 });
    setTimeout(() => {
      board.fx.quadros(dest, 'raio-queda', { fps: 14, altura: 40 });
      board.fx.ring(dest, { color: '#bfe6ff', radius: 60, dur: 0.6, width: 3 });
      board.bump(0.4);
    }, 350);
    (areaTiles ?? []).filter((t) => t.x !== dest.x || t.y !== dest.y).slice(0, 6)
      .forEach((t, i) => setTimeout(() => board.fx.quadros(t, 'eletrico-faisca', { fps: 16, altura: 12, sumir: 0.4 }), 450 + i * 30));
    return 0.5;
  },
  // Flecha Relampejante: o gesto; o raio e a explosão tocam no ataque ('golpeMagico').
  flechaRelampago: (board, { caster }) => {
    board.fx.motes(caster.pos, { color: '#bfe6ff', count: 10, rise: 30 });
    board.fx.quadros(caster.pos, 'eletrico-faisca', { fps: 14, altura: 30 });
    return 0;
  },
  // ---- lote 10: luz, silêncio, tamanho, elo, loucura, calma, cura em grupo, vento ----

  // Luz: o aliado acende como uma tocha clara; o halo e a coluna fina contam o raio de 6 m.
  luz: (board, _ctx, alvos = []) => {
    for (const t of alvos) {
      board.fx.quadros(t.pos, 'luz-orbe', { fps: 10, altura: 44, sumir: 0.3 });
      board.fx.halo(t.pos, { color: '#fff1b8', dur: 1.1, radius: 36 });
      // O brilho no chão: a luz que a criatura passa a emitir.
      board.fx.ring(t.pos, { color: '#fff1b8', radius: 40, dur: 1.1, width: 3 });
      board.fx.area([t.pos], { color: '#fff1b8', dur: 1.1 });
      board.fx.motes(t.pos, { color: '#fff1b8', count: 8, rise: 34, spread: 24 });
    }
    return 0;
  },
  // Orientação: um brilho azul-claro na testa e o "+1d4" que sobe.
  orientacao: (board, _ctx, alvos = []) => {
    for (const t of alvos) {
      board.fx.quadros(t.pos, 'orientacao-estrela', { fps: 8, altura: 54 });
      board.fx.glyph(t.pos, { text: '+1d4', color: '#9fe8ff', dur: 1.1, size: 16, rise: 44 });
    }
    return 0;
  },
  // Silêncio: o véu azul-gelo cai sobre a esfera, parado, e o som some (sem partícula viva).
  silencio: (board, { areaTiles, dest }) => {
    const casas = areaTiles ?? [dest];
    board.fx.area(casas, { color: '#9bb7d8', dur: 0.9 });
    board.fx.quadros(dest, 'silencio-onda', { fps: 8, altura: 10, sumir: 0.2 });
    board.fx.ring(dest, { color: '#c9defa', radius: 100, dur: 1.0, width: 2 });
    // A esfera de gelo em si é a zona (desenhada pelo tabuleiro enquanto durar).
    return 0.2;
  },
  // Aumentar sobe dourado e se alarga; Reduzir fecha em violeta, baixo, junto do chão.
  aumentarReduzir: (board, { caster, dest }) => {
    const alvo = board.enc.at(dest.x, dest.y);
    if (alvo && alvo.side === caster.side) {
      board.fx.quadros(dest, 'aumentar', { fps: 9, altura: 44, sumir: 0.2 });
      board.fx.motes(dest, { color: '#ffe9a8', count: 8, rise: 60, spread: 34 });
    } else {
      // Reduzir: um anel lavanda grande que se FECHA sobre o alvo.
      board.fx.quadros(dest, 'reduzir', { fps: 9, altura: 36, sumir: 0.2 });
      board.fx.motes(dest, { color: '#b9a4ee', count: 6, rise: 14, spread: 30, dur: 0.6 });
    }
    return 0.1;
  },
  // Elo de Proteção: um fio dourado liga os dois e a bolha fecha no protegido.
  eloDeProtecao: (board, { caster }, alvos = []) => {
    for (const t of alvos) {
      // O fio é prata-azulado e dura 1,5 s: não confunde com a bolha dourada do Escudo da Fé.
      board.fx.beam(caster.pos, t.pos, { color: '#d6e6ff', dur: 1.5, width: 3, jagged: false });
      board.fx.quadros(t.pos, 'elo-aneis', { fps: 8, altura: 18 });
      board.fx.domo(t.pos, { cor: 'ouro', id: t.id, ...domoDe(t) });
      board.fx.motes(t.pos, { color: '#e8c35a', count: 8, rise: 40, spread: 50 });
    }
    return 0;
  },
  // Coroa da Loucura: a coroa de maldição cai na cabeça e um fio liga o conjurador; manter é só o fio.
  coroaDaLoucura: (board, { caster, dest, reuso }, alvos = []) => {
    const quem = reuso ? [{ pos: dest }] : alvos;
    for (const t of quem) {
      board.fx.beam(caster.pos, t.pos, { color: '#e8a0c8', dur: reuso ? 0.5 : 0.9, width: 2, jagged: true, pulso: true });
      if (reuso) { board.fx.ring(t.pos, { color: '#e8a0c8', radius: 36, dur: 0.5, width: 2 }); continue; }
      board.fx.quadros(t.pos, 'coroa-loucura', { fps: 8, altura: 70, sumir: 0.3 });
      board.fx.ring(t.pos, { color: '#e8a0c8', radius: 44, dur: 0.7, width: 3 });
    }
    return 0.1;
  },
  // Acalmar Emoções: uma onda verde-água lenta, sem faísca.
  acalmarEmocoes: (board, { areaTiles, dest }) => {
    const casas = areaTiles ?? [dest];
    board.fx.area(casas, { color: '#8fd8c0', dur: 1.0 });
    board.fx.ring(dest, { color: '#bff0de', radius: 100, dur: 1.1, width: 2 });
    board.fx.quadros(dest, 'acalmar', { fps: 8, altura: 20, sumir: 0.2 });
    // Uma lente baixa e larga de água sobre a esfera, em vez de faíscas.
    const raio = raioDeEsferaPx(casas, dest);
    board.fx.domo(dest, { cor: 'agua', raio, altura: Math.max(8, 4 * Math.round(raio * 0.25 / 4)), dur: 1.6, op: Math.min(1, Math.max(0.35, 48 / raio)) });
    return 0.2;
  },
  // Oração de Cura (descanso): a luz desce sobre cada um.
  oracaoDeCura: (board, _ctx, alvos = []) => {
    // A coluna é VERDE com halo (a Luz é amarela e acende o alvo): cura em grupo.
    alvos.forEach((t, i) => setTimeout(() => {
      board.fx.pillar(t.pos, { color: '#9ff0b8', dur: 0.9, width: 26, height: 150 });
      board.fx.halo(t.pos, { color: '#9ff0b8', dur: 1.0, radius: 26 });
      board.fx.quadros(t.pos, 'cura', { fps: 10 });
    }, i * 90));
    return 0.1;
  },
  // Muralha de Vento: uma cortina de ar clara corre a linha, casa a casa, e o chão estremece.
  muralhaDeVento: (board, { areaTiles, dest }) => {
    const casas = areaTiles ?? [dest];
    board.fx.area(casas, { color: '#dff3ff', dur: 1.0 });
    // A parede em si é a zona (tiras de ar desenhadas pelo tabuleiro enquanto durar).
    casas.filter((_, i) => i % 2 === 0).forEach((t, i) => setTimeout(() => {
      board.fx.quadros(t, 'muralha-vento', { fps: 10, altura: 34, sumir: 0.2 });
    }, i * 60));
    return 0.3;
  },

  // ---- lote 11: ilusão, visão, atributo, sugestão, luz do dia, maldição, plantas, voo ----

  // Ilusão Menor: um tremor de violeta e a imagem brota (o objeto em si é a zona, desenhada em 2.5D).
  ilusaoMenor: (board, { caster, dest }) => {
    board.fx.motes(caster.pos, { color: '#c7b4ff', count: 6, rise: 28, spread: 16 });
    board.fx.beam(caster.pos, dest, { color: '#c7b4ff', dur: 0.35, width: 2, jagged: true });
    board.fx.ring(dest, { color: '#c7b4ff', radius: 30, dur: 0.6, width: 2 });
    board.fx.motes(dest, { color: '#e4daff', count: 10, rise: 34, spread: 18, dur: 0.8 });
    return 0.25;
  },
  // Visão no Escuro: dois brilhos verde-água nos olhos e um anel que se abre.
  visaoNoEscuro: (board, _ctx, alvos = []) => {
    for (const t of alvos) {
      board.fx.halo(t.pos, { color: '#8fe8d0', dur: 1.0, radius: 20 });
      board.fx.motes(t.pos, { color: '#ffffff', count: 2, rise: 6, spread: 6, dur: 0.9 });
      board.fx.ring(t.pos, { color: '#8fe8d0', radius: 50, dur: 0.9, width: 2 });
      board.fx.motes(t.pos, { color: '#bff5e6', count: 8, rise: 38, spread: 14, dur: 0.9 });
    }
    return 0;
  },
  // Aprimorar Atributo: a coluna tem a cor do atributo e a sigla sobe junto.
  aprimorarAtributo: (board, _ctx, alvos = []) => {
    const OPCAO = {
      touro: ['#e0784a', 'FOR'], gato: ['#e8c35a', 'DES'], urso: ['#b88a5a', 'CON'],
      aguia: ['#fff0b0', 'CAR'], raposa: ['#9fc6ff', 'INT'], coruja: ['#c7b4ff', 'SAB'],
    };
    for (const t of alvos) {
      const op = t.conditions?.find((c) => c.id === 'aprimorado')?.data?.opcao;
      const [cor, sigla] = OPCAO[op] ?? ['#ffe9a8', '+'];
      board.fx.quadros(t.pos, 'aprimorar', { fps: 9, altura: 38, sumir: 0.2 });
      board.fx.pillar(t.pos, { color: cor, dur: 0.8, width: 12, height: 80, alpha: 0.35 });
      board.fx.ring(t.pos, { color: cor, radius: 44, dur: 0.8, width: 3 });
      board.fx.glyph(t.pos, { text: sigla, color: cor, dur: 1.1, size: 16, rise: 50 });
    }
    return 0;
  },
  // Força Fantasmagórica: o fio psíquico entra na cabeça e a ilusão se acende.
  forcaFantasmagorica: (board, { caster, dest }) => {
    board.fx.beam(caster.pos, dest, { color: '#c08ae8', dur: 0.5, width: 2, jagged: true, pulso: true });
    board.fx.quadros(dest, 'fantasma', { fps: 8, altura: 62, sumir: 0.3 });
    board.fx.ring(dest, { color: '#c08ae8', radius: 48, dur: 0.7, width: 3 });
    return 0.2;
  },
  // Sugestão: ondas rosadas lentas e um "…" na testa, sem faísca.
  sugestao: (board, { caster, dest }) => {
    board.fx.beam(caster.pos, dest, { color: '#f0a8d0', dur: 0.8, width: 2, jagged: false, pulso: true });
    board.fx.ring(dest, { color: '#f0a8d0', radius: 50, dur: 0.9, width: 2 });
    board.fx.quadros(dest, 'sugestao-espiral', { fps: 7, altura: 66, sumir: 0.5 });
    board.fx.glyph(dest, { text: '…', color: '#f8d0e6', dur: 1.2, size: 32, rise: 36 });
    return 0.3;
  },
  // Luz do Dia: um clarão dourado sobe no ponto e se apaga num anel enorme (a esfera de luz fica na zona).
  luzDoDia: (board, { dest, areaTiles }) => {
    board.fx.quadros(dest, 'sol-clarao', { fps: 8, altura: 118, sumir: 0.3 });
    board.fx.ring(dest, { color: '#fff3c0', radius: 120, dur: 1.0, width: 3 });
    board.fx.ring(dest, { color: '#ffe9a8', radius: 60, dur: 0.7, width: 3 });
    board.fx.area((areaTiles ?? [dest]).filter((t) => (t.x + t.y) % 2 === 0).slice(0, 40), { color: '#fff3c0', dur: 0.9 });
    board.fx.motes(dest, { color: '#fffbe0', count: 16, rise: 80, spread: 40, dur: 1.0 });
    board.bump(0.25);
    return 0.3;
  },
  // Remover Maldição: a corrente violeta estala e sobe em cinzas claras.
  removerMaldicao: (board, _ctx, alvos = []) => {
    for (const t of alvos) {
      board.fx.quadros(t.pos, 'maldicao-quebra', { fps: 10, altura: 38, sumir: 0.2 });
      board.fx.shards(t.pos, { color: '#c7b4ff', count: 8, spread: 34 });
      board.fx.motes(t.pos, { color: '#fff3c0', count: 10, rise: 56, spread: 20 });
    }
    return 0;
  },
  // Crescer Plantas: o verde corre do ponto para fora, casa a casa (as moitas são a zona, em 2.5D).
  crescerPlantas: (board, { dest, areaTiles }) => {
    const casas = (areaTiles ?? [dest]).slice().sort((a, b) => Math.hypot(a.x - dest.x, a.y - dest.y) - Math.hypot(b.x - dest.x, b.y - dest.y));
    board.fx.ring(dest, { color: '#6ee89a', radius: 70, dur: 0.9, width: 3 });
    board.fx.motes(dest, { color: '#9ff0b8', count: 8, rise: 50, spread: 40, dur: 0.9 });
    casas.filter((t) => (t.x + t.y) % 3 === 0).slice(0, 6).forEach((t) => setTimeout(
      () => board.fx.quadros(t, 'plantas-brotar', { fps: 9, altura: 8, sumir: 0.3 }),
      distanciaDe(dest, t) * 60,
    ));
    return 0.3;
  },
  // Voo: o vento sobe em coluna e o alvo se solta do chão (a flutuação é desenhada pelo tabuleiro).
  voo: (board, _ctx, alvos = []) => {
    for (const t of alvos) {
      board.fx.quadros(t.pos, 'asas-voo', { fps: 10, altura: 42 });
      setTimeout(() => board.fx.quadros(t.pos, 'asas-voo', { fps: 10, altura: 42, sumir: 0.2 }), 600);
      board.fx.ring(t.pos, { color: '#dff3ff', radius: 48, dur: 0.8, width: 3 });
      board.fx.motes(t.pos, { color: '#ffffff', count: 12, rise: 60, spread: 26, dur: 0.9 });
      board.fx.hop(t, { dur: 0.5, height: 30 });
    }
    return 0;
  },

  // ---- lote 12: queda, frutos, imagens, flechas, rastro, aranha, contramágica, glifo ----

  // Queda Suave: uma coluna de ar clara sobe sob cada um, e penas brancas descem devagar.
  quedaSuave: (board, _ctx, alvos = []) => {
    for (const t of alvos) {
      board.fx.quadros(t.pos, 'penas-queda', { fps: 7, altura: 58, sumir: 0.2 });
      board.fx.ring(t.pos, { color: '#eef6ff', radius: 46, dur: 0.8, width: 3 });
    }
    return 0;
  },
  // Bom Fruto: frutinhas vermelhas e verdes brotam em volta da mochila.
  bomFruto: (board, { caster }) => {
    board.fx.ring(caster.pos, { color: '#9fe870', radius: 44, dur: 0.7, width: 2 });
    board.fx.quadros(caster.pos, 'bom-fruto', { fps: 6, altura: 34, sumir: 0.5 });
    board.fx.motes(caster.pos, { color: '#9fe870', count: 6, rise: 38, spread: 22, dur: 0.9 });
    return 0.2;
  },
  // Imagem Silenciosa: a mesma bruma violeta da Ilusão Menor, em todas as casas (a imagem em si é a zona, em 2.5D).
  imagemSilenciosa: (board, { caster, dest, areaTiles }) => {
    board.fx.motes(caster.pos, { color: '#c7b4ff', count: 6, rise: 28, spread: 16 });
    board.fx.beam(caster.pos, dest, { color: '#b8d4ff', dur: 0.35, width: 2, jagged: false });
    board.fx.area((areaTiles ?? [dest]).filter((t) => (t.x + t.y) % 2 === 0), { color: '#c7b4ff', dur: 0.7 });
    board.fx.ring(dest, { color: '#c7b4ff', radius: 60, dur: 0.6, width: 2 });
    board.fx.motes(dest, { color: '#e4daff', count: 14, rise: 40, spread: 30, dur: 0.9 });
    return 0.25;
  },
  // Imagem Maior: a mesma, mais larga e com um segundo anel (cheiro e som não se desenham).
  imagemMaior: (board, { caster, dest, areaTiles }) => {
    board.fx.motes(caster.pos, { color: '#c7b4ff', count: 8, rise: 32, spread: 18 });
    board.fx.beam(caster.pos, dest, { color: '#d9ccff', dur: 0.4, width: 3, jagged: true });
    board.fx.area((areaTiles ?? [dest]).filter((t) => (t.x + t.y) % 2 === 0), { color: '#c7b4ff', dur: 0.8 });
    board.fx.ring(dest, { color: '#c7b4ff', radius: 80, dur: 0.7, width: 3 });
    board.fx.ring(dest, { color: '#e4daff', radius: 44, dur: 0.5, width: 2 });
    board.fx.motes(dest, { color: '#e4daff', count: 20, rise: 52, spread: 40, dur: 1.0 });
    return 0.3;
  },
  // Cordão de Flechas: quatro flechas descem do alto e se fincam no chão (o feixe é a zona, em 2.5D).
  cordaoDeFlechas: (board, { caster, dest }) => {
    board.fx.quadros(dest, 'flechas-saraivada', { fps: 9, altura: 34, sumir: 0.2 });
    board.fx.motes(caster.pos, { color: '#d8c49a', count: 5, rise: 20, spread: 12 });
    return 0.5;
  },
  // Passo sem Rastro: um véu de sombra se abre num anel grande em torno de quem conjurou.
  passoSemRastro: (board, { caster }) => {
    board.fx.ring(caster.pos, { color: '#9f9be0', radius: 110, dur: 1.0, width: 4 });
    board.fx.quadros(caster.pos, 'rastro-nevoa', { fps: 8, altura: 12, sumir: 0.3 });
    board.fx.motes(caster.pos, { color: '#8a86b8', count: 8, rise: 34, spread: 60, dur: 1.0 });
    board.fx.halo(caster.pos, { color: '#8a86b8', dur: 1.1, radius: 30 });
    return 0.2;
  },
  // Patas de Aranha: oito traços escuros sobem do pé do alvo.
  patasDeAranha: (board, _ctx, alvos = []) => {
    for (const t of alvos) {
      board.fx.ring(t.pos, { color: '#d0c4e8', radius: 40, dur: 0.7, width: 2 });
      board.fx.shards(t.pos, { color: '#e4dcf5', count: 8, spread: 28 });
      board.fx.motes(t.pos, { color: '#b9aed0', count: 8, rise: 32, spread: 14, dur: 0.8 });
    }
    return 0;
  },
  // Contramágica: um fio branco-violeta corta a magia do outro e o anel se fecha sobre ele.
  contramagia: (board, { caster, dest }) => {
    board.fx.beam(caster.pos, dest, { color: '#f0e8ff', dur: 0.4, width: 3, jagged: true });
    board.fx.ring(dest, { color: '#f0e8ff', radius: 64, dur: 0.5, width: 3, fecha: true });
    board.fx.halo(caster.pos, { color: '#c7b4ff', dur: 0.6, radius: 24 });
    board.fx.quadros(dest, 'contramagica-x', { fps: 10, altura: 44 });
    return 0.35;
  },
  // Glifo de Proteção: a runa é gravada no chão num risco de luz dourada (a runa em si é a zona, em 2.5D).
  glifoDeProtecao: (board, { caster, dest }) => {
    board.fx.beam(caster.pos, dest, { color: '#ffe9a8', dur: 0.4, width: 2, jagged: false });
    board.fx.ring(dest, { color: '#ffe9a8', radius: 34, dur: 0.8, width: 2 });
    board.fx.motes(dest, { color: '#fff3c0', count: 10, rise: 26, spread: 14, dur: 0.9 });
    return 0.3;
  },

  // ---- lote 13: invocações, Piscar, Levitação, Círculo Mágico ----

  // Conjurar Animais: um anel verde se abre no chão e folhas sobem; as feras chegam com o evento 'invocado'.
  conjurarAnimais: (board, { caster }) => {
    board.fx.ring(caster.pos, { color: '#8fe6a8', radius: 76, dur: 0.8, width: 3 });
    board.fx.ring(caster.pos, { color: '#d9f7c4', radius: 48, dur: 0.6, width: 2 });
    board.fx.motes(caster.pos, { color: '#b6f0a0', count: 16, rise: 54, spread: 44, dur: 1.0 });
    board.fx.shards(caster.pos, { color: '#6ec86e', count: 8, spread: 40 });
    return 0.3;
  },
  // Animar os Mortos: uma bruma verde-violeta sai do corpo e a terra se abre sob ele.
  animarMortos: (board, { caster, dest }) => {
    board.fx.beam(caster.pos, dest, { color: '#9ff0b8', dur: 0.35, width: 2, jagged: true });
    board.fx.ring(dest, { color: '#7fe0a0', radius: 52, dur: 0.8, width: 3 });
    board.fx.quadros(dest, 'necrotico-mao', { fps: 9 });
    board.fx.motes(dest, { color: '#a58ad8', count: 16, rise: 50, spread: 26, dur: 1.0 });
    board.fx.shards(dest, { color: '#5a4a64', count: 8, spread: 30 });
    return 0.35;
  },
  // Piscar: o contorno de quem conjura treme em azul-claro (o some/volta vem dos eventos).
  piscar: (board, { caster }) => {
    board.fx.ring(caster.pos, { color: '#bfe6ff', radius: 44, dur: 0.6, width: 2 });
    board.fx.motes(caster.pos, { color: '#e8f4ff', count: 10, rise: 36, spread: 20, dur: 0.8 });
    return 0.15;
  },
  // Levitação: o vento sobe em coluna sob o alvo, e o corpo se solta do chão (a altura é do tabuleiro).
  levitacao: (board, { caster, dest, reuso }) => {
    board.fx.beam(caster.pos, dest, { color: '#cfe8ff', dur: 0.35, width: 2, jagged: false });
    board.fx.ring(dest, { color: '#dff3ff', radius: reuso ? 36 : 52, dur: 0.8, width: 3 });
    board.fx.motes(dest, { color: '#ffffff', count: 12, rise: 70, spread: 18, dur: 1.0 });
    if (!reuso) board.fx.hop(board.enc.at(dest.x, dest.y) ?? caster, { dur: 0.5, height: 36 });
    return 0.2;
  },
  // Círculo Mágico: dois anéis de runas correm pelo chão e o cilindro sobe (ele em si é a zona, em 2.5D).
  circuloMagico: (board, { caster, dest, areaTiles }) => {
    board.fx.beam(caster.pos, dest, { color: '#e6e0ff', dur: 0.35, width: 2, jagged: false });
    board.fx.ring(dest, { color: '#e6e0ff', radius: 110, dur: 0.9, width: 3 });
    board.fx.ring(dest, { color: '#b8a8ff', radius: 70, dur: 0.7, width: 2 });
    board.fx.area((areaTiles ?? [dest]).filter((t) => (t.x + t.y) % 2 === 0), { color: '#d8ccff', dur: 0.8 });
    board.fx.motes(dest, { color: '#f4f0ff', count: 18, rise: 80, spread: 70, dur: 1.1 });
    return 0.3;
  },

  // ---- lote 14: utilidade 2 (as cenas de fora de combate também tocam estas receitas) ----

  // Salto: um anel de capim sob os pés e o alvo dá um pulinho de mola.
  salto: (board, { caster, dest }, alvos = []) => {
    const quem = alvos[0] ?? board.enc.at(dest.x, dest.y) ?? caster;
    board.fx.ring(quem.pos, { color: '#c9f2a0', radius: 46, dur: 0.5, width: 3 });
    board.fx.motes(quem.pos, { color: '#e6ffc2', count: 12, rise: 62, spread: 14, dur: 0.9 });
    board.fx.hop(quem, { dur: 0.5, height: 36 });
    return 0.2;
  },
  // Alarme: um sino mudo: dois anéis dourados se abrem do chão e uma estrela de aviso pisca.
  alarme: (board, { caster }) => {
    board.fx.ring(caster.pos, { color: '#ffd27a', radius: 120, dur: 1.1, width: 3 });
    board.fx.ring(caster.pos, { color: '#fff0c0', radius: 70, dur: 0.8, width: 2 });
    board.fx.ring(caster.pos, { color: '#ffe9a8', radius: 40, dur: 1.6, width: 2 });
    board.fx.glyph(caster.pos, { text: '!', color: '#ffd27a', dur: 1.0, rise: 46, size: 22 });
    return 0.2;
  },
  // Detectar o Bem e o Mal: um anel azul-claro se abre e, por dentro, outro vermelho. As colunas de luz sobre quem a magia sente vêm do mapa.
  detectarBemMal: (board, { caster }) => {
    board.fx.ring(caster.pos, { color: '#9fd0ff', radius: 150, dur: 1.2, width: 3 });
    board.fx.ring(caster.pos, { color: '#f03c46', radius: 100, dur: 1.0, width: 3 });
    board.fx.glyph(caster.pos, { text: '+', color: '#9fd0ff', dur: 1.1, rise: 40, size: 22 });
    board.fx.glyph(caster.pos, { text: '×', color: '#f03c46', dur: 1.3, rise: 52, size: 22 });
    board.fx.halo(caster.pos, { color: '#e4f0ff', dur: 1.1, radius: 26 });
    board.fx.motes(caster.pos, { color: '#ffffff', count: 14, rise: 40, spread: 70, dur: 1.2 });
    return 0.25;
  },
  // Encontrar Armadilhas: um pulso laranja varre a cena e estilhaços sobem do chão onde há perigo.
  encontrarArmadilhas: (board, { caster }) => {
    board.fx.ring(caster.pos, { color: '#ffb04a', radius: 170, dur: 1.2, width: 3 });
    board.fx.ring(caster.pos, { color: '#ffd9a0', radius: 110, dur: 0.9, width: 2 });
    board.fx.motes(caster.pos, { color: '#ffc27a', count: 12, rise: 36, spread: 80, dur: 1.1 });
    board.fx.shards(caster.pos, { color: '#ffb04a', count: 10, spread: 70 });
    board.fx.glyph(caster.pos, { text: '!', color: '#ffb04a', dur: 1.0, rise: 46, size: 24 });
    return 0.25;
  },
  // Zona da Verdade: o domo dourado-claro sobe em volta de quem fala (a coluna que fica vem do mapa).
  zonaDaVerdade: (board, { caster, dest }) => {
    board.fx.beam(caster.pos, dest, { color: '#fff3c0', dur: 0.3, width: 2, jagged: false });
    board.fx.domo(dest, { cor: 'marca-verdade', dur: 1.5, raio: 52, altura: 64, op: 1 });
    board.fx.ring(dest, { color: '#ffce46', radius: 60, dur: 0.9, width: 3 });
    board.fx.glyph(dest, { text: '⚖', color: '#ffce46', dur: 1.2, rise: 44, size: 24 });
    return 0.3;
  },
  // Localizar Objeto: um fio ciano corre até o objeto e a coluna acende lá.
  localizarObjeto: (board, { caster, dest }) => {
    board.fx.ring(caster.pos, { color: '#28e6c8', radius: 60, dur: 0.7, width: 2 });
    board.fx.beam(caster.pos, dest, { color: '#28e6c8', dur: 0.6, width: 2, jagged: false, pulso: true });
    board.fx.ring(dest, { color: '#7ff5e0', radius: 54, dur: 0.9, width: 3 });
    board.fx.motes(dest, { color: '#c8fff4', count: 12, rise: 56, spread: 18, dur: 1.0 });
    return 0.5;
  },
  // Línguas: letras de todos os alfabetos sobem em volta da cabeça de quem fala.
  linguas: (board, { caster }) => {
    board.fx.ring(caster.pos, { color: '#ffe9a8', radius: 56, dur: 0.8, width: 2 });
    board.fx.glyph(caster.pos, { text: 'ᚠ', color: '#ffe9a8', dur: 1.5, rise: 50, size: 26 });
    board.fx.glyph(caster.pos, { text: 'ʃ', color: '#bfe6ff', dur: 1.5, rise: 40, size: 26 });
    board.fx.glyph(caster.pos, { text: 'ж', color: '#ffc7a0', dur: 1.5, rise: 56, size: 26 });
    board.fx.motes(caster.pos, { color: '#fff3c8', count: 12, rise: 50, spread: 26, dur: 1.0 });
    return 0.2;
  },
  // Alterar Aparência: o contorno de quem conjura treme e a cor muda, como cera derretendo.
  alterarAparencia: (board, { caster }) => {
    board.fx.piscar(caster, { dur: 0.7, color: '#e8d8ff' });
    board.fx.ring(caster.pos, { color: '#c7b4ff', radius: 52, dur: 0.8, width: 3 });
    board.fx.derreter(caster, { color: '#d9c7ff', dur: 0.8 });
    board.fx.motes(caster.pos, { color: '#e8dcff', count: 14, rise: 44, spread: 20, dur: 1.0 });
    return 0.25;
  },
  // Cativar: uma espiral hipnótica sobe da voz de quem conta a história.
  cativar: (board, { caster }) => {
    board.fx.ring(caster.pos, { color: '#f4c7ff', radius: 130, dur: 1.2, width: 3 });
    board.fx.glyph(caster.pos, { text: '♪', color: '#f4c7ff', dur: 1.3, rise: 50, size: 26 });
    board.fx.glyph(caster.pos, { text: '♫', color: '#fbe3ff', dur: 1.5, rise: 62, size: 26 });
    board.fx.motes(caster.pos, { color: '#fbe3ff', count: 14, rise: 38, spread: 70, dur: 1.1 });
    return 0.25;
  },
  // Amizade Animal: corações e um anel verde-folha em volta da fera.
  amizadeAnimal: (board, { caster, dest }) => {
    board.fx.beam(caster.pos, dest, { color: '#bff0b0', dur: 0.3, width: 2, jagged: false });
    board.fx.ring(dest, { color: '#9fe59a', radius: 46, dur: 0.9, width: 3 });
    board.fx.glyph(dest, { text: '♥', color: '#ff9ac0', dur: 1.1, rise: 46, size: 22 });
    board.fx.motes(dest, { color: '#d6f7c4', count: 10, rise: 40, spread: 16, dur: 1.0 });
    return 0.3;
  },
  // Sentidos da Fera: um olho verde-água se abre sobre o bicho e a visão corre dele até a casa.
  sentidosDaFera: (board, { caster, dest }) => {
    board.fx.ring(dest, { color: '#cdeb46', radius: 48, dur: 0.9, width: 3 });
    board.fx.halo(dest, { color: '#eaff9a', dur: 1.0, radius: 22 });
    board.fx.glyph(dest, { text: '◉', color: '#cdeb46', dur: 1.2, rise: 40, size: 26 });
    board.fx.beam(caster.pos, dest, { color: '#cdeb46', dur: 0.4, width: 2, jagged: false, pulso: true });
    return 0.3;
  },
  // Fingir de Morto: o alvo empalidece, o contorno fica cinzento e uma fumaça fria sobe do chão.
  fingirDeMorto: (board, { caster, dest }, alvos = []) => {
    const quem = alvos[0] ?? board.enc.at(dest.x, dest.y) ?? caster;
    board.fx.beam(caster.pos, quem.pos, { color: '#c9c2d8', dur: 0.3, width: 2, jagged: false });
    board.fx.dissipar(quem, { color: '#c9c2d8', dur: 0.9 });
    board.fx.ring(quem.pos, { color: '#b4acc8', radius: 44, dur: 0.9, width: 3 });
    board.fx.quadros(quem.pos, 'sono-nevoa', { fps: 8, altura: 20, sumir: 0.3 });
    return 0.3;
  },
  // Falar com Plantas: brotos sobem do chão em volta de quem conjura, num anel de folhas.
  falarComPlantas: (board, { caster }) => {
    board.fx.ring(caster.pos, { color: '#8fe6a8', radius: 140, dur: 1.2, width: 3 });
    board.fx.quadros(caster.pos, 'plantas-brotar', { fps: 10, altura: 28, sumir: 0.3 });
    for (const [dx, dy] of [[1, 0], [-1, 1], [0, -2]]) board.fx.quadros({ x: caster.pos.x + dx, y: caster.pos.y + dy }, 'plantas-brotar', { fps: 10, altura: 22, sumir: 0.3 });
    board.fx.motes(caster.pos, { color: '#c8f5b0', count: 16, rise: 50, spread: 80, dur: 1.2 });
    return 0.25;
  },
  // Convocar Familiar: o círculo de giz se fecha, a fumaça de incenso sobe e o bicho aparece (o corpo é o do tabuleiro).
  encontrarFamiliar: (board, { caster }) => {
    board.fx.ring(caster.pos, { color: '#fff3c8', radius: 50, dur: 1.0, width: 2 });
    board.fx.ring(caster.pos, { color: '#c7b4ff', radius: 80, dur: 0.9, width: 2 });
    board.fx.quadros(caster.pos, 'luz-orbe', { fps: 8, altura: 28, sumir: 0.3 });
    board.fx.motes(caster.pos, { color: '#e8e0ff', count: 16, rise: 48, spread: 30, dur: 1.2 });
    return 0.6;
  },

  // Dissipar: um anel violeta se abre e a zona (ou a criatura) se desfaz em brumas.
  dissiparMagia: (board, { dest, areaTiles }) => {
    board.fx.quadros(dest, 'dissipar-sigilo', { fps: 10, altura: 26 });
    board.fx.motes(dest, { color: '#c7b4ff', count: 12, rise: 36, spread: 40 });
    return 0.2;
  },

  // Toque que drena: a mão aperta e um fio verde volta a quem tocou.
  toqueVampirico: (board, { caster, dest }) => {
    board.fx.lunge(caster, dest, 0.2);
    board.fx.quadros(dest, 'necrotico-mao', { fps: 9 });
    setTimeout(() => board.fx.beam(dest, caster.pos, { color: '#9ff0b8', dur: 0.3, width: 2, jagged: false }), 280);
    return 0.25;
  },

  /**
   * Sopro de veneno do dragão verde — o golpe que a campanha guarda para o fim.
   *
   * Três decisões:
   *
   * 1. O cone nasce A FRENTE do dragão (34% do caminho até o alvo), não no
   *    centro do quadrado dele. Numa figura de 74 px a boca está a três quartos
   *    da altura e bem adiante do corpo; cone saindo dos pés estraga a cena.
   *    Ainda está errado na ALTURA — ver relatório, `fx.sopro` precisa aceitar
   *    deslocamento vertical para usar `bocaDragao()` de `art/plans/dragao.js`.
   * 2. O veneno ASSENTA depois do jato, de perto para longe. Jato que acende e
   *    apaga é lança-chamas; o que faz o veneno ler como veneno é a coisa ficar
   *    no chão depois.
   * 3. `delay` 0,42 s porque o cone só termina de abrir aos 30% dos 0,8 s de
   *    duração, e o dano antes disso acontece em quadrados onde nada apareceu
   *    ainda.
   */
  sopro: (board, { caster, dest, areaTiles }) => {
    const tiles = areaTiles ?? [dest];
    const boca = aFrente(caster.pos, dest, 0.34);
    board.fx.sopro(boca, dest, { color: COR.veneno, dur: 0.8, spread: 0.46, tiles });
    board.fx.tremor(0.4);
    for (const t of tiles.slice(0, 14)) {
      const d = Math.max(Math.abs(t.x - caster.pos.x), Math.abs(t.y - caster.pos.y));
      setTimeout(() => {
        board.fx.area([t], { color: COR.veneno, dur: 1.1 });
        board.fx.motes(t, { color: COR.veneno, count: 4, rise: 20, dur: 0.9, spread: 18 });
      }, 180 + d * 70);
    }
    return 0.42;
  },
};

// O mesmo cone atende qualquer identificador que o bloco do dragão venha a
// usar. Apelido, e não cópia, porque duas receitas de sopro divergem no
// primeiro ajuste e aí o jogo passa a ter dois sopros diferentes.
SPELL_VISUALS.soproVenenoso = SPELL_VISUALS.sopro;
SPELL_VISUALS.soproDeVeneno = SPELL_VISUALS.sopro;
SPELL_VISUALS.soproVerde = SPELL_VISUALS.sopro;

/** Magias cuja receita já desenha o impacto em quadros. */
const IMPACTO_PROPRIO = new Set([
  'raioDeFogo', 'raioDeGelo', 'misselMagico', 'raioGuiado', 'raioDeDoenca',
  'chamaSagrada', 'maosFlamejantes', 'ondaTrovejante',
  'raioArdente', 'despedacar', 'bolaDeFogo', 'relampago', 'armaEspiritual', 'toqueVampirico',
  'rajadaMistica', 'produzirChama', 'toqueChocante', 'borrifoVenenoso', 'repreensaoInfernal', 'orbeCromatico',
  'flechaAcida', 'laminaFlamejante', 'calorNoMetal', 'raioLunar', 'esferaFlamejante', 'nuvemDeAdagas',
  'convocarRelampagos', 'glifoDeProtecao',
]);

/** Como cada tipo de dano vira labareda, lasca ou estouro no impacto. */
const IMPACT_BY_TYPE = {
  fogo: (board, tile) => board.fx.flames(tile, { color: '#ff6a2a', count: 5, dur: 0.45 }),
  frio: (board, tile) => board.fx.shards(tile, { color: '#bfe9ff', count: 9 }),
  radiante: (board, tile) => board.fx.motes(tile, { color: '#ffe9a8', count: 8, rise: 30, dur: 0.45 }),
  'energético': (board, tile) => board.fx.impact(tile, { color: '#b98cff', count: 8, spread: 36 }),
  raio: (board, tile) => board.fx.impact(tile, { color: '#bfe6ff', count: 10, spread: 50 }),
  // Veneno não estoura: fica. Argola baixa e bolhas subindo devagar.
  veneno: (board, tile) => {
    board.fx.ring(tile, { color: COR.veneno, radius: 26, dur: 0.7, width: 2 });
    board.fx.motes(tile, { color: COR.veneno, count: 6, rise: 22, dur: 0.85, spread: 18 });
  },
  // Ácido come: poça embaixo, bolha em cima.
  'ácido': (board, tile) => {
    board.fx.derreter(tile, { color: COR.limo, dur: 0.8 });
    board.fx.motes(tile, { color: COR.acido, count: 7, rise: 24, dur: 0.7, spread: 14 });
  },
  // Necrótico puxa para dentro: estouro escuro e curto, sem brilho nenhum.
  'necrótico': (board, tile) => {
    board.fx.impact(tile, { color: COR.necroticoFundo, count: 9, spread: 24, dur: 0.6 });
    board.fx.ring(tile, { color: COR.necrotico, radius: 22, dur: 0.5, width: 2 });
  },
};

const FALLBACK_COLOR = {
  fogo: '#ff7a3a', frio: '#8fd8ff', radiante: '#ffe9a8',
  'energético': '#b98cff', raio: '#bfe6ff', 'elétrico': '#bfe6ff', trovejante: '#e8eef5', 'psíquico': '#a579d8',
  veneno: COR.veneno, 'ácido': COR.acido, 'necrótico': COR.necrotico,
};

/**
 * Toca som e animação de uma magia.
 * @returns {number} atraso até o efeito chegar, em segundos
 */
export function playSpellVisual(board, ev) {
  const { caster, spell, target, point, areaTiles } = ev;
  const dest = target?.pos ?? point ?? caster.pos;
  // `origem` é o que separa o jato de pressão do frasco de veneno estourando:
  // os dois causam dano de veneno e não podem soar igual.
  audio.play(spellSoundFor(spell.damageType, { origem: spell.origem ?? 'magia' }));

  // Sopro não precisa de identificador conhecido: quem declara `origem: 'sopro'`
  // ganha o cone. Isto existe para o bloco do dragão não ficar refém de um nome
  // combinado entre dois arquivos de donos diferentes.
  const recipe = SPELL_VISUALS[spell.id]
    ?? (spell.origem === 'sopro' ? SPELL_VISUALS.sopro : null);
  let delay;

  if (recipe) {
    delay = recipe(board, { caster, dest, spell, areaTiles, dardos: ev.dardos, circulo: ev.circulo, reuso: ev.reuso }, ev.buffTargets ?? []);
  } else {
    // Receita genérica, para magia nova que ainda não ganhou a sua.
    const color = FALLBACK_COLOR[spell.damageType] ?? '#c7b4ff';
    if (spell.kind === 'attack' || spell.kind === 'auto') {
      board.fx.projectile(caster.pos, dest, { style: 'orb', color, dur: 0.3, arc: 0.4, trail: true });
      delay = 0.3;
    } else if (spell.kind === 'heal') {
      board.fx.motes(dest, { color: '#9ff0b8', count: 10, rise: 44 });
      delay = 0.15;
    } else {
      if (areaTiles?.length) board.fx.area(areaTiles, { color });
      else board.fx.ring(dest, { color, radius: 40 });
      delay = 0.22;
    }
  }

  // Impacto conforme a natureza, para quem causa dano — menos nas magias
  // cuja receita já toca a explosão própria em quadros.
  if (spell.damage && spell.kind !== 'heal' && spell.kind !== 'buff' && !IMPACTO_PROPRIO.has(spell.id)) {
    const impact = IMPACT_BY_TYPE[spell.damageType];
    const tiles = spell.shape ? (areaTiles ?? [dest]) : [dest];
    setTimeout(() => {
      for (const t of tiles.slice(0, 12)) {
        if (impact) impact(board, t);
        else board.fx.impact(t, { color: FALLBACK_COLOR[spell.damageType] ?? '#ffffff', count: 6 });
      }
      board.bump(0.25);
    }, delay * 1000);
  }

  return delay;
}

// ------------------------------------------------- lote 12: eventos do motor

const COR_DO_GLIFO = {
  'ácido': '#9be34b', frio: '#bfe9ff', fogo: '#ff7a3a', 'elétrico': '#bfe6ff', trovejante: '#d9ccff',
};

/** A runa explode: clarão da cor do dano, anel até o raio de 6 m e as casas da esfera piscam. */
export function playGlifoVisual(board, ev) {
  if (!board) return;
  const cor = COR_DO_GLIFO[ev.tipo] ?? '#ffe9a8';
  const c = ev.zona.centro;
  audio.play(spellSoundFor(ev.tipo === 'trovejante' ? 'trovejante' : ev.tipo, { origem: 'magia' }));
  const nomeGlifo = `glifo-${{ 'ácido': 'acido', frio: 'frio', fogo: 'fogo', 'elétrico': 'eletrico', trovejante: 'trovejante' }[ev.tipo] ?? 'eletrico'}`;
  board.fx.quadros(c, nomeGlifo, { fps: 11, altura: 34, sumir: 0.2 });
  board.fx.ring(c, { color: cor, radius: 20 * 6, dur: 0.7, width: 4 });
  board.fx.ring(c, { color: '#ffffff', radius: 20 * 3, dur: 0.45, width: 3 });
  board.fx.area((ev.areaTiles ?? []).filter((t) => (t.x + t.y) % 2 === 0), { color: cor, dur: 0.7 });
  board.fx.motes(c, { color: cor, count: 22, rise: 70, spread: 60, dur: 0.9 });
  board.bump(0.5);
}

/** Uma flecha do cordão sai do feixe e voa até o alvo. */
export function playCordaoVisual(board, ev) {
  if (!board) return;
  const de = ev.zona.centro;
  board.fx.projectile(de, ev.alvo.pos, { style: 'arrow', color: '#d8c49a', dur: 0.32, arc: 0.5, trail: true });
  if (ev.acertou) setTimeout(() => board.fx.impact(ev.alvo.pos, { color: '#e8d6a8', count: 6, spread: 26 }), 220);
}

/** A magia é cortada: o brilho dela se desfaz em cacos sobre quem conjurava. */
export function playAnuladaVisual(board, ev) {
  if (!board) return;
  board.fx.shards(ev.caster.pos, { color: '#e4daff', count: 12, spread: 44 });
  board.fx.glyph(ev.caster.pos, { text: '✖', color: '#f0e8ff', dur: 1.0, size: 30, rise: 40 });
}

// ---------------------------------------------------------------- condições

/**
 * Condição aplicada.
 *
 * Separado do ataque de propósito: a paralisia do ghoul só acontece quando o
 * alvo FALHA no salvamento, e o motor resolve isso depois do golpe. Desenhar o
 * travamento junto da garra mentiria em metade dos casos.
 *
 * Cada receita é `(board, alvo) => void`. Quem não tem receita própria cai no
 * genérico, que ao menos aponta quem foi.
 */
const CONDICAO_VISUALS = {
  // Travar não é congelar: cinza-aço, argola única e parada, nada de partícula
  // em movimento. O que comunica paralisia é a AUSÊNCIA de movimento no efeito.
  paralisado: (board, alvo) => {
    board.fx.piscar(alvo, { color: COR.paralisia, dur: 0.5 });
    board.fx.ring(alvo.pos, { color: COR.paralisia, radius: 22, dur: 0.8, width: 3 });
    board.fx.glyph(alvo.pos, { text: '!', color: COR.paralisia, dur: 0.9, size: 22, rise: 16 });
    board.floatText(alvo.pos, 'paralisado!', COR.paralisia);
    audio.play('castNecrotic');
  },

  // Enredado na teia: os mesmos fios do ataque, para o jogador reconhecer.
  enredado: (board, alvo) => {
    for (let i = 0; i < 3; i++) {
      board.fx.slash(alvo.pos, {
        color: COR.teia, angle: -0.5 + i * 1.05, sweep: 1.5,
        radius: 24 + i * 4, width: 1.5, dur: 0.6,
      });
    }
    board.floatText(alvo.pos, 'enredado!', COR.teia);
    audio.play('hissSpider');
  },

  agarrado: (board, alvo) => {
    board.fx.agarrao(alvo.pos, { color: '#e8d6a8', dur: 0.4 });
    board.floatText(alvo.pos, 'agarrado!', '#ffc83a');
  },

  envenenado: (board, alvo) => {
    board.fx.motes(alvo.pos, { color: COR.veneno, count: 7, rise: 26, dur: 0.8, spread: 16 });
    board.fx.piscar(alvo, { color: COR.veneno, dur: 0.4 });
    board.floatText(alvo.pos, 'envenenado!', COR.veneno);
    audio.play('castPoison');
  },

  caido: (board, alvo) => {
    board.fx.smash(alvo.pos, { color: COR.poeira, dur: 0.35 });
    board.floatText(alvo.pos, 'derrubado!', '#ffc83a');
  },

  amedrontado: (board, alvo) => {
    board.fx.glyph(alvo.pos, { text: '!', color: '#ff9a4a', dur: 0.8, size: 20 });
    board.floatText(alvo.pos, 'amedrontado!', '#ff9a4a');
  },

  atordoado: (board, alvo) => {
    board.fx.halo(alvo.pos, { color: '#ffe9a8', dur: 0.8, radius: 15 });
    board.fx.glyph(alvo.pos, { text: 'z', color: '#ffe9a8', dur: 0.8, size: 18 });
    board.floatText(alvo.pos, 'atordoado!', '#ffe9a8');
  },

  queimando: (board, alvo) => {
    board.fx.flames(alvo.pos, { color: '#ff6a2a', count: 5, dur: 0.6 });
    audio.play('castFire');
  },
};

/**
 * Mostra que uma condição entrou. `id` é o da tabela de `rules/conditions.js`.
 * @param {object} board
 * @param {{ target: object, condition: string }} ev
 */
export function playConditionVisual(board, { target, condition }) {
  if (!board || !target) return;
  const receita = Object.hasOwn(CONDICAO_VISUALS, condition) ? CONDICAO_VISUALS[condition] : null;
  if (receita) { receita(board, target); return; }
  // Genérico: marca QUEM, sem inventar uma linguagem para a condição.
  board.fx.piscar(target, { color: '#ffffff', dur: 0.34 });
  board.floatText(target.pos, condition, '#cfd6de');
}

// ---------------------------------------------------------------- andar

/**
 * Andar de um combatente.
 *
 * `fx.js` escreve seis andares com ritmo, arrasto e tremor proprios, e o jogo
 * chamava `walk()` sem dizer qual — entao a gelatina escorria com passo humano
 * e o zumbi marchava. A ordem e: declarado no bloco, deduzido do plano
 * corporal, passo.
 */
export function andarDe(actor, look = null) {
  if (actor.andar) return actor.andar;
  const l = look ?? LOOKS[actor.look] ?? null;
  if (!l) return 'passo';
  if (l.plan === 'gosma') return 'rastejar';
  if (l.plan === 'aracnideo') return 'aranha';
  // Quem voa e quem flutua usam o mesmo andar: alto e fora da linha reta.
  if (l.fera === 'stirge' || l.fera === 'morcegoGigante') return 'voo';
  if (l.undead === 'specter' || l.undead === 'wraith' || actor.incorporeo) return 'voo';
  if (l.aberracao === 'cranioFlamejante') return 'voo';
  if (l.undead === 'zumbi') return 'cambalear';
  if (actor.size === 'grande' || actor.size === 'enorme') return 'investida';
  return 'passo';
}

// ---------------------------------------------------------------- morte

/**
 * Morte por tipo.
 *
 * Esqueleto, gelatina e espectro morrem de formas OPOSTAS, e é essa diferença
 * que guarda o medo de cada um: um desmonta, um perde a forma, um afina até
 * sair do alcance. Um colapso genérico para os três joga fora metade do que o
 * bestiário conquistou.
 *
 * `morte` deveria vir do bloco de monstro. Hoje não vem — `makeMonster` não
 * copia tipo nenhum para o combatente (ver relatório), então isto deduz pelo
 * `defId`. A dedução é o remendo, não o contrato: assim que o bloco declarar
 * `morte`, esta tabela deixa de ser consultada.
 */
const MORTE_POR_ID = [
  [/esqueleto|cranio|crânio|caveira|ossada/, 'ossos'],
  [/gelatina|limo|gosma|pudim|broto|cubo/, 'derreter'],
  [/espectro|wraith|aparicao|aparição|agatha|mormesk|sombra|fantasma/, 'dissipar'],
];

/** Estilo de morte de um combatente, na ordem: declarado, deduzido, genérico. */
function estiloDeMorte(actor) {
  if (actor.morte) return actor.morte;
  if (actor.incorporeo) return 'dissipar';
  const id = `${actor.defId ?? actor.look ?? ''}`.toLowerCase();
  for (const [padrao, estilo] of MORTE_POR_ID) if (padrao.test(id)) return estilo;
  return 'colapso';
}

const MORTE_VISUALS = {
  // Desmonta, não cai: a pilha de ossos é o que diz que aquilo nunca foi vivo.
  ossos: (board, actor) => {
    board.fx.ossos(actor, { color: COR.osso, dur: 0.95, count: 16 });
    board.fx.tremor(0.3);
    audio.play(deathSoundFor('morto-vivo'));
  },

  // Perde a forma e fica a poça. Nenhum tremor: massa mole não bate no chão.
  derreter: (board, actor) => {
    board.fx.derreter(actor, { color: COR.limo, dur: 0.9 });
    audio.play(deathSoundFor('limo'));
  },

  // Sobe e afina. O único som de morte do jogo que termina mais agudo do que
  // começou, e o único em que a figura não toca o chão.
  dissipar: (board, actor) => {
    board.fx.dissipar(actor, { color: '#9fc6ff', dur: 0.85 });
    audio.play(deathSoundFor('morto-vivo', { incorporeo: true }));
  },

  // Carne: zumbi, ghoul, goblin, lobo. Cai de uma vez e o chão sente.
  colapso: (board, actor) => {
    board.fx.impact(actor.pos, { color: '#8a2b2b', count: 14, spread: 40, dur: 0.6 });
    board.fx.tremor(0.25);
    audio.play('down');
  },
};

/**
 * Mostra a morte de um combatente e toca o som dela.
 *
 * @param {object} board
 * @param {object} actor combatente que morreu
 * @param {{ estilo?: 'ossos'|'derreter'|'dissipar'|'colapso' }} [opts]
 */
export function playDeathVisual(board, actor, { estilo = null } = {}) {
  if (!board || !actor) return;
  const escolhido = estilo ?? estiloDeMorte(actor);
  (MORTE_VISUALS[escolhido] ?? MORTE_VISUALS.colapso)(board, actor);
  board.floatText(actor.pos, '✖', '#ff4b4b', true);
}

/** Estilos de morte disponíveis, para o bloco de monstro declarar `morte`. */
export const MORTES = Object.freeze(Object.keys(MORTE_VISUALS));
