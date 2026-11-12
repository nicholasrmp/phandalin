// O LABIRINTO SALGADO (o Obelisco, capítulo 8): o domínio de Ilvaash, do outro lado do portal de Illithinoch, sobre o
// battlemap da FA (`labirinto-salgado-mapa.js`, de `src/dev/mapa-labirinto-salgado.py`), e o covil do Lowarnizel (B17),
// a cena à parte lá embaixo, pelo buraco de B16.
//
// O QUE É DO LIVRO (as regras; o texto é nosso):
//   - LUZ PLENA violeta, sem fonte, e paredes de carne que se fecham em segundos (não se cava, não se abre caminho);
//   - AS TRÊS PORTAS MENTAIS da fenda do meio só abrem pela DESCARGA de um par de bastões, com uma CORRENTE VIVA de quem
//     encosta neles: cada elo faz Constituição CD 15 (com desvantagem de armadura de metal) contra 4d10 elétricos, metade
//     se passar. Os de B7 abrem a TRASEIRA (B13–B14) e pedem um elo; os de B17, a CENTRAL (B19–B14), um elo; os de B21, a
//     DA FRENTE (B22–B18), quatro elos, a 6 m um do outro; os de B22, as TRÊS, com qualquer um. Aberta, a porta fecha
//     sozinha uma hora depois: aqui, no descanso longo;
//   - O LOBO PARIETAL (B7 a B9, B11 a B13): ninguém fica caído sem querer; o OCCIPITAL (B1 a B5): vantagem em Percepção
//     (nos testes que a cena rola);
//   - B2: os duergar mortos e a capa de aumento; B3: as aranhas defasadoras atacam quem fica para trás, os ashenwights
//     psiônicos no escuro das teias, e morto um, o outro se rende; B4: tocar os corpos da parede solta os cinco crânios
//     flamejantes; B5: a espada de prata pregada no ardil morto e a gosma que mostra a planta de B1 a B5; B6: tocar música
//     ali (Atuação CD 13) apaga as sombras, e errar as vira espectros;
//   - B7: a Varakkta e os dois guerreiros, hostis, sobretudo com a espada dela à vista; devolvida a espada, conversam; a
//     Varakkta não se rende, e os guerreiros se rendem se ela cai;
//   - B9: o Shalfi cava, e só ataca quem atrapalha; B10: o Jomlus lê o livro, e entrega o que era do Klaudel por Persuasão
//     CD 16; B11, ESCONDIDA (Percepção passiva 14, ou Investigação/Percepção CD 14): os sete flumphs, que pedem a cabeça do
//     encefálon; B12: o aglomerado encefálico e quatro gêmulas; B14: o Mublinesh, que não ataca quem anda com devorador e
//     foge para B15 abaixo de 50 PV; B15: o assobio (desvantagem em Inteligência e Sabedoria) e a armadilha de arame
//     (Sabedoria CD 18, 5d10 psíquicos e 5d10 trovejantes em todos da sala, metade se passar; acha-se com Investigação ou
//     Percepção CD 16, corta-se com ferramentas de ladrão, Destreza CD 16); B16: o buraco com a corda para B17; B18: os dois
//     zelotes tentaculados guardam a porta da frente; B19: os bibliotecários mortos (Investigação CD 14 mostra a encenação)
//     e os cristais que debilitam quem os toca (Inteligência CD 18); B21: a Ashripask, os bastões de quatro elos e o boné;
//     B22: a poça e os bastões das três portas.
//   - A REFRAÇÃO DE ILVAASH: quem sobe da Poça depois de o obelisco virar pó (a Ânima, `vazio.js`) acha um cérebro
//     fantasma enorme diante da única saída de B22, a porta da frente. Ele luta até ser destruído; o verme púrpura, se
//     ainda vive, sobe da poça no começo da 3ª rodada. Vencido, o labirinto treme, os moradores que restam não
//     incomodam mais, e em B1 abre-se um segundo portal, para o resto do Reino Distante, enquanto o de Illithinoch
//     começa a fechar. A volta a Phandalin é o epílogo (`obelisco7-vila.js`).
//   - B17 (o covil): Lowarnizel e Gossa recebem bem quem não é de Ilvaash, contam o que sabem, e o covil é o ponto seguro
//     de descanso — mas descansar no Reino Distante cobra Sabedoria CD 15 ou um nível de exaustão.
//
// E O QUE ENTROU DEPOIS (2026-11-12): os FLUMPHS recrutados lutam do lado do grupo em toda luta do labirinto, sozinhos,
// e fogem feridos ou da luta perdida (`chamarFlumphs`); a BÊNÇÃO DA MENTE SOLIPSISTA, um dia inteiro ouvindo o Jomlus
// (a ação `menteSolipsista`, 1d8 em Inteligência e Sabedoria por uma hora, sem reações, uma vez por descanso longo); o
// MUBLINESH que fecha com o raio a porta de B14 que se abriu, um minuto depois, sem devorador junto; o RELÓGIO DO SHALFI,
// que fura o covil em 1 ou 2 dias (os dias passam no descanso do covil e na leitura do Jomlus; com o grupo lá, o dragão
// luta do lado dele; longe, avisado, o dragão vence, e sem aviso a sorte decide: decisão nossa); a VARAKKTA, que sabendo
// do portal vai atacar Illithinoch e morre lá levando até dois devoradores (decisão nossa: o livro só diz que ela vai);
// e o AJUDAR como ação bônus do LOBO FRONTAL, contra o inimigo ao lado (`subclasses-livros.js ajudaDoLobo`). A capa de
// aumento e o boné saem pela camada do item que conjura (`magias-de-itens.js`).
//
// DE FORA, ditos: a Refração mirando reféns (o jogo não tem escolta de reféns: os da Cúpula e da Estátua esperam lá); a
// hora que o portal de Illithinoch leva para fechar (o labirinto não conta minutos, e de B22 a B1 se anda em minutos); o
// grupo convencer o dragão a ir cavar atrás do Shalfi em vez de esperá-lo (ele prefere esperar, e o jogo o deixa esperar);
// e o que há do outro lado do segundo portal, que o livro deixa para outra aventura.
//
// O estado mora em `app.campanha.obelisco8.lab`.

import { narrar } from '../view/narrativa.js';
import { distanceFt, ARESTA } from '../core/grid.js';
import { damageRoll } from '../core/dice.js';
import { rolarPericia, SKILL_NAME, skillBonus, abilityMod } from '../rules/abilities.js';
import { makeMonster } from '../rules/monsters.js';
import { hasCondition, addCondition, removeCondition, mudarExaustao } from '../rules/conditions.js';
import { garantirInventario } from '../rules/equipment.js';
import { descansoLongo } from '../rules/descanso.js';
import { ARMORS } from '../rules/items/index.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { guardar } from './comercio.js';
import { PONTOS_LABIRINTO as P, PONTOS_COVIL as PC } from './labirinto-salgado-mapa.js';
import { mostraAMudanca } from './transformacao.js';
import * as Refens from './refens-obelisco.js';
import { oferecerSocorro, estadoDoSocorro } from './socorro-obelisco.js';

const MOVIMENTO = 60;
const TITULO = 'O Labirinto Salgado';
/** O elenco do labirinto: chave, bloco, ponto, nome e sala. */
const ELENCO = [
  ...P.aranhas.map((p, i) => [`aranha${i + 1}`, 'aranhaDefasadora', p, null, 'B3']),
  ...P.ashenwights.map((p, i) => [`ashenwight${i + 1}`, 'ashenwightPsionico', p, null, 'B3']),
  ['varakkta', 'varakkta', P.varakkta, null, 'B7'],
  ['kianka', 'guerreiroGithyanki', P.kianka, 'Kianka', 'B7'],
  ['vazzi', 'guerreiroGithyanki', P.vazzi, 'Vazzi', 'B7'],
  ['shalfi', 'zeloteAberrante', P.shalfi, 'Shalfi Lewin', 'B9'],
  ['jitterjaws', 'fusaoDeCarne', P.jitterjaws, 'Jitterjaws', 'B9'],
  ['jomlus', 'spectator', P.jomlus, 'Jomlus', 'B10'],
  ['aglomerado', 'aglomeradoEncefalico', P.aglomerado, null, 'B12'],
  ...P.gemulas.map((p, i) => [`gemula${i + 1}`, 'gemulaEncefalica', p, null, 'B12']),
  ['mublinesh', 'observador', P.mublinesh, 'Mublinesh', 'B14'],
  ['nouashu', 'zeloteTentaculado', P.nouashu, 'Nouashu', 'B18'],
  ['groushim', 'zeloteTentaculado', P.groushim, 'Groushim', 'B18'],
  ['ashripask', 'arcanaloth', P.ashripask, 'Ashripask', 'B21'],
];
/** Os bastões: onde ficam, quantos elos pedem e que portas abrem. */
const BASTOES = {
  B7: { pontos: [P.bastoesB7], elos: 1, abre: ['traseira'], nome: 'os bastões do acampamento' },
  B21: { pontos: P.bastoesB21, elos: 4, abre: ['frente'], nome: 'os bastões da Ashripask' },
  B22: { pontos: [P.bastoesB22], elos: 1, abre: ['frente', 'central', 'traseira'], nome: 'os bastões da poça' },
};
const NOME_DA_PORTA = { frente: 'a porta da frente', central: 'a porta central', traseira: 'a porta traseira' };
const METAL = (h) => ['scale', 'plate'].includes(ARMORS[h.armor ?? 'nenhuma']?.art);

export const salaNoLabirinto = (p) => {
  for (const [id, cs] of Object.entries(P.salas)) if (cs.some((c) => c.x === p.x && c.y === p.y)) return id;
  return null;
};

/** Estado do labirinto na campanha (as portas abertas, quem morreu, o que se fez). */
export function estadoDoLabirinto(camp) {
  const o8 = (camp.obelisco8 ??= { feito: {} });
  const t = (o8.lab ??= { feito: {}, mortos: [], portas: {} });
  t.feito ??= {};
  t.mortos ??= [];
  t.portas ??= {};
  return t;
}

/** Os githyanki que saem do labirinto para atacar Illithinoch. */
export const GITHYANKI_DO_LABIRINTO = ['varakkta', 'kianka', 'vazzi'];

/**
 * O DIA NO LABIRINTO e o RELÓGIO DO SHALFI. O labirinto não conta minutos, mas conta dias: o descanso longo no covil e o
 * dia lendo com o Jomlus passam um. Em 1 ou 2 dias da chegada (`feito.diaDoShalfi`, rolado na primeira entrada) o buraco
 * de B9 fura o teto do covil. Devolve true no dia em que fura.
 */
export function passarUmDia(t) {
  t.dia = (t.dia ?? 0) + 1;
  if (t.mortos.includes('shalfi') || t.feito.shalfiFurou || t.feito.diaDoShalfi == null || t.dia < t.feito.diaDoShalfi) return false;
  t.feito.shalfiFurou = true;
  return true;
}

/**
 * O Shalfi fura o covil com o grupo longe. O livro diz que ele e o dragão empatam e que ganha o lado que o grupo ajudar;
 * sem o grupo, decisão nossa: AVISADO, o dragão o espera e vence; sem aviso, a sorte decide. Devolve o texto do que se
 * ouve de longe.
 */
export function shalfiForaDeVista(t, rng) {
  if (t.feito.lowarnizelAvisado || rng.die(2) === 1) {
    for (const k of ['shalfi', 'jitterjaws']) if (!t.mortos.includes(k)) t.mortos.push(k);
    t.feito.shalfiMortoPeloDragao = true;
    return t.feito.lowarnizelAvisado
      ? 'Lá do fundo do labirinto vem um estrondo, e depois um rugido longo. O Shalfi furou o teto do covil, e o Lowarnizel, avisado, estava esperando por ele.'
      : 'Lá do fundo do labirinto vem um estrondo, depois gritos, depois um rugido longo. O buraco do Shalfi chegou ao covil, e o dragão ganhou a briga.';
  }
  for (const k of ['lowarnizel', 'gossa']) if (!t.mortos.includes(k)) t.mortos.push(k);
  t.feito.dragaoMortoPeloShalfi = true;
  return 'Lá do fundo do labirinto vem um estrondo, depois gritos, e um rugido que para no meio. O buraco do Shalfi chegou ao covil sem ninguém avisar o dragão, e o dragão perdeu.';
}

