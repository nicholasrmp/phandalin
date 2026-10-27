// Testes da sala do multijogador (MULTIJOGADOR.md, L-01…L-12, Fase 2). Rode com:
//   node src/dev/testes-sala.mjs
//
// `game/sala.js` é puro: aqui ele é jogado como o Durable Object o jogaria,
// uma mensagem de cada vez, e confere-se o estado depois de cada uma.

import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import {
  HEROIS_JOGAVEIS, ALFABETO, TAMANHO_DO_CODIGO, PILOTO, MAX_NOME, MINUTOS_VAZIA,
  gerarCodigo, aleatorioSeguro, normalizarCodigo, limparNome, idValido,
  criarSala, aplicar, desconectar, deveFechar, visaoDaSala, pendenciasParaIniciar, heroisDe, limiteDeHerois, jogadorDe,
  HEROIS_COM_ARTE, PERSONA_PADRAO, MS_POR_CASA, nomeUnico, figuraDe, EMOTES, promoverAnfitriao, GRACA_DO_ANFITRIAO_MS,
} from '../game/sala.js';
import {
  LARGURA, ALTURA, MAPA_TAVERNA, MESA_DE_GRUPO, NASCEDOUROS, campoDaTaverna, caminhoNaTaverna, casaLivre, ehMesaDeGrupo,
  marcadorLivre, marcadorN, TOTAL_DE_MARCADORES, CORES_DO_MARCADOR, BALCAO, ehBalcao,
} from '../game/taverna.js';
import { problemasDeJson } from '../game/save.js';
import { novoEstado as novoEstadoDeLimites, emitir as emitirCodigo, entrar as entrarNaSala, EMITIR_POR_HORA, TENTATIVAS_POR_MINUTO, VALIDADE_DO_CODIGO_MS } from '../worker/limites.js';
import { criarEmissor, criarReceptor, lerDelta, COMPLETA_A_CADA } from '../game/partida-delta.js';
import { novoDiretorio, escolher as escolherInstancia, registrar as registrarPopulacao, ehPublica as ehPublicaNoDiretorio, LOTACAO_PARA_NOVOS } from '../worker/diretorio.js';
import { AMBIENTES, ambienteDaVariante, temCamadas } from '../core/ambiente.js';
import { DICAS, GATILHOS, dicasDoGatilho, lerDicas, guardarDicas } from '../game/tutorial.js';
import { faltamDaTaverna } from './verificar-taverna.mjs';
import { heroiQueSobra } from '../game/sala.js';
import { escolhasConferidas } from '../game/nivel.js';
import { diarioDe, diarioParaTela } from '../game/diario.js';
import { tratarMensagem, tratarVista, ehVista, tratarNarrativa, ehNarrativa, tratarSave, ehSave, MAX_SAVE, dentroDoLimite, identidade, LIMITE_POR_JANELA, JANELA_MS } from '../worker/sala-servidor.js';
import { montarCampo } from '../game/campo.js';
import { mapaDo } from '../game/encounter.js';
import { diferencasDoCampo, aplicarDiferencas, diferencaValida } from '../game/campo-delta.js';
import { fotografar, emTexto, lerVista, aplicarVista, empacotarEvento, desempacotarEvento, EVENTOS_VISUAIS, MAX_VISTA, MS_ENTRE_VISTAS } from '../game/partida-vista.js';
import { cordaPermite, LIMITE_DA_CORDA } from '../game/corda.js';
import { heroisDoPiloto, inimigoMaisPerto, jogadaDoPiloto, controlaOHeroi } from '../game/piloto.js';
import { quemDecide, apurar, apurarLugar, possoEscolher } from '../game/decisao.js';
import { acaoRemotaValida, tilesValidos, circuloValido, magiaNaHora, escolheVarios, mandaNaHora } from '../game/acoes.js';
import { getSpell } from '../rules/spells.js';
import { visaoDoGrupo } from '../rules/luz.js';
import { Battlefield } from '../core/grid.js';
import { buildFoes } from '../game/encounter.js';
import { montarHeroi, escolhaAutomatica } from '../game/criacao.js';
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
  deve(faz(s, BETO, { tipo: 'pegar', heroi: 'pc-clerigo' }), /cada jogador controla um herói/);   // o que sobra é do anfitrião
  pega(s, ANF, 'pc-clerigo');
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
  pega(s, ANF, 'pc-guerreiro', 'pc-ladino', 'pc-clerigo'); pega(s, BETO, 'pc-mago');
  faz(s, ANF, { tipo: 'pronto', valor: true }); faz(s, BETO, { tipo: 'pronto', valor: true });
  desconectar(s, BETO, 3000);
  deve(faz(s, ANF, { tipo: 'iniciar' }), /desconectado/);
  assert.ok(faz(s, ANF, { tipo: 'iniciar', aceitarPiloto: true }).ok);
  assert.equal(s.herois['pc-mago'], PILOTO); assert.equal(s.herois['pc-clerigo'], ANF, 'o que sobrou é do anfitrião');
  assert.equal(s.herois['pc-guerreiro'], ANF);
});

teste('depois de iniciada, não se pega, não se solta; quem estava volta e quem chega assume o que sobrou (ou só assiste)', () => {
  const s = nova(); entra(s, BETO, 'Beto');
  pega(s, ANF, 'pc-guerreiro', 'pc-ladino', 'pc-clerigo'); pega(s, BETO, 'pc-mago');
  faz(s, ANF, { tipo: 'pronto', valor: true }); faz(s, BETO, { tipo: 'pronto', valor: true });
  faz(s, ANF, { tipo: 'iniciar' });
  deve(faz(s, ANF, { tipo: 'largar', heroi: 'pc-ladino' }), /começou/);
  deve(faz(s, ANF, { tipo: 'pegar', heroi: 'pc-barbaro' }), /começou/);
  deve(faz(s, ANF, { tipo: 'iniciar' }), /começou/);
  // Quem chega com a partida em andamento: o anfitrião conduzia três heróis, então o último passa ao recém-chegado.
  const ent = faz(s, CAIO, { tipo: 'entrar', nome: 'Caio' });
  assert.ok(ent.ok && ent.entrouNaPartida, 'entra na partida em andamento');
  assert.equal(s.herois['pc-clerigo'], CAIO, 'fica com o herói que sobrava do anfitrião');
  assert.equal(s.herois['pc-guerreiro'], ANF, 'o anfitrião fica com o primeiro');
  const OUTRO = 'jogador-4-aaaaaaaa';
  assert.ok(faz(s, OUTRO, { tipo: 'entrar', nome: 'Duda' }).ok);
  assert.equal(s.herois['pc-ladino'], OUTRO, 'o seguinte fica com o outro que sobrava');
  assert.equal(heroiQueSobra(s), null, 'o anfitrião fica com um só: quem chegar depois só assiste');
  deve(faz(s, 'jogador-5-bbbbbbbb', { tipo: 'entrar', nome: 'Eva' }), /cheia/);
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
  pega(s, ANF, 'pc-guerreiro', 'pc-ladino', 'pc-clerigo'); pega(s, BETO, 'pc-mago');
  faz(s, ANF, { tipo: 'pronto', valor: true }); faz(s, BETO, { tipo: 'pronto', valor: true });
  faz(s, ANF, { tipo: 'iniciar' });
  assert.ok(faz(s, BETO, { tipo: 'sair' }).ok);
  assert.equal(Object.keys(s.herois).length, 4);
  assert.equal(s.herois['pc-mago'], PILOTO); assert.equal(s.herois['pc-clerigo'], ANF);
  assert.ok(s.jogadores[BETO], 'continua no registro (desconectado)');
  assert.equal(s.jogadores[BETO].conectado, false);
  const t = nova(); entra(t, BETO, 'Beto');
  pega(t, ANF, 'pc-guerreiro', 'pc-ladino', 'pc-clerigo'); pega(t, BETO, 'pc-mago');
  faz(t, ANF, { tipo: 'pronto', valor: true }); faz(t, BETO, { tipo: 'pronto', valor: true }); faz(t, ANF, { tipo: 'iniciar' });
  assert.ok(faz(t, ANF, { tipo: 'remover', jogador: 'p2' }).ok);
  assert.equal(Object.keys(t.herois).length, 4); assert.equal(t.herois['pc-mago'], PILOTO);
  deve(faz(t, BETO, { tipo: 'entrar', nome: 'Beto' }), /removido/);
});

