// A noite na estrada: onde armar o acampamento, fogueira ou escuro, e quem
// fica de vigia.
//
// O QUE É DO LIVRO
//   - o descanso longo são oito horas, das quais pelo menos SEIS dormindo e no
//     máximo DUAS de atividade leve. Ficar de vigia é atividade leve: duas
//     horas cabem, quatro não;
//   - o descanso só recomeça do zero se for interrompido por uma HORA ou mais
//     de esforço — caminhar, lutar, conjurar. Uma luta de algumas rodadas dura
//     menos de um minuto e não chega perto disso: o grupo briga, volta a
//     dormir e o descanso vale;
//   - surpresa é a Percepção passiva de quem está acordado contra a Furtividade
//     de quem chega. Quem dorme não percebe nada, e quem não percebe nada é
//     surpreendido — essa é a consequência, não um artigo do livro.
//
// O QUE É NOSSO, e está dito na tela do acampamento
//   - os seis lugares de acampar, a CD de Sobrevivência que acha cada um e o
//     que cada um vale (esconder, enxergar, abrigar). O livro não tem tabela
//     de sítio de acampamento;
//   - a fogueira: +2 para quem vigia, porque a luz mostra quem chega perto, e
//     −2 na ocultação, porque o fogo se vê de longe. O livro não dá bônus por
//     luz, só fala de luz clara, penumbra e escuridão;
//   - quem vigia quatro horas não tem descanso LONGO, mas tem o curto: ficou
//     horas sem esforço, e o livro não manda tirar isso dele. O livro também
//     não diz em letra que passar das duas horas custa o descanso inteiro —
//     é a leitura mais comum, e é a nossa;
//   - o Transe do elfo (quatro horas de meditação valendo oito de sono) ainda
//     não existe no motor, então o elfo vigia como todo mundo.

import { skillBonus, passivePerception } from './abilities.js';
import { hasCondition } from './conditions.js';
import { d20 } from '../core/dice.js';

/** Uma hora de esforço: menos que isso não recomeça o descanso longo. */
export const MINUTOS_QUE_QUEBRAM_O_DESCANSO = 60;
/** O teto de atividade leve do descanso longo, em horas. */
export const HORAS_LEVES = 2;
/** A noite de vigia, em horas. */
export const HORAS_DA_NOITE = 8;

/**
 * Onde o grupo pode passar a noite. `cd` é o teste de Sobrevivência que acha
 * o lugar; `ocultacao` esconde o acampamento (sobe a barra de quem o procura),
 * `vigia` é o que o lugar dá a quem olha a escuridão, e `abrigo` diz se há
 * teto contra chuva e vento.
 */
export const LUGARES = {
  aberto: {
    id: 'aberto',
    nome: 'Chão aberto',
    cd: 0,
    terrenos: ['farto', 'comum', 'ermo'],
    ocultacao: 0,
    vigia: 0,
    abrigo: false,
    texto: 'Capim seco e céu inteiro por cima. Vê-se longe, e vê-se o grupo de longe.',
  },
  matagal: {
    id: 'matagal',
    nome: 'Matagal fechado',
    cd: 10,
    terrenos: ['farto', 'comum'],
    ocultacao: 3,
    vigia: -2,
    abrigo: false,
    texto: 'Espinheiro alto em roda, de entrar agachado. Esconde bem — e também esconde quem chega.',
  },
  margem: {
    id: 'margem',
    nome: 'Margem do riacho',
    cd: 10,
    terrenos: ['farto'],
    ocultacao: 1,
    vigia: 0,
    abrigo: false,
    agua: true,
    texto: 'A água corre perto, boa para encher os cantis de manhã. O barulho dela cobre passos.',
  },
  saliencia: {
    id: 'saliencia',
    nome: 'Saliência de pedra',
    cd: 12,
    terrenos: ['comum', 'ermo'],
    ocultacao: 2,
    vigia: 2,
    abrigo: true,
    texto: 'Uma língua de rocha que faz teto de um lado e parede do outro. Só uma frente para vigiar.',
  },
  arvore: {
    id: 'arvore',
    nome: 'Carvalho velho',
    cd: 12,
    terrenos: ['farto', 'comum'],
    ocultacao: 1,
    vigia: 3,
    abrigo: true,
    texto: 'Galho grosso o bastante para alguém subir e ver a trilha inteira enquanto os outros dormem.',
  },
  ruina: {
    id: 'ruina',
    nome: 'Ruína antiga',
    cd: 15,
    terrenos: ['comum', 'ermo'],
    ocultacao: 3,
    vigia: 2,
    abrigo: true,
    texto: 'Três paredes de pedra e meio telhado, de alguma coisa que ninguém lembra mais. Fica de pé há séculos.',
  },
};

