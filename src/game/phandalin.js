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
  coruja: { titulo: 'Encrenca no Poço da Coruja Velha', de: 'Daran Edermath', texto: 'Alguém cava nas ruínas do Poço da Coruja Velha, a dois dias a nordeste, e garimpeiros dizem ter sido perseguidos por mortos-vivos. Descobrir o que está acontecendo.' },
  orcs: { titulo: 'Orcs no Cume da Wyvern', de: 'Harbin Wester', texto: 'Viajantes relatam orcs perto do Cume da Wyvern, a leste pela Trilha de Triboar. Dar um jeito neles.', recompensa: '100 po' },
  agatha: { titulo: 'A barganha da banshee', de: 'Irmã Garaele', texto: 'Levar um pente de prata à banshee Agatha, em Conyberry, e convencê-la a dizer onde está o grimório do mago Arco Suave.', recompensa: 'três poções de cura' },
  reidoth: { titulo: 'Reidoth, o druida', de: 'Qelline Alderleaf', texto: 'O druida Reidoth conhece cada palmo da região — inclusive onde fica o Castelo Dentefino. Ele foi para as ruínas de Árvore Trovão, a uns 80 km a noroeste.' },
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

const QUADRO = 'Paredes grossas de pedra, telhado de madeira e uma torre de sino. Num quadro ao lado da porta: "RECOMPENSA — Orcs perto do Cume da Wyvern! Quem tiver coragem, entre para saber mais." Selo da vila, assinatura ilegível.';

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
          'A trilha esburacada sobe um morro de mato e, lá de cima, aparece Phandalin: umas quarenta ou cinquenta casas simples, algumas sobre alicerces de pedra muito mais velhos. Muros caídos, cobertos de hera e espinho, cercam as construções novas — um dia isto aqui foi bem maior.',
          'A rua principal, de barro, sobe até uma mansão em ruínas num morro a leste. Crianças brincam na grama; alguém olha vocês passarem e volta ao que fazia.',
          v.sildar ? 'Sildar solta o ar, aliviado. — Primeiro, uma cama. Me disseram que a estalagem daqui é um luxo.' : null,
          'O dia está acabando: dá para ver um ou dois lugares antes de procurar onde dormir.',
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
            narra: 'No meio da vila, uma hospedaria nova de pedra bruta e madeira rústica. A sala de beber está cheia, e todo mundo olha para vocês com curiosidade.',
            fala: agradece
              ? 'A sala inteira se vira quando vocês entram. Toblen bate no balcão: — Os que limparam a rua! A primeira rodada é da casa. Fazia tempo que ninguém aqui ria alto.'
              : v.feito.toblen
              ? 'De volta? Sente aí. O que vai ser?'
              : 'Toblen Stonehill, às ordens. Vim de Triboar achando que ia ficar rico minerando — descobri que sei mais de estalagem que de picareta. Seis quartos, comida quente, e nenhum Marcarrubra se eu puder evitar.',
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
              'Narth, um fazendeiro velho: — A Irmã Garaele, do santuário, sumiu uns dias e voltou toda arranhada. Ninguém sabe de onde.',
              'Elsa, a moça que serve: — O Daran do pomar? Já foi aventureiro, dizem. E dos bons.',
              'Lanar, mineiro: — Tem orc na ponta leste da Trilha de Triboar. O chefe da vila anda procurando quem os espante.',
              'Trilena, a mulher do Toblen, mais baixo: — O Thel Dendrar, o marceneiro, encarou os Marcarrubra há dez dias. Mataram ele na frente de todo mundo e levaram o corpo. A mulher e os dois filhos sumiram.',
              'Pip, o caçula do Toblen: — O Carp, da fazenda Alderleaf, achou um túnel secreto no mato! Os Marcarrubra quase pegaram ele.',
              'Freda, a tecelã: — Eles mexem com todo mundo. Menos com o Câmbio de Minério. Ninguém mexe com a Halia Thornton.',
              'E todos concordam numa coisa: os Marcarrubra ficam no Gigante Adormecido, no leste da vila. Encrenca.',
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
            narra: 'O maior posto de troca da vila: mochilas, sacos de dormir, corda, rações. Armas e armadura, não — "isso é com a Linene, na Escudo Leão".',
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
              'Os irmãos dele, Nundro e Tharden, estão acampados em algum lugar fora da vila. Não aparecem faz uns dez dias. Devem voltar a qualquer hora para reabastecer.',
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
            narra: 'Na porta, uma placa de madeira em forma de escudo com um leão azul pintado.',
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
            narra: 'O Câmbio de Minério pesa, mede e paga o que os garimpeiros acham — e, na falta de outra autoridade, registra quem tem direito a qual riacho.',
            fala: 'Halia Thornton, mestra do Câmbio. Gente nova, e com cara de quem sabe se virar. Interessante.',
            opcoes: [
              { texto: 'Procuramos o Castelo Dentefino.', vai: 'castelo', uma: true },
              { texto: 'E os Marcarrubra?', vai: 'oferta', uma: true },
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
            narra: 'O único templo da vila: um santuário pequeno, de pedras tiradas das ruínas, dedicado a Tymora, a deusa da sorte.',
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
            narra: 'Uma cabana pequena e arrumada ao lado de um pomar de maçãs. O dono é um meio-elfo com mais de cem anos, ainda em forma.',
            fala: 'Daran Edermath. Já andei por estradas piores que as suas. Sentem.',
            opcoes: [
              { texto: 'O que acha dos Marcarrubra?', vai: 'marcarrubra', uma: true },
              { texto: 'Precisa de alguma coisa?', vai: 'coruja', uma: true },
              { texto: 'Até mais.', fim: 'sai' },
            ],
          },
          marcarrubra: {
            ao: () => { missao('marcarrubra'); pista('Os Marcarrubra têm uma base embaixo da Mansão Tresendar, no leste da vila.'); },
            fala: 'Que já passou da hora de alguém ensinar uma lição a eles, e ao chefe deles, o Cajavidro. Ficam no Gigante Adormecido — mas o covil de verdade é embaixo da Mansão Tresendar, a ruína no leste.',
            opcoes: [{ texto: '…', vai: 'oi' }],
          },
          coruja: {
            ao: () => missao('coruja'),
            fala: 'Garimpeiros nas colinas a nordeste dizem que alguém está cavando nas ruínas do Poço da Coruja Velha — uma torre de vigia de Netheril, um império de magos antigos. E que mortos-vivos os perseguiram por lá. São dois dias de marcha. Descubram o que é.',
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
            narra: 'Uma fazenda simples. A dona, uma halfling de quarenta e poucos anos, parece saber de tudo que acontece na vila.',
            fala: 'Qelline Alderleaf. Se a estalagem estiver cara, o palheiro é de vocês. — Atrás dela, um menino halfling não tira os olhos das armas de vocês.',
            opcoes: [
              { texto: 'Falar com o menino, Carp.', vai: 'carp', uma: true },
              { texto: 'Procuramos o Castelo Dentefino — ou uma mina perdida.', vai: 'reidoth', uma: true },
              { texto: 'Dormir no palheiro esta noite.', fim: 'palheiro' },
              { texto: 'Até mais.', fim: 'sai' },
            ],
          },
          carp: {
            ao: () => { v.feito.tunel = true; pista('Carp sabe onde fica um túnel secreto no mato perto da Mansão Tresendar, que leva ao covil dos Marcarrubra. Ele pode mostrar.'); },
            fala: [
              'Carp, dez anos, sussurrando: — Eu vou ser aventureiro. Eu tava brincando no mato perto da mansão velha e achei um túnel escondido numa moita!',
              '— Saíram dois bandidos grandes e feios lá de dentro e foram falar com dois Marcarrubra. Não me viram, mas foi por pouco. Eles têm um covil embaixo da mansão. Eu mostro onde é!',
            ],
            opcoes: [{ texto: '…', vai: 'oi' }],
          },
          reidoth: {
            ao: () => missao('reidoth'),
            fala: 'Procurem o Reidoth, um druida amigo meu: não existe um palmo de terra por aqui que ele não conheça. Ele foi para as ruínas de Árvore Trovão, a oeste da Floresta de Neverwinter — uns oitenta quilômetros a noroeste. Eu explico o caminho.',
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
            return 'Os Marcarrubra? Uma guilda de mercenários, nada desse escândalo todo. O que os senhores desejam?';
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
      await narrar(app.root, { formato: 'painel', paginas: [{ titulo: l.nome, texto: [
        'A oficina de Thel Dendrar está fechada, a porta escorada com uma tábua. Lá dentro, cadeiras pela metade e serragem no chão. Ninguém mexe nisso há dias.'] }] });
      return 'sai';
    }
    if (l.id === 'gigante') return v.feito.ruaVencida ? gigante() : 'gigante';
    if (l.id === 'mansao') {
      await narrar(app.root, { formato: 'painel', paginas: [{ titulo: l.nome, texto: [
        'Mais castelo que casa, a mansão em ruínas fica num morro baixo entre a mata e o mato, no leste da vila. Está deserta — mas há muitas pegadas levando a uma escada de pedra que desce das ruínas de uma cozinha grande.',
        '(O esconderijo dos Marcarrubra é a próxima etapa da construção.)'] }] });
      return 'sai';
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
    if (fim === 'loja') {
      await abrirLoja(app.root, { loja: LOJAS[l.id], npc: pessoa(l.npc), grupo: vivos(), aoMudar: (t) => registro.push(t) });
    }
    const convite = conviteDe(l);
    if (convite) await convidar(convite);
    if (fim === 'agatha') missao('agatha');
    if (fim === 'dormir') {
      cobrar(vivos(), 5 * 10 * vivos().length);
      await dormir('Um quarto na Estalagem Stonehill, cama de verdade, sopa quente.');
    } else if (fim === 'palheiro') {
      await dormir('O palheiro da Qelline cheira a feno e a vaca, mas é seco, quente e de graça.');
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
    await narrar(app.root, {
      formato: 'painel',
      paginas: [{ texto: naTaverna
        ? ['O Gigante Adormecido é uma taverna caindo aos pedaços. Na varanda coberta, quatro humanos de mantos vermelhos encardidos, escorados em barris vazios, acompanham vocês com os olhos.',
          'Um deles cospe no chão. — Ora, ora. Uma ninhada inteira de filhotes. Vieram latir para a gente?']
        : ['Na rua, quatro sujeitos de mantos vermelhos encardidos esperam por vocês, com a mão no cabo das armas.',
          'Um deles cospe no chão. — Hora de ir embora, forasteiros. Larguem as coisas de valor e sigam caminho.'] }],
      escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }],
    });
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
        paginas: [{ titulo: 'Onde dormir', texto: [`Quarto na Estalagem Stonehill: ${quarto / 10} peças de prata para o grupo. Ou o palheiro da fazenda Alderleaf, de graça, ou acampar fora da vila.`] }],
        escolhas: [
          { rotulo: 'Acampar fora', valor: 'acampar' },
          { rotulo: 'Palheiro', valor: 'palheiro' },
          { rotulo: 'Estalagem', valor: 'estalagem', primaria: true, motivo: totalEmCobre(vivos()) < quarto ? 'sem dinheiro' : null },
        ],
      });
      if (v2 === 'estalagem') cobrar(vivos(), quarto);
      await dormir(v2 === 'estalagem' ? 'Um quarto na Estalagem Stonehill.' : v2 === 'palheiro' ? 'O palheiro da Qelline.' : 'Um acampamento à beira da mata, revezando a vigia.');
      tela.mostrar();
      tela.atualizar();
    },
    onMenu: () => { tela.fechar(); app.encerrarPartida(); },
    // A ficha fora de combate: vestir o que se comprou, guardar para vender.
    onFicha: (c) => app.abrirFichaNaVila(c, () => tela.atualizar()),
  });
  for (const t of registro.splice(0)) tela.registrar(t);

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
