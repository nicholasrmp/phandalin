// Os itens nomeados da Mina Perdida de Phandelver.
//
// LICENÇA — LEIA ANTES DE MEXER
// Os NOMES (Talon, Lightbringer, Hew, Dragonguard, Cajado Aranha, Cajado de
// Defesa, Forja das Magias) são usados sob a Fan Content Policy da Wizards of
// the Coast, que permite nome e conceito em obra de fã gratuita. É por isso
// que este jogo não pode cobrar nada: o dia em que cobrar, esta pasta vira
// problema.
//
// As MECÂNICAS vêm da aventura. Regra não é texto, e número não é expressão.
//
// As DESCRIÇÕES são escritas aqui, para este projeto. Nenhuma linha abaixo é
// transcrita nem parafraseada de perto do módulo publicado. Se você for
// acrescentar um item, escreva a frase com as suas palavras — copiar a do
// livro é o que transforma fan content em infração.
//
// Por isso `fonte: 'propria'` em tudo: não é SRD, e não dá para conferir num
// documento aberto. Quem auditar este repositório tem de ver isso de longe.

const nomeado = (id, name, raridade, desc, extra = {}) => ({
  id, name, tipo: 'mágico', art: 'arcano', pilha: false,
  raridade, sintonia: false, peso: 2, desc,
  fonte: 'propria', campanha: 'phandelver', ...extra,
});

export const PHANDELVER_ITEMS = {
  // ------------------------------------------- saídas da Forja das Magias ----
  talon: nomeado('talon', 'Talon', 'incomum',
    'Espada longa +1 com um falcão gravado no copo. A lâmina acende sozinha quando há orc por perto.',
    { tipo: 'arma mágica', art: 'espada', peso: 3, bonusAtaque: 1, bonusDano: 1, base: 'espadaLonga' }),

  lightbringer: nomeado('lightbringer', 'Lightbringer', 'incomum',
    'Maça +1 consagrada ao deus da aurora. Uma palavra e a cabeça pega fogo: mais 1d6 de radiante, e luz plena em 6 m.',
    { tipo: 'arma mágica', art: 'maca', peso: 4, bonusAtaque: 1, bonusDano: 1, base: 'maca', danoExtra: '1d6', tipoExtra: 'radiante' }),

  hew: nomeado('hew', 'Hew', 'incomum',
    'Machado de batalha +1 que corta madeira como quem corta pão. Contra criatura vegetal, mais 1d8 e o golpe não fecha.',
    { tipo: 'arma mágica', art: 'machado', peso: 4, bonusAtaque: 1, bonusDano: 1, base: 'machadoDeBatalha', danoExtra: '1d8', contra: 'planta' }),

  dragonguard: nomeado('dragonguard', 'Dragonguard', 'raro',
    'Peitoral +1 lavrado com escamas. Resistência ao sopro de dragão, e vantagem para não se abalar com a presença de um.',
    { tipo: 'armadura mágica', art: 'escudo', peso: 20, sintonia: true, acBonusArmadura: 1, base: 'peitoral' }),

  cajadoAranha: nomeado('cajadoAranha', 'Cajado Aranha', 'raro',
    'Bordão +1 de madeira negra com uma aranha esculpida no topo. Dez cargas: Teia, Caminhar em Paredes e Nuvem de Aranhas.',
    { tipo: 'cajado', art: 'cajado', peso: 4, sintonia: true, bonusAtaque: 1, bonusDano: 1, base: 'bordao', cargas: 10 }),

  cajadoDeDefesa: nomeado('cajadoDeDefesa', 'Cajado de Defesa', 'incomum',
    'Bordão de ponta recurvada com seis cargas. Gasta uma para Armadura Arcana, uma para Escudo. Recarrega ao amanhecer.',
    { tipo: 'cajado', art: 'cajado', peso: 4, sintonia: true, base: 'bordao', cargas: 6 }),

  // ------------------------------------------------ tesouro com nome próprio ----
  penteDeAgatha: nomeado('penteDeAgatha', 'Pente de prata de Agatha', 'incomum',
    'Pente de prata trabalhada. A banshee que o perdeu responde a uma pergunta de quem o devolver.',
    { tipo: 'maravilhoso', peso: 0.5, valor: 25 }),

  esmeraldaDoAranhaNegra: nomeado('esmeraldaDoAranhaNegra', 'Pingente de esmeralda', 'incomum',
    'Esmeralda num fio de prata, do tipo que um drow usa para pagar favores que não quer dever.',
    { tipo: 'maravilhoso', peso: 0, valor: 100 }),

  estatuetaDeSapo: nomeado('estatuetaDeSapo', 'Sapo de jade', 'comum',
    'Estatueta de jade do tamanho de um punho, com olhos de pedra dourada. Vale mais pelo lapidário que pelo peso.',
    { tipo: 'maravilhoso', peso: 1, valor: 40 }),

  // ----------------------------------------------------- pergaminhos de magia ----
  // A aventura espalha vários. Entram como um item por magia, porque é assim
  // que um pergaminho funciona: ele é a magia, e some ao ser lido.
  pergaminhoDeMagia: nomeado('pergaminhoDeMagia', 'Pergaminho de magia', 'comum',
    'Uma única magia escrita para ser lida uma vez só. O pergaminho vira cinza junto com a conjuração.',
    { tipo: 'pergaminho', art: 'arcano', pilha: true, peso: 0, consumivel: 'magia', acao: 'acao' }),
};

/**
 * O que cada encontro da campanha pode largar.
 *
 * Fica aqui, e não em `encounter.js`, porque é tabela de TESOURO e não de
 * monstro: quem mexe no que o Aranha Negra carrega não devia ter de abrir o
 * arquivo que monta o tabuleiro. As chaves são ids de criatura.
 */
export const TESOURO_POR_INIMIGO = {
  nezznar: ['cajadoAranha', 'esmeraldaDoAranhaNegra'],
  iarno: ['cajadoDeDefesa', 'pocaoDeCura'],
  chefeGoblin: ['pocaoDeCura'],
  hobgoblin: ['moedaDeOuro'],
};
