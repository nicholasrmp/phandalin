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
//   O doppelganger NÃO tem `plan`: ele passa pelo pintor humanoide de
//   `draw.js`, porque a graça dele é ser indistinguível de gente.
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
//   caveira        laranja quente sobre osso claríssimo, com um azul frio só
//                  nas órbitas
//   vigia          cinza-violeta frio, valor médio-escuro, um vermelho único
//   espinheiro     marrom escuro quase sem saturação, com uma brasa pontual
//   dragão         verde profundo, o valor mais escuro do elenco inteiro
//   doppelganger   CINZA DESSATURADO — é o único humanoide do jogo sem
//                  nenhuma cor saturada, e é assim que ele se destaca num
//                  tabuleiro cheio de goblinoides marrons

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
  doppelganger: {
    species: 'humano', build: 'normal', stance: 'solto',
    skin: '#cfc6bd', hair: '#9a958f', hairStyle: 'short', beard: false,
    outfit: '#5a5f68', outfitDark: '#383c43', trim: '#8a8f98',
    metal: '#a8aeb8', leather: '#5e5349', eyes: '#e4e8ee',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'dagger',
    marca: 'capuz', cloak: '#4a4e56',
    face: {
      testa: 0.38, arcada: 0, macas: 0, mandibula: 0.96, queixo: 'redondo',
      projeta: null, olhoGap: -1, olhoH: 1, olhoW: 2,
      nariz: 'fina', narizW: 0.74, boca: 'fina',
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
  dragaoVerdeJovem: {
    plan: 'dragao',
    outfit: '#35702f', outfitDark: '#1d3c1a', trim: '#b4bf5e',
    cloak: '#4f5c2c', metal: '#d6caa6', eyes: '#efa81e', glow: '#a6e02c',
    leather: '#3c4522',
  },

  // --------------------------------------------------------- nossas (própria)

  // CAVEIRA CANDENTE — plano `aberracao`, variante `cranioFlamejante`.
  //   skin=osso · outfitDark=cavidade · outfit=chama · glow=núcleo da chama
  //   eyes=fogo das órbitas
  //
  // O azul das órbitas contra o laranja de tudo o mais não é enfeite: é o que
  // põe o olhar do jogador no ROSTO e não na fogueira. Sem o contraste de
  // matiz a figura vira uma tocha e a cabeça — a coisa que o jogador precisa
  // mirar — desaparece dentro da chama.
  caveiraCandente: {
    plan: 'aberracao', aberracao: 'cranioFlamejante',
    skin: '#e8dec0', outfitDark: '#4a3a22', outfit: '#e05a14',
    glow: '#ffdc5a', eyes: '#7fe4ff',
  },

  // VIGIA CICLÓPICO — plano `aberracao`, variante `olhoVigia`.
  //   skin=pele · outfitDark=pele na sombra · outfit=esclera
  //   eyes=íris · trim=pupila
  //
  // O cinza-violeta é a única pele FRIA do bestiário — goblin, hobgoblin, orc,
  // bugbear e ogro são todos quentes. Isso resolve metade do defeito 4 do
  // ELENCO.md sem tocar em nenhum deles: posto ao lado de um goblinoide, este
  // bicho não pertence à mesma família de cor, e é essa estranheza que o
  // jogador lê antes de ver que ele tem um olho só.
  //
  // O vermelho da íris é o único ponto saturado da figura. Ele é o
  // elemento-herói: numa criatura de 56 px, uma íris de 5 px de diâmetro é o
  // suficiente para o olho do jogador pousar sempre no mesmo lugar.
  vigiaCiclopico: {
    plan: 'aberracao', aberracao: 'olhoVigia',
    skin: '#8c7a96', outfitDark: '#43384e', outfit: '#eee6cc',
    eyes: '#d4441a', trim: '#120d16',
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
