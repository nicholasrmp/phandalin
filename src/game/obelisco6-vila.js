// O CAPÍTULO 6 DO OBELISCO NA VILA ("The Shattered Obelisk"): a volta a Phandalin depois do Repouso de Zorzula, a Gwyn
// Oresong na Estalagem Stonehill, e as três missões curtas antes de partir atrás dos fragmentos.
//
// O QUE É DO LIVRO (as regras; o texto é nosso):
//   - a GWYN paga a refeição e traduz o mapa dos goblins: "Talhund" quer dizer presentes escondidos e vem dos sacerdotes
//     de Dumathoin; a cripta teria um selo que só os fiéis abrem; a Encruzilhada da Forca era entreposto de três povos;
//     os devoradores de mente arrasaram os três lugares há séculos. Ela recomenda começar por Talhundereth;
//   - a AVENTURA DE PIP (o gancho é da Trilena Stonehill): Pip seguiu três criaturinhas até uma ruína anã a sudeste.
//     Acha-se o rastro com Sobrevivência CD 14, ou pela palavra do Carp Alderleaf. A recompensa: estadia e comida na
//     Stonehill enquanto o grupo estiver na região, e a casa de Marthungrim como base;
//   - a VACA ESTRANHA: a Daisy entra cambaleando no largo antes de o grupo chegar ao pomar do Edermath (o evento vem até o
//     grupo: aqui, na primeira volta pela vila depois da Gwyn);
//   - os MINEIROS SUMIDOS (a Halia, na Bolsa dos Mineiros): a Mina Hardyhammer, 24 km a sudoeste, no mapa da região. A
//     parte do veio de prata é paga na Bolsa: 250 po por mês, durante um ano.
//
// O estado mora em `app.campanha.obelisco6`.

import { narrar } from '../view/narrativa.js';
import { skillBonus, SKILL_NAME, rolarPericia } from '../rules/abilities.js';
import { pagarCada } from './comercio.js';

/** O capítulo 6 começa quando o Harbin paga o resto do contrato (o fim do capítulo 5). */
export const capitulo6Ativo = (camp) => Boolean(camp?.obelisco5?.feito?.pagoFim);

/** A RENDA do veio de prata: 250 po por mês (30 dias de jogo), por doze meses. Devolve quanto paga agora. */
export function rendaDevida(renda, dia) {
  if (!renda) return 0;
  const meses = Math.min(12, Math.floor(((dia ?? 1) - renda.desde) / 30));
  return Math.max(0, meses - (renda.pagos ?? 0));
}

