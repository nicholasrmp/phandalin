// Livro do Jogador não é SRD: a Maldição de Strahd é conteúdo da Wizards. TEXTO nosso, fatos do livro — ver NOTICE.md e STRAHD.md.
//
// A CASA DA MORTE (Apêndice B, áreas 1 a 38): os quatro andares e as duas masmorras. Exploração livre, sem iniciativa, até alguma coisa
// da casa acordar; aí a luta é do motor de combate, e depois a cena volta à exploração. O livro avança o grupo por MARCOS e não por XP:
//   - 2º nível: a carta de Strahd (área 9), que faz a casa mostrar a escada secreta;
//   - 3º nível: ao sair da casa, depois do ritual da câmara (38).
//
// A casa é "viva": o 1º e o 2º andares parecem novos (o que sai dela, envelhece); o 3º andar e o sótão são poeira e teia; as masmorras
// são terra, argila e escuro. O que cada módulo faz:
//   - este arquivo: o estado, os grupos de criaturas, o combate, os gatilhos, as escadas, a saída e o fim;
//   - `casadamorte-alto-cena.js`: 3º andar e sótão (a armadura, a vassoura, a babá, as crianças fantasma, a casa de bonecas);
//   - `casadamorte-porao-cena.js`: as masmorras (criptas, poço, armadilha, carniçais, grick, sombras, mímico, lívidos, o ritual).
//
// Mesma interface de cena dos outros capítulos (`main.js`): lugar, explorando, encerrado, interacoes, depoisDeMover, fimDoCombate, evento,
// iniciar.

import { narrar } from '../view/narrativa.js';
import { distanceFt, GLIFOS, SUPERFICIES } from '../core/grid.js';
import { ctxDe } from './magias-fora.js';
import { rolarTeste } from '../rules/utilidade.js';
import { rolarPericia } from '../rules/abilities.js';
import { guardar } from './comercio.js';
import { garantirInventario } from '../rules/equipment.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { xpParaProximo } from '../rules/progressao.js';
import { ANDARES } from './casadamorte.js';
import { ESCADA_SECRETA_3, ESCADA_SECRETA_4, ESCADA_OESTE_3, PORTA_OESTE_3 } from './casadamorte-alto.js';
import { criarBuscas } from './buscas.js';
import { altoInteracoes, altoGatilhos, destrancarPortaDasCriancas } from './casadamorte-alto-cena.js';
import { pistasInteracoes, pistasPassivas, pistasAuras } from './casadamorte-pistas-cena.js';
import { poraoInteracoes, poraoGatilhos, reaplicarPorao, BAUS_POCO, abrirBauDoPoco } from './casadamorte-porao-cena.js';
import { fugaInteracoes, fugaIniciar } from './casadamorte-fuga.js';

const MOVIMENTO = 60;
const dentro = (a, p) => p.x >= a.x1 && p.x <= a.x2 && p.y >= a.y1 && p.y <= a.y2;
const PORTA_SECRETA = { x: 7, y: 5 };      // a estante da biblioteca (2º andar) que gira para a sala secreta

