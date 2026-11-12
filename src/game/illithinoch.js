// ILLITHINOCH (o Obelisco, capítulo 7): a fortaleza dos devoradores de mentes no fim do túnel, sobre o battlemap da FA
// (`illithinoch-mapa.js`, de `src/dev/mapa-illithinoch.py`). Os três fanáticos já não estão aqui: atravessaram o portal de
// X16 com os cacos do obelisco e os presos de Phandalin, e o portal fechou.
//
// O QUE É DO LIVRO (as regras; o texto é nosso):
//   - AS PORTAS de pedra não têm maçaneta: abrem quando alguém as encara, com um PULSO mental (desagradável, sem dano)
//     que só o cérebro ancião ouve. A primeira porta aberta põe a fortaleza em ALERTA. Fecham sozinhas um minuto depois,
//     quando o vão está livre (aqui: dez passos do grupo);
//   - O VÍNCULO PSÍQUICO: quem fica incapacitado aqui ganha o vínculo do cérebro ancião, até rompê-lo (ação, Carisma CD 17,
//     e 3d6 psíquicos) ou até o cérebro morrer. Os casulos de X8 e X12 dão o vínculo a quem deita neles;
//   - O QUALITH, nas portas de X3, X7, X8 e X14: Inteligência CD 18 para ler; quem falha faz Sabedoria CD 13 contra 5d6
//     psíquicos (metade se passar);
//   - X2: Shalghast e Ulthundul perguntam se o grupo veio adorar Ilvaash ou trazer cacos; quem engana o Detectar
//     Pensamentos passa (aqui, Enganação contra a Intuição deles, CD 16), e eles oferecem o muco da estátua (resistência a
//     psíquico por 10 minutos); quem não engana, luta, e eles lutam até a morte;
//   - X4: o comandante goblin psíquico e três lutadores, saqueando; X5: os dois slaadi mandam o grupo SAIR, e atacam se
//     ele não obedece na hora; os girinos secos (Investigação CD 10);
//   - X6: os cristais de memória (Investigação CD 13 acha os três novos e o que não é memória: o cristal elevado);
//   - X7: o OSHUNDO conversa antes de lutar, conta o que sabe, e vira aliado relutante se o grupo lhe der os cristais
//     mentais que achou; não sai da sala; os mapas valem 4.000 po; X8: as cartas e o tinteiro de âmbar;
//   - X10: Ahooshathan e dois nothics; ele SE RENDE se os dois caem, ou se está muito ferido, e troca o que sabe pela vida;
//   - X11: Duoro e Larnon; Enganação CD 12 engana o Duoro; ele luta até morrer, e o Larnon foge se ele cai;
//   - X12: seis nothics, e o cristal distante num casulo velho; X14: o profeta Gulguush e o homúnculo, ESCONDIDOS atrás da
//     poltrona para emboscar se a fortaleza está em alerta; o livro dele e as duas poções iguais;
//   - X15: o cérebro ancião luta até a morte na sala dele; morto, os sigilos param e os vínculos se rompem; os três
//     cristais no fundo da piscina;
//   - X16: o nicho, a parede de planos e o PORTAL: com os três gnawbles a até 6 m do nicho, ele reabre, os gnawbles
//     explodem, o grupo vê os presos sendo arrastados, e sobe ao 10º nível (o marco).
//
// DECISÕES NOSSAS, ditas: o Larnon que se converte num segundo zelote 1d4 horas depois de o grupo recuar não entra (o jogo
// não conta horas dentro da fortaleza); "fuçar onde não deve" depois de enganar X2 também não. As fendas de X4, X5 e X10
// levam às três cenas de `fendas.js`.
//
// O estado mora em `app.campanha.obelisco7.illi`.

import { narrar } from '../view/narrativa.js';
import { distanceFt, ARESTA } from '../core/grid.js';
import { damageRoll } from '../core/dice.js';
import { rolarPericia, SKILL_NAME, skillBonus, abilityMod } from '../rules/abilities.js';
import { makeMonster } from '../rules/monsters.js';
import { hasCondition, addCondition, removeCondition, conditionEffects } from '../rules/conditions.js';
import { garantirInventario } from '../rules/equipment.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { guardar } from './comercio.js';
import { portasDaCasa } from './portas.js';
import { darMarco } from './obelisco5-vila.js';
import { rolarViagem } from './tunel-cap7.js';
import { PONTOS_ILLITHINOCH as P } from './illithinoch-mapa.js';

const MOVIMENTO = 60;
const TITULO = 'Illithinoch';
const CRISTAIS = ['cristalMentalCuidadoso', 'cristalMentalSutil', 'cristalMentalElevado', 'cristalMentalPotencializado',
  'cristalMentalDistante', 'cristalMentalAcelerado', 'cristalMentalProlongado'];
const GNAWBLES = ['gnawbleTrincheiras', 'gnawbleOco', 'gnawbleLabirinto'];
/** O elenco: chave, bloco, ponto, nome e sala. */
const ELENCO = [
  ['shalghast', 'devoradorDeMentes', P.shalghast, 'Shalghast', 'X2'],
  ['ulthundul', 'devoradorDeMentes', P.ulthundul, 'Ulthundul', 'X2'],
  ['comandante', 'goblinPsiComandante', P.comandante, null, 'X4'],
  ...P.lutadores.map((p, i) => [`lutador${i + 1}`, 'goblinPsiLutador', p, null, 'X4']),
  ['slaadVermelho', 'slaadVermelho', P.slaadVermelho, null, 'X5'],
  ['slaadAzul', 'slaadAzul', P.slaadAzul, null, 'X5'],
  ['oshundo', 'oshundo', P.oshundo, null, 'X7'],
  ['ahooshathan', 'devoradorDeMentes', P.ahooshathan, 'Ahooshathan', 'X10'],
  ...P.nothicsX10.map((p, i) => [`nothicX10_${i + 1}`, 'nothicDevoradorDeMentes', p, null, 'X10']),
  ['duoro', 'zeloteAberrante', P.duoro, 'Duoro Engletor', 'X11'],
  ['larnon', 'fanaticoDoCulto', P.larnon, 'Larnon Veddin', 'X11'],
  ...P.nothicsX12.map((p, i) => [`nothicX12_${i + 1}`, 'nothicDevoradorDeMentes', p, null, 'X12']),
  ['gulguush', 'profetaDevoradorDeMentes', P.gulguush, 'Gulguush', 'X14'],
  ['homunculo', 'homunculo', P.homunculo, null, 'X14'],
  ['cerebro', 'cerebroAnciaoInfectado', P.cerebro, null, 'X15'],
];

