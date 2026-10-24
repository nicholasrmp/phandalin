// O fundo da tela de título: a estrada da emboscada, viva, com a câmera
// passeando devagar da carroça até os cavalos mortos.
//
// É o tabuleiro de verdade (`Board`) desenhando um encontro que nunca começa:
// o grupo parado ao lado da carroça, nenhum goblin à vista — eles estão
// escondidos nos barrancos, que é exatamente a graça da cena. Nada de arte
// nova: a tela de título mostra o jogo que o jogador vai jogar.
//
// Criado uma vez e reaproveitado: `Board` pendura ouvintes na janela, e um
// fundo novo a cada abertura do menu os acumularia.

import { Battlefield } from '../core/grid.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { makeRng } from '../core/rng.js';
import { mapaDo } from '../game/encounter.js';
import { Board } from './board.js';

const PERIODO = 70;          // segundos para ir da carroça aos cavalos e voltar
const QUADROS_POR_SEG = 30;  // o fundo não precisa dos 60 do jogo
// De onde para onde a câmera anda, em casas do mapa da emboscada.
const DE = { x: 3, y: 12 };
const ATE = { x: 19, y: 12 };

export function criarFundo() {
  const canvas = document.createElement('canvas');
  canvas.className = 'menu-fundo-canvas';
  canvas.setAttribute('aria-hidden', 'true');

  const mapa = mapaDo('emboscada');
  const field = new Battlefield(mapa.terreno[0].length, mapa.terreno.length,
    mapa.terreno, mapa.altura, mapa.objetos);
  const party = makeParty({ nivel: 1 });
  // Lugares de cena, não os de combate: na fileira de cima da estrada, onde
  // nenhuma copa da mata do sul cobre ninguém — senão a árvore esmaece (é a
  // regra do jogo) e vira um fantasma na tela de título.
  const LUGARES = [{ x: 6, y: 11 }, { x: 5, y: 12 }, { x: 4, y: 11 }, { x: 3, y: 11 }];
  party.forEach((c, i) => { c.pos = { ...LUGARES[i] }; c.facingVec = { ...mapa.olhar }; });
  const enc = new Encounter({
    battlefield: field, party, foes: [], rng: makeRng(1),
    onLog: () => {}, onEvent: () => {},
  });
  const board = new Board(canvas, { encounter: enc, onTileClick: () => {}, onTileHover: () => {} });
  board.soCenario = true;   // sem anel nem barra de vida: é cena, não jogo

  const movimento = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rodando = false;
  let t = 0;
  let ultimo = 0;
  let acumulado = 0;

  function enquadrar() {
    // Escala para a estrada encher a tela: uns 900 px lógicos do mapa na
    // largura, nunca menos que o necessário para cobrir a altura.
    const s = Math.max(innerWidth / 900, innerHeight / 560);
    // Sem movimento, um quadro fixo perto da carroça: o grupo e a estrada.
    const ida = movimento ? (1 - Math.cos((t / PERIODO) * Math.PI * 2)) / 2 : 0.08;
    const a = board.center(DE.x, DE.y);
    const b = board.center(ATE.x, ATE.y);
    const fx = a.sx + (b.sx - a.sx) * ida;
    const fy = a.sy + (b.sy - a.sy) * ida;
    // O foco fica à direita do centro: a coluna do menu ocupa a esquerda.
    let x = innerWidth * 0.62 - fx * s;
    let y = innerHeight * 0.52 - fy * s;
    // Sem mostrar a borda do canvas — exceto a esquerda, que pode entrar até
    // 40% da tela: ali o véu é quase opaco, e é o que deixa a carroça (no
    // canto do mapa) aparecer à direita do menu em vez de atrás do título.
    x = Math.min(innerWidth * 0.4, Math.max(innerWidth - canvas.width * s, x));
    y = Math.min(0, Math.max(innerHeight - canvas.height * s, y));
    canvas.style.width = `${canvas.width * s}px`;
    canvas.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  }

  function quadro(agora) {
    if (!rodando) return;
    const dt = Math.min(0.1, (agora - ultimo) / 1000 || 0);
    ultimo = agora;
    acumulado += dt;
    if (acumulado >= 1 / QUADROS_POR_SEG) {
      t += acumulado;
      board.render(acumulado);
      enquadrar();
      acumulado = 0;
    }
    requestAnimationFrame(quadro);
  }

  return {
    canvas,
    iniciar() {
      if (rodando) return;
      rodando = true;
      ultimo = performance.now();
      board.render(0);
      enquadrar();
      requestAnimationFrame(quadro);
    },
    parar() { rodando = false; },
    enquadrar,
  };
}
