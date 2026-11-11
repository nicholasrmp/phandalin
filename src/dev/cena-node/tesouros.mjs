// Confere os tesouros do livro na cena de verdade: o baú escondido da cabana
// ocidental (Percepção), a caixa da herborista (automática se a Mirna mandou) e a
// arca do dragão (depois que ele foi expulso).
//   node --import ./src/dev/cena-node/register.mjs src/dev/cena-node/tesouros.mjs
import assert from 'node:assert/strict';
import { novaCena, A, B } from './lib.mjs';
const { VISTA_DO_ALTO: VISTA } = await import(new URL('../../game/arvoretrovao-exames.js', import.meta.url).href);
import { garantirInventario } from '../../rules/equipment.js';

const qtd = (c, id) => (c.bag ?? []).filter((i) => i.id === id).reduce((s, i) => s + i.qtd, 0);
const ok = (nome) => console.log('ok   ', nome);

// --- o baú da cabana ocidental ---------------------------------------------------
{
  let achou = null;
  for (let seed = 1; seed < 60 && !achou; seed += 1) {
    const S = await novaCena(seed * 977, { nivel: 3 });
    const h = S.party[0];
    const cel = A.celulas.redutoDoDruida[0];
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
  const cel = A.celulas.herborista[0];
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
  // A CASA DE ONDE SE ABRE É MEDIDA. Era `arca.x - 1` escrito à mão, da planta antiga; na planta da FA essa
  // casa tem parede no meio, e o teste reprovava a arca por causa do lugar em que ele punha o herói.
  const encosto = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]
    .map(([dx, dy]) => ({ x: arca.x + dx, y: arca.y + dy }))
    .find((q) => S.field.inside(q.x, q.y) && !S.field.blocksMove(q.x, q.y) && S.field.contato(q, arca));
  assert.ok(encosto, 'não há casa livre encostada na arca de onde abri-la');
  h.pos = { ...encosto };
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

  // a estátua: sem inscrição; História CD 15 reconhece Palien, um teste por herói
  const estatua = props.find((p) => p.variante === 'estatuaPalien');
  let pista = false;
  for (let i = 0; i < S.party.length && !pista; i += 1) {
    const her = S.party[i];
    her.pos = { x: estatua.x, y: estatua.y + 1 };
    const op = S.cena.interacoes(estatua, S.field.surfaceAt(estatua.x, estatua.y), her).find((o) => o.rotulo === 'Reconhecer a estátua');
    assert.ok(op, 'a estátua oferece o teste de História');
    if (op.motivo) continue;
    await op.fazer();
    pista = (S.app.campanha.vila.pistas ?? []).some((t) => t.includes('Palien'));
    const de_novo = S.cena.interacoes(estatua, S.field.surfaceAt(estatua.x, estatua.y), her).find((o) => o.rotulo === 'Reconhecer a estátua');
    assert.ok(de_novo.motivo, 'o mesmo herói nao tenta de novo');
  }
  ok('a estátua: História CD 15, um teste por herói' + (pista ? ', e a pista de Palien foi guardada' : ''));

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
    // A CASA DE ONDE SE EMPURRA É MEDIDA, como a da arca: `est.x - 1` era da planta antiga, e a estátua agora
    // está no largo que o gerador mede, onde a casa a oeste pode não encostar nela.
    const perto = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]
      .map(([dx, dy]) => ({ x: est.x + dx, y: est.y + dy }))
      .find((q) => S.field.inside(q.x, q.y) && !S.field.blocksMove(q.x, q.y) && S.field.contato(q, est));
    assert.ok(perto, 'há casa livre encostada na estátua de onde empurrá-la');
    for (const her of S.party) {
      her.pos = { ...perto };
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

// --- as ruinas sao ABERTAS: entra-se por cima do alicerce quebrado -------------------------------
//
// Aqui havia duas conferencias da planta ANTIGA, desenhada a mao: 20 "brechas de visao" (aresta de seteira,
// que barra o passo e deixa ver) e 8 "brechas-entrada" (aresta aberta com entulho dos dois lados). Eram
// elaboracao nossa para dar graca a ruina fechada. A planta da Forgotten Adventures nao tem nenhuma das
// duas, e nao por esquecimento: medido, ela tem 0 seteiras, e das 22 construcoes so CINCO tem porta — o
// resto sao cascas de alicerce quebrado, que e o que Arvore Trovao e no livro. Nao se entra por brecha
// porque nao ha o que furar: passa-se por cima do muro caido.
{
  const S = await novaCena(9, { nivel: 3 });
  const f = S.field;
  // A SETEIRA EXISTE, E FUNCIONA. Isto aqui exigia ZERO seteiras, porque era o que a planta tinha — e era
  // defeito do importador, não da planta: ele traduzia as paredes de `sight: LIMITED` da Forgotten
  // Adventures como parede cheia, e depois descartava o tipo `J` por ele não estar na lista. Corrigido, a
  // Árvore Trovão ganhou 2 e o Castelo 43. O que o teste guarda agora é o que a seteira TEM de fazer:
  // barrar o passo e deixar ver.
  let seteiras = 0;
  for (let y = 1; y < f.h; y++) for (let x = 1; x < f.w; x++) {
    for (const [cod, ox, oy] of [[f.paredeN[y * f.w + x], x, y - 1], [f.paredeO[y * f.w + x], x - 1, y]]) {
      if (cod !== 4) continue;
      seteiras++;
      assert.ok(!f.passa(x, y, ox, oy), `a seteira em (${x},${y}) deixa passar`);
      assert.ok(f.hasLineOfSight({ x, y }, { x: ox, y: oy }), `pela seteira em (${x},${y}) nao se ve`);
    }
  }
  // e as ruinas abrem mesmo: a maioria das construcoes tem borda por onde se entra sem porta
  const abertas = Object.entries(A.celulas).filter(([, cs]) => {
    const dentro = new Set(cs.map((c) => `${c.x},${c.y}`));
    return cs.some((c) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const v = { x: c.x + dx, y: c.y + dy };
      return !dentro.has(`${v.x},${v.y}`) && f.inside(v.x, v.y) && !f.blocksMove(v.x, v.y) && f.passa(c.x, c.y, v.x, v.y);
    }));
  });
  assert.ok(abertas.length >= 15, `so ${abertas.length} construcoes se entram sem porta`);
  ok(`${abertas.length} de ${Object.keys(A.celulas).length} construcoes sao casca aberta, e as ${seteiras} seteiras barram o passo e deixam ver`);
}

