// AS LUTAS DAS ILHAS DO VAZIO (o Obelisco, capítulo 8), medidas NA ILHA: o grupo chega pela borda, e a luta começa pelo
// gatilho da cena (entrar na cúpula, pisar perto do rio, ouvir a charada, chegar perto da tenda, pegar a língua, entrar
// na pirâmide, atacar a Nellik). Todos voam, como no Vazio. O grupo está no 11º nível (o marco do fundo da Poça).
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/medir-vazio.mjs [lutas] [nivel]
//   SO=<regex> mede só as lutas cujo nome casa (ex.: SO=Campo)

import { makeRng } from '../core/rng.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { hasCondition } from '../rules/conditions.js';
import { mapaDo } from '../game/encounter.js';
import { montarCampo } from '../game/campo.js';
import { criarIlhaDoVazio, VARIANTE_DA_ILHA } from '../game/vazio.js';
import { PONTOS_VAZIO as VZ } from '../game/vazio-mapas.js';
import { distanceFt, ARESTA } from '../core/grid.js';
import { playCharacter } from './balance.js';

const N = Number(process.argv[2] ?? 30);
const NIVEL = Number(process.argv[3] ?? 11);

async function luta(ilha, gatilho, semente, campanha = null) {
  globalThis.__escolher = (esc) => (esc.find((e) => ['luta', 'ardil', 'atacar'].includes(e.valor)) ?? esc.find((e) => e.primaria) ?? esc[0]).valor;
  const mapa = mapaDo(VARIANTE_DA_ILHA[ilha]);
  const party = makeParty({ nivel: NIVEL });
  const camp = campanha ? JSON.parse(JSON.stringify(campanha)) : { vila: { pistas: [], missoes: {} } };
  const app = { root: { classList: { add() {}, remove() {} } }, campanha: camp,
    select() {}, firstActive: () => null, refresh() {}, encerrarPartida() {}, irParaVila() {}, newEncounter() {}, config: {} };
  const enc = new Encounter({ battlefield: montarCampo(mapa), party, foes: [], rng: makeRng(semente), reinforcements: () => null });
  app.enc = enc;
  const cena = criarIlhaDoVazio(app, { cenaDaVila: VARIANTE_DA_ILHA[ilha] });
  enc.onEvent = (ev) => cena.evento(ev);
  party.forEach((c, i) => { c.pos = { ...c.pos, ...mapa.grupo[i] }; });
  await cena.iniciar();
  await gatilho(cena, party, enc);
  if (cena.explorando) return null;
  const total = party.reduce((s, c) => s + c.maxHp, 0);
  let guarda = 3000;
  while (!enc.over && guarda-- > 0) {
    const pend = enc.allOf(enc.side).filter((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente'));
    if (!pend.length) { enc.maybeEndSide(); continue; }
    if (enc.side === 'party') playCharacter(enc, pend[0]); else takeMonsterTurn(enc, pend[0]);
    if (enc.round > 40) break;
  }
  return { venceu: enc.outcome === 'vitoria', caiu: party.some((c) => c.hp <= 0), morreu: party.some((c) => c.dead),
    vida: party.reduce((s, c) => s + Math.max(0, c.hp), 0) / total, rodadas: enc.round };
}

/** Leva o grupo para perto de um ponto (as casas livres mais perto dele) e dá o passo que dispara a cena. */
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
const interagir = (ponto, re, perto = 10, portas = []) => async (cena, party, enc) => {
  // o grupo entra pela porta (o simulador não abre porta, e quem fica do lado de fora nunca chega)
  for (const [ax, ay, bx, by] of portas) enc.field.porAresta(ax, ay, bx, by, ARESTA.aberta);
  await juntoDe(ponto, perto)(cena, party, enc);
  if (!cena.explorando) return;
  // quem fala fica na casa livre mais perto do ponto (o ponto da Nellik é a casa DELA)
  const q = enc.casaLivreMaisProxima(ponto);
  if (q && !(q.x === ponto.x && q.y === ponto.y)) party[0].pos = { ...party[0].pos, x: q.x, y: q.y };
  const o = cena.interacoes(ponto, null, party[0]).find((x) => re.test(x.rotulo));
  if (o) await o.fazer();
};

const LUTAS = [
  ['Cúpula: os cinco guardiões-escudo', 'cupula', juntoDe(VZ.CUPULA.dentro[30], 10)],
  ['Ponte: o aboleth e o elemental', 'ponte', juntoDe({ x: 15, y: 23 }, 10)],
  ['Charco: as duas nagas (pela charada)', 'charco', juntoDe(VZ.CHARCO.valsyx, 15)],
  ['Nematódeo: as duas armadilhas de intelecto', 'nematodeo', juntoDe(VZ.NEMATODEO.tenda, 10)],
  // os perseguidores atacam o ladrão na ilha seguinte, fora da névoa (aqui, na Estátua)
  ['Os três perseguidores, atrás da língua', 'estatua', juntoDe(VZ.ESTATUA.sorriso, 15),
    { vila: { pistas: [], missoes: {} }, obelisco8: { vazio: { ilha: 'estatua', visitadas: ['miasma'], aVista: [], feito: { perseguidoresSoltos: true, lingua: true }, mortos: [], descansos: 0, perseguidoresVivos: 3 } } }],
  // o simulador desvia os olhos do brutamonte (`balance.js`), como da medusa, mas só no turno dele, e o primeiro olhar vem
  // no começo da luta: a primeira linha é o grupo que entra olhando, a segunda o que desviou os olhos antes de entrar
  ['Campo W1: a pirâmide', 'campo', juntoDe(VZ.CAMPO.w1[2], 10)],
  ['Campo W1: a pirâmide, de olhos desviados desde a entrada', 'campo', async (cena, party, enc) => { party.forEach((c) => { c.desviaOlhar = true; }); await juntoDe(VZ.CAMPO.w1[2], 10)(cena, party, enc); }],
  ['Campo W2: a Nellik e o Frevvik (com a trompa)', 'campo', interagir(VZ.CAMPO.nellik, /Falar com a Nellik/, 10, [[23, 30, 23, 31]])],
];

async function medir(ilha, gatilho, campanha) {
  const r = [];
  for (let i = 0; i < N; i++) { const x = await luta(ilha, gatilho, 0x7a51 + i * 7919, campanha); if (x) r.push(x); }
  if (!r.length) return { lutas: 0 };
  const pct = (fn) => `${Math.round((r.filter(fn).length / r.length) * 100)}%`;
  return { lutas: r.length, vitoria: pct((x) => x.venceu), alguemCai: pct((x) => x.caiu), morte: pct((x) => x.morreu),
    rodadas: +(r.reduce((s, x) => s + x.rodadas, 0) / r.length).toFixed(1), vidaQueSobra: `${Math.round((r.reduce((s, x) => s + x.vida, 0) / r.length) * 100)}%` };
}

console.log(`${N} lutas por ilha, grupo de ${NIVEL}º nível, no Vazio\n`);
const tabela = {};
const SO = process.env.SO ? new RegExp(process.env.SO) : null;
for (const [nome, ilha, gatilho, campanha] of LUTAS) if (!SO || SO.test(nome)) tabela[nome] = await medir(ilha, gatilho, campanha);
console.table(tabela);