teste('A-04: quem volta depois do piloto automático recupera os heróis que eram dele (só esses)', () => {
  const s = nova(); entra(s, BETO, 'Beto');
  pega(s, ANF, 'pc-guerreiro', 'pc-ladino', 'pc-clerigo'); pega(s, BETO, 'pc-mago');
  faz(s, ANF, { tipo: 'pronto', valor: true }); faz(s, BETO, { tipo: 'pronto', valor: true });
  desconectar(s, BETO, 3000);
  assert.ok(faz(s, ANF, { tipo: 'iniciar', aceitarPiloto: true }).ok);
  assert.equal(s.herois['pc-mago'], PILOTO);
  const r = faz(s, BETO, { tipo: 'entrar', nome: 'Beto' });
  assert.ok(r.reentrou); assert.equal(r.igual, false, 'houve mudança: a sala precisa retransmitir');
  assert.deepEqual(heroisDe(s, BETO).sort(), ['pc-mago']);
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
  assert.equal(faz(s, ANF, { tipo: 'entrar', nome: 'Outro Nome' }).igual, true, 'voltar com outro nome não renomeia');
  assert.equal(s.jogadores[ANF].nome, 'Nicholas');
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


// ---- a taverna: o mapa (game/taverna.js) -------------------------------------------------------------

teste('taverna: o mapa tem o tamanho dito, e cada linha tem a largura certa', () => {
  assert.equal(MAPA_TAVERNA.terreno.length, ALTURA);
  assert.ok(MAPA_TAVERNA.terreno.every((l) => l.length === LARGURA));
});

teste('taverna: toda casa de chão alcança todas as outras (nada de salão partido em dois)', () => {
  const campo = campoDaTaverna();
  const alcance = campo.reachable({ ...NASCEDOUROS[0] }, 1000);
  let livres = 0;
  for (let y = 0; y < ALTURA; y++) for (let x = 0; x < LARGURA; x++) {
    if (campo.blocksMove(x, y)) continue;
    livres += 1;
    assert.ok(alcance.has(`${x},${y}`), `(${x},${y}) isolada`);
  }
  assert.ok(livres > 100, `só ${livres} casas livres`);
});

teste('taverna: os nascedouros são chão livre, e a mesa de grupo não se pisa mas tem 4 lugares em volta', () => {
  const campo = campoDaTaverna();
  for (const n of NASCEDOUROS) assert.equal(campo.blocksMove(n.x, n.y), false, `${n.x},${n.y}`);
  assert.equal(new Set(NASCEDOUROS.map((n) => `${n.x},${n.y}`)).size, NASCEDOUROS.length);
  for (const c of MESA_DE_GRUPO) { assert.equal(campo.blocksMove(c.x, c.y), true); assert.ok(ehMesaDeGrupo(c.x, c.y)); }
  const lugares = new Set();
  for (const c of MESA_DE_GRUPO) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const x = c.x + dx; const y = c.y + dy;
    if (!ehMesaDeGrupo(x, y) && !campo.blocksMove(x, y)) lugares.add(`${x},${y}`);
  }
  assert.ok(lugares.size >= 4, `só ${lugares.size} lugares livres em volta da mesa`);
});

teste('taverna: o caminho existe, termina no destino, e recusa parede, mesa, fora do mapa e casa ocupada', () => {
  const campo = campoDaTaverna();
  const de = NASCEDOUROS[0];
  const c = caminhoNaTaverna(campo, de, { x: 10, y: 10 });
  assert.deepEqual(c[0], de); assert.deepEqual(c.at(-1), { x: 10, y: 10 });
  for (const alvo of [{ x: 16, y: 0 }, { x: 8, y: 6 }, { x: -1, y: 5 }, { x: 99, y: 5 }, { x: 5, y: 2 }]) assert.deepEqual(caminhoNaTaverna(campo, de, alvo), [], JSON.stringify(alvo));
  assert.deepEqual(caminhoNaTaverna(campo, de, { x: 10, y: 10 }, new Set(['10,10'])), [], 'destino ocupado');
  assert.ok(caminhoNaTaverna(campo, de, { x: 10, y: 10 }, new Set(['7,10', '8,10'])).length > 0, 'atravessar quem está no caminho vale');
});

teste('taverna: casaLivre acha a mais perto que ninguém ocupa', () => {
  const campo = campoDaTaverna();
  assert.deepEqual(casaLivre(campo, { x: 5, y: 10 }), { x: 5, y: 10 });
  const l = casaLivre(campo, { x: 5, y: 10 }, new Set(['5,10']));
  assert.ok(Math.abs(l.x - 5) <= 1 && Math.abs(l.y - 10) <= 1 && !(l.x === 5 && l.y === 10));
});

teste('T-05: são 16 marcadores distintos (8 cores × 2 formas), atribuídos sem repetir', () => {
  const vistos = new Set();
  for (let n = 0; n < TOTAL_DE_MARCADORES; n++) { const m = marcadorN(n); vistos.add(`${m.cor}/${m.forma}`); }
  assert.equal(vistos.size, 16);
  assert.equal(new Set(CORES_DO_MARCADOR).size, 8);
  const usados = new Set();
  for (let i = 0; i < 16; i++) { const n = marcadorLivre(usados); assert.ok(!usados.has(n)); usados.add(n); }
  assert.equal(marcadorLivre(usados), null, 'lotou');
});

// ---- a taverna: os avatares na sala -------------------------------------------------------------------

teste('T-02: as personas com arte são exatamente heróis jogáveis, e o padrão é uma delas', () => {
  for (const h of HEROIS_COM_ARTE) assert.ok(HEROIS_JOGAVEIS.includes(h), h);
  assert.ok(HEROIS_COM_ARTE.includes(PERSONA_PADRAO));
});

teste('taverna: criar e entrar põem um avatar de cada jogador em casas livres, com marcadores diferentes', () => {
  const s = nova(); entra(s, BETO, 'Beto'); entra(s, CAIO, 'Caio');
  const campo = campoDaTaverna();
  const av = Object.values(s.avatares);
  assert.equal(av.length, 3);
  assert.equal(new Set(av.map((a) => `${a.x},${a.y}`)).size, 3, 'nenhum em cima do outro');
  assert.equal(new Set(av.map((a) => a.marcador)).size, 3, 'marcadores diferentes');
  for (const a of av) assert.equal(campo.blocksMove(a.x, a.y), false);
  assert.ok(av.every((a) => a.persona === PERSONA_PADRAO));
});

teste('T-02: a persona vem da mensagem de entrada, só entre as que têm arte', () => {
  const s = nova();
  assert.ok(faz(s, BETO, { tipo: 'entrar', nome: 'Beto', persona: 'pc-mago' }).ok);
  assert.equal(s.avatares[BETO].persona, 'pc-mago');
  assert.ok(faz(s, CAIO, { tipo: 'entrar', nome: 'Caio', persona: 'pc-druida' }).ok);
  assert.equal(s.avatares[CAIO].persona, PERSONA_PADRAO, 'a druida ainda não tem arte: cai no padrão');
  assert.ok(faz(s, CAIO, { tipo: 'persona', heroi: 'pc-paladino' }).ok);
  assert.equal(s.avatares[CAIO].persona, 'pc-paladino');
  deve(faz(s, CAIO, { tipo: 'persona', heroi: 'pc-druida' }), /arte/);
  deve(faz(s, CAIO, { tipo: 'persona', heroi: 'xx' }), /arte/);
  assert.equal(faz(s, CAIO, { tipo: 'persona', heroi: 'pc-paladino' }).igual, true);
});

/** Uma sala com a partida iniciada: o anfitrião ANF e o Beto, quatro heróis. */
function salaIniciada() {
  const s = nova();
  entra(s, BETO, 'Beto');
  for (const h of ['pc-guerreiro', 'pc-ladino', 'pc-clerigo']) faz(s, ANF, { tipo: 'pegar', heroi: h });
  for (const h of ['pc-mago']) faz(s, BETO, { tipo: 'pegar', heroi: h });
  faz(s, ANF, { tipo: 'pronto', valor: true }); faz(s, BETO, { tipo: 'pronto', valor: true });
  assert.ok(faz(s, ANF, { tipo: 'iniciar' }).ok);
  return s;
}
const encDeTeste = () => {
  const herois = ['pc-mago', 'pc-guerreiro'].map((id, i) => { const h = montarHeroi(id, escolhaAutomatica(id)); h.pos = { x: 1 + i, y: 2 }; return h; });
  return { combatants: [...herois, ...buildFoes('emboscada')], round: 1, side: 'party', over: false };
};

teste('F4: a vista da partida vai e volta: o espelho fica com os mesmos combatentes, e dá o que mudou para animar', () => {
  const enc = encDeTeste();
  const v1 = fotografar({ enc, variante: 'emboscada' });
  assert.ok(lerVista(JSON.parse(emTexto(v1))), 'sobrevive ao JSON');
  assert.ok(emTexto(v1).length < MAX_VISTA / 4, 'uma partida de quatro heróis e quatro goblins é bem menor que o teto');
  const espelho = { combatants: [], round: 0, side: null, over: false };
  const r1 = aplicarVista(espelho, JSON.parse(emTexto(v1)));
  assert.equal(r1.entraram.length, enc.combatants.length);
  assert.deepEqual(espelho.combatants.map((c) => [c.id, c.pos.x, c.pos.y, c.hp]), enc.combatants.map((c) => [c.id, c.pos.x, c.pos.y, c.hp]));
  const mago = espelho.combatants.find((c) => c.id === 'pc-mago');
  enc.combatants[0].pos = { x: 4, y: 3 }; enc.combatants[0].hp -= 3; enc.combatants.pop(); enc.round = 2;
  const r2 = aplicarVista(espelho, JSON.parse(emTexto(fotografar({ enc, variante: 'emboscada' }))));
  assert.equal(espelho.combatants.find((c) => c.id === 'pc-mago'), mago, 'o MESMO objeto: o desenho guarda a animação de cada um');
  assert.deepEqual(r2.moveram.map((m) => [m.c.id, m.de, m.para]), [['pc-mago', { x: 1, y: 2 }, { x: 4, y: 3 }]]);
  assert.equal(r2.sairam.length, 1); assert.equal(espelho.combatants.length, enc.combatants.length); assert.equal(espelho.round, 2);
  assert.equal(mago.hp, enc.combatants[0].hp);
});

teste('F5.3: o evento do motor vai como dado (combatentes viram id) e volta apontando para os combatentes do espelho', () => {
  const enc = encDeTeste();
  const [mago, guerreiro] = enc.combatants; const goblin = enc.combatants.find((c) => c.side !== 'party'); const gid = goblin.id;
  const ataque = { type: 'attack', attacker: guerreiro, target: goblin, weaponName: 'Espada longa', art: 'sword', hit: true, damage: 7, nested: { quem: [mago] } };
  const dado = empacotarEvento(enc, ataque);
  assert.deepEqual(dado.attacker, { $c: 'pc-guerreiro' }); assert.deepEqual(dado.target, { $c: gid }); assert.deepEqual(dado.nested.quem, [{ $c: 'pc-mago' }]);
  assert.equal(dado.weaponName, 'Espada longa'); assert.ok(JSON.stringify(dado).length < 400, 'sem copiar o combatente inteiro');
  // O cliente tem OUTROS objetos com os mesmos ids (o espelho).
  const espelho = { combatants: [], round: 0, side: null, over: false };
  aplicarVista(espelho, JSON.parse(emTexto(fotografar({ enc, variante: 'emboscada' }))));
  const volta = desempacotarEvento(espelho, JSON.parse(JSON.stringify(dado)));
  assert.equal(volta.attacker, espelho.combatants.find((c) => c.id === 'pc-guerreiro'), 'aponta para o combatente do ESPELHO');
  assert.equal(volta.target, espelho.combatants.find((c) => c.id === gid));
  assert.notEqual(volta.attacker, guerreiro);
  assert.equal(volta.nested.quem[0].id, 'pc-mago');
  // Quem sumiu do espelho vira null (a tela guarda).
  espelho.combatants.splice(espelho.combatants.indexOf(volta.target), 1);
  assert.equal(desempacotarEvento(espelho, dado).target, null);
  // Só os eventos visuais viajam; o resto do motor, não.
  assert.equal(empacotarEvento(enc, { type: 'sideStart', side: 'foes' }), null);
  assert.equal(empacotarEvento(enc, { type: 'damage', target: goblin, amount: 4, grande: 'x'.repeat(5000) }), null, 'evento grande demais fica de fora');
  assert.ok(['attack', 'spell', 'damage', 'heal', 'moved', 'died'].every((t) => EVENTOS_VISUAIS.has(t)));
  assert.equal(empacotarEvento(enc, { type: 'damage', target: goblin, amount: 4, cb: () => 1 }).cb, undefined, 'função não viaja');
});

teste('F4: o invocado que aponta para o dono não quebra a vista (referência circular vira null)', () => {
  const enc = encDeTeste();
  const dono = enc.combatants[0]; const familiar = { id: 'fam-1', name: 'Familiar', side: 'party', pos: { x: 3, y: 3 }, hp: 1, maxHp: 1, dono };
  dono.familiar = familiar;
  enc.combatants.push(familiar);
  assert.ok(lerVista(JSON.parse(emTexto(fotografar({ enc, variante: 'emboscada' })))));
});

teste('F4: lerVista recusa o que não é vista (versão, mapa, combatente sem casa)', () => {
  const boa = fotografar({ enc: encDeTeste(), variante: 'emboscada' });
  assert.ok(lerVista(boa));
  assert.equal(lerVista(null), null); assert.equal(lerVista('não é json'), null);
  assert.equal(lerVista({ ...boa, v: 99 }), null);
  assert.equal(lerVista({ ...boa, variante: 7 }), null);
  assert.equal(lerVista({ ...boa, combatentes: [{ id: 'x' }] }), null);
  assert.equal(lerVista({ ...boa, combatentes: [{ id: 'x', pos: { x: 1.5, y: 2 } }] }), null);
});

teste('F4: o servidor só repassa a vista do anfitrião, com a partida iniciada, dentro do teto e do ritmo', () => {
  const s = salaIniciada();
  const vista = fotografar({ enc: encDeTeste(), variante: 'emboscada' });
  const bruto = JSON.stringify({ tipo: 'partida', vista });
  assert.equal(ehVista(bruto), true); assert.equal(ehVista('{"tipo":"mover","x":1,"y":2}'), false);
  const ok = tratarVista({ sala: s, jogadorId: ANF, bruto, agora: 10_000, ultimaEm: 0 });
  assert.equal(ok.ok, true); assert.deepEqual(JSON.parse(ok.texto).vista.combatentes.length, vista.combatentes.length);
  assert.match(tratarVista({ sala: s, jogadorId: BETO, bruto, agora: 10_000 }).erro, /anfitrião/);
  const dev = tratarVista({ sala: s, jogadorId: ANF, bruto, agora: 10_000 + MS_ENTRE_VISTAS - 1, ultimaEm: 10_000 });
  assert.equal(dev.ok, false); assert.equal(dev.calado, true);
  assert.equal(tratarVista({ sala: s, jogadorId: ANF, bruto, agora: 10_000 + MS_ENTRE_VISTAS, ultimaEm: 10_000 }).ok, true);
  assert.match(tratarVista({ sala: s, jogadorId: ANF, bruto: 'x'.repeat(MAX_VISTA + 300), agora: 99_000 }).erro, /grande/);
  assert.match(tratarVista({ sala: s, jogadorId: ANF, bruto: '{"tipo":"partida","vista":{"v":1}}', agora: 99_000 }).erro, /inválida/);
  assert.match(tratarVista({ sala: s, jogadorId: ANF, bruto: 'não é json', agora: 99_000 }).erro, /inválida/);
  const lobby = nova();
  assert.match(tratarVista({ sala: lobby, jogadorId: ANF, bruto, agora: 99_000 }).erro, /não está em andamento/);
});

teste('F4.3: agir: o servidor só repassa o passo de quem é DONO do herói, com a partida iniciada, e não muda a sala', () => {
  const s = salaIniciada();
  const antes = JSON.stringify(visaoDaSala(s, ANF));
  const r = faz(s, BETO, { tipo: 'agir', acao: 'mover', heroi: 'pc-mago', x: 7, y: 9 });
  assert.ok(r.ok); assert.equal(r.igual, true);
  assert.deepEqual(r.repassar, { tipo: 'agir', de: 'p2', heroi: 'pc-mago', acao: 'mover', x: 7, y: 9 });
  assert.equal(JSON.stringify(visaoDaSala(s, ANF)), antes, 'agir não mexe no estado da sala');
  deve(faz(s, BETO, { tipo: 'agir', acao: 'mover', heroi: 'pc-guerreiro', x: 7, y: 9 }), /não é seu/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'mover', heroi: 'xx', x: 7, y: 9 }), /não é seu/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'dancar', heroi: 'pc-mago', x: 7, y: 9 }), /desconhecida/);
  // F5: atacar leva o id do alvo (e a arma, se houver); terminar só o herói.
  assert.deepEqual(faz(s, BETO, { tipo: 'agir', acao: 'atacar', heroi: 'pc-mago', alvo: 'goblin-1', arma: 'cajado' }).repassar,
    { tipo: 'agir', de: 'p2', heroi: 'pc-mago', acao: 'atacar', alvo: 'goblin-1', arma: 'cajado' });
  assert.equal(faz(s, BETO, { tipo: 'agir', acao: 'atacar', heroi: 'pc-mago', alvo: 'goblin-1' }).repassar.arma, null);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'atacar', heroi: 'pc-mago' }), /alvo inválido/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'atacar', heroi: 'pc-mago', alvo: 7 }), /alvo inválido/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'atacar', heroi: 'pc-mago', alvo: 'g', arma: 7 }), /arma inválida/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'atacar', heroi: 'pc-guerreiro', alvo: 'goblin-1' }), /não é seu/);
  assert.deepEqual(faz(s, BETO, { tipo: 'agir', acao: 'terminar', heroi: 'pc-mago' }).repassar, { tipo: 'agir', de: 'p2', heroi: 'pc-mago', acao: 'terminar' });
  deve(faz(s, BETO, { tipo: 'agir', acao: 'terminar', heroi: 'pc-guerreiro' }), /não é seu/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'mover', heroi: 'pc-mago', x: -1, y: 9 }), /inexistente/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'mover', heroi: 'pc-mago', x: 1.5, y: 9 }), /inexistente/);
  deve(faz(s, ANF, { tipo: 'agir', acao: 'mover', heroi: 'pc-guerreiro', x: 7, y: 9 }), /própria tela/);
  deve(faz(nova(), ANF, { tipo: 'agir', acao: 'mover', heroi: 'pc-guerreiro', x: 7, y: 9 }), /não está em andamento/);
  const bruto = JSON.stringify({ tipo: 'agir', acao: 'mover', heroi: 'pc-mago', x: 3, y: 4 });
  const t = tratarMensagem({ sala: s, jogadorId: BETO, bruto, codigo: s.codigo, agora: 5000 });
  assert.equal(t.mudou, false); assert.equal(t.repassar.heroi, 'pc-mago');
});

