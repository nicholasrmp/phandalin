// O CASTELO DENTEFINO (Parte 3 da aventura, áreas 1-14). Mapa em
// `game/castelo.js`.
//
// O que a cena faz (as regras e números são do livro; o texto é nosso):
//   - o terraço (1): os arqueiros goblins dos postos (3) espiam pelas
//     seteiras. O grupo pode chegar de mansinho (a pior Furtividade do grupo
//     contra a Percepção de cada vigia, como o livro manda), anunciar-se como
//     gente do Aranha Negra (Enganação contra Intuição: basta um herói vencer)
//     ou chegar atacando. Vistos, os arqueiros atiram e gritam: os goblins da
//     torre sul (4) e os hobgoblins (6) vêm, pelos dois lados;
//   - o salão (2) e o fio diante da porta do salão escuro (8): Percepção
//     passiva 20 vê, ou procurar com CD 10; quem pisa testa Destreza CD 10,
//     3d6 de concussão (metade se passar); o barulho alerta 3, 7, 8 e 9;
//   - a despensa (5) com o equipamento do Sildar; o banquete (7), cujos
//     goblins fogem se o Yegg cair; o grick no escuro do salão (8); o Lhupo
//     no santuário (9), que não se surpreende se ouvir luta no 8;
//   - o portão traseiro de ferro (10): ferramentas de ladrão CD 15 ou Força
//     CD 25 (o arrombamento barulhento chama os goblins do banquete);
//   - a lona da torre em ruínas (11), achada por fora com Percepção CD 10;
//   - a guarda (12): no começo da luta um hobgoblin corre avisar o rei e
//     volta duas rodadas depois;
//   - o urso-coruja preso (13): carne o acalma; aberto e com o caminho livre,
//     ele foge do castelo. O baú na borda do andar caído pede Percepção CD 15;
//   - o rei (14): Grol, o lobo Rosnado e o doppelganger Vyerith, com o Gundren
//     desacordado. Avisados, Grol faz o anão de refém. Grol morto, Vyerith
//     foge com o mapa pela lona — encurralado, luta até morrer;
//   - XP por área como no livro; 200 a mais por levar o Gundren a Phandalin.
//
// DECISÕES NOSSAS:
//   - o refém: avisado e atacado assim mesmo, Grol dá um turno de aviso e mata
//     o Gundren no segundo — a menos que alguém esteja colado no anão, ou que
//     ele já tenha perdido metade dos PV (aí ele só pensa na própria pele);
//   - os blocos são os do livro, sem reforço: o Grol é o bugbear de 45 PV que
//     a aventura descreve (pág. 40), não um bugbear comum de 27. Medido com o
//     motor, um chefe inventado no lugar dele levava o quarto de 1.900 para
//     2.900 de XP ajustado, pagando os 950 do livro;
//   - as levas: o alarme dos arqueiros traz a torre sul e metade dos
//     hobgoblins; o fio traz o banquete em duas ondas e o santuário; o lobo
//     do rei chega na segunda rodada;
//   - o disfarce engana os goblins, não o grick, a guarda nem o rei, e
//     acaba na primeira luta;
//   - o bando do Targor (opcional no livro) fica para depois.
//
// O estado mora em `app.campanha.castelo` e sobrevive a sair e voltar.

import { narrar } from '../view/narrativa.js';
import { d20 } from '../core/dice.js';
import { skillBonus, passivePerception, SKILL_NAME } from '../rules/abilities.js';
import { distanceFt, Battlefield, ARESTA } from '../core/grid.js';
import { podeVer, visaoNoEscuro, emiteLuz } from '../rules/luz.js';
import { addCondition, hasCondition } from '../rules/conditions.js';
import { makeMonster } from '../rules/monsters.js';
import { makeNpc } from '../rules/npcs.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { prepararLevas } from './levas.js';
import { CASTELO } from './castelo.js';

const MOVIMENTO = 60;
const dentro = (p, r) => p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1;
// As salas cresceram sobre as paredes velhas quando elas viraram arestas: o
// retângulo de `salas` cobre só parte delas, então quem decide "está na sala"
// é a lista de casas.
const CELULAS = Object.fromEntries(Object.entries(CASTELO.celulas ?? {})
  .map(([k, cs]) => [k, new Set(cs.map((c) => `${c.x},${c.y}`))]));
const naSala = (p, sala) => CELULAS[sala]?.has(`${p.x},${p.y}`) ?? dentro(p, S[sala]);
const S = CASTELO.salas;
// As coordenadas desta cena nasceram com o mapa antigo (OX=2, OY=0); o mapa
// ganhou margem para as torres redondas, e `desloc` corrige.
const D = CASTELO.desloc ?? { x: 0, y: 0 };
const J = (x, y) => ({ x: x + D.x, y: y + D.y });

// Grupo -> sala, XP do livro, e onde ficam.
const GRUPOS = {
  postoNorte: { sala: 'postoNorte', xp: 100, nome: 'os arqueiros do norte' },
  postoSul: { sala: 'postoSul', xp: 100, nome: 'os arqueiros do sul' },
  torreSul: { sala: 'torreSul', xp: 150, nome: 'a torre do sudoeste' },
  hobgoblins: { sala: 'alojamentoHob', xp: 200, nome: 'o alojamento dos hobgoblins' },
  hobgoblins2: { sala: 'alojamentoHob', xp: 200, nome: 'os outros hobgoblins do alojamento' },
  banquete: { sala: 'banquete', xp: 200, nome: 'o salão de banquete' },
  cozinha: { sala: 'banquete', xp: 200, nome: 'o Yegg e os cozinheiros' },
  grick: { sala: 'salaoEscuro', xp: 450, nome: 'o salão escuro' },
  santuario: { sala: 'santuario', xp: 150, nome: 'o santuário' },
  guarda: { sala: 'guarda', xp: 200, nome: 'a guarda' },
  urso: { sala: 'torreUrso', xp: 700, nome: 'a torre do urso-coruja' },
  rei: { sala: 'rei', xp: 950, nome: 'os aposentos do rei' },
};

