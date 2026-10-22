// REGISTRO DE PLANOS CORPORAIS.
//
// O pintor humanoide (`art/draw.js`) é o padrão. Toda criatura que não cabe
// naquela anatomia — aranha, gosma, morto-vivo, dragão, stirge — declara um
// `plan` no seu look e ganha um pintor próprio, no seu arquivo, aqui dentro.
//
// CONTRATO
//   export function paintX(kit, look, dir, pose)
//     kit   { px, cut, volume, contato, coluna, traco, disco } de `art/kit.js`
//     look  o registro de `art/looks.js`
//     dir   'front' | 'side' | 'back'
//     pose  { kind: 'idle' | 'attack' | 'hurt' | 'down', frame: 0 | 1 }
//
//   Coordenadas: x = 0 é o centro da célula, y cresce PARA BAIXO mas tudo se
//   mede para cima a partir da linha do chão, então y é negativo. A célula tem
//   52x80 px, com 75 px úteis de altura.
//
//   Escala: o humano médio mede 58 px e o goblin 41. Uma criatura Grande deve
//   passar de 70; uma Miúda fica abaixo de 25. Essa comparação é o que faz o
//   tabuleiro ter sentido de tamanho.
//
//   Nenhum plano deve importar `draw.js` — só `../kit.js` e, se precisar de
//   medidas humanoides, `../body.js`.

import { paintQuadrupede } from './quadrupede.js';
import { paintAracnideo } from './aracnideo.js';
import { paintMortoVivo } from './mortoVivo.js';
import { paintAberracao } from './aberracao.js';
import { paintFeras } from './feras.js';
import { paintDragao } from './dragao.js';

const PLANOS = {
  quadrupede: paintQuadrupede,
  aracnideo: paintAracnideo,
  mortoVivo: paintMortoVivo,
  aberracao: paintAberracao,
  feras: paintFeras,
  dragao: paintDragao,
};

/** Registra um plano novo. Chamado pelos módulos de família ao carregarem. */
export function registerPlan(nome, fn) {
  PLANOS[nome] = fn;
}

/** Devolve o pintor do look, ou null se ele for humanoide. */
export function planFor(look) {
  // `quadruped: true` é a forma antiga; continua valendo.
  const nome = look.plan ?? (look.quadruped ? 'quadrupede' : null);
  return nome ? PLANOS[nome] ?? null : null;
}

export const planNames = () => Object.keys(PLANOS);
