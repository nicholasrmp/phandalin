// A REGIÃO em volta de Phandalin (Parte 3 da aventura): o mapa pintado com
// os lugares que o grupo conhece, e a viagem entre eles.
//
// As REGRAS da viagem são as do livro; o texto é nosso:
//   - o grupo marcha oito horas por dia, no ritmo que escolher
//     (`rules/marcha.js`), e acampa à noite — um descanso longo por noite;
//   - um teste de encontro de dia e outro de noite: d20, 17 a 20 é encontro, e
//     um d12 na tabela da Trilha Triboar diz o quê
//     (`rules/encontros-estrada.js`);
//   - o XP de um encontro é o dos monstros, dividido pelo grupo.
// Os MANTIMENTOS são os do livro e moram em `rules/mantimentos.js`: uma ração
// e quatro litros de água por pessoa por dia, fome e sede cobrando exaustão, e
// um teste de Sobrevivência por dia para caçar e colher. A paisagem do dia diz
// se havia água no caminho.
// Chega-se ao fim da última marcha: a noite no destino já é do lugar.
//
// Os LUGARES ficam em % da pintura (`art/vila/regiao.webp`, OpenArt). A
// distância sai da pintura: a escala é tal que Phandalin–Poço da Coruja
// Velha dá dois dias, como o Daran diz.
//
// O estado da viagem mora em `app.campanha.viagem` e sobrevive a uma luta no
// meio do caminho: a cena do encontro (`capitulo4-estrada.js`) devolve o grupo
// para cá com `continuarViagem`.

import pintura from '../art/vila/regiao.webp';
import { abrirTelaVila } from '../view/vila.js';
import { narrar } from '../view/narrativa.js';
import { descansoLongoDoGrupo } from '../view/descanso-tela.js';
import { totalEmCobre } from './comercio.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { MISSOES } from './phandalin.js';
import { visitarConyberry } from './conyberry.js';
import { makeRng, seedFromString } from '../core/rng.js';
import {
  diaDeViagem, forragear, melhorForrageador, despensaDoGrupo,
  despensaMagica, limparMagicoVencido, encherCantis,
} from '../rules/mantimentos.js';
import { estadoDe as estadoDeUtilidade, podeConjurarFora } from '../rules/utilidade.js';
import {
  RITMOS, EXTRAS_MAX, ritmoDe, kmPorDia, diasDeMarcha, marcharEm, cobrarMarchaForcada, podeMarchar,
} from '../rules/marcha.js';
import {
  VIGIAS, procurarLugar, montarAcampamento, atencaoDaVigia, coberturaDaNoite,
  ocultacaoDoAcampamento, descansou, noiteQuebrada, textoDoAcampamento,
} from '../rules/acampamento.js';
import { ENCONTROS, sortearEncontro } from '../rules/encontros-estrada.js';

export { ENCONTROS, sortearEncontro };

/**
 * O dado da viagem: semeado pelo trajeto, com o estado guardado em
 * `via.semente`. Assim uma luta no meio do caminho não rebobina a estrada, e
 * a mesma viagem se repete igual — como o resto do jogo.
 */
function dadoDaViagem(camp, via) {
  via.semente ??= seedFromString(`viagem:${via.de}:${via.para}:${camp.vila?.dia ?? 1}`);
  const rng = makeRng(via.semente);
  const original = rng.state;
  // Cada rolagem guarda o estado novo: o dado sobrevive ao fechar a tela.
  const guardar = () => { via.semente = original(); };
  const embrulhar = (f) => (...args) => { const r = f(...args); guardar(); return r; };
  const saida = embrulhar(rng);
  for (const k of ['int', 'die', 'pick', 'chance', 'shuffle']) saida[k] = embrulhar(rng[k]);
  saida.state = original;
  return saida;
}

const LARG = 896;
const ALT = 1200;
const KM_POR_DIA = 36;

