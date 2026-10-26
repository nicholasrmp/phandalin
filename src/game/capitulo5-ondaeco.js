// A CAVERNA ONDA ECO (Parte 4 da aventura). Mapa em `game/ondaeco.js`, lido da imagem por
// `src/dev/mapa-ondaeco.py`. (Cena em construção: por ora só a exploração do mapa.)

import { narrar } from '../view/narrativa.js';
import { ONDA_ECO } from './ondaeco.js';

const MOVIMENTO = 60;

export function criarOndaEco(app) {
  const enc = app.enc;
  const root = app.root;
  const estado = { explorando: false, encerrado: false };
  const herois = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead && c.hp > 0);

  function prepararExploracao() {
    enc.over = false;
    enc.outcome = null;
    enc.side = 'party';
    enc.round = 1;
    for (const c of enc.combatants) {
      c.movementLeftFt = c.side === 'party' ? MOVIMENTO : 0;
      c.actionUsed = true; c.bonusUsed = true; c.reactionUsed = true; c.acted = false;
    }
    estado.explorando = true;
    root.classList.add('explorando');
    if (!herois().includes(app.selected)) app.select(herois()[0]);
    app.refresh();
  }

  return {
    lugar: 'Caverna Onda Eco',
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes: () => [],
    depoisDeMover: async (c) => { if (estado.explorando && c) c.movementLeftFt = MOVIMENTO; },
    fimDoCombate: async () => { prepararExploracao(); },
    async iniciar() {
      prepararExploracao();
      await narrar(root, { formato: 'painel', paginas: [{ texto: ['(Caverna Onda Eco em construção.)'] }] });
      void ONDA_ECO;
    },
  };
}
