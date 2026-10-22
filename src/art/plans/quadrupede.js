// PLANO CORPORAL: quadrúpede.
//
// Contrato de todo plano em `plans/`:
//   paintX(kit, look, dir, pose)
//     kit  { px, cut, volume, contato, coluna, traco, disco } de `art/kit.js`
//     look o registro de `art/looks.js`
//     dir  'front' | 'side' | 'back'
//     pose { kind: 'idle'|'attack'|'hurt'|'down', frame: 0|1 }
//   Tudo é medido PARA CIMA a partir da linha do chão (y negativo), com x=0 no
//   centro da célula. A célula tem 52x80 e 75 px úteis de altura.
//
// Este plano não passa por `body.js` — a anatomia de quatro patas não é a mesma
// conta. O que importa é a proporção contra os bípedes: o lobo é mais baixo que
// um goblin na cernelha e bem mais comprido, que é como um animal ocupa o
// quadrado sem parecer um humanoide agachado.

import { ramp } from '../kit.js';

const r = Math.round;

/**
 * Quadrúpedes: lobo, mastim, javali, urso e afins.
 *
 * Não passa por `body.js` — a anatomia de quatro patas não é a mesma conta.
 * O que importa aqui é a proporção contra os bípedes: o lobo é mais baixo que
 * um goblin na cernelha e bem mais comprido, que é como um animal ocupa o
 * quadrado sem parecer um humanoide agachado.
 */
export function paintQuadrupede({ px, volume, contato }, look, dir, pose) {
  const down = pose.kind === 'down';
  const step = pose.kind === 'attack' ? 3 : pose.frame === 1 ? 1 : 0;
  const crouch = pose.kind === 'attack' ? 2 : 0;
  const body = look.outfit;
  const dark = look.outfitDark;
  const fur = look.hair ?? dark;

  if (down) {
    volume(-16, -7, 32, 7, dark, { topo: 1, base: 1 });
    contato(-16, -1, 32, dark);
    volume(11, -12, 8, 5, body, { topo: 1 });
    px(17, -11, 3, 2, ramp(look.skin, -1));
    volume(-20, -10, 5, 4, body, { topo: 1 });
    return;
  }

  if (dir === 'side') {
    volume(-11 - step, -9, 4, 9, ramp(dark, -2), { topo: 0 });   // patas de trás
    volume(3 - step, -9, 4, 9, ramp(dark, -2), { topo: 0 });

    volume(-15, -21 + crouch, 30, 12, body, { topo: 1 });        // tronco
    contato(-15, -10 + crouch, 30, body);
    volume(-16, -20 + crouch, 5, 11, dark, { topo: 1 });         // quarto traseiro
    volume(8, -23 + crouch, 9, 11, fur, { topo: 1 });            // cupim
    for (let c = 0; c < 9; c += 2) px(8 + c, -20 + crouch, 1, 6, ramp(fur, -2));

    volume(-8 + step, -9, 4, 9, dark, { topo: 0 });              // patas da frente
    volume(6 + step, -9, 4, 9, dark, { topo: 0 });
    for (const fx of [-9 - step, 1 - step, -8 + step, 6 + step]) {
      volume(fx, -3, 6, 3, ramp(dark, -1), { topo: 1 });
      px(fx, -1, 6, 1, ramp(dark, -4));
    }

    volume(11, -30 + crouch, 11, 10, body, { topo: 1 });         // cabeça
    volume(20, -26 + crouch, 6, 5, ramp(body, -1), { topo: 1 }); // focinho
    px(25, -26 + crouch, 2, 2, '#201a16');                       // tromba
    px(20, -22 + crouch, 6, 1, '#ebe3cf');                       // dentes
    px(21, -21 + crouch, 1, 1, '#ffffff');
    px(24, -21 + crouch, 1, 1, '#ffffff');
    px(17, -27 + crouch, 3, 2, ramp(look.eyes, -2));
    px(17, -27 + crouch, 2, 1, look.eyes);
    volume(11, -35 + crouch, 4, 5, dark, { topo: 1 });           // orelhas
    volume(16, -35 + crouch, 4, 5, ramp(dark, -1), { topo: 1 });
    px(12, -34 + crouch, 2, 3, ramp(look.skin, -2));
    px(17, -34 + crouch, 2, 3, ramp(look.skin, -3));
    volume(-21, -25 + crouch, 6, 9, body, { topo: 1 });          // cauda
    volume(-23, -27 + crouch, 4, 6, fur, { topo: 1 });
  } else {
    volume(-10, -20, 20, 14, body, { topo: 1 });
    contato(-10, -7, 20, body);
    volume(-11 - step, -9, 5, 9, dark, { topo: 0 });
    volume(6 + step, -9, 5, 9, dark, { topo: 0 });
    volume(-12 - step, -3, 7, 3, ramp(dark, -1), { topo: 1 });
    volume(5 + step, -3, 7, 3, ramp(dark, -1), { topo: 1 });

    volume(-9, -24, 18, 6, fur, { topo: 1 });                    // peitoral
    volume(-8, -33, 16, 11, body, { topo: 1 });                  // cabeça
    volume(-4, -26, 8, 5, ramp(body, -1), { topo: 1 });          // focinho
    px(-2, -23, 4, 1, '#ebe3cf');
    px(-2, -25, 4, 2, '#201a16');
    for (const ex of [-6, 2]) {
      px(ex, -30, 4, 3, ramp(look.eyes, -2));
      px(ex, -30, 3, 2, look.eyes);
      px(ex + 1, -30, 1, 1, '#ffffff');
    }
    volume(-10, -38, 5, 6, dark, { topo: 1 });
    volume(5, -38, 5, 6, ramp(dark, -1), { topo: 1 });
    px(-9, -37, 3, 4, ramp(look.skin, -2));
    px(6, -37, 3, 4, ramp(look.skin, -3));
  }
}
