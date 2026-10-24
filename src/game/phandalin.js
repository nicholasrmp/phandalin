// Capítulo 3: PHANDALIN (Parte 2 da aventura).
//
// A vila não é tabuleiro: é um MAPA com lugares e CENAS, como o livro manda
// conduzir ("um filme de faroeste": entra-se numa loja, conhece-se a pessoa,
// segue-se para a próxima). O tabuleiro volta só para as lutas — a briga com
// os Marcarrubra na rua e o esconderijo embaixo da Mansão Tresendar.
//
// O QUE É DO LIVRO: quem mora onde, o que cada um sabe e oferece, os
// rumores da estalagem, as missões e as recompensas (os 10 po de cada um pela
// carroça na Barthen, os 50 po da Linene pelos suprimentos, os 100 po da
// Halia, os 100 po do Harbin, as três poções da Garaele, os 500 e os 200 po de
// Sildar), os testes (História CD 15 na Barthen, Intuição CD 15 na Halia) e o
// ritmo: o grupo chega no fim do dia e só dá para ver um ou dois lugares
// antes de procurar onde dormir; depois de um dia ou mais, os Marcarrubra
// procuram briga.
//
// O QUE É NOSSO: todo o texto, as posições no mapa desenhado e o preço do
// quarto (o livro manda ver o Livro do Jogador: hospedagem modesta, 5 pp).
//
// O estado mora em `app.campanha.vila` e sobrevive às lutas: a vila fecha
// quando o tabuleiro abre e reabre, igual, quando a luta acaba.

import { narrar } from '../view/narrativa.js';
import { abrirTelaVila } from '../view/vila.js';
import { conversar } from './dialogo.js';
import { d20 } from '../core/dice.js';
import { skillBonus, SKILL_NAME } from '../rules/abilities.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { descansoLongoDoGrupo } from '../view/descanso-tela.js';
import { NPCS } from '../rules/npcs.js';
import { totalEmCobre, guardar, cobrar, pagarCada, repartir, LOJAS } from './comercio.js';
import { abrirLoja } from '../view/loja.js';

// ------------------------------------------------------------- o tempo ----
// Seis momentos por dia; o grupo chega no quinto (fim de tarde). Cada visita
// a um lugar gasta um. De noite, as lojas fecham.
const MOMENTOS = ['manhã', 'manhã', 'tarde', 'tarde', 'fim de tarde', 'fim de tarde'];
const nomeDoMomento = (t) => MOMENTOS[t] ?? 'noite';
const deNoite = (t) => t >= MOMENTOS.length;

// ------------------------------------------------------------ missões ----
export const MISSOES = {
  gundren: { titulo: 'Achar Gundren', de: 'Sildar Hallwinter', texto: 'Gundren Rockseeker foi levado para o Castelo Dentefino, do Rei Grol. Ninguém na vila sabe onde fica.' },
  castelo: { titulo: 'O Castelo Dentefino', de: 'Sildar Hallwinter', texto: 'Achar o Castelo Dentefino e derrotar ou expulsar o chefe da tribo.', recompensa: '500 po' },
  iarno: { titulo: 'Onde está Iarno?', de: 'Sildar Hallwinter', texto: 'Iarno Albrek, mago da Aliança dos Lordes — baixo, barba preta, uns trinta anos — sumiu explorando a Mansão Tresendar há dois meses. Achá-lo, vivo ou não.', recompensa: '200 po por acabar com os Marcarrubra' },
  marcarrubra: { titulo: 'Os Marcarrubra', de: 'a vila', texto: 'A gangue de mantos vermelhos domina Phandalin. Frequentam o Gigante Adormecido; a base deles fica embaixo da Mansão Tresendar, no leste da vila.' },
  halia: { titulo: 'A oferta de Halia', de: 'Halia Thornton', texto: 'Eliminar o líder dos Marcarrubra, o Cajavidro, e levar a ela qualquer correspondência achada no quarto dele.', recompensa: '100 po' },
  coruja: { titulo: 'Encrenca no Poço da Coruja Velha', de: 'Daran Edermath', texto: 'Na torre velha do Poço da Coruja Velha, dois dias a nordeste, há gente nova — e uns garimpeiros juram que foram postos para correr por mortos que andavam. Ir lá ver quem é, e contar ao Daran.' },
  orcs: { titulo: 'Orcs no Cume da Wyvern', de: 'Harbin Wester', texto: 'Viajantes relatam orcs perto do Cume da Wyvern, a leste pela Trilha de Triboar. Dar um jeito neles.', recompensa: '100 po' },
  agatha: { titulo: 'A barganha da banshee', de: 'Irmã Garaele', texto: 'Levar um pente de prata à banshee Agatha, em Conyberry, e convencê-la a dizer onde está o grimório do mago Arco Suave.', recompensa: 'três poções de cura' },
  reidoth: { titulo: 'Reidoth, o druida', de: 'Qelline Alderleaf', texto: 'O druida Reidoth conhece a região como poucos — talvez saiba onde fica o Castelo Dentefino. Da última vez, seguia para as ruínas de Árvore Trovão, uns 80 km a noroeste.' },
  kost: { titulo: 'O favor do Mago Vermelho', de: 'Hamun Kost', texto: 'Tirar os orcs do Cume da Wyvern, ou perguntar à banshee Agatha o nome do mago que ergueu a torre do Poço da Coruja Velha. Em troca, ele conta o que sabe. (O Cume e Conyberry ainda não estão abertos nesta versão do jogo.)' },
  mirna: { titulo: 'A herança de Mirna', de: 'Mirna Dendrar', texto: 'Um colar de esmeraldas, escondido numa caixa sob as prateleiras da antiga loja de ervas da família, no canto sudeste de Árvore Trovão. Mirna o deu a quem o achar.' },
  linene: { titulo: 'Os suprimentos da Escudo Leão', de: 'Linene Graywind', texto: 'A última caravana da Escudo Leão nunca chegou. Quem achar a carga, ou disser onde está, ganha uma recompensa.', recompensa: '50 po' },
};

// ------------------------------------------------------------ facções ----
// Quatro moradores pertencem a uma organização, e cada um convida o herói que
// mostrar as virtudes dela — mas só DEPOIS de uma façanha certa, como o livro
// manda. As façanhas são de capítulos que ainda não existem: cada capítulo,
// ao terminar, marca `app.campanha.feitos.<nome>`, e o convite aparece sozinho
// na próxima visita. O título é do livro; o texto do convite é nosso.
export const FACCOES = [
  { id: 'manopla', nome: 'Ordem da Manopla', lugar: 'pomar', npc: 'daran', titulo: 'Chevall',
    quando: (f) => f.marcarrubra && f.pocoDaCoruja,
    convite: 'Daran chama um de vocês para o fundo do pomar, longe dos outros. — A Ordem da Manopla precisa de gente que vigia e não foge. Vi como vocês lutaram. Quem de vocês aceita a manopla?' },
  { id: 'zhentarim', nome: 'Zhentarim', lugar: 'cambio', npc: 'halia', titulo: 'Presa',
    quando: (f) => f.cajavidro,
    convite: 'Halia fecha a porta do escritório. — Os Marcarrubra eram amadores. Eu represento gente que não é. Dinheiro, influência, amigos nos lugares certos. Algum de vocês tem ambição de verdade?' },
  { id: 'harpistas', nome: 'Harpistas', lugar: 'santuario', npc: 'irmaGaraele', titulo: 'Sentinela',
    quando: (f) => f.grimorioDeArcoSuave,
    convite: 'Garaele espera o santuário esvaziar. — Há uma rede de gente que sabe das coisas antes de elas acontecerem, e age em silêncio. A informação que vocês trouxeram foi preciosa. Alguém de vocês quer fazer parte?' },
  { id: 'alianca', nome: 'Aliança dos Lordes', lugar: 'salao', npc: 'sildar', titulo: 'Manto',
    quando: (f, v) => v.sildar && f.casteloDentefino && f.traicaoDeIarno,
    convite: 'Sildar pede uma palavra em particular. — A Aliança dos Lordes existe para que cidades como esta não fiquem à mercê de um Iarno. Precisamos de quem age, não de quem fala. Quem de vocês vem comigo?' },
];

