// Equipamento de aventura, ferramentas, montarias e veículos.
//
// FONTE
// A tabela de equipamento do Livro do Jogador, cuja maior parte está também
// no SRD 5.1 (CC-BY-4.0, ver NOTICE.md). Nome, preço, peso e efeito são
// mecânica — não são texto. As descrições aqui são escritas para este
// projeto, não transcritas: o que a WotC publica é dela, o que está entre
// aspas nesta pasta é nosso.
//
// `fonte: 'srd'` é o que o SRD traz e dá para conferir; `fonte: 'phb'` é o
// que vem só do livro, com a mecânica implementada e a descrição nossa.
//
// NADA DAQUI É LIDO PELO MOTOR DE COMBATE. É catálogo e contabilidade de
// peso. O que tem efeito em jogo vive em `consumiveis` (poção, kit, óleo,
// fogo alquímico, água benta) e é `consumivel.js` quem o executa.
//
// O PREÇO ESTÁ EM PEÇAS DE OURO, sempre — 1 pp = 0,1 po, 1 pc = 0,01 po. Uma
// tabela com três moedas diferentes obriga toda soma a converter antes.

const item = (id, name, custo, peso, desc, extra = {}) => ({
  id, name, tipo: 'utilidade', art: id, pilha: false,
  custo, peso, desc, fonte: 'srd', ...extra,
});
const pilha = (id, name, custo, peso, desc, extra = {}) =>
  item(id, name, custo, peso, desc, { pilha: true, ...extra });

