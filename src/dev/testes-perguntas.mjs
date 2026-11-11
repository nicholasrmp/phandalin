// PROVA DA CAMADA DE INTENÇÃO (`game/perguntas.js`): a pergunta digitada cai no assunto certo. Rode com:
//
//   node src/dev/testes-perguntas.mjs
//
// Um classificador por palavra-chave é fácil de escrever e fácil de quebrar: basta uma chave nova comer a de
// outro assunto para o NPC passar a responder do castelo quando perguntam do rei. A tabela abaixo é o contrato
// — cada linha é uma pergunta que um jogador digitaria de verdade, com o assunto que ela TEM de achar — e é
// onde se vê, de graça, o estrago de qualquer chave nova.
import assert from 'node:assert/strict';
import { assuntoDe, responder, normal, ASSUNTOS, assuntosDe, continuarAssunto } from '../game/perguntas.js';

let falhas = 0;
let total = 0;
function teste(nome, fn) {
  total += 1;
  try { fn(); console.log(`ok    ${nome}`); } catch (e) { falhas += 1; console.log(`FALHA ${nome}\n      ${e.message}`); }
}

// ---- a pergunta de verdade cai no assunto certo
const CASOS = [
  ['quem é o Aranha Negra?', 'aranhaNegra'],
  ['quem manda em vocês', 'aranhaNegra'],
  ['Quem mandou vocês pegarem o anão?', 'aranhaNegra'],
  ['onde está o Gundren', 'gundren'],
  ['cadê o anão?', 'gundren'],
  ['como chego ao Castelo Dentefino', 'castelo'],
  ['quem é o rei Grol', 'castelo'],
  ['o que é a Caverna Onda Eco', 'ondaEco'],
  ['onde fica a mina perdida', 'ondaEco'],
  ['e a Forja das Magias?', 'ondaEco'],
  ['com quem está o mapa', 'mapa'],
  ['quem é o Cajavidro', 'cajavidro'],
  ['onde dorme o mago do cajado de vidro', 'cajavidro'],
  ['o que são os Marcarrubra', 'marcarrubra'],
  ['tem um humano preso aqui?', 'sildar'],
  ['quem é Klarg', 'klarg'],
  ['quem são os presos das jaulas', 'dendrar'],
  ['tem porta secreta aqui?', 'secretas'],
  ['qual é a senha dos esqueletos', 'senha'],
  ['o que é aquele bicho de um olho só', 'vigia'],
  ['onde está o tesouro', 'tesouro'],
  ['por onde se sai daqui', 'saida'],
  ['quem é você?', 'quemEVoce'],
  ['o que você sabe da banshee', 'agatha'],
  ['fale dos orcs do Cume da Wyvern', 'orcs'],
];

teste('cada pergunta de jogador cai no assunto dela', () => {
  const erros = [];
  for (const [p, esperado] of CASOS) {
    const a = assuntoDe(p);
    if (a?.id !== esperado) erros.push(`"${p}" -> ${a?.id ?? 'nada'} (esperado ${esperado})`);
  }
  assert.deepEqual(erros, [], erros.join(' | '));
});

teste('a chave mais longa ganha: "aranha negra" não cai em aranha de teia', () => {
  // o perigo clássico de classificador por palavra: a chave curta de um assunto comendo a longa de outro
  assert.equal(assuntoDe('quem é o aranha negra')?.id, 'aranhaNegra');
  assert.equal(assuntoDe('fale do castelo dentefino')?.id, 'castelo');
  assert.equal(assuntoDe('o que é a onda eco')?.id, 'ondaEco');
});

teste('pergunta vazia ou sem assunto devolve nada, e não um palpite', () => {
  // é a diferença entre "não sei do que você fala" e inventar resposta: o classificador precisa saber calar
  for (const p of ['', '   ', '???', 'bom dia', 'você gosta de peixe', 'blá blá blá']) {
    assert.equal(assuntoDe(p), null, `"${p}" achou assunto onde não há`);
  }
});

teste('acento, caixa e pontuação não mudam nada', () => {
  const ids = ['QUEM É O ARANHA NEGRA?!', 'quem e o aranha negra', '  Quem é o Aranha Negra  ']
    .map((p) => assuntoDe(p)?.id);
  assert.deepEqual(ids, ['aranhaNegra', 'aranhaNegra', 'aranhaNegra']);
  assert.equal(normal('Órfão, à PROVA: ninguém!'), 'orfao a prova ninguem');
});

teste('o `entre` limita a busca ao que aquele NPC pode falar', () => {
  // o Droop não sabe da Agatha; perguntar dela a ele não pode cair em assunto nenhum
  const so = ['castelo', 'senha', 'secretas'];
  assert.equal(assuntoDe('qual é a senha', { entre: so })?.id, 'senha');
  assert.equal(assuntoDe('fale da banshee Agatha', { entre: so }), null);
});