teste('F4.3/J-20: a resposta é de qualquer jogador que não é o anfitrião, com id e índice válidos, e diz de quem veio (quem decide é o jogo)', () => {
  const s = salaIniciada();
  const r = faz(s, BETO, { tipo: 'resposta', id: 3, indice: 2 });
  assert.deepEqual(r.repassar, { tipo: 'resposta', id: 3, indice: 2, continuar: false, de: 'p2' });
  assert.deepEqual(faz(s, BETO, { tipo: 'resposta', id: 4, continuar: true }).repassar, { tipo: 'resposta', id: 4, indice: null, continuar: true, de: 'p2' });
  deve(faz(s, BETO, { tipo: 'resposta', id: 0, indice: 0 }), /inválida/);
  deve(faz(s, BETO, { tipo: 'resposta', id: 1, indice: -1 }), /inválida/);
  deve(faz(s, BETO, { tipo: 'resposta', id: 1, indice: 'a' }), /inválida/);
  deve(faz(s, ANF, { tipo: 'resposta', id: 1, indice: 0 }), /própria tela/);
  deve(faz(nova(), BETO, { tipo: 'resposta', id: 1, indice: 0 }), /não está em andamento|não está nesta sala/);
});

teste('J-20: quem decide a narrativa: o jogador do herói que a começou; decisão geral, votação; sozinho, quem sobrou', () => {
  const s = salaIniciada();
  const v = () => visaoDaSala(s, ANF);
  assert.deepEqual(quemDecide({ ator: 'pc-mago', visao: v() }), { modo: 'ator', pub: 'p2' }, 'o mago é do Beto');
  assert.deepEqual(quemDecide({ ator: 'pc-guerreiro', visao: v() }), { modo: 'ator', pub: 'p1' });
  const geral = quemDecide({ ator: null, visao: v() });
  assert.equal(geral.modo, 'votacao'); assert.deepEqual(geral.votantes, ['p1', 'p2']); assert.equal(geral.desempate, 'p1', 'o líder desempata');
  desconectar(s, BETO, 1000);
  assert.deepEqual(quemDecide({ ator: 'pc-mago', visao: v() }), { modo: 'ator', pub: 'p1' }, 'o dono caiu e só sobrou o anfitrião: ele decide');
  assert.deepEqual(quemDecide({ ator: null, visao: v() }), { modo: 'ator', pub: 'p1' }, 'sozinho não há votação');
  assert.ok(faz(s, BETO, { tipo: 'entrar', nome: 'Beto' }, 2000).ok);
  s.herois['pc-clerigo'] = 'piloto';
  assert.deepEqual(quemDecide({ ator: 'pc-clerigo', visao: v() }), { modo: 'ator', pub: 'p1' }, 'o herói que sobrou é do anfitrião: ele decide por ele');
  s.cedidos['pc-clerigo'] = BETO;
  assert.equal(quemDecide({ ator: 'pc-clerigo', visao: v() }).modo, 'votacao', 'herói cedido pelo dono ausente não tem jogador: vota o grupo');
  assert.equal(quemDecide({ ator: 'pc-mago', visao: null }).modo, 'ator');
  assert.equal(possoEscolher({ modo: 'ator', pub: 'p2' }, 'p2'), true); assert.equal(possoEscolher({ modo: 'ator', pub: 'p2' }, 'p1'), false);
  assert.equal(possoEscolher({ modo: 'votacao', votantes: ['p1', 'p2'] }, 'p1'), true); assert.equal(possoEscolher({ modo: 'leitura' }, 'p1'), false); assert.equal(possoEscolher(null, 'p1'), false);
});

teste('J-20: a apuração da votação: maioria, empate pelo líder, bloqueadas fora, sem voto a primeira livre', () => {
  const votos = (o) => new Map(Object.entries(o));
  assert.equal(apurar({ votos: votos({ p1: 1, p2: 1, p3: 0 }), nEscolhas: 3 }), 1, 'maioria');
  assert.equal(apurar({ votos: votos({ p1: 2, p2: 0 }), nEscolhas: 3, desempate: 'p1' }), 2, 'empate: o voto do líder');
  assert.equal(apurar({ votos: votos({ p1: 2, p2: 0 }), nEscolhas: 3, desempate: 'p2' }), 0);
  assert.equal(apurar({ votos: votos({ p1: 2, p2: 0, p3: 1 }), nEscolhas: 3, desempate: 'p9' }), 0, 'líder fora do empate: menor índice');
  assert.equal(apurar({ votos: votos({ p1: 1, p2: 1 }), nEscolhas: 3, bloqueadas: new Set([1]) }), 0, 'voto em escolha cinza não conta');
  assert.equal(apurar({ votos: votos({}), nEscolhas: 3, bloqueadas: new Set([0]) }), 1, 'sem voto: a primeira livre');
  assert.equal(apurar({ votos: votos({}), nEscolhas: 2, bloqueadas: new Set([0, 1]) }), null, 'tudo bloqueado');
  assert.equal(apurar({ votos: votos({ p1: 9 }), nEscolhas: 2 }), 0, 'índice fora da lista não conta');
});

teste('F4.3: a narrativa do anfitrião: só dele, com a partida iniciada, e no formato abrir/fechar', () => {
  const s = salaIniciada();
  const abrir = JSON.stringify({ tipo: 'narrativa', msg: { tipo: 'abrir', id: 1, pedido: { formato: 'tela', paginas: [{ texto: ['oi'] }], escolhas: null } } });
  assert.equal(ehNarrativa(abrir), true); assert.equal(ehNarrativa('{"tipo":"partida"}'), false);
  const ok1 = tratarNarrativa({ sala: s, jogadorId: ANF, bruto: abrir });
  assert.equal(ok1.ok, true); assert.equal(JSON.parse(ok1.texto).msg.id, 1);
  assert.equal(tratarNarrativa({ sala: s, jogadorId: ANF, bruto: JSON.stringify({ tipo: 'narrativa', msg: { tipo: 'fechar', id: 1, indice: null } }) }).ok, true);
  assert.match(tratarNarrativa({ sala: s, jogadorId: BETO, bruto: abrir }).erro, /anfitrião/);
  assert.match(tratarNarrativa({ sala: nova(), jogadorId: ANF, bruto: abrir }).erro, /não está em andamento/);
  assert.match(tratarNarrativa({ sala: s, jogadorId: ANF, bruto: JSON.stringify({ tipo: 'narrativa', msg: { tipo: 'abrir', id: 'x' } }) }).erro, /inválida/);
  assert.match(tratarNarrativa({ sala: s, jogadorId: ANF, bruto: JSON.stringify({ tipo: 'narrativa', msg: { tipo: 'abrir', id: 1 } }) }).erro, /inválida/);
  assert.match(tratarNarrativa({ sala: s, jogadorId: ANF, bruto: 'x'.repeat(70_000) }).erro, /grande/);
});

teste('F5.2: usar: o servidor confere só a FORMA da ação da barra; o direito de fazê-la é do motor do anfitrião', () => {
  const s = salaIniciada();
  const r = faz(s, BETO, { tipo: 'agir', acao: 'usar', heroi: 'pc-mago', action: { kind: 'spell', spellId: 'misselMagico' }, circulo: 2, tiles: [{ x: 5, y: 6 }] });
  assert.ok(r.ok); assert.deepEqual(r.repassar, { tipo: 'agir', de: 'p2', heroi: 'pc-mago', acao: 'usar', action: { kind: 'spell', spellId: 'misselMagico' }, circulo: 2, tiles: [{ x: 5, y: 6 }] });
  assert.deepEqual(faz(s, BETO, { tipo: 'agir', acao: 'usar', heroi: 'pc-mago', action: { kind: 'dash' } }).repassar.tiles, [], 'sem casas: lista vazia');
  deve(faz(s, BETO, { tipo: 'agir', acao: 'usar', heroi: 'pc-mago', action: { kind: 'hackear' } }), /inválida/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'usar', heroi: 'pc-mago' }), /inválida/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'usar', heroi: 'pc-mago', action: { kind: 'spell', spellId: 'x'.repeat(50) } }), /inválida/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'usar', heroi: 'pc-mago', action: { kind: 'dash' }, tiles: Array(7).fill({ x: 1, y: 1 }) }), /inválida/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'usar', heroi: 'pc-mago', action: { kind: 'dash' }, tiles: [{ x: 1.5, y: 1 }] }), /inválida/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'usar', heroi: 'pc-mago', action: { kind: 'dash' }, circulo: 12 }), /inválida/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'usar', heroi: 'pc-guerreiro', action: { kind: 'dash' } }), /não é seu/);
  assert.equal(acaoRemotaValida({ kind: 'attack', weaponId: 'cajado' }), true);
  assert.equal(acaoRemotaValida({ kind: 'item', itemId: 'pocaoCura', mira: false }), true);
  assert.equal(acaoRemotaValida({ kind: 'item', mira: 'sim' }), false);
  assert.equal(acaoRemotaValida([]), false); assert.equal(acaoRemotaValida(null), false);
  assert.equal(tilesValidos(undefined), true); assert.equal(circuloValido(null), true);
  assert.equal(circuloValido(0), true, 'o truque é o círculo 0 (a barra o manda assim)'); assert.equal(circuloValido(10), false); assert.equal(circuloValido(-1), false);
  assert.ok(faz(salaIniciada(), BETO, { tipo: 'agir', acao: 'usar', heroi: 'pc-mago', action: { kind: 'spell', spellId: 'raioDeFogo' }, circulo: 0, tiles: [{ x: 12, y: 7 }] }).ok);
});

teste('F5.2: o que o convidado manda na hora e o que espera um alvo é a MESMA regra do anfitrião', () => {
  const fogo = getSpell('misselMagico');
  assert.ok(fogo, 'a magia de teste existe');
  assert.equal(mandaNaHora({ kind: 'dash' }), true);
  assert.equal(mandaNaHora({ kind: 'dodge' }), true);
  assert.equal(mandaNaHora({ kind: 'attack', weaponId: 'cajado' }), false, 'ataque espera o alvo');
  assert.equal(mandaNaHora({ kind: 'salto' }), false);
  assert.equal(mandaNaHora({ kind: 'item', itemId: 'pocaoCura' }), true, 'poção bebida na hora');
  assert.equal(mandaNaHora({ kind: 'item', itemId: 'frascoDeAcido', mira: true }), false, 'item arremessado espera o alvo');
  assert.equal(mandaNaHora({ kind: 'spell', spellId: fogo.id }, fogo, false), magiaNaHora(fogo, false));
  assert.equal(magiaNaHora({ kind: 'tempHp' }, false), true);
  assert.equal(magiaNaHora({ kind: 'buff', rangeFt: 0 }, false), true);
  assert.equal(magiaNaHora({ kind: 'buff', rangeFt: 30 }, false), false);
  assert.equal(magiaNaHora({ kind: 'lamina' }, false), true); assert.equal(magiaNaHora({ kind: 'lamina' }, true), false, 'lâmina já ativa pede alvo');
  assert.equal(escolheVarios({ kind: 'raios' }), true); assert.equal(escolheVarios({ kind: 'save', alvos: 3 }), true); assert.equal(escolheVarios({ kind: 'save' }), false);
});

