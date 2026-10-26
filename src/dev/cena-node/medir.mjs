// Mede UMA luta da cena, N vezes. Ver o cabeçalho de `lib.mjs`.
//   node --import ./src/dev/cena-node/register.mjs src/dev/cena-node/medir.mjs <bando> [N] [nivel]
import { novaCena, lutar, paineis } from './lib.mjs';
import { CEN } from './cen.mjs';

const nome = process.argv[2];
const N = Number(process.argv[3] ?? 20);
const nivel = Number(process.argv[4] ?? 3);
if (!CEN[nome]) { console.error('bandos:', Object.keys(CEN).join(', ')); process.exit(1); }
const res = [];
for (let i = 0; i < N; i += 1) {
  const S = await novaCena(0x51b0 + i * 7919, { nivel });
  paineis.length = 0;
  const ok = await CEN[nome](S, {});
  if (!ok) { res.push({ semLuta: true }); continue; }
  const foes = S.enc.combatants.filter((x) => x.side === 'foes').length;
  const r = lutar(S);
  r.foes0 = foes;
  r.fugiu = Boolean(S.app.campanha.arvoreTrovao?.dragaoFugiu);
  // Quantos inimigos passaram pelo tabuleiro no total (a luta inicial mais os reforços).
  r.foesTotais = S.enc.combatants.filter((x) => x.side === 'foes').length;
  res.push(r);
}
const L = res.filter((r) => !r.semLuta);
if (!L.length) { console.log(JSON.stringify({ nome, semLuta: res.length })); process.exit(0); }
const pct = (f) => Math.round(L.filter(f).length / L.length * 100);
const med = (f) => (L.reduce((s, r) => s + f(r), 0) / L.length).toFixed(2);
console.log(JSON.stringify({
  nome, nivel, N, semLuta: res.length - L.length, vit: pct((r) => r.venceu), derrota: pct((r) => r.derrota),
  travou: pct((r) => r.travou), rodadas: med((r) => r.rodadas), hpPerdido: (100 - Number(med((r) => r.hpPct))).toFixed(0) + '%',
  caiu: pct((r) => r.caiu > 0), morte: pct((r) => r.morreu > 0), surpresos: med((r) => r.surpresos),
  dragaoFugiu: pct((r) => r.fugiu),
  foesNoInicio: med((r) => r.foes0), foesNoTotal: med((r) => r.foesTotais),
}));
