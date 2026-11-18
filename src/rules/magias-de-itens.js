// AS AÇÕES DOS ITENS DO OBELISCO que não são magia do livro: o que a capa de aumento e o boné da explosão mental fazem com
// uma ação bônus. Saem pela camada do item que conjura (`itens-que-conjuram.js`: as cargas, a recarga no descanso longo,
// a CD do item), como a varinha, e por isso precisam de uma entrada no catálogo de magias: círculo 0, interna, sem escala,
// fora de toda lista de classe. Aparecem na barra de quem leva o item (sintonizado).
export const MAGIAS_DE_ITENS = {
  // a CAPA DE AUMENTO (o Labirinto Salgado, B2): por dez minutos, vantagem em Força e a proficiência no dano de arma e de
  // golpe desarmado. O livro também aumenta o tamanho; no jogo a pegada não muda, como a do Aumentar/Reduzir.
  aumentoDaCapa: {
    id: 'aumentoDaCapa', name: 'Capa de aumento', level: 0, school: 'transmutação', fonte: 'propria', interna: true, semEscala: true,
    castTime: 'bonus', rangeFt: 0, kind: 'livro', efeito: 'aumentoDaCapa', tom: 3,
    desc: 'Ação bônus, uma carga: por 10 minutos, vantagem nos testes e resistências de Força, e o bônus de proficiência no dano de arma. (No jogo a pegada não cresce.)',
  },
  // o BONÉ DA EXPLOSÃO MENTAL (o Labirinto Salgado, B21): cone de 18 m, Inteligência CD 15, 5d8 psíquico e atordoado.
  explosaoDoBone: {
    id: 'explosaoDoBone', name: 'Boné da explosão mental', level: 0, school: 'encantamento', fonte: 'propria', interna: true, semEscala: true,
    castTime: 'bonus', rangeFt: 0, shape: 'cone', areaFt: 60, kind: 'save', save: 'int', damage: '5d8', damageType: 'psíquico', halfOnSave: true,
    onFail: { condition: 'atordoado', rounds: 10, repete: true },
    desc: 'Ação bônus, uma vez por dia: cone de 18 m, Inteligência CD 15; quem falha sofre 5d8 psíquico e fica atordoado (repete no fim de cada turno), quem passa sofre metade.',
  },
  // a BÊNÇÃO DA MENTE SOLIPSISTA (o Labirinto Salgado, B10): quem passa um dia inteiro lendo com o Jomlus a ganha. Não é
  // item, mas mora aqui pelo mesmo motivo: é uma ação com usos que voltam no descanso longo, fora de toda lista de classe.
  // Quem a tem leva a característica `bencaoSolipsista` (`magias-concedidas.js`) e o recurso `menteSolipsista`.
  menteSolipsista: {
    id: 'menteSolipsista', name: 'Mente Solipsista', level: 0, school: 'adivinhação', fonte: 'propria', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 0, kind: 'livro', efeito: 'menteSolipsista', recursoDe: 'menteSolipsista', tom: 1,
    desc: 'Ação, uma vez por descanso longo: por uma hora, 1d8 a mais nos testes e nas resistências de Inteligência e de Sabedoria, e nenhuma reação.',
  },
  // ---- OS ITENS DO LIVRO DO MESTRE que conjuram o que nenhuma magia do livro conjura (2026-11-16, `livro-motor.js`)
  // as BOLSAS DE TRUQUES: a bolinha jogada vira a fera do d8 da cor da bolsa
  bolsaDeTruquesCinza: {
    id: 'bolsaDeTruquesCinza', name: 'Bolsa de truques (cinza)', level: 0, school: 'conjuração', fonte: 'dmg', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 20, kind: 'livro', efeito: 'bolsaDeTruques', familiaSonora: 'invocacao', tom: 2,
    tabela: ['doninha', 'ratoGigante', 'texugo', 'javali', 'pantera', 'texugoGigante', 'ursoPardo', 'alceGigante'],
    desc: 'Com a ação, uma bolinha de pelo jogada a até 6 m vira uma fera do d8 (doninha, rato gigante, texugo, javali, pantera, texugo gigante, urso pardo, alce gigante), que luta do seu lado. Três por dia.',
  },
  bolsaDeTruquesFerrugem: {
    id: 'bolsaDeTruquesFerrugem', name: 'Bolsa de truques (ferrugem)', level: 0, school: 'conjuração', fonte: 'dmg', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 20, kind: 'livro', efeito: 'bolsaDeTruques', familiaSonora: 'invocacao', tom: 4,
    tabela: ['ratoFamiliar', 'coruja', 'mastim', 'bode', 'cabraGigante', 'javaliGigante', 'leao', 'ursoPardo'],
    desc: 'Com a ação, uma bolinha de pelo jogada a até 6 m vira uma fera do d8 (rato, coruja, mastim, bode, cabra gigante, javali gigante, leão, urso pardo), que luta do seu lado. Três por dia.',
  },
  bolsaDeTruquesCastanha: {
    id: 'bolsaDeTruquesCastanha', name: 'Bolsa de truques (castanha)', level: 0, school: 'conjuração', fonte: 'dmg', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 20, kind: 'livro', efeito: 'bolsaDeTruques', familiaSonora: 'invocacao', tom: 7,
    tabela: ['chacal', 'macaco', 'babuino', 'bicoDeMachado', 'ursoNegro', 'doninhaGigante', 'hienaGigante', 'tigre'],
    desc: 'Com a ação, uma bolinha de pelo jogada a até 6 m vira uma fera do d8 (chacal, macaco, babuíno, bico-de-machado, urso-negro, doninha gigante, hiena gigante, tigre), que luta do seu lado. Três por dia.',
  },
  // os VASOS DE ELEMENTAL: o elemental como o da Conjurar Elemental, com a ação e uma vez por dia
  elementalDaTigela: {
    id: 'elementalDaTigela', name: 'Tigela: convocar elemental da água', level: 0, school: 'conjuração', fonte: 'dmg', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 60, kind: 'livro', efeito: 'elementalDoVaso', defId: 'elementalDaAgua', concentration: true, duracaoRodadas: 600, familiaSonora: 'invocacao', tom: -2,
    desc: 'Com a ação, uma vez por dia: um elemental da água obedece enquanto durar a concentração (até 1 hora). Se ela cair antes, ele fica, hostil a todos.',
  },
  elementalDoBraseiro: {
    id: 'elementalDoBraseiro', name: 'Braseiro: convocar elemental do fogo', level: 0, school: 'conjuração', fonte: 'dmg', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 60, kind: 'livro', efeito: 'elementalDoVaso', defId: 'elementalDoFogo', concentration: true, duracaoRodadas: 600, familiaSonora: 'invocacao', tom: 0,
    desc: 'Com a ação, uma vez por dia: um elemental do fogo obedece enquanto durar a concentração (até 1 hora). Se ela cair antes, ele fica, hostil a todos.',
  },
  elementalDoIncensario: {
    id: 'elementalDoIncensario', name: 'Incensário: convocar elemental do ar', level: 0, school: 'conjuração', fonte: 'dmg', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 60, kind: 'livro', efeito: 'elementalDoVaso', defId: 'elementalDoAr', concentration: true, duracaoRodadas: 600, familiaSonora: 'invocacao', tom: 9,
    desc: 'Com a ação, uma vez por dia: um elemental do ar obedece enquanto durar a concentração (até 1 hora). Se ela cair antes, ele fica, hostil a todos.',
  },
  // o MANTO DA INVISIBILIDADE, o GLOBO FLUTUANTE e o BASTÃO DE TENTÁCULOS
  capuzDoManto: {
    id: 'capuzDoManto', name: 'Erguer o capuz', level: 0, school: 'ilusão', fonte: 'dmg', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 0, kind: 'livro', efeito: 'capuzDoManto', duracaoRodadas: 1200, familiaSonora: 'utilidade', tom: 3,
    desc: 'Com a ação, uma vez por dia: invisível até baixar o capuz (outra ação) ou por até 2 horas; atacar não desfaz.',
  },
  luzDoGlobo: {
    id: 'luzDoGlobo', name: 'Acender o globo', level: 0, school: 'evocação', fonte: 'dmg', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 0, kind: 'livro', efeito: 'luzDoGlobo', familiaSonora: 'utilidade', tom: 5,
    desc: 'Com a ação: o globo acende como a magia Luz e flutua junto de quem o leva, por uma hora; de novo, apaga.',
  },
  tentaculosDoBastao: {
    id: 'tentaculosDoBastao', name: 'Tentáculos do bastão', level: 0, school: 'transmutação', fonte: 'dmg', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 15, kind: 'livro', efeito: 'tentaculosDoBastao', alvo: 'criatura', familiaSonora: 'maldicao', tom: 3,
    desc: 'Com a ação, três golpes contra uma criatura a até 4,5 m (+9, 1d6 de concussão cada); acertando os três, Constituição CD 15 ou metade do deslocamento, desvantagem em Destreza, sem reações e só a ação ou a ação bônus, por 1 minuto.',
  },
  // ---- a segunda leva dos itens do Livro do Mestre (2026-11-17)
  garrafaDoEfreeti: {
    id: 'garrafaDoEfreeti', name: 'Tirar a rolha da garrafa', level: 0, school: 'conjuração', fonte: 'dmg', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 30, kind: 'livro', efeito: 'garrafaDoEfreeti', mira: 'casa', familiaSonora: 'invocacao', tom: 12,
    desc: 'Com a ação, uma vez por dia: o efreeti sai numa casa livre a até 9 m, e o d100 decide. 1 a 10, ele ataca você, e a garrafa perde a magia; 11 a 90, serve por uma hora; 91 a 100, deve três desejos.',
  },
  djinniDoAnel: {
    id: 'djinniDoAnel', name: 'Convocar o djinni', level: 0, school: 'conjuração', fonte: 'dmg', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 120, kind: 'livro', efeito: 'elementalDoVaso', defId: 'djinni', naoFicaHostil: true, concentration: true, duracaoRodadas: 600, familiaSonora: 'invocacao', tom: 4,
    desc: 'Com a ação, uma vez por dia: o djinni do anel aparece e obedece enquanto durar a concentração (até 1 hora); quando ela acaba, ele volta ao anel.',
  },
  prenderNoFrasco: {
    id: 'prenderNoFrasco', name: 'Prender no frasco', level: 0, school: 'conjuração', fonte: 'dmg', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 60, kind: 'livro', efeito: 'prenderNoFrasco', alvo: 'criatura', familiaSonora: 'maldicao', tom: 1,
    desc: 'Com a ação, uma criatura de outro plano (celestial, corruptor, elemental, fada) a até 18 m faz Sabedoria CD 17 ou é sugada para dentro do frasco, que guarda uma só.',
  },
  soltarDoFrasco: {
    id: 'soltarDoFrasco', name: 'Soltar do frasco', level: 0, school: 'conjuração', fonte: 'dmg', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 30, kind: 'livro', efeito: 'soltarDoFrasco', mira: 'casa', familiaSonora: 'invocacao', tom: 1,
    desc: 'Com a ação, a criatura presa sai numa casa livre a até 9 m e obedece por uma hora.',
  },
  contaDeForca: {
    id: 'contaDeForca', name: 'Jogar a conta de força', level: 0, school: 'evocação', fonte: 'dmg', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 60, kind: 'livro', efeito: 'contaDeForca', shape: 'sphere', areaFt: 10, familiaSonora: 'protecao', tom: 1,
    desc: 'Com a ação, jogada a até 18 m: quem está a 3 m de onde ela cai faz Destreza CD 15; quem falha sofre 5d4 de energia e fica preso numa esfera de força por 1 minuto, onde nada entra nem sai.',
  },
  garrafaDaFumaca: {
    id: 'garrafaDaFumaca', name: 'Abrir ou tampar a garrafa da fumaça', level: 0, school: 'conjuração', fonte: 'dmg', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 0, kind: 'livro', efeito: 'garrafaDaFumaca', familiaSonora: 'utilidade', tom: 1,
    desc: 'Com a ação, aberta: uma fumaça que tapa a vista enche 18 m em volta e cresce 3 m por minuto, até 36 m. Com a ação, tampada: para de crescer e se desfaz em 10 minutos.',
  },
  medoDoAnel: {
    id: 'medoDoAnel', name: 'Medo (anel de influência animal)', level: 0, school: 'ilusão', fonte: 'dmg', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 0, shape: 'cone', areaFt: 30, kind: 'save', save: 'wis', onFail: { condition: 'amedrontado', repete: 'semVisao', foge: true },
    soTipo: 'fera', intMaxima: 3, concentration: true, duracaoRodadas: 10, familiaSonora: 'maldicao', tom: 3,
    desc: 'O Medo do anel: cone de 9 m, só pega fera de Inteligência 3 ou menos. Sabedoria CD 13 ou fica amedrontada e foge. Concentração, até 1 minuto.',
  },
  // ---- os cinco que sobravam (2026-11-17)
  cuboDeForca: {
    id: 'cuboDeForca', name: 'Apertar uma face do cubo', level: 0, school: 'abjuração', fonte: 'dmg', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 0, kind: 'livro', efeito: 'cuboDeForca', familiaSonora: 'protecao', tom: 5,
    opcoes: [
      { id: '1', rotulo: 'Face 1 (1 carga)', detalhe: 'gás, vento e névoa não passam' },
      { id: '2', rotulo: 'Face 2 (2 cargas)', detalhe: 'nada sem vida passa: o projétil' },
      { id: '3', rotulo: 'Face 3 (3 cargas)', detalhe: 'nada vivo passa: a criatura e o golpe de perto' },
      { id: '4', rotulo: 'Face 4 (4 cargas)', detalhe: 'nenhuma magia passa' },
      { id: '5', rotulo: 'Face 5 (5 cargas)', detalhe: 'nada passa' },
      { id: '6', rotulo: 'Face 6', detalhe: 'desliga a barreira' },
    ],
    desc: 'Com a ação, uma barreira invisível de 4,5 m em volta de você, que anda com você, por 1 minuto; cada face barra uma coisa e gasta as cargas dela.',
  },
  soltarAEsfera: {
    id: 'soltarAEsfera', name: 'Soltar a esfera da aniquilação', level: 0, school: 'conjuração', fonte: 'dmg', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 5, kind: 'livro', efeito: 'soltarAEsfera', mira: 'casa', familiaSonora: 'maldicao', tom: 3,
    desc: 'Com a ação, a esfera negra numa casa livre ao lado: ela fica parada, e quem a toca faz Destreza CD 13 ou sofre 4d10 de energia.',
  },
  controlarAEsfera: {
    id: 'controlarAEsfera', name: 'Controlar a esfera da aniquilação', level: 0, school: 'transmutação', fonte: 'dmg', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 60, kind: 'livro', efeito: 'controlarAEsfera', mira: 'casa', familiaSonora: 'utilidade', tom: 3,
    desc: 'Com a ação, a até 18 m da esfera: Inteligência (Arcanismo) CD 25 (o talismã dobra a proficiência). Passando, ela vai até a casa mirada, a até 5 × o modificador de Inteligência; falhando, anda 3 m na sua direção. Quem estiver no caminho faz Destreza CD 13 ou sofre 4d10 de energia.',
  },
};
