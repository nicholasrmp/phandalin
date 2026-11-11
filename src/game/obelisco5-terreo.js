// O TÉRREO DO GIGANTE ADORMECIDO (o capítulo 5 do Obelisco, C4), como tabuleiro de exploração sobre o battlemap da
// Forgotten Adventures ("Rooftop Stash", com o salão revirado da FA aceso: `game/obelisco5-mapas.js`).
//
// O QUE É DO LIVRO (as regras; o texto é nosso): o balcão quebrado com o risco "Zorz isteve aki" embaixo (a pista do
// pedaço do nome, sem teste); o cofre da casa arrombado e vazio; a cozinha revirada, onde Percepção CD 15 acha uma
// trilha de moedas (5 pp e 7 pc) até a lareira, por onde os goblins fugiram; o Wheel-of-Fortune, que esconde que as
// bebidas saíam "erradas" (Intuição CD 12: a pista do propósito); a dona, que correu atrás deles de vassoura. Subir
// pela chaminé leva ao telhado (`obelisco5-lutas.js`).
//
// A DONA É A GRESKA, uma orc. O capítulo 5 do livro a chama de Grista, uma anã, mas o capítulo 2 do mesmo livro deu o
// Gigante Adormecido a uma orc chamada Greska, e é ela que o jogo tem desde então: o livro se contradiz, e aqui fica a
// mesma pessoa.

import { narrar } from '../view/narrativa.js';
import { makeMonster } from '../rules/monsters.js';
import { rolarPericia, skillBonus, SKILL_NAME } from '../rules/abilities.js';
import { distanceFt } from '../core/grid.js';
import { guardar } from './comercio.js';
import { deNoite } from './relogio.js';
import { definirEscuridao } from '../rules/luz.js';
import { PONTOS_CAP5_VILA } from './obelisco5-mapas.js';
import { PISTAS_DO_CAP5 } from './obelisco5-vila.js';

const P = PONTOS_CAP5_VILA.GIGANTE_TERREO;
const em = (lista, t) => [].concat(lista).some((q) => q.x === t.x && q.y === t.y);

