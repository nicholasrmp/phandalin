// TALHUNDERETH (o Obelisco, capítulo 6): o templo anão de Dumathoin, tomado pelo Culto do Obelisco. O mapa está em
// `game/talhundereth-mapa.js` (gerado por `src/dev/mapa-talhundereth.py`), as criaturas em `rules/monsters/talhundereth.js`.
//
// O QUE É DO LIVRO (as regras; o texto é nosso), sala a sala:
//   T2  os dois galeb duhr, parados como pedra junto do desabamento. Quem chega à porta da capela é mandado embora; se
//       houver luta, quem está na capela chega três rodadas depois.
//   T3  Honna, a medusa, e o Cameren. Ela conta uma história sobre os espíritos anões e pede que se ajoelhem — para
//       petrificar quem se ajoelha. Intuição contra a Enganação dela vê a mentira.
//   T4  a cama da Honna e o vão do desabamento para o cofre: Pequeno passa; Médio, só tirando as pedras (oito horas de
//       uma pessoa: duas, com o grupo de quatro).
//   T5  o horror de elmo e as duas armaduras: uma ordem em anão e atacam. Não atacam quem se rende e sai; não saem da sala.
//   T6  o machado cujo cabo é uma haste imóvel.
//   T7  seis mefits de poeira e um wight, escondidos: emboscada, salvo Percepção CD 14. Encheram de poeira as fechaduras.
//   T8  o cofre: três fechaduras, uma aberta; as outras duas, Destreza com ferramentas de ladrão CD 18, com desvantagem
//       enquanto a poeira não for limpa. Por dentro (vindo de T4), abre fácil.
//   T9  o sangue e os ossos de uma cabra sacrificada.  T10 o Falfark e a gêmula de guarda, no quarto noroeste.
//   T11 a armadilha de intelecto atrás dos baús; a cena do anão contra o devorador; a jarra alquímica num dos baús.
//   T12 a mochila de um drow.  T13 a secreta para T15 (Percepção CD 15).  T14 os três drow, neutros, que contam o que sabem.
//   T15 os irmãos Henlifel: pedem que o grupo traga o pai SUBJUGADO; o periapto da saúde é a troca. O mapa deles mostra a
//       secreta (Percepção CD 12, automática para quem viu o mapa).
//   T16 o Livro de Granito: tocado, dois elementais da terra sobem do chão e atacam quem não usa à vista o símbolo de
//       Dumathoin (há um no cofre). O livro ensina a abrir a cripta.
//   T17 a Malinia nos ombros da estátua e quatro gêmulas ao pé.
//   T18 o Ontharyx e três cultistas. Ele aceita conversar e trai quando der; Intuição CD 14 prevê a traição.
//   T20 o disco: do entalhe menos lapidado ao mais, e uma gema no centro. Quem sabe (o Livro), ou Arcanismo ou
//       Investigação CD 13. Errado, um estrondo (Constituição CD 14, 4d10 de trovão, metade), uma vez só; depois de uma
//       hora de tentativas, acerta-se por acaso.
//   T21 o aglomerado encefálico e o FRAGMENTO DO OBELISCO. Se o grupo recuar sem ele, os fanáticos o levam para
//       Illithinoch: voltando depois de um dia, o fragmento sumiu.
//
//   O RELÓGIO DA GÊMULA: uma semana depois de o grupo ver o Falfark, se a gêmula dele ainda vive, ela vira um aglomerado
//       adulto e come o Falfark — quem volta ao quarto noroeste acha o aglomerado.
//   O OUTRO JEITO DO DISCO: 20 de dano psíquico no encaixe o estilhaçam, com o disco em qualquer posição. Arcanismo CD 14
//       percebe, e o Ontharyx preso conta. Quem é fiel de Dumathoin (`heroi.divindade`) sabe abrir o disco sem teste.
//   A cripta em si é a cena seguinte (`game/cripta-talhund.js`).

import { narrar } from '../view/narrativa.js';
import { distanceFt, GLIFOS, SUPERFICIES, ARESTA } from '../core/grid.js';
import { rolarPericia, skillBonus } from '../rules/abilities.js';
import { categoriaDeTamanho } from '../rules/tamanho.js';
import { rolarTeste } from '../rules/utilidade.js';
import { makeMonster } from '../rules/monsters.js';
import { garantirInventario } from '../rules/equipment.js';
import { guardar } from './comercio.js';
import { ctxDe } from './magias-fora.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { mudarFogo, luzNaCasa } from './fogo.js';
import { PONTOS_TALHUNDERETH as P } from './talhundereth-mapa.js';
import { damageRoll } from '../core/dice.js';
import { SPELLS } from '../rules/spells.js';
import { guardiaoVencido } from './obelisco6-marcos.js';

const MOVIMENTO = 60;
const TITULO = 'Talhundereth';
const GEMAS = ['gemaPequena', 'jade', 'peridotoGrande', 'quartzoAzul', 'ametistaGrande'];

/** O elenco do templo: chave, bloco, onde, nome, e se começa escondido (fora do tabuleiro). */
const ELENCO = [
  ['fremine', 'galebDuhr', P.galebs[0], 'Fremine', 'T2', true],
  ['frowode', 'galebDuhr', P.galebs[1], 'Frowode', 'T2', true],
  ['honna', 'medusa', P.honna, 'Honna', 'T3', false],
  ['cameren', 'galebDuhr', P.cameren, 'Cameren', 'T3', false],
  ['horror', 'horrorDeElmo', P.horror, null, 'T5', true],
  ['armadura1', 'armaduraAnimada', P.armaduras[0], null, 'T5', true],
  ['armadura2', 'armaduraAnimada', P.armaduras[1], null, 'T5', true],
  ...P.mefits.map((p, i) => [`mefit${i + 1}`, 'mefitDePoeira', p, null, 'T7', true]),
  ['wight', 'wight', P.wight, null, 'T7', true],
  ['falfark', 'mutanteHumanoide', P.falfark, 'Falfark', 'T10no', false],
  ['gemulaDoFalfark', 'gemulaEncefalica', P.gemulaDoFalfark, null, 'T10no', false],
  ['armadilha', 'armadilhaDeIntelecto', P.armadilha, null, 'T11', true],
  ['erdan', 'drow', P.drows[0], 'Erdan Vosselth', 'T14', false],
  ['thiala', 'drow', P.drows[1], 'Thiala Sharne', 'T14', false],
  ['vellios', 'drow', P.drows[2], 'Vellios Keethe', 'T14', false],
  ['nythalyn', 'drowGuerreiroDeElite', P.irmaos[0], 'Nythalyn Henlifel', 'T15', false],
  ['yanthdel', 'drowGuerreiroDeElite', P.irmaos[1], 'Yanthdel Henlifel', 'T15', false],
  ['elemental1', 'elementalDaTerra', P.elementais[0], null, 'T16', true],
  ['elemental2', 'elementalDaTerra', P.elementais[1], null, 'T16', true],
  ['malinia', 'mutanteHumanoide', P.malinia, 'Malinia', 'T17', false],
  ...P.gemulasDaEstatua.map((p, i) => [`gemulaDaEstatua${i + 1}`, 'gemulaEncefalica', p, null, 'T17', false]),
  ['ontharyx', 'mutanteHumanoide', P.ontharyx, 'Ontharyx Henlifel', 'T18', false],
  ['chals', 'mutanteHumanoide', P.cultistas[0], 'Chals', 'T18', false],
  ['harralie', 'mutanteHumanoide', P.cultistas[1], 'Harralie', 'T18', false],
  ['paulam', 'mutanteHumanoide', P.cultistas[2], 'Paulam', 'T18', false],
  ['aglomerado', 'aglomeradoEncefalico', P.aglomerado, null, 'T21', false],
];

