// Testes da sala do multijogador (MULTIJOGADOR.md, L-01…L-12, Fase 2). Rode com:
//   node src/dev/testes-sala.mjs
//
// `game/sala.js` é puro: aqui ele é jogado como o Durable Object o jogaria,
// uma mensagem de cada vez, e confere-se o estado depois de cada uma.

import assert from 'node:assert/strict';
import {
  HEROIS_JOGAVEIS, ALFABETO, TAMANHO_DO_CODIGO, PILOTO, MAX_NOME, MINUTOS_VAZIA,
  gerarCodigo, aleatorioSeguro, normalizarCodigo, limparNome, idValido,
  criarSala, aplicar, desconectar, deveFechar, visaoDaSala, pendenciasParaIniciar, heroisDe, limiteDeHerois, jogadorDe,
} from '../game/sala.js';
import { problemasDeJson } from '../game/save.js';
import { tratarMensagem, dentroDoLimite, identidade, LIMITE_POR_JANELA, JANELA_MS } from '../worker/sala-servidor.js';
import {
  criarClienteDeSala, urlDaSala, jogadorDaAba, salasRecentes, lembrarSala, esquecerSala, nomeLembrado, ESPERAS_DE_RECONEXAO,
  INTERVALO_DO_PING, SILENCIO_MAXIMO,
} from '../game/sala-cliente.js';
import { HEROIS } from '../game/criacao.js';

