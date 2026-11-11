// AS RUÍNAS DE ÁRVORE TROVÃO (Parte 3 da aventura). Mapa em
// `game/arvoretrovao.js`, desenhado por `src/dev/mapa-arvoretrovao.py`.
//
// O QUE ESTA FASE É, e por que ela não se parece com as outras: não é uma
// masmorra para limpar. É um lugar com seis perigos de tamanhos muito
// diferentes, e a fase se ganha ESCOLHENDO quais encarar. O grupo chega aqui
// entre o 3º e o 5º nível; os números abaixo foram medidos no 3º, que é o
// pior caso.
//
// OS SEIS, MEDIDOS no mapa de verdade, com a luz de verdade, com as posições
// de chegada que a própria cena produz, e com duzentas lutas por célula. Grupo
// de quatro no 3º nível, que é o pior caso; derrota encerra a partida.
//
//   - o Presa Peçonhenta, na torre: no 3º nível, 93% de derrota e 85% de chance
//     de um herói MORRER; ele FOGE ao cair à metade dos PV (como no livro) e o
//     grupo o expulsa em 8% das lutas no 3º, 20% no 4º e 53% no 5º (morte de
//     herói: 85%, 57%, 53%). Não é luta difícil, é luta perdida no 3º. A cena
//     avisa duas vezes na aproximação e oferece quatro saídas na porta;
//   - (o Mormesk, que esta fase já teve no porão da casa do beco, é do capítulo da Mina e saiu
//     daqui; as medições dele ficam no histórico do repositório);
//   - as aranhas do armazém (eram do pomar, três): quem pisa a teia da rua ou entra as acorda, e
//     quem tem Percepção passiva abaixo de 17 é pego de surpresa (o livro: os quatro heróis do
//     grupo pronto, sempre). Com os arcos da loja alargados (as aranhas são Grandes e ficavam
//     presas lá dentro, e a luta virava abate de graça), no 3º nível: 18% dos PV, alguém no
//     chão em 55% das lutas, um herói morre em 9%. É a luta de um grupo de 4º nível do livro;
//   - os mortos de cinza da velha guarnição (área 11 do livro): 24% dos PV,
//     alguém no chão em 25% das lutas, nenhuma morte em 20;
//   - o culto do dragão, na casa de esquina: seis cultistas do SRD (CR 1/8, 25 XP cada, Favric entre
//     eles): 7% dos PV no 3º nível, menos de duas rodadas. É FÁCIL, e a conversa com eles existe
//     por outro motivo (ver abaixo);
//
// AS ÁREAS DO LIVRO (1, 2, 3, 5, 8, 9, 11, 12), ligadas à construção em que o
// livro as põe, com as quantidades dele: ramos secos (Galho Infectado, 25 XP)
// 2 / 6 / 8 / 6 nas áreas 1 / 2 / 5 / 12; zumbis das cinzas (zumbi com a Brisa
// das Cinzas) 4 / 2 / 5 nas áreas 3 / 8 / 11. Medido no 3º nível (20 lutas):
// Cavalo Pardo 11% dos PV, velha ferraria 6%, cabana com ramos 10% (com os dois
// da vizinha, 6 viram 8), fazenda de ramos 6% (4 viram 8 na rodada seguinte),
// tecelagem 6%. Os tesouros do livro: o baú da cabana ocidental e a caixa da
// herborista só aparecem a quem os procura (Percepção; a caixa é automática com
// a missão da Mirna), e a arca da torre só abre com o dragão morto ou expulso.
// Devolver o colar à Mirna, em Phandalin, vale 200 XP (ver `phandalin.js`).
//
// O QUE O ORÇAMENTO DO DMG DIRIA, e por que ele erra aqui: seis criaturas
// somam XP de sobra para chamar o culto de "difícil" no 3º nível, e ele mede fácil: são nove
// PV cada e um golpe de 1d6+1. O DMG também subestima os mortos de cinza. Onde a tabela e
// a medição discordam, a medição manda, porque é este motor que joga a luta.
//
// TRÊS AVISOS PARA QUEM VIER MEDIR DEPOIS, cada um um erro que já aconteceu:
//
// 1. A LUZ TEM DE SER PREENCHIDA. O `main.js` copia os dígitos de `mapa.luz`
//    para `field.luz`; um arranjo que só aloca o `Uint8Array` deixa tudo em 0,
//    que é BREU. As seis primeiras medições desta fase foram feitas assim, no
//    escuro, e TODAS saíram erradas — para mais e para menos. Com a luz certa,
//    o Mormesk subiu de 12% para 32% de morte de herói, e os mortos de cinza
//    caíram de 34% para 21% dos PV, porque perderam a vantagem da escuridão.
//
// 2. AS ARANHAS JÁ ESTIVERAM PRESAS. O pomar tinha três fileiras duplas de
//    tronco, e com `enc.reachableFor` e 600 pés de movimento cada aranha
//    alcançava DUAS casas: a pista tinha uma casa de altura e criatura Grande
//    precisa de 2 x 2. Davam 8,7 rodadas sem risco. Abrir a pista resolveu, e
//    aí o encontro virou nada (2,8 rodadas), e a alavanca passou a ser o
//    número delas, não as árvores. Ver o comentário em `aranhas`.
//
// 3. O POMAR NÃO ACEITA UM TRONCO A MENOS NEM A MAIS sem remedir. Tirar só um
//    dos dois troncos que trancavam a pista foi medido como PIOR que não
//    mexer: 10% de derrota e 8,3 rodadas, porque uma aranha escapa e a outra
//    continua presa.
//
// O CULTO MERECE UMA NOTA. A conversa com eles NÃO existe para evitar uma luta
// perigosa — existe porque matá-los é fácil e eles são gente, errada sobre um
// dragão. Por isso convencê-los (ou botá-los para correr) paga o XP INTEIRO, os 150
// do livro: pagar menos deixava a conversa pior nos dois eixos (menos XP E nenhum
// risco evitado). O perigo está na ALIANÇA: Favric é ambicioso, oferece servir ao dragão
// junto com o grupo e pretende entregá-lo a ele; quem aceita e entra na torre luta contra
// o dragão com os seis cultistas ao lado dele. Se Favric cai, o resto foge.
//
// O PRÊMIO da fase não é nenhum dos seis: é a Reidoth (mulher idosa no Obelisco; homem na Mina), que diz onde fica o
// Castelo Dentefino e, se o dragão sair da torre, guia o grupo até a Caverna Onda Eco. Dá para entrar, falar com ele e sair
// sem desembainhar nada — e isso é uma vitória, não uma fuga.
//
// AS REGRAS são do livro; o TEXTO é nosso. Os FATOS que ficam: a vila morreu
// quando o Monte Hotenow explodiu e ninguém voltou; um dragão verde jovem tomou
// a torre; um punhado de cultistas tenta agradá-lo; a druida Reidoth vai e vem
// por ali e conhece a região como ninguém.
//
// O estado mora em `app.campanha.arvoreTrovao` e sobrevive a sair e voltar.

import { narrar } from '../view/narrativa.js';
import { distanceFt, ARESTA, GLIFOS, SUPERFICIES } from '../core/grid.js';
import { d20 } from '../core/dice.js';
import { skillBonus, passivePerception, SKILL_NAME, rolarPericia } from '../rules/abilities.js';
import { addCondition } from '../rules/conditions.js';
import { criarBuscas } from './buscas.js';
import { EXAMES, ACOES, ACHADO_DO_CASULO, EMPURRAR_ESTATUA, CONTEINERS, achadoDoRecipiente, VISTA_DO_ALTO } from './arvoretrovao-exames.js';
import { makeMonster } from '../rules/monsters.js';
import { makeNpc } from '../rules/npcs.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { ARVORE_TROVAO } from './arvoretrovao.js';
import { alternarRegiao } from '../rules/regioes.js';
import { guardar, cobrar, totalEmCobre } from './comercio.js';

const MOVIMENTO = 60;
const dentro = (p, r) => p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1;
// Dentro de um prédio de verdade: as casas do CÔMODO (`celulas`), e não o
// retângulo que o envolve. A torre é redonda, e dois cantos do retângulo dela
// eram rua do lado de fora da parede — quem pousava ali disparava a conversa
// com o dragão sem poder ser visto por ele.
const CELULAS_DE = (id) => new Set((ARVORE_TROVAO.celulas?.[id] ?? []).map((c) => `${c.x},${c.y}`));
const naCasa = (p, id) => CELULAS_DE(id).has(`${p.x},${p.y}`);
/** A casa pertence a alguma construção que NÃO seja `menos`? É o que tira a zona de um bando de cima do vizinho. */
const emOutroLugar = (p, menos) => Object.entries(ARVORE_TROVAO.celulas ?? {})
  .some(([id, cs]) => id !== menos && cs.some((c) => c.x === p.x && c.y === p.y));

