// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// As treze armaduras da tabela, mais o escudo.
//
// A CATEGORIA MORA NA ARMADURA
// Havia uma tabela separada, `CATEGORIA_ARMADURA`, mapeando id para leve,
// média ou pesada. Tabela paralela apodrece: toda armadura nova que alguém
// esquecesse de registrar lá virava, em silêncio, "sem categoria" — e o aviso
// de treino parava de aparecer justo para quem veste placas sem saber. Agora
// a categoria é campo da própria entrada e não dá para adicionar uma armadura
// sem ela.
//
// `dexCap: Infinity` é leve, `2` é média, `0` é pesada — mas quem manda é
// `categoria`, porque é ela que o treino lê.
//
// `art` é o estilo que o pintor desenha (`art/draw.js`) e só existem quatro
// que vestem: none, leather, scale, plate. Treze armaduras em quatro desenhos
// quer dizer que a brigantina usa o desenho de placas e o peitoral também.
//
// `furtividade: 'desvantagem'` é catálogo: a ficha mostra, o motor de combate
// não testa Furtividade hoje. Está marcado para não ser confundido com regra
// em vigor.

const leve = (extra) => ({ categoria: 'leve', dexCap: Infinity, fonte: 'srd', ...extra });
const media = (extra) => ({ categoria: 'média', dexCap: 2, fonte: 'srd', ...extra });
const pesada = (extra) => ({ categoria: 'pesada', dexCap: 0, fonte: 'srd', ...extra });

export const ARMORS = {
  nenhuma: {
    id: 'nenhuma', name: 'Sem armadura', base: 10, dexCap: Infinity,
    categoria: 'nenhuma', art: null, peso: 0, custo: 0, fonte: 'srd',
    desc: 'CA 10 mais o modificador de Destreza inteiro.',
  },

  // ------------------------------------------------------------- leves ----
  acolchoada: leve({
    id: 'acolchoada', name: 'Armadura acolchoada', base: 11, art: 'leather',
    peso: 8, custo: 5, furtividade: 'desvantagem',
    desc: 'Camadas de tecido grosso costuradas. Barata, quente e barulhenta.',
  }),
  couro: leve({
    id: 'couro', name: 'Couro', base: 11, art: 'leather',
    peso: 10, custo: 10,
    desc: 'Peitoral e ombreiras de couro fervido; o resto é couro macio.',
  }),
  couroBatido: leve({
    id: 'couroBatido', name: 'Couro batido', base: 12, art: 'leather',
    peso: 13, custo: 45,
    desc: 'Couro cravejado de rebites. A escolha de quem precisa de Destreza inteira.',
  }),

  // ------------------------------------------------------------ médias ----
  peleDeAnimal: media({
    id: 'peleDeAnimal', name: 'Peles', base: 12, art: 'leather',
    peso: 12, custo: 10,
    desc: 'Peles grossas e pelo. Quem vive longe de ferreiro veste isto.',
  }),
  camisaoDeMalha: media({
    id: 'camisaoDeMalha', name: 'Camisão de malha', base: 13, art: 'scale',
    peso: 20, custo: 50,
    desc: 'Malha de anéis até a cintura, usada por baixo da roupa sem aparecer.',
  }),
  brunea: media({
    id: 'brunea', name: 'Brunea', base: 14, art: 'scale',
    peso: 45, custo: 50, furtividade: 'desvantagem',
    desc: 'Escamas de metal costuradas no couro. Protege bem e tilinta a cada passo.',
  }),
  peitoral: media({
    id: 'peitoral', name: 'Peitoral', base: 14, art: 'plate',
    peso: 20, custo: 400,
    desc: 'Só a chapa do peito, com couro no resto. Protege o que importa sem travar o corpo.',
  }),
  meiaArmadura: media({
    id: 'meiaArmadura', name: 'Meia armadura', base: 15, art: 'plate',
    peso: 40, custo: 750, furtividade: 'desvantagem',
    desc: 'Placas no tronco e nos braços, pernas livres. A melhor média que existe.',
  }),

  // ----------------------------------------------------------- pesadas ----
  malhaDeAneis: pesada({
    id: 'malhaDeAneis', name: 'Malha de anéis', base: 14, art: 'scale',
    peso: 40, custo: 30, furtividade: 'desvantagem',
    desc: 'Anéis pesados costurados no couro. A pesada mais barata, e sente-se.',
  }),
  cotaDeMalha: pesada({
    id: 'cotaDeMalha', name: 'Cota de malha', base: 16, art: 'plate',
    peso: 55, custo: 75, furtividade: 'desvantagem', forcaMinima: 13,
    desc: 'Malha completa sobre acolchoado. Exige Força 13 para não atrapalhar o passo.',
  }),
  brigantina: pesada({
    id: 'brigantina', name: 'Brigantina', base: 17, art: 'plate',
    peso: 60, custo: 200, furtividade: 'desvantagem', forcaMinima: 15,
    desc: 'Tiras de metal rebitadas sobre couro e malha nas juntas. Exige Força 15.',
  }),
  placas: pesada({
    id: 'placas', name: 'Armadura de placas', base: 18, art: 'plate',
    peso: 65, custo: 1500, furtividade: 'desvantagem', forcaMinima: 15,
    desc: 'Chapa moldada da cabeça aos pés. A melhor CA que o dinheiro compra. Exige Força 15.',
  }),
};

export const SHIELD_AC = 2;

/**
 * O escudo não entra em ARMORS porque não é armadura: ele ocupa UMA MÃO, e é
 * essa a regra que o inventário tem de poder recusar.
 */
export const SHIELD = {
  id: 'escudo', name: 'Escudo', tipo: 'escudo', art: 'escudo',
  ac: SHIELD_AC, peso: 6, custo: 10, fonte: 'srd',
  desc: '+2 de CA. Ocupa uma das mãos, então não combina com arma de duas mãos.',
};
