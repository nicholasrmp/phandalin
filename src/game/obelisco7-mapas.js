// OS PONTOS DAS CENAS DO CAPÍTULO 7 DO OBELISCO NA VILA, à parte das cenas para o `encounter.js` (que roda em Node, nos
// testes) não puxar a tela junto. A briga do santuário usa o mapa do largo do capítulo 6 (`obelisco6-mapas.js`).

import { MAPA_LARGO_DA_VACA } from './obelisco6-mapas.js';

/** Os pontos da briga no largo (o mapa é o do capítulo 6): o grupo vem do oeste, os três estão diante do santuário. */
export const PONTOS_CAP7_VILA = {
  SANTUARIO_INFECTADO: {
    grupo: [{ x: 2, y: 4 }, { x: 2, y: 5 }, { x: 1, y: 4 }, { x: 1, y: 5 }],
    olhar: { dx: 1, dy: 0 },
    moradores: [{ x: 6, y: 8 }, { x: 8, y: 7 }, { x: 4, y: 8 }],
    // a porta do santuário (as folhas da casa do meio do largo)
    porta: { x: 5, y: 10 },
  },
};

/** Quem são os três. A Irmã Garaele é elfa; o bloco é o mesmo para os três. */
export const MORADORES = [
  { nome: 'Irmã Garaele', id: 'garaele' },
  { nome: 'Halia Thornton', id: 'halia' },
  { nome: 'Ander', id: 'ander' },
];

/** O que se olha no largo, nesta briga (os objetos do capítulo 6 falam da vaca). */
export const INTERATIVOS_SANTUARIO = [
  { x: 5, y: 10, id: 'portaDoSantuario', rotulo: 'Olhar a porta do santuário', texto: 'A porta do Santuário da Sorte está escancarada, e lá dentro as velas foram todas derrubadas. No altar consertado, alguém arranhou a madeira com as unhas, em linhas tortas que não formam letra nenhuma.' },
  { x: 2, y: 10, id: 'carrocaVirada', rotulo: 'Olhar a carroça', texto: 'Uma carroça de feno empurrada de lado, com a roda torta. Atrás dela, duas crianças espiam a rua, até a mãe as puxar para dentro.' },
  { x: 4, y: 17, id: 'fonteSeca', rotulo: 'Olhar a fonte seca', texto: 'As pedras da fonte velha, em roda. Um balde de água largado no meio delas, ainda cheio: quem estava buscando água largou tudo e correu.' },
];


/** O mapa da briga: o largo do capítulo 6, com os objetos desta cena (os de lá falam da vaca). */
export const MAPA_SANTUARIO_INFECTADO = { ...MAPA_LARGO_DA_VACA, interativos: INTERATIVOS_SANTUARIO };