let total = 0;
let falhas = 0;
function teste(nome, fn) {
  total += 1;
  try { fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`);
  }
}

const ANF = 'jogador-anfitriao';
const BETO = 'jogador-beto-001';
const CAIO = 'jogador-caio-002';
const DENI = 'jogador-deni-003';

const nova = (extra = {}) => {
  const r = criarSala({ codigo: 'ABC234', anfitriao: ANF, nome: 'Nicholas', origem: { tipo: 'nova', aventura: 'mina-perdida' }, agora: 1000, ...extra });
  assert.ok(r.ok, r.erro);
  return r.sala;
};
const faz = (sala, quem, msg, agora = 2000) => aplicar(sala, quem, msg, agora);
const deve = (r, trecho) => { assert.equal(r.ok, false, 'deveria recusar'); if (trecho) assert.match(r.erro, trecho); };
const entra = (sala, id, nome) => { const r = faz(sala, id, { tipo: 'entrar', nome }); assert.ok(r.ok, r.erro); };
const pega = (sala, id, ...hs) => { for (const heroi of hs) { const r = faz(sala, id, { tipo: 'pegar', heroi }); assert.ok(r.ok, `${heroi}: ${r.erro}`); } };

// ---- o elenco e o código -------------------------------------------------------

teste('os 12 heróis jogáveis da sala são exatamente os de criacao.js', () => {
  assert.deepEqual([...HEROIS_JOGAVEIS].sort(), HEROIS.map((h) => h.id).sort());
});

teste('L-02: o alfabeto não tem 0 O 1 I L, e o código tem 6 símbolos dele', () => {
  for (const ch of '0O1IL') assert.equal(ALFABETO.includes(ch), false, ch);
  assert.equal(new Set(ALFABETO).size, ALFABETO.length, 'sem repetidos');
  let n = 0;
  const c = gerarCodigo((m) => (n++ * 7) % m);
  assert.equal(c.length, TAMANHO_DO_CODIGO);
  assert.ok([...c].every((ch) => ALFABETO.includes(ch)));
});

teste('L-02: o sorteio seguro cobre o alfabeto inteiro, sem viés grosseiro', () => {
  const cont = new Map();
  for (let i = 0; i < 31000; i += 1) { const k = aleatorioSeguro(ALFABETO.length); cont.set(k, (cont.get(k) ?? 0) + 1); }
  assert.equal(cont.size, ALFABETO.length);
  for (const v of cont.values()) assert.ok(v > 700 && v < 1300, `contagem fora do esperado: ${v}`);
});

teste('o código digitado é normalizado, e o que não é código é recusado', () => {
  assert.equal(normalizarCodigo(' abc234 '), 'ABC234');
  for (const x of ['ABC23', 'ABC2345', 'ABC23O', 'ABC231', 'ABC 23', '', null, undefined, 123, {}]) assert.equal(normalizarCodigo(x), null, String(x));
});

teste('o nome é limpo: sem controle, sem espaço dobrado, de 1 a 24 caracteres', () => {
  assert.equal(limparNome('  Beto   Silva '), 'Beto Silva');
  assert.equal(limparNome('Be\u0000to‮'), 'Beto');
  assert.equal(limparNome('x'.repeat(MAX_NOME)), 'x'.repeat(MAX_NOME));
  for (const x of ['', '   ', 'x'.repeat(MAX_NOME + 1), null, 5, {}, '\u0000​']) assert.equal(limparNome(x), null, JSON.stringify(x));
});

teste('o id do jogador: o UUID passa, o resto não', () => {
  assert.ok(idValido('3a314f2e-1c2d-4e5f-8a9b-0c1d2e3f4a5b'));
  for (const x of ['curto', 'a b c d e f g h', 'x'.repeat(65), '../../etc', null, 5,
    'constructor', 'hasOwnProperty', 'toString', '__proto__', 'valueOf', 'isPrototypeOf']) assert.equal(idValido(x), false, String(x));
});

// ---- L-01: criar -------------------------------------------------------------------

teste('L-01: criar a sala põe o anfitrião nela, como líder, no lobby, sem herói nem pronto', () => {
  const s = nova();
  assert.equal(s.fase, 'lobby');
  assert.equal(s.anfitriao, ANF); assert.equal(s.lider, ANF);
  assert.deepEqual(s.ordem, [ANF]);
  assert.equal(s.jogadores[ANF].pronto, false);
  assert.deepEqual(s.herois, {});
});

teste('L-01: a criação recusa código, jogador, nome, número de jogadores e aventura ruins', () => {
  const base = { codigo: 'ABC234', anfitriao: ANF, nome: 'N', agora: 1 };
  for (const mudar of [{ codigo: 'ABC' }, { anfitriao: 'x' }, { nome: '' }, { maxJogadores: 0 }, { maxJogadores: 5 }, { maxJogadores: 2.5 },
    { origem: { tipo: 'outra', aventura: 'x' } }, { origem: { tipo: 'nova', aventura: 7 } }, { origem: { tipo: 'nova', aventura: 'x'.repeat(41) } }]) {
    assert.equal(criarSala({ ...base, ...mudar }).ok, false, JSON.stringify(mudar));
  }
});

teste('L-01: criar a partir de um save guarda a aventura e o resumo (cortado)', () => {
  const s = nova({ origem: { tipo: 'save', aventura: 'mina-perdida', resumo: 'r'.repeat(500) } });
  assert.equal(s.origem.tipo, 'save');
  assert.equal(s.origem.resumo.length, 120);
});

// ---- L-03: entrar -----------------------------------------------------------------------

teste('L-03: entrar cria o jogador; entrar de novo (mesmo id) reassume o lugar e o herói', () => {
  const s = nova(); entra(s, BETO, 'Beto');
  pega(s, BETO, 'pc-mago');
  desconectar(s, BETO, 3000);
  assert.equal(s.jogadores[BETO].conectado, false);
  const r = faz(s, BETO, { tipo: 'entrar', nome: 'Beto' });
  assert.ok(r.ok && r.reentrou);
  assert.equal(s.jogadores[BETO].conectado, true);
  assert.deepEqual(heroisDe(s, BETO), ['pc-mago'], 'o herói continuou dele');
  assert.equal(s.ordem.filter((x) => x === BETO).length, 1);
});

teste('L-03: entrar recusa nome ruim, id ruim e sala cheia', () => {
  const s = nova({ maxJogadores: 2 });
  deve(faz(s, BETO, { tipo: 'entrar', nome: '' }), /nome/);
  deve(faz(s, 'x', { tipo: 'entrar', nome: 'Beto' }), /jogador/);
  entra(s, BETO, 'Beto');
  deve(faz(s, CAIO, { tipo: 'entrar', nome: 'Caio' }), /cheia/);
});

teste('quem não entrou não faz nada além de entrar', () => {
  const s = nova();
  for (const msg of [{ tipo: 'pegar', heroi: 'pc-mago' }, { tipo: 'pronto', valor: true }, { tipo: 'sair' }, { tipo: 'iniciar' }]) deve(faz(s, BETO, msg), /não está/);
});

teste('mensagem que não é mensagem é recusada, sem lançar', () => {
  const s = nova();
  for (const m of [null, undefined, 'x', 5, [], {}, { tipo: 5 }, { tipo: 'dança' }]) deve(faz(s, ANF, m));
});

// ---- L-06 e L-07: pegar, largar, distribuição ---------------------------------------------

teste('L-06: cada herói tem um dono só; pegar o que já tem dono é recusado', () => {
  const s = nova(); entra(s, BETO, 'Beto');
  pega(s, ANF, 'pc-guerreiro');
  deve(faz(s, BETO, { tipo: 'pegar', heroi: 'pc-guerreiro' }), /dono/);
});

teste('L-06: herói que não existe, ou com tipo errado, é recusado', () => {
  const s = nova();
  for (const h of ['pc-dragao', '', null, 7, {}, ['pc-mago']]) deve(faz(s, ANF, { tipo: 'pegar', heroi: h }), /inexistente/);
});

teste('L-07: o grupo é de 4 e ninguém segura tantos que os outros fiquem sem nenhum', () => {
  const s = nova(); entra(s, BETO, 'Beto'); entra(s, CAIO, 'Caio');
  assert.equal(limiteDeHerois(s), 2, 'com 3 jogadores, no máximo 2 por jogador');
  pega(s, ANF, 'pc-guerreiro', 'pc-ladino');
  deve(faz(s, ANF, { tipo: 'pegar', heroi: 'pc-mago' }), /ficariam sem herói/);
  pega(s, BETO, 'pc-mago'); pega(s, CAIO, 'pc-clerigo');
  deve(faz(s, CAIO, { tipo: 'pegar', heroi: 'pc-barbaro' }), /quatro/);
});

teste('L-07: sozinho, o jogador pode ficar com os 4; com 4 jogadores, 1 cada', () => {
  const s = nova(); pega(s, ANF, 'pc-guerreiro', 'pc-ladino', 'pc-mago', 'pc-clerigo');
  assert.equal(heroisDe(s, ANF).length, 4);
  const t = nova(); for (const [id, n] of [[BETO, 'B'], [CAIO, 'C'], [DENI, 'D']]) entra(t, id, n);
  assert.equal(limiteDeHerois(t), 1);
  pega(t, ANF, 'pc-guerreiro'); deve(faz(t, ANF, { tipo: 'pegar', heroi: 'pc-ladino' }), /ficariam sem herói/);
});

teste('P2: ninguém solta o herói de outro, nem o anfitrião; o do piloto só o anfitrião solta', () => {
  const s = nova(); entra(s, BETO, 'Beto');
  pega(s, BETO, 'pc-mago');
  deve(faz(s, ANF, { tipo: 'largar', heroi: 'pc-mago' }), /não é seu/);
  assert.equal(s.herois['pc-mago'], BETO);
  assert.ok(faz(s, ANF, { tipo: 'piloto', heroi: 'pc-guerreiro' }).ok);
  deve(faz(s, BETO, { tipo: 'largar', heroi: 'pc-guerreiro' }), /não é seu/);
  assert.ok(faz(s, ANF, { tipo: 'largar', heroi: 'pc-guerreiro' }).ok);
  assert.ok(faz(s, BETO, { tipo: 'largar', heroi: 'pc-mago' }).ok);
});

teste('largar herói sem dono ou inexistente é recusado; piloto é só do anfitrião', () => {
  const s = nova(); entra(s, BETO, 'Beto');
  deve(faz(s, ANF, { tipo: 'largar', heroi: 'pc-mago' }), /não tem dono/);
  deve(faz(s, BETO, { tipo: 'piloto', heroi: 'pc-mago' }), /anfitrião/);
});

// ---- L-11: pronto e iniciar ---------------------------------------------------------------------

teste('pronto exige um herói, só aceita booleano, e mudar o grupo desfaz o pronto', () => {
  const s = nova();
  deve(faz(s, ANF, { tipo: 'pronto', valor: true }), /herói/);
  pega(s, ANF, 'pc-mago');
  for (const v of ['sim', 1, null, undefined]) deve(faz(s, ANF, { tipo: 'pronto', valor: v }), /inválida/);
  assert.ok(faz(s, ANF, { tipo: 'pronto', valor: true }).ok);
  assert.equal(s.jogadores[ANF].pronto, true);
  pega(s, ANF, 'pc-ladino');
  assert.equal(s.jogadores[ANF].pronto, false, 'pegar outro herói desfez o pronto');
});

teste('L-11: só inicia com 4 heróis, todos com herói e todos prontos; só o anfitrião inicia', () => {
  const s = nova(); entra(s, BETO, 'Beto');
  pega(s, ANF, 'pc-guerreiro', 'pc-ladino'); pega(s, BETO, 'pc-mago');
  deve(faz(s, BETO, { tipo: 'iniciar' }), /anfitrião/);
  deve(faz(s, ANF, { tipo: 'iniciar' }), /faltam 1 herói/);
  pega(s, BETO, 'pc-clerigo');
  deve(faz(s, ANF, { tipo: 'iniciar' }), /não está pronto/);
  faz(s, ANF, { tipo: 'pronto', valor: true }); faz(s, BETO, { tipo: 'pronto', valor: true });
  assert.deepEqual(pendenciasParaIniciar(s), []);
  assert.ok(faz(s, ANF, { tipo: 'iniciar' }, 5000).ok);
  assert.equal(s.fase, 'iniciada'); assert.equal(s.iniciadaEm, 5000);
});

teste('L-11/L-08: o anfitrião põe heróis no piloto para completar o grupo, e inicia', () => {
  const s = nova();
  pega(s, ANF, 'pc-guerreiro');
  for (const h of ['pc-ladino', 'pc-mago', 'pc-clerigo']) assert.ok(faz(s, ANF, { tipo: 'piloto', heroi: h }).ok);
  faz(s, ANF, { tipo: 'pronto', valor: true });
  assert.ok(faz(s, ANF, { tipo: 'iniciar' }).ok);
  assert.equal(s.herois['pc-mago'], PILOTO);
});

teste('L-11: jogador ausente bloqueia, a menos que o anfitrião aceite o piloto; aí os heróis dele vão ao piloto', () => {
  const s = nova(); entra(s, BETO, 'Beto');
  pega(s, ANF, 'pc-guerreiro', 'pc-ladino'); pega(s, BETO, 'pc-mago', 'pc-clerigo');
  faz(s, ANF, { tipo: 'pronto', valor: true }); faz(s, BETO, { tipo: 'pronto', valor: true });
  desconectar(s, BETO, 3000);
  deve(faz(s, ANF, { tipo: 'iniciar' }), /desconectado/);
  assert.ok(faz(s, ANF, { tipo: 'iniciar', aceitarPiloto: true }).ok);
  assert.equal(s.herois['pc-mago'], PILOTO); assert.equal(s.herois['pc-clerigo'], PILOTO);
  assert.equal(s.herois['pc-guerreiro'], ANF);
});

teste('depois de iniciada, não se pega, não se solta, não se entra gente nova — mas quem estava volta', () => {
  const s = nova(); entra(s, BETO, 'Beto');
  pega(s, ANF, 'pc-guerreiro', 'pc-ladino'); pega(s, BETO, 'pc-mago', 'pc-clerigo');
  faz(s, ANF, { tipo: 'pronto', valor: true }); faz(s, BETO, { tipo: 'pronto', valor: true });
  faz(s, ANF, { tipo: 'iniciar' });
  deve(faz(s, ANF, { tipo: 'largar', heroi: 'pc-ladino' }), /começou/);
  deve(faz(s, ANF, { tipo: 'pegar', heroi: 'pc-barbaro' }), /começou/);
  deve(faz(s, ANF, { tipo: 'iniciar' }), /começou/);
  deve(faz(s, CAIO, { tipo: 'entrar', nome: 'Caio' }), /começou/);
  desconectar(s, BETO, 9000);
  assert.ok(faz(s, BETO, { tipo: 'entrar', nome: 'Beto' }).reentrou);
});

// ---- L-12: remover, fechar, vazia -----------------------------------------------------------------

teste('L-12: remover tira o jogador, solta os heróis, e ele não volta', () => {
  const s = nova(); entra(s, BETO, 'Beto');
  pega(s, BETO, 'pc-mago');
  deve(faz(s, BETO, { tipo: 'remover', jogador: 'p1' }), /anfitrião/);
  deve(faz(s, ANF, { tipo: 'remover', jogador: 'p1' }), /anfitrião não se remove/);
  deve(faz(s, ANF, { tipo: 'remover', jogador: 'p9' }), /inexistente/);
  assert.ok(faz(s, ANF, { tipo: 'remover', jogador: 'p2' }).ok);
  assert.equal(s.jogadores[BETO], undefined);
  assert.equal(s.herois['pc-mago'], undefined);
  deve(faz(s, BETO, { tipo: 'entrar', nome: 'Beto' }), /removido/);
});

teste('L-12: o líder removido (ou que sai) devolve a liderança ao anfitrião', () => {
  const s = nova(); entra(s, BETO, 'Beto');
  assert.ok(faz(s, ANF, { tipo: 'lider', jogador: 'p2' }).ok);
  assert.equal(s.lider, BETO);
  deve(faz(s, BETO, { tipo: 'lider', jogador: 'p2' }), /anfitrião/);
  faz(s, BETO, { tipo: 'sair' });
  assert.equal(s.lider, ANF);
});

teste('L-12: fechar a sala encerra tudo: nenhuma mensagem vale depois', () => {
  const s = nova(); entra(s, BETO, 'Beto');
  deve(faz(s, BETO, { tipo: 'fechar' }), /anfitrião/);
  assert.ok(faz(s, ANF, { tipo: 'fechar' }).ok);
  assert.equal(s.fase, 'fechada');
  deve(faz(s, BETO, { tipo: 'pronto', valor: true }), /fechada/);
  deve(faz(s, CAIO, { tipo: 'entrar', nome: 'Caio' }), /fechada/);
});

teste('L-12: vazia por 30 minutos fecha; qualquer um voltando zera a contagem', () => {
  const s = nova();
  desconectar(s, ANF, 10_000);
  assert.equal(s.vaziaDesde, 10_000);
  assert.equal(deveFechar(s, 10_000 + (MINUTOS_VAZIA * 60_000) - 1), false);
  assert.equal(deveFechar(s, 10_000 + MINUTOS_VAZIA * 60_000), true);
  faz(s, ANF, { tipo: 'entrar', nome: 'Nicholas' });
  assert.equal(s.vaziaDesde, null);
  assert.equal(deveFechar(s, 10 ** 9), false);
});

teste('com mais gente, a sala só está "vazia" quando ninguém está conectado', () => {
  const s = nova(); entra(s, BETO, 'Beto');
  desconectar(s, ANF, 1); assert.equal(s.vaziaDesde, null);
  desconectar(s, BETO, 2); assert.equal(s.vaziaDesde, 2);
});

teste('desconectar tira o pronto: quem caiu não segura o início de quem voltou depois', () => {
  const s = nova(); pega(s, ANF, 'pc-mago'); faz(s, ANF, { tipo: 'pronto', valor: true });
  desconectar(s, ANF, 5);
  assert.equal(s.jogadores[ANF].pronto, false);
});

// ---- a visão e o JSON -------------------------------------------------------------------------------

teste('a sala e a visão são JSON puro, e a visão diz quem é "você" e o que falta', () => {
  const s = nova(); entra(s, BETO, 'Beto'); pega(s, ANF, 'pc-guerreiro');
  assert.deepEqual(problemasDeJson(s), []);
  const v = visaoDaSala(s, BETO);
  assert.deepEqual(problemasDeJson(v), []);
  assert.deepEqual(JSON.parse(JSON.stringify(v)), v);
  assert.equal(v.voce, 'p2');
  assert.equal(visaoDaSala(s, 'estranho-qualquer').voce, null);
  assert.ok(v.pendencias.length > 0);
  assert.deepEqual(v.jogadores.find((j) => j.id === 'p1').herois, ['pc-guerreiro']);
  assert.equal(v.herois['pc-guerreiro'], 'p1');
  assert.equal(v.anfitriao, 'p1');
  // O id SECRETO de ninguém aparece na visão: quem o souber assume o lugar da pessoa (L-03).
  assert.doesNotMatch(JSON.stringify(v), new RegExp(`${ANF}|${BETO}`));
});

teste('o estado guardado e relido (como o Durable Object faz) continua funcionando', () => {
  const s = nova(); entra(s, BETO, 'Beto'); pega(s, BETO, 'pc-mago');
  const relida = JSON.parse(JSON.stringify(s));
  pega(relida, ANF, 'pc-guerreiro');
  assert.equal(relida.herois['pc-mago'], BETO);
  assert.equal(relida.herois['pc-guerreiro'], ANF);
});

teste('o rótulo público de cada jogador é estável e não repete, mesmo depois de alguém sair', () => {
  const s = nova(); entra(s, BETO, 'Beto'); entra(s, CAIO, 'Caio');
  faz(s, BETO, { tipo: 'sair' });
  entra(s, DENI, 'Deni');
  assert.deepEqual(visaoDaSala(s, ANF).jogadores.map((j) => j.id), ['p1', 'p3', 'p4']);
});

teste('uma mensagem recusada NÃO muda o estado da sala', () => {
  const s = nova(); entra(s, BETO, 'Beto'); pega(s, BETO, 'pc-mago');
  const antes = JSON.stringify(s);
  for (const m of [{ tipo: 'pegar', heroi: 'pc-mago' }, { tipo: 'pegar', heroi: 'xx' }, { tipo: 'pronto', valor: 'x' }, { tipo: 'iniciar' },
    { tipo: 'remover', jogador: 'p1' }, { tipo: 'largar', heroi: 'pc-ladino' }, { tipo: 'lider', jogador: 'quem' }]) {
    faz(s, BETO, m);
  }
  assert.equal(JSON.stringify(s), antes);
});


// ---- o servidor: uma mensagem de cada vez (worker/sala-servidor.js) ------------------------------

teste('servidor: criar, depois entrar, e as recusas voltam como erro sem mudar nada', () => {
  const ctx = { codigo: 'ABC234', agora: 1 };
  let r = tratarMensagem({ sala: null, jogadorId: ANF, bruto: JSON.stringify({ tipo: 'criar', nome: 'Nicholas' }), ...ctx });
  assert.ok(r.mudou && r.sala && !r.resposta);
  const sala = r.sala;
  r = tratarMensagem({ sala, jogadorId: BETO, bruto: JSON.stringify({ tipo: 'entrar', nome: 'Beto' }), ...ctx });
  assert.ok(r.mudou);
  const antes = JSON.stringify(sala);
  for (const bruto of ['{lixo', 'null', '[]', '"texto"', JSON.stringify({ tipo: 7 }), JSON.stringify({ tipo: 'criar', nome: 'X' }),
    JSON.stringify({ tipo: 'pegar', heroi: 'pc-dragao' }), 'x'.repeat(5000), 42, undefined]) {
    const e = tratarMensagem({ sala, jogadorId: BETO, bruto, ...ctx });
    assert.equal(e.mudou, false, String(bruto).slice(0, 30));
    assert.equal(e.resposta.tipo, 'erro');
  }
  assert.equal(JSON.stringify(sala), antes);
});

teste('servidor: sala que não existe só aceita "criar"', () => {
  const r = tratarMensagem({ sala: null, jogadorId: ANF, bruto: JSON.stringify({ tipo: 'entrar', nome: 'A' }), codigo: 'ABC234', agora: 1 });
  assert.match(r.resposta.erro, /não existe/);
  const c = tratarMensagem({ sala: null, jogadorId: ANF, bruto: JSON.stringify({ tipo: 'criar', nome: '' }), codigo: 'ABC234', agora: 1 });
  assert.match(c.resposta.erro, /nome/);
  assert.equal(c.sala, null);
});

teste('servidor: remover devolve o id SECRETO de quem caiu, para o transporte derrubar a conexão', () => {
  const ctx = { codigo: 'ABC234', agora: 1 };
  const sala = tratarMensagem({ sala: null, jogadorId: ANF, bruto: JSON.stringify({ tipo: 'criar', nome: 'N' }), ...ctx }).sala;
  tratarMensagem({ sala, jogadorId: BETO, bruto: JSON.stringify({ tipo: 'entrar', nome: 'B' }), ...ctx });
  const r = tratarMensagem({ sala, jogadorId: ANF, bruto: JSON.stringify({ tipo: 'remover', jogador: 'p2' }), ...ctx });
  assert.equal(r.removido, BETO);
});

teste('servidor: o limite de ritmo deixa clicar rápido e barra a inundação, e a janela anda', () => {
  const registro = [];
  let passou = 0;
  for (let i = 0; i < 100; i += 1) if (dentroDoLimite(registro, 1000 + i)) passou += 1;
  assert.equal(passou, LIMITE_POR_JANELA);
  assert.equal(dentroDoLimite(registro, 1000 + JANELA_MS + 200), true, 'passada a janela, volta a valer');
});

// ---- o cliente: reconexão e identidade (game/sala-cliente.js) ---------------------------------------

class WebSocketFalso {
  static todos = [];
  constructor(url) { this.url = url; this.readyState = 0; this.enviadas = []; this.ouvintes = {}; WebSocketFalso.todos.push(this); }
  addEventListener(t, f) { (this.ouvintes[t] ??= []).push(f); }
  send(m) { this.enviadas.push(JSON.parse(m)); }
  close() { this.readyState = 3; }
  abre() { this.readyState = 1; for (const f of this.ouvintes.open ?? []) f({}); }
  recebe(obj) { for (const f of this.ouvintes.message ?? []) f({ data: JSON.stringify(obj) }); }
  cai(code = 1006) { this.readyState = 3; for (const f of this.ouvintes.close ?? []) f({ code }); }
}

const clienteDeTeste = () => {
  WebSocketFalso.todos = [];
  const visoes = []; const erros = []; const fechos = []; const status = []; const agenda = []; const batidas = []; const parados = []; const agora = { t: 0 };
  const c = criarClienteDeSala({
    WebSocketCtor: WebSocketFalso, jogadorId: 'jogador-secreto-01', urlDe: (cod) => `ws://x/api/sala/${cod}`,
    aoVisao: (v) => visoes.push(v), aoErro: (e) => erros.push(e), aoFechar: (m) => fechos.push(m), aoStatus: (s) => status.push(s),
    agendar: (fn, ms) => { agenda.push({ fn, ms }); return agenda.length; }, cancelar: () => {},
    repetir: (fn, ms) => { batidas.push({ fn, ms }); return batidas.length; }, parar: (id) => { parados.push(id); }, relogio: () => agora.t,
  });
  return { c, visoes, erros, fechos, status, agenda, batidas, parados, agora };
};

