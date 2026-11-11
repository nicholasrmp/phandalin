// O CAPÍTULO 6 DO OBELISCO NA VILA: os três tabuleiros das missões, sobre os battlemaps da Forgotten Adventures (mapas em
// `game/obelisco6-mapas.js`, gerados por `src/dev/mapa-cap6-vila-fa.py`).
//
// O QUE É DO LIVRO (as regras; o texto é nosso):
//   a CASA DE MARTHUNGRIM: três gêmulas encefálicas nos escombros da escada; ATACADAS DE CIMA, recuam para os cômodos
//       em volta. Na sala sul, o esqueleto de Marthungrim e o diário (paladino de Dumathoin; a cripta corrompida fica
//       sob Talhundereth; a fechadura tem enigma, mais fácil para os fiéis; algo de muitos tentáculos o feriu). A
//       resposta do enigma NÃO está no diário.
//   a MINA HARDYHAMMER: o monte errante psiônico na caverna leste; os mineiros presos na câmara oeste, estreita demais
//       para ele. Vencido, Karthim marca Talhundereth no mapa, e os mineiros dão ao grupo uma parte do veio de prata:
//       250 po por mês durante um ano, pagos na Bolsa dos Mineiros.
//   o LARGO: a vaca Daisy entra cambaleando; quando alguém chega a 1,5 m, ela vomita quatro gosmas cinzentas psíquicas,
//       que usam o poder sempre que podem e lutam até morrer. Depois, a vaca fica boa.
//
// DECISÃO NOSSA, dita: o livro não dá à Daisy bloco nenhum; aqui ela é uma vaca de mentira (não luta, não é alvo da IA).

import { narrar } from '../view/narrativa.js';
import { distanceFt } from '../core/grid.js';
import { rolarPericia, SKILL_NAME } from '../rules/abilities.js';
import { makeMonster } from '../rules/monsters.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { PONTOS_CAP6_VILA as P } from './obelisco6-mapas.js';

const MOVIMENTO = 60;
const TITULO = { casaMarthungrim: 'A casa de Marthungrim', minaHardyhammer: 'A Mina Hardyhammer', largoDaVaca: 'O largo' };
const salaDe = (pontos, p) => {
  for (const [id, cs] of Object.entries(pontos.salas ?? {})) if (cs.some((c) => c.x === p.x && c.y === p.y)) return id;
  return null;
};