export const GEAR = {
  // ------------------------------------------------ mochila e recipientes ----
  mochila: item('mochila', 'Mochila', 2, 5, 'Trinta libras de espaço, ou um pé cúbico.', { art: 'mochila' }),
  bolsa: item('bolsa', 'Bolsa', 0.5, 1, 'Couro ou pano. Seis libras, ou um quinto de pé cúbico.'),
  saco: item('saco', 'Saco', 0.01, 0.5, 'Trinta libras de espaço e nenhuma organização.'),
  barril: item('barril', 'Barril', 2, 70, 'Quarenta galões de líquido ou quatro pés cúbicos de carga.'),
  cesto: item('cesto', 'Cesto', 0.4, 2, 'Quarenta libras de espaço, aberto em cima.'),
  bau: item('bau', 'Baú', 5, 25, 'Trezentas libras. Pesado vazio, impossível cheio.'),
  jarro: item('jarro', 'Jarro', 0.02, 4, 'Um galão de líquido.'),
  panela: item('panela', 'Panela de ferro', 2, 10, 'Um galão. Também serve de capacete improvisado, mal.'),
  frasco: item('frasco', 'Frasco', 0.02, 1, 'Um quarto de galão. Ou uma caneca, que é o mesmo objeto.'),
  cantil: item('cantil', 'Cantil', 0.2, 5, 'Quatro quartos de água. Cheio pesa cinco libras.'),
  ampola: item('ampola', 'Ampola', 1, 0, 'Quatro onças de líquido. Vidro fino.'),
  garrafaDeVidro: item('garrafaDeVidro', 'Garrafa de vidro', 2, 2, 'Um quarto e meio de líquido.'),
  balde: item('balde', 'Balde', 0.05, 2, 'Meio galão.'),
  estojoDeVirotes: item('estojoDeVirotes', 'Estojo de virotes', 1, 1, 'Vinte virotes de besta.'),
  aljava: item('aljava', 'Aljava', 1, 1, 'Vinte flechas.'),
  estojoDeMapas: item('estojoDeMapas', 'Estojo de mapas', 1, 1, 'Cilindro rígido: cabem dez folhas ou cinco pergaminhos.'),

  // ------------------------------------------------------- luz e fogo ----
  tocha: pilha('tocha', 'Tocha', 0.01, 1, 'Luz plena em 6 m e penumbra em outros 6 m, por uma hora. Como arma improvisada, 1 de fogo.', { art: 'fogo' }),
  vela: pilha('vela', 'Vela', 0.01, 0, 'Luz plena em 1,5 m e penumbra em mais 1,5 m, por uma hora.', { art: 'luz' }),
  lampada: item('lampada', 'Lâmpada', 0.5, 1, 'Luz plena em 4,5 m e penumbra em mais 9 m. Queima meio litro de óleo em 6 horas.', { art: 'luz' }),
  lanterna: item('lanterna', 'Lanterna coberta', 5, 2, 'Luz plena em 9 m e penumbra em mais 9 m. Uma ação para fechar e virar penumbra de 1,5 m.', { art: 'luz' }),
  lanternaFuraco: item('lanternaFuraco', 'Lanterna furta-fogo', 10, 2, 'Cone de luz plena de 18 m e penumbra em mais 18 m.', { art: 'luz' }),
  caixaDeIsca: item('caixaDeIsca', 'Caixa de isca', 0.5, 1, 'Pederneira, aço e estopa. Uma ação para acender tocha ou vela; qualquer outra coisa demora mais.'),

  // ------------------------------------------------------ escalar e abrir ----
  cordaCanhamo: item('cordaCanhamo', 'Corda de cânhamo', 1, 10, 'Quinze metros. Aguenta 1.600 libras. Para arrebentar, CD 17 de Força.', { art: 'corda' }),
  cordaDeSeda: item('cordaDeSeda', 'Corda de seda', 10, 5, 'Quinze metros, metade do peso do cânhamo e a mesma resistência.', { art: 'corda' }),
  ganchoDeEscalada: item('ganchoDeEscalada', 'Gancho de escalada', 2, 4, 'Três pontas de ferro numa argola.'),
  kitDeEscalada: item('kitDeEscalada', 'Kit de escalada', 25, 12, 'Grampos, cunhas, luvas e arreio. Dez minutos para se ancorar e virar impossível de derrubar.'),
  pitao: pilha('pitao', 'Pitão', 0.05, 0.25, 'Cunha de ferro para fincar em fenda.'),
  martelo: item('martelo', 'Martelo', 1, 3, 'Para pitão, prego e tábua.', { art: 'maca' }),
  marreta: item('marreta', 'Marreta', 2, 10, 'Para o que o martelo não resolve.', { art: 'maca' }),
  pedeCabra: item('pedeCabra', 'Pé de cabra', 2, 5, 'Vantagem em testes de Força onde a alavanca ajude.'),
  pa: item('pa', 'Pá', 2, 5, 'Para cova, túnel e tesouro.'),
  picaretaDeMineiro: item('picaretaDeMineiro', 'Picareta de mineiro', 2, 10, 'Para rocha.'),
  escada: item('escada', 'Escada', 0.1, 25, 'Três metros, de madeira.'),
  vara: item('vara', 'Vara de 3 m', 0.05, 7, 'Para cutucar o que não se cutuca com a mão.'),
  correntes: item('correntes', 'Correntes', 5, 10, 'Três metros. CD 20 de Força para arrebentar.'),
  algemas: item('algemas', 'Algemas', 2, 6, 'CD 20 de Força para arrebentar, CD 20 de Destreza com ferramentas para abrir.'),
  cadeado: item('cadeado', 'Cadeado', 10, 1, 'Vem com chave. Sem a chave, CD 15 de Destreza com ferramentas de ladrão.'),
  aries: item('aries', 'Aríete portátil', 4, 35, 'Vantagem para arrombar porta, e mais um aliado soma +2.'),

  // ---------------------------------------------------------- armadilhas ----
  bolasDeRolamento: pilha('bolasDeRolamento', 'Bolas de rolamento', 1, 2, 'Mil numa bolsa. Cobrem um quadrado de 3 m: CD 10 de Destreza ou cai no chão.'),
  estrepes: pilha('estrepes', 'Estrepes', 1, 2, 'Vinte numa bolsa. Cobrem 1,5 m: CD 15 de Destreza ou 1 de perfuração e metade do deslocamento.'),
  armadilhaDeCaca: item('armadilhaDeCaca', 'Armadilha de caça', 5, 25, 'Dente de aço. Quem pisa toma 1d4 de perfuração e fica preso; CD 13 de Força para abrir.'),
  espigoesDeFerro: pilha('espigoesDeFerro', 'Espigões de ferro', 1, 5, 'Dez numa saca. Para travar porta ou prender corda.'),

  // ---------------------------------------------------- escrita e estudo ----
  tinta: item('tinta', 'Tinta', 10, 0, 'Vidro de uma onça. Dá para escrever muito.'),
  pena: item('pena', 'Pena de escrever', 0.02, 0, 'Com a tinta, escreve.'),
  papel: pilha('papel', 'Papel', 0.2, 0, 'Uma folha.'),
  pergaminhoEmBranco: pilha('pergaminhoEmBranco', 'Pergaminho em branco', 0.1, 0, 'Uma folha de couro raspado.'),
  livro: item('livro', 'Livro', 25, 5, 'Páginas escritas sobre um assunto só. Pode dar vantagem em teste de conhecimento.'),
  livroDeMagias: item('livroDeMagias', 'Livro de magias', 50, 3, 'Cem páginas em branco. É onde o mago guarda tudo o que sabe.', { art: 'arcano' }),
  abaco: item('abaco', 'Ábaco', 2, 2, 'Para contar sem errar.'),
  lupa: item('lupa', 'Lupa', 100, 0, 'Vantagem para examinar detalhe miúdo. Também acende fogo ao sol, devagar.'),
  lunetaDeAlcance: item('lunetaDeAlcance', 'Luneta', 1000, 1, 'O que está longe parece o dobro do tamanho.'),
  ampulheta: item('ampulheta', 'Ampulheta', 25, 1, 'Uma hora de areia.'),
  balancaDeMercador: item('balancaDeMercador', 'Balança de mercador', 5, 3, 'Pratos, haste e pesos. Para não ser enganado no peso.'),
  cera: item('cera', 'Cera de lacre', 0.5, 0, 'Para selar carta.'),
  anelDeSinete: item('anelDeSinete', 'Anel de sinete', 5, 0, 'Imprime um brasão na cera.'),
  espelhoDeAco: item('espelhoDeAco', 'Espelho de aço', 5, 0.5, 'Para ver a esquina sem virar a esquina.'),

  // ------------------------------------------------- acampar e sobreviver ----
  sacoDeDormir: item('sacoDeDormir', 'Saco de dormir', 1, 7, 'Para dormir no chão e ainda descansar.'),
  cobertor: item('cobertor', 'Cobertor', 0.5, 3, 'Lã grossa.'),
  barraca: item('barraca', 'Barraca', 2, 20, 'De lona, para duas pessoas.'),
  kitDeRefeicao: item('kitDeRefeicao', 'Kit de refeição', 0.2, 1, 'Caneca, prato, talher e panelinha, tudo encaixado.'),
  racoes: pilha('racoes', 'Rações de viagem', 0.5, 2, 'Um dia de comida seca: carne, fruta, biscoito e nozes.', { art: 'racoes' }),
  equipamentoDePesca: item('equipamentoDePesca', 'Equipamento de pesca', 1, 4, 'Vara, linha, anzóis, boias e isca.'),
  sabao: item('sabao', 'Sabão', 0.02, 0, 'Para tirar o que a aventura deixou.'),
  apito: item('apito', 'Apito de sinalização', 0.05, 0, 'Ouve-se de longe. Inclusive por quem não devia.'),
  pedraDeAmolar: item('pedraDeAmolar', 'Pedra de amolar', 0.01, 1, 'Devolve o fio à lâmina.'),
  talhaEModa: item('talhaEModa', 'Talha e moitão', 2, 5, 'Levanta quatro vezes o peso que você levantaria.'),
  giz: pilha('giz', 'Giz', 0.01, 0, 'Para marcar o caminho de volta.'),
  perfume: item('perfume', 'Perfume', 5, 0, 'Uma ampola. Pode valer mais que uma mentira bem contada.'),
  roupaComum: item('roupaComum', 'Roupa comum', 0.5, 3, 'Não chama atenção, que é o ponto.'),
  roupaDeViagem: item('roupaDeViagem', 'Roupa de viagem', 2, 4, 'Resistente, para estrada e chuva.'),
  roupaFina: item('roupaFina', 'Roupa fina', 15, 6, 'Exigida em certos salões.'),
  roupaDeFantasia: item('roupaDeFantasia', 'Fantasia', 5, 4, 'Para parecer outra pessoa.'),
  vestes: item('vestes', 'Vestes', 1, 4, 'Túnica longa de conjurador.'),

  // ------------------------------------------------- foco e símbolo ----
  focoArcanoCristal: item('focoArcanoCristal', 'Cristal arcano', 10, 1, 'Foco de conjuração: substitui os componentes materiais sem custo.', { art: 'arcano' }),
  focoArcanoOrbe: item('focoArcanoOrbe', 'Orbe arcano', 20, 3, 'Foco de conjuração.', { art: 'arcano' }),
  focoArcanoVarinha: item('focoArcanoVarinha', 'Varinha arcana', 10, 1, 'Foco de conjuração.', { art: 'arcano' }),
  focoArcanoCetro: item('focoArcanoCetro', 'Cetro arcano', 10, 2, 'Foco de conjuração.', { art: 'arcano' }),
  focoArcanoCajado: item('focoArcanoCajado', 'Cajado arcano', 5, 4, 'Foco de conjuração, e um bordão se a conversa virar.', { art: 'cajado' }),
  simboloSagradoAmuleto: item('simboloSagradoAmuleto', 'Amuleto sagrado', 5, 1, 'Símbolo da divindade: foco de conjuração divina. Pode ser preso ao escudo.', { art: 'bencao' }),
  simboloSagradoEmblema: item('simboloSagradoEmblema', 'Emblema sagrado', 5, 0, 'Símbolo da divindade, gravado no escudo ou preso à roupa.', { art: 'bencao' }),
  simboloSagradoRelicario: item('simboloSagradoRelicario', 'Relicário', 5, 2, 'Símbolo da divindade com uma relíquia dentro.', { art: 'bencao' }),
  bolsaDeComponentes: item('bolsaDeComponentes', 'Bolsa de componentes', 25, 2, 'Compartimentos com tudo que uma magia pede, desde que o componente não tenha preço.', { art: 'arcano' }),
  azevinho: item('azevinho', 'Ramo de azevinho', 1, 0, 'Foco druídico.'),
  totem: item('totem', 'Totem', 1, 0, 'Foco druídico.'),
  varinhaDeTeixo: item('varinhaDeTeixo', 'Varinha de teixo', 10, 1, 'Foco druídico.'),

  // ---------------------------------------------------------- consumíveis ----
  // Estes cinco TÊM efeito em jogo: `consumivel.js` os executa.
  pocaoDeCura: pilha('pocaoDeCura', 'Poção de cura', 50, 0.5, 'Uma ação para beber: recupera 2d4+2 pontos de vida.', {
    tipo: 'poção', art: 'cura', consumivel: 'curar', cura: '2d4+2', acao: 'acao',
  }),
  kitDeCura: item('kitDeCura', 'Kit de cura', 5, 3, 'Dez usos. Uma ação para estabilizar quem está morrendo, sem teste de Medicina.', {
    tipo: 'ferramenta', art: 'estabilizar', consumivel: 'estabilizar', usos: 10, acao: 'acao',
  }),
  aguaBenta: pilha('aguaBenta', 'Água benta', 25, 1, 'Arremesso como ampola: 2d6 de radiante em morto-vivo ou corruptor.', {
    tipo: 'poção', art: 'bencao', consumivel: 'arremesso', damage: '2d6', damageType: 'radiante',
    alvoApenas: ['morto-vivo', 'corruptor'], rangeFt: 20, acao: 'acao', fonte: 'srd',
  }),
  fogoAlquimico: pilha('fogoAlquimico', 'Fogo alquímico', 50, 1, 'Arremesso: 1d4 de fogo por turno até alguém gastar uma ação para apagar.', {
    tipo: 'poção', art: 'fogo', consumivel: 'arremesso', damage: '1d4', damageType: 'fogo',
    rangeFt: 20, acao: 'acao', condicao: 'queimando',
  }),
  acido: pilha('acido', 'Ácido', 25, 1, 'Arremesso como ampola: 2d6 de ácido.', {
    tipo: 'poção', art: 'fogo', consumivel: 'arremesso', damage: '2d6', damageType: 'ácido',
    rangeFt: 20, acao: 'acao',
  }),
  antitoxina: pilha('antitoxina', 'Antitoxina', 50, 0, 'Uma ação para beber: vantagem em resistências contra veneno por uma hora.', {
    tipo: 'poção', art: 'cura', consumivel: 'beneficio', acao: 'acao',
  }),
  venenoBasico: pilha('venenoBasico', 'Veneno básico', 100, 0, 'Uma ação para untar uma lâmina. O próximo acerto soma 1d4 de veneno, CD 10 de Constituição para metade.', {
    tipo: 'poção', art: 'fogo', consumivel: 'untar', damage: '1d4', damageType: 'veneno', acao: 'acao',
  }),
  oleo: pilha('oleo', 'Óleo', 0.1, 1, 'Meio litro. Arremesso: 5 de fogo se algo acender depois. Ou seis horas de lâmpada.', {
    tipo: 'poção', art: 'fogo', consumivel: 'arremesso', damage: '5', damageType: 'fogo',
    rangeFt: 20, acao: 'acao',
  }),

  // -------------------------------------------------------------- moeda ----
  moedaDeCobre: pilha('moedaDeCobre', 'Peças de cobre', 0.01, 0.02, 'Cem valem uma de ouro.', { tipo: 'moeda', art: 'moeda' }),
  moedaDePrata: pilha('moedaDePrata', 'Peças de prata', 0.1, 0.02, 'Dez valem uma de ouro.', { tipo: 'moeda', art: 'moeda' }),
  moedaDeOuro: pilha('moedaDeOuro', 'Peças de ouro', 1, 0.02, 'A moeda em que todo preço desta tabela está escrito.', { tipo: 'moeda', art: 'moeda' }),
  // Tesouro de aventura: só vale o que alguém pagar por ele.
  denteDeOuro: pilha('denteDeOuro', 'Dente de ouro', 1, 0.01, 'Um dente de ouro arrancado de alguém. Vale o peso dele: 1 po.', { tipo: 'tesouro' }),
  estatuetaDeSapo: item('estatuetaDeSapo', 'Sapo de jade', 40, 1, 'Estatueta de um sapo em jade, com olhos de ouro. Uns 40 po na mão de quem compra arte.', { tipo: 'tesouro' }),
  moedaDePlatina: pilha('moedaDePlatina', 'Peças de platina', 10, 0.02, 'Dez de ouro cada. Raras fora de cofre.', { tipo: 'moeda', art: 'moeda' }),
};

