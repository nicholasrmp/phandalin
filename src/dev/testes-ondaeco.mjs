// Testes de FUMAÇA da Caverna Onda Eco: o mapa lido da imagem e o que a cena apoia nele. Rode com:
//   node src/dev/testes-ondaeco.mjs
//
// A cena (`game/capitulo5-ondaeco.js`) importa CSS e não carrega em Node; aqui se testa o que ela depende:
// o mapa (`game/ondaeco.js`, saída do gerador), as vagas dos bandos e as propriedades de geometria em que os
// gatilhos se apoiam. Se o gerador mudar de um jeito que quebre um gatilho, cai aqui.

import assert from 'node:assert/strict';
import { Battlefield, ARESTA } from '../core/grid.js';
import { makeMonster } from '../rules/monsters.js';
import { mapaDo } from '../game/encounter.js';
import { MAPA_ONDA_ECO, ONDA_ECO } from '../game/ondaeco.js';
import { itemDeId } from '../rules/equipment.js';
import { paginasDoEpilogo } from '../game/epilogo.js';
import { TEXTOS } from '../game/ondaeco-dados.js';
import { EXAMES, arvoreDeMormesk, arvoreDoEspectador, arvoreDeNezznar, arvoreDeNundro } from '../game/ondaeco-dados.js';

