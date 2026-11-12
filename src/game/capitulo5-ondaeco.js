// A CAVERNA ONDA ECO (Parte 4 da aventura). Mapa em `game/ondaeco.js`, lido da imagem do mapa de batalha
// por `src/dev/mapa-ondaeco.py`; as peças em `ondaeco-objetos.json`, os textos em `ondaeco-dados.js`.
//
// O QUE ESTA FASE É: a masmorra do fim. Vinte áreas, quase todas com um bando ou um achado, e o Aranha
// Negra no templo do canto noroeste. O grupo entra pelo sudoeste (área 1) e escolhe o caminho: o fosso da
// entrada leva às minas (2) e à velha entrada (3); dali, às salas e às cavernas. Nenhum bando persegue o
// grupo pelo mapa inteiro: cada um acorda quando alguém pisa na área dele (por área, nunca por raio, que
// vazaria por cima de parede). O grupo chega aqui no 4º nível ou perto, e sai no 5º.
//
// AS REGRAS são do livro; o TEXTO é nosso. Os fatos que ficam: o drow Nezznar procura a Forja das Magias;
// os irmãos Buscapedra acharam a entrada e um morreu; os mortos-vivos e os monstros da mina travaram a
// exploração dele; Nundro está preso nos aposentos do sacerdote.
//
// O estado mora em `app.campanha.ondaEco` e sobrevive a sair e voltar.

import { narrar } from '../view/narrativa.js';
import { distanceFt, ARESTA, Battlefield, SUPERFICIES } from '../core/grid.js';
import { d20, damageRoll } from '../core/dice.js';
import { skillBonus, passivePerception, saveBonus, SKILL_NAME, rolarPericia } from '../rules/abilities.js';
import { addCondition, hasCondition, removeCondition, gastarFolego, recuperarFolego } from '../rules/conditions.js';
import { emiteLuz } from '../rules/luz.js';
import { criarBuscas } from './buscas.js';
import { makeMonster } from '../rules/monsters.js';
import { makeNpc } from '../rules/npcs.js';
import { itemDeId, garantirInventario } from '../rules/equipment.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { ONDA_ECO } from './ondaeco.js';
import { guardar } from './comercio.js';
import { grupoTem } from './saque.js';
import { paginasDoEpilogo } from './epilogo.js';
import { TEXTOS, EXAMES, arvoreDeMormesk, arvoreDoEspectador, arvoreDeNezznar, arvoreDeNundro } from './ondaeco-dados.js';
import { LORE, fatosAte } from '../rules/lore.js';

const MOVIMENTO = 60;
const AREA_DE = new Map();
for (const [id, cs] of Object.entries(ONDA_ECO.areas)) for (const c of cs) AREA_DE.set(`${c.x},${c.y}`, id);
const areaDe = (p) => AREA_DE.get(`${p.x},${p.y}`) ?? null;
const naArea = (p, id) => areaDe(p) === id;
const CELULAS_DE = (id) => new Set((ONDA_ECO.salas?.[id] ?? []).map((c) => `${c.x},${c.y}`));
const CHAVE_DE = (a, b) => `${a.x},${a.y},${b.x},${b.y}`;

