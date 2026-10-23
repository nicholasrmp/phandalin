// O kit de desenho: as ferramentas que todo plano corporal usa.
//
// Está num módulo próprio por um motivo prático. Cada família de criatura
// (humanoide, quadrúpede, aracnídeo, gosma, morto-vivo, dragão) vive no seu
// arquivo em `plans/` e importa daqui. Assim dá para escrever uma família nova
// sem encostar no pintor das outras.
//
// LUZ
//   Vem de cima e da esquerda. Nada aqui desenha retângulo chapado: cada peça
//   é um volume com coluna de luz, núcleo, sombra e uma aresta de luz
//   refletida — a borda de um cilindro nunca é o ponto mais escuro dele.

import { ramp } from './palette.js';

export { ramp };

/**
 * Monta o kit amarrado a um canvas e a uma célula.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} ox,oy  canto da célula dentro da folha
 * @param {number} w,h    tamanho da célula
 * @returns {{px,cut,volume,contato,coluna,cx,gy}}
 */
export function makeKit(ctx, ox, oy, w, h, ground, escala = 1) {
  const cx = Math.floor(w / 2);
  const gy = h - ground;

  // A ESCALA MORA AQUI, E SÓ AQUI.
  //
  // Todo desenho deste jogo — setenta figuras, sete planos corporais, duas mil
  // linhas de pintor — sai por `px`, `volume`, `coluna`, `traco` e `disco`, e
  // os cinco terminam em `px`. Multiplicar no fim de `px` é o que permite a
  // folha ter o triplo de pixels sem que uma única linha do pintor mude.
  //
  // `w`, `h`, `cx`, `gy` e tudo que o pintor calcula continuam em unidades
  // LÓGICAS. Quem pensa em pixel lógico — a câmera, a ficha, o retrato — não
  // precisa saber que a folha engordou.
  const e = Math.max(1, Math.round(escala));

  /** Retângulo relativo ao centro da célula e à linha do chão. */
  const px = (x, y, pw, ph, color) => {
    if (pw <= 0 || ph <= 0) return;
    ctx.fillStyle = color;
    ctx.fillRect((ox + (cx + x) * e), (oy + (gy + y) * e), pw * e, ph * e);
  };

  const cut = (x, y, cw = 1, ch = 1) => ctx.clearRect(
    ox + (cx + x) * e, oy + (gy + y) * e, cw * e, ch * e,
  );

  /**
   * Volume cilíndrico. A última coluna volta a clarear um degrau: é a luz
   * refletida do ambiente na aresta, e sem ela a peça lê como caixa.
   */
  const volume = (x, y, vw, vh, cor, { topo = 1, base = 0 } = {}) => {
    if (vw <= 0 || vh <= 0) return;
    px(x, y, vw, vh, cor);
    if (vw >= 5) {
      px(x + vw - 3, y, 2, vh, ramp(cor, -2));
      px(x + vw - 1, y, 1, vh, ramp(cor, -1));
    } else if (vw === 4) {
      px(x + 2, y, 1, vh, ramp(cor, -2));
      px(x + 3, y, 1, vh, ramp(cor, -1));
    } else if (vw === 3) {
      px(x + 2, y, 1, vh, ramp(cor, -2));
    } else if (vw === 2) {
      px(x + 1, y, 1, vh, ramp(cor, -1));
    }
    if (vw >= 3) px(x, y, 1, vh, ramp(cor, 2));
    if (topo) px(x, y, vw, topo, ramp(cor, 3));
    if (base) px(x, y + vh - base, vw, base, ramp(cor, -3));
  };

  /** Sombra de contato: a linha escura onde uma peça pousa sobre a outra. */
  const contato = (x, y, cw, cor) => px(x, y, cw, 1, ramp(cor, -4));

  /**
   * Coluna de largura variável — a ferramenta que tira o corpo da caixa.
   *
   * `forma(t)` devolve, para cada altura t em [0,1], o centro e a largura
   * daquela linha. Com ela o tronco vira trapézio do ombro à cintura, o braço
   * afina até o punho, a perna abre do quadril ao pé e a serpente ondula.
   * Retângulo empilhado é exatamente o que faz um boneco parecer recortado em
   * papel.
   */
  const coluna = (y, ch, forma, cor, { topo = 1, base = 0 } = {}) => {
    if (ch <= 0) return;
    const luz = ramp(cor, 2);
    const som = ramp(cor, -2);
    const ref = ramp(cor, -1);
    for (let i = 0; i < ch; i++) {
      const { c, w: cw } = forma(ch === 1 ? 0 : i / (ch - 1));
      const lw = Math.max(1, Math.round(cw));
      const x = Math.round(c) - Math.floor(lw / 2);
      let cor0 = cor;
      if (topo && i < topo) cor0 = ramp(cor, 3);
      else if (base && i >= ch - base) cor0 = ramp(cor, -3);
      px(x, y + i, lw, 1, cor0);
      if (lw >= 4) {
        px(x, y + i, 1, 1, topo && i < topo ? ramp(cor, 3) : luz);
        px(x + lw - 2, y + i, 1, 1, som);
        px(x + lw - 1, y + i, 1, 1, ref);
      } else if (lw === 3) {
        px(x + 2, y + i, 1, 1, som);
      } else if (lw === 2) {
        px(x + 1, y + i, 1, 1, ref);
      }
    }
  };

  /**
   * Linha reta entre dois pontos, com espessura. Serve para perna de aranha,
   * asa de morcego, galho de blight — tudo que é diagonal e que retângulo
   * axial não resolve.
   */
  const traco = (x0, y0, x1, y1, esp, cor) => {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const passos = Math.max(Math.abs(dx), Math.abs(dy), 1);
    for (let i = 0; i <= passos; i++) {
      const t = i / passos;
      px(Math.round(x0 + dx * t), Math.round(y0 + dy * t), esp, esp, cor);
    }
    px(x0, y0, esp, esp, ramp(cor, 2));
  };

  /** Disco achatado: olho, bolha de gosma, base de miniatura, orbe. */
  const disco = (cxo, cyo, raio, cor) => {
    for (let dy = -raio; dy <= raio; dy++) {
      const largura = Math.round(Math.sqrt(Math.max(0, raio * raio - dy * dy)) * 2);
      if (largura <= 0) continue;
      const x = cxo - Math.floor(largura / 2);
      const tom = dy < -raio * 0.3 ? ramp(cor, 2) : dy > raio * 0.4 ? ramp(cor, -2) : cor;
      px(x, cyo + dy, largura, 1, tom);
    }
    px(cxo - Math.max(1, Math.floor(raio * 0.4)), cyo - Math.max(1, Math.floor(raio * 0.4)), 1, 1, ramp(cor, 3));
  };

  // `e` sai no kit para o pintor poder perguntar quanto espaço tem. Detalhe de
  // um terço de pixel lógico cai exatamente num pixel físico quando e = 3, e
  // vira borrão quando e = 1 — então quem desenha fino precisa checar antes.
  return { px, cut, volume, contato, coluna, traco, disco, cx, gy, e };
}