teste('F6.2: o piloto joga os heróis de quem caiu e os postos no piloto, nunca os do anfitrião nem os de quem está presente', () => {
  const s = salaIniciada();
  const eu = (para) => visaoDaSala(s, para);
  assert.deepEqual([...heroisDoPiloto(eu(ANF))], [], 'todos presentes: nada para o piloto');
  desconectar(s, BETO, 5000);
  assert.deepEqual([...heroisDoPiloto(eu(ANF))], ['pc-mago'], 'o herói do Beto');
  assert.deepEqual([...heroisDoPiloto(eu(BETO))], [], 'os heróis do anfitrião presente não vão para o piloto, de onde quer que se olhe')
  assert.ok(faz(s, BETO, { tipo: 'entrar', nome: 'Beto' }, 9000).ok);
  assert.deepEqual([...heroisDoPiloto(eu(ANF))], [], 'o dono voltou: os heróis são dele de novo');
  s.herois['pc-ladino'] = 'piloto';
  assert.deepEqual([...heroisDoPiloto(eu(ANF))], [], 'o herói que SOBROU (posto no piloto no lobby) é do anfitrião: ele o controla, o piloto não joga');
  s.cedidos['pc-ladino'] = BETO;
  assert.deepEqual([...heroisDoPiloto(eu(ANF))], ['pc-ladino'], 'o cedido por quem estava ausente no começo é do piloto');
  delete s.cedidos['pc-ladino'];
  assert.deepEqual([...heroisDoPiloto(null)], []);
});

teste('controle: cada jogador controla o seu herói; o anfitrião, também os que sobraram — e só ele', () => {
  const s = salaIniciada();
  const v = (de) => visaoDaSala(s, de);
  assert.equal(controlaOHeroi(v(ANF), 'pc-guerreiro'), true); assert.equal(controlaOHeroi(v(ANF), 'pc-mago'), false, 'o do Beto não');
  assert.equal(controlaOHeroi(v(BETO), 'pc-mago'), true); assert.equal(controlaOHeroi(v(BETO), 'pc-guerreiro'), false);
  s.herois['pc-clerigo'] = 'piloto';
  assert.equal(controlaOHeroi(v(ANF), 'pc-clerigo'), true, 'o que sobrou é do anfitrião');
  assert.equal(controlaOHeroi(v(BETO), 'pc-clerigo'), false, 'e de mais ninguém');
  s.cedidos['pc-clerigo'] = BETO;
  assert.equal(controlaOHeroi(v(ANF), 'pc-clerigo'), false, 'o cedido por ausência é do piloto, não do anfitrião');
  assert.equal(controlaOHeroi(null, 'pc-mago'), true, 'fora de sala (solo) controla tudo');
  assert.deepEqual(visaoDaSala(s, ANF).cedidos, ['pc-clerigo']);
  assert.equal(limiteDeHerois(nova(), ANF), 4);
  const t = nova(); entra(t, BETO, 'Beto');
  assert.equal(limiteDeHerois(t, ANF), 3, 'o anfitrião deixa um para o outro jogador'); assert.equal(limiteDeHerois(t, BETO), 1, 'cada convidado tem um');
});

teste('F6.2: a jogada do piloto: ataca o inimigo vivo mais perto com a arma na mão; sem alvo, arma ou ação, só termina o turno', () => {
  const h = (id, x, y, extra = {}) => ({ id, side: 'party', pos: { x, y }, hp: 8, dead: false, acted: false, actionUsed: false, equippedWeapon: 'espadaLonga', ...extra });
  const g = (id, x, y, extra = {}) => ({ id, side: 'foes', pos: { x, y }, hp: 7, dead: false, ...extra });
  const heroi = h('pc-guerreiro', 5, 5);
  const todos = [heroi, g('goblin-2', 9, 5), g('goblin-1', 7, 5), g('goblin-3', 7, 5), g('morto', 6, 5, { dead: true, hp: 0 })];
  assert.equal(inimigoMaisPerto(heroi, todos).id, 'goblin-1', 'o mais perto; no empate, o de menor id; o morto não conta');
  assert.deepEqual(jogadaDoPiloto(heroi, todos), { tipo: 'atacar', alvo: todos[2], arma: 'espadaLonga' });
  assert.equal(jogadaDoPiloto(h('x', 0, 0, { equippedWeapon: null }), todos).tipo, 'terminar', 'sem arma na mão');
  assert.equal(jogadaDoPiloto(h('x', 0, 0, { actionUsed: true }), todos).tipo, 'terminar', 'a ação já foi usada');
  assert.equal(jogadaDoPiloto(heroi, [heroi]).tipo, 'terminar', 'sem inimigo');
  assert.equal(jogadaDoPiloto(h('x', 0, 0, { acted: true }), todos).tipo, 'nada', 'já terminou o turno');
  assert.equal(jogadaDoPiloto(h('x', 0, 0, { hp: 0 }), todos).tipo, 'nada', 'caído não joga');
  assert.equal(inimigoMaisPerto(heroi, [heroi]), null);
});

teste('F6: o anfitrião caído passa o posto, depois da graça, ao primeiro conectado; quem volta antes não perde nada', () => {
  const s = salaIniciada();
  const t0 = 100_000;
  assert.equal(promoverAnfitriao(s, t0).ok, false, 'anfitrião presente: nada a passar');
  desconectar(s, ANF, t0);
  assert.equal(s.anfitriaoAusenteDesde, t0);
  assert.equal(promoverAnfitriao(s, t0 + GRACA_DO_ANFITRIAO_MS - 1).ok, false, 'dentro da graça espera');
  // A aba que recarrega volta a tempo: o posto continua dele e a contagem zera.
  assert.ok(faz(s, ANF, { tipo: 'entrar', nome: 'N' }, t0 + 5000).ok);
  assert.equal(s.anfitriaoAusenteDesde, null);
  assert.equal(promoverAnfitriao(s, t0 + 60_000).ok, false);
  // Cai de verdade: passada a graça, o posto vai ao Beto, e o líder da narrativa vai junto (era o anfitrião).
  desconectar(s, ANF, t0 + 70_000);
  const r = promoverAnfitriao(s, t0 + 70_000 + GRACA_DO_ANFITRIAO_MS);
  assert.ok(r.ok); assert.equal(r.novo, BETO); assert.equal(r.antigo, ANF);
  assert.equal(s.anfitriao, BETO); assert.equal(s.lider, BETO); assert.equal(s.trocasDeAnfitriao, 1);
  assert.equal(visaoDaSala(s, BETO).anfitriao, 'p2'); assert.equal(visaoDaSala(s, BETO).voce, 'p2');
  // Os heróis continuam de quem eram; o antigo anfitrião, ao voltar, entra como jogador comum.
  assert.equal(s.herois['pc-guerreiro'], ANF);
  assert.ok(faz(s, ANF, { tipo: 'entrar', nome: 'N' }, t0 + 200_000).ok);
  assert.equal(s.anfitriao, BETO); assert.equal(s.anfitriaoAusenteDesde, null);
  deve(faz(s, ANF, { tipo: 'iniciar' }), /anfitrião/);
  deve(faz(s, ANF, { tipo: 'corda', valor: 'livre' }), /anfitrião/);
  // Sem ninguém conectado para assumir, o posto não passa.
  const so = salaIniciada(); desconectar(so, ANF, t0); desconectar(so, BETO, t0);
  assert.equal(promoverAnfitriao(so, t0 + 10 * GRACA_DO_ANFITRIAO_MS).ok, false);
  // No lobby não há partida a retomar.
  assert.equal(promoverAnfitriao(nova(), t0).ok, false);
});

teste('F6: o servidor guarda o save que SÓ o anfitrião manda, com a partida iniciada, e só com a cara de um save', () => {
  const s = salaIniciada();
  const save = { versao: 1, herois: [{ id: 'pc-mago' }], config: { modo: 'campanha' }, campanha: {} };
  const bruto = JSON.stringify({ tipo: 'salvar', save });
  assert.equal(ehSave(bruto), true); assert.equal(ehSave('{"tipo":"partida"}'), false);
  const ok1 = tratarSave({ sala: s, jogadorId: ANF, bruto });
  assert.equal(ok1.ok, true); assert.deepEqual(JSON.parse(ok1.texto), save);
  assert.match(tratarSave({ sala: s, jogadorId: BETO, bruto }).erro, /anfitrião/);
  assert.match(tratarSave({ sala: nova(), jogadorId: ANF, bruto }).erro, /não está em andamento/);
  assert.match(tratarSave({ sala: s, jogadorId: ANF, bruto: 'x'.repeat(MAX_SAVE + 10) }).erro, /grande/);
  assert.match(tratarSave({ sala: s, jogadorId: ANF, bruto: 'não é json' }).erro, /inválido/);
  for (const ruim of [{ herois: [], config: {} }, { herois: 'x', config: {} }, { herois: [{}] }, null]) {
    assert.match(tratarSave({ sala: s, jogadorId: ANF, bruto: JSON.stringify({ tipo: 'salvar', save: ruim }) }).erro, /inválido/);
  }
});

teste('loja e ficha: cada jogador compra, vende e equipa SÓ para o herói dele; o servidor confere a forma', () => {
  const s = salaIniciada();
  assert.deepEqual(faz(s, BETO, { tipo: 'agir', acao: 'comprar', heroi: 'pc-mago', item: 'adaga' }).repassar, { tipo: 'agir', de: 'p2', heroi: 'pc-mago', acao: 'comprar', item: 'adaga' });
  assert.deepEqual(faz(s, BETO, { tipo: 'agir', acao: 'vender', heroi: 'pc-mago', item: 'corda' }).repassar.acao, 'vender');
  deve(faz(s, BETO, { tipo: 'agir', acao: 'comprar', heroi: 'pc-guerreiro', item: 'adaga' }), /não é seu/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'comprar', heroi: 'pc-mago' }), /item inválido/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'vender', heroi: 'pc-mago', item: 'x'.repeat(41) }), /item inválido/);
  deve(faz(s, ANF, { tipo: 'agir', acao: 'comprar', heroi: 'pc-guerreiro', item: 'adaga' }), /própria tela/);
  assert.deepEqual(faz(s, BETO, { tipo: 'agir', acao: 'equipar', heroi: 'pc-mago', slot: 'armadura', item: 'couro' }).repassar,
    { tipo: 'agir', de: 'p2', heroi: 'pc-mago', acao: 'equipar', slot: 'armadura', item: 'couro' });
  assert.equal(faz(s, BETO, { tipo: 'agir', acao: 'equipar', heroi: 'pc-mago', slot: 'escudo' }).repassar.item, null, 'sem item: guarda o encaixe');
  deve(faz(s, BETO, { tipo: 'agir', acao: 'equipar', heroi: 'pc-mago', slot: 'capacete', item: 'x' }), /encaixe inexistente/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'equipar', heroi: 'pc-mago', slot: 'armadura', item: 7 }), /item inválido/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'equipar', heroi: 'pc-guerreiro', slot: 'armadura', item: 'couro' }), /não é seu/);
  const abrir = JSON.stringify({ tipo: 'narrativa', msg: { tipo: 'loja-abrir', id: 4, lojaId: 'barthen', npc: { name: 'Elmar', look: null } } });
  assert.equal(tratarNarrativa({ sala: s, jogadorId: ANF, bruto: abrir }).ok, true);
  assert.equal(tratarNarrativa({ sala: s, jogadorId: ANF, bruto: JSON.stringify({ tipo: 'narrativa', msg: { tipo: 'loja-fechar', id: 4 } }) }).ok, true);
  assert.match(tratarNarrativa({ sala: s, jogadorId: BETO, bruto: abrir }).erro, /anfitrião/);
  assert.match(tratarNarrativa({ sala: s, jogadorId: ANF, bruto: JSON.stringify({ tipo: 'narrativa', msg: { tipo: 'loja-abrir', id: 4 } }) }).erro, /inválida/);
});

teste('descanso rápido: qualquer jogador pode PEDIR (o grupo vota); só com a partida em andamento e nunca o anfitrião pelo servidor', () => {
  const s = salaIniciada();
  assert.deepEqual(faz(s, BETO, { tipo: 'agir', acao: 'descanso' }).repassar, { tipo: 'agir', de: 'p2', acao: 'descanso', descanso: 'curto' });
  assert.equal(faz(s, BETO, { tipo: 'agir', acao: 'descanso', descanso: 'longo' }).repassar.descanso, 'longo');
  deve(faz(s, BETO, { tipo: 'agir', acao: 'descanso', descanso: 'eterno' }), /descanso inválido/);
  assert.ok(faz(s, BETO, { tipo: 'agir', acao: 'descanso', heroi: 'pc-mago' }).ok, 'sem herói à frente: o pedido é do jogador');
  deve(faz(s, ANF, { tipo: 'agir', acao: 'descanso' }), /própria tela/);
  deve(faz(nova(), BETO, { tipo: 'agir', acao: 'descanso' }), /não está em andamento|não está nesta sala/);
});

