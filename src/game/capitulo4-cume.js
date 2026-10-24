// O CUME DA WYVERN (Parte 3 da aventura). Mapa em `game/cume.js`.
//
// As REGRAS seguem o livro; o TEXTO é nosso:
//   - achar o acampamento escondido leva tempo: um teste de Percepção ou
//     Sobrevivência CD 15 por hora, de quem vai na frente;
//   - um orc vigia atrás de uma pedra, uns 20 m fora da caverna. Se o grupo
//     der conta dele em silêncio e rápido — antes de ele agir —, pode pegar
//     de surpresa os que estão na caverna. Se ele vir o grupo chegando, ou
//     sobreviver ao primeiro golpe, corre para a caverna avisar os outros;
//   - na caverna: Brughor Machado-Mordedor, seis orcs e o ogro Gog. O ogro
//     luta até morrer; os orcs, até o Brughor cair — aí fogem;
//   - no baú: 750 pc, 180 pp, 62 pe, 30 po e três frascos de perfume;
//   - dar conta dos orcs e do ogro: 1.250 XP. Cumpre a missão do Harbin e a
//     promessa feita ao Hamun Kost.
// Os 62 pe entram como 31 po (o jogo não tem peça de electro).
//
// DECISÕES NOSSAS:
//   - avisados, eles saem da caverna em levas: três orcs na hora, o Brughor
//     com mais três na rodada seguinte, o ogro na outra (oito de uma vez
//     esmagam um grupo de nível 3; ver `levas.js`);
//   - quem vê o grupo é o vigia: Percepção passiva dele contra a Furtividade
//     de cada herói, rolada uma vez na chegada.
//
// O estado mora em `app.campanha.cume` e sobrevive a sair e voltar.

import { narrar } from '../view/narrativa.js';
import { d20 } from '../core/dice.js';
import { skillBonus, passivePerception, SKILL_NAME } from '../rules/abilities.js';
import { distanceFt, Battlefield } from '../core/grid.js';
import { podeVer } from '../rules/luz.js';
import { makeMonster } from '../rules/monsters.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { prepararLevas } from './levas.js';
import { CUME } from './cume.js';

const MOVIMENTO = 60;
const dentro = (p, r) => p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1;

