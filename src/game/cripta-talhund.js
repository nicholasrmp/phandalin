// A CRIPTA DOS TALHUND (o Obelisco, capítulo 6), debaixo de Talhundereth, aberta pelo disco de T20. O mapa está em
// `game/cripta-mapa.js` (gerado por `src/dev/mapa-cripta-talhund.py`), as criaturas em `rules/monsters/cripta.js`.
//
// O QUE É DO LIVRO (as regras; o texto é nosso):
//   AS ASSOMBRAÇÕES ficam em P2, P6, P7, P11 e P16. Não saem do lugar nem tocam ninguém. Cada uma se apaga de um jeito:
//     P2 vencendo ou expulsando quem está em P5; P6 consertando a porta (ferramentas de pedreiro, com proficiência) E
//     tirando o crânio; P7 destruindo o esqueleto sem cabeça; P11 vencendo ou parando os catorze valentes; P16 vencendo a
//     múmia de P17. Quem não é fiel de Dumathoin percebe o jeito com Sabedoria (Percepção) CD 12.
//   EM PAZ (as cinco assombrações apagadas): a fundadora não se levanta, os fantasmas não aparecem, os abençoados não
//     sobem, a múmia e o guardião não acordam, os espectros não saem — e os guardiões destruídos não voltam. Sem a paz,
//     um guardião (revenant) destruído se refaz noutro corpo em 24 horas: voltando à cripta um dia depois, ele está lá.
//   A PURIFICAÇÃO: em paz E os fantasmas de P13 vencidos. Quem ajudou recebe a BÊNÇÃO DE DUMATHOIN (visão no escuro),
//     menos quem tirou gema dos mortos de P8 ou dos valentes de P11/P12.
//   INVOCAR DUMATHOIN (P10, P11, P13, P15, P17, P18): ação e Religião CD 14. Em P11, P15 e P18, para um morto por sucesso;
//     em P10, P13 e P17, o grupo todo. Voltam a atacar se o grupo sair da sala e entrar de novo.
//   P1: mexer num sarcófago, ou um vivo tentar sair pela passagem oeste, solta os quatro guardiões — com paz ou sem ela
//     (a regeneração deles é a do bloco: só o fogo e o radiante a suspendem). A estátua mexida
//     desmorona e deixa entulho na metade dela.
//   P5: a hidra ataca o que parece comestível; a água viva fica no poço, agarra e arrasta; foge se a hidra morrer.
//   P8: o golem persegue até P6 e P7, não além. Os catorze corpos têm uma gema de 100 po nas costelas: quem tira, perde a
//     bênção.
//   P9: o Rivibiddel, historiador, quase morto de fome; a alavanca de P9 só se move junto com a de P13.
//   P11: quatro esqueletos de P12 ao entrar, e mais dois no começo de cada rodada até os catorze.
//   AS DUAS ALAVANCAS JUNTAS (P9 e P13): o santuário gira, as três antessalas P4 dão para ele, e a parede entre P11 e
//     P15 sobe. Os revenants de P15 saem caçando.
//   P14: os três wraiths não saem da sala. A gema se lasca: a lasca é o que o Rivibiddel quer.
//   P17: estudar as plantas entalhadas acha toda porta secreta da cripta.
//   P18: tocar o fragmento solta quatro espectros, e mais um no começo de cada rodada até sete ou até o fragmento sair.
//
//   O DESCANSO LONGO NA CRIPTA, antes da purificação: uma assombração da tabela aparece onde o grupo dorme. Essa não se
//     apaga e não conta para a paz.
//   A BÊNÇÃO DE DUMATHOIN: visão no escuro (quem já tinha passa a ver em cores) e, como ação, visão verdadeira de 36 m
//     por um minuto, uma vez por descanso longo (`combat.js useFeature('visaoDeDumathoin')`, condição `visaoVerdadeira`).
//   A PODRIDÃO DA MÚMIA tira 3d6 de PV máximo a cada descanso longo (as 24 horas do livro), até Remover Maldição.
//   Quem é fiel de Dumathoin (`heroi.divindade`) sabe, sem teste, como apagar cada assombração.

import { narrar } from '../view/narrativa.js';
import { distanceFt, GLIFOS, SUPERFICIES, ARESTA } from '../core/grid.js';
import { skillBonus } from '../rules/abilities.js';
import { rolarTeste } from '../rules/utilidade.js';
import { makeMonster } from '../rules/monsters.js';
import { garantirInventario } from '../rules/equipment.js';
import { removeCondition, addCondition } from '../rules/conditions.js';
import { guardar } from './comercio.js';
import { ctxDe } from './magias-fora.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { PONTOS_CRIPTA as P } from './cripta-mapa.js';
import { guardiaoVencido } from './obelisco6-marcos.js';

const MOVIMENTO = 60;
const TITULO = 'A Cripta dos Talhund';
const LUGARES_ASSOMBRADOS = ['P2', 'P6', 'P7', 'P11', 'P16'];
const ONDE_SE_INVOCA = ['P10', 'P11', 'P13', 'P15', 'P17', 'P18'];
const UM_POR_SUCESSO = ['P11', 'P15', 'P18'];

