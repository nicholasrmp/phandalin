// O POÇO DA CORUJA VELHA (Parte 3 da aventura). Mapa em `game/poco.js`.
//
// As REGRAS seguem o livro; o TEXTO é nosso:
//   - doze zumbis esperam dentro da base da torre, sem ser vistos de fora.
//     Saem pela porta, que tem uma casa de largura: três de início e mais
//     dois a cada três rodadas (decisão nossa, medida pelo revisor de
//     encontro: os doze de uma vez matavam o grupo inteiro de nível 3 em uma
//     luta de cada quatro). Com o grupo abaixo do nível 3, a torre tem oito;
//     Quem tem Percepção passiva 10 ou mais sente cheiro de morte vindo dela;
//   - quando o grupo chega perto da torre ou da tenda, os zumbis saem, e o
//     mago sai da tenda perguntando o que é aquilo;
//   - se alguém falar com ele — até um cumprimento — ele segura os zumbis. É
//     Hamun Kost, um Mago Vermelho de Thay (Arcanismo CD 10 reconhece a
//     tatuagem necromântica; História CD 10, o manto de Thay). Ele não diz o
//     que faz ali, mas troca informação por um favor: tirar os orcs do Cume
//     da Wyvern, ou perguntar à banshee Agatha o nome de quem ergueu a torre;
//   - negociar e contar ao Daran: 200 XP. Vencer o mago e os zumbis: 800 XP;
//   - na tenda: 35 pp, 20 pe, 20 po, 5 pl, uma pérola, uma poção de cura, um
//     pergaminho de escuridão, cinco joias miúdas e um anel de proteção.
// Os 20 pe entram como 10 po (o jogo não tem peça de electro).
//
// O estado mora em `app.campanha.poco` e sobrevive a sair e voltar.

import { narrar } from '../view/narrativa.js';
import { d20 } from '../core/dice.js';
import { skillBonus, passivePerception, SKILL_NAME } from '../rules/abilities.js';
import { distanceFt } from '../core/grid.js';
import { hasCondition } from '../rules/conditions.js';
import { makeMonster } from '../rules/monsters.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { POCO } from './poco.js';
import { prepararLevas } from './levas.js';

const MOVIMENTO = 60;
const dentro = (p, r) => p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1;