let falhas = 0;
let total = 0;
function teste(nome, fn) {
  total += 1;
  try { fn(); console.log(`ok    ${nome}`); } catch (e) { falhas += 1; console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`); }
}

const campo = () => {
  const m = mapaDo('ondaEco');
  const f = new Battlefield(m.terreno[0].length, m.terreno.length, m.terreno, m.altura, m.objetos, m.paredes);
  return { m, f };
};
const abrirPortas = (f) => { for (const [a, b] of ONDA_ECO.folhas) f.porAresta(a.x, a.y, b.x, b.y, ARESTA.aberta); };

teste('o mapa tem 73 x 90 casas, e o grupo nasce em chão livre', () => {
  const { m, f } = campo();
  assert.equal(f.w, 73); assert.equal(f.h, 90);
  assert.equal(m.grupo.length, 4);
  for (const p of m.grupo) assert.ok(!f.blocksMove(p.x, p.y), `o herói nasce em casa bloqueada (${p.x},${p.y})`);
});

teste('toda área do livro (1 a 20) tem casas, e quase todas se alcançam da chegada', () => {
  const { f } = campo();
  abrirPortas(f);
  const alc = f.reachable(ONDA_ECO.chegada, 100000, () => false);
  const baixas = [];
  for (let i = 1; i <= 20; i += 1) {
    const cels = ONDA_ECO.areas[String(i)];
    assert.ok(cels?.length > 0, `a área ${i} não tem casas`);
    const ok = cels.filter((c) => alc.has(`${c.x},${c.y}`)).length;
    if (ok / cels.length < 0.7) baixas.push(`${i}: ${ok}/${cels.length}`);
  }
  assert.deepEqual(baixas, [], 'áreas que o grupo quase não alcança: ' + baixas.join(', '));
});

teste('cada bando nasce em casa livre e alcançável, e as Grandes têm as quatro casas', () => {
  const { f } = campo();
  abrirPortas(f);
  const alc = f.reachable(ONDA_ECO.chegada, 100000, () => false);
  const TIPOS = {
    stirges: 'stirge', zumbisOgros: 'zumbiOgro', zumbisGuarita: 'zumbi', fungosVioleta: 'fungoVioleta',
    serpente: 'serpenteConstritoraGigante', polvo: 'polvoGigante', ghoulsSul: 'ghoul', ghoulsGrande: 'ghoul', gosma: 'gelatinaOcre',
    bugbearsNorte: 'bugbear', zumbis: 'zumbi', caveira: 'caveiraCandente', mormesk: 'mormesk', espectador: 'spectator',
    bugbearsFenda: 'bugbear', bugbearGuarda: 'bugbear', vhalak: 'doppelganger', nezznar: 'nezznar', bugbearsTemplo: 'bugbear',
    aranhasTemplo: 'aranhaGigante', nundro: 'plebeu',
  };
  // A guarita, os fungos, o poço e a caverna trovejante são do OBELISCO (revisoes/obelisco-de-para-2026-11-08.md):
  // dois zumbis ogros e seis anões no lugar dos nove esqueletos da Mina, e três bichos onde a Mina não tinha nenhum.
  // As contas do OBELISCO (2026-11-08): 6 stirges, 5 ghouls na grande caverna, 6 bugbears no alojamento norte, 2+2 na
  // caverna desmoronada, e o templo sem as aranhas da Mina.
  const QUANTOS = { stirges: 6, zumbisOgros: 2, zumbisGuarita: 6, fungosVioleta: 2, serpente: 1, polvo: 1, ghoulsSul: 3, ghoulsGrande: 5, gosma: 1, bugbearsNorte: 6, zumbis: 8, caveira: 1, bugbearsTemplo: 2, aranhasTemplo: 0, bugbearsFenda: 2, bugbearGuarda: 2 };
  for (const [chave, n] of Object.entries(QUANTOS)) assert.equal(ONDA_ECO.ninhos[chave].length, n, `${chave}: o livro põe ${n}`);
  for (const [chave, vagas] of Object.entries(ONDA_ECO.ninhos)) {
    const tipo = TIPOS[chave];
    assert.ok(tipo, `bando sem tipo no teste: ${chave}`);
    // A pegada de verdade: a serpente constritora é Enorme, 3 x 3.
    const lado = makeMonster(tipo, { x: 0, y: 0 }).pos.f ?? 1;
    const grande = lado > 1;
    for (const p of vagas) {
      const casas = Array.from({ length: lado * lado }, (_, k) => [k % lado, Math.floor(k / lado)]);
      for (const [dx, dy] of casas) {
        assert.ok(!f.blocksMove(p.x + dx, p.y + dy), `${chave} nasce em casa bloqueada (${p.x + dx},${p.y + dy})`);
        assert.ok(alc.has(`${p.x + dx},${p.y + dy}`), `${chave} nasce onde não se chega (${p.x + dx},${p.y + dy})`);
      }
      assert.ok(!(grande && f.paredeNaPegada?.(p.x, p.y, lado)), `${chave} grande com parede cortando a pegada (${p.x},${p.y})`);
    }
  }
});

teste('cada bando nasce DENTRO da área que o livro lhe dá', () => {
  const area = (id) => new Set(ONDA_ECO.areas[id].map((c) => `${c.x},${c.y}`));
  const dentroDe = (chave, id) => { const s = area(id); for (const p of ONDA_ECO.ninhos[chave]) assert.ok(s.has(`${p.x},${p.y}`), `${chave} fora da área ${id}: (${p.x},${p.y})`); };
  dentroDe('stirges', '3'); dentroDe('zumbisOgros', '4'); dentroDe('zumbisGuarita', '4'); dentroDe('fungosVioleta', '8');
  dentroDe('serpente', '10'); dentroDe('ghoulsSul', '6'); dentroDe('ghoulsGrande', '9'); dentroDe('gosma', '2');
  dentroDe('bugbearsNorte', '11'); dentroDe('zumbis', '12'); dentroDe('mormesk', '14'); dentroDe('espectador', '15');
  dentroDe('nezznar', '19'); dentroDe('aranhasTemplo', '19'); dentroDe('nundro', '20');
  // O POLVO nasce na ÁGUA, e as casas da área 16 são só a borda de pedra: ele tem de estar ao alcance dos
  // tentáculos (4,5 m, três casas) de alguma casa da borda, que é onde o livro o põe.
  const borda = ONDA_ECO.areas['16'];
  const [pv] = ONDA_ECO.ninhos.polvo;
  assert.ok(borda.some((c) => Math.max(Math.abs(c.x - pv.x), Math.abs(c.y - pv.y)) <= 4), 'o polvo alcança a borda da caverna trovejante');
});

teste('as portas de pedra: toda folha é uma aresta de porta no mapa', () => {
  const { f } = campo();
  assert.ok(ONDA_ECO.folhas.length >= 10, 'o mapa devia ter folhas de porta: ' + ONDA_ECO.folhas.length);
  for (const [a, b] of ONDA_ECO.folhas) assert.equal(f.aresta(a.x, a.y, b.x, b.y), ARESTA.porta, `a folha (${a.x},${a.y})-(${b.x},${b.y}) não é porta fechada`);
});

teste('toda peça do mapa tem texto de Examinar, e os itens da cena existem', () => {
  const sem = [...new Set(ONDA_ECO.props.map((p) => p.variante))].filter((v) => !EXAMES[v]);
  assert.deepEqual(sem, [], 'peças sem texto de Examinar: ' + sem.join(', '));
  for (const id of ['botasDeMarchaESalto', 'manoplasDeForcaDeOgro', 'varinhaDeMisseisMagicos', 'cajadoAranha', 'lightbringer', 'dragonguard',
    'anelDePlatinaDoMago', 'cachimboDePlatina', 'gemaPequena', 'canecaDeEletro', 'chaveDoAranhaNegra', 'mapaDeMormesk', 'diamante', 'moedaDePlatina']) {
    assert.ok(itemDeId(id), `item inexistente: ${id}`);
  }
});

teste('o mapa não tem glifo desconhecido; a água é funda (nada-se) e o fosso barra o passo', () => {
  const { f } = campo();
  const GL = new Set([...'`<;"[|ROx^&FKQeuf$']);
  for (const linha of MAPA_ONDA_ECO.terreno) for (const g of linha) assert.ok(GL.has(g), `glifo inesperado: ${g}`);
  const agua = MAPA_ONDA_ECO.terreno.flatMap((l, y) => [...l].map((g, x) => [g, x, y])).find(([g]) => g === '|');
  assert.ok(agua, 'o mapa devia ter água escura');
  assert.ok(f.aguas?.has(`${agua[1]},${agua[2]}`), 'água escura é água funda');
  const fosso = MAPA_ONDA_ECO.terreno.flatMap((l, y) => [...l].map((g, x) => [g, x, y])).filter(([g]) => g === 'O');
  assert.ok(fosso.length, 'o mapa devia ter fosso');
  for (const [, x, y] of fosso) assert.ok(f.blocksMove(x, y), `o fosso em ${x},${y} devia barrar o passo`);
});

