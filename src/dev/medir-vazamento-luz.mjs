// MEDE O VAZAMENTO DA VISÃO pelos traços de parede, cena a cena.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/medir-vazamento-luz.mjs [cena...]
//
// O polígono de visão (`view/raios.js`) para o raio no primeiro traço que barra. O revisor de render achou riscos finos
// de luz atravessando parede no labirinto, no Behir, no covil e em Illithinoch. Há DOIS jeitos de o raio passar, e esta
// conta separa os dois, porque o conserto de um não serve para o outro:
//
//   exceção   o raio cruza um traço de PAREDE (ou etéreo) e segue, porque a aresta de casa onde ele cruza deixa ver.
//             A exceção existe para a porta aberta (a aresta dela decide), mas valia também para a aresta VAZIA.
//   fresta    o raio não cruza traço nenhum: passa entre duas pontas que quase se tocam (a menos de `FRESTA` casa) e
//             segue mais de uma casa adiante.
//
// Um raio de cada tipo, contado em cada origem de uma amostra das casas de chão (uma a cada `PASSO`), com o mesmo
// raio e o mesmo leque do jogo. Sem argumento, roda as cenas com traço.
import { mapaDo } from '../game/encounter.js';
import { montarCampo } from '../game/campo.js';
import { poligonoDeVisao } from '../view/raios.js';
import { ARESTA } from '../core/grid.js';

const PASSO = 2;
const RAIO = 12;
const LEQUE = 360;
const FRESTA = 0.08;
const CENAS = process.argv.slice(2).length ? process.argv.slice(2) : [
  'esconderijo', 'mansao', 'poco', 'cume', 'castelo', 'arvoreTrovao', 'ondaEco', 'cavernaDoPoco', 'acampamentoSawplee',
  'giganteTerreo', 'zorzulaPosto', 'zorzulaMinas', 'santuarioIndigo', 'casaMarthungrim', 'minaHardyhammer', 'largoDaVaca',
  'tunelGrells', 'tunelBehir', 'tunelGruta', 'illithinoch', 'fendaTrincheiras', 'fendaOco', 'fendaLabirinto', 'labirintoSalgado',
  'covilLowarnizel', 'vazioCupula', 'vazioPonte', 'vazioCharco', 'vazioNematodeo', 'vazioMiasma', 'vazioEstatua', 'vazioCampo',
  'vazioAnima', 'talhundereth', 'criptaTalhund',
];

function cruza(ox, oy, dx, dy, c, e) {
  const sx = e[0] - c[0];
  const sy = e[1] - c[1];
  const den = dx * sy - dy * sx;
  if (Math.abs(den) < 1e-9) return Infinity;
  const qx = c[0] - ox;
  const qy = c[1] - oy;
  const t = (qx * sy - qy * sx) / den;
  const u = (qx * dy - qy * dx) / den;
  return t > 1e-6 && u >= 0 && u <= 1 ? t : Infinity;
}

const total = { raios: 0, excecao: 0, fresta: 0 };
for (const cena of CENAS) {
  let m;
  try { m = mapaDo(cena); } catch { continue; }
  if (!m?.tracos?.length) continue;
  const f = montarCampo(m);
  const segs = [];
  for (const lista of f.indiceDosTracos().values()) for (const s of lista) segs.push(s);
  const unicos = [...new Set(segs)];
  const paredes = unicos.filter((s) => s.codigo === ARESTA.parede || s.codigo === ARESTA.eterea);
  // FRESTA DE VERDADE: a ponta de parede que fica a menos de `FRESTA_MAX` casa de OUTRA parede sem encostar nela — o "T"
  // que não fecha e a quina que não se encontra. Ponta solta (a parede que termina no meio da sala) não é fresta.
  const FRESTA_MAX = 0.12;
  const distSeg = (p, a, b) => {
    const vx = b[0] - a[0];
    const vy = b[1] - a[1];
    const L2 = vx * vx + vy * vy || 1e-12;
    const u = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2));
    return Math.hypot(a[0] + u * vx - p[0], a[1] + u * vy - p[1]);
  };
  // as pontas do TRAÇO (sem o fio da geometria), para a fresta ser a mesma antes e depois do conserto
  const brutos = [];
  for (const [t, linha] of (m.tracos ?? []).entries()) {
    const cod = m.tracosTipo?.[t] ?? null;
    if (cod && cod !== 'E') continue;
    for (let i = 0; i + 1 < linha.length; i++) brutos.push([linha[i], linha[i + 1]]);
  }
  const pontas = [];
  for (const s of brutos) {
    for (const p of [s[0], s[1]]) {
      const d = Math.min(...brutos.filter((o) => o !== s).map((o) => distSeg(p, o[0], o[1])));
      if (d > 1e-4 && d < FRESTA_MAX) pontas.push(p);
    }
  }
  let raios = 0;
  let excecao = 0;
  let fresta = 0;
  const onde = new Map();
  for (let y = 0; y < f.h; y += PASSO) {
    for (let x = 0; x < f.w; x += PASSO) {
      if (f.blocksMove(x, y)) continue;
      const ox = x + 0.5;
      const oy = y + 0.5;
      const pts = poligonoDeVisao(f, ox, oy, RAIO, LEQUE);
      for (let i = 0; i < LEQUE; i++) {
        const ang = (i / LEQUE) * Math.PI * 2;
        const dx = Math.cos(ang);
        const dy = Math.sin(ang);
        const t = Math.hypot(pts[i * 2] - ox, pts[i * 2 + 1] - oy);
        raios += 1;
        let tParede = Infinity;
        for (const s of paredes) tParede = Math.min(tParede, cruza(ox, oy, dx, dy, s[0], s[1]));
        if (t > tParede + 0.05) {
          excecao += 1;
          const k = `${Math.floor(ox + tParede * dx)},${Math.floor(oy + tParede * dy)}`;
          onde.set(k, (onde.get(k) ?? 0) + 1);
          continue;
        }
        // fresta: o raio passa a menos de FRESTA de uma ponta de parede e segue mais de uma casa adiante dela
        for (const p of pontas) {
          const px = p[0] - ox;
          const py = p[1] - oy;
          const proj = px * dx + py * dy;
          if (proj <= 0 || proj + 1 > t) continue;
          if (Math.abs(px * dy - py * dx) < FRESTA) {
            fresta += 1;
            const k = `${Math.floor(p[0])},${Math.floor(p[1])}`;
            onde.set(`fresta ${k}`, (onde.get(`fresta ${k}`) ?? 0) + 1);
            break;
          }
        }
      }
    }
  }
  total.raios += raios;
  total.excecao += excecao;
  total.fresta += fresta;
  const piores = [...onde.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => `${k} (${n})`).join(', ');
  console.log(`${cena.padEnd(20)} ${String(raios).padStart(8)} raios   exceção ${String(excecao).padStart(6)}   fresta ${String(fresta).padStart(6)}   ${piores}`);
}
console.log(`\nTOTAL ${total.raios} raios: ${total.excecao} pela exceção da aresta, ${total.fresta} por fresta entre pontas`);
