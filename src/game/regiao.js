// A REGIÃO em volta de Phandalin (Parte 3 da aventura): o mapa pintado com
// os lugares que o grupo conhece, e a viagem entre eles.
//
// As REGRAS da viagem são as do livro; o texto é nosso:
//   - o grupo marcha 36 km por dia (dez horas), descansa oito e gasta o resto
//     montando acampamento — um descanso longo por noite;
//   - um teste de encontro de dia e outro de noite: d20, 17 a 20 é encontro, e
//     um d12 na tabela da Trilha Triboar diz o quê (`ENCONTROS`);
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

/** Quilômetros e dias de marcha entre dois lugares. */
export function trajeto(de, para) {
  const km = Math.round(dist(LOCAL[de], LOCAL[para]) * KM_POR_PX / 2) * 2;
  return { km, dias: Math.max(1, Math.ceil(km / KM_POR_DIA)) };
}

/**
 * A tabela da Trilha Triboar, d12. `dia`/`noite` são as faixas do dado em
 * cada período (null: não acontece naquele período). `qtd` é a rolagem do
 * número de criaturas, como [dados, faces, bônus].
 */
export const ENCONTROS = [
  { id: 'stirge', nome: 'stirges', dia: [1, 2], noite: [1, 3], qtd: [1, 8, 2] },
  { id: 'ghoul', nome: 'carniçais', dia: null, noite: [4, 4], qtd: [1, 4, 1] },
  { id: 'ogro', nome: 'um ogro', dia: [3, 4], noite: null, qtd: [0, 0, 1] },
  { id: 'goblin', nome: 'goblins', dia: [5, 6], noite: [5, 5], qtd: [1, 6, 3] },
  { id: 'hobgoblin', nome: 'hobgoblins', dia: [7, 8], noite: [6, 6], qtd: [1, 4, 2] },
  { id: 'orc', nome: 'orcs', dia: [9, 10], noite: [7, 8], qtd: [1, 4, 2] },
  { id: 'lobo', nome: 'lobos', dia: [11, 11], noite: [9, 10], qtd: [1, 4, 2] },
  { id: 'corujaUrso', nome: 'um urso-coruja', dia: [12, 12], noite: [11, 12], qtd: [0, 0, 1] },
];

const rolar = (rng, faces) => 1 + Math.floor(rng() * faces);

/** O encontro do período, ou null. `rng()` devolve [0, 1). */
export function sortearEncontro(rng, periodo) {
  if (rolar(rng, 20) < 17) return null;
  const d = rolar(rng, 12);
  const e = ENCONTROS.find((x) => x[periodo] && d >= x[periodo][0] && d <= x[periodo][1]);
  if (!e) return null;
  const [n, f, b] = e.qtd;
  let qtd = b;
  for (let i = 0; i < n; i++) qtd += rolar(rng, f);
  return { id: e.id, nome: e.nome, qtd, periodo };
}

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
    const { km, dias } = trajeto(reg.onde, l.id);
    // Partindo de um lugar habitado, ninguém sai com o cantil pela metade.
    const encheu = encherCantis(vivos());
    const d = despensaDoGrupo(vivos());
    const precisa = dias * vivos().length;
    tela.esconder();
    const r = await narrar(app.root, {
      formato: 'painel',
      paginas: [{ titulo: l.nome, texto: [
        `${km} km de ${LOCAL[reg.onde].nome}: ${dias === 1 ? 'um dia' : `${dias} dias`} de marcha, com acampamento à noite.`,
        `Rações: o grupo leva ${d.racoes}, e a viagem pede ${precisa}.${d.racoes < precisa ? ' O que faltar sai da caça e da colheita — ou da fome.' : ''}`,
        `Água: ${encheu > 0 ? `os cantis foram enchidos aqui (${encheu} litro(s)) e levam ` : 'os cantis levam '}${d.agua} litro(s), um dia para cada um. O resto é riacho, chuva ou magia.`,
        'O grupo marcha em ritmo normal, 36 km por dia, e caça pelo caminho quando falta o que comer ou beber. (O ritmo de marcha do livro — lento, normal e rápido — ainda não é escolha no jogo.)',
      ] }],
      escolhas: [
        { rotulo: 'Ficar', valor: 'fica' },
        { rotulo: 'Partir', valor: 'parte', primaria: true },
      ],
    });
    if (r !== 'parte') { tela.mostrar(); return; }
    camp.viagem = { de: reg.onde, para: l.id, dias, dia: 1, periodo: 'dia' };
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
    while (via.dia <= via.dias) {
      if (via.periodo === 'dia') {
        const paisagem = rng.pick(PAISAGENS);
        registrar(`Dia ${v.dia}, a caminho de ${LOCAL[via.para].nome}: ${paisagem.texto}`);
        for (const t of await oDiaDoGrupo(rng, paisagem)) registrar(t);
        const e = sortearEncontro(rng, 'dia');
        via.periodo = via.dia === via.dias ? 'chegou' : 'noite';
        if (e) { await encontro(e); return; }
      }
      if (via.periodo === 'chegou') break;
      if (via.periodo === 'noite') {
        const e = sortearEncontro(rng, 'noite');
        via.periodo = 'descanso';
        if (e) { await encontro(e); return; }
      }
      // A noite passou (com ou sem luta): o descanso longo do acampamento.
      // Quem não comeu nem bebeu o dia todo não tira degrau de exaustão.
      for (const t of await descansoLongoDoGrupo(app.root, { herois: vivos(), titulo: 'Acampamento',
        alimentado: (c) => (c.diasSemComida ?? 0) === 0 && !c.semAgua,
        texto: [via.semComida ? 'Uma noite de barriga meio vazia, mas de olhos fechados.' : 'Fogueira baixa, um de vigia por vez.'] })) registrar(t);
      v.dia += 1;
      v.tempo = 0;
      via.dia += 1;
      via.periodo = 'dia';
      via.semComida = false;
    }
    reg.onde = via.para;
    camp.viagem = null;
    // Chegando, há poço, riacho ou taverna: os cantis enchem sozinhos.
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

    if (faltaComida || faltaAgua) {
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
    for (const t of diaDeViagem(rng, herois, { calor: paisagem.calor, agua: paisagem.agua, fontes, purificada })) linhas.push(t);
    if (herois.some((c) => (c.diasSemComida ?? 0) > 0)) camp.viagem.semComida = true;

    const depois = despensaDoGrupo(herois, { calor: paisagem.calor });
    linhas.push(`Despensa: ${depois.racoes} ração(ões) e ${depois.agua} litro(s) de água — ${depois.dias} dia(s) de comida.`);
    return linhas;
  }

  async function encontro(e) {
    const quando = e.periodo === 'dia' ? 'Na trilha' : 'No acampamento, à noite';
    registrar(`${quando}: ${e.qtd > 1 ? `${e.qtd} ` : ''}${e.nome}.`);
    tela.fechar();
    app.newEncounter({
      ...app.config, modo: 'campanha', capitulo: 4,
      cenaDaVila: e.periodo === 'dia' ? 'ermo' : 'ermoNoite',
      encontro: e, continuarCom: vivos(),
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
      return `Dia ${v.dia} · em ${LOCAL[reg.onde].nome} · ${d.racoes} ração(ões), ${d.agua} L`;
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
