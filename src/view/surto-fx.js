// Livro do Jogador (não é SRD) — conteúdo próprio, ver NOTICE.md
// As animações dos SURTOS de magia selvagem, pedidas pelo motor com `onEvent({ type: 'surtoFx', fx, pos })` (rules/surto.js). Uma função
// só para quem joga e para o convidado do coop (view/partida-tela.js), para as duas telas não saírem do lugar.

// Altura (em px acima do chão da casa) de cada animação em sprite.
const ALTURA = { 'poof-vaso': 14, graxa: 4, 'raio-queda': 40, 'bola-de-fogo': 30, 'arcano-impacto': 30 };

export function tocarSurtoFx(board, ev) {
  if (!board?.fx || !ev?.pos) return;
  // Os disparos de um mesmo surto saem escalonados: o grupo inteiro de uma vez vira uma pilha de efeitos no mesmo quadro.
  const atraso = Math.random() * 110;
  setTimeout(() => {
    const fx = board.fx;
    switch (ev.fx) {
      case 'surto-caos': fx.caos(ev.pos); break;
      case 'onda-necrotica': fx.onda(ev.pos, { raio: 6, dur: 1.2 }); break;
      case 'almas-sobem': fx.almas(ev.pos); break;
      case 'confusao-estrelas': fx.orbita(ev.pos); break;
      case 'graxa': fx.quadros(ev.pos, 'graxa', { fps: 8, altura: ALTURA.graxa, sumir: 0.2, chao: true, cresce: [0.65, 0.65] }); break;
      default: fx.quadros(ev.pos, ev.fx, { fps: ev.fx === 'poof-vaso' ? 8 : 12, altura: ALTURA[ev.fx] ?? 30, sumir: 0.2 });
    }
  }, atraso);
}
