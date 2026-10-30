// Refaz a tabela VIRADA de `rules/encontros-estrada.js`: onde cada linha da
// tabela da Trilha Triboar deixa de ser fácil e onde passa a ser mortal, para
// cada nível de grupo. Rode com:
//
//   node src/dev/estrada-virada.mjs [lutas por célula, padrão 100]
//
// Imprime as taxas de derrota por quantidade e, no fim, a tabela pronta para
// colar. Cem lutas por célula levam cerca de meia hora.
//
// POR QUE ISTO EXISTE: o perigo de um bando não sai do XP dele. Um lobo e um
// goblin valem os mesmos 50 XP e não dão a mesma luta, e a força do grupo dá
// saltos (Ataque Extra, 3º círculo) que fórmula nenhuma acompanha. Então o
// rótulo que o jogo mostra ao jogador vem de medição, e esta é a medição.
// Mexer em bloco de estatística, no mapa da estrada ou na IA desatualiza a
// tabela: rode isto de novo e troque os números lá.
//
// A CENA AQUI É UMA RÉPLICA de `game/capitulo4-estrada.js`, que não carrega em
// Node porque importa CSS e imagens. Posições do grupo e do bando, levas na
// terceira rodada, vigia e surpresa da noite: se a cena mudar, isto tem de
// mudar junto, senão a medição passa a medir outra luta.

import { makeRng } from '../core/rng.js';
import { Battlefield, distanceFt } from '../core/grid.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { makeMonster } from '../rules/monsters.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { hasCondition } from '../rules/conditions.js';
import { playCharacter } from './balance.js';
import { mapaDo } from '../game/encounter.js';
import { prepararLevas } from '../game/levas.js';
import { ENCONTROS } from '../rules/encontros-estrada.js';
import { skillBonus } from '../rules/abilities.js';
import { d20 } from '../core/dice.js';

// A coluna do grupo e a do bando, como em `capitulo4-estrada.js`.
const COLUNA_DO_GRUPO = 4;

