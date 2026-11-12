// AS FAMÍLIAS DO LIVRO DO MESTRE, uma peça por tipo: o livro tem um anel, uma armadura e uma poção de resistência por
// tipo de dano, e uma cota de escamas por cor de dragão. O catálogo à mão (`magic.js`) tem o genérico de cada família, que
// não sabe o tipo e por isso não faz nada; aqui saem as peças que sabem. Gerado, não escrito: um tipo novo é uma linha.
//
// O anel e a poção são itens de mochila; a armadura e a cota de escamas declaram a `base` e `index.js` as promove a
// armadura de verdade, como as +1. A armadura de resistência sai em toda armadura do SRD, porque o livro a dá em qualquer
// uma — a mesma conta das +1.
import { ARMORS } from './armors.js';

/** Os tipos que as famílias de resistência cobrem (o livro deixa de fora os três físicos). */
export const TIPOS_RESISTIVEIS = ['ácido', 'frio', 'fogo', 'energético', 'elétrico', 'necrótico', 'veneno', 'psíquico', 'radiante', 'trovejante'];

/** O pedaço do id de cada tipo (`anelDeResistenciaFogo`). */
export const SUFIXO = {
  'ácido': 'Acido', frio: 'Frio', fogo: 'Fogo', 'energético': 'Energetico', 'elétrico': 'Eletrico', 'necrótico': 'Necrotico',
  veneno: 'Veneno', 'psíquico': 'Psiquico', radiante: 'Radiante', trovejante: 'Trovejante',
};

/** A cor de cada dragão e o tipo do sopro dele, que a cota de escamas resiste. */
export const DRAGOES = {
  negro: ['Negro', 'ácido'], azul: ['Azul', 'elétrico'], latao: ['DeLatao', 'fogo'], bronze: ['DeBronze', 'elétrico'],
  cobre: ['DeCobre', 'ácido'], dourado: ['Dourado', 'fogo'], verde: ['Verde', 'veneno'], vermelho: ['Vermelho', 'fogo'],
  prateado: ['Prateado', 'frio'], branco: ['Branco', 'frio'],
};
const NOME_DO_DRAGAO = {
  negro: 'negro', azul: 'azul', latao: 'de latão', bronze: 'de bronze', cobre: 'de cobre', dourado: 'dourado',
  verde: 'verde', vermelho: 'vermelho', prateado: 'prateado', branco: 'branco',
};

const comum = { tipo: 'mágico', pilha: false, fonte: 'dmg' };

/** "dano de ácido", "dano de fogo", mas "dano necrótico", "dano psíquico": o tipo que é substantivo pede o "de". */
export const danoDe = (t) => (['ácido', 'frio', 'fogo', 'veneno'].includes(t) ? `dano de ${t}` : `dano ${t}`);

/** Os anéis e as poções de resistência, um por tipo (itens de mochila). */
export const VARIANTES_DE_MOCHILA = Object.fromEntries(TIPOS_RESISTIVEIS.flatMap((t) => [
  [`anelDeResistencia${SUFIXO[t]}`, {
    ...comum, id: `anelDeResistencia${SUFIXO[t]}`, name: `Anel de resistência (${t})`, tipo: 'anel', art: 'arcano',
    raridade: 'raro', sintonia: true, peso: 0, deFamilia: 'anelDeResistencia',
    desc: `Resistência a ${danoDe(t)}, enquanto sintonizado.`, passivo: { resiste: [t] },
  }],
  [`pocaoDeResistencia${SUFIXO[t]}`, {
    ...comum, id: `pocaoDeResistencia${SUFIXO[t]}`, name: `Poção de resistência (${t})`, tipo: 'poção', art: 'cura', pilha: true,
    raridade: 'incomum', sintonia: false, peso: 0.5, deFamilia: 'pocaoDeResistencia',
    desc: `Uma ação para beber: resistência a ${danoDe(t)} por uma hora.`,
    consumivel: 'condicao', condicao: 'resistenciaDaPocao', dadosDaCondicao: { tipo: t }, rodadas: 600, acao: 'acao',
  }],
]));

/** As armaduras de resistência (uma por armadura do SRD e por tipo) e as cotas de escamas de dragão: com `base`. */
export const VARIANTES_COM_BASE = [
  ...Object.values(ARMORS).filter((a) => a.fonte === 'srd' && a.id !== 'nenhuma').flatMap((a) => TIPOS_RESISTIVEIS.map((t) => ({
    ...comum, id: `${a.id}DeResistencia${SUFIXO[t]}`, name: `${a.name} de resistência (${t})`, tipo: 'armadura mágica', art: 'escudo',
    base: a.id, raridade: 'raro', sintonia: true, peso: a.peso, deFamilia: 'armaduraDeResistencia',
    desc: `${a.name} que dá resistência a ${danoDe(t)}, vestida e sintonizada.`, passivo: { resiste: [t] },
  }))),
  ...Object.entries(DRAGOES).map(([cor, [suf, t]]) => ({
    ...comum, id: `cotaDeEscamasDeDragao${suf}`, name: `Brunea de escamas de dragão ${NOME_DO_DRAGAO[cor]}`, tipo: 'armadura mágica',
    art: 'escudo', base: 'brunea', raridade: 'muito raro', sintonia: true, peso: 45, acBonusArmadura: 1, deFamilia: 'armaduraDeEscamasDeDragao',
    desc: `Brunea +1 feita das escamas de um dragão ${NOME_DO_DRAGAO[cor]}: resistência a ${danoDe(t)}, vestida e sintonizada. (Sentir dragões por perto, não.)`,
    passivo: { resiste: [t] },
  })),
];
