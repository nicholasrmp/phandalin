// Livro do Jogador não é SRD: a Maldição de Strahd é conteúdo da Wizards. TEXTO nosso, fatos do livro — ver NOTICE.md e STRAHD.md.
//
// A CASA DA MORTE: A SAÍDA e O FIM. O livro tem três finais para quem desce às masmorras:
//   - o culto é APAZIGUADO (alguém morre sobre o altar da câmara, 38): a casa não faz mais nada e as brumas recuam;
//   - o culto é NEGADO: ao subir de volta, a casa ataca o grupo. As janelas se emparedam, as portas viram lâminas de foice (Acrobacia
//     ou Inteligência, CD 15, ou 2d10 cortante), os cômodos com lareira ou fogão se enchem de fumaça venenosa (Constituição CD 10,
//     1d10) e as paredes apodrecem e soltam enxames de ratos. Resolvido aqui como o livro pede, passo a passo, sem iniciativa corrida;
//   - o grupo nunca desce: as brumas cercam a casa até a decisão, e o portão não abre.
// Rose e Thorn, se apareceram e não foram pôr em paz, tentam possuir quem sai (Carisma CD 13); quem for possuído não deixa a casa até
// o fantasma ser intimidado (Intimidação CD 11). Ao sair, o grupo avança ao 3º nível.

import { narrar } from '../view/narrativa.js';
import { casa } from './casadamorte-plantas.js';
import { makeMonster } from '../rules/monsters.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { xpParaProximo } from '../rules/progressao.js';

const FUMACA = (area, field) => {
  for (let y = area.y1; y <= area.y2; y++) for (let x = area.x1; x <= area.x2; x++) if ((!area.contem || area.contem({ x, y })) && field.surfaceAt(x, y) === 'lareiraCasa') return true;
  return false;
};

/** Os ganchos da fuga: a casa furiosa, as lâminas nas portas, a fumaça, os ratos. */
export function fugaIniciar(ctx) {
  const { salvo, enc } = ctx;
  if (ctx.variante.startsWith('casaDaMortePorao')) return;

  // As portas viram foices: cada vez que o herói termina o passo numa sala diferente da de antes, passou por uma porta, e a lâmina cobra.
  const salaDe = (c) => enc.field.sala?.get(`${c.pos.x},${c.pos.y}`) ?? null;
  const ondeEstava = {};
  for (const h of ctx.herois()) ondeEstava[h.id] = salaDe(h);
  const antes = ctx.aoMover;
  ctx.aoMover = async (c, area) => {
    if (antes) await antes(c, area);
    const agora = salaDe(c);
    const antesDele = ondeEstava[c.id];
    ondeEstava[c.id] = agora;
    if (!salvo.furia || !ctx.estado.explorando) return;
    if (antesDele && agora && antesDele !== agora) await foice(ctx, c);
    if (area && FUMACA(area, enc.field)) await fumaca(ctx, c, area);
  };

  // A casa só mostra a cara quando o grupo volta das masmorras depois de negar o sacrifício.
  const chegou = ctx.aoChegar;
  ctx.aoChegar = async (entrada) => {
    if (chegou) await chegou(entrada);
    if (salvo.fim === 'negado' && !salvo.furia) {
      salvo.furia = true;
      await ctx.painel([
        'Quando o grupo sobe a escada em espiral e põe os pés no sótão, a casa não está mais como antes. Todas as janelas viraram parede de tijolo, sem frestas, e nem arma nem magia faz um arranhão nelas. As portas desapareceram: no lugar de cada uma gira uma lâmina de foice, num vaivém de aço. Em todo cômodo onde havia lareira ou fogão, uma fumaça preta e grossa escorre das bocas e escurece o ar. E nas paredes de dentro a madeira apodreceu, esfarelando ao toque.',
        'A casa quer que eles saiam, mas não inteiros.',
      ], { titulo: 'A casa ataca' });
    }
  };
}

/** A lâmina de uma porta: correr (Acrobacia, CD 15) ou estudar o vaivém por um minuto (Inteligência, CD 15). */
async function foice(ctx, c) {
  const v = await narrar(ctx.root, {
    formato: 'tela',
    paginas: [{ titulo: 'A porta de foice', texto: [`Onde ficava a porta, uma lâmina larga de foice gira num vaivém. ${c.name} está na soleira.`] }],
    escolhas: [
      { rotulo: 'Passar correndo (Acrobacia, CD 15)', valor: 'correr', primaria: true },
      { rotulo: 'Estudar as lâminas por um minuto (Inteligência, CD 15)', valor: 'estudar' },
    ],
  });
  const t = ctx.teste(c, v === 'estudar' ? 'investigacao' : 'acrobacia', 15);
  if (t.passou) {
    await ctx.painel(v === 'estudar'
      ? `${c.name} conta o vaivém, acha o compasso e a falha: passa no intervalo, sem um arranhão.`
      : `${c.name} se joga por entre as voltas da foice e passa ileso, rolando do outro lado.`);
    return;
  }
  const dano = ctx.enc.rng.die(10) + ctx.enc.rng.die(10);
  ctx.enc.applyDamage(c, dano, 'cortante');
  await ctx.painel(`${c.name} erra o compasso. A lâmina passa rente, e ${c.name} cruza a porta mesmo assim, com ${dano} de dano cortante.`);
  ctx.app.refresh();
}