export const LOCAIS = [
  { id: 'phandalin', nome: 'Phandalin', x: 58.0, y: 70.0, sempre: true, jogavel: true },
  { id: 'poco', nome: 'Poço da Coruja Velha', x: 84.3, y: 41.7, missao: 'coruja', jogavel: true },
  { id: 'cume', nome: 'Cume da Wyvern', x: 88.2, y: 60.0, missao: 'orcs', jogavel: true },
  { id: 'conyberry', nome: 'Ruínas de Conyberry', x: 91.5, y: 22.0, missao: 'agatha', jogavel: true },
  { id: 'arvoreTrovao', nome: 'Árvore Trovão', x: 32.4, y: 38.3, missao: 'reidoth' },
  { id: 'castelo', nome: 'Castelo Dentefino', x: 51.9, y: 43.3, feito: 'sabeOCastelo', jogavel: true },
  { id: 'neverwinter', nome: 'Neverwinter', x: 14.5, y: 30.8, sempre: true, cidade: true },
  { id: 'leilon', nome: 'Leilon', x: 39.0, y: 89.0, sempre: true, cidade: true },
];
const LOCAL = Object.fromEntries(LOCAIS.map((l) => [l.id, l]));

const px = (l) => ({ x: l.x / 100 * LARG, y: l.y / 100 * ALT });
const dist = (a, b) => Math.hypot(px(a).x - px(b).x, px(a).y - px(b).y);
const KM_POR_PX = 2 * KM_POR_DIA / dist(LOCAL.phandalin, LOCAL.poco);

/**
 * Quilômetros e dias de marcha entre dois lugares, no ritmo escolhido
 * (`rules/marcha.js`). Sem ritmo, o normal: 36 km por dia.
 */
export function trajeto(de, para, { ritmo = 'normal', horasExtras = 0 } = {}) {
  const km = Math.round(dist(LOCAL[de], LOCAL[para]) * KM_POR_PX / 2) * 2;
  return {
    km,
    dias: diasDeMarcha(km, KM_POR_DIA, ritmo, horasExtras),
    porDia: kmPorDia(KM_POR_DIA, ritmo, horasExtras),
  };
}

/**
 * A tabela da Trilha Triboar, d12. `dia`/`noite` são as faixas do dado em
 * cada período (null: não acontece naquele período). `qtd` é a rolagem do
 * número de criaturas, como [dados, faces, bônus].
 */
// Um dia de estrada, em poucas palavras. Sorteado, para a viagem não ser
// sempre a mesma. `agua` diz se houve riacho, poço ou chuva de onde beber;
// `calor` dobra a água do dia; `terreno` dá a CD de quem vai caçar e colher.
const PAISAGENS = [
  { texto: 'Colinas baixas de capim amarelo, uma depois da outra. O vento não para.', terreno: 'comum' },
  { texto: 'Uma garoa fina o dia inteiro. À tarde, o sol sai bem a tempo de secar as capas.', agua: true, terreno: 'comum' },
  { texto: 'Rastros de carroça velhos na trilha, e um marco de pedra com um nome que ninguém consegue ler.', terreno: 'comum' },
  { texto: 'Um bando de corvos acompanha o grupo por horas, de árvore em árvore.', terreno: 'comum' },
  { texto: 'Ao longe, a mata escura de Neverwinter; mais perto, só pedra, urze e silêncio.', terreno: 'ermo' },
  { texto: 'Um riacho raso, bom para encher os cantis. Alguém acha uma ponta de flecha antiga na margem.', agua: true, terreno: 'farto' },
  { texto: 'Sol aberto e nenhuma sombra na trilha o dia inteiro. As bocas secam antes do meio-dia.', calor: true, terreno: 'ermo' },
  { texto: 'A trilha corre junto de um brejo de água parada, cheio de juncos e mosquito.', agua: 'suja', terreno: 'farto' },
];

/**
 * Abre o mapa da região com o grupo `grupo`, parado em `onde` (o id de um
 * lugar). Devolve a tela.
 */