// ------------------------------------------------------------ ferramentas ----
//
// Ferramenta não é utilidade: ela dá PROFICIÊNCIA, e a ficha mostra isso
// diferente. Por isso `tipo: 'ferramenta'` em todas.

const ferramenta = (id, name, custo, peso, desc, fonte = 'srd') => ({
  id, name, tipo: 'ferramenta', art: id, pilha: false, custo, peso, desc, fonte,
});

export const TOOLS = {
  ferramentasDeLadrao: ferramenta('ferramentasDeLadrao', 'Ferramentas de ladrão', 25, 1, 'Lima, gazuas, espelhinho e tesoura. Para fechadura e armadilha.'),
  kitDeDisfarce: ferramenta('kitDeDisfarce', 'Kit de disfarce', 25, 3, 'Maquiagem, cabelo postiço e adereços para parecer outra pessoa.'),
  kitDeFalsificacao: ferramenta('kitDeFalsificacao', 'Kit de falsificação', 15, 5, 'Papéis, selos, ceras e tintas para fabricar um documento.'),
  kitDeHerbalismo: ferramenta('kitDeHerbalismo', 'Kit de herbalismo', 5, 3, 'Saquinhos, pilão e frascos. Para identificar planta e preparar remédio.'),
  kitDeVenenos: ferramenta('kitDeVenenos', 'Kit de venenos', 50, 2, 'Frascos, produtos e luvas. Para fabricar e aplicar veneno.'),
  ferramentasDeNavegacao: ferramenta('ferramentasDeNavegacao', 'Ferramentas de navegação', 25, 2, 'Sextante, bússola, compasso e cartas. Para não se perder.'),
  ferramentasDeCartografo: ferramenta('ferramentasDeCartografo', 'Ferramentas de cartógrafo', 15, 6, 'Compasso, réguas, canetas e tinta. Para desenhar o mapa que falta.'),
  ferramentasDeFerreiro: ferramenta('ferramentasDeFerreiro', 'Ferramentas de ferreiro', 20, 8, 'Martelos, tenazes, carvão e bigorna portátil.'),
  ferramentasDeCarpinteiro: ferramenta('ferramentasDeCarpinteiro', 'Ferramentas de carpinteiro', 8, 6, 'Serra, martelo, esquadro, plaina e pregos.'),
  ferramentasDePedreiro: ferramenta('ferramentasDePedreiro', 'Ferramentas de pedreiro', 10, 8, 'Talhadeira, martelo, colher e esquadro.'),
  ferramentasDeJoalheiro: ferramenta('ferramentasDeJoalheiro', 'Ferramentas de joalheiro', 25, 2, 'Lupa, limas, pinças e torno pequeno. Avalia pedra e engaste.'),
  ferramentasDeFuntileiro: ferramenta('ferramentasDeFuntileiro', 'Ferramentas de funileiro', 50, 10, 'Para consertar o que tem peça dentro.'),
  ferramentasDeCouro: ferramenta('ferramentasDeCouro', 'Ferramentas de coureiro', 5, 5, 'Facas, agulhas grossas, cera e linha.'),
  ferramentasDeSapateiro: ferramenta('ferramentasDeSapateiro', 'Ferramentas de sapateiro', 5, 5, 'Forma, martelo, linha e pregos pequenos.'),
  ferramentasDeOleiro: ferramenta('ferramentasDeOleiro', 'Ferramentas de oleiro', 10, 3, 'Torno de mão, raspadeiras e espátulas.'),
  ferramentasDeVidreiro: ferramenta('ferramentasDeVidreiro', 'Ferramentas de vidreiro', 30, 5, 'Cano de sopro, pinças e moldes.'),
  ferramentasDeTecelao: ferramenta('ferramentasDeTecelao', 'Ferramentas de tecelão', 1, 5, 'Tear de mão, fusos, agulhas e linha.'),
  ferramentasDeEntalhador: ferramenta('ferramentasDeEntalhador', 'Ferramentas de entalhador', 1, 5, 'Formões, goivas e facas de madeira.'),
  suprimentosDeAlquimista: ferramenta('suprimentosDeAlquimista', 'Suprimentos de alquimista', 50, 8, 'Alambique, retortas, misturas e frascos.'),
  suprimentosDeCervejeiro: ferramenta('suprimentosDeCervejeiro', 'Suprimentos de cervejeiro', 20, 9, 'Barril pequeno, tubos, lúpulo e fermento.'),
  suprimentosDeCaligrafo: ferramenta('suprimentosDeCaligrafo', 'Suprimentos de calígrafo', 10, 5, 'Penas, tintas e pergaminho fino.'),
  suprimentosDePintor: ferramenta('suprimentosDePintor', 'Suprimentos de pintor', 10, 5, 'Cavalete, telas, pigmentos e pincéis.'),
  utensiliosDeCozinheiro: ferramenta('utensiliosDeCozinheiro', 'Utensílios de cozinheiro', 1, 8, 'Panelas, facas e temperos. Melhora o descanso de quem come.'),
  jogoDeDados: ferramenta('jogoDeDados', 'Jogo de dados', 0.1, 0, 'Para passar a noite e perder dinheiro.'),
  baralho: ferramenta('baralho', 'Baralho', 0.5, 0, 'Para o mesmo fim, com mais blefe.'),
  alaude: ferramenta('alaude', 'Alaúde', 35, 2, 'Instrumento musical.'),
  lira: ferramenta('lira', 'Lira', 30, 2, 'Instrumento musical.'),
  flauta: ferramenta('flauta', 'Flauta', 2, 1, 'Instrumento musical.'),
  tambor: ferramenta('tambor', 'Tambor', 6, 3, 'Instrumento musical.'),
  gaitaDeFoles: ferramenta('gaitaDeFoles', 'Gaita de foles', 30, 6, 'Instrumento musical. Ouve-se de muito longe.'),
  trompa: ferramenta('trompa', 'Trompa', 3, 2, 'Instrumento musical, e sinal de alarme.'),
  flautaDePa: ferramenta('flautaDePa', 'Flauta de pã', 12, 2, 'Instrumento musical.'),
  viola: ferramenta('viola', 'Viola', 30, 1, 'Instrumento musical.'),
  dulcimer: ferramenta('dulcimer', 'Dulcimer', 25, 10, 'Instrumento musical.'),
  charamela: ferramenta('charamela', 'Charamela', 2, 1, 'Instrumento musical.'),
};

