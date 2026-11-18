// O ESCONDERIJO DOS MARCARRUBRA, embaixo da Mansão Tresendar (Parte 2 da
// aventura, áreas 1-12). Mapa em `game/mansao.js`.
//
// As REGRAS de cada área seguem o livro (quem está onde, testes, CDs,
// tesouros, XP); o TEXTO é nosso.
//
//   geral     portas secretas: Percepção passiva 15 a 3 m acha sem procurar;
//             procurando, Percepção CD 10. A porta do depósito de armas (6)
//             está trancada: chave (Nosk ou o Cajavidro), ferramentas de
//             ladrão com Destreza CD 10, ou Força CD 20 para derrubar.
//   área 1    porão com cisterna. A porta para o 2 está fechada. Revirar os
//             barris faz barulho: os três da área 2 abrem a porta e vêm de
//             mansinho (surpresa se ninguém os ouvir). No fundo
//             da cisterna, a bolsa de fuga do Cajavidro (Percepção CD 15, ou
//             na hora com uma vara).
//   área 3    o fosso escondido no meio do corredor (Percepção CD 15 acha).
//             O fosso ocupa as duas fileiras do corredor (2 x 2 casas, de parede
//             a parede); pela beirada dá para se espremer com Acrobacia CD 10,
//             ou saltar por cima. Quem cai: Destreza CD 15
//             para se agarrar; senão 2d6 e caído. 100 XP por passar.
//   área 4    seis esqueletos (o Obelisco; na Mina, três) atacam quem chega a 6 m da porta das jaulas ou
//             da do depósito de armas — menos quem veste o manto vermelho ou
//             diz a senha. Nos três sarcófagos, um anel de platina cada.
//   área 5    três Rufiões Marcarrubra (o Obelisco; na Mina, dois) e a família Dendrar nas jaulas (abrir: chave,
//             ferramentas CD 10 ou Força 22). Luta na cripta os põe de tocaia.
//   área 8    a fenda, duas pontes e o vigia de um olho só, que prefere
//             negociar a lutar (prometam comida). A ponte do sul quebra com
//             qualquer um em cima (Investigação CD 15 percebe). No fundo, o
//             baú do vigia, com a espada Talon.
//   área 9    quatro bugbears (o Obelisco) e Droop, o goblin, que desmaia quando o grupo
//             entra — e que qualquer herói encostado nele acorda com uma ação,
//             como o livro manda (antes só o saque do Nosk o acordava, e quem
//             não revirasse nada ficava com o informante dormindo para
//             sempre). Nosk carrega a chave. Os quatro estão de pé: o bugbear
//             que dormia até a quarta rodada era decisão nossa, trocada pelo livro em 2026-11-08. Quem
//             veste o manto vermelho pode tentar enganá-los (Enganação CD 15,
//             "o Cajavidro nos mandou") e apertar um deles (Intimidação CD 15).
//   área 10   quatro bêbados no jogo de pedrinhas, dois Rufiões e dois bandidos (o Obelisco): quem entra os
//             pega de surpresa (sem teste). De manto vermelho, dá para se
//             passar por recruta (Enganação CD 10) e conversar antes.
//   área 11   ZEOND, o quasit do Cajavidro, é o alarme dele (o Obelisco; na
//             Mina era um rato de 1 PV). Está no tabuleiro desde sempre — em
//             (4,4), lado neutro e INVISÍVEL (`encounter.js` `foesMansao`).
//             Vivo, ele avisa SEMPRE: o livro não dá chance de passar por ele,
//             e a planta concorda — medido, nenhuma casa de fora da oficina tem
//             linha de visão até (4,4), então não há como abatê-lo antes de
//             entrar. Quem não quer o aviso usa a passagem secreta do 7, que é
//             a alternativa do próprio livro, e a régua avisa antes do passo.
//             Morto ou desacordado, porém, ele não avisa nada.
//             Quem chega ao quarto pela secreta encontra o Zeond lá também: ele
//             entra na luta do lado do mestre, invisível, e escolhe o mais
//             ferido (`ai.js turnoInvisivel`). Acabada a luta, se ainda vive,
//             some pela parede — não fica para segurar a sala sozinho.
//             Avisado, ele foge no tabuleiro pela porta secreta do quarto, pelo
//             depósito (7) e pela caverna (8) até a porta secreta da cisterna
//             (1), seis casas por vez que o grupo anda. O quarto é só dele, como
//             no livro (os dois guarda-costas nossos saíram em 2026-11-08). Quem o alcança o vê beber um frasco e sumir
//             (invisível): a luta é dele. Pela passagem secreta do 7, ou com o
//             familiar resolvido, dá para pegá-lo de surpresa. Com 8 PV ou menos,
//             ele se rende.
//
// ARMADILHAS PELO CAMINHO: o fosso escondido e a ponte podre param o passo
// na casa onde ele pisa (`enc.paraNaCasa`), dentro e fora da luta, e para
// qualquer lado.
//
// O estado mora em `app.campanha.mansao` e sobrevive a sair e voltar: o que
// caiu fica caído, o que se abriu fica aberto.