teste('as conversas: todo "vai" existe, todo nó tem saída, e o espectador só se engana uma vez', () => {
  const arvores = [
    ['Mormesk', arvoreDeMormesk({ salvo: {}, tem: () => true })],
    ['espectador', arvoreDoEspectador({ salvo: {} })],
    ['Nezznar', arvoreDeNezznar()],
    ['Nezznar com refém', arvoreDeNezznar({ refem: true })],
    ['Nundro', arvoreDeNundro({ salvo: {} })],
  ];
  for (const [nome, a] of arvores) {
    assert.ok(a.nos[a.inicio], `${nome}: nó inicial`);
    for (const [id, no] of Object.entries(a.nos)) {
      assert.ok(no.opcoes?.length, `${nome}.${id}: sem opções`);
      for (const o of no.opcoes) {
        for (const alvo of [o.vai, o.sucesso, o.falha].filter(Boolean)) assert.ok(a.nos[alvo], `${nome}.${id}: "${alvo}" não existe`);
        assert.ok(o.vai || o.fim || (o.sucesso && o.falha), `${nome}.${id}: opção sem destino`);
      }
    }
  }
  for (const o of arvoreDeNezznar({ refem: true }).nos.oi.opcoes) assert.ok(o.texto, 'opção sem texto');
  assert.ok(arvoreDeNezznar({ refem: true }).nos.oi.opcoes.some((o) => o.teste?.pericia === 'intuicao'), 'com refém, há a Intuição para ver o disfarce');
  assert.ok(!arvoreDeNezznar().nos.oi.opcoes.some((o) => o.teste?.pericia === 'intuicao'), 'sem refém, não há');
  const jaTentou = arvoreDoEspectador({ salvo: { espectadorEnganou: true } });
  assert.ok(jaTentou.nos.oi.opcoes.find((o) => o.teste).requer(), 'depois de uma tentativa, a Enganação não pode se repetir');
});