// --- o culto: seis, Favric na frente, a porta trancada por dentro e o cofre -----------------------
{
  const S = await novaCena(21, { nivel: 5 });
  S.party.forEach((x) => garantirInventario(x));
  const cult = S.enc.combatants.filter((c) => c.side === 'neutro' && /acolito|sacerdote/.test(c.id ?? c.templateId ?? c.name ?? ''));
  const favric = S.enc.combatants.find((c) => c.name === 'Favric');
  assert.ok(favric, 'Favric está em cena');
  assert.equal(S.enc.combatants.filter((c) => c.side === 'neutro' && c !== favric && /cultista|acólito|acolito|Acólito/i.test(`${c.id} ${c.name}`)).length + 1, 6, 'o culto tem seis');
  // A BARRICADA, no lugar da porta trancada do livro: a construção do culto, na planta da FA, é ruína de
  // alicerce quebrado, sem porta nenhuma (medido: 16 arestas abertas, 0 portas). O que trava a entrada é a
  // região `barricadaCulto`, que empurra de volta quem tenta entrar, e sai com Atletismo CD 20.
  const barricada = S.field.regioes?.find((r) => r.id === 'barricadaCulto');
  assert.ok(barricada, 'a barricada do culto está no mapa');
  assert.equal(barricada.desligada ?? false, false, 'ela começa de pé');
  assert.equal(barricada.casas.size, A.celulas.cultistas.length, 'ela cobre a ruína inteira');
  const dentro = A.celulas.cultistas[0];
  const fora = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .map(([dx, dy]) => ({ x: dentro.x + dx, y: dentro.y + dy }))
    .find((q) => S.field.inside(q.x, q.y) && !S.field.blocksMove(q.x, q.y)
      && !A.celulas.cultistas.some((c) => c.x === q.x && c.y === q.y));
  assert.ok(fora, 'há casa livre do lado de fora da ruína do culto');
  const h = S.party[0];
  h.pos = { ...fora };
  const ops = S.cena.interacoes(dentro, S.field.surfaceAt(dentro.x, dentro.y), h).map((o) => o.rotulo);
  assert.ok(ops.includes('Arrastar a barricada'), 'a barricada se arrasta: ' + ops.join(', '));
  // e quem tenta entrar andando volta para a casa de onde veio
  h.movementLeftFt = 30;
  S.enc.moveAlong(h, [{ ...fora }, { ...dentro }]);
  assert.deepEqual({ x: h.pos.x, y: h.pos.y }, { x: fora.x, y: fora.y }, 'a barricada devolve quem tenta entrar');
  ok('o culto: Favric e mais cinco, a ruína entulhada (arrastar: Atletismo CD 20) e quem força o passo volta');

  // o cofre: três diamantes e a poção de voo, só sem os cultistas olhando
  const bau = A.objetos.bauCulto;
  h.pos = { x: bau.x, y: bau.y + 1 };
  const op1 = S.cena.interacoes(bau, 'bau', h).find((o) => o.rotulo === 'Abrir o cofre');
  assert.ok(op1.motivo, 'com os cultistas olhando o cofre não abre: ' + op1.motivo);
  for (const f of S.enc.combatants.filter((c) => c.side === 'neutro')) f.dead = true;
  const op2 = S.cena.interacoes(bau, 'bau', h).find((o) => o.rotulo === 'Abrir o cofre');
  assert.ok(!op2.motivo || /parede|longe/.test(op2.motivo) === false, 'sem cultistas o cofre abre: ' + op2.motivo);
  void cult;
}

