// Confere as CENAS da Caverna Onda Eco que dependem de uma luta anterior (o harness `ondaeco.mjs` mede cada luta sozinha):
//
//   ALVO=ondaEco node --import ./src/dev/cena-node/register.mjs src/dev/cena-node/ondaeco-cenas.mjs [N] [nivel]
//
//   1. na caverna desmoronada (18), caídos dois bugbears, Vhalak recua para o templo (vivo, sem XP);
//   2. no templo, o recuo põe um "Nundro" amarrado ao lado de Nezznar; a Intuição está entre as opções, e quem luta
//      depois ganha o doppelganger como inimigo;
//   3. golpe não letal em Nezznar o deixa vivo (capturado) e a luta acaba em vitória.
process.env.ALVO = 'ondaEco';
const { novaCena, lutar, paineis, B, A } = await import('./lib.mjs');
const { descansoLongo } = await import('../../rules/descanso.js');

const N = Number(process.argv[2] ?? 8);
const nivel = Number(process.argv[3] ?? 5);

const celulasDe = (area) => (A.areas[area] ?? []).map((c) => ({ x: c.x, y: c.y }));

async function paraArea(S, area) {
  const cels = celulasDe(area);
  const custo = S.field.reachable(A.chegada, 100000, () => false);
  const alvo = cels.filter((c) => custo.get(`${c.x},${c.y}`)).sort((a, b) => custo.get(`${a.x},${a.y}`).cost - custo.get(`${b.x},${b.y}`).cost)[0];
  const usados = new Set();
  S.party.forEach((h) => {
    const livre = [...custo.keys()].map((k) => k.split(',').map(Number)).map(([x, y]) => ({ x, y }))
      .filter((c) => !usados.has(`${c.x},${c.y}`) && Math.abs(c.x - alvo.x) + Math.abs(c.y - alvo.y) <= 3 && !S.enc.occupied(c.x, c.y, h))
      .sort((a, b) => (Math.abs(a.x - alvo.x) + Math.abs(a.y - alvo.y)) - (Math.abs(b.x - alvo.x) + Math.abs(b.y - alvo.y)))[0];
    h.pos = { ...(livre ?? alvo) };
    usados.add(`${h.pos.x},${h.pos.y}`);
  });
  await S.cena.depoisDeMover(S.party[0]);
}

let comVhalak = 0, vitComVhalak = 0, morteComVhalak = 0, temploLimpo = 0, entregues = 0, fugiu = 0, ganhoXp = [], recuou = 0, semRecuo = 0, refemVisto = 0, intuicao = 0, doppelNaLuta = 0, nundroSobrou = 0, capturado = 0, vitoria = 0, rodadas = [];
for (let i = 0; i < N; i++) {
  const S = await novaCena(0x7a11 + i * 104729, { nivel });
  for (const [u, v] of A.folhas ?? []) S.field.porAresta(u.x, u.y, v.x, v.y, B.ARESTA.aberta);
  const salvo = S.app.campanha.ondaEco;
  let arvore = null;
  S.app.conversarCom = async (_npc, a) => { arvore = a; return 'luta'; };

  // 1. a fenda
  paineis.length = 0;
  await paraArea(S, '18');
  if (S.cena.explorando) { semRecuo++; continue; }
  const f1 = lutar(S);
  await S.cena.fimDoCombate(S.enc.outcome);
  if (!f1.venceu) { semRecuo++; continue; }
  if (salvo.vhalakRecuou) recuou++; else semRecuo++;

  // 2. o templo (com descanso longo antes, como o jogador faria no depósito: sem isso o grupo chega gasto da fenda)
  if (process.env.DESCANSO !== '0') for (const h of S.party) { descansoLongo(h); h.conditions = []; }
  paineis.length = 0;
  arvore = null;
  await paraArea(S, '19');
  if (arvore) {
    if (arvore.nos.oi.opcoes.some((o) => o.teste?.pericia === 'intuicao')) intuicao++;
    if (S.enc.combatants.some((c) => c.name === 'Nundro' && c.refem)) { /* removido ao começar a luta */ }
  }
  refemVisto += salvo.vhalakRecuou ? 1 : 0;
  const foes = S.enc.combatants.filter((c) => c.side === 'foes');
  if (foes.some((c) => c.defId === 'doppelganger')) doppelNaLuta++;
  if (S.enc.combatants.some((c) => c.name === 'Nundro' && c.side === 'neutro' && c.refem)) nundroSobrou++;

  // 3. Nezznar vivo: todos batem para derrubar, sem matar
  if (process.env.NL !== '0') for (const h of S.party) h.naoLetal = true;
  const r = lutar(S);
  rodadas.push(r.rodadas);
  await S.cena.fimDoCombate(S.enc.outcome);
  const nez = S.enc.combatants.find((c) => c.defId === 'nezznar');
  if (nez?.capturado && !nez.dead) {
    capturado++;
    // a volta: a saída oferece "Voltar à trilha", e Nezznar vivo é entregue em Phandalin (XP em dobro)
    const sai = A.saida[0];
    S.party.forEach((h) => { h.pos = { ...sai }; });
    const xp0 = S.party.reduce((s, h) => s + (h.xp ?? 0), 0);
    const op = S.cena.interacoes({ x: sai.x, y: sai.y }, 'mina', S.party[0]).find((o) => o.rotulo === 'Voltar à trilha');
    if (op) { globalThis.__preferir = i % 2 ? 'cela' : 'guarda'; await op.fazer(); }
    entregues += op && S.app.campanha.ondaEco.nezznarEntregue ? 1 : 0;
    ganhoXp.push(S.party.reduce((s, h) => s + (h.xp ?? 0), 0) - xp0);
    fugiu += S.app.campanha.feitos?.nezznarFugiu ? 1 : 0;
  }
  if (salvo.vhalakRecuou) { comVhalak++; if (r.venceu) vitComVhalak++; if (r.morreu > 0) morteComVhalak++; }
  if (r.venceu) { vitoria++; if (salvo.templo === 'limpo') temploLimpo++; }
}
console.log(JSON.stringify({ N, nivel, recuou, semRecuo, refemVisto, intuicao, doppelNaLuta, nundroSobrou, capturado, vitoria, comVhalak, vitComVhalak, morteComVhalak, temploLimpo, entregues, fugiu, ganhoXp }));
void paineis;
