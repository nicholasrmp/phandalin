// A ENCRUZILHADA DA FORCA (o Obelisco, capítulo 6): o velho entreposto do Subterrâneo onde duergar, svirfneblin e drow
// negociavam desconfiados, até os devoradores de mente arrasarem os três povos. Hoje só há monstros, e o terceiro
// fragmento do obelisco, preso num cofre drow atrás de uma torre mágica tombada. O mapa está em
// `game/encruzilhada-mapa.js` (gerado por `src/dev/mapa-encruzilhada.py`), o Qunbraxel em `rules/monsters/encruzilhada.js`.
//
// O QUE É DO LIVRO (as regras; o texto é nosso), sala a sala:
//   G1  a entrada: o túnel da superfície desce mais de um quilômetro e meio; a porta oeste tem um X vermelho (a saída
//       segura, que o grupo pode entender ao contrário).
//   G3  quatro ashenwights ferais, presos à oficina onde trabalharam vivos: atacam e lutam até ser destruídos. A gaiola
//       montada vale 200 po.
//   G4  a mochila rasgada: ferramentas de cartógrafo, seis frascos de óleo, um livro sobre enroladores, uma esmeralda de
//       250 po e uma lanterna da revelação.
//   G5/G6 a Vakketar, diaba acorrentada, presa à prisão: vem ver o barulho, conversa só para contar o grupo e achar
//       fraquezas, e quer pôr todo mundo nas gaiolas. Só sai da sala por um minuto de cada vez.
//   G8  o grick alfa enrolado numa estalactite: Percepção CD 15 o nota (e ele ataca quando notado). A primeira vez que é
//       ferido, guincha e chama os seis gricks de G9. Quem entra ouve ecos de um mercado antigo.
//   G10 os dois enroladores, entre as pedras, famintos. Quando um morre, o outro recua para logo dentro da porta de G12,
//       atrás da proteção da sala. Cada um engoliu quatro ametistas de 30 po, que o xorn de G14 quer.
//   G11 a passagem para Talhundereth: a fenda norte dá em T1; vinda de G10, a porta está barrada (Destreza com
//       ferramentas de ladrão CD 15 para tirar a barra pelo outro lado, ou Força/Atletismo CD 21 para quebrá-la).
//   G12 a sala embaçada: ataque contra quem está dentro tem desvantagem, salvo percepção às cegas ou visão verdadeira.
//   G14 a Torre Lamacenta tombada, encravada na pedra e imune a tudo; o xorn Zoklork e dois elementais da terra. O
//       Zoklork troca as ametistas (ou a morte dos enroladores) pela palavra de comando. Sem ele, as lousas de G20 a dão.
//       Encolhida a torre (a palavra, ou cascalho de criatura petrificada), abre-se o caminho de G23 ao cofre; se o
//       Qunbraxel ainda vive, ele e os grimlocks se mudam para lá.
//   G16 quatro chuuls na água; a porta secreta do sul (Percepção CD 15) dá na escada que sobe a G20.
//   G19 o armário que os drow empurraram na frente da porta do santuário: é preciso tirá-lo para abrir a porta.
//   G20 o yochlol Zuluthl, de férias, que ataca intrusos com violência. As lousas da mesa, em dez minutos de leitura,
//       dão a palavra da torre. As moedas-aranha da teia (80 po) e o pergaminho de Liberdade de Movimento no altar.
//   G21 cinco grimlocks e dois basiliscos (os grimlocks são cegos: o olhar não os pega). As estátuas quebradas são
//       viajantes petrificados, e o cascalho delas encolhe a torre.
//   G22 o mofo marrom (região do mapa): Constituição CD 12 contra 4d10 de frio. O frio o mata; o fogo o faz crescer.
//   G23/G24 dois grimlocks martelando a torre; o Qunbraxel e quatro grimlocks na sala da guarda, atrás das seteiras. Na
//       luta, ele insulta por telepatia. O mapa a carvão mostra Illithinoch e o ritual.
//   G25 o cofre: o fragmento, os ossos dos três ladrões e o tesouro. Expulso o grupo antes de pegar o fragmento, o
//       Qunbraxel (ou outro servo) o leva na hora.
//
//   OS MARCOS (`obelisco6-marcos.js`): o Qunbraxel é o guardião do fragmento daqui.

import { narrar } from '../view/narrativa.js';
import { distanceFt, GLIFOS, SUPERFICIES, ARESTA } from '../core/grid.js';
import { rolarPericia, skillBonus } from '../rules/abilities.js';
import { rolarTeste } from '../rules/utilidade.js';
import { makeMonster } from '../rules/monsters.js';
import { garantirInventario } from '../rules/equipment.js';
import { guardar } from './comercio.js';
import { ctxDe } from './magias-fora.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { alternarRegiao } from '../rules/regioes.js';
import { PONTOS_ENCRUZILHADA as P } from './encruzilhada-mapa.js';
import { guardiaoVencido } from './obelisco6-marcos.js';

const MOVIMENTO = 60;
const TITULO = 'A Encruzilhada da Forca';

/** O elenco: chave, bloco, onde, nome, sala, e se começa escondido (fora do tabuleiro). */
const ELENCO = [
  ...P.ashenwights.map((p, i) => [`ashenwight${i + 1}`, 'ashenwightFeral', p, null, 'G3', false]),
  ['vakketar', 'diaboAcorrentado', P.vakketar, 'Vakketar', 'G6', false],
  ['grickAlfa', 'grickAlfa', P.grickAlfa, null, 'G8', true],
  ...P.gricks.map((p, i) => [`grick${i + 1}`, 'grick', p, null, 'G9', true]),
  ...P.enroladores.map((p, i) => [`enrolador${i + 1}`, 'enrolador', p, null, 'G10', true]),
  ['zoklork', 'xorn', P.zoklork, 'Zoklork', 'G14', false],
  ...P.elementais.map((p, i) => [`elemental${i + 1}`, 'elementalDaTerra', p, null, 'G14', false]),
  ...P.chuuls.map((p, i) => [`chuul${i + 1}`, 'chuul', p, null, 'G16', false]),
  ['zuluthl', 'yochlol', P.zuluthl, 'Zuluthl', 'G20', false],
  ...P.grimlocksDoSalao.map((p, i) => [`grimlockDoSalao${i + 1}`, 'grimlock', p, null, 'G21', false]),
  ...P.basiliscos.map((p, i) => [`basilisco${i + 1}`, 'basilisco', p, null, 'G21', false]),
  ...P.grimlocksDaTorre.map((p, i) => [`grimlockDaTorre${i + 1}`, 'grimlock', p, null, 'G23', false]),
  ['qunbraxel', 'qunbraxel', P.qunbraxel, null, 'G24', false],
  ...P.grimlocksDaGuarda.map((p, i) => [`grimlockDaGuarda${i + 1}`, 'grimlock', p, null, 'G24', false]),
];

