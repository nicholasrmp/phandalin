// Livro do Jogador não é SRD: a Maldição de Strahd é conteúdo da Wizards. O TEXTO é nosso, os fatos são os do livro — ver NOTICE.md e STRAHD.md.
//
// O que se vê ao chegar em cada sala das duas masmorras da Casa da Morte (áreas 22 a 38), por `id` da planta
// (`casadamorte-porao.js`, gerada por `src/dev/mapa-casadamorte.py`). Quem não tem visão no escuro precisa de luz: aqui tudo é escuro.

export const TEXTOS_PORAO = {
  acesso: [
    'A escada em espiral de madeira do sótão termina num túnel estreito, de paredes de terra, escoradas por vigas. Ele segue para o sul antes de se abrir em corredores para leste e oeste. O teto é baixo, e no chão de terra batida há pegadas humanas de séculos, indo para todos os lados.',
    'Aqui embaixo é escuro: quem não enxerga no escuro precisa acender uma tocha. Desde que vocês pisaram aqui, ouvem um canto incessante e abafado, e não dá para dizer de onde vem.',
  ],
  iniciados: [
    'Uma mesa de madeira e quatro cadeiras ao leste. A oeste, quatro alcovas com palha mofada, onde dormiam os iniciados do culto.',
  ],
  quartoA: ['Um quarto lateral, onde dormia um cultista veterano: uma cama de armação de madeira com colchão de palha mofada e um baú de madeira, com cadeado de ferro enferrujado.'],
  quartoB: ['Um quarto lateral, onde dormia um cultista veterano: uma cama de armação de madeira com colchão de palha mofada e um baú de madeira, com cadeado de ferro enferrujado.'],
  quartoC: ['Um quarto lateral, aberto para o salão: uma cama de armação de madeira com colchão de palha mofada e um baú de madeira, com cadeado de ferro enferrujado.'],
  quartoD: ['Um quarto lateral, onde dormia um cultista veterano: uma cama de armação de madeira com colchão de palha mofada e um baú de madeira, com cadeado de ferro enferrujado.'],
  quartoE: ['Um quarto lateral, onde dormia um cultista veterano: uma cama de armação de madeira com colchão de palha mofada e um baú de madeira, com cadeado de ferro enferrujado.'],
  poco: [
    'Um poço de pedra, de pouco mais de um metro de largura e borda na altura da cintura, desce nove metros até uma cisterna de água parada. Um balde de madeira pende de uma polia presa à viga, acima.',
    'Em volta, cinco quartos pequenos serviram a cultistas veteranos: cada um com uma cama de armação de madeira, um colchão de palha mofada e um baú de madeira trancado com cadeado de ferro enferrujado.',
  ],
  espinhos: [
    'O canto fica mais alto, mais nítido, à medida que o túnel segue para oeste.',
  ],
  carnicais: [
    'Um cruzamento de quatro vias. O canto vem do norte, bem mais alto.',
  ],
  jantar: [
    'Uma mesa simples de madeira com bancos compridos ao longo dela. Ossos humanos, mofados, espalhados pelo chão de terra: os restos dos banquetes horrendos do culto.',
    'No meio da parede sul há uma alcova escura.',
  ],
  despensa: [
    'Uma alcova escura, vazia, na parede sul do salão de jantar.',
  ],
  escadas: [
    'Uma escada de seis metros, em degraus de pedra, desce para o escuro. Dá para ouvir com clareza que o canto vem de algum lugar lá embaixo.',
  ],
  santuario: [
    'Esqueletos mofados pendem de grilhões enferrujados contra as paredes. Numa grande alcova na parede sul está uma estátua de madeira pintada: um homem magro, de rosto pálido, com uma capa preta volumosa, a mão esquerda apoiada na cabeça de um lobo ao seu lado, e na direita uma esfera de cristal cinza esfumaçado.',
    'É Strahd. Os cultistas lhe fizeram sacrifícios na vã esperança de que revelasse seus segredos mais sombrios. A sala tem saídas a oeste e ao norte, e o canto sobe do oeste.',
  ],
  alcapao: [
    'Uma escada de pedra sobe três metros até uma superfície de tábuas, com teto baixo, de um metro e oitenta. No alto, um alçapão de madeira, fechado por parafusos deste lado.',
  ],
  covil: [
    'Um candelabro pende sobre uma mesa no meio da sala. Duas cadeiras de espaldar alto flanqueiam a mesa, sobre a qual há um jarro de barro vazio e duas garrafas. Castiçais de ferro nos cantos, com velas há muito derretidas.',
    'No canto sudoeste, uma porta de madeira escura, de dobradiças de ferro, parece levar adiante.',
  ],
  quartoLideres: [
    'Uma cama de madeira grande, com colchão de pena. Um guarda-roupa com vestes antigas, um par de castiçais de ferro e uma caixa aberta com trinta tochas e um saco de couro com quinze velas. Ao pé da cama, uma caixa de madeira destrancada.',
  ],
  criptaA: ['Uma laje de pedra em branco, destinada a selar esta cripta, está encostada na parede. A cripta está vazia.'],
  criptaB: ['A laje de pedra que selaria esta cripta está encostada numa parede próxima. Gravado nela: Walter Durst. A cripta está vazia.'],
  criptaC: ['A laje está gravada com o nome Gustav Durst. A câmara tem um caixão vazio sobre um esquife de pedra.'],
  criptaD: ['A laje está gravada com o nome Elisabeth Durst. A cripta tem um esquife de pedra com um caixão vazio sobre ele.'],
  criptaE: ['A laje está gravada com o nome Rosavalda Durst. A câmara tem um caixão vazio sobre um esquife de pedra.'],
  criptaF: ['A laje está gravada com o nome Thornboldt Durst. A câmara tem um caixão vazio sobre um esquife de pedra.'],
  escadaChegada: [
    'A escada termina num corredor curto e baixo, que sobe de leve e vira. O canto ficou mais alto, uma dúzia de vozes, mas ainda não dá para distinguir as palavras.',
  ],
  relicario: [
    'Uma sala grande, cheia do canto: uma dúzia de vozes repete sem parar "Ele é o Ancestral. Ele é a Terra". Em treze nichos ao longo das paredes, o culto guardou as "relíquias" dos seus rituais: uma mão de goblin mumificada, facas de osso, uma capa de pele de carniçal remendada, um sapo seco num cabo, o dedo de uma bruxa, a cabeça murcha de um halfling, um pingente de ferro com cara de diabo, e outras bugigangas do gênero.',
    'São bugigangas sem valor. O túnel mais ao sul inclina-se para baixo, a vinte graus, e entra na água turva.',
  ],
  tunelAgua: [
    'O túnel desce a vinte graus e some debaixo d\'água escura. No fim, uma ponte levadiça de ferro enferrujado, erguida, fecha a passagem. O chão em volta está debaixo de sessenta centímetros de água turva.',
  ],
  prisao: [
    'Os cultistas algemavam prisioneiros nas paredes dos fundos de várias alcovas. Os prisioneiros já se foram (os ossos deles estão no chão do salão de jantar), mas as algemas enferrujadas continuam.',
    'Numa das celas, um esqueleto humano de manto preto esfarrapado pende da parede.',
  ],
  ponte: [
    'O fim do túnel, com água até a canela. Uma ponte levadiça de ferro, erguida, fecha a passagem; abaixada, ela leva ao salão afundado da câmara.',
  ],
  camara: [
    'O canto cessa assim que vocês entram. Uma sala de doze metros de lado, de paredes lisas de alvenaria, com pilares de pedra sem cor sustentando o teto, a quase cinco metros de altura. A água turva cobre quase todo o chão: sessenta centímetros de profundidade.',
    'Escadas levam a bordas de pedra secas junto às paredes. No meio da sala, mais degraus sobem a um estrado octogonal, também acima da água. Correntes enferrujadas com grilhões pendem do teto, direto sobre um altar de pedra no estrado. O altar tem entalhes horríveis de carniçais agarrando, e está manchado de sangue seco.',
    'No meio da parede oeste, uma abertura leva a uma alcova escura, cheia de lixo. Na parede leste, meio embutida, uma roda de madeira ligada a correntes.',
  ],
  alcova: [
    'Uma alcova natural, de teto baixo, entupida de um monte semi-submerso de refugo: galhos, ervas e lama.',
  ],
};
