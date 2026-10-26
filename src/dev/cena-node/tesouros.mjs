// Confere os tesouros do livro na cena de verdade: o baú escondido da cabana
// ocidental (Percepção), a caixa da herborista (automática se a Mirna mandou) e a
// arca do dragão (depois que ele foi expulso).
//   node --import ./src/dev/cena-node/register.mjs src/dev/cena-node/tesouros.mjs
import assert from 'node:assert/strict';
import { novaCena, A, B } from './lib.mjs';
import { garantirInventario } from '../../rules/equipment.js';

const qtd = (c, id) => (c.bag ?? []).filter((i) => i.id === id).reduce((s, i) => s + i.qtd, 0);
const ok = (nome) => console.log('ok   ', nome);

// --- o baú da cabana ocidental ---------------------------------------------------
{
  let achou = null;
  for (let seed = 1; seed < 60 && !achou; seed += 1) {
    const S = await novaCena(seed * 977, { nivel: 3 });
    const h = S.party[0];
    const cel = A.celulas.casa7[0];
    h.pos = { x: cel.x, y: cel.y };
    const tile = { x: cel.x, y: cel.y };
    const op = S.cena.interacoes(tile, S.field.surfaceAt(tile.x, tile.y), h).find((o) => o.rotulo === 'Revistar a cabana');
    assert.ok(op && !op.motivo, 'a cabana ocidental oferece a revista');
    await op.fazer();
    const salvo = S.app.campanha.arvoreTrovao;
    if (salvo.bauMercador === 'achado') achou = { S, h };
  }
  assert.ok(achou, 'em 60 jogos a Percepção CD 12 passa ao menos uma vez');
  const { S, h } = achou;
  const pos = A.objetos.bauMercador;
  assert.equal(S.field.surfaceAt(pos.x, pos.y), 'bau', 'a casa vira baú quando a busca passa');
  h.pos = { x: pos.x, y: pos.y + 1 };
  const abrir = S.cena.interacoes(pos, 'bau', h).find((o) => o.rotulo === 'Abrir o baú');
  assert.ok(abrir, 'o baú achado se abre');
  if (abrir.motivo) { h.pos = { x: pos.x - 1, y: pos.y }; }
  const abrir2 = S.cena.interacoes(pos, 'bau', h).find((o) => o.rotulo === 'Abrir o baú');
  assert.ok(abrir2 && !abrir2.motivo, 'dá para abrir de perto: ' + abrir2?.motivo);
  await abrir2.fazer();
  assert.equal(qtd(h, 'moedaDeCobre') >= 700, true, 'setecentas de cobre');
  assert.ok(qtd(h, 'moedaDePrata') >= 160 && qtd(h, 'moedaDeOuro') >= 90, 'cento e sessenta de prata e noventa de ouro');
  ok('o baú escondido da cabana: Percepção revela, e dá 700 pc, 160 pp, 90 po');
}

// --- a caixa da herborista, com a missão da Mirna --------------------------------
{
  const S2 = await novaCena(4242, { nivel: 3 });
  S2.app.campanha.vila.missoes.mirna = 'ativa';
  const h = S2.party[0];
  const cel = A.celulas.ervas[0];
  h.pos = { x: cel.x, y: cel.y };
  const rev = S2.cena.interacoes(cel, S2.field.surfaceAt(cel.x, cel.y), h).find((o) => o.rotulo === 'Revistar a loja');
  assert.ok(rev && !rev.motivo, 'a loja oferece a revista');
  await rev.fazer();
  assert.equal(S2.app.campanha.arvoreTrovao.caixaMirna, 'achada', 'com a missão ativa a Percepção passa sozinha');
  const pos = A.objetos.caixaMirna;
  assert.equal(S2.field.surfaceAt(pos.x, pos.y), 'bau', 'a casa vira caixa');
  h.pos = { x: pos.x, y: pos.y };
  h.pos = { x: pos.x + 1, y: pos.y };
  let abrir = S2.cena.interacoes(pos, 'bau', h).find((o) => o.rotulo === 'Abrir a caixa');
  if (!abrir || abrir.motivo) { h.pos = { x: pos.x, y: pos.y + 1 }; abrir = S2.cena.interacoes(pos, 'bau', h).find((o) => o.rotulo === 'Abrir a caixa'); }
  assert.ok(abrir && !abrir.motivo, 'dá para abrir de perto: ' + abrir?.motivo);
  await abrir.fazer();
  assert.equal(qtd(h, 'colarDeMirna'), 1, 'o colar vai para a mochila');
  ok('a caixa da herborista: automática com a missão da Mirna, e dá o colar de esmeralda');
  void B;
}

