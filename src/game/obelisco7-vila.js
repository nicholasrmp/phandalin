// O CAPÍTULO 7 DO OBELISCO NA VILA ("Fendas na Realidade", "Sombra sobre Phandalin"): a volta à vila com os três
// fragmentos, a briga com os moradores infectados no Santuário da Sorte, o Wheel-of-Fortune no escuro do Gigante
// Adormecido e as pistas de reserva que levam ao buraco do porão.
//
// O QUE É DO LIVRO (as regras; o texto é nosso):
//   - quem passou muito tempo perto dos cacos do obelisco está sendo tomado pelo Reino Distante: a Garaele, a Halia, o
//     Ander e o Wheel-of-Fortune, que trabalhava do lado da pedra no balcão;
//   - a briga do santuário vem até o grupo (`obelisco7-lugares.js`), e depois dela a Gwyn e a Greska pedem que o grupo vá
//     ver o tiferino (`obelisco5-terreo.js`, no modo do capítulo 7);
//   - o Wheel-of-Fortune, se ninguém o ataca, conta do buraco que apareceu no porão do Gigante, por onde os goblins
//     fugiram e os moradores sumidos foram levados, e da mente enorme que ele sente lá embaixo; a Gwyn liga isso a
//     Illithinoch, a velha fortaleza dos devoradores de mentes;
//   - as PISTAS DE RESERVA, para quem não fala com ele: os goblins psíquicos presos no salão do Harbin se gabam de que o
//     povo sumiu "embaixo de onde vocês bebem"; e uma fazendeira viu gente pequena entrando no porão do Gigante.
//
// DECISÃO NOSSA, dita: a briga vem na primeira visita a qualquer lugar da vila depois da chegada (como a vaca do
// capítulo 6); o livro só diz que ela acontece quando o grupo volta.
//
// O estado mora em `app.campanha.obelisco7`.

import { narrar } from '../view/narrativa.js';

/** O capítulo 7 começa quando os guardiões dos três fragmentos caíram (o marco do 9º nível, `obelisco6-marcos.js`). */
export const capitulo7Ativo = (camp) => Boolean(camp?.obelisco6?.marco9);
// (vencida a Refração de Ilvaash, o capítulo 7 continua "ativo" só para dar o epílogo na chegada: `curada`)