/** A fumaça preta dos cômodos com lareira ou fogão: a cada vez que o herói termina o passo lá dentro, Constituição CD 10 ou 1d10 de veneno. */
async function fumaca(ctx, c, area) {
  const r = ctx.enc.resistencia(c, 'con', 10);
  if (r.success) return;
  const dano = ctx.enc.rng.die(10);
  ctx.enc.applyDamage(c, dano, 'veneno');
  ctx.enc.say('dano', `${c.name} engole a fumaça preta e venenosa: ${dano} de dano de veneno.`);
  ctx.app.refresh();
}

// ---------------------------------------------------------------------------------------------------------------- a saída ----
async function sair(ctx, c) {
  const { salvo } = ctx;
  if (!salvo.fim) {
    await ctx.painel('A porta se abre, e a floresta lá fora desapareceu: as brumas chegam ao pórtico, grossas, e se negam a deixar passar quem quer que seja. Nada se vê além do primeiro degrau. A casa terá de ser resolvida antes: o que as criptas e a câmara de baixo guardam.');
    return;
  }
  salvo.possuidos ??= [];
  salvo.tentaramPossuir ??= {};
  // As crianças temem o abandono: quem sai sem pô-las em paz será possuído.
  if (salvo.fantasmas) {
    for (const quem of ['rose', 'thorn']) {
      if (salvo.paz?.[quem] || salvo.tentaramPossuir[quem]) continue;
      salvo.tentaramPossuir[quem] = true;
      const livres = ctx.herois().filter((h) => !salvo.possuidos.some((p) => p.heroi === h.id));
      if (!livres.length) continue;
      const alvo = ctx.enc.rng.pick(livres);
      const r = ctx.enc.resistencia(alvo, 'cha', 13);
      const nome = quem === 'rose' ? 'Rose' : 'Thorn';
      if (r.success) {
        await ctx.painel(`O ar gela em volta de ${alvo.name}, e uma mão pequenina tenta agarrar ${alvo.name} por dentro. ${alvo.name} se aguenta. O fantasma de ${nome} se encolhe, soluçando, e se solta.`);
        continue;
      }
      salvo.possuidos.push({ heroi: alvo.id, nome: alvo.name, quem });
      alvo.fraquezaCasa = quem === 'rose'
        ? 'Eu gosto de estar no comando e fico com raiva quando outras pessoas me dizem o que fazer.'
        : 'Tenho medo de tudo, inclusive da minha própria sombra, e choro de desespero quando as coisas não vêm até mim.';
      await ctx.painel(quem === 'rose'
        ? `${alvo.name} para na soleira, de corpo rígido. Os olhos se enchem de uma vontade que não é sua: Rose entrou. "Eu não quero ficar sozinha." Quem possui não deixa a casa. O jogador segue no comando, mas ${alvo.name} agora tem a teimosia e o mando de uma menina de dez anos.`
        : `${alvo.name} para na soleira e encolhe os ombros: Thorn entrou. "Não vão embora, por favor." Quem possui não deixa a casa. O jogador segue no comando, mas ${alvo.name} agora tem medo da própria sombra.`);
    }
  }
  while (salvo.possuidos.length) {
    const p = salvo.possuidos[0];
    const v = await narrar(ctx.root, {
      formato: 'tela',
      paginas: [{ titulo: 'Possuído', texto: [`${p.nome} não consegue atravessar o portão: ${p.quem === 'rose' ? 'Rose' : 'Thorn'} segura por dentro. Dá para tentar assustar o fantasma até ele largar (Carisma, Intimidação, CD 11, uma ação).`] }],
      escolhas: [{ rotulo: 'Intimidar o fantasma', valor: 'intimidar', primaria: true }, { rotulo: 'Desistir por ora', valor: 'voltar' }],
    });
    if (v !== 'intimidar') return;
    const intimidador = ctx.herois().find((h) => h.id !== p.heroi) ?? c;
    const t = ctx.teste(intimidador, 'intimidacao', 11);
    if (!t.passou) { await ctx.painel(`${intimidador.name} levanta a voz, mas o fantasma só aperta. Dá para tentar de novo.`); continue; }
    const h = ctx.herois().find((x) => x.id === p.heroi);
    if (h) delete h.fraquezaCasa;
    salvo.possuidos.shift();
    await ctx.painel(`${intimidador.name} ergue a voz com tudo o que tem, e o fantasma, assustado, solta ${p.nome} e some numa corrente de ar frio. A casa vai se encher de sussurros por muito tempo. ${p.nome} está livre.`);
  }
  await concluir(ctx);
}

