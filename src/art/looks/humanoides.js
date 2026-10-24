// LOOKS dos humanoides hostis com bloco do SRD.
//
// Ver ELENCO.md para o contrato completo do look e a escala em pixels.
// Pareia com o arquivo de mesma família em `rules/monsters/`: todo monstro de
// lá aponta um `look` daqui.
//
// CAMPOS DO LOOK
//   CORPO     species  humano|elfo|meioElfo|drow|anao|halfling|goblin|
//                      hobgoblin|bugbear|orc|ogro
//             build    magro|normal|forte|gordo
//             heightMul  ajuste fino de altura dentro da espécie (1 = padrão)
//             child    true: cabeça alta sobre perna curta (criança)
//             plan     nome de um plano corporal de `art/plans/`
//   CORES     skin, hair, outfit, outfitDark, trim, metal, leather, eyes,
//             glow, cloak, noseTint
//   ESTRUTURA hairStyle  spiky|long|short|bald|hood
//             armorStyle robe|leather|scale|plate
//             weapon     sword|dagger|mace|staff|bow|axe
//             helm, shield, beard, horns: boolean · ears: false esconde orelha
//   POSTURA   stance   neutro|solto|guerreiro|ladino|mago|clerico|agachado|
//                      militar|curvado|bruto      (ver POSTURAS em draw.js)
//   SILHUETA  marca    chapeuPontudo|cimeira|corcunda|manto|ombreira|capuz|
//                      trancas|mochila            (string ou lista)
//   ROSTO     facial   cicatriz|tapaOlho|pinturaGuerra|idoso|narizQuebrado
//             face     sobrescreve a estrutura da espécie (testa, arcada,
//                      macas, mandibula, queixo, olhoGap, olhoH/W, nariz,
//                      narizW, boca) — é o que separa cinco humanos
//
// A anatomia sai de `body.js` e o traço de `draw.js`. Aqui só entram dados.
//
// ---------------------------------------------------------------------------
// POR QUE CADA UM TEM POSTURA, MARCA E ROSTO PRÓPRIOS
//
// A 55 px de altura só a silhueta chega ao jogador. Dez humanos de ombro reto,
// mesma pose e mesmo marrom são uma mancha só — era o defeito mais caro do
// elenco. Aqui cada figura muda em TRÊS eixos ao mesmo tempo:
//
//   1. POSTURA  altera o contorno antes de qualquer detalhe
//   2. MARCA    um elemento que INVADE o contorno (capuz, cimeira, manto…)
//   3. VALOR    acólito e plebeu são claros, espião e drow quase preto;
//               o olho acha a figura certa pelo tom, não pela cor
//
// E um quarto eixo, pequeno mas barato: `heightMul`. Sem ele, treze humanos
// saem com EXATAMENTE 58 px — o cálculo de `body.js` está certo, mas um bando
// de bandidos de altura idêntica parece uma fileira de clones recortada do
// mesmo molde. Os ajustes abaixo ficam entre 0,95 e 1,06 (54 a 61 px), dentro
// da faixa "Médio" de ELENCO.md §3, e nunca substituem a postura: altura
// separa indivíduos da MESMA função, postura separa funções.
//
// Teste de aceitação (ELENCO.md §2): a frase de SILHUETA de cada entrada não
// pode servir para nenhuma outra. É por isso que ela está escrita ali, sem
// citar cor — se duas frases colidirem, a dupla ainda está errada.
// ---------------------------------------------------------------------------

