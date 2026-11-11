// A RÉGUA DA REGIÃO: onde fica cada lugar no MAPA OFICIAL do Obelisco ("Sword Coast region surrounding Phandalin",
// 1700 x 2216 px) e quantas milhas há entre eles. É daqui que a viagem tira os dias de marcha e, com eles, quantos testes
// de encontro aleatório o caminho rola (um de dia e um de noite, o livro).
//
// A ESCALA está na legenda do mapa: 1 hexágono = 5 milhas. O hexágono mede 92,6 px de altura (de borda a borda),
// medido sobre o mar, onde a grade não briga com o desenho: duas colunas de hexágonos deram 92,65 e 92,5. Conferido
// contra o livro: Phandalin–Poço da Coruja Velha dá 39 milhas (os "dois dias" do Daran), Phandalin–Neverwinter 50, e
// o Repouso de Zorzula fica 16 milhas a leste ("um dia de marcha").
//
// As posições são o CENTRO DO SÍMBOLO de cada lugar no mapa (o círculo da vila, o quadrado da ruína, o X do ponto de
// interesse). A Mina Hardyhammer é o "Missing Miners" do mapa: 10 milhas ao sul-sudoeste (o texto do capítulo fala em
// 15; vale o mapa, que é o que o jogador vê).
//
// Este arquivo é regra e não importa imagem nenhuma: a arte oficial fica só no disco (`public/mapas/oficial/`, fora do
// repositório e da publicação), e a distância vale do mesmo jeito sem ela.

export const MAPA_OFICIAL_DA_REGIAO = { w: 1700, h: 2216 };
export const MILHAS_POR_HEX = 5;
export const PX_POR_HEX = 92.6;
export const KM_POR_MILHA = 1.609;

/** Centro do símbolo de cada lugar, em px do mapa oficial. */
export const POSICOES_OFICIAIS = {
  phandalin: { x: 974, y: 1740 },
  poco: { x: 1582, y: 1352 },
  cume: { x: 1584, y: 1512 },
  conyberry: { x: 1428, y: 1158 },
  arvoreTrovao: { x: 698, y: 1006 },
  castelo: { x: 948, y: 1336 },
  ondaEco: { x: 1160, y: 1724 },
  zorzula: { x: 1274, y: 1716 },
  hardyhammer: { x: 900, y: 1910 },
  talhundereth: { x: 1548, y: 898 },
  // o segundo X das colinas de Starmetal, a sudeste do de Talhundereth (medido na arte do mapa de jogador)
  encruzilhada: { x: 1608, y: 962 },
  neverwinter: { x: 370, y: 1046 },
  leilon: { x: 708, y: 1966 },
};

/** A posição em % do mapa oficial (para o pino na tela), ou null se o lugar não está nele. */
export function posicaoOficial(id) {
  const p = POSICOES_OFICIAIS[id];
  if (!p) return null;
  return { x: Math.round((p.x / MAPA_OFICIAL_DA_REGIAO.w) * 1000) / 10, y: Math.round((p.y / MAPA_OFICIAL_DA_REGIAO.h) * 1000) / 10 };
}

/** Milhas em linha reta entre dois lugares, pela grade do mapa oficial. */
export function milhasEntre(a, b) {
  const pa = POSICOES_OFICIAIS[a];
  const pb = POSICOES_OFICIAIS[b];
  if (!pa || !pb) return null;
  return (Math.hypot(pa.x - pb.x, pa.y - pb.y) / PX_POR_HEX) * MILHAS_POR_HEX;
}

/** Quilômetros (de 2 em 2, como a viagem os mostra) entre dois lugares. */
export function kmEntre(a, b) {
  const mi = milhasEntre(a, b);
  return mi == null ? null : Math.round((mi * KM_POR_MILHA) / 2) * 2;
}