export function criarCasaDaMorte(app, config) {
  const enc = app.enc;
  const root = app.root;
  const variante = config.variante ?? 'casaDaMorte1';
  const andar = ANDARES[variante];
  const campanha = (app.campanha ??= {});
  const salvo = ((campanha.strahd ??= {}).casa ??= {
    vistas: [], paineisSala: false, paineisSalao: false, portasEntalhadas: false, estatuetas: false,
    armarioAberto: false, chave: false, livroFalso: false, passagemAberta: false, cartaLida: false, baul: false, livrosEstudados: false,
  });
  // Campos que os saves antigos (só 1º e 2º andares) não têm.
  salvo.vistas ??= [];
  salvo.vencidos ??= [];
  salvo.achados ??= {};          // o que já se pegou, por chave: cada tesouro vale uma vez
  const buscas = criarBuscas((salvo.buscas ??= {}));
  const estado = { explorando: false, encerrado: false, lutando: null };

  const herois = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead && c.hp > 0);
  const painel = (texto, extra = {}) => narrar(root, { formato: 'painel', paginas: [{ texto: [].concat(texto), ...extra }] });
  const teste = (c, pericia, cd, vantagem = false) => {
    const x = ctxDe(app, enc);
    const r = rolarTeste(x.estado, x.herois(), enc.rng, c, pericia, cd, { vantagem });
    return { quem: r.quem, total: r.total, cd, passou: r.passou };
  };
  const areaDe = (p) => andar.areas.find((a) => dentro(a, p));
  const longe = (c, tile, pes = 10) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${Math.round(pes * 0.3)} m` : null);
  const tem = (c, id) => garantirInventario(c).bag.some((i) => i.id === id && i.qtd > 0);
  const algumTem = (id) => herois().find((h) => tem(h, id)) ?? null;
  const consumir = (c, id) => { const b = garantirInventario(c).bag.find((i) => i.id === id && i.qtd > 0); if (b && !(b.qtd -= 1)) c.bag.splice(c.bag.indexOf(b), 1); };

  // ------------------------------------------------------------ o terreno ----
  /** Troca o que há numa casa do mapa (a porta secreta que se abre): regra e desenho. */
  function mudarCasa(x, y, glifo) {
    const f = enc.field;
    const g = GLIFOS[glifo];
    const i = y * f.w + x;
    f.tiles[i] = g.kind;
    f.surfaces[i] = SUPERFICIES.indexOf(g.sup);
    f.heights[i] = g.kind === 1 ? 3 : 0;
  }
  const mudarCasas = (lista, glifo) => { for (const [x, y] of lista) mudarCasa(x, y, glifo); };
  if (salvo.passagemAberta && variante === 'casaDaMorte2') mudarCasa(PORTA_SECRETA.x, PORTA_SECRETA.y, '?');
  // O alçapão do canil só existe depois que alguém o viu pelo lado de baixo.
  if (salvo.alcapaoCanil && variante === 'casaDaMorte1') mudarCasa(6, 22, 'l');

  // ----------------------------------------------------------- as criaturas ----
  const grupos = {};
  for (const f of (app.inimigosEscondidos ?? [])) (grupos[f.grupo] ??= { id: f.grupo, membros: [], ativo: false, vencido: false }).membros.push(f);
  for (const g of Object.values(grupos)) {
    g.furtividade = g.membros.map((f) => rolarPericia(enc.rng, f, 'furtividade').total);
    if (salvo.vencidos.includes(g.id)) g.vencido = true;
  }
  const hostis = (g) => (g?.membros ?? []).filter((f) => f.side === 'foes' && !f.dead && !f.fugiu);
  const pendentes = () => Object.values(grupos).filter((g) => !g.ativo && !g.vencido && hostis(g).length);
  const casaPerto = (p) => enc.casaLivreMaisProxima(p) ?? p;

  function trazer(g) {
    if (g.ativo) return;
    g.ativo = true;
    for (const f of g.membros) {
      if (enc.combatants.includes(f) || f.dead) continue;
      if (enc.occupied(f.pos.x, f.pos.y)) f.pos = { ...f.pos, ...casaPerto(f.pos) };
      enc.addCombatant(f);
    }
  }

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

  /** Começa a luta com um grupo. `surpresa`: 'deles' (os monstros pegam o grupo desprevenido), 'nossa' ou nenhuma. */
  async function combate(g, surpresa = null, intro = null) {
    if (intro) await painel(intro, { titulo: g.titulo ?? undefined });
    trazer(g);
    estado.explorando = false;
    estado.lutando = g;
    root.classList.remove('explorando');
    enc.emboscada = surpresa === 'deles'
      ? { emboscadores: 'foes', furtividade: g.furtividade }
      : surpresa === 'nossa' ? { emboscadores: 'party', furtividade: herois().map((h) => teste(h, 'furtividade', 0).total) } : null;
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
  }

  // ---------------------------------------------------------------- andares ----
  async function descrever(area) {
    if (salvo.vistas.includes(area.id)) return;
    salvo.vistas.push(area.id);
    if (area.texto?.length) await painel(area.texto, { titulo: `${area.area}. ${area.nome}` });
  }

  /** Muda de andar: o grupo inteiro vai junto e a cena nova começa ao pé da escada. */
  function irParaAndar(destino) {
    app.newEncounter({ modo: 'campanha', aventura: 'cos', variante: destino, entrada: variante, continuarCom: herois() });
  }

  /** A escada secreta (21): a porta atrás do espelho da babá e a espiral do sótão só existem depois que a casa as mostra. */
  function aplicarEscada() {
    if (!salvo.escada) return;
    if (variante === 'casaDaMorte3') {
      mudarCasas(ESCADA_SECRETA_3, 'l'); mudarCasas([[9, 17], [9, 18]], '?');
      if (salvo.portaOeste) { mudarCasas(ESCADA_OESTE_3, 'l'); mudarCasas(PORTA_OESTE_3, '?'); }
    }
    if (variante === 'casaDaMorte4') mudarCasas(ESCADA_SECRETA_4, 'l');
  }
  aplicarEscada();
  // A porta do quarto das crianças (20) fica trancada até alguém abri-la.
  if (variante === 'casaDaMorte4' && !salvo.portaCriancas) mudarCasa(7, 6, 'M');

  /** O marco do livro: quem chega à escada secreta (pela carta de Strahd ou pela casa de bonecas) passa ao 2º nível. */
  async function revelarEscada() {
    if (salvo.escada) return;
    salvo.escada = true;
    aplicarEscada();
    app.refresh();
    if (salvo.nivel2) return;
    salvo.nivel2 = true;
    const grupo = herois();
    const sobem = darXp(grupo, Math.max(...grupo.map((h) => xpParaProximo(h))));
    enc.say('cura', 'A casa mostrou a escada secreta: o grupo passa ao 2º nível.');
    if (sobem.length) for (const t of await telaDeSubirNivel(root, sobem)) enc.say('cura', t);
    app.refresh();
  }

  async function carta() {
    salvo.cartaLida = true;
    await painel([
      'O papel é grosso, e a letra, fina e inclinada. É uma carta de desprezo: quem a escreve diz ao dono da casa que nunca foi enviado por poder nenhum, que não lhe prometeu imortalidade, e que as vidas sacrificadas no altar não foram ele quem trouxe a estas terras. Chama o culto de vermes na sua terra, lembra que o dono da casa perdeu a fortuna e o juízo e acabou com um filho nascido morto, e recusa qualquer socorro: prefere vê-lo como está. O selo é de Strahd von Zarovich.',
      'Quando vocês levantam os olhos, uma coisa mudou na casa. Atrás do espelho do quarto da babá, no andar de cima, alguma coisa girou. A casa quer que vocês vejam o que a escada mostra.',
    ], { titulo: 'A carta de Strahd' });
    await revelarEscada();
  }

  // ------------------------------------------------------- o contexto dos módulos ----
  const ctx = {
    app, enc, root, config, variante, andar, salvo, estado, grupos,
    herois, hostis, painel, teste, areaDe, longe, buscas, tem, algumTem, consumir, guardar,
    mudarCasa, mudarCasas, combate, irParaAndar, revelarEscada, prepararExploracao, dentro,
    vencer(id) { if (!salvo.vencidos.includes(id)) salvo.vencidos.push(id); const g = grupos[id]; if (g) g.vencido = true; },
  };
  ctx.depoisDaLuta = {};
  ctx.paradas = [];
  ctx.gatilhos = { ...altoGatilhos(ctx), ...poraoGatilhos(ctx) };
  reaplicarPorao(ctx);
  fugaIniciar(ctx);
  // Onde o passo PARA: o poço escondido, o estrado do ritual, as portas de foice. Sem isto o herói atravessaria a armadilha andando.
  // Os gatilhos de proximidade também PARAM o passo: sem isto quem atravessa o cruzamento ou passa rente à armadura andava por cima do gatilho.
  ctx.paradas.push((c, p) => pendentes().some((g) => ctx.gatilhos[g.id]?.({ ...c, pos: p }, areaDe(p))));
  enc.paraNaCasa = (c, p) => c.side === 'party' && estado.explorando && ctx.paradas.some((f) => f(c, p));

  /** O armário do leste do canil, aberto (a gazua e a magia Abrir chegam aqui). */
  async function abrirArmario() {
    salvo.armarioAberto = true;
    const quem = herois()[0];
    for (const arma of ['bestaPesada', 'bestaLeve', 'bestaDeMao']) if (!(quem.weapons ?? []).includes(arma)) (quem.weapons ??= []).push(arma);
    guardar(quem, 'virotes', 60);
    await painel(`O cadeado cede. Dentro, três bestas (pesada, leve e de mão) e sessenta virotes, tudo limpo e oleado. ${quem.name} fica com o lote.`);
    app.refresh();
  }

  /**
   * O que a cena aceita das magias de utilidade (`game/magias-fora.js`): auras para o Detectar Magia, trancas para o Abrir, o fosso para
   * o Encontrar Armadilhas e a chave para o Localizar Objeto.
   */
  function ganchosMagicos() {
    if (!estado.explorando) return [];
    const out = [...pistasAuras(ctx)];
    if (variante === 'casaDaMorte1' && !salvo.armarioAberto) {
      out.push({ id: 'armario', tipo: 'trancada', x: 12, y: 21, nome: 'O armário do leste do canil', fazer: abrirArmario });
    }
    if (variante === 'casaDaMorte2' && !salvo.chave) out.push({ id: 'chave', tipo: 'procurado', x: 3, y: 2, nome: 'A chave de ferro dos Durst' });
    if (variante === 'casaDaMorte4' && !salvo.portaCriancas) {
      out.push({ id: 'porta20', tipo: 'trancada', x: 7, y: 7, nome: 'A porta trancada do quarto das crianças', fazer: () => destrancarPortaDasCriancas(ctx, herois()[0], 'A tranca estala por dentro e a porta do quarto das crianças se entreabre sozinha.') });
    }
    if (variante === 'casaDaMortePorao1') {
      for (const b of BAUS_POCO) {
        if (salvo.achados[`bau${b.id}`]) continue;
        out.push({ id: `bau${b.id}`, tipo: 'trancada', x: b.x, y: b.y, nome: `O baú trancado (25${b.id})`, fazer: () => abrirBauDoPoco(ctx, b) });
      }
      if (!salvo.espinhos) {
        out.push({
          id: 'fosso', tipo: 'armadilha', x: 15, y: 16, nome: 'O poço de espinhos', texto: 'Um poço de três metros, de espinhos de madeira, sob tábuas podres.',
          revelar: () => { if (salvo.espinhos) return false; salvo.espinhos = 'achado'; return true; },
        });
      }
    }
    return out;
  }

  async function depoisDeMover(c) {
    if (!estado.explorando) return;
    c.movementLeftFt = MOVIMENTO;
    const a = areaDe(c.pos);
    if (a) await descrever(a);
    await pistasPassivas(ctx, a);
    // Os gatilhos do livro: o que acorda quando o grupo chega perto, entra na sala ou mexe no que não devia.
    for (const g of pendentes()) {
      const r = ctx.gatilhos[g.id]?.(c, a);
      if (!r) continue;
      await combate(g, r.surpresa ?? null, r.intro ?? null);
      return;
    }
    if (ctx.aoMover) await ctx.aoMover(c, a);
  }

  /** O fim de cada luta: marca o grupo e volta a explorar. Derrota é o fim da partida. */
  async function fimDoCombate(outcome) {
    const g = estado.lutando;
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      const v = await narrar(root, {
        formato: 'tela',
        paginas: [{ titulo: 'A Casa da Morte', texto: ['O grupo caiu na Casa da Morte. A casa fica à espera do próximo.'] }],
        escolhas: [
          { rotulo: 'Voltar ao menu', valor: 'menu' },
          { rotulo: 'Tentar de novo', valor: 'denovo', primaria: true },
        ],
      });
      if (v === 'denovo') app.newEncounter({ ...config, continuarCom: null });
      else app.encerrarPartida();
      return;
    }
    if (g) {
      g.vencido = true;
      if (!salvo.vencidos.includes(g.id)) salvo.vencidos.push(g.id);
      const depois = ctx.depoisDaLuta?.[g.id];
      if (depois) await depois(g);
    }
    prepararExploracao();
  }

  /** O que o menu do botão direito oferece na casa clicada. */
  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const area = areaDe(tile);
    const ops = [];
    // As paredes de dentro, apodrecidas pela casa furiosa, se quebram (a surpresa: clicar na parede, e não no chão).
    if (sup === 'alvenaria') { fugaInteracoes(ctx, { area, tile, sup, c, ops }); return ops; }
    if (sup === 'parede') return ops;
    pistasInteracoes(ctx, { tile, c, ops });
    if (!area) { poraoInteracoes(ctx, { area: null, tile, sup, c, ops }); return ops; }
    // ---- 1º andar
    if (area.id === 'salao' || area.id === 'jantar') {
      const feito = area.id === 'salao' ? salvo.paineisSalao : salvo.paineisSala;
      const onde = { x: area.x1, y: area.y1 };
      ops.push({
        rotulo: 'Examinar os painéis da parede', icone: 'acao-procurar', detalhe: feito ? 'já examinados' : 'Percepção, CD 12',
        motivo: feito ? 'já examinados' : buscas.ja(c, 'painel', onde),
        fazer: async () => {
          buscas.marcar(c, 'painel', onde);
          const t = teste(c, 'percepcao', 12);
          if (!t.passou) { await painel(`${c.name} passa a mão pela madeira lustrada. Bonita, nada mais.`); return; }
          if (area.id === 'salao') salvo.paineisSalao = true; else salvo.paineisSala = true;
          await painel(area.id === 'salao'
            ? `${t.quem?.name ?? c.name} se aproxima da madeira entalhada e vê o que o enfeite esconde: serpentes e crânios, tecidos com discrição entre as videiras e as flores.`
            : `${t.quem?.name ?? c.name} segue as árvores esculpidas e acha o que elas escondem: rostos retorcidos nos troncos e lobos à espreita entre as folhas.`);
        },
      });
    }
    if (area.id === 'canil') {
      ops.push({
        rotulo: salvo.armarioAberto ? 'O armário do leste (aberto)' : 'Abrir o cadeado do armário do leste',
        icone: 'acao-usarObjeto', detalhe: salvo.armarioAberto ? 'já aberto' : 'ferramentas de ladrão, Prestidigitação, CD 15',
        motivo: salvo.armarioAberto ? 'já aberto' : longe(c, { x: 12, y: 21 }, 40),
        fazer: async () => {
          const ladrao = herois().find((h) => garantirInventario(h).bag.some((i) => i.id === 'ferramentasDeLadrao'));
          if (!ladrao) { await painel('O cadeado é pequeno e firme. Sem ferramentas de ladrão, não há o que fazer.'); return; }
          const t = teste(ladrao, 'prestidigitacao', 15);
          if (!t.passou) { await painel(`${ladrao.name} mexe no cadeado até a ponta da gazua entortar. Dá para tentar de novo com mais calma.`); return; }
          await abrirArmario();
        },
      });
    }

    // ---- 2º andar
    if (area.id === 'salaoSuperior' && sup !== 'escada') {
      ops.push({
        rotulo: 'Examinar as portas entalhadas', icone: 'acao-procurar', detalhe: salvo.portasEntalhadas ? 'já examinadas' : 'Percepção, CD 12',
        motivo: salvo.portasEntalhadas ? 'já examinadas' : buscas.ja(c, 'portas', { x: 4, y: 8 }),
        fazer: async () => {
          buscas.marcar(c, 'portas', { x: 4, y: 8 });
          const t = teste(c, 'percepcao', 12);
          if (t.passou) salvo.portasEntalhadas = true;
          await painel(t.passou
            ? `${t.quem?.name ?? c.name} olha duas vezes: os rapazes entalhados nas portas não dançam. Estão lutando contra enxames de morcegos.`
            : `${c.name} acha as portas bonitas: jovens dançando entre folhagens.`);
        },
      });
    }
    if (area.id === 'biblioteca') {
      ops.push({
        rotulo: salvo.chave ? 'A gaveta da escrivaninha (vazia)' : 'Abrir a gaveta da escrivaninha', icone: 'acao-usarObjeto',
        detalhe: salvo.chave ? 'já aberta' : 'uma chave de ferro',
        motivo: salvo.chave ? 'já aberta' : longe(c, { x: 3, y: 2 }, 25),
        fazer: async () => {
          salvo.chave = true;
          guardar(herois()[0], 'chaveDeFerroDosDurst', 1);
          await painel('A gaveta guarda uma única coisa: uma chave de ferro, comprida e escura. Pelo tamanho, é de porta pesada. Quem a pegou foi o primeiro do grupo.');
          app.refresh();
        },
      });
      if (!salvo.passagemAberta) {
        ops.push({
          rotulo: 'Procurar uma passagem nas estantes', icone: 'acao-procurar', detalhe: 'Percepção, CD 13 (uma tentativa por herói)',
          motivo: buscas.ja(c, 'passagem', PORTA_SECRETA),
          fazer: async () => {
            buscas.marcar(c, 'passagem', PORTA_SECRETA);
            const t = teste(c, 'percepcao', 13);
            if (!t.passou) { await painel(`${c.name} passa os dedos pelas lombadas e não acha nada que destoe. Outros olhos podem ajudar.`); return; }
            salvo.livroFalso = true;
            salvo.passagemAberta = true;
            mudarCasa(PORTA_SECRETA.x, PORTA_SECRETA.y, '?');
            await painel(`${t.quem?.name ?? c.name} repara num livro de capa vermelha e lombada branca que não é livro: é um interruptor. A estante gira e uma porta se abre nos fundos da biblioteca, mola nas dobradiças, pronta para fechar de novo.`);
            app.refresh();
          },
        });
      }
    }
    if (area.id === 'salaSecreta') {
      ops.push({
        rotulo: salvo.cartaLida ? 'Reler a carta de Strahd' : 'Ler a carta do esqueleto', icone: 'acao-procurar',
        detalhe: salvo.cartaLida ? 'a casa já mostrou a escada' : 'selo de Strahd von Zarovich', motivo: longe(c, { x: 8, y: 7 }, 15),
        fazer: async () => { if (salvo.cartaLida) await painel('A mesma letra fina e inclinada. A casa já mostrou o que queria mostrar.'); else await carta(c); },
      });
      ops.push({
        rotulo: salvo.baul ? 'O baú dos Durst (vazio)' : 'Abrir o baú', icone: 'acao-usarObjeto', detalhe: salvo.baul ? 'já aberto' : 'livros, pergaminhos e papéis',
        motivo: salvo.baul ? 'já aberto' : longe(c, { x: 8, y: 7 }, 15),
        fazer: async () => {
          salvo.baul = true;
          const quem = herois()[0];
          guardar(quem, 'livroEmBrancoPreto', 3);
          for (const id of ['pergaminhoDeBencao', 'pergaminhoDeProtecaoContraVeneno', 'pergaminhoDeArmaEspiritual', 'escrituraDaCasaDosDurst', 'escrituraDoMoinho', 'testamentoDosDurst']) guardar(quem, id, 1);
          await painel(`O mecanismo de dardos do baú já não dispara. Dentro: três livros em branco de capa preta, três pergaminhos (Bênção, Proteção contra Veneno e Arma Espiritual), a escritura da casa, a escritura de um moinho de vento nas montanhas a leste de Vallaki e um testamento assinado por Gustav e Elisabeth Durst, que deixa a casa e o moinho aos filhos. ${quem.name} guarda tudo; os papéis envelhecem se saírem da casa.`);
          app.refresh();
        },
      });
      ops.push({
        rotulo: 'Estudar os livros de ritual', icone: 'acao-procurar', detalhe: salvo.livrosEstudados ? 'já estudados' : 'uma hora, Arcanismo, CD 12',
        motivo: salvo.livrosEstudados ? 'já estudados' : null,
        fazer: async () => {
          const t = teste(c, 'arcanismo', 12);
          salvo.livrosEstudados = true;
          await painel(t.passou
            ? `Depois de uma hora de leitura, ${t.quem?.name ?? c.name} conclui o que as páginas escondem sob o verniz de erudição: os rituais não funcionam. Nenhum é verdadeiro.`
            : `Uma hora de diagramas e invocações em latim de cozinha. ${c.name} sai sem saber se estava lendo teoria ou besteira.`);
        },
      });
    }
    if (area.id === 'conservatorio') {
      ops.push({
        rotulo: 'Inspecionar as estatuetas de alabastro', icone: 'acao-procurar', detalhe: salvo.estatuetas ? 'já vistas' : 'olhar de perto',
        motivo: salvo.estatuetas ? 'já vistas' : null,
        fazer: async () => {
          salvo.estatuetas = true;
          await painel('Dançarinos bem vestidos, em alabastro. De perto, vários são esqueletos de casaca e vestido de baile, dançando com a mesma elegância dos outros.');
        },
      });
    }

    // ---- 3º andar, sótão e masmorras, e a saída da casa
    altoInteracoes(ctx, { area, tile, sup, c, ops });
    poraoInteracoes(ctx, { area, tile, sup, c, ops });
    fugaInteracoes(ctx, { area, tile, sup, c, ops });

    // ---- as escadas (todas as que a planta declara, onde a casa já as mostrou)
    if (sup === 'escada') {
      for (const e of andar.escadas ?? []) {
        if (!dentro(e.rect, tile)) continue;
        ops.push({
          rotulo: e.rotulo, icone: 'acao-usarObjeto', detalhe: e.detalhe, motivo: null,
          fazer: async () => {
            const passa = ctx.aoSubir ? await ctx.aoSubir(e) : true;
            if (passa !== false) irParaAndar(e.destino);
          },
        });
      }
    }
    return ops;
  }

  return {
    lugar: 'Casa da Morte',
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    ganchosMagicos,
    interacoesDoHeroi: (c) => interacoes(c.pos, enc.field.surfaceAt(c.pos.x, c.pos.y), c),
    depoisDeMover,
    fimDoCombate,
    evento() {},
    dialogoDe: () => null,
    depoisDaConversa: () => {},
    motivoSemDescanso: () => (estado.lutando ? 'Há uma luta em andamento.' : null),
    textoDoDescanso: () => ['Uma hora de vigia revezada num canto da sala.'],
    async iniciar() {
      prepararExploracao();
      // Quem chega de outro andar aparece onde a escada de lá termina, e não na porta da casa.
      const chegada = config.entrada && andar.chegadas?.[config.entrada];
      if (chegada) {
        herois().forEach((h, i) => { h.pos = { ...(chegada[i] ?? chegada[0]) }; });
        // Vir pelo alçapão do canil mostra o alçapão (e vir pela porta secreta da masmorra, a porta).
        if (config.entrada === 'casaDaMortePorao1' && variante === 'casaDaMorte1') { salvo.alcapaoCanil = true; mudarCasa(6, 22, 'l'); }
        if (config.entrada === 'casaDaMorte1' && variante === 'casaDaMortePorao1') { salvo.alcapao = true; mudarCasas([[36, 30], [36, 31]], '?'); }
        app.refresh();
      }
      if (ctx.aoChegar) await ctx.aoChegar(config.entrada);
      const a = areaDe(herois()[0]?.pos ?? { x: 2, y: 21 });
      if (a) await descrever(a);
    },
  };
}
