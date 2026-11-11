// VARREDURA DO BESTIÁRIO IMPORTADO: cada criatura nasce (`makeMonster`) e luta uma vez no simulador contra um grupo
// do nível que o ND dela pede. O que se procura é QUEBRA (exceção, luta que não acaba), não equilíbrio.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/varrer-bestiario.mjs [livro] [lutas]
import { makeRng } from '../core/rng.js';
import { Battlefield } from '../core/grid.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { makeMonster, MONSTERS } from '../rules/monsters.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { hasCondition } from '../rules/conditions.js';
import { playCharacter } from './balance.js';

const LIVRO = (process.argv[2] ?? 'mm').toUpperCase();
const LUTAS = Number(process.argv[3] ?? 1);
const crNum = (cr) => (String(cr).includes('/') ? 0.5 : Number(cr));
const quebras = []; const semFim = []; const placar = [];
const ids = Object.keys(MONSTERS).filter((k) => MONSTERS[k].nomeOriginal && MONSTERS[k].fonte === LIVRO);
for (const id of ids) {
  const nivel = Math.max(1, Math.min(20, Math.round(crNum(MONSTERS[id].cr) * 0.8) + 1));
  let venceu = 0;
  for (let s = 1; s <= LUTAS; s++) {
    try {
      const party = makeParty({ nivel });
      party.forEach((c, i) => { c.pos = { x: 2, y: 3 + i * 2 }; });
      const m = makeMonster(id, { x: 13, y: 6 }, { rng: makeRng(s) });
      const enc = new Encounter({ battlefield: new Battlefield(20, 16, Array.from({ length: 16 }, () => '.'.repeat(20))), party, foes: [m], rng: makeRng(s) });
      enc.start();
      let g = 0;
      while (!enc.over && g++ < 600) {
        const pend = enc.allOf(enc.side).filter((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente'));
        if (!pend.length) { enc.maybeEndSide(); continue; }
        if (enc.side === 'party') playCharacter(enc, pend[0]); else takeMonsterTurn(enc, pend[0]);
        if (enc.round > 30) break;
      }
      if (!enc.over) semFim.push(`${id} (rodada ${enc.round})`);
      if (enc.outcome === 'vitoria') venceu++;
    } catch (e) {
      quebras.push(`${id}: ${String(e.stack ?? e).split('\n').slice(0, 3).join(' | ')}`);
      break;
    }
  }
  placar.push(`${id.padEnd(34)} ND ${String(MONSTERS[id].cr).padEnd(4)} nível ${String(nivel).padEnd(3)} grupo vence ${venceu}/${LUTAS}`);
}
console.log(`${ids.length} criaturas do ${LIVRO}; ${quebras.length} quebraram, ${semFim.length} lutas sem fim em 30 rodadas`);
for (const q of quebras) console.log(`QUEBRA ${q}`);
for (const q of semFim) console.log(`SEM FIM ${q}`);
if (process.argv.includes('--placar')) for (const l of placar) console.log(l);