teste('cliente: abre mandando a mensagem de apresentação, e entrega visão, erro e fechamento', () => {
  const { c, visoes, erros, fechos, status } = clienteDeTeste();
  c.abrir('ABC234', { tipo: 'criar', nome: 'Nicholas' });
  const ws = WebSocketFalso.todos[0];
  assert.equal(ws.url, 'ws://x/api/sala/ABC234');
  ws.abre();
  assert.deepEqual(ws.enviadas, [{ tipo: 'criar', nome: 'Nicholas', eu: 'jogador-secreto-01' }], 'o id vai na primeira mensagem');
  assert.equal(ws.url.includes('jogador-secreto'), false, 'e NUNCA na URL');
  ws.recebe({ tipo: 'sala', visao: { codigo: 'ABC234' } }); ws.recebe({ tipo: 'erro', erro: 'não' }); ws.recebe({ tipo: 'fechada', motivo: 'fim' });
  assert.deepEqual(visoes, [{ codigo: 'ABC234' }]); assert.deepEqual(erros, ['não']); assert.deepEqual(fechos, ['fim']);
  assert.deepEqual(status, ['conectando', 'conectado']);
  assert.equal(c.enviar({ tipo: 'pronto', valor: true }), true);
  assert.deepEqual(ws.enviadas.at(-1), { tipo: 'pronto', valor: true });
});