teste('J-20/vila: o destino é votação do JOGADOR (não de herói): maioria, empate pelo líder, sem voto nada', () => {
  const votos = (o) => new Map(Object.entries(o));
  assert.equal(apurarLugar({ votos: votos({ p1: 'taverna', p2: 'loja', p3: 'loja' }) }), 'loja');
  assert.equal(apurarLugar({ votos: votos({ p1: 'taverna', p2: 'loja' }), desempate: 'p2' }), 'loja', 'o líder desempata');
  assert.equal(apurarLugar({ votos: votos({ p1: 'taverna', p2: 'loja' }), desempate: 'p1' }), 'taverna');
  assert.equal(apurarLugar({ votos: votos({ p1: 'taverna', p2: 'loja' }), desempate: 'p9' }), 'loja', 'fora do empate: ordem alfabética, previsível');
  assert.equal(apurarLugar({ votos: votos({}) }), null);
  const s = salaIniciada();
  const r = faz(s, BETO, { tipo: 'agir', acao: 'lugar', lugar: 'ferraria' });
  assert.deepEqual(r.repassar, { tipo: 'agir', de: 'p2', acao: 'lugar', lugar: 'ferraria' });
  assert.ok(faz(s, BETO, { tipo: 'agir', acao: 'lugar', lugar: 'ferraria', heroi: 'pc-guerreiro' }).ok, 'o voto não depende de herói');
  deve(faz(s, BETO, { tipo: 'agir', acao: 'lugar' }), /lugar inválido/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'lugar', lugar: 7 }), /lugar inválido/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'lugar', lugar: 'x'.repeat(41) }), /lugar inválido/);
  deve(faz(s, ANF, { tipo: 'agir', acao: 'lugar', lugar: 'loja' }), /própria tela/);
  deve(faz(nova(), BETO, { tipo: 'agir', acao: 'lugar', lugar: 'loja' }), /não está em andamento|não está nesta sala/);
});

teste('F4.4: a corda: só se vai para perto de ALGUM outro herói; o grupo estica em fila, mas não se parte', () => {
  const h = (id, x, y) => ({ id, pos: { x, y } });
  const a = h('a', 0, 0); const b = h('b', 10, 0); const c = h('c', 20, 0);
  const grupo = [a, b, c];
  assert.ok(LIMITE_DA_CORDA >= 8 && LIMITE_DA_CORDA <= 16, 'a doc diz ~12');
  assert.equal(cordaPermite({ heroi: b, destino: { x: 12, y: 3 }, grupo, modo: 'unido' }).ok, true, 'perto dos dois lados');
  assert.equal(cordaPermite({ heroi: a, destino: { x: 9, y: 9 }, grupo, modo: 'unido' }).ok, true, 'a diagonal conta como uma casa');
  const longe = cordaPermite({ heroi: a, destino: { x: -5, y: 40 }, grupo, modo: 'unido' });
  assert.equal(longe.ok, false); assert.match(longe.why, /separaria demais/);
  assert.equal(cordaPermite({ heroi: a, destino: { x: 0, y: 12 }, grupo, modo: 'unido' }).ok, true, 'exatamente no limite vale');
  assert.equal(cordaPermite({ heroi: a, destino: { x: 0, y: 13 }, grupo: [a, h('z', 0, 30)], modo: 'unido' }).ok, false);
  assert.equal(cordaPermite({ heroi: a, destino: { x: 99, y: 99 }, grupo, modo: 'livre' }).ok, true, 'livre: sem corda');
  assert.equal(cordaPermite({ heroi: a, destino: { x: 99, y: 99 }, grupo }).ok, true, 'o padrão é livre');
  assert.equal(cordaPermite({ heroi: a, destino: { x: 99, y: 99 }, grupo: [a], modo: 'unido' }).ok, true, 'sozinho em campo não tem de quem se afastar');
});

teste('F4.4: a corda é escolha do anfitrião, no lobby; o aviso do anfitrião vai a UM jogador só', () => {
  const s = nova();
  entra(s, BETO, 'Beto');
  assert.equal(visaoDaSala(s, ANF).corda, 'livre', 'o padrão é Livre: cada um vai aonde quiser');
  deve(faz(s, BETO, { tipo: 'corda', valor: 'livre' }), /anfitrião/);
  deve(faz(s, ANF, { tipo: 'corda', valor: 'solta' }), /inexistente/);
  assert.equal(faz(s, ANF, { tipo: 'corda', valor: 'livre' }).igual, true);
  assert.ok(faz(s, ANF, { tipo: 'corda', valor: 'unido' }).ok);
  assert.equal(visaoDaSala(s, BETO).corda, 'unido');
  for (const h of ['pc-guerreiro', 'pc-ladino', 'pc-clerigo']) faz(s, ANF, { tipo: 'pegar', heroi: h });
  for (const h of ['pc-mago']) faz(s, BETO, { tipo: 'pegar', heroi: h });
  faz(s, ANF, { tipo: 'pronto', valor: true }); faz(s, BETO, { tipo: 'pronto', valor: true });
  deve(faz(s, ANF, { tipo: 'aviso', para: 'p2', texto: 'oi' }), /não está em andamento/);
  assert.ok(faz(s, ANF, { tipo: 'iniciar' }).ok);
  deve(faz(s, ANF, { tipo: 'corda', valor: 'livre' }), /começou/);
  const r = faz(s, ANF, { tipo: 'aviso', para: 'p2', texto: ' o grupo se separaria demais ' });
  assert.deepEqual(r.repassarA, { id: BETO, msg: { tipo: 'aviso', texto: 'o grupo se separaria demais' } });
  assert.equal(r.igual, true);
  deve(faz(s, BETO, { tipo: 'aviso', para: 'p1', texto: 'x' }), /anfitrião/);
  deve(faz(s, ANF, { tipo: 'aviso', para: 'p9', texto: 'x' }), /inexistente/);
  deve(faz(s, ANF, { tipo: 'aviso', para: 'p1', texto: 'x' }), /inexistente/);
  deve(faz(s, ANF, { tipo: 'aviso', para: 'p2', texto: 'x'.repeat(200) }), /inválido/);
  const t = tratarMensagem({ sala: s, jogadorId: ANF, bruto: JSON.stringify({ tipo: 'aviso', para: 'p2', texto: 'devagar' }), codigo: s.codigo, agora: 5000 });
  assert.equal(t.repassarA.id, BETO); assert.equal(t.mudou, false);
});

teste('F4.4: a visão própria: cada jogador vê o que os SEUS heróis enxergam, e sem herói em campo vale o grupo todo', () => {
  // Um salão escuro de 30 x 3 e sem nenhuma luz: só a visão no escuro do herói A (18 m) enxerga, e só perto dele.
  // (Luz é do mundo, não de quem olha: uma tocha acesa por um herói ilumina para todos. O que muda por jogador é a visão.)
  const campo = new Battlefield(30, 3, ['.'.repeat(30), '.'.repeat(30), '.'.repeat(30)]);
  campo.luz = new Uint8Array(30 * 3);
  const heroi = (id, x, visao) => ({ id, side: 'party', name: id, dead: false, hp: 5, pos: { x, y: 1 }, conditions: [], senses: visao ? { darkvisionFt: visao } : {} });
  const a = heroi('a', 2, 60); const b = heroi('b', 27, 0);
  const enc = { field: campo, combatants: [a, b], zonas: [] };
  const todos = visaoDoGrupo(enc);
  const soA = visaoDoGrupo(enc, (c) => c.id === 'a');
  const soB = visaoDoGrupo(enc, (c) => c.id === 'b');
  assert.ok(todos.has('4,1') && soA.has('4,1'), 'o A enxerga perto de si');
  assert.ok(!soB.has('4,1'), 'quem só tem o B no escuro não vê o que só o A enxerga');
  assert.equal(visaoDoGrupo(enc, () => false).has('4,1'), true, 'sem nenhum herói próprio em campo, vale o grupo todo');
  assert.equal(visaoDoGrupo(enc), todos, 'o resultado do grupo todo não foi atropelado pelos filtrados');
  b.senses = { darkvisionFt: 60 }; b.pos = { x: 15, y: 1 };
  assert.ok(visaoDoGrupo(enc).has('15,1'), 'o grupo todo vê onde o B chegou');
  assert.equal(visaoDoGrupo(enc, (c) => c.id === 'a').has('15,1'), false, 'o filtro do A não vê o que é do B');
});

teste('T-09: o balcão do Toblen é o menu: todas as casas dele são mobília (ninguém anda até lá) e a mesa de grupo não é balcão', () => {
  const campo = campoDaTaverna();
  for (const c of BALCAO) { assert.equal(ehBalcao(c.x, c.y), true); assert.equal(campo.blocksMove(c.x, c.y), true, `${c.x},${c.y}`); }
  assert.equal(ehBalcao(8, 6), false); assert.equal(ehBalcao(5, 10), false);
  assert.equal(MAPA_TAVERNA.objetos.filter((o) => o.variante === 'taverna-toblen').length, 1);
  assert.ok(MAPA_TAVERNA.objetos.some((o) => o.variante === 'taverna-toblen' && ehBalcao(o.x, o.y)), 'o Toblen está no balcão');
});

teste('T-14: a conversa é de frases prontas: só ids conhecidos, devagar, e o contador faz a mesma frase valer de novo', () => {
  const s = nova();
  entra(s, BETO, 'Beto');
  assert.ok(faz(s, BETO, { tipo: 'emote', id: 'brinde' }, 5000).ok);
  const av = () => visaoDaSala(s, ANF).avatares.find((a) => a.nome === 'Beto');
  assert.equal(av().emote, 'brinde'); assert.equal(av().emoteN, 1);
  deve(faz(s, BETO, { tipo: 'emote', id: 'ola' }, 5500), /devagar/);
  deve(faz(s, BETO, { tipo: 'emote', id: 'texto livre qualquer' }, 9000), /não existe/);
  deve(faz(s, BETO, { tipo: 'emote' }, 9000), /não existe/);
  assert.ok(faz(s, BETO, { tipo: 'emote', id: 'brinde' }, 9000).ok);
  assert.equal(av().emoteN, 2, 'a mesma frase de novo é outra frase');
  deve(faz(s, 'ninguem', { tipo: 'emote', id: 'ola' }, 9000));
  assert.ok(EMOTES.length >= 5 && EMOTES.every((e) => e.texto.length <= 16), 'frases curtas, para caber no balão');
});

teste('T-06: o nome é único na sala: o segundo "Gandalf" vira "Gandalf (2)"', () => {
  const s = nova({ nome: 'Gandalf' });
  entra(s, BETO, 'Gandalf'); entra(s, CAIO, 'Gandalf');
  assert.deepEqual(visaoDaSala(s, ANF).jogadores.map((j) => j.nome), ['Gandalf', 'Gandalf (2)', 'Gandalf (3)']);
  assert.ok(nomeUnico(s, 'x'.repeat(24)).length <= 24);
  assert.ok(nomeUnico(s, 'G'.repeat(24)).length <= 24);
});

teste('T-11: mover leva o avatar por caminho livre, e recusa o que não vale (sem mudar nada)', () => {
  const s = nova();
  const a = s.avatares[ANF];
  const antes = { x: a.x, y: a.y };
  for (const m of [{ x: 16, y: 0 }, { x: 8, y: 6 }, { x: -1, y: 2 }, { x: 99, y: 2 }, { x: 1.5, y: 2 }, { x: '3', y: 2 }, { y: 2 }, { x: 5 }]) {
    assert.equal(faz(s, ANF, { tipo: 'mover', ...m }, 5000).ok, false, JSON.stringify(m));
    assert.deepEqual({ x: a.x, y: a.y }, antes);
  }
  assert.ok(faz(s, ANF, { tipo: 'mover', x: 10, y: 10 }, 5000).ok);
  assert.deepEqual({ x: a.x, y: a.y }, { x: 10, y: 10 });
  assert.equal(faz(s, ANF, { tipo: 'mover', x: 10, y: 10 }, 6000).igual, true, 'ir aonde já está não é mudança');
});