// --------------------------------------------------- montarias e veículos ----
//
// Entram no catálogo porque estão na tabela do livro, mas NÃO entram na
// mochila: `mochilavel: false` tira cada um da grade de inventário. Um navio
// numa célula de 72 px seria piada, e o peso deles arruinaria a carga.

const montaria = (id, name, custo, desc, extra = {}) => ({
  id, name, tipo: 'montaria', art: id, pilha: false,
  custo, peso: 0, desc, mochilavel: false, fonte: 'srd', ...extra,
});

export const MOUNTS = {
  cavaloDeMontaria: montaria('cavaloDeMontaria', 'Cavalo de montaria', 75, 'Deslocamento 18 m, capacidade 480 libras.'),
  cavaloDeGuerra: montaria('cavaloDeGuerra', 'Cavalo de guerra', 400, 'Deslocamento 18 m, capacidade 540 libras. Treinado para não fugir do barulho.'),
  cavaloDeTracao: montaria('cavaloDeTracao', 'Cavalo de tração', 50, 'Deslocamento 12 m, capacidade 540 libras.'),
  pônei: montaria('pônei', 'Pônei', 30, 'Deslocamento 12 m, capacidade 225 libras.'),
  mula: montaria('mula', 'Mula', 8, 'Deslocamento 12 m, capacidade 420 libras. Sobe onde cavalo não sobe.'),
  camelo: montaria('camelo', 'Camelo', 50, 'Deslocamento 15 m, capacidade 480 libras.'),
  mastim: montaria('mastim', 'Mastim', 25, 'Deslocamento 12 m, capacidade 195 libras.'),
  elefante: montaria('elefante', 'Elefante', 200, 'Deslocamento 12 m, capacidade 1.320 libras.'),
  selaDeMontaria: montaria('selaDeMontaria', 'Sela de montaria', 10, 'Vantagem para não cair da montaria.', { peso: 25 }),
  selaDeGuerra: montaria('selaDeGuerra', 'Sela de guerra', 20, 'Vantagem para não ser derrubado dela.', { peso: 30 }),
  selaExotica: montaria('selaExotica', 'Sela exótica', 60, 'Para montaria aquática ou voadora.', { peso: 40 }),
  freioERedea: montaria('freioERedea', 'Freio e rédea', 2, 'Para guiar a montaria.', { peso: 1 }),
  alforjes: montaria('alforjes', 'Alforjes', 4, 'Trinta libras de carga, presos à sela.', { peso: 8 }),
  carroca: montaria('carroca', 'Carroça', 15, 'Puxada por animal. Capacidade 200 libras.'),
  carrocaGrande: montaria('carrocaGrande', 'Carroção', 35, 'Capacidade 1.000 libras.'),
  carruagem: montaria('carruagem', 'Carruagem', 100, 'Fechada, para quem não quer chegar sujo.'),
  carroDeGuerra: montaria('carroDeGuerra', 'Carro de guerra', 250, 'Duas rodas, puxado por dois cavalos.'),
  treno: montaria('treno', 'Trenó', 20, 'Para neve e gelo.'),
  barcoARemo: montaria('barcoARemo', 'Barco a remo', 50, 'Velocidade 2,5 km/h.'),
  barcaca: montaria('barcaca', 'Barcaça', 3000, 'Velocidade 1,5 km/h. Rio e costa.'),
  navioALonga: montaria('navioALonga', 'Nau longa', 10000, 'Velocidade 4,8 km/h. Remos e vela.'),
  navioMercante: montaria('navioMercante', 'Navio mercante', 10000, 'Velocidade 3,2 km/h.'),
  galera: montaria('galera', 'Galera', 30000, 'Velocidade 6,4 km/h.'),
  navioDeGuerra: montaria('navioDeGuerra', 'Navio de guerra', 25000, 'Velocidade 4 km/h, com aríete e balista.'),
};
