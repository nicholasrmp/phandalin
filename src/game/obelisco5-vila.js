// O CAPÍTULO 5 DO OBELISCO NA VILA ("Caminhos de Perigo", primeira metade): a volta da Onda Eco e Phandalin
// revirada por goblins. O de-para sala a sala está em `_referencias/obelisco58/cap5.md`; o plano, em
// `revisoes/obelisco-5a8-plano-2026-11-08.md`.
//
// O QUE É DO LIVRO (as regras e os números; o texto é nosso):
//   - ao voltar, uma multidão na porta do Harbin; quem tem Percepção passiva 13 ouve as cinco queixas;
//   - o Harbin contrata o grupo: 50 po por cabeça agora e 150 no fim; Intimidação ou Persuasão CD 11 dobra (100/300);
//   - quatro cenas de crime, em qualquer ordem, cada uma onde os goblins arrancaram uma lasca de pedra negra:
//       o poço atrás da Barthen (Ander), a pedra fundamental do Câmbio (Halia: teste de grupo, 2 sucessos de Força
//       ou Destreza CD 12), o arco do Santuário da Sorte (teste de grupo, 3 sucessos de CD 15, cada falha 1d4) e o
//       balcão do Gigante Adormecido (a Greska e o Wheel-of-Fortune; o salão é tabuleiro, `obelisco5-terreo.js`);
//   - quatro pistas (o sítio duergar, o pedaço do nome, o propósito, o nome do chefe); a Gwyn Oresong aparece depois
//     da primeira cena e as junta. Com as quatro, ela acha o posto; com menos, História CD 15 de quem a ajuda;
//   - o MARCO do 6º nível quando o grupo descobre onde fica o Repouso de Zorzula;
//   - depois de cada cena, um d20 na tabela de travessuras (1 a 10, alguma coisa na vila).
//
// AS TRÊS LUTAS PEQUENAS (`obelisco5-lutas.js`, sobre os mapas da FA) saem daqui: descer o poço da Barthen (o
// otyugh), ir ao acampamento ao sul que a Halia aponta (os goblins feridos, e a pista do nome do chefe), e subir ao
// telhado do Gigante (o comandante e o saco de moedas). Cada uma uma vez.
//
// O QUE AINDA NÃO ESTÁ AQUI: as travessuras que viram luta. A travessura que traria goblins se resolve em cena, com
// o grupo espantando-os.
//
// O estado mora em `app.campanha.obelisco5`.

import { narrar } from '../view/narrativa.js';
import { skillBonus, SKILL_NAME, rolarPericia } from '../rules/abilities.js';
import { XP_POR_NIVEL } from '../rules/progressao.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { guardar, pagarCada } from './comercio.js';
import { passivePerception } from '../rules/abilities.js';

const TITULO_DA_LUTA = { poco: 'O poço da Barthen', acampamento: 'O acampamento ao sul', telhado: 'O telhado do Gigante' };

/** As quatro pistas do livro, e o que cada uma diz. */
export const PISTAS_DO_CAP5 = {
  duergar: 'Os goblins vêm de um lugar duergar: as runas do machado cravado perto do Santuário são de anões cinzentos.',
  nome: 'O esconderijo dos goblins tem nome: algo como "Zorz", e eles o chamam de "o Repouso".',
  proposito: 'Os goblins não roubam: caçam lascas de uma pedra negra e estranha, embutidas há anos nas obras da vila.',
  chefe: 'Os goblins obedecem a um chefe chamado Ruxithid.',
};

/** O capítulo 5 começa quando a Mina Perdida foi achada (o epílogo da Onda Eco). */
export const capitulo5Ativo = (camp) => Boolean(camp?.aventuraConcluida);

/** O MARCO: cada herói sobe até o piso do nível do marco (o XP das lutas continua valendo entre um marco e outro). */
export function darMarco(herois, nivel) {
  const sobem = [];
  for (const c of herois.filter((h) => !h.dead)) {
    const falta = (XP_POR_NIVEL[nivel] ?? 0) - (c.xp ?? 0);
    if (falta > 0) sobem.push(...darXp([c], falta));
  }
  return sobem;
}

