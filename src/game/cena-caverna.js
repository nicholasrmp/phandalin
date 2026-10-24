// A caverna escura: a arena de teste da luz, das conversas e do descanso.
//
//   exploração  o grupo anda livre, sem iniciativa, no breu. Quem não tem
//               visão no escuro precisa de tocha (botão direito no herói),
//               e tocha acesa se vê do outro lado do corredor.
//   quem vê     depois de cada passo: se o grupo enxerga um guarda, a luta
//               começa sem surpresa. Se um guarda enxerga um herói antes —
//               a 30 pés no escuro, ou de qualquer distância se ele carrega
//               tocha —, os goblins atacam primeiro e rola-se surpresa.
//   Droop       ao lado da fogueira, no nicho do norte. Não luta. Botão
//               direito nele → Conversar: perguntas, Intimidação, Persuasão
//               e uma fala que só um anão do grupo destrava.
//   depois      vitória volta à exploração (descansar, conversar com Droop);
//               derrota oferece de novo ou o menu.
//
// Usa a mesma interface de cena que o capítulo 1 (`main.js` só conversa com
// ela por `explorando`, `interacoes`, `depoisDeMover`, `fimDoCombate` e os
// ganchos opcionais de conversa e descanso).
//
// Texto nosso. Droop é nome do cenário (Fan Content Policy); as falas são
// escritas aqui, no jeito dele de `rules/npcs.js`.

import { narrar } from '../view/narrativa.js';
import { d20 } from '../core/dice.js';
import { skillBonus } from '../rules/abilities.js';
import { distanceFt } from '../core/grid.js';
import { podeVer, visaoNoEscuro } from '../rules/luz.js';

const MOVIMENTO = 60;

