// Testes do HERÓI CRIADO na sala do multijogador: trazer (`game/sala.js`, mensagem `trazer`), a porta do servidor
// (`worker/sala-servidor.js tratarHeroi`), as imagens à parte e o navegador juntando as duas (`game/herois-criados.js`).
// Rode com:
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-sala-criados.mjs

import assert from 'node:assert/strict';
import { criarSala, aplicar, visaoDaSala, artesDaSala, heroisDe, MAX_ARTE_DA_SALA, PILOTO } from '../game/sala.js';
import { tratarHeroi, tratarMensagem, ehHeroi, mensagemDeArtes, MAX_HEROI } from '../worker/sala-servidor.js';
import { novoRascunho, definicaoDoRascunho } from '../game/criador.js';
import { apresentarCriadosDaSala, guardarArtesDaSala } from '../game/herois-criados.js';
import { heroiPorId } from '../game/herois.js';
import { montarHeroi, escolhaAutomatica } from '../game/criacao.js';

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
const ARTE = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';

const nova = () => {
  const r = criarSala({ codigo: 'ABC234', anfitriao: ANF, nome: 'Ana', origem: { tipo: 'nova', aventura: 'mina-perdida' }, agora: 1000 });
  assert.ok(r.ok, r.erro);
  return r.sala;
};
const faz = (sala, quem, msg) => aplicar(sala, quem, msg, 2000);
const deve = (r, trecho) => { assert.equal(r.ok, false, 'deveria recusar'); if (trecho) assert.match(r.erro, trecho); };
function heroi(id, nome = 'Kaela', arte = ARTE) {
  const r = novoRascunho('guerreiro');
  r.nome = nome;
  r.arte = arte;
  return definicaoDoRascunho(r, id);
}
const comDois = () => { const s = nova(); assert.ok(faz(s, BETO, { tipo: 'entrar', nome: 'Beto' }).ok); return s; };

teste('trazer: o herói entra na mesa já na mão de quem trouxe', () => {
  const s = comDois();
  const r = faz(s, BETO, { tipo: 'trazer', definicao: heroi('pc-criado-beto1') });
  assert.ok(r.ok, r.erro);
  assert.equal(r.artes, true);
  assert.equal(s.herois['pc-criado-beto1'], BETO);
  assert.deepEqual(heroisDe(s, BETO), ['pc-criado-beto1']);
});

teste('a definição de fora é conferida: id, look, raça, atributos, imagem', () => {
  const s = comDois();
  const d = heroi('pc-criado-beto2');
  deve(faz(s, BETO, { tipo: 'trazer', definicao: { ...d, look: 'fighter' } }), /conferência/);
  deve(faz(s, BETO, { tipo: 'trazer', definicao: { ...d, abilities: { ...d.abilities, str: 99 } } }), /conferência/);
  deve(faz(s, BETO, { tipo: 'trazer', definicao: { ...d, arte: 'javascript:1' } }), /conferência/);
  deve(faz(s, BETO, { tipo: 'trazer', definicao: { ...d, arte: `data:image/webp;base64,${'A'.repeat(MAX_ARTE_DA_SALA + 10)}` } }), /grande demais/);
  deve(faz(s, BETO, { tipo: 'trazer', definicao: 'x' }), /conferência/);
  assert.equal(Object.keys(s.criados).length, 0);
});

teste('um por jogador: trazer outro troca o da mesa', () => {
  const s = comDois();
  faz(s, BETO, { tipo: 'trazer', definicao: heroi('pc-criado-um') });
  assert.ok(faz(s, BETO, { tipo: 'trazer', definicao: heroi('pc-criado-dois', 'Ayla') }).ok);
  assert.deepEqual(Object.keys(s.criados), ['pc-criado-dois']);
  assert.deepEqual(heroisDe(s, BETO), ['pc-criado-dois']);
});

teste('só o dono controla: outro não pega, e o id de outro não se toma', () => {
  const s = comDois();
  faz(s, BETO, { tipo: 'trazer', definicao: heroi('pc-criado-meu') });
  deve(faz(s, ANF, { tipo: 'pegar', heroi: 'pc-criado-meu' }), /outro jogador/);
  deve(faz(s, ANF, { tipo: 'trazer', definicao: heroi('pc-criado-meu', 'Impostora') }), /outro jogador/);
  deve(faz(s, ANF, { tipo: 'piloto', heroi: 'pc-criado-meu' }));
});

teste('o limite de um herói vale: quem já pegou um pronto larga antes de trazer', () => {
  const s = comDois();
  assert.ok(faz(s, BETO, { tipo: 'pegar', heroi: 'pc-mago' }).ok);
  deve(faz(s, BETO, { tipo: 'trazer', definicao: heroi('pc-criado-limite') }), /largue/);
  assert.ok(faz(s, BETO, { tipo: 'largar', heroi: 'pc-mago' }).ok);
  assert.ok(faz(s, BETO, { tipo: 'trazer', definicao: heroi('pc-criado-limite') }).ok);
});

