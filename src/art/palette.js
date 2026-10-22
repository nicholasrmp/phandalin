// Rampa de cor com deslocamento de matiz.
//
// POR QUE ISTO EXISTE
// A primeira versão escurecia multiplicando o RGB: `#c0714a × 0.74`. Isso
// funciona num editor de planilha e não funciona em arte. Multiplicar leva
// toda cor para o mesmo cinza, as sombras ficam lavadas e a figura inteira
// parece barata — foi a principal razão de os bonecos saírem "feinhos".
//
// O que arte de pixel faz há trinta anos é DESLOCAR O MATIZ junto com o
// brilho: sombra caminha para o azul-arroxeado e ganha saturação, luz caminha
// para o amarelo e perde um pouco. É o que dá a sensação de luz quente batendo
// num objeto sob céu frio, e é de graça — só muda a conta.
//
// Toda cor do pintor passa por aqui.

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

export function toHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h * 60, s, l };
}

export function fromHsl(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = clamp(s);
  l = clamp(l);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rgb;
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const ch = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${ch(rgb[0])}${ch(rgb[1])}${ch(rgb[2])}`;
}

/**
 * Caminho mais curto de um matiz até outro, andando `fracao` do trajeto, com
 * TETO em graus.
 *
 * O teto não é refinamento, é correção de bug: a pele tem matiz perto de 28° e
 * o caminho mais curto até os 258° da sombra vai para TRÁS, passando pelo
 * magenta. Sem limite, uma sombra forte na pele saía rosa-choque — mão, bota e
 * boca ficaram fluorescentes. Trinta graus é o quanto dá para andar antes de a
 * cor deixar de ser o mesmo material.
 */
function rumo(h, alvo, fracao, teto = 30) {
  const d = ((alvo - h + 540) % 360) - 180;
  const passo = Math.max(-teto, Math.min(teto, d * fracao));
  return h + passo;
}

const QUENTE = 42;    // matiz da luz: sol, tocha, ouro
const FRIO = 258;     // matiz da sombra: céu, azul-arroxeado

/**
 * Um degrau na rampa. `passo` positivo clareia, negativo escurece; 1 degrau é
 * uma diferença visível sem quebrar o material, 3 é o limite antes de a cor
 * deixar de parecer o mesmo objeto.
 */
export function ramp(hex, passo) {
  if (passo === 0) return hex;
  const { h, s, l } = toHsl(hex);
  const n = Math.abs(passo);
  // A saturação CAMINHA PARA UM PIVÔ em vez de só subir ou só descer. Cor
  // saturada perde saturação ao escurecer — pele viva vira marrom, não vermelho
  // de incêndio; cor apagada ganha um pouco, que é o que tira o cinza morto do
  // metal na sombra. Somar saturação em tudo foi o que deixou a sombra da pele
  // em `#e23430`.
  if (passo > 0) {
    return fromHsl(
      rumo(h, QUENTE, 0.05 * n, 12),
      clamp(s + (0.42 - s) * 0.10 * n),
      // Passo PROPORCIONAL ao brilho que a cor já tem. Somar um valor fixo
      // esmaga o couro escuro em preto nos mesmos três degraus que só deixam a
      // pele clara um pouco mais escura.
      clamp(l + (1 - l) * 0.18 * n, 0, 0.97),
    );
  }
  return fromHsl(
    rumo(h, FRIO, 0.05 * n, 10),
    clamp(s + (0.45 - s) * 0.10 * n),
    clamp(l * (1 - 0.13 * n), 0.05, 1),
  );
}

/**
 * Compatível com a antiga `shade(cor, multiplicador)`, para não ter de reescrever
 * as centenas de chamadas do pintor — mas por dentro é a rampa com matiz.
 * 1.22 vira um degrau e meio de luz; 0.74 vira quase três de sombra.
 */
export function shade(hex, mult) {
  return ramp(hex, (mult - 1) * 11);
}

export const lit = (c) => ramp(c, 2);
export const dim = (c) => ramp(c, -2);
export const deep = (c) => ramp(c, -4);

/** Luminância relativa, usada para garantir contraste entre barba e pele. */
export const lum = (hex) => toHsl(hex).l;
