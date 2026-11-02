// Livro do Jogador não é SRD: a Maldição de Strahd é conteúdo da Wizards. TEXTO nosso, fatos do livro — ver NOTICE.md e STRAHD.md.
//
// A CASA DA MORTE É UMA CASA DE INVESTIGAÇÃO: o jogador anda clicando nas coisas e escolhendo COMO olhar (perícia, magia, talento).
// Cada PONTO abaixo é um objeto ou canto da planta. O botão direito nele oferece:
//   - "Olhar": de graça, o que se vê de relance;
//   - uma opção por PERÍCIA (`verbos`): CD, uma tentativa por herói, e o que se descobre quando passa;
//   - a PASSIVA (`passiva`): quem tem a Percepção ou a Investigação passiva alta o bastante repara sozinho ao entrar na sala;
//   - a AURA (`aura`): o Detectar Magia ativo mostra a escola da magia que há ali.
// Cada descoberta vai para o diário do grupo ("Rever as pistas"). Alguns verbos MARCAM uma pista (`marca`) que a cena usa: avisar do
// grick, desmascarar o mímico, dizer onde o fosso está...
//
// Formato: { id, x, y, r (raio de clique, em casas; padrão 1), nome, olhar, aura?, passiva?, verbos: [{ p, cd, ok, falha?, marca? }] }

import { casa } from './casadamorte-plantas.js';

