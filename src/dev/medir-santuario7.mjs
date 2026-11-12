// A BRIGA DO SANTUÁRIO DA SORTE (o Obelisco, capítulo 7), medida na sala de verdade: os três moradores infectados contra
// o grupo, com o golpe não letal ligado ("Bater para derrubar") e sem ele. O que o livro quer é que os três saiam
// VIVOS; o que se mede é quantos saem, e o que a briga custa.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/medir-santuario7.mjs [lutas] [nivel]

import { makeRng } from '../core/rng.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { hasCondition } from '../rules/conditions.js';
import { mapaDo } from '../game/encounter.js';
import { montarCampo } from '../game/campo.js';
import { criarLugarDoCap7 } from '../game/obelisco7-lugares.js';
import { playCharacter } from './balance.js';
import { WEAPONS } from '../rules/equipment.js';

const N = Number(process.argv[2] ?? 60);
const NIVEL = Number(process.argv[3] ?? 9);

async function luta(semente, poupar, soDePerto = false) {
  globalThis.__escolher = (esc) => (esc.find((e) => e.valor === (poupar ? 'poupar' : 'lutar')) ?? esc[0]).valor;
  const mapa = mapaDo('santuarioInfectado');
  const party = makeParty({ nivel: NIVEL });
  party.forEach((c, i) => { c.pos = { ...c.pos, ...mapa.grupo[i] }; });
  // o grupo CUIDADOSO: ninguém conjura nem atira, todo mundo bate de perto (o não letal só vale no corpo a corpo)
  if (soDePerto) for (const c of party) { c.spellcasting = null; c.weapons = (c.weapons ?? []).filter((w) => !WEAPONS[w]?.ranged); }
  const app = { root: { classList: { add() {}, remove() {} } }, campanha: { obelisco6: { marco9: true }, vila: { pistas: [], missoes: {} } },
    select() {}, firstActive: () => null, refresh() {}, encerrarPartida() {}, irParaVila() {}, config: {} };
  const enc = new Encounter({ battlefield: montarCampo(mapa), party, foes: [], rng: makeRng(semente), reinforcements: () => null });
  app.enc = enc;
  const cena = criarLugarDoCap7(app, {});
  await cena.iniciar();
  const total = party.reduce((s, c) => s + c.maxHp, 0);
  let guarda = 1500;
  while (!enc.over && guarda-- > 0) {
    const pend = enc.allOf(enc.side).filter((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente'));
    if (!pend.length) { enc.maybeEndSide(); continue; }
    if (enc.side === 'party') playCharacter(enc, pend[0]); else takeMonsterTurn(enc, pend[0]);
    if (enc.round > 30) break;
  }
  return {
    venceu: enc.outcome === 'vitoria',
    vivos: cena.moradores.filter((m) => !m.dead).length,
    caiu: party.some((c) => c.hp <= 0),
    vida: party.reduce((s, c) => s + Math.max(0, c.hp), 0) / total,
    rodadas: enc.round,
  };
}

async function medir(poupar, soDePerto = false) {
  const r = [];
  for (let i = 0; i < N; i++) r.push(await luta(0x5a7 + i * 7919, poupar, soDePerto));
  const pct = (f) => `${Math.round((r.filter(f).length / N) * 100)}%`;
  return {
    vitoria: pct((x) => x.venceu), tresVivos: pct((x) => x.vivos === 3), nenhumVivo: pct((x) => x.vivos === 0),
    vivosMedia: +(r.reduce((s, x) => s + x.vivos, 0) / N).toFixed(2), alguemCaiu: pct((x) => x.caiu),
    vidaQueSobra: `${Math.round((r.reduce((s, x) => s + x.vida, 0) / N) * 100)}%`, rodadas: +(r.reduce((s, x) => s + x.rodadas, 0) / N).toFixed(1),
  };
}

console.log(`${N} lutas, grupo de ${NIVEL}º nível, no largo do santuário\n`);
console.table({
  'bater para derrubar, só de perto': await medir(true, true),
  'bater para derrubar': await medir(true),
  'lutar como for': await medir(false),
});