export function criarOndaEco(app) {
  const enc = app.enc;
  const root = app.root;
  const camp = (app.campanha ??= {});
  const feitos = (camp.feitos ??= {});
  const vila = (camp.vila ??= { pistas: [], missoes: {} });
  const salvo = (camp.ondaEco ??= {});
  salvo.buscas ??= {};
  const buscas = criarBuscas(salvo.buscas);
  const estado = { explorando: false, encerrado: false, lutando: null, reforcos: [], vagando: null };
  let rotaDoMovimento = [];

  const herois = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead && c.hp > 0);
  const casaPerto = (p) => enc.casaLivreMaisProxima(p) ?? p;
  const teste = (c, pericia, cd) => {
    const r = rolarPericia(enc.rng, c, pericia);
    return { quem: c.name, pericia: SKILL_NAME[pericia], total: r.total, cd, passou: r.total >= cd };
  };
  const salvaguarda = (c, atributo, cd) => {
    const r = d20(enc.rng, saveBonus(c, atributo));
    return { quem: c.name, total: r.total, cd, passou: r.total >= cd };
  };
  const painel = (texto, extra = {}) => narrar(root, { formato: 'painel', paginas: [{ texto: [].concat(texto), ...extra }] });
  const pista = (t) => { if (!(vila.pistas ??= []).includes(t)) vila.pistas.push(t); };
  const tem = (id) => herois().some((h) => (h.bag ?? []).some((i) => i.id === id && i.qtd > 0));
  // O livro pede FERRAMENTAS DE LADRÃO para arrombar o cofre dos avaliadores e a porta dos aposentos do sacerdote.
  const semFerramentas = (c) => (garantirInventario(c).bag.some((i) => i.id === 'ferramentasDeLadrao' && i.qtd > 0) ? null : `${c.name} não tem ferramentas de ladrão`);

  // ------------------------------------------------------- o elenco ----
  // AS CASAS VÊM DO MAPA (`ONDA_ECO.ninhos`), escolhidas pelo gerador depois de selar o mapa: toda vaga é
  // chão livre e alcançável, e as Grandes (aranhas, gosma) têm as quatro casas de que precisam.
  const ninho = ONDA_ECO.ninhos;
  // O TETO BAIXO DOS TÚNEIS DE MINA (área 2, o Obelisco): ali, Médio ou maior ataca corpo a corpo com desvantagem, a
  // não ser com arma leve (`combat.js`, `field.tetoBaixo`).
  enc.field.tetoBaixo = new Set((ONDA_ECO.areas['2'] ?? []).map((p) => `${p.x},${p.y}`));
  const nasce = (tipo, pos, sufixo, nome) => {
    const m = makeMonster(tipo, { ...pos }, sufixo ? { nameSuffix: sufixo } : {});
    if (nome) m.name = nome;
    return m;
  };
  const letras = 'ABCDEFGHIJ';
  const bando = (chave, tipo, lista) => (salvo[chave] ? [] : lista.map((p, i) => nasce(tipo, p, lista.length > 1 ? letras[i] : null)));
  const stirges = bando('stirges', 'stirge', ninho.stirges);
  // A GUARITA (área 4) é o OBELISCO: oito cadáveres que levantam, dois ogros e seis anões, no lugar dos nove
  // esqueletos da Mina. A chave do save continua `esqueletos`, para a guarita resolvida num save antigo valer.
  const zumbisOgros = bando('esqueletos', 'zumbiOgro', ninho.zumbisOgros);
  const zumbisGuarita = bando('esqueletos', 'zumbi', ninho.zumbisGuarita).map((f, i) => Object.assign(f, { name: `Zumbi anão ${letras[i]}` }));
  const mortosDaGuarita = [...zumbisOgros, ...zumbisGuarita];
  // O QUE O OBELISCO PÔS onde a Mina não tinha ninguém: os fungos violeta (8, no lugar do gás), a serpente do
  // poço escuro (10) e o polvo da caverna trovejante (16).
  const fungos = bando('fungos', 'fungoVioleta', ninho.fungosVioleta);
  const serpente = bando('serpente', 'serpenteConstritoraGigante', ninho.serpente);
  const polvo = bando('polvo', 'polvoGigante', ninho.polvo);
  const ghoulsSul = bando('ghoulsSul', 'ghoul', ninho.ghoulsSul);
  const ghoulsGrande = bando('ghoulsGrande', 'ghoul', ninho.ghoulsGrande);
  const gosma = bando('gosma', 'gelatinaOcre', ninho.gosma);
  const bugbearsNorte = bando('bugbearsNorte', 'bugbear', ninho.bugbearsNorte);
  if (bugbearsNorte[0]) bugbearsNorte[0].name = 'Bugbear maior';
  const zumbis = bando('zumbis', 'zumbi', ninho.zumbis);
  const caveira = bando('zumbis', 'caveiraCandente', ninho.caveira);
  const bugbearsFenda = bando('fenda', 'bugbear', [...ninho.bugbearsFenda, ...ninho.bugbearGuarda]);
  const vhalak = salvo.fenda ? [] : [nasce('doppelganger', ninho.vhalak[0], null, 'Vhalak (drow)')];
  const nezznar = salvo.templo ? null : nasce('nezznar', ninho.nezznar[0], null, 'Nezznar');
  const bugbearsTemplo = bando('templo', 'bugbear', ninho.bugbearsTemplo);
  // O templo do Obelisco não tem aranhas (a Mina tinha quatro); o ninho segue no gerador, vazio.
  const mormesk = salvo.mormesk === 'morto' ? null : nasce('mormesk', ninho.mormesk[0]);
  const espectador = ['dispensado', 'morto'].includes(salvo.espectador) ? null : nasce('spectator', ninho.espectador[0], null, 'Espectador');
  const nundro = makeNpc('gundren', { ...ninho.nundro[0] });
  nundro.ficha = 'nundro';
  nundro.name = 'Nundro';

  // Cada bando, com o que o fim da luta faz dele: a chave que se marca, o motivo do XP e o texto.
  const BANDOS = [
    { chave: 'stirges', lista: stirges, xp: 'Os stirges da velha entrada', fim: TEXTOS.fimStirges },
    { chave: 'esqueletos', lista: mortosDaGuarita, xp: 'Os mortos da guarita', fim: TEXTOS.fimGuarita },
    { chave: 'fungos', lista: fungos, xp: 'Os fungos violeta', fim: TEXTOS.fimFungos },
    { chave: 'serpente', lista: serpente, xp: 'A serpente do poço escuro', fim: TEXTOS.fimSerpente },
    { chave: 'polvo', lista: polvo, xp: 'O polvo da caverna trovejante', fim: TEXTOS.fimPolvo },
    { chave: 'ghoulsSul', lista: ghoulsSul, xp: 'Os ghouls do alojamento sul', fim: TEXTOS.fimGhoulsSul },
    { chave: 'ghoulsGrande', lista: ghoulsGrande, xp: 'O bando de ghouls da grande caverna', fim: TEXTOS.fimGhoulsGrande },
    { chave: 'gosma', lista: gosma, xp: 'A gosma ocre dos túneis', fim: TEXTOS.fimGosma },
    { chave: 'bugbearsNorte', lista: bugbearsNorte, xp: 'Os bugbears do alojamento norte', fim: TEXTOS.fimBugbearsNorte },
    { chave: 'zumbis', lista: [...zumbis, ...caveira], xp: 'Os mortos da fundição', fim: TEXTOS.fimZumbis },
    { chave: 'fenda', lista: [...bugbearsFenda, ...vhalak], xp: 'Os servos de Nezznar na caverna desmoronada', fim: TEXTOS.fimFenda },
    { chave: 'templo', lista: [...(nezznar ? [nezznar] : []), ...bugbearsTemplo], xp: 'Nezznar, o Aranha Negra', fim: TEXTOS.fimTemplo },
  ];
  const valeDoBando = (b) => b.reduce((s, f) => s + (f.xp ?? 0), 0);
  const furtividadeDe = (b) => b.map((f) => rolarPericia(enc.rng, f, 'furtividade').total);

  // REFORÇOS: os bugbears da caverna desmoronada ouvem a luta do templo e chegam três rodadas depois.
  function prepararReforcos(porRodada) {
    estado.reforcos = [];
    const trazer = (ate) => {
      const chaves = Object.keys(porRodada).map(Number).sort((a, b) => a - b).filter((k) => k <= ate);
      for (const k of chaves) {
        const l = porRodada[k];
        const units = l.bando.filter((f) => !f.dead && !enc.combatants.includes(f));
        if (!units.length) continue;
        l.antes?.();
        for (const f of units) f.side = 'foes';
        estado.reforcos.push(...units);
        return { units, aviso: l.aviso };
      }
      return null;
    };
    enc.reinforcements = (rodada) => trazer(rodada);
    enc.lotePendente = () => trazer(Infinity);
  }

  function prepararExploracao() {
    enc.reinforcements = null;
    enc.lotePendente = null;
    estado.reforcos = [];
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

  function luta(quem, surpresa = null) {
    for (const f of quem) {
      if (f.dead) continue;
      f.side = 'foes';
      if (enc.combatants.includes(f)) continue;
      // A pegada vem do tamanho de verdade (`pos.f`): a serpente constritora é Enorme, 3 x 3, e a conta antiga só
      // sabia de 1 x 1 e de 2 x 2.
      const lado = f.pos.f ?? 1;
      const pegada = Array.from({ length: lado * lado }, (_, k) => [k % lado, Math.floor(k / lado)]);
      if (pegada.some(([dx, dy]) => enc.occupied(f.pos.x + dx, f.pos.y + dy, f))) f.pos = { ...f.pos, ...casaPerto(f.pos) };
      enc.addCombatant(f);
    }
    estado.explorando = false;
    estado.lutando = quem;
    root.classList.remove('explorando');
    enc.emboscada = surpresa === 'nossa'
      ? { emboscadores: 'party', furtividade: herois().map(() => 20) }
      : (surpresa === 'deles' || surpresa?.furt)
        ? { emboscadores: 'foes', furtividade: surpresa?.furt ?? quem.map(() => 13) }
        : null;
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
  }

  async function darXpDaLuta(xp, motivo) {
    const grupo = enc.combatants.filter((x) => x.side === 'party' && !x.dead);
    if (!grupo.length || !xp) return;
    const cada = Math.floor(xp / grupo.length);
    const sobem = darXp(grupo, cada);
    enc.say('cura', `${motivo}: ${cada} XP para cada um.`);
    if (sobem.length) for (const t of await telaDeSubirNivel(root, sobem)) enc.say('cura', t);
  }

  const tirarDoTabuleiro = (f) => {
    const i = enc.combatants.indexOf(f);
    if (i >= 0) enc.combatants.splice(i, 1);
  };
  const entrarNeutro = (f, olhaPara = { dx: 1, dy: 0 }) => {
    f.side = 'neutro';
    f.facingVec = olhaPara;
    if (!enc.combatants.includes(f)) enc.addCombatant(f);
  };

  // ----------------------------------------------- o que acorda cada área ----
  // Os mortos de cinza ficam deitados: levantar custa metade do deslocamento (como em Árvore Trovão).
  const deitados = (b) => { for (const f of b) if (!f.dead) addCondition(f, 'caido'); };

  async function acordarStirges() {
    salvo.stirges = 'luta';
    await painel(TEXTOS.stirges, { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    // O OBELISCO: quem não está olhando para o teto precisa de Percepção 14 para não ser surpreendido — a régua é
    // fixa, 14, contra a passiva de cada um (o motor compara a menor "Furtividade" com a passiva).
    luta(stirges.filter((f) => !f.dead), { furt: stirges.map(() => 14) });
  }
  async function acordarGuarita() {
    salvo.esqueletos = 'luta';
    await painel(TEXTOS.guarita, { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    // O livro: os mortos só se levantam na rodada DEPOIS da entrada, então o grupo age primeiro (eles perdem a rodada 1).
    luta(mortosDaGuarita.filter((f) => !f.dead), 'nossa');
  }

  /**
   * OS FUNGOS VIOLETA (área 8, Obelisco). Dois, um no meio do canteiro central e um no do norte, e são difíceis de
   * notar entre os outros fungos: quem entra na caverna faz um teste de Natureza CD 15, uma vez, e quem passa os
   * vê antes de chegar ao alcance deles. Eles mal andam (1,5 m), então quem os viu contorna pelas paredes sul e
   * leste e não luta. A luta só começa quando alguém para a 3 m de um — o alcance do Toque Apodrecido —, e começa
   * com surpresa se ninguém os tiver notado.
   */
  async function fungosVioleta(c) {
    const vivos = fungos.filter((f) => !f.dead);
    if (!vivos.length || salvo.fungos) return false;
    salvo.olharamFungos ??= [];
    const novos = herois().filter((h) => naArea(h.pos, '8') && !salvo.olharamFungos.includes(h.id));
    for (const h of novos) {
      salvo.olharamFungos.push(h.id);
      const r = rolarPericia(enc.rng, h, 'natureza');
      if (r.total >= 15 && !salvo.fungosVistos) {
        salvo.fungosVistos = true;
        await painel([TEXTOS.fungosVistos.replace('{quem}', h.name)]);
      }
    }
    const perto = herois().find((h) => vivos.some((f) => distanceFt(h.pos, f.pos) <= 10));
    if (!perto) return false;
    salvo.fungos = 'luta';
    await painel(salvo.fungosVistos ? TEXTOS.fungosPerto : TEXTOS.fungosSurpresa, { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    luta(vivos, salvo.fungosVistos ? null : 'deles');
    return true;
  }

  /**
   * A SERPENTE DO POÇO ESCURO (área 10, Obelisco). Ela mora no lago e, quando o grupo passa, sai da água e ataca
   * quem vem POR ÚLTIMO. "Por último" é quem está mais longe de quem entrou primeiro — é a fila andando —, e a IA
   * recebe isso como alvo preferido (`alvoPreferido`), que é o único jeito de o bicho escolher pelo livro.
   */
  async function serpenteDoPoco(c) {
    const s = serpente.filter((f) => !f.dead);
    if (!s.length || salvo.serpente) return false;
    salvo.serpente = 'luta';
    const fila = herois();
    const ultimo = fila.reduce((a, h) => (distanceFt(h.pos, c.pos) > distanceFt(a.pos, c.pos) ? h : a), c);
    s[0].alvoPreferido = ultimo.id;
    await painel(TEXTOS.serpente.map((t) => t.replace('{quem}', ultimo.name)), { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    luta(s, { furt: furtividadeDe(s) });
    return true;
  }

  /**
   * O POLVO DA CAVERNA TROVEJANTE (área 16, Obelisco). É atraído por luz ACIMA da água: se alguém fica na borda
   * com tocha, lanterna ou luz mágica, ele sobe e ataca. Quem anda no escuro passa sem que ele se mexa. Os
   * tentáculos alcançam 4,5 m, e quem está a mais de 1,5 m da beirada fica a salvo — o alcance do bloco já faz isso.
   * Quem ele agarra vai para a água, e quem começa o turno na água faz Força CD 10 ou afunda (`aguaDoPolvo`).
   */
  async function polvoDaCaverna() {
    const p = polvo.filter((f) => !f.dead);
    if (!p.length || salvo.polvo) return false;
    const comLuz = herois().find((h) => naArea(h.pos, '16') && emiteLuz(h));
    if (!comLuz) return false;
    salvo.polvo = 'luta';
    p[0].alvoPreferido = comLuz.id;
    await painel(TEXTOS.polvo.map((t) => t.replace('{quem}', comLuz.name)), { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    luta(p, { furt: furtividadeDe(p) });
    return true;
  }
  async function acordarGhoulsSul() {
    salvo.ghoulsSul = 'luta';
    await painel(TEXTOS.ghoulsSul, { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    luta(ghoulsSul.filter((f) => !f.dead));
  }
  async function acordarGhoulsGrande() {
    salvo.ghoulsGrande = 'luta';
    await painel(TEXTOS.ghoulsGrande, { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    luta(ghoulsGrande.filter((f) => !f.dead));
  }
  async function acordarGosma(sozinho) {
    salvo.gosma = 'luta';
    // Ela vinha seguindo o grupo desde que entrou nos túneis: sai da parede a poucas casas de quem ficou para trás.
    if (sozinho && gosma[0]) gosma[0].pos = { ...gosma[0].pos, ...(enc.casaLivreMaisProxima({ x: sozinho.pos.x + 3, y: sozinho.pos.y, f: 2 }) ?? sozinho.pos) };
    await painel(TEXTOS.gosma, { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    luta(gosma.filter((f) => !f.dead));
  }
  async function acordarBugbearsNorte() {
    salvo.bugbearsNorte = 'luta';
    await painel(TEXTOS.bugbearsNorte, { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    luta(bugbearsNorte.filter((f) => !f.dead));
  }
  async function acordarZumbis() {
    salvo.zumbis = 'luta';
    await painel(TEXTOS.zumbis, { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    const b = zumbis.filter((f) => !f.dead);
    deitados(b);
    // A COLEIRA DOS ZUMBIS. O livro os prende à área 12: levantam-se contra qualquer vivo que entre na
    // sala, mas não seguem ninguém para fora dela por mais de uma rodada. Sem isso, oito zumbis saíam
    // atrás do grupo pelo canal e pela passagem e iam parar na caverna estrelada — a fundição ficava
    // vazia, e a tática de recuar virava a resposta a tudo. A caveira em chamas NÃO tem coleira: ela é
    // inteligente, e o trabalho dela, no livro, é justamente impedir que alguém passe.
    enc.antesDoTurno = (m) => {
      if (!b.includes(m) || m.dead || !m.pos) return false;
      if (naArea(m.pos, '12')) { delete m.foraDesde; return false; }
      m.foraDesde ??= enc.round;
      if (enc.round - m.foraDesde < 1) return false;
      // volta um passo para a sala, e não ataca neste turno
      const alvo = ONDA_ECO.areas['12']
        .filter((q) => !enc.field.blocksMove(q.x, q.y) && !enc.occupied(q.x, q.y, m))
        .sort((q, r) => distanceFt(m.pos, q) - distanceFt(m.pos, r))[0];
      if (!alvo) return false;
      const passo = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]
        .map(([dx, dy]) => ({ x: m.pos.x + dx, y: m.pos.y + dy }))
        .filter((q) => enc.field.inside(q.x, q.y) && !enc.field.blocksMove(q.x, q.y)
          && !enc.occupied(q.x, q.y, m) && enc.field.passa(m.pos.x, m.pos.y, q.x, q.y, 'passo'))
        .sort((q, r) => distanceFt(q, alvo) - distanceFt(r, alvo))[0];
      if (!passo || distanceFt(passo, alvo) >= distanceFt(m.pos, alvo)) return false;
      m.pos = { ...m.pos, ...passo };
      enc.say('acao', `${m.name} para, perde o interesse e arrasta os pés de volta para a fundição.`);
      app.refresh();
      return true;
    };
    luta([...b, ...caveira.filter((f) => !f.dead)]);
  }
  /** A CAVEIRA EM CHAMAS REACENDE (o SRD): os restos não tratados voltam a arder com todos os PV. */
  async function caveiraReacende() {
    const r = salvo.caveiraRestos;
    salvo.caveiraVolta = false;
    salvo.caveiraRestos = null;
    const c = nasce('caveiraCandente', casaPerto(r), null);
    estado.caveiraDeVolta = c;
    await painel(['No chão da fundição, o crânio que vocês deixaram para trás se ergue sozinho. Primeiro uma brasa verde no fundo de uma órbita, depois as duas — e a chama sobe inteira, como se nunca tivesse se apagado.'],
      { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    luta([c]);
  }

  async function acordarFenda() {
    salvo.fenda = 'luta';
    await painel(TEXTOS.fenda, { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    // O Obelisco: com TRÊS ou mais bugbears mortos (dos quatro), o doppelganger recua para o templo para avisar Nezznar. Ele sai do campo
    // vivo (não dá XP agora) e espera no templo, onde se faz passar por Nundro.
    enc.antesDoTurno = (m) => {
      if (!vhalak[0] || m !== vhalak[0] || m.dead || m.recuou) return false;
      if (bugbearsFenda.filter((f) => f.dead).length < 3) return false;
      m.recuou = true;
      salvo.vhalakRecuou = true;
      salvo.aranhasAvisadas = true;           // ele corre para avisar Nezznar: o templo espera o grupo
      tirarDoTabuleiro(m);
      enc.say('acao', TEXTOS.vhalakRecua);
      enc.checkEnd();
      app.refresh();
      return true;
    };
    luta([...bugbearsFenda, ...vhalak].filter((f) => !f.dead));
  }

  // O DOPPELGANGER NO TEMPLO: se recuou, faz-se passar por Nundro amarrado ao lado de Nezznar (barganha para o grupo se
  // render). Se o Nundro de verdade já foi libertado o truque não vale, e Vhalak só se junta à luta como drow.
  let vhalakNoTemplo = null;
  let refemFalso = null;
  const vhalakDoTemplo = () => vhalak[0] ?? (vhalakNoTemplo ??= nasce('doppelganger', ninho.vhalak[0], null, 'Vhalak (drow)'));
  const haRefem = () => Boolean(salvo.vhalakRecuou && !salvo.templo && salvo.nundro !== 'livre');
  function posicionarRefem() {
    if (!haRefem() || !nezznar || refemFalso) return;
    refemFalso = makeNpc('gundren', casaPerto({ x: nezznar.pos.x + 1, y: nezznar.pos.y + 1 }), { side: 'neutro' });
    refemFalso.name = 'Nundro';
    refemFalso.refem = true;
    refemFalso.falas = ['Por trás do pano, ele geme e olha de vocês para o drow, depressa, como quem pede ajuda.'];
    refemFalso.facingVec = { dx: 0, dy: 1 };
    enc.addCombatant(refemFalso);
  }
  /**
   * O doppelganger na luta do templo. Revelado pela Intuição ele entra já (`'revelado'`); senão o "Nundro" continua
   * amarrado na rodada 1 e a máscara cai na rodada 2 (o livro o põe como barganha, não como combatente de abertura).
   */
  function vhalakDaLuta() {
    if (!salvo.vhalakRecuou || salvo.templo) return null;
    const v = vhalakDoTemplo();
    if (v.dead) return null;
    v.pos = refemFalso ? { ...refemFalso.pos } : { ...casaPerto({ x: nezznar.pos.x, y: nezznar.pos.y + 1 }) };
    v.facingVec = refemFalso?.facingVec ?? { dx: 1, dy: 0 };
    return v;
  }
  const tirarRefem = () => { if (refemFalso) { tirarDoTabuleiro(refemFalso); refemFalso = null; } };

  // O GÁS DOS FUNGOS DA MINA (área 8) SAIU: o Obelisco o trocou pelos dois fungos violeta (`fungosVioleta`). Os
  // fungos verdes que brilham continuam inofensivos e continuam dando luz à caverna inteira.

  // ------------------------------------------------- as conversas ----
  const temOferta = () => herois().some((h) => (h.bag ?? []).some((i) => (itemDeId(i.id)?.dados.raridade ?? null) && i.qtd > 0));
  const arvoreDe = (npc) => {
    if (mormesk && npc === mormesk) return arvoreDeMormesk({ salvo, tem: temOferta });
    if (espectador && npc === espectador) return arvoreDoEspectador({ salvo });
    if (nezznar && npc === nezznar) return arvoreDeNezznar({ refem: Boolean(refemFalso) });
    if (npc === nundro) return arvoreDeNundro({ salvo });
    return null;
  };
  // O que cada conversa decide (a mesma saída vale quando a conversa abre sozinha e quando o jogador clica no NPC).
  async function resolver(npc, fim) {
    if (mormesk && npc === mormesk) {
      if (fim === 'luta') { salvo.mormesk = 'luta'; luta([mormesk]); }
      else if (fim === 'acordo') {
        salvo.mormesk = 'acordo';
        pista('Mormesk, o espectro dos aposentos dos magos, promete o tesouro e o acesso aos livros a quem acabar com o espectador da Forja das Magias.');
      }
    } else if (espectador && npc === espectador) {
      if (fim === 'luta') {
        salvo.espectador = 'luta';
        // O ESPECTADOR CEGO VAI EMBORA. É regra do livro, e não invenção: cego, ele se dá por incapaz de
        // cumprir a tarefa para a qual foi invocado e volta sozinho para o plano de onde veio. É a saída que
        // o grupo compra com uma magia em vez de com os pontos de vida dele, e não existia: cego, ele
        // continuava lutando às cegas como qualquer monstro. Vale o mesmo XP da conversa.
        enc.antesDoTurno = (m) => {
          if (m !== espectador || m.dead || m.fugiu || !hasCondition(m, 'cego')) return false;
          salvo.espectador = 'dispensado';
          tirarDoTabuleiro(espectador);
          enc.say('acao', TEXTOS.espectadorCego);
          enc.checkEnd();
          app.refresh();
          return true;
        };
        luta([espectador]);
      }
      else if (fim === 'dispensado') {
        salvo.espectador = 'dispensado';
        tirarDoTabuleiro(espectador);
        await painel(TEXTOS.espectadorSome);
        await darXpDaLuta(valeDoBando([espectador]), 'O espectador, convencido a partir');
        app.refresh();
      }
    } else if (nezznar && npc === nezznar) {
      if (['luta', 'luta-surpresa', 'luta-revelado'].includes(fim)) {
        // Revelado pela Intuição: a máscara cai agora, o grupo está alerta e os bugbears não pegam ninguém de surpresa.
        if (fim === 'luta-revelado') {
          if (refemFalso) await painel(TEXTOS.refemRevela);
          iniciarTemplo('alerta', 'revelado');
        } else iniciarTemplo(fim === 'luta-surpresa' ? 'nossa' : null, 'tarde');
      }
    } else if (npc === nundro && ['resgatado', 'junto'].includes(fim)) {
      salvo.nundro = 'livre';
      feitos.nundroResgatado = true;
      // NUNDRO SE OFERECE PARA IR JUNTO, e o livro é explícito nisso: solto, ele agradece e pede para
      // seguir com o grupo. A árvore só o deixava ficar deitado na cela. Quem aceita ganha um aliado de
      // verdade — ele entra no tabuleiro do lado do grupo, em vez de `neutro` —, e quem prefere deixá-lo
      // em paz tem o que tinha. Os 200 XP são os mesmos nos dois caminhos: o livro os dá por resgatá-lo,
      // não por levá-lo.
      if (fim === 'junto') {
        salvo.nundroJunto = true;
        nundro.side = 'party';
        if (!enc.combatants.includes(nundro)) enc.addCombatant(nundro);
        await painel(TEXTOS.nundroJunto);
      } else {
        await painel(TEXTOS.nundroLivre);
      }
      // 200 XP se ele sobreviver à aventura: já pagos se Nezznar caiu; senão, na queda dele.
      if (salvo.templo === 'limpo') { salvo.nundroPago = true; await darXpDaLuta(200, 'Nundro resgatado'); }
      app.refresh();
    }
  }
  async function conversaDe(npc, olhaPara) {
    entrarNeutro(npc, olhaPara);
    const r = await app.conversarCom(npc, arvoreDe(npc));
    await resolver(npc, r);
  }
  const conversaDeMormesk = () => { salvo.mormeskVisto = true; return conversaDe(mormesk, { dx: 0, dy: 1 }); };
  const conversaDoEspectador = () => { salvo.espectadorVisto = true; return conversaDe(espectador, { dx: -1, dy: 0 }); };
  const conversaDeNezznar = async () => { salvo.temploVisto = true; posicionarRefem(); await conversaDe(nezznar, { dx: 1, dy: 0 }); };
  // A LUTA FINAL, pelo Obelisco: Nezznar e os DOIS bugbears da mesa (a Mina punha quatro aranhas gigantes; o Obelisco
  // as tirou). Avisado (`salvo.aranhasAvisadas`, o nome antigo da bandeira de "o templo sabe"), os bugbears se escondem
  // atrás dos pilares e rolam Furtividade — a pior rolagem é a CD da Percepção do grupo — e o drow fica perto da
  // mesa, invisível. O que ainda estiver de pé na caverna desmoronada (W18) ouve a luta e chega na rodada 3.
  function iniciarTemplo(surpresa = null, vhalakQuando = null) {
    salvo.templo = 'luta';
    const esperando = salvo.aranhasAvisadas && surpresa !== 'alerta' && surpresa !== 'nossa';
    const vivosDoTemplo = bugbearsTemplo.filter((f) => !f.dead);
    const furt = esperando ? [Math.min(...furtividadeDe(vivosDoTemplo).concat([99]))] : null;
    if (esperando && nezznar && !nezznar.dead) {
      addCondition(nezznar, 'invisivel');
      enc.say('magia', TEXTOS.nezznarInvisivel);
    }
    // Da caverna desmoronada, se ninguém resolveu aquilo antes: os quatro bugbears (e o Vhalak, se não recuou).
    const reforco = salvo.fenda ? [] : bugbearsFenda.filter((f) => !f.dead);
    for (const [i, f] of reforco.entries()) f.name = `Bugbear da fenda ${letras[i]}`;
    const ondas = {};
    const vhalakDaFenda = !salvo.fenda && !salvo.vhalakRecuou && vhalak[0] && !vhalak[0].dead ? [vhalak[0]] : [];
    if (reforco.length || vhalakDaFenda.length) ondas[3] = { bando: [...reforco, ...vhalakDaFenda], aviso: 'Do corredor chegam passos pesados: a caverna desmoronada ouviu a luta.' };
    // O doppelganger que RECUOU da 18 já está aqui: faz-se passar por Nundro e só tira a máscara quando a luta começa
    // (`revelarVhalak`).
    const vhalakAgora = vhalakQuando ? vhalakDaLuta() : null;
    let extras = [];
    if (vhalakAgora && vhalakQuando === 'revelado') { tirarRefem(); extras = [vhalakAgora]; }
    else if (vhalakAgora) {
      const mascara = Boolean(refemFalso);
      ondas[2] = { bando: [vhalakAgora], antes: tirarRefem, aviso: mascara ? TEXTOS.refemRevela : TEXTOS.vhalakChega };
    }
    if (Object.keys(ondas).length) prepararReforcos(ondas);
    // O grupo entra JUNTO: quem ficou no corredor de duas casas é puxado para a entrada do templo (a luta é de todos).
    const ref = herois().find((h) => naArea(h.pos, '19')) ?? herois()[0];
    for (const h of herois()) {
      if (naArea(h.pos, '19') || distanceFt(h.pos, ref.pos) <= 15) continue;
      h.pos = { ...h.pos, ...casaPerto(ref.pos) };
    }
    luta([nezznar, ...vivosDoTemplo, ...extras].filter((f) => f && !f.dead), surpresa === 'nossa' ? 'nossa' : (furt ? { furt } : null));
  }

  // MONSTROS VAGANDO (o livro): nenhuma parte da mina é segura. Quem gasta muito tempo num lugar (um descanso)
  // rola um d20, e 17 a 20 é um encontro: um d12 diz quem. Eles chegam de uns 30 pés, pelo lado que o mapa
  // deixar, e sempre à vista de quem estiver acordado.
  const TABELA_VAGANDO = [
    [3, 'stirge', '2d4', 'stirges'], [5, 'ghoul', '1d4', 'ghouls'], [6, 'grick', '1d4', 'gricks'], [8, 'bugbear', '1d4', 'bugbears'],
    [9, 'esqueleto', '1d6', 'esqueletos'], [10, 'zumbi', '1d6', 'zumbis'], [12, 'gelatinaOcre', '1', 'uma gosma ocre'],
  ];
  async function monstroVagando() {
    const dado = (n) => 1 + Math.floor(enc.rng() * n);
    if (dado(20) < 17) return false;
    const r = dado(12);
    const [, tipo, qtd, nome] = TABELA_VAGANDO.find(([ate]) => r <= ate);
    const [n, faces] = qtd.includes('d') ? qtd.split('d').map(Number) : [Number(qtd), 1];
    let quantos = 0;
    for (let i = 0; i < n; i += 1) quantos += faces > 1 ? dado(faces) : 1;
    const centro = herois()[0].pos;
    // Só onde o grupo ALCANÇA (portas no estado de agora: a IA não abre porta) e onde a pegada cabe.
    const alc = enc.field.reachable(centro, 100000, () => false);
    const grande = tipo === 'gelatinaOcre';
    const cabe = (x, y) => (grande ? [[0, 0], [1, 0], [0, 1], [1, 1]] : [[0, 0]]).every(([dx, dy]) => (
      enc.field.inside(x + dx, y + dy) && !enc.field.blocksMove(x + dx, y + dy) && alc.has(`${x + dx},${y + dy}`) && !enc.occupied(x + dx, y + dy)));
    const volta = [];
    for (let k = 0; k < 600 && volta.length < quantos; k += 1) {
      const x = centro.x + Math.round((enc.rng() - 0.5) * 16);
      const y = centro.y + Math.round((enc.rng() - 0.5) * 16);
      if (Math.abs(x - centro.x) + Math.abs(y - centro.y) < 5 || areaDe({ x, y }) === null) continue;
      if (volta.some((v) => Math.abs(v.x - x) < 2 && Math.abs(v.y - y) < 2)) continue;
      if (!cabe(x, y) || (grande && enc.field.paredeNaPegada?.(x, y, 2))) continue;
      volta.push({ x, y });
    }
    if (!volta.length) return false;
    const bando = volta.map((p, i) => nasce(tipo, p, volta.length > 1 ? letras[i] : null));
    estado.vagando = bando;
    await painel(TEXTOS.vagando(nome));
    luta(bando);
    return true;
  }

  // ------------------------------------------------------ a aproximação ----
  // O POLVO PUXA PARA A ÁGUA (o Obelisco, W16): quem ele agarra vai para a água funda colada nele. Quem COMEÇA o
  // turno na água funda faz Força CD 10 para ficar à tona; falhou, afunda (`submerso`). Fora da água funda, a
  // condição sai. Debaixo d'água corre o fôlego do SRD (`conditions.js gastarFolego`): só pesa em quem fica preso lá
  // embaixo por muitas rodadas, e quem tem a Respirar na Água não se afoga.
  function aguaDoPolvo(ev) {
    const aguas = enc.field.aguas ?? new Set();
    // O puxão se confere no começo de cada lado, e não no evento do golpe: o motor avisa o ataque ANTES de aplicar o
    // `onHit`, então no evento o alvo ainda não está contido (foi assim que a primeira versão nunca puxou ninguém).
    if (ev.type !== 'sideStart') return;
    for (const alvo of enc.combatants) {
      if (alvo.dead || !alvo.pos || aguas.has(`${alvo.pos.x},${alvo.pos.y}`)) continue;
      const agarrao = (alvo.conditions ?? []).find((k) => k.id === 'contido' && k.data?.escape != null);
      const dono = agarrao && enc.combatants.find((m) => m.id === agarrao.source && m.defId === 'polvoGigante' && !m.dead);
      if (!dono) continue;
      const p = dono.pos;
      const perto = [];
      for (let dy = -1; dy <= 2; dy++) for (let dx = -1; dx <= 2; dx++) {
        const q = { x: p.x + dx, y: p.y + dy };
        if (aguas.has(`${q.x},${q.y}`) && !enc.occupied(q.x, q.y)) perto.push(q);
      }
      perto.sort((a, b) => distanceFt(a, alvo.pos) - distanceFt(b, alvo.pos));
      if (!perto[0]) continue;
      alvo.pos = { ...alvo.pos, x: perto[0].x, y: perto[0].y };
      enc.say('condicao', `O polvo arrasta ${alvo.name} da beirada para dentro da água.`);
    }
    {
      for (const c of enc.allOf(ev.side)) {
        if (c.dead || !c.pos) continue;
        const naAgua = aguas.has(`${c.pos.x},${c.pos.y}`);
        if (!naAgua) { if (hasCondition(c, 'submerso')) removeCondition(c, 'submerso'); recuperarFolego(c); continue; }
        // Quem já está debaixo d'água gasta o fôlego (o Sufocamento do SRD): acabado o ar, aguenta algumas rodadas e cai.
        if (hasCondition(c, 'submerso') && c.hp > 0) {
          const f = gastarFolego(c);
          if (f === 'semAr') enc.say('condicao', `${c.name} soltou o último ar: debaixo d'água, sem fôlego.`);
          if (f === 'cai') {
            enc.say('dano', `${c.name} se afoga e perde os sentidos.`);
            c.tempHp = 0;
            enc.applyDamage(c, c.hp, null, null);
            continue;
          }
        }
        if (c.defId === 'polvoGigante' || c.speeds?.swimFt) continue;
        const r = salvaguarda(c, 'str', 10);
        if (r.passou) { if (hasCondition(c, 'submerso')) removeCondition(c, 'submerso'); recuperarFolego(c); enc.say('acao', `${c.name} se mantém à tona (Força ${r.total ?? ''}).`); }
        else if (!hasCondition(c, 'submerso')) { addCondition(c, 'submerso'); enc.say('condicao', `${c.name} afunda: está debaixo d'água.`); }
      }
    }
  }

  // O TEMPLO SOTERRADO (o Obelisco): uma rodada depois de as colunas cederem, quem ainda estiver na sala morre debaixo
  // da pedra, e a sala vira rocha. Explorando, a rodada é o grupo correndo para fora — todo herói sai para a casa livre
  // mais perto fora da sala; os monstros que estiverem lá ficam.
  function soterrarOTemplo({ fugir = false } = {}) {
    if (!salvo.temploDesabando || salvo.temploSoterrado) return;
    salvo.temploDesabando = false;
    salvo.temploSoterrado = true;
    const casas = ONDA_ECO.areas['19'] ?? [];
    const dentro = new Set(casas.map((q) => `${q.x},${q.y}`));
    if (fugir) {
      const fora = (ONDA_ECO.areas['18'] ?? []).concat(ONDA_ECO.areas['20'] ?? []).filter((q) => !enc.field.blocksMove(q.x, q.y));
      for (const h of herois().filter((x) => naArea(x.pos, '19'))) {
        const alvo = fora.slice().sort((a, b) => distanceFt(a, h.pos) - distanceFt(b, h.pos)).find((q) => !enc.occupied(q.x, q.y));
        if (alvo) h.pos = { ...h.pos, x: alvo.x, y: alvo.y };
      }
    }
    for (const x of enc.combatants.filter((y) => !y.dead && y.pos && dentro.has(`${y.pos.x},${y.pos.y}`))) {
      enc.say('acao', `${x.name} fica debaixo da pedra.`);
      enc.morrer?.(x, 'soterrado');
      if (!x.dead) { x.hp = 0; x.dead = true; }
    }
    const f = enc.field;
    for (const q of casas) { const i = q.y * f.w + q.x; f.tiles[i] = 1; f.surfaces[i] = SUPERFICIES.indexOf('rocha'); }
    f.versao = (f.versao ?? 0) + 1;
    void painel(TEXTOS.soterrado);
    app.refresh();
  }

  async function depoisDeMover(c) {
    if (!estado.explorando || !c) return;
    if (salvo.temploDesabando) { soterrarOTemplo({ fugir: true }); return; }
    c.movementLeftFt = MOVIMENTO;
    // Um movimento de 60 pés pode atravessar uma área e terminar fora dela: vale o caminho inteiro (da casa onde o
    // herói estava até onde parou), e não só o ponto final.
    const antes = (estado.ultima ??= {})[c.id];
    estado.ultima[c.id] = { x: c.pos.x, y: c.pos.y };
    let rota = [];
    if (antes && (antes.x !== c.pos.x || antes.y !== c.pos.y)) {
      const alc = enc.field.reachable(antes, 100000, () => false);
      rota = Battlefield.pathFrom(alc, { x: c.pos.x, y: c.pos.y }) ?? [];
    }
    const aqui = (id) => herois().some((h) => naArea(h.pos, id)) || rota.some((p) => areaDe(p) === id);
    // AS ONDAS ESTRONDOSAS: de tempos em tempos o estrondo chega pela pedra, mais forte para o nordeste.
    salvo.passos = (salvo.passos ?? 0) + 1;
    if (salvo.passos % 30 === 0) enc.say('acao', c.pos.x > 48 && c.pos.y < 30 ? TEXTOS.ondaPerto : TEXTOS.ondaLonge);
    rotaDoMovimento = rota;
    if (stirges.length && !salvo.stirges && aqui('3')) { await acordarStirges(); return; }
    if (mortosDaGuarita.length && !salvo.esqueletos && aqui('4')) { await acordarGuarita(); return; }
    if (aqui('8') && await fungosVioleta(c)) return;
    if (aqui('10') && await serpenteDoPoco(c)) return;
    if (aqui('16') && await polvoDaCaverna()) return;
    if (ghoulsSul.length && !salvo.ghoulsSul && aqui('6')) { await acordarGhoulsSul(); return; }
    if (ghoulsGrande.length && !salvo.ghoulsGrande && aqui('9')) { await acordarGhoulsGrande(); return; }
    if (bugbearsNorte.length && !salvo.bugbearsNorte && aqui('11')) { await acordarBugbearsNorte(); return; }
    if ((zumbis.length || caveira.length) && !salvo.zumbis && aqui('12')) { await acordarZumbis(); return; }
    if (salvo.caveiraVolta && salvo.caveiraRestos && aqui('12')) { await caveiraReacende(); return; }
    if (bugbearsFenda.length && !salvo.fenda && aqui('18')) { await acordarFenda(); return; }
    // A gosma ocre dos túneis segue o grupo e ataca quem fica sozinho.
    if (gosma.length && !salvo.gosma && aqui('2')) {
      const sozinho = herois().find((h) => naArea(h.pos, '2') && herois().every((o) => o === h || distanceFt(o.pos, h.pos) > 20));
      if (sozinho) { await acordarGosma(sozinho); return; }
    }
    if (mormesk && !salvo.mormeskVisto && aqui('14')) { await conversaDeMormesk(); return; }
    if (espectador && !salvo.espectadorVisto && aqui('15')) { await conversaDoEspectador(); return; }
    if (nezznar && !salvo.temploVisto && salvo.templo !== 'luta' && aqui('19')) { await conversaDeNezznar(); return; }
    // O TEXTO DE ENTRADA de cada área que não tem encontro: uma vez só.
    for (const a of Object.keys(TEXTOS.entrada)) {
      if (!salvo.vista?.[a] && aqui(a)) {
        (salvo.vista ??= {})[a] = true;
        if (a === '1') pista('Goblins de fora: um deles, de crânio comprido e listras verdes na pele, morreu no fosso da entrada da Caverna Onda Eco; os outros vieram, não acharam o que procuravam e foram embora.');
        await painel(TEXTOS.entrada[a]);
      }
    }
    if (!salvo.sonsDaOnda && (aqui('16') || aqui('17'))) {
      salvo.sonsDaOnda = true;
      await painel(TEXTOS.ondas);
    }
    await oJatoDagua();
  }

  /**
   * O JATO D'ÁGUA DA CAVERNA BARULHENTA (área 16). Os números são os do livro, sem a frase dele: a margem
   * de onde se olha está 4,5 m acima da água; de dois em dois minutos um jato sobe e bate na parede logo
   * abaixo dela, e enquanto isso a água sobe 3 m; um minuto depois ela volta aos 6 m de fundo de sempre.
   *
   * Era só texto de entrada. Dois minutos são vinte rodadas, e fora da luta o tempo se mede em PASSOS: a
   * conta usa a mesma régua do gás dos fungos — a distância andada dentro da área, não o número de cliques.
   * A cada 60 pés dentro da 16 o jato vem. Quem está na margem leva o susto e o encharque; a margem fica a
   * 4,5 m e a água sobe 3, então ela não cobre ninguém — o perigo é escorregar, e por isso o jato derruba
   * quem falhar numa salvaguarda de Destreza CD 10. É o que a planta comporta: o nível da água não é casa do
   * mapa, e inventar afogamento onde o livro só faz a água subir seria pior que não ter nada.
   */
  async function oJatoDagua() {
    const naMargem = herois().filter((h) => naArea(h.pos, '16'));
    if (!naMargem.length) { salvo.jato = null; return; }
    const pes = 5 * (rotaDoMovimento.filter((p) => areaDe(p) === '16').length || 1);
    const antes = salvo.jato ?? null;
    const depois = (antes ?? -60) + pes;
    salvo.jato = depois;
    if (antes !== null && Math.floor(depois / 60) - Math.floor(antes / 60) <= 0) return;
    const caidos = [];
    for (const h of naMargem) {
      const s = salvaguarda(h, 'dex', 10);
      if (!s.passou) { addCondition(h, 'caido'); caidos.push(h.name); }
    }
    await painel(TEXTOS.jatoDagua(caidos));
    app.refresh();
  }

  // ----------------------------------------------------------- fim da luta ----
  async function fimDoCombate(outcome) {
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      await narrar(root, { formato: 'tela', paginas: [{ titulo: 'Caverna Onda Eco', texto: [TEXTOS.derrota] }] });
      app.encerrarPartida();
      return;
    }
    const lutou = estado.lutando ?? [];
    const reforcos = estado.reforcos ?? [];
    const todos = [...new Set([...lutou, ...reforcos])];
    const dos = (lista) => lutou.some((f) => lista.includes(f));
    const total = (lista) => valeDoBando([...new Set([...lista, ...reforcos.filter((f) => f.dead), ...lutou.filter((f) => f.defId === 'doppelganger')])].filter((f) => f.dead || f.capturado));
    // A CAVEIRA EM CHAMAS QUE VOLTOU (o SRD: Reacender) — a luta é só com ela, e ela não vale XP de novo
    if (estado.caveiraDeVolta && lutou.includes(estado.caveiraDeVolta)) {
      const c = estado.caveiraDeVolta;
      estado.caveiraDeVolta = null;
      if (c.dead) salvo.caveiraRestos = { x: c.pos.x, y: c.pos.y };
      await painel(['O fogo verde da caveira se apaga de novo, e o crânio rola, fumegando, para o chão. Fica ali, inteiro.']);
      prepararExploracao();
      return;
    }
    // os restos da caveira ficam onde ela caiu: sem água benta, Dissipar Magia ou Remover Maldição, ela volta
    if (caveira.some((f) => f.dead && lutou.includes(f)) && !salvo.caveiraApagada) {
      const morta = caveira.find((f) => f.dead);
      salvo.caveiraRestos = { x: morta.pos.x, y: morta.pos.y };
    }
    if (estado.vagando && dos(estado.vagando)) {
      const xp = valeDoBando(estado.vagando);
      estado.vagando = null;
      await painel(TEXTOS.fimVagando);
      await darXpDaLuta(xp, 'Os que vagavam pela mina');
    } else if (mormesk && lutou.includes(mormesk)) {
      salvo.mormesk = 'morto';
      await painel(TEXTOS.fimMormesk);
      await darXpDaLuta(valeDoBando([mormesk]), 'Mormesk');
      app.refresh();
    } else if (espectador && lutou.includes(espectador)) {
      salvo.espectador = 'morto';
      await painel(TEXTOS.fimEspectador);
      await darXpDaLuta(valeDoBando([espectador]), 'O espectador');
    } else {
      // O templo vem primeiro: Vhalak está na lista da fenda e, se recuou, luta aqui; a luta é do templo.
      for (const b of [...BANDOS].sort((x, y) => (y.chave === 'templo') - (x.chave === 'templo'))) {
        if (!dos(b.lista)) continue;
        salvo[b.chave] = 'limpo';
        await painel(b.fim);
        if (b.chave === 'templo') await fimDoTemplo();
        if (b.chave === 'bugbearsNorte') await bolsaDoBugbearMaior();
        await darXpDaLuta(total(b.lista), b.xp);
        // os bugbears da fenda que vieram de reforço contam como limpos também
        if (b.chave === 'templo' && [...bugbearsFenda, ...vhalak].every((f) => f.dead)) salvo.fenda = 'limpo';
        break;
      }
    }
    prepararExploracao();
  }

  // O bugbear maior leva uma bolsa (o Obelisco): 15 pc, 13 pe (65 pp), duas gemas de 10 po e uma poção de cura.
  async function bolsaDoBugbearMaior() {
    const quem = herois()[0];
    if (!quem) return;
    guardar(quem, 'moedaDeCobre', 15); guardar(quem, 'moedaDePrata', 65); guardar(quem, 'gemaPequena', 2); guardar(quem, 'pocaoDeCura', 1);
    await painel(TEXTOS.bolsaDoBugbear);
  }

  // NEZZNAR VIVO, DE VOLTA A PHANDALIN: entregue a Sildar ou ao chefe da vila, o livro paga o dobro do XP dele. A menos que o
  // grupo guarde a cela, Halia Thornton o solta e o entrega aos Zhentarim (o que acontece depois é do mestre).
  async function entregarNezznar() {
    salvo.nezznarEntregue = true;
    // Se Nezznar foi morto depois de caído (um golpe letal no chão), não há o que entregar.
    if (nezznar?.dead) { salvo.nezznar = 'morto'; feitos.nezznarCapturado = false; return; }
    const escolha = await narrar(root, {
      formato: 'painel',
      paginas: [{ texto: TEXTOS.nezznarEntrega }],
      escolhas: [
        { rotulo: 'Passar a noite à porta da cela', valor: 'guarda', primaria: true },
        { rotulo: 'Deixar a cela fechada à chave e ir dormir', valor: 'cela' },
      ],
    });
    await darXpDaLuta(nezznar?.xp ?? 450, 'Nezznar entregue vivo (XP em dobro)');
    if (escolha === 'cela') {
      feitos.nezznarFugiu = true;
      pista('Nezznar sumiu da cela do salão do chefe da vila: a fechadura estava aberta, e Halia Thornton não sabe de nada.');
      await painel(TEXTOS.nezznarSolto);
    } else {
      pista('Nezznar espera na cela do salão do chefe da vila, sob guarda, até a Aliança dos Lordes escoltá-lo a Neverwinter.');
      await painel(TEXTOS.nezznarGuarda);
    }
  }

  // A QUEDA DE NEZZNAR: o que ele carregava, e o que a aventura fecha.
  async function fimDoTemplo() {
    const quem = herois()[0];
    if (quem) {
      guardar(quem, 'pocaoDeCura', 1);
      // Peça única: se o saque do corpo (`game/saque.js`) já a deu a alguém do grupo, vivo ou morto, não se entrega de novo.
      if (!grupoTem(enc.combatants.filter((x) => x.side === 'party'), 'cajadoAranha')) (quem.weapons ??= []).push('cajadoAranha');
      guardar(quem, 'chaveDoAranhaNegra', 1);
    }
    feitos.nezznarDerrotado = true;
    // PEGO VIVO (golpe não letal): o livro paga o DOBRO do XP dele se for entregue em Phandalin (`entregarNezznar`, na saída).
    if (nezznar?.capturado && !nezznar.dead) {
      salvo.nezznar = 'preso';
      feitos.nezznarCapturado = true;
      await painel(TEXTOS.nezznarPreso);
    }
    if (salvo.nundro === 'livre' && !salvo.nundroPago) { salvo.nundroPago = true; await darXpDaLuta(200, 'Nundro resgatado'); }
    pista('Nezznar, o Aranha Negra, caiu no templo de Dumathoin. A mina está livre, e Nundro está nos aposentos do sacerdote, trancado.');
    await painel(TEXTOS.despojosDeNezznar);
  }

  // ------------------------------------------------------ botão direito ----
  const COM_FOLHA = new Set((ONDA_ECO.folhas ?? []).flatMap(([a, b]) => [CHAVE_DE(a, b), CHAVE_DE(b, a)]));
  enc.field.folha = COM_FOLHA;

  // AS PORTAS TRANCADAS: cada uma tem a perícia e a CD do livro, e as duas folhas de uma porta larga abrem juntas.
  const TRANCADAS = [
    { id: 'alojNorteLeste', folhas: [[{ x: 31, y: 27 }, { x: 32, y: 27 }]], rotulo: 'Forçar a porta', pericia: 'atletismo', cd: 20, area: '11',
      texto: 'A trave que os bugbears puseram por dentro estala e a porta cede um palmo, depois inteira.' },
    { id: 'sacerdote', folhas: [[{ x: 15, y: 8 }, { x: 15, y: 9 }], [{ x: 16, y: 8 }, { x: 16, y: 9 }]], rotulo: 'Arrombar a fechadura', pericia: 'prestidigitacao', cd: 15,
      chave: 'chaveDoAranhaNegra', area: '20', texto: 'O ferro cede com um estalo seco, e as duas folhas se abrem para o quarto do sacerdote.' },
    { id: 'forjaNorte', folhas: [[{ x: 67, y: 34 }, { x: 67, y: 35 }], [{ x: 68, y: 34 }, { x: 68, y: 35 }]], rotulo: 'Forçar a porta', pericia: 'atletismo', cd: 15, area: '15',
      texto: 'As maçanetas semiderretidas se soltam na mão, e a porta queimada vem junto.' },
    { id: 'magos', folhas: [[{ x: 63, y: 51 }, { x: 64, y: 51 }], [{ x: 63, y: 52 }, { x: 64, y: 52 }]], rotulo: 'Forçar a porta', pericia: 'atletismo', cd: 15, area: '14',
      texto: 'A madeira rachada cede ao ombro, e dentro a poeira de séculos sobe de uma vez.' },
  ];
  for (const t of TRANCADAS) t.aberta = Boolean(salvo.portasAbertas?.[t.id]);
  const tranca = (a, b) => TRANCADAS.find((t) => !t.aberta && t.folhas.some(([u, v]) => (CHAVE_DE(u, v) === CHAVE_DE(a, b)) || (CHAVE_DE(u, v) === CHAVE_DE(b, a))));
  const abrirTranca = (t) => {
    t.aberta = true;
    (salvo.portasAbertas ??= {})[t.id] = true;
    for (const [u, v] of t.folhas) enc.field.porAresta(u.x, u.y, v.x, v.y, ARESTA.aberta);
    enc.field.versao = (enc.field.versao ?? 0) + 1;
  };
  // Ao reabrir a cena num jogo salvo, a porta já arrombada continua aberta.
  for (const t of TRANCADAS) if (t.aberta) for (const [u, v] of t.folhas) enc.field.porAresta(u.x, u.y, v.x, v.y, ARESTA.aberta);

  function portasDaCasa(tile) {
    const f = enc.field;
    const out = [];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = { x: tile.x + dx, y: tile.y + dy };
      if (!f.inside(n.x, n.y)) continue;
      const cod = f.aresta(tile.x, tile.y, n.x, n.y);
      if (cod !== ARESTA.porta && cod !== ARESTA.aberta) continue;
      if (!COM_FOLHA.has(CHAVE_DE(tile, n))) continue;
      out.push({ a: tile, b: n, cod });
    }
    return out;
  }

  const OBJ_EM = new Map((ONDA_ECO.props ?? []).map((p) => [`${p.x},${p.y}`, p.variante]));

  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    // OS RESTOS DA CAVEIRA: água benta, Dissipar Magia ou Remover Maldição apagam a chama para sempre (o SRD)
    const restos = salvo.caveiraRestos;
    if (restos && tile.x === restos.x && tile.y === restos.y && !salvo.caveiraApagada) {
      const perto = distanceFt(c.pos, tile) > 5 ? 'longe demais — chegue a 5 pés' : null;
      const apagar = (texto) => async () => {
        salvo.caveiraApagada = true;
        salvo.caveiraRestos = null;
        salvo.caveiraVolta = false;
        await painel([texto]);
        app.refresh();
      };
      const agua = garantirInventario(c).bag.find((i) => i.id === 'aguaBenta' && (i.qtd ?? 1) > 0);
      ops.push({ rotulo: 'Aspergir água benta no crânio', icone: 'acao-usarObjeto', motivo: perto ?? (agua ? null : `${c.name} não tem água benta`), fazer: async () => {
        agua.qtd = (agua.qtd ?? 1) - 1;
        if (agua.qtd <= 0) garantirInventario(c).bag.splice(garantirInventario(c).bag.indexOf(agua), 1);
        await apagar(`${c.name} derrama a água benta sobre o crânio. Ele chia como ferro em brasa na água, solta uma fumaça verde, e racha ao meio. Não vai arder de novo.`)();
      } });
      for (const id of ['dissiparMagia', 'removerMaldicao']) {
        const sc = c.spellcasting;
        const tem = sc && [...(sc.prepared ?? []), ...(sc.known ?? [])].includes(id);
        if (!tem) continue;
        const espaco = (sc.slots ?? []).findIndex((n, i) => i >= 3 && n > 0);
        ops.push({ rotulo: `${id === 'dissiparMagia' ? 'Dissipar Magia' : 'Remover Maldição'} no crânio`, icone: 'acao-usarObjeto', motivo: perto ?? (espaco < 0 ? 'sem espaço de 3º círculo' : null), fazer: async () => {
          sc.slots[espaco] -= 1;
          await apagar(`${c.name} desfaz a magia que prende a chama ao osso. O crânio esfria na mão, cinza e leve. É só um crânio agora.`)();
        } });
      }
    }
    const longe = (pes) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
    const alcance = () => (distanceFt(c.pos, tile) > 5 ? 'longe demais — chegue a 5 pés'
      : (enc.field.contato(c.pos, tile) ? null : 'tem uma parede no meio'));

    // As PORTAS: abrir e fechar de graça, menos as trancadas (cada uma tem o seu jeito, vindo do livro).
    for (const { a: ca, b: cb, cod } of portasDaCasa(tile)) {
      const t = tranca(ca, cb);
      if (t) {
        const preciso = t.pericia === 'prestidigitacao' ? 'Destreza (ferramentas de ladrão)' : SKILL_NAME[t.pericia];
        ops.push({
          rotulo: t.rotulo, icone: 'acao-empurrar', detalhe: `${preciso} CD ${t.cd}`,
          motivo: longe(5) ?? (t.pericia === 'prestidigitacao' ? semFerramentas(c) : null) ?? buscas.ja(c, `porta-${t.id}`, ca),
          fazer: async () => {
            buscas.marcar(c, `porta-${t.id}`, ca);
            const r = teste(c, t.pericia, t.cd);
            if (!r.passou) { await painel(TEXTOS.portaResiste, { teste: r }); return; }
            abrirTranca(t);
            await painel(t.texto, { teste: r });
            // Mexer na tranca da porta do sacerdote faz barulho: o templo ouve, e o Nezznar manda os bugbears verem.
            if (t.id === 'sacerdote' && !salvo.aranhasAvisadas) {
              salvo.aranhasAvisadas = true;
              await painel(TEXTOS.portaAvisa);
            }
            app.refresh();
          },
        });
        if (t.chave && tem(t.chave)) {
          ops.push({
            rotulo: 'Abrir com a chave de Nezznar', icone: 'acao-usarObjeto', detalhe: 'a chave de ponta em bigorna',
            motivo: longe(5),
            fazer: async () => { abrirTranca(t); await painel(TEXTOS.chaveAbre); app.refresh(); },
          });
        }
        ops.push({
          rotulo: 'Escutar à porta', icone: 'acao-procurar', detalhe: 'Percepção CD 10',
          motivo: longe(5) ?? buscas.ja(c, `escuta-${t.id}`, ca),
          fazer: async () => {
            buscas.marcar(c, `escuta-${t.id}`, ca);
            const r = teste(c, 'percepcao', 10);
            await painel(r.passou ? (TEXTOS.escuta[t.id] ?? TEXTOS.escutaNada) : TEXTOS.escutaNada, { teste: r });
          },
        });
        continue;
      }
      const fechada = cod === ARESTA.porta;
      // ESCUTAR VALE EM TODA PORTA FECHADA, e não só nas quatro trancadas. O livro pede isso em duas áreas
      // pelo nome — a 6 ("escuta na porta com Percepção") e a 11 ("Escutar CD 10 em qualquer porta") —, e
      // aqui só as trancadas o ofereciam, porque o laço delas sai com `continue` antes de chegar nesta
      // parte. Quem está do outro lado sai do mapa: os bandos já têm posição desde o começo da cena, mesmo
      // antes de entrarem no tabuleiro, então a conta diz a verdade e não um palpite.
      if (fechada) {
        // o lado de LÁ é o mais longe de quem escuta
        const ladoDeLa = distanceFt(c.pos, ca) >= distanceFt(c.pos, cb) ? ca : cb;
        ops.push({
          rotulo: 'Escutar à porta', icone: 'acao-procurar', detalhe: 'Percepção CD 10',
          motivo: longe(5) ?? buscas.ja(c, 'escutaPorta', ca),
          fazer: async () => {
            buscas.marcar(c, 'escutaPorta', ca);
            const r = teste(c, 'percepcao', 10);
            if (!r.passou) { await painel(TEXTOS.escutaNada, { teste: r }); return; }
            const area = AREA_DE.get(`${ladoDeLa.x},${ladoDeLa.y}`);
            const quem = enc.combatants.filter((o) => !o.dead && o.hp > 0 && o.side === 'foes' && o.pos
              && AREA_DE.get(`${o.pos.x},${o.pos.y}`) === area);
            await painel(TEXTOS.escutaPorta(quem.length), { teste: r });
          },
        });
      }
      ops.push({
        rotulo: fechada ? 'Abrir a porta' : 'Fechar a porta',
        icone: fechada ? 'acao-usarObjeto' : 'acao-empurrar',
        detalhe: fechada ? 'de graça' : 'corta a visão',
        motivo: longe(5) ?? (enc.combatants.some((o) => !o.dead && o.pos && o !== c && !fechada
          && ((o.pos.x === ca.x && o.pos.y === ca.y) || (o.pos.x === cb.x && o.pos.y === cb.y)))
          ? 'tem alguém na passagem' : null),
        fazer: async () => {
          enc.field.porAresta(ca.x, ca.y, cb.x, cb.y, fechada ? ARESTA.aberta : ARESTA.porta);
          enc.say('acao', fechada ? `${c.name} empurra a porta de pedra, que cede.` : `${c.name} fecha a porta de pedra com o ombro.`);
          app.refresh();
        },
      });
    }

    // EXAMINAR toda peça (texto nosso), e as ações das peças do livro.
    if (sup === 'prop' || sup === 'propBaixo') {
      const v = OBJ_EM.get(`${tile.x},${tile.y}`);
      // O TEXTO É DA PEÇA, MAS A MESMA PEÇA PODE SER OUTRA COISA EM OUTRO LUGAR: a mesma arte de ossos é
      // "ossos de anão numa armadura" no corredor e é o afogado do lago na praia de conchas, com as flechas
      // de orc entre as costelas que o livro descreve. Por isso o Examinar aceita um texto por ÁREA,
      // `variante@area`, e cai no texto comum quando não há.
      const texto = v && (EXAMES[`${v}@${areaDe(tile)}`] ?? EXAMES[v]);
      if (texto) ops.push({ rotulo: 'Examinar', icone: 'acao-procurar', motivo: alcance(), fazer: () => painel(texto) });
      ops.push(...interacoesDePeca(v, tile, c, { alcance, longe }));
    }
    // Braseiros e fogueira não são peças (têm glifo próprio), mas têm o que examinar.
    if (['braseiro', 'braseiroFrio', 'fogueira'].includes(sup) && EXAMES[sup]) {
      ops.push({ rotulo: 'Examinar', icone: 'acao-procurar', motivo: alcance(), fazer: () => painel(EXAMES[sup]) });
    }
    ops.push(...interacoesDeLugar(tile, sup, c, { alcance, longe }));
    return ops;
  }

  // ------------------------------------------------ os achados do livro ----
  const unica = (chave, c, tile) => buscas.ja(c, chave, tile);

  function interacoesDePeca(v, tile, c, { alcance }) {
    const ops = [];
    const lin = (rotulo, pericia, cd, chave, fazer, extra = {}) => ops.push({
      rotulo, icone: 'acao-procurar', detalhe: `${SKILL_NAME[pericia] ?? pericia} CD ${cd}`,
      motivo: alcance() ?? unica(chave, c, tile) ?? extra.motivo ?? null,
      fazer: async () => { buscas.marcar(c, chave, tile); const r = teste(c, pericia, cd); await fazer(r); },
    });
    if (v === 'anaoMorto' && naArea(tile, '1') && !salvo.tharden) {
      ops.push({
        rotulo: 'Revistar o corpo', icone: 'acao-procurar', detalhe: 'Tharden Buscapedra', motivo: alcance(),
        fazer: async () => {
          salvo.tharden = true;
          guardar(c, 'mantoDeProtecao', 1);
          pista('Tharden Buscapedra morreu na entrada da Caverna Onda Eco, e o Aranha Negra não o revistou.');
          await painel(TEXTOS.tharden);
          app.refresh();
        },
      });
    }
    if (v === 'cofreDeFerro' && naArea(tile, '5') && !salvo.cofreAvaliadores) {
      lin('Forçar o cofre', 'prestidigitacao', 20, 'cofreAvaliadores', async (r) => {
        if (!r.passou) { await painel(TEXTOS.cofreResiste, { teste: r }); return; }
        salvo.cofreAvaliadores = true;
        guardar(c, 'moedaDeCobre', 600); guardar(c, 'moedaDePrata', 180 + 450); guardar(c, 'moedaDeOuro', 60);
        await painel(TEXTOS.cofreAvaliadores, { teste: r });
        app.refresh();
      }, { motivo: semFerramentas(c) });
    }
    if (v === 'estatuaDumathoin') {
      lin('Reconhecer a estátua', 'religiao', 10, 'estatuaReligiao', async (r) => {
        // o que a lore conta de Dumathoin (`rules/lore.js`), até o total tirado: quem passa folgado lembra mais
        await painel(r.passou ? [TEXTOS.estatuaReconhece, ...fatosAte(LORE['deus:dumathoin'], r.total, { ate: 3 }).map((f) => f.texto)] : TEXTOS.estatuaNada, { teste: r });
      });
      lin('Examinar os olhos de perto', 'investigacao', 12, 'estatuaOlhos', async (r) => {
        await painel(r.passou ? TEXTOS.estatuaVidro : TEXTOS.estatuaNada, { teste: r });
      });
      if ((salvo.olhosArrancados ?? 0) < 2) {
        ops.push({
          rotulo: 'Subir e arrancar um olho', icone: 'acao-saltar', detalhe: 'Atletismo CD 10', motivo: alcance() ?? unica('estatuaSobe', c, tile),
          fazer: async () => {
            buscas.marcar(c, 'estatuaSobe', tile);
            const r = teste(c, 'atletismo', 10);
            if (!r.passou) { await painel(TEXTOS.estatuaEscorrega, { teste: r }); return; }
            salvo.olhosArrancados = (salvo.olhosArrancados ?? 0) + 1;
            // O OBELISCO: QUALQUER olho arrancado pede Destreza CD 12 de quem arrancou; falhou, os seis pilares
            // cedem (a Mina só derrubava no segundo olho). O teto cai em cada criatura da sala — Destreza CD 15,
            // 2d10 de pedra, metade no sucesso — e quem ainda estiver lá uma rodada depois é soterrado.
            const firme = salvaguarda(c, 'dex', 12);
            if (firme.passou) { await painel(TEXTOS.primeiroOlho, { teste: r }); return; }
            await painel(TEXTOS.segundoOlho, { teste: r });
            const naSala = enc.combatants.filter((x) => !x.dead && x.pos && naArea(x.pos, '19'));
            for (const h of naSala) {
              const s = salvaguarda(h, 'dex', 15);
              const dano = damageRoll(enc.rng, '2d10').total;
              const sofre = s.passou ? Math.floor(dano / 2) : dano;
              enc.applyDamage(h, sofre, 'concussão', null, {});
              enc.say('acao', `${h.name} ${s.passou ? 'se joga de lado a tempo' : 'é pego pelo desabamento'}: ${sofre} de pedra.`);
            }
            salvo.temploDesabando = true;
            enc.say('aviso', 'O templo está vindo abaixo: quem ainda estiver na sala no próximo passo (ou na próxima rodada) fica soterrado.');
            app.refresh();
          },
        });
      }
    }
    if (v === 'mesaDeGuerra' && naArea(tile, '19')) {
      if (!salvo.sacoNezznar) {
        ops.push({
          rotulo: 'Abrir o saco de couro preto', icone: 'acao-usarObjeto', detalhe: 'o saque de Nezznar',
          motivo: alcance() ?? (nezznar && salvo.templo !== 'limpo' ? 'ele está olhando' : null),
          fazer: async () => {
            salvo.sacoNezznar = true;
            guardar(c, 'moedaDePrata', 950); guardar(c, 'moedaDeOuro', 130); guardar(c, 'moedaDePlatina', 15);
            guardar(c, 'gemaPequena', 9); guardar(c, 'canecaDeEletro', 1);
            await painel(TEXTOS.sacoNezznar);
            app.refresh();
          },
        });
      }
      lin('Ler as notas e os mapas', 'investigacao', 10, 'notasNezznar', async (r) => {
        if (r.passou) pista('Nezznar vem explorando a Caverna Onda Eco palmo a palmo atrás da Forja das Magias, e é a fúria dos mortos-vivos que o segura.');
        await painel(r.passou ? TEXTOS.notasNezznar : TEXTOS.estatuaNada, { teste: r });
      });
    }
    if (v === 'braseiroVerde') {
      lin('Estudar o braseiro', 'arcanismo', 15, 'braseiroArcanismo', async (r) => {
        if (r.passou) pista('O braseiro da Forja das Magias é a fonte da magia que ainda corre pela caverna. Banhada nas chamas por um minuto, uma arma ou armadura comum vira +1 por algumas horas.');
        await painel(r.passou ? TEXTOS.braseiroRevela : TEXTOS.braseiroNada, { teste: r });
      });
      ops.push({
        rotulo: 'Banhar a arma nas chamas', icone: 'acao-usarObjeto', detalhe: 'um minuto: +1 por 1d12 horas',
        motivo: alcance() ?? (salvo.braseiroUsou?.[c.id] ? `${c.name} já se banhou aqui` : null),
        fazer: async () => {
          (salvo.braseiroUsou ??= {})[c.id] = true;
          const horas = 1 + Math.floor(enc.rng() * 12);
          addCondition(c, 'armaMagica', { rounds: horas * 600 });
          await painel(TEXTOS.braseiroBanho(c.name, horas));
          app.refresh();
        },
      });
    }
    if (v === 'bancadaRunas' && naArea(tile, '15') && !salvo.itensForja) {
      ops.push({
        rotulo: 'Pegar a maça e o peitoral', icone: 'acao-usarObjeto', detalhe: 'Criadora da Luz e Proteção Dragão',
        motivo: alcance(),
        fazer: async () => {
          if (espectador && !['dispensado', 'morto'].includes(salvo.espectador)) {
            // Mexer no que a forja guarda é a única coisa que o espectador não perdoa.
            salvo.espectador = 'luta';
            entrarNeutro(espectador);
            await painel(TEXTOS.espectadorAtaca);
            luta([espectador]);
            return;
          }
          salvo.itensForja = true;
          (c.weapons ??= []).push('lightbringer');
          garantirInventario(c).bag.push({ id: 'dragonguard', tipo: 'armadura', qtd: 1 });
          feitos.temLightbringer = true;
          await painel(TEXTOS.itensForja);
          app.refresh();
        },
      });
    }
    if (v === 'estante' && naArea(tile, '14') && !salvo.mapaMormesk) {
      const livre = ['pago', 'morto'].includes(salvo.mormesk) || !mormesk;
      if (!livre) {
        ops.push({ rotulo: 'Procurar o mapa nos tomos', icone: 'acao-procurar', motivo: alcance() ?? 'Mormesk vigia os livros', fazer: () => painel(TEXTOS.mormeskVigia) });
      } else lin('Procurar o mapa nos tomos', 'investigacao', 12, 'tomosMormesk', async (r) => {
        if (!r.passou) { await painel(TEXTOS.tomosNada, { teste: r }); return; }
        salvo.mapaMormesk = true;
        guardar(c, 'mapaDeMormesk', 1);
        pista('Num dos tomos dos aposentos dos magos, um mapa costurado na capa mostra onde fica uma masmorra feita por Mormesk.');
        await painel(TEXTOS.mapaMormesk, { teste: r });
        app.refresh();
      });
    }
    return ops;
  }

  function interacoesDeLugar(tile, sup, c, { alcance, longe }) {
    const ops = [];
    // AS GRAVURAS DA VELHA ENTRADA (área 3). O livro as põe nas paredes — "relevos de anões e gnomos com a
    // picareta no ombro" —, e parede não é casa: não dá para pôr peça nelas. Então é um verbo do LUGAR, como
    // os entalhes do Castelo: quem está encostado na rocha dentro da área 3 pode olhar o que está lavrado
    // nela. Uma vez por herói, e não dá nada além do que conta — é ambientação, e o livro não pede teste.
    if (naArea(tile, '3') && ['mina', 'lajeMina'].includes(sup)) {
      const naRocha = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        .some(([dx, dy]) => enc.field.inside(tile.x + dx, tile.y + dy)
          && enc.field.surfaceAt(tile.x + dx, tile.y + dy) === 'rocha');
      if (naRocha) {
        ops.push({
          rotulo: 'Olhar as gravuras da parede', icone: 'acao-procurar',
          motivo: alcance() ?? buscas.ja(c, 'gravuras', tile),
          fazer: async () => { buscas.marcar(c, 'gravuras', tile); await painel(TEXTOS.gravurasDaEntrada); },
        });
      }
    }
    // O baú de ferro dos aposentos dos magos (área 14): o tesouro de Mormesk.
    if (sup === 'bau' && naArea(tile, '14') && !salvo.bauMago) {
      const livre = ['pago', 'morto'].includes(salvo.mormesk);
      ops.push({
        rotulo: 'Abrir o baú', icone: 'acao-usarObjeto', detalhe: 'o tesouro de Mormesk',
        motivo: alcance() ?? (livre ? null : (mormesk && salvo.mormeskVisto ? 'Mormesk o guarda' : null)),
        fazer: async () => {
          salvo.bauMago = true;
          guardar(c, 'moedaDeCobre', 1100); guardar(c, 'moedaDePrata', 160 + 500); guardar(c, 'malaquita', 5);
          if (salvo.mormesk !== 'pago') guardar(c, 'cachimboDePlatina', 1);
          await painel(salvo.mormesk === 'pago' ? TEXTOS.bauMagoPago : TEXTOS.bauMago);
          app.refresh();
        },
      });
    }
    // O PAREDÃO da grande caverna (área 9): 3 m de elevação, que se sobe pela escada ou escalando (Atletismo CD 12). Quem falha por
    // 5 ou mais cai: 1d6 de pedra e fica caído, ao pé do paredão.
    const aqui = enc.field.heightAt(c.pos.x, c.pos.y);
    const la = enc.field.heightAt(tile.x, tile.y);
    if (naArea(tile, '9') && la - aqui >= 2 && distanceFt(c.pos, tile) <= 5 && !enc.field.blocksMove(tile.x, tile.y)) {
      ops.push({
        rotulo: 'Escalar o paredão', icone: 'acao-saltar', detalhe: 'Atletismo CD 12',
        motivo: enc.occupied(tile.x, tile.y, c) ? 'tem alguém lá em cima' : buscas.ja(c, 'escalar', tile),
        fazer: async () => {
          buscas.marcar(c, 'escalar', tile);
          const r = teste(c, 'atletismo', 12);
          if (r.passou) {
            c.pos = { ...c.pos, x: tile.x, y: tile.y };
            enc.say('acao', `${c.name} escala o paredão de pedra.`);
            app.refresh();
            await depoisDeMover(c);
            return;
          }
          if (r.total <= 12 - 5) {
            const dano = damageRoll(enc.rng, '1d6').total;
            enc.applyDamage(c, dano, 'concussão', null, {});
            addCondition(c, 'caido');
            await painel(TEXTOS.paredaoCai(c.name, dano), { teste: r });
          } else {
            await painel(TEXTOS.paredaoNaoSobe, { teste: r });
          }
          app.refresh();
        },
      });
    }
    // O lago escuro (área 10): o mago afogado no fundo.
    if (sup === 'aguaEscura' && naArea(tile, '10') && !salvo.lago) {
      ops.push({
        rotulo: 'Mergulhar e explorar o fundo', icone: 'acao-procurar', detalhe: 'Atletismo CD 10',
        motivo: longe(10) ?? buscas.ja(c, 'lago', tile),
        fazer: async () => {
          buscas.marcar(c, 'lago', tile);
          const r = teste(c, 'atletismo', 10);
          if (!r.passou) { await painel(TEXTOS.lagoFalha, { teste: r }); return; }
          salvo.lago = true;
          guardar(c, 'anelDePlatinaDoMago', 3);
          guardar(c, 'varinhaDeMisseisMagicos', 1);
          await painel(TEXTOS.lagoAcha, { teste: r });
          app.refresh();
        },
      });
    }
    // O FOSSO (área 1) E A FENDA (18) SE ATRAVESSAM, e com o teste do livro. Os dois eram buraco e nada
    // mais: `fosso` barra o passo, e não havia verbo nenhum para descer. O livro dá a mesma regra aos
    // dois e só troca os números — Atletismo CD 15 e 3 m no fosso da entrada, CD 10 e 6 m na fenda da
    // caverna desmoronada —, com a mesma falha nos dois: errar por 5 ou mais é cair, 1d6 de concussão
    // por 3 m de queda, e caído no chão ao chegar.
    //
    // O fundo não é casa do mapa (o buraco é uma casa só, que barra o passo), então quem passa sai do OUTRO
    // LADO: desce, atravessa o fundo e sobe. Quem cai fica no próprio lado, caído, com o dano da altura. É a
    // tradução honesta do que a planta comporta, e o texto diz isso.
    if (sup === 'fosso' && (naArea(tile, '1') || naArea(tile, '18')) && distanceFt(c.pos, tile) <= 5) {
      const daEntrada = naArea(tile, '1');
      const cd = daEntrada ? 15 : 10;
      const metros = daEntrada ? 3 : 6;
      const onde = daEntrada ? 'fosso' : 'fenda';
      // o outro lado: a casa livre seguindo a mesma direção, pulando o buraco inteiro
      const dx = Math.sign(tile.x - c.pos.x);
      const dy = Math.sign(tile.y - c.pos.y);
      let alvo2 = null;
      for (let k = 1; k <= 8 && !alvo2; k += 1) {
        const q = { x: tile.x + dx * k, y: tile.y + dy * k };
        if (!enc.field.inside(q.x, q.y)) break;
        if (enc.field.surfaceAt(q.x, q.y) === 'fosso') continue;
        if (!enc.field.blocksMove(q.x, q.y) && !enc.occupied(q.x, q.y, c)) alvo2 = q;
        else break;
      }
      if (alvo2) {
        ops.push({
          rotulo: `Descer pel${daEntrada ? 'o fosso' : 'a fenda'}`, icone: 'acao-saltar',
          detalhe: `Atletismo CD ${cd} · ${metros} m`,
          motivo: buscas.ja(c, 'fosso', tile),
          fazer: async () => {
            buscas.marcar(c, 'fosso', tile);
            const r = teste(c, 'atletismo', cd);
            if (r.passou) {
              c.pos = { ...c.pos, x: alvo2.x, y: alvo2.y };
              await painel(TEXTOS.fossoAtravessa(c.name, onde), { teste: r });
              app.refresh();
              await depoisDeMover(c);
              return;
            }
            if (r.total <= cd - 5) {
              // 1d6 por 3 metros: um dado no fosso da entrada, dois na fenda
              const dados = `${Math.round(metros / 3)}d6`;
              const dano = damageRoll(enc.rng, dados).total;
              enc.applyDamage(c, dano, 'concussão', null, {});
              addCondition(c, 'caido');
              await painel(TEXTOS.fossoCai(c.name, dano, onde), { teste: r });
            } else {
              await painel(TEXTOS.fossoDesiste(onde), { teste: r });
            }
            app.refresh();
          },
        });
      }
    }
    // A fenda (área 18): as manoplas da anã soterrada, no fundo.
    if (sup === 'fosso' && naArea(tile, '18') && !salvo.manoplas) {
      ops.push({
        rotulo: 'Descer e vasculhar os escombros', icone: 'acao-procurar', detalhe: 'Percepção CD 20, uma vez por hora',
        motivo: longe(15) ?? buscas.ja(c, 'manoplas', tile),
        fazer: async () => {
          buscas.marcar(c, 'manoplas', tile);
          const r = teste(c, 'percepcao', 20);
          if (!r.passou) { await painel(TEXTOS.fendaFalha, { teste: r }); return; }
          salvo.manoplas = true;
          guardar(c, 'manoplasDeForcaDeOgro', 1);
          await painel(TEXTOS.fendaAcha, { teste: r });
          app.refresh();
        },
      });
    }
    // A BARRICADA DO DEPÓSITO (área 7). O livro diz duas coisas sobre esta sala, e a segunda é a que
    // faltava: que nenhum monstro entra aqui, e que a porta dela é a única da mina ainda inteira, boa o
    // bastante para se travar por dentro com o que houver à mão. O refúgio já existia (só aqui se dorme),
    // mas o verbo não: o grupo descansava de porta aberta. Barricar é de graça e vale enquanto ninguém a
    // desfizer — são os barris rachados encostados na parede.
    if (naArea(tile, '7') && naArea(c.pos, '7')) {
      // a porta DO depósito: basta um lado dentro dele. A caixa da área 7 pega os dois lados da própria
      // porta (48,56)-(48,57), então exigir que ela cruzasse a fronteira não achava porta nenhuma.
      const portas7 = (ONDA_ECO.folhas ?? []).filter(([a2, b2]) => naArea(a2, '7') || naArea(b2, '7'));
      if (portas7.length) {
        ops.push({
          rotulo: salvo.barricada ? 'Tirar a barricada da porta' : 'Barricar a porta com os barris',
          icone: 'acao-empurrar', detalhe: salvo.barricada ? 'libera a passagem' : 'de graça, pelo lado de dentro',
          fazer: async () => {
            salvo.barricada = !salvo.barricada;
            for (const [a2, b2] of portas7) {
              enc.field.porAresta(a2.x, a2.y, b2.x, b2.y, salvo.barricada ? ARESTA.parede : ARESTA.porta);
            }
            await painel(salvo.barricada ? TEXTOS.barricadaPoe : TEXTOS.barricadaTira);
            app.refresh();
          },
        });
      }
    }
    // A saída: de volta à trilha. Depois de Nezznar, o fim da aventura.
    if ((ONDA_ECO.saida ?? []).some((e) => e.x === tile.x && e.y === tile.y)) {
      ops.push({
        rotulo: 'Voltar à trilha', icone: 'acao-disparada', detalhe: 'o mapa da região', motivo: longe(10),
        fazer: async () => {
          if (salvo.nezznar === 'preso' && !salvo.nezznarEntregue) await entregarNezznar();
          if (feitos.nezznarDerrotado && !salvo.fimContado) {
            salvo.fimContado = true;
            // O fecho do livro e quem saiu da mina. Marca a aventura como concluída: a região
            // segue aberta, mas o jogo sabe que a Mina Perdida foi achada.
            camp.aventuraConcluida = true;
            const grupoFinal = enc.combatants.filter((x) => x.side === 'party');
            await narrar(root, { formato: 'tela', paginas: paginasDoEpilogo({
              conclusao: TEXTOS.conclusao({ capturado: Boolean(feitos.nezznarCapturado), fugiu: Boolean(feitos.nezznarFugiu),
                gundren: Boolean(feitos.gundrenResgatado), nundro: Boolean(feitos.nundroResgatado) }),
              grupo: grupoFinal }) });
          }
          estado.encerrado = true;
          app.irParaRegiao(enc.combatants.filter((x) => x.side === 'party' && !x.dead), 'ondaEco');
        },
      });
    }
    return ops;
  }

  return {
    lugar: 'Caverna Onda Eco',
    // as portas desta cena têm roteiro próprio (teste, dono, barulho): a porta genérica (`game/portas.js`) fica de fora
    portasProprias: true,
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    depoisDeMover,
    fimDoCombate,
    // Na luta, a rodada do desabamento passa quando a vez volta ao grupo; e o polvo da caverna trovejante puxa para a
    // água quem ele agarra (`aguaDoPolvo`).
    evento: (ev) => {
      if (ev.type === 'sideStart' && ev.side === 'party' && salvo.temploDesabando) soterrarOTemplo();
      aguaDoPolvo(ev);
    },
    dialogoDe: (npc) => (estado.lutando ? null : arvoreDe(npc)),
    depoisDaConversa: resolver,
    // Só o depósito (7) e os aposentos do sacerdote, depois de Nezznar, são lugar de dormir: "nenhum monstro vem aqui".
    // Descansar é gastar tempo no mesmo lugar: a mina cobra (monstros vagando).
    depoisDoDescanso: async () => {
      // O veneno do gás da Mina saiu com o gás (o Obelisco pôs fungos violeta no lugar). Este filtro fica para um
      // save de antes da troca, em que alguém ainda carrega o envenenado de 'gas': o descanso o leva embora.
      for (const h of herois()) h.conditions = (h.conditions ?? []).filter((k) => !(k.id === 'envenenado' && k.source === 'gas'));
      if (estado.explorando && !herois().every((h) => naArea(h.pos, '7'))) await monstroVagando();
      // A CAVEIRA REACENDE (SRD): uma hora depois de destruída, se ninguém tratou os restos
      if (salvo.caveiraRestos && !salvo.caveiraApagada) salvo.caveiraVolta = true;
      if (estado.explorando && salvo.caveiraVolta && herois().some((h) => naArea(h.pos, '12'))) await caveiraReacende();
    },
    motivoSemDescanso: (tipo) => {
      if (!estado.explorando) return 'só fora da luta';
      if (tipo !== 'longo') return null;
      const seguro = herois().every((h) => naArea(h.pos, '7') || (salvo.templo === 'limpo' && naArea(h.pos, '20')));
      return seguro ? null : 'a mina está cheia de monstros: só o depósito desmoronado é seguro para dormir';
    },
    textoDoDescanso: () => ['Um descanso encostado numa parede de pedra lavrada, com o som das ondas ao longe.'],
    async iniciar() {
      prepararExploracao();
      await painel(TEXTOS.chegada);
      // quem sai e volta à mina deixou passar mais de uma hora: a caveira não tratada já reacendeu
      if (salvo.caveiraRestos && !salvo.caveiraApagada) salvo.caveiraVolta = true;
      // Grupo abaixo do 5º nível: o livro avisa que a mina é para quem já passou por muita coisa.
      if (!salvo.avisoDeNivel && herois().reduce((s, h) => s + h.level, 0) / Math.max(1, herois().length) < 4.5) {
        salvo.avisoDeNivel = true;
        await painel(TEXTOS.avisoDeNivel);
      }
      // Nundro está preso nos aposentos do sacerdote (área 20): neutro, inconsciente, visível só pela porta aberta.
      if (!enc.combatants.includes(nundro)) { nundro.side = 'neutro'; nundro.facingVec = { dx: 0, dy: 1 }; enc.addCombatant(nundro); }
      // Quem o grupo já encontrou e deixou para trás (a conversa acabou em "sair" ou em acordo) volta ao seu lugar:
      // sem isso, ao sair e voltar não haveria mais como falar com eles, e a aventura não fecharia.
      if (mormesk && salvo.mormeskVisto && salvo.mormesk !== 'luta') entrarNeutro(mormesk, { dx: 0, dy: 1 });
      if (espectador && salvo.espectadorVisto && salvo.espectador !== 'luta') entrarNeutro(espectador, { dx: -1, dy: 0 });
      if (nezznar && salvo.temploVisto && salvo.templo !== 'luta') { entrarNeutro(nezznar, { dx: 1, dy: 0 }); posicionarRefem(); }
      app.refresh();
    },
  };
}
