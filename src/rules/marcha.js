// Ritmo de marcha: quanto o grupo anda por dia e o que cada ritmo custa.
//
// Livro do Jogador, "Ritmo de Viagem" e "Marcha Forçada".
//
// RITMO. Oito horas de estrada por dia. Devagar, o grupo anda três quartos do
// normal, mas pode se esconder enquanto anda; depressa, anda um quarto a mais,
// e paga com 5 a menos de Percepção passiva — o que faz dele presa mais fácil
// de emboscada. Só em ritmo normal ou lento dá para caçar e colher pelo
// caminho.
//
// MARCHA FORÇADA. Passando das oito horas, cada hora a mais rende mais estrada
// e cobra um teste de Constituição: CD 10 mais uma por hora além da oitava, ou
// seja, 11 na nona hora e 12 na décima. Quem falha ganha um degrau de exaustão.
//
// SIMPLIFICAÇÕES E REGRAS DA CASA, declaradas no painel de partida:
//   - os quilômetros por dia saem da proporção do livro (3/4, 1, 5/4) sobre os
//     36 km do dia normal que a região já usava. 36 km não é a conversão exata
//     das 24 milhas do livro (seriam 38,6): é a escala do mapa do jogo, e o que
//     importa aqui é a proporção entre os três ritmos;
//   - a marcha forçada do jogo vai só até duas horas a mais, e os testes das
//     horas saem juntos no fim do dia, não hora a hora;
//   - o grupo marcha todo no mesmo ritmo: não há dividir o grupo;
//   - montaria e veículo não existem no jogo, e o livro tem ritmo próprio para
//     eles;
//   - andando devagar, o grupo faz um teste de grupo de Furtividade (metade
//     passando, o grupo passa, como manda o livro). Passando, quem embosca é o
//     grupo; falhando, o encontro corre como correria no passo normal. Quem
//     veste armadura pesada rola com desvantagem, como o livro manda — fora
//     daqui o motor ainda não cobra essa desvantagem em Furtividade;
//   - caçar e colher só em ritmo normal ou lento, e um dia curto de chegada
//     ainda custa um dia inteiro de comida e água.

import { saveBonus, skillBonus } from './abilities.js';
import { ARMORS } from './items/armors.js';
import { savingThrow, d20 } from '../core/dice.js';
import { mudarExaustao, exaustaoFatal, nivelDeExaustao, conditionEffects } from './conditions.js';

/** As oito horas de estrada de um dia normal. */
export const HORAS_DE_MARCHA = 8;
/** Quantas horas a mais a marcha forçada do jogo permite. */
export const EXTRAS_MAX = 2;

export const RITMOS = {
  lento: {
    id: 'lento',
    nome: 'Devagar',
    fator: 0.75,
    percepcao: 0,
    furtivo: true,
    forrageia: true,
    resumo: 'três quartos da estrada, mas o grupo anda escondido: passando no teste de Furtividade, quem embosca é ele',
  },
  normal: {
    id: 'normal',
    nome: 'Normal',
    fator: 1,
    percepcao: 0,
    furtivo: false,
    forrageia: true,
    resumo: 'o passo de sempre, oito horas de estrada',
  },
  rapido: {
    id: 'rapido',
    nome: 'Depressa',
    fator: 1.25,
    percepcao: -5,
    furtivo: false,
    forrageia: false,
    resumo: 'um quarto a mais por dia, ou seja, menos horas na estrada e menos encontros — ao preço de 5 a menos de Percepção passiva e de ninguém caçar pelo caminho',
  },
};

export const ritmoDe = (id) => RITMOS[id] ?? RITMOS.normal;

/** Quilômetros por dia neste ritmo, com as horas a mais da marcha forçada. */
export function kmPorDia(base, ritmo = 'normal', horasExtras = 0) {
  const r = ritmoDe(ritmo);
  const horas = HORAS_DE_MARCHA + Math.max(0, Math.min(EXTRAS_MAX, horasExtras));
  return Math.round(base * r.fator * (horas / HORAS_DE_MARCHA));
}

/** Quantos dias de marcha para `km`, neste ritmo. */
export function diasDeMarcha(km, base, ritmo = 'normal', horasExtras = 0) {
  return Math.max(1, Math.ceil(km / kmPorDia(base, ritmo, horasExtras)));
}

/**
 * Põe o ritmo em todo o grupo (e tira, com `null`).
 *
 * A penalidade de Percepção passiva do ritmo depressa viaja num número solto,
 * `c.percepcaoMarcha`, que `abilities.js` soma. É de propósito: `abilities.js`
 * não importa nada, e importar este módulo lá faria um ciclo.
 */
export function marcharEm(herois, ritmo) {
  for (const c of herois) {
    if (ritmo) {
      c.marcha = ritmo;
      c.percepcaoMarcha = ritmoDe(ritmo).percepcao;
    } else {
      delete c.marcha;
      delete c.percepcaoMarcha;
    }
  }
}

/**
 * As horas a mais de um dia de marcha forçada: um teste de Constituição por
 * hora, CD 10 mais uma por hora além da oitava — 11 na nona, 12 na décima.
 * Devolve as frases do registro.
 *
 * As horas correm em ordem: quem ganha o 3º degrau na nona hora já faz a
 * décima com desvantagem, porque é isso que o degrau cobra.
 */