teste('cliente: lixo do servidor é ignorado, e enviar sem conexão devolve false', () => {
  const { c, visoes } = clienteDeTeste();
  assert.equal(c.enviar({ tipo: 'x' }), false);
  c.abrir('ABC234', { tipo: 'entrar', nome: 'B' });
  const ws = WebSocketFalso.todos[0];
  assert.equal(c.enviar({ tipo: 'x' }), false, 'ainda não abriu');
  ws.abre();
  for (const f of ws.ouvintes.message) f({ data: 'isto não é json' });
  ws.recebe({ tipo: 'desconhecido' });
  assert.deepEqual(visoes, []);
});

teste('cliente: a conexão cai -> reconecta com espera crescente, e manda "entrar" (não "criar")', () => {
  const { c, agenda, status } = clienteDeTeste();
  c.abrir('ABC234', { tipo: 'criar', nome: 'Nicholas' });
  WebSocketFalso.todos[0].abre();
  WebSocketFalso.todos[0].recebe({ tipo: 'sala', visao: {} });   // o servidor confirmou a criação
  WebSocketFalso.todos[0].cai();
  assert.equal(agenda.at(-1).ms, ESPERAS_DE_RECONEXAO[0]);
  agenda.at(-1).fn();
  const ws2 = WebSocketFalso.todos[1];
  ws2.cai();                       // caiu antes de abrir de novo
  assert.equal(agenda.at(-1).ms, ESPERAS_DE_RECONEXAO[1]);
  agenda.at(-1).fn();
  const ws3 = WebSocketFalso.todos[2];
  ws3.abre();
  assert.deepEqual(ws3.enviadas, [{ tipo: 'entrar', nome: 'Nicholas', eu: 'jogador-secreto-01' }], 'na volta, "entrar": o servidor reconhece o jogador');
  assert.ok(status.includes('reconectando') && status.at(-1) === 'conectado');
});

