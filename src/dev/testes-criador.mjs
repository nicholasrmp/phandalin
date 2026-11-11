// Testes do CRIADOR DE PERSONAGEM (`game/criador.js`): o rascunho do jogador vira uma definição no formato dos heróis
// prontos, e a definição vira ficha pelo mesmo motor. Rode com:
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-criador.mjs

import assert from 'node:assert/strict';
import {
  novoRascunho, trocarClasse, problemasDoRascunho, definicaoDoRascunho, definicaoValida, atributosFinais, custoDosPontos,
  periciasDaClasse, periciasFixas, nomeDaRaca, rascunhoDaDefinicao, RACAS_DO_CRIADOR, CORES_DO_DRACONATO, ANTECEDENTES, novoId,
  MOTIVO_DO_ANTECEDENTE, talentosDoVariante,
} from '../game/criador.js';
import { subirNivel } from '../rules/progressao.js';
import { registrarHeroi, heroiPorId } from '../game/herois.js';
import { montarHeroi, escolhaAutomatica, problemasDaEscolha, TALENTOS_DE_ORIGEM } from '../game/criacao.js';
import { SKILLS } from '../rules/abilities.js';
import { RACAS, racaDe } from '../rules/racas.js';
import { CLASSES } from '../rules/classes/index.js';
import { maxHpEfetivo } from '../rules/conditions.js';
import { montarSave, validarSave } from '../game/save.js';

