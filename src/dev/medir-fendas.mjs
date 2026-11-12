// AS LUTAS DAS TRÊS FENDAS DE ILLITHINOCH (o Obelisco, capítulo 7), medidas NA SALA: o grupo entra pela sala, e a luta
// que ela começa vai até o fim. A exposição ao Reino Distante (envenenado por uma hora, Constituição CD 12) conta,
// como contaria na primeira entrada.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/medir-fendas.mjs [lutas] [nivel]

import { makeRng } from '../core/rng.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { hasCondition } from '../rules/conditions.js';
import { mapaDo } from '../game/encounter.js';
import { montarCampo } from '../game/campo.js';
import { criarFenda } from '../game/fendas.js';
import { PONTOS_FENDAS } from '../game/fendas-mapas.js';
import { distanceFt } from '../core/grid.js';
import { playCharacter } from './balance.js';

const N = Number(process.argv[2] ?? 40);
const NIVEL = Number(process.argv[3] ?? 9);

async function luta(variante, chave, sala, semente) {
  globalThis.__escolher = (esc) => (esc.find((e) => e.valor === 'luta') ?? esc[0]).valor;
  const mapa = mapaDo(variante);
  const party = makeParty({ nivel: NIVEL });
  const app = { root: { classList: { add() {}, remove() {} } }, campanha: { obelisco7: { feito: {}, lutas: {} }, vila: { pistas: [], missoes: {} } },
    select() {}, firstActive: () => null, refresh() {}, encerrarPartida() {}, irParaVila() {}, newEncounter() {}, config: {} };
  const enc = new Encounter({ battlefield: montarCampo(mapa), party, foes: [], rng: makeRng(semente), reinforcements: () => null });
  app.enc = enc;
  const cena = criarFenda(app, { cenaDaVila: variante });
  enc.onEvent = (ev) => cena.evento(ev);
  party.forEach((c, i) => { c.pos = { ...c.pos, ...mapa.grupo[i] }; });
  await cena.iniciar();
  const elenco = Object.values(cena.elenco).filter((m) => m.salaDaFenda === sala);
  const casas = PONTOS_FENDAS[chave].salas[sala].filter((c) => !elenco.some((m) => distanceFt(m.pos, c) <= 10))
    .sort((a, b) => Math.min(...elenco.map((m) => distanceFt(m.pos, b))) - Math.min(...elenco.map((m) => distanceFt(m.pos, a))));
  party.forEach((c, i) => { c.pos = { ...c.pos, ...(casas[i] ?? casas[0]) }; });
  await cena.depoisDeMover(party[0]);
  const total = party.reduce((s, c) => s + c.maxHp, 0);
  let guarda = 2000;
  while (!enc.over && guarda-- > 0) {
    const pend = enc.allOf(enc.side).filter((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente'));
    if (!pend.length) { enc.maybeEndSide(); continue; }
    if (enc.side === 'party') playCharacter(enc, pend[0]); else takeMonsterTurn(enc, pend[0]);
    if (enc.round > 40) break;
  }
  return { venceu: enc.outcome === 'vitoria', caiu: party.some((c) => c.hp <= 0), morreu: party.some((c) => c.dead),
    vida: party.reduce((s, c) => s + Math.max(0, c.hp), 0) / total, rodadas: enc.round };
}

async function medir(variante, chave, sala) {
  const r = [];
  for (let i = 0; i < N; i++) r.push(await luta(variante, chave, sala, 0x222 + i * 7919));
  const pct = (f) => `${Math.round((r.filter(f).length / N) * 100)}%`;
  return { vitoria: pct((x) => x.venceu), alguemCai: pct((x) => x.caiu), morte: pct((x) => x.morreu),
    rodadas: +(r.reduce((s, x) => s + x.rodadas, 0) / N).toFixed(1), vidaQueSobra: `${Math.round((r.reduce((s, x) => s + x.vida, 0) / N) * 100)}%` };
}

console.log(`${N} lutas por sala, grupo de ${NIVEL}º nível, nas fendas\n`);
const tabela = {};
for (const [nome, v, k, sala] of [
  ['F2 três grells', 'fendaTrincheiras', 'TRINCHEIRAS', 'F2'], ['F3 a Naruv e um grell', 'fendaTrincheiras', 'TRINCHEIRAS', 'F3'],
  ['S2 doze girinos e o slaad vermelho', 'fendaOco', 'OCO_DA_DESOVA', 'S2'], ['S3 o Chalaag', 'fendaOco', 'OCO_DA_DESOVA', 'S3'],
  ['L7 o Golcuus', 'fendaLabirinto', 'LABIRINTO_DOS_OLHOS', 'L7'],
]) tabela[nome] = await medir(v, k, sala);
console.table(tabela);