teste('T-11: o ritmo dos passos é limitado, e a casa de outro avatar não vale como destino', () => {
  const s = nova(); entra(s, BETO, 'Beto');
  assert.ok(faz(s, ANF, { tipo: 'mover', x: 10, y: 10 }, 5000).ok);       // de (5,10): 5 casas
  deve(faz(s, ANF, { tipo: 'mover', x: 9, y: 10 }, 5000 + 5 * MS_POR_CASA - 1), /devagar/);
  assert.ok(faz(s, ANF, { tipo: 'mover', x: 9, y: 10 }, 5000 + 5 * MS_POR_CASA).ok, 'a caminhada acabou: pode andar de novo');
  const b = s.avatares[BETO];
  deve(faz(s, ANF, { tipo: 'mover', x: b.x, y: b.y }, 9000), /chegar/);
});

teste('T-03: o avatar vira o primeiro herói que o jogador pega, e volta à persona ao largar', () => {
  const s = nova();
  assert.equal(figuraDe(s, ANF), PERSONA_PADRAO);
  pega(s, ANF, 'pc-mago', 'pc-ladino');
  assert.equal(figuraDe(s, ANF), 'pc-mago', 'o primeiro que PEGOU, não o primeiro do elenco');
  assert.equal(visaoDaSala(s, ANF).avatares[0].figura, 'pc-mago');
  faz(s, ANF, { tipo: 'largar', heroi: 'pc-mago' });
  assert.equal(figuraDe(s, ANF), 'pc-ladino', 'largou o primeiro: passa ao seguinte');
  faz(s, ANF, { tipo: 'largar', heroi: 'pc-ladino' }); pega(s, ANF, 'pc-ladino', 'pc-mago');
  faz(s, ANF, { tipo: 'largar', heroi: 'pc-mago' }); faz(s, ANF, { tipo: 'largar', heroi: 'pc-ladino' });
  assert.equal(figuraDe(s, ANF), PERSONA_PADRAO);
  faz(s, ANF, { tipo: 'piloto', heroi: 'pc-barbaro' });
  assert.equal(figuraDe(s, ANF), PERSONA_PADRAO, 'herói do piloto não é de ninguém');
});

teste('a visão traz os avatares com rótulo público, posição, figura e marcador — e nada secreto', () => {
  const s = nova(); entra(s, BETO, 'Beto');
  const v = visaoDaSala(s, BETO);
  assert.equal(v.avatares.length, 2);
  for (const a of v.avatares) {
    assert.ok(/^p\d+$/.test(a.id)); assert.ok(Number.isInteger(a.x) && Number.isInteger(a.y));
    assert.ok(a.marcador.cor >= 0 && a.marcador.cor < 8 && [0, 1].includes(a.marcador.forma));
  }
  assert.deepEqual(problemasDeJson(v), []);
  assert.doesNotMatch(JSON.stringify(v), new RegExp(`${ANF}|${BETO}`));
});

teste('sair do lobby tira o avatar; voltar de uma queda mantém a casa; sala antiga sem avatares se atualiza', () => {
  const s = nova(); entra(s, BETO, 'Beto');
  faz(s, BETO, { tipo: 'mover', x: 8, y: 10 }, 5000);
  desconectar(s, BETO, 6000);
  faz(s, BETO, { tipo: 'entrar', nome: 'Beto' });
  assert.deepEqual({ x: s.avatares[BETO].x, y: s.avatares[BETO].y }, { x: 8, y: 10 });
  faz(s, BETO, { tipo: 'sair' });
  assert.equal(s.avatares[BETO], undefined);
  assert.equal(visaoDaSala(s, ANF).avatares.length, 1);
  const velha = JSON.parse(JSON.stringify(nova())); delete velha.avatares;
  assert.ok(aplicar(velha, ANF, { tipo: 'entrar', nome: 'Nicholas' }, 1).ok);
  assert.ok(velha.avatares[ANF], 'o anfitrião da sala antiga ganhou avatar ao voltar');
});


// ---- o que a revisão da taverna achou -----------------------------------------------------------------

teste('T-06: voltar de uma queda NÃO muda o nome, nem deixa pegar o de outro', () => {
  const s = nova({ nome: 'Gandalf' });
  entra(s, BETO, 'Gandalf');
  assert.equal(s.jogadores[BETO].nome, 'Gandalf (2)');
  desconectar(s, BETO, 5);
  faz(s, BETO, { tipo: 'entrar', nome: 'Gandalf' });             // o cliente reenvia o nome digitado
  assert.equal(s.jogadores[BETO].nome, 'Gandalf (2)');
  faz(s, BETO, { tipo: 'entrar', nome: 'Nicholas' });
  assert.equal(s.jogadores[BETO].nome, 'Gandalf (2)');
});

teste('T-11: o servidor só aceita outro passo quando a caminhada anterior já teria terminado', () => {
  const s = nova();
  const longo = faz(s, ANF, { tipo: 'mover', x: 10, y: 10 }, 1000);   // 5 casas = 1000 ms
  assert.ok(longo.ok);
  assert.equal(s.avatares[ANF].livreEm, 1000 + 5 * MS_POR_CASA);
  deve(faz(s, ANF, { tipo: 'mover', x: 9, y: 10 }, 1000), /devagar/);
  deve(faz(s, ANF, { tipo: 'mover', x: 9, y: 10 }, 1999), /devagar/);
  assert.ok(faz(s, ANF, { tipo: 'mover', x: 9, y: 10 }, 2000).ok);
});

teste('mover e persona só valem no lobby: depois de iniciada, a taverna acabou', () => {
  const s = nova(); entra(s, BETO, 'Beto');
  pega(s, ANF, 'pc-guerreiro', 'pc-ladino', 'pc-clerigo'); pega(s, BETO, 'pc-mago');
  faz(s, ANF, { tipo: 'pronto', valor: true }); faz(s, BETO, { tipo: 'pronto', valor: true });
  faz(s, ANF, { tipo: 'iniciar' });
  deve(faz(s, ANF, { tipo: 'mover', x: 9, y: 10 }, 9999), /começou/);
  deve(faz(s, ANF, { tipo: 'persona', heroi: 'pc-mago' }), /começou/);
});

teste('T-02/T-03: herói sem arte não vira figura na taverna; vale o primeiro COM arte', () => {
  const s = nova();
  pega(s, ANF, 'pc-bruxo');
  assert.equal(figuraDe(s, ANF), PERSONA_PADRAO, 'o bruxo ainda não tem arte: fica a persona');
  faz(s, ANF, { tipo: 'pegar', heroi: 'pc-paladino' });
  assert.equal(figuraDe(s, ANF), 'pc-paladino');
});

teste('a visão de uma sala guardada antes da taverna não quebra', () => {
  const s = JSON.parse(JSON.stringify(nova())); delete s.avatares; delete s.cedidos;
  assert.doesNotThrow(() => visaoDaSala(s, ANF));
  assert.deepEqual(visaoDaSala(s, ANF).avatares, []);
});

teste('nome longo e emoji: o sufixo (2) cabe, sem espaço sobrando nem emoji partido', () => {
  const s = nova({ nome: 'aaaaaaaaaaaaaaaaaaa bbbb' });
  const n = nomeUnico(s, 'aaaaaaaaaaaaaaaaaaa bbbb');
  assert.ok([...n].length <= 24); assert.doesNotMatch(n, /\s\s/); assert.match(n, / \(2\)$/);
  const e = nova({ nome: `a${'😀'.repeat(11)}` });
  const m = nomeUnico(e, `a${'😀'.repeat(11)}`);
  assert.ok([...m].length <= 24); assert.doesNotMatch(m, /[\ud800-\udbff](?![\udc00-\udfff])/);
});

teste('avatar guardado numa casa que o mapa de hoje bloqueia volta a nascer numa casa livre', () => {
  const s = nova();
  s.avatares[ANF].x = 7; s.avatares[ANF].y = 5;                    // a mesa de grupo
  faz(s, ANF, { tipo: 'entrar', nome: 'Nicholas' });
  const campo = campoDaTaverna();
  assert.equal(campo.blocksMove(s.avatares[ANF].x, s.avatares[ANF].y), false);
});

teste('o mapa: a parede do fundo (norte e oeste) está nas duas grades, e a mobília principal existe', () => {
  const { n, o } = MAPA_TAVERNA.paredes;
  assert.equal(n.length, ALTURA); assert.equal(o.length, ALTURA);
  assert.ok(n[0].split('').every((c) => c === '#') && n.slice(1).every((l) => !l.includes('#')));
  assert.ok(o.every((l) => l[0] === '#' && !l.slice(1).includes('#')));
  const variantes = MAPA_TAVERNA.objetos.filter((o) => o.variante !== 'taverna-nada').map((o) => o.variante);
  const quantas = (v) => variantes.filter((x) => x === `taverna-${v}`).length;
  for (const [peca, minimo] of [['lareira', 1], ['balcao', 1], ['prateleira', 1], ['prateleiraB', 1], ['prateleiraO', 1], ['toblen', 1], ['escada', 1], ['mesaRedonda', 1], ['mesaCartas', 1], ['mesaVela', 1], ['banquinho', 4], ['barrilCerveja', 1], ['caixote', 1], ['lampiao', 2]]) {
    assert.ok(quantas(peca) >= minimo, `faltam peças '${peca}' (${quantas(peca)})`);
  }
  // Todo `^` do mapa tem uma anotação, e toda anotação está num `^`.
  const caretas = new Set(); MAPA_TAVERNA.terreno.forEach((l, y) => [...l].forEach((c, x) => { if (c === '^') caretas.add(`${x},${y}`); }));
  assert.deepEqual([...caretas].sort(), MAPA_TAVERNA.objetos.map((o) => `${o.x},${o.y}`).sort());
  assert.equal(new Set(MAPA_TAVERNA.objetos.map((o) => `${o.x},${o.y}`)).size, MAPA_TAVERNA.objetos.length, 'nenhuma casa tem duas peças');
  assert.equal(LARGURA, ALTURA, 'o Board corta a ponta de um mapa muito mais largo que alto');
});

teste('T-05: dezesseis jogadores não existem aqui, mas o contrato de marcadores cobre 16 sem repetir', () => {
  const usados = new Set();
  for (let i = 0; i < 16; i++) { const n = marcadorLivre(usados); assert.notEqual(n, null); usados.add(n); }
  assert.equal(new Set([...usados].map((n) => JSON.stringify(marcadorN(n)))).size, 16);
});

teste('interagir (botão direito): o convidado pede o menu da casa e escolhe a opção; o menu volta só a ele', () => {
  const s = salaIniciada();
  assert.deepEqual(faz(s, BETO, { tipo: 'agir', acao: 'contexto', heroi: 'pc-mago', x: 4, y: 7 }).repassar,
    { tipo: 'agir', de: 'p2', heroi: 'pc-mago', acao: 'contexto', x: 4, y: 7 });
  assert.deepEqual(faz(s, BETO, { tipo: 'agir', acao: 'contexto-escolher', heroi: 'pc-mago', idx: 2 }).repassar,
    { tipo: 'agir', de: 'p2', heroi: 'pc-mago', acao: 'contexto-escolher', idx: 2 });
  deve(faz(s, BETO, { tipo: 'agir', acao: 'contexto-escolher', heroi: 'pc-mago', idx: -1 }), /opção inválida/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'contexto', heroi: 'pc-guerreiro', x: 1, y: 1 }), /não é seu/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'contexto', heroi: 'pc-mago', x: 'a', y: 1 }), /casa inexistente/);
  const menu = JSON.stringify({ tipo: 'narrativa', msg: { tipo: 'contexto-abrir', id: 1, para: 'p2', heroi: 'pc-mago', titulo: 'Elmar', opcoes: [{ rotulo: 'Conversar', i: 0 }] } });
  assert.equal(tratarNarrativa({ sala: s, jogadorId: ANF, bruto: menu }).ok, true);
  assert.match(tratarNarrativa({ sala: s, jogadorId: BETO, bruto: menu }).erro, /anfitrião/);
  assert.match(tratarNarrativa({ sala: s, jogadorId: ANF, bruto: JSON.stringify({ tipo: 'narrativa', msg: { tipo: 'contexto-abrir', id: 1, para: 'p2', opcoes: 'x' } }) }).erro, /inválida/);
});

teste('diário: as missões e as pistas viram dado puro e voltam para a tela da vila', () => {
  const defs = { a: { titulo: 'Achar A', de: 'Sildar', texto: 'x', recompensa: '5 po' }, b: { titulo: 'B', de: 'a vila', texto: 'y' } };
  const d = diarioDe({ missoes: { a: 'feita', b: 'ativa', zz: 'ativa' }, pistas: ['p1', 7, 'p2'] }, defs);
  assert.deepEqual(d.missoes.map((m) => [m.id, m.estado]), [['a', 'feita'], ['b', 'ativa']], 'missão fora do catálogo não entra');
  assert.deepEqual(d.pistas, ['p1', 'p2']);
  assert.equal(JSON.parse(JSON.stringify(d)).missoes[0].recompensa, '5 po');
  const t = diarioParaTela(d);
  assert.equal(t.estado.missoes.a, 'feita');
  assert.equal(t.defs.b.titulo, 'B');
  assert.deepEqual(diarioDe(undefined, defs), { missoes: [], pistas: [] });
});