// ------------------------------------------------------------- lugares ----
// Posições em % da pintura (`art/vila/phandalin.webp`): a ponta de cada
// marcador fica na porta do prédio pintado. A disposição segue o mapa do livro.
export const LUGARES = [
  { id: 'estalagem', nome: 'Estalagem Stonehill', x: 46.7, y: 45.4, npc: 'toblen', sempreAberto: true },
  { id: 'barthen', nome: 'Barthen Provisões', x: 54.6, y: 33.6, npc: 'elmar' },
  { id: 'escudoLeao', nome: 'Transações Escudo Leão', x: 34.2, y: 61.9, npc: 'linene' },
  { id: 'cambio', nome: 'Câmbio de Minério', x: 52.2, y: 75.5, npc: 'halia' },
  { id: 'salao', nome: 'Salão do Chefe da Vila', x: 47, y: 61.3, npc: 'harbin' },
  { id: 'santuario', nome: 'Santuário da Sorte', x: 38.9, y: 46.6, npc: 'irmaGaraele' },
  { id: 'pomar', nome: 'Pomar Edermath', x: 13.4, y: 53.1, npc: 'daran', sempreAberto: true },
  { id: 'fazenda', nome: 'Fazenda Alderleaf', x: 65.8, y: 69.6, npc: 'qelline', sempreAberto: true },
  { id: 'marcenaria', nome: 'Marcenaria Dendrar', x: 38, y: 69.6, npc: null, sempreAberto: true },
  { id: 'gigante', nome: 'O Gigante Adormecido', x: 71.6, y: 48.3, npc: null, sempreAberto: true },
  { id: 'mansao', nome: 'Mansão Tresendar', x: 90.2, y: 47.2, npc: null, sempreAberto: true },
];

const QUADRO = 'O prédio mais sólido da vila: pedra grossa e uma torre com sino. Pregado na porta, um papel já amarelado promete recompensa a quem der fim aos orcs vistos para os lados do Cume da Wyvern — "tratar aqui dentro". A assinatura é um borrão.';

const pessoa = (id) => ({ id, name: NPCS[id]?.nome ?? id, look: NPCS[id]?.look ?? null });

// ------------------------------------------------------------ a vila ----
/**
 * Abre a vila. `grupo` são os heróis (os mesmos objetos que vêm dos
 * capítulos anteriores). Chamado ao chegar e de novo ao fim de cada luta.
 */
