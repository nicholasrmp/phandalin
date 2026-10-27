// O que as magias de utilidade REVELAM nas cenas: pensamentos de superfície
// (Detectar Pensamentos), respostas dos mortos (Falar com os Mortos) e o que os
// bichos sabem (Falar com Animais).
//
// TEXTO NOSSO. Cada linha é coerente com o que a cena já diz dessa criatura nas
// árvores de conversa; não acrescenta fatos de aventura que o jogo não tenha.
// A chave é o `defId` do monstro (ou o `id` de um NPC solto da vila).

/**
 * Detectar Pensamentos. `padrao` vale em qualquer nó; `nos` troca a linha de um
 * nó específico da conversa (o que ele pensa enquanto diz aquilo).
 */
export const PENSAMENTOS = {
  droop: {
    padrao: 'Medo em ondas curtas: "Droop não é guarda, Droop só carrega lenha". Por baixo do medo, uma imagem nítida: dois corredores, um guarda que dorme encostado na parede e outro, de arco, que nunca dorme.',
    nos: {
      desconfia: 'Ele pensa em fugir, e em quanto o chefe grande bate quando um goblin fala demais. A língua só não solta por medo disso.',
      conta: 'Nenhuma mentira: ele conta o que vê todo dia, e tem vergonha de ter contado.',
    },
  },
  goblin: {
    padrao: 'Fome, frio, o rosto do chefe grande e uma vontade só: sair vivo. Nada que ele esconda além do medo.',
  },
  yeemik: {
    padrao: 'A cabeça dele é uma conta: quer o bugbear morto e o bando inteiro sob um só nome, o dele. O refém é a moeda, e ele sabe exatamente o que vale.',
  },
  vigiaCiclopico: {
    padrao: 'Fome, em ondas, e uma ordem velha do "mago que dá pouca comida". O pensamento dele não sabe disfarçar: se vê comida, o olho abaixa.',
  },
  cajavidro: {
    padrao: 'Atrás da pose calma, contas rápidas: o que entregar para sair inteiro. A palavra "aranha" volta mais de uma vez, sempre com medo.',
  },
  iarno: {
    padrao: 'Atrás da pose calma, contas rápidas: o que entregar para sair inteiro. A palavra "aranha" volta mais de uma vez, sempre com medo.',
  },
  plebeu: {
    padrao: 'Só medo, e três nomes da família repetidos baixinho, como reza.',
  },
  marcarrubra: {
    padrao: 'Cansaço, uma partida de dados que ficou no meio e a dúvida de quanto vale uma capa vermelha numa noite sem saque.',
  },
  _geral: 'Um burburinho de cansaço, fome e desconfiança, nada que ele pense em palavras inteiras.',
};

/**
 * Falar com os Mortos: até cinco perguntas, respostas curtas e cruas, só do
 * que o morto sabia (no idioma dele). `muda` = não aprendeu língua nenhuma.
 */
export const MORTOS = {
  goblin: [
    ['Quem mandou vocês?', 'Klarg mandou. Klarg só manda porque o Rei Grol manda mais alto.'],
    ['O que aconteceu aqui?', 'Flecha. Escuro. Dor. Depois nada.'],
    ['Onde fica o esconderijo?', 'Pela trilha, perto. Menos de vinte de nós lá dentro.'],
    ['Quem é o Aranha Negra?', 'Nome de quem paga. Goblin nunca viu a cara.'],
    ['Tem algum recado?', 'Diz pra mãe do Nug que ele não voltou.'],
  ],
  marcarrubra: [
    ['Quem manda aqui?', 'O Cajavidro. O mago de vidro. Manda e não sai do quarto.'],
    ['Para quem ele trabalha?', 'Uma aranha. Nunca vi a cara. Só o bilhete dobrado.'],
    ['Como se entra e se sai?', 'Pela cozinha caída, escada abaixo. A porta do depósito de armas é trancada.'],
    ['Quem tem a chave das celas?', 'O chefe dos bugbears. Anda com ela no cinto.'],
    ['Algo que a gente devia saber?', 'Tem fosso coberto no corredor das colunas. Passa rente à parede.'],
  ],
  bugbear: [
    ['Quem manda aqui?', 'Eu mando nos bugbears. O mago manda em mim, e só enquanto paga.'],
    ['Onde está a chave?', 'No cinto. Quem me matou já pegou, ou vai pegar.'],
  ],
  plebeu: [
    ['Quem fez isto?', 'Os de capa vermelha. Riam.'],
    ['Alguém mais sobreviveu?', 'A família. Eles estão nas jaulas. Tirem eles.'],
  ],
  _muda: 'O corpo não aprendeu língua nenhuma em vida. A magia só lhe arranca um suspiro, e mais nada.',
  _geral: [
    ['Quem foi a última pessoa que você viu?', 'Um rosto. O escuro veio depressa.'],
    ['Como morreu?', 'Dor, e depois frio.'],
  ],
};
/** Quem não responde a Falar com os Mortos (sem língua ou sem boca). */
import { SEM_VOZ } from '../rules/utilidade.js';
export const MUDOS = SEM_VOZ;

/** Falar com Animais: o que o bicho tem a dizer (cheiro, medo, fome, dono). */
export const ANIMAIS = {
  lobo: {
    nome: 'lobo',
    falas: [
      ['Quem prendeu vocês?', 'Goblin que cheira a fumaça. Bate com pau. A corrente é do grande de pelo no queixo.'],
      ['Tem mais lobos?', 'Mais fundo, onde a água faz barulho. O lobo grande dorme perto do dono.'],
      ['O que vocês querem?', 'Carne. Que a corrente solte. Que ninguém grite.'],
    ],
  },
  ratoGigante: {
    nome: 'rato',
    falas: [
      ['Quem te dá comida?', 'O de vidro. Restos de queijo, quando lembra.'],
      ['Você avisa quando alguém entra?', 'Guincho. Ele me deu um guincho para isso e um pedaço a mais.'],
    ],
  },
  _geral: {
    nome: 'bicho',
    falas: [['O que você viu por aqui?', 'Cheiro de gente, de ferro, de fumaça. Pouco mais.']],
  },
};

/** O tipo dos que Falar com Animais alcança (bichos de verdade, não monstros). */
export const eAnimal = (c) => c && (c.tipo === 'fera' || ANIMAIS[c.defId] != null) && c.defId !== 'esqueleto';