teste('subir de nível numa sala: o servidor confere a forma das escolhas, e o anfitrião as confere contra as opções', () => {
  const s = salaIniciada();
  assert.deepEqual(faz(s, BETO, { tipo: 'agir', acao: 'nivel', heroi: 'pc-mago', id: 3, selecoes: { aprende: ['luz', 'misselMagico'] } }).repassar,
    { tipo: 'agir', de: 'p2', heroi: 'pc-mago', acao: 'nivel', id: 3, selecoes: { aprende: ['luz', 'misselMagico'] } });
  deve(faz(s, BETO, { tipo: 'agir', acao: 'nivel', heroi: 'pc-mago', id: 3, selecoes: 'x' }), /escolhas inválidas/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'nivel', heroi: 'pc-mago', id: 'a', selecoes: {} }), /escolhas inválidas/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'nivel', heroi: 'pc-mago', id: 3, selecoes: { aprende: [7] } }), /escolhas inválidas/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'nivel', heroi: 'pc-guerreiro', id: 3, selecoes: {} }), /não é seu/);
  const esc = [{ id: 'aprende', quantas: 2, opcoes: ['a', 'b', 'c'], sugeridas: ['a', 'b'] }, { id: 'prepara', quantas: 1, deLivro: true, opcoes: [], sugeridas: [] }];
  assert.deepEqual(escolhasConferidas(esc, { aprende: ['c', 'zzz'] }), { aprende: ['c', 'b'] }, 'o que não está nas opções volta à sugerida');
  assert.deepEqual(escolhasConferidas(esc, null), { aprende: ['a', 'b'] });
  const msg = JSON.stringify({ tipo: 'narrativa', msg: { tipo: 'nivel-abrir', id: 1, para: 'p2', dados: { escolhas: [] } } });
  assert.equal(tratarNarrativa({ sala: s, jogadorId: ANF, bruto: msg }).ok, true);
  assert.match(tratarNarrativa({ sala: s, jogadorId: BETO, bruto: msg }).erro, /anfitrião/);
});

teste('preparar magias numa sala: o servidor confere a forma da lista e de quem é o herói', () => {
  const s = salaIniciada();
  assert.deepEqual(faz(s, BETO, { tipo: 'agir', acao: 'preparar', heroi: 'pc-mago', lista: ['escudoArcano', 'sono'] }).repassar,
    { tipo: 'agir', de: 'p2', heroi: 'pc-mago', acao: 'preparar', lista: ['escudoArcano', 'sono'] });
  deve(faz(s, BETO, { tipo: 'agir', acao: 'preparar', heroi: 'pc-mago', lista: 'sono' }), /lista inválida/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'preparar', heroi: 'pc-mago', lista: [1] }), /lista inválida/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'preparar', heroi: 'pc-guerreiro', lista: [] }), /não é seu/);
});

teste('vila e região: qualquer jogador pede um botão da tela (Dormir, Acampar); o servidor só aceita os nomes conhecidos', () => {
  const s = salaIniciada();
  assert.deepEqual(faz(s, BETO, { tipo: 'agir', acao: 'vila-acao', qual: 'dormir' }).repassar, { tipo: 'agir', de: 'p2', acao: 'vila-acao', qual: 'dormir' });
  assert.equal(faz(s, BETO, { tipo: 'agir', acao: 'vila-acao', qual: 'b0' }).ok, true);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'vila-acao', qual: 'apagar' }), /ação inválida/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'vila-acao', qual: 7 }), /ação inválida/);
  deve(faz(s, ANF, { tipo: 'agir', acao: 'vila-acao', qual: 'dormir' }), /própria tela/);
});

teste('limites por IP: poucas salas novas por hora, conexões por minuto, e só vale o código que o servidor emitiu', () => {
  const est = novoEstadoDeLimites();
  let n = 0;
  const sorteio = (m) => (n++ * 7) % m;
  const t0 = 1_000_000;
  const emitidos = [];
  for (let i = 0; i < EMITIR_POR_HORA; i++) {
    const r = emitirCodigo(est, t0 + i, sorteio);
    assert.equal(r.ok, true);
    assert.ok(normalizarCodigo(r.codigo), 'o código emitido é um código válido');
    emitidos.push(r.codigo);
  }
  assert.equal(new Set(emitidos).size, EMITIR_POR_HORA, 'sem repetir');
  const negado = emitirCodigo(est, t0 + 10, sorteio);
  assert.equal(negado.ok, false);
  assert.ok(negado.espera > 0 && negado.espera <= VALIDADE_DO_CODIGO_MS, 'diz quanto esperar');
  assert.equal(emitirCodigo(est, t0 + VALIDADE_DO_CODIGO_MS + 1, sorteio).ok, true, 'passada uma hora, pode de novo');

  const e2 = novoEstadoDeLimites();
  const c = emitirCodigo(e2, t0, sorteio).codigo;
  assert.equal(entrarNaSala(e2, t0 + 1, c).emitido, true, 'o código foi emitido a este IP');
  assert.equal(entrarNaSala(e2, t0 + 2, 'ZZZZZZ').emitido, false, 'código que o servidor não emitiu');
  for (let i = 0; i < TENTATIVAS_POR_MINUTO; i++) entrarNaSala(e2, t0 + 100 + i, c);
  assert.equal(entrarNaSala(e2, t0 + 200, c).ok, false, 'varrer códigos toma o limite');
  assert.equal(entrarNaSala(e2, t0 + 61_000 + 100, c).ok, true, 'e volta um minuto depois');
});

teste('alfinete e "pronto para sair": são do jogador (sem herói), com forma conferida pelo servidor', () => {
  const s = salaIniciada();
  assert.deepEqual(faz(s, BETO, { tipo: 'agir', acao: 'alfinete', x: 4, y: 9 }).repassar, { tipo: 'agir', de: 'p2', acao: 'alfinete', x: 4, y: 9, marca: 'aqui' });
  assert.equal(faz(s, BETO, { tipo: 'agir', acao: 'alfinete', x: 4, y: 9, marca: 'atacar' }).repassar.marca, 'atacar');
  deve(faz(s, BETO, { tipo: 'agir', acao: 'alfinete', x: 4, y: 9, marca: 'bomba' }), /marca inexistente/);
  assert.deepEqual(faz(s, BETO, { tipo: 'agir', acao: 'frase', id: 'cura' }).repassar, { tipo: 'agir', de: 'p2', acao: 'frase', id: 'cura' });
  deve(faz(s, BETO, { tipo: 'agir', acao: 'frase', id: 'xingar' }), /não existe/);
  deve(faz(s, ANF, { tipo: 'agir', acao: 'frase', id: 'cura' }), /própria tela/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'alfinete', x: -1, y: 9 }), /casa inexistente/);
  deve(faz(s, BETO, { tipo: 'agir', acao: 'alfinete', x: 'a', y: 9 }), /casa inexistente/);
  deve(faz(s, ANF, { tipo: 'agir', acao: 'alfinete', x: 1, y: 1 }), /própria tela/);
  assert.deepEqual(faz(s, BETO, { tipo: 'agir', acao: 'pronto-cena', valor: true }).repassar, { tipo: 'agir', de: 'p2', acao: 'pronto-cena', valor: true });
  deve(faz(s, BETO, { tipo: 'agir', acao: 'pronto-cena', valor: 'sim' }), /valor inválido/);
});

teste('vista em diferenças: manda só quem mudou, o convidado reconstrói igual, e sem a base espera a completa', () => {
  const corpo = (n) => ({ id: `c${n}`, name: `Criatura ${n}`, pos: { x: n, y: 1 }, hp: 10, texto: 'x'.repeat(300) });
  const vista = (rodada, lista, extras = null) => ({ v: 1, variante: 'emboscada', rodada, lado: 'party', acabou: false, combatentes: lista, extras });
  const em = criarEmissor();
  const re = criarReceptor();
  const lista = [corpo(1), corpo(2), corpo(3), corpo(4)];

  const m1 = em.publicar(vista(1, lista));
  assert.ok(Number.isInteger(m1.seq) && !m1.delta, 'a primeira é completa');
  assert.deepEqual(re.receber(m1).combatentes.map((c) => c.id), ['c1', 'c2', 'c3', 'c4']);

  const lista2 = lista.map((c) => ({ ...c, pos: { ...c.pos } }));
  lista2[1].hp = 3;
  const m2 = em.publicar(vista(1, lista2, { eventos: [{ type: 'damage' }] }));
  assert.equal(m2.delta, true);
  assert.deepEqual(m2.mudaram.map((c) => c.id), ['c2'], 'só o que mudou');
  assert.ok(JSON.stringify(m2).length < JSON.stringify(vista(1, lista2)).length * 0.5, 'bem menor que a completa');
  assert.ok(lerDelta(m2), 'o servidor reconhece a forma');
  const v2 = re.aplicar(JSON.parse(JSON.stringify(m2)));
  assert.deepEqual(v2.combatentes, lista2, 'o convidado reconstrói a mesma vista');
  assert.deepEqual(v2.extras, { eventos: [{ type: 'damage' }] });

  // Sai um combatente e entra outro.
  const lista3 = [lista2[0], lista2[2], lista2[3], corpo(9)];
  const m3 = em.publicar(vista(2, lista3));
  assert.deepEqual(m3.removidos, ['c2']);
  assert.deepEqual(m3.mudaram.map((c) => c.id), ['c9']);
  assert.deepEqual(re.aplicar(JSON.parse(JSON.stringify(m3))).combatentes.map((c) => c.id), ['c1', 'c3', 'c4', 'c9']);

  // Quem não tem a base (entrou agora) ignora a diferença e volta a acompanhar na próxima completa.
  const novo = criarReceptor();
  const m4 = em.publicar(vista(2, lista3.map((c) => ({ ...c, hp: c.hp - 1 }))));
  assert.equal(novo.aplicar(JSON.parse(JSON.stringify(m4))), null, 'sem completa guardada, não aplica');
  const m5 = em.publicar(vista(3, lista3), { completa: true });
  assert.ok(!m5.delta);
  assert.equal(novo.receber(m5).combatentes.length, 4);
  // Uma diferença cuja base não é a que o convidado tem (uma se perdeu) também espera.
  em.publicar(vista(3, lista3.map((c) => ({ ...c, hp: 1 }))));
  const m7 = em.publicar(vista(3, lista3.map((c) => ({ ...c, hp: 2 }))));
  assert.equal(novo.aplicar(JSON.parse(JSON.stringify(m7))), null, 'falta uma diferença no meio');

  // Mudou quase tudo: não compensa, sai completa. A cada tanto, também.
  const tudo = em.publicar(vista(4, lista3.map((c) => ({ ...c, hp: 99, texto: 'y'.repeat(300) }))));
  assert.ok(!tudo.delta, 'quando a diferença não encolhe, vai a completa');
  em.publicar(vista(5, lista3), { completa: true });     // a base de que o laço parte
  for (let i = 0; i < COMPLETA_A_CADA + 1; i++) {
    const m = em.publicar(vista(5, lista3.map((c, k) => (k === 0 ? { ...c, hp: i } : c))));
    if (!m.delta) { assert.ok(i >= COMPLETA_A_CADA - 1, 'completa periódica'); return; }
  }
  assert.fail('devia ter saído uma completa');
});

teste('o servidor aceita a diferença e só guarda a completa para quem entra', () => {
  const s = salaIniciada();
  const completa = JSON.stringify({ tipo: 'partida', vista: { v: 1, variante: 'emboscada', rodada: 1, lado: 'party', acabou: false, seq: 1, combatentes: [{ id: 'a', pos: { x: 1, y: 1 } }], extras: null } });
  const delta = JSON.stringify({ tipo: 'partida', vista: { v: 1, delta: true, base: 1, seq: 2, variante: 'emboscada', rodada: 1, lado: 'party', acabou: false, ordem: ['a'], mudaram: [{ id: 'a', pos: { x: 2, y: 1 } }], removidos: [], extras: null } });
  assert.equal(tratarVista({ sala: s, jogadorId: ANF, bruto: completa, agora: 1000 }).delta, false);
  const r = tratarVista({ sala: s, jogadorId: ANF, bruto: delta, agora: 1100, ultimaEm: 1000 });
  assert.ok(r.ok && r.delta, 'a diferença passa, mesmo logo depois');
  assert.equal(tratarVista({ sala: s, jogadorId: ANF, bruto: completa, agora: 1100, ultimaEm: 1000 }).calado, true, 'a completa segue limitada pelo ritmo');
  const quebrada = JSON.stringify({ tipo: 'partida', vista: { v: 1, delta: true, base: 'x', seq: 2, variante: 'e', ordem: [], mudaram: [], removidos: [] } });
  assert.match(tratarVista({ sala: s, jogadorId: ANF, bruto: quebrada, agora: 5000 }).erro, /inválida/);
  assert.match(tratarVista({ sala: s, jogadorId: BETO, bruto: delta, agora: 5000 }).erro, /anfitrião/);
});