/**
 * Como o grupo divide a noite.
 *   `horas`  quanto cada vigia fica acordado — e é isso que decide o descanso;
 *   `quantos(vivos)` quantas pessoas entram no revezamento.
 */
export const VIGIAS = {
  revezam: {
    id: 'revezam',
    nome: 'Todos revezam',
    horas: HORAS_LEVES,
    quantos: (n) => n,
    resumo: 'duas horas cada um — cabe nas duas horas de atividade leve, e todos descansam. Com menos de quatro pessoas, sobra noite sem ninguém de olho',
  },
  dois: {
    id: 'dois',
    nome: 'Os dois mais atentos',
    horas: HORAS_DA_NOITE / 2,
    quantos: (n) => Math.min(2, n),
    resumo: 'quatro horas cada um: a noite inteira coberta pelos melhores olhos, mas esses dois trocam o descanso longo por um curto',
  },
  ninguem: {
    id: 'ninguem',
    nome: 'Ninguém fica de vigia',
    horas: 0,
    quantos: () => 0,
    resumo: 'todos dormem a noite inteira — e nada acorda o grupo antes da primeira mordida',
  },
};

const CD_DO_TERRENO = { farto: 10, comum: 12, ermo: 15 };

/**
 * Procura um lugar de acampar. Um teste de Sobrevivência de quem procura; o
 * resultado abre os lugares de `cd` até o total. O chão aberto está sempre ali.
 *
 * Devolve { teste, cd, quem, lugares: [LUGARES] }.
 */
export function procurarLugar(rng, quem, { terreno = 'comum', vantagem = false } = {}) {
  const cd = CD_DO_TERRENO[terreno] ?? CD_DO_TERRENO.comum;
  const teste = quem ? d20(rng, skillBonus(quem, 'sobrevivencia'), { advantage: vantagem }) : { total: 0 };
  const lugares = Object.values(LUGARES)
    .filter((l) => l.terrenos.includes(terreno) && l.cd <= teste.total)
    .sort((a, b) => a.cd - b.cd);
  return { teste: teste.total, cd, quem, lugares };
}

/** O acampamento montado, como a noite vai usá-lo. */
export function montarAcampamento({ lugar = 'aberto', fogueira = true, vigia = 'revezam', herois = [], chamaContinua = false, cabana = false } = {}) {
  const l = LUGARES[lugar] ?? LUGARES.aberto;
  const v = VIGIAS[vigia] ?? VIGIAS.revezam;
  const vivos = herois.filter((c) => !c.dead);
  // Quem entra no revezamento: todos, os dois de melhor Percepção passiva, ou
  // ninguém. A ordem é por olho, que é quem vai de vigia primeiro.
  const porOlho = [...vivos].sort((a, b) => passivePerception(b) - passivePerception(a));
  const vigias = porOlho.slice(0, v.quantos(vivos.length));
  return { lugar: l, fogueira, vigia: v, vigias, herois: vivos, chamaContinua, cabana };
}

/**
 * Quanto da noite tem alguém de olho, de 0 a 1. Cada vigia cobre `horas` das
 * oito; com gente de menos, sobra noite sem ninguém acordado — e é nessa
 * fresta que o bando chega sem ser visto.
 */
export function coberturaDaNoite(camp) {
  const horas = camp.vigias.length * camp.vigia.horas;
  return Math.max(0, Math.min(1, horas / HORAS_DA_NOITE));
}

/**
 * Quem está de vigia na hora em que alguma coisa chega. Só UMA pessoa está
 * acordada de cada vez: o revezamento não põe o grupo inteiro de pé. Devolve
 * null quando a visita cai numa fresta sem vigia.
 */
export function vigiaDeTurno(rng, camp) {
  if (!camp.vigias.length) return null;
  const cobertura = coberturaDaNoite(camp);
  if (cobertura < 1 && rng() >= cobertura) return null;
  return camp.vigias[Math.floor(rng() * camp.vigias.length)] ?? camp.vigias[0];
}

/**
 * O que quem está de vigia enxerga: a Percepção passiva dela, mais o que o
 * lugar ajuda e a luz da fogueira. Sem ninguém acordado, zero.
 *
 * Sem `quem`, devolve a MÉDIA de quem se reveza: é o número que a tela do
 * acampamento mostra antes de a noite rolar, porque na hora da escolha ainda
 * não se sabe quem estará de pé.
 */
export function atencaoDaVigia(camp, quem = null) {
  if (!camp.vigias.length) return 0;
  // A Chama Contínua ilumina como tocha e não é fogo: dá a mesma vigia que a
  // fogueira e não entrega o acampamento (`ocultacaoDoAcampamento`).
  const luz = camp.fogueira || camp.chamaContinua ? 2 : 0;
  const extra = camp.lugar.vigia + luz;
  if (quem) return passivePerception(quem) + extra;
  const soma = camp.vigias.reduce((n, c) => n + passivePerception(c), 0);
  return Math.floor(soma / camp.vigias.length) + extra;
}