teste('cliente: depois de abrir de novo a contagem de tentativas zera; esgotadas, diz que caiu', () => {
  const { c, agenda, status } = clienteDeTeste();
  c.abrir('ABC234', { tipo: 'entrar', nome: 'B' });
  for (let i = 0; i < ESPERAS_DE_RECONEXAO.length; i += 1) { WebSocketFalso.todos.at(-1).cai(); agenda.at(-1).fn(); }
  WebSocketFalso.todos.at(-1).cai();
  assert.equal(status.at(-1), 'caiu');
  c.tentarDeNovo();
  WebSocketFalso.todos.at(-1).abre();
  assert.equal(status.at(-1), 'conectado');
});

teste('cliente: fechamento 4000 (removido, sala fechada) e sair() NÃO reconectam', () => {
  const a = clienteDeTeste();
  a.c.abrir('ABC234', { tipo: 'entrar', nome: 'B' }); WebSocketFalso.todos[0].abre();
  WebSocketFalso.todos[0].cai(4000);
  assert.equal(a.agenda.length, 0);
  const b = clienteDeTeste();
  b.c.abrir('ABC234', { tipo: 'entrar', nome: 'B' }); WebSocketFalso.todos[0].abre();
  WebSocketFalso.todos[0].recebe({ tipo: 'sala', visao: {} });
  b.c.sair();
  assert.deepEqual(WebSocketFalso.todos[0].enviadas.at(-1), { tipo: 'sair' });
  WebSocketFalso.todos[0].cai(1000);
  assert.equal(b.agenda.length, 0);
  const d = clienteDeTeste();
  d.c.abrir('ABC234', { tipo: 'entrar', nome: 'B' }); WebSocketFalso.todos[0].abre();
  WebSocketFalso.todos[0].recebe({ tipo: 'fechada', motivo: 'x' });
  WebSocketFalso.todos[0].cai(1006);
  assert.equal(d.agenda.length, 0, 'depois de "fechada" do servidor não se insiste');
});