export function criarCapitulo6NaVila(ctx) {
  const { app, camp, vivos, rng } = ctx;
  const v = ctx.v ?? camp.vila;
  const o6 = (camp.obelisco6 ??= { feito: {}, lutas: {} });
  o6.feito ??= {};
  o6.lutas ??= {};
  const painel = (titulo, texto, escolhas) => narrar(app.root, { formato: 'painel', paginas: [{ titulo, texto: [].concat(texto) }], ...(escolhas ? { escolhas } : {}) });
  const melhor = (pericia) => vivos().reduce((a, b) => (skillBonus(b, pericia) > skillBonus(a, pericia) ? b : a));

  // ------------------------------------------------------------ a chegada ----
  async function chegada() {
    if (o6.iniciado) return;
    o6.iniciado = true;
    await narrar(app.root, { formato: 'tela', paginas: [{ titulo: 'Phandalin, de volta', texto: [
      'Na manhã seguinte, um menino da Stonehill bate à porta: a Gwyn Oresong quer vocês na estalagem, e paga o café.',
      'A anã espalha o mapa dos goblins na mesa, entre pão e cerveja, e passa o dedo pelos nomes. — Talhundereth. "Presentes escondidos", na língua velha: coisa dos sacerdotes de Dumathoin. Diz a lenda que a cripta deles tem um selo que só os fiéis abrem.',
      '— Encruzilhada da Forca: um entreposto onde drow, duergar e gnomos das profundezas negociavam, debaixo da terra. E os três lugares foram arrasados ao mesmo tempo, há séculos, por devoradores de mente. — Ela bate no primeiro nome. — Eu começaria por Talhundereth. É o que eu conheço melhor.',
      'Na porta da cozinha, a Trilena Stonehill torce o avental. O filho dela, Pip, saiu para brincar nos campos de manhã cedo e não voltou.',
    ] }] });
    ctx.missao('fragmentos');
    ctx.missao('pip');
    ctx.missao('mineiros');
    ctx.registro.push('A Gwyn traduz o mapa dos goblins: Talhundereth, a Cripta dos Talhund e a Encruzilhada da Forca.');
    ctx.pista('Os três fragmentos que faltam do obelisco: em Talhundereth, na Cripta dos Talhund (debaixo de Talhundereth) e na Encruzilhada da Forca, nas colinas de Starmetal. A Gwyn recomenda começar por Talhundereth.');
  }

  // ---------------------------------------------------- a aventura de Pip ----
  async function procurarPip() {
    if (o6.feito.pipAchado) return { descer: 'casaMarthungrim' };
    const r = await painel('A aventura de Pip', 'A Trilena aponta os campos a sudeste. — Ele vive indo para lá com o Carp, o filho dos Alderleaf.', [
      { rotulo: 'Seguir o rastro nos campos (Sobrevivência, CD 14)', valor: 'rastro', primaria: true },
      { rotulo: 'Perguntar ao Carp, na fazenda Alderleaf', valor: 'carp' },
      { rotulo: 'Agora não', valor: 'nao' },
    ]);
    if (r === 'nao') return null;
    if (r === 'rastro') {
      const quem = melhor('sobrevivencia');
      const t = rolarPericia(rng, quem, 'sobrevivencia');
      if (t.total < 14) {
        await painel('A aventura de Pip', `${quem.name} (${SKILL_NAME.sobrevivencia} ${t.total}) acha pegadas de menino demais, para todo lado. Melhor perguntar ao Carp.`);
        return null;
      }
      await painel('A aventura de Pip', `${quem.name} (${SKILL_NAME.sobrevivencia} ${t.total}) acha as pegadas de um menino, e na frente delas outras, pequenas e finas, de três bichos de pernas de aranha.`);
    } else {
      await painel('A aventura de Pip', 'O Carp não pode sair da fazenda — está de castigo —, mas aponta com o braço inteiro: — Ele foi atrás dos bichinhos de cabeça mole! Para lá! Eu falei que era perigoso!');
    }
    o6.feito.pipAchado = true;
    await painel('A aventura de Pip', [
      'Uns três quilômetros adiante, atrás de um pedregulho, um menino de dez anos, sujo até as orelhas, vigia um buraco no chão.',
      '— Vocês vieram! — cochicha Pip, com os olhos brilhando. — Eu segui eles desde o riacho. Três. Caíram aí dentro e não conseguem sair. Eu ia pegar um. Mas aí eles fizeram um barulho com a cabeça.',
    ]);
    return { descer: 'casaMarthungrim' };
  }

  async function voltaDoPip() {
    o6.feito.pipRecompensa = true;
    v.feito ??= {};
    v.feito.estalagemGratis = true;
    ctx.concluir?.('pip');
    await painel('A Estalagem Stonehill', [
      'A Trilena agarra o Pip pela orelha e pelo pescoço ao mesmo tempo, e depois só o abraça. O Toblen limpa os olhos no avental e diz que é a fumaça da cozinha.',
      '— Enquanto estiverem por aqui, comida e cama são da casa. E aquele buraco… — ele olha para o Pip — vocês fiquem com ele. Ninguém da família vai querer ir lá de novo.',
    ]);
    ctx.registro.push('A Stonehill dá cama e comida de graça ao grupo enquanto ele estiver na região, e a casa de Marthungrim vira a base de vocês.');
  }

  // ------------------------------------------------------------- a vaca ----
  async function vaca() {
    o6.feito.vacaVista = true;
    await painel('O largo', 'Lá fora, um mugido esganiçado e gente correndo. Alguém grita que a vaca do Velho Narth enlouqueceu.', [
      { rotulo: 'Ir ver', valor: 'ir', primaria: true },
    ]);
    return { descer: 'largoDaVaca' };
  }

  // ----------------------------------------------------- os mineiros sumidos ----
  async function halia() {
    if (o6.feito.mineirosContados) {
      const devido = rendaDevida(o6.renda, v.dia);
      if (devido > 0) {
        o6.renda.pagos += devido;
        pagarCada(vivos(), Math.floor((250 * devido) / Math.max(1, vivos().length)));
        await painel('A Bolsa dos Mineiros', `A Halia conta as moedas do veio de prata da Hardyhammer: ${250 * devido} po, ${devido > 1 ? `${devido} meses` : 'um mês'}, divididos entre vocês. — Os Kreeve mandam lembranças.`);
        ctx.registro.push(`A parte do veio de prata: ${250 * devido} po.`);
        return 'sai';
      }
      if (o6.lutas.mina && !o6.feito.mineirosEntregues) {
        o6.feito.mineirosEntregues = true;
        ctx.concluir?.('mineiros');
        await painel('A Bolsa dos Mineiros', '— Os quatro voltaram. Bom. — A Halia anota alguma coisa num livro. — A prata do veio passa por aqui, todo mês. Venham buscar a parte de vocês.');
        return 'sai';
      }
      return null;
    }
    o6.feito.mineirosContados = true;
    await painel('A Bolsa dos Mineiros', [
      'A Halia Thornton fecha a porta antes de falar. — Mandei quatro mineiros procurar outra Onda Eco, a sudoeste, nas Montanhas da Espada. Só um voltou: o Verno Tharbun. Diz que um arbusto que anda atraiu o velho Wallin Kreeve para dentro de uma caverna; a filha dele e o anão, o Karthim, foram atrás. Ele fugiu e acha que estão mortos.',
      '— Quero ter certeza. — Ela marca o mapa. — Pelas indicações dele, é a Mina Hardyhammer: uma mina velha cujo dono morreu sem herdeiro.',
    ]);
    o6.feito.sabeHardyhammer = true;
    ctx.registro.push('A Mina Hardyhammer aparece no mapa da região, a sudoeste.');
    return 'sai';
  }

  // --------------------------------------------------- a cena de cada lugar ----
  async function cenaDoLugar(lugarId) {
    if (!o6.iniciado) return null;
    // a VACA vem até o grupo, na primeira volta pela vila depois da Gwyn
    if (!o6.feito.vacaVista && !o6.lutas.vaca) return vaca();
    if (lugarId === 'estalagem') {
      if (o6.lutas.casa && !o6.feito.pipRecompensa) { await voltaDoPip(); return 'sai'; }
      if (!o6.lutas.casa) return procurarPip();
    }
    if (lugarId === 'cambio') return halia();
    return null;
  }

  return { chegada, cenaDoLugar, estado: o6 };
}