export function criarCume(app, config) {
  void config;
  const enc = app.enc;
  const root = app.root;
  const camp = (app.campanha ??= {});
  const feitos = (camp.feitos ??= {});
  const vila = (camp.vila ??= { pistas: [], missoes: {} });
  const salvo = (camp.cume ??= { achado: false, vigia: null, alarme: false, vencido: false, bau: false });
  const estado = { explorando: false, encerrado: false, lutando: null };

  const herois = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead && c.hp > 0);
  const casaPerto = (p) => enc.casaLivreMaisProxima(p) ?? p;
  const painel = (texto, extra = {}) => narrar(root, { formato: 'painel', paginas: [{ texto: [].concat(texto), ...extra }] });
  const guardar = (c, id, qtd) => {
    const b = (c.bag ??= []).find((i) => i.id === id);
    if (b) b.qtd += qtd; else c.bag.push({ id, tipo: 'item', qtd });
  };

  // ---------------------------------------------------------- os orcs ----
  const vigia = salvo.vigia ? null : makeMonster('orc', { x: 17, y: 7 }, { nameSuffix: 'de vigia' });
  if (vigia) vigia.facingVec = { dx: 0, dy: 1 };
  const caverna = [];
  if (!salvo.vencido) {
    const brughor = makeMonster('brughor', { x: 23, y: 7 });
    brughor.chefe = true;
    caverna.push(brughor);
    [[21, 7], [22, 8], [24, 8], [21, 8], [23, 6], [24, 7]].forEach(([x, y], i) => {
      caverna.push(makeMonster('orc', { x, y }, { nameSuffix: 'ABCDEF'[i] }));
    });
    const gog = makeMonster('ogro', { x: 25, y: 8 });
    gog.name = 'Gog';
    gog.ateOFim = true;
    caverna.push(gog);
    for (const f of caverna) f.facingVec = { dx: -1, dy: -1 };
  }
  const brughor = caverna.find((f) => f.chefe);
  // A Furtividade de cada um, rolada na chegada (o livro não diz quando; uma
  // vez só é o que deixa a aproximação ser um plano, e não um dado por passo).
  const furtividade = new Map();
  let levas = null;

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
    // Quem conta para a surpresa é quem está chegando perto: o herói que
    // ficou lá atrás, no campo, não faz barulho nenhum perto da pedra.
    const chegando = herois().filter((h) => quem.some((f) => distanceFt(h.pos, f.pos) <= 60));
    enc.emboscada = surpresa === 'nossa'
      ? { emboscadores: 'party', furtividade: (chegando.length ? chegando : herois()).map((h) => furtividade.get(h) ?? 10) }
      : surpresa === 'deles' ? { emboscadores: 'foes', furtividade: quem.map((f) => d20(enc.rng, skillBonus(f, 'furtividade')).total) } : null;
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
  }

  /** O alarme: os da caverna saem, em levas. */
  function ondasDaCaverna() {
    const orcs = caverna.filter((f) => !f.chefe && f.name !== 'Gog' && !f.dead);
    const gog = caverna.find((f) => f.name === 'Gog' && !f.dead);
    const boca = CUME.entrada;
    const na = (f) => { f.pos = { ...f.pos, x: boca.x, y: boca.y + 1 }; return f; };
    return {
      agora: orcs.slice(0, 3),
      ondas: [
        { rodada: 2, units: [brughor, ...orcs.slice(3)].filter((f) => f && !f.dead).map(na), aviso: 'Da boca da caverna sai o chefe, um orc enorme, berrando ordens, e mais orcs atrás dele.' },
        { rodada: 3, units: gog ? [na(gog)] : [], aviso: 'O chão treme: um ogro sai da caverna, de clava na mão, sorrindo.' },
      ],
    };
  }

  async function alarme(motivo) {
    salvo.alarme = true;
    const { agora, ondas } = ondasDaCaverna();
    for (const f of agora) f.pos = { ...f.pos, ...casaPerto({ x: CUME.entrada.x, y: CUME.entrada.y - 1 }) };
    await narrar(root, { formato: 'painel', paginas: [{ texto: [motivo,
      'Lá de dentro vem a resposta: berros, metal batendo em metal, e o barulho de muita gente pegando em armas.'] }],
    escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    luta([...(vigia && !vigia.dead ? [vigia] : []), ...agora], null, ondas);
  }

  // ------------------------------------------------------- aproximação ----
  async function depoisDeMover(c) {
    if (!estado.explorando) return;
    c.movementLeftFt = MOVIMENTO;
    if (salvo.vencido) return;
    // O vigia ainda de pé: vê quem não está escondido dele.
    if (vigia && !vigia.dead && !salvo.alarme) {
      const visto = herois().find((h) => podeVer(enc, vigia, h) && (furtividade.get(h) ?? 0) < passivePerception(vigia)
        && distanceFt(h.pos, vigia.pos) <= 90);
      if (visto) {
        await alarme(`O orc de vigia levanta a cabeça de trás da pedra, vê ${visto.name}, e sai correndo para a caverna, berrando em orc.`);
        return;
      }
      // Chegou a 30 pés sem ser visto: dá para calá-lo antes que ele grite.
      const perto = herois().find((h) => distanceFt(h.pos, vigia.pos) <= 30);
      if (perto && !estado.perguntou) {
        estado.perguntou = true;
        const r = await narrar(root, { formato: 'painel', paginas: [{ texto: [
          `Encostado numa pedra, um orc de vigia afia uma faca, distraído, de olho no lado errado da passagem. Ainda não viu ninguém. ${perto.name} está a poucos passos.`,
          'Um golpe rápido, e o resto do bando nem fica sabendo. Um golpe que não acabe com ele, e ele grita.'] }],
          escolhas: [
            { rotulo: 'Esperar', valor: 'espera' },
            { rotulo: 'Atacar de surpresa', valor: 'ataca', primaria: true },
          ] });
        if (r === 'ataca') { luta([vigia], 'nossa'); return; }
      }
      if (!perto) estado.perguntou = false;
    }
    // Com o vigia calado, entrar na caverna pega o bando de surpresa.
    if (!salvo.alarme && (!vigia || vigia.dead || salvo.vigia === 'calado')
      && herois().some((h) => dentro(h.pos, CUME.caverna))) {
      await narrar(root, { formato: 'painel', paginas: [{ texto: [
        'O cheiro de fumaça, couro curtido e carne mal assada vem antes da luz. Lá no fundo da caverna, em volta de uma fogueira quase apagada, o bando inteiro: orcs roncando, um jogando ossos, e uma montanha de gente que só pode ser um ogro.',
        'Ninguém olhou para a entrada.'] }],
      escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
      salvo.alarme = true;
      luta(caverna.filter((f) => !f.dead), 'nossa');
    }
  }

  // --------------------------------------------------- calar o vigia ----
  // Atacar o vigia antes de ele ver o grupo: luta só com ele, de surpresa.
  // Se ele chegar a agir, corre para a caverna — e o alarme sai.
  enc.antesDoTurno = (m) => {
    if (m === vigia && estado.lutando && estado.lutando.length === 1 && !salvo.alarme) {
      salvo.alarme = true;
      const { agora, ondas } = ondasDaCaverna();
      enc.say('acao', 'O orc de vigia dá meia-volta e corre para a caverna, berrando. Lá de dentro, respondem.');
      // Ele corre em direção à boca da caverna.
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
        f.pos = { ...f.pos, ...casaPerto({ x: CUME.entrada.x, y: CUME.entrada.y - 1 }) };
        enc.addCombatant(f);
      }
      levas = prepararLevas(enc, ondas.map((o) => ({ ...o, rodada: enc.round + o.rodada - 1 })));
      estado.lutando = [vigia, ...caverna];
      return true;
    }
    // O chefe caiu: os orcs que sobram fogem. O ogro, não.
    if (brughor && (brughor.dead || brughor.hp <= 0) && m.defId === 'orc' && m.side === 'foes' && !m.fugiu) {
      m.fugiu = true;
      enc.combatants.splice(enc.combatants.indexOf(m), 1);
      enc.say('acao', `${m.name} vê o chefe no chão e foge desfiladeiro abaixo.`);
      enc.checkEnd();
      app.refresh();
      return true;
    }
    return false;
  };

  function evento(ev) {
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
        'Os orcs dividem o que sobrou de vocês e voltam a falar de Phandalin, mais animados do que antes.'] }] });
      app.encerrarPartida();
      return;
    }
    // Só o vigia caiu, sem alarme: silêncio — o bando nem desconfia.
    if (estado.lutando?.length === 1 && !salvo.alarme) {
      await painel('O orc de vigia cai atrás da pedra sem um grito. Da caverna, só o ronco de sempre.');
      prepararExploracao();
      return;
    }
    salvo.vencido = true;
    feitos.cumeLimpo = true;
    if (vila.missoes?.orcs === 'ativa') vila.missoes.orcs = 'ativa';
    await painel([
      caverna.some((f) => f.fugiu) ? 'Com o chefe no chão, os orcs que sobraram correm desfiladeiro abaixo e não olham para trás.' : 'O último deles cai. O desfiladeiro fica em silêncio, a não ser pelo vento.',
      'O acampamento é de vocês. E, no fundo da caverna, um baú que ninguém se deu ao trabalho de fechar.',
    ]);
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
          guardar(c, 'moedaDeCobre', 750); guardar(c, 'moedaDePrata', 180); guardar(c, 'moedaDeOuro', 61);
          guardar(c, 'frascoDePerfume', 3);
          await painel(`O que o bando arrancou das fazendas pelo caminho, tudo misturado: 750 peças de cobre, 180 de prata, 62 de electro, 30 de ouro e três frascos de perfume, um deles ainda com a fita de presente. ${c.name} guarda tudo.`);
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
    do { horas += 1; r = d20(enc.rng, skillBonus(lider, pericia)); } while (r.total < 15 && horas < 8);
    salvo.achado = true;
    if (vila.tempo != null) vila.tempo += horas;
    await painel([
      'O cume é enorme: pedra quebrada, ravinas que não levam a lugar nenhum, capim duro até o joelho. Um acampamento escondido aqui pode levar o dia inteiro para achar.',
      `${lider.name} vai na frente, lendo o chão (${SKILL_NAME[pericia]}). ${horas === 1 ? 'Em menos de uma hora' : `Depois de ${horas} horas de subida e descida`}, um cheiro de fumaça fraca, e pegadas de bota grande demais para gente.`,
      'Lá adiante, depois do bosque, um desfiladeiro corta o planalto. A trilha das pegadas sobe por uma passagem estreita entre os paredões.',
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
      if (tipo === 'longo' && !salvo.vencido) return 'com um bando de orcs logo ali? Não';
      return null;
    },
    textoDoDescanso: () => ['Um descanso atrás das pedras, de olho no desfiladeiro.'],
    async iniciar() {
      prepararExploracao();
      for (const h of herois()) furtividade.set(h, d20(enc.rng, skillBonus(h, 'furtividade')).total);
      await procurar();
      // O vigia fica no tabuleiro desde já, de costas para a pedra — mas só
      // entra na luta quando ela começar. Fora dela, é só uma figura quieta.
      if (vigia && !salvo.vencido) {
        vigia.side = 'neutro';
        vigia.vigiando = true;
        enc.addCombatant(vigia);
      }
      app.refresh();
    },
  };
}