/** Uma luta na cena da estrada. Devolve se o grupo venceu e o quanto custou. */
function lutar({ id, qtd, nivel, noite = false, distFt = 40, seed }) {
  const rng = makeRng(seed);
  const mapa = mapaDo(noite ? 'ermoNoite' : 'ermo');
  const field = new Battlefield(
    mapa.terreno[0].length, mapa.terreno.length, mapa.terreno, mapa.altura, mapa.objetos, mapa.paredes,
  );
  // A LUZ TEM DE SER PREENCHIDA, e não só alocada. O `main.js` copia os
  // dígitos do mapa para a grade; alocar o `Uint8Array` e parar aí deixa toda
  // casa em 0, que é BREU — e aí quem tem visão no escuro ganha vantagem por
  // atacante oculto e quem não tem fica cego. A medição passa a ser de outra
  // luta.
  //
  // Isto não mexe na tabela VIRADA: ela foi medida só de dia, e o mapa diurno
  // da estrada não traz grade de luz, então o `if` nunca disparava. Mas uma
  // medição noturna daqui sairia errada, e foi assim que os números da fase de
  // Árvore Trovão saíram errados.
  if (mapa.luz) {
    field.luz = new Uint8Array(field.w * field.h);
    if (Array.isArray(mapa.luz)) {
      mapa.luz.forEach((linha, y) => {
        for (let x = 0; x < field.w; x += 1) field.luz[y * field.w + x] = Number(linha[x] ?? 0);
      });
    }
    field.luzes = (mapa.luzes ?? []).map((f) => ({ ...f }));
  }
  const herois = makeParty({ nivel });
  herois.forEach((c, i) => { c.pos = { ...mapa.grupo[i] }; c.facingVec = { ...mapa.olhar }; });
  const enc = new Encounter({ battlefield: field, party: herois, foes: [], rng, reinforcements: () => null });

  const col = Math.max(COLUNA_DO_GRUPO + 2, Math.min(21, COLUNA_DO_GRUPO + Math.round(distFt / 5)));
  const tomadas = new Set();
  const lugares = (n, segunda = false) => {
    const fora = [];
    for (let i = 0; i < n; i += 1) {
      let p;
      if (noite) {
        const a = (i / n) * Math.PI * 2 + (segunda ? 0.4 + Math.PI / n : 0.4);
        p = { x: Math.round(11 + Math.cos(a) * 10), y: Math.round(7 + Math.sin(a) * 6.2) };
      } else if ((i + (segunda ? 1 : 0)) % 2 === 0) {
        p = { x: segunda ? 21 - (i % 2) : col + (i % 3), y: 3 + Math.floor(i / 6) * 2 + (i % 2) };
      } else {
        p = { x: segunda ? 20 - (i % 2) : col + 1 + (i % 3), y: 11 + (Math.floor(i / 2) % 3) };
      }
      p.x = Math.max(1, Math.min(21, p.x));
      p.y = Math.max(0, Math.min(13, p.y));
      let q = enc.casaLivreMaisProxima(p) ?? p;
      for (let r = 1; tomadas.has(`${q.x},${q.y}`) && r < 6; r += 1) {
        q = enc.casaLivreMaisProxima({ x: p.x - r, y: p.y }) ?? q;
      }
      tomadas.add(`${q.x},${q.y}`);
      fora.push(q);
    }
    return fora;
  };
  // Bando de seis ou mais chega em duas levas, como na cena.
  const primeira = qtd >= 6 ? Math.ceil(qtd / 2) : qtd;
  const posicoes = [...lugares(primeira), ...lugares(qtd - primeira, true)];
  const inimigos = posicoes.map((p, i) => {
    const f = makeMonster(id, { x: p.x, y: p.y }, { nameSuffix: qtd > 1 ? 'ABCDEFGHIJKL'[i] ?? '' : '' });
    f.facingVec = { dx: Math.sign(11 - p.x) || -1, dy: Math.sign(7 - p.y) };
    return f;
  });
  if (!noite) {
    const fila = [
      { x: COLUNA_DO_GRUPO, y: 6 }, { x: COLUNA_DO_GRUPO + 1, y: 7 },
      { x: COLUNA_DO_GRUPO - 1, y: 7 }, { x: COLUNA_DO_GRUPO + 2, y: 6 },
    ];
    enc.allOf('party').forEach((c, i) => {
      const q = enc.casaLivreMaisProxima(fila[i] ?? fila[fila.length - 1]);
      if (q) c.pos = { ...c.pos, ...q };
    });
  }
  for (const f of inimigos.slice(0, primeira)) enc.addCombatant(f);
  prepararLevas(enc, [{ rodada: 3, units: inimigos.slice(primeira), aviso: 'x' }]);
  if (noite) {
    const furt = inimigos.slice(0, primeira).map((f) => d20(rng, skillBonus(f, 'furtividade')).total);
    enc.emboscada = { emboscadores: 'foes', furtividade: furt };
    enc.dormindo = () => true;
  } else {
    enc.emboscada = null;
  }

  const pvTotal = herois.reduce((s, c) => s + c.maxHp, 0);
  enc.start();
  let guarda = 2000;
  while (!enc.over && guarda > 0) {
    guarda -= 1;
    const lado = enc.side;
    const vez = enc.allOf(lado).filter((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente'));
    if (!vez.length) { enc.maybeEndSide(); continue; }
    if (lado === 'party') playCharacter(enc, vez[0]); else takeMonsterTurn(enc, vez[0]);
    if (enc.round > 40) break;
  }
  const pcs = enc.combatants.filter((c) => c.side === 'party');
  return {
    venceu: enc.outcome === 'vitoria',
    mortos: pcs.filter((c) => c.dead).length,
    perdaPct: 100 - Math.round(100 * pcs.reduce((s, c) => s + Math.max(0, c.hp), 0) / pvTotal),
    distReal: Math.min(...pcs.flatMap((h) => inimigos.slice(0, primeira).map((f) => distanceFt(h.pos, f.pos)))),
  };
}

// Os cortes: fácil é menos de 5% de derrota, difícil é menos de 20%. Derrota na
// estrada encerra a partida, e um encontro imprevisto não deve carregar mais de
// uma chance em vinte de acabar com o jogo e ainda se chamar fácil.
const FACIL = 5;
const DIFICIL = 20;
const NIVEIS = [2, 3, 4, 5];
// As quantidades que o jogo pode produzir: da menor rolagem da tabela ao teto
// da cena. Ogro e urso-coruja vêm sozinhos e nunca passam de poucos.
const FAIXA = {
  stirge: [3, 12], ghoul: [2, 10], ogro: [1, 3], goblin: [4, 12],
  hobgoblin: [3, 12], orc: [3, 12], lobo: [3, 12], corujaUrso: [1, 3],
};

// Filtro, para conferir UMA linha sem pagar a tabela inteira:
//
//   node src/dev/estrada-virada.mjs 100 --id=orc
//   node src/dev/estrada-virada.mjs 100 --id=orc --nivel=5
//
// A saída avisa quando o filtro está ligado, porque o bloco pronto para colar
// sai PARCIAL: colar ele inteiro apagaria as espécies que não rodaram.
const args = process.argv.slice(2);
const N = Number(args.find((a) => /^\d+$/.test(a)) ?? 100);
const soId = (args.find((a) => a.startsWith('--id=')) ?? '').slice(5) || null;
const soNivel = Number((args.find((a) => a.startsWith('--nivel=')) ?? '').slice(8)) || null;
if (soId && !ENCONTROS.some((e) => e.id === soId)) {
  console.error(`nao existe encontro com id "${soId}". Tem: ${ENCONTROS.map((e) => e.id).join(', ')}`);
  process.exit(1);
}
const porId = {};
console.log(`### virada de perigo, ${N} lutas por célula`);
console.log(`especie      nivel | derrota% por quantidade${' '.repeat(37)}| facil até | difícil até`);
for (const e of ENCONTROS) {
  if (soId && e.id !== soId) continue;
  const [lo, hi] = FAIXA[e.id] ?? [1, 12];
  for (const nivel of NIVEIS) {
    if (soNivel && nivel !== soNivel) continue;
    let semente = 20261026 + nivel * 1000 + e.id.length * 77;
    let facilAte = lo - 1;
    let dificilAte = lo - 1;
    const mostra = [];
    for (let q = lo; q <= hi; q += 1) {
      const rs = [];
      for (let i = 0; i < N; i += 1) {
        semente += 1;
        rs.push(lutar({ id: e.id, qtd: q, nivel, distFt: 20 + 10 * (i % 11), seed: semente }));
      }
      const d = 100 * rs.filter((r) => !r.venceu).length / rs.length;
      mostra.push(`${q}:${d.toFixed(0)}`);
      if (d < FACIL && facilAte === q - 1) facilAte = q;
      if (d < DIFICIL && dificilAte === q - 1) dificilAte = q;
      if (d >= DIFICIL * 2) break;      // passou de mortal com folga
    }
    console.log(`${e.id.padEnd(12)} ${nivel}    | ${mostra.join(' ').padEnd(60)}| ${String(facilAte).padStart(9)} | ${String(dificilAte).padStart(11)}`);
    (porId[e.id] ??= {})[nivel] = [facilAte, dificilAte];
  }
}

const parcial = Boolean(soId || soNivel);
console.log(parcial
  ? '\n// --- PARCIAL: so as celulas medidas. Troque linha por linha. ---'
  : '\n// --- para colar em rules/encontros-estrada.js ---');
if (!parcial) console.log('export const VIRADA = {');
for (const [id, porNivel] of Object.entries(porId)) {
  console.log(`  ${id}: { ${Object.entries(porNivel).map(([n, par]) => `${n}: [${par.join(', ')}]`).join(', ')} },`);
}
if (!parcial) console.log('};');
