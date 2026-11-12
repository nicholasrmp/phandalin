// OS REFÉNS DO OBELISCO (capítulo 8): os oito de Phandalin que os fanáticos levaram para o Vazio — quatro colados na
// Cúpula de Cristal e quatro trancados na base da Estátua Tombada. O livro deixa o grupo escolher: eles aceitam esperar
// na ilha, ou vêm junto. Quem vem junto atravessa tudo com o grupo — as ilhas, a Poça de volta (seis milhas, com o verme)
// e o labirinto —, e é a eles que a Refração de Ilvaash mira, para desesperar quem os protege. Na volta a Phandalin, o
// grupo é saudado em dobro por quem trouxe (`obelisco7-vila.js epilogo`).
//
// No motor, cada refém é um PLEBEU de 4 PV do lado do grupo, que age sozinho (a marca `invocado` com `auto`, a mesma dos
// flumphs) e que NÃO LUTA (`naoCombatente`, `ai.js`): no turno dele, foge de quem ameaça e se esquiva. Ele não segura a
// luta de pé, não ganha XP e não vai embora no fim da luta (`ficaAposALuta`). Explorando, segue o grupo (`seguirOGrupo`).
// Quem morre fica morto. E quem ficou esperando numa ilha fica no Reino Distante quando o portal de Illithinoch fecha
// (decisão nossa: o livro diz que esperam, e que o portal fecha; quem não volta pela Poça não volta).
//
// O estado mora em `app.campanha.obelisco8.refens`.
import { makeMonster } from '../rules/monsters.js';

export const REFENS = {
  cupula: ['Thawnia Browne', 'Shansa', 'Wramble', 'Unmiel'],
  estatua: ['Hovnar Tartesh', 'Menvin Tartesh', 'Nalpina Goldstone', 'Mildra Merkel'],
};

/** O estado: quem vem com o grupo (nome → PV), quem espera em cada ilha, quem morreu. */
export function estadoDosRefens(camp) {
  const o8 = (camp.obelisco8 ??= { feito: {} });
  const r = (o8.refens ??= { comGrupo: {}, esperando: {}, mortos: [] });
  r.comGrupo ??= {};
  r.esperando ??= {};
  r.mortos ??= [];
  return r;
}

/** Soltos na ilha: ficam esperando lá (o padrão do livro). */
export function esperarNaIlha(camp, ilha) {
  const r = estadoDosRefens(camp);
  const nomes = REFENS[ilha].filter((n) => !r.mortos.includes(n) && !(n in r.comGrupo));
  r.esperando[ilha] = nomes;
  return nomes;
}

/** Os que esperavam na ilha vêm com o grupo. Devolve os nomes. */
export function juntarAoGrupo(camp, ilha) {
  const r = estadoDosRefens(camp);
  const nomes = (r.esperando[ilha] ?? REFENS[ilha]).filter((n) => !r.mortos.includes(n));
  for (const n of nomes) r.comGrupo[n] ??= 4;
  delete r.esperando[ilha];
  return nomes;
}

export const refensComOGrupo = (camp) => Object.keys(estadoDosRefens(camp).comGrupo);
export const ehRefem = (c) => Boolean(c?.refemDoObelisco);

/**
 * Põe no tabuleiro os reféns que vêm com o grupo, junto do primeiro herói. Devolve as criaturas. Quem já está no
 * tabuleiro (pelo nome) não nasce de novo.
 */
export function montarRefens(enc, camp, herois) {
  const r = estadoDosRefens(camp);
  const dono = herois[0];
  if (!dono) return [];
  const out = [];
  for (const [nome, pv] of Object.entries(r.comGrupo)) {
    let m = enc.combatants.find((c) => c.refemDoObelisco && c.name === nome && !c.dead);
    if (!m) {
      m = makeMonster('plebeu', { ...dono.pos });
      const q = enc.casaLivreMaisProxima(dono.pos);
      if (!q) continue;
      m.pos = { x: q.x, y: q.y, f: m.pos.f };
      m.name = nome;
      m.hp = Math.max(1, Math.min(pv, m.maxHp));
      m.side = 'party';
      m.xp = 0;
      m.className = 'Refém';
      m.refemDoObelisco = true;
      m.naoCombatente = true;
      m.invocado = { donoId: dono.id, spellId: 'refemDoObelisco', auto: true, ficaAposALuta: true };
      enc.addCombatant(m);
    }
    out.push(m);
  }
  return out;
}

/** Explorando, os reféns andam atrás de quem se moveu. */
export function seguirOGrupo(enc, lider) {
  if (!lider?.pos || ehRefem(lider)) return;
  for (const m of enc.combatants.filter((c) => c.refemDoObelisco && !c.dead)) {
    if (Math.max(Math.abs(m.pos.x - lider.pos.x), Math.abs(m.pos.y - lider.pos.y)) <= 2) continue;
    const q = enc.casaLivreMaisProxima(lider.pos);
    if (q) m.pos = { ...m.pos, x: q.x, y: q.y };
  }
}

/** Guarda os PV de quem está no tabuleiro e marca os mortos (chamado a cada evento de dano e no fim da cena). */
export function guardarRefens(enc, camp) {
  const r = estadoDosRefens(camp);
  for (const m of enc.combatants.filter((c) => c.refemDoObelisco)) {
    if (!(m.name in r.comGrupo)) continue;
    if (m.dead || m.hp <= 0) {
      delete r.comGrupo[m.name];
      if (!r.mortos.includes(m.name)) r.mortos.push(m.name);
      m.dead = true;
    } else r.comGrupo[m.name] = m.hp;
  }
}

/** O evento da cena: o refém que cai morre (plebeu não faz teste contra a morte). */
export function eventoDosRefens(enc, camp, ev) {
  const m = ev?.target;
  if (!m?.refemDoObelisco) return;
  if ((ev.type === 'died' || ev.type === 'downed' || ev.type === 'damage') && (m.dead || m.hp <= 0)) {
    if (!m.dead) { m.dead = true; enc.say?.('acao', `${m.name} cai e não se levanta mais.`); }
    guardarRefens(enc, camp);
  }
}

/** O que se conta na volta: quantos voltaram, quantos morreram, quantos ficaram esperando no Vazio. */
export function contaDosRefens(camp) {
  const r = estadoDosRefens(camp);
  const ficaram = Object.values(r.esperando).flat();
  return { voltaram: Object.keys(r.comGrupo), mortos: [...r.mortos], ficaram };
}
