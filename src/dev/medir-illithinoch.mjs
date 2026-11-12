// AS LUTAS DE ILLITHINOCH (o Obelisco, capítulo 7), medidas NA FORTALEZA: a cena de verdade, o grupo entrando pela
// porta de cada sala, e a luta que a sala começa (a conversa de X2 e de X11, quando há, vai direto para o ataque).
// O cérebro ancião se mede duas vezes: sem e com o muco da estátua de X2 (resistência a psíquico), que o livro põe na
// fortaleza para isto.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/medir-illithinoch.mjs [lutas] [nivel]

import { makeRng } from '../core/rng.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { hasCondition, addCondition } from '../rules/conditions.js';
import { mapaDo } from '../game/encounter.js';
import { montarCampo } from '../game/campo.js';
import { criarIllithinoch } from '../game/illithinoch.js';
import { PONTOS_ILLITHINOCH as I } from '../game/illithinoch-mapa.js';
import { distanceFt, ARESTA } from '../core/grid.js';
import { portasDaCasa } from '../game/portas.js';
import { playCharacter } from './balance.js';

const N = Number(process.argv[2] ?? 40);
const NIVEL = Number(process.argv[3] ?? 9);

async function luta(sala, semente, { muco = false } = {}) {
  globalThis.__escolher = (esc) => (esc.find((e) => e.valor === 'atacar' || e.valor === 'ficar' || e.valor === 'luta') ?? esc[0]).valor;
  const mapa = mapaDo('illithinoch');
  const party = makeParty({ nivel: NIVEL });
  const app = { root: { classList: { add() {}, remove() {} } }, campanha: { obelisco6: { marco9: true }, obelisco7: { feito: {}, lutas: {} }, vila: { pistas: [], missoes: {} } },
    select() {}, firstActive: () => null, refresh() {}, encerrarPartida() {}, irParaVila() {}, newEncounter() {}, config: {} };
  const enc = new Encounter({ battlefield: montarCampo(mapa), party, foes: [], rng: makeRng(semente), reinforcements: () => null });
  app.enc = enc;
  const cena = criarIllithinoch(app, {});
  enc.onEvent = (ev) => cena.evento(ev);
  // o grupo, na sala, nas casas mais longe do elenco dela (a entrada)
  const elenco = Object.values(cena.elenco).filter((m) => m.salaDeIllithinoch === sala);
  const casas = I.salas[sala].filter((c) => !elenco.some((m) => distanceFt(m.pos, c) <= 10))
    .sort((a, b) => Math.min(...elenco.map((m) => distanceFt(m.pos, b))) - Math.min(...elenco.map((m) => distanceFt(m.pos, a))));
  party.forEach((c, i) => { c.pos = { ...c.pos, ...(casas[i] ?? casas[0]) }; if (muco) addCondition(c, 'mucoDaEstatua', { rounds: 100 }); });
  await cena.iniciar();
  // o grupo já entrou: as portas estão abertas (o simulador do grupo não as encara, e ficaria do lado de fora)
  for (let y = 0; y < enc.field.h; y++) for (let x = 0; x < enc.field.w; x++) {
    for (const p of portasDaCasa(enc.field, { x, y })) enc.field.porAresta(p.a.x, p.a.y, p.b.x, p.b.y, ARESTA.aberta);
  }
  await cena.depoisDeMover(party[0]);
  const total = party.reduce((s, c) => s + c.maxHp, 0);
  let guarda = 2000;
  while (!enc.over && guarda-- > 0) {
    const pend = enc.allOf(enc.side).filter((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente'));
    if (!pend.length) { enc.maybeEndSide(); continue; }
    if (enc.side === 'party') playCharacter(enc, pend[0]); else takeMonsterTurn(enc, pend[0]);
    if (enc.round > 40) break;
  }
  return {
    venceu: enc.outcome === 'vitoria', caiu: party.some((c) => c.hp <= 0), morreu: party.some((c) => c.dead),
    vida: party.reduce((s, c) => s + Math.max(0, c.hp), 0) / total, rodadas: enc.round,
  };
}

async function medir(sala, opts) {
  const r = [];
  for (let i = 0; i < N; i++) r.push(await luta(sala, 0x111 + i * 7919, opts));
  const pct = (f) => `${Math.round((r.filter(f).length / N) * 100)}%`;
  return { vitoria: pct((x) => x.venceu), alguemCai: pct((x) => x.caiu), morte: pct((x) => x.morreu),
    rodadas: +(r.reduce((s, x) => s + x.rodadas, 0) / N).toFixed(1), vidaQueSobra: `${Math.round((r.reduce((s, x) => s + x.vida, 0) / N) * 100)}%` };
}

console.log(`${N} lutas por sala, grupo de ${NIVEL}º nível, na fortaleza\n`);
const tabela = {};
for (const [nome, sala, opts] of [
  ['X2 Shalghast e Ulthundul', 'X2'], ['X4 os goblins psíquicos', 'X4'], ['X5 os dois slaadi', 'X5'], ['X7 o Oshundo', 'X7'],
  ['X10 Ahooshathan e dois nothics', 'X10'], ['X11 Duoro e Larnon', 'X11'], ['X12 seis nothics', 'X12'], ['X14 o Gulguush', 'X14'],
  ['X15 o cérebro ancião', 'X15'], ['X15 com o muco da estátua', 'X15', { muco: true }],
]) tabela[nome] = await medir(sala, opts);
console.table(tabela);