import { narrar } from '../view/narrativa.js';
import { d20 } from '../core/dice.js';
import { skillBonus, passivePerception, SKILL_NAME, spellSaveDc, abilityMod, rolarPericia, percepcaoParaSecreta, achaSecretaComVantagem } from '../rules/abilities.js';
import { Battlefield, ARESTA, distanceFt, isAdjacent, SUPERFICIES } from '../core/grid.js';
import { podeVer, visaoNoEscuro, emiteLuz } from '../rules/luz.js';
import { addCondition, removeCondition, hasCondition } from '../rules/conditions.js';
import { darXp } from './nivel.js';
import { audio } from '../core/audio.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { MANSAO } from './mansao.js';
import { alternarRegiao } from '../rules/regioes.js';
import { criarBuscas } from './buscas.js';
import { ctxDe } from './magias-fora.js';
import { rolarTeste, disfarcado, disfarceDe, ativaDe } from '../rules/utilidade.js';
import { guardar } from './comercio.js';
import { garantirInventario } from '../rules/equipment.js';
import { grupoTem } from './saque.js';

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
const NA_OFICINA = (p) => dentro(p, 2, 2, 5, 5);
const NO_QUARTO = (p) => dentro(p, 6, 2, 9, 4);
const NA_ESTAR = (p) => dentro(p, 2, 7, 6, 11);
const NO_PORAO = (p) => dentro(p, 20, 12, 27, 17);
const PORTAS_DA_CRIPTA = [{ x: 19, y: 5 }, { x: 16, y: 5 }];       // as casas da cripta junto das portas para o 5 e para o 6
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
    aneis: [], mesa: false, mesaVirada: false, reagentes: false, peles: false, mantos: 0,
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
    g.furtividade = g.membros.filter((f) => f.side === 'foes').map((f) => rolarPericia(enc.rng, f, 'furtividade').total);
    if (salvo.vencidos.includes(g.id)) g.vencido = true;
  }
  if (salvo.tregua && grupos.fenda) grupos.fenda.tregua = true;
  // O Cajavidro fugido (ou preso, ou morto) de uma visita anterior não volta.
  if (salvo.iarno && grupos.cajavidro) grupos.cajavidro.vencido = true;
  const iarno = grupos.cajavidro?.membros[0];
  const zeond = grupos.familiar?.membros[0];
  // Invisível desde o começo: é assim que o Obelisco o põe na oficina, e é o que impede de abatê-lo de longe.
  if (zeond && !zeond.dead && !hasCondition(zeond, 'invisivel')) {
    addCondition(zeond, 'invisivel', { rounds: Infinity, source: zeond.id, data: { escondido: true } });
  }
  const vigia = grupos.fenda?.membros[0];
  const droop = grupos.guardas?.membros.find((f) => f.defId === 'droop');
  const mosk = grupos.guardas?.membros.find((f) => f.name === 'Nosk');
  /**
   * O Cajavidro sai do grupo do quarto quando foge: os dois guarda-costas ficam no quarto como grupo próprio
   * (`guardaCostas`, sem XP), e o grupo `cajavidro` passa a ser só ele, o que o grupo alcança na fuga.
   */
  function separarGuardas() {
    const g = grupos.cajavidro;
    if (!g || grupos.guardaCostas || !iarno) return;
    const guardas = g.membros.filter((m) => m !== iarno);
    if (!guardas.length) return;
    g.membros = [iarno];
    for (const m of guardas) m.grupo = 'guardaCostas';
    grupos.guardaCostas = {
      id: 'guardaCostas', membros: guardas, ativo: false, vencido: salvo.vencidos.includes('guardaCostas'),
      furtividade: guardas.map((f) => rolarPericia(enc.rng, f, 'furtividade').total),
    };
  }
  if (salvo.iarno === 'fugiu') separarGuardas();
  const presos = (grupos.jaulas?.membros ?? []).filter((f) => f.preso);
  for (const p of presos) p.ficha = 'mirna';    // quem responde pela família presa é ela
  const estado = {
    explorando: false, encerrado: false, lutando: null,
    fuga: null,               // a fuga do Cajavidro em curso: { rota, i }
    iarnoAvisado: Boolean(salvo.iarno), alojamentoVem: false,
    familiarResolvido: false, // o Zeond já foi morto, ou já falhou em notar o grupo: não avisa mais
    de: new Map(),            // de onde cada um veio no último passo
  };

  const herois = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead && c.hp > 0);
  const hostis = (g) => (g?.membros ?? []).filter((f) => f.side === 'foes' && !f.dead && !f.fugiu);
  const pendentes = () => Object.values(grupos).filter((g) => g.id !== 'familiar' && !g.ativo && !g.vencido && !g.tregua && !g.fuga && hostis(g).length);
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
  /** Muda uma aresta entre as duas casas do par `{ a, b }` (porta aberta, parede que some). */
  function mudarAresta(par, codigo, { som = true } = {}) {
    // Pedra arrastando por 1,2 s. O padrao e TOCAR, e so as tres chamadas que
    // repoem o que ja estava aberto passam `som: false`: com o padrao
    // invertido, uma porta nova esquecida entraria muda, e o erro silencioso
    // e o que nao se descobre jogando.
    if (som) audio.play('doorStone');
    enc.field.porAresta(par.a.x, par.a.y, par.b.x, par.b.y, codigo);     // a visão do grupo recalcula (a versão sobe)
  }
  /** As celas soltas (área 5): as grades (arestas de barra) somem, e a família sai. */
  function abrirCelas({ som = true } = {}) {
    for (const pares of Object.values(MANSAO.celas)) for (const par of pares) mudarAresta(par, ARESTA.nada, { som: false });
    if (som) audio.play('doorStone');
  }
  function abrirPorta(nome, opcoes) {
    mudarAresta(MANSAO.portas[nome], ARESTA.aberta, opcoes);
    if (!salvo.portas.includes(nome)) salvo.portas.push(nome);
  }
  function abrirSecreta(nome, opcoes) {
    mudarAresta(MANSAO.secretas[nome], ARESTA.aberta, opcoes);
    if (!salvo.secretas.includes(nome)) salvo.secretas.push(nome);
  }
  function abrirTrancada(opcoes) {
    mudarAresta(MANSAO.trancada, ARESTA.aberta, opcoes);
    salvo.trancadaAberta = true;
  }
  /** O herói está numa das duas casas que a porta liga (as portas são arestas: o clique cai na casa de um dos lados)? */
  const naPorta = (par, tile) => [par.a, par.b].some((q) => q.x === tile.x && q.y === tile.y);
  /** A casa de uma porta mais perto de `p`, para medir alcance e distância. */
  const casaDaPorta = (par, p) => (distanceFt(p, par.a) <= distanceFt(p, par.b) ? par.a : par.b);
  /** O herói em `p` pode mexer na porta: está numa das duas casas dela, ou encostado numa delas sem parede no meio. */
  const alcancaPorta = (par, p) => {
    const k = casaDaPorta(par, p);
    return (k.x === p.x && k.y === p.y) || (distanceFt(p, k) <= 5 && enc.field.passa(p.x, p.y, k.x, k.y));
  };
  /** A secreta está ao alcance de quem está em `p`: a 3 m da casa dela E com a casa à vista (não através de parede). */
  const secretaAoAlcance = (s, p) => {
    const k = casaDaPorta(s, p);
    return distanceFt(p, k) <= 10 && ((k.x === p.x && k.y === p.y) || enc.field.hasLineOfSight(p, k));
  };
  /** O nome da sala de uma casa, para o menu das portas ("para a oficina"). */
  const NOME_DA_SALA = {
    oficina: 'a oficina', quartoMago: 'o quarto do Cajavidro', estarRubro: 'a sala de estar', guardasBugbear: 'o alojamento dos bugbears',
    corredorNorte: 'o corredor de cima', corredorSul: 'o corredor do sul', corredorArmas: 'o corredor do depósito de armas', armas: 'o depósito de armas',
    cripta: 'a cripta', jaulas: 'as jaulas', corredorFosso: 'o corredor do fosso', poraoCisterna: 'o porão', entrada: 'a escada da cozinha',
    alojamentoRubro: 'o alojamento', deposito: 'o depósito', escadaSecreta: 'a escadinha',
  };
  const nomeDaSala = (p) => NOME_DA_SALA[Object.keys(MANSAO.salas).find((n) => MANSAO.salas[n].some((q) => q.x === p.x && q.y === p.y))] ?? 'a outra sala';

  // As PORTAS COMUNS da planta (as das salas e dos corredores) nascem fechadas e abrem e fecham de graça, como as do castelo: a
  // porta fechada corta a visão, e é assim que o grupo some de um corredor ou segura um bando numa sala.
  salvo.portasComuns ??= {};
  const chaveDoPar = (par) => `${par.a.x},${par.a.y},${par.b.x},${par.b.y}`;
  for (const par of MANSAO.portasComuns) {
    const aberta = salvo.portasComuns[chaveDoPar(par)];
    if (aberta !== undefined) enc.field.porAresta(par.a.x, par.a.y, par.b.x, par.b.y, aberta ? ARESTA.aberta : ARESTA.porta);
  }
  /** Abrir ou fechar as portas comuns encostadas na casa `tile` (o clique cai numa casa de um dos lados da porta). */
  function opsDePortaComum(c, tile) {
    const ops = [];
    for (const par of MANSAO.portasComuns) {
      if (!naPorta(par, tile)) continue;
      const outro = par.a.x === tile.x && par.a.y === tile.y ? par.b : par.a;
      const fechada = enc.field.aresta(par.a.x, par.a.y, par.b.x, par.b.y) === ARESTA.porta;
      const alguemNaPassagem = enc.combatants.some((o) => !o.dead && o !== c && o.pos && naPorta(par, o.pos));
      ops.push({
        rotulo: fechada ? 'Abrir a porta' : 'Fechar a porta',
        icone: fechada ? 'acao-usarObjeto' : 'acao-empurrar',
        detalhe: `${fechada ? 'de graça' : 'corta a visão'} · para ${nomeDaSala(outro)}`,
        motivo: (alcancaPorta(par, c.pos) ? null : 'longe demais — chegue à porta') ?? (!fechada && alguemNaPassagem ? 'tem alguém na passagem' : null),
        fazer: async () => {
          salvo.portasComuns[chaveDoPar(par)] = fechada;
          mudarAresta(par, fechada ? ARESTA.aberta : ARESTA.porta, { som: false });
          enc.say('acao', fechada ? `${c.name} empurra a porta, que cede com um rangido.` : `${c.name} fecha a porta e encosta o ombro nela até o trinco pegar.`);
          app.refresh();
          if (fechada) await depoisDeMover(c);
        },
      });
    }
    return ops;
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
      f.heights[i] = 0;                   // seis metros abaixo do corredor (o texto da cena diz isso)
    }
    f.alternarSobreposicao?.('fossoAberto', true);       // e o desenho abre junto (a peça da FA, quando há)
    f.versao = (f.versao ?? 0) + 1;
    // aberto, ninguém mais cai pela tampa: a região (`encounter.js`) se desliga
    alternarRegiao(f, 'fosso', false);
  }
  const FLAG_PONTE = { sul: 'ponteSulCaiu', norte: 'ponteNorteCaiu' };
  function quebrarPonteSul() { quebrarPonte('sul'); }
  function quebrarPonte(lado) {
    const f = enc.field;
    const y = MANSAO.pontes[lado];
    const [x0, x1] = MANSAO.fenda[y];
    for (let x = x0; x <= x1; x++) {
      const i = y * f.w + x;
      f.surfaces[i] = SUPERFICIES.indexOf('entulho');
      f.heights[i] = 0;
      f.tiles[i] = 2;
    }
    f.objetos = (f.objetos ?? []).filter((o) => !(o.tipo === 'ponte' && o.y === y));
    f.alternarSobreposicao?.(lado === 'sul' ? 'ponteSulCaida' : 'ponteNorteCaida', true);   // as tábuas penduradas da FA
    f.versao = (f.versao ?? 0) + 1;
    salvo[FLAG_PONTE[lado]] = true;
    if (lado === 'sul') alternarRegiao(f, 'ponteSul', false);
  }
  // O que já estava aberto de outra visita.
  for (const nome of salvo.secretas) abrirSecreta(nome, { som: false });
  if (salvo.trancadaAberta) abrirTrancada({ som: false });
  if (salvo.fossoVisto) marcarFosso();
  if (salvo.ponteSulCaiu) quebrarPonteSul();
  if (salvo.ponteNorteCaiu) quebrarPonte('norte');
  for (const nome of salvo.portas) abrirPorta(nome, { som: false });
  if (salvo.celas) abrirCelas({ som: false });

  // ------------------------------------------------- armadilhas no caminho ----
  // O FOSSO E A PONTE DO SUL são REGIÕES do mapa (`encounter.js`, `rules/regioes.js`): o passo para nelas, o teste,
  // o dano, a volta para a beirada e o Procurar são do motor, para herói e monstro, na luta e explorando. A cena abre
  // o buraco, quebra a ponte, conta e dá o XP (`evento`). Explorando, o passo também para na primeira casa da oficina
  // (o Zeond vê) e na do raio da cripta: a cena resolve ali, e não depois de o herói ter atravessado a sala inteira.
  /** O que uma armadilha contou e a cena ainda vai narrar, explorando (o painel vem depois do passo). */
  let armadilhaContada = null;
  enc.paraNaCasa = (c, p) => {
    if (!estado.explorando || c.side !== 'party') return false;
    if (!estado.iarnoAvisado && !estado.familiarResolvido && iarno && !iarno.dead
      && !grupos.cajavidro?.ativo && NA_OFICINA(p)) return true;
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
    // O ZEOND ENTRA NA LUTA (o Obelisco): no quarto, se o grupo chegou pela secreta sem passar por ele; em QUALQUER
    // luta da mansão depois de ter avisado o mestre, porque ele vem seguindo o grupo, invisível, à espera de uma briga.
    // Aparece colado a um herói e continua invisível: o primeiro sinal dele é o veneno das garras.
    const zeondEntra = zeond && !zeond.dead && !zeond.fugiu
      && (zeond.seguindo || ((g.id === 'cajavidro' || g.id === 'guardaCostas') && zeond.side === 'neutro'));
    if (zeondEntra) {
      zeond.side = 'foes';
      zeond.grupo = g.id;
      estado.zeondNaLuta = true;
      if (!hasCondition(zeond, 'invisivel')) addCondition(zeond, 'invisivel', { rounds: Infinity, source: zeond.id, data: { escondido: true } });
      if (zeond.seguindo) {
        const alvo = herois()[enc.rng.die(Math.max(1, herois().length)) - 1] ?? herois()[0];
        if (alvo) zeond.pos = { ...zeond.pos, ...casaPerto(alvo.pos) };
      }
      if (!enc.combatants.includes(zeond)) enc.addCombatant(zeond);
    }
    // `som` só se ela ainda não estava aberta: quem abriu a porta e depois
    // revirou os barris chamava isto com a porta já aberta, e ela rangia duas vezes.
    if (g.id === 'alojamento') abrirPorta('alojamento', { som: !salvo.portas.includes('alojamento') });
    // O DROOP SE ESCONDE (o Obelisco: quando a briga começa, ele se esconde e fica fora dela). Sai do tabuleiro —
    // debaixo de um beliche — e volta quando a luta acaba (`fimDoCombate`). Na Mina ele desmaiava de medo.
    if (g.id === 'guardas' && droop && !droop.dead && !droop.escondido) {
      droop.escondido = true;
      const id = enc.combatants.indexOf(droop);
      if (id >= 0) enc.combatants.splice(id, 1);
      enc.say('acao', 'O goblin magrelo dá um ganido e se enfia debaixo de um beliche, de mãos na cabeça.');
    }
    // Bêbados (decisão nossa: o livro só diz que estão distraídos).
    // Bêbados: envenenado DURA. Sem duração a condição ficava para sempre, o
    // que não é regra nenhuma — e a sala media trivial (3 a 14% de PV
    // perdidos). Três rodadas é o tempo de eles acordarem para a briga.
    if (g.id === 'estar') for (const f of hostis(g)) addCondition(f, 'envenenado', { rounds: 3, quando: 'fim', lado: f.side });
    enc.emboscada = surpresa === 'deles'
      ? { emboscadores: 'foes', furtividade: g.furtividade }
      : surpresa === 'nossa!'       // surpresa AUTOMÁTICA (os bêbados, que não olham para a porta): sem teste de Furtividade
        ? { emboscadores: 'party', furtividade: herois().map(() => 99) }
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
    const r = gente.map((h) => rolarPericia(enc.rng, h, 'furtividade').total).sort((a, b) => b - a);
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

  // ------------------------------------------------- o manto vermelho ----
  /** Os heróis que o grupo `g` vê ou ouve agora. */
  const testemunhasDe = (g) => herois().filter((h) => hostis(g).some((f) => podeVer(enc, h, f) || nota(f, h)));
  /** Todos de manto (ou disfarçados), e pelo menos um: só então vale a conversa. Quem está sem manto estraga o disfarce dos outros. */
  const disfarcados = (gente) => gente.length > 0 && gente.every(vestido);

  /** A paz: os do grupo ficam no tabuleiro, de pé e neutros (não são mais inimigos), e a cena segue sem eles. */
  function fazerPaz(g) {
    g.tregua = true;
    for (const f of g.membros) {
      if (f.dead || f.preso || f.side !== 'foes') continue;
      f.side = 'neutro';
      if (!enc.combatants.includes(f)) {
        if (enc.occupied(f.pos.x, f.pos.y)) f.pos = { ...f.pos, ...casaPerto(f.pos) };
        enc.addCombatant(f);
      }
    }
    if (g.id === 'guardas' && droop && !droop.dead && !enc.combatants.includes(droop)) enc.addCombatant(droop);
    app.refresh();
  }

  /** Conversa com quem vê o manto, ANTES da luta. A árvore devolve 'luta', 'surpresa' ou 'paz'. */
  async function conversaDeManto(g, gente) {
    g.conversou = true;
    const quem = gente.find((h) => h.mantoVermelho) ?? gente[0];
    const npc = (g.id === 'guardas' ? mosk : null) ?? hostis(g)[0];
    const fim = await app.conversarCom(npc, g.id === 'estar' ? arvoreDosBebados(quem) : arvoreDosBugbears(quem));
    if (fim === 'paz') { fazerPaz(g); return; }
    await combate(g, fim === 'surpresa' ? (g.id === 'estar' ? 'nossa!' : 'nossa') : null);
  }

  // --------------------------------------------------- portas secretas ----
  /** Quem tem Percepção passiva 15 nota a porta secreta a 3 m sem procurar. */
  async function secretasPassivas(c) {
    for (const [nome, s] of Object.entries(MANSAO.secretas)) {
      if (salvo.secretas.includes(nome)) continue;
      if (!secretaAoAlcance(s, c.pos)) continue;
      // A do quarto ficou mal fechada quando o Cajavidro fugiu: fica fácil.
      const limite = nome === 'quarto' && salvo.iarno === 'fugiu' ? 10 : 15;
      if (percepcaoParaSecreta(c) < limite) continue;
      abrirSecreta(nome);
      await painel(`${c.name} repara numa junta de pedra que não fecha direito: uma porta secreta, que gira para o lado com um empurrão.`);
      app.refresh();
      return true;
    }
    return false;
  }

  // ------------------------------------------------------------ fosso ----
  /** A região do fosso disparou: o buraco abre, e a cena conta (na luta, no registro; explorando, no painel). */
  function caiuNoFosso(c, resultado) {
    salvo.fossoVisto = true;
    marcarFosso();
    const texto = resultado?.passou
      ? `As lajes cedem sob ${c.name} e somem num buraco escuro — ${c.name} se agarra na beirada e sobe de volta.`
      : `As lajes cedem e ${c.name} despenca seis metros num fosso de terra (${resultado?.dano ?? 0} de dano). Sair dali leva um tempo, mas as paredes têm onde segurar.`;
    if (estado.explorando) {
      armadilhaContada = async () => {
        await painel([texto, 'O buraco fica aberto no meio do corredor, de parede a parede: só se passa colado na beirada (Acrobacia) ou saltando por cima.']);
        if (c.side === 'party') await xpDoFosso();
      };
    } else {
      enc.say('acao', texto);
    }
  }
  /** Explorando: o painel da armadilha que disparou no passo. Devolve se havia o que contar. */
  async function contarArmadilha() {
    if (!armadilhaContada) return false;
    const contar = armadilhaContada;
    armadilhaContada = null;
    await contar();
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
    return dentro(p, 16, 5, 19, 10) && PORTAS_DA_CRIPTA.some((q) => distanceFt(p, q) <= 20);
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
  /**
   * ESTRANHA INTUIÇÃO, agora rolada. O traço do bloco é um teste RESISTIDO — a Intuição do vigia contra a
   * Enganação do alvo —, e quem perde tem um fato ou segredo lido em voz alta. No jogo o nó `intuicao` da
   * conversa era decoração: o olho dizia "um aqui mente com a boca" e nenhum dado caía, de modo que o único
   * traço próprio da criatura não existia como regra em lugar nenhum.
   *
   * O SEGREDO QUE ELE LÊ É VERDADE DO ESTADO DO JOGO, não invenção: o manto vermelho roubado em quem não é
   * Marcarrubra (e isso NÃO quebra o disfarce — o olho fala para a mesa, não para os bandidos), o cajado de
   * vidro, a chave do Nosk, a senha da cripta que o Droop contou, e, em último caso, o que trouxe o grupo aqui.
   * Quem vence a resistida ouve o olho desistir dele.
   */
  function estranhaIntuicao() {
    if (!vigia || vigia.dead) return [];
    const intuicao = d20(enc.rng, skillBonus(vigia, 'intuicao')).total;
    const linhas = [];
    for (const h of herois()) {
      const eng = rolarPericia(enc.rng, h, 'enganacao');
      if (eng.total >= intuicao) {
        linhas.push(`…este o olho não alcança… (Enganação ${eng.total} contra Intuição ${intuicao})`);
        continue;
      }
      const segredo = h.mantoVermelho ? 'veste o manto de um homem que não é ele, e o manto ainda está quente'
        : (h.weapons ?? []).includes('cajadoDeDefesa') ? 'carrega o vidro do mago, e o vidro ainda lembra de quem o segurava'
          : salvo.temChave ? 'tem no bolso a chave do peludo grande, e o peludo não a deu de presente'
            : salvo.sabeSenha ? 'sabe a palavra dos ossos, e não foi o mago que contou'
              : 'veio atrás de um homem, e vai achar menos homem do que esperava';
      linhas.push(`…este ${segredo}… (Enganação ${eng.total} contra Intuição ${intuicao})`);
    }
    return linhas;
  }

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
            { texto: 'Encarar o olho.', vai: 'intuicao', uma: true },
            { texto: 'Comida, se você deixar a gente passar.', vai: 'trato',
              requer: (ctx) => (ctx.algum((h) => tem(h, 'racoes')) ? null : 'ninguém tem rações'), },
            { texto: 'Prometo carne fresca quando o mago cair.', teste: { pericia: 'persuasao', cd: 10 }, sucesso: 'trato', falha: 'desconfia' },
            { texto: 'Sai da frente ou morre.', teste: { pericia: 'intimidacao', cd: 13 }, sucesso: 'medo', falha: 'luta' },
            { texto: 'Atacar.', fim: 'luta' },
          ],
        },
        intuicao: {
          // A Estranha Intuição do vigia, ROLADA: `estranhaIntuicao()` faz a resistida do bloco (Intuição dele
          // contra a Enganação de cada herói) e devolve, para quem perder, um segredo que é verdade do estado
          // do jogo. Era só texto antes.
          narra: 'O olho enorme se fixa em cada um, um por vez, e uma coceira fria passa por dentro da cabeça.',
          fala: () => [...estranhaIntuicao(), 'O olho sabe, e não conta. Ainda. Dá comida e o olho esquece.'],
          opcoes: [{ texto: '…', vai: 'oi' }],
        },
        // A ameaça que não pegou: a conversa acaba e a luta começa (a opção apontava para um nó que não existia).
        luta: {
          narra: 'O olho se estreita, e o corpo magro se desenrola de trás da coluna.',
          fala: '…ameaça… o olho não gosta de ameaça…',
          fim: 'luta',
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
            '…bom… bom… o olho conta. O mago de vidro dorme no oeste, depois da sala dos livros. O diabinho dele vê tudo lá… e ninguém vê o diabinho.',
            '…tem porta na pedra, no depósito do norte, que leva ao quarto dele por trás. Ele não sabe que o olho sabe.',
            '…e o mago obedece a uma aranha. Aranha preta. Manda os peludos grandes ajudar.',
          ],
          opcoes: [{ texto: 'Fique aí quieto.', fim: 'paz' }],
        },
      },
    };
  }

  /** A região da ponte do sul disparou (o dano e o tombo de todos em cima já são do motor): a ponte vira entulho. */
  function ponteSulCedeu(c, resultado) {
    quebrarPonte('sul');
    const quem = (resultado?.atingidos ?? [{ quem: c, dano: resultado?.dano ?? 0 }]).map((a) => `${a.quem.name} (${a.dano} de dano)`);
    const texto = `As tábuas estalam, racham e caem, seis metros abaixo, num monte de pedras soltas — e levam junto ${quem.join(', ')}.`;
    if (estado.explorando) armadilhaContada = () => painel(texto);
    else enc.say('acao', texto);
  }

  /** A ponte cai (rota podre ou amarras soltas): todo mundo em cima vai junto, 2d6 de dano e caído. */
  async function derrubarPonte(lado, abertura) {
    const y = MANSAO.pontes[lado];
    const [x0, x1] = MANSAO.fenda[y];
    const emCima = enc.combatants.filter((o) => !o.dead && o.pos.y === y && o.pos.x >= x0 && o.pos.x <= x1);
    quebrarPonte(lado);
    const partes = [];
    for (const o of emCima) {
      const dano = enc.rng.die(6) + enc.rng.die(6);
      enc.applyDamage(o, dano, 'concussão');
      if (!o.dead) addCondition(o, 'caido');
      partes.push(`${o.name} (${dano} de dano)`);
    }
    const texto = partes.length ? `${abertura} ${partes.join(', ')}.` : `${abertura.replace(/ — e levam junto$/, '')}.`;
    if (estado.explorando) await painel(texto); else enc.say('acao', texto);
    app.refresh();
    return true;
  }

  // ----------------------------------------------------- o Cajavidro ----
  /**
   * O ZEOND VIU ALGUÉM NA OFICINA: o mestre já sabe, e foge. Vivo, ele AVISA SEMPRE — o livro não dá chance de
   * passar por ele, e a planta concorda: a oficina são as 16 casas de x 2–5, y 2–5, e MEDIDO no motor, nenhuma
   * casa de fora dela tem linha de visão até (4,4), onde o bicho está — e ele está invisível. Não há como abatê-lo
   * antes de entrar, e
   * quem não quer o aviso usa a passagem secreta do 7 (a alternativa do próprio livro), com a régua avisando
   * antes do passo.
   *
   * Com o bicho fora de combate a oficina fica em silêncio, e o mestre, de costas: o alarme não toca sozinho.
   * Avisado o mestre, o Zeond vai com ele e sai do tabuleiro.
   */
  async function familiarAvisa(c) {
    if (estado.iarnoAvisado || estado.familiarResolvido || !iarno || iarno.dead || !NA_OFICINA(c.pos)) return false;
    if (grupos.cajavidro.ativo) return false;
    const alarme = zeond && !zeond.dead && !hasCondition(zeond, 'inconsciente') && !hasCondition(zeond, 'paralisado');
    if (!alarme) {
      estado.familiarResolvido = true;
      await painel([
        'A bancada do mago está como ele a deixou: cadinho frio, três frascos tampados, um caderno aberto.',
        zeond?.dead
          ? 'Nada se mexe nela, nem no ar em volta. Do outro lado da parede, alguém arrasta uma cadeira e continua escrevendo.'
          : 'Encolhida debaixo da bancada, uma criaturinha de chifres e asas de couro dorme um sono que não é dela. Do outro lado da parede, alguém continua escrevendo.',
      ]);
      app.refresh();
      return true;
    }
    estado.iarnoAvisado = true;
    salvo.iarno = 'fugiu';
    iarno.fugiu = false;
    separarGuardas();
    grupos.cajavidro.fuga = true;
    // O vigia, se ainda está lá, recebe ordem de emboscar quem vier atrás.
    if (grupos.fenda && pendentes().includes(grupos.fenda)) { grupos.fenda.tregua = false; grupos.fenda.emboscada = true; }
    // Ele sai pelo quarto e já está dois passos à frente: abre a porta secreta e vai.
    estado.fuga = { rota: rotaDeFuga(), i: 0 };
    if (!enc.combatants.includes(iarno)) enc.addCombatant(iarno);
    iarno.facingVec = { dx: 1, dy: 0 };
    avancarIarno(2);
    // O ZEOND NÃO VAI COM O MESTRE (o Obelisco): dado o aviso, ele SEGUE o grupo pela mansão, invisível, e espera uma
    // luta para atacar quem estiver fraco. Sai do tabuleiro agora e volta na próxima briga (`combate`).
    if (zeond && !zeond.dead) {
      zeond.seguindo = true;
      const iz = enc.combatants.indexOf(zeond);
      if (iz >= 0) enc.combatants.splice(iz, 1);
    }
    await painel([
      'Um frasco tomba sozinho na bancada. Uma risadinha aguda passa rente às cabeças de vocês, vinda do nada, e uma voz miúda grita para o outro lado da parede: — Mestre! Visita, mestre! Visita sem convite!',
      'Do outro lado da parede, uma cadeira arrasta, alguém pragueja baixinho, e uma pedra raspa em pedra. Passos apressados, que se afastam.',
      '(O Cajavidro sabe que vocês estão aqui, e está fugindo.)',
    ]);
    app.refresh();
    return true;
  }

  // ------------------------------------------------- a fuga do Cajavidro ----
  const SECRETAS_DA_FUGA = ['quarto', 'passagem', 'cisterna'];
  /**
   * O caminho dele: do quarto, pela secreta do nordeste e pela do depósito (7), pela margem leste da caverna (8) e pelo túnel
   * até a secreta da cisterna (1). Medido com as três portas abertas (e fechadas de novo em seguida: ele as abre andando).
   */
  function rotaDeFuga() {
    const f = enc.field;
    const pares = SECRETAS_DA_FUGA.map((n) => MANSAO.secretas[n]);
    const guardado = pares.map((q) => [q, f.aresta(q.a.x, q.a.y, q.b.x, q.b.y)]);
    for (const q of pares) f.porAresta(q.a.x, q.a.y, q.b.x, q.b.y, ARESTA.aberta);
    const alcance = f.reachable({ x: iarno.pos.x, y: iarno.pos.y }, 100000);
    const rota = Battlefield.pathFrom(alcance, { x: 20, y: 17 });
    for (const [q, cod] of guardado) f.porAresta(q.a.x, q.a.y, q.b.x, q.b.y, cod);
    return rota;
  }

  /** Anda `passos` casas pela rota, abrindo as secretas por onde passa. */
  function avancarIarno(passos) {
    const fg = estado.fuga;
    if (!fg) return;
    for (let k = 0; k < passos && fg.i < fg.rota.length - 1; k += 1) {
      const q = fg.rota[fg.i + 1];
      if (enc.occupied(q.x, q.y, iarno)) break;                      // um herói na frente: ele não passa
      const de = fg.rota[fg.i];
      // Passar de uma casa para a outra pela aresta de uma secreta abre a porta.
      const porta = Object.entries(MANSAO.secretas).find(([n, s]) => SECRETAS_DA_FUGA.includes(n) && !salvo.secretas.includes(n)
        && ((s.a.x === de.x && s.a.y === de.y && s.b.x === q.x && s.b.y === q.y) || (s.b.x === de.x && s.b.y === de.y && s.a.x === q.x && s.a.y === q.y)));
      if (porta) abrirSecreta(porta[0]);
      iarno.facingVec = { dx: Math.sign(q.x - de.x), dy: Math.sign(q.y - de.y) };
      iarno.pos = { ...iarno.pos, x: q.x, y: q.y };
      fg.i += 1;
    }
  }

  /** Alguém do grupo, a 3 m dele, ou que o enxerga a 9 m. */
  const alcancado = () => herois().some((h) => distanceFt(h.pos, iarno.pos) <= 10 || (distanceFt(h.pos, iarno.pos) <= 30 && podeVer(enc, h, iarno)));

  /** Cada vez que o grupo anda, ele anda seis casas. Devolve `true` quando a cena tomou o turno (luta ou fuga completa). */
  async function iarnoFoge() {
    const fg = estado.fuga;
    if (!fg || !iarno || iarno.dead) return false;
    if (!alcancado()) {
      avancarIarno(6);
      app.refresh();
    }
    if (alcancado()) return iarnoAlcancado();
    if (fg.i >= fg.rota.length - 1) return iarnoEscapa();
    return false;
  }

  /**
   * ALCANÇADO, ELE BEBE A POÇÃO — SE AINDA A TIVER. O frasco de invisibilidade dele é o da BOLSA DE FUGA, no
   * fundo da cisterna: é o plano de fuga que o livro lhe dá, roupa limpa, 50 po, uma poção de cura e uma de
   * invisibilidade, tudo num fio dentro da água. O jogo já deixa o grupo achar a bolsa (Mãos Mágicas, vara, ou
   * Percepção CD 15, com a aura de ilusão e evocação denunciando o frasquinho) e grava `salvo.bolsa` — mas
   * depois o Cajavidro "tirava um frasco do cinto" e sumia mesmo assim, bebendo o que já estava na mochila de
   * um herói. Achar o esconderijo da fuga dele antes da hora agora VALE: ele é alcançado de corpo inteiro.
   */
  async function iarnoAlcancado() {
    estado.fuga = null;
    salvo.iarno = null;
    const g = grupos.cajavidro;
    g.fuga = false;
    const temFrasco = !salvo.bolsa;
    if (temFrasco) addCondition(iarno, 'invisivel', { rounds: 10, quando: 'fim', lado: 'foes' });
    await asArmas(temFrasco
      ? ['O Cajavidro olha por cima do ombro, vê quem o segue e solta um palavrão elegante. Tira um frasco do cinto, bebe de um gole — e o corpo dele some, como tinta na água. Só o cajado de vidro denuncia onde ele está.',
        '— Eu avisei que um cavalheiro sabe quando partir. Mas não disse que ia partir sozinho.']
      : ['O Cajavidro olha por cima do ombro, vê quem o segue e enfia a mão no cinto. A mão volta vazia. Ele olha a própria mão, depois a cisterna lá atrás, e a cara dele muda de ironia para outra coisa.',
        '— Vocês mexeram na minha água. — O cajado de vidro sobe, e ele não some: não tem com o quê.']);
    await combate(g, null);
    return true;
  }

  async function iarnoEscapa() {
    const visto = herois().some((h) => podeVer(enc, h, iarno));
    estado.fuga = null;
    iarno.fugiu = true;
    const i = enc.combatants.indexOf(iarno);
    if (i >= 0) enc.combatants.splice(i, 1);
    // A bolsa de fuga dele, no fundo da cisterna, vai junto.
    const bolsa = !salvo.bolsa;
    salvo.bolsa = true;
    const texto = bolsa
      ? 'Uma laje gira, uma bolsa de couro encerado sai do fundo da cisterna e passos sobem a escada da cozinha, de dois em dois. Quando vocês chegarem lá, o Cajavidro já estará longe.'
      : 'A laje do canto da cisterna gira, passos sobem a escada da cozinha, de dois em dois. Quando vocês chegarem lá, o Cajavidro já estará longe.';
    if (visto) await painel(texto); else enc.say('acao', texto);
    app.refresh();
    return true;
  }

  // ------------------------------------------------------ depois de andar ----
  async function depoisDeMover(c) {
    if (!estado.explorando) return;
    c.movementLeftFt = MOVIMENTO;
    if (await contarArmadilha()) return;
    if (await secretasPassivas(c)) return;
    if (await iarnoFoge()) return;
    if (await familiarAvisa(c)) return;
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
      if (g.id === 'guardaCostas') {
        if (!herois().some((h) => NO_QUARTO(h.pos))) continue;
        await asArmas([
          'O quarto está vazio de dono. Dois Marcarrubra, de pé junto da cama, não parecem surpresos: foram deixados ali para segurar a porta.',
          '— O mestre mandou ficar. Quem passar, não passa.',
        ]);
        await combate(g, null);
        return;
      }
      if (g.id === 'estar') {
        const entrou = herois().find((h) => NA_ESTAR(h.pos));
        if (!entrou) continue;
        const gente = herois().filter((h) => NA_ESTAR(h.pos));
        if (!g.conversou && disfarcados(gente)) { await conversaDeManto(g, gente); return; }
        await asArmas('Uma aposta acaba de dar errado: um Marcarrubra bate o copo e os outros riem dele. Cheiro de cerveja derramada, gritaria, pedrinhas rolando — vocês estão no meio da sala antes de alguém notar que a porta abriu.');
        await combate(g, 'nossa!');
        return;
      }
      if (g.id === 'guardas' && !g.conversou) {
        const gente = testemunhasDe(g);
        if (disfarcados(gente)) { await conversaDeManto(g, gente); return; }
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
    // O Teleporte é duas vezes por dia (`porDia:passoNebuloso`, o bloco do Obelisco); o espaço de 2º fica para um bloco antigo.
    const teleportes = (iarno.resources?.['porDia:passoNebuloso'] ?? 0) + (iarno.spellcasting?.slots?.[2] ?? 0);
    if (!caido && colado && teleportes > 0) return false;
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
    // AS JAULAS (o Obelisco): caídos dois dos três Rufiões, o terceiro corre para avisar o resto do covil — e, na
    // pressa, abre a passagem secreta do depósito (7), que o grupo passa a conhecer.
    if ((ev.type === 'died' || ev.type === 'downed') && ev.target?.grupo === 'jaulas' && estado.lutando === grupos.jaulas) {
      const guardas = grupos.jaulas.membros.filter((f) => f.side === 'foes');
      const caidos = guardas.filter((f) => f.dead || f.hp <= 0).length;
      const resta = guardas.filter((f) => !f.dead && f.hp > 0 && !f.fugiu);
      if (caidos >= 2 && resta.length === 1) {
        const r = resta[0];
        r.fugiu = true;
        const i = enc.combatants.indexOf(r);
        if (i >= 0) enc.combatants.splice(i, 1);
        if (MANSAO.secretas.deposito && !salvo.secretas.includes('deposito')) abrirSecreta('deposito', { som: true });
        salvo.jaulasFugiu = true;
        enc.say('acao', `${r.name} larga a briga e corre para avisar o resto do covil — e na pressa empurra uma pedra da parede, que gira: uma passagem secreta para o depósito.`);
        setTimeout(() => { enc.checkEnd(); app.refresh(); }, 0);
      }
    }
    // Salto: quem pula o fosso de uma beirada à outra ganha o XP de passar por ele.
    if (ev.type === 'moved' && ev.salto && ev.actor.side === 'party' && salvo.fossoVisto
      && ((ev.from.x <= 22 && ev.to.x >= 25) || (ev.from.x >= 25 && ev.to.x <= 22)) && ev.to.y >= 9 && ev.to.y <= 10) {
      void xpDoFosso();
    }
    if (ev.type === 'moved' && ev.path?.length > 1) estado.de.set(ev.actor, ev.path[ev.path.length - 2]);
    // As regiões do mapa: o fosso achado (por qualquer caminho) abre; o que disparou, a cena conta.
    if (ev.type === 'regiaoDescoberta' && ev.regiao?.id === 'fosso' && !salvo.fossoVisto) {
      salvo.fossoVisto = true;
      marcarFosso();
      app.refresh();
    }
    if (ev.type === 'regiao' && ev.quando === 'entrar') {
      if (ev.regiao?.id === 'fosso') caiuNoFosso(ev.actor, ev.resultado);
      if (ev.regiao?.id === 'ponteSul') ponteSulCedeu(ev.actor, ev.resultado);
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
      // O Obelisco: 16 pp e 7 po; 12 pp e 5 po; 20 pc, 11 pe e duas granadas. O electro vira ouro e prata (5 po e 5 pp).
      guardar(quem, 'moedaDeCobre', 20); guardar(quem, 'moedaDePrata', 33); guardar(quem, 'moedaDeOuro', 17); guardar(quem, 'granada', 2);
      guardar(quem, 'mantoVermelho', 3);
      texto.push(`Nas bolsas de cinto dos três: 20 peças de cobre, 28 de prata, 12 de ouro, 11 de electro (que valem 5 de ouro e 5 de prata, e assim ficam) e duas granadas. Nos beliches, três mantos vermelhos encardidos. ${quem.name} guarda tudo.`);
    } else if (g?.id === 'guardas' && quem) {
      salvo.temChave = true;
      guardar(quem, 'moedaDePrata', 13); guardar(quem, 'gemaPequena', 5);
      texto.push(`No cinto de Nosk: 13 peças de prata, um punhado de pedras semipreciosas (umas 50 de ouro, juntas) e uma chave de ferro pesada que serve em quase toda fechadura daqui. ${quem.name} guarda.`);
      // O Droop sai do esconderijo (ou acorda, se algo o derrubou): vê os bugbears no chão e chora de alívio.
      if (droop && !droop.dead && (droop.escondido || hasCondition(droop, 'inconsciente'))) {
        if (droop.escondido) {
          droop.escondido = false;
          droop.side = 'neutro';
          if (enc.occupied(droop.pos.x, droop.pos.y)) droop.pos = { ...droop.pos, ...casaPerto(droop.pos) };
          if (!enc.combatants.includes(droop)) enc.addCombatant(droop);
        }
        removeCondition(droop, 'inconsciente');
        texto.push('De baixo de um beliche sai o goblin Droop, de quatro, vê os bugbears no chão e começa a chorar de alívio.');
      }
    } else if (g?.id === 'cajavidro') {
      if (quem) salvo.temChave = true;
      if (salvo.iarno === 'preso') texto.push('O Cajavidro está rendido, com as mãos amarradas. Ele sorri como quem espera um jantar, não uma cela.');
      else texto.push('O Cajavidro está morto. O cajado de vidro rola pelo chão sem quebrar.');
      // O saque do corpo (`game/saque.js`) pode já ter dado o cajado a alguém do grupo, vivo ou morto: peça única, uma vez só.
      if (quem && !grupoTem(enc.combatants.filter((x) => x.side === 'party'), 'cajadoDeDefesa')) (quem.weapons ??= []).push('cajadoDeDefesa');
    } else if (g) {
      texto.push(`Silêncio ${SALAS[g.id]?.em ?? 'na sala'}.`);
    }
    // O Zeond, se lutou: morto, vale o bloco dele (200 XP, o quasit de ND 1). Vivo, ele não segura a sala sozinho:
    // some pela parede e volta a seguir o grupo — a não ser que o mestre já esteja fora (morto, preso ou longe), e aí
    // ele vai embora de vez.
    let xpDoZeond = 0;
    if (estado.zeondNaLuta && zeond) {
      estado.zeondNaLuta = false;
      if (zeond.dead) {
        xpDoZeond = zeond.xp ?? 200;
        texto.push('No chão, onde nada parecia haver, aparece o corpo miúdo de um diabinho de chifres, que se desfaz em fumaça amarela.');
      } else {
        const semMestre = !iarno || iarno.dead || ['morto', 'preso'].includes(salvo.iarno) || iarno.fugiu;
        zeond.side = 'neutro';
        const iz = enc.combatants.indexOf(zeond);
        if (iz >= 0) enc.combatants.splice(iz, 1);
        if (semMestre) {
          zeond.fugiu = true;
          zeond.seguindo = false;
          texto.push('Uma risadinha passa pela sala e atravessa a parede: sem o mestre, o diabinho invisível foi embora de vez.');
        } else {
          zeond.seguindo = true;
          texto.push('Uma risadinha passa rente às cabeças de vocês e some. O que quer que fosse, não acabou: continua por perto.');
        }
      }
    }
    if (g && SALAS[g.id]) {
      // Preso, o Cajavidro vale o dobro — a outra metade quando Sildar o recebe na vila.
      const xp = SALAS[g.id].xp + xpDoZeond;
      await painel(texto.length ? texto : ['A sala é de vocês.']);
      await darXpDoLivro(xp, `${SALAS[g.id].nome[0].toUpperCase()}${SALAS[g.id].nome.slice(1)}`);
    } else if (xpDoZeond) {
      await painel(texto);
      await darXpDoLivro(xpDoZeond, 'Zeond, o diabinho do mago');
    }
    prepararExploracao();
  }

  // ------------------------------------------------------ o fio do Obelisco ----
  // A CAVERNA DA FENDA (área 8): no Obelisco, dois goblins de fora estão mortos debaixo da ponte sul — de crânio
  // comprido, em trapos —, e quem os examina vê que foram mortos por um par de garras: o nothic os pegou antes que
  // fossem adiante. O fio é o mesmo dos Cragmaw e do Sildar, e vai para o diário com a mesma abertura.
  const vila = ((app.campanha ??= {}).vila ??= { pistas: [], missoes: {} });
  const anotar = (t) => { if (!(vila.pistas ??= []).includes(t)) vila.pistas.push(t); };
  const PONTE_SUL = MANSAO.pontes.sul;
  const debaixoDaPonteSul = (p) => p.x >= MANSAO.fenda[PONTE_SUL][0] - 1 && p.x <= MANSAO.fenda[PONTE_SUL].at(-1) + 1
    && Math.abs(p.y - PONTE_SUL) <= 1;
  function pistasEm(tile) {
    if (!debaixoDaPonteSul(tile)) return [];
    return [
      {
        titulo: 'O fundo da fenda', pericias: ['percepcao'], cd: 10, alcance: 10,
        achado: 'Lá embaixo, logo debaixo da ponte do sul, dois goblins mortos. Não são os goblins que vocês já viram: o crânio deles é comprido, esticado para trás, e eles vestem trapos imundos, juntados de qualquer jeito, sem marca de bando nenhuma.',
        efeito: () => anotar('Goblins de fora: dois deles, de crânio comprido e em trapos, estão mortos debaixo da ponte sul da caverna da fenda, nos porões da Mansão Tresendar.'),
      },
      {
        titulo: 'Como morreram', pericias: ['medicina'], cd: 12, alcance: 10,
        achado: 'Não foi arma nenhuma: os dois têm o peito e a garganta abertos por quatro sulcos fundos e paralelos, de garra. Alguma coisa grande, que mora nesta caverna, pegou os dois antes que eles fossem mais longe.',
      },
    ];
  }

  // -------------------------------------------------------- conversas ----
  const arvoreDroop = {
    inicio: 'oi',
    nos: {
      // O DROOP DO OBELISCO é dos Scraptops, um clã de goblins catadores e consertadores, e não um Cragmaw.
      deOnde: {
        fala: [
          'Droop é Scraptop! Scraptop cata, Scraptop conserta. Droop veio atrás de roda e de eixo para a carroça de casa, só isso!',
          'Aí os Cragmaw acharam Droop e disseram que agora Droop é Cragmaw. Droop não quer ser Cragmaw. Droop quer ir para casa.',
        ],
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
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
          { texto: 'E você, de onde é?', vai: 'deOnde', uma: true },
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
        ao: () => {
          const pistas = camp.vila?.pistas ?? [];
          const t = 'Droop não sabe o caminho do Castelo Dentefino — sempre andou atrás dos outros —, mas jura que goblins de lá rondam Phandalin, e que um deles, pego vivo, saberia. Fica para o norte, mata adentro.';
          if (!pistas.includes(t)) pistas.push(t);
        },
        fala: 'Droop andava atrás, sempre atrás, olhando o chão! Droop não sabe o caminho. Mas os Dentefino vêm farejar a vila, Droop viu. Pega um, aperta, ele fala. É para cima, para onde a mata fica escura.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
    },
  };

  /** A sala 10, com todo o grupo de manto: eles tomam os heróis por recrutas (Enganação CD 10). */
  function arvoreDosBebados(quem) {
    return {
      inicio: 'oi',
      nos: {
        oi: {
          narra: `Quatro rostos vermelhos erguem os olhos da mesa. Um deles aponta, com o copo, para o manto de ${quem.name}.`,
          fala: '— Gente nova? O chefe não avisou de gente nova.',
          opcoes: [
            { texto: 'Foi o chefe que mandou. Somos recrutas.', teste: { pericia: 'enganacao', cd: 10 }, sucesso: 'aceitam', falha: 'desconfiam' },
            { texto: 'Atacar.', fim: 'surpresa' },
          ],
        },
        // O QUE OS MARCARRUBRA SABEM. O livro tem um quadro com esse nome, e o jogo entregava dois itens dele
        // (o mago do cajado de vidro, o bicho da fenda) num único nó. Os outros ficavam de fora: os presos nas
        // jaulas e o entalhador que eles mataram, onde está a pilhagem, e a cripta em que ninguém entra sem
        // manto. Capturar bandido para interrogar o jogo não tem (só o Cajavidro se rende, `rendeSe`), e montar
        // rendição para `marcarrubra` seria mecânica nova — então o quadro do livro sai por onde o grupo PODE
        // falar com eles: a mesa dos bêbados, de manto vermelho, com a Intimidação para o que não se oferece.
        aceitam: {
          narra: 'O riso volta à sala, mais alto. Alguém empurra um banco com o pé.',
          fala: '— Senta aí, recruta! Paga uma rodada que a gente fala do chefe.',
          opcoes: [
            { texto: 'O que vocês sabem do chefe?', vai: 'chefe', uma: true },
            { texto: 'Quem são os presos das jaulas?', vai: 'presos', uma: true },
            { texto: 'Onde fica o que vocês tomam da vila?', vai: 'pilhagem', uma: true },
            { texto: 'E a sala dos sarcófagos?', vai: 'ossos', uma: true },
            { texto: 'Apertar um deles: "Quem manda no mago?"',
              teste: { pericia: 'intimidacao', cd: 13 }, sucesso: 'acima', falha: 'desconfiam', uma: true },
            { texto: 'Derrubar a mesa e misturar as pilhas.', vai: 'mesaVirada', uma: true },
            { texto: 'Atacar enquanto estão distraídos.', fim: 'surpresa' },
            { texto: 'Sair sem briga.', fim: 'paz' },
          ],
        },
        // DERRUBAR A MESA é a distração que o próprio livro sugere na sala 10, com as pilhas de moeda do jogo
        // de pedrinhas. O jogo já vendia surpresa por "atacar enquanto estão distraídos"; o que faltava era a
        // ação nomeada, e ela custa algo: as moedas se espalham, e recolhê-las depois (o verbo `Recolher o
        // dinheiro da mesa`) passa a ser catar no chão.
        mesaVirada: {
          ao: () => { salvo.mesaVirada = true; },
          narra: 'A mesa vira com um estrondo de madeira e metal. Quatro pilhas de moeda se espalham pelo chão de laje, e quatro bandidos bêbados vão atrás delas de quatro, esbarrando uns nos outros.',
          fala: '— MINHA PILHA! Quem… quem mexeu na minha pilha?!',
          opcoes: [
            { texto: 'Atacar agora.', fim: 'surpresa' },
            { texto: 'Sair enquanto eles catam.', fim: 'paz' },
          ],
        },
        chefe: {
          fala: [
            '— O mago do cajado de vidro? Mora do lado de lá, passando a oficina. Nunca come com a gente.',
            '— E tem um bicho no fundo da caverna, de um olho só. A gente joga resto de comida de longe e não olha.',
          ],
          opcoes: [{ texto: '…', vai: 'aceitam' }],
        },
        presos: {
          fala: [
            '— A mulher do entalhador e os dois filhotes. O homem abriu a boca na praça, falou que a gente era bandido — e era, mas não se fala.',
            '— O chefe mandou guardar os três. Para quê, não sei. Ninguém pergunta.',
          ],
          opcoes: [{ texto: '…', vai: 'aceitam' }],
        },
        pilhagem: {
          fala: [
            '— O pano e as peles ficam no galpão do fundo, empilhados. As armas, na sala trancada do lado — e a chave é do peludo.',
            '— O que é bom mesmo o chefe leva para o quarto dele. A gente fica com as peles.',
          ],
          opcoes: [{ texto: '…', vai: 'aceitam' }],
        },
        ossos: {
          fala: [
            '— Ali ninguém entra sem o manto. Os ossos levantam. Perdemos um assim, no começo, e o chefe só riu.',
            '— Tem uma palavra que faz eles pararem. O chefe sabe. A gente, não.',
          ],
          opcoes: [{ texto: '…', vai: 'aceitam' }],
        },
        acima: {
          narra: 'O copo para no meio do caminho. O bandido olha para os lados antes de falar, e fala baixo.',
          fala: [
            '— Tem alguém acima dele, isso eu sei. Carta chega, carta sai, e o chefe muda de humor no dia.',
            '— Quem traz a carta é os peludos da sala de baixo. Pergunta para eles, se tiver coragem. Eu não tenho.',
          ],
          opcoes: [{ texto: '…', vai: 'aceitam' }],
        },
        desconfiam: {
          fala: '— Recruta, é? Recruta chega com aviso. Pega eles!',
          opcoes: [{ texto: '…', fim: 'luta' }],
        },
      },
    };
  }

  /** A sala 9, com todo o grupo de manto: os bugbears os tomam por servos do Cajavidro (Enganação CD 15). */
  function arvoreDosBugbears(quem) {
    return {
      inicio: 'oi',
      nos: {
        oi: {
          narra: `Os três bugbears se levantam devagar, com o chão rangendo. O de tapa-olho cheira o ar, olha o manto de ${quem.name} e franze o focinho achatado.`,
          fala: '— Gente do mago? O mago não avisou. Fala logo.',
          opcoes: [
            { texto: 'O Cajavidro nos mandou. Deixem passar.', teste: { pericia: 'enganacao', cd: 15 }, sucesso: 'servos', falha: 'desconfiam' },
            { texto: 'Atacar.', fim: 'luta' },
          ],
        },
        servos: {
          narra: 'O bugbear de tapa-olho dá de ombros e volta a sentar. No canto, o goblin encolhe os ombros ainda mais.',
          fala: '— O mago manda sempre uns peixes pequenos. Pergunta logo e vai.',
          opcoes: [
            { texto: 'O que vocês sabem dos Marcarrubra?', vai: 'sabem', uma: true },
            { texto: 'Apertar um deles: "Fala tudo, agora."', teste: { pericia: 'intimidacao', cd: 15 }, sucesso: 'confessa', falha: 'desconfiam', uma: true },
            { texto: 'Atacar de surpresa.', fim: 'surpresa' },
            { texto: 'Sair sem briga.', fim: 'paz' },
          ],
        },
        sabem: {
          fala: '— O mago fala demais. A gente não é dele: mandaram a gente segurar os capas vermelhas e a vila na linha. De quem manda, não se fala.',
          opcoes: [{ texto: '…', vai: 'servos' }],
        },
        // O QUE SÓ OS BUGBEARS SABEM. O livro é explícito: eles são os únicos do esconderijo que sabem onde fica a
        // CAVERNA ONDA ECO, e sabem também o CASTELO DENTEFINO; contam só apertados (Intimidação CD 15), porque
        // temem o Aranha Negra mais do que temem o grupo, para quem trabalham. Os dois lugares usam as palavras
        // da resposta da Agatha (`conyberry.js`) e abrem o mesmo marcador no mapa da região.
        confessa: {
          narra: `O bugbear encosta na parede, apertado pelo olhar de ${quem.name}.`,
          ao: (ctx) => {
            ctx.flags.apertadoBugbears = true;       // a trava do "Perguntar outra coisa" (`game/npc-saber.js`)
            const feito = (camp.feitos ??= {});
            feito.sabeOCastelo = true;
            feito.sabeOndaEco = true;
            const pistas = ((camp.vila ??= {}).pistas ??= []);
            const t = 'Um bugbear dos Marcarrubra, apertado: o Castelo Dentefino fica na Floresta de Neverwinter, ao norte da Trilha de Triboar, e a Caverna Onda Eco nos morros a leste de Phandalin, ao pé das Montanhas Espada. Eles recebem ordens do Aranha Negra.';
            if (!pistas.includes(t)) pistas.push(t);
          },
          fala: [
            '— Tá bom, tá bom! A chave de tudo fica com o de tapa-olho.',
            '— O mago dorme do outro lado, passando a oficina. Tem um diabinho com ele que fica invisível e vigia por lá. E tem uma porta atrás do quarto, que dá no depósito.',
            '— E a gente não é do mago, não. É do Aranha Negra, e ele é pior que vocês. O Castelo Dentefino fica na Floresta de Neverwinter, ao norte da Trilha de Triboar. E a mina que ele quer, a Onda Eco, nos morros a leste da vila, ao pé das Montanhas Espada. Agora larga!',
          ],
          opcoes: [{ texto: '…', vai: 'servos' }],
        },
        desconfiam: {
          fala: '— Peraí. O mago nunca mandou ninguém assim. Esmaga eles!',
          opcoes: [{ texto: '…', fim: 'luta' }],
        },
      },
    };
  }

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
      // A CONVERSA COM O CAJAVIDRO PRESO sai pela boca DELE, e não na ordem do quadro do livro. Ele é vaidoso:
      // começa pelo que o absolve, defende-se antes de ser acusado, e só entrega o drow quando o assunto é
      // dinheiro — nunca como informação de graça. Os fatos são os mesmos; quem escolhe a ordem é o preso.
      oi: {
        narra: 'Amarrado, o Cajavidro ajeita o manto com os cotovelos e fala como se estivesse num salão.',
        fala: 'Meus caros, que situação desagradável. Perguntem. Um cavalheiro sabe quando perdeu.',
        opcoes: [
          { texto: 'A Aliança sabe o que você fez aqui?', vai: 'alianca', uma: true },
          { texto: 'Quem paga por isto tudo?', vai: 'aranha', uma: true },
          { texto: 'Os bugbears não são seus.', vai: 'bugbears', uma: true },
          { texto: 'Basta. Você vai responder a Sildar.', fim: 'paz' },
        ],
      },
      alianca: {
        narra: 'A pergunta o diverte. É a única que ele queria ouvir.',
        fala: [
          'Sabe? Uma carta minha por mês, educada, com notícias de uma vila pacata. Ninguém em Neverwinter tem motivo para abrir a segunda.',
          'E não me chamem de traidor: traidor é quem jura e muda de ideia. Eu nunca jurei nada que não desse para desjurar.',
        ],
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      aranha: {
        narra: 'Aí, pela primeira vez, ele olha para a porta antes de falar.',
        fala: [
          'Pagar, ninguém pagou nada ainda. Prometeram — metade do que sair de uma forja que fecharam há quinhentos anos. Anões, gnomos e magos fizeram pacto, fizeram espada que corta sem fio, e depois morreram todos. Metade disso ainda é muito.',
          'Quem promete se faz chamar de Aranha Negra. Não é apelido de bandoleiro, é tradução: ele é um elfo das profundezas, dos de verdade, não dos de história de taverna. Vi a pele dele uma vez, à luz de vela, e passei a semana sem dormir.',
        ],
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      bugbears: {
        narra: 'Ele bufa, e a vaidade dele aparece inteira na resposta.',
        fala: [
          'Claro que não são meus. Foram mandados para cá como se manda cão para guardar casa de hóspede — e eu que pagasse a comida.',
          'Se querem o que eles têm e eu não: o caminho até a mina. Pediram meu plano, minhas cartas, meu nome, e o mapa deixaram com os brutos. Vejam só onde me puseram na conta deles.',
        ],
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
    },
  };

  function dialogoDe(npc) {
    if (hasCondition(npc, 'inconsciente')) return null;
    if (npc === droop && (grupos.guardas?.vencido || grupos.guardas?.tregua)) return arvoreDroop;
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
        id: 'trancada', tipo: 'trancada', x: tr.a.x, y: tr.a.y, nome: 'A porta trancada do depósito de armas',
        fazer: async () => {
          abrirTrancada();
          await painel('A tranca estala por dentro, com um estrondo que corre pelo porão, e a porta se entreabre sozinha.');
          app.refresh();
        },
      });
    }
    out.push({
      id: 'fenda-aura', tipo: 'magico', x: MANSAO.fenda[MANSAO.pontes.norte][0] + 1, y: MANSAO.pontes.norte + 1, nome: 'O fundo da fenda',
      aura: { escola: 'necromancia', texto: 'Uma aura fraca e velha de necromancia paira sobre o fundo da fenda: algo morreu ali de um jeito que a magia ainda lembra.' },
    });
    const pa = MANSAO.portas.alojamento;
    if (!salvo.portas.includes('alojamento')) {
      out.push({
        id: 'alojamento', tipo: 'alcance', x: pa.a.x, y: pa.a.y, nome: 'A porta do alojamento',
        fazer: async (h) => { abrirPorta('alojamento'); app.refresh(); await depoisDeMover(h); },
      });
    }
    if (!salvo.celas) {
      const guardado = grupos.jaulas && pendentes().includes(grupos.jaulas) ? 'os guardas ainda estão aqui' : null;
      for (const pares of Object.values(MANSAO.celas)) {
        const j = pares[Math.floor(pares.length / 2)].a;
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
    // Lote 14: o que Localizar Objeto acha. (A armadilha do corredor é região escondida do mapa: o gancho do Encontrar
    // Armadilhas vem dela, `game/armadilhas.js`, e achá-la abre o buraco — `evento`.)
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

  /**
   * Procurar porta secreta e escutar atrás das portas. As paredes são arestas, que não se clicam: o menu vale na pedra em volta
   * (`interacoes`) e, junto das portas, no próprio herói (`interacoesDoHeroi`).
   */
  function opsDeParede(c, tile, { procurar = true } = {}) {
    const ops = [];
    const longe = (pes) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
    const jaBuscou = (tipo, onde = tile) => buscas.ja(c, tipo, onde);
    const marcarBusca = (tipo, onde = tile) => buscas.marcar(c, tipo, onde);
    // As secretas ao alcance de QUEM procura (a 3 m e à vista, não através de parede). Uma tentativa por herói em cada secreta.
    const secretasPerto = () => Object.entries(MANSAO.secretas).filter(([n, s]) => !salvo.secretas.includes(n) && secretaAoAlcance(s, c.pos));
    const chaveDaBusca = () => { const alvo = secretasPerto()[0]; return alvo ? casaDaPorta(alvo[1], c.pos) : { x: 0, y: 0 }; };
      if (procurar) ops.push({
        rotulo: 'Procurar porta secreta', icone: 'acao-procurar', detalhe: 'Percepção, CD 10 · paredes a até 3 m',
        motivo: longe(10) ?? jaBuscou('secreta', chaveDaBusca()),
        fazer: async () => {
          marcarBusca('secreta', chaveDaBusca());
          const perto = secretasPerto();
          const vantagem = perto.some(([n]) => n === 'quarto' && salvo.iarno === 'fugiu') || achaSecretaComVantagem(c);
          const t = teste(c, 'percepcao', 10, vantagem);
          if (t.passou && perto.length) {
            // Quem acha uma secreta acha as que estão ao alcance dela: um rangido só, e não dois empilhados.
            perto.forEach(([n], i) => abrirSecreta(n, { som: i === 0 }));
            await painel(`${c.name} corre os dedos pelas juntas e acha: uma laje que gira para o lado sobre dobradiças escondidas.`, { teste: t });
            app.refresh();
          } else {
            await painel(t.passou ? `${c.name} examina a parede palmo a palmo. É só parede.` : `${c.name} não acha nada.`, { teste: t });
          }
        },
      });
      const escuta = [
        ['guardas', { a: { x: 3, y: 14 }, b: { x: 3, y: 15 } }, 10, 'vozes grossas, em goblin, mandando alguém carregar, buscar, ficar quieto — e o estalo de um tapa, seguido de risada'],
        ['estar', { a: { x: 3, y: 11 }, b: { x: 3, y: 12 } }, 10, 'pedrinhas chacoalhando num copo, um grito, um palavrão e moedas trocando de mão'],
        ['estar', { a: { x: 4, y: 6 }, b: { x: 4, y: 7 } }, 10, 'pedrinhas chacoalhando num copo, um grito, um palavrão e moedas trocando de mão'],
        ['cajavidro', { a: { x: 4, y: 5 }, b: { x: 4, y: 6 } }, 15, 'um chiado de vapor e gotas pingando, como de alambique'],
        ['cajavidro', { a: { x: 5, y: 3 }, b: { x: 6, y: 3 } }, 15, 'um chiado de vapor e gotas pingando, como de alambique'],
      ];
      const ouvidas = new Set();
      for (const [gid, porta, cd, som] of escuta) {
        // Só se escuta atrás de uma porta FECHADA, de um dos lados dela (o herói encostado nela, sem parede no meio).
        if (ouvidas.has(gid) || !alcancaPorta(porta, c.pos) || enc.field.aresta(porta.a.x, porta.a.y, porta.b.x, porta.b.y) !== ARESTA.porta || !grupos[gid] || grupos[gid].vencido) continue;
        ouvidas.add(gid);
        ops.push({
          rotulo: 'Escutar atrás da porta', icone: 'acao-procurar', detalhe: `Percepção, CD ${cd}`,
          motivo: jaBuscou('escuta', porta.a),
          fazer: async () => {
            marcarBusca('escuta', porta.a);
            const t = teste(c, 'percepcao', cd);
            await painel(t.passou ? `${c.name} encosta a orelha na porta: ${som}.` : `${c.name} não ouve nada de útil.`, { teste: t });
          },
        });
      }
    return ops;
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
    if (sup === 'rocha' || sup === 'alvenaria') ops.push(...opsDeParede(c, tile));

    ops.push(...opsDePortaComum(c, tile));

    // ACORDAR O DROOP. O livro é explícito: ele fica inconsciente por 1d10 minutos, e OUTRA CRIATURA PODE
    // ACORDÁ-LO COM UMA AÇÃO. No jogo o desmaio existia (`addCondition(droop, 'inconsciente')` quando a luta dos
    // guardas começa) e o despertar estava GRUDADO NO SAQUE: só revirando o cinto do Nosk, depois de vencer, o
    // goblin voltava a si. Grupo que ganhasse a luta e não revirasse nada ficava com um informante desacordado
    // para sempre — e é ele que conta as quatro portas secretas, a senha da cripta e o caminho do Castelo.
    // Agora qualquer herói encostado nele o sacode, e o saque continua acordando quem ainda estiver dormindo.
    if (droop && !droop.dead && hasCondition(droop, 'inconsciente')
      && tile.x === droop.pos.x && tile.y === droop.pos.y) {
      ops.push({
        rotulo: 'Acordar o goblin', icone: 'acao-ajudar', detalhe: 'uma ação',
        motivo: longe(5),
        fazer: async () => {
          removeCondition(droop, 'inconsciente');
          await painel(`${c.name} sacode o goblin magrelo pelo ombro. Ele acorda num susto, se encolhe com as mãos na cabeça, olha os bugbears no chão — e só então começa a respirar.`);
          app.refresh();
        },
      });
    }

    // A porta do alojamento (2), fechada: abre-se à mão.
    const pa = MANSAO.portas.alojamento;
    if (!salvo.portas.includes('alojamento') && naPorta(pa, tile)) {
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
    if (!salvo.trancadaAberta && naPorta(tr, tile)) {
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
            const porta = MANSAO.portas.alojamento;
            const entrada = [porta.a, { x: porta.a.x - 1, y: porta.a.y }, porta.b];     // o vestíbulo, a casa de trás e a do lado do porão
            for (const [i, fm] of g.membros.entries()) { const p = casaPerto(entrada[i % entrada.length]); fm.pos = { ...fm.pos, x: p.x, y: p.y }; }
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

    // Área 3: procurar armadilha e a beirada.
    if (dentro(tile, 20, 9, 27, 10) && !salvo.fossoVisto) {
      ops.push({
        rotulo: 'Procurar armadilhas', icone: 'acao-procurar', detalhe: 'Percepção, CD 15',
        motivo: longe(15) ?? jaBuscou('armadilha', { x: 0, y: 0 }),
        fazer: async () => {
          marcarBusca('armadilha', { x: 0, y: 0 });
          const t = teste(c, 'percepcao', 15);
          if (t.passou) { salvo.fossoVisto = true; marcarFosso(); app.refresh(); }
          await painel(t.passou
            ? 'A poeira no meio do corredor tem um desenho estranho: as lajes ali não assentam, estão por cima de tábuas. Um fosso coberto, de parede a parede: só se passa colado na beirada ou saltando.'
            : 'Poeira grossa, colunas falsas, as portas de cobre no fundo. Nada de estranho.', { teste: t });
        },
      });
    }
    if (salvo.fossoVisto && (tile.y === 9 || tile.y === 10) && (tile.x === 22 || tile.x === 25) && distanceFt(c.pos, tile) <= 5) {
      const lado = c.pos.x <= 22 ? 25 : 22;
      ops.push({
        rotulo: 'Passar pela beirada', icone: 'acao-disparada', detalhe: 'Acrobacia, CD 10 · falhando, Destreza CD 15',
        fazer: async () => {
          const t = teste(c, 'acrobacia', 10);
          if (t.passou) {
            const p = casaPerto({ x: lado, y: tile.y });
            c.pos = { ...c.pos, x: p.x, y: p.y };
            await painel(`${c.name} passa colado na parede, de lado, pela beirada estreita.`, { teste: t });
            await xpDoFosso();
          } else {
            const r = enc.resistencia(c, 'dex', 15);
            if (r.success) {
              await painel(`O pé de ${c.name} escorrega na beirada — e a mão acha a borda. ${c.name} volta para trás.`, { teste: t });
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
    if (grupos.cripta && pendentes().includes(grupos.cripta) && salvo.sabeSenha && dentro(tile, 16, 5, 19, 10)) {
      ops.push({
        rotulo: `Dizer "${SENHA}"`, icone: 'acao-ajudar', detalhe: 'a senha dos esqueletos',
        fazer: async () => { grupos.cripta.senha = true; await painel(`— ${SENHA}. Os esqueletos ficam onde estão, olhando para lugar nenhum.`); },
      });
    }
    if (sup === 'sarcofago' && dentro(tile, 16, 5, 19, 10)) {
      // Um anel por SARCÓFAGO (de duas casas), e não por casa.
      const chave = String(MANSAO.sarcofagos.findIndex((s) => s.some((q) => q.x === tile.x && q.y === tile.y)));
      if (!salvo.aneis.includes(chave)) {
        ops.push({
          rotulo: 'Abrir o sarcófago', icone: 'acao-usarObjeto', motivo: longe(5) ?? (grupos.cripta && pendentes().includes(grupos.cripta) && !grupos.cripta.senha ? 'os esqueletos ainda estão de pé' : null),
          fazer: async () => {
            salvo.aneis.push(chave);
            // O OBELISCO: o tesouro da cripta é UM bracelete de ouro com pedras (140 po), no sarcófago da mulher — o do
            // meio. Os outros dois guardam só os ossos (a Mina dava um anel por sarcófago).
            if (chave === '1') {
              guardar(c, 'braceleteDeOuro', 1);
              await painel(`A tampa de pedra, entalhada com o rosto de uma mulher, desliza com esforço. Ossos miúdos, pano podre — e, solto entre os ossos do pulso, um bracelete de ouro com pedrinhas engastadas. ${c.name} guarda.`);
            } else {
              await painel('A tampa de pedra, entalhada com o rosto de um homem de barba, desliza com esforço. Ossos, pano podre, e mais nada que valha a pena.');
            }
          },
        });
      }
    }

    // Área 5: as celas.
    const cela = Object.values(MANSAO.celas).flat().find((par) => naPorta(par, tile));
    if (cela && !salvo.celas) {
      const libertar = async (texto, t) => {
        salvo.celas = true;
        salvo.presosLivres = true;
        abrirCelas();
        app.refresh();
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
    if ((sup === 'mantimentos' || sup === 'armeiro') && dentro(tile, 17, 2, 18, 4) && salvo.trancadaAberta && salvo.mantos < 12) {
      ops.push({
        rotulo: 'Pegar mantos vermelhos', icone: 'acao-usarObjeto', detalhe: 'uma dúzia pendurada na porta', motivo: longe(5),
        fazer: async () => {
          const n = Math.min(herois().length, 12 - salvo.mantos);
          salvo.mantos += n;
          guardar(c, 'mantoVermelho', n);
          // O próprio `detalhe` do botão já dizia "uma dúzia pendurada na porta", e o texto falava de pilha
          // dobrada num canto: duas verdades para o mesmo monte de pano. O livro os pendura nos ganchos.
          await painel(`Armas enfileiradas para um bando maior do que este, e uma dúzia de mantos vermelhos pendurados nos ganchos de ferro atrás da porta, ombro a ombro, como numa antessala de teatro. ${c.name} pega ${n}.`);
        },
      });
    }
    // As três armas finas das prateleiras (revisão de 2026-11-13: o livro as põe no arsenal, e o jogo só dava os mantos).
    if ((sup === 'mantimentos' || sup === 'armeiro') && dentro(tile, 17, 2, 18, 4) && salvo.trancadaAberta && !salvo.armasFinas) {
      ops.push({
        rotulo: 'Escolher as armas boas', icone: 'acao-procurar', detalhe: 'nas prateleiras', motivo: longe(5),
        fazer: async () => {
          salvo.armasFinas = true;
          guardar(c, 'espadaCurtaCravejada', 1);
          guardar(c, 'bestaLeveDePrata', 2);
          await painel(`Lanças, espadas, bestas e aljavas cheias, para um bando que os Marcarrubra ainda não têm. No meio do comum, três peças feitas com capricho: uma espada curta com pedras no pomo e duas bestas leves gêmeas, com prata embutida na madeira. ${c.name} as separa: valem o dobro de uma arma qualquer.`);
        },
      });
    }
    if ((sup === 'mantimentos' || sup === 'prop') && dentro(tile, 11, 2, 15, 4) && !salvo.peles) {
      ops.push({
        rotulo: 'Revirar o depósito', icone: 'acao-procurar', motivo: longe(5),
        fazer: async () => {
          salvo.peles = true;
          guardar(c, 'pelesDeCastor', 40);
          await painel(`Debaixo de caixas vazias e palha, um fardo amarrado com corda boa: quarenta peles de castor curtidas, de uma caravana da Trilha de Triboar assaltada uns dias atrás. Mercadoria de caravana, com certeza não comprada. ${c.name} guarda.`);
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
    // Soltar as amarras da ponte: uma ação, do chão da caverna, junto de uma das pontas. Quem estiver em cima cai.
    if (sup === 'ponte' && !naFenda && distanceFt(c.pos, tile) <= 10) {
      const lado = tile.y === MANSAO.pontes.norte ? 'norte' : 'sul';
      if (!salvo[FLAG_PONTE[lado]]) {
        ops.push({
          rotulo: 'Soltar as amarras da ponte', icone: 'acao-empurrar', detalhe: 'uma ação · a ponte cai e leva quem estiver nela',
          fazer: async () => {
            await derrubarPonte(lado, `${c.name} corta as amarras da ponta com uma só ação e a ponte tomba para dentro do escuro, seis metros abaixo`);
            app.refresh();
          },
        });
      }
    }
    if (naFenda && !salvo.thelVisto && Math.abs(c.pos.y - MANSAO.pontes.norte) <= 2) {
      ops.push({
        rotulo: 'Olhar o corpo', icone: 'acao-procurar', detalhe: 'meio coberto de pedra, junto da parede',
        fazer: async () => {
          salvo.thelVisto = true;
          await painel('Meio coberto de pedra solta, o corpo de um homem de meia-idade, com roupa de lavrador, encolhido ao pé da parede; as mãos ainda erguidas protegem o rosto. Ninguém o enterrou. Deve ser Thel Dendrar, de quem a família na jaula ainda pergunta.');
        },
      });
    }
    if (naFenda && !salvo.bauVigia && Math.abs(c.pos.y - MANSAO.pontes.norte) <= 1) {
      ops.push({
        rotulo: 'Puxar o baú escondido', icone: 'acao-usarObjeto', detalhe: 'debaixo da ponte do norte',
        fazer: async () => {
          audio.play('chestOpen');
          salvo.bauVigia = true;
          guardar(c, 'moedaDePrata', 160); guardar(c, 'moedaDeOuro', 120); guardar(c, 'malaquita', 5);
          guardar(c, 'pocaoDeCura', 1); guardar(c, 'pocaoDeEscalada', 1); guardar(c, 'pocaoDeCrescimento', 1);
          guardar(c, 'pingenteDeUnicornio', 1);
          (c.weapons ??= []).push('talon');
          const h = teste(c, 'historia', 15);
          await painel([
            'Lá embaixo, entre ossos roídos, o vigia guardava o que juntou: um baú de madeira gasto. Mais adiante, amontoado no fundo, um esqueleto limpo até o osso, com um pingente de madeira em forma de cabeça de unicórnio ainda no pescoço — o Thel Dendrar, se a Mirna reconhecer o pingente.',
            `No baú: 160 peças de prata, 120 de ouro, cinco malaquitas, três frascos (cura, escalada e crescimento, pelos rótulos) — e, deitada por cima de tudo como quem não pertence ali, uma espada longa de cavaleiro. O copo é um falcão de asas fechadas, gasto de ser segurado. Na lâmina, uma palavra só: Talon. ${c.name} guarda tudo.`,
            h.passou ? 'A palavra puxa uma história que em Phandalin se conta sem data: dos Tresendar, o último a usar armadura foi um que os vizinhos chamavam de Falcão Negro, e que não saiu destes porões no dia em que os orcs desceram. Davam o corpo por perdido. A espada, também.' : null,
          ].filter(Boolean), { teste: h });
        },
      });
    }

    // Área 10: o dinheiro da mesa.
    if (sup === 'mesa' && NA_ESTAR(tile) && grupos.estar?.vencido && !salvo.mesa) {    // virada, o dinheiro está no chão (ver `mesaVirada`)
      ops.push({
        rotulo: salvo.mesaVirada ? 'Catar o dinheiro do chão' : 'Recolher o dinheiro da mesa',
        icone: 'acao-usarObjeto', motivo: longe(5),
        fazer: async () => {
          salvo.mesa = true;
          guardar(c, 'moedaDeCobre', 75); guardar(c, 'moedaDePrata', 55); guardar(c, 'moedaDeOuro', 26); guardar(c, 'brincosDeRubi', 1);
          await painel(salvo.mesaVirada
            ? `Catado da laje, de quatro, nas quatro direções em que rolou: 75 peças de cobre, 55 de prata, mais ouro e electro que somam 26 de ouro, e um par de brincos com um rubi do tamanho de uma lentilha, que foi parar debaixo de uma estante — alguém apostou o que não era dele. As pedrinhas, aliás, são viciadas. ${c.name} guarda.`
            : `Espalhado entre copos virados: 75 peças de cobre, 55 de prata, mais ouro e electro que somam 26 de ouro, e um par de brincos com um rubi do tamanho de uma lentilha — alguém apostou o que não era dele. As pedrinhas, aliás, são viciadas. ${c.name} guarda.`);
        },
      });
    }

    // Área 11: os livros e os reagentes.
    if ((sup === 'mesa' || sup === 'mantimentos' || sup === 'prop') && NA_OFICINA(tile) && !salvo.reagentes) {
      ops.push({
        rotulo: 'Vasculhar a oficina', icone: 'acao-procurar', motivo: longe(5),
        fazer: async () => {
          salvo.reagentes = true;
          guardar(c, 'reagente', 3);
          if (camp.vila) (camp.vila.pistas ??= []).push('Um caderno em anão, na oficina do Cajavidro: alguém chamado Urmon passou anos atrás de uma maça de Lathander, a Invocadora da Luz, perdida com a mina e com a forja que havia dentro dela.');
          await painel([
            'Vidraria por toda parte, metade dela suja de um resíduo prateado. Alguém aqui tenta uma receita difícil e erra há semanas. Entre os livros, um caderno de capa de couro escrito em anão.',
            `As últimas páginas não têm mais notas de trabalho: têm uma coisa só, escrita e reescrita em anão, cada vez com menos capricho. Uma maça consagrada a Lathander, chamada Invocadora da Luz, que teria afundado junto com a mina e com a forja que havia dentro dela. O dono do caderno assinava Urmon, e parou de assinar na metade. ${c.name} guarda o caderno e três frasquinhos de reagentes raros.`,
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
          // O Obelisco: avisado, ele leva os dois pergaminhos na fuga.
          const levou = salvo.iarno === 'fugiu';
          guardar(c, 'moedaDePrata', 180); guardar(c, 'moedaDeOuro', 130); guardar(c, 'cornalina', 5);
          guardar(c, 'peridoto', 2);
          if (!levou) { guardar(c, 'pergaminhoDeImobilizar', 1); guardar(c, 'pergaminhoDeBolaDeFogo', 1); }
          await painel(`A parte do chefe, separada com cuidado: 180 peças de prata, 130 de ouro, uma bolsinha de seda com cinco cornalinas e dois peridotos${levou ? '. Os pergaminhos que deviam estar aqui sumiram: dá para ver as duas fitas de lacre arrebentadas no fundo do baú. Ele os levou na fuga' : ', e dois pergaminhos enrolados — Imobilizar Pessoa e Bola de Fogo'}. ${c.name} guarda.`);
        },
      });
    }
    if (sup === 'mesa' && NO_QUARTO(tile) && !salvo.carta) {
      ops.push({
        rotulo: 'Ler os papéis da mesa', icone: 'acao-procurar', motivo: longe(5),
        fazer: async () => {
          salvo.carta = true;
          if (camp.vila) {
            (camp.vila.pistas ??= []).push('O bilhete da aranha, na mesa do Cajavidro: qualquer mapa anão sobe para quem assina, sem demora — e quem o estiver carregando não precisa chegar inteiro a lugar nenhum.');
            (camp.vila.feito ??= {}).cartaDoCajavidro = true;
          }
          // A CARTA, LIDA DE BAIXO PARA CIMA. Antes ela repetia o bilhete do livro na ordem em que o livro o
          // escreve, de cabeçalho a despedida. Agora é o olho do herói que manda: primeiro a aranha desenhada,
          // que é o que salta da página, depois a ordem que importa (o mapa), e a ameaça fica onde o leitor a
          // encontra — no meio de uma frase educada, que é o que a torna ameaça.
          await painel([
            'Contas, lista de compras, um rascunho de discurso para a praça. E, debaixo do tinteiro, meia folha boa demais para a pilha: sem data, sem nome, com uma aranha desenhada a bico de pena onde iria a assinatura.',
            'A ordem vem primeiro, em três linhas: mapa anão que apareça sobe para a aranha no mesmo dia, em mão, sem cópia. Só depois, numa frase que começa com "quanto aos recém-chegados" e termina em "fico-lhe grato", está dito que ninguém precisa chegar inteiro a lugar nenhum — e é a cortesia que faz o frio descer.',
            'Quem escreveu não escreve rápido: a tinta está gravada no papel, letra por letra, como quem tem tempo.',
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
    if (!estado.explorando) return [];
    const ops = [];
    if (tem(c, 'mantoVermelho') && !c.mantoVermelho) {
      ops.push({ rotulo: 'Vestir o manto vermelho', icone: 'acao-usarObjeto', detalhe: 'passa por um Marcarrubra — para quem não olha direito',
        fazer: async () => { c.mantoVermelho = true; await painel(`${c.name} joga o manto vermelho encardido nos ombros.`); } });
    }
    // As paredes são arestas e não se clicam: junto de uma porta secreta ainda não achada, ou de uma porta que se escuta, o menu vem no herói.
    const pertoDeSecreta = Object.entries(MANSAO.secretas).some(([n, s]) => !salvo.secretas.includes(n) && secretaAoAlcance(s, c.pos));
    ops.push(...opsDeParede(c, c.pos, { procurar: pertoDeSecreta }));
    // As portas, a trancada, a do alojamento, as grades e a saída moram no menu da casa onde o herói está.
    ops.push(...interacoes(c.pos, enc.field.surfaceAt(c.pos.x, c.pos.y), c));
    return ops;
  }

  return {
    lugar: 'Esconderijo dos Marcarrubra',
    // as portas desta cena têm roteiro próprio (teste, dono, barulho): a porta genérica (`game/portas.js`) fica de fora
    portasProprias: true,
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    pistasEm,
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
