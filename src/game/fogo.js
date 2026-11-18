// APAGAR E ACENDER O FOGO DO MAPA — a fogueira, a tocha de parede, o braseiro.
//
// Toda luz de `mapa.luzes` vira uma coisa em que o grupo mexe. Apagar abafa a brasa ou afoga a chama; acender pede
// fogo na mão (uma tocha, acesa ou na mochila). As duas mexem em DUAS camadas ao mesmo tempo, e esse é o ponto:
//
//   a regra    a luz deixa de contar para a visão (`rules/luz.js` pula a luz `apagada`), então o cômodo cai no
//              breu do mapa — quem não tem visão no escuro deixa de enxergar ali, e quem está ali fica escondido;
//   a arte     a luz pode trazer `sobreposicao`, o id da peça que pinta o cômodo aceso (no Esconderijo, a pintura
//              da FA com a cor do fogo), e ela some ou volta junto. Sem isso o desenho continuaria mostrando a
//              fogueira brilhando sobre uma sala que a regra já pôs no escuro.
//
// A fogueira apagada também deixa de queimar quem pisa nela (`fogueiraAcesa`): o capítulo 2 consulta isto.
//
// Fora da luta é de graça; na luta custa a ação, como usar um objeto. Puro: roda em Node.
import { distanceFt } from '../core/grid.js';
import { garantirInventario } from '../rules/equipment.js';
import { EFEITOS_DAS_CHAMAS, chamaNaCasa } from '../rules/chamas.js';
import { magiasProntas } from '../rules/spells.js';

const NOMES = { fogueira: 'a fogueira', tocha: 'a tocha', braseiro: 'o braseiro', vela: 'a vela', lanterna: 'a lanterna' };

/** A luz do mapa nesta casa, se houver. */
export const luzNaCasa = (field, p) => (field.luzes ?? []).find((l) => l.pos?.x === p.x && l.pos?.y === p.y) ?? null;

/** A brasa desta casa queima? Fogueira, e a luz dela (se houver) não está apagada. */
export const fogueiraAcesa = (field, x, y) => field.surfaceAt(x, y) === 'fogueira' && !luzNaCasa(field, { x, y })?.apagada;

/** Fogo na mão: uma tocha acesa, ou uma na mochila para riscar. */
export const temFogo = (c) => Boolean(c?.tochaAcesa || garantirInventario(c).bag.some((i) => i.id === 'tocha' && i.qtd > 0));

/** Apaga ou acende a luz, e a peça de arte que vai com ela. Devolve `true` se mudou. */
export function mudarFogo(field, luz, acesa) {
  if (Boolean(!luz.apagada) === acesa) return false;
  if (acesa) delete luz.apagada;
  else luz.apagada = true;
  if (luz.sobreposicao) field.alternarSobreposicao?.(luz.sobreposicao, acesa);
  // a peça que pinta o lugar APAGADO (o forno frio de Talhundereth): o contrário da de cima, acende quando o fogo apaga
  if (luz.sobreposicaoApagada) field.alternarSobreposicao?.(luz.sobreposicaoApagada, !acesa);
  field.versao = (field.versao ?? 0) + 1;        // a visão e o véu se recalculam
  return true;
}

/**
 * A opção do menu para a luz desta casa, ou `null`. `fora`: fora da luta (de graça). `depois`: o que a cena quer
 * fazer em seguida (o capítulo 2 fecha o turno da luta e redesenha).
 */
// Os MÓVEIS DE FOGO: quem clica neles quer a chama, mesmo que ela more na casa do lado.
const MOVEL_DE_FOGO = new Set(['braseiro', 'braseiroFrio', 'fogueira', 'lareira', 'forja']);

/**
 * A luz desta casa, ou — se a casa é um móvel de fogo que barra o passo — a da casa encostada. A luz precisa morar em
 * casa de chão (ninguém a alcançaria dentro do móvel), então o braseiro da cripta da Mansão tem a chama em (18,8) e o
 * desenho em (19,8): o botão direito no braseiro pintado não oferecia apagar nada (revisão de 2026-11-13).
 */
export function luzDoMovel(field, tile) {
  const aqui = luzNaCasa(field, tile);
  if (aqui || !MOVEL_DE_FOGO.has(field.surfaceAt?.(tile.x, tile.y))) return aqui;
  return (field.luzes ?? []).find((l) => l.pos && Math.max(Math.abs(l.pos.x - tile.x), Math.abs(l.pos.y - tile.y)) === 1) ?? null;
}

