// O CUME DA WYVERN (Parte 3 da aventura). Mapa em `game/cume.js`.
//
// O que a cena faz (as regras são do livro; o texto é nosso):
//   - procura: um teste por hora, de quem lidera, até achar o acampamento;
//   - o vigia: vê quem não passar no teste de Furtividade do grupo. Visto, ele
//     grita e o bando sai. Pego desprevenido e calado antes de agir, nada se
//     ouve na caverna;
//   - a caverna: sem alarme, o grupo pode entrar de surpresa (outro teste de
//     grupo, na boca). Brughor, os bugbears e o ogro Gog (o Obelisco; na Mina eram
//     seis orcs e um orc de vigia). Os bugbears fogem quando o
//     Brughor cai; o ogro não;
//   - o baú e o XP do livro (1.250), e as flags que o Harbin e o Kost leem.
// Os 62 pe do baú entram como 31 po (o jogo não tem peça de electro).
//
// DECISÕES NOSSAS (medidas pelo revisor de encontro, 200 a 400 lutas):
//   - Furtividade em GRUPO (SRD): o grupo passa se metade passar — o valor que
//     conta é o da metade de cima. Exigir que todos passassem fazia o vigia ver
//     o grupo quatro vezes em cinco;
//   - avisados, saem em levas: dois bugbears na hora, o Brughor com mais um na
//     rodada 2, os três que dormiam na 4, e o ogro na 6;
//   - dois bugbears e o ogro dormem nas camas: pegos na caverna, perdem a primeira
//     rodada mesmo que o grupo seja notado;
//   - quando o Brughor cai, os bugbears que ainda iam sair da caverna também
//     desistem (o vigia foge junto);
//   - a caverna tem penumbra (a fogueira do fundo), não breu.
//
// O estado mora em `app.campanha.cume` e sobrevive a sair e voltar.

import { narrar } from '../view/narrativa.js';
import { d20 } from '../core/dice.js';
import { skillBonus, passivePerception, SKILL_NAME, rolarPericia } from '../rules/abilities.js';
import { distanceFt, Battlefield } from '../core/grid.js';
import { podeVer } from '../rules/luz.js';
import { makeMonster } from '../rules/monsters.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { prepararLevas } from './levas.js';
import { CUME } from './cume.js';
import { guardar } from './comercio.js';
import { gastarHoras } from './relogio.js';

const MOVIMENTO = 60;
const dentro = (p, r) => p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1;
// A CAVERNA é um recorte irregular, e não um retângulo: a planta nova (`mapa-cume-fa.py`) dá as casas uma a uma,
// porque a caixa delas pegaria chão de fora. Quem pergunta "está dentro?" pergunta ao conjunto.
const CASAS_DA_CAVERNA = new Set(CUME.casasDaCaverna.map((p) => `${p.x},${p.y}`));
const naCaverna = (p) => CASAS_DA_CAVERNA.has(`${p.x},${p.y}`);
// O CANTO NOROESTE DA CAVERNA (o terço de cima e da esquerda da caixa dela): é onde o Obelisco põe o desenho.
const casasNoroeste = (() => {
  let memo = null;
  return () => {
    if (memo) return memo;
    const cs = CUME.casasDaCaverna;
    const [x0, x1] = [Math.min(...cs.map((p) => p.x)), Math.max(...cs.map((p) => p.x))];
    const [y0, y1] = [Math.min(...cs.map((p) => p.y)), Math.max(...cs.map((p) => p.y))];
    memo = new Set(cs.filter((p) => p.x <= x0 + (x1 - x0) / 3 && p.y <= y0 + (y1 - y0) / 3).map((p) => `${p.x},${p.y}`));
    return memo;
  };
})();