// --- a arca do dragão -------------------------------------------------------------
{
  const S = await novaCena(77, { nivel: 3 });
  const h = S.party[0];
  const arca = (() => {
    for (let y = 0; y < S.field.h; y += 1) for (let x = 0; x < S.field.w; x += 1) if (S.field.surfaceAt(x, y) === 'arca') return { x, y };
    return null;
  })();
  assert.ok(arca, 'a arca do dragão está desenhada');
  h.pos = { x: arca.x - 1, y: arca.y };
  const antes = S.cena.interacoes(arca, 'arca', h).find((o) => o.rotulo === 'Abrir a arca');
  assert.ok(antes?.motivo, 'com o dragão vivo a arca não abre');
  S.app.campanha.arvoreTrovao.dragao = 'expulso';
  const op = S.cena.interacoes(arca, 'arca', h).find((o) => o.rotulo === 'Abrir a arca');
  assert.equal(op?.motivo ?? null, null, 'depois de expulso, abre: ' + op?.motivo);
  await op.fazer();
  assert.equal(qtd(h, 'moedaDePrata') >= 800, true, 'oitocentas de prata');
  assert.equal(qtd(h, 'caliceDeSelenita'), 4, 'quatro cálices');
  assert.ok(h.weapons.includes('hew'), 'o machado Hew');
  ok('a arca do mago: 800 pp, 150 po, 4 cálices, 2 pergaminhos e o Hew, só com o dragão fora');
}

// --- o mobiliario: Examinar em toda peca, o casulo do livro, o altar e o recipiente ---------------
{
  const S = await novaCena(555, { nivel: 3 });
  const h = S.party[0];
  // A mochila nasce preguiçosa: sem isto a conta 'antes' ignora o que o herói já leva.
  S.party.forEach((x) => garantirInventario(x));
  const props = A.props;
  const rot = (tile) => S.cena.interacoes(tile, S.field.surfaceAt(tile.x, tile.y), h);
  // toda peca de mobilia tem "Examinar"
  const sem = [];
  for (const p of props) {
    h.pos = { x: p.x, y: p.y };
    if (!rot(p).some((o) => o.rotulo === 'Examinar')) sem.push(`${p.variante}@${p.x},${p.y}`);
  }
  assert.deepEqual(sem, [], 'toda peca de mobilia se examina: ' + sem.join(', '));
  ok(`as ${props.length} pecas de mobilia e cerca se examinam`);

  // o casulo da loja: poção, 23 po e 35 pp, uma vez só
  const casulo = props.find((p) => p.variante === 'casuloElfo');
  h.pos = { x: casulo.x, y: casulo.y };
  const antes = [qtd(h, 'pocaoDeCura'), qtd(h, 'moedaDeOuro'), qtd(h, 'moedaDePrata')];
  const rev = rot(casulo).find((o) => o.rotulo.startsWith('Cortar o casulo'));
  assert.ok(rev && !rev.motivo, 'o casulo se revista');
  await rev.fazer();
  assert.deepEqual([qtd(h, 'pocaoDeCura') - antes[0], qtd(h, 'moedaDeOuro') - antes[1], qtd(h, 'moedaDePrata') - antes[2]], [1, 23, 35]);
  assert.ok(!rot(casulo).some((o) => o.rotulo.startsWith('Cortar o casulo')), 'e so uma vez');
  ok('o casulo do armazem: poção de cura, 23 po e 35 pp, uma vez só');

  // o altar: um teste de Arcanismo por herói; o sucesso grava a pista
  const altar = props.find((p) => p.variante === 'altarEscama');
  let pista = false;
  for (let i = 0; i < S.party.length && !pista; i += 1) {
    const her = S.party[i];
    her.pos = { x: altar.x, y: altar.y };
    const op = S.cena.interacoes(altar, S.field.surfaceAt(altar.x, altar.y), her).find((o) => o.rotulo === 'Estudar a escama');
    assert.ok(op, 'o altar oferece o estudo');
    if (op.motivo) continue;
    await op.fazer();
    pista = (S.app.campanha.vila.pistas ?? []).some((t) => t.includes('escama'));
    const de_novo = S.cena.interacoes(altar, S.field.surfaceAt(altar.x, altar.y), her).find((o) => o.rotulo === 'Estudar a escama');
    assert.ok(de_novo.motivo, 'o mesmo herói nao tenta de novo');
  }
  ok('o altar: Arcanismo CD 10, um teste por herói' + (pista ? ', e a pista da escama foi guardada' : ''));

  // um recipiente: revistar uma vez; o achado e por casa
  const rec = props.find((p) => ['armario', 'estante', 'prateleira', 'guardaRoupa', 'escrivaninha'].includes(p.variante));
  h.pos = { x: rec.x, y: rec.y };
  const r = rot(rec).find((o) => o.rotulo === 'Revistar');
  assert.ok(r, 'o recipiente se revista');
  ok('os moveis de guardar se revistam (Investigação CD 10, achado sorteado por casa)');
}

