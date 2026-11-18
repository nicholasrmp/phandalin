// O REPOUSO DE ZORZULA, O POSTO (o nível de cima; capítulo 5 do Obelisco, Z1 a Z11). Mapa em `game/zorzula-mapas.js`,
// gerado por `src/dev/mapa-zorzula.py` a partir da planta da FA.
//
// O QUE É DO LIVRO (as regras; o texto é nosso):
//   o lugar inteiro: a FUMAÇA SULFUROSA — quem a respira faz Constituição CD 10 ou fica envenenado por uma hora; quem
//       resiste a veneno passa sem teste, e quem passa fica imune por 24 horas. Penumbra azul em tudo.
//   Z1 a entrada: a porta dupla de pedra, destrancada, abre com um minuto de esforço (ou pela alavanca de dentro). Dois
//       comandantes psíquicos vigiam das seteiras. Enganação ou Persuasão CD 15, ou 25 po de suborno, e eles abrem;
//       ameaçados, atacam, e o refeitório chega três rodadas depois. Explorando em volta, Percepção CD 16 acha o túnel
//       da Bessie (e o respiradouro da fonte).
//   Z3 o refeitório: 2d4 goblins, 1d6 lutadores e 1d4 comandantes. Querem SUBJUGAR, não matar: se o grupo inteiro
//       cai, acorda preso no Santuário Índigo, com os reféns. Intimidação ou Persuasão CD 13 para a briga: eles propõem
//       um trato — o grupo passa se acabar com os monstros da forja.
//   Z4 o dormitório: 1d6 lutadores dormindo, Furtividade CD 17 de quem entra. Acordados, fogem gritando; com
//       Intimidação ou Persuasão CD 16 ficam quietos, pelo mesmo trato da forja, e dizem que o Ruxithid está "na sala
//       azul". O poço do elevador quebrado (Investigação 10, o cristal recarrega com um espaço de magia, Arcanismo 16).
//   Z5/Z6 as latrinas e a fonte termal: a secreta se nota com Percepção passiva 13; a fonte cura 1d6 a cada dez minutos
//       de molho, e o respiradouro (12 m, Atletismo CD 18) é uma saída.
//   Z7 a forja: a porta barricada (Atletismo CD 12), três ashenwights ferais, e Investigação CD 13 acha um item da
//       pilha (três a mais, dois).
//   Z8/Z9 a cozinha e a despensa: a Bessie, um texugo gigante manso; Investigação CD 15 acha duas poções de cura maior
//       e uma de fortitude psiônica atrás do vinho azedo; o túnel dela sai do posto.
//   Z10/Z11 a suíte e o cofre: a porta trancada (Destreza 15 com ferramentas, Força 15; a chave é do Ruxithid); o jarro
//       que murmura (Percepção passiva 15; Investigação 15 abre, Atletismo 20 quebra) com a alma de Hjoldak Hollowhelm,
//       que vira guia; o fundo falso da cama (Investigação 20); as quatro runas (Percepção 16): tempestade, morte, luz,
//       vento, nessa ordem — a ordem errada pede Destreza CD 15 contra 3d8 do tipo da última runa (vento: energético).
//
// O NÍVEL DE BAIXO (as minas, Z12 a Z19) e o Santuário Índigo são outras cenas.
//
// O estado mora em `app.campanha.obelisco5.zorzula`, e sobrevive a sair e voltar.

import { narrar } from '../view/narrativa.js';
import { distanceFt, ARESTA } from '../core/grid.js';
import { d20, damageRoll } from '../core/dice.js';
import { rolarPericia, saveBonus, passivePerception, SKILL_NAME, skillBonus } from '../rules/abilities.js';
import { addCondition, hasCondition, removeCondition } from '../rules/conditions.js';
import { makeMonster } from '../rules/monsters.js';
import { garantirInventario } from '../rules/equipment.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { guardar, cobrar, totalEmCobre } from './comercio.js';
import { PONTOS_ZORZULA } from './zorzula-mapas.js';

const P = PONTOS_ZORZULA.ZORZULA_POSTO;
const MOVIMENTO = 60;
const SALA_DE = new Map();
for (const [id, cs] of Object.entries(P.salas)) for (const c of cs) SALA_DE.set(`${c.x},${c.y}`, id);
/** A sala de uma casa ('Z1'..'Z11', 'corredor'), ou null na rocha. */
export const salaDoPosto = (p) => (p ? SALA_DE.get(`${p.x},${p.y}`) ?? null : null);
const em = (lista, t) => [].concat(lista ?? []).some((q) => q.x === t.x && q.y === t.y);

/** A ordem das runas da porta do cofre (o livro). */
export const ORDEM_DAS_RUNAS = ['tempestade', 'morte', 'luz', 'vento'];
const DANO_DA_RUNA = { tempestade: 'elétrico', morte: 'necrótico', luz: 'radiante', vento: 'energético' };

/** O que se rola uma vez por partida e se guarda (o livro: 2d4, 1d6, 1d4, 1d6). */
function rolarElenco(rng, z) {
  const r = (n) => Math.floor(rng() * n) + 1;
  z.elenco ??= {
    goblins: r(4) + r(4),
    lutadores: r(6),
    comandantes: r(4),
    dormindo: r(6),
  };
  return z.elenco;
}

