// AS TRÊS LUTAS PEQUENAS DO CAPÍTULO 5 DO OBELISCO, na vila (mapas em `game/obelisco5-mapas.js`). Cada uma sai de
// uma cena de crime (`obelisco5-vila.js`) e volta à vila no fim, como a briga de rua dos Marcarrubra.
//
// O QUE É DO LIVRO (as regras; o texto é nosso):
//   a CAVERNA DO POÇO (C1b): desce-se 6 m de corda, Atletismo CD 10 (falha: 2d6 e caído). O otyugh ataca quem vê;
//       quem CAI chama a atenção dele na hora, e quem desce bem precisa de Furtividade CD 11 para não ser notado —
//       se ninguém caiu e todos passaram, a surpresa é do grupo.
//   o ACAMPAMENTO (C2b): três goblins psíquicos lutadores, os FERIDOS que ficaram para trás (os sãos já levaram a
//       lasca). Ao chegar, o grupo ouve um deles reclamando do Ruxithid (a pista do nome do chefe). Furtividade CD 16
//       para não ser notado. Morto um, os outros tentam se render.
//   o TELHADO (C4b): o comandante psíquico (com o saco de moedas) e dois lutadores, de volta para buscar o saco que
//       caiu na fuga. Atacam quando veem o grupo. Caído um, os outros fogem e largam o saco: 10 po, 14 pp e 17 pc.
//       Devolvido à dona (a Greska; o livro aqui a chama de Grista, ver `obelisco5-terreo.js`), vale uma semana de refeições.
//
// DECISÃO NOSSA, dita: o livro não diz QUANTO os goblins do acampamento estão feridos; aqui, com metade dos PV.

import { narrar } from '../view/narrativa.js';
import { makeMonster } from '../rules/monsters.js';
import { rolarPericia, SKILL_NAME } from '../rules/abilities.js';
import { addCondition } from '../rules/conditions.js';
import { damageRoll } from '../core/dice.js';
import { guardar } from './comercio.js';
import { PONTOS_CAP5_VILA as P } from './obelisco5-mapas.js';
import { PISTAS_DO_CAP5 } from './obelisco5-vila.js';
import { deNoite } from './relogio.js';
import { definirEscuridao } from '../rules/luz.js';
import { distanceFt } from '../core/grid.js';

/** A luta pela variante do mapa. */
export const LUTA_DA_VARIANTE = { cavernaDoPoco: 'poco', acampamentoSawplee: 'acampamento', telhadoGigante: 'telhado' };