export function criarArvoreTrovao(app, config) {
  void config;
  const enc = app.enc;
  const root = app.root;
  const camp = (app.campanha ??= {});
  const feitos = (camp.feitos ??= {});
  const vila = (camp.vila ??= { pistas: [], missoes: {} });
  const salvo = (camp.arvoreTrovao ??= {
    zumbis: false, aranhas: false, culto: null,
    dragao: null, arca: false, bau: false, avisos: 0,
    // As áreas do livro (1, 2, 3, 5, 8, 12 e os dois tesouros escondidos).
    ramos1: false, ramos2: false, ramos5: false, ramos12: false,
    zumbisCavalo: false, zumbisFerraria: false,
    bauMercador: false, caixaMirna: false, cultoAlertado: false, dragaoFugiu: false,
  });
  salvo.buscas ??= {};
  const buscas = criarBuscas(salvo.buscas);
  const estado = { explorando: false, encerrado: false, lutando: null };

  const herois = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead && c.hp > 0);
  const casaPerto = (p) => enc.casaLivreMaisProxima(p) ?? p;
  // Um teste de perícia de UM herói (a `buscas` limita a uma tentativa por herói).
  const teste = (c, pericia, cd) => {
    const r = rolarPericia(enc.rng, c, pericia);
    return { quem: c.name, pericia: SKILL_NAME[pericia], total: r.total, cd, passou: r.total >= cd };
  };
  const painel = (texto, extra = {}) => narrar(root, { formato: 'painel', paginas: [{ texto: [].concat(texto), ...extra }] });
  const pista = (t) => { if (!(vila.pistas ??= []).includes(t)) vila.pistas.push(t); };

  // ------------------------------------------------------- o elenco ----
  // AS CASAS VÊM DO MAPA, e não escritas aqui.
  //
  // Elas já estiveram escritas, uma a uma, com um comentário dizendo que
  // tinham sido conferidas no mapa gerado — e tinham, no mapa de 44 x 30.
  // Quando o mapa virou 54 x 38 elas continuaram apontando para o traçado
  // velho: o dragão nascia num pedaço de rua a catorze casas da torre dele, um
  // galho infectado nascia dentro de parede, e os cultistas nasciam em terreno
  // aberto em vez de dentro da loja. O teste pegou dois casos; os outros
  // teriam passado calados, porque casa errada que por acaso é chão não
  // reclama de nada.
  //
  // Agora quem escolhe é `src/dev/mapa-arvoretrovao.py`, DEPOIS de selar o
  // mapa: toda vaga é chão livre E alcançável pelo andarilho do motor, e as
  // Grandes (aranha, dragão) têm as quatro casas de que precisam. Mexer no
  // traçado move os bandos junto.
  const ninho = ARVORE_TROVAO.ninhos;
  const nasce = (tipo, pos, sufixo) =>
    makeMonster(tipo, { ...pos }, sufixo ? { nameSuffix: sufixo } : {});

  // OS BANDOS DO LIVRO, nas construções e nas quantidades dele (ver o mapa
  // `OBJETOS-ARVORE-TROVAO.md`). RAMOS SECOS são os Galhos Infectados: 25 XP e 4 PV
  // cada, o bloco do livro (2 na cabana ocidental, 6 na cabana com ramos, 8 na
  // fazenda de ramos, 6 na tecelagem). ZUMBIS DAS CINZAS são o zumbi do SRD com a
  // Brisa das Cinzas: 4 no Cavalo Pardo, 2 na ferraria, 5 na velha guarnição.
  // O Obelisco pôs DOZE ramos na fazenda: as letras vão até o L. E os ESPETOS INFECTADOS (o arbusto-agulha) entram
  // junto com os ramos do mesmo mato, no mesmo bando — é a mesma luta, e o fim dela conta os dois.
  const ramosDe = (chave) => ninho[chave].map((pos, i) => nasce('galhoInfectado', pos, 'ABCDEFGHIJKL'[i]));
  const espetosDe = (chave) => (ninho[chave] ?? []).map((pos, i) => nasce('espetoInfectado', pos, 'AB'[i]));
  const zumbisDe = (chave) => ninho[chave].map((pos, i) => nasce('zumbiDasCinzas', pos, 'ABCDE'[i]));
  const ramos1 = salvo.ramos1 === 'limpo' ? [] : ramosDe('ramos1');
  const ramos2 = salvo.ramos2 === 'limpo' ? [] : ramosDe('ramos2');
  const ramos5 = salvo.ramos5 === 'limpo' ? [] : [...ramosDe('ramos5'), ...espetosDe('agulhas5')];
  const ramos12 = salvo.ramos12 === 'limpo' ? [] : [...ramosDe('ramos12'), ...espetosDe('agulhas12')];
  const zumbisCavalo = salvo.zumbisCavalo === 'limpo' ? [] : zumbisDe('zumbisCavalo');
  const zumbisFerraria = salvo.zumbisFerraria === 'limpo' ? [] : zumbisDe('zumbisFerraria');
  // A velha guarnição (a área 11 do livro): cinco zumbis das cinzas. Era a
  // "casca do sudeste", com cinco zumbis comuns; o livro põe os mortos aqui.
  const zumbis = salvo.zumbis ? [] : zumbisDe('zumbis');
  // As aranhas são GRANDES e moram no pomar morto do sudoeste: o gerador as acha
  // juntas na boca do pomar, 2 x 2 livres cada uma. SÃO DUAS, como no livro —
  // ver `acordarAranhas` para a medição que decidiu.
  const aranhas = salvo.aranhas ? []
    : ninho.aranhas.map((p, i) => nasce('aranhaGigante', p, 'ABC'[i]));
  // O CULTO (área 13 do livro): seis cultistas do SRD, Favric entre eles (quem fala por todos).
  // Moram na casa de esquina, de porta trancada por dentro.
  const cultistas = salvo.culto ? [] : [
    nasce('cultista', ninho.culto[0]),
    ...ninho.culto.slice(1).map((p, i) => nasce('cultista', p, 'ABCDE'[i])),
  ];
  const chefeDoCulto = cultistas[0];
  if (chefeDoCulto) chefeDoCulto.ficha = 'favric';
  if (chefeDoCulto) chefeDoCulto.name = 'Favric';
  const dragao = salvo.dragao ? null : nasce('dragaoVerdeJovem', ninho.dragao[0]);
  if (dragao) dragao.name = 'Presa Peçonhenta';
  const reidoth = makeNpc('reidoth', { ...ARVORE_TROVAO.reidoth });

  const todosOsBandos = () => [zumbis, aranhas, cultistas,
    dragao ? [dragao] : [],
    ramos1, ramos2, ramos5, ramos12, zumbisCavalo, zumbisFerraria];

  // REFORÇOS DO LIVRO: a fazenda de ramos manda dois ramos por cada porta a cada
  // rodada, e os ramos da cabana ocidental correm para ajudar os da vizinha um
  // turno depois. `porRodada` é { [rodada]: { bando, aviso } }; o motor pergunta
  // a cada rodada (`spawnReinforcements`).
  function prepararReforcos(porRodada) {
    estado.reforcos = [];
    const trazer = (ate) => {
      const chaves = Object.keys(porRodada).map(Number).sort((a, b) => a - b).filter((k) => k <= ate);
      for (const k of chaves) {
        const l = porRodada[k];
        const units = l.bando.filter((f) => !f.dead && !enc.combatants.includes(f));
        if (!units.length) continue;
        for (const f of units) f.side = 'foes';
        estado.reforcos.push(...units);
        return { units, aviso: l.aviso };
      }
      return null;
    };
    enc.reinforcements = (rodada) => trazer(rodada);
    // O CAMPO VAZIO NÃO ACABA A LUTA: se o grupo derruba a primeira leva antes
    // de a segunda chegar, a segunda chega agora (o livro as manda de qualquer
    // jeito, e vencer "cedo demais" não pode ser um jeito de pular metade dos
    // ramos). O motor chama isto antes de dar a vitória.
    enc.lotePendente = () => trazer(Infinity);
  }

  /** As rolagens de Furtividade do bando: o livro compara com a Percepção passiva. */
  const furtividadeDe = (bando) => bando.map((f) => rolarPericia(enc.rng, f, 'furtividade').total);

  function prepararExploracao() {
    enc.reinforcements = null;
    enc.lotePendente = null;
    estado.reforcos = [];
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

  function luta(quem, surpresa = null) {
    for (const f of quem) {
      if (f.dead) continue;
      f.side = 'foes';
      if (enc.combatants.includes(f)) continue;
      // A PEGADA INTEIRA, não só a âncora. Uma criatura Grande ocupa 2 x 2, e
      // testar só a casa de cima deixava a aranha nascer em cima de um herói
      // que estivesse na casa de baixo — e o dragão idem, com um herói na
      // porta. `enc.occupied` olha uma casa; aqui se olham as quatro.
      const grande = (f.size ?? f.tamanho) === 'grande';
      const pegada = grande ? [[0, 0], [1, 0], [0, 1], [1, 1]] : [[0, 0]];
      if (pegada.some(([dx, dy]) => enc.occupied(f.pos.x + dx, f.pos.y + dy, f))) {
        f.pos = { ...f.pos, ...casaPerto(f.pos) };
      }
      enc.addCombatant(f);
    }
    estado.explorando = false;
    estado.lutando = quem;
    root.classList.remove('explorando');
    enc.emboscada = surpresa === 'nossa'
      ? { emboscadores: 'party', furtividade: herois().map(() => 20) }
      // `{ furt: [...] }`: a emboscada DELES com as rolagens de Furtividade de
      // verdade (os ramos secos do livro: Furtividade contra a Percepção passiva).
      : (surpresa === 'deles' || surpresa?.furt)
        // TREZE, medido. Com 16 o bando inteiro era pego de surpresa em todos
        // os níveis; com 13 só o mago (passiva 11) é, e o custo medido da
        // diferença é meio ponto de PV do grupo. O painel mostra "cinco
        // formas" ANTES da luta, então surpresa total também não se sustenta
        // na ficção — eles são vistos, só não se sabe que estão de pé.
        ? { emboscadores: 'foes', furtividade: surpresa?.furt ?? quem.map(() => 13) }
        : null;
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
  }

  // ------------------------------------------------- os seis perigos ----
  // Cada um acorda quando o grupo chega perto o bastante, e cada um tem uma
  // cara própria de acordar. Nenhum persegue o grupo pelo mapa inteiro: isto
  // é uma vila, não um corredor.
  // OS MORTOS DE CINZA estão DEITADOS: quem fica de pé gasta metade do
  // deslocamento para se levantar, como no livro. Cada zumbi nasce caído, e o
  // motor cobra o levantar dele (`standUp`).
  const deitados = (bando) => { for (const f of bando) if (!f.dead) addCondition(f, 'caido'); };

  // A VELHA GUARNIÇÃO (área 11): cinco zumbis de farda enferrujada, a casa mais
  // inteira da vila depois da torre. A farda enferrujada não dá CA, como o livro
  // diz de propósito.
  async function acordarZumbis() {
    salvo.zumbis = 'luta';
    await painel([
      'A guarnição aguentou o tempo melhor que o resto da vila: parapeito no alto, seteiras na parede, um alçapão no chão da sala principal que sobe ao telhado. E cinco formas de farda, deitadas em fila com as botas voltadas para a porta, como quem dormiu de serviço.',
      'A primeira senta. A cinza escorre do rosto dela como areia de um saco furado, e a ferrugem da armadura estala em cada junta. O que sobrou do uniforme não protege de nada.',
    ], { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    const bando = zumbis.filter((f) => !f.dead);
    deitados(bando);
    luta(bando);
  }

  // O CAVALO PARDO (área 3): a taverna do cavalo com a caneca.
  async function acordarZumbisDoCavalo() {
    salvo.zumbisCavalo = 'luta';
    await painel([
      'A tinta da placa quase saiu, mas ainda dá para ver o cavalo e a caneca. Lá dentro a luz cai pelas frestas do telhado e deita em seis montes de cinza e trapo, entre os tanques velhos e debaixo do balcão. Um cheiro de fermento azedo, de cerveja que morreu há trinta anos.',
      'Um dos montes puxa o joelho para o peito. O outro vira a cabeça — sem pressa nenhuma — para o lado da porta.',
    ], { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    const bando = zumbisCavalo.filter((f) => !f.dead);
    deitados(bando);
    luta(bando);
  }

  // A VELHA FERRARIA (área 8): quatro deitados entre as ferramentas (o Obelisco; eram dois na Mina).
  async function acordarZumbisDaFerraria() {
    salvo.zumbisFerraria = 'luta';
    await painel([
      'Uma chaminé comprida sobe da parede quebrada, e do lado de fora uma pilha de lenha apodreceu de tombar. Dentro, pinças, um fole furado e a ponta de uma bigorna estão espalhados pelo chão, entre quatro montes de cinza do tamanho de homem.',
      'Os montes se mexem quando a primeira bota pisa a soleira.',
    ], { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    const bando = zumbisFerraria.filter((f) => !f.dead);
    deitados(bando);
    luta(bando);
  }

  // A CABANA OCIDENTAL (área 1): dois ramos escondidos ao lado da porta aberta.
  // Eles NÃO atacam por vontade própria — o livro é claro — mas correm a ajudar a
  // vizinha se a luta da área 2 começar. Quem os descobre pode decidir.
  async function aoEntrarNaCabanaOcidental() {
    if (salvo.ramos1 || !ramos1.length) return;
    const furt = furtividadeDe(ramos1)[0];
    const quem = herois().filter((h) => passivePerception(h) >= furt);
    if (!quem.length) { salvo.ramos1 = 'escondidos'; return; }
    salvo.ramos1 = 'vistos';
    const r = await narrar(root, {
      formato: 'painel',
      paginas: [{ texto: [
        `${quem[0].name} repara: ao lado da porta aberta, no mato que cresce rente à parede, dois galhos secos se mexem contra o vento — e não há vento.`,
        'Não vêm para cima de ninguém. Ficam ali, quietos, esperando que alguém dê o primeiro passo.',
      ] }],
      escolhas: [
        { rotulo: 'Atacar os dois', valor: 'luta', primaria: true },
        { rotulo: 'Deixá-los em paz', valor: 'sai' },
      ],
    });
    if (r === 'luta') { salvo.ramos1 = 'luta'; luta(ramos1.filter((f) => !f.dead)); }
  }

  // A CABANA COM RAMOS (área 2): duas casas lado a lado, dois ramos escondidos no
  // mato que cresce dentro delas. O livro faz o teste dos ramos (Furtividade)
  // contra a Percepção passiva de cada herói: quem perde é surpreendido.
  async function acordarRamosDaCabana() {
    salvo.ramos2 = 'luta';
    const bando = ramos2.filter((f) => !f.dead);
    const furt = furtividadeDe(bando);
    await painel([
      'Duas casas de pedra lado a lado, paredes meio caídas, árvores novas furando o piso. Dá para ver que foram de lojistas ou de fazendeiros bem de vida: sobraram só pilhas de entulho e mato crescido nas sombras.',
      'O mato mexe. Dois galhos secos se desprendem dele ao mesmo tempo e vêm andando, de pernas tortas.',
    ], { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    // Os dois da cabana ocidental correm em ajuda um turno depois.
    const vizinhos = ramos1.filter((f) => !f.dead);
    if (vizinhos.length && salvo.ramos1 !== 'limpo') {
      // Eles correm: na rodada 2 já estão a meio caminho (nasciam a ~40 pés e quase nunca chegavam a atacar).
      const alvo = ninho.ramos2[0];
      for (const f of vizinhos) {
        f.pos = { ...f.pos, x: f.pos.x + Math.round((alvo.x - f.pos.x) * 0.7), y: f.pos.y + Math.round((alvo.y - f.pos.y) * 0.7) };
      }
      prepararReforcos({ 2: { bando: vizinhos, aviso: 'Dois galhos secos da cabana ocidental chegam correndo, um turno atrás dos outros.' } });
    }
    luta(bando, { furt });
  }

  // A FAZENDA DE RAMOS (área 5): no Obelisco são DOZE ramos e DOIS espetos infectados no mato a leste (eram oito
  // ramos na Mina). Mexer na casa os acorda, e eles chegam em duas levas: os dois espetos, que atiram de longe, e
  // seis ramos agora; os outros seis na rodada seguinte, pelo outro lado.
  async function acordarRamosDaFazenda() {
    salvo.ramos5 = 'luta';
    const bando = ramos5.filter((f) => !f.dead);
    const espetos = bando.filter((f) => f.defId === 'espetoInfectado');
    const galhos = bando.filter((f) => f.defId !== 'espetoInfectado');
    // O OBELISCO: três rodadas, quatro galhos por rodada (dois por porta, a do sul e a do norte), e os dois espetos
    // na terceira, um por porta.
    const primeira = galhos.slice(0, 4);
    const segunda = galhos.slice(4, 8);
    const terceira = [...galhos.slice(8), ...espetos];
    await painel([
      'A casa da fazenda foi engolida pelo mato até a metade, e o mato cresce por dentro das fundações. Quem mexe no entulho acorda o que dorme debaixo dele.',
      'A leste, a sarça inteira se levanta: galhos, aos pares, a andar, dois para cada porta da casa. E o mato ainda se mexe atrás deles.',
    ], { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    const ondas = {};
    if (segunda.length) ondas[2] = { bando: segunda, aviso: `Mais ${segunda.length} galhos secos chegam, dois por porta.` };
    if (terceira.length) ondas[3] = { bando: terceira, aviso: 'Os últimos galhos chegam — e atrás deles duas moitas maiores, eriçadas de agulhas, uma em cada porta.' };
    if (Object.keys(ondas).length) prepararReforcos(ondas);
    luta(primeira);
  }

  // A CABANA DO TECELÃO (área 12): no Obelisco, quatro ramos nos arbustos ao sul e dois espetos infectados nas
  // árvores do lado leste da rua (eram seis ramos na Mina). O barulho chega aos cultistas da casa de pedra — que
  // vêm ver, com cuidado.
  async function acordarRamosDoTecelao() {
    salvo.ramos12 = 'luta';
    const bando = ramos12.filter((f) => !f.dead);
    const furt = furtividadeDe(bando);
    await painel([
      'Um tear quebrado num canto e entulho até a altura do joelho: é o que sobrou da cabana. Pelo vão da parede do sul se vê o mato — e o mato tem pernas.',
      'Quatro galhos secos saem dos arbustos de uma vez — e do outro lado da rua, entre as árvores, duas moitas eriçadas soltam uma chuva de agulhas.',
    ], { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    salvo.cultoAlertado = true;
    luta(bando, { furt });
  }

  // AS DUAS ARANHAS GIGANTES do armazém destruído (área 6 do livro): a teia no chão da
  // porta é o aviso, e entrar as acorda. São DUAS, como no livro — a cena já teve três no pomar,
  // e a medição mostrou o porquê: três a 60 pés da chegada deixam alguém no chão em 51% das lutas.
  // Elas esperam penduradas na teia, e o teste de Furtividade delas decide quem é surpreendido.
  async function acordarAranhas(naTeia = []) {
    salvo.aranhas = 'luta';
    // A teia da rua é o aviso DELAS: quem a pisa balança os fios que chegam às paredes de dentro.
    // Terreno difícil, e quem pisou tenta não se grudar (Atletismo CD 10); o que falha fica contido
    // (Força CD 12 para se soltar, como no livro).
    const presos = [];
    for (const h of naTeia) {
      const t = teste(h, 'atletismo', 10);
      if (t.passou) continue;
      addCondition(h, 'contido', { source: 'teia', data: { escape: 12, soForca: true } });
      presos.push(h.name);
    }
    await painel([
      naTeia.length
        ? 'Os fios da rua não estão soltos: cada um corre pela poeira até uma fresta do armazém, e o pé que pisa um deles puxa todos. Lá dentro, algo acorda.'
        : 'O armazém foi feito para guardar: prateleiras de ponta a ponta, vigas baixas, um piso de tábua que ainda aguenta. Agora é uma caixa de teia, e cada fio que se toca avisa quem mora nela.',
      'Das frestas das paredes de dentro saem duas formas ao mesmo tempo, de cabeça para baixo, grandes como cão de caça. Estavam ali o tempo todo.',
      ...(presos.length ? [`${presos.join(' e ')} ficam grudados na teia da rua.`] : []),
    ], { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    // Quem tem Percepção passiva abaixo de 17 é pego de surpresa (o livro).
    luta(aranhas.filter((f) => !f.dead), { furt: aranhas.map(() => 17) });
  }

  // ------------------------------------------------------ o dragão ----
  // TRÊS AVISOS antes de deixar entrar, e a porta continua aberta para sair.
  // Um dragão verde jovem é 3.900 de XP contra um grupo de 4º nível: não é um
  // encontro difícil, é um encontro perdido. A fase não esconde isso — ela
  // conta, e deixa a escolha com o jogador.
  async function avisoDaTorre(n) {
    salvo.avisos = Math.max(salvo.avisos, n);
    if (n === 1) {
      await painel([
        'A torre é a única coisa de pé na vila que ainda tem telhado. A porta dela está aberta, a folha encostada na parede, e do vão sai um cheiro doce e pesado, de fruta passada misturada com mato queimado.',
        'No chão, na frente da porta, há quatro riscos fundos na pedra, lado a lado, do tamanho de um braço.',
      ]);
      return;
    }
    if (n === 2) {
      await painel([
        'Mais perto, dá para ver o que a cinza do chão esconde: um elmo amassado como papel, e dentro dele coisa que não se olha duas vezes. E, a três passos, metade de um escudo com um brasão que ninguém da região usa.',
        'Lá dentro, a respiração. Longa, grossa, com um assobio no fim — como fole velho. Devagar. Quem respira assim não está com pressa.',
      ]);
    }
  }

  // O PREÇO DO TRIBUTO, em peças de cobre. MEDIDO, não escolhido no olho: o
  // grupo pronto chega aqui com 84 a 108 peças de ouro (`makeParty` mais o que
  // as fases anteriores derrubam), então as 150 po da primeira versão eram
  // impagáveis e a opção nunca aparecia. Setenta e cinco é quase tudo que eles
  // têm — dói de verdade — e cabe no bolso de quem jogou uma fase.
  const TRIBUTO = 75 * 100;

  /**
   * A ÁRVORE DO DRAGÃO. Um dragão verde é inteligente, vaidoso e mentiroso —
   * lutar não é a única coisa que ele sabe fazer, e a cena desperdiçava isso.
   *
   * O FURO QUE ISTO RESOLVE: antes havia só "sair de ré" (grátis) e "encarar"
   * (97% de derrota). Qualquer negociação seria estritamente pior que ir
   * embora, porque ir embora não custava nada. Então negociar tem de GANHAR
   * algo: ele mora nesta torre há mais de um ano, numa região onde os
   * emissários do Aranha Negra andam circulando, e o que ele vende é isso.
   *
   * As quatro saídas, e o que cada uma custa:
   *   - TRIBUTO: 150 po. Compra a informação e a passagem;
   *   - ACORDO: ele quer a druida morta. Paga a informação E duas poções da
   *     arca — e custa a Reidoth, que não fala mais com quem fechou isso.
   *     Quem já ouviu a druida antes sai no lucro, e isso é de propósito;
   *   - LISONJA: Persuasão CD 16, de graça. Falhando, ele perde a paciência e
   *     a SAÍDA DE GRAÇA some: sobra pagar, fechar o acordo ou lutar;
   *   - SAIR: grátis, e não rende nada.
   */
  function arvoreDoDragao() {
    const temTributo = () => totalEmCobre(herois()) >= TRIBUTO;
    const contarDoAranha = () => {
      feitos.sabeOAranha = true;
      pista('O dragão de Árvore Trovão disse que um elfo do fundo da terra — um drow que se chama de Aranha Negra — mandou emissários à torre dele, atrás de uma mina velha debaixo dos morros a leste de Phandalin.');
    };
    return {
      inicio: 'oi',
      nos: {
        oi: {
          narra: 'Do vão da porta já se vê: o salão de baixo não tem piso de pedra, tem piso de moeda. Cobre, prata, pedaços de prato, uma espada sem cabo, tudo pisado e misturado com osso. E em cima disso, enrolado como gato na frente da lareira, verde de musgo molhado, com a cabeça no próprio flanco, um dragão. Um olho está aberto. Esteve aberto o tempo todo.',
          fala: 'Entrem. Fiquem à vontade, pisem no que quiserem. Ninguém que entrou aqui saiu reclamando do serviço.',
          opcoes: [
            { texto: `Trouxemos tributo, senhor. (${TRIBUTO / 100} po)`, vai: 'tributo',
              requer: () => (temTributo() ? null : 'o grupo não tem tanto ouro') },
            // CD 14, não 16: vaidade é a fraqueza de um dragão verde, então a
            // lisonja tem de ser a MELHOR aposta, não a pior. Medido, o melhor
            // falante do grupo pronto tem +1 em Persuasão: 40% aqui, contra
            // 30% na CD 16. Um grupo com bardo ou paladino passa muito mais.
            { texto: '(Elogiar a torre, o tesouro, e chamá-lo de senhor disto tudo)',
              teste: { pericia: 'persuasao', cd: 14 }, sucesso: 'agradado', falha: 'impaciente' },
            { texto: 'O senhor quer alguma coisa feita?', vai: 'acordo' },
            { texto: 'Desculpe o incômodo. Já vamos.', fim: 'sai' },
            { texto: 'Às armas.', fim: 'luta' },
          ],
        },
        tributo: {
          ao: () => { cobrar(herois(), TRIBUTO); },
          narra: 'O ouro vai ao chão no meio do resto do ouro, e ele não se mexe para olhar. Mas o olho que estava aberto se fecha um pouco, de contentamento.',
          fala: 'Educado. É raro. Então eu pago com educação também: vocês saem daqui de pé.',
          opcoes: [{ texto: '…', vai: 'paga' }],
        },
        agradado: {
          narra: 'Ele ouve até o fim, e quando acaba, levanta a cabeça do flanco pela primeira vez. É pior quando ele levanta a cabeça.',
          fala: 'Continuem. Não, estou brincando. — A boca dele faz algo que não é um sorriso. — Vocês têm razão em tudo que disseram, e isso me põe de bom humor, o que é bom para vocês.',
          opcoes: [{ texto: '…', vai: 'paga' }],
        },
        paga: {
          ao: () => contarDoAranha(),
          fala: 'Vou dar uma coisa de graça, porque ela não me serve. Há uns meses vieram dois, de capuz, falar comigo com muita cerimônia. Um elfo do fundo da terra e o criado dele. Queriam saber se eu tinha achado um buraco velho na rocha, de anão, nos morros a leste da vila nova de vocês. O elfo se chamava de Aranha Negra, como se isso fosse um nome.',
          narra: 'Ele volta a apoiar a cabeça no flanco.',
          opcoes: [{ texto: 'E o senhor tinha?', vai: 'tinha' }],
        },
        tinha: {
          fala: 'Se eu tivesse, não estaria nesta torre. Agora saiam, antes que eu lembre que estou com fome.',
          opcoes: [{ texto: '…', fim: 'sai' }],
        },
        acordo: {
          narra: 'A resposta vem rápido demais, como quem já tinha pensado nisso.',
          fala: 'Quero. Anda um velho de peles por essa vila, falando com o mato. Ele está tentando me tirar daqui — não com espada, que isso eu resolveria dormindo, mas com paciência, e paciência me incomoda. Tragam-no para mim, ou tragam notícia de que ele parou de andar. Em troca, eu esqueço que vocês entraram aqui, e dou algo da arca por conta.',
          opcoes: [
            { texto: 'Feito.', fim: 'acordo' },
            { texto: 'O velho não fez nada a nós.', vai: 'recusou' },
          ],
        },
        recusou: {
          narra: 'Ele não se ofende. É pior: ele acha graça.',
          fala: 'Que bonito. Então paguem de outro jeito, ou saiam, ou fiquem — as três me servem.',
          opcoes: [
            { texto: `Trouxemos tributo, senhor. (${TRIBUTO / 100} po)`, vai: 'tributo',
              requer: () => (temTributo() ? null : 'o grupo não tem tanto ouro') },
            { texto: 'Nós vamos.', fim: 'sai' },
            { texto: 'Às armas.', fim: 'luta' },
          ],
        },
        impaciente: {
          narra: 'A lisonja morre no meio. Ele esperou o fim por educação, e a educação acabou.',
          fala: 'Não. Vocês estão falando comigo como se eu fosse um prefeito. Eu moro em cima de ouro e como quem bate na minha porta. Saiam enquanto a ideia me parece engraçada.',
          // FALHAR NA LISONJA NÃO TIRA A SAÍDA DE GRAÇA. A primeira versão
          // tirava, e a medição mostrou o que isso fazia: o melhor falante do
          // grupo pronto tem +1 em Persuasão, então a CD 16 passa em 30% das
          // vezes — e nos outros 70% o jogador que tentou conversar ficava sem
          // saída grátis, com 150 po que ele não tinha e uma luta de 97% de
          // derrota. Conversar virava pior que ir embora, que é exatamente o
          // furo que esta árvore existe para fechar.
          //
          // Agora falhar custa a OPORTUNIDADE: ele se fecha, a informação se
          // perde, e a porta continua aberta. É uma aposta honesta.
          opcoes: [
            { texto: 'Nós vamos, senhor.', fim: 'sai' },
            { texto: 'Às armas.', fim: 'luta' },
          ],
        },
      },
    };
  }

  async function entrarNaTorre() {
    const r = await app.conversarCom(dragao, arvoreDoDragao());
    if (r === 'acordo') {
      salvo.dragao = 'acordo';
      salvo.acordoComDragao = true;
      feitos.acordoComODragao = true;
      guardar(herois()[0], 'pocaoDeCura', 2);
      await painel([
        'Ele estica uma garra, puxa dois frascos de dentro da arca e os empurra pelo chão de moedas até a porta, sem levantar a cabeça.',
        'O grupo sai andando para trás. O olho acompanha, e agora há duas coisas naquele olho: fome e divertimento.',
        '(A Reidoth vai saber. Um dragão assim faz questão de contar.)',
      ]);
      return;
    }
    if (r !== 'luta') {
      salvo.dragao = 'evitado';
      await painel('Ninguém dá as costas. O grupo sai do vão de lado, um por vez, e o olho acompanha até o último. Lá dentro, a respiração continua no mesmo compasso. Ele não se levantou.');
      return;
    }
    // Última chance, e dita com números: a tela não conduz a escolha, só
    // informa. Medido, uma luta destas acaba a campanha em quase toda tentativa.
    const certeza = await narrar(root, {
      formato: 'painel',
      // Os números são os do bloco (`rules/monsters/aberracoes.js`), e são
      // ditos de propósito: a tela não conduz a escolha, informa. A primeira
      // versão dizia "ácido" aqui, e o sopro dele é VENENO — um jogador que
      // preparasse a resistência errada decidiria com informação falsa.
      paginas: [{ titulo: 'Tem certeza?', texto: [
        `Ele tem 136 pontos de vida e CA 18. O grupo inteiro soma ${herois().reduce((s, c) => s + c.maxHp, 0)}.`,
        'O sopro é um cone de gás venenoso de nove metros — pega o grupo todo na porta —, 12d6 de dano, resistência de Constituição contra CD 14. Metade disso, para quem passar, ainda derruba a maioria dos heróis deste nível. E ele recarrega o sopro.',
        'E se começar, não há como correr: ele voa a oitenta pés por rodada, e o herói mais rápido do grupo anda trinta. Um dragão novo, porém, não luta até a morte: cai à metade da vida e foge. O difícil é chegar lá, debaixo desse sopro.',
        'Não há vergonha em fechar esta porta.',
      ] }],
      escolhas: [
        { rotulo: 'Fechar a porta', valor: 'sai', primaria: true },
        { rotulo: 'Entrar de uma vez', valor: 'luta' },
      ],
    });
    if (certeza !== 'luta') {
      salvo.dragao = 'evitado';
      await painel('O grupo recua para a rua. A respiração lá dentro não muda de ritmo.');
      return;
    }
    salvo.dragao = 'luta';
    // QUEM ACEITOU A ALIANÇA DE FAVRIC: os seis entram atrás do grupo e lutam ao lado do dragão.
    if (salvo.culto === 'aliado') {
      const traidores = cultistas.filter((f) => !f.dead);
      for (const f of traidores) {
        f.pos = { ...ARVORE_TROVAO.portaDaTorre };
        const i = enc.combatants.indexOf(f);
        if (i >= 0) enc.combatants.splice(i, 1);
      }
      if (traidores.length) {
        prepararReforcos({ 2: { bando: traidores, aviso: 'Favric e os seus entram atrás do grupo, e as cimitarras se viram para o lado errado.' } });
      }
    }
    luta([dragao]);
  }

  // O FAVOR que Reidoth pede ("que essa vila fique em paz"): qualquer bando da vila resolvido.
  // O dragão saiu da torre (morto ou expulso): é a condição de Reidoth para guiar o grupo.
  const dragaoSaiu = () => ['morto', 'expulso'].includes(salvo.dragao);
  // No livro, Favric leva uma poção de voo no pescoço. O jogo é 2.5D e não tem voo para o herói: no lugar vai uma poção de invisibilidade.
  async function saquearFavric() {
    if (salvo.pocaoDeFavric || !chefeDoCulto) return;
    salvo.pocaoDeFavric = true;
    const quem = herois()[0];
    if (!quem) return;
    guardar(quem, 'pocaoDeInvisibilidade', 1);
    await painel(`No pescoço de Favric, num cordão: um frasco de vidro fosco com um líquido que quase não se vê. ${quem.name} guarda.`);
  }

  // ------------------------------------------------- o culto do dragão ----
  // A CASA DE ESQUINA (área 13): Favric é ambicioso. Se o grupo não ataca de saída, ele tenta uma
  // aliança — servir ao dragão juntos — e pretende entregar o grupo a ele. Se ele cai, o resto foge.
  function arvoreDoCulto() {
    return {
      inicio: 'oi',
      nos: {
        oi: {
          narra: 'Seis pessoas de manto com a barra recortada em asas e máscara de couro com chifres. Quatro de pé, armadas, junto da mesa; duas encolhidas perto do fogareiro. Poeira em tudo, teia nos cantos, e o cheiro de gente que não sai de lá há dias.',
          fala: 'Gente de fora. — O que está à frente tira a máscara: um rosto novo e esperto. — Eu sou Favric. A torre tem um senhor, e quem o serve é lembrado. Vocês parecem capazes. Querem servir?',
          opcoes: [
            { texto: 'Servir a ele junto com vocês.', vai: 'alianca' },
            { texto: 'Vocês sabem que ele vai comer vocês, não sabem?',
              teste: { pericia: 'persuasao', cd: 13 }, sucesso: 'duvida', falha: 'raiva' },
            { texto: 'Só estamos de passagem. Procuramos uma druida.',
              teste: { pericia: 'enganacao', cd: 12 }, sucesso: 'passagem', falha: 'raiva' },
            { texto: 'Saiam da vila. Agora.', fim: 'luta' },
            { texto: 'Então fiquem com ele. Até mais.', fim: 'sai' },
          ],
        },
        alianca: {
          narra: 'Ele sorri largo demais. Atrás dele, dois dos outros trocam um olhar curto, de quem guarda um segredo.',
          fala: 'Sábia escolha. Fiquem à vontade: ao amanhecer eu mesmo os levo à torre e os apresento. Ele gosta de conhecer quem vai trabalhar para ele.',
          opcoes: [
            { texto: 'Combinado.', fim: 'aliado' },
            { texto: 'Pensando melhor, não.', fim: 'luta' },
          ],
        },
        duvida: {
          narra: 'O que fala por eles não responde na hora. Dois dos outros se olham, e um deles olha para a porta.',
          fala: 'Ele… ainda não comeu nenhum de nós. Isso é um sinal. — A voz dele não acredita nela mesma.',
          opcoes: [
            { texto: 'Vão embora enquanto o sinal dura.', fim: 'desiste' },
            { texto: 'Então vamos resolver isso de outro jeito.', fim: 'luta' },
          ],
        },
        passagem: {
          fala: 'O velho das peles? Anda por aí, falando com mato. Não nos atrapalha, nós não atrapalhamos ele. Sigam, e não entrem na torre.',
          narra: 'Ele volta a olhar o fogareiro, e os outros cinco fazem o mesmo. A conversa acabou para eles.',
          opcoes: [{ texto: '…', fim: 'sai' }],
        },
        raiva: {
          fala: 'Chega. — Ele ergue a mão, e as cimitarras saem das bainhas. — Vocês vão virar oferenda.',
          opcoes: [{ texto: '…', fim: 'luta' }],
        },
      },
    };
  }

  // ---------------------------------------------------------- Reidoth ----
  // O prêmio da fase. Ele sabe onde fica o Castelo Dentefino e a Caverna Onda
  // Eco, e é o único jeito de descobrir a segunda sem queimar a pergunta da
  // banshee. Não briga, não acompanha, e não gosta de quem mexe no mato dele.
  /**
   * A missão da Qelline era ACHAR a druida (`game/phandalin.js`, `missao
   * ('reidoth')`). Falar com ela a cumpre — e sem isto ela ficava "ativa" no
   * diário para sempre, porque ninguém no jogo chamava `concluir('reidoth')`.
   */
  function acharReidoth() {
    if ((vila.missoes ??= {}).reidoth) vila.missoes.reidoth = 'feita';
    feitos.falouComReidoth = true;
  }

  function arvoreDoReidoth() {
    // QUEM FECHOU ACORDO COM O DRAGÃO perde o prêmio da fase. O dragão faz
    // questão de contar — é o tipo de coisa que diverte um dragão verde —, e o
    // druida não é tola. Quem falou com a Reidoth ANTES de entrar na torre sai
    // no lucro: já tem o castelo e a caverna, e o acordo não custa nada. Isso
    // é de propósito. A ordem em que o jogador faz as coisas tem de importar.
    if (salvo.acordoComDragao) {
      return {
        inicio: 'oi',
        nos: {
          oi: {
            narra: 'Ela não está de costas desta vez. Está virada para vocês, e já estava quando vocês entraram no largo.',
            fala: 'O dragão contou. Minha cabeça por duas poções. Barato.',
            opcoes: [
              { texto: 'Não vamos cumprir.', vai: 'naoVamos' },
              { texto: 'Não é nada pessoal.', vai: 'pessoal' },
              { texto: '…', fim: 'sai' },
            ],
          },
          naoVamos: {
            fala: 'Disseram sim. Isso eu não desouço. Achem o castelo sozinhos.',
            narra: 'Ela dá as costas, e desta vez é de propósito.',
            opcoes: [{ texto: '…', fim: 'sai' }],
          },
          pessoal: {
            fala: 'Para mim é. Vão embora.',
            opcoes: [{ texto: '…', fim: 'sai' }],
          },
        },
      };
    }
    // A Reidoth do Obelisco é uma idosa que não usa duas palavras quando uma basta, e recebe razoavelmente bem quem
    // aparece: avisa de tudo e dá o caminho do castelo sem cobrar. O que ela guarda para depois do dragão é a Caverna
    // Onda Eco (guia o grupo até lá se a torre ficar livre) e, em particular, o título de Guardião da Primavera.
    const ideaisDaNatureza = () => herois().find((h) => ['druida', 'patrulheiro'].includes(h.classe));
    return {
      inicio: 'oi',
      nos: {
        oi: {
          ao: () => acharReidoth(),
          narra: 'Diante do posto há uma velha de peles e cabelo branco comprido, solto, com folha seca presa nele, sentada numa pedra. Ela mede o grupo de cima a baixo e indica outra pedra com o queixo.',
          fala: salvo.dragao === 'expulso' || salvo.dragao === 'morto'
            ? 'A torre está livre. Bom. Sentem. Perguntem.'
            : 'Vivos. Raro. Sentem. Perguntem.',
          opcoes: [
            { texto: 'Procuramos o Castelo Dentefino.', vai: 'castelo',
              requer: () => (feitos.sabeOCastelo ? 'ela já disse' : null), oculta: true },
            { texto: 'E a Caverna Onda Eco?', vai: 'ondaEco',
              requer: () => (feitos.sabeOndaEco ? 'ela já disse' : null), oculta: true },
            { texto: 'A senhora guarda um título para quem ama a natureza, não é?', vai: 'guardiao',
              requer: () => (dragaoSaiu() && ideaisDaNatureza() && !feitos.guardiaoDaPrimavera ? null : 'nada a oferecer'), oculta: true },
            { texto: 'O que há de perigoso por aqui?', vai: 'avisos' },
            { texto: 'O que é aquilo na torre?', vai: 'dragao' },
            { texto: 'E essa gente que se esconde na casa de esquina?', vai: 'culto' },
            { texto: 'A placa na entrada é sua?', vai: 'placa' },
            { texto: 'Boa sorte com o mato.', fim: 'sai' },
          ],
        },
        castelo: {
          ao: () => {
            feitos.sabeOCastelo = true;
            pista('Reidoth disse onde fica o Castelo Dentefino: ao norte da Trilha de Triboar, dentro da Floresta de Neverwinter. Agora ele aparece no mapa da região.');
          },
          fala: 'Norte da trilha. Dentro da mata. Torres caindo, goblin em todas. O cheiro chega antes.',
          narra: 'Ela risca o chão de cinza com a ponta do cajado: uma linha para a trilha, um quadrado para o castelo, e um traço do quadrado até a linha.',
          opcoes: [{ texto: '…', vai: 'oi' }],
        },
        // A ONDA ECO: ela só guia o grupo até lá com a torre livre ("tirem o dragão e eu os levo").
        ondaEco: {
          ao: () => {
            if (!dragaoSaiu()) return;
            feitos.sabeOndaEco = true;
            feitos.amigoDoEnclave = true;
            pista('Reidoth guiou o grupo até a Caverna Onda Eco: nos morros a leste de Phandalin, ao pé das Montanhas Espada, onde o mar antigo secou.');
            pista('Reidoth, que fala pelo Enclave Esmeralda, tem o grupo por amigo: tirou o dragão da torre.');
          },
          fala: dragaoSaiu()
            ? 'Eu levo. Morros a leste da vila de vocês, onde o chão vira montanha. Anões e gnomos cavaram lá. Um dia pararam todos.'
            : 'Sei o caminho. Não saio daqui com aquilo de olho aberto na torre. Tirem o dragão. Aí eu levo.',
          narra: dragaoSaiu() ? 'Pela primeira vez ela parece quase animada.' : 'Ela olha para a torre, depois para o grupo, e faz as contas.',
          opcoes: [{ texto: '…', vai: 'oi' }],
        },
        guardiao: {
          ao: () => {
            const h = ideaisDaNatureza();
            if (!h) return;
            feitos.guardiaoDaPrimavera = h.name;
            pista(`Reidoth ofereceu a ${h.name}, em particular, o título de Guardião da Primavera, do Enclave Esmeralda.`);
          },
          narra: 'Ela chama um de vocês de lado, longe dos outros, e fala baixo.',
          fala: 'Falo por gente que cuida do que nasce e do que morre. Vi como você olhou esta vila. Há um título, Guardião da Primavera. Não paga nada. Obriga a muito. Pense.',
          opcoes: [{ texto: '…', vai: 'oi' }],
        },
        avisos: {
          fala: 'Tudo. Dragão na torre. Seis de máscara na casa de esquina. Mortos de cinza na guarnição, na taverna e na ferraria. Galhos que andam, nas cabanas, e moitas de agulha no mato. Duas aranhas no armazém — olhem para cima.',
          narra: 'Ela conta nos dedos, e acaba com as duas mãos abertas.',
          opcoes: [{ texto: '…', vai: 'oi' }],
        },
        dragao: {
          fala: 'Dragão verde. Novo. Vai durar mais que vocês, que eu e que a vila. Chegou faz um ano. A torre estava vazia.',
          narra: 'Ela diz isso como quem informa a previsão do tempo.',
          opcoes: [
            { texto: 'Dá para matar?', vai: 'matarDragao' },
            { texto: '…', vai: 'oi' },
          ],
        },
        matarDragao: {
          fala: 'Por vocês, hoje? Não. Entrem, e eu não busco o que sobrar. Tirem ele de lá, e fico em dívida.',
          opcoes: [{ texto: '…', vai: 'oi' }],
        },
        culto: {
          fala: 'Acham que ele é um deus. Levam comida. Ele come. Um dia come quem leva. O que fala por eles é ambicioso. Ambição mente.',
          narra: 'Um canto da boca dela se mexe, e é o mais perto de um sorriso que ela vai chegar.',
          opcoes: [{ texto: '…', vai: 'oi' }],
        },
        placa: {
          fala: 'Minha. Aviso é o que se faz quando não se pode fazer mais. Nunca fez ninguém voltar.',
          opcoes: [{ texto: '…', vai: 'oi' }],
        },
      },
    };
  }

  // ------------------------------------------------------ aproximação ----
  async function depoisDeMover(c) {
    if (!estado.explorando) return;
    c.movementLeftFt = MOVIMENTO;
    // Nenhum gatilho desta cena usa raio sozinho: os de bando vão por
    // retângulo, e os da torre exigem linha de visão. Raio puro vazava por
    // cima de parede e acordava bando do outro lado dela.

    // A torre: três avisos, por distância, antes de a porta deixar entrar.
    if (dragao && !salvo.dragao) {
      const porta = ARVORE_TROVAO.portaDaTorre;
      if (herois().some((h) => naCasa(h.pos, 'torre'))) { await entrarNaTorre(); return; }
      // O 35 pés vem ANTES do 15, e o 15 exige que o primeiro já tenha saído.
      // Sem isso, quem atravessava os 60 pés de deslocamento de uma vez pulava
      // direto para o segundo aviso, e o primeiro — os riscos de garra na
      // pedra — nunca aparecia.
      // COM LINHA DE VISÃO, não só com distância. Os dois avisos são coisas
      // que se vê e se cheira na frente da porta — os riscos de garra na
      // pedra, o elmo amassado na cinza. O raio de 35 pés sozinho alcançava
      // trinta pés para dentro da casa do culto, atravessando a alvenaria, e
      // o painel saía com o grupo debaixo de outro telhado.
      const vePorta = (pes) => herois().some((h) => distanceFt(h.pos, porta) <= pes
        && enc.field.hasLineOfSight(h.pos, porta));
      if (vePorta(35) && salvo.avisos < 1) { await avisoDaTorre(1); return; }
      if (vePorta(15) && salvo.avisos === 1) { await avisoDaTorre(2); return; }
    }
    // A VELHA GUARNIÇÃO (área 11): os cinco da farda.
    if (zumbis.length && !salvo.zumbis && herois().some((h) => naCasa(h.pos, 'guarnicao'))) {
      await acordarZumbis();
      return;
    }
    // O CAVALO PARDO (3), A VELHA FERRARIA (8): zumbis deitados, como no livro.
    if (zumbisCavalo.length && !salvo.zumbisCavalo && herois().some((h) => naCasa(h.pos, 'cavaloPardo'))) {
      await acordarZumbisDoCavalo();
      return;
    }
    if (zumbisFerraria.length && !salvo.zumbisFerraria && herois().some((h) => naCasa(h.pos, 'velhaFerraria'))) {
      await acordarZumbisDaFerraria();
      return;
    }
    // OS RAMOS SECOS (1, 2, 5, 12): por cômodo, nunca por raio — um raio acorda
    // o bando do outro lado de uma parede.
    if (ramos2.length && !salvo.ramos2
      && herois().some((h) => naCasa(h.pos, 'cabanaDosRamos'))) {
      await acordarRamosDaCabana();
      return;
    }
    if (ramos1.length && !salvo.ramos1 && herois().some((h) => naCasa(h.pos, 'cabanaOcidental'))) {
      await aoEntrarNaCabanaOcidental();
      if (estado.lutando) return;
    }
    // OS RAMOS DO MATO LESTE ACORDAM NO MATO LESTE. O gatilho era `naCasa('casa20')`, um quadrado de rua do
    // nordeste que ficou da planta antiga: medido, ele está a 10 casas do ramo mais próximo. Pisar nele
    // acordava oito galhos que o grupo não via, e entrar no mato onde eles moram não acordava ninguém.
    if (ramos5.length && !salvo.ramos5 && herois().some((h) => dentro(h.pos, ARVORE_TROVAO.zonas.matoDaFazenda))) {
      await acordarRamosDaFazenda();
      return;
    }
    // A ZONA DO TECELÃO NÃO PEGA CASA ALHEIA. `tecelagemSul` é um retângulo, e medido ele cobria 3 das 12
    // casas do armazém das aranhas e 6 das 9 do acampamento do Reidoth. Como esta checagem vem ANTES da das
    // aranhas, entrar no armazém acordava os galhos em vez delas; e parar no acampamento do druida fazia o
    // mesmo. A exceção era só a `embaixada`, escrita à mão; agora vale para qualquer construção.
    if (ramos12.length && !salvo.ramos12
      && herois().some((h) => naCasa(h.pos, 'tecelao')
        || (dentro(h.pos, ARVORE_TROVAO.zonas.arbustosDoTecelao) && !emOutroLugar(h.pos, 'tecelao')))) {
      await acordarRamosDoTecelao();
      return;
    }
    // O ARMAZÉM DAS ARANHAS (área 6). A teia da rua é o ALARME: pisá-la acorda as duas; entrar no
    // armazém também. POR CASA (a construção), e não por raio, que vazaria por cima de parede.
    if (aranhas.length && !salvo.aranhas) {
      // O ARMAZÉM É A CONSTRUÇÃO QUE A FA COBRIU DE TEIA (o ladrilho `Webs`, casa 23,19), e não a que o
      // nome antigo dizia: era a construção que hoje se chama `tecelao`, 17 casas ao lado, e com isso nem a
      // teia da rua nem entrar no armazém acordavam aranha nenhuma — elas ninham aqui.
      // A TEIA DA RUA NÃO EXISTE NESTA PLANTA: a FA publica a teia como ladrilho à parte, que não vem nas
      // três versões do mapa, e pintar terreno difícil invisível seria pior que não ter. O ramo da teia fica,
      // porque o mapa pode voltar a tê-la (o editor pinta `$`); hoje `naTeia` sai sempre vazio e quem acorda
      // as duas é entrar no armazém.
      const naTeia = herois().filter((h) => enc.field.surfaceAt(h.pos.x, h.pos.y) === 'teia' && !naCasa(h.pos, 'armazem'));
      if (naTeia.length || herois().some((h) => naCasa(h.pos, 'armazem'))) { await acordarAranhas(naTeia); return; }
    }
  }

  // ------------------------------------------------------- fim da luta ----
  async function darXpDaLuta(xp, motivo) {
    const grupo = enc.combatants.filter((x) => x.side === 'party' && !x.dead);
    if (!grupo.length || !xp) return;
    const cada = Math.floor(xp / grupo.length);
    const sobem = darXp(grupo, cada);
    enc.say('cura', `${motivo}: ${cada} XP para cada um.`);
    if (sobem.length) for (const t of await telaDeSubirNivel(root, sobem)) enc.say('cura', t);
  }

  /** Quanto o bando que acabou de cair valia, somando os blocos. */
  const valeDoBando = (bando) => bando.reduce((s, f) => s + (f.xp ?? 0), 0);

  async function fimDoCombate(outcome) {
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      const porQuem = salvo.dragao === 'luta'
        ? 'O dragão termina sem pressa, limpa o focinho no manto de alguém e volta para cima das moedas. A vila fica como estava.'
        : 'A vila fica como estava: cinza, silêncio, e agora mais ossos no meio da cinza.';
      await narrar(root, { formato: 'tela', paginas: [{ titulo: 'Árvore Trovão', texto: [porQuem] }] });
      app.encerrarPartida();
      return;
    }
    const bando = estado.lutando ?? [];
    const dos = (lista) => bando.some((f) => lista.includes(f));
    const reforcos = estado.reforcos ?? [];
    // O XP é o do bloco de cada criatura que caiu na luta, as que vieram de
    // reforço inclusive.
    const total = (...listas) => valeDoBando([...new Set([...bando, ...reforcos, ...listas.flat()])].filter((f) => f.dead));
    if (bando.includes(dragao)) {
      if (salvo.dragaoFugiu) {
        // O livro: reduzido à metade dos PV, o dragão escala a torre e voa para
        // longe — "para lutar outro dia". Expulsá-lo vale 2.000 XP; matá-lo,
        // 3.900, e o livro avisa que os níveis deste grupo mal dão para isso.
        salvo.dragao = 'expulso';
        feitos.dragaoDeArvoreTrovao = true;
        feitos.expulsouODragao = true;
        await painel([
          'Ele recua para o fundo do salão, a respiração agora curta e rascante. Um olhar para o grupo — cálculo, não medo — e a garra se crava na parede: a torre inteira dá um solavanco enquanto ele sobe pelas vigas.',
          'O teto aberto se enche de asas. Um uivo seco, de gás e de raiva, e o dragão sai para o céu cinzento sem olhar para trás. Ele volta, ou não volta. Mas não é mais o dono desta torre.',
        ]);
        await darXpDaLuta(2000, 'Presa Peçonhenta expulso');
      } else {
        salvo.dragao = 'morto';
        feitos.dragaoDeArvoreTrovao = true;
        await painel([
          'Ele cai de lado, e a torre toda estremece. O silêncio depois é diferente de todos os silêncios desta vila.',
          'Vocês mataram um dragão. Ninguém em Phandalin vai acreditar, e não importa: está ali no chão.',
        ]);
        await darXpDaLuta(valeDoBando([dragao]), 'Presa Peçonhenta');
      }
      if (salvo.culto === 'aliado') {
        // Quem aceitou a aliança lutou contra o dragão E os seis. Os que caíram (ou fugiram com Favric) pagam o XP deles.
        salvo.culto = 'morto';
        await saquearFavric();
        await darXpDaLuta(valeDoBando(cultistas), 'O culto traidor');
      }
    } else if (dos(ramos2)) {
      salvo.ramos2 = 'limpo';
      // Os dois da cabana ocidental só contam se vieram e caíram junto.
      if (ramos1.length && ramos1.every((f) => f.dead)) salvo.ramos1 = 'limpo';
      await painel('O último galho seco cai e fica só galho. O mato dentro das ruínas volta a ser mato, e o vento, vento.');
      await darXpDaLuta(total(ramos2), 'Os ramos da cabana');
    } else if (dos(ramos1)) {
      salvo.ramos1 = 'limpo';
      await painel('Os dois galhos secos se desfazem sem um som, ao lado da porta aberta.');
      await darXpDaLuta(total(ramos1), 'Os ramos da cabana ocidental');
    } else if (dos(ramos5)) {
      salvo.ramos5 = 'limpo';
      await painel('Os últimos galhos caem e a sarça fica parada. O mato a leste da fazenda continua ali, mas agora é só mato.');
      await darXpDaLuta(total(ramos5), 'Os ramos da fazenda');
    } else if (dos(ramos12)) {
      salvo.ramos12 = 'limpo';
      await painel('Os arbustos ao sul da cabana do tecelão ficam quietos. Lá do lado da casa de esquina, bem longe, alguém assobia baixo e para.');
      await darXpDaLuta(total(ramos12), 'Os ramos do tecelão');
      // O barulho chegou aos cultistas (o livro): eles vêm ver, com cuidado. A trave da porta sai.
      if (salvo.cultoAlertado && cultistas.length && !salvo.culto && salvo.portaCulto === 'trancada') {
        salvo.portaCulto = 'aberta';
        porBarricada();
        await painel('Pela rua, uma tábua raspa: na casa de esquina alguém puxa o carroção de mão que tapava o vão, e um vulto de manto espia o largo o tempo de contar o estrago. Depois larga o carroção de lado, sem recolocá-lo.');
      }
    } else if (dos(zumbisCavalo)) {
      salvo.zumbisCavalo = 'limpo';
      await painel('O último dos quatro cai de costas entre os tanques, e a cinza do corpo dele vira cinza de chão. O cheiro de fermento azedo fica.');
      await darXpDaLuta(total(zumbisCavalo), 'Os mortos do Cavalo Pardo');
    } else if (dos(zumbisFerraria)) {
      salvo.zumbisFerraria = 'limpo';
      await painel('Os dois caem entre as pinças e o fole furado. Ninguém vai bater ferro nesta bigorna.');
      await darXpDaLuta(total(zumbisFerraria), 'Os mortos da ferraria');
    } else if (bando.some((f) => cultistas.includes(f))) {
      salvo.culto = 'morto';
      await painel(salvo.cultoFugiu
        ? 'Os que sobraram desaparecem rua abaixo, de máscara na mão. Na casa de esquina ficam um fogareiro frio, uma mesa e a poeira.'
        : 'Os mantos ficam no chão da casa de esquina, entre a mesa, as cadeiras e o fogareiro apagado.');
      await saquearFavric();
      await darXpDaLuta(valeDoBando(cultistas), 'O culto do dragão');
    } else if (bando.some((f) => zumbis.includes(f))) {
      salvo.zumbis = 'limpo';
      await painel('O último deles cai e não torna a sentar. A farda enferrujada se esfarela na cinza.');
      await darXpDaLuta(valeDoBando(zumbis), 'Os mortos da guarnição');
    } else if (bando.some((f) => aranhas.includes(f))) {
      salvo.aranhas = 'limpo';
      await painel('As duas ficam encolhidas na teia delas, de pernas para dentro. O armazém continua cheio de seda, mas agora ninguém desce dela.');
      await darXpDaLuta(valeDoBando(aranhas), 'As aranhas do armazém');
    }
    prepararExploracao();
  }

  // ------------------------------------------------------ botão direito ----
  // ABRIR E FECHAR AS PORTAS, como no castelo. O mapa diz quais vãos têm folha
  // (`ARVORE_TROVAO.folhas`); o tabuleiro lê `field.folha` para desenhar a folha
  // encostada quando a porta está aberta. Fechar vale a pena: a porta fechada
  // corta a visão e o passo — é como o grupo some de um inimigo ou o tranca.
  const CHAVE_DE = (a, b) => `${a.x},${a.y},${b.x},${b.y}`;
  const COM_FOLHA = new Set((ARVORE_TROVAO.folhas ?? []).flatMap(([a, b]) => [CHAVE_DE(a, b), CHAVE_DE(b, a)]));
  enc.field.folha = COM_FOLHA;

  // A BARRICADA DO CULTO (área 13). No livro é uma porta trancada por dentro, que se força com um teste de
  // Força; a planta da Forgotten Adventures não dá porta a esta construção — ela é uma ruína de alicerce
  // quebrado, com 16 arestas abertas. Medido pelo desenho, aresta a aresta, a pedra do alicerce não se separa
  // do mato por cima dela, então não se inventa muro: o que o livro quer vira o que a ruína comporta. Favric
  // entulhou os vãos, e a região `barricadaCulto` (`encounter.js`) empurra de volta quem tenta entrar.
  // `salvo.portaCulto` guarda o estado com o nome de sempre, para o save antigo continuar valendo.
  const casasDoCulto = new Set(ARVORE_TROVAO.celulas.cultistas.map((c) => `${c.x},${c.y}`));
  const ehCasaDoCulto = (t) => casasDoCulto.has(`${t.x},${t.y}`);
  const porBarricada = () => {
    alternarRegiao(enc.field, 'barricadaCulto', salvo.portaCulto === 'trancada');
    enc.field.versao = (enc.field.versao ?? 0) + 1;
  };
  if (!salvo.portaCulto) salvo.portaCulto = salvo.culto ? 'aberta' : 'trancada';
  porBarricada();

  function portasDaCasa(tile) {
    const f = enc.field;
    const out = [];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = { x: tile.x + dx, y: tile.y + dy };
      if (!f.inside(n.x, n.y)) continue;
      const cod = f.aresta(tile.x, tile.y, n.x, n.y);
      if (cod !== ARESTA.porta && cod !== ARESTA.aberta) continue;
      if (!COM_FOLHA.has(CHAVE_DE(tile, n))) continue;
      out.push({ a: tile, b: n, cod });
    }
    return out;
  }

  // A variante de cada peça de mobília do mapa, por casa (o tabuleiro a desenha pelo mesmo nome).
  const PROP_EM = new Map((ARVORE_TROVAO.props ?? []).map((p) => [`${p.x},${p.y}`, p.variante]));

  // A estátua derrubada vira um monte de pedra (`desabamento`: barra o passo, não a visão).
  function derrubarEstatua(pos) {
    const f = enc.field;
    const i = pos.y * f.w + pos.x;
    f.tiles[i] = GLIFOS.E.kind;
    f.surfaces[i] = SUPERFICIES.indexOf(GLIFOS.E.sup);
    f.versao = (f.versao ?? 0) + 1;
    app.refresh();
  }
  // Ao reabrir a cena num jogo salvo, a estátua que já caiu continua caída.
  if (salvo.estatuaCaiu) {
    const est = ARVORE_TROVAO.estatua;
    if (est) { PROP_EM.delete(`${est.x},${est.y}`); derrubarEstatua(est); }
  }

  // A VISTA DO ALTO É TEXTO, e não um descobrimento do mapa.
  //
  // Era mecânica: quem subisse acendia `field.vistaExtra` com TODAS as casas fora das construções num raio de
  // 40 — a aldeia inteira — e o grupo enxergava tudo enquanto ele ficasse lá. Duas coisas estavam erradas
  // nisso. A primeira é que a guarnição, na planta da Forgotten Adventures, é casca SEM TELHADO: subir no
  // telhado dela era subir no que não existe (medido: das 22 construções, sete têm teto, e esta não). A
  // segunda é que revelar o mapa inteiro de graça tira da fase o que ela é — escolher o que encarar sem
  // saber tudo.
  //
  // Agora quem abre o alçapão sobe pelo que sobrou da escada e OLHA, e o que ele vê vem em prosa, com os
  // rumos e as distâncias medidos no mapa. Os números foram REFEITOS em 2026-11-06: a guarnição (área 11)
  // era a construção em (43,24) e, medido o de-para contra o mapa do livro, é a do canto NORDESTE, em
  // (47,4). De lá a torre fica a 20 m a oeste (era 29 m a noroeste), a praça e a estátua a 13 e 17 m a
  // sudoeste, o tecelão a 25 m ao sul, o armazém a 34 m a sudoeste, e a fileira da taverna, da ferraria e
  // da fazenda a uns 43 m, também a sudoeste. O grupo fica sabendo ONDE estão as coisas; continua sem ver
  // quem está nelas.

  // OS DOIS OBJETOS ESCONDIDOS DO LIVRO. Nenhum está desenhado até uma busca passar: a cena troca
  // a casa por um baú.
  const OBJ = ARVORE_TROVAO.objetos;
  const mesmo = (a, b) => a && b && a.x === b.x && a.y === b.y;
  const revelar = (pos) => {
    const f = enc.field;
    const i = pos.y * f.w + pos.x;
    f.tiles[i] = GLIFOS.K.kind;
    f.surfaces[i] = SUPERFICIES.indexOf(GLIFOS.K.sup);
    f.versao = (f.versao ?? 0) + 1;
    app.refresh();
  };
  // Ao reabrir a cena num jogo salvo, o que já foi achado volta ao chão (na criação, e não no
  // primeiro clique: senão o baú só aparecia depois de o jogador clicar em alguma coisa).
  for (const [chave, pos] of [['bauMercador', OBJ.bauMercador], ['caixaMirna', OBJ.caixaMirna]]) {
    if (salvo[chave] && enc.field.surfaceAt(pos.x, pos.y) !== 'bau') revelar(pos);
  }

  // A VELHA FERRARIA (área 8), o Obelisco: um armário meio enterrado sob o telhado caído, com um saco de escamas de
  // dragão de latão (75 po). Só se revira com os mortos de cinza de lá fora de combate.
  function armarioDaFerraria(tile, c) {
    if (salvo.escamas || !naCasa(tile, 'velhaFerraria') || !naCasa(c.pos, 'velhaFerraria')) return null;
    const vivos = zumbisFerraria.some((f) => !f.dead);
    return {
      rotulo: 'Revirar o armário soterrado', icone: 'acao-procurar', detalhe: 'debaixo do telhado caído',
      motivo: vivos && salvo.zumbisFerraria !== 'limpo' ? 'os mortos de cinza ainda estão aqui' : null,
      fazer: async () => {
        salvo.escamas = true;
        guardar(c, 'escamasDeLatao', 1);
        await painel(`Debaixo das telhas caídas, um armário velho e torto. Dentro, um saco grande de couro, pesado de um jeito estranho: placas em losango, castanho-douradas, do tamanho de meia mão, leves e duras como ferro. Escamas de dragão de latão — um armeiro pagaria umas setenta e cinco peças de ouro pelo saco. ${c.name} guarda.`);
        app.refresh();
      },
    };
  }

  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    const longe = (pes) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
    // PEGAR NUMA COISA É TOCAR NELA. `longe` mede só a distância, e o baú da casa
    // do beco ficava a 5 pés em diagonal de uma casa do lado de FORA da parede:
    // dava para abri-lo de fora e acordar o espectro com um muro no meio.
    const alcance = () => (distanceFt(c.pos, tile) > 5 ? 'longe demais — chegue a 5 pés'
      : (enc.field.contato(c.pos, tile) ? null : 'tem uma parede no meio'));
    const armario = armarioDaFerraria(tile, c);
    if (armario) ops.push(armario);

    // A BARRICADA: arrastar o entulho do vão da casa de esquina, de fora dela.
    if (salvo.portaCulto === 'trancada' && ehCasaDoCulto(tile) && !ehCasaDoCulto(c.pos)) {
      ops.push({
        rotulo: 'Arrastar a barricada', icone: 'acao-empurrar', detalhe: 'Atletismo CD 20',
        motivo: longe(5) ?? buscas.ja(c, 'arrombarCulto', tile),
        fazer: async () => {
          buscas.marcar(c, 'arrombarCulto', tile);
          const t = teste(c, 'atletismo', 20);
          if (!t.passou) {
            salvo.cultoAlertado = true;
            await painel('A pilha é mais pesada do que parece — armário deitado, vigas, um carroção de mão virado. Ela range, cede um palmo e trava; lá dentro alguém para de falar.', { teste: t });
            return;
          }
          salvo.portaCulto = 'arrombada';
          porBarricada();
          await painel('O armário tomba para fora e as vigas rolam. Dentro da ruína, seis mantos com máscara de chifre se viram ao mesmo tempo. Ninguém ataca ainda: quem os comanda ergue a mão.', { teste: t });
          app.refresh();
        },
      });
    }

    for (const { a: ca, b: cb, cod } of portasDaCasa(tile)) {
      const fechada = cod === ARESTA.porta;
      ops.push({
        rotulo: fechada ? 'Abrir a porta' : 'Fechar a porta',
        icone: fechada ? 'acao-usarObjeto' : 'acao-empurrar',
        detalhe: fechada ? 'de graça' : 'corta a visão',
        motivo: longe(5) ?? (enc.combatants.some((o) => !o.dead && o.pos && o !== c && !fechada
          && ((o.pos.x === ca.x && o.pos.y === ca.y) || (o.pos.x === cb.x && o.pos.y === cb.y)))
          ? 'tem alguém na passagem' : null),
        fazer: async () => {
          enc.field.porAresta(ca.x, ca.y, cb.x, cb.y, fechada ? ARESTA.aberta : ARESTA.porta);
          enc.say('acao', fechada
            ? `${c.name} empurra a porta, que cede com um rangido.`
            : `${c.name} fecha a porta e encosta o ombro nela até o trinco pegar.`);
          app.refresh();
        },
      });
    }

    // OS DOIS OBJETOS ESCONDIDOS DO LIVRO (`OBJ`, `revelar` e `mesmo`, no topo da cena): nenhum
    // está desenhado até uma busca passar.
    if (naCasa(tile, 'redutoDoDruida') && !salvo.bauMercador) {
      ops.push({
        rotulo: 'Revistar a cabana', icone: 'acao-procurar', detalhe: 'Percepção CD 12',
        motivo: (naCasa(c.pos, 'redutoDoDruida') ? null : 'entre na cabana') ?? buscas.ja(c, 'bauMercador'),
        fazer: async () => {
          if (!naCasa(c.pos, 'redutoDoDruida')) return;
          buscas.marcar(c, 'bauMercador');
          const t = teste(c, 'percepcao', 12);
          if (!t.passou) {
            await painel(`${c.name} revira o entulho e as raízes: pedra, terra, folha podre. Nada que valha.`, { teste: t });
            return;
          }
          salvo.bauMercador = 'achado';
          revelar(OBJ.bauMercador);
          await painel([
            'Uma lajota do piso está solta, e embaixo dela, entre raízes grossas como braços de criança, aparece a tampa de ferro de um baú.',
            'Alguém que vivia aqui guardou o que tinha de melhor debaixo do chão, e as árvores novas cresceram por cima.',
          ], { teste: t });
        },
      });
    }
    if (sup === 'bau' && mesmo(tile, OBJ.bauMercador) && salvo.bauMercador === 'achado') {
      ops.push({
        rotulo: 'Abrir o baú', icone: 'acao-usarObjeto', detalhe: 'a reserva de um comerciante',
        motivo: alcance(),
        fazer: async () => {
          salvo.bauMercador = 'aberto';
          guardar(c, 'moedaDeCobre', 1400);
          guardar(c, 'moedaDePrata', 160);
          guardar(c, 'moedaDeOuro', 90);
          await painel(`Dentro, em fileiras: mil e quatrocentas peças de cobre, cento e sessenta de prata e noventa de ouro — a reserva de um comerciante que não voltou. ${c.name} guarda tudo.`);
          app.refresh();
        },
      });
    }
    // A CAIXA DA HERBORISTA (área 9): a Percepção passa sozinha se a Mirna
    // mandou o grupo buscar a herança, como no livro.
    const mandadoPelaMirna = Boolean(vila.missoes?.mirna || vila.missoesExtra?.includes('mirna'));
    if (naCasa(tile, 'herborista') && !salvo.caixaMirna) {
      ops.push({
        rotulo: 'Revistar a loja', icone: 'acao-procurar',
        detalhe: mandadoPelaMirna ? 'a Mirna indicou o lugar' : 'Percepção CD 15',
        motivo: (naCasa(c.pos, 'herborista') ? null : 'entre na loja') ?? (mandadoPelaMirna ? null : buscas.ja(c, 'caixaMirna')),
        fazer: async () => {
          if (!naCasa(c.pos, 'herborista')) return;
          buscas.marcar(c, 'caixaMirna');
          const t = mandadoPelaMirna ? null : teste(c, 'percepcao', 15);
          if (t && !t.passou) {
            await painel(`${c.name} remexe nas prateleiras tortas: caco de vidro, livro podre, ervas que viraram pó. Nada.`, { teste: t });
            return;
          }
          salvo.caixaMirna = 'achada';
          revelar(OBJ.caixaMirna);
          await painel([
            mandadoPelaMirna
              ? `${c.name} lembra do que a Mirna descreveu: o compartimento sob as prateleiras do estoque. A tábua cede ao primeiro puxão.`
              : 'Uma das tábuas sob as prateleiras do estoque está solta, e atrás dela há um compartimento.',
            'Lá dentro, uma caixa de madeira do tamanho de um livro, intacta no meio de tanta coisa estragada.',
          ], t ? { teste: t } : {});
        },
      });
    }
    if (sup === 'bau' && mesmo(tile, OBJ.caixaMirna) && salvo.caixaMirna === 'achada') {
      ops.push({
        rotulo: 'Abrir a caixa', icone: 'acao-usarObjeto', detalhe: 'a herança dos Dendrar',
        motivo: alcance(),
        fazer: async () => {
          salvo.caixaMirna = 'aberta';
          feitos.colarDeMirna = true;
          guardar(c, 'colarDeMirna', 1);
          await painel(`A caixa em si não vale nada. Dentro, num pano, um colar de ouro fino com um pingente de esmeralda — duzentas peças, no mínimo. É da Mirna Dendrar, e ela vai querer saber que ainda existe. ${c.name} guarda.`);
          app.refresh();
        },
      });
    }

    // O COFRE DOS CULTISTAS (o livro): três diamantes de 100 po (a poção de Favric está com ele). Os cultistas não o largam
    // enquanto estão ali: só abre com eles mortos, convencidos a ir ou fora da casa.
    if (sup === 'bau' && mesmo(tile, OBJ.bauCulto) && !salvo.bauCulto) {
      const vigiam = cultistas.some((f) => !f.dead && enc.combatants.includes(f));
      ops.push({
        rotulo: 'Abrir o cofre', icone: 'acao-usarObjeto', detalhe: 'o cofre dos cultistas',
        motivo: alcance() ?? (vigiam ? 'os cultistas estão olhando' : null),
        fazer: async () => {
          salvo.bauCulto = true;
          guardar(c, 'ametista', 6);
          await painel(`Dentro do cofre, num pano limpo: seis ametistas lustrosas, o tributo que o culto juntava para o dragão — umas cinquenta peças de ouro cada uma. ${c.name} guarda.`);
          app.refresh();
        },
      });
    }
    if (sup === 'arca' && !salvo.arca) {
      ops.push({
        rotulo: 'Abrir a arca', icone: 'acao-usarObjeto', detalhe: 'o tesouro do dragão',
        motivo: alcance() ?? ((salvo.dragao === 'morto' || salvo.dragao === 'expulso') ? null : 'com ele vivo ali? Não'),
        fazer: async () => {
          salvo.arca = true;
          // O TESOURO DO MAGO MORTO (o Obelisco): duas mil e cem de cobre, cento e trinta de ouro, quatro cálices de
          // prata com selenita (60 po cada) e dois pergaminhos. E, no meio das moedas, um machado que o dragão não
          // notou: a ferrugem é falsa.
          guardar(c, 'moedaDeCobre', 2100);
          guardar(c, 'moedaDeOuro', 130);
          guardar(c, 'caliceDeSelenita', 4);
          guardar(c, 'pergaminhoDePassoNebuloso', 1);
          guardar(c, 'pergaminhoDeRelampago', 1);
          (c.weapons ??= []).push('hew');
          feitos.temHew = true;
          await painel([
            'O baú de madeira velha está aberto desde o dia em que o mago morreu. O dragão passou trinta dias sentado em cima dele, e mal olhou para o que tinha dentro.',
            `Duas mil e cem peças de cobre, cento e trinta de ouro, quatro cálices de prata com uma pedra leitosa na base, dois rolos de pergaminho — e, atravessado nas moedas, um machado de batalha anão enferrujado, com uma palavra em runas na lâmina: Hew. A ferrugem sai com a unha: é pintura. ${c.name} guarda tudo.`,
          ]);
        },
      });
    }
    // A MOBÍLIA E AS PEÇAS DO LIVRO: toda peça se pode EXAMINAR (texto nosso), e algumas rendem
    // mais — uma pista por teste, o achado do casulo, umas moedas num móvel (ver
    // `arvoretrovao-exames.js`). Uma tentativa por herói em cada ponto.
    if (sup === 'prop' || sup === 'propBaixo') {
      const variante = PROP_EM.get(`${tile.x},${tile.y}`);
      const texto = variante && EXAMES[variante];
      if (texto) {
        ops.push({
          rotulo: 'Examinar', icone: 'acao-procurar', motivo: alcance(),
          fazer: () => painel(texto),
        });
        const acao = ACOES[variante];
        if (acao) {
          ops.push({
            rotulo: acao.rotulo, icone: 'acao-procurar', detalhe: `${SKILL_NAME[acao.pericia]} CD ${acao.cd}`,
            motivo: alcance() ?? buscas.ja(c, acao.chave, tile),
            fazer: async () => {
              buscas.marcar(c, acao.chave, tile);
              const t = teste(c, acao.pericia, acao.cd);
              if (!t.passou) { await painel(acao.falha, { teste: t }); return; }
              pista(acao.pista);
              if (acao.chave === 'alcapao') salvo.alcapaoAberto = true;
              await painel(acao.sucesso, { teste: t });
            },
          });
        }
        if (variante === 'estatuaPalien') {
          const e = EMPURRAR_ESTATUA;
          ops.push({
            rotulo: e.rotulo, icone: 'acao-empurrar', detalhe: `${SKILL_NAME[e.pericia]} CD ${e.cd}`,
            motivo: alcance() ?? buscas.ja(c, e.chave, tile),
            fazer: async () => {
              buscas.marcar(c, e.chave, tile);
              const t = teste(c, e.pericia, e.cd);
              if (!t.passou) { await painel(e.falha, { teste: t }); return; }
              salvo.estatuaCaiu = true;
              PROP_EM.delete(`${tile.x},${tile.y}`);
              derrubarEstatua(tile);
              enc.say('acao', `${c.name} derruba a estátua da praça.`);
              await painel(e.sucesso, { teste: t });
            },
          });
        }
        // O ALTO DA GUARNIÇÃO: com o alçapão aberto, qualquer um sobe de novo e repassa a vista. É texto,
        // não revelação de mapa — ver o comentário em `A VISTA DO ALTO É TEXTO`.
        if (variante === 'alcapaoFechado' && salvo.alcapaoAberto) {
          ops.push({
            rotulo: 'Subir e olhar de cima', icone: 'acao-saltar', detalhe: 'de graça',
            motivo: alcance(),
            fazer: () => painel(VISTA_DO_ALTO),
          });
        }
        if (variante === 'casuloElfo' && !salvo.casuloElfo) {
          ops.push({
            rotulo: ACHADO_DO_CASULO.rotulo, icone: 'acao-usarObjeto', detalhe: 'poção, ouro e prata do livro',
            motivo: alcance(),
            fazer: async () => {
              salvo.casuloElfo = true;
              for (const [item, qtd] of ACHADO_DO_CASULO.itens) guardar(c, item, qtd);
              for (const arma of ACHADO_DO_CASULO.armas ?? []) (c.weapons ??= []).push(arma);
              await painel(ACHADO_DO_CASULO.texto);
              app.refresh();
            },
          });
        }
        if (CONTEINERS.has(variante)) {
          const chave = `${tile.x},${tile.y}`;
          const jaAberto = (salvo.revistados ??= {})[chave];
          ops.push({
            rotulo: 'Revistar', icone: 'acao-procurar', detalhe: 'Investigação CD 10',
            motivo: alcance() ?? (jaAberto ? 'já revistado' : buscas.ja(c, 'revistar', tile)),
            fazer: async () => {
              buscas.marcar(c, 'revistar', tile);
              const t = teste(c, 'investigacao', 10);
              if (!t.passou) { await painel(`${c.name} vasculha as frestas e as gavetas, sem achar nada que preste.`, { teste: t }); return; }
              salvo.revistados[chave] = true;
              const achado = achadoDoRecipiente(tile.x, tile.y);
              if (!achado) { await painel('Nada: pó, ferrugem e um cheiro velho. Quem morava aqui levou o que valia.', { teste: t }); return; }
              guardar(c, achado.item, achado.qtd);
              const nome = achado.item === 'moedaDePrata' ? 'de prata' : 'de cobre';
              await painel(`Numa fresta, esquecidas, ${achado.qtd} peças ${nome}. ${c.name} guarda.`, { teste: t });
              app.refresh();
            },
          });
        }
      }
    }
    if (sup === 'pocoVelho') {
      ops.push({
        rotulo: 'Olhar o poço', icone: 'acao-procurar', motivo: alcance(),
        fazer: () => painel('Fundo, seco e cheio de cinza. No fundo dá para ver o balde, de lado, e a corda ainda amarrada nele — trinta anos esperando alguém puxar.'),
      });
    }
    const saida = ARVORE_TROVAO.saida.find((e) => e.x === tile.x && e.y === tile.y);
    if (saida) {
      ops.push({
        rotulo: 'Voltar à trilha', icone: 'acao-disparada', detalhe: 'o mapa da região', motivo: longe(10),
        fazer: () => {
          estado.encerrado = true;
          app.irParaRegiao(enc.combatants.filter((x) => x.side === 'party' && !x.dead), 'arvoreTrovao');
        },
      });
    }
    return ops;
  }

  return {
    lugar: 'Ruínas de Árvore Trovão',
    // as portas desta cena têm roteiro próprio (teste, dono, barulho): a porta genérica (`game/portas.js`) fica de fora
    portasProprias: true,
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    depoisDeMover,
    fimDoCombate,
    // A FUGA DO DRAGÃO. No livro, reduzido à metade dos PV ele escala a torre e
    // voa embora "para lutar outro dia". O motor avisa de cada dano (`damage`) já
    // com o PV descontado; o dragão sai do tabuleiro ali mesmo e a luta acaba por
    // falta de inimigo (`fimDoCombate` paga 2.000 XP em vez de 3.900).
    evento: (ev) => {
      // O CULTO SEM FAVRIC: caído ele, o resto larga as armas e foge (o livro).
      if (ev.type === 'damage' && chefeDoCulto && ev.target === chefeDoCulto && (chefeDoCulto.dead || chefeDoCulto.hp <= 0)
        && !salvo.cultoFugiu && enc.combatants.includes(chefeDoCulto)) {
        salvo.cultoFugiu = true;
        for (const f of cultistas) {
          if (f === chefeDoCulto || f.dead) continue;
          const i = enc.combatants.indexOf(f);
          if (i >= 0) enc.combatants.splice(i, 1);
        }
        enc.say('fim', 'Favric cai, e o que sobra do culto larga as armas e foge pela rua, sem olhar para trás.');
        app.refresh();
        enc.checkEnd();
        return;
      }
      if (ev.type !== 'damage' || !dragao || ev.target !== dragao) return;
      if (salvo.dragaoFugiu || dragao.dead || dragao.hp <= 0) return;
      if (dragao.hp > dragao.maxHp / 2) return;
      salvo.dragaoFugiu = true;
      enc.say('fim', 'Presa Peçonhenta está pela metade. Ele ergue a cabeça, mede a saída pelo teto aberto — e vai.');
      const i = enc.combatants.indexOf(dragao);
      if (i >= 0) enc.combatants.splice(i, 1);
      app.refresh();
      enc.checkEnd();
    },
    dialogoDe: (npc) => {
      if (estado.lutando) return null;
      if (npc === reidoth) return arvoreDoReidoth();
      if (npc === chefeDoCulto && !salvo.culto) return arvoreDoCulto();
      // Quem aceitou a aliança ainda pode romper com ele (senão o cofre e a poção ficariam trancados até a torre).
      if (npc === chefeDoCulto && salvo.culto === 'aliado') {
        return {
          inicio: 'oi',
          nos: { oi: {
            narra: 'Favric sorri do mesmo jeito de antes, e os outros cinco não tiram os olhos do grupo.',
            fala: 'Descansem. Ao amanhecer, a torre.',
            opcoes: [
              { texto: 'Mudei de ideia: não vou servir ao dragão.', fim: 'luta' },
              { texto: 'Ainda não. Descansem vocês também.', fim: 'sai' },
            ],
          } },
        };
      }
      return null;
    },
    depoisDaConversa: async (npc, fim) => {
      if (npc === chefeDoCulto) {
        if (fim === 'luta') {
          salvo.culto = null;
          await painel('Os seis mantos se abrem ao mesmo tempo, as máscaras de chifre descem, e Favric começa a rezar alto.');
          luta(cultistas.filter((f) => !f.dead));
        } else if (fim === 'aliado') {
          // Combinado, e traição: ao entrar na torre, os seis lutam ao lado do dragão.
          salvo.culto = 'aliado';
          feitos.aliadoDoCulto = true;
          await painel('Favric aperta a mão de quem estiver mais perto, e a aperta com força demais. — Descansem. Amanhã vão ver o senhor da torre de perto.');
        } else if (fim === 'desiste') {
          salvo.culto = 'desistiu';
          for (const f of cultistas) {
            const i = enc.combatants.indexOf(f);
            if (i >= 0) enc.combatants.splice(i, 1);
          }
          await painel('Eles juntam o que cabe num saco e saem pela rua, para o sul, sem olhar a torre. O que fala por eles é o último a sair, e nem olha o cofre: tem pressa.');
          // CEM POR CENTO, e não três quartos. Medido, a luta contra eles
          // custa 5% dos PV do grupo: pagar 450 por convencer e 600 por matar
          // fazia da conversa a escolha pior nos dois eixos, e o cabeçalho
          // ainda a chamava de "a melhor saída dali". Ou o XP acompanha o que
          // o texto diz, ou o texto mente.
          await darXpDaLuta(valeDoBando(cultistas), 'O culto convencido a ir embora');
          app.refresh();
        }
        return;
      }
      // O feito e a missão já foram gravados ao abrir a conversa
      // (`acharReidoth`): antes isto só acontecia se o jogador saísse pela
      // opção de despedida, e quem fechasse a janela não cumpria a missão.
      void npc; void fim;
    },
    motivoSemDescanso: (tipo) => {
      if (!estado.explorando) return 'só fora da luta';
      if (tipo === 'longo' && dragao && !['morto', 'evitado', 'expulso'].includes(salvo.dragao)) {
        return 'dormir à sombra de um dragão? Não';
      }
      return null;
    },
    textoDoDescanso: () => ['Um descanso encostado numa parede de pedra, de costas para a torre.'],
    async iniciar() {
      prepararExploracao();
      // A ABERTURA SEGUE O DESENHO. Ela dizia "a única construção inteira" e "ao redor dela não cresce nada":
      // medido na planta da FA, SETE construções têm telhado (torre, ervas, casa15, casa7, escola, celeiro e
      // estalagem) e CINCO copas de árvore encostam na torre. Também falava de trinta centímetros de cinza, e
      // o terreno não tem uma casa de cinza — o chão é capim, laje e raiz. O mapa manda no texto.
      await painel([
        'A trilha acaba numa rua, e a rua está debaixo de raiz e capim que range na bota. Dos dois lados, casca de casa sem telhado, com mato crescendo de dentro para fora; uma ou outra ainda tem teto, e são essas que dão medo, porque alguma coisa escolheu ficar nelas.',
        'Ao norte, no fim da rua, uma torre de pedra escura, de pé entre as copas que já subiram até ela. Do alto dela sai um fio de fumaça esverdeada que não sobe: escorre.',
        'Esta é Árvore Trovão. O Monte Hotenow a matou numa tarde, há trinta anos, e desde então a mata vem tomando o que sobrou.',
      ]);
      // O Reidoth fica no tabuleiro desde já, mas é neutro: só uma figura
      // parada no largo, até alguém falar com ele.
      if (!enc.combatants.includes(reidoth)) {
        reidoth.side = 'neutro';
        reidoth.facingVec = { dx: 1, dy: 0 };
        enc.addCombatant(reidoth);
      }
      // Os cultistas também: ficam dentro da casa de pedra, visíveis pela
      // porta, e só brigam se a conversa azedar.
      if (cultistas.length && !salvo.culto) {
        for (const f of cultistas) {
          f.side = 'neutro';
          f.facingVec = { dx: -1, dy: 0 };      // a porta é a oeste
          if (!enc.combatants.includes(f)) enc.addCombatant(f);
        }
      }
      app.refresh();
    },
  };
}
