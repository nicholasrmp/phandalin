// Livro do Jogador não é SRD: a Maldição de Strahd é conteúdo da Wizards. TEXTO nosso, fatos do livro — ver NOTICE.md e STRAHD.md.
//
// A CASA DA MORTE, 3º ANDAR e SÓTÃO (áreas 11 a 21): o que acorda, o que se acha e o que as crianças-fantasma dizem.
//   - gatilhos: a armadura animada (11), a vassoura animada (14) e o espectro da babá (15B ao abrir o berçário, 18 ao mexer nos restos);
//   - o espelho de hera da suíte da babá (15A), a caixa de joias da suíte principal (12);
//   - o quarto das crianças (20): a porta trancada (chave de ferro, ou ferramentas de ladrão, Prestidigitação, CD 15), a casa de bonecas
//     (a réplica da casa, que mostra a escada secreta), os brinquedos e os ossos de Rose e Thorn;
//   - Rose e Thorn: aparecem quando alguém mexe nos brinquedos, sabem que estão mortos e só lutam em autodefesa.

import { conversar } from './dialogo.js';
import { NPCS } from '../rules/npcs.js';
import { makeMonster } from '../rules/monsters.js';

const pessoa = (id) => ({ id, name: NPCS[id]?.nome ?? id, look: NPCS[id]?.look ?? null });
const perto = (c, p, casas = 1) => Math.max(Math.abs(c.pos.x - p.x), Math.abs(c.pos.y - p.y)) <= casas;
const vivo = (g) => (g?.membros ?? []).find((f) => !f.dead);

/** Os gatilhos que disparam ao fim de um passo: `(c, area)` devolve `null` ou `{ intro, surpresa }`. */
export function altoGatilhos(ctx) {
  Object.assign(ctx.depoisDaLuta ??= {}, {
    armadura: async () => { await ctx.painel('A armadura desaba em placas negras, que rolam pelo assoalho até parar. Por dentro, só poeira e teia: nunca houve ninguém.'); },
    vassoura: async () => { await ctx.painel('A vassoura cai quebrada, o cabo em dois. Só um pedaço de madeira, agora.'); },
    espectroBaba: async () => { await ctx.painel('A jovem esquelética abre a boca sem dizer nada, e some como fumaça de vela. O quarto fica mais quente e o pacote no berço, mais leve. Ela não volta.'); },
  });
  return {
    armadura: (c) => {
      const f = vivo(ctx.grupos.armadura);
      if (!f || !perto(c, f.pos)) return null;
      return { intro: [
        'A armadura de placas negras vira o elmo para vocês com um chiado de ferrugem, solta as teias dos ombros e levanta o braço de ferro. Do outro lado da viseira fechada não há ninguém, mas alguma coisa decidiu que vocês não deviam ter subido.',
      ] };
    },
    vassoura: (c) => {
      const f = vivo(ctx.grupos.vassoura);
      if (!f || !perto(c, f.pos)) return null;
      return { intro: [
        'A vassoura encostada no canto desliza da parede, uma cerda de cada vez, e sai do véu de teia como um bicho sacudindo a poeira. O cabo corta o ar.',
      ] };
    },
    espectroBaba: (c, area) => {
      // No 3º andar, o espectro se manifesta quando alguém abre a porta do berçário (a entrada dele).
      if (ctx.variante !== 'casaDaMorte3' || area?.id !== 'bercario') return null;
      return { intro: [
        'A porta do berçário range e o ar fica gelado de repente. No canto, ao lado do berço sob a mortalha, uma jovem esquelética e aterrorizada se solta da sombra, os olhos fundos de quem foi morta a facadas. Ela não fala, e não pode ser interpelada: só aponta o berço, e então vem para cima de vocês.',
      ] };
    },
  };
}