export function opcaoDeFogo(enc, c, tile, { fora, nome = null, depois = () => {} } = {}) {
  const luz = luzDoMovel(enc.field, tile);
  // NEM TODA LUZ É CHAMA. A fumaça venenosa do dragão de Árvore Trovão é uma luz do mapa (verde, 12 m de
  // penumbra, só no escuro) que a cena da Forgotten Adventures põe no covil — e o menu oferecia "Apagar a
  // vela" em cima dela. Não se abafa veneno com terra e cinza. `semChama` marca a luz que ilumina sem
  // queimar: ela acende, entra na visão, e não tem botão.
  if (!luz || !c || luz.semChama) return null;
  const qual = nome ?? luz.nome ?? NOMES[luz.tipo] ?? 'a luz';
  const acesa = !luz.apagada;
  const longe = distanceFt(c.pos, tile) > 5 ? `longe demais — encoste (está a ${distanceFt(c.pos, tile)} pés)` : null;
  const semAcao = !fora && c.actionUsed ? 'a ação deste turno já foi usada' : null;
  const semFogo = !acesa && !temFogo(c) ? `${c.name} não tem fogo: precisa de uma tocha` : null;
  return {
    rotulo: `${acesa ? 'Apagar' : 'Acender'} ${qual}`,
    icone: 'acao-usarObjeto',
    detalhe: fora ? 'de graça' : 'gasta a ação',
    motivo: longe ?? semAcao ?? semFogo,
    fazer: () => {
      if (!fora) c.actionUsed = true;
      mudarFogo(enc.field, luz, !acesa);
      enc.say('acao', acesa
        ? `${c.name} abafa ${qual} com terra e cinza. O escuro volta a tomar o lugar.`
        : `${c.name} encosta a tocha e ${qual} pega. A luz volta a encher o lugar.`);
      depois({ luz, acesa: !acesa });
    },
  };
}

/**
 * CONTROLAR CHAMAS pelo menu da chama (o truque do Xanathar, `rules/chamas.js`): quem o conhece apaga, dobra ou corta a
 * luz de uma chama a até 18 m que vê, sem encostar e sem tocha. Fora da luta sai de graça, pelo efeito; na luta, é a magia
 * de verdade (`castSpell`), que gasta a ação. Devolve as opções (vazio se não serve).
 */
export function opcoesDeControlarChamas(enc, c, tile, { fora, depois = () => {} } = {}) {
  const luz = chamaNaCasa(enc.field, tile);
  if (!luz || !c || !magiasProntas(c).includes('controlarChamas')) return [];
  const longe = distanceFt(c.pos, tile) > 60 ? `longe demais — a magia alcança 18 m (está a ${distanceFt(c.pos, tile)} pés)` : null;
  const semVista = !longe && !enc.field.hasLineOfSight(c.pos, tile) ? 'não se vê a chama daqui' : null;
  const semAcao = !fora && c.actionUsed ? 'a ação deste turno já foi usada' : null;
  const qual = luz.nome ?? NOMES[luz.tipo] ?? 'a chama';
  // "a luz DA fogueira", "a luz DO braseiro": a preposição contrai com o artigo do nome
  const daQual = qual.replace(/^a /, 'da ').replace(/^o /, 'do ').replace(/^(?!d[ao] )/, 'de ');
  const fazer = (opcao) => () => {
    if (fora) EFEITOS_DAS_CHAMAS.controlarChamas(enc, c, { name: 'Controlar Chamas' }, { point: { x: tile.x, y: tile.y }, opcao });
    else {
      const r = enc.castSpell(c, 'controlarChamas', { point: { x: tile.x, y: tile.y }, opcao });
      if (!r.ok) { enc.say('aviso', r.why ?? 'a magia não saiu'); return; }
    }
    depois({ luz, opcao });
  };
  const comum = { icone: 'magia-controlarChamas', detalhe: fora ? 'Controlar Chamas, de graça' : 'Controlar Chamas, gasta a ação', motivo: longe ?? semVista ?? semAcao };
  return [
    { ...comum, rotulo: `Apagar ${qual} de longe`, fazer: fazer('apagar') },
    { ...comum, rotulo: `Dobrar a luz ${daQual}`, fazer: fazer('dobrar') },
    { ...comum, rotulo: `Cortar a luz ${daQual} pela metade`, fazer: fazer('metade') },
  ];
}
