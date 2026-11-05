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
  field.versao = (field.versao ?? 0) + 1;        // a visão e o véu se recalculam
  return true;
}

/**
 * A opção do menu para a luz desta casa, ou `null`. `fora`: fora da luta (de graça). `depois`: o que a cena quer
 * fazer em seguida (o capítulo 2 fecha o turno da luta e redesenha).
 */
export function opcaoDeFogo(enc, c, tile, { fora, nome = null, depois = () => {} } = {}) {
  const luz = luzNaCasa(enc.field, tile);
  if (!luz || !c) return null;
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
