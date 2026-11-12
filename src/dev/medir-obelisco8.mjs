// AS LUTAS DO CAPÍTULO 8 DO OBELISCO ("Além de uma Estrela sem Luz"), medidas: o elenco de cada lugar contra o grupo
// pronto, N vezes, nas mesmas sementes, num campo aberto.
//
// NÃO é o lugar de verdade (sem as paredes do labirinto, o rio da Ponte Vazia, a névoa mortal do Miasma, o contragolpe
// do obelisco na Ânima): serve para saber o peso de cada luta antes de a cena existir. Cada luta no nível em que o livro
// a põe: o labirinto no 10º, o Vazio no 11º, a Refração no 12º. `nivel` força um só para todas.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/medir-obelisco8.mjs [lutas] [nivel]

import { makeRng } from '../core/rng.js';
import { Battlefield } from '../core/grid.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { makeMonster } from '../rules/monsters.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { hasCondition } from '../rules/conditions.js';
import { playCharacter } from './balance.js';

const N = Number(process.argv[2] ?? 100);
const FORCADO = process.argv[3] ? Number(process.argv[3]) : null;
const W = 22;
const H = 16;
const MAPA = Array.from({ length: H }, () => '.'.repeat(W));

function luta(elenco, semente, nivel) {
  const party = makeParty({ nivel });
  party.forEach((c, i) => { c.pos = { x: 2, y: 3 + i * 2 }; });
  const foes = elenco.map((id, i) => makeMonster(id, { x: 14 + (i % 3) * 2, y: 1 + (Math.floor(i / 3) * 4) % 12 }));
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

function medir(elenco, nivel) {
  const r = [];
  for (let i = 0; i < N; i += 1) r.push(luta(elenco, 0x0b31 + i * 7919, nivel));
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
// [elenco, nível do livro]
const SALAS = {
  'B3: duas aranhas defasadoras e dois ashenwights': [[...vezes('aranhaDefasadora', 2), ...vezes('ashenwightPsionico', 2)], 10],
  'B4: cinco crânios flamejantes': [vezes('cranioFlamejante', 5), 10],
  'B6: quatro espectros (a música mal tocada)': [vezes('wraith', 4), 10],
  'B7: Varakkta e dois guerreiros': [['varakkta', ...vezes('guerreiroGithyanki', 2)], 10],
  'B9: Shalfi e o Jitterjaws': [['zeloteAberrante', 'fusaoDeCarne'], 10],
  'B12: o aglomerado e quatro gêmulas': [['aglomeradoEncefalico', ...vezes('gemulaEncefalica', 4)], 10],
  'B14: o Mublinesh (observador)': [['observador'], 10],
  'B17: Lowarnizel e Gossa': [['lowarnizel', 'mago'], 10],
  'B18: dois zelotes tentaculados': [vezes('zeloteTentaculado', 2), 10],
  'B21: a Ashripask': [['arcanaloth'], 10],
  'B22: o verme púrpura': [['vermePurpura'], 10],
  'Cúpula: cinco guardiões-escudo': [vezes('guardiaoEscudo', 5), 11],
  'Ponte: o aboleth e o elemental da água': [['aboleth', 'elementalDaAgua'], 11],
  'Charco: as duas nagas': [vezes('nagaEspiritual', 2), 11],
  'Nematódeo: duas armadilhas de intelecto': [vezes('armadilhaDeIntelecto', 2), 11],
  'Miasma: três perseguidores invisíveis': [vezes('perseguidorInvisivel', 3), 11],
  'Campo W1: três mezzoloths e o brutamonte': [[...vezes('mezzoloth', 3), 'brutamonteUmbral'], 11],
  'Campo W2: a Nellik e o Frevvik': [['nellik', 'mezzoloth'], 11],
  'Ânima: os três clarividentes e a cabeça (sem o obelisco)': [[...vezes('devoradorClarividente', 3), 'cabecaDaChishinix'], 11],
  'Ânima: um clarividente e a cabeça (A1)': [['devoradorClarividente', 'cabecaDaChishinix'], 11],
  'Refração de Ilvaash': [['refracaoDeIlvaash'], 12],
  'Refração e o verme púrpura': [['refracaoDeIlvaash', 'vermePurpura'], 12],
};

console.log(`${N} lutas por lugar, ${FORCADO ? `grupo de ${FORCADO}º nível` : 'no nível do livro'}, campo aberto, mesmas sementes
`);
const tabela = {};
for (const [nome, [elenco, nivel]] of Object.entries(SALAS)) tabela[`${nome} (${FORCADO ?? nivel}º)`] = medir(elenco, FORCADO ?? nivel);
console.table(tabela);