// ---- as três respostas possíveis
const DROOP = {
  naoSei: 'Droop não sabe! Droop não sabe!',
  naoEntendi: 'Droop não entendeu.',
  naoConto: 'Droop tem medo de falar disso.',
  sabe: {
    senha: 'A palavra é Illefarn. Droop ouviu o mago falar.',
    castelo: 'Droop não sabe o caminho. Mas os Dentefino vêm farejar a vila.',
    tesouro: (ctx) => (ctx.vencido ? 'No cinto do peludo grande.' : 'Droop não fala disso agora.'),
  },
  requer: { tesouro: (ctx) => (ctx.vencido ? null : 'os bugbears ainda estão de pé') },
};

teste('saber, não saber e não contar são três respostas diferentes', () => {
  const sabe = responder(DROOP, assuntoDe('qual é a senha'), {});
  assert.equal(sabe.tipo, 'sabe');
  assert.match(sabe.texto, /Illefarn/);

  const naoSabe = responder(DROOP, assuntoDe('quem é a banshee Agatha'), {});
  assert.equal(naoSabe.tipo, 'naoSabe', 'ele não sabe da Agatha');
  assert.equal(naoSabe.texto, DROOP.naoSei, 'e diz isso com a voz dele');

  const naoConta = responder(DROOP, assuntoDe('onde está o tesouro'), { vencido: false });
  assert.equal(naoConta.tipo, 'naoConta', 'sabe, mas não conta enquanto os bugbears estão de pé');
  assert.equal(naoConta.motivo, 'os bugbears ainda estão de pé');

  const conta = responder(DROOP, assuntoDe('onde está o tesouro'), { vencido: true });
  assert.equal(conta.tipo, 'sabe');
  assert.match(conta.texto, /cinto do peludo/);

  const nada = responder(DROOP, assuntoDe('você gosta de peixe'), {});
  assert.equal(nada.tipo, 'naoEntendi', 'pergunta sem assunto não vira "não sei": vira "não entendi"');
});

teste('todo assunto do catálogo tem nome e pelo menos uma chave', () => {
  const erros = [];
  for (const [id, a] of Object.entries(ASSUNTOS)) {
    if (!a.nome) erros.push(`${id} sem nome`);
    if (!a.chaves?.length) erros.push(`${id} sem chave`);
    for (const c of a.chaves ?? []) if (normal(c).length < 3) erros.push(`${id}: a chave "${c}" é curta demais e vai pegar tudo`);
  }
  assert.deepEqual(erros, [], erros.join(' | '));
});

teste('nenhuma chave aparece em dois assuntos: seria empate para sempre', () => {
  const dono = new Map();
  const erros = [];
  for (const [id, a] of Object.entries(ASSUNTOS)) {
    for (const c of a.chaves ?? []) {
      const k = normal(c);
      if (dono.has(k)) erros.push(`"${c}" está em ${dono.get(k)} e em ${id}`);
      dono.set(k, id);
    }
  }
  assert.deepEqual(erros, [], erros.join(' | '));
});

teste('`assuntosDe` lista o que o NPC sabe, para a interface sugerir', () => {
  assert.deepEqual(assuntosDe(DROOP).sort(), ['castelo', 'senha', 'tesouro']);
});

teste('a memória da conversa completa o que depende do assunto, e só isso', () => {
  const m = { chave: null };
  assert.equal(continuarAssunto('e onde ele mora?', m), 'e onde ele mora?', 'sem assunto ainda, fica como está');
  assert.equal(continuarAssunto('quem é Klarg?', m), 'quem é Klarg?');
  assert.equal(continuarAssunto('e onde ele mora?', m), 'sobre klarg: e onde ele mora?');
  assert.equal(continuarAssunto('por quê?', m), 'sobre klarg: por quê?');
  assert.equal(continuarAssunto('onde fica?', m), 'sobre klarg: onde fica?');
  assert.equal(assuntoDe('sobre klarg: e onde ele mora?').id, 'klarg', 'o banco acha pelo assunto');
  // o que não depende dele segue independente, com a mesma chave no banco de sempre
  for (const q of ['quem manda aqui', 'como saio daqui', 'o que você sabe', 'por que você faz isso', 'me conta uma piada', 'tem armadilhas neste lugar']) {
    assert.equal(continuarAssunto(q, m), q, q);
  }
  assert.equal(m.chave, 'klarg', 'e o assunto continua sendo o mesmo');
  assert.equal(continuarAssunto('e o Rei Grol?', m), 'e o Rei Grol?', 'pergunta com assunto próprio troca o assunto');
  assert.equal(m.chave, 'rei grol');
  assert.equal(continuarAssunto('e ele é forte?', m), 'sobre rei grol: e ele é forte?');
  continuarAssunto('quem é você', m);
  assert.equal(continuarAssunto('e ele é forte?', m), 'e ele é forte?', 'falar do próprio NPC limpa o assunto');
  const longa = `e ele ${'x'.repeat(195)}`;
  continuarAssunto('quem é Klarg', m);
  assert.equal(continuarAssunto(longa, m), longa, 'não passa do tamanho que o servidor aceita');
});

console.log(`\n${total - falhas}/${total} passaram`);
process.exit(falhas ? 1 : 0);
