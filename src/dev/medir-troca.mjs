// MEDIR UMA TROCA DE ELENCO: o mesmo grupo, as mesmas sementes, contra a versão da Mina e contra a do Obelisco.
//
// Existe porque o Obelisco troca bichos nas salas da Mina (o urso-coruja da torre do castelo pelo grell, os goblins
// dos postos por chefes goblin arqueiros...) e "ficou mais difícil" não é medida. Isto joga a luta N vezes com cada
// elenco num campo aberto e devolve o que muda: vitória, derrota, quem cai, a vida que sobra.
//
// NÃO é a sala de verdade: o campo é aberto, sem as paredes, as seteiras e a surpresa da cena. Serve para comparar
// os dois elencos ENTRE SI, que é a pergunta da troca. Quem quiser a sala, mede na cena.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/medir-troca.mjs [lutas] [nivel]

import { makeRng } from '../core/rng.js';
import { Battlefield } from '../core/grid.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { makeMonster } from '../rules/monsters.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { hasCondition } from '../rules/conditions.js';
import { playCharacter } from './balance.js';

const N = Number(process.argv[2] ?? 200);
const NIVEL = Number(process.argv[3] ?? 3);
const W = 16;
const H = 12;
const MAPA = Array.from({ length: H }, () => '.'.repeat(W));

function luta(elenco, semente) {
  const party = makeParty({ nivel: NIVEL });
  party.forEach((c, i) => { c.pos = { x: 2, y: 3 + i * 2 }; });
  const foes = elenco.map((id, i) => makeMonster(id, { x: 12 + (i % 2), y: 3 + i * 2 }));
  const enc = new Encounter({ battlefield: new Battlefield(W, H, MAPA), party, foes, rng: makeRng(semente) });
  const total = party.reduce((s, c) => s + c.maxHp, 0);
  enc.start();
  let guarda = 900;
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
    derrota: pct((x) => !x.venceu),
    alguemCaiu: pct((x) => x.caiu),
    morte: pct((x) => x.morreu),
    rodadas: +(r.reduce((s, x) => s + x.rodadas, 0) / N).toFixed(1),
    vidaQueSobra: `${Math.round((r.reduce((s, x) => s + x.vida, 0) / N) * 100)}%`,
  };
}

const TROCAS = {
  'C3, um posto de arqueiros': [['goblin', 'goblin'], ['chefeGoblinArqueiro', 'chefeGoblinArqueiro']],
  'C3, os dois postos juntos': [['goblin', 'goblin', 'goblin', 'goblin'], ['chefeGoblinArqueiro', 'chefeGoblinArqueiro', 'chefeGoblinArqueiro', 'chefeGoblinArqueiro']],
  'C13, a torre': [['corujaUrso'], ['grell']],
  'C14, o rei (o lobo do Grol)': [['reiGrol', 'lobo', 'doppelganger'], ['reiGrol', 'loboAtroz', 'doppelganger']],
};

console.log(`${N} lutas por coluna, grupo de ${NIVEL}º nível, campo aberto, mesmas sementes\n`);
for (const [nome, [mina, obelisco]] of Object.entries(TROCAS)) {
  console.log(`== ${nome}`);
  console.table({ Mina: medir(mina), Obelisco: medir(obelisco) });
}
