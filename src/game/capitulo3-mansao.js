// O ESCONDERIJO DOS MARCARRUBRA, embaixo da Mansão Tresendar (Parte 2 da
// aventura, áreas 1-12). Mapa em `game/mansao.js`.
//
// As REGRAS de cada área seguem o livro (quem está onde, testes, CDs,
// tesouros, XP); o TEXTO é nosso.
//
//   geral     portas secretas: Percepção passiva 15 a 3 m acha sem procurar;
//             procurando, Percepção CD 10. A porta do depósito de armas (6)
//             está trancada: chave (Mosk ou o Cajavidro), ferramentas de
//             ladrão com Destreza CD 10, ou Força CD 20 para derrubar.
//   área 1    porão com cisterna. A porta para o 2 está fechada. Revirar os
//             barris faz barulho: os três da área 2 abrem a porta e vêm de
//             mansinho (surpresa se ninguém os ouvir). No fundo
//             da cisterna, a bolsa de fuga do Cajavidro (Percepção CD 15, ou
//             na hora com uma vara).
//   área 3    o fosso escondido no meio do corredor (Percepção CD 15 acha).
//             Pelo lado sul passa uma faixa de laje, um de cada vez; pela
//             beirada dá para se espremer com Acrobacia CD 10, mais rápido e
//             mais arriscado. Quem cai: Destreza CD 15
//             para se agarrar; senão 2d6 e caído. 100 XP por passar.
//   área 4    três esqueletos atacam quem chega a 6 m da porta das jaulas ou
//             da do depósito de armas — menos quem veste o manto vermelho ou
//             diz a senha. Nos três sarcófagos, um anel de platina cada.
//   área 5    dois Marcarrubra e a família Dendrar nas jaulas (abrir: chave,
//             ferramentas CD 10 ou Força 22). Luta na cripta os põe de tocaia.
//   área 8    a fenda, duas pontes e o vigia de um olho só, que prefere
//             negociar a lutar (prometam comida). A ponte do sul quebra com
//             qualquer um em cima (Investigação CD 15 percebe). No fundo, o
//             baú do vigia, com a espada Talon.
//   área 9    três bugbears e Droop, o goblin, que desmaia quando o grupo
//             entra. Mosk carrega a chave. O terceiro bugbear dorme e só
//             levanta na segunda rodada (decisão nossa, de equilíbrio).
//   área 10   quatro Marcarrubra bêbados no jogo de pedrinhas: quem entra os
//             pega de surpresa.
//   área 11   o rato do Cajavidro: viu intruso, avisou o dono, e ele foge
//             pela porta secreta do quarto (deixando a carta e a porta mal
//             fechada). Só pela passagem secreta do 7 dá para pegá-lo de
//             surpresa. Com 8 PV ou menos, ele se rende. O rato não entra no
//             tabuleiro (simplificação nossa).
//
// ARMADILHAS PELO CAMINHO: o fosso escondido e a ponte podre param o passo
// na casa onde ele pisa (`enc.paraNaCasa`), dentro e fora da luta, e para
// qualquer lado.
//
// O estado mora em `app.campanha.mansao` e sobrevive a sair e voltar: o que
// caiu fica caído, o que se abriu fica aberto.

import { narrar } from '../view/narrativa.js';
import { d20 } from '../core/dice.js';
import { skillBonus, passivePerception, SKILL_NAME, spellSaveDc, abilityMod } from '../rules/abilities.js';
import { distanceFt, isAdjacent, SUPERFICIES } from '../core/grid.js';
import { podeVer, visaoNoEscuro, emiteLuz } from '../rules/luz.js';
import { addCondition, removeCondition, hasCondition } from '../rules/conditions.js';
import { darXp } from './nivel.js';
import { audio } from '../core/audio.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { MANSAO } from './mansao.js';
import { criarBuscas } from './buscas.js';
import { ctxDe } from './magias-fora.js';
import { rolarTeste, disfarcado, disfarceDe, ativaDe } from '../rules/utilidade.js';
import { guardar } from './comercio.js';
import { garantirInventario } from '../rules/equipment.js';

const MOVIMENTO = 60;

const SALAS = {
  alojamento: { nome: 'o alojamento', em: 'no alojamento', xp: 300 },
  cripta: { nome: 'a cripta', em: 'na cripta', xp: 150 },
  jaulas: { nome: 'as jaulas', em: 'nas jaulas', xp: 200 },
  fenda: { nome: 'a caverna da fenda', em: 'perto da fenda', xp: 450 },
  guardas: { nome: 'o alojamento dos guardas', em: 'no alojamento dos guardas', xp: 600 },
  estar: { nome: 'a sala de estar', em: 'na sala de estar', xp: 400 },
  cajavidro: { nome: 'o quarto do Cajavidro', em: 'no quarto do Cajavidro', xp: 200 },
};

const dentro = (p, x0, y0, x1, y1) => p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1;
const NA_OFICINA = (p) => dentro(p, 2, 2, 5, 4);
const NO_QUARTO = (p) => dentro(p, 7, 2, 9, 3);
const NA_ESTAR = (p) => dentro(p, 2, 8, 6, 11);
const NO_PORAO = (p) => dentro(p, 21, 12, 28, 18);
const PORTAS_DA_CRIPTA = [{ x: 20, y: 5 }, { x: 16, y: 4 }];       // para o 5 e para o 6
const NA_FENDA = (f, p) => f.surfaceAt(p.x, p.y) === 'entulho' && f.heightAt(p.x, p.y) === 0;
const SENHA = 'Illefarn';