export function criarCastelo(app, config) {
  void config;
  const enc = app.enc;
  const root = app.root;
  const camp = (app.campanha ??= {});
  const feitos = (camp.feitos ??= {});
  const vila = (camp.vila ??= { pistas: [], missoes: {} });
  const salvo = (camp.castelo ??= {
    vencidos: [], alarme: false, disfarce: false, armadilha: null, portaoAberto: false, lonaAchada: false,
    ursoSolto: false, ursoCalmo: false, bauUrso: false, despensa: false, armas: false, braseiro: false,
    altar: false, cama: false, gundren: null, mapa: null, reiAvisado: false, escorada: false,
  });
  const estado = { explorando: false, encerrado: false, lutando: null, terraco: !!salvo.terracoVisto };

  const herois = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead && c.hp > 0);
  const casaPerto = (p) => enc.casaLivreMaisProxima(p) ?? p;
  const painel = (texto, extra = {}) => narrar(root, { formato: 'painel', paginas: [{ texto: [].concat(texto), ...extra }] });
  const asArmas = (texto) => narrar(root, { formato: 'painel', paginas: [{ texto: [].concat(texto) }], escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
  const guardar = (c, id, qtd) => {
    const b = (c.bag ??= []).find((i) => i.id === id);
    if (b) b.qtd += qtd; else c.bag.push({ id, tipo: 'item', qtd });
  };
  const teste = (c, pericia, cd) => {
    const r = d20(enc.rng, skillBonus(c, pericia));
    return { quem: c.name, pericia: SKILL_NAME[pericia], total: r.total, cd, passou: r.total >= cd };
  };
  const melhor = (pericia) => [...herois()].sort((a, b) => skillBonus(b, pericia) - skillBonus(a, pericia))[0];

  // ------------------------------------------------------ os moradores ----
  const grupos = {};
  const m = (id, x, y, g, sufixo = '', olha = { dx: -1, dy: 0 }) => {
    const f = makeMonster(id, J(x, y), { nameSuffix: sufixo });
    f.grupo = g;
    f.facingVec = olha;
    (grupos[g] ??= { id: g, membros: [], ...GRUPOS[g] }).membros.push(f);
    return f;
  };
  // Colados na seteira: a cobertura de três quartos só vale com a fenda
  // entre o arqueiro e o alvo (`coverBetween`).
  m('goblinArqueiro', 5, 7, 'postoNorte', 'do posto norte', { dx: 0, dy: 1 });
  m('goblinArqueiro', 7, 7, 'postoNorte', 'do posto norte B', { dx: 0, dy: 1 });
  m('goblinArqueiro', 5, 13, 'postoSul', 'do posto sul', { dx: 0, dy: -1 });
  m('goblinArqueiro', 7, 13, 'postoSul', 'do posto sul B', { dx: 0, dy: -1 });
  ['A', 'B', 'C'].forEach((s, i) => m('goblin', [5, 6, 6][i], [16, 17, 18][i], 'torreSul', `da torre ${s}`));
  [[4, 2], [5, 3], [7, 2], [7, 3]].forEach(([x, y], i) => m('hobgoblin', x, y, i < 2 ? 'hobgoblins' : 'hobgoblins2', 'ABCD'[i], { dx: 1, dy: 0 }));
  // O banquete fica longe da porta do salão 2: pela porta aberta eles viam
  // o salão inteiro.
  const yegg = m('goblin', 16, 14, 'cozinha', '', { dx: -1, dy: 0 });
  Object.assign(yegg, { name: 'Yegg', maxHp: 12, hp: 12, chefe: true });
  [[13, 14], [14, 14], [15, 14], [14, 16], [16, 16], [15, 17], [16, 17]].forEach(([x, y], i) =>
    m('goblin', x, y, i < 4 ? 'banquete' : 'cozinha', `cozinheiro ${'ABCDEFG'[i]}`));
  const grick = m('grick', 16, 12, 'grick', '', { dx: 0, dy: -1 });
  // Lhupo: o goblin que diz escutar Maglubiyet. Poder divino ele não tem —
  // o livro é claro nisso —, mas o bando acredita, e é com isso que ele manda.
  const lhupo = m('goblin', 16, 3, 'santuario', '', { dx: 0, dy: -1 });
  Object.assign(lhupo, { name: 'Lhupo', maxHp: 12, hp: 12 });
  m('goblin', 15, 3, 'santuario', 'acólito A', { dx: 0, dy: -1 });
  m('goblin', 18, 3, 'santuario', 'acólito B', { dx: 0, dy: -1 });
  const mensageiro = m('hobgoblin', 22, 11, 'guarda', 'da guarda A');
  m('hobgoblin', 23, 10, 'guarda', 'da guarda B');
  const urso = m('corujaUrso', 24, 17, 'urso', '', { dx: -1, dy: 0 });
  const grol = m('reiGrol', 28, 5, 'rei', '', { dx: -1, dy: 1 });
  const rosnado = m('lobo', 29, 6, 'rei', '', { dx: -1, dy: 0 });
  Object.assign(rosnado, { name: 'Rosnado', maxHp: 18, hp: 18 });
  const vyerith = m('doppelganger', 27, 5, 'rei', '', { dx: 1, dy: 0 });
  vyerith.name = 'Vyerith';
  // DISFARÇADO DE DROW, como no livro (a emissária do Aranha Negra). O primeiro
  // ataque dela, ou a queda, revela o doppelganger (`revelarDisfarce`).
  vyerith.disfarce = { look: vyerith.look, de: 'a drow' };
  vyerith.look = 'drow';
  // Gundren: desacordado, estável, a 0 PV, perto da mesa.
  const gundren = salvo.gundren === 'morto' || salvo.gundren === 'livre' ? null : makeNpc('gundren', J(30, 8), {});
  if (gundren) {
    Object.assign(gundren, { side: 'neutro', hp: 0, stable: true, preso: true, attacks: [] });
    addCondition(gundren, 'inconsciente');
  }
  for (const g of Object.values(grupos)) {
    if (salvo.vencidos.includes(g.id)) g.vencido = true;
    g.ativo = false;
  }
  const pendentes = () => Object.values(grupos).filter((g) => !g.vencido && !g.ativo
    && g.membros.some((f) => !f.dead && !f.fugiu));
  const vivosDe = (g) => g.membros.filter((f) => !f.dead && !f.fugiu && f.side === 'foes');
  let levas = null;

  // ---------------------------------------------------- o mapa vivo ----
  // As portas fechadas são arestas (paredes de borda): abrir é trocar a
  // aresta de porta por arco.
  function abrir(nome) {
    for (const [a, b] of CASTELO.arestas[nome] ?? []) enc.field.porAresta(a.x, a.y, b.x, b.y, ARESTA.aberta);
  }
  // As arestas que têm dono: estas só abrem pela interação própria delas
  // (chave, barra, força), e o botão genérico de porta não as pega.
  const ESPECIAIS = new Set(Object.values(CASTELO.arestas ?? {}).flat()
    .flatMap(([a, b]) => [`${a.x},${a.y},${b.x},${b.y}`, `${b.x},${b.y},${a.x},${a.y}`]));

  // QUAL VÃO TEM FOLHA. O mapa separa a porta da ARCADA: o salão escuro e o
  // santuário têm pedra vazada, sem nada para fechar. Sem esta conta, o menu
  // oferecia "fechar a porta" num arco vazio e uma folha de madeira nascia
  // do nada no meio da arcada. O tabuleiro lê a mesma lista para desenhar a
  // folha encostada quando a porta está aberta.
  const CHAVE = (a, b) => `${a.x},${a.y},${b.x},${b.y}`;
  const COM_FOLHA = new Set((CASTELO.folhas ?? [])
    .flatMap(([a, b]) => [CHAVE(a, b), CHAVE(b, a)]));
  enc.field.folha = COM_FOLHA;

  /**
   * As arestas de porta ou arco encostadas em `tile`, para o menu de abrir e
   * fechar. Devolve a aresta (as duas casas) e o que ela é agora.
   */
  function portasDaCasa(tile) {
    const f = enc.field;
    const out = [];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = { x: tile.x + dx, y: tile.y + dy };
      if (!f.inside(n.x, n.y)) continue;
      const cod = f.aresta(tile.x, tile.y, n.x, n.y);
      if (cod !== ARESTA.porta && cod !== ARESTA.aberta) continue;
      if (ESPECIAIS.has(CHAVE(tile, n))) continue;
      if (!COM_FOLHA.has(CHAVE(tile, n))) continue;   // arcada não fecha
      out.push({ a: tile, b: n, cod });
    }
    return out;
  }

  /**
   * As arestas de porta FECHADA encostadas em `tile` — inclusive as que têm
   * dono. Escutar e espiar valem em qualquer porta fechada; o que elas não
   * fazem é abrir.
   */
  function fechadasDaCasa(tile) {
    const f = enc.field;
    const out = [];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = { x: tile.x + dx, y: tile.y + dy };
      if (!f.inside(n.x, n.y)) continue;
      if (f.aresta(tile.x, tile.y, n.x, n.y) !== ARESTA.porta) continue;
      out.push({ a: tile, b: n });
    }
    return out;
  }

  /** O nome da sala de uma casa, ou null se ela é de fora. */
  const salaDe = (p) => Object.keys(CELULAS).find((nome) => CELULAS[nome].has(`${p.x},${p.y}`)) ?? null;

  /**
   * Quem está NESSA sala agora: os moradores vivos que ainda não foram
   * batidos. Eles ganham posição no começo da cena, mesmo antes de entrar no
   * tabuleiro, então escutar à porta conta a verdade e não um palpite.
   */
  function moradoresEm(sala) {
    if (!sala) return [];
    const vivos = [];
    for (const g of Object.values(grupos)) {
      if (g.vencido) continue;
      for (const f of g.membros) {
        if (f.dead || f.hp <= 0 || !f.pos) continue;
        if (naSala(f.pos, sala)) vivos.push(f);
      }
    }
    return vivos;
  }

  /** O que se vê de cada sala pela fresta. */
  const OLHO_DA_SALA = {
    guarda: 'Palha no chão, armas encostadas na parede, cheiro de gente que dorme vestida.',
    alojamentoHob: 'Camas em ordem e armas penduradas em fila: quem mora aqui tem disciplina.',
    postoNorte: 'Uma fresta na pedra dando para o vale, e marcas de pé em volta dela.',
    postoSul: 'Uma fresta na pedra dando para o vale, e marcas de pé em volta dela.',
    banquete: 'Uma mesa comprida coberta de restos, e um braseiro aceso no fundo.',
    cozinha: 'Panelas, ossos e um fogo baixo.',
    despensa: 'Sacos rasgados, barris e um cheiro azedo.',
    santuario: 'Um altar de pedra e panos escuros pendurados; alguma coisa de ouro brilha ali.',
    salaoEscuro: 'Um salão alto sem luz nenhuma, com figuras de asas talhadas na pedra.',
    salaoArmadilha: 'Argamassa caída e entulho. Alguma coisa de cobre reluz rente ao chão.',
    torreUrso: 'Escuro, e um bafo quente de bicho grande. Ossos roídos espalhados.',
    torreSul: 'Entulho e caixotes encostados, o teto meio caído.',
    ruina: 'Céu aberto, mato nascendo entre as pedras.',
    rei: 'Peles numa cama grande, banheiras de azulejo e um braseiro aceso.',
    corredor: 'Um corredor vazio.',
    terraco: 'O terraço e a encosta lá fora.',
  };

  /** A casa clicada encosta na porta `nome` (de um lado ou do outro)? */
  const junto = (tile, nome) => (CASTELO.arestas[nome] ?? []).some(([a, b]) =>
    (tile.x === a.x && tile.y === a.y) || (tile.x === b.x && tile.y === b.y));
  if (salvo.portaoAberto) abrir('portaoTraseiro');
  if (salvo.lonaAchada) abrir('lona');
  if (salvo.ursoSolto) abrir('portaUrso');
  if (salvo.escorada) abrir('portaEscorada');

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
    estado.lutando = null;
    root.classList.add('explorando');
    if (!herois().includes(app.selected)) app.select(herois()[0]);
    app.refresh();
  }

  function trazer(g) {
    g.ativo = true;
    for (const f of g.membros) {
      if (f.dead || f.fugiu || f.correndo) continue;
      f.side = 'foes';
      if (enc.combatants.includes(f)) continue;
      if (enc.occupied(f.pos.x, f.pos.y)) f.pos = { ...f.pos, ...casaPerto(f.pos) };
      enc.addCombatant(f);
    }
  }

  /** Uma leva: um grupo que chega correndo, numa rodada, perto de `onde`. */
  function leva(g, rodada, onde, aviso) {
    if (!g || g.vencido || g.ativo) return null;
    g.ativo = true;
    const units = vivosDe({ membros: g.membros.map((f) => { f.side = 'foes'; return f; }) })
      .filter((f) => !enc.combatants.includes(f));
    for (const f of units) f.pos = { ...f.pos, ...(onde ?? f.pos) };
    return { rodada, units, aviso };
  }

  /**
   * Começa uma luta. `ondas` chegam depois; se não há ninguém para lutar já
   * (os arqueiros mortos e o barulho vindo de longe), a primeira onda já
   * entra na rodada 1. `fixa`: a Furtividade já rolada dos emboscadores.
   */
  function combate(gs, surpresa = null, ondas = [], fixa = null) {
    salvo.disfarce = false;
    for (const g of gs) trazer(g);
    const lev = ondas.filter((l) => l?.units?.length).sort((a, b) => a.rodada - b.rodada);
    if (!enc.combatants.some((c) => c.side === 'foes' && !c.dead && c.hp > 0) && lev.length) {
      for (const f of lev.shift().units) {
        f.pos = enc.casaLivreMaisProxima(f.pos) ?? f.pos;
        enc.addCombatant(f);
      }
    }
    estado.explorando = false;
    estado.lutando = gs;
    root.classList.remove('explorando');
    levas = prepararLevas(enc, lev);
    enc.emboscada = surpresa === 'nossa'
      ? { emboscadores: 'party', furtividade: herois().map(() => furtividadeDoGrupo()) }
      : surpresa === 'deles'
        ? { emboscadores: 'foes', furtividade: gs.flatMap((g) => vivosDe(g)).map((f) => fixa ?? d20(enc.rng, skillBonus(f, 'furtividade')).total) }
        : null;
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
  }

  /** Teste de grupo (SRD): o valor da metade de cima dos rolamentos. */
  function furtividadeDoGrupo() {
    const r = herois().map((h) => d20(enc.rng, skillBonus(h, 'furtividade')).total).sort((a, b) => b - a);
    return r[Math.max(0, Math.ceil(r.length / 2) - 1)] ?? 10;
  }

  /**
   * O alarme dos arqueiros: a torre sul e metade dos hobgoblins vêm, pelos
   * dois lados (os outros dois ficam guardando o alojamento). O castelo
   * inteiro fica sabendo — o rei também.
   */
  function alarmeDosArqueiros() {
    salvo.alarme = true;
    salvo.reiAvisado = true;
    return [
      leva(grupos.torreSul, 2, J(9, 12), 'Pela porta sul do salão saem goblins aos berros!'),
      leva(grupos.hobgoblins, 4, J(9, 8), 'E pela porta norte, em fila e em silêncio, vêm dois hobgoblins de escudo.'),
    ];
  }

  /**
   * O barulho grande (o fio, o portão arrombado): o banquete vem em duas
   * ondas e o santuário depois. Se os arqueiros ainda estão de pé e lutando,
   * os de dentro demoram mais um pouco.
   */
  function ondasDoBarulho(onde) {
    salvo.alarme = true;
    salvo.reiAvisado = true;
    const postos = [grupos.postoNorte, grupos.postoSul].some((g) => !g.vencido);
    const [a, b, c] = postos ? [3, 5, 7] : [2, 4, 5];
    return [
      leva(grupos.banquete, a, onde, 'Do salão de banquete vêm goblins, de colher e faca na mão.'),
      leva(grupos.cozinha, b, onde, 'Atrás deles, aos gritos, o Yegg e o resto da cozinha.'),
      leva(grupos.santuario, c, J(15, 5), 'Das cortinas do norte saem goblins de manto imundo.'),
    ];
  }

  // ------------------------------------------------------ o terraço ----
  async function chegarAoTerraco() {
    estado.terraco = true;
    salvo.terracoVisto = true;
    if (salvo.alarme || salvo.disfarce || (grupos.postoNorte.vencido && grupos.postoSul.vencido)) return;
    const r = await narrar(root, { formato: 'painel', paginas: [{ titulo: 'O Castelo Dentefino', texto: [
      'Sete torres, ou o que resta delas, encostadas umas nas outras como bêbados no fim da festa. A mata já subiu pelas que caíram. Na face oeste, um patamar de pedra com escadas dos dois lados leva aos portões: duas folhas podres, com ferragens verdes de azinhavre, uma delas caída.',
      'Nas duas torres baixas que ladeiam o patamar há rasgos na pedra, da largura de uma mão. Lugar perfeito para um arco.',
    ] }],
    escolhas: [
      { rotulo: 'Chegar de mansinho', valor: 'furtivo', primaria: true },
      { rotulo: 'Anunciar-se como enviados do Aranha Negra', valor: 'disfarce' },
      { rotulo: 'Atacar', valor: 'ataque' },
    ] });
    const arqueiros = [...vivosDe(grupos.postoNorte), ...vivosDe(grupos.postoSul)];
    if (r === 'disfarce') {
      // Enganação de cada herói contra a Intuição dos vigias: um que vença basta.
      const intuicao = Math.max(...arqueiros.map((f) => d20(enc.rng, skillBonus(f, 'intuicao')).total), 0);
      const mantos = herois().every((h) => h.mantoVermelho || (h.bag ?? []).some((i) => i.id === 'mantoVermelho'));
      const quem = melhor('enganacao');
      const rol = herois().map((h) => d20(enc.rng, skillBonus(h, 'enganacao'), { advantage: mantos }).total);
      const venceu = rol.some((v) => v > intuicao);
      if (venceu) {
        salvo.disfarce = true;
        await painel([
          `${quem.name} fala alto, sem pressa, como quem foi convidado: vêm a mando do mago dos Marcarrubra, e o Aranha Negra quer saber do anão.${mantos ? ' Os mantos vermelhos ajudam.' : ''}`,
          'Atrás das seteiras, risadinhas, uma discussão em goblin, e por fim um grito: — Entra! O rei está no fundo. Não pisa no meio do salão, que tem fio!',
        ], { teste: { quem: quem.name, pericia: 'Enganação', total: Math.max(...rol), cd: intuicao + 1, passou: true } });
        salvo.armadilha = 'vista';
        return;
      }
      await asArmas([`${quem.name} começa o discurso — e uma flecha passa zunindo pela orelha. Lá dentro, alguém grita em goblin que é mentira.`]);
    } else if (r === 'furtivo') {
      // O livro: a pior Furtividade do grupo é a CD da Sabedoria dos vigias.
      const pior = Math.min(...herois().map((h) => d20(enc.rng, skillBonus(h, 'furtividade')).total));
      const viram = arqueiros.some((f) => d20(enc.rng, skillBonus(f, 'percepcao')).total >= pior);
      if (!viram) {
        salvo.furtivo = true;
        await painel('Colados nas pedras, um de cada vez, vocês cruzam o terraço. Pelas seteiras, só se ouve um goblin reclamando do frio.');
        return;
      }
      await asArmas('Uma pedra rola sob uma bota. Atrás de uma seteira, um olho amarelo se arregala — e o grito vem em seguida.');
    } else {
      await asArmas('Vocês sobem as escadas do terraço sem esconder nada. As fendas das torres respondem com flechas.');
    }
    combate([grupos.postoNorte, grupos.postoSul], null, alarmeDosArqueiros());
  }

  // --------------------------------------------------- o fio do salão ----
  const naArmadilha = (p) => !salvo.armadilha && CASTELO.armadilha.some((q) => q.x === p.x && q.y === p.y);
  enc.paraNaCasa = (c, p) => c.side === 'party' && naArmadilha(p);

  /** O teto cai sobre as cinco casas: toda criatura nelas testa Destreza. */
  function desabamento() {
    salvo.armadilha = 'disparada';
    const atingidos = [];
    for (const q of CASTELO.armadilha) {
      const v = enc.combatants.find((x) => !x.dead && x.pos.x === q.x && x.pos.y === q.y);
      if (!v) continue;
      const r = enc.resistencia(v, 'dex', 10);
      let dano = 0;
      for (let i = 0; i < 3; i++) dano += enc.rng.die(6);
      if (r.success) dano = Math.floor(dano / 2);
      enc.applyDamage(v, dano, 'concussão');
      atingidos.push(`${v.name} ${dano}${r.success ? ' (metade)' : ''}`);
    }
    return atingidos;
  }

  /** O XP do fio do salão vale uma vez, ao passar por ele (ou ao pisar e sobreviver), não ao descobrir. */
  async function xpDoFio() {
    if (salvo.fioXp) return;
    salvo.fioXp = true;
    await darXpDoLivro(100, 'O fio do salão');
  }

  async function armadilha(c) {
    if (!naArmadilha(c.pos)) return false;
    const atingidos = desabamento();
    await painel(`O pé de ${c.name} engancha um fio de cobre perdido no entulho. Um estalo lá em cima, e meia parede de vigas e pedra vem abaixo (${atingidos.join(', ')}). O castelo inteiro ouve.`);
    await xpDoFio();
    // O barulho põe de pé os arqueiros, o banquete e o santuário.
    const ondas = ondasDoBarulho(J(11, 12));
    const contra = [grupos.postoNorte, grupos.postoSul].filter((g) => g && !g.vencido);
    if (contra.length || ondas.some(Boolean)) combate(contra, null, ondas);
    return true;
  }

  /** Na luta, o fio dispara para quem pisar — herói ou goblin. */
  async function armadilhaEmCombate(c) {
    const atingidos = desabamento();
    enc.say('acao', `${c.name} pisa no fio: o teto desaba diante da porta leste (${atingidos.join(', ')}).`);
    if (!salvo.alarme) for (const l of ondasDoBarulho(J(11, 12))) if (l) { l.rodada += enc.round - 1; levas?.adicionar(l); }
    app.refresh();
  }

  // ------------------------------------------------------- andar ----
  async function depoisDeMover(c) {
    if (!estado.explorando) return;
    c.movementLeftFt = MOVIMENTO;
    if (await armadilha(c)) return;
    // Fio sabido e atravessado por cima, sem tocar: passou, vale o XP.
    if (salvo.armadilha === 'vista' && herois().some((h) => CASTELO.armadilha.some((q) => q.x === h.pos.x && q.y === h.pos.y))) await xpDoFio();
    if (!estado.terraco && herois().some((h) => naSala(h.pos, 'terraco'))) { await chegarAoTerraco(); if (!estado.explorando) return; }
    // Passiva 20 vê o fio sem procurar.
    if (!salvo.armadilha && herois().some((h) => passivePerception(h) >= 20 && CASTELO.armadilha.some((q) => distanceFt(h.pos, q) <= 10))) {
      salvo.armadilha = 'vista';
      await painel('Alguém para de repente: no entulho diante da porta leste, um fio de cobre fino, esticado na altura do tornozelo, sobe até o teto.');
    }
    // Quem vê quem. Só os vigias (os postos, depois do terraço, e a guarda)
    // reagem ao que veem, até 60 pés; os outros só a quem entra na sala ou ao
    // barulho — senão a porta aberta de uma sala puxava luta do outro lado do
    // castelo. O disfarce engana os goblins; o grick, a guarda e o rei, não.
    const vigias = ['postoNorte', 'postoSul', 'guarda'];
    const enganados = ['postoNorte', 'postoSul', 'torreSul', 'banquete', 'cozinha', 'santuario', 'hobgoblins', 'hobgoblins2'];
    for (const g of pendentes()) {
      if (g.id === 'urso' || g.id === 'rei') continue;
      if ((g.id === 'postoNorte' || g.id === 'postoSul') && !estado.terraco) continue;
      if (salvo.disfarce && enganados.includes(g.id)) continue;
      const dentroDaSala = herois().find((h) => naSala(h.pos, g.sala));
      const ve = (f, h) => distanceFt(f.pos, h.pos) <= 60 && podeVer(enc, f, h);
      // Depois de cruzar o terraço de mansinho, os arqueiros atrás das
      // seteiras só reagem a quem entrar.
      const alvo = !vigias.includes(g.id) || ((g.id === 'postoNorte' || g.id === 'postoSul') && salvo.furtivo) ? null
        : g.membros.find((f) => !f.dead && !f.fugiu && herois().some((h) => ve(f, h)));
      if (!dentroDaSala && !alvo) continue;
      if (g.id === 'grick') { await oGrick(); return; }
      const quem = dentroDaSala ?? herois().find((h) => ve(alvo, h));
      // O santuário: se ouviram a luta com o grick, esperam escondidos atrás
      // do altar; se não, estão rezando de costas.
      // O santuário: se ouviram a luta com o grick, esperam escondidos atrás
      // do altar; se não, estão de joelhos rezando a Maglubiyet, de costas.
      const surpresa = g.id === 'santuario' ? (salvo.grickOuviu ? 'deles' : 'nossa') : null;
      await asArmas(g.id === 'santuario' && !salvo.grickOuviu
        ? ['Três goblins de joelhos diante do altar, de costas para a porta, repetindo um nome em coro: Maglubiyet, Maglubiyet. O da frente fala por cima dos outros, como quem traduz o que só ele ouve.',
          `${quem.name} entra antes que eles percebam.`]
        : visaoNoEscuro(quem) && !emiteLuz(quem)
          ? `No cinza da visão no escuro, ${quem.name} vê movimento em ${g.nome}.`
          : `${quem.name} dá de cara com ${g.nome} — e eles com vocês.`);
      // Quem divide a sala vem junto (o alojamento, o banquete).
      combate(pendentes().filter((x) => x.sala === g.sala), surpresa);
      return;
    }
    // Os aposentos do rei.
    if (grupos.rei && !grupos.rei.vencido && !grupos.rei.ativo && herois().some((h) => naSala(h.pos, 'rei'))) await oRei();
  }

  // ------------------------------------------------------- o grick ----
  async function oGrick() {
    // A Furtividade do grick contra a Percepção passiva de cada herói: quem
    // não nota fica surpreso, um a um (o motor usa o mesmo número).
    const f = d20(enc.rng, skillBonus(grick, 'furtividade')).total;
    const desatentos = herois().filter((h) => passivePerception(h) < f);
    salvo.grickOuviu = true;
    await asArmas([
      'Aqui o teto some no escuro, lá no alto, e as paredes chegam tão perto uma da outra que dois não passam lado a lado. Das pedras de cima, estátuas de criaturas aladas se debruçam sobre quem entra.',
      desatentos.length === herois().length
        ? 'Uma delas se mexe. E cai.'
        : 'Uma das figuras lá no alto não tem asas — tem tentáculos. E está descendo.',
    ]);
    combate([grupos.grick], 'deles', [], f);
  }

  // ----------------------------------------------------- a guarda ----
  /**
   * Na luta da guarda, no primeiro turno dele, um hobgoblin corre avisar o
   * rei e volta duas rodadas depois. Quem o derrubar antes evita o aviso.
   */
  function mensageiroCorre() {
    mensageiro.correndo = true;
    mensageiro.jaCorreu = true;
    salvo.reiAvisado = true;
    enc.combatants.splice(enc.combatants.indexOf(mensageiro), 1);
    enc.say('acao', `${mensageiro.name} vira as costas e corre pela porta do norte, gritando pelo rei.`);
    mensageiro.pos = { ...mensageiro.pos, ...J(25, 9) };
    levas?.adicionar({ rodada: enc.round + 2, units: [mensageiro], aviso: `${mensageiro.name} volta correndo, de machado na mão.` });
    enc.checkEnd();
    app.refresh();
    return true;
  }

  // ------------------------------------------------------- o rei ----
  async function oRei() {
    const g = grupos.rei;
    const refem = salvo.reiAvisado && gundren && !gundren.dead;
    if (refem) {
      // Vyerith espera atrás da porta; Grol, de machado no pescoço do anão.
      vyerith.pos = { ...vyerith.pos, ...casaPerto(J(26, 5)) };
      grol.pos = { ...grol.pos, ...casaPerto(J(29, 8)) };
      const r = await narrar(root, { formato: 'painel', paginas: [{ texto: [
        'Brasas num caldeirão de ferro, um colchão do tamanho de uma carroça, cabeças secas de bicho pregadas na pedra. O cheiro é de couro mal curtido. Junto da mesa, o rei Grol — um bugbear de pelo grisalho e costas tortas — apoia a lâmina do machado na nuca de um anão caído, de cara inchada.',
        '— Mais um passo — diz o rei Grol, sem pressa nenhuma — e eu termino o serviço. Vocês saem do meu castelo, e o anão continua respirando. Por enquanto.',
        'Grol vai cumprir a ameaça no segundo turno dele, a menos que alguém esteja colado no anão — ou que ele já esteja ferido demais para pensar em outra coisa.',
      ] }],
      escolhas: [
        { rotulo: 'Recuar', valor: 'recua' },
        { rotulo: 'Atacar assim mesmo', valor: 'ataca', primaria: true },
      ] });
      if (r === 'recua') {
        for (const h of herois()) if (naSala(h.pos, 'rei')) h.pos = { ...h.pos, ...casaPerto(J(21, 4)) };
        await painel('Vocês recuam devagar, de olho no machado. Grol ri, um riso que vira tosse.');
        app.refresh();
        return;
      }
      estado.refem = true;
      estado.refemTurnos = 0;
    } else {
      await asArmas([
        'Antes mesmo da porta já se ouve a negociação. Um dos dois perde a paciência a cada frase; o outro não levanta a voz uma vez sequer, e é esse que assusta.',
        'Lá dentro, couro de bicho forrando o chão e cabeças secas na parede. O rei Grol é um bugbear grisalho, de costas tortas; o lobo dele se levanta num canto. Do outro lado da mesa, uma elfa de pele escura e cabelo branco olha para vocês como quem já esperava visita. Encostado na parede, um anão desacordado.',
      ]);
    }
    // O lobo estava no canto: chega na segunda rodada.
    rosnado.correndo = true;
    combate([g], null, [{ rodada: 2, units: rosnado.dead ? [] : [Object.assign(rosnado, { side: 'foes', pos: { ...rosnado.pos, ...J(29, 6) } })], aviso: 'Rosnado pula de trás da cama, de dentes à mostra.' }]);
  }

  // --------------------------------------------------- turnos da cena ----
  enc.antesDoTurno = (mo) => {
    if (mo.correndo && enc.combatants.includes(mo)) mo.correndo = false;
    // O mensageiro da guarda corre avisar o rei no primeiro turno dele.
    if (mo === mensageiro && !mensageiro.jaCorreu && estado.lutando?.some((g) => g.id === 'guarda')) return mensageiroCorre();
    // O refém: Grol avisa uma vez; no turno seguinte cumpre, se ninguém
    // estiver colado no anão. Ferido pela metade, esquece o anão.
    if (mo === grol && estado.refem && gundren && !gundren.dead) {
      if (grol.hp <= grol.maxHp / 2) {
        estado.refem = false;
        enc.say('acao', 'Sangrando, Grol tira o machado do pescoço do anão: agora a briga é pela própria pele.');
      } else if (!herois().some((h) => distanceFt(h.pos, gundren.pos) <= 5)) {
        if (!estado.refemTurnos) {
          estado.refemTurnos = 1;
          enc.say('acao', '— Última chance — diz Grol, e encosta o fio do machado na nuca do anão. — Na próxima, eu não aviso.');
          return true;
        }
        estado.refem = false;
        gundren.dead = true;
        salvo.gundren = 'morto';
        enc.say('acao', 'Grol baixa o machado no anão caído. Gundren Buscapedra não se mexe mais.');
        return true;
      } else if (!estado.refemCercado) {
        estado.refemCercado = true;
        enc.say('acao', 'Grol ergue o machado para o anão — mas há gente demais em volta dele. Ele se vira para a luta.');
      }
    }
    // Yegg caiu: os cozinheiros fogem.
    if ((mo.grupo === 'banquete' || mo.grupo === 'cozinha') && yegg.dead && !mo.fugiu && mo !== yegg) return fugir(mo, 'larga a colher e foge pelo corredor');
    // Grol caiu: Vyerith tenta acabar com o anão; não dá, corre para a lona
    // com o mapa.
    if (mo === vyerith && (grol.dead || grol.hp <= 0) && !vyerith.dead) {
      if (!estado.vyerithAvisou) {
        estado.vyerithAvisou = true;
        enc.say('acao', 'Com o rei no chão, a elfa à mesa derrete e vira outra coisa — cinzenta, sem rosto.');
      }
      if (gundren && !gundren.dead && !estado.vyerithTentou) {
        estado.vyerithTentou = true;
        const alcance = enc.reachableFor(vyerith);
        let ate = null;
        for (const n of alcance.values()) {
          if (enc.occupied(n.x, n.y, vyerith) || distanceFt(n, gundren.pos) > 5) continue;
          if (!ate || n.cost < ate.cost) ate = n;
        }
        if (ate) {
          if (ate.cost > 0) enc.moveAlong(vyerith, Battlefield.pathFrom(alcance, ate));
          gundren.dead = true;
          salvo.gundren = 'morto';
          enc.say('acao', 'A coisa sem rosto se ajoelha junto do anão caído, e a faca entra uma vez só. Quem soubesse onde fica a mina não pode mais contar.');
          app.refresh();
          return true;
        }
      }
      if (distanceFt(vyerith.pos, CASTELO.lona) <= 5) {
        vyerith.fugiu = true;
        salvo.mapa = 'levado';
        if (!salvo.lonaAchada) { salvo.lonaAchada = true; abrir('lona'); }
        enc.combatants.splice(enc.combatants.indexOf(vyerith), 1);
        enc.say('acao', 'Vyerith passa pela lona da torre em ruínas e some na mata — com o mapa de Gundren dentro da roupa.');
        enc.checkEnd();
        app.refresh();
        return true;
      }
      const alcance = enc.reachableFor(vyerith);
      const mapaCusto = enc.field.reachable(CASTELO.lona, 2000);
      let best = null;
      for (const n of alcance.values()) {
        if (enc.occupied(n.x, n.y, vyerith)) continue;
        const d = mapaCusto.get(`${n.x},${n.y}`)?.cost ?? 9999;
        if (!best || d < best.d) best = { n, d };
      }
      // Encurralado (nenhum passo aproxima da lona): luta até morrer.
      if (!best || best.n.cost === 0) return false;
      enc.moveAlong(vyerith, Battlefield.pathFrom(alcance, best.n));
      return true;
    }
    return false;
  };

  function fugir(mo, como) {
    mo.fugiu = true;
    enc.combatants.splice(enc.combatants.indexOf(mo), 1);
    enc.say('acao', `${mo.name} ${como}.`);
    enc.checkEnd();
    app.refresh();
    return true;
  }

  function evento(ev) {
    if (ev.type === 'died' && ev.target === grol) feitos.grolMorto = true;
    if (ev.type === 'died' && ev.target === gundren) salvo.gundren = 'morto';
    // Na luta, o fio dispara para qualquer um (fora dela, quem cuida é o
    // `depoisDeMover`, com o painel).
    if (ev.type === 'moved' && !estado.explorando && naArmadilha(ev.actor.pos)) void armadilhaEmCombate(ev.actor);
  }

  // ------------------------------------------------------ fim da luta ----
  async function darXpDoLivro(xp, motivo) {
    const grupo = enc.combatants.filter((c) => c.side === 'party' && !c.dead);
    if (!grupo.length) return;
    const cada = Math.floor(xp / grupo.length);
    const sobem = darXp(grupo, cada);
    enc.say('cura', `${motivo}: ${cada} XP para cada um.`);
    if (sobem.length) for (const t of await telaDeSubirNivel(root, sobem)) enc.say('cura', t);
  }

  async function fimDoCombate(outcome) {
    levas?.limpar();
    levas = null;
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      await narrar(root, { formato: 'tela', paginas: [{ titulo: 'O Castelo Dentefino', texto: [
        'O rei Grol manda pendurar o que sobrou de vocês nas seteiras, para os próximos verem.'] }] });
      app.encerrarPartida();
      return;
    }
    const xp = [];
    for (const g of Object.values(grupos)) {
      if (g.vencido || !g.ativo) continue;
      if (g.membros.every((f) => f.dead || f.fugiu || f.side !== 'foes' || f.hp <= 0)) {
        g.vencido = true;
        if (!salvo.vencidos.includes(g.id)) salvo.vencidos.push(g.id);
        xp.push([g.xp, g.nome]);
      } else {
        g.ativo = false;
      }
    }
    const texto = [];
    if (grupos.rei.vencido) {
      texto.push(salvo.mapa === 'levado'
        ? 'O rei Grol está morto. A coisa sem rosto fugiu pela lona da torre em ruínas — e levou alguma coisa consigo.'
        : 'O rei Grol está morto, e o quarto dele é de vocês.');
      if (gundren && !gundren.dead) texto.push('No chão, perto da mesa, Gundren Buscapedra respira, mas não acorda.');
    }
    if (texto.length) await painel(texto);
    for (const [v, nome] of xp) await darXpDoLivro(v, nome[0].toUpperCase() + nome.slice(1));
    prepararExploracao();
  }

  // ------------------------------------------------------ botão direito ----
  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    const longe = (pes) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
    const em = (sala) => naSala(tile, sala);

    // ABRIR E FECHAR. Toda porta do castelo abre e fecha de graça, como no
    // livro — e fechar vale a pena: a porta fechada corta a visão, e é assim
    // que o grupo some de um corredor ou tranca um bando numa sala. As
    // portas com dono (o portão de ferro, a do urso, a escorada) não entram
    // aqui: elas têm o teste delas.
    for (const { a: ca, b: cb, cod } of portasDaCasa(tile)) {
      const fechada = cod === ARESTA.porta;
      ops.push({
        rotulo: fechada ? 'Abrir a porta' : 'Fechar a porta',
        icone: fechada ? 'acao-usarObjeto' : 'acao-empurrar',
        detalhe: fechada ? 'de graça' : 'corta a visão',
        motivo: longe(5) ?? (enc.combatants.some((o) => !o.dead && o.pos
          && ((o.pos.x === ca.x && o.pos.y === ca.y) || (o.pos.x === cb.x && o.pos.y === cb.y))
          && o !== c && !fechada) ? 'tem alguém na passagem' : null),
        fazer: async () => {
          enc.field.porAresta(ca.x, ca.y, cb.x, cb.y, fechada ? ARESTA.aberta : ARESTA.porta);
          enc.say('acao', fechada
            ? `${c.name} empurra a porta, que cede com um rangido.`
            : `${c.name} fecha a porta e encosta o ombro nela até o trinco pegar.`);
          app.refresh();
        },
      });
    }
    // ESCUTAR, ESPIAR E PROCURAR ARMADILHA — na porta FECHADA. Com a porta
    // aberta não há o que escutar nem por onde espiar: olha-se.
    //
    // Estes três são o que um grupo faz antes de abrir uma porta numa
    // masmorra, e cada um devolve coisa de verdade: o escutar conta quem
    // está do outro lado DE FATO (os moradores já têm posição desde o
    // começo, mesmo antes de entrarem no tabuleiro), e o espiar diz o que a
    // sala tem. A porta com dono (portão, urso, escorada) também entra: é
    // justamente nela que se quer ouvir antes.
    for (const { b: outro } of fechadasDaCasa(tile)) {
      const sala = salaDe(outro);
      const vizinhos = () => moradoresEm(sala);
      ops.push({
        rotulo: 'Escutar à porta', icone: 'acao-procurar', detalhe: 'Percepção, CD 10',
        motivo: longe(5),
        fazer: async () => {
          const t = teste(c, 'percepcao', 10);
          const quem = vizinhos();
          if (!t.passou) {
            await painel('Madeira grossa e o próprio sangue batendo no ouvido. Não dá para dizer o que há do outro lado.', { teste: t });
            return;
          }
          await painel(quem.length === 0
            ? 'Silêncio. Nada se mexe do outro lado — nem passo, nem respiração.'
            : quem.length === 1
              ? 'Alguém se mexe lá dentro, sozinho: um arrastar de pé e depois quieto.'
              : quem.length <= 3
                ? `Vozes baixas, duas ou três, na língua dos goblins. Discutem alguma coisa sem pressa.`
                : 'Muita gente. Risada, um banco arrastado, metal batendo em metal. Não são poucos.', { teste: t });
        },
      });
      ops.push({
        rotulo: 'Espiar pela fresta', icone: 'acao-procurar', detalhe: 'Percepção, CD 12',
        motivo: longe(5),
        fazer: async () => {
          const t = teste(c, 'percepcao', 12);
          if (!t.passou) {
            await painel('A fresta é um fio de luz, e o olho não acostuma a tempo. Só vultos.', { teste: t });
            return;
          }
          const quem = vizinhos();
          await painel([
            OLHO_DA_SALA[sala] ?? 'Do outro lado, pedra e sombra.',
            quem.length ? `E gente: ${quem.length === 1 ? 'um só' : `uns ${quem.length}`}.` : 'Ninguém à vista.',
          ].join(' '), { teste: t });
        },
      });
      ops.push({
        rotulo: 'Procurar armadilhas na porta', icone: 'acao-procurar', detalhe: 'Investigação, CD 12',
        motivo: longe(5),
        fazer: async () => {
          const t = teste(c, 'investigacao', 12);
          // O castelo tem UMA armadilha, e ela não é de porta: é o fio no
          // entulho do salão. Procurar na porta errada não acha nada, e
          // dizer isso é melhor que inventar perigo.
          const perto = !salvo.armadilha && em('salaoArmadilha');
          if (t.passou && perto) {
            salvo.armadilha = 'vista';
            await painel('Na porta, nada — mas o olho treinado desce para o chão: um fio de cobre no entulho, na altura do tornozelo, amarrado a pinos no teto.', { teste: t });
            return;
          }
          await painel(t.passou
            ? 'Dobradiça, tranca, batente, soleira. A porta é só uma porta.'
            : 'Poeira e madeira velha. Difícil dizer se há alguma coisa aqui.', { teste: t });
        },
      });
    }
    // O fio do salão.
    if (!salvo.armadilha && em('salaoArmadilha')) {
      ops.push({ rotulo: 'Procurar armadilhas', icone: 'acao-procurar', detalhe: 'Percepção, CD 10', motivo: longe(15),
        fazer: async () => {
          const t = teste(c, 'percepcao', 10);
          if (t.passou) salvo.armadilha = 'vista';
          await painel(t.passou ? 'No entulho diante da porta leste, um fio de cobre na altura do tornozelo, amarrado a pinos no teto. Dá para passar por cima, com cuidado.' : 'Entulho, poeira, argamassa caída. Nada de mais.', { teste: t });
        } });
    }
    // A despensa: o equipamento do Sildar.
    if (sup === 'caixotes' && em('despensa') && !salvo.despensa) {
      ops.push({ rotulo: 'Revirar a despensa', icone: 'acao-procurar', motivo: longe(5),
        fazer: async () => {
          salvo.despensa = true;
          feitos.espadaDoSildar = true;
          guardar(c, 'espadaDeSildar', 1);
          guardar(c, 'conhaqueAnao', 1);
          await painel([
            'Sacos rasgados e um cheiro azedo de comida que passou do ponto. No canto mais fundo, jogado como quem se livra de peso, está o que tomaram de um soldado — e quem tomou não soube o que tinha nas mãos: o aço ainda está bom.',
            `${c.name} reconhece o brasão de Neverwinter no punho da espada. É do Sildar, e ele vai querer de volta. Junto do equipamento, um barrilzinho que não combina com despensa de goblin: conhaque anão, do bom.`,
          ]);
        } });
    }
    // Os hobgoblins: as armas na parede e o bordão.
    if (sup === 'armeiro' && em('alojamentoHob') && !salvo.armas && grupos.hobgoblins.vencido && grupos.hobgoblins2.vencido) {
      ops.push({ rotulo: 'Olhar as armas na parede', icone: 'acao-procurar', motivo: longe(5),
        fazer: async () => {
          salvo.armas = true;
          guardar(c, 'bordaoDePenas', 1);
          await painel(`Os hobgoblins guardam as armas como gente de tropa: tudo pendurado, tudo em ordem, nada no chão. No meio daquele ferro todo, uma peça que ninguém ali sabe empunhar — madeira leve, penas talhadas no cabo, mais oferenda que arma. ${c.name} fica com ela.`);
        } });
    }
    // O braseiro do salão escuro: a estatueta.
    if (sup === 'braseiroFrio' && em('salaoEscuro') && !salvo.braseiro) {
      ops.push({ rotulo: 'Remexer o braseiro', icone: 'acao-procurar', motivo: longe(5),
        fazer: async () => {
          salvo.braseiro = true;
          guardar(c, 'estatuetaDoElfo', 1);
          await painel(`As cinzas estão frias há dias, e alguém andou mexendo nelas. No fundo, embrulhada com cuidado que não é de goblin, uma figura de ouro: um elfo de olhos fechados, do tamanho de um palmo. Quem a escondeu aqui não queria dividir. ${c.name} guarda.`);
        } });
    }
    if (em('salaoEscuro') && sup === 'laje' && !salvo.religiao) {
      ops.push({ rotulo: 'Examinar os entalhes', icone: 'acao-procurar', detalhe: 'Religião, CD 10', motivo: longe(10),
        fazer: async () => {
          const t = teste(c, 'religiao', 10);
          // Só marca quando alguém acerta: o livro não limita a uma tentativa.
          if (t.passou) salvo.religiao = true;
          await painel(t.passou ? 'As figuras seguram livro, estrela, sol e moeda — a gente deste castelo rezava a um panteão que não é goblin nenhum. Quem ergueu estas paredes morreu há muito, e os que moram aqui agora não fazem ideia de quem era.' : 'Figuras de asas, gastas pelo tempo. Quem são, não dá para dizer.', { teste: t });
        } });
    }
    // O altar do santuário.
    if (sup === 'altar' && em('santuario') && !salvo.altar && grupos.santuario.vencido) {
      ops.push({ rotulo: 'Pegar os objetos do altar', icone: 'acao-usarObjeto', motivo: longe(5),
        fazer: async () => {
          salvo.altar = true;
          guardar(c, 'caliceDeOuro', 1); guardar(c, 'facaDeRitual', 1); guardar(c, 'incensario', 1);
          await painel(`A pedra do altar é antiga e boa, e ninguém aqui a entalhou: por baixo do pano imundo repetem-se as mesmas figuras do salão. Em cima, o ouro que os goblins não fundiram nem venderam — eles acham que serve para alguma coisa. ${c.name} guarda.`);
        } });
    }
    // O portão traseiro.
    if (!salvo.portaoAberto && junto(tile, 'portaoTraseiro')) {
      ops.push({ rotulo: 'Forçar a fechadura', icone: 'acao-usarObjeto', detalhe: 'ferramentas de ladrão · Destreza, CD 15',
        motivo: longe(5) ?? ((c.bag ?? []).some((i) => i.id === 'ferramentasDeLadrao') ? null : `${c.name} não tem ferramentas de ladrão`),
        fazer: async () => {
          const t = teste(c, 'prestidigitacao', 15);
          if (t.passou) { salvo.portaoAberto = true; abrir('portaoTraseiro'); }
          await painel(t.passou ? 'A fechadura velha cede com um estalo baixo. A porta de ferro abre para dentro.' : 'A fechadura enferrujada não colabora.', { teste: t });
          app.refresh();
        } });
      ops.push({ rotulo: 'Arrombar o portão', icone: 'acao-empurrar', detalhe: 'Força, CD 25 · faz barulho', motivo: longe(5),
        fazer: async () => {
          const t = teste(c, 'atletismo', 25);
          if (t.passou) { salvo.portaoAberto = true; abrir('portaoTraseiro'); }
          await painel(t.passou ? 'O portão de ferro cede de uma vez, com um barulho que o castelo inteiro escuta.' : 'O ferro aguenta. O barulho, não: lá dentro, pratos param de bater.', { teste: t });
          app.refresh();
          // O barulho acorda o castelo: os de dentro vêm em ondas.
          if (!salvo.alarme && !salvo.disfarce) {
            await asArmas('Pelas seteiras acima do portão, cabeças de goblin aparecem — e somem gritando.');
            const ondas = [...ondasDoBarulho(J(18, 16)), ...alarmeDosArqueiros()];
            combate([grupos.postoNorte, grupos.postoSul].filter((g) => !g.vencido), null, ondas);
          }
        } });
    }
    // A lona da torre em ruínas, vista de fora.
    if (!salvo.lonaAchada && junto(tile, 'lona') && dentro(tile, { x0: 0, y0: 0, x1: 99, y1: CASTELO.lona.y - 1 })) {
      ops.push({ rotulo: 'Procurar uma entrada', icone: 'acao-procurar', detalhe: 'Percepção, CD 10', motivo: longe(10),
        fazer: async () => {
          const t = teste(c, 'percepcao', 10);
          if (t.passou) { salvo.lonaAchada = true; abrir('lona'); }
          await painel(t.passou ? 'Uma trilha de pegadas some nos escombros da torre do norte — e some porque passa por baixo de uma lona velha, pintada da cor da pedra.' : 'Pedra caída, mato, mais pedra.', { teste: t });
          app.refresh();
        } });
    }
    // A torre do urso-coruja.
    if (!salvo.ursoSolto && junto(tile, 'portaUrso') && grupos.urso && !grupos.urso.vencido) {
      const temCarne = herois().some((h) => (h.bag ?? []).some((i) => i.id === 'racoes' && i.qtd > 0));
      if (!salvo.ursoCalmo) {
        ops.push({ rotulo: 'Jogar carne pela fresta', icone: 'acao-usarObjeto', detalhe: 'uma ração de viagem', motivo: longe(5) ?? (temCarne ? null : 'ninguém tem ração para dar'),
          fazer: async () => {
            const dono = herois().find((h) => (h.bag ?? []).some((i) => i.id === 'racoes' && i.qtd > 0));
            const rr = dono.bag.find((i) => i.id === 'racoes'); rr.qtd -= 1;
            salvo.ursoCalmo = true;
            await painel('Do outro lado da porta, um rugido que vira um ronco satisfeito, e barulho de osso quebrando.');
          } });
      }
      ops.push({ rotulo: 'Levantar a tranca', icone: 'acao-empurrar', motivo: longe(5),
        fazer: async () => {
          salvo.ursoSolto = true;
          abrir('portaUrso');
          if (salvo.ursoCalmo) {
            // Saciado, com o caminho livre, ele foge do castelo.
            grupos.urso.vencido = true;
            salvo.vencidos.push('urso');
            await painel('A porta abre. O urso-coruja, de bico sujo, olha para vocês, depois para a liberdade — e passa por todos sem se virar, arrastando-se para fora do castelo.');
            await darXpDoLivro(700, 'O urso-coruja libertado');
          } else {
            await asArmas('A tranca cai. Lá dentro, no escuro, algo enorme acorda — e o rugido sai antes dele.');
            combate([grupos.urso], null);
          }
          app.refresh();
        } });
    }
    // A porta escorada entre a guarda e a torre do urso.
    if (!salvo.escorada && junto(tile, 'portaEscorada')) {
      ops.push({ rotulo: 'Derrubar a porta escorada', icone: 'acao-empurrar', detalhe: 'Força, CD 15', motivo: longe(5),
        fazer: async () => {
          const t = teste(c, 'atletismo', 15);
          if (t.passou) { salvo.escorada = true; abrir('portaEscorada'); }
          await painel(t.passou ? 'O que escorava a porta do outro lado cede, e ela cai para dentro com um estrondo.' : 'A porta mal se mexe: tem coisa pesada do outro lado.', { teste: t });
          app.refresh();
        } });
    }
    if (sup === 'arca' && em('torreUrso') && !salvo.bauUrso && (grupos.urso.vencido)) {
      ops.push({ rotulo: 'Procurar no alto', icone: 'acao-procurar', detalhe: 'Percepção, CD 15', motivo: longe(10),
        fazer: async () => {
          const t = teste(c, 'percepcao', 15);
          if (t.passou) {
            salvo.bauUrso = true;
            guardar(c, 'moedaDeOuro', 165); guardar(c, 'pocaoDeCura', 1);
            guardar(c, 'pergaminhoDeSilencio', 1); guardar(c, 'pergaminhoDeReviver', 1);
            await painel(`Lá em cima, onde o piso do andar de cima acabou, sobrou uma arca equilibrada na beirada. Descê-la dá trabalho. Ouro e electro misturados (165 peças de ouro, contando tudo), um frasco de poção de cura e dois rolos de pergaminho com magia: Silêncio e Revivificar. ${c.name} guarda.`, { teste: t });
          } else {
            await painel('Escuridão lá em cima. Se tem alguma coisa, ela não aparece.', { teste: t });
          }
        } });
    }
    // A cama do rei: o saco de couro e o mapa.
    if (sup === 'camaRei' && em('rei') && !salvo.cama && grupos.rei.vencido) {
      ops.push({ rotulo: 'Revirar a cama', icone: 'acao-procurar', motivo: longe(5),
        fazer: async () => {
          salvo.cama = true;
          guardar(c, 'moedaDePrata', 220); guardar(c, 'moedaDeOuro', 80); guardar(c, 'pocaoDeCura', 3);
          const texto = ['O colchão do rei tem um rasgo costurado de qualquer jeito. Lá dentro, uma bolsa de couro pesada: prata (220 peças), electro (o bastante para valer 80 de ouro) e três frascos de poção de cura.'];
          if (salvo.mapa !== 'levado') {
            salvo.mapa = 'achado';
            guardar(c, 'mapaDeGundren', 1);
            texto.push('E, dobrado com cuidado no fundo, um mapa de pergaminho com letra de anão: o caminho para a Caverna Onda Eco.');
          }
          texto.push(`${c.name} guarda tudo.`);
          await painel(texto);
        } });
    }
    // Gundren: acordar.
    if (gundren && !gundren.dead && tile.x === gundren.pos.x && tile.y === gundren.pos.y && grupos.rei.vencido && salvo.gundren !== 'acordado') {
      ops.push({ rotulo: 'Cuidar de Gundren', icone: 'acao-ajudar', motivo: longe(5),
        fazer: async () => {
          salvo.gundren = 'acordado';
          gundren.hp = 1;
          gundren.conditions = (gundren.conditions ?? []).filter((k) => k.id !== 'inconsciente');
          app.refresh();
          await app.conversarCom(gundren, arvoreGundren());
        } });
    }
    // Saída: o terraço, para a trilha.
    if (tile.x <= 1 + D.x && dentro(tile, { x0: 0, y0: 6 + D.y, x1: 1 + D.x, y1: 14 + D.y })) {
      ops.push({ rotulo: 'Voltar à trilha', icone: 'acao-disparada', detalhe: 'o mapa da região', motivo: longe(10), fazer: () => sair() });
    }
    return ops;
  }

  /**
   * A ESTATUETA DO ELFO SOLAR. O livro dá a ela um augúrio: quem não é mau,
   * segurando-a, faz uma pergunta e ouve a resposta na cabeça — uma vez só,
   * e nunca mais. Ela responde ao que o grupo pode querer saber aqui; depois
   * cala para sempre (`feitos.estatuetaUsada`).
   */
  function interacoesDoHeroi(c) {
    const tem = (c.bag ?? []).some((i) => i.id === 'estatuetaDoElfo');
    if (!tem || feitos.estatuetaUsada || !estado.explorando) return [];
    return [{
      rotulo: 'Consultar a estatueta',
      icone: 'acao-usarObjeto',
      detalhe: 'uma pergunta, uma vez só',
      fazer: async () => {
        const r = await narrar(root, {
          formato: 'painel',
          paginas: [{ texto: [
            `${c.name} fecha a mão no elfo de ouro, e o ouro esquenta. Não é uma voz: é uma certeza que aparece do nada, como se sempre tivesse estado ali. Uma pergunta — e só uma.`,
          ] }],
          escolhas: [
            { rotulo: 'Onde está o mapa do Gundren?', valor: 'mapa', primaria: true },
            { rotulo: 'O que nos espera lá dentro?', valor: 'perigo' },
            { rotulo: 'Quem é o Aranha Negra?', valor: 'aranha' },
            { rotulo: 'Guardar a pergunta', valor: 'nada' },
          ],
        });
        if (r === 'nada') return;
        feitos.estatuetaUsada = true;
        await painel({
          mapa: 'DEBAIXO DE QUEM DORME. O ouro esfria na mão, e o elfo não diz mais nada — nem agora, nem nunca.',
          perigo: 'UM QUE MENTE COM A CARA DE OUTRO. O ouro esfria na mão, e o elfo não diz mais nada — nem agora, nem nunca.',
          aranha: 'UM NOME EMPRESTADO, FUNDO NA TERRA, ONDE A SUA GENTE CAVOU DEMAIS. O ouro esfria na mão, e o elfo não diz mais nada — nem agora, nem nunca.',
        }[r]);
      },
    }];
  }

  function arvoreGundren() {
    return {
      inicio: 'oi',
      nos: {
        oi: {
          narra: 'O anão abre um olho inchado, depois o outro, e leva um tempo para entender que as caras em volta não são de goblin.',
          fala: () => [
            'Vocês… vocês vieram. Pelos ossos do meu avô. Eu achei que ia morrer nesta latrina de castelo.',
            salvo.mapa === 'achado'
              ? 'E o mapa! Vocês acharam o mapa. Então ainda há esperança para os meus irmãos.'
              : 'O mapa… eles me tomaram o mapa. Onde foi parar, eu não sei — estive apagado o tempo todo. E eu não saio deste castelo sem ele.',
          ],
          opcoes: [
            { texto: 'Seus irmãos?', vai: 'irmaos', uma: true },
            { texto: 'Vamos levar você para casa.', fim: 'paz' },
          ],
        },
        irmaos: {
          fala: 'Nundro e Tharden. Achamos a entrada da mina — a Caverna Onda Eco —, e alguém nos achou primeiro. Um tal de Aranha Negra. Se eles ainda estiverem vivos, é lá que estão.',
          opcoes: [{ texto: '…', vai: 'oi' }],
        },
      },
    };
  }

  async function sair() {
    // Acordado, o Gundren não sai sem o mapa enquanto ele ainda estiver aqui.
    if (gundren && !gundren.dead && salvo.gundren === 'acordado' && !salvo.mapa) {
      // O livro é explícito: ele NÃO sabe onde o rei escondeu o mapa.
      await painel('— Sem o meu mapa, não — diz Gundren, firme como pode. — Onde o bugbear enfiou, eu não faço ideia; estive apagado o tempo todo. Mas sem ele eu não dou um passo.');
      return;
    }
    estado.encerrado = true;
    const grupo = enc.combatants.filter((c) => c.side === 'party' && !c.dead);
    if (gundren && !gundren.dead && salvo.gundren === 'acordado') {
      salvo.gundren = 'livre';
      vila.gundrenResgatado = true;
      feitos.gundrenResgatado = true;
      await painel('Gundren vai com vocês, mancando, apoiado num ombro e reclamando de tudo. Melhor sinal de saúde impossível.');
    }
    if (grupos.rei.vencido) feitos.casteloDentefino = true;
    app.irParaRegiao(grupo, 'castelo');
  }

  /** O que a cena aceita das magias de utilidade que usam ganchos: o fio do salão (Encontrar Armadilhas). */
  function ganchosMagicos() {
    if (!estado.explorando || salvo.armadilha === 'disparada') return [];
    const q = CASTELO.armadilha[0];
    return [{
      id: 'fio', tipo: 'armadilha', x: q.x, y: q.y, nome: 'O fio de cobre do salão',
      vista: salvo.armadilha === 'vista',
      texto: 'um fio fino de cobre esticado na altura do tornozelo no entulho da porta leste, que sobe até um teto prestes a cair. Dá para passar por cima sem tocar nele.',
      revelar: () => {
        if (salvo.armadilha) return false;
        salvo.armadilha = 'vista';
        return true;
      },
    }];
  }

  return {
    lugar: 'Castelo Dentefino',
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    interacoesDoHeroi,
    ganchosMagicos,
    depoisDeMover,
    fimDoCombate,
    evento,
    dialogoDe: (npc) => (npc === gundren && salvo.gundren === 'acordado' ? arvoreGundren() : null),
    depoisDaConversa: () => {},
    motivoSemDescanso: (tipo) => {
      if (!estado.explorando) return 'só fora da luta';
      if (tipo === 'longo' && !grupos.rei.vencido) return 'dentro do castelo do rei goblin? Não';
      return null;
    },
    textoDoDescanso: () => ['Um descanso num canto de torre caída, com alguém de guarda na porta.'],
    async iniciar() {
      prepararExploracao();
      if (gundren && !enc.combatants.includes(gundren)) enc.addCombatant(gundren);
      app.refresh();
      await painel(salvo.alarme || salvo.disfarce
        ? 'O castelo de novo: torres tortas, mato, silêncio. Silêncio demais.'
        : 'A trilha dos goblins sai da mata e para diante de um morro de pedra que um dia foi castelo.');
    },
  };
}
