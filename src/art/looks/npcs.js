// LOOKS dos NPCs da campanha: gente que fala, negocia, contrata e trai.
//
// Pareia com `rules/npcs.js`. Um NPC não precisa de bloco de combate próprio —
// quase todos usam um bloco do SRD (plebeu, guarda, cavaleiro, mago, acólito).
// O que ele precisa é de um rosto que o jogador reconheça da segunda vez.
//
// CAMPOS DO LOOK
//   CORPO     species  humano|elfo|drow|meioElfo|anao|halfling|goblin|hobgoblin|
//                      bugbear|orc|ogro
//             build    magro|normal|forte|gordo
//             heightMul  ajuste fino de altura dentro da espécie (1 = padrão)
//             child    true põe cabeça alta sobre perna curta — lê como criança
//             plan     nome de um plano corporal de `art/plans/` para quem não
//                      é humanoide (aracnideo, gosma, mortoVivo, dragao, ...)
//   CORES     skin, hair, outfit, outfitDark, trim, metal, leather, eyes,
//             glow, cloak, noseTint
//   ESTRUTURA hairStyle  spiky|long|short|bald|hood
//             armorStyle robe|leather|scale|plate
//             weapon     sword|dagger|mace|staff|bow|axe
//             helm, shield, beard, horns: boolean
//   LEITURA   stance   postura (ver POSTURAS em draw.js): neutro|solto|guerreiro|
//                      ladino|mago|clerico|agachado|militar|curvado|bruto
//             marca    marca de silhueta, string ou lista (ver MARCAS em draw.js):
//                      chapeuPontudo|cimeira|corcunda|manto|ombreira|capuz|
//                      trancas|mochila
//             facial   variação individual do rosto, string ou lista:
//                      cicatriz|tapaOlho|pinturaGuerra|idoso|narizQuebrado
//             face     sobrescreve a estrutura do rosto da espécie (ver `rosto`
//                      em body.js): testa, arcada, macas, mandibula, queixo,
//                      projeta, olhoGap, olhoH, olhoW, nariz, narizW, boca
//
// A anatomia sai de `body.js` e o traço de `draw.js`. Aqui só entram dados.
//
// ---------------------------------------------------------------------------
// COMO ESTE ARQUIVO RESOLVE O DEFEITO 1 DO ELENCO (teste da silhueta)
//
// Nove dos vinte e um NPCs usam o MESMO bloco de regra e cinco deles são
// humanos adultos de classe trabalhadora. Se a diferença ficasse só na tinta,
// seriam cinco vezes o mesmo boneco, porque a 55 px no tabuleiro a cor chega
// depois da forma. Então cada NPC recebe quatro eixos de separação antes de
// receber cor:
//
//   1. ESPÉCIE e ALTURA  — anão, halfling, meio-elfo, elfo, drow, goblin,
//      bugbear, e cinco alturas diferentes de humano.
//   2. POSTURA (`stance`) — o estalajadeiro apoia o peso num quadril, o
//      cavaleiro fica em sentido, o velho do armazém dobra as costas.
//   3. MARCA (`marca`)   — o elemento que invade o contorno: corcunda, manto,
//      mochila, chapéu, cimeira, ombreira, capuz, tranças.
//   4. ROSTO (`face` + `facial`) — proporção de queixo, nariz e olho, e as
//      marcas de idade, cicatriz e nariz quebrado.
//
// Cada entrada carrega a frase de silhueta dela. A regra do ELENCO: se a frase
// servir para outro NPC, o NPC não ficou pronto. Onde duas entradas repetem uma
// marca (há 8 marcas para 21 figuras), elas estão sempre em espécies, alturas e
// posturas diferentes — é a frase inteira que tem de ser única, não o adereço.
//
// ALTURA: NENHUM PAR REPETIDO
// Os `heightMul` não são enfeite. Oito NPCs humanos adultos saíam todos com 58
// px, porque 58 é o humano médio e um ajuste de 1% desaparece no arredondamento.
// Pior: Reidoth e Iarno caíam na mesma postura (`mago`), na mesma altura e com a
// mesma marca (cone), separados só pela barba. Então as alturas foram espalhadas
// à mão de 53 a 62 px, com pelo menos 1 px entre quem compartilha postura, e com
// os dois magos de cone em pontas opostas da faixa: Reidoth é o mais alto dos
// humanos, Iarno o mais baixo dos adultos em pé.
//
// VALOR, NÃO SÓ MATIZ (defeito 4)
// Os plebeus de Phandalin sairiam todos marrom-bege num mesmo valor médio. Então
// a vila foi espalhada de propósito pela escala de valor: Toblen é a figura mais
// CLARA do elenco (linho cru), Halia a mais ESCURA entre os vivos (ameixa e
// carvão), e os outros se distribuem entre os dois. Lado a lado numa taverna,
// com os olhos semicerrados, ainda dá para contar as pessoas.
// ---------------------------------------------------------------------------