/**
 * Quanto o acampamento é difícil de achar. Entra como ajuste no teste de
 * encontro da noite: esconder sobe a barra, a fogueira desce.
 */
export function ocultacaoDoAcampamento(camp) {
  return camp.lugar.ocultacao - (camp.fogueira ? 2 : 0);
}

/**
 * A Pequena Cabana fecha a noite: nada entra, ninguém precisa vigiar, e o
 * descanso longo vale para todos.
 *
 * Dispensar a vigia é consequência do livro — ninguém atravessa a cúpula, não
 * há o que vigiar. Já a noite não sortear encontro nenhum (`game/regiao.js`) é
 * REGRA DA CASA: no livro a cúpula é opaca mas bem visível, e um bando esperto
 * pode sentar do lado de fora e esperar as oito horas passarem.
 */
export const noiteFechada = (camp) => Boolean(camp?.cabana);

/** Quem dormiu o bastante para o descanso LONGO valer (até duas horas de vigia). */
export function descansou(c, camp) {
  if (!camp) return true;
  // Dentro da cabana ninguém precisa ficar de olho: todos dormem a noite toda.
  if (noiteFechada(camp)) return true;
  const deVigia = camp.vigias.includes(c);
  return !deVigia || camp.vigia.horas <= HORAS_LEVES;
}

/**
 * O descanso longo só recomeça do zero com uma HORA ou mais de esforço. Uma
 * luta de rodadas não chega lá: `minutos` vem de quem contou a noite
 * (`game/capitulo4-estrada.js` soma as rodadas da luta).
 */
export function noiteQuebrada(minutos) {
  return (minutos ?? 0) >= MINUTOS_QUE_QUEBRAM_O_DESCANSO;
}

/** A linha do registro: o que o grupo armou e o que isso vale. */
export function textoDoAcampamento(camp) {
  if (noiteFechada(camp)) {
    return 'Acampamento: dentro da Pequena Cabana. Nada entra, ninguém vigia, e todos dormem a noite inteira.';
  }
  const partes = [camp.lugar.nome.toLowerCase()];
  partes.push([camp.fogueira ? 'fogueira acesa' : 'sem fogo', camp.chamaContinua ? 'chama contínua' : null]
    .filter(Boolean).join(' e '));
  partes.push(camp.vigias.length
    ? `${camp.vigia.nome.toLowerCase()} (${camp.vigia.horas} h cada)`
    : 'ninguém de vigia');
  const cobertura = Math.round(coberturaDaNoite(camp) * 100);
  return `Acampamento: ${partes.join(', ')}. Atenção média ${atencaoDaVigia(camp) || 'nenhuma'}`
    + `${cobertura < 100 ? `, e só ${cobertura}% da noite com alguém de olho` : ''}.`;
}

/**
 * O que a vigia percebe quando alguma coisa chega: quem estava de pé, com que
 * atenção, e com quanta folga notou (ou não).
 *
 * `furtividades` são as rolagens de quem chega. Devolve
 * { deTurno, atencao, menor, notou, gritouATempo, dormem }.
 *
 * Regra da casa: notar com 5 ou mais de folga dá tempo de sacudir o resto do
 * acampamento; notar em cima da hora só salva quem já estava de pé.
 */
/**
 * Quem está DENTRO DA PEDRA (Fundir-se com a Pedra) não é achado por quem
 * ronda o acampamento: a magia dura oito horas, que é a noite inteira, e lá
 * dentro ninguém o vê nem o alcança. Os outros continuam à mostra — a magia é
 * de um só.
 */
export function naPedraDaNoite(herois) {
  return (herois ?? []).filter((c) => !c.dead && hasCondition(c, 'naPedra'));
}

/** Quem a noite pode achar: o grupo menos quem está dentro da pedra. */
export function aMostraNaNoite(herois) {
  return (herois ?? []).filter((c) => !c.dead && !hasCondition(c, 'naPedra'));
}

export function oQueAVigiaPercebe(rng, camp, furtividades) {
  const menor = furtividades.length ? Math.min(...furtividades) : 0;
  const deTurno = camp ? vigiaDeTurno(rng, camp) : null;
  const atencao = deTurno ? atencaoDaVigia(camp, deTurno) : 0;
  const margem = atencao - menor;
  const notou = Boolean(deTurno) && margem >= 0;
  return {
    deTurno,
    atencao,
    menor,
    margem,
    notou,
    gritouATempo: notou && margem >= 5,
    dormem: camp ? camp.herois.filter((c) => c !== deTurno) : [],
  };
}