export const salaEmIllithinoch = (p) => {
  for (const [id, cs] of Object.entries(P.salas)) if (cs.some((c) => c.x === p.x && c.y === p.y)) return id;
  return null;
};

export function criarIllithinoch(app, config = {}) {
  const enc = app.enc;
  const root = app.root;
  const camp = (app.campanha ??= {});
  const o7 = (camp.obelisco7 ??= { feito: {}, lutas: {} });
  const t = (o7.illi ??= { feito: {}, mortos: [], alarme: false });
  t.feito ??= {};
  t.mortos ??= [];
  const vila = (camp.vila ??= { pistas: [], missoes: {} });
  const estado = { explorando: false, encerrado: false, lutando: null, portasAbertas: new Map(), filaDeEncontros: [...(config.encontros ?? [])] };
  const todos = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead);
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

  // ------------------------------------------------------------- o elenco ----
  const elenco = {};
  for (const [k, id, pos, nome, sala] of ELENCO) {
    if (t.mortos.includes(k) || (k === 'oshundo' && t.feito.oshundoAliado === false)) continue;
    const m = makeMonster(id, { ...pos });
    if (nome) m.name = nome;
    m.chaveDeIllithinoch = k;
    m.salaDeIllithinoch = sala;
    m.side = 'neutro';
    elenco[k] = m;
  }
  if (elenco.cerebro) {
    // na piscina dele, e dela não sai
    elenco.cerebro.casasPermitidas = new Set(P.salas.X15.map((q) => `${q.x},${q.y}`));
  }
  if (elenco.oshundo) elenco.oshundo.casasPermitidas = new Set(P.salas.X7.map((q) => `${q.x},${q.y}`));
  const da = (sala) => Object.values(elenco).filter((m) => m.salaDeIllithinoch === sala && vivo(m));

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
    app.refresh();
  }

  function luta(quem, { furtividade = null, nossa = false } = {}) {
    for (const f of quem) {
      if (f.dead) continue;
      f.side = 'foes';
      if (!enc.combatants.includes(f)) enc.addCombatant(f);
    }
    estado.explorando = false;
    estado.lutando = [...quem];
    root.classList.remove('explorando');
    enc.emboscada = nossa ? { emboscadores: 'party', furtividade: herois().map(() => 20) } : furtividade ? { emboscadores: 'foes', furtividade } : null;
    app.selected = null;
    enc.start();
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
    fazer(todos());
  }

  // ---------------------------------------------------------- as portas ----
  /** A porta de pedra abre pelo olhar, com o pulso; a primeira põe a fortaleza em alerta. */
  function abrirPeloOlhar(c, p) {
    enc.field.porAresta(p.a.x, p.a.y, p.b.x, p.b.y, ARESTA.aberta);
    estado.portasAbertas.set(p.chave, { p, passos: 10 });
    enc.say('acao', `${c.name} encara a porta. Ela se abre sem som, e um estalo de pratos ecoa dentro da cabeça de quem está perto.`);
    if (!t.alarme) {
      t.alarme = true;
      enc.say('acao', 'Em algum lugar fundo da fortaleza, alguma coisa enorme percebe que vocês chegaram.');
      // o Gulguush, avisado, vai se esconder atrás da poltrona da Chishinix (sai do tabuleiro até alguém entrar em X14)
      for (const m of da('X14')) { const i = enc.combatants.indexOf(m); if (i >= 0 && m.side === 'neutro') enc.combatants.splice(i, 1); }
    }
    app.refresh();
  }

  function fecharPortasSozinhas() {
    for (const [chave, reg] of estado.portasAbertas) {
      reg.passos -= 1;
      if (reg.passos > 0) continue;
      const vao = enc.combatants.some((o) => !o.dead && o.pos && [reg.p.a, reg.p.b].some((q) => o.pos.x === q.x && o.pos.y === q.y));
      if (vao) continue;
      enc.field.porAresta(reg.p.a.x, reg.p.a.y, reg.p.b.x, reg.p.b.y, ARESTA.porta);
      estado.portasAbertas.delete(chave);
      enc.say('acao', 'Uma porta de pedra se fecha sozinha, sem ninguém tocar nela.');
    }
  }

  // ---------------------------------------------------------- o vínculo ----
  function vincular(h, porque) {
    if (!vivo(elenco.cerebro) || hasCondition(h, 'vinculoPsiquico')) return;
    addCondition(h, 'vinculoPsiquico', { rounds: Infinity, source: elenco.cerebro.id });
    enc.say('condicao', `${h.name} sente uma presença enorme se encostar na mente dele ${porque}: o cérebro ancião enxerga pelos olhos de ${h.name} agora.`);
  }
  function romperVinculos() {
    for (const h of todos()) if (hasCondition(h, 'vinculoPsiquico')) removeCondition(h, 'vinculoPsiquico');
  }

  // ------------------------------------------------------------- os gatilhos ----
  async function depoisDoPasso() {
    fecharPortasSozinhas();
    if (!estado.explorando) return false;
    const hs = herois();
    const em = (sala) => hs.find((h) => salaEmIllithinoch(h.pos) === sala);
    const pronto = (sala) => da(sala).filter((m) => m.side === 'neutro');

    // X2: a pergunta dos dois devoradores
    if (em('X2') && pronto('X2').length === 2 && !t.feito.x2Enganados) {
      const r = await painel([
        'Uma estátua enorme de um devorador de mentes, de pedra verde, segura um cérebro em cada mão, e das mãos pinga um muco numa poça. Diante dela, dois devoradores de mentes de verdade se viram para vocês, sem pressa.',
        '— Vieram adorar Ilvaash — pergunta o da esquerda, direto na cabeça de cada um —, ou trazem mais pedaços da pedra? — O da direita apenas olha, e vocês sentem dedos frios remexendo os pensamentos da superfície.',
      ], [
        { rotulo: 'Dizer que vieram adorar (Enganação, CD 16)', valor: 'enganar', primaria: true },
        { rotulo: 'Atacar', valor: 'atacar' },
        { rotulo: 'Recuar para os portões', valor: 'recuar' },
      ]);
      if (r === 'atacar') return luta(da('X2'));
      if (r === 'recuar') {
        for (const h of hs) { const q = enc.casaLivreMaisProxima(P.grupo[0]); if (q) h.pos = { ...h.pos, x: q.x, y: q.y }; }
        app.refresh();
        return false;
      }
      const quem = melhor('enganacao');
      const teste = rolarPericia(enc.rng, quem, 'enganacao');
      if (teste.total < 16) {
        await painel(`${quem.name} (${SKILL_NAME.enganacao} ${teste.total}) fala de Ilvaash, mas o devorador da direita inclina a cabeça: ele viu a mentira por baixo das palavras.`, [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
        return luta(da('X2'));
      }
      t.feito.x2Enganados = true;
      await painel([`${quem.name} (${SKILL_NAME.enganacao} ${teste.total}) fala da Psique Dissonante com o fervor certo. Os dois trocam um olhar.`,
        '— A piscina ao lado — diz o da esquerda, apontando o leste. — Há outros lá esperando a vez. — E, depois de um instante: — O muco da estátua alimenta. Bebam, se quiserem.']);
      return false;
    }

    // X4: os goblins saqueando o laboratório
    if (em('X4') && pronto('X4').length) {
      await painel('No laboratório, um goblin de olhos acesos grita ordens em goblin para três outros que reviram as estantes. Todos param e viram para vocês.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      return luta(da('X4'));
    }
    // X5: os slaadi mandam sair
    if (em('X5') && pronto('X5').length && !t.feito.x5Saiu) {
      const r = await painel(['Um orrery de ferro gira devagar no meio da sala. Na frente dele, dois sapos enormes de pé, um vermelho e um azul, com garras como foices.',
        '— FORA — ronca o azul, na língua de vocês, por obrigação. — Agora.'], [
        { rotulo: 'Obedecer e sair', valor: 'sair', primaria: true },
        { rotulo: 'Ficar', valor: 'ficar' },
      ]);
      if (r === 'sair') {
        t.feito.x5Saiu = true;
        for (const h of hs.filter((x) => salaEmIllithinoch(x.pos) === 'X5')) { const q = enc.casaLivreMaisProxima({ x: 13, y: 33 }); if (q) h.pos = { ...h.pos, x: q.x, y: q.y }; }
        app.refresh();
        return false;
      }
      return luta(da('X5'));
    }
    if (t.feito.x5Saiu && em('X5') && pronto('X5').length) {
      await painel('Os dois slaadi não falam desta vez.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      return luta(da('X5'));
    }
    // X7: o Oshundo conversa primeiro
    if (em('X7') && vivo(elenco.oshundo) && elenco.oshundo.side === 'neutro' && !t.feito.oshundoViu) {
      t.feito.oshundoViu = true;
      await painel(['Numa sala de cadeiras acolchoadas, um devorador de mentes de pele seca como pergaminho, de manto escarlate de gola alta, flutua a um palmo do chão. Ele projeta linhas de luz para dentro de um cristal laranja: mapas.',
        'Ele só percebe vocês quando vocês já estão dentro. Os tentáculos param no ar. — Ora. Visitas. — E, para si mesmo: — Qual de vocês será o mais saboroso?']);
      return false;
    }
    // X10: Ahooshathan e os nothics
    if (em('X10') && pronto('X10').length) {
      await painel('Sobre uma laje, um nothic aberto ao meio. Um devorador de mentes e dois nothics de tentáculos sob o olho se debruçam sobre ele, e se viram juntos para vocês.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      return luta(da('X10'));
    }
    // X11: Duoro e Larnon
    if (em('X11') && pronto('X11').length === 2 && !t.feito.duoroEnganado) {
      const r = await painel(['Junto de uma piscina vazia de murete enfeitado com cérebros, dois humanos de manto preto conversam. Um deles tem tentáculos saindo do pescoço, e olhos negros abrem e fecham pelo rosto dele enquanto fala, rouco, ao outro.',
        '— Mais convertidos? — pergunta o dos tentáculos. — Ou mais intrusos?'], [
        { rotulo: 'Fingir que são convertidos (Enganação, CD 12)', valor: 'enganar', primaria: true },
        { rotulo: 'Atacar', valor: 'atacar' },
      ]);
      if (r === 'atacar') return luta(da('X11'));
      const quem = melhor('enganacao');
      const teste = rolarPericia(enc.rng, quem, 'enganacao');
      if (teste.total < 12) {
        await painel(`${quem.name} (${SKILL_NAME.enganacao} ${teste.total}) tropeça no nome do deus. Os olhos negros do rosto do Duoro se abrem todos ao mesmo tempo.`, [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
        return luta(da('X11'));
      }
      t.feito.duoroEnganado = true;
      await painel([`${quem.name} (${SKILL_NAME.enganacao} ${teste.total}) recita o que ouviu dos goblins com convicção. O Duoro sorri com dentes demais.`,
        '— Então sabem. Ilvaash nasceu do que Ilsensine deixou para trás quando fugiu do Reino Distante: um pedaço de cérebro de deus que pensou sozinho. Ilsensine é meio tolo, meio covarde. O verdadeiro senhor do Reino é Ilvaash. — Ele põe a mão no ombro do outro. — E nós três, eu e os escolhidos, somos iguais diante dele.']);
      pista('O que o Duoro conta: Ilvaash nasceu da matéria cerebral que o deus Ilsensine deixou ao sair do Reino Distante; os fanáticos o têm como o verdadeiro deus do Reino.');
      return false;
    }
    // X12: os seis nothics
    if (em('X12') && pronto('X12').length) {
      await painel('A sala maior da fortaleza é um corredor de casulos de pedra, cheios de uma gosma que brilha. Entre eles, seis nothics de um olho só se levantam, e embaixo de cada olho se mexem tentáculos.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      return luta(da('X12'));
    }
    // X14: o Gulguush, escondido atrás da poltrona se a fortaleza está em alerta
    if (em('X14') && pronto('X14').length) {
      if (t.alarme) {
        await painel('A sala parece vazia: uma poltrona enorme, uma escrivaninha, um armário. Aí a poltrona se mexe.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
        const g = da('X14');
        return luta(g, { furtividade: g.map((f) => rolarPericia(enc.rng, f, 'furtividade').total) });
      }
      await painel('À escrivaninha, um devorador de mentes escreve depressa num livro grosso, e uma criaturinha alada o vigia do encosto da cadeira. Ele larga a pena e se levanta, contente: vai ter o que contar aos escolhidos.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      return luta(da('X14'));
    }
    // X15: o cérebro ancião, na sala dele, luta até a morte
    if (em('X15') && vivo(elenco.cerebro) && elenco.cerebro.side === 'neutro') {
      await painel(['Sigilos se torcem nas paredes em volta de uma piscina de pedra enorme, meio cheia de salmoura. No meio dela, um cérebro do tamanho de uma carroça, coberto de pústulas, transborda pela borda, mofado onde a salmoura não alcança.',
        'Ele já sabia que vocês vinham. Os tentáculos sobem da água.'], [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      return luta([elenco.cerebro]);
    }
    return false;
  }

  // --------------------------------------------------------------- o evento ----
  function evento(ev) {
    // o VÍNCULO: quem cai aqui, com o cérebro vivo
    if ((ev.type === 'downed' || ev.type === 'incapacitado') && ev.target?.side === 'party' && conditionEffects(ev.target).incapacitated) {
      vincular(ev.target, 'enquanto ele está caído');
    }
    if (ev.type !== 'died' && ev.type !== 'damage') return;
    const m = ev.target;
    // X10: o Ahooshathan se rende quando os dois nothics caem, ou quando está muito ferido
    const a = elenco.ahooshathan;
    if (vivo(a) && a.side === 'foes' && !a.rendido) {
      const nothics = da('X10').filter((x) => x !== a);
      if (!nothics.length || a.hp <= a.maxHp / 3) {
        a.rendido = true;
        a.side = 'neutro';
        enc.say('acao', 'O Ahooshathan ergue os tentáculos e recua contra a parede. Na cabeça de todos: — Basta. Basta! Eu sei coisas. Troco o que sei pela vida.');
        enc.checkEnd();
        app.refresh();
      }
    }
    // X11: o Larnon foge quando o Duoro cai
    const l = elenco.larnon;
    if (ev.type === 'died' && m === elenco.duoro && vivo(l)) {
      l.fugiu = true;
      const i = enc.combatants.indexOf(l);
      if (i >= 0) enc.combatants.splice(i, 1);
      enc.say('acao', 'O Larnon olha o Duoro cair, solta um grito e foge pelo corredor, para o fundo da fortaleza.');
      enc.checkEnd();
      app.refresh();
    }
  }

  // ------------------------------------------------------------- o fim ----
  async function fimDoCombate(outcome) {
    const lutou = estado.lutando ?? [];
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      await narrar(root, { formato: 'tela', paginas: [{ titulo: TITULO, texto: ['Illithinoch ganha mais quatro corpos para a piscina. Em Phandalin, ninguém sabe dizer para onde vocês foram.'] }] });
      app.encerrarPartida();
      return;
    }
    for (const f of lutou) if ((f.dead || f.fugiu) && f.chaveDeIllithinoch) t.mortos.push(f.chaveDeIllithinoch);
    await darXpDe(lutou, TITULO);
    if (estado.aleatorio) {
      estado.aleatorio = false;
      for (const f of lutou) { const i = enc.combatants.indexOf(f); if (f.dead && i >= 0) enc.combatants.splice(i, 1); }
      if (await proximoEncontro()) return;
      prepararExploracao();
      return;
    }
    if (lutou.includes(elenco.ahooshathan) && elenco.ahooshathan.rendido) {
      t.feito.ahooshathanRendido = true;
      await painel(['O Ahooshathan fala depressa, sem que ninguém pergunte duas vezes:',
        '— A fenda ali é uma de três. Os escolhidos puseram uma runa em cada uma, para escorar o portal grande.',
        '— As celas ao sul tinham quase uma dúzia da superfície. Foram levados para o Reino Distante. Eu nem pude tocá-los. — Ele parece ofendido.',
        '— Do outro lado desta fenda mora uma coisa chamada Golcuus, num labirinto. Só os escolhidos entravam. Ele saiu uma vez; eles fizeram algo horrível com ele, e ele voltou manso. — E, por último, com gosto: — O Qunbraxel morreu? Ótimo.']);
      pista('O Ahooshathan: as três fendas da fortaleza (em X4, X5 e X10) têm cada uma uma runa que escora o portal grande; os presos de Phandalin foram levados ao Reino Distante; do outro lado da fenda de X10 mora o Golcuus, num labirinto.');
    }
    if (lutou.includes(elenco.cerebro) && elenco.cerebro.dead) {
      t.feito.cerebroMorto = true;
      romperVinculos();
      await painel('O cérebro afunda na salmoura. Nas paredes, em toda a fortaleza ao mesmo tempo, os sigilos param de se mexer. Quem tinha a presença dele encostada na mente sente ela ir embora, como uma mão que larga o ombro.');
    }
    prepararExploracao();
  }

  // ------------------------------------------------- as conversas ----
  const arvoreOshundo = () => ({
    inicio: 'oi',
    nos: {
      oi: {
        fala: 'Sou o Oshundo, hóspede da Voalsh, por ora. Perguntem. Faz séculos que ninguém aqui conversa sobre nada que não seja aquele deus de vocês.',
        opcoes: [
          { texto: 'Quem são os três que mandam aqui?', vai: 'fanaticos' },
          { texto: 'O que é esse ritual?', vai: 'ritual' },
          { texto: 'E você, o que faz aqui?', vai: 'ele' },
          { texto: 'Tome. Os cristais que achamos.', vai: 'cristais', requer: () => (CRISTAIS.some(tem) ? null : 'o grupo não tem cristal mental nenhum') },
          { texto: 'Atacar o Oshundo.', fim: 'atacar' },
          { texto: 'Deixá-lo com os mapas.', fim: 'sai' },
        ],
      },
      fanaticos: {
        fala: 'A Chishinix, que carrega uma cabeça igual à dela e conversa com ela. O Hashutu, que trocou as mãos por tentáculos para sentir quem se mexe. E a Voalsh, minha anfitriã, que quase morreu nas mãos dos outros e voltou com asas. Três tolos que acharam um deus.',
        ao: () => pista('O Oshundo descreve os três fanáticos: Chishinix, que carrega uma cabeça cortada igual à dela; Hashutu, de mãos de tentáculo; e Voalsh, de asas de tentáculo, que paira num disco.'),
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      ritual: {
        fala: 'Foram ao Reino Distante comungar com o deus e terminar o ritual. Tiveram trabalho para erguer o portal, e o escoraram, eu suponho, com fendas menores. — Os tentáculos dele fazem um gesto de pouco caso. — Psiônica me entedia. Deus também.',
        ao: () => pista('O Oshundo supõe que o portal dos fanáticos foi escorado por fendas menores, perto daqui.'),
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      ele: {
        fala: 'Vivi aqui no auge do império, até me expulsarem por praticar magia de livro. Tolos. Voltei há uns meses atrás dos cristais mentais e achei o cérebro velho doente e paranoico. Ajudei os escolhidos a achar onde estavam os pedaços da pedra; em troca, eles me deixam em paz com os meus mapas.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      cristais: {
        fala: 'Ah. — Ele pesa os cristais nas mãos secas, um a um, como quem conta moedas. — Francos e generosos. Que raro. Está bem: não vou mexer com vocês, e quando eu terminar estes mapas, são seus. Eu não saio daqui; não me peçam nada que me faça sair.',
        opcoes: [{ texto: 'Feito.', fim: 'aliado' }],
      },
    },
  });

  const arvoreAhooshathan = () => ({
    inicio: 'oi',
    nos: { oi: {
      fala: 'Eu disse o que sei. A fenda, as runas, o Golcuus. Deixem-me com o meu nothic.',
      opcoes: [{ texto: 'Deixá-lo.', fim: 'sai' }],
    } },
  });

  async function depoisDaConversa(npc, fim) {
    if (npc === elenco.oshundo) {
      if (fim === 'atacar') { t.feito.oshundoAliado = false; return luta([elenco.oshundo]); }
      if (fim === 'aliado') {
        t.feito.oshundoAliado = true;
        for (const id of CRISTAIS) for (let h = tem(id); h; h = tem(id)) tirar(h, id);
        guardar(herois()[0], 'mapasDoSubterraneo', 1);
        await painel('O Oshundo enrola os mapas antigos num tubo de couro e os empurra para vocês com a ponta de um tentáculo, sem tirar os olhos do cristal laranja. — Já não preciso deles. Agora saiam, que vocês pensam alto demais.');
        app.refresh();
      }
    }
    return null;
  }

  // ------------------------------------------------------- as interações ----
  const QUALITH = { X3: P.perfumes, X7: { x: 6, y: 16 }, X8: P.cartas, X14: P.esconderijo };
  function interacoes(tile, sup, c) {
    if (!c) return [];
    const ops = [];
    // AS PORTAS: abrem pelo olhar (mesmo em luta, como ação de ninguém: só olhar)
    for (const p of portasDaCasa(enc.field, tile)) {
      const dist = Math.min(distanceFt(c.pos, p.a), distanceFt(c.pos, p.b));
      if (p.cod === ARESTA.aberta) continue;
      ops.push({ rotulo: 'Encarar a porta', icone: 'acao-procurar', detalhe: 'ela abre sozinha', motivo: dist > 15 ? 'longe demais — chegue a 15 pés' : null, fazer: () => abrirPeloOlhar(c, p) });
    }
    if (!estado.explorando) return ops;
    // O VÍNCULO: romper (ação, Carisma CD 17, e 3d6 psíquicos ao conseguir)
    if (tile.x === c.pos.x && tile.y === c.pos.y && hasCondition(c, 'vinculoPsiquico')) {
      ops.push({ rotulo: 'Romper o vínculo', icone: 'acao-procurar', detalhe: 'Carisma CD 17', fazer: async () => {
        const r = enc.rng.die(20) + abilityMod(c.abilities?.cha ?? 10);
        if (r < 17) { await painel(`${c.name} empurra a presença para fora da mente (Carisma ${r}), e ela nem se mexe.`); return; }
        const d = damageRoll(enc.rng, '3d6');
        removeCondition(c, 'vinculoPsiquico');
        enc.applyDamage(c, d.total, 'psíquico', null);
        await painel(`${c.name} arranca a presença de dentro da cabeça (Carisma ${r}), e a dor é de arrancar um dente: ${d.total} psíquicos.`);
        app.refresh();
      } });
    }
    // O QUALITH das portas dos fanáticos
    const sala = salaEmIllithinoch(tile);
    if (QUALITH[sala] && aqui(QUALITH[sala], tile) && !t.feito[`qualith:${sala}`]) {
      ops.push({ rotulo: 'Ler o qualith da porta', icone: 'acao-procurar', detalhe: 'Inteligência CD 18', motivo: longe(c, tile), fazer: async () => {
        t.feito[`qualith:${sala}`] = true;
        const r = enc.rng.die(20) + abilityMod(c.abilities?.int ?? 10);
        const TEXTO = {
          X3: 'Os aposentos do Hashutu, a quem a Psique deu mãos que sentem tudo o que se mexe.',
          X7: 'Um convite: sentar com a Voalsh, descansar, e conhecer a verdade.',
          X8: 'Os aposentos da Voalsh, cujas asas a levarão para junto da Psique Dissonante.',
          X14: 'Os aposentos da Chishinix, que vê o que vem, e ganhou uma cabeça que conhece a vontade da Psique.',
        };
        if (r >= 18) { await painel(`${c.name} corre os dedos pelos sulcos (Inteligência ${r}) e as quatro linhas se abrem na mente: ${TEXTO[sala]}`); return; }
        const sv = enc.resistencia(c, 'wis', 13);
        const d = damageRoll(enc.rng, '5d6');
        const dano = sv.success ? Math.floor(d.total / 2) : d.total;
        enc.applyDamage(c, dano, 'psíquico', null);
        await painel(`${c.name} tenta ler os sulcos (Inteligência ${r}), e eles se enfiam pela cabeça adentro: ${dano} psíquicos${sv.success ? ', metade, porque ele se segura' : ''}.`);
        app.refresh();
      } });
    }
    // X2: o muco da estátua (com os devoradores enganados ou mortos)
    if (aqui(P.estatua, tile) && (t.feito.x2Enganados || !da('X2').length)) {
      ops.push({ rotulo: 'Beber o muco da estátua', icone: 'acao-usarObjeto', detalhe: 'resistência a psíquico, 10 min', motivo: longe(c, tile), fazer: () => {
        addCondition(c, 'mucoDaEstatua', { rounds: 100 });
        enc.say('cura', `${c.name} bebe o muco da estátua. Tem gosto de cobre e de pão, e a cabeça fica estranhamente leve.`);
        app.refresh();
      } });
      ops.push({ rotulo: 'Encher um frasco de muco', icone: 'acao-usarObjeto', motivo: longe(c, tile), fazer: () => { guardar(c, 'frascoDeMuco', 1); enc.say('acao', `${c.name} enche um frasco com o muco.`); app.refresh(); } });
    }
    // X3: os perfumes e o cristal
    if (aqui(P.perfumes, tile) && !t.feito.perfumes) {
      ops.push({ rotulo: 'Revirar o armário', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
        t.feito.perfumes = true;
        guardar(c, 'perfumeRaro', 5);
        guardar(c, 'cristalMentalSutil', 1);
        await painel(`Entre os mantos, cinco frascos de perfume raro, e numa caixinha forrada um cristal claro, morno ao toque. ${c.name} guarda tudo.`);
        app.refresh();
      } });
    }
    // X6: os cristais de memória
    if (aqui(P.cristais, tile)) {
      ops.push({ rotulo: 'Segurar um cristal', icone: 'acao-procurar', detalhe: 'dez segundos de lembrança', motivo: longe(c, tile), fazer: () => lembranca(c) });
      if (!t.feito.cristalElevado) {
        ops.push({ rotulo: 'Procurar entre os cristais', icone: 'acao-procurar', detalhe: 'Investigação CD 13', motivo: longe(c, tile), fazer: async () => {
          const r = rolarPericia(enc.rng, c, 'investigacao');
          if (r.total < 13) { await painel(`${c.name} (${SKILL_NAME.investigacao} ${r.total}) só vê cristais velhos e pó.`); return; }
          t.feito.cristalElevado = true;
          guardar(c, 'cristalMentalElevado', 1);
          await painel(`${c.name} (${SKILL_NAME.investigacao} ${r.total}) acha três cristais bem mais novos que os outros, e um quarto que não guarda lembrança nenhuma: um cristal mental. Guarda o cristal.`);
          app.refresh();
        } });
      }
    }
    // X7: as jarras (sem o Oshundo ou com ele aliado)
    if (aqui({ x: 6, y: 16 }, tile) && !t.feito.jarras && (t.feito.oshundoAliado || !vivo(elenco.oshundo))) {
      ops.push({ rotulo: 'Levar as jarras de cristal', icone: 'acao-usarObjeto', motivo: longe(c, tile), fazer: () => {
        t.feito.jarras = true;
        guardar(c, 'jarraDeCristal', 4);
        if (!vivo(elenco.oshundo) && !t.feito.oshundoAliado) { guardar(c, 'cristalMentalPotencializado', 1); guardar(c, 'mapasDoSubterraneo', 1); }
        enc.say('acao', `${c.name} guarda as quatro jarras de cristal${!vivo(elenco.oshundo) ? ', o cristal laranja e os mapas do Oshundo' : ''}.`);
        app.refresh();
      } });
    }
    // X8: o tinteiro, e o casulo da Voalsh
    if (aqui(P.cartas, tile) && !t.feito.tinteiro) {
      ops.push({ rotulo: 'Levar o tinteiro de âmbar', icone: 'acao-usarObjeto', motivo: longe(c, tile), fazer: () => { t.feito.tinteiro = true; guardar(c, 'tinteiroDeAmbar', 1); enc.say('acao', `${c.name} guarda o tinteiro de âmbar.`); app.refresh(); } });
    }
    if ((aqui(P.casuloDeVoalsh, tile) || aqui(P.casuloVelho, tile)) && vivo(elenco.cerebro)) {
      ops.push({ rotulo: 'Deitar na gosma', icone: 'acao-procurar', detalhe: 'morna, e brilha', motivo: longe(c, tile), fazer: () => { vincular(c, 'assim que ele afunda na gosma'); app.refresh(); } });
    }
    // X12: o cristal distante num casulo velho
    if (aqui(P.casuloVelho, tile) && !t.feito.cristalDistante && !da('X12').length) {
      ops.push({ rotulo: 'Quebrar a crosta do casulo velho', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
        t.feito.cristalDistante = true;
        guardar(c, 'cristalMentalDistante', 1);
        await painel(`Debaixo de uma crosta seca, na gosma velha, um cristal claro. Sai fácil, e cheira mal. ${c.name} o guarda.`);
        app.refresh();
      } });
    }
    // X14: o livro e o armário
    if (aqui(P.armario, tile) && !t.feito.armario && !da('X14').length) {
      ops.push({ rotulo: 'Abrir o armário', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
        t.feito.armario = true;
        guardar(c, 'pocaoDeCrescimento', 1);
        guardar(c, 'pocaoDeVeneno', 1);
        guardar(c, 'livroDeGulguush', 1);
        await painel([`Na escrivaninha, o livro do Gulguush, inacabado: "Prostrado diante da Psique Dissonante". No armário, dobrado num manto, dois frascos idênticos de líquido âmbar. ${c.name} guarda tudo.`,
          'O livro diz de onde veio Ilvaash; que ele toma corpo no Vazio Sem Fim, debaixo de uma piscina de salmoura no coração do Labirinto Salobro, "além de uma estrela sem luz"; que o Labirinto foi feito para prender ladrões de saber; e que coisas perigosas flutuam no Vazio, todas às ordens dele.']);
        pista('O livro do Gulguush: Ilvaash toma corpo no Vazio Sem Fim, debaixo de uma piscina de salmoura no coração do Labirinto Salobro, "além de uma estrela sem luz".');
        app.refresh();
      } });
    }
    // X15: os cristais no fundo da piscina
    if (salaEmIllithinoch(tile) === 'X15' && enc.field.surfaceAt(tile.x, tile.y) === 'cisterna' && !t.feito.cristaisDaPiscina && !vivo(elenco.cerebro)) {
      ops.push({ rotulo: 'Mergulhar no fundo da piscina', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
        t.feito.cristaisDaPiscina = true;
        guardar(c, 'cristalMentalAcelerado', 1);
        guardar(c, 'cristalMentalProlongado', 2);
        await painel(`No fundo da salmoura, entre restos que ninguém quer identificar, três cristais claros. ${c.name} os traz para cima.`);
        app.refresh();
      } });
    }
    // AS FENDAS: se olham e se atravessam (`fendas.js`)
    for (const [ponto, nome, ve, variante] of [[P.fendaTrincheiras, 'Trincheiras de Alimentação', 'uma caverna de valas cheias de uma gosma cinzenta', 'fendaTrincheiras'],
      [P.fendaOco, 'Oco da Desova', 'um cruzamento de corredores de carne rosada que pulsa', 'fendaOco'],
      [P.fendaLabirinto, 'Labirinto dos Olhos', 'corredores estreitos de pedra cheia de olhos', 'fendaLabirinto']]) {
      if (!aqui(ponto, tile)) continue;
      ops.push({ rotulo: 'Atravessar a fenda', icone: 'acao-disparada', detalhe: nome, motivo: longe(c, tile), fazer: () => sair((v) => app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: variante, continuarCom: v })) });
      ops.push({ rotulo: 'Olhar a fenda', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
        t.feito[`fenda:${nome}`] = true;
        await painel(`Um rasgo de um metro e meio no ar, de bordas verdes e prateadas que tremem. Do outro lado, ${ve}: um pedaço do Reino Distante, ${nome === 'Labirinto dos Olhos' ? 'e um cheiro de pedra molhada' : 'e um cheiro doce e errado'}. No centro de algum lugar lá dentro, uma runa escora o portal grande de X16.`);
        app.refresh();
      } });
    }
    // X16: o portal
    if (salaEmIllithinoch(tile) === 'X16' && distanceFt(tile, P.nicho) <= 5 && !o7.portalAberto) {
      const faltam = GNAWBLES.filter((g) => !herois().some((h) => distanceFt(h.pos, P.nicho) <= 20 && garantirInventario(h).bag.some((i) => i.id === g)));
      ops.push({ rotulo: 'Abrir o portal', icone: 'acao-usarObjeto', detalhe: faltam.length ? `faltam ${faltam.length} gnawble${faltam.length > 1 ? 's' : ''} a 6 m do nicho` : 'os três gnawbles estão aqui',
        motivo: faltam.length ? 'é preciso o que restou das três runas, perto do nicho' : longe(c, tile, 20), fazer: () => abrirOPortal() });
    }
    // X16: o portal aberto leva ao Labirinto Salgado (o capítulo 8, `labirinto-salgado.js`)
    if (salaEmIllithinoch(tile) === 'X16' && distanceFt(tile, P.nicho) <= 5 && o7.portalAberto) {
      ops.push({ rotulo: 'Atravessar o portal', icone: 'acao-disparada', detalhe: 'para o Reino Distante', motivo: longe(c, tile),
        fazer: () => { romperVinculos(); sair((v) => app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'labirintoSalgado', continuarCom: v })); } });
    }
    // A SAÍDA: de volta ao túnel
    if (aqui(P.saida, tile)) {
      ops.push({ rotulo: 'Voltar ao túnel', icone: 'acao-disparada', detalhe: 'umas 2 horas até a gruta', motivo: longe(c, tile), fazer: async () => {
        const encontros = rolarViagem(enc.rng, 2);
        romperVinculos();
        sair((v) => app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'tunelGruta', chegada: 'saida', encontros, continuarCom: v }));
      } });
    }
    return ops;
  }

  const LEMBRANCAS = [
    'Um devorador de mentes com uma cabeça cortada igual à dela debaixo do braço entoa sobre a piscina do cérebro. Um portal torto se abre, treme e some. Frustração, e a promessa de tentar de novo, em nome de Ilvaash.',
    'Um devorador de mentes de mãos de tentáculo chicoteia o rosto de um nothic murcho entre os casulos, exigindo obediência.',
    'Um globo de olhos numa sala de lajes manchadas se contorce diante de um devorador de mentes num disco flutuante cor de ferrugem, e jura servir.',
    'Um devorador de mentes de manto escarlate comanda uma batalha num salão que desce em degraus, entre estátuas de anões.',
    'Três devoradores de mentes escolhem gemas num caixote, junto de uma mesa de pedra, num lugar escuro e frio.',
  ];
  async function lembranca(c) {
    const d = enc.rng.die(20);
    const txt = d <= 5 ? LEMBRANCAS[d - 1]
      : d === 20 ? 'O cristal não mostra nada: não é de memória. Mas está morno, e alguma coisa nele espera ser usada.'
        : `Um entreposto debaixo da terra: ${['dois', 'três', 'um', 'quatro'][d % 4]} devorador${d % 4 === 2 ? '' : 'es'} de mentes pegam um ${['drow', 'duergar', 'gnomo das profundezas'][d % 3]} que tentava fugir, e o devoram ali mesmo.`;
    if (d === 20 && !t.feito.cristalElevado) { t.feito.cristalElevado = true; guardar(c, 'cristalMentalElevado', 1); }
    await painel(`${c.name} segura um cristal. Por dez segundos, ele vê pelos olhos de outro: ${txt}`);
    if (d === 1) pista('Uma lembrança na biblioteca: a Chishinix já tentou abrir um portal sobre a piscina do cérebro, e falhou.');
    if (d === 3) pista('Uma lembrança na biblioteca: a Voalsh dobrou um globo de olhos, que jurou servi-la. Deve ser o Golcuus, do Labirinto dos Olhos.');
    app.refresh();
  }

  /** O PORTAL: os três gnawbles a 6 m do nicho. Ele reabre, eles explodem, a visão dos presos, e o 10º nível. */
  async function abrirOPortal() {
    for (const g of GNAWBLES) { const h = herois().find((x) => garantirInventario(x).bag.some((i) => i.id === g)); if (h) tirar(h, g); }
    o7.portalAberto = { dia: vila.dia ?? 1 };
    await painel([
      'Os três gnawbles se agitam nas mãos de vocês, se esticam todos para o nicho, e estouram juntos, como frutas maduras demais, em pedaços de carne.',
      'O nicho se rasga numa fenda maior que todas, e do outro lado há túneis cinza-rosados, dobrados como a superfície de um cérebro.',
      'Por um instante vocês veem: os três escolhidos arrastando os presos de Phandalin por aqueles túneis, e os presos gritando as mesmas frases riscadas nas celas. "Phandalin ainda espera." Um nome: "Tera".',
      'O portal fica aberto. Sete dias, diz a parede de planos, se alguém a souber ler.',
    ]);
    pista('O portal de X16 está aberto para o Reino Distante, por sete dias. Os presos de Phandalin foram levados por ali.');
    const sobem = darMarco(todos(), 10);
    enc.say('cura', 'Marco: o grupo chega ao 10º nível.');
    if (sobem.length && root) for (const txt of await telaDeSubirNivel(root, sobem)) enc.say('cura', txt);
    app.refresh();
  }

  /** Os encontros da última hora de túnel, na chegada (como nas cavernas). */
  async function proximoEncontro() {
    const e = estado.filaDeEncontros.shift();
    if (!e) return false;
    const de = herois()[0]?.pos ?? P.grupo[0];
    const alc = [...enc.field.reachable({ x: de.x, y: de.y }, 100000, () => false).values()].filter((n) => distanceFt(de, n) >= 20 && distanceFt(de, n) <= 40);
    const bando = e.elenco.map((id, i) => {
      const q = alc[(i * 3) % Math.max(1, alc.length)] ?? de;
      const f = makeMonster(id, { x: q.x, y: q.y });
      const livre = enc.casaLivreMaisProxima({ x: q.x, y: q.y, f: f.pos?.f ?? 1 });
      if (livre) f.pos = { ...f.pos, x: livre.x, y: livre.y };
      return f;
    });
    await painel([`Na última hora de túnel: ${e.nome}.`], [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
    estado.aleatorio = true;
    luta(bando, { furtividade: o7.tunel?.luz ? bando.map((f) => rolarPericia(enc.rng, f, 'furtividade').total) : null });
    return true;
  }

  return {
    lugar: TITULO,
    portasProprias: true,
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    depoisDeMover(c) {
      if (c && estado.explorando) c.movementLeftFt = MOVIMENTO;
      return depoisDoPasso(c);
    },
    fimDoCombate,
    evento,
    dialogoDe: (npc) => (npc === elenco.oshundo && npc.side === 'neutro' ? arvoreOshundo() : npc === elenco.ahooshathan && npc.rendido ? arvoreAhooshathan() : null),
    depoisDaConversa,
    elenco,
    estado,
    abrirOPortal,
    async iniciar() {
      // O ATAQUE DOS GITHYANKI: a Varakkta, que soube do portal pelo grupo (`labirinto-salgado.js contarGithyanki`), passou
      // por ele com os dois guerreiros. Decisão nossa, porque o livro só diz que ela decide atacar: os três morrem na
      // fortaleza e levam junto até dois devoradores de mentes que ainda vivem (não o que se rendeu).
      const lab = camp.obelisco8?.lab;
      let ataque = null;
      if (lab?.feito?.varakktaAtacaIllithinoch && !t.feito.ataqueDosGithyanki) {
        t.feito.ataqueDosGithyanki = true;
        ataque = Object.entries(elenco).filter(([k, m]) => m.defId === 'devoradorDeMentes' && !m.dead && !m.rendido && m.side !== 'party' && !t.mortos.includes(k))
          .map(([k]) => k).slice(0, 2);
        for (const k of ataque) { t.mortos.push(k); elenco[k].dead = true; }
      }
      // quem volta de uma fenda aparece na boca do rasgo dela
      const deFenda = { fendaTrincheiras: P.fendaTrincheiras, fendaOco: P.fendaOco, fendaLabirinto: P.fendaLabirinto, portal: P.nicho }[config.chegada];
      if (deFenda) for (const h of herois()) { const q = enc.casaLivreMaisProxima(deFenda); if (q) h.pos = { ...h.pos, x: q.x, y: q.y }; }
      for (const m of Object.values(elenco)) {
        if (m.dead) continue;
        // o Gulguush, com a fortaleza em alerta, está escondido atrás da poltrona (fora do tabuleiro até alguém entrar)
        if (m.salaDeIllithinoch === 'X14' && t.alarme) continue;
        if (!enc.combatants.includes(m)) enc.addCombatant(m);
      }
      if (!t.feito.chegou) {
        t.feito.chegou = true;
        await painel(['O túnel acaba diante de duas portas de pedra polida, altas como três homens, sem maçaneta nem fechadura. Uma luz verde e parada escapa pela fresta.',
          'Tudo do outro lado tem cantos arredondados, como se a fortaleza tivesse sido moldada em vez de construída. Nas paredes, sigilos de tentáculos e cérebros se mexem devagar quando alguém olha para eles.',
          'As portas daqui não se empurram: abrem quando alguém as encara (botão direito na porta).']);
      }
      if (ataque) {
        await painel(ataque.length
          ? `A fortaleza cheira a sangue novo. Pelos corredores, três githyanki de armadura jazem perto de ${ataque.length > 1 ? 'dois devoradores de mentes mortos' : 'um devorador de mentes morto'}: a Varakkta veio, como disse que viria, e cobrou caro.`
          : 'A fortaleza cheira a sangue novo. Pelos corredores, três githyanki de armadura jazem mortos, de espada na mão. Não acharam devorador vivo que pagasse a viagem.');
        pista(ataque.length ? `A Varakkta e os guerreiros atacaram Illithinoch: mataram ${ataque.map((k) => elenco[k].name).join(' e ')}, e morreram lá.` : 'A Varakkta e os guerreiros atacaram Illithinoch e morreram lá.');
      }
      if (await proximoEncontro()) return;
      prepararExploracao();
    },
  };
}
