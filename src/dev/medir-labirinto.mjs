// AS LUTAS DO LABIRINTO SALGADO (o Obelisco, capítulo 8), medidas NA SALA: o grupo entra pela sala, e a luta que ela
// começa vai até o fim. As três portas mentais ficam abertas (o simulador do grupo não segura bastão). O grupo entra no
// labirinto no 10º nível.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/medir-labirinto.mjs [lutas] [nivel]

import { makeRng } from '../core/rng.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { hasCondition } from '../rules/conditions.js';
import { mapaDo } from '../game/encounter.js';
import { montarCampo } from '../game/campo.js';
import { criarLabirintoSalgado } from '../game/labirinto-salgado.js';
import { PONTOS_LABIRINTO as L } from '../game/labirinto-salgado-mapa.js';
import { distanceFt } from '../core/grid.js';
import { playCharacter } from './balance.js';

const N = Number(process.argv[2] ?? 30);
const NIVEL = Number(process.argv[3] ?? 10);

async function luta(sala, semente, perto = null) {
  globalThis.__escolher = (esc) => (esc.find((e) => e.valor === 'luta') ?? esc.find((e) => e.primaria) ?? esc[0]).valor;
  const mapa = mapaDo('labirintoSalgado');
  const party = makeParty({ nivel: NIVEL });
  const app = { root: { classList: { add() {}, remove() {} } }, campanha: { vila: { pistas: [], missoes: {} } },
    select() {}, firstActive: () => null, refresh() {}, encerrarPartida() {}, irParaVila() {}, newEncounter() {}, config: {} };
  const enc = new Encounter({ battlefield: montarCampo(mapa), party, foes: [], rng: makeRng(semente), reinforcements: () => null });
  app.enc = enc;
  const cena = criarLabirintoSalgado(app, { cenaDaVila: 'labirintoSalgado' });
  enc.onEvent = (ev) => cena.evento(ev);
  party.forEach((c, i) => { c.pos = { ...c.pos, ...mapa.grupo[i] }; });
  await cena.iniciar();
  for (const p of ['frente', 'central', 'traseira']) cena.porPorta(p, true);
  // a casa de entrada: a da sala mais longe do elenco dela (ou do ponto dado), como quem chega pela porta
  const alvos = perto ? [perto] : Object.values(cena.elenco).filter((m) => m.salaDoLabirinto === sala).map((m) => m.pos);
  const casas = L.salas[sala].filter((c) => alvos.every((a) => distanceFt(a, c) > 10))
    .sort((a, b) => Math.min(...alvos.map((m) => distanceFt(m, b))) - Math.min(...alvos.map((m) => distanceFt(m, a))));
  const entrada = casas.slice(-12).reverse();
  party.forEach((c, i) => { c.pos = { ...c.pos, ...(entrada[i] ?? entrada[0]) }; });
  // B4: os crânios só acordam com alguém a 3 m dos corpos — quem vai na frente chega perto
  if (perto) party[0].pos = { ...party[0].pos, ...L.salas[sala].filter((c) => distanceFt(c, perto) <= 10 && distanceFt(c, perto) > 0)[0] };
  await cena.depoisDeMover(party[0]);
  if (cena.explorando) return null;
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

async function medir(sala, perto) {
  const r = [];
  for (let i = 0; i < N; i++) { const x = await luta(sala, 0x8a1 + i * 7919, perto); if (x) r.push(x); }
  const pct = (f) => `${Math.round((r.filter(f).length / r.length) * 100)}%`;
  return { lutas: r.length, vitoria: pct((x) => x.venceu), alguemCai: pct((x) => x.caiu), morte: pct((x) => x.morreu),
    rodadas: +(r.reduce((s, x) => s + x.rodadas, 0) / r.length).toFixed(1), vidaQueSobra: `${Math.round((r.reduce((s, x) => s + x.vida, 0) / r.length) * 100)}%` };
}

console.log(`${N} lutas por sala, grupo de ${NIVEL}º nível, no Labirinto Salgado\n`);
const tabela = {};
for (const [nome, sala, perto] of [
  ['B3 as aranhas e os ashenwights', 'B3'], ['B4 os cinco crânios', 'B4', L.cabecas], ['B7 a Varakkta e os guerreiros', 'B7'],
  ['B12 o aglomerado e as gêmulas', 'B12'], ['B14 o Mublinesh', 'B14'], ['B18 os dois zelotes', 'B18'],
]) tabela[nome] = await medir(sala, perto);
console.table(tabela);