export const PISTAS = {
  // ===================================================================================================== 1º ANDAR ===
  casaDaMorte1: [
    {
      id: 'brasao', ...casa(1, 8), r: 2, nome: 'O escudo com brasão',
      olhar: 'Na parede da sala de espera, um escudo de armas: um moinho de vento dourado, estilizado, num campo vermelho.',
      verbos: [
        { p: 'historia', cd: 10, ok: 'O moinho é o emblema da família Durst, de Baróvia. Os Durst tinham um moinho nas montanhas, a leste de Vallaki: é o "Velho Moedor de Ossos".' },
        { p: 'investigacao', cd: 13, ok: 'O escudo está pregado com pregos novos, de cabeça brilhante, em madeira nova. Nada aqui tem idade, e é a casa que parece mais velha do que o resto.' },
      ],
    },
    {
      id: 'retratos', ...casa(0, 8), r: 2, nome: 'Os retratos dos aristocratas',
      olhar: 'Retratos de aristocratas de rostos impassíveis, em molduras douradas. Dizem-se mortos da família Durst.',
      verbos: [
        { p: 'historia', cd: 12, ok: 'As roupas são de séculos diferentes. Não são todos Durst: a família era de moleiros, e retrato nenhum aqui parece de moleiro.' },
        { p: 'intuicao', cd: 13, ok: 'Nenhum dos rostos olha para nada. Quem os pintou não quis que olhassem para vocês: quis que lembrassem de uma família que não existe mais.' },
      ],
    },
    {
      id: 'lareiraSalao', ...casa(0, 5), r: 1, nome: 'A lareira e a espada do salão',
      olhar: 'Uma lareira de mármore negro, o fogo apagado. Sobre ela, presa à parede, uma espada longa com um camafeu de moinho no punho.',
      aura: { escola: 'abjuração', texto: 'Uma aura fraca e velha de abjuração cobre a casa inteira, não só a lareira. Quem a fez queria que quem entrasse não saísse.' },
      verbos: [
        { p: 'arcanismo', cd: 12, ok: 'A espada não é mágica, mas o salão inteiro tem um cheiro de magia antiga, de abjuração: a casa guarda o que entra.' },
        { p: 'investigacao', cd: 11, ok: 'A espada está soldada à parede. O camafeu do punho é de moinho e de nada mais: um enfeite de uma espada que nunca foi sacada.' },
      ],
    },
    {
      id: 'vestiario', ...casa(2, 3), r: 1, nome: 'O vestiário',
      olhar: 'Mantos pretos de capuz, pendurados em ganchos. Um chapéu alto numa prateleira.',
      verbos: [
        { p: 'religiao', cd: 12, ok: 'Mantos de culto: gente que se vestia de preto para cantar de noite. Os Sacerdotes de Osybus faziam assim, e o culto da casa era deles.' },
        { p: 'percepcao', cd: 12, ok: 'Os mantos são limpos demais. Nenhum tem o cheiro de quem os vestiu: a casa os lavou de lembranças.' },
      ],
    },
    {
      id: 'aparador', ...casa(5, 3), r: 1, nome: 'O aparador (monta-cargas)',
      olhar: 'Atrás de uma portinha, no canto da cozinha, um eixo de pedra de setenta centímetros com uma caixa de madeira pendurada em corda e polia.',
      verbos: [
        { p: 'investigacao', cd: 10, ok: 'O monta-cargas liga a cozinha ao quarto dos empregados e à suíte principal. Dá para subir nele, mas o cabo só aguenta setenta quilos: não é para gente.' },
        { p: 'acrobacia', cd: 10, ok: 'Alguém Pequeno e ágil pode se espremer na caixa. Seria preciso um bem magro: a caixa é estreita.' },
      ],
    },
    {
      id: 'despensa', ...casa(5, 0), r: 2, nome: 'A despensa',
      olhar: 'Prateleiras cheias de comida: queijos, linguiças, potes, frutas.',
      verbos: [
        { p: 'natureza', cd: 10, ok: 'Tudo parece fresco e cheira bem. Tudo, também, tem o mesmo aroma: nenhum cheiro particular. É comida de enfeite, que a casa faz.' },
        { p: 'medicina', cd: 12, ok: 'Não há mofo, não há mosca, não há nada de vivo na comida. Quem a comesse não passaria mal, nem ficaria saciado.' },
      ],
    },
    {
      id: 'lobos', ...casa(4, 9), r: 2, nome: 'Os lobos empalhados e a cabeça de veado',
      olhar: 'Uma sala de caçador, de painéis de carvalho: a cabeça de um veado sobre a lareira e três lobos empalhados nos cantos.',
      verbos: [
        { p: 'natureza', cd: 11, ok: 'Os lobos são lobos atrozes pequenos, de olhos de vidro perfeitos, sem uma lasca. Empalhadores não fazem tão bem: a casa os fez.' },
        { p: 'intuicao', cd: 13, ok: 'A sala parece observá-los de volta. Os lobos de vidro seguem um passo, devagar, como num truque: nada acontece.' },
      ],
    },
    {
      id: 'cantoCanil', ...casa(2, 10), r: 1, nome: 'O canto sudoeste do canil',
      olhar: 'O assoalho de madeira, bem lustrado, até o canto.',
      aura: { escola: 'ilusão', texto: 'Uma aura de ilusão forte, concentrada no chão do canto sudoeste. Algo foi escondido aqui por magia.' },
      verbos: [
        { p: 'percepcao', cd: 16, ok: 'Uma tábua que não geme como as outras, e uma emenda mais fina do que o resto. A casa está escondendo alguma coisa aqui, e não quer mostrar.' },
        { p: 'investigacao', cd: 17, ok: 'O assoalho tem uma moldura quadrada de poucos milímetros, que a vista não pega. Um alçapão, sem trinco deste lado: só se abre por baixo.', marca: 'alcapaoSuspeito' },
      ],
    },
    {
      id: 'armarioNorte', ...casa(3, 7), r: 1, nome: 'O armário do norte',
      olhar: 'Um armário de portas lisas, destrancado.',
      verbos: [
        { p: 'investigacao', cd: 10, ok: 'Dentro, uma caixa com um baralho de cartas e taças de vinho de madeira. O baralho tem o rei, a rainha e o cavaleiro dos Durst: o resto são cartas em branco.' },
      ],
    },
  ],

  // ===================================================================================================== 2º ANDAR ===
  casaDaMorte2: [
    {
      id: 'retratoDosDurst', ...casa(0, 5), r: 2, nome: 'O retrato da família Durst',
      olhar: 'Sobre a lareira do salão superior, um retrato em moldura de madeira: Gustav e Elisabeth Durst, Rose e Thorn sorrindo, e nos braços do pai um bebê embrulhado.',
      verbos: [
        { p: 'intuicao', cd: 12, ok: 'A mãe olha o bebê embrulhado com um toque de desprezo. Os filhos sorriem, mas o sorriso das crianças parece ensaiado. Esta família não era feliz.' },
        { p: 'percepcao', cd: 14, ok: 'O bebê é um pacote: não se vê rosto nenhum, só panos. Walter, nascido morto, foi pintado como se ainda fosse nascer.' },
        { p: 'historia', cd: 12, ok: 'Gustav e Elisabeth Durst, moleiros ricos de Baróvia, com dois filhos: Rosavalda (Rose) e Thornboldt (Thorn), de dez e sete anos. O quadro não mostra o que veio depois.' },
      ],
    },
    {
      id: 'armaduras', ...casa(2, 5), r: 3, nome: 'As armaduras de lança',
      olhar: 'Armaduras de pé flanqueiam as portas do norte e do sul, com lanças e elmos em cabeça de lobo.',
      verbos: [
        { p: 'investigacao', cd: 12, ok: 'Estas armaduras são vazias e mudas: só enfeite. Mas o elmo de lobo é o mesmo da armadura de placas negras que dizem estar lá em cima, na varanda.' },
        { p: 'arcanismo', cd: 14, ok: 'Nenhuma delas tem a aura de animação. A casa as deixou por decoração. A de cima é outra história.' },
      ],
    },
    {
      id: 'empregados', ...casa(4, 2), r: 2, nome: 'O quarto dos empregados',
      olhar: 'Duas camas de colchão de palha, armários de sapatos vazios, uniformes limpos pendurados.',
      verbos: [
        { p: 'investigacao', cd: 10, ok: 'Nenhum uniforme tem um bolso gasto, uma costura puída, uma mancha. Ninguém jamais trabalhou aqui: a casa fingiu uma criadagem.' },
        { p: 'intuicao', cd: 12, ok: 'A cama da direita é feita com mais capricho que a da esquerda: alguém que se esmerou para parecer vivo, mesmo morto.' },
      ],
    },
    {
      id: 'escrivaninha', ...casa(2, 1), r: 1, nome: 'A escrivaninha da biblioteca',
      olhar: 'Mogno requintado, uma cadeira de espaldar alto, tinteiro, pena, lamparina, um barrilete de pólvora e um estojo de cartas com lacre vermelho e o selo do moinho dos Durst.',
      verbos: [
        { p: 'investigacao', cd: 12, ok: 'A gaveta da escrivaninha tem um fundo falso? Não: o que ela tem é uma chave de ferro, grande, deixada sozinha. Alguém quis que a achassem.' },
        { p: 'historia', cd: 13, ok: 'O selo do moinho é igual ao do brasão da entrada. As cartas, em branco, não foram escritas por ninguém: a casa pôs o papel, e o resto ficou para depois.' },
      ],
    },
    {
      id: 'quadroDoMoinho', ...casa(0, 1), r: 1, nome: 'O quadro do moinho sobre a lareira',
      olhar: 'Um moinho de vento empoleirado num penhasco rochoso, pintado sobre a lareira da biblioteca.',
      verbos: [
        { p: 'historia', cd: 14, ok: 'É o Velho Moedor de Ossos, nas montanhas a leste de Vallaki. A escritura que há nesta casa é a dele. Quem a tiver herdará, um dia, o moinho.' },
        { p: 'percepcao', cd: 14, ok: 'No canto do quadro, em tinta mais clara, alguém escreveu e raspou: "Perdoai". Só um traço do P resta.' },
      ],
    },
    {
      id: 'estantes', ...casa(3, 1), r: 2, nome: 'As estantes altas',
      olhar: 'Centenas de volumes: história, guerra, alquimia, e algumas prateleiras de primeiras edições de poesia e de ficção.',
      aura: { escola: 'ilusão', texto: 'Uma aura de ilusão muito pequena, num único volume de capa vermelha e lombada branca: um interruptor disfarçado de livro.' },
      verbos: [
        { p: 'historia', cd: 10, ok: 'Os livros são de verdade, cheios de erros de quem copiou de memória. Não se pode levá-los: apodrecem fora da casa.' },
        { p: 'investigacao', cd: 13, ok: 'Um dos livros, de capa vermelha e lombada branca, é mais leve do que devia: não é livro, é um botão. Algo se move atrás da estante.' },
      ],
    },
    {
      id: 'esqueletoDaCarta', ...casa(5, 0), r: 1, nome: 'O esqueleto de armadura de couro',
      olhar: 'Um esqueleto pende do baú, três dardos cravados no peito, a mão esquerda fechada sobre uma carta lacrada.',
      verbos: [
        { p: 'medicina', cd: 12, ok: 'Morreu quase de imediato: os três dardos pegaram o coração. O veneno já tinha secado. Está aqui há anos, talvez décadas.' },
        { p: 'sobrevivencia', cd: 14, ok: 'A armadura de couro é de caminhante de estrada, de quem viajou de Vallaki a Baróvia a pé. Era um aventureiro, não um cultista: o culto o prendeu, e a casa o guardou.' },
        { p: 'investigacao', cd: 12, ok: 'O mecanismo do baú é um disparador de dardos. Já está descarregado; os dardos caíram no peito do morto. Seguro de abrir.' },
      ],
    },
    {
      id: 'cravo', ...casa(1, 8), r: 2, nome: 'O cravo e a harpa',
      olhar: 'Um cravo no canto noroeste e uma harpa de pé perto da lareira.',
      verbos: [
        { p: 'atuacao', cd: 12, ok: 'O cravo está afinado, e a harpa também: as cordas respondem sem ninguém ter mexido nelas. Uma melodia vem, doce, que nenhum dos dois toca, e depois silêncio.' },
        { p: 'intuicao', cd: 12, ok: 'As tapeçarias de vitral mostram gente elegante cantando: o mesmo canto que se ouve embaixo, mas bonito. É o outro lado do culto.' },
      ],
    },
    {
      id: 'estatuetas', ...casa(5, 9), r: 1, nome: 'As estatuetas de alabastro',
      olhar: 'Dançarinos bem vestidos, em alabastro, sobre a lareira.',
      verbos: [
        { p: 'investigacao', cd: 10, ok: 'De perto, vários dançarinos são esqueletos de casaca e vestido de baile, dançando com a mesma elegância dos outros.' },
        { p: 'religiao', cd: 13, ok: 'A dança dos esqueletos é a dança dos mortos, uma imagem velha. O escultor sabia o que o culto fazia lá embaixo.' },
      ],
    },
  ],

  // ===================================================================================================== 3º ANDAR ===
  casaDaMorte3: [
    {
      id: 'tapeteDeTigre', ...casa(1, 1), r: 1, nome: 'O tapete de pele de tigre',
      olhar: 'Uma pele de tigre, apodrecendo, diante da lareira da suíte principal.',
      verbos: [
        { p: 'natureza', cd: 12, ok: 'Tigres não existem em Baróvia: a pele veio de muito longe, trazida por quem tinha dinheiro e gosto de caça. Os Durst não eram só moleiros.' },
        { p: 'investigacao', cd: 11, ok: 'Debaixo do tapete, o assoalho tem uma mancha escura, antiga, que ninguém limpou. Não é sangue de tigre.' },
      ],
    },
    {
      id: 'retratoDoCasal', ...casa(0, 1), r: 1, nome: 'O retrato sobre a lareira',
      olhar: 'Um retrato empoeirado de Gustav e Elisabeth Durst, pendurado acima da lareira.',
      verbos: [
        { p: 'intuicao', cd: 12, ok: 'No retrato do casal, marido e mulher posam sem se tocar. Em todos os quartos da casa há duas camas, ou um quarto para cada um.' },
        { p: 'historia', cd: 13, ok: 'Gustav Durst: moleiro enriquecido. Elisabeth Durst: filha de gente da aldeia. Vieram a Baróvia com dinheiro e a casa, e a perderam como se perdem as coisas aqui.' },
      ],
    },
    {
      id: 'camaDosel', ...casa(3, 1), r: 2, nome: 'A cama de dossel',
      olhar: 'Uma cama grande de dossel, de cortinas bordadas e véus esfarrapados.',
      verbos: [
        { p: 'investigacao', cd: 12, ok: 'Um dos dois travesseiros está intacto; o outro, afundado. O dono da casa dormia sozinho, e há muito tempo.' },
        { p: 'percepcao', cd: 13, ok: 'Sob a cama, uma tábua frouxa: dentro, uma fita de cabelo de mulher, amarrada a uma mecha escura. Não é de Elisabeth.' },
      ],
    },
    {
      id: 'mesaDoCanto', ...casa(5, 3), r: 1, nome: 'A mesa e as duas cadeiras',
      olhar: 'No canto sudoeste, uma mesa, duas cadeiras e, sobre a toalha empoeirada, uma tigela de porcelana vazia e um jarro de par.',
      verbos: [
        { p: 'investigacao', cd: 11, ok: 'A toalha tem duas marcas de xícara, de mãos diferentes. Duas pessoas tomavam chá aqui: o dono e, adivinhe, a babá.' },
      ],
    },
    {
      id: 'banheira', ...casa(1, 5), r: 2, nome: 'A banheira de pés de garra',
      olhar: 'Uma banheira de madeira, um fogãozinho de ferro com uma chaleira e um barril sob uma torneira na parede leste.',
      verbos: [
        { p: 'investigacao', cd: 10, ok: 'O encanamento vem da cisterna do telhado e está seco desde sempre. Dentro da banheira, uma única unha de criança, presa no fundo.' },
        { p: 'medicina', cd: 13, ok: 'A unha tem a ponta quebrada: arranhou a madeira da banheira com força. Alguém foi segurado aqui. Não por muito tempo.' },
      ],
    },
    {
      id: 'lencois', ...casa(0, 6), r: 1, nome: 'Os lençóis do depósito',
      olhar: 'Prateleiras de lençóis e cobertores dobrados, barras velhas de sabão.',
      verbos: [
        { p: 'investigacao', cd: 11, ok: 'Cada lençol tem um monograma bordado: R, T e W. Rose, Thorn e Walter. Os de Walter são os mais novos: nunca foram usados.' },
      ],
    },
    {
      id: 'bercoDoQuarto', ...casa(0, 7), r: 1, nome: 'O berço com a mortalha',
      olhar: 'Um berço coberto por uma mortalha negra, bem esticada.',
      verbos: [
        { p: 'medicina', cd: 12, ok: 'Mortalha de enterro, e não de berço. Quem embrulhou o pacote lá dentro queria enterrar um bebê que nunca viveu.' },
        { p: 'intuicao', cd: 14, ok: 'Alguém em quem se deve confiar quer que vocês olhem o berço. É um pedido, não uma ameaça. O ar está frio, mas sem raiva.' },
      ],
    },
    {
      id: 'camaDaBaba', ...casa(3, 10), r: 2, nome: 'A cama grande da babá',
      olhar: 'Uma cama grande, duas mesas de canto e um guarda-roupa vazio.',
      verbos: [
        { p: 'historia', cd: 13, ok: 'A babá da família teve um caso com o dono da casa. Do caso nasceu Walter, que não viveu. O culto matou a babá pouco depois.' },
        { p: 'investigacao', cd: 12, ok: 'Nas gavetas das mesas de canto, um lenço de seda de homem e uma cartilha de rezas de mulher, sublinhada. Os dois dividiam este quarto, e a esposa nunca soube.' },
      ],
    },
  ],

  // ======================================================================================================== SÓTÃO ===
  casaDaMorte4: [
    {
      id: 'sotaoVazio', ...casa(3, 4), r: 3, nome: 'O assoalho do sótão',
      olhar: 'Poeira grossa e teia por todo o salão de pedra.',
      verbos: [
        { p: 'sobrevivencia', cd: 12, ok: 'Há pegadas na poeira, só de criança: duas linhas, de pés descalços, que vão e voltam ao quarto das crianças. Nenhuma de adulto.' },
        { p: 'percepcao', cd: 14, ok: 'A poeira do chão forma um retângulo fino contra a parede oeste, onde nada entra nem sai. Uma porta, num lugar onde a casa ainda não quer mostrar.' },
      ],
    },
    {
      id: 'bonecaDaJanela', ...casa(3, 8), r: 2, nome: 'A boneca de vestido amarelo',
      olhar: 'Sobre o parapeito da janela do norte, uma boneca sorridente de vestido amarelo, coberta de teia como um véu de noiva.',
      verbos: [
        { p: 'intuicao', cd: 13, ok: 'A boneca está virada para a porta, e não para a janela: quem a pôs queria que visse quem entrava. Alguém brincava com ela e não terminou.' },
        { p: 'arcanismo', cd: 14, ok: 'Não há magia na boneca. Há uma lembrança: alguém a abraçou muito, durante muito tempo.' },
      ],
    },
    {
      id: 'camaDoQuarto17', ...casa(5, 8), r: 2, nome: 'O quarto de repouso (17)',
      olhar: 'Uma cama estreita, um criado-mudo, um fogãozinho, uma escrivaninha com banco, um guarda-roupa vazio e uma cadeira de balanço.',
      verbos: [
        { p: 'investigacao', cd: 12, ok: 'Cada gaveta da escrivaninha está arranhada por dentro, em linhas pequeninas, como contagens de dias: alguém marcou quantos dias passaram.' },
      ],
    },
    {
      id: 'moveisCobertos', ...casa(1, 6), r: 2, nome: 'Os móveis sob os lençóis',
      olhar: 'Cadeiras, casacos, espelhos de corpo inteiro e manequins de costura, todos sob lençóis brancos que parecem gente.',
      passiva: { p: 'percepcao', cd: 14, texto: 'um dos lençóis está virado para a porta, como se alguém o puxasse para ver quem chega.' },
      verbos: [
        { p: 'percepcao', cd: 12, ok: 'Nenhum dos manequins se mexe. Os lençóis, sim: um deles cai de leve, como se alguém tivesse soprado debaixo dele.' },
        { p: 'investigacao', cd: 13, ok: 'Embaixo dos lençóis: casacos de criança, vestidos pequenos e um espelho de corpo inteiro virado para a parede. Quem o virou não queria ver o próprio rosto.' },
      ],
    },
    {
      id: 'restosDosIrmaos', ...casa(3, 1), r: 2, nome: 'Os ossos de Rose e Thorn',
      olhar: 'No meio do chão, dois esqueletos pequenos de roupas esfarrapadas, um abraçando um boneco de pano.',
      verbos: [
        { p: 'medicina', cd: 10, ok: 'Crianças, de uns dez e sete anos. Morreram juntas, de fome, com meses de diferença para o último fôlego. Estão abraçadas: uma cuidou da outra.' },
        { p: 'percepcao', cd: 12, ok: 'Marcas de unha no lado de dentro da porta, e a janela emparedada por tijolos de fora. Não era para saírem.' },
        { p: 'religiao', cd: 12, ok: 'Ossos que não foram enterrados prendem o espírito ao lugar. Um enterro numa cripta, com o nome certo, os deixaria partir.', marca: 'sabeDoEnterro' },
      ],
    },
    {
      id: 'brinquedos', ...casa(4, 2), r: 1, nome: 'A caixa de brinquedos',
      olhar: 'Um baú com moinhos de vento pintados nos lados. Dentro, bichos de pelúcia e brinquedos.',
      aura: { escola: 'necromancia', texto: 'Uma aura fraca e fria de necromancia: a presença de duas crianças que morreram aqui.' },
      verbos: [
        { p: 'investigacao', cd: 12, ok: 'Os brinquedos são caros e pouco usados: crianças que não tinham com quem brincar. O mais gasto é um soldado de madeira sem cabeça.' },
      ],
    },
    {
      id: 'casaDeBonecasPista', ...casa(3, 0), r: 1, nome: 'A casa de bonecas',
      olhar: 'Uma réplica perfeita da Casa da Morte, em miniatura, coberta de teia.',
      aura: { escola: 'ilusão', texto: 'Uma aura de ilusão e de adivinhação: a casa de bonecas é um espelho da casa verdadeira, e mostra o que ela esconde.' },
      verbos: [
        { p: 'arcanismo', cd: 13, ok: 'A casa de bonecas está ligada à casa de verdade por um fio de magia: mexer numa mexe na outra. As portas secretas que a casa esconde aparecem aqui, no tamanho dos dedos.' },
        { p: 'investigacao', cd: 14, ok: 'No telhado da miniatura, um alçapão do tamanho de uma unha, e atrás dele uma escada em espiral de palito de fósforo. A casa dos adultos esconde a mesma.' },
      ],
    },
    {
      id: 'camasDasCriancas', ...casa(2, 0), r: 2, nome: 'As camas pequenas',
      olhar: 'Duas camas de estrutura de madeira, dimensionadas para crianças, empoeiradas.',
      verbos: [
        { p: 'investigacao', cd: 11, ok: 'As cobertas estão dobradas por mão pequena, com capricho torto. O menor dos berços tem uma boneca de pelúcia: vocês a reconhecem.' },
      ],
    },
  ],

  // ===================================================================================== MASMORRA 1 (áreas 22 a 34) ===
  casaDaMortePorao1: [
    {
      id: 'pegadasDoAcesso', x: 21, y: 16, r: 2, nome: 'As pegadas no chão de terra',
      olhar: 'O chão de terra batida tem pegadas humanas de séculos, indo para todos os lados.',
      verbos: [
        { p: 'sobrevivencia', cd: 10, ok: 'Todas as pegadas são velhas de séculos, de gente de sapato e de gente descalça, de passo lento: filas de iniciados em procissão.' },
        { p: 'percepcao', cd: 12, ok: 'Nenhuma pegada vai para o túnel oeste do sul: ele existe, mas ninguém o usou. Ou alguém tirou os rastros.' },
      ],
    },
    {
      id: 'mesaDosIniciados', x: 24, y: 11, r: 1, nome: 'A mesa dos iniciados',
      olhar: 'Uma mesa de madeira e quatro cadeiras no extremo leste do quarto; alcovas de palha mofada a oeste.',
      verbos: [
        { p: 'religiao', cd: 12, ok: 'Na madeira da mesa, riscados com faca: círculos dentro de círculos, o signo de Osybus. Os iniciados juravam sobre ele, de joelhos.' },
        { p: 'investigacao', cd: 12, ok: 'As alcovas de palha têm o formato de gente deitada, e nenhuma se mexeu em séculos. Em uma, um cordão com um pingente de moinho: quem dormia aqui era da família.' },
      ],
    },
    {
      id: 'pocoDosCultistas', x: 16, y: 4, r: 1, nome: 'O poço e a polia',
      olhar: 'Um poço de pedra, de borda na cintura, desce nove metros até uma cisterna. Um balde pende de uma corda lisa.',
      verbos: [
        { p: 'investigacao', cd: 11, ok: 'A corda é nova, de uma fibra que se gasta e some: a casa a repõe, como a madeira. O poço, esse, é de verdade: alguém o cavou a mão.' },
        { p: 'natureza', cd: 12, ok: 'A água lá embaixo é de lençol freático, doce, sem peixe nem alga. Pode-se beber, e dá sede.' },
      ],
    },
    {
      id: 'pegadasDoPoco', x: 12, y: 11, r: 2, nome: 'O túnel do poço de espinhos',
      olhar: 'Um túnel de terra, de paredes escoradas por vigas, onde o canto fica mais alto.',
      passiva: { p: 'percepcao', cd: 15, texto: 'o chão do túnel não tem nenhuma pegada: nem velha, nem nova, nem uma. Em todo o resto da masmorra elas estão por toda parte.' },
      verbos: [
        { p: 'percepcao', cd: 15, ok: 'Não há pegadas neste trecho do túnel. Alguma coisa impede quem passa: um poço sob o chão, com tábuas podres por cima.', marca: 'sabeDoFosso' },
        { p: 'sobrevivencia', cd: 13, ok: 'Quem andou aqui no passado desviou do meio: as marcas dão a volta num retângulo de terra mais fina. Um fosso, de um metro e meio.', marca: 'sabeDoFosso' },
      ],
    },
    {
      id: 'ossosDoJantar', x: 14, y: 17, r: 2, nome: 'Os ossos do salão de jantar',
      olhar: 'Ossos humanoides, mofados, espalhados pelo chão de terra de um salão com uma mesa de madeira e bancos longos.',
      verbos: [
        { p: 'medicina', cd: 12, ok: 'Ossos de gente, roídos pelos dentes e não por facas: os "banquetes" do culto eram comer pessoas. Dá para contar pelo menos doze mortos.' },
        { p: 'investigacao', cd: 12, ok: 'Presos entre os ossos, pedaços de corrente com algemas pequenas demais para adultos. Os prisioneiros vieram da prisão, no nível de baixo.' },
      ],
    },
    {
      id: 'alcovaDoGrick', x: 15, y: 20, r: 1, nome: 'A alcova escura na parede sul',
      olhar: 'No meio da parede sul, uma alcova escurecida, vazia.',
      verbos: [
        { p: 'sobrevivencia', cd: 12, ok: 'Um rastro de muco seco desce do teto da alcova ao chão, de uma largura de tentáculos. Alguma coisa mora ali, e se esconde na parede.', marca: 'gricAvisado' },
        { p: 'natureza', cd: 13, ok: 'O muco é de um grick: um verme longo, de bico de ave, que se pendura no teto e cai sobre quem passa. Ele não vê, mas sente o tremor dos passos.', marca: 'gricAvisado' },
      ],
    },
    {
      id: 'estatuaDeStrahd', x: 8, y: 23, r: 1, nome: 'A estátua de Strahd',
      olhar: 'Uma estátua de madeira pintada num nicho: um homem magro e pálido, de capa preta volumosa, a mão esquerda na cabeça de um lobo, a direita segurando uma esfera de cristal cinza esfumaçado.',
      aura: { escola: 'necromancia', texto: 'Uma aura de necromancia concentrada em volta da estátua e na sala: espíritos presos aqui, esperando quem toque a esfera.' },
      verbos: [
        { p: 'religiao', cd: 12, ok: 'Os cultistas fizeram sacrifícios a esta estátua na esperança de que o homem que ela representa lhes dissesse seus segredos mais sombrios. Ele nunca disse.' },
        { p: 'arcanismo', cd: 13, ok: 'A esfera é cristal comum, sem magia: um foco de conjuração, no máximo. O que prende a sala é o que está em volta dela, nas sombras.' },
        { p: 'intuicao', cd: 14, ok: 'A sensação de estar sendo observado vem das sombras da sala, não da estátua. Se alguém tocar a esfera, as sombras vão se mexer.', marca: 'sombrasAvisadas' },
      ],
    },
    {
      id: 'esqueletosPendurados', x: 8, y: 19, r: 2, nome: 'Os esqueletos nas correntes',
      olhar: 'Esqueletos mofados pendem de grilhões enferrujados contra as paredes.',
      verbos: [
        { p: 'investigacao', cd: 11, ok: 'Estes esqueletos são só decoração: sem uma marca de faca, sem um dente quebrado. Foram postos aqui para a cena.' },
        { p: 'percepcao', cd: 10, ok: 'Há uma porta escondida na parede leste, sob a argila: madeira apodrecida, de moldura quadrada.' },
      ],
    },
    {
      id: 'mesaDoCovil', x: 4, y: 17, r: 1, nome: 'A mesa dos líderes',
      olhar: 'Um candelabro suspenso sobre uma mesa, duas cadeiras de espaldar alto, um jarro de barro vazio e duas garrafas. Castiçais de ferro nos cantos.',
      verbos: [
        { p: 'investigacao', cd: 12, ok: 'As duas garrafas têm resto de vinho, e o jarro, um resto de sangue. Os líderes do culto brindavam com o que tiravam das vítimas.' },
      ],
    },
    {
      id: 'portaDoMimico', x: 5, y: 19, r: 1, nome: 'A porta do canto sudoeste',
      olhar: 'Uma porta de madeira escura, de dobradiças de ferro, no canto sudoeste do covil.',
      verbos: [
        { p: 'percepcao', cd: 14, ok: 'A porta tem uma película de umidade, como suor. As dobradiças não têm ferrugem, em uma masmorra em que tudo enferruja. Alguma coisa nela respira.', marca: 'mimicoVisto' },
        { p: 'investigacao', cd: 13, ok: 'A porta não tem tranca nem buraco de chave, e a madeira não tem veios: é lisa demais. Não é porta, é uma criatura disfarçada de porta.', marca: 'mimicoVisto' },
        { p: 'arcanismo', cd: 12, ok: 'Nada de mágico. A porta não tem aura: o que ela é, é natural. Um mímico, provavelmente.', marca: 'mimicoVisto' },
      ],
    },
    {
      id: 'cavidadesDoQuarto', x: 4, y: 13, r: 1, nome: 'As paredes de terra do quarto dos líderes',
      olhar: 'Uma grande cama de madeira, um guarda-roupa de vestes antigas, castiçais de ferro e uma caixa aberta com tochas e velas.',
      passiva: { p: 'percepcao', cd: 15, texto: 'a terra da parede norte soa oca, em dois pontos: há espaço atrás dela.' },
      verbos: [
        { p: 'percepcao', cd: 13, ok: 'A parede de terra tem duas rachaduras finas, a um metro uma da outra, no formato de uma pessoa deitada. Alguém está atrás delas.', marca: 'lividosVistos' },
        { p: 'historia', cd: 12, ok: 'As vestes do guarda-roupa são pretas de culto, mas as duas maiores têm o brasão do moinho: de gente da família Durst. Os pais se vestiam assim.' },
      ],
    },
    {
      id: 'caixaDoPe', x: 3, y: 13, r: 1, nome: 'A caixa ao pé da cama',
      olhar: 'Uma caixa de madeira destrancada, ao pé da cama.',
      aura: { escola: 'abjuração', texto: 'Uma aura de abjuração forte, num manto dobrado, dentro da caixa. Há também magia fraca de adivinhação num livro de capa amarela.' },
      verbos: [
        { p: 'investigacao', cd: 13, ok: 'A caixa guarda coisas de aventureiros, de muitos aventureiros: brasões diferentes nas tampas das poções. O culto matou todos e guardou as coisas de recordação.' },
        { p: 'intuicao', cd: 14, ok: 'Quem deixou a caixa aberta queria que alguém a mexesse. Atrás da terra, ouvem-se dois pares de dentes rilhando.', marca: 'lividosVistos' },
      ],
    },
    {
      id: 'lajeDeWalter', x: 23, y: 21, r: 1, nome: 'As criptas da família',
      olhar: 'Criptas escavadas na terra, cada uma selada por uma laje de pedra, menos as que estão encostadas na parede.',
      verbos: [
        { p: 'historia', cd: 12, ok: 'Os nomes gravados nas lajes são dos Durst: Walter, Gustav, Elisabeth, Rose e Thorn. A cripta vazia sobrou: a casa guardou lugar para mais um.' },
        { p: 'religiao', cd: 12, ok: 'Caixões vazios nas criptas de Rose e Thorn pedem os corpos. Quem os deitar lá, com respeito, faz o que o culto nunca fez por eles.', marca: 'sabeDoEnterro' },
        { p: 'investigacao', cd: 12, ok: 'As lajes das criptas de Walter e da vazia foram só encostadas. As outras foram seladas por mãos fortes e não foram abertas desde então.' },
      ],
    },
    {
      id: 'caixaoDeElisabeth', x: 17, y: 19, r: 1, nome: 'O caixão de Elisabeth',
      olhar: 'Um esquife de pedra com um caixão vazio sobre ele.',
      verbos: [
        { p: 'percepcao', cd: 14, ok: 'A parede dos fundos desta cripta tem frestas finas demais para serem do tempo: algo mora nelas e sai se o caixão for mexido.', marca: 'centopeiasVistas' },
        { p: 'natureza', cd: 12, ok: 'Há um cheiro de terra úmida e de pernas: um ninho de centopeias, imenso, atrás da parede.', marca: 'centopeiasVistas' },
      ],
    },
  ],

  // ===================================================================================== MASMORRA 2 (áreas 35 a 38) ===
  casaDaMortePorao2: [
    {
      id: 'canto', x: 17, y: 5, r: 4, nome: 'O canto no ar',
      olhar: 'Uma dúzia de vozes repete, sem parar: "Ele é o Ancestral. Ele é a Terra".',
      verbos: [
        { p: 'intuicao', cd: 12, ok: 'As vozes não vêm das paredes, e sim de dentro delas: não é eco, é gente. Cantam sem respirar, como cantam os que não têm mais fôlego.' },
        { p: 'religiao', cd: 13, ok: '"O Ancestral" e "a Terra" são o mesmo, na língua deles: um senhor da terra e da morte, que o culto confundiu com Strahd, e que não é nenhum dos dois.' },
      ],
    },
    {
      id: 'niches', x: 18, y: 5, r: 4, nome: 'Os treze nichos de relíquias',
      olhar: 'Nichos nas paredes guardam as "relíquias" do culto.',
      aura: { escola: 'necromancia', texto: 'Auras ínfimas de necromancia em quase todos os nichos: restos de gente, e só. Nenhum item é mágico.' },
      verbos: [
        { p: 'religiao', cd: 13, ok: 'O pingente de ferro com cara de diabo é de uma ordem de adoradores de diabos, os Sacerdotes de Osybus, de longe. O resto é lixo de ritual de gente que acreditava.' },
        { p: 'natureza', cd: 12, ok: 'A língua seca do cofrezinho é de lobo atroz: um bicho da região de Baróvia. A mão de goblin, de uma tribo das montanhas. Os cultistas colecionavam o que achavam.' },
        { p: 'arcanismo', cd: 12, ok: 'Nada aqui é mágico, apesar de tudo parecer. Os "poderes" que o culto buscava nunca vieram: foi só o desespero deles que ficou.' },
      ],
    },
    {
      id: 'algemasDaPrisao', x: 8, y: 2, r: 4, nome: 'As algemas da prisão',
      olhar: 'Grilhões enferrujados nas paredes dos fundos das alcovas.',
      verbos: [
        { p: 'investigacao', cd: 12, ok: 'Algumas algemas estão fechadas e vazias, sem esqueleto: os presos foram soltos, e levados, e comidos. Os ossos estão no salão de jantar, no nível de cima.' },
        { p: 'medicina', cd: 13, ok: 'O esqueleto de manto preto morreu de sede e de fome, e não de golpe: ninguém o matou, deixaram-no esquecer de viver. O culto perdoava pouco.' },
      ],
    },
    {
      id: 'ponteLevadica', x: 14, y: 6, r: 2, nome: 'A ponte levadiça de ferro',
      olhar: 'Uma ponte levadiça de ferro enferrujado, erguida, fecha o túnel. O chão em volta está sob sessenta centímetros de água turva.',
      verbos: [
        { p: 'investigacao', cd: 12, ok: 'As correntes da ponte sobem pelo teto do túnel e somem na parede leste da câmara. Há uma roda de madeira lá, do outro lado, que a ergue e a abaixa.' },
        { p: 'atletismo', cd: 15, ok: 'A ponte é pesada, mas não emperrada: com ombros fortes, dá para levantá-la um palmo e ver o outro lado. Nenhuma passagem, mas uma ideia da câmara.' },
      ],
    },
    {
      id: 'altarDoRitual', x: 8, y: 8, r: 3, nome: 'O altar de pedra',
      olhar: 'Um altar de pedra no estrado octogonal, esculpido com carniçais agarrando, manchado de sangue seco, sob correntes pendentes.',
      aura: { escola: 'necromancia', texto: 'Uma aura de necromancia forte, de décadas de sacrifícios, concentrada no altar e no estrado, como a de uma cripta que sangra.' },
      verbos: [
        { p: 'religiao', cd: 13, ok: 'Carniçais agarrando: a oferenda era entregue em carne aos mortos famintos, e não a um deus. O culto alimentava o que vinha de baixo.' },
        { p: 'medicina', cd: 14, ok: 'O sangue seco é de muitas pessoas, por muitos anos: camadas e camadas, como anéis de árvore. Vítimas de todas as idades.' },
        { p: 'investigacao', cd: 12, ok: 'As correntes de 2,4 m pendem sobre o altar. Os grilhões são de adulto, mas alguns, de criança.' },
      ],
    },
    {
      id: 'acusticaDaCamara', x: 6, y: 8, r: 4, nome: 'Os pilares e as paredes lisas',
      olhar: 'Uma sala de doze metros de lado, de alvenaria lisa, com pilares de pedra sem cor sustentando o teto, a quase cinco metros.',
      verbos: [
        { p: 'arcanismo', cd: 14, ok: 'A câmara é perfeita para ritual: a acústica leva a voz para o teto e a devolve para o altar. Quem canta aqui, canta para dentro de si.' },
        { p: 'intuicao', cd: 13, ok: 'O canto parou quando vocês entraram. Esta sala não precisa mais de cantores: o que eles faziam, ela faz sozinha.' },
      ],
    },
    {
      id: 'rodaDaPonte', x: 11, y: 8, r: 2, nome: 'A roda de madeira na parede leste',
      olhar: 'Meio embutida na parede leste, uma roda de madeira ligada a correntes e mecanismos ocultos.',
      verbos: [
        { p: 'investigacao', cd: 11, ok: 'A roda é o que levanta e baixa a ponte do túnel norte. Está engraxada, e funciona.' },
      ],
    },
    {
      id: 'lixoDeLorghoth', x: 2, y: 7, r: 2, nome: 'O monte de lixo da alcova',
      olhar: 'Um monte semi-submerso de refugo: galhos, ervas e lama.',
      verbos: [
        { p: 'natureza', cd: 15, ok: 'Não é lixo: é um arbusto errante, grande, adormecido. Os cultistas o chamavam de Lorghoth, o Decadente. Acorda se for atacado.' },
        { p: 'sobrevivencia', cd: 12, ok: 'Há trilhas de folhas e de lama até a câmara: ele andava, de tempos em tempos, e voltava. Devora o que o culto joga.' },
      ],
    },
  ],
};
