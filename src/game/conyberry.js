// CONYBERRY E O COVIL DA AGATHA (Parte 3 da aventura). Sem tabuleiro: a
// banshee não luta, e a visita é uma conversa só.
//
// As REGRAS seguem o livro; o TEXTO é nosso:
//   - a trilha atravessa as ruínas da vila; de lá, uma picada leva à mata, e
//     o covil fica a alguns quilômetros;
//   - quem for grosseiro, desrespeitoso ou ameaçador ofende a banshee: ela
//     some e não volta, nem chamada;
//   - com respeito, Persuasão CD 15 de quem fala por todos, com vantagem para
//     quem a trata bem de verdade; o pente de prata da Irmã Garaele, dado de
//     presente, convence na hora;
//   - convencida, ela responde UMA pergunta, e a resposta é verdadeira:
//       o grimório de Arco Suave — trocado com um necromante chamado
//       Tsernoth, em Iriaebor, há mais de cem anos (é o que a Garaele quer);
//       o nome do mago que ergueu a torre do Poço da Coruja Velha — Arthindol
//       (é o que o Hamun Kost quer);
//       ou qualquer outra coisa da aventura: o Castelo Dentefino, a Caverna
//       Onda Eco, quem é o Aranha Negra;
//   - convencê-la a responder vale 200 XP.
//
// O estado mora em `app.campanha.agatha`.

import { narrar } from '../view/narrativa.js';
import { conversar } from './dialogo.js';
import { garantirInventario } from '../rules/equipment.js';

