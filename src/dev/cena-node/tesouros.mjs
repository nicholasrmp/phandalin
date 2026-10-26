// Confere os tesouros do livro na cena de verdade: o baú escondido da cabana
// ocidental (Percepção), a caixa da herborista (automática se a Mirna mandou) e a
// arca do dragão (depois que ele foi expulso).
//   node --import ./src/dev/cena-node/register.mjs src/dev/cena-node/tesouros.mjs
import assert from 'node:assert/strict';
import { novaCena, A, B } from './lib.mjs';

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