teste('largar e sair tiram o herói criado da mesa', () => {
  const s = comDois();
  faz(s, BETO, { tipo: 'trazer', definicao: heroi('pc-criado-larga') });
  assert.ok(faz(s, BETO, { tipo: 'largar', heroi: 'pc-criado-larga' }).ok);
  assert.equal(s.criados['pc-criado-larga'], undefined);
  faz(s, BETO, { tipo: 'trazer', definicao: heroi('pc-criado-sai') });
  assert.ok(faz(s, BETO, { tipo: 'sair' }).ok);
  assert.equal(s.criados['pc-criado-sai'], undefined, 'no lobby, quem sai leva o seu');
});

teste('na partida, quem cai deixa o herói criado no piloto, e ele continua na sala', () => {
  const s = comDois();
  faz(s, BETO, { tipo: 'trazer', definicao: heroi('pc-criado-fica') });
  for (const h of ['pc-guerreiro', 'pc-ladino', 'pc-clerigo']) assert.ok(faz(s, ANF, { tipo: 'pegar', heroi: h }).ok, h);
  faz(s, ANF, { tipo: 'pronto', valor: true }); faz(s, BETO, { tipo: 'pronto', valor: true });
  assert.ok(faz(s, ANF, { tipo: 'iniciar' }).ok);
  faz(s, BETO, { tipo: 'sair' });
  assert.equal(s.herois['pc-criado-fica'], PILOTO);
  assert.ok(s.criados['pc-criado-fica'], 'o anfitrião ainda precisa da definição');
});

teste('a visão leva a definição SEM a imagem; as imagens vão à parte', () => {
  const s = comDois();
  faz(s, BETO, { tipo: 'trazer', definicao: heroi('pc-criado-vis') });
  const v = visaoDaSala(s, ANF);
  assert.equal(v.criados['pc-criado-vis'].arte, null);
  assert.equal(v.criados['pc-criado-vis'].temArte, true);
  assert.equal(v.criados['pc-criado-vis'].dono, 'p2', 'o dono pelo rótulo público, nunca o id secreto');
  assert.ok(!JSON.stringify(v).includes(BETO), 'o id secreto não vaza');
  assert.deepEqual(artesDaSala(s), { 'pc-criado-vis': ARTE });
  assert.deepEqual(mensagemDeArtes(s), { tipo: 'artes', artes: { 'pc-criado-vis': ARTE } });
});

teste('servidor: a porta do herói passa de 2 KB, mas tem teto', () => {
  const s = comDois();
  const def = heroi('pc-criado-porta', 'Kaela', `data:image/webp;base64,${'A'.repeat(20_000)}`);
  const bruto = JSON.stringify({ tipo: 'heroi', definicao: def });
  assert.ok(bruto.length > 2048 && ehHeroi(bruto));
  const r = tratarHeroi({ sala: s, jogadorId: BETO, bruto, agora: 3000 });
  assert.equal(r.resposta, null, r.resposta?.erro);
  assert.equal(r.mudou, true);
  assert.equal(r.artes, true);
  const grande = JSON.stringify({ tipo: 'heroi', definicao: { ...def, arte: `data:image/webp;base64,${'A'.repeat(MAX_HEROI)}` } });
  assert.match(tratarHeroi({ sala: s, jogadorId: BETO, bruto: grande, agora: 3000 }).resposta.erro, /grande demais/);
  assert.match(tratarMensagem({ sala: s, jogadorId: BETO, bruto, codigo: 'ABC234', agora: 3000 }).resposta.erro, /grande demais/, 'pela porta comum não passa');
});

teste('servidor: na taverna pública não se traz herói', () => {
  const r = criarSala({ codigo: 'PUB234', anfitriao: ANF, nome: 'Ana', agora: 1000, publica: true });
  const bruto = JSON.stringify({ tipo: 'heroi', definicao: heroi('pc-criado-pub') });
  assert.match(tratarHeroi({ sala: r.sala, jogadorId: ANF, bruto, agora: 2000 }).resposta.erro, /taverna pública/);
});

teste('navegador: a visão registra o herói, a imagem chega depois e ele monta', () => {
  const s = comDois();
  faz(s, BETO, { tipo: 'trazer', definicao: heroi('pc-criado-nav', 'Nyx') });
  const v = visaoDaSala(s, ANF);
  apresentarCriadosDaSala(v.criados);
  assert.equal(heroiPorId('pc-criado-nav').name, 'Nyx');
  assert.equal(heroiPorId('pc-criado-nav').arte, null, 'antes da imagem');
  guardarArtesDaSala({ ...artesDaSala(s), 'pc-criado-x': 'javascript:1' });
  apresentarCriadosDaSala(v.criados);
  assert.equal(heroiPorId('pc-criado-nav').arte, ARTE, 'depois dela');
  const c = montarHeroi('pc-criado-nav', escolhaAutomatica('pc-criado-nav'));
  assert.equal(c.name, 'Nyx');
  assert.equal(c.look, 'arte:pc-criado-nav');
});

console.log(`\n${total - falhas}/${total} testes do herói criado na sala passaram.`);
if (falhas) process.exit(1);