// ---- B1: a taverna pública -----------------------------------------------------------------------

const publica = () => {
  const r = criarSala({ codigo: 'PUBM22', anfitriao: ANF, nome: 'Ana', publica: true, agora: 0 });
  assert.ok(r.ok);
  return r.sala;
};
const IDS = Array.from({ length: 16 }, (_, i) => `jogador-pub-${String(i).padStart(3, '0')}`);

teste('B1: a taverna pública comporta 16 avatares com marcadores diferentes, e a 17ª pessoa não entra', () => {
  const s = publica();
  assert.equal(s.maxJogadores, 16);
  for (let i = 1; i < 16; i++) assert.ok(faz(s, IDS[i], { tipo: 'entrar', nome: `Jog ${i}` }).ok, `entrou ${i}`);
  assert.equal(new Set(Object.values(s.avatares).map((a) => `${a.marcador}`)).size, 16, 'cada um com o seu marcador');
  deve(faz(s, 'jogador-extra-017', { tipo: 'entrar', nome: 'Demais' }), /cheia/);
  const v = visaoDaSala(s, IDS[3]);
  assert.equal(v.publica, true);
  assert.equal(v.mesas.length, 4);
});

teste('B1: na taverna pública só se anda, fala por emote, troca de persona e senta; herói e partida são de sala privada', () => {
  const s = publica(); faz(s, BETO, { tipo: 'entrar', nome: 'Beto' });
  for (const m of [{ tipo: 'pegar', heroi: 'pc-mago' }, { tipo: 'pronto', valor: true }, { tipo: 'iniciar' }, { tipo: 'corda', valor: 'unido' }, { tipo: 'remover', jogador: 'p2' }]) {
    deve(faz(s, ANF, m), /taverna pública/);
  }
  assert.ok(faz(s, BETO, { tipo: 'emote', id: EMOTES[0].id }).ok);
  assert.ok(faz(s, BETO, { tipo: 'persona', heroi: 'pc-mago' }).ok);
});

teste('B1: sentar, levantar e abrir a mesa: o dono manda o código e a mesa toda é convidada', () => {
  const s = publica();
  for (const id of [BETO, CAIO]) faz(s, id, { tipo: 'entrar', nome: id === BETO ? 'Beto' : 'Caio' });
  assert.ok(faz(s, BETO, { tipo: 'sentar', mesa: 1 }).ok);
  assert.ok(faz(s, CAIO, { tipo: 'sentar', mesa: 1 }).ok);
  assert.ok(faz(s, ANF, { tipo: 'sentar', mesa: 1 }).ok);
  assert.deepEqual(visaoDaSala(s, ANF).mesas[1].lugares, ['p2', 'p3', 'p1'], 'o primeiro a sentar é o dono');
  deve(faz(s, ANF, { tipo: 'sentar', mesa: 9 }), /não existe/);
  deve(faz(s, CAIO, { tipo: 'abrir-mesa', codigo: 'ABC234' }), /dono da mesa/);
  deve(faz(s, BETO, { tipo: 'abrir-mesa', codigo: 'xx' }), /código inválido/);
  // Sentar noutra mesa tira da primeira.
  assert.ok(faz(s, ANF, { tipo: 'sentar', mesa: 2 }).ok);
  assert.deepEqual(visaoDaSala(s, ANF).mesas[1].lugares, ['p2', 'p3']);
  const r = faz(s, BETO, { tipo: 'abrir-mesa', codigo: 'abc234' });
  assert.ok(r.ok);
  assert.deepEqual(r.convidar, { codigo: 'ABC234', de: 'Beto', para: [CAIO] });
  assert.deepEqual(visaoDaSala(s, ANF).mesas[1].lugares, [], 'a mesa esvazia');
  // Mesa cheia.
  const s2 = publica();
  for (let i = 1; i < 5; i++) faz(s2, IDS[i], { tipo: 'entrar', nome: `J${i}` });
  for (let i = 1; i < 5; i++) assert.ok(faz(s2, IDS[i], { tipo: 'sentar', mesa: 0 }).ok);
  deve(faz(s2, ANF, { tipo: 'sentar', mesa: 0 }), /cheia/);
});

teste('B1: quem cai ou sai some da taverna pública (as vagas não ficam presas), e o posto de anfitrião passa adiante', () => {
  const s = publica(); faz(s, BETO, { tipo: 'entrar', nome: 'Beto' });
  faz(s, ANF, { tipo: 'sentar', mesa: 0 });
  desconectar(s, ANF, 1000);
  assert.equal(s.jogadores[ANF], undefined, 'saiu de vez');
  assert.equal(s.anfitriao, BETO, 'o posto passou');
  assert.deepEqual(visaoDaSala(s, BETO).mesas[0].lugares, []);
  assert.ok(faz(s, ANF, { tipo: 'entrar', nome: 'Ana' }).ok, 'volta como um jogador novo');
});

teste('B1: criar uma taverna pública só vale com o código que o servidor abriu, e o código dele só abre taverna pública', () => {
  const msg = (publicaMsg) => JSON.stringify({ tipo: 'criar', nome: 'Ana', ...(publicaMsg ? { publica: true } : {}) });
  assert.ok(tratarMensagem({ sala: null, jogadorId: ANF, bruto: msg(true), codigo: 'PUBM22', agora: 0, podePublica: true }).sala.publica);
  assert.match(tratarMensagem({ sala: null, jogadorId: ANF, bruto: msg(true), codigo: 'PUBM22', agora: 0 }).resposta.erro, /só o servidor/);
  assert.match(tratarMensagem({ sala: null, jogadorId: ANF, bruto: msg(false), codigo: 'PUBM22', agora: 0, podePublica: true }).resposta.erro, /taverna pública/);
});

teste('diretório: manda para a instância mais cheia com vaga, abre outra quando enche, e só conhece o que abriu', () => {
  const est = novoDiretorio();
  let n = 0; const sorteio = (m) => (n++ * 5) % m;
  const a = escolherInstancia(est, 1000, sorteio);
  assert.ok(a.nova && normalizarCodigo(a.codigo));
  assert.equal(escolherInstancia(est, 1500, sorteio).codigo, a.codigo, 'quem chega logo depois cai na mesma (recém-aberta)');
  assert.ok(registrarPopulacao(est, 2000, a.codigo, 5));
  const b = escolherInstancia(est, 3000, sorteio);
  assert.equal(b.codigo, a.codigo); assert.equal(b.nova, false);
  registrarPopulacao(est, 4000, a.codigo, LOTACAO_PARA_NOVOS);
  const c = escolherInstancia(est, 5000, sorteio);
  assert.ok(c.nova && c.codigo !== a.codigo, 'cheia: abre outra');
  registrarPopulacao(est, 6000, c.codigo, 3);
  registrarPopulacao(est, 6000, a.codigo, 10);
  assert.equal(escolherInstancia(est, 7000, sorteio).codigo, a.codigo, 'a mais cheia que ainda cabe');
  assert.ok(ehPublicaNoDiretorio(est, a.codigo) && !ehPublicaNoDiretorio(est, 'ZZZZZZ'));
  assert.equal(registrarPopulacao(est, 8000, 'ZZZZZZ', 3), false, 'o diretório não aceita código que não abriu');
  registrarPopulacao(est, 9000, a.codigo, 0); registrarPopulacao(est, 9000, c.codigo, 0);
  escolherInstancia(est, 9000 + 700_000, sorteio);
  assert.equal(ehPublicaNoDiretorio(est, a.codigo), false, 'instância vazia há muito tempo é esquecida');
});

teste('a arte da taverna está nos atlas (quem regera um atlas a apaga: os montadores a refazem; veja verificar-taverna.mjs)', () => {
  const { pecas, faltas } = faltamDaTaverna();
  assert.ok(pecas >= 15, 'a mobília da taverna foi lida do mapa');
  assert.deepEqual(faltas, [], `falta na arte da taverna: ${faltas.join('; ')}`);
});

teste('dicas contextuais: cada gatilho chama as suas dicas, uma vez, e dá para desligar tudo', () => {
  const vistas = new Set();
  assert.deepEqual(dicasDoGatilho('combate', vistas).map((d) => d.id), ['combate', 'acoes']);
  vistas.add('combate');
  assert.deepEqual(dicasDoGatilho('combate', vistas).map((d) => d.id), ['acoes'], 'o que já foi visto não volta');
  assert.deepEqual(dicasDoGatilho('combate', vistas, { ligado: false }), [], 'desligadas: nenhuma');
  assert.deepEqual(dicasDoGatilho('inexistente', vistas), []);
  for (const d of Object.values(DICAS)) assert.ok(d.titulo && d.texto.length >= 1 && d.texto.every((t) => typeof t === 'string'));
  for (const ids of Object.values(GATILHOS)) for (const id of ids) assert.ok(DICAS[id], `dica ${id} existe`);
  const guarda = new Map();
  const st = { getItem: (k) => guarda.get(k) ?? null, setItem: (k, v) => guarda.set(k, v) };
  guardarDicas(st, { vistas: new Set(['golpe']), ligado: false });
  const lido = lerDicas(st);
  assert.deepEqual([[...lido.vistas], lido.ligado], [['golpe'], false]);
  assert.deepEqual([[...lerDicas({ getItem: () => 'lixo' }).vistas], lerDicas({ getItem: () => 'lixo' }).ligado], [[], true], 'armazém estragado: começa do zero');
});

teste('ambiente sonoro: toda variante de mapa aponta para um ambiente que existe', () => {
  const variantes = ['emboscada', 'rua', 'castelo', 'cume', 'arvoreTrovao', 'ondaEco', 'poco', 'ermo', 'ermoNoite', 'mansao', 'mansaoTunel', 'esconderijo', 'caverna', 'padrao', 'grandes'];
  for (const v of variantes) assert.ok(AMBIENTES.includes(ambienteDaVariante(v)) && temCamadas(ambienteDaVariante(v)), `${v} -> ${ambienteDaVariante(v)}`);
  assert.equal(ambienteDaVariante('ondaEco'), 'caverna');
  assert.equal(ambienteDaVariante('rua'), 'vila');
  assert.equal(ambienteDaVariante('ermoNoite'), 'noite');
  assert.equal(ambienteDaVariante('emboscada'), 'floresta');
  for (const n of AMBIENTES) assert.ok(temCamadas(n), `camadas de ${n}`);
});

teste('campo em diferenças: porta aberta e casa mudada chegam ao espelho do convidado, e voltam quando o anfitrião desfaz', () => {
  const mapa = mapaDo('castelo');
  const anf = montarCampo(mapa);
  const base = montarCampo(mapa);
  const conv = montarCampo(mapa);
  assert.equal(diferencasDoCampo(anf, base), null, 'sem mudança, sem diferença');
  const [a, b] = mapa.folhas?.[0] ?? [{ x: 10, y: 13 }, { x: 11, y: 13 }];
  const antes = conv.aresta(a.x, a.y, b.x, b.y);
  anf.porAresta(a.x, a.y, b.x, b.y, antes === 3 ? 2 : 3);
  const i = 5 * anf.w + 5;
  anf.tiles[i] = 0; anf.heights[i] = 2;
  const d = diferencasDoCampo(anf, base);
  assert.ok(d && d.a.length === 1 && d.c.length === 1, 'uma aresta e uma casa');
  assert.ok(diferencaValida(JSON.parse(JSON.stringify(d)), anf.w * anf.h), 'o que vai pela rede é válido');
  assert.equal(aplicarDiferencas(conv, base, JSON.parse(JSON.stringify(d))), true);
  assert.equal(conv.aresta(a.x, a.y, b.x, b.y), anf.aresta(a.x, a.y, b.x, b.y), 'a aresta chegou');
  assert.equal(conv.heights[i], 2, 'a casa chegou');
  anf.porAresta(a.x, a.y, b.x, b.y, antes);
  anf.tiles[i] = base.tiles[i]; anf.heights[i] = base.heights[i];
  assert.equal(diferencasDoCampo(anf, base), null);
  assert.equal(aplicarDiferencas(conv, base, null), true);
  assert.equal(conv.aresta(a.x, a.y, b.x, b.y), antes, 'a aresta voltou');
  assert.equal(conv.heights[i], base.heights[i], 'a casa voltou');
  assert.equal(aplicarDiferencas(conv, base, { a: [[0, 999999, 1]], c: [] }), false, 'diferença fora do mapa é recusada');
});

console.log(`\n${total - falhas}/${total} testes passaram${falhas ? `, ${falhas} FALHARAM` : ''}.`);
process.exit(falhas ? 1 : 0);
