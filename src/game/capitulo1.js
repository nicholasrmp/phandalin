// Capítulo 1 da campanha: de Neverwinter até a emboscada na Trilha de Triboar.
//
//   abertura    Neverwinter: Gundren Rockseeker contrata o grupo para levar a
//               carroça a Phandalin; ele vai na frente com Sildar Hallwinter.
//               Cada herói escolhido ganha a sua linha (o "porquê" da
//               história dele), então a abertura muda com o grupo.
//   exploração  o grupo anda livre pela estrada, sem iniciativa. Depois da
//               curva, a quinze metros, os cavalos mortos. Quatro goblins,
//               dois de cada lado, esperam alguém chegar aos cavalos e atacam
//               (ou quando esbarram em alguém, ou se o grupo passa reto).
//   combate     uma rolagem de Furtividade para os quatro contra a Percepção
//               passiva de cada herói decide quem fica surpreso; o grupo não
//               tem como surpreendê-los. Dois correm para o corpo a corpo, dois
//               ficam a 9 m atirando. Caídos três, o último foge pela trilha.
//   depois      os cavalos (se ninguém os examinou), os rastros (Sobrevivência
//               CD 10), o goblin capturado vivo para interrogar — que pode
//               guiar o grupo desviando das armadilhas — e a escolha: a trilha
//               ou Phandalin. Derrotado, o grupo acorda roubado e sem a
//               carroça, e a história segue.
//
// Conferido com a aventura: as regras e os números são os do livro.
//
// TEXTO NOSSO. Gundren, Sildar, Neverwinter, Phandalin e a Trilha de Triboar
// são nomes do cenário e entram pela Fan Content Policy; a trama segue a
// estrutura do começo de A Mina Perdida de Phandelver, mas nenhuma frase é do
// livro, nem parafraseada dele.
//
// Este arquivo é a CENA; o tabuleiro e o combate continuam sendo do motor. A
// cena conversa com o jogo por `app` (ver `main.js`): o encontro, o
// tabuleiro, o HUD e os ganchos de seleção e de menu.

import { narrar } from '../view/narrativa.js';
import { descansoCurto } from '../view/descanso-tela.js';
import { heroiPorId } from './herois.js';
import { d20 } from '../core/dice.js';
import { skillBonus, SKILL_NAME } from '../rules/abilities.js';
import { distanceFt, Battlefield } from '../core/grid.js';

const MOVIMENTO = 60;   // quanto cada herói anda por clique na exploração (pés)
const CD = 10;

/** O melhor teste entre algumas perícias, de um herói. */
function testar(enc, c, pericias) {
  const melhor = pericias.reduce((a, b) => (skillBonus(c, b) > skillBonus(c, a) ? b : a));
  const r = d20(enc.rng, skillBonus(c, melhor));
  return { quem: c.name, pericia: SKILL_NAME[melhor], total: r.total, cd: CD, passou: r.total >= CD };
}

const vivos = (enc) => enc.allOf('party').filter((c) => !c.dead && c.hp > 0);

