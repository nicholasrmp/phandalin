// A TRANSFORMAÇÃO DOS HERÓIS (o Obelisco, "Character Transformation"): a regra OPCIONAL do livro em que o Reino Distante
// muda o próprio herói, um estágio por capítulo, do 5 ao 8 — e que só vale para o jogador que aceitar. Quem recusa não perde
// nada: é o que o livro diz, e é o que o jogo faz.
//
// O QUE É DO LIVRO (a regra; o texto é nosso):
//   - o consentimento de cada jogador antes de tudo;
//   - os quatro estágios, um por capítulo (o 1º no capítulo 5, o 4º no 8), que seguem o estágio da vila (`vila-reino.js`);
//   - em cada estágio, um efeito sorteado (d6, d4, d6, d6), que soma com os de antes;
//   - no fim, vencida a Refração, cada um decide se fica com o que mudou.
// O QUE O JOGO FAZ COM ISSO: o estágio 3, resultado 1 (as aberrações o veem como um dos seus) dá vantagem nos testes de
// Carisma contra aberração (`utilidade.js modificadores`), que é o exemplo de efeito de jogo que o livro sugere; e o
// Lowarnizel e a Gossa, que odeiam Ilvaash, cobram explicação de quem mostra a mudança no corpo (`labirinto-salgado.js`).
// O resto é narração: aparece na chegada à vila e na aba História da ficha (`view/ficha.js`).
//
// O estado mora no próprio herói: `c.transformacao = { aceita, efeitos: { 1: n, 2: n, ... }, fica? }`.
import { narrar } from '../view/narrativa.js';
import { estagioDaVila } from './vila-reino.js';

/** Os efeitos de cada estágio, na ordem do dado. Texto nosso. */
export const EFEITOS_DA_TRANSFORMACAO = {
  1: [
    'acorda de pesadelos com uma voz de verdade, que manda ir a um lugar ou fazer uma coisa, e quem dorme perto também a ouve',
    'ouve, e quem está perto ouve junto, cochichos de conspirações absurdas',
    'reconhece, de vez em quando, uma palavra perturbadora numa língua que não sabe',
    'enxerga desenhos estranhos nas coisas de todo dia e no jeito como os fatos se encadeiam',
    'acha objetos que não conhece em lugares que conhece bem',
    'às vezes, ao falar, ouve sair da própria garganta uma voz que não é a sua',
  ],
  2: [
    'sente uma parte do corpo girar uma volta inteira, sozinha, e voltar ao lugar',
    'ganha um olho ou uma boca a mais, que não obedecem',
    'vê saliências de osso correrem por baixo da pele, de vez em quando',
    'tem um tentáculo novo, que às vezes apanha coisas pequenas sem pedir licença',
  ],
  3: [
    'é visto pelas aberrações como um dos seus',
    'faz zumbir, brilhar ou tremer o que é do Reino Distante, quando chega perto',
    'tem uma vontade que não quer: carne crua, comida estragada, insetos, cabelo, unha',
    'acha escritos e desenhos na própria letra, que tem certeza de não ter feito',
    'às vezes fala por telepatia sem querer, em vez de abrir a boca',
    'deixa, às vezes, marcas pretas de lodo nas coisas em que toca',
  ],
  4: [
    'a até 9 m, ninguém mais faz sombra',
    'a até 9 m, o que ninguém segura muda de lugar sozinho',
    'a até 9 m, os espelhos não refletem nada',
    'a até 9 m, os animais se espantam',
    'a até 9 m, a comida apodrece',
    'a até 9 m, o ar esquenta ou esfria sem motivo',
  ],
};
const DADO = { 1: 6, 2: 4, 3: 6, 4: 6 };
const NOME_DO_ESTAGIO = { 1: 'o Reino Distante chama', 2: 'o corpo muda', 3: 'o vazio entra na alma', 4: 'a realidade entorta em volta' };