export function criarLugarDoCap6(app, config = {}) {
  const enc = app.enc;
  const root = app.root;
  const qual = config.cenaDaVila;
  const camp = (app.campanha ??= {});
  const o6 = (camp.obelisco6 ??= { feito: {}, lutas: {} });
  o6.feito ??= {};
  o6.lutas ??= {};
  const vila = (camp.vila ??= { pistas: [], missoes: {} });
  const estado = { explorando: false, encerrado: false, lutando: null };
  const todos = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead);
  const herois = () => todos().filter((c) => c.hp > 0);
  const painel = (texto, escolhas) => narrar(root, { formato: 'painel', paginas: [{ titulo: TITULO[qual], texto: [].concat(texto) }], ...(escolhas ? { escolhas } : {}) });
  const pista = (t) => { if (!(vila.pistas ??= []).includes(t)) vila.pistas.push(t); };
  const longe = (c, tile, pes = 5) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
  const neutro = (f, olha = { dx: 0, dy: 1 }) => { f.side = 'neutro'; f.facingVec = olha; if (!enc.combatants.includes(f)) enc.addCombatant(f); };

  // ------------------------------------------------------------- o elenco ----
  const elenco = [];
  let vaca = null;
  if (qual === 'casaMarthungrim' && !o6.lutas.casa) {
    for (const [i, p] of P.CASA_MARTHUNGRIM.gemulas.entries()) elenco.push(makeMonster('gemulaEncefalica', { ...p }, { nameSuffix: 'ABC'[i] }));
  }
  if (qual === 'minaHardyhammer' && !o6.lutas.mina) {
    // a câmara dos mineiros é estreita demais para ele, nem se espremendo: é o que os mantém vivos
    const monte = makeMonster('monteErrantePsionico', { ...P.MINA_HARDYHAMMER.monte });
    monte.naoEspreme = true;
    elenco.push(monte);
  }
  if (qual === 'largoDaVaca' && !o6.lutas.vaca) {
    vaca = makeMonster('vaca', { ...P.LARGO_DA_VACA.vaca });
    vaca.name = 'Daisy';
  }
  const mineiros = qual === 'minaHardyhammer' ? ['Wallin Kreeve', 'Elise Kreeve', 'Karthim Humblepick'].map((nome, i) => {
    const m = makeMonster('plebeu', { ...P.MINA_HARDYHAMMER.mineiros[i] });
    m.name = nome;
    m.refem = true;
    m.falas = [['— Tem uma coisa lá fora. Uma coisa de mato, que anda. Ela fala dentro da cabeça da gente.',
      '— Meu pai ouviu a voz dele e veio. A gente veio atrás. Agora ninguém sai.',
      '— (O anão só olha para vocês, e depois para a passagem estreita, e balança a cabeça.)'][i]];
    return m;
  }) : [];

  function prepararExploracao() {
    enc.reinforcements = null;
    enc.over = false;
    enc.outcome = null;
    enc.side = 'party';
    enc.round = 1;
    for (const c of enc.combatants) {
      c.movementLeftFt = c.side === 'party' ? MOVIMENTO : 0;
      c.actionUsed = true;
      c.bonusUsed = true;
      c.reactionUsed = true;
      c.acted = false;
    }
    estado.explorando = true;
    estado.lutando = null;
    root.classList.add('explorando');
    if (!herois().includes(app.selected)) app.select(herois()[0]);
    app.refresh();
  }

  function luta(quem, { surpresa = null } = {}) {
    for (const f of quem) {
      if (f.dead) continue;
      f.side = 'foes';
      if (!enc.combatants.includes(f)) enc.addCombatant(f);
    }
    estado.explorando = false;
    estado.lutando = quem;
    root.classList.remove('explorando');
    enc.emboscada = surpresa === 'nossa' ? { emboscadores: 'party', furtividade: herois().map(() => 20) } : null;
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
  }

  async function darXpDe(lista, motivo) {
    const grupo = todos();
    const xp = lista.filter((f) => f.dead).reduce((s, f) => s + (f.xp ?? 0), 0);
    if (!grupo.length || !xp) return;
    const cada = Math.floor(xp / grupo.length);
    const sobem = darXp(grupo, cada);
    enc.say('cura', `${motivo}: ${cada} XP para cada um.`);
    if (sobem.length) for (const t of await telaDeSubirNivel(root, sobem)) enc.say('cura', t);
  }

  function sair(fazer) {
    estado.explorando = false;
    estado.encerrado = true;
    root.classList.remove('explorando');
    fazer(todos());
  }

  // ---------------------------------------------------- a casa: os refúgios ----
  /** Cada gêmula viva ataca quem entra no cômodo dela (atacadas de cima, elas recuaram uma para cada canto da casa). */
  async function casaDepoisDoPasso() {
    if (o6.lutas.casa) return false;
    const vivas = elenco.filter((g) => !g.dead && g.side !== 'foes');
    for (const g of vivas) {
      const sala = salaDe(P.CASA_MARTHUNGRIM, g.pos);
      const entrou = herois().find((h) => salaDe(P.CASA_MARTHUNGRIM, h.pos) === sala || distanceFt(h.pos, g.pos) <= 10);
      if (!entrou) continue;
      await painel(`Do escuro ${sala === 'quarto' ? 'do quarto' : sala === 'despensa' ? 'da despensa' : 'da sala sul'}, uma coisa do tamanho de um gato, de pernas finas e cabeça mole, pula em ${entrou.name}.`,
        [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      luta([g]);
      return true;
    }
    return false;
  }

  // -------------------------------------------------------- o largo: a vaca ----
  async function largoDepoisDoPasso() {
    if (!vaca || o6.lutas.vaca || estado.lutando) return false;
    const perto = herois().find((h) => distanceFt(h.pos, vaca.pos) <= 5);
    if (!perto) return false;
    o6.feito.vacaVomitou = true;
    const gosmas = [];
    for (let i = 0; i < 4; i++) {
      // a casa livre vem com a pegada da vaca (f: 2); a gosma é Média e ocupa uma casa só
      const { x, y } = enc.casaLivreMaisProxima(vaca.pos) ?? vaca.pos;
      const g = makeMonster('gosmaCinzentaPsiquica', { x, y }, { nameSuffix: 'ABCD'[i] });
      g.pos = { ...g.pos, x, y, f: 1 };
      enc.addCombatant(g);
      gosmas.push(g);
    }
    await painel([`${perto.name} chega perto. A Daisy arregala os olhos, arqueia o lombo e vomita — não capim, mas quatro poças de óleo cinzento que se juntam, se levantam e se viram para vocês.`,
      'Uma delas aperta alguma coisa dentro da cabeça de quem está mais perto.'], [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
    luta(gosmas);
    return true;
  }

  // -------------------------------------------------------- a mina: o monte ----
  async function minaDepoisDoPasso() {
    if (o6.lutas.mina || estado.lutando || !elenco[0]) return false;
    const salas = new Set(herois().map((h) => salaDe(P.MINA_HARDYHAMMER, h.pos)));
    if (!salas.has('boca') && !salas.has('leste') && !salas.has('oeste')) return false;
    await painel(['Lá dentro, uma pilha de mato e lodo do tamanho de uma carroça se mexe. Não tem rosto; mas uma voz baixinha, que não é de ninguém, sussurra dentro da cabeça de vocês: "Vem. Aqui. Vem."',
      'O monte se arrasta na direção de vocês, deixando um rastro molhado.'], [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
    luta(elenco);
    return true;
  }

  async function depoisDoPasso() {
    if (!estado.explorando) return;
    if (qual === 'casaMarthungrim') return casaDepoisDoPasso();
    if (qual === 'largoDaVaca') return largoDepoisDoPasso();
    if (qual === 'minaHardyhammer') return minaDepoisDoPasso();
  }

  // ------------------------------------------------------------- o fim ----
  async function fimDoCombate(outcome) {
    const lutou = estado.lutando ?? [];
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      await narrar(root, { formato: 'tela', paginas: [{ titulo: TITULO[qual], texto: ['Ninguém volta a Phandalin para contar o que houve.'] }] });
      app.encerrarPartida();
      return;
    }
    if (qual === 'casaMarthungrim') {
      await darXpDe(lutou, 'As gêmulas da casa de Marthungrim');
      if (elenco.every((g) => g.dead)) {
        o6.lutas.casa = true;
        await painel('A última gêmula para de se mexer. A casa velha fica em silêncio, a não ser por um pingo d\'água em algum lugar.');
      }
    }
    if (qual === 'largoDaVaca') {
      o6.lutas.vaca = true;
      // a vaca está no meio da briga, e magia de área não escolhe: se ela morreu, o largo vê
      if (vaca?.dead) {
        o6.feito.vacaMorta = true;
        await painel(['As poças param de se mexer e secam na terra do largo, deixando um cheiro de ferro.', 'A Daisy está caída no meio delas e não se levanta. O Velho Narth chega mancando, olha a vaca, olha para vocês, e tira o chapéu sem dizer nada. Atrás dele, alguém comenta que pelo menos aquelas coisas não saem mais dela.']);
        enc.say('acao', 'A Daisy, a vaca do Velho Narth, morreu na briga do largo.');
      } else {
        await painel(['As poças param de se mexer e secam na terra do largo, deixando um cheiro de ferro.', 'A Daisy pisca, sacode a cabeça, solta um mugido comprido e vai pastar na beira da rua como se nada tivesse acontecido. O brilho verde dos olhos dela sumiu.']);
      }
      await darXpDe(lutou, 'As gosmas da vaca Daisy');
    }
    if (qual === 'minaHardyhammer') {
      o6.lutas.mina = true;
      o6.feito.sabeTalhundereth = true;
      o6.renda = { desde: vila.dia ?? 1, pagos: 0 };
      await painel(['O monte desaba num amontoado de mato podre e não se levanta mais. Da passagem estreita saem três vultos sujos de terra: um velho, uma moça e um anão de barba trançada.',
        'O anão, Karthim, aperta a mão de cada um de vocês, sem pressa. — Sorte de vocês não terem caído numa ruína anã mais velha que esta. — Ele pega o mapa e marca um ponto nas colinas de Starmetal. — Talhundereth. Dizem que o cofre do templo e a cripta sagrada estão cheios. Eu é que não volto lá.',
        'Presos, eles acharam um veio de prata no fundo da câmara. — Uma parte é de vocês — diz a moça. — Duzentas e cinquenta peças por mês, por um ano. A Halia paga na Bolsa.']);
      pista('Karthim Humblepick marcou Talhundereth no mapa: o templo anão abandonado nas colinas de Starmetal. Ouviu falar de tesouro no cofre do templo e na cripta.');
      await darXpDe(lutou, 'O monte errante psiônico');
      // os três saem da câmara até a boca da passagem, onde o grupo os vê
      const saida = [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 7, y: 6 }];
      const livre = (q) => !app.enc.combatants.some((o) => !o.dead && o.pos?.x === q.x && o.pos?.y === q.y);
      for (const [i, m] of mineiros.entries()) {
        m.refem = false;
        m.side = 'neutro';
        if (livre(saida[i]) && !app.enc.field.blocksMove(saida[i].x, saida[i].y)) m.pos = { ...m.pos, ...saida[i] };
      }
    }
    prepararExploracao();
  }

  // ------------------------------------------------------- as interações ----
  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    const aqui = (p) => p && tile.x === p.x && tile.y === p.y;
    if (qual === 'casaMarthungrim') {
      const C = P.CASA_MARTHUNGRIM;
      if (aqui(C.diario) && !o6.feito.diario) {
        ops.push({ rotulo: 'Ler o diário', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
          o6.feito.diario = true;
          await painel([
            'O diário de Marthungrim, escrito em anão numa letra firme que, perto do fim, treme.',
            'Ele cavou esta casa há mais de sessenta anos. Era paladino de Dumathoin, e o deus lhe deu uma missão: devolver ao descanso os espíritos de uma cripta corrompida, os mortos dos Talhund.',
            'A cripta fica debaixo de Talhundereth, um templo anão cheio de coisas ruins. A porta dela tem uma fechadura de enigma — mais fácil, escreve ele, para quem tem fé em Dumathoin. A resposta, ele não anotou.',
            'As últimas páginas falam de uma coisa de muitos tentáculos que o pegou lá dentro, e de feridas que não fecham. A última linha é só uma data.',
          ]);
          pista('O diário de Marthungrim: a Cripta dos Talhund fica sob Talhundereth; a fechadura tem um enigma, mais fácil para os fiéis de Dumathoin; uma criatura de muitos tentáculos o feriu lá.');
          app.refresh();
        } });
      }
      if (aqui(C.corda)) {
        ops.push({ rotulo: 'Subir pela corda', icone: 'acao-disparada', detalhe: 'de volta à vila', motivo: longe(c, tile), fazer: () => sair((v) => app.irParaVila(v)) });
      }
    }
    if (qual === 'minaHardyhammer' && (tile.y >= 14 || (tile.x === 0 && tile.y >= 10))) {
      ops.push({ rotulo: 'Voltar à região', icone: 'acao-disparada', detalhe: o6.lutas.mina ? 'levando os mineiros' : 'deixar a mina', motivo: longe(c, tile), fazer: () => sair(async (v) => {
        const { abrirRegiao } = await import('./regiao.js');
        app.capitulo = null; app.enc = null; app.board = null; app.selected = null; app.mode = null;
        abrirRegiao(app, { grupo: v, onde: 'hardyhammer' });
      }) });
    }
    if (qual === 'largoDaVaca' && o6.lutas.vaca && (tile.x === 0 || tile.y === 0 || tile.y === 19 || tile.x === 14)) {
      ops.push({ rotulo: 'Voltar ao centro da vila', icone: 'acao-disparada', motivo: longe(c, tile), fazer: () => sair((v) => app.irParaVila(v)) });
    }
    return ops;
  }

  return {
    lugar: TITULO[qual],
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    depoisDeMover(c) {
      if (c && estado.explorando) c.movementLeftFt = MOVIMENTO;
      return depoisDoPasso();
    },
    fimDoCombate,
    evento() {},
    dialogoDe: () => null,
    elenco,
    get vaca() { return vaca; },
    mineiros,
    async iniciar() {
      if (qual === 'casaMarthungrim') {
        if (!o6.lutas.casa && !o6.feito.casaVista) {
          o6.feito.casaVista = true;
          const r = await painel(['O buraco no chão do campo é largo como uma carroça. Seis metros abaixo, no escuro, um monte de pedras e madeira podre: o que sobrou de uma escada. E em cima dele, três coisas do tamanho de um gato, de cabeça mole e pernas finas, que andam em círculo sem achar a saída.',
            'Dá para atacá-las daqui de cima, ou descer pela corda.'], [
            { rotulo: 'Atacar de cima', valor: 'cima', primaria: true }, { rotulo: 'Descer pela corda', valor: 'descer' },
          ]);
          if (r === 'cima') {
            // O LIVRO: atacadas de cima, elas recuam para os cômodos em volta — e o grupo desce sem ninguém embaixo
            o6.feito.gemulasRecuaram = true;
            for (const [i, g] of elenco.entries()) g.pos = { ...g.pos, ...P.CASA_MARTHUNGRIM.refugios[i] };
            await painel('Pedras, flechas, o que estiver à mão: as três coisas se espalham com um chiado e somem pelas portas lá embaixo, cada uma para um canto da casa. O entulho fica livre para a corda.');
          } else {
            for (const g of elenco) neutro(g);
            await painel('A corda balança, e as três coisas param de andar em círculo. Todas viram a cabeça mole para cima, ao mesmo tempo.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
            luta(elenco);
            return;
          }
        }
        // recuadas, elas ficam FORA do tabuleiro até alguém entrar no cômodo (o Droop da Mansão faz o mesmo):
        // no tabuleiro, a gêmula da sala ficava à vista do entulho e o "somem pelas portas" virava mentira
        for (const g of elenco.filter((x) => !x.dead)) {
          if (!o6.feito.gemulasRecuaram) { neutro(g); continue; }
          g.side = 'neutro';
          const i = enc.combatants.indexOf(g);
          if (i >= 0) enc.combatants.splice(i, 1);
        }
      }
      if (qual === 'minaHardyhammer') {
        for (const m of mineiros) neutro(m, { dx: 1, dy: 0 });
        if (elenco[0]) neutro(elenco[0]);
        if (!o6.feito.minaVista) {
          o6.feito.minaVista = true;
          await painel('Uns vinte e quatro quilômetros a sudoeste, nas Montanhas da Espada, as indicações da Halia levam a uma encosta de pedra solta e mato alto. Atrás dele, quase escondida, a boca de uma mina velha, com um vagonete tombado na entrada.');
        }
      }
      if (qual === 'largoDaVaca' && vaca) {
        neutro(vaca, { dx: -1, dy: 0 });
        await painel(['No meio do largo, uma vaca malhada anda em ziguezague, babando. Os olhos dela brilham verdes, e de vez em quando um tentáculo fino sai do lombo, se debate no ar e volta para dentro, sem deixar marca.',
          'Um homem velho de chapéu de palha grita da porta de uma casa: — É a Daisy! Ela comeu trevo lá do pomar do Edermath e ficou assim!']);
      }
      prepararExploracao();
    },
  };
}
