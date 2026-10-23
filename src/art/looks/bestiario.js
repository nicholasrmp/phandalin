// LOOKS do bestiário goblinoide: goblin, hobgoblin, bugbear e os chefes
// nomeados da campanha.
//
// Pareia com `rules/monsters/goblinoides.js`: todo monstro de lá aponta um
// `look` daqui.
//
// CAMPOS DO LOOK
//   CORPO     species  humano|elfo|anao|halfling|goblin|hobgoblin|bugbear|orc|...
//             build    magro|normal|forte|gordo
//             heightMul  ajuste fino de altura dentro da espécie (1 = padrão)
//             plan     nome de um plano corporal de `art/plans/` para quem não
//                      é humanoide (aracnideo, gosma, mortoVivo, dragao, ...)
//   CORES     skin, hair, outfit, outfitDark, trim, metal, leather, eyes,
//             glow, cloak, noseTint
//   ESTRUTURA hairStyle  spiky|long|short|bald|hood
//             armorStyle robe|leather|scale|plate
//             weapon     sword|dagger|mace|staff|bow|axe
//             helm, shield, beard, horns: boolean
//   SILHUETA  stance   neutro|solto|guerreiro|ladino|mago|clerico|agachado|
//                      militar|curvado|bruto   (postura; sem isto vale a da espécie)
//             marca    corcunda|mochila|manto|trancas|capuz|chapeuPontudo|
//                      cimeira|ombreira   (string ou lista; invade o contorno)
//             facial   cicatriz|tapaOlho|pinturaGuerra|idoso|narizQuebrado
//             face     sobrescreve a estrutura de rosto da espécie
//
// A anatomia sai de `body.js` e o traço de `draw.js`. Aqui só entram dados.
//
// ---------------------------------------------------------------------------
// O TESTE DA SILHUETA
//
// No tabuleiro a figura tem ~45 px de altura e só o contorno chega ao jogador.
// Então cada look abaixo traz, no comentário, UMA frase descrevendo a silhueta
// SEM citar cor. Se a frase servir para outro look deste arquivo, o look não
// está pronto. Era exatamente o defeito do par goblin / chefe goblin: dois
// pixels de altura e um elmo, e de longe o jogador via o mesmo boneco duas
// vezes. Agora eles não compartilham postura, nem marca, nem rosto.
//
// A PALETA TAMBÉM SEPARA
//
// O bando todo em marrom-verde-bege no mesmo valor virava uma mancha só. Os
// goblinoides estão distribuídos por matiz de propósito: goblin em verde frio
// e pano apagado, chefe goblin em carmim e ouro, hobgoblin em aço azul com
// latão, bugbear em ruivo sobre peles quase negras, Klarg descorado em osso,
// Rei Grol no valor mais escuro de todo o elenco.
//
// A ESCALA MEDIDA (de `body.js`, não estimada)
//
//   look         corpo  ombro   faixa de ELENCO.md
//   droop          39     12     pequeno 38–45
//   goblin         41     12     pequeno
//   yeemik         41     15     pequeno
//   goblinBoss     43     15     pequeno
//   hobgoblin      64     22     médio 52–66
//   bugbear/klarg  69     24     grande 66–75
//   reiGrol        69     27     grande
//
// A escada de OMBRO é o que dá sentido de tamanho no tabuleiro: o bugbear é
// mais largo que o hobgoblin, e o Rei Grol é mais largo que o bugbear. Altura
// sozinha não resolve, porque a figura agachada fica mais baixa que o corpo.
// ---------------------------------------------------------------------------

