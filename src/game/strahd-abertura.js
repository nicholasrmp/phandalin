// Livro do Jogador não é SRD: a Maldição de Strahd é conteúdo da Wizards. O TEXTO é nosso, os fatos são os do livro — ver NOTICE.md.
//
// A ABERTURA EM BARÓVIA (a mini-aventura da Casa da Morte, Apêndice B): as névoas de Ravenloft puxam o grupo, a estrada solitária leva
// à aldeia, e na rua vazia duas crianças, Rose e Thorn, pedem ajuda: "há um monstro na nossa casa". São ilusões da própria casa, que não
// sabem o que são, e somem se atacadas ou forçadas a entrar. Não há tabuleiro: é narração e conversa, como a vila de Phandalin.
//
// O que sai daqui: 'entrar' (o grupo vai à casa) ou 'atacar' (as crianças somem e o portão se abre sozinho). Nos dois casos a casa é o
// único caminho: qualquer outra direção a névoa fecha.

import { narrar } from '../view/narrativa.js';
import { conversar } from './dialogo.js';
import { NPCS } from '../rules/npcs.js';

const pessoa = (id) => ({ id, name: NPCS[id]?.nome ?? id, look: NPCS[id]?.look ?? null });

/** As páginas de chegada: a névoa, a estrada e a aldeia vazia. */
export const CHEGADA = [
  {
    titulo: 'A névoa',
    texto: [
      'Começa como um cheiro: terra molhada e ferro. Depois a névoa sobe da estrada, grossa e fria, e engole o fim da fila. Quando alguém olha para trás, não há mais caminho para trás.',
      'Não há outra direção. A estrada de cascalho segue sozinha por entre árvores tortas, e a névoa fecha qualquer trilha que vocês tentem tomar para o lado.',
    ],
  },
  {
    titulo: 'Baróvia',
    texto: [
      'A estrada desemboca numa aldeia: casas altas e estreitas, escuras como lápides, e um punhado de lojas fechadas. Até a taverna está de portas trancadas. Nenhuma chaminé fuma.',
      'No meio da rua sem vida, duas crianças. Um menino pequeno chora baixinho, apertando uma boneca de pano; a menina mais velha tenta calá-lo com a mão no ombro dele.',
    ],
  },
];

/** A conversa com as crianças. `rose` fala; Thorn só aparece na narração, porque quase não fala. */
export function arvoreDasCriancas() {
  const volta = [{ texto: '…', vai: 'oi' }];
  return {
    inicio: 'oi',
    nos: {
      oi: {
        narra: 'A menina se vira para vocês quando ouve os passos. Os olhos dela são grandes e cansados, e não deixam a casa de tijolos do outro lado da rua, de janelas negras e portão de ferro entreaberto.',
        fala: 'Tem um monstro lá em casa. A gente não volta enquanto ele estiver lá dentro.',
        opcoes: [
          { texto: 'Que monstro?', vai: 'monstro', uma: true },
          { texto: 'Onde estão os pais de vocês?', vai: 'pais', uma: true },
          { texto: 'Mais alguém está na casa?', vai: 'bebe', uma: true },
          { texto: 'Olhar as duas crianças com atenção.', teste: { pericia: 'intuicao', cd: 14 }, sucesso: 'estranhas', falha: 'comum', uma: true },
          { texto: 'Vamos ver essa casa.', vai: 'entrar' },
          { texto: 'Seguir adiante, para fora da aldeia.', vai: 'nevoa' },
          { texto: 'Levantar a arma contra as crianças.', vai: 'ataque' },
        ],
      },
      monstro: {
        narra: 'Ela hesita, escolhendo as palavras como quem já foi desmentida antes.',
        fala: 'A gente nunca viu. Só ouve. Os uivos vêm lá de baixo, do porão. O papai e a mamãe mantêm o bicho preso.',
        opcoes: volta,
      },
      pais: {
        fala: 'Gustav e Elisabeth Durst. Mandaram a gente esperar na rua. Já faz muito tempo.',
        opcoes: volta,
      },
      bebe: {
        narra: 'O menino levanta o rosto molhado e dá uma fungada longa antes de a irmã responder por ele.',
        fala: 'Tem o Walter, o nosso irmãozinho. Ele ainda é bebê, está no berçário, lá em cima, no terceiro andar. Sozinho.',
        opcoes: volta,
      },
      estranhas: {
        ao: (ctx) => { (ctx.app.campanha.strahd ??= {}).criancasSaoIlusoes = true; },
        narra: 'Nenhum fiapo de vapor sai da boca das duas, mesmo no frio da névoa. Os pés descalços do menino não deixam marca na lama, e eles não piscam quando a luz muda. A menina sustenta o olhar de vocês sem entender o que há para ver.',
        fala: 'Que foi? Por que vocês estão olhando assim?',
        opcoes: volta,
      },
      comum: {
        narra: 'Duas crianças magras e assustadas, de roupas de outro século. Nada além disso.',
        opcoes: volta,
      },
      nevoa: {
        narra: 'Basta dar três passos para longe da casa e a aldeia desaparece: a névoa vem branca e rápida, e engole os telhados um a um. Quem insiste ouve a própria respiração voltar de todos os lados.',
        fala: 'Não adianta. A neblina vem sempre que alguém tenta ir embora. Só a nossa casa fica.',
        opcoes: volta,
      },
      ataque: {
        narra: 'A lâmina atravessa a menina sem resistência, como atravessaria fumaça. As duas crianças se desfazem em fiapos pálidos que sobem e somem, e o menino ainda está chorando quando já não há ninguém. Atrás de vocês, o portão de ferro da casa range e se abre mais um palmo, sozinho.',
        ao: (ctx) => { (ctx.app.campanha.strahd ??= {}).criancasSumiram = true; },
        opcoes: [{ texto: 'Ir até a casa.', fim: 'atacar' }],
      },
      entrar: {
        narra: 'Ela hesita, depois aponta o pórtico de pedra.',
        fala: 'A gente espera aqui, debaixo da luz. Mas não demorem, por favor.',
        ao: (ctx) => { (ctx.app.campanha.strahd ??= {}).criancasEsperam = true; },
        opcoes: [{ texto: 'Atravessar o portão.', fim: 'entrar' }],
      },
    },
  };
}

/**
 * Narra a chegada e conversa com as crianças. Devolve 'entrar' ou 'atacar'.
 * @param {object} app o aplicativo (`root`, `campanha`)
 */
export async function abrirBarovia(app) {
  app.campanha ??= {};
  app.campanha.strahd ??= {};
  await narrar(app.root, { formato: 'painel', paginas: CHEGADA });
  const fim = await conversar(app, pessoa('rose'), arvoreDasCriancas());
  app.campanha.strahd.aberturaFeita = true;
  return fim === 'atacar' ? 'atacar' : 'entrar';
}
