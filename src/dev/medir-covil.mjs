// O COVIL DO ESCONDERIJO (área 6) COM QUATRO GOBLINS OU COM OS CINCO DO LIVRO. Rode com:
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/medir-covil.mjs [amostra] [nível] [--livro]
//
// O livro põe CINCO goblins comuns em volta do fogo, mais Yeemik em cima do ressalto. A nossa cena põe
// QUATRO, e o comentário de `foesEsconderijo` justificava com dois números — 900 de XP ajustado, "mortal", e
// 18% de derrota com cinco contra 95,5% de vitória com quatro — medidos na PLANTA ANTERIOR, de 40×28, que foi
// aposentada quando o esconderijo passou para o battlemap da FA. Planta nova, números velhos: não valiam mais.
//
// Aqui a luta roda no mapa de hoje, com as casas de hoje (`buildFoes('esconderijo')`, grupo `covil`), nas duas
// formas e com as mesmas sementes. `--livro` acrescenta o quinto goblin, junto ao fogo, na única casa livre
// que sobra em volta da fogueira de cozinha.
//
// O Sildar entra como está na cena: amarrado, 1 PV, lado neutro. Ele não luta, mas pode morrer no fogo
// cruzado — e isso conta, porque perdê-lo é perder o capítulo.
import { makeRng } from '../core/rng.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { makeMonster } from '../rules/monsters.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { hasCondition } from '../rules/conditions.js';
import { montarCampo } from '../game/campo.js';
import { mapaDo, buildFoes } from '../game/encounter.js';
import { PONTOS_DO_ESCONDERIJO as PE } from '../game/esconderijo.js';
import { playCharacter } from './balance.js';

const N = Number(process.argv.filter((a) => /^\d+$/.test(a))[0] ?? 300);
const NIVEL = Number(process.argv.filter((a) => /^\d+$/.test(a))[1] ?? 2);
const LIVRO = process.argv.includes('--livro');
// `--obelisco`: o covil do Phandelver and Below — cinco goblins e DOIS chefes goblin, o Yeemik com o bloco cheio
// (21 PV, e não os 12 da Mina) e o Errk, que a Mina não tinha. Ver revisoes/obelisco-de-para-2026-11-08.md.
const OBELISCO = process.argv.includes('--obelisco');

// O grupo chega pela entrada leste do covil, que é por onde o livro o faz chegar.
const CHEGADA = [{ x: 8, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 6 }, { x: 9, y: 6 }];
const QUINTO = { x: 3, y: 7 };        // a casa livre que sobra junto da fogueira de (3,6)

function uma(semente) {
  const mapa = mapaDo('esconderijo');
  const rng = makeRng(semente);
  const field = montarCampo(mapa);
  const party = makeParty({ nivel: NIVEL });
  party.forEach((c, i) => { c.pos = { ...CHEGADA[i] }; });

  const todos = buildFoes('esconderijo');
  const foes = todos.filter((f) => f.grupo === 'covil' && f.side === 'foes');
  if (LIVRO || OBELISCO) {
    const quinto = makeMonster('goblin', { ...QUINTO }, { nameSuffix: 'do covil' });
    quinto.pos = { ...QUINTO };
    quinto.grupo = 'covil';
    foes.push(quinto);
  }
  if (OBELISCO) {
    const yeemik = foes.find((f) => f.defId === 'yeemik');
    if (yeemik) { yeemik.maxHp = 21; yeemik.hp = 21; }
    // O Errk fica em cima, com o Yeemik: a primeira casa livre ao lado dele.
    const tomada = (x, y) => foes.some((f) => f.pos.x === x && f.pos.y === y) || field.blocksMove(x, y);
    const perto = [[1, 0], [-1, 0], [0, 1], [1, 1], [-1, 1], [0, -1]].map(([dx, dy]) => ({ x: yeemik.pos.x + dx, y: yeemik.pos.y + dy }))
      .find((q) => !tomada(q.x, q.y) && !(q.x === 4 && q.y === 10));
    const errk = makeMonster('goblinChefe', { ...perto });
    errk.name = 'Errk';
    errk.grupo = 'covil';
    foes.push(errk);
  }
  const sildar = todos.find((f) => f.grupo === 'covil' && f.side === 'neutro');

  const enc = new Encounter({ battlefield: field, party, foes, rng, reinforcements: () => null });
  if (sildar) enc.addCombatant(sildar);
  const hpTotal = party.reduce((s, c) => s + c.maxHp, 0);
  enc.start();

  let guarda = 1200;
  while (!enc.over && guarda-- > 0) {
    const lado = enc.side;
    const vez = enc.allOf(lado).filter((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente'));
    if (!vez.length) { enc.maybeEndSide(); continue; }
    if (lado === 'party') playCharacter(enc, vez[0]); else takeMonsterTurn(enc, vez[0]);
    if (enc.round > 40) break;
  }
  const pcs = enc.combatants.filter((c) => c.side === 'party');
  return {
    venceu: foes.every((f) => f.dead || f.fugiu),
    rodadas: enc.round,
    caidos: pcs.filter((c) => c.hp <= 0).length,
    mortos: pcs.filter((c) => c.dead).length,
    sildarMorto: Boolean(sildar?.dead),
    hpPct: Math.round((pcs.reduce((s, c) => s + Math.max(0, c.hp), 0) / hpTotal) * 100),
  };
}

const lutas = Array.from({ length: N }, (_, i) => uma(0x51b0 + i * 7919));
const pct = (f) => Math.round((lutas.filter(f).length / N) * 100);
const media = (f) => +(lutas.reduce((s, d) => s + f(d), 0) / N).toFixed(2);

console.log({
  bando: LIVRO ? 'o do LIVRO: 5 goblins + Yeemik' : 'o da cena (o Obelisco): 5 goblins, Yeemik e Errk',
  amostra: N,
  nivel: NIVEL,
  vitorias: `${pct((d) => d.venceu)}%`,
  derrotas: `${100 - pct((d) => d.venceu)}%`,
  comAlgumaMorte: `${pct((d) => d.mortos > 0)}%`,
  comAlguemCaido: `${pct((d) => d.caidos > 0)}%`,
  sildarMorto: `${pct((d) => d.sildarMorto)}%`,
  rodadasMedia: media((d) => d.rodadas),
  hpRestanteMedio: `${media((d) => d.hpPct)}%`,
});