/** A CORRENTE VIVA: cada elo, Constituição CD 15 (desvantagem de armadura de metal), 4d10 elétricos, metade se passar. */
export function correnteViva(enc, elos) {
  const linhas = [];
  for (const h of elos) {
    const sv = enc.resistencia(h, 'con', 15, { desvantagem: METAL(h), contra: { tipoDano: 'elétrico', magico: true } });
    const d = damageRoll(enc.rng, '4d10');
    const dano = sv.success ? Math.floor(d.total / 2) : d.total;
    enc.applyDamage(h, dano, 'elétrico', null, { magico: true });
    linhas.push(`${h.name} (Constituição ${sv.total}${METAL(h) ? ', com desvantagem pela armadura' : ''}): ${dano} elétricos.`);
  }
  return linhas;
}

export function criarLabirintoSalgado(app, config = {}) {
  const enc = app.enc;
  const root = app.root;
  const camp = (app.campanha ??= {});
  const t = estadoDoLabirinto(camp);
  const vila = (camp.vila ??= { pistas: [], missoes: {} });
  const estado = { explorando: false, encerrado: false, lutando: null };
  const todos = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead && !c.refemDoObelisco);
  const herois = () => todos().filter((c) => c.hp > 0);
  const painel = (texto, escolhas) => narrar(root, { formato: 'painel', paginas: [{ titulo: TITULO, texto: [].concat(texto) }], ...(escolhas ? { escolhas } : {}) });
  const pista = (txt) => { if (!(vila.pistas ??= []).includes(txt)) vila.pistas.push(txt); enc.say('acao', `Pista: ${txt}`); };
  const longe = (c, tile, pes = 5) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
  const aqui = (pts, tile) => [].concat(pts ?? []).some((q) => q.x === tile.x && q.y === tile.y);
  const vivo = (f) => f && !f.dead && f.hp > 0 && !f.fugiu;
  const melhor = (pericia) => herois().reduce((a, b) => (skillBonus(b, pericia) > skillBonus(a, pericia) ? b : a));
  const tem = (id) => herois().find((h) => garantirInventario(h).bag.some((i) => i.id === id && (i.qtd ?? 1) > 0));
  const tirar = (h, id) => {
    const bag = garantirInventario(h).bag;
    const i = bag.find((x) => x.id === id);
    if (!i) return;
    i.qtd = (i.qtd ?? 1) - 1;
    if (i.qtd <= 0) bag.splice(bag.indexOf(i), 1);
  };
  // os testes que a cena rola no LOBO OCCIPITAL (B1 a B5) têm vantagem em Percepção
  const perceber = (h, cd) => {
    const occ = P.lobos[salaNoLabirinto(h.pos)] === 'occipital';
    const a = rolarPericia(enc.rng, h, 'percepcao');
    const b = occ ? rolarPericia(enc.rng, h, 'percepcao') : a;
    const total = Math.max(a.total, b.total);
    return { total, passou: total >= cd, occ };
  };

  // ------------------------------------------------------------- o elenco ----
  const elenco = {};
  for (const [k, id, pos, nome, sala] of ELENCO) {
    if (t.mortos.includes(k)) continue;
    if (t.feito.githyankiForam && GITHYANKI_DO_LABIRINTO.includes(k)) continue;
    const m = makeMonster(id, { ...pos });
    if (nome) m.name = nome;
    m.chaveDoLabirinto = k;
    m.salaDoLabirinto = sala;
    m.side = 'neutro';
    elenco[k] = m;
  }
  const da = (sala) => Object.values(elenco).filter((m) => m.salaDoLabirinto === sala && vivo(m));

  // ------------------------------------------------------------ os flumphs ----
  // OS FLUMPHS RECRUTADOS (B11) lutam ao lado do grupo em toda luta do labirinto: nascem junto dos heróis como criaturas
  // que agem sozinhas (a marca `invocado`, que não segura a luta de pé nem vale XP) e vão embora com o fim dela. Não são
  // fanáticos: o ferido pela metade foge, e todos fogem da luta perdida (metade do grupo no chão). O que morre não volta.
  function chamarFlumphs() {
    estado.flumphs = [];
    const n = t.feito.flumphs ?? 0;
    const hs = herois();
    if (!n || !hs.length) return;
    for (let i = 0; i < n; i++) {
      const m = enc.invocar(hs[0], 'flumph', hs[i % hs.length].pos, { spellId: 'flumphsDoLabirinto' });
      if (!m) break;
      m.invocado.auto = true;
      m.flumphDoLabirinto = true;
      m.name = i === 0 && !t.feito.borblishMorto ? 'Sábio Borblish' : `Flumph ${i + 1}`;
      m.className = 'Aliado';
      estado.flumphs.push(m);
    }
    enc.say('acao', `${estado.flumphs.length > 1 ? `Os ${estado.flumphs.length} flumphs descem` : 'O flumph desce'} das bolhas para lutar ao lado de vocês.`);
  }
  function fugirFlumphs() {
    const fs = (estado.flumphs ?? []).filter((f) => !f.dead && !f.fugiu && enc.combatants.includes(f));
    if (!fs.length) return;
    const grupo = enc.combatants.filter((c) => c.side === 'party' && !c.invocado && !c.dead);
    const perdida = grupo.length && grupo.filter((h) => h.hp <= 0).length * 2 >= grupo.length;
    for (const f of fs) {
      if (!perdida && f.hp > f.maxHp / 2) continue;
      f.fugiu = true;
      enc.combatants.splice(enc.combatants.indexOf(f), 1);
      enc.say('acao', perdida ? `${f.name} fica carmesim de medo e foge: a luta está perdida.` : `${f.name}, ferido, fica azul e foge flutuando.`);
    }
  }

  // ------------------------------------------------------ o dia que passa ----
  async function passarDiaNoLabirinto() {
    if (!passarUmDia(t)) return;
    const txt = shalfiForaDeVista(t, enc.rng);
    for (const m of [elenco.shalfi, elenco.jitterjaws]) {
      if (!m || !t.mortos.includes(m.chaveDoLabirinto)) continue;
      m.dead = true;
      const i = enc.combatants.indexOf(m);
      if (i >= 0) enc.combatants.splice(i, 1);
    }
    await painel(txt);
    pista(t.feito.shalfiMortoPeloDragao ? 'O buraco do Shalfi furou o covil do dragão, e o Lowarnizel matou o Shalfi.' : 'O buraco do Shalfi furou o covil do dragão: o Lowarnizel e a Gossa estão mortos.');
    app.refresh();
  }

  // --------------------------------------------------------- as portas ----
  function porPorta(nome, aberta) {
    for (const p of P.portas[nome]) enc.field.porAresta(p.a.x, p.a.y, p.b.x, p.b.y, aberta ? ARESTA.aberta : ARESTA.parede);
    t.portas[nome] = aberta;
  }
  function abrirSecreta() {
    enc.field.porAresta(P.secreta.a.x, P.secreta.a.y, P.secreta.b.x, P.secreta.b.y, ARESTA.aberta);
    t.feito.secretaAchada = true;
  }

  // -------------------------------------------------------- explorar e lutar ----
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
    aplicarLobos();
    app.refresh();
  }

  function luta(quem, { furtividade = null } = {}) {
    for (const f of quem) {
      if (f.dead) continue;
      f.side = 'foes';
      if (!enc.combatants.includes(f)) enc.addCombatant(f);
    }
    estado.explorando = false;
    estado.lutando = [...quem];
    root.classList.remove('explorando');
    enc.emboscada = furtividade ? { emboscadores: 'foes', furtividade } : null;
    app.selected = null;
    chamarFlumphs();
    enc.start();
    aplicarLobos();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
    return true;
  }

  async function darXpDe(lista, motivo) {
    const grupo = todos();
    const xp = lista.filter((f) => f.dead || f.fugiu || f.rendido).reduce((s, f) => s + (f.xp ?? 0), 0);
    if (!grupo.length || !xp) return;
    const cada = Math.floor(xp / grupo.length);
    const sobem = darXp(grupo, cada);
    enc.say('cura', `${motivo}: ${cada} XP para cada um.`);
    if (sobem.length) for (const txt of await telaDeSubirNivel(root, sobem)) enc.say('cura', txt);
  }

  function sair(fazer) {
    estado.explorando = false;
    estado.encerrado = true;
    root.classList.remove('explorando');
    Refens.guardarRefens(enc, camp);
    fazer(todos());
  }

  // ------------------------------------------------------------ os lobos ----
  /** O LOBO PARIETAL: quem está nele não fica caído sem querer (a condição que o protege vai e vem com a casa). */
  function aplicarLobos() {
    for (const c of enc.combatants) {
      if (c.dead || !c.pos) continue;
      const parietal = P.lobos[salaNoLabirinto(c.pos)] === 'parietal';
      if (parietal && !hasCondition(c, 'loboParietal')) {
        addCondition(c, 'loboParietal', { rounds: Infinity, source: 'labirinto' });
        if (hasCondition(c, 'caido')) removeCondition(c, 'caido');
      }
      if (!parietal && hasCondition(c, 'loboParietal')) removeCondition(c, 'loboParietal');
      // o LOBO FRONTAL: o Ajudar vira ação bônus (só quem tem Inteligência 3 ou mais entende o lobo)
      const frontal = P.lobos[salaNoLabirinto(c.pos)] === 'frontal' && (c.abilities?.int ?? 10) >= 3;
      if (frontal && !hasCondition(c, 'loboFrontal')) addCondition(c, 'loboFrontal', { rounds: Infinity, source: 'labirinto' });
      if (!frontal && hasCondition(c, 'loboFrontal')) removeCondition(c, 'loboFrontal');
      // B15: o ASSOBIO, desvantagem em Inteligência e Sabedoria para quem não é devorador de mentes
      const assobio = salaNoLabirinto(c.pos) === 'B15' && !t.feito.arameCortado && !/devorador/i.test(c.name ?? '');
      if (assobio && !hasCondition(c, 'assobioDissonante')) addCondition(c, 'assobioDissonante', { rounds: Infinity, source: 'labirinto' });
      if (!assobio && hasCondition(c, 'assobioDissonante')) removeCondition(c, 'assobioDissonante');
    }
  }

  // ------------------------------------------------------- o Mublinesh e as portas ----
  /** Quantos passos de exploração dão o minuto que o Mublinesh espera (o labirinto não conta minutos). */
  const PASSOS_DO_MINUTO = 6;
  /** Ele só fecha porta de guarda em B14: vivo, sem ter lutado nem fugido, e sem devorador junto do grupo. */
  const mublineshDeGuarda = () => vivo(elenco.mublinesh) && elenco.mublinesh.side === 'neutro' && !t.feito.mublineshFugiu
    && enc.combatants.includes(elenco.mublinesh) && !herois().some((h) => /devorador/i.test(h.name ?? ''));
  async function mublineshFechaPortas() {
    const f = estado.mublineshFecha;
    if (!f) return;
    if (!mublineshDeGuarda()) { estado.mublineshFecha = null; return; }
    if (--f.passos > 0) return;
    estado.mublineshFecha = null;
    const naPorta = (nome) => P.portas[nome].some((p) => herois().some((h) => aqui([p.a, p.b], h.pos)));
    const fecha = f.portas.filter((n) => t.portas[n] && !naPorta(n));
    if (!fecha.length) return;
    for (const n of fecha) porPorta(n, false);
    enc.say('acao', `Lá de B14, um resmungo: — Ilvaash teria avisado. — Um raio do olho do Mublinesh empurra ${fecha.map((n) => NOME_DA_PORTA[n]).join(' e ')} até fechar.`);
    app.refresh();
  }

  // ------------------------------------------------------------ o relógio do portal ----
  // DEPOIS DA REFRAÇÃO, o portal de Illithinoch encolhe e fecha em uma hora (o livro). O labirinto não conta minutos, e
  // aqui eles se contam no passo: cada passo explorando é um minuto (a marcha cautelosa, com o labirinto tremendo), o
  // descanso do covil são oito horas e descer a Poça são horas. Fechado, quem ficou do lado de cá está preso: o jogo não
  // tem a Mudança de Plano, então resta o segundo portal, para o resto do Reino Distante.
  async function relogioDoPortal(minutos) {
    if (!t.feito.refracaoVencida || t.feito.portalFechado || t.portalMinutos == null) return false;
    const antes = t.portalMinutos;
    t.portalMinutos += minutos;
    if (antes < 45 && t.portalMinutos >= 45 && t.portalMinutos < 60) enc.say('acao', 'Lá na entrada, o portal de Illithinoch já está do tamanho de uma porta. Não falta muito.');
    if (t.portalMinutos < 60) return false;
    t.feito.portalFechado = true;
    await painel('Longe, para os lados da entrada, um estalo seco, como uma bolha que estoura. O portal de Illithinoch se fechou.');
    pista('O portal de Illithinoch fechou: o caminho de casa se foi. Resta o outro portal, em B1, para o resto do Reino Distante.');
    return false;
  }
  /** Os dias no Reino Distante: os do labirinto (o covil e o Jomlus) e os descansos no Vazio. */
  const diasNoReino = () => (t.dia ?? 0) + (camp.obelisco8?.vazio?.descansos ?? 0);

  // ------------------------------------------------------------- os gatilhos ----
  async function depoisDoPasso() {
    aplicarLobos();
    if (!estado.explorando) return false;
    await mublineshFechaPortas();
    if (await relogioDoPortal(1)) return true;
    // O SOCORRO entra em B22, onde a Refração guarda os presos (ela só nasce assim se o obelisco já virou pó)
    const soc = estadoDoSocorro(camp);
    if (soc?.presos?.length && !t.feito.refracaoVencida && !elenco.refracao && camp.obelisco8?.vazio?.feito?.anima?.obeliscoEmPo
      && herois().some((h) => salaNoLabirinto(h.pos) === 'B22')) return chegaARefracao({ peloSocorro: true });
    const hs = herois();
    const em = (sala) => hs.find((h) => salaNoLabirinto(h.pos) === sala);
    const pronto = (sala) => da(sala).filter((m) => m.side === 'neutro');

    // B11: a passagem secreta, notada de passagem (Percepção passiva 14, a até 3 m)
    if (!t.feito.secretaAchada) {
      const viu = hs.find((h) => distanceFt(h.pos, P.secreta.b) <= 10 && 10 + skillBonus(h, 'percepcao') >= 14);
      if (viu) {
        abrirSecreta();
        enc.say('acao', `${viu.name} nota uma fenda na parede de carne, que se abre ao toque como uma boca: uma passagem.`);
        app.refresh();
      }
    }
    // B3: as aranhas e os ashenwights
    if (em('B3') && pronto('B3').length) {
      await painel(['Teias finas como fumaça cobrem a sala, tão frágeis que se rasgam sozinhas ao passar, e engrossam até o breu junto da parede do fundo. Lá dentro, duas silhuetas cinzentas olham a parede sem se mexer.',
        'Duas aranhas de patas compridas, de um azul que não é deste mundo, descem das teias.'], [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      return luta(da('B3'));
    }
    // B4: chegar perto dos corpos da parede
    if (!t.feito.cranios && hs.some((h) => distanceFt(h.pos, P.cabecas) <= 10)) return acordarCranios();
    // B7: os githyanki
    if (em('B7') && pronto('B7').length && !t.feito.githyankiEmPaz) return githyanki();
    // B12: o encefálon
    if (em('B12') && pronto('B12').length) {
      await painel('Gosma nas paredes e no chão. Numa poça, um cérebro do tamanho de uma carroça, com tentáculos, acorda devagar; quatro pepitas de carne quicam em volta dele e viram para vocês.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      return luta(da('B12'));
    }
    // B14: o Mublinesh, que patrulha (não toca em quem anda com devorador; aqui ninguém anda)
    if (em('B14') && pronto('B14').length) {
      await painel(['Uma sala enorme, com duas portas duplas viradas para o mesmo lado e paredes derrubadas pela metade. Um globo de olhos do tamanho de uma carroça vira o olho grande para vocês, e a boca sorri.',
        '— Noventa e sete — diz ele, encantado. — Noventa e oito, noventa e nove, CEM! Obrigado. Obrigado por virem.'], [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      return luta(da('B14'));
    }
    // B15: o Mublinesh ferido, escondido atrás da lona
    if (em('B15') && t.feito.mublineshFugiu && vivo(elenco.mublinesh) && elenco.mublinesh.side === 'neutro') {
      elenco.mublinesh.pos = { ...elenco.mublinesh.pos, ...P.esconderijoDoMublinesh };
      if (!enc.combatants.includes(elenco.mublinesh)) enc.addCombatant(elenco.mublinesh);
      await painel('Atrás da lona, encolhido entre os arames, o globo de olhos que fugiu. Desta vez ele não agradece.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      return luta([elenco.mublinesh]);
    }
    // B15: a armadilha de arame, no quadrado da lona
    if (!t.feito.arameDisparou && !t.feito.arameCortado && hs.some((h) => aqui(P.arame, h.pos))) return dispararArame(hs.find((h) => aqui(P.arame, h.pos)));
    // B18: os zelotes tentaculados
    if (em('B18') && pronto('B18').length) {
      await painel(['Num nicho com dois catres, dois humanos de pele violeta, de tentáculos no lugar da boca, mexem numa roda oval que gira torta.',
        '— Não esperávamos ninguém — diz um deles, já se levantando.'], [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      return luta(da('B18'));
    }
    // B9: o Shalfi, B10: o Jomlus, B21: a Ashripask — só a chegada; o resto é conversa
    // O DRAGÃO CONVENCIDO sobe cavando por baixo da cova, e a luta com o Shalfi é dos três contra os dois
    if (em('B9') && t.feito.dragaoVaiAoShalfi && !t.feito.dragaoSubiu && vivo(elenco.shalfi) && elenco.shalfi.side === 'neutro') {
      t.feito.dragaoSubiu = true;
      t.feito.shalfiVisto = true;
      const dono = hs[0];
      const aliados = [];
      for (const [k, id, nome] of [['lowarnizel', 'lowarnizel', null], ['gossa', 'mago', 'Gossa']]) {
        if (t.mortos.includes(k)) continue;
        const m = makeMonster(id, { ...P.shalfi });
        const q = enc.casaLivreMaisProxima({ ...P.shalfi, f: m.pos.f });
        if (!q) continue;
        m.pos = { ...m.pos, x: q.x, y: q.y };
        if (nome) m.name = nome;
        m.chaveDoLabirinto = k;
        m.side = 'party';
        m.invocado = { donoId: dono.id, spellId: 'aliadoDoCovil', auto: true };
        enc.addCombatant(m);
        aliados.push(m);
      }
      estado.aliadosDoCovil = aliados;
      await painel(['O chão da cova estremece debaixo da pá do Shalfi. Ele para, sorri, e o sorriso some: a terra se abre de baixo para cima, e uma cabeça violeta enorme sai do buraco, com a Gossa agarrada ao pescoço.',
        '— ACHEI! — grita o Shalfi, sem medo nenhum, e o bolo de dentes do teto despenca sobre o dragão.'], [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      return luta([elenco.shalfi, elenco.jitterjaws].filter(vivo));
    }
    if (em('B9') && vivo(elenco.shalfi) && elenco.shalfi.side === 'neutro' && !t.feito.shalfiVisto) {
      t.feito.shalfiVisto = true;
      await painel('Num canto, uma cova rasa de borda preta. Um homem de roupa em farrapos cava com uma pá enferrujada, assobiando. Pendurado no teto acima dele, um bolo enorme de dentes e carne balança devagar, olhando a pá.');
      return false;
    }
    if (em('B10') && vivo(elenco.jomlus) && elenco.jomlus.side === 'neutro' && !t.feito.jomlusVisto) {
      t.feito.jomlusVisto = true;
      await painel(['Uma sala estreita onde qualquer palavra, em qualquer língua, chega a todos já entendida.',
        'Diante de um livro enorme aberto num calombo de carne, um globo de quatro olhos lê em voz alta, devagar, e erra a pronúncia de cada palavra comprida.']);
      return false;
    }
    if (em('B21') && vivo(elenco.ashripask) && elenco.ashripask.side === 'neutro' && !t.feito.ashripaskVista) {
      t.feito.ashripaskVista = true;
      await painel('Num nicho, entre dois bastões cônicos, uma mulher de cabeça de chacal levanta as mãos devagar, os dedos cheios de anéis. — Paz, paz. Não quero mal a ninguém.');
      return false;
    }
    return false;
  }

  async function acordarCranios() {
    t.feito.cranios = true;
    const cranios = P.cranios.map((p, i) => {
      const m = makeMonster('cranioFlamejante', { ...p });
      m.chaveDoLabirinto = `cranio${i + 1}`;
      m.salaDoLabirinto = 'B4';
      return m;
    });
    await painel('As cabeças dos cinco corpos da parede se soltam com um estalo de cartilagem e sobem, pegando fogo verde. Os crânios se viram para vocês, ainda gritando.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
    return luta(cranios);
  }

  async function dispararArame(quem) {
    t.feito.arameDisparou = true;
    const linhas = [`${quem.name} esbarra num arame que ninguém via. Ele arrebenta com um estalo que entra pela cabeça.`];
    for (const c of enc.combatants.filter((o) => !o.dead && o.pos && salaNoLabirinto(o.pos) === 'B15')) {
      const sv = enc.resistencia(c, 'wis', 18, { contra: { magico: true } });
      for (const tipo of ['psíquico', 'trovejante']) {
        const d = damageRoll(enc.rng, '5d10');
        const dano = sv.success ? Math.floor(d.total / 2) : d.total;
        enc.applyDamage(c, dano, tipo, null, { magico: true });
        linhas.push(`${c.name} (Sabedoria ${sv.total}): ${dano} ${tipo === 'psíquico' ? 'psíquicos' : 'trovejantes'}.`);
      }
    }
    await painel(linhas);
    app.refresh();
    return false;
  }

  async function githyanki() {
    const comEspada = tem('espadaDePrataDaVarakkta');
    const r = await painel(['Três sacos de dormir em volta de um baú. Três githyanki de armadura se levantam de uma vez, as espadas já na mão. A da frente, de cicatriz no rosto, vê vocês e aperta os olhos.',
      comEspada ? '— Essa espada — rosna ela, na língua de vocês, olhando o que um de vocês carrega. — É minha.' : '— Mais coisas do labirinto — diz ela. — Ou gente da superfície? Fale depressa.'], [
      ...(comEspada ? [{ rotulo: 'Devolver a espada de prata', valor: 'devolver', primaria: true }] : []),
      { rotulo: 'Conversar (Persuasão, CD 15)', valor: 'conversar', primaria: !comEspada },
      { rotulo: 'Às armas!', valor: 'luta' },
    ]);
    if (r === 'luta') return luta(da('B7'));
    if (r === 'conversar' && !comEspada) {
      const quem = melhor('persuasao');
      const teste = rolarPericia(enc.rng, quem, 'persuasao');
      if (teste.total < 15) {
        await painel(`${quem.name} (${SKILL_NAME.persuasao} ${teste.total}) mal abre a boca, e a cavaleira já decidiu que vocês são do labirinto.`, [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
        return luta(da('B7'));
      }
    } else if (r === 'conversar' && comEspada) {
      await painel('A cavaleira não ouve nada enquanto a espada dela estiver na mão de outro.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      return luta(da('B7'));
    } else {
      tirar(comEspada, 'espadaDePrataDaVarakkta');
      t.feito.espadaDevolvida = true;
    }
    t.feito.githyankiEmPaz = true;
    await contarGithyanki();
    return false;
  }

  async function contarGithyanki() {
    await painel(['A Varakkta fala pouco e desconfia de tudo, mas fala:',
      '— Os dois bastões da parede dão choque e abrem a porta grande de lá, a de B14. — Ela não diz que o choque dói.',
      '— Depois dos anões mortos e das teias, anda um bicho enorme em forma de cérebro.',
      '— O músico que cava ali do lado resmungou de três devoradores que passaram com gente da superfície, presa.',
      '— Onde há devoradores neste lugar? E como se sai? — Ela não acredita em nada do que vocês respondem.']);
    pista('A Varakkta: os bastões do acampamento dos githyanki abrem a porta traseira, a de B14; um bicho em forma de cérebro anda depois das teias; três devoradores passaram com presos da superfície.');
    if (!vivo(elenco.varakkta) || t.feito.githyankiForam) return;
    // Contado o portal de B1, ela decide atacar a fortaleza dos devoradores (`illithinoch.js ataqueDosGithyanki`)
    const r = await painel('Ela espera a resposta: onde há devoradores, e por onde se sai.', [
      { rotulo: 'Contar do portal de B1, para Illithinoch', valor: 'portal', primaria: true },
      { rotulo: 'Não dizer nada', valor: 'nao' },
    ]);
    if (r !== 'portal') return;
    t.feito.githyankiForam = true;
    t.feito.varakktaAtacaIllithinoch = true;
    for (const k of GITHYANKI_DO_LABIRINTO) {
      const g = elenco[k];
      if (!g) continue;
      const i = enc.combatants.indexOf(g);
      if (i >= 0) enc.combatants.splice(i, 1);
    }
    await painel(['— Uma fortaleza cheia deles, do outro lado de um portal. — Pela primeira vez a Varakkta sorri, e não é um sorriso bonito. Ela já está de pé, juntando as armas.',
      '— Se for mentira, eu volto. — Os três saem pelo corredor, na direção da entrada, sem olhar para trás. Ela continua certa de que vocês vão traí-la.']);
    pista('A Varakkta e os dois guerreiros foram atacar Illithinoch pelo portal de B1.');
    app.refresh();
  }

  // --------------------------------------------------------------- o evento ----
  function evento(ev) {
    Refens.eventoDosRefens(enc, camp, ev);
    if (ev.type === 'downed' && ev.target && hasCondition(ev.target, 'loboParietal') && hasCondition(ev.target, 'caido')) removeCondition(ev.target, 'caido');
    if (['damage', 'died', 'downed'].includes(ev.type) && estado.flumphs?.length) fugirFlumphs();
    if (ev.type !== 'died' && ev.type !== 'damage') return;
    const m = ev.target;
    // B3: morto um ashenwight, o outro se rende
    const ash = [elenco.ashenwight1, elenco.ashenwight2].filter(Boolean);
    if (ev.type === 'died' && ash.includes(m)) {
      const outro = ash.find((a) => a !== m && vivo(a) && a.side === 'foes' && !a.rendido);
      if (outro) {
        outro.rendido = true;
        outro.side = 'neutro';
        enc.say('acao', `${outro.name} recua para o escuro das teias e baixa as mãos. — Ele mentiu para nós — diz, sem dizer quem. — Ele vê tudo.`);
        enc.checkEnd();
        app.refresh();
      }
    }
    // B7: os guerreiros se rendem quando a Varakkta cai
    if (ev.type === 'died' && m === elenco.varakkta) {
      for (const g of [elenco.kianka, elenco.vazzi]) {
        if (!vivo(g) || g.side !== 'foes') continue;
        g.rendido = true;
        g.side = 'neutro';
      }
      enc.say('acao', 'Os dois guerreiros githyanki largam as espadas no chão.');
      enc.checkEnd();
      app.refresh();
    }
    // B14: o Mublinesh foge para B15 abaixo de 50 PV
    const mb = elenco.mublinesh;
    if (ev.type === 'damage' && m === mb && vivo(mb) && mb.side === 'foes' && mb.hp < 50 && !t.feito.mublineshFugiu) {
      t.feito.mublineshFugiu = true;
      mb.side = 'neutro';
      mb.fugiu = false;
      const i = enc.combatants.indexOf(mb);
      if (i >= 0) enc.combatants.splice(i, 1);
      enc.say('acao', '— Não! Não, não, não. — O Mublinesh some pela parede derrubada, para a sala da lona.');
      enc.checkEnd();
      app.refresh();
    }
  }

  // ------------------------------------------------------------- o fim ----
  // ------------------------------------------------------ a Refração de Ilvaash ----
  /** Onde a Refração espera: dentro de B22, encostada na porta da frente (a única saída), com a pegada de 3x3. */
  const CASA_DA_REFRACAO = { x: 30, y: 18 };
  /** De onde o verme sobe: o meio da poça. */
  const CASA_DO_VERME = { x: P.poca.x - 1, y: P.poca.y - 1 };

  async function chegaARefracao({ peloSocorro = false } = {}) {
    const ref = makeMonster('refracaoDeIlvaash', { ...CASA_DA_REFRACAO });
    ref.chaveDoLabirinto = 'refracao';
    elenco.refracao = ref;
    enc.addCombatant(ref);
    const vermeVivo = !camp.obelisco8?.poca?.vermeMorto;
    // OS REFÉNS: ela os mira de propósito, com a garra que alcança 36 m, para desesperar quem os protege (o livro)
    const refens = enc.combatants.filter((c) => c.refemDoObelisco && !c.dead);
    if (refens.length) ref.alvosPreferidos = refens.map((r) => r.id);
    await painel([peloSocorro
      ? 'O ar de B22 pesa mais do que no resto do labirinto. Entre vocês e a poça, onde os outros estão colados na parede, flutua um cérebro enorme e meio transparente, com garras compridas penduradas embaixo dele.'
      : 'Vocês saem do líquido para a beira da poça, e o ar do labirinto pesa mais do que antes. Diante da porta da frente, a única saída, flutua um cérebro enorme e meio transparente, como uma lembrança de cérebro, com garras compridas penduradas embaixo dele.',
      'A voz dele não entra pelos ouvidos. Ela já está lá dentro, cansada e enorme: vocês tiraram uma coisa dele, e agora ele vai tirar tudo de vocês. Sair, ninguém sai.',
      ...(refens.length ? ['As garras dele se viram, devagar, para os de Phandalin que vocês trouxeram. — Primeiro, os pequenos — diz a voz. — Para vocês verem.'] : [])],
    [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
    luta([ref]);
    // o verme púrpura, se ainda vive, sobe da poça no começo da 3ª rodada (o motor chama com o número da rodada)
    enc.reinforcements = vermeVivo ? (rodada) => {
      if (rodada !== 3) return null;
      const v = makeMonster('vermePurpura', { ...CASA_DO_VERME });
      v.chaveDoLabirinto = 'vermeDaRefracao';
      elenco.vermeDaRefracao = v;
      v.side = 'foes';
      (estado.lutando ??= []).push(v);
      return { units: [v], aviso: 'A poça ferve, e o verme púrpura sobe de dentro dela, atrás de vocês.' };
    } : null;
    return true;
  }

  /**
   * O LADO DE LÁ DO SEGUNDO PORTAL. O livro não o escreve: dá só ganchos para outra aventura (os portos seguros dos
   * exploradores do Reino Distante, a vingança de Ilvaash). Aqui ele é um FIM: quem atravessa deixa Phandalin para trás,
   * curada, e a campanha termina com o que o grupo leva consigo. Texto nosso.
   */
  async function atravessarOSegundoPortal() {
    const r = await painel(['O segundo portal não tem borda: as cores de dentro escorrem para fora e voltam. Do outro lado não há labirinto nem ilhas, só a distância, enorme, e coisas que nadam nela.',
      'Quem atravessar não volta por este caminho. Phandalin está curada, e ninguém lá vai saber o que foi feito de vocês.'], [
      { rotulo: 'Ainda não', valor: 'nao', primaria: true },
      { rotulo: 'Atravessar', valor: 'sim' },
    ]);
    if (r !== 'sim') return;
    estado.encerrado = true;
    camp.obelisco8.feito.segundoPortal = true;
    await narrar(root, { formato: 'tela', paginas: [{ titulo: 'Além do segundo portal', texto: [
      'O portal se fecha atrás de vocês sem barulho. A luz aqui não vem de lugar nenhum e não ilumina nada.',
      'Dizem que há portos seguros no Reino Distante, para quem sabe procurar: uma colônia de fungos que choram com rostos pequenos, uma abadia de nagas que guardam segredos. Dizem também que Ilvaash não esquece quem o feriu.',
      'Em Phandalin, a vila curada conta a história de quem a salvou e não voltou. A história de vocês continua, mas não aqui.',
    ] }] });
    app.encerrarPartida();
  }

  async function venceuARefracao() {
    t.feito.refracaoVencida = true;
    (camp.obelisco8.feito ??= {}).refracaoVencida = true;
    await painel(['O cérebro fantasma se desfaz como névoa num vento que não existe. O labirinto inteiro estremece, das paredes ao chão, e em algum lugar longe alguma coisa enorme geme.',
      'O que ainda mora aqui entendeu o golpe que Ilvaash levou. Ninguém vai incomodar vocês na saída: cada um está ocupado salvando a própria pele.',
      'Lá na entrada, o portal de Illithinoch começou a encolher. Ao lado dele, outro se abriu, cheio de cores que não deviam existir juntas.']);
    pista('A Refração de Ilvaash foi destruída. Em B1, o portal de Illithinoch está fechando; ao lado dele, abriu-se outro, para o resto do Reino Distante. É hora de voltar para casa: o portal fecha em uma hora.');
    t.portalMinutos = 0;
  }

  async function fimDoCombate(outcome) {
    const lutou = estado.lutando ?? [];
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      // vencidos pela Refração, o livro manda o grupo de socorro (`socorro-obelisco.js`)
      if (elenco.refracao && lutou.includes(elenco.refracao) && await oferecerSocorro(app, camp, enc.combatants.filter((c) => c.side === 'party' && !c.refemDoObelisco && !c.invocado), 'refracao')) return;
      await narrar(root, { formato: 'tela', paginas: [{ titulo: TITULO, texto: ['As paredes de carne se fecham devagar sobre os corpos, como sobre todos os outros que o labirinto já engoliu.'] }] });
      app.encerrarPartida();
      return;
    }
    for (const f of lutou) if ((f.dead || f.fugiu) && f.chaveDoLabirinto && !f.chaveDoLabirinto.startsWith('cranio')) t.mortos.push(f.chaveDoLabirinto);
    // o dragão e a Gossa, que subiram para pegar o Shalfi, descem de volta ao covil
    for (const a of estado.aliadosDoCovil ?? []) {
      if (a.dead && !t.mortos.includes(a.chaveDoLabirinto)) t.mortos.push(a.chaveDoLabirinto);
      const i = enc.combatants.indexOf(a);
      if (i >= 0) enc.combatants.splice(i, 1);
    }
    if (estado.aliadosDoCovil?.length && t.mortos.includes('shalfi')) {
      t.feito.shalfiMortoPeloDragao = true;
      await painel('O dragão sacode a terra das escamas. — Agora a casa fica quieta. — Ele e a Gossa descem de volta pelo buraco, sem pressa.');
    }
    estado.aliadosDoCovil = [];
    // os flumphs que morreram não voltam
    const flumphsMortos = (estado.flumphs ?? []).filter((f) => f.dead);
    if (flumphsMortos.length) {
      if (flumphsMortos.some((f) => f.name === 'Sábio Borblish')) t.feito.borblishMorto = true;
      t.feito.flumphs = Math.max(0, (t.feito.flumphs ?? 0) - flumphsMortos.length);
      enc.say('acao', `${flumphsMortos.length > 1 ? `${flumphsMortos.length} flumphs morreram` : 'Um flumph morreu'} na luta.`);
    }
    estado.flumphs = [];
    await darXpDe(lutou.filter((f) => !(f === elenco.mublinesh && t.feito.mublineshFugiu && !f.dead)), TITULO);
    if (lutou.some((f) => f.rendido && /ashenwight/.test(f.chaveDoLabirinto ?? ''))) {
      await painel('O ashenwight que se rendeu resmunga contra Ilvaash, que os trouxe e os largou, e logo se cala, olhando o teto como quem é ouvido.');
    }
    if (lutou.includes(elenco.varakkta) && elenco.varakkta.dead && (vivo(elenco.kianka) || vivo(elenco.vazzi))) await contarGithyanki();
    if (lutou.includes(elenco.aglomerado) && elenco.aglomerado.dead) t.feito.encefalonMorto = true;
    if (elenco.refracao && lutou.includes(elenco.refracao) && elenco.refracao.dead) {
      // o verme que subiu e não morreu volta para o fundo da poça
      const v = elenco.vermeDaRefracao;
      if (v && !v.dead) { const i = enc.combatants.indexOf(v); if (i >= 0) enc.combatants.splice(i, 1); }
      if (v?.dead) (camp.obelisco8.poca ??= {}).vermeMorto = true;
      await venceuARefracao();
    }
    prepararExploracao();
  }

  // ------------------------------------------------- as conversas ----
  const arvoreShalfi = () => ({
    inicio: 'oi',
    nos: {
      oi: {
        fala: 'Hm? Ah. Gente. — Ele não para de cavar. — Não tenho tempo. O buraco não se cava sozinho. Bom, quase.',
        opcoes: [
          { texto: 'O que você está cavando?', vai: 'buraco' },
          { texto: 'Quem é você? Há quanto tempo está aqui?', vai: 'quem' },
          { texto: 'Podemos ajudar a cavar.', vai: 'ajuda' },
          { texto: 'Pare de cavar.', fim: 'atacar' },
          { texto: 'Deixá-lo cavando.', fim: 'sai' },
        ],
      },
      buraco: {
        fala: 'O dragão. Está aí embaixo, eu sinto. Vou achar e vou matar. — O bolo de dentes no teto estala, contente. — Quando cansar, eu toco. A música fica esperando, ali na sala do lado.',
        ao: () => pista('O Shalfi cava atrás de um dragão, logo abaixo da cova dele, e a fusão de carne no teto rói o buraco. Ele diz que a música que toca "fica esperando" na sala do lado.'),
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      quem: {
        fala: 'Shalfi. Acho. — Ele franze a testa. — Não sei quando dormi. Não lembra. Não importa: o buraco importa.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      ajuda: {
        fala: 'Não. — A pá para. Ele olha vocês pela primeira vez. — Vocês trabalham para o dragão, não é?',
        opcoes: [{ texto: 'Recuar devagar.', fim: 'sai' }, { texto: 'Insistir.', fim: 'atacar' }],
      },
    },
  });

  const arvoreJomlus = () => ({
    inicio: 'oi',
    nos: {
      oi: {
        fala: 'Silêncio. Estou na página quatrocentos e doze. — Os quatro olhos de cima não saem do livro. — "Ver-da-des da men-te vol-ta-da para..." Não. De novo.',
        opcoes: [
          { texto: 'O que é este livro?', vai: 'livro' },
          { texto: 'Há perigo por aqui?', vai: 'perigo' },
          { texto: 'As coisas do sábio, na pilha. Podemos levar? (Persuasão, CD 16)', vai: 'coisas', requer: () => (t.feito.coisasDoKlaudel ? 'já levaram' : null) },
          { texto: 'Sentar e ouvir a leitura (um dia inteiro).', vai: 'ler', requer: () => (herois().every((h) => h.features?.includes('bencaoSolipsista')) ? 'todos já ouviram' : null) },
          { texto: 'Pegar o livro.', fim: 'atacar' },
          { texto: 'Deixá-lo lendo.', fim: 'sai' },
        ],
      },
      ler: {
        fala: 'Ouvir? — Os quatro olhos de cima se viram ao mesmo tempo. — Ninguém nunca quis ouvir. Sentem. Sem interromper. A página quatrocentos e doze é longa.',
        opcoes: [{ texto: 'Sentar e ouvir.', fim: 'ler' }, { texto: 'Melhor não.', vai: 'oi' }],
      },
      livro: {
        fala: 'Um sábio o trouxe para cá achando que esta sala o tornaria legível. Não tornou. Ele me chamou para ler em voz alta, e passou semanas corrigindo a minha pronúncia. Depois morreu, e a parede o comeu. Eu continuo.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      perigo: {
        fala: 'Um encefálon anda aqui perto. Não me incomoda: acha que eu sou um observador de verdade. — Isso parece agradá-lo muito.',
        ao: () => pista('O Jomlus: um encefálon ronda perto da sala dele.'),
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      coisas: {
        fala: 'Hm.',
        opcoes: [{ texto: 'Pedir com jeito.', fim: 'pedir' }],
      },
    },
  });

  const arvoreAshripask = () => ({
    inicio: 'oi',
    nos: {
      oi: {
        fala: 'Sou só uma estudiosa. Estes bastões abrem uma porta, sabem? Mas não só: ligam-se a tudo o que há neste labirinto, mais fundo. Fascinante.',
        opcoes: [
          { texto: 'O que você faz aqui?', vai: 'missao' },
          { texto: 'Os bastões abrem que porta?', vai: 'bastoes' },
          { texto: 'O que mais há no labirinto?', vai: 'moradores' },
          { texto: 'Atacar a Ashripask.', fim: 'atacar' },
          { texto: 'Deixá-la.', fim: 'sai' },
        ],
      },
      missao: {
        fala: 'Saber proibido, o melhor que há. Contratei uma mercenária, a Nellik, e os soldados dela. Dormi, e quando acordei tinham ido embora. — O sorriso some. — Quero a Nellik morta. Para servir de exemplo. Uma gárgula musculosa: não há como errar.',
        ao: () => { t.feito.pedidoDaAshripask = true; pista('A Ashripask quer a Nellik morta: a mercenária que a largou com os soldados. "Uma gárgula musculosa".'); },
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      bastoes: {
        fala: 'A porta da frente, ao lado da poça. Mas são dois bastões a seis metros um do outro: é preciso uma corrente de quatro, de mão dada. Eu não seguro bastão nenhum, obrigada.',
        ao: () => pista('Os bastões da Ashripask abrem a porta da frente, entre a poça e B18, e pedem uma corrente de quatro.'),
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      moradores: {
        fala: 'Sobrecarreguei um bastão com um relâmpago e no instante seguinte ouvi o labirinto inteiro pensar. Há um nicho escondido onde umas águas-vivas voadoras conversam sem parar, junto da sala do encefálon. — Ela conta os outros nos dedos.',
        ao: () => { t.feito.ashripaskContou = true; pista('A Ashripask: há uma câmara escondida perto do encefálon, cheia de flumphs.'); },
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
    },
  });

  async function depoisDaConversa(npc, fim) {
    if (npc === elenco.shalfi && fim === 'atacar') return luta([elenco.shalfi, elenco.jitterjaws].filter(vivo));
    if (npc === elenco.jomlus) {
      if (fim === 'atacar') return luta([elenco.jomlus]);
      // A BÊNÇÃO DA MENTE SOLIPSISTA: 24 horas ouvindo o Jomlus. Passa um dia (o relógio do Shalfi anda), e cada um que
      // ouviu ganha a ação de fechar a mente (`magias-de-itens.js menteSolipsista`), que volta no descanso longo.
      if (fim === 'ler') {
        const ouvem = herois().filter((h) => !h.features?.includes('bencaoSolipsista'));
        for (const h of ouvem) {
          (h.features ??= []).push('bencaoSolipsista');
          (h.resourcesMax ??= {}).menteSolipsista = 1;
          (h.resources ??= {}).menteSolipsista = 1;
        }
        t.feito.leuComJomlus = true;
        await painel(['Vocês sentam no chão de carne e ouvem. O Jomlus lê devagar, erra, volta, lê de novo. As horas passam sem que ninguém sinta fome. Em algum momento o texto deixa de ser palavra e vira uma ideia que não sai mais da cabeça: o mundo cabe inteiro dentro da mente de quem o pensa.',
          `Quando ele fecha o livro, um dia inteiro passou. ${ouvem.map((h) => h.name).join(', ')} ${ouvem.length > 1 ? 'saem' : 'sai'} com a Bênção da Mente Solipsista: uma vez por descanso longo, uma ação fecha a mente sobre si mesma por uma hora — 1d8 a mais em Inteligência e Sabedoria, e nenhuma reação.`]);
        await passarDiaNoLabirinto();
        app.refresh();
        return null;
      }
      if (fim === 'pedir') {
        const quem = melhor('persuasao');
        const teste = rolarPericia(enc.rng, quem, 'persuasao');
        if (teste.total < 16) { await painel(`${quem.name} (${SKILL_NAME.persuasao} ${teste.total}) pede. — Não — diz o Jomlus, e volta para a página.`); return null; }
        t.feito.coisasDoKlaudel = true;
        guardar(quem, 'oculosDoKlaudel', 1);
        guardar(quem, 'pergaminhoDeCompreenderIdiomas', 2);
        guardar(quem, 'pergaminhoDeLinguas', 1);
        await painel(`${quem.name} (${SKILL_NAME.persuasao} ${teste.total}) fala da pronúncia certa de uma palavra difícil. O Jomlus pensa, concorda, e empurra a pilha com um olho: os óculos e três pergaminhos.`);
        app.refresh();
      }
    }
    if (npc === elenco.ashripask && fim === 'atacar') return luta([elenco.ashripask]);
    return null;
  }

  // ------------------------------------------------------- os bastões ----
  async function descarregar(sala, c) {
    const b = BASTOES[sala];
    const perto = herois().filter((h) => b.pontos.some((p) => distanceFt(h.pos, p) <= 10));
    const elos = b.elos > 1 ? perto.slice(0, b.elos) : [c];
    if (elos.length < b.elos) {
      await painel(`Os dois bastões ficam a seis metros um do outro: são precisos ${b.elos} de mão dada entre eles, e há ${perto.length} perto.`);
      return;
    }
    const linhas = [`${elos.map((h) => h.name).join(', ')} ${elos.length > 1 ? 'fecham a corrente' : 'segura os dois bastões'}. A descarga atravessa ${elos.length > 1 ? 'todos' : 'o corpo'} com um estalo.`, ...correnteViva(enc, elos)];
    for (const nome of b.abre) if (!t.portas[nome]) porPorta(nome, true);
    // O MUBLINESH vê abrir uma porta de B14, espera um minuto por devoradores e, sem nenhum, a fecha com o raio telecinético
    const deB14 = b.abre.filter((n) => n === 'traseira' || n === 'central');
    if (deB14.length && mublineshDeGuarda()) estado.mublineshFecha = { portas: deB14, passos: PASSOS_DO_MINUTO };
    linhas.push(`Longe, ${b.abre.map((n) => NOME_DA_PORTA[n]).join(', ')} ${b.abre.length > 1 ? 'se abrem' : 'se abre'}, com um som de carne descolando.`);
    await painel(linhas);
    app.refresh();
  }

  // ------------------------------------------------------- as interações ----
  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    for (const [sala, b] of Object.entries(BASTOES)) {
      if (!aqui(b.pontos, tile)) continue;
      if (sala === 'B21' && vivo(elenco.ashripask) && elenco.ashripask.side === 'neutro' && !t.feito.ashripaskVista) continue;
      ops.push({ rotulo: 'Segurar os bastões', icone: 'acao-usarObjeto', detalhe: `${b.elos > 1 ? `corrente de ${b.elos}, ` : ''}Constituição CD 15`, motivo: longe(c, tile), fazer: () => descarregar(sala, c) });
    }
    // B2: a capa
    if (aqui(P.capa, tile) && !t.feito.capa) {
      ops.push({ rotulo: 'Tirar a capa do corpo', icone: 'acao-usarObjeto', motivo: longe(c, tile), fazer: async () => {
        t.feito.capa = true;
        guardar(c, 'capaDeAumento', 1);
        enc.field.alternarSobreposicao?.('capaTirada', true);
        await painel(`Um dos duergar ainda veste uma capa cinza-arroxeada, de runas de prata na barra, dura de sangue seco. ${c.name} a solta do corpo.`);
        app.refresh();
      } });
    }
    // B4: tocar os corpos
    if (aqui(P.cabecas, tile) && !t.feito.cranios) {
      ops.push({ rotulo: 'Tocar os corpos da parede', icone: 'acao-procurar', motivo: longe(c, tile), fazer: () => acordarCranios() });
    }
    // B5: a espada e a gosma
    if (aqui(P.espada, tile)) {
      if (!t.feito.espada) {
        ops.push({ rotulo: 'Arrancar a espada', icone: 'acao-usarObjeto', motivo: longe(c, tile), fazer: async () => {
          t.feito.espada = true;
          guardar(c, 'espadaDePrataDaVarakkta', 1);
          const r = rolarPericia(enc.rng, c, 'historia');
          await painel([`A espada sai da parede sem esforço. A bola de vísceras cai no chão com um ruído molhado, e o furo na carne se fecha.`,
            r.total >= 14 ? `${c.name} (${SKILL_NAME.historia} ${r.total}) reconhece a lâmina: uma das espadas de prata dos cavaleiros githyanki, que eles não perdem nunca.` : `Uma espada grande, de lâmina prateada e serrilhada, leve demais para o tamanho.`]);
          app.refresh();
        } });
      }
      if (!t.feito.gosma) {
        ops.push({ rotulo: 'Tocar a gosma', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
          t.feito.gosma = true;
          const salas = ['B1', 'B2', 'B3', 'B4', 'B5'];
          if (enc.field.explorado) for (const s of salas) for (const q of P.salas[s]) enc.field.explorado[q.y * enc.field.width + q.x] = 1;
          await painel(`${c.name} toca a gosma, e por um instante vê de cima, como um pássaro, os corredores em volta: a entrada, os anões mortos, as teias, a parede dos corpos e este jardim de tumores.`);
          app.refresh();
        } });
      }
    }
    // B6: tocar música para as sombras
    if (aqui(P.sombras, tile) && !t.feito.musica) {
      ops.push({ rotulo: 'Tocar ou cantar', icone: 'acao-usarObjeto', detalhe: 'Atuação CD 13', motivo: longe(c, tile, 10), fazer: async () => {
        t.feito.musica = true;
        const r = rolarPericia(enc.rng, c, 'atuacao');
        if (r.total >= 13) { await painel(`${c.name} (${SKILL_NAME.atuacao} ${r.total}) toca. As sombras velhas se apagam, e sombras novas dançam a música de ${c.name}.`); return; }
        const n = 1 + enc.rng.die(4);
        const espectros = Array.from({ length: n }, (_, i) => {
          const m = makeMonster('wraith', { ...P.sombras });
          const q = enc.casaLivreMaisProxima({ ...P.sombras });
          if (q) m.pos = { ...m.pos, x: q.x, y: q.y };
          m.chaveDoLabirinto = `espectro${i + 1}`;
          return m;
        });
        await painel(`${c.name} (${SKILL_NAME.atuacao} ${r.total}) desafina. As sombras param de dançar, encorpam, e saem do nicho: ${n} espectros, fazendo barulho de mais.`, [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
        luta(espectros);
      } });
    }
    // B7: o baú dos githyanki (em paz ou com eles fora)
    if (aqui(P.bauB7, tile) && !t.feito.bauB7 && (t.feito.githyankiEmPaz ? false : !da('B7').some((m) => !m.rendido))) {
      ops.push({ rotulo: 'Abrir o baú', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
        t.feito.bauB7 = true;
        guardar(c, 'esmeraldaDosGithyanki', 4);
        guardar(c, 'caixaDeMusicaDePlatina', 1);
        guardar(c, 'garfosDePrata', 1);
        await painel(`Dentes de troféu, quatro esmeraldas grandes, uma caixa de música de platina e uma caixa de garfos de prata. ${c.name} guarda o que vale.`);
        app.refresh();
      } });
    }
    // B8: a rolha
    if (aqui(P.barrilete, tile) && !t.feito.rolha) {
      ops.push({ rotulo: 'Olhar o barrilete', icone: 'acao-procurar', motivo: longe(c, tile), fazer: () => { t.feito.rolha = true; guardar(c, 'rolhaDeOuro', 1); enc.say('acao', `Cerveja fraca, mas a rolha é de ouro. ${c.name} a guarda.`); app.refresh(); } });
    }
    // B9: a flauta, com o Shalfi fora
    if (aqui(P.shalfi, tile) && !t.feito.flauta && !vivo(elenco.shalfi)) {
      ops.push({ rotulo: 'Pegar a flauta', icone: 'acao-usarObjeto', motivo: longe(c, tile), fazer: () => { t.feito.flauta = true; guardar(c, 'flautaDePaDeMarfim', 1); enc.say('acao', `${c.name} guarda a flauta de pã de marfim do Shalfi.`); app.refresh(); } });
    }
    // B10: o livro, com o Jomlus fora
    if (aqui(P.livro, tile) && !t.feito.tomo && !vivo(elenco.jomlus)) {
      ops.push({ rotulo: 'Levar o livro', icone: 'acao-usarObjeto', motivo: longe(c, tile), fazer: () => {
        t.feito.tomo = true;
        guardar(c, 'tomoDaMenteVoltadaParaDentro', 1);
        enc.field.alternarSobreposicao?.('livroTirado', true);
        enc.say('acao', `${c.name} fecha o livro enorme e o leva.`);
        app.refresh();
      } });
    }
    // B11: procurar a passagem
    if (!t.feito.secretaAchada && distanceFt(tile, P.secreta.b) <= 5) {
      ops.push({ rotulo: 'Procurar uma passagem', icone: 'acao-procurar', detalhe: t.feito.ashripaskContou ? 'Percepção CD 14, com vantagem' : 'Percepção CD 14', motivo: longe(c, tile, 10), fazer: async () => {
        const a = perceber(c, 14);
        const b2 = t.feito.ashripaskContou ? perceber(c, 14) : a;
        const total = Math.max(a.total, b2.total);
        if (total < 14) { await painel(`${c.name} (${SKILL_NAME.percepcao} ${total}) passa a mão na parede de carne, e ela é só parede.`); return; }
        abrirSecreta();
        await painel(`${c.name} (${SKILL_NAME.percepcao} ${total}) acha uma fenda na carne, que se abre ao toque como uma boca.`);
        app.refresh();
      } });
    }
    // B11: os flumphs
    if (aqui(P.rasgo, tile) && t.feito.secretaAchada) {
      ops.push({ rotulo: 'Falar com os flumphs', icone: 'acao-procurar', motivo: longe(c, tile, 15), fazer: () => flumphs(c) });
    }
    // B15: achar e cortar o arame
    if (aqui(P.lona, tile) && !t.feito.arameDisparou && !t.feito.arameCortado) {
      if (!t.feito.arameAchado) {
        ops.push({ rotulo: 'Examinar a lona', icone: 'acao-procurar', detalhe: 'Investigação CD 16, com desvantagem do assobio', motivo: longe(c, tile, 10), fazer: async () => {
          const a = rolarPericia(enc.rng, c, 'investigacao');
          const b2 = rolarPericia(enc.rng, c, 'investigacao');
          const total = Math.min(a.total, b2.total);
          if (total < 16) { await painel(`${c.name} (${SKILL_NAME.investigacao} ${total}, com o assobio na cabeça) não vê nada além da lona rasgada.`); return; }
          t.feito.arameAchado = true;
          await painel(`${c.name} (${SKILL_NAME.investigacao} ${total}) vê, atrás da lona, uma teia de arames esticados no quadrado inteiro. Tocar um deles seria mau negócio.`);
        } });
      } else {
        ops.push({ rotulo: 'Cortar os arames', icone: 'acao-usarObjeto', detalhe: 'ferramentas de ladrão, Destreza CD 16', motivo: longe(c, tile, 10), fazer: async () => {
          const r = enc.rng.die(20) + abilityMod(c.abilities?.dex ?? 10) + (c.toolProf?.includes?.('ferramentasDeLadrao') || c.features?.includes('thievesCant') ? (c.proficiency ?? 2) : 0);
          if (r < 16) return dispararArame(c);
          t.feito.arameCortado = true;
          aplicarLobos();
          await painel(`${c.name} (Destreza ${r}) corta os arames um a um, devagar. O assobio para, e a dor de cabeça vai embora junto.`);
          app.refresh();
        } });
      }
    }
    // B16: descer pela corda
    if (aqui(P.buracoB16, tile)) {
      ops.push({ rotulo: 'Descer pela corda', icone: 'acao-disparada', detalhe: 'seis metros', motivo: longe(c, tile), fazer: () => sair((v) => app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'covilLowarnizel', continuarCom: v })) });
    }
    // B18: o baú
    if (aqui(P.bauB18, tile) && !da('B18').length && !t.feito.bauB18) {
      ops.push({ rotulo: 'Abrir o baú', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => { t.feito.bauB18 = true; await painel('Roupas e ferramentas que não servem para nada. Os dois colecionavam defeitos.'); } });
    }
    // B19: os cristais
    if (aqui(P.cristaisB19, tile)) {
      ops.push({ rotulo: 'Tocar um cristal', icone: 'acao-procurar', detalhe: 'Inteligência CD 18', motivo: longe(c, tile), fazer: async () => {
        const sv = enc.resistencia(c, 'int', 18, { contra: { magico: true } });
        if (sv.success) { await painel(`${c.name} (Inteligência ${sv.total}) toca o cristal e recua a tempo: o que ele guarda é saber que racha a cabeça.`); return; }
        addCondition(c, 'debilitado', { rounds: Infinity, source: 'cristalDeB19' });
        await painel(`${c.name} (Inteligência ${sv.total}) toca o cristal, e o que ele guarda não cabe numa cabeça. Os pensamentos de ${c.name} se desfazem como areia.`);
        app.refresh();
      } });
    }
    // B21: o boné, com a Ashripask fora ou em paz
    if (aqui(P.escrivaninha, tile) && !t.feito.bone && (!vivo(elenco.ashripask))) {
      ops.push({ rotulo: 'Revirar a escrivaninha', icone: 'acao-procurar', motivo: longe(c, tile), fazer: () => { t.feito.bone = true; guardar(c, 'boneDaExplosaoMental', 1); enc.say('acao', `Na escrivaninha da Ashripask, um boné violeta costurado como um cérebro. ${c.name} o guarda.`); app.refresh(); } });
    }
    // B22: mergulhar na poça (`poca-salgada.js`)
    if (enc.field.surfaceAt?.(tile.x, tile.y) === 'cisterna' && salaNoLabirinto(tile) === 'B22') {
      ops.push({ rotulo: 'Mergulhar na poça', icone: 'acao-disparada', detalhe: 'seis milhas até o fundo', motivo: longe(c, tile),
        fazer: () => sair((v) => app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'pocaSalgada', continuarCom: v })) });
    }
    // OS PRESOS DO SOCORRO, colados na parede de B22 (`socorro-obelisco.js`): soltos, voltam ao grupo como estão
    const soc = estadoDoSocorro(camp);
    if (soc?.presos?.length && salaNoLabirinto(tile) === 'B22' && distanceFt(tile, P.bastoesB22) <= 15 && distanceFt(c.pos, P.bastoesB22) <= 15) {
      const hostis = enc.combatants.some((m) => m.side === 'foes' && !m.dead && salaNoLabirinto(m.pos) === 'B22');
      ops.push({ rotulo: 'Soltar os que estão colados na parede', icone: 'acao-usarObjeto', detalhe: soc.presos.map((p) => p.name).join(', '), motivo: hostis ? 'há inimigo na sala' : null, fazer: async () => {
        const voltam = soc.presos.splice(0);
        for (const p of voltam) {
          const q = enc.casaLivreMaisProxima(P.bastoesB22);
          p.pos = { x: q.x, y: q.y, f: 1 };
          p.side = 'party';
          p.movementLeftFt = MOVIMENTO;
          enc.addCombatant(p);
          soc.soltos.push(p.name);
        }
        await painel(`A carne da parede cede devagar, com um som de boca que se abre. ${voltam.map((p) => p.name).join(', ')} ${voltam.length > 1 ? 'caem' : 'cai'} no chão, fracos e vivos. Ainda dava tempo.`);
        app.refresh();
      } });
    }
    // B1: voltar a Illithinoch
    if (aqui(P.portal, tile)) {
      if (t.feito.refracaoVencida) {
        ops.push({ rotulo: 'Olhar o segundo portal', icone: 'acao-procurar', motivo: longe(c, tile, 15), fazer: () => painel(
          'Ao lado do portal de Illithinoch, que encolhe devagar, abriu-se outro: dentro dele, cores que não têm nome giram umas por dentro das outras. É o resto do Reino Distante, aberto. Quem entrar ali vai longe de casa, e este capítulo acaba aqui.') });
      }
      const voltar = () => sair((v) => app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'illithinoch', chegada: 'portal', continuarCom: v }));
      // O PORTAL INSTÁVEL: aberto há 7 dias (os dias passados no Reino Distante), ele treme e não leva ninguém. Reabre com
      // Inteligência (Arcanismo) CD 18 de quem toca; falhou, ninguém tenta de novo antes de passar um dia (o livro).
      const dias = diasNoReino();
      const instavel = !t.feito.refracaoVencida && dias - (t.feito.portalReabertoDia ?? 0) >= 7;
      if (t.feito.portalFechado) {
        ops.push({ rotulo: 'Voltar a Illithinoch', icone: 'acao-disparada', motivo: 'o portal fechou', fazer: () => {} });
      } else if (instavel) {
        const tentou = t.feito.portalFalhouDia === dias;
        ops.push({ rotulo: 'Firmar o portal instável', icone: 'acao-procurar', detalhe: 'Arcanismo CD 18', motivo: longe(c, tile) ?? (tentou ? 'só depois de passar um dia' : null), fazer: async () => {
          const r = rolarPericia(enc.rng, c, 'arcanismo');
          if (r.total < 18) {
            t.feito.portalFalhouDia = dias;
            await painel(`${c.name} (${SKILL_NAME.arcanismo} ${r.total}) põe as mãos na borda do portal, e ela foge dos dedos como água. O portal treme mais forte. Ninguém consegue firmá-lo antes de amanhã.`);
            return;
          }
          t.feito.portalReabertoDia = dias;
          await painel(`${c.name} (${SKILL_NAME.arcanismo} ${r.total}) segura a borda do portal e a puxa para o lugar, como quem estica um pano. Ele para de tremer.`);
          voltar();
        } });
      } else {
        ops.push({ rotulo: 'Voltar a Illithinoch', icone: 'acao-disparada', detalhe: t.feito.refracaoVencida ? `pelo portal, que fecha em ${Math.max(1, 60 - (t.portalMinutos ?? 0))} minutos` : 'pelo portal', motivo: longe(c, tile), fazer: voltar });
      }
      // O SEGUNDO PORTAL: o resto do Reino Distante, que o livro deixa para outra aventura. Atravessá-lo encerra a
      // campanha aqui, com o que se sabe do lado de lá (`atravessarOSegundoPortal`).
      if (t.feito.refracaoVencida) ops.push({ rotulo: 'Atravessar o segundo portal', icone: 'acao-disparada', detalhe: 'o resto do Reino Distante', motivo: longe(c, tile), fazer: () => atravessarOSegundoPortal() });
    }
    return ops;
  }

  async function flumphs(c) {
    if (!t.feito.encefalonMorto) {
      t.feito.flumphsVistos = true;
      await painel(['Sete águas-vivas de luz pálida flutuam entre as bolhas, e todas falam ao mesmo tempo, direto na cabeça de vocês, sobre o encefálon da sala do lado.',
        '— Forte demais — diz a maior, o Sábio Borblish. — Alguém tinha de matar aquilo. Alguém que não fôssemos nós.']);
      pista('Os flumphs da câmara escondida querem o encefálon da sala do lado morto, e se juntariam a quem o matasse.');
      return;
    }
    if (t.feito.flumphsRecrutados) { await painel('Os flumphs giram contentes. Aqui, pelo menos, ninguém cai.'); return; }
    t.feito.flumphsRecrutados = true;
    let n = 0;
    const linhas = ['Os flumphs piscam de alegria com a notícia do encefálon morto.'];
    for (const h of herois()) {
      const r = rolarPericia(enc.rng, h, 'persuasao');
      if (r.total >= 13) { const d = enc.rng.die(4); n += d; linhas.push(`${h.name} (${SKILL_NAME.persuasao} ${r.total}) convence ${d}.`); } else linhas.push(`${h.name} (${SKILL_NAME.persuasao} ${r.total}) não convence nenhum.`);
    }
    t.feito.flumphs = Math.min(7, n);
    linhas.push(t.feito.flumphs ? `${t.feito.flumphs} flumph${t.feito.flumphs > 1 ? 's prometem' : ' promete'} ajudar contra Ilvaash. Não são heróis: fogem de ordem suicida.` : 'Nenhum deles quer sair do nicho.');
    await painel(linhas);
  }

  return {
    lugar: TITULO,
    portasProprias: true,
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    depoisDeMover(c) {
      if (c && estado.explorando) { c.movementLeftFt = MOVIMENTO; Refens.seguirOGrupo(enc, c); }
      return depoisDoPasso(c);
    },
    depoisDoPasso,
    fimDoCombate,
    evento,
    dialogoDe: (npc) => (npc === elenco.shalfi && npc.side === 'neutro' ? arvoreShalfi()
      : npc === elenco.jomlus && npc.side === 'neutro' ? arvoreJomlus()
        : npc === elenco.ashripask && npc.side === 'neutro' ? arvoreAshripask() : null),
    depoisDaConversa,
    elenco,
    estado,
    porPorta,
    descarregar,
    async iniciar() {
      for (const [nome, aberta] of Object.entries(t.portas)) if (aberta) porPorta(nome, true);
      if (t.feito.secretaAchada) abrirSecreta();
      if (t.feito.capa) enc.field.alternarSobreposicao?.('capaTirada', true);
      if (t.feito.tomo) enc.field.alternarSobreposicao?.('livroTirado', true);
      for (const m of Object.values(elenco)) {
        // o Mublinesh que fugiu está escondido em B15 (fora do tabuleiro até alguém entrar lá)
        if (m === elenco.mublinesh && t.feito.mublineshFugiu) continue;
        if (!enc.combatants.includes(m)) enc.addCombatant(m);
      }
      // quem volta do covil sai pelo buraco de B16
      if (config.chegada === 'buraco') for (const h of herois()) { const q = enc.casaLivreMaisProxima(P.buracoB16); if (q) h.pos = { ...h.pos, x: q.x, y: q.y }; }
      // quem sobe da poça sai na beira dela, junto dos bastões
      if (config.chegada === 'poca') for (const h of herois()) { const q = enc.casaLivreMaisProxima(P.bastoesB22); if (q) h.pos = { ...h.pos, x: q.x, y: q.y }; }
      // os reféns que o grupo escolta (`refens-obelisco.js`)
      Refens.montarRefens(enc, camp, herois());
      // A REFRAÇÃO espera quem sobe da Poça com o obelisco em pó
      if (config.chegada === 'poca' && camp.obelisco8?.vazio?.feito?.anima?.obeliscoEmPo && !t.feito.refracaoVencida) {
        prepararExploracao();
        return chegaARefracao();
      }
      if (!t.feito.chegou) {
        t.feito.chegou = true;
        // o RELÓGIO DO SHALFI: em 1 ou 2 dias o buraco de B9 fura o covil (`passarUmDia`)
        t.feito.diaDoShalfi ??= (t.dia ?? 0) + enc.rng.die(2);
        await painel(['Do outro lado do portal, o ar pesa e cheira a coisa estragada. Os corredores são cinza-rosados, enrugados e úmidos, dobrados como a superfície de um cérebro, e brilham de uma luz violeta que não vem de lugar nenhum.',
          'As paredes cedem ao toque como carne e são duras como pedra. Um corte nelas se fecha em segundos.',
          'Em cada parte do labirinto a cabeça entende uma coisa sem que ninguém a diga: aqui, perto da entrada, os olhos veem mais longe do que deviam.']);
      }
      prepararExploracao();
    },
  };
}

/** O COVIL DO LOWARNIZEL (B17), lá embaixo pela corda: o dragão-ametista e a Gossa, o descanso seguro e os bastões. */
export function criarCovilLowarnizel(app, config = {}) {
  const enc = app.enc;
  const root = app.root;
  const camp = (app.campanha ??= {});
  const t = estadoDoLabirinto(camp);
  const vila = (camp.vila ??= { pistas: [], missoes: {} });
  const estado = { explorando: false, encerrado: false, lutando: null };
  const todos = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead && !c.refemDoObelisco);
  const herois = () => todos().filter((c) => c.hp > 0);
  const painel = (texto, escolhas) => narrar(root, { formato: 'painel', paginas: [{ titulo: 'O covil do dragão', texto: [].concat(texto) }], ...(escolhas ? { escolhas } : {}) });
  const pista = (txt) => { if (!(vila.pistas ??= []).includes(txt)) vila.pistas.push(txt); enc.say('acao', `Pista: ${txt}`); };
  const aqui = (p, tile) => p.x === tile.x && p.y === tile.y;
  const longe = (c, tile, pes = 5) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
  const elenco = {};
  if (!t.mortos.includes('lowarnizel')) { elenco.lowarnizel = makeMonster('lowarnizel', { ...PC.lowarnizel }); elenco.lowarnizel.side = 'neutro'; elenco.lowarnizel.chaveDoLabirinto = 'lowarnizel'; }
  if (!t.mortos.includes('gossa')) { elenco.gossa = makeMonster('mago', { ...PC.gossa }); elenco.gossa.name = 'Gossa'; elenco.gossa.side = 'neutro'; elenco.gossa.chaveDoLabirinto = 'gossa'; }
  const vivo = (f) => f && !f.dead && f.hp > 0;

  function prepararExploracao() {
    enc.over = false;
    enc.outcome = null;
    enc.side = 'party';
    enc.round = 1;
    for (const c of enc.combatants) { c.movementLeftFt = c.side === 'party' ? MOVIMENTO : 0; c.actionUsed = true; c.bonusUsed = true; c.reactionUsed = true; c.acted = false; }
    estado.explorando = true;
    root.classList.add('explorando');
    if (!herois().includes(app.selected)) app.select(herois()[0]);
    app.refresh();
  }
  function luta() {
    const quem = Object.values(elenco).filter(vivo);
    for (const f of quem) { f.side = 'foes'; if (!enc.combatants.includes(f)) enc.addCombatant(f); }
    estado.explorando = false;
    estado.lutando = quem;
    root.classList.remove('explorando');
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
    return true;
  }
  function subir() {
    estado.explorando = false;
    estado.encerrado = true;
    root.classList.remove('explorando');
    Refens.guardarRefens(enc, camp);
    app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'labirintoSalgado', chegada: 'buraco', continuarCom: todos() });
  }

  /** O DESCANSO no covil: seguro, mas no Reino Distante — Sabedoria CD 15 de cada um, ou um nível de exaustão. As portas
   * abertas fecham sozinhas (uma hora). */
  async function descansar() {
    const linhas = ['Vocês dormem no covil, com o dragão de guarda. O sono no Reino Distante não é sono de verdade.'];
    for (const h of herois()) {
      descansoLongo(h);
      const sv = enc.resistencia(h, 'wis', 15);
      if (!sv.success) { mudarExaustao(h, 1); linhas.push(`${h.name} (Sabedoria ${sv.total}) acorda com a cabeça cheia de coisas que não sonhou: um nível de exaustão.`); } else linhas.push(`${h.name} (Sabedoria ${sv.total}) acorda inteiro.`);
    }
    for (const k of Object.keys(t.portas)) t.portas[k] = false;
    linhas.push('Lá em cima, as portas mentais que estavam abertas já se fecharam sozinhas.');
    // depois da Refração, oito horas de sono fecham o portal de Illithinoch
    if (t.feito.refracaoVencida && !t.feito.portalFechado && t.portalMinutos != null) {
      t.portalMinutos += 480;
      t.feito.portalFechado = true;
      linhas.push('Quando vocês acordam, já sabem sem precisar ver: o portal de Illithinoch fechou enquanto dormiam.');
    }
    await painel(linhas);
    app.refresh();
    if (passarUmDia(t)) return shalfiNoCovil();
  }

  /**
   * O SHALFI FURA O TETO com o grupo no covil: ele e o Jitterjaws caem lá de B9, e o dragão e a Gossa lutam do lado do grupo
   * (criaturas que agem sozinhas, `invocado`, que voltam a ser os donos da casa no fim). Avisado, o dragão estava esperando.
   */
  async function shalfiNoCovil() {
    const shalfi = makeMonster('zeloteAberrante', { ...PC.lowarnizel });
    shalfi.name = 'Shalfi Lewin';
    shalfi.chaveDoLabirinto = 'shalfi';
    const jj = makeMonster('fusaoDeCarne', { ...PC.lowarnizel });
    jj.name = 'Jitterjaws';
    jj.chaveDoLabirinto = 'jitterjaws';
    const quem = [shalfi, ...(t.mortos.includes('jitterjaws') ? [] : [jj])];
    for (const f of quem) {
      const q = enc.casaLivreMaisProxima(PC.lowarnizel);
      if (q) f.pos = { ...f.pos, x: q.x, y: q.y };
      f.side = 'foes';
      enc.addCombatant(f);
    }
    const dono = herois()[0];
    estado.aliados = [];
    for (const a of [elenco.lowarnizel, elenco.gossa]) {
      if (!vivo(a) || !dono) continue;
      a.side = 'party';
      a.invocado = { donoId: dono.id, spellId: 'aliadoDoCovil', auto: true };
      estado.aliados.push(a);
    }
    await painel([t.feito.lowarnizelAvisado
      ? 'No meio da noite, o teto do covil estala. — Ele chegou — diz o Lowarnizel, já de pé, e a Gossa já tem as mãos erguidas. O avisado estava esperando.'
      : 'No meio da noite, o teto do covil estala e desaba. O dragão acorda com um rugido.',
    'Do buraco cai um homem de pá na mão, gritando de alegria, e atrás dele um bolo enorme de dentes. — Achei! Achei o dragão!'], [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
    estado.explorando = false;
    estado.lutando = quem;
    root.classList.remove('explorando');
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
    return true;
  }

  const arvore = () => ({
    inicio: 'oi',
    nos: {
      oi: {
        fala: 'Desçam devagar. — A voz do dragão enche a cabeça de cada um. Ele é grande, violeta, e as escamas brilham como cristal. — Vocês não cheiram a Ilvaash. Bom. Eu sou o Lowarnizel; esta é a Gossa.',
        opcoes: [
          { texto: 'Os bastões na parede abrem o quê?', vai: 'bastoes' },
          { texto: 'O que há mais fundo no labirinto?', vai: 'vazio' },
          { texto: 'Vimos três devoradores com reféns?', vai: 'fanaticos' },
          { texto: 'Há um homem cavando lá em cima, atrás de um dragão.', vai: 'shalfi', requer: () => (t.feito.shalfiVisto ? null : 'vocês não viram ninguém cavando') },
          { texto: 'Podemos descansar aqui?', fim: 'descansar' },
          { texto: 'Atacar.', fim: 'atacar' },
          { texto: 'Subir pela corda.', fim: 'sai' },
        ],
      },
      bastoes: {
        fala: 'Ligam alguma coisa no labirinto. Uma porta, acho. A Gossa acha que é um alarme. — A maga cruza os braços. — Testem, se quiserem.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      vazio: {
        fala: 'Este labirinto é só metade do domínio de Ilvaash. A outra metade fica além de uma estrela sem luz, seja lá o que isso for. Quase não há devoradores aqui; há muitas outras coisas. E dois meio transformados moram ao lado do quarto de tralha lá em cima. Nós evitamos os dois.',
        ao: () => pista('O Lowarnizel: o labirinto é metade do domínio de Ilvaash; a outra fica "além de uma estrela sem luz". Dois adeptos meio transformados moram ao lado do quarto de tralha (B18).'),
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      fanaticos: {
        fala: 'Três devoradores passaram há pouco com gente presa. Cinco, doze, não sei contar humano de longe. Foram para dentro.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      shalfi: {
        fala: 'Então é isso o barulho. — O dragão olha o teto. — Que venha. A Gossa e eu preferimos esperar aqui do que ir cavar atrás dele.',
        ao: () => { t.feito.lowarnizelAvisado = true; pista('O Lowarnizel e a Gossa sabem do Shalfi e preferem esperá-lo no covil.'); },
        opcoes: [
          { texto: 'Melhor ir atrás dele agora, antes que ele chegue. (Persuasão, CD 15)', fim: 'irAoShalfi', requer: () => (t.mortos.includes('shalfi') ? 'o Shalfi já morreu' : t.feito.dragaoVaiAoShalfi ? 'já combinado' : null) },
          { texto: '…', vai: 'oi' },
        ],
      },
    },
  });

  return {
    lugar: 'O covil do dragão',
    portasProprias: true,
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes(tile, sup, c) {
      if (!c || !estado.explorando) return [];
      const ops = [];
      if (aqui(PC.corda, tile)) ops.push({ rotulo: 'Subir pela corda', icone: 'acao-disparada', motivo: longe(c, tile), fazer: () => subir() });
      if (aqui(PC.bastoes, tile)) {
        ops.push({ rotulo: 'Segurar os bastões', icone: 'acao-usarObjeto', detalhe: 'Constituição CD 15', motivo: longe(c, tile), fazer: async () => {
          const linhas = [`${c.name} segura os dois bastões. A descarga atravessa o corpo com um estalo.`, ...correnteViva(enc, [c])];
          t.portas.central = true;
          linhas.push('Lá em cima, longe, a porta central se abre.');
          await painel(linhas);
          app.refresh();
        } });
      }
      return ops;
    },
    depoisDeMover(c) { if (c && estado.explorando) c.movementLeftFt = MOVIMENTO; return false; },
    async fimDoCombate(outcome) {
      if (outcome !== 'vitoria') {
        estado.encerrado = true;
        await narrar(root, { formato: 'tela', paginas: [{ titulo: 'O covil do dragão', texto: ['O dragão-ametista volta a esperar no escuro.'] }] });
        app.encerrarPartida();
        return;
      }
      for (const f of estado.lutando ?? []) if (f.dead) t.mortos.push(f.chaveDoLabirinto);
      // o dragão e a Gossa, que lutaram do lado do grupo contra o Shalfi, voltam a ser os donos da casa
      for (const a of estado.aliados ?? []) {
        delete a.invocado;
        if (a.dead) { t.mortos.push(a.chaveDoLabirinto); continue; }
        a.side = 'neutro';
        if (!enc.combatants.includes(a)) enc.addCombatant(a);
      }
      if (estado.aliados?.length && (estado.lutando ?? []).some((f) => f.chaveDoLabirinto === 'shalfi' && f.dead)) {
        t.feito.shalfiMortoPeloDragao = true;
        await painel(elenco.lowarnizel && !elenco.lowarnizel.dead ? '— Devo uma a vocês — diz o dragão, lambendo uma ferida. — E não esqueço o que devo.' : 'O covil fica em silêncio. O dragão não se levanta mais.');
      }
      estado.aliados = [];
      const xp = (estado.lutando ?? []).filter((f) => f.dead).reduce((s, f) => s + (f.xp ?? 0), 0);
      if (xp && todos().length) {
        const sobem = darXp(todos(), Math.floor(xp / todos().length));
        if (sobem.length) for (const txt of await telaDeSubirNivel(root, sobem)) enc.say('cura', txt);
      }
      prepararExploracao();
    },
    evento(ev) { Refens.eventoDosRefens(enc, camp, ev); },
    dialogoDe: (npc) => (npc === elenco.lowarnizel && npc.side === 'neutro' ? arvore() : null),
    async depoisDaConversa(npc, fim) {
      if (fim === 'atacar') return luta();
      if (fim === 'descansar') return descansar();
      // CONVENCER O DRAGÃO A IR ATRÁS DO SHALFI (o livro: o casal prefere esperar, e o grupo pode convencê-los a ir; a
      // CD é nossa). Convencidos, eles sobem cavando por baixo da cova de B9 quando o grupo chegar lá (`labirinto`).
      if (fim === 'irAoShalfi') {
        const quem = herois().reduce((a, b) => (skillBonus(b, 'persuasao') > skillBonus(a, 'persuasao') ? b : a));
        const r = rolarPericia(enc.rng, quem, 'persuasao');
        if (r.total < 15) {
          await painel(`${quem.name} (${SKILL_NAME.persuasao} ${r.total}) fala de pegar o Shalfi desprevenido. — Não — diz o Lowarnizel. — Ele vem até nós, e nós esperamos. Aqui é a nossa casa.`);
          return null;
        }
        t.feito.dragaoVaiAoShalfi = true;
        await painel([`${quem.name} (${SKILL_NAME.persuasao} ${r.total}) convence. O dragão pensa um tempo longo e solta o ar. — Está bem. Subam e vão até o buraco dele. Quando ouvirmos vocês lá em cima, a Gossa e eu subimos por baixo, cavando.`,
          '— Façam barulho — diz a Gossa. — E saiam da frente.']);
        pista('O Lowarnizel e a Gossa vão subir cavando por baixo da cova do Shalfi, em B9, quando o grupo estiver lá.');
        return null;
      }
      return null;
    },
    elenco,
    estado,
    descansar,
    async iniciar() {
      for (const m of Object.values(elenco)) if (!enc.combatants.includes(m)) enc.addCombatant(m);
      Refens.montarRefens(enc, camp, herois());
      if (!t.feito.covilVisto) {
        t.feito.covilVisto = true;
        await painel('A corda desce seis metros até uma sala abobadada, coberta de um muco escorregadio que cheira a gordura rançosa. A única saída é o buraco por onde vocês vieram. No meio, enrolado, um dragão de escamas violeta abre um olho. Ao lado dele, uma mulher de túnica já tem as mãos erguidas, prontas para conjurar.');
        // quem mostra no corpo a marca do Reino Distante (`transformacao.js`) tem de se explicar, ou o casal ataca
        const marcado = herois().find(mostraAMudanca);
        if (marcado && vivo(elenco.lowarnizel)) {
          const r = await painel([`O dragão fixa o olho em ${marcado.name}, e a Gossa aponta. — Isso aí. A marca do Reino. Vocês são de Ilvaash?`,
            '— Expliquem — diz o Lowarnizel. — Agora.'], [
            { rotulo: 'Explicar que é o ritual, e que vieram acabar com ele', valor: 'explicar', primaria: true },
            { rotulo: 'Não dizer nada', valor: 'calar' },
          ]);
          if (r !== 'explicar') { prepararExploracao(); return luta(); }
          await painel('O dragão escuta tudo sem piscar. — Então é pior do que eu pensava, lá em cima. — A Gossa baixa as mãos, devagar, mas não tira os olhos da marca.');
        }
      }
      prepararExploracao();
    },
  };
}
