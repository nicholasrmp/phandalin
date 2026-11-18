// CONYBERRY E O COVIL DA AGATHA (Parte 3 da aventura). A visita é uma conversa; se a banshee ATACA (o Obelisco: a
// Persuasão falhou, ou ela foi ofendida e a Visagem não espantou o grupo), `visitarConyberry` devolve o que a luta
// precisa saber e `game/regiao.js` abre o tabuleiro da cabana (`capitulo4-agatha.js`).
//
// As REGRAS seguem o livro; o TEXTO é nosso:
//   - a trilha atravessa as ruínas da vila; de lá, uma picada leva à mata, e
//     o covil fica a alguns quilômetros;
//   - quem for grosseiro, desrespeitoso ou ameaçador ofende a banshee: ela tenta
//     espantar o grupo com a Visagem Horripilante, e quem não sai da cabana
//     leva a luta;
//   - com respeito, Persuasão CD 15 de quem fala por todos (falhou: ela ataca); o pente de prata
//     da Irmã Garaele, dado de presente, convence na hora — é este o caminho
//     de quem a trata bem, e ele vale mais que vantagem no dado;
//   - convencida, ela responde UMA pergunta, e a resposta é verdadeira:
//       o grimório de Arco Suave — trocado com um necromante chamado
//       Tsernoth, em Iriaebor, há mais de cem anos (é o que a Garaele quer);
//       o nome da maga que ergueu a torre do Poço da Coruja Velha — Dresina (no Obelisco; a Mina dizia Arthindol)
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
    'A Trilha de Triboar passa bem no meio do que foi uma vila: chaminés de pedra sem casa em volta, um poço entupido de folhas, uma placa de taverna caída de cara no chão. Faz muito tempo que alguém pôs fogo em tudo, e ninguém voltou para reconstruir.',
    'Na beira da vila, uma picada velha some para o noroeste, entre as árvores da mata de Neverwinter.',
  ]);

  if (salvo.estado === 'destruida') {
    await painel('O covil', 'O abrigo de galhos está aberto ao vento. Não há frio nenhum lá dentro, nem choro: só poeira, e a louça posta para ninguém.');
    return null;
  }
  if (salvo.estado === 'sumiu') {
    await painel('O covil', 'O abrigo de galhos continua lá, no escuro da mata. Ninguém aparece. Ninguém vai aparecer: ela não perdoa grosseria.');
    return null;
  }
  if (salvo.estado === 'respondeu') {
    await painel('O covil', 'O abrigo de galhos está frio e vazio. Ela já deu a sua resposta, e não deve outra a ninguém.');
    return null;
  }

  // Recusou da última vez: só volta a aparecer no dia seguinte.
  //
  // A conta é em DIAS porque `vila.tempo` conta momentos do dia, não horas
  // (`game/relogio.js`). Antes isto fazia `dia * 24 + tempo` e somava 24, como
  // se o contador fossem horas: quem ofendia a banshee em qualquer momento que
  // não o primeiro do dia continuava barrado depois de dormir uma noite.
  if (salvo.estado === 'recusou' && (vila.dia ?? 1) < salvo.voltaEm) {
    await painel('O covil', 'Nada se acende. O frio está lá, e a sensação de que alguém olha de dentro da cabana, mas ninguém se mostra. Hoje, não.');
    return null;
  }

  await painel('O covil', [
    'Algumas horas mata adentro, os passarinhos param de cantar. Ninguém comenta, mas todos notam. A picada termina numa clareira onde nada cresce, e no meio dela há uma casinha que ninguém construiu: as árvores em volta se curvaram até se tocar, e os galhos se trançaram em parede e telhado.',
    'A porta é baixa demais para se entrar de pé. Do outro lado, poeira e cheiro de flor seca — e a casa está MOBILIADA: mesa posta para ninguém, dois baús fechados, prateleiras com louça em ordem, um sofá de encosto alto virado para uma lareira que não acende há um século. Tudo de madeira clara, com entalhes que nenhum marceneiro da região saberia fazer.',
    'Alguém arrumou isto aqui para morar, e continuou arrumando depois de não precisar mais.',
  ]);

  const agatha = { id: 'agatha', name: 'Agatha', look: 'agatha' };
  const fim = await conversar(app, agatha, {
    inicio: 'oi',
    nos: {
      oi: {
        narra: 'Primeiro, o frio na nuca. Depois, um som baixo de choro, de lugar nenhum. E ela está ali, no canto escuro, sem ter chegado: uma elfa feita de luz fraca, que não faz sombra na parede. O cabelo e o manto dela se mexem devagar, num vento que não despenteia mais ninguém na sala — e o rosto, quando sai da sombra, não é o de uma elfa: é o que sobra de um depois de muito tempo querendo a mesma coisa.',
        fala: 'Gente viva, de botas sujas, no meu chão. O último que entrou assim nunca mais saiu da mata. Falem logo.',
        opcoes: [
          { texto: 'Trouxemos um presente, senhora: um pente de prata.', vai: 'pente',
            requer: () => (temPente() ? null : 'ninguém tem o pente'), oculta: true },
          { texto: 'Viemos com respeito pedir uma resposta, senhora.', teste: { pericia: 'persuasao', cd: 15 }, sucesso: 'aceita', falha: 'recusa' },
          { texto: 'Responda o que perguntarmos, fantasma.', fim: 'ofendida' },
          // AMEAÇAR é gesto diferente de ser grosseiro, e o livro trata os dois: rude, desrespeitoso OU
          // ameaçador, e em qualquer um deles ela some e não volta. O jogo só tinha a grosseria.
          { texto: 'Responda, ou descobrimos o que mata o que já morreu.', fim: 'ofendida' },
          { texto: 'Desculpe o incômodo. Já vamos.', fim: 'sai' },
        ],
      },
      pente: {
        ao: () => tirarPente(),
        narra: 'Ela olha o pente por um tempo longo. Os dedos de luz não conseguem segurá-lo, mas o rosto se desfaz um pouco.',
        fala: 'Faz muito tempo que alguém me trouxe uma coisa bonita. Muito bem.',
        opcoes: [{ texto: '…', vai: 'aceita' }],
      },
      // O OBELISCO: a Persuasão que falha não manda voltar amanhã — ela ataca.
      recusa: {
        fala: 'Palavras de mercador. Ninguém fala assim na minha casa.',
        narra: 'A luz dela cresce, e o frio vira uma coisa que dói.',
        opcoes: [{ texto: '…', fim: 'recusa' }],
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

  if (fim === 'recusa') return { motivo: 'recusa' };
  if (fim === 'ofendida') {
    // O OBELISCO: ofendida, a banshee tenta espantar o grupo com a VISAGEM HORRIPILANTE (Sabedoria CD 13; quem falha
    // fica amedrontado). Se isso não bastar para eles irem embora, ela ataca.
    const amedrontados = [];
    const imunes = [];
    const linhas = vivos().map((h) => {
      const bonus = Math.floor(((h.abilities?.wis ?? 10) - 10) / 2) + ((h.saves ?? h.savingThrows ?? []).includes?.('wis') ? (h.proficiency ?? h.proficiencyBonus ?? 2) : 0);
      const total = 1 + Math.floor(Math.random() * 20) + bonus;
      if (total >= 13) { imunes.push(h.id); return `${h.name} aguenta o olhar (Sabedoria ${total}).`; }
      amedrontados.push(h.id);
      return `${h.name} recua, gelado até os ossos, com as pernas querendo correr (Sabedoria ${total}).`;
    });
    const r = await narrar(app.root, { formato: 'painel', paginas: [{ titulo: 'O covil', texto: [
      'O rosto dela muda: a pele se estica sobre o osso, os olhos viram dois buracos, e o que olha de dentro deles é a morte sem pressa. A Visagem Horripilante.',
      ...linhas,
      imunes.length ? 'Ela ainda está ali, esperando para ver se vocês entenderam.' : 'Ninguém aguenta. Vocês estão do lado de fora antes de decidir sair.',
    ] }],
    escolhas: imunes.length
      ? [{ rotulo: 'Sair da cabana', valor: 'sair', primaria: true }, { rotulo: 'Ficar', valor: 'ficar' }]
      : [{ rotulo: 'Continuar', valor: 'sair', primaria: true }] });
    if (r === 'ficar') return { motivo: 'ofendida', amedrontados, imunes };
    salvo.estado = 'sumiu';
    await painel('O covil', 'Quando o frio passa, a luz já sumiu, e a cabana está escura e vazia. Ela não vai voltar, nem que vocês chamem a noite inteira.');
    return null;
  }
  if (!['grimorio', 'torre', 'castelo', 'ondaEco', 'aranha'].includes(fim)) return null;

  salvo.estado = 'respondeu';
  const respostas = {
    grimorio: () => {
      feitos.agathaGrimorio = true;
      pista('Agatha disse onde foi parar o grimório de Arco Suave: ela mesma o trocou, há mais de cem anos, com um necromante chamado Tsernoth, na cidade de Iriaebor. Do que houve depois, não sabe.');
      return 'Eu o troquei. Faz mais de cem anos, com um necromante de Iriaebor que se chamava Tsernoth. O que ele fez com o livro, eu não sei, e não me importa.';
    },
    torre: () => {
      feitos.agathaTorre = true;
      pista('Agatha disse o nome da maga que ergueu a torre do Poço da Coruja Velha: Dresina. É o que o Hamun Kost queria saber.');
      return 'Dresina. Era uma mulher vaidosa, e a torre dela caiu antes da vaidade.';
    },
    castelo: () => {
      feitos.sabeOCastelo = true;
      pista('Agatha disse onde fica o Castelo Dentefino: dentro da Floresta de Neverwinter, ao norte da Trilha de Triboar. Agora ele aparece no mapa da região.');
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
  return null;
}