teste('cliente: o endereço do WebSocket segue o protocolo da página e escapa o que vai na URL', () => {
  assert.equal(urlDaSala({ protocol: 'https:', host: 'phandalin.sdz-games.workers.dev' }, 'ABC234'), 'wss://phandalin.sdz-games.workers.dev/api/sala/ABC234');
  assert.equal(urlDaSala({ protocol: 'http:', host: 'localhost:5190' }, 'AB C&34'), 'ws://localhost:5190/api/sala/AB%20C%2634');
});

teste('cliente: com ?como= o id é por aba; sem, é o do navegador', () => {
  const sess = new Map();
  const armazem = { getItem: (k) => (sess.has(k) ? sess.get(k) : null), setItem: (k, v) => sess.set(k, v) };
  const por = (busca) => jogadorDaAba({ busca, sessionStorage: armazem, jogadorLocal: () => 'id-do-navegador' });
  assert.equal(por(''), 'id-do-navegador');
  const beto = por('?como=Beto');
  assert.ok(idValido(beto) && beto !== 'id-do-navegador');
  assert.equal(por('?como=Beto'), beto, 'a mesma aba mantém o id');
  assert.notEqual(por('?como=Caio'), beto);
  assert.ok(idValido(por('?como=../../x')), 'o rótulo é limpo');
  assert.equal(jogadorDaAba({ busca: '?como=X', sessionStorage: { getItem() { throw new Error('x'); } }, jogadorLocal: () => 'id-do-navegador' }), 'id-do-navegador');
});

teste('cliente: salas recentes: as últimas 5, sem repetir, e lixo no armazém não quebra', () => {
  const m = new Map();
  const st = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) };
  for (let i = 0; i < 7; i += 1) lembrarSala(st, `AAAAA${i}`.slice(0, 6), i);
  lembrarSala(st, 'AAAAA3', 99);
  const r = salasRecentes(st);
  assert.equal(r.length, 5); assert.equal(r[0].codigo, 'AAAAA3');
  assert.equal(new Set(r.map((x) => x.codigo)).size, 5);
  esquecerSala(st, 'AAAAA3');
  assert.equal(salasRecentes(st).some((x) => x.codigo === 'AAAAA3'), false);
  st.setItem('phandalin:salas', '{lixo'); assert.deepEqual(salasRecentes(st), []);
  st.setItem('phandalin:salas', JSON.stringify([{ codigo: 5 }, null, 'x', { codigo: 'ABC234', quando: 1 }])); assert.equal(salasRecentes(st).length, 1);
  assert.equal(nomeLembrado({ getItem() { throw new Error('x'); } }), '');
});


// ---- o que a revisão achou (sala.js) ---------------------------------------------------------------

teste('ids do protótipo (constructor, __proto__...) não agem como jogador, e a sala não trava', () => {
  const s = nova(); entra(s, BETO, 'Beto');
  for (const id of ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf']) {
    deve(faz(s, id, { tipo: 'pegar', heroi: 'pc-mago' }), /não está nesta sala/);
    deve(faz(s, id, { tipo: 'pronto', valor: true }), /não está nesta sala/);
    deve(faz(s, id, { tipo: 'entrar', nome: 'Intruso' }), /jogador inválido/);
    assert.equal(jogadorDe(s, id), undefined, id);
  }
  assert.deepEqual(s.herois, {});
  assert.equal(Object.prototype.pronto, undefined, 'nada vazou para o protótipo');
  desconectar(s, 'constructor', 5);
  assert.equal(s.vaziaDesde, null, 'um id que não é de ninguém não esvazia a sala');
});

teste('a visão não confunde id do protótipo com jogador', () => {
  const s = nova();
  assert.equal(visaoDaSala(s, 'constructor').voce, null);
  assert.equal(visaoDaSala(s, '__proto__').voce, null);
});

teste('anfitrião não sai (fecha a sala); quem sai no lobby solta os heróis e some', () => {
  const s = nova(); entra(s, BETO, 'Beto'); pega(s, BETO, 'pc-mago');
  deve(faz(s, ANF, { tipo: 'sair' }), /anfitrião não sai/);
  assert.ok(s.jogadores[ANF], 'o anfitrião continua');
  const r = faz(s, BETO, { tipo: 'sair' });
  assert.ok(r.ok); assert.equal(r.saiu, BETO);
  assert.equal(s.jogadores[BETO], undefined); assert.deepEqual(s.herois, {});
});

teste('sair ou ser removido com a partida em curso: os heróis vão ao piloto, o grupo segue de 4', () => {
  const s = nova(); entra(s, BETO, 'Beto');
  pega(s, ANF, 'pc-guerreiro', 'pc-ladino'); pega(s, BETO, 'pc-mago', 'pc-clerigo');
  faz(s, ANF, { tipo: 'pronto', valor: true }); faz(s, BETO, { tipo: 'pronto', valor: true });
  faz(s, ANF, { tipo: 'iniciar' });
  assert.ok(faz(s, BETO, { tipo: 'sair' }).ok);
  assert.equal(Object.keys(s.herois).length, 4);
  assert.equal(s.herois['pc-mago'], PILOTO); assert.equal(s.herois['pc-clerigo'], PILOTO);
  assert.ok(s.jogadores[BETO], 'continua no registro (desconectado)');
  assert.equal(s.jogadores[BETO].conectado, false);
  const t = nova(); entra(t, BETO, 'Beto');
  pega(t, ANF, 'pc-guerreiro', 'pc-ladino'); pega(t, BETO, 'pc-mago', 'pc-clerigo');
  faz(t, ANF, { tipo: 'pronto', valor: true }); faz(t, BETO, { tipo: 'pronto', valor: true }); faz(t, ANF, { tipo: 'iniciar' });
  assert.ok(faz(t, ANF, { tipo: 'remover', jogador: 'p2' }).ok);
  assert.equal(Object.keys(t.herois).length, 4); assert.equal(t.herois['pc-mago'], PILOTO);
  deve(faz(t, BETO, { tipo: 'entrar', nome: 'Beto' }), /removido/);
});

