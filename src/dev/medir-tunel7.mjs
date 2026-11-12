// A VIAGEM INTEIRA DO TÚNEL DO CAPÍTULO 7 (o Obelisco), medida: o MESMO grupo desce os quatro trechos, com a vida, os
// espaços de magia e os recursos acumulando de uma luta para a outra, enfrentando os encontros da tabela do livro (um d20
// por hora, 14 horas) e as salas chaveadas (J3, J6, J7, J9, J10). Entre as cavernas, um descanso curto ou nenhum.
//
// As lutas são em campo aberto (as salas de verdade têm teto baixo, abismo e lama): serve para saber se a viagem SE FAZ,
// e quantas lutas ela pede, não o detalhe de cada sala.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/medir-tunel7.mjs [viagens] [nivel]

import { makeRng } from '../core/rng.js';
import { Battlefield } from '../core/grid.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { makeMonster } from '../rules/monsters.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { hasCondition, removeCondition } from '../rules/conditions.js';
import { playCharacter } from './balance.js';
import { rolarViagem, TRECHOS } from '../game/tunel-cap7.js';

const N = Number(process.argv[2] ?? 40);
const NIVEL = Number(process.argv[3] ?? 9);
const W = 18;
const H = 14;
const MAPA = Array.from({ length: H }, () => '.'.repeat(W));

/** As salas chaveadas de cada caverna, na ordem em que o grupo passa por elas (o behir foge; o grupo luta com ele). */
const SALAS = {
  tunelGrells: [['grell', 'grell', 'grell', 'grell']],
  tunelBehir: [['behir'], ['grellPsiquico', 'grell', 'grell']],
  tunelGruta: [['bocaTagarela', 'bocaTagarela', 'bocaTagarela', 'bocaTagarela', 'bocaTagarela', 'bocaTagarela'], ['capaNegraMutante']],
};

