// Livro do Jogador não é SRD: a Maldição de Strahd é conteúdo da Wizards. TEXTO nosso, fatos do livro — ver NOTICE.md e STRAHD.md.
//
// A CASA DA MORTE, AS DUAS MASMORRAS (áreas 22 a 38). O que a cena faz:
//   nível 1  - o poço e os cinco baús dos cultistas (cadeado, Destreza CD 15);
//            - o poço de espinhos escondido (26): o primeiro a pisar cai;
//            - as seis criptas: as lajes (Atletismo CD 15), o enxame de Elisabeth e os ossos das crianças (Rose e Thorn descansam);
//            - o grick da despensa (28), os quatro carniçais do cruzamento (29), as cinco sombras do santuário (31), a porta que é
//              um mímico (33) e os dois lívidos do quarto dos líderes (34);
//   nível 2  - a prisão (36) e a porta secreta dela, a ponte levadiça (37) e a roda da câmara, o ritual "Um deve morrer!" (38) e
//              Lorghoth, o Decadente, o arbusto errante da alcova.
//
// Aqui tudo é escuro; a luz ainda não pesa na cena (o motor de luz da mansão não foi ligado: está no STRAHD.md).

import { addCondition } from '../rules/conditions.js';
import { descobrirRegiao, alternarRegiao } from '../rules/regioes.js';
import { narrar } from '../view/narrativa.js';

const perto = (c, p, casas = 1) => Math.max(Math.abs(c.pos.x - p.x), Math.abs(c.pos.y - p.y)) <= casas;
const vivo = (g) => (g?.membros ?? []).find((f) => !f.dead);
const igual = (a, b) => a.x === b.x && a.y === b.y;

// ---- as plantas: o que está onde (casas do jogo) -------------------------------------------------------------------------
/** Os cinco baús do poço (25A a 25E) e o que há em cada um. */
export const BAUS_POCO = [
  { id: 'A', x: 21, y: 4, texto: 'Dentro, numa bolsa feita de pele humana: 11 peças de ouro e 60 de prata.', dar: (g, q) => { g(q, 'moedaDeOuro', 11); g(q, 'moedaDePrata', 60); } },
  { id: 'B', x: 21, y: 2, texto: 'Dentro, em um pedaço dobrado de pano negro, três ágatas-musgo.', dar: (g, q) => g(q, 'agataMusgo', 3) },
  { id: 'C', x: 15, y: 1, texto: 'Dentro, um tapa-olho de couro preto com uma pedra vermelha costurada.', dar: (g, q) => g(q, 'tapaOlho', 1) },
  { id: 'D', x: 11, y: 3, texto: 'Dentro, uma escova de cabelo de marfim com cerdas de prata.', dar: (g, q) => g(q, 'escovaDeMarfim', 1) },
  { id: 'E', x: 11, y: 5, texto: 'Dentro, uma espada curta prateada, de lâmina fina.', dar: (g, q) => g(q, 'espadaCurtaPrateada', 1) },
];

/**
 * As seis criptas (23A a 23F): a laje (se for selada), o caixão e o que a cripta guarda.
 *
 * Exportada, como `SEGREDO_SANTUARIO`, `SEGREDO_PRISAO` e `PONTE`, porque `src/dev/conferir-paredes.mjs`
 * precisa saber quais casas o roteiro ABRE: senão ele conta a câmara do ritual (64 casas, atrás do segredo da
 * prisão) como chão que ninguém alcança, e o parecer vira ruído.
 */
export const CRIPTAS = {
  criptaA: { lado: 'oeste', selada: false },
  criptaB: { lado: 'leste', selada: false },
  criptaC: { lado: 'leste', selada: true, laje: [[20, 18]], de: { x: 20, y: 17 } },
  criptaD: { lado: 'leste', selada: true, laje: [[17, 18]], de: { x: 17, y: 17 } },
  criptaE: { lado: 'oeste', selada: true, laje: [[20, 16]], de: { x: 20, y: 17 } },
  criptaF: { lado: 'oeste', selada: true, laje: [[17, 16]], de: { x: 17, y: 17 } },
};
export const SEGREDO_SANTUARIO = [[11, 22]];
export const SEGREDO_PRISAO = [[9, 4]];
export const PONTE = [[13, 6], [12, 6]];
const RODA = { x: 11, y: 8 };
const ALTAR = { x: 8, y: 8 };
// O estrado octogonal: 4 x 4 casas sem os cantos, no meio da água (x 6 a 9, y 7 a 10).
const noEstrado = (p) => p.x >= 6 && p.x <= 9 && p.y >= 7 && p.y <= 10 && !((p.x === 6 || p.x === 9) && (p.y === 7 || p.y === 10));