teste('o epílogo segue o livro (sem ganchos) e fecha com quem saiu vivo', () => {
  const grupo = [{ name: 'Dara', level: 5, hp: 10 }, { name: 'Pip', level: 5, hp: 0 }, { name: 'Lobo', hp: 5 }];
  const paginas = paginasDoEpilogo({ conclusao: TEXTOS.conclusao({ gundren: true, nundro: true }), grupo });
  assert.equal(paginas.length, 2);
  assert.ok(paginas.at(-1).texto[0].includes('Dara: nível 5') && !paginas.at(-1).texto[0].includes('Pip'), 'só quem saiu vivo');
  for (const v of [{}, { capturado: true }, { capturado: true, fugiu: true }, { gundren: true, nundro: true }]) {
    const txt = TEXTOS.conclusao(v).join(' ');
    assert.ok(/dez por cento/.test(txt) && /Phandalin/.test(txt), 'a conclusão traz a parte dos lucros e a vila');
    assert.ok(!/outra aventura|mapa|gancho|voltar|ainda vai/i.test(txt), 'sem ganchos');
  }
  assert.ok(TEXTOS.conclusao({ gundren: true, nundro: true }).join(' ').includes('Gundren e Nundro'), 'com os dois vivos, os dois');
});
teste('as vinte áreas do livro existem, não se sobrepõem e cobrem a caverna', () => {
  // CONFERIDO CONTRA O MAPA OFICIAL em 2026-11-06. O mapa da Caverna Onda Eco está dentro do PDF do livro
  // (`_referencias/livro/`, página 42, uma imagem de 683x932) com os vinte números em círculos vermelhos.
  // Achando os círculos por cor e FORMA — matiz vermelho, saturação acima de 118, mancha de 8 px ou mais e
  // caixa entre 7 e 22 px de lado — saem dezenove deles, e projetando-os na nossa grade de 73 x 90:
  //
  //   - DEZOITO dos dezenove caem DENTRO da área que deveriam, cada um numa área diferente;
  //   - sacudindo o quadro do mapa em +-12 px nas quatro bordas (81 quadros), dezesseis não mudam de área;
  //   - o único que nenhum círculo aponta é o 11 (Alojamento Norte), que é o círculo que o detector perdeu.
  //
  // Ou seja: a planta da Forgotten Adventures é o mapa do livro redesenhado, como a da Mansão e a de Árvore
  // Trovão, e as vinte áreas estão onde o livro as põe. Este teste guarda o que dá para guardar em Node — a
  // existência, a disjunção e a cobertura —, porque a projeção depende da imagem, que não entra no repositório.
  const NOMES = {
    1: 'Entrada da Caverna', 2: 'Túneis da Mina', 3: 'Velha Entrada', 4: 'Velha Guarita',
    5: 'Escritório dos Avaliadores', 6: 'Alojamento Sul', 7: 'Depósito Desmoronado',
    8: 'Caverna dos Fungos', 9: 'Grande Caverna', 10: 'Lago Escuro', 11: 'Alojamento Norte',
    12: 'Caverna de Fundição', 13: 'Caverna Estrelada', 14: 'Aposentos dos Magos',
    15: 'Forja das Magias', 16: 'Caverna Barulhenta', 17: 'Velho Córrego',
    18: 'Caverna Desmoronada', 19: 'Templo de Dumathoin', 20: 'Aposentos do Sacerdote',
  };
  const A = ONDA_ECO.areas ?? {};
  const dono = new Map();
  for (let n = 1; n <= 20; n += 1) {
    const cs = A[String(n)];
    assert.ok(cs && cs.length, `a área ${n} (${NOMES[n]}) existe e tem casa`);
    for (const c of cs) {
      const k = `${c.x},${c.y}`;
      assert.ok(!dono.has(k), `(${k}) está em duas áreas: ${dono.get(k)} e ${n}`);
      dono.set(k, n);
    }
  }
  // A CAVERNA INTEIRA PERTENCE A ALGUMA ÁREA, fora os corredores entre elas. O número é o que a conta dá
  // hoje; ele existe para cair se alguém mexer num retângulo e deixar meia caverna órfã.
  const { f } = campo();
  let chao = 0;
  let fora = 0;
  for (let y = 0; y < f.h; y += 1) for (let x = 0; x < f.w; x += 1) {
    if (f.blocksMove(x, y)) continue;
    chao += 1;
    if (!dono.has(`${x},${y}`)) fora += 1;
  }
  assert.ok(fora / chao < 0.20, `${fora} de ${chao} casas de chão (${Math.round(100 * fora / chao)}%) fora de toda área`);
  // E AS SALAS DE PEDRA LAVRADA SÃO UM SUBCONJUNTO DAS ÁREAS, e não uma lista concorrente: `salas` tem as
  // treze construções (templo, alojamentos, forja...) e `areas` as vinte do livro, que incluem as cavernas.
  // Medir cobertura em `salas` dá 79% de chão "sem sala" e não quer dizer nada — a caverna não é sala.
  for (const [nome, cs] of Object.entries(MAPA_ONDA_ECO.salas ?? {})) {
    assert.ok(cs.every((c) => dono.has(`${c.x},${c.y}`)), `a sala ${nome} está inteira dentro de uma área do livro`);
  }
});

