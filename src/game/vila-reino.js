// A VILA TOMADA PELO REINO DISTANTE ("Transformation of Phandalin", o Obelisco): a cada capítulo, do 5 ao 8, Phandalin
// muda um pouco mais — o céu cinzento, o fungo nas frestas, a erva de carne nas paredes, o céu verde —, e cada mudança soma
// com as de antes. Vencida a Refração de Ilvaash, a vila está curada (`obelisco7-vila.js epilogo`) e volta a ser o que era.
//
// O livro dá a mudança como descrição para o mestre ler; aqui ela é a primeira coisa que o grupo vê ao chegar em cada
// capítulo novo (uma vez por capítulo) e o TOM do mapa da vila (`view/vila.js`, a classe `estagio-N`). Texto nosso.
import { narrar } from '../view/narrativa.js';
import { estagioDoObelisco } from './npc-saber-comum.js';

/**
 * Em que ponto da transformação a vila está: 0 (antes do capítulo 5, ou curada), 5, 6, 7 ou 8. Os marcos são os de cada
 * capítulo: a Mina Perdida concluída, o contrato do Harbin pago, os três guardiões vencidos e o portal de Illithinoch aberto.
 */
export const estagioDaVila = (camp) => estagioDoObelisco(camp);

/** O que muda em cada capítulo (soma com o de antes). */
export const VILA_NO_ESTAGIO = {
  5: 'O céu sobre Phandalin amanheceu cinzento e não clareou mais. As casas parecem mais baças do que deviam, e o povo anda com cara de quem dormiu mal a semana inteira.',
  6: 'Nas frestas das paredes e entre as pedras da rua cresce um fungo miúdo, com escamas, que quase não se nota. Quem vocês cumprimentam responde devagar, pálido, como quem está chocando uma doença.',
  7: 'Uma erva carnuda, que lembra tentáculo, sobe pelas paredes e atravessa a rua. O povo tem sintomas que ninguém sabe nomear: um tique que não para, uma língua que ninguém ensinou, uma mancha que se mexe na pele.',
  8: 'O céu de Phandalin ficou de um verde claro e doente. A erva engrossou e se enrola nas vigas e nas colunas como talos. As casas parecem tortas, sem estar caindo, e as sombras das árvores ondulam quando ninguém olha direto. Há gente com tentáculos, e gente com raiva sem motivo.',
};

/** Na chegada à vila: a mudança do capítulo, uma vez por capítulo. */
export async function mostrarMudancaDaVila(app, camp) {
  const n = estagioDaVila(camp);
  if (!n || (camp.vilaEstagioVisto ?? 0) >= n) return;
  camp.vilaEstagioVisto = n;
  await narrar(app.root, { formato: 'painel', paginas: [{ titulo: 'Phandalin', texto: [VILA_NO_ESTAGIO[n]] }] });
}