let falhas = 0;
let total = 0;
function teste(nome, fn) {
  total += 1;
  try { fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`);
  }
}
const ARTE = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
let semente = 1;
const rng = () => ((semente = (semente * 16807) % 2147483647) / 2147483647);

/** Um rascunho válido de cada raça e classe, com o nome e o que a raça pede a mais. */
function rascunho(raca, classe, sexo = 'F') {
  const r = novoRascunho(classe);
  r.nome = 'Teste';
  r.sexo = sexo;
  r.raca = raca;
  if (raca === 'meioElfo' || raca === 'humanoVariante') {
    r.livres = ['dex', 'con'];
    const usadas = new Set([...periciasFixas(r), ...r.periciasEscolhidas]);
    r.periciasLivres = ['acrobacia', 'arcanismo', 'atletismo', 'atuacao', 'enganacao'].filter((s) => !usadas.has(s)).slice(0, raca === 'meioElfo' ? 2 : 1);
  }
  // o Vigoroso: o talento que mais bate com o de origem, para a conta do conflito rodar em toda classe
  if (raca === 'humanoVariante') r.talentoVariante = { id: 'vigoroso' };
  r.periciasEscolhidas = [];
  trocarClasse(r, classe);
  return r;
}

teste('o rascunho novo já é válido, a não ser pelo nome', () => {
  assert.deepEqual(problemasDoRascunho(novoRascunho()), ['Dê um nome ao herói.']);
});

teste('cada raça e cada classe, nos dois gêneros: monta a ficha, e o motor reconhece a raça pelo texto', () => {
  const erros = [];
  for (const raca of RACAS_DO_CRIADOR) {
    for (const classe of Object.keys(CLASSES)) {
      for (const sexo of ['F', 'M']) {
        const r = rascunho(raca, classe, sexo);
        const p = problemasDoRascunho(r);
        if (p.length) { erros.push(`${raca}/${classe}/${sexo}: ${p.join(' ')}`); continue; }
        const def = definicaoDoRascunho(r, novoId(rng));
        if (racaDe(def) !== raca) erros.push(`${raca}/${sexo}: "${def.raca}" foi lido como ${racaDe(def)}`);
        if (!definicaoValida(def)) erros.push(`${raca}/${classe}/${sexo}: definição inválida`);
        registrarHeroi(def);
        const e = escolhaAutomatica(def.id);
        const pe = problemasDaEscolha(def.id, e);
        if (pe.length) { erros.push(`${raca}/${classe}: preparo ${pe.join(' ')}`); continue; }
        const c = montarHeroi(def.id, e);
        if (!(maxHpEfetivo(c) > 0) || !(c.ac >= 10)) erros.push(`${raca}/${classe}: PV ${maxHpEfetivo(c)} CA ${c.ac}`);
        if (c.racaId !== raca) erros.push(`${raca}/${classe}: a ficha saiu com racaId ${c.racaId}`);
        if (c.look !== `arte:${def.id}`) erros.push(`${raca}/${classe}: look ${c.look}`);
      }
    }
  }
  assert.deepEqual(erros, []);
});

teste('atributos: o conjunto padrão vai na ordem da classe e a raça soma por cima', () => {
  const r = rascunho('anaoMontanha', 'guerreiro');
  assert.equal(r.base.str, 15, 'guerreiro põe o 15 na Força');
  const f = atributosFinais(r);
  assert.equal(f.str, 17, 'anão da montanha: +2 de Força');
  assert.equal(f.con, r.base.con + 2);
});

teste('compra de pontos: 27, de 8 a 15', () => {
  const r = rascunho('humano', 'mago');
  r.metodo = 'pontos';
  r.base = { str: 8, dex: 14, con: 14, int: 15, wis: 12, cha: 8 };
  assert.equal(custoDosPontos(r.base), 0 + 7 + 7 + 9 + 4 + 0);
  assert.deepEqual(problemasDoRascunho(r), []);
  r.base.cha = 13;
  assert.match(problemasDoRascunho(r).join(), /passou de 27 pontos/);
  r.base.cha = 16;
  assert.match(problemasDoRascunho(r).join(), /de 8 a 15/);
});

teste('meio-elfo: dois +1 fora do Carisma e duas perícias quaisquer', () => {
  const r = rascunho('meioElfo', 'bardo');
  assert.deepEqual(problemasDoRascunho(r), []);
  const f = atributosFinais(r);
  assert.equal(f.cha, r.base.cha + 2);
  assert.equal(f.dex, r.base.dex + 1);
  r.livres = ['cha', 'dex'];
  assert.match(problemasDoRascunho(r).join(), /fora o Carisma/);
});

teste('perícias: o antecedente e a raça não contam na escolha da classe, e a ficha leva todas', () => {
  const r = rascunho('meioOrc', 'barbaro');
  r.antecedente = 'soldado';
  r.periciasEscolhidas = ['intimidacao', 'natureza'];
  assert.match(problemasDoRascunho(r).join(), /perícias da classe/, 'Intimidação já vem do antecedente e da raça');
  r.periciasEscolhidas = ['natureza', 'percepcao'];
  assert.deepEqual(problemasDoRascunho(r), []);
  const def = definicaoDoRascunho(r, 'pc-criado-aaaa');
  for (const s of ['natureza', 'percepcao', 'atletismo', 'intimidacao']) assert.ok(def.skills.includes(s), s);
  const { quantas } = periciasDaClasse('bardo');
  assert.equal(quantas, 3, 'o bardo escolhe três de qualquer uma');
});

teste('draconato: a cor vira o texto da raça, e o motor tira dela o sopro e a resistência', () => {
  for (const cor of CORES_DO_DRACONATO) {
    const r = rascunho('draconato', 'paladino', 'F');
    r.cor = cor;
    const def = definicaoDoRascunho(r, `pc-criado-d${cor.slice(0, 4)}`);
    registrarHeroi(def);
    const c = montarHeroi(def.id);
    assert.equal(c.ancestralidadeDraconica, cor, `${def.raca} → ${c.ancestralidadeDraconica}`);
  }
  assert.equal(nomeDaRaca('draconato', 'F', 'vermelho'), 'Draconata vermelha');
  assert.equal(nomeDaRaca('draconato', 'M', 'latao'), 'Draconato de latão');
});

teste('o antecedente sugere o talento de 2024, e o Acólito põe o Iniciado na lista do clérigo', () => {
  const r = rascunho('humano', 'guerreiro');
  r.antecedente = 'acolito';
  r.periciasEscolhidas = [];
  trocarClasse(r, 'guerreiro');
  const def = definicaoDoRascunho(r, 'pc-criado-acol');
  registrarHeroi(def);
  const e = escolhaAutomatica(def.id);
  assert.equal(e.talento, ANTECEDENTES.acolito.talento);
  assert.equal(e.iniciado.lista, 'clerigo');
  const c = montarHeroi(def.id, e);
  assert.ok(c.spellcasting?.cantrips?.length, 'o guerreiro acólito sai com dois truques do clérigo');
});

// O GANCHO DO ANTECEDENTE (o Obelisco): o herói criado sai com o porquê de ir a Phandalin, que o capítulo 1 mostra na
// carroça. Antes saía vazio, e o herói criado era o único sem motivo na apresentação do grupo.
teste('o herói criado sai com o motivo de ir a Phandalin, pelo antecedente', () => {
  for (const id of Object.keys(ANTECEDENTES)) {
    const r = rascunho('humano', 'guerreiro');
    r.antecedente = id;
    const def = definicaoDoRascunho(r, `pc-criado-motivo-${id}`);
    assert.ok(def.motivo.length > 40, `${id}: sem motivo`);
    assert.equal(def.motivo, MOTIVO_DO_ANTECEDENTE[id]);
  }
});

teste('a imagem: só data URL de imagem, e pequena', () => {
  const r = rascunho('humano', 'ladino');
  r.arte = ARTE;
  assert.deepEqual(problemasDoRascunho(r), []);
  const def = definicaoDoRascunho(r, 'pc-criado-arte');
  assert.equal(def.arte, ARTE);
  assert.equal(def.rascunho.arte, null, 'a imagem não vai duas vezes');
  r.arte = 'javascript:alert(1)';
  assert.match(problemasDoRascunho(r).join(), /imagem/);
  r.arte = `data:image/webp;base64,${'A'.repeat(90_000)}`;
  assert.match(problemasDoRascunho(r).join(), /imagem/);
});

teste('definição de fora é conferida: id, look, raça e atributos', () => {
  const def = definicaoDoRascunho(rascunho('tiferino', 'bruxo'), 'pc-criado-tif1');
  assert.ok(definicaoValida(def));
  assert.equal(definicaoValida({ ...def, id: '../x' }), false);
  assert.equal(definicaoValida({ ...def, look: 'fighter' }), false, 'não pega a figura de outro herói');
  assert.equal(definicaoValida({ ...def, abilities: { ...def.abilities, str: 40 } }), false);
  assert.equal(definicaoValida({ ...def, racaId: 'humano' }), false, 'raça declarada tem de bater com o texto');
});

teste('editar: o rascunho volta da definição, com a imagem', () => {
  const r = rascunho('gnomoRochas', 'mago');
  r.nome = 'Fizz';
  r.arte = ARTE;
  const def = definicaoDoRascunho(r, 'pc-criado-fizz');
  const volta = rascunhoDaDefinicao(def);
  assert.equal(volta.nome, 'Fizz');
  assert.equal(volta.arte, ARTE);
  assert.deepEqual(problemasDoRascunho(volta), []);
});

teste('o registro: o herói criado é achado pelo id, como os prontos', () => {
  const def = definicaoDoRascunho(rascunho('halflingRobusto', 'monge'), 'pc-criado-reg1');
  registrarHeroi(def);
  assert.equal(heroiPorId('pc-criado-reg1'), def);
  assert.equal(heroiPorId('pc-guerreiro').name, 'Dara');
});

teste('o save leva a definição na config, e ela volta válida', () => {
  const r = rascunho('elfoFloresta', 'patrulheiro');
  r.nome = 'Ayla';
  r.arte = ARTE;
  const def = definicaoDoRascunho(r, 'pc-criado-ayla');
  registrarHeroi(def);
  const c = montarHeroi(def.id);
  const config = { modo: 'campanha', aventura: 'mina-perdida', variante: 'emboscada', nivel: 1, herois: [{ id: def.id, escolha: escolhaAutomatica(def.id), definicao: def }] };
  const m = montarSave({ id: 'auto-1', nome: 'Teste', agora: 1, config, herois: [c] });
  assert.ok(m.ok, m.erro);
  assert.ok(validarSave(m.save).ok, validarSave(m.save).erro);
  const volta = JSON.parse(JSON.stringify(m.save));
  assert.ok(definicaoValida(volta.config.herois[0].definicao));
  assert.equal(volta.herois[0].look, `arte:${def.id}`);
});

teste('os treze antecedentes do Livro do Jogador: as duas perícias do livro, um talento de origem que existe e o motivo', () => {
  const talentos = new Set(TALENTOS_DE_ORIGEM.map((t) => t.id));
  assert.equal(Object.keys(ANTECEDENTES).length, 13);
  for (const [id, a] of Object.entries(ANTECEDENTES)) {
    assert.equal(a.pericias.length, 2, id);
    for (const p of a.pericias) assert.ok(SKILLS[p], `${id}: ${p}`);
    assert.ok(talentos.has(a.talento), `${id}: ${a.talento}`);
    assert.ok(MOTIVO_DO_ANTECEDENTE[id], `${id} tem motivo`);
    const r = novoRascunho('guerreiro');
    r.antecedente = id;
    assert.ok(periciasFixas(r).every((p) => SKILLS[p]));
  }
  assert.deepEqual(ANTECEDENTES.heroiDoPovo.pericias, ['lidarComAnimais', 'sobrevivencia'], 'o Herói do Povo do livro');
  assert.equal(ANTECEDENTES.forasteiro.iniciado, 'druida', 'o Forasteiro inicia na lista do druida, como o Guia de 2024');
});

// ------------------------------------------------------------------------------------- o humano variante ----
teste('humano variante: dois +1 quaisquer, uma perícia qualquer e um talento do Livro do Jogador no 1º nível', () => {
  const r = rascunho('humanoVariante', 'mago');
  assert.ok(RACAS_DO_CRIADOR.includes('humanoVariante'));
  const base = { ...r.base };
  r.livres = ['int', 'cha'];
  const f = atributosFinais(r);
  assert.equal(f.int, base.int + 1);
  assert.equal(f.cha, base.cha + 1, 'o Carisma vale, ao contrário do meio-elfo');
  assert.equal(f.str, base.str, 'sem o +1 de tudo do humano comum');
  r.talentoVariante = { id: 'conjuradorDeGuerra' };
  r.periciasLivres = ['furtividade'];
  assert.deepEqual(problemasDoRascunho(r), []);
  const def = definicaoDoRascunho(r, novoId(rng));
  assert.ok(definicaoValida(def));
  assert.ok(def.skills.includes('furtividade'));
  registrarHeroi(def);
  const c = montarHeroi(def.id);
  assert.ok(c.talentos.includes('conjuradorDeGuerra'), c.talentos.join(','));
  assert.equal(c.talentos.length, 2, 'o de origem E o do variante');
});

teste('humano variante: o pré-requisito vale no 1º nível — o guerreiro não pega Conjurador de Guerra', () => {
  const r = rascunho('humanoVariante', 'guerreiro');
  assert.match(talentosDoVariante(r).find((t) => t.id === 'conjuradorDeGuerra').motivo, /conjurar/);
  assert.match(talentosDoVariante(rascunho('humanoVariante', 'paladino')).find((t) => t.id === 'conjuradorDeGuerra').motivo, /conjurar/,
    'o paladino só conjura no 2º nível');
  r.talentoVariante = { id: 'conjuradorDeGuerra' };
  assert.ok(problemasDoRascunho(r).some((p) => /Humano variante/.test(p)));
});

teste('humano variante com o Vigoroso: o de origem troca para não repetir, e o PV soma +2 por nível desde o 1º', () => {
  const r = rascunho('humanoVariante', 'guerreiro');
  const def = definicaoDoRascunho(r, novoId(rng));
  registrarHeroi(def);
  const e = escolhaAutomatica(def.id);
  assert.notEqual(e.talento, 'vigoroso', 'o soldado sugeriria o Vigoroso de origem; o variante já o tem');
  assert.deepEqual(problemasDaEscolha(def.id, e), []);
  assert.ok(problemasDaEscolha(def.id, { ...e, talento: 'vigoroso' }).some((p) => /variante/.test(p)));
  const c = montarHeroi(def.id, e);
  assert.ok(c.talentos.includes('vigoroso'));
  const mod = Math.floor((c.abilities.con - 10) / 2);
  assert.equal(c.maxHp, 10 + mod + 2, 'no 1º: d10 + CON + 2');
  subirNivel(c);
  assert.equal(c.maxHp, 10 + 6 + 2 * mod + 4, 'no 2º: a média do d10, a CON e mais 2');
});

teste('humano variante com o Durável: o +1 de Constituição entra no PV do 1º nível', () => {
  const r = rascunho('humanoVariante', 'guerreiro');
  r.livres = ['str', 'dex'];
  const con = atributosFinais(r).con;
  r.talentoVariante = { id: 'duravel' };
  const def = definicaoDoRascunho(r, novoId(rng));
  registrarHeroi(def);
  const c = montarHeroi(def.id);
  assert.equal(c.abilities.con, con + 1);
  const mod = Math.floor((c.abilities.con - 10) / 2);
  assert.equal(c.maxHp, 10 + mod + (c.talentos.includes('vigoroso') ? 2 : 0), 'd10 + a CON nova');
});

console.log(`\n${total - falhas}/${total} testes do criador passaram.`);
if (falhas) process.exit(1);
