// Simula, em Node, a EMBOSCADA DOS GOBLINS contra o grupo pronto de 1º nível: vitórias, quem cai, PV que sobra
// e rodadas. A política é a de `balance.js` (competente, sem fugir), que serve de piso, não de teto.
//
//   node src/dev/simular-emboscada.mjs [amostra]
//
// Existe porque o `balance.js` só roda o mapa padrão, e a emboscada tem mapa, posições, surpresa e reforços
// próprios: mudar qualquer um deles sem remedir é chutar. Os números citados nos comentários de
// `game/encounter.js` saem daqui, com estas sementes.
import { makeRng } from '../core/rng.js';
import { Battlefield } from '../core/grid.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { hasCondition } from '../rules/conditions.js';
import { mapaDo, buildFoes, reinforcementsFor } from '../game/encounter.js';
import { playCharacter } from './balance.js';

const N = Number(process.argv[2] ?? 400);
const m = mapaDo('emboscada');

function uma(semente) {
  const rng = makeRng(semente);
  const field = new Battlefield(m.terreno[0].length, m.terreno.length, m.terreno, m.altura, m.objetos);
  const party = makeParty();
  party.forEach((c, i) => { c.pos = { ...m.grupo[i] }; });
  const enc = new Encounter({
    battlefield: field,
    party,
    foes: buildFoes('emboscada'),
    rng,
    reinforcements: (rodada) => reinforcementsFor(rodada, 'emboscada'),
    emboscada: m.emboscada,
  });
  const hpTotal = party.reduce((s, c) => s + c.maxHp, 0);
  enc.start();

  let guarda = 2000;
  while (!enc.over && guarda-- > 0) {
    const lado = enc.side;
    const fila = enc.allOf(lado).filter((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente'));
    if (fila.length === 0) { enc.maybeEndSide(); continue; }
    if (lado === 'party') playCharacter(enc, fila[0]);
    else takeMonsterTurn(enc, fila[0]);
    if (enc.round > 40) break;
  }

  // `caidos` é quem está com 0 PV NO FIM, que é a mesma conta do `balance.js`: compara-se laranja com laranja.
  const pcs = enc.combatants.filter((c) => c.side === 'party');
  return {
    venceu: enc.outcome === 'vitoria',
    travou: guarda <= 0 || enc.round > 40,
    rodadas: enc.round,
    caidos: pcs.filter((c) => c.hp <= 0).length,
    mortos: pcs.filter((c) => c.dead).length,
    hpPct: Math.round((pcs.reduce((s, c) => s + Math.max(0, c.hp), 0) / hpTotal) * 100),
  };
}

const lutas = [];
for (let i = 0; i < N; i++) lutas.push(uma(0x51b0 + i * 7919));
const pct = (f) => Math.round((lutas.filter(f).length / N) * 100);
const media = (f) => +(lutas.reduce((s, d) => s + f(d), 0) / N).toFixed(2);

console.log({
  amostra: N,
  vitorias: `${pct((d) => d.venceu)}%`,
  travou: `${pct((d) => d.travou)}%`,
  comAlgumaMorte: `${pct((d) => d.mortos > 0)}%`,
  comAlguemCaido: `${pct((d) => d.caidos > 0)}%`,
  duasQuedasOuMais: `${pct((d) => d.caidos >= 2)}%`,
  rodadasMedia: media((d) => d.rodadas),
  hpRestanteMedio: `${media((d) => d.hpPct)}%`,
});
