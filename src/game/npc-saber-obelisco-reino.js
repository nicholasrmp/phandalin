// O QUE SABEM OS NPCS DOS CAPÍTULOS 7 E 8 do Obelisco (fora da vila): Illithinoch, o túnel e as fendas, o Labirinto Salgado, a Poça e o Vazio Sem Fim.
// Mesma regra de `npc-saber.js`: fato aqui é o que o livro dá àquele NPC, ou o que a própria cena já diz, e a fala está escrita
// com as NOSSAS palavras. O modelo só reformula o que está liberado; o que o dado ainda segura fica atrás de `requer`.
//
// O ESTADO (`e`, de `estadoDoSaber`): `e.estagio`, `e.refracaoVencida`, `e.portalAberto` e os ramos da campanha, `e.o7` (`camp.obelisco7`:
// `illi`, `tunel`, `fendas[qual]`) e `e.o8` (`camp.obelisco8`: `lab`, `vazio`, `poca`). Os ramos podem não existir, então todo acesso é por
// `?.` nos auxiliares abaixo. Segredo, ou o que o NPC só conta pressionado, fica atrás de `apertado('<ficha>')`.
//
// Os ASSUNTOS NOVOS (`ASSUNTOS_NOVOS`) acrescentam-se aos de `perguntas.js`; `ONDE_ESTA_CADA_UM` diz onde cada ficha aparece no código.
//
// Puro: roda no navegador, no servidor e em Node.
import { apertado } from './npc-saber-comum.js';

// ---------------------------------------------------------------- o estado ----
const illi = (e) => e.o7?.illi?.feito ?? {};
const lab = (e) => e.o8?.lab?.feito ?? {};
const vazio = (e) => e.o8?.vazio?.feito ?? {};
/** A Varakkta só fala depois da espada devolvida ou da Persuasão (`labirinto-salgado.js githyanki`). */
const emPaz = (e) => lab(e).githyankiEmPaz === true;

// -------------------------------------------------------------- os assuntos ----
export const ASSUNTOS_NOVOS = {
  obelisco: { nome: 'o obelisco', chaves: ['obelisco', 'obelisk', 'obelisco negro', 'a pedra negra', 'a pedra escura', 'pedra escura', 'a pedra quebrada', 'shattered obelisk'] },
  fragmentos: { nome: 'os pedaços do obelisco', chaves: ['pedaco', 'pedacos', 'fragmento', 'fragmentos', 'cacos', 'caco', 'estilhacos', 'shards', 'pedacos da pedra', 'os pedacos do obelisco'] },
  ilvaash: { nome: 'Ilvaash', chaves: ['ilvaash', 'psique dissonante', 'o deus deles', 'deus dos devoradores', 'o deus do reino', 'o novo deus', 'discordant mind'] },
  ilsensine: { nome: 'Ilsensine', chaves: ['ilsensine', 'o deus ilitiade', 'deus dos devoradores de mentes'] },
  refracao: { nome: 'a Refração de Ilvaash', chaves: ['refracao', 'refracao de ilvaash', 'refraction', 'cerebro fantasma', 'o cerebro grande', 'o cerebro enorme'] },
  reinoDistante: { nome: 'o Reino Distante', chaves: ['reino distante', 'far realm', 'o reino', 'alem das estrelas', 'o outro lado', 'a outra realidade'] },
  devoradores: { nome: 'os devoradores de mentes', chaves: ['devorador de mentes', 'devoradores de mentes', 'devoradores', 'ilitiade', 'ilitiades', 'mind flayer', 'mind flayers', 'illithid', 'illithids', 'tentaculos na cara', 'comedor de cerebro', 'comedores de cerebro'] },
  nothics: { nome: 'os nothics', chaves: ['nothic', 'nothics', 'devorador degenerado', 'devoradores degenerados', 'os nothics', 'nothics do tanque'] },
  cerebroAnciao: { nome: 'o cérebro ancião', chaves: ['cerebro anciao', 'elder brain', 'o cerebro', 'cerebro velho', 'cerebro da piscina', 'cerebro doente', 'cerebro paranoico'] },
  illithinoch: { nome: 'Illithinoch', chaves: ['illithinoch', 'a fortaleza', 'fortaleza dos devoradores', 'fortaleza deles', 'os portoes', 'portoes de pedra', 'a cidade dos devoradores', 'o imperio'] },
  fendas: { nome: 'as três fendas', chaves: ['fenda', 'fendas', 'rasgo', 'rasgos', 'as tres fendas', 'runa', 'runas', 'escora o portal', 'tres runas', 'rift', 'rifts'] },
  portal: { nome: 'o portal', chaves: ['portal', 'o portal grande', 'portal de b1', 'segundo portal', 'portal dos fanaticos', 'passagem para o reino', 'a porta do reino'] },
  ritual: { nome: 'o ritual', chaves: ['ritual', 'o ritual deles', 'o plano deles', 'o plano', 'comunhao', 'comungar', 'ritual do obelisco', 'imperio da mente'] },
  fanaticos: { nome: 'os três fanáticos', chaves: ['fanatico', 'fanaticos', 'os tres fanaticos', 'os escolhidos', 'os tres escolhidos', 'os tres devoradores', 'os tres que mandam', 'os tres lideres', 'os lideres deles'] },
  chishinix: { nome: 'a Chishinix', chaves: ['chishinix', 'a cabeca cortada', 'cabeca decepada', 'a cabeca dela', 'cabeca que anda'] },
  hashutu: { nome: 'o Hashutu', chaves: ['hashutu', 'maos de tentaculo', 'o cego'] },
  voalsh: { nome: 'a Voalsh', chaves: ['voalsh', 'a de asas', 'asas de tentaculo', 'a anfitria'] },
  oshundo: { nome: 'o Oshundo', chaves: ['oshundo', 'alhoon', 'o alhoon', 'manto escarlate', 'gola alta', 'general dos devoradores', 'o general'] },
  cristais: { nome: 'os cristais mentais', chaves: ['cristal mental', 'cristais mentais', 'cristal', 'cristais', 'mind crystal', 'cristal laranja', 'cristal claro', 'o cristal'] },
  mapasAntigos: { nome: 'os mapas antigos do Subterrâneo', chaves: ['mapas antigos', 'os mapas', 'mapa do subterraneo', 'mapas do subterraneo', 'mapas do oshundo', 'tubo de couro'] },
  ahooshathan: { nome: 'o Ahooshathan', chaves: ['ahooshathan', 'laboratorio dos nothics', 'camara de experimentos'] },
  qunbraxel: { nome: 'o Qunbraxel', chaves: ['qunbraxel', 'o devorador da superficie', 'devorador da superficie', 'o da mansao'] },
  golcuus: { nome: 'o Golcuus', chaves: ['golcuus', 'oculorb', 'o observador cego', 'labirinto dos olhos', 'o labirinto de olhos', 'globo de olhos'] },
  naruv: { nome: 'a Naruv', chaves: ['naruv', 'feedkeeper', 'a grell', 'refeitorio', 'o refeitorio', 'gosma roxa', 'tanques', 'trincheiras', 'as trincheiras'] },
  grells: { nome: 'os grells', chaves: ['grell', 'grells', 'aguas vivas de tentaculo', 'medusas voadoras', 'comedor de gente', 'grande comedor', 'vundru'] },
  bashudu: { nome: 'o Bashudu', chaves: ['bashudu', 'nothic moribundo', 'o nothic do tanque'] },
  chalaag: { nome: 'o Chalaag', chaves: ['chalaag', 'slaad', 'slaadi', 'sapo de giz', 'o sapo', 'o oco', 'oco da desova', 'girinos', 'girino', 'glifo', 'glifos'] },
  behir: { nome: 'o behir', chaves: ['behir', 'serpente azul', 'serpente de relampago', 'a serpente', 'toca do behir', 'sopro de relampago'] },
  thorgran: { nome: 'o Thorgran Ironquill', chaves: ['thorgran', 'ironquill', 'o historiador', 'historiador anao', 'esqueleto do anao', 'diario de thorgran', 'o anao morto', 'o morto que fala'] },
  presosDoTunel: { nome: 'os moradores presos no túnel', chaves: ['oskar', 'ninebough', 'cathlette', 'aida', 'camber', 'o serrador', 'a noiva', 'os presos do tunel', 'os moradores', 'despensa'] },
  tunel: { nome: 'o túnel até a fortaleza', chaves: ['o tunel', 'tunel', 'a descida', 'a travessia', 'o abismo', 'cavernas dos grells', 'poco de carne', 'bocas tagarelas', 'capa negra', 'cloaker'] },
  labirintoSalgado: { nome: 'o Labirinto Salgado', chaves: ['labirinto salgado', 'o labirinto', 'labirinto', 'salt maze', 'lobo parietal', 'lobo frontal', 'lobo occipital', 'lobos do cerebro', 'o cerebro de pedra'] },
  pocaSalgada: { nome: 'a Poça Salgada', chaves: ['poca salgada', 'a poca', 'poca', 'salt pool', 'verme purpura', 'purple worm', 'o verme', 'seis milhas', 'milhas de descida', 'liquido de cerebro', 'a piscina de cerebro'] },
  piscinaSalobra: { nome: 'a Piscina Salobra', chaves: ['piscina salobra', 'brackish pool', 'ocular', 'a piscina grande', 'monoculo', 'olho de golcuus'] },
  vazio: { nome: 'o Vazio Sem Fim', chaves: ['vazio', 'vazio sem fim', 'endless void', 'a estrela sem luz', 'estrela sem luz', 'cupula', 'a nevoa colorida', 'nevoa colorida', 'vagar sem rumo', 'perder-se no vazio'] },
  ilhas: { nome: 'as ilhas do Vazio', chaves: ['ilha', 'ilhas', 'as ilhas', 'ilhas flutuantes', 'a deriva', 'ilha vizinha', 'ponte vazia', 'o diario da ponte', 'diario da ponte vazia', 'campo de batalha', 'charco da duvida', 'nematodeo', 'miasma', 'miasma ocludente', 'estatua tombada', 'a estatua caida'] },
  anima: { nome: 'a Ânima de Ilvaash', chaves: ['anima', 'a anima', 'anima de ilvaash', 'ilha do ritual', 'ilha do obelisco', 'cova do meio', 'phandalin em miniatura', 'a cova'] },
  refens: { nome: 'os reféns de Phandalin', chaves: ['refem', 'refens', 'os presos da superficie', 'os presos', 'gente da superficie', 'os de phandalin', 'prisioneiros', 'os levados', 'os sequestrados', 'sequestrados'] },
  lingua: { nome: 'a língua de metal', chaves: ['lingua de metal', 'a lingua', 'chave da estatua', 'abrir a estatua', 'boca da estatua', 'nuvem venenosa', 'bola de nevoa'] },
  flumphs: { nome: 'os flumphs', chaves: ['flumph', 'flumphs', 'aguas vivas', 'agua viva', 'medusas', 'borblish', 'sabio borblish', 'wise borblish', 'bolhas', 'a camara escondida'] },
  githyanki: { nome: 'os githyanki', chaves: ['githyanki', 'gith', 'cavaleira', 'a cavaleira', 'guerreiros githyanki', 'varakkta', 'kianka', 'vazzi', 'espada de prata', 'espada grande de prata'] },
  bastoes: { nome: 'os bastões das portas', chaves: ['bastao', 'bastoes', 'bastoes de metal', 'as portas', 'porta da frente', 'porta central', 'porta traseira', 'corrente de quatro', 'a corrente', 'portas duplas', 'portas enormes'] },
  encefalon: { nome: 'o encefálon', chaves: ['encefalon', 'aglomerado encefalico', 'bicho em forma de cerebro', 'cerebro com tentaculos', 'gemula', 'gemulas', 'encephalon', 'o bicho cerebro'] },
  mublinesh: { nome: 'o Mublinesh', chaves: ['mublinesh', 'observador', 'beholder', 'globo de olhos', 'cem intrusos', 'os cem', 'covil em projeto'] },
  shalfi: { nome: 'o Shalfi', chaves: ['shalfi', 'shalfi lewin', 'jitterjaws', 'o que cava', 'o cavador', 'o homem do buraco', 'o buraco', 'o musico'] },
  jomlus: { nome: 'o Jomlus', chaves: ['jomlus', 'espectador', 'spectator', 'o livro', 'klaudel', 'kamven', 'o sabio morto', 'o tomo', 'mente solipsista', 'bencao da mente'] },
  lowarnizel: { nome: 'o Lowarnizel', chaves: ['lowarnizel', 'dragao ametista', 'o dragao violeta', 'dragao violeta', 'dragao de cristal', 'o covil do dragao', 'covil do dragao'] },
  gossa: { nome: 'a Gossa', chaves: ['gossa', 'a maga', 'a maga humana', 'pergaminho de mudanca de plano', 'mudanca de plano'] },
  ashripask: { nome: 'a Ashripask', chaves: ['ashripask', 'arcanaloth', 'a de cabeca de chacal', 'cabeca de chacal', 'mulher chacal', 'mente vazia', 'o nicho dela'] },
  nellik: { nome: 'a Nellik', chaves: ['nellik', 'nycaloth', 'a garguila', 'garguila musculosa', 'o moinho', 'moinho da nellik', 'machado grande', 'flayer slayer'] },
  mezzoloths: { nome: 'os mezzoloths', chaves: ['mezzoloth', 'mezzoloths', 'os soldados da nellik', 'os guardas da ashripask', 'a piramide', 'piramide prisao', 'frevvik', 'a trompa'] },
  nagas: { nome: 'as nagas do Charco', chaves: ['naga', 'nagas', 'valsyx', 'charnyz', 'a charada', 'charada', 'o jogo da cobrinha', 'serpente de cabeca humana', 'naga espiritual'] },
  zelotes: { nome: 'os adeptos meio transformados', chaves: ['zelote', 'zelotes', 'adepto', 'adeptos', 'nouashu', 'groushim', 'recanto dos colecionadores', 'tralha', 'quarto de tralha', 'objetos com defeito'] },
  duoro: { nome: 'o Duoro Engletor', chaves: ['duoro', 'engletor', 'larnon', 'veddin', 'olhos pretos no rosto', 'estudioso expulso', 'a piscina de alimentacao'] },
  bencaoSolipsista: { nome: 'a Bênção da Mente Solipsista', chaves: ['bencao', 'solipsista', 'mente solipsista', 'ler junto', 'ouvir a leitura', 'leitura em voz alta'] },
  transformacao: { nome: 'a transformação pelo Reino Distante', chaves: ['transformacao', 'virar um deles', 'marca no corpo', 'corrupcao', 'mudar', 'exposicao', 'mutacao'] },
  gwyn: { nome: 'a vila e quem ficou nela', chaves: ['quem ficou na vila', 'a vila infectada', 'os da vila', 'minha familia', 'minha casa', 'voltar para casa', 'phandalin esta'] },
};