export function cobrarMarchaForcada(rng, herois, horasExtras) {
  const linhas = [];
  const extras = Math.max(0, Math.min(EXTRAS_MAX, horasExtras));
  if (!extras) return linhas;
  for (const c of herois.filter((h) => !h.dead)) {
    const falhas = [];
    let nivel = nivelDeExaustao(c);
    for (let h = 1; h <= extras; h++) {
      if (c.dead) break;
      const cd = 10 + h;
      const desvantagem = conditionEffects(c).saveDisadvantage.includes('con');
      const t = savingThrow(rng, saveBonus(c, 'con'), cd, { disadvantage: desvantagem });
      if (t.success) continue;
      falhas.push(`${t.total} contra ${cd}`);
      nivel = mudarExaustao(c, 1);
      if (exaustaoFatal(c)) break;
    }
    if (!falhas.length) continue;
    linhas.push(`${c.name} não aguenta o passo forçado (CON ${falhas.join(', ')}): exaustão ${nivel}`);
    if (c.dead) linhas.push(`${c.name} cai na estrada e não levanta mais.`);
  }
  return linhas.length ? [`Marcha forçada — ${linhas.join('; ')}.`] : [];
}

/**
 * Em ritmo lento o grupo anda escondido. Devolve
 * { furtivo, rolagem, atencao, rolagens } — `furtivo` diz se o bando que
 * aparece não percebeu a aproximação, e aí quem embosca é o grupo.
 *
 * É o TESTE DE GRUPO do livro: cada um rola Furtividade e, se metade ou mais
 * passar, o grupo passa. A CD é a melhor Percepção passiva do que vem pela
 * frente. O empate vale para quem defende, como no resto do motor
 * (`combat.js`, `rolarSurpresa`): é preciso PASSAR da atenção deles.
 *
 * `vantagem` e `desvantagem` vêm de fora: a distância do encontro é uma delas
 * (`rules/encontros-estrada.js`, `vantagemDeDistancia`).
 */
export function furtividadeDoGrupo(rng, herois, inimigos, passivaDe, { vantagem = false, desvantagem = false, atencao: atencaoDada = null } = {}) {
  const vivos = herois.filter((c) => !c.dead);
  if (!vivos.length) return { furtivo: false, rolagem: 0, atencao: 0, rolagens: [] };
  const rolagens = vivos.map((c) => {
    const fx = conditionEffects(c);
    // O 1º degrau de exaustão atrapalha (Furtividade é teste de Destreza), e a
    // armadura pesada também: andar de cota de malha pela mata faz barulho.
    const pelaArmadura = ARMORS[c.armor]?.furtividade === 'desvantagem';
    const ruim = desvantagem || pelaArmadura
      || fx.desvantagemSoTeste.includes('dex') || fx.desvantagemTeste.includes('dex');
    return d20(rng, skillBonus(c, 'furtividade'), { advantage: vantagem, disadvantage: ruim }).total;
  });
  // `atencao` pode vir pronta de fora: o encontro de estrada soma ao bando o
  // que o TAMANHO dele dá (`rules/encontros-estrada.js`, `atencaoDoBando`).
  const atencao = atencaoDada ?? Math.max(0, ...inimigos.map((m) => passivaDe(m)));
  const passaram = rolagens.filter((r) => r > atencao).length;
  const furtivo = passaram * 2 >= rolagens.length;
  // A rolagem que vale para a surpresa é a do meio: com metade passando, é ela
  // que diz quanto o grupo se escondeu de verdade.
  const ordenadas = [...rolagens].sort((a, b) => a - b);
  const rolagem = ordenadas[Math.floor(ordenadas.length / 2)];
  return { furtivo, rolagem, atencao, rolagens, passaram };
}

/**
 * A chance de o grupo passar no teste de grupo de Furtividade, de 0 a 1, sem
 * rolar nada: é o número que a tela do encontro mostra. Conta a desvantagem da
 * armadura pesada e a da exaustão, que a faixa de bônus sozinha escondia.
 *
 * Teste de grupo: metade ou mais passando, o grupo passa. A conta é a soma das
 * combinações em que pelo menos metade passa.
 */
export function chanceDeEsconder(herois, atencao, { vantagem = false, desvantagem = false } = {}) {
  const vivos = herois.filter((c) => !c.dead);
  if (!vivos.length) return 0;
  const ps = vivos.map((c) => {
    const fx = conditionEffects(c);
    const pelaArmadura = ARMORS[c.armor]?.furtividade === 'desvantagem';
    const ruim = desvantagem || pelaArmadura
      || fx.desvantagemSoTeste.includes('dex') || fx.desvantagemTeste.includes('dex');
    // Precisa PASSAR da atenção: o empate vale para quem defende.
    const alvo = atencao + 1 - skillBonus(c, 'furtividade');
    const p = Math.max(0, Math.min(1, (21 - alvo) / 20));
    if (vantagem && !ruim) return 1 - (1 - p) ** 2;
    if (ruim && !vantagem) return p ** 2;
    return p;
  });
  // Poisson-binomial: a chance de k passarem, para cada k.
  let dist = [1];
  for (const p of ps) {
    const nova = new Array(dist.length + 1).fill(0);
    dist.forEach((v, k) => { nova[k] += v * (1 - p); nova[k + 1] += v * p; });
    dist = nova;
  }
  const precisa = Math.ceil(ps.length / 2);
  return dist.slice(precisa).reduce((a, b) => a + b, 0);
}

/** Quem está cansado demais para forçar a marcha (5º degrau: não anda). */
export const podeMarchar = (c) => nivelDeExaustao(c) < 5;