export async function abrirPhandalin(app, { grupo, chegando = false } = {}) {
  const camp = (app.campanha ??= {});
  const v = (camp.vila ??= {
    dia: 1, tempo: 4, missoes: {}, pistas: [], feito: {},
    sildar: Boolean(camp.capitulo2?.sildar),
  });
  const feitos = (camp.feitos ??= {});
  app.grupoDaCampanha = grupo;
  const rng = app.rngDaVila ??= { die: (n) => 1 + Math.floor(Math.random() * n) };
  const registro = [];
  const fora = { herois: grupo, rng, say: (_k, t) => registro.push(t) };
  const vivos = () => grupo.filter((c) => !c.dead);
  const missao = (id) => { if (!v.missoes[id]) { v.missoes[id] = 'ativa'; registro.push(`Nova missão: ${MISSOES[id].titulo}.`); } };
  const concluir = (id) => { v.missoes[id] = 'feita'; };
  const pista = (t) => { if (!v.pistas.includes(t)) v.pistas.push(t); };
  const teste = (pericia, cd) => {
    const quem = vivos().reduce((a, b) => (skillBonus(b, pericia) > skillBonus(a, pericia) ? b : a));
    const r = d20(rng, skillBonus(quem, pericia));
    return { quem: quem.name, pericia: SKILL_NAME[pericia], total: r.total, cd, passou: r.total >= cd };
  };
  const falar = (npcId, arvore) => conversar(app, pessoa(npcId), arvore, fora);

  // ---------------------------------------------------------- chegada ----
  if (chegando) {
    await narrar(app.root, {
      formato: 'tela',
      paginas: [{
        titulo: 'Phandalin',
        texto: [
          'Mais uma curva da trilha, e o mato se abre: lá embaixo está Phandalin. Telhados de madeira escura espalhados sem muito plano, fumaça de chaminé, um cachorro latindo para ninguém. Aqui e ali, pedaços de muralha antiga afloram do capim — restos de uma cidade que existiu neste lugar e foi esquecida.',
          'Numa elevação a leste, uma casa-forte de pedra sem telhado vigia a vila como um dente quebrado. Um carroceiro para, mede vocês de cima a baixo e segue sem dar bom-dia.',
          v.sildar ? 'Sildar apalpa o rosto inchado. — Se houver uma cama nesta vila, esta noite ela é minha. O resto conversamos depois.' : null,
          'O sol já vai baixo: dá para resolver uma ou duas coisas antes de procurar onde passar a noite.',
        ].filter(Boolean),
      }],
    });
    if (v.sildar) missao('gundren');
  }

  // ------------------------------------------------------------ cenas ----
  const CENAS = {
    async estalagem() {
      const quarto = 5 * 10 * vivos().length;       // 5 pp por pessoa
      // O livro: vencidos os bandidos, a maior parte da vila fica grata.
      const agradece = v.feito.ruaVencida && !v.feito.toblenAgradeceu;
      if (agradece) v.feito.toblenAgradeceu = true;
      return falar('toblen', {
        inicio: 'oi',
        nos: {
          oi: {
            narra: 'Um prédio de dois andares bem no centro da vila, ainda com cheiro de madeira nova. Lareira acesa, mesas compridas, meia Phandalin de caneco na mão — e todas as cabeças viram quando a porta abre.',
            fala: agradece
              ? 'A sala inteira se vira quando vocês entram. Toblen bate no balcão: — Os que limparam a rua! A primeira rodada é da casa. Fazia tempo que ninguém aqui ria alto.'
              : v.feito.toblen
              ? 'De volta? Sente aí. O que vai ser?'
              : 'Bem-vindos à Stonehill! Toblen, o dono. Saí de Triboar com uma picareta e um sonho: a picareta enferrujou, o sonho virou esta casa. Tenho seis quartos, um ensopado de que ninguém reclama, e Marcarrubra aqui dentro só por cima de mim.',
            ao: () => { v.feito.toblen = true; },
            opcoes: [
              { texto: 'Ouvir as conversas da sala.', vai: 'rumores', uma: true },
              { texto: 'E esses Marcarrubra?', vai: 'marcarrubra', uma: true },
              { texto: `Alugar quartos para a noite (${quarto / 10} pp).`, fim: 'dormir',
                requer: () => (totalEmCobre(vivos()) >= quarto ? null : 'o grupo não tem dinheiro para isso') },
              { texto: 'Até mais.', fim: 'sai' },
            ],
          },
          rumores: {
            ao: () => {
              pista('Irmã Garaele, do Santuário da Sorte, saiu da vila por uns dias e voltou machucada.');
              pista('Daran Edermath, do pomar, já foi aventureiro.');
              pista('Orcs foram vistos na ponta leste da Trilha de Triboar; o chefe da vila procura quem os espante.');
              pista('Thel Dendrar, o marceneiro, enfrentou os Marcarrubra há dez dias e foi morto. Levaram o corpo — e a mulher e os filhos sumiram.');
              pista('Carp, o filho da Qelline Alderleaf, diz ter achado um túnel secreto no mato.');
              pista('Os Marcarrubra mexem com todo mundo, menos com o Câmbio de Minério da Halia Thornton.');
              missao('marcarrubra');
            },
            narra: 'Uma rodada de cerveja depois, a sala fala sozinha:',
            fala: [
              'Trilena, a mulher do Toblen, puxa uma cadeira para perto: — O Thel Dendrar, o marceneiro, perdeu a paciência com os Marcarrubra faz uns dez dias. Disse umas verdades na cara deles. Morreu ali mesmo, e o corpo sumiu. A mulher e os dois filhos também — ninguém viu mais.',
              'Lanar, ainda com pó de pedra na barba: — Lá para o leste, na Trilha de Triboar, apareceu orc. O chefe da vila pendurou um aviso pedindo voluntário. Voluntário, rá.',
              'Freda, a tecelã, baixando a voz: — Repararam? A gangue cobra de todo mundo. De todo mundo menos do Câmbio de Minério. A Halia Thornton nunca teve uma vidraça quebrada.',
              'Narth, um velho de mãos rachadas, sem tirar os olhos do caneco: — A elfa do santuário passou uns dias fora. Voltou mancando, cheia de arranhão. Perguntei; ela mudou de assunto.',
              'Pip, o filho mais novo do Toblen, se espremendo entre as mesas: — Sabiam que o Carp achou um buraco escondido no mato? Ele jura que tem bandido lá dentro, e que escapou por um triz!',
              'Elsa, equilibrando quatro canecos: — Conselho de quem já viu briga de verdade? Batam na porta do Daran, lá do pomar. Dizem que no tempo dele era coisa séria.',
              'E toda vez que alguém diz "Marcarrubra", os olhos da sala escorregam para o leste — para o Gigante Adormecido, a taverna onde eles bebem.',
            ],
            opcoes: [{ texto: 'Voltar a falar com Toblen.', vai: 'oi' }],
          },
          marcarrubra: {
            fala: 'Fala baixo. Mantos vermelhos, sempre em bando. Cobram de todo mundo, quebram o que não pagam. O chefe da vila não mexe um dedo. Eu tenho mulher e filhos, entende?',
            ao: () => missao('marcarrubra'),
            opcoes: [{ texto: 'Entendo.', vai: 'oi' }],
          },
        },
      });
    },

    async barthen() {
      return falar('elmar', {
        inicio: 'oi',
        nos: {
          oi: {
            narra: 'Prateleiras até o teto e cheiro de corda nova e couro curtido. Dois rapazes, Ander e Thistle, carregam sacos de farinha para dentro. Uma tabuleta avisa: armas e armaduras, só na Escudo Leão.',
            fala: 'Elmar Barthen. Em que posso ajudar?',
            opcoes: [
              { texto: 'Trouxemos a carroça de Gundren Rockseeker.', vai: 'carroca', uma: true,
                requer: () => (camp.capitulo1?.carroca && !v.feito.carroca ? null : 'sem carroça para entregar'), oculta: true },
              { texto: 'Gundren foi capturado pelos goblins.', vai: 'gundren', uma: true },
              { texto: 'Como vão os negócios?', vai: 'negocios', uma: true },
              { texto: 'Ver as mercadorias.', fim: 'loja' },
              { texto: 'Até mais.', fim: 'sai' },
            ],
          },
          carroca: {
            ao: () => { v.feito.carroca = true; pagarCada(vivos(), 10); registro.push('Elmar Barthen paga 10 po a cada um pela carroça.'); },
            fala: 'Farinha, porco salgado, as ferramentas, as lanternas… tudo aqui. Como combinado: dez peças de ouro para cada um. A carroça fica comigo.',
            opcoes: [{ texto: 'Obrigado.', vai: 'oi' }],
          },
          gundren: {
            ao: () => { missao('gundren'); },
            fala: [
              'Capturado? Gundren é meu amigo… Ele falava de ter achado a mina perdida do Pacto de Phandelver, nessas colinas. Achem ele, por favor.',
              'Os irmãos dele, Nundro e Tharden, montaram acampamento em algum lugar nas colinas. Faz uns dez dias que ninguém os vê por aqui — mantimento acaba, e eles vão ter de aparecer.',
            ],
            opcoes: [
              { texto: 'A mina perdida de Phandelver?', teste: { pericia: 'historia', cd: 15 }, sucesso: 'mina', falha: 'naoSabe' },
              { texto: 'Faremos o possível.', vai: 'oi' },
            ],
          },
          mina: {
            ao: () => pista('A Caverna Onda Eco: mina de anões e gnomos do Pacto de Phandelver, perdida há séculos quando orcs a saquearam. Dentro, a lendária Forja dos Feitiços.'),
            narra: 'Vocês se lembram das histórias: há uns quinhentos anos, anões e gnomos fizeram um pacto com magos humanos — o Pacto de Phandelver — para dividir uma mina rica, a Caverna Onda Eco, onde ficava a Forja dos Feitiços. Orcs vieram, a caverna foi perdida, e a velha Phandalin junto.',
            fala: 'Isso! É disso que Gundren falava. E é por isso que alguém o quer.',
            opcoes: [{ texto: '…', vai: 'oi' }],
          },
          naoSabe: { fala: 'Gundren nunca disse onde. Só que era "algo grande".', opcoes: [{ texto: '…', vai: 'oi' }] },
          negocios: {
            ao: () => { missao('marcarrubra'); pista('Os Marcarrubra frequentam a taverna Gigante Adormecido.'); },
            fala: 'Mal. Os Marcarrubra roubam a mercadoria, intimidam os fregueses e riem do chefe da vila. Se alguém quiser fazer alguma coisa… eles ficam no Gigante Adormecido.',
            opcoes: [{ texto: '…', vai: 'oi' }],
          },
        },
      });
    },

    async escudoLeao() {
      return falar('linene', {
        inicio: 'oi',
        nos: {
          oi: {
            narra: 'Sobre a porta, o brasão da companhia — um leão em pé dentro de um escudo — já desbotado de sol. Lá dentro, caixas empilhadas e uma mulher fazendo contas sem levantar a cabeça.',
            fala: 'Linene Graywind. Este posto é da Escudo Leão, de Yartar. Armas e armaduras nos fundos — para quem eu acho que não vai usar contra a vila.',
            ao: () => missao('linene'),
            opcoes: [
              { texto: 'Achamos a carga da sua caravana, no esconderijo dos goblins.', vai: 'carga', uma: true,
                requer: () => (camp.capitulo2?.suprimentosDaCompanhia && !v.feito.linene ? null : 'nada a contar'), oculta: true },
              { texto: 'O que houve com a sua caravana?', vai: 'caravana', uma: true },
              { texto: 'Ver as armas e armaduras dos fundos.', fim: 'loja' },
              { texto: 'Até mais.', fim: 'sai' },
            ],
          },
          caravana: {
            fala: 'Nunca chegou. Bandido nessas estradas tem de sobra, e eu ainda não sei quem foi. E fiquem longe do Gigante Adormecido: os Marcarrubra são perigosos.',
            opcoes: [{ texto: '…', vai: 'oi' }],
          },
          carga: {
            ao: () => { v.feito.linene = true; concluir('linene'); guardar(vivos()[0], 'moedaDeOuro', 50); registro.push('Linene paga 50 po pelos suprimentos.'); },
            fala: 'Os goblins! Então era isso. Cinquenta peças de ouro, como prometido — e a Escudo Leão não esquece quem a ajudou.',
            opcoes: [{ texto: '…', vai: 'oi' }],
          },
        },
      });
    },

    async cambio() {
      return falar('halia', {
        inicio: 'oi',
        nos: {
          oi: {
            narra: 'Um balcão alto, balanças de latão e mapas pregados na parede, com riachos marcados a tinta. É aqui que garimpeiro troca pedra por moeda — e onde se anota quem pode cavar onde.',
            fala: 'Halia Thornton, mestra do Câmbio. Gente nova, e com cara de quem sabe se virar. Interessante.',
            opcoes: [
              { texto: 'Procuramos o Castelo Dentefino.', vai: 'castelo', uma: true },
              { texto: 'E os Marcarrubra?', vai: 'oferta', uma: true },
              { texto: 'Trouxemos os papéis do Cajavidro.', vai: 'carta', uma: true,
                requer: () => (v.feito.cartaDoCajavidro && feitos.cajavidro && !v.feito.haliaPagou ? null : 'nada'), oculta: true },
              { texto: 'Vender pedras e objetos de valor.', fim: 'loja' },
              { texto: 'Até mais.', fim: 'sai' },
            ],
          },
          castelo: {
            ao: () => pista('Halia ouviu que os Marcarrubra têm um servo goblin — talvez ele saiba onde fica o Castelo Dentefino.'),
            fala: 'Não sei onde fica. Mas ouvi que os Marcarrubra têm um goblin de serviço. Goblin costuma saber onde moram os outros goblins.',
            opcoes: [{ texto: '…', vai: 'oi' }],
          },
          oferta: {
            ao: () => { missao('halia'); missao('marcarrubra'); pista('Os Marcarrubra têm uma base embaixo da Mansão Tresendar, no leste da vila.'); },
            fala: [
              'Um problema, sem dúvida. Ficam no Gigante Adormecido, e têm uma base embaixo da Mansão Tresendar, no leste.',
              'Proposta: cem peças de ouro para quem eliminar o chefe deles — o tal Cajavidro — e me trouxer qualquer carta que estiver no quarto dele.',
            ],
            opcoes: [
              { texto: 'Por que você quer as cartas?', teste: { pericia: 'intuicao', cd: 15 }, sucesso: 'motivo', falha: 'semMotivo' },
              { texto: 'Vamos pensar.', vai: 'oi' },
            ],
          },
          motivo: {
            narra: 'Ela sorri um pouco demais. Fica claro: Halia não quer só os Marcarrubra fora — quer o que eles têm.',
            fala: 'Curiosidade de comerciante.',
            opcoes: [{ texto: '…', vai: 'oi' }],
          },
          semMotivo: { fala: 'Gosto de saber com quem a vila está lidando. Só isso.', opcoes: [{ texto: '…', vai: 'oi' }] },
          carta: {
            ao: () => { v.feito.haliaPagou = true; concluir('halia'); repartir(vivos(), 100 * 100); registro.push('Halia paga 100 po pelo Cajavidro e pelos papéis.'); },
            narra: 'Halia lê a carta com a aranha desenhada duas vezes, devagar, e a guarda numa gaveta com chave.',
            fala: 'Combinado é combinado. Cem peças de ouro. E, se um dia quiserem trabalho de verdade, a porta está aberta.',
            opcoes: [{ texto: '…', vai: 'oi' }],
          },
        },
      });
    },

    async salao() {
      // De dia 2 em diante, Sildar trabalha numa mesa dos fundos. O chefe da
      // vila continua lá: quem quiser falar com ele, procura.
      if (v.sildar && v.dia >= 2) {
        const r = await falar('sildar', {
          inicio: 'oi',
          nos: {
            oi: {
              narra: `${QUADRO} Sildar está instalado numa mesa dos fundos, cercado de papéis.`,
              ao: () => { v.feito.quadroVisto = true; },
              fala: 'Vocês. Bom. Tenho trabalho, e tenho como pagar.',
              opcoes: [
                { texto: 'O que precisa de nós?', vai: 'sildar', uma: true },
                { texto: 'Os Marcarrubra acabaram.', vai: 'fimDaGangue', uma: true,
                  requer: () => (feitos.marcarrubra && !v.feito.sildarPagouGangue ? null : 'nada'), oculta: true },
                { texto: 'Trouxemos o Cajavidro. É o Iarno.', vai: 'iarno', uma: true,
                  requer: () => (v.iarnoPreso && !v.feito.iarnoEntregue ? null : 'nada'), oculta: true },
                { texto: 'O chefe dos Marcarrubra era o Iarno.', vai: 'iarnoSumiu', uma: true,
                  requer: () => (['morto', 'fugiu'].includes(app.campanha?.mansao?.iarno) && !v.feito.iarnoEntregue ? null : 'nada'), oculta: true },
                { texto: 'E o pagamento da escolta?', vai: 'escolta', uma: true,
                  requer: () => (!v.feito.escolta ? null : 'nada'), oculta: true },
                { texto: 'Procurar o chefe da vila.', fim: 'harbin' },
                { texto: 'Até mais.', fim: 'sai' },
              ],
            },
            sildar: {
              ao: () => { v.feito.sildarFalou = true; missao('castelo'); missao('iarno'); },
              fala: [
                'Duas coisas. Primeiro, o Castelo Dentefino: achem e derrotem ou expulsem o chefe da tribo, e a Aliança paga quinhentas peças de ouro. Procurem os bandos de saqueadores pela Trilha de Triboar — algum vai ter vindo de lá.',
                'Segundo: Iarno Albrek, meu colega da Aliança, mago, baixo, barba preta, uns trinta anos. Sumiu explorando a Mansão Tresendar há dois meses. Tragam ele de volta, ou o que sobrou. E pelo fim dos Marcarrubra, duzentas peças de ouro.',
              ],
              opcoes: [{ texto: '…', vai: 'oi' }],
            },
            fimDaGangue: {
              ao: () => { v.feito.sildarPagouGangue = true; concluir('marcarrubra'); repartir(vivos(), 200 * 100); registro.push('Sildar paga 200 po pelo fim dos Marcarrubra.'); },
              fala: 'Então Phandalin respira. A Aliança prometeu duzentas peças de ouro por isso, e aqui estão.',
              opcoes: [{ texto: '…', vai: 'oi' }],
            },
            iarno: {
              ao: () => {
                v.feito.iarnoEntregue = true;
                concluir('iarno');
                app.xpPendente = { xp: (app.xpPendente?.xp ?? 0) + 200, motivo: 'O Cajavidro entregue a Sildar' };
                feitos.traicaoDeIarno = true;
              },
              narra: 'Sildar olha um bom tempo para o homem amarrado antes de falar.',
              fala: [
                'Iarno. Eu vim a Phandalin procurar você. Achei que estivesse morto.',
                'Fica preso no salão até eu conseguir mandá-lo para Neverwinter. Lá decidem o que fazer com um traidor da Aliança. Vocês fizeram mais do que eu pedi.',
              ],
              opcoes: [{ texto: '…', vai: 'oi' }],
            },
            iarnoSumiu: {
              ao: () => { v.feito.iarnoEntregue = true; concluir('iarno'); feitos.traicaoDeIarno = true; },
              narra: 'Vocês contam do mago do cajado de vidro: a barba, a altura, o jeito de falar. Sildar fica calado um tempo.',
              fala: () => (app.campanha?.mansao?.iarno === 'morto'
                ? ['É ele. Iarno. Vim a Phandalin atrás dele e ele estava aqui o tempo todo, mandando nos bandidos.', 'Morto, não responde a ninguém. Mas Neverwinter vai saber o que ele fez, e a Aliança vai olhar com mais cuidado para quem manda para longe.']
                : ['Iarno. Vivo, solto, e agora sabendo que alguém viu a cara dele.', 'Vou escrever para Neverwinter hoje. Se ele aparecer em qualquer cidade da Aliança, vai ter quem o reconheça.']),
              opcoes: [{ texto: '…', vai: 'oi' }],
            },
            escolta: {
              ao: () => { v.feito.escolta = true; repartir(vivos(), 50 * 100); registro.push('Sildar paga as 50 po da escolta, repartidas entre vocês.'); },
              fala: 'Consegui o empréstimo. Cinquenta peças de ouro, como prometi. A Aliança paga o que deve.',
              opcoes: [{ texto: '…', vai: 'oi' }],
            },
          },
        });
        if (r !== 'harbin') return r;
      }
      return falarComHarbin();
    },

    async santuario() {
      return falar('irmaGaraele', {
        inicio: 'oi',
        nos: {
          oi: {
            narra: 'Um nicho de pedra reaproveitada, com uma moeda de prata entalhada sobre o altar: o santuário de Tymora, a deusa da sorte. Velas, flores do campo, e uma elfa jovem varrendo o chão.',
            fala: 'Irmã Garaele. Que a sorte sorria para vocês — e os Marcarrubra que se danem.',
            opcoes: [
              { texto: 'Dizem que a senhora voltou machucada de algum lugar.', vai: 'agatha', uma: true },
              { texto: 'Até mais.', fim: 'sai' },
            ],
          },
          agatha: {
            fala: [
              'Fui atrás de alguém que não quis me ver: Agatha, uma banshee, que vive perto de Conyberry. Preciso que ela responda uma pergunta — onde está o grimório de um mago lendário, Arco Suave.',
              'Ela é vaidosa. Levem este pente de prata com pedras como presente, e convençam-na a falar. Pago com três poções de cura.',
            ],
            opcoes: [
              { texto: 'Aceitamos.', fim: 'agatha' },
              { texto: 'Vamos pensar.', vai: 'oi' },
            ],
          },
        },
      });
    },

    async pomar() {
      return falar('daran', {
        inicio: 'oi',
        nos: {
          oi: {
            narra: 'Fileiras de macieiras bem podadas e, no meio delas, uma casinha caprichada. Quem atende é um meio-elfo de cabelo prateado: a idade está no rosto, não nos ombros.',
            fala: 'Daran Edermath. Já andei por estradas piores que as suas. Sentem.',
            opcoes: [
              { texto: 'O que acha dos Marcarrubra?', vai: 'marcarrubra', uma: true },
              { texto: 'Precisa de alguma coisa?', vai: 'coruja', uma: true },
              { texto: 'Estivemos no Poço da Coruja Velha.', vai: 'relatoCoruja', uma: true,
                requer: () => ((feitos.kostNegociou || feitos.kostDerrotado) && !v.feito.relatoCoruja ? null : 'nada'), oculta: true },
              { texto: 'Podemos dormir no seu galpão esta noite?', fim: 'galpaoDaran' },
              { texto: 'Até mais.', fim: 'sai' },
            ],
          },
          marcarrubra: {
            ao: () => { missao('marcarrubra'); pista('Os Marcarrubra têm uma base embaixo da Mansão Tresendar, no leste da vila.'); },
            fala: 'Que alguém devia ter feito alguma coisa há muito tempo — e eu já estou velho para entrar sozinho num ninho de ratos. O chefe deles atende por Cajavidro. Bebem no Gigante Adormecido, mas dormem embaixo da Mansão Tresendar, a ruína do leste.',
            opcoes: [{ texto: '…', vai: 'oi' }],
          },
          relatoCoruja: {
            ao: () => {
              v.feito.relatoCoruja = true;
              concluir('coruja');
              // O livro: 200 XP por negociar com o mago e contar ao Daran. Quem
              // o venceu já ganhou os 800 lá.
              if (feitos.kostNegociou && !feitos.kostDerrotado) {
                app.xpPendente = { xp: (app.xpPendente?.xp ?? 0) + 200, motivo: [app.xpPendente?.motivo, 'O relato do Poço da Coruja Velha'].filter(Boolean).join('; ') };
              }
            },
            narra: 'Daran ouve tudo de braços cruzados, e só descruza quando vocês falam do manto vermelho.',
            fala: () => (feitos.kostDerrotado
              ? ['Um Mago Vermelho de Thay, cavando ruína de Netheril. E vocês o derrubaram. Bom. Gente assim não aparece sozinha: onde tem um, logo tem outro procurando por ele.']
              : ['Um Mago Vermelho de Thay. Não gosto disso, mas gosto menos ainda de guerra que não precisa acontecer. Vocês fizeram certo em conversar.', 'Fiquem de olho nele. Se ele achar o que procura naquela torre, não vai ser coisa boa para ninguém.']),
            opcoes: [{ texto: '…', vai: 'oi' }],
          },
          coruja: {
            ao: () => missao('coruja'),
            fala: 'Tem uma coisa me incomodando. Lá para o nordeste, a dois dias de marcha, há uma torre de vigia caída, do tempo de Netheril — um império de magos que acabou antes de qualquer reino de hoje. Uns garimpeiros passaram por lá, voltaram brancos, e juram que foram postos para correr por mortos que andavam. Alguém está mexendo naquelas pedras. Quero saber quem.',
            opcoes: [{ texto: '…', vai: 'oi' }],
          },
        },
      });
    },

    async fazenda() {
      return falar('qelline', {
        inicio: 'oi',
        nos: {
          oi: {
            narra: 'Uma casa de fazenda baixa, horta na frente, galinhas soltas pelo terreiro. A dona, uma halfling de olhar esperto, vem enxugando as mãos no avental — e pelo jeito já sabe quem vocês são.',
            fala: 'Qelline Alderleaf. Se faltar cama na estalagem, o galpão está aí, seco e de graça. — Meio escondido atrás dela, um menino halfling devora com os olhos as espadas de vocês.',
            opcoes: [
              { texto: 'Falar com o menino, Carp.', vai: 'carp', uma: true },
              { texto: 'Procuramos o Castelo Dentefino — ou uma mina perdida.', vai: 'reidoth', uma: true },
              { texto: 'Dormir no galpão esta noite.', fim: 'palheiro' },
              { texto: 'Até mais.', fim: 'sai' },
            ],
          },
          carp: {
            ao: () => { v.feito.tunel = true; pista('Carp sabe onde fica um túnel secreto no mato perto da Mansão Tresendar, que leva ao covil dos Marcarrubra. Ele pode mostrar.'); },
            fala: [
              'Carp, dez anos, falando baixo e depressa: — Eu vou ser aventureiro, tá? Eu tava no mato atrás da mansão velha e achei uma passagem secreta, escondida no meio das moitas!',
              '— Aí saíram dois sujeitos enormes, feios de dar medo, e foram se encontrar com uns Marcarrubra. Eu fiquei grudado no chão, sem respirar. Eles moram lá embaixo, eu sei. Eu levo vocês!',
            ],
            opcoes: [{ texto: '…', vai: 'oi' }],
          },
          reidoth: {
            ao: () => missao('reidoth'),
            fala: 'Vocês precisam do Reidoth. É druida, amigo antigo, e conhece estas terras como eu conheço a minha horta. Da última vez que passou, ia para as ruínas de Árvore Trovão, a oeste da Floresta de Neverwinter — uns oitenta quilômetros a noroeste. Eu desenho o caminho.',
            opcoes: [{ texto: '…', vai: 'oi' }],
          },
        },
      });
    },
  };

  /** Prende os Marcarrubra capturados na cadeia do salão, por alguns dias. */
  function prender() {
    const n = v.presos ?? 1;
    v.presoAte = v.dia + 3;
    pista(`${n > 1 ? `${n} Marcarrubra estão presos` : 'Um Marcarrubra está preso'} na cadeia do salão do chefe da vila, até o dia ${v.presoAte}.`);
    registro.push(`${n > 1 ? 'Os presos ficam' : 'O preso fica'} na cadeia do salão por alguns dias.`);
  }
  const temPreso = () => (v.presos ?? 0) > 0 && !v.presoAte && !v.feito.presoSolto;
  // A gangue caiu (o esconderijo marca): aí o chefe da vila não tem mais medo.
  const gangueCaiu = () => Boolean(feitos.marcarrubra || feitos.cajavidro);
  // As duas tentativas com o Harbin (Persuasão e Intimidação) são `uma`.
  const usouOsDois = () => {
    const usadas = app.campanha?.flags?.['dialogo:harbin:usadas'] ?? [];
    return usadas.includes('preso:0') && usadas.includes('preso:1');
  };

  // O chefe da vila. O livro: não quer preso Marcarrubra enquanto a gangue
  // não cair, mas é FÁCIL convencê-lo ou assustá-lo (a CD 10 é nossa); e, se
  // o grupo matou bandidos, não pune ninguém, só pede que não arrumem mais
  // confusão.
  async function falarComHarbin() {
    return falar('harbin', {
      inicio: 'oi',
      nos: {
        oi: {
          narra: () => {
            const primeira = !v.feito.quadroVisto;
            v.feito.quadroVisto = true;
            return primeira
              ? `${QUADRO} Harbin Wester, o chefe da vila, gordo e cheio de si, recebe vocês de trás de uma mesa grande demais.`
              : 'Harbin Wester, chefe da vila, gordo e cheio de si, levanta os olhos da papelada.';
          },
          fala: () => {
            if (v.mortosNaRua && !v.feito.avisoHarbin) {
              v.feito.avisoHarbin = true;
              return ['Os senhores! Marcarrubra mortos na rua principal!',
                'Não vou punir ninguém, que fique claro. Mas eles vão querer revanche, e quem paga é a vila. Nada de mais confusão, entendido?'];
            }
            return 'Os Marcarrubra? Rapazes de uma companhia de escolta, só isso. A vila fala demais. Pois não — em que posso servir?';
          },
          opcoes: [
            { texto: 'Sobre os orcs do aviso.', vai: 'orcs', uma: true },
            { texto: 'Trouxemos um Marcarrubra preso.', vai: 'preso',
              requer: () => (temPreso() ? null : 'ninguém preso'), oculta: true },
            { texto: 'Até mais.', fim: 'sai' },
          ],
        },
        orcs: {
          ao: () => missao('orcs'),
          narra: 'Harbin enxuga a testa.',
          fala: 'Viajantes reclamam de orcs na Trilha de Triboar, a leste, perto do Cume da Wyvern. Cem peças de ouro para quem resolver isso.',
          opcoes: [{ texto: '…', vai: 'oi' }],
        },
        preso: {
          ao: () => { if (gangueCaiu()) prender(); },
          fala: () => (gangueCaiu()
            ? 'Com o chefe deles fora do caminho? Tranquem esse aí lá embaixo. Agora sim, com prazer.'
            : 'Um preso? Aqui? E quando os amigos dele vierem buscar, quem segura a porta? Enquanto a gangue inteira não cair, não quero Marcarrubra nenhum no meu salão.'),
          opcoes: [
            { texto: 'São só uns dias — e a vila inteira vai ver que o senhor agiu.', teste: { pericia: 'persuasao', cd: 10 }, sucesso: 'aceita', falha: 'recusa', uma: true ,
              requer: () => (gangueCaiu() ? 'x' : null), oculta: true },
            { texto: 'Ou ele fica preso aqui, ou a vila fica sabendo que o senhor o soltou.', teste: { pericia: 'intimidacao', cd: 10 }, sucesso: 'aceitaComMedo', falha: 'recusa', uma: true ,
              requer: () => (gangueCaiu() ? 'x' : null), oculta: true },
            { texto: 'Então soltamos o sujeito.', vai: 'solto', requer: () => (gangueCaiu() ? 'já está preso' : null), oculta: true },
            { texto: '…', vai: 'oi', requer: () => (gangueCaiu() ? null : 'x'), oculta: true },
          ],
        },
        recusa: {
          fala: 'Não, não e não. As duas celas lá de baixo são para bêbado, não para bandido com amigos.',
          // Volta ao pedido só enquanto sobrar argumento (os testes são de uma vez).
          opcoes: [{ texto: 'Tentar de outro jeito.', vai: 'preso',
            requer: () => (usouOsDois() ? 'já tentaram tudo' : null), oculta: true },
          { texto: 'Então soltamos o sujeito.', vai: 'solto' }],
        },
        aceita: {
          ao: prender,
          fala: 'Pois bem — uns dias, e nem um a mais. Tem duas celas no porão; a chave fica no meu cinto.',
          opcoes: [{ texto: '…', vai: 'oi' }],
        },
        aceitaComMedo: {
          ao: prender,
          fala: 'Está bem, está bem! Uns dias. Mas que fique claro que a ideia foi dos senhores.',
          opcoes: [{ texto: '…', vai: 'oi' }],
        },
        solto: {
          ao: () => {
            v.feito.presoSolto = true;
            pista('O Marcarrubra que vocês soltaram correu para a Mansão Tresendar: o covil sabe quem vocês são.');
          },
          narra: 'Vocês cortam as cordas. O bandido some rua acima sem olhar para trás — rumo à Mansão Tresendar.',
          opcoes: [{ texto: '…', vai: 'oi' }],
        },
      },
    });
  }

  /** O Gigante Adormecido depois da briga: sem mantos vermelhos na varanda. */
  async function gigante() {
    const rodada = 4 * vivos().length;                // caneco de cerveja: 4 pc
    return conversar(app, { id: 'grista', name: 'Grista', look: null }, {
      inicio: 'oi',
      nos: {
        oi: {
          narra: 'O Gigante Adormecido continua de pé, por pouco. Sem os mantos vermelhos na varanda, o lugar parece maior — e mais vazio. Atrás do balcão, Grista, uma anã de cara amarrada, esfrega um caneco que nunca fica limpo.',
          fala: 'Bebe ou some. E se vierem quebrar mais alguma coisa, a conta é de vocês.',
          opcoes: [
            { texto: `Uma rodada de cerveja (${rodada} pc).`, vai: 'cerveja', uma: true,
              requer: () => (totalEmCobre(vivos()) >= rodada ? null : 'sem dinheiro'),
              efeito: () => cobrar(vivos(), rodada) },
            { texto: 'Os Marcarrubra ainda aparecem aqui?', teste: { pericia: 'intimidacao', cd: 12 }, sucesso: 'conta', falha: 'nada', uma: true },
            { texto: 'Até mais.', fim: 'sai' },
          ],
        },
        cerveja: { narra: 'A cerveja é rala e morna. Ninguém puxa conversa, mas ninguém vai embora também.', opcoes: [{ texto: '…', vai: 'oi' }] },
        nada: { fala: 'Não vi nada, não sei de nada, e não vou começar agora.', opcoes: [{ texto: '…', vai: 'oi' }] },
        conta: {
          ao: () => pista('Os Marcarrubra entram no covil por uma escada de pedra nas ruínas da cozinha da Mansão Tresendar.'),
          narra: 'Grista olha para a porta antes de falar, baixo:',
          fala: 'Vêm menos, agora. Sobem a rua até a mansão velha e descem pela cozinha caída. É tudo o que eu sei — e eu não disse nada.',
          opcoes: [{ texto: '…', vai: 'oi' }],
        },
      },
    }, fora);
  }

  /**
   * O convite de uma facção. O livro diz "certos membros": aceita quem quiser,
   * um de cada vez, até "pronto". "Ninguém, por enquanto" deixa o convite
   * aberto para a próxima visita. Um herói fica numa facção só (nosso).
   */
  async function convidar(f) {
    const aceitos = [];
    for (;;) {
      const livres = vivos().filter((c) => !c.faccao);
      const quem = await narrar(app.root, {
        formato: 'painel',
        paginas: [{ retrato: NPCS[f.npc]?.look, texto: [aceitos.length ? `${aceitos.join(' e ')} já aceitou. Mais alguém?` : f.convite] }],
        escolhas: [
          ...livres.map((c) => ({ rotulo: `${c.name} aceita`, valor: c })),
          { rotulo: aceitos.length ? 'Pronto' : 'Ninguém, por enquanto', valor: null },
        ],
      });
      if (!quem) break;
      quem.faccao = f.id;
      quem.titulo = f.titulo;
      aceitos.push(quem.name);
      registro.push(`${quem.name} entra para ${f.nome === 'Zhentarim' ? 'os Zhentarim' : `a ${f.nome}`}, com o título de ${f.titulo}.`);
    }
    if (aceitos.length) (v.faccoes ??= {})[f.id] = aceitos;
    else registro.push(`${f.nome}: o convite fica para depois.`);
  }
  const conviteDe = (l) => FACCOES.find((f) => f.lugar === l.id && !v.faccoes?.[f.id] && f.quando(feitos, v));

  async function semNpc(l) {
    if (l.id === 'marcenaria') {
      await narrar(app.root, { formato: 'painel', paginas: [{ titulo: l.nome, texto: v.feito.dendrarEmCasa
        ? ['A porta está aberta de novo. Mirna varre a serragem devagar enquanto os filhos separam as tábuas boas das ruins. Ninguém fala muito. Quando veem vocês, param e acenam.']
        : ['A oficina de Thel Dendrar está fechada, a porta escorada com uma tábua. Lá dentro, cadeiras pela metade e serragem no chão. Ninguém mexe nisso há dias.'] }] });
      return 'sai';
    }
    if (l.id === 'gigante') return v.feito.ruaVencida ? gigante() : 'gigante';
    if (l.id === 'mansao') {
      const porOnde = await narrar(app.root, { formato: 'painel', paginas: [{ titulo: l.nome, texto: [
        'A ruína domina o morro do leste: muralhas grossas, janelas sem vidro, mato crescendo dentro dos salões. Ninguém mora ali — mas a terra está cheia de marcas de bota, e todas vão para o mesmo canto, onde uma escada de pedra afunda no meio do que um dia foi uma cozinha.'] }],
        escolhas: [
          { rotulo: 'Voltar', valor: 'sai' },
          ...(v.feito.tunel ? [{ rotulo: 'O túnel do Carp', valor: 'mansaoTunel' }] : []),
          { rotulo: 'Descer a escada da cozinha', valor: 'mansao', primaria: true },
        ],
      });
      if (porOnde === 'sai' || !porOnde) return 'sai';
      return { descer: porOnde };
    }
    return 'sai';
  }

  // ------------------------------------------------- a tela e o laço ----
  let tela;
  async function visitar(l) {
    if (!l.sempreAberto && deNoite(v.tempo)) {
      tela.esconder();
      await narrar(app.root, { formato: 'painel', paginas: [{ titulo: l.nome, texto: ['Fechado. É noite: só a estalagem, a taverna e as casas ainda têm luz.'] }] });
      tela.mostrar();
      return;
    }
    tela.esconder();
    const fim = l.npc ? await CENAS[l.id]() : await semNpc(l);
    if (fim?.descer) {
      tela.fechar();
      app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: fim.descer, continuarCom: grupo });
      return;
    }
    if (fim === 'loja') {
      await abrirLoja(app.root, {
        loja: LOJAS[l.id], npc: pessoa(l.npc), grupo: vivos(), aoMudar: (t) => registro.push(t),
        onFicha: (c, depois) => app.abrirFichaNaVila(c, depois),
      });
    }
    const convite = conviteDe(l);
    if (convite) await convidar(convite);
    if (fim === 'agatha') missao('agatha');
    if (fim === 'dormir') {
      cobrar(vivos(), 5 * 10 * vivos().length);
      await dormir('Um quarto na Estalagem Stonehill, cama de verdade, sopa quente.');
    } else if (fim === 'palheiro') {
      await dormir('O galpão da Qelline cheira a feno e a vaca, mas é seco, quente e de graça.');
    } else if (fim === 'galpaoDaran') {
      await dormir('O galpão do Daran cheira a maçã e a palha limpa. Ele mesmo faz a primeira vigia, por hábito.');
    } else if (fim === 'gigante') {
      return brigaDeRua(true);
    } else if (!l.sempreAberto || l.npc) {
      v.tempo += 1;
    }
    for (const t of registro.splice(0)) tela.registrar(t);
    // Depois de um dia ou mais, os Marcarrubra vêm atrás do grupo na rua.
    if (v.dia >= Math.max(2, v.revancheNoDia ?? 0) && !v.feito.ruaMarcarrubra && !deNoite(v.tempo)) return brigaDeRua(false);
    tela.mostrar();
    tela.atualizar();
  }

  async function dormir(texto) {
    for (const t of await descansoLongoDoGrupo(app.root, { herois: vivos(), texto: [texto] })) tela.registrar(t);
    v.dia += 1;
    v.tempo = 0;
    // O prazo do Harbin venceu e a gangue não caiu: ele solta os presos.
    if (v.presoAte && v.dia > v.presoAte && !gangueCaiu() && !v.feito.presoSolto) {
      v.feito.presoSolto = true;
      tela.registrar('O prazo venceu: o chefe da vila soltou os Marcarrubra presos durante a noite.');
    }
  }

  /** A briga com os Marcarrubra: na porta do Gigante Adormecido, ou na rua. */
  async function brigaDeRua(naTaverna) {
    v.feito.ruaMarcarrubra = true;
    tela.esconder();
    // O livro: os dois lados se provocam à vontade, e ninguém é pego de
    // surpresa. Responder não muda a luta — muda como ela começa.
    const resposta = await narrar(app.root, {
      formato: 'painel',
      paginas: [{ texto: naTaverna
        ? ['O Gigante Adormecido é um barracão torto no fim da rua, com uma varanda que parece prestes a desabar. Quatro homens de capa vermelha encardida tomam a varanda inteira — um sentado num barril, os outros encostados nas colunas — e param de conversar quando vocês chegam perto.',
          'O maior deles desce os degraus devagar, sorrindo sem os dentes da frente. — Olha só, turistas. Ninguém avisou vocês de que esta rua tem dono?']
        : ['No meio da rua, quatro sujeitos de capa vermelha fecham a passagem, espalhados para ninguém contornar. Um deles brinca com uma faca.',
          '— Daqui ninguém passa sem pagar pedágio, forasteiros. E hoje o pedágio é tudo o que vocês carregam.'] }],
      escolhas: [
        { rotulo: 'Responder à altura', valor: 'provoca' },
        { rotulo: 'Tentar acalmar', valor: 'acalma' },
        { rotulo: 'Às armas!', valor: 'luta', primaria: true },
      ],
    });
    if (resposta !== 'luta') {
      await narrar(app.root, {
        formato: 'painel',
        paginas: [{ texto: [resposta === 'provoca'
          ? '— Engraçadinho. Quero ver rir de cara no barro. — As mãos já estão nos cabos das espadas.'
          : '— Calma? A gente está calmíssimo. — O da faca ri, e os outros desembainham.'] }],
        escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }],
      });
    }
    tela.fechar();
    app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'rua', continuarCom: grupo });
  }

  tela = abrirTelaVila(app.root, {
    lugares: LUGARES,
    estado: v,
    grupo,
    missoes: MISSOES,
    momento: () => `Dia ${v.dia} · ${nomeDoMomento(v.tempo)}`,
    dinheiro: () => totalEmCobre(vivos()),
    aberto: (l) => l.sempreAberto || !deNoite(v.tempo),
    // "!" no marcador: alguém ali tem algo para o grupo (pagar, contar, convidar).
    novidade: (l) => Boolean(conviteDe(l) || {
      barthen: camp.capitulo1?.carroca && !v.feito.carroca,
      escudoLeao: camp.capitulo2?.suprimentosDaCompanhia && !v.feito.linene,
      salao: (v.sildar && v.dia >= 2 && !v.feito.sildarFalou) || temPreso(),
    }[l.id]),
    onLugar: (l) => visitar(l),
    onDormir: async () => {
      tela.esconder();
      const quarto = 5 * 10 * vivos().length;
      const v2 = await narrar(app.root, {
        formato: 'painel',
        paginas: [{ titulo: 'Onde dormir', texto: [`Quarto na Estalagem Stonehill: ${quarto / 10} peças de prata para o grupo. Ou o galpão da fazenda Alderleaf, de graça, ou acampar fora da vila.`] }],
        escolhas: [
          { rotulo: 'Acampar fora', valor: 'acampar' },
          { rotulo: 'Galpão da Qelline', valor: 'palheiro' },
          { rotulo: 'Estalagem', valor: 'estalagem', primaria: true, motivo: totalEmCobre(vivos()) < quarto ? 'sem dinheiro' : null },
        ],
      });
      if (v2 === 'estalagem') cobrar(vivos(), quarto);
      await dormir(v2 === 'estalagem' ? 'Um quarto na Estalagem Stonehill.' : v2 === 'palheiro' ? 'O galpão da Qelline.' : 'Um acampamento à beira da mata, revezando a vigia.');
      tela.mostrar();
      tela.atualizar();
    },
    onMenu: () => { tela.fechar(); app.encerrarPartida(); },
    // Sair da vila pela Trilha Triboar: o mapa da região.
    botoes: [{ rotulo: 'Viajar', dica: 'Sair de Phandalin pelo mapa da região', fazer: () => { tela.fechar(); app.irParaRegiao(vivos(), 'phandalin'); } }],
    // A ficha fora de combate: vestir o que se comprou, guardar para vender.
    onFicha: (c) => app.abrirFichaNaVila(c, () => tela.atualizar()),
  });
  for (const t of registro.splice(0)) tela.registrar(t);

  // Voltando do esconderijo dos Marcarrubra.
  if (v.dendrarLivres && !v.feito.dendrarEmCasa) {
    v.feito.dendrarEmCasa = true;
    tela.registrar('A família Dendrar está de volta em casa.');
  }
  for (const id of v.missoesExtra ?? []) if (!v.missoes[id]) { v.missoes[id] = 'ativa'; tela.registrar(`Nova missão: ${MISSOES[id].titulo}.`); }

  // Voltando de uma luta com XP: sobe de nível se der.
  if (app.xpPendente) {
    const { xp, motivo } = app.xpPendente;
    app.xpPendente = null;
    const cada = Math.floor(xp / vivos().length);
    const sobem = darXp(vivos(), cada);
    tela.registrar(`${motivo}: ${cada} XP para cada um.`);
    if (sobem.length) {
      tela.esconder();
      for (const t of await telaDeSubirNivel(app.root, sobem)) tela.registrar(t);
      tela.mostrar();
    }
  }
  tela.atualizar();
  return tela;
}