teste('A-04: quem volta depois do piloto automático recupera os heróis que eram dele (só esses)', () => {
  const s = nova(); entra(s, BETO, 'Beto');
  pega(s, ANF, 'pc-guerreiro', 'pc-ladino'); pega(s, BETO, 'pc-mago', 'pc-clerigo');
  faz(s, ANF, { tipo: 'pronto', valor: true }); faz(s, BETO, { tipo: 'pronto', valor: true });
  desconectar(s, BETO, 3000);
  assert.ok(faz(s, ANF, { tipo: 'iniciar', aceitarPiloto: true }).ok);
  assert.equal(s.herois['pc-mago'], PILOTO);
  const r = faz(s, BETO, { tipo: 'entrar', nome: 'Beto' });
  assert.ok(r.reentrou); assert.equal(r.igual, false, 'houve mudança: a sala precisa retransmitir');
  assert.deepEqual(heroisDe(s, BETO).sort(), ['pc-clerigo', 'pc-mago']);
  assert.deepEqual(s.cedidos, {});
});

teste('um herói posto no piloto de propósito NUNCA é devolvido a ninguém', () => {
  const s = nova(); entra(s, BETO, 'Beto');
  pega(s, ANF, 'pc-guerreiro'); pega(s, BETO, 'pc-mago');
  faz(s, ANF, { tipo: 'piloto', heroi: 'pc-ladino' }); faz(s, ANF, { tipo: 'piloto', heroi: 'pc-clerigo' });
  faz(s, ANF, { tipo: 'pronto', valor: true }); faz(s, BETO, { tipo: 'pronto', valor: true });
  desconectar(s, BETO, 1);
  faz(s, ANF, { tipo: 'iniciar', aceitarPiloto: true });
  faz(s, BETO, { tipo: 'entrar', nome: 'Beto' });
  assert.equal(s.herois['pc-ladino'], PILOTO); assert.equal(s.herois['pc-clerigo'], PILOTO);
  assert.deepEqual(heroisDe(s, BETO), ['pc-mago']);
});

teste('a sala vazia é percebida depois de sair (e do socket fechar de quem já saiu)', () => {
  const s = nova(); entra(s, BETO, 'Beto');
  desconectar(s, ANF, 100);
  assert.equal(s.vaziaDesde, null, 'o Beto ainda está');
  faz(s, BETO, { tipo: 'sair' }, 200);
  assert.equal(s.vaziaDesde, 200, 'saiu o último conectado: a sala está vazia');
  desconectar(s, BETO, 300);            // o `close` do socket de quem já saiu chega depois
  assert.equal(s.vaziaDesde, 200, 'e o instante original é mantido');
  assert.equal(deveFechar(s, 200 + MINUTOS_VAZIA * 60_000), true);
});

teste('qualquer mudança no grupo desfaz o "pronto" de TODOS (o que aprovaram já não é o que está na tela)', () => {
  const s = nova(); entra(s, BETO, 'Beto'); entra(s, CAIO, 'Caio');
  pega(s, ANF, 'pc-guerreiro'); pega(s, BETO, 'pc-mago'); pega(s, CAIO, 'pc-clerigo');
  for (const id of [ANF, BETO, CAIO]) faz(s, id, { tipo: 'pronto', valor: true });
  const todosProntos = () => Object.values(s.jogadores).every((j) => j.pronto);
  assert.ok(todosProntos());
  faz(s, ANF, { tipo: 'piloto', heroi: 'pc-ladino' });
  assert.equal(Object.values(s.jogadores).some((j) => j.pronto), false, 'piloto');
  for (const id of [ANF, BETO, CAIO]) faz(s, id, { tipo: 'pronto', valor: true });
  faz(s, BETO, { tipo: 'largar', heroi: 'pc-mago' });
  assert.equal(Object.values(s.jogadores).some((j) => j.pronto), false, 'largar');
  faz(s, BETO, { tipo: 'pegar', heroi: 'pc-mago' });
  for (const id of [ANF, BETO, CAIO]) faz(s, id, { tipo: 'pronto', valor: true });
  faz(s, ANF, { tipo: 'remover', jogador: 'p3' });
  assert.equal(Object.values(s.jogadores).some((j) => j.pronto), false, 'remover');
});

teste('entrar não cabe quando alguém segura heróis demais para sobrar um por jogador', () => {
  const s = nova();
  pega(s, ANF, 'pc-guerreiro', 'pc-ladino', 'pc-mago', 'pc-clerigo');
  deve(faz(s, BETO, { tipo: 'entrar', nome: 'Beto' }), /heróis demais/);
  faz(s, ANF, { tipo: 'largar', heroi: 'pc-clerigo' });
  assert.ok(faz(s, BETO, { tipo: 'entrar', nome: 'Beto' }).ok, 'solto um, cabe');
});

teste('entrar de quem já está, sem mudar nada, não é mudança (nem grava, nem retransmite)', () => {
  const s = nova();
  const r = faz(s, ANF, { tipo: 'entrar', nome: 'Nicholas' });
  assert.ok(r.ok && r.reentrou && r.igual);
  desconectar(s, ANF, 1);
  assert.equal(faz(s, ANF, { tipo: 'entrar', nome: 'Nicholas' }).igual, false, 'voltar de uma queda muda');
  assert.equal(faz(s, ANF, { tipo: 'entrar', nome: 'Outro Nome' }).igual, false, 'mudar o nome muda');
  assert.equal(faz(s, ANF, { tipo: 'pronto', valor: false }).igual, true, 'pronto repetido não muda');
});