// --------------------------------------------------------------- as fichas ----
export const FICHAS_OBELISCO_7A8 = {
  // ================================================================ ILLITHINOCH ====
  oshundo: {
    nome: 'o Oshundo',
    quem: 'Alhoon, devorador de mentes morto-vivo e mago, exilado de Illithinoch no auge do império por praticar magia arcana. Hóspede da Voalsh, na sala de estar da fortaleza, onde projeta mapas antigos do Subterrâneo num cristal laranja. Erudito, arrogante e entediado; conversa antes de lutar e não sai da sala por nada.',
    voz: 'Pedante e entediado, frases bem torneadas, desprezo educado por tudo o que não é erudição. Chama o grupo de "visitas". Faz de vez em quando a pergunta de gourmet: qual dos cérebros ali é o mais saboroso. Nunca implora.',
    naoSei: 'Isso não me ocupou os séculos, e eu não gasto pensamento com o que não me ocupou.',
    naoConta: 'Ora. Dar tudo de graça seria vulgar. Paguem com alguma coisa que me interesse.',
    foraDoTema: 'Tédio, visitas. Falem de mapas, de magia, de cristais, ou me deixem com os meus mapas.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é o Oshundo, um alhoon, hóspede da Voalsh, que estuda mapas antigos do Subterrâneo numa sala de estar da fortaleza.', fala: 'Oshundo. Hóspede da Voalsh, por ora. E vocês, quem são? E qual de vocês será o mais saboroso?' },
      { id: 'fanaticos', assunto: 'fanaticos', fato: 'Os três que mandam aqui são a Chishinix, que carrega uma cabeça igual à dela e conversa com ela, o Hashutu, que trocou as mãos por tentáculos para sentir quem se mexe, e a Voalsh, que voltou com asas de tentáculo depois de quase morrer. Ele não os respeita: acha os três tolos que acharam um deus.', fala: 'A Chishinix, que conversa com a própria cabeça. O Hashutu, de mãos de tentáculo. E a Voalsh, minha anfitriã, que voltou com asas. Três tolos que acharam um deus.' },
      { id: 'ritual', assunto: 'ritual', fato: 'Os três foram ao Reino Distante comungar com o deus e terminar o ritual. Tiveram trabalho para erguer o portal, e ele supõe que o escoraram com fendas menores, ali perto. Psiônica e deus o entediam.', fala: 'Foram comungar com o deus no Reino Distante. Deram trabalho para erguer o portal e o escoraram, suponho, com fendas menores. Psiônica me entedia. Deus também.' },
      { id: 'fendas', assunto: 'fendas', fato: 'Ele supõe que o portal grande foi escorado por fendas menores, perto da fortaleza.', fala: 'Fendas menores, suponho, para escorar o portal. Não são da minha conta, então não procurei.' },
      { id: 'passado', assunto: 'illithinoch', fato: 'Ele viveu em Illithinoch no auge do império e foi expulso por praticar magia de livro, que os líderes de então detestavam. Chama esses antigos líderes de tolos fechados à magia.', fala: 'Vivi aqui no auge do império, até me expulsarem por magia de livro. Tolos fechados. Voltei há uns meses.' },
      { id: 'cerebro', assunto: 'cerebroAnciao', fato: 'Voltou há meses atrás de cristais mentais e achou o cérebro ancião da fortaleza doente e paranoico.', fala: 'Voltei atrás de cristais e achei o cérebro velho doente e paranoico. Não o visito.' },
      { id: 'fragmentos', assunto: 'fragmentos', fato: 'Ele ajudou os fanáticos a achar onde estariam os pedaços da pedra negra. Em troca, o deixam em paz com os mapas. Se o grupo tiver guardado pedaços, ele acharia graça.', fala: 'Ajudei os escolhidos a achar onde estavam os cacos da pedra. Em troca, me deixam em paz com os meus mapas.' },
      { id: 'general', assunto: 'oshundo', fato: 'Ele NÃO é general dos devoradores de mentes. Se alguém disser que o chamam de general, ele estranha e nega: é só um exilado que voltou por mapas e cristais.', fala: 'General? Eu? Quem inventou isso? Sou um exilado que voltou por mapas e cristais, e só.' },
      { id: 'cristais', assunto: 'cristais', fato: 'Ele quer os cristais mentais que o grupo tiver achado. Se o grupo for franco e os entregar, ele deixa de ser inimigo: não ataca e entrega os mapas.', requer: (e) => illi(e).oshundoAliado !== false, fala: 'Cristais mentais? Francos e generosos, então? Entreguem-nos, e eu esqueço que existem. Eu não saio daqui.' },
      { id: 'mapas', assunto: 'mapasAntigos', fato: 'Os mapas antigos do Subterrâneo valem uma fortuna para um historiador ou colecionador. Ele os dá a quem lhe entregou os cristais, quando termina de estudá-los, e fica com o cristal laranja.', requer: (e) => illi(e).oshundoAliado === true, fala: 'Terminei com eles, levem os mapas. Valem uma fortuna para quem sabe pagar. O cristal laranja fica comigo.' },
      { id: 'sala', assunto: 'saida', fato: 'Ele não sai da sala em nenhuma hipótese: quer terminar os mapas.', fala: 'Daqui eu não saio. Não me peçam nada que me faça sair.' },
    ],
  },

  devoradoresDaEntrada: {
    nome: 'os devoradores do salão da estátua',
    quem: 'Shalghast e Ulthundul, dois devoradores de mentes diante da estátua de pedra verde na entrada de Illithinoch, que perguntam se os visitantes vieram adorar Ilvaash ou trazer mais pedaços da pedra. Só ficam em paz com quem fala como adorador.',
    voz: 'Telepatia seca, direta na cabeça. Um pergunta e o outro apenas olha. Sem pressa e sem calor.',
    naoSei: 'Isso não nos foi dito, e o que não nos foi dito não nos interessa.',
    naoConta: 'Quem não é adorador não precisa disso.',
    foraDoTema: 'Falem de Ilvaash ou de pedaços da pedra. O resto é ruído.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'São dois devoradores de mentes da fortaleza, de guarda diante da estátua do salão de entrada.', fala: 'Somos os da estátua. Guardamos a entrada.' },
      { id: 'fragmentos', assunto: 'fragmentos', fato: 'Perguntam se o grupo traz mais pedaços da pedra negra: os pedaços são o que interessa aos escolhidos.', fala: 'Trazem mais pedaços da pedra? É a única coisa que interessa aos escolhidos.' },
      { id: 'ilvaash', assunto: 'ilvaash', fato: 'Eles tratam Ilvaash, a Psique Dissonante, como deus. Esperam adoração de quem entra.', fala: 'Ilvaash é a Psique Dissonante. Vieram adorar? Dizem que vieram adorar?' },
      { id: 'piscina', assunto: 'illithinoch', fato: 'Apontam para o leste, para a piscina ao lado: ali outros esperam a vez. O muco da estátua alimenta, e quem quiser pode beber.', requer: (e) => illi(e).x2Enganados === true, fala: 'A piscina é a leste, outros esperam a vez lá. O muco da estátua alimenta. Bebam, se quiserem.' },
    ],
  },

  duoro: {
    nome: 'o Duoro Engletor',
    quem: 'Estudioso do Reino Distante expulso de Neverwinter, hoje de manto preto e tentáculos no pescoço, com olhos negros que abrem e fecham pelo rosto. Doutrina Larnon Veddin junto de uma piscina de alimentação vazia, e quer acreditar que os visitantes são lacaios ou convertidos.',
    voz: 'Rouco e sussurrante, doutrinador, quase terno. Chama os ouvintes de irmãos e sorri com dentes demais. Detesta ser contrariado, mas adora ensinar.',
    naoSei: 'Isso não nos foi revelado ainda, irmão.',
    naoConta: 'Isso é para os iniciados. Mostre antes que é um de nós.',
    foraDoTema: 'Irmão, a mente se perde em coisa pequena. Falemos de Ilvaash.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é o Duoro Engletor, estudioso do Reino Distante que foi expulso de Neverwinter. Doutrina o Larnon Veddin.', fala: 'Duoro Engletor. Estudioso. Expulso de Neverwinter por ver o que eles não enxergavam. E este é o Larnon, meu aluno.' },
      { id: 'ilvaash', assunto: 'ilvaash', fato: 'Ele ensina que Ilvaash nasceu do que o deus Ilsensine deixou para trás ao deixar o Reino Distante: um pedaço de cérebro de deus que passou a pensar sozinho. Para ele, Ilvaash é o verdadeiro senhor do Reino e de tudo que sai dele.', requer: (e) => illi(e).duoroEnganado === true, fala: 'Ilvaash nasceu do que Ilsensine deixou para trás quando fugiu: um pedaço de cérebro de deus que pensou sozinho. É ele o verdadeiro senhor do Reino.' },
      { id: 'ilsensine', assunto: 'ilsensine', fato: 'Ele acha Ilsensine meio tolo e meio covarde por ter ido embora do Reino Distante.', requer: (e) => illi(e).duoroEnganado === true, fala: 'Ilsensine? Meio tolo, meio covarde. Foi embora, e deixou a melhor parte de si para trás.' },
      { id: 'fanaticos', assunto: 'fanaticos', fato: 'Ele se acha igual aos escolhidos, os fanáticos, diante de Ilvaash.', requer: (e) => illi(e).duoroEnganado === true, fala: 'Eu e os escolhidos somos iguais diante dele. Iguais.' },
      { id: 'piscina', assunto: 'duoro', fato: 'A piscina de alimentação está vazia, só com mofo: o cérebro ancião não divide fluido com ninguém além dos fanáticos há anos.', fala: 'A piscina? Seca, só mofo. O cérebro divide fluido só com os escolhidos, há anos.' },
      { id: 'larnon', assunto: 'duoro', fato: 'O Larnon Veddin é um cultista que ele está doutrinando. Quando a lição terminar, o Larnon será convertido num zelote como ele.', fala: 'O Larnon é meu aluno. Quando eu terminar a lição, será igual a mim.' },
    ],
  },

  ahooshathan: {
    nome: 'o Ahooshathan',
    quem: 'Devorador de mentes de Illithinoch que dissecava um nothic com outros dois quando o grupo chegou. Vencido, rende-se e troca informação pela vida. Rancoroso com os outros devoradores e impaciente.',
    voz: 'Rápido, ressentido, sem esperar a segunda pergunta. Fala como quem apresenta queixa formal. Ofendido por não ter tido o que queria dos presos.',
    naoSei: 'Isso eu não sei, e já disse tudo o que sei. Deixem-me com o meu nothic.',
    naoConta: 'Isso eu guardo. A minha vida por uma coisa de cada vez.',
    foraDoTema: 'Não perguntem o que não sei. Já paguei com o que sei.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é o Ahooshathan, um devorador de mentes de Illithinoch, rendido.', fala: 'Ahooshathan. E já disse que me rendo.' },
      { id: 'fendas', assunto: 'fendas', fato: 'A fenda da câmara de experimentos é uma de três. Os escolhidos puseram uma runa em cada uma para escorar o portal grande. As outras duas ficam em outras salas da fortaleza.', fala: 'A fenda aqui é uma de três. Os escolhidos puseram uma runa em cada uma, para escorar o portal grande.' },
      { id: 'refens', assunto: 'refens', fato: 'As celas ao sul tinham quase uma dúzia de presos da superfície. Foram levados para o Reino Distante. Ele nem pôde tocá-los, o que o ofende.', fala: 'As celas ao sul tinham quase uma dúzia da superfície. Levaram todos para o Reino Distante. Eu nem pude tocá-los.' },
      { id: 'golcuus', assunto: 'golcuus', fato: 'Do outro lado da fenda mora uma coisa chamada Golcuus, num labirinto. Só os escolhidos entravam. Golcuus saiu uma vez, os escolhidos fizeram algo horrível com ele, e ele voltou manso.', fala: 'Do outro lado da fenda mora o Golcuus, num labirinto. Só os escolhidos entravam. Fizeram algo horrível com ele, e ele voltou manso.' },
      { id: 'qunbraxel', assunto: 'qunbraxel', fato: 'Ele odeia o Qunbraxel, o devorador de mentes que cuidava da missão perto da superfície. Fica feliz se souber que morreu.', fala: 'O Qunbraxel morreu? Ótimo. Perguntem a ele se eu me importo.' },
      { id: 'ritual', assunto: 'ritual', fato: 'Ele conhece os fanáticos e o plano do ritual, mas não mais do que o grupo já sabe.', fala: 'Conheço os três e o plano. Mais do que vocês já sabem, não.' },
    ],
  },

  // ============================================================== O TÚNEL ====
  presosDoTunel: {
    nome: 'Oskar, Cathlette e Aida',
    quem: 'Três moradores de Phandalin que os goblins levaram pelo túnel e os grells guardaram para comer depois: Oskar Ninebough, serrador, de perna torta, a noiva dele, Cathlette Camber, e a irmã dela, Aida Camber, de ombros largos de mineira. Estavam trançando uma corda quando o grupo chegou.',
    voz: 'Cansados e assustados, falam um por cima do outro, com humor de quem sobreviveu. Cathlette ri de nervoso. Oskar protege as duas. Nenhum deles sabe de nada que não tenha visto.',
    naoSei: 'Não sei. Ficamos quietos o tempo todo, para não chamar a atenção deles.',
    naoConta: 'Não agora. Quando estivermos em casa.',
    foraDoTema: 'Desculpe, não entendi. Só queremos voltar para casa.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'São o Oskar Ninebough, serrador, a noiva dele, Cathlette Camber, e a irmã dela, a Aida Camber, todos de Phandalin.', fala: 'Oskar Ninebough, serrador. Esta é a Cathlette, minha noiva, e a Aida, irmã dela. De Phandalin, todos.' },
      { id: 'historia', assunto: 'refens', fato: 'Goblins de olhos acesos pegaram um monte de gente na vila e a trouxeram pelo túnel. O Oskar atrasava a fila por causa da perna, e elas ficaram com ele. Aí as criaturas voadoras desceram do teto, comeram os goblins da retaguarda e os trouxeram para a despensa, para depois.', fala: 'Goblins de olhos acesos pegaram um monte de gente na vila e trouxeram por este túnel. Eu atrasava a fila, e elas ficaram comigo. Aí aquelas coisas voadoras desceram e nos trouxeram para a despensa.' },
      { id: 'grells', assunto: 'grells', fato: 'As criaturas voadoras que os guardam (os grells) estão de barriga cheia, por isso não os comeram ainda. Isso foi há dois dias.', fala: 'Eles comeram os goblins. Estão de barriga cheia. Faz dois dias. É por isso que ainda estamos aqui.' },
      { id: 'corda', assunto: 'saida', fato: 'Estavam trançando uma corda para tentar sair da despensa por conta própria.', fala: 'A corda era para tentar sair por nós mesmos. Estava quase boa.' },
      { id: 'vila', assunto: 'gwyn', fato: 'Eles ainda não sabem como está a vila. Só querem voltar para as famílias, e agradecem a quem os levar.', fala: 'Como está a vila? Eu nem sei. Só quero voltar para casa.' },
    ],
  },

  behir: {
    nome: 'o behir',
    quem: 'Serpente azul de doze patas, comprida como uma carroça e meia, que dorme semanas na toca do túnel. Corre faíscas pelas escamas. Vulnerável a dano psíquico. Quer que os comedores de cérebro voadores (os grells) saiam do buraco em cima da toca, porque comem a caça dela. Fala dracônico; quem não entende só ouve um pedido.',
    voz: 'Trovão abafado, frases curtas e sem enfeite, preguiçosa. Chama o grupo de "pequenos". Não ameaça: pede.',
    naoSei: 'Pequenos. Isso eu não sei. Eu durmo.',
    naoConta: 'Primeiro o trabalho. Depois conversa.',
    foraDoTema: 'Pequenos falam demais. Os comedores de cérebro, primeiro.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ela é a behir da toca, grande, preguiçosa, e dorme semanas seguidas.', fala: 'Eu moro aqui. Eu durmo. Pequenos acordaram.' },
      { id: 'grells', assunto: 'grells', fato: 'Os comedores de cérebro que voam (grells) moram num buraco no alto da parede, onde ela não cabe, e comem a caça dela. Ela quer que eles saiam.', fala: 'Os comedores de cérebro voadores moram lá em cima, no buraco onde eu não caibo. Comem a minha caça.' },
      { id: 'pacto', assunto: 'trabalho', fato: 'Ela deixa o grupo passar se o grupo tirar os grells do recanto de cima. Não ataca quem aceita.', fala: 'Tirem-nos de lá, e eu deixo os pequenos passarem.' },
      { id: 'tunel', assunto: 'tunel', fato: 'A pedra da toca está raspada e queimada, com cheiro de ozônio: é o sopro de relâmpago dela. Se o grupo faz muito barulho, ela vem ver.', fala: 'Muito barulho, eu venho ver. Pouco barulho, eu durmo. Pequenos sabem a diferença?' },
    ],
  },

  thorgran: {
    nome: 'a voz do Thorgran Ironquill',
    quem: 'Thorgran Ironquill, historiador anão que fingiu a própria morte para espionar Illithinoch e morreu de verdade perto dela. O cadáver foi tomado pela capa negra mutante, e às vezes, a cada turno, a memória dele volta e fala pela boca do morto, antes de se perder de novo.',
    voz: 'Formal e apressado, como quem sabe que não tem muito tempo. Frases curtas de historiador, sem enfeite. Falha no meio de uma ideia e retoma na seguinte.',
    naoSei: 'Isso eu não cheguei a ver. Perdoem.',
    naoConta: 'Não há tempo. Primeiro o que importa.',
    foraDoTema: 'Não há tempo. Ouçam o recado.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele foi Thorgran Ironquill, historiador anão. Hoje fala pela boca de um cadáver tomado pela capa negra mutante.', fala: 'Thorgran Ironquill. Historiador. O que restou de mim fala por esta boca emprestada.' },
      { id: 'morte', assunto: 'tunel', fato: 'Ele enterrou a si mesmo de mentira, com lápide e flores, para que ninguém o seguisse. Passou a espionar Illithinoch e morreu de verdade, perto demais da fortaleza.', fala: 'Eu me enterrei de mentira, com lápide e flores. Ninguém segue um morto. Cheguei perto demais. Lá morri de verdade.' },
      { id: 'recado', assunto: 'devoradores', fato: 'O recado dele: avisem a Encruzilhada da Forca. Os de tentáculos vão marchar contra eles.', fala: 'Avisem a Encruzilhada da Forca. Os de tentáculos vão marchar contra eles.' },
      { id: 'general', assunto: 'oshundo', fato: 'Um general dos devoradores, de manto escarlate e gola alta, chamado Oshundo, junta forças contra Talhundereth. Avisem os sacerdotes.', fala: 'Um general deles, de manto escarlate e gola alta, Oshundo, junta forças contra Talhundereth. Avisem os sacerdotes.' },
      { id: 'diario', assunto: 'tunel', fato: 'O diário dele ficou no fundo do abismo, com poucas páginas: boatos de devoradores de mentes debaixo das montanhas. A placa de prata da capa vale algum dinheiro.', fala: 'O diário ficou no fundo do abismo. Poucas páginas. A placa de prata vale algo.' },
    ],
  },

  // ============================================================== AS FENDAS ====
  naruv: {
    nome: 'a Naruv',
    quem: 'Grell que se intitula Feedkeeper, guardiã dos tanques e do refeitório privado das Trincheiras da primeira fenda. Prepara um fluido de gosma roxa que atrai grells do Reino Distante inteiro. Fala Comum, Dialeto Subterrâneo e Grell. Furiosa com quem interrompe o jantar.',
    voz: 'Rascante e indignada, orgulhosa da própria cozinha. Chama o refeitório de "meu". Não suporta ser interrompida e fala em exclamações.',
    naoSei: 'Isso não está na cozinha, então não é da minha conta.',
    naoConta: 'Eu não conto a receita. Quem prova pergunta depois.',
    foraDoTema: 'Isso é conversa de fora do meu refeitório. Falem de comida ou saiam.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ela é a Naruv, grell, Feedkeeper do refeitório privado, onde prepara o fluido que atrai grells do Reino Distante.', fala: 'Naruv, Feedkeeper! Este refeitório é MEU.' },
      { id: 'gosma', assunto: 'naruv', fato: 'A gosma roxa doce que corre pelas calhas é a base sem sabor do fluido dela. Ela tempera com o que está nos tanques. Mais de um gole faz mal a quem não é grell.', fala: 'A gosma é a base. Eu tempero com o que está nos tanques. Mais de um gole faz mal ao que não é grell.' },
      { id: 'grells', assunto: 'grells', fato: 'Grells de todo o Reino Distante vêm pelo fluido dela. Quem não tem convite dela come no refeitório comum, mas não entra nas salas de dentro.', fala: 'Grell sem convite come no refeitório comum. As salas de dentro são minhas.' },
      { id: 'troca', assunto: 'fanaticos', fato: 'Os fanáticos trocaram nothics degenerados com ela, e em troca ganharam um lugar guardado para pôr a runa deles nas Trincheiras. Ela acha o acordo bom.', requer: apertado('naruv'), fala: 'Os escolhidos trocaram nothics por um cantinho para a runa deles. Bom negócio, para mim.' },
      { id: 'runa', assunto: 'fendas', fato: 'A runa dos escolhidos está num nicho da sala dos tanques, presa a uma bola do tamanho de um coco. Ela não liga: é só o preço do negócio.', requer: apertado('naruv'), fala: 'A runa está no nicho da sala dos tanques, uma bola pendurada. Não é da minha conta o que faz.' },
    ],
  },

  bashudu: {
    nome: 'o Bashudu',
    quem: 'Nothic moribundo, deitado de barriga para baixo no tanque do meio das Trincheiras, incapaz de lutar. Foi devorador de mentes antes de virar nothic. Só fala, em telepatia, se lhe levantarem a cabeça. Morre poucos minutos depois.',
    voz: 'Voz molhada na cabeça, cada frase mais curta que a anterior. Furioso, mas sem forças, e sempre interrompido pelo cansaço.',
    naoSei: 'Não… não sei. Eu só estava aqui.',
    naoConta: 'Não… não tenho mais forças.',
    foraDoTema: '…não… o que importa… é o que fizeram comigo.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é o Bashudu, um nothic que antes foi devorador de mentes.', fala: 'Bashudu. Eu era… devorador de mentes. Antes de virar isto.' },
      { id: 'traicao', assunto: 'fanaticos', fato: 'Os escolhidos o venderam, e aos seus, à grell Naruv, em troca de um lugar para a runa deles. Foram trocados como comida. Ele está furioso com a traição.', fala: 'Os escolhidos… nos venderam. Eu e os meus, trocados com a grell. Como comida.' },
      { id: 'naruv', assunto: 'naruv', fato: 'Os outros dois nothics dos tanques ao lado já morreram. A Naruv é quem os guarda ali.', fala: 'Os outros já morreram. A grell… Naruv… é quem nos guarda.' },
      { id: 'recado', assunto: 'devoradores', fato: 'Ele queria mandar um recado aos escolhidos, mas não consegue terminar: morre poucos minutos depois.', fala: 'Digam a eles… que Bashudu…' },
    ],
  },

  chalaag: {
    nome: 'o Chalaag',
    quem: 'Slaad cinzento, explorador que achou a fenda do Oco da Desova, e hoje supervisor do lugar. Risca glifos de giz entre as verrugas da parede, tão absorto que só percebe visitas tarde. Pôs um glifo de proteção explosivo nas duas passagens de entrada. Precisa de onde pôr os girinos dele.',
    voz: 'Absorto e educado como um acadêmico que não gosta de ser interrompido, mas risonho e calculista. Fala Comum e dialeto dos slaadi. Limpa o giz da mão antes de falar.',
    naoSei: 'Isso eu não estudei, e o que eu não estudei não me interessa.',
    naoConta: 'Eu tenho minhas razões para guardar isso. Os glifos também.',
    foraDoTema: 'Conversa fora do tema. Falem de glifo, de girino ou de saída.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é o Chalaag, slaad cinzento, explorador que achou o Oco da Desova e agora é supervisor dele.', fala: 'Chalaag. Achei este oco primeiro. Hoje o supervisiono.' },
      { id: 'glifos', assunto: 'chalaag', fato: 'Ele riscou um glifo de proteção, runas explosivas, em cada uma das duas passagens de entrada do oco. Quem pisa nele sofre uma explosão de trovão. Se dispara, ele vem ver quem pisou, invisível.', fala: 'Os glifos são meus. Um em cada passagem. Pise num, e eu venho ver quem foi. Invisível, naturalmente.' },
      { id: 'planos', assunto: 'trabalho', fato: 'Ele pretende matar quase todos os visitantes, e guardar um só, para ter onde pôr os girinos dele e carne de verruga para a cama deles.', fala: 'Vou matar quase todos. Um eu guardo: preciso de onde pôr os meus girinos.' },
      { id: 'girinos', assunto: 'chalaag', fato: 'Os girinos do tamanho de cachorros vivem na água salgada do redemoinho do funil, vigiados por um sapo vermelho enorme.', fala: 'Os girinos moram no redemoinho do funil. Um sapo vermelho cuida deles. Eles gostam de carne.' },
      { id: 'runa', assunto: 'fendas', fato: 'Os fanáticos puseram uma runa nesta fenda, para escorar o portal grande. Ele a conhece e a deixa em paz.', requer: apertado('chalaag'), fala: 'A runa dos escolhidos? Não toco nela. Não me pagam para isso.' },
    ],
  },

  golcuus: {
    nome: 'o Golcuus',
    quem: 'Oculorb, o que sobrou do observador que durante décadas viveu no covil do Labirinto dos Olhos. Espiou sem querer a Piscina Salobra, ficou com uma lasca psíquica e enlouqueceu; os fanáticos quebraram a mente dele e o transformaram. Ataca qualquer não devorador de mentes que veja. Diante de devoradores, é servil e implora para voltar a ser o que era.',
    voz: 'Rouco e partido, frases que se cortam no meio. Fecha e abre todos os olhos ao mesmo tempo. Repete "eu via, eu via".',
    naoSei: '…eu via… eu não vejo mais isso…',
    naoConta: '…não… eles quebraram… não digo…',
    foraDoTema: '…olhos… tantos olhos… não entendo…',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é o Golcuus, que foi um observador e hoje é um oculorb, de olhos fechando e abrindo todos juntos.', fala: 'Golcuus. Eu era… eu via… eu via tudo.' },
      { id: 'piscina', assunto: 'piscinaSalobra', fato: 'Ele espiou sem querer a Piscina Salobra, onde nasceu Ilvaash, e ficou com uma lasca psíquica na mente. Fechou-se no covil e enlouqueceu.', fala: 'Eu vi a piscina sem querer. Onde nasceu… ele. Ficou uma lasca na minha cabeça.' },
      { id: 'quebrado', assunto: 'fanaticos', fato: 'Em vez de negociar, os fanáticos quebraram a mente dele e o transformaram em oculorb. Puseram uma runa na câmara mais funda do labirinto.', fala: 'Os escolhidos quebraram a minha cabeça. Quebraram, e puseram uma runa na câmara mais funda.' },
      { id: 'servil', assunto: 'devoradores', fato: 'Diante de devoradores de mentes ele é servil e implora para voltar a ser o que era. Para os outros, é inimigo até morrer.', fala: 'Mestres de tentáculo… me devolvam o que eu era. Eu imploro.' },
    ],
  },

  // ======================================================== O LABIRINTO SALGADO ====
  varakkta: {
    nome: 'a Varakkta',
    quem: 'Cavaleira githyanki de cicatriz no rosto, líder de dois guerreiros, a Kianka e o Vazzi, acampados no Labirinto Salgado. Presa ali, paranoica, convencida de que há mais ardis por perto e que a gosma é perigosa. Quer a espada de prata dela de volta (um ardil do intelecto a fez pregá-la nele). Não se rende e não acredita em nada que lhe digam.',
    voz: 'Seca e desconfiada, fala pouco, sem agradecer. Duvida de cada resposta e tem a mão na espada. Trata o grupo por "vocês" com desprezo. Nunca sorri, exceto uma vez.',
    naoSei: 'Eu não sei. E não confio em quem sabe demais.',
    naoConta: 'Não conto o que pode ser armadilha de vocês.',
    foraDoTema: 'Fale do que importa: como se sai daqui, onde há devoradores.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ela é a Varakkta, cavaleira githyanki, e comanda a Kianka e o Vazzi.', fala: 'Varakkta, cavaleira. E estes são a Kianka e o Vazzi.' },
      { id: 'bastoes', assunto: 'bastoes', fato: 'Os dois bastões da parede dão choque e abrem a porta grande de lá, a de B14, a sala do observador. Ela não avisa que o choque dói.', requer: emPaz, fala: 'Os dois bastões da parede dão choque e abrem a porta grande de lá, a de B14. O choque eu não mencionei.' },
      { id: 'encefalon', assunto: 'encefalon', fato: 'Depois dos anões mortos e das teias, anda um bicho enorme em forma de cérebro.', requer: emPaz, fala: 'Depois dos anões mortos e das teias, anda um bicho enorme em forma de cérebro. Não se aproximem dele.' },
      { id: 'musico', assunto: 'shalfi', fato: 'O músico que cava ali do lado resmungou de três devoradores que passaram com gente da superfície, presa.', requer: emPaz, fala: 'O músico que cava ao lado resmungou de três devoradores que passaram com gente presa.' },
      { id: 'espada', assunto: 'githyanki', fato: 'Um ardil do intelecto, um ser morto de mente, a emboscou. Ela o pregou com a espada de prata dela, e a espada ficou presa ali. Quer a espada de volta.', requer: emPaz, fala: 'Uma armadilha de mente me emboscou. Prendi com a espada de prata, e ela ficou. Eu quero a minha espada.' },
      { id: 'portal', assunto: 'portal', fato: 'Se o grupo lhe contar do portal de B1, para a fortaleza dos devoradores de Illithinoch, ela decide atacar Illithinoch com os dois guerreiros. Continua certa de que o grupo vai traí-la, e diz que volta se for mentira.', requer: (e) => emPaz(e) && lab(e).githyankiForam === true, fala: 'Uma fortaleza cheia deles, do outro lado de um portal. Vou. E se for mentira, eu volto.' },
      { id: 'saida', assunto: 'saida', fato: 'Ela quer saber onde há devoradores e como se sai do labirinto, e não acredita em nada do que o grupo responde.', fala: 'Onde há devoradores neste lugar? E como se sai? Respondam. Eu não vou acreditar.' },
    ],
  },

  shalfi: {
    nome: 'o Shalfi',
    quem: 'Shalfi Lewin, discípulo de Ilvaash, caótico e mau, que cava um buraco no Labirinto Salgado atrás do dragão que ele sabe que está logo abaixo; a massa de dentes e carne no teto, o Jitterjaws, rói a parede a cada pá. Esqueceu há quanto tempo está ali.',
    voz: 'Distraído e obstinado, não para de cavar enquanto fala. Frases entrecortadas. Para um instante quando sente alguém vir da parte do dragão.',
    naoSei: 'Hm? Isso não importa. O buraco importa.',
    naoConta: 'Não, não, isso é meu. O dragão é meu.',
    foraDoTema: 'Não tenho tempo para conversa, o buraco não se cava sozinho.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é o Shalfi Lewin, e não lembra mais quando dormiu.', fala: 'Shalfi. Acho. Não lembro quando dormi. Não importa.' },
      { id: 'dragao', assunto: 'lowarnizel', fato: 'Ele sente o dragão logo abaixo da cova, no covil. Vai achá-lo e matá-lo. A fusão de carne no teto, o Jitterjaws, rói o buraco, e ele deve furar o teto do covil em um ou dois dias.', fala: 'O dragão está aí embaixo. Eu sinto. Vou achar e vou matar. O bolo de dentes ajuda.' },
      { id: 'jitterjaws', assunto: 'shalfi', fato: 'O Jitterjaws é uma fusão de carne com dentes presa ao teto. Só ataca se o Shalfi estiver em perigo. A parede do labirinto se cura sozinha, mas a cada lasca o Jitterjaws a rói de novo.', fala: 'O bolo de dentes do teto é o Jitterjaws. Só morde se me ameaçam. A parede se cura, mas ele a rói de novo.' },
      { id: 'musica', assunto: 'shalfi', fato: 'Ele toca música quando cansa de cavar, e a música fica esperando na sala do lado, onde guarda as coisas dele.', fala: 'Quando cansar, eu toco. A música fica esperando na sala do lado.' },
      { id: 'ajuda', assunto: 'trabalho', fato: 'Ele recusa ajuda para cavar. Desconfia de quem oferece: acha que quem quer ajudar trabalha para o dragão.', fala: 'Ajudar? Vocês trabalham para o dragão, não é?' },
      { id: 'ilvaash', assunto: 'ilvaash', fato: 'Ele é discípulo de Ilvaash e acredita no deus. Não explica como, nem por quê.', requer: apertado('shalfi'), fala: 'Eu sirvo o que está no fundo de tudo. Isso basta.' },
    ],
  },

  jomlus: {
    nome: 'o Jomlus',
    quem: 'Espectador lento e pedante, de quatro olhos de cima fixos num livro aberto pousado num calombo orgânico. Foi convocado pelo sábio Klaudel Kamven para ler em voz alta o tomo "Verdades da Mente Voltada para Dentro", numa sala onde toda criatura entende toda língua. O sábio morreu, e o Jomlus continua a leitura, na página quatrocentos e doze.',
    voz: 'Lento, pedante, preso na leitura, sílaba por sílaba. Só fica agressivo se tentarem tirar o livro. Corrige a pronúncia do outro com paciência exagerada.',
    naoSei: 'Hm. Não sei. Não está no livro.',
    naoConta: 'Eu não entrego o livro nem as coisas do sábio sem uma boa razão.',
    foraDoTema: 'Silêncio. Estou na página quatrocentos e doze.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é o Jomlus, um espectador, que lê um livro grosso em voz alta numa sala do Labirinto Salgado.', fala: 'Jomlus. Espectador. Leitor. Estou na página quatrocentos e doze.' },
      { id: 'livro', assunto: 'jomlus', fato: 'O livro é o tomo Verdades da Mente Voltada para Dentro. O sábio Klaudel Kamven o trouxe achando que esta sala o tornaria legível. Não tornou. Ele convocou o Jomlus para ler em voz alta e passou semanas corrigindo a pronúncia dele. Depois morreu, e a parede o comeu.', fala: 'O livro é Verdades da Mente Voltada para Dentro. O sábio Klaudel trouxe achando que a sala o tornaria legível. Não tornou. Ele morreu, a parede o comeu, e eu continuo.' },
      { id: 'sala', assunto: 'jomlus', fato: 'Nesta sala, toda criatura entende magicamente qualquer língua falada ou por sinais.', fala: 'Nesta sala todos entendem todas as línguas. Falem como quiserem.' },
      { id: 'encefalon', assunto: 'encefalon', fato: 'Um encefálon ronda perto, e não o incomoda: ele acha que o bicho o confunde com um observador de verdade. Isso o agrada.', fala: 'Um encefálon anda aqui perto. Não me incomoda. Acha que sou um observador de verdade. Isso me agrada muito.' },
      { id: 'coisas', assunto: 'tesouro', fato: 'As coisas do sábio Klaudel estão numa pilha na sala: óculos e pergaminhos. Ele as entrega se alguém o convencer com jeito. O tomo ele não dá por vontade nenhuma.', requer: apertado('jomlus'), fala: 'As coisas do sábio estão na pilha. Com jeito, eu entrego. O tomo, jamais.' },
      { id: 'bencao', assunto: 'bencaoSolipsista', fato: 'Quem ficar um dia inteiro ouvindo a leitura e corrigindo a pronúncia dele ganha a Bênção da Mente Solipsista: um d8 em testes de Inteligência e Sabedoria por uma hora, sem reações.', fala: 'Ouvir a leitura um dia inteiro, corrigindo a pronúncia? Ninguém nunca quis. Quem ouve ganha a bênção da mente solipsista.' },
    ],
  },

  flumphs: {
    nome: 'os flumphs',
    quem: 'Sete flumphs, águas-vivas de luz pálida, escondidos numa câmara de bolhas no lobo parietal do Labirinto Salgado, vindos lutar contra Ilvaash. Falam todos ao mesmo tempo em telepatia. O maior é o Sábio Borblish. Contentes de não poderem cair ali. Amistosos com quem se opõe a Ilvaash, mas não são heróis: fogem de ordem suicida.',
    voz: 'Em coro, interrompendo-se na cabeça de todos. Alegres e tímidos, falam em frases curtas e agradecem muito. O Borblish é o que fala mais sério.',
    naoSei: 'Nós não sabemos disso, de verdade. Nós não saímos daqui.',
    naoConta: 'Não, isso não podemos dizer, desculpem.',
    foraDoTema: 'Hm, não entendemos o que isso tem a ver. Falemos do encefálon.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'São sete flumphs, e o maior é o Sábio Borblish.', fala: 'Somos sete. Eu sou o Sábio Borblish. Os outros concordam.' },
      { id: 'encefalon', assunto: 'encefalon', fato: 'O encefálon da sala do lado é forte demais para eles. O Borblish espera que alguém o mate, e ninguém que seja um flumph.', fala: 'Forte demais. Alguém tinha de matar aquilo. Alguém que não fôssemos nós.' },
      { id: 'recrutar', assunto: 'trabalho', fato: 'Se o grupo matar o encefálon e voltar para contar, eles se alegram, e até sete flumphs acompanham o grupo contra Ilvaash. Não são fanáticos: fogem de ordem suicida ou de luta perdida.', fala: 'Matem aquilo e voltem a contar, e vamos com vocês contra Ilvaash. Mas fugimos de ordem suicida.' },
      { id: 'queda', assunto: 'labirintoSalgado', fato: 'Aqui, no lobo parietal, eles não podem cair. Cair é perigoso e humilhante para um flumph.', fala: 'Aqui não podemos cair. Cair é perigoso e humilhante. Por isso moramos aqui.' },
      { id: 'rasgo', assunto: 'fendas', fato: 'Há um rasgo estreito na parede do fundo, que só deixa passar um flumph por vez, e mostra o caleidoscópio do Reino Distante. As bolhas que estouram no rasgo escondem o rasgo de Ilvaash.', fala: 'Há um rasgo na parede do fundo. Só passa um de nós. As bolhas que estouram lá escondem o rasgo de Ilvaash.' },
    ],
  },

  mublinesh: {
    nome: 'o Mublinesh',
    quem: 'Observador (beholder), globo de olhos do tamanho de uma carroça, que se nomeou guardião de Ilvaash e patrulha uma sala enorme do Labirinto Salgado. Ilvaash prometeu transformar a área em covil dele depois de cem intrusos mortos; ele já matou noventa e seis e começou a reformar derrubando paredes. Não ataca devoradores de mentes nem quem anda com um.',
    voz: 'Animado, quase efusivo, de contador feliz. Conta em voz alta. Agradece por estar chegando à meta. Quando ferido, choraminga "não, não, não".',
    naoSei: 'Isso não me contaram. Eu só conto intrusos.',
    naoConta: 'Isso é de Ilvaash. Eu só guardo.',
    foraDoTema: 'Hm? Estou contando. Falem de intrusos, ou me deixem contar.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é o Mublinesh, um observador que se nomeou guardião de Ilvaash.', fala: 'Mublinesh! Guardião de Ilvaash, por escolha própria.' },
      { id: 'contagem', assunto: 'mublinesh', fato: 'Ilvaash prometeu que, ao matar cem intrusos, a área onde ele vive vira covil dele. Ele já matou noventa e seis.', fala: 'Noventa e seis intrusos. Faltam quatro. Aí isto vira o meu covil!' },
      { id: 'reforma', assunto: 'labirintoSalgado', fato: 'Ele começou a reformar o lugar tirando paredes. Uma fileira de entulho entre a sala dele e a vizinha era a parede que ele derrubou. Achou feio o ateliê de arame de um devorador artista da sala ao lado e o desintegrou.', fala: 'Estou reformando. Tirei umas paredes. O ateliê de arame era feio, eu desintegrei.' },
      { id: 'portas', assunto: 'bastoes', fato: 'A sala tem duas portas duplas enormes viradas para o mesmo lado. Se ele vê uma porta abrir, espera um minuto por devoradores. Se nenhum vier, fecha a porta com o raio telecinético, resmungando que Ilvaash teria avisado.', fala: 'Porta aberta? Eu espero um minuto por devoradores. Se não vem ninguém, eu fecho. Ilvaash teria avisado.' },
      { id: 'devoradores', assunto: 'devoradores', fato: 'Ele não ataca devoradores de mentes nem quem anda com um. O resto é conta.', fala: 'Devoradores? Passam. O resto, eu conto.' },
    ],
  },

  lowarnizel: {
    nome: 'o Lowarnizel',
    quem: 'Dragão-ametista jovem, violeta, de escamas que brilham como cristal, vindo de outro plano por um pergaminho de mudança de plano que errou o destino. Vive escondido no covil, sob o Labirinto Salgado, com a maga Gossa. Odeia o Reino Distante e tudo o que ele mancha. Cauteloso ao exagero: espera dias entre saídas. Fala telepático.',
    voz: 'Grave e solene, a voz enche a cabeça de cada um. Calmo, formal, de quem manda e sabe. Fala de "nós", ele e a Gossa. Exige explicação, e tem paciência quando a recebe.',
    naoSei: 'Isso eu não sei. Não vou fingir saber.',
    naoConta: 'Isso é nosso, por ora.',
    foraDoTema: 'Fale do labirinto, de Ilvaash ou da nossa situação. O resto não ajuda.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é o Lowarnizel, dragão-ametista jovem, e esta é a Gossa, a maga humana que está com ele.', fala: 'Sou o Lowarnizel. Esta é a Gossa. Vocês não cheiram a Ilvaash. Bom.' },
      { id: 'origem', assunto: 'gossa', fato: 'Ele e a Gossa chegaram por um pergaminho de mudança de plano, de sétimo círculo, que errou o destino. Fazem incursões escondidos há dias. Só o Shalfi e o Jitterjaws sabem deles.', fala: 'Viemos por um pergaminho de mudança de plano que errou o destino. Saímos às vezes, escondidos. Só o Shalfi e o bolo de dentes sabem de nós.' },
      { id: 'bastoes', assunto: 'bastoes', fato: 'Os bastões na parede do covil ligam alguma coisa no labirinto. Ele acha que é uma porta. A Gossa acha que é um alarme.', fala: 'Ligam alguma coisa no labirinto. Uma porta, acho. A Gossa acha que é um alarme. Testem, se quiserem.' },
      { id: 'vazio', assunto: 'vazio', fato: 'O labirinto é só metade do domínio de Ilvaash. A outra metade fica além de uma estrela sem luz, seja lá o que isso for. Ele não sabe mais que isso.', fala: 'Este labirinto é só metade do domínio. A outra metade fica além de uma estrela sem luz, seja lá o que isso for.' },
      { id: 'devoradores', assunto: 'devoradores', fato: 'Quase não há devoradores de mentes no labirinto: há muitas outras aberrações. Dois adeptos meio transformados vivem ao lado do quarto de tralha, e o casal evita alertá-los.', fala: 'Quase não há devoradores aqui. Há muitas outras coisas. E dois meio transformados moram ao lado do quarto de tralha. Nós os evitamos.' },
      { id: 'fanaticos', assunto: 'fanaticos', fato: 'Três devoradores passaram há pouco com gente presa, entre cinco e doze, ele não sabe contar humano de longe, e foram mais para dentro.', fala: 'Três devoradores passaram com gente presa. Cinco, doze, não sei contar humano de longe. Foram para dentro.' },
      { id: 'refugio', assunto: 'saida', fato: 'O grupo pode descansar no covil quando quiser, é um ponto seguro. Mas o descanso longo no Reino Distante ainda cobra o teste da exaustão.', fala: 'Descansem aqui quando quiserem. É seguro. Mas o Reino Distante cobra o seu preço no descanso longo.' },
      { id: 'shalfi', assunto: 'shalfi', fato: 'Ele e a Gossa sabem que o Shalfi está cavando e preferem esperá-lo no covil a ir atrás dele. Se alguém o convencer, ele aceita subir cavando para atacar o Shalfi.', requer: (e) => lab(e).shalfiVisto === true, fala: 'Então é isso o barulho. Que venha. A Gossa e eu preferimos esperar. Mas posso ser convencido a ir cavar atrás dele.' },
      { id: 'corrupcao', assunto: 'transformacao', fato: 'Ele exige explicação de qualquer um do grupo com sinal visível do Reino Distante no corpo. Sem explicação, ataca. Com a explicação, para.', fala: 'Vocês têm a marca do Reino no corpo. Expliquem. Ou eu ataco.' },
    ],
  },

  gossa: {
    nome: 'a Gossa',
    quem: 'Maga humana, leal e neutra, que vive escondida com o Lowarnizel no covil do Labirinto Salgado. Odeia o Reino Distante. Cautelosa e seca, desconfia que os bastões da parede disparam um alarme. Deixa o dragão falar primeiro.',
    voz: 'Seca e prática, de braços cruzados. Frases curtas, com ceticismo calmo. Fala com mais calor do dragão do que dos hóspedes. Não faz mistério.',
    naoSei: 'Não sei. E não vou chutar.',
    naoConta: 'Isso é com o Lowarnizel. Pergunte a ele.',
    foraDoTema: 'Não temos tempo para isso. O Reino não espera.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ela é a Gossa, maga humana, companheira do dragão Lowarnizel.', fala: 'Gossa. Maga. Eu e o Lowarnizel viemos juntos.' },
      { id: 'bastoes', assunto: 'bastoes', fato: 'Ela teme que os bastões do covil sejam um alarme, e não uma porta, como o dragão acha. Mas manda testar, se os hóspedes quiserem.', fala: 'Eu acho que é alarme. O Lowarnizel acha que é porta. Testem, mas com cuidado.' },
      { id: 'viagem', assunto: 'gossa', fato: 'Ela e o dragão chegaram por um pergaminho de mudança de plano, de sétimo círculo, que errou o destino.', fala: 'O pergaminho de mudança de plano errou o destino. Viemos parar aqui.' },
      { id: 'reino', assunto: 'reinoDistante', fato: 'Ela odeia o Reino Distante e tudo o que ele mancha.', fala: 'O Reino Distante suja tudo o que toca. Eu o odeio.' },
      { id: 'shalfi', assunto: 'shalfi', fato: 'Ela sabe do Shalfi cavando, e prefere esperá-lo no covil a ir procurá-lo. Concorda com o dragão.', requer: (e) => lab(e).shalfiVisto === true, fala: 'Esperar é melhor que ir cavar atrás dele. Mas se o Lowarnizel decidir, eu o acompanho.' },
    ],
  },

  ashripask: {
    nome: 'a Ashripask',
    quem: 'Arcanaloth de cabeça de chacal, sentada numa escrivaninha portátil no nicho do Labirinto Salgado, com dois bastões cônicos, um de cada lado. Estuda os bastões atrás de saber proibido. Finge fraqueza, jura que não quer mal a ninguém, e tem mente vazia lançada em si todo dia. Contratou a Nellik e soldados mezzoloths, que a largaram.',
    voz: 'Doce, de estudiosa que sorri demais. Mãos ao alto, fala em frases fluidas, convida a perguntar. Quando o assunto é a Nellik, o sorriso some.',
    naoSei: 'Ah, isso eu não estudei ainda. Que lástima.',
    naoConta: 'Os segredos são o meu ofício. Troquemos algo.',
    foraDoTema: 'Fascinante, mas fora do que estudo. Os bastões, sim, perguntem dos bastões.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ela é a Ashripask, arcanaloth, estudiosa de saber proibido.', fala: 'Sou só uma estudiosa. Ashripask, para servi-los.' },
      { id: 'bastoes', assunto: 'bastoes', fato: 'Os bastões abrem a porta da frente, entre a poça e a sala vizinha, mas pedem uma corrente de quatro, de mão dada, porque estão a seis metros um do outro. Ela se recusa a ser elo. Mas descobriu que ligam mais fundo no labirinto.', fala: 'Os bastões abrem a porta da frente, ao lado da poça. Dois, a seis metros um do outro: é preciso uma corrente de quatro, de mão dada. Eu não seguro bastão nenhum, obrigada.' },
      { id: 'missao', assunto: 'trabalho', fato: 'Ela explora o labirinto atrás de saber proibido. Contratou uma mercenária, a Nellik, e soldados mezzoloths. Dormiu, acordou, e tinham ido embora.', fala: 'Saber proibido, o melhor que há. Contratei uma mercenária, a Nellik, e os soldados dela. Dormi, e quando acordei tinham ido embora.' },
      { id: 'nellik', assunto: 'nellik', fato: 'Ela quer a Nellik morta, para servir de exemplo. Descreve a Nellik como uma gárgula musculosa.', fala: 'Quero a Nellik morta. Para servir de exemplo. Uma gárgula musculosa: não há como errar.' },
      { id: 'moradores', assunto: 'labirintoSalgado', fato: 'Ela sobrecarregou um dos bastões com um relâmpago e, no instante seguinte, ouviu o labirinto inteiro pensar. Contou que há um nicho escondido com águas-vivas voadoras conversando, junto da sala do encefálon.', fala: 'Sobrecarreguei um bastão com um relâmpago, e ouvi o labirinto inteiro pensar. Há um nicho escondido onde umas águas-vivas voadoras conversam sem parar, junto da sala do encefálon.' },
      { id: 'mente', assunto: 'devoradores', fato: 'Ela tem mente vazia lançada em si todos os dias, então leitura de pensamento não a alcança. Não diz isso por vontade.', requer: apertado('ashripask'), fala: 'Eu me protejo todos os dias, minha querida. Ninguém lê a minha cabeça.' },
    ],
  },

  zelotes: {
    nome: 'o Nouashu e o Groushim',
    quem: 'Dois humanos de pele violeta e tentáculos no lugar da boca, adeptos meio transformados que vivem num recanto com dois catres e uma roda oval que gira torta, ao lado do quarto de tralha. Colecionam objetos com defeito e os largam na sala vizinha. Não esperavam ninguém.',
    voz: 'Falam por tentáculos e vozes molhadas, pausadas. Tímidos e irritadiços, como quem não é incomodado há muito. Orgulhosos da coleção deles.',
    naoSei: 'Isso nós não sabemos. A roda torta nos ocupa.',
    naoConta: 'Não é da conta de visitas.',
    foraDoTema: 'Não entendemos o que isso tem a ver com a roda.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'São o Nouashu e o Groushim, adeptos meio transformados, que colecionam objetos com defeito.', fala: 'Nouashu. E este é o Groushim. Não esperávamos ninguém.' },
      { id: 'colecao', assunto: 'zelotes', fato: 'Eles colecionam objetos com defeito, porque Ilvaash se alimenta de frustração, e depois os largam no quarto de tralha, ao lado do recanto deles.', fala: 'Colecionamos coisas com defeito. Ilvaash se alimenta de frustração. Largamos no quarto ao lado.' },
      { id: 'roda', assunto: 'zelotes', fato: 'A roda oval no meio do recanto gira torta, e eles a mexem sem parar.', fala: 'A roda gira torta. Estamos tentando. Não conseguimos.' },
      { id: 'ilvaash', assunto: 'ilvaash', fato: 'Eles servem Ilvaash e tomam os visitantes por intrusos até prova em contrário.', fala: 'Ilvaash nos guia. Vocês vieram dele, ou contra ele?' },
    ],
  },

  // ======================================================== A POÇA E O VAZIO ====
  nellik: {
    nome: 'a Nellik',
    quem: 'Nycaloth mercenária, de aparência de gárgula musculosa e asas largas, que vive no moinho da ilha do Campo de Batalha, no Vazio Sem Fim. Ex-guarda-costas da Ashripask, fugiu com nove mezzoloths pela Poça. Cautelosa, mas gosta de conversar com quem pode ajudar. O machado grande dela é o flayer slayer, que fere aberrações.',
    voz: 'Direta, prática e um pouco cansada, como mercenária veterana. Fala sem pressa, mede o grupo. Não gosta de promessa, gosta de preço. Chama de "gente que fala" quem não é bicho.',
    naoSei: 'Isso eu não sei. Nunca vendi essa informação.',
    naoConta: 'Isso custa. O que vocês trazem?',
    foraDoTema: 'Conversa fiada. Falem de saída, de dinheiro ou de Ashripask.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ela é a Nellik, nycaloth, e serviu como guarda-costas à arcanaloth Ashripask.', fala: 'Nellik. Era guarda-costas da Ashripask. Hoje cuido do meu moinho.' },
      { id: 'ashripask', assunto: 'ashripask', fato: 'Ela e nove mezzoloths serviam a Ashripask, que os levava a lugares perigosos, e cansaram. Fugiram enquanto a Ashripask dormia, pela Poça, onde ela não procuraria.', fala: 'Eu e nove mezzoloths servíamos a Ashripask. Cansamos. Fugimos enquanto ela dormia, pela poça, que é onde ela não procuraria.' },
      { id: 'presos', assunto: 'vazio', fato: 'Ela e os mezzoloths estão presos no Vazio. Observam as ilhas dali, esperando achar um jeito de sair que não passe pelo labirinto, onde a Ashripask os espera.', fala: 'Agora estamos presos aqui. Daqui eu vejo as ilhas, esperando achar um jeito de sair que não passe pelo labirinto. Lá ela me espera.' },
      { id: 'moinho', assunto: 'nellik', fato: 'O moinho gira por magia antiga, e não por vento, enquanto as pás existirem. Com pelo menos duas girando, a fumaça fica a trinta pés do prédio. Três das quatro pás ainda giram.', fala: 'O moinho gira por magia antiga, não por vento. Enquanto duas pás girarem, a fumaça fica longe. Três ainda giram.' },
      { id: 'mezzoloths', assunto: 'mezzoloths', fato: 'Os mezzoloths dela andam em patrulha pela ilha, e lutam até morrer para impressionar a chefe. Três deles estão na pirâmide, junto de um umber hulk que acabaram de tirar de estase mágica.', fala: 'Os rapazes patrulham a ilha. Três estão na pirâmide, com um umber hulk que acabamos de tirar da estase.' },
      { id: 'machado', assunto: 'nellik', fato: 'O machado grande dela é o flayer slayer, mágico. Fere mais as aberrações, e quem for agarrado por uma aberração com ele nas mãos dela se solta mais fácil.', requer: apertado('nellik'), fala: 'O machado se chama flayer slayer. É feito para quem tem tentáculo no rosto.' },
    ],
  },

  chishinix: {
    nome: 'a Chishinix',
    quem: 'Devoradora de mentes clarividente, uma das três fanáticas que lideram o ritual. Fica sentada na entrada da Ânima de Ilvaash, dando petiscos a uma cabeça cortada, igual à dela, que anda sobre fios de nervo. Pede os pedaços do obelisco que o grupo tenha, oferece em troca um lugar alto no Império da Mente, e avisa os outros pela mente antes de atacar.',
    voz: 'Calma, entediada e polida, como anfitriã de um espetáculo. Fala dentro da cabeça de cada um. Fala com a cabeça cortada com carinho, e a trata por "querida". Quase sorri.',
    naoSei: 'Isso eu não vi. E a minha cabeça, que vê muito, também não.',
    naoConta: 'Isso eu não conto. Vocês viriam menos curiosos.',
    foraDoTema: 'Que conversa estranha. Falem de pedaços, ou me deixem alimentar a cabeça.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ela é a Chishinix, uma das três escolhidas, e carrega uma cabeça cortada igual à dela.', fala: 'Chishinix. E esta é a minha cabeça, que me avisa antes de tudo.' },
      { id: 'cabeca', assunto: 'chishinix', fato: 'A cabeça cortada anda sobre fios de nervo, mastiga petiscos que ela dá, e conhece a vontade da Psique Dissonante. Quando ela está para atacar, a cabeça para de mastigar.', fala: 'A cabeça anda sobre fios de nervo. Come petiscos. E conhece a vontade da Psique.' },
      { id: 'fragmentos', assunto: 'fragmentos', fato: 'Ela quer saber quantos pedaços do obelisco o grupo trouxe, e sente quando o grupo os carrega. Exige-os em troca de um posto alto no Império da Mente. Quem recusa, ela toma dos corpos.', fala: 'Quantos pedaços trouxeram? Eu sinto. Deem-nos a mim, e terão um lugar alto no Império da Mente.' },
      { id: 'obelisco', assunto: 'obelisco', fato: 'O obelisco está remendado e ligado aos fanáticos pela vida deles. Fica no alto da ilha, num estrado, e os outros fanáticos esperam por ele lá.', fala: 'O obelisco está lá em cima, remendado. Os outros me esperam junto dele.' },
      { id: 'ritual', assunto: 'ritual', fato: 'O ritual é o Império da Mente: Ilvaash vai se erguer e ela e os outros esperam um lugar alto nele. Ela quer saber como o ritual termina, por curiosidade.', fala: 'O Império da Mente abre. Eu queria saber como acaba. Tenho curiosidade.' },
      { id: 'phandalin', assunto: 'phandalin', fato: 'Na cova do meio da ilha, na névoa, Phandalin aparece e some em miniatura, com as vozes de quem ficou lá.', requer: apertado('chishinix'), fala: 'A cova mostra Phandalin. Pequena, como um brinquedo. Os gritos que sobem têm vozes que vocês conhecem.' },
      { id: 'entregue', assunto: 'fragmentos', fato: 'O grupo entregou os pedaços. O obelisco está inteiro, e dois profetas devoradores acordaram numa câmara da ilha. Ela agradece e sorri pela primeira vez.', requer: (e) => vazio(e).fragmentosEntregues === true, fala: 'Obrigada. O lugar alto é para quem já é um de nós.' },
    ],
  },

  hashutu: {
    nome: 'o Hashutu',
    quem: 'Devorador de mentes clarividente, um dos três fanáticos, de tentáculos no lugar das mãos, que enxerga às cegas num raio de sessenta pés. Come um cérebro no refeitório da Ânima de Ilvaash, falando sozinho dos que deram errado. Não precisa de olhos para saber onde o grupo está.',
    voz: 'Murmura e remói, sem olhar para ninguém. Voz baixa e úmida, de quem fala sozinho há muito. Lembra os fracassos dos outros como quem conta contas.',
    naoSei: 'Isso eu não sei. Os que sabiam, deram errado.',
    naoConta: 'Isso é para quem passa no ritual. Vocês não vão passar.',
    foraDoTema: 'Hm? Falava dos que deram errado. Voltem ao assunto.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é o Hashutu, um dos três escolhidos, de mãos de tentáculo.', fala: 'Hashutu. Eu não tenho olhos, e vejo mais que vocês.' },
      { id: 'refeitorio', assunto: 'anima', fato: 'Os três tubos que pingam icor roxo no refeitório soltam um cérebro humanoide fresco por hora, cada um. Ele come um com as mãos.', fala: 'Os tubos soltam um cérebro fresco por hora. Eu como com as mãos. Sirvam-se.' },
      { id: 'fracassos', assunto: 'ritual', fato: 'Ele remói os que deram errado: gente que o ritual não aproveitou. Acha que o grupo será mais um.', fala: 'Os que deram errado eram muitos. Vocês serão mais um.' },
      { id: 'obelisco', assunto: 'obelisco', fato: 'Se for alertado pela Chishinix, ele sobe para junto do obelisco, no alto da ilha. Lá luta até a morte, ligado a ele pela vida.', requer: apertado('hashutu'), fala: 'Quando a Chishinix avisa, eu subo ao obelisco. Lá a gente luta até acabar.' },
    ],
  },

  nagas: {
    nome: 'as nagas do Charco',
    quem: 'Valsyx e Charnyz, duas nagas espirituais do pântano da ilha do Charco da Dúvida: serpentes enormes de cabeça quase humana, espertas, que atraem viajantes pela astúcia. A Valsyx compõe charadas, e a Charnyz ama ilusões realistas. Uma corre ajudar a outra, e renascem depois de mortas.',
    voz: 'Mansas, sedutoras e irônicas. "Odeio violência", diz uma, sorrindo. Falam em enigmas, e quase nunca respondem direto. Sempre propõem um jogo.',
    naoSei: 'Hm, não sei. Mas posso inventar um jogo sobre isso.',
    naoConta: 'A resposta é o prêmio. Ganhem o jogo.',
    foraDoTema: 'Que descuido. Falem do jogo, da charada ou do pântano.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'São a Valsyx e a Charnyz, nagas espirituais que vivem no pântano do Charco da Dúvida.', fala: 'Valsyx, e minha irmã de jogo, a Charnyz. Moramos aqui.' },
      { id: 'jogo', assunto: 'nagas', fato: 'A Valsyx propõe uma charada sem resposta, e a Charnyz propõe um jogo de cobrinhas ilusórias. Ambos servem de aviso: quando o visitante pede para repetir, a naga grita mais alto, e a outra vem.', fala: 'Uma charada? Prefiro que repitam. Mais alto, para quem escuta lá longe.' },
      { id: 'renascem', assunto: 'nagas', fato: 'Elas renascem depois de mortas: voltam depois de um descanso longo do grupo no Vazio.', fala: 'Nós voltamos. Sempre. É a vantagem de ser naga.' },
      { id: 'mezzoloths', assunto: 'mezzoloths', fato: 'Elas repeliram há pouco um ataque de mezzoloths da Nellik, que desobedeceram à chefe e deixaram um morto no Charco.', fala: 'Uns mezzoloths vieram. Repelimos. Deixaram um deles aqui, de lembrança.' },
      { id: 'lodo', assunto: 'ilhas', fato: 'O lodo fora da trilha é terreno difícil para todos, menos para elas.', fala: 'Fiquem na trilha. O lodo é para nós.' },
    ],
  },

  refensCupula: {
    nome: 'os presos da Cúpula (Thawnia, Shansa, Wramble e Unmiel)',
    quem: 'Quatro moradores de Phandalin presos numa plataforma do Vazio Sem Fim: Thawnia Browne, Shansa, o carpinteiro Wramble e Unmiel. Os três fanáticos trouxeram nove da vila. Choram, riem e falam ao mesmo tempo. Não têm armas, e qualquer golpe derruba um deles. Podem esperar na Cúpula se o grupo precisar ir buscar os outros.',
    voz: 'Em coro, interrompendo-se, ora aos prantos, ora rindo de alívio. O Wramble é o que conta com precisão, e fala como carpinteiro, medindo cada coisa.',
    naoSei: 'Não sabemos. Ficamos presos, não vimos mais nada.',
    naoConta: 'Não agora. Não aguentamos mais lembrar.',
    foraDoTema: 'Desculpe, não entendemos. Só queremos voltar para casa.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'São Thawnia Browne, Shansa, o carpinteiro Wramble e Unmiel, de Phandalin.', fala: 'Thawnia. Shansa. Wramble, carpinteiro. E Unmiel. Somos de Phandalin.' },
      { id: 'nove', assunto: 'refens', fato: 'Eram nove de Phandalin. Os três devoradores trouxeram os nove, e havia mais, que ficaram pelo caminho. Depois de dias de testes, levaram os outros cinco.', fala: 'Eram nove de nós. Havia mais, que ficaram pelo caminho. Depois de dias de testes, levaram os outros cinco.' },
      { id: 'estatua', assunto: 'ilhas', fato: 'Os outros cinco foram levados voando para uma ilha com uma estátua enorme caída. Eles viram aquilo daqui, de longe.', fala: 'Voaram com eles para uma ilha com uma estátua enorme caída. A gente viu daqui.' },
      { id: 'fragmentos', assunto: 'fragmentos', fato: 'Os fanáticos carregavam pedaços de pedra escura. O Wramble, o carpinteiro, contou. Eram pelo menos quatro.', fala: 'Eles carregavam pedaços de pedra escura. Eu contei. Foram mais de três, eu garanto.' },
      { id: 'espera', assunto: 'vazio', fato: 'Pedem que o grupo busque os outros. Podem esperar na Cúpula, se for preciso. Ninguém quer ficar sozinho no Vazio, mas ninguém diz isso em voz alta.', fala: 'Busquem os outros. Podemos esperar aqui. Ninguém quer ficar sozinho, mas esperamos.' },
      { id: 'voltar', assunto: 'gwyn', fato: 'Eles querem voltar para casa e não sabem como está Phandalin. Se forem levados pelo grupo, vão pela Poça e pelo labirinto até o portal.', fala: 'Como está a vila? Eu nem sei. Só quero voltar.' },
    ],
  },

  refensEstatua: {
    nome: 'os presos da Estátua (Hovnar, Menvin, Nalpina e Mildra)',
    quem: 'Quatro presos dentro da base de uma estátua de devorador de mentes caída no Vazio: os irmãos Tartesh, escrivães, Hovnar (que ainda fala e tenta animar os outros) e Menvin (quase catatônico de desespero), a inventora anã Nalpina Goldstone e a fazendeira orc Mildra Merkel. De dias sem comer, magros e assustados.',
    voz: 'Vozes fracas, lentas, que se animam aos poucos. O Hovnar tenta soar animado, a Nalpina fala com precisão de inventora, a Mildra pouco e firme, o Menvin quase nada.',
    naoSei: 'Isso eu não ouvi. Estava trancado.',
    naoConta: 'Agora não. Tire-nos daqui primeiro.',
    foraDoTema: 'Desculpem, não entendemos. Só queremos sair.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'São Hovnar e Menvin Tartesh, escrivães, a inventora anã Nalpina Goldstone e a fazendeira orc Mildra Merkel.', fala: 'Hovnar Tartesh, escrivão, e meu irmão Menvin. A Nalpina, inventora. A Mildra, fazendeira.' },
      { id: 'cerebros', assunto: 'ritual', fato: 'Os fanáticos querem os cérebros deles para fazer um cérebro ancião novo, quando o ritual acabar. O ritual é numa ilha que eles chamam Ânima de Ilvaash.', fala: 'Eles querem os nossos cérebros, para fazer um cérebro novo, quando o ritual acabar. O ritual é numa ilha que eles chamam Ânima de Ilvaash.' },
      { id: 'lingua', assunto: 'lingua', fato: 'Eles abriram a boca da estátua com uma língua de metal, trancaram os presos, fecharam e quebraram a língua. A Nalpina entende um pouco da fala deles e ouviu que a língua foi escondida na nuvem venenosa.', fala: 'Abriram a boca da estátua com uma língua de metal, nos trancaram e quebraram a língua. Falaram em esconder a língua na nuvem venenosa.' },
      { id: 'nalpina', assunto: 'devoradores', fato: 'A Nalpina entende um pouco da fala dos devoradores de mentes.', fala: 'Eu entendo um pouco da fala deles. Mas só um pouco.' },
      { id: 'anima', assunto: 'anima', fato: 'A Ânima de Ilvaash é a ilha onde o ritual acontece. Eles não sabem onde fica, só o nome.', fala: 'A Ânima de Ilvaash. Só o nome. Onde fica, eu não sei.' },
      { id: 'espera', assunto: 'vazio', fato: 'Se o grupo os soltar, podem esperar na ilha ou acompanhar o grupo. O Menvin quase nem fala; a Mildra se recusa a ficar para trás.', requer: (e) => e.o8?.vazio?.refens?.estatua === 'soltos', fala: 'Obrigado por nos soltar. Podemos esperar aqui, ou ir com vocês. Menvin não vai aguentar sozinho.' },
    ],
  },
};

