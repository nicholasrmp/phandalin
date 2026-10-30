// O RELÓGIO DA VILA: `campanha.vila.dia` e `campanha.vila.tempo`.
//
// `tempo` conta MOMENTOS do dia, nunca horas: seis por dia, e cada coisa que o
// grupo faz na vila gasta um. Passado o último, é noite e as lojas fecham.
// Quem vira o dia é dormir (`game/phandalin.js`) ou chegar de viagem
// (`game/regiao.js`), que zeram o contador.
//
// Isto mora num arquivo só porque o campo já teve TRÊS significados ao mesmo
// tempo: momentos aqui, horas somadas direto no contador em
// `capitulo4-cume.js`, e horas de novo numa conta `dia * 24 + tempo` em
// `conyberry.js`. O efeito era real — quem ofendia a banshee fora do primeiro
// momento do dia continuava barrado depois de dormir uma noite, porque a conta
// dela comparava maçã com laranja. Com o relógio num lugar, a unidade é uma.

export const MOMENTOS = ['manhã', 'manhã', 'tarde', 'tarde', 'fim de tarde', 'fim de tarde'];
export const MOMENTOS_POR_DIA = MOMENTOS.length;

/** O nome do momento; depois do último, 'noite'. */
export const nomeDoMomento = (t) => MOMENTOS[t] ?? 'noite';

/** Passou do último momento do dia: as lojas fecham. */
export const deNoite = (t) => t >= MOMENTOS_POR_DIA;

/**
 * Gasta horas de relógio no contador de momentos.
 *
 * Um momento é um pedaço do dia, não uma hora exata: duas horas de trabalho
 * gastam um, e qualquer coisa gasta pelo menos um. Não vira o dia — isso é de
 * dormir —, e para no fim do dia: a partir dali é noite, e continua noite.
 */
export function gastarHoras(vila, horas) {
  if (!vila || vila.tempo == null) return;
  vila.tempo = Math.min(MOMENTOS_POR_DIA, vila.tempo + Math.max(1, Math.ceil((horas ?? 0) / 2)));
}