export const HUMANOIDES_LOOKS = {

  // ---- bandidos ------------------------------------------------------------
  // Três looks para UM bloco de regra. Um bando de cinco bandidos saindo com a
  // mesma figura cinco vezes é o pior caso do teste da silhueta, e `makeMonster`
  // fixa um look por id — então a variedade tem de existir aqui.

  // SILHUETA: bloco baixo inclinado para a frente com uma ponta de capuz caída
  // atrás do ombro e nada subindo acima da cabeça.
  bandido: {
    species: 'humano', build: 'magro', heightMul: 0.96,
    skin: '#c99a6e', hair: '#3a2a1c', hairStyle: 'short',
    outfit: '#5c4a3a', outfitDark: '#3a2e24', trim: '#8a5a3a',
    metal: '#8e969e', leather: '#4a3524', eyes: '#6a5a3a',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'sword',
    stance: 'ladino', marca: 'capuz', cloak: '#3a2e24',
    facial: 'narizQuebrado',
    // Queixo estreito e olho fundo: cara de quem passa fome, não de soldado.
    face: { testa: 0.34, arcada: 2, macas: 0, mandibula: 0.90, queixo: 'pontudo', olhoH: 1 },
  },

  // SILHUETA: figura de pé com o peso num quadril e duas tranças caindo abaixo
  // do ombro, com um arco mais alto que o tronco ao lado do corpo.
  bandidoBesteiro: {
    species: 'humano', build: 'normal',
    skin: '#8f6a4a', hair: '#1f1a16', hairStyle: 'long',
    outfit: '#6a5f3a', outfitDark: '#403a22', trim: '#a8743a',
    metal: '#9aa2aa', leather: '#53402c', eyes: '#4a3a2a',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'bow',
    stance: 'solto', marca: 'trancas',
    face: { testa: 0.38, arcada: 1, macas: 2, mandibula: 0.96, queixo: 'redondo', olhoGap: 1 },
  },

  // SILHUETA: figura larga de barriga e ombro caído com um fardo nas costas e
  // um rolo passando acima do ombro, e duas pontas de orelha curtas.
  bandidoMachadeiro: {
    species: 'meioElfo', build: 'gordo', heightMul: 1.03,
    skin: '#d6a87c', hair: '#5a3a22', hairStyle: 'spiky', beard: true,
    outfit: '#4a5a4a', outfitDark: '#2e3a2e', trim: '#8a6a2a',
    metal: '#a0a8ae', leather: '#4a3828', eyes: '#7a6a3a',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'axe',
    stance: 'bruto', marca: 'mochila',
    facial: 'cicatriz',
    face: { arcada: 2, mandibula: 1.12, queixo: 'largo', nariz: 'bulbosa', narizW: 1.2, boca: 'frouxa' },
  },

  // SILHUETA: triângulo de base larga com UMA ombreira enorme só de um lado e
  // um pano esvoaçando para o lado oposto, com uma barra vertical cravada à
  // frente dos pés.
  capitaoBandido: {
    species: 'humano', build: 'forte', heightMul: 1.05,
    skin: '#c08858', hair: '#120f0e', hairStyle: 'long', beard: true,
    // Vinho e ouro: o único inimigo humano de cor saturada. O capitão tem de
    // ser achado no meio do bando antes de o jogador ler o nome.
    outfit: '#6e2230', outfitDark: '#41141d', trim: '#e0b445',
    metal: '#c2cad4', leather: '#45301f', eyes: '#d8a23a',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'sword',
    stance: 'guerreiro', marca: ['ombreira', 'manto'], cloak: '#55182a',
    facial: 'cicatriz',
    face: { testa: 0.32, arcada: 2, macas: 2, mandibula: 1.1, queixo: 'quadrado', olhoGap: -1, boca: 'fina' },
  },

  // ---- rufião, batedor, veterano -------------------------------------------

  // SILHUETA: trapézio pesado sobre pernas muito abertas com o CONTORNO LIMPO —
  // nada sai dele: sem elmo, sem fardo, sem pano, sem corcunda, só ombro caído
  // e crânio raspado afundado entre os ombros.
  //
  // É de propósito que ele não tem marca nenhuma. Num elenco em que todo mundo
  // quebra o contorno de algum jeito, ser o único liso é a leitura dele — e é o
  // que o separa do ogro, que é o outro trapézio de ombro caído e tem a bossa
  // nas costas.
  rufiao: {
    species: 'humano', build: 'gordo', heightMul: 1.02,
    skin: '#b07a50', hair: '#2a1f18', hairStyle: 'bald',
    outfit: '#7a6a4a', outfitDark: '#4a3f2c', trim: '#6a3a2a',
    metal: '#8a9298', leather: '#453222', eyes: '#5a4a3a',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'mace',
    stance: 'bruto',
    facial: ['narizQuebrado', 'cicatriz'],
    // Mandíbula que passa da arcada e boca frouxa: o rosto faz o trabalho que
    // o crânio raspado sozinho não faria contra o ogro, que também é careca.
    face: { testa: 0.28, arcada: 3, macas: 0, mandibula: 1.24, queixo: 'largo', projeta: 'mandibula', olhoGap: -2, olhoH: 1, boca: 'frouxa' },
  },

  // O Marcarrubra: o rufião com o manto escarlate encardido da gangue. A figura
  // de verdade é a folha do PixelLab (`folhas/marcarrubra`); esta só aparece
  // enquanto a folha carrega.
  marcarrubra: {
    species: 'humano', build: 'gordo', heightMul: 1.02,
    skin: '#b07a50', hair: '#2a1f18', hairStyle: 'bald',
    outfit: '#453222', outfitDark: '#2e2016', trim: '#842220',
    metal: '#8a9298', leather: '#453222', eyes: '#5a4a3a',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'sword',
    cloak: '#842220', stance: 'bruto', facial: ['narizQuebrado', 'cicatriz'],
  },

  // SILHUETA: bloco baixo e comprido com um fardo nas costas, um rolo acima do
  // ombro e um arco encostado na perna da frente.
  batedor: {
    species: 'humano', build: 'magro', heightMul: 0.97,
    skin: '#a87a52', hair: '#4a4030', hairStyle: 'short',
    // Verde-acinzentado frio: o batedor é o único do elenco humano que se
    // esconde de verdade, e a cor dele tem de brigar com a do bandido.
    outfit: '#3f5244', outfitDark: '#26332b', trim: '#7a8a5a',
    metal: '#98a0a6', leather: '#4a3c2a', eyes: '#8aa06a',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'bow',
    stance: 'ladino', marca: 'mochila',
    face: { testa: 0.4, arcada: 1, macas: 2, mandibula: 0.94, queixo: 'pontudo', olhoGap: 1, olhoW: 3, nariz: 'fina' },
  },

  // SILHUETA: triângulo largo de armadura rígida com uma lâmina reta cravada no
  // chão entre os pés e uma barba cobrindo o alto do peito.
  veterano: {
    species: 'humano', build: 'forte',
    skin: '#c69872', hair: '#9aa0a4', hairStyle: 'short', beard: true,
    // Aço azulado sobre pano escuro: valor alto no tronco, baixo nas pernas.
    // É o oposto do bandido, que é escuro em cima e claro embaixo.
    outfit: '#4a5260', outfitDark: '#2c323c', trim: '#8a6a3a',
    metal: '#b6c0cc', leather: '#4a3828', eyes: '#5a6a7a',
    armorStyle: 'plate', helm: false, shield: false, weapon: 'sword',
    stance: 'guerreiro',
    facial: ['cicatriz', 'idoso'],
    face: { testa: 0.3, arcada: 3, macas: 1, mandibula: 1.08, queixo: 'quadrado', olhoH: 1, boca: 'fina' },
  },

  // ---- conjuradores --------------------------------------------------------

  // SILHUETA: coluna estreita sob um cone alto de aba, com uma haste vertical
  // mais alta que a figura terminando num bulbo luminoso.
  mago: {
    species: 'humano', build: 'magro', heightMul: 1.02,
    skin: '#e2bc94', hair: '#c8ccd2', hairStyle: 'long', beard: true,
    outfit: '#352f68', outfitDark: '#1f1b44', trim: '#8e86d8',
    metal: '#a2aab8', leather: '#443726', eyes: '#8ab4e8', glow: '#a8c0ff',
    armorStyle: 'robe', helm: false, shield: false, weapon: 'staff',
    stance: 'mago', marca: 'chapeuPontudo', cloak: '#2a2550',
    facial: 'idoso',
    face: { testa: 0.44, arcada: 1, macas: 2, mandibula: 0.86, queixo: 'pontudo', olhoH: 1, nariz: 'fina', boca: 'fina' },
  },

  // HAMUN KOST, o Mago Vermelho do Poço da Coruja Velha. SILHUETA: corpo
  // robusto num manto vermelho comprido, cabeça raspada (sem chapéu: é o
  // contrário do mago genérico) e um bastão curto. A tatuagem da testa é
  // escura, pequena demais para o sprite: fica para o retrato.
  hamunKost: {
    species: 'humano', build: 'forte', heightMul: 1.0,
    skin: '#e8d2bc', hair: '#e8d2bc', hairStyle: 'bald', beard: false,
    outfit: '#8a1e1e', outfitDark: '#561010', trim: '#d4a63c',
    metal: '#a2aab8', leather: '#443726', eyes: '#3a2a1a', glow: '#9cff9c',
    armorStyle: 'robe', helm: false, shield: false, weapon: 'staff',
    stance: 'mago', cloak: '#6e1414',
    face: { testa: 0.5, arcada: 1, macas: 1, mandibula: 1, queixo: 'quadrado', olhoH: 1, nariz: 'larga', boca: 'fina' },
  },

  // SILHUETA: figura de veste lisa com a cabeça inteira dentro de um capuz
  // fechado, sem pescoço à vista e com as mãos vazias.
  acolito: {
    species: 'humano', build: 'normal', heightMul: 0.95,
    // Creme quase branco: o valor mais alto do elenco inimigo. Entre bandidos
    // escuros, o acólito é achado pelo brilho, não pelo desenho.
    skin: '#dcb288', hair: '#5a4a38', hairStyle: 'hood',
    outfit: '#d8cfb4', outfitDark: '#8e8468', trim: '#c8a24a',
    metal: '#a8b0b8', leather: '#6a5a44', eyes: '#6a7a5a', glow: '#ffeec0',
    armorStyle: 'robe', helm: false, shield: false, weapon: 'mace',
    stance: 'solto',
    face: { testa: 0.42, arcada: 0, macas: 2, mandibula: 0.94, queixo: 'redondo', olhoH: 2, olhoW: 3, nariz: 'arrebitada' },
  },

  // SILHUETA: figura de ombro largo e alto da cabeça nu, com um pano caindo só
  // de um lado até abaixo do quadril e uma haste curta apoiada no ombro.
  sacerdote: {
    species: 'humano', build: 'forte', heightMul: 0.99,
    skin: '#b4855c', hair: '#6a5a4a', hairStyle: 'bald',
    outfit: '#8a7f5e', outfitDark: '#554c36', trim: '#e8c654',
    metal: '#c8cdd4', leather: '#5a4632', eyes: '#7a6a4a', glow: '#ffe2a0',
    armorStyle: 'scale', helm: false, shield: false, weapon: 'mace',
    stance: 'clerico', marca: 'manto', cloak: '#6a5a2a',
    facial: 'idoso',
    face: { testa: 0.4, arcada: 2, macas: 1, mandibula: 1.02, queixo: 'largo', olhoGap: -1, nariz: 'bulbosa', narizW: 1.15 },
  },

  // ---- espião, plebeu, guarda ----------------------------------------------

  // SILHUETA: bloco baixo e inclinado, quase sem ombro, com um pano esvoaçando
  // para um lado e nada maior que um punho nas mãos.
  espiao: {
    species: 'humano', build: 'magro', heightMul: 0.96,
    // O mais escuro do elenco humano. Contra o acólito creme e o plebeu de
    // linho, o espião é um recorte preto — e isso basta para saber qual é.
    skin: '#9a7050', hair: '#16141a', hairStyle: 'short',
    outfit: '#2a2c34', outfitDark: '#161820', trim: '#5a5f6e',
    metal: '#8a9298', leather: '#2e2822', eyes: '#aab4c4',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'dagger',
    stance: 'ladino', marca: 'manto', cloak: '#1d1f26',
    face: { testa: 0.38, arcada: 1, macas: 2, mandibula: 0.9, queixo: 'pontudo', olhoGap: 1, olhoW: 3, nariz: 'fina', boca: 'fina' },
  },

  // SILHUETA: figura simétrica de linho claro, de mãos COMPLETAMENTE VAZIAS e
  // nada acima da cabeça — a única do elenco sem arma nenhuma no contorno.
  plebeu: {
    species: 'humano', build: 'normal', heightMul: 0.98,
    skin: '#d2a478', hair: '#6a5238', hairStyle: 'short', beard: true,
    outfit: '#bca882', outfitDark: '#786a50', trim: '#8a7a5a',
    metal: '#9aa0a6', leather: '#6a5440', eyes: '#5a4a38',
    armorStyle: 'leather', helm: false, shield: false,
    // `weapon` ausente de propósito: o pintor não desenha arma nenhuma, e um
    // civil de mão vazia entre dezesseis figuras armadas se lê de longe.
    stance: 'solto',
    face: { testa: 0.36, arcada: 1, macas: 1, mandibula: 1.0, queixo: 'redondo', nariz: 'bulbosa', narizW: 1.1, boca: 'larga' },
  },

  // SILHUETA: coluna de pés juntos com NADA acima do crânio e uma haste fina
  // fincada no chão ao lado, mais alta que a cabeça, com um disco no braço.
  //
  // `helm: false` resolve uma colisão: o hobgoblin de `bestiario.js` também é
  // coluna vertical de pés juntos, e tem crista acima do elmo. O guarda é a
  // mesma verticalidade com o alto da cabeça VAZIO e a quebra do contorno do
  // lado, não em cima. Pintados de preto, não são a mesma mancha.
  guarda: {
    species: 'humano', build: 'normal', heightMul: 1.01,
    skin: '#bd8c62', hair: '#3f3228', hairStyle: 'short',
    outfit: '#3a5068', outfitDark: '#22313f', trim: '#c0a24a',
    metal: '#aeb8c4', leather: '#4a3a28', eyes: '#6a7280',
    armorStyle: 'scale', helm: false, shield: true,
    // Lança: o pintor só tem `staff`, e `staff` com `glow` ausente sai como
    // haste de madeira com cabeça de metal — lê como lança fincada. Pedido de
    // um caso `spear` está no relatório.
    weapon: 'staff',
    stance: 'militar',
    face: { testa: 0.34, arcada: 2, macas: 1, mandibula: 1.04, queixo: 'quadrado', olhoH: 1, boca: 'reta' },
  },

  // ---- nobre e cavaleiro ---------------------------------------------------

  // SILHUETA: coluna simétrica e imóvel, de calcanhares juntos, com uma capa
  // FECHADA caindo atrás dos dois ombros até abaixo do quadril.
  nobre: {
    species: 'humano', build: 'normal', heightMul: 1.03,
    skin: '#e8c29c', hair: '#4a2c1a', hairStyle: 'long',
    outfit: '#5a2a5e', outfitDark: '#38193c', trim: '#f0cc58',
    metal: '#d0d8e2', leather: '#5a3a28', eyes: '#4a5a3a',
    armorStyle: 'plate', helm: false, shield: false, weapon: 'sword',
    // `cloak` em vez de `marca: 'manto'`: a capa é simétrica e não invade o
    // contorno de um lado só. A imobilidade é a leitura do nobre — ele é o
    // único que fica em `neutro`, e isso o separa do capitão, que também tem
    // ouro e também é vistoso.
    stance: 'neutro', cloak: '#6e2f72',
    face: { testa: 0.4, arcada: 0, macas: 2, mandibula: 0.92, queixo: 'pontudo', olhoGap: 1, nariz: 'reta', narizW: 0.85, boca: 'fina' },
  },

  // SILHUETA: triângulo de base larga encimado por uma crista alta de frente
  // para trás, com um disco no braço e uma lâmina cravada entre os pés.
  cavaleiro: {
    species: 'humano', build: 'forte', heightMul: 1.06,
    skin: '#d8ab82', hair: '#8a7a5a', hairStyle: 'short',
    outfit: '#8e96a4', outfitDark: '#5a6270', trim: '#c23a3a',
    metal: '#dde4ee', leather: '#4a3828', eyes: '#5a7a9a',
    armorStyle: 'plate', helm: true, shield: true, weapon: 'sword',
    stance: 'guerreiro', marca: 'cimeira', cloak: '#a82f2f',
    face: { testa: 0.34, arcada: 2, macas: 2, mandibula: 1.06, queixo: 'quadrado', boca: 'reta' },
  },

  // ---- drow e ogro ---------------------------------------------------------

  // SILHUETA: figura alta e fina de ombro estreito com duas pontas de orelha
  // longas, cabelo caindo dos dois lados abaixo do ombro e uma ponta de capuz
  // atrás.
  drow: {
    species: 'drow', build: 'magro',
    skin: '#4a4258', hair: '#dcd4e4', hairStyle: 'long',
    outfit: '#241f30', outfitDark: '#14111d', trim: '#7a5fa8',
    metal: '#8e86a8', leather: '#2a2230', eyes: '#e05a4a', glow: '#b48aff',
    armorStyle: 'scale', helm: false, shield: false, weapon: 'sword',
    stance: 'militar', marca: 'capuz', cloak: '#1a1626',
    // Cabelo claro sobre pele escura é a inversão de valor de todo o resto do
    // elenco: a cabeça do drow aparece como um ponto claro no alto da figura.
    face: { testa: 0.42, arcada: 0, macas: 2, mandibula: 0.86, queixo: 'pontudo', olhoGap: 1, olhoH: 2, olhoW: 3, nariz: 'fina', boca: 'fina' },
  },

  // SILHUETA: massa oval pendendo à frente sobre pernas curtas e enfaixadas,
  // com uma corcunda mais alta que a cabeça e as mãos à altura do joelho.
  //
  // A versão anterior era um trapézio de ombro largo e musculoso. Está errado:
  // assim ele é um humano aumentado, e o elenco já tem três trapézios de ombro
  // caído (orc, rufião, Rei Grol) — pintados de preto, os quatro eram a mesma
  // mancha, que é o defeito mais caro de ELENCO.md.
  //
  // O ogro é uma PANÇA COM PERNINHAS: a barriga é a maior massa do corpo e
  // pende à frente, a corcunda sobe acima da cabeça, a cabeça é pequena e
  // está afundada abaixo da linha dos ombros, e os braços são tão longos que
  // as mãos chegam perto do chão. A anatomia disso está em `body.js`; aqui só
  // entram a tinta e os trapos.
  ogro: {
    species: 'ogro', build: 'normal',
    // Amarelado pálido, quase creme doentio, e LISO — nada de pelo. Entre o
    // verde frio do goblin, o laranja do hobgoblin e o fulvo do bugbear, o
    // ogro é o único claro: no tabuleiro ele é a mancha pálida e grande.
    // TRÊS VALORES, não um. A primeira tentativa pintou cabeça, barriga e
    // braços no mesmo creme e a figura virou uma mancha sem membros: a 45 px
    // não sobrava nada além de uma bola. Agora a barriga é o mais claro (ela
    // é a massa e tem de receber a luz), a cabeça e os braços são um degrau
    // mais escuros e as pernas mais ainda — o olho encontra as peças.
    skin: '#c2a677', hair: '#6a583e', hairStyle: 'bald',
    outfit: '#e2d1a6', outfitDark: '#a08a62', sleeve: '#c2a677',
    trim: '#a8926a', metal: '#8e8a84', leather: '#73653f', cabo: '#6a5230',
    eyes: '#e8c84a',
    helm: false, shield: false, weapon: 'clava',
    // Trapos na cintura (saiote), tiras de pano enroladas nas canelas e nos
    // antebraços (faixas), pés descalços e unha grossa escura. Nenhuma peça
    // de armadura: o ogro não fabrica nada, ele veste o que sobrou.
    marca: ['corcunda', 'saiote'], faixas: true, descalco: true,
    garras: true, unha: '#4a3c2c',
    // Olho minúsculo e amarelo sob uma arcada pesada, nariz chato, e uma
    // BOCARRA que toma o resto da cara. A 45 px o rosto do ogro é a boca.
    face: { testa: 0.30, arcada: 3, macas: 0, mandibula: 1.16, queixo: 'largo', projeta: 'mandibula', olhoGap: -1, olhoH: 1, olhoW: 2, nariz: 'chata', narizW: 1.15, boca: 'escancarada' },
  },

};
