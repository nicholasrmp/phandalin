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
      delay: 0.3,
      som: 'castPoison',
      somInicio: 'hissSpider',
      start: () => board.fx.projectile(attacker.pos, target.pos, {
        style: 'orb', color: COR.teia, dur: 0.3, arc: 0.55, trail: true,
      }),
      onHit: () => {
        for (let i = 0; i < 3; i++) {
          board.fx.slash(target.pos, {
            color: COR.teia, angle: -0.5 + i * 1.05, sweep: 1.5,
            radius: 24 + i * 4, width: 1.5, dur: 0.6,
          });
        }
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
      board.floatText(ev.target.pos, 'errou', '#9aa3b2');
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

const SPELL_VISUALS = {
  // Luz do céu desabando sobre o alvo.
  chamaSagrada: (board, { dest }) => {
    board.fx.pillar(dest, { color: '#ffe9a8', dur: 0.55, width: 20, height: 200 });
    setTimeout(() => {
      board.fx.ring(dest, { color: '#fff3c8', radius: 44, dur: 0.45 });
      board.fx.motes(dest, { color: '#ffe9a8', count: 8, rise: 34, dur: 0.5 });
    }, 200);
    return 0.26;
  },

  // Bola de fogo com rastro, que vira labareda no impacto.
  raioDeFogo: (board, { caster, dest }) => {
    board.fx.projectile(caster.pos, dest, { style: 'orb', color: '#ff7a3a', dur: 0.3, arc: 0.3, trail: true });
    return 0.3;
  },

  // Lasca de gelo que estilhaça.
  raioDeGelo: (board, { caster, dest }) => {
    board.fx.projectile(caster.pos, dest, { style: 'shard', color: '#bfe9ff', dur: 0.28, arc: 0.15, trail: true });
    return 0.28;
  },

  // Três dardos em sequência, cada um com seu estouro.
  misselMagico: (board, { caster, dest, spell }) => {
    const darts = spell.darts ?? 3;
    for (let i = 0; i < darts; i++) {
      setTimeout(() => {
        board.fx.projectile(caster.pos, dest, { style: 'orb', color: '#b98cff', dur: 0.24, arc: 0.9 + i * 0.25, trail: true });
        setTimeout(() => board.fx.impact(dest, { color: '#b98cff', count: 5, spread: 26, dur: 0.3 }), 240);
      }, i * 110);
    }
    return 0.24 + (darts - 1) * 0.11;
  },

  // Cone de fogo: as chamas acendem de perto para longe.
  maosFlamejantes: (board, { caster, dest, areaTiles }) => {
    const tiles = areaTiles ?? [dest];
    board.fx.area(tiles, { color: '#ff7a3a', dur: 0.55 });
    for (const t of tiles) {
      const d = Math.max(Math.abs(t.x - caster.pos.x), Math.abs(t.y - caster.pos.y));
      setTimeout(() => board.fx.flames(t, { color: '#ff6a2a', count: 4, dur: 0.5 }), d * 55);
    }
    return 0.22;
  },

  // Névoa roxa e um "z" subindo de cada quadrado.
  sono: (board, { areaTiles, dest }) => {
    const tiles = areaTiles ?? [dest];
    board.fx.area(tiles, { color: '#8f7ad8', dur: 0.8 });
    tiles.slice(0, 10).forEach((t, i) => {
      setTimeout(() => board.fx.glyph(t, { text: 'z', color: '#c7b4ff', dur: 0.9, size: 18 }), i * 70);
    });
    return 0.3;
  },

  // Cura por toque: pontos de luz subindo e uma argola.
  curarFerimentos: (board, { dest }) => {
    board.fx.ring(dest, { color: '#6ee89a', radius: 34, dur: 0.6, width: 3 });
    board.fx.motes(dest, { color: '#9ff0b8', count: 12, rise: 50, dur: 0.75 });
    board.fx.halo(dest, { color: '#9ff0b8', dur: 0.6, radius: 14 });
    return 0.14;
  },

  // Cura à distância: um fio de luz chega antes dos pontos.
  palavraCurativa: (board, { caster, dest }) => {
    board.fx.beam(caster.pos, dest, { color: '#9ff0b8', dur: 0.3, width: 2, jagged: false });
    setTimeout(() => board.fx.motes(dest, { color: '#9ff0b8', count: 9, rise: 44, dur: 0.6 }), 180);
    return 0.2;
  },

  // Bênção: argola dourada sobre cada abençoado.
  bencao: (board, { caster }, targets = []) => {
    board.fx.ring(caster.pos, { color: '#ffe9a8', radius: 72, dur: 0.75, width: 2 });
    for (const t of targets) {
      board.fx.halo(t.pos, { color: '#ffe9a8', dur: 0.9, radius: 17 });
      board.fx.motes(t.pos, { color: '#ffe9a8', count: 6, rise: 36, dur: 0.7 });
    }
    return 0;
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
  'energético': '#b98cff', raio: '#bfe6ff',
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
    delay = recipe(board, { caster, dest, spell, areaTiles }, ev.buffTargets ?? []);
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

  // Impacto conforme a natureza, para quem causa dano.
  if (spell.damage && spell.kind !== 'heal' && spell.kind !== 'buff') {
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
