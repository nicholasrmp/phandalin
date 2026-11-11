// AS LUTAS DA ENCRUZILHADA DA FORCA (o Obelisco, capítulo 6), medidas: o elenco de cada sala contra o grupo pronto,
// N vezes, nas mesmas sementes, num campo aberto.
//
// NÃO é a sala de verdade (sem as paredes, a água, a névoa de G12 nem as seteiras de G24): serve para saber o peso de
// cada luta e comparar com o que o livro pede. O grupo chega no 7º nível, ou no 8º se já passou por Talhundereth.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/medir-encruzilhada.mjs [lutas] [nivel]

import { makeRng } from '../core/rng.js';
import { Battlefield } from '../core/grid.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { makeMonster } from '../rules/monsters.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { hasCondition } from '../rules/conditions.js';
import { playCharacter } from './balance.js';

const N = Number(process.argv[2] ?? 100);
const NIVEL = Number(process.argv[3] ?? 7);
const W = 18;
const H = 14;
const MAPA = Array.from({ length: H }, () => '.'.repeat(W));

function luta(elenco, semente) {
  const party = makeParty({ nivel: NIVEL });
  party.forEach((c, i) => { c.pos = { x: 2, y: 3 + i * 2 }; });
  const foes = elenco.map((id, i) => makeMonster(id, { x: 12 + (i % 3) * 2, y: 1 + (Math.floor(i / 3) * 3) % 12 }));
  const enc = new Encounter({ battlefield: new Battlefield(W, H, MAPA), party, foes, rng: makeRng(semente) });
  const total = party.reduce((s, c) => s + c.maxHp, 0);
  enc.start();
  let guarda = 1500;
  while (!enc.over && guarda-- > 0) {
    const pend = enc.allOf(enc.side).filter((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente'));
    if (!pend.length) { enc.maybeEndSide(); continue; }
    if (enc.side === 'party') playCharacter(enc, pend[0]);
    else takeMonsterTurn(enc, pend[0]);
    if (enc.round > 40) break;
  }
  return {
    venceu: enc.outcome === 'vitoria',
    caiu: party.some((c) => c.hp <= 0),
    morreu: party.some((c) => c.dead),
    rodadas: enc.round,
    vida: party.reduce((s, c) => s + Math.max(0, c.hp), 0) / total,
  };
}

function medir(elenco) {
  const r = [];
  for (let i = 0; i < N; i += 1) r.push(luta(elenco, 0x0b31 + i * 7919));
  const pct = (f) => `${Math.round((r.filter(f).length / N) * 100)}%`;
  return {
    vitoria: pct((x) => x.venceu),
    alguemCaiu: pct((x) => x.caiu),
    morte: pct((x) => x.morreu),
    rodadas: +(r.reduce((s, x) => s + x.rodadas, 0) / N).toFixed(1),
    vidaQueSobra: `${Math.round((r.reduce((s, x) => s + x.vida, 0) / N) * 100)}%`,
  };
}

const vezes = (id, n) => Array(n).fill(id);
const SALAS = {
  'G3 os ashenwights': vezes('ashenwightFeral', 4),
  'G6 a Vakketar': ['diaboAcorrentado'],
  'G8+G9 o alfa e os gricks': ['grickAlfa', ...vezes('grick', 6)],
  'G10 os enroladores': vezes('enrolador', 2),
  'G14 o Zoklork e os elementais': ['xorn', 'elementalDaTerra', 'elementalDaTerra'],
  'G16 os chuuls': vezes('chuul', 4),
  'G20 o Zuluthl': ['yochlol'],
  'G21 grimlocks e basiliscos': [...vezes('grimlock', 5), 'basilisco', 'basilisco'],
  'G23+G24 o Qunbraxel e a guarda': ['qunbraxel', ...vezes('grimlock', 6)],
};

console.log(`${N} lutas por sala, grupo de ${NIVEL}º nível, campo aberto, mesmas sementes\n`);
const tabela = {};
for (const [nome, elenco] of Object.entries(SALAS)) tabela[nome] = medir(elenco);
console.table(tabela);
