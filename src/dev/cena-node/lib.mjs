// HARNESS DE MEDIÇÃO DA CENA DE ÁRVORE TROVÃO, em Node.
//
// Roda a cena DE VERDADE (`game/capitulo4-arvoretrovao.js`) — gatilhos, luta,
// reforços, fim — com a interface trocada por stubs (`register.mjs` desvia
// `view/narrativa.js` e `view/nivel-tela.js`). Mede o que a cena faz, e não uma
// réplica dela. Uso:
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/cena-node/medir.mjs <bando> [N] [nivel]
//
// A LUZ É PREENCHIDA (`base.mjs` copia os dígitos de `mapa.luz` como o main.js): sem
// isso a medição sai no escuro e erra para os dois lados — já aconteceu.
// `jogador.mjs` é a política dos heróis: mira pelo CUSTO de caminho e não pela reta,
// e não ataca através de parede de borda.
import * as B from './base.mjs';
import { paineis } from './stub-narrativa.mjs';
import { jogador } from './jogador.mjs';
const P = new URL('../../', import.meta.url).href;
const { criarArvoreTrovao } = B.ONDA ? { criarArvoreTrovao: (await import(P + 'game/capitulo5-ondaeco.js')).criarOndaEco } : await import(P + 'game/capitulo4-arvoretrovao.js');
const { Battlefield, distanceFt } = B;
const A = B.ONDA ? B.ONDA_ECO : B.ARVORE_TROVAO;
export { B, A, paineis };
globalThis.__preferir = 'luta';

export const dentro = (p, r) => p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1;
export const distRect = (p, r) => Math.max(0, r.x0 - p.x, p.x - r.x1, r.y0 - p.y, p.y - r.y1);

export async function novaCena(seed, { nivel = 3, ids = null, fechar = [] } = {}) {
  const { field } = B.montarCampo();
  const rng = B.makeRng(seed);
  const party = B.makeParty({ nivel, ids });
  party.forEach((c, i) => { c.pos = { ...A.grupo[i] }; c.facingVec = { dx: 0, dy: -1 }; });
  const log = { eventos: [] };
  let cena = null;     // o `main.js` repassa cada evento à cena (`capitulo.evento`); aqui também
  const app = {
    root: { classList: { add() {}, remove() {} } }, campanha: {}, selected: null,
    select(c) { this.selected = c; },
    firstActive() { return enc.allOf('party').find((c) => !c.acted && !c.dead && c.hp > 0) ?? null; },
    refresh() {}, conversarCom: async () => 'luta', encerrarPartida() {}, irParaRegiao() {},
  };
  const enc = new B.Encounter({ battlefield: field, party, foes: [], rng, emboscada: null, reinforcements: () => null,
    onEvent: (ev) => { log.eventos.push(ev); cena?.evento?.(ev); globalThis.__onEv?.(ev, enc); } });
  app.enc = enc;
  enc.aoComecar = () => {};
  enc.protegidoDeSurpresa = () => false;
  cena = criarArvoreTrovao(app, {});
  Object.defineProperty(enc, 'explorando', { get: () => !!cena.explorando });
  await cena.iniciar();
  for (const [a, b] of fechar) field.porAresta(a.x, a.y, b.x, b.y, B.ARESTA.porta);
  return { enc, cena, field, party, app, log, rng };
}

export function mapaDeCusto(field, goal) {
  return field.reachable(goal, 100000, () => false, () => true, 1);
}

async function clicar(S, h, node) {
  const reached = S.enc.reachableFor(h);
  const n = reached.get(`${node.x},${node.y}`);
  if (!n || n.cost === 0) return false;
  S.enc.moveAlong(h, Battlefield.pathFrom(reached, node));
  await S.cena.depoisDeMover(h);
  return true;
}

export async function estagiar(S, { goal, rect, margem = 4, ordem = [0, 1, 2, 3], proibido = null }) {
  const custo = mapaDeCusto(S.field, goal);
  for (const i of ordem) {
    const h = S.party[i];
    for (let k = 0; k < 14; k++) {
      if (!S.cena.explorando) return;
      const reached = S.enc.reachableFor(h);
      let best = null;
      for (const n of reached.values()) {
        if (n.parar === false || S.enc.occupied(n.x, n.y, h)) continue;
        if (rect && distRect(n, rect) < margem) continue;
        if (proibido && proibido(n)) continue;
        const c = custo.get(`${n.x},${n.y}`)?.cost ?? 1e9;
        if (!best || c < best.c || (c === best.c && n.cost < best.n.cost)) best = { c, n };
      }
      if (!best) break;
      const aqui = custo.get(`${h.pos.x},${h.pos.y}`)?.cost ?? 1e9;
      if (best.c >= aqui) break;
      if (!(await clicar(S, h, best.n))) break;
    }
  }
}

