// A DESCIDA DA POÇA SALGADA (o Obelisco, capítulo 8), medida inteira: seis milhas, os testes de cada milha, e cada vez
// que o verme vem, a luta até ele ir embora. Com e sem a vantagem de quem viu a Poça pela ocular do Golcuus. O grupo
// desce no 10º nível (o 11º é no fundo).
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/medir-poca.mjs [descidas] [nivel]

import { makeRng } from '../core/rng.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { hasCondition } from '../rules/conditions.js';
import { mapaDo } from '../game/encounter.js';
import { montarCampo } from '../game/campo.js';
import { criarPocaSalgada } from '../game/poca-salgada.js';
import { playCharacter } from './balance.js';

const N = Number(process.argv[2] ?? 40);
const NIVEL = Number(process.argv[3] ?? 10);

async function descida(semente, ocular) {
  globalThis.__escolher = (esc) => (esc.find((e) => e.primaria) ?? esc[0]).valor;
  const mapa = mapaDo('pocaSalgada');
  const party = makeParty({ nivel: NIVEL });
  const app = { root: null, campanha: { vila: { pistas: [], missoes: {} }, obelisco7: { feito: { viuAPiscinaSalobra: ocular } } },
    select() {}, firstActive: () => null, refresh() {}, encerrarPartida() { app.fim = true; }, irParaVila() {}, newEncounter() {}, config: {} };
  app.root = { classList: { add() {}, remove() {} } };
  const enc = new Encounter({ battlefield: montarCampo(mapa), party, foes: [], rng: makeRng(semente), reinforcements: () => null });
  app.enc = enc;
  const cena = criarPocaSalgada(app, { cenaDaVila: 'pocaSalgada' });
  enc.onEvent = (ev) => cena.evento(ev);
  party.forEach((c, i) => { c.pos = { ...c.pos, ...mapa.grupo[i] }; });
  const total = party.reduce((s, c) => s + c.maxHp, 0);
  let ataques = 0;
  let engolidos = 0;
  await cena.iniciar();
  let guarda = 5000;
  while (!app.fim && !cena.explorando && guarda-- > 0) {
    if (cena.estado.verme && !cena.estado.verme.contado) { cena.estado.verme.contado = true; ataques++; }
    if (enc.over) { await cena.fimDoCombate(enc.outcome); continue; }
    const pend = enc.allOf(enc.side).filter((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente'));
    if (!pend.length) { enc.maybeEndSide(); continue; }
    if (enc.side === 'party') playCharacter(enc, pend[0]); else takeMonsterTurn(enc, pend[0]);
    if (party.some((c) => hasCondition(c, 'engolido') && !c.contadoEngolido)) { for (const c of party) if (hasCondition(c, 'engolido')) c.contadoEngolido = true; engolidos++; }
  }
  return { chegou: !app.fim && cena.explorando, ataques, engolidos, morte: party.some((c) => c.dead),
    vida: party.reduce((s, c) => s + Math.max(0, c.hp), 0) / total };
}

async function medir(ocular) {
  const r = [];
  for (let i = 0; i < N; i++) r.push(await descida(0x70ca + i * 7919, ocular));
  const pct = (f) => `${Math.round((r.filter(f).length / N) * 100)}%`;
  const media = (k) => +(r.reduce((s, x) => s + x[k], 0) / N).toFixed(2);
  return { chegaAoFundo: pct((x) => x.chegou), ataquesDoVerme: media('ataques'), engolidos: media('engolidos'), morte: pct((x) => x.morte),
    vidaQueSobra: `${Math.round((r.reduce((s, x) => s + x.vida, 0) / N) * 100)}%` };
}

console.log(`${N} descidas, grupo de ${NIVEL}º nível\n`);
console.table({ 'sem a ocular': await medir(false), 'com a ocular (vantagem)': await medir(true) });