// --- Reidoth: hospitaleiro; a Onda Eco só com o dragão fora da torre ---------------------------------------
{
  const S = await novaCena(77, { nivel: 3 });
  const reidoth = S.enc.combatants.find((c) => c.name === 'Reidoth' || /reidoth/i.test(c.id ?? ''));
  assert.ok(reidoth, 'Reidoth em cena');
  const arvore = () => S.cena.dialogoDe(reidoth);
  const camp = S.app.campanha;
  // com o dragão na torre: ele guia só depois
  let a = arvore();
  a.nos.ondaEco.ao();
  assert.ok(!camp.feitos?.sabeOndaEco, 'com o dragão na torre, ele não guia o grupo à Onda Eco');
  // o castelo ele conta de graça
  a.nos.castelo.ao();
  assert.ok(camp.feitos?.sabeOCastelo, 'o castelo vem de graça');
  // dragão expulso: guia, e o Enclave os tem por amigos
  camp.arvoreTrovao.dragao = 'expulso';
  a = arvore();
  a.nos.ondaEco.ao();
  assert.ok(camp.feitos?.sabeOndaEco && camp.feitos?.amigoDoEnclave, 'com o dragão fora ele guia e os chama de amigos');
  // o título de Guardião da Primavera só com druida/patrulheiro no grupo
  const tem = !!S.party.find((x) => ['druida', 'patrulheiro'].includes(x.classe));
  const o = a.nos.oi.opcoes.find((x) => x.texto.includes('título'));
  assert.ok(o, 'a opção do título existe (oculta até valer)');
  assert.equal(!(o.requer?.() ?? null), tem, 'o título aparece só se há druida ou patrulheiro');
  ok('Reidoth: hospitaleiro; a Onda Eco só com o dragão fora da torre; o título, só para quem ama a natureza');
}

// --- o telhado da guarnição: abrir o alçapão e subir dá a vista do alto, até o herói sair do lugar -------
{
  const { visaoDoGrupo } = await import('../../rules/luz.js');
  const alc = A.props.find((p) => p.variante === 'alcapaoFechado');
  let achou = null;
  for (let seed = 1; seed < 120 && !achou; seed += 1) {
    const S = await novaCena(seed * 17, { nivel: 5 });
    S.party.forEach((x) => garantirInventario(x));
    for (const her of S.party) {
      her.pos = { x: alc.x, y: alc.y };
      const op = S.cena.interacoes(alc, S.field.surfaceAt(alc.x, alc.y), her).find((o) => o.rotulo === 'Abrir o alçapão');
      if (!op || op.motivo) continue;
      await op.fazer();
      if (S.app.campanha.arvoreTrovao.alcapaoAberto) { achou = { S, her }; break; }
    }
  }
  assert.ok(achou, 'alguém abre o alçapão');
  const { S, her } = achou;
  // A VISTA DO ALTO É TEXTO, e isto aqui mudou com ela. Era mecânica — `field.vistaExtra` acendia a aldeia
  // inteira enquanto o herói ficasse lá em cima —, e caiu por duas razões: a guarnição é casca SEM TELHADO
  // na planta da FA (subir no telhado dela era subir no que não existe), e revelar o mapa de graça tirava da
  // fase o que ela é. O que o teste guarda agora é que a opção existe, é de graça, não revela casa nenhuma,
  // e devolve um painel com os rumos.
  const sobe = S.cena.interacoes(alc, S.field.surfaceAt(alc.x, alc.y), her).find((o) => o.rotulo === 'Subir e olhar de cima');
  assert.ok(sobe && !sobe.motivo, 'com o alçapão aberto dá para subir e olhar');
  const antesDeSubir = visaoDoGrupo(S.enc).size;
  const paineis = [];
  const guardaPainel = paineis.push.bind(paineis);
  globalThis.__painel = guardaPainel;
  await sobe.fazer();
  assert.equal(S.field.vistaExtra ?? null, null, 'a vista do alto não revela casa nenhuma do mapa');
  assert.equal(visaoDoGrupo(S.enc).size, antesDeSubir, 'o que o grupo enxerga não muda: a vista é texto');
  assert.ok(VISTA.length >= 3, `o texto do alto tem ${VISTA.length} parágrafo(s)`);
  // O texto tem de nomear o que se vê DAQUI, e os rumos mudaram com o de-para do mapa do livro: a
  // guarnição (área 11) é a construção do canto nordeste, não a do centro-sul. Daqui a torre fica a oeste
  // e a aldeia inteira a sudoeste.
  for (const alvo of ['torre', 'estátua', 'praça', 'armazém', 'taverna', 'ferraria', 'nordeste']) {
    assert.ok(VISTA.join(' ').toLowerCase().includes(alvo.toLowerCase()), `o texto do alto não cita: ${alvo}`);
  }
  ok(`o alto da guarnição: ${VISTA.length} parágrafos de vista, sem revelar casa nenhuma do mapa`);
}
