// Testes da LUZ À MODA DO FOUNDRY (`rules/luz.js`): a aparência de cada fonte (cor e animação), o CONE da lanterna
// coberta, a luz que só acende no escuro e a ESCURIDÃO DA CENA (dia, entardecer, noite). Rode com:
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-luz.mjs
//
// Mede-se o motor de verdade: o nível de luz casa a casa, as fontes que o tabuleiro desenha, o campo montado do mapa
// e a diferença que o multijogador manda ao convidado.

import assert from 'node:assert/strict';
import { Battlefield } from '../core/grid.js';
import {
  nivelDeLuz, fontesDeLuz, dentroDoCone, definirEscuridao, acesaNaEscuridao, aparenciaDaLuz, APARENCIA_DA_LUZ,
  CLARO, PENUMBRA, ESCURO,
} from '../rules/luz.js';
import { montarCampo } from '../game/campo.js';
import { diferencasDoCampo, aplicarDiferencas, diferencaValida } from '../game/campo-delta.js';
import { novoMapa, porLuz, definirEscuridaoDoMapa } from '../game/mapa-editor.js';

let total = 0;
let falhas = 0;
function teste(nome, fn) {
  total += 1;
  try { fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`);
  }
}

const ABERTO = Array(11).fill('...........');
/** Um campo 11x11 aberto, em breu. */
const breu = () => {
  const f = new Battlefield(11, 11, ABERTO);
  f.luz = new Uint8Array(121);
  return f;
};

teste('aparência: cada tipo tem a sua, e a da luz do mapa vence a do tipo', () => {
  assert.deepEqual(aparenciaDaLuz({ tipo: 'fogueira' }), APARENCIA_DA_LUZ.fogueira);
  assert.equal(aparenciaDaLuz({ tipo: 'magica' }).animacao, 'pulso');
  assert.equal(aparenciaDaLuz({ tipo: 'lanterna' }).animacao, 'fixa');
  assert.deepEqual(aparenciaDaLuz({}), APARENCIA_DA_LUZ.tocha, 'sem tipo, a tocha');
  assert.deepEqual(aparenciaDaLuz({ tipo: 'vela', cor: '#00ff00', animacao: 'pulso' }), { cor: '#00ff00', animacao: 'pulso' });
});

teste('cone: sem ângulo (ou 360) acende em volta', () => {
  for (const p of [{ x: 9, y: 5 }, { x: 1, y: 5 }, { x: 5, y: 1 }, { x: 5, y: 9 }]) {
    assert.equal(dentroDoCone({ pos: { x: 5, y: 5 } }, p), true);
    assert.equal(dentroDoCone({ pos: { x: 5, y: 5 }, angulo: 360 }, p), true);
  }
});

teste('cone de 90 para o leste: pega o leste e a diagonal da borda, não o oeste nem o norte', () => {
  const f = { pos: { x: 5, y: 5 }, angulo: 90, direcao: 0 };
  assert.equal(dentroDoCone(f, { x: 9, y: 5 }), true, 'leste');
  assert.equal(dentroDoCone(f, { x: 8, y: 8 }), true, 'sudeste, na borda (45 graus)');
  assert.equal(dentroDoCone(f, { x: 8, y: 2 }), true, 'nordeste, na borda');
  assert.equal(dentroDoCone(f, { x: 5, y: 1 }), false, 'norte');
  assert.equal(dentroDoCone(f, { x: 1, y: 5 }), false, 'oeste');
  assert.equal(dentroDoCone(f, { x: 5, y: 5 }), true, 'a própria casa');
});

teste('cone: a direção é a da tela (90 = sul, 270 = norte), e o giro passa do 360', () => {
  const sul = { pos: { x: 5, y: 5 }, angulo: 60, direcao: 90 };
  assert.equal(dentroDoCone(sul, { x: 5, y: 9 }), true);
  assert.equal(dentroDoCone(sul, { x: 5, y: 1 }), false);
  const nordeste = { pos: { x: 5, y: 5 }, angulo: 60, direcao: 315 };
  assert.equal(dentroDoCone(nordeste, { x: 8, y: 2 }), true);
  assert.equal(dentroDoCone({ ...nordeste, direcao: -45 }, { x: 8, y: 2 }), true, '-45 é o mesmo que 315');
  assert.equal(dentroDoCone(nordeste, { x: 2, y: 8 }), false);
});

teste('o nível de luz respeita o cone: a lanterna coberta acende só para onde aponta', () => {
  const f = breu();
  const lanterna = [{ pos: { x: 5, y: 5 }, claro: 15, penumbra: 15, angulo: 90, direcao: 0 }];
  assert.equal(nivelDeLuz(f, 8, 5, lanterna), CLARO, 'na frente, claro');
  assert.equal(nivelDeLuz(f, 2, 5, lanterna), ESCURO, 'atrás, breu');
  assert.equal(nivelDeLuz(f, 5, 2, lanterna), ESCURO, 'do lado, breu');
  const tocha = [{ pos: { x: 5, y: 5 }, claro: 15, penumbra: 15 }];
  assert.equal(nivelDeLuz(f, 2, 5, tocha), CLARO, 'a tocha de 360 acende atrás');
});

teste('só no escuro: o lampião fica apagado de dia e acende à noite', () => {
  const lampiao = { pos: { x: 5, y: 5 }, claro: 15, penumbra: 15, soNoEscuro: 0.5 };
  const field = breu();
  field.luzes = [lampiao, { pos: { x: 1, y: 1 }, claro: 5, penumbra: 5 }];
  const enc = { combatants: [], field, zonas: [] };
  assert.equal(acesaNaEscuridao(lampiao, field), false, 'escuridão 0');
  assert.equal(fontesDeLuz(enc).length, 1, 'só a luz sem soNoEscuro');
  field.escuridao = 0.5;
  assert.equal(acesaNaEscuridao(lampiao, field), true, 'no limiar acende');
  assert.equal(fontesDeLuz(enc).length, 2);
  lampiao.apagada = true;
  assert.equal(fontesDeLuz(enc).length, 1, 'a apagada não acende mesmo à noite');
});

teste('escuridão da cena ao ar livre: dia, entardecer e noite', () => {
  const f = new Battlefield(11, 11, ABERTO);
  assert.equal(f.luz ?? null, null, 'mapa de dia não tem grade');
  assert.equal(definirEscuridao(f, 0.2), true);
  assert.equal(f.luz, null, 'abaixo de 0,35 continua dia');
  definirEscuridao(f, 0.5);
  assert.ok(f.luz.every((v) => v === PENUMBRA), 'entardecer: penumbra em toda parte');
  definirEscuridao(f, 0.8);
  assert.ok(f.luz.every((v) => v === ESCURO), 'noite: breu');
  assert.equal(definirEscuridao(f, 0.8), false, 'o mesmo nível não muda nada');
  definirEscuridao(f, 0);
  assert.equal(f.luz, null, 'volta ao dia');
});

teste('escuridão numa caverna: só escurece mais, nunca clareia o que o mapa já tinha escuro', () => {
  const f = new Battlefield(11, 11, ABERTO);
  f.luz = new Uint8Array(121).fill(CLARO);
  f.luz[0] = ESCURO;
  f.luz[1] = PENUMBRA;
  definirEscuridao(f, 0.5);
  assert.deepEqual([f.luz[0], f.luz[1], f.luz[2]], [ESCURO, PENUMBRA, PENUMBRA]);
  definirEscuridao(f, 0);
  assert.deepEqual([f.luz[0], f.luz[1], f.luz[2]], [ESCURO, PENUMBRA, CLARO], 'de volta à grade do mapa');
});

teste('a versão do campo sobe quando a escuridão muda (a visão recalcula)', () => {
  const f = new Battlefield(11, 11, ABERTO);
  const v = f.versao ?? 0;
  definirEscuridao(f, 0.9);
  assert.ok((f.versao ?? 0) > v);
});

teste('editor: porLuz guarda cor, animação, cone e soNoEscuro, e só quando fogem do padrão', () => {
  const m = novoMapa(8, 8);
  porLuz(m, 3, 3, { tipo: 'tocha', claro: 20, penumbra: 20 });
  assert.deepEqual(m.luzes[0], { pos: { x: 3, y: 3 }, claro: 20, penumbra: 20, tipo: 'tocha' }, 'a luz simples fica como sempre foi');
  const lanterna = { tipo: 'lanterna', claro: 30, penumbra: 30, cor: '#ff0000', animacao: 'vela', angulo: 90, direcao: 180, soNoEscuro: 0.5 };
  porLuz(m, 4, 4, lanterna);
  assert.deepEqual(m.luzes[1], { pos: { x: 4, y: 4 }, ...lanterna });
  porLuz(m, 4, 4, lanterna);
  assert.equal(m.luzes.length, 1, 'a mesma luz de novo apaga');
  porLuz(m, 3, 3, { tipo: 'tocha', claro: 20, penumbra: 20, angulo: 90, direcao: 0 });
  assert.equal(m.luzes.length, 1, 'outra luz na mesma casa substitui');
  assert.equal(m.luzes[0].angulo, 90);
});

teste('editor: a escuridão do mapa vai e volta, e o campo montado a aplica', () => {
  const m = novoMapa(8, 8);
  assert.equal(definirEscuridaoDoMapa(m, 0.8), true);
  assert.equal(m.escuridao, 0.8);
  assert.equal(definirEscuridaoDoMapa(m, 0.8), false);
  const f = montarCampo(m);
  assert.equal(f.escuridao, 0.8);
  assert.ok(f.luz && f.luz.every((v) => v === ESCURO), 'o mapa da noite monta em breu');
  definirEscuridaoDoMapa(m, 0);
  assert.equal('escuridao' in m, false, '0 tira o campo do mapa');
});

teste('campo montado: as luzes do mapa vêm junto mesmo sem grade de luz, e são uma CÓPIA', () => {
  const m = novoMapa(8, 8);
  porLuz(m, 2, 2, { tipo: 'vela', claro: 5, penumbra: 5, soNoEscuro: 0.5 });
  const f = montarCampo(m);
  assert.equal(f.luzes?.length, 1);
  f.luzes[0].apagada = true;
  assert.equal(m.luzes[0].apagada, undefined, 'apagar no campo não apaga no mapa');
});

teste('multijogador: a rua que anoitece chega ao convidado e volta ao dia', () => {
  const m = novoMapa(8, 8);
  const anfitriao = montarCampo(m);
  const base = montarCampo(m);
  const convidado = montarCampo(m);
  definirEscuridao(anfitriao, 0.8);
  const d = diferencasDoCampo(anfitriao, base);
  assert.equal(d.e, 80);
  assert.equal(diferencaValida(d, 64), true);
  assert.equal(aplicarDiferencas(convidado, base, d), true);
  assert.equal(convidado.escuridao, 0.8);
  assert.ok(convidado.luz.every((v) => v === ESCURO));
  // o anfitrião amanhece: a diferença deixa de trazer `e`, e o convidado volta à escuridão do mapa
  definirEscuridao(anfitriao, 0);
  const d2 = diferencasDoCampo(anfitriao, base);
  aplicarDiferencas(convidado, base, d2);
  assert.equal(convidado.escuridao ?? 0, 0);
  assert.equal(convidado.luz, null);
});

teste('multijogador: escuridão fora de 0..100 é recusada', () => {
  assert.equal(diferencaValida({ a: [], c: [], e: 101 }, 64), false);
  assert.equal(diferencaValida({ a: [], c: [], e: 1.5 }, 64), false);
  assert.equal(diferencaValida({ a: [], c: [], e: -1 }, 64), false);
});

console.log(`\n${total - falhas}/${total} testes passaram`);
if (falhas) process.exit(1);