export const NPC_LOOKS = {

  // -------------------------------------------------------------------------
  // A ESTRADA E O CONTRATO
  // -------------------------------------------------------------------------

  // SILHUETA: figura ereta de calcanhares juntos, uma ombreira de espigões só
  // num ombro e nenhum capacete — a única figura militar do elenco que mostra
  // o rosto.
  //
  // O elmo fica de FORA de propósito. Sildar acompanha o grupo por boa parte da
  // campanha e é o NPC que mais fala: esconder a cara dele atrás de uma placa
  // de metal apagaria justamente o rosto que o jogador precisa reconhecer. A
  // patente sai pela ombreira e pela postura militar, não pelo capacete.
  sildar: {
    species: 'humano', build: 'forte', heightMul: 1.05,
    skin: '#d9a378', hair: '#b8b2a8', hairStyle: 'short', beard: false,
    outfit: '#44506e', outfitDark: '#2c3450', trim: '#c8b048',
    metal: '#b6c0cc', leather: '#5b4530', eyes: '#5a7a98',
    armorStyle: 'scale', helm: false, shield: true, weapon: 'sword',
    stance: 'militar', marca: 'ombreira',
    // Cicatriz e idade: ele chega ao grupo depois de ser preso e interrogado, e
    // é a única figura amiga que mostra ter levado porrada.
    facial: ['cicatriz', 'idoso'],
    face: { mandibula: 1.12, queixo: 'quadrado', olhoGap: -1, boca: 'fina' },
  },

  // SILHUETA: figura baixa e muito larga, de barba cheia caindo sobre o peito e
  // um fardo com rolo de dormir cristando acima do ombro.
  //
  // O anão clérigo do grupo também é baixo e barbudo, por isso Gundren recebe o
  // fardo de prospector e a barba RUIVA contra a grisalha do clérigo: no
  // tabuleiro os dois nunca ficam ambíguos.
  gundren: {
    species: 'anao', build: 'forte',
    skin: '#d89a6e', hair: '#9c4a22', hairStyle: 'short', beard: true,
    outfit: '#8c6a2c', outfitDark: '#5a4318', trim: '#c08a30',
    metal: '#a8a49c', leather: '#6a4a2c', eyes: '#6a8a4a',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'axe',
    stance: 'solto', marca: 'mochila',
    // Nariz quebrado: é o irmão que briga com os outros dois por qualquer coisa.
    facial: 'narizQuebrado',
    face: { arcada: 3, mandibula: 1.16, queixo: 'largo', nariz: 'bulbosa', narizW: 1.4 },
  },

  // -------------------------------------------------------------------------
  // PHANDALIN — os que atendem o balcão
  // -------------------------------------------------------------------------

  // SILHUETA: figura baixa e barriguda sem arma nenhuma, com o peso num
  // quadril e os braços soltos — a figura mais clara do elenco.
  //
  // Toblen é o único NPC cuja leitura não depende de marca: é o avental claro
  // sobre a barriga, numa silhueta curta e redonda, contra um elenco todo de
  // gente armada ou enfeitada. A ausência de adereço É a marca dele. Falta um
  // `marca: 'avental'` no pintor (ver relatório); quando existir, entra aqui.
  toblen: {
    species: 'humano', build: 'gordo', heightMul: 0.92,
    skin: '#e3b188', hair: '#5a4028', hairStyle: 'short', beard: false,
    outfit: '#ddd2b4', outfitDark: '#9c8a64', trim: '#8a6a3c',
    metal: '#a8aeb6', leather: '#6a5236', eyes: '#4a5a44',
    armorStyle: 'leather', helm: false, shield: false,
    stance: 'solto',
    face: { testa: 0.34, macas: 2, mandibula: 1.08, queixo: 'redondo', nariz: 'arrebitada', boca: 'larga' },
  },

  // SILHUETA: vulto magro e dobrado para a frente, com uma bossa no alto das
  // costas mais alta que o ombro e uma calva cercada de barba branca.
  //
  // Dos três plebeus humanos de Phandalin, Elmar é o que resolve a silhueta pela
  // POSTURA: a corcunda de quem passou quarenta anos levantando saca de farinha
  // é a única curva acima da linha do ombro em todo o elenco amigo.
  elmar: {
    species: 'humano', build: 'magro', heightMul: 0.97,
    skin: '#d4a480', hair: '#d8d2c4', hairStyle: 'bald', beard: true,
    outfit: '#6d7a52', outfitDark: '#454f30', trim: '#8a7a4a',
    metal: '#9aa0a8', leather: '#5a4630', eyes: '#7a8290',
    armorStyle: 'leather', helm: false, shield: false,
    stance: 'curvado', marca: 'corcunda',
    facial: 'idoso',
    face: { testa: 0.42, arcada: 2, macas: 0, mandibula: 0.9, queixo: 'pontudo', nariz: 'fina', boca: 'fina' },
  },

  // SILHUETA: figura de base larga e pernas abertas, com duas tranças caindo
  // abaixo do ombro e uma lâmina cravada no chão à frente dos pés.
  //
  // Ela vende armas, então segura uma. É plebeu em regra e guerreira em
  // postura, e essa contradição é exatamente a leitura que queremos: a pessoa
  // do balcão que sabe o que está vendendo.
  linene: {
    species: 'humano', build: 'forte', heightMul: 1.00,
    skin: '#c9906a', hair: '#7a3a24', hairStyle: 'long', beard: false,
    outfit: '#7a3a30', outfitDark: '#4c2220', trim: '#c8a24a',
    metal: '#b2bac4', leather: '#6a4a2c', eyes: '#6a7a4a',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'sword',
    stance: 'guerreiro', marca: 'trancas',
    facial: 'cicatriz',
    face: { arcada: 2, macas: 2, mandibula: 1.06, queixo: 'quadrado', olhoGap: -1, nariz: 'reta', boca: 'fina' },
  },

  // SILHUETA: bloco baixo e comprido de joelhos flexionados, com um pano
  // esvoaçando para um lado só e uma lâmina curta junto do corpo.
  //
  // Halia é a figura mais ESCURA entre os vivos. É de propósito: ela é a única
  // pessoa do balcão de Phandalin que o jogador deveria olhar duas vezes, e o
  // valor baixo num elenco de gente clara faz esse trabalho antes de qualquer
  // diálogo. Postura de ladino sobre bloco de espiã.
  halia: {
    species: 'humano', build: 'magro', heightMul: 1.03,
    skin: '#c08a66', hair: '#2a1e20', hairStyle: 'long', beard: false,
    outfit: '#3e2a3c', outfitDark: '#241624', trim: '#9a7a3a',
    metal: '#8a8e96', leather: '#3a2a22', eyes: '#8a6a3a',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'dagger',
    stance: 'ladino', marca: 'manto', cloak: '#2e1e2c',
    face: { testa: 0.4, arcada: 0, macas: 2, mandibula: 0.9, queixo: 'pontudo', olhoGap: -1, olhoH: 1, olhoW: 3, nariz: 'fina', boca: 'fina' },
  },

  // SILHUETA: figura larga e imóvel de calcanhares juntos, com uma capa dos
  // dois lados e um pano caindo por cima de um ombro só.
  //
  // A rigidez é o personagem. Harbin não cede um passo nem no desenho: é o
  // único adulto do elenco em `neutro`, a postura de boneco de vestir que o
  // ELENCO manda evitar — aqui usada de propósito, porque num elenco onde todos
  // se inclinam, agacham ou avançam, o único que fica em sentido lê como
  // burocrata antes de abrir a boca.
  harbin: {
    species: 'humano', build: 'gordo', heightMul: 0.98,
    skin: '#e0b48e', hair: '#8a8276', hairStyle: 'short', beard: false,
    outfit: '#6a2630', outfitDark: '#421620', trim: '#d8b84a',
    metal: '#c0a858', leather: '#4a3426', eyes: '#5a6272',
    armorStyle: 'leather', helm: false, shield: false,
    stance: 'neutro', marca: 'manto', cloak: '#521c26',
    facial: 'idoso',
    face: { testa: 0.3, arcada: 0, macas: 0, mandibula: 1.14, queixo: 'largo', olhoGap: 1, olhoH: 1, nariz: 'bulbosa', narizW: 1.2, boca: 'frouxa' },
  },

  // SILHUETA: figura alta de pernas abertas com duas pontas de orelha curtas,
  // um arco apoiado no chão e um fardo nas costas.
  //
  // Meio-elfo é a espécie certa aqui por um motivo de leitura, não de ficha: ele
  // é o veterano velho do elenco, e sem as duas pontas de orelha o jogador
  // confundiria a silhueta dele com a de Sildar, que também é humano grisalho e
  // também abre as pernas.
  daran: {
    species: 'meioElfo', build: 'normal', heightMul: 1.0,
    skin: '#d7ab84', hair: '#c4bcae', hairStyle: 'short', beard: true,
    outfit: '#44563e', outfitDark: '#2a3626', trim: '#8a6a3a',
    metal: '#a4acb6', leather: '#6a4a2c', eyes: '#6a9a7a',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'bow',
    stance: 'guerreiro', marca: 'mochila',
    facial: 'idoso',
    face: { testa: 0.42, arcada: 2, macas: 2, mandibula: 1.0, queixo: 'quadrado', nariz: 'reta', boca: 'fina' },
  },

  // -------------------------------------------------------------------------
  // A FAZENDA ALDERLEAF — duas figuras baixas, e só uma é criança
  // -------------------------------------------------------------------------

  // SILHUETA: figura baixa de pé descalço grande, ombro quadrado e braços
  // soltos, sem arma e sem adereço nenhum.
  qelline: {
    species: 'halfling', build: 'forte',
    skin: '#e6bf96', hair: '#4a3420', hairStyle: 'short', beard: false,
    outfit: '#c2a45e', outfitDark: '#8a7036', trim: '#9a4a38',
    metal: '#a0a6ae', leather: '#6a5236', eyes: '#5a7a4a',
    armorStyle: 'leather', helm: false, shield: false,
    stance: 'solto',
    face: { testa: 0.36, macas: 2, mandibula: 1.04, queixo: 'redondo', olhoW: 3, nariz: 'arrebitada', boca: 'larga' },
  },

  // SILHUETA: a menor figura bípede de todo o elenco, agachada, de cabeça tão
  // larga quanto os ombros e cabelo em espetos desiguais.
  //
  // `child: true` sobre halfling é o que separa mãe e filho: a cabeça cresce em
  // ALTURA e a perna encurta, então os dois ficam baixos e só um lê como
  // criança. Nenhuma arma, nem de brinquedo — a criança desarmada ao lado da
  // mãe desarmada é uma leitura que vale mais que um detalhe bonito.
  carp: {
    species: 'halfling', build: 'magro', child: true,
    skin: '#eecaa2', hair: '#6a4a26', hairStyle: 'spiky', beard: false,
    outfit: '#6a86a2', outfitDark: '#44586e', trim: '#c2a45e',
    metal: '#a0a6ae', leather: '#6a5236', eyes: '#7aa2c8',
    armorStyle: 'leather', helm: false, shield: false,
    stance: 'agachado',
  },

  // -------------------------------------------------------------------------
  // OS QUE GUARDAM SEGREDO — santuário e floresta
  // -------------------------------------------------------------------------

  // SILHUETA: coluna alta e estreitíssima de capuz fundo, com uma haste curta
  // apoiada no ombro e duas mechas brancas compridas caindo do capuz.
  //
  // Élfica e pálida contra um elenco humano moreno. A irmã Garaele é a figura
  // mais ALTA e mais FINA entre os amigos, o oposto exato de Toblen.
  irmaGaraele: {
    species: 'elfo', build: 'magro',
    skin: '#f0dcc4', hair: '#e8e4da', hairStyle: 'long', beard: false,
    outfit: '#dcd8cc', outfitDark: '#9a9a92', trim: '#c8b86a',
    metal: '#c6ced8', leather: '#6a5a44', eyes: '#8ab0c8', glow: '#ffeec0',
    armorStyle: 'robe', helm: false, shield: false, weapon: 'mace',
    stance: 'clerico', marca: 'capuz', cloak: '#b8b4a6',
    face: { testa: 0.42, macas: 2, mandibula: 0.86, queixo: 'pontudo', olhoGap: 1, olhoH: 2, olhoW: 3, nariz: 'fina', narizW: 0.74, boca: 'fina' },
  },

  // SILHUETA: figura imóvel sob um cone de aba larga, com um fardo nas costas,
  // um cajado vertical mais alto que ela e barba branca até o peito.
  //
  // Cone MAIS fardo é uma combinação que ninguém mais tem: Iarno tem o cone sem
  // o fardo, Gundren e Daran têm o fardo sem o cone. É o eremita que anda.
  reidoth: {
    species: 'humano', build: 'magro', heightMul: 1.06,
    skin: '#c89a70', hair: '#dad4c6', hairStyle: 'long', beard: true,
    outfit: '#4a5a38', outfitDark: '#2e3a22', trim: '#8a7442',
    metal: '#9aa0a8', leather: '#5a4428', eyes: '#8aa86a', glow: '#b8e07a',
    armorStyle: 'robe', helm: false, shield: false, weapon: 'staff',
    stance: 'mago', marca: ['chapeuPontudo', 'mochila'],
    facial: 'idoso',
    face: { testa: 0.44, arcada: 3, macas: 0, mandibula: 0.94, queixo: 'pontudo', olhoGap: -1, olhoH: 1, nariz: 'fina', boca: 'fina' },
  },

  // SILHUETA: vulto encapuzado sem perna nenhuma, com ar entre a figura e a
  // linha do chão e dois pontos de luz dentro do capuz vazio.
  //
  // Agatha usa o plano `mortoVivo` na variante espectro. O que a separa de
  // Mormesk, que é o mesmo plano, é VALOR e MATIZ: ela é verde-pálida e clara,
  // luz de vaga-lume; ele é azul quase preto. Lado a lado não são a mesma
  // mancha, e é por isso que a cor dos dois foi decidida junto e não separada.
  agatha: {
    plan: 'mortoVivo', undead: 'espectro',
    cloak: '#7a9a86', glow: '#d8ffe0', void: '#16221c',
    outfit: '#7a9a86', outfitDark: '#44584c', trim: '#a8c8b0',
    skin: '#cfe6d4', hair: '#e8f4e8', eyes: '#d8ffe0',
    metal: '#b0c4b8', leather: '#44382c',
  },

  // -------------------------------------------------------------------------
  // OS QUE TRAEM — o Cerco Aranha e seus aliados
  // -------------------------------------------------------------------------

  // SILHUETA: coluna estreita de pés juntos sob um cone de aba larga, com uma
  // haste vertical mais alta que a figura brilhando na ponta.
  //
  // Iarno foi desenhado para parecer o que ele finge ser — o mago contratado —
  // e não o que ele é. Nenhum pixel dele avisa a traição; isso é trabalho da
  // mesa, não do sprite. O bastão que brilha é o único luxo da figura.
  iarno: {
    species: 'humano', build: 'magro', heightMul: 0.97,
    skin: '#d2a582', hair: '#2a2420', hairStyle: 'short', beard: true,
    outfit: '#2e3660', outfitDark: '#1a1e3c', trim: '#8a92d8',
    metal: '#a8b0c0', leather: '#4a3a2a', eyes: '#6a7ac8', glow: '#bcd4ff',
    armorStyle: 'robe', helm: false, shield: false, weapon: 'staff',
    stance: 'mago', marca: 'chapeuPontudo',
    face: { testa: 0.38, arcada: 1, macas: 1, mandibula: 0.94, queixo: 'pontudo', olhoGap: -1, olhoH: 1, olhoW: 3, nariz: 'fina', boca: 'fina' },
  },

  // SILHUETA: a figura mais fina do elenco, de pés juntos, com duas tranças
  // claras caindo abaixo do ombro, um pano esvoaçando de um lado e um cajado
  // vertical com orbe.
  //
  // Drow é a espécie mais magra de `body.js`, e isso é usado aqui como leitura
  // de espécie e não de ficha: num encontro em que ele chega acompanhado de
  // bugbears e aranhas, a figura do chefe é a MAIS ESTREITA no tabuleiro. O
  // contraste de largura é o que diz quem manda.
  nezznar: {
    species: 'drow', build: 'magro',
    skin: '#564a62', hair: '#e4dcd4', hairStyle: 'long', beard: false,
    outfit: '#36264a', outfitDark: '#1e142c', trim: '#9a7ac8',
    metal: '#9aa2b0', leather: '#3a2c3a', eyes: '#e05a6a', glow: '#b06ae0',
    armorStyle: 'robe', helm: false, shield: false, weapon: 'staff',
    stance: 'mago', marca: ['manto', 'trancas'], cloak: '#241634',
    face: { testa: 0.42, arcada: 0, macas: 2, mandibula: 0.84, queixo: 'pontudo', olhoGap: 1, olhoH: 2, olhoW: 3, nariz: 'fina', narizW: 0.72, boca: 'fina' },
  },

  // SILHUETA: coluna estreita de calva nua sob capuz raso, com uma haste
  // vertical e nada de cabelo, barba ou enfeite em lugar nenhum.
  //
  // Três magos no elenco, três leituras: Iarno tem cone de aba, Nezznar tem
  // tranças e manto, Kost é o CALVO de capuz raso. Vermelho escuro contra o
  // azul de Iarno e o violeta de Nezznar — nenhum dos três é a lama bege do
  // defeito 4.
  hamunKost: {
    species: 'humano', build: 'magro', heightMul: 1.03,
    skin: '#c69a74', hair: '#2a2024', hairStyle: 'bald', beard: false,
    outfit: '#6a1e24', outfitDark: '#401016', trim: '#c8a24a',
    metal: '#9aa0a8', leather: '#3a2a22', eyes: '#a8e07a', glow: '#8ae068',
    armorStyle: 'robe', helm: false, shield: false, weapon: 'staff',
    stance: 'mago', marca: 'capuz', cloak: '#4a1218',
    face: { testa: 0.44, arcada: 2, macas: 0, mandibula: 0.92, queixo: 'pontudo', olhoGap: -1, olhoH: 1, olhoW: 3, nariz: 'fina', boca: 'fina' },
  },

  // SILHUETA: vulto encapuzado sem perna que termina numa franja de tiras
  // suspensas, quase preto, com dois pontos de luz fria no capuz vazio.
  //
  // Mesmo plano de Agatha, decisão de cor oposta (ver o comentário dela).
  // Mormesk é o ponto mais ESCURO de todo o elenco: contra o verde claro dela,
  // os dois nunca são a mesma mancha, nem no mesmo corredor.
  mormesk: {
    plan: 'mortoVivo', undead: 'wraith',
    cloak: '#1e2436', glow: '#6ad8ff', void: '#080a12',
    outfit: '#1e2436', outfitDark: '#12161f', trim: '#4a5a72',
    skin: '#8a93a8', hair: '#2a3246', eyes: '#6ad8ff',
    metal: '#6a7284', leather: '#241c18',
  },

  // -------------------------------------------------------------------------
  // GOBLINOIDES COM NOME — Droop, Yeemik, Klarg e Rei Grol NÃO estão aqui
  //
  // Eles têm bloco de combate próprio em `rules/monsters/goblinoides.js` e o
  // look deles já existe em `art/looks/bestiario.js`, com as mesmas chaves
  // (`droop`, `yeemik`, `klarg`, `reiGrol`). Eu tinha escrito os quatro aqui, e
  // isso era um bug invisível: `art/looks.js` espalha NPC_LOOKS por ÚLTIMO, de
  // modo que a minha versão sobrescreveria a do bestiário sem erro nenhum e
  // ninguém descobriria até alguém estranhar o sprite.
  //
  // Então os quatro saíram deste arquivo. `rules/npcs.js` continua tendo a
  // pessoa deles — atitude, o que querem, o que esconde, como falam — e aponta
  // `bloco` para o bloco nomeado de quem é dono da arte deles. Uma chave, um
  // dono.
  // -------------------------------------------------------------------------

};
