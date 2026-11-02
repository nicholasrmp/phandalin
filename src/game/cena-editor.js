// A cena do EDITOR DE CENÁRIO em exploração livre: o grupo anda pelo mapa que se montou em `/editor.html`, sem iniciativa e sem inimigos, para
// ver como o lugar anda e se vê. É a menor cena possível: usa a mesma interface das outras (`explorando`, `interacoes`, `depoisDeMover`,
// `fimDoCombate`, `iniciar`) e não faz mais nada.

const MOVIMENTO = 60;

export function criarCenaEditor(app) {
  const enc = app.enc;
  const root = app.root;
  const estado = { explorando: false };
  const herois = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead && c.hp > 0);

  function prepararExploracao() {
    enc.over = false;
    enc.outcome = null;
    enc.side = 'party';
    enc.round = 1;
    enc.surpresos = new Set();
    for (const c of enc.combatants) {
      c.movementLeftFt = c.side === 'party' ? MOVIMENTO : 0;
      c.actionUsed = true;
      c.bonusUsed = true;
      c.reactionUsed = true;
      c.acted = false;
    }
    estado.explorando = true;
    root.classList.add('explorando');
    if (!herois().includes(app.selected)) app.select(herois()[0]);
    app.refresh();
  }

  return {
    lugar: 'Cenário do editor',
    get explorando() { return estado.explorando; },
    get encerrado() { return false; },
    interacoes: () => [],
    async depoisDeMover(c) {
      if (estado.explorando) c.movementLeftFt = MOVIMENTO;
    },
    fimDoCombate() { prepararExploracao(); },
    async iniciar() { prepararExploracao(); },
  };
}