export const BESTIARIO_LOOKS = {

  // SILHUETA: cunha baixa de cabeça adiantada além dos ombros, com uma bossa
  // nas costas mais alta que a linha do ombro e nada subindo acima do crânio.
  //
  // A corcunda é a marca dele. Sem ela o goblin era só "humanoide pequeno", o
  // que também descreve o halfling do grupo.
  goblin: {
    species: 'goblin', build: 'magro',
    stance: 'agachado', marca: 'corcunda',
    skin: '#6b8257', hair: '#3a4026', hairStyle: 'bald',
    outfit: '#5d5a4a', outfitDark: '#3d3b30', trim: '#cfc2a2',
    metal: '#8e969e', leather: '#4e4132', eyes: '#d8b43a',
    armorStyle: 'leather', helm: false, shield: true, weapon: 'sword',
  },

  // SILHUETA: figura baixa mas ERETA, pés juntos e ombro reto, com uma lâmina
  // de crista subindo acima da cabeça e um pano caindo de um lado só.
  //
  // O oposto exato do goblin raso: ele se põe de pé para ser visto. Postura
  // militar + cimeira + manto fazem três quebras de contorno que o goblin não
  // tem, e é isso que resolve o par — não o elmo.
  goblinBoss: {
    species: 'goblin', build: 'normal', heightMul: 1.08,
    stance: 'militar', marca: ['cimeira', 'manto'], facial: 'pinturaGuerra',
    face: { arcada: 2, mandibula: 0.95, boca: 'presas' },
    skin: '#7d9460', hair: '#2f3a20', hairStyle: 'spiky',
    outfit: '#8a2f2f', outfitDark: '#4a1818', trim: '#e0b84a',
    metal: '#c0c8d2', leather: '#5a4630', eyes: '#ff6a2a',
    armorStyle: 'scale', helm: true, shield: true, weapon: 'sword',
    cloak: '#6a2020',
  },

  // SILHUETA: coluna vertical de ombro muito largo e pés colados, com uma
  // crista correndo de frente para trás no alto do elmo.
  //
  // O hobgoblin é o soldado: o que o identifica é a VERTICALIDADE. Entre os
  // goblinoides é o único cujo contorno é mais alto que largo.
  //
  // Com a cimeira o contorno chega a 73 px dos 75 úteis da célula, enquanto o
  // CORPO fica em 64 (médio, dentro da faixa). Sobram 2 px no alto, que é
  // exatamente o que o contorno automático de `sheet.js` precisa — não acumule
  // outra marca alta nele sem medir de novo.
  hobgoblin: {
    species: 'hobgoblin', build: 'normal',
    stance: 'militar', marca: 'cimeira',
    skin: '#c0714a', hair: '#4a1f18', hairStyle: 'spiky', noseTint: '#6a5a86',
    outfit: '#333f52', outfitDark: '#1f2733', trim: '#c8a84a',
    metal: '#aeb6c2', leather: '#5a4630', eyes: '#ff8a2a',
    armorStyle: 'plate', helm: true, shield: true, weapon: 'sword',
  },

  // SILHUETA: pêra invertida de ombros arredondados e caídos, cabeça afundada
  // entre eles e dois braços descendo abaixo do quadril.
  //
  // A postura `curvado` da espécie dá braço de 7 px extra: é o que separa o
  // bugbear do ogro, que também é largo e também tem ombro caído.
  bugbear: {
    species: 'bugbear', build: 'normal',
    skin: '#8a5a38', hair: '#5a2a18', hairStyle: 'spiky',
    outfit: '#2f3a2e', outfitDark: '#1d241d', trim: '#8a6a2a',
    metal: '#8e8678', leather: '#4a3a28', eyes: '#d8a23a',
    armorStyle: 'leather', helm: false, shield: true, weapon: 'mace',
  },

  // SILHUETA: a mesma pêra invertida, rompida de um lado por um bloco de
  // espigões que passa acima da linha do ombro.
  //
  // Klarg é um bugbear e tem de LER como bugbear — mesma postura, mesma
  // proporção. A ombreira assimétrica é a única coisa que o separa de longe, e
  // basta: nenhuma outra figura do bando tem contorno quebrado de um só lado.
  // A tinta de guerra clara sobre pelo descorado tira ele do ruivo do bugbear
  // comum, que é o segundo jeito de reconhecê-lo.
  klarg: {
    species: 'bugbear', build: 'normal',
    marca: 'ombreira', facial: 'pinturaGuerra',
    face: { mandibula: 1.05, queixo: 'largo' },
    skin: '#8e7f6a', hair: '#6a5f4e', hairStyle: 'spiky',
    outfit: '#3a3330', outfitDark: '#241f1d', trim: '#e4ddc8',
    metal: '#8a8276', leather: '#4a4038', eyes: '#f0e2a0',
    armorStyle: 'leather', helm: false, shield: true, weapon: 'mace',
  },

  // SILHUETA: o maior volume de ombro do bando, com uma bossa cristando entre
  // as costas e dois chifres saindo acima da cabeça.
  //
  // Chefe final desta linha: ele é o mais LARGO (ombro de 27 px, contra 24 do
  // bugbear comum e 22 do hobgoblin) e o mais escuro em valor. O tapa-olho é a
  // leitura de perto; os chifres e a bossa são a leitura de longe. Contra
  // Klarg, que é o outro bugbear nomeado, a diferença é o lado do contorno que
  // se rompe: Klarg quebra o ombro, Grol quebra as costas e o alto da cabeça.
  //
  // NÃO use `marca: 'manto'` nele: com 27 px de ombro o pano de `draw.js` sai
  // da célula (ver relatório). `cloak` simétrico também ficou fora — encheria
  // o contorno em vez de quebrá-lo, e é a bossa que tem de ser vista.
  reiGrol: {
    species: 'bugbear', build: 'forte',
    marca: 'corcunda', facial: ['tapaOlho', 'cicatriz'], horns: true,
    face: { arcada: 3, olhoGap: -1, boca: 'presas' },
    skin: '#574a52', hair: '#2e262c', hairStyle: 'spiky',
    outfit: '#3a3340', outfitDark: '#221d26', trim: '#b0362f',
    metal: '#6e7482', leather: '#3e3430', eyes: '#ff3a2a',
    armorStyle: 'scale', helm: false, shield: false, weapon: 'axe',
  },

  // SILHUETA: tronco torcido de três quartos sobre joelho dobrado, arma junto
  // ao corpo e uma ponta de capuz caída para trás da cabeça.
  //
  // Yeemik quer o posto do chefe e não enfrenta ninguém de frente: postura de
  // ladino, não militar. Contra o chefe goblin ereto, é a diferença entre uma
  // coluna e uma vírgula.
  yeemik: {
    species: 'goblin', build: 'normal', heightMul: 1.03,
    stance: 'ladino', marca: 'capuz', facial: 'cicatriz',
    face: { olhoGap: 1, queixo: 'pontudo', boca: 'fina' },
    skin: '#8c9a4e', hair: '#3a4026', hairStyle: 'bald',
    outfit: '#2e4a4a', outfitDark: '#1c2e2e', trim: '#b08a3a',
    metal: '#9aa0a8', leather: '#4a3e2e', eyes: '#cfe03a',
    armorStyle: 'scale', helm: false, shield: true, weapon: 'dagger',
    cloak: '#24383a',
  },

  // SILHUETA: a menor figura do elenco, de ombros caídos e braços pendurados,
  // com um rolo de fardo atravessado acima da cabeça.
  //
  // Droop carrega o fardo do bando. Ele usa a postura `curvado` do bugbear num
  // corpo de 38 px — braço longo em figura minúscula é um contorno que nenhuma
  // outra criatura do bando produz, e a mochila põe massa onde ninguém mais
  // tem.
  droop: {
    species: 'goblin', build: 'magro', heightMul: 0.97,
    stance: 'curvado', marca: 'mochila', facial: 'narizQuebrado',
    face: { testa: 0.40, olhoH: 2, olhoW: 3, boca: 'frouxa' },
    skin: '#7e8f72', hair: '#3a4026', hairStyle: 'bald',
    outfit: '#4a4036', outfitDark: '#2e2821', trim: '#7a6a52',
    metal: '#86898c', leather: '#5a4a36', eyes: '#c8b878',
    armorStyle: 'leather', helm: false, shield: true, weapon: 'sword',
  },

  // O orc não é goblinoide e este arquivo é dos goblinoides. Ele está aqui por
  // herança — `dev/char-styles-preview.js` já o chama pela chave `orc` — e o
  // lugar dele é `looks/humanoides.js`, com os outros humanoides hostis de
  // bloco SRD. Fica até o dono daquele arquivo levá-lo; nenhuma criatura nova
  // de outra família entra aqui.
  orc: {
    species: 'orc', build: 'normal',
    marca: 'trancas',
    skin: '#7d8a74', hair: '#1a1612', hairStyle: 'spiky',
    outfit: '#5a4a38', outfitDark: '#3a2f24', trim: '#8a3a2a',
    metal: '#a0a8b0', leather: '#5a4630', eyes: '#d84a3a',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'axe',
  },

};