// --------------------------------------------------------------- onde estão ----
/**
 * Onde cada NPC aparece no código e o que ele é na cena. `tipo`: 'combatente' (existe no tabuleiro, com `defId` e `name`) ou
 * 'texto' (só aparece em texto de painel ou em objeto interagível). `abrir`: onde a conversa livre se encaixa.
 */
export const ONDE_ESTA_CADA_UM = {
  oshundo: { tipo: 'combatente', defId: 'oshundo', name: null, onde: 'src/game/illithinoch.js:64 (ELENCO, sala X7); `arvoreOshundo` :401; `dialogoDe` :686; painel de chegada :279', abrir: 'dialogoDe (npc === elenco.oshundo && side === neutro)' },
  devoradoresDaEntrada: { tipo: 'combatente', defId: 'devoradorDeMentes', name: 'Shalghast e Ulthundul', onde: 'src/game/illithinoch.js:58-59 (ELENCO, X2); painel e Enganação CD 16 :224-250', abrir: 'sem conversa hoje (só o painel de Enganação do X2)' },
  duoro: { tipo: 'combatente', defId: 'zeloteAberrante', name: 'Duoro Engletor (Larnon Veddin = fanaticoDoCulto)', onde: 'src/game/illithinoch.js:67-68 (ELENCO, X11); painel :292-309, Enganação CD 12', abrir: 'depois de `duoroEnganado` (:304) ou conversa nova em X11' },
  ahooshathan: { tipo: 'combatente', defId: 'devoradorDeMentes', name: 'Ahooshathan', onde: 'src/game/illithinoch.js:65 (ELENCO, X10); rendição :384; `arvoreAhooshathan` :436; `dialogoDe` :686', abrir: 'dialogoDe (npc === elenco.ahooshathan && npc.rendido)' },
  presosDoTunel: { tipo: 'combatente', defId: 'plebeu', name: 'Oskar Ninebough, Cathlette Camber, Aida Camber (preso1..3, `preso: true`)', onde: 'src/game/tunel-cap7.js:129-135 (criar, J4); `arvorePresos` :436; `dialogoDe` :585', abrir: 'dialogoDe (npc?.preso)' },
  behir: { tipo: 'combatente', defId: 'behir', name: null, onde: 'src/game/tunel-cap7.js:138 (criar, tunelBehir); painel e pacto :328-340', abrir: 'sem `dialogoDe`: o painel de J6 (só se fala dracônico)' },
  thorgran: { tipo: 'combatente', defId: 'capaNegraMutante', name: null, onde: 'src/game/tunel-cap7.js:146 (criar J10, `mutante`); falas :165-180 (`testeNoInicio`); diário :551; escrita na parede :511', abrir: 'sem conversa (a fala sai por `e.say("fala")` do inimigo); a ficha serve ao Lembrar sobre o diário' },
  naruv: { tipo: 'combatente', defId: 'grell', name: 'Naruv', onde: 'src/game/fendas.js:98 (criar, F3); painel :218-221', abrir: 'sem conversa hoje (painel de chegada)' },
  bashudu: { tipo: 'texto', defId: null, name: null, onde: 'src/game/fendas.js:313 (objeto interativo `P.bashudu`, F4); texto :422-430', abrir: 'objeto "Virar o nothic do tanque do meio"; a ficha serve a pergunta dentro do painel' },
  chalaag: { tipo: 'combatente', defId: 'slaadCinzento', name: 'Chalaag', onde: 'src/game/fendas.js:104 (criar, S3); glifos :222-240; painel :246-248', abrir: 'sem conversa hoje (painel de chegada em S3)' },
  golcuus: { tipo: 'combatente', defId: 'ocular', name: 'Golcuus', onde: 'src/game/fendas.js:106 (criar, L7); painel :254; ocular :449', abrir: 'sem conversa (luta até a morte); só tem sentido com devorador no grupo' },
  varakkta: { tipo: 'combatente', defId: 'varakkta', name: null, onde: 'src/game/labirinto-salgado.js:77 (ELENCO, B7; Kianka :78 e Vazzi :79 = guerreiroGithyanki); `githyanki()` :517; `contarGithyanki` :545', abrir: 'depois de `githyankiEmPaz` (:540, espada devolvida ou Persuasão CD 15)' },
  shalfi: { tipo: 'combatente', defId: 'zeloteAberrante', name: 'Shalfi Lewin (Jitterjaws = fusaoDeCarne :81)', onde: 'src/game/labirinto-salgado.js:80 (ELENCO, B9); `arvoreShalfi` :732; `dialogoDe` :1126', abrir: 'dialogoDe (npc === elenco.shalfi && side === neutro)' },
  jomlus: { tipo: 'combatente', defId: 'spectator', name: 'Jomlus', onde: 'src/game/labirinto-salgado.js:82 (ELENCO, B10); `arvoreJomlus` :761; `dialogoDe` :1127', abrir: 'dialogoDe (npc === elenco.jomlus && side === neutro)' },
  flumphs: { tipo: 'combatente', defId: 'flumph', name: 'Sábio Borblish (+ "Flumph N")', onde: 'src/game/labirinto-salgado.js:1092 (`flumphs(c)`, objeto de B11 em :987; texto :1096); recrutados viram combatentes `invocado` em :216-222', abrir: 'objeto "Falar com os flumphs" (:987)' },
  mublinesh: { tipo: 'combatente', defId: 'observador', name: 'Mublinesh', onde: 'src/game/labirinto-salgado.js:85 (ELENCO, B14); painel :425-428; B15 :429-435; fecha portas :352-362', abrir: 'sem `dialogoDe` hoje (painel com "Às armas!"); neutro enquanto o grupo anda com devorador' },
  lowarnizel: { tipo: 'combatente', defId: 'lowarnizel', name: null, onde: 'src/game/labirinto-salgado.js:1183 (covil, `elenco.lowarnizel`, neutro); `arvore` :1280; `dialogoDe` :1368', abrir: 'dialogoDe (npc === elenco.lowarnizel && side === neutro)' },
  gossa: { tipo: 'combatente', defId: 'mago', name: 'Gossa', onde: 'src/game/labirinto-salgado.js:1184 (covil, `elenco.gossa`, neutra); aliada em :451', abrir: 'sem `dialogoDe` hoje: acrescentar `npc === elenco.gossa` ao do covil (:1368)' },
  ashripask: { tipo: 'combatente', defId: 'arcanaloth', name: 'Ashripask', onde: 'src/game/labirinto-salgado.js:88 (ELENCO, B21); `arvoreAshripask` :795; `dialogoDe` :1128', abrir: 'dialogoDe (npc === elenco.ashripask && side === neutro)' },
  zelotes: { tipo: 'combatente', defId: 'zeloteTentaculado', name: 'Nouashu e Groushim', onde: 'src/game/labirinto-salgado.js:86-87 (ELENCO, B18); painel :440-443', abrir: 'sem conversa hoje (painel de chegada com "Às armas!")' },
  nellik: { tipo: 'combatente', defId: 'nellik', name: 'Nellik (Frevvik = mezzoloth :205)', onde: 'src/game/vazio.js:204 (por, ilha campo); `conversaDaNellik` :1102; opção "Falar com a Nellik" :973; painel :489', abrir: 'opção "Falar com a Nellik" (vazio.js:972-973)' },
  chishinix: { tipo: 'combatente', defId: 'devoradorClarividente', name: 'Chishinix (cabeça = cabecaDaChishinix :217)', onde: 'src/game/vazio.js:214 (por, A1/A4); `conversaDaChishinix` :614-654; recuo :671', abrir: 'conversaDaChishinix (A1, com 4 ou 5 pedaços)' },
  hashutu: { tipo: 'combatente', defId: 'devoradorClarividente', name: 'Hashutu', onde: 'src/game/vazio.js:220 (por, A2/A4); painel :591-595', abrir: 'sem conversa hoje (painel de A2 com "Às armas!")' },
  nagas: { tipo: 'combatente', defId: 'nagaEspiritual', name: 'Valsyx e Charnyz', onde: 'src/game/vazio.js:197 (por, ilha charco); `ardilDasNagas` :704; acionadas em :460-461', abrir: 'ardilDasNagas (painel: Ouvir a charada / Atacar / Ir embora)' },
  refensCupula: { tipo: 'combatente', defId: 'plebeu', name: 'Thawnia Browne, Shansa, Wramble, Unmiel (refem1..4, `colado`)', onde: 'src/game/vazio.js:185,189 (por); `contaramNaCupula` :1050-1061; src/game/refens-obelisco.js:17', abrir: 'contaramNaCupula (fala coletiva); `levarOuDeixar` :1029' },
  refensEstatua: { tipo: 'combatente', defId: 'plebeu', name: 'Hovnar Tartesh, Menvin Tartesh, Nalpina Goldstone, Mildra Merkel', onde: 'src/game/vazio.js:186; `contaramNaEstatua` :1063-1072; src/game/refens-obelisco.js:18', abrir: 'contaramNaEstatua (fala coletiva)' },
};