// as assombrações, o d6 do livro (o texto é nosso). A quinta e a sexta são as de horror do corpo; `{quem}` é um herói
// sorteado.
const ASSOMBRACOES = [
  'Uma coisa fria e mole tateia o couro cabeludo de cada um, procurando o ponto onde o osso é mais fino. Quando alguém leva a mão à cabeça, não há nada.',
  'Um velho sacerdote anão passa por vocês sem ver ninguém, de olhos arregalados, segurando um machado sujo de um líquido roxo. Ele vira a quina e some.',
  'Cada um de vocês sente, de repente, que alguma coisa está entrando agora mesmo no lugar mais seu que já teve — a casa da infância, um templo, um esconderijo — e mexendo em tudo.',
  'Um murmúrio em anão, de muitas vozes ao mesmo tempo, pedindo ajuda. Depois pedindo vingança contra os comedores de cérebro.',
  'No chão, de costas, está {quem} — ou uma imagem translúcida de {quem}, com o alto da cabeça aberto como uma tigela vazia. A imagem não olha para ninguém; só treme e baba, até se desfazer.',
  'Da parede sai a sombra de um anão morto, com a carne caindo. Ele leva um dedo podre aos lábios, pedindo silêncio, abre as próprias costelas com a outra mão e mostra uma gema escondida no peito. Depois volta para dentro da pedra — e daqui a pouco sai de novo, de outro ponto da parede.',
];
/** Uma assombração da tabela, com o herói sorteado no lugar de `{quem}`. */
export function textoDaAssombracao(rng, herois) {
  const texto = ASSOMBRACOES[rng.die(6) - 1];
  const quem = herois.length ? herois[rng.die(herois.length) - 1].name : 'um de vocês';
  return texto.replaceAll('{quem}', quem);
}
const COMO_APAGAR = {
  P2: 'o silêncio do salão volta quando quem chapinha na câmara alagada, a oeste, for vencido ou expulso',
  P6: 'a porta torta tem de ser consertada (ferramentas de pedreiro, e saber usá-las) e o crânio comprido tirado da frente dela',
  P7: 'o esqueleto sem cabeça encostado nas vitrines tem de ser destruído',
  P11: 'os catorze valentes têm de ser vencidos ou postos de volta em paz',
  P16: 'quem jaz no túmulo do arquiteto, atrás da porta, tem de ser vencido',
};

export const salaNaCripta = (p) => {
  for (const [id, cs] of Object.entries(P.salas)) if (cs.some((c) => c.x === p.x && c.y === p.y)) return id;
  return null;
};

