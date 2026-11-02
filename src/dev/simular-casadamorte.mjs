// Simula, em Node, cada luta da Casa da Morte contra o grupo pronto (nível 1 e 2): vitórias, mortos, PV que sobra e rodadas.
// A política é a de balance.js (competente, sem fugir nem usar luz): serve de piso, não de teto.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/simular-casadamorte.mjs
import { makeRng } from '../core/rng.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { hasCondition } from '../rules/conditions.js';
import { playCharacter } from './balance.js';
import { mapaDo, buildFoes } from '../game/encounter.js';
import { montarCampo } from '../game/campo.js';
const CASOS = [
  ['casaDaMortePorao1', 'sombras', [[19,15],[20,15],[21,15],[18,15]]],
  ['casaDaMortePorao1', 'carnicais', [[16,14],[16,13],[16,12],[17,12]]],
  ['casaDaMortePorao1', 'grick', [[19,10],[19,11],[18,11],[17,11]]],
  ['casaDaMortePorao1', 'mimico', [[16,22],[17,22],[17,21],[16,21]]],
  ['casaDaMortePorao1', 'livdos', [[13,22],[12,22],[14,22],[13,21]]],
  ['casaDaMortePorao1', 'centopeias', [[19,8],[18,8],[17,8],[17,7]]],
  ['casaDaMortePorao2', 'lorghoth', [[7,11],[7,12],[10,12],[9,13]]],
];
for (const nivel of [1, 2]) {
  console.log('--- grupo de nível', nivel);
  for (const [v, g, pos] of CASOS) {
    let venc = 0, mort = 0, hp = 0, rod = 0; const N = 30;
    for (let i = 0; i < N; i++) {
      const mapa = mapaDo(v); const field = montarCampo(mapa);
      const party = makeParty({ nivel }); party.forEach((c, k) => { c.pos = { x: pos[k][0], y: pos[k][1] }; c.facingVec = { dx: 1, dy: 0 }; });
      const foes = buildFoes(v).filter((f) => f.grupo === g || f.grupo?.id === g);
      if (!foes.length) { console.log('sem foes', g); break; }
      const enc = new Encounter({ battlefield: field, party, foes, rng: makeRng(1000 + i * 77), reinforcements: () => null });
      const tot = party.reduce((s, c) => s + c.maxHp, 0);
      enc.start();
      let guard = 900;
      while (!enc.over && guard-- > 0) {
        const side = enc.side;
        const pend = enc.allOf(side).filter((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente'));
        if (!pend.length) { enc.maybeEndSide(); continue; }
        if (side === 'party') playCharacter(enc, pend[0]); else takeMonsterTurn(enc, pend[0]);
        if (enc.round > 30) break;
      }
      const pcs = enc.combatants.filter((c) => c.side === 'party');
      if (enc.outcome === 'vitoria') venc++;
      mort += pcs.filter((c) => c.dead).length;
      hp += pcs.reduce((s, c) => s + Math.max(0, c.hp), 0) / tot; rod += enc.round;
    }
    console.log(g.padEnd(11), 'vitórias', Math.round(venc / N * 100) + '%', ' mortos/combate', (mort / N).toFixed(2), ' PV restante', Math.round(hp / N * 100) + '%', ' rodadas', (rod / N).toFixed(1));
  }
}
