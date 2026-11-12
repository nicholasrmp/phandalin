// AS LUTAS DA ÂNIMA DE ILVAASH (o Obelisco, capítulo 8), medidas na cena: o grupo do 11º chega pela plataforma e a luta
// começa pelo gatilho da sala. O número de pedaços com os fanáticos muda quem está onde (`vazio.js salasDosFanaticos`) e
// o contragolpe do obelisco: o dobro com 4, 5 ou 6 pedaços (o grupo pegou ao menos um no capítulo 6), igual com 7.
// No alto, duas políticas do grupo simulado: IGNORAR o obelisco (luta só com os fanáticos) e BATER NO OBELISCO (enquanto
// ele existir, é o único alvo; o dano vai para o fanático mais perto).
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/medir-anima.mjs [lutas] [nivel]
//   SO=<regex> mede só as lutas cujo nome casa

import { makeRng } from '../core/rng.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { hasCondition } from '../rules/conditions.js';
import { mapaDo } from '../game/encounter.js';
import { montarCampo } from '../game/campo.js';
import { criarIlhaDoVazio } from '../game/vazio.js';
import { PONTOS_VAZIO as VZ } from '../game/vazio-mapas.js';
import { distanceFt } from '../core/grid.js';
import { playCharacter } from './balance.js';

const N = Number(process.argv[2] ?? 30);
const NIVEL = Number(process.argv[3] ?? 11);
const A = VZ.ANIMA;

/** A campanha com `n` pedaços nas mãos dos fanáticos (os do capítulo 6 que o grupo pegou somem da conta). */
const comPedacos = (n) => {
  const pegos = ['talhundereth', 'cripta', 'encruzilhada'].slice(0, 7 - n);
  return { vila: { pistas: [], missoes: {} }, obelisco6: { fragmentos: Object.fromEntries(pegos.map((k) => [k, true])) } };
};

async function luta(campanha, gatilho, politica, semente) {
  globalThis.__escolher = (esc) => (esc.find((e) => ['luta', 'atacar'].includes(e.valor)) ?? esc.find((e) => e.primaria) ?? esc[0]).valor;
  const mapa = mapaDo('vazioAnima');
  const party = makeParty({ nivel: NIVEL });
  const camp = JSON.parse(JSON.stringify(campanha));
  const app = { root: { classList: { add() {}, remove() {} } }, campanha: camp,
    select() {}, firstActive: () => null, refresh() {}, encerrarPartida() {}, irParaVila() {}, newEncounter() {}, config: {} };
  const enc = new Encounter({ battlefield: montarCampo(mapa), party, foes: [], rng: makeRng(semente), reinforcements: () => null });
  app.enc = enc;
  const cena = criarIlhaDoVazio(app, { cenaDaVila: 'vazioAnima' });
  enc.onEvent = (ev) => cena.evento(ev);
  party.forEach((c, i) => { c.pos = { ...c.pos, ...mapa.grupo[i] }; });
  await cena.iniciar();
  await gatilho(cena, party, enc);
  if (cena.explorando) return null;
  const ob = cena.elenco.obelisco;
  if (politica === 'obelisco') for (const c of party) c.ignora = (o) => ob && !ob.dead && o !== ob;
  if (politica === 'ignora') for (const c of party) c.ignora = (o) => o === ob;
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
    vida: party.reduce((s, c) => s + Math.max(0, c.hp), 0) / total, rodadas: enc.round, po: Boolean(camp.obelisco8?.vazio?.feito?.anima?.obeliscoEmPo) };
}

/** O grupo nas casas livres mais perto de um ponto, e o passo que dispara a sala. */
const juntoDe = (alvo, perto = 15) => async (cena, party, enc) => {
  const casas = [];
  for (let r = 0; casas.length < 4 && r < 12; r++) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const q = { x: alvo.x + dx, y: alvo.y + dy };
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !enc.field.inside(q.x, q.y) || enc.field.blocksMove(q.x, q.y) || enc.occupied(q.x, q.y)) continue;
      if (distanceFt(q, alvo) <= perto && casas.length < 4) casas.push(q);
    }
  }
  party.forEach((c, i) => { c.pos = { ...c.pos, ...(casas[i] ?? casas[0]) }; });
  await cena.depoisDeMover(party[0]);
};

const NO_ALTO = { x: 23, y: 12 };
const LUTAS = [
  ['A1: a Chishinix e a cabeça (4 pedaços)', comPedacos(4), juntoDe({ x: 22, y: 26 }, 10), null],
  ['A3: os dois profetas (7 pedaços)', comPedacos(7), juntoDe(A.profetas[0], 15), null],
  ['A4, 5 pedaços: Hashutu e Voalsh, ignorando o obelisco', comPedacos(5), juntoDe(NO_ALTO, 10), 'ignora'],
  ['A4, 5 pedaços: Hashutu e Voalsh, batendo no obelisco (o dobro)', comPedacos(5), juntoDe(NO_ALTO, 10), 'obelisco'],
  ['A4, 6 pedaços: os três e a cabeça, ignorando o obelisco', comPedacos(6), juntoDe(NO_ALTO, 10), 'ignora'],
  ['A4, 6 pedaços: os três e a cabeça, batendo no obelisco (o dobro)', comPedacos(6), juntoDe(NO_ALTO, 10), 'obelisco'],
  ['A4, 7 pedaços: os três e a cabeça, ignorando o obelisco', comPedacos(7), juntoDe(NO_ALTO, 10), 'ignora'],
  ['A4, 7 pedaços: os três e a cabeça, batendo no obelisco (sem dobro)', comPedacos(7), juntoDe(NO_ALTO, 10), 'obelisco'],
];

async function medir(campanha, gatilho, politica) {
  const r = [];
  for (let i = 0; i < N; i++) { const x = await luta(campanha, gatilho, politica, 0xa71a + i * 7919); if (x) r.push(x); }
  if (!r.length) return { lutas: 0 };
  const pct = (fn) => `${Math.round((r.filter(fn).length / r.length) * 100)}%`;
  return { lutas: r.length, vitoria: pct((x) => x.venceu), alguemCai: pct((x) => x.caiu), morte: pct((x) => x.morreu),
    rodadas: +(r.reduce((s, x) => s + x.rodadas, 0) / r.length).toFixed(1), vidaQueSobra: `${Math.round((r.reduce((s, x) => s + x.vida, 0) / r.length) * 100)}%` };
}

console.log(`${N} lutas por linha, grupo de ${NIVEL}º nível, na Ânima de Ilvaash\n`);
const tabela = {};
const SO = process.env.SO ? new RegExp(process.env.SO) : null;
for (const [nome, campanha, gatilho, politica] of LUTAS) if (!SO || SO.test(nome)) tabela[nome] = await medir(campanha, gatilho, politica);
console.table(tabela);