/** Os gatilhos de passo das masmorras. */
export function poraoGatilhos(ctx) {
  Object.assign(ctx.depoisDaLuta ??= {}, {
    grick: async () => { await ctx.painel('O grick tomba, e o corpo mole e vermiforme se desmancha em viscosidade escura. A alcova atrás dele está vazia.'); },
    carnicais: async () => { await ctx.painel('O último carniçal desaba. O canto, sem ele, parece mais alto. Vem do norte, depois de uma curva, e de baixo.'); },
    sombras: async () => { await ctx.painel('As sombras se desfazem em fiapos de escuro e a estátua de Strahd volta a ser madeira pintada. Nas paredes, os esqueletos pendem quietos dos grilhões.'); },
    mimico: async () => { await ctx.painel('A porta se desmancha numa poça de cola e dentes. O quarto dos líderes, atrás dela, está à mostra.'); },
    livdos: async () => { await ctx.painel('Os dois lívidos desabam em trapos pretos e ossos. Gustav e Elisabeth Durst têm enfim o sossego que escolheram por tanto tempo recusar.'); },
    centopeias: async () => { await ctx.painel('O enxame se dispersa em centenas de pernas e some pelas frestas da parede dos fundos da cripta.'); },
    lorghoth: async () => {
      await ctx.painel('Quando Lorghoth cai, o canto cessa de vez. As aparições encapuzadas nas bordas se apagam, uma a uma, como tochas sem ar. A câmara fica em silêncio, só com a água pingando.');
    },
  });

  return {
    grick: (c) => {
      const f = vivo(ctx.grupos.grick);
      // O livro: a 1,5 m da alcova. A despensa tem 1 casa e fica no meio da parede sul do jantar (a do livro).
      if (!f || c.pos.x < 13 || c.pos.x > 16 || c.pos.y < 18 || c.pos.y > 19) return null;
      ctx.grupos.grick.furtividade = [12];       // o livro: quem tem Percepção passiva abaixo de 12 é surpreendido
      if (ctx.salvo.marcas?.gricAvisado) return { surpresa: null, intro: ['O rastro de muco não enganou: o grick se solta do teto da alcova, comprido e mole, bico aberto, mas o grupo já estava pronto.'] };
      return { surpresa: 'deles', intro: ['Um pedaço da escuridão da alcova se desprende da parede: uma criatura longa, mole, de cabeça de minhoca e bico de ave, e tentáculos que se abrem como uma mão.'] };
    },
    carnicais: (c, area) => {
      if (area?.id !== 'carnicais') return null;
      if (!(c.pos.x === 10 && c.pos.y === 16)) return null;
      return { intro: ['O canto ficou tão alto que dói. De repente a terra do chão se levanta em quatro pontos ao redor, e de dentro dela sobem corpos de túnica preta, de pele cinzenta e garras: ex-cultistas, ainda com a fome do culto.'] };
    },
    mimico: (c) => {
      const f = vivo(ctx.grupos.mimico);
      if (!f || !perto(c, f.pos)) return null;
      ctx.grupos.mimico.furtividade = [20];
      if (ctx.salvo.marcas?.mimicoVisto) return { surpresa: null, intro: ['A porta que não era porta estremece e abre uma boca de dentes de madeira. O grupo já sabia: ninguém toca nela de surpresa.'] };
      return { surpresa: 'deles', intro: ['A porta do canto sudoeste, de madeira escura e dobradiças de ferro, está estranhamente quente ao toque. Quem encosta nela fica preso: a porta tem boca.'] };
    },
  };
}