export function criarCume(app, config) {
  void config;
  const enc = app.enc;
  const root = app.root;
  const camp = (app.campanha ??= {});
  const feitos = (camp.feitos ??= {});
  const vila = (camp.vila ??= { pistas: [], missoes: {} });
  const salvo = (camp.cume ??= { achado: false, vigia: null, alarme: false, vencido: false, bau: false });
  const estado = { explorando: false, encerrado: false, lutando: null, perguntou: false };

  const herois = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead && c.hp > 0);
  const casaPerto = (p) => enc.casaLivreMaisProxima(p) ?? p;
  const painel = (texto, extra = {}) => narrar(root, { formato: 'painel', paginas: [{ texto: [].concat(texto), ...extra }] });

  // ------------------------------------------------------ o bando ----
  // O OBELISCO trocou o bando: vigia BUGBEAR; na caverna o Brughor (um orc de 18 PV), QUATRO bugbears e o ogro Gog. Na
  // Mina eram um orc de vigia e seis orcs com o Brughor.
  const vigia = salvo.vigia ? null : makeMonster('bugbear', { ...CUME.vigia }, { nameSuffix: 'de vigia' });
  // DE COSTAS PARA O CAMPO, e isto é escolha medida, não descuido. No livro ele monta guarda; aqui o mapa
  // não deixa. A encosta da FA tem 18x24 casas e quase nenhum anteparo: MEDIDO, o vigia é visto de 311 das
  // 347 casas livres, e o grupo já chega a 85 pés dele COM linha de visão. Virado para fora, ele nota quem
  // vem de qualquer lugar e a cena perde a única coisa que a torna interessante — a aproximação furtiva que o
  // próprio capítulo oferece. Virado para dentro, a escolha volta a ser do jogador: calá-lo antes do grito,
  // ou não. Quem repintar o mapa com cobertura de verdade pode virá-lo.
  if (vigia) vigia.facingVec = { dx: 0, dy: -1 };
  const caverna = [];
  if (!salvo.vencido) {
    // O Brughor do Obelisco é um orc comum de 18 PV (o bloco nosso, de ND 2, saiu da cena).
    const chefe = makeMonster('orc', { ...CUME.brughor });
    Object.assign(chefe, { name: 'Brughor Machado-Mordedor', look: 'brughor', maxHp: 18, hp: 18, chefe: true });
    caverna.push(chefe);
    // Onde cada um espera vem do mapa (`CUME.orcs`, medido na planta da FA): os quatro primeiros postos — A e B
    // acordados perto da boca, C acordado junto do fogo, de costas, D dormindo na palha.
    CUME.orcs.slice(0, 4).forEach(({ x, y, dorme }, i) => {
      const o = makeMonster('bugbear', { x, y }, { nameSuffix: 'ABCD'[i] });
      o.dormindo = dorme;
      caverna.push(o);
    });
    const gog = makeMonster('ogro', { ...CUME.gog });
    gog.name = 'Gog';
    gog.dormindo = true;
    caverna.push(gog);
    for (const f of caverna) f.facingVec = { dx: -1, dy: -1 };
  }
  const brughor = caverna.find((f) => f.chefe);
  const gog = caverna.find((f) => f.name === 'Gog');
  const orcs = caverna.filter((f) => f !== brughor && f !== gog);
  // A Furtividade do grupo: rolada uma vez na chegada (contra o vigia) e outra
  // na boca da caverna (contra o bando).
  let furtividade = 10;
  let levas = null;

  /** Teste de grupo (SRD): o valor da metade de cima dos rolamentos. */
  function testeDeGrupo() {
    const r = herois().map((h) => rolarPericia(enc.rng, h, 'furtividade').total).sort((a, b) => b - a);
    return r[Math.max(0, Math.ceil(r.length / 2) - 1)] ?? 10;
  }

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

  function luta(quem, surpresa, ondas = []) {
    for (const f of quem) {
      if (f.dead) continue;
      f.side = 'foes';
      if (enc.combatants.includes(f)) continue;
      if (enc.occupied(f.pos.x, f.pos.y)) f.pos = { ...f.pos, ...casaPerto(f.pos) };
      enc.addCombatant(f);
    }
    levas = ondas.length ? prepararLevas(enc, ondas) : null;
    estado.explorando = false;
    estado.lutando = quem;
    root.classList.remove('explorando');
    enc.emboscada = surpresa === 'nossa'
      ? { emboscadores: 'party', furtividade: herois().map(() => furtividade) }
      : null;
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
  }

  /** O alarme: os da caverna saem pela boca, em levas, já acordados. */
  function ondasDaCaverna() {
    const boca = CUME.entrada;
    const vivos = (l) => l.filter((f) => f && !f.dead);
    const na = (f) => { f.dormindo = false; f.pos = { ...f.pos, ...CUME.dentroDaBoca }; return f; };
    return {
      agora: vivos(orcs.slice(0, 2)),
      ondas: [
        { rodada: 2, units: vivos([brughor, orcs[2]]).map(na), aviso: 'Da boca da caverna sai o chefe, um orc de machado nas duas mãos, berrando ordens, com um bugbear atrás.' },
        { rodada: 4, units: vivos(orcs.slice(3)).map(na), aviso: 'Mais um bugbear sai tropeçando, ainda amarrando as botas.' },
        { rodada: 6, units: vivos([gog]).map(na), aviso: 'O chão treme. O último a sair é um ogro, de clava no ombro, sorrindo como quem foi chamado para o jantar.' },
      ],
    };
  }

  async function alarme(motivo) {
    salvo.alarme = true;
    const { agora, ondas } = ondasDaCaverna();
    for (const f of agora) { f.dormindo = false; f.pos = { ...f.pos, ...casaPerto(CUME.foraDaBoca) }; }
    await narrar(root, { formato: 'painel', paginas: [{ texto: [motivo,
      'Da caverna vem a resposta: um berro, outro, e barulho de ferro sendo arrancado do chão.'] }],
    escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    luta([...(vigia && !vigia.dead ? [vigia] : []), ...agora], null, ondas);
  }

  /** A cena dentro da caverna, sem alarme: o bando, pego (ou não) de surpresa. */
  async function entrarNaCaverna() {
    furtividade = testeDeGrupo();
    await narrar(root, { formato: 'painel', paginas: [{ texto: [
      'A boca da caverna fede a gordura queimada e couro molhado. Lá dentro, a luz baixa de uma fogueira no fundo mostra o bando: um bugbear roncando na palha, dois resmungando perto da entrada, outro de costas, sacudindo ossos num copo de chifre, e um orc de machado que grita com todos eles. E, encostado na parede, um volume que respira devagar e só pode ser um ogro.'] }],
    escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    salvo.alarme = true;
    luta([...(vigia && !vigia.dead ? [vigia] : []), ...caverna.filter((f) => !f.dead)], 'nossa');
  }

  // ------------------------------------------------------- aproximação ----
  async function depoisDeMover(c) {
    if (!estado.explorando) return;
    c.movementLeftFt = MOVIMENTO;
    if (salvo.vencido || salvo.alarme) return;
    // O vigia ainda de pé: vê o grupo se o teste de grupo não passou.
    if (vigia && !vigia.dead) {
      const visto = herois().find((h) => podeVer(enc, vigia, h) && furtividade < passivePerception(vigia)
        && distanceFt(h.pos, vigia.pos) <= 90);
      if (visto) {
        await alarme(`O bugbear de vigia se vira, vê ${visto.name} e enche o peito para berrar em goblin.`);
        return;
      }
      // À vista dele, sem ser visto: dá para calá-lo antes que grite. De perto,
      // a arma; de longe, até 60 pés, o arco ou a magia.
      const perto = herois().find((h) => distanceFt(h.pos, vigia.pos) <= 60 && enc.field.hasLineOfSight(h.pos, vigia.pos));
      if (perto && !estado.perguntou) {
        estado.perguntou = true;
        const r = await narrar(root, { formato: 'painel', paginas: [{ texto: [
          `Na boca da caverna, um bugbear encostado na pedra limpa as unhas com a ponta de uma faca, virado para dentro. Não ouviu nada. ${perto.name} tem ele na mira.`,
          'Se cair antes de abrir a boca, ninguém lá dentro vai saber. Se não cair, vai gritar.'] }],
          escolhas: [
            { rotulo: 'Esperar', valor: 'espera' },
            { rotulo: 'Atacar de surpresa', valor: 'ataca', primaria: true },
          ] });
        if (r === 'ataca') { luta([vigia], 'nossa'); return; }
      }
      if (!perto) estado.perguntou = false;
    }
    // Entrou na caverna sem ter dado o alarme (com o vigia vivo ou não).
    if (herois().some((h) => naCaverna(h.pos))) await entrarNaCaverna();
  }

  // --------------------------------------------------- calar o vigia ----
  enc.antesDoTurno = (m) => {
    // Quem estava dormindo perde a primeira rodada, notando o grupo ou não.
    if (m.dormindo) {
      if (enc.round < 2) return true;
      m.dormindo = false;
      enc.say('acao', `${m.name} acorda com a barulheira e levanta da palha.`);
    }
    // O vigia sobreviveu ao primeiro golpe e chegou a agir: corre para a
    // caverna gritando, e o bando sai.
    if (m === vigia && estado.lutando && estado.lutando.length === 1 && !salvo.alarme) {
      salvo.alarme = true;
      const { agora, ondas } = ondasDaCaverna();
      enc.say('acao', 'O bugbear de vigia dá meia-volta e corre para a caverna, berrando. Lá de dentro, respondem.');
      const alcance = enc.reachableFor(m);
      let melhor = null;
      for (const n of alcance.values()) {
        if (enc.occupied(n.x, n.y, m)) continue;
        const d = distanceFt(n, CUME.entrada);
        if (!melhor || d < melhor.d) melhor = { n, d };
      }
      if (melhor && melhor.n.cost > 0) enc.moveAlong(m, Battlefield.pathFrom(alcance, melhor.n));
      for (const f of agora) {
        f.side = 'foes';
        f.dormindo = false;
        f.pos = { ...f.pos, ...casaPerto(CUME.foraDaBoca) };
        enc.addCombatant(f);
      }
      levas = prepararLevas(enc, ondas.map((o) => ({ ...o, rodada: enc.round + o.rodada - 1 })));
      estado.lutando = [vigia, ...caverna];
      return true;
    }
    // O chefe caiu: os bugbears fogem — os que estão lutando e os que ainda iam
    // sair da caverna. O ogro, não (o Obelisco: Gog luta até morrer).
    if (brughor && (brughor.dead || brughor.hp <= 0)) {
      if (!salvo.chefeCaiu) {
        salvo.chefeCaiu = true;
        levas?.remover((u) => u.defId === 'bugbear');
      }
      if (m.defId === 'bugbear' && m.side === 'foes' && !m.fugiu) {
        m.fugiu = true;
        if (m === vigia) salvo.vigia = 'fugiu';
        enc.combatants.splice(enc.combatants.indexOf(m), 1);
        enc.say('acao', `${m.name} vê o chefe no chão e foge encosta abaixo.`);
        enc.checkEnd();
        app.refresh();
        return true;
      }
    }
    return false;
  };

  function evento(ev) {
    // Golpe acorda quem dorme.
    if (ev.target?.dormindo && ev.type !== 'died' && ev.target.hp < ev.target.maxHp) ev.target.dormindo = false;
    if (ev.type === 'died' && ev.target === vigia) salvo.vigia = salvo.alarme ? 'morto' : 'calado';
  }

  // ------------------------------------------------------- fim da luta ----
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
      await narrar(root, { formato: 'tela', paginas: [{ titulo: 'O Cume da Wyvern', texto: [
        'O bando divide o que sobrou de vocês e volta a falar de Phandalin, mais animado do que antes.'] }] });
      app.encerrarPartida();
      return;
    }
    // Só o vigia caiu, sem alarme: silêncio — o bando nem desconfia.
    if (estado.lutando?.length === 1 && !salvo.alarme) {
      await painel('O bugbear tomba sem um som, e a faca dele faz mais barulho que ele ao bater na pedra. Da caverna, nada além de roncos.');
      prepararExploracao();
      return;
    }
    salvo.vencido = true;
    feitos.cumeLimpo = true;
    await painel([
      caverna.some((f) => f.fugiu) ? 'Com o chefe no chão, os bugbears que sobraram correm encosta abaixo e não olham para trás.' : 'O último deles cai. A caverna fica em silêncio, a não ser pelo vento na boca dela.',
      'O acampamento é de vocês. E, no fundo da caverna, um baú que ninguém se deu ao trabalho de fechar.',
      camp.poco?.kost === 'acordo' ? '(O Hamun Kost, no Poço da Coruja Velha, vai querer saber disto.)' : null,
    ].filter(Boolean));
    // 1.250, QUE É O NÚMERO DO LIVRO. Esteve em 1.600 por um tempo — a soma dos nossos blocos (vigia, seis
    // orcs, Brughor e o ogro) —, com o argumento de que 1.250 pagaria 350 a menos do que o bando vale. O
    // argumento é bom e mesmo assim foi desfeito, por uma razão simples: a função se chama `darXpDoLivro` e
    // TODAS as outras oito cenas da aventura pagam o número do livro. Uma exceção numa cena só não é decisão
    // de equilíbrio, é inconsistência — e quem subir de nível meia sessão mais cedo no Cume vai sentir falta
    // no Castelo. Se um dia se quiser pagar a soma dos blocos, que se pague em todas.
    //
    // E MEDIDO, porque trocar número de XP empurra tudo o que vem depois: `src/dev/medir-progressao.mjs` soma
    // a campanha inteira para quatro heróis. São 87 XP a menos por herói, o acumulado no fim do capítulo 4
    // cai de 3.249 para 3.162, e os dois caem na MESMA faixa — acima dos 2.700 do 4º nível e longe dos 6.500
    // do 5º. A troca não mudou o nível do grupo em ponto nenhum da campanha.
    await darXpDoLivro(1250, 'O Cume da Wyvern');
    prepararExploracao();
  }

  // ------------------------------------------------------ botão direito ----
  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    const longe = (pes) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
    if (sup === 'bau' && !salvo.bau) {
      ops.push({
        rotulo: 'Abrir o baú', icone: 'acao-usarObjeto',
        motivo: longe(5) ?? (salvo.vencido ? null : 'o bando ainda está aqui'),
        fazer: async () => {
          salvo.bau = true;
          // O Obelisco: 180 pp, 15 pe e três vidrinhos de perfume de 5 po (a Mina dava bem mais).
          guardar(c, 'moedaDePrata', 180 + 75);
          guardar(c, 'frascoDePerfume', 3);
          await painel(`Pilhagem de quem passou por umas fazendas ao norte: prata (180) e um punhado de electro (15, que valem 75 de prata), e três vidrinhos de perfume embrulhados num lenço bordado. ${c.name} guarda tudo.`);
        },
      });
    }
    // O FIO DO OBELISCO no acampamento: na parede NOROESTE da caverna, um desenho riscado pelos goblins de fora — um
    // goblin magricela com um cristal saindo do crânio (o Ruxithid do capítulo 5, que o grupo ainda não conhece).
    if (CASAS_DA_CAVERNA.has(`${tile.x},${tile.y}`) && casasNoroeste().has(`${tile.x},${tile.y}`) && !salvo.desenho) {
      ops.push({
        rotulo: 'Olhar o desenho na rocha', icone: 'acao-procurar', detalhe: 'na parede noroeste',
        motivo: longe(5) ?? (salvo.vencido ? null : 'o bando ainda está aqui'),
        fazer: async () => {
          salvo.desenho = true;
          const t = 'Goblins de fora: na caverna do Cume da Wyvern, um desenho tosco riscado na parede mostra um goblin magricela com um cristal saindo do crânio. Não é um Cragmaw.';
          if (!(vila.pistas ??= []).includes(t)) vila.pistas.push(t);
          await painel([
            'Na parede do noroeste, acima da altura de um bugbear sentado, alguém riscou um desenho tosco com carvão e ponta de faca: um goblin comprido e magricela, de braços finos demais, e saindo do alto da cabeça dele uma pedra pontuda, um cristal, desenhado com mais cuidado que o resto.',
            'Não é um Cragmaw, e não é coisa que um bugbear desenhe. A fuligem da fogueira cobriu metade, mas ninguém se deu ao trabalho de apagar.',
          ]);
        },
      });
    }
    const saida = CUME.saida.find((e) => e.x === tile.x && e.y === tile.y);
    if (saida) {
      ops.push({ rotulo: 'Voltar à trilha', icone: 'acao-disparada', detalhe: 'o mapa da região', motivo: longe(10),
        fazer: () => { estado.encerrado = true; app.irParaRegiao(enc.combatants.filter((x) => x.side === 'party' && !x.dead), 'cume'); } });
    }
    return ops;
  }

  /** Achar o acampamento: um teste por hora, de quem vai na frente. */
  async function procurar() {
    if (salvo.achado) return;
    const lider = [...herois()].sort((a, b) => Math.max(skillBonus(b, 'percepcao'), skillBonus(b, 'sobrevivencia'))
      - Math.max(skillBonus(a, 'percepcao'), skillBonus(a, 'sobrevivencia')))[0];
    const pericia = skillBonus(lider, 'sobrevivencia') > skillBonus(lider, 'percepcao') ? 'sobrevivencia' : 'percepcao';
    let horas = 0;
    let r;
    do { horas += 1; r = rolarPericia(enc.rng, lider, pericia); } while (r.total < 15 && horas < 8);
    salvo.achado = true;
    // O relógio da vila conta momentos do dia, não horas (`game/relogio.js`).
    // Somar as horas direto no contador misturava duas escalas: oito horas de
    // busca punham `tempo` em 8, e a vila ficava trancada em "noite" sem o dia
    // nunca virar, porque a volta era em 24.
    gastarHoras(vila, horas);
    await painel([
      'O cume não acaba: pedra rachada, ravina atrás de ravina, mato duro que arranha a canela. Daqui de cima se vê a Trilha de Triboar inteira — e daqui de baixo não se vê nada.',
      `${lider.name} toma a frente (${SKILL_NAME[pericia]}). ${horas === 1 ? 'Não leva uma hora' : `Leva ${horas} horas, para cima e para baixo`} até achar o que procurava: uma pegada larga demais para ser de gente, e mais adiante, presa num espinho, uma tira de couro com um dente amarrado.`,
      'O rastro sobe a encosta de pedra do tor, depois de um bosque, e some na boca escura de uma caverna aberta na rocha. Antes de a boca aparecer já se sente o que vem dela: fumaça de lenha queimada devagar, fraca e constante, do jeito que só cheira fogo que alguém mantém aceso.',
    ], { teste: { quem: lider.name, pericia: SKILL_NAME[pericia], total: r.total, cd: 15, passou: r.total >= 15 } });
  }

  return {
    lugar: 'Cume da Wyvern',
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    depoisDeMover,
    fimDoCombate,
    evento,
    dialogoDe: () => null,
    depoisDaConversa: () => {},
    motivoSemDescanso: (tipo) => {
      if (!estado.explorando) return 'só fora da luta';
      if (tipo === 'longo' && !salvo.vencido) return 'com um bando de saqueadores logo ali? Não';
      return null;
    },
    textoDoDescanso: () => ['Um descanso atrás das pedras, de olho na boca da caverna.'],
    async iniciar() {
      prepararExploracao();
      furtividade = testeDeGrupo();
      await procurar();
      // O vigia fica no tabuleiro desde já, de costas para o campo — mas só
      // entra na luta quando ela começar. Fora dela, é só uma figura quieta.
      if (vigia && !salvo.vencido) {
        vigia.side = 'neutro';
        enc.addCombatant(vigia);
      }
      app.refresh();
    },
  };
}
