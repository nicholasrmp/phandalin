// PLANO CORPORAL: dragao — ver ELENCO.md secao 3 para o contrato.
//
// Esqueleto gerado. O agente dono deste arquivo substitui o corpo da funcao.

import { ramp } from '../kit.js';

const r = Math.round;

export function paintDragao(kit, look, dir, pose) {
  const { px, volume } = kit;
  // placeholder: um vulto, para o registro funcionar antes do trabalho de arte
  volume(-8, -20, 16, 20, look.outfit ?? '#6a6058', { topo: 1, base: 1 });
  px(-4, -16, 3, 3, look.eyes ?? '#d8a23a');
  px(2, -16, 3, 3, look.eyes ?? '#d8a23a');
}