export function criarMansao(app, config) {
  const enc = app.enc;
  const root = app.root;
  const todos = app.inimigosEscondidos;
  const camp = (app.campanha ??= {});
  const salvo = (camp.mansao ??= {
    vencidos: [], secretas: [], trancadaAberta: false, fossoVisto: false, fossoXp: false,
    ponteSulCaiu: false, celas: false, bolsa: false, bauVigia: false, bauIarno: false, carta: false,
    aneis: [], mesa: false, reagentes: false, peles: false, mantos: 0,
    tregua: false, iarno: null, presosLivres: false, temChave: false, sabeSenha: false,
  });
  salvo.portas ??= [];
  // Buscas já tentadas: UMA tentativa por herói em cada ponto. Sem isso, as
  // CDs eram decorativas — dava para clicar na mesma parede, na mesma porta e
  // no mesmo trecho de corredor até o dado sair. Outro herói pode tentar (são
  // outros olhos e outros ouvidos); o mesmo, não. Objeto, e não Set, porque
  // `salvo` sobrevive a sair e voltar da masmorra.
  salvo.buscas ??= {};
  const buscas = criarBuscas(salvo.buscas);
  const grupos = {};
  for (const f of todos) (grupos[f.grupo] ??= { id: f.grupo, membros: [], ativo: false, vencido: false }).membros.push(f);
  for (const g of Object.values(grupos)) {
    g.furtividade = g.membros.filter((f) => f.side === 'foes').map((f) => d20(enc.rng, skillBonus(f, 'furtividade')).total);
    if (salvo.vencidos.includes(g.id)) g.vencido = true;
  }
  if (salvo.tregua && grupos.fenda) grupos.fenda.tregua = true;
  // O Cajavidro fugido (ou preso, ou morto) de uma visita anterior não volta.
  if (salvo.iarno && grupos.cajavidro) grupos.cajavidro.vencido = true;
  const iarno = grupos.cajavidro?.membros[0];
  const rato = grupos.rato?.membros[0];
  const vigia = grupos.fenda?.membros[0];
  const droop = grupos.guardas?.membros.find((f) => f.defId === 'droop');
  const mosk = grupos.guardas?.membros.find((f) => f.name === 'Mosk');
  const presos = (grupos.jaulas?.membros ?? []).filter((f) => f.preso);
  const estado = {
    explorando: false, encerrado: false, lutando: null,
    iarnoAvisado: Boolean(salvo.iarno), alojamentoVem: false,
    de: new Map(),            // de onde cada um veio no último passo
  };

  const herois = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead && c.hp > 0);
  const hostis = (g) => (g?.membros ?? []).filter((f) => f.side === 'foes' && !f.dead && !f.fugiu);
  const pendentes = () => Object.values(grupos).filter((g) => g.id !== 'rato' && !g.ativo && !g.vencido && !g.tregua && hostis(g).length);
  const tem = (c, id) => garantirInventario(c).bag.some((i) => i.id === id && i.qtd > 0);
  // Os testes passam pelas magias de utilidade (Orientação soma 1d4, Aprimorar Atributo dá vantagem...).
  const teste = (c, pericia, cd, vantagem = false) => {
    const x = ctxDe(app, enc);
    const r = rolarTeste(x.estado, x.herois(), enc.rng, c, pericia, cd, { vantagem });
    return { quem: r.quem, pericia: r.pericia, total: r.total, cd, passou: r.passou, fontes: r.fontes };
  };
  const casaPerto = (p) => enc.casaLivreMaisProxima(p) ?? p;
  const painel = (texto, extra = {}) => narrar(root, { formato: 'painel', paginas: [{ texto: [].concat(texto), ...extra }] });
  const asArmas = (texto) => narrar(root, {
    formato: 'painel',
    paginas: [{ texto: [].concat(texto) }],
    escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }],
  });

  // ------------------------------------------------------------- o mapa ----
  const chao = SUPERFICIES.indexOf('laje');
  function abrirCasa(x, y, h, { som = true } = {}) {
    // Pedra arrastando por 1,2 s. O padrao e TOCAR, e so as tres chamadas que
    // repoem o que ja estava aberto passam `som: false`: com o padrao
    // invertido, uma porta nova esquecida entraria muda, e o erro silencioso
    // e o que nao se descobre jogando.
    if (som) audio.play('doorStone');
    const f = enc.field;
    const i = y * f.w + x;
    f.tiles[i] = 0;
    f.surfaces[i] = chao;
    f.heights[i] = h;
    f.versao = (f.versao ?? 0) + 1;     // a visão do grupo recalcula
  }
  function abrirPorta(nome, opcoes) {
    const p = MANSAO.portas[nome];
    abrirCasa(p.x, p.y, p.h, opcoes);
    if (!salvo.portas.includes(nome)) salvo.portas.push(nome);
  }
  function abrirSecreta(nome, opcoes) {
    const s = MANSAO.secretas[nome];
    abrirCasa(s.x, s.y, s.h, opcoes);
    if (!salvo.secretas.includes(nome)) salvo.secretas.push(nome);
  }
  function abrirTrancada(opcoes) {
    const t = MANSAO.trancada;
    abrirCasa(t.x, t.y, t.h, opcoes);
    salvo.trancadaAberta = true;
  }
  /**
   * O fosso, aberto ou visto: um buraco dois níveis abaixo do corredor. O
   * desnível barra o passo; visão e flecha passam por cima.
   */
  function marcarFosso() {
    const f = enc.field;
    for (const p of MANSAO.fosso) {
      const i = p.y * f.w + p.x;
      f.tiles[i] = 2;
      f.surfaces[i] = SUPERFICIES.indexOf('fosso');
      f.heights[i] = 2;
    }
    f.versao = (f.versao ?? 0) + 1;
  }
  function quebrarPonteSul() {
    const f = enc.field;
    const y = MANSAO.pontes.sul;
    const [x0, x1] = MANSAO.fenda[y];
    for (let x = x0; x <= x1; x++) {
      const i = y * f.w + x;
      f.surfaces[i] = SUPERFICIES.indexOf('entulho');
      f.heights[i] = 0;
      f.tiles[i] = 2;
    }
    f.objetos = (f.objetos ?? []).filter((o) => !(o.tipo === 'ponte' && o.y === y));
    f.versao = (f.versao ?? 0) + 1;
    salvo.ponteSulCaiu = true;
  }
  // O que já estava aberto de outra visita.
  for (const nome of salvo.secretas) abrirSecreta(nome, { som: false });
  if (salvo.trancadaAberta) abrirTrancada({ som: false });
  if (salvo.fossoVisto) marcarFosso();
  if (salvo.ponteSulCaiu) quebrarPonteSul();
  for (const nome of salvo.portas) abrirPorta(nome, { som: false });

  // ------------------------------------------------- armadilhas no caminho ----
  const noFosso = (p) => !salvo.fossoVisto && MANSAO.fosso.some((q) => q.x === p.x && q.y === p.y);
  const naPonteSul = (p) => {
    if (salvo.ponteSulCaiu) return false;
    const y = MANSAO.pontes.sul;
    const [x0, x1] = MANSAO.fenda[y];
    return p.y === y && p.x >= x0 && p.x <= x1;
  };
  // O passo para na casa da armadilha. Explorando, também na primeira casa
  // da oficina (o rato vê) e na do raio da cripta: a cena resolve ali, e não
  // depois de o herói ter atravessado a sala inteira num clique.
  enc.paraNaCasa = (c, p) => {
    if (noFosso(p) || naPonteSul(p)) return true;
    if (!estado.explorando || c.side !== 'party') return false;
    if (!estado.iarnoAvisado && iarno && !iarno.dead && !grupos.cajavidro?.ativo && NA_OFICINA(p)) return true;
    return Boolean(grupos.cripta && pendentes().includes(grupos.cripta) && !grupos.cripta.senha && !vestido(c) && gatilhoDaCripta(p));
  };

  // ------------------------------------------------------ exploração ----
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

  function trazer(g) {
    if (g.ativo) return;
    g.ativo = true;
    // Os esqueletos levam a regra do manto para DENTRO da luta: quem está de
    // manto vermelho, ou disse a senha, não é alvo deles. Sem isso, bastava um
    // herói descoberto para os três atacarem o grupo inteiro, de manto e tudo.
    if (g.id === 'cripta') for (const e of g.membros) e.ignora = (h) => Boolean(g.senha) || vestido(h);
    for (const f of g.membros) {
      if (enc.combatants.includes(f) || f.dead) continue;
      if (enc.occupied(f.pos.x, f.pos.y)) f.pos = { ...f.pos, ...casaPerto(f.pos) };
      enc.addCombatant(f);
    }
  }

  async function combate(g, surpresa = null) {
    trazer(g);
    estado.explorando = false;
    estado.lutando = g;
    root.classList.remove('explorando');
    if (g.id === 'cripta') salvo.jaulasAvisadas = true;    // a luta na cripta se ouve nas jaulas
    // `som` só se ela ainda não estava aberta: quem abriu a porta e depois
    // revirou os barris chamava isto com a porta já aberta, e ela rangia duas vezes.
    if (g.id === 'alojamento') abrirPorta('alojamento', { som: !salvo.portas.includes('alojamento') });
    if (g.id === 'guardas' && droop && !droop.dead) {
      addCondition(droop, 'inconsciente');
      droop.stable = true;
    }
    // Bêbados (decisão nossa: o livro só diz que estão distraídos).
    // Bêbados: envenenado DURA. Sem duração a condição ficava para sempre, o
    // que não é regra nenhuma — e a sala media trivial (3 a 14% de PV
    // perdidos). Três rodadas é o tempo de eles acordarem para a briga.
    if (g.id === 'estar') for (const f of hostis(g)) addCondition(f, 'envenenado', { rounds: 3, quando: 'fim', lado: f.side });
    enc.emboscada = surpresa === 'deles'
      ? { emboscadores: 'foes', furtividade: g.furtividade }
      : surpresa === 'nossa'
        ? { emboscadores: 'party', furtividade: testeDeGrupo(herois()) }
        : null;
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
  }

  /**
   * Furtividade em grupo, como o SRD manda: o grupo passa se metade passar.
   * O motor compara a PIOR furtividade com a percepção passiva de cada um;
   * dar a todos a mediana alta (a segunda melhor de quatro) dá o mesmo efeito.
   */
  function testeDeGrupo(gente) {
    const r = gente.map((h) => d20(enc.rng, skillBonus(h, 'furtividade')).total).sort((a, b) => b - a);
    const meio = r[Math.max(0, Math.ceil(r.length / 2) - 1)] ?? 0;
    return r.map(() => meio);
  }

  const nota = (f, c) => podeVer(enc, f, c) && (emiteLuz(c) || distanceFt(f.pos, c.pos) <= 30);
  // O manto vermelho ou o Disfarçar-se: para quem não olha direito, é um Marcarrubra.
  // O manto engana sempre; o Disfarçar-se engana até alguém examinar de perto:
  // o melhor da cripta rola Investigação (INT) contra a CD de magia de quem o conjurou,
  // uma vez por magia (a CD que a descrição da magia promete).
  const exame = new Map();
  const vestido = (c) => {
    if (c.mantoVermelho) return true;
    const x = ctxDe(app, enc);
    if (!disfarcado(x.estado, herois(), c)) return false;
    const a = disfarceDe(x.estado, herois(), c);       // Disfarçar-se ou Alterar Aparência
    if (!a) return false;
    // Alterar Aparência muda o corpo de verdade: não há exame. Só o Disfarçar-se (ilusão) é examinado.
    if (a.spellId === 'alterarAparencia') return true;
    if (!exame.has(a.n)) {
      const olhos = (grupos.cripta?.membros ?? []).filter((f) => f.side === 'foes' && !f.dead);
      const bonus = Math.max(...olhos.map((f) => abilityMod(f.abilities?.int ?? 10)), -5);
      exame.set(a.n, olhos.length ? d20(enc.rng, bonus).total < spellSaveDc(c) : true);
    }
    return exame.get(a.n);
  };

  // --------------------------------------------------- portas secretas ----
  /** Quem tem Percepção passiva 15 nota a porta secreta a 3 m sem procurar. */
  async function secretasPassivas(c) {
    for (const [nome, s] of Object.entries(MANSAO.secretas)) {
      if (salvo.secretas.includes(nome)) continue;
      if (distanceFt(c.pos, s) > 10) continue;
      // A do quarto ficou mal fechada quando o Cajavidro fugiu: fica fácil.
      const limite = nome === 'quarto' && salvo.iarno === 'fugiu' ? 10 : 15;
      if (passivePerception(c) < limite) continue;
      abrirSecreta(nome);
      await painel(`${c.name} repara numa junta de pedra que não fecha direito: uma porta secreta, que gira para o lado com um empurrão.`);
      app.refresh();
      return true;
    }
    return false;
  }

  // ------------------------------------------------------------ fosso ----
  async function fosso(c) {
    if (!noFosso(c.pos)) return false;
    salvo.fossoVisto = true;
    const r = enc.resistencia(c, 'dex', 15);
    let texto;
    if (r.success) {
      texto = `As lajes cedem sob ${c.name} e somem num buraco escuro — ${c.name} se agarra na beirada e sobe de volta.`;
    } else {
      const dano = enc.rng.die(6) + enc.rng.die(6);
      enc.applyDamage(c, dano, 'concussão');
      if (!c.dead) addCondition(c, 'caido');
      texto = `As lajes cedem e ${c.name} despenca seis metros num fosso de terra (${dano} de dano). Sair dali leva um tempo, mas as paredes têm onde segurar.`;
    }
    // Volta para o lado de onde veio: cair não é atravessar.
    const de = estado.de.get(c) ?? { x: 27 };
    const volta = casaPerto({ x: de.x > 24 ? 25 : 22, y: c.pos.y });
    c.pos = { ...c.pos, x: volta.x, y: volta.y };
    marcarFosso();
    if (estado.explorando) {
      await painel([texto, 'O buraco fica aberto no meio do corredor. Pelo lado sul sobra uma faixa de laje, larga o bastante para um de cada vez.']);
      if (c.side === 'party') await xpDoFosso();
    } else {
      enc.say('acao', texto);
    }
    app.refresh();
    return true;
  }
  async function xpDoFosso() {
    if (salvo.fossoXp) return;
    salvo.fossoXp = true;
    await darXpDoLivro(100, 'o fosso do corredor');
  }

  // ------------------------------------------------------ esqueletos ----
  // A 6 m da porta das jaulas ou da do depósito de armas, DO LADO DE DENTRO
  // (as portas são da cripta; quem está do outro lado da parede não conta).
  function gatilhoDaCripta(p) {
    const naCripta = dentro(p, 16, 5, 19, 10) || [{ x: 20, y: 5 }, { x: 16, y: 4 }, { x: 20, y: 10 }].some((q) => q.x === p.x && q.y === p.y);
    return naCripta && PORTAS_DA_CRIPTA.some((q) => distanceFt(p, q) <= 20);
  }
  async function cripta(c) {
    const g = grupos.cripta;
    if (!g || !pendentes().includes(g)) return false;
    const perto = herois().filter((h) => gatilhoDaCripta(h.pos));
    if (!perto.length || perto.every(vestido) || g.senha) return false;
    await asArmas([
      'Os três esqueletos encostados nos sarcófagos levantam a cabeça ao mesmo tempo, com um estalo seco, e vêm.',
      perto.some(vestido) ? 'O manto vermelho não engana quem está sem ele.' : null,
    ].filter(Boolean));
    await combate(g, null);
    return true;
  }

  // ------------------------------------------------------- o vigia ----
  async function oVigia(c) {
    const g = grupos.fenda;
    if (!g || !pendentes().includes(g) || g.conversou) return false;
    const visto = herois().find((h) => podeVer(enc, h, vigia));
    const notou = herois().find((h) => nota(vigia, h));
    if (!visto && !notou) return false;
    g.conversou = true;
    const fim = await app.conversarCom(vigia, arvoreDoVigia(Boolean(visto)));
    // Sem trato fechado, a conversa acabou do jeito dele: vem a fome.
    if (fim === 'luta' || !g.tregua) {
      await asArmas(fim === 'luta'
        ? 'O olho enorme se estreita. A voz dentro da cabeça de vocês vira um chiado.'
        : '…ninguém dá nada… então o olho pega.');
      await combate(g, visto ? null : 'deles');
    } else if (!salvo.xpTregua) {
      // O livro dá o mesmo XP por vencer o vigia ou por fazer trégua com ele.
      salvo.xpTregua = true;
      await darXpDoLivro(SALAS.fenda.xp, 'Trégua com o vigia da fenda');
    }
    return true;
  }

  function arvoreDoVigia(visto) {
    return {
      inicio: 'oi',
      nos: {
        oi: {
          narra: visto
            ? 'Atrás de uma das colunas de pedra, um corpo cinzento e magro se encolhe — e um único olho, do tamanho de um punho, encara vocês.'
            : 'Nada se mexe. Mas um pensamento que não é de vocês aparece, molhado e baixinho, dentro da cabeça.',
          fala: '…carne nova… cheiro de estrada, de sol… o mago dá pouca. Pouca. O que vocês dão?',
          opcoes: [
            { texto: 'Comida, se você deixar a gente passar.', vai: 'trato',
              requer: (ctx) => (ctx.algum((h) => tem(h, 'racoes')) ? null : 'ninguém tem rações'), },
            { texto: 'Prometo carne fresca quando o mago cair.', teste: { pericia: 'persuasao', cd: 10 }, sucesso: 'trato', falha: 'desconfia' },
            { texto: 'Sai da frente ou morre.', teste: { pericia: 'intimidacao', cd: 13 }, sucesso: 'medo', falha: 'luta' },
            { texto: 'Atacar.', fim: 'luta' },
          ],
        },
        desconfia: {
          fala: '…promessa não enche barriga… o mago também prometeu…',
          opcoes: [
            { texto: 'Comida agora, então.', vai: 'trato', requer: (ctx) => (ctx.algum((h) => tem(h, 'racoes')) ? null : 'ninguém tem rações') },
            { texto: 'Atacar.', fim: 'luta' },
          ],
        },
        medo: {
          ao: () => { grupos.fenda.tregua = true; salvo.tregua = true; },
          fala: '…passa… passa… o olho não viu nada…',
          narra: 'A criatura recua para o escuro e some atrás da coluna.',
          opcoes: [{ texto: '…', fim: 'paz' }],
        },
        trato: {
          ao: (ctx) => {
            const dono = ctx.herois.find((h) => tem(h, 'racoes'));
            if (dono) { const r = dono.bag.find((i) => i.id === 'racoes'); r.qtd -= 1; if (r.qtd <= 0) dono.bag.splice(dono.bag.indexOf(r), 1); }
            grupos.fenda.tregua = true;
            salvo.tregua = true;
          },
          fala: [
            '…bom… bom… o olho conta. O mago de vidro dorme no oeste, depois da sala dos livros. O rato dele vê tudo lá.',
            '…tem porta na pedra, no depósito do norte, que leva ao quarto dele por trás. Ele não sabe que o olho sabe.',
            '…e o mago obedece a uma aranha. Aranha preta. Manda os peludos grandes ajudar.',
          ],
          opcoes: [{ texto: 'Fique aí quieto.', fim: 'paz' }],
        },
      },
    };
  }

  /** A ponte do sul: quebra com qualquer um em cima. */
  async function ponteSul(c) {
    if (!naPonteSul(c.pos)) return false;
    // Todo mundo que estiver em cima vai junto.
    const emCima = enc.combatants.filter((o) => !o.dead && naPonteSul(o.pos));
    quebrarPonteSul();
    const partes = [];
    for (const o of emCima) {
      const dano = enc.rng.die(6) + enc.rng.die(6);
      enc.applyDamage(o, dano, 'concussão');
      if (!o.dead) addCondition(o, 'caido');
      partes.push(`${o.name} (${dano} de dano)`);
    }
    const texto = `As tábuas estalam, racham e caem, seis metros abaixo, num monte de pedras soltas — e levam junto ${partes.join(', ')}.`;
    if (estado.explorando) await painel(texto); else enc.say('acao', texto);
    app.refresh();
    return true;
  }

  // ----------------------------------------------------- o Cajavidro ----
  /** O rato viu alguém na oficina: o mestre já sabe, e foge. */
  async function ratoAvisa(c) {
    if (estado.iarnoAvisado || !iarno || iarno.dead || !NA_OFICINA(c.pos)) return false;
    if (grupos.cajavidro.ativo) return false;
    // O rato é um familiar, não uma câmera: quem entra na oficina sem fazer
    // barulho pode passar por ele. Antes o aviso saía sempre e sem teste, e
    // como a oficina está no caminho natural para o quarto, o chefe do
    // capítulo fugia sozinho na maioria das partidas.
    if (!estado.ratoFalhou) {
      const t = teste(c, 'furtividade', 11);        // Percepção passiva do rato
      if (t.passou) {
        estado.ratoFalhou = true;
        await painel(`Um rato marrom levanta a cabeça debaixo da bancada, fareja o ar e volta ao que estava fazendo. ${c.name} passou sem fazer barulho.`, { teste: t });
        return false;
      }
    }
    estado.iarnoAvisado = true;
    salvo.iarno = 'fugiu';
    iarno.fugiu = true;
    grupos.cajavidro.vencido = true;
    // Foge para a cisterna e leva a bolsa, se ela ainda estiver lá.
    const bolsa = !salvo.bolsa;
    salvo.bolsa = true;
    // O vigia, se ainda está lá, recebe ordem de emboscar quem vier atrás.
    if (grupos.fenda && pendentes().includes(grupos.fenda)) { grupos.fenda.tregua = false; grupos.fenda.emboscada = true; }
    await painel([
      'Um rato marrom corre por baixo da bancada, para, olha direto para vocês — olha demais, como gente — e some por uma fresta.',
      'Do outro lado da parede, uma cadeira arrasta, alguém pragueja baixinho, e uma pedra raspa em pedra. Depois, silêncio.',
      bolsa ? '(O Cajavidro sabe que vocês estão aqui.)' : null,
    ].filter(Boolean));
    return true;
  }

  // ------------------------------------------------------ depois de andar ----
  async function depoisDeMover(c) {
    if (!estado.explorando) return;
    c.movementLeftFt = MOVIMENTO;
    if (await fosso(c)) return;
    // Quem atravessa ANDANDO pelo parapeito (23,11)/(24,11) venceu o corredor
    // do mesmo jeito de quem se espremeu com Acrobacia: vale o mesmo XP.
    if (salvo.fossoVisto && c.pos.y === 11 && (c.pos.x === 23 || c.pos.x === 24)) await xpDoFosso();
    if (await ponteSul(c)) return;
    if (await secretasPassivas(c)) return;
    if (await ratoAvisa(c)) return;
    if (await cripta(c)) return;
    if (await oVigia(c)) return;
    for (const g of pendentes()) {
      if (g.id === 'cripta' || (g.id === 'fenda' && !g.emboscada)) continue;
      // O Cajavidro só é pego de surpresa por quem vem pela passagem secreta.
      if (g.id === 'cajavidro') {
        const entrou = herois().find((h) => NO_QUARTO(h.pos));
        if (!entrou) continue;
        await asArmas([
          'Cheiro de tinta fresca e de vela de sebo. O homem na escrivaninha não se vira de imediato: termina a linha que escrevia, sopra a página e só então encara vocês. Barba preta bem aparada, anéis demais nos dedos. O cajado ao lado dele é de vidro e pega a luz da vela.',
          '— Ora. Convidados. E eu sem nada para oferecer.',
        ]);
        await combate(g, 'nossa');
        return;
      }
      if (g.id === 'estar') {
        const entrou = herois().find((h) => NA_ESTAR(h.pos));
        if (!entrou) continue;
        await asArmas('Uma aposta acaba de dar errado: um Marcarrubra bate o copo e os outros riem dele. Cheiro de cerveja derramada, gritaria, pedrinhas rolando — vocês estão no meio da sala antes de alguém notar que a porta abriu.');
        await combate(g, 'nossa');
        return;
      }
      const visto = hostis(g).find((f) => herois().some((h) => podeVer(enc, h, f)));
      if (visto) {
        const quem = herois().find((h) => podeVer(enc, h, visto));
        const tocaia = g.id === 'jaulas' && salvo.jaulasAvisadas;
        await asArmas([
          visaoNoEscuro(quem) && !emiteLuz(quem)
            ? `No cinza da visão no escuro, ${quem.name} vê alguém ${SALAS[g.id].em}: ${visto.name}.`
            : `${quem.name} dá de cara com ${visto.name} ${SALAS[g.id].em}.`,
          tocaia ? 'Eles estavam esperando, colados na parede junto da porta.' : 'Ninguém é surpreendido.',
        ]);
        await combate(g, tocaia ? 'deles' : null);
        return;
      }
      const notou = hostis(g).find((f) => herois().some((h) => nota(f, h)));
      if (notou) {
        const alvo = herois().find((h) => nota(notou, h));
        await asArmas(g.id === 'fenda'
          ? 'O mago deu ordem: das sombras perto das colunas, alguma coisa se lança sobre vocês.'
          : `Uma voz, perto: "Ei! Quem é?" — ${alvo.name} foi visto.`);
        await combate(g, 'deles');
        return;
      }
    }
  }

  // ------------------------------------------------------------- XP ----
  async function darXpDoLivro(xp, motivo) {
    // O livro divide entre os personagens do grupo: caído conta, morto não.
    const grupo = enc.combatants.filter((c) => c.side === 'party' && !c.dead);
    if (!grupo.length) return;
    const cada = Math.floor(xp / grupo.length);
    const sobem = darXp(grupo, cada);
    enc.say('cura', `${motivo}: ${cada} XP para cada um.`);
    if (sobem.length) for (const t of await telaDeSubirNivel(root, sobem)) enc.say('cura', t);
  }

  // ------------------------------------------------------- a rendição ----
  function rendeSe() {
    if (!iarno || iarno.dead || iarno.side !== 'foes' || iarno.rendido) return false;
    // Derrubado sem morrer (golpe não letal) também fica preso.
    const caido = hasCondition(iarno, 'inconsciente');
    // Morto não se rende. Sem esta linha, `evento` chamava `rendeSe` no dano
    // que o matava: a cena narrava "eu me rendo" e ele morria em seguida, em
    // 1,4 a 7,6% das lutas.
    if (iarno.hp <= 0 && !caido) return false;
    if (iarno.hp > 8 && !caido) return false;
    // Ainda tem por onde sumir? Só vale se o Passo Nebuloso for de fato
    // conjurável: a IA só o usa com inimigo colado (`ai.js`). Longe do grupo,
    // guardar o espaço não era plano nenhum — era teimosia, e ele morria
    // conjurando com 5 PV em vez de se render.
    const colado = enc.combatants.some((h) => h.side === 'party' && !h.dead && isAdjacent(h.pos, iarno.pos));
    if (!caido && colado && (iarno.spellcasting?.slots?.[2] ?? 0) > 0) return false;
    iarno.side = 'neutro';
    iarno.rendido = true;
    iarno.name = 'Iarno Albrek';
    salvo.iarno = 'preso';
    enc.say('acao', caido
      ? 'O Cajavidro cai desacordado. Amarrado, ele não vai a lugar nenhum.'
      : 'O Cajavidro larga o cajado e ergue as mãos: — Basta! Basta. Eu me rendo, meus caros. Sejamos civilizados.');
    enc.checkEnd();
    app.refresh();
    return true;
  }

  enc.antesDoTurno = (m) => {
    if (m === iarno) return rendeSe();
    // O bugbear do beliche dorme as TRÊS primeiras rodadas. Com ele entrando
    // na segunda, a sala media 1200 de XP ajustado — "mortal" no 2º nível, que
    // é como o grupo chega aqui pela rota do túnel do Carp — com 16 a 26% de
    // morte de herói. Entrando na quarta, 88 a 97% de vitória e 5 a 7,5% de
    // morte: continua sendo a pior sala da masmorra, sem ser uma roleta.
    if (m.dormindo) {
      if (enc.round < 4) return true;
      m.dormindo = false;
      enc.say('acao', `${m.name} acorda com a barulheira, rosna e pula do beliche.`);
    }
    return false;
  };

  /** O bicho de Sentidos da Fera viu estas criaturas escondidas: elas já não pegam ninguém de surpresa. */
  function espiou(criaturas) {
    for (const g of Object.values(grupos)) {
      if (g.membros.some((m) => criaturas.includes(m))) g.furtividade = g.furtividade.map(() => 0);
    }
  }

  function evento(ev) {
    if (ev.type === 'died' && ev.target === iarno) salvo.iarno = 'morto';
    // Salto: quem pula o fosso de uma beirada à outra ganha o XP de passar por ele.
    if (ev.type === 'moved' && ev.salto && ev.actor.side === 'party' && salvo.fossoVisto
      && ((ev.from.x <= 22 && ev.to.x >= 25) || (ev.from.x >= 25 && ev.to.x <= 22)) && ev.to.y >= 9 && ev.to.y <= 10) {
      void xpDoFosso();
    }
    if (ev.type === 'moved' && ev.path?.length > 1) {
      estado.de.set(ev.actor, ev.path[ev.path.length - 2]);
      // Na luta, a armadilha dispara para qualquer um (fora dela, quem cuida
      // é o `depoisDeMover`, com o painel).
      if (!estado.explorando && (noFosso(ev.actor.pos) || naPonteSul(ev.actor.pos))) {
        void fosso(ev.actor).then((caiu) => caiu || ponteSul(ev.actor));
      }
    }
    // Golpe acorda quem dorme; o Cajavidro pesa a situação a cada golpe.
    if (ev.target && ev.type !== 'died') {
      if (ev.target.dormindo && ev.target.hp < ev.target.maxHp) ev.target.dormindo = false;
      if (ev.target === iarno && !estado.explorando) rendeSe();
    }
  }

  // ------------------------------------------------------------ fim da luta ----
  async function fimDoCombate(outcome) {
    const g = estado.lutando;
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      const v = await narrar(root, {
        formato: 'tela',
        paginas: [{ titulo: 'Debaixo da mansão', texto: ['O grupo caiu nos porões dos Marcarrubra. Phandalin vai continuar de cabeça baixa.'] }],
        escolhas: [
          { rotulo: 'Voltar ao menu', valor: 'menu' },
          { rotulo: 'Tentar de novo', valor: 'denovo', primaria: true },
        ],
      });
      if (v === 'denovo') app.newEncounter({ ...config, continuarCom: null });
      else app.encerrarPartida();
      return;
    }
    const texto = [];
    if (g) {
      g.vencido = true;
      if (!salvo.vencidos.includes(g.id)) salvo.vencidos.push(g.id);
    }
    const quem = herois()[0];
    if (g?.id === 'alojamento' && quem) {
      guardar(quem, 'moedaDePrata', 43); guardar(quem, 'moedaDeOuro', 12); guardar(quem, 'granada', 2);
      guardar(quem, 'mantoVermelho', 3);
      texto.push(`Nas bolsas de cinto dos três: 43 peças de prata, 12 de ouro e duas granadas. Nos beliches, três mantos vermelhos encardidos. ${quem.name} guarda tudo.`);
    } else if (g?.id === 'guardas' && quem) {
      salvo.temChave = true;
      guardar(quem, 'moedaDePrata', 33); guardar(quem, 'tapaOlho', 1);
      texto.push(`No cinto de Mosk: 33 peças de prata, uma chave de ferro pesada que serve em quase toda fechadura daqui, e o tapa-olho de enfeite que ele usava sem precisar. ${quem.name} guarda.`);
      if (droop && !droop.dead) {
        removeCondition(droop, 'inconsciente');
        texto.push('Encolhido num canto, o goblin Droop volta a si, vê os bugbears no chão e começa a chorar de alívio.');
      }
    } else if (g?.id === 'cajavidro') {
      if (quem) salvo.temChave = true;
      if (salvo.iarno === 'preso') texto.push('O Cajavidro está rendido, com as mãos amarradas. Ele sorri como quem espera um jantar, não uma cela.');
      else texto.push('O Cajavidro está morto. O cajado de vidro rola pelo chão sem quebrar.');
      if (quem && !(quem.weapons ?? []).includes('cajadoDeDefesa')) (quem.weapons ??= []).push('cajadoDeDefesa');
    } else if (g) {
      texto.push(`Silêncio ${SALAS[g.id]?.em ?? 'na sala'}.`);
    }
    if (g && SALAS[g.id]) {
      // Preso, o Cajavidro vale o dobro — a outra metade quando Sildar o recebe na vila.
      const xp = SALAS[g.id].xp;
      await painel(texto.length ? texto : ['A sala é de vocês.']);
      await darXpDoLivro(xp, `${SALAS[g.id].nome[0].toUpperCase()}${SALAS[g.id].nome.slice(1)}`);
    }
    prepararExploracao();
  }

  // -------------------------------------------------------- conversas ----
  const arvoreDroop = {
    inicio: 'oi',
    nos: {
      oi: {
        narra: 'O goblin magrelo se ajoelha, encosta a testa no chão e fala sem parar, em comum ruim.',
        fala: [
          'Droop é bom! Droop ajuda! Os grandes peludos davam pontapé no Droop e comiam a comida do Droop. Droop odeia os grandes.',
          'Droop sabe coisas. Pergunta. Pergunta!',
        ],
        opcoes: [
          { texto: 'Onde ficam as portas escondidas?', vai: 'portas', uma: true },
          { texto: 'Como passar pelos ossos da cripta?', vai: 'senha', uma: true },
          { texto: 'E o Castelo Dentefino?', vai: 'castelo', uma: true },
          { texto: 'Vai embora, Droop.', fim: 'paz' },
        ],
      },
      portas: {
        fala: 'Tem porta na pedra! No porão da água, no canto do fundo. No depósito grande, duas — uma vai para as armas, uma vai para o mago. E o quarto do mago tem uma para a escadinha. Droop acha. Droop quase acha.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      senha: {
        ao: () => { salvo.sabeSenha = true; },
        fala: `Os ossos não batem em quem tem manto vermelho. Ou em quem fala a palavra: "${SENHA}". Droop ouviu o mago falar. Droop nunca falou. Droop tem medo dos ossos.`,
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      castelo: {
        ao: () => { (camp.vila?.pistas ?? []).push('Droop não sabe o caminho do Castelo Dentefino — sempre andou atrás dos outros —, mas jura que goblins de lá rondam Phandalin, e que um deles, pego vivo, saberia. Fica para o norte, mata adentro.'); },
        fala: 'Droop andava atrás, sempre atrás, olhando o chão! Droop não sabe o caminho. Mas os Dentefino vêm farejar a vila, Droop viu. Pega um, aperta, ele fala. É para cima, para onde a mata fica escura.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
    },
  };

  const arvoreDendrar = {
    inicio: 'oi',
    nos: {
      oi: {
        narra: 'A mulher mais velha segura os dois filhos pelos ombros, como se alguém fosse tirá-los de novo.',
        fala: () => (salvo.presosLivres
          ? ['Mirna Dendrar. Esses são Nars e Nilsa. Mataram meu Thel na rua e vieram buscar a gente de noite.',
            'Não sabemos muito: o chefe é um mago, nunca vimos a cara dele. E tem uns monstros altos, peludos, de orelha grande, que trabalham para ele.']
          : ['Por favor… a chave fica com eles. Ou forcem a tranca, qualquer coisa.']),
        opcoes: [
          { texto: 'Vamos tirar vocês daqui.', fim: 'paz', requer: () => (salvo.presosLivres ? null : 'abram a cela primeiro'), oculta: true },
          { texto: 'Precisam de alguma coisa?', vai: 'heranca', uma: true, requer: () => (salvo.presosLivres ? null : 'x'), oculta: true },
          { texto: 'Aguentem firme.', fim: 'paz' },
        ],
      },
      heranca: {
        ao: () => { (camp.vila ??= {}); (camp.vila.missoesExtra ??= []).includes('mirna') || camp.vila.missoesExtra.push('mirna'); },
        fala: [
          'Dinheiro não tenho. Mas tem um colar de esmeraldas que era da minha mãe, e ninguém tocou nele em todos esses anos — se ainda estiver lá, é de vocês.',
          'Está numa caixa, escondida embaixo das prateleiras da loja de ervas do meu pai, em Árvore Trovão: o canto sudeste da vila. Saímos de lá correndo, eu ainda menina, na noite em que os mortos começaram a andar. Nunca mais tive coragem de voltar.',
        ],
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
    },
  };

  const arvoreIarno = {
    inicio: 'oi',
    nos: {
      oi: {
        narra: 'Amarrado, o Cajavidro ajeita o manto com os cotovelos e fala como se estivesse num salão.',
        fala: 'Meus caros, que situação desagradável. Perguntem. Um cavalheiro sabe quando perdeu.',
        opcoes: [
          { texto: 'Quem é o Aranha Negra?', vai: 'aranha', uma: true },
          { texto: 'E os bugbears?', vai: 'bugbears', uma: true },
          { texto: 'Por que trair a Aliança?', vai: 'alianca', uma: true },
          { texto: 'Basta. Você vai responder a Sildar.', fim: 'paz' },
        ],
      },
      aranha: {
        fala: 'Um elfo das profundezas — um drow, sim, desses que vocês só viram em história de taverna. Ele procura a Forja das Magias, a velha forja do pacto entre anões, gnomos e magos. Prometeu dividir comigo.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      bugbears: {
        fala: 'Três brutos que ele mandou para "ajudar". Nunca precisei deles. Eles sabem o caminho da mina; eu, infelizmente, não.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      alianca: {
        fala: 'Trair é uma palavra feia. Ninguém mais na Aliança sabe, se é isso que pergunta. Eu vi uma oportunidade e a aproveitei, como qualquer homem prático.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
    },
  };

  function dialogoDe(npc) {
    if (hasCondition(npc, 'inconsciente')) return null;
    if (npc === droop && grupos.guardas?.vencido) return arvoreDroop;
    if (presos.includes(npc)) return arvoreDendrar;
    if (npc === iarno && salvo.iarno === 'preso') return arvoreIarno;
    return null;
  }

  // ------------------------------------------------- magias de utilidade ----
  /**
   * O que a cena aceita das magias de utilidade (`game/magias-fora.js`): fechaduras para o Abrir,
   * pontos de alcance para as Mãos Mágicas e auras para o Detectar Magia.
   */
  function ganchosMagicos() {
    if (!estado.explorando) return [];
    const f = enc.field;
    const out = [];
    const tr = MANSAO.trancada;
    if (!salvo.trancadaAberta) {
      out.push({
        id: 'trancada', tipo: 'trancada', x: tr.x, y: tr.y, nome: 'A porta trancada do depósito de armas',
        fazer: async () => {
          abrirTrancada();
          await painel('A tranca estala por dentro, com um estrondo que corre pelo porão, e a porta se entreabre sozinha.');
          app.refresh();
        },
      });
    }
    const pa = MANSAO.portas.alojamento;
    if (!salvo.portas.includes('alojamento')) {
      out.push({
        id: 'alojamento', tipo: 'alcance', x: pa.x, y: pa.y, nome: 'A porta do alojamento',
        fazer: async (h) => { abrirPorta('alojamento'); app.refresh(); await depoisDeMover(h); },
      });
    }
    if (!salvo.celas) {
      const guardado = grupos.jaulas && pendentes().includes(grupos.jaulas) ? 'os guardas ainda estão aqui' : null;
      for (const j of Object.values(MANSAO.jaulas)) {
        out.push({
          id: `cela:${j.x},${j.y}`, tipo: 'trancada', x: j.x, y: j.y, nome: 'A cela', motivo: guardado,
          fazer: async () => {
            salvo.celas = true;
            salvo.presosLivres = true;
            await painel('As trancas das celas estalam juntas e as portas rangem abertas. A família sai devagar, sem acreditar.');
            await app.conversarCom(presos[1] ?? presos[0], arvoreDendrar);
          },
        });
      }
    }
    const cisterna = [];
    for (let y = 0; y < f.h; y++) {
      for (let x = 0; x < f.w; x++) {
        const p = { x, y };
        const sup = f.surfaceAt(x, y);
        if (sup === 'cisterna' && NO_PORAO(p) && !salvo.bolsa) cisterna.push([x, y]);
        if (sup === 'bau' && NO_QUARTO(p) && !salvo.bauIarno) {
          out.push({ id: 'bau-iarno-p', tipo: 'procurado', x, y, nome: 'Um baú (o mais próximo)' });
          out.push({
            id: 'bau-iarno', tipo: 'magico', x, y, nome: 'O baú do chefe',
            aura: { escola: 'encantamento e evocação', texto: 'Dois rolos de pergaminho lá dentro: um sussurra encantamento, o outro queima em evocação.' },
          });
        }
      }
    }
    // A cisterna é um poço de várias casas: um ponto só, que vale em qualquer uma delas.
    if (cisterna.length) {
      const [cx, cy] = cisterna[Math.floor(cisterna.length / 2)];
      out.push({
        id: 'cisterna', tipo: 'alcance', x: cx, y: cy, casas: cisterna, nome: 'A cisterna',
        fazer: async (h) => {
          salvo.bolsa = true;
          guardar(h, 'pocaoDeCura', 1); guardar(h, 'pocaoDeInvisibilidade', 1); guardar(h, 'moedaDeOuro', 50); guardar(h, 'roupaDeViagem', 1);
          await painel(`A mão espectral tateia a água gelada, acha um fio e puxa: sobe uma bolsa de couro encerado, pingando. Dentro, roupa limpa e seca, 50 peças de ouro, uma poção de cura e outra de invisibilidade. ${h.name} guarda.`);
        },
      });
      out.push({
        id: 'cisterna-aura', tipo: 'magico', x: cx, y: cy, casas: cisterna, nome: 'A cisterna',
        aura: { escola: 'ilusão e evocação', texto: 'No fundo, algo pequeno e quieto brilha em duas cores: uma de ilusão, outra de evocação. Coisa de frasquinho, não de armadilha.' },
      });
    }
    // Lote 14: a armadilha do corredor (Encontrar Armadilhas) e o que Localizar Objeto acha.
    out.push({
      id: 'fosso', tipo: 'armadilha', x: MANSAO.fosso[0].x, y: MANSAO.fosso[0].y, nome: 'O fosso coberto do corredor',
      semMarca: true, vista: salvo.fossoVisto,
      texto: 'as lajes do meio do corredor não assentam: por baixo, um fosso fundo, de duas casas de largura. Pelo lado sul passa uma faixa de laje, em fila indiana — ou dá para se espremer pela beirada com Acrobacia, ou saltar por cima com a magia Salto.',
      revelar: () => {
        if (salvo.fossoVisto) return false;
        salvo.fossoVisto = true;
        marcarFosso();
        return true;
      },
    });
    if (!salvo.temChave && mosk) out.push({ id: 'chave-mosk', tipo: 'procurado', x: mosk.pos.x, y: mosk.pos.y, nome: 'Uma chave de ferro (a mais próxima)' });
    if (cisterna.length) {
      const [bx, by] = cisterna[Math.floor(cisterna.length / 2)];
      out.push({ id: 'bolsa-cisterna', tipo: 'procurado', x: bx, y: by, nome: 'Uma bolsa de couro encerado (a mais próxima)' });
    }
    // Os esqueletos da cripta: uma magia velha e fria os mantém de pé.
    const cr = grupos.cripta;
    if (cr && pendentes().includes(cr)) {
      for (const m of hostis(cr)) {
        out.push({
          id: `esq:${m.id}`, tipo: 'magico', x: m.pos.x, y: m.pos.y, nome: 'Um esqueleto encostado no sarcófago',
          aura: { escola: 'necromancia', texto: 'Uma magia velha e fria o mantém de pé, esperando alguém que não tenha a senha nem o manto. Não é estátua.' },
        });
      }
    }
    return out;
  }

  // ------------------------------------------------------ botão direito ----
  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    const longe = (pes) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
    const f = enc.field;
    // Uma tentativa por herói em cada ponto (`game/buscas.js`).
    const jaBuscou = (tipo, onde = tile) => buscas.ja(c, tipo, onde);
    const marcarBusca = (tipo, onde = tile) => buscas.marcar(c, tipo, onde);

    // Paredes: procurar porta secreta, e escutar atrás das portas.
    if (sup === 'rocha' || sup === 'alvenaria') {
      ops.push({
        rotulo: 'Procurar porta secreta', icone: 'acao-procurar', detalhe: 'Percepção, CD 10 · paredes a até 3 m',
        motivo: longe(10) ?? jaBuscou('secreta'),
        fazer: async () => {
          marcarBusca('secreta');
          const perto = Object.entries(MANSAO.secretas).filter(([n, s]) => !salvo.secretas.includes(n) && distanceFt(tile, s) <= 10);
          const vantagem = perto.some(([n]) => n === 'quarto' && salvo.iarno === 'fugiu');
          const t = teste(c, 'percepcao', 10, vantagem);
          if (t.passou && perto.length) {
            // As duas secretas do quarto ficam a uma casa uma da outra, então o
            // mesmo teste abre as duas: um rangido para o par, não dois empilhados.
            perto.forEach(([n], i) => abrirSecreta(n, { som: i === 0 }));
            await painel(`${c.name} corre os dedos pelas juntas e acha: uma laje que gira para o lado sobre dobradiças escondidas.`, { teste: t });
            app.refresh();
          } else {
            await painel(t.passou ? `${c.name} examina a parede palmo a palmo. É só parede.` : `${c.name} não acha nada.`, { teste: t });
          }
        },
      });
      const escuta = [
        ['guardas', { x: 3, y: 14 }, 10, 'vozes grossas, em goblin, mandando alguém carregar, buscar, ficar quieto — e o estalo de um tapa, seguido de risada'],
        ['estar', { x: 3, y: 12 }, 10, 'pedrinhas chacoalhando num copo, um grito, um palavrão e moedas trocando de mão'],
        ['estar', { x: 6, y: 7 }, 10, 'pedrinhas chacoalhando num copo, um grito, um palavrão e moedas trocando de mão'],
        ['cajavidro', { x: 4, y: 5 }, 15, 'um chiado de vapor e gotas pingando, como de alambique'],
        ['cajavidro', { x: 6, y: 3 }, 15, 'um chiado de vapor e gotas pingando, como de alambique'],
      ];
      const ouvidas = new Set();
      for (const [gid, porta, cd, som] of escuta) {
        if (ouvidas.has(gid) || distanceFt(tile, porta) > 5 || !grupos[gid] || grupos[gid].vencido) continue;
        ouvidas.add(gid);
        ops.push({
          rotulo: 'Escutar atrás da porta', icone: 'acao-procurar', detalhe: `Percepção, CD ${cd}`,
          motivo: longe(5) ?? jaBuscou('escuta', porta),
          fazer: async () => {
            marcarBusca('escuta', porta);
            const t = teste(c, 'percepcao', cd);
            await painel(t.passou ? `${c.name} encosta a orelha na porta: ${som}.` : `${c.name} não ouve nada de útil.`, { teste: t });
          },
        });
      }
    }

    // A porta do alojamento (2), fechada: abre-se à mão.
    const pa = MANSAO.portas.alojamento;
    if (!salvo.portas.includes('alojamento') && tile.x === pa.x && tile.y === pa.y) {
      ops.push({ rotulo: 'Abrir a porta', icone: 'acao-usarObjeto', motivo: longe(5),
        fazer: async () => { abrirPorta('alojamento'); app.refresh(); await depoisDeMover(c); } });
      const g = grupos.alojamento;
      if (g && !g.vencido) {
        ops.push({ rotulo: 'Escutar atrás da porta', icone: 'acao-procurar', detalhe: 'Percepção, CD 10', motivo: longe(5),
          fazer: async () => {
            const t = teste(c, 'percepcao', 10);
            await painel(t.passou ? `${c.name} encosta a orelha na porta: roncos, uma tosse, alguém reclamando da comida.` : `${c.name} não ouve nada de útil.`, { teste: t });
          } });
      }
    }

    // A porta trancada do depósito de armas.
    const tr = MANSAO.trancada;
    if (!salvo.trancadaAberta && tile.x === tr.x && tile.y === tr.y) {
      if (salvo.temChave) {
        ops.push({ rotulo: 'Destrancar com a chave', icone: 'acao-usarObjeto', motivo: longe(5),
          fazer: async () => { abrirTrancada(); await painel('A chave de ferro gira com um estalo. A porta abre.'); app.refresh(); } });
      }
      ops.push({
        rotulo: 'Forçar a fechadura', icone: 'acao-usarObjeto', detalhe: 'ferramentas de ladrão · Destreza, CD 10',
        motivo: longe(5) ?? (tem(c, 'ferramentasDeLadrao') ? null : `${c.name} não tem ferramentas de ladrão`),
        fazer: async () => {
          const t = teste(c, 'prestidigitacao', 10);
          if (t.passou) abrirTrancada();
          await painel(t.passou ? `${c.name} mexe na fechadura com as gazuas até ela ceder.` : `A fechadura resiste a ${c.name}.`, { teste: t });
          app.refresh();
        },
      });
      ops.push({
        rotulo: 'Derrubar a porta', icone: 'acao-empurrar', detalhe: 'Força, CD 20', motivo: longe(5),
        fazer: async () => {
          const t = teste(c, 'atletismo', 20);
          if (t.passou) abrirTrancada();
          await painel(t.passou ? `${c.name} mete o ombro e a porta voa das dobradiças.` : `A porta aguenta o tranco de ${c.name}.`, { teste: t });
          app.refresh();
        },
      });
    }

    // Área 1: os barris barulhentos e a cisterna.
    if (sup === 'mantimentos' && NO_PORAO(tile) && !salvo.barris) {
      ops.push({
        rotulo: 'Revirar os barris', icone: 'acao-procurar', detalhe: 'faz barulho', motivo: longe(5),
        fazer: async () => {
          salvo.barris = true;
          await painel('Porco salgado, farinha, açúcar, maçãs, cerveja — provisão fresca, nada que denuncie quem mora aqui. E barril rolando faz um barulho dos diabos.');
          const g = grupos.alojamento;
          if (g && pendentes().includes(g)) {
            // Eles vêm de mansinho: quem tiver ouvido os passos não é surpreendido.
            for (const [i, fm] of g.membros.entries()) { const p = casaPerto({ x: 21 + i, y: 13 }); fm.pos = { ...fm.pos, x: p.x, y: p.y }; }
            const ouviu = herois().find((h) => passivePerception(h) >= Math.min(...g.furtividade));
            // Alarme: o aviso toca na cabeça de todos antes de os passos chegarem.
            const alarme = !ouviu && herois().some((h) => enc.protegidoDeSurpresa?.(h));
            await asArmas(ouviu
              ? `${ouviu.name} ouve passos abafados vindo da porta do oeste e avisa a tempo: três Marcarrubra entram de espada na mão.`
              : alarme
                ? 'O Alarme toca na cabeça de todos: passos abafados na porta do oeste. Três Marcarrubra entram de espada na mão e dão de cara com um grupo de prontidão.'
                : 'Três Marcarrubra entram de mansinho pela porta do oeste — e ninguém ouviu eles chegarem.');
            await combate(g, ouviu || alarme ? null : 'deles');
          }
        },
      });
    }
    if (sup === 'cisterna' && NO_PORAO(tile) && !salvo.bolsa) {
      const vara = tem(c, 'vara');
      ops.push({
        rotulo: 'Sondar a cisterna', icone: 'acao-procurar', detalhe: vara ? 'com a vara: acha na hora' : 'Percepção, CD 15',
        motivo: longe(5) ?? (vara ? null : jaBuscou('cisterna', { x: 0, y: 0 })),
        fazer: async () => {
          if (!vara) marcarBusca('cisterna', { x: 0, y: 0 });
          const t = vara ? null : teste(c, 'percepcao', 15);
          if (vara || t.passou) {
            salvo.bolsa = true;
            guardar(c, 'pocaoDeCura', 1); guardar(c, 'pocaoDeInvisibilidade', 1); guardar(c, 'moedaDeOuro', 50); guardar(c, 'roupaDeViagem', 1);
            await painel(`Um fio que não devia estar ali desce pela pedra e some na água. Puxado, traz uma bolsa de couro encerado, pingando: dentro, roupa limpa e seca, 50 peças de ouro, uma poção de cura e outra de invisibilidade. Um jeito pronto de sumir. ${c.name} guarda.`, t ? { teste: t } : {});
          } else {
            await painel('Água limpa e gelada, três metros de fundo. Se tem alguma coisa lá, não dá para ver de cima.', { teste: t });
          }
        },
      });
    }

    // Área 3: procurar armadilha e o parapeito.
    if (dentro(tile, 21, 9, 28, 10) && !salvo.fossoVisto) {
      ops.push({
        rotulo: 'Procurar armadilhas', icone: 'acao-procurar', detalhe: 'Percepção, CD 15',
        motivo: longe(15) ?? jaBuscou('armadilha', { x: 0, y: 0 }),
        fazer: async () => {
          marcarBusca('armadilha', { x: 0, y: 0 });
          const t = teste(c, 'percepcao', 15);
          if (t.passou) { salvo.fossoVisto = true; marcarFosso(); app.refresh(); }
          await painel(t.passou
            ? 'A poeira no meio do corredor tem um desenho estranho: as lajes ali não assentam, estão por cima de tábuas. Um fosso coberto. Pelo lado sul sobra uma faixa de laje por onde se passa, um de cada vez.'
            : 'Poeira grossa, colunas falsas, as portas de cobre no fundo. Nada de estranho.', { teste: t });
        },
      });
    }
    if (salvo.fossoVisto && (tile.y === 9 || tile.y === 10) && (tile.x === 22 || tile.x === 25) && distanceFt(c.pos, tile) <= 5) {
      const lado = c.pos.x <= 22 ? 25 : 22;
      ops.push({
        rotulo: 'Passar pelo parapeito', icone: 'acao-disparada', detalhe: 'Acrobacia, CD 10 · falhando, Destreza CD 15',
        fazer: async () => {
          const t = teste(c, 'acrobacia', 10);
          if (t.passou) {
            const p = casaPerto({ x: lado, y: tile.y });
            c.pos = { ...c.pos, x: p.x, y: p.y };
            await painel(`${c.name} passa colado na parede, de lado, pelo parapeito estreito.`, { teste: t });
            await xpDoFosso();
          } else {
            const r = enc.resistencia(c, 'dex', 15);
            if (r.success) {
              await painel(`O pé de ${c.name} escorrega no parapeito — e a mão acha a borda. ${c.name} volta para trás.`, { teste: t });
            } else {
              const dano = enc.rng.die(6) + enc.rng.die(6);
              enc.applyDamage(c, dano, 'concussão');
              if (!c.dead) addCondition(c, 'caido');
              await painel(`${c.name} escorrega e cai no fosso (${dano} de dano). Leva um tempo para escalar de volta.`, { teste: t });
              await xpDoFosso();
            }
          }
          app.refresh();
        },
      });
    }

    // Área 4: a senha, o manto e os sarcófagos.
    if (grupos.cripta && pendentes().includes(grupos.cripta) && salvo.sabeSenha && dentro(tile, 15, 4, 21, 11)) {
      ops.push({
        rotulo: `Dizer "${SENHA}"`, icone: 'acao-ajudar', detalhe: 'a senha dos esqueletos',
        fazer: async () => { grupos.cripta.senha = true; await painel(`— ${SENHA}. Os esqueletos ficam onde estão, olhando para lugar nenhum.`); },
      });
    }
    if (sup === 'sarcofago' && dentro(tile, 16, 5, 19, 10)) {
      const chave = `${tile.x},${tile.y}`;
      if (!salvo.aneis.includes(chave)) {
        ops.push({
          rotulo: 'Abrir o sarcófago', icone: 'acao-usarObjeto', motivo: longe(5) ?? (grupos.cripta && pendentes().includes(grupos.cripta) && !grupos.cripta.senha ? 'os esqueletos ainda estão de pé' : null),
          fazer: async () => {
            salvo.aneis.push(chave);
            guardar(c, 'anelDePlatina', 1);
            await painel(`A tampa de pedra, entalhada com um rosto nobre, desliza com esforço. Ossos, pano podre — e, entre os dedos, um anel de sinete de platina. ${c.name} guarda.`);
          },
        });
      }
    }

    // Área 5: as celas.
    const cela = Object.values(MANSAO.jaulas).find((j) => j.x === tile.x && j.y === tile.y);
    if (cela && !salvo.celas) {
      const libertar = async (texto, t) => {
        salvo.celas = true;
        salvo.presosLivres = true;
        await painel(texto, t ? { teste: t } : {});
        const fim = await app.conversarCom(presos[1] ?? presos[0], arvoreDendrar);
        void fim;
      };
      const motivoGuarda = grupos.jaulas && pendentes().includes(grupos.jaulas) ? 'os guardas ainda estão aqui' : null;
      if (salvo.temChave) {
        ops.push({ rotulo: 'Abrir as celas com a chave', icone: 'acao-usarObjeto', motivo: longe(5) ?? motivoGuarda,
          fazer: () => libertar('A chave de ferro abre as duas celas. A família sai devagar, sem acreditar.') });
      }
      ops.push({
        rotulo: 'Forçar as trancas', icone: 'acao-usarObjeto', detalhe: 'ferramentas de ladrão · Destreza, CD 10',
        motivo: longe(5) ?? motivoGuarda ?? (tem(c, 'ferramentasDeLadrao') ? null : `${c.name} não tem ferramentas de ladrão`),
        fazer: async () => {
          const t = teste(c, 'prestidigitacao', 10);
          if (t.passou) await libertar(`${c.name} abre as duas trancas simples com as gazuas.`, t);
          else await painel('As trancas não cedem.', { teste: t });
        },
      });
      ops.push({
        rotulo: 'Arrancar as portas', icone: 'acao-empurrar', detalhe: 'Força, CD 22', motivo: longe(5) ?? motivoGuarda,
        fazer: async () => {
          const t = teste(c, 'atletismo', 22);
          if (t.passou) await libertar(`${c.name} arranca as portas das celas das dobradiças.`, t);
          else await painel('As grades nem se mexem.', { teste: t });
        },
      });
    }

    // Área 6 e 7: o que se leva.
    if (sup === 'mantimentos' && dentro(tile, 18, 2, 19, 3) && salvo.trancadaAberta && salvo.mantos < 12) {
      ops.push({
        rotulo: 'Pegar mantos vermelhos', icone: 'acao-usarObjeto', detalhe: 'uma dúzia pendurada na porta', motivo: longe(5),
        fazer: async () => {
          const n = Math.min(herois().length, 12 - salvo.mantos);
          salvo.mantos += n;
          guardar(c, 'mantoVermelho', n);
          await painel(`Armas enfileiradas para um bando maior do que este, e uma pilha de mantos vermelhos dobrados num canto. ${c.name} pega ${n}.`);
        },
      });
    }
    if (sup === 'mantimentos' && dentro(tile, 12, 2, 14, 4) && !salvo.peles) {
      ops.push({
        rotulo: 'Revirar o depósito', icone: 'acao-procurar', motivo: longe(5),
        fazer: async () => {
          salvo.peles = true;
          guardar(c, 'pelesDeCastor', 30);
          await painel(`Debaixo de caixas vazias e palha, um fardo amarrado com corda boa: trinta peles de castor curtidas. Mercadoria de caravana, com certeza não comprada. ${c.name} guarda.`);
        },
      });
    }

    // Área 8: a ponte, descer e subir a fenda, o baú.
    if (sup === 'ponte' && !salvo.ponteSulCaiu) {
      ops.push({
        rotulo: 'Examinar a ponte', icone: 'acao-procurar', detalhe: 'Investigação, CD 15',
        motivo: longe(10) ?? jaBuscou('ponte'),
        fazer: async () => {
          marcarBusca('ponte');
          const t = teste(c, 'investigacao', 15);
          const sul = tile.y === MANSAO.pontes.sul;
          await painel(t.passou
            ? (sul ? 'As tábuas desta ponte estão podres por baixo, e as amarras, quase soltas. Não aguenta ninguém.' : 'Tábuas velhas, mas firmes. Esta aguenta.')
            : 'Tábuas sem corrimão sobre o escuro. Parece ponte.', { teste: t });
        },
      });
    }
    const naFenda = NA_FENDA(f, c.pos);
    if (!naFenda && NA_FENDA(f, tile) && distanceFt(c.pos, tile) <= 5) {
      ops.push({ rotulo: 'Descer na fenda', icone: 'acao-levantarSe', detalhe: '6 m de parede áspera · sem teste',
        fazer: async () => { c.pos = { ...c.pos, x: tile.x, y: tile.y }; await painel(`${c.name} desce pela parede áspera da fenda. Lá embaixo o ar é frio demais, e cheira a carne velha.`); app.refresh(); } });
    }
    if (naFenda && f.surfaceAt(tile.x, tile.y) === 'caverna' && distanceFt(c.pos, tile) <= 5) {
      ops.push({ rotulo: 'Subir da fenda', icone: 'acao-levantarSe', detalhe: 'parede fácil · sem teste',
        fazer: async () => { const p = casaPerto(tile); c.pos = { ...c.pos, x: p.x, y: p.y }; app.refresh(); await depoisDeMover(c); } });
    }
    if (naFenda && !salvo.bauVigia && Math.abs(c.pos.y - MANSAO.pontes.norte) <= 1) {
      ops.push({
        rotulo: 'Puxar o baú escondido', icone: 'acao-usarObjeto', detalhe: 'debaixo da ponte do norte',
        fazer: async () => {
          audio.play('chestOpen');
          salvo.bauVigia = true;
          guardar(c, 'moedaDePrata', 160); guardar(c, 'moedaDeOuro', 120); guardar(c, 'malaquita', 5);
          guardar(c, 'pocaoDeCura', 2); guardar(c, 'pergaminhoDeAuguro', 1);
          (c.weapons ??= []).push('talon');
          const h = teste(c, 'historia', 15);
          await painel([
            'Lá embaixo, entre ossos roídos, o vigia guardava o que juntou: um baú de madeira gasto. Mais adiante, meio coberto de pedra, o corpo de Thel Dendrar.',
            `No baú: 160 peças de prata, 120 de ouro, cinco malaquitas, duas poções de cura, um pergaminho de augúrio — e uma espada longa que ninguém ali devia saber usar, com um falcão no copo e o nome Talon gravado na lâmina. ${c.name} guarda tudo.`,
            h.passou ? 'O nome lembra uma história velha da família Tresendar: um cavaleiro, o Falcão Negro, caiu nestes porões segurando os orcs de uma invasão. Era a espada dele.' : null,
          ].filter(Boolean), { teste: h });
        },
      });
    }

    // Área 10: o dinheiro da mesa.
    if (sup === 'mesa' && NA_ESTAR(tile) && grupos.estar?.vencido && !salvo.mesa) {
      ops.push({
        rotulo: 'Recolher o dinheiro da mesa', icone: 'acao-usarObjeto', motivo: longe(5),
        fazer: async () => {
          salvo.mesa = true;
          guardar(c, 'moedaDeCobre', 75); guardar(c, 'moedaDePrata', 55); guardar(c, 'moedaDeOuro', 26); guardar(c, 'brincosDeRubi', 1);
          await painel(`Espalhado entre copos virados: 75 peças de cobre, 55 de prata, mais ouro e electro que somam 26 de ouro, e um par de brincos com um rubi do tamanho de uma lentilha — alguém apostou o que não era dele. As pedrinhas, aliás, são viciadas. ${c.name} guarda.`);
        },
      });
    }

    // Área 11: os livros e os reagentes.
    if ((sup === 'mesa' || sup === 'mantimentos') && NA_OFICINA(tile) && !salvo.reagentes) {
      ops.push({
        rotulo: 'Vasculhar a oficina', icone: 'acao-procurar', motivo: longe(5),
        fazer: async () => {
          salvo.reagentes = true;
          guardar(c, 'reagente', 3);
          if (camp.vila) (camp.vila.pistas ??= []).push('O diário de Urmon, em anão, achado na oficina do Cajavidro: Urmon procurava uma maça sagrada de Lathander, a Invocadora da Luz, que sumiu junto com a Mina Perdida de Phandelver e a Forja das Magias.');
          await painel([
            'Vidraria por toda parte, metade dela suja de um resíduo prateado. Alguém aqui tenta uma receita difícil e erra há semanas. Entre os livros, um caderno de capa de couro escrito em anão.',
            `O dono assinava Urmon. As últimas páginas são de alguém obcecado: uma maça de Lathander, a Invocadora da Luz, que teria se perdido junto com a Mina Perdida de Phandelver e a sua Forja das Magias. ${c.name} guarda o caderno e três frasquinhos de reagentes raros.`,
          ]);
        },
      });
    }

    // Área 12: o baú e a carta.
    if (sup === 'bau' && NO_QUARTO(tile) && !salvo.bauIarno) {
      ops.push({
        rotulo: 'Abrir o baú', icone: 'acao-usarObjeto',
        motivo: longe(5) ?? (grupos.cajavidro && pendentes().includes(grupos.cajavidro) ? 'o dono ainda está aqui' : null),
        fazer: async () => {
          audio.play('chestOpen');
          salvo.bauIarno = true;
          guardar(c, 'moedaDePrata', 180); guardar(c, 'moedaDeOuro', 130); guardar(c, 'cornalina', 5);
          guardar(c, 'peridoto', 2); guardar(c, 'perola', 1); guardar(c, 'pergaminhoDeEnfeiticar', 1); guardar(c, 'pergaminhoDeBolaDeFogo', 1);
          await painel(`A parte do chefe, separada com cuidado: 180 peças de prata, 130 de ouro, uma bolsinha de seda com cinco cornalinas, dois peridotos e uma pérola grande, e dois pergaminhos enrolados — Enfeitiçar Pessoa e Bola de Fogo. ${c.name} guarda.`);
        },
      });
    }
    if (sup === 'mesa' && NO_QUARTO(tile) && !salvo.carta) {
      ops.push({
        rotulo: 'Ler os papéis da mesa', icone: 'acao-procurar', motivo: longe(5),
        fazer: async () => {
          salvo.carta = true;
          if (camp.vila) {
            (camp.vila.pistas ??= []).push('O bilhete do Aranha Negra ao Cajavidro: gente nova vem a Phandalin, talvez mandada pelos anões; viva ou morta, tanto faz. E qualquer mapa anão vai para ele, sem demora.');
            (camp.vila.feito ??= {}).cartaDoCajavidro = true;
          }
          await painel([
            'Contas, listas de compras, um rascunho de discurso para a vila — e, dobrado debaixo do tinteiro, um bilhete curto com uma aranha desenhada no lugar da assinatura.',
            'Gente nova vem a Phandalin, diz o bilhete, e pode ser que os anões a mandem. Que não cheguem a incomodar: presos ou mortos, tanto faz. E se aparecer qualquer mapa anão, vai para a aranha, sem demora. A última linha é gentil demais para não ser ameaça.',
            '(A Halia, do Câmbio de Minério, queria papéis daqui.)',
          ]);
        },
      });
    }

    // Saída: de volta a Phandalin.
    const saida = Object.values(MANSAO.entradas).find((e) => e.x === tile.x && e.y === tile.y);
    if (saida) {
      ops.push({ rotulo: 'Voltar a Phandalin', icone: 'acao-disparada', detalhe: 'o que caiu fica caído', motivo: longe(10),
        fazer: () => sair() });
    }
    return ops;
  }

  // ------------------------------------------------------------- saída ----
  async function sair() {
    estado.encerrado = true;
    const vila = (camp.vila ??= {});
    const feitos = (camp.feitos ??= {});
    // A gangue cai quando o chefe sai de cena: morto, preso ou fugido.
    if (salvo.iarno === 'morto' || salvo.iarno === 'preso') feitos.cajavidro = true;
    if (salvo.iarno) feitos.marcarrubra = true;
    const vivos = presos.filter((p) => !p.dead);
    const texto = [];
    if (salvo.presosLivres && vivos.length && !salvo.dendrarEntregues) {
      salvo.dendrarEntregues = true;
      vila.dendrarLivres = true;
      app.xpPendente = { xp: (app.xpPendente?.xp ?? 0) + 100, motivo: [app.xpPendente?.motivo, 'Os Dendrar de volta para casa'].filter(Boolean).join('; ') };
      texto.push('A família Dendrar sai do escuro com vocês e chora ao ver o céu.');
    }
    if (salvo.iarno === 'preso' && !salvo.iarnoEntregue) {
      salvo.iarnoEntregue = true;
      vila.iarnoPreso = true;
      texto.push('O Cajavidro vai amarrado, reclamando da corda.');
    }
    await narrar(root, { formato: 'painel', paginas: [{ texto: texto.length ? texto : ['Vocês sobem a escada para o ar da noite.'] }] });
    app.irParaVila(enc.combatants.filter((c) => c.side === 'party' && !c.dead));
  }

  /** Clicando no próprio herói: vestir o manto vermelho. */
  function interacoesDoHeroi(c) {
    if (!estado.explorando || !tem(c, 'mantoVermelho') || c.mantoVermelho) return [];
    return [{ rotulo: 'Vestir o manto vermelho', icone: 'acao-usarObjeto', detalhe: 'passa por um Marcarrubra — para quem não olha direito',
      fazer: async () => { c.mantoVermelho = true; await painel(`${c.name} joga o manto vermelho encardido nos ombros.`); } }];
  }

  return {
    lugar: 'Esconderijo dos Marcarrubra',
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    ganchosMagicos,
    espiou,
    interacoesDoHeroi,
    depoisDeMover,
    fimDoCombate,
    evento,
    dialogoDe,
    depoisDaConversa: () => {},
    motivoSemDescanso: (tipo) => {
      if (!estado.explorando) return 'só fora da luta';
      if (tipo === 'longo') return 'oito horas aqui embaixo, com essa gente? Durmam na vila';
      return null;
    },
    textoDoDescanso: () => ['Uma hora encostados numa porta fechada, revezando quem escuta.'],
    async iniciar() {
      prepararExploracao();
      const tunel = (config.cenaDaVila ?? '') === 'mansaoTunel';
      await narrar(root, { formato: 'painel', paginas: [{ texto: tunel
        ? ['O buraco que o Carp achou fica no meio das moitas, a uns trinta metros da mansão. O túnel desce em curva, cheirando a terra e a outra coisa, mais podre, e termina numa caverna funda.']
        : ['Na cozinha caída da mansão, uma escada de pedra desce para o escuro. Lá embaixo, uma porta de madeira com ferragens — destrancada.'] }] });
    },
  };
}