async function concluir(ctx) {
  const { salvo, root, estado } = ctx;
  salvo.concluida = true;
  estado.explorando = false;
  await ctx.painel([
    salvo.fim === 'sacrificio'
      ? 'O portão se abre, e lá fora a névoa recuou. As ruas de Baróvia aparecem de novo, cinza, vazias, sob um céu sem sol. Nas costas do grupo, a Casa da Morte parece só uma casa: alta, estreita e quieta, esperando o próximo.'
      : 'O portão cede, e lá fora a névoa recua com a lentidão de um bicho que desistiu. A Casa da Morte fica para trás, de janelas emparedadas, ainda se ouvindo por um tempo, e depois nem isso.',
    'Strahd sabe que o grupo existe. É o que ele queria.',
  ], { titulo: 'As brumas recuam' });
  const grupo = ctx.herois();
  const sobem = darXp(grupo, Math.max(0, ...grupo.map((h) => xpParaProximo(h))));
  ctx.enc.say('cura', 'O grupo saiu da Casa da Morte: passa ao 3º nível.');
  if (sobem.length) for (const t of await telaDeSubirNivel(root, sobem)) ctx.enc.say('cura', t);
  estado.encerrado = true;
  const v = await narrar(root, {
    formato: 'tela',
    paginas: [{ titulo: 'Fim da Casa da Morte', texto: ['O resto da Maldição de Strahd (a aldeia de Baróvia, Vallaki, o castelo Ravenloft) ainda não foi escrito neste jogo. Por ora, a mini-aventura termina aqui.'] }],
    escolhas: [{ rotulo: 'Voltar ao menu', valor: 'menu', primaria: true }],
  });
  if (v) ctx.app.encerrarPartida();
}

let paredesQuebradas = 0;

/**
 * As paredes de dentro apodrecidas (CA 5, 5 PV): Atletismo CD 10 as derruba, e cada seção que cai solta um enxame de ratos. Vale para as
 * quatro arestas da casa em que o herói clicou; a parede de fora (a borda norte e a oeste do mapa) é imune, como o livro manda.
 */
export function fugaParedesOps(ctx, { tile, c, ops }) {
  const { salvo } = ctx;
  if (!salvo.furia || ctx.variante.startsWith('casaDaMortePorao')) return;
  const f = ctx.enc.field;
  const { x, y } = tile;
  const lados = [
    ['norte', y > 0 && f.paredeN[y * f.w + x] === 1, { x, y: y - 1 }],
    ['oeste', x > 0 && f.paredeO[y * f.w + x] === 1, { x: x - 1, y }],
    ['sul', y + 1 < f.h && f.paredeN[(y + 1) * f.w + x] === 1, { x, y: y + 1 }],
    ['leste', x + 1 < f.w && f.paredeO[y * f.w + x + 1] === 1, { x: x + 1, y }],
  ];
  const dentroDaCasa = (p) => f.sala?.has(`${p.x},${p.y}`);
  for (const [nome, existe, outro] of lados) {
    if (!existe || !dentroDaCasa(tile) || !dentroDaCasa(outro)) continue;     // a parede de fora (do lado do anel) é imune
    ops.push({
      grupo: 'A casa ataca', rotulo: `Quebrar a parede apodrecida do ${nome}`, icone: 'acao-usarObjeto', detalhe: 'Atletismo, CD 10 (CA 5, 5 PV): solta ratos',
      motivo: ctx.longe(c, tile, 10),
      fazer: async () => {
        const t = ctx.teste(c, 'atletismo', 10);
        if (!t.passou) { await ctx.painel(`${c.name} bate o ombro na madeira podre, que geme e aguenta.`); return; }
        ctx.abrirAresta(x, y, outro.x, outro.y);
        const f2 = makeMonster('enxameDeRatos', { x: outro.x, y: outro.y }, { nameSuffix: String(++paredesQuebradas) });
        const id = `ratos${x}-${y}-${nome}`;
        f2.grupo = id; f2.facingVec = { dx: 0, dy: 1 };
        const g = { id, membros: [f2], ativo: false, vencido: false, furtividade: [0] };
        ctx.grupos[id] = g;
        ctx.app.refresh();
        await ctx.combate(g, null, [`${t.quem?.name ?? c.name} derruba a parede, e do vão sai uma onda de ratos, de dentro das paredes de toda a casa, como água de uma represa. Eles não saem da casa, mas dentro dela, vêm todos.`]);
      },
    });
  }
}

export function fugaInteracoes(ctx, { area, tile, sup, c, ops }) {
  if (ctx.variante !== 'casaDaMorte1' || area?.id !== 'floresta') return;
  ops.push({
    rotulo: 'Voltar à estrada (sair da casa)', icone: 'acao-usarObjeto', detalhe: ctx.salvo.fim ? 'a névoa recuou' : 'cercado pelas brumas', motivo: null,
    fazer: async () => { await sair(ctx, c); },
  });
}
