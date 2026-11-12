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
};