export function criarCapitulo1(app, config) {
  const enc = app.enc;
  const root = app.root;
  // Os goblins ficam fora do tabuleiro até a armadilha disparar.
  const escondidos = app.inimigosEscondidos;
  // Como na aventura: UMA rolagem de Furtividade para os quatro goblins.
  const rolagemDeGrupo = d20(enc.rng, skillBonus(escondidos[0], 'furtividade')).total;
  const furtividade = escondidos.map(() => rolagemDeGrupo);
  const cavalos = [];
  for (let y = 0; y < enc.field.h; y++) {
    for (let x = 0; x < enc.field.w; x++) if (enc.field.surfaceAt(x, y) === 'cavalo') cavalos.push({ x, y });
  }
  const estado = { explorando: false, examinou: false, encerrado: false };

  // ------------------------------------------------------------ abertura ----
  function abertura() {
    const herois = enc.allOf('party');
    return narrar(root, {
      formato: 'tela',
      pular: true,
      paginas: [
        {
          titulo: 'Neverwinter',
          texto: [
            'A taverna perto das docas cheira a peixe frito e a chuva que não passa. Num canto, um anão de barba ruiva e nariz queimado de sol espalha papéis pela mesa e paga rodadas para quem senta perto. Chama-se Gundren Rockseeker, e tem pressa.',
            'Ele precisa de gente para levar uma carroça de suprimentos até a Barthen Provisões, um posto de troca em Phandalin — vila sem lei a dois dias de viagem a sudeste. Gundren vai na frente, a cavalo, com o guerreiro Sildar Hallwinter, porque tem "negócios" a acertar antes. Paga dez peças de ouro a cada um, na entrega.',
            'Entre um gole e outro, deixa escapar que ele e os irmãos acharam algo grande nas colinas. Quando alguém pergunta o quê, ele muda de assunto rápido demais.',
          ],
        },
        {
          titulo: 'Quem aceitou, e por quê',
          texto: herois.map((c) => ({ nome: `${c.name}.`, texto: heroiPorId(c.id)?.motivo ?? '' })),
        },
        {
          titulo: 'A Trilha de Triboar',
          texto: [
            'Dias de Estrada Alta para o sul, e então a curva para o leste, na Trilha de Triboar. Dois bois puxam a carroça; se ninguém segura as rédeas, eles param onde estão.',
            'Até aqui, nenhum problema. Mas a trilha tem fama de bandido e salteador, e já faz meio dia que vocês não cruzam com ninguém.',
          ],
        },
      ],
    });
  }

  // ---------------------------------------------------------- exploração ----
  function prepararExploracao() {
    enc.side = 'party';
    enc.round = 1;
    for (const c of enc.allOf('party')) {
      c.movementLeftFt = MOVIMENTO;
      c.actionUsed = true;
      c.bonusUsed = true;
      c.reactionUsed = true;
      c.acted = false;
    }
    estado.explorando = true;
    root.classList.add('explorando');
    app.select(enc.allOf('party')[0]);
    app.refresh();
  }

  async function chegada() {
    await narrar(root, {
      formato: 'painel',
      paginas: [{
        texto: [
          'Depois de uma curva, a uns quinze metros, dois cavalos mortos atravessados na estrada, cheios de flechas de penas pretas. A mata aperta aqui: um barranco alto e mato fechado dos dois lados.',
          'Explorem a estrada: cliquem num herói e depois no chão para andar. Cheguem perto dos cavalos para examiná-los. (Para pegar alguém vivo, botão direito no herói: golpes não letais.)',
        ],
      }],
    });
  }

  /**
   * Depois de cada passo na exploração: a armadilha dispara?
   *
   * Como na aventura, os goblins esperam alguém chegar aos cavalos e então
   * atacam; a surpresa é a rolagem única de Furtividade deles contra a
   * Percepção passiva de cada herói (o motor decide quem fica surpreso). O
   * grupo não tem como surpreendê-los. Esbarrar num goblin, ou passar reto
   * pelos cavalos, também dispara.
   */
  async function depoisDeMover(c) {
    if (!estado.explorando) return;
    c.movementLeftFt = MOVIMENTO;
    const pertoDoCavalo = cavalos.some((t) => distanceFt(c.pos, t) <= 5);
    const goblin = escondidos.find((f) => distanceFt(c.pos, f.pos) <= 10);
    if (pertoDoCavalo) {
      estado.explorando = false;
      estado.examinou = true;
      await narrar(root, {
        formato: 'painel',
        paginas: [{
          texto: [
            `${c.name} se agacha ao lado dos cavalos. São os de Gundren e de Sildar, mortos há coisa de um dia pelas flechas. Os alforjes foram esvaziados, e ao lado há um tubo de guardar mapa, vazio.`,
            'Um assobio corta o ar. Dos dois lados da estrada, o mato se levanta.',
          ],
        }],
        escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }],
      });
      combate(true);
    } else if (goblin || c.pos.x >= 21) {   // 21: passou reto pelos cavalos (x 18 a 20)
      estado.explorando = false;
      await narrar(root, {
        formato: 'painel',
        paginas: [{
          texto: [
            goblin
              ? `Uma moita se mexe ao lado de ${c.name}. É um goblin, de arco na mão, e ele não está sozinho.`
              : `${c.name} passa pelos cavalos sem parar. Dos dois lados da estrada, o mato se levanta: goblins.`,
          ],
        }],
        escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }],
      });
      combate(true);
    }
  }

  // --------------------------------------------------- o último foge ----
  // Na aventura, caídos três goblins, o último foge pela trilha do norte — e
  // é a trilha dele que leva ao esconderijo.
  const SAIDA = { x: 19, y: 0 };
  function evento(ev) {
    if ((ev.type !== 'died' && ev.type !== 'downed') || !escondidos.includes(ev.target)) return;
    const caidos = escondidos.filter((f) => f.dead || f.hp <= 0).length;
    const ultimo = escondidos.filter((f) => !f.dead && f.hp > 0 && !f.fugiu);
    if (caidos >= 3 && ultimo.length === 1 && !ultimo[0].fugindo) {
      ultimo[0].fugindo = true;
      enc.say('acao', `${ultimo[0].name} vê os outros caírem, larga tudo e corre para a trilha do norte.`);
    }
  }
  enc.antesDoTurno = (m) => {
    if (!m.fugindo || m.dead) return false;
    if (distanceFt(m.pos, SAIDA) <= 5 || m.pos.y <= 0) {
      m.fugiu = true;
      enc.combatants.splice(enc.combatants.indexOf(m), 1);
      enc.say('acao', `${m.name} some na trilha do norte. Ela leva a algum lugar.`);
      estado.goblinFugiu = true;
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

  // ------------------------------------------------------------- combate ----
  function combate(comSurpresa) {
    estado.explorando = false;
    root.classList.remove('explorando');
    for (const f of escondidos) {
      if (enc.occupied(f.pos.x, f.pos.y)) f.pos = enc.casaLivreMaisProxima(f.pos) ?? f.pos;
      enc.addCombatant(f);
    }
    // A surpresa usa os MESMOS testes de Furtividade da chegada: se ninguém
    // os viu lá, ninguém os vê agora.
    enc.emboscada = comSurpresa ? { emboscadores: 'foes', furtividade } : null;
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
  }

  // -------------------------------------------------------------- depois ----
  /**
   * Derrota, como na aventura: o grupo não morre (quem não morreu de fato),
   * acorda horas depois roubado e sem a carroça — e a história segue.
   */
  async function derrota() {
    const vivosDeFato = enc.combatants.filter((c) => c.side === 'party' && !c.dead);
    if (!vivosDeFato.length) {
      const v = await narrar(root, {
        formato: 'tela',
        paginas: [{ titulo: 'A estrada ficou quieta de novo', texto: ['Ninguém do grupo sobreviveu à Trilha de Triboar.'] }],
        escolhas: [
          { rotulo: 'Voltar ao menu', valor: 'menu' },
          { rotulo: 'Tentar a estrada de novo', valor: 'denovo', primaria: true },
        ],
      });
      if (v === 'denovo') app.newEncounter({ ...config, pularAbertura: true });
      else app.encerrarPartida();
      return null;
    }
    for (const c of vivosDeFato) {
      c.hp = Math.max(1, c.hp);
      c.conditions = [];
      c.stable = false;
      c.deathSaves = { successes: 0, failures: 0 };
      // Roubados: as moedas e o que dava para vender.
      c.bag = (c.bag ?? []).filter((i) => !/^moeda|pocao/.test(i.id));
    }
    await narrar(root, {
      formato: 'tela',
      paginas: [{
        titulo: 'Acordar na estrada',
        texto: [
          'Vocês acordam com o sol já baixo, doloridos, no meio da estrada. As bolsas foram reviradas: nenhuma moeda, nenhuma poção. A carroça, os bois e toda a carga de Gundren sumiram.',
          'Os goblins não se deram ao trabalho de esconder o caminho por onde levaram tudo.',
        ],
      }],
    });
    return vivosDeFato;
  }

  /**
   * Interrogar o goblin capturado: o que a aventura diz que os goblins sabem.
   * O livro não dá a CD da persuasão; usamos 10 (a de um goblin amarrado e
   * com medo).
   */
  async function interrogar(goblin) {
    const arvore = {
      inicio: 'oi',
      nos: {
        oi: {
          narra: `${goblin.name} acorda amarrado, olha para vocês e começa a tremer.`,
          fala: 'Não mata! Não mata! Goblin só fazia o que mandaram!',
          opcoes: [
            { texto: 'Fala o que sabe e talvez saia vivo.', teste: { pericia: 'intimidacao', cd: 10 }, sucesso: 'conta', falha: 'cala' },
            { texto: 'Ninguém vai te machucar se você ajudar.', teste: { pericia: 'persuasao', cd: 10 }, sucesso: 'conta', falha: 'cala' },
            { texto: 'Deixar ele amarrado e seguir.', fim: 'larga' },
          ],
        },
        cala: {
          fala: 'Goblin não sabe nada! Nada!',
          opcoes: [
            { texto: 'Tentar de novo.', vai: 'oi', uma: true },
            { texto: 'Deixar ele amarrado e seguir.', fim: 'larga' },
          ],
        },
        conta: {
          ao: (ctx) => { ctx.flags.sabeDoEsconderijo = true; ctx.flags.sabeDoCastelo = true; },
          fala: [
            'Tá bom, tá bom! O esconderijo é perto, pela trilha. Menos de vinte goblins lá. O chefe é Klarg, um bugbear grandão. Klarg obedece ao Rei Grol, do Castelo Dentefino — longe, no noroeste, na Floresta de Neverwinter.',
            'Uns dias atrás veio recado do Rei Grol: alguém chamado Aranha Negra paga para pegar o anão, Gundren, e mandar ele e as coisas dele para o castelo. Klarg fez. O anão e o mapa já foram para o Rei Grol. O humano que andava com ele ficou no esconderijo, na caverna de comer.',
          ],
          opcoes: [
            { texto: 'Leva a gente até o esconderijo, desviando das armadilhas.', fim: 'guia' },
            { texto: 'Deixar ele amarrado e seguir.', fim: 'larga' },
          ],
        },
      },
    };
    return app.conversarCom(goblin, arvore);
  }

  async function fimDoCombate(outcome) {
    if (estado.encerrado) return;
    estado.encerrado = true;
    let grupo;
    if (outcome !== 'vitoria') {
      grupo = await derrota();
      if (!grupo) return;
    } else {
      grupo = enc.combatants.filter((c) => c.side === 'party' && !c.dead);
    }

    const paginas = [];
    if (outcome === 'vitoria' && !estado.examinou) {
      paginas.push({ titulo: 'Depois da luta', texto: [
        'Os cavalos no meio da estrada são os de Gundren e de Sildar, mortos há um dia pelas flechas. Os alforjes foram esvaziados; ao lado, um tubo de guardar mapa, vazio.',
      ] });
    }

    // A trilha: quem procura acha o lugar usado para emboscadas há tempo, e a
    // trilha ao norte, para noroeste. Sobrevivência CD 10 lê os rastros.
    const rastreador = vivos(enc).sort((a, b) => skillBonus(b, 'sobrevivencia') - skillBonus(a, 'sobrevivencia'))[0] ?? grupo[0];
    if (rastreador) {
      const t = estado.rastros ? null : testar(enc, rastreador, ['sobrevivencia']);
      const leu = estado.rastros || t.passou;
      paginas.push({
        titulo: 'A trilha dos goblins',
        teste: t ?? undefined,
        texto: [
          'Marcas de fogueira apagada, ossos roídos, mato pisado: este lugar é usado para emboscadas há algum tempo. Uma trilha sai do mato ao norte e vira para noroeste.',
          leu
            ? `${rastreador.name} lê o chão: uma dúzia de goblins, mais ou menos, passou por aqui indo e voltando — e dois corpos do tamanho de gente foram arrastados por esta trilha.`
            : 'Muitas pegadas pequenas, misturadas demais para contar.',
          estado.goblinFugiu ? 'O goblin que fugiu foi por ali.' : null,
        ].filter(Boolean),
      });
    }

    // Goblin capturado vivo: dá para interrogar.
    const capturado = enc.combatants.find((f) => f.side === 'foes' && f.capturado && !f.dead);
    let guia = false;
    if (capturado && outcome === 'vitoria') {
      await narrar(root, { formato: 'tela', paginas });
      paginas.length = 0;
      const fim = await interrogar(capturado);
      guia = fim === 'guia';
    }

    // Descanso antes de decidir.
    if (grupo.some((c) => c.hp < c.maxHp)) {
      const pausa = await narrar(root, {
        formato: 'tela',
        paginas: paginas.length ? [...paginas] : [{ titulo: 'Antes de seguir', texto: ['O grupo está ferido.'] }],
        escolhas: [
          { rotulo: 'Seguir sem descansar', valor: 'nao' },
          { rotulo: 'Descansar uma hora antes', valor: 'sim', primaria: true },
        ],
      });
      paginas.length = 0;
      if (pausa === 'sim') {
        const linhas = await descansoCurto(root, {
          herois: grupo,
          rng: enc.rng,
          texto: [outcome === 'vitoria'
            ? 'Vocês arrastam os goblins para fora da estrada, sentam na sombra da carroça e cuidam dos cortes.'
            : 'Vocês se arrastam para a sombra, à beira da estrada, e cuidam dos cortes.'],
        });
        for (const t of linhas) enc.say('cura', t);
        app.refresh?.();
      }
    }

    const caminho = await narrar(root, {
      formato: 'tela',
      paginas: [...paginas, {
        titulo: 'Para onde?',
        texto: [
          guia ? 'O goblin amarrado aponta a trilha com o queixo: ele mostra o caminho.' : 'A trilha dos goblins segue para noroeste.',
          outcome === 'vitoria' ? 'A estrada segue para Phandalin, a meio dia de viagem.' : 'A estrada segue para Phandalin, a meio dia de viagem — sem a carroça.',
        ],
      }],
      escolhas: [
        { rotulo: outcome === 'vitoria' ? 'Levar a carroça a Phandalin' : 'Ir a Phandalin', valor: 'phandalin' },
        { rotulo: 'Seguir a trilha dos goblins', valor: 'trilha', primaria: true },
      ],
    });
    app.campanha = {
      ...(app.campanha ?? {}),
      capitulo1: { caminho, carroca: outcome === 'vitoria', guia, goblinFugiu: Boolean(estado.goblinFugiu) },
    };

    // A trilha leva ao capítulo 2, com os mesmos heróis e o que eles carregam.
    if (caminho === 'trilha') {
      await narrar(root, {
        formato: 'tela',
        paginas: [{
          titulo: 'Fim do primeiro capítulo',
          texto: [outcome === 'vitoria'
            ? 'Vocês escondem a carroça perto dali, amarram os bois e entram na mata atrás dos rastros. Seja quem for que levou Gundren, mora no fim desta trilha.'
            : 'Sem carroça e sem moedas, mas com a trilha à frente, vocês entram na mata. Seja quem for que levou Gundren — e a carga dele —, mora no fim desta trilha.'],
        }],
        escolhas: [{ rotulo: 'Seguir a trilha', valor: 'seguir', primaria: true }],
      });
      const grupoTodo = enc.combatants.filter((c) => c.side === 'party');
      app.newEncounter({ ...config, capitulo: 2, pularAbertura: false, continuarCom: grupoTodo });
      return;
    }

    await narrar(root, {
      formato: 'tela',
      paginas: [{
        titulo: 'Fim do primeiro capítulo',
        texto: [
          outcome === 'vitoria'
            ? 'Vocês põem a carroça de volta na estrada. Em Phandalin, Elmar Barthen espera a carga — e vai querer saber de Gundren.'
            : 'Vocês seguem a pé para Phandalin. Lá dá para comprar equipamento novo na Barthen Provisões, descansar e voltar atrás da trilha.',
          'O próximo capítulo ainda está sendo escrito.',
        ],
      }],
      escolhas: [{ rotulo: 'Voltar ao menu', valor: 'menu', primaria: true }],
    });
    app.encerrarPartida();
  }

  // ------------------------------------------------------- botão direito ----
  /** Anda o herói até a casa livre mais perto de `alvo` que ele alcance. */
  function andarAte(c, alvo, ate = 5) {
    const alcance = enc.reachableFor(c);
    let melhor = null;
    for (const node of alcance.values()) {
      if (enc.occupied(node.x, node.y, c)) continue;
      if (distanceFt(node, alvo) > ate) continue;
      if (!melhor || node.cost < melhor.cost) melhor = node;
    }
    if (!melhor) return false;
    if (melhor.cost > 0) enc.moveAlong(c, Battlefield.pathFrom(alcance, melhor));
    return true;
  }

  async function vasculhar(c, tile) {
    estado.explorando = false;
    const r = d20(enc.rng, skillBonus(c, 'percepcao'));
    const teste = { quem: c.name, pericia: 'Percepção', total: r.total, cd: 'a Furtividade deles', passou: false };
    const perto = escondidos.map((f, i) => ({ f, furt: furtividade[i] })).filter(({ f }) => distanceFt(f.pos, tile) <= 15);
    const achados = perto.filter(({ furt }) => r.total >= furt);
    if (achados.length) {
      await narrar(root, {
        formato: 'painel',
        paginas: [{ teste: { ...teste, passou: true, cd: Math.min(...achados.map((a) => a.furt)) }, texto: [
          `${c.name} afasta os galhos e dá de cara com um goblin agachado, de flecha na corda. Ele grita, e o mato inteiro responde.`,
          'Vocês acharam a emboscada antes que ela achasse vocês.',
        ] }],
        escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }],
      });
      combate(false);
    } else if (perto.length) {
      await narrar(root, {
        formato: 'painel',
        paginas: [{ teste: { ...teste, cd: Math.min(...perto.map((a) => a.furt)) }, texto: [
          `${c.name} remexe o mato e não vê nada. Mas alguma coisa ali viu ${c.name}: uma corda de arco estala, perto demais.`,
        ] }],
        escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }],
      });
      combate(true);
    } else {
      await narrar(root, { formato: 'painel', paginas: [{ texto: [`${c.name} vasculha o mato. Só espinho, folha seca e um ninho de passarinho vazio.`] }] });
      estado.explorando = true;
      app.refresh();
    }
  }

  async function procurarRastros(c) {
    estado.explorando = false;
    const t = testar(enc, c, ['sobrevivencia']);
    if (t.passou) estado.rastros = true;
    await narrar(root, {
      formato: 'painel',
      paginas: [{ teste: t, texto: [t.passou
        ? `${c.name} lê o chão: pegadas pequenas, muitas, de pés descalços e botas gastas. E dois sulcos de algo pesado sendo arrastado, saindo da estrada para o mato ao norte. Quem derrubou os cavalos levou os cavaleiros.`
        : `${c.name} procura no chão, mas a terra batida da estrada não conta muita coisa.`] }],
    });
    estado.explorando = true;
    app.refresh();
  }

  /** As ações da cena no menu do botão direito (`game/interacoes.js`). */
  function interacoes(tile, sup, c) {
    if (!c) return [];
    const ops = [];
    const longe = (pes) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
    if (sup === 'cavalo') {
      if (estado.explorando) {
        ops.push({
          rotulo: 'Examinar os cavalos', icone: 'acao-procurar', detalhe: 'Investigação ou Medicina · anda até lá',
          fazer: () => {
            if (!andarAte(c, tile)) { app.refuse(c, 'não dá para chegar perto dos cavalos daqui'); return; }
            app.afterWalk(() => depoisDeMover(c));
            app.refresh();
          },
        });
      } else if (!enc.over && enc.side === 'party') {
        ops.push({
          rotulo: 'Examinar os cavalos', icone: 'acao-procurar', detalhe: 'gasta a ação',
          motivo: c.actionUsed ? 'a ação deste turno já foi usada' : distanceFt(c.pos, tile) > 5 ? 'encoste nos cavalos primeiro' : null,
          fazer: async () => {
            c.actionUsed = true;
            estado.examinou = true;
            await narrar(root, { formato: 'painel', paginas: [{ texto: [
              'São os cavalos de Gundren e de Sildar, mortos há um dia. Os alforjes foram esvaziados; ao lado, um tubo de guardar mapa, vazio.'] }] });
            app.afterAct();
          },
        });
      }
    }
    if (estado.explorando && (sup === 'arbusto' || sup === 'arvore' || sup === 'grama')) {
      ops.push({
        rotulo: 'Vasculhar o mato', icone: 'acao-procurar', detalhe: 'Percepção · se falhar perto de alguém escondido, ele percebe',
        motivo: longe(30), fazer: () => vasculhar(c, tile),
      });
    }
    if (estado.explorando && (sup === 'estrada' || sup === 'grama') && cavalos.some((h) => distanceFt(h, tile) <= 15)) {
      ops.push({
        rotulo: 'Procurar rastros', icone: 'acao-procurar', detalhe: 'Sobrevivência, CD 10',
        motivo: longe(15), fazer: () => procurarRastros(c),
      });
    }
    return ops;
  }

  return {
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    async iniciar() {
      // Como na aventura: o grupo vem pela curva com os cavalos a uns quinze
      // metros, e dos quatro goblins dois correm para o corpo a corpo e dois
      // ficam a 9 m atirando.
      const LUGARES = [{ x: 8, y: 11 }, { x: 8, y: 12 }, { x: 7, y: 11 }, { x: 7, y: 13 }];
      enc.allOf('party').forEach((c, i) => { if (LUGARES[i]) c.pos = { ...c.pos, ...LUGARES[i] }; });
      escondidos[0].tatica = 'atirador';
      escondidos[2].tatica = 'atirador';
      if (!config.pularAbertura) await abertura();
      prepararExploracao();
      await chegada();
    },
    depoisDeMover,
    fimDoCombate,
    evento,
  };
}