export async function entrar(S, { goal, rect, quem = 0, modo = 'borda', tentativas = 8, valido = null }) {
  const custo = mapaDeCusto(S.field, goal);
  const h = S.party[quem];
  for (let t = 0; t < tentativas && S.cena.explorando; t++) {
    const reached = S.enc.reachableFor(h);
    let best = null;
    for (const n of reached.values()) {
      if (n.parar === false || S.enc.occupied(n.x, n.y, h) || n.cost === 0) continue;
      const dent = dentro(n, rect) && (!valido || valido(n));
      if (modo === 'borda') {
        if (!dent) continue;
        if (!best || n.cost < best.n.cost) best = { n };
      } else {
        const c = custo.get(`${n.x},${n.y}`)?.cost ?? 1e9;
        if (!best || c < best.c) best = { c, n };
      }
    }
    if (!best) {
      let b2 = null;
      for (const n of reached.values()) {
        if (n.parar === false || S.enc.occupied(n.x, n.y, h) || n.cost === 0) continue;
        const c = custo.get(`${n.x},${n.y}`)?.cost ?? 1e9;
        if (!b2 || c < b2.c) b2 = { c, n };
      }
      if (!b2) return false;
      await clicar(S, h, b2.n);
      continue;
    }
    await clicar(S, h, best.n);
  }
  return !S.cena.explorando;
}

export function lutar(S, { maxRodadas = 25 } = {}) {
  const { enc, party } = S;
  const hpTotal = party.reduce((s, c) => s + c.maxHp, 0);
  const foes0 = enc.combatants.filter((c) => c.side === 'foes');
  const surp0 = [...(enc.surpreendidos ?? [])];
  const origEnd = enc.endTurn.bind(enc);
  enc.endTurn = (a) => { a.turnsTaken = (a.turnsTaken ?? 0) + 1; return origEnd(a); };
  let guard = 4000;
  const ev0 = S.log.eventos.length;
  while (!enc.over && enc.round <= maxRodadas && guard-- > 0) {
    const side = enc.side;
    const pending = enc.allOf(side).filter((c) => !c.acted && !c.dead && !B.hasCondition(c, 'inconsciente'));
    if (pending.length === 0) { enc.maybeEndSide(); continue; }
    if (side === 'party') (process.env.JOG === 'orig' ? B.playCharacter : jogador)(enc, pending[0]);
    else B.takeMonsterTurn(enc, pending[0]);
  }
  const evs = S.log.eventos.slice(ev0);
  const caiu = new Set(); const morreu = new Set();
  let ataquesFoes = 0; let ataquesParty = 0;
  for (const e of evs) {
    if (e.type === 'downed' && e.target.side === 'party') caiu.add(e.target.id);
    if (e.type === 'died' && e.target.side === 'party') morreu.add(e.target.id);
    if (e.type === 'attack') { if (e.attacker.side === 'foes') ataquesFoes++; else if (e.attacker.side === 'party') ataquesParty++; }
  }
  return {
    venceu: enc.outcome === 'vitoria', derrota: enc.outcome === 'derrota', travou: !enc.over,
    rodadas: enc.round, hpPct: Math.round(party.reduce((s, c) => s + Math.max(0, c.hp), 0) / hpTotal * 100),
    caiu: caiu.size, morreu: morreu.size, ataquesFoes, ataquesParty,
    foesSemAgir: foes0.filter((c) => !c.turnsTaken).length, nFoes: foes0.length,
    foesVivos: foes0.filter((c) => !c.dead).length,
    grupoComecou: enc.firstSide === 'party', surpresos: surp0.length,
  };
}

/** Põe o grupo em bloco a `margem` casas ANTES de o caminho (chegada -> objetivo) entrar no retângulo. */
export function colocar(S, { goal, rect, margem = 4, de = A.chegada, ordemFila = true }) {
  const out = S.field.reachable(de, 100000, () => false);
  const caminho = Battlefield.pathFrom(out, goal);
  let i = caminho.findIndex((p) => dentro(p, rect));
  if (i < 0) i = caminho.length - 1;
  const ancora = caminho[Math.max(0, i - margem)];
  const viz = S.field.reachable(ancora, 400, () => false);
  const cand = [...viz.values()].filter((n) => !dentro(n, rect) && n.parar !== false)
    .sort((a, b) => a.cost - b.cost || (out.get(`${b.x},${b.y}`)?.cost ?? 0) - (out.get(`${a.x},${a.y}`)?.cost ?? 0));
  S.party.forEach((h, k) => { h.pos = { x: cand[k].x, y: cand[k].y, ...(h.pos.f ? { f: h.pos.f } : {}) }; });
  return { ancora, cells: cand.slice(0, 4).map((n) => `${n.x},${n.y}`) };
}

export function fotoInicial(S) {
  const { enc, field } = S;
  const foes = enc.combatants.filter((c) => c.side === 'foes' && !c.dead);
  const herois = S.party.filter((h) => !h.dead && h.hp > 0);
  const visao = B.Luz.visaoDoGrupo(enc);
  const vistos = foes.filter((f) => visao.has(`${f.pos.x},${f.pos.y}`)).length;
  const contato = foes.filter((f) => herois.some((h) => field.contato(f.pos, h.pos))).length;
  const comLos = foes.filter((f) => herois.some((h) => field.hasLineOfSight(f.pos, h.pos))).length;
  const minDist = Math.min(...foes.flatMap((f) => herois.map((h) => B.distanceFt(f.pos, h.pos))));
  const heroisVistosPorFoe = herois.filter((h) => foes.some((f) => field.hasLineOfSight(f.pos, h.pos))).length;
  const heroisQueVeem = herois.filter((h) => foes.some((f) => field.hasLineOfSight(h.pos, f.pos))).length;
  return { n: foes.length, vistos, contato, comLos, minDist, heroisVistosPorFoe, heroisQueVeem };
}