/** O que o Qunbraxel diz na cabeça de cada um, por telepatia, enquanto luta (o sentido do livro; as palavras são nossas). */
const INSULTOS = [
  'Vocês chegaram tarde. Phandalin já está escolhida — os pequenos que vocês amam lá vão acordar com outra cabeça, se acordarem.',
  'Há poder no Reino Distante para quem tem coragem de pedir. Vocês não têm. Por isso vão ficar pequenos para sempre.',
  'Os escolhidos preparam o ritual enquanto vocês tagarelam aqui embaixo. Cada pedaço da pedra o deixa mais forte.',
  'Já têm pedaços? Ótimo. Eu junto os meus aos dos goblins, e os seus, quando estiverem mortos.',
];

export const salaNaEncruzilhada = (p) => {
  for (const [id, cs] of Object.entries(P.salas)) if (cs.some((c) => c.x === p.x && c.y === p.y)) return id;
  return null;
};

export function criarEncruzilhada(app, config = {}) {
  const enc = app.enc;
  const root = app.root;
  const camp = (app.campanha ??= {});
  const o6 = (camp.obelisco6 ??= { feito: {}, lutas: {} });
  o6.feito ??= {};
  o6.fragmentos ??= {};
  const t = (o6.encruzilhada ??= { feito: {}, mortos: [] });
  t.feito ??= {};
  t.mortos ??= [];
  const vila = (camp.vila ??= { pistas: [], missoes: {} });
  const estado = { explorando: false, encerrado: false, lutando: null };
  const todos = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead);
  const herois = () => todos().filter((c) => c.hp > 0);
  const painel = (texto, escolhas) => narrar(root, { formato: 'painel', paginas: [{ titulo: TITULO, texto: [].concat(texto) }], ...(escolhas ? { escolhas } : {}) });
  const pista = (txt) => { if (!(vila.pistas ??= []).includes(txt)) vila.pistas.push(txt); };
  const longe = (c, tile, pes = 5) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
  const salaDe = salaNaEncruzilhada;
  const casasDa = (...salas) => new Set(salas.flatMap((s) => (P.salas[s] ?? []).map((c) => `${c.x},${c.y}`)));
  const melhor = (pericia) => herois().reduce((a, b) => (skillBonus(b, pericia) > skillBonus(a, pericia) ? b : a));
  const teste = (quem, pericia, cd, opts = {}) => {
    const x = ctxDe(app, enc);
    return rolarTeste(x.estado, x.herois(), enc.rng, quem, pericia, cd, opts);
  };
  const tem = (id) => herois().map((h) => ({ h, i: garantirInventario(h).bag.find((x) => x.id === id && (x.qtd ?? 1) > 0) })).find((x) => x.i);
  const tirarDaBolsa = (h, id, qtd = 1) => {
    const bag = garantirInventario(h).bag;
    const i = bag.find((x) => x.id === id);
    if (!i) return;
    i.qtd = (i.qtd ?? 1) - qtd;
    if (i.qtd <= 0) bag.splice(bag.indexOf(i), 1);
  };

  // ------------------------------------------------------------- o elenco ----
  const elenco = {};
  for (const [chave, id, pos, nome, sala, escondido] of ELENCO) {
    if (t.mortos.includes(chave)) continue;
    const m = makeMonster(id, { ...pos });
    if (nome) m.name = nome;
    m.chaveDaEncruzilhada = chave;
    m.salaDaEncruzilhada = sala;
    m.escondido = escondido;
    m.side = 'neutro';
    elenco[chave] = m;
  }
  // a Vakketar está presa à prisão: só sai por um minuto de cada vez, o que numa luta é o mostruário e o corredor
  if (elenco.vakketar) elenco.vakketar.casasPermitidas = casasDa('G6', 'G5', 'corredor');
  // o Qunbraxel atira pelas seteiras e não sai da sala da guarda (os grimlocks é que vão à frente)
  if (elenco.qunbraxel) elenco.qunbraxel.casasPermitidas = casasDa('G24');
  // os ashenwights estão presos à oficina onde trabalharam vivos; os chuuls vigiam a câmara alagada e não saem dela
  for (const m of Object.values(elenco)) {
    if (m.salaDaEncruzilhada === 'G3') m.casasPermitidas = casasDa('G3');
    if (m.salaDaEncruzilhada === 'G16') m.casasPermitidas = casasDa('G16');
  }
  // para onde cada um olha quando o grupo chega: os ashenwights para a forja, os grimlocks da torre para a torre, o
  // Zoklork e os elementais uns para os outros, junto da torre
  const OLHAR = { G3: { dx: 0, dy: -1 }, G23: { dx: 0, dy: -1 }, G14: { dx: 1, dy: 0 }, G24: { dx: 0, dy: -1 } };
  // O QUNBRAXEL NO COFRE: encolhida a torre com ele vivo, ele e os grimlocks se mudaram para G25
  if (t.feito.qunbraxelNoCofre) {
    const no = (m, p) => { if (m) { m.pos = { ...m.pos, ...p }; m.salaDaEncruzilhada = 'G25'; m.casasPermitidas = null; } };
    no(elenco.qunbraxel, P.qunbraxelNoCofre);
    ['grimlockDaTorre1', 'grimlockDaTorre2', 'grimlockDaGuarda1', 'grimlockDaGuarda2', 'grimlockDaGuarda3', 'grimlockDaGuarda4']
      .forEach((k, i) => no(elenco[k], P.grimlocksNoCofre[i]));
  }
  const vivos = (...chaves) => chaves.map((k) => elenco[k]).filter((m) => m && !m.dead);
  const daSala = (...salas) => Object.values(elenco).filter((m) => salas.includes(m.salaDaEncruzilhada) && !m.dead);
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
   * A luta. `surpresa`: 'nossa', 'deles' ou null. `reforcos`: (rodada) => { units, aviso } | null — quem entra depois.
   */
  function luta(quem, { surpresa = null, reforcos = null, furtividade = null } = {}) {
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
      : surpresa === 'deles' ? { emboscadores: 'foes', furtividade: furtividade ?? [99] } : null;
    enc.reinforcements = reforcos ? (rodada) => {
      const r = reforcos(rodada);
      if (!r?.units?.length) return null;
      for (const f of r.units) { f.side = 'foes'; f.escondido = false; tirar(f); }
      estado.lutando = [...estado.lutando, ...r.units];
      return r;
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
  function abrirSecreta(nome) {
    const s = P.secretas[nome];
    for (const par of [s, ...(s.tambem ?? [])]) enc.field.porAresta(par.a.x, par.a.y, par.b.x, par.b.y, ARESTA.aberta);
    (t.secretas ??= []).includes(nome) || t.secretas.push(nome);
    app.refresh?.();
  }

  /** A TORRE ENCOLHE (a palavra ou o cascalho): o corredor de G23 se abre até o cofre, e a caverna de G14 fica livre. */
  function encolherTorre() {
    for (const c of P.torreCorredor) mudarCasa(c.x, c.y, 'L');
    for (const c of P.torreCaverna) mudarCasa(c.x, c.y, '_');
    sobre('semTorre', true);
  }
  /** O ARMÁRIO de G19, arrastado: a porta do santuário aparece. */
  function tirarArmario() {
    for (const c of P.armarioCasas) mudarCasa(c.x, c.y, 'L');
    sobre('armario', false);
  }

  function sair(fazer) {
    estado.explorando = false;
    estado.encerrado = true;
    root.classList.remove('explorando');
    // O FRAGMENTO EM RISCO (o livro): o grupo saiu sem ele, e o Qunbraxel (ou outro servo) o leva na hora
    if (t.feito.viuFragmento && !o6.fragmentos.encruzilhada && vivos('qunbraxel').length) t.feito.fragmentoLevado = true;
    fazer(todos());
  }

  // ------------------------------------------------------------- as salas ----
  /** G1: a primeira vista. */
  async function entrada() {
    if (t.feito.viuG1 || !herois().some((h) => salaDe(h.pos) === 'G1')) return false;
    t.feito.viuG1 = true;
    await painel([
      'O túnel termina numa sala de pedra trabalhada, com escória e entulho até a metade da parede do fundo, que desabou faz tempo. Três portas: uma dupla ao sul, uma a leste e uma a oeste.',
      'Na porta oeste, alguém pintou um X vermelho do tamanho de um homem.',
    ]);
    return false;
  }

  /** G3: os quatro ashenwights, martelando metal que não existe. */
  async function oficina() {
    const bando = daSala('G3');
    if (!bando.length || t.feito.lutaG3 || !herois().some((h) => salaDe(h.pos) === 'G3')) return false;
    t.feito.lutaG3 = true;
    await painel([
      'Uma oficina cheia de prensas e tornos. Diante da forja apagada, quatro figuras cinzentas, magras como gravetos, batem martelos no ar, num ferro que não está lá.',
      'O barulho para. As quatro cabeças se viram ao mesmo tempo, e os martelos de nada sobem.',
    ]);
    return luta(bando);
  }

  /** G5/G6: a Vakketar vem ver o barulho. */
  async function vakketar() {
    const v = vivos('vakketar')[0];
    if (!v || t.feito.lutaG6 || !herois().some((h) => ['G5', 'G6'].includes(salaDe(h.pos)))) return false;
    t.feito.lutaG6 = true;
    v.pos = { ...v.pos, ...(enc.casaLivreMaisProxima(P.vakketar) ?? v.pos) };
    neutro(v, { dx: 0, dy: -1 });
    const r = await painel([
      'Correntes se arrastam no escuro da prisão. Uma mulher de pele vermelha sai das gaiolas, enrolada em correntes frouxas que se mexem como cobras quando ela não se mexe.',
      '— Visitas — diz ela, contando vocês com o dedo, devagar. — Quantos... e quem é o mais lento? Os ferreiros diziam que a gente aprende muito sobre uma gaiola vendo alguém dentro dela.',
    ], [
      { rotulo: 'Perguntar quem ela é', valor: 'falar', primaria: true },
      { rotulo: 'Atacar', valor: 'atacar' },
    ]);
    if (r === 'falar') {
      const quem = melhor('intuicao');
      const viu = teste(quem, 'intuicao', 12);
      await painel([
        '— Vakketar. Os ferreiros me chamaram, os ferreiros me prenderam aqui, e os ferreiros... — ela franze a testa, como quem procura uma palavra que caiu no chão. — Faz tempo? Faz tempo. As coisas de cabeça mole passaram por aqui e me deixaram por morta.',
        viu.passou
          ? `${quem.name} (Intuição ${viu.total}) vê os olhos dela pararem em cada joelho, em cada fivela de armadura, em quem respira mais rápido. Ela não está conversando: está escolhendo.`
          : `${quem.name} (Intuição ${viu.total}) não consegue ler nada naquele sorriso.`,
        '— Chega de conversa. As gaiolas estão com fome de gente.',
      ]);
    }
    return luta([v]);
  }

  /** G8: o grick alfa na estalactite. */
  async function cruzamento() {
    if (!herois().some((h) => salaDe(h.pos) === 'G8')) return false;
    if (!t.feito.ecosG8) {
      t.feito.ecosG8 = true;
      await painel([
        'Uma caverna alta, de abóbada cheia de estalactites, com o chão alisado por séculos de carroça. Passagens largas saem para todos os lados.',
        'Por um instante, ela se enche de vozes: um anão pechinchando, um gnomo rindo, alguém contando moedas em élfico. As vozes somem antes de virar a cabeça.',
      ]);
    }
    const a = vivos('grickAlfa')[0];
    const a0 = a;
    if (!a || t.feito.lutaG8) return false;
    if (!herois().some((h) => distanceFt(h.pos, a.pos) <= 30)) return false;
    t.feito.lutaG8 = true;
    // quem nota é quem vai à frente: o herói mais perto da estalactite (o livro: Percepção CD 15). Quatro testes
    // seguidos deixavam a emboscada em 4% das lutas.
    const frente = herois().reduce((x, y) => (distanceFt(y.pos, a0.pos) < distanceFt(x.pos, a0.pos) ? y : x));
    const r0 = teste(frente, 'percepcao', 15);
    const notou = r0.passou ? { h: frente, r: r0 } : null;
    await painel(notou
      ? `${notou.h.name} (Percepção ${notou.r.total}) vê uma das estalactites se desenrolar: um corpo de verme do tamanho de um cavalo, com um bico no meio de quatro tentáculos. Notado, ele não espera — desce pela parede.`
      : 'Uma das estalactites se solta e cai em cima de vocês: um corpo de verme do tamanho de um cavalo, todo bico e tentáculos.');
    // a primeira vez que ele é ferido, guincha e chama os seis de G9
    const chamados = vivos('grick1', 'grick2', 'grick3', 'grick4', 'grick5', 'grick6');
    return luta([a], {
      surpresa: notou ? null : 'deles',
      reforcos: () => {
        if (t.feito.alfaGuinchou || a.dead || a.hp >= a.maxHp) return null;
        t.feito.alfaGuinchou = true;
        const units = chamados.filter((g) => !g.dead);
        if (!units.length) return null;
        t.feito.lutaG9 = true;
        return { units, aviso: 'O grick alfa guincha, um som de pedra raspando em pedra. Da mina a oeste, alguma coisa responde — muitas coisas.' };
      },
    });
  }

  /** G9: os seis gricks nos ninhos. */
  async function mina() {
    const bando = daSala('G9');
    if (!bando.length || t.feito.lutaG9 || !herois().some((h) => salaDe(h.pos) === 'G9')) return false;
    t.feito.lutaG9 = true;
    await painel('Ninhos de muco nas frestas da mina esgotada. O muco se mexe: seis vermes de bico saem dele, se desenrolando, cheirando o ar.');
    return luta(bando);
  }

  /** G10: os dois enroladores entre as pedras. */
  async function tunelDesabado() {
    const bando = daSala('G10');
    if (!bando.length || t.feito.lutaG10 || !herois().some((h) => salaDe(h.pos) === 'G10')) return false;
    t.feito.lutaG10 = true;
    // a falsa aparência: os enroladores parecem pedra. A Furtividade deles contra a Percepção passiva de cada um.
    // o motor decide herói a herói: quem nota QUALQUER um deles não é surpreendido (vale a menor Furtividade)
    const furt = bando.map((m) => rolarPericia(enc.rng, m, 'furtividade').total);
    const esconde = Math.min(...furt);
    const viu = herois().find((h) => (h.senses?.passivePerception ?? 10 + skillBonus(h, 'percepcao')) >= esconde);
    await painel(viu
      ? `${viu.name} repara que duas das pedras do desabamento têm uma textura de couro molhado, e que uma delas acaba de abrir um olho.`
      : 'Duas das pedras do desabamento abrem um olho cada uma, e cordões grossos e pegajosos voam delas para vocês.');
    return luta(bando, { surpresa: 'deles', furtividade: furt });
  }

  /** G14: o Zoklork, os dois elementais e a torre. */
  async function torreTombada() {
    if (!herois().some((h) => salaDe(h.pos) === 'G14')) return false;
    const z = vivos('zoklork')[0];
    if (!t.feito.viuTorre) {
      t.feito.viuTorre = true;
      await painel([
        'No lado leste da caverna, uma torre baixa de pedra escura está tombada, atravessada na parede como se tivesse caído do céu e entrado na rocha. Nós de lama brotam da superfície dela e afundam de novo, sem pressa.',
        ...(z ? ['Junto da base, um bicho de pedra de três braços e três olhos conversa com dois montes de terra que andam, numa língua que soa como pedra rolando.'] : []),
      ]);
    }
    if (!z || t.feito.zoklorkFalou || t.feito.lutaG14) return false;
    if (!herois().some((h) => distanceFt(h.pos, z.pos) <= 20)) return false;
    return conversaComZoklork();
  }

  async function conversaComZoklork() {
    const z = vivos('zoklork')[0];
    if (!z) return false;
    t.feito.zoklorkFalou = true;
    const ametistas = tem('ametistaDoEnrolador');
    const enroladoresMortos = !vivos('enrolador1', 'enrolador2').length && t.feito.lutaG10;
    const r = await painel([
      'O bicho de pedra se vira para vocês, mastigando alguma coisa que range. Fala em gnomês, depois tenta subcomum, depois um comum cheio de pedregulho.',
      '— Zoklork. Vim com meu colega de pedra atrás das pedras roxas que os gnomos deixaram. O colega achou todas. Comeu todas. Não dividiu. Depois saiu, e as pedras-que-comem do túnel o comeram, com as roxas dentro. — Ele bate o punho na torre, e a lama treme. — Quero as roxas. Quero que as pedras-que-comem morram.',
    ], [
      ...(ametistas ? [{ rotulo: 'Dar as ametistas', valor: 'dar', primaria: true }] : []),
      ...(enroladoresMortos && !ametistas ? [{ rotulo: 'Contar que os enroladores morreram', valor: 'contar', primaria: true }] : []),
      { rotulo: 'Perguntar sobre a torre', valor: 'torre', primaria: !ametistas && !enroladoresMortos },
      { rotulo: 'Atacar o Zoklork', valor: 'atacar' },
    ]);
    if (r === 'atacar') { t.feito.lutaG14 = true; return luta(vivos('zoklork')); }
    if (r === 'dar') {
      const n = ametistas.i.qtd ?? 1;
      tirarDaBolsa(ametistas.h, 'ametistaDoEnrolador', n);
      t.feito.zoklorkPago = true;
    }
    if (r === 'dar' || r === 'contar') {
      t.feito.sabeAPalavra = true;
      await painel([
        r === 'dar' ? '— Roxas! — O Zoklork as come uma a uma, de olhos fechados.' : '— Mortas? As duas? — Ele ri, um som de cascalho. — Bom. Bom.',
        '— A torre é pedra do Plano da Terra. Foi acordada sem querer, faz pouco; não sei o que a acordou. Vocês querem que ela durma? Digam a palavra: "petrificação", na língua da pedra. — Ele a diz, devagar, duas vezes. — Eu não vou lá dentro com vocês. Lá perto tem coisa demais.',
      ]);
      pista('O Zoklork contou a palavra de comando da Torre Lamacenta, em G14: "petrificação", em terrano. Dita perto dela, a torre encolhe.');
      return false;
    }
    await painel('— A torre? É bonita. A lama dela anda. — O Zoklork encolhe os três ombros. — Quem sabe dela, eu conto, quando tiver minhas roxas.');
    t.feito.zoklorkFalou = false;   // pode-se voltar a ele
    t.feito.zoklorkPerguntado = true;
    return false;
  }

  /** G16: os quatro chuuls na água. */
  async function camaraAlagada() {
    const bando = daSala('G16');
    if (!bando.length || t.feito.lutaG16 || !herois().some((h) => salaDe(h.pos) === 'G16')) return false;
    t.feito.lutaG16 = true;
    await painel('A câmara está alagada até o joelho, com os restos de uma mesa de pedra logo acima da água. A água se mexe em quatro lugares ao mesmo tempo: carapaças, pinças, tentáculos na boca.');
    return luta(bando);
  }

  /** G20: o Zuluthl. */
  async function santuario() {
    const z = vivos('zuluthl')[0];
    if (!z || t.feito.lutaG20 || !herois().some((h) => salaDe(h.pos) === 'G20')) return false;
    t.feito.lutaG20 = true;
    await painel([
      'Moedas com pernas de aranha andam por uma teia que cobre o teto do santuário. Junto do altar de mármore, uma coisa que parece cera amarela derretida, com um olho só, se levanta do chão.',
      '— Eu estava de férias — diz ela, numa voz que vem de todos os lados.',
    ]);
    return luta([z]);
  }

  /** G21: os grimlocks e os basiliscos. */
  async function salaoTriestoroth() {
    const bando = daSala('G21');
    if (!bando.length || t.feito.lutaG21 || !herois().some((h) => salaDe(h.pos) === 'G21')) return false;
    t.feito.lutaG21 = true;
    await painel([
      'Degraus descem para uma sala de água rasa e ninhos fedidos em cima das mesas. Estátuas realistas demais estão encostadas nas paredes, todas de rosto quebrado.',
      'Cinco humanoides cinzentos e sem olhos levantam a cabeça ao mesmo tempo, farejando. Dois lagartos de oito patas descem de um ninho.',
    ]);
    // O OLHAR DO BASILISCO: as estátuas já dizem, e quem conhece o bicho diz o resto. Sem o aviso, o grupo era
    // petrificado (2,8 heróis por luta, medido) por não saber que pode desviar os olhos.
    const quem = melhor('natureza');
    const sabe = teste(quem, 'natureza', 12);
    enc.say('acao', sabe.passou
      ? `${quem.name} (Natureza ${sabe.total}): basiliscos! Quem olha nos olhos deles vira pedra, como aquelas estátuas. Dá para lutar de olhos desviados (Desviar os olhos, na barra).`
      : `${quem.name} (Natureza ${sabe.total}) não reconhece os lagartos. Mas as estátuas em volta têm todas a mesma cara de espanto.`);
    return luta(bando);
  }

  /** G23/G24: os grimlocks da torre e o Qunbraxel atrás das seteiras. */
  async function salaDaGuarda() {
    if (t.feito.qunbraxelNoCofre) return false;
    const q = vivos('qunbraxel')[0];
    const torre = vivos('grimlockDaTorre1', 'grimlockDaTorre2');
    const guarda = vivos('grimlockDaGuarda1', 'grimlockDaGuarda2', 'grimlockDaGuarda3', 'grimlockDaGuarda4');
    if ((!q && !torre.length && !guarda.length) || t.feito.lutaG24) return false;
    // A luta começa quando há luta: alguém vê o Qunbraxel pelas seteiras, chega a 9 m dos grimlocks que martelam a
    // torre, ou entra na sala da guarda. A boca sul do corredor fica a 8 casas dele, sem vista nenhuma.
    const na24 = herois().some((h) => salaDe(h.pos) === 'G24');
    const veQ = Boolean(q) && herois().some((h) => salaDe(h.pos) === 'G23' && distanceFt(h.pos, q.pos) <= 60 && enc.field.hasLineOfSight(h.pos, q.pos));
    const pertoDaTorre = torre.length > 0 && herois().some((h) => torre.some((g) => distanceFt(h.pos, g.pos) <= 30));
    const na23 = veQ || pertoDaTorre;
    if (!na23 && !na24) return false;
    t.feito.lutaG24 = true;
    await painel([
      na23 && torre.length
        ? 'No fim do corredor, a ponta da torre tombada tampa a passagem, e dois humanoides cegos a martelam com pedras, sem fazer marca. Param de bater e se viram para vocês.'
        : 'A sala da guarda: um trono de pedra na parede oeste e um mapa enorme a carvão na parede sul.',
      ...(q ? ['Pelas seteiras da parede, vocês veem uma cabeça de polvo de pele roxa se virar devagar. Uma voz entra direto na cabeça de cada um, sem passar pelos ouvidos.',
        `— ${INSULTOS[0]}`] : []),
    ]);
    let rodadaDoInsulto = 1;
    return luta([...(q ? [q] : []), ...(na23 ? torre : guarda)], {
      reforcos: (rodada) => {
        if (q && !q.dead && rodada > rodadaDoInsulto && rodada - 1 < INSULTOS.length) {
          rodadaDoInsulto = rodada;
          enc.say('condicao', `Qunbraxel, na cabeça de vocês: "${INSULTOS[rodada - 1]}"`);
        }
        if (rodada < 3) return null;
        const resto = (na23 ? guarda : torre).filter((g) => !g.dead && g.side !== 'foes');
        if (!resto.length) return null;
        if (na23) for (const g of resto) g.pos = { ...g.pos, ...(enc.casaLivreMaisProxima(P.portaDaGuarda) ?? g.pos) };
        return { units: resto, aviso: na23 ? 'A porta da sala da guarda se abre, e mais quatro grimlocks saem para o corredor.' : 'Do corredor da torre, mais dois grimlocks chegam, farejando.' };
      },
    });
  }

  /** G25: o cofre, e o Qunbraxel se ele se mudou para cá. */
  async function cofre() {
    if (!herois().some((h) => salaDe(h.pos) === 'G25')) return false;
    if (!t.feito.viuFragmento) {
      t.feito.viuFragmento = true;
      await painel([
        'O cofre drow: prateleiras de facas com cabo de pedra, montes de moedas, e no chão, junto de um monte de ossos limpos, um bloco de pedra negra do tamanho de um pão, com veios verdes que pulsam devagar.',
        'Os ossos são de três drow, ainda de botas, sentados em volta da pedra como quem espera alguém abrir a porta.',
      ]);
    }
    const q = vivos('qunbraxel')[0];
    if (!t.feito.qunbraxelNoCofre || t.feito.lutaG25 || !q) return false;
    t.feito.lutaG25 = true;
    await painel(['O Qunbraxel está ajoelhado junto do fragmento, com as mãos em cima dele sem tocar, e os grimlocks palitam os dentes com ossos de drow.', `— ${INSULTOS[3]}`]);
    return luta([q, ...daSala('G25').filter((m) => m !== q)]);
  }

  async function depoisDoPasso() {
    if (!estado.explorando) return;
    for (const f of [entrada, oficina, vakketar, cruzamento, mina, tunelDesabado, torreTombada, camaraAlagada, santuario, salaoTriestoroth, salaDaGuarda, cofre]) {
      if (await f()) return;
      if (!estado.explorando) return;
    }
  }

  // ------------------------------------------------------------- os eventos da luta ----
  function evento(ev) {
    // O ENROLADOR QUE SOBRA (o livro): quando um morre, o outro recua para logo dentro da porta de G12, onde a névoa
    // da sala o protege.
    if (ev.type === 'died' && ev.target?.chaveDaEncruzilhada?.startsWith('enrolador')) {
      const outro = vivos('enrolador1', 'enrolador2')[0];
      if (outro && !t.feito.enroladorRecuou) {
        t.feito.enroladorRecuou = true;
        outro.pos = { ...outro.pos, ...(enc.casaLivreMaisProxima(P.recuoDoEnrolador) ?? outro.pos) };
        enc.say('acao', 'O outro enrolador recolhe os cordões e se arrasta, rápido para uma pedra, para dentro da sala embaçada.');
        app.refresh?.();
      }
    }
    // O MOFO MARROM (o livro): o frio o mata na hora; o fogo perto dele o faz crescer na direção do fogo
    if (ev.type === 'spell' && !t.feito.mofoMorto) {
      const tipo = ev.spell?.damageType;
      const casas = [...(ev.areaTiles ?? []), ...(ev.target?.pos ? [ev.target.pos] : []), ...(ev.point ? [ev.point] : [])];
      const pertoDoMofo = casas.some((c) => P.mofo.some((m) => Math.max(Math.abs(m.x - c.x), Math.abs(m.y - c.y)) <= 1));
      if (pertoDoMofo && tipo === 'frio') {
        t.feito.mofoMorto = true;
        alternarRegiao(enc.field, 'mofoMarrom', false);
        enc.say('acao', 'O frio pega o mofo marrom, e a crosta racha e escurece como folha morta. O ar da sala volta a ser só frio.');
      } else if (pertoDoMofo && tipo === 'fogo') {
        const r = enc.field.regioes?.find((x) => x.id === 'mofoMarrom');
        if (r) {
          const mais = [...r.casas].flatMap((k) => { const [x, y] = k.split(',').map(Number); return [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => `${x + dx},${y + dy}`); })
            .filter((k) => { const [x, y] = k.split(',').map(Number); return salaDe({ x, y }) === 'G22' && !enc.field.blocksMove(x, y); });
          for (const k of mais) r.casas.add(k);
          enc.say('acao', 'O fogo chega perto do mofo marrom, e ele cresce na direção do calor, como uma mancha de tinta na água.');
        }
      }
    }
  }

  // ------------------------------------------------------------- o fim ----
  async function fimDoCombate(outcome) {
    const lutou = estado.lutando ?? [];
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      await narrar(root, { formato: 'tela', paginas: [{ titulo: TITULO, texto: ['A Encruzilhada guarda mais uns ossos, como guardou os dos três povos.'] }] });
      app.encerrarPartida();
      return;
    }
    for (const m of lutou) if ((m.dead || m.capturado) && m.chaveDaEncruzilhada && !t.mortos.includes(m.chaveDaEncruzilhada)) t.mortos.push(m.chaveDaEncruzilhada);
    const nomes = {
      G3: 'Os ashenwights da oficina', G6: 'A Vakketar', G8: 'O grick alfa', G9: 'Os gricks da mina', G10: 'Os enroladores',
      G14: 'O Zoklork e os elementais', G16: 'Os chuuls da câmara alagada', G20: 'O Zuluthl', G21: 'Os grimlocks e os basiliscos',
      G23: 'Os grimlocks e o Qunbraxel', G24: 'O Qunbraxel e a guarda dele', G25: 'O Qunbraxel e os grimlocks do cofre',
    };
    const salas = lutou.map((m) => m.salaDaEncruzilhada).filter(Boolean);
    const sala = salas.includes('G24') ? 'G24' : salas.includes('G25') ? 'G25' : salas[0];
    await darXpDe(lutou, nomes[sala] ?? 'A luta');
    const q = elenco.qunbraxel;
    if (q && lutou.includes(q) && q.dead) {
      await painel([
        'O Qunbraxel cai de joelhos, e os tentáculos do rosto se enrolam devagar. A voz ainda entra na cabeça de vocês, mais fraca:',
        '— Não para. O ritual não para com um de nós... e os escolhidos sabem os seus nomes. Sabem a cara de vocês.',
      ]);
      pista('O Qunbraxel morreu na Encruzilhada da Forca. Antes de morrer, disse que o ritual não para, e que os "escolhidos" conhecem o grupo.');
      // O QUE ELE SABIA (o livro lista): escorre para o grupo pela telepatia que ainda segurava
      await painel([
        'Por um instante a telepatia dele não se fecha, e pedaços do que ele sabia escorrem para a cabeça de vocês, sem ordem:',
        'os fanáticos do obelisco lhe prometeram um lugar entre os "escolhidos", e ele acreditou; não havia mais cérebro ancião a quem ele servisse;',
        'os Sawplee acharam os cacos do obelisco que estavam em Phandalin, e por isso os fanáticos o apressaram;',
        'o fragmento de Talhundereth é guardado por uma massa de cérebros; há outro na cripta debaixo do templo, e ele não sabia onde;',
        'e a torre tombada era só uma pedra para ele quebrar: ele nunca soube que era um objeto mágico.',
      ]);
      pista('O que o Qunbraxel sabia: os fanáticos o enganaram com a promessa de entrar entre os "escolhidos"; os Sawplee pegaram os cacos do obelisco de Phandalin; o fragmento de Talhundereth é guardado por um aglomerado encefálico, e há outro na cripta.');
      // o guardião do fragmento daqui: o marco do 8º (e o do 9º, se os outros dois já caíram)
      await guardiaoVencido(app, o6, 'encruzilhada', herois());
    }
    prepararExploracao();
  }

  // ------------------------------------------------------- as interações ----
  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    const aqui = (p) => p && tile.x === p.x && tile.y === p.y;
    const perto = (p, pes = 5) => p && distanceFt(tile, p) <= pes;

    // a saída: o túnel que sobe à superfície
    if (P.saida.some(aqui)) {
      ops.push({ rotulo: 'Subir à superfície', icone: 'acao-disparada', detalhe: 'mais de um quilômetro e meio de túnel', motivo: longe(c, tile), fazer: () => sair(async (v) => {
        const abrirRegiao = app.abrirRegiao ?? (await import('./regiao.js')).abrirRegiao;
        app.capitulo = null; app.enc = null; app.board = null; app.selected = null; app.mode = null;
        abrirRegiao(app, { grupo: v, onde: 'encruzilhada' });
      }) });
    }
    // G11: a fenda norte, para T1 de Talhundereth
    if (P.fendaDeTalhundereth.some(aqui)) {
      ops.push({ rotulo: 'Subir a fenda até Talhundereth', icone: 'acao-disparada', detalhe: 'um túnel baixo, de uma hora', motivo: longe(c, tile), fazer: () => sair((v) => {
        app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'talhundereth', chegada: 'encruzilhada', continuarCom: v });
      }) });
    }
    // G11: a barra da porta reforçada, do lado de dentro
    const barra = enc.field.trancas?.get(P.portaBarrada.aresta);
    if (barra && aqui(P.portaBarrada.deDentro)) {
      ops.push({ rotulo: 'Tirar a barra da porta', icone: 'acao-usarObjeto', detalhe: 'deste lado, sai com a mão', motivo: longe(c, tile), fazer: () => {
        enc.field.trancas.delete(P.portaBarrada.aresta);
        t.feito.barraTirada = true;
        enc.say('acao', `${c.name} levanta a barra de ferro dos encaixes e a encosta na parede. A porta pode abrir.`);
        app.refresh();
      } });
    }

    // G3: a gaiola montada
    if (perto(P.gaiolaMontada) && !t.feito.gaiola && !daSala('G3').length) {
      ops.push({ rotulo: 'Dobrar e levar a gaiola', icone: 'acao-usarObjeto', detalhe: 'um minuto · 25 kg', motivo: longe(c, P.gaiolaMontada), fazer: async () => {
        t.feito.gaiola = true;
        guardar(c, 'gaiolaDeEspinhos', 1);
        mudarCasa(P.gaiolaMontada.x, P.gaiolaMontada.y, 'L');
        await painel(`${c.name} acha onde apertar, e a gaiola se dobra sobre si mesma, espinho por espinho, até virar um cubo do tamanho de um baú. As dobradiças de mitral nem rangem.`);
        app.refresh();
      } });
    }
    // G4: a mochila rasgada
    if (aqui(P.mochila) && !t.feito.mochila) {
      ops.push({ rotulo: 'Abrir a mochila rasgada', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
        t.feito.mochila = true;
        guardar(c, 'ferramentasDeCartografo', 1);
        guardar(c, 'oleo', 6);
        guardar(c, 'livroDosEnroladores', 1);
        guardar(c, 'esmeralda', 1);
        guardar(c, 'lanternaReveladora', 1);
        await painel('Entre cinzas de fogueira, uma mochila rasgada: ferramentas de cartógrafo, seis frascos de óleo, um livro de desenhos de enroladores, uma esmeralda embrulhada num lenço e uma lanterna de latão com vidro de cor estranha.');
        pista('Na Encruzilhada, quem acampou no alojamento (G4) carregava um livro sobre enroladores. Enroladores parecem pedra e engolem o que não digerem.');
        app.refresh();
      } });
    }
    // G10: as ametistas na barriga dos enroladores mortos
    if (salaDe(tile) === 'G10' && t.feito.lutaG10 && !vivos('enrolador1', 'enrolador2').length && !t.feito.ametistas) {
      ops.push({ rotulo: 'Abrir a barriga dos enroladores', icone: 'acao-procurar', detalhe: 'Medicina ajuda, mas não é preciso', motivo: null, fazer: async () => {
        t.feito.ametistas = true;
        guardar(c, 'ametistaDoEnrolador', 8);
        await painel(`${c.name} abre a moela dos dois com a faca. Junto de botões, uma fivela e um anel de cobre, oito pedrinhas roxas polidas: ametistas.`);
        app.refresh();
      } });
    }
    // G14: a torre
    if (perto(P.torre, 15) && !t.feito.torreEncolhida) {
      if (t.feito.sabeAPalavra) {
        ops.push({ rotulo: 'Dizer a palavra de comando', icone: 'acao-usarObjeto', detalhe: '"petrificação", em terrano', motivo: null, fazer: () => torreEncolhe(c, 'palavra') });
      }
      const cascalho = tem('cascalhoPetrificado');
      if (cascalho) {
        ops.push({ rotulo: 'Jogar o cascalho de estátua na torre', icone: 'acao-usarObjeto', detalhe: cascalho.h.name, motivo: null, fazer: () => { tirarDaBolsa(cascalho.h, 'cascalhoPetrificado'); torreEncolhe(c, 'cascalho'); } });
      }
      if (!t.feito.sabeAPalavra && !cascalho && vivos('zoklork').length && t.feito.zoklorkPerguntado) {
        ops.push({ rotulo: 'Falar de novo com o Zoklork', icone: 'acao-procurar', motivo: null, fazer: () => conversaComZoklork() });
      }
    }
    if (aqui(P.cofreDaTorre) && t.feito.torreEncolhida && !t.feito.cofreDaTorre) {
      ops.push({ rotulo: 'Abrir o cofre da torre', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
        t.feito.cofreDaTorre = true;
        guardar(c, 'moedaDeOuro', 1300);
        await painel(`Onde a torre estava, sobrou um cofre de ferro que ela guardava: 1.300 peças de ouro, contadas em pilhas de dez. ${c.name} as leva.`);
        app.refresh();
      } });
    }
    // G16: a porta secreta do sul
    const s = P.secretas.escadaDoSantuario;
    if (!(t.secretas ?? []).includes('escadaDoSantuario')) {
      if ([s.a, s.tambem[0].a].some(aqui)) {
        ops.push({ rotulo: 'Procurar na parede sul', icone: 'acao-procurar', detalhe: 'Percepção, CD 15', motivo: longe(c, tile), fazer: () => {
          const r = teste(c, 'percepcao', 15);
          if (!r.passou) { enc.say('acao', `${c.name} só acha pedra molhada (${r.total} contra CD 15).`); app.refresh(); return; }
          abrirSecreta('escadaDoSantuario');
          enc.say('acao', `${c.name} acha um painel que desliza (${r.total} contra CD 15): atrás dele, uma escada sobe. A água da câmara corre para os primeiros degraus.`);
        } });
      }
      if ([s.b, s.tambem[0].b].some(aqui)) {
        ops.push({ rotulo: 'Correr o painel', icone: 'acao-usarObjeto', detalhe: 'deste lado, ele se vê', motivo: longe(c, tile), fazer: () => { abrirSecreta('escadaDoSantuario'); enc.say('acao', `${c.name} corre o painel no fim da escada, e a água da câmara molha os degraus de baixo.`); } });
      }
    }
    // G19: o armário na frente da porta do santuário
    if (perto(P.armario, 5) && !t.feito.armarioTirado) {
      ops.push({ rotulo: 'Arrastar o armário', icone: 'acao-empurrar', detalhe: 'pesado, mas sai', motivo: longe(c, P.armario, 10), fazer: async () => {
        t.feito.armarioTirado = true;
        tirarArmario();
        await painel('O armário de metal raspa no chão, guinchando. Atrás dele, na parede, uma porta que ninguém via.');
        app.refresh();
      } });
    }
    // G20: as lousas, as moedas-aranha e o altar
    if (aqui(P.lousas) && !t.feito.lousas) {
      ops.push({ rotulo: 'Ler as lousas da mesa', icone: 'acao-procurar', detalhe: 'dez minutos · subcomum', motivo: longe(c, tile), fazer: async () => {
        t.feito.lousas = true;
        await painel([
          'Lousas de pedra escritas em subcomum, de um espião que anotava o que duergar e drow faziam. Quase tudo é comércio, e chato: preço de ferro, preço de mitral, quem deve a quem.',
          'Numa delas, um desenho: uma torre de pedra pequena, com ameias, e embaixo uma palavra em terrano, sublinhada duas vezes. Os duergar queriam a palavra; os drow fingiam não saber, e já a tinham.',
        ]);
        if (t.feito.viuTorre) {
          t.feito.sabeAPalavra = true;
          pista('As lousas do santuário (G20) dão a palavra de comando da torre tombada de G14: "petrificação", em terrano.');
        } else pista('As lousas do santuário (G20) desenham uma torre de pedra com ameias e uma palavra em terrano embaixo: "petrificação".');
        app.refresh();
      } });
    }
    if (salaDe(tile) === 'G20' && !vivos('zuluthl').length && t.feito.lutaG20 && !t.feito.moedasAranha) {
      ops.push({ rotulo: 'Recolher as moedas da teia', icone: 'acao-procurar', motivo: null, fazer: () => {
        t.feito.moedasAranha = true;
        guardar(c, 'moedaDeOuro', 80);
        enc.say('acao', `${c.name} tira as moedas da teia. Sem o yochlol, as perninhas de aranha param, e fora da sala são só 80 peças de ouro.`);
        app.refresh();
      } });
    }
    if (aqui(P.altar) && !t.feito.pergaminho) {
      ops.push({ rotulo: 'Olhar o altar', icone: 'acao-procurar', motivo: longe(c, tile), fazer: () => {
        t.feito.pergaminho = true;
        guardar(c, 'pergaminhoDeLiberdadeDeMovimento', 1);
        enc.say('acao', `Na reentrância do altar, enrolado num tubo de osso, um pergaminho: Liberdade de Movimento. ${c.name} o guarda.`);
        app.refresh();
      } });
    }
    // G21: o cascalho dos rostos das estátuas
    if (P.estatuas.some((p) => perto(p, 5)) && !t.feito.cascalho) {
      ops.push({ rotulo: 'Recolher o cascalho das estátuas', icone: 'acao-procurar', motivo: null, fazer: () => {
        t.feito.cascalho = true;
        guardar(c, 'cascalhoPetrificado', 1);
        enc.say('acao', `${c.name} junta um punhado do cascalho dos rostos quebrados. Pesa mais do que pedra comum.`);
        app.refresh();
      } });
    }
    // G24: o mapa a carvão
    if (aqui(P.mapaDeCarvao) && !t.feito.mapaDeCarvao) {
      ops.push({ rotulo: 'Estudar o mapa de carvão', icone: 'acao-procurar', motivo: longe(c, tile, 10), fazer: async () => {
        t.feito.mapaDeCarvao = true;
        await painel([
          'O mapa mostra o obelisco remontado, inteiro, com sete partes numeradas, e três cabeças de polvo desenhadas em volta. Embaixo, um nome: Illithinoch, um refúgio fundo, bem abaixo de Phandalin.',
          'Linhas onduladas sobem do refúgio até um desenho da vila. As figurinhas que as linhas tocam viram cabeças de polvo. Nas margens, contas: de três a sete em cada dez se transformam. Os outros morrem, e não depressa.',
        ]);
        pista('O mapa a carvão de G24: o obelisco de sete partes, remontado em Illithinoch, um refúgio bem abaixo de Phandalin. O ritual transformaria de 3 a 7 em cada 10 moradores em devoradores de mente; o resto morreria.');
        app.refresh();
      } });
    }
    // G25: o fragmento e o tesouro
    if (aqui(P.fragmento) && !o6.fragmentos.encruzilhada && !t.feito.fragmentoLevado && !vivos('qunbraxel').some((q) => t.feito.qunbraxelNoCofre && !q.dead)) {
      ops.push({ rotulo: 'Pegar o fragmento do obelisco', icone: 'acao-usarObjeto', motivo: longe(c, tile), fazer: async () => {
        o6.fragmentos.encruzilhada = true;
        sobre('semFragmento', true);
        await painel(`${c.name} levanta a pedra negra do chão do cofre. Os veios verdes pulsam uma vez, como um coração, e se aquietam. Os três drow em volta parecem, por um instante, menos ossos.`);
        pista('O fragmento da Encruzilhada da Forca está com o grupo.');
        app.refresh();
      } });
    }
    if (aqui(P.tesouro) && !t.feito.cofreSaqueado) {
      ops.push({ rotulo: 'Recolher o tesouro do cofre', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
        t.feito.cofreSaqueado = true;
        guardar(c, 'moedaDeOuro', 5900);
        guardar(c, 'moedaDePrata', 14050);
        guardar(c, 'adagaCravejada', 1);
        guardar(c, 'jacinto', 11);
        guardar(c, 'varinhaDeDeteccaoDeMagia', 1);
        guardar(c, 'mochilaPraticaDeHeward', 1);
        guardar(c, 'ferramentasDeLadrao', 3);
        await painel([
          'O cofre de uma casa drow rica: montes de moedas de ouro e de prata, uma adaga de cabo cravejado, onze pedras cor de laranja, uma varinha de madeira clara, uma mochila de couro que parece vazia e não é, e três estojos de ferramentas de ladrão, dos três que morreram aqui.',
          `${c.name} leva tudo: 5.900 peças de ouro, 14.050 de prata, a adaga, os onze jacintos, a varinha, a mochila e as ferramentas.`,
        ]);
        app.refresh();
      } });
    }
    return ops;
  }

  /** A torre encolhe; se o Qunbraxel vive e não lutou, ele e os grimlocks se mudam para o cofre. */
  async function torreEncolhe(c, como) {
    t.feito.torreEncolhida = true;
    encolherTorre();
    guardar(c, 'torreLamacenta', 1);
    await painel(como === 'palavra'
      ? `${c.name} diz a palavra. A lama para de andar. A torre estala, encolhe, encolhe, como uma onda que volta para o mar, e o que sobra no chão é uma esfera de granito do tamanho de uma noz.`
      : `${c.name} joga o cascalho contra a torre. A pedra de gente morta parece queimar a lama, que foge para dentro; a torre estala e encolhe até virar uma esfera de granito do tamanho de uma noz.`);
    const q = vivos('qunbraxel')[0];
    if (q && !t.feito.lutaG24) {
      t.feito.qunbraxelNoCofre = true;
      const no = (m, p) => { if (m && !m.dead) { m.pos = { ...m.pos, ...p }; m.salaDaEncruzilhada = 'G25'; m.casasPermitidas = null; } };
      no(q, P.qunbraxelNoCofre);
      ['grimlockDaTorre1', 'grimlockDaTorre2', 'grimlockDaGuarda1', 'grimlockDaGuarda2', 'grimlockDaGuarda3', 'grimlockDaGuarda4']
        .forEach((k, i) => no(elenco[k], P.grimlocksNoCofre[i]));
      enc.say('acao', 'Longe dali, do lado dos salões drow, passos apressados e uma porta de pedra arrastada. Alguém chegou ao cofre antes de vocês.');
    }
    pista('A Torre Lamacenta encolheu: o caminho do corredor de G23 até o cofre drow (G25) está aberto.');
    app.refresh();
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
    evento,
    dialogoDe: () => null,
    elenco,
    estado: t,
    async iniciar() {
      // o que já se abriu fica aberto
      for (const nome of t.secretas ?? []) abrirSecreta(nome);
      if (t.feito.torreEncolhida) encolherTorre();
      if (t.feito.armarioTirado) tirarArmario();
      if (t.feito.barraTirada) enc.field.trancas?.delete(P.portaBarrada.aresta);
      if (t.feito.gaiola) mudarCasa(P.gaiolaMontada.x, P.gaiolaMontada.y, 'L');
      if (t.feito.mofoMorto) alternarRegiao(enc.field, 'mofoMarrom', false);
      if (o6.fragmentos.encruzilhada || t.feito.fragmentoLevado) sobre('semFragmento', true);
      for (const m of Object.values(elenco)) {
        if (m.dead || m.escondido) continue;
        neutro(m, OLHAR[m.salaDaEncruzilhada]);
      }
      // quem desce a fenda de Talhundereth chega pela passagem de G11
      if (config.chegada === 'talhundereth') {
        herois().forEach((h, i) => { h.pos = { ...h.pos, ...(enc.casaLivreMaisProxima(P.fendaDeTalhundereth[i % P.fendaDeTalhundereth.length]) ?? h.pos) }; });
      }
      if (!t.feito.chegou) {
        t.feito.chegou = true;
        await painel([
          config.chegada === 'talhundereth'
            ? 'Uma hora de túnel baixo, de costas curvadas, e a fenda se abre numa passagem de pedra trabalhada, fria e úmida.'
            : 'O mapa dos goblins leva a uma boca de túnel entre pedras, nas colinas. O túnel desce, desce, por mais de um quilômetro e meio, cada vez mais quente e mais úmido.',
          'Lá embaixo, arandelas de pedra ainda queimam com uma chama que não consome nada e não dá calor: chama contínua, acesa por alguém que morreu há séculos. Os túneis estão claros. As salas, não.',
        ]);
      } else if (t.feito.fragmentoLevado && !t.feito.avisouLevado && !o6.fragmentos.encruzilhada) {
        t.feito.avisouLevado = true;
        await painel('No cofre drow, o lugar do fragmento está vazio, marcado só por um círculo limpo na poeira. Alguém o levou embora — para o fundo, para Illithinoch.');
        pista('O fragmento da Encruzilhada da Forca foi levado pelos fanáticos para Illithinoch.');
      }
      prepararExploracao();
    },
  };
}