/** A casa depois de salvo: as lajes afastadas, a porta secreta, a ponte. E os ganchos de passo e parada da cena. */
export function reaplicarPorao(ctx) {
  const { salvo, variante } = ctx;
  salvo.criptas ??= [];
  salvo.paz ??= {};
  if (variante === 'casaDaMortePorao1') {
    if (salvo.alcapao) ctx.mudarCasas(SEGREDO_SANTUARIO, '?');
    for (const id of salvo.criptas) if (CRIPTAS[id]?.laje) ctx.mudarCasas(CRIPTAS[id].laje, '+');
  }
  if (variante === 'casaDaMortePorao2') {
    if (salvo.ponte) ctx.mudarCasas(PONTE, '=');
    if (salvo.portaPrisao) ctx.mudarCasas(SEGREDO_PRISAO, '?');
  }
  if (!variante.startsWith('casaDaMortePorao')) return;

  // O POÇO DE ESPINHOS (26) é uma REGIÃO do mapa (`casadamorte.js`, `rules/regioes.js`): a queda, os espinhos, o
  // Procurar e o Encontrar Armadilhas são do motor, para herói e monstro, na luta e explorando. A cena lembra o que
  // aconteceu (`salvo.espinhos`) e conta a queda.
  if (variante === 'casaDaMortePorao1') {
    if (salvo.espinhos === 'achado') descobrirRegiao(ctx.enc.field, 'espinhos');
    if (salvo.espinhos === 'caiu') alternarRegiao(ctx.enc.field, 'espinhos', false);
    const antesDoEvento = ctx.aoEvento;
    ctx.aoEvento = (ev) => {
      antesDoEvento?.(ev);
      if (ev.regiao?.id !== 'espinhos') return;
      if (ev.type === 'regiaoDescoberta' && !salvo.espinhos) salvo.espinhos = 'achado';
      if (ev.type === 'regiao' && ev.quando === 'entrar') {
        salvo.espinhos = 'caiu';
        const texto = `As tábuas podres cedem sob ${ev.actor.name} e o chão some. A queda é de três metros, e no fundo esperam espinhos de madeira, afiados (${ev.resultado?.dano ?? 0} de dano). Os outros baixam uma corda, e ${ev.actor.name} sai de lá se agarrando a ela. O buraco agora está à mostra, e dá para pular por cima.`;
        // explorando, o painel vem depois do passo (`aoMover`); na luta, o registro basta
        if (ctx.estado.explorando) ctx.quedaNoPoco = texto;
        else ctx.enc.say('acao', texto);
      }
    };
  }

  // O que para o passo: o estrado da câmara (38) até o ritual acontecer.
  (ctx.paradas ??= []).push((c, p) => {
    if (variante === 'casaDaMortePorao2') return !salvo.ritual && noEstrado(p) && !(p.x === ALTAR.x && p.y === ALTAR.y);
    return false;
  });

  const antes = ctx.aoMover;
  ctx.aoMover = async (c, a) => {
    if (antes) await antes(c, a);
    if (ctx.quedaNoPoco) {
      const texto = ctx.quedaNoPoco;
      ctx.quedaNoPoco = null;
      await ctx.painel(texto);
      ctx.app.refresh();
    }
    if (!ctx.estado.explorando) return;
    // O livro: o alçapão só se mostra a quem sobe a escada até a área 32.
    if (variante === 'casaDaMortePorao1' && a?.id === 'alcapao') salvo.alcapaoCanil = true;
    if (variante === 'casaDaMortePorao2' && !salvo.ritual && noEstrado(c.pos)) await ritual(ctx, c);
  };
}

/** O ritual da câmara (38): "Um deve morrer!". */
async function ritual(ctx, c) {
  const { salvo, root } = ctx;
  salvo.ritual = 'visto';
  await ctx.painel([
    'O canto volta a crescer. Nas bordas altas da câmara, treze vultos de capuz preto se acendem um a um, cada qual com uma tocha cuja chama é negra e parece beber a luz em volta. Sob os capuzes não há rostos, só vazio.',
    '"Um deve morrer!", cantam, repetidamente. "Um deve morrer! Um deve morrer!"',
    'São aparições inofensivas: não podem ser feridas, transformadas nem dissipadas. Mas estão olhando o altar.',
  ], { titulo: '38. A câmara do ritual' });

  let tentou = false;
  for (;;) {
    const v = await narrar(root, {
      formato: 'tela',
      paginas: [{ titulo: 'Um deve morrer!', texto: ['O canto não para. Quem está no estrado deve fazer alguma coisa: ficar, ou descer.'] }],
      escolhas: [
        ...(tentou ? [] : [{ rotulo: 'Entender o que querem (Religião ou Intuição, CD 11)', valor: 'entender' }]),
        { rotulo: 'Sacrificar uma vida no altar', valor: 'sacrificar' },
        { rotulo: 'Descer do estrado sem sacrificar ninguém (perigo: o culto ataca e Lorghoth desperta)', valor: 'negar' },
      ],
    });
    if (v === 'entender') {
      tentou = true;
      const t = ctx.teste(c, 'religiao', 11);
      const u = t.passou ? t : ctx.teste(c, 'intuicao', 11);
      await ctx.painel(t.passou || u.passou
        ? 'A resposta vem fácil, e é horrível: para o culto ficar em paz, uma criatura tem de morrer sobre o altar. As aparições não se importam com qual, e não se deixam enganar por ilusões. Tem de morrer de verdade, ali.'
        : `${c.name} olha as aparições e os entalhes do altar e não consegue mais do que o canto já disse: alguém vai ter de morrer.`);
      continue;
    }
    if (v === 'sacrificar') {
      if (await sacrificar(ctx)) return;
      continue;
    }
    return negar(ctx);
  }
}