export function criarGiganteTerreo(app) {
  const enc = app.enc;
  const root = app.root;
  const camp = (app.campanha ??= {});
  const o5 = (camp.obelisco5 ??= { iniciado: true, cenas: {}, pistas: [], feito: {} });
  const vila = (camp.vila ??= { pistas: [] });
  o5.lutas ??= {};
  const estado = { explorando: false, encerrado: false };
  const herois = () => enc.combatants.filter((c) => c.side === 'party');
  const painel = (texto) => narrar(root, { formato: 'painel', paginas: [{ titulo: 'O Gigante Adormecido', texto: [].concat(texto) }] });
  const ganharPista = (id) => {
    if (o5.pistas.includes(id)) return;
    o5.pistas.push(id);
    if (!(vila.pistas ??= []).includes(PISTAS_DO_CAP5[id])) vila.pistas.push(PISTAS_DO_CAP5[id]);
    enc.say('acao', `Pista: ${PISTAS_DO_CAP5[id]}`);
  };

  // A dona e o atendente, no salão. Não lutam: são gente da vila.
  const greska = makeMonster('plebeu', { ...P.greska });
  Object.assign(greska, { name: 'Greska', side: 'neutro', facingVec: { dx: -1, dy: 0 } });
  const wheel = makeMonster('plebeu', { ...P.wheel });
  Object.assign(wheel, { name: 'Wheel-of-Fortune', side: 'neutro', facingVec: { dx: -1, dy: 0 } });

  // O TELHADO DE QUEM ENTRA SOME (como o do Foundry): o galpão e as duas casas vizinhas nascem cobertos, e o que há
  // dentro (a cama, a bancada, o cocho) só se vê com alguém lá dentro. `P.telhados` vem do alfa da arte do telhado.
  function atualizarTelhados() {
    for (const [id, casas] of Object.entries(P.telhados ?? {})) {
      const dentro = herois().some((h) => !h.dead && em(casas, h.pos));
      const peca = enc.field.sobreposicoes?.find((o) => o.id === id);
      if (peca && peca.ligada === dentro) enc.field.alternarSobreposicao(id, !dentro);
    }
  }

  function prepararExploracao() {
    enc.over = false;
    enc.outcome = null;
    enc.side = 'party';
    enc.round = 1;
    for (const c of enc.combatants) {
      c.movementLeftFt = c.side === 'party' ? 60 : 0;
      c.actionUsed = true;
      c.bonusUsed = true;
      c.reactionUsed = true;
      c.acted = false;
    }
    estado.explorando = true;
    root.classList.add('explorando');
    if (!herois().includes(app.selected)) app.select(herois()[0]);
    app.refresh();
  }

  const arvoreWheel = () => ({
      inicio: 'oi',
      nos: {
        oi: {
          narra: 'Um tiferino alto, de pele roxa, varre cacos atrás do que sobrou do balcão. Serve uma caneca e quase a bate na madeira, por hábito, antes de lembrar que a pedra não está mais lá.',
          fala: 'Por conta da casa. Não vi nada, eu dormia lá em cima; falem com a Greska, ela correu atrás deles de vassoura.',
          opcoes: [
            { texto: '(Observar o jeito dele.)', teste: { pericia: 'intuicao', cd: 12 }, sucesso: 'maldito', falha: 'nada', uma: true },
            { texto: 'Obrigado.', fim: 'sai' },
          ],
        },
        maldito: {
          fala: 'Está bem, está bem. Toda bebida que eu servia saía errada: a cerveja dava dor de cabeça, o hidromel brilhava como óleo. Eu batia na pedra a cada dose, para dar sorte. Achei que a maldição era minha.',
          ao: () => ganharPista('proposito'),
          opcoes: [{ texto: 'Não era sua.', fim: 'sai' }],
        },
        nada: { fala: 'É só isso. — Ele limpa a caneca limpa.', opcoes: [{ texto: 'Certo.', fim: 'sai' }] },
      },
  });

  const arvoreGreska = () => ({
      inicio: 'oi',
      nos: {
        oi: {
          narra: 'A dona, uma orc de cara amarrada, ainda segura a vassoura com que expulsou os invasores.',
          fala: 'Acordei com madeira quebrando. Cinco coisinhas destruindo o meu balcão. Pensei que fossem crianças, até ver as orelhas, os dentes e as armas. Corri atrás delas com isto aqui, e várias subiram pela chaminé. Comida quase não levaram: queriam o balcão. Aquela pedra preta não tinha nada de especial.',
          opcoes: [{ texto: 'Obrigado, Greska.', fim: 'sai' }],
        },
      },
  });

  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    const longe = (pes) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
    if (em(P.balcao, tile)) {
      ops.push({
        rotulo: 'Examinar o balcão', icone: 'acao-procurar', motivo: longe(5),
        fazer: async () => {
          await painel(['O balcão está em lascas, e o cofre da casa, embaixo dele, foi arrombado e esvaziado. Num pedaço que ficou de pé, alguém riscou com ponta de faca, em letras tortas e com a grafia de quem mal sabe escrever: "Zorz isteve aki".']);
          ganharPista('nome');
          app.refresh();
        },
      });
    }
    if (em(P.cozinha, tile) && !o5.feito.chamineVista) {
      ops.push({
        rotulo: 'Procurar na cozinha', icone: 'acao-procurar', detalhe: 'Percepção CD 15', motivo: longe(5),
        fazer: async () => {
          const r = rolarPericia(enc.rng, c, 'percepcao');
          if (r.total >= 15) {
            o5.feito.chamineVista = true;
            guardar(c, 'moedaDePrata', 5);
            guardar(c, 'moedaDeCobre', 7);
            await painel([`${c.name} (${SKILL_NAME.percepcao} ${r.total}) acha, entre barris virados, uma trilha de moedas: 5 pp e 7 pc, caídas uma atrás da outra até a lareira do salão. Fugiram pela chaminé.`]);
          } else {
            await painel([`${c.name} (${SKILL_NAME.percepcao} ${r.total}) só acha barris revirados e farinha no chão.`]);
          }
          app.refresh();
        },
      });
    }
    if (tile.x === P.lareira.x && tile.y === P.lareira.y && !o5.lutas.telhado) {
      ops.push({
        rotulo: 'Subir pela chaminé', icone: 'acao-disparada', detalhe: 'o telhado', motivo: longe(5),
        fazer: async () => {
          if (!o5.feito.chamineVista) await painel('Telhas rangem lá em cima, e uma risada fina desce pela chaminé. Alguém voltou.');
          estado.encerrado = true;
          root.classList.remove('explorando');
          app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'telhadoGigante', continuarCom: herois() });
        },
      });
    }
    if (em(P.saida, tile)) {
      ops.push({
        rotulo: 'Voltar à vila', icone: 'acao-disparada', motivo: longe(5),
        fazer: () => {
          estado.encerrado = true;
          root.classList.remove('explorando');
          app.irParaVila(herois().filter((h) => !h.dead));
        },
      });
    }
    return ops;
  }

  return {
    lugar: 'O Gigante Adormecido',
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    // A conversa com os dois sai pelo "Conversar" de sempre do botão direito (`app.conversar`).
    dialogoDe: (npc) => (npc === wheel ? arvoreWheel() : npc === greska ? arvoreGreska() : null),
    depoisDeMover(c) { if (c) c.movementLeftFt = 60; atualizarTelhados(); app.refresh?.(); },
    async fimDoCombate() {},
    evento() {},
    npcs: { greska, wheel },
    atualizarTelhados,
    async iniciar() {
      if (deNoite(vila.tempo ?? 0)) definirEscuridao(enc.field, 0.8);
      for (const n of [greska, wheel]) enc.addCombatant(n);
      await painel(['O salão do Gigante Adormecido parece ter sido atravessado por uma briga de taverna sem ninguém para brigar: mesas viradas, cadeiras quebradas, cacos por todo lado. A Greska e o atendente, um tiferino roxo, tentam pôr ordem.',
        'Examinem o balcão, a cozinha e a lareira, e falem com os dois (botão direito). Pela borda do mapa, volta-se à rua.']);
      prepararExploracao();
      atualizarTelhados();
    },
  };
}
