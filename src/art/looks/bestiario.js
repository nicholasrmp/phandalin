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
  //
  // A PELE SAIU DO CINZA-VERDE PARA O MOSTARDA. O verde apagado era a cor mais
  // próxima do piso de pedra do tabuleiro, e uma criatura da cor do chão é uma
  // criatura que o jogador não vê. O mostarda encosta no tan do bugbear
  // (`#bd8a46`), e é de propósito que não se resolve por cor: os dois se
  // separam por TAMANHO e silhueta — o bugbear é quase o dobro, tem orelha de
  // tufo e cabelo em espetos, o goblin é baixo, corcunda e de orelha caída.
  // Resolver no matiz custaria o mostarda dos dois.
  goblin: {
    species: 'goblin', build: 'magro',
    stance: 'agachado', marca: ['corcunda', 'ombreira'],
    skin: '#c0a046', hair: '#21201b', hairStyle: 'juba',
    outfit: '#4a4036', outfitDark: '#2e2822', trim: '#8a7a52',
    metal: '#9aa2ab', leather: '#4a3726', eyes: '#e8720f',
    armorStyle: 'leather', helm: false, shield: true, weapon: 'scimitar',
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

  // SILHUETA: bloco baixo e agachado em que uma placa enorme adiantada cobre
  // metade da figura, com uma lâmina saindo baixa do outro lado e a ponta de
  // um arco passando acima do ombro.
  //
  // A versão anterior era um guarda em formatura: coluna vertical, pés
  // colados, cimeira alta. Está errado duas vezes. Primeiro porque o
  // hobgoblin é soldado DE LINHA e a leitura dele é "pronto para receber a
  // carga", não "em revista". Segundo porque a cimeira comia 9 px acima da
  // cabeça: o contorno ia a 73 px dos 75 úteis enquanto a anatomia pedia 64,
  // e no tabuleiro ele ficava mais alto que o ogro, que é Grande.
  //
  // Tirar a cimeira e agachar resolve a escala; o ESCUDO DE TORRE assume o
  // lugar dela como marca de silhueta, e é melhor marca, porque ocupa o lado
  // da figura em vez do alto — nenhuma outra criatura do elenco tem metade do
  // contorno tomada por uma placa reta.
  hobgoblin: {
    species: 'hobgoblin', build: 'normal',
    // A ombreira espigada de um lado só é metade da assimetria da referência;
    // sem ela o ramo 'plate' desenha duas ombreiras redondas e simétricas, que
    // é exatamente a leitura de soldado em formatura que se queria evitar.
    marca: ['ombreira', 'arcoCostas'],
    // Laranja-avermelhado forte sobre cabelo ruivo escuro: o hobgoblin é o
    // único quente do bando (goblin em verde frio, bugbear em fulvo, Grol em
    // quase preto), e é isso que o acha na mesa cheia.
    skin: '#c05c34', hair: '#52221a', hairStyle: 'short',
    // Armadura azul-acinzentada escura: o valor mais escuro fica no corpo e o
    // claro na pele do rosto, que é onde o olho tem de pousar.
    outfit: '#394659', outfitDark: '#222a37', trim: '#5f6d82',
    metal: '#9aa3b2', leather: '#4e3b28', eyes: '#ff8a2a',
    armorStyle: 'plate', helm: false, shield: true, shieldStyle: 'torre',
    weapon: 'gancho',
  },

  // ---- os três bugbears ----------------------------------------------------
  //
  // Os três partilham o KIT DA ESPÉCIE, porque são a mesma criatura: pelo por
  // todo o corpo (borda rasgada de tufos, não tubo liso), orelha de lince com
  // tufo na ponta, pé descalço com garra, e couro PRETO contra o pelo claro —
  // ombreira num ombro, manopla no outro braço, cinto largo e saiote de tiras
  // até o meio da coxa. O preto do couro sobre o fulvo é o contraste que a
  // versão anterior não tinha: eram três blocos de pano verde-escuro com uma
  // cabeça, e o pelo não existia em lugar nenhum.
  //
  // O que os separa é O QUE CADA UM FAZ COM OS BRAÇOS E AS PERNAS, porque é
  // isso que sobrevive no contorno: o bugbear comum ergue a clava acima da
  // cabeça, Klarg planta as pernas e deita a clava no ombro, Grol cristala
  // uma bossa nas costas e dois chifres acima do crânio.

  // SILHUETA: pêra peluda de pés juntos com um bloco espigado num ombro e uma
  // clava de espigões ERGUIDA acima da cabeça.
  bugbear: {
    species: 'bugbear', build: 'normal',
    marca: ['ombreira', 'saiote'], manopla: true, armaApoio: 'erguida',
    // Fulvo dourado, mais claro no peito (outfit) e mais escuro nos membros
    // (outfitDark). Esse degrau é o que dá volume ao bicho peludo sem pintar
    // um pelo de cada vez.
    skin: '#bd8a46', hair: '#7a3c1c', hairStyle: 'spiky',
    outfit: '#c28c46', outfitDark: '#8f5b29', sleeve: '#a4702f',
    trim: '#8a7446',
    // `leather` é o couro preto de TODO o equipamento: ombreira, manopla,
    // cinto e saiote saem daqui.
    metal: '#9a948e', leather: '#241f1e', eyes: '#e0a53a',
    helm: false, shield: false, weapon: 'mace',
  },

  // SILHUETA: trapézio peludo de pernas muito abertas com um bloco espigado
  // num ombro e uma clava deitada na diagonal do ombro.
  //
  // Klarg é um bugbear e tem de LER como bugbear — mesmo pelo, mesmo couro,
  // mesma orelha. A diferença é a POSTURA: contra a pêra de pés juntos do
  // bugbear comum, ele planta as duas pernas e ocupa o dobro da base. A tinta
  // de guerra clara sobre pelo descorado é a leitura de perto.
  klarg: {
    species: 'bugbear', build: 'normal',
    stance: 'bruto', marca: ['ombreira', 'saiote'], manopla: true,
    facial: 'pinturaGuerra',
    face: { mandibula: 1.05, queixo: 'largo' },
    skin: '#bfae8e', hair: '#6a5f4e', hairStyle: 'spiky',
    outfit: '#c3b28f', outfitDark: '#8c7c5e', sleeve: '#a6976f',
    trim: '#e4ddc8',
    metal: '#8a8276', leather: '#2a2420', eyes: '#f0e2a0',
    helm: false, shield: false, weapon: 'mace',
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
    marca: ['corcunda', 'saiote'], facial: ['tapaOlho', 'cicatriz'],
    horns: true, manopla: true,
    face: { arcada: 3, olhoGap: -1, boca: 'presas' },
    // Pelo quase preto: ele é o valor mais escuro de todo o elenco, e o único
    // bugbear em que o couro preto do equipamento quase desaparece dentro do
    // pelo — o que sobra para ler são a bossa e os chifres, que é o plano.
    skin: '#5a4a44', hair: '#2a211e', hairStyle: 'spiky',
    outfit: '#584339', outfitDark: '#352823', sleeve: '#45342d',
    trim: '#b0362f',
    metal: '#6e7482', leather: '#1f1a1c', eyes: '#ff3a2a',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'axe',
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