/** Escolhe quem morre sobre o altar. Devolve `true` se alguém morreu. */
async function sacrificar(ctx) {
  const { salvo, root } = ctx;
  const alvos = ctx.herois();
  const quem = await narrar(root, {
    formato: 'tela',
    paginas: [{ titulo: 'Quem morre?', texto: ['Quem vai ser deitado sobre o altar? O que se faz aqui não se desfaz.'] }],
    escolhas: [...alvos.map((h) => ({ rotulo: h.name, valor: h.id })), { rotulo: 'Ninguém: voltar', valor: 'voltar', primaria: true }],
  });
  const vitima = alvos.find((h) => h.id === quem);
  if (!vitima) return false;
  ctx.enc.applyDamage(vitima, vitima.hp + vitima.maxHp, 'necrótico');
  vitima.dead = true;
  salvo.ritual = 'sacrificio';
  salvo.fim = 'sacrificio';
  await ctx.painel([
    `${vitima.name} se deita sobre o altar, e as correntes do teto descem sozinhas. As aparições se calam. Quando a primeira faca desce, o canto acaba. Quando acaba, as aparições se apagam como tochas sem ar, e a câmara fica em silêncio, com a água pingando.`,
    'Mas, bem baixo, na terra, o canto volta: "Ele é o Ancestral. Ele é a Terra". Strahd sabe do sacrifício, e a Casa da Morte não fará mais nada para impedi-los de sair. As brumas vão recuar.',
  ], { titulo: 'O culto é apaziguado' });
  ctx.app.refresh();
  return true;
}

/** Descer do estrado sem sacrificar: o canto muda e desperta o arbusto errante. */
async function negar(ctx) {
  const { salvo } = ctx;
  salvo.ritual = 'negado';
  salvo.fim = 'negado';
  const g = ctx.grupos.lorghoth;
  await ctx.painel([
    'O grupo desce do estrado, e o canto muda, e vem de todos os lados: "Lorghoth, o Decadente, nós te despertamos, levanta-te!"',
    'Da alcova do lixo vem um ruído de galhos e de lama. A pilha de refugo se levanta, e ganha braços de cipó e boca.',
  ], { titulo: 'O culto é negado' });
  if (g && !g.vencido && !g.ativo && g.membros.some((f) => !f.dead)) {
    for (const f of g.membros) f.pos = { ...f.pos, x: 3, y: 7 };
    await ctx.combate(g, null, ['"O fim vem! Ó Morte, sê louvada!", muda o canto. O arbusto errante entra na câmara, mole e pesado, e não vai parar até ser derrubado. Mas não vai deixar a masmorra.']);
  }
}

// ---- as interações -------------------------------------------------------------------------------------------------------
/** Abre um dos baús do poço (a magia Abrir e a gazua chegam aqui). */
export async function abrirBauDoPoco(ctx, b) {
  ctx.salvo.achados[`bau${b.id}`] = true;
  b.dar(ctx.guardar, ctx.herois()[0]);
  await ctx.painel(`O cadeado cede com um estalo. ${b.texto} ${ctx.herois()[0].name} fica com tudo.`);
  ctx.app.refresh();
}