export function luta(party, elenco, rng) {
  party.forEach((c, i) => { c.pos = { x: 2, y: 3 + i * 2 }; });
  const foes = elenco.map((id, i) => makeMonster(id, { x: 11 + (i % 3) * 2, y: 1 + (Math.floor(i / 3) * 3) % 11 }));
  for (const f of foes) if (f.defId === 'behir') f.vulnerable = [...(f.vulnerable ?? []), 'psíquico'];
  // a capa mutante da sala J10 testa Sabedoria CD 12 no começo do turno, e perde o turno quando falha (`tunel-cap7.js`)
  for (const f of foes) if (f.defId === 'capaNegraMutante') f.testeNoInicio = { save: 'wis', dc: 12 };
  const enc = new Encounter({ battlefield: new Battlefield(W, H, MAPA), party, foes, rng, onEvent: (ev) => {
    const b = ev.target;
    if (ev.type === 'damage' && b?.defId === 'behir' && !b.dead && b.hp < 50 && !b.fugiu) {
      b.fugiu = true; enc.combatants.splice(enc.combatants.indexOf(b), 1); enc.checkEnd();
    }
  } });
  enc.start();
  let guarda = 1500;
  while (!enc.over && guarda-- > 0) {
    const pend = enc.allOf(enc.side).filter((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente'));
    if (!pend.length) { enc.maybeEndSide(); continue; }
    if (enc.side === 'party') playCharacter(enc, pend[0]); else takeMonsterTurn(enc, pend[0]);
    if (enc.round > 40) break;
  }
  // depois da luta: quem caiu e não morreu levanta com 1 PV (o grupo o estabiliza e espera)
  for (const c of party) {
    if (c.dead) continue;
    c.conditions = (c.conditions ?? []).filter((k) => ['exausto'].includes(k.id));
    if (c.hp <= 0) c.hp = 1;
    c.concentrating = null;
  }
  return enc.outcome === 'vitoria';
}

/**
 * A CURA ENTRE AS LUTAS, que o simulador do grupo não faz sozinho: o clérigo gasta os espaços que sobraram em Curar
 * Ferimentos (1d8 por círculo + Sabedoria, na média) no mais ferido, até todos passarem de 3/4 da vida. Guarda o espaço
 * mais alto, que é o da luta seguinte.
 */
function curarEntreLutas(party) {
  const clerigo = party.find((c) => !c.dead && c.hp > 0 && c.classe === 'clerigo' && c.spellcasting?.slots);
  if (!clerigo) return;
  const slots = clerigo.spellcasting.slots;
  const mod = Math.floor(((clerigo.abilities?.wis ?? 10) - 10) / 2);
  const maior = slots.reduce((m, n, i) => (n > 0 ? i : m), 0);
  for (let guarda = 0; guarda < 20; guarda++) {
    const ferido = party.filter((c) => !c.dead && c.hp < c.maxHp * 0.75).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (!ferido) return;
    const L = slots.findIndex((n, i) => i >= 1 && n > 0 && !(i === maior && slots[i] === 1));
    if (L < 1) return;
    slots[L] -= 1;
    ferido.hp = Math.min(ferido.maxHp, ferido.hp + Math.round(4.5 * L) + mod);
  }
}

function viagem(semente, descansoCurto, descansoLongo = false) {
  const rng = makeRng(semente);
  const party = makeParty({ nivel: NIVEL });
  let lutas = 0;
  for (const trecho of ['vila', 'tunelGrells', 'tunelBehir', 'tunelGruta']) {
    // os encontros das horas do trecho
    for (const e of rolarViagem(rng, TRECHOS[trecho].horas)) {
      lutas += 1;
      if (!luta(party, e.elenco, rng)) return { venceu: false, lutas, onde: e.nome };
      curarEntreLutas(party);
    }
    const proxima = TRECHOS[trecho].proxima;
    for (const elenco of SALAS[proxima] ?? []) {
      lutas += 1;
      if (!luta(party, elenco, rng)) return { venceu: false, lutas, onde: elenco[0] };
      curarEntreLutas(party);
    }
    // o descanso curto entre uma caverna e a outra: metade dos dados de vida, na média (os conjuradores não recuperam espaço)
    if (descansoCurto) for (const c of party) if (!c.dead) c.hp = Math.min(c.maxHp, c.hp + Math.floor(c.maxHp / 4));
    // o DESCANSO LONGO no meio do caminho: oito horas na toca do behir, depois de limpá-la (vida, espaços e recursos)
    if (descansoLongo === 'todas' ? Boolean(SALAS[proxima]) : descansoLongo && proxima === 'tunelBehir') {
      const novo = makeParty({ nivel: NIVEL });
      party.forEach((c, i) => {
        if (c.dead) return;
        c.hp = c.maxHp;
        if (c.spellcasting && novo[i].spellcasting) c.spellcasting.slots = [...novo[i].spellcasting.slots];
        c.resources = { ...novo[i].resources };
      });
    }
  }
  return { venceu: true, lutas, horas: 14, mortos: party.filter((c) => c.dead).length, vida: party.reduce((s, c) => s + Math.max(0, c.hp), 0) / party.reduce((s, c) => s + c.maxHp, 0) };
}

function medir(descansoCurto, descansoLongo = false) {
  const r = [];
  for (let i = 0; i < N; i++) r.push(viagem(0x7a1 + i * 7919, descansoCurto, descansoLongo));
  const pct = (f) => `${Math.round((r.filter(f).length / N) * 100)}%`;
  const onde = {};
  for (const x of r.filter((x) => !x.venceu)) onde[x.onde] = (onde[x.onde] ?? 0) + 1;
  return {
    chega: pct((x) => x.venceu), lutasMedia: +(r.reduce((s, x) => s + x.lutas, 0) / N).toFixed(1),
    comMorto: pct((x) => x.venceu && x.mortos > 0),
    vidaNaChegada: `${Math.round((r.filter((x) => x.venceu).reduce((s, x) => s + x.vida, 0) / Math.max(1, r.filter((x) => x.venceu).length)) * 100)}%`,
    caiEm: Object.entries(onde).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${v}`).join(', ') || '—',
  };
}

console.log(`${N} viagens, grupo de ${NIVEL}º nível, do porão do Gigante aos portões de Illithinoch\n`);
console.table({
  'sem descanso': medir(false),
  'descanso curto entre as cavernas': medir(true),
  'curtos, e um longo na toca do behir': medir(true, true),
  'um longo em cada caverna': medir(true, 'todas'),
});
void removeCondition;