export const salaEmTalhundereth = (p) => {
  for (const [id, cs] of Object.entries(P.salas)) if (cs.some((c) => c.x === p.x && c.y === p.y)) return id;
  return null;
};

export function criarTalhundereth(app, config = {}) {
  const enc = app.enc;
  const root = app.root;
  const camp = (app.campanha ??= {});
  const o6 = (camp.obelisco6 ??= { feito: {}, lutas: {} });
  o6.feito ??= {};
  o6.fragmentos ??= {};
  const t = (o6.talh ??= { feito: {}, mortos: [] });
  t.feito ??= {};
  t.mortos ??= [];
  const vila = (camp.vila ??= { pistas: [], missoes: {} });
  const estado = { explorando: false, encerrado: false, lutando: null };
  const todos = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead);
  const herois = () => todos().filter((c) => c.hp > 0);
  const painel = (texto, escolhas) => narrar(root, { formato: 'painel', paginas: [{ titulo: TITULO, texto: [].concat(texto) }], ...(escolhas ? { escolhas } : {}) });
  const pista = (txt) => { if (!(vila.pistas ??= []).includes(txt)) vila.pistas.push(txt); };
  const longe = (c, tile, pes = 5) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
  const salaDe = salaEmTalhundereth;
  const casasDa = (sala) => new Set((P.salas[sala] ?? []).map((c) => `${c.x},${c.y}`));
  const melhor = (pericia) => herois().reduce((a, b) => (skillBonus(b, pericia) > skillBonus(a, pericia) ? b : a));
  const teste = (quem, pericia, cd, opts = {}) => {
    const x = ctxDe(app, enc);
    return rolarTeste(x.estado, x.herois(), enc.rng, quem, pericia, cd, opts);
  };

  // ------------------------------------------------------------- o elenco ----
  const elenco = {};
  for (const [chave, id, pos, nome, sala, escondido] of ELENCO) {
    if (t.mortos.includes(chave)) continue;
    const m = makeMonster(id, { ...pos });
    if (nome) m.name = nome;
    m.chaveDoTemplo = chave;
    m.salaDoTemplo = sala;
    m.escondido = escondido;
    m.side = 'neutro';
    if (chave === 'ontharyx') m.skills = [...new Set([...(m.skills ?? []), 'enganacao'])];
    if (sala === 'T5') m.casasPermitidas = casasDa('T5');
    elenco[chave] = m;
  }
  // O RELÓGIO DA GÊMULA (o livro): passada uma semana desde que o grupo viu o Falfark, a gêmula viva vira um aglomerado
  // adulto, e a primeira refeição dele é o Falfark.
  if (t.feito.falfarkVistoNoDia != null && !t.feito.gemulaCresceu && elenco.gemulaDoFalfark
    && (vila.dia ?? 1) - t.feito.falfarkVistoNoDia >= 7) {
    t.feito.gemulaCresceu = true;
    for (const k of ['falfark', 'gemulaDoFalfark']) { if (!t.mortos.includes(k)) t.mortos.push(k); delete elenco[k]; }
  }
  if (t.feito.gemulaCresceu && !t.mortos.includes('aglomeradoDoFalfark')) {
    const m = makeMonster('aglomeradoEncefalico', { ...P.falfark });
    m.chaveDoTemplo = 'aglomeradoDoFalfark';
    m.salaDoTemplo = 'T10no';
    m.escondido = false;
    m.side = 'neutro';
    elenco.aglomeradoDoFalfark = m;
  }
  const vivos = (...chaves) => chaves.map((k) => elenco[k]).filter((m) => m && !m.dead);
  const daSala = (sala) => Object.values(elenco).filter((m) => m.salaDoTemplo === sala && !m.dead);
  const neutro = (f, olha = { dx: 0, dy: 1 }) => { f.side = 'neutro'; f.facingVec = olha; if (!enc.combatants.includes(f)) enc.addCombatant(f); };
  const tirar = (f) => { const i = enc.combatants.indexOf(f); if (i >= 0) enc.combatants.splice(i, 1); };

  // ------------------------------------------------------------- a mecânica ----
  function prepararExploracao() {
    enc.reinforcements = null;
    enc.over = false;
    enc.outcome = null;
    enc.side = 'party';
    enc.round = 1;
    enc.emboscada = null;
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

  /**
   * A luta. `surpresa`: 'nossa' (o grupo pega eles de surpresa), 'deles' (todo o grupo surpreendido) ou null.
   * `reforcos`: { rodada, bando, aviso } — quem chega depois (a capela, três rodadas depois do salão).
   */
  function luta(quem, { surpresa = null, reforcos = null } = {}) {
    for (const f of quem) {
      if (f.dead) continue;
      f.side = 'foes';
      f.escondido = false;
      if (!enc.combatants.includes(f)) enc.addCombatant(f);
    }
    estado.explorando = false;
    estado.lutando = [...quem];
    root.classList.remove('explorando');
    enc.emboscada = surpresa === 'nossa' ? { emboscadores: 'party', furtividade: herois().map(() => 20) }
      : surpresa === 'deles' ? { emboscadores: 'foes', furtividade: [99] } : null;
    enc.reinforcements = reforcos ? (rodada) => {
      if (rodada < reforcos.rodada) return null;
      const units = reforcos.bando.filter((f) => !f.dead && f.side !== 'foes');
      if (!units.length) return null;
      for (const f of units) { f.side = 'foes'; f.escondido = false; tirar(f); }
      estado.lutando = [...estado.lutando, ...units];
      return { units, aviso: reforcos.aviso };
    } : null;
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
    return true;
  }

  async function darXpDe(lista, motivo) {
    const grupo = todos();
    const xp = lista.filter((f) => f.dead || f.capturado).reduce((s, f) => s + (f.xp ?? 0), 0);
    if (!grupo.length || !xp) return;
    const cada = Math.floor(xp / grupo.length);
    const sobem = darXp(grupo, cada);
    enc.say('cura', `${motivo}: ${cada} XP para cada um.`);
    if (sobem.length) for (const txt of await telaDeSubirNivel(root, sobem)) enc.say('cura', txt);
  }

  const abrirAresta = (a, b) => enc.field.porAresta(a.x, a.y, b.x, b.y, ARESTA.aberta);
  function abrirSecreta(nome) {
    const s = P.secretas[nome];
    abrirAresta(s.a, s.b);
    (t.secretas ??= []).includes(nome) || t.secretas.push(nome);
    app.refresh?.();
  }
  function mudarCasa(x, y, glifo) {
    const f = enc.field;
    const g = GLIFOS[glifo];
    const i = y * f.w + x;
    f.tiles[i] = g.kind;
    f.surfaces[i] = SUPERFICIES.indexOf(g.sup);
    f.heights[i] = g.kind === 1 ? 3 : 0;
    f.versao = (f.versao ?? 0) + 1;
  }
  const sobre = (id, ligada) => enc.field.alternarSobreposicao?.(id, ligada);

  function sair(fazer) {
    estado.explorando = false;
    estado.encerrado = true;
    root.classList.remove('explorando');
    // O FRAGMENTO EM RISCO (o livro): visto e deixado para trás com o aglomerado vivo, os fanáticos mandam buscá-lo.
    if (t.feito.viuFragmento && !o6.fragmentos.talhundereth && elenco.aglomerado && !elenco.aglomerado.dead) {
      t.feito.fragmentoEmRiscoDesde ??= vila.dia ?? 1;
    }
    fazer(todos());
  }

  // ------------------------------------------------------------- as salas ----
  /** T2: quem chega à porta da capela acorda os dois galeb duhr. */
  async function galebsNaPorta() {
    const galebs = vivos('fremine', 'frowode');
    if (!galebs.length || t.feito.lutaT2 || t.feito.galebsAvisaram) return false;
    const chegou = herois().find((h) => P.portaDaCapela.some((p) => distanceFt(h.pos, p) <= 5) || salaDe(h.pos) === 'T3');
    if (!chegou) return false;
    t.feito.galebsAvisaram = true;
    const [a, b] = galebs;
    a.pos = { ...a.pos, ...P.galebs[0] };
    neutro(a, { dx: 0, dy: -1 });
    if (b) neutro(b, { dx: 0, dy: -1 });
    const r = await painel([
      `Uma das pedras junto do desabamento se desdobra: braços curtos, uma boca larga de rocha. Fala em comum, com a voz de um moinho: — A senhora não recebe ninguém. Voltem por onde vieram.`,
      b ? 'A outra pedra não diz nada. Só rola meio palmo para o lado, e fica entre vocês e a porta.' : '',
    ].filter(Boolean), [
      { rotulo: 'Recuar', valor: 'recuar', primaria: true },
      { rotulo: 'Atacar', valor: 'atacar' },
    ]);
    if (r === 'atacar') { lutaDoSalao(); return true; }
    await painel('As pedras voltam a ser pedras. Uma delas não tira o rosto de vocês.');
    return false;
  }

  function lutaDoSalao() {
    t.feito.lutaT2 = true;
    const capela = vivos('honna', 'cameren');
    luta(vivos('fremine', 'frowode'), { reforcos: capela.length ? { rodada: 4, bando: capela, aviso: 'Da capela, uma voz de mulher manda as pedras pararem de brincar — e a Honna vem ver.' } : null });
  }

  /** T3: a Honna pede que se ajoelhem. */
  async function honnaNaCapela() {
    const honna = vivos('honna')[0];
    if (!honna || t.feito.lutaT3) return false;
    if (!herois().some((h) => salaDe(h.pos) === 'T3')) return false;
    t.feito.lutaT3 = true;
    const galebs = vivos('fremine', 'frowode');
    const reforcos = galebs.length ? { rodada: 2, bando: galebs, aviso: 'Do salão, as duas pedras rolam para dentro da capela.' } : null;
    const r = await painel([
      'Uma mulher de véu, de costas, passa os dedos pelos encaixes vazios do altar. Ao lado, uma pedra com braços risca uma laje com um estilete.',
      '— Visitantes — diz ela, sem se virar. — Os espíritos dos mineiros ainda rezam aqui, sabiam? Quem se ajoelha como nos entalhes ouve o que eles pedem. Ajoelhem-se. Fechem os olhos, se quiserem. Eu digo quando abrir.',
    ], [
      { rotulo: 'Ajoelhar', valor: 'ajoelhar' },
      { rotulo: 'Desconfiar (Intuição)', valor: 'intuicao', primaria: true },
      { rotulo: 'Atacar', valor: 'atacar' },
    ]);
    if (r === 'ajoelhar') {
      await painel('Vocês se ajoelham. Ela se vira devagar e tira o véu. Os cabelos se mexem sozinhos.');
      return luta([honna, ...vivos('cameren')], { surpresa: 'deles', reforcos });
    }
    if (r === 'intuicao') {
      const quem = melhor('intuicao');
      const mentira = rolarPericia(enc.rng, honna, 'enganacao').total;
      const viu = teste(quem, 'intuicao', mentira);
      await painel(viu.passou
        ? `${quem.name} (Intuição ${viu.total}) repara nas estátuas dos cantos: ninguém esculpe a costura de uma roupa. As pessoas ajoelhadas aqui não rezaram — viraram pedra. — Ela vai tirar o véu.`
        : `${quem.name} (Intuição ${viu.total}) não vê nada de errado na voz dela.`);
      return luta([honna, ...vivos('cameren')], { surpresa: viu.passou ? null : 'deles', reforcos });
    }
    return luta([honna, ...vivos('cameren')], { reforcos });
  }

  /** T5: a ordem em anão. Quem se rende e sai não é atacado; quem volta, é. */
  async function treino() {
    const bando = vivos('horror', 'armadura1', 'armadura2');
    if (!bando.length || t.feito.lutaT5) return false;
    const dentro = herois().filter((h) => salaDe(h.pos) === 'T5');
    if (!dentro.length) return false;
    if (t.feito.t5Rendidos) {
      await painel('As armaduras dos cavaletes se mexem de novo. Desta vez, a voz não dá ordem nenhuma.');
      return comecarTreino(bando);
    }
    const anao = herois().some((h) => (h.languages ?? []).some((l) => /an[ãa]o/i.test(l)) || /an[ãa]o/i.test(h.race ?? h.ancestry ?? ''));
    const r = await painel([
      'Do cavalete do meio, uma armadura de anão vazia vira o elmo para vocês. Uma voz de dentro dela, oca, dá uma ordem curta.',
      anao ? '— "Rotina de táticas de esquadrão." — traduz quem entende anão. As outras duas armaduras descem dos cavaletes.' : 'As outras duas armaduras descem dos cavaletes.',
    ], [
      { rotulo: 'Render-se e sair', valor: 'render', primaria: true },
      { rotulo: 'Lutar', valor: 'lutar' },
    ]);
    if (r === 'render') {
      t.feito.t5Rendidos = true;
      // saem pela escada do salão; as armaduras voltam aos cavaletes
      const saida = [{ x: 21, y: 11 }, { x: 21, y: 12 }, { x: 20, y: 11 }, { x: 20, y: 12 }];
      dentro.forEach((h, i) => { h.pos = { ...h.pos, ...(enc.casaLivreMaisProxima(saida[i] ?? saida[0]) ?? saida[0]) }; });
      await painel('Vocês baixam as armas e recuam. As armaduras param no meio do passo e voltam, rangendo, para os cavaletes.');
      app.refresh();
      return false;
    }
    return comecarTreino(bando);
  }
  function comecarTreino(bando) {
    t.feito.lutaT5 = true;
    sobre('cavaletesVazios', true);
    return luta(bando);
  }

  /** T7: os mefits e o wight escondidos. Emboscada, salvo Percepção CD 14 de alguém. */
  async function arsenal() {
    const bando = vivos('mefit1', 'mefit2', 'mefit3', 'mefit4', 'mefit5', 'mefit6', 'wight');
    if (!bando.length || t.feito.lutaT7) return false;
    if (!herois().some((h) => salaDe(h.pos) === 'T7')) return false;
    t.feito.lutaT7 = true;
    const notou = herois().map((h) => ({ h, r: teste(h, 'percepcao', 14) })).find((x) => x.r.passou);
    await painel(notou
      ? `${notou.h.name} (Percepção ${notou.r.total}) vê a poeira se mexer contra o vento nas prateleiras: — Tem gente aqui!`
      : 'Da poeira das prateleiras saem diabinhos de pó, rindo, e de trás deles um homem morto de olhos acesos.');
    return luta(bando, { surpresa: notou ? null : 'deles' });
  }

  /** T10: o Falfark e a gêmula de guarda. */
  async function falfark() {
    const f = vivos('falfark')[0];
    if (!f || t.feito.lutaT10) return false;
    if (!herois().some((h) => salaDe(h.pos) === 'T10no' || distanceFt(h.pos, f.pos) <= 10)) return false;
    const bando = vivos('falfark', 'gemulaDoFalfark');
    if (t.feito.falfarkFalou) { t.feito.lutaT10 = true; return luta(bando); }
    t.feito.falfarkFalou = true;
    t.feito.falfarkVistoNoDia ??= vila.dia ?? 1;
    const menor = herois().reduce((a, b) => ((categoriaDeTamanho(b) ?? 2) < (categoriaDeTamanho(a) ?? 2) ? b : a));
    const r = await painel([
      'Um homem magro, de pele cinza e veias escuras, está sentado à mesa de pedra com uma coisa de cérebro e pernas finas no colo, como um gato.',
      `— A pedra fala a verdade — diz ele, rindo para dentro. — A pedra que veio de longe, de muito longe. Ela vomita filhos, e os filhos têm fome. — Ele olha para ${menor.name}. — Esse aí. Esse é do tamanho certo. Deem esse a ela, e eu falo bem de vocês para a pedra.`,
    ], [
      { rotulo: 'Recusar', valor: 'recusar', primaria: true },
      { rotulo: 'Sair do quarto', valor: 'sair' },
    ]);
    if (r === 'sair') return false;
    t.feito.lutaT10 = true;
    return luta(bando);
  }

  /** T10, uma semana depois: a gêmula cresceu e comeu o Falfark. */
  async function aglomeradoDoFalfark() {
    const a = vivos('aglomeradoDoFalfark')[0];
    if (!a || t.feito.lutaT10ag) return false;
    if (!herois().some((h) => salaDe(h.pos) === 'T10no' || distanceFt(h.pos, a.pos) <= 10)) return false;
    t.feito.lutaT10ag = true;
    await painel([
      'O quarto do Falfark mudou. A mesa de pedra está virada, e a cadeira, em pedaços. No lugar onde ele sentava, uma massa cinza do tamanho de um boi pulsa devagar, com pedaços de túnica presos nas dobras.',
      'Da coisa que ele carregava no colo como um gato não sobrou nada pequeno. Do Falfark, só as sandálias.',
    ]);
    return luta([a]);
  }

  /** T11: a cena do anão contra o devorador, e a armadilha que sai do nicho. */
  async function salaComum() {
    const a = vivos('armadilha')[0];
    if (!a || t.feito.lutaT11) return false;
    if (herois().some((h) => salaDe(h.pos) === 'T11') && !t.feito.ilusaoT11) {
      t.feito.ilusaoT11 = true;
      await painel([
        'O ar da sala tremula. Por um instante, há uma briga aqui: uma criatura de cabeça de polvo urra em cima da mesa comprida, e um anão de armadura a acerta com o martelo com tanta força que a mesa racha ao meio.',
        'A imagem do anão recua até os baús, rindo, comemorando, e acena para vocês: venham ver.',
      ]);
    }
    if (!herois().some((h) => distanceFt(h.pos, a.pos) <= 30)) return false;
    t.feito.lutaT11 = true;
    await painel('Detrás dos baús, uma coisa sai do nicho, pairando: um cérebro inchado com tentáculos pendurados. A cabeça de vocês se enche de vozes.');
    return luta([a]);
  }

  /** T14: os três drow, desconfiados, e os chefes deles. */
  async function drows() {
    if (t.feito.drowsFalaram || !herois().some((h) => salaDe(h.pos) === 'T14')) return false;
    if (!vivos('erdan', 'thiala', 'vellios').length) return false;
    t.feito.drowsFalaram = true;
    await painel([
      'Três elfos de pele escura e cabelo branco se levantam dos colchonetes, de mão na espada, sem a tirar da bainha. Um deles chama alguém na sala ao lado, numa língua que estala.',
      'Saem dois mais, uma mulher e um homem de armadura leve, irmãos pela cara. A mulher fala comum, devagar: chegaram pelo fundo, pela entrada da caverna, atrás do pai deles, que ouviu um chamado na cabeça e veio para cá. Temem que ele tenha caído num culto.',
      '— Há uma coisa que mexe com a cabeça na sala comum. Não chegamos perto da imagem de lá: é isca. A biblioteca ao lado está cheia de livros, e só o meu irmão lê a língua deles. Queremos ir mais fundo, mas os do culto são fortes demais, com aqueles bichos.',
    ]);
    pista('Os drow de Talhundereth vieram atrás do pai dos irmãos Henlifel, que ouviu um chamado e entrou num culto. Evitam a sala comum (T11), onde uma criatura mexe com a cabeça.');
    return irmaos();
  }

  /** T15: o pedido dos irmãos Henlifel. */
  async function irmaos() {
    if (t.feito.irmaosPediram || !vivos('nythalyn', 'yanthdel').length) return false;
    if (!herois().some((h) => ['T14', 'T15'].includes(salaDe(h.pos)))) return false;
    t.feito.irmaosPediram = true;
    t.feito.viuMapaDosIrmaos = true;
    await painel([
      'A mulher, Yanthdel, abre um mapa de pano sobre a cama: o salão, a sala de estar e as salas em volta, até a estátua lá embaixo. Há uma porta desenhada na parede do quarto, onde vocês não veem porta nenhuma.',
      '— Nosso pai se chama Ontharyx. Esperávamos encontrá-lo junto da estátua, e ele não veio. Está mais fundo. Não virá por vontade própria: tragam-no aqui, de pé ou desacordado, mas vivo. Nós o faremos ver o erro.',
      '— Se quiserem paga — ela tira do pescoço um pingente de pedra vermelha —, isto vale um pai.',
    ]);
    pista('Os irmãos Henlifel, em Talhundereth (T15): trazer o pai deles, Ontharyx, SUBJUGADO e vivo, em troca do periapto da saúde de Yanthdel. O mapa deles mostra uma porta secreta no quarto do bibliotecário.');
    return false;
  }

  /** T17: a Malinia nos ombros da estátua. */
  async function estatua() {
    const bando = vivos('malinia', 'gemulaDaEstatua1', 'gemulaDaEstatua2', 'gemulaDaEstatua3', 'gemulaDaEstatua4');
    if (!bando.length || t.feito.lutaT17) return false;
    if (!herois().some((h) => salaDe(h.pos) === 'T17')) return false;
    t.feito.lutaT17 = true;
    await painel([
      'No fim do salão entulhado, um anão de pedra de três metros sobre um pedestal mais alto que uma casa. Nos ombros dele, a seis metros do chão, uma mulher de cinzel e martelo talha a cabeça da estátua numa cara de muitos olhos que grita.',
      'Ao pé do pedestal, quatro coisas de cérebro roem lascas. A mulher olha para baixo e assobia, e as quatro se viram.',
    ]);
    if (elenco.malinia && !elenco.malinia.dead) elenco.malinia.pairaNoAr = true;
    return luta(bando);
  }

  /** T18: o Ontharyx e a farsa da conversa. */
  async function purificacao() {
    const bando = vivos('ontharyx', 'chals', 'harralie', 'paulam');
    if (!bando.length || t.feito.lutaT18) return false;
    if (!herois().some((h) => salaDe(h.pos) === 'T18')) return false;
    t.feito.lutaT18 = true;
    const o = vivos('ontharyx')[0];
    const r = await painel([
      'Quatro figuras de capuz, em círculo, rezam baixinho em volta de uma bacia de pedra cheia de fungo. Viram-se ao mesmo tempo. — Mais carne para a pedra! — grita uma delas. — A pedra tem fome!',
      ...(o && t.feito.irmaosPediram ? ['Um deles, um elfo de pele escura com a cara cheia de veias, tem os olhos dos filhos.'] : []),
    ], [
      ...(o ? [{ rotulo: 'Pedir para falar com Ontharyx', valor: 'falar', primaria: true }] : []),
      { rotulo: 'Atacar', valor: 'atacar', primaria: !o },
    ]);
    if (r === 'falar' && o) {
      t.feito.falouComOntharyx = true;
      const quem = melhor('intuicao');
      const viu = teste(quem, 'intuicao', 14);
      await painel([
        'O elfo levanta a mão e os outros se calam. Ele vem até vocês sem pressa, sem sair do círculo, e sorri: — Meus filhos mandaram vocês. Que gentileza. Vamos conversar, então.',
        viu.passou
          ? `${quem.name} (Intuição ${viu.total}) vê os outros três se afastarem meio passo cada, abrindo espaço. Ele não vai a lugar nenhum: está escolhendo em quem bater primeiro.`
          : `${quem.name} (Intuição ${viu.total}) acredita nele. Por um instante.`,
      ]);
      return luta(bando, { surpresa: viu.passou ? null : 'deles' });
    }
    return luta(bando);
  }

  /** T21: o aglomerado e o fragmento. */
  async function salaoDeCulto() {
    const a = vivos('aglomerado')[0];
    if (!herois().some((h) => salaDe(h.pos) === 'T21')) return false;
    if (!t.feito.viuFragmento) {
      t.feito.viuFragmento = true;
      await painel([
        'O salão maior do templo tem colunas pretas, como se tivessem queimado por dentro. No altar partido, sob a estátua de um rei anão, uma pedra negra do tamanho de um pão brilha com veios verdes: um pedaço do obelisco.',
        ...(a ? ['Em volta dele, uma massa de cérebros do tamanho de uma carroça pula, sem pressa, como um cachorro que guarda o osso.'] : []),
      ]);
    }
    if (!a || t.feito.lutaT21) return false;
    t.feito.lutaT21 = true;
    return luta([a]);
  }

  async function depoisDoPasso() {
    if (!estado.explorando) return;
    for (const f of [galebsNaPorta, honnaNaCapela, treino, arsenal, falfark, aglomeradoDoFalfark, salaComum, drows, irmaos, estatua, purificacao, salaoDeCulto]) {
      if (await f()) return;
      if (!estado.explorando) return;
    }
  }

  // ------------------------------------------------------------- o fim ----
  async function fimDoCombate(outcome) {
    const lutou = estado.lutando ?? [];
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      await narrar(root, { formato: 'tela', paginas: [{ titulo: TITULO, texto: ['O templo de Dumathoin guarda mais uns ossos.'] }] });
      app.encerrarPartida();
      return;
    }
    for (const m of lutou) if ((m.dead || m.capturado) && m.chaveDoTemplo && !t.mortos.includes(m.chaveDoTemplo)) t.mortos.push(m.chaveDoTemplo);
    const nomes = {
      T2: 'Os guardas de pedra do salão', T3: 'A Honna e os guardas dela', T5: 'O horror de elmo e as armaduras', T7: 'Os mefits e o wight do arsenal',
      T10no: t.feito.gemulaCresceu ? 'O aglomerado que comeu o Falfark' : 'O Falfark e a gêmula', T11: 'A armadilha de intelecto', T16: 'Os guardiões do Livro de Granito', T17: 'A Malinia e as gêmulas da estátua',
      T18: 'Os cultistas da purificação', T21: 'O aglomerado encefálico', T14: 'Os drow', T15: 'Os irmãos Henlifel',
    };
    const sala = lutou.find((m) => m.salaDoTemplo)?.salaDoTemplo;
    await darXpDe(lutou, nomes[sala] ?? 'A luta');
    const o = elenco.ontharyx;
    if (o && lutou.includes(o)) {
      if (o.capturado && !o.dead) {
        t.feito.ontharyxPreso = true;
        await painel('O Ontharyx cai de joelhos e depois de lado, vivo, respirando curto. Dá para levá-lo aos filhos.');
      } else if (o.dead) t.feito.ontharyxMorto = true;
    }
    if (sala === 'T21') {
      await painel('A massa de cérebros desaba e escorre pelo chão do salão. O fragmento continua brilhando no altar, sem ninguém em volta.');
      // o guardião do fragmento: o marco do 8º (e o do 9º, se os outros dois já caíram)
      await guardiaoVencido(app, o6, 'talhundereth', herois());
    }
    // depois da luta, os escondidos que sobraram voltam a esperar
    prepararExploracao();
  }

  // ------------------------------------------------------- as interações ----
  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    const aqui = (p) => p && tile.x === p.x && tile.y === p.y;
    const perto = (p, pes = 5) => p && distanceFt(tile, p) <= pes;

    // a saída: a caverna larga do norte
    if (P.saida.some(aqui)) {
      ops.push({ rotulo: 'Sair de Talhundereth', icone: 'acao-disparada', detalhe: 'de volta às colinas', motivo: longe(c, tile), fazer: () => sair(async (v) => {
        // `app.abrirRegiao`: quem roda a cena fora do navegador (o teste) passa o seu; o mapa da região importa arte
        const abrirRegiao = app.abrirRegiao ?? (await import('./regiao.js')).abrirRegiao;
        app.capitulo = null; app.enc = null; app.board = null; app.selected = null; app.mode = null;
        abrirRegiao(app, { grupo: v, onde: 'talhundereth' });
      }) });
    }
    if (aqui(P.tunelOeste)) {
      ops.push({ rotulo: 'Seguir o túnel baixo', icone: 'acao-disparada', detalhe: 'para oeste, curvado · até a Encruzilhada da Forca', motivo: longe(c, tile), fazer: () => sair((v) => {
        pista('O túnel baixo a oeste da entrada de Talhundereth desce até a Encruzilhada da Forca.');
        app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'encruzilhada', chegada: 'talhundereth', continuarCom: v });
      }) });
    }

    // T4 e o vão do cofre
    if (aqui(P.pontaDoVao) || aqui(P.vaoDoCofre)) {
      if (!t.feito.vaoAberto) {
        const pequeno = (categoriaDeTamanho(c) ?? 2) <= 1;
        ops.push({ rotulo: 'Espremer-se pelo vão', icone: 'acao-disparada', detalhe: 'só quem é Pequeno', motivo: longe(c, tile) ?? (pequeno ? null : `${c.name} não cabe`), fazer: () => {
          c.pos = { ...c.pos, ...P.dentroDoCofre };
          enc.say('acao', `${c.name} se espreme entre as pedras e cai do outro lado, num chão de mosaico coberto de pó.`);
          app.refresh();
        } });
        ops.push({ rotulo: 'Tirar as pedras do vão', icone: 'acao-empurrar', detalhe: 'duas horas, com o grupo todo', motivo: longe(c, tile), fazer: async () => {
          t.feito.vaoAberto = true;
          mudarCasa(P.vaoDoCofre.x, P.vaoDoCofre.y, 'x');
          enc.field.porAresta(P.vaoDoCofre.x, P.vaoDoCofre.y, P.dentroDoCofre.x, P.dentroDoCofre.y, ARESTA.aberta);
          await painel('Duas horas de pedra na mão, passando de um para o outro. No fim, o vão dá passagem para alguém de pé, curvado.');
          app.refresh();
        } });
      }
    }

    // T6: o machado
    if (aqui(P.machado) && !t.feito.machado) {
      ops.push({ rotulo: 'Tirar o machado do suporte', icone: 'acao-usarObjeto', motivo: longe(c, tile), fazer: async () => {
        t.feito.machado = true;
        guardar(c, 'varaImovel', 1);
        sobre('machadoTirado', true);
        await painel(`A lâmina não presta, e ${c.name} a solta do cabo com duas pancadas. O cabo é outra coisa: uma haste de ferro escuro com um botão no punho, que se trava no ar quando se aperta.`);
        app.refresh();
      } });
    }

    // T7/T8: a porta do cofre e as três fechaduras
    const ladoDeFora = aqui(P.portaDoCofre);
    const ladoDeDentro = aqui({ x: P.secretas.cofre.a.x, y: P.secretas.cofre.a.y });
    if ((ladoDeFora || ladoDeDentro) && !(t.secretas ?? []).includes('cofre')) {
      if (ladoDeDentro) {
        ops.push({ rotulo: 'Abrir a porta por dentro', icone: 'acao-usarObjeto', detalhe: 'as trancas de dentro correm fácil', motivo: longe(c, tile), fazer: () => { abrirSecreta('cofre'); enc.say('acao', `${c.name} corre as três trancas por dentro, e a porta do cofre se abre.`); } });
      } else {
        t.fechaduras ??= 1;
        if (!t.feito.viuPoeira) {
          ops.push({ rotulo: 'Examinar as fechaduras', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
            t.feito.viuPoeira = true;
            await painel('Três montanhas entalhadas, uma fechadura no pico de cada. A do meio está aberta. As outras duas estão entupidas de poeira até a boca, socada lá dentro com cuidado — ninguém abre isso sem limpar antes.');
            app.refresh();
          } });
        } else if (!t.feito.poeiraLimpa) {
          ops.push({ rotulo: 'Limpar a poeira das fechaduras', icone: 'acao-usarObjeto', detalhe: 'alguns minutos', motivo: longe(c, tile), fazer: () => { t.feito.poeiraLimpa = true; enc.say('acao', `${c.name} tira a poeira das duas fechaduras com a ponta de uma faca e um sopro.`); app.refresh(); } });
        }
        const temFerramenta = garantirInventario(c).bag.some((i) => i.id === 'ferramentasDeLadrao' && (i.qtd ?? 1) > 0);
        ops.push({ rotulo: `Abrir uma fechadura (${t.fechaduras} de 3 abertas)`, icone: 'acao-usarObjeto',
          detalhe: `ferramentas de ladrão · Destreza, CD 18${t.feito.poeiraLimpa ? '' : ' · com desvantagem (poeira)'}`,
          motivo: longe(c, tile) ?? (temFerramenta ? null : `${c.name} não tem ferramentas de ladrão`), fazer: () => {
            const r = teste(c, 'prestidigitacao', 18, { desvantagem: !t.feito.poeiraLimpa });
            if (!r.passou) { enc.say('acao', `A fechadura não cede a ${c.name} (${r.total} contra CD 18).`); app.refresh(); return; }
            t.fechaduras += 1;
            enc.say('acao', `Uma das fechaduras estala para ${c.name} (${r.total} contra CD 18).`);
            if (t.fechaduras >= 3) { abrirSecreta('cofre'); enc.say('acao', 'Com a terceira, a porta do cofre se abre para dentro, levantando poeira.'); }
            app.refresh();
          } });
      }
    }
    if (aqui(P.tesouro) && !t.feito.cofreSaqueado) {
      ops.push({ rotulo: 'Recolher o tesouro do cofre', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
        t.feito.cofreSaqueado = true;
        guardar(c, 'moedaDePlatina', 510);
        guardar(c, 'moedaDeOuro', 1250);
        guardar(c, 'gemaPequena', 12);
        guardar(c, 'simboloDeDumathoin', 1);
        guardar(c, 'estatuetaDeGuerreiroAnao', 3);
        guardar(c, 'pocaoDeInvulnerabilidade', 1);
        guardar(c, 'olhosDeVisaoMinuciosa', 1);
        sobre('cofreVazio', true);
        await painel([
          'Debaixo de um pó fino como farinha: montes de moedas de platina e de ouro, um punhado de gemas pequenas, três guerreiros anões de ouro maciço, um frasco de líquido cor de ferro, um par de lentes de cristal num estojo, e uma montanha de platina com uma gema no coração — o símbolo de Dumathoin.',
          `${c.name} leva tudo: 510 peças de platina, 1.250 de ouro, 12 gemas, as três estatuetas, a poção, as lentes e o símbolo.`,
        ]);
        app.refresh();
      } });
    }

    // T11: a jarra
    if (aqui(P.bauDaJarra) && !t.feito.jarra) {
      ops.push({ rotulo: 'Revirar os baús', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
        t.feito.jarra = true;
        guardar(c, 'jarraAlquimica', 1);
        await painel('Poeira, louça rachada, poeira. Num dos baús, debaixo de canecas de estanho, uma jarra de barro pesada que chacoalha como se tivesse alguma coisa dentro, e está vazia.');
        app.refresh();
      } });
    }

    // T12: a mochila do drow
    if (aqui(P.mochila) && !t.feito.mochila) {
      ops.push({ rotulo: 'Abrir a mochila', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
        t.feito.mochila = true;
        guardar(c, 'cordaDeSeda', 2);
        guardar(c, 'adaga', 3);
        guardar(c, 'suprimentosDeCaligrafo', 1);
        guardar(c, 'medalhaoDeLagarto', 1);
        await painel('Uma mochila de couro fino, de feitio drow: duas cordas de seda, três adagas, um livro de folhas em branco, penas e tintas, e um medalhão de prata com uma cabeça de lagarto.');
        app.refresh();
      } });
    }

    // T13/T15: a secreta
    if (!(t.secretas ?? []).includes('bibliotecario')) {
      if (aqui(P.secretas.bibliotecario.a)) {
        ops.push({ rotulo: 'Procurar nas prateleiras', icone: 'acao-procurar', detalhe: 'Percepção, CD 15', motivo: longe(c, tile), fazer: () => {
          const r = teste(c, 'percepcao', 15, achaSecretaComVantagem(c));
          if (!r.passou) { enc.say('acao', `${c.name} não acha nada além de farinha velha (${r.total} contra CD 15).`); app.refresh(); return; }
          abrirSecreta('bibliotecario');
          enc.say('acao', `${c.name} empurra o fundo de uma prateleira, e ela gira para fora (${r.total} contra CD 15).`);
        } });
      }
      if (aqui(P.secretas.bibliotecario.b)) {
        ops.push({ rotulo: 'Procurar a alavanca', icone: 'acao-procurar', detalhe: t.feito.viuMapaDosIrmaos ? 'o mapa mostra onde' : 'Percepção, CD 12', motivo: longe(c, tile), fazer: () => {
          const r = t.feito.viuMapaDosIrmaos ? { passou: true, total: 'o mapa' } : teste(c, 'percepcao', 12, achaSecretaComVantagem(c));
          if (!r.passou) { enc.say('acao', `${c.name} não acha nada (${r.total} contra CD 12).`); app.refresh(); return; }
          abrirSecreta('bibliotecario');
          enc.say('acao', `${c.name} puxa uma alavanca escondida atrás da estante, e um pedaço da parede se abre.`);
        } });
      }
    }

    // T15: entregar o pai
    if (P.irmaos.some((p) => perto(p, 5)) && vivos('yanthdel').length && !t.feito.periapto) {
      if (t.feito.ontharyxPreso || (t.feito.ontharyxMorto && t.feito.falouComOntharyx)) {
        const preso = t.feito.ontharyxPreso;
        ops.push({ rotulo: preso ? 'Entregar o Ontharyx aos filhos' : 'Contar aos filhos o que houve', icone: 'acao-usarObjeto', motivo: longe(c, tile, 10), fazer: async () => {
          t.feito.periapto = true;
          guardar(c, 'periaptoDaSaude', 1);
          await painel(preso
            ? 'Os dois irmãos amarram o pai com cuidado e sentam-se ao lado dele, sem dizer nada. A Yanthdel tira o pingente vermelho do pescoço e o põe na mão de quem o trouxe.'
            : 'A Yanthdel escuta com os olhos fechados. Acredita que vocês tentaram conversar primeiro. Tira o pingente vermelho do pescoço e o entrega sem uma palavra.');
          app.refresh();
        } });
      }
    }

    // T16: o Livro de Granito
    if (aqui(P.livro) && !t.feito.livro) {
      ops.push({ rotulo: 'Pegar o Livro de Granito', icone: 'acao-usarObjeto', motivo: longe(c, tile), fazer: () => pegarOLivro(c) });
    }

    // T20: o disco e a porta da cripta
    if (aqui(P.disco) && !(t.secretas ?? []).includes('cripta')) {
      ops.push(...opcoesDoDisco(c, tile));
    }
    if (P.escadaDaCripta.some(aqui) && (t.secretas ?? []).includes('cripta')) {
      ops.push({ rotulo: 'Descer à Cripta dos Talhund', icone: 'acao-disparada', motivo: longe(c, tile), fazer: () => sair((v) => {
        app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'criptaTalhund', continuarCom: v });
      }) });
    }

    // T21: o fragmento
    if (aqui(P.fragmento) && !o6.fragmentos.talhundereth && !t.feito.fragmentoLevado) {
      ops.push({ rotulo: 'Pegar o fragmento do obelisco', icone: 'acao-usarObjeto', motivo: longe(c, tile), fazer: async () => {
        o6.fragmentos.talhundereth = true;
        delete t.feito.fragmentoEmRiscoDesde;
        sobre('altarSemFragmento', true);
        const luz = luzNaCasa(enc.field, { x: 22, y: 39 });
        if (luz) mudarFogo(enc.field, luz, false);
        await painel(`${c.name} levanta a pedra negra. Ela é morna, e pesa mais do que devia. Os veios verdes pulsam uma vez, devagar, e se aquietam.`);
        pista('O fragmento de Talhundereth está com o grupo. Faltam o da Cripta dos Talhund e o da Encruzilhada da Forca.');
        app.refresh();
      } });
    }
    return ops;
  }

  async function pegarOLivro(c) {
    const portador = herois().find((h) => garantirInventario(h).bag.some((i) => i.id === 'simboloDeDumathoin' && (i.qtd ?? 1) > 0));
    const elementais = vivos('elemental1', 'elemental2');
    t.feito.livro = true;
    guardar(c, 'livroDeGranito', 1);
    t.feito.sabeODisco = true;
    pista('O Livro de Granito: a lista dos que dormem na Cripta dos Talhund e, em anão, como abrir a porta dela — girar o disco do entalhe menos lapidado ao mais lapidado, e pôr uma gema no centro.');
    if (!elementais.length) { app.refresh(); return; }
    // os guardiões não atacam quem usa à vista o símbolo de Dumathoin
    const alvos = herois().filter((h) => salaDe(h.pos) === 'T16' && h !== portador);
    if (!alvos.length) {
      await painel(`O chão da biblioteca se levanta em dois montes de pedra e terra, que olham para ${portador?.name ?? 'vocês'} — para o símbolo de Dumathoin — e afundam de novo, devagar.`);
      for (const e of elementais) { e.dead = true; e.inerte = true; e.xp = 0; if (!t.mortos.includes(e.chaveDoTemplo)) t.mortos.push(e.chaveDoTemplo); }
      app.refresh();
      return;
    }
    for (const e of elementais) {
      e.pos = { ...e.pos, ...(enc.casaLivreMaisProxima(e.pos) ?? e.pos) };
      if (portador) e.ignora = (x) => x === portador;
    }
    await painel([`${c.name} levanta o livro, de páginas de metal e capa de granito. O chão da biblioteca racha, e dois montes de pedra e terra se erguem dele.`,
      ...(portador ? [`Eles passam os olhos por ${portador.name}, pelo símbolo no peito, e não o veem.`] : [])]);
    luta(elementais);
  }

  /** As magias de dano psíquico que o herói tem prontas (o encaixe só aceita esse dano). */
  const magiasPsiquicas = (c) => [...new Set([...(c.spellcasting?.prepared ?? []), ...(c.spellcasting?.cantrips ?? []), ...(c.spellcasting?.known ?? [])])]
    .map((id) => ({ id, s: SPELLS[id] })).filter((x) => x.s?.damageType === 'psíquico');

  function opcoesDoDisco(c, tile) {
    const ops = [];
    const motivo = longe(c, tile);
    if (!t.feito.discoCerto) {
      ops.push({ rotulo: 'Examinar o disco', icone: 'acao-procurar', motivo, fazer: async () => {
        await painel('Um disco de pedra na parede, com catorze entalhes em volta e uma seta fixa no alto. Os entalhes são a mesma gema em catorze estágios de lapidação, dos primeiros riscos a uma lapidação completa. No centro, um encaixe facetado, vazio. Acima, letras anãs: só um presente inteiro abre o que está embaixo.');
      } });
      const fiel = herois().find((h) => /dumathoin/i.test(h.divindade ?? ''));
      if (t.feito.sabeODisco || fiel) {
        ops.push({ rotulo: t.feito.sabeODisco ? 'Girar o disco como o Livro ensina' : `Girar o disco como ${fiel.name} sabe`, icone: 'acao-usarObjeto', motivo, fazer: () => { t.feito.discoCerto = true; enc.say('acao', `${c.name} gira o disco do entalhe mais tosco ao mais acabado, um a um. Algo estala por dentro da parede.`); app.refresh(); } });
      } else {
        ops.push({ rotulo: 'Estudar o disco', icone: 'acao-procurar', detalhe: 'Arcanismo ou Investigação, CD 13', motivo, fazer: () => {
          const pericia = (c.skills ?? []).includes('arcanismo') ? 'arcanismo' : 'investigacao';
          const r = teste(c, pericia, 13);
          if (r.passou) { t.feito.discoCerto = true; enc.say('acao', `${c.name} entende (${r.total} contra CD 13): é um cadeado, e a ordem é a da lapidação — do bruto ao acabado. Gira o disco, e algo estala por dentro.`); }
          else enc.say('acao', `${c.name} não entende a ordem dos entalhes (${r.total} contra CD 13).`);
          app.refresh();
        } });
        ops.push({ rotulo: 'Tentar ao acaso', icone: 'acao-usarObjeto', detalhe: t.feito.estrondo ? 'uma hora de tentativas' : 'arriscado', motivo, fazer: async () => {
          if (!t.feito.estrondo) {
            t.feito.estrondo = true;
            await painel('O disco gira, gira, para. Um estrondo sai da parede, como uma montanha que se mexe.');
            for (const h of herois().filter((x) => salaDe(x.pos) === 'T20' || P.escadaDaCripta.some((p) => p.x === x.pos.x && p.y === x.pos.y))) {
              const sv = enc.resistencia(h, 'con', 14, { contra: { dano: 'trovejante' } });
              const d = enc.rng.die(10) + enc.rng.die(10) + enc.rng.die(10) + enc.rng.die(10);
              const dano = sv.success ? Math.floor(d / 2) : d;
              enc.say('dano', `O estrondo pega ${h.name}: ${dano} de trovão${sv.success ? ' (passou: metade)' : ''}.`);
              enc.applyDamage(h, dano, 'trovejante', null, { magico: true });
            }
          } else {
            t.feito.discoCerto = true;
            await painel('Uma hora de tentativas, uma combinação atrás da outra. Numa delas, algo estala por dentro da parede. Falta o presente: o encaixe do centro continua vazio.');
          }
          app.refresh();
        } });
      }
    }
    // O OUTRO JEITO (o livro): os devoradores de mente sobrecarregaram o encaixe com magia psíquica. 20 de dano psíquico
    // nele estilhaçam a fechadura, com o disco em qualquer posição.
    if (!t.feito.sabeOPsiquico) {
      ops.push({ rotulo: 'Estudar o encaixe do centro', icone: 'acao-procurar', detalhe: 'Arcanismo, CD 14', motivo: motivo ?? (t.feito.encaixeEstudadoPor?.includes(c.id) ? `${c.name} já olhou o encaixe` : null), fazer: async () => {
        (t.feito.encaixeEstudadoPor ??= []).push(c.id);
        const r = teste(c, 'arcanismo', 14);
        if (r.passou) {
          t.feito.sabeOPsiquico = true;
          await painel(`${c.name} (Arcanismo ${r.total}) vê, em volta do encaixe, a pedra fosca e rachada por dentro, como vidro que levou calor demais. Alguém já abriu isto sem girar disco nenhum: enchendo o encaixe de força da mente até ele estourar. Uns vinte golpes de dor psíquica bastariam.`);
        } else await painel(`${c.name} (Arcanismo ${r.total}) não vê no encaixe nada além de um buraco facetado.`);
        app.refresh();
      } });
      if (t.feito.ontharyxPreso) {
        ops.push({ rotulo: 'Perguntar ao Ontharyx', icone: 'acao-procurar', motivo, fazer: async () => {
          t.feito.sabeOPsiquico = true;
          await painel('O Ontharyx ri baixo, amarrado. — Os mestres não giravam disco nenhum. Enchiam o buraco de pensamento até ele rachar. Vocês não têm cabeça para isso.');
          app.refresh();
        } });
      }
    } else {
      t.feito.encaixePsiquico ??= 0;
      const falta = 20 - t.feito.encaixePsiquico;
      for (const mg of magiasPsiquicas(c)) {
        const semEspaco = mg.s.level > 0 && !(c.spellcasting?.slots ?? []).some((n, i) => i >= mg.s.level && n > 0);
        ops.push({ rotulo: `Sobrecarregar o encaixe com ${mg.s.name ?? mg.id}`, icone: 'acao-atacar', detalhe: `faltam ${falta} de dano psíquico`, motivo: longe(c, tile, 60) ?? (semEspaco ? 'sem espaço de magia' : null), fazer: async () => {
          if (mg.s.level > 0) { const sl = c.spellcasting.slots; sl[sl.findIndex((n, i) => i >= mg.s.level && n > 0)] -= 1; }
          const dano = damageRoll(enc.rng, mg.s.damage ?? '1d6').total;
          t.feito.encaixePsiquico += dano;
          if (t.feito.encaixePsiquico < 20) {
            await painel(`${c.name} solta ${mg.s.name ?? mg.id} no encaixe: ${dano} de dano psíquico. A pedra em volta estala por dentro (faltam ${20 - t.feito.encaixePsiquico}).`);
          } else {
            abrirSecreta('cripta');
            t.feito.criptaAberta = true;
            t.feito.discoEstilhacado = true;
            await painel(`${c.name} solta ${mg.s.name ?? mg.id}: ${dano} de dano psíquico, e o encaixe estoura em lascas. O disco gira solto, sem prender mais nada, e a parede do lado se abre para dentro: lá embaixo, uma escada desce em espiral.`);
          }
          app.refresh();
        } });
      }
    }
    if (t.feito.discoCerto) {
      const gema = herois().map((h) => ({ h, i: garantirInventario(h).bag.find((x) => GEMAS.includes(x.id) && (x.qtd ?? 1) > 0) })).find((x) => x.i);
      ops.push({ rotulo: 'Pôr uma gema no centro', icone: 'acao-usarObjeto', detalhe: gema ? gema.i.name.toLowerCase() : 'sem gema nenhuma', motivo: motivo ?? (gema ? null : 'ninguém tem uma gema'), fazer: async () => {
        gema.i.qtd = (gema.i.qtd ?? 1) - 1;
        if (gema.i.qtd <= 0) garantirInventario(gema.h).bag.splice(garantirInventario(gema.h).bag.indexOf(gema.i), 1);
        abrirSecreta('cripta');
        t.feito.criptaAberta = true;
        await painel('A gema encaixa com um clique, e o disco a engole. A parede do lado se abre para dentro, e lá embaixo uma escada desce em espiral para o escuro.');
      } });
    }
    return ops;
  }

  return {
    lugar: TITULO,
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
    estado: t,
    async iniciar() {
      // o que já se abriu fica aberto
      for (const nome of t.secretas ?? []) abrirSecreta(nome);
      if (t.feito.vaoAberto) {
        mudarCasa(P.vaoDoCofre.x, P.vaoDoCofre.y, 'x');
        enc.field.porAresta(P.vaoDoCofre.x, P.vaoDoCofre.y, P.dentroDoCofre.x, P.dentroDoCofre.y, ARESTA.aberta);
      }
      if (t.feito.lutaT5) sobre('cavaletesVazios', true);
      if (t.feito.machado) sobre('machadoTirado', true);
      if (t.feito.cofreSaqueado) sobre('cofreVazio', true);
      // O FRAGMENTO LEVADO (o livro): deixado com o aglomerado vivo, passado um dia, os fanáticos o mandaram embora
      if (t.feito.fragmentoEmRiscoDesde != null && !o6.fragmentos.talhundereth && (vila.dia ?? 1) > t.feito.fragmentoEmRiscoDesde) {
        t.feito.fragmentoLevado = true;
      }
      if (o6.fragmentos.talhundereth || t.feito.fragmentoLevado) {
        sobre('altarSemFragmento', true);
        const luz = luzNaCasa(enc.field, { x: 22, y: 39 });
        if (luz) mudarFogo(enc.field, luz, false);
      }
      for (const m of Object.values(elenco)) {
        if (m.dead) continue;
        if (m.escondido) continue;
        neutro(m);
      }
      // quem sobe a fenda da Encruzilhada chega pelo túnel baixo da entrada
      if (config.chegada === 'encruzilhada') {
        herois().forEach((h, i) => { h.pos = { ...h.pos, ...(enc.casaLivreMaisProxima({ x: P.tunelOeste.x + (i % 2), y: P.tunelOeste.y + Math.floor(i / 2) }) ?? h.pos) }; });
      }
      // quem sobe da cripta chega pela escada de T20
      if (config.chegada === 'cripta') {
        herois().forEach((h, i) => { h.pos = { ...h.pos, ...(enc.casaLivreMaisProxima(P.escadaDaCripta[i % P.escadaDaCripta.length]) ?? h.pos) }; });
      }
      if (!t.feito.chegou) {
        t.feito.chegou = true;
        await painel([
          'Três dias de colina em colina, e o mapa dos goblins leva a uma fenda larga entre duas pedras, descendo. Lá embaixo, a caverna acaba numa porta dupla do tamanho de três homens, com uma montanha e uma gema entalhadas em cada folha.',
          'Uma das folhas está aberta, escorada por um rolo de pano. O ar que sai de dentro é seco e velho.',
        ]);
      } else if (t.feito.fragmentoLevado && !t.feito.avisouLevado) {
        t.feito.avisouLevado = true;
        await painel('No salão de culto, o altar partido está vazio. Alguém levou o fragmento, e levou embora: para o fundo, para Illithinoch.');
        pista('O fragmento de Talhundereth foi levado pelos fanáticos para Illithinoch.');
      }
      prepararExploracao();
    },
  };
}