export function criarLutaDaVila5(app, config) {
  const enc = app.enc;
  const root = app.root;
  const qual = LUTA_DA_VARIANTE[config.cenaDaVila];
  const camp = (app.campanha ??= {});
  const o5 = (camp.obelisco5 ??= { iniciado: true, cenas: {}, pistas: [], feito: {} });
  const vila = (camp.vila ??= { pistas: [] });
  o5.lutas ??= {};
  // `fim`: a luta acabou (e não acaba duas vezes); `explorando`: depois da vitória, o mapa se anda; `encerrado`: saiu.
  const estado = { fim: false, explorando: false, encerrado: false };
  const herois = () => enc.combatants.filter((c) => c.side === 'party');
  const painel = (texto, escolhas) => narrar(root, { formato: 'painel', paginas: [{ titulo: TITULO[qual], texto: [].concat(texto) }], ...(escolhas ? { escolhas } : {}) });
  const ganharPista = (id) => {
    if (o5.pistas.includes(id)) return;
    o5.pistas.push(id);
    if (!(vila.pistas ??= []).includes(PISTAS_DO_CAP5[id])) vila.pistas.push(PISTAS_DO_CAP5[id]);
    enc.say('acao', `Pista: ${PISTAS_DO_CAP5[id]}`);
  };
  const p = (pt) => ({ x: pt.x, y: pt.y });

  // ------------------------------------------------------------ o elenco ----
  const inimigos = [];
  if (qual === 'poco') inimigos.push(makeMonster('otyugh', p(P.CAVERNA_DO_POCO.otyugh)));
  if (qual === 'acampamento') {
    for (const [i, pt] of P.ACAMPAMENTO_SAWPLEE.goblins.entries()) {
      const g = makeMonster('goblinPsiLutador', p(pt), { nameSuffix: 'ABC'[i] });
      g.hp = Math.ceil(g.maxHp / 2);
      inimigos.push(g);
    }
  }
  if (qual === 'telhado') {
    inimigos.push(makeMonster('goblinPsiComandante', p(P.TELHADO_GIGANTE.comandante)));
    for (const [i, pt] of P.TELHADO_GIGANTE.lutadores.entries()) inimigos.push(makeMonster('goblinPsiLutador', p(pt), { nameSuffix: 'AB'[i] }));
  }

  // O MORAL do livro: no acampamento, morto um, os outros se rendem; no telhado, caído um, os outros fogem.
  function evento(ev) {
    if (ev.type !== 'died' || !inimigos.includes(ev.target) || estado.moral) return;
    const resto = inimigos.filter((f) => !f.dead && !f.fugiu && f.hp > 0);
    if (!resto.length) return;
    estado.moral = true;
    if (qual === 'acampamento') {
      for (const f of resto) { f.side = 'neutro'; f.capturado = true; f.rendido = true; }
      enc.say('acao', `${resto.map((f) => f.name).join(' e ')} ${resto.length > 1 ? 'jogam' : 'joga'} as mãos para o alto e ${resto.length > 1 ? 'se rendem' : 'se rende'}, guinchando em goblin.`);
    }
    if (qual === 'telhado') {
      for (const f of resto) { f.fugiu = true; enc.combatants.splice(enc.combatants.indexOf(f), 1); }
      estado.sacoLargado = true;
      enc.say('acao', 'Os outros pulam do telhado para a rua e somem entre as casas. O saco de moedas fica para trás.');
    }
    enc.checkEnd();
    app.refresh();
  }

  // ---------------------------------------------------- como cada uma começa ----
  async function comecoDoPoco() {
    await painel('Ander empresta a corda. Lá embaixo, 6 metros abaixo, só pedra seca e escuro, e o cheiro de lixo velho.');
    const linhas = [];
    let caiu = false;
    let notado = false;
    for (const h of herois()) {
      const r = rolarPericia(enc.rng, h, 'atletismo');
      if (r.total < 10) {
        caiu = true;
        const d = damageRoll(enc.rng, '2d6');
        h.hp = Math.max(1, h.hp - d.total);
        addCondition(h, 'caido');
        linhas.push(`${h.name} (Atletismo ${r.total}) escorrega na corda e cai: ${d.total} de dano.`);
      } else {
        const f = rolarPericia(enc.rng, h, 'furtividade');
        if (f.total < 11) notado = true;
        linhas.push(`${h.name} desce bem (Atletismo ${r.total})${f.total < 11 ? ', mas faz barulho' : ', sem um som'} (Furtividade ${f.total}).`);
      }
    }
    await painel([...linhas, caiu ? 'O baque ecoa na caverna, e algo grande se mexe no fundo.' : notado ? 'Do fundo vem um rosnado molhado: ele ouviu.' : 'No canto sul, sobre uma montanha de lixo, uma massa de tentáculos ainda não percebeu vocês.']);
    return caiu || notado ? null : 'nossa';
  }

  async function comecoDoAcampamento() {
    const ouvir = 'Do meio das árvores vem uma voz fina, em Comum: — Se os outros não chegaram com a pedra, o Ruxithid vai cortar cabeças. Cabeças!';
    await painel(['Uma hora de caminhada para o sul, uma clareira com tendas remendadas e duas fogueiras. Três goblins enfaixados se queixam em volta do fogo.', ouvir]);
    ganharPista('chefe');
    const piores = herois().map((h) => rolarPericia(enc.rng, h, 'furtividade').total);
    const pior = Math.min(...piores);
    enc.say('inicio', `Furtividade do grupo: a pior rolagem é ${pior} (CD 16).`);
    return pior >= 16 ? 'nossa' : null;
  }

  async function comecoDoTelhado() {
    await painel(['Pela chaminé, com fuligem até os cotovelos, vocês saem no telhado do Gigante Adormecido. Do outro lado das telhas, três goblins discutem em volta de um saco de couro.', 'Um deles, de olhos acesos, aponta para vocês.']);
    return null;
  }

  // ------------------------------------------------------------- o fim ----
  async function fimDoCombate(outcome) {
    if (estado.fim) return;
    estado.fim = true;
    const grupo = herois();
    if (outcome !== 'vitoria') {
      await narrar(root, { formato: 'tela', paginas: [{ titulo: TITULO[qual], texto: ['Ninguém volta para contar à vila o que houve.'] }] });
      app.encerrarPartida();
      return;
    }
    o5.lutas[qual] = true;
    const texto = [];
    const vivos = grupo.filter((c) => !c.dead);
    if (qual === 'poco') {
      o5.feito.viuOtyugh = true;               // o livro: quem viu este otyugh entende melhor o mutante de Zorzula
      // O túnel desmoronado se cava na própria represa, explorando (`interacoes`).
      texto.push('O otyugh afunda no próprio lixo. Ao norte, pedras escuras e lama represam o leito: foi o desmoronamento que os goblins fizeram ao fugir pelo poço.');
    }
    if (qual === 'acampamento') {
      const presos = inimigos.filter((f) => f.capturado && !f.dead);
      if (presos.length) {
        ganharPista('duergar');
        texto.push(`${presos.length > 1 ? 'Os goblins rendidos' : 'O goblin rendido'} falam sem parar: moram num velho posto duergar debaixo da terra, ali perto; o chefe tem um "cérebro grande" que os deuses deram; e a missão é juntar lascas de um obelisco antigo, que eles acham capaz de acabar com Phandalin.`);
        texto.push('O Harbin pode guardá-los nas celas do salão.');
        o5.feito.goblinsPresos = (o5.feito.goblinsPresos ?? 0) + presos.length;
      }
    }
    if (qual === 'telhado' && vivos[0]) {
      const devolver = await painel(['O saco de couro tem 10 po, 14 pp e 17 pc: o lucro da semana do Gigante Adormecido.'], [
        { rotulo: 'Devolver à Greska', valor: 'grista', primaria: true }, { rotulo: 'Ficar com ele', valor: 'ficar' },
      ]);
      if (devolver === 'ficar') {
        guardar(vivos[0], 'moedaDeOuro', 10); guardar(vivos[0], 'moedaDePrata', 14); guardar(vivos[0], 'moedaDeCobre', 17);
        texto.push(`${vivos[0].name} guarda o saco.`);
      } else {
        o5.feito.refeicoesDaGrista = true;
        texto.push('A Greska conta as moedas duas vezes e decreta: uma semana de comida de graça. A comida dela é péssima, mas é de coração.');
      }
    }
    if (texto.length) await painel(texto);
    const xp = inimigos.filter((f) => f.dead || f.capturado).reduce((s, f) => s + (f.xp ?? 0), 0)
      + (qual === 'telhado' ? inimigos.filter((f) => f.fugiu).reduce((s, f) => s + (f.xp ?? 0), 0) : 0);
    if (xp) app.xpPendente = { xp: (app.xpPendente?.xp ?? 0) + xp, motivo: [app.xpPendente?.motivo, TITULO[qual]].filter(Boolean).join('; ') };
    // DEPOIS DA VITÓRIA o mapa se anda: há o que olhar (`mapa.interativos`) e uma saída (`interacoes`).
    await painel(SAIDA[qual]);
    prepararExploracao();
  }

  function prepararExploracao() {
    enc.over = false;
    enc.outcome = null;
    enc.side = 'party';
    for (const c of enc.combatants) {
      c.movementLeftFt = c.side === 'party' ? 60 : 0;
      c.actionUsed = true;
      c.bonusUsed = true;
      c.reactionUsed = true;
      c.acted = false;
    }
    estado.explorando = true;
    root.classList.add('explorando');
    const vivos = herois().filter((h) => !h.dead);
    if (!vivos.includes(app.selected)) app.select(vivos[0]);
    app.refresh();
  }

  function sair(fazer) {
    estado.explorando = false;
    estado.encerrado = true;
    root.classList.remove('explorando');
    fazer(herois().filter((h) => !h.dead));
  }

  // ------------------------------------------------- explorando, depois ----
  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    const longe = (pes) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
    const aqui = (pt) => pt && tile.x === pt.x && tile.y === pt.y;
    if (qual === 'poco') {
      const C = P.CAVERNA_DO_POCO;
      // O TÚNEL DESMORONADO (o livro): cavar leva 1 hora, 10 minutos a menos por ajudante (10 no mínimo), e abre um
      // caminho para leste, até um afloramento perto do Repouso de Zorzula — uma entrada a mais para depois.
      if (aqui(C.desmoronamento) && !o5.feito.tunelDoPoco) {
        const n = herois().filter((h) => !h.dead).length;
        const minutos = Math.max(10, 60 - 10 * (n - 1));
        ops.push({
          rotulo: 'Cavar o túnel', icone: 'acao-procurar', detalhe: `${minutos} min, com ${n} cavando`, motivo: longe(5),
          fazer: async () => {
            o5.feito.tunelDoPoco = true;
            await painel('As pedras saem uma a uma. Atrás delas o túnel segue para leste, úmido e estreito, até uma fenda na encosta de onde se vê o sol — e, longe, as Montanhas da Espada. É por aqui que os goblins entram e saem da vila.');
            app.refresh();
          },
        });
      }
      if (aqui(C.luzDoPoco)) ops.push({ rotulo: 'Subir pela corda', icone: 'acao-disparada', detalhe: 'de volta à vila', motivo: longe(5), fazer: () => sair((v) => app.irParaVila(v)) });
    }
    if (qual === 'acampamento' && (aqui(TRILHA) || em(P.ACAMPAMENTO_SAWPLEE.grupo, tile))) {
      ops.push({ rotulo: 'Voltar a Phandalin', icone: 'acao-disparada', detalhe: 'pela trilha', motivo: longe(5), fazer: () => sair((v) => app.irParaVila(v)) });
    }
    if (qual === 'telhado' && aqui(P.TELHADO_GIGANTE.chamine)) {
      ops.push({
        rotulo: 'Descer pela chaminé', icone: 'acao-disparada', detalhe: 'o salão do Gigante', motivo: longe(5),
        fazer: () => sair((vivos) => app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'giganteTerreo', continuarCom: vivos })),
      });
    }
    return ops;
  }

  return {
    lugar: TITULO[qual],
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    depoisDeMover(c) { if (c && estado.explorando) c.movementLeftFt = 60; },
    fimDoCombate,
    evento,
    inimigos,
    async iniciar() {
      // À NOITE, como a briga de rua dos Marcarrubra: só enxerga quem tem visão no escuro ou anda com luz. A caverna é
      // breu de qualquer jeito; o acampamento e o telhado escurecem pelo relógio da vila.
      if (qual !== 'poco' && deNoite(vila.tempo ?? 0)) definirEscuridao(enc.field, 0.8);
      const surpresa = qual === 'poco' ? await comecoDoPoco() : qual === 'acampamento' ? await comecoDoAcampamento() : await comecoDoTelhado();
      for (const f of inimigos) enc.addCombatant(f);
      enc.emboscada = surpresa === 'nossa' ? { emboscadores: 'party', furtividade: [99] } : null;
      app.selected = null;
      enc.start();
      if (enc.side === 'party') app.select(app.firstActive());
      app.refresh();
    },
  };
}

const em = (lista, t) => [].concat(lista ?? []).some((q) => q.x === t.x && q.y === t.y);
/** A casa da trilha do acampamento, a do objeto "Olhar a trilha" (`mapa-cap5-vila-fa.py`): por ela se volta. */
const TRILHA = { x: 3, y: 19 };

/** O que se diz ao acabar a luta: o mapa fica aberto, e por onde se sai. */
const SAIDA = {
  poco: 'A caverna fica quieta. Olhem em volta à vontade (botão direito no que a arte desenha); a corda do poço, onde a luz bate, leva de volta à vila.',
  acampamento: 'O acampamento é de vocês. Revirem o que quiserem (botão direito); a trilha do sudoeste volta a Phandalin.',
  telhado: 'O telhado está livre. Dá para olhar em volta (botão direito); a chaminé desce ao salão do Gigante Adormecido.',
};

const TITULO = { poco: 'A caverna do poço', acampamento: 'O acampamento dos feridos', telhado: 'O telhado do Gigante Adormecido' };