/** A conversa com Rose e Thorn, depois que alguém mexeu nos brinquedos. Rose fala; Thorn só chora e se esconde atrás dela. */
function arvoreDosFantasmas(ctx) {
  const salvo = ctx.salvo;
  const volta = [{ texto: '…', vai: 'oi' }];
  return {
    inicio: 'oi',
    nos: {
      oi: {
        narra: 'O ar fica gelado e duas formas pálidas se desenham no meio do quarto: uma menina de uns dez anos e um menino, miúdos demais para o vestido e o casaquinho esfarrapados. Não são as crianças da rua. Estas sabem o que são.',
        fala: 'Vocês mexeram nas nossas coisas. A gente não gosta. Mas não vamos machucar ninguém, a menos que seja preciso.',
        opcoes: [
          { texto: 'Vocês são Rose e Thorn?', vai: 'quem', uma: true },
          { texto: 'Como vocês morreram?', vai: 'morte', uma: true },
          { texto: 'Como se chega ao porão?', vai: 'porta', uma: true },
          { texto: 'Como podemos ajudar vocês?', vai: 'ajuda', uma: true },
          { texto: 'Levantar a arma contra eles.', fim: 'atacar' },
          { texto: 'Valeu. Vamos deixá-los em paz.', fim: 'sair' },
        ],
      },
      quem: {
        fala: 'Eu sou a Rose. Ele é o Thorn. A gente morava aqui, antes. Nossos pais nos trancaram aqui em cima para proteger a gente do "monstro do porão".',
        opcoes: volta,
      },
      morte: {
        narra: 'O menino se encolhe atrás da irmã. A menina engole em seco, sem ar.',
        fala: 'De fome. Eles esqueceram de voltar. Ou não esqueceram.',
        opcoes: volta,
      },
      porta: {
        ao: () => { salvo.dicaDaCasaDeBonecas = true; },
        fala: 'Tem uma porta secreta no sótão. A casa de bonecas sabe onde ela está: procurem nela.',
        opcoes: volta,
      },
      ajuda: {
        fala: 'Nossos ossos estão aqui no chão. Se alguém... se alguém deitasse a gente em casa, na cripta, lá embaixo... Mas a gente não sabe se é isso. A gente só tem medo de ficar sozinho de novo.',
        opcoes: volta,
      },
    },
  };
}

async function fantasmas(ctx) {
  if (ctx.salvo.fantasmas) return;
  ctx.salvo.fantasmas = 'apareceram';
  const fim = await conversar(ctx.app, pessoa('rose'), arvoreDosFantasmas(ctx));
  if (fim === 'atacar') await lutarComOsFantasmas(ctx);
}

/** O livro: eles só lutam em autodefesa. Quem levanta a arma contra eles terá a luta. Reduzidos a 0 PV, voltam ao amanhecer. */
async function lutarComOsFantasmas(ctx) {
  if (ctx.grupos.fantasmas && !ctx.grupos.fantasmas.vencido) return;
  const mk = (nome, x) => { const f = makeMonster('fantasmaDeCrianca', { x, y: 3 }); f.name = nome; f.grupo = 'fantasmas'; f.facingVec = { dx: 0, dy: 1 }; return f; };
  const g = { id: 'fantasmas', membros: [mk('Rose', 7), mk('Thorn', 8)], ativo: false, vencido: false, furtividade: [0], titulo: '20. O quarto das crianças' };
  ctx.grupos.fantasmas = g;
  ctx.depoisDaLuta.fantasmas = async () => {
    ctx.salvo.fantasmas = 'apareceram';
    await ctx.painel('Rose e Thorn se desfazem em fiapos de frio e de choro. Os ossos continuam no chão. Quando amanhecer, eles voltarão: só o enterro das crianças as põe em paz.');
  };
  await ctx.combate(g, null, ['As duas formas pálidas se erguem do chão, de rostos duros: não é a hora de brincar. Rose abre os braços na frente do irmão, e o frio da sala se fecha em volta de vocês.']);
}

/** A casa de bonecas mostra a escada secreta; o marco do 2º nível, se a carta ainda não o deu. */
async function casaDeBonecas(ctx, c) {
  const { salvo } = ctx;
  if (salvo.escada) { await ctx.painel('Na réplica da casa, a escada em espiral aparece pequenina, no mesmo lugar que a de verdade.'); return; }
  const t = ctx.teste(c, 'percepcao', 15, Boolean(salvo.dicaDaCasaDeBonecas));
  if (!t.passou) {
    await ctx.painel(`${c.name} passa os dedos pelos quartinhos e pelos cômodos da casa de bonecas, e não acha nada fora do lugar. Outros olhos podem ajudar.`);
    return;
  }
  await ctx.painel(`${t.quem?.name ?? c.name} abre o telhado da casa de bonecas e olha dentro, andar por andar, até o último: uma portinha minúscula, no sótão em miniatura, e atrás dela uma escada em espiral do tamanho de um dedo. A casa de verdade guarda uma igual.`);
  await ctx.revelarEscada('bonecas');
}

