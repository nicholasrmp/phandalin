// A REFRAÇÃO DE ILVAASH (o Obelisco, capítulo 8), medida NA SALA: o grupo sobe da Poça para a beira de B22 com o obelisco
// já em pó, e a Refração espera na porta da frente. Com o verme púrpura vivo, ele sobe da poça no começo da 3ª rodada.
// O grupo chega no 12º (o marco da Ânima).
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/medir-refracao.mjs [lutas] [nivel]

import { makeRng } from '../core/rng.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { hasCondition } from '../rules/conditions.js';
import { mapaDo } from '../game/encounter.js';
import { montarCampo } from '../game/campo.js';
import { criarLabirintoSalgado } from '../game/labirinto-salgado.js';
import { playCharacter } from './balance.js';

const N = Number(process.argv[2] ?? 30);
const NIVEL = Number(process.argv[3] ?? 12);

const campanha = (vermeMorto) => ({ vila: { pistas: [], missoes: {} },
  obelisco8: { feito: {}, vazio: { feito: { anima: { obeliscoEmPo: true } }, mortos: [], visitadas: [], aVista: [] }, poca: { milha: 6, fundo: true, vermeMorto } } });

async function luta(vermeMorto, semente) {
  globalThis.__escolher = (esc) => (esc.find((e) => e.valor === 'luta') ?? esc.find((e) => e.primaria) ?? esc[0]).valor;
  const mapa = mapaDo('labirintoSalgado');
  const party = makeParty({ nivel: NIVEL });
  const camp = campanha(vermeMorto);
  const app = { root: { classList: { add() {}, remove() {} } }, campanha: camp,
    select() {}, firstActive: () => null, refresh() {}, encerrarPartida() {}, irParaVila() {}, newEncounter() {}, config: {} };
  const enc = new Encounter({ battlefield: montarCampo(mapa), party, foes: [], rng: makeRng(semente), reinforcements: () => null });
  app.enc = enc;
  const cena = criarLabirintoSalgado(app, { cenaDaVila: 'labirintoSalgado', chegada: 'poca' });
  enc.onEvent = (ev) => cena.evento?.(ev);
  party.forEach((c, i) => { c.pos = { ...c.pos, ...mapa.grupo[i] }; });
  await cena.iniciar();
  if (cena.explorando) return null;
  const total = party.reduce((s, c) => s + c.maxHp, 0);
  let guarda = 3000;
  while (!enc.over && guarda-- > 0) {
    const pend = enc.allOf(enc.side).filter((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente'));
    if (!pend.length) { enc.maybeEndSide(); continue; }
    if (enc.side === 'party') playCharacter(enc, pend[0]); else takeMonsterTurn(enc, pend[0]);
    if (enc.round > 40) break;
  }
  if (process.env.REGISTRO) console.log((enc.log ?? []).map((l) => l.text ?? l).join('\n'));
  return { venceu: enc.outcome === 'vitoria', caiu: party.some((c) => c.hp <= 0), morreu: party.some((c) => c.dead),
    vida: party.reduce((s, c) => s + Math.max(0, c.hp), 0) / total, rodadas: enc.round };
}

async function medir(vermeMorto) {
  const r = [];
  for (let i = 0; i < N; i++) { const x = await luta(vermeMorto, 0x2ef4 + i * 7919); if (x) r.push(x); }
  if (!r.length) return { lutas: 0 };
  const pct = (fn) => `${Math.round((r.filter(fn).length / r.length) * 100)}%`;
  return { lutas: r.length, vitoria: pct((x) => x.venceu), alguemCai: pct((x) => x.caiu), morte: pct((x) => x.morreu),
    rodadas: +(r.reduce((s, x) => s + x.rodadas, 0) / r.length).toFixed(1), vidaQueSobra: `${Math.round((r.reduce((s, x) => s + x.vida, 0) / r.length) * 100)}%` };
}

console.log(`${N} lutas por linha, grupo de ${NIVEL}º nível, em B22\n`);
console.table({
  'A Refração (o verme morreu na Poça)': await medir(true),
  'A Refração e o verme, que sobe na 3ª rodada': await medir(false),
});
