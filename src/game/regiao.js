// A REGIÃO em volta de Phandalin (Parte 3 da aventura): o mapa pintado com
// os lugares que o grupo conhece, e a viagem entre eles.
//
// As REGRAS da viagem são as do livro; o texto é nosso:
//   - o grupo marcha 36 km por dia (dez horas), descansa oito e gasta o resto
//     montando acampamento — um descanso longo por noite;
//   - um teste de encontro de dia e outro de noite: d20, 17 a 20 é encontro, e
//     um d12 na tabela da Trilha Triboar diz o quê (`ENCONTROS`);
//   - o XP de um encontro é o dos monstros, dividido pelo grupo.
// A ração: uma por herói por dia de marcha. Sem ela, o grupo caça e colhe
// pelo caminho, sem efeito de regra — decisão nossa, o livro não conta comida.
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

const LARG = 896;
const ALT = 1200;
const KM_POR_DIA = 36;

export const LOCAIS = [
  { id: 'phandalin', nome: 'Phandalin', x: 58.0, y: 70.0, sempre: true, jogavel: true },
  { id: 'poco', nome: 'Poço da Coruja Velha', x: 84.3, y: 41.7, missao: 'coruja', jogavel: true },
  { id: 'cume', nome: 'Cume da Wyvern', x: 88.2, y: 60.0, missao: 'orcs' },
  { id: 'conyberry', nome: 'Ruínas de Conyberry', x: 91.5, y: 22.0, missao: 'agatha' },
  { id: 'arvoreTrovao', nome: 'Árvore Trovão', x: 32.4, y: 38.3, missao: 'reidoth' },
  { id: 'castelo', nome: 'Castelo Dentefino', x: 51.9, y: 43.3, feito: 'sabeOCastelo' },
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
// sempre a mesma; nada aqui muda regra.
const PAISAGENS = [
  'Colinas baixas de capim amarelo, uma depois da outra. O vento não para.',
  'Uma garoa fina o dia inteiro. À tarde, o sol sai bem a tempo de secar as capas.',
  'Rastros de carroça velhos na trilha, e um marco de pedra com um nome que ninguém consegue ler.',
  'Um bando de corvos acompanha o grupo por horas, de árvore em árvore.',
  'Ao longe, a mata escura de Neverwinter; mais perto, só pedra, urze e silêncio.',
  'Um riacho raso, bom para encher os cantis. Alguém acha uma ponta de flecha antiga na margem.',
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
    const precisa = dias * vivos().length;
    const temRacoes = vivos().reduce((s, c) => s + ((c.bag ?? []).find((i) => i.id === 'racoes')?.qtd ?? 0), 0);
    tela.esconder();
    const r = await narrar(app.root, {
      formato: 'painel',
      paginas: [{ titulo: l.nome, texto: [
        `${km} km de ${LOCAL[reg.onde].nome}: ${dias === 1 ? 'um dia' : `${dias} dias`} de marcha, com acampamento à noite.`,
        `Rações: o grupo leva ${temRacoes}, e a viagem pede ${precisa}.${temRacoes < precisa ? ' O que faltar, vão caçar e colher pelo caminho.' : ''}`,
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
    if (l.id === 'poco') {
      feitos.visitou_poco = true;
      app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 4, cenaDaVila: 'poco', continuarCom: vivos() });
    }
  }

  /** Anda a viagem a partir de `camp.viagem` até chegar ou até um encontro. */
  async function seguirViagem() {
    const via = camp.viagem;
    const rng = () => Math.random();
    while (via.dia <= via.dias) {
      if (via.periodo === 'dia') {
        comer();
        const linha = PAISAGENS[Math.floor(rng() * PAISAGENS.length)];
        registrar(`Dia ${v.dia}, a caminho de ${LOCAL[via.para].nome}: ${linha}`);
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
      for (const t of await descansoLongoDoGrupo(app.root, { herois: vivos(), titulo: 'Acampamento',
        texto: [via.semComida ? 'Uma noite de barriga meio vazia, mas de olhos fechados.' : 'Fogueira baixa, um de vigia por vez.'] })) registrar(t);
      v.dia += 1;
      v.tempo = 0;
      via.dia += 1;
      via.periodo = 'dia';
      via.semComida = false;
    }
    reg.onde = via.para;
    camp.viagem = null;
    registrar(`O grupo chega a ${LOCAL[reg.onde].nome}.`);
    tela.atualizar();
    await entrar(LOCAL[reg.onde]);
  }

  /** Uma ração por herói; quem não tem, divide a caça do dia. */
  function comer() {
    let faltam = 0;
    for (const c of vivos()) {
      const r = (c.bag ?? []).find((i) => i.id === 'racoes' && i.qtd > 0)
        ?? vivos().map((o) => (o.bag ?? []).find((i) => i.id === 'racoes' && i.qtd > 0)).find(Boolean);
      if (r) { r.qtd -= 1; } else faltam += 1;
    }
    for (const c of vivos()) c.bag = (c.bag ?? []).filter((i) => i.id !== 'racoes' || i.qtd > 0);
    if (faltam) {
      camp.viagem.semComida = true;
      registrar(`Faltou ração para ${faltam === 1 ? 'um' : faltam}: o grupo caça e colhe o que dá pelo caminho.`);
    }
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
    momento: () => `Dia ${v.dia} · em ${LOCAL[reg.onde].nome}`,
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
