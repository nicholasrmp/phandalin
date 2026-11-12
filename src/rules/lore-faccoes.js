// AS CINCO FACÇÕES que a Mina Perdida e o Obelisco usam, escritas à mão: o que se sabe delas na Costa da Espada, em
// camadas de CD como a lore dos livros (`lore.js`). Os livros as espalham em pedaços (o SCAG fala dos Harpistas no bardo,
// do Enclave no druida...), então aqui o texto é nosso desde o começo, sem passar por modelo. Quem as encarna na vila: a
// Irmã Garaele (Harpistas), o Daran Edermath (Ordem da Manopla), a Reidoth (Enclave Esmeralda), o Sildar Hallwinter
// (Aliança dos Lordes) e a Halia Thornton (Zhentarim).
const faccao = (chave, nome, resumo, fatos, palavras) => ({ chave, tipo: 'faccao', fonte: 'propria', nome, resumo, fatos, palavras });

export const FACCOES = {
  'faccao:harpistas': faccao('faccao:harpistas', 'Harpistas',
    'Uma rede antiga e discreta de gente que trabalha contra a tirania e o abuso de poder, sem bandeira e sem quartel.',
    [
      { cd: 10, texto: 'Fala-se de agentes que aparecem onde um tirano cresce e somem quando ele cai. Ninguém se diz Harpista em voz alta.' },
      { cd: 15, texto: 'O sinal deles é uma harpa de prata entre os chifres de uma lua crescente. Trabalham em células pequenas, e cada membro conhece poucos outros.' },
      { cd: 15, texto: 'Bardos, magos e clérigos andarilhos estão entre eles. Preferem a informação à espada: saber primeiro e agir em silêncio.' },
      { cd: 20, texto: 'Já foram perseguidos e quase desfeitos mais de uma vez, e sempre voltaram. Desconfiam de quem junta poder demais, até entre os próprios aliados.' },
    ],
    ['harpistas', 'harpista', 'harpa', 'lua crescente', 'rede', 'espioes']),
  'faccao:ordemDaManopla': faccao('faccao:ordemDaManopla', 'Ordem da Manopla',
    'Uma ordem jovem de guerreiros e devotos que caça o mal onde ele se esconde e o enfrenta de frente.',
    [
      { cd: 10, texto: 'Cavaleiros e clérigos que juram combater o mal sem esperar que ele ataque primeiro. O símbolo é uma manopla de prata de punho fechado.' },
      { cd: 15, texto: 'Servem a Tyr, Torm e Helm, os deuses da justiça, do dever e da vigilância, mas a ordem é dos fiéis, não de um templo só.' },
      { cd: 15, texto: 'Não tratam com corruptores, mortos-vivos nem cultos: para eles não há acordo com o mal, só vigília e golpe.' },
      { cd: 20, texto: 'É uma ordem nova e por isso ainda pequena; mede os seus pela coragem e pela palavra cumprida, e não pelo sangue nem pela fortuna.' },
    ],
    ['ordem da manopla', 'manopla', 'cavaleiros', 'tyr', 'torm', 'helm', 'vigilia']),
  'faccao:enclaveEsmeralda': faccao('faccao:enclaveEsmeralda', 'Enclave Esmeralda',
    'Druidas, patrulheiros e gente do campo que guardam o equilíbrio entre a civilização e a natureza selvagem.',
    [
      { cd: 10, texto: 'Os do Enclave andam pelos ermos e ajudam quem vive longe das cidades a sobreviver aos perigos da mata.' },
      { cd: 15, texto: 'Não são inimigos das cidades: querem que nem a natureza engula o povo nem o povo devaste a terra. O símbolo é uma folha verde sobre um disco.' },
      { cd: 15, texto: 'Caçam o que não pertence ao mundo natural: mortos-vivos, aberrações e quem corrompe a terra.' },
      { cd: 20, texto: 'Têm poucos lugares fixos; os membros se reconhecem pelos sinais deixados em pedras e troncos, e se encontram nas estações certas do ano.' },
    ],
    ['enclave esmeralda', 'enclave', 'druidas', 'natureza', 'folha', 'equilibrio']),
  'faccao:aliancaDosLordes': faccao('faccao:aliancaDosLordes', 'Aliança dos Lordes',
    'A liga das cidades da Costa da Espada e do Norte — Águas Profundas, Neverwinter, Portal de Baldur, Mirabar e outras — para se protegerem juntas.',
    [
      { cd: 10, texto: 'É a união dos governantes das grandes cidades do Norte: soldados, magistrados e agentes que defendem as estradas e o comércio.' },
      { cd: 15, texto: 'Os agentes dela agem em nome da ordem e da lei de cada cidade, e respondem a lordes que nem sempre concordam entre si.' },
      { cd: 15, texto: 'Neverwinter e Águas Profundas pesam mais nas decisões. Quem serve a Aliança costuma ter cargo, título ou patente.' },
      { cd: 20, texto: 'Por trás da união há rivalidades velhas entre as cidades; a Aliança é forte contra o inimigo de fora e frágil quando os lordes disputam entre si.' },
    ],
    ['alianca dos lordes', 'alianca', 'lordes', 'neverwinter', 'aguas profundas', 'cidades']),
  'faccao:zhentarim': faccao('faccao:zhentarim', 'Zhentarim',
    'A Rede Negra: mercenários, comerciantes e contrabandistas que vendem o que for preciso, a quem pagar.',
    [
      { cd: 10, texto: 'Os Zhentarim têm fama de bandidos com contrato: escoltam caravanas, alugam espadas e cobram caro por segurança.' },
      { cd: 15, texto: 'Hoje se apresentam como um negócio respeitável e lucrativo, e prometem aos seus riqueza e influência. O símbolo é uma serpente alada negra.' },
      { cd: 15, texto: 'Valem-se de favores, dívidas e informação; quem entra para a Rede Negra ganha amigos poderosos e fica devendo a eles.' },
      { cd: 20, texto: 'Já foram uma ordem de tiranos e magos negros; a velha fama persegue a rede, e há quem diga que por baixo do comércio ela continua a mesma.' },
    ],
    ['zhentarim', 'rede negra', 'serpente alada', 'mercenarios', 'contrabando']),
};