/**
 * Monta o capítulo para a vila. `ctx`: { app, camp, v, vivos, rng, registro, missao, pista, falar }.
 * Devolve as três portas que `phandalin.js` chama: a chegada, a cena do lugar e o fim de cada cena.
 */
export function criarCapitulo5NaVila(ctx) {
  const { app, camp, vivos, rng } = ctx;
  const o5 = (camp.obelisco5 ??= { iniciado: false, cenas: {}, pistas: [], feito: {} });
  const painel = (titulo, texto, escolhas) => narrar(app.root, { formato: 'painel', paginas: [{ titulo, texto: [].concat(texto) }], ...(escolhas ? { escolhas } : {}) });
  const melhor = (pericia) => vivos().reduce((a, b) => (skillBonus(b, pericia) > skillBonus(a, pericia) ? b : a));
  const teste = (pericia, cd, quem = melhor(pericia)) => {
    const r = rolarPericia(rng, quem, pericia);
    return { quem, total: r.total, cd, passou: r.total >= cd, texto: `${quem.name}, ${SKILL_NAME[pericia]} ${r.total} contra CD ${cd}` };
  };
  const ganharPista = (id) => {
    if (o5.pistas.includes(id)) return;
    o5.pistas.push(id);
    ctx.pista(PISTAS_DO_CAP5[id]);
    ctx.registro.push(`Pista: ${PISTAS_DO_CAP5[id]}`);
  };
  const pessoa = (id, name) => ({ id, name, look: null });

  /**
   * TESTE DE GRUPO com contagem (o livro: cada herói que ajuda faz UM teste; precisa de `sucessos`). Cada herói usa a
   * melhor das perícias permitidas. `aoFalhar(herói)` paga a falha (o santuário: 1d4 em quem errou).
   */
  function testeDeGrupo(pericias, cd, sucessos, aoFalhar = null) {
    const linhas = [];
    let ok = 0;
    for (const h of vivos()) {
      const p = pericias.reduce((a, b) => (skillBonus(h, b) > skillBonus(h, a) ? b : a));
      const r = rolarPericia(rng, h, p);
      const passou = r.total >= cd;
      if (passou) ok += 1;
      linhas.push(`${h.name} (${SKILL_NAME[p] ?? p} ${r.total}): ${passou ? 'consegue' : 'não consegue'}${!passou && aoFalhar ? aoFalhar(h) : ''}.`);
    }
    return { passou: ok >= sucessos, ok, linhas };
  }

  // ------------------------------------------------------------ a chegada ----
  async function chegada() {
    // A VOLTA COM OS REFÉNS (o fim do capítulo 5): o Harbin paga o resto do contrato, a cada um.
    if (o5.iniciado && o5.zorzula?.refensSalvos && !o5.feito.pagoFim) {
      o5.feito.pagoFim = true;
      const fim = o5.pagamento?.fim ?? 150;
      await narrar(app.root, { formato: 'tela', paginas: [{ titulo: 'Phandalin, de volta', texto: [
        'Os três reféns entram na vila apoiados em vocês. Alguém grita um nome, outro corre, e em pouco tempo meia Phandalin está na rua.',
        'O Harbin abraça o Dareth com força demais e depois, envergonhado, conta as moedas duas vezes. — O combinado. Cada centavo. — Ele hesita. — E… obrigado.',
        'No meio da festa, o homem do retrato da mulher orc procura o rosto dela entre os três. Não está. Ele não diz nada, e volta para casa.',
        ...(o5.zorzula.pazSawplee ? ['Quando a notícia da trégua com os goblins corre, a festa azeda um pouco. — Deixaram eles VIVOS? — reclama a Qelline, e o Toblen concorda. O Harbin, que só quer paz, encerra a conversa: — Se não voltarem aqui, para mim está bom.'] : []),
      ] }] });
      if (o5.zorzula.pazSawplee) ctx.registro.push('A vila não gosta, mas aceita a trégua com os Sawplee.');
      pagarCada(vivos(), fim);
      ctx.registro.push(`O Harbin paga ${fim} po a cada um: o resto do contrato.`);
      ctx.concluir?.('sawplee');
      ctx.concluir?.('zorzula');
      return;
    }
    if (o5.iniciado) return;
    o5.iniciado = true;
    const ouve = vivos().some((h) => passivePerception(h) >= 13);
    await narrar(app.root, { formato: 'tela', paginas: [{ titulo: 'Phandalin, de volta', texto: [
      'A vila que vocês deixaram ao partir para a mina não é a mesma. Há vidro quebrado na rua, uma cerca derrubada, tinta escorrida numa parede. E há gente demais na porta do Salão do Chefe da Vila, falando todos ao mesmo tempo.',
      ouve ? 'No meio do barulho dá para separar as queixas: alguém quebrou o balcão do Gigante Adormecido; a pedra do Câmbio cedeu e há mineiros que não voltaram para casa; o padeiro não aguenta mais "os diabinhos"; uma mãe proíbe os filhos de sair depois do pôr do sol; e um homem mostra a todos o retrato de uma orc, a mulher dele, desaparecida.' : 'É barulho demais para entender quem reclama do quê, mas a raiva é de todo mundo.',
      'Harbin Wester abre a porta, pálido, vê vocês e respira fundo pela primeira vez em dias.',
    ] }] });
    const fim = await ctx.falar('harbin', {
      inicio: 'oi',
      nos: {
        oi: {
          fala: ['Graças aos deuses. Goblins! Na minha vila! Quebram, roubam, somem com gente. Eu tentei resolver sozinho, juro que tentei.',
            'Quatro lugares foram atacados: o poço atrás da Barthen, a pedra fundamental do Câmbio, o arco do santuário de Tymora e o balcão do Gigante Adormecido. Descubram quem está fazendo isso e acabem com essa história. Pago cinquenta peças de ouro a cada um agora, e cento e cinquenta quando acabar.'],
          opcoes: [
            { texto: 'Por esse preço, não. A vila inteira está olhando para você, Harbin.', teste: { pericia: 'intimidacao', cd: 11 }, sucesso: 'dobra', falha: 'aceita' },
            { texto: 'É muito trabalho, e você sabe que precisa de nós. Pague o justo.', teste: { pericia: 'persuasao', cd: 11 }, sucesso: 'dobra', falha: 'aceita' },
            { texto: 'Fechado.', vai: 'aceita' },
          ],
        },
        dobra: { fala: 'Está bem, está bem! O dobro: cem agora e trezentas no fim. Só façam isso parar.', opcoes: [{ texto: 'Fechado.', fim: 'dobro' }] },
        aceita: { fala: 'Combinado, então. E se pegarem algum desses goblins vivo, as celas do salão estão vazias.', opcoes: [{ texto: 'Vamos começar.', fim: 'simples' }] },
      },
    });
    o5.pagamento = fim === 'dobro' ? { agora: 100, fim: 300 } : { agora: 50, fim: 150 };
    pagarCada(vivos(), o5.pagamento.agora);
    ctx.registro.push(`O Harbin paga ${o5.pagamento.agora} po a cada um, e promete ${o5.pagamento.fim} no fim.`);
    ctx.missao('sawplee');
  }

  // ------------------------------------------------------ as quatro cenas ----
  const CENAS = {
    // C1: o poço atrás da Barthen. A lasca era o tambor do sarilho.
    async barthen() {
      const ouveRosnado = vivos().some((h) => passivePerception(h) >= 15);
      await painel('O poço da Barthen', [
        'Atrás da loja, o sarilho do poço está desmontado: falta o tambor, a peça de pedra escura em que a corda enrolava. Lá embaixo, onde devia haver água, há só pedra seca.',
        ouveRosnado ? 'Do fundo sobe um som molhado, um rosnado que borbulha.' : null,
      ].filter(Boolean));
      if (ouveRosnado) {
        const r = teste('natureza', 17);
        if (r.passou) ctx.registro.push(`${r.texto}: o que rosna lá embaixo é um bicho irritado, grande, que come lixo.`);
      }
      const inv = teste('investigacao', 15);
      if (inv.passou) ctx.registro.push(`${inv.texto}: o mecanismo dá para remontar, mas a peça do meio foi levada inteira.`);
      await ctx.falar('ander', {
        inicio: 'oi',
        nos: {
          oi: {
            narra: 'No balcão da Barthen, um halfling adolescente arruma a mesma prateleira pela terceira vez. Quando vê vocês, larga tudo.',
            fala: 'Eu vi! Eram um pouco maiores que eu, orelhas compridas, chatas, cabeça grande, e as mãos brilhavam. Chegaram no pôr do sol e foram direto ao poço, nem olharam o estoque. Quando gritei, pularam lá dentro, e um berrou para os outros voltarem "para o Repouso". Depois o poço secou.',
            ao: () => ganharPista('nome'),
            opcoes: [
              { texto: 'Você não parece triste com o poço seco, Ander.', teste: { pericia: 'persuasao', cd: 13 }, sucesso: 'pesadelos', falha: 'nega', uma: true },
              { texto: 'Obrigado. Vamos ver o que fazer.', fim: 'sai' },
            ],
          },
          pesadelos: {
            fala: 'Não conta para o senhor Barthen. Toda vez que eu tirava água daquele poço, eu tinha pesadelos horríveis na noite seguinte. Acho que o poço era amaldiçoado. Desde que levaram aquela pedra, eu durmo.',
            ao: () => ganharPista('proposito'),
            opcoes: [{ texto: 'Entendi.', fim: 'sai' }],
          },
          nega: { fala: 'Triste? Claro que estou. O senhor Barthen precisa de água. — Ele não olha para vocês.', opcoes: [{ texto: 'Certo.', fim: 'sai' }] },
        },
      }, pessoa('ander', 'Ander'));
      return 'sai';
    },

    // C2: o Câmbio. A lasca era a pedra fundamental; o prédio tombou.
    async cambio() {
      await painel('O Câmbio de Minério', [
        'O prédio do Câmbio pende para um lado, escorado por vigas improvisadas. No canto onde ficava a pedra fundamental há um buraco do tamanho de uma cabeça, e as ferramentas que fizeram o buraco estão jogadas ali mesmo: são do próprio Câmbio.',
        'Halia Thornton grita ordens a três mineiros que seguram uma viga. — Se vieram falar, ajudem a segurar isto primeiro.',
      ]);
      if (o5.feito.cambioRecusado === ctx.v.dia) {
        await painel('O Câmbio de Minério', 'Halia nem olha para vocês. — Hoje não. Voltem quando o prédio parar de cair.');
        return 'sai';
      }
      const g = testeDeGrupo(['atletismo', 'acrobacia'], 12, 2);
      if (!g.passou) {
        o5.feito.cambioRecusado = ctx.v.dia;
        await painel('O Câmbio de Minério', [...g.linhas, 'A viga escorrega, os mineiros xingam, e Halia manda vocês embora até eles terminarem sozinhos. Amanhã ela fala.']);
        return 'sai';
      }
      await painel('O Câmbio de Minério', [...g.linhas, 'O prédio assenta com um estalo e para de ranger. Halia limpa as mãos na saia.']);
      await ctx.falar('halia', {
        inicio: 'oi',
        nos: {
          oi: {
            fala: ['Eu estava sozinha, no fim da tarde; o resto bebia no Gigante. Briguei com eles, e um me empurrou para trás sem encostar em mim, com uma força que eu não vi. Feri alguns, sei disso; não podem ter ido longe.',
              'Por que a pedra? Não sei. Era a nossa pedra da sorte, preta e lisa, embutida desde que o Câmbio foi erguido. Levaram só ela. Fugiram para a mata ao sul.'],
            ao: () => ganharPista('proposito'),
            opcoes: [{ texto: 'Obrigado, Halia.', fim: 'sai' }],
          },
        },
      });
      o5.feito.acampamentoSabido = true;
      ctx.registro.push('A Halia aponta a mata ao sul: os goblins feridos não devem ter ido longe.');
      return 'sai';
    },

    // C3: o Santuário da Sorte. A lasca era a pedra-chave do arco; o arco caiu.
    async santuario() {
      await painel('O Santuário da Sorte', [
        'O arco do santuário de Tymora está no chão, num monte de pedra. A Irmã Garaele, ainda com poeira da estrada, diz que voltou de viagem horas depois de tudo e não viu nada: quem viu foram Trilena Stonehill e a filha, Tamara.',
        'Tamara, de dez anos, separa as pedras sozinha, muito séria. A mãe foi buscar água e comida na estalagem.',
        'Perto dali há uma picareta de mineiro partida, pegadas pequenas e apressadas descendo um beco, e um machado cravado na parede da casa vizinha.',
      ]);
      const machado = teste('historia', 17);
      if (machado.passou) {
        ganharPista('duergar');
        ctx.registro.push(`${machado.texto}: as runas do machado são de duergar, os anões cinzentos do subterrâneo.`);
      } else {
        o5.feito.machadoVisto = true;
      }
      const reconstruir = await painel('O Santuário da Sorte', 'Dá para ajudar a reerguer o arco: é trabalho de jeito, de equilíbrio e de quem conhece o rito.', [
        { rotulo: 'Ajudar a reerguer o arco', valor: 'sim', primaria: true }, { rotulo: 'Só conversar', valor: 'nao' },
      ]);
      if (reconstruir === 'sim') {
        const g = testeDeGrupo(['sobrevivencia', 'religiao', 'acrobacia'], 15, 3, (h) => {
          const d = rng.die(4);
          h.hp = Math.max(0, h.hp - d);
          return ` e leva ${d} de pedra na cabeça`;
        });
        await painel('O Santuário da Sorte', [...g.linhas, g.passou
          ? 'O arco volta a ficar de pé, um pouco torto. Garaele traça o sinal de Tymora sobre ele.'
          : 'Não deu desta vez: as pedras caem de novo, e alguém se machucou.']);
        if (g.passou) o5.feito.arcoDePe = true;
      }
      await ctx.falar('tamara', {
        inicio: 'oi',
        nos: {
          oi: {
            fala: o5.feito.arcoDePe ? 'Obrigada! A mãe vai gostar. O que querem saber?' : 'Estou ocupada. — Ela não larga a pedra que segura.',
            opcoes: [
              { texto: 'O que você viu, Tamara?', vai: 'conta', requer: () => (o5.feito.arcoDePe ? null : 'ela está ocupada demais'), oculta: false },
              { texto: 'Você pode parar um instante e nos contar o que viu?', teste: { pericia: 'persuasao', cd: 14 }, sucesso: 'conta', falha: 'ocupada', uma: true },
              { texto: 'Até logo.', fim: 'sai' },
            ],
          },
          conta: {
            fala: 'Viemos de manhãzinha trazer a oferenda da semana e vimos o arco ceder. Três sombras baixinhas fugiram rindo, falando fino numa língua que eu não conheço. Alguém tirou a pedra do meio do arco e não pôs outra no lugar. Era preta e brilhava.',
            opcoes: [{ texto: 'Obrigado.', fim: 'sai' }],
          },
          ocupada: { fala: 'Depois. — E continua separando as pedras.', opcoes: [{ texto: 'Certo.', fim: 'sai' }] },
        },
      }, pessoa('tamara', 'Tamara Stonehill'));
      return 'sai';
    },

    // C4: o Gigante Adormecido. A lasca era a "pedra do gigante" do balcão.
    async gigante() {
      // O SALÃO é tabuleiro (`obelisco5-terreo.js`): o balcão, a cozinha, a lareira e as conversas ficam lá. Aqui é só
      // a porta, e a cena acaba oferecendo entrar (`oferecerLuta`).
      await painel('O Gigante Adormecido', [
        'A porta do Gigante Adormecido está escorada com uma cadeira quebrada. Lá dentro, barulho de vassoura e de cacos sendo juntados.',
      ]);
      return 'sai';
    },

  };

  /**
   * AS LUTAS QUE SAEM DE CADA CENA (o livro): o poço se desce de corda; o acampamento fica a uma hora ao sul, pela
   * indicação da Halia; o telhado do Gigante, pela chaminé — ou, se ninguém achou a trilha de moedas, quando o grupo
   * já ia saindo e ouve passos lá em cima. `null` = nada a lutar agora.
   */
  const LUTA_DO_LUGAR = {
    barthen: { luta: 'poco', variante: 'cavernaDoPoco', rotulo: 'Descer o poço (Atletismo CD 10)', pode: () => true },
    cambio: { luta: 'acampamento', variante: 'acampamentoSawplee', rotulo: 'Ir ao acampamento ao sul (1 hora)', pode: () => o5.feito.acampamentoSabido },
    // o Gigante abre o TÉRREO, um tabuleiro de exploração (`obelisco5-terreo.js`); a chaminé de lá sobe ao telhado
    gigante: { luta: 'telhado', variante: 'giganteTerreo', rotulo: 'Entrar no salão revirado', pode: () => true },
  };
  async function oferecerLuta(lugarId) {
    const l = LUTA_DO_LUGAR[lugarId];
    if (!l || (o5.lutas ??= {})[l.luta] || !l.pode()) return null;
    const r = await painel(TITULO_DA_LUTA[l.luta], 'Dá para ir agora.', [
      { rotulo: l.rotulo, valor: 'ir', primaria: true }, { rotulo: 'Agora não', valor: 'nao' },
    ]);
    return r === 'ir' ? { descer: l.variante } : null;
  }

  /** A cena do lugar, se ainda não foi feita. `null` = o lugar segue com a cena de sempre. */
  async function cenaDoLugar(lugarId) {
    if (!o5.iniciado || o5.feito.zorzula) {
      if (lugarId === 'estalagem' && o5.feito.gwyn && !o5.feito.zorzula) return gwynNaEstalagem();
      return o5.iniciado ? oferecerLuta(lugarId) : null;
    }
    if (lugarId === 'estalagem' && o5.feito.gwyn) return gwynNaEstalagem();
    const cena = CENAS[lugarId];
    if (!cena || o5.cenas[lugarId]) return oferecerLuta(lugarId);
    const fim = await cena();
    if (fim === 'sai' && lugarId !== 'cambio') o5.cenas[lugarId] = true;
    if (lugarId === 'cambio' && o5.feito.acampamentoSabido) o5.cenas.cambio = true;
    if (o5.cenas[lugarId]) await depoisDaCena();
    return (o5.cenas[lugarId] && await oferecerLuta(lugarId)) || fim;
  }

  /** Depois de cada cena: a travessura (d20) e, depois da primeira, a Gwyn. */
  async function depoisDaCena() {
    await travessura();
    if (!o5.feito.gwyn) await conhecerGwyn();
  }

  // As travessuras da tabela do livro. As que trazem goblins viram cena até as lutas da vila existirem: o grupo os
  // espanta (Intimidação CD 12, do melhor) e eles fogem rindo.
  const TRAVESSURAS = [
    'Fumaça na Fazenda Alderleaf: pequenos focos de fogo na lavoura, e um goblin de mãos acesas rindo no meio do milho.',
    'Na rua, quatro goblins cercam uma senhora para levar a bolsa, e ela devolve com a bengala.',
    'Três goblins puxam uma cabra roubada que se recusa a dar um passo.',
    'No Pomar Edermath, vozes "de fantasma" na cabeça de quem passa, e maçãs sumindo das árvores: dois goblins escondidos nos galhos.',
    'Do beco atrás da Stonehill, cinco goblins atiram lixo em quem passa.',
    'Três goblins jogam tinta na parede da casa do Harbin.',
    'Telhas voam do telhado do Gigante Adormecido sobre uns mineiros confusos; lá em cima, um goblin ri.',
    'Na boca da Trilha de Triboar, três goblins acampados esperam algum viajante distraído.',
    'Dois cavalos de tração soltos disparam pela vila, e dois goblins correm atrás rindo.',
    'Dois goblins mal disfarçados de criança pedem doce ao padeiro perto da Stonehill.',
  ];
  async function travessura() {
    const d = rng.die(20);
    if (d > 10) return;
    const r = teste('intimidacao', 12);
    await painel('Enquanto isso, na vila', [TRAVESSURAS[d - 1],
      r.passou ? `${r.texto}: os goblins fogem, largando o que levavam.` : `${r.texto}: eles riem, fazem careta e somem antes de alguém alcançá-los.`]);
  }

  async function conhecerGwyn() {
    o5.feito.gwyn = true;
    await painel('Na rua', [
      'Uma anã de óculos redondos, com uma mochila maior que ela, para o grupo no meio da rua e pergunta onde fica a Estalagem Stonehill: a irmã dela, Elsa, trabalha lá.',
      'Chama-se Gwyn Oresong, estudiosa de Neverwinter, de história antiga e de cultura goblin, e fala muito. Quando ouve o que vocês investigam, os olhos dela brilham. — Tragam-me o que acharem! Eu fico na Stonehill.',
    ]);
    ctx.registro.push('A Gwyn Oresong espera o grupo na Estalagem Stonehill, para juntar as pistas.');
  }

  /** A Gwyn junta as pistas. Com as quatro, acha o posto; com menos, História CD 15 de quem a ajuda. */
  async function gwynNaEstalagem() {
    const n = o5.pistas.length;
    const escolha = await painel('A Gwyn, na Stonehill', [
      `A Gwyn espalha papéis por uma mesa inteira. ${n ? `Vocês têm ${n} das pistas que ela procura.` : 'Ainda não há nada para ela juntar.'}`,
      ...o5.pistas.map((p) => `— ${PISTAS_DO_CAP5[p]}`),
    ], [
      ...(n ? [{ rotulo: n >= 4 ? 'Juntar tudo com ela' : 'Ajudar a Gwyn com os papéis (História CD 15)', valor: 'juntar', primaria: true }] : []),
      ...(o5.feito.machadoVisto && !o5.pistas.includes('duergar') ? [{ rotulo: 'Mostrar o machado do santuário', valor: 'machado' }] : []),
      { rotulo: 'Falar com o Toblen', valor: 'toblen' },
      { rotulo: 'Sair', valor: 'sai' },
    ]);
    if (escolha === 'toblen') return null;
    if (escolha === 'machado') {
      ganharPista('duergar');
      await painel('A Gwyn, na Stonehill', 'A Gwyn mal olha o desenho das runas. — Duergar. Anões cinzentos, do fundo da terra. Ninguém faz runa assim por aqui.');
      return 'sai';
    }
    if (escolha !== 'juntar') return 'sai';
    if (o5.pistas.length < 4) {
      const r = teste('historia', 15);
      if (!r.passou) {
        await painel('A Gwyn, na Stonehill', [`${r.texto}.`, 'Os papéis não fecham. — Falta alguma coisa — diz a Gwyn. — Tragam mais.']);
        return 'sai';
      }
      await painel('A Gwyn, na Stonehill', `${r.texto}.`);
    }
    o5.feito.zorzula = true;
    await narrar(app.root, { formato: 'tela', paginas: [{ titulo: 'O Repouso de Zorzula', texto: [
      'A Gwyn bate o dedo num mapa velho. — Aqui. Um posto de mineração duergar, abandonado há séculos, a um dia de viagem para o leste, nas Montanhas da Espada. Chamava-se Repouso de Zorzula. Se há goblins morando nele, é de lá que vêm.',
      'Agora vocês sabem para onde ir, e quem procurar lá.',
    ] }] });
    ctx.missao('zorzula');
    const sobem = darMarco(vivos(), 6);
    if (sobem.length) for (const t of await telaDeSubirNivel(app.root, sobem)) ctx.registro.push(t);
    ctx.registro.push('Marco: o grupo sabe onde fica o Repouso de Zorzula (6º nível).');
    return 'sai';
  }

  return { chegada, cenaDoLugar, estado: o5 };
}
