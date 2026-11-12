// AS ARMADILHAS E OS PERIGOS DO LIVRO DO MESTRE, como MODELO de região (`regioes.js`). O número é do livro (a CD de
// achar, a do teste, o dano); o texto, nosso. Cada modelo é uma função `(id, casas) → [região, ...]`: o editor (ferramenta
// R, "Modelo do livro") a aplica sobre as casas já pintadas, e uma cena a chama no mapa dela.
//
// O que fica de fora, e por quê:
//   a esfera rolante       anda pelo corredor a cada rodada, e a região não se move;
//   a esfera da aniquilação  fica de fora com o item (`itens/dmg-pendente.json`);
//   o lodo verde           gruda na criatura e corrói até ser raspado: é dela, não do chão;
//   o chão profanado, o frio, o calor, o vento, a altitude, a chuva, a água gelada  são do clima da viagem, não de uma casa
//   o dano improvisado     é a tabela do mestre para o que o livro não previu.
// A agulha envenenada não é região: mora na fechadura (`mapa.trancas`, `agulha: true`, `game/portas.js`).

const UMA = (id, nome, casas, extra) => ({ id, nome, casas: [...casas], quando: ['entrar'], ...extra });

export const MODELOS_DO_LIVRO = {
  // ---------------------------------------------------------------------------------------------- armadilhas ----
  tetoQueDesaba: {
    nome: 'Teto que desaba',
    fazer: (id, casas) => [
      UMA(id, 'O teto', casas, {
        vezes: 1,
        escondida: { cd: 10, achado: 'Um fio esticado rente ao chão, preso às duas vigas; o teto em cima está rachado e escorado.' },
        efeitos: [
          { tipo: 'texto', texto: 'O fio cede, as vigas tombam e o teto vem abaixo.' },
          { tipo: 'dano', dados: '4d10', dano: 'concussão', teste: { atributo: 'dex', cd: 15, metade: true }, alvo: 'todos' },
          { tipo: 'alternar', regiao: `${id}Entulho`, ligada: true },
        ],
      }),
      UMA(`${id}Entulho`, 'O entulho', casas, { desligada: true, efeitos: [{ tipo: 'terrenoDificil' }] }),
    ],
  },
  redeQueCai: {
    nome: 'Rede que cai',
    fazer: (id, casas) => [UMA(id, 'A rede', casas, {
      vezes: 1,
      escondida: { cd: 10, achado: 'Um fio rente ao chão, e no alto, entre as teias, a sombra de uma rede dobrada.' },
      efeitos: [
        { tipo: 'texto', texto: 'O fio puxa, e uma rede pesada cai do alto.' },
        { tipo: 'condicao', condicao: 'contido', escape: 10, alvo: 'todos' },
        { tipo: 'condicao', condicao: 'caido', teste: { atributo: 'str', cd: 10 }, escape: false, alvo: 'todos' },
      ],
    })],
  },
  estatuaQueCospeFogo: {
    nome: 'Estátua que cospe fogo',
    // `casas` é a placa; o cone de 9 m que a estátua solta vai em `cone` (as casas que o fogo pega)
    fazer: (id, casas, { cone = casas } = {}) => [UMA(id, 'A estátua', casas, {
      escondida: { cd: 15, achado: 'Uma placa no chão que cede um dedo, e marcas de queimado nas paredes em volta da estátua.' },
      efeitos: [
        { tipo: 'texto', texto: 'A placa afunda, e a boca da estátua solta um jorro de fogo.' },
        { tipo: 'dano', dados: '4d10', dano: 'fogo', teste: { atributo: 'dex', cd: 13, metade: true }, alvo: 'todos', casas: [...cone] },
      ],
    })],
  },
  fossoSimples: {
    nome: 'Fosso simples (3 m)',
    fazer: (id, casas) => [UMA(id, 'O fosso', casas, {
      escondida: { cd: 10, achado: 'Um pano esticado e coberto de terra: debaixo dele, o chão não continua.' },
      efeitos: [{ tipo: 'texto', texto: 'O pano cede, e o chão some.' }, { tipo: 'dano', dados: '1d6', dano: 'concussão' }, { tipo: 'parar' }],
    })],
  },
  fossoEscondido: {
    nome: 'Fosso escondido (3 m, alçapão)',
    fazer: (id, casas) => [UMA(id, 'O alçapão', casas, {
      escondida: { cd: 15, achado: 'Ninguém pisa aqui faz tempo: a poeira desenha um quadrado, e o quadrado é uma tampa.' },
      efeitos: [{ tipo: 'texto', texto: 'O chão vira como uma porta, e quem estava em cima cai.' }, { tipo: 'dano', dados: '1d6', dano: 'concussão' }, { tipo: 'parar' }],
    })],
  },
  fossoComEstacas: {
    nome: 'Fosso com estacas (3 m)',
    fazer: (id, casas) => [UMA(id, 'O fosso de estacas', casas, {
      escondida: { cd: 15, achado: 'Debaixo da tampa falsa, pontas de ferro no fundo.' },
      efeitos: [
        { tipo: 'texto', texto: 'A tampa cede, e o fundo tem estacas.' },
        { tipo: 'dano', dados: '1d6', dano: 'concussão' },
        { tipo: 'dano', dados: '2d10', dano: 'perfurante' },
        { tipo: 'parar' },
      ],
    })],
  },
  dardosEnvenenados: {
    nome: 'Dardos envenenados',
    fazer: (id, casas) => [UMA(id, 'Os dardos', casas, {
      escondida: { cd: 15, achado: 'Furinhos nas paredes, escondidos no pó, e uma pedra do chão de outra argamassa.' },
      efeitos: [
        { tipo: 'texto', texto: 'Um estalo, e dardos saem das paredes.' },
        { tipo: 'dardos', n: 4, ataque: 8, dados: '1d4', dano: 'perfurante', raioPes: 10, veneno: { cd: 15, dano: '3d10', metade: true } },
      ],
    })],
  },

  // ------------------------------------------------------------------------------------------------ perigos ----
  mofoAmarelo: {
    nome: 'Mofo amarelo',
    fazer: (id, casas) => [UMA(id, 'O mofo amarelo', casas, {
      escondida: { cd: 10, achado: 'Uma mancha amarela e pulverulenta: quem encostar solta os esporos.' },
      efeitos: [
        { tipo: 'texto', texto: 'O mofo se desfaz numa nuvem de esporos amarelos.' },
        { tipo: 'dano', dados: '2d10', dano: 'veneno', teste: { atributo: 'con', cd: 15 }, seFalhar: 'envenenado', alvo: 'todos' },
      ],
    })],
  },
  trepadeiraNavalha: {
    nome: 'Trepadeira-navalha',
    fazer: (id, casas) => [UMA(id, 'A trepadeira-navalha', casas, {
      quando: ['entrar', 'comecaTurno'],
      efeitos: [{ tipo: 'terrenoDificil' }, { tipo: 'dano', dados: '1d10', dano: 'cortante', teste: { atributo: 'dex', cd: 10 } }],
    })],
  },
  teias: {
    nome: 'Teias',
    fazer: (id, casas) => [UMA(id, 'As teias', casas, {
      efeitos: [{ tipo: 'terrenoDificil' }, { tipo: 'condicao', condicao: 'contido', teste: { atributo: 'dex', cd: 12 }, escape: 12 }],
    })],
  },
  geloEscorregadio: {
    nome: 'Gelo escorregadio',
    fazer: (id, casas) => [UMA(id, 'O gelo', casas, {
      efeitos: [{ tipo: 'terrenoDificil' }, { tipo: 'condicao', condicao: 'caido', teste: { atributo: 'dex', cd: 10 }, escape: false }],
    })],
  },
  areiaMovedica: {
    nome: 'Areia movediça',
    fazer: (id, casas) => [UMA(id, 'A areia movediça', casas, {
      escondida: { cd: 10, achado: 'A areia aqui é lisa demais, e treme quando o vento passa.' },
      efeitos: [{ tipo: 'texto', texto: 'A areia engole as pernas.' }, { tipo: 'condicao', condicao: 'contido', escape: 12 }, { tipo: 'parar' }],
    })],
  },
};

/** As regiões de um modelo, com o `id` e as casas dados. */
export function regioesDoModelo(modelo, id, casas, opcoes = {}) {
  const m = MODELOS_DO_LIVRO[modelo];
  if (!m) throw new Error(`modelo de armadilha desconhecido: ${modelo}`);
  return m.fazer(id, casas, opcoes);
}