// --- a estatua de Palien: derruba com Atletismo CD 20, vira monte de pedra e fica caida --------------
{
  const est = A.estatua;
  let caiu = null;
  for (let seed = 1; seed < 200 && !caiu; seed += 1) {
    const S = await novaCena(seed * 31, { nivel: 5 });
    S.party.forEach((x) => garantirInventario(x));
    for (const her of S.party) {
      her.pos = { x: est.x - 1, y: est.y };
      const op = S.cena.interacoes(est, S.field.surfaceAt(est.x, est.y), her).find((o) => o.rotulo === 'Empurrar a estátua');
      assert.ok(op, 'a estatua oferece empurrar');
      if (op.motivo) continue;
      await op.fazer();
      if (S.app.campanha.arvoreTrovao.estatuaCaiu) { caiu = { S, her }; break; }
    }
  }
  assert.ok(caiu, 'em 200 jogos alguem derruba a estatua');
  const { S, her } = caiu;
  assert.equal(S.field.surfaceAt(est.x, est.y), 'desabamento', 'a estatua vira um monte de pedra');
  assert.ok(S.field.blocksMove(est.x, est.y), 'e o monte barra o passo');
  const depois = S.cena.interacoes(est, S.field.surfaceAt(est.x, est.y), her).map((o) => o.rotulo);
  assert.ok(!depois.includes('Empurrar a estátua') && !depois.includes('Examinar'), 'caida, nao se empurra nem se examina');
  ok('a estatua de Palien: Atletismo CD 20, cai num monte de pedra que barra o passo');
}

// --- as brechas de visao das ruinas: seteira de borda (barra o passo, nao a visao) ----------------
{
  const S = await novaCena(9, { nivel: 3 });
  const f = S.field;
  let n = 0, passam = 0, naoVeem = 0;
  for (let y = 1; y < f.h; y++) for (let x = 1; x < f.w; x++) {
    for (const [cod, ox, oy] of [[f.paredeN[y * f.w + x], x, y - 1], [f.paredeO[y * f.w + x], x - 1, y]]) {
      if (cod !== 4) continue;               // ARESTA.seteira
      n++;
      if (f.passa(x, y, ox, oy)) passam++;
      if (!f.hasLineOfSight({ x, y }, { x: ox, y: oy })) naoVeem++;
    }
  }
  assert.ok(n >= 20, `ha brechas nas ruinas (${n})`);
  assert.equal(passam, 0, 'nenhuma brecha deixa passar');
  assert.equal(naoVeem, 0, 'toda brecha deixa ver');
  ok(`${n} brechas de visão: não se passa por nenhuma, e se vê por todas`);
}
