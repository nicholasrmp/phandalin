// Simula, em Node, a EMBOSCADA DOS GOBLINS contra o grupo pronto de 1º nível: vitórias, quem cai, PV que sobra
// e rodadas. A política é a de `balance.js` (competente, sem fugir), que serve de piso, não de teto.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/simular-emboscada.mjs [amostra] [--livro]
//
// Existe porque o `balance.js` só roda o mapa padrão, e a emboscada tem mapa, posições, surpresa e reforços
// próprios: mudar qualquer um deles sem remedir é chutar. Os números citados nos comentários de
// `game/encounter.js` saem daqui, com estas sementes.
//
// DESDE 2026-11-08 a cena É o livro (4 goblins, sem lobo), e as duas colunas dão o mesmo número. A bandeira fica
// para a próxima vez que a cena se afastar dele.
//
// `--livro` troca o nosso bando pelo DO LIVRO: QUATRO goblins na moita e nenhum lobo de reforço. A nossa cena
// põe três goblins e manda dois lobos na rodada 2 — mesmo orçamento de XP, forma diferente —, e a pergunta
// "isso ficou mais fácil ou mais difícil que o livro?" não tinha resposta no mapa de hoje: os números que o
// comentário citava (9,9% e 2,8% de derrota) eram da planta anterior, e o próprio comentário avisava. Com a
// bandeira as duas colunas saem das MESMAS sementes, e só o bando muda.
import { makeRng } from '../core/rng.js';
import { Battlefield } from '../core/grid.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { hasCondition } from '../rules/conditions.js';
import { mapaDo, buildFoes, reinforcementsFor } from '../game/encounter.js';
import { makeMonster } from '../rules/monsters.js';
import { playCharacter } from './balance.js';

const N = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 400);
const LIVRO = process.argv.includes('--livro');
const m = mapaDo('emboscada');

/** O bando do livro: quatro goblins de arco na moita, dois de cada lado, e reforço nenhum. */
function bandoDoLivro() {
  const arco = { arma: 'Arco curto' };
  const onde = [[15, 6, 'A', 1], [18, 6, 'B', 1], [16, 11, 'C', -1], [19, 11, 'D', -1]];
  return onde.map(([x, y, sufixo, dy]) => {
    const f = makeMonster('goblin', { x, y }, { nameSuffix: sufixo, ...arco, ...(sufixo === 'A' || sufixo === 'C' ? { tatica: 'atirador' } : {}) });
    f.facingVec = { dx: 0, dy };
    return f;
  });
}

function uma(semente) {
  const rng = makeRng(semente);
  const field = new Battlefield(m.terreno[0].length, m.terreno.length, m.terreno, m.altura, m.objetos);
  const party = makeParty();
  party.forEach((c, i) => { c.pos = { ...m.grupo[i] }; });
  const enc = new Encounter({
    battlefield: field,
    party,
    foes: LIVRO ? bandoDoLivro() : buildFoes('emboscada'),
    rng,
    reinforcements: (rodada) => (LIVRO ? null : reinforcementsFor(rodada, 'emboscada')),
    emboscada: m.emboscada,
  });
  const hpTotal = party.reduce((s, c) => s + c.maxHp, 0);
  enc.start();

  let guarda = 2000;
  while (!enc.over && guarda-- > 0) {
    const lado = enc.side;
    const fila = enc.allOf(lado).filter((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente'));
    if (fila.length === 0) { enc.maybeEndSide(); continue; }
    if (lado === 'party') playCharacter(enc, fila[0]);
    else takeMonsterTurn(enc, fila[0]);
    if (enc.round > 40) break;
  }

  // `caidos` é quem está com 0 PV NO FIM, que é a mesma conta do `balance.js`: compara-se laranja com laranja.
  const pcs = enc.combatants.filter((c) => c.side === 'party');
  return {
    venceu: enc.outcome === 'vitoria',
    travou: guarda <= 0 || enc.round > 40,
    rodadas: enc.round,
    caidos: pcs.filter((c) => c.hp <= 0).length,
    mortos: pcs.filter((c) => c.dead).length,
    hpPct: Math.round((pcs.reduce((s, c) => s + Math.max(0, c.hp), 0) / hpTotal) * 100),
  };
}

const lutas = [];
for (let i = 0; i < N; i++) lutas.push(uma(0x51b0 + i * 7919));
const pct = (f) => Math.round((lutas.filter(f).length / N) * 100);
const media = (f) => +(lutas.reduce((s, d) => s + f(d), 0) / N).toFixed(2);

console.log({
  bando: LIVRO ? 'o do LIVRO: 4 goblins, sem lobos' : 'o da cena: 4 goblins, como o livro (desde o Obelisco, 2026-11-08)',
  amostra: N,
  vitorias: `${pct((d) => d.venceu)}%`,
  travou: `${pct((d) => d.travou)}%`,
  comAlgumaMorte: `${pct((d) => d.mortos > 0)}%`,
  comAlguemCaido: `${pct((d) => d.caidos > 0)}%`,
  duasQuedasOuMais: `${pct((d) => d.caidos >= 2)}%`,
  rodadasMedia: media((d) => d.rodadas),
  hpRestanteMedio: `${media((d) => d.hpPct)}%`,
});