export function criarCapitulo7NaVila(ctx) {
  const { app, camp } = ctx;
  const o7 = (camp.obelisco7 ??= { feito: {}, lutas: {} });
  o7.feito ??= {};
  o7.lutas ??= {};
  const painel = (titulo, texto, escolhas) => narrar(app.root, { formato: 'painel', paginas: [{ titulo, texto: [].concat(texto) }], ...(escolhas ? { escolhas } : {}) });

  /** O FIM DO CAPÍTULO 8: vencida a Refração, a primeira volta à vila é o epílogo. A vila curada acaba com as cenas
   * do capítulo 7 (`cenaDoLugar` não devolve mais nada). */
  const curada = () => Boolean(camp.obelisco8?.feito?.refracaoVencida);
  async function epilogo() {
    const o8 = camp.obelisco8;
    if (o8.feito.epilogo) return;
    o8.feito.epilogo = true;
    await narrar(app.root, { formato: 'tela', paginas: [{ titulo: 'Phandalin', texto: [
      'A vila está como era. As casas que tinham entortado estão retas, as janelas no lugar, e ninguém na rua tem nada de estranho na pele ou nos olhos. Há um alívio no ar que dá para sentir, como depois de uma febre que passa.',
      'A irmã Garaele está no santuário, varrendo, e ri quando vê vocês. A Halia Thornton voltou a contar moedas e a fazer perguntas demais. Quem foi tomado pelo ritual voltou a ser quem era.',
      'A vila inteira quer ouvir a história, e ninguém mais do que a Gwyn Oresong, que quer cada detalhe do Reino Distante para os livros dela. Em Phandalin, daqui em diante, a porta de toda casa está aberta para vocês.',
    ] }] });
    ctx.registro.push('O grupo volta a Phandalin depois de destruir a Refração de Ilvaash: a vila está curada.');
    ctx.pista('Phandalin está curada: o ritual dos fanáticos acabou com o obelisco em pó e a Refração de Ilvaash destruída.');
  }

  // ------------------------------------------- o capítulo 8 na vila ("Doom Comes to Phandalin") ----
  // Aberto o portal de Illithinoch e antes de a Refração cair, quem volta acha a vila pior: os quatro tomados pelo ritual
  // trancados em casa (a Garaele, a Halia, o Ander e o Wheel-of-Fortune), a Stonehill fechada, a Gwyn com um olho a mais
  // no pescoço, e o resto do povo mudando devagar. Texto nosso.
  const capitulo8 = () => Boolean(o7.portalAberto) && !curada();
  async function ruina() {
    o7.feito.ruina = true;
    await narrar(app.root, { formato: 'tela', paginas: [{ titulo: 'A ruína chega a Phandalin', texto: [
      'Vocês sobem do porão do Gigante e a vila não é mais a mesma de poucos dias atrás. O ritual dos fanáticos, do outro lado do portal, já alcança a vila pelas fendas abertas debaixo dela.',
      'Os quatro que o obelisco tomou — a irmã Garaele, a Halia Thornton, o Ander e o Wheel-of-Fortune — estão trancados em casa, por vontade própria, para não ferir ninguém. Os amigos passam na porta para conversar, com cuidado, e é isso que os segura.',
      'O resto do povo muda também. Uma mulher na rua fala sozinha numa língua de estalos e cliques sobre "a ascensão que vem"; um menino tem um olho no lugar onde não devia ter. Todos olham para vocês do mesmo jeito: acabem com isso.',
    ] }] });
    ctx.registro.push('O grupo volta a Phandalin com o portal aberto: o ritual já alcança a vila.');
    ctx.pista('Com o portal de Illithinoch aberto, o ritual alcança Phandalin: os quatro tomados estão trancados em casa, e o povo muda devagar.');
  }

  /** O que cada lugar mostra no capítulo 8. Devolve o resultado da cena, ou null para a cena de sempre. */
  async function lugarNoCapitulo8(lugarId) {
    o7.visto8 ??= {};
    const primeira = !o7.visto8[lugarId];
    o7.visto8[lugarId] = true;
    if (lugarId === 'gigante') return descerAoBuraco();
    if (lugarId === 'estalagem') {
      const rivi = camp.obelisco6?.cripta?.feito?.rivibiddelFora;
      await painel('A Estalagem Stonehill', [
        'A porta da Stonehill está trancada, e há um aviso escrito à mão: fechado até segunda ordem. O Toblen abre só a janela. — Não dá para ter hóspede agora. Se alguém aqui dentro perder a cabeça, quem paga são os outros. O galpão da Qelline ainda recebe quem precisa dormir.',
        ...(primeira ? [
          'A Gwyn Oresong aparece na porta dos fundos, de cachecol enrolado até o queixo. Quando ela o afrouxa, vocês veem: no pescoço, um olho com duas íris, que pisca fora do tempo dos outros dois. — Não sei de mais nada que ajude. Só acabem com isso logo. Por favor.',
          ...(rivi ? ['— O Rivibiddel está desesperado — diz ela, já fechando a porta. — Jura que o livro que ele tirou da cripta mudou de texto e agora só fala de confusão e de caos. O livro não mudou. Ele é que lê errado, e não consegue parar.'] : []),
        ] : []),
      ]);
      return 'fechado';
    }
    if (lugarId === 'santuario' && primeira) {
      await painel('O Santuário da Sorte', 'A porta do santuário está trancada por dentro. Do outro lado, a voz da irmã Garaele reza rápido, sem parar, para a Senhora da Sorte — e às vezes a reza escorrega para uma língua que não é de gente. — Não entrem — diz ela. — Ainda sou eu. Acabem com aquilo, e eu abro.');
      return 'fechado';
    }
    if (lugarId === 'cambio' && primeira) {
      await painel('O Câmbio de Minério', 'O Câmbio está fechado, as janelas cobertas de tábua. Por uma fresta, a Halia Thornton fala sem abrir: — Contem tudo o que acharam lá embaixo. Depois. Agora vão.');
      return 'fechado';
    }
    if (lugarId === 'barthen' && primeira) {
      await painel('Barthen Provisões', 'O Elmar Barthen atende de olho na escada. — O Ander está lá em cima, trancado. Pediu para ficar. De noite ele bate na parede no ritmo de alguma coisa que não é música. A loja está aberta: alguém tem de vender corda e comida para quem vai descer.');
      return null;
    }
    return null;
  }

  async function chegada() {
    if (curada()) return epilogo();
    if (capitulo8() && !o7.feito.ruina) return ruina();
    if (o7.iniciado) return;
    o7.iniciado = true;
    await narrar(app.root, { formato: 'tela', paginas: [{ titulo: 'Sombra sobre Phandalin', texto: [
      'Os três fragmentos pesam nas mochilas, e o que vocês sabem pesa mais: os fanáticos não querem só o obelisco. Querem fazer da vila inteira um ninho de devoradores de mentes, e Phandalin é a primeira da fila.',
      'A vila parece a mesma de sempre. Fumaça de chaminé, um cachorro latindo, a Stonehill cheia. Mas há gente demais na rua para a hora, falando baixo, olhando para o lado do Santuário da Sorte.',
    ] }] });
    ctx.registro.push('O grupo volta a Phandalin com os três fragmentos e a notícia do ritual dos fanáticos.');
  }

  // a briga do santuário: vem até o grupo, no primeiro lugar que ele visita
  async function briga() {
    await painel('A rua', 'Um grito do lado do Santuário da Sorte, e depois outro. Gente correndo na direção contrária.', [
      { rotulo: 'Ir ver', valor: 'ir', primaria: true },
    ]);
    return { descer: 'santuarioInfectado' };
  }

  // ------------------------------------------------- as pistas de reserva ----
  async function fazendeira() {
    o7.feito.fazendeira = true;
    await painel('A Estalagem Stonehill', [
      'O Toblen baixa a voz. — A viúva Tarvel, aquela que mora sozinha depois da ponte, veio aqui ontem jurando que viu "gente pequena" entrando pelo alçapão do porão do Gigante Adormecido, dias atrás, de madrugada. Ninguém acreditou. Ela também jura que conversa com os gansos.',
    ]);
    ctx.pista('Uma fazendeira viu "gente pequena" entrando de madrugada pelo alçapão do porão do Gigante Adormecido, dias atrás.');
    return 'sai';
  }

  async function goblinsPresos() {
    o7.feito.goblinsInterrogados = true;
    await painel('O Salão do Chefe da Vila', [
      'Nas celas do salão, os goblins psíquicos que vocês pegaram antes estão gordos de pão de graça e cheios de si. Quando vocês chegam perto da grade, o mais magro cospe no chão.',
      '— Vocês não acham ninguém. Ninguém! O povo de vocês foi para baixo. Bem embaixo de onde vocês bebem. — E os outros riem até o Harbin bater na grade com a bengala.',
    ]);
    ctx.pista('Os goblins presos no salão do Harbin se gabam: os moradores sumidos foram levados "para baixo, bem embaixo de onde vocês bebem".');
    return 'sai';
  }

  async function descerAoBuraco() {
    const r = await painel('O Gigante Adormecido', [
      'A Greska deixou o alçapão do porão aberto e uma lanterna pendurada na escada. Lá embaixo, o buraco de beiradas derretidas desce em espiral para o escuro.',
      o7.resgatados?.length ? 'O Oskar, a Cathlette e a Aida estão numa mesa do canto, de cobertor nos ombros; o Oskar levanta o caneco para vocês.' : null,
    ].filter(Boolean), [
      { rotulo: 'Descer pelo buraco', valor: 'descer', primaria: true },
      { rotulo: 'Agora não', valor: 'nao' },
    ]);
    return r === 'descer' ? { descer: 'tunelGrells' } : 'sai';
  }

  // --------------------------------------------------- a cena de cada lugar ----
  async function cenaDoLugar(lugarId) {
    if (!o7.iniciado || curada()) return null;
    if (capitulo8()) return lugarNoCapitulo8(lugarId);
    if (!o7.lutas.santuario) return briga();
    if (lugarId === 'gigante' && !o7.feito.wheelOuvido) return { descer: 'giganteTerreo' };
    // ouvido o tiferino, o porão do Gigante leva ao túnel (`tunel-cap7.js`)
    if (lugarId === 'gigante') return descerAoBuraco();
    if (o7.feito.wheelOuvido) return null;
    if (lugarId === 'estalagem' && !o7.feito.fazendeira) return fazendeira();
    if (lugarId === 'salao' && !o7.feito.goblinsInterrogados && (camp.obelisco5?.feito?.goblinsPresos ?? 0) > 0) return goblinsPresos();
    return null;
  }

  return { chegada, cenaDoLugar, estado: o7 };
}
