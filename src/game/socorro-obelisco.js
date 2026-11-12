// O GRUPO DE SOCORRO (o Obelisco, capítulo 8, "se o grupo falhar"). Se os fanáticos da Ânima ou a Refração de Ilvaash
// vencem o grupo, o livro não acaba a campanha: os heróis ficam incapacitados e presos no labirinto, e a Gwyn Oresong
// manda buscar reforço em Neverwinter. Os jogadores fazem PERSONAGENS NOVOS, que correm para parar o ritual e, vencendo,
// podem soltar os antigos antes de o labirinto os absorver.
//
// No jogo: a derrota nessas duas lutas oferece o socorro. Os antigos ficam guardados (`camp.obelisco8.socorro.presos`,
// cópia funda, com 1 PV) colados na parede de B22, junto da poça; o socorro são quatro heróis do rol que não estavam no
// grupo, no mesmo nível, que chegam pelo portal de Illithinoch a B1 com o que o rol dá de equipamento. A campanha segue de
// onde estava: o que os antigos fizeram continua feito. Soltá-los é uma ação em B22, com ninguém hostil por perto
// (`labirinto-salgado.js`), e eles voltam ao grupo como estão.
import { narrar } from '../view/narrativa.js';
import { HEROIS } from './herois.js';
import { montarHeroi } from './criacao.js';
import { subirNivel } from '../rules/progressao.js';
import { XP_POR_NIVEL } from '../rules/progressao.js';

export function estadoDoSocorro(camp) {
  const o8 = (camp.obelisco8 ??= { feito: {} });
  return o8.socorro ?? null;
}

/** Monta os heróis de socorro: os primeiros do rol que não estão entre os presos, no nível deles. */
export function montarSocorro(presos, nivel, quantos = 4) {
  const ids = new Set(presos.map((c) => c.id));
  const novos = [];
  for (const def of HEROIS) {
    if (novos.length >= quantos) break;
    if (ids.has(def.id)) continue;
    const c = montarHeroi(def.id);
    while ((c.level ?? 1) < nivel) subirNivel(c, {});
    c.xp = Math.max(c.xp ?? 0, XP_POR_NIVEL[c.level] ?? 0);
    c.hp = c.maxHp;
    novos.push(c);
  }
  return novos;
}

/**
 * A derrota: oferece o socorro. Devolve true se ele foi mandado (a cena nova já foi aberta), false se a campanha acaba.
 * `onde`: 'refracao' ou 'anima'.
 */
export async function oferecerSocorro(app, camp, grupo, onde) {
  if (estadoDoSocorro(camp)?.presos?.length) return false;   // o socorro também caiu: não há segundo socorro
  const r = await narrar(app.root, { formato: 'tela', paginas: [{ titulo: 'Presos no labirinto', texto: [
    onde === 'refracao'
      ? 'A Refração não mata vocês. Ela os deixa vazios, sem vontade, e as paredes do labirinto se fecham devagar em volta: vocês ficam colados na carne de B22, junto da poça, de olhos abertos, esperando o labirinto terminar de engolir.'
      : 'Os fanáticos não perdem tempo matando vocês. Levam os corpos sem vontade de volta pela Poça e os colam na parede do labirinto, junto da poça de B22: o labirinto termina o serviço, devagar.',
    'Em Phandalin, a Gwyn Oresong espera três dias. No quarto, manda um corvo a Neverwinter, com tudo o que sabe, e um pedido.',
  ] }], escolhas: [
    { rotulo: 'Mandar um grupo de socorro', valor: 'socorro', primaria: true },
    { rotulo: 'Encerrar a campanha', valor: 'fim' },
  ] });
  if (r !== 'socorro') return false;
  const presos = grupo.filter((c) => c && !c.refemDoObelisco).map((c) => {
    const p = structuredClone({ ...c, pos: undefined });
    p.hp = 1;
    p.dead = false;
    p.conditions = (p.conditions ?? []).filter((k) => k.id === 'exausto');
    p.concentrating = null;
    return p;
  });
  const nivel = Math.max(1, ...presos.map((c) => c.level ?? 1));
  (camp.obelisco8 ??= { feito: {} }).socorro = { presos, onde, nivel, soltos: [] };
  const novos = montarSocorro(presos, nivel);
  await narrar(app.root, { formato: 'tela', paginas: [{ titulo: 'O socorro', texto: [
    `Uma semana depois, ${novos.map((c) => c.name).join(', ')} chegam de Neverwinter. A Gwyn os leva ao porão do Gigante, pelo túnel, até a fortaleza dos devoradores e ao portal de onde o grupo não voltou.`,
    'O que os outros fizeram continua feito. O que falta, falta a vocês: parar o ritual, e soltar quem ficou colado na parede, se ainda der tempo.',
  ] }] });
  app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'labirintoSalgado', continuarCom: novos });
  return true;
}
