// Mede cada luta da Caverna Onda Eco com o motor de verdade (o mesmo harness de Árvore Trovão).
//
//   ALVO=ondaEco node --import ./src/dev/cena-node/register.mjs src/dev/cena-node/ondaeco.mjs [N] [nivel] [bando...]
//
// Para cada gatilho, o grupo é posto na entrada da área (o primeiro herói pisa, os outros chegam junto) e a
// cena dispara a luta; `lutar` joga até o fim. Mede PV perdidos, rodadas, quem cai e quem morre.
process.env.ALVO = 'ondaEco';
const { novaCena, lutar, paineis, B, A } = await import('./lib.mjs');

const N = Number(process.argv[2] ?? 20);
const nivel = Number(process.argv[3] ?? 4);
const so = process.argv.slice(4);

// gatilho: a área onde o grupo pisa; `ponto` é onde o grupo fica (perto da entrada dela, dentro do chão da área).
const GATILHOS = {
  stirges: { area: '3' }, esqueletos: { area: '4' }, ghoulsSul: { area: '6' }, ghoulsGrande: { area: '9' },
  gosma: { area: '2', sozinho: true }, bugbearsNorte: { area: '11' }, zumbis: { area: '12' },
  fenda: { area: '18' }, espectador: { area: '15', conversa: true }, mormesk: { area: '14', conversa: true },
  templo: { area: '19', conversa: true },
};

function celulasDe(area) {
  return (A.areas[area] ?? []).map((c) => ({ x: c.x, y: c.y }));
}

async function um(nome, g, seed) {
  const S = await novaCena(seed, { nivel });
  // as portas de pedra nao atrapalham a medicao: o grupo chega pela porta aberta
  for (const [u, v] of A.folhas ?? []) S.field.porAresta(u.x, u.y, v.x, v.y, B.ARESTA.aberta);
  const cels = celulasDe(g.area);
  // o ponto de chegada: a casa da área mais perto do grupo (pela distância de custo a partir da chegada)
  const custo = S.field.reachable(A.chegada, 100000, () => false);
  const alvo = cels.filter((c) => custo.get(`${c.x},${c.y}`)).sort((a, b) => custo.get(`${a.x},${a.y}`).cost - custo.get(`${b.x},${b.y}`).cost)[0];
  if (!alvo) return { semAlvo: true };
  // o grupo em bloco ao redor do ponto (cada um na casa livre mais perto)
  const usados = new Set();
  S.party.forEach((h, i) => {
    const livre = [...custo.keys()].map((k) => k.split(',').map(Number)).map(([x, y]) => ({ x, y }))
      .filter((c) => !usados.has(`${c.x},${c.y}`) && Math.abs(c.x - alvo.x) + Math.abs(c.y - alvo.y) <= 3 && !S.enc.occupied(c.x, c.y, h))
      .sort((a, b) => (Math.abs(a.x - alvo.x) + Math.abs(a.y - alvo.y)) - (Math.abs(b.x - alvo.x) + Math.abs(b.y - alvo.y)))[0];
    h.pos = { ...(livre ?? alvo) };
    usados.add(`${h.pos.x},${h.pos.y}`);
  });
  paineis.length = 0;
  if (g.sozinho) {
    // os outros, na mesma area mas a mais de 20 pes do primeiro (a gosma so ataca quem fica sozinho)
    const longe = cels.filter((c) => custo.get(`${c.x},${c.y}`) && Math.abs(c.x - alvo.x) + Math.abs(c.y - alvo.y) >= 8);
    S.party.slice(1).forEach((h, i) => { h.pos = { ...longe[(i * 7) % longe.length] }; });
  }
  await S.cena.depoisDeMover(S.party[0]);
  if (S.cena.explorando) return { semLuta: true };
  const foes = S.enc.combatants.filter((c) => c.side === 'foes').length;
  const r = lutar(S);
  r.foes0 = foes;
  return r;
}

const nomes = so.length ? so : Object.keys(GATILHOS);
for (const nome of nomes) {
  const g = GATILHOS[nome];
  if (!g) { console.log('bando desconhecido', nome); continue; }
  const res = [];
  for (let i = 0; i < N; i++) res.push(await um(nome, g, 0x51b0 + i * 7919));
  const L = res.filter((r) => !r.semLuta && !r.semAlvo);
  if (!L.length) { console.log(JSON.stringify({ nome, semLuta: res.length, motivo: res[0] })); continue; }
  const pct = (f) => Math.round(L.filter(f).length / L.length * 100);
  const med = (f) => (L.reduce((s, r) => s + f(r), 0) / L.length).toFixed(2);
  console.log(JSON.stringify({
    nome, nivel, N, lutas: L.length, vit: pct((r) => r.venceu), derrota: pct((r) => r.derrota), travou: pct((r) => r.travou),
    rodadas: med((r) => r.rodadas), hpPerdido: (100 - Number(med((r) => r.hpPct))).toFixed(0) + '%',
    caiu: pct((r) => r.caiu > 0), morte: pct((r) => r.morreu > 0), foesNoInicio: med((r) => r.foes0),
  }));
}
void B;
