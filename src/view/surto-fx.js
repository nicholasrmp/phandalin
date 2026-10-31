// Livro do Jogador (não é SRD) — conteúdo próprio, ver NOTICE.md
// As animações dos SURTOS de magia selvagem, pedidas pelo motor com `onEvent({ type: 'surtoFx', fx, pos })` (rules/surto.js). Uma função
// só para quem joga e para o convidado do coop (view/partida-tela.js), para as duas telas não saírem do lugar.

// Altura (em px acima do chão da casa) de cada animação em sprite.
const ALTURA = { 'poof-vaso': 14, graxa: 4, 'raio-queda': 40, 'bola-de-fogo': 30, 'arcano-impacto': 30 };

export function tocarSurtoFx(board, ev) {
  if (!board?.fx || !ev?.pos) return;
  // Os disparos de um mesmo surto saem escalonados por TIPO (a onda abre primeiro, o estouro vem logo atrás, as almas depois e a confusão
  // por último) e um pouco ao acaso entre as criaturas: o grupo inteiro no mesmo quadro vira uma pilha que não se lê.
  const POR_TIPO = { 'onda-necrotica': 0, 'surto-caos': 0, 'poof-vaso': 0, 'almas-sobem': 400, 'confusao-estrelas': 550 };
  const atraso = (POR_TIPO[ev.fx] ?? 0) + Math.random() * 160;
  setTimeout(() => {
    const fx = board.fx;
    switch (ev.fx) {
      case 'surto-caos': fx.caos(ev.pos); break;
      case 'onda-necrotica': fx.onda(ev.pos, { raio: 6, dur: 1.2 }); break;
      // Com o grupo todo atingido, duas almas por alvo bastam.
      case 'almas-sobem': fx.almas(ev.pos, { n: fx.items.filter((i) => i.kind === 'almas').length > 4 ? 2 : 3 }); break;
      case 'poof-vaso': fx.poof(ev.pos); break;
      case 'confusao-estrelas': fx.orbita(ev.pos); break;
      case 'graxa': fx.quadros(ev.pos, 'graxa', { fps: 8, altura: ALTURA.graxa, sumir: 0.2, chao: true, cresce: [0.65, 0.65] }); break;
      default: fx.quadros(ev.pos, ev.fx, { fps: ev.fx === 'poof-vaso' ? 8 : 12, altura: ALTURA[ev.fx] ?? 30, sumir: 0.2 });
    }
  }, atraso);
}