export function criarCriptaTalhund(app, config = {}) {
  const enc = app.enc;
  const root = app.root;
  const camp = (app.campanha ??= {});
  const o6 = (camp.obelisco6 ??= { feito: {}, lutas: {} });
  o6.fragmentos ??= {};
  const t = (o6.cripta ??= { feito: {}, mortos: [], apagadas: [], ajudaram: [], ladroes: [], vistas: [] });
  for (const k of ['feito']) t[k] ??= {};
  for (const k of ['mortos', 'apagadas', 'ajudaram', 'ladroes', 'vistas']) t[k] ??= [];
  const vila = (camp.vila ??= { pistas: [], missoes: {} });
  const estado = { explorando: false, encerrado: false, lutando: null, sala: null, parados: new Set() };
  const todos = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead);
  const herois = () => todos().filter((c) => c.hp > 0);
  const painel = (texto, escolhas) => narrar(root, { formato: 'painel', paginas: [{ titulo: TITULO, texto: [].concat(texto) }], ...(escolhas ? { escolhas } : {}) });
  const pista = (txt) => { if (!(vila.pistas ??= []).includes(txt)) vila.pistas.push(txt); };
  const longe = (c, tile, pes = 5) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
  const salaDe = salaNaCripta;
  const casasDa = (...salas) => new Set(salas.flatMap((s) => (P.salas[s] ?? []).map((c) => `${c.x},${c.y}`)));
  const melhor = (pericia) => herois().reduce((a, b) => (skillBonus(b, pericia) > skillBonus(a, pericia) ? b : a));
  const teste = (quem, pericia, cd, opts = {}) => { const x = ctxDe(app, enc); return rolarTeste(x.estado, x.herois(), enc.rng, quem, pericia, cd, opts); };
  const purificada = () => Boolean(t.feito.purificada);
  // EM PAZ: as cinco assombrações apagadas (o livro: "put the crypt's haunts to rest")
  const emPaz = () => LUGARES_ASSOMBRADOS.every((s) => t.apagadas.includes(s));
  const naSala = (sala) => herois().filter((h) => salaDe(h.pos) === sala);
  const sobre = (id, ligada) => enc.field.alternarSobreposicao?.(id, ligada);
  const ajudou = (h) => { if (h && !t.ajudaram.includes(h.id)) t.ajudaram.push(h.id); };

  // A REJUVENESCÊNCIA (o livro): sem as assombrações em paz, o guardião destruído se refaz noutro corpo em 24 horas.
  const emPazNoInicio = LUGARES_ASSOMBRADOS.every((s) => t.apagadas.includes(s));
  for (const [chave, dia] of Object.entries(t.renascem ?? {})) {
    if (emPazNoInicio) { delete t.renascem[chave]; continue; }
    if ((vila.dia ?? 1) > dia) { t.mortos = t.mortos.filter((k) => k !== chave); delete t.renascem[chave]; t.feito.voltaram = (t.feito.voltaram ?? 0) + 1; }
  }

  // ------------------------------------------------------------- o elenco ----
  const elenco = {};
  const novo = (chave, id, pos, { nome = null, sala, escondido = true, extra = {} } = {}) => {
    if (t.mortos.includes(chave)) return null;
    const m = makeMonster(id, { ...pos });
    if (nome) m.name = nome;
    Object.assign(m, { chaveDaCripta: chave, salaDaCripta: sala, escondido, side: 'neutro', mortoDaCripta: m.tipo === 'morto-vivo' }, extra);
    elenco[chave] = m;
    return m;
  };
  P.revenantsP1.forEach((p, i) => novo(`revP1_${i}`, 'revenant', p, { sala: 'P1' }));
  novo('hidra', 'hidra', P.hidra, { nome: 'Grandlejaw', sala: 'P5', escondido: false });
  novo('aguaViva', 'aguaViva', P.aguaViva, { nome: 'Kellikilli', sala: 'P5', extra: { naoSeguraALuta: true, casasPermitidas: new Set(P.agua.map((c) => `${c.x},${c.y}`)) } });
  novo('golem', 'golemDeArgila', P.golem, { sala: 'P8', escondido: false, extra: { casasPermitidas: casasDa('P6', 'P7', 'P8') } });
  novo('fundadora', 'esqueletoAnao', P.fundadora, { nome: 'A Fundadora', sala: 'P10' });
  for (let k = 0; k < 14; k++) novo(`valente${k}`, 'esqueletoAnao', P.lajesP12[k], { nome: `Valente ${k + 1}`, sala: 'P11' });
  [['Brelta Gemblade'], ['Murnig'], ['Nelja']].forEach(([nome], i) => novo(`fantasma${i}`, 'fantasma', P.fantasmas[i], { nome, sala: 'P13' }));
  P.wraiths.forEach((p, i) => novo(`wraith${i}`, 'wraith', p, { sala: 'P14', extra: { casasPermitidas: casasDa('P14') } }));
  P.revenantsP15.forEach((p, i) => novo(`revP15_${i}`, 'revenant', p, { sala: 'P15', escondido: false }));
  novo('mumia', 'mumia', P.mumia, { nome: 'O Arquiteto', sala: 'P17' });
  const guardiao = novo('guardiao', 'guardiaoEscudo', P.guardiao, { sala: 'P17', escondido: false });
  if (guardiao && elenco.mumia) guardiao.amuletoCom = elenco.mumia.id;
  P.entalhesP18.forEach((p, i) => novo(`espectro${i}`, 'espectro', p, { sala: 'P18' }));
  const rivibiddel = t.feito.rivibiddelFora ? null : makeMonster('gnomoDasProfundezas', { ...P.rivibiddel });
  if (rivibiddel) { rivibiddel.name = 'Rivibiddel'; rivibiddel.side = 'neutro'; rivibiddel.speedFt = 15; rivibiddel.semReacoes = true; }

  const vivos = (...chaves) => chaves.map((k) => elenco[k]).filter((m) => m && !m.dead);
  const daSala = (sala) => Object.values(elenco).filter((m) => m.salaDaCripta === sala && !m.dead);
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

  /** A luta. `reforcos`: (rodada) => lista de quem entra nessa rodada (os valentes de P12, os espectros de P18). */
  function luta(quem, { reforcos = null, sala = null } = {}) {
    for (const f of quem) {
      if (f.dead) continue;
      f.side = 'foes';
      f.escondido = false;
      estado.parados.delete(f.id);
      if (!enc.combatants.includes(f)) enc.addCombatant(f);
    }
    estado.explorando = false;
    estado.lutando = [...quem];
    estado.sala = sala;
    root.classList.remove('explorando');
    enc.emboscada = null;
    enc.reinforcements = reforcos ? (rodada) => {
      const units = reforcos(rodada).filter((f) => f && !f.dead && f.side !== 'foes');
      if (!units.length) return null;
      for (const f of units) { f.side = 'foes'; f.escondido = false; tirar(f); }
      estado.lutando = [...estado.lutando, ...units];
      return { units, aviso: null };
    } : null;
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
    return true;
  }

  async function darXpDe(lista, motivo) {
    const grupo = todos();
    const xp = lista.filter((f) => f.dead || f.capturado || estado.parados.has(f.id)).reduce((s, f) => s + (f.xp ?? 0), 0);
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
  const abrirAresta = (a, b) => enc.field.porAresta(a.x, a.y, b.x, b.y, ARESTA.aberta);
  function abrirSecreta(nome) {
    const s = P.secretas[nome];
    abrirAresta(s.a, s.b);
    if (nome === 'P4s') abrirAresta({ x: 21, y: 24 }, { x: 21, y: 25 });
    (t.secretas ??= []).includes(nome) || t.secretas.push(nome);
    app.refresh?.();
  }

  /** O GIRO: as três antessalas dão para o santuário, e a parede entre P11 e P15 sobe. */
  function girar() {
    for (const cs of Object.values(P.anel)) for (const c of cs) mudarCasa(c.x, c.y, 'L');
    for (const c of P.paredeQueDesliza) mudarCasa(c.x, c.y, 'L');
    for (const [a, b] of [...P.arestasDoGiro, ...P.arestasDaParede]) abrirAresta(a, b);
    sobre('paredeAberta', true);
    for (const m of daSala('P15')) m.casasPermitidas = null;
    app.refresh?.();
  }

  // ------------------------------------------------------- as assombrações ----
  const assombrada = (sala) => LUGARES_ASSOMBRADOS.includes(sala) && !t.apagadas.includes(sala);
  async function apagar(sala, quem = null) {
    if (!assombrada(sala)) return;
    t.apagadas.push(sala);
    ajudou(quem);
    await painel(`O ar de ${NOME_DA_SALA[sala]} assenta, como uma respiração presa que se solta. A assombração se apagou.`);
    await conferirPurificacao();
  }
  async function conferirPurificacao() {
    if (purificada() || !emPaz() || !t.feito.fantasmasVencidos) return;
    t.feito.purificada = true;
    const abencoados = herois().filter((h) => t.ajudaram.includes(h.id) && !t.ladroes.includes(h.id));
    for (const h of abencoados) darBencao(h);
    await painel([
      'Um suspiro de pedra rangendo passa pela cripta inteira, de sala em sala. Cada uma pisca de luz por um instante — as gemas entalhadas, as tampas dos sacerdotes —, e depois o silêncio é só silêncio.',
      abencoados.length
        ? `${abencoados.map((h) => h.name).join(', ')} ${abencoados.length > 1 ? 'sentem' : 'sente'} os olhos arderem e depois verem no escuro como de dia: a bênção de Dumathoin. Uma vez por descanso longo, por um minuto, ${abencoados.length > 1 ? 'eles veem' : 'vê'} as coisas como elas são.`
        : 'Ninguém aqui recebe a bênção de Dumathoin: quem ajudou também tirou o que era dos mortos.',
    ]);
    pista('A Cripta dos Talhund foi purificada. Os mortos dos Talhund descansam.');
  }
  /** A BÊNÇÃO DE DUMATHOIN (o livro): visão no escuro (em cores, se já tinha) e a visão verdadeira uma vez por descanso longo. */
  function darBencao(h) {
    h.bencaoDeDumathoin = true;
    h.visaoNoEscuroEmCores = (h.senses?.darkvisionFt ?? 0) > 0;
    h.senses = { ...(h.senses ?? {}), darkvisionFt: Math.max(60, h.senses?.darkvisionFt ?? 0) };
    (h.resourcesMax ??= {}).visaoDeDumathoin = 1;
    (h.resources ??= {}).visaoDeDumathoin = 1;
  }

  /** O DESCANSO LONGO NA CRIPTA (o livro): antes da purificação, uma assombração aparece onde o grupo dorme. */
  async function depoisDoDescanso(tipo) {
    if (tipo !== 'longo' || purificada()) return;
    const onde = salaDe(herois()[0]?.pos ?? { x: -1, y: -1 });
    await painel([
      `No meio da noite${onde ? `, em ${NOME_DA_SALA[onde] ?? 'onde vocês dormem'}` : ''}, quem está de vigia vê:`,
      textoDaAssombracao(enc.rng, herois()),
      'Essa não pede nada. Passa sozinha, e não há o que apagar.',
    ]);
  }

  async function manifestar(sala) {
    if (!assombrada(sala) || t.vistas.includes(sala)) return;
    t.vistas.push(sala);
    const texto = textoDaAssombracao(enc.rng, herois());
    // quem é fiel de Dumathoin sabe o que o lugar pede; os outros percebem com Percepção CD 12
    const fiel = herois().find((h) => /dumathoin/i.test(h.divindade ?? ''));
    if (fiel) {
      await painel([texto, `${fiel.name}, que reza a Dumathoin, sabe o que o lugar pede: ${COMO_APAGAR[sala]}.`]);
      pista(`Assombração em ${NOME_DA_SALA[sala]}: ${COMO_APAGAR[sala]}.`);
      return;
    }
    const quem = melhor('percepcao');
    const r = teste(quem, 'percepcao', 12);
    await painel([texto, r.passou ? `${quem.name} (Percepção ${r.total}) entende o que o lugar pede: ${COMO_APAGAR[sala]}.` : 'Ninguém entende o que o lugar pede.']);
    if (r.passou) pista(`Assombração em ${NOME_DA_SALA[sala]}: ${COMO_APAGAR[sala]}.`);
  }

  // ------------------------------------------------------------- as salas ----
  async function patamar(heroi) {
    const bando = vivos('revP1_0', 'revP1_1', 'revP1_2', 'revP1_3');
    if (!bando.length || t.feito.lutaP1) return false;
    const saindo = P.saidaOesteP1.some((p) => p.x === heroi?.pos.x && p.y === heroi?.pos.y);
    if (!saindo) return false;
    return acordarP1(`${heroi.name} dá o primeiro passo para a passagem oeste, e as quatro tampas se arrastam ao mesmo tempo.`);
  }
  async function acordarP1(texto) {
    t.feito.lutaP1 = true;
    const bando = vivos('revP1_0', 'revP1_1', 'revP1_2', 'revP1_3');
    await painel([texto, 'Quatro guardiões anões de armadura podre se levantam, e falam em anão uma palavra só: intrusos.']);
    return luta(bando, { sala: 'P1' });
  }

  async function camaraAlagada() {
    if (!naSala('P5').length || t.feito.lutaP5) return false;
    const bando = vivos('hidra', 'aguaViva');
    if (!bando.length) return false;
    t.feito.lutaP5 = true;
    await painel(['A câmara desabou num poço de água escura. Cinco cabeças compridas boiam, quatro dormindo; a quinta abre um olho amarelo para vocês. A água em volta ondula sozinha e espirra, e alguma coisa ri fino.',
      'A cabeça acordada morde a que dorme ao lado. Todas acordam. Estão com fome.']);
    const weird = elenco.aguaViva;
    if (weird && !weird.dead) addCondition(weird, 'invisivel', { rounds: Infinity });
    return luta(bando, { sala: 'P5' });
  }

  async function honrados() {
    const g = vivos('golem')[0];
    if (!g || t.feito.lutaP8) return false;
    if (!herois().some((h) => salaDe(h.pos) === 'P8' || distanceFt(h.pos, g.pos) <= 20)) return false;
    t.feito.lutaP8 = true;
    await painel('Pelo corredor dos mortos honrados vem um anão de armadura de três metros, de barro, devagar. Não fala. Levanta os punhos.');
    return luta([g], { sala: 'P8' });
  }

  async function fundadora() {
    const f = vivos('fundadora')[0];
    if (!f || t.feito.lutaP10 || !naSala('P10').length || emPaz()) return false;
    t.feito.lutaP10 = true;
    sobre('sarcofagoDaFundadora', true);
    await painel('A tampa do sarcófago desliza. Uma anã de osso, com um anel grande demais no dedo, se senta, pega o machado e se levanta.');
    return luta([f], { sala: 'P10' });
  }

  async function valentes() {
    if (!naSala('P11').length) return false;
    await manifestar('P11');
    const bando = Object.keys(elenco).filter((k) => k.startsWith('valente')).map((k) => elenco[k]).filter((m) => m && !m.dead);
    if (!bando.length || t.feito.lutaP11) return false;
    t.feito.lutaP11 = true;
    const primeiros = bando.slice(0, 4);
    let fila = bando.slice(4);
    await painel('Da porta dos mortos valentes saem quatro guerreiros anões de osso, de machado em punho, em passo de marcha. Atrás deles, mais vêm.');
    // espalhados juntos: calculada um a um, a casa saía repetida (os quatro em duas casas, `espalharFora`)
    enc.espalharFora(primeiros, (i) => ({ x: 15, y: 11 + (i % 2) }));
    return luta(primeiros, {
      sala: 'P11',
      // a primeira leva é a de quem entrou; as outras, no COMEÇO de cada rodada seguinte
      reforcos: (rodada) => {
        if (rodada < 2) return [];
        const leva = fila.slice(0, 2);
        fila = fila.slice(2);
        for (const m of leva) m.pos = { ...m.pos, ...(enc.casaLivreMaisProxima({ x: 15, y: 11 }) ?? m.pos) };
        return leva;
      },
    });
  }

  async function general() {
    const bando = vivos('fantasma0', 'fantasma1', 'fantasma2');
    if (!naSala('P13').length || t.feito.lutaP13) return false;
    if (!bando.length) return false;
    if (emPaz()) return false;
    t.feito.lutaP13 = true;
    await painel('Sobre as três lajes, três anões de luz fria se erguem: uma general de elmo alto e os dois ajudantes. Ela aponta o machado para vocês.');
    return luta(bando, { sala: 'P13' });
  }

  async function santuario() {
    const bando = vivos('wraith0', 'wraith1', 'wraith2');
    if (!naSala('P14').length || t.feito.lutaP14 || !bando.length) return false;
    t.feito.lutaP14 = true;
    await painel('No meio da sala redonda, sobre o pedestal, uma gema verde de três metros brilha. Da sombra entre os pilares saem três vultos sem rosto.');
    return luta(bando, { sala: 'P14' });
  }

  async function abencoados() {
    const bando = daSala('P15');
    if (!bando.length || t.feito.lutaP15 || emPaz()) return false;
    if (!naSala('P15').length && !t.feito.girou) return false;
    if (!naSala('P15').length && t.feito.girou && t.feito.p15Cacando) return false;
    t.feito.lutaP15 = true;
    await painel(t.feito.girou && !naSala('P15').length
      ? 'Do outro lado da parede que subiu, seis guardas anões caídos se levantam de uma vez e vêm caçar quem mexeu nas alavancas.'
      : 'No meio da sala dos mortos abençoados, seis esqueletos de armadura se levantam do chão.');
    return luta(bando, { sala: 'P15' });
  }

  async function arquiteto() {
    if (herois().some((h) => distanceFt(h.pos, P.portaP17) <= 5)) await manifestar('P16');
    const bando = vivos('mumia', 'guardiao');
    if (!naSala('P17').length || t.feito.lutaP17 || !bando.length || emPaz()) return false;
    t.feito.lutaP17 = true;
    sobre('sarcofagoDoArquiteto', true);
    sobre('semEstatua', true);
    await painel('A tampa rachada do sarcófago se ergue. Um anão enrolado em pano escrito — as plantas da cripta — se senta. A estátua carrancuda ao lado desce do pedestal para ficar na frente dele.');
    return luta(bando, { sala: 'P17' });
  }

  async function depoisDoPasso(c) {
    if (!estado.explorando) return;
    // quem sai de uma sala com mortos parados e volta: eles acordam de novo (o livro)
    for (const m of Object.values(elenco)) {
      if (!m.parado || m.dead) continue;
      if (!naSala(m.salaDaCripta).length) m.paradoForaDaSala = true;
      else if (m.paradoForaDaSala) { m.parado = false; m.paradoForaDaSala = false; t.feito[`luta${m.salaDaCripta}`] = false; }
    }
    for (const sala of ['P2', 'P6', 'P7']) if (naSala(sala).length) await manifestar(sala);
    for (const f of [() => patamar(c), camaraAlagada, honrados, fundadora, valentes, general, santuario, abencoados, arquiteto]) {
      if (await f()) return;
      if (!estado.explorando) return;
    }
  }

  // ------------------------------------------------------------- o fim ----
  async function fimDoCombate(outcome) {
    const lutou = estado.lutando ?? [];
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      await narrar(root, { formato: 'tela', paginas: [{ titulo: TITULO, texto: ['A cripta fica com mais uns mortos, sem nome, como os outros.'] }] });
      app.encerrarPartida();
      return;
    }
    for (const m of lutou) if ((m.dead || m.capturado) && m.chaveDaCripta && !t.mortos.includes(m.chaveDaCripta)) {
      t.mortos.push(m.chaveDaCripta);
      if (m.defId === 'revenant') (t.renascem ??= {})[m.chaveDaCripta] = vila.dia ?? 1;
    }
    const sala = estado.sala;
    await darXpDe(lutou, NOME_DA_LUTA[sala] ?? 'A luta');
    const quem = herois()[0];
    for (const h of herois()) ajudou(h);
    if (sala === 'P5') {
      const w = elenco.aguaViva;
      if (w && !w.dead) {
        tirar(w);
        t.mortos.push('aguaViva');
        await painel('Sem a hidra, a água do poço gira uma vez e escorre por uma fenda no fundo, rindo fino, para longe.');
      }
      if (vivos('hidra').length === 0) await apagar('P2', quem);
    }
    if (sala === 'P11' && Object.keys(elenco).filter((k) => k.startsWith('valente')).every((k) => !elenco[k] || elenco[k].dead || elenco[k].parado)) await apagar('P11', quem);
    if (sala === 'P13' && vivos('fantasma0', 'fantasma1', 'fantasma2').every((m) => m.parado)) { t.feito.fantasmasVencidos = true; await conferirPurificacao(); }
    if (sala === 'P17' && !vivos('mumia').length) {
      guardar(quem, 'gemaDe500', 1);
      enc.say('acao', `No peito da múmia, enrolada no pano, uma gema lapidada: ${quem.name} a guarda.`);
      await apagar('P16', quem);
    }
    if (sala === 'P18') {
      for (const m of daSala('P18')) { m.dead = true; m.xp = 0; }
      // o guardião do fragmento da cripta: o marco do 9º, se os outros dois já caíram (`obelisco6-marcos.js`)
      await guardiaoVencido(app, o6, 'cripta', herois());
    }
    prepararExploracao();
  }

  // ------------------------------------------------------- invocar Dumathoin ----
  /** INVOCAR DUMATHOIN: ação e Religião CD 14, contra os mortos da sala em que o herói está. */
  function invocar(c) {
    const sala = salaDe(c.pos);
    if (!ONDE_SE_INVOCA.includes(sala) || estado.explorando) return [];
    const alvos = (estado.lutando ?? []).filter((m) => !m.dead && m.side === 'foes' && m.salaDaCripta === sala);
    if (!alvos.length) return [];
    return [{
      rotulo: 'Invocar Dumathoin', icone: 'classe-turnUndead', detalhe: 'ação · Religião, CD 14',
      motivo: c.actionUsed ? 'a ação deste turno já foi usada' : null,
      fazer: async () => {
        c.actionUsed = true;
        const r = teste(c, 'religiao', 14);
        if (!r.passou) { enc.say('acao', `${c.name} chama o nome de Dumathoin, e os mortos não escutam (${r.total} contra CD 14).`); app.refresh(); return; }
        const param = UM_POR_SUCESSO.includes(sala)
          ? [alvos.sort((a, b) => distanceFt(c.pos, a.pos) - distanceFt(c.pos, b.pos))[0]]
          : alvos;
        for (const m of param) { m.side = 'neutro'; m.parado = true; estado.parados.add(m.id); }
        ajudou(c);
        enc.say('acao', `${c.name} chama o nome de Dumathoin (${r.total} contra CD 14): ${param.map((m) => m.name).join(', ')} ${param.length > 1 ? 'baixam' : 'baixa'} as armas e ${param.length > 1 ? 'ficam' : 'fica'} quieto${param.length > 1 ? 's' : ''}.`);
        enc.checkEnd?.();
        app.refresh();
      },
    }];
  }

  // ------------------------------------------------------- as interações ----
  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    const aqui = (p) => p && tile.x === p.x && tile.y === p.y;

    // a escada de volta a Talhundereth
    if (P.escada.some(aqui)) {
      ops.push({ rotulo: 'Subir a Talhundereth', icone: 'acao-disparada', motivo: longe(c, tile), fazer: () => {
        estado.explorando = false; estado.encerrado = true; root.classList.remove('explorando');
        if (rivibiddel && t.feito.rivibiddelAjudado && !rivibiddel.dead) { t.feito.rivibiddelFora = true; pista('O Rivibiddel saiu da cripta com o grupo, pela escada de Talhundereth.'); }
        app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'talhundereth', chegada: 'cripta', continuarCom: todos() });
      } });
    }

    // P1: os sarcófagos e as estátuas
    if (P.sarcofagosP1.some(aqui) && !t.feito.lutaP1 && vivos('revP1_0', 'revP1_1', 'revP1_2', 'revP1_3').length) {
      ops.push({ rotulo: 'Abrir o sarcófago', icone: 'acao-usarObjeto', motivo: longe(c, tile), fazer: () => acordarP1(`${c.name} empurra a tampa, e as quatro tampas do patamar se arrastam ao mesmo tempo.`) });
    }
    if (P.estatuasP1.some(aqui) && !t.feito.estatuaCaida) {
      ops.push({ rotulo: 'Empurrar a estátua', icone: 'acao-empurrar', motivo: longe(c, tile), fazer: async () => {
        t.feito.estatuaCaida = true;
        sobre('patamarCaido', true);
        const norte = tile.y < 27;
        for (const cel of P.salas.P1 ?? []) if ((norte ? cel.y <= 26 : cel.y >= 28) && !enc.field.blocksMove(cel.x, cel.y)) mudarCasa(cel.x, cel.y, 'x');
        await painel('A estátua racha de alto a baixo e desaba em pedaços, espalhando entulho por meio patamar.');
        app.refresh();
      } });
    }

    // P6: o crânio e a porta torta
    if (aqui(P.cranio) && !t.feito.cranioTirado) {
      ops.push({ rotulo: 'Tirar o crânio da porta', icone: 'acao-usarObjeto', motivo: longe(c, tile), fazer: async () => {
        t.feito.cranioTirado = true;
        ajudou(c);
        await painel('Um crânio comprido, de testa alta e boca de onde saíam tentáculos: um devorador de mentes. Ele se desfaz em pó assim que sai do lugar.');
        if (t.feito.portaConsertada) await apagar('P6', c);
      } });
    }
    if (aqui(P.portaTorta) && !t.feito.portaConsertada) {
      const sabe = (c.toolProficiencies ?? c.ferramentas ?? []).some((f) => /pedreiro/i.test(f)) && garantirInventario(c).bag.some((i) => /pedreiro/i.test(i.id));
      ops.push({ rotulo: 'Consertar a porta', icone: 'acao-usarObjeto', detalhe: 'ferramentas de pedreiro, com proficiência', motivo: longe(c, tile) ?? (sabe ? null : `${c.name} precisa de ferramentas de pedreiro e de saber usá-las`), fazer: async () => {
        t.feito.portaConsertada = true;
        ajudou(c);
        await painel(`${c.name} passa uns minutos assentando a dobradiça de pedra. A porta das relíquias volta a fechar reta.`);
        if (t.feito.cranioTirado) await apagar('P6', c);
      } });
    }
    // P7: o esqueleto sem cabeça e as contas de força
    if (aqui(P.esqueletoSemCabeca) && !t.feito.esqueletoDestruido) {
      ops.push({ rotulo: 'Destruir o esqueleto', icone: 'acao-empurrar', motivo: longe(c, tile), fazer: async () => {
        t.feito.esqueletoDestruido = true;
        await painel('O esqueleto de ossos compridos demais se parte em pedaços, e os pedaços em pó. Era do devorador cujo crânio estava na porta.');
        await apagar('P7', c);
      } });
    }
    if (aqui(P.estojo) && !t.feito.contas) {
      ops.push({ rotulo: 'Abrir o estojo de metal', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
        t.feito.contas = true;
        guardar(c, 'contasDeForca', 8);
        await painel('Debaixo do vidro quebrado, um estojo de metal que ninguém levou. Dentro, oito esferas de vidro escuro: contas de força.');
      } });
    }
    // P8: as gemas dos mortos honrados (quem tira perde a bênção)
    if (P.corposP8.some(aqui) && !t.feito.gemasP8) {
      ops.push({ rotulo: 'Tirar as gemas dos mortos', icone: 'acao-usarObjeto', detalhe: 'catorze gemas de 100 po', motivo: longe(c, tile), fazer: async () => {
        t.feito.gemasP8 = true;
        guardar(c, 'gemaPequena', 14);
        t.ladroes.includes(c.id) || t.ladroes.push(c.id);
        await painel(`${c.name} enfia a mão entre as costelas de cada um dos catorze e tira uma gema de cada. Ninguém reclama. Ainda.`);
      } });
    }
    // P9: o Rivibiddel e a alavanca
    if (rivibiddel && !rivibiddel.dead && distanceFt(tile, rivibiddel.pos) <= 5 && aqui(rivibiddel.pos) && !t.feito.rivibiddelAjudado) {
      ops.push({ rotulo: 'Falar com o gnomo', icone: 'acao-procurar', motivo: longe(c, tile), fazer: () => conversaRivibiddel(c) });
    }
    if (aqui(P.alavancaP9) || aqui(P.alavancaP13)) {
      ops.push({ rotulo: 'Puxar a alavanca', icone: 'acao-usarObjeto', detalhe: t.feito.girou ? 'já puxada' : 'para cima', motivo: longe(c, tile) ?? (t.feito.girou ? 'o santuário já girou' : null), fazer: () => puxarAlavanca(c, aqui(P.alavancaP9) ? 'P9' : 'P13') });
    }
    // P10 e P13: os tesouros
    if (aqui(P.sarcofagoP10) && !t.feito.anel && (!vivos('fundadora').length || vivos('fundadora')[0].parado || emPaz())) {
      ops.push({ rotulo: 'Olhar o sarcófago da fundadora', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
        t.feito.anel = true;
        guardar(c, 'anelDoOrador', 1);
        await painel('No fundo do sarcófago, o anel grande da fundadora: uma montanha de ouro com uma gema no pico.');
      } });
    }
    if (aqui(P.lajeDaGeneral) && !t.feito.coroa && (t.feito.fantasmasVencidos || emPaz())) {
      ops.push({ rotulo: 'Olhar a laje da general', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
        t.feito.coroa = true;
        guardar(c, 'coroaGuardaMente', 1);
        guardar(c, 'gemaPequena', 3);
        await painel('Em cada laje, uma gema de 100 po nos ossos. Na da general, entre a armadura em pedaços, um aro de ferro com um fio de mitral: a coroa guarda-mente.');
      } });
    }
    // P14: a lasca da gema
    if (aqui(P.esmeralda) && !t.feito.lasca && t.feito.girou && !vivos('wraith0', 'wraith1', 'wraith2').length) {
      ops.push({ rotulo: 'Lascar a grande gema', icone: 'acao-usarObjeto', motivo: longe(c, tile), fazer: async () => {
        t.feito.lasca = true;
        guardar(c, 'lascaDaEsmeralda', 1);
        await painel('A gema não quebra, mas lasca: um caco verde e morno do tamanho de uma unha cai na mão. Por um instante, cada um ouve um pensamento que não é seu, e esquece.');
      } });
    }
    // P17: as plantas entalhadas mostram toda porta secreta
    if (aqui(P.projetos) && !t.feito.mapaDaCripta && (!vivos('mumia').length || emPaz())) {
      ops.push({ rotulo: 'Estudar as plantas entalhadas', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
        t.feito.mapaDaCripta = true;
        for (const nome of Object.keys(P.secretas)) abrirSecreta(nome);
        await painel('As paredes são a cripta inteira, sala por sala. Com elas na cabeça, as três portas escondidas que dão para o santuário redondo ficam óbvias.');
      } });
    }
    // P18: o fragmento
    if (aqui(P.fragmento) && !o6.fragmentos.cripta) {
      ops.push({ rotulo: 'Pegar o fragmento do obelisco', icone: 'acao-usarObjeto', motivo: longe(c, tile), fazer: () => pegarFragmento(c) });
    }
    // P3: a armadura funerária
    if (aqui(P.armaduraFuneraria) && !t.feito.armadura) {
      ops.push({ rotulo: 'Juntar as peças de armadura', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
        t.feito.armadura = true;
        guardar(c, 'placasDosTalhund', 1);
        await painel('Na bacia funda, peças de armadura anã que encaixam umas nas outras: uma armadura de placas completa, gravada com montanhas. Era para vestir os mortos.');
      } });
    }
    // as secretas para as antessalas P4
    for (const [nome, cd] of [['P4s', 16], ['P4o', 16], ['P4l', 12]]) {
      const s = P.secretas[nome];
      if ((t.secretas ?? []).includes(nome) || !(aqui(s.a) || aqui(s.b))) continue;
      ops.push({ rotulo: 'Procurar uma porta escondida', icone: 'acao-procurar', detalhe: `Percepção, CD ${cd}`, motivo: longe(c, tile), fazer: () => {
        const r = teste(c, 'percepcao', cd);
        if (!r.passou) { enc.say('acao', `${c.name} não acha nada na parede (${r.total} contra CD ${cd}).`); app.refresh(); return; }
        abrirSecreta(nome);
        enc.say('acao', `${c.name} acha o entalhe que se mexe (${r.total} contra CD ${cd}), e um pedaço da parede abre para uma sala pequena com uma porta pesada.`);
      } });
    }
    return ops;
  }

  async function conversaRivibiddel(c) {
    const r = await painel([
      'Um gnomo cinzento e miúdo, de barba rala, magro de dar dó, olha a alavanca como quem olha um inimigo. Leva uma bolsa a tiracolo cheia de papel.',
      '— Água — diz ele, antes de mais nada. — E qualquer coisa para comer. Faz dias.',
    ], [
      { rotulo: 'Dar água e comida', valor: 'ajudar', primaria: true },
      { rotulo: 'Deixá-lo', valor: 'deixar' },
    ]);
    if (r !== 'ajudar') return;
    t.feito.rivibiddelAjudado = true;
    await painel([
      '— Rivibiddel, historiador. E fiel de Dumathoin, para o que valha. — Ele come devagar. — Entrei nadando, pelo poço do sul, por uma passagem do fundo. Passei pela hidra e pela água que ri. Era bem mais moço quando entrei: ao norte daqui há dois fantasmas, e o rosto deles me envelheceu.',
      '— Copiei a obra inteira de Thorgran, o historiador deste túmulo. O caixão está vazio, sabiam? — Ele bate na bolsa. — Esta alavanca move salas inteiras, mas está travada: depende de outra, em outro lugar, e as duas têm de ser puxadas juntas. A grande gema deve estar num santuário escondido. Eu quero uma lasca dela, para levar aos fiéis antes de morrer. E não volto a nado.',
    ]);
    pista('Rivibiddel, em P9: a alavanca do túmulo do historiador só se move junto com outra; a grande gema está num santuário escondido. Ele quer uma lasca dela e precisa de outra saída.');
  }

  async function puxarAlavanca(c, qual) {
    if (t.feito.girou) return;
    const outra = qual === 'P9' ? P.alavancaP13 : P.alavancaP9;
    const naOutra = herois().find((h) => h !== c && distanceFt(h.pos, outra) <= 5)
      ?? (qual === 'P13' && rivibiddel && !rivibiddel.dead && t.feito.rivibiddelAjudado && distanceFt(rivibiddel.pos, P.alavancaP9) <= 10 ? rivibiddel : null);
    if (!naOutra) {
      await painel(`A alavanca não sai do lugar. Dentro da parede, uma engrenagem range e para: ela espera outra, em outro lugar, puxada ao mesmo tempo.`);
      return;
    }
    t.feito.girou = true;
    ajudou(c);
    girar();
    await painel(['As duas alavancas descem juntas. Debaixo dos pés, uma engrenagem do tamanho de uma casa começa a girar, e a cripta inteira treme.',
      'O santuário redondo gira, devagar, até as três saídas dele encontrarem as três salas escondidas. Lá no alto, a parede lisa entre os valentes e os abençoados sobe para o teto.']);
    if (await abencoados()) return;
    app.refresh();
  }

  async function pegarFragmento(c) {
    if (!emPaz() && daSala('P18').length && !t.feito.lutaP18) {
      t.feito.lutaP18 = true;
      await painel('A mão de quem toca a pedra negra fica fria até o cotovelo. Os entalhes de mineiros nas paredes se abrem como portas, e de dentro saem vultos que não tocam o chão.');
      const espectros = daSala('P18');
      let fila = espectros.slice(4);
      return luta(espectros.slice(0, 4), {
        sala: 'P18',
        reforcos: (rodada) => {
          if (rodada < 2) return [];
          if (o6.fragmentos.cripta && !herois().some((h) => salaDe(h.pos) === 'P18')) return [];
          const leva = fila.slice(0, 1);
          fila = fila.slice(1);
          return leva;
        },
      });
    }
    o6.fragmentos.cripta = true;
    sobre('semFragmento', true);
    await painel(`${c.name} tira do carrinho de mina a pedra negra de veios verdes, do tamanho de um pão. Os veios pulsam uma vez e se aquietam.`);
    pista('O fragmento da Cripta dos Talhund está com o grupo.');
    app.refresh();
  }

  return {
    lugar: TITULO,
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    interacoesDoHeroi: (c) => invocar(c),
    depoisDoDescanso,
    depoisDeMover(c) {
      if (c && estado.explorando) c.movementLeftFt = MOVIMENTO;
      return depoisDoPasso(c);
    },
    fimDoCombate,
    evento() {},
    dialogoDe: () => null,
    elenco,
    rivibiddel,
    estado: t,
    async iniciar() {
      for (const nome of t.secretas ?? []) abrirSecreta(nome);
      if (t.feito.girou) girar();
      if (t.feito.estatuaCaida) sobre('patamarCaido', true);
      if (o6.fragmentos.cripta) sobre('semFragmento', true);
      if (t.mortos.includes('mumia')) { sobre('sarcofagoDoArquiteto', true); sobre('semEstatua', true); }
      for (const m of Object.values(elenco)) {
        if (m.dead || m.escondido) continue;
        if (m.salaDaCripta === 'P15' && !t.feito.girou) m.casasPermitidas = casasDa('P15');
        neutro(m);
      }
      if (rivibiddel) neutro(rivibiddel, { dx: 1, dy: 0 });
      if (!t.feito.chegou) {
        t.feito.chegou = true;
        await painel([
          'A escada em espiral desce mais do que devia. Lá embaixo, o ar é frio e parado, e as gemas entalhadas nas paredes brilham sozinhas, fraco, como se alguém as acendesse de dentro.',
          'Não há nome em lugar nenhum. Os anões de Dumathoin acreditavam que o deus dá aos mortos um nome secreto, e que o resto é só pedra.',
        ]);
      }
      prepararExploracao();
    },
  };
}

const NOME_DA_SALA = {
  P2: 'o salão fantasmagórico', P6: 'a aproximação dos honrados', P7: 'o relicário', P11: 'a aproximação dos valentes', P16: 'o salão assombrado',
};
const NOME_DA_LUTA = {
  P1: 'Os guardiões do patamar', P5: 'A câmara alagada', P8: 'O golem dos mortos honrados', P10: 'A fundadora', P11: 'Os catorze valentes',
  P13: 'A general e os ajudantes', P14: 'Os wraiths do santuário', P15: 'Os guardas dos mortos abençoados', P17: 'O arquiteto e o guardião',
  P18: 'Os espectros do obelisco',
};
