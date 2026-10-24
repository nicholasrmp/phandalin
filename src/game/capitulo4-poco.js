// O POÇO DA CORUJA VELHA (Parte 3 da aventura). Mapa em `game/poco.js`.
//
// As REGRAS seguem o livro; o TEXTO é nosso:
//   - doze zumbis esperam dentro da base da torre, sem ser vistos de fora.
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
  if (kost) kost.facingVec = { dx: 0, dy: 1 };

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

  /** Os zumbis saem da torre e o mago sai da tenda. */
  function trazerTodos() {
    for (const f of [...zumbis, kost].filter(Boolean)) {
      if (enc.combatants.includes(f) || f.dead) continue;
      f.side = 'foes';
      if (enc.occupied(f.pos.x, f.pos.y)) f.pos = { ...f.pos, ...casaPerto(f.pos) };
      enc.addCombatant(f);
    }
    // Os primeiros já estão na porta da torre, saindo para o pátio.
    const porta = POCO.porta;
    zumbis.slice(0, 4).forEach((z, i) => {
      const p = casaPerto({ x: porta.x - 1, y: porta.y - 1 + i });
      z.pos = { ...z.pos, x: p.x, y: p.y };
    });
  }

  function combate() {
    trazerTodos();
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
    trazerTodos();
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
  async function conversa() {
    const fim = await app.conversarCom(kost, arvoreKost());
    if (fim === 'luta') {
      await painel('— Que pena. Eu estava gostando da conversa. — Ele estala os dedos, e os mortos voltam a andar.');
      kost.side = 'foes';
      combate();
      return;
    }
    if (!salvo.kost) salvo.kost = 'paz';
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
            { texto: 'Procuramos informação. Sobre a região.', vai: 'favor', uma: true },
            { texto: 'Atacar.', fim: 'luta' },
            { texto: 'Vamos embora. Bom estudo.', fim: 'paz' },
          ],
        },
        evasivo: {
          fala: 'Estudo pedras velhas. Pedras velhas não reclamam, não roubam e não fazem perguntas. Ao contrário de algumas pessoas.',
          opcoes: [{ texto: '…', vai: 'oi' }],
        },
        tatuagem: {
          narra: 'O desenho na testa é um sinal de escola de magia — a dos que mexem com a morte. Necromancia.',
          opcoes: [{ texto: '…', vai: 'oi' }],
        },
        nadaTatuagem: { narra: 'Um desenho escuro, anguloso. Pode ser qualquer coisa.', opcoes: [{ texto: '…', vai: 'oi' }] },
        manto: {
          narra: 'Manto vermelho, cabeça raspada, tatuagem: é como se vestem os magos de Thay, uma terra muito a leste, governada por eles.',
          opcoes: [{ texto: '…', vai: 'oi' }],
        },
        nadaManto: { narra: 'Um manto caro, de lã boa. Só isso.', opcoes: [{ texto: '…', vai: 'oi' }] },
        favor: {
          fala: [
            'Informação é mercadoria. Eu tenho, vocês querem. Façam-me um favor, e eu pago com o que sei.',
            'Os orcs do Cume da Wyvern, ao sul daqui, rondam este acampamento. Tirem-nos de lá. Ou — mais simples — perguntem à banshee de Conyberry o nome do mago que ergueu esta torre. Eu não vou irritar uma banshee; vocês talvez tenham menos a perder.',
          ],
          opcoes: [
            { texto: 'Combinado. Os dois, se der.', vai: 'acordo' },
            { texto: 'Não fazemos favor para necromante.', fim: 'paz' },
            { texto: 'Atacar.', fim: 'luta' },
          ],
        },
        acordo: {
          ao: () => {
            salvo.kost = 'acordo';
            feitos.kostNegociou = true;
            (vila.missoes ??= {});
            vila.missoes.orcs ??= 'ativa';
            vila.missoes.kost = 'ativa';
            (vila.pistas ??= []).push('Hamun Kost, um Mago Vermelho de Thay, cava as ruínas do Poço da Coruja Velha com zumbis de guarda. Ele troca informação por um favor: tirar os orcs do Cume da Wyvern, ou perguntar à banshee Agatha o nome do mago que ergueu a torre.');
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

  async function fimDoCombate(outcome) {
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      await narrar(root, { formato: 'tela', paginas: [{ titulo: 'O Poço da Coruja Velha', texto: [
        'O mago volta para a tenda e para o livro. Amanhã, os zumbis da torre são mais.'] }] });
      app.encerrarPartida();
      return;
    }
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
    // Em paz, clicar no mago reabre a conversa (pela tela de diálogo do motor).
    dialogoDe: (npc) => (npc === kost && ['acordo', 'paz'].includes(salvo.kost) ? arvoreKost() : null),
    depoisDaConversa: async (npc, fim) => {
      if (npc !== kost || fim !== 'luta') return;
      await painel('— Que pena. Eu estava gostando da conversa. — Ele estala os dedos, e os mortos voltam a andar.');
      salvo.kost = null;
      kost.side = 'foes';
      combate();
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
          : 'No alto de um cume comprido, o que foi uma torre de vigia: muros que viraram montes de pedra em volta de um pátio, e a base rachada da torre num canto. No meio do pátio, uma tenda de lona listrada, de cores vivas demais para este lugar. Ninguém à vista.',
      ] }] });
    },
  };
}
