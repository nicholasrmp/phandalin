// A LUTA COM A AGATHA (Conyberry, Parte 3 da aventura). O Obelisco põe a banshee ATACANDO em dois casos: quando a
// Persuasão do grupo falha, e quando ela foi ofendida e a Visagem Horripilante não bastou para espantar ninguém. A
// visita em si é conversa (`game/conyberry.js`); esta é só a luta, na cabana de galhos trançados, e no fim o grupo
// volta ao mapa da região — como numa luta da estrada (`capitulo4-estrada.js`).
//
// O que vem de `config.agatha` (a conversa): `motivo` ('recusa' ou 'ofendida'), `amedrontados` (ids de quem falhou
// contra a Visagem antes de a luta começar: entram com o medo, que se repete no fim de cada turno) e `imunes` (quem
// aguentou o olhar: não teme mais a Visagem). Ofendida, ela já gastou a Visagem; na recusa, ainda vai usá-la.
//
// O estado mora em `app.campanha.agatha`: vencida, `estado = 'destruida'`.

import { narrar } from '../view/narrativa.js';
import { makeMonster } from '../rules/monsters.js';
import { addCondition } from '../rules/conditions.js';
import { abrirRegiao } from './regiao.js';

/** Onde ela aparece: o canto escuro do fundo da cabana, longe da porta. */
export const AGATHA_SURGE = { x: 9, y: 4 };

export function criarCovilAgatha(app, config) {
  const enc = app.enc;
  const root = app.root;
  const camp = (app.campanha ??= {});
  const salvo = (camp.agatha ??= { estado: null });
  const dados = config.agatha ?? {};
  const estado = { encerrado: false };
  const banshee = makeMonster('banshee', AGATHA_SURGE);
  banshee.name = 'Agatha';

  async function fimDoCombate(outcome) {
    if (estado.encerrado) return;
    estado.encerrado = true;
    const vivos = enc.combatants.filter((c) => c.side === 'party' && !c.dead);
    if (outcome !== 'vitoria') {
      await narrar(root, { formato: 'tela', paginas: [{ titulo: 'O covil da Agatha', texto: [
        'A cabana fica quieta de novo, e mais fria. Ninguém sai da mata para contar o que houve.'] }] });
      app.encerrarPartida();
      return;
    }
    salvo.estado = 'destruida';
    await narrar(root, { formato: 'painel', paginas: [{ titulo: 'O covil da Agatha', texto: [
      'O grito para no meio. A luz dela se desfaz como fumaça num quarto fechado, e o frio vai junto, devagar.',
      'Na mesa, a louça continua posta para ninguém. Ninguém mais vai arrumá-la.',
    ] }] });
    const xp = banshee.xp ?? 0;
    app.xpPendente = {
      xp: (app.xpPendente?.xp ?? 0) + xp,
      motivo: [app.xpPendente?.motivo, 'A banshee de Conyberry'].filter(Boolean).join('; '),
    };
    fecharTabuleiro();
    abrirRegiao(app, { grupo: vivos, onde: 'conyberry' });
  }

  function fecharTabuleiro() {
    app.capitulo = null;
    app.enc = null;
    app.board = null;
    app.selected = null;
    app.mode = null;
    root.classList.remove('explorando');
  }

  return {
    lugar: 'O covil da Agatha',
    get explorando() { return false; },
    get encerrado() { return estado.encerrado; },
    interacoes: () => [],
    depoisDeMover() {},
    fimDoCombate,
    evento() {},
    banshee,
    async iniciar() {
      await narrar(root, { formato: 'painel', paginas: [{ titulo: 'O covil da Agatha', texto: [dados.motivo === 'ofendida'
        ? 'O olhar não espantou todo mundo. O choro sem dono vira um uivo, e a luz dela atravessa a sala na direção de quem ficou.'
        : 'O rosto dela endurece. — Palavras de mercador, numa casa que não é a sua. — A luz cresce, fria, e ela vem.'] }],
      escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
      // Ofendida, a Visagem já saiu na conversa: quem falhou entra com medo, quem aguentou não a teme mais.
      for (const h of enc.allOf('party')) {
        if (dados.amedrontados?.includes(h.id)) {
          addCondition(h, 'amedrontado', { rounds: 10, source: banshee.id, data: { save: 'wis', dc: 13, repete: 'sempre' } });
        }
        if (dados.imunes?.includes(h.id)) (h.imuneAVisagem ??= []).push(banshee.id);
      }
      if (dados.motivo === 'ofendida') banshee.visagemUsada = true;
      banshee.pos = { ...banshee.pos, ...(enc.casaLivreMaisProxima(AGATHA_SURGE) ?? AGATHA_SURGE) };
      enc.addCombatant(banshee);
      enc.emboscada = null;
      app.selected = null;
      enc.start();
      if (enc.side === 'party') app.select(app.firstActive());
      app.refresh();
    },
  };
}