export async function visitarConyberry(app, grupo) {
  const camp = (app.campanha ??= {});
  const feitos = (camp.feitos ??= {});
  const vila = (camp.vila ??= { pistas: [], missoes: {} });
  const salvo = (camp.agatha ??= { estado: null });
  const vivos = () => grupo.filter((c) => !c.dead);
  const registro = [];
  const fora = { herois: vivos(), rng: app.rngDaVila ??= { die: (n) => 1 + Math.floor(Math.random() * n) }, say: (_k, t) => registro.push(t) };
  const pista = (t) => { if (!(vila.pistas ??= []).includes(t)) vila.pistas.push(t); };
  const temPente = () => vivos().some((c) => garantirInventario(c).bag.some((i) => i.id === 'penteDeAgatha' && i.qtd > 0));
  const tirarPente = () => {
    for (const c of vivos()) {
      const i = garantirInventario(c).bag.find((x) => x.id === 'penteDeAgatha');
      if (i) { c.bag.splice(c.bag.indexOf(i), 1); return; }
    }
  };
  const painel = (titulo, texto) => narrar(app.root, { formato: 'painel', paginas: [{ titulo, texto: [].concat(texto) }] });

  await painel('Ruínas de Conyberry', [
    'A Trilha Triboar passa bem no meio do que foi uma vila: chaminés de pedra sem casa em volta, um poço entupido de folhas, uma placa de taverna caída de cara no chão. Faz muito tempo que alguém pôs fogo em tudo, e ninguém voltou para reconstruir.',
    'Na beira da vila, uma picada velha some para o noroeste, entre as árvores da mata de Neverwinter.',
  ]);

  if (salvo.estado === 'sumiu') {
    await painel('O covil', 'O abrigo de galhos continua lá, no escuro da mata. Ninguém aparece. Ninguém vai aparecer: ela não perdoa grosseria.');
    return;
  }
  if (salvo.estado === 'respondeu') {
    await painel('O covil', 'O abrigo de galhos está frio e vazio. Ela já deu a sua resposta, e não deve outra a ninguém.');
    return;
  }

  // Recusou da última vez: só volta a aparecer depois de um dia inteiro.
  if (salvo.estado === 'recusou' && (vila.dia ?? 1) * 24 + (vila.tempo ?? 0) < salvo.voltaEm) {
    await painel('O covil', 'Nada se acende. O frio está lá, e a sensação de que alguém olha de dentro da cabana, mas ninguém se mostra. Hoje, não.');
    return;
  }

  await painel('O covil', [
    'Algumas horas mata adentro, os passarinhos param de cantar. Ninguém comenta, mas todos notam. A picada termina numa clareira onde nada cresce, e no meio dela há uma casinha que ninguém construiu: as árvores em volta se curvaram até se tocar, e os galhos se trançaram em parede e telhado.',
    'A porta é baixa. Do outro lado, poeira, cheiro de flor seca, móveis de madeira clara com entalhes que nenhum marceneiro da região saberia fazer.',
  ]);

  const agatha = { id: 'agatha', name: 'Agatha', look: 'agatha' };
  const fim = await conversar(app, agatha, {
    inicio: 'oi',
    nos: {
      oi: {
        narra: 'Primeiro, o frio na nuca. Depois, um som baixo de choro, de lugar nenhum. E ela está ali, no canto escuro, sem ter chegado: uma elfa feita de luz fraca, que não faz sombra na parede.',
        fala: 'Gente viva, de botas sujas, no meu chão. O último que entrou assim nunca mais saiu da mata. Falem logo.',
        opcoes: [
          { texto: 'Trouxemos um presente, senhora: um pente de prata.', vai: 'pente',
            requer: () => (temPente() ? null : 'ninguém tem o pente'), oculta: true },
          { texto: 'Viemos com respeito pedir uma resposta, senhora.', teste: { pericia: 'persuasao', cd: 15 }, sucesso: 'aceita', falha: 'recusa' },
          { texto: 'Responda o que perguntarmos, fantasma.', fim: 'ofendida' },
          { texto: 'Desculpe o incômodo. Já vamos.', fim: 'sai' },
        ],
      },
      pente: {
        ao: () => tirarPente(),
        narra: 'Ela olha o pente por um tempo longo. Os dedos de luz não conseguem segurá-lo, mas o rosto se desfaz um pouco.',
        fala: 'Faz muito tempo que alguém me trouxe uma coisa bonita. Muito bem.',
        opcoes: [{ texto: '…', vai: 'aceita' }],
      },
      recusa: {
        ao: () => {
          salvo.estado = 'recusou';
          salvo.voltaEm = (vila.dia ?? 1) * 24 + (vila.tempo ?? 0) + 24;
        },
        fala: 'Palavras de mercador. Voltem quando souberem falar com uma dama.',
        narra: 'A luz se apaga. O frio fica.',
        opcoes: [{ texto: '…', fim: 'recusou' }],
      },
      aceita: {
        fala: 'Uma pergunta. Escolham bem: eu não respondo duas vezes, e não minto. Depois, saiam da minha casa.',
        opcoes: [
          { texto: 'Onde está o grimório de Arco Suave?', fim: 'grimorio' },
          { texto: 'Qual o nome do mago que ergueu a torre do Poço da Coruja Velha?', fim: 'torre' },
          { texto: 'Onde fica o Castelo Dentefino?', fim: 'castelo' },
          { texto: 'Onde fica a Caverna Onda Eco?', fim: 'ondaEco' },
          { texto: 'Quem é o Aranha Negra?', fim: 'aranha' },
        ],
      },
    },
  }, fora);

  if (fim === 'ofendida') {
    salvo.estado = 'sumiu';
    await painel('O covil', 'O rosto dela se fecha. A luz some de uma vez, e a cabana fica escura e vazia. Ela não vai voltar, nem que vocês chamem a noite inteira.');
    return;
  }
  if (!['grimorio', 'torre', 'castelo', 'ondaEco', 'aranha'].includes(fim)) return;

  salvo.estado = 'respondeu';
  const respostas = {
    grimorio: () => {
      feitos.agathaGrimorio = true;
      pista('Agatha disse onde foi parar o grimório de Arco Suave: ela mesma o trocou, há mais de cem anos, com um necromante chamado Tsernoth, na cidade de Iriaebor. Do que houve depois, não sabe.');
      return 'Eu o troquei. Faz mais de cem anos, com um necromante de Iriaebor que se chamava Tsernoth. O que ele fez com o livro, eu não sei, e não me importa.';
    },
    torre: () => {
      feitos.agathaTorre = true;
      pista('Agatha disse o nome do mago que ergueu a torre do Poço da Coruja Velha: Arthindol. É o que o Hamun Kost queria saber.');
      return 'Arthindol. Era um homem vaidoso, e a torre dele caiu antes da vaidade.';
    },
    castelo: () => {
      feitos.sabeOCastelo = true;
      pista('Agatha disse onde fica o Castelo Dentefino: dentro da Floresta de Neverwinter, ao norte da Trilha Triboar. Agora ele aparece no mapa da região.');
      return 'Ao norte da trilha, dentro da mata. Torres velhas caindo umas sobre as outras, cheias de goblin. O cheiro chega antes.';
    },
    ondaEco: () => {
      feitos.sabeOndaEco = true;
      pista('Agatha disse onde fica a Caverna Onda Eco: nos morros a leste de Phandalin, ao pé das Montanhas Espada.');
      return 'A leste da vila nova de vocês, onde os morros começam a virar montanha. O mar que havia lá secou faz muito tempo; o eco ficou.';
    },
    aranha: () => {
      feitos.sabeOAranha = true;
      pista('Agatha disse quem é o Aranha Negra: um elfo das profundezas, um drow, chamado Nezznar.');
      return 'Um elfo do fundo da terra. Um drow. Nezznar. Ele quer a mesma coisa que todos os que passam por aqui: o que está debaixo das montanhas.';
    },
  };
  const resposta = respostas[fim]();
  await narrar(app.root, { formato: 'painel', paginas: [{ titulo: 'Agatha', texto: [{ nome: 'Agatha:', texto: resposta }, 'A luz se apaga devagar. Ela não diz adeus.'] }] });
  // O livro: 200 XP por convencê-la. Entra quando o mapa da região reabrir.
  app.xpPendente = { xp: (app.xpPendente?.xp ?? 0) + 200, motivo: [app.xpPendente?.motivo, 'A resposta da banshee'].filter(Boolean).join('; ') };
}