export function abrirRegiao(app, { grupo, onde = 'phandalin' }) {
  const camp = (app.campanha ??= {});
  const v = (camp.vila ??= { dia: 1, tempo: 0, missoes: {}, pistas: [], feito: {}, registro: [] });
  const feitos = (camp.feitos ??= {});
  const reg = (camp.regiao ??= { onde, registro: [] });
  reg.onde = onde;
  const vivos = () => grupo.filter((c) => !c.dead);
  let tela;

  const conhecido = (l) => l.sempre || (l.missao && v.missoes?.[l.missao]) || (l.feito && feitos[l.feito]);

  async function aoClicar(l) {
    if (!l.jogavel) {
      tela.esconder();
      await narrar(app.root, { formato: 'painel', paginas: [{ titulo: l.nome, texto: [l.cidade
        ? 'Longe demais, e fora desta história: o que vocês procuram está aqui na região.'
        : 'Este caminho fica para uma próxima etapa da construção do jogo.'] }] });
      tela.mostrar();
      return;
    }
    if (l.id === reg.onde) { await entrar(l); return; }
    // Quem está no 5º degrau de exaustão tem deslocamento 0: não há partir.
    const parados = vivos().filter((c) => !podeMarchar(c));
    if (parados.length) {
      tela.esconder();
      await narrar(app.root, { formato: 'painel', paginas: [{ titulo: 'Ninguém sai daqui', texto: [
        `${parados.map((c) => c.name).join(', ')} não ${parados.length > 1 ? 'conseguem' : 'consegue'} dar mais um passo: o cansaço chegou ao ponto em que o corpo não obedece.`,
        'Descansem, comam e bebam antes de pegar a estrada.',
      ] }] });
      tela.mostrar();
      return;
    }
    const { km } = trajeto(reg.onde, l.id);
    // Partindo de um lugar habitado, ninguém sai com o cantil pela metade.
    const encheu = encherCantis(vivos());
    const d = despensaDoGrupo(vivos());
    // Quantos dias em cada ritmo, para a escolha ser informada.
    const porRitmo = Object.values(RITMOS).map((r) => ({ r, ...trajeto(reg.onde, l.id, { ritmo: r.id }) }));
    const normal = porRitmo.find((x) => x.r.id === 'normal');
    tela.esconder();
    const escolha = await narrar(app.root, {
      formato: 'painel',
      paginas: [{ titulo: l.nome, texto: [
        `${km} km de ${LOCAL[reg.onde].nome}, com acampamento a cada noite.`,
        `Rações: o grupo leva ${d.racoes}, e a viagem pede ${normal.dias * vivos().length} em ritmo normal.${d.racoes < normal.dias * vivos().length ? ' O que faltar sai da caça e da colheita — ou da fome.' : ''}`,
        `Água: ${encheu > 0 ? `os cantis foram enchidos aqui (${encheu} litro(s)) e levam ` : 'os cantis levam '}${d.agua} litro(s), um dia para cada um. O resto é riacho, chuva ou magia.`,
        'Em que passo?',
        ...porRitmo.map((x) => {
          // Com os dias iguais aos do passo normal, o ritmo só troca risco por
          // risco: vale dizer isso antes de o jogador escolher.
          const semGanho = x.r.id === 'rapido' && x.dias >= normal.dias;
          const nota = semGanho ? ' (os mesmos dias do passo normal, só com menos horas de estrada por dia)' : '';
          return `· ${x.r.nome}: ${x.porDia} km por dia, ${x.dias === 1 ? 'um dia' : `${x.dias} dias`}, ${x.dias * vivos().length} ração(ões)${nota} — ${x.r.resumo}.`;
        }),
      ] }],
      escolhas: [
        { rotulo: 'Ficar', valor: 'fica' },
        ...porRitmo.map((x) => ({ rotulo: x.r.nome, valor: x.r.id, primaria: x.r.id === 'normal' })),
      ],
    });
    if (!RITMOS[escolha]) { tela.mostrar(); return; }

    // Marcha forçada: só vale perguntar quando ela encurta a viagem.
    let horasExtras = 0;
    const comExtras = trajeto(reg.onde, l.id, { ritmo: escolha, horasExtras: EXTRAS_MAX });
    const semExtras = trajeto(reg.onde, l.id, { ritmo: escolha });
    if (comExtras.dias < semExtras.dias) {
      const forcar = await narrar(app.root, {
        formato: 'painel',
        paginas: [{ titulo: 'Forçar a marcha?', texto: [
          `Mais duas horas de estrada por dia encurtam a viagem de ${semExtras.dias} para ${comExtras.dias} dia(s).`,
          'O preço é do livro: um teste de Constituição por hora a mais — CD 11 na nona hora, 12 na décima. Quem falha ganha um degrau de exaustão.',
        ] }],
        escolhas: [
          { rotulo: 'No passo normal', valor: 'nao', primaria: true },
          { rotulo: 'Forçar', valor: 'sim' },
        ],
      });
      if (forcar === 'sim') horasExtras = EXTRAS_MAX;
    }

    const rota = trajeto(reg.onde, l.id, { ritmo: escolha, horasExtras });
    marcharEm(vivos(), escolha);
    camp.viagem = {
      de: reg.onde, para: l.id, dias: rota.dias, dia: 1, periodo: 'dia',
      ritmo: escolha, horasExtras, kmRestantes: rota.km, porDia: rota.porDia,
    };
    await seguirViagem();
  }

  /** Chegou (ou já estava) num lugar: entra nele. */
  async function entrar(l) {
    tela.fechar();
    if (l.id === 'phandalin') { app.irParaVila(vivos(), { chegando: true }); return; }
    if (l.id === 'conyberry') {
      // Sem tabuleiro: a visita é uma conversa. Depois, a região de novo.
      feitos.visitou_conyberry = true;
      await visitarConyberry(app, vivos());
      abrirRegiao(app, { grupo, onde: 'conyberry' });
      return;
    }
    if (l.id === 'castelo') {
      feitos.visitou_castelo = true;
      app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 4, cenaDaVila: 'castelo', continuarCom: vivos() });
      return;
    }
    if (l.id === 'cume') {
      feitos.visitou_cume = true;
      app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 4, cenaDaVila: 'cume', continuarCom: vivos() });
      return;
    }
    if (l.id === 'poco') {
      feitos.visitou_poco = true;
      app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 4, cenaDaVila: 'poco', continuarCom: vivos() });
    }
  }

  /** Anda a viagem a partir de `camp.viagem` até chegar ou até um encontro. */
  async function seguirViagem() {
    const via = camp.viagem;
    // O dado da viagem é semeado como o resto do jogo, e o estado dele viaja
    // junto: uma luta no meio do caminho não rebobina a estrada.
    const rng = dadoDaViagem(camp, via);
    while ((via.kmRestantes ?? 0) > 0 || via.periodo === 'chegou') {
      if (via.periodo === 'dia') {
        const paisagem = rng.pick(PAISAGENS);
        // A noite acampa no terreno do dia.
        via.terrenoDoDia = paisagem.terreno ?? 'comum';
        // O dia anda o que o ritmo rende, ou o que falta — o que for menor.
        const kmHoje = Math.min(via.kmRestantes ?? via.porDia, via.porDia);
        const fracao = via.porDia > 0 ? kmHoje / via.porDia : 1;
        registrar(`Dia ${v.dia}, a caminho de ${LOCAL[via.para].nome} (${Math.round(kmHoje)} km): ${paisagem.texto}`);
        for (const t of await oDiaDoGrupo(rng, paisagem)) registrar(t);
        via.kmRestantes = Math.max(0, (via.kmRestantes ?? via.porDia) - kmHoje);
        // Menos horas na estrada, menos chance de topar com alguma coisa: o
        // teste do dia só acontece na fração do dia que o grupo marchou. É o
        // que faz o passo acelerado valer a pena.
        const e = fracao >= 1 || rng() < fracao ? sortearEncontro(rng, 'dia') : null;
        via.periodo = via.kmRestantes <= 0 ? 'chegou' : 'noite';
        if (e) { await encontro(e); return; }
      }
      if (via.periodo === 'chegou') break;
      // Acampado, o ritmo não vale: a Percepção perdida no passo acelerado
      // volta enquanto o grupo está parado na fogueira — inclusive se a noite
      // virar luta, por isso isto vem ANTES do encontro noturno.
      marcharEm(vivos(), null);
      if (via.periodo === 'noite') {
        // Onde armar, com fogo ou sem, e quem fica de vigia. O acampamento
        // vive em `camp.viagem` para sobreviver a uma luta no meio da noite.
        via.acampamento = await escolherAcampamento(rng, via);
        const camp = montarAcampamento({ ...via.acampamento, herois: vivos() });
        registrar(textoDoAcampamento(camp));
        // O que esconde o acampamento sobe a barra do encontro; o fogo desce.
        const e = sortearEncontro(rng, 'noite', { ajuste: ocultacaoDoAcampamento(camp) });
        via.periodo = 'descanso';
        if (e) { await encontro(e); return; }
      }
      // A noite passou (com ou sem luta): o descanso longo do acampamento.
      // Quem não comeu nem bebeu o dia todo não tira degrau de exaustão, e
      // quem passou quatro horas de vigia não descansou de verdade.
      const campNoite = montarAcampamento({ ...(via.acampamento ?? {}), herois: vivos() });
      // O livro: só UMA HORA ou mais de esforço manda recomeçar o descanso. A
      // luta da noite soma os minutos dela em `capitulo4-estrada.js`; uma luta
      // de rodadas nem chega perto, mas a regra fica onde devia estar.
      const quebrou = noiteQuebrada(via.minutosDaNoite);
      if (quebrou) registrar('A noite virou do avesso: passou de uma hora em pé, de armas na mão. O descanso longo não conta.');
      via.minutosDaNoite = 0;
      for (const t of await descansoLongoDoGrupo(app.root, { herois: vivos(), titulo: 'Acampamento',
        // O livro pede "alguma comida e bebida": meia ração é alguma comida,
        // então meio dia sem comer (0,5) ainda deixa o descanso desfazer um
        // degrau. Um dia inteiro sem nada, não.
        alimentado: (c) => (c.diasSemComida ?? 0) < 1 && !c.semAgua,
        descansou: (c) => !quebrou && descansou(c, campNoite),
        texto: [
          via.acampamento ? `${campNoite.lugar.texto}` : null,
          via.semComida ? 'Uma noite de barriga meio vazia, mas de olhos fechados.'
            : campNoite.fogueira ? 'Fogueira baixa, e a noite passa.' : 'Sem fogo, no escuro, e a noite passa.',
        ].filter(Boolean) })) registrar(t);
      v.dia += 1;
      v.tempo = 0;
      via.dia += 1;
      via.periodo = 'dia';
      via.semComida = false;
      // De manhã o grupo volta ao passo escolhido.
      marcharEm(vivos(), via.ritmo);
    }
    reg.onde = via.para;
    camp.viagem = null;
    // Chegando, o ritmo sai de cima do grupo e os cantis enchem sozinhos.
    marcharEm(grupo, null);
    encherCantis(vivos());
    registrar(`O grupo chega a ${LOCAL[reg.onde].nome}.`);
    tela.atualizar();
    await entrar(LOCAL[reg.onde]);
  }

  /**
   * Um dia inteiro de estrada para o grupo: quem caça e colhe, quem come,
   * quem bebe, e o que a fome e a sede cobram. Devolve as frases do registro.
   *
   * Forrageia quem tem o melhor bônus de Sobrevivência, e só quando faltar
   * comida ou água para o dia seguinte: procurar o que já se tem é tempo
   * jogado fora, e o livro deixa a escolha com o grupo.
   */
  async function oDiaDoGrupo(rng, paisagem) {
    const herois = vivos();
    const linhas = [];
    const antes = despensaDoGrupo(herois, { calor: paisagem.calor });
    const faltaComida = antes.dias < 1;
    const faltaAgua = !paisagem.agua && antes.diasDeAgua < 1;

    // Depressa ninguém caça nem colhe: o livro só deixa em ritmo normal ou lento.
    const ritmo = ritmoDe(camp.viagem?.ritmo);
    if ((faltaComida || faltaAgua) && !ritmo.forrageia) {
      linhas.push('No passo acelerado ninguém para para caçar nem colher.');
    }
    if ((faltaComida || faltaAgua) && ritmo.forrageia) {
      const quem = melhorForrageador(herois);
      if (quem) {
        // Localizar Animais ou Plantas aponta onde está a caça: vantagem no teste.
        // Localizar Animais ou Plantas vale no dia em que foi conjurada.
        const vantagem = (estadoDeUtilidade(camp).cacaNoDia ?? -1) === v.dia;
        const f = forragear(rng, quem, { terreno: paisagem.terreno ?? 'comum', vantagem, grupo: herois });
        linhas.push(f.ok
          ? `${quem.name} caça e colhe pelo caminho (Sobrevivência ${f.teste} contra ${f.cd}${vantagem ? ', com vantagem' : ''}): ${f.racoes} ração(ões) e ${f.litros} litro(s) de água${f.perdidos ? `, e ${f.perdidos} litro(s) se perdem por falta de cantil` : ''}.`
          : `${quem.name} procura caça e raiz o dia todo e não acha nada (Sobrevivência ${f.teste} contra ${f.cd}${vantagem ? ', com vantagem' : ''}).`);
      }
    }

    // As rações que a magia faz: Criar Comida e Água e Criar ou Destruir Água
    // alimentam antes de a mochila ser aberta, e o que sobra estraga no fim do
    // dia. A despensa mora no estado das magias de utilidade, que é onde elas
    // a enchem (`rules/utilidade.js`).
    const mant = estadoDeUtilidade(camp);
    mant.dia = v.dia;
    for (const e of limparMagicoVencido(mant, v.dia)) {
      linhas.push(`O que ${e.nome} fez ontem estragou: ${[e.racoes && `${e.racoes} ração(ões)`, e.litros && `${e.litros} litro(s)`].filter(Boolean).join(' e ')} se perdem.`);
    }
    const fontes = despensaMagica(mant);
    // Purificar Alimentos e Bebidas limpa a água do dia antes de alguém beber.
    // É ritual (dez minutos, sem espaço), então quem a tem preparada a conjura
    // sozinho diante de um brejo: ninguém escolheria beber lama tendo a magia.
    const purifica = paisagem.agua === 'suja'
      ? herois.find((h) => !h.dead && podeConjurarFora(h, 'purificarAlimentos', { ritual: true }).ok)
      : null;
    if (purifica) linhas.push(`${purifica.name} purifica a água parada antes de o grupo beber (ritual, dez minutos).`);
    const purificada = Boolean(purifica);
    for (const t of diaDeViagem(rng, herois, {
      calor: paisagem.calor, agua: paisagem.agua, fontes, purificada,
      meiaRacao: Boolean(camp.viagem?.meiaRacao),
    })) linhas.push(t);
    if (herois.some((c) => (c.diasSemComida ?? 0) > 0)) camp.viagem.semComida = true;

    // As horas a mais da marcha forçada cobram no fim do dia.
    for (const t of cobrarMarchaForcada(rng, herois, camp.viagem?.horasExtras ?? 0)) linhas.push(t);

    const depois = despensaDoGrupo(herois, { calor: paisagem.calor });
    linhas.push(`Despensa: ${depois.racoes} ração(ões) e ${depois.agua} litro(s) de água — ${depois.dias} dia(s) de comida.`);
    return linhas;
  }

  /**
   * A tela do acampamento: onde armar, fogo ou escuro, e quem fica de vigia.
   * Devolve { lugar, fogueira, vigia } para `rules/acampamento.js`.
   */
  async function escolherAcampamento(rng, via) {
    const herois = vivos();
    const terreno = via.terrenoDoDia ?? 'comum';
    const quem = melhorForrageador(herois);
    const achou = procurarLugar(rng, quem, { terreno });
    tela?.esconder?.();

    // Cada lugar com o que ele vale, e a declaração de que a tabela é nossa.
    const efeitos = (l) => [
      l.ocultacao ? `esconde ${l.ocultacao > 0 ? `+${l.ocultacao}` : l.ocultacao}` : null,
      l.vigia ? `vigia ${l.vigia > 0 ? `+${l.vigia}` : l.vigia}` : null,
      l.abrigo ? 'tem teto' : null,
    ].filter(Boolean).join(', ') || 'sem vantagem nenhuma';
    const lugar = achou.lugares.length > 1
      ? await narrar(app.root, {
        formato: 'painel',
        paginas: [{ titulo: 'Onde passar a noite', texto: [
          `${quem.name} procura abrigo antes de escurecer (Sobrevivência ${achou.teste} contra ${achou.cd}).`,
          ...achou.lugares.map((l) => `· ${l.nome} (${efeitos(l)}): ${l.texto}`),
          'Os lugares de acampar são regra da casa: o livro não traz tabela de sítio nem CD para achar um.',
        ] }],
        escolhas: achou.lugares.map((l) => ({ rotulo: l.nome, valor: l.id, primaria: l.id !== 'aberto' && l.cd === Math.max(...achou.lugares.map((k) => k.cd)) })),
      })
      : 'aberto';

    const fogueira = await narrar(app.root, {
      formato: 'painel',
      paginas: [{ titulo: 'Fogueira?', texto: [
        'O fogo esquenta, cozinha e mostra quem chega perto: mais 2 na vigia.',
        'E se vê de longe: o que anda pela trilha acha o acampamento com mais facilidade.',
        'Os dois números são regra da casa. O livro não dá bônus por luz — fala de luz clara, penumbra e escuridão, e o acampamento ainda não usa esse motor.',
      ] }],
      escolhas: [
        { rotulo: 'Acender', valor: 'sim', primaria: true },
        { rotulo: 'Noite escura', valor: 'nao' },
      ],
    }) === 'sim';

    // Cada opção com o número que ela vale, para a escolha ser informada e
    // não um palpite: a atenção depende de quem é o grupo.
    const comVigia = Object.values(VIGIAS).map((v) => {
      const teste = montarAcampamento({ lugar, fogueira, vigia: v.id, herois });
      return {
        v,
        atencao: atencaoDaVigia(teste),
        cobertura: coberturaDaNoite(teste),
        perdem: teste.vigias.filter((c) => !descansou(c, teste)),
      };
    });
    const vigia = await narrar(app.root, {
      formato: 'painel',
      paginas: [{ titulo: 'Quem fica de vigia', texto: [
        'Oito horas de noite. O descanso longo pede seis dormindo e no máximo duas de atividade leve — vigiar é atividade leve. Só uma pessoa fica acordada de cada vez.',
        ...comVigia.map(({ v, atencao, perdem, cobertura }) => `· ${v.nome}: atenção média ${atencao || 'nenhuma'}, ${Math.round(cobertura * 100)}% da noite coberta${perdem.length ? `, e ${perdem.map((c) => c.name).join(' e ')} ficam só com o descanso curto` : ''} — ${v.resumo}.`),
        'Nosso: o livro não diz em letra que passar das duas horas custa o descanso longo inteiro, nem que quem o perde fica com o curto. É a leitura mais comum, e é a que o jogo usa.',
      ] }],
      escolhas: comVigia.map(({ v }) => ({ rotulo: v.nome, valor: v.id, primaria: v.id === 'revezam' })),
    });

    // Meia ração só vale a pena perguntar quando a comida está curta.
    const d = despensaDoGrupo(herois);
    if (d.dias <= 1) {
      const meia = await narrar(app.root, {
        formato: 'painel',
        paginas: [{ titulo: 'A comida está no fim', texto: [
          `Restam ${d.racoes} ração(ões) para ${d.bocas} bocas.`,
          'Comendo metade, a comida dura o dobro — e a fome anda na metade da velocidade, como manda o livro. Ninguém fica satisfeito.',
        ] }],
        escolhas: [
          { rotulo: 'Meia ração', valor: 'meia', primaria: true },
          { rotulo: 'Comer direito', valor: 'cheia' },
        ],
      });
      camp.viagem.meiaRacao = meia === 'meia';
    } else {
      // A comida voltou (forragem, magia, compra): ninguém fica de meia ração
      // sem o jogo perguntar de novo.
      camp.viagem.meiaRacao = false;
    }

    tela?.mostrar?.();
    return { lugar, fogueira, vigia };
  }

  async function encontro(e) {
    const quando = e.periodo === 'dia' ? 'Na trilha' : 'No acampamento, à noite';
    registrar(`${quando}: ${e.qtd > 1 ? `${e.qtd} ` : ''}${e.nome}.`);
    tela.fechar();
    app.newEncounter({
      ...app.config, modo: 'campanha', capitulo: 4,
      cenaDaVila: e.periodo === 'dia' ? 'ermo' : 'ermoNoite',
      encontro: e, acampamento: camp.viagem?.acampamento ?? null, continuarCom: vivos(),
    });
  }

  // A tela guarda no próprio registro da região (`estado.registro`).
  function registrar(t) {
    if (tela) tela.registrar(t);
    else (reg.registro ??= []).push(t);
  }

  tela = abrirTelaVila(app.root, {
    titulo: 'A região',
    classe: 'regiao',
    pintura,
    proporcao: `${LARG} / ${ALT}`,
    lugares: LOCAIS,
    estado: { missoes: v.missoes ?? {}, pistas: v.pistas ?? [], registro: (reg.registro ??= []) },
    grupo,
    missoes: MISSOES,
    // A despensa fica à vista: a decisão de partir depende dela.
    momento: () => {
      const d = despensaDoGrupo(vivos());
      const marcha = camp.viagem ? ` · ${ritmoDe(camp.viagem.ritmo).nome.toLowerCase()}${camp.viagem.horasExtras ? ', forçando' : ''}` : '';
      return `Dia ${v.dia} · em ${LOCAL[reg.onde].nome}${marcha} · ${d.racoes} ração(ões), ${d.agua} L`;
    },
    dinheiro: () => totalEmCobre(vivos()),
    visivel: conhecido,
    aberto: (l) => Boolean(l.jogavel),
    novidade: (l) => l.id !== reg.onde && l.jogavel && l.id !== 'phandalin' && !feitos[`visitou_${l.id}`],
    onLugar: (l) => aoClicar(l),
    onMenu: () => { tela.fechar(); app.encerrarPartida(); },
    onFicha: (c) => app.abrirFichaNaVila(c, () => tela.atualizar()),
  });
  tela.atualizar();

  // Voltando de um encontro no meio do caminho: XP e, se der, a viagem segue.
  (async () => {
    if (app.xpPendente) {
      const { xp, motivo } = app.xpPendente;
      app.xpPendente = null;
      const cada = Math.floor(xp / Math.max(1, vivos().length));
      const sobem = darXp(vivos(), cada);
      registrar(`${motivo}: ${cada} XP para cada um.`);
      if (sobem.length) {
        tela.esconder();
        for (const t of await telaDeSubirNivel(app.root, sobem)) registrar(t);
        tela.mostrar();
      }
    }
    if (camp.viagem) await seguirViagem();
  })();
  return tela;
}

/** O grupo volta de uma luta de estrada: reabre a região e a viagem segue. */
export function continuarViagem(app, grupo) {
  const onde = app.campanha?.regiao?.onde ?? 'phandalin';
  return abrirRegiao(app, { grupo, onde });
}