/** O estágio da transformação agora: 0 (antes do capítulo 5, ou curado) a 4, um por capítulo. */
export function estagioDaTransformacao(camp) {
  const v = estagioDaVila(camp);
  return v ? v - 4 : 0;
}

/** As mudanças do herói, em frases (para a ficha). Vazio para quem recusou ou não mudou. */
export function mudancasDoHeroi(c) {
  const t = c?.transformacao;
  if (!t?.aceita || t.fica === false) return [];
  return Object.entries(t.efeitos ?? {}).sort(([a], [b]) => a - b)
    .map(([s, n]) => `Estágio ${s}, ${NOME_DO_ESTAGIO[s]}: ${c.name} ${EFEITOS_DA_TRANSFORMACAO[s][n - 1]}.`);
}

/** Quem mostra a mudança no CORPO (o estágio 2 em diante): é o que se vê de fora. */
export const mostraAMudanca = (c) => Boolean(c?.transformacao?.aceita && c.transformacao.fica !== false && c.transformacao.efeitos?.[2]);

const painel = (app, texto, escolhas) => narrar(app.root, { formato: 'painel', paginas: [{ titulo: 'O Reino Distante', texto: [].concat(texto) }], ...(escolhas ? { escolhas } : {}) });

/**
 * Na chegada à vila: pergunta a cada herói que ainda não respondeu se o jogador aceita a regra, e sorteia o efeito de
 * cada estágio novo de quem aceitou. Vencida a Refração, pergunta uma vez se cada um fica com o que mudou.
 */
export async function avancarTransformacao(app, camp, grupo, rng) {
  const herois = (grupo ?? []).filter((c) => c && !c.dead && !c.invocado);
  if (camp.obelisco8?.feito?.refracaoVencida) return fimDaTransformacao(app, herois);
  const n = estagioDaTransformacao(camp);
  if (!n) return;
  for (const h of herois) {
    h.transformacao ??= { efeitos: {} };
    h.transformacao.efeitos ??= {};
    if (h.transformacao.aceita === undefined) {
      const r = await painel(app, [`O Reino Distante já mexe com Phandalin, e pode mexer com ${h.name} também.`,
        'É uma regra opcional: a cada capítulo, uma mudança estranha no herói — vozes, um olho a mais, um tentáculo —, que soma com as de antes e quase nunca muda a regra do jogo. Quem recusa não perde nada.'], [
        { rotulo: 'Aceitar a transformação', valor: 'sim' },
        { rotulo: 'Recusar', valor: 'nao', primaria: true },
      ]);
      h.transformacao.aceita = r === 'sim';
    }
    if (!h.transformacao.aceita) continue;
    const novas = [];
    for (let s = 1; s <= n; s++) {
      if (h.transformacao.efeitos[s]) continue;
      h.transformacao.efeitos[s] = rng.die(DADO[s]);
      novas.push(s);
    }
    if (novas.length) await painel(app, novas.map((s) => `${NOME_DO_ESTAGIO[s][0].toUpperCase()}${NOME_DO_ESTAGIO[s].slice(1)}: ${h.name} ${EFEITOS_DA_TRANSFORMACAO[s][h.transformacao.efeitos[s] - 1]}.`));
  }
}

/** Curada a vila: cada herói que mudou decide se fica com a mudança (o livro deixa a escolha à mesa). */
async function fimDaTransformacao(app, herois) {
  for (const h of herois) {
    const t = h.transformacao;
    if (!t?.aceita || !Object.keys(t.efeitos ?? {}).length || t.fica !== undefined) continue;
    const r = await painel(app, [`O Reino Distante largou Phandalin. O que ele mudou em ${h.name} pode ir embora junto, ou ficar.`, ...mudancasDoHeroi(h)], [
      { rotulo: 'Deixar ir', valor: 'nao', primaria: true },
      { rotulo: 'Ficar com a mudança', valor: 'sim' },
    ]);
    t.fica = r === 'sim';
  }
}