// ---- o servidor: identidade, ping, abas ------------------------------------------------------------

teste('identidade: o id vem do campo `eu` da primeira mensagem, e só se for válido', () => {
  assert.equal(identidade(JSON.stringify({ tipo: 'entrar', eu: ANF, nome: 'N' })), ANF);
  for (const bruto of [JSON.stringify({ tipo: 'entrar', nome: 'N' }), JSON.stringify({ tipo: 'entrar', eu: 'constructor' }), JSON.stringify({ tipo: 'entrar', eu: 5 }),
    '{lixo', 'x'.repeat(5000), JSON.stringify({ eu: ANF })]) assert.equal(identidade(bruto), null, String(bruto).slice(0, 40));
});

teste('servidor: ping responde pong sem tocar na sala, mesmo sem sala', () => {
  const sala = nova();
  const antes = JSON.stringify(sala);
  const r = tratarMensagem({ sala, jogadorId: ANF, bruto: JSON.stringify({ tipo: 'ping' }), codigo: 'ABC234', agora: 1 });
  assert.deepEqual(r.resposta, { tipo: 'pong' }); assert.equal(r.mudou, false);
  assert.equal(JSON.stringify(sala), antes);
  assert.deepEqual(tratarMensagem({ sala: null, jogadorId: ANF, bruto: JSON.stringify({ tipo: 'ping' }), codigo: 'ABC234', agora: 1 }).resposta, { tipo: 'pong' });
});

teste('servidor: "sair" de uma aba com outra aberta só fecha a aba, o jogador fica', () => {
  const sala = nova(); entra(sala, BETO, 'Beto');
  const r = tratarMensagem({ sala, jogadorId: BETO, bruto: JSON.stringify({ tipo: 'sair' }), codigo: 'ABC234', agora: 1, outrasConexoes: 1 });
  assert.equal(r.soEsta, true); assert.equal(r.mudou, false);
  assert.ok(sala.jogadores[BETO]);
  const u = tratarMensagem({ sala, jogadorId: BETO, bruto: JSON.stringify({ tipo: 'sair' }), codigo: 'ABC234', agora: 1, outrasConexoes: 0 });
  assert.equal(u.saiu, BETO); assert.equal(sala.jogadores[BETO], undefined);
});

teste('servidor: o anfitrião que repete "criar" (a resposta se perdeu) volta para a sala; outro não', () => {
  const ctx = { codigo: 'ABC234', agora: 1 };
  const sala = tratarMensagem({ sala: null, jogadorId: ANF, bruto: JSON.stringify({ tipo: 'criar', nome: 'N' }), ...ctx }).sala;
  const de = tratarMensagem({ sala, jogadorId: ANF, bruto: JSON.stringify({ tipo: 'criar', nome: 'N' }), ...ctx });
  assert.equal(de.resposta, null); assert.equal(de.sala, sala);
  const outro = tratarMensagem({ sala, jogadorId: BETO, bruto: JSON.stringify({ tipo: 'criar', nome: 'B' }), ...ctx });
  assert.match(outro.resposta.erro, /já existe/);
});

// ---- o cliente: batimento, apresentação, cancelar ------------------------------------------------------

teste('cliente: o batimento manda ping e dá a conexão por morta depois de 50 s de silêncio', () => {
  const { c, batidas, agora } = clienteDeTeste();
  c.abrir('ABC234', { tipo: 'entrar', nome: 'B' });
  const ws = WebSocketFalso.todos[0]; ws.abre();
  assert.equal(batidas.length, 1); assert.equal(batidas[0].ms, INTERVALO_DO_PING);
  agora.t = 10_000; batidas[0].fn();
  assert.deepEqual(ws.enviadas.at(-1), { tipo: 'ping' });
  ws.recebe({ tipo: 'pong' });                                // o servidor respondeu: a conexão vive
  agora.t = 10_000 + SILENCIO_MAXIMO - 1; batidas[0].fn();
  assert.equal(ws.readyState, 1, 'ainda dentro do prazo');
  agora.t = 10_000 + SILENCIO_MAXIMO + 1; batidas[0].fn();
  assert.equal(ws.readyState, 3, 'passou do prazo: fechada à força, e o `close` leva à reconexão');
});

teste('cliente: a apresentação se repete até o servidor confirmar (um "criar" que se perdeu)', () => {
  const { c, agenda } = clienteDeTeste();
  c.abrir('ABC234', { tipo: 'criar', nome: 'Nicholas', maxJogadores: 2 });
  WebSocketFalso.todos[0].abre();
  WebSocketFalso.todos[0].cai();                              // caiu antes de qualquer resposta
  agenda.at(-1).fn();
  WebSocketFalso.todos[1].abre();
  assert.equal(WebSocketFalso.todos[1].enviadas[0].tipo, 'criar', 'sem confirmação, repete o criar');
  assert.equal(WebSocketFalso.todos[1].enviadas[0].maxJogadores, 2);
});

teste('cliente: cancelar antes de entrar só fecha, sem mandar "sair"', () => {
  const { c } = clienteDeTeste();
  c.abrir('ABC234', { tipo: 'entrar', nome: 'B' });
  WebSocketFalso.todos[0].abre();
  c.sair();
  assert.equal(WebSocketFalso.todos[0].enviadas.some((m) => m.tipo === 'sair'), false);
  assert.equal(WebSocketFalso.todos[0].readyState, 3);
});

teste('cliente: uma conexão velha não escreve no estado de uma sala nova', () => {
  const { c, visoes } = clienteDeTeste();
  c.abrir('ABC234', { tipo: 'entrar', nome: 'B' });
  const velha = WebSocketFalso.todos[0]; velha.abre();
  c.sair();
  c.abrir('XYZ789', { tipo: 'entrar', nome: 'B' });
  velha.recebe({ tipo: 'sala', visao: { codigo: 'ABC234' } });     // mensagem em trânsito da sala anterior
  assert.deepEqual(visoes, []);
  WebSocketFalso.todos[1].abre(); WebSocketFalso.todos[1].recebe({ tipo: 'sala', visao: { codigo: 'XYZ789' } });
  assert.deepEqual(visoes, [{ codigo: 'XYZ789' }]);
});

console.log(`\n${total - falhas}/${total} testes passaram${falhas ? `, ${falhas} FALHARAM` : ''}.`);
process.exit(falhas ? 1 : 0);