teste('nenhuma casa de chão da caverna fica sem alcance, e todo posto de bando é chão livre', () => {
  // SEIS CASAS DE CHÃO QUE NINGUÉM ALCANÇAVA viviam no mapa — (5,33), (5,34), (6,34), (30,78), (36,11) e
  // (51,9) —, e o gerador as CONTAVA desde sempre, numa linha de relatório, sem nunca as consertar. A conta
  // de componentes dele não as pegava porque roda sobre `CHAO`, que inclui o fosso e a água funda: a (36,11),
  // por exemplo, tem rocha nos quatro lados menos o fosso de (35,11), então em `CHAO` ela faz parte de um
  // pedaço grande e só o motor, que não deixa pisar no fosso, a isola.
  //
  // Chão que ninguém pisa é pior que rocha: entra na conta de área, na escolha de posto e no desenho. Agora
  // o gerador o transforma em rocha e se recusa a escrever se sobrar algum.
  const { m, f } = campo();
  abrirPortas(f);
  const alc = f.reachable(ONDA_ECO.chegada, 100000);
  const presas = [];
  for (let y = 0; y < f.h; y += 1) for (let x = 0; x < f.w; x += 1) {
    if (f.blocksMove(x, y)) continue;
    if (!alc.has(`${x},${y}`)) presas.push(`${x},${y}`);
  }
  assert.deepEqual(presas, [], `casas de chão que ninguém alcança: ${presas.slice(0, 10).join(' ')}`);

  // E TODO POSTO DE BANDO é chão livre, alcançável, e de um bicho só: são 55 postos em 17 ninhos.
  const ocupadas = new Map();
  let postos = 0;
  for (const [nome, ps] of Object.entries(ONDA_ECO.ninhos ?? {})) {
    for (const p2 of ps) {
      postos += 1;
      assert.ok(f.inside(p2.x, p2.y), `${nome}: posto fora do mapa (${p2.x},${p2.y})`);
      assert.ok(!f.blocksMove(p2.x, p2.y), `${nome}: posto em casa bloqueada (${p2.x},${p2.y})`);
      assert.ok(alc.has(`${p2.x},${p2.y}`), `${nome}: posto que ninguém alcança (${p2.x},${p2.y})`);
      const k = `${p2.x},${p2.y}`;
      assert.ok(!ocupadas.has(k), `${nome} e ${ocupadas.get(k)} nascem na mesma casa (${k})`);
      ocupadas.set(k, nome);
    }
  }
  assert.ok(postos >= 50, `${postos} postos de bando`);
  // e a saída se alcança: senão a cena não fecha
  for (const p2 of ONDA_ECO.saida ?? []) {
    assert.ok(alc.has(`${p2.x},${p2.y}`), `casa de saída inalcançável (${p2.x},${p2.y})`);
  }
  void m;
});

console.log(`\n${total - falhas}/${total} passaram`);
process.exit(falhas ? 1 : 0);