export function poraoInteracoes(ctx, { area, tile, sup, c, ops }) {
  const { salvo, buscas, variante } = ctx;
  const { achados } = salvo;
  if (!variante.startsWith('casaDaMortePorao')) return;
  salvo.criptas ??= [];
  salvo.paz ??= {};

  // =========================================================================== nível 1 ==
  if (variante === 'casaDaMortePorao1') {
    // ---- os baús do poço (25A a 25E)
    for (const b of BAUS_POCO) {
      if (tile.x !== b.x || tile.y !== b.y) continue;
      const feito = achados[`bau${b.id}`];
      ops.push({
        rotulo: feito ? 'O baú (vazio)' : 'Abrir o baú trancado', icone: 'acao-usarObjeto',
        detalhe: feito ? 'já aberto' : 'ferramentas de ladrão, Prestidigitação, CD 15',
        motivo: feito ? 'já aberto' : ctx.longe(c, b, 10),
        fazer: async () => {
          const ladrao = ctx.herois().find((h) => ctx.tem(h, 'ferramentasDeLadrao'));
          if (!ladrao) { await ctx.painel('O cadeado de ferro está enferrujado, mas firme. Sem ferramentas de ladrão, não há o que fazer.'); return; }
          if (buscas.ja(ladrao, `bau${b.id}`)) { await ctx.painel(`${ladrao.name} já tentou este cadeado.`); return; }
          buscas.marcar(ladrao, `bau${b.id}`);
          const t = ctx.teste(ladrao, 'prestidigitacao', 15);
          if (!t.passou) { await ctx.painel(`${ladrao.name} força o cadeado até a gazua quebrar na ferrugem. Outro herói, com ferramentas, pode tentar.`); return; }
          await abrirBauDoPoco(ctx, b);
        },
      });
    }
    if (area?.id === 'poco') {
      ops.push({
        rotulo: 'Olhar dentro do poço', icone: 'acao-procurar', detalhe: 'a cisterna, nove metros abaixo', motivo: null,
        fazer: async () => { await ctx.painel('A boca do poço é de pedra úmida. Nove metros abaixo, uma água preta e parada devolve o brilho de uma luz, se houver. O balde pende de uma corda lisa de tanto uso.'); },
      });
    }

    // ---- o poço de espinhos (26)
    if (area?.id === 'espinhos' && !salvo.espinhos) {
      ops.push({
        rotulo: 'Procurar armadilhas no chão', icone: 'acao-procurar', detalhe: 'olhar o chão, sem pegadas', motivo: null,
        fazer: async () => {
          salvo.espinhos = 'achado';
          descobrirRegiao(ctx.enc.field, 'espinhos');
          await ctx.painel('Quem se abaixa e olha o chão do túnel repara no que falta: pegadas. Em todos os outros corredores da masmorra há marcas de pés de séculos; aqui, nenhuma. Por baixo de uma fina camada de terra, tábuas podres cobrem um poço de um metro e meio de comprimento. No fundo, espinhos de madeira. Dá para pular por cima.');
          ctx.app.refresh();
        },
      });
    }

    // ---- as criptas
    for (const [id, cr] of Object.entries(CRIPTAS)) {
      const nesta = area?.id === id;
      // a laje: de fora, do corredor
      if (cr.selada && !salvo.criptas.includes(id) && cr.de && (cr.laje.some(([lx, ly]) => lx === tile.x && ly === tile.y) || (tile.x === cr.de.x && tile.y === cr.de.y))) {
        const nome = { criptaC: 'Gustav', criptaD: 'Elisabeth', criptaE: 'Rose', criptaF: 'Thorn' }[id];
        const pe = ctx.algumTem('pedeCabra');
        ops.push({
          rotulo: `Afastar a laje da cripta de ${nome}`, icone: 'acao-usarObjeto', detalhe: `Atletismo, CD 15${pe ? ', com o pé de cabra (vantagem)' : ''}`,
          motivo: buscas.ja(c, `laje${id}`) ?? ctx.longe(c, cr.de, 10),
          fazer: async () => {
            buscas.marcar(c, `laje${id}`);
            const t = ctx.teste(c, 'atletismo', 15, Boolean(pe));
            if (!t.passou) { await ctx.painel(`${c.name} apoia o ombro na laje de pedra e empurra. Ela nem se mexe. Outro herói pode tentar.`); return; }
            salvo.criptas.push(id);
            ctx.mudarCasas(cr.laje, '+');
            await ctx.painel(`${t.quem?.name ?? c.name} desencaixa a laje de pedra e a arrasta para o lado, com um raspar que vem do fundo do chão. A cripta de ${nome} está aberta.`);
            ctx.app.refresh();
          },
        });
      }
      if (!nesta) continue;
      if (id === 'criptaD' && !salvo.centopeiasVistas) {
        ops.push({
          rotulo: 'Mexer no caixão de Elisabeth', icone: 'acao-usarObjeto', detalhe: 'um caixão sobre o esquife', motivo: ctx.longe(c, { x: 17, y: 19 }, 10),
          fazer: async () => {
            salvo.centopeiasVistas = true;
            const g = ctx.grupos.centopeias;
            if (g && !g.vencido && !g.ativo && g.membros.some((f) => !f.dead)) {
              await ctx.combate(g, null, ['A tampa do caixão range, e a parede dos fundos da cripta se abre num zumbido: centenas de pernas, de cabeça em cabeça, um enxame de centopeias irrompe das frestas e vem atrás de quem mexeu.']);
            }
          },
        });
      }
      if (id === 'criptaE' || id === 'criptaF') {
        const quem = id === 'criptaE' ? 'rose' : 'thorn';
        const osso = id === 'criptaE' ? 'ossosDeRose' : 'ossosDeThorn';
        const nome = id === 'criptaE' ? 'Rose' : 'Thorn';
        const dono = ctx.algumTem(osso);
        const feito = salvo.paz[quem];
        if (feito || dono) {
          ops.push({
            rotulo: feito ? `Os ossos de ${nome} já repousam` : `Deitar os ossos de ${nome} no caixão`, icone: 'acao-usarObjeto',
            detalhe: feito ? 'em paz' : quem === 'thorn' ? 'o menino' : 'a menina',
            motivo: feito ? 'em paz' : ctx.longe(c, quem === 'rose' ? { x: 20, y: 15 } : { x: 17, y: 15 }, 10),
            fazer: async () => {
              ctx.consumir(dono, osso);
              salvo.paz[quem] = true;
              await ctx.painel(quem === 'rose'
                ? 'Os ossinhos de Rose são deitados no caixão. Por um instante, num canto onde não há luz, uma menina de vestido de festa olha para o grupo, sorri e some, sem deixar nem o frio.'
                : 'Os ossinhos de Thorn, ainda abraçados ao boneco de pano, são deitados no caixão. Por um instante, uma voz pequena diz "obrigado" bem baixinho, e some.');
              if (salvo.paz.rose && salvo.paz.thorn) {
                for (const h of ctx.herois()) addCondition(h, 'inspirado', { rounds: 100000, source: 'casaDaMorte', data: { dado: '1d6' } });
                ctx.enc.say('cura', 'As crianças descansam: cada herói ganha uma Inspiração (um d6 no primeiro ataque, teste ou resistência).');
                await ctx.painel('Rose e Thorn descansam, os dois. O frio da casa recua um passo, e o grupo se sente por dentro como depois de uma coisa bem-feita: cada um ganha uma Inspiração.');
              }
              ctx.app.refresh();
            },
          });
        }
      }
      if (id === 'criptaC') {
        ops.push({
          rotulo: 'Examinar o caixão de Gustav', icone: 'acao-procurar', detalhe: 'um caixão vazio', motivo: null,
          fazer: async () => { await ctx.painel('Um caixão vazio sobre o esquife de pedra. Gustav Durst não está aqui: está em outro lugar da masmorra, e a cripta guarda só o lugar dele.'); },
        });
      }
    }

    // ---- o santuário (31)
    if (area?.id === 'santuario') {
      ops.push({
        rotulo: 'Pegar a esfera de cristal da estátua', icone: 'acao-usarObjeto', detalhe: 'a esfera cinza esfumaçada. Perigo: solta cinco sombras',
        motivo: achados.esfera ? 'já foi pega' : ctx.longe(c, { x: 8, y: 23 }, 15),
        fazer: async () => {
          achados.esfera = true;
          ctx.guardar(ctx.herois()[0], 'orbeDeCristalCinza', 1);
          const g = ctx.grupos.sombras;
          if (g && !g.vencido && !g.ativo && g.membros.some((f) => !f.dead)) {
            await ctx.combate(g, null, [`Quando a esfera sai da mão da estátua, o ar da sala se rasga. Ao redor do nicho, cinco sombras se formam das paredes e dos esqueletos, em forma de gente, de túnica e de ódio. ${ctx.herois()[0].name} fica com a esfera.`]);
          }
        },
      });
      ops.push({
        rotulo: 'Tocar a estátua de Strahd', icone: 'acao-usarObjeto', detalhe: 'a mão sobre a cabeça do lobo. Perigo: solta cinco sombras',
        motivo: ctx.longe(c, { x: 8, y: 23 }, 15),
        fazer: async () => {
          const g = ctx.grupos.sombras;
          if (g && !g.vencido && !g.ativo && g.membros.some((f) => !f.dead)) {
            await ctx.combate(g, null, ['A madeira pintada está fria como pedra de cripta. Quando os dedos a tocam, cinco sombras se formam ao redor do nicho, de túnica e de ódio, e vêm.']);
          } else await ctx.painel('Só madeira pintada, fria. Nada mais acontece.');
        },
      });
      if (!salvo.alcapao) {
        ops.push({
          rotulo: 'Procurar portas escondidas na parede leste', icone: 'acao-procurar', detalhe: 'Percepção, CD 10 (uma tentativa por herói)',
          motivo: buscas.ja(c, 'portaLeste', { x: 10, y: 22 }),
          fazer: async () => {
            buscas.marcar(c, 'portaLeste', { x: 10, y: 22 });
            const t = ctx.teste(c, 'percepcao', 10);
            if (!t.passou) { await ctx.painel(`${c.name} passa a mão pela argila da parede leste, sem achar nada.`); return; }
            salvo.alcapao = true;
            ctx.mudarCasas(SEGREDO_SANTUARIO, '?');
            await ctx.painel(`${t.quem?.name ?? c.name} sente, sob a camada de argila, uma moldura de madeira apodrecida. A porta se abre puxando: atrás dela, uma escada de pedra sobe três metros, na direção de um teto de tábuas.`);
            ctx.app.refresh();
          },
        });
      }
    }

    // ---- o quarto dos líderes (34)
    if (area?.id === 'quartoLideres') {
      ops.push({
        rotulo: achados.tochas ? 'As tochas e velas (levadas)' : 'Pegar as tochas e as velas', icone: 'acao-usarObjeto', detalhe: 'trinta tochas e quinze velas',
        motivo: achados.tochas ? 'já pegas' : ctx.longe(c, { x: 4, y: 12 }, 15),
        fazer: async () => {
          achados.tochas = true;
          const q = ctx.herois()[0];
          ctx.guardar(q, 'tocha', 30);
          ctx.guardar(q, 'vela', 15);
          await ctx.painel('A caixa aberta tem trinta tochas, e o saco de couro, quinze velas. Boa coisa para uma masmorra escura.');
          ctx.app.refresh();
        },
      });
      ops.push({
        rotulo: achados.cofreDosLideres ? 'A caixa ao pé da cama (vazia)' : 'Revirar a caixa ao pé da cama', icone: 'acao-usarObjeto',
        detalhe: achados.cofreDosLideres ? 'já revirada' : 'itens de aventureiros mortos',
        motivo: achados.cofreDosLideres ? 'já revirada' : ctx.longe(c, { x: 3, y: 13 }, 15),
        fazer: async () => {
          achados.cofreDosLideres = true;
          const q = ctx.herois()[0];
          for (const [id, n] of [['mantoDeProtecao', 1], ['pocaoDeCura', 4], ['kitDeRefeicao', 1], ['fogoAlquimico', 1], ['lanternaFuraco', 1], ['ferramentasDeLadrao', 1], ['livroDeMagiasDosCultistas', 1]]) ctx.guardar(q, id, n);
          (q.bag ??= []).push({ id: 'cotaDeMalha', tipo: 'armadura', qtd: 1 });      // a armadura vai para a mochila com o tipo dela
          const g = ctx.grupos.livdos;
          await ctx.painel('A caixa guarda coisa de verdade, tirada de aventureiros que foram atraídos a Baróvia, presos e mortos pelo culto: um manto de proteção, um cofrezinho destrancado com quatro poções de cura, uma cota de malha, um kit de refeição, um frasco de fogo alquímico, uma lanterna de foco, um conjunto de ferramentas de ladrão e um livro de magias de capa de couro amarelo. Quem as pega nem sente o chão tremer.');
          if (g && !g.vencido && !g.ativo && g.membros.some((f) => !f.dead)) {
            await ctx.combate(g, null, ['Atrás das paredes de terra, duas cavidades que ninguém tinha notado estouram. De dentro delas saem dois mortos-vivos de vestes pretas esfarrapadas: um homem e uma mulher, de olhar frio, com os dedos como garras. Gustav e Elisabeth Durst estavam esperando alguém mexer na caixa.']);
          }
          ctx.app.refresh();
        },
      });
    }
  }

  // =========================================================================== nível 2 ==
  if (variante === 'casaDaMortePorao2') {
    if (area?.id === 'relicario') {
      ops.push({
        rotulo: 'Olhar os nichos das relíquias', icone: 'acao-procurar', detalhe: 'treze nichos', motivo: null,
        fazer: async () => { await ctx.painel('Treze nichos nas paredes, e em cada um, uma relíquia do culto: a mão mumificada de um goblin, uma faca de osso, um orbe feito de um olho de nótico, a cabeça murcha de um halfling... É tudo lixo, mas lixo de gente que acreditava, e isso se sente.'); },
      });
    }
    if (area?.id === 'prisao') {
      if (!achados.aneisPrisao) {
        ops.push({
          rotulo: 'Revistar o esqueleto de manto preto', icone: 'acao-procurar', detalhe: 'um esqueleto preso à parede', motivo: ctx.longe(c, { x: 5, y: 1 }, 20),
          fazer: async () => {
            achados.aneisPrisao = true;
            ctx.guardar(ctx.herois()[0], 'anelDeOuro', 1);
            await ctx.painel('O esqueleto de manto preto esfarrapado pende da parede dos fundos da cela. Foi alguém do próprio culto que questionou a devoção cega a Strahd. Num dedo ósseo, um anel de ouro.');
            ctx.app.refresh();
          },
        });
      }
      if (!salvo.portaPrisao) {
        ops.push({
          rotulo: 'Procurar portas secretas na parede sul', icone: 'acao-procurar', detalhe: 'Percepção, CD 15 (uma tentativa por herói)',
          motivo: buscas.ja(c, 'portaPrisao', { x: 9, y: 3 }),
          fazer: async () => {
            buscas.marcar(c, 'portaPrisao', { x: 9, y: 3 });
            const t = ctx.teste(c, 'percepcao', 15);
            const paciencia = !t.passou && buscas.esgotou(ctx.herois(), 'portaPrisao', { x: 9, y: 3 });
            if (!t.passou && !paciencia) { await ctx.painel(`${c.name} procura nas paredes de terra e não acha nada.`); return; }
            if (paciencia) await ctx.painel('Depois de todos terem tentado, o grupo refaz a busca palmo a palmo, sem pressa.');
            salvo.portaPrisao = true;
            ctx.mudarCasas(SEGREDO_PRISAO, '?');
            await ctx.painel(`${t.quem?.name ?? c.name} nota uma fresta onde a argila parece fina demais. Atrás dela, uma porta de madeira, que se abre puxando: daqui se chega direto à câmara do ritual.`);
            ctx.app.refresh();
          },
        });
      }
    }
    if (area?.id === 'tunelAgua') {
      ops.push({
        rotulo: salvo.ponte ? 'A ponte levadiça (abaixada)' : 'Abaixar a ponte levadiça à força', icone: 'acao-usarObjeto',
        detalhe: salvo.ponte ? 'já está baixa' : 'Atletismo, CD 20',
        motivo: salvo.ponte ? 'já está baixa' : (buscas.ja(c, 'ponte', { x: 13, y: 6 }) ?? ctx.longe(c, { x: 14, y: 6 }, 10)),
        fazer: async () => {
          buscas.marcar(c, 'ponte', { x: 13, y: 6 });
          const t = ctx.teste(c, 'atletismo', 20);
          const juntos = !t.passou && buscas.esgotou(ctx.herois(), 'ponte', { x: 13, y: 6 });
          if (juntos) await ctx.painel('Cansados de tentar sozinhos, os quatro se agarram às correntes e puxam juntos.');
          if (!t.passou && !juntos) { await ctx.painel(`${c.name} está com a água turva e fria até a canela, as mãos nas correntes enferrujadas. A ponte levadiça nem treme. Outra pessoa pode tentar, ou há uma roda do outro lado, dentro da câmara.`); return; }
          salvo.ponte = true;
          ctx.mudarCasas(PONTE, '=');
          await ctx.painel(`${t.quem?.name ?? c.name} firma os pés no limo e puxa as correntes da ponte levadiça com um grito. As correntes rangem e a placa de ferro desce, devagar, até bater do outro lado. O caminho está livre.`);
          ctx.app.refresh();
        },
      });
    }
    if (area?.id === 'camara') {
      ops.push({
        rotulo: salvo.ponte ? 'Girar a roda e erguer a ponte' : 'Girar a roda da ponte levadiça', icone: 'acao-usarObjeto',
        detalhe: 'a roda de madeira da parede leste', motivo: ctx.longe(c, RODA, 10),
        fazer: async () => {
          salvo.ponte = !salvo.ponte;
          ctx.mudarCasas(PONTE, salvo.ponte ? '=' : 'M');
          await ctx.painel(salvo.ponte
            ? 'A roda gira com um gemido de madeira, e as correntes no fundo da parede se retesam. A ponte levadiça se abaixa, no túnel a leste.'
            : 'A roda gira para o outro lado, e as correntes recolhem a ponte levadiça. O túnel a leste volta a ficar fechado.');
          ctx.app.refresh();
        },
      });
    }
    if (area?.id === 'alcova') {
      const g = ctx.grupos.lorghoth;
      ops.push({
        rotulo: 'Examinar o monte de lixo', icone: 'acao-procurar', detalhe: 'Natureza, CD 15', motivo: buscas.ja(c, 'lorghoth', { x: 1, y: 7 }) ?? (g?.vencido ? 'já foi' : null),
        fazer: async () => {
          buscas.marcar(c, 'lorghoth', { x: 1, y: 7 });
          const t = ctx.teste(c, 'natureza', 15);
          await ctx.painel(t.passou
            ? `${t.quem?.name ?? c.name} se agacha ao lado do monte e vê o que ele é: não é lixo, é uma planta. Galhos, cipós e lama, respirando bem devagar. É um arbusto errante, e dorme. Os cultistas o chamavam de Lorghoth, o Decadente.`
            : 'Galhos, ervas, lama e coisas de comer apodrecido. Um monte de lixo a mais.');
        },
      });
      if (g && !g.vencido && !g.ativo && g.membros.some((f) => !f.dead)) {
        ops.push({
          rotulo: 'Atacar o monte de lixo', icone: 'acao-usarObjeto', detalhe: 'Lorghoth dorme', motivo: ctx.longe(c, { x: 1, y: 7 }, 10),
          fazer: async () => { await ctx.combate(g, 'nossa', ['O primeiro golpe afunda no monte como num colchão de folhas. Debaixo dele, alguma coisa abre os olhos.']); },
        });
      }
    }
  }
}