export function criarZorzulaPosto(app, config = {}) {
  const enc = app.enc;
  const root = app.root;
  const camp = (app.campanha ??= {});
  const o5 = (camp.obelisco5 ??= { iniciado: true, cenas: {}, pistas: [], feito: {} });
  const vila = (camp.vila ??= { pistas: [], missoes: {} });
  const z = (o5.zorzula ??= {});
  z.fumaca ??= {};
  z.buscas ??= {};
  const estado = { explorando: false, encerrado: false, lutando: null, qual: null };

  const herois = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead && c.hp > 0);
  const todos = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead);
  const painel = (texto, escolhas) => narrar(root, { formato: 'painel', paginas: [{ titulo: 'O Repouso de Zorzula', texto: [].concat(texto) }], ...(escolhas ? { escolhas } : {}) });
  const teste = (c, pericia, cd) => {
    const r = rolarPericia(enc.rng, c, pericia);
    return { quem: c.name, nome: SKILL_NAME[pericia], total: r.total, cd, passou: r.total >= cd };
  };
  const melhor = (pericia, lista = herois()) => lista.reduce((a, h) => (!a || skillBonus(h, pericia) > skillBonus(a, pericia) ? h : a), null);
  const salvaguarda = (c, atributo, cd, opcoes = {}) => {
    const r = d20(enc.rng, saveBonus(c, atributo), opcoes);
    return { total: r.total, passou: r.total >= cd };
  };
  const pista = (t) => { if (!(vila.pistas ??= []).includes(t)) vila.pistas.push(t); };
  const longe = (c, tile, pes = 5) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
  const abrirAresta = (a, b) => enc.field.porAresta(a.x, a.y, b.x, b.y, ARESTA.aberta);
  // OS SAWPLEE SEM O CHEFE (o livro: morto o Ruxithid, o clã é pacífico, curioso e travesso). Ninguém mais briga no
  // posto: os vigias abrem, o refeitório só olha, o dormitório acorda e pergunta. Os ferais da forja não são do clã.
  const semChefe = () => z.santuario === 'vencido';
  const fecharAresta = (a, b, cod = ARESTA.parede) => enc.field.porAresta(a.x, a.y, b.x, b.y, cod);

  // ------------------------------------------------------------- o elenco ----
  const elenco = rolarElenco(enc.rng, z);
  const letras = 'ABCDEFGHIJ';
  const nasce = (tipo, pos, sufixo, nome) => {
    const m = makeMonster(tipo, { x: pos.x, y: pos.y }, sufixo ? { nameSuffix: sufixo } : {});
    if (nome) m.name = nome;
    return m;
  };
  const vigias = z.vigias === 'mortos' ? [] : P.vigias.map((p, i) => nasce('goblinPsiComandante', p, null, `Vigia da seteira ${letras[i]}`));
  const casasDoRefeitorio = [...P.refeitorio];
  // primeiro os bancos (as 20 primeiras casas), depois as pontas: ninguém fica de pé com banco sobrando
  const pega = () => {
    const bancos = Math.min(20, casasDoRefeitorio.length);
    return casasDoRefeitorio.splice(Math.floor(enc.rng() * bancos), 1)[0];
  };
  const refeitorio = z.refeitorio === 'limpo' ? [] : [
    ...Array.from({ length: elenco.goblins }, (_, i) => nasce('goblin', pega(), null, `Goblin do refeitório ${letras[i]}`)),
    ...Array.from({ length: elenco.lutadores }, (_, i) => nasce('goblinPsiLutador', pega(), null, `Lutador psíquico ${letras[i]}`)),
    ...Array.from({ length: elenco.comandantes }, (_, i) => nasce('goblinPsiComandante', pega(), null, `Comandante psíquico ${letras[i]}`)),
  ];
  // eles querem o grupo VIVO (o livro): batem para derrubar (`combat.js`, golpe não letal)
  for (const g of refeitorio) g.naoLetal = true;
  const dormindo = ['acordados', 'quietos', 'mortos'].includes(z.dormitorio) ? [] : P.dormitorio.slice(0, elenco.dormindo).map((p, i) => nasce('goblinPsiLutador', p, null, `Lutador dormindo ${letras[i]}`));
  const ferais = z.forja === 'limpa' ? [] : P.ferais.map((p, i) => nasce('ashenwightFeral', p, null, `Ashenwight feral ${letras[i]}`));
  const bessie = nasce('texugoGigante', P.bessie, null, 'Bessie');
  bessie.falas = ['A Bessie vira de barriga para cima e espera, de olhos fechados, que alguém entenda o recado.'];
  let hjoldak = null;

  const entrarNeutro = (f, olha = { dx: 0, dy: 1 }) => {
    f.side = 'neutro';
    f.facingVec = olha;
    if (!enc.combatants.includes(f)) enc.addCombatant(f);
  };

  // --------------------------------------------------------- exploração ----
  function prepararExploracao() {
    enc.reinforcements = null;
    enc.lotePendente = null;
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
    estado.qual = null;
    root.classList.add('explorando');
    if (!herois().includes(app.selected)) app.select(herois()[0]);
    app.refresh();
  }

  function luta(qual, quem, { surpresa = null, reforcos = null } = {}) {
    for (const f of quem) {
      if (f.dead) continue;
      f.side = 'foes';
      if (!enc.combatants.includes(f)) {
        if (enc.occupied(f.pos.x, f.pos.y, f)) f.pos = { ...f.pos, ...(enc.casaLivreMaisProxima(f.pos) ?? f.pos) };
        enc.addCombatant(f);
      }
    }
    estado.explorando = false;
    estado.lutando = quem;
    estado.qual = qual;
    root.classList.remove('explorando');
    enc.emboscada = surpresa === 'nossa' ? { emboscadores: 'party', furtividade: herois().map(() => 20) } : null;
    // OS REFORÇOS DO REFEITÓRIO (o livro): três rodadas depois de a briga começar no portão.
    enc.reinforcements = reforcos ? (rodada) => {
      if (rodada < reforcos.rodada) return null;
      // eles já estão no tabuleiro, comendo (neutros): saem da lista para o motor os pôr de volta como reforço
      const units = reforcos.bando.filter((f) => !f.dead && f.side !== 'foes');
      if (!units.length) return null;
      for (const f of units) {
        f.side = 'foes';
        const i = enc.combatants.indexOf(f);
        if (i >= 0) enc.combatants.splice(i, 1);
      }
      z.refeitorio = 'luta';
      estado.lutando = [...estado.lutando, ...units];
      return { units, aviso: 'Do fundo do posto, uma correria de pés pequenos: o refeitório inteiro vem ver o que é a briga.' };
    } : null;
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
  }

  async function darXpDaLuta(lista, motivo) {
    const grupo = todos();
    const xp = lista.filter((f) => f.dead || f.capturado || f.rendido).reduce((s, f) => s + (f.xp ?? 0), 0);
    if (!grupo.length || !xp) return;
    const cada = Math.floor(xp / grupo.length);
    const sobem = darXp(grupo, cada);
    enc.say('cura', `${motivo}: ${cada} XP para cada um.`);
    if (sobem.length) for (const t of await telaDeSubirNivel(root, sobem)) enc.say('cura', t);
  }

  // --------------------------------------------------- a fumaça sulfurosa ----
  /** Quem entra no posto respira a fumaça (o livro): Constituição CD 10, ou envenenado por uma hora. */
  async function fumaca(lista) {
    const novos = lista.filter((h) => salaDoPosto(h.pos) && salaDoPosto(h.pos) !== 'Z1' && !z.fumaca[h.id]);
    if (!novos.length) return;
    const linhas = [];
    for (const h of novos) {
      const resiste = h.resist?.includes('veneno') || h.immune?.includes('veneno') || h.imuneVeneno;
      if (resiste) { z.fumaca[h.id] = 'imune'; linhas.push(`${h.name} mal sente o cheiro.`); continue; }
      const s = salvaguarda(h, 'con', 10);
      if (s.passou) { z.fumaca[h.id] = 'imune'; linhas.push(`${h.name} tosse e se acostuma (Constituição ${s.total}): fica imune à fumaça por um dia.`); continue; }
      z.fumaca[h.id] = 'envenenado';
      addCondition(h, 'envenenado', { rounds: 600, source: 'fumacaSulfurosa' });
      linhas.push(`${h.name} engasga e fica enjoado (Constituição ${s.total}): envenenado por uma hora.`);
    }
    await painel(['O ar de dentro é quente e pesado, com um cheiro de ovo podre que gruda na garganta. Vem de rachaduras no chão, de onde sobe uma névoa azulada.', ...linhas]);
    app.refresh();
  }

  // ---------------------------------------------------------- o portão ----
  const portaoAberto = () => z.portao === 'aberto';
  function abrirPortao() {
    z.portao = 'aberto';
    for (const p of P.portao) abrirAresta({ x: p.x, y: p.y - 1 }, p);
    app.refresh();
  }

  async function falarComOsVigias(c) {
    if (semChefe()) {
      z.vigias = 'abriram';
      await painel(['Dois focinhos aparecem nas seteiras. — Ah, são vocês. — Cochicham. — Os que acabaram com o chefe.',
        'A corrente range sem ninguém pedir duas vezes, e a porta de pedra se abre. Um deles grita lá de cima: — Limpa os pés!']);
      abrirPortao();
      return;
    }
    const podePagar = totalEmCobre(todos()) >= 2500;
    const escolha = await painel([
      'Uma voz fina desce de uma das seteiras: — Quem é? O que quer? A gente não compra nada! — Outra, da outra seteira, ri. — Fala que a gente não tá.',
      'Pelas frestas, dois pares de olhos acesos de um brilho que não é luz de tocha.',
    ], [
      { rotulo: 'Convencer a abrir (Persuasão, CD 15)', valor: 'persuasao', primaria: true },
      { rotulo: 'Mentir que são esperados (Enganação, CD 15)', valor: 'enganacao' },
      ...(podePagar ? [{ rotulo: 'Oferecer 25 po', valor: 'suborno' }] : []),
      { rotulo: 'Ameaçar', valor: 'ameaca' },
      { rotulo: 'Deixar para lá', valor: 'nada' },
    ]);
    if (escolha === 'nada') return;
    if (escolha === 'ameaca') {
      await painel('— Ah, é? — Um apito agudo, e as duas seteiras se enchem de olhos.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      return lutaNoPortao();
    }
    if (escolha === 'suborno') {
      cobrar(todos(), 2500);
      z.vigias = 'abriram';
      await painel('As moedas sobem num balde amarrado a um barbante, e o barbante some na seteira. Silêncio, uma discussão cochichada, e um ranger de corrente: a porta de pedra se abre para dentro. — Entra logo, e não conta pro chefe.');
      abrirPortao();
      return;
    }
    const pericia = escolha === 'persuasao' ? 'persuasao' : 'enganacao';
    const t = teste(c, pericia, 15);
    if (t.passou) {
      z.vigias = 'abriram';
      await painel([`${c.name} (${t.nome} ${t.total}) fala do jeito certo.`, 'Os vigias cochicham. — O chefe anda esquisito mesmo, nunca avisa nada… — Uma corrente range lá dentro e a porta de pedra se abre para dentro. — Vai, vai. A gente não viu.']);
      abrirPortao();
      return;
    }
    z.vigiasDesconfiam = true;
    await painel([`${c.name} (${t.nome} ${t.total}) não convence.`, '— Vai embora! — Uma pedrinha bate no capacete de alguém. Eles não abrem, mas também não atacam: só olham.']);
  }

  function lutaNoPortao() {
    z.vigias = 'luta';
    // OS VIGIAS SAEM PARA BRIGAR: puxam a alavanca e a porta de pedra se abre. Sem isto a luta não acabava — eles só
    // têm golpe de perto, e com a porta fechada nem eles saíam, nem o refeitório que chega de reforço.
    abrirPortao();
    enc.say('acao', 'Uma corrente range dentro da rocha: os vigias puxaram a alavanca, e a porta de pedra se abre para dentro.');
    for (const v of vigias) if (!enc.combatants.includes(v)) enc.addCombatant(v);
    luta('portao', vigias.filter((f) => !f.dead), { reforcos: { rodada: 4, bando: refeitorio } });
  }

  // ---------------------------------------------------------- o refeitório ----
  async function chegarAoRefeitorio() {
    if (z.refeitorio) return false;
    if (semChefe()) {
      z.refeitorio = 'trato';
      await painel([`Mesas compridas de pedra e ${refeitorio.length} goblins que param de mastigar ao mesmo tempo.`,
        'Ninguém pula. Um deles se levanta, devagar, e aponta a colher para vocês. — Foram vocês, né? Lá na sala azul. — Ele senta de novo. — A cabeça parou de zumbir. Senta, se quiser. Tem sopa.']);
      app.refresh();
      return true;
    }
    z.refeitorio = 'visto';
    const quem = herois().find((h) => ['Z3', 'corredor'].includes(salaDoPosto(h.pos))) ?? herois()[0];
    const escolha = await painel([
      `Mesas compridas de pedra, cheias de goblins comendo de boca aberta — ${refeitorio.length} deles, alguns de olhos brilhando. As colheres param no ar. Um banco cai.`,
      'Um grita "INVASÃO!", outro "PEGA!", e um terceiro "VIVO! O CHEFE QUER VIVO!". Ninguém ainda se mexeu.',
    ], [
      { rotulo: 'Às armas!', valor: 'luta' },
      { rotulo: `Mandar parar (Intimidação, CD 13 — ${quem.name})`, valor: 'intimidacao', primaria: true },
      { rotulo: `Acalmar (Persuasão, CD 13 — ${quem.name})`, valor: 'persuasao' },
    ]);
    if (escolha !== 'luta') {
      const t = teste(quem, escolha, 13);
      if (t.passou) {
        z.refeitorio = 'trato';
        z.trato = true;
        await painel([`${quem.name} (${t.nome} ${t.total}) segura a sala com a voz.`,
          'Os goblins se entreolham, desconfiados. O de olhos mais acesos sobe num banco. — Tá. Trato. Tem coisa na forja. Coisa morta que anda e bate martelo. A gente fechou a porta. Vocês matam as coisas da forja, e aí podem passar. Combinado?',
          'Eles voltam a comer, sem tirar os olhos de vocês.']);
        app.refresh();
        return true;
      }
      await painel(`${quem.name} (${t.nome} ${t.total}) não segura ninguém. A sala inteira pula em cima.`, [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
    }
    luta('refeitorio', refeitorio.filter((f) => !f.dead));
    return true;
  }

  // ---------------------------------------------------------- o dormitório ----
  async function entrarNoDormitorio() {
    if (z.dormitorio || !dormindo.length) return false;
    const dentro = herois().filter((h) => salaDoPosto(h.pos) === 'Z4');
    z.furtivos ??= [];
    const novos = dentro.filter((h) => !z.furtivos.includes(h.id));
    if (!novos.length) return false;
    for (const h of novos) {
      z.furtivos.push(h.id);
      const t = teste(h, 'furtividade', 17);
      if (!t.passou) return acordarDormitorio(h, t);
    }
    if (!z.dormitorioVisto) {
      z.dormitorioVisto = true;
      await painel(`Beliches de pedra e um ronco que sobe e desce: ${dormindo.length} goblin${dormindo.length > 1 ? 's' : ''} dormindo, de boca aberta. Ninguém acordou.`);
    }
    return false;
  }

  async function acordarDormitorio(h, t) {
    if (semChefe()) {
      z.dormitorio = 'quietos';
      await painel([`${h.name} (${t.nome} ${t.total}) tropeça num balde.`,
        'Os goblins sentam nos beliches, piscando. Nenhum corre para a porta. — É o pessoal da sala azul — diz um, e volta a deitar. Outro fica olhando, curioso, para as botas de vocês.']);
      for (const g of dormindo) { entrarNeutro(g, { dx: 1, dy: 0 }); removeCondition(g, 'caido'); }
      app.refresh();
      return true;
    }
    const quem = herois()[0];
    const escolha = await painel([`${h.name} (${t.nome} ${t.total}) tropeça num balde.`, 'Os goblins pulam dos beliches, gritam e correm para a porta: — SOCORRO! INVASÃO!'], [
      { rotulo: `Calar todo mundo (Intimidação, CD 16 — ${quem.name})`, valor: 'intimidacao', primaria: true },
      { rotulo: `Pedir calma (Persuasão, CD 16 — ${quem.name})`, valor: 'persuasao' },
      { rotulo: 'Às armas!', valor: 'luta' },
    ]);
    if (escolha !== 'luta') {
      const r = teste(quem, escolha, 16);
      if (r.passou) {
        z.dormitorio = 'quietos';
        z.trato = true;
        await painel([`${quem.name} (${r.nome} ${r.total}) os faz parar no meio do grito.`,
          '— Tá, tá, tá. A gente fica quieto. Mas vocês limpam a forja, hein? — Perguntados do chefe, encolhem os ombros. — O Ruxithid? Tá na sala azul, conversando com os deuses que deram os poderes pra gente. Depois da ponte. Mais não sei.']);
        pista('Os goblins do dormitório dizem que o Ruxithid fica "na sala azul", depois da ponte, conversando com os deuses que lhes deram os poderes.');
        for (const g of dormindo) entrarNeutro(g, { dx: 1, dy: 0 });
        app.refresh();
        return true;
      }
      await painel(`${quem.name} (${r.nome} ${r.total}) não segura ninguém: eles fogem pelo corredor, berrando.`);
    }
    if (escolha === 'luta') {
      z.dormitorio = 'luta';
      luta('dormitorio', dormindo.filter((f) => !f.dead));
      return true;
    }
    // fugiram gritando: o refeitório ouve e vem
    z.dormitorio = 'acordados';
    for (const g of dormindo) { const i = enc.combatants.indexOf(g); if (i >= 0) enc.combatants.splice(i, 1); }
    if (!z.refeitorio || z.refeitorio === 'visto') {
      z.refeitorio = 'luta';
      await painel('Do outro lado do posto, o refeitório inteiro levanta das mesas.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      luta('refeitorio', refeitorio.filter((f) => !f.dead));
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------- a forja ----
  async function entrarNaForja() {
    if (z.forja || !ferais.length) return false;
    z.forja = 'luta';
    await painel(['O calor bate na cara. Três bigornas enegrecidas, janelões do chão ao teto sobre um mar de lava, e três vultos cinzentos de anão batendo martelo em metal frio, sem som nenhum.',
      'Os três param ao mesmo tempo, viram a cabeça, e as rachaduras dos corpos se acendem por dentro.'], [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
    luta('forja', ferais.filter((f) => !f.dead));
    return true;
  }

  // ------------------------------------------------- as secretas e o cofre ----
  function abrirSecreta(nome) {
    const s = P.secretas[nome];
    abrirAresta(s.a, s.b);
    (z.secretas ??= []).includes(nome) || z.secretas.push(nome);
    app.refresh();
  }

  async function latrinas() {
    if (z.secretas?.includes('fonte')) return false;
    const nota = herois().find((h) => salaDoPosto(h.pos) === 'Z5' && passivePerception(h) >= 13);
    if (!nota) return false;
    abrirSecreta('fonte');
    await painel(`${nota.name} nota uma depressão na pedra do canto noroeste, gasta pelo uso. Empurrada, ela cede: uma passagem baixa, e do outro lado, vapor e o barulho de água.`);
    return true;
  }

  async function suite() {
    if (z.jarroOuvido) return false;
    const ouve = herois().find((h) => salaDoPosto(h.pos) === 'Z10' && passivePerception(h) >= 15);
    if (!ouve) return false;
    z.jarroOuvido = true;
    await painel(`${ouve.name} ouve um murmúrio. Não vem da porta, nem do corredor: vem de um jarro de ônix na prateleira, com gemas azuis e linhas retas gravadas em volta.`);
    return true;
  }

  // ------------------------------------------------- depois de cada passo ----
  async function depoisDoPasso() {
    if (!estado.explorando) return;
    await fumaca(herois());
    const salas = new Set(herois().map((h) => salaDoPosto(h.pos)));
    if (!z.vigias && salas.has('Z2') && vigias.length) {
      // entraram sem falar com eles (pelo túnel, pela fonte): os vigias estão de costas, olhando para fora
      z.vigiasSurpresos = true;
    }
    if ((salas.has('Z3') || salas.has('corredor')) && await chegarAoRefeitorio()) return;
    if (salas.has('Z4') && await entrarNoDormitorio()) return;
    if (salas.has('Z7') && await entrarNaForja()) return;
    if (salas.has('Z5')) await latrinas();
    if (salas.has('Z10')) await suite();
    if ((salas.has('Z9') || salas.has('Z8')) && !z.tunelAchado) {
      z.tunelAchado = true;
      abrirAresta({ x: P.tunel.x, y: P.tunel.y - 1 }, P.tunel);
    }
  }

  // -------------------------------------------------------------- o fim ----
  async function fimDoCombate(outcome) {
    const qual = estado.qual;
    const lutou = estado.lutando ?? [];
    if (outcome !== 'vitoria') {
      // O REFEITÓRIO QUER O GRUPO VIVO (o livro): se a briga foi com eles, o grupo acorda preso no Santuário.
      const subjugados = lutou.some((f) => f.naoLetal && !f.dead) && todos().length;
      if (subjugados) {
        estado.encerrado = true;
        z.capturados = true;
        for (const h of todos()) {
          h.hp = Math.max(1, h.hp);
          for (const id of ['inconsciente', 'caido']) removeCondition(h, id);
          h.stable = false;
          h.deathSaves = { successes: 0, failures: 0 };
        }
        await narrar(root, { formato: 'tela', paginas: [{ titulo: 'O Repouso de Zorzula', texto: [
          'Muitas mãos pequenas, muitas cordas. O mundo apaga.',
          'Vocês acordam com o rosto na pedra fria e lisa, num lugar de luz azul, de mãos amarradas e sem as armas na mão. Ao lado, três prisioneiros magros olham para vocês sem esperança nenhuma.',
        ] }] });
        app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'santuarioIndigo', continuarCom: todos(), comoPresos: true });
        return;
      }
      estado.encerrado = true;
      await narrar(root, { formato: 'tela', paginas: [{ titulo: 'O Repouso de Zorzula', texto: ['A fumaça azul sobe devagar das rachaduras, e ninguém sai do posto para contar a Phandalin o que houve.'] }] });
      app.encerrarPartida();
      return;
    }
    if (qual === 'portao') {
      z.vigias = 'mortos';
      if (lutou.some((f) => refeitorio.includes(f))) z.refeitorio = 'limpo';
      await painel('As seteiras ficam quietas. Lá dentro, uma alavanca espera alguém que a puxe.');
      await darXpDaLuta(lutou, 'Os vigias do portão');
    } else if (qual === 'refeitorio') {
      z.refeitorio = 'limpo';
      await painel('O refeitório fica quieto, com pratos virados e bancos caídos. O cheiro da comida continua bom.');
      await darXpDaLuta(lutou, 'O refeitório do posto');
    } else if (qual === 'dormitorio') {
      z.dormitorio = 'mortos';
      await darXpDaLuta(lutou, 'O dormitório');
    } else if (qual === 'forja') {
      z.forja = 'limpa';
      const texto = ['Os vultos se desfazem em cinza que o calor leva pelos janelões. Os martelos caem no chão de verdade, pela primeira vez em muito tempo, com barulho.'];
      if (z.trato) {
        texto.push('Do corredor, cabecinhas espiando. — Acabou? Acabou mesmo? — Os goblins do trato cumprem a palavra: ninguém mais encosta em vocês no posto.');
        for (const g of [...refeitorio, ...dormindo]) if (!g.dead && g.side !== 'foes') g.side = 'neutro';
      }
      await painel(texto);
      await darXpDaLuta(lutou, 'Os ashenwights da forja');
    }
    prepararExploracao();
  }

  // ------------------------------------------------------- as interações ----
  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    const aqui = (p) => p && tile.x === p.x && tile.y === p.y;
    const sala = salaDoPosto(tile);

    // O PORTÃO (de fora): conversar com os vigias, ou empurrar a pedra por um minuto
    if (em(P.portao, { x: tile.x, y: tile.y + 1 }) || em(P.portao, tile)) {
      if (!portaoAberto()) {
        if (salaDoPosto(c.pos) === 'Z1' && vigias.some((v) => !v.dead) && !['abriram', 'luta', 'mortos'].includes(z.vigias)) {
          ops.push({ rotulo: 'Falar com os vigias das seteiras', icone: 'acao-procurar', motivo: longe(c, tile, 30), fazer: () => falarComOsVigias(c) });
        }
        ops.push({
          rotulo: 'Empurrar a porta de pedra', icone: 'acao-empurrar', detalhe: 'um minuto de esforço', motivo: longe(c, tile),
          fazer: async () => {
            if (vigias.some((v) => !v.dead) && !['abriram', 'mortos'].includes(z.vigias)) {
              await painel('A pedra mal começa a ceder e uma flecha estala no chão, aos pés de vocês. — Ei! Larga a porta!', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
              return lutaNoPortao();
            }
            await painel(`${c.name} apoia o ombro na pedra. Um minuto de força e de pés escorregando no cascalho, e a porta se abre para dentro, rangendo.`);
            abrirPortao();
          },
        });
      }
    }
    // A ALAVANCA do parapeito, por dentro
    if (aqui(P.alavanca) && !portaoAberto()) {
      ops.push({ rotulo: 'Puxar a alavanca', icone: 'acao-usarObjeto', detalhe: 'abre a porta de pedra', motivo: longe(c, tile), fazer: async () => {
        await painel('Uma corrente corre dentro da rocha, e a porta de pedra se abre para dentro, devagar.');
        abrirPortao();
      } });
    }
    // A TOCA DA BESSIE, de fora: Percepção CD 16 de quem explora em volta (uma vez por herói)
    if (sala === 'Z1' && aqui({ x: P.tunel.x, y: P.tunel.y - 1 }) && !z.tunelAchado) {
      ops.push({ rotulo: 'Procurar em volta do paredão', icone: 'acao-procurar', detalhe: 'Percepção CD 16', motivo: longe(c, tile) ?? ((z.buscas.tunel ??= []).includes(c.id) ? `${c.name} já procurou aqui` : null), fazer: async () => {
        z.buscas.tunel.push(c.id);
        const t = teste(c, 'percepcao', 16);
        if (!t.passou) { await painel(`${c.name} (${t.nome} ${t.total}) só acha cascalho e calor.`); return; }
        z.tunelAchado = true;
        abrirAresta({ x: P.tunel.x, y: P.tunel.y - 1 }, P.tunel);
        await painel(`${c.name} (${t.nome} ${t.total}) acha, atrás de uma pedra, um túnel cavado na encosta: dá para entrar de gatinhas. E mais adiante, no alto, um fio de vapor sai de uma fenda na rocha — o respiro de alguma fonte quente lá dentro.`);
      } });
    }
    // A FONTE: dez minutos de molho curam 1d6 de quem está na água; o respiradouro sobe 12 m (Atletismo 18)
    if (sala === 'Z6') {
      ops.push({ rotulo: 'Ficar de molho dez minutos', icone: 'acao-curar', detalhe: '1d6 PV para quem está na água', motivo: longe(c, tile, 10), fazer: async () => {
        const na = todos().filter((h) => salaDoPosto(h.pos) === 'Z6');
        const linhas = na.map((h) => {
          const cura = damageRoll(enc.rng, '1d6').total;
          const antes = h.hp;
          h.hp = Math.min(h.maxHp, h.hp + cura);
          return `${h.name} recupera ${h.hp - antes} PV.`;
        });
        await painel(['A água quente afrouxa cada músculo. Dez minutos passam sem ninguém perceber.', ...linhas]);
        app.refresh();
      } });
      ops.push({ rotulo: 'Subir pelo respiradouro', icone: 'acao-disparada', detalhe: 'Atletismo CD 18 · 12 m', motivo: longe(c, tile, 10), fazer: async () => {
        const t = teste(c, 'atletismo', 18);
        if (!t.passou) {
          const dano = damageRoll(enc.rng, '1d6').total;
          enc.applyDamage(c, dano, 'concussão', null, {});
          await painel(`${c.name} (${t.nome} ${t.total}) escorrega na pedra molhada a meio caminho e cai na água com um barulho enorme (${dano} de dano).`);
          return;
        }
            const fora = enc.casaLivreMaisProxima({ x: 8, y: 1 }) ?? { x: 8, y: 1 };
        c.pos = { ...c.pos, ...fora };
        await painel(`${c.name} (${t.nome} ${t.total}) sobe pela chaminé de vapor, de costas numa parede e pés na outra, e sai na encosta, do lado de fora.`);
        app.refresh();
      } });
    }
    // O ELEVADOR: o cristal recarrega com um espaço de magia; o mecanismo, com Arcanismo CD 16
    if (aqui(P.elevador) || (sala === 'Z4' && aqui({ x: P.elevador.x + 1, y: P.elevador.y }))) {
      const slots = c.spellcasting?.slots ?? [];
      const espaco = slots.findIndex((n, i) => i >= 1 && n > 0);
      if (z.elevador) {
        ops.push({ rotulo: 'Descer pelo elevador', icone: 'acao-disparada', detalhe: '9 m até as minas', motivo: longe(c, tile),
          fazer: () => sairPara({ cenaDaVila: 'zorzulaMinas', chegada: 'elevador' }) });
      } else if (!z.cristalElevador) {
        ops.push({ rotulo: 'Recarregar o cristal do elevador', icone: 'acao-usarObjeto', detalhe: 'gasta um espaço de magia',
          motivo: longe(c, tile) ?? (espaco < 1 ? `${c.name} não tem espaço de magia` : null), fazer: async () => {
            slots[espaco] -= 1;
            z.cristalElevador = true;
            await painel(`${c.name} toca o cristal e deixa uma magia escorrer para ele. A rachadura continua, mas lá dentro uma luz cor de violeta acende e pulsa, como um coração.`);
            app.refresh();
          } });
      } else {
        ops.push({ rotulo: 'Consertar o mecanismo', icone: 'acao-usarObjeto', detalhe: 'Arcanismo CD 16', motivo: longe(c, tile) ?? ((z.buscas.elevador ??= []).includes(c.id) ? `${c.name} já tentou` : null), fazer: async () => {
          z.buscas.elevador.push(c.id);
          const ferramentas = garantirInventario(c).bag.some((i) => i.id === 'ferramentasDeFunileiro' && i.qtd > 0);
          const r = rolarPericia(enc.rng, c, 'arcanismo', ferramentas ? { advantage: true } : {});
          if (r.total < 16) { await painel(`${c.name} (Arcanismo ${r.total}) mexe nas engrenagens, e elas emperram de novo.`); return; }
          z.elevador = true;
          await painel(`${c.name} (Arcanismo ${r.total}) acerta o encaixe. Com um gemido de pedra, a plataforma sobe pelo poço e para aqui; um minuto depois, desce de novo, e assim por diante, sem parar.`);
          app.refresh();
        } });
      }
    }
    // A FORJA: a porta barricada, do corredor
    if (!z.barricada && em([P.esteira, { x: 10, y: 12 }, { x: 10, y: 13 }], tile) && salaDoPosto(c.pos) !== 'Z7') {
      if (tile.x === 10) {
        ops.push({ rotulo: 'Tirar a barricada da porta', icone: 'acao-empurrar', detalhe: 'Atletismo CD 12', motivo: longe(c, tile), fazer: async () => {
          const t = teste(c, 'atletismo', 12);
          if (!t.passou) { await painel(`${c.name} (${t.nome} ${t.total}) puxa uma tábua, e ela não sai.`); return; }
          z.barricada = 'tirada';
          enc.field.trancas?.delete('10,13,N');
          await painel(`${c.name} (${t.nome} ${t.total}) arranca as tábuas e a viga de ferro que os goblins pregaram na porta. Do outro lado, um martelo bate em metal, devagar, sem parar.`);
          app.refresh();
        } });
      }
    }
    // A ESTEIRA DE BALDES (Z7): o cristal (um espaço de magia ou uma lasca), o mecanismo (Arcanismo 16) e a viagem
    // (Acrobacia 15; quem falha cai 6 m no chão da forja, 2d6) até o depósito das minas.
    if (aqui(P.esteira) && z.forja === 'limpa') {
      const slots = c.spellcasting?.slots ?? [];
      const espaco = slots.findIndex((n, i) => i >= 1 && n > 0);
      const lasca = garantirInventario(c).bag.find((i) => i.id === 'lascaDeCristal' && i.qtd > 0);
      if (!z.cristalEsteira) {
        ops.push({ rotulo: 'Recarregar o cristal da esteira', icone: 'acao-usarObjeto', detalhe: 'um espaço de magia ou uma lasca',
          motivo: longe(c, tile) ?? (espaco < 1 && !lasca ? `${c.name} não tem espaço de magia nem lasca` : null), fazer: async () => {
            if (lasca) lasca.qtd -= 1; else slots[espaco] -= 1;
            z.cristalEsteira = true;
            await painel(`${c.name} sobe a escada e toca o cristal da esteira. Ele acende, violeta, e os baldes lá no alto balançam.`);
            app.refresh();
          } });
      } else if (!z.esteira) {
        ops.push({ rotulo: 'Consertar a esteira', icone: 'acao-usarObjeto', detalhe: 'Arcanismo CD 16', motivo: longe(c, tile) ?? ((z.buscas.esteira ??= []).includes(c.id) ? `${c.name} já tentou` : null), fazer: async () => {
          z.buscas.esteira.push(c.id);
          const ferramentas = garantirInventario(c).bag.some((i) => i.id === 'ferramentasDeFunileiro' && i.qtd > 0);
          const r = rolarPericia(enc.rng, c, 'arcanismo', ferramentas ? { advantage: true } : {});
          if (r.total < 16) { await painel(`${c.name} (Arcanismo ${r.total}) força uma engrenagem, e a corrente escapa de novo.`); return; }
          z.esteira = true;
          await painel(`${c.name} (Arcanismo ${r.total}) põe a corrente no lugar. Os baldes começam a andar, rangendo, e somem por um buraco no chão — descendo até as minas.`);
          app.refresh();
        } });
      } else {
        ops.push({ rotulo: 'Montar nos baldes', icone: 'acao-disparada', detalhe: 'Acrobacia CD 15 · desce às minas', motivo: longe(c, tile), fazer: async () => {
          const t = teste(c, 'acrobacia', 15);
          if (!t.passou) {
            const dano = damageRoll(enc.rng, '2d6').total;
            enc.applyDamage(c, dano, 'concussão', null, {});
            await painel(`${c.name} (${t.nome} ${t.total}) agarra um balde, ele vira, e a queda de seis metros acaba no chão da forja (${dano} de dano).`);
            app.refresh();
            return;
          }
          await painel(`${c.name} (${t.nome} ${t.total}) pula num balde, e os outros vêm atrás. A esteira desce pelo buraco no escuro, cheirando a ferro, e despeja vocês no depósito das minas.`);
          sairPara({ cenaDaVila: 'zorzulaMinas', chegada: 'esteira' });
        } });
      }
    }
    // O TESOURO DA FORJA: Investigação CD 13 acha um; três a mais, dois
    if (sala === 'Z7' && z.forja === 'limpa' && !z.tesouroForja && sup !== 'lava') {
      ops.push({ rotulo: 'Revirar as peças inacabadas', icone: 'acao-procurar', detalhe: 'Investigação CD 13', motivo: (z.buscas.forja ??= []).includes(c.id) ? `${c.name} já revirou` : null, fazer: async () => {
        z.buscas.forja.push(c.id);
        const t = teste(c, 'investigacao', 13);
        if (!t.passou) { await painel(`${c.name} (${t.nome} ${t.total}) só acha ferro inacabado e cinza.`); return; }
        // O livro dá um item (três a mais, dois) entre quatro, à escolha do mestre: aqui são os dois que a ARTE desenha e
        // que o pacote da FA sabe tirar do desenho — a lança do suporte e o peitoral do manequim.
        z.tesouroForja = t.total >= 16 ? 2 : 1;
        guardar(c, 'azagaiaDoRaio', 1);
        enc.field.alternarSobreposicao?.('semLanca', true);
        const linhas = [`${c.name} (${t.nome} ${t.total}) olha o suporte de lanças com atenção: uma delas não é inacabada. Tem a ponta dourada, e dá um choquinho na mão.`];
        if (t.total >= 16) {
          guardar(c, 'peitoralDeQuartzo', 1);
          enc.field.alternarSobreposicao?.('semArmadura', true);
          linhas.push('E o peitoral do manequim, debaixo da fuligem, é de bronze bom, cravejado de quartzo na gola. Sai do suporte com algum esforço.');
        }
        await painel(linhas);
        app.refresh();
      } });
    }
    // A BESSIE
    if (aqui(bessie.pos) && !bessie.dead) {
      ops.push({ rotulo: 'Coçar a barriga da Bessie', icone: 'acao-procurar', motivo: longe(c, tile), fazer: () => painel([
        `${c.name} coça a barriga dela. A Bessie fecha os olhos, estica as quatro patas e solta um ronco de satisfação que faz tremer as panelas.`,
        'No pescoço, uma plaquinha de lata com uma palavra em goblin riscada a prego. Quem lê goblin lê: "BESSIE". Embaixo, menor: "NÃO DÁ COMIDA".',
      ]) });
    }
    // A DESPENSA: Investigação CD 15 atrás das garrafas de vinho azedo
    if (sala === 'Z9' && !z.pocoesDespensa) {
      ops.push({ rotulo: 'Revistar a despensa', icone: 'acao-procurar', detalhe: 'Investigação CD 15', motivo: longe(c, tile) ?? ((z.buscas.despensa ??= []).includes(c.id) ? `${c.name} já revistou` : null), fazer: async () => {
        z.buscas.despensa.push(c.id);
        const t = teste(c, 'investigacao', 15);
        if (!t.passou) { await painel(`${c.name} (${t.nome} ${t.total}) acha comida velha, mordida, e um cheiro de mofo.`); return; }
        z.pocoesDespensa = true;
        guardar(c, 'pocaoDeCuraMaior', 2);
        guardar(c, 'pocaoDeFortitudePsionica', 1);
        await painel(`${c.name} (${t.nome} ${t.total}) afasta as garrafas de vinho azedo e acha, atrás delas, três frascos esquecidos: duas poções de cura maior e uma de um líquido violeta que zumbe.`);
        app.refresh();
      } });
    }
    // A SUÍTE: o jarro, a cama, as runas
    if (aqui(P.jarro) && z.jarroOuvido && !z.hjoldak) {
      ops.push({ rotulo: 'Abrir o jarro', icone: 'acao-usarObjeto', detalhe: 'Investigação CD 15', motivo: longe(c, tile) ?? ((z.buscas.jarro ??= []).includes(c.id) ? `${c.name} já tentou` : null), fazer: async () => {
        z.buscas.jarro.push(c.id);
        const t = teste(c, 'investigacao', 15);
        if (!t.passou) { await painel(`${c.name} (${t.nome} ${t.total}) gira as gemas da tampa de todo jeito, e o fecho não cede. O murmúrio fica mais aflito.`); return; }
        await soltarHjoldak(c, `${c.name} (${t.nome} ${t.total}) acha a ordem das gemas, e a tampa gira.`);
      } });
      ops.push({ rotulo: 'Quebrar o jarro', icone: 'acao-empurrar', detalhe: 'Atletismo CD 20', motivo: longe(c, tile), fazer: async () => {
        const t = teste(c, 'atletismo', 20);
        if (!t.passou) { await painel(`${c.name} (${t.nome} ${t.total}) bate o jarro na mesa. O ônix nem arranha.`); return; }
        await soltarHjoldak(c, `${c.name} (${t.nome} ${t.total}) racha o ônix contra a quina da mesa.`);
      } });
    }
    if (aqui(P.cama) && !z.camaAberta) {
      ops.push({ rotulo: 'Examinar a cama', icone: 'acao-procurar', detalhe: z.hjoldak ? 'o Hjoldak sabe onde' : 'Investigação CD 20', motivo: longe(c, tile) ?? ((z.buscas.cama ??= []).includes(c.id) && !z.hjoldak ? `${c.name} já examinou` : null), fazer: async () => {
        const t = z.hjoldak ? { passou: true, total: '—', nome: 'Investigação' } : teste(c, 'investigacao', 20);
        (z.buscas.cama ??= []).push(c.id);
        if (!t.passou) { await painel(`${c.name} (${t.nome} ${t.total}) levanta o colchão de seda e não acha nada além de seda.`); return; }
        z.camaAberta = true;
        guardar(c, 'adagaDeVeneno', 1);
        guardar(c, 'gemaElemental', 1);
        await painel([z.hjoldak ? 'O Hjoldak aponta o pé da cama: — Ali. Era meu.' : `${c.name} (${t.nome} ${t.total}) acha um contorno fino na madeira da cabeceira.`,
          'Um compartimento escondido: uma adaga de lâmina negra e uma esmeralda grande, que parece ter um vento preso dentro.']);
        app.refresh();
      } });
    }
    if (aqui(P.runas) && !z.secretas?.includes('cofre')) {
      if (!z.runasVistas) {
        ops.push({ rotulo: 'Examinar a parede norte', icone: 'acao-procurar', detalhe: 'Percepção CD 16', motivo: longe(c, tile) ?? ((z.buscas.runas ??= []).includes(c.id) ? `${c.name} já examinou` : null), fazer: async () => {
          z.buscas.runas.push(c.id);
          const t = teste(c, 'percepcao', 16);
          if (!t.passou) { await painel(`${c.name} (${t.nome} ${t.total}) passa a mão pela parede, e ela parece parede.`); return; }
          z.runasVistas = true;
          await painel(`${c.name} (${t.nome} ${t.total}) acha quatro runas anãs quase apagadas, em fila, da esquerda para a direita: tempestade, morte, luz e vento. Cada uma afunda um pouco quando se aperta.`);
          app.refresh();
        } });
      } else {
        ops.push({ rotulo: 'Tocar as runas numa ordem', icone: 'acao-usarObjeto', detalhe: 'a ordem errada dispara', motivo: longe(c, tile), fazer: () => tocarAsRunas(c) });
      }
    }
    if (em(P.cofre, tile) && z.secretas?.includes('cofre') && !z.cofreRecolhido) {
      ops.push({ rotulo: 'Recolher o tesouro do cofre', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
        z.cofreRecolhido = true;
        enc.field.alternarSobreposicao?.('semTesouro', true);
        for (const [id, n] of [['moedaDePlatina', 56], ['moedaDeOuro', 350], ['moedaDePrata', 189], ['moedaDeCobre', 304], ['jade', 4],
          ['peridotoGrande', 1], ['tapecariaDuergar', 3], ['brocadoDeVeludo', 1]]) guardar(c, id, n);
        await painel(['O ar do cofre está parado há muito tempo. Moedas duergar antigas em pilhas tortas — platina, ouro, prata, cobre —, quatro jades, um peridoto do tamanho de um ovo de codorna, três tapeçarias escuras de fio de metal e um corte de veludo bordado.',
          'Uns dois mil e duzentos de ouro, ao todo. Ninguém tocava nisto desde os duergar.']);
        app.refresh();
      } });
    }
    // A SAÍDA: a borda de cima do mapa, do lado de fora, volta à região
    if (tile.y === 0 && salaDoPosto(tile) === 'Z1') {
      ops.push({ rotulo: 'Voltar à região', icone: 'acao-disparada', detalhe: 'deixar o posto', motivo: longe(c, tile), fazer: () => {
        estado.encerrado = true;
        root.classList.remove('explorando');
        app.capitulo = null; app.enc = null; app.board = null; app.selected = null; app.mode = null;
        import('./regiao.js').then(({ abrirRegiao }) => abrirRegiao(app, { grupo: todos(), onde: 'zorzula' }));
      } });
    }
    return ops;
  }

  function sairPara(destino) {
    estado.explorando = false;
    estado.encerrado = true;
    root.classList.remove('explorando');
    app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, ...destino, continuarCom: todos() });
  }

  async function soltarHjoldak(c, abertura) {
    z.hjoldak = 'livre';
    hjoldak = nasce('ashenwightPsionico', { x: P.jarro.x, y: P.jarro.y + 1 }, null, 'Hjoldak Hollowhelm');
    hjoldak.pos = { ...hjoldak.pos, ...(enc.casaLivreMaisProxima(hjoldak.pos) ?? hjoldak.pos) };
    entrarNeutro(hjoldak, { dx: -1, dy: 0 });
    hjoldak.falas = ['— As runas do cofre? Tempestade, morte, luz e vento, nessa ordem. Eu mesmo as pus.',
      '— O elevador e a esteira andam a cristal. Uma magia no cristal e um bom par de mãos no mecanismo.',
      '— O goblin de cabeça grande some cada vez mais. Lê, sai correndo, volta. Trabalha em algum lugar mais fundo, lá embaixo.'];
    await painel([abertura, 'Um sopro frio sai do jarro e se junta no ar: um anão cinzento, de barba trançada e olhos de brasa apagada, que olha as próprias mãos como quem não as via há muito tempo.',
      '— Hjoldak Hollowhelm, capitão de mineração deste posto. Os cabeças-de-polvo me puseram aí dentro. Obrigado. — Ele faz uma mesura dura. — Conheço cada pedra daqui, as escondidas também. Vou com vocês.']);
    pista('Hjoldak Hollowhelm, o último capitão do posto, solto do jarro: diz que o Ruxithid trabalha em algum lugar mais fundo, lá embaixo.');
    app.refresh();
  }

  async function tocarAsRunas(c) {
    const nomes = { tempestade: 'Tempestade', morte: 'Morte', luz: 'Luz', vento: 'Vento' };
    const ordem = [];
    for (let i = 0; i < 4; i++) {
      const resta = ORDEM_DAS_RUNAS.filter((r) => !ordem.includes(r));
      const r = await painel(`${i === 0 ? 'Qual runa primeiro?' : `Já tocadas: ${ordem.map((x) => nomes[x]).join(', ')}. E agora?`}${z.hjoldak && i === 0 ? ' (O Hjoldak sussurra: tempestade, morte, luz, vento.)' : ''}`,
        [...resta.map((x) => ({ rotulo: nomes[x], valor: x })), { rotulo: 'Desistir', valor: 'nada' }]);
      if (!ORDEM_DAS_RUNAS.includes(r)) return;
      ordem.push(r);
      if (ORDEM_DAS_RUNAS[i] !== r) return dispararRunas(c, r);
    }
    abrirSecreta('cofre');
    await painel('A quarta runa afunda, e um pedaço da parede gira sobre um eixo, sem barulho nenhum. Atrás, um cômodo estreito e o ar parado de anos.');
  }

  async function dispararRunas(c, ultima) {
    const tipo = DANO_DA_RUNA[ultima];
    const s = salvaguarda(c, 'dex', 15);
    const dano = damageRoll(enc.rng, '3d8').total;
    if (!s.passou) enc.applyDamage(c, dano, tipo, null, { magico: true });
    await painel(s.passou
      ? `A runa errada acende inteira e cospe ${tipo}, e ${c.name} (Destreza ${s.total}) se joga para o lado a tempo.`
      : `A runa errada acende inteira e cospe ${tipo} em ${c.name} (Destreza ${s.total}): ${dano} de dano. As runas apagam e esperam.`);
    app.refresh();
  }

  // -------------------------------------------------------- a cena ----
  return {
    lugar: 'O Repouso de Zorzula',
    portasProprias: false,
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
    // os suportes que o tesouro esvaziou não mentem: o texto do objeto troca com o desenho
    async aoInteragir(obj) {
      if (obj.id === 'suporteArmadura' && z.tesouroForja === 2) { await painel('O suporte de madeira, vazio: o peitoral está com vocês.'); return true; }
      return false;
    },
    elenco: { vigias, refeitorio, dormindo, ferais, bessie },
    get hjoldak() { return hjoldak; },
    salaDe: salaDoPosto,
    async iniciar() {
      // O QUE JÁ FOI TIRADO fica vazio no desenho (as peças do pacote da FA)
      if (z.tesouroForja) enc.field.alternarSobreposicao?.('semLanca', true);
      if (z.tesouroForja === 2) enc.field.alternarSobreposicao?.('semArmadura', true);
      if (z.cofreRecolhido) enc.field.alternarSobreposicao?.('semTesouro', true);
      // o que já foi aberto numa visita anterior fica aberto
      if (portaoAberto()) abrirPortao();
      for (const nome of z.secretas ?? []) abrirSecreta(nome);
      if (!z.tunelAchado) fecharAresta({ x: P.tunel.x, y: P.tunel.y - 1 }, P.tunel);
      if (!z.barricada) (enc.field.trancas ??= new Map()).set('10,13,N', { aresta: '10,13,N', cd: 30, forca: 99, barricada: true });
      // o elenco no tabuleiro, de olho em nada: os vigias nas seteiras, o refeitório comendo, o dormitório dormindo
      for (const v of vigias) entrarNeutro(v, { dx: 0, dy: -1 });
      // sentados à mesa, de frente para ela: a fileira 7 olha para baixo (a mesa de 7/8), a 8 para cima; a 10 para baixo
      // (a mesa de 10/11), a 11 para cima
      for (const g of refeitorio) entrarNeutro(g, { dx: 0, dy: [7, 10].includes(g.pos.y) ? 1 : [8, 11].includes(g.pos.y) ? -1 : 1 });
      for (const g of dormindo) { entrarNeutro(g, { dx: 1, dy: 0 }); if (z.dormitorio !== 'quietos') addCondition(g, 'caido'); }
      for (const f of ferais) entrarNeutro(f, { dx: 0, dy: 1 });
      entrarNeutro(bessie, { dx: -1, dy: 0 });
      if (z.hjoldak === 'livre') {
        hjoldak = nasce('ashenwightPsionico', P.jarro, null, 'Hjoldak Hollowhelm');
        hjoldak.pos = { ...hjoldak.pos, ...(enc.casaLivreMaisProxima(hjoldak.pos) ?? hjoldak.pos) };
        entrarNeutro(hjoldak, { dx: -1, dy: 0 });
      }
      // DE ONDE O GRUPO CHEGA: o elevador das minas sobe ao dormitório; a esteira, à forja
      const chegada = config.chegada === 'elevador' ? [{ x: 5, y: 10 }, { x: 6, y: 10 }, { x: 5, y: 11 }, { x: 6, y: 11 }]
        : config.chegada === 'esteira' ? [{ x: 20, y: 15 }, { x: 19, y: 15 }, { x: 20, y: 16 }, { x: 19, y: 14 }] : null;
      if (chegada) {
        z.chegou = true;
        for (const [i, h] of todos().entries()) h.pos = { ...h.pos, ...(enc.casaLivreMaisProxima(chegada[i] ?? chegada[0]) ?? chegada[0]) };
      }
      if (!z.chegou) {
        z.chegou = true;
        await painel(['Um dia de marcha para o leste, Montanhas da Espada adentro. O cascalho escurece a cada hora, o mato some, e o ar esquenta como se houvesse um forno embaixo da montanha.',
          'No fim da trilha, um paredão liso e, nele, uma porta dupla de pedra escura, sem maçaneta. Duas fendas estreitas, uma de cada lado, a três metros do chão.']);
        // Explorando em volta (o livro): Percepção CD 16 acha o túnel da Bessie e o respiradouro da fonte
        const quem = melhor('percepcao');
        const t = quem ? teste(quem, 'percepcao', 16) : { passou: false };
        if (t.passou) {
          z.tunelAchado = true;
          abrirAresta({ x: P.tunel.x, y: P.tunel.y - 1 }, P.tunel);
          await painel(`Rodeando o paredão, ${quem.name} (${t.nome} ${t.total}) acha duas coisas: um túnel cavado na encosta, largo o bastante para entrar de gatinhas, e, bem no alto, um fio de vapor saindo de uma fenda.`);
        }
      }
      prepararExploracao();
    },
  };
}