export function criarCenaCaverna(app, config) {
  const enc = app.enc;
  const root = app.root;
  const todos = app.inimigosEscondidos;
  const droop = todos.find((f) => f.defId === 'droop');
  const guardas = todos.filter((f) => f !== droop);
  droop.side = 'neutro';
  // Os guardas rolam Furtividade uma vez, na chegada: é contra esses números
  // que a Percepção passiva do grupo conta na hora da surpresa.
  const furtividade = guardas.map((f) => d20(enc.rng, skillBonus(f, 'furtividade')).total);
  const estado = { explorando: false, encerrado: false, lutando: false, avisados: false, alarme: false };

  const herois = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead && c.hp > 0);
  const guardasVivos = () => guardas.filter((g) => !g.dead && enc.combatants.includes(g) && g.side === 'foes');

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

  // ------------------------------------------------------------- quem vê ----
  /** O guarda nota o herói: vê, e está a 30 pés — ou o herói é uma tocha andando. */
  const guardaNota = (g, c) => podeVer(enc, g, c) && (c.tochaAcesa || distanceFt(g.pos, c.pos) <= 30);

  async function depoisDeMover(c) {
    if (!estado.explorando) return;
    c.movementLeftFt = MOVIMENTO;
    const vivos = guardasVivos();
    if (!vivos.length) return;
    const visto = vivos.find((g) => herois().some((h) => podeVer(enc, h, g)));
    if (visto) {
      const quem = herois().find((h) => podeVer(enc, h, visto));
      await narrar(root, {
        formato: 'painel',
        paginas: [{
          texto: [
            visaoNoEscuro(quem) && !quem.tochaAcesa
              ? `No cinza da visão no escuro, ${quem.name} distingue uma silhueta pequena encostada na rocha: um goblin de guarda, que ainda não percebeu nada.`
              : `A luz alcança a curva do corredor e pega um goblin de guarda no meio de um bocejo.`,
            'Ninguém é surpreendido.',
          ],
        }],
        escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }],
      });
      combate(false);
      return;
    }
    const notou = vivos.find((g) => herois().some((h) => guardaNota(g, h)));
    if (notou) {
      const alvo = herois().find((h) => guardaNota(notou, h));
      await narrar(root, {
        formato: 'painel',
        paginas: [{
          texto: [
            alvo.tochaAcesa
              ? `Do fundo do escuro, uma voz aguda: "Fogo! Fogo vindo!" A tocha de ${alvo.name} entregou o grupo muito antes de alguém ver qualquer coisa.`
              : `Alguma coisa raspa na pedra, perto. ${alvo.name} não vê nada — mas alguma coisa no escuro vê ${alvo.name}.`,
          ],
        }],
        escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }],
      });
      combate(!estado.avisados);
    }
  }

  // ------------------------------------------------------------- combate ----
  function combate(comSurpresa) {
    estado.explorando = false;
    estado.lutando = true;
    root.classList.remove('explorando');
    enc.emboscada = comSurpresa ? { emboscadores: 'foes', furtividade } : null;
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
  }

  async function fimDoCombate(outcome) {
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      const v = await narrar(root, {
        formato: 'tela',
        paginas: [{ titulo: 'O escuro venceu', texto: ['O grupo caiu na caverna.'] }],
        escolhas: [
          { rotulo: 'Voltar ao menu', valor: 'menu' },
          { rotulo: 'Tentar de novo', valor: 'denovo', primaria: true },
        ],
      });
      if (v === 'denovo') app.newEncounter({ ...config });
      else app.encerrarPartida();
      return;
    }
    await narrar(root, {
      formato: 'painel',
      paginas: [{
        texto: [
          droop.dead
            ? 'A caverna fica quieta. Só a fogueira estala.'
            : 'A caverna fica quieta. No nicho do norte, Droop continua encolhido atrás da fogueira, de mãos para cima.',
          'Dá para descansar agora (botão direito num herói) e conversar com quem sobrou.',
        ],
      }],
    });
    prepararExploracao();
  }

  // ------------------------------------------------------------ conversa ----
  const droopArvore = {
    inicio: 'oi',
    nos: {
      oi: {
        narra: (ctx) => (ctx.flags.droopFalou ? null : 'O goblin se encolhe atrás da fogueira e levanta as duas mãos vazias, sujas de carvão.'),
        ao: (ctx) => { ctx.flags.droopFalou = true; },
        fala: 'Não bate, chefe! Droop não é guarda. Droop carrega lenha, Droop carrega balde. Vocês são chefe novo? Chefe novo?',
        opcoes: [
          { texto: 'Quem mais está nesta caverna?', vai: 'quem', uma: true },
          { texto: 'Fala tudo que você sabe, ou vira comida de lobo.', teste: { pericia: 'intimidacao', cd: 10 }, sucesso: 'conta', falha: 'grita',
            requer: (ctx) => (ctx.flags.droopContou ? 'ele já contou tudo' : null), oculta: true },
          { texto: 'Calma. Ninguém vai te machucar se você ajudar.', teste: { pericia: 'persuasao', cd: 12 }, sucesso: 'conta', falha: 'desconfia',
            requer: (ctx) => (ctx.flags.droopContou ? 'ele já contou tudo' : null), oculta: true },
          { texto: 'Estes túneis foram cavados à mão, e não por goblin. Quem cavou?', etiqueta: 'Anão', vai: 'tunel', uma: true,
            requer: (ctx) => (ctx.algum((c) => /an[ãa]o/i.test(`${c.raca ?? ''} ${c.ancestry ?? ''}`)) ? null : 'só um anão repara nisso'), oculta: true },
          { texto: 'Some daqui, Droop. E não volta.', fim: 'solto' },
          { texto: 'Atacar.', fim: 'luta' },
          { texto: 'Até mais.', fim: 'paz' },
        ],
      },
      quem: {
        fala: () => (guardasVivos().length
          ? ['Dois, chefe. Dois guardas, um em cada corredor, depois da curva. Eles veem no escuro. Vocês veem no escuro? Não, né.', 'Vocês trazem fogo, eles veem o fogo lá de longe. Lá de longe.']
          : ['Tinha dois guardas, chefe. Tinha. Agora Droop é o único. Droop é guarda agora? Droop é chefe agora?']),
        opcoes: [
          { texto: 'Mais uma coisa…', vai: 'oi' },
          { texto: 'Chega por agora.', fim: 'paz' },
        ],
      },
      conta: {
        ao: (ctx) => { ctx.flags.droopContou = true; estado.avisados = true; },
        fala: () => (guardasVivos().length
          ? ['Tá bom, tá bom! O da esquerda dorme encostado na parede, sempre dorme. O da direita tem arco e não dorme nunca.', 'Andem sem fogo, chefe, colados na rocha. Droop não contou nada. Droop nem estava aqui.']
          : ['Tá bom! O chefe grande mora mais pro fundo, depois do rio. Tem lobo. Tem muito lobo. Droop não gosta de lobo.']),
        opcoes: [
          { texto: 'Mais uma coisa…', vai: 'oi' },
          { texto: 'Bom goblin. Fica aí.', fim: 'paz' },
        ],
      },
      desconfia: {
        fala: 'Ajudar? Ajudar é o que o chefe grande diz antes de bater. Droop não sabe de nada. Nada, nada.',
        opcoes: [
          { texto: 'Você vai saber de alguma coisa quando eu terminar.', teste: { pericia: 'intimidacao', cd: 12 }, sucesso: 'conta', falha: 'grita' },
          { texto: 'Deixa pra lá.', vai: 'oi' },
        ],
      },
      grita: {
        narra: 'Droop arregala os olhos, enche o peito e berra para os corredores.',
        fala: 'INVASOR! INVASOR NA FOGUEIRA!',
        fim: 'alarme',
      },
      tunel: {
        fala: 'Mão de anão, chefe! Velho, velho. O chefe grande diz que tem coisa de anão lá no fundo, coisa que brilha. Ninguém acha. Droop procurou. Droop não achou.',
        opcoes: [
          { texto: 'Mais uma coisa…', vai: 'oi' },
          { texto: 'Chega por agora.', fim: 'paz' },
        ],
      },
    },
  };

  function depoisDaConversa(npc, fim) {
    if (npc !== droop) return;
    if (fim === 'solto') {
      enc.say('acao', 'Droop some por uma fenda na rocha que ninguém tinha visto. Tomara que não volte com amigos.');
      enc.combatants.splice(enc.combatants.indexOf(droop), 1);
      app.refresh();
    } else if (fim === 'luta' || fim === 'alarme') {
      if (fim === 'luta') droop.side = 'foes';
      // O alarme traz os guardas: correm para perto da fogueira, sem surpresa.
      if (fim === 'alarme') {
        for (const g of guardasVivos()) {
          const destino = enc.casaLivreMaisProxima({ x: g.pos.x < 9 ? 6 : 11, y: 2 }) ?? g.pos;
          g.pos = { ...g.pos, x: destino.x, y: destino.y };
        }
      }
      if (estado.explorando) combate(false);
    }
  }

  // ------------------------------------------------------- botão direito ----
  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    if (sup === 'parede') {
      ops.push({
        rotulo: 'Escutar a rocha', icone: 'acao-procurar', detalhe: 'Percepção, CD 12',
        fazer: async () => {
          const r = d20(enc.rng, skillBonus(c, 'percepcao'));
          const passou = r.total >= 12;
          const perto = guardasVivos().filter((g) => distanceFt(g.pos, c.pos) <= 40);
          await narrar(root, {
            formato: 'painel',
            paginas: [{
              teste: { quem: c.name, pericia: 'Percepção', total: r.total, cd: 12, passou },
              texto: [passou
                ? (perto.length
                  ? `${c.name} encosta o ouvido na pedra fria. Respiração, perto, depois da curva. Alguém pequeno, parado, esperando.`
                  : `${c.name} escuta: água pingando ao longe, e a fogueira estalando no norte. Ninguém perto.`)
                : `${c.name} só ouve o próprio coração e a água pingando.`],
            }],
          });
        },
      });
    }
    return ops;
  }

  function motivoSemDescanso(tipo) {
    if (!estado.explorando) return 'só fora da luta';
    if (tipo === 'longo' && guardasVivos().length) return 'com guardas vivos na caverna, ninguém dorme oito horas';
    return null;
  }

  return {
    lugar: 'Caverna escura',
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    depoisDeMover,
    fimDoCombate,
    dialogoDe: (npc) => (npc === droop ? droopArvore : null),
    depoisDaConversa,
    motivoSemDescanso,
    textoDoDescanso: (tipo) => (tipo === 'curto'
      ? ['Uma hora sentados na pedra úmida, de costas para a parede, revezando quem escuta o escuro.']
      : ['Oito horas no nicho da fogueira, com Droop roncando num canto e um de vocês sempre acordado.']),
    async iniciar() {
      for (const f of todos) enc.addCombatant(f);
      // O grupo da arena não traz pacote de aventureiro: tochas na entrada.
      for (const c of herois()) {
        if (!(c.bag ?? []).some((i) => i.id === 'tocha')) (c.bag ??= []).push({ id: 'tocha', tipo: 'item', qtd: 3 });
      }
      prepararExploracao();
      const semVisao = herois().filter((c) => !visaoNoEscuro(c)).map((c) => c.name);
      await narrar(root, {
        formato: 'painel',
        paginas: [{
          titulo: 'A caverna escura',
          texto: [
            'A luz do dia acaba três passos depois da entrada. Lá na frente, contornando um paredão de rocha, um brilho alaranjado e fraco: alguém mantém uma fogueira acesa.',
            semVisao.length
              ? `${semVisao.length > 1 ? `${semVisao.slice(0, -1).join(', ')} e ${semVisao.at(-1)}` : semVisao[0]} não ${semVisao.length > 1 ? 'enxergam' : 'enxerga'} nada no breu. Botão direito num herói acende a tocha — e a tocha também mostra o grupo a quem estiver no escuro.`
              : 'Todos aqui enxergam no escuro, em tons de cinza, até 60 pés.',
          ],
        }],
      });
      // A primeira checagem: alguém já vê ou é visto na entrada?
      depoisDeMover(app.selected ?? herois()[0]);
    },
  };
}