export function criarPoco(app, config) {
  const enc = app.enc;
  const root = app.root;
  const camp = (app.campanha ??= {});
  const feitos = (camp.feitos ??= {});
  const vila = (camp.vila ??= { pistas: [], missoes: {} });
  const salvo = (camp.poco ??= { despertou: false, kost: null, tenda: false, cheiro: false, xp: false });
  const estado = { explorando: false, encerrado: false, lutando: false };
  void config;

  const herois = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead && c.hp > 0);
  const casaPerto = (p) => enc.casaLivreMaisProxima(p) ?? p;
  const painel = (texto, extra = {}) => narrar(root, { formato: 'painel', paginas: [{ texto: [].concat(texto), ...extra }] });
  const guardar = (c, id, qtd) => {
    const b = (c.bag ??= []).find((i) => i.id === id);
    if (b) b.qtd += qtd; else c.bag.push({ id, tipo: 'item', qtd });
  };
  const teste = (c, pericia, cd) => {
    const r = d20(enc.rng, skillBonus(c, pericia));
    return { quem: c.name, pericia: SKILL_NAME[pericia], total: r.total, cd, passou: r.total >= cd };
  };

  // ------------------------------------------------- o mago e os zumbis ----
  // Ficam fora do tabuleiro até despertarem; os já vencidos não voltam.
  const zumbis = [];
  const vagas = [];
  for (let y = POCO.torre.y0; y <= POCO.torre.y1; y++) for (let x = POCO.torre.x0; x <= POCO.torre.x1; x++) vagas.push({ x, y });
  if (salvo.kost !== 'morto' && salvo.kost !== 'preso') {
    for (let i = 0; i < 12 - (salvo.zumbisMortos ?? 0); i++) {
      const z = makeMonster('zumbi', { ...vagas[(i * 2) % vagas.length] }, { nameSuffix: String(i + 1) });
      z.facingVec = { dx: -1, dy: 0 };
      zumbis.push(z);
    }
  }
  const kost = ['morto', 'preso'].includes(salvo.kost) ? null : makeMonster('hamunKost', { x: 9, y: 11 });
  if (kost) {
    kost.facingVec = { dx: 0, dy: 1 };
    // Com `falas`, o menu do botão direito oferece "Conversar" até no meio da
    // luta: o livro diz que basta alguém falar com ele para ele segurar os mortos.
    kost.falas = ['…'];
  }
  let levas = null;
  const nivelMedio = () => {
    const g = enc.combatants.filter((c) => c.side === 'party' && !c.dead);
    return g.reduce((s, c) => s + (c.level ?? 1), 0) / Math.max(1, g.length);
  };

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
    estado.lutando = false;
    root.classList.add('explorando');
    if (!herois().includes(app.selected)) app.select(herois()[0]);
    app.refresh();
  }

  /** Os zumbis que esta torre tem para este grupo, os vencidos de fora. */
  function daTorre() {
    const total = Math.max(0, (nivelMedio() >= 3 ? 12 : 8) - (salvo.zumbisMortos ?? 0));
    return zumbis.filter((z) => !z.dead).slice(0, total);
  }

  /** Os três primeiros saem da porta, e o mago sai da tenda. */
  function trazerPrimeiros() {
    const porta = POCO.porta;
    daTorre().slice(0, 3).forEach((z, i) => {
      if (enc.combatants.includes(z)) return;
      z.side = 'foes';
      z.pos = { ...z.pos, ...casaPerto({ x: porta.x - 1, y: porta.y - 1 + i }) };
      enc.addCombatant(z);
    });
    if (kost && !kost.dead && !enc.combatants.includes(kost)) {
      kost.pos = { ...kost.pos, ...casaPerto({ x: 9, y: 11 }) };
      enc.addCombatant(kost);
    }
  }

  function combate() {
    trazerPrimeiros();
    if (kost) kost.side = 'foes';
    // O resto sai pela porta, dois de cada vez, a cada três rodadas.
    const resto = daTorre().filter((z) => !enc.combatants.includes(z));
    const ondas = [];
    for (let i = 0; i < resto.length; i += 2) {
      const units = resto.slice(i, i + 2);
      for (const z of units) { z.side = 'foes'; z.pos = { ...z.pos, x: POCO.porta.x - 1, y: POCO.porta.y }; }
      ondas.push({ rodada: 4 + (i / 2) * 3, units, aviso: 'Mais mortos arrastam os pés para fora da porta escura da torre.' });
    }
    levas = prepararLevas(enc, ondas);
    estado.explorando = false;
    estado.lutando = true;
    root.classList.remove('explorando');
    enc.emboscada = null;
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
  }

  // ------------------------------------------------------- a chegada ----
  async function depoisDeMover(c) {
    if (!estado.explorando) return;
    c.movementLeftFt = MOVIMENTO;
    if (!salvo.cheiro && herois().some((h) => passivePerception(h) >= 10 && dentro(h.pos, { x0: 4, y0: 3, x1: 21, y1: 18 }))) {
      salvo.cheiro = true;
      const quem = herois().find((h) => passivePerception(h) >= 10);
      await painel(`${quem.name} franze o nariz: um cheiro doce e podre vem da torre caída, forte demais para ser bicho morto no mato.`);
    }
    if (salvo.despertou || salvo.kost) return;
    const perto = herois().find((h) => distanceFt(h.pos, POCO.porta) <= 20
      || POCO.tenda.some((t) => distanceFt(h.pos, t) <= 15));
    if (!perto) return;
    salvo.despertou = true;
    await despertar();
  }

  async function despertar() {
    trazerPrimeiros();
    if (kost) kost.side = 'neutro';
    app.refresh();
    const r = await narrar(root, {
      formato: 'painel',
      paginas: [{ texto: [
        'Da porta escura da torre sai o primeiro, arrastando um pé: pele cinzenta, boca aberta, olhos sem nada dentro. Atrás dele, outro. E outro. Muitos.',
        'A aba da tenda se abre. Um homem largo, de cabeça raspada e manto vermelho até os pés, para na entrada com uma pena de escrever na mão. Na testa, uma tatuagem escura.',
        '— Mas o que é isto? — Ele olha para vocês como quem olha um borrão de tinta na página. — Quem mandou vocês aqui?',
      ] }],
      escolhas: [
        { rotulo: 'Às armas!', valor: 'luta' },
        { rotulo: 'Responder ao mago', valor: 'fala', primaria: true },
      ],
    });
    if (r === 'luta') { combate(); return; }
    await conversa();
  }

  // ------------------------------------------------------ Hamun Kost ----
  // As opções de uma vez só do Kost valem por conversa, não para sempre:
  // quem recusou o trato numa visita pode aceitar na outra.
  const esquecerUsadas = () => { if (camp.flags) delete camp.flags['dialogo:hamunKost:usadas']; };

  async function conversa() {
    esquecerUsadas();
    const fim = await app.conversarCom(kost, arvoreKost());
    if (fim === 'luta') {
      await painel('— Que pena. Eu estava gostando da conversa. — Ele estala os dedos, e os mortos voltam a andar.');
      combate();
      return;
    }
    // Fechar a conversa não decide nada: o mago espera na porta da tenda, e
    // dá para falar com ele de novo.
    if (fim === 'paz' && !salvo.kost) salvo.kost = 'paz';
    recolher();
    prepararExploracao();
  }

  function arvoreKost() {
    return {
      inicio: 'oi',
      nos: {
        oi: {
          ao: () => { enc.say('acao', 'Hamun Kost ergue a mão, e os zumbis param onde estão.'); },
          narra: 'Ele ergue a mão sem pressa. Os mortos param onde estão, balançando de leve, como roupa no varal.',
          fala: 'Muito bem, gente que fala. Eu sou Hamun Kost, e estou ocupado. Digam o que querem, e digam depressa.',
          opcoes: [
            { texto: 'O que você faz aqui?', vai: 'evasivo', uma: true },
            { texto: '(Examinar a tatuagem da testa)', teste: { pericia: 'arcanismo', cd: 10 }, sucesso: 'tatuagem', falha: 'nadaTatuagem', uma: true },
            { texto: '(Examinar o manto vermelho)', teste: { pericia: 'historia', cd: 10 }, sucesso: 'manto', falha: 'nadaManto', uma: true },
            { texto: 'Procuramos informação. Sobre a região.', vai: 'favor', uma: true,
              requer: () => (salvo.kost === 'acordo' ? 'nada' : null), oculta: true },
            { texto: 'Os orcs do Cume da Wyvern não incomodam mais ninguém.', vai: 'pago',
              requer: () => (salvo.kost === 'acordo' && feitos.cumeLimpo && !feitos.kostPagou ? null : 'nada'), oculta: true },
            { texto: 'A banshee respondeu: o mago da torre se chamava Arthindol.', vai: 'pago',
              requer: () => (salvo.kost === 'acordo' && feitos.agathaTorre && !feitos.kostPagou ? null : 'nada'), oculta: true },
            { texto: 'Atacar.', fim: 'luta' },
            { texto: 'Vamos embora. Bom estudo.', fim: 'paz' },
          ],
        },
        evasivo: {
          fala: 'Estudo pedras velhas. Pedras velhas não reclamam, não roubam e não fazem perguntas. Ao contrário de algumas pessoas.',
          opcoes: [{ texto: '…', vai: 'oi' }],
        },
        tatuagem: {
          narra: 'Quem estudou um pouco de magia reconhece o traço: não é enfeite, é a marca de uma escola. E esta escola trata de cadáveres. Necromancia.',
          opcoes: [{ texto: '…', vai: 'oi' }],
        },
        nadaTatuagem: { narra: 'Um desenho escuro, anguloso. Pode ser qualquer coisa.', opcoes: [{ texto: '…', vai: 'oi' }] },
        manto: {
          narra: 'Vermelho dos pés à cabeça, crânio pelado, desenho na testa: é o uniforme dos magos de Thay. Lá longe, no leste, são eles que mandam — e não costumam viajar sem motivo.',
          opcoes: [{ texto: '…', vai: 'oi' }],
        },
        nadaManto: { narra: 'Um manto caro, de lã boa. Só isso.', opcoes: [{ texto: '…', vai: 'oi' }] },
        favor: {
          fala: [
            'Informação é mercadoria. Eu tenho, vocês querem. Façam-me um favor, e eu pago com o que sei.',
            'Tem um bando de orcs no Cume da Wyvern, aqui ao sul. Já vieram farejar o meu pátio duas vezes; na terceira, alguém se machuca, e não quero que seja a minha lona. Livrem-me deles.',
            'Ou então: a velha de Conyberry — a banshee — sabe o nome de quem ergueu esta torre. Eu precisaria desse nome. Mas não falo com mortos de mau humor. Vocês, pelo jeito, falam com qualquer um.',
          ],
          opcoes: [
            { texto: 'Combinado. Os dois, se der.', vai: 'acordo' },
            { texto: 'Não fazemos favor para necromante.', fim: 'paz' },
            { texto: 'Atacar.', fim: 'luta' },
          ],
        },
        pago: {
          ao: () => {
            feitos.kostPagou = true;
            feitos.sabeOCastelo = true;
            (vila.missoes ??= {}).kost = 'feita';
            if (!(vila.pistas ??= []).some((p) => p.startsWith('Hamun Kost contou'))) {
              vila.pistas.push('Hamun Kost contou onde fica o Castelo Dentefino: goblins passam pelas colinas a caminho da mata de Neverwinter, ao norte da Trilha Triboar, e voltam para umas torres caídas lá dentro. Agora o castelo aparece no mapa da região.');
            }
          },
          narra: 'Ele sorri pela primeira vez, sem mostrar os dentes.',
          fala: [
            'Gente de palavra. Que raridade. Então ouçam: goblins passam por estas colinas toda semana, carregando coisa roubada, e todos vão para o mesmo lugar — para o norte, mata adentro, umas torres velhas caindo umas por cima das outras.',
            'O chefe deles se diz rei. Não vale o título, mas tem muitos súditos. Boa caçada.',
          ],
          opcoes: [{ texto: '…', fim: 'paz' }],
        },
        acordo: {
          ao: () => {
            salvo.kost = 'acordo';
            feitos.kostNegociou = true;
            (vila.missoes ??= {});
            vila.missoes.orcs ??= 'ativa';
            vila.missoes.kost ??= 'ativa';
            if (!(vila.pistas ??= []).some((p) => p.startsWith('Hamun Kost'))) vila.pistas.push('Hamun Kost, um Mago Vermelho de Thay, cava as ruínas do Poço da Coruja Velha com zumbis de guarda. Ele troca informação por um favor: tirar os orcs do Cume da Wyvern, ou perguntar à banshee Agatha o nome do mago que ergueu a torre.');
          },
          fala: 'Ótimo. Gente prática. Voltem quando tiverem alguma coisa, e não tragam mais ninguém.',
          opcoes: [{ texto: '…', vai: 'volta' }],
        },
        volta: {
          narra: 'Ele volta para a tenda. Os zumbis se arrastam de volta para o escuro da torre.',
          opcoes: [{ texto: '…', fim: 'paz' }],
        },
      },
    };
  }

  function arvoreEmLuta() {
    return {
      inicio: 'oi',
      nos: {
        oi: {
          narra: 'No meio da gritaria, alguém chama o mago pelo nome.',
          fala: '— Ah, agora querem conversar? — Ele ergue a mão, e os mortos que ainda estão na porta param. — Falem. E falem rápido, que eles não têm paciência.',
          opcoes: [{ texto: 'Segura esses mortos e conversamos.', fim: 'segura' }],
        },
      },
    };
  }

  /**
   * Em paz (acordo, ou o grupo só foi embora conversando): os zumbis voltam
   * para o escuro da torre, e o mago fica na porta da tenda, neutro — dá para
   * falar com ele de novo, ou mudar de ideia.
   */
  function recolher() {
    for (const z of zumbis) {
      const i = enc.combatants.indexOf(z);
      if (i >= 0 && !z.dead) enc.combatants.splice(i, 1);
      z.pos = { ...z.pos, ...vagas[zumbis.indexOf(z) * 2 % vagas.length] };
    }
    if (kost && !kost.dead) {
      kost.side = 'neutro';
      kost.pos = { ...kost.pos, x: 9, y: 11 };
      if (!enc.combatants.includes(kost)) enc.addCombatant(kost);
    }
    app.refresh();
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

  function evento(ev) {
    if (ev.type === 'died' && zumbis.includes(ev.target)) salvo.zumbisMortos = (salvo.zumbisMortos ?? 0) + 1;
    if (ev.type === 'died' && ev.target === kost) salvo.kost = 'morto';
  }

  /** Falou com o Kost no meio da luta: a próxima leva demora mais duas rodadas. */
  function segurar() {
    if (!levas) return;
    levas.atrasar(2);
    enc.say('acao', 'Hamun Kost ergue a mão: os mortos na porta da torre param, esperando.');
  }

  async function fimDoCombate(outcome) {
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      await narrar(root, { formato: 'tela', paginas: [{ titulo: 'O Poço da Coruja Velha', texto: [
        'O mago volta para a tenda e para o livro. Amanhã, os zumbis da torre são mais.'] }] });
      app.encerrarPartida();
      return;
    }
    levas?.limpar();
    levas = null;
    if (kost && !kost.dead && (kost.capturado || hasCondition(kost, 'inconsciente'))) salvo.kost = 'preso';
    const texto = [salvo.kost === 'preso'
      ? 'Hamun Kost está caído, amarrado com o próprio cinto. Os zumbis que sobraram desabam sem a vontade dele.'
      : 'O último morto cai e não levanta. O mago de vermelho não vai mais estudar pedra nenhuma.'];
    feitos.kostDerrotado = true;
    await painel(texto);
    if (!salvo.xp) { salvo.xp = true; await darXpDoLivro(800, 'O Poço da Coruja Velha'); }
    prepararExploracao();
  }

  // ------------------------------------------------------ botão direito ----
  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    const longe = (pes) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
    if (sup === 'tenda' && !salvo.tenda) {
      ops.push({
        rotulo: 'Revistar a tenda', icone: 'acao-procurar', motivo: longe(5)
          ?? (salvo.kost === 'morto' || salvo.kost === 'preso' ? null : 'o dono está aí dentro'),
        fazer: async () => {
          salvo.tenda = true;
          guardar(c, 'moedaDePrata', 35); guardar(c, 'moedaDeOuro', 30); guardar(c, 'moedaDePlatina', 5);
          guardar(c, 'perola', 1); guardar(c, 'pocaoDeCura', 1); guardar(c, 'pergaminhoDeEscuridao', 1);
          guardar(c, 'joiaMiuda', 5); guardar(c, 'anelDeProtecao', 1);
          await painel([
            'Cama de campanha, cadeira dobrável, uma escrivaninha cheia de rascunhos da torre e um baú de roupas boas.',
            `No fundo do baú, uma bolsa de couro: 35 peças de prata, 20 de electro, 20 de ouro, 5 de platina, uma pérola, uma poção de cura e um pergaminho de escuridão num tubo de osso. E uma caixinha com cinco joias miúdas e um anel de prata fosca, com um sinal que ninguém mais usa — de um império que caiu antes de qualquer reino de hoje. É mágico. ${c.name} guarda tudo.`,
          ]);
        },
      });
    }
    if (sup === 'pocoVelho') {
      ops.push({ rotulo: 'Encher os cantis', icone: 'acao-usarObjeto', motivo: longe(5),
        fazer: () => painel('A corda é nova; o balde, também. A água sobe fria e limpa, com gosto de pedra.') });
    }
    const saida = POCO.saida.find((e) => e.x === tile.x && e.y === tile.y);
    if (saida) {
      ops.push({ rotulo: 'Voltar à trilha', icone: 'acao-disparada', detalhe: 'o mapa da região', motivo: longe(10),
        fazer: () => sair() });
    }
    return ops;
  }

  async function sair() {
    estado.encerrado = true;
    root.classList.remove('explorando');
    app.irParaRegiao(enc.combatants.filter((c) => c.side === 'party' && !c.dead), 'poco');
  }

  return {
    lugar: 'Poço da Coruja Velha',
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    depoisDeMover,
    fimDoCombate,
    evento,
    // Clicar no mago: em paz, a conversa inteira; no meio da luta, uma fala
    // curta que segura a próxima leva de mortos por duas rodadas.
    dialogoDe: (npc) => {
      if (npc !== kost) return null;
      if (estado.lutando) return arvoreEmLuta();
      if (salvo.despertou && !['morto', 'preso'].includes(salvo.kost)) { esquecerUsadas(); return arvoreKost(); }
      return null;
    },
    depoisDaConversa: async (npc, fim) => {
      if (npc !== kost) return;
      if (estado.lutando) { if (fim === 'segura') segurar(); return; }
      if (fim === 'luta') {
        await painel('— Que pena. Eu estava gostando da conversa. — Ele estala os dedos, e os mortos voltam a andar.');
        salvo.kost = null;
        combate();
      } else if (fim === 'paz' && !salvo.kost) {
        salvo.kost = 'paz';
      }
    },
    motivoSemDescanso: (tipo) => {
      if (!estado.explorando) return 'só fora da luta';
      if (tipo === 'longo' && !salvo.kost) return 'com zumbis na torre ao lado? Melhor não';
      return null;
    },
    textoDoDescanso: () => ['Um descanso à sombra do muro caído, de olho na torre.'],
    async iniciar() {
      prepararExploracao();
      // Voltando depois do acordo: o mago e os mortos estão em paz.
      if (salvo.kost === 'acordo' || salvo.kost === 'paz') recolher();
      await narrar(root, { formato: 'painel', paginas: [{ titulo: 'O Poço da Coruja Velha', texto: [
        salvo.despertou
          ? 'O cume de sempre, o vento de sempre. A tenda vermelha continua no meio do pátio.'
          : 'A trilha sobe o cume em zigue-zague e termina numa coisa que já foi forte: pedra lavrada espalhada pelo capim, um anel de entulho que um dia foi muro, e um toco grosso de torre rachada ao meio. E, plantada bem no meio de tudo, uma tenda listrada de vermelho e amarelo, alegre como uma feira. Nenhuma fumaça. Ninguém responde ao vento.',
      ] }] });
    },
  };
}
