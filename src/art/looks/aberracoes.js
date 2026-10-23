// LOOKS das aberrações, limos e do dragão.
//
// Ver ELENCO.md para o contrato completo do look e a escala em pixels.
// Pareia com o arquivo de mesma família em `rules/monsters/`: todo monstro de
// lá aponta um `look` daqui.
//
// CAMPOS QUE ESTA FAMÍLIA USA
//   plan        'gosma' | 'aberracao' | 'dragao'  (ver art/plans/index.js)
//   aberracao   escolhe a variante dentro de `plans/aberracao.js`:
//               'gosma' | 'cranioFlamejante' | 'olhoVigia' | 'brotoEspinhoso'
//               | 'spectator'
//   O doppelganger NÃO tem `plan`: ele passa pelo pintor humanoide de
//   `draw.js`, porque a graça dele é ser indistinguível de gente.
//   formaReal   só o doppelganger usa: a chave do look para o qual a figura
//               troca quando ele é DESMASCARADO. Ver o comentário dele.
//
// POR QUE OS PAPÉIS DE COR MUDAM DE SIGNIFICADO AQUI
// Uma gosma não tem roupa e um dragão não tem couro de bota. Cada pintor de
// `plans/` relê os mesmos campos como outra coisa — `outfit` é a geleia na
// gelatina, a chama na caveira, a esclera no vigia e a escama no dragão. O
// comentário de cada look diz o que cada campo virou, senão ninguém consegue
// retocar a paleta sem abrir o plano.
//
// PALETA DA FAMÍLIA: o defeito 4 do ELENCO.md é "paleta dos inimigos é uma
// lama só, todos no mesmo marrom-verde-bege". Estas seis criaturas foram
// afastadas de propósito em MATIZ e em VALOR, uma por uma:
//   gelatina       âmbar saturado, valor claro
//   caveira        VERDE-LIMÃO frio e claro, com dois pontos de brasa
//                  vermelho-laranja de 5 px nas órbitas e nada mais quente
//   vigia          marrom quase preto — o VALOR mais baixo do bestiário —,
//                  com uma íris verde-amarela como única cor
//   spectator      verde-oliva escamoso de valor médio, com a goela rosada e
//                  quatro pontos amarelos nas pontas das hastes
//   espinheiro     marrom escuro quase sem saturação, com uma brasa pontual
//   dragão         verde profundo, o valor mais escuro do elenco inteiro
//   doppelganger   CINZA DESSATURADO disfarçado, AZUL-ACINZENTADO real — é o
//                  único humanoide do jogo sem nenhuma cor saturada, e é
//                  assim que ele se destaca num tabuleiro de goblinoides
//
// O VIGIA E O SPECTATOR SÃO OS DOIS QUE MAIS SE APROXIMAM, e é de propósito
// que eles não brigam: o vigia é marrom quase preto e o spectator é verde de
// valor médio, dois degraus acima. Lado a lado eles se separam pelo valor
// antes de o jogador chegar ao matiz.

