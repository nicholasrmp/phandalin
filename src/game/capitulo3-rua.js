// A briga de rua com os Marcarrubra (Phandalin, Parte 2 da aventura).
//
// Quatro bandidos, ninguém surpreso — a briga estava na cara. Caídos três, o
// último foge para a Mansão Tresendar. Quem for pego vivo (golpe não letal)
// conta o que os Marcarrubra sabem. Vencida, a luta vale 400 XP divididos
// pelo grupo, e o grupo volta para a vila. Perdida, o livro não diz: os
// bandidos limpam os bolsos de todo mundo e deixam o recado na lama.
//
// Mesma interface de cena dos outros capítulos (`main.js`).

import { narrar } from '../view/narrativa.js';
import { distanceFt, Battlefield } from '../core/grid.js';

const SAIDA = { x: 21, y: 5 };      // para o leste, rumo à Mansão Tresendar

export function criarRuaMarcarrubra(app, config) {
  const enc = app.enc;
  const root = app.root;
  const bandidos = app.inimigosEscondidos;
  const estado = { encerrado: false, fugiu: false };

  function evento(ev) {
    if ((ev.type !== 'died' && ev.type !== 'downed') || !bandidos.includes(ev.target)) return;
    const caidos = bandidos.filter((f) => f.dead || f.hp <= 0).length;
    const resta = bandidos.filter((f) => !f.dead && f.hp > 0 && !f.fugiu);
    if (caidos >= 3 && resta.length === 1 && !resta[0].fugindo) {
      resta[0].fugindo = true;
      enc.say('acao', `${resta[0].name} vê os outros no chão e corre rua acima, para o leste — rumo à Mansão Tresendar.`);
    }
  }

  enc.antesDoTurno = (m) => {
    if (!m.fugindo || m.dead) return false;
    if (distanceFt(m.pos, SAIDA) <= 5 || m.pos.x >= 21) {
      m.fugiu = true;
      estado.fugiu = true;
      enc.combatants.splice(enc.combatants.indexOf(m), 1);
      enc.say('acao', `${m.name} some entre as casas, correndo para a mansão em ruínas.`);
      enc.checkEnd();
      app.refresh();
      return true;
    }
    const alcance = enc.reachableFor(m);
    let melhor = null;
    for (const n of alcance.values()) {
      if (enc.occupied(n.x, n.y, m)) continue;
      const d = distanceFt(n, SAIDA);
      if (!melhor || d < melhor.d) melhor = { n, d };
    }
    if (melhor && melhor.n.cost > 0) enc.moveAlong(m, Battlefield.pathFrom(alcance, melhor.n));
    return true;
  };

  /** O que os Marcarrubra sabem, pela boca de um capturado. */
  function interrogar(preso) {
    return app.conversarCom(preso, {
      inicio: 'oi',
      nos: {
        oi: {
          narra: `${preso.name} acorda com as mãos amarradas e o manto vermelho embolado no pescoço.`,
          fala: 'Vocês não sabem com quem estão mexendo.',
          opcoes: [
            { texto: 'Sabemos, e vamos saber mais. Fala.', teste: { pericia: 'intimidacao', cd: 10 }, sucesso: 'conta', falha: 'cala' },
            { texto: 'Conta tudo e talvez o chefe da vila te solte inteiro.', teste: { pericia: 'persuasao', cd: 10 }, sucesso: 'conta', falha: 'cala' },
            { texto: 'Entregar ao chefe da vila.', fim: 'preso' },
          ],
        },
        cala: { fala: 'Vão se danar.', opcoes: [{ texto: 'Tentar de novo.', vai: 'oi', uma: true }, { texto: 'Entregar ao chefe da vila.', fim: 'preso' }] },
        conta: {
          ao: (ctx) => { ctx.flags.sabeDoCajavidro = true; },
          fala: [
            '…Tá bom, tá bom! Lá embaixo da mansão tem gente presa, perto dos túmulos velhos. Quem vigia são uns esqueletos. Eu não chego perto daquilo, juro.',
            'O chefe? A gente chama de Cajavidro, por causa do cajado — é de vidro, e brilha. É mago. Fica na ala oeste, lá embaixo. Nome de verdade, ninguém sabe.',
            'E tem… uma coisa. Na parte mais funda, numa fenda. Um olho só, do tamanho de um escudo. Fala dentro da cabeça da gente. Eu desço o mínimo possível.',
            'Ele recebe ordem de alguém. Um tal de Aranha Negra, que quer a vila de cabeça baixa e aventureiro bem longe. Mandou até uns bugbears para ajudar.',
          ],
          opcoes: [{ texto: 'Entregar ao chefe da vila.', fim: 'preso' }],
        },
      },
    });
  }

  async function fimDoCombate(outcome) {
    if (estado.encerrado) return;
    estado.encerrado = true;
    const grupo = enc.combatants.filter((c) => c.side === 'party');
    const vila = app.campanha?.vila;
    if (outcome !== 'vitoria') {
      // Ninguém de pé: acabou a aventura.
      if (!grupo.some((x) => !x.dead)) { app.encerrarPartida(); return; }
      // A gangue não caiu: volta a procurar o grupo num outro dia.
      if (vila) { vila.feito.ruaMarcarrubra = false; vila.revancheNoDia = vila.dia + 1; }
      for (const c of grupo.filter((x) => !x.dead)) {
        c.hp = Math.max(1, c.hp);
        c.conditions = [];
        c.bag = (c.bag ?? []).filter((i) => !/^moeda/.test(i.id));
      }
      await narrar(root, { formato: 'tela', paginas: [{ titulo: 'Na lama', texto: [
        'Vocês acordam na rua, doloridos e com os bolsos vazios. Alguém riscou na lama, com a ponta de uma espada: "PRÓXIMA VEZ, SEM ACORDAR".'] }] });
    } else {
      const preso = enc.combatants.find((f) => f.side === 'foes' && f.capturado && !f.dead);
      if (preso) {
        await interrogar(preso);
        if (vila) (vila.pistas ??= []).push('O Marcarrubra capturado falou: há presos perto das criptas, sob guarda de esqueletos; uma criatura de um olho só vive numa fenda funda; o chefe, Cajavidro, é um mago de cajado de vidro na ala oeste; e quem dá as ordens é o Aranha Negra.');
      }
      await narrar(root, { formato: 'painel', paginas: [{ texto: [
        estado.fugiu ? 'O último correu para a Mansão Tresendar. Agora eles sabem que vocês existem.' : 'A rua fica quieta. Algumas janelas se abrem, devagar.',
        'O chefe da vila não vai gostar — mas a vila, sim.',
      ] }] });
      // O que a vila precisa saber da briga: quem ficou preso (vai para o
      // chefe da vila) e quantos morreram (o chefe reclama, a estalagem brinda).
      if (vila) {
        vila.feito.ruaVencida = true;
        vila.presos = bandidos.filter((f) => f.capturado && !f.dead && !f.fugiu).length;
        vila.mortosNaRua = bandidos.filter((f) => f.dead).length;
        if (estado.fugiu) (vila.pistas ??= []).push('O último Marcarrubra da rua fugiu para a Mansão Tresendar: o covil já sabe de vocês.');
      }
      app.xpPendente = { xp: 400, motivo: 'Os Marcarrubra da rua' };
    }
    app.irParaVila(grupo);
  }

  return {
    lugar: 'Rua de Phandalin',
    get explorando() { return false; },
    get encerrado() { return estado.encerrado; },
    interacoes: () => [],
    depoisDeMover() {},
    fimDoCombate,
    evento,
    async iniciar() {
      for (const f of bandidos) enc.addCombatant(f);
      enc.emboscada = null;          // ninguém surpreso: a briga estava na cara
      app.selected = null;
      enc.start();
      if (enc.side === 'party') app.select(app.firstActive());
      app.refresh();
    },
  };
}