/** Destranca a porta do quarto das crianças (a chave, a gazua e a magia Abrir chegam aqui). */
export async function destrancarPortaDasCriancas(ctx, quem, texto = null) {
  ctx.salvo.portaCriancas = true;
  ctx.abrirAresta(7, 5, 7, 6);
  await ctx.painel(texto ?? `${quem.name} destranca o cadeado, e a porta do quarto das crianças range e abre.`);
  ctx.app.refresh();
}

export function altoInteracoes(ctx, { area, tile, sup, c, ops }) {
  const { salvo, buscas } = ctx;
  const { achados } = salvo;
  const v = ctx.variante;

  // ============================================================== 3º andar ==
  if (v === 'casaDaMorte3') {
    if (area.id === 'varanda') {
      const oeste = { x: 5, y: 8 };
      ops.push({
        rotulo: salvo.portaOeste ? 'A porta da parede oeste (aberta)' : 'Procurar portas secretas na parede oeste', icone: 'acao-procurar',
        detalhe: salvo.portaOeste ? 'a escada sobe ao sótão' : 'Percepção, CD 15',
        motivo: salvo.portaOeste ? null : buscas.ja(c, 'portaOeste', oeste),
        fazer: async () => {
          if (salvo.portaOeste) { await ctx.painel('Uma porta de madeira na parede oeste, aberta sobre uma escada estreita cheia de teia, que sobe ao sótão.'); return; }
          buscas.marcar(c, 'portaOeste', oeste);
          const t = ctx.teste(c, 'percepcao', 15);
          if (!t.passou) { await ctx.painel(`${c.name} passa a mão pelos painéis da parede oeste e só acha madeira.`); return; }
          if (!salvo.escada) { await ctx.painel(`${t.quem?.name ?? c.name} procura com cuidado e encontra o desenho de uma porta, sob a tinta: a casa a esconde ainda, e não vai mostrá-la enquanto não quiser.`); return; }
          salvo.portaOeste = true;
          ctx.aplicarEscada();
          await ctx.painel(`${t.quem?.name ?? c.name} acha a fresta e puxa: um painel gira, e atrás dele há uma escada de madeira cheia de teia, que sobe.`);
          ctx.app.refresh();
        },
      });
      const onde = { x: 7, y: 8 };
      ops.push({
        rotulo: 'Examinar os painéis das paredes', icone: 'acao-procurar',
        detalhe: salvo.paineisVaranda ? 'já examinados' : 'Percepção, CD 12',
        motivo: salvo.paineisVaranda ? 'já examinados' : buscas.ja(c, 'paineisVaranda', onde),
        fazer: async () => {
          buscas.marcar(c, 'paineisVaranda', onde);
          const t = ctx.teste(c, 'percepcao', 12);
          if (!t.passou) { await ctx.painel(`${c.name} olha as árvores entalhadas na madeira escura. Cenas de floresta, folhas caindo, bichinhos. Nada mais.`); return; }
          salvo.paineisVaranda = true;
          await ctx.painel(`${t.quem?.name ?? c.name} chega bem perto da madeira entalhada e vê o que ela mostra: nos galhos pendem cadáveres minúsculos, e do chão saem vermes.`);
        },
      });
    }
    if (area.id === 'suitePrincipal') {
      ops.push({
        rotulo: achados.joias ? 'A caixa de joias (vazia)' : 'Abrir a caixa de joias da penteadeira', icone: 'acao-usarObjeto',
        detalhe: achados.joias ? 'já aberta' : 'prata com filigrana de ouro', motivo: achados.joias ? 'já aberta' : ctx.longe(c, { x: 8, y: 3 }, 40),
        fazer: async () => {
          achados.joias = true;
          const quem = ctx.herois()[0];
          ctx.guardar(quem, 'caixaDeJoiasDosDurst', 1);
          ctx.guardar(quem, 'anelDeOuro', 3);
          ctx.guardar(quem, 'colarDeTopazio', 1);
          await ctx.painel(`A caixa é de prata com filigrana de ouro. Dentro, três anéis de ouro e um colar de platina fina com um pingente de topázio. ${quem.name} fica com tudo, a caixa inclusive.`);
          ctx.app.refresh();
        },
      });
      ops.push({
        rotulo: 'Olhar o espelho do armário', icone: 'acao-procurar', detalhe: 'a porta do pé da cama', motivo: null,
        fazer: async () => { await ctx.painel('O espelho de corpo inteiro, montado numa porta ao pé da cama, abre para um armário vazio, coberto de pó. Nada mais.'); },
      });
      ops.push({
        rotulo: 'Apertar o botão do criado-mudo', icone: 'acao-usarObjeto', detalhe: 'o sino da cozinha', motivo: null,
        fazer: async () => { await ctx.painel('O botão afunda na parede e, muito abaixo, no escuro, um sininho de bronze toca uma vez. Ninguém vem.'); },
      });
    }
    if (area.id === 'suiteBaba') {
      const onde = { x: 5, y: 20 };
      const aberto = salvo.escada;
      ops.push({
        rotulo: aberto ? 'A porta atrás do espelho (aberta)' : 'Examinar o espelho de hera',
        icone: 'acao-procurar',
        detalhe: aberto ? 'a escada sobe ao sótão' : (salvo.olhos ? 'já vistos os olhos nas bagas' : 'Percepção, CD 12'),
        motivo: aberto ? null : (salvo.olhos ? 'já examinado' : buscas.ja(c, 'espelho', onde)),
        fazer: async () => {
          if (aberto) { await ctx.painel('O espelho de hera girou na parede e deixou à mostra uma escada de madeira, estreita, cheia de teia, que sobe até o sótão.'); return; }
          buscas.marcar(c, 'espelho', onde);
          const t = ctx.teste(c, 'percepcao', 12);
          if (!t.passou) { await ctx.painel(`${c.name} olha o espelho: uma moldura bonita, de hera e de bagas. Nada mais.`); return; }
          salvo.olhos = true;
          await ctx.painel(`${t.quem?.name ?? c.name} se aproxima e vê o que as bagas entalhadas escondem: globos oculares, de verdade, entre a hera, que acompanham quem olha. Atrás do espelho a parede soa maciça. Por ora não há porta nenhuma: a casa ainda não quer mostrar.`);
        },
      });
    }
    if (area.id === 'bercario') {
      ops.push({
        rotulo: 'Desenrolar a mortalha do berço', icone: 'acao-usarObjeto', detalhe: 'um pacote do tamanho de um bebê', motivo: salvo.berco ? 'já aberto' : null,
        fazer: async () => {
          salvo.berco = true;
          await ctx.painel('Sob a mortalha negra há um pacote firmemente embrulhado, do tamanho de um bebê. Quem desembrulha o cobertor não acha nada dentro dele.');
        },
      });
    }
  }

  // =================================================================== sótão ==
  if (v === 'casaDaMorte4') {
    if (area.id === 'sotaoPedra' && !salvo.portaCriancas) {
      ops.push({
        rotulo: 'Abrir a porta trancada do norte', icone: 'acao-usarObjeto',
        detalhe: ctx.algumTem('chaveDeFerroDosDurst') ? 'a chave de ferro dos Durst' : 'ferramentas de ladrão, Prestidigitação, CD 15',
        motivo: ctx.longe(c, { x: 7, y: 7 }, 10),
        fazer: async () => {
          const dono = ctx.algumTem('chaveDeFerroDosDurst');
          if (dono) {
            salvo.portaCriancas = true;
            ctx.abrirAresta(7, 5, 7, 6);
            await ctx.painel(`${dono.name} gira a chave de ferro no cadeado, que cede com um estalo. A porta do quarto das crianças range e abre.`);
            ctx.app.refresh();
            return;
          }
          const ladrao = ctx.herois().find((h) => ctx.tem(h, 'ferramentasDeLadrao'));
          if (!ladrao) { await ctx.painel('O cadeado é pesado e firme. A chave está na biblioteca, no segundo andar, ou serve um conjunto de ferramentas de ladrão.'); return; }
          const t = ctx.teste(ladrao, 'prestidigitacao', 15);
          if (!t.passou) { await ctx.painel(`${ladrao.name} trabalha o cadeado até a ponta da gazua entortar. Dá para tentar de novo com mais calma.`); return; }
          salvo.portaCriancas = true;
          ctx.abrirAresta(7, 5, 7, 6);
          await ctx.painel(`${ladrao.name} sente o último pino ceder. O cadeado cai, e a porta do quarto das crianças abre sozinha.`);
          ctx.app.refresh();
        },
      });
    }
    if (area.id === 'quarto17') {
      ops.push({
        rotulo: 'Olhar a boneca da janela', icone: 'acao-procurar', detalhe: 'sorrindo para o norte', motivo: null,
        fazer: async () => { await ctx.painel('A boneca de vestido amarelo sorri para o vidro sujo da janela. Coberta de teia, tem um ar de noiva. Quando o olhar se afasta, parece que o rosto gira um dedo na direção da porta.'); },
      });
    }
    if (area.id === 'quarto19') {
      ops.push({
        rotulo: 'Olhar o quarto', icone: 'acao-procurar', detalhe: 'cama pequena, cadeira de balanço', motivo: null,
        fazer: async () => { await ctx.painel('A cadeira de balanço está parada, mas o assento ainda se mexe um pouco, como se alguém tivesse acabado de levantar.'); },
      });
    }
    if (area.id === 'criancas') {
      ops.push({
        rotulo: 'Mexer nos brinquedos', icone: 'acao-usarObjeto', detalhe: 'o baú de moinhos pintados', motivo: salvo.fantasmas ? 'as crianças já apareceram' : null,
        fazer: async () => {
          await ctx.painel('A tampa do baú range. Dentro: bichos de pelúcia, soldadinhos de madeira, um cavalinho de pau e outros brinquedos de uma infância que não terminou. Quando a tampa bate de volta, o ar do quarto fica gelado.');
          await fantasmas(ctx);
        },
      });
      ops.push({
        rotulo: 'Procurar portas na casa de bonecas', icone: 'acao-procurar',
        detalhe: salvo.escada ? 'a escada já foi achada' : (salvo.dicaDaCasaDeBonecas ? 'Percepção, CD 15, com vantagem' : 'Percepção, CD 15'),
        motivo: salvo.escada ? 'já achada' : buscas.ja(c, 'bonecas', { x: 6, y: 4 }),
        fazer: async () => {
          if (!salvo.escada) buscas.marcar(c, 'bonecas', { x: 6, y: 4 });
          await casaDeBonecas(ctx, c);
          if (!salvo.fantasmas) await fantasmas(ctx);
        },
      });
      for (const [quem, id] of [['Rose', 'ossosDeRose'], ['Thorn', 'ossosDeThorn']]) {
        const chave = `ossos${quem}`;
        ops.push({
          rotulo: `Recolher os ossos de ${quem}`, icone: 'acao-usarObjeto', detalhe: achados[chave] ? 'já recolhidos' : 'um embrulho de ossinhos',
          motivo: achados[chave] ? 'já recolhidos' : null,
          fazer: async () => {
            achados[chave] = true;
            ctx.guardar(ctx.herois()[0], id, 1);
            await ctx.painel(quem === 'Rose'
              ? 'Os ossos de uma menina, no vestido de festa que deixou de caber. O embrulho é leve. Quando a mão o levanta, o ar parece soltar um suspiro.'
              : 'Os ossos de um menino pequeno, ainda abraçados ao boneco de pano. É preciso desprender os braços com cuidado.');
            if (!salvo.fantasmas) await fantasmas(ctx);
            ctx.app.refresh();
          },
        });
      }
    }
    if (area.id === 'deposito18') {
      const g = ctx.grupos.espectroBaba;
      ops.push({
        rotulo: salvo.restosVistos ? 'Os restos da babá' : 'Abrir o baú sob o lençol', icone: 'acao-usarObjeto',
        detalhe: 'Medicina, CD 14', motivo: ctx.longe(c, { x: 1, y: 12 }, 20),
        fazer: async () => {
          const t = ctx.teste(c, 'medicina', 14);
          salvo.restosVistos = true;
          await ctx.painel(t.passou
            ? `O baú, destrancado, guarda um corpo envolto num lençol esfarrapado, de sangue seco. ${t.quem?.name ?? c.name} examina os restos e vê o que sobrou: a mulher foi esfaqueada até morrer, muitas vezes, e há muito tempo. É a babá.`
            : 'O baú, destrancado, guarda um corpo num lençol manchado de sangue seco. Não dá para dizer mais nada sem entender do ofício.');
          if (g && !g.vencido && !g.ativo && g.membros.some((f) => !f.dead)) {
            await ctx.combate(g, null, ['O ar do depósito fica pesado. Uma jovem esquelética e aterrorizada se levanta dos lençóis, de olhos fundos, sem uma palavra, e vem em direção a quem mexeu nela.']);
          }
        },
      });
    }
  }
}