export const ABERRACOES_LOOKS = {

  // ------------------------------------------------------------------ SRD

  // GELATINA OCRE — plano `gosma`.
  //   outfit=geleia · outfitDark=massa de baixo · glow=película translúcida
  //   trim=osso engolido · metal=moeda engolida
  //
  // O âmbar é mais saturado que o ocre de referência porque esta criatura é a
  // única do elenco cuja silhueta é mais larga que alta: ela se lê pela mancha
  // de cor no chão, e um ocre lavado desaparecia contra a pedra do piso.
  gelatinaOcre: {
    plan: 'gosma',
    outfit: '#b98a22', outfitDark: '#6a4a10', glow: '#f2dd86',
    trim: '#e6dcc0', metal: '#d4af3c',
  },

  // DOPPELGANGER — sem plano: humanoide puro.
  //
  // O ROSTO É O ELEMENTO-HERÓI, e ele é herói por SUBTRAÇÃO. Toda a face foi
  // achatada: sem arcada, sem maçã do rosto, nariz fino, boca fina, queixo
  // redondo e olho pequeno e junto. O resultado é uma cara lisa que o jogador
  // não consegue descrever depois — exatamente o que a criatura é.
  //
  // A cor cumpre o mesmo papel: é o único humanoide do jogo inteiro sem um
  // único matiz saturado. Ao lado de um bandido ou de um plebeu ele lê como a
  // MESMA figura com a cor drenada, e é esse estranhamento que entrega o
  // disfarce um instante antes de ele atacar.
  //
  // `marca: 'capuz'` é o que salva a silhueta: sem ela esta figura seria
  // deliberadamente o retângulo com cabeça e dois braços que o ELENCO.md manda
  // consertar. Com o capuz, a mancha preta tem uma ponta caída atrás da cabeça
  // e deixa de ser a mesma do plebeu.
  //
  // `formaReal` APONTA PARA O LOOK DE BAIXO. A graça desta criatura é que a
  // forma verdadeira só aparece quando ela é desmascarada, então ela precisa de
  // DUAS figuras e de um jeito de trocar de uma para a outra em jogo. O campo é
  // uma chave de look, não um booleano, porque é assim que `resolveLook` já
  // sabe resolver: quem controla o combatente troca o look dele por
  // `look.formaReal` no momento em que o disfarce cai, e a folha de sprites da
  // forma real é assada na hora como a de qualquer outro monstro.
  doppelganger: {
    species: 'humano', build: 'normal', stance: 'solto',
    skin: '#cfc6bd', hair: '#9a958f', hairStyle: 'short', beard: false,
    outfit: '#5a5f68', outfitDark: '#383c43', trim: '#8a8f98',
    metal: '#a8aeb8', leather: '#5e5349', eyes: '#e4e8ee',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'dagger',
    marca: 'capuz', cloak: '#4a4e56',
    formaReal: 'doppelgangerReal',
    face: {
      testa: 0.38, arcada: 0, macas: 0, mandibula: 0.96, queixo: 'redondo',
      projeta: null, olhoGap: -1, olhoH: 1, olhoW: 2,
      nariz: 'fina', narizW: 0.74, boca: 'fina',
    },
  },

  // DOPPELGANGER, FORMA REAL — o que sobra quando o disfarce cai.
  //
  // Ele continua sem plano: é humanoide, e tem de continuar sendo, senão o
  // jogador não liga a coisa ao "aliado" que estava ali meio segundo antes. O
  // que muda é a ESPÉCIE e a PELE, não o pintor.
  //
  // `species: 'drow'` não é um drow: é o conjunto de medidas que esta figura
  // precisa e que já existe em `body.js` — o mais magro do arquivo (bulk 0,82),
  // de perna longa (legs 1,06), braço comprido e crânio estreito. Com
  // `heightMul` ele passa o humano em altura sem ganhar um grama de largura, e
  // é essa proporção de fio esticado que a referência tem.
  //
  // NUDEZ SEM CAMPO DE NUDEZ: `draw.js` sempre pinta um tronco com `outfit`, e
  // não é arquivo meu para mexer. A saída foi pôr a PRÓPRIA PELE nos campos de
  // roupa — `outfit` é a pele, `outfitDark` é a pele na sombra — e deixar
  // `trim` de fora, porque é ele que desenharia um cinto. `armorStyle: 'none'`
  // não casa com nenhum `case` do pintor e cai no ramo de túnica, que com a cor
  // da pele some. Resultado: um corpo de uma cor só, sem costura nenhuma, que é
  // exatamente o que a figura é.
  //
  // O ROSTO É LISO E ERRADO DE PROPÓSITO, e é herói por SUBTRAÇÃO: arcada zero,
  // maçã zero, nariz quase inexistente, boca fina, mandíbula estreita. A testa
  // altíssima (0,52) é o que mais trabalha — ela empurra a linha dos olhos para
  // baixo e deixa uma calota de crânio enorme acima deles, que é como se lê
  // "crânio alongado" com os campos que existem hoje.
  //
  // OLHO BRANCO VAZIO: `olhoH: 1` com `olhoW: 3` e `eyes` quase branco. A
  // altura 1 não é economia, é o único caminho: com `olhoH: 2` o pintor desenha
  // uma pálpebra por cima da primeira linha, e essa pálpebra é um degrau escuro
  // do branco quente dele — dois pixels cor de areia que leem como olho de
  // gente cansada. Em fenda de 1 px ele usa a SOMBRA ACIMA no lugar da
  // pálpebra, e sobram três pixels claros por olho com a cova escura em cima:
  // branco vazio e afundado, que é o que a referência tem.
  //
  // AS ORELHAS FICAM. A descrição do briefing diz "sem orelhas aparentes", mas
  // a imagem tem duas pontas pequenas e viradas para trás, e a imagem manda.
  // `species: 'drow'` já as desenha no tamanho certo.
  //
  // SEM CAPUZ, SEM ARMA, SEM CAPA. O disfarce caiu; se a silhueta mantivesse a
  // marca, as duas formas seriam a mesma mancha e a revelação não aconteceria
  // no tabuleiro, só na ficha.
  doppelgangerReal: {
    species: 'drow', build: 'magro', stance: 'solto', heightMul: 1.14,
    // `hair` acompanha a pele apesar de `hairStyle: 'bald'`: o pintor ainda usa
    // a cor do cabelo num pixel de borda na vista de lado, e o marrom padrão
    // dele punha um tufo castanho na nuca de uma criatura sem um fio.
    skin: '#74879b', hair: '#74879b', hairStyle: 'bald', beard: false,
    // A "roupa" é a própria pele, um degrau abaixo: é assim que esta figura
    // fica nua sem o pintor ter um campo de nudez. `trim` sai de cena porque é
    // ele que desenharia um cinto onde não há nada.
    outfit: '#74879b', outfitDark: '#637588', trim: null,
    metal: '#8fa0b2', leather: '#637588', eyes: '#f4f8fc',
    armorStyle: 'none', helm: false, shield: false, weapon: null,
    cloak: null, marca: null,
    formaFalsa: 'doppelganger',
    face: {
      testa: 0.52, arcada: 0, macas: 0, mandibula: 0.84, queixo: 'pontudo',
      projeta: null, olhoGap: 0, olhoH: 1, olhoW: 3,
      nariz: 'fina', narizW: 0.60, boca: 'fina',
    },
  },

  // DRAGÃO VERDE JOVEM — plano `dragao`. É o chefe final.
  //   outfit=escama do flanco · outfitDark=dorso · trim=ventre
  //   cloak=membrana da asa · metal=chifre e garra · eyes=olho · glow=goela
  //
  // O verde é o VALOR MAIS ESCURO do elenco todo, de propósito: o dragão é a
  // única criatura que encosta no teto da célula (74 px) e, pintada clara, essa
  // massa toda roubaria a leitura do tabuleiro inteiro. Escuro, ela lê como
  // peso.
  //
  // O ventre amarelo-esverdeado claro e a goela verde-limão são os dois únicos
  // pontos claros, e estão onde o olho precisa pousar: a linha de baixo que
  // separa o bicho do chão, e a boca de onde sai o sopro.

  // --------------------------------------------------------- nossas (própria)

  // CAVEIRA CANDENTE — plano `aberracao`, variante `cranioFlamejante`.
  //   skin=osso · outfitDark=cavidade · outfit=chama · glow=núcleo da chama
  //   eyes=brasa das órbitas
  //
  // A CHAMA É VERDE E AS ÓRBITAS SÃO VERMELHO-LARANJA, e essa inversão é a
  // figura inteira. A versão anterior tinha chama laranja com órbita azul: o
  // calor estava na massa de 30 px e o frio no detalhe de 5 px, então o olhar
  // do jogador caía na fogueira e a cabeça — a coisa que ele precisa mirar —
  // sumia dentro dela. Com verde-limão na massa e brasa quente só nas órbitas,
  // a mancha grande vira moldura e o rosto vira alvo.
  //
  // O verde também resolve a vizinhança: nenhuma outra criatura do bestiário é
  // verde-limão claro, então mesmo a 55 px e fora de foco a caveira não se
  // confunde com nada no tabuleiro.
  caveiraCandente: {
    plan: 'aberracao', aberracao: 'cranioFlamejante',
    skin: '#ece4cc', outfitDark: '#3a3c26', outfit: '#4fae1c',
    glow: '#cdf262', eyes: '#ff5a12',
  },

  // VIGIA CICLÓPICO — plano `aberracao`, variante `olhoVigia`.
  //   skin=pele · outfitDark=pele na sombra · outfit=esclera
  //   eyes=íris · trim=pupila
  //
  // A pele deixou de ser cinza-violeta e virou MARROM QUASE PRETO, como a
  // referência pede. Isso parece andar contra o defeito 4 do ELENCO.md ("a
  // paleta dos inimigos é uma lama marrom só"), e não anda: aquele defeito é
  // sobre criaturas no MESMO VALOR MÉDIO: goblin, hobgoblin, orc e bugbear são
  // todos marrons de meio-tom, e por isso viram uma mancha como grupo. Este
  // bicho é o marrom mais ESCURO do bestiário, dois ou três degraus abaixo de
  // todos eles. Ao lado de um goblinoide ele lê como buraco, não como primo.
  //
  // E o que carrega a identidade não é mais a pele, é a ÍRIS VERDE-AMARELA:
  // numa figura inteira entre o marrom e o preto, um disco de 10 px nessa cor é
  // o único lugar onde o olho do jogador pode pousar. Nenhuma outra criatura do
  // elenco tem esse matiz, e é por ele que o vigia é reconhecido antes de o
  // jogador contar quantos olhos ele tem.
  vigiaCiclopico: {
    plan: 'aberracao', aberracao: 'olhoVigia',
    skin: '#4a3a2c', outfitDark: '#231a13', outfit: '#e4dcba',
    eyes: '#c2cf36', trim: '#0b0907',
  },

  // SPECTATOR — plano `aberracao`, variante `spectator`.
  //   outfit=escama · outfitDark=escama na sombra · glow=goela
  //   skin=dente · eyes=íris do olho central · metal=olhos das hastes
  //   trim=língua
  //
  // LICENÇA: o NOME e o CONCEITO são conteúdo de fã (Fan Content Policy), a
  // mesma política que sustenta "Phandalin" e "Nezznar" aqui, e que depende de
  // o jogo continuar gratuito. A ARTE é nossa, desenhada do zero em
  // `plans/aberracao.js`, e os NÚMEROS do bloco são do projeto.
  //
  // O verde-oliva fica em VALOR MÉDIO, entre o vigia (quase preto) e a caveira
  // (verde-limão claro). Os três são a família das aberrações e precisam de
  // parentesco de matiz sem virar a mesma mancha — então o que os separa é a
  // escada de valor, que funciona mesmo com o sprite fora de foco.
  //
  // A GOELA ROSADA E A LÍNGUA são os únicos pontos quentes, e estão na metade
  // de baixo da figura. É deliberado: o olho central (frio, azul-acinzentado)
  // puxa o olhar para cima e a boca o puxa para baixo, e esse vaivém é o que
  // faz uma bola de 28 px parecer que tem duas coisas acontecendo nela.
  spectator: {
    plan: 'aberracao', aberracao: 'spectator',
    outfit: '#5f7c33', outfitDark: '#2f441a', glow: '#7d3c46',
    skin: '#e2d9b6', eyes: '#8ea6c4', metal: '#dcd37e', trim: '#d99ba8',
  },

  // BROTO ESPINHOSO — plano `aberracao`, variante `brotoEspinhoso`.
  //   outfit=casca · outfitDark=casca na sombra · trim=seiva · glow=brasa
  //
  // Esta é a criatura mais DESSATURADA do elenco, e tem de ser: ela aparece em
  // grupos de quatro a seis, e seis manchas saturadas no mesmo quadrante do
  // tabuleiro apagariam tudo o que estivesse em volta. A saturação toda do
  // look está concentrada num único ponto de brasa no meio do feixe — é o que
  // separa "criatura" de "arbusto morto" a 55 px.
  espinheiroRastejante: {
    plan: 'aberracao', aberracao: 'brotoEspinhoso',
    outfit: '#4e3a22', outfitDark: '#2b1d0c', trim: '#7d8c32',
    glow: '#d05a18',
  },
};
